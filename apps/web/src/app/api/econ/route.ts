import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadEcon } from "@/lib/econ";

export const dynamic = "force-dynamic";

// Economic calendar, next 7 days by default (?days=1..30). Unofficial source is labelled as such.
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const days = Math.min(30, Math.max(1, +(new URL(req.url).searchParams.get("days") ?? 7) || 7));
  const r = await loadEcon(), from = Date.now() - 3 * 3600e3, to = Date.now() + days * 86400e3;
  return NextResponse.json({ ...r, items: r.items.filter((e) => e.impact !== "Low" && Date.parse(e.at) >= from && Date.parse(e.at) <= to) }, { headers: { "Cache-Control": "private, max-age=300" } });
}
