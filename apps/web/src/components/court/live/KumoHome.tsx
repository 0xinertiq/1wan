"use client";

import { useState } from "react";
import { COURT_BANNER, PaintedBanner } from "@/components/kumo/PaintedBanner";
import { useUi } from "@/components/kumo/useUi";
import { useCourt } from "../CourtState";
import { eventsOn, isAstro, type DayEvent } from "@/lib/court/state";
import { greetWord, hm, prettyDay } from "@/lib/court/time";
import { AstroText } from "./AstroText";
import { useSky } from "./LunaSky";
import { TodayChips } from "./TodayLive";

// The Court tab. Classic: the v52 three columns, exactly as before. New look (moodboard 01, "a summary, never
// a second calendar or hub"): banner; Today / Needs you now / Kingdom progress / Quick capture; Luna's
// forecast; every other window folded under "More on your court". Nothing is removed, only arranged.
// The Living Kingdom card sits under Kingdom progress in place of the Cloud Court (it also shows level-ups).
export type CourtSlots = {
  weather: React.ReactNode; today: React.ReactNode; todayBare: React.ReactNode; stage: React.ReactNode; statusLine: React.ReactNode;
  luna: React.ReactNode; brief: React.ReactNode; scan: React.ReactNode; tech: React.ReactNode; weekStrip: React.ReactNode;
  weekAhead: React.ReactNode; econ: React.ReactNode; news: React.ReactNode; needs: React.ReactNode; status: React.ReactNode; kingdom: React.ReactNode;
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
      <KingdomBanner />
      {s.statusLine}
      <div className="krow">
        <TodayCard weather={s.weather} more={s.todayBare} />
        {s.needs}
        <div className="kprog">{s.status}{s.kingdom}</div>
        <QuickCapture />
      </div>
      <AstroForecast />
      <details className="kmore">
        <summary>More on your court <span className="note">briefs, scan, technicals, week, economy, news</span></summary>
        <div className="kmore-grid">{s.brief}{s.scan}{s.tech}{s.weekStrip}{s.weekAhead}{s.econ}{s.news}</div>
      </details>
    </div>
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

// Painted Court banner (concept image 33). Each painted chip is covered by a real one: links to the rooms,
// her live level and today's date. The fox asleep on the wall is painted in, so the pixel fox sits this one out.
function KingdomBanner() {
  const { st, k, nm } = useCourt();
  const greet = <div className="pb-greet"><h2>{greetWord(nm)}, Queen</h2><p>A calmer day, a richer life.</p></div>;
  const chips = {
    garden: <a className="pb-chip" href="#garden">Sakura Garden</a>,
    clock: <a className="pb-chip" href="#calendar">Clock Tower</a>,
    castle: <span className="pb-chip pb-two"><span>The Castle</span><span>Lv {st.lvl}</span></span>,
    obs: <a className="pb-chip" href="#observatory">Observatory</a>,
    date: <span className="pb-chip">{prettyDay(k)}</span>,
    life: <span className="pb-chip" />,
  };
  return (
    <PaintedBanner set={COURT_BANNER} label="Kingdom" className="kbanner"
      fill={{ greet, ...chips }}
      fillMobile={{ greet: <div className="pb-greet"><h2>{greetWord(nm)}, Queen</h2></div>, clock: chips.clock, castle: chips.castle, obs: <span className="pb-chip" /> }} />
  );
}

// One Today card: Now / Next / Later from the calendar, the glance numbers in one row, and the rest of the
// Today window (brief, sky, week, Kumo's pick, Momo's day, Park a thought, quote) under "More".
function TodayCard({ weather, more }: { weather: React.ReactNode; more: React.ReactNode }) {
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
        {weather}
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
        <TodayChips />
        <details className="kfold">
          <summary>More: brief, sky, week, Kumo&apos;s pick, Park a thought</summary>
          {more}
        </details>
      </div>
    </section>
  );
}

