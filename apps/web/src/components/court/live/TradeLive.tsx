"use client";

import { getOnce } from "@/lib/court/once";
import { useEffect, useState } from "react";
import { useCourt } from "../CourtState";
import { prettyDay, weekKey, sgtHourOf, stamp } from "@/lib/court/time";
import { water } from "@/lib/court/water";
import { contextAt, nearest, type Level } from "@/lib/ta";

// Life > Trade, ported from her swing trade ledger (formulas, checklist and mistake tags exactly as there),
// plus the stop/ATR review flags (docs/build-intel.md G). Tracks and explains only; no auto-trading, ever.
type Row = Record<string, unknown> & { id: string; at?: string };
type Settings = { account: number | null; risk_pct: number | null; rules: string[] };
type Ledger = { trades: Row[]; plans: Row[]; gamble: Row[]; settings: Settings | null };

export const CHECKS: [string, string, string][] = [
  ["c1", "Weekly bias written down", "Thesis and invalidation written before checking the current price."],
  ["c2", "Entering on a pullback, with a limit order at a planned level", "Not chasing the high or a green candle. Chasing has never worked for you."],
  ["c3", "Stop sits beyond the last swing low or high", "Outside the range's normal noise, not a few % under entry."],
  ["c4", "Size comes from the dollar risk", "Coins = risk ÷ stop distance. Not margin × leverage."],
  ["c5", "Liquidation is further away than the stop", "Checked on mark price."],
  ["c6", "It's between 6am and 11pm", "No late-night entries."],
  ["c7", "Not a re-entry after a stop-out in the last 24h", "Same coin, same day is a revenge-trade warning."],
  ["c8", "Backup alert set at the entry or stop", "So you don't have to watch the chart."],
  ["c9", "Not a memecoin", "Memecoins only on a day you've decided is a gamble day, from a separate gamble budget. Never from this account."],
];
const TAGS = ["Stop inside noise", "FOMO / market chase", "Chased the high", "Added to a losing position", "Memecoin", "No thesis written", "Oversized", "Late-night trade", "Revenge trade", "Moved the stop", "Exited early"];

const n = (v: unknown) => (v === "" || v == null ? null : isFinite(+v) ? +v : null);
const fmt = (v: number | null, d = 2) => (v == null ? "–" : (Math.round(v * 10 ** d) / 10 ** d).toLocaleString("en-SG"));
const usd = (v: number, sign = false) => (sign && v > 0 ? "+" : v < 0 ? "−" : "") + "$" + Math.abs(v).toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (v: number) => (v * 100).toFixed(1) + "%";
const uid = (p: string) => p + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
const sgtHour = (iso: string) => sgtHourOf(iso);
export const lateNight = (iso?: string) => !!iso && (sgtHour(iso) >= 23 || sgtHour(iso) < 6);

// The ledger's own trade maths: P&L from exit and size when not typed, R from the stop.
export function derive(t: Row) {
  const sgn = t.dir === "short" ? -1 : 1;
  const entry = n(t.entry), exit = n(t.exit), stop = n(t.stop), size = n(t.size);
  const pnl = n(t.pnl) ?? (exit != null && size != null && entry != null ? sgn * (exit - entry) * size : null);
  const R = exit != null && stop != null && entry != null && entry !== stop ? (sgn * (exit - entry)) / Math.abs(entry - stop) : null;
  const status = exit == null ? "open" : pnl != null ? (pnl > 0 ? "win" : pnl < 0 ? "loss" : "be") : R != null ? (R > 0 ? "win" : R < 0 ? "loss" : "be") : "be";
  return { pnl, R, status };
}
// Checklist score (of 9): the ledger stored a number in rules; this app also keeps the ticks in checks.
export function score(t: Row) {
  if (typeof t.rules === "number") return t.rules;
  const c = t.checks;
  return c && typeof c === "object" ? CHECKS.filter(([id]) => (c as Record<string, unknown>)[id]).length : null;
}
// Stop kept: the ledger has no separate figure, so it counts closed trades with a stop that were not tagged "Moved the stop".
export function stopKept(list: Row[]) {
  const withStop = list.filter((t) => n(t.stop) != null && (n(t.exit) != null || n(t.pnl) != null));
  const moved = withStop.filter((t) => Array.isArray(t.tags) && t.tags.includes("Moved the stop")).length;
  return { n: withStop.length, kept: withStop.length - moved, rate: withStop.length ? (withStop.length - moved) / withStop.length : null };
}
export function planStats(list: Row[]) {
  const trig = list.filter((p) => p.triggered).length;
  const placed = list.filter((p) => p.triggered && p.placed).length;
  const right = list.filter((p) => p.outcome === "right").length, wrong = list.filter((p) => p.outcome === "wrong").length;
  return { n: list.length, trig, placed, froze: trig - placed, freeze: trig ? (trig - placed) / trig : null, right, wrong, resolved: right + wrong, open: list.length - right - wrong };
}

