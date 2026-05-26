"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { eventId: string };

export function RsvpForm({ eventId }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [instagram, setInstagram] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, whatsapp, instagram }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao confirmar presença");
      setDone(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-green-800 text-sm">
        ✅ Presença confirmada! Te vemos no evento, {name.split(" ")[0]}. Deus te abençoe 🙏
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div>
        <label className="label">Nome completo *</label>
        <input
          className="input"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="label">WhatsApp *</label>
          <input
            className="input"
            required
            inputMode="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="(18) 99999-9999"
          />
        </div>
        <div>
          <label className="label">Instagram</label>
          <input
            className="input"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@seuuser"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Confirmando..." : "Confirmar presença"}
      </button>
      <p className="text-xs text-slate-400 text-center">
        Seus dados só são usados pela liderança da Regional 78.
      </p>
    </form>
  );
}
