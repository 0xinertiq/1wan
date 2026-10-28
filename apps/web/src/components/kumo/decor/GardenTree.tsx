"use client";

import { useEffect, useRef, useState } from "react";
import { TREE_H, TREE_PAL, TREE_W, toRects, treeModel } from "./treeArt";
import { SCENE_PAL, bridge, lanternS, type Sprite } from "./scenes";

// The Garden's centrepiece (round 12): the pixel sakura bonsai with the pond, a little bridge and lanterns around
// it, straight on the page (no box, border or fill). Gentle sway and drifting petals pause under reduced motion
// and when the tab is hidden or the tree is off screen. Colours come from --kt-* variables (day and night).
function sprite(rows: Sprite, x0: number, y0: number, key: string) {
  const out: React.ReactNode[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) { const c = row[x]; let n = 1; while (row[x + n] === c) n++; if (c !== "." && SCENE_PAL[c]) out.push(<rect key={`${key}${x}-${y}`} x={x0 + x} y={y0 + y} width={n} height={1} fill={SCENE_PAL[c]} />); x += n; }
  });
  return out;
}

export function GardenTree({ stage, wilt, gold = 0, petals = 0, label }: { stage: number; wilt: number; gold?: number; petals?: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [still, setStill] = useState(false);
  // recovery: when real activity lifts a wilt, a small happy sparkle for a moment
  const prev = useRef(wilt), [sparkle, setSparkle] = useState(false);
  useEffect(() => {
    if (prev.current > 0 && wilt === 0) { setSparkle(true); const t = window.setTimeout(() => setSparkle(false), 2600); prev.current = wilt; return () => { window.clearTimeout(t); setSparkle(false); }; }
    prev.current = wilt;
  }, [wilt]);
  useEffect(() => {
    const el = ref.current;
    const hidden = () => setStill(document.visibilityState === "hidden");
    document.addEventListener("visibilitychange", hidden);
    let io: IntersectionObserver | null = null;
    if (el && typeof IntersectionObserver !== "undefined") { io = new IntersectionObserver(([e]) => setStill(!e.isIntersecting || document.visibilityState === "hidden")); io.observe(el); }
    return () => { document.removeEventListener("visibilitychange", hidden); io?.disconnect(); };
  }, []);
  const { px, drift } = treeModel({ stage, wilt, gold, petals });
  const rects = toRects(px);
  const fill = (c: string) => `var(--kt-${c}, ${TREE_PAL[c]})`;
  return (
    <div ref={ref} className={"ktree" + (still ? " still" : "")} data-stage={stage} data-wilt={wilt}>
      <svg viewBox={`0 0 ${TREE_W} ${TREE_H}`} shapeRendering="crispEdges" role="img" aria-label={label}>
        {/* the pond and bridge to the left, lanterns either side, a few grass tufts */}
        <rect x={6} y={77} width={30} height={4} fill={fill("n")} /><rect x={6} y={81} width={30} height={1} fill={fill("X")} />
        {sprite(bridge, 12, 73, "br")}
        {sprite(lanternS, 2, 69, "l1")}{sprite(lanternS, 120, 69, "l2")}
        {[[96, 78], [104, 79], [112, 78], [40, 79]].map(([x, y]) => <rect key={x} x={x} y={y} width={1} height={2} fill={fill("M")} />)}
        <g className="ktree-sway">
          {rects.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={fill(r.c)} />)}
        </g>
        {drift.map(([x, y], i) => <rect key={"d" + i} className={"ktree-petal tp" + (i % 4)} x={x} y={y} width={1} height={1} fill={fill(i % 3 ? "p" : "P")} />)}
        {sparkle && [[50, 10], [78, 8], [92, 18]].map(([x, y], i) => <g key={"s" + i} className="ktree-spark"><rect x={x} y={y - 1} width={1} height={3} fill={fill("g")} /><rect x={x - 1} y={y} width={3} height={1} fill={fill("g")} /></g>)}
      </svg>
    </div>
  );
}
