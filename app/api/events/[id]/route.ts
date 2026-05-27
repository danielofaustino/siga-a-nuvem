import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createGoogleEvent,
  deleteGoogleEvent,
  updateGoogleEvent,
} from "@/lib/google/calendar";

const EventSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  church_id: z.string().uuid().nullable().optional(),
  start_at: z.string(),
  end_at: z.string(),
  all_day: z.boolean().default(false),
  image_url: z.string().url().nullable().optional(),
  capacity: z.number().int().positive().nullable().optional(),
  is_published: z.boolean().default(true),
  tags: z.array(z.string().min(1).max(40)).max(20).default([]),
});

function isNotConnected(err: any) {
  return String(err?.message ?? "").includes("não conectado");
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const data = parsed.data;

  // pega o google_event_id atual
  const { data: existing } = await supabase
    .from("events")
    .select("google_event_id")
    .eq("id", params.id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Evento não encontrado" }, { status: 404 });
  }

  let googleEventId = existing.google_event_id;
  try {
    if (googleEventId) {
      await updateGoogleEvent(googleEventId, {
        title: data.title,
        description: data.description ?? null,
        location: data.location ?? null,
        startAt: data.start_at,
        endAt: data.end_at,
        allDay: data.all_day,
      });
    } else {
      // não existia no Google ainda — cria agora
      googleEventId = await createGoogleEvent({
        title: data.title,
        description: data.description ?? null,
        location: data.location ?? null,
        startAt: data.start_at,
        endAt: data.end_at,
        allDay: data.all_day,
      });
    }
  } catch (err: any) {
    if (!isNotConnected(err)) {
      return NextResponse.json(
        { error: "Falha ao sincronizar com Google: " + err.message },
        { status: 500 },
      );
    }
  }

  const { data: updated, error } = await supabase
    .from("events")
    .update({ ...data, google_event_id: googleEventId })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: existing } = await supabase
    .from("events")
    .select("google_event_id")
    .eq("id", params.id)
    .maybeSingle();

  // Best-effort: tenta remover do Google, mas nunca bloqueia a exclusão local.
  // Motivos comuns de falha: admin trocou de agenda (404), conexão Google
  // perdida, evento já apagado manualmente no Google, etc.
  let googleWarning: string | null = null;
  if (existing?.google_event_id) {
    try {
      await deleteGoogleEvent(existing.google_event_id);
    } catch (err: any) {
      googleWarning = err?.message ?? "erro desconhecido";
      console.warn(
        `[events.delete] Falha ao remover ${existing.google_event_id} do Google: ${googleWarning}`,
      );
    }
  }

  const { error } = await supabase.from("events").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, google_warning: googleWarning });
}
