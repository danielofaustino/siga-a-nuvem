"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Church, EventRow } from "@/lib/types";
import { isoToInputDateTime } from "@/lib/format";

type Props = {
  churches: Pick<Church, "id" | "name" | "slug" | "color" | "address">[];
  event?: EventRow;
};

export function EventForm({ churches, event }: Props) {
  const router = useRouter();
  const editing = !!event;

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [churchId, setChurchId] = useState(event?.church_id ?? "");
  const [startAt, setStartAt] = useState(
    event ? isoToInputDateTime(event.start_at) : "",
  );
  const [endAt, setEndAt] = useState(
    event ? isoToInputDateTime(event.end_at) : "",
  );
  const [allDay, setAllDay] = useState(event?.all_day ?? false);
  const [imageUrl, setImageUrl] = useState(event?.image_url ?? "");
  const [capacity, setCapacity] = useState(event?.capacity?.toString() ?? "");
  const [isPublished, setIsPublished] = useState(event?.is_published ?? true);
  const [tags, setTags] = useState<string[]>(event?.tags ?? []);
  const [tagInput, setTagInput] = useState("");

  const SUGGESTED_TAGS = ["jovens", "adolescentes", "irmãs", "varões"];

  function normalizeTag(t: string) {
    return t.trim().toLowerCase();
  }

  function addTag(raw: string) {
    const t = normalizeTag(raw);
    if (!t) return;
    setTags((prev) => (prev.includes(t) ? prev : [...prev, t]));
    setTagInput("");
  }

  function removeTag(t: string) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Para all-day, guardamos meio-dia UTC do dia escolhido — isso preserva
    // a data em qualquer TZ (UTC midnight viraria dia anterior no Brasil).
    const toIsoAllDay = (local: string) => `${local.slice(0, 10)}T12:00:00.000Z`;

    const body = {
      title,
      description: description || null,
      location: location || null,
      church_id: churchId || null,
      // input datetime-local não tem TZ — assumimos hora local do navegador → ISO
      start_at: allDay ? toIsoAllDay(startAt) : new Date(startAt).toISOString(),
      end_at: allDay ? toIsoAllDay(endAt) : new Date(endAt).toISOString(),
      all_day: allDay,
      image_url: imageUrl || null,
      capacity: capacity ? parseInt(capacity, 10) : null,
      is_published: isPublished,
      tags,
    };

    try {
      const url = editing ? `/api/events/${event!.id}` : "/api/events";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao salvar");
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!event) return;
    if (!confirm("Excluir este evento? A ação também removerá do Google Calendar.")) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${event.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Erro ao excluir");
      }
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card p-6 space-y-4">
      <div>
        <label className="label">Título *</label>
        <input className="input" required value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div>
        <label className="label">Descrição</label>
        <textarea
          className="input min-h-[100px]"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Igreja</label>
          <select
            className="input"
            value={churchId}
            onChange={(e) => {
              const newId = e.target.value;
              // auto-preenche o local com o endereço da igreja selecionada se:
              // - local está vazio, OU
              // - local corresponde ao endereço da igreja anteriormente selecionada
              // (evita pisar em endereço digitado manualmente pelo admin)
              const prev = churches.find((c) => c.id === churchId);
              const next = churches.find((c) => c.id === newId);
              if (
                next?.address &&
                (!location.trim() || (prev?.address && location === prev.address))
              ) {
                setLocation(next.address);
              }
              setChurchId(newId);
            }}
          >
            <option value="">— Selecione —</option>
            {churches.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Local</label>
          <input
            className="input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Preenchido com o endereço da igreja"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Início *</label>
          <input
            type="datetime-local"
            className="input"
            required
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Fim *</label>
          <input
            type="datetime-local"
            className="input"
            required
            value={endAt}
            onChange={(e) => setEndAt(e.target.value)}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">URL da imagem (opcional)</label>
          <input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>
        <div>
          <label className="label">Capacidade (opcional)</label>
          <input
            type="number"
            className="input"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            min={1}
          />
        </div>
      </div>

      <div>
        <label className="label">Tags</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.length === 0 && (
            <span className="text-xs text-slate-400">Nenhuma tag — adicione abaixo.</span>
          )}
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-medium"
            >
              {t}
              <button
                type="button"
                onClick={() => removeTag(t)}
                className="hover:text-red-600"
                aria-label={`remover ${t}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="input flex-1"
            value={tagInput}
            placeholder="Digite e pressione Enter"
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addTag(tagInput);
              } else if (e.key === "Backspace" && !tagInput && tags.length) {
                removeTag(tags[tags.length - 1]);
              }
            }}
          />
          <button
            type="button"
            className="btn-secondary text-xs px-3"
            onClick={() => addTag(tagInput)}
          >
            Adicionar
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {SUGGESTED_TAGS.filter((t) => !tags.includes(t)).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => addTag(t)}
              className="text-xs text-slate-500 px-2 py-0.5 rounded border border-dashed border-slate-300 hover:bg-slate-50"
            >
              + {t}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} />
          Dia inteiro
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
          />
          Publicado
        </label>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          {editing && (
            <button
              type="button"
              onClick={onDelete}
              className="btn-danger"
              disabled={loading}
            >
              Excluir
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="btn-secondary"
          >
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Salvando..." : editing ? "Salvar alterações" : "Criar evento"}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400">
        Ao salvar, o evento é sincronizado com o Google Calendar conectado.
      </p>
    </form>
  );
}
