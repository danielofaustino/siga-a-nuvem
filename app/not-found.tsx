import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card p-12 text-center space-y-3">
      <h1 className="text-2xl font-bold">Ops, não encontramos isso</h1>
      <p className="text-slate-500">A página que você buscou não existe ou foi removida.</p>
      <Link href="/" className="btn-primary inline-flex">Voltar para o início</Link>
    </div>
  );
}
