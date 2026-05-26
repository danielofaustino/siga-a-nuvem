import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/LoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/admin");

  return (
    <div className="max-w-sm mx-auto card p-6 mt-8 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Acesso admin</h1>
        <p className="text-sm text-slate-500">Painel da Regional 78</p>
      </div>
      <LoginForm />
    </div>
  );
}