// extras: the New-look Trades tab has its own log and sizer, so here it shows the rules, the ledger review (stop and
// ATR flags, plan stats), the plans and the gamble log.
export function TradeLive({ extras = false }: { extras?: boolean }) {
  const { k, update } = useCourt();
  const [L, setL] = useState<Ledger | null>(null);
  const [setup, setSetup] = useState(false);
  const [msg, setMsg] = useState("");
  const [period, setPeriod] = useState<"all" | "month" | "week">("all");

  useEffect(() => {
    getOnce<any>("/api/ledger").then((j) => {
      if (j.setup) { setSetup(true); return; }
      if (j.trades) setL(j);
      else setMsg("Could not load the ledger. Try again later.");
    }).catch(() => setMsg("Could not load the ledger. Try again later."));
  }, []);

  async function save(table: "trades" | "plans" | "gamble" | "ledger_settings", row: Record<string, unknown>, quiet = false) {
    const r = await fetch("/api/ledger", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table, row }) });
    const j = await r.json().catch(() => ({}));
    if (j.setup) { setSetup(true); return false; }
    if (!r.ok) { setMsg(j.error || "Could not save."); return false; }
    if (!quiet) setMsg("Saved.");
    if (table !== "ledger_settings" && j.row) setL((l) => l && { ...l, [table]: [j.row, ...l[table].filter((x) => x.id !== j.row.id)] });
    if (table === "ledger_settings") setL((l) => l && { ...l, settings: row as Settings });
    return true;
  }
  async function remove(table: "trades" | "plans" | "gamble", id: string) {
    const r = await fetch(`/api/ledger?table=${table}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (r.ok) setL((l) => l && { ...l, [table]: l[table].filter((x) => x.id !== id) });
  }
  // Logging a trade from a plan marks the plan as reached and placed, as the ledger did.
  async function saveTrade(row: Record<string, unknown>) {
    const ok = await save("trades", row);
    const p = row.plan_id && L?.plans.find((x) => x.id === row.plan_id);
    if (ok && p) await save("plans", { ...p, triggered: true, placed: true }, true);
    return ok;
  }

  if (setup) return <p className="note">The trade ledger needs one setup step first. See <b>docs/manual-steps.md</b>, section G.</p>;
  if (!L) return <p className="note">{msg || "Loading…"}</p>;

  const inPeriod = (r: Row) => period === "all" || (period === "month" ? String(r.date ?? "").slice(0, 7) === k.slice(0, 7) : String(r.date ?? "") >= weekKey(k));
  return (
    <div className="money trade">
      <p className="note xd">Fenn keeps your ledger. Everything here tracks and explains your own records; none of it is advice.</p>
      {msg && <p className="note" role="status">{msg}</p>}
      <Rules s={L.settings} onSave={async (row) => {
        const ok = await save("ledger_settings", row);
        // One record, three ticks: Small Wins a3 and grid 1.2 follow the three rule fields (merge 4).
        const full = ok && (row.rules as string[]).every((x) => x.trim());
        if (ok) update((d) => {
          const sw = { ...d.swins.done }, gr = { ...d.grid.done };
          if (full) { sw.a3 = true; gr["1.2"] = true; } else { delete sw.a3; delete gr["1.2"]; }
          d.swins = { ...d.swins, done: sw }; d.grid = { ...d.grid, done: gr };
        }, ["swins", "grid"]);
        if (ok) { water("milestone", "swins:a3", !!full, 2); water("grid", "grid:1.2", !!full); }
        return ok;
      }} />
      {!extras && <Sizer s={L.settings} />}
      <>
      <div className="ntabs" role="group" aria-label="Period">
        {(["all", "month", "week"] as const).map((p) => <button key={p} type="button" className="chipb" aria-pressed={period === p} onClick={() => setPeriod(p)}>{p === "all" ? "All trades" : p === "month" ? "This month" : "This week"}</button>)}
      </div>
      <Review trades={L.trades.filter(inPeriod)} plans={L.plans.filter(inPeriod)} account={L.settings?.account ?? null} /></>
      <Plans plans={L.plans} k={k} onSave={(r) => save("plans", r)} onRemove={(id) => remove("plans", id)} />
      {!extras && <Trades trades={L.trades.filter(inPeriod)} plans={L.plans} k={k} onSave={saveTrade} onRemove={(id) => remove("trades", id)} />}
      <Gamble rows={L.gamble ?? []} k={k} onSave={(r) => save("gamble", r)} onRemove={(id) => remove("gamble", id)} />
    </div>
  );
}

function Rules({ s, onSave }: { s: Settings | null; onSave: (row: Record<string, unknown>) => Promise<boolean> }) {
  const [acc, setAcc] = useState(s?.account != null ? String(s.account) : "");
  const [risk, setRisk] = useState(s?.risk_pct != null ? String(s.risk_pct) : "");
  const [rules, setRules] = useState<string[]>([0, 1, 2].map((i) => s?.rules?.[i] ?? ""));
  return (
    <>
      <div className="sec-h">My three rules</div>
      <p className="note xd">Read before every entry. Writing all three also ticks Small Wins a3 and grid 1.2.</p>
      {rules.map((x, i) => <input key={i} type="text" maxLength={140} placeholder={`Rule ${i + 1}`} aria-label={`Rule ${i + 1}`} value={x} onChange={(ev) => setRules(rules.map((y, j) => (j === i ? ev.target.value : y)))} />)}
      <div className="field-row">
        <input type="number" min="0" step="any" placeholder="Account (USD)" aria-label="Account" value={acc} onChange={(x) => setAcc(x.target.value)} />
        <input type="number" min="0" max="100" step="any" placeholder="Risk % per trade" aria-label="Risk percent" value={risk} onChange={(x) => setRisk(x.target.value)} />
        <button className="btn sm" type="button" onClick={() => onSave({ account: n(acc), risk_pct: n(risk), rules: rules.map((x) => x.trim()) })}>Save</button>
      </div>
    </>
  );
}

// The ledger's sizer: dollar risk from account and risk %, coins = risk ÷ stop distance, margin, liquidation.
function Sizer({ s }: { s: Settings | null }) {
  const [f, setF] = useState({ dir: "long", entry: "", stop: "", lev: "" });
  const entry = n(f.entry), stop = n(f.stop), lev = n(f.lev);
  const risk = ((s?.account ?? 0) * (s?.risk_pct ?? 0)) / 100, acct = s?.account ?? 0;
  const sgn = f.dir === "long" ? 1 : -1;
  let err = "", rows: [string, string][] = [], flags: [string, string][] = [];
  if (entry == null || stop == null || entry <= 0 || stop <= 0 || !lev || lev <= 0) err = "Enter an entry, a stop and leverage.";
  else if (sgn * (entry - stop) <= 0) err = f.dir === "long" ? "For a long, the stop has to sit below entry." : "For a short, the stop has to sit above entry.";
  else {
    const dist = Math.abs(entry - stop), size = risk / dist, notional = size * entry, margin = notional / lev, liq = entry * (1 - sgn / lev);
    const stopPct = dist / entry, liqPct = 1 / lev;
    rows = [["Dollar risk", usd(risk)], ["Stop distance", pct(stopPct)], ["Position size", fmt(size, 4) + " coins"], ["Notional", usd(notional)], [`Margin at ${lev}x`, usd(margin)],
      ["Exposure vs account", acct ? (notional / acct).toFixed(1) + "x" : "–"], ["Approx. liquidation", fmt(liq, 4) + " (" + pct(liqPct) + " away)"], ["Target 1R · 2R · 3R", [1, 2, 3].map((x) => fmt(entry + sgn * x * dist, 4)).join(" · ")]];
    if (liqPct <= stopPct) flags.push(["bad", `Liquidation (${pct(liqPct)} away) sits at or inside your stop (${pct(stopPct)} away). You'd be liquidated before the stop fills.`]);
    else if (liqPct < stopPct * 1.5) flags.push(["note", `Liquidation is only ${(liqPct / stopPct).toFixed(1)}× the stop distance. Once maintenance margin is counted it may sit close to your stop.`]);
    else flags.push(["ok", `Liquidation is ${(liqPct / stopPct).toFixed(1)}× further than your stop.`]);
    if (acct && margin > acct) flags.push(["bad", `Margin needed (${usd(margin)}) is more than the account (${usd(acct)}).`]);
  }
  return (
    <>
      <div className="sec-h">Position sizer</div>
      {!risk && <p className="note">Save your account and risk % above to size from your dollar risk.</p>}
      <div className="field-row">
        <select aria-label="Direction" value={f.dir} onChange={(e) => setF({ ...f, dir: e.target.value })}><option value="long">Long</option><option value="short">Short</option></select>
        <input type="number" step="any" placeholder="Entry" aria-label="Entry" value={f.entry} onChange={(e) => setF({ ...f, entry: e.target.value })} />
        <input type="number" step="any" placeholder="Stop" aria-label="Stop" value={f.stop} onChange={(e) => setF({ ...f, stop: e.target.value })} />
        <input type="number" step="any" min="1" placeholder="Leverage" aria-label="Leverage" value={f.lev} onChange={(e) => setF({ ...f, lev: e.target.value })} />
      </div>
      {err ? <p className="note">{err}</p> : rows.map(([a, b]) => <div className="filed-row" key={a}><span>{a}</span><span>{b}</span></div>)}
      {flags.map(([c, t]) => <p key={t} className={"note flag-" + c}>{c === "ok" ? "✓" : "⚑"} {t}</p>)}
    </>
  );
}

