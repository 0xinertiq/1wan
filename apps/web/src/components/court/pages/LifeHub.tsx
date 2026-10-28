"use client";

import { useEffect, useState } from "react";
import { useCourt } from "../CourtState";
import { LifeAdmin } from "../live/SettingsLive";
import { MoneyLive } from "../live/MoneyLive";
import { Ladder, useTick } from "../live/GridWins";
import { GridAndWins } from "./GridChart";
import { chartOf, hasChart } from "@/lib/court/harada";
import { getOnce } from "@/lib/court/once";
import { useVault, newId, type VRow } from "@/lib/vault";
import { routineNext, type Routine } from "@/lib/court/vaultDue";
import { dayGap, prettyDay, sgtKeyOf } from "@/lib/court/time";
import { money } from "@/lib/court/state";
import { Bar, Btn, Callout, Card, Chip, EmptyState, PageHead, StoreNote, TabPills, confirmDelete } from "../ui";

// Life Hub (round 6 with addenda 1 and 2): Grid & Wins full width on top, then a 2x2 grid: Goals, Life admin,
// Pets and self-care, Finance overview. Long-term planning and life management; tracking only, never advice.

/* ---------- Goals: the chart's main goal as a summary and link (no copy of the chart), plus standalone goals ---------- */
type Goal = VRow & { title: string; why: string; target: string; ms: { id: string; t: string; done: boolean }[] };
function Goals() {
  const { st } = useCourt();
  const v = useVault<Goal>("goals");
  const chart = chartOf(st.defs.grid, st.gridDefs);
  const ticked = Object.keys(st.grid.done).filter((id) => st.grid.done[id] && /^[1-8]\.[1-8]$/.test(id)).length;
  const [f, setF] = useState<{ title: string; why: string; target: string } | null>(null);
  const [ms, setMs] = useState<Record<string, string>>({});
  return (
    <Card title="Goals" sub="milestones you can tick off" actions={!f ? <Btn kind="sm" onClick={() => setF({ title: "", why: "", target: "" })}>Add a goal</Btn> : null}>
      {hasChart(chart) && (
        <div className="krow"><span className="krow-main"><b>{chart!.goal}</b><br /><span className="note">Your main goal · {ticked} of 64 actions done</span></span><a href="#grid-wins">Open the chart →</a></div>
      )}
      {hasChart(chart) && <Bar v={ticked} max={64} label={`${ticked} of 64 actions done`} />}
      {f && (
        <form className="kform" aria-label="New goal" onSubmit={(e) => { e.preventDefault(); if (!f.title.trim()) return; v.put({ title: f.title.trim().slice(0, 80), why: f.why.slice(0, 300), target: f.target, ms: [] }); setF(null); }}>
          <input aria-label="Goal" maxLength={80} placeholder="Goal, for example: relocate, buy a home, start a business" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required />
          <input aria-label="Why" maxLength={300} placeholder="Why it matters" value={f.why} onChange={(e) => setF({ ...f, why: e.target.value })} />
          <div className="kform-row"><input type="date" aria-label="Target date" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value })} /><button className="btn" type="submit">Save</button><Btn kind="ghost" onClick={() => setF(null)}>Cancel</Btn></div>
        </form>
      )}
      {!v.ready ? <EmptyState kind="loading" who="coco">Opening your goals…</EmptyState>
        : !v.rows.length ? <EmptyState who="coco">No standalone goals yet. Ideas: a relocation, a property, a business. Each gets milestones and a progress bar.</EmptyState>
        : v.rows.map((g) => {
          const n = g.ms.filter((m) => m.done).length;
          return (
            <details key={g.id} className="pillar">
              <summary><b>{g.title}</b> <span className="note">{n}/{g.ms.length}{g.target ? ` · by ${prettyDay(g.target)}` : ""}</span></summary>
              <Bar v={n} max={g.ms.length || 1} label={`${n} of ${g.ms.length} milestones`} />
              {g.why && <p className="note">{g.why}</p>}
              {g.ms.map((m) => (
                <div className={"krow" + (m.done ? " done" : "")} key={m.id}>
                  <label className="kcheck"><input type="checkbox" checked={m.done} onChange={(e) => v.put({ id: g.id, ms: g.ms.map((x) => (x.id === m.id ? { ...x, done: e.target.checked } : x)) })} /><span className="sr">Done</span></label>
                  <span className="krow-main">{m.t}</span>
                  <Btn kind="sm ghost" aria-label={`Remove milestone ${m.t}`} onClick={() => v.put({ id: g.id, ms: g.ms.filter((x) => x.id !== m.id) })}>Remove</Btn>
                </div>
              ))}
              <form className="kform-row" onSubmit={(e) => { e.preventDefault(); const t = (ms[g.id] ?? "").trim().slice(0, 100); if (!t) return; v.put({ id: g.id, ms: [...g.ms, { id: newId("m"), t, done: false }] }); setMs({ ...ms, [g.id]: "" }); }}>
                <input aria-label={`New milestone for ${g.title}`} placeholder="Add a milestone" maxLength={100} value={ms[g.id] ?? ""} onChange={(e) => setMs({ ...ms, [g.id]: e.target.value })} />
                <button className="btn sm" type="submit">Add</button>
                <Btn kind="sm ghost" onClick={() => confirmDelete(`the goal “${g.title}”`) && v.remove(g.id)}>Delete goal</Btn>
              </form>
            </details>
          );
        })}
      <StoreNote status={v.status} />
    </Card>
  );
}

