"use client";

import { useEffect, useState } from "react";
import { useCourt } from "../CourtState";
import { weekKey } from "@/lib/court/time";
import { water } from "@/lib/court/water";

// Life > Samsara, ported from her Samsara page. One source of truth per fact (docs/build-trackers.md):
// thesis entries = count of Trade plans (never typed), X posts = the Court's weekly posts counter (cad.x),
// study hours and replies live in key samsara and reset each Monday. Milestone wording from her defs.
const AUTO_COUNT: Record<string, number> = { b2: 8, c2: 16 };

export function SamsaraLive({ onWriteThesis }: { onWriteThesis: () => void }) {
  const { st, k, update } = useCourt();
  const sm = st.defs.samsara;
  const wk = weekKey(k);
  const [plans, setPlans] = useState<{ date?: string }[] | null>(null);
  useEffect(() => { fetch("/api/ledger").then((r) => r.json()).then((j) => setPlans(Array.isArray(j.plans) ? j.plans : [])).catch(() => setPlans([])); }, []);

  const t = st.samsara.t.wk === wk ? st.samsara.t : { ...st.samsara.t, hours: 0, posts: 0, replies: 0, wk };
  const posts = st.cad?.wk === wk ? st.cad.x || 0 : 0;
  const entries = plans?.length ?? 0;
  const thisWeek = (plans ?? []).filter((p) => String(p.date ?? "") >= wk).length;

  const setT = (patch: Partial<typeof t>) => update((d) => { d.samsara.t = { ...t, ...patch, wk }; }, ["samsara"]);
  const setPosts = (x: number) => update((d) => { d.cad = { wk, ig: d.cad?.wk === wk ? d.cad.ig || 0 : 0, x: Math.max(0, x) }; }, ["cad"]);
  const tick = (id: string, on: boolean) => {
    update((d) => { const x = { ...d.samsara.done }; if (on) x[id] = true; else delete x[id]; d.samsara.done = x; }, ["samsara"]);
    water("milestone", "samsara:" + id, on, 2);
  };

  const rhythm: Record<string, [boolean, string]> = {
    w1: [t.hours >= 6, `${t.hours} / 6 h this week`],
    w2: [thisWeek > 0, thisWeek ? `${thisWeek} entr${thisWeek === 1 ? "y" : "ies"} this week (auto, from Trade plans)` : "none yet this week"],
    w4: [posts >= 2 && t.replies >= 3, `${posts} posts · ${t.replies} replies`],
  };
  const phases = sm?.phases ?? [];
  const all = phases.filter((p) => !p.daily).flatMap((p) => p.items.map((i) => i[0]));
  const n = all.filter((id) => st.samsara.done[id]).length;

  return (
    <div className="money samsara">
      <p className="note xd">Upskilling and research, from spotting narratives to a track record. Tracks your own rhythm; trading practice lives in Trade.</p>
      <div className="rep-act"><button className="btn" type="button" onClick={onWriteThesis}>Write a thesis</button></div>

      <div className="sec-h">This week</div>
      <div className="tiles">
        <div className="tile"><span className="note">Study</span><b>{t.hours} / 6 h</b><span className="mbar"><i style={{ width: Math.min(t.hours / 6, 1) * 100 + "%" }} /></span>
          <span className="rep-act"><button className="btn sm ghost" type="button" onClick={() => setT({ hours: Math.max(0, t.hours - 0.5) })}>−½h</button><button className="btn sm" type="button" onClick={() => setT({ hours: t.hours + 0.5 })}>+½h</button></span></div>
        <div className="tile"><span className="note">Thesis log</span><b>{plans == null ? "…" : entries}</b><span className="note">Goal 24 by end of March · {[[8, "Nov"], [16, "Jan"], [24, "Mar"]].map(([x, m]) => `${entries >= +x ? "✓ " : ""}${x} ${m}`).join(" · ")}</span><span className="mbar"><i style={{ width: Math.min(entries / 24, 1) * 100 + "%" }} /></span></div>
        <div className="tile"><span className="note">X this week</span><b>{posts} · {t.replies}</b><span className="note">Posts and thoughtful replies. Goal: 2–3 posts, 3–5 replies.</span>
          <span className="rep-act"><button className="btn sm" type="button" onClick={() => setPosts(posts + 1)}>+ post</button><button className="btn sm" type="button" onClick={() => setT({ replies: t.replies + 1 })}>+ reply</button>
            <button className="btn sm ghost" type="button" onClick={() => setPosts(posts - 1)} aria-label="One post fewer">−</button><button className="btn sm ghost" type="button" onClick={() => setT({ replies: Math.max(0, t.replies - 1) })} aria-label="One reply fewer">−</button></span></div>
      </div>
      <p className="note">Study hours, posts and replies reset on their own each Monday. The thesis count is your Trade plans, so it is never typed.</p>

      {phases.filter((p) => p.daily).map((p) => (
        <div key={p.id}>
          <div className="sec-h">{p.title} <span className="note">{p.when}</span></div>
          {p.items.map(([id, title, d]) => (
            <div className="filed-row col" key={id}><span>{rhythm[id]?.[0] ? "✓ " : ""}{title}</span><span className="note">{rhythm[id]?.[1] ?? d}</span></div>
          ))}
        </div>
      ))}

      {sm ? (
        <>
          <div className="sec-h">Milestones <span className="note">{n} / {all.length}</span></div>
          <span className="mbar"><i style={{ width: (n / (all.length || 1)) * 100 + "%" }} /></span>
          {phases.filter((p) => !p.daily).map((p) => (
            <details className="pillar" key={p.id} open={p.items.some(([id]) => !st.samsara.done[id])}>
              <summary><b>{p.title}</b> <span className="note">{p.when}{p.course ? " · course: " + p.course : ""}</span></summary>
              <p className="note xd">{p.why}</p>
              {p.items.map(([id, title, d, dt, rv]) => {
                const need = AUTO_COUNT[id];
                return (
                  <div className="filed-row col" key={id}>
                    <label><input type="checkbox" checked={!!st.samsara.done[id]} onChange={(e) => tick(id, e.target.checked)} /> {rv ? "Monthly review: " : ""}{st.samsara.done[id] ? <s>{title}</s> : title}{dt ? <span className="note"> · {dt}</span> : null}</label>
                    <span className="note">{d}{need ? ` · auto: ${Math.min(entries, need)} of ${need} plans written` : ""}</span>
                  </div>
                );
              })}
            </details>
          ))}
          <p className="note">Course milestones also count toward grid pillar 6 (Learning); tick each one once, here.</p>
        </>
      ) : <p className="note">Your Samsara milestones arrive with the tracker import.</p>}
    </div>
  );
}
