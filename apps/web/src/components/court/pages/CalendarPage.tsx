"use client";

import { useState } from "react";
import { useCourt } from "../CourtState";
import { eventsOn, isSkyItem } from "@/lib/court/state";
import { addDays, hm, monthTitle, prettyDay, weekKey, wdName, wdOf } from "@/lib/court/time";
import { openTab } from "@/lib/court/nav";
import { useVault, type VRow } from "@/lib/vault";
import { dueSoon, type Task } from "@/lib/court/vaultDue";
import { Btn, Card, Chip, EmptyState, PageHead, StoreNote, TabPills, confirmDelete } from "../ui";
import { ClockRoom } from "@/components/kumo/decor/ClockRoom";

// Calendar (round 7): the clock-tower room banner, then two even columns. Left: the Day | Week | Month | Agenda
// views of her read-only Google Calendar, then Upcoming. Right: the economic calendar, her own tasks (never written
// to Google), then Month at a glance. No astrology anywhere on this tab (isAstro filters every list).

type T = VRow & Task;
const PRI = { high: "High", normal: "Normal", low: "Low" } as const;

function Tasks() {
  const { k } = useCourt();
  const v = useVault<T>("tasks");
  const [f, setF] = useState({ title: "", due: "", pri: "normal" as T["pri"] });
  const [show, setShow] = useState<"open" | "done">("open");
  const rank = { high: 0, normal: 1, low: 2 } as const;
  const list = v.rows.filter((t) => !!t.done === (show === "done"))
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

// The selected day (and today) wear a pixel heart in transparent pink: outline and light fill, never a solid block.
const HEART = [".XX.XX.", "XppXppX", "XpppppX", ".XpppX.", "..XpX..", "...X..."];
function Heart({ filled }: { filled: boolean }) {
  return (
    <svg className={"kheart" + (filled ? " on" : "")} viewBox="0 0 7 6" shapeRendering="crispEdges" aria-hidden="true">
      {HEART.flatMap((row, y) => row.split("").map((c, x) => (c === "." || (c === "p" && !filled) ? null : <rect key={x + "-" + y} className={c === "X" ? "kh-x" : "kh-p"} x={x} y={y} width={1} height={1} />)))}
    </svg>
  );
}

export function MiniMonth({ marks, onPick, picked, label = "Mini month" }: { marks: (d: string) => boolean; onPick: (d: string) => void; picked?: string | null; label?: string }) {
  const { k } = useCourt();
  const [m, setM] = useState(k.slice(0, 8) + "01");
  const start = weekKey(m);
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i)).filter((d, i) => i < 35 || d.slice(0, 7) === m.slice(0, 7));
  return (
    <div aria-label={label}>
      <div className="kmini-head">
        <Btn kind="sm ghost" aria-label="Previous month" onClick={() => setM(addDays(m, -1).slice(0, 8) + "01")}>‹</Btn>
        <b>{monthTitle(m)}</b>
        <Btn kind="sm ghost" aria-label="Next month" onClick={() => setM(addDays(m, 32).slice(0, 8) + "01")}>›</Btn>
      </div>
      <div className="kmini">
        {["M", "T", "W", "T", "F", "S", "S"].map((w, i) => <span key={i} aria-hidden="true">{w}</span>)}
        {days.map((d) => (
          <button key={d} type="button" className={(d.slice(0, 7) !== m.slice(0, 7) ? "out " : "") + (d === k ? "today " : "") + (marks(d) ? "has" : "")} aria-pressed={picked === d} aria-label={prettyDay(d) + (d === k ? ", today" : "") + (marks(d) ? ", has items" : "")} onClick={() => onPick(d)}>
            {(picked === d || d === k) && <Heart filled={picked === d} />}<span>{+d.slice(8)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Upcoming() {
  const { k, events } = useCourt();
  const tasks = useVault<T>("tasks"), routines = useVault("routines");
  const due = dueSoon(tasks.rows, routines.rows as never, k, 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(k, i));
  const rows = days.map((d) => ({ d, ev: eventsOn(events, d).filter((e) => !isSkyItem(e)), due: due.filter((x) => x.d === d || (d === k && x.dd < 0)) })).filter((x) => x.ev.length || x.due.length);
  return (
    <Card title="Upcoming" sub="next 7 days">
      {!rows.length ? <EmptyState who="momo">A clear week ahead.</EmptyState> : rows.map((x) => (
        <div className="krow" key={x.d}>
          <span className="krow-main"><a href={`?day=${x.d}#calendar`} onClick={(e) => { e.preventDefault(); openTab("calendar", { day: x.d }); }}><b>{x.d === k ? "Today" : `${wdName(wdOf(x.d)).slice(0, 3)} ${+x.d.slice(8)}`}</b></a>
            <br /><span className="note">{[...x.ev.slice(0, 3).map((e) => (e.allDay ? e.t : `${hm(e.a)} ${e.t}`)), ...x.due.map((t) => `${t.name}${t.dd < 0 ? " (overdue)" : ""}`)].join(" · ")}{x.ev.length > 3 ? ` · +${x.ev.length - 3} more` : ""}</span></span>
        </div>
      ))}
    </Card>
  );
}

export function CalendarPage({ main, econ }: { main: React.ReactNode; econ: React.ReactNode }) {
  const { events } = useCourt();
  const tasks = useVault<T>("tasks");
  return (
    <div className="kpage">
      <PageHead scene="clock" room={<ClockRoom />} title="Calendar" sub="Your time and scheduling: events, tasks and the releases that move liquidity." />
      <div className="kpg two even">
        <div className="kcol">{main}<Upcoming /></div>
        <div className="kcol">
          <div id="econ-cal">{econ}</div>
          <Tasks />
          <Card title="Month at a glance">
            <MiniMonth marks={(d) => eventsOn(events, d).some((e) => !isSkyItem(e)) || tasks.rows.some((t) => t.due === d && !t.done)} onPick={(d) => openTab("calendar", { day: d })} />
          </Card>
        </div>
      </div>
    </div>
  );
}
