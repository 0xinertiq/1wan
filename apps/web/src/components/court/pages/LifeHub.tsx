"use client";

import { LifeMorning } from "@/components/kumo/decor/room2Life";
import { useEffect, useState } from "react";
import { useCourt } from "../CourtState";
import { LifeAdmin } from "../live/SettingsLive";
import { MoneyLive } from "../live/MoneyLive";
import { FinanceTracker } from "../live/FinanceTracker";
import { Ladder, useTick } from "../live/GridWins";
import { GridAndWins } from "./GridChart";

import { getOnce } from "@/lib/court/once";
import { useVault, type VRow } from "@/lib/vault";
import { routineNext, type Routine, type Task } from "@/lib/court/vaultDue";
import { addDays, dayGap, prettyDay, sgtKeyOf } from "@/lib/court/time";
import { money } from "@/lib/court/state";
import { Bar, Btn, Callout, Card, Chip, EmptyState, PageHead, StoreNote, TabPills, confirmDelete } from "../ui";

// Life Hub (round 7): Grid & Wins full width on top, then one full-width card for Life admin and the Finance
// overview side by side, then Routine | My tasks (round 8: tasks moved here from the Calendar). Long-term planning and life management; tracking only, never advice.

// Round 7: the Goals card is retired from the page (progress lives in Grid & Wins). Saved goals stay in the goals
// table and in Export my data; nothing is deleted.

/* ---------- Routine (pets and self-care routines with a cadence) ---------- */
type R = VRow & Routine;
const KINDS = { pet: "Pet", self: "Self-care", custom: "Other" } as const;
function Routines() {
  const { k } = useCourt();
  const v = useVault<R>("routines");
  const [f, setF] = useState({ name: "", kind: "self" as NonNullable<Routine["kind"]>, every: "7", start: "" });
  const hints = ["Dog grooming", "My haircut", "Yoga"];
  return (
    <Card title="Routine" sub="pets and self-care, with a cadence">
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
/* ---------- My tasks ---------- */
type T = VRow & Task;
const PRI = { high: "High", normal: "Normal", low: "Low" } as const;

/** My tasks (round 8: moved from the Calendar to the Life Hub, the same records): add, tick off, delete. */
function Tasks() {
  const { k } = useCourt();
  const v = useVault<T>("tasks");
  const [f, setF] = useState({ title: "", due: "", pri: "normal" as T["pri"] });
  const [show, setShow] = useState<"open" | "done">("open");
  const rank = { high: 0, normal: 1, low: 2 } as const;
  const list = v.rows.filter((t) => !t.todo && !!t.done === (show === "done"))
    .sort((a, b) => (a.due ?? "9999").localeCompare(b.due ?? "9999") || rank[a.pri ?? "normal"] - rank[b.pri ?? "normal"]);
  const when = (d?: string) => (!d ? "" : d === k ? "today" : d < k ? "overdue" : d === addDays(k, 1) ? "tomorrow" : prettyDay(d));
  return (
    <Card title="My tasks" sub="Kumo tasks · not synced to Google">
      <form className="kform" aria-label="Quick add a task" onSubmit={(e) => { e.preventDefault(); const title = f.title.trim().slice(0, 120); if (!title) return; v.put({ title, due: f.due || undefined, pri: f.pri, done: false }); setF({ ...f, title: "" }); }}>
        <input placeholder="Add a task" aria-label="Task" maxLength={120} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        <div className="kform-row">
          <input type="date" aria-label="Due date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} />
          <select aria-label="Priority" value={f.pri} onChange={(e) => setF({ ...f, pri: e.target.value as T["pri"] })}><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option></select>
          <button className="btn" type="submit">Add</button>
        </div>
      </form>
      <TabPills label="Tasks" value={show} options={[["open", "Open"], ["done", "Done"]] as const} onChange={setShow} />
      {!v.ready ? <EmptyState kind="loading" who="momo">Fetching your tasks…</EmptyState>
        : !list.length ? <EmptyState who="momo">{show === "open" ? "Nothing on your list. Add a task above." : "Nothing ticked off yet."}</EmptyState>
        : list.slice(0, 40).map((t) => (
          <div className={"krow" + (t.done ? " done" : "")} key={t.id}>
            <label className="kcheck"><input type="checkbox" checked={!!t.done} onChange={(e) => v.put({ id: t.id, done: e.target.checked })} /><span className="sr">Done: {t.title}</span></label>
            <span className="krow-main">{t.title} {t.pri === "high" && <Chip tone="sakura">{PRI.high}</Chip>}{t.due && <><br /><time className="ts">{when(t.due)}</time></>}</span>
            <span className="krow-act"><Btn kind="sm ghost" onClick={() => confirmDelete(`“${t.title}”`) && v.remove(t.id)} aria-label={`Delete ${t.title}`}>Delete</Btn></span>
          </div>
        ))}
      <StoreNote status={v.status} />
    </Card>
  );
}

/** Life admin and the Finance overview in one full-width card, side by side (stacked on the phone). */
function AdminAndMoney() {
  const { st } = useCourt();
  const [tab, setTab] = useState<"overview" | "spend" | "budgets">("overview");
  return (
    <Card title="Life admin and money" sub="Coco · bills, bookings, renewals and spending, manual only" className="kfull">
      <div className="ksplit">
        <div className="ksplit-col">
          <div className="sec-h">Life admin</div>
          <LifeAdmin />
        </div>
        <div className="ksplit-col">
          <div className="sec-h">Finance overview</div>
          {/* round 9: Money Wins on top of the first tab, then the editable overview figures, cash flow and loans */}
          <TabPills label="Finance" value={tab} options={[["overview", "Overview"], ["spend", "Log a spend"], ["budgets", "Budgets and CSV"]] as const} onChange={setTab} />
          {tab === "overview" ? <><MoneyWins /><FinanceTracker d={st.defs.money} /></> : tab === "spend" ? <MoneyLive only="spend" /> : <Budgets />}
        </div>
      </div>
      <Callout tone="lav">Private to you. No bank link and no account numbers: everything here is typed or imported by you. Tracking only, not advice.</Callout>
    </Card>
  );
}

export function LifeHub() {
  return (
    <div className="kpage">
      <PageHead room={<LifeMorning />} title="Life Hub" sub="Long-term planning and life management: your chart, life admin, money and routine." />
      <GridAndWins />
      <AdminAndMoney />
      <div className="kpg two even">
        <div className="kcol"><Routines /></div>
        <div className="kcol"><Tasks /></div>
      </div>
    </div>
  );
}
