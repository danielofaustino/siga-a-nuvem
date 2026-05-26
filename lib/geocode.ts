/**
 * Geocoding via Nominatim (OpenStreetMap). Grátis, sem API key.
 * Política de uso: https://operations.osmfoundation.org/policies/nominatim/
 * - Max 1 req/segundo
 * - Header User-Agent obrigatório
 * - Não fazer bulk geocoding
 *
 * Para uso intenso, considerar migrar para serviço pago (Mapbox, Google).
 */
const USER_AGENT = "SigaANuvem/1.0 (Regional 78 - AD Madureira)";

export type GeoPoint = { lat: number; lng: number };

export async function geocodeAddress(address: string): Promise<GeoPoint | null> {
  const q = address.trim();
  if (!q) return null;

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "json");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("addressdetails", "0");

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      // não bloqueia salvamento se Nominatim cair
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat: string; lon: string }>;
    if (!data?.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}
