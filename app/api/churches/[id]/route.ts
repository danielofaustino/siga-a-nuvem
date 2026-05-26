import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { geocodeAddress } from "@/lib/geocode";

const ChurchUpdateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/, "slug deve ser minúsculo, sem espaço"),
  address: z.string().nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  instagram: z.string().max(80).nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = ChurchUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  // Pega o address atual para decidir se precisa re-geocodar.
  const { data: prev } = await supabase
    .from("churches")
    .select("address, latitude, longitude")
    .eq("id", params.id)
    .maybeSingle();

  const addressChanged = (prev?.address ?? null) !== (parsed.data.address ?? null);
  let latitude = prev?.latitude ?? null;
  let longitude = prev?.longitude ?? null;

  if (parsed.data.address && (addressChanged || latitude == null)) {
    const point = await geocodeAddress(parsed.data.address);
    if (point) {
      latitude = point.lat;
      longitude = point.lng;
    }
  } else if (!parsed.data.address) {
    latitude = null;
    longitude = null;
  }

  const { data, error } = await supabase
    .from("churches")
    .update({ ...parsed.data, latitude, longitude })
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Já existe outra igreja com esse identificador" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ church: data });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { error } = await supabase.from("churches").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