// "Do" / "Don't" lines only when the astro calendar's own text has them; never written here.
const DO_RE = /^\s*(?:[-*•]\s*)?(do|don['’]?t|avoid)\b\s*[:\-–]\s*(.+)$/i;
function doLines(desc?: string) {
  if (!desc) return [];
  return desc.split(/\r?\n/).map((l) => l.match(DO_RE)).filter((m): m is RegExpMatchArray => !!m)
    .map((m) => ({ neg: !/^do$/i.test(m[1]), t: m[2].trim() })).slice(0, 4);
}

// Luna's forecast: Luna's own calculation for the headline, and up to three of today's astro calendar
// entries, quoted as written with their source. Full sky lives on the Observatory page.
function AstroForecast() {
  const { k, events, cal } = useCourt();
  const { pos, phase } = useSky();
  const today = eventsOn(events, k, true).filter((e) => isAstro(e));
  const src = today[0]?.cal;
  const retro = pos.filter((p) => p.retro).map((p) => p.b);
  return (
    <section className="win kastro" aria-labelledby="kastroT">
      <div className="win-title"><h2 id="kastroT">Luna&apos;s forecast</h2><a className="sub" href="#observatory">Full sky →</a></div>
      <div className="win-body">
        <p className="kastro-h">{today[0]?.t ?? "A quiet sky on the calendar today"}</p>
        <p className="note">☽ {phase.name} · Moon in {pos[1].sign}{retro.length ? ` · ${retro.join(", ")} retrograde` : ""} · calculated by Luna</p>
        {cal.state === "loading" ? <p className="note">Astro calendar loading…</p>
          : cal.state !== "live" ? <p className="note">Astro calendar not reachable, so only Luna&apos;s calculation shows.</p>
          : today.length ? <>
            <div className="kastro-evs">
              {today.slice(0, 3).map((e, i) => {
                const dos = doLines(e.desc);
                return (
                  <div className="kastro-ev" key={i}>
                    <b>{e.t}</b>{!e.allDay && <span className="note"> · {hm(e.a)}–{hm(e.b)} SGT</span>}
                    {dos.length > 0 && <ul className="kdo">{dos.map((d, j) => <li key={j} className={d.neg ? "neg" : "pos"}><b>{d.neg ? "Don’t" : "Do"}</b> {d.t}</li>)}</ul>}
                    {e.desc && <details className="kfold"><summary>Read more</summary><AstroText text={e.desc} /></details>}
                  </div>
                );
              })}
            </div>
            {today.length > 3 && <a className="note" href="#observatory">{today.length - 3} more on the Observatory</a>}
            <p className="note">From your astro calendar{src ? ` (${src})` : ""}, quoted as written. Timing context only, never trade calls.</p>
          </> : <p className="note">No astro calendar entries today.</p>}
      </div>
    </section>
  );
}

function QuickCapture() {
  const { st, update } = useCourt();
  const [t, setT] = useState("");
  const [msg, setMsg] = useState("");
  const open = st.dump.filter((d) => !d.done).length;
  return (
    <section className="win kqc" aria-labelledby="kqcT">
      <div className="win-title"><h2 id="kqcT">Quick capture</h2><span className="sub">{open} parked</span></div>
      <div className="win-body">
        <form className="field" onSubmit={(e) => {
          e.preventDefault();
          const v = t.trim();
          if (!v) return;
          update((d) => { d.dump.unshift({ id: "d" + Date.now(), t: v.slice(0, 140), done: false, ts: Date.now() }); d.dump = d.dump.slice(0, 40); }, ["dump"]);
          setT(""); setMsg("Parked. It is in Today, Park a thought.");
        }}>
          <label htmlFor="kqcIn">What&apos;s on your mind?</label>
          <div className="field-row">
            <input id="kqcIn" type="text" autoComplete="off" maxLength={140} placeholder="A task, a note, an idea" value={t} onChange={(e) => { setT(e.target.value); setMsg(""); }} />
            <button className="btn" type="submit">Park it</button>
          </div>
        </form>
        {msg && <p className="note" role="status">{msg}</p>}
      </div>
    </section>
  );
}
