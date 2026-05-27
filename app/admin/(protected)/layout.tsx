import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";
import { AdminNav } from "@/components/AdminNav";

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
    <div className="space-y-5 sm:space-y-6">
      <nav className="card p-2.5 sm:p-3 flex flex-wrap items-center gap-2">
        <AdminNav />
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="text-xs text-slate-500 hidden md:inline truncate max-w-[180px]">
            {user.email}
          </span>
          <SignOutButton />
        </div>
      </nav>
      {children}
    </div>
  );
}
