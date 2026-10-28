"use client";

import { useEffect, useState } from "react";
import { useCourt } from "../CourtState";
import { eventsOn, isAstro, type DayEvent } from "@/lib/court/state";
import { addDays, hm, prettyDay, wdName, wdOf, weekKey, sgtKeyOf, monthTitle, clock } from "@/lib/court/time";
import { readSaved, writeSaved } from "@/lib/court/store";
import { isDayKey, takeParam } from "@/lib/court/nav";
import { WeekAhead } from "./CourtHome";
import { AstroText } from "./AstroText";

// Calendar tab (docs/build-dashboard-v2.md section 3): Agenda (14 days), Week (default), Month, day detail
// with free 45-minute gaps, and a Day view (round 6). One chip per Google calendar. No astrology on the
// Calendar (Luna owns it, on the Court). Money, plans, thesis, macro and grid layers live in their own tabs.
type View = "day" | "week" | "month" | "agenda";
const isView = (v: unknown): v is View => v === "day" || v === "week" || v === "month" || v === "agenda";
type Item = { t: string; color: string; a: number; b: number; allDay: boolean; cal?: string; desc?: string };

function gaps(items: Item[]) {
  const busy = items.filter((e) => !e.allDay).map((e) => [Math.max(540, e.a), Math.min(1260, e.b)]).filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const out: [number, number][] = [];
  let t = 540;
  for (const [a, b] of busy) { if (a - t >= 45) out.push([t, a]); t = Math.max(t, b); }
  if (1260 - t >= 45) out.push([t, 1260]);
  return out;
}

// One event line; astro entries carry their description under the title.
function Row({ x, withCal }: { x: Item; withCal?: boolean }) {
  return (
    <div className={"filed-row" + (x.desc ? " hasd" : "")} style={{ borderLeft: `6px solid ${x.color}` }}>
      <span className="note">{x.allDay ? "all day" : `${hm(x.a)}–${hm(x.b)}`}</span>
      <div className="ftx"><span>{x.t}{withCal && x.cal ? <span className="note"> · {x.cal}</span> : null}</span><AstroText text={x.desc} /></div>
    </div>
  );
}

