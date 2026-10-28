"use client";

import { useEffect, useState } from "react";
import { useCourt } from "../CourtState";

// Fenn's live watchlist for Trades, labelled "Live" so it is not confused with the dated scan brief on the Court.
// One row per watchlist ticker (the scan's tickers, the same list as the prices strip): price now, day change and
// a 1-month range bar from the last 30 daily candles (Crypto.com, through /api/ta). Read-only, tracking only.
type Range = { lo: number; hi: number };

export function LiveWatch() {
  const { prices } = useCourt();
  const syms = prices?.prices.map((p) => p.sym) ?? [];
  const [rng, setRng] = useState<Record<string, Range | null>>({});
  useEffect(() => {
    if (!syms.length) return;
    fetch(`/api/ta?tf=1d&candles=1&syms=${syms.join(",")}`).then((r) => r.json()).then((j: { items?: { sym: string; candles?: { h: number; l: number }[] }[] }) => {
      const m: Record<string, Range | null> = {};
      for (const it of j.items ?? []) { const cs = (it.candles ?? []).slice(-30); m[it.sym] = cs.length ? { lo: Math.min(...cs.map((c) => c.l)), hi: Math.max(...cs.map((c) => c.h)) } : null; }
      setRng(m);
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syms.join(",")]);
  const fmt = (n: number) => (n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : n >= 1 ? n.toFixed(2) : n.toPrecision(3));
  return (
    <section className="win klive" aria-labelledby="klvT">
      <div className="win-title"><h2 id="klvT">Watchlist</h2><span className="sub"><span className="livetag">Live</span> Fenn</span></div>
      <div className="win-body">
        {!prices ? <p className="note">Prices loading…</p> : !prices.prices.length ? <p className="note">Prices are not reachable right now.</p> : (
          <table className="kwatch">
            <thead><tr><th>Ticker</th><th>Price</th><th>Day</th><th>Range<span className="kth-sub">30-day low to high</span></th></tr></thead>
            <tbody>
              {prices.prices.map((p) => {
                const r = rng[p.sym], pos = r && r.hi > r.lo ? Math.min(100, Math.max(0, ((p.usd - r.lo) / (r.hi - r.lo)) * 100)) : null;
                return (
                  <tr key={p.sym}>
                    <td><b>{p.sym}</b></td>
                    <td>{fmt(p.usd)}</td>
                    <td>{p.ch24 == null ? "–" : (p.ch24 >= 0 ? "+" : "") + p.ch24.toFixed(1) + "%"}</td>
                    <td>{pos == null ? <span className="note">–</span> : <span className="krange" role="img" aria-label={`${Math.round(pos)}% of the 1-month range, ${fmt(r!.lo)} to ${fmt(r!.hi)}`}><i style={{ left: pos + "%" }} /></span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p className="note">Live prices refresh every minute; the range uses the last 30 daily candles. The dated morning scan is in Briefs on the Court.</p>
      </div>
    </section>
  );
}
