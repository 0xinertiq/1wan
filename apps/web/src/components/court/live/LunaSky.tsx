"use client";

import { useMemo, useState } from "react";
import { useCourt } from "../CourtState";
import { eventsOn, isAstro } from "@/lib/court/state";
import { addDays, hm, prettyDay, sgtKeyOf, clock } from "@/lib/court/time";
import { OBS_BANNER, PaintedBanner } from "@/components/kumo/PaintedBanner";
import { AstroText } from "./AstroText";
import { astroParts } from "@/components/kumo/astroParts";
import { GLYPH, SIGNS, birthMoment, fmtDeg, houses, moonPhase, positions, signOf, skyEvents, transits, lonOf, type BodyName, type SkyEvent } from "@/lib/sky";

// Luna's sky: "From your astro calendar" first (the astrologer's title and description, quoted as written,
// private), then Luna's own calculated sky beneath it, labelled as a cross-check only. Never overrides one
// with the other, never predicts outcomes.
const sgtKey = (d: Date) => sgtKeyOf(d);
const noon = (k: string) => new Date(k + "T04:00:00Z");   // 12:00 SGT

export function useSky() {
  const { k } = useCourt();
  return useMemo(() => {
    const now = new Date();
    return { pos: positions(now), phase: moonPhase(now), ev: skyEvents(new Date(k + "T00:00:00+08:00"), 90) };
  }, [k]);
}

// Facts the astro calendar states, checked against the computed sky. Unknown wording is left alone.
type Check = { fact: string; theirs: string; ours: string; ok: boolean };
function crossCheck(titles: { d: string; t: string }[], ev: SkyEvent[]): Check[] {
  const out: Check[] = [];
  const near = (d: string, f: (e: SkyEvent) => boolean) => ev.find((e) => f(e) && Math.abs(Date.parse(sgtKey(e.at)) - Date.parse(d)) <= 86400000);
  for (const { d, t } of titles) {
    let m = t.match(/\bmoon (?:enters|in|ingress(?:es)? into) (\w+)/i);
    if (m) { const s = signOf(lonOf("Moon", noon(d))); const theirs = cap(m[1]); out.push({ fact: `Moon sign, ${prettyDay(d)}`, theirs, ours: s, ok: theirs === s || signOf(lonOf("Moon", new Date(noon(d).getTime() + 43200000))) === theirs }); continue; }
    m = t.match(/\b(new|full) moon/i);
    if (m) { const want = m[1].toLowerCase() === "new" ? "New Moon" : "Full Moon"; const e = near(d, (x) => x.kind === "phase" && x.t.startsWith(want)); out.push({ fact: `${want}, ${prettyDay(d)}`, theirs: prettyDay(d), ours: e ? prettyDay(sgtKey(e.at)) : "not within a day", ok: !!e }); continue; }
    m = t.match(/\b(mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto)\b.*\b(retrograde|direct|stations? (?:rx|retrograde|direct))/i);
    if (m) { const b = cap(m[1]) as BodyName, dir = /direct/i.test(m[2]) ? "direct" : "retrograde"; const e = near(d, (x) => x.kind === "station" && x.b === b && x.dir === dir); out.push({ fact: `${b} ${dir}, ${prettyDay(d)}`, theirs: prettyDay(d), ours: e ? prettyDay(sgtKey(e.at)) : "not within a day", ok: !!e }); continue; }
    m = t.match(/\b(sun|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto) (?:enters|ingress(?:es)? into|into) (\w+)/i);
    if (m && SIGNS.includes(cap(m[2]))) { const b = cap(m[1]) as BodyName, s = cap(m[2]); const e = near(d, (x) => x.kind === "ingress" && x.b === b && x.sign === s); out.push({ fact: `${b} enters ${s}`, theirs: prettyDay(d), ours: e ? prettyDay(sgtKey(e.at)) : "not within a day", ok: !!e }); }
  }
  return out;
}
const cap = (s: string) => s[0].toUpperCase() + s.slice(1).toLowerCase();

