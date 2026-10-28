// The fox's pixel art (crew/fox.md, v2), pure so the page and the side-by-side check use the same drawing.
// pixel-art palette below (the fox sprite)
export const W = 40, H = 32, CX = 20;   // 40 wide so a full fan of tails fits; the body sits on the crew's 32-tall scale
export type Px = string | null;
export const FOX_COLOURS: Record<string, string> = {
  o: "#4a2538", w: "#FFFFFF", s: "#F1E1EE", e: "#3a2030", h: "#FFFFFF", p: "#FFB8D4", r: "#E2574C", b: "#FF9DBF", g: "#FFD95E", gd: "#E7AE4C",
};
const blank = (): Px[][] => Array.from({ length: H }, () => Array<Px>(W).fill(null));
const disc = (m: Px[][], cx: number, cy: number, rx: number, ry: number, c: string) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++)
    if (y >= 0 && y < H && x >= 0 && x < W && ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1) m[y][x] = c;
};
const set = (m: Px[][], x: number, y: number, c: string) => { if (y >= 0 && y < H && x >= 0 && x < W) m[y][x] = c; };
// Soft shading on the lower-right edge of the white fur, then a 1px plum outline round everything.
function finish(m: Px[][]): Px[][] {
  const out = m.map((r) => r.slice());
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (m[y][x] === "w" && (!m[y][x + 1] || !m[y + 1]?.[x] || !m[y + 1]?.[x + 1])) out[y][x] = "s";
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!m[y][x] && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => m[y + dy]?.[x + dx])) out[y][x] = "o";
  return out;
}

export function tailsMap(n: number): Px[][] {
  const m = blank();
  for (let i = n - 1; i >= 0; i--) {
    const a = ((n === 1 ? 145 : 160 - (140 * i) / Math.max(1, n - 1)) * Math.PI) / 180, ux = Math.cos(a), uy = -Math.sin(a);
    disc(m, CX + ux * 7, 23 + uy * 7, 3.9, 3.9, "w");
    disc(m, CX + ux * 11, 23 + uy * 11, 3.7, 3.7, "w");
    disc(m, CX + ux * 14.2, 23 + uy * 14.2, 2.6, 2.6, "r");
  }
  return finish(m);
}

export function bodyMap(sleepy: boolean): Px[][] {
  const m = blank();
  // ears: tall triangles, pink inside, red tips
  for (const s of [-1, 1]) for (let y = 1; y <= 9; y++) {
    const half = Math.round((y - 1) * 0.55), base = CX + s * 6;
    for (let x = base - half; x <= base + half; x++) set(m, x, y, y <= 2 ? "r" : Math.abs(x - base) < half - 1 && y >= 4 ? "p" : "w");
  }
  disc(m, CX, 22.5, 5.2, 4.2, "w");            // tiny round body
  for (const x of [CX - 3, CX + 2]) for (let y = 25; y <= 27; y++) { set(m, x, y, "w"); set(m, x + 1, y, "w"); }   // stubby legs
  disc(m, CX, 13, 8.8, 7.2, "w");              // big round head
  // face
  for (const ex of [CX - 5, CX + 4]) {
    if (sleepy) { set(m, ex, 14, "e"); set(m, ex + 1, 14, "e"); }
    else { for (let y = 12; y <= 14; y++) { set(m, ex, y, "e"); set(m, ex + 1, y, "e"); } set(m, ex, 12, "h"); }
  }
  set(m, CX - 7, 15, "b"); set(m, CX - 6, 15, "b"); set(m, CX + 6, 15, "b"); set(m, CX + 7, 15, "b");   // blush
  set(m, CX - 8, 13, "r"); set(m, CX - 7, 13, "r"); set(m, CX + 7, 13, "r"); set(m, CX + 8, 13, "r");   // red cheek stripes
  set(m, CX, 15, "e"); set(m, CX - 1, 16, "e"); set(m, CX + 1, 16, "e");                                 // nose and happy mouth
  for (let x = CX - 4; x <= CX + 4; x++) set(m, x, 19, "r");                                              // collar
  set(m, CX, 20, "g"); set(m, CX + 1, 20, "gd"); set(m, CX, 21, "gd");                                    // the gold bell
  return finish(m);
}