function Review({ trades, plans, account }: { trades: Row[]; plans: Row[]; account: number | null }) {
  const list = trades.map((t) => ({ t, d: derive(t) }));
  const closed = list.filter((x) => x.d.status !== "open");
  const wins = closed.filter((x) => x.d.status === "win").length;
  const rs = closed.map((x) => x.d.R).filter((r): r is number => r != null);
  const wR = rs.filter((r) => r > 0), lR = rs.filter((r) => r < 0);
  const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
  const wr = rs.length ? wR.length / rs.length : 0, lr = rs.length ? lR.length / rs.length : 0;
  const exp = rs.length ? wr * avg(wR) - lr * Math.abs(avg(lR)) : null;
  const pnl = closed.map((x) => x.d.pnl).filter((v): v is number => v != null).reduce((a, b) => a + b, 0);
  const sc = trades.map(score).filter((v): v is number => v != null);
  const ps = planStats(plans);
  const sk = stopKept(trades);
  const open = list.length - closed.length;
  const exec: [string, string, string][] = [
    ["Plans written", String(ps.n), ps.n ? ps.trig + " reached entry" : "none yet"],
    ["Freeze rate", ps.freeze != null ? Math.round(ps.freeze * 100) + "%" : "–", ps.trig ? ps.froze + " froze of " + ps.trig + " triggered" : "no plans triggered yet"],
    ["Thesis hit rate", ps.resolved ? Math.round((ps.right / ps.resolved) * 100) + "%" : "–", ps.resolved ? ps.right + " right of " + ps.resolved + " resolved" : ps.open ? ps.open + " still open" : "no theses yet"],
    ["Stop kept", sk.rate != null ? Math.round(sk.rate * 100) + "%" : "–", sk.n ? sk.kept + " of " + sk.n + " closed with a stop" : "no closed trades with a stop"],
    ["Checklist", sc.length ? (sc.reduce((a, b) => a + b, 0) / sc.length).toFixed(1) + " / 9" : "–", sc.length ? "average before entry" : "not scored yet"],
  ];
  const res: [string, string, string][] = [
    ["Trades", String(list.length), open ? open + " still open" : list.length ? "all closed" : "none yet"],
    ["Win rate", closed.length ? Math.round((wins / closed.length) * 100) + "%" : "–", closed.length ? wins + " of " + closed.length + " closed" : "no closed trades"],
    ["Expectancy", exp == null ? "–" : (exp >= 0 ? "+" : "−") + Math.abs(exp).toFixed(2) + " R", rs.length ? `${Math.round(wr * 100)}% × ${avg(wR).toFixed(1)}R − ${Math.round(lr * 100)}% × ${Math.abs(avg(lR)).toFixed(1)}R` : "needs trades with a stop"],
    ["Net P&L", closed.length ? usd(pnl, true) : "–", account && closed.length ? ((pnl / account) * 100).toFixed(1) + "% of account" : "realised only"],
  ];
  const counts = TAGS.map((tag) => [tag, trades.filter((t) => Array.isArray(t.tags) && t.tags.includes(tag)).length] as const).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const late = trades.filter((t) => lateNight(t.at)).length;
  const tile = ([a, b, c]: [string, string, string]) => <div className="tile" key={a}><span className="note">{a}</span><b>{b}</b><span className="note">{c}</span></div>;
  return (
    <>
      <div className="sec-h">Execution</div><div className="tiles">{exec.map(tile)}</div>
      <div className="sec-h">Results</div><div className="tiles">{res.map(tile)}</div>
      {late > 0 && <p className="note">{late} trade{late === 1 ? "" : "s"} placed between 11pm and 6am (from the time logged).</p>}
      <p className="note">Gamble results are kept apart and never counted here.</p>
      {(() => {
        const ctxOf = (t: Row) => (t.checks && typeof t.checks === "object" ? (t.checks as Record<string, unknown>).ctx : null) as string | null;
        const groups = ["near support", "mid-range", "near resistance"].map((g) => { const xs = closed.filter((x) => ctxOf(x.t) === g); return { g, n: xs.length, w: xs.filter((x) => x.d.status === "win").length }; }).filter((x) => x.n);
        return groups.length ? <>
          <div className="sec-h">Where your entries sat</div>
          {groups.map((x) => <div className="filed-row" key={x.g}><span>{x.g}</span><span>{x.n} closed · {Math.round((x.w / x.n) * 100)}% wins</span></div>)}
          <p className="note">From daily levels at the time each trade was logged. Your own pattern, not a rule.</p>
        </> : null;
      })()}
      <div className="sec-h">Recurring mistakes</div>
      {counts.length ? counts.map(([g, c]) => <div className="filed-row" key={g}><span>{g}</span><span>{c}×</span></div>) : <p className="note">No mistakes tagged in this period.</p>}
    </>
  );
}

