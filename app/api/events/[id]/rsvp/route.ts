import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

const RsvpSchema = z.object({
  name: z.string().min(2).max(120),
  whatsapp: z.string().min(8).max(40),
  instagram: z.string().max(80).optional().nullable(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const body = await req.json();
  const parsed = RsvpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 },
    );
  }

  // usa o admin client (service role) para garantir insert mesmo com RLS restrita
  const supabase = createSupabaseAdminClient();

  // valida que o evento existe e está publicado, e checa capacidade
  const { data: ev } = await supabase
    .from("events")
    .select("id, is_published, capacity")
    .eq("id", params.id)
    .maybeSingle();

  if (!ev || !ev.is_published) {
    return NextResponse.json({ error: "Evento não disponível" }, { status: 404 });
  }

  if (ev.capacity) {
    const { count } = await supabase
      .from("attendances")
      .select("id", { count: "exact", head: true })
      .eq("event_id", ev.id);
    if ((count ?? 0) >= ev.capacity) {
      return NextResponse.json({ error: "Vagas esgotadas" }, { status: 400 });
    }
  }

  const { error } = await supabase.from("attendances").insert({
    event_id: ev.id,
    name: parsed.data.name.trim(),
    whatsapp: parsed.data.whatsapp.trim(),
    instagram: parsed.data.instagram?.trim() || null,
  });

  if (error) {
    if (error.code === "23505") {
      // unique (event_id, whatsapp)
      return NextResponse.json(
        { error: "Esse WhatsApp já está confirmado neste evento." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
