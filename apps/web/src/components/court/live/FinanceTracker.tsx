"use client";

import { useEffect, useRef, useState } from "react";
import { useCourt } from "../CourtState";
import type { MoneyDefs } from "@/lib/court/state";
import { useVault, type VRow } from "@/lib/vault";
import { billsForMonth, cashflow, loanFix, loanMath, type Repay } from "@/lib/court/finance";
import { addDays, prettyDay, stamp, sgtKeyOf } from "@/lib/court/time";
import { Btn, StoreNote } from "../ui";
import { fundStatus } from "./MoneyPorted";

// The editable finance tracker (round 9), the first tab of the Life Hub's Finance overview. The imported figures are
// the starting values; every figure can be edited inline, with Undo and a small history. Balances keep living where
// they always did (user_state money: t, f, nw); loans, monthly income and the edit history live in finance_entries
// (preview storage on this device until the new tables are switched on). Tracks and explains, never advises.

type Edit = VRow & { kind: "edit"; fig: string; label: string; from: number; to: number; undo?: string };
type LoanRow = VRow & { kind: "loan"; name: string; lent: number; date?: string; repaid: Repay[]; off: number; note?: string; deleted?: boolean };
type Income = VRow & { kind: "income"; month: string; amt: number };
type Row = Edit | LoanRow | Income | (VRow & { kind: "budget" | "entry" }) | (VRow & { kind: "fix"; key: string });
type Line = { at: string; amount: number; category: string };

export const sgd = (n: number) => (n < 0 ? "−" : "") + "S$" + Math.round(Math.abs(n)).toLocaleString("en-SG");

/** "hidden" until hovered or focused; on touch, tap to show and tap again to hide. */
export function Reveal({ value, label }: { value: string; label: string }) {
  const [on, setOn] = useState(false);
  return (
    <button type="button" className={"kreveal" + (on ? " on" : "")} aria-pressed={on} aria-label={`Show ${label}`} onClick={() => setOn(!on)}>
      <span className="kreveal-h" aria-hidden="true">hidden</span><span className="kreveal-v" aria-hidden="true">{value}</span>
    </button>
  );
}

/** One editable figure: tap the value to edit, Enter or Save keeps it, Undo puts the last value back, History shows five. */
function Fig({ id, label, value, onSave, edits, log, money = true, mask = false, hint }: { id: string; label: string; value: number; onSave: (v: number) => void; edits: Edit[]; log: (fig: string, label: string, from: number, to: number, undo?: string) => void; money?: boolean; mask?: boolean; hint?: React.ReactNode }) {
  const [draft, setDraft] = useState<string | null>(null);
  const mine = edits.filter((e) => e.fig === id).sort((a, b) => b.at.localeCompare(a.at));
  // Undo steps back one change at a time: an undo marks the change it reversed, so the next Undo reaches the one before
  const undone = new Set(mine.map((e) => e.undo).filter(Boolean));
  const last = mine.find((e) => !e.undo && !undone.has(e.id));
  const fmt = (n: number) => (money ? sgd(n) : Math.round(n).toLocaleString("en-SG"));
  // an empty or unreadable entry changes nothing (it never turns a figure into 0)
  const save = () => { if (draft == null) return; const raw = draft.trim(); setDraft(null); if (raw === "" || !Number.isFinite(+raw)) return; const v = Math.max(0, +raw); if (v !== value) { onSave(v); log(id, label, value, v); } };
  return (
    <div className="kfig">
      <span className="kfig-l">{label}{hint && <><br /><span className="note">{hint}</span></>}</span>
      {draft == null
        ? <span className="kfig-v">{mask ? <Reveal value={fmt(value)} label={label} /> : <b>{fmt(value)}</b>} <Btn kind="sm ghost" aria-label={`Edit ${label}`} onClick={() => setDraft(String(value))}>Edit</Btn>
            {last && last.to === value && <Btn kind="sm ghost" aria-label={`Undo the last change to ${label}`} onClick={() => { onSave(last.from); log(id, label, value, last.from, last.id); }}>Undo</Btn>}</span>
        : <form className="kfig-v" onSubmit={(e) => { e.preventDefault(); save(); }}>
            <input type="number" min="0" step="0.01" inputMode="decimal" aria-label={label} autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} />
            <button className="btn sm" type="submit">Save</button><Btn kind="sm ghost" onClick={() => setDraft(null)}>Cancel</Btn>
          </form>}
      {mine.length > 0 && <details className="kfig-h"><summary className="note">History ({Math.min(5, mine.length)})</summary>{mine.slice(0, 5).map((e) => <div className="note" key={e.id}>{e.undo ? "undo: " : ""}{mask ? "changed" : `${fmt(e.from)} → ${fmt(e.to)}`} · <time className="ts">{stamp(e.at)}</time></div>)}</details>}
    </div>
  );
}

