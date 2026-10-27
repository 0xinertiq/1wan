"use client";

import { useEffect, useState } from "react";
import { useCourt } from "../CourtState";
import { logQuest } from "@/lib/court/actions";
import { isDone } from "@/lib/court/state";
import { SPRINT_MIN, sprintHours, type SprintTag } from "@/lib/court/sprint";
import { weekKey } from "@/lib/court/time";

// One 25-minute focus sprint with a tag (Study or Other). The running sprint is saved, so a reload keeps it.
// A sprint that reaches 25 minutes is logged, counts quest k7, and study sprints add to Samsara's hours.
export function SprintLive() {
  const { st, k, update, levelUp } = useCourt();
  const [tag, setTag] = useState<SprintTag>("study");
  const [now, setNow] = useState(() => Date.now());
  const run = st.spr.run;
  useEffect(() => { if (!run) return; const t = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(t); }, [run]);
  const left = run ? Math.max(0, SPRINT_MIN * 60 - Math.floor((now - Date.parse(run.at)) / 1000)) : SPRINT_MIN * 60;

  const finish = (keep: boolean) => update((d) => {
    const r = d.spr.run; if (!r) return;
    const min = Math.min(SPRINT_MIN, Math.floor((Date.now() - Date.parse(r.at)) / 60000));
    d.spr.run = null;
    if (keep && min >= SPRINT_MIN) {
      d.spr.log = [...d.spr.log, { at: r.at, tag: r.tag, min }].slice(-200);
      if (!isDone(d, "k7")) { const q = logQuest(d, "k7"); if (q.leveled) levelUp(q.leveled); }
    }
  }, ["spr", "q", "stars", "streak", "xp", "lvl"]);
  useEffect(() => { if (run && left === 0) finish(true); });  // eslint-disable-line react-hooks/exhaustive-deps

  const today = st.spr.log.filter((s) => new Date(Date.parse(s.at) + 8 * 3600000).toISOString().slice(0, 10) === k);
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
          <button className="btn sm" type="button" onClick={() => update((d) => { d.spr.run = { at: new Date().toISOString(), tag }; }, ["spr"])}>Start {SPRINT_MIN} min</button>
        </div>
      )}
    </div>
  );
}