function Checks({ value, onChange }: { value: Record<string, boolean>; onChange: (v: Record<string, boolean>) => void }) {
  const c = CHECKS.filter(([id]) => value[id]).length;
  return (
    <fieldset className="checks">
      <legend className="note">Before you enter ({c}/9{c === 9 ? " · ready" : ""})</legend>
      <span className="note">Tick these for the trade in front of you. The score carries into the log.</span>
      {CHECKS.map(([id, t, d]) => <label key={id} className="chk"><input type="checkbox" checked={!!value[id]} onChange={(e) => onChange({ ...value, [id]: e.target.checked })} /> <span><span>{t}</span><span className="note chk-d">{d}</span></span></label>)}
    </fieldset>
  );
}

// Daily technicals for one coin from /api/ta, shared by plan cards, the checklist and trade context.
type Ta = { ok: boolean; reason?: string; lastCandle?: string; source?: string; snap?: { last: number; atr: number | null; ema50: number | null; ema200: number | null; lv: Level[]; lineNow: { kind: string; y: number; broken: boolean }[]; words: string[] } | null };
const taCache = new Map<string, Promise<Ta>>();
function getTa(sym: string): Promise<Ta> {
  if (!taCache.has(sym)) taCache.set(sym, fetch(`/api/ta?tf=1d&sym=${sym}`).then((r) => r.json()).then((j) => j.items?.[0] ?? { ok: false, reason: "not reachable" }).catch(() => ({ ok: false, reason: "not reachable" })));
  return taCache.get(sym)!;
}
const symOf = (inst: unknown) => String(inst ?? "").toUpperCase().replace(/[^A-Z0-9].*$/, "");
function useTa(inst: unknown, on = true) {
  const sym = symOf(inst);
  const [ta, setTa] = useState<Ta | null>(null);
  useEffect(() => { setTa(null); if (on && sym.length >= 2) getTa(sym).then(setTa); }, [sym, on]);
  return ta;
}

