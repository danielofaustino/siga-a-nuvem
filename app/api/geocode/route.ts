import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { geocodeAddress } from "@/lib/geocode";

const Schema = z.object({ address: z.string().min(3).max(300) });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Endereço inválido" }, { status: 400 });
  }

  const point = await geocodeAddress(parsed.data.address);
  if (!point) {
    return NextResponse.json(
      { error: "Endereço não encontrado" },
      { status: 404 },
    );
  }
  return NextResponse.json(point);
}
