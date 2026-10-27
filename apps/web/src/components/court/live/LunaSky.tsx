"use client";

import { useMemo, useState } from "react";
import { useCourt } from "../CourtState";
import { eventsOn, isAstro } from "@/lib/court/state";
import { addDays, prettyDay } from "@/lib/court/time";
import { GLYPH, SIGNS, birthMoment, fmtDeg, houses, moonPhase, positions, signOf, skyEvents, transits, lonOf, type BodyName, type SkyEvent } from "@/lib/sky";

// Luna's sky: "From your astro calendar" (verbatim, private) and "Computed sky" (our rules), plus a
// cross-check of simple facts. Never overrides one with the other, never predicts outcomes.
const sgtKey = (d: Date) => new Date(d.getTime() + 8 * 3600000).toISOString().slice(0, 10);
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
    const out: { d: string; t: string }[] = [];
    for (let i = 0; i < 8; i++) { const d = addDays(k, i); for (const e of eventsOn(events, d, true)) if (isAstro(e)) out.push({ d, t: e.t }); }
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
        <LunaCaption />
        {!st.birth && <p className="note">Luna can read transits to your own chart. <button className="btn sm" type="button" onClick={() => openSheet({ kind: "birth" })}>Add birth details</button></p>}
        <button className="btn sm ghost" type="button" onClick={() => setOpen(!open)}>{open ? "Hide the full reading" : "Full reading"}</button>
        {open && <>
          {astro.length > 0 && <>
            <div className="sec-h">From your astro calendar</div>
            <p className="note xd">Its own words, private to you.</p>
            {astro.map((x, i) => <div className="filed-row" key={i}><span className="note">{x.d === k ? "Today" : prettyDay(x.d)}</span><span>{x.t}</span></div>)}
          </>}
          <div className="sec-h">Computed sky</div>
          <p className="note xd">Tropical zodiac, computed here from planetary positions.</p>
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
