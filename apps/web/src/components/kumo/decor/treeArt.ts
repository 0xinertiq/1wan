// The Sakura bonsai centrepiece (round 12): original code-drawn pixel art on a 128 x 84 grid. A curved S-shaped
// trunk rises from a small wooden tray with grey rocks and moss; branches reach out in a gentle arc; blossom
// clusters (light pink with a deeper centre) with green leaves; petals drifting. Plum outline, pastel palette,
// one gold accent (golden petals for ladder milestones). Pure: the page and the tests use the same model.
//
// stage 0 Bare, 1 Sprout, 2 Leafy, 3 Blossoming, 4 Full bloom (moon behind). wilt 0 none, 1 thirsty (1 missed
// day), 2 drooping (3 missed days), 3 bare and drooping (7 missed days). Drawing only: the decay rules live in
// lib/court/garden.ts and are not changed here.

export const TREE_W = 128, TREE_H = 84;
// pixel-art palette (fallbacks; the page sets --kt-* for day and night)
export const TREE_PAL: Record<string, string> = {
  X: "#4a2538", b: "#9a6450", B: "#7b4b3c", w: "#c98e7e", k: "#a8705f", r: "#b7b2c4", R: "#8f8aa3", m: "#9bd8ae", M: "#6fbf8a",
  l: "#9bd8ae", L: "#6fbf8a", a: "#cfe9c9", A: "#a9d2a4", p: "#ffc2dd", P: "#f48fb8", q: "#ff9dbf", y: "#d9c27a", u: "#b58a5c", g: "#ffd95e", o: "#fff6e3", v: "#e7deff", n: "#bfd9ff", s: "#ffffff",
};

type Px = Map<string, string>;
export type TreeModel = { px: Px; drift: [number, number][]; counts: { leaf: number; blossom: number; fallen: number; gold: number } };

const put = (m: Px, x: number, y: number, c: string) => { if (x >= 0 && y >= 0 && x < TREE_W && y < TREE_H) m.set(`${Math.round(x)},${Math.round(y)}`, c); };
function disc(m: Px, cx: number, cy: number, r: number, c: string, keep?: (x: number, y: number) => boolean) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6 && (!keep || keep(cx + x, cy + y))) put(m, cx + x, cy + y, c);
}
function line(m: Px, x0: number, y0: number, x1: number, y1: number, t: number, c: string) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
  for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n; disc(m, x, y, t / 2, c); }
}
// a curve through points, drawn with a plum outline under a coloured core
function stroke(m: Px, pts: [number, number][], t: number, c: string) {
  for (let i = 1; i < pts.length; i++) line(m, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], t + 2, "X");
  for (let i = 1; i < pts.length; i++) line(m, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], t, c);
}
// a deterministic sprinkle, so the picture never jumps between renders
const rnd = (seed: number) => { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; };

// Branch tips (x, y) with how far each droops when wilting; clusters sit at and along them.
const TIPS: [number, number, number][] = [[30, 30, 6], [22, 37, 5], [44, 22, 4], [58, 15, 2], [72, 13, 2], [86, 20, 4], [100, 28, 5], [106, 36, 6], [64, 24, 3], [50, 32, 3], [80, 31, 3]];

