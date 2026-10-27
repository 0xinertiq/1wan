"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PixelSprite, type SpriteName } from "@/components/PixelSprite";
import { CREW_AT, stageFor } from "@/components/kumo/kingdom";
import { geometry, makeWorld, phaseAt, weatherFrom } from "@/components/kumo/world/draw";
import type { BriefKind } from "@/lib/briefKinds";
import { crewDuty } from "@/lib/court/duty";
import type { WaterEvt } from "@/lib/court/garden";
import { getOnce } from "@/lib/court/once";
import { greetWord, prettyDay } from "@/lib/court/time";
import { quoteOfDay } from "@/lib/court/quotes";
import { useCourt } from "../CourtState";

// The Living World (COURT_SPEC Part 1 and 4): the code-drawn pixel kingdom at the top of the New-look Court.
// Places are links to the same tabs as the rail. The crew walk to their place when their desk has run today
// (lib/court/duty.ts, read-only) and gather at the castle gate otherwise. Time of day follows Singapore time,
// weather follows the Open-Meteo reading the Court already uses, growth follows her level (cosmetic only).
// The animation pauses off-screen and in hidden tabs, and shows a still scene under reduced motion.

const PLACE_DESC: Record<string, string> = {
  castle: "The Castle: your kingdom progress", clock: "Clock Tower: calendar", obs: "Observatory: Luna's sky and research",
  garden: "Sakura Garden: habits and growth", life: "Life Hub: life admin and money", diary: "Fox Diary: reflection",
};
const CREW = ["olli", "pip", "fenn", "tilly", "luna", "momo", "coco", "poppy", "dundun"];

