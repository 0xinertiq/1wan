"use client";

import { useEffect, useRef, useState } from "react";
import { useCourt } from "../CourtState";
import { ema, fmt, type Candle, type Snapshot } from "@/lib/ta";
import type { ChartLine } from "@/lib/court/state";

// Watchlist technicals (docs/build-intel.md K): plain-words state per coin, a chart with EMAs, auto lines
// and her own lines. A chart description of her own watchlist, never advice, signals or targets.
type Item = { sym: string; ok: boolean; reason?: string; tf: string; source: string; fetched: string; lastCandle: string; snap: (Omit<Snapshot, "lines"> & { lines: Omit<Snapshot["lines"][number], "at">[] }) | null; candles?: Candle[] };
const TFS = ["1h", "4h", "1d"] as const;
const sgt = (iso: string) => new Date(iso).toLocaleString("en-SG", { timeZone: "Asia/Singapore", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function TechLive() {
  const { prices } = useCourt();
  const syms = prices?.prices.map((p) => p.sym) ?? ["BTC", "ETH", "SOL"];
  const [tf, setTf] = useState<(typeof TFS)[number]>("4h");
  const [items, setItems] = useState<Item[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
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
            {it.snap && <button className="btn sm ghost" type="button" onClick={() => setOpen(open === it.sym ? null : it.sym)}>{open === it.sym ? "Hide chart" : "Chart"}</button>}
            {open === it.sym && <Chart sym={it.sym} tf={tf} />}
          </div>
        ))}
        <p className="note">Chart description of your own watchlist, not advice. Candles from Crypto.com Exchange; auto lines are drawn from price history, a description, not a signal.</p>
      </div>
    </section>
  );
}

