import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadDerivs } from "@/lib/derivs";

export const dynamic = "force-dynamic";

// Funding rate, open interest and 24h volume for ?syms=BTC,ETH (read-only context, never a signal).
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const syms = (new URL(req.url).searchParams.get("syms") ?? "BTC,ETH,SOL").split(",").map((s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12)).filter(Boolean);
  return NextResponse.json(await loadDerivs(syms), { headers: { "Cache-Control": "private, max-age=120" } });
}