export function treeModel({ stage, wilt, gold = 0, petals = 0 }: { stage: number; wilt: number; gold?: number; petals?: number }): TreeModel {
  const S = Math.max(0, Math.min(4, Math.round(stage))), W = Math.max(0, Math.min(3, Math.round(wilt)));
  const m: Px = new Map(), drift: [number, number][] = [];
  const counts = { leaf: 0, blossom: 0, fallen: 0, gold: 0 };
  const r = rnd(7 + S * 13 + W * 101);

  // a soft pale moon behind the canopy at full bloom
  if (S === 4 && W === 0) disc(m, 96, 14, 9, "o");

  // the S-curved trunk; branches lower as the garden wilts
  const droop = W === 0 ? 0 : W === 1 ? 0.35 : W === 2 ? 0.8 : 1.2;
  stroke(m, [[64, 65], [68, 58], [60, 50], [66, 41], [62, 32], [64, 24]], 5, "b");
  const tip = (t: [number, number, number]): [number, number] => [t[0], t[1] + t[2] * droop];
  const from: [number, number][] = [[62, 38], [62, 38], [63, 30], [64, 26], [64, 24], [65, 30], [66, 40], [66, 40], [64, 26], [62, 34], [66, 36]];
  TIPS.forEach((t, i) => { const [x, y] = tip(t), [fx, fy] = from[i]; stroke(m, [[fx, fy], [(fx + x) / 2, Math.min(fy, y) - 3 + droop * 2], [x, y]], i < 2 || i > 5 ? 2 : 1, "B"); });
  if (W >= 1) { const [x, y] = tip(TIPS[1]); stroke(m, [[x, y], [x - 3, y + 4]], 1, "B"); }   // the drooping twig

  // the tray (drawn over the trunk base, so its rim stays crisp): rim, wood, feet; rocks and moss on the soil
  for (let x = 40; x <= 88; x++) { put(m, x, 66, "X"); put(m, x, 72, "X"); }
  for (let y = 66; y <= 72; y++) { put(m, 40, y, "X"); put(m, 88, y, "X"); }
  for (let y = 67; y <= 71; y++) for (let x = 41; x <= 87; x++) put(m, x, y, y === 69 ? "k" : "w");
  for (const fx of [44, 83]) for (let y = 73; y <= 75; y++) { put(m, fx, y, "X"); put(m, fx + 1, y, "X"); }
  for (let x = 42; x <= 86; x++) put(m, x, 65, "B");
  disc(m, 48, 63, 3, "R"); disc(m, 48, 62, 2, "r"); disc(m, 79, 63, 2, "R"); disc(m, 79, 62, 1, "r");
  for (const x of [52, 53, 55, 70, 72, 73, 75]) put(m, x, 64, W >= 2 ? "u" : "m");

  // foliage: which clusters, how big, leaf colour and how many blossoms, by stage and wilt
  const leafC = W === 0 ? "l" : W === 1 ? "a" : "y", leafD = W === 0 ? "L" : W === 1 ? "A" : "u";   // paler when thirsty
  const keepBloom = W === 0 ? 1 : W === 1 ? 0.85 : W === 2 ? 0.45 : 0.1;
  const keepLeaf = W === 3 ? 0.2 : 1;
  const tips = TIPS.map(tip);
  const leaf = (x: number, y: number, rr: number) => { if (r() > keepLeaf) return; disc(m, x, y, rr, leafD); disc(m, x - 0.5, y - 0.5, Math.max(0, rr - 1), leafC); counts.leaf++; };
  const bloom = (x: number, y: number, rr: number) => { if (r() > keepBloom) { leaf(x, y, Math.max(1, rr - 1)); return; } disc(m, x, y, rr, "P"); disc(m, x, y, Math.max(0, rr - 1), "p"); put(m, x, y, "q"); counts.blossom++; };
  if (S === 1) tips.slice(0, 7).forEach(([x, y], i) => i % 2 === 0 && leaf(x, y - 1, 1));
  if (S === 2) { tips.forEach(([x, y]) => leaf(x, y - 1, 3)); tips.slice(2, 6).forEach(([x, y]) => { if (r() < keepBloom) { put(m, x + 2, y - 3, "P"); counts.blossom++; } }); }
  if (S >= 3) {
    const big = S === 4 ? 5 : 4;
    tips.forEach(([x, y], i) => { leaf(x + (i % 2 ? 3 : -3), y + 1, 2); bloom(x, y - 2, big); });
    if (S === 4) for (const [x, y] of [[38, 24], [52, 18], [66, 10], [80, 15], [94, 22], [56, 27], [74, 25], [34, 34], [100, 32]] as [number, number][]) bloom(x, y + droop * 3, 4);
  }

  // petals drifting (more at full bloom), fallen petals on the ground when thirsty, golden petals on the tray
  const nDrift = W > 0 ? 0 : S === 4 ? 6 + Math.min(4, petals) : S === 3 ? 3 + Math.min(3, petals) : 0;
  for (let i = 0; i < nDrift; i++) drift.push([24 + Math.round(r() * 84), 8 + Math.round(r() * 40)]);
  const fallen = W === 0 ? 0 : W === 1 ? 3 : W === 2 ? 7 : 12;
  for (let i = 0; i < fallen; i++) { put(m, 30 + Math.round(r() * 70), 74 + Math.round(r() * 5), i % 2 ? "p" : "P"); counts.fallen++; }
  const g = Math.max(0, Math.min(8, gold));
  for (let i = 0; i < g; i++) { put(m, 46 + i * 5, 68, "g"); counts.gold++; }

  return { px: m, drift, counts };
}

/** Merge each row's runs of one colour into rects (crisp edges, few nodes). */
export function toRects(px: Px) {
  const rows = new Map<number, [number, string][]>();
  for (const [key, c] of px) { const [x, y] = key.split(",").map(Number); (rows.get(y) ?? rows.set(y, []).get(y)!).push([x, c]); }
  const out: { x: number; y: number; w: number; c: string }[] = [];
  for (const [y, cells] of rows) {
    cells.sort((a, b) => a[0] - b[0]);
    let i = 0;
    while (i < cells.length) { let j = i; while (j + 1 < cells.length && cells[j + 1][0] === cells[j][0] + 1 && cells[j + 1][1] === cells[i][1]) j++; out.push({ x: cells[i][0], y, w: j - i + 1, c: cells[i][1] }); i = j + 1; }
  }
  return out;
}

/** The wilt level the garden shows, from the trunk's days without real activity (yesterday counts as fine). */
export const wiltOf = (idleDays: number) => { const missed = Math.max(0, idleDays - 1); return missed >= 7 ? 3 : missed >= 3 ? 2 : missed >= 1 ? 1 : 0; };
export const WILT_CAPTION = ["", "A little thirsty. Any activity helps.", "Drooping a little. One small tick brings it back.", "Resting bare for now. Any real activity wakes it up; nothing is lost."];
