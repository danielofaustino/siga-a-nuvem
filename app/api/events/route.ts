import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createGoogleEvent } from "@/lib/google/calendar";

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

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = EventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const data = parsed.data;

  // 1. cria no Google primeiro (se conectado) — assim, se o google falhar
  // não criamos órfão no banco. Se ninguém conectou, segue sem sync.
  let googleEventId: string | null = null;
  try {
    googleEventId = await createGoogleEvent({
      title: data.title,
      description: data.description ?? null,
      location: data.location ?? null,
      startAt: data.start_at,
      endAt: data.end_at,
      allDay: data.all_day,
    });
  } catch (err: any) {
    // Se for "não conectado", segue sem google. Se for erro real, propaga.
    if (!String(err.message ?? "").includes("não conectado")) {
      return NextResponse.json(
        { error: "Falha ao sincronizar com Google: " + err.message },
        { status: 500 },
      );
    }
  }

  const { data: inserted, error } = await supabase
    .from("events")
    .insert({ ...data, google_event_id: googleEventId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event: inserted });
}