export function CalendarTab({ noWeek = false }: { noWeek?: boolean }) {
  const { k, events, cal } = useCourt();
  const [view, setView] = useState<View>("week");
  const [off, setOff] = useState<string[]>([]);
  const [day, setDay] = useState<string | null>(null);
  const [anchor, setAnchor] = useState(k);
  // last time new calendar data reached this page (the loader refreshes every 15 minutes)
  const [fetched, setFetched] = useState<number | null>(null);
  useEffect(() => { if (cal.state === "live") setFetched(Date.now()); }, [events, cal.state]);
  useEffect(() => {
    setView(readSaved("cal-view", isView, "week"));
    // a deep link from the Court's Week tab: ?day=YYYY-MM-DD#calendar opens that day
    const open = () => { if (window.location.hash !== "#calendar") return; const d = takeParam("day", isDayKey); if (d) { setView("day"); setAnchor(d); setDay(null); } };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  const pick = (v: View) => { setView(v); setDay(null); setAnchor(k); writeSaved("cal-view", v); };

  const feeds = [...new Set(events.filter((e) => !isAstro(e)).map((e) => e.cal))];
  const itemsOn = (d: string): Item[] => {
    // Luna owns astrology (round 6 addendum 2): no astro event or sky layer on the Calendar, in any view.
    const out: Item[] = eventsOn(events, d, true).filter((e) => !isAstro(e) && !off.includes(e.cal)).map((e: DayEvent) => ({ t: e.t, color: e.color, a: e.a, b: e.b, allDay: e.allDay, cal: e.cal }));
    return out.sort((x, y) => Number(y.allDay) - Number(x.allDay) || x.a - y.a);
  };

  const Day = ({ d, compact }: { d: string; compact?: boolean }) => {
    const items = itemsOn(d);
    return (
      <button type="button" className={"cday" + (d === k ? " today" : "") + (d === day ? " sel" : "")} onClick={() => setDay(d === day ? null : d)} aria-label={`${prettyDay(d)}, ${items.length} items`}>
        <span className="cd-h">{compact ? d.slice(8).replace(/^0/, "") : `${wdName(wdOf(d)).slice(0, 3)} ${d.slice(8)}`}</span>
        {compact ? <span className="dots">{items.slice(0, 4).map((x, i) => <i key={i} style={{ background: x.color }} />)}</span>
          : items.slice(0, 5).map((x, i) => <span className="cev" key={i} style={{ borderLeftColor: x.color }}>{x.allDay ? "" : hm(x.a) + " "}{x.t}</span>)}
        {!compact && items.length > 5 && <span className="note">+{items.length - 5} more</span>}
      </button>
    );
  };

  const wk = weekKey(anchor);
  const mStart = anchor.slice(0, 8) + "01", gridStart = weekKey(mStart);
  const detail = day ? itemsOn(day) : [];

  return (
    <div className="tabcol">
      {!noWeek && <WeekAhead />}
      <section className="win" id="calWin" aria-labelledby="calT">
        <div className="win-title"><h2 id="calT">Calendar</h2><span className="sub">{cal.state === "live" ? <>Google Calendar, read-only{fetched ? <> · fetched <time className="ts">{clock(fetched)} SGT</time></> : null}</> : cal.state === "loading" ? "loading" : cal.state === "off" ? "not connected" : "not reachable"}</span></div>
        <div className="win-body">
          <div className="ntabs" role="group" aria-label="View">
            {(["day", "week", "month", "agenda"] as View[]).map((v) => <button key={v} type="button" className="chipb" aria-pressed={view === v} onClick={() => pick(v)}>{v[0].toUpperCase() + v.slice(1)}</button>)}
          </div>
          <div className="ntabs" role="group" aria-label="Calendars">
            {feeds.map((c) => { const col = events.find((e) => e.cal === c)?.color; return <button key={c} type="button" className="chipb" aria-pressed={!off.includes(c)} onClick={() => setOff(off.includes(c) ? off.filter((x) => x !== c) : [...off, c])}><i className="cdot" style={{ background: col }} />{c}</button>; })}
          </div>

          {view !== "agenda" && (
            <div className="rep-act">
              <button className="btn sm ghost" type="button" onClick={() => setAnchor(view === "day" ? addDays(anchor, -1) : view === "week" ? addDays(anchor, -7) : addDays(mStart, -1).slice(0, 8) + "01")}>‹ Back</button>
              <b>{view === "day" ? (anchor === k ? "Today, " : "") + prettyDay(anchor) : view === "week" ? `${prettyDay(wk)} to ${prettyDay(addDays(wk, 6))}` : monthTitle(mStart)}</b>
              <button className="btn sm ghost" type="button" onClick={() => setAnchor(view === "day" ? addDays(anchor, 1) : view === "week" ? addDays(anchor, 7) : addDays(mStart, 32).slice(0, 8) + "01")}>Next ›</button>
              {anchor !== k && <button className="btn sm ghost" type="button" onClick={() => setAnchor(k)}>Today</button>}
            </div>
          )}

          {view === "agenda" && Array.from({ length: 14 }, (_, i) => addDays(k, i)).map((d) => {
            const items = itemsOn(d);
            return (
              <div key={d} className="agday">
                <div className="sec-h">{d === k ? "Today" : prettyDay(d)}</div>
                {items.length ? items.map((x, i) => <Row key={i} x={x} />) : <p className="note">Nothing planned.</p>}
              </div>
            );
          })}
          {view === "day" && (
            <div className="cdetail">
              {itemsOn(anchor).length ? itemsOn(anchor).map((x, i) => <Row key={i} x={x} withCal />) : <p className="note">Nothing planned.</p>}
              <p className="note">Free 45 minutes or more (9am to 9pm): {gaps(itemsOn(anchor)).map(([a, b]) => `${hm(a)}–${hm(b)}`).join(", ") || "none"}</p>
            </div>
          )}
          {view === "week" && <div className="cweek">{Array.from({ length: 7 }, (_, i) => <Day key={i} d={addDays(wk, i)} />)}</div>}
          {view === "month" && (
            <div className="cmonth">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((w) => <span key={w} className="note cm-h">{w}</span>)}
              {Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)).filter((d, i) => i < 35 || d.slice(0, 7) === mStart.slice(0, 7)).map((d) => (
                <div key={d} className={d.slice(0, 7) === mStart.slice(0, 7) ? "" : "faded"}><Day d={d} compact /></div>
              ))}
            </div>
          )}

          {day && (
            <div className="cdetail">
              <div className="sec-h">{prettyDay(day)}</div>
              {detail.length ? detail.map((x, i) => <Row key={i} x={x} withCal />) : <p className="note">Nothing planned.</p>}
              <p className="note">Free 45 minutes or more (9am to 9pm): {gaps(detail).map(([a, b]) => `${hm(a)}–${hm(b)}`).join(", ") || "none"}</p>
            </div>
          )}
          <p className="note">Google&apos;s secret calendar feeds can lag by a few hours. Window: today to 90 days ahead. Read-only: nothing here writes to Google.</p>
        </div>
      </section>
    </div>
  );
}
