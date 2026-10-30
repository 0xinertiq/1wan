"use client";

import { Room2, PLUM, pen } from "./roomKit";

// Round 15: the Life Hub banner. A sunny morning home room in mint and butter yellow, drawn flat-on: a big window on
// the left with sunbeams falling across the floor (dust motes drifting in them), a tall potted plant that sways, a
// wall planner and a small wall calendar (its gold "today" square is the one gold accent), a stack of boxes with
// coloured label tags (no words), and a cushioned window-seat corner on the right where Coco sits.
const C = {   // pixel-art palette (this room only)
  wall: "#FFF6D6", wallDot: "#FBEBB8", wains: "#DDF5EC", trim: "#9BD8AE", floor: "#F3DDB8", plank: "#E5C99C",
  sky: "#CFEFFF", sky2: "#E6F7FF", sun: "#FFF2A8", frame: "#FFFFFF", curtain: "#BDEBD4", curtainD: "#9BD8AE",
  beam: "#FFF9D6", mote: "#FFFFFF", leaf: "#7CC49D", leafHi: "#A8E0BC", pot: "#F7B89A", potD: "#E59A7C",
  paper: "#FFFDF5", grid: "#C9F0D6", block: ["#FFD8A8", "#C9B6E4", "#BDEBD4", "#F7C6D9"], gold: "#FFD95E",
  box: "#E9C9A0", boxD: "#D4AE80", tags: ["#BDEBD4", "#FFD8A8", "#C9B6E4"], seat: "#BDEBD4", cush: ["#FFE89A", "#F7C6D9", "#C9F0D6"],
};
const FLOOR = 48;

function art() {
  const p = pen();
  p.r(0, 0, 400, FLOOR, C.wall);
  for (let y = 4; y < 32; y += 6) for (let x = (y % 12 ? 3 : 9); x < 400; x += 12) p.r(x, y, 1, 1, C.wallDot);
  p.r(0, 34, 400, FLOOR - 34, C.wains); p.r(0, 33, 400, 1, C.trim); p.r(0, 34, 400, 1, PLUM);
  for (let x = 6; x < 400; x += 16) p.r(x, 36, 1, FLOOR - 37, C.trim);
  p.r(0, FLOOR, 400, 60 - FLOOR, C.floor); p.r(0, FLOOR, 400, 1, PLUM);
  for (let y = FLOOR + 4; y < 60; y += 4) p.r(0, y, 400, 1, C.plank);
  // the big window, morning sky and the sun in its corner, curtains tied back
  p.box(40, 6, 70, 30, C.frame); p.r(42, 8, 66, 26, C.sky); p.r(42, 8, 66, 8, C.sky2);
  p.r(94, 10, 8, 6, C.sun); p.r(96, 9, 4, 8, C.sun);
  p.r(74, 7, 2, 28, C.frame); p.r(41, 20, 68, 2, C.frame);
  for (const [x, w] of [[34, 10], [106, 10]] as const) { p.box(x, 4, w, 34, C.curtain); p.r(x + 3, 6, 1, 30, C.curtainD); p.r(x, 22, w, 2, C.trim); }
  p.r(32, 3, 86, 2, PLUM);
  // sunbeams falling to the floor on the right of the window (translucent), dust motes drifting in them
  p.group("k2-beam", () => { for (let i = 0; i < 12; i++) p.r(64 + i * 7, 48 + i, 34, 1, C.beam); });
  for (const [x, y, d] of [[84, 44, ""], [106, 40, " b"], [128, 50, " c"], [96, 53, " b"], [140, 56, ""]] as const) p.r(x, y, 1, 1, C.mote, "k2-mote" + d);
  // the tall potted plant (sways from its pot)
  p.group("k2-sway", () => {
    p.r(126, 20, 1, 16, PLUM);
    for (const [x, y, w] of [[118, 18, 8], [127, 14, 9], [116, 25, 10], [127, 22, 10], [119, 31, 8], [127, 29, 8]] as const) { p.box(x, y, w, 5, C.leaf); p.r(x + 2, y + 2, w - 4, 1, C.leafHi); }
  });
  p.box(119, 36, 16, 12, C.pot); p.r(119, 36, 16, 2, C.potD); p.r(118, 35, 18, 1, PLUM);
  // the wall planner (a week grid of coloured blocks, no words) and the small wall calendar (gold "today")
  p.box(160, 8, 44, 22, C.paper); p.r(160, 8, 44, 4, C.trim); p.r(160, 12, 44, 1, PLUM);
  for (let c = 1; c < 7; c++) p.r(160 + c * 6 + 2, 13, 1, 16, C.grid);
  for (const [cx, cy, w, i] of [[163, 15, 5, 0], [170, 19, 10, 1], [182, 15, 4, 2], [188, 23, 8, 3], [163, 25, 9, 2], [195, 17, 6, 0]] as const) p.r(cx, cy, w, 2, C.block[i]);
  p.box(212, 10, 20, 18, C.paper); p.r(212, 10, 20, 4, C.cush[1]); p.r(212, 14, 20, 1, PLUM); p.r(217, 8, 1, 3, PLUM); p.r(226, 8, 1, 3, PLUM);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) p.r(214 + c * 4, 16 + r * 4, 2, 2, r === 1 && c === 2 ? C.gold : C.grid);
  // a stack of boxes with coloured label tags
  for (const [x, y, w, h, t] of [[252, 36, 22, 12, 0], [256, 26, 16, 10, 1], [276, 40, 14, 8, 2]] as const) {
    p.box(x, y, w, h, C.box); p.r(x + 1, y + 1, w - 2, 1, C.boxD); p.box(x + w / 2 - 3, y + h / 2 - 1, 7, 4, C.tags[t]);
  }
  // the cushioned window-seat corner on the right
  p.box(306, 38, 90, 10, C.seat); p.r(307, 44, 88, 1, C.trim);
  for (const [x, i] of [[310, 0], [362, 1], [378, 2]] as const) { p.box(x, 31, 14, 8, C.cush[i]); p.r(x + 3, 34, 8, 1, C.wall); }
  p.box(320, 8, 50, 22, C.frame); p.r(322, 10, 46, 18, C.sky); p.r(344, 9, 2, 20, C.frame);
  return p.out;
}

export function LifeMorning() {
  return <Room2 id="life" phase="day" label="Coco's sunny morning room: scroll sideways to look around" art={art()} who="coco" x={334} floor={39} />;
}
