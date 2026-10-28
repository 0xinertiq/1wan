"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { PixelSprite, type SpriteName } from "@/components/PixelSprite";
import { CREW_AT, stageFor } from "@/components/kumo/kingdom";
import { geometry, makeWorld, phaseAt, weatherFrom } from "@/components/kumo/world/draw";
import { worldLayout } from "@/components/kumo/world/layout";
import type { BriefKind } from "@/lib/briefKinds";
import { crewDuty } from "@/lib/court/duty";
import type { WaterEvt } from "@/lib/court/garden";
import { getOnce } from "@/lib/court/once";
import { greetWord, clock } from "@/lib/court/time";
import { WorldFox } from "@/components/kumo/Fox";
import { QUOTES, nextQuote, quoteOfDay, trimQuote } from "@/lib/court/quotes";
import { readSaved, writeSaved } from "@/lib/court/store";
import { useCourt } from "../CourtState";
import { AlertMark } from "../Alerts";
import { useSprint } from "./SprintLive";
import { SPRINT_MIN, type SprintTag } from "@/lib/court/sprint";

// The Living World (COURT_SPEC Part 1 and 4): the code-drawn pixel kingdom at the top of the New-look Court.
// Places are links to the same tabs as the rail. The crew walk to their place when their desk has run today
// (lib/court/duty.ts, read-only) and gather at the castle gate otherwise. Time of day follows Singapore time,
// weather follows the Open-Meteo reading the Court already uses, growth follows her level (cosmetic only).
// The animation pauses off-screen and in hidden tabs, and shows a still scene under reduced motion.

const PLACE_DESC: Record<string, string> = {
  castle: "The Castle: home, your Court", clock: "Clock Tower: calendar", obs: "Observatory: Luna's card on the Court",
  garden: "Sakura Garden: habits and growth", life: "Life Hub: life admin and money", diary: "Dungeon: reflection, your diary",
};
const CREW = ["olli", "pip", "fenn", "tilly", "luna", "momo", "coco", "poppy", "dundun"];

const isNums = (v: unknown): v is number[] => Array.isArray(v) && v.every((n) => Number.isInteger(n) && n >= 0);