function Chart({ sym, tf }: { sym: string; tf: string }) {
  const { st, update } = useCourt();
  const box = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<Item | null>(null);
  const [mode, setMode] = useState<"none" | "level" | "line">("none");
  const [first, setFirst] = useState<{ t: number; p: number } | null>(null);
  const modeRef = useRef(mode), firstRef = useRef(first);
  modeRef.current = mode; firstRef.current = first;
  const mine = st.lines.filter((l) => l.sym === sym && l.tf === tf);

  useEffect(() => { fetch(`/api/ta?tf=${tf}&sym=${sym}&candles=1`).then((r) => r.json()).then((j) => setData(j.items?.[0] ?? null)).catch(() => {}); }, [sym, tf]);

  useEffect(() => {
    if (!box.current || !data?.candles?.length) return;
    let chart: import("lightweight-charts").IChartApi | null = null;
    let alive = true;
    import("lightweight-charts").then(({ createChart, LineStyle }) => {
      if (!alive || !box.current) return;
      const css = getComputedStyle(document.documentElement);
      // Colours come from the tokens (kumo-tokens.css, chart colours).
      const tok = (n: string) => css.getPropertyValue(n).trim();
      const ink = tok("--ink") || tok("--k-chart-ink");
      chart = createChart(box.current, { height: 300, layout: { background: { color: "transparent" }, textColor: ink }, grid: { vertLines: { visible: false }, horzLines: { color: tok("--k-chart-grid") } }, timeScale: { timeVisible: tf !== "1d" } });
      const cs = data.candles!, T = (t: number) => (Math.floor(t / 1000) + 8 * 3600) as import("lightweight-charts").UTCTimestamp;
      const s = chart.addCandlestickSeries({ upColor: tok("--k-chart-up"), downColor: tok("--k-chart-down"), borderVisible: false, wickUpColor: tok("--k-chart-up"), wickDownColor: tok("--k-chart-down") });
      s.setData(cs.map((c) => ({ time: T(c.t), open: c.o, high: c.h, low: c.l, close: c.c })));
      const vol = chart.addHistogramSeries({ priceScaleId: "vol", color: tok("--k-chart-vol"), priceFormat: { type: "volume" } });
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
      vol.setData(cs.map((c) => ({ time: T(c.t), value: c.v })));
      const closes = cs.map((c) => c.c);
      for (const [n, col] of [[50, tok("--k-chart-ma50")], [200, tok("--k-chart-ma200")]] as const) {
        const e = ema(closes, n);
        chart.addLineSeries({ color: col, lineWidth: 1, priceLineVisible: false, lastValueVisible: false }).setData(cs.map((c, i) => (e[i] == null ? null : { time: T(c.t), value: e[i]! })).filter(Boolean) as { time: import("lightweight-charts").UTCTimestamp; value: number }[]);
      }
      // Auto lines, from the first swing point to the last candle.
      for (const l of data.snap?.lines ?? []) {
        const pts = [{ time: T(cs[l.from.i].t), value: l.icpt + l.slope * l.from.i }, { time: T(cs[cs.length - 1].t), value: l.icpt + l.slope * (cs.length - 1) }];
        chart.addLineSeries({ color: l.broken ? tok("--k-chart-off") : tok("--k-chart-line"), lineWidth: 2, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false }).setData(pts);
      }
      // Her own levels and lines.
      for (const l of mine) {
        if (l.kind === "level") s.createPriceLine({ price: l.p1.p, color: tok("--k-chart-ma50"), lineWidth: 2, lineStyle: LineStyle.Solid, axisLabelVisible: true, title: l.label || "my level" });
        else if (l.p2) chart.addLineSeries({ color: tok("--k-chart-ma50"), lineWidth: 2, priceLineVisible: false, lastValueVisible: false }).setData([{ time: T(Math.min(l.p1.t, l.p2.t)), value: l.p1.t < l.p2.t ? l.p1.p : l.p2.p }, { time: T(Math.max(l.p1.t, l.p2.t)), value: l.p1.t < l.p2.t ? l.p2.p : l.p1.p }]);
      }
      chart.timeScale().fitContent();
      chart.subscribeClick((pt) => {
        if (modeRef.current === "none" || !pt.point || pt.time == null) return;
        const p = s.coordinateToPrice(pt.point.y);
        if (p == null) return;
        const t = ((pt.time as number) - 8 * 3600) * 1000;
        if (modeRef.current === "level") { save({ kind: "level", p1: { t, p } }); setMode("none"); }
        else if (!firstRef.current) setFirst({ t, p });
        else { save({ kind: "line", p1: firstRef.current, p2: { t, p } }); setFirst(null); setMode("none"); }
      });
    });
    return () => { alive = false; chart?.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, mine.length]);

  const save = (l: Omit<ChartLine, "id" | "sym" | "tf" | "label">) => update((d) => { d.lines = [...d.lines, { ...l, id: "l" + Date.now().toString(36), sym, tf, label: "" }].slice(-200); }, ["lines"]);
  const startPlan = () => window.dispatchEvent(new CustomEvent("1wan:write-thesis", { detail: { inst: sym, entry: data?.snap?.last, atr: data?.snap?.atr } }));

  return (
    <div className="techchart">
      {!data ? <p className="note">Loading chart…</p> : <>
        <div ref={box} className="tc-box" />
        <p className="note">{data.source} · {data.tf} · last candle {sgt(data.lastCandle)} · gold: 50 EMA, plum: 200 EMA, dashed: auto lines{mine.length ? ", gold solid: yours" : ""}</p>
        <div className="rep-act">
          <button className="btn sm ghost" type="button" aria-pressed={mode === "level"} onClick={() => { setMode(mode === "level" ? "none" : "level"); setFirst(null); }}>{mode === "level" ? "Tap the chart…" : "Add a level"}</button>
          <button className="btn sm ghost" type="button" aria-pressed={mode === "line"} onClick={() => { setMode(mode === "line" ? "none" : "line"); setFirst(null); }}>{mode === "line" ? (first ? "Tap the second point…" : "Tap the first point…") : "Draw a line"}</button>
          <a className="btn sm" href="#life" onClick={startPlan}>Start a plan from this chart</a>
        </div>
        {mine.length > 0 && <details><summary className="note">My lines on {sym} {tf} ({mine.length})</summary>
          {mine.map((l) => <div className="filed-row" key={l.id}><span>{l.kind === "level" ? `Level ${fmt(l.p1.p)}` : `Line ${fmt(l.p1.p)} → ${fmt(l.p2!.p)}`}</span><button className="btn sm ghost" type="button" onClick={() => update((d) => { d.lines = d.lines.filter((x) => x.id !== l.id); }, ["lines"])}>Remove</button></div>)}
        </details>}
      </>}
    </div>
  );
}
