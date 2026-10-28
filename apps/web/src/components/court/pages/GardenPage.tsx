"use client";

import { useState } from "react";
import { useCourt } from "../CourtState";
import { GardenLive } from "../live/GrowLive";
import { KumoPick } from "../live/TodayLive";
import { Ladder, useTick, useWinsAuto } from "../live/GridWins";
import { weekHab } from "@/lib/court/state";
import { addDays, weekKey, wdName, wdOf } from "@/lib/court/time";
import { newId } from "@/lib/vault";
import type { Habit } from "@/lib/court/state";
import { Btn, Card, Chip, EmptyState, PageHead, confirmDelete } from "../ui";

// Garden (round 6): the habit tracker. Left, the pixel sakura garden; right, Daily anchors | Branches | Quests |
// Wins ladder | My habits | This week. Quest, XP, streak and tail logic are untouched; her own habits live in the
// optional key hab and never award XP. Rest days are simply the days a habit is not scheduled.

/** Her own habits: add, rename, pause, schedule by weekday, tick today. Calm wording, nothing punitive. */
export function HabitEditor() {
  const { st, k, update } = useCourt();
  const [f, setF] = useState({ name: "", days: [1, 2, 3, 4, 5] as number[] });
  const [edit, setEdit] = useState<string | null>(null);
  const [name, setName] = useState("");
  const wd = wdOf(k);
  const doneToday = st.hab.log[k] ?? [];
  const save = (fn: (list: Habit[], log: Record<string, string[]>) => void) => update((d) => { const list = d.hab.list.map((h) => ({ ...h })), log = { ...d.hab.log }; fn(list, log); d.hab = { list, log }; }, ["hab"]);
  const dayChips = (days: number[], set: (x: number[]) => void) => (
    <div className="kchips" role="group" aria-label="Days">{[1, 2, 3, 4, 5, 6, 0].map((d) => <button key={d} type="button" className="chipb" aria-pressed={days.includes(d)} onClick={() => set(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])}>{wdName(d).slice(0, 3)}</button>)}</div>
  );
  return (
    <div className="kform">
      <form className="kform" aria-label="Add a habit" onSubmit={(e) => { e.preventDefault(); const n = f.name.trim().slice(0, 60); if (!n) return; save((list) => { list.push({ id: newId("h"), name: n, days: [...f.days].sort(), at: k }); }); setF({ ...f, name: "" }); }}>
        <input aria-label="New habit" maxLength={60} placeholder="A small habit, for example: ten minutes of stretching" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        {dayChips(f.days, (days) => setF({ ...f, days }))}
        <button className="btn" type="submit">Add habit</button>
      </form>
      {!st.hab.list.length ? <EmptyState who="coco">No habits of your own yet. The quests and anchors above keep running either way.</EmptyState>
        : st.hab.list.map((h) => {
          const today = h.days.includes(wd) && !h.paused, on = doneToday.includes(h.id);
          return (
            <div className={"krow" + (on ? " done" : "")} key={h.id}>
              {today ? <label className="kcheck"><input type="checkbox" checked={on} onChange={(e) => save((_, log) => { const cur = new Set(log[k] ?? []); if (e.target.checked) cur.add(h.id); else cur.delete(h.id); log[k] = [...cur]; })} /><span className="sr">Done today: {h.name}</span></label> : <span className="note">rest</span>}
              <span className="krow-main">{edit === h.id
                ? <form className="kform-row" onSubmit={(e) => { e.preventDefault(); save((list) => { const x = list.find((y) => y.id === h.id); if (x && name.trim()) x.name = name.trim().slice(0, 60); }); setEdit(null); }}><input aria-label="Habit name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} /><button className="btn sm" type="submit">Save</button></form>
                : <><b>{h.name}</b> {h.paused && <Chip tone="sky">paused</Chip>}<br /><span className="note">{h.days.length === 7 ? "every day" : h.days.map((d) => wdName(d).slice(0, 3)).join(" · ") || "no days yet"}</span></>}
                {edit === h.id && dayChips(h.days, (days) => save((list) => { const x = list.find((y) => y.id === h.id); if (x) x.days = days.sort(); }))}</span>
              <span className="krow-act">
                <Btn kind="sm ghost" onClick={() => { setEdit(edit === h.id ? null : h.id); setName(h.name); }}>{edit === h.id ? "Done" : "Edit"}</Btn>
                <Btn kind="sm ghost" onClick={() => save((list) => { const x = list.find((y) => y.id === h.id); if (x) x.paused = !x.paused || undefined; })}>{h.paused ? "Resume" : "Pause"}</Btn>
                <Btn kind="sm ghost" onClick={() => confirmDelete(h.name) && save((list) => { list.splice(list.findIndex((y) => y.id === h.id), 1); })}>Delete</Btn>
              </span>
            </div>
          );
        })}
      <p className="note">Days off are rest days. Pausing keeps everything; nothing is lost.</p>
    </div>
  );
}

