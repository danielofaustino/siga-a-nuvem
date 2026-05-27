"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/admin", label: "Eventos", exact: true },
  { href: "/admin/eventos/novo", label: "Novo evento" },
  { href: "/admin/igrejas", label: "Igrejas" },
  { href: "/admin/google", label: "Google Calendar" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {ITEMS.map((it) => {
        const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              active
                ? "bg-brand-600 text-white font-medium"
                : "text-slate-700 hover:bg-slate-100"
            }`}
            aria-current={active ? "page" : undefined}
          >
            {it.label}
          </Link>
        );
      })}
    </div>
  );
}
