"use client";

import { Room2, PLUM, pen } from "./roomKit";

// Round 15: the News banner. An early-dawn newsroom in peach and soft coral: a big cork pinboard on the left with
// clippings (abstract strokes, nothing readable) joined by plum string, one gold pin (the gold accent), a desk with
// a teacup and a paper stack, a wire printer feeding paper onto a curled pile, and a sunrise window on the right.
// Pip stands between the desk and the printer. Motion: paper feeds slowly out of the printer; the sunrise glow
// shifts a little.
const C = {   // pixel-art palette (this room only)
  wall: "#FFE3D3", wallL: "#FFD0BD", trim: "#FF9F8A", floor: "#E8B7A0", floorL: "#D9A08A", cork: "#D9A07A", corkD: "#C68A66",
  frame: "#B97A5E", paper: "#FFFBF5", ink: "#E3C9C0", pin: "#FF8F7A", gold: "#FFD95E", desk: "#F2C1A8", deskD: "#DDA58A",
  cup: "#FFFBF5", tea: "#E8A877", printer: "#F7C6B5", printerD: "#E5A894", slot: "#8E5A66", led: "#9BE3C0",
  sky: ["#FFC2B0", "#FFD3A8", "#FFE6B8"], sun: "#FFB38A", glow: "#FFE0B0",
};
const FLOOR = 50;
// clippings on the board: x, y, w, h; and where each pin sits (string joins pins in order 0-2-4-1, 3-5)
const CLIPS = [[20, 9, 22, 12], [48, 8, 20, 10], [74, 10, 24, 14], [22, 25, 18, 10], [46, 22, 26, 13], [80, 28, 20, 9]] as const;
const pinAt = (i: number) => [CLIPS[i][0] + Math.floor(CLIPS[i][2] / 2), CLIPS[i][1] + 1] as const;

function art() {
  const p = pen();
  p.r(0, 0, 400, FLOOR, C.wall); p.r(0, 32, 400, FLOOR - 32, C.wallL); p.r(0, 32, 400, 1, C.trim); p.r(0, 33, 400, 1, PLUM);
  p.r(0, FLOOR, 400, 60 - FLOOR, C.floor); p.r(0, FLOOR, 400, 1, PLUM);
  for (let x = 4; x < 400; x += 11) p.r(x, FLOOR + 1, 1, 60 - FLOOR - 1, C.floorL);
  // the cork pinboard with clippings, plum string between pins, one gold pin
  p.box(14, 4, 92, 38, C.frame); p.r(16, 6, 88, 34, C.cork);
  for (let y = 8; y < 40; y += 4) for (let x = 18 + (y % 8); x < 104; x += 8) p.r(x, y, 1, 1, C.corkD);
  for (const [x, y, w, h] of CLIPS) { p.box(x, y, w, h, C.paper); for (let yy = y + 3; yy < y + h - 1; yy += 2) p.r(x + 2, yy, w - 4 - ((yy + x) % 5), 1, C.ink); }
  for (const [a, b] of [[0, 2], [2, 4], [4, 1], [3, 5]] as const) { const [x0, y0] = pinAt(a), [x1, y1] = pinAt(b); p.line(x0, y0, x1, y1, PLUM); }
  CLIPS.forEach((_, i) => { const [x, y] = pinAt(i); p.r(x - 1, y - 1, 3, 3, i === 2 ? C.gold : C.pin); });
  // the desk with a paper stack and a teacup
  p.box(140, 40, 74, 4, C.desk); p.r(141, 42, 72, 1, C.deskD);
  for (const x of [143, 207]) { p.r(x, 44, 4, FLOOR - 44, C.deskD); p.r(x, FLOOR - 1, 4, 1, PLUM); }
  for (let i = 0; i < 4; i++) p.box(150 + (i % 2), 36 - i * 1, 22, 2, C.paper);
  p.box(188, 35, 8, 6, C.cup); p.r(190, 36, 4, 1, C.tea); p.r(196, 36, 2, 3, PLUM); p.box(186, 40, 12, 1, C.trim);
  // the wire printer on its stand, paper feeding out of the slot onto a curled pile
  p.box(246, 28, 34, 12, C.printer); p.r(247, 38, 32, 1, C.printerD); p.r(250, 31, 26, 2, C.slot); p.r(274, 35, 2, 2, C.led, "k2-blink");
  p.box(250, 40, 26, 3, C.printerD); for (const x of [252, 271]) p.r(x, 43, 3, FLOOR - 43, C.printerD);
  p.group("k2-feed", () => { p.box(253, 20, 20, 12, C.paper); for (let yy = 23; yy < 31; yy += 2) p.r(255, yy, 14 - (yy % 4), 1, C.ink); });
  for (const [x, y, w] of [[282, 46, 16], [284, 44, 14], [286, 42, 10]] as const) p.box(x, y, w, 3, C.paper);
  // the sunrise window: dawn bands, a half sun, and a soft glow that shifts
  p.box(318, 4, 66, 30, C.frame);
  C.sky.forEach((c, i) => p.r(320, 6 + i * 9, 62, 9, c));
  p.group("k2-glow", () => { p.r(334, 22, 34, 10, C.glow); p.r(340, 18, 22, 4, C.glow); });
  p.r(343, 26, 16, 6, C.sun); p.r(346, 23, 10, 3, C.sun);
  p.r(350, 5, 2, 28, C.frame); p.r(319, 19, 64, 2, C.frame); p.r(316, 34, 70, 2, C.trim);
  return p.out;
}

export function NewsDawn() {
  return <Room2 id="news" phase="day" label="Pip's dawn newsroom: scroll sideways to look around" art={art()} who="pip" x={220} floor={52} />;
}