/** Small Wins ladder (ids, auto items b3 and b6 and self-report labels unchanged). */
export function WinsLadder() {
  const { st } = useCourt();
  const tick = useTick(), auto = useWinsAuto();
  const sw = st.defs.swins;
  return sw ? <Ladder title="Small Wins ladder" phases={sw.phases.filter((p) => !p.daily)} done={st.swins.done} auto={auto} onTick={(id, on) => tick("swins", id, on, "milestone")} />
    : <EmptyState who="coco">Your Small Wins ladder arrives with the tracker import.</EmptyState>;
}

/** This week in the garden, rule-based. The Weekly targets live in the Life Hub (a link, not a copy). */
export function habitWeek(st: { hab: { list: Habit[]; log: Record<string, string[]> }; swins: { log: Record<string, string[]> } }, k: string) {
  const wk = weekKey(k), days = Array.from({ length: 7 }, (_, i) => addDays(wk, i)).filter((d) => d <= k);
  const planned = days.reduce((t, d) => { const wd = wdOf(d); return t + st.hab.list.filter((h) => !h.paused && h.days.includes(wd)).length; }, 0);
  const done = days.reduce((t, d) => t + (st.hab.log[d] ?? []).filter((id) => st.hab.list.some((h) => h.id === id)).length, 0);
  const anchors = days.reduce((t, d) => t + (st.swins.log[d] ?? []).length, 0);
  return { days: days.length, planned, done, anchors };
}
function WeekBack() {
  const { st, k } = useCourt();
  const q = weekHab(st, k), h = habitWeek(st, k);
  return (
    <div className="kform">
      <ul className="rv-sug">
        <li>{q.d} of {q.t} daily quests so far this week</li>
        <li>{h.anchors} daily anchor tick{h.anchors === 1 ? "" : "s"}</li>
        {h.planned > 0 && <li>{h.done} of {h.planned} of your own habits</li>}
        <li>{st.streak}-day streak</li>
      </ul>
      <p className="note">{q.t && q.d / q.t >= 0.5 ? "The tree is filling out. Keep it gentle." : "Any small thing waters the garden. Rest days count as care too."}</p>
      <a href="#grid-wins">Weekly targets (study, thesis, posts) in the Life Hub →</a>
    </div>
  );
}

export function GardenPage() {
  return (
    <div className="kpage">
      <PageHead scene="garden" title="Sakura Garden" sub="Habits and growth. Real activity waters the garden; nothing is ever lost." />
      <Card title="Kumo's pick" className="kpick"><KumoPick /></Card>
      <GardenLive extra={[
        { id: "wins", label: "Wins ladder", node: <WinsLadder /> },
        { id: "habits", label: "My habits", node: <HabitEditor /> },
        { id: "week", label: "This week", node: <WeekBack /> },
      ]} />
    </div>
  );
}
