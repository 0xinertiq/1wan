"use client";

import { useEffect, useRef, useState } from "react";
import { PixelSprite } from "@/components/PixelSprite";
import { AlertMark } from "@/components/court/Alerts";
import { clock, sgtHourOf } from "@/lib/court/time";
import { FLOOR, ROOM_H, ROOM_PAL, ROOM_W, ROOM_WALL, clockFace, gear, momoDesk, roomLantern, roomWindow, rug, shelf, stair, wallCal } from "./rooms";
import { lanternS, type Sprite } from "./scenes";

// The Calendar's room banner (round 7 pilot): the inside of the clock tower with Momo at her desk. Wider than the
// screen: drag it with the mouse, swipe it on touch, use the arrow buttons or the keyboard arrows when focused.
// A little taller than the other banners. Decorative except Momo's alert "!", which is a real button.

function rects(rows: Sprite, x0: number, y0: number, pal: Record<string, string>, glow: boolean, keyp: string) {
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

export function ClockRoom() {
  const [phase, setPhase] = useState<"day" | "dusk" | "night">("day");
  const [hm, setHm] = useState<[number, number]>([9, 0]);
  const [edge, setEdge] = useState<{ l: boolean; r: boolean }>({ l: false, r: true });
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; s: number; id: number } | null>(null);
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
  const look = () => { const el = box.current; if (el) setEdge({ l: el.scrollLeft > 4, r: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 }); };
  useEffect(() => { look(); window.addEventListener("resize", look); return () => window.removeEventListener("resize", look); }, []);
  const nudge = (dir: 1 | -1) => box.current?.scrollBy({ left: dir * box.current.clientWidth * 0.6, behavior: "smooth" });

  const W = ROOM_WALL[phase], night = phase === "night", R = ROOM_PAL;
  const art: React.ReactNode[] = [];
  // wall with staggered bricks, the ceiling beam, the plank floor
  art.push(<rect key="wall" x={0} y={0} width={ROOM_W} height={FLOOR} fill={W.wall} />);
  for (let y = 6, row = 0; y < FLOOR; y += 6, row++) {
    art.push(<rect key={"m" + y} x={0} y={y} width={ROOM_W} height={1} fill={W.brick} />);
    for (let x = row % 2 ? 6 : 0; x < ROOM_W; x += 12) art.push(<rect key={`v${x}-${y}`} x={x} y={y - 5} width={1} height={5} fill={W.brick} />);
  }
  art.push(<rect key="beam" x={0} y={0} width={ROOM_W} height={3} fill={R.b} />, <rect key="beamx" x={0} y={3} width={ROOM_W} height={1} fill={R.X} />);
  art.push(<rect key="floor" x={0} y={FLOOR} width={ROOM_W} height={ROOM_H - FLOOR} fill={W.floor} />, <rect key="floorx" x={0} y={FLOOR} width={ROOM_W} height={1} fill={R.X} />);
  for (let y = FLOOR + 4; y < ROOM_H; y += 4) art.push(<rect key={"pl" + y} x={0} y={y} width={ROOM_W} height={1} fill={W.plank} />);
  // arched windows onto the sky
  for (const x of [22, 128, 258, 368]) {
    roomWindow.forEach((row, y) => { const band = W.glass[Math.min(2, Math.floor(y / 6))]; art.push(...rects([row.replace(/G/g, "G")], x, 10 + y, { ...R, G: band }, false, `w${x}-${y}-`)); });
    if (night) art.push(<rect key={"st" + x} x={x + 3} y={13} width={1} height={1} fill={R.g} />);
  }
  // the bookshelf, the wall calendar, Momo's desk and rug
  art.push(...rects(shelf, 44, FLOOR - 24, R, false, "sh"));
  art.push(...rects(wallCal, 92, 14, R, false, "cal"));
  art.push(...rects(rug, 78, FLOOR + 3, R, false, "rug"));
  art.push(...rects(momoDesk, 84, FLOOR - 12, R, night, "desk"));
  // the great clock with gears behind it and the pendulum (the gold accent)
  art.push(...rects(gear, 168, 8, R, false, "g1"), ...rects(gear, 214, 22, R, false, "g2"), ...rects(gear, 160, 26, R, false, "g3"));
  art.push(...rects(["...XXX...", "..XgggX..", "XXXXXXXXX"], 186, 4, R, false, "crown"));
  art.push(...rects(clockFace(hm[0], hm[1]), 178, 6, R, false, "face"));
  art.push(
    <g key="pend" className="kroom-pend">
      <rect x={190} y={31} width={1} height={11} fill={R.X} />
      {rects([".XXX.", "XgggX", "XgggX", ".XXX."], 188, 41, R, false, "bob")}
    </g>,
  );
  // the stair up to the bells, lanterns from the beam
  art.push(...rects(stair, 300, FLOOR - 30, R, false, "stair"));
  for (const x of [112, 246, 350]) art.push(...rects(roomLantern, x, 4, R, night, "ln" + x));
  art.push(...rects(lanternS, 30, FLOOR - 7, R, night, "lsf"));

  return (
    <div className={"kroom ph-" + phase}>
      <div
        ref={box}
        className="kroom-scroll"
        tabIndex={0}
        role="region"
        aria-label="Momo's clock tower: scroll sideways to look around"
        onScroll={look}
        onPointerDown={(e) => { if (e.pointerType !== "mouse" || (e.target as HTMLElement).closest("button")) return; drag.current = { x: e.clientX, s: box.current?.scrollLeft ?? 0, id: e.pointerId }; box.current?.setPointerCapture(e.pointerId); box.current?.classList.add("drag"); }}
        onPointerMove={(e) => { const d = drag.current; if (d && box.current) box.current.scrollLeft = d.s - (e.clientX - d.x); }}
        onPointerUp={() => { drag.current = null; box.current?.classList.remove("drag"); }}
        onPointerCancel={() => { drag.current = null; box.current?.classList.remove("drag"); }}
      >
        <div className="kroom-inner">
          <svg viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges" aria-hidden="true">{art}</svg>
          <span className="kroom-momo">
            <span className="kroom-px" aria-hidden="true"><PixelSprite name="momo" /></span>
            <span className="kroom-alert"><AlertMark agent="momo" /></span>
          </span>
        </div>
      </div>
      {edge.l && <button type="button" className="kroom-hint l" aria-label="Look left" onClick={() => nudge(-1)}>‹</button>}
      {edge.r && <button type="button" className="kroom-hint r" aria-label="Look right" onClick={() => nudge(1)}>›</button>}
    </div>
  );
}
