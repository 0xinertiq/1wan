// The Living World: a code-drawn pixel kingdom on a canvas (no painted art). Pure drawing, no React, so it
// can be rendered and checked on its own. Logical pixels are scaled up nearest-neighbour by the page.
// Static layers (sky and mountains, side islets, the island and its buildings) are drawn once per
// time of day, weather and growth stage; only small moving things are drawn every frame.

export type Phase = "dawn" | "day" | "dusk" | "night";
export type Weather = "clear" | "cloudy" | "rain";
export type WorldOpts = { W: number; H: number; phase: Phase; weather: Weather; stage: number; seed?: number };
export type Place = { id: string; label: string; href: string; x: number; y: number; desk: [number, number] };

type C = CanvasRenderingContext2D;
const P = "#4a2538";

// Palette (day colours; time of day and weather tint them).
const K = {
  grass: "#A8DDB5", grassHi: "#C3EBCB", grassLo: "#86C79B", rock: "#E8CFC4", rock2: "#D9B9AE", rock3: "#C9A39A",
  path: "#F4E3C8", pathLo: "#E6CFAE", wall: "#FFF4EC", wallLo: "#F1DCD4", roof: "#F48FB8", roofLo: "#D86C9C",
  roof2: "#B79BE6", roof2Lo: "#9A7CD0", win: "#7C6BB0", gold: "#FFD95E", water: "#9CC8FF", waterHi: "#E1F0FF",
  trunk: "#A9776B", pink: "#FFB3D1", pink2: "#FF8FBF", pinkHi: "#FFD9E8", leaf: "#9BD8AE", leafLo: "#76BE8E",
  stone: "#D8CFE0", stoneLo: "#BFB3CF", cloud: "#FFFFFF", cloudLo: "#EDE4FF", cloudLine: "#C9B8EC", wood: "#C99A7A",
  lav: "#B8A6F0", lavLo: "#9886D8", navy: "#4A3A78",
};

const SKY: Record<Phase, [string, string]> = {
  dawn: ["#F2BFD8", "#FFE9CC"], day: ["#A9CBFF", "#FFE6F1"], dusk: ["#8E7CC3", "#FFB9A6"], night: ["#16113A", "#41316F"],
};
const MOUNT: Record<Phase, [string, string]> = {
  dawn: ["#E7CBE6", "#D6B6DE"], day: ["#D9CCF2", "#C4B2E6"], dusk: ["#B79BD3", "#9E80C2"], night: ["#2C2458", "#3A2F6A"],
};
// Tint laid over the static layers (source-atop, so only drawn pixels change).
const TINT: Record<Phase, string | null> = { dawn: "rgba(255,190,170,.16)", day: null, dusk: "rgba(120,70,140,.22)", night: "rgba(24,16,70,.5)" };

// --- tiny pixel helpers -------------------------------------------------------------------------------
function rect(c: C, x: number, y: number, w: number, h: number, col: string) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function ell(c: C, cx: number, cy: number, rx: number, ry: number, col: string, top = false) {
  for (let y = -ry; y <= (top ? 0 : ry); y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); rect(c, cx - w, cy + y, w * 2 + 1, 1, col); }
}
function oell(c: C, cx: number, cy: number, rx: number, ry: number, col: string, top = false) { ell(c, cx, cy, rx + 1, ry + 1, P, top); ell(c, cx, cy, rx, ry, col, top); }
function orect(c: C, x: number, y: number, w: number, h: number, col: string) { rect(c, x - 1, y - 1, w + 2, h + 2, P); rect(c, x, y, w, h, col); }
function tri(c: C, cx: number, top: number, hw: number, h: number, col: string) { for (let i = 0; i < h; i++) { const w = Math.round((hw * (i + 1)) / h); rect(c, cx - w, top + i, w * 2 + 1, 1, col); } }
function otri(c: C, cx: number, top: number, hw: number, h: number, col: string, lo?: string) {
  tri(c, cx, top - 1, hw + 1, h + 1, P); tri(c, cx, top, hw, h, col);
  if (lo) for (let i = 0; i < h; i++) { const w = Math.round((hw * (i + 1)) / h); rect(c, cx + 1, top + i, w, 1, lo); }
}
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const A = p(a), B = p(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("");
}
function canvas(w: number, h: number) {
  const el = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(w, h) : Object.assign(document.createElement("canvas"), { width: w, height: h });
  return el as unknown as HTMLCanvasElement;
}
function tint(cv: HTMLCanvasElement, col: string | null) {
  if (!col) return;
  const c = cv.getContext("2d")!; c.save(); c.globalCompositeOperation = "source-atop"; c.fillStyle = col; c.fillRect(0, 0, cv.width, cv.height); c.restore();
}

// --- world geometry -------------------------------------------------------------------------------------
export function geometry(W: number, H: number) {
  const cx = Math.round(W / 2), gy = H - 70;
  const places: Place[] = [
    { id: "castle", label: "The Castle", href: "#kprog", x: cx, y: gy - 96, desk: [cx - 2, gy - 2] },
    { id: "clock", label: "Clock Tower", href: "#calendar", x: cx - 118, y: gy - 68, desk: [cx - 112, gy + 4] },
    { id: "obs", label: "Observatory", href: "#observatory", x: cx + 114, y: gy - 50, desk: [cx + 104, gy + 6] },
    { id: "garden", label: "Sakura Garden", href: "#garden", x: cx - 58, y: gy - 36, desk: [cx - 50, gy + 14] },
    { id: "life", label: "Life Hub", href: "#life", x: cx - 146, y: gy - 22, desk: [cx - 136, gy + 22] },
    { id: "diary", label: "Fox Diary", href: "#diary", x: cx + 150, y: gy - 18, desk: [cx + 140, gy + 24] },
  ];
  return { cx, gy, places };
}

