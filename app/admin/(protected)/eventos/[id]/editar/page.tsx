import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/EventForm";

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();

  const [{ data: event }, { data: churches }] = await Promise.all([
    supabase.from("events").select("*").eq("id", params.id).maybeSingle(),
    supabase.from("churches").select("id, name, slug, color").order("name"),
  ]);

  if (!event) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Editar evento</h1>
      <EventForm churches={churches ?? []} event={event} />
    </div>
  );
}
