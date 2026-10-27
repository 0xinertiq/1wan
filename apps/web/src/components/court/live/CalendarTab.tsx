"use client";

import { useEffect, useState } from "react";
import { useCourt } from "../CourtState";
import { eventsOn, isAstro, nextDue, type DayEvent } from "@/lib/court/state";
import { addDays, hm, prettyDay, wdName, wdOf, weekKey } from "@/lib/court/time";
import { getOnce } from "@/lib/court/once";
import { WeekAhead } from "./CourtHome";

// Calendar tab (docs/build-dashboard-v2.md section 3): Agenda (14 days), Week (default), Month, day detail
// with free 45-minute gaps. Calendar chips per feed; extra layers from her own records, off by default.
type View = "agenda" | "week" | "month";
type Layer = "money" | "plans" | "thesis";
type Item = { t: string; color: string; a: number; b: number; allDay: boolean; layer?: Layer; cal?: string };
const LAYERS: [Layer, string][] = [["money", "Money"], ["plans", "Plan timeframes"], ["thesis", "Friday thesis slot"]];
const LCOL: Record<Layer, string> = { money: "#9fd8b8", plans: "#ffd95e", thesis: "#ffb3d1" };

function gaps(items: Item[]) {
  const busy = items.filter((e) => !e.allDay && !e.layer).map((e) => [Math.max(540, e.a), Math.min(1260, e.b)]).filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  const out: [number, number][] = [];
  let t = 540;
  for (const [a, b] of busy) { if (a - t >= 45) out.push([t, a]); t = Math.max(t, b); }
  if (1260 - t >= 45) out.push([t, 1260]);
  return out;
}

export function CalendarTab() {
  const { st, k, events, cal } = useCourt();
  const [view, setView] = useState<View>("week");
  const [off, setOff] = useState<string[]>([]);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [day, setDay] = useState<string | null>(null);
  const [plans, setPlans] = useState<Record<string, unknown>[]>([]);
  const [anchor, setAnchor] = useState(k);
  useEffect(() => { getOnce<{ plans?: Record<string, unknown>[] }>("/api/ledger").then((j) => setPlans(Array.isArray(j.plans) ? j.plans : [])); }, []);
  useEffect(() => { try { const v = localStorage.getItem("1wan-cal-view") as View | null; if (v) setView(v); } catch {} }, []);
  const pick = (v: View) => { setView(v); setDay(null); setAnchor(k); try { localStorage.setItem("1wan-cal-view", v); } catch {} };

  const feeds = [...new Set(events.filter((e) => !isAstro(e)).map((e) => e.cal))];
  const itemsOn = (d: string): Item[] => {
    const out: Item[] = eventsOn(events, d).filter((e) => !off.includes(e.cal)).map((e: DayEvent) => ({ t: e.t, color: e.color, a: e.a, b: e.b, allDay: e.allDay, cal: e.cal }));
    if (layers.includes("money")) {
      for (const it of st.life) if ((it.cat === "bill" || it.cat === "money") && nextDue(it, k) === d) out.push({ t: it.name + (it.amt != null ? ` · S$${it.amt}` : ""), color: LCOL.money, a: 0, b: 0, allDay: true, layer: "money" });
      for (const [dt, l] of st.defs.money?.up ?? []) if (dt === d) out.push({ t: l, color: LCOL.money, a: 0, b: 0, allDay: true, layer: "money" });
    }
    if (layers.includes("plans")) for (const p of plans) if (p.until === d && p.outcome === "open") out.push({ t: `${String(p.inst)} plan timeframe ends`, color: LCOL.plans, a: 0, b: 0, allDay: true, layer: "plans" });
    if (layers.includes("thesis") && wdOf(d) === 5) out.push({ t: "Thesis log entry", color: LCOL.thesis, a: 0, b: 0, allDay: true, layer: "thesis" });
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
      <WeekAhead />
      <section className="win" id="calWin" aria-labelledby="calT">
        <div className="win-title"><h2 id="calT">Calendar</h2><span className="sub">{cal.state === "live" ? "live from Google Calendar" : cal.state === "loading" ? "loading" : cal.state === "off" ? "not connected" : "not reachable"}</span></div>
        <div className="win-body">
          <div className="ntabs" role="group" aria-label="View">
            {(["agenda", "week", "month"] as View[]).map((v) => <button key={v} type="button" className="chipb" aria-pressed={view === v} onClick={() => pick(v)}>{v[0].toUpperCase() + v.slice(1)}</button>)}
          </div>
          <div className="ntabs" role="group" aria-label="Calendars">
            {feeds.map((c) => { const col = events.find((e) => e.cal === c)?.color; return <button key={c} type="button" className="chipb" aria-pressed={!off.includes(c)} onClick={() => setOff(off.includes(c) ? off.filter((x) => x !== c) : [...off, c])}><i className="cdot" style={{ background: col }} />{c}</button>; })}
            {LAYERS.map(([id, l]) => <button key={id} type="button" className="chipb" aria-pressed={layers.includes(id)} onClick={() => setLayers(layers.includes(id) ? layers.filter((x) => x !== id) : [...layers, id])}><i className="cdot" style={{ background: LCOL[id] }} />{l}</button>)}
          </div>

          {view !== "agenda" && (
            <div className="rep-act">
              <button className="btn sm ghost" type="button" onClick={() => setAnchor(view === "week" ? addDays(anchor, -7) : addDays(mStart, -1).slice(0, 8) + "01")}>‹ Back</button>
              <b>{view === "week" ? `${prettyDay(wk)} to ${prettyDay(addDays(wk, 6))}` : new Date(mStart + "T00:00:00Z").toLocaleDateString("en-SG", { month: "long", year: "numeric", timeZone: "UTC" })}</b>
              <button className="btn sm ghost" type="button" onClick={() => setAnchor(view === "week" ? addDays(anchor, 7) : addDays(mStart, 32).slice(0, 8) + "01")}>Next ›</button>
              {anchor !== k && <button className="btn sm ghost" type="button" onClick={() => setAnchor(k)}>Today</button>}
            </div>
          )}

          {view === "agenda" && Array.from({ length: 14 }, (_, i) => addDays(k, i)).map((d) => {
            const items = itemsOn(d);
            return (
              <div key={d} className="agday">
                <div className="sec-h">{d === k ? "Today" : prettyDay(d)}</div>
                {items.length ? items.map((x, i) => <div className="filed-row" key={i} style={{ borderLeft: `6px solid ${x.color}` }}><span className="note">{x.allDay ? "all day" : `${hm(x.a)}–${hm(x.b)}`}</span><span>{x.t}</span></div>) : <p className="note">Nothing planned.</p>}
              </div>
            );
          })}
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
              {detail.length ? detail.map((x, i) => <div className="filed-row" key={i} style={{ borderLeft: `6px solid ${x.color}` }}><span className="note">{x.allDay ? "all day" : `${hm(x.a)}–${hm(x.b)}`}</span><span>{x.t}{x.cal ? <span className="note"> · {x.cal}</span> : null}</span></div>) : <p className="note">Nothing planned.</p>}
              <p className="note">Free 45 minutes or more (9am to 9pm): {gaps(detail).map(([a, b]) => `${hm(a)}–${hm(b)}`).join(", ") || "none"}</p>
            </div>
          )}
          <p className="note">Google's secret calendar feeds can lag by a few hours. Window: today to 90 days ahead. Your astro feed is kept for Luna, not shown here.</p>
        </div>
      </section>
    </div>
  );
}
