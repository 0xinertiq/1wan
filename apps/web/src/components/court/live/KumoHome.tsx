"use client";

import { useState } from "react";
import { useUi } from "@/components/kumo/useUi";
import { useCourt } from "../CourtState";
import { eventsOn, isAstro, type DayEvent } from "@/lib/court/state";
import { hm, prettyDay } from "@/lib/court/time";
import { ComingUpCourt, ParkedList, RecapBox, TodayChips } from "./TodayLive";
import { PricesStrip } from "./LivingWorld";
import { astroParts } from "@/components/kumo/astroParts";
import { PixelSprite } from "@/components/PixelSprite";
import { TONEMSG, enrich, explain, lunaDay, lunaRange, nextIngress } from "@/lib/court/luna";

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
          <LunaCard />
          {s.needs}
          <ComingUpCourt />
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

// Luna's card, ported from the v52 renderLuna() (lib/court/luna.ts): chips, one summary, the next Moon sign
// change, up to three contacts with her chart, the lean / gentle lists, a care callout and self-care. The astro
// calendar's DO / DON'T text only feeds Luna's own phrases (enrich); its words are not shown here. Without a
// calendar entry the calculated reading stands alone, as in v52. No colour coding; times in SGT.
function LunaCard() {
  const { k, events } = useCourt();
  const base = lunaDay(k);
  const ast = eventsOn(events, k, true).filter((e) => isAstro(e)).map((e) => astroParts(e.desc));
  const w = base && enrich(base, ast.map((p) => p.dos).filter(Boolean).join(" ") || null, ast.map((p) => p.donts).filter(Boolean).join(" ") || null);
  const ing = nextIngress(k), range = lunaRange();
  return (
    <section className="win kluna" aria-labelledby="klunaT">
      <div className="win-title"><h2 id="klunaT"><span className="mini sm"><PixelSprite name="luna" /></span>Luna · the stars align for you</h2></div>
      <div className="win-body">
        {!w ? <p className="note">My sky data covers {prettyDay(range.from)} to {prettyDay(range.to)}. Nothing for this day yet.</p> : <>
          <div className="kluna-chips">
            <span>Moon in {w.moon}</span><span>{w.el[0].toUpperCase() + w.el.slice(1)} Moon</span><span>{w.phase}</span><span>{w.tone}</span>{w.mrx && <span>Mercury Rx</span>}
          </div>
          <p>{TONEMSG[w.tone]} The Moon is {w.mood}.</p>
          {ing && <p className="kluna-sm">Moon moves into {ing.s} {ing.day === k ? "" : `on ${prettyDay(ing.day)} `}at {ing.t} SGT.</p>}
          {w.items.length > 0 && <>
            <h3 className="kluna-h">Today in your chart</h3>
            <ul className="kluna-l">{w.items.slice(0, 3).map((e, i) => <li key={i}>{explain(e)} <span className="kluna-sm">{e.back ? `(in orb, ${e.o}°)` : `(${e.t} SGT)`}</span></li>)}</ul>
          </>}
          <div className="kluna-two">
            <div><h3 className="kluna-h">The day leans toward</h3><p>{w.lean.join(", ")}.</p></div>
            <div><h3 className="kluna-h">Be gentle with</h3><p>{w.ease.join(", ")}.</p></div>
          </div>
          {w.merc && <p className="kluna-call">{w.merc}</p>}
          <h3 className="kluna-h">Self-care for today</h3>
          <ul className="kluna-l">{w.care.slice(0, 5).map((x) => <li key={x}>{x}</li>)}</ul>
          <p className="kluna-sm">Traditional meanings applied to your own chart: a mood forecast, not a prediction. Gentle ideas, not medical advice. <a href="#observatory">Full sky →</a></p>
        </>}
      </div>
    </section>
  );
}
