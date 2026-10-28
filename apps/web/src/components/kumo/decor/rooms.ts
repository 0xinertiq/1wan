// Pilot room (round 7): the inside of the clock tower, Momo's room, for the Calendar banner. Code-drawn pixel art on
// a 400 x 60 grid, read as rows of palette letters like the scene headers: plum outline #4a2538, warm cream and
// lavender walls, one gold accent (the pendulum bob). The big clock's hands are drawn from the real Singapore time.
import type { Sprite } from "./scenes";

export const ROOM_W = 400, ROOM_H = 60, FLOOR = 48;

// pixel-art palette (room only)
export const ROOM_PAL: Record<string, string> = {
  X: "#4a2538", o: "#FFF6E3", s: "#F3E2C4", c: "#FF9DBF", g: "#FFD95E", p: "#FFB3D1", q: "#F48FB8",
  l: "#9BD8AE", m: "#C9F0D6", b: "#C98E7E", d: "#E8C3A8", r: "#E7DEFF", v: "#CDBFFB", w: "#BFD9FF", k: "#A8705F",
};
// walls and floor by Singapore time. pixel-art
export const ROOM_WALL = {
  day: { wall: "#F8ECF4", brick: "#EBD7EA", floor: "#D9A28F", plank: "#B98070", glass: ["#FBE3F1", "#EEDCFA", "#DDE6FF"] },
  dusk: { wall: "#EEDDEE", brick: "#DCC3DF", floor: "#C98E7E", plank: "#A8705F", glass: ["#D7A9DA", "#F2B3CF", "#FFDDBE"] },
  night: { wall: "#3A3058", brick: "#463A69", floor: "#5B4570", plank: "#4a2538", glass: ["#2A2340", "#30294A", "#3A3058"] },
};

// arched window, 12 x 18 (G = glass, filled by the hour)
export const roomWindow: Sprite = [
  "...XXXXXX...", "..XGGGGGGX..", ".XGGGGGGGGX.", "XGGGGXGGGGGX", "XGGGGXGGGGGX", "XGGGGXGGGGGX", "XGGGGXGGGGGX", "XXXXXXXXXXXX",
  "XGGGGXGGGGGX", "XGGGGXGGGGGX", "XGGGGXGGGGGX", "XGGGGXGGGGGX", "XGGGGXGGGGGX", "XGGGGXGGGGGX", "XXXXXXXXXXXX", "XssssssssssX", "XXXXXXXXXXXX",
];
// a gear, 11 x 11
export const gear: Sprite = [
  "....XXX....", "..X.XsX.X..", ".XsXXsXXsX.", "..XsssssX..", "XXXssXssXXX", "XssXXoXXssX", "XXXssXssXXX", "..XsssssX..", ".XsXXsXXsX.", "..X.XsX.X..", "....XXX....",
];
// bookshelf, 16 x 24
export const shelf: Sprite = [
  "XXXXXXXXXXXXXXXX", "XbbbbbbbbbbbbbbX", "XbXXXXXXXXXXXXbX", "XbXpXlXwXvXcXXbX", "XbXpXlXwXvXcXobX", "XbXpXlXwXvXcXobX", "XbXXXXXXXXXXXXbX", "XbbbbbbbbbbbbbbX",
  "XbXXXXXXXXXXXXbX", "XbXwXXcXlXpXvXbX", "XbXwXocXlXpXvXbX", "XbXwXocXlXpXvXbX", "XbXXXXXXXXXXXXbX", "XbbbbbbbbbbbbbbX", "XbXXXXXXXXXXXXbX", "XbXlXvXXpXwXcXbX",
  "XbXlXvXoXpXwXcbX", "XbXlXvXoXpXwXcbX", "XbXXXXXXXXXXXXbX", "XbbbbbbbbbbbbbbX", "XbbbbbbbbbbbbbbX", "XbbbbbbbbbbbbbbX", "XXXXXXXXXXXXXXXX", ".XX..........XX.",
];
// Momo's writing desk with an open diary and a teacup, 26 x 12
export const momoDesk: Sprite = [
  "......XXXXXX........XXX...", ".....XooooooX......XpppX..", ".....XoXXoXoX......XpppXX.", "XXXXXXXXXXXXXXXXXXXXXXXXXX", "XddddddddddddddddddddddddX", "XXXXXXXXXXXXXXXXXXXXXXXXXX",
  ".XbX..................XbX.", ".XbX..XXXXXXXX........XbX.", ".XbX..XssssssX........XbX.", ".XbX..XXXXXXXX........XbX.", ".XbX..................XbX.", ".XXX..................XXX.",
];
// wall calendar, 14 x 14 (pink header, one day circled)
export const wallCal: Sprite = [
  "...X......X...", "XXXXXXXXXXXXXX", "XccccccccccccX", "XccccccccccccX", "XXXXXXXXXXXXXX", "XoXoXoXoXoXoXX", "XooooooooooooX",
  "XoXoXoXqXoXoXX", "XooooooqqooooX", "XoXoXoXoXoXoXX", "XooooooooooooX", "XoXoXoXoXoXoXX", "XooooooooooooX", "XXXXXXXXXXXXXX",
];
// spiral stair going up and out of view, 28 x 30
export const stair: Sprite = [
  "......................XXXXXX", "......................XbbbbX", "...................XXXXXXXXX", "...................XbbbbX...", "................XXXXXXXXX...", "................XbbbbX......",
  ".............XXXXXXXXX......", ".............XbbbbX.........", "..........XXXXXXXXX.........", "..........XbbbbX............", ".......XXXXXXXXX............", ".......XbbbbX...............",
  "....XXXXXXXXX...............", "....XbbbbX..................", ".XXXXXXXXX..................", ".XbbbbX.....................", "XXXXXXX.....................", "XdX.........................",
  "XdX.........................", "XdX.........................", "XdX.........................", "XdX.........................", "XdX.........................", "XdX.........................",
  "XdX.........................", "XdX.........................", "XdX.........................", "XdX.........................", "XdX.........................", "XXX.........................",
];
// a round rug, 30 x 4
export const rug: Sprite = ["....XXXXXXXXXXXXXXXXXXXXXX....", "XXXXppqppqppqppqppqppqppqpXXXX", "XppqppqppqppqppqppqppqppqppqpX", "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"];
// hanging lantern on its chain (o glows at night)
export const roomLantern: Sprite = ["..X..", "..X..", "..X..", "..X..", "..X..", ".XXX.", "XoooX", "XoooX", "XoooX", ".XXX."];

/** The clock face (radius 12) as rows, hands set to the given Singapore hour and minute. */
export function clockFace(h: number, m: number): Sprite {
  const R = 12, S = R * 2 + 1, g: string[][] = Array.from({ length: S }, () => Array(S).fill("."));
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const d = Math.hypot(x - R, y - R);
    if (d <= R + 0.4) g[y][x] = d > R - 1.2 ? "X" : d > R - 2.2 ? "d" : "o";
  }
  for (let i = 0; i < 12; i++) { const a = (i / 12) * 2 * Math.PI; g[Math.round(R - Math.cos(a) * (R - 3.5))][Math.round(R + Math.sin(a) * (R - 3.5))] = i % 3 ? "v" : "X"; }
  const hand = (turn: number, len: number) => { const a = turn * 2 * Math.PI; for (let r = 0; r <= len; r += 0.5) g[Math.round(R - Math.cos(a) * r)][Math.round(R + Math.sin(a) * r)] = "X"; };
  hand(((h % 12) + m / 60) / 12, 5.5);
  hand(m / 60, 8.5);
  g[R][R] = "q";
  return g.map((row) => row.join(""));
}
