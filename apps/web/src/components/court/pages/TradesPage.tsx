"use client";

import { useEffect, useMemo, useState } from "react";
import { getOnce } from "@/lib/court/once";
import { useCourt } from "../CourtState";
import { mdLite } from "../mdLite";
import type { BriefDoc } from "../BriefTabs";
import { todaysPlan, type PlanRow } from "@/components/kumo/briefParse";
import { noBigdata } from "@/lib/noBigdata";
import { liquidityList } from "@/lib/liquidity";
import { useEcon } from "../live/EconLive";
import { derive } from "../live/TradeLive";
import { readSaved, writeSaved } from "@/lib/court/store";
import { useVault, type VRow } from "@/lib/vault";
import { dayStamp, inText, monthTitle, prettyDay, stamp, weekKey } from "@/lib/court/time";
import { Bar, Btn, Card, Clamp, Chip, EmptyState, PageHead, SectionLabel, StoreNote, Table, TabPills, confirmDelete } from "../ui";

// Trades (round 6): left, the live watchlist, Midday movers, the latest scan's details and the Macro desk; right,
// the trade log, the position size calculator, performance stats and Tilly's long-term watchlist. Tracking only:
// nothing here tells her what to buy or sell.

type Row = Record<string, unknown> & { id: string; at?: string };
const n = (v: unknown) => (v === "" || v == null ? null : Number.isFinite(+(v as number)) ? +(v as number) : null);
const fx = (v: number | null, d = 2) => (v == null ? "–" : String(Math.round(v * 10 ** d) / 10 ** d));
const rTxt = (r: number | null) => (r == null ? "–" : (r >= 0 ? "+" : "") + r.toFixed(2) + "R");