// Sections G and G2: information only, never blocking. ATR and levels come from fetched daily candles.
function PlanFlags({ p }: { p: Row }) {
  const [on, setOn] = useState(false);
  const ta = useTa(p.inst, on);
  const entry = n(p.entry), stop = n(p.stop), target = n(p.target), long = p.dir !== "short";
  if (entry == null || !entry) return null;
  if (!on) return <div className="note"><button className="btn sm ghost" type="button" onClick={() => setOn(true)}>Check against the chart</button></div>;
  if (!ta) return <p className="note">Reading daily candles…</p>;
  if (!ta.ok || !ta.snap) return <p className="note">Chart data not available for {symOf(p.inst)} ({ta.reason}).</p>;
  const s = ta.snap, a = s.atr, { below, above } = nearest(s.lv, entry);
  const pct = (x: number) => ((Math.abs(x - entry) / entry) * 100).toFixed(1) + "%";
  const inAtr = (x: number) => (a ? (Math.abs(x - entry) / a).toFixed(1) + " ATR" : "");
  const dist = stop != null ? Math.abs(entry - stop) : null;
  const flags: string[] = [];
  if (dist != null && a != null && dist < a) flags.push(`Stop is under 1 daily ATR from entry (${fmt(dist)} vs ATR ${fmt(a)}).`);
  if (dist != null && dist / entry > 0.3) flags.push("Stop is more than 30% from entry.");
  const guard = long ? below : above;
  if (stop != null && guard && Math.abs(stop - guard.p) / guard.p <= 0.005) flags.push(`Stop sits inside the ${long ? "support" : "resistance"} zone at ${fmt(guard.p)}, not beyond it.`);
  const wall = long ? above : below;
  if (target != null && wall && (long ? target <= wall.p && (wall.p - target) / wall.p <= 0.01 : target >= wall.p && (target - wall.p) / wall.p <= 0.01)) flags.push(`Target is just ${long ? "below resistance" : "above support"} at ${fmt(wall.p)}.`);
  const broken = s.lineNow.find((l) => l.broken);
  if (broken) flags.push(`Entry is ${entry >= broken.y ? "above" : "below"} a broken ${broken.kind} line (now near ${fmt(broken.y)}).`);
  const rrNext = dist && wall ? Math.abs(wall.p - entry) / dist : null;
  const rr = target != null && dist ? Math.abs(target - entry) / dist : null;
  const closestLine = [...s.lineNow].sort((x, y) => Math.abs(x.y - entry) - Math.abs(y.y - entry))[0];
  return (
    <div className="note">
      {below && <>Support below entry {fmt(below.p)} ({pct(below.p)}{a ? ", " + inAtr(below.p) : ""}). </>}
      {above && <>Resistance above entry {fmt(above.p)} ({pct(above.p)}{a ? ", " + inAtr(above.p) : ""}). </>}
      {closestLine && <>Closest auto line: {closestLine.kind}, {closestLine.broken ? "broken" : "intact"}, near {fmt(closestLine.y)}. </>}
      {rr != null && <>Risk/reward {fmt(rr)} : 1. </>}
      {rrNext != null && <>Risk/reward to the next {long ? "resistance" : "support"} is {fmt(rrNext)} : 1. </>}
      {a != null && <>Daily ATR(14) {fmt(a)}. </>}
      <>{ta.source}, last candle {ta.lastCandle ? stamp(ta.lastCandle) : ""}. </>
      {flags.map((f) => <span key={f} className="flag"> ⚑ {f}</span>)}
      <> Review prompts from the chart, not advice; thresholds, not rules.</>
    </div>
  );
}

