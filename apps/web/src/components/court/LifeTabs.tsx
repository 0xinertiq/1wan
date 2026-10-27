"use client";

import { useState } from "react";
import { MoneyLive } from "./live/MoneyLive";

// Life area: four sub-tabs only (docs/build-trackers.md). Each screen arrives in its own build step.
const SUBS = [
  { id: "money", label: "Money", step: 3 },
  { id: "trade", label: "Trade", step: 4 },
  { id: "grid", label: "Grid & Wins", step: 5 },
  { id: "samsara", label: "Samsara", step: 6 },
] as const;

export function LifeTabs() {
  const [sub, setSub] = useState<(typeof SUBS)[number]["id"]>("money");
  return (
    <section className="win" id="lifeWin" aria-labelledby="lifeT">
      <div className="win-title"><h2 id="lifeT">Life</h2></div>
      <div className="win-body">
        <div className="ntabs" role="tablist" aria-label="Life areas">
          {SUBS.map((s) => (
            <button key={s.id} className="chipb" type="button" role="tab" id={`lt-${s.id}`} aria-controls={`lp-${s.id}`} aria-selected={sub === s.id} aria-pressed={sub === s.id} onClick={() => setSub(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        {SUBS.map((s) => (
          <div key={s.id} className="panel" id={`lp-${s.id}`} role="tabpanel" aria-labelledby={`lt-${s.id}`} hidden={sub !== s.id}>
            {s.id === "money" ? <MoneyLive /> : <p className="note">{s.label} is not built yet. It arrives in build step {s.step}.</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
