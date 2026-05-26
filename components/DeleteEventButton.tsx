"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { eventId: string; title: string };

export function DeleteEventButton({ eventId, title }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!confirm(`Excluir "${title}"?\n\nO evento será removido do app. Também tentamos remover do Google Calendar — se falhar, ainda assim o evento sai daqui.`)) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert("Erro ao excluir: " + (json.error ?? res.statusText));
        setLoading(false);
        return;
      }
      if (json.google_warning) {
        // sucesso local mas falhou no google — só avisa
        console.warn("Google delete falhou:", json.google_warning);
      }
      router.refresh();
    } catch (err: any) {
      alert("Erro: " + err.message);
      setLoading(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="text-xs text-red-600 hover:underline disabled:opacity-50"
      title="Excluir evento"
    >
      {loading ? "..." : "excluir"}
    </button>
  );
}
