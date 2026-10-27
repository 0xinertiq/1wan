"use client";

import { useCourt } from "../CourtState";
import type { MoneyDefs, PItem } from "@/lib/court/state";
import { addDays, prettyDay } from "@/lib/court/time";

// Money Wins, ported: the formulas from her Money Wins page, the lines from her private defs.money.
// Balances she updates live in user_state key money (t, f, nw). Tracks and explains, never advises.
const money = (n: number) => (n < 0 ? "−" : "") + "S$" + Math.round(Math.abs(n)).toLocaleString("en-SG");
const m2 = (n: number) => (n < 0 ? "−" : n > 0 ? "+" : "") + Math.abs(n).toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const p2 = (n: number) => n.toLocaleString("en-SG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Pay days (the 7th) from today up to the due date, as in the original.
function paydays(k: string, due: string) {
  let [y, m] = k.split("-").map(Number), c = 0;
  let d = `${y}-${String(m).padStart(2, "0")}-07`;
  if (d <= k) { m++; if (m > 12) { m = 1; y++; } d = `${y}-${String(m).padStart(2, "0")}-07`; }
  while (d < due) { c++; m++; if (m > 12) { m = 1; y++; } d = `${y}-${String(m).padStart(2, "0")}-07`; }
  return c;
}
function fundStatus(k: string, bal: number, [, , target, due, monthly]: MoneyDefs["funds"][number]) {
  if (!due) return { cls: "mut", txt: "Due month unknown" };
  if (due < k) return { cls: "mut", txt: "Due date passed · update balance" };
  if (bal >= target - 0.05) return { cls: "ok", txt: "Funded" };
  const n = paydays(k, due), proj = bal + monthly * n;
  if (proj >= target - 0.05) return { cls: "ok", txt: "On pace" };
  const short = target - proj;
  return n ? { cls: "bad", txt: `Behind ${p2(short)} · ${p2(short / n)} more each pay day keeps pace` } : { cls: "bad", txt: `Short ${p2(short)}` };
}

// Top-level so the minute tick never remounts an input she is typing in. Saves on leaving the field.
function NumField({ label, v, onSet }: { label: string; v: number; onSet: (v: string) => void }) {
  return <label className="note mfld">{label} <input type="number" min="0" step="0.01" inputMode="decimal" defaultValue={v} onBlur={(e) => { if (+e.target.value !== v) onSet(e.target.value); }} /></label>;
}

export function MoneyPorted({ d, loggedToday }: { d: MoneyDefs; loggedToday: boolean }) {
  const { st, k, update } = useCourt();
  const s = st.money;
  const t = { free: 0, ef: 0, sgd: 0, usd: 0, ...s.t };
  const f = (id: string, def: number) => s.f[id] ?? def;
  const nwv = (id: string, def: number) => s.nw[id] ?? def;
  const setNum = (g: "t" | "f" | "nw", id: string, v: string) => update((x) => { x.money[g] = { ...x.money[g], [id]: Math.max(0, +v || 0) }; x.money.upd = k; }, ["money"]);
  const tick = (id: string, on: boolean) => update((x) => { x.money.done = { ...x.money.done, [id]: on }; if (!on) delete x.money.done[id]; }, ["money"]);
  const K = d.k ?? { base: 0, ef: 0, sgdExp: 0, usdExp: 0 };

  const left = d.cash.reduce((a, r) => a + r[2], 0);
  const withSteps = d.steps.reduce((a, r) => a + r[2], left);
  const netWorth = d.nw.reduce((a, r) => a + r[4] * nwv(r[0], r[3]), 0);
  const held = d.funds.reduce((a, r) => a + f(r[0], 0), 0);
  const statuses = d.funds.map((r) => fundStatus(k, f(r[0], 0), r));
  const behind = statuses.filter((x) => x.cls === "bad").length;
  const diff = t.free - K.base;
  const soon = addDays(k, 45);
  const up = d.up.filter(([dt]) => dt >= addDays(k, -3) && dt <= soon);
  const hide = st.mny.hideNw;
  const r2ok = !!s.done.r2 && s.upd === k;

  const Field = ({ g, id, label, v }: { g: "t" | "f" | "nw"; id: string; label: string; v: number }) => <NumField label={label} v={v} onSet={(x) => setNum(g, id, x)} />;
  const List = ({ items }: { items: PItem[] }) => <>{items.map(([id, title, det, dt]) => (
    <label className="filed-row" key={id}><input type="checkbox" checked={!!s.done[id]} onChange={(e) => tick(id, e.target.checked)} /><span>{s.done[id] ? <s>{title}</s> : title}{dt ? <span className="note"> · {dt}</span> : null} <span className="note">{det}</span></span></label>
  ))}</>;

  return (
    <>
      <div className="sec-h">Routines</div>
      <div className="filed-row"><span>{d.routines[0]?.[1] ?? "Money check"} <span className="note">{loggedToday ? "done today (auto: a spending line exists)" : "not yet today: log one line above"}</span></span></div>
      <label className="filed-row"><input type="checkbox" checked={!!s.done.r2} onChange={(e) => tick("r2", e.target.checked)} /><span>{d.routines[1]?.[1] ?? "Sunday reset"} <span className="note">{r2ok ? "done (auto: ticked and figures updated today)" : s.done.r2 ? "ticked; update one figure below to complete it" : d.routines[1]?.[2]}</span></span></label>

      <div className="sec-h">Overview <span className="note">figures as of {d.asOf}, updated {s.upd ? prettyDay(s.upd) : "in the old page"}</span></div>
      <div className="tiles">
        <div className="tile"><span className="note">Net worth</span><b>{hide ? "hidden" : money(netWorth)}</b></div>
        <div className="tile"><span className="note">Left over a month</span><b>{m2(left)}</b><span className="note">{m2(withSteps)} with the coming changes</span></div>
        <div className="tile"><span className="note">Emergency fund</span><b>{money(t.ef)}</b><span className="note">{t.ef >= K.ef ? "Target met" : money(K.ef - t.ef) + " to target"}</span></div>
        <div className="tile"><span className="note">Sinking funds</span><b>{money(held)}</b><span className="note">{behind ? behind + " behind pace" : "All on pace"} · {d.funds.length} funds</span></div>
      </div>
      <div className="rep-act"><button className="btn sm ghost" type="button" onClick={() => update((x) => { x.mny.hideNw = !x.mny.hideNw; }, ["mny"])}>{hide ? "Show net worth" : "Hide net worth"}</button></div>

      <div className="sec-h">Monthly cash flow</div>
      <p className="note xd">Fixed commitments against salary. Variable spending is what you log above.</p>
      {d.cash.map(([l, det, a]) => <div className="filed-row" key={l}><span>{l} <span className="note">{det}</span></span><span>{m2(a)}</span></div>)}
      <div className="filed-row"><b>Left over</b><b>{m2(left)}</b></div>
      {d.steps.length > 0 && <p className="note">What changes it</p>}
      {d.steps.reduce<{ run: number; el: React.ReactNode[] }>((acc, [l, det, a]) => { acc.run += a; acc.el.push(<div className="filed-row" key={l}><span>{l} <span className="note">{det} ({m2(a)})</span></span><span>{m2(acc.run)}</span></div>); return acc; }, { run: left, el: [] }).el}

      <div className="sec-h">Coming up, next 45 days</div>
      {up.length ? up.map(([dt, l, a, note], i) => (
        <div className="filed-row" key={dt + i} style={dt < k ? { opacity: 0.55 } : undefined}><span>{prettyDay(dt)} · {l}{note === "fund" ? <span className="note"> · from fund</span> : note === "in" ? <span className="note"> · in</span> : note ? <span className="note"> · {note}</span> : null}</span><span>{a == null ? "–" : m2(a)}</span></div>
      )) : <p className="note">Nothing from your Money Wins list in the next 45 days. Your Life admin bills still show on the Court.</p>}

      <div className="sec-h">Sinking funds</div>
      {d.funds.map((r, i) => {
        const [id, name, target, due, monthly, note] = r, bal = f(id, 0), stt = statuses[i];
        return (
          <div className="filed-row col" key={id}>
            <span>{name} <span className={"note st-" + stt.cls}>{stt.txt}</span></span>
            <span className="mbar"><i style={{ width: Math.min(bal / (target || 1), 1) * 100 + "%" }} /></span>
            <span className="note">{p2(bal)} / {p2(target)} · {due ? "due " + prettyDay(due) : "due date unknown"} · {p2(monthly)} a month{note ? " · " + note : ""}</span>
            <Field g="f" id={id} label="Balance now" v={bal} />
          </div>
        );
      })}

      {!hide && (
        <>
          <div className="sec-h">Net worth</div>
          {d.nw.map(([id, l, det, def, sign]) => (
            <div className="filed-row col" key={id}>
              <span>{l} <b>{money(sign * nwv(id, def))}</b></span>
              <span className="note">{det}</span>
              <Field g="nw" id={id} label={sign < 0 ? "Owed" : "Amount"} v={nwv(id, def)} />
            </div>
          ))}
        </>
      )}

      <div className="sec-h">Goals and targets</div>
      <div className="filed-row col"><span>Free SGD <b>{money(t.free)}</b> <span className="note">{diff >= 0 ? "+" : "−"}{money(Math.abs(diff))} vs baseline ({money(K.base)})</span></span><Field g="t" id="free" label="Free SGD now" v={t.free} /></div>
      <div className="filed-row col"><span>Emergency fund <b>{money(t.ef)}</b> <span className="note">target {money(K.ef)}{t.ef < K.ef ? ", " + money(K.ef - t.ef) + " short" : ", fully funded"}</span></span><span className="mbar"><i style={{ width: Math.min(t.ef / (K.ef || 1), 1) * 100 + "%" }} /></span><Field g="t" id="ef" label="Current balance" v={t.ef} /></div>
      <div className="filed-row col"><span>Loans back <b>{money(t.sgd)}</b> <span className="note">of {money(K.sgdExp)} SGD · USD {Math.round(t.usd).toLocaleString("en-SG")} of {K.usdExp.toLocaleString("en-SG")}</span></span><span className="mbar"><i style={{ width: Math.min(t.sgd / (K.sgdExp || 1), 1) * 100 + "%" }} /></span>
        <Field g="t" id="sgd" label="SGD received" v={t.sgd} /><Field g="t" id="usd" label="USD received" v={t.usd} /></div>

      <div className="sec-h">Open items ({d.open.filter(([id]) => s.done[id]).length} / {d.open.length} sorted)</div>
      <List items={d.open} />
      <p className="note">The Q4 wins ladder is on Life, Grid & Wins. SGD unless noted.</p>
    </>
  );
}
