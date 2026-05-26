import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/EventForm";

export default async function NewEventPage() {
  const supabase = createSupabaseServerClient();
  const { data: churches } = await supabase
    .from("churches")
    .select("id, name, slug, color")
    .order("name");

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Novo evento</h1>
      <EventForm churches={churches ?? []} />
    </div>
  );
}
