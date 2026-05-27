import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatEventDate } from "@/lib/format";
import { RsvpForm } from "@/components/RsvpForm";
import { EventMap } from "@/components/EventMap";

export const revalidate = 30;

export default async function EventPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("*, church:churches(id, name, slug, color, address)")
    .eq("id", params.id)
    .eq("is_published", true)
    .maybeSingle();

  if (!event) notFound();

  const { data: count } = await supabase
    .from("event_attendance_counts")
    .select("total")
    .eq("event_id", event.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800">
        ← voltar
      </Link>

      <article className="card overflow-hidden">
        {event.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-56 object-cover"
          />
        )}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            {event.church && (
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: event.church.color ?? "#3b65ff" }}
              />
            )}
            <span className="text-xs text-slate-500">
              {event.church?.name ?? "Evento geral"}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">{event.title}</h1>

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.tags.map((t: string) => (
                <span
                  key={t}
                  className="text-xs uppercase tracking-wide px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="text-sm text-slate-600 space-y-1">
            <p>📅 {formatEventDate(event.start_at, event.all_day)}</p>
            {event.location && <p>📍 {event.location}</p>}
            {event.church?.address && !event.location && (
              <p>📍 {event.church.address}</p>
            )}
            {event.church?.instagram && (
              <p>
                <a
                  href={`https://instagram.com/${event.church.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-700 hover:underline"
                >
                  📷 {event.church.instagram.startsWith("@")
                    ? event.church.instagram
                    : `@${event.church.instagram}`}
                </a>
              </p>
            )}
          </div>

          {event.description && (
            <p className="text-slate-700 whitespace-pre-wrap">{event.description}</p>
          )}

          <div className="flex items-center gap-2 text-sm">
            <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 font-semibold">
              {count?.total ?? 0} pessoas confirmadas
            </span>
            {event.capacity && (
              <span className="text-slate-500">de {event.capacity} vagas</span>
            )}
          </div>
        </div>
      </article>

      {(() => {
        const address = event.location || event.church?.address;
        return address ? (
          <section className="card overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Onde será</h2>
              <p className="text-sm text-slate-500 mt-0.5">{address}</p>
            </div>
            <EventMap address={address} height={320} className="rounded-none border-0" />
          </section>
        ) : null;
      })()}

      <section className="card p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Confirmar presença</h2>
        <p className="text-sm text-slate-500 mb-4">
          Deixe seu nome e contato. É rápido — ajuda a regional a se organizar 🙌
        </p>
        <RsvpForm eventId={event.id} />
      </section>
    </div>
  );
}
