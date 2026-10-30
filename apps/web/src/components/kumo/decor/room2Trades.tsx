"use client";

import { Room2, PLUM, pen } from "./roomKit";

// Round 15: the Trades banner. A pastel night trading room in periwinkle and lavender, lit by cool screen glow: a
// night window with the moon on the left, a wide desk across the middle under a wall of eight screens showing
// abstract candle shapes (decorative only: no prices, symbols or numbers), and a scrolling ticker strip of plain
// shapes whose gold rails are the one gold accent. Fenn stands at the desk. Motion: the ticker scrolls, a few
// candles blink.
const C = {   // pixel-art palette (this room only)
  wall: "#8C90D4", wallD: "#7B7FC6", wains: "#6E72B8", floor: "#5E5F9E", floorL: "#53548F", night: "#3A3B78", star: "#FFF6E3",
  moon: "#FFF3C9", moonD: "#F1DFA3", bezel: "#3E3F78", screen: "#2E3166", glow: "#BFE8FF", up: "#9BE3C0", down: "#F7A8CC",
  wick: "#CDBFFB", desk: "#CDBFFB", deskD: "#A99BE0", gold: "#FFD95E", tick: ["#CDBFFB", "#BFE8FF", "#E7DEFF"], lamp: "#E7DEFF", plant: "#9BD8AE",
};
const FLOOR = 50;
// abstract candle shapes per screen: [height, up?], repeated with an offset so screens differ
const CANDLES: [number, boolean][] = [[5, true], [3, false], [6, true], [4, true], [2, false], [5, false], [7, true], [3, true], [4, false], [6, true]];

function art() {
  const p = pen();
  p.r(0, 0, 400, FLOOR, C.wall);
  for (let x = 0; x < 400; x += 20) p.r(x, 0, 1, 34, C.wallD);
  p.r(0, 34, 400, FLOOR - 34, C.wains); p.r(0, 34, 400, 1, PLUM);
  p.r(0, FLOOR, 400, 60 - FLOOR, C.floor); p.r(0, FLOOR, 400, 1, PLUM);
  for (let y = FLOOR + 3; y < 60; y += 3) p.r(0, y, 400, 1, C.floorL);
  // the night window with the moon and stars
  p.box(16, 6, 56, 26, C.night);
  for (const [x, y] of [[22, 10], [34, 14], [60, 9], [28, 24], [52, 20], [66, 26], [44, 8]] as const) p.r(x, y, 1, 1, C.star, (x + y) % 3 ? undefined : "k2-blink");
  p.r(48, 11, 8, 8, C.moon); p.r(47, 12, 10, 6, C.moon); p.r(52, 12, 3, 3, C.moonD);
  p.r(43, 7, 2, 24, PLUM); p.r(17, 19, 54, 1, PLUM);
  // the gold-railed ticker strip (plain shapes scrolling; the rails are the gold accent)
  p.r(104, 2, 212, 1, C.gold); p.r(104, 8, 212, 1, C.gold); p.r(104, 3, 212, 5, C.bezel);
  p.out.push(
    <svg key="ticker" x={105} y={3} width={210} height={5} viewBox="0 0 210 5" overflow="hidden">
      <g className="k2-ticker">{Array.from({ length: 14 }, (_, i) => <rect key={i} x={i * 20 + 2} y={1} width={6 + (i % 3) * 3} height={3} fill={C.tick[i % 3]} />)}</g>
    </svg>,
  );
  // the screen wall: two rows of four, abstract candles (a few blink)
  for (let row = 0; row < 2; row++) for (let col = 0; col < 4; col++) {
    const x = 108 + col * 51, y = 11 + row * 15, s = row * 4 + col;
    p.box(x, y, 48, 13, C.bezel); p.r(x + 2, y + 2, 44, 9, C.screen);
    for (let i = 0; i < 9; i++) {
      const [h, up] = CANDLES[(i + s * 3) % CANDLES.length], cx = x + 4 + i * 5, base = y + 9 - ((i + s) % 3);
      p.r(cx + 1, base - h - 1, 1, h + 2, C.wick);
      p.r(cx, base - h, 3, h, up ? C.up : C.down, (i + s) % 7 === 0 ? "k2-blink" : undefined);
    }
  }
  // the wide desk under the screens, with soft screen glow on its top
  p.r(100, 39, 220, 3, C.glow, "k2-glowsoft");
  p.box(96, 41, 228, 4, C.desk); p.r(97, 43, 226, 1, C.deskD);
  for (const x of [100, 316]) { p.r(x, 45, 4, FLOOR - 45, C.deskD); p.r(x, FLOOR - 1, 4, 1, PLUM); }
  p.box(150, 39, 30, 2, C.lamp); p.box(236, 39, 10, 2, C.tick[1]);
  // a tall lamp and a little plant on the right
  p.r(352, 10, 1, 38, PLUM); p.box(344, 6, 17, 6, C.lamp); p.r(346, 12, 13, 1, C.glow); p.box(347, 47, 11, 3, C.deskD);
  p.box(374, 38, 12, 12, C.deskD); for (const [x, y] of [[376, 30], [380, 27], [372, 33], [382, 33]] as const) p.box(x, y, 6, 5, C.plant);
  return p.out;
}

export function TradesNight() {
  return <Room2 id="trades" phase="night" label="Fenn's night trading desk: scroll sideways to look around" art={art()} who="fenn" x={196} floor={51} />;
}