export function LunaCaption() {
  const { k, events } = useCourt();
  const { pos, phase } = useSky();
  const mood = eventsOn(events, k, true).filter((e) => isAstro(e))[0]?.t;
  const retro = pos.filter((p) => p.retro);
  return (
    <p className="note lunacap">
      ☽ {phase.name} in {pos[1].sign}{retro.map((p) => <span className="chip-rx" key={p.b} title={`${p.b} retrograde`}> {GLYPH[p.b]}℞</span>)}
      {mood && <> · {mood}</>}
    </p>
  );
}

export function LunaSky() {
  const { st, k, events, openSheet } = useCourt();
  const { pos, phase, ev } = useSky();
  const [open, setOpen] = useState(false);
  const astro = useMemo(() => {
    const out: { d: string; t: string; desc?: string; cal: string; allDay: boolean; a: number; b: number }[] = [];
    for (let i = 0; i < 8; i++) { const d = addDays(k, i); for (const e of eventsOn(events, d, true)) if (isAstro(e)) out.push({ d, t: e.t, desc: e.desc, cal: e.cal, allDay: e.allDay, a: e.a, b: e.b }); }
    return out;
  }, [events, k]);
  const checks = useMemo(() => crossCheck(astro, ev), [astro, ev]);
  const natal = useMemo(() => {
    const b = st.birth;
    if (!b?.date || b.lat == null) return null;
    const m = birthMoment(b), cusps = houses(m, b.lat, b.lon), p = positions(m);
    return { cusps, p, tr: transits(new Date(), p, cusps) };
  }, [st.birth]);
  const next14 = ev.filter((e) => e.at.getTime() <= Date.now() + 14 * 86400000);

  return (
    <section className="win" id="lunaWin" aria-labelledby="lunaT">
      <div className="win-title"><h2 id="lunaT">Luna&apos;s sky</h2><span className="sub">{phase.name} · Moon in {pos[1].sign}</span></div>
      <div className="win-body">
        <ObsBanner phase={phase.name} sign={pos[1].sign} />
        <LunaCaption />
        {!st.birth && <p className="note">Luna can read transits to your own chart. <button className="btn sm" type="button" onClick={() => openSheet({ kind: "birth" })}>Add birth details</button></p>}
        <Obs7 k={k} astro={astro} ev={ev} />
        <div className="sec-h obs-classic">From your astro calendar</div>
        {astro.length ? <div className="lunaq">
          {astro.map((x, i) => <div className={"filed-row" + (x.desc ? " hasd" : "")} key={i}><span className="note">{x.d === k ? "Today" : prettyDay(x.d)}</span><div className="ftx"><span>{x.t}</span><AstroText text={x.desc} /></div></div>)}
          <p className="note">The astrologer&apos;s own words, as written. Private to you.</p>
        </div> : <p className="note obs-classic">No astro calendar entries in the next 8 days.</p>}
        <button className="btn sm ghost" type="button" onClick={() => setOpen(!open)}>{open ? "Hide Luna's cross-check" : "Luna's calculated sky (cross-check)"}</button>
        {open && <>
          <div className="sec-h">Luna&apos;s calculated sky · cross-check only</div>
          <p className="note">Tropical zodiac, computed here from planetary positions. It checks dates and signs; it does not replace the astrologer&apos;s reading above.</p>
          {pos.map((p) => <div className="filed-row" key={p.b}><span>{GLYPH[p.b]} {p.b}</span><span>{fmtDeg(p.lon)} {p.sign}{p.retro ? " ℞" : ""}</span></div>)}
          <p className="note">Moon {Math.round(phase.ill * 100)}% lit.</p>
          <div className="sec-h">Next 14 days</div>
          {next14.length ? next14.map((e, i) => <div className="filed-row" key={i}><span className="note">{prettyDay(sgtKey(e.at))}</span><span>{e.t}</span></div>) : <p className="note">No stations, ingresses or eclipses in the next 14 days.</p>}
          {checks.length > 0 && <>
            <div className="sec-h">Cross-check</div>
            {checks.map((c, i) => <div className="filed-row" key={i}><span>{c.fact}</span><span className="note">{c.ok ? "agrees" : `differs: check (calendar ${c.theirs}, computed ${c.ours})`}</span></div>)}
          </>}
          <div className="sec-h">Transits to your chart</div>
          {natal ? (natal.tr.length ? natal.tr.slice(0, 8).map((x, i) => <div className="filed-row" key={i}><span>{x.t}</span><span className="note">{x.orb.toFixed(1)}° · house {x.house}</span></div>)
            : <p className="note">No transits within 1.5° today.</p>)
            : <p className="note">Until you add birth details, Luna shows the general sky. <button className="btn sm ghost" type="button" onClick={() => openSheet({ kind: "birth" })}>Add birth details</button></p>}
          <p className="note">The sky gives timing context only, never outcomes, and never trade calls.</p>
        </>}
      </div>
    </section>
  );
}