// Read-only lines under the checklist that fill themselves from the chart; her own ticks stay hers.
function ChartLines({ inst }: { inst: string }) {
  const ta = useTa(inst);
  if (!symOf(inst) || !ta?.snap) return null;
  const s = ta.snap, trend = [s.ema50 != null ? `${s.last >= s.ema50 ? "above" : "below"} the 50 EMA` : "", s.ema200 != null ? `${s.last >= s.ema200 ? "above" : "below"} the 200 EMA` : ""].filter(Boolean).join(", ");
  const nr = nearest(s.lv, s.last), lvl = [nr.below, nr.above].filter((x): x is Level => !!x).sort((x, y) => Math.abs(x.p - s.last) - Math.abs(y.p - s.last))[0];
  return (
    <div className="note chartlines">
      <div>From the chart (daily, read only): trend {trend || "not enough data"}</div>
      {lvl && <div>Level nearby: {lvl.kind} {fmt(lvl.p)} ({((Math.abs(lvl.p - s.last) / s.last) * 100).toFixed(1)}% away)</div>}
      {s.lineNow.map((l, i) => <div key={i}>{l.kind} line {l.broken ? "broken" : "intact"}</div>)}
    </div>
  );
}

function Plans({ plans, k, onSave, onRemove }: { plans: Row[]; k: string; onSave: (r: Record<string, unknown>) => Promise<boolean>; onRemove: (id: string) => void }) {
  const blank = { inst: "", dir: "long", entry: "", stop: "", target: "", until: "", narrative: "", seen_where: "", thesis: "", wrong: "", stage: "", confidence: "", share_x: false, checks: {} as Record<string, boolean> };
  const [f, setF] = useState(blank);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const go = (e: Event) => {
      // From a chart: pre-fill asset and entry zone; she writes the thesis and stop herself.
      const d = (e as CustomEvent<{ inst?: string; entry?: number }>).detail;
      if (d?.inst) setF((f) => ({ ...f, inst: d.inst!, entry: d.entry != null ? String(+d.entry.toPrecision(6)) : f.entry }));
      setOpen(true); setTimeout(() => document.getElementById("planForm")?.scrollIntoView({ block: "start" }), 80);
    };
    window.addEventListener("1wan:write-thesis", go); return () => window.removeEventListener("1wan:write-thesis", go);
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.inst.trim() || !f.thesis.trim()) return;
    const ok = await onSave({ ...f, id: uid("p"), date: k, inst: f.inst.trim().toUpperCase(), entry: n(f.entry), stop: n(f.stop), target: n(f.target), until: f.until || null, confidence: n(f.confidence), outcome: "open", at: new Date().toISOString() });
    if (ok) { setF(blank); setOpen(false); }
  }
  const set = (key: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [key]: e.target.value });
  // Freeze rate by month, last six months: triggered plans that were not placed.
  const by: Record<string, { t: number; f: number }> = {};
  plans.forEach((p) => { if (!p.triggered || !p.date) return; const m = String(p.date).slice(0, 7); by[m] = by[m] || { t: 0, f: 0 }; by[m].t++; if (!p.placed) by[m].f++; });
  const months = Object.keys(by).sort().slice(-6);
  return (
    <>
      <div className="sec-h">Plans and thesis log ({plans.length})</div>
      <p className="note xd">Write the plan before the trade exists. Tick "Price reached entry" when it gets there, and "Order placed" if you place it. A plan that triggers without an order counts as a freeze.</p>
      <details id="planForm" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
        <summary className="btn sm">Write a plan / thesis</summary>
        <form className="field" onSubmit={submit}>
          <div className="field-row">
            <input type="text" maxLength={20} placeholder="Instrument, for example BTC" aria-label="Instrument" value={f.inst} onChange={set("inst")} required />
            <select aria-label="Direction" value={f.dir} onChange={set("dir")}><option value="long">Long</option><option value="short">Short</option></select>
          </div>
          <textarea maxLength={600} placeholder="Narrative: what story is forming?" aria-label="Narrative" value={f.narrative} onChange={set("narrative")} />
          <input type="text" maxLength={120} placeholder="Where I saw it (flows, on-chain, headlines, CT)" aria-label="Where I saw it" value={f.seen_where} onChange={set("seen_where")} />
          <div className="field-row">
            <select aria-label="Stage" value={f.stage} onChange={set("stage")}><option value="">Stage</option><option value="early">Early</option><option value="building">Building</option><option value="crowded">Crowded</option></select>
            <select aria-label="Confidence" value={f.confidence} onChange={set("confidence")}><option value="">Confidence</option><option value="1">Low</option><option value="2">Medium</option><option value="3">High</option></select>
          </div>
          <textarea maxLength={600} placeholder="Thesis: what you expect to happen, and why" aria-label="Thesis" value={f.thesis} onChange={set("thesis")} required />
          <textarea maxLength={400} placeholder="What would prove it wrong (an event or price level, not a feeling)" aria-label="What would prove it wrong" value={f.wrong} onChange={set("wrong")} />
          <div className="field-row">
            <input type="number" step="any" placeholder="Entry" aria-label="Entry" value={f.entry} onChange={set("entry")} />
            <input type="number" step="any" placeholder="Stop" aria-label="Stop" value={f.stop} onChange={set("stop")} />
            <input type="number" step="any" placeholder="Target" aria-label="Target" value={f.target} onChange={set("target")} />
          </div>
          <label className="note">Timeframe ends <input type="date" value={f.until} onChange={set("until")} /></label>
          <label><input type="checkbox" checked={f.share_x} onChange={(e) => setF({ ...f, share_x: e.target.checked })} /> A thread or trend note for X in this</label>
          <Checks value={f.checks} onChange={(checks) => setF({ ...f, checks })} />
          <ChartLines inst={f.inst} />
          <button className="btn" type="submit">Save plan</button>
        </form>
      </details>
      {plans.map((p) => {
        const out = String(p.outcome ?? "open");
        const ended = !!p.until && String(p.until) < k && out === "open";
        return (
          <div className="filed-row col" key={p.id}>
            <span><b>{String(p.inst ?? "Untitled")}</b> {p.dir === "short" ? "Short" : "Long"} <span className="note">{!p.triggered ? "Waiting" : p.placed ? "Placed" : "Froze"}{out !== "open" ? " · thesis " + out : ""}{p.date ? " · written " + prettyDay(String(p.date)) : ""}{p.until ? " · ends " + prettyDay(String(p.until)) : ""}</span></span>
            {!!p.thesis && <span className="note">{String(p.thesis)}</span>}
            {!!p.wrong && <span className="note"><b>Wrong if:</b> {String(p.wrong)}</span>}
            {ended && <span className="note">The timeframe has ended. Mark the thesis right or wrong.</span>}
            <PlanFlags p={p} />
            <span className="rep-act">
              <label><input type="checkbox" checked={!!p.triggered} onChange={(e) => onSave({ ...p, triggered: e.target.checked })} /> Price reached entry</label>
              <label><input type="checkbox" checked={!!p.placed} onChange={(e) => onSave({ ...p, placed: e.target.checked })} /> Order placed</label>
              <select aria-label="Thesis outcome" value={out} onChange={(e) => onSave({ ...p, outcome: e.target.value })}><option value="open">Open</option><option value="right">Right</option><option value="wrong">Wrong</option></select>
              <button className="btn sm ghost" type="button" onClick={() => onRemove(p.id)}>Delete</button>
            </span>
          </div>
        );
      })}
      {months.length > 0 && (
        <>
          <p className="note">Freeze rate by month · aim for 0%</p>
          {months.map((m) => <div className="filed-row" key={m}><span>{m}</span><span className="mbar" style={{ flex: 1 }}><i style={{ width: (by[m].f / by[m].t) * 100 + "%" }} /></span><span>{Math.round((by[m].f / by[m].t) * 100)}%</span></div>)}
        </>
      )}
    </>
  );
}