// --- static layers ----------------------------------------------------------------------------------------
function drawSky(c: C, o: WorldOpts) {
  const [top, bot] = SKY[o.phase];
  const rain = o.weather === "rain", cloudy = o.weather === "cloudy";
  const steps = 10;
  for (let y = 0; y < o.H; y++) {
    const t = y / o.H, band = Math.floor(t * steps) / steps, next = Math.min(1, band + 1 / steps);
    const dither = (t * steps) % 1 > 0.75 && (y % 2 === 0);
    const wx = (col: string) => (rain ? mix(col, "#8F8AA8", 0.45) : cloudy ? mix(col, "#C9C3DA", 0.25) : col);
    rect(c, 0, y, o.W, 1, wx(mix(top, bot, dither ? next : band)));
    if (dither) for (let x = (y % 4) / 2; x < o.W; x += 2) rect(c, x, y, 1, 1, wx(mix(top, bot, band)));
  }
}

function drawMountains(c: C, o: WorldOpts, r: () => number) {
  const { gy } = geometry(o.W, o.H);
  const [far, near] = MOUNT[o.phase];
  const ridge = (base: number, amp: number, col: string, snow: boolean, f: number) => {
    const ph = r() * 10;
    for (let x = 0; x < o.W; x++) {
      const h = Math.round(amp * (0.55 + 0.25 * Math.sin(x / (38 * f) + ph) + 0.15 * Math.sin(x / (13 * f) + ph * 2) + 0.05 * Math.sin(x / 5 + ph)));
      rect(c, x, base - h, 1, h + 40, col);
      if (snow && h > amp * 0.78) rect(c, x, base - h, 1, 2, o.phase === "night" ? "#5A4E8C" : "#FFFFFF");
    }
  };
  ridge(gy - 34, 46, far, true, 1.4);
  ridge(gy - 14, 34, near, false, 1);
  // soft cloud bank the island floats over: scalloped top, pale gradient below
  const bankTop = gy - 6, lo = o.phase === "night" ? "#3A3070" : o.phase === "dusk" ? "#E9C3D2" : "#F1EAFF", hi = o.phase === "night" ? "#4B3F86" : "#FFFFFF";
  for (let x = -10; x < o.W + 20; x += 14) { const rr = 9 + Math.round(r() * 7); ell(c, x, bankTop + 10 - Math.round(r() * 6), rr + 1, Math.round(rr * 0.6) + 1, o.phase === "night" ? "#2E2660" : K.cloudLine); }
  for (let x = -10; x < o.W + 20; x += 14) { const rr = 9 + Math.round(r() * 7); ell(c, x, bankTop + 11 - Math.round(r() * 6), rr, Math.round(rr * 0.6), hi); }
  for (let y = bankTop + 10; y < o.H; y++) rect(c, 0, y, o.W, 1, mix(hi, lo, Math.min(1, (y - bankTop - 10) / 40)));
  // two more rows of puffs with a shaded underside give the bank depth
  for (const [row, dy, sz] of [[0, 22, 6], [1, 38, 8]] as const) for (let x = -8 + row * 7; x < o.W + 16; x += 18) {
    const rr = sz + Math.round(r() * 5), y = bankTop + dy + Math.round(r() * 4);
    ell(c, x, y, rr + 1, Math.round(rr * 0.55) + 1, o.phase === "night" ? "#2E2660" : "#E3D8FA"); ell(c, x, y, rr, Math.round(rr * 0.55), hi);
    rect(c, x - rr + 2, y + Math.round(rr * 0.3), rr * 2 - 3, 1, o.phase === "night" ? "#3A3070" : "#EDE4FF");
  }
}

function cloudSprite(w: number, h: number, phase: Phase, weather: Weather, r: () => number) {
  const cv = canvas(w + 4, h + 4), c = cv.getContext("2d")!;
  const fill = weather === "rain" ? "#D4D0E2" : K.cloud, lo = weather === "rain" ? "#B9B3CC" : K.cloudLo;
  const blobs = 3 + Math.floor(r() * 3);
  const parts: [number, number, number, number][] = [];
  for (let i = 0; i < blobs; i++) { const rx = Math.round(w * (0.18 + r() * 0.14)), ry = Math.round(h * (0.35 + r() * 0.25)); parts.push([Math.round(rx + 2 + (i / Math.max(1, blobs - 1)) * (w - rx * 2)), Math.round(h + 2 - ry), rx, ry]); }
  for (const [x, y, rx, ry] of parts) ell(c, x, y, rx + 1, ry + 1, K.cloudLine);
  rect(c, 2, h + 1, w, 2, K.cloudLine);
  for (const [x, y, rx, ry] of parts) ell(c, x, y, rx, ry, fill);
  rect(c, 3, h, w - 2, 2, lo);
  for (const [x, y, rx, ry] of parts) rect(c, x - Math.round(rx / 2), y - ry + 1, Math.round(rx / 2), 1, "#FFFFFF");
  tint(cv, TINT[phase]);
  return cv;
}

function islet(c: C, x: number, y: number, w: number, r: () => number, tree: "green" | "pink" | "none" = "green") {
  for (let i = 0; i < 14; i++) { const hw = Math.round((w / 2) * (1 - i / 14) + (r() - 0.5) * 2); if (hw > 0) { rect(c, x - hw - 1, y + i, hw * 2 + 3, 1, P); rect(c, x - hw, y + i, hw * 2 + 1, 1, i % 4 === 3 ? K.rock3 : i % 3 ? K.rock : K.rock2); } }
  oell(c, x, y, Math.round(w / 2), 4, K.grass);
  ell(c, x - 2, y - 1, Math.round(w / 3), 2, K.grassHi);
  if (tree === "green") { rect(c, x - 1, y - 10, 2, 8, K.trunk); oell(c, x, y - 13, 6, 5, K.leaf); ell(c, x - 2, y - 15, 3, 2, "#B6E6C2"); }
  if (tree === "pink") { rect(c, x - 1, y - 10, 2, 8, K.trunk); oell(c, x, y - 13, 7, 5, K.pink); ell(c, x - 2, y - 15, 3, 2, K.pinkHi); }
}

