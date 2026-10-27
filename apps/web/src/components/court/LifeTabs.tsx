"use client";

import { useState } from "react";
import { MoneyLive } from "./live/MoneyLive";
import { TradeLive } from "./live/TradeLive";
import { GridWins } from "./live/GridWins";
import { SamsaraLive } from "./live/SamsaraLive";

// Life area: four sub-tabs only (docs/build-trackers.md).
const SUBS = [
  { id: "money", label: "Money", step: 3 },
  { id: "trade", label: "Trade", step: 4 },
  { id: "grid", label: "Grid & Wins", step: 5 },
  { id: "samsara", label: "Samsara", step: 6 },
] as const;

export function LifeTabs() {
  const [sub, setSub] = useState<(typeof SUBS)[number]["id"]>("money");
  // Samsara's "Write a thesis" opens the one plan form in Trade (no second form).
  const writeThesis = () => { setSub("trade"); history.replaceState(null, "", location.pathname + location.search); setTimeout(() => { location.hash = "write-thesis"; }, 0); };
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
            {s.id === "money" ? <MoneyLive /> : s.id === "trade" ? <TradeLive /> : s.id === "grid" ? <GridWins /> : <SamsaraLive onWriteThesis={writeThesis} />}
          </div>
        ))}
      </div>
    </section>
  );
}