export function LivingWorld({ filed }: { filed: Partial<Record<BriefKind, string>> }) {
  const { st, k, nm } = useCourt();
  const box = useRef<HTMLDivElement>(null), cvRef = useRef<HTMLCanvasElement>(null);
  const [wh, setWh] = useState<[number, number] | null>(null);
  const [wx, setWx] = useState<{ now: number | null; sky?: string } | null>(null);
  const [water, setWater] = useState<WaterEvt[]>([]);
  useEffect(() => { fetch("/api/weather").then((r) => r.json()).then(setWx).catch(() => setWx({ now: null })); }, []);
  useEffect(() => { getOnce<{ events?: WaterEvt[] }>("/api/water?days=1").then((j) => setWater(Array.isArray(j.events) ? j.events : [])).catch(() => {}); }, []);
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => setWh([el.clientWidth, el.clientHeight]));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  // Everything on top of the canvas comes from one layout (components/kumo/world/layout.ts, checked by
  // tests/world-layout.test.mjs): a HUD band at the top, the island fitted snugly below it, labels clear of the
  // HUD and the crew, crew about 15% of the scene height (20% on the phone strip) on the ground in front.
  const duty = crewDuty({ k, filed, water, st, sky: true });
  const crewOn = CREW.filter((id) => duty[id]?.on).map((id) => ({ id, place: Object.entries(CREW_AT).find(([, ids]) => ids.includes(id))?.[0] ?? "castle" }));
  // round 10: a new quote on each load and every few minutes, none repeated until the library has been used up
  const all = useMemo(() => QUOTES.concat(st.uq), [st.uq]);
  const [qi, setQi] = useState<number | null>(null);
  const lastQ = useRef<number | null>(null);
  useEffect(() => {
    const turn = () => { const r = nextQuote(all.length, readSaved("quotes.seen", isNums, []), lastQ.current); lastQ.current = r.i; writeSaved("quotes.seen", r.seen); setQi(r.i); };
    turn();
    const t = window.setInterval(turn, 4 * 60e3);
    return () => window.clearInterval(t);
  }, [all.length]);
  const quote = qi != null && qi >= 0 && all[qi] ? trimQuote(all[qi]) : quoteOfDay(k, st.uq);
  const crewKey = crewOn.map((c) => c.id).join();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const L = useMemo(() => (wh ? worldLayout(wh[0], wh[1], crewOn, quote.length) : null), [wh, crewKey, quote.length]);

  const phase = phaseAt(nm), weather = weatherFrom(wx?.sky), stage = stageFor(st.lvl);
  const world = useMemo(() => (L ? makeWorld({ W: L.W, H: L.H, top: L.top, phase, weather, stage: stage.n }) : null), [L, phase, weather, stage.n]);
  // Hearts and a happy fox when she earns XP (a habit, a trade or any logged win); cosmetic only.
  const xpSeen = useRef<number | null>(null), [cheer, setCheer] = useState(0);
  const xpKey = st.lvl * 100000 + st.xp;
  useEffect(() => {
    if (xpSeen.current != null && xpKey > xpSeen.current) { world?.cheer(performance.now()); setCheer((n) => n + 1); }
    xpSeen.current = xpKey;
  }, [xpKey, world]);

  useEffect(() => {
    const cv = cvRef.current; if (!cv || !world || !L) return;
    // The world is drawn at its logical size, blown up by a whole number nearest-neighbour (crisp, even pixels),
    // and the browser then fits that to the exact (fractional) scale.
    const N = Math.max(1, Math.ceil(L.s));
    cv.width = L.W * N; cv.height = L.H * N;
    const lc = document.createElement("canvas"); lc.width = L.W; lc.height = L.H;
    const l = lc.getContext("2d")!, c = cv.getContext("2d")!;
    const paint = (t: number) => { world.draw(l, t, new Date()); c.imageSmoothingEnabled = false; c.drawImage(lc, 0, 0, L.W * N, L.H * N); };
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = 0, onScreen = true;
    const frame = (t: number) => { raf = requestAnimationFrame(frame); if (!onScreen || document.hidden || t - last < 33) return; last = t; paint(t); };
    paint(4000);
    if (still) return;
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; });
    io.observe(cv);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [world, L]);

  const at = crewOn.length;
  const g = L ? geometry(L.W, L.H, L.top) : null;
  const night = phase === "night" || phase === "dusk";

  return (
    <section className={"lw ph-" + phase + (night ? " scene-dark" : " scene-light")} aria-label="Your kingdom">
      <div className="lw-box" ref={box} style={L ? ({ "--lw-hud": L.hud.h + "px" } as React.CSSProperties) : undefined}>
        <canvas ref={cvRef} className="lw-cv" aria-hidden="true" style={L ? { width: L.W * L.s, height: L.H * L.s } : undefined} />
        {L && L.places.map((p) => (
          <a key={p.id} className="lw-place" href={p.href} aria-label={PLACE_DESC[p.id]} style={{ left: p.box.x, top: p.box.y, width: p.box.w, height: p.box.h }}>
            <span>{p.label}</span>
          </a>
        ))}
        {L && g && (
          <>
            <span className="lw-crew lw-kumo" style={{ left: L.kumo.x, top: L.kumo.y, width: L.kumo.w, height: L.kumo.h }} title="Chief Kumo"><PixelSprite name="kumo" /></span>
            {CREW.map((id) => {
              const b = L.crew.find((c) => c.id === id);
              // off duty: inside the castle (hidden at the gate), as in the Cloud Court
              const pos = b ?? { x: g.cx * L.s - L.px / 2, y: (g.gy - 6) * L.s - L.px, w: L.px, h: L.px };
              return <span key={id} className={"lw-crew" + (b ? " on" : " in")} style={{ left: pos.x, top: pos.y, width: pos.w, height: pos.h }} title={`${id[0].toUpperCase() + id.slice(1)}: ${duty[id]?.why ?? ""}`} aria-hidden={!b}><PixelSprite name={id as SpriteName} /></span>;
            })}
          </>
        )}
        {L && <WorldFox perches={L.perches} s={L.s} px={L.foxH} cheer={cheer} />}
        <div className="lw-hud">
          <SprintIcon />
          <p className="lw-greet">{greetWord(nm)}, Queen</p>
          <div className="lw-badges">
            <span className="lw-badge">Lv {st.lvl}</span>
            <span className="lw-badge">{at} at work</span>
            {wx?.now != null && <span className="lw-badge">{Math.round(wx.now)}°C {wx.sky ?? ""}</span>}
          </div>
        </div>
        <div className="lvl" id="lvlBanner" hidden><b id="lvlTxt">LEVEL UP</b><span id="lvlSub"></span></div>
      </div>
      {L && <CloudSay text={quote} night={night} below={!L.bubble} tail={L.bubble ? Math.max(14, Math.min(L.bubble.w - 14, L.kumo.x + L.kumo.w / 2 - L.bubble.x)) : undefined} style={L.bubble ? { left: L.bubble.x, top: L.bubble.y, width: L.bubble.w } : {}} />}
    </section>
  );
}

