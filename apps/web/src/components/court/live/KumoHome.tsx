"use client";

import { useState } from "react";
import { useUi } from "@/components/kumo/useUi";
import { useCourt } from "../CourtState";
import { eventsOn, isAstro, type DayEvent } from "@/lib/court/state";
import { hm, prettyDay } from "@/lib/court/time";
import { ComingUpCourt, ParkedList, RecapBox, TodayChips } from "./TodayLive";
import { PricesStrip } from "./LivingWorld";
import { astroParts } from "@/components/kumo/astroParts";

// The Court tab. Classic: the v52 three columns, exactly as before. New look (COURT_SPEC): the world, Park a
// thought, prices, Briefs (Intel | Scan) beside a rail (Today, Needs you now, Coming up, Kumo's review, Luna),
// and the crew roster. Each item has one home; the Court shows summaries and links.
// The pixel Living World replaces the Cloud Court and carries the level-up banner; level and EXP live in the header.
export type CourtSlots = {
  weather: React.ReactNode; today: React.ReactNode; todayBare: React.ReactNode; stage: React.ReactNode; statusLine: React.ReactNode;
  luna: React.ReactNode; brief: React.ReactNode; scan: React.ReactNode; tech: React.ReactNode; weekStrip: React.ReactNode;
  weekAhead: React.ReactNode; econ: React.ReactNode; news: React.ReactNode; needs: React.ReactNode; status: React.ReactNode;
  briefs: React.ReactNode; review: React.ReactNode; world: React.ReactNode; roster: React.ReactNode;
};

export function CourtLayout({ s }: { s: CourtSlots }) {
  const ui = useUi();
  if (ui === "classic")
    return (
      <div className="layout">
        <div className="col c-l">{s.weather}{s.today}</div>
        <div className="col c-m">{s.stage}{s.statusLine}{s.luna}{s.brief}{s.scan}{s.tech}{s.weekStrip}{s.weekAhead}{s.econ}{s.news}</div>
        <div className="col c-r">{s.needs}{s.status}</div>
      </div>
    );
  return (
    <div className="khome">
      {s.world}
      <QuickLine />
      <PricesStrip />
      {s.statusLine}
      <div className="kmain">
        {s.briefs}
        <div className="krail">
          <TodayCard />
          {s.needs}
          <ComingUpCourt />
          <AstroForecast />
          {s.review}
        </div>
      </div>
      {s.roster}
    </div>
  );
}

// Park a thought: one line under the world (the same list Today shows under its stat strip).
function QuickLine() {
  const { update } = useCourt();
  const [t, setT] = useState("");
  const [msg, setMsg] = useState("");
  return (
    <form className="kqline" onSubmit={(e) => {
      e.preventDefault();
      const v = t.trim();
      if (!v) return;
      update((d) => { d.dump.unshift({ id: "d" + Date.now(), t: v.slice(0, 140), done: false, ts: Date.now() }); d.dump = d.dump.slice(0, 40); }, ["dump"]);
      setT(""); setMsg("Parked. It is in Today.");
    }}>
      <label htmlFor="kqlIn" className="sr">Park a thought</label>
      <input id="kqlIn" type="text" autoComplete="off" maxLength={140} placeholder="Park a thought: anything nagging at you" value={t} onChange={(e) => { setT(e.target.value); setMsg(""); }} />
      <button className="btn" type="submit">Park it</button>
      {msg && <span className="note" role="status">{msg}</span>}
    </form>
  );
}

// Observatory page (New look): Luna's full sky. In Classic, Luna's sky stays on the Court.
export function Observatory({ luna }: { luna: React.ReactNode }) {
  const ui = useUi();
  return (
    <div className="tabcol obs-page">
      <a className="btn sm ghost obs-back" href="#court">← Back to Court</a>
      {ui === "new" ? luna : <p className="note">In the Classic look, Luna&apos;s sky is on the Court.</p>}
    </div>
  );
}

// One Today card: Now / Next / Later from the calendar, the glance numbers in one row, then parked thoughts.
function TodayCard() {
  const { k, nm, events, cal } = useCourt();
  const evs = eventsOn(events, k).filter((e) => !e.allDay);
  const now = evs.filter((e) => e.a <= nm && nm < e.b);
  const later = evs.filter((e) => e.a > nm);
  const next = later.slice(0, 1), rest = later.slice(1, 4);
  const row = (e: DayEvent, i: number) => (
    <div className="knl-row" key={i}><span className="knl-t">{hm(e.a)}</span><span className="knl-dot" style={{ background: e.color }} aria-hidden="true" /><span>{e.t}</span></div>
  );
  return (
    <section className="win knl" aria-labelledby="knlT">
      <div className="win-title"><h2 id="knlT">Today</h2><span className="sub">{prettyDay(k)} · <a href="#calendar">Calendar</a></span></div>
      <div className="win-body">
        {cal.state === "loading" ? <p className="note">Calendar loading…</p>
          : cal.state === "error" ? <p className="note">Calendar not reachable right now.</p>
          : cal.state === "off" ? <p className="note">Calendar not connected yet.</p>
          : <div className="knl-list">
            <div className="sec-h">Now</div>
            {now.length ? now.map(row) : <p className="note">Nothing on right now.</p>}
            <div className="sec-h">Next</div>
            {next.length ? next.map(row) : <p className="note">Nothing else today.</p>}
            {rest.length > 0 && <><div className="sec-h">Later</div>{rest.map(row)}</>}
          </div>}
        <RecapBox />
        <TodayChips />
        <ParkedList />
      </div>
    </section>
  );
}

// Luna's forecast (owner's brief): the energy line as the calendar gives it, the transit line in small type,
// then "DOs:" and "DON'Ts:" exactly as written (a line the text lacks is left out). Nothing repeated, nothing
// written by the app; anything else in the calendar text shows only on the Observatory.
function AstroForecast() {
  const { k, events, cal } = useCourt();
  const today = eventsOn(events, k, true).filter((e) => isAstro(e));
  return (
    <section className="win kastro" aria-labelledby="kastroT">
      <div className="win-title"><h2 id="kastroT">Luna&apos;s forecast</h2><a className="sub" href="#observatory">Full sky →</a></div>
      <div className="win-body">
        {cal.state === "loading" ? <p className="note">Astro calendar loading…</p>
          : cal.state !== "live" ? <p className="note">Astro calendar not reachable right now.</p>
          : today.length ? today.slice(0, 2).map((e, i) => {
            const p = astroParts(e.desc);
            return (
              <div className="kastro-ev" key={i}>
                {p.energy && <p className="kastro-en">{p.energy}</p>}
                {p.transits.length > 0 && <p className="kastro-tr">{p.transits.join(" · ")}</p>}
                {p.dos && <p className="kdo"><b>DOs:</b> {p.dos}</p>}
                {p.donts && <p className="kdo"><b>DON&apos;Ts:</b> {p.donts}</p>}
              </div>
            );
          }) : <p className="note">No astro calendar entries today.</p>}
        <span className="kastro-src">astro calendar</span>
      </div>
    </section>
  );
}
