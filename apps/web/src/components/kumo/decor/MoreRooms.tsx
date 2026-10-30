"use client";

import { PixelSprite, type SpriteName } from "@/components/PixelSprite";
import { FLOOR, ROOM_H, ROOM_PAL, ROOM_W, ROOM_WALL, roomLantern, roomWindow, rug, shelf } from "./rooms";
import { armchair, chartDesk, newsDesk, pinboard, plannerDesk, pottedPlant, tickerBoard, wirePrinter } from "./moreRoomsArt";
import { RoomFrame, roomRects, useRoomClock, type RoomPhase } from "./RoomFrame";
import type { Sprite } from "./scenes";

// Round 14: the Life Hub, Trades and News room banners, each with the agent the app already ties to that tab
// (Coco: life admin and the Life alerts; Fenn: the trading analyst on Trades; Pip: news and the brief alerts).
// Same RoomFrame, grid and size as Momo's clock tower and Sisi's study. Decorative.
const R: Record<string, string> = { ...ROOM_PAL, n: "#5B4570" };   // pixel-art: n = screen and slot ink
type Place = [Sprite, number, number, string];

function Room({ id, who, label, place }: { id: string; who: SpriteName; label: string; place: () => Place[] }) {
  const { phase } = useRoomClock();
  const W = ROOM_WALL[phase as RoomPhase], night = phase === "night";
  const art: React.ReactNode[] = [];
  // the same brick wall, beam and plank floor as the clock tower
  art.push(<rect key="wall" x={0} y={0} width={ROOM_W} height={FLOOR} fill={W.wall} />);
  for (let y = 6, row = 0; y < FLOOR; y += 6, row++) {
    art.push(<rect key={"m" + y} x={0} y={y} width={ROOM_W} height={1} fill={W.brick} />);
    for (let x = row % 2 ? 6 : 0; x < ROOM_W; x += 12) art.push(<rect key={`v${x}-${y}`} x={x} y={y - 5} width={1} height={5} fill={W.brick} />);
  }
  art.push(<rect key="beam" x={0} y={0} width={ROOM_W} height={3} fill={R.b} />, <rect key="beamx" x={0} y={3} width={ROOM_W} height={1} fill={R.X} />);
  art.push(<rect key="floor" x={0} y={FLOOR} width={ROOM_W} height={ROOM_H - FLOOR} fill={W.floor} />, <rect key="floorx" x={0} y={FLOOR} width={ROOM_W} height={1} fill={R.X} />);
  for (let y = FLOOR + 4; y < ROOM_H; y += 4) art.push(<rect key={"pl" + y} x={0} y={y} width={ROOM_W} height={1} fill={W.plank} />);
  for (const [s, x, y, k] of place()) {
    if (s === roomWindow) s.forEach((row, ry) => art.push(...roomRects([row], x, y + ry, { ...R, G: W.glass[Math.min(2, Math.floor(ry / 6))] }, false, `${k}-${ry}-`)));
    else art.push(...roomRects(s, x, y, R, night && s === roomLantern, k));
  }
  return (
    <RoomFrame phase={phase} label={label} className={"kroom-" + id}>
      <svg viewBox={`0 0 ${ROOM_W} ${ROOM_H}`} preserveAspectRatio="xMidYMid meet" shapeRendering="crispEdges" aria-hidden="true">{art}</svg>
      <span className="kroom-agent" data-who={who}><span className="kroom-px" aria-hidden="true"><PixelSprite name={who} /></span></span>
    </RoomFrame>
  );
}

/** Life Hub: Coco's homey planner room (desk and planner, a small plant, windows, an armchair). */
export function LifeRoom() {
  return <Room id="life" who="coco" label="Coco's planner room: scroll sideways to look around" place={() => [
    [roomWindow, 40, 10, "w1"], [roomWindow, 300, 10, "w2"], [shelf, 350, FLOOR - 24, "sh"], [rug, 126, FLOOR + 3, "rug"],
    [plannerDesk, 130, FLOOR - 12, "desk"], [pottedPlant, 228, FLOOR - 14, "pl"], [armchair, 250, FLOOR - 14, "ac"],
    [roomLantern, 110, 4, "l1"], [roomLantern, 220, 4, "l2"],
  ]} />;
}

/** Trades: Fenn's desk with chart screens and a small ticker (its up-arrow is the gold accent). */
export function TradesRoom() {
  return <Room id="trades" who="fenn" label="Fenn's trading desk: scroll sideways to look around" place={() => [
    [shelf, 30, FLOOR - 24, "sh"], [pottedPlant, 120, FLOOR - 14, "pl"], [tickerBoard, 153, 6, "tk"], [chartDesk, 150, FLOOR - 20, "desk"],
    [roomWindow, 300, 10, "w1"], [roomWindow, 340, 10, "w2"], [roomLantern, 250, 4, "l1"], [roomLantern, 90, 4, "l2"],
  ]} />;
}

/** News: Pip's newsroom with a pinboard of clippings and a wire printer. */
export function NewsRoom() {
  return <Room id="news" who="pip" label="Pip's newsroom: scroll sideways to look around" place={() => [
    [pinboard, 40, 10, "pb"], [roomWindow, 120, 10, "w1"], [roomWindow, 350, 10, "w2"], [rug, 166, FLOOR + 3, "rug"],
    [newsDesk, 170, FLOOR - 12, "desk"], [wirePrinter, 280, FLOOR - 20, "wp"], [roomLantern, 110, 4, "l1"], [roomLantern, 240, 4, "l2"],
  ]} />;
}
