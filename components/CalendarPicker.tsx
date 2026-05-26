"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Calendar = {
  id: string;
  summary: string;
  primary: boolean;
  backgroundColor: string | null;
};

type Props = { currentId: string };

export function CalendarPicker({ currentId }: Props) {
  const router = useRouter();
  const [calendars, setCalendars] = useState<Calendar[] | null>(null);
  const [selected, setSelected] = useState(currentId);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/google/calendars");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "erro");
      setCalendars(json.calendars);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    setSaving(true);
    setMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/google/calendars", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ calendar_id: selected }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "erro");
      setMsg("Agenda atualizada! Clique em ⟳ Puxar do Google para reimportar os eventos.");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Carregando agendas...</p>;
  }

  if (error) {
    return (
      <div className="rounded bg-red-50 border border-red-200 p-3 text-sm text-red-700">
        Erro ao listar agendas: {error}
        <button onClick={load} className="ml-2 underline">tentar de novo</button>
      </div>
    );
  }

  if (!calendars || calendars.length === 0) {
    return <p className="text-sm text-slate-500">Nenhuma agenda encontrada.</p>;
  }

  return (
    <div className="space-y-3">
      <label className="label">Agenda usada pelo app</label>
      <select
        className="input"
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
      >
        {calendars.map((c) => (
          <option key={c.id} value={c.id}>
            {c.summary}
            {c.primary ? " · (principal)" : ""}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || selected === currentId}
          className="btn-primary"
        >
          {saving ? "Salvando..." : "Salvar"}
        </button>
        {selected !== currentId && (
          <span className="text-xs text-slate-500">alteração pendente</span>
        )}
      </div>
      {msg && (
        <div className="rounded bg-green-50 border border-green-200 p-3 text-sm text-green-800">
          {msg}
        </div>
      )}
    </div>
  );
}
