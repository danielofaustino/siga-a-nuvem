import Link from "next/link";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { SyncFromGoogleButton } from "@/components/SyncFromGoogleButton";
import { CalendarPicker } from "@/components/CalendarPicker";

export const dynamic = "force-dynamic";

export default async function GoogleConnectPage() {
  const supabase = createSupabaseAdminClient();
  const { data: creds } = await supabase
    .from("google_credentials")
    .select("connected_email, calendar_id, updated_at")
    .eq("id", 1)
    .maybeSingle();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Google Calendar</h1>

      <div className="card p-6 space-y-4">
        {creds ? (
          <>
            <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm">
              <p className="text-green-800 font-medium">
                ✅ Conectado como <strong>{creds.connected_email}</strong>
              </p>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <CalendarPicker currentId={creds.calendar_id} />
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-2">
              <SyncFromGoogleButton />
              <p className="text-xs text-slate-500">
                Puxa eventos dos próximos 90 dias da agenda selecionada e
                cria/atualiza no banco. Eventos criados pelo app já são salvos
                no Google automaticamente.
              </p>
            </div>

            <Link
              href="/api/google/auth"
              className="block text-sm text-slate-500 hover:text-slate-800"
            >
              reconectar com outra conta →
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              Conecte a conta Google que possui a agenda da regional (
              <code className="text-xs">vencedores.com.cristo.ad.jd.dracena@gmail.com</code>).
              Vamos pedir permissão para ler e editar o Calendar dessa conta.
            </p>
            <Link href="/api/google/auth" className="btn-primary inline-flex">
              Conectar com Google
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