// Window rectangles collected while drawing buildings; lit warm after dark.
type Win = [number, number, number, number];

function house(c: C, x: number, base: number, w: number, h: number, roof: string, roofLo: string, wins: Win[], chimney = true) {
  orect(c, x, base - h, w, h, K.wall);
  rect(c, x + w - 3, base - h, 3, h, K.wallLo);
  otri(c, x + w / 2, base - h - 11, w / 2 + 3, 11, roof, roofLo);
  if (chimney) { orect(c, x + w - 7, base - h - 12, 3, 6, K.stone); }
  orect(c, x + Math.round(w / 2) - 2, base - 7, 4, 7, K.wood); rect(c, x + Math.round(w / 2) + 1, base - 4, 1, 1, K.gold);
  for (const wx of [x + 3, x + w - 7]) { orect(c, wx, base - h + 4, 3, 3, K.win); wins.push([wx, base - h + 4, 3, 3]); }
}

function drawIsland(c: C, o: WorldOpts, r: () => number, wins: Win[]) {
  const { cx, gy } = geometry(o.W, o.H);
  const RX = 172;
  // underside: layered rock tapering to a point, with roots and crystals
  for (let i = 0; i < 64; i++) {
    const t = i / 64, hw = Math.round(RX * Math.pow(1 - t, 0.85) * (0.96 + 0.06 * Math.sin(i * 1.7)) + (r() - 0.5) * 3);
    if (hw <= 0) continue;
    const y = gy + 8 + i;
    rect(c, cx - hw - 1, y, hw * 2 + 3, 1, P);
    const band = i % 9 < 3 ? K.rock2 : i % 13 < 2 ? K.rock3 : K.rock;
    rect(c, cx - hw, y, hw * 2 + 1, 1, band);
    rect(c, cx - hw, y, 3, 1, "#F5E2DA");
    if (r() < 0.05) rect(c, cx - hw + 3 + Math.floor(r() * hw * 2), y, 2, 1, K.rock3);
  }
  for (let k = 0; k < 10; k++) { const x = cx - 150 + Math.floor(r() * 300), len = 3 + Math.floor(r() * 8); rect(c, x, gy + 12, 1, len, K.leafLo); rect(c, x, gy + 12 + len, 1, 1, K.pink); }
  for (const [x, y] of [[cx - 40, gy + 46], [cx + 26, gy + 52], [cx - 8, gy + 60]] as const) { rect(c, x, y, 2, 3, "#CFC2FF"); rect(c, x, y, 1, 1, "#FFFFFF"); }
  // cliff face and grass top
  ell(c, cx, gy + 8, RX + 1, 23, P); ell(c, cx, gy + 8, RX, 22, K.rock2);
  oell(c, cx, gy, RX, 22, K.grass);
  ell(c, cx, gy - 3, RX - 8, 17, K.grassHi);
  ell(c, cx, gy, RX - 22, 14, K.grass);
  for (let k = 0; k < 90; k++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); const x = cx + Math.cos(a) * d * (RX - 6), y = gy + Math.sin(a) * d * 19; rect(c, x, y, 1, 1, r() < 0.5 ? K.grassLo : K.grassHi); }

  // back trees along the rim (behind buildings)
  for (let k = 0; k < 16; k++) {
    const a = Math.PI + 0.12 + (k / 15) * (Math.PI - 0.24), x = Math.round(cx + Math.cos(a) * (RX - 10)), y = Math.round(gy + Math.sin(a) * 18);
    if (Math.abs(x - cx) < 46) continue;
    const pink = k % 4 === 1;
    rect(c, x - 1, y - 5, 2, 5, K.trunk); oell(c, x, y - 9, 5 + (k % 2), 5, pink ? K.pink : K.leaf); ell(c, x - 2, y - 11, 2, 1, pink ? K.pinkHi : "#B6E6C2");
  }

  // stream from the pond to the waterfall at the front-right rim, with a little bridge
  const pondX = cx + 52, pondY = gy - 4;
  oell(c, pondX, pondY, 12, 4, K.water); ell(c, pondX - 3, pondY - 1, 5, 1, K.waterHi);
  for (let i = 0; i < 46; i++) { const x = pondX + 8 + i, y = pondY + 3 + Math.round(i * 0.42 + Math.sin(i / 5) * 1.5); rect(c, x - 1, y - 1, 3, 4, P); }
  for (let i = 0; i < 46; i++) { const x = pondX + 8 + i, y = pondY + 3 + Math.round(i * 0.42 + Math.sin(i / 5) * 1.5); rect(c, x, y, 2, 2, K.water); }
  const brX = pondX + 26, brY = pondY + 14;
  for (let i = -6; i <= 6; i++) { const y = brY - Math.round(3 * (1 - (i * i) / 36)); rect(c, brX + i, y - 1, 1, 3, P); rect(c, brX + i, y, 1, 1, K.wood); }
  rect(c, brX - 6, brY - 4, 1, 3, P); rect(c, brX + 6, brY - 4, 1, 3, P);
  // waterfall at the rim
  const wfX = cx + 104, wfY = gy + 18;
  orect(c, wfX, wfY, 6, 50, K.water); for (let y = wfY; y < wfY + 50; y += 3) rect(c, wfX + 1 + (y % 2), y, 1, 2, K.waterHi);

  // paths: castle gate to the front, and to the two cottages, with stepping stones
  for (let y = gy - 6; y <= gy + 20; y++) { const hw = 4 + Math.round((y - gy + 6) * 0.25); rect(c, cx - hw - 1, y, hw * 2 + 3, 1, K.pathLo); rect(c, cx - hw, y, hw * 2 + 1, 1, K.path); if (y % 4 === 0) rect(c, cx - 2, y, 2, 1, K.pathLo); }
  for (let i = 0; i < 9; i++) { const x = cx - 18 - i * 13, y = gy + 12 + Math.round(i * 1.2); oell(c, x, y, 3, 1, K.stone); }
  for (let i = 0; i < 8; i++) { const x = cx + 18 + i * 14, y = gy + 13 + Math.round(i * 1.4); oell(c, x, y, 3, 1, K.stone); }

  // front stone walls on the rim
  for (const [x0, x1] of [[cx - 120, cx - 40], [cx + 40, cx + 96]] as const) {
    for (let x = x0; x < x1; x += 6) { const y = gy + 19 + Math.round(Math.abs(x - cx) / 40); orect(c, x, y, 5, 3, K.stone); rect(c, x, y + 2, 5, 1, K.stoneLo); }
  }

  // scattered tiny flowers, bushes on the rim, hedges by the path, a fence and a bench
  for (let k = 0; k < 60; k++) { const a = r() * Math.PI * 2, d = 0.35 + Math.sqrt(r()) * 0.6, x = cx + Math.cos(a) * d * (RX - 12), y = gy + Math.sin(a) * d * 17; if (Math.abs(x - cx) < 10) continue; rect(c, x, y, 1, 1, [K.pink, "#FFFFFF", K.gold, K.lav][k % 4]); }
  for (let k = 0; k < 22; k++) {
    const a = 0.08 + (k / 21) * (Math.PI - 0.16), x = Math.round(cx + Math.cos(a) * (RX - 4)), y = Math.round(gy + Math.sin(a) * 20) - 1;
    if (Math.abs(x - cx) < 14 || Math.abs(x - (cx + 104)) < 8) continue;
    oell(c, x, y, 3 + (k % 2), 2, k % 5 === 2 ? K.pink : K.leaf); rect(c, x - 1, y - 2, 2, 1, k % 5 === 2 ? K.pinkHi : "#B6E6C2");
  }
  for (let y = gy + 2; y <= gy + 18; y += 4) { const hw = 7 + Math.round((y - gy + 6) * 0.25); orect(c, cx - hw - 4, y, 2, 2, K.leafLo); orect(c, cx + hw + 3, y, 2, 2, K.leafLo); }
  for (let i = 0; i < 7; i++) { rect(c, cx - 132 + i * 4, gy - 2, 1, 5, P); } rect(c, cx - 132, gy - 1, 25, 1, K.wood); rect(c, cx - 132, gy + 1, 25, 1, K.wood);
  orect(c, cx + 30, gy + 10, 9, 2, K.wood); rect(c, cx + 30, gy + 12, 1, 2, P); rect(c, cx + 38, gy + 12, 1, 2, P);

  // ---- buildings, back to front ----
  // Castle
  const cb = gy - 6;
  orect(c, cx - 30, cb - 8, 60, 8, K.stone); rect(c, cx - 30, cb - 2, 60, 2, K.stoneLo);
  orect(c, cx - 20, cb - 42, 40, 34, K.wall); rect(c, cx + 14, cb - 42, 6, 34, K.wallLo);
  for (let x = cx - 20; x < cx + 20; x += 4) orect(c, x, cb - 45, 2, 2, K.wall);
  for (const tx of [cx - 36, cx + 24]) {
    orect(c, tx, cb - 50, 12, 42, K.wall); rect(c, tx + 9, cb - 50, 3, 42, K.wallLo);
    otri(c, tx + 6, cb - 66, 8, 16, K.roof, K.roofLo); rect(c, tx + 6, cb - 70, 1, 4, P);
    for (let wy = cb - 44; wy < cb - 16; wy += 10) { orect(c, tx + 4, wy, 3, 4, K.win); wins.push([tx + 4, wy, 3, 4]); }
  }
  orect(c, cx - 8, cb - 66, 16, 26, K.wall); rect(c, cx + 5, cb - 66, 3, 26, K.wallLo);
  otri(c, cx, cb - 86, 11, 20, K.roof, K.roofLo); rect(c, cx, cb - 92, 1, 6, P); rect(c, cx - 1, cb - 94, 3, 3, K.gold);
  orect(c, cx - 3, cb - 60, 6, 6, K.win); wins.push([cx - 3, cb - 60, 6, 6]); rect(c, cx - 1, cb - 60, 1, 6, P);
  otri(c, cx - 14, cb - 52, 6, 9, K.roof2, K.roof2Lo); otri(c, cx + 14, cb - 52, 6, 9, K.roof2, K.roof2Lo);
  for (const wx of [cx - 15, cx - 7, cx + 4, cx + 12]) { orect(c, wx, cb - 34, 3, 5, K.win); wins.push([wx, cb - 34, 3, 5]); }
  for (const bx of [cx - 17, cx + 13]) { rect(c, bx, cb - 26, 4, 10, K.pink2); rect(c, bx + 1, cb - 24, 2, 2, K.gold); tri(c, bx + 2, cb - 16, 2, 2, K.pink2); }
  ell(c, cx, cb - 10, 6, 7, P, true); ell(c, cx, cb - 10, 5, 6, "#6B4E7A", true); rect(c, cx - 6, cb - 10, 13, 10, P); rect(c, cx - 5, cb - 10, 11, 10, "#6B4E7A"); rect(c, cx, cb - 15, 1, 15, "#4E3460");
  rect(c, cx - 19, cb - 41, 1, 30, "#FFFFFF");

  // Clock tower (hands are drawn live each frame)
  const ct = cx - 118;
  orect(c, ct - 14, gy - 12, 28, 12, K.wall); otri(c, ct, gy - 22, 16, 10, K.roof2, K.roof2Lo);
  orect(c, ct - 7, gy - 56, 14, 44, K.wall); rect(c, ct + 4, gy - 56, 3, 44, K.wallLo);
  oell(c, ct, gy - 46, 5, 5, "#FFF9EA"); rect(c, ct, gy - 51, 1, 1, P);
  otri(c, ct, gy - 72, 9, 16, K.roof, K.roofLo); rect(c, ct, gy - 76, 1, 4, P); rect(c, ct - 1, gy - 78, 3, 2, K.gold);
  for (const wy of [gy - 36, gy - 26]) { orect(c, ct - 2, wy, 4, 4, K.win); wins.push([ct - 2, wy, 4, 4]); }
  orect(c, ct - 3, gy - 9, 6, 9, K.wood);

  // Observatory
  const ob = cx + 114;
  orect(c, ob - 17, gy - 20, 34, 18, K.wall); rect(c, ob + 12, gy - 20, 5, 18, K.wallLo);
  oell(c, ob, gy - 20, 18, 15, K.lav, true); ell(c, ob - 5, gy - 28, 6, 4, "#D5C9FA", true);
  rect(c, ob - 1, gy - 35, 3, 15, K.lavLo);
  for (let i = 0; i < 12; i++) rect(c, ob + 2 + i, gy - 30 - Math.round(i * 0.7), 3, 3, P);
  for (let i = 0; i < 12; i++) rect(c, ob + 3 + i, gy - 29 - Math.round(i * 0.7), 2, 1, K.navy);
  rect(c, ob + 14, gy - 39, 2, 2, K.gold);
  for (const wx of [ob - 12, ob + 6]) { orect(c, wx, gy - 14, 4, 5, K.win); wins.push([wx, gy - 14, 4, 5]); }

  // Life Hub cottage (left) with a vegetable bed, and Fox Diary cottage (right) with a bookshelf sign
  house(c, cx - 160, gy + 10, 26, 16, K.roof2, K.roof2Lo, wins);
  for (let i = 0; i < 4; i++) { rect(c, cx - 128 + i * 4, gy + 4, 3, 5, K.trunk); rect(c, cx - 128 + i * 4, gy + 3, 3, 1, i % 2 ? K.leaf : K.gold); }
  house(c, cx + 136, gy + 12, 26, 16, K.roof, K.roofLo, wins);
  orect(c, cx + 165, gy - 1, 6, 6, K.wood); rect(c, cx + 166, gy, 1, 4, K.pink2); rect(c, cx + 168, gy, 1, 4, K.lav); rect(c, cx + 170, gy, 1, 4, K.gold);

  // Lanterns (two at the start), flower beds and mushrooms
  const lanterns: [number, number][] = [[cx - 14, gy + 16], [cx + 14, gy + 16]];
  if (o.stage >= 2) lanterns.push([cx - 88, gy + 4], [cx + 84, gy + 6]);
  if (o.stage >= 4) lanterns.push([cx - 40, gy - 8], [cx + 40, gy - 8]);
  for (const [x, y] of lanterns) { orect(c, x - 1, y - 9, 3, 9, K.stone); orect(c, x - 2, y - 12, 5, 3, K.gold); rect(c, x - 3, y - 13, 7, 1, P); wins.push([x - 1, y - 11, 3, 1]); }
  const beds: [number, number][] = [[cx - 30, gy + 6], [cx + 24, gy + 6]];
  if (o.stage >= 2) beds.push([cx - 100, gy - 6], [cx + 70, gy - 10], [cx - 70, gy + 14]);
  for (const [x, y] of beds) { oell(c, x, y, 8, 2, K.grassLo); for (let i = -6; i <= 6; i += 3) { rect(c, x + i, y - 2, 1, 2, K.leafLo); rect(c, x + i, y - 3, 2, 2, [K.pink, K.gold, K.lav, K.pink2][(i + 6) % 4]); } }
  for (const [x, y] of [[cx - 74, gy + 6], [cx - 40, gy + 12]] as const) { rect(c, x, y - 2, 2, 3, "#FFF4EC"); oell(c, x + 1, y - 3, 2, 1, K.pink2); }

  if (o.stage >= 2) for (let i = 0; i <= 48; i++) { const x = cx - 24 + i, y = gy - 52 + Math.round(6 * Math.sin((i / 48) * Math.PI)); rect(c, x, y, 1, 1, P); if (i % 6 === 3) { rect(c, x, y + 1, 2, 2, [K.pink2, K.gold, K.lav][(i / 6) % 3 | 0]); wins.push([x, y + 1, 2, 2]); } }
  // Stage 3: fountain plaza and koi pond; stage 4: lantern string; stage 5 additions live on side islets
  if (o.stage >= 3) {
    oell(c, cx, gy + 22, 9, 3, K.stone); ell(c, cx, gy + 22, 7, 2, K.water); orect(c, cx - 1, gy + 15, 2, 6, K.stone); oell(c, cx, gy + 15, 3, 1, K.stone);
    oell(c, cx - 70, gy - 6, 10, 3, K.water); ell(c, cx - 72, gy - 7, 4, 1, K.waterHi);
  }
}

