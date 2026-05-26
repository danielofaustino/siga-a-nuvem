"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Church } from "@/lib/types";

type Props = { initial: Church[] };

export function ChurchesManager({ initial }: Props) {
  const router = useRouter();
  const [list, setList] = useState<Church[]>(initial);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [address, setAddress] = useState("");
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
        body: JSON.stringify({ name, slug, address: address || null, color }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erro ao salvar");
      setList((l) => [...l, json.church]);
      setName("");
      setSlug("");
      setAddress("");
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

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="card p-4 space-y-2">
        <h2 className="font-semibold">Cadastradas</h2>
        {list.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma ainda.</p>
        ) : (
          list.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 p-2 rounded hover:bg-slate-50">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: c.color ?? "#3b65ff" }}
                />
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.address ?? c.slug}</p>
                </div>
              </div>
              <button
                onClick={() => deleteChurch(c.id)}
                className="text-xs text-red-600 hover:underline"
              >
                excluir
              </button>
            </div>
          ))
        )}
      </div>

      <form onSubmit={addChurch} className="card p-4 space-y-3">
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
