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

  const address = event.location || event.church?.address;

  return (
    <div className="space-y-5 sm:space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 -ml-1 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
      >
        <span aria-hidden>←</span> voltar
      </Link>

      <article className="card overflow-hidden">
        {event.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-48 sm:h-64 object-cover"
          />
        )}
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2">
            {event.church && (
              <span
                className="inline-block w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: event.church.color ?? "#3b65ff" }}
              />
            )}
            <span className="text-xs text-slate-500">
              {event.church?.name ?? "Evento geral"}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight">
            {event.title}
          </h1>

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {event.tags.map((t: string) => (
                <span
                  key={t}
                  className="text-[10px] sm:text-xs uppercase tracking-wide px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-brand-50 text-brand-700 font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="text-sm text-slate-600 space-y-1.5">
            <p className="flex items-start gap-2">
              <span aria-hidden>📅</span>
              <span>{formatEventDate(event.start_at, event.all_day)}</span>
            </p>
            {address && (
              <p className="flex items-start gap-2">
                <span aria-hidden>📍</span>
                <span className="break-words">{address}</span>
              </p>
            )}
            {event.church?.instagram && (
              <p className="flex items-start gap-2">
                <span aria-hidden>📷</span>
                <a
                  href={`https://instagram.com/${event.church.instagram.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-700 hover:underline break-all"
                >
                  {event.church.instagram.startsWith("@")
                    ? event.church.instagram
                    : `@${event.church.instagram}`}
                </a>
              </p>
            )}
          </div>

          {event.description && (
            <p className="text-slate-700 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
              {event.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-sm pt-1">
            <span className="px-3 py-1 rounded-full bg-brand-50 text-brand-700 font-semibold inline-flex items-center gap-1.5">
              <span aria-hidden>✓</span>
              {count?.total ?? 0} confirmada{count?.total === 1 ? "" : "s"}
            </span>
            {event.capacity && (
              <span className="text-slate-500 text-xs">de {event.capacity} vagas</span>
            )}
          </div>
        </div>
      </article>

      {address && (
        <section className="card overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Onde será</h2>
            <p className="text-sm text-slate-500 mt-0.5 break-words">{address}</p>
          </div>
          <EventMap address={address} height={320} className="rounded-none border-0" />
        </section>
      )}

      <section className="card p-4 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Confirmar presença</h2>
        <p className="text-sm text-slate-500 mb-4">
          Deixe seu nome e contato. É rápido — ajuda a regional a se organizar 🙌
        </p>
        <RsvpForm eventId={event.id} />
      </section>
    </div>
  );
}
