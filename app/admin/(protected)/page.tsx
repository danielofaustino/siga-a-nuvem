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

  const list = events ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900">Eventos</h1>
        <Link href="/admin/eventos/novo" className="btn-primary text-sm">
          + Novo
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="card p-8 text-center text-slate-500 space-y-2">
          <div className="text-4xl" aria-hidden>📅</div>
          <p>Nenhum evento ainda.</p>
          <p className="text-xs">Clique em <strong>+ Novo</strong> pra começar.</p>
        </div>
      ) : (
        <>
          {/* mobile: cards */}
          <div className="grid gap-2.5 md:hidden">
            {list.map((e: any) => (
              <div key={e.id} className="card p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-slate-900 break-words">{e.title}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {formatShort(e.start_at)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase tracking-wide text-slate-400">
                      presenças
                    </div>
                    <div className="text-base font-bold text-brand-700">
                      {countMap.get(e.id) ?? 0}
                    </div>
                  </div>
                </div>
                <div className="flex items-center flex-wrap gap-2 text-xs">
                  {e.church && (
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: e.church.color ?? "#3b65ff" }}
                      />
                      {e.church.name}
                    </span>
                  )}
                  {e.is_published ? (
                    <span className="text-green-700">● publicado</span>
                  ) : (
                    <span className="text-slate-400">○ rascunho</span>
                  )}
                  {e.google_event_id && (
                    <span className="text-slate-400">· gcal</span>
                  )}
                </div>
                <div className="flex items-center justify-end gap-3 pt-1 border-t border-slate-100">
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
              </div>
            ))}
          </div>

          {/* desktop: tabela */}
          <div className="card overflow-hidden hidden md:block">
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
                {list.map((e: any) => (
                  <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
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
                        <span className="text-green-700 text-xs">● publicado</span>
                      ) : (
                        <span className="text-slate-400 text-xs">○ rascunho</span>
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
        </>
      )}
    </div>
  );
}
