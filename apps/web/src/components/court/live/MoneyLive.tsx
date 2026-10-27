"use client";

import { useEffect, useState } from "react";
import { useCourt } from "../CourtState";
import { dueList, LCATS, money, type CourtState, type MAsset, type MItem, type MLine } from "@/lib/court/state";
import { prettyDay } from "@/lib/court/time";
import { MoneyPorted } from "./MoneyPorted";

// Life > Money (docs/build-trackers.md, Screens). Tracks and explains only, never advises.
// Spending lines live in the spending table (0004); her typed figures live in user_state key mny.
type Line = { id: string; at: string; amount: number; category: string; note: string | null };
const CATS = ["food", "transport", "home", "bills", "health", "pets", "fun", "shopping", "gifts", "other"];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
const uid = () => "m" + Date.now() + Math.floor(Math.random() * 1000);
const sum = (a: { amt: number }[]) => a.reduce((t, x) => t + (x.amt || 0), 0);
const sgtDay = (iso: string) => new Date(Date.parse(iso) + 8 * 3600000).toISOString().slice(0, 10);

type ListKey = "inc" | "fixed";
type TickKey = "goals" | "open";

export function MoneyLive() {
  const { st, k, update, events } = useCourt();
  const m = st.mny;
  const month = k.slice(0, 7);
  const [lines, setLines] = useState<Line[] | null>(null);
  const [setup, setSetup] = useState(false);
  const [f, setF] = useState({ amt: "", cat: "food", note: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/spending?from=" + month + "-01").then((r) => r.json()).then((j) => {
      if (j.setup) setSetup(true);
      setLines(Array.isArray(j.lines) ? j.lines : []);
    }).catch(() => setLines([]));
  }, [month]);

  // Any edit to her figures counts as "money figures updated today" (feeds routine r2).
  const edit = (fn: (d: CourtState) => void) => update((d) => { fn(d); d.mny.upd = k; }, ["mny"]);

  async function addSpend(e: React.FormEvent) {
    e.preventDefault();
    const amount = +f.amt;
    if (!(amount > 0)) return setMsg("Type an amount above 0.");
    const r = await fetch("/api/spending", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount, category: f.cat, note: f.note }) });
    const j = await r.json().catch(() => ({}));
    if (j.setup) { setSetup(true); return; }
    if (!r.ok || !j.line) return setMsg("Could not save. Try again in a moment.");
    setLines((ls) => [j.line, ...(ls ?? [])]);
    setF({ ...f, amt: "", note: "" });
    setMsg(`Logged ${money(amount)} for ${cap(f.cat).toLowerCase()}.`);
  }

  async function removeSpend(id: string) {
    const r = await fetch("/api/spending?id=" + id, { method: "DELETE" });
    if (r.ok) setLines((ls) => (ls ?? []).filter((l) => l.id !== id));
  }

  const monthLines = (lines ?? []).filter((l) => sgtDay(l.at).startsWith(month));
  const spent = monthLines.reduce((t, l) => t + Number(l.amount), 0);
  const byCat = CATS.map((c) => ({ c, t: monthLines.filter((l) => l.category === c).reduce((t, l) => t + Number(l.amount), 0) })).filter((x) => x.t > 0).sort((a, b) => b.t - a.t);
  const loggedToday = (lines ?? []).some((l) => sgtDay(l.at) === k);
  const inc = sum(m.inc), fixed = sum(m.fixed);
  const left = inc - fixed - spent;
  const coming = dueList(st, k, events).filter((x) => x.dd >= 0 && x.dd <= 30 && (x.it.cat === "bill" || x.it.cat === "money")).sort((a, b) => a.dd - b.dd);
  const assets = m.nw.filter((x) => x.kind === "a"), debts = m.nw.filter((x) => x.kind === "d");

  return (
    <div className="money">
      <p className="note xd">Coco keeps your money in one place. This page tracks and explains; it never tells you what to do with your money.</p>
      {!st.defs.money && (
        <p className="note" role="status">
          Today's spending log: {loggedToday ? "done (auto, from a line logged today)" : "not yet"}
          {" · "}Money figures last updated: {m.upd ? prettyDay(m.upd) : "never"}
        </p>
      )}

      <div className="sec-h">Spending this month</div>
      {setup ? (
        <p className="note">The spending log needs one setup step first. See <b>docs/manual-steps.md</b>, section G. Everything else on this page already works.</p>
      ) : (
        <>
          <form className="field" onSubmit={addSpend}>
            <label htmlFor="spAmt">Log a spend</label>
            <div className="field-row">
              <input id="spAmt" type="number" min="0" step="0.01" inputMode="decimal" placeholder="Amount" value={f.amt} onChange={(e) => setF({ ...f, amt: e.target.value })} />
              <select aria-label="Category" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>
                {CATS.map((c) => <option key={c} value={c}>{cap(c)}</option>)}
              </select>
            </div>
            <div className="field-row">
              <input type="text" maxLength={80} placeholder="Note (optional, no account numbers)" aria-label="Note" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
              <button className="btn" type="submit">Log</button>
            </div>
            {msg && <p className="note" role="status">{msg}</p>}
          </form>
          {lines == null ? <p className="note">Loading…</p> : (
            <>
              <p><b>{money(spent)}</b> <span className="note">spent in {monthLines.length} line{monthLines.length === 1 ? "" : "s"} so far this month</span></p>
              {byCat.map((x) => <div className="filed-row" key={x.c}><span>{cap(x.c)}</span><span>{money(x.t)}</span></div>)}
              {monthLines.length > 0 && (
                <details>
                  <summary className="note">Show this month's lines</summary>
                  {monthLines.map((l) => (
                    <div className="filed-row" key={l.id}>
                      <span>{money(Number(l.amount))} <span className="note">{cap(l.category)} · {prettyDay(sgtDay(l.at))}{l.note ? " · " + l.note : ""}</span></span>
                      <button className="btn sm ghost" type="button" onClick={() => removeSpend(l.id)}>Remove</button>
                    </div>
                  ))}
                </details>
              )}
            </>
          )}
        </>
      )}

      {st.defs.money ? <MoneyPorted d={st.defs.money} loggedToday={loggedToday} /> : <>
      <div className="sec-h">Cash flow, {month}</div>
      <p className="note xd">Money in, minus fixed costs, minus what you logged this month.</p>
      <div className="filed-row"><span>Money in per month</span><span>{money(inc)}</span></div>
      <div className="filed-row"><span>Fixed costs per month</span><span>{money(fixed)}</span></div>
      <div className="filed-row"><span>Logged spending this month</span><span>{money(spent)}</span></div>
      <div className="filed-row"><b>Left this month</b><b>{left < 0 ? "−" + money(-left) : money(left)}</b></div>
      <Lines title="Money in" k="inc" items={m.inc} edit={edit} />
      <Lines title="Fixed costs" k="fixed" items={m.fixed} edit={edit} />

      <div className="sec-h">Coming up, next 30 days</div>
      {coming.length ? coming.map((x) => (
        <div className="filed-row" key={x.it.id}><span>{x.it.name} <span className="note">{LCATS[x.it.cat]} · {x.dd === 0 ? "today" : prettyDay(x.d)}</span></span><span>{money(x.it.amt)}</span></div>
      )) : <p className="note">No bills or money items due in the next 30 days.</p>}
      <p className="note">Bills, renewals and salary are edited in one place: header menu, Settings, Life admin.</p>

      <div className="sec-h">Sinking funds</div>
      {m.funds.map((x) => {
        const pct = x.target > 0 ? Math.min(100, Math.round((x.saved / x.target) * 100)) : 0;
        return (
          <div className="filed-row" key={x.id}>
            <span>{x.name} <span className="note">{money(x.saved)} of {money(x.target)} · {pct >= 100 ? "full" : pct + "%"}</span>
              <span className="mbar" aria-hidden="true"><i style={{ width: pct + "%" }} /></span></span>
            <span className="rep-act">
              <input type="number" min="0" step="0.01" aria-label={`Saved in ${x.name}`} value={x.saved} onChange={(e) => edit((d) => { const y = d.mny.funds.find((i) => i.id === x.id); if (y) y.saved = Math.max(0, +e.target.value || 0); })} />
              <button className="btn sm ghost" type="button" onClick={() => edit((d) => { d.mny.funds = d.mny.funds.filter((i) => i.id !== x.id); })}>Remove</button>
            </span>
          </div>
        );
      })}
      <AddForm label="Add a fund" fields={["Name, for example Car repairs", "Target"]} onAdd={([name, t]) => {
        const target = +t; if (!name || !(target > 0)) return "Give a name and a target above 0.";
        edit((d) => { d.mny.funds.push({ id: uid(), name, target, saved: 0 }); });
      }} />

      <div className="sec-h">Net worth</div>
      <div className="rep-act"><button className="btn sm ghost" type="button" onClick={() => update((d) => { d.mny.hideNw = !d.mny.hideNw; }, ["mny"])}>{m.hideNw ? "Show figures" : "Hide figures"}</button></div>
      {m.hideNw ? <p className="note">Hidden. Tap Show figures when nobody is looking over your shoulder.</p> : (
        <>
          {[...assets, ...debts].map((x) => (
            <div className="filed-row" key={x.id}>
              <span>{x.name} <span className="note">{x.kind === "a" ? "have" : "owe"}</span></span>
              <span className="rep-act">
                <input type="number" min="0" step="0.01" aria-label={`Amount for ${x.name}`} value={x.amt} onChange={(e) => edit((d) => { const y = d.mny.nw.find((i) => i.id === x.id); if (y) y.amt = Math.max(0, +e.target.value || 0); })} />
                <button className="btn sm ghost" type="button" onClick={() => edit((d) => { d.mny.nw = d.mny.nw.filter((i) => i.id !== x.id); })}>Remove</button>
              </span>
            </div>
          ))}
          <div className="filed-row"><b>Net worth</b><b>{(() => { const n = sum(assets) - sum(debts); return n < 0 ? "−" + money(-n) : money(n); })()}</b></div>
          <AddForm label="Add a line (savings, investments, loans; no account numbers)" fields={["Name", "Amount"]} kinds onAdd={([name, a], kind) => {
            const amt = +a; if (!name || !(amt >= 0)) return "Give a name and an amount.";
            edit((d) => { d.mny.nw.push({ id: uid(), name, amt, kind: (kind as MAsset["kind"]) || "a" }); });
          }} />
        </>
      )}

      <Ticks title="Goals" k="goals" items={m.goals} edit={edit} placeholder="A money goal, for example Emergency fund full by June" />
      <Ticks title="Open items" k="open" items={m.open} edit={edit} placeholder="Something to sort out, for example Cancel unused subscription" />
      </>}
    </div>
  );
}

