import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export default async function AttendancesPage({ params }: { params: { id: string } }) {
  const supabase = createSupabaseServerClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, start_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!event) notFound();

  const { data: attendances } = await supabase
    .from("attendances")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  const list = attendances ?? [];

  return (
    <div className="space-y-4">
      <Link href="/admin" className="text-sm text-slate-500 hover:text-slate-800">
        ← voltar
      </Link>

      <div className="card p-6">
        <h1 className="text-xl font-bold text-slate-900">{event.title}</h1>
        <p className="text-sm text-slate-500">
          {format(parseISO(event.start_at), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
        </p>
        <p className="mt-3 text-sm">
          <span className="font-semibold text-brand-700">{list.length}</span> presenças confirmadas
        </p>

        <div className="mt-4">
          <a
            href={`/api/events/${event.id}/rsvp/export`}
            className="btn-secondary text-xs"
          >
            ⬇ Exportar CSV
          </a>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="card p-8 text-center text-slate-500">Ainda sem confirmações.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Nome</th>
                <th className="text-left px-4 py-2">WhatsApp</th>
                <th className="text-left px-4 py-2">Instagram</th>
                <th className="text-left px-4 py-2">Confirmou em</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a: any) => (
                <tr key={a.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{a.name}</td>
                  <td className="px-4 py-3 text-slate-700">{a.whatsapp ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-700">{a.instagram ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {format(parseISO(a.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
