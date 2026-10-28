"use client";

import { useEffect, useRef, useState } from "react";
import { useCourt } from "@/components/court/CourtState";
import { TAILS, anchorStreak, earned } from "@/lib/court/tails";

// The fox (crew/fox.md): an original code-drawn pixel kitsune who hops around the world. White fur, red
// markings on ears, cheeks and tail tips, plum outline, blush cheeks, dot eyes, one gold accent (a tiny bell).
// He shows the existing tails value read-only (lib/court/tails.ts): one fluffy tail per earned tail, the next
// one as a faint ghost. A little spirit flame floats beside him and glows brighter as tails grow.

const BODY = [
  "..........X...X..",
  ".........XrX.XrX.",
  ".........XrwwwrX.",
  "........XwwwwwwwX",
  "........XwwwwwwwX",
  "........XwkwwwkwX",
  "........XrpwnwprX",
  ".........XwwwwwX.",
  "......XXXwwgwwX..",
  ".....XwwwwwwwwX..",
  "....XwwwwwwwwwX..",
  "....XwwwwwwwwwX..",
  "....XwwwwwXwwwX..",
  "....XwwwwXwXwwX..",
  "....XwwwXrX.XrX..",
  ".....XXXX.X..X...",
];
// Three plume shapes (red tip at the far end) so the tails fan out on an arc behind him: upright, diagonal, sideways.
// b is the plume's base pixel, which sits on the arc.
const PLUMES = {
  U: { g: ["..XX..", ".XrrX.", "XrrrwX", "XwwwwX", "XwwwwX", "XwwwwX", ".XwwwX", "..XwwX", "...XX."], b: [3, 8] },
  D: { g: ["XX......", "XrrX....", "XrrwX...", ".XwwwX..", "..XwwwX.", "...XwwwX", "....XwwX", ".....XX."], b: [6, 7] },
  F: { g: [".XX......", "XrrXXXX..", "XrrwwwwXX", "XrwwwwwwX", ".XXwwwwX.", "...XXXX.."], b: [8, 3] },
} as const;
const COL: Record<string, string> = { X: "#4a2538", w: "#FFFFFF", r: "#E2574C", p: "#FF9DBF", k: "#4a2538", n: "#4a2538", g: "#FFD95E" };
function tailAt(i: number) {
  const a = ((95 + i * 12) * Math.PI) / 180, v = i < 2 ? PLUMES.U : i < 6 ? PLUMES.D : PLUMES.F;
  const bx = 5 + Math.round(Math.cos(a) * 5), by = 11 - Math.round(Math.sin(a) * 5);
  return { g: v.g as readonly string[], x: bx - v.b[0], y: by - v.b[1] };
}

function grid(rows: readonly string[], ox: number, oy: number, key: string) {
  return rows.flatMap((row, y) => row.split("").map((ch, x) => (ch === "." ? null : <rect key={`${key}${x}-${y}`} x={ox + x} y={oy + y} width="1" height="1" fill={COL[ch]} />)));
}

export function FoxSvg({ tails }: { tails: number }) {
  const shown = Math.min(9, tails + (tails < 9 ? 1 : 0));
  const parts = [];
  for (let i = shown - 1; i >= 0; i--) {
    const t = tailAt(i);
    parts.push(<g key={i} opacity={i < tails ? 1 : 0.35}>{grid(t.g, t.x, t.y, "t" + i)}</g>);
  }
  return (
    <svg viewBox="-12 -4 29 20" shapeRendering="crispEdges" aria-hidden="true" className="fox-svg">
      {parts}
      {grid(BODY, 0, 0, "b")}
      <rect x="10" y="4" width="1" height="1" fill="#FFFFFF" opacity=".9" />
    </svg>
  );
}

const FLAME = [".X.", "XwX", "XlX", ".X."];
function Flame({ glow }: { glow: number }) {
  return (
    <svg className="fox-flame" viewBox="0 0 3 4" shapeRendering="crispEdges" aria-hidden="true" style={{ opacity: 0.35 + 0.65 * glow }}>
      {FLAME.flatMap((row, y) => row.split("").map((ch, x) => (ch === "." ? null : <rect key={x + "-" + y} x={x} y={y} width="1" height="1" fill={ch === "X" ? "#B9A6FF" : ch === "w" ? "#FFFFFF" : "#E6DCFF"} />)))}
    </svg>
  );
}

// Progress toward a tail, only where the existing rule has a count to show.
function progress(i: number, st: ReturnType<typeof useCourt>["st"], k: string): string {
  if (i === 0) return `${anchorStreak(st, k)} of 3 days`;
  if (i === 1) return `${anchorStreak(st, k)} of 7 days`;
  if (i === 2) return `level ${st.lvl} of 5`;
  if (i === 4) return `${Object.values(st.wins).filter((w) => w?.g).length} of 7 days`;
  if (i === 8) return `level ${st.lvl} of 12`;
  return "";
}

export function WorldFox({ perches, s, px, cheer }: { perches: [number, number][]; s: number; px: number; cheer: number }) {
  const { st, k } = useCourt();
  const on = earned(st, k), n = on.filter(Boolean).length;
  const [at, setAt] = useState(0);
  const [hop, setHop] = useState(false), [joy, setJoy] = useState(false), [open, setOpen] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    // A slow, gentle hop every 16 s (1.8 s per jump, at half the earlier speed), resting or napping in between.
    const id = setInterval(() => {
      const el = ref.current; if (!el || document.hidden || open) return;
      const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
      setAt((x) => (x + 1 + Math.floor(Math.random() * (perches.length - 1))) % perches.length);
      setHop(true); setTimeout(() => setHop(false), 1800);
    }, 16000);
    return () => clearInterval(id);
  }, [perches.length, open]);
  useEffect(() => { if (!cheer) return; setJoy(true); const t = setTimeout(() => setJoy(false), 1400); return () => clearTimeout(t); }, [cheer]);
  const [x, y] = perches[at % perches.length] ?? [0, 0];
  const nap = (at === 0 || at === 1) && !hop && !joy;
  const next = on.findIndex((v) => !v);
  return (
    <>
      <div className="lw-fox-at" style={{ left: x * s, top: y * s }}>
        <button ref={ref} type="button" className={"lw-fox" + (hop ? " hop" : "") + (joy ? " joy" : "") + (nap ? " nap" : "")} style={{ height: px }} aria-expanded={open} aria-label={`The fox, ${n} of 9 tails. Open what each tail means`} onClick={() => setOpen(!open)}>
          <FoxSvg tails={n} />
          <Flame glow={n / 9} />
          {nap && <span className="lw-zz" aria-hidden="true">z</span>}
          {joy && <span className="lw-spark" aria-hidden="true">✦</span>}
        </button>
      </div>
      {open && (
        <div className="lw-fox-card" role="dialog" aria-label="The fox's tails">
          <div className="lw-fox-h"><b>The fox · {n} of 9 tails</b><button className="btn sm ghost" type="button" onClick={() => setOpen(false)}>Close</button></div>
          <ul>
            {TAILS.map((t, i) => <li key={t.n} className={on[i] ? "on" : ""}><span aria-hidden="true">{on[i] ? "✓" : "○"}</span><b>{t.n}</b> {t.h}{!on[i] && progress(i, st, k) && <span className="note"> · {progress(i, st, k)}</span>}</li>)}
          </ul>
          {next >= 0 ? <p className="note">Next tail: <b>{TAILS[next].n}</b>, {TAILS[next].h}.</p> : <p className="note">All nine tails. A legend.</p>}
        </div>
      )}
    </>
  );
}