export function FinanceTracker({ d: raw }: { d: MoneyDefs | undefined }) {
  const { st, k, update } = useCourt();
  const L = <T,>(v: T[] | undefined) => (Array.isArray(v) ? v : []);
  const d = { cash: L(raw?.cash), steps: L(raw?.steps), funds: L(raw?.funds), nw: L(raw?.nw), up: L(raw?.up), open: L(raw?.open), routines: L(raw?.routines), k: raw?.k ?? { base: 0, ef: 0, sgdExp: 0, usdExp: 0 } };
  const v = useVault<Row>("finance_entries");
  const edits = v.rows.filter((r): r is Edit => r.kind === "edit");
  const allLoans = v.rows.filter((r): r is LoanRow => r.kind === "loan");
  const loans = allLoans.filter((l) => !l.deleted), removed = allLoans.filter((l) => l.deleted);
  const fixed = v.rows.some((r) => r.kind === "fix" && (r as { key?: string }).key === "r10-loans");
  const s = st.money;
  const t: Record<string, number> = { free: 0, ef: 0, sgd: 0, usd: 0, ...s.t };
  const fund = (id: string) => s.f[id] ?? 0;
  const part = (id: string, def: number) => s.nw[id] ?? def;
  const setNum = (g: "t" | "f" | "nw", id: string, val: number) => update((x) => { x.money[g] = { ...x.money[g], [id]: Math.max(0, val) }; x.money.upd = k; }, ["money"]);
  const log = (fig: string, label: string, from: number, to: number, undo?: string) => v.put({ kind: "edit", fig, label, from, to, ...(undo ? { undo } : {}) } as Partial<Row>);

  // month picker and the month's logged spending
  const [month, setMonth] = useState(k.slice(0, 7));
  const [lines, setLines] = useState<Line[] | null>(null);
  useEffect(() => {
    let alive = true;
    setLines(null);
    fetch("/api/spending?from=" + month + "-01").then((r) => r.json()).then((j) => { if (alive) setLines(Array.isArray(j.lines) ? j.lines : []); }).catch(() => { if (alive) setLines([]); });
    return () => { alive = false; };
  }, [month]);
  // spends logged under "bills" are already counted once, as Fixed bills from Life admin
  const allLines = (lines ?? []).filter((l) => sgtKeyOf(l.at).startsWith(month));
  const spentLines = allLines.filter((l) => l.category !== "bills");
  const billLines = allLines.length - spentLines.length;
  const loggedToday = (lines ?? []).some((l) => sgtKeyOf(l.at) === k);
  const byCat = [...new Set(spentLines.map((l) => l.category))].map((c) => ({ c, t: spentLines.filter((l) => l.category === c).reduce((a, l) => a + Number(l.amount), 0) })).sort((a, b) => b.t - a.t);
  const spent = byCat.reduce((a, x) => a + x.t, 0);
  const typed = v.rows.find((r): r is Income => r.kind === "income" && r.month === month);
  const imported = d.cash.filter((r) => r[2] > 0).reduce((a, r) => a + r[2], 0);
  const income = typed ? typed.amt : imported;
  const bills = billsForMonth(st.life, month);
  const sinking = d.funds.reduce((a, r) => a + (r[4] || 0), 0);
  const cf = cashflow({ income, bills: bills.total, sinking, spending: spent });
  const coming = d.steps.reduce((a, r) => a + r[2], 0);

  const loanExpected = loans.reduce((a, l) => a + loanMath(l).expected, 0);
  // once loans are tracked below, an imported net worth part that is itself money lent out is left out, so a loan
  // is never counted twice
  const lentPart = (label: string, sign: number) => loans.length > 0 && sign > 0 && /\b(loan|lent|owed to me|receivable|iou)\b/i.test(label);
  const netWorth = d.nw.reduce((a, r) => a + (lentPart(r[1], r[4]) ? 0 : r[4] * part(r[0], r[3])), 0) + loanExpected;
  const r2ok = !!s.done.r2 && s.upd === k;
  const held = d.funds.reduce((a, r) => a + fund(r[0]), 0);
  const [lf, setLf] = useState({ name: "", lent: "", date: "" });
  const [lmsg, setLmsg] = useState("");
  // round 10, once: the USD 9,000 loan entry is removed (kept and restorable) and SGD loans come to S$40,000
  const ran = useRef(false);
  useEffect(() => {
    // never on a failed load (the list would look empty), never twice
    if (!v.ready || v.failed || fixed || ran.current) return;
    ran.current = true;
    const plan = loanFix(allLoans, d.k.sgdExp > 0 || d.k.usdExp > 0);
    for (const id of plan.remove) { const l = allLoans.find((x) => x.id === id); v.put({ id, deleted: true } as Partial<Row>); log("loan." + id, `Removed loan ${l?.name ?? ""}`.trim(), 0, 1); }
    if (plan.amend) { v.put({ id: plan.amend.id, lent: 40000 } as Partial<Row>); log("loan." + plan.amend.id + ".lent", "Amount lent", plan.amend.from, 40000); }
    if (plan.add) v.put({ kind: "loan", name: plan.add.name, lent: plan.add.lent, repaid: [], off: 0 } as Partial<Row>);
    v.put({ kind: "fix", key: "r10-loans" } as Partial<Row>);
  }, [v.ready, fixed]); // eslint-disable-line react-hooks/exhaustive-deps
  const tick = (id: string, on: boolean) => update((x) => { x.money.done = { ...x.money.done, [id]: on }; if (!on) delete x.money.done[id]; }, ["money"]);
  const up = d.up.filter(([dt]) => dt >= addDays(k, -3) && dt <= addDays(k, 45));

  return (
    <div className="kfin">
      <div className="sec-h">Overview</div>
      <div className="kfin-tiles">
        <div className="kfin-tile"><span className="note">Net worth</span><Reveal value={sgd(netWorth)} label="Net worth" /><span className="note">loans count only what is still expected</span></div>
        <div className="kfin-tile"><span className="note">Left over, {month}</span><b>{sgd(cf.left)}</b></div>
        <div className="kfin-tile"><span className="note">Emergency fund</span><b>{sgd(t.ef)}</b><span className="note">{d.k.ef ? (t.ef >= d.k.ef ? "target met" : sgd(d.k.ef - t.ef) + " to target") : ""}</span></div>
        <div className="kfin-tile"><span className="note">Sinking funds held</span><b>{sgd(held)}</b><span className="note">{d.funds.length} funds</span></div>
      </div>

      <div className="sec-h">Figures <span className="note">tap Edit to change one; Undo steps back{raw?.asOf ? ` · imported as of ${raw.asOf}, updated ${s.upd ? prettyDay(s.upd) : "in the old page"}` : ""}</span></div>
      <Fig id="t.ef" label="Emergency fund" value={t.ef} onSave={(x) => setNum("t", "ef", x)} edits={edits} log={log} hint={d.k.ef ? `target ${sgd(d.k.ef)}${t.ef < d.k.ef ? ", " + sgd(d.k.ef - t.ef) + " short" : ", fully funded"}` : undefined} />
      <Fig id="t.free" label="Free SGD" value={t.free} onSave={(x) => setNum("t", "free", x)} edits={edits} log={log} hint={d.k.base ? `${t.free - d.k.base >= 0 ? "+" : "−"}${sgd(Math.abs(t.free - d.k.base))} vs baseline (${sgd(d.k.base)})` : undefined} />
      {d.funds.map((r) => { const [id, name, target, due, monthly, note] = r; const stt = fundStatus(k, fund(id), r);
        return <Fig key={id} id={"f." + id} label={`${name} (of ${sgd(target)})`} value={fund(id)} onSave={(x) => setNum("f", id, x)} edits={edits} log={log}
          hint={<><span className={"st-" + stt.cls}>{stt.txt}</span> · {due ? "due " + prettyDay(due) : "due date unknown"} · {sgd(monthly)} a month{note ? " · " + note : ""}<span className="mbar" aria-hidden="true"><i style={{ width: Math.min(fund(id) / (target || 1), 1) * 100 + "%" }} /></span></>} />; })}
      {d.nw.length > 0 && (
        <details className="kfin-nw"><summary className="note">Net worth parts ({d.nw.length})</summary>
          {d.nw.map(([id, l, det, def, sign]) => <Fig key={id} id={"nw." + id} label={`${l}${sign < 0 ? " (owed, subtracted)" : ""}`} value={part(id, def)} onSave={(x) => setNum("nw", id, x)} edits={edits} log={log} mask hint={lentPart(l, sign) ? "left out of net worth while your loans are tracked below" : det || undefined} />)}
        </details>
      )}

      <div className="sec-h">Monthly cash flow</div>
      <label className="kfin-month">Month <input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} /></label>
      <div className="kfin-cf">
        <Fig id={"income." + month} label={`Income in${typed ? "" : imported ? " (from your import)" : ""}`} value={income} onSave={(x) => v.put({ ...(typed ? { id: typed.id } : {}), kind: "income", month, amt: x } as Partial<Row>)} edits={edits} log={log} />
        <details className="kfin-row"><summary><span>− Fixed bills <span className="note">from Life admin, {bills.rows.length} item{bills.rows.length === 1 ? "" : "s"}</span></span><b>{sgd(bills.total)}</b></summary>
          {bills.rows.map((b) => <div className="note" key={b.id}>{b.name}{b.n > 1 ? ` × ${b.n}` : ""} · {sgd(b.amt)}</div>)}
          <p className="note">Bills are edited once, in Life admin.</p></details>
        <div className="kfin-row"><span>− Sinking funds <span className="note">monthly set-asides</span></span><b>{sgd(sinking)}</b></div>
        <details className="kfin-row"><summary><span>− Logged spending <span className="note">{lines == null ? "loading…" : `${spentLines.length} line${spentLines.length === 1 ? "" : "s"}`}</span></span><b>{sgd(spent)}</b></summary>
          {byCat.map((x) => <div className="note" key={x.c}>{x.c} · {sgd(x.t)}</div>)}
          {billLines > 0 && <p className="note">{billLines} spend{billLines === 1 ? "" : "s"} logged under Bills left out here: bills count once, above.</p>}</details>
        <div className="kfin-row kfin-left"><b>= Left over</b><b>{sgd(cf.left)}</b></div>
        {d.steps.length > 0 && <p className="note">Left over with the coming changes: {sgd(cf.left + coming)}</p>}
      </div>

      <div className="sec-h">Loans owed to me</div>
      {loans.map((l) => <Loan key={l.id} l={l} put={(x) => v.put({ id: l.id, ...x } as Partial<Row>)} edits={edits} log={log}
        onRemove={() => { if (!window.confirm(`Remove the loan “${l.name}”? It is kept under Removed loans and can be restored.`)) return; v.put({ id: l.id, deleted: true } as Partial<Row>); log("loan." + l.id, `Removed loan ${l.name}`, 0, 1); }} />)}
      {removed.length > 0 && <details className="kfold"><summary className="note">Removed loans ({removed.length})</summary>
        {removed.map((l) => <div className="krow" key={l.id}><span className="krow-main">{l.name} · {sgd(l.lent)}</span><Btn kind="sm ghost" onClick={() => { v.put({ id: l.id, deleted: false } as Partial<Row>); log("loan." + l.id, `Restored loan ${l.name}`, 1, 0); }}>Restore</Btn></div>)}</details>}
      <form className="kform" aria-label="Add a loan owed to you" onSubmit={(e) => { e.preventDefault(); const lent = +lf.lent; if (!lf.name.trim() || !(lent > 0)) return setLmsg("Give the loan a name and an amount above 0."); v.put({ kind: "loan", name: lf.name.trim().slice(0, 60), lent, date: lf.date || undefined, repaid: [], off: 0 } as Partial<Row>); setLf({ name: "", lent: "", date: "" }); setLmsg("Loan added."); }}>
        <div className="kform-row">
          <input aria-label="Who or what (no account numbers)" placeholder="Who or what, e.g. Loan to a friend" maxLength={60} value={lf.name} onChange={(e) => setLf({ ...lf, name: e.target.value })} />
          <input type="number" min="0" step="0.01" aria-label="Amount lent" placeholder="Amount lent, e.g. 9000" value={lf.lent} onChange={(e) => setLf({ ...lf, lent: e.target.value })} />
          <input type="date" aria-label="Date lent" value={lf.date} onChange={(e) => setLf({ ...lf, date: e.target.value })} />
          <button className="btn sm" type="submit">Add loan</button>
        </div>
        {lmsg && <p className="note" role="status">{lmsg}</p>}
      </form>
      {(d.k.sgdExp > 0 || d.k.usdExp > 0) && <details className="kfold" open={!fixed}><summary className="note">Loans back figures from your import{fixed ? " (kept; your loan entry above replaces them)" : ""}</summary>
        <Fig id="t.sgd" label="Loans back from your import, SGD received" value={t.sgd ?? 0} onSave={(x) => setNum("t", "sgd", x)} edits={edits} log={log} hint={`of ${sgd(d.k.sgdExp)} expected`} />
        <Fig id="t.usd" label="Loans back from your import, USD received" value={t.usd ?? 0} money={false} onSave={(x) => setNum("t", "usd", x)} edits={edits} log={log} hint={`of USD ${d.k.usdExp.toLocaleString("en-SG")} expected`} />
      </details>}
      <StoreNote status={v.status} failed={v.failed} />

      <div className="sec-h">Routines</div>
      <p className="note">{d.routines[0]?.[1] ?? "Money check"}: {loggedToday ? "done today (auto: a spending line exists)" : "not yet today: log one line in Log a spend"}</p>
      {d.routines[1] && <label className="kcheck"><input type="checkbox" checked={!!s.done.r2} onChange={(e) => tick("r2", e.target.checked)} />{d.routines[1][1]} <span className="note">{r2ok ? "done (auto: ticked and figures updated today)" : s.done.r2 ? "ticked; update one figure above to complete it" : d.routines[1][2]}</span></label>}
      {up.length > 0 && <details><summary className="note">Coming up, next 45 days ({up.length})</summary>{up.map(([dt, l, a, note], i) => <div className="note" key={dt + i}>{prettyDay(dt)} · {l}{note === "fund" ? " · from fund" : note === "in" ? " · in" : note ? " · " + note : ""} · {a == null ? "–" : sgd(a)}</div>)}</details>}
      {d.open.length > 0 && <details><summary className="note">Open items ({d.open.filter(([id]) => s.done[id]).length} / {d.open.length} sorted)</summary>
        {d.open.map(([id, title, det]) => <label className="kcheck" key={id}><input type="checkbox" checked={!!s.done[id]} onChange={(e) => tick(id, e.target.checked)} />{s.done[id] ? <s>{title}</s> : title} <span className="note">{det}</span></label>)}</details>}
      <p className="note xd">Tracking only, not advice. No account numbers are ever stored.</p>
    </div>
  );
}