function Lines({ title, k, items, edit }: { title: string; k: ListKey; items: MLine[]; edit: (fn: (d: CourtState) => void) => void }) {
  return (
    <details>
      <summary className="note">Edit {title.toLowerCase()} ({items.length})</summary>
      {items.map((x) => (
        <div className="filed-row" key={x.id}>
          <span>{x.name}</span>
          <span className="rep-act">
            <input type="number" min="0" step="0.01" aria-label={`Amount for ${x.name}`} value={x.amt} onChange={(e) => edit((d) => { const y = d.mny[k].find((i) => i.id === x.id); if (y) y.amt = Math.max(0, +e.target.value || 0); })} />
            <button className="btn sm ghost" type="button" onClick={() => edit((d) => { d.mny[k] = d.mny[k].filter((i) => i.id !== x.id); })}>Remove</button>
          </span>
        </div>
      ))}
      <AddForm label={`Add to ${title.toLowerCase()}`} fields={["Name", "Per month"]} onAdd={([name, a]) => {
        const amt = +a; if (!name || !(amt >= 0)) return "Give a name and a monthly amount.";
        edit((d) => { d.mny[k].push({ id: uid(), name, amt }); });
      }} />
    </details>
  );
}

function Ticks({ title, k, items, edit, placeholder }: { title: string; k: TickKey; items: MItem[]; edit: (fn: (d: CourtState) => void) => void; placeholder: string }) {
  return (
    <>
      <div className="sec-h">{title}</div>
      {items.length ? items.map((x) => (
        <div className="filed-row" key={x.id}>
          <label><input type="checkbox" checked={x.done} onChange={(e) => edit((d) => { const y = d.mny[k].find((i) => i.id === x.id); if (y) y.done = e.target.checked; })} /> {x.done ? <s>{x.t}</s> : x.t}</label>
          <button className="btn sm ghost" type="button" onClick={() => edit((d) => { d.mny[k] = d.mny[k].filter((i) => i.id !== x.id); })}>Remove</button>
        </div>
      )) : <p className="note">Nothing here yet.</p>}
      <AddForm label={`Add to ${title.toLowerCase()}`} fields={[placeholder]} onAdd={([t]) => {
        if (!t) return "Type something first.";
        edit((d) => { d.mny[k].push({ id: uid(), t: t.slice(0, 80), done: false }); });
      }} />
    </>
  );
}