function Trades({ trades, plans, k, onSave, onRemove }: { trades: Row[]; plans: Row[]; k: string; onSave: (r: Record<string, unknown>) => Promise<boolean>; onRemove: (id: string) => void }) {
  const blank = { date: k, inst: "", dir: "long", entry: "", stop: "", exit: "", size: "", lev: "", pnl: "", setup: "", lesson: "", plan_id: "", tags: [] as string[], checks: {} as Record<string, boolean> };
  const [f, setF] = useState(blank);
  const set = (key: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [key]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.inst.trim() || n(f.entry) == null) return;
    // Level context at entry, from daily candles, kept with the trade so review tiles can group results.
    const ta = await getTa(symOf(f.inst)), e0 = n(f.entry);
    const ctx = ta.snap && e0 != null ? contextAt(e0, ta.snap.lv, ta.snap.atr) : null;
    const ok = await onSave({ ...f, checks: { ...f.checks, ...(ctx ? { ctx } : {}) }, id: uid("t"), inst: f.inst.trim().toUpperCase(), entry: n(f.entry), stop: n(f.stop), exit: n(f.exit), size: n(f.size), lev: n(f.lev), pnl: n(f.pnl), plan_id: f.plan_id || null,
      rules: CHECKS.filter(([id]) => f.checks[id]).length, at: new Date().toISOString() });
    if (ok) setF(blank);
  }
  return (
    <>
      <div className="sec-h">Trade log ({trades.length})</div>
      <details>
        <summary className="btn sm">Log a trade</summary>
        <form className="field" onSubmit={submit}>
          <div className="field-row">
            <input type="date" aria-label="Date" value={f.date} onChange={set("date")} />
            <input type="text" maxLength={20} placeholder="Instrument" aria-label="Instrument" value={f.inst} onChange={set("inst")} required />
            <select aria-label="Direction" value={f.dir} onChange={set("dir")}><option value="long">Long</option><option value="short">Short</option></select>
          </div>
          <div className="field-row">
            <input type="number" step="any" placeholder="Entry" aria-label="Entry" value={f.entry} onChange={set("entry")} required />
            <input type="number" step="any" placeholder="Stop" aria-label="Stop" value={f.stop} onChange={set("stop")} />
            <input type="number" step="any" placeholder="Exit (blank if open)" aria-label="Exit" value={f.exit} onChange={set("exit")} />
          </div>
          <div className="field-row">
            <input type="number" step="any" placeholder="Size (coins)" aria-label="Size" value={f.size} onChange={set("size")} />
            <input type="number" step="any" placeholder="Leverage" aria-label="Leverage" value={f.lev} onChange={set("lev")} />
            <input type="number" step="any" placeholder="P&L (blank: from exit)" aria-label="P and L" value={f.pnl} onChange={set("pnl")} />
          </div>
          <select aria-label="From plan" value={f.plan_id} onChange={set("plan_id")}><option value="">Not from a plan</option>{plans.map((p) => <option key={p.id} value={p.id}>{String(p.inst)} {String(p.dir)} {p.date ? prettyDay(String(p.date)) : ""}</option>)}</select>
          <input type="text" maxLength={120} placeholder="Setup" aria-label="Setup" value={f.setup} onChange={set("setup")} />
          <textarea maxLength={400} placeholder="Lesson" aria-label="Lesson" value={f.lesson} onChange={set("lesson")} />
          <Checks value={f.checks} onChange={(checks) => setF({ ...f, checks })} />
          <ChartLines inst={f.inst} />
          <fieldset className="checks"><legend className="note">Mistakes on this trade</legend>
            {TAGS.map((t) => <label key={t}><input type="checkbox" checked={f.tags.includes(t)} onChange={(e) => setF({ ...f, tags: e.target.checked ? [...f.tags, t] : f.tags.filter((x) => x !== t) })} /> {t}</label>)}
          </fieldset>
          <button className="btn" type="submit">Save trade</button>
        </form>
      </details>
      {trades.slice(0, 50).map((t) => {
        const d = derive(t), s = score(t);
        return (
          <div className="filed-row" key={t.id}>
            <span><b>{String(t.inst ?? "")}</b> {t.dir === "short" ? "Short" : "Long"}{n(t.lev) ? " " + n(t.lev) + "x" : ""} <span className="note">{t.date ? prettyDay(String(t.date)) : ""} · {d.status}{d.pnl != null ? " · " + usd(d.pnl, true) : ""}{d.R != null ? " · " + (d.R >= 0 ? "+" : "") + d.R.toFixed(2) + "R" : ""}{s != null ? " · checklist " + s + "/9" : ""}</span>
              {Array.isArray(t.tags) && t.tags.length > 0 && <span className="note"> · {t.tags.join(", ")}</span>}</span>
            <button className="btn sm ghost" type="button" onClick={() => onRemove(t.id)}>Delete</button>
          </div>
        );
      })}
    </>
  );
}

