"use client";

import { PixelSprite, type SpriteName } from "@/components/PixelSprite";
import { ROOM_H, ROOM_W } from "./rooms";
import { RoomFrame, type RoomPhase } from "./RoomFrame";

// Round 15: shared helpers for the redesigned room banners (Dungeon, Life Hub, Trades, News). Each room draws on
// the same 400 x 60 grid inside the same RoomFrame as Momo's clock tower, so every banner keeps one size and the
// short-screen cap. Code-drawn pixel art: plain rects, a plum outline, palettes kept in each room's own file.
// Motion is CSS only (classes k2-*), slow and ambient, and switched off under prefers-reduced-motion.
export const PLUM = "#4a2538";   // pixel-art outline

export type Pen = {
  /** a filled rect, optionally with an animation class */
  r: (x: number, y: number, w: number, h: number, fill: string, cls?: string) => void;
  /** a filled rect with a 1px plum outline */
  box: (x: number, y: number, w: number, h: number, fill: string, cls?: string) => void;
  /** a 1px pixel line between two points (Bresenham) */
  line: (x0: number, y0: number, x1: number, y1: number, fill: string) => void;
  /** a group of shapes drawn by fn, wrapped in one <g> with an animation class */
  group: (cls: string, fn: () => void) => void;
  out: React.ReactNode[];
};

export function pen(): Pen {
  const stack: React.ReactNode[][] = [[]];
  let n = 0;
  const push = (el: React.ReactNode) => stack[stack.length - 1].push(el);
  const p: Pen = {
    out: stack[0],
    r: (x, y, w, h, fill, cls) => { if (w > 0 && h > 0) push(<rect key={n++} className={cls} x={x} y={y} width={w} height={h} fill={fill} />); },
    box: (x, y, w, h, fill, cls) => {
      if (cls) return p.group(cls, () => p.box(x, y, w, h, fill));
      p.r(x, y, w, h, PLUM); p.r(x + 1, y + 1, w - 2, h - 2, fill);
    },
    line: (x0, y0, x1, y1, fill) => {
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
      let err = dx + dy, x = x0, y = y0;
      for (let i = 0; i < 800; i++) {
        p.r(x, y, 1, 1, fill);
        if (x === x1 && y === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) { err += dy; x += sx; }
        if (e2 <= dx) { err += dx; y += sy; }
      }
    },
    group: (cls, fn) => {
      stack.push([]); fn(); const kids = stack.pop()!;
      push(<g key={n++} className={cls}>{kids}</g>);
    },
  };
  return p;
}

/** A room banner: the shared frame, the drawn art, and the tab's agent standing at (x, floor) on the grid. */
export function Room2({ id, phase, label, art, who, x, floor }: { id: string; phase: RoomPhase; label: string; art: React.ReactNode[]; who: SpriteName; x: number; floor: number }) {
  return (
    <RoomFrame phase={phase} label={label} className={"kroom-v2 kroom2-" + id}>
      <svg viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges" aria-hidden="true">{art}</svg>
      <span className="kroom-agent k2-idle" data-who={who} style={{ left: (x / ROOM_W) * 100 + "%", bottom: ((ROOM_H - floor) / ROOM_H) * 100 + "%" }}>
        <span className="kroom-px" aria-hidden="true"><PixelSprite name={who} /></span>
      </span>
    </RoomFrame>
  );
}
