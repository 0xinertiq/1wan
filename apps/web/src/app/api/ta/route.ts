import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { snapshot } from "@/lib/ta";
import { TF, candles } from "@/lib/candles";

export const dynamic = "force-dynamic";

// Candles and a technicals snapshot per watchlist coin (docs/build-intel.md K), described in words only.
// GET ?syms=BTC,ETH&tf=4h          -> snapshots for the watchlist
// GET ?sym=BTC&tf=4h&candles=1     -> also the candles, for the chart
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const u = new URL(req.url).searchParams;
  const tf = TF[u.get("tf") ?? ""] ? u.get("tf")! : "4h";
  const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  const syms = (u.get("sym") ? [u.get("sym")!] : (u.get("syms") ?? "BTC,ETH,SOL").split(",")).map(clean).filter(Boolean).slice(0, 12);
  const out = await Promise.all(syms.map(async (sym) => {
    const r = await candles(sym, tf);
    if (!r) return { sym, ok: false, reason: "No candles from Crypto.com for " + sym };
    const s = snapshot(r.cs);
    return { sym, ok: !!s, tf, source: "Crypto.com Exchange", fetched: new Date(r.fetched).toISOString(), lastCandle: new Date(r.cs[r.cs.length - 1].t).toISOString(),
      snap: s && { ...s, lines: s.lines.map(({ at: _at, ...l }) => l) }, candles: u.get("candles") ? r.cs : undefined };
  }));
  return NextResponse.json({ tf, items: out });
}
