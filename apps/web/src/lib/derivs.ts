// Server only. Funding rate, open interest and 24h volume for watchlist perpetuals (docs/build-intel.md F),
// read-only context. Public endpoints tried in order: OKX, Bybit, Binance (some block certain server
// regions; tested 27 Oct from her PC: all three answered). Cached 5 minutes. Liquidation data is paid: skipped.
export type Deriv = { sym: string; ok: boolean; source?: string; funding?: number; nextFunding?: string; oiUsd?: number; vol24hUsd?: number; reason?: string };

const cache = new Map<string, { at: number; d: Deriv }>();
async function j(url: string) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 6000);
  try { const r = await fetch(url, { signal: ctl.signal, cache: "no-store" }); if (!r.ok) throw new Error("status " + r.status); return await r.json(); }
  finally { clearTimeout(t); }
}

async function okx(sym: string): Promise<Deriv> {
  const id = `${sym}-USDT-SWAP`;
  const [f, o, t] = await Promise.all([j(`https://www.okx.com/api/v5/public/funding-rate?instId=${id}`), j(`https://www.okx.com/api/v5/public/open-interest?instType=SWAP&instId=${id}`), j(`https://www.okx.com/api/v5/market/ticker?instId=${id}`)]);
  const fr = f?.data?.[0], oi = o?.data?.[0], tk = t?.data?.[0];
  if (!fr || !oi) throw new Error("no data");
  return { sym, ok: true, source: "OKX", funding: +fr.fundingRate, nextFunding: new Date(+fr.fundingTime).toISOString(), oiUsd: +oi.oiUsd, vol24hUsd: tk ? +tk.volCcy24h * +tk.last : undefined };
}
async function bybit(sym: string): Promise<Deriv> {
  const r = await j(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${sym}USDT`), x = r?.result?.list?.[0];
  if (!x) throw new Error("no data");
  return { sym, ok: true, source: "Bybit", funding: +x.fundingRate, nextFunding: new Date(+x.nextFundingTime).toISOString(), oiUsd: +x.openInterestValue, vol24hUsd: +x.turnover24h };
}
async function binance(sym: string): Promise<Deriv> {
  const [p, o] = await Promise.all([j(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${sym}USDT`), j(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${sym}USDT`)]);
  if (!p?.symbol) throw new Error("no data");
  return { sym, ok: true, source: "Binance", funding: +p.lastFundingRate, nextFunding: new Date(+p.nextFundingTime).toISOString(), oiUsd: o?.openInterest ? +o.openInterest * +p.markPrice : undefined };
}

export async function deriv(sym: string): Promise<Deriv> {
  const hit = cache.get(sym);
  if (hit && Date.now() - hit.at < 5 * 60e3) return hit.d;
  const errs: string[] = [];
  for (const [name, f] of [["OKX", okx], ["Bybit", bybit], ["Binance", binance]] as const) {
    try { const d = await f(sym); cache.set(sym, { at: Date.now(), d }); return d; }
    catch (e) { errs.push(`${name}: ${e instanceof Error ? (e.name === "AbortError" ? "timed out" : e.message) : "failed"}`); }
  }
  return hit?.d ?? { sym, ok: false, reason: "No perpetual market found or all exchanges unreachable (" + errs.join("; ") + ")" };
}

export async function loadDerivs(syms: string[]) {
  return { at: new Date().toISOString(), items: await Promise.all(syms.slice(0, 12).map(deriv)) };
}
