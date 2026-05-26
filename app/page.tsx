import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EventWithChurch, Church } from "@/lib/types";
import { EventsExplorer } from "@/components/EventsExplorer";

// Sempre renderiza fresco (eventos mudam)
export const revalidate = 60;

export default async function HomePage() {
  const supabase = createSupabaseServerClient();

  const [{ data: events }, { data: churches }, { data: counts }] = await Promise.all([
    supabase
      .from("events")
      .select("*, church:churches(id, name, slug, color)")
      .eq("is_published", true)
      .gte("end_at", new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString())
      .order("start_at", { ascending: true })
      .limit(200),
    supabase.from("churches").select("id, name, slug, address, color").order("name"),
    supabase.from("event_attendance_counts").select("event_id, total"),
  ]);

  const countMap = new Map<string, number>(
    (counts ?? []).map((c: any) => [c.event_id, c.total]),
  );

  const eventsWithCount: EventWithChurch[] = (events ?? []).map((e: any) => ({
    ...e,
    attendance_count: countMap.get(e.id) ?? 0,
  }));

  return (
    <EventsExplorer
      events={eventsWithCount}
      churches={(churches ?? []) as Church[]}
    />
  );
}
