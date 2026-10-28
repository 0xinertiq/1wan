"use client";

import { useState } from "react";
import { useCourt } from "../CourtState";
import { addDays, monthTitle, prettyDay, weekKey } from "@/lib/court/time";
import { Btn, PageHead } from "../ui";
import { ClockRoom } from "@/components/kumo/decor/ClockRoom";

// Calendar (round 8): the clock-tower room banner, the Calendar card full width (Day | Week | Month | Agenda of her
// read-only Google Calendar), then the economic calendar full width. My tasks moved to the Life Hub; Month at a
// glance and Upcoming left this tab (Needs you now and Today's Coming up still show what is due). No astrology here.

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

export function CalendarPage({ main, econ }: { main: React.ReactNode; econ: React.ReactNode }) {
  return (
    <div className="kpage">
      <PageHead scene="clock" room={<ClockRoom />} title="Calendar" sub="Your time and scheduling: events and the releases that move liquidity." />
      {/* round 9: one stack, so both cards share the same width, edges and header line */}
      <div className="kcal-stack">
        {main}
        <div id="econ-cal">{econ}</div>
      </div>
    </div>
  );
}