function drawIslets(c: C, o: WorldOpts, r: () => number, wins: Win[]) {
  const { cx, gy } = geometry(o.W, o.H);
  islet(c, cx - 250, gy - 44, 38, r, "pink");
  islet(c, cx + 262, gy - 58, 30, r, "green");
  // distant islets far up: a gazebo on one, two tiny houses on the other (always there, for depth)
  islet(c, cx - 196, gy - 112, 30, r, "none");
  orect(c, cx - 203, gy - 122, 2, 9, K.wall); orect(c, cx - 191, gy - 122, 2, 9, K.wall); otri(c, cx - 196, gy - 131, 9, 8, K.roof2, K.roof2Lo);
  islet(c, cx + 200, gy - 124, 34, r, "none");
  house(c, cx + 186, gy - 124, 12, 8, K.roof, K.roofLo, wins, false); house(c, cx + 202, gy - 124, 12, 9, K.roof2, K.roof2Lo, wins, false);
  islet(c, cx - 214, gy + 28, 18, r, "none");
  islet(c, cx + 228, gy + 22, 22, r, "pink");
  if (o.stage >= 4) {
    // tea house on the left islet, joined to the island by a rope bridge
    house(c, cx - 262, gy - 44, 22, 12, K.roof2, K.roof2Lo, wins, false);
    for (let i = 0; i <= 50; i++) { const x = cx - 238 + i * 1.3, y = gy - 44 + Math.round(10 * Math.sin((i / 50) * Math.PI)); rect(c, x, y, 1, 1, P); if (i % 4 === 0) rect(c, x, y - 3, 1, 3, K.wood); }
  }
  if (o.stage >= 5) {
    // second island with a windmill (blades drawn live)
    islet(c, cx + 262, gy - 20, 56, r, "none");
    orect(c, cx + 256, gy - 44, 12, 22, K.wall); otri(c, cx + 262, gy - 54, 8, 10, K.roof, K.roofLo);
    house(c, cx + 276, gy - 20, 14, 9, K.roof2, K.roof2Lo, wins, false);
  }
}

