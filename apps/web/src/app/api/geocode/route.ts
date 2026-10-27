import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Place lookup for the private birth-details form: Open-Meteo geocoding (free, no key). Only the place
// name typed is sent; nothing is logged or stored here. Signed-in users only.
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim().slice(0, 60);
  if (q.length < 2) return NextResponse.json({ results: [] });
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=5&language=en&format=json&name=${encodeURIComponent(q)}`, { cache: "no-store" });
    const j = await r.json();
    const results = (j?.results ?? []).map((x: { name: string; admin1?: string; country?: string; latitude: number; longitude: number; timezone: string }) => ({
      label: [x.name, x.admin1, x.country].filter(Boolean).join(", "), lat: x.latitude, lon: x.longitude, tz: x.timezone,
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], reason: "Place search not reachable" });
  }
}
