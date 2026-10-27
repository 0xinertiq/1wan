// Server only. Candles for watchlist technicals (docs/build-intel.md K): Crypto.com Exchange public candles
// (tested 27 Oct: 300 candles for 1h, 4h and 1D in about 0.2 s), cached in memory per timeframe.
// Never fills or invents candles: a coin without data returns null.
import type { Candle } from "./ta";

export const TF: Record<string, { api: string; ttl: number }> = { "1h": { api: "1h", ttl: 5 * 60e3 }, "4h": { api: "4h", ttl: 15 * 60e3 }, "1d": { api: "1D", ttl: 60 * 60e3 } };
const cache = new Map<string, { at: number; cs: Candle[] }>();

export async function candles(sym: string, tf: string): Promise<{ cs: Candle[]; fetched: number } | null> {
  const key = sym + ":" + tf, hit = cache.get(key), conf = TF[tf];
  if (hit && Date.now() - hit.at < conf.ttl) return { cs: hit.cs, fetched: hit.at };
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await fetch(`https://api.crypto.com/exchange/v1/public/get-candlestick?instrument_name=${sym}_USDT&timeframe=${conf.api}&count=300`, { signal: ctl.signal, cache: "no-store" });
    const j = await r.json();
    const cs = ((j?.result?.data ?? []) as Record<string, string | number>[])
      .map((x) => ({ t: +x.t, o: +x.o, h: +x.h, l: +x.l, c: +x.c, v: +x.v })).filter((x) => [x.o, x.h, x.l, x.c].every(isFinite)).sort((a, b) => a.t - b.t);
    if (!cs.length) return hit ? { cs: hit.cs, fetched: hit.at } : null;
    cache.set(key, { at: Date.now(), cs });
    return { cs, fetched: Date.now() };
  } catch {
    return hit ? { cs: hit.cs, fetched: hit.at } : null;
  } finally { clearTimeout(t); }
}

