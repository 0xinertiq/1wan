"use client";

import { PixelSprite } from "@/components/PixelSprite";
import { FLOOR, ROOM_H, ROOM_W, rug, shelf } from "./rooms";
import { DUN_PAL, DUN_WALL, archWindow, candelabra, jarShelf, sconce, sisiDesk } from "./dungeonArt";
import { RoomFrame, roomRects, useRoomClock } from "./RoomFrame";

// The Dungeon's room banner (round 13, the second room after the clock tower): a cosy stone study, candles,
// bookshelves, a desk with her journal, and Sisi at it. Same frame and size as Momo's clock tower. Decorative.
const R = DUN_PAL;

export function DungeonRoom() {
  const { phase } = useRoomClock();
  const W = DUN_WALL[phase];
  const art: React.ReactNode[] = [];
  // stone wall in staggered blocks, the vault beam, flagstone floor
  art.push(<rect key="wall" x={0} y={0} width={ROOM_W} height={FLOOR} fill={W.wall} />);
  for (let y = 8, row = 0; y < FLOOR; y += 8, row++) {
    art.push(<rect key={"m" + y} x={0} y={y} width={ROOM_W} height={1} fill={W.stone} />);
    for (let x = row % 2 ? 8 : 0; x < ROOM_W; x += 16) art.push(<rect key={`v${x}-${y}`} x={x} y={y - 7} width={1} height={7} fill={W.stone} />);
  }
  art.push(<rect key="beam" x={0} y={0} width={ROOM_W} height={3} fill={R.b} />, <rect key="beamx" x={0} y={3} width={ROOM_W} height={1} fill={R.X} />);
  art.push(<rect key="floor" x={0} y={FLOOR} width={ROOM_W} height={ROOM_H - FLOOR} fill={W.floor} />, <rect key="floorx" x={0} y={FLOOR} width={ROOM_W} height={1} fill={R.X} />);
  for (let x = 6; x < ROOM_W; x += 14) art.push(<rect key={"fl" + x} x={x} y={FLOOR + 1} width={1} height={ROOM_H - FLOOR - 1} fill={W.flag} />);
  art.push(<rect key="fly" x={0} y={FLOOR + 6} width={ROOM_W} height={1} fill={W.flag} />);
  // arched windows high in the stone
  for (const x of [118, 262]) archWindow.forEach((row, y) => art.push(...roomRects([row], x, 8 + y, { ...R, G: W.glass[Math.min(2, Math.floor(y / 6))] }, false, `aw${x}-${y}-`)));
  // bookshelves either side, the jar shelf, Sisi's desk on the rug, sconces and a candelabra
  art.push(...roomRects(shelf, 26, FLOOR - 24, R, false, "sh1"), ...roomRects(shelf, 350, FLOOR - 24, R, false, "sh2"));
  art.push(...roomRects(jarShelf, 300, 14, R, false, "jars"));
  art.push(...roomRects(rug, 150, FLOOR + 3, R, false, "rug"));
  art.push(...roomRects(sisiDesk, 150, FLOOR - 12, R, false, "desk"));
  for (const x of [70, 212, 334]) art.push(...roomRects(sconce, x, 16, R, false, "sc" + x));
  art.push(...roomRects(candelabra, 92, FLOOR - 22, R, false, "cb"));
  // a soft flicker over each flame (paused under reduced motion)
  for (const [x, y] of [[72, 16], [214, 16], [336, 16], [97, FLOOR - 22], [177, FLOOR - 12]]) art.push(<rect key={"fx" + x} className="kdun-flame" x={x} y={y} width={1} height={1} fill={R.o} />);

  return (
    <RoomFrame phase={phase} label="Sisi's study: scroll sideways to look around" className="kroom-dun">
      <svg viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges" aria-hidden="true">{art}</svg>
      <span className="kroom-sisi"><span className="kroom-px" aria-hidden="true"><PixelSprite name="sisi" /></span></span>
    </RoomFrame>
  );
}
