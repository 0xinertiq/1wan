"use client";

import { useEffect, useRef, useState } from "react";
import { useCourt } from "@/components/court/CourtState";
import { TAILS, anchorStreak, earned } from "@/lib/court/tails";

// The fox (crew/fox.md, v2): an original code-drawn pixel kitsune drawn on the crew's 32-pixel grid so he
// matches them: chibi proportions (a big round head, a tiny round body, short stubby legs), big pointed ears
// with soft pink insides and red tips, the crew's face language (2x3 dark eyes with a one-pixel highlight, blush,
// a tiny nose and a happy mouth), red cheek stripes as his signature, soft white fur with lavender-pink shading,
// one gold accent (a tiny bell on a red collar), and a 1px plum outline traced round every shape like the crew.
// Plump round tails fan out behind him; how many comes from the existing tails value (read-only), with the
// next one as a faint ghost. The tails are their own layer so they can wag.

import { FOX_COLOURS as C, H, W, bodyMap, tailsMap, type Px } from "./foxArt";

const rects = (m: Px[][], key: string) => m.flatMap((row, y) => row.map((c, x) => (c ? <rect key={key + x + "-" + y} x={x} y={y} width="1" height="1" fill={C[c]} /> : null)));

export function FoxSvg({ tails, sleepy = false }: { tails: number; sleepy?: boolean }) {
  const shown = Math.min(9, tails + (tails < 9 ? 1 : 0));
  return (
    <svg viewBox={`0 -1 ${W} ${H}`} shapeRendering="crispEdges" aria-hidden="true" className="fox-svg">
      {shown > tails && <g opacity=".35">{rects(tailsMap(shown), "g")}</g>}
      {tails > 0 && <g className="fox-tails">{rects(tailsMap(tails), "t")}</g>}
      {rects(bodyMap(sleepy), "b")}
    </svg>
  );
}
export const FOX_ASPECT = W / H;

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
        <button ref={ref} type="button" className={"lw-fox" + (hop ? " hop" : "") + (joy ? " joy" : "") + (nap ? " nap" : "")} style={{ height: px }} aria-expanded={open} aria-label={`9-Tails, ${n} of 9 tails. Open what each tail means`} onClick={() => setOpen(!open)}>
          <FoxSvg tails={n} sleepy={nap} />
          <Flame glow={n / 9} />
          {nap && <span className="lw-zz" aria-hidden="true">z</span>}
          {joy && <span className="lw-spark" aria-hidden="true">✦</span>}
        </button>
      </div>
      {open && (
        <div className="lw-fox-card" role="dialog" aria-label="9-Tails: the tails">
          <div className="lw-fox-h"><b>9-Tails · {n} of 9 tails</b><button className="btn sm ghost" type="button" onClick={() => setOpen(false)}>Close</button></div>
          <ul>
            {TAILS.map((t, i) => <li key={t.n} className={on[i] ? "on" : ""}><span aria-hidden="true">{on[i] ? "✓" : "○"}</span><b>{t.n}</b> {t.h}{!on[i] && progress(i, st, k) && <span className="note"> · {progress(i, st, k)}</span>}</li>)}
          </ul>
          {next >= 0 ? <p className="note">Next tail: <b>{TAILS[next].n}</b>, {TAILS[next].h}.</p> : <p className="note">All nine tails. A legend.</p>}
        </div>
      )}
    </>
  );
}