/* ---------- Pets and self-care routines ---------- */
type R = VRow & Routine;
const KINDS = { pet: "Pet", self: "Self-care", custom: "Other" } as const;
function Routines() {
  const { k } = useCourt();
  const v = useVault<R>("routines");
  const [f, setF] = useState({ name: "", kind: "self" as NonNullable<Routine["kind"]>, every: "7", start: "" });
  const hints = ["Dog grooming", "My haircut", "Yoga"];
  return (
    <Card title="Pets and self-care" sub="routines with a cadence">
      <form className="kform" aria-label="Add a routine" onSubmit={(e) => { e.preventDefault(); const name = f.name.trim().slice(0, 60); if (!name) return; v.put({ name, kind: f.kind, every: Math.max(1, Math.min(365, Math.round(+f.every || 7))), start: f.start || k }); setF({ ...f, name: "" }); }}>
        <input aria-label="Routine" list="rhints" maxLength={60} placeholder="Routine, for example: dog grooming" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <datalist id="rhints">{hints.map((h) => <option key={h} value={h} />)}</datalist>
        <div className="kform-row">
          <select aria-label="Kind" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as typeof f.kind })}>{Object.entries(KINDS).map(([x, l]) => <option key={x} value={x}>{l}</option>)}</select>
          <input type="number" min="1" max="365" aria-label="Every how many days" placeholder="Every n days" value={f.every} onChange={(e) => setF({ ...f, every: e.target.value })} />
          <input type="date" aria-label="First due" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} />
          <button className="btn" type="submit">Add</button>
        </div>
      </form>
      {!v.ready ? <EmptyState kind="loading" who="coco">Opening routines…</EmptyState>
        : !v.rows.length ? <EmptyState who="coco">No routines yet. Dog grooming, your own grooming, yoga or anything with a rhythm.</EmptyState>
        : [...v.rows].sort((a, b) => routineNext(a, k).localeCompare(routineNext(b, k))).map((r) => {
          const next = routineNext(r, k), dd = dayGap(k, next);
          return (
            <div className="krow" key={r.id}>
              <span className="krow-main"><b>{r.name}</b> <Chip tone={r.kind === "pet" ? "peach" : "lav"}>{KINDS[r.kind ?? "custom"]}</Chip>{r.paused && <Chip tone="peach">paused</Chip>}
                <br /><span className="note">every {r.every} days · next {dd < 0 ? "was " + prettyDay(next) : dd === 0 ? "today" : prettyDay(next)}</span></span>
              <span className="krow-act">
                <Btn kind="sm" onClick={() => v.put({ id: r.id, last: k })}>Done today</Btn>
                <Btn kind="sm ghost" onClick={() => v.put({ id: r.id, paused: !r.paused })}>{r.paused ? "Resume" : "Pause"}</Btn>
                <Btn kind="sm ghost" onClick={() => confirmDelete(r.name) && v.remove(r.id)}>Delete</Btn>
              </span>
            </div>
          );
        })}
      <p className="note">Routines due within 3 days show in Needs you now on the Court.</p>
      <StoreNote status={v.status} />
    </Card>
  );
}

