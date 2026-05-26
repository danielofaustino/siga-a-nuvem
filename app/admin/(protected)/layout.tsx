import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  return (
    <div className="space-y-6">
      <nav className="card p-3 flex flex-wrap items-center gap-2">
        <NavLink href="/admin">Eventos</NavLink>
        <NavLink href="/admin/eventos/novo">Novo evento</NavLink>
        <NavLink href="/admin/igrejas">Igrejas</NavLink>
        <NavLink href="/admin/google">Google Calendar</NavLink>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-slate-500 hidden sm:inline">{user.email}</span>
          <SignOutButton />
        </div>
      </nav>
      {children}
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-sm text-slate-700 hover:bg-slate-100"
    >
      {children}
    </Link>
  );
}
