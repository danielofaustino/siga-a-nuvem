"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Church } from "@/lib/types";

type Props = { initial: Church[] };

export function ChurchesManager({ initial }: Props) {
  const router = useRouter();
  const [list, setList] = useState<Church[]>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);

  // formulário de criação
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
  const [instagram, setInstagram] = useState("");
  const [color, setColor] = useState("#3b65ff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addChurch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/churches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          address: address || null,
          instagram: instagram || null,
          color,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao salvar");
      setList((l) => [...l, json.church]);
      setName("");
      setSlug("");
      setAddress("");
      setInstagram("");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteChurch(id: string) {
    if (!confirm("Excluir esta igreja?")) return;
    const res = await fetch(`/api/churches/${id}`, { method: "DELETE" });
    if (res.ok) {
      setList((l) => l.filter((c) => c.id !== id));
      router.refresh();
    } else {
      const json = await res.json();
      alert(json.error ?? "Erro ao excluir");
    }
  }

  function handleSaved(updated: Church) {
    setList((l) => l.map((c) => (c.id === updated.id ? updated : c)));
    setEditingId(null);
    router.refresh();
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card p-4 space-y-2">
        <h2 className="font-semibold">Cadastradas</h2>
        {list.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma ainda.</p>
        ) : (
          list.map((c) =>
            editingId === c.id ? (
              <ChurchEditRow
                key={c.id}
                church={c}
                onCancel={() => setEditingId(null)}
                onSaved={handleSaved}
              />
            ) : (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 p-2 rounded hover:bg-slate-50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: c.color ?? "#3b65ff" }}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {c.address ?? c.slug}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setEditingId(c.id)}
                    className="text-xs text-brand-700 hover:underline"
                  >
                    editar
                  </button>
                  <button
                    onClick={() => deleteChurch(c.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    excluir
                  </button>
                </div>
              </div>
            ),
          )
        )}
      </div>

      <form onSubmit={addChurch} className="card p-3 space-y-2 sm:p-4 sm:space-y-3">
        <h2 className="font-semibold">Adicionar igreja</h2>
        <div>
          <label className="label">Nome</label>
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label">Identificador (ex: sede, congregacao-vila)</label>
          <input
            className="input"
            required
            value={slug}
            pattern="[a-z0-9-]+"
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
          />
        </div>
        <div>
          <label className="label">Endereço</label>
          <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} />
          <p className="text-xs text-slate-400 mt-1">
            Usado para mostrar no mapa e calcular proximidade.
          </p>
        </div>
        <div>
          <label className="label">Instagram (@user)</label>
          <input
            className="input"
            value={instagram}
            placeholder="@adjardimdracena"
            onChange={(e) => setInstagram(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Cor</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-16 h-10 rounded"
          />
        </div>
        {error && (
          <div className="rounded bg-red-50 border border-red-200 p-2 text-xs text-red-700">
            {error}
          </div>
        )}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Salvando..." : "Adicionar"}
        </button>
      </form>
    </div>
  );
}

type EditProps = {
  church: Church;
  onCancel: () => void;
  onSaved: (c: Church) => void;
};

function ChurchEditRow({ church, onCancel, onSaved }: EditProps) {
  const [name, setName] = useState(church.name);
  const [slug, setSlug] = useState(church.slug);
  const [address, setAddress] = useState(church.address ?? "");
  const [instagram, setInstagram] = useState(church.instagram ?? "");
  const [color, setColor] = useState(church.color ?? "#3b65ff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/churches/${church.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          address: address || null,
          instagram: instagram || null,
          color,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao salvar");
      onSaved(json.church);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={save}
      className="p-2 rounded border border-brand-200 bg-brand-50/40 space-y-1.5 sm:p-3 sm:space-y-2"
    >
      <div>
        <label className="label">Nome</label>
        <input
          className="input"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Identificador</label>
        <input
          className="input"
          required
          pattern="[a-z0-9-]+"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
        />
      </div>
      <div>
        <label className="label">Endereço</label>
        <input
          className="input"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Instagram</label>
        <input
          className="input"
          value={instagram}
          placeholder="@adjardimdracena"
          onChange={(e) => setInstagram(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="label mb-0">Cor</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-12 h-8 rounded"
        />
      </div>
      {error && (
        <div className="rounded bg-red-50 border border-red-200 p-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary text-xs px-3 py-1.5"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="btn-primary text-xs px-3 py-1.5"
          disabled={loading}
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}
