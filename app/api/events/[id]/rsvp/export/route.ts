import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { data: event } = await supabase
    .from("events")
    .select("title, start_at")
    .eq("id", params.id)
    .maybeSingle();

  const { data: list } = await supabase
    .from("attendances")
    .select("name, whatsapp, instagram, created_at")
    .eq("event_id", params.id)
    .order("created_at");

  const header = ["nome", "whatsapp", "instagram", "confirmado_em"];
  const rows = (list ?? []).map((a) => [
    csvEscape(a.name),
    csvEscape(a.whatsapp ?? ""),
    csvEscape(a.instagram ?? ""),
    a.created_at,
  ]);

  const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const safeName = (event?.title ?? "evento").replace(/[^\w-]+/g, "_").toLowerCase();

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeName}-presencas.csv"`,
    },
  });
}

function csvEscape(v: string) {
  if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
  return v;
}