function Gamble({ rows, k, onSave, onRemove }: { rows: Row[]; k: string; onSave: (r: Record<string, unknown>) => Promise<boolean>; onRemove: (id: string) => void }) {
  const [f, setF] = useState({ what: "", pnl: "", note: "" });
  const total = rows.reduce((a, r) => a + (n(r.pnl) ?? 0), 0);
  return (
    <details>
      <summary className="sec-h">Gamble log ({rows.length}), kept out of trading stats</summary>
      <p className="note">Memecoins and casino money go here, not in the trade log, so win rate and expectancy only measure your process.</p>
      <div className="filed-row"><span>Total</span><span>{usd(total, true)}</span></div>
      <form className="field" onSubmit={async (e) => { e.preventDefault(); if (!f.what.trim()) return; if (await onSave({ id: uid("g"), date: k, what: f.what.trim(), pnl: n(f.pnl), note: f.note.trim() || null, at: new Date().toISOString() })) setF({ what: "", pnl: "", note: "" }); }}>
        <div className="field-row">
          <input type="text" maxLength={60} placeholder="What" aria-label="What" value={f.what} onChange={(e) => setF({ ...f, what: e.target.value })} />
          <input type="number" step="any" placeholder="Result" aria-label="Result" value={f.pnl} onChange={(e) => setF({ ...f, pnl: e.target.value })} />
          <button className="btn sm" type="submit">Add</button>
        </div>
      </form>
      {rows.slice(0, 30).map((r) => (
        <div className="filed-row" key={r.id}>
          <span>{String(r.what ?? "")} <span className="note">{r.date ? prettyDay(String(r.date)) : ""} · {usd(n(r.pnl) ?? 0, true)}</span></span>
          <button className="btn sm ghost" type="button" onClick={() => onRemove(r.id)}>Delete</button>
        </div>
      ))}
    </details>
  );
}
