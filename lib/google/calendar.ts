import { google, calendar_v3 } from "googleapis";
import { createOAuthClient } from "./oauth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

export type EventInput = {
  title: string;
  description?: string | null;
  location?: string | null;
  startAt: string; // ISO
  endAt: string;   // ISO
  allDay?: boolean;
};

/**
 * Carrega refresh token salvo (singleton) e retorna um client autenticado
 * + o calendar_id que o admin escolheu.
 * Lança erro se o admin nunca conectou a conta Google.
 */
export async function getAuthedCalendarClient() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("google_credentials")
    .select("refresh_token, calendar_id")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(
      "Google Calendar não conectado. O admin precisa conectar em /admin/google.",
    );
  }

  const oauth = createOAuthClient();
  oauth.setCredentials({ refresh_token: data.refresh_token });

  const calendar = google.calendar({ version: "v3", auth: oauth });
  return { calendar, calendarId: data.calendar_id };
}

function toGoogleEvent(input: EventInput): calendar_v3.Schema$Event {
  if (input.allDay) {
    return {
      summary: input.title,
      description: input.description ?? undefined,
      location: input.location ?? undefined,
      start: { date: input.startAt.slice(0, 10) },
      end: { date: input.endAt.slice(0, 10) },
    };
  }
  return {
    summary: input.title,
    description: input.description ?? undefined,
    location: input.location ?? undefined,
    start: { dateTime: input.startAt, timeZone: "America/Sao_Paulo" },
    end: { dateTime: input.endAt, timeZone: "America/Sao_Paulo" },
  };
}

export async function createGoogleEvent(input: EventInput): Promise<string> {
  const { calendar, calendarId } = await getAuthedCalendarClient();
  const res = await calendar.events.insert({
    calendarId,
    requestBody: toGoogleEvent(input),
  });
  if (!res.data.id) throw new Error("Google não retornou ID do evento");
  return res.data.id;
}

export async function updateGoogleEvent(eventId: string, input: EventInput) {
  const { calendar, calendarId } = await getAuthedCalendarClient();
  await calendar.events.update({
    calendarId,
    eventId,
    requestBody: toGoogleEvent(input),
  });
}

export async function deleteGoogleEvent(eventId: string) {
  const { calendar, calendarId } = await getAuthedCalendarClient();
  await calendar.events.delete({ calendarId, eventId });
}

/** Lista eventos do Calendar (usado para sync inicial / botão "puxar do Google") */
export async function listGoogleEvents(opts?: { from?: Date; to?: Date }) {
  const { calendar, calendarId } = await getAuthedCalendarClient();
  const res = await calendar.events.list({
    calendarId,
    timeMin: (opts?.from ?? new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)).toISOString(),
    timeMax: opts?.to?.toISOString(),
    maxResults: 250,
    singleEvents: true,
    orderBy: "startTime",
  });
  return res.data.items ?? [];
}
