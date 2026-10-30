"use client";

import { PixelSprite } from "@/components/PixelSprite";
import { AlertMark } from "@/components/court/Alerts";
import { RoomFrame, roomRects, useRoomClock } from "./RoomFrame";
import { FLOOR, ROOM_H, ROOM_PAL, ROOM_W, ROOM_WALL, clockFace, gear, momoDesk, roomLantern, roomWindow, rug, shelf, stair, wallCal } from "./rooms";
import { lanternS } from "./scenes";

// The Calendar's room banner (round 7 pilot): the inside of the clock tower with Momo at her desk. Wider than the
// screen (the shared RoomFrame, round 13). Decorative except Momo's alert "!", which is a real button.

const rects = roomRects;

export function ClockRoom() {
  const { phase, hm } = useRoomClock();
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
    <RoomFrame phase={phase} label="Momo's clock tower: scroll sideways to look around">
      <svg viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges" aria-hidden="true">{art}</svg>
      <span className="kroom-momo">
        <span className="kroom-px" aria-hidden="true"><PixelSprite name="momo" /></span>
        <span className="kroom-alert"><AlertMark agent="momo" /></span>
      </span>
    </RoomFrame>
  );
}
