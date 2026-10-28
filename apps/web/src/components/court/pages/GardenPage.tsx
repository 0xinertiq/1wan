"use client";

import { useState } from "react";
import { useCourt } from "../CourtState";
import { GardenLive } from "../live/GrowLive";
import { KumoPick } from "../live/TodayLive";
import { Ladder, useTick, useWinsAuto } from "../live/GridWins";
import { wdName, wdOf } from "@/lib/court/time";
import { HAB_PREFIX, habitPhase, habitQuests, habitWeek } from "@/lib/court/habits";
import { newId } from "@/lib/vault";
import type { Habit } from "@/lib/court/state";
import { Btn, Card, Chip, EmptyState, PageHead, confirmDelete } from "../ui";

// Garden (round 7): the pixel sakura garden on top, then two columns of cards (Daily anchors, My habits | Branches,
// Quests, Wins ladder). My habits is the one place to add or edit her habits; Quests and the Wins ladder read the
// same list. Quest, XP, streak and tail logic are untouched; her own habits live in the optional key hab and never
// award XP. Rest days are simply the days a habit is not scheduled.

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
      {!st.hab.list.length ? <EmptyState who="coco">No habits of your own yet. Anything you add here also shows in Quests and the Wins ladder.</EmptyState>
        : st.hab.list.map((h) => {
          const today = h.days.includes(wd) && !h.paused, on = doneToday.includes(h.id);
          return (
            <div className={"krow" + (on ? " done" : "")} key={h.id}>
              {today ? <label className="kcheck"><input type="checkbox" checked={on} onChange={(e) => save((_, log) => { const cur = new Set(log[k] ?? []); if (e.target.checked) cur.add(h.id); else cur.delete(h.id); log[k] = [...cur]; })} /><span className="sr">Done today: {h.name}</span></label> : <span className="note">rest</span>}
              <span className="krow-main">{edit === h.id
                ? <form className="kform-row" onSubmit={(e) => { e.preventDefault(); save((list) => { const x = list.find((y) => y.id === h.id); if (x && name.trim()) x.name = name.trim().slice(0, 60); }); setEdit(null); }}><input aria-label="Habit name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} /><button className="btn sm" type="submit">Save</button></form>
                : <><b>{h.name}</b> {h.paused && <Chip tone="peach">paused</Chip>}<br /><span className="note">{h.days.length === 7 ? "every day" : h.days.map((d) => wdName(d).slice(0, 3)).join(" · ") || "no days yet"}</span></>}
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

/** Small Wins ladder (ids, auto items b3 and b6 and self-report labels unchanged), plus her own habits as one
 *  derived phase at the end (from My habits; ticking one ticks today's habit, never a Small Wins id). */
export function WinsLadder() {
  const { st, k, update } = useCourt();
  const tick = useTick(), auto = useWinsAuto();
  const sw = st.defs.swins, mine = habitPhase(st.hab, k);
  const onTick = (id: string, on: boolean) => {
    if (!id.startsWith(HAB_PREFIX)) return tick("swins", id, on, "milestone");
    const hid = id.slice(HAB_PREFIX.length);
    update((d) => { const cur = new Set(d.hab.log[k] ?? []); if (on) cur.add(hid); else cur.delete(hid); d.hab = { ...d.hab, log: { ...d.hab.log, [k]: [...cur] } }; }, ["hab"]);
  };
  if (!sw && !mine) return <EmptyState who="coco">Your Small Wins ladder arrives with the tracker import.</EmptyState>;
  return <Ladder title="Small Wins ladder" phases={[...(sw ? sw.phases.filter((p) => !p.daily) : []), ...(mine ? [mine.phase] : [])]} done={{ ...st.swins.done, ...(mine?.done ?? {}) }} auto={auto} onTick={onTick} />;
}

/** Today's habits inside the Quests card: the same habits as My habits, ticked in one place or the other. */
function HabitQuests() {
  const { st, k, update } = useCourt();
  const rows = habitQuests(st.hab, k);
  if (!rows.length) return null;
  const set = (id: string, on: boolean) => update((d) => { const cur = new Set(d.hab.log[k] ?? []); if (on) cur.add(id); else cur.delete(id); d.hab = { ...d.hab, log: { ...d.hab.log, [k]: [...cur] } }; }, ["hab"]);
  return (
    <div className="kform">
      <div className="sec-h">Your habits today</div>
      {rows.map((h) => <label className={"kcheck krow" + (h.done ? " done" : "")} key={h.id}><input type="checkbox" checked={h.done} onChange={(e) => set(h.id, e.target.checked)} /><span className="krow-main">{h.name}</span></label>)}
    </div>
  );
}

export { habitWeek };

export function GardenPage() {
  return (
    <div className="kpage">
      <PageHead scene="garden" title="Sakura Garden" sub="Habits and growth. Real activity waters the garden; nothing is ever lost." />
      <GardenLive slots={{
        pick: <div className="kpick-in"><div className="sec-h">Kumo&apos;s pick</div><KumoPick /></div>,
        habits: <Card title="My habits" sub="the one place to add or edit">{<HabitEditor />}</Card>,
        quests: <HabitQuests />,
        wins: <Card title="Wins ladder"><WinsLadder /></Card>,
      }} />
    </div>
  );
}