// --- the live world -------------------------------------------------------------------------------------------
export type World = { draw: (c: C, t: number, now: Date) => void; places: Place[] };

export function makeWorld(o: WorldOpts): World {
  const seed = o.seed ?? 7, r = rng(seed);
  const { cx, gy, places } = geometry(o.W, o.H);
  const wins: Win[] = [];
  const back = canvas(o.W, o.H), bc = back.getContext("2d")!;
  drawSky(bc, o);
  const mts = canvas(o.W, o.H); drawMountains(mts.getContext("2d")!, o, r); tint(mts, o.weather === "rain" ? "rgba(90,84,120,.25)" : null);
  const isl = canvas(o.W, o.H); drawIslets(isl.getContext("2d")!, o, r, wins); tint(isl, TINT[o.phase]);
  const main = canvas(o.W, o.H); drawIsland(main.getContext("2d")!, o, r, wins); tint(main, TINT[o.phase]); tint(main, o.weather === "rain" ? "rgba(70,70,110,.18)" : null);
  const clouds = Array.from({ length: o.weather === "clear" ? 5 : 9 }, (_, i) => {
    const w = 26 + Math.floor(r() * 30);
    return { cv: cloudSprite(w, 8 + Math.floor(r() * 6), o.phase, o.weather, r), x: r() * (o.W + 80), y: 6 + r() * (gy - 80), v: 1.2 + (i % 3) * 0.9 };
  });
  const sea = Array.from({ length: Math.ceil(o.W / 40) + 3 }, (_, i) => ({ cv: cloudSprite(46, 12, o.phase, o.weather, r), x: i * 40 - 20, y: o.H - 16 + (i % 2) * 4 }));
  const stars = Array.from({ length: 70 }, () => [Math.floor(r() * o.W), Math.floor(r() * (gy - 30)), r()] as const);
  const petals = Array.from({ length: o.stage >= 2 ? 16 : 10 }, () => ({ x: r() * o.W, y: r() * o.H, v: 4 + r() * 5, p: r() * 6 }));
  const flies = Array.from({ length: 14 }, () => ({ x: cx - 160 + r() * 320, y: gy - 20 + r() * 40, p: r() * 6 }));
  const drops = Array.from({ length: 90 }, () => ({ x: r() * o.W, y: r() * o.H, v: 90 + r() * 60 }));
  const night = o.phase === "night", glowy = o.phase === "night" || o.phase === "dusk";

  function draw(c: C, t: number, now: Date) {
    const s = t / 1000;
    c.imageSmoothingEnabled = false;
    c.drawImage(back, 0, 0);
    // sun, moon, stars, god-rays
    const sgt = new Date(now.getTime() + 8 * 3600000), mins = sgt.getUTCHours() * 60 + sgt.getUTCMinutes();
    if (night) {
      for (const [x, y, p] of stars) if ((Math.sin(s * 2 + p * 20) + 1) / 2 > 0.25) rect(c, x, y, 1, 1, p > 0.85 ? "#FFE9A8" : "#F2ECFF");
      const nt = ((mins + 300) % 1440) / 660, mx = Math.round(o.W * 0.15 + nt * o.W * 0.7), my = Math.round(18 + Math.abs(nt - 0.5) * 30);
      ell(c, mx, my, 7, 7, "#FFF6D6"); ell(c, mx + 3, my - 2, 6, 6, SKY.night[0]); rect(c, mx - 4, my + 1, 1, 1, "#E8DDB6");
      if (Math.floor(s / 47) % 5 === 0 && s % 47 < 1.2) { const k = (s % 47) / 1.2; for (let i = 0; i < 6; i++) rect(c, o.W * 0.7 - k * 60 - i * 2, 14 + k * 20 - i, 1, 1, "#FFFFFF"); }
    } else {
      const low = o.phase !== "day", sx = Math.round(o.W * (low ? (o.phase === "dawn" ? 0.18 : 0.82) : 0.78)), sy = low ? gy - 50 : 22;
      if (o.weather !== "rain") { ell(c, sx, sy, 9, 9, low ? "#FFD3A6" : "#FFF7D1"); ell(c, sx, sy, 7, 7, low ? "#FFB27A" : "#FFF0A8"); }
      if (low && o.weather === "clear") { c.save(); c.globalAlpha = 0.07; for (let i = 0; i < 5; i++) { c.fillStyle = "#FFFFFF"; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx - 160 + i * 70, o.H); c.lineTo(sx - 140 + i * 70, o.H); c.closePath(); c.fill(); } c.restore(); }
    }
    c.drawImage(mts, 0, 0);
    // far clouds drift
    for (const cl of clouds) { const x = ((cl.x + s * cl.v) % (o.W + 80)) - 60; c.drawImage(cl.cv, Math.round(x), Math.round(cl.y)); }
    // birds by day
    if (!night && o.weather !== "rain") { const bx = ((s * 14) % (o.W + 120)) - 60, by = 30 + Math.sin(s / 3) * 6; for (let i = 0; i < 3; i++) { const x = bx - i * 7, y = by + i * 3, f = Math.floor(s * 4 + i) % 2; rect(c, x, y, 1, 1, P); rect(c, x - 1, y - f, 1, 1, P); rect(c, x + 1, y - f, 1, 1, P); } }
    // a hot-air balloon drifts across by day
    if (!night && o.weather !== "rain") { const bx = Math.round(((s * 4) % (o.W + 60)) - 30), by = 26 + Math.round(Math.sin(s / 5) * 4); oell(c, bx, by, 6, 7, K.pink); rect(c, bx - 1, by - 7, 2, 14, K.pinkHi); rect(c, bx - 4, by + 6, 1, 4, P); rect(c, bx + 4, by + 6, 1, 4, P); orect(c, bx - 3, by + 10, 7, 3, K.wood); }
    // islets bob slowly, island bobs a little less
    c.drawImage(isl, 0, Math.round(Math.sin(s / 3) * 1.4));
    const bob = Math.round(Math.sin(s / 4));
    c.drawImage(main, 0, bob);
    c.save(); c.translate(0, bob);
    // flags on the castle towers and the clock tower
    for (const [fx, fy] of [[cx, gy - 98], [cx - 30, gy - 76], [cx + 30, gy - 76], [cx - 118, gy - 82]] as const) {
      const f = Math.floor(s * 3 + fx) % 2;
      rect(c, fx + 1, fy, 5, 3, K.pink2); rect(c, fx + 6, fy + f, 2, 2, K.pink2); rect(c, fx + 1, fy + 3, 5, 1, P);
    }
    // clock hands show Singapore time
    const ct = cx - 118, hy = gy - 46, ha = ((mins % 720) / 720) * Math.PI * 2, ma = ((mins % 60) / 60) * Math.PI * 2;
    rect(c, ct + Math.round(Math.sin(ha) * 2), hy - Math.round(Math.cos(ha) * 2), 1, 1, P); rect(c, ct + Math.round(Math.sin(ma) * 4), hy - Math.round(Math.cos(ma) * 4), 1, 1, P);
    rect(c, ct, hy, 1, 1, P);
    // chimney smoke
    for (const [sx0, sy0] of [[cx - 141, gy - 18], [cx + 155, gy - 16]] as const) for (let i = 0; i < 3; i++) {
      const k = ((s * 0.4 + i / 3) % 1), x = sx0 + Math.round(Math.sin(k * 6 + i) * 2 + k * 6), y = sy0 - Math.round(k * 16);
      c.globalAlpha = 0.7 * (1 - k); ell(c, x, y, 1 + Math.round(k * 2), 1 + Math.round(k * 2), night ? "#B9AEDB" : "#FFFFFF"); c.globalAlpha = 1;
    }
    // waterfall shimmer and spray, stream sparkles
    const wfX = cx + 104, wfY = gy + 18;
    for (let y = 0; y < 50; y += 5) rect(c, wfX + 2, wfY + ((y + Math.floor(s * 20)) % 50), 2, 2, K.waterHi);
    for (let i = 0; i < 6; i++) { const k = (s * 1.5 + i / 6) % 1; rect(c, wfX - 3 + i * 2 + Math.round(Math.sin(i + s) * 2), wfY + 48 - Math.round(k * 6), 1, 1, "#FFFFFF"); }
    for (let i = 0; i < 5; i++) if (Math.sin(s * 3 + i * 2) > 0.6) rect(c, cx + 64 + i * 8, gy + 3 + Math.round(i * 3.4), 1, 1, "#FFFFFF");
    // the sakura tree sways (drawn live), petals of the tree
    const tx = cx - 58, ty = gy + 4, sw = Math.round(Math.sin(s / 1.6));
    rect(c, tx - 2, ty - 18, 4, 18, P); rect(c, tx - 1, ty - 18, 2, 18, K.trunk); rect(c, tx + 1, ty - 12, 5, 2, K.trunk); rect(c, tx - 6, ty - 14, 5, 2, K.trunk);
    for (const [dx, dy, rr] of [[0, -26, 12], [-11, -21, 8], [11, -21, 9], [-5, -31, 7], [6, -31, 7]] as const) oell(c, tx + dx + sw, ty + dy, rr, Math.round(rr * 0.75), K.pink);
    for (const [dx, dy, rr] of [[-4, -29, 4], [7, -24, 3], [-10, -22, 3]] as const) ell(c, tx + dx + sw, ty + dy, rr, 2, K.pinkHi);
    for (const [dx, dy] of [[3, -20], [-8, -17], [9, -16], [-2, -24]] as const) rect(c, tx + dx + sw, ty + dy, 2, 1, K.pink2);
    rect(c, tx + 2 + sw, ty - 30, 2, 2, K.gold);
    // stage 3 fountain water and koi; stage 5 windmill blades
    if (o.stage >= 3) { const k = Math.floor(s * 6) % 3; rect(c, cx, gy + 11 - k, 1, 4, K.waterHi); rect(c, cx - 2 + k, gy + 13, 1, 1, K.waterHi); const kx = cx - 74 + Math.round(Math.sin(s / 2) * 5); rect(c, kx, gy - 6, 2, 1, "#FF9E6E"); }
    if (o.stage >= 5) { const a = s * 1.2; for (let b = 0; b < 4; b++) { const ang = a + (b * Math.PI) / 2; for (let i = 2; i < 10; i++) rect(c, cx + 262 + Math.round(Math.cos(ang) * i), gy - 40 + Math.round(Math.sin(ang) * i), 1, 1, i % 3 ? K.wall : P); } }
    // two tiny villagers stroll the paths, a cat naps by the diary cottage
    for (const [i, x0, span, col] of [[0, cx - 70, 30, K.lav], [1, cx + 50, 24, K.pink2]] as const) {
      const k = (Math.sin(s / 6 + i * 2) + 1) / 2, x = Math.round(x0 + k * span), y = gy + 12 + Math.round(k * 2), step = Math.floor(s * 4) % 2;
      rect(c, x - 1, y - 7, 3, 3, "#FFE3D3"); rect(c, x - 1, y - 8, 3, 1, P); rect(c, x - 1, y - 4, 3, 3, col); rect(c, x - 1 + step, y - 1, 1, 1, P); rect(c, x + 1 - step, y - 1, 1, 1, P);
    }
    { const x = cx + 128, y = gy + 18, tw = Math.floor(s * 1.5) % 2; rect(c, x, y - 3, 5, 3, "#F4A86A"); rect(c, x + 4, y - 5, 3, 3, "#F4A86A"); rect(c, x + 4, y - 6, 1, 1, "#F4A86A"); rect(c, x + 6, y - 6, 1, 1, "#F4A86A"); rect(c, x - 1, y - 3 - tw, 1, 2, "#F4A86A"); rect(c, x + 5, y - 4, 1, 1, P); }
    // lit windows and lantern glow after dark
    if (glowy) {
      for (const [x, y, w, h] of wins) { const fl = 0.85 + 0.15 * Math.sin(s * 7 + x); c.globalAlpha = fl; rect(c, x, y, w, h, "#FFD97A"); c.globalAlpha = 1; }
      c.save(); c.globalCompositeOperation = "lighter";
      for (const [x, y, w] of wins) { const g = c.createRadialGradient(x + w / 2, y + 1, 0, x + w / 2, y + 1, 7); g.addColorStop(0, `rgba(255,200,110,${night ? 0.28 : 0.15})`); g.addColorStop(1, "rgba(255,200,110,0)"); c.fillStyle = g; c.fillRect(x - 7, y - 7, w + 14, 16); }
      c.restore();
    }
    c.restore();
    // cloud sea in front
    for (const cl of sea) { const x = ((cl.x + s * 2.4) % (o.W + 46)) - 46; c.drawImage(cl.cv, Math.round(x), Math.round(cl.y)); }
    // petals, butterflies by day, fireflies at dusk and night, rain
    for (const p of petals) { const y = (p.y + s * p.v) % (o.H + 10) - 5, x = (p.x + Math.sin(s + p.p) * 8 + s * 3) % o.W; rect(c, x, y, 2, 1, K.pink); rect(c, x + 1, y + 1, 1, 1, K.pink2); }
    if (o.phase === "day" && o.stage >= 2 && o.weather !== "rain") for (let i = 0; i < 3; i++) { const x = cx - 90 + i * 70 + Math.round(Math.sin(s * 0.7 + i) * 20), y = gy - 8 + Math.round(Math.sin(s * 1.3 + i * 2) * 6), f = Math.floor(s * 6 + i) % 2; rect(c, x - 1 - f, y, 1 + f, 2, [K.gold, K.lav, K.pink2][i]); rect(c, x + 1, y, 1 + f, 2, [K.gold, K.lav, K.pink2][i]); rect(c, x, y, 1, 2, P); }
    if (glowy && o.weather !== "rain") { c.save(); c.globalCompositeOperation = "lighter"; for (const f of flies) { const a = (Math.sin(s * 2 + f.p * 3) + 1) / 2; c.globalAlpha = a; rect(c, f.x + Math.sin(s / 2 + f.p) * 6, f.y + Math.cos(s / 3 + f.p) * 4, 1, 1, "#FFF3A0"); } c.restore(); }
    if (o.weather === "rain") { c.save(); c.globalAlpha = 0.55; for (const d of drops) { const y = (d.y + s * d.v) % o.H, x = (d.x - s * 18) % o.W; rect(c, x < 0 ? x + o.W : x, y, 1, 4, "#E6ECFF"); } c.restore(); }
  }
  return { draw, places };
}

// Time of day from minutes since Singapore midnight.
export function phaseAt(min: number): Phase {
  if (min >= 360 && min < 450) return "dawn";
  if (min >= 450 && min < 1050) return "day";
  if (min >= 1050 && min < 1170) return "dusk";
  return "night";
}
export function weatherFrom(sky: string | undefined): Weather {
  if (!sky) return "clear";
  if (/rain|drizzle|shower|thunder/i.test(sky)) return "rain";
  if (/cloud|overcast|fog|mist/i.test(sky)) return "cloudy";
  return "clear";
}