/* ---------- Finance overview: this month (spending table and typed figures), budgets and CSV, Money Wins ---------- */
type Fin = VRow & { kind: "budget" | "entry"; cat: string; amt: number; date?: string; type?: "in" | "out"; note?: string };
const CATS = ["food", "transport", "home", "bills", "health", "pets", "fun", "shopping", "gifts", "other"];
type Line = { at: string; amount: number; category: string };
/** CSV rows "date,amount,category,note" (a header row is skipped); negative or "out" amounts are spending. */
export function parseCsv(text: string): { date: string; amt: number; cat: string; note: string; type: "in" | "out" }[] {
  return text.split(/\r?\n/).map((l) => (l.match(/("([^"]|"")*"|[^,]*)(,|$)/g) ?? []).map((c) => c.replace(/,$/, "").trim().replace(/^"|"$/g, "").replace(/""/g, "\""))).filter((c) => c.length >= 2 && /^\d{4}-\d{2}-\d{2}$/.test(c[0]) && Number.isFinite(parseFloat(c[1])))
    .slice(0, 500).map(([date, a, cat = "other", note = ""]) => ({ date, amt: Math.abs(parseFloat(a)), cat: CATS.includes(cat.toLowerCase()) ? cat.toLowerCase() : cat.toLowerCase() === "income" ? "income" : "other", note: note.slice(0, 120), type: parseFloat(a) < 0 || cat.toLowerCase() !== "income" ? "out" : "in" }));
}
function Budgets() {
  const { k } = useCourt();
  const v = useVault<Fin>("finance_entries");
  const month = k.slice(0, 7);
  const [lines, setLines] = useState<Line[]>([]);
  useEffect(() => { getOnce<{ lines?: Line[] }>("/api/spending?from=" + month + "-01").then((j) => setLines(Array.isArray(j?.lines) ? j.lines : [])).catch(() => setLines([])); }, [month]);
  const [b, setB] = useState({ cat: "food", amt: "" });
  const [msg, setMsg] = useState("");
  const budgets = v.rows.filter((r) => r.kind === "budget"), entries = v.rows.filter((r) => r.kind === "entry" && String(r.date ?? "").startsWith(month));
  const spentOn = (c: string) => lines.filter((l) => sgtKeyOf(l.at).startsWith(month) && l.category === c).reduce((t, l) => t + Number(l.amount), 0) + entries.filter((e) => e.type === "out" && e.cat === c).reduce((t, e) => t + e.amt, 0);
  const income = entries.filter((e) => e.type === "in").reduce((t, e) => t + e.amt, 0);
  async function importCsv(file: File) {
    const rows = parseCsv(await file.text());
    if (!rows.length) return setMsg("No rows found. Use: date (YYYY-MM-DD), amount, category, note.");
    for (const r of rows) v.put({ kind: "entry", ...r });
    setMsg(`Imported ${rows.length} rows.`);
  }
  return (
    <>
      <form className="kform-row" aria-label="Set a monthly budget" onSubmit={(e) => { e.preventDefault(); const amt = +b.amt; if (!(amt > 0)) return; const old = budgets.find((x) => x.cat === b.cat); v.put({ ...(old ? { id: old.id } : {}), kind: "budget", cat: b.cat, amt }); setB({ ...b, amt: "" }); }}>
        <select aria-label="Budget category" value={b.cat} onChange={(e) => setB({ ...b, cat: e.target.value })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
        <input type="number" min="0" step="0.01" aria-label="Monthly budget" placeholder="Monthly budget" value={b.amt} onChange={(e) => setB({ ...b, amt: e.target.value })} />
        <button className="btn" type="submit">Set</button>
      </form>
      {!budgets.length ? <EmptyState who="coco">No budgets yet. Set one per category; spending from this month fills the bars.</EmptyState> : (
        <div className="kbars">
          {budgets.map((x) => { const sp = spentOn(x.cat); return [<span key={x.id + "a"}>{x.cat}</span>, <Bar key={x.id + "b"} v={sp} max={x.amt} tone={sp > x.amt ? "danger" : "mint"} label={`${x.cat}: ${money(sp)} of ${money(x.amt)}`} />, <span key={x.id + "c"} className="note">{money(sp)} / {money(x.amt)} <button className="btn sm ghost" type="button" aria-label={`Remove the ${x.cat} budget`} onClick={() => v.remove(x.id)}>×</button></span>]; })}
        </div>
      )}
      {income > 0 && <p className="note">Imported income this month: {money(income)}</p>}
      <label className="kform">Import a CSV (date, amount, category, note)<input type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCsv(f); e.target.value = ""; }} /></label>
      {msg && <p className="note" role="status">{msg}</p>}
      {entries.length > 0 && <details><summary className="note">{entries.length} imported entries this month</summary>{entries.slice(0, 60).map((e) => <div className="krow" key={e.id}><span className="krow-main">{e.date ? prettyDay(e.date) : ""} · {e.cat} · {e.type === "in" ? "+" : "−"}{money(e.amt)} {e.note}</span><Btn kind="sm ghost" onClick={() => v.remove(e.id)}>Delete</Btn></div>)}</details>}
      <StoreNote status={v.status} />
    </>
  );
}
function MoneyWins() {
  const { st } = useCourt();
  const tick = useTick();
  const mw = st.defs.money;
  return mw ? <Ladder title="Money Wins Q4 ladder" phases={mw.phases} done={st.money.done} auto={{}} onTick={(id, on) => tick("money", id, on, "milestone")} />
    : <EmptyState who="coco">Your Money Wins ladder arrives with the tracker import.</EmptyState>;
}
function Finance() {
  const [tab, setTab] = useState<"month" | "budgets" | "wins">("month");
  return (
    <Card title="Finance overview" sub="manual only">
      <TabPills label="Finance" value={tab} options={[["month", "This month"], ["budgets", "Budgets and CSV"], ["wins", "Money Wins"]] as const} onChange={setTab} />
      {tab === "month" ? <MoneyLive /> : tab === "budgets" ? <Budgets /> : <MoneyWins />}
      <Callout tone="lav">Private to you. No bank link and no account numbers: everything here is typed or imported by you. Tracking only, not advice.</Callout>
    </Card>
  );
}

export function LifeHub() {
  return (
    <div className="kpage">
      <PageHead scene="cottage" title="Life Hub" sub="Long-term planning and life management: your chart, goals, life admin, routines and money." actions={<a className="btn sm ghost" href="#grid-wins">Grid & Wins</a>} />
      <GridAndWins />
      <div className="kpg quad">
        <div className="kcol"><Goals /></div>
        <div className="kcol"><Card title="Life admin" sub="Coco · bills, bookings, renewals"><LifeAdmin /></Card></div>
        <div className="kcol"><Routines /></div>
        <div className="kcol"><Finance /></div>
      </div>
    </div>
  );
}