export function LivingWorld({ filed }: { filed: Partial<Record<BriefKind, string>> }) {
  const { st, k, nm } = useCourt();
  const box = useRef<HTMLDivElement>(null), cvRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState<{ W: number; H: number; s: number; px: number } | null>(null);
  const [qOpen, setQOpen] = useState(false);
  const [wx, setWx] = useState<{ now: number | null; sky?: string } | null>(null);
  const [water, setWater] = useState<WaterEvt[]>([]);
  useEffect(() => { fetch("/api/weather").then((r) => r.json()).then(setWx).catch(() => setWx({ now: null })); }, []);
  useEffect(() => { getOnce<{ events?: WaterEvt[] }>("/api/water?days=1").then((j) => setWater(Array.isArray(j.events) ? j.events : [])).catch(() => {}); }, []);

  // Integer pixel scale: 2 on desktop and tablet, 1 on the phone strip.
  useEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => { const w = el.clientWidth, h = el.clientHeight, s = h >= 280 ? 2 : 1; setSize({ W: Math.ceil(w / s), H: Math.floor(h / s), s, px: Math.round(h * (s === 2 ? 0.085 : 0.15)) }); });
    ro.observe(el); return () => ro.disconnect();
  }, []);

  const phase = phaseAt(nm), weather = weatherFrom(wx?.sky), stage = stageFor(st.lvl);
  const world = useMemo(() => (size ? makeWorld({ W: size.W, H: size.H, phase, weather, stage: stage.n }) : null), [size, phase, weather, stage.n]);

  useEffect(() => {
    const cv = cvRef.current; if (!cv || !world || !size) return;
    cv.width = size.W; cv.height = size.H;
    const c = cv.getContext("2d")!;
    const still = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = 0, onScreen = true;
    const frame = (t: number) => { raf = requestAnimationFrame(frame); if (!onScreen || document.hidden || t - last < 33) return; last = t; world.draw(c, t, new Date()); };
    world.draw(c, 4000, new Date());
    if (still) return;
    const io = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; });
    io.observe(cv);
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, [world, size]);

  const duty = crewDuty({ k, filed, water, st, sky: true });
  const at = CREW.filter((id) => duty[id]?.on).length;
  const g = size ? geometry(size.W, size.H) : null;
  // Crew spots in CSS pixels: at their place when their desk has run today (side by side, a sprite apart),
  // otherwise inside the castle (hidden at the gate), as in the Cloud Court. Kumo waits at the gate.
  const spot = (id: string): { x: number; y: number; on: boolean } => {
    if (!g || !size) return { x: 0, y: 0, on: false };
    const place = Object.entries(CREW_AT).find(([, ids]) => ids.includes(id))?.[0];
    const p = g.places.find((x) => x.id === place);
    if (duty[id]?.on && p) { const mates = CREW_AT[place!].filter((x) => duty[x]?.on), j = mates.indexOf(id); return { x: p.desk[0] * size.s + (j - (mates.length - 1) / 2) * size.px * 0.9, y: p.desk[1] * size.s, on: true }; }
    return { x: g.cx * size.s, y: (g.gy - 6) * size.s, on: false };
  };
  const quote = quoteOfDay(k, st.uq);

  return (
    <section className="lw" aria-label="Your kingdom">
      <div className="lw-box" ref={box}>
        <canvas ref={cvRef} className="lw-cv" aria-hidden="true" style={size ? { width: size.W * size.s, height: size.H * size.s } : undefined} />
        {g && size && g.places.map((p) => (
          <a key={p.id} className="lw-place" href={p.href} aria-label={PLACE_DESC[p.id]} style={{ left: p.x * size.s, top: p.y * size.s }}>
            <span>{p.label}</span>
          </a>
        ))}
        {g && size && (
          <>
            <span className="lw-crew lw-kumo" style={{ left: (g.cx - 44) * size.s, top: (g.gy + 24) * size.s, width: size.px, height: size.px }} title="Chief Kumo"><PixelSprite name="kumo" /></span>
            <button type="button" className={"lw-say" + (qOpen ? " open" : "")} style={{ left: (g.cx - 44) * size.s, top: (g.gy + 24) * size.s + 8 }} aria-expanded={qOpen} onClick={() => setQOpen(!qOpen)} title="Quote of the day">
              <span className="lw-say-k">Kumo</span> {quote}
            </button>
            {CREW.map((id) => {
              const p = spot(id);
              return <span key={id} className={"lw-crew" + (p.on ? " on" : " in")} style={{ left: p.x, top: p.y, width: size.px, height: size.px }} title={`${id[0].toUpperCase() + id.slice(1)}: ${duty[id]?.why ?? ""}`} aria-hidden={!p.on}><PixelSprite name={id as SpriteName} /></span>;
            })}
          </>
        )}
        <div className="lw-top">
          <p className="lw-greet">{greetWord(nm)}, Queen · {prettyDay(k)}</p>
          <div className="lw-badges">
            <span className="lw-badge">Lv {st.lvl}</span>
            <span className="lw-badge">{at} at work</span>
            {wx?.now != null && <span className="lw-badge">{Math.round(wx.now)}°C {wx.sky ?? ""}</span>}
          </div>
        </div>
        <div className="lvl" id="lvlBanner" hidden><b id="lvlTxt">LEVEL UP</b><span id="lvlSub"></span></div>
      </div>
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
  const asOf = new Date(Date.parse(prices.at) + 8 * 3600000).toISOString().slice(11, 16);
  return (
    <div className="kprices" aria-label="Live prices">
      <ul tabIndex={0}>{list.map((p) => <li key={p.sym}><b>{p.sym}</b> {fmt(p.usd)} <i className={p.ch24 != null && p.ch24 < 0 ? "dn" : "up"}>{pct(p.ch24)}</i></li>)}</ul>
      <span className="kprices-at">as of {asOf}{prices.stale ? " · stale" : ""}</span>
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
        {CREW.map((id) => (
          <li key={id} className={duty[id]?.on ? "on" : ""}>
            <span className="kroster-px"><PixelSprite name={id as SpriteName} /></span>
            <b>{id[0].toUpperCase() + id.slice(1)}</b>
            <span>{duty[id]?.why}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
