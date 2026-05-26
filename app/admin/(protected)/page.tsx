import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatShort } from "@/lib/format";
import { DeleteEventButton } from "@/components/DeleteEventButton";

export default async function AdminDashboard() {
  const supabase = createSupabaseServerClient();

  const [{ data: events }, { data: counts }] = await Promise.all([
    supabase
      .from("events")
      .select("*, church:churches(id, name, color)")
      .order("start_at", { ascending: false })
      .limit(200),
    supabase.from("event_attendance_counts").select("event_id, total"),
  ]);

  const countMap = new Map<string, number>(
    (counts ?? []).map((c: any) => [c.event_id, c.total]),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Eventos</h1>
        <Link href="/admin/eventos/novo" className="btn-primary">
          + Novo evento
        </Link>
      </div>

      {(events ?? []).length === 0 ? (
        <div className="card p-8 text-center text-slate-500">
          Nenhum evento ainda. Clique em <strong>+ Novo evento</strong>.
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-2">Evento</th>
                <th className="text-left px-4 py-2">Igreja</th>
                <th className="text-left px-4 py-2">Quando</th>
                <th className="text-left px-4 py-2">Presenças</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(events ?? []).map((e: any) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{e.title}</div>
                    {e.google_event_id && (
                      <div className="text-xs text-slate-400">sincronizado · gcal</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {e.church ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: e.church.color ?? "#3b65ff" }}
                        />
                        {e.church.name}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatShort(e.start_at)}</td>
                  <td className="px-4 py-3 font-semibold text-brand-700">
                    {countMap.get(e.id) ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    {e.is_published ? (
                      <span className="text-green-700 text-xs">publicado</span>
                    ) : (
                      <span className="text-slate-400 text-xs">rascunho</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/admin/eventos/${e.id}/presencas`}
                        className="text-xs text-slate-500 hover:text-slate-900"
                      >
                        presenças
                      </Link>
                      <Link
                        href={`/admin/eventos/${e.id}/editar`}
                        className="text-xs text-brand-700 hover:underline"
                      >
                        editar
                      </Link>
                      <DeleteEventButton eventId={e.id} title={e.title} />
                    </div>
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
