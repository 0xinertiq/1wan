"use client";

import { useEffect, useRef, useState } from "react";
import { DECOR } from "./index";
import { DECOR_PAL } from "./types";
import { SCENES, SCENE_PAL, SCENE_SKY, SPARKLES, type SceneId, type Sprite } from "./scenes";
import { sgtHourOf } from "@/lib/court/time";

// A tab's pixel scene header: sky by Singapore time (day, dusk, night), a soft moon, sparkles, the landmark and
// its friends on a little hill. Runs of one colour merge into one rect (crisp edges). Sparkles twinkle only while
// on screen and never under reduced motion (CSS). Decorative: the page title carries the meaning.
// Round 7: the whole scene is always visible ("meet", never cropped); the sky and the hill run past the edges
// (the svg draws outside its viewBox) so a wider or taller banner shows more sky and grass, never blank bars.
const W = 160, H = 40, GROUND = 34;

function rects(rows: Sprite, x0: number, y0: number, k: number, pal: Record<string, string>, night: boolean) {
  const out: React.ReactNode[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let n = 1;
      while (row[x + n] === c) n++;
      // warm window glow at night: gold stays gold, cream windows glow too
      const fill = night && c === "o" ? pal.s : pal[c];
      if (c !== "." && fill) out.push(<rect key={`${x0}-${y0}-${x}-${y}`} x={x0 + x * k} y={y0 + y * k} width={n * k} height={k} fill={fill} />);
      x += n;
    }
  });
  return out;
}

export function Scene({ id }: { id: SceneId }) {
  const [phase, setPhase] = useState<"day" | "dusk" | "night">("day");
  const [off, setOff] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = sgtHourOf(Date.now());
    setPhase(h >= 7 && h < 17 ? "day" : h >= 17 && h < 19 ? "dusk" : "night");
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setOff(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const sc = SCENES[id], sky = SCENE_SKY[phase], night = phase !== "day";
  const moon = DECOR.moon?.rows ?? [];
  return (
    <div ref={ref} className={"kscene ph-" + phase} data-off={off ? "1" : undefined} aria-hidden="true">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges">
        {sky.map((c, i) => <rect key={c + i} x={-W * 2} y={i === 0 ? -H * 2 : i * 7} width={W * 5} height={i === 0 ? H * 2 + 7 : i === sky.length - 1 ? H : 7} fill={c} />)}
        <g opacity={night ? 1 : 0.55}>{rects(moon, 136, 1, 0.5, DECOR_PAL, false)}</g>
        {SPARKLES.map(([x, y], i) => <rect key={i} className={"ksc-tw tw" + (i % 3)} x={x} y={y} width={1} height={1} fill={night ? SCENE_PAL.g : SCENE_PAL.o} />)}
        {/* the hill: mint grass, a plum edge and scattered petals */}
        <rect x={-W * 2} y={GROUND} width={W * 5} height={H * 3} fill={night ? SCENE_PAL.v : SCENE_PAL.m} />
        <rect x={-W * 2} y={GROUND} width={W * 5} height={1} fill={SCENE_PAL.X} />
        {[8, 22, 37, 54, 101, 117, 133, 149].map((x) => <rect key={x} x={x} y={GROUND + 2 + (x % 3)} width={1} height={1} fill={SCENE_PAL.p} />)}
        {sc.pond && <><rect x={84} y={GROUND} width={32} height={4} fill={SCENE_PAL.w} /><rect x={84} y={GROUND + 4} width={32} height={1} fill={SCENE_PAL.X} /></>}
        {sc.parts.map((p, i) => {
          const k = p.scale ?? 1, h = p.s.length * k;
          return <g key={i}>{rects(p.s, p.x, p.y ?? GROUND - h, k, SCENE_PAL, night)}</g>;
        })}
      </svg>
    </div>
  );
}