// Slim live prices bar under the world: one line (BTC, SOL, then the scan's tickers) with the data time.
// It never wraps; extra tickers scroll sideways. Existing price data only.
export function PricesStrip() {
  const { prices } = useCourt();
  const fmt = (n: number) => (n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : n >= 1 ? n.toFixed(2) : n.toPrecision(3));
  const pct = (c: number | null) => (c == null ? "" : (c >= 0 ? "+" : "") + c.toFixed(1) + "%");
  if (!prices) return <div className="kprices" role="status"><span className="note">Prices loading…</span></div>;
  if (!prices.prices.length) return <div className="kprices" role="status"><span className="note">Prices are not reachable right now.</span></div>;
  const order = ["BTC", "SOL"], list = [...prices.prices].sort((a, b) => (order.indexOf(a.sym) + 1 || 9) - (order.indexOf(b.sym) + 1 || 9));
  const asOf = clock(prices.at);
  return (
    <div className="kprices" aria-label="Live prices">
      <ul tabIndex={0}>{list.map((p) => <li key={p.sym}><b>{p.sym}</b> {fmt(p.usd)} <i className={p.ch24 != null && p.ch24 < 0 ? "dn" : "up"}>{pct(p.ch24)}</i></li>)}</ul>
      <span className="kprices-at">as of <time className="ts">{asOf} SGT</time>{prices.stale ? " · stale" : ""}</span>
    </div>
  );
}

// Crew roster: one quiet line under the two columns (sprite, name, what the desk has done today), from the
// same duty rules as the world. Scrolls sideways on the phone.
export function CrewRoster({ filed }: { filed: Partial<Record<BriefKind, string>> }) {
  const { st, k } = useCourt();
  const [water, setWater] = useState<WaterEvt[]>([]);
  useEffect(() => { getOnce<{ events?: WaterEvt[] }>("/api/water?days=1").then((j) => setWater(Array.isArray(j.events) ? j.events : [])).catch(() => {}); }, []);
  const duty = crewDuty({ k, filed, water, st, sky: true });
  return (
    <section className="kroster" aria-label="Crew roster">
      <ul tabIndex={0}>
        {/* round 7: Chief Kumo leads the roster, so his alert "!" has a place on the Court */}
        {["kumo", ...CREW].map((id) => (
          <li key={id} className={duty[id]?.on || id === "kumo" ? "on" : ""}>
            <span className="kroster-px"><PixelSprite name={id as SpriteName} /></span>
            {(id === "kumo" || id === "pip" || id === "olli" || id === "coco" || id === "momo") && <AlertMark agent={id} />}
            <b>{id[0].toUpperCase() + id.slice(1)}</b>
            <span>{id === "kumo" ? "Chief of the court" : duty[id]?.why}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Kumo's quote of the day in a cloud-shaped speech bubble: a scalloped outline drawn in SVG to fit the text
// (puffs along the edge, plum outline, cream fill), small puffs as the tail up to Kumo, two gold sparkles.
// Only the quote text; tap or focus to read a long one in full. Lavender cloud with light text at night.
// The quote is always shown in full (no clamp, no tap to expand); the layout gives it a free spot in the scene,
// or it sits under the strip (below) when no spot is free, as on the phone.
// tail: where Kumo is, measured from the bubble's left edge; the tail puffs point down to him.
function CloudSay({ text, night, below, style, tail: tx }: { text: string; night: boolean; below: boolean; style: React.CSSProperties; tail?: number }) {
  const ref = useRef<HTMLElement>(null);
  const [wh, setWh] = useState<[number, number]>([0, 0]);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(() => setWh([el.offsetWidth, el.offsetHeight]));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  const [w, h] = wh, b = 9, puffs: [number, number, number][] = [];
  if (w > 2 * b && h > 2 * b) {
    const along = (x0: number, y0: number, x1: number, y1: number) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / (b * 1.35))); for (let i = 0; i < n; i++) puffs.push([x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, b]); };
    along(b, b, w - b, b); along(w - b, b, w - b, h - b); along(w - b, h - b, b, h - b); along(b, h - b, b, b);
  }
  // Kumo sits below-left of the bubble, so the tail puffs trail down-left to him. A clear glass cloud: the
  // fill is a light token tint (cream by day, lavender at night, set in CSS) under the button's backdrop blur,
  // and the outline is a 1px plum ring cut from the shape with a mask, so nothing dark shows through the glass.
  const tail: [number, number, number][] = tx != null ? [[tx, h + 4, 5], [tx, h + 12, 3]] : [[4, h + 3, 5], [-5, h + 10, 3]];
  const all = [...puffs, ...tail], id = useId().replace(/:/g, "");
  const shape = (grow: number, col: string) => <>
    {all.map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r + grow} fill={col} />)}
    {w > 0 && <rect x={b - grow} y={b - grow} width={Math.max(0, w - 2 * b + 2 * grow)} height={Math.max(0, h - 2 * b + 2 * grow)} fill={col} />}
  </>;
  return (
    <figure ref={ref} className={"lw-say r5" + (night ? " night" : "") + (below ? " below" : "")} style={style} aria-label="Quote of the day">
      <svg className="lw-cloud" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
        <defs><mask id={"m" + id} maskUnits="userSpaceOnUse" x="-20" y="-20" width={w + 40} height={h + 40}>{shape(1, "white")}{shape(0, "black")}</mask></defs>
        <g className="lw-cloud-fill">{shape(0, "currentColor")}</g>
        <rect className="lw-cloud-line" x="-20" y="-20" width={w + 40} height={h + 40} mask={`url(#m${id})`} />
      </svg>
      <blockquote className="lw-say-t">{text}</blockquote>
    </figure>
  );
}

