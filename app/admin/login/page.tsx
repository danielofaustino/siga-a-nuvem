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
    <div className="max-w-sm mx-auto card p-5 sm:p-6 mt-4 sm:mt-12 space-y-4">
      <div className="text-center space-y-2">
        <div className="mx-auto h-12 w-12 rounded-xl bg-brand-600 flex items-center justify-center text-white text-xl font-bold shadow-sm">
          ☁
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Acesso admin</h1>
          <p className="text-sm text-slate-500">Painel da Regional 78</p>
        </div>
      </div>
      <LoginForm />
    </div>
  );
}
