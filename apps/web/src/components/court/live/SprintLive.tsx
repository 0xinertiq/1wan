"use client";

import { useEffect, useState } from "react";
import { useCourt } from "../CourtState";
import { logQuest } from "@/lib/court/actions";
import { isDone } from "@/lib/court/state";
import { SPRINT_MIN, sprintHours, type SprintTag } from "@/lib/court/sprint";
import { weekKey, sgtKeyOf } from "@/lib/court/time";

// One 25-minute focus sprint with a tag (Study or Other). The running sprint is saved, so a reload keeps it.
// A sprint that reaches 25 minutes is logged, counts quest k7, and study sprints add to Samsara's hours.
// The sprint's state and actions, shared by this window (Classic) and the hourglass in the New-look world.
const PAUSE = "1wan-sprint-pause";

export function useSprint() {
  const { st, update, levelUp } = useCourt();
  const [now, setNow] = useState(() => Date.now());
  const run = st.spr.run;
  // Pause (owner approved, round 5b): the remaining seconds are kept on this device while paused; resuming
  // moves the saved start time forward by the paused stretch, so the saved state keeps its shape.
  const [pz, setPz] = useState<{ at: string; left: number } | null>(null);
  useEffect(() => { try { const p = JSON.parse(localStorage.getItem(PAUSE) ?? "null"); setPz(p && run && p.at === run.at ? p : null); } catch {} }, [run]);
  const paused = !!(pz && run && pz.at === run.at);
  useEffect(() => { if (!run || paused) return; const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, [run, paused]);
  const left = run ? (paused ? pz!.left : Math.max(0, SPRINT_MIN * 60 - Math.floor((now - Date.parse(run.at)) / 1000))) : SPRINT_MIN * 60;
  const pause = () => { if (!run) return; const p = { at: run.at, left }; setPz(p); try { localStorage.setItem(PAUSE, JSON.stringify(p)); } catch {} };
  const resume = () => {
    if (!run || !pz) return;
    const at = new Date(Date.now() - (SPRINT_MIN * 60 - pz.left) * 1000).toISOString();
    try { localStorage.removeItem(PAUSE); } catch {}
    setPz(null); setNow(Date.now());
    update((d) => { if (d.spr.run) d.spr.run = { ...d.spr.run, at }; }, ["spr"]);
  };

  const finish = (keep: boolean) => update((d) => {
    const r = d.spr.run; if (!r) return;
    const min = Math.min(SPRINT_MIN, Math.floor((Date.now() - Date.parse(r.at)) / 60000));
    d.spr.run = null;
    if (keep && min >= SPRINT_MIN) {
      d.spr.log = [...d.spr.log, { at: r.at, tag: r.tag, min }].slice(-200);
      if (!isDone(d, "k7")) { const q = logQuest(d, "k7"); if (q.leveled) levelUp(q.leveled); }
    }
  }, ["spr", "q", "stars", "streak", "xp", "lvl"]);
  useEffect(() => { if (run && !paused && left === 0) finish(true); });  // eslint-disable-line react-hooks/exhaustive-deps
  const start = (tag: SprintTag) => update((d) => { d.spr.run = { at: new Date().toISOString(), tag }; }, ["spr"]);
  const stop = () => { try { localStorage.removeItem(PAUSE); } catch {} setPz(null); finish(false); };
  return { run, left, finish, start, paused, pause, resume, stop };
}

export function SprintLive() {
  const { st, k } = useCourt();
  const [tag, setTag] = useState<SprintTag>("study");
  const { run, left, finish, start } = useSprint();
  const today = st.spr.log.filter((s) => sgtKeyOf(s.at) === k);
  const mm = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")}`;
  return (
    <div className="sprint">
      <div className="sec-h">Focus sprint <span className="note">{today.length} today · {sprintHours(st, weekKey(k))} h study this week</span></div>
      {run ? (
        <div className="win-line">
          <b className="sprt" aria-live="off">{mm}</b>
          <span className="pillx">{run.tag === "study" ? "Study" : "Other"}</span>
          <button className="btn sm ghost" type="button" onClick={() => finish(false)}>Stop (not counted)</button>
        </div>
      ) : (
        <div className="win-line">
          <span className="ntabs" role="group" aria-label="Sprint tag">
            {(["study", "other"] as const).map((t) => <button key={t} className="chipb" type="button" aria-pressed={tag === t} onClick={() => setTag(t)}>{t === "study" ? "Study" : "Other"}</button>)}
          </span>
          <button className="btn sm" type="button" onClick={() => start(tag)}>Start {SPRINT_MIN} min</button>
        </div>
      )}
    </div>
  );
}