// Focus sprint, top left of the world: a pixel hourglass with a face. Tap to start the existing 25-minute
// sprint (Study or Other); while it runs, a ring and the minutes left show, and a tap offers Stop.
const HG = ["XXXXXXXXX", ".XgggggX.", ".XoooooX.", "..XoXoX..", "..XoooX..", "...XcX...", "..XoooX..", ".XooooX..", ".XoooooX.", "XXXXXXXXX"];
// pixel-art palette (the hourglass sprite)
const HGF: Record<string, string> = { X: "#4a2538", o: "#FFF8EE", g: "#FFD95E", c: "#FF9DBF" };
function SprintIcon() {
  const { run, left, start, paused, pause, resume, stop } = useSprint();
  const [open, setOpen] = useState(false);
  const total = SPRINT_MIN * 60, frac = run ? 1 - left / total : 0, mins = Math.ceil(left / 60);
  // Not running: tap to choose Study or Other. Running: tap to pause, tap again to resume; a small stop beside it.
  const label = !run ? "Start a 25-minute focus sprint" : paused ? `Focus sprint paused, ${mins} minutes left. Tap to resume` : `Focus sprint running, ${mins} minutes left. Tap to pause`;
  return (
    <div className="lw-sprint">
      <button type="button" className={"lw-sprint-btn" + (run ? " on" : "") + (paused ? " paused" : "")} aria-expanded={run ? undefined : open} aria-label={label} onClick={() => (!run ? setOpen(!open) : paused ? resume() : pause())}>
        {run && <svg className="lw-ring" viewBox="0 0 36 36" aria-hidden="true"><circle className="lw-ring-bg" cx="18" cy="18" r="16" fill="none" strokeWidth="3" /><circle className="lw-ring-fg" cx="18" cy="18" r="16" fill="none" strokeWidth="3" strokeDasharray={`${frac * 100.5} 100.5`} transform="rotate(-90 18 18)" /></svg>}
        <svg className="lw-hg" viewBox="0 0 9 10" shapeRendering="crispEdges" aria-hidden="true">
          {HG.flatMap((row, y) => row.split("").map((ch, x) => (ch === "." ? null : <rect key={x + "-" + y} x={x} y={y} width="1" height="1" fill={HGF[ch]} />)))}
        </svg>
        {run && <span className="lw-min">{paused ? "II " : ""}{mins}m</span>}
      </button>
      {run && <button type="button" className="lw-sprint-stop" aria-label="Stop the focus sprint (not counted)" onClick={() => stop()}>×</button>}
      {open && !run && (
        <div className="lw-sprint-pop" role="dialog" aria-label="Focus sprint">
          <p><b>Focus sprint, {SPRINT_MIN} min</b></p>
          <div className="rep-act">{(["study", "other"] as SprintTag[]).map((t) => <button key={t} className="btn sm" type="button" onClick={() => { start(t); setOpen(false); }}>{t === "study" ? "Study" : "Other"}</button>)}</div>
        </div>
      )}
    </div>
  );
}