// New look only (hidden in Classic): painted night banner (concept image 24, prototype crop). The painted
// title and speech bubble are covered by the real title and Luna's calculated moon for today.
function ObsBanner({ phase, sign }: { phase: string; sign: string }) {
  const bubble = <span className="pb-bubble">☽ {phase}, Moon in {sign}</span>;
  return (
    <PaintedBanner set={OBS_BANNER} label="Observatory" className="obanner"
      fill={{ title: <div className="pb-greet"><h2>The Observatory</h2><p>Luna&apos;s sky, quoted and calculated.</p></div>, bubble }}
      fillMobile={{ bubble }} />
  );
}

// New look only: the next 7 days, one fold per day (today open). Calendar entries are quoted as written with
// their source; Luna's calculated events sit apart and are labelled. Times are Singapore time.
type AstroRow = { d: string; t: string; desc?: string; cal: string; allDay: boolean; a: number; b: number };
function Obs7({ k, astro, ev }: { k: string; astro: AstroRow[]; ev: SkyEvent[] }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(k, i));
  return (
    <div className="obs7">
      <div className="sec-h">Next 7 days · Singapore time</div>
      {days.map((d, i) => {
        const rows = astro.filter((x) => x.d === d);
        const calc = ev.filter((e) => sgtKey(e.at) === d);
        return (
          <details className="obs-day" key={d} open={i === 0}>
            <summary><b>{i === 0 ? "Today" : i === 1 ? "Tomorrow" : prettyDay(d)}</b>{i < 2 && <span className="note"> {prettyDay(d)}</span>}<span className="obs-n">{rows.length + calc.length}</span></summary>
            {rows.map((x, j) => (
              <div className="obs-ev" key={j}>
                <div><b>{x.t}</b> <span className="note">{x.allDay ? "All day" : `${hm(x.a)}–${hm(x.b)} SGT`}</span></div>
                {x.d === k ? (astroParts(x.desc).extra ? <AstroText text={astroParts(x.desc).extra} /> : <p className="note">Today&apos;s energy, transits and DOs / DON&apos;Ts are on the Court.</p>) : <AstroText text={x.desc} />}
                <p className="note obs-src">Source: {x.cal}, your astro calendar{astroParts(x.desc).source ? ` (© ${astroParts(x.desc).source})` : ""}. Quoted as written.</p>
              </div>
            ))}
            {calc.map((e, j) => (
              <div className="obs-ev obs-calc" key={"c" + j}>
                <div><b>{e.t}</b> <span className="note"><time className="ts">{clock(e.at)} SGT</time></span></div>
                <p className="note obs-src">Calculated by Luna (cross-check, not a reading).</p>
              </div>
            ))}
            {!rows.length && !calc.length && <p className="note">Nothing on this day.</p>}
          </details>
        );
      })}
      <p className="note">The sky gives timing context only, never outcomes, and never trade calls.</p>
    </div>
  );
}
