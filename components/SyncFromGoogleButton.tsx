"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SyncFromGoogleButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function sync() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/google/sync", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "erro");
      setMsg(`Sincronizados: ${json.imported} importado(s), ${json.updated} atualizado(s).`);
      router.refresh();
    } catch (err: any) {
      setMsg("Erro: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={sync} disabled={loading} className="btn-secondary">
        {loading ? "Sincronizando..." : "⟳ Puxar do Google Calendar"}
      </button>
      {msg && <p className="text-xs mt-2 text-slate-600">{msg}</p>}
    </div>
  );
}
