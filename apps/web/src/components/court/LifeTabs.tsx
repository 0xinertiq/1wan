"use client";

import { useEffect, useState } from "react";
import { MoneyLive } from "./live/MoneyLive";
import { TradeLive } from "./live/TradeLive";
import { GridWins } from "./live/GridWins";
import { SamsaraLive } from "./live/SamsaraLive";
import { useUi } from "@/components/kumo/useUi";

// Life area: four sub-tabs only (docs/build-trackers.md).
const SUBS = [
  { id: "money", label: "Money", step: 3 },
  { id: "trade", label: "Trade", step: 4 },
  { id: "grid", label: "Grid & Wins", step: 5 },
  { id: "samsara", label: "Samsara", step: 6 },
] as const;

export function LifeTabs() {
  const [sub, setSub] = useState<(typeof SUBS)[number]["id"]>("money");
  const ui = useUi();
  const subs = SUBS.filter((s) => ui === "classic" || s.id !== "trade");
  // Samsara's "Write a thesis" opens the one plan form in Trade (no second form).
  const writeThesis = () => window.dispatchEvent(new Event("1wan:write-thesis"));
  // Any "write a thesis" (Samsara, a chart) opens Trade; the plan form itself listens for the same event.
  // In the New look the trade tools live on the Trades tab, so the same event opens that tab.
  useEffect(() => { const go = () => (ui === "new" ? (window.location.hash = "trades") : setSub("trade")); window.addEventListener("1wan:write-thesis", go); return () => window.removeEventListener("1wan:write-thesis", go); }, [ui]);
  return (
    <section className="win" id="lifeWin" aria-labelledby="lifeT">
      <div className="win-title"><h2 id="lifeT">Life</h2></div>
      <div className="win-body">
        <div className="ntabs" role="tablist" aria-label="Life areas">
          {subs.map((s) => (
            <button key={s.id} className="chipb" type="button" role="tab" id={`lt-${s.id}`} aria-controls={`lp-${s.id}`} aria-selected={sub === s.id} aria-pressed={sub === s.id} onClick={() => setSub(s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        {subs.map((s) => (
          <div key={s.id} className="panel" id={`lp-${s.id}`} role="tabpanel" aria-labelledby={`lt-${s.id}`} hidden={sub !== s.id}>
            {s.id === "money" ? <MoneyLive /> : s.id === "trade" ? <TradeLive /> : s.id === "grid" ? <GridWins /> : <SamsaraLive onWriteThesis={writeThesis} />}
          </div>
        ))}
      </div>
    </section>
  );
}
