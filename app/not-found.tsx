import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto mt-4 sm:mt-8">
      <div className="text-5xl sm:text-6xl" aria-hidden>
        ☁
      </div>
      <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
        Ops, não encontramos isso
      </h1>
      <p className="text-sm text-slate-500">
        A página que você buscou não existe ou foi removida.
      </p>
      <Link href="/" className="btn-primary inline-flex">
        Voltar para o início
      </Link>
    </div>
  );
}
