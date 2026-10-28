"use client";

import { DECOR } from "./index";
import { DECOR_PAL } from "./types";
import { SCENE_PAL, bridge, flower, heart, lanternS, type Sprite } from "./scenes";

// The Garden's pixel sakura garden (round 6): a big sakura on a mossy hill by a pond with a little bridge,
// lanterns, flowers and hearts. Code-drawn pixel art only. The tree grows through stages 0 to 4 from her habit
// progress this week (cosmetic); when the garden is thirsty it droops a little and recovers with any activity.
// Nothing is ever lost or removed. Still image: no animation beyond a gentle CSS droop, off under reduced motion.
const W = 96, H = 48, G = 40;

function rects(rows: Sprite, x0: number, y0: number, pal: Record<string, string>, k = 1) {
  const out: React.ReactNode[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let n = 1;
      while (row[x + n] === c) n++;
      if (c !== "." && pal[c]) out.push(<rect key={`${x0}-${y0}-${x}-${y}`} x={x0 + x * k} y={y0 + y * k} width={n * k} height={k} fill={pal[c]} />);
      x += n;
    }
  });
  return out;
}

export function GardenPixel({ stage, wilt, label }: { stage: number; wilt: boolean; label: string }) {
  const s = Math.max(0, Math.min(4, Math.round(stage)));
  const tree = DECOR["sakura_" + s]?.rows ?? [];
  return (
    <div className={"kgarden" + (wilt ? " wilt" : "")}>
      <svg viewBox={`0 0 ${W} ${H}`} shapeRendering="crispEdges" role="img" aria-label={label}>
        {/* pastel dusk sky in bands, pixel-art */}
        {["#FBE3F1", "#F4DDF6", "#EBDDFB", "#E3E0FF"].map((c, i) => <rect key={c} x={0} y={i * 10} width={W} height={10} fill={c} />)}
        <rect x={78} y={4} width={6} height={6} fill={SCENE_PAL.o} /><rect x={79} y={3} width={4} height={8} fill={SCENE_PAL.o} />
        {[[10, 6], [30, 3], [60, 8], [88, 14]].map(([x, y]) => <rect key={x} x={x} y={y} width={1} height={1} fill={SCENE_PAL.g} />)}
        <rect x={0} y={G} width={W} height={H - G} fill={SCENE_PAL.m} />
        <rect x={0} y={G} width={W} height={1} fill={SCENE_PAL.X} />
        <rect x={56} y={G + 1} width={28} height={5} fill={SCENE_PAL.w} />
        <rect x={56} y={G + 6} width={28} height={1} fill={SCENE_PAL.X} />
        {rects(bridge, 60, G - 3, SCENE_PAL)}
        {rects(lanternS, 6, G - 7, SCENE_PAL)}
        {rects(lanternS, 88, G - 7, SCENE_PAL)}
        {rects(flower, 16, G - 4, SCENE_PAL)}
        {rects(flower, 48, G - 4, SCENE_PAL)}
        {s >= 3 && rects(heart, 50, 10, SCENE_PAL)}
        {s >= 4 && rects(heart, 70, 16, SCENE_PAL)}
        <g className="tree">{rects(tree, 18, G - 31, DECOR_PAL)}</g>
      </svg>
    </div>
  );
}
