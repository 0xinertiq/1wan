"use client";

import { useState } from "react";
import { PixelSprite } from "@/components/PixelSprite";
import { useCourt } from "../CourtState";
import { eventsOn, isAstro, type DayEvent } from "@/lib/court/state";
import { greetWord, hm, prettyDay } from "@/lib/court/time";
import { AstroText } from "./AstroText";
import { useSky } from "./LunaSky";

// Top of the Court in the New look (hidden in Classic): kingdom banner, Now / Next / Later, Luna's daily
// astro weather and Quick capture. Reads the same state and calendar as the rest of the Court; Quick capture
// writes to the same "Park a thought" list as the Today window. Every older window stays below.

export function KumoHome() {
  return (
    <div className="khome">
      <KingdomBanner />
      <div className="khome-grid">
        <NowNextLater />
        <AstroWeather />
        <QuickCapture />
      </div>
    </div>
  );
}

function KingdomBanner() {
  const { k, nm } = useCourt();
  return (
    <section className="kbanner" aria-label="Kingdom">
      <div className="kbanner-scene" aria-hidden="true" />
      <div className="kbanner-text">
        <h2>{greetWord(nm)}, Queen</h2>
        <p>{prettyDay(k)} · a calmer day, a richer life</p>
      </div>
      <span className="kbanner-fox"><PixelSprite name="kumo" label="Chief Kumo" /></span>
    </section>
  );
}

function NowNextLater() {
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
      <div className="win-title"><h2 id="knlT">Today</h2><a className="sub" href="#calendar">Calendar</a></div>
      <div className="win-body">
        {cal.state === "loading" ? <p className="note">Calendar loading…</p>
          : cal.state === "error" ? <p className="note">Calendar not reachable right now.</p>
          : cal.state === "off" ? <p className="note">Calendar not connected yet.</p>
          : <>
            <div className="sec-h">Now</div>
            {now.length ? now.map(row) : <p className="note">Nothing on right now.</p>}
            <div className="sec-h">Next</div>
            {next.length ? next.map(row) : <p className="note">Nothing else today.</p>}
            {rest.length > 0 && <><div className="sec-h">Later</div>{rest.map(row)}</>}
          </>}
      </div>
    </section>
  );
}

// Luna's daily astro weather: the headline is Luna's own calculation; the events are the astro calendar's
// titles and descriptions, quoted as written. Nothing is interpreted or invented here.
function AstroWeather() {
  const { k, events, cal } = useCourt();
  const { pos, phase } = useSky();
  const today = eventsOn(events, k, true).filter((e) => isAstro(e));
  const src = today[0]?.cal;
  return (
    <section className="win kastro" aria-labelledby="kastroT">
      <div className="win-title"><h2 id="kastroT">Luna&apos;s astro weather</h2><a className="sub" href="#lunaWin">Full sky</a></div>
      <div className="win-body">
        <p className="kastro-h">☽ {phase.name} · Moon in {pos[1].sign}{pos.some((p) => p.retro) ? ` · ${pos.filter((p) => p.retro).map((p) => p.b).join(", ")} retrograde` : ""}</p>
        <p className="note">Calculated by Luna (tropical zodiac).</p>
        {cal.state === "loading" ? <p className="note">Astro calendar loading…</p>
          : cal.state !== "live" ? <p className="note">Astro calendar not reachable, so only Luna&apos;s calculation shows.</p>
          : today.length ? <>
            {today.slice(0, 3).map((e, i) => (
              <div className="kastro-ev" key={i}>
                <b>{e.t}</b>{!e.allDay && <span className="note"> · {hm(e.a)}–{hm(e.b)} SGT</span>}
                <AstroText text={e.desc} />
              </div>
            ))}
            {today.length > 3 && <a className="note" href="#lunaWin">{today.length - 3} more in Luna&apos;s sky</a>}
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