// Small inline add form: text first, then numbers. onAdd returns an error message, or nothing when added.
function AddForm({ label, fields, kinds, onAdd }: { label: string; fields: string[]; kinds?: boolean; onAdd: (v: string[], kind?: string) => string | void }) {
  const [v, setV] = useState<string[]>(fields.map(() => ""));
  const [kind, setKind] = useState("a");
  const [err, setErr] = useState("");
  return (
    <form className="field" onSubmit={(e) => {
      e.preventDefault();
      const r = onAdd(v.map((s) => s.trim()), kind);
      if (r) return setErr(r);
      setErr(""); setV(fields.map(() => ""));
    }}>
      <div className="field-row">
        {fields.map((p, i) => (
          <input key={p} type={i === 0 ? "text" : "number"} min={i === 0 ? undefined : "0"} step={i === 0 ? undefined : "0.01"} maxLength={i === 0 ? 50 : undefined}
            placeholder={p} aria-label={i === 0 ? label : p} value={v[i]} onChange={(e) => setV(v.map((s, j) => (j === i ? e.target.value : s)))} />
        ))}
        {kinds && <select aria-label="Have or owe" value={kind} onChange={(e) => setKind(e.target.value)}><option value="a">Have</option><option value="d">Owe</option></select>}
        <button className="btn sm" type="submit">Add</button>
      </div>
      {err && <p className="note" role="status">{err}</p>}
    </form>
  );
}
