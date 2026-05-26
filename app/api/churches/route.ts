import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocode";

const ChurchSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug deve ser minúsculo, sem espaço"),
  address: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  instagram: z.string().max(80).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = ChurchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  // Geocoda em best-effort: se Nominatim falhar, salva sem coordenadas.
  let latitude: number | null = null;
  let longitude: number | null = null;
  if (parsed.data.address) {
    const point = await geocodeAddress(parsed.data.address);
    if (point) {
      latitude = point.lat;
      longitude = point.lng;
    }
  }

  const { data, error } = await supabase
    .from("churches")
    .insert({ ...parsed.data, latitude, longitude })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Já existe igreja com esse identificador" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ church: data });
}
