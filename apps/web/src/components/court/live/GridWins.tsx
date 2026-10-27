"use client";

import { getOnce } from "@/lib/court/once";
import { useEffect, useState } from "react";
import { useCourt } from "../CourtState";
import type { CourtState, Phase } from "@/lib/court/state";
import { addDays } from "@/lib/court/time";
import { water } from "@/lib/court/water";
import { lateNight } from "./TradeLive";

// Life > Grid & Wins: the 64 mandala (key grid), the Small Wins ladder (swins) and the Money Wins Q4
// ladder (money). Wording comes from her private defs. Every tick waters the garden; undo takes it back.
type Done = Record<string, boolean>;

export function GridWins() {
  const { st, k, update } = useCourt();
  const g = st.defs.grid, sw = st.defs.swins, mw = st.defs.money;
  const [trades, setTrades] = useState<{ at?: string }[] | null>(null);
  useEffect(() => { getOnce<any>("/api/ledger").then((j) => setTrades(Array.isArray(j.trades) ? j.trades : [])).catch(() => setTrades([])); }, []);

  if (!g && !sw && !mw) return <p className="note">Your grid and ladders arrive with the tracker import. Nothing to show yet.</p>;

  const set = (key: "grid" | "swins" | "money", id: string, on: boolean, src: "grid" | "milestone") => {
    update((d: CourtState) => { const x = { ...d[key].done }; if (on) x[id] = true; else delete x[id]; d[key].done = x; }, [key]);
    water(src, `${key}:${id}`, on, src === "milestone" ? 2 : 1);
  };

  // Derived (AUTO) Small Wins: b3 from trade times, b6 from the d6 log, both "14 days in a row".
  const run = (ok: (day: string) => boolean) => { let c = 0; for (let i = 0; i < 60 && ok(addDays(k, -i)); i++) c++; return c; };
  const teaRun = run((day) => (st.swins.log[day] || []).includes("d6"));
  const lastLate = (trades ?? []).filter((t) => lateNight(t.at)).map((t) => new Date(Date.parse(t.at!) + 8 * 3600000).toISOString().slice(0, 10)).sort().pop();
  const cleanDays = lastLate ? Math.max(0, Math.round((Date.parse(k) - Date.parse(lastLate)) / 86400000) - 1) : null;
  const auto: Record<string, string> = {
    b6: `auto: ${Math.min(teaRun, 14)} of 14 days in a row from your d6 ticks`,
    b3: trades == null ? "auto: checking trades…" : lastLate ? `auto: ${Math.min(cleanDays!, 14)} of 14 days since the last 11pm to 6am trade` : "auto: no late-night trades on record",
  };

  const total = g ? g.pillars.length * 8 : 0;
  const gdone = Object.keys(st.grid.done).filter((id) => st.grid.done[id]).length;

  return (
    <div className="money grid">
      {g && (
        <>
          <div className="sec-h">64 actionables <span className="note">{gdone} of {total} done</span></div>
          <p className="note xd">{g.goal}. One goal, eight pillars, eight actions each. Tap an action for its timing.</p>
          <span className="mbar"><i style={{ width: (gdone / (total || 1)) * 100 + "%" }} /></span>
          {g.pillars.map((p, pi) => {
            const n = p.acts.filter((_, ai) => st.grid.done[`${pi + 1}.${ai + 1}`]).length;
            return (
              <details className="pillar" key={p.name}>
                <summary><b>{pi + 1}. {p.name}</b> <span className="note">{n}/8</span><span className="mbar"><i style={{ width: (n / 8) * 100 + "%" }} /></span></summary>
                {p.acts.map((a, ai) => {
                  const id = `${pi + 1}.${ai + 1}`, on = !!st.grid.done[id];
                  return (
                    <div className="filed-row col" key={id}>
                      <label><input type="checkbox" checked={on} onChange={(e) => set("grid", id, e.target.checked, "grid")} /> <span className="note">{id}</span> {on ? <s>{a.t}</s> : a.t}</label>
                      <span className="note">{a.when} · {a.why}</span>
                    </div>
                  );
                })}
              </details>
            );
          })}
          <p className="note">Astrology gives timing, not outcomes.</p>
        </>
      )}
      {sw && <Ladder title="Small Wins ladder" phases={sw.phases.filter((p) => !p.daily)} done={st.swins.done} auto={auto} onTick={(id, on) => set("swins", id, on, "milestone")} />}
      {sw && <p className="note">The daily anchors (d1 to d8) live in the Garden and on the Court's Today card.</p>}
      {mw && <Ladder title="Money Wins Q4 ladder" phases={mw.phases} done={st.money.done} auto={{}} onTick={(id, on) => set("money", id, on, "milestone")} />}
    </div>
  );
}

function Ladder({ title, phases, done, auto, onTick }: { title: string; phases: Phase[]; done: Done; auto: Record<string, string>; onTick: (id: string, on: boolean) => void }) {
  const all = phases.flatMap((p) => p.items.map((i) => i[0]));
  const n = all.filter((id) => done[id]).length;
  return (
    <>
      <div className="sec-h">{title} <span className="note">{n} / {all.length} milestones</span></div>
      <span className="mbar"><i style={{ width: (n / (all.length || 1)) * 100 + "%" }} /></span>
      {phases.map((p) => (
        <details className="pillar" key={p.id} open={p.items.some(([id]) => !done[id]) && phases.find((q) => q.items.some(([id]) => !done[id]))?.id === p.id}>
          <summary><b>{p.title}</b> <span className="note">{p.when} · {p.items.filter(([id]) => done[id]).length}/{p.items.length}</span></summary>
          <p className="note xd">{p.why}</p>
          {p.items.map(([id, t, d, dt]) => (
            <div className="filed-row col" key={id}>
              <label><input type="checkbox" checked={!!done[id]} onChange={(e) => onTick(id, e.target.checked)} /> {done[id] ? <s>{t}</s> : t}{dt ? <span className="note"> · {dt}</span> : null}</label>
              <span className="note">{d}{auto[id] ? " · " + auto[id] : ""}{done[id] && !auto[id] ? " · self-report" : ""}</span>
            </div>
          ))}
        </details>
      ))}
    </>
  );
}
