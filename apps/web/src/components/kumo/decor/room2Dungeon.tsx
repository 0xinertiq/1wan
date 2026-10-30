"use client";

import { Room2, PLUM, pen } from "./roomKit";

// Round 15: the Dungeon banner. A deep, torchlit stone study in warm amber with plum shadows, drawn in one-point
// perspective (the floor runs to the walls; plum diagonals mark the corners): side walls, a vaulted back wall with an arched doorway, a bookshelf wall on the left, two hanging
// lanterns, wall torches, a perspective rug, and Sisi at her writing desk on the right with her open journal (the
// journal's ribbon is the one gold accent). Motion: candle, torch and lantern flicker.
const C = {   // pixel-art palette (this room only)
  vault: "#5A3A57", sideFloor: "#6E5062", side: "#8E6B88", sideM: "#7A5875", back: "#C9A29B", backM: "#AE8589", floor: "#7D5C6E", floorL: "#6B4C5E",
  door: "#3E2A3E", doorGlow: "#E8A877", amber: "#FFC98A", amberHi: "#FFE7B8", flame: "#FFB066", cream: "#FFF6E3",
  rug: "#D98FA6", rug2: "#F2C1CF", wood: "#9B6B5A", woodHi: "#C08A73", gold: "#FFD95E", iron: "#6B4C5E",
  books: ["#E8B4C8", "#C9B6E4", "#F3D19C", "#B8D8C8", "#E6A7A0", "#F6C9A8"],
};
const BACK_L = 112, BACK_R = 288, BACK_FLOOR = 44;

function art() {
  const p = pen();
  // the vaulted ceiling and the back wall, lit amber
  p.r(0, 0, 400, 60, C.vault);
  p.r(BACK_L, 4, BACK_R - BACK_L, BACK_FLOOR - 4, C.back);
  for (let y = 10, row = 0; y < BACK_FLOOR; y += 7, row++) {
    p.r(BACK_L, y, BACK_R - BACK_L, 1, C.backM);
    for (let x = BACK_L + (row % 2 ? 7 : 0); x < BACK_R; x += 14) p.r(x, y - 6, 1, 6, C.backM);
  }
  for (let x = BACK_L; x < BACK_R; x += 22) p.r(x, 4, 2, 3, C.backM);   // the vault ribs
  // side walls narrowing towards the back, and the floor widening towards us
  for (let y = 0; y < 60; y++) {
    const inset = Math.max(0, Math.round((y - BACK_FLOOR) * 7));
    if (y < BACK_FLOOR) { p.r(0, y, BACK_L, 1, C.side); p.r(BACK_R, y, 400 - BACK_R, 1, C.side); }
    else { p.r(0, y, 400, 1, C.sideFloor); p.r(BACK_L - inset, y, BACK_R - BACK_L + 2 * inset, 1, C.floor); p.r(BACK_L - inset - 1, y, 1, 1, PLUM); p.r(BACK_R + inset, y, 1, 1, PLUM); }
  }
  for (let y = 8; y < BACK_FLOOR; y += 9) { p.r(0, y, BACK_L, 1, C.sideM); p.r(BACK_R, y, 400 - BACK_R, 1, C.sideM); }
  for (let y = BACK_FLOOR + 3; y < 60; y += 4) { const inset = Math.round((y - BACK_FLOOR) * 7); p.r(BACK_L - inset, y, BACK_R - BACK_L + 2 * inset, 1, C.floorL); }
  p.r(BACK_L - 1, 4, 1, BACK_FLOOR - 4, PLUM); p.r(BACK_R, 4, 1, BACK_FLOOR - 4, PLUM); p.r(BACK_L, BACK_FLOOR, BACK_R - BACK_L, 1, PLUM);
  // the arched doorway in the back wall, warm light beyond it
  const dx = 186, dw = 28;
  p.r(dx, 16, dw, BACK_FLOOR - 16, PLUM);
  for (const [i, w] of [[0, 12], [1, 18], [2, 22], [3, 24]] as const) p.r(dx + (dw - w) / 2 - 1, 12 + i, w + 2, 1, PLUM);
  p.r(dx + 2, 16, dw - 4, BACK_FLOOR - 16, C.door);
  for (const [i, w] of [[1, 16], [2, 20], [3, 22]] as const) p.r(dx + (dw - w) / 2, 12 + i, w, 1, C.door);
  p.group("k2-flicker b", () => { p.r(dx + 6, 34, dw - 12, 10, C.doorGlow); p.r(dx + 9, 30, dw - 18, 4, C.doorGlow); });
  // the bookshelf wall on the left
  p.box(8, 6, 92, 40, C.wood);
  for (let s = 0; s < 4; s++) {
    const y = 8 + s * 9;
    p.r(9, y + 8, 90, 1, C.woodHi);
    for (let x = 11, i = s; x < 96; i++) { const w = 2 + ((i * 7) % 3), h = 5 + ((i * 5) % 3); p.r(x, y + 8 - h, w, h, C.books[i % C.books.length]); p.r(x + w, y + 8 - h, 1, h, PLUM); x += w + 1 + (i % 5 === 4 ? 3 : 0); }
  }
  // wall torches either side of the back wall
  for (const x of [128, 268]) {
    p.r(x, 20, 3, 4, C.iron); p.r(x - 1, 24, 5, 1, PLUM);
    p.group("k2-flicker", () => { p.r(x, 16, 3, 4, C.flame); p.r(x + 1, 15, 1, 2, C.amberHi); });
  }
  // two hanging lanterns on chains
  for (const [x, cls] of [[150, "k2-flicker"], [246, "k2-flicker b"]] as const) {
    p.r(x + 3, 0, 1, 9, PLUM); p.box(x, 9, 7, 8, C.amber); p.r(x - 1, 9, 9, 1, PLUM); p.r(x - 1, 16, 9, 1, PLUM);
    p.group(cls, () => p.r(x + 2, 11, 3, 4, C.amberHi));
  }
  // the rug in perspective
  for (let y = 49; y < 58; y++) { const half = 26 + (y - 49) * 5; p.r(200 - half, y, 2 * half, 1, (y - 49) % 3 === 1 ? C.rug2 : C.rug); }
  p.r(174, 48, 52, 1, PLUM); p.r(129, 58, 142, 1, PLUM);
  // Sisi's writing desk on the right, open journal (gold ribbon), ink, quill and a candle
  p.box(304, 40, 62, 4, C.woodHi); p.r(306, 44, 3, 10, C.wood); p.r(361, 44, 3, 10, C.wood); p.r(306, 53, 3, 1, PLUM); p.r(361, 53, 3, 1, PLUM);
  p.box(316, 36, 26, 5, C.cream); p.r(328, 36, 1, 5, PLUM);
  for (const x of [319, 322, 332, 336]) p.r(x, 38, 2, 1, C.books[1]);
  p.r(329, 41, 1, 3, C.gold);
  p.box(346, 36, 5, 5, C.iron); p.r(350, 33, 1, 3, C.rug2); p.r(351, 32, 1, 2, C.rug2);
  p.r(357, 35, 3, 6, C.cream); p.r(356, 40, 5, 1, PLUM);
  p.group("k2-flicker", () => { p.r(358, 32, 1, 3, C.flame); p.r(357, 33, 3, 1, C.amber); });
  return p.out;
}

export function DungeonStudy() {
  return <Room2 id="dungeon" phase="night" label="Sisi's torchlit study: scroll sideways to look around" art={art()} who="sisi" x={284} floor={54} />;
}
