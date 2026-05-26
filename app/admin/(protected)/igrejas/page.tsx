import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ChurchesManager } from "@/components/ChurchesManager";

export default async function ChurchesAdminPage() {
  const supabase = createSupabaseServerClient();
  const { data: churches } = await supabase
    .from("churches")
    .select("*")
    .order("name");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900">Igrejas da regional</h1>
      <ChurchesManager initial={churches ?? []} />
    </div>
  );
}
