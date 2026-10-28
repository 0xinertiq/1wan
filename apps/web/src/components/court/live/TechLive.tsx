"use client";

import { useEffect, useState } from "react";
import { useCourt } from "../CourtState";
import { fmt, type Candle, type Snapshot } from "@/lib/ta";
import { stamp } from "@/lib/court/time";

// Watchlist technicals (docs/build-intel.md K): plain-words state per coin with its EMA lines, perpetual funding
// and open interest. Round 7: no chart button (she charts in TradingView); her saved chart lines stay in her state.
// A description of her own watchlist, never advice, signals or targets.
type Item = { sym: string; ok: boolean; reason?: string; tf: string; source: string; fetched: string; lastCandle: string; snap: (Omit<Snapshot, "lines"> & { lines: Omit<Snapshot["lines"][number], "at">[] }) | null; candles?: Candle[] };
const TFS = ["1h", "4h", "1d"] as const;
const sgt = (iso: string) => stamp(iso);

export function TechLive() {
  const { prices } = useCourt();
  const syms = prices?.prices.map((p) => p.sym) ?? ["BTC", "ETH", "SOL"];
  const [tf, setTf] = useState<(typeof TFS)[number]>("4h");
  const [items, setItems] = useState<Item[] | null>(null);
  const [der, setDer] = useState<Record<string, { ok: boolean; source?: string; funding?: number; oiUsd?: number; vol24hUsd?: number }>>({});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetch(`/api/derivs?syms=${syms.join(",")}`).then((r) => r.json()).then((j) => { const m: typeof der = {}; for (const x of j.items ?? []) m[x.sym] = x; setDer(m); }).catch(() => {}); }, [syms.join(",")]);
  const big = (x?: number) => (x == null ? "-" : x >= 1e9 ? "$" + (x / 1e9).toFixed(2) + "B" : "$" + (x / 1e6).toFixed(0) + "M");
  useEffect(() => {
    setItems(null);
    fetch(`/api/ta?tf=${tf}&syms=${syms.join(",")}`).then((r) => r.json()).then((j) => setItems(j.items ?? [])).catch(() => setItems([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tf, syms.join(",")]);

  return (
    <section className="win" id="techWin" aria-labelledby="techT">
      <div className="win-title"><h2 id="techT">Technicals</h2><span className="sub"><span className="livetag">Live</span> Fenn · {tf}</span></div>
      <div className="win-body">
        <div className="ntabs" role="group" aria-label="Timeframe">{TFS.map((x) => <button key={x} className="chipb" type="button" aria-pressed={tf === x} onClick={() => setTf(x)}>{x}</button>)}</div>
        {items == null ? <p className="note">Reading candles…</p> : items.map((it) => (
          <div className="filed-row col" key={it.sym}>
            <span><b>{it.sym}</b> {it.snap ? <span className="note">{fmt(it.snap.last)} · last candle {sgt(it.lastCandle)}</span> : <span className="note">{it.reason ?? "not enough candles"}</span>}</span>
            {it.snap && <span className="note">{it.snap.words.join(" · ")}</span>}
            {der[it.sym]?.ok && <span className="note">Perpetual: funding {(der[it.sym].funding! * 100).toFixed(4)}% per 8h · open interest {big(der[it.sym].oiUsd)} · 24h volume {big(der[it.sym].vol24hUsd)} · {der[it.sym].source}</span>}
          </div>
        ))}
        <p className="note">A description of your own watchlist, not advice. Candles from Crypto.com Exchange.</p>
      </div>
    </section>
  );
}
