"use client";

import { useEffect, useRef, useState } from "react";
import { clock, sgtHourOf } from "@/lib/court/time";
import type { Sprite } from "./scenes";

// The room banner frame (round 13, shared by Momo's clock tower and Sisi's study): one size for every room
// (.kroom), wider than the screen inside. Drag it with the mouse, swipe it on touch, use the arrow buttons or the
// keyboard arrows when focused. On short desktop screens every room banner gets the same capped height (so the
// Dungeon still fits one screen); the art then fills the width and trims a little from its top and bottom.

/** Sprite rows to SVG rects (o glows gold at night when glow is set). */
export function roomRects(rows: Sprite, x0: number, y0: number, pal: Record<string, string>, glow: boolean, keyp: string) {
  const out: React.ReactNode[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let n = 1;
      while (row[x + n] === c) n++;
      const fill = glow && c === "o" ? pal.g : pal[c];
      if (c !== "." && fill) out.push(<rect key={`${keyp}${x}-${y}`} x={x0 + x} y={y0 + y} width={n} height={1} fill={fill} />);
      x += n;
    }
  });
  return out;
}

export type RoomPhase = "day" | "dusk" | "night";
/** Day, dusk or night by Singapore time, and the hour and minute (checked once a minute). */
export function useRoomClock() {
  const [phase, setPhase] = useState<RoomPhase>("day");
  const [hm, setHm] = useState<[number, number]>([9, 0]);
  useEffect(() => {
    const set = () => {
      const h = sgtHourOf(Date.now()), [hh, mm] = clock(Date.now()).split(":").map(Number);
      setPhase(h >= 7 && h < 17 ? "day" : h >= 17 && h < 19 ? "dusk" : "night");
      setHm([hh || 0, mm || 0]);
    };
    set();
    const t = window.setInterval(set, 60e3);
    return () => window.clearInterval(t);
  }, []);
  return { phase, hm };
}

export function RoomFrame({ phase, label, children, className = "" }: { phase: RoomPhase; label: string; children: React.ReactNode; className?: string }) {
  const [edge, setEdge] = useState<{ l: boolean; r: boolean }>({ l: false, r: true });
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; s: number; id: number } | null>(null);
  const look = () => { const el = box.current; if (el) setEdge({ l: el.scrollLeft > 4, r: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 }); };
  useEffect(() => { look(); window.addEventListener("resize", look); return () => window.removeEventListener("resize", look); }, []);
  const nudge = (dir: 1 | -1) => box.current?.scrollBy({ left: dir * box.current.clientWidth * 0.6, behavior: "smooth" });
  return (
    <div className={("kroom ph-" + phase + " " + className).trim()}>
      <div
        ref={box}
        className="kroom-scroll"
        tabIndex={0}
        role="region"
        aria-label={label}
        onScroll={look}
        onPointerDown={(e) => { if (e.pointerType !== "mouse" || (e.target as HTMLElement).closest("button")) return; drag.current = { x: e.clientX, s: box.current?.scrollLeft ?? 0, id: e.pointerId }; box.current?.setPointerCapture(e.pointerId); box.current?.classList.add("drag"); }}
        onPointerMove={(e) => { const d = drag.current; if (d && box.current) box.current.scrollLeft = d.s - (e.clientX - d.x); }}
        onPointerUp={() => { drag.current = null; box.current?.classList.remove("drag"); }}
        onPointerCancel={() => { drag.current = null; box.current?.classList.remove("drag"); }}
      >
        <div className="kroom-inner"><div className="kroom-art">{children}</div></div>
      </div>
      {edge.l && <button type="button" className="kroom-hint l" aria-label="Look left" onClick={() => nudge(-1)}>‹</button>}
      {edge.r && <button type="button" className="kroom-hint r" aria-label="Look right" onClick={() => nudge(1)}>›</button>}
    </div>
  );
}
