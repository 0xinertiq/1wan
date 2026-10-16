import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SYMBOLS, getPrices } from "@/lib/prices";

export const dynamic = "force-dynamic";

// GET /api/prices?s=BTC,ETH,SOL  Display-only prices, cached 60 seconds on the server.
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const s = new URL(req.url).searchParams.get("s");
  const syms = s ? s.split(",") : DEFAULT_SYMBOLS;
  return NextResponse.json(await getPrices(syms), { headers: { "Cache-Control": "private, max-age=30" } });
}
