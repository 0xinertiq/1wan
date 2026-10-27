import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Daily ATR(14) from Crypto.com public candles. Fetched, never typed or invented; answers with the
// candle timestamp so the page can show how fresh it is. No keys needed.
export async function GET(req: Request) {
  const sym = (new URL(req.url).searchParams.get("sym") ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
  if (!sym) return NextResponse.json({ error: "Missing sym" }, { status: 400 });
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 6000);
  try {
    const r = await fetch(`https://api.crypto.com/exchange/v1/public/get-candlestick?instrument_name=${sym}_USDT&timeframe=1D&count=16`, { signal: ctl.signal, cache: "no-store" });
    const j = await r.json();
    const c = ((j?.result?.data ?? []) as { h: string; l: string; c: string; t: number }[])
      .map((x) => ({ h: +x.h, l: +x.l, c: +x.c, t: x.t })).filter((x) => isFinite(x.h) && isFinite(x.l) && isFinite(x.c)).sort((a, b) => a.t - b.t);
    if (c.length < 15) return NextResponse.json({ sym, atr: null, reason: "Not enough candles" });
    const tr = c.slice(1).map((x, i) => Math.max(x.h - x.l, Math.abs(x.h - c[i].c), Math.abs(x.l - c[i].c)));
    const last = tr.slice(-14);
    return NextResponse.json({ sym, atr: last.reduce((a, b) => a + b, 0) / last.length, close: c[c.length - 1].c, at: new Date(c[c.length - 1].t).toISOString(), source: "crypto.com" });
  } catch {
    return NextResponse.json({ sym, atr: null, reason: "Candles not reachable" });
  } finally { clearTimeout(t); }
}
