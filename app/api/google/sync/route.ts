import { NextResponse } from "next/server";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
} from "@/lib/supabase/server";
import { listGoogleEvents } from "@/lib/google/calendar";

/**
 * Puxa eventos do Google Calendar e cria/atualiza no Supabase.
 * Não apaga eventos que sumiram do Google (segurança — admin pode usar UI).
 */
export async function POST() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const admin = createSupabaseAdminClient();

  const now = new Date();
  const in90 = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 90);
  const items = await listGoogleEvents({ from: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7), to: in90 });

  let imported = 0;
  let updated = 0;

  for (const g of items) {
    if (!g.id || !g.summary) continue;

    const isAllDay = !!g.start?.date;
    let startISO: string | null;
    let endISO: string | null;

    if (isAllDay) {
      // All-day no Google vem como "yyyy-MM-dd". Guardamos como meio-dia UTC
      // para preservar o "dia" em qualquer TZ ao formatar/filtrar.
      // Também: end no Google é EXCLUSIVO (-1 para virar inclusivo aqui).
      startISO = `${g.start!.date}T12:00:00.000Z`;
      const endD = new Date(`${g.end!.date}T12:00:00.000Z`);
      endD.setUTCDate(endD.getUTCDate() - 1);
      endISO = endD.toISOString();
    } else {
      startISO = g.start?.dateTime ?? null;
      endISO = g.end?.dateTime ?? null;
    }
    if (!startISO || !endISO) continue;

    // já existe?
    const { data: existing } = await admin
      .from("events")
      .select("id")
      .eq("google_event_id", g.id)
      .maybeSingle();

    const payload = {
      google_event_id: g.id,
      title: g.summary,
      description: g.description ?? null,
      location: g.location ?? null,
      start_at: startISO,
      end_at: endISO,
      all_day: isAllDay,
      is_published: true,
    };

    if (existing) {
      const { error } = await admin.from("events").update(payload).eq("id", existing.id);
      if (!error) updated++;
    } else {
      const { error } = await admin.from("events").insert(payload);
      if (!error) imported++;
    }
  }

  return NextResponse.json({ imported, updated, total: items.length });
}