function Loan({ l, put, edits, log, onRemove }: { l: LoanRow; put: (x: Partial<LoanRow>) => void; edits: Edit[]; log: (fig: string, label: string, from: number, to: number, undo?: string) => void; onRemove: () => void }) {
  const m = loanMath(l);
  const [r, setR] = useState({ date: "", amt: "" });
  const [off, setOff] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  return (
    <div className="kloan">
      <div className="kloan-h"><b>{l.name}</b>{l.date && <span className="note"> · lent {l.date}</span>} <Btn kind="sm ghost" aria-label={`Remove the loan ${l.name}`} onClick={onRemove}>Remove</Btn></div>
      <Fig id={"loan." + l.id + ".lent"} label="Amount lent" value={l.lent} onSave={(x) => put({ lent: x })} edits={edits} log={log} />
      <div className="kloan-m">
        <span><span className="note">Lent</span> <b>{sgd(m.lent)}</b></span>
        <span><span className="note">Repaid</span> <b>{sgd(m.repaid)}</b></span>
        <span><span className="note">Written off</span> <b>{sgd(m.off)}</b></span>
        <span><span className="note">Still expected</span> <b>{sgd(m.expected)}</b></span>
      </div>
      {l.repaid.length > 0 && <details><summary className="note">Repayments ({l.repaid.length})</summary>{[...l.repaid].sort((a, b) => a.date.localeCompare(b.date)).map((x, i) => <div className="note" key={i}>{x.date} · {sgd(x.amt)}</div>)}</details>}
      <form className="kform-row" aria-label={`Add a repayment for ${l.name}`} onSubmit={(e) => { e.preventDefault(); const amt = +r.amt; if (!r.date || !(amt > 0)) return setMsg("Give the repayment a date and an amount above 0."); if (amt > m.expected + 0.005) return setMsg(`That is more than is still expected (${sgd(m.expected)}).`); put({ repaid: [...l.repaid, { date: r.date, amt }] }); setR({ date: "", amt: "" }); setMsg(""); }}>
        <input type="date" aria-label="Repayment date" value={r.date} onChange={(e) => setR({ ...r, date: e.target.value })} />
        <input type="number" min="0" step="0.01" aria-label="Repayment amount" placeholder="Repaid amount" value={r.amt} onChange={(e) => setR({ ...r, amt: e.target.value })} />
        <button className="btn sm" type="submit">Add repayment</button>
      </form>
      {off == null ? <Btn kind="sm ghost" onClick={() => setOff(String(m.off || m.expected))}>Mark written off…</Btn>
        : <form className="kform-row" aria-label={`Written off for ${l.name}`} onSubmit={(e) => { e.preventDefault(); const x = Math.max(0, +off || 0); if (x + m.repaid > m.lent + 0.005) return setMsg(`Written off plus repaid cannot pass the ${sgd(m.lent)} lent.`); put({ off: x }); setOff(null); setMsg(""); }}>
            <input type="number" min="0" step="0.01" aria-label="Amount written off" value={off} onChange={(e) => setOff(e.target.value)} />
            <button className="btn sm" type="submit">Save written off</button><Btn kind="sm ghost" onClick={() => setOff(null)}>Cancel</Btn>
          </form>}
      {msg && <p className="note" role="status">{msg}</p>}
    </div>
  );
}