/* ---------- Scan details: the latest Crypto scan as a dated snapshot ---------- */
const SECTIONS: [RegExp, string][] = [[/style\s*map/i, "Style Map"], [/also\s*on\s*watch|on\s*watch|watch\s*list/i, "Also on watch"], [/alert/i, "Alerts"], [/thesis/i, "Thesis log"], [/catalyst/i, "Catalysts"]];
// round 8: inside the Trades card "Midday movers and scan details", under the movers (no card of its own)
export function ScanDetails({ doc }: { doc: BriefDoc | null }) {
  if (!doc) return <div className="kscan"><SectionLabel>Scan details</SectionLabel><EmptyState>No scan filed yet. The 03:50 scan lands here.</EmptyState></div>;
  const body = noBigdata(doc.body ?? "");
  const parts = body.split(/\r?\n(?=##\s)/).slice(1);
  const plan = todaysPlan(body);
  const logIt = (r: PlanRow) => window.dispatchEvent(new CustomEvent("1wan:log-trade", { detail: r }));
  return (
    <div className="kscan">
      <div className="kscan-h"><SectionLabel>Scan details</SectionLabel><span className="note">Snapshot · <time className="ts">{stamp(doc.at)}</time></span></div>
      <SectionLabel>Trade Plan</SectionLabel>
      {plan.rows.length ? (
        <Table caption="Trade plan from the scan" head={["Ticker", "Grade", "Entry", "Stop", "Target", "R:R", "ATR%", ""]}
          rows={plan.rows.map((r) => [<b key="t">{r.ticker}</b>, r.grade, r.entry, r.stop, r.target, r.rr, r.atr ?? "–", <Btn key="l" kind="sm ghost" onClick={() => logIt(r)} aria-label={`Log this trade: ${r.ticker}`}>Log this trade</Btn>])} />
      ) : <p className="note">{plan.noTrade ? "No trade today." : "No trade plan table in this scan."}</p>}
      {SECTIONS.map(([re, label]) => {
        const sec = parts.find((p) => re.test(p.split(/\r?\n/)[0]) && !/trade\s*plan/i.test(p.split(/\r?\n/)[0]));
        if (!sec) return null;
        return <details key={label} className="klib-item" open={label === "Style Map"}><summary><b>{label}</b></summary><Clamp label={label} lines={5}><article className="read" dangerouslySetInnerHTML={{ __html: mdLite(sec.replace(/^##[^\n]*\n/, "")) }} /></Clamp></details>;
      })}
      <p className="note xd">The morning scan itself is in Briefs on the Court. Tracking only, not advice.</p>
    </div>
  );
}

/* ---------- Macro desk (Olli): next liquidity releases (summary, Calendar is home), rates and yields, week notes ---------- */
const RATE = /\b(yields?|10[- ]?y(?:ear)?|2[- ]?y(?:ear)?|30[- ]?y|treasur(?:y|ies)|fed funds|policy rate|rates?\b|dxy|dollar index|bund|jgb)\b/i;
export function MacroDesk({ intel }: { intel: BriefDoc | null }) {
  const { k } = useCourt();
  const econ = useEcon();
  const next = liquidityList(econ?.items ?? [], Date.now() - 600e3, Date.now() + 7 * 86400e3).slice(0, 3);
  const rates = (intel?.body ?? "").split(/\r?\n/).map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").replace(/[*_`#]/g, "").trim()).filter((l) => l && RATE.test(l) && /\d/.test(l) && l.length < 240).slice(0, 5);
  const notes = useVault<VRow & { kind: string; week: string; text: string }>("research_notes");
  const wk = weekKey(k), mine = notes.rows.find((r) => r.kind === "macro" && r.week === wk);
  const [text, setText] = useState<string | null>(null);
  const val = text ?? mine?.text ?? "";
  const save = () => { if (text == null || text === (mine?.text ?? "")) return; notes.put({ ...(mine ? { id: mine.id } : {}), kind: "macro", week: wk, title: "Macro notes, week of " + wk, text, tags: ["macro"] }); };
  return (
    <Card title="Macro desk" sub="Olli" className="kcompact">
      <SectionLabel>Next releases that move liquidity</SectionLabel>
      {!econ ? <EmptyState kind="loading" who="olli">Checking the economic calendar…</EmptyState>
        : next.length ? next.map((x) => <div className="krow" key={x.at + x.name}><span className="krow-main"><b>{x.name}</b> <time className="ts">{dayStamp(x.at)}</time></span><span className="note">{inText(x.at)}</span></div>)
        : <p className="note">No big release in the next 7 days.</p>}
      <a href="#calendar">Open the economic calendar →</a>
      <SectionLabel>Rates and yields from the latest Intelligence brief</SectionLabel>
      {rates.length ? <ul className="rv-sug">{rates.map((r) => <li key={r}>{noBigdata(r)}</li>)}</ul> : <p className="note">No rates or yields mentioned in the latest brief.</p>}
      {intel && <p className="note">From the brief of <time className="ts">{stamp(intel.at)}</time></p>}
      <SectionLabel>Your notes for this week</SectionLabel>
      <textarea aria-label="Macro notes for this week" maxLength={4000} value={val} placeholder="What you are watching this week, in your words." onChange={(e) => setText(e.target.value)} onBlur={save} />
      <StoreNote status={notes.status} />
    </Card>
  );
}

/* ---------- Ledger (the existing trades table, /api/ledger) ---------- */
function useLedger() {
  const [rows, setRows] = useState<Row[]>([]);
  const [plans, setPlans] = useState<Row[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "setup" | "error">("loading");
  useEffect(() => {
    getOnce<{ setup?: boolean; trades?: Row[]; plans?: Row[] }>("/api/ledger").then((j) => {
      if (Array.isArray(j?.plans)) setPlans(j.plans.filter((p) => p && typeof p.id === "string"));
      if (j?.setup) setState("setup"); else if (Array.isArray(j?.trades)) { setRows(j.trades.filter((t) => t && typeof t.id === "string")); setState("ok"); } else setState("error");
    }).catch(() => setState("error"));
  }, []);
  async function save(row: Record<string, unknown>) {
    const r = await fetch("/api/ledger", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "trades", row }) }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    if (!r?.ok || !j.row) return false;
    setRows((l) => [j.row, ...l.filter((x) => x.id !== j.row.id)]);
    // logging a trade from a plan marks the plan as reached and placed, exactly as the ledger did
    const p = row.plan_id ? plans.find((x) => x.id === row.plan_id) : null;
    if (p && !(p.triggered && p.placed)) await fetch("/api/ledger", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table: "plans", row: { ...p, triggered: true, placed: true } }) }).catch(() => null);
    window.dispatchEvent(new Event("1wan:ledger-changed"));
    return true;
  }
  async function remove(id: string) {
    const r = await fetch(`/api/ledger?table=trades&id=${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null);
    if (r?.ok) { setRows((l) => l.filter((x) => x.id !== id)); window.dispatchEvent(new Event("1wan:ledger-changed")); }
  }
  return { rows, plans, state, save, remove };
}
const targetOf = (t: Row) => { const c = t.checks as Record<string, unknown> | null; return n(c && typeof c === "object" ? c.target : null); };
const SETUPS = ["Pullback", "Breakout", "Range", "Trend continuation", "Reversal"];

type Form = { id?: string; date: string; inst: string; setup: string; dir: string; entry: string; stop: string; target: string; size: string; exit: string; lesson: string; plan_id: string };
function TradeLog({ L }: { L: ReturnType<typeof useLedger> }) {
  const { k } = useCourt();
  const blank: Form = { date: k, inst: "", setup: "", dir: "long", entry: "", stop: "", target: "", size: "", exit: "", lesson: "", plan_id: "" };
  const [f, setF] = useState<Form | null>(null);
  const [msg, setMsg] = useState("");
  const [flt, setFlt] = useState({ setup: "", month: "", status: "all" });
  // "Log this trade" on a Trade Plan row opens the form prefilled
  useEffect(() => {
    const on = (e: Event) => { const r = (e as CustomEvent<PlanRow>).detail; const num = (s: string) => (s.match(/-?\d[\d,]*\.?\d*/)?.[0] ?? "").replace(/,/g, "");
      setF({ ...blank, inst: r.ticker.toUpperCase(), entry: num(r.entry), stop: num(r.stop), target: num(r.target) }); document.getElementById("tlog")?.scrollIntoView({ behavior: "smooth", block: "start" }); };
    window.addEventListener("1wan:log-trade", on);
    return () => window.removeEventListener("1wan:log-trade", on);
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  const edit = (t: Row): Form => ({ id: t.id, date: String(t.date ?? k), inst: String(t.inst ?? ""), setup: String(t.setup ?? ""), dir: t.dir === "short" ? "short" : "long", entry: String(t.entry ?? ""), stop: String(t.stop ?? ""), target: String(targetOf(t) ?? ""), size: String(t.size ?? ""), exit: String(t.exit ?? ""), lesson: String(t.lesson ?? ""), plan_id: String(t.plan_id ?? "") });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f || !f.inst.trim() || n(f.entry) == null) return setMsg("A ticker and an entry are needed.");
    const old = f.id ? L.rows.find((x) => x.id === f.id) : null;
    const checks = { ...((old?.checks as Record<string, unknown>) ?? {}), target: n(f.target) };
    const ok = await L.save({ ...(old ?? {}), id: f.id ?? "t" + Date.now().toString(36), date: f.date, inst: f.inst.trim().toUpperCase().slice(0, 20), setup: f.setup.trim().slice(0, 120), dir: f.dir, entry: n(f.entry), stop: n(f.stop), size: n(f.size), exit: n(f.exit), lesson: f.lesson.trim().slice(0, 400), plan_id: f.plan_id || (old?.plan_id as string) || null, checks, at: (old?.at as string) ?? new Date().toISOString() });
    setMsg(ok ? "Saved." : "Could not save. Try again.");
    if (ok) setF(null);
  }
  const months = [...new Set(L.rows.map((t) => String(t.date ?? "").slice(0, 7)).filter((m) => /^\d{4}-\d{2}$/.test(m)))].sort().reverse();
  const setups = [...new Set(L.rows.map((t) => String(t.setup ?? "").trim()).filter(Boolean))].slice(0, 20);
  const list = L.rows.filter((t) => (!flt.setup || t.setup === flt.setup) && (!flt.month || String(t.date ?? "").startsWith(flt.month)) && (flt.status === "all" || (flt.status === "open") === (derive(t).status === "open")));
  const set = (key: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => f && setF({ ...f, [key]: e.target.value });
  return (
    <Card title="Trade log" id="tlog" sub="Fenn" actions={!f && L.state === "ok" ? <Btn kind="sm" onClick={() => setF(blank)}>Add a trade</Btn> : null}>
      {L.state === "loading" && <EmptyState kind="loading" who="fenn">Opening your ledger…</EmptyState>}
      {L.state === "setup" && <EmptyState who="fenn">The trade ledger needs one setup step first (docs/manual-steps.md, section G).</EmptyState>}
      {L.state === "error" && <EmptyState kind="error" who="fenn">Could not load the ledger. Try again later.</EmptyState>}
      {f && (
        <form className="kform" onSubmit={submit} aria-label={f.id ? "Edit trade" : "Add a trade"}>
          <div className="kform-row">
            <input type="date" aria-label="Date" value={f.date} onChange={set("date")} />
            <input placeholder="Ticker" aria-label="Ticker" maxLength={20} value={f.inst} onChange={set("inst")} required />
            <select aria-label="Direction" value={f.dir} onChange={set("dir")}><option value="long">Long</option><option value="short">Short</option></select>
          </div>
          <div className="kform-row">
            <input list="tsetups" placeholder="Setup type" aria-label="Setup type" maxLength={120} value={f.setup} onChange={set("setup")} />
            <datalist id="tsetups">{[...new Set([...SETUPS, ...setups])].map((s) => <option key={s} value={s} />)}</datalist>
            <input type="number" step="any" placeholder="Size" aria-label="Size" value={f.size} onChange={set("size")} />
          </div>
          <div className="kform-row">
            <input type="number" step="any" placeholder="Entry" aria-label="Entry" value={f.entry} onChange={set("entry")} required />
            <input type="number" step="any" placeholder="Stop" aria-label="Stop" value={f.stop} onChange={set("stop")} />
            <input type="number" step="any" placeholder="Target" aria-label="Target" value={f.target} onChange={set("target")} />
            <input type="number" step="any" placeholder="Exit (blank while open)" aria-label="Exit" value={f.exit} onChange={set("exit")} />
          </div>
          {!f.id && L.plans.length > 0 && <select aria-label="From a plan" value={f.plan_id} onChange={set("plan_id")}><option value="">Not from a plan</option>{L.plans.slice(0, 40).map((p) => <option key={p.id} value={p.id}>{String(p.inst ?? "")} {String(p.dir ?? "")} {/^\d{4}-\d{2}-\d{2}$/.test(String(p.date)) ? prettyDay(String(p.date)) : ""}</option>)}</select>}
          <textarea placeholder="Notes" aria-label="Notes" maxLength={400} value={f.lesson} onChange={set("lesson")} />
          <div className="kform-row"><button className="btn" type="submit">{f.id ? "Save changes" : "Save trade"}</button><Btn kind="ghost" onClick={() => setF(null)}>Cancel</Btn></div>
        </form>
      )}
      {msg && <p className="note" role="status">{msg}</p>}
      {L.state === "ok" && <>
        <div className="kform-row">
          <select aria-label="Filter by setup" value={flt.setup} onChange={(e) => setFlt({ ...flt, setup: e.target.value })}><option value="">All setups</option>{setups.map((s) => <option key={s}>{s}</option>)}</select>
          <select aria-label="Filter by month" value={flt.month} onChange={(e) => setFlt({ ...flt, month: e.target.value })}><option value="">All months</option>{months.map((m) => <option key={m} value={m}>{monthTitle(m + "-01")}</option>)}</select>
          <select aria-label="Filter by status" value={flt.status} onChange={(e) => setFlt({ ...flt, status: e.target.value })}><option value="all">Open and closed</option><option value="open">Open</option><option value="closed">Closed</option></select>
        </div>
        {!list.length ? <EmptyState who="fenn">{L.rows.length ? "No trades match these filters." : "No trades logged yet. Add one, or use “Log this trade” on a scan row."}</EmptyState>
          : list.slice(0, 60).map((t) => {
            const d = derive(t), tg = targetOf(t);
            return (
              <div className="krow" key={t.id}>
                <span className="krow-main"><b>{String(t.inst ?? "")}</b> {t.dir === "short" ? "Short" : "Long"}{t.setup ? <> · {String(t.setup)}</> : null} <Chip tone={d.status === "open" ? "peach" : d.status === "win" ? "mint" : d.status === "loss" ? "peach" : "lav"}>{d.status === "open" ? "Open" : rTxt(d.R)}</Chip>
                  <br /><span className="note"><time className="ts">{/^\d{4}-\d{2}-\d{2}$/.test(String(t.date)) ? prettyDay(String(t.date)) : ""}</time> · entry {fx(n(t.entry), 4)} · stop {fx(n(t.stop), 4)}{tg != null ? ` · target ${fx(tg, 4)}` : ""}{n(t.size) != null ? ` · size ${fx(n(t.size), 4)}` : ""}{n(t.exit) != null ? ` · exit ${fx(n(t.exit), 4)}` : ""}</span>
                  {t.lesson ? <><br /><span className="note">{noBigdata(String(t.lesson))}</span></> : null}</span>
                <span className="krow-act">
                  <Btn kind="sm ghost" onClick={() => setF(edit(t))}>{d.status === "open" ? "Close" : "Edit"}</Btn>
                  <Btn kind="sm ghost" onClick={() => confirmDelete(`the ${String(t.inst)} trade`) && L.remove(t.id)}>Delete</Btn>
                </span>
              </div>
            );
          })}
      </>}
      <p className="note xd">Your own records. Tracking only, not advice.</p>
    </Card>
  );
}

/* ---------- Position size calculator ---------- */
const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v) && v > 0;
export function sizeCalc(equity: number, riskPct: number, entry: number, stop: number, target?: number | null) {
  const dist = Math.abs(entry - stop);
  if (!(equity > 0 && riskPct > 0 && entry > 0 && stop > 0 && dist > 0)) return null;
  const risk = (equity * riskPct) / 100, size = risk / dist;
  const rr = target && target > 0 && Math.sign(target - entry) === Math.sign(entry - stop) ? Math.abs(target - entry) / dist : null;
  return { risk, size, notional: size * entry, rr };
}
/** Plain-words check before sizing (round 7): a stop on the wrong side or a price at or below zero gets a message. */
export function sizeCheck(dir: "long" | "short", equity: number, riskPct: number, entry: number, stop: number, target?: number | null): string | null {
  if (!(equity > 0)) return "Enter your equity, above zero.";
  if (!(riskPct > 0 && riskPct <= 100)) return "Enter a risk percent between 0 and 100.";
  if (!(entry > 0)) return "Enter an entry price above zero.";
  if (!(stop > 0)) return "Enter a stop price above zero.";
  if (dir === "long" && stop >= entry) return "Enter a stop below your entry for a long.";
  if (dir === "short" && stop <= entry) return "Enter a stop above your entry for a short.";
  if (target != null && target > 0 && (dir === "long" ? target <= entry : target >= entry)) return dir === "long" ? "Enter a target above your entry for a long, or leave it empty." : "Enter a target below your entry for a short, or leave it empty.";
  if (target != null && target <= 0) return "Enter a target above zero, or leave it empty.";
  return null;
}
// Round 9: every field labelled with its meaning and a hint; no pre-filled numbers.
export const SIZER_FIELDS = [
  ["equity", "Account equity", "What the account holds now, e.g. 1000"],
  ["risk", "Risk per trade %", "How much of the account one losing trade may cost, e.g. 1"],
  ["entry", "Entry price", "The price you plan to buy (or sell short) at"],
  ["stop", "Stop price", "Where you would get out if it goes wrong"],
  ["target", "Target price (optional)", "Where you would take profit"],
] as const;
function Sizer() {
  const [f, setF] = useState({ dir: "long" as "long" | "short", equity: "", risk: "", entry: "", stop: "", target: "" });
  const [out, setOut] = useState<{ msg: string } | { size: number; risk: number; rr: number | null } | null>(null);
  useEffect(() => { const e = readSaved("calc.equity", isNum, 0); if (e) setF((x) => ({ ...x, equity: String(e) })); }, []);
  const set = (key: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setF({ ...f, [key]: e.target.value }); setOut(null); if (key === "equity" && +e.target.value > 0) writeSaved("calc.equity", +e.target.value); };
  const calc = () => {
    const msg = sizeCheck(f.dir, +f.equity, +f.risk, +f.entry, +f.stop, n(f.target));
    if (msg) return setOut({ msg });
    const r = sizeCalc(+f.equity, +f.risk, +f.entry, +f.stop, n(f.target));
    setOut(r ? { size: r.size, risk: r.risk, rr: r.rr } : { msg: "Check the numbers: the entry and stop need to differ." });
  };
  return (
    <Card title="Position size calculator" sub="calculator, not advice">
      <p className="note">Works out how many coins to buy so a stopped-out trade loses only the % you choose.</p>
      <form className="kform ksizer" aria-label="Position size" onSubmit={(e) => { e.preventDefault(); calc(); }}>
        <label className="kfield"><span className="kfield-l">Direction</span>
          <select value={f.dir} onChange={set("dir")}><option value="long">Long (buy, stop below entry)</option><option value="short">Short (sell, stop above entry)</option></select></label>
        {SIZER_FIELDS.map(([key, label, hint]) => (
          <label className="kfield" key={key}><span className="kfield-l">{label}</span>
            <input type="number" step="any" min="0" inputMode="decimal" placeholder={hint.startsWith("What") || hint.startsWith("How") ? hint.split(", ").pop() : ""} value={f[key]} onChange={set(key)} />
            <span className="note">{hint}</span></label>
        ))}
        <div className="kbtn-row"><button className="btn" type="submit">Calculate</button></div>
      </form>
      <div className="kresult" role="status" aria-live="polite">
        {!out ? <p className="note">Fill in the boxes, then Calculate.</p>
          : "msg" in out ? <p className="kresult-msg">{out.msg}</p>
          : <div className="kstat"><div><b>{fx(out.size, 4)}</b><span>position size (coins)</span></div><div><b>{fx(out.risk)}</b><span>amount at risk</span></div><div><b>{out.rr != null ? "1 : " + fx(out.rr) : "–"}</b><span>risk : reward</span></div></div>}
      </div>
      <p className="note xd">Equity is remembered on this device only. A calculator, not advice.</p>
    </Card>
  );
}

/* ---------- Performance stats from closed trades ---------- */
export function perf(rows: Row[]) {
  const closed = rows.map((t) => ({ t, d: derive(t) })).filter((x) => x.d.status !== "open" && x.d.R != null);
  const Rs = closed.map((x) => x.d.R as number), wins = Rs.filter((r) => r > 0), losses = Rs.filter((r) => r <= 0);
  const avg = (a: number[]) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
  const group = (key: (t: Row) => string) => {
    const m = new Map<string, number[]>();
    for (const x of closed) { const g = key(x.t) || "Other"; m.set(g, [...(m.get(g) ?? []), x.d.R as number]); }
    return [...m.entries()].map(([g, rs]) => ({ g, n: rs.length, avg: avg(rs), win: rs.filter((r) => r > 0).length / rs.length }));
  };
  const wr = Rs.length ? wins.length / Rs.length : 0;
  return { n: Rs.length, winRate: wr, avgR: avg(Rs), expectancy: wr * avg(wins) + (1 - wr) * avg(losses), best: Rs.length ? Math.max(...Rs) : 0, worst: Rs.length ? Math.min(...Rs) : 0,
    bySetup: group((t) => String(t.setup ?? "").trim()), byMonth: group((t) => String(t.date ?? "").slice(0, 7)).sort((a, b) => b.g.localeCompare(a.g)).slice(0, 6) };
}
function Stats({ L }: { L: ReturnType<typeof useLedger> }) {
  const p = useMemo(() => perf(L.rows), [L.rows]);
  const [by, setBy] = useState<"setup" | "month">("setup");
  const groups = by === "setup" ? p.bySetup : p.byMonth, max = Math.max(0.01, ...groups.map((g) => Math.abs(g.avg)));
  return (
    <Card title="Performance stats" sub="from your closed trades">
      {p.n < 5 ? <EmptyState who="fenn">Log a few trades to see stats ({p.n} of 5 closed so far).</EmptyState> : <>
        <div className="kstat">
          <div><b>{Math.round(p.winRate * 100)}%</b><span>win rate</span></div><div><b>{rTxt(p.avgR)}</b><span>average R</span></div>
          <div><b>{rTxt(p.expectancy)}</b><span>expectancy per trade</span></div><div><b>{rTxt(p.best)} / {rTxt(p.worst)}</b><span>best / worst</span></div>
        </div>
        <TabPills label="Group stats by" value={by} options={[["setup", "By setup"], ["month", "By month"]] as const} onChange={setBy} />
        <div className="kbars">
          {groups.map((g) => [<span key={g.g + "a"}>{by === "month" && /^\d{4}-\d{2}$/.test(g.g) ? monthTitle(g.g + "-01") : g.g}</span>, <Bar key={g.g + "b"} v={g.avg} max={max} tone={g.avg >= 0 ? "mint" : "danger"} label={`${g.g}: average ${rTxt(g.avg)} over ${g.n} trades`} />, <span key={g.g + "c"} className="note">{rTxt(g.avg)} · {g.n}</span>])}
        </div>
      </>}
    </Card>
  );
}

/* ---------- Long-term watchlist (Tilly): slower, manual only ---------- */
type LT = VRow & { name: string; sector: string; thesis: string; catalysts: string; status: "studying" | "watching" | "owned"; notes: string; links: string };
const LT_BLANK = { name: "", sector: "", thesis: "", catalysts: "", status: "studying" as LT["status"], notes: "", links: "" };
export function LongTerm() {
  const v = useVault<LT>("longterm_watchlist");
  const [f, setF] = useState<(typeof LT_BLANK & { id?: string }) | null>(null);
  const [st, setSt] = useState<"all" | LT["status"]>("all");
  const list = v.rows.filter((r) => st === "all" || r.status === st);
  const set = (key: keyof typeof LT_BLANK) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => f && setF({ ...f, [key]: e.target.value });
  return (
    <Card title="Long-term watchlist" sub="Tilly · separate from the daily list" actions={!f ? <Btn kind="sm" onClick={() => setF({ ...LT_BLANK })}>Add</Btn> : null}>
      <TabPills label="Status" value={st} options={[["all", "All"], ["studying", "Studying"], ["watching", "Watching"], ["owned", "Owned"]] as const} onChange={setSt} />
      {f && (
        <form className="kform" aria-label="Long-term watchlist item" onSubmit={(e) => { e.preventDefault(); if (!f.name.trim()) return; v.put({ ...f, name: f.name.trim().slice(0, 60) }); setF(null); }}>
          <div className="kform-row"><input placeholder="Name" aria-label="Name" maxLength={60} value={f.name} onChange={set("name")} required /><input placeholder="Sector" aria-label="Sector" maxLength={60} value={f.sector} onChange={set("sector")} />
            <select aria-label="Status" value={f.status} onChange={set("status")}><option value="studying">Studying</option><option value="watching">Watching</option><option value="owned">Owned</option></select></div>
          <textarea placeholder="Thesis" aria-label="Thesis" maxLength={1000} value={f.thesis} onChange={set("thesis")} />
          <input placeholder="Catalysts" aria-label="Catalysts" maxLength={300} value={f.catalysts} onChange={set("catalysts")} />
          <input placeholder="Notes" aria-label="Notes" maxLength={500} value={f.notes} onChange={set("notes")} />
          <input placeholder="Links (one per space)" aria-label="Links" maxLength={500} value={f.links} onChange={set("links")} />
          <div className="kform-row"><button className="btn" type="submit">Save</button><Btn kind="ghost" onClick={() => setF(null)}>Cancel</Btn></div>
        </form>
      )}
      {!v.ready ? <EmptyState kind="loading" who="tilly">Opening Tilly's list…</EmptyState>
        : !list.length ? <EmptyState who="tilly">{v.rows.length ? "Nothing with this status." : "Nothing here yet. Add a name you want to study slowly."}</EmptyState>
        : list.map((r) => (
          <div className="krow" key={r.id}>
            <span className="krow-main"><b>{r.name}</b>{r.sector ? <> · {r.sector}</> : null} <Chip tone={r.status === "owned" ? "mint" : r.status === "watching" ? "lav" : "lav"}>{r.status}</Chip>
              {r.thesis && <><br /><span>{noBigdata(r.thesis)}</span></>}
              {r.catalysts && <><br /><span className="note">Catalysts: {noBigdata(r.catalysts)}</span></>}
              {r.links && <><br />{r.links.split(/\s+/).filter((u) => /^https?:\/\//.test(u)).slice(0, 4).map((u) => <a key={u} href={u} target="_blank" rel="noreferrer" className="brsrc-line">{u.replace(/^https?:\/\/(www\.)?/, "").split("/")[0]} </a>)}</>}</span>
            <span className="krow-act"><Btn kind="sm ghost" onClick={() => setF({ ...LT_BLANK, ...r })}>Edit</Btn><Btn kind="sm ghost" onClick={() => confirmDelete(r.name) && v.remove(r.id)}>Delete</Btn></span>
          </div>
        ))}
      <StoreNote status={v.status} />
    </Card>
  );
}

/* ---------- The page ---------- */
// Round 8 order, top to bottom: one card with Midday movers then Scan details, a compact Macro desk, Technicals (full width), Trade log,
// Position size calculator | Performance stats, Long-term watchlist. The Watchlist card is gone (prices live in
// the Technicals rows and on the Court; the price feed is unchanged). The ledger review, plans, rules and gamble
// log card is hidden: its records and the late-night flag logic are untouched (TradeLive, GridWins).
export function TradesPage({ movers, tech, scan, intel }: { movers: React.ReactNode; tech: React.ReactNode; scan: BriefDoc | null; intel: BriefDoc | null }) {
  const L = useLedger();
  return (
    <div className="kpage">
      <PageHead scene="desk" title="Trades" sub="Your trades, the trading watchlist and the macro desk. Tracking only, never advice." />
      <Card title="Scan" sub="Fenn · midday movers, then the morning scan" className="kfull kscanc">
        <Clamp label="Midday movers" lines={5}>{movers}</Clamp>
        <ScanDetails doc={scan} />
      </Card>
      <MacroDesk intel={intel} />
      {tech}
      <TradeLog L={L} />
      <div className="kpg two even">
        <div className="kcol"><Sizer /></div>
        <div className="kcol"><Stats L={L} /></div>
      </div>
      <LongTerm />
    </div>
  );
}
