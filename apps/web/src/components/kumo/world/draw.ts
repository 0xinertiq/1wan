// The Living World: a code-drawn pixel kingdom on a canvas (no painted art). Pure drawing, no React, so it
// can be rendered and checked on its own. Logical pixels are scaled up nearest-neighbour by the page.
// Static layers (sky and hills, side islets, the island and its buildings) are drawn once per time of day,
// weather and growth stage; only small moving things are drawn every frame.
// Art direction (owner, round 5): chibi storybook kingdom, pastel dusk sky, big soft moon, chunky faceted
// island with roots and crystals, gnarled sakura, waterfall pool, cream and peach castle with raspberry cones,
// slim clock tower, ribbed observatory dome, timber Life Hub cottage, teal pagoda, mossy Dungeon gate.

export type Phase = "dawn" | "day" | "dusk" | "night";
export type Weather = "clear" | "cloudy" | "rain";
export type WorldOpts = { W: number; H: number; phase: Phase; weather: Weather; stage: number; seed?: number };
export type Place = { id: string; label: string; href: string; x: number; y: number; desk: [number, number] };

type C = CanvasRenderingContext2D;
const P = "#4a2538";

const K = {
  grass: "#A8DDB5", grassHi: "#C8EFC9", grassLo: "#7FC394", soil: "#C98F7E", soilLo: "#A8706A",
  rock: "#B79AD6", rock2: "#9A7EC4", rock3: "#7C64AE", rockHi: "#DCD0F6", crack: "#64508F",
  wall: "#FFF4E6", peach: "#FFD9C2", peachLo: "#F2BFA8", rasp: "#E8508A", raspLo: "#C23A72", raspHi: "#FF8DB6",
  blue: "#7DB4F0", blueLo: "#5A8FD6", gold: "#FFD95E", goldLo: "#E7AE4C", teal: "#5FC7BE", tealLo: "#3FA39E", red: "#E2574C",
  moss: "#8FC48A", mossLo: "#6EA86E", mossHi: "#B5DDA8", timber: "#B9805F", timberLo: "#8E5D49",
  lav: "#C9B8F2", lavLo: "#A893E0", dome: "#F4F0FF", brass: "#E2B04A", indigo: "#5B4E9E", indigo2: "#7465B8", indigoHi: "#A79BE0",
  water: "#6FCFD8", waterLo: "#4AAFC0", waterHi: "#C8F3F2", lily: "#7CC79A",
  trunk: "#7A4A5E", trunkLo: "#5E3449", trunkHi: "#9C6577", pink: "#FFB3D1", pink2: "#FF8FBF", pinkHi: "#FFE1EC",
  cloud: "#FFFFFF", cloudPink: "#FFE6F0", cloudLav: "#D9CBF5", win: "#6E8FD0", door: "#8E5D49", ivy: "#7CC79A",
  stone: "#F6D9E6", stoneLo: "#DDB8D8", glow: "#FFB65C", glowHi: "#FFE0A8",
};

const SKY: Record<Phase, [string, string]> = {
  dawn: ["#C9B5EE", "#FFD3C4"], day: ["#9CC4FF", "#FFE3EE"], dusk: ["#B7A3EC", "#FFC4B8"], night: ["#1F1850", "#5B4A9A"],
};
const HILL: Record<Phase, [string, string]> = {
  dawn: ["#E4CDEB", "#D3B9E2"], day: ["#D6CFF4", "#C3B7EC"], dusk: ["#C8AEDF", "#B297D2"], night: ["#2F2763", "#3B3174"],
};
// Tint laid over the static layers (source-atop, so only drawn pixels change).
const TINT: Record<Phase, string | null> = { dawn: "rgba(255,190,170,.12)", day: null, dusk: "rgba(150,90,170,.14)", night: "rgba(46,26,120,.34)" };

// --- tiny pixel helpers -------------------------------------------------------------------------------
function rect(c: C, x: number, y: number, w: number, h: number, col: string) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function ell(c: C, cx: number, cy: number, rx: number, ry: number, col: string, top = false) {
  for (let y = -ry; y <= (top ? 0 : ry); y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); rect(c, cx - w, cy + y, w * 2 + 1, 1, col); }
}
function oell(c: C, cx: number, cy: number, rx: number, ry: number, col: string, top = false) { ell(c, cx, cy, rx + 1, ry + 1, P, top); ell(c, cx, cy, rx, ry, col, top); }
function orect(c: C, x: number, y: number, w: number, h: number, col: string) { rect(c, x - 1, y - 1, w + 2, h + 2, P); rect(c, x, y, w, h, col); }
function tri(c: C, cx: number, top: number, hw: number, h: number, col: string) { for (let i = 0; i < h; i++) { const w = Math.round((hw * (i + 1)) / h); rect(c, cx - w, top + i, w * 2 + 1, 1, col); } }
// A cone roof whose tip leans `lean` pixels sideways, with a soft rounded skirt: chibi storybook style.
function cone(c: C, cx: number, top: number, hw: number, h: number, col: string, lo: string, hi: string, lean = 0) {
  const row = (i: number) => { const t = (i + 1) / h, w = Math.round(hw * Math.pow(t, 0.8)); return { w, x: cx + Math.round(lean * (1 - t)) }; };
  for (let i = -1; i < h; i++) { const { w, x } = row(Math.max(0, i)); rect(c, x - w - 1, top + i, w * 2 + 3, 1, P); }
  for (let i = 0; i < h; i++) { const { w, x } = row(i); rect(c, x - w, top + i, w * 2 + 1, 1, col); if (w > 1) rect(c, x + 1, top + i, w, 1, lo); if (w > 2 && i % 2 === 0) rect(c, x - w + 1, top + i, 1, 1, hi); }
  ell(c, cx, top + h, hw + 2, 2, P); ell(c, cx, top + h - 1, hw + 1, 2, col); rect(c, cx + 1, top + h - 1, hw, 2, lo);
}
function ball(c: C, x: number, y: number) { rect(c, x - 1, y - 1, 4, 4, P); rect(c, x, y, 2, 2, K.gold); rect(c, x, y, 1, 1, "#FFF6C8"); }
function star(c: C, x: number, y: number, col = K.gold) { rect(c, x - 2, y - 1, 5, 3, P); rect(c, x - 1, y - 2, 3, 5, P); rect(c, x - 1, y, 3, 1, col); rect(c, x, y - 1, 1, 3, col); }
const HEART = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];
function heart(c: C, x: number, y: number, col: string, hi: string, outline = false) {
  if (outline) HEART.forEach((row, j) => row.split("").forEach((ch, i) => { if (ch === "X") rect(c, x + i - 1, y + j - 1, 3, 3, P); }));
  HEART.forEach((row, j) => row.split("").forEach((ch, i) => { if (ch === "X") rect(c, x + i, y + j, 1, 1, col); }));
  rect(c, x + 1, y + 1, 3, 1, hi); rect(c, x + 2, y, 1, 3, hi);
}
function heartWin(c: C, x: number, y: number, wins: Win[]) {
  const H5 = ["XX.XX", "XXXXX", ".XXX.", "..X.."];
  H5.forEach((row, j) => row.split("").forEach((ch, i) => { if (ch === "X") rect(c, x + i - 1, y + j - 1, 3, 3, P); }));
  H5.forEach((row, j) => row.split("").forEach((ch, i) => { if (ch === "X") rect(c, x + i, y + j, 1, 1, K.blue); }));
  wins.push([x + 1, y + 1, 3, 2]);
  rect(c, x, y, 1, 1, "#FFFFFF");
}
function archWin(c: C, x: number, y: number, w: number, h: number, wins: Win[], col = K.blue) {
  ell(c, x + Math.floor(w / 2), y, Math.ceil(w / 2), Math.ceil(w / 2), P, true); rect(c, x - 1, y, w + 2, h + 1, P);
  ell(c, x + Math.floor(w / 2), y, Math.floor(w / 2), Math.floor(w / 2), col, true); rect(c, x, y, w, h, col); rect(c, x, y, 1, 1, "#FFFFFF");
  wins.push([x, y - Math.floor(w / 2), w, h + Math.floor(w / 2)]);
}
function roundWin(c: C, x: number, y: number, r: number, wins: Win[], col = K.blue) { oell(c, x, y, r, r, col); rect(c, x - r + 1, y - r + 1, 1, 1, "#FFFFFF"); wins.push([x - r, y - r, r * 2 + 1, r * 2 + 1]); }
function lantern(c: C, x: number, y: number, wins: Win[]) { rect(c, x, y - 12, 1, 12, P); rect(c, x - 3, y - 13, 7, 1, P); orect(c, x + 2, y - 11, 3, 4, K.glowHi); rect(c, x + 2, y - 12, 3, 1, K.rasp); wins.push([x + 2, y - 11, 3, 4]); }
function flowers(c: C, x: number, y: number, n: number, r: () => number) { for (let i = 0; i < n; i++) { const fx = x + Math.round((r() - 0.5) * 14), fy = y + Math.round((r() - 0.5) * 4); rect(c, fx, fy + 1, 1, 2, K.grassLo); rect(c, fx - 1, fy, 3, 1, [K.pink, K.pink2, "#FFFFFF", K.lav][i % 4]); rect(c, fx, fy - 1, 1, 3, [K.pink, K.pink2, "#FFFFFF", K.lav][i % 4]); rect(c, fx, fy, 1, 1, K.gold); } }

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
// The whole island fits inside the box: FIT_W x FIT_H logical pixels (spire tops and labels above the grass
// line, the rock underside below it, a small margin round all of it) are centred, and the page picks the
// scale so this box fills the scene snugly. Nothing is cropped.
export const RX = 176, TOP = 118, BOT = 58, MARGIN = 6;
export const FIT_W = 2 * (RX + 8) + 2 * MARGIN, FIT_H = TOP + BOT + 2 * MARGIN;
export function geometry(W: number, H: number) {
  const cx = Math.round(W / 2), gy = Math.round(Math.max(TOP + MARGIN, (H - TOP - BOT) / 2 + TOP));
  const ct = cx - 122, ob = cx + 116, lh = cx - 152, tx = cx - 66;
  const places: Place[] = [
    { id: "castle", label: "The Castle", href: "#court", x: cx, y: gy - 108, desk: [cx, gy + 8] },
    { id: "clock", label: "Clock Tower", href: "#calendar", x: ct, y: gy - 104, desk: [ct, gy + 6] },
    { id: "obs", label: "Observatory", href: "#observatory", x: ob, y: gy - 46, desk: [ob - 6, gy + 8] },
    { id: "garden", label: "Sakura Garden", href: "#garden", x: tx, y: gy - 50, desk: [tx + 6, gy + 14] },
    { id: "life", label: "Life Hub", href: "#life", x: lh, y: gy - 30, desk: [lh + 6, gy + 20] },
    { id: "diary", label: "Dungeon", href: "#diary", x: cx + 152, y: gy - 14, desk: [cx + 146, gy + 24] },
  ];
  // Spots the fox hops between: rooftops, a lantern, the tree, the path, the Dungeon rock.
  const perches: [number, number][] = [
    [lh - 2, gy - 22], [cx + 70, gy - 30], [tx + 20, gy + 12], [cx + 14, gy + 18], [cx + 152, gy - 6], [ct + 16, gy + 2], [cx - 30, gy - 4], [ob + 24, gy - 4],
  ];
  return { cx, gy, ct, ob, lh, tx, places, perches };
}

// --- static layers ----------------------------------------------------------------------------------------
function drawSky(c: C, o: WorldOpts) {
  const [top, bot] = SKY[o.phase];
  const rain = o.weather === "rain", cloudy = o.weather === "cloudy";
  const steps = 12;
  for (let y = 0; y < o.H; y++) {
    const t = y / o.H, band = Math.floor(t * steps) / steps, next = Math.min(1, band + 1 / steps);
    const dither = (t * steps) % 1 > 0.7 && (y % 2 === 0);
    const wx = (col: string) => (rain ? mix(col, "#9A93B8", 0.4) : cloudy ? mix(col, "#D2C8E4", 0.22) : col);
    rect(c, 0, y, o.W, 1, wx(mix(top, bot, dither ? next : band)));
    if (dither) for (let x = (y % 4) / 2; x < o.W; x += 2) rect(c, x, y, 1, 1, wx(mix(top, bot, band)));
  }
}

function drawHills(c: C, o: WorldOpts, r: () => number) {
  const { gy } = geometry(o.W, o.H);
  const [far, near] = HILL[o.phase], night = o.phase === "night";
  const ridge = (base: number, amp: number, col: string, f: number) => {
    const ph = r() * 10;
    for (let x = 0; x < o.W; x++) { const h = Math.round(amp * (0.55 + 0.3 * Math.sin(x / (30 * f) + ph) + 0.15 * Math.sin(x / (11 * f) + ph * 2))); rect(c, x, base - h, 1, h + 60, col); }
  };
  ridge(gy - 30, 40, far, 1.3);
  // round back trees on the near hills
  ridge(gy - 14, 28, near, 1);
  for (let x = 6; x < o.W; x += 13 + Math.floor(r() * 9)) { const y = gy - 20 - Math.round(r() * 14), rr = 4 + Math.round(r() * 3); ell(c, x, y, rr, rr, night ? "#3F3580" : r() < 0.3 ? "#E9C7E6" : "#C9BEEB"); ell(c, x - 1, y - 2, Math.max(1, rr - 3), 1, night ? "#4D4290" : "#F1EAFF"); }
  // thick cloud bank the island floats over: white-pink puffs, lavender undersides
  const hi = night ? "#4E4290" : K.cloud, mid = night ? "#43397F" : K.cloudPink, lo = night ? "#352C6C" : K.cloudLav;
  for (const [dy, sz, step] of [[-4, 10, 15], [8, 12, 18], [22, 14, 20]] as const) for (let x = -10 + dy; x < o.W + 20; x += step) {
    const rr = sz + Math.round(r() * 6), y = gy + dy + Math.round(r() * 5);
    ell(c, x, y + 2, rr + 1, Math.round(rr * 0.6) + 1, lo); ell(c, x, y, rr, Math.round(rr * 0.6), mid); ell(c, x - 2, y - 2, Math.round(rr * 0.6), Math.round(rr * 0.3), hi);
  }
  for (let y = gy + 30; y < o.H; y++) rect(c, 0, y, o.W, 1, mix(mid, lo, Math.min(1, (y - gy - 30) / 30)));
}

function cloudSprite(w: number, h: number, phase: Phase, weather: Weather, r: () => number, face = false) {
  const cv = canvas(w + 4, h + 4), c = cv.getContext("2d")!;
  const fill = weather === "rain" ? "#DCD6EA" : K.cloud, lo = weather === "rain" ? "#BDB5D3" : K.cloudLav, line = weather === "rain" ? "#A79DC4" : "#C8B6EC";
  const blobs = 3 + Math.floor(r() * 3);
  const parts: [number, number, number, number][] = [];
  for (let i = 0; i < blobs; i++) { const rx = Math.round(w * (0.2 + r() * 0.12)), ry = Math.round(h * (0.42 + r() * 0.25)); parts.push([Math.round(rx + 2 + (i / Math.max(1, blobs - 1)) * (w - rx * 2)), Math.round(h + 1 - ry), rx, ry]); }
  for (const [x, y, rx, ry] of parts) ell(c, x, y, rx + 1, ry + 1, line);
  rect(c, 2, h, w, 3, line);
  for (const [x, y, rx, ry] of parts) ell(c, x, y, rx, ry, fill);
  rect(c, 3, h, w - 2, 2, lo);
  for (const [x, y, rx, ry] of parts) rect(c, x - Math.round(rx / 2), y - ry + 1, Math.round(rx / 2), 1, K.pinkHi);
  if (face && w > 20) { const fx = Math.round(w / 2) + 2, fy = h - 3; rect(c, fx - 3, fy, 1, 2, P); rect(c, fx + 3, fy, 1, 2, P); rect(c, fx - 5, fy + 2, 2, 1, K.pink); rect(c, fx + 4, fy + 2, 2, 1, K.pink); rect(c, fx - 1, fy + 2, 1, 1, P); rect(c, fx, fy + 3, 1, 1, P); rect(c, fx + 1, fy + 2, 1, 1, P); }
  tint(cv, phase === "night" ? "rgba(70,50,160,.5)" : TINT[phase]);
  return cv;
}

function islet(c: C, x: number, y: number, w: number, r: () => number, top: "tree" | "pink" | "none" = "tree") {
  for (let i = 0; i < 16; i++) {
    const hw = Math.round((w / 2) * Math.pow(1 - i / 16, 0.8) + (r() - 0.5) * 2); if (hw <= 0) continue;
    rect(c, x - hw - 1, y + i, hw * 2 + 3, 1, P);
    rect(c, x - hw, y + i, hw * 2 + 1, 1, i < 3 ? K.soil : (Math.floor((i * 0.7 + hw) / 5) % 2 ? K.rock : K.rock2));
    rect(c, x - hw, y + i, 1, 1, K.rockHi);
  }
  oell(c, x, y, Math.round(w / 2), 4, K.grass); ell(c, x - 2, y - 1, Math.round(w / 3), 2, K.grassHi);
  if (top === "tree") { rect(c, x - 1, y - 9, 3, 8, K.trunk); oell(c, x, y - 13, 6, 5, K.lily); ell(c, x - 2, y - 15, 3, 2, K.mossHi); }
  if (top === "pink") { rect(c, x - 1, y - 9, 3, 8, K.trunk); oell(c, x, y - 13, 7, 5, K.pink); ell(c, x - 2, y - 15, 3, 2, K.pinkHi); }
  rect(c, x - 3, y + 16, 1, 4, K.trunkLo); rect(c, x + 4, y + 14, 1, 5, K.trunkLo);
}

// Window rectangles collected while drawing buildings; lit warm orange after dark.
type Win = [number, number, number, number];

function drawIsland(c: C, o: WorldOpts, r: () => number, wins: Win[]) {
  const { cx, gy, ct, ob, lh, tx } = geometry(o.W, o.H);
  // underside: soil band, then faceted lavender rock tapering to a point, cracks, roots, crystals
  const D = 46;
  for (let i = 0; i < D; i++) {
    const t = i / D, hw = Math.round(RX * Math.pow(1 - t, 0.8) * (0.96 + 0.05 * Math.sin(i * 1.3)));
    if (hw <= 0) continue;
    const y = gy + 10 + i;
    rect(c, cx - hw - 1, y, hw * 2 + 3, 1, P);
    if (i < 6) { rect(c, cx - hw, y, hw * 2 + 1, 1, i % 3 === 2 ? K.soilLo : K.soil); continue; }
    // facets: wide diagonal bands, drawn as runs
    for (let x = -hw; x <= hw;) {
      const f = Math.floor((x + i * 0.6 + 400) / 26), end = Math.min(hw + 1, Math.ceil((f + 1) * 26 - i * 0.6 - 400));
      const col = [K.rock, K.rock2, K.rockHi, K.rock2, K.rock3][f % 5];
      const nx = Math.max(x + 1, end);
      rect(c, cx + x, y, nx - x, 1, col); x = nx;
    }
    rect(c, cx - hw, y, 2, 1, K.rockHi);
  }
  for (let k = 0; k < 14; k++) { let x = cx - 110 + Math.floor(r() * 220), y = gy + 18 + Math.floor(r() * 18); for (let j = 0; j < 5; j++) { rect(c, x, y, 1, 1, K.crack); x += r() < 0.5 ? 1 : -1; y += 1; } }
  for (let k = 0; k < 18; k++) { const x = cx - 160 + Math.floor(r() * 320), len = 4 + Math.floor(r() * 12); for (let j = 0; j < len; j++) rect(c, x + Math.round(Math.sin(j / 2 + k) * 1), gy + 14 + j, 1, 1, j % 4 === 3 ? K.trunkHi : K.trunk); }
  for (const [x, y, col] of [[cx - 22, gy + 42, "#CFC2FF"], [cx + 16, gy + 44, "#9EE6E0"], [cx - 4, gy + 50, "#FFC2DD"], [cx + 70, gy + 28, "#CFC2FF"], [cx - 90, gy + 28, "#9EE6E0"]] as const) {
    rect(c, x - 2, y - 1, 5, 6, P); rect(c, x - 1, y, 3, 4, col); rect(c, x, y + 4, 1, 2, col); rect(c, x - 1, y, 1, 1, "#FFFFFF");
  }
  // grass top with a thick rounded lip
  ell(c, cx, gy + 8, RX + 1, 23, P); ell(c, cx, gy + 8, RX, 22, K.grassLo);
  oell(c, cx, gy, RX, 22, K.grass);
  ell(c, cx - 6, gy - 4, RX - 14, 15, K.grassHi);
  ell(c, cx, gy, RX - 24, 14, K.grass);
  for (let k = 0; k < 120; k++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); const x = cx + Math.cos(a) * d * (RX - 6), y = gy + Math.sin(a) * d * 19; rect(c, x, y, 1, 1, r() < 0.5 ? K.grassLo : K.grassHi); }

  // round back trees along the rim (behind buildings)
  for (let k = 0; k < 18; k++) {
    const a = Math.PI + 0.1 + (k / 17) * (Math.PI - 0.2), x = Math.round(cx + Math.cos(a) * (RX - 10)), y = Math.round(gy + Math.sin(a) * 18);
    if (Math.abs(x - cx) < 40) continue;
    const pink = k % 3 === 1;
    rect(c, x - 1, y - 5, 2, 5, K.trunk); oell(c, x, y - 10, 6, 6, pink ? K.pink : K.lily); ell(c, x - 2, y - 13, 3, 1, pink ? K.pinkHi : K.mossHi);
  }

  // waterfall pool: glossy teal with ripple bands, foam, lily pads, floating blossoms, stones; spills off the rim
  const px = cx + 48, py = gy + 4;
  for (const [dx, dy] of [[-17, 0], [-13, -4], [-6, -6], [4, -6], [12, -4], [17, 0], [13, 4], [4, 6], [-6, 6], [-13, 4]] as const) oell(c, px + dx, py + dy, 2, 1, K.stone);
  oell(c, px, py, 16, 5, K.waterLo); ell(c, px, py - 1, 15, 4, K.water);
  for (const dy of [-3, -1, 1]) rect(c, px - 10 + Math.abs(dy) * 2, py + dy, 20 - Math.abs(dy) * 4, 1, dy === -3 ? K.waterHi : K.waterLo);
  for (const [dx, dy] of [[-8, 1], [6, 2]] as const) { ell(c, px + dx, py + dy, 2, 1, K.lily); rect(c, px + dx + 1, py + dy, 1, 1, K.water); }
  rect(c, px - 3, py + 2, 2, 1, K.pink2); rect(c, px + 10, py - 2, 2, 1, K.pink);
  for (let i = 0; i < 26; i++) { const x = px + 14 + i, y = py + 2 + Math.round(i * 0.55); rect(c, x - 1, y - 1, 4, 4, P); rect(c, x, y, 2, 2, K.water); }
  const wfX = px + 40, wfY = gy + 18;
  orect(c, wfX, wfY, 7, 32, K.water); for (let y = wfY; y < wfY + 32; y += 3) rect(c, wfX + 1 + (y % 2), y, 1, 2, K.waterHi);

  // paths: castle stairs to the front, stepping stones to the cottages, a little signpost
  for (let y = gy - 2; y <= gy + 20; y++) { const hw = 5 + Math.round((y - gy) * 0.25), bend = Math.round(Math.sin((y - gy) / 6) * 2); rect(c, cx - hw - 1 + bend, y, hw * 2 + 3, 1, K.stoneLo); rect(c, cx - hw + bend, y, hw * 2 + 1, 1, y % 3 === 0 ? K.stone : "#FBE7D6"); }
  for (let i = 0; i < 9; i++) oell(c, cx - 20 - i * 13, gy + 12 + Math.round(i * 1.1), 3, 1, K.stone);
  for (let i = 0; i < 7; i++) oell(c, cx + 24 + i * 14, gy + 14 + Math.round(i * 1.3), 3, 1, K.stone);
  orect(c, cx - 16, gy + 2, 1, 9, K.timber); orect(c, cx - 22, gy + 1, 9, 3, K.peach); rect(c, cx - 21, gy + 2, 5, 1, K.timberLo);

  // rim bushes, flowers across the grass
  for (let k = 0; k < 24; k++) {
    const a = 0.08 + (k / 23) * (Math.PI - 0.16), x = Math.round(cx + Math.cos(a) * (RX - 4)), y = Math.round(gy + Math.sin(a) * 20) - 1;
    if (Math.abs(x - cx) < 14 || Math.abs(x - (wfX + 3)) < 8) continue;
    oell(c, x, y, 4, 3, k % 4 === 2 ? K.pink : K.lily); rect(c, x - 2, y - 2, 2, 1, k % 4 === 2 ? K.pinkHi : K.mossHi);
  }
  for (let k = 0; k < 70; k++) { const a = r() * Math.PI * 2, d = 0.3 + Math.sqrt(r()) * 0.65, x = cx + Math.cos(a) * d * (RX - 12), y = gy + Math.sin(a) * d * 17; if (Math.abs(x - cx) < 12) continue; rect(c, x, y, 1, 1, [K.pink, "#FFFFFF", K.gold, K.lav, K.pink2][k % 5]); }

  // ---- buildings, back to front ----
  drawClockTower(c, ct, gy, wins);
  drawCastle(c, cx, gy, wins);
  drawPagoda(c, cx + 72, gy - 4, wins);
  drawObservatory(c, ob, gy, wins);
  drawTreeTrunk(c, tx, gy + 2);
  drawCottage(c, lh, gy + 10, wins);
  drawDungeon(c, cx + 152, gy + 12, wins);
  // Chief Kumo's own little cloud, floating right of the castle (his sprite stands on it)
  for (const [dx, dy, rr] of [[-7, 1, 5], [0, 0, 7], [7, 1, 5]] as const) oell(c, cx + 58 + dx, gy - 54 + dy, rr, 3, K.cloud);
  rect(c, cx + 50, gy - 52, 16, 2, K.cloudLav); rect(c, cx + 54, gy - 56, 4, 1, K.pinkHi);

  // cosy details: picnic blanket and basket, lanterns, flower patches, mushrooms
  { const bx = cx - 34, by = gy + 12;
    for (let j = 0; j < 6; j++) for (let i = 0; i < 14; i++) rect(c, bx + i + Math.round(j * 0.6), by + j, 1, 1, ((i >> 1) + (j >> 1)) % 2 ? "#FFFFFF" : K.pink2);
    rect(c, bx - 1, by - 1, 16, 1, P); rect(c, bx + 3, by + 6, 16, 1, P);
    orect(c, bx + 9, by - 3, 6, 4, K.timber); rect(c, bx + 9, by - 2, 6, 1, K.timberLo); rect(c, bx + 10, by - 6, 1, 3, P); rect(c, bx + 13, by - 6, 1, 3, P); rect(c, bx + 10, by - 6, 4, 1, P); rect(c, bx + 11, by - 4, 2, 1, K.red); }
  const lan: [number, number][] = [[cx - 16, gy + 20], [cx + 18, gy + 20]];
  if (o.stage >= 2) lan.push([cx - 92, gy + 8], [cx + 96, gy + 2]);
  if (o.stage >= 4) lan.push([cx - 44, gy - 4], [cx + 34, gy - 2]);
  for (const [x, y] of lan) lantern(c, x, y, wins);
  flowers(c, cx - 106, gy + 4, 6, r); flowers(c, cx + 28, gy + 8, 5, r); flowers(c, tx - 18, gy + 10, 6, r);
  if (o.stage >= 2) { flowers(c, cx - 70, gy + 16, 5, r); flowers(c, cx + 64, gy + 16, 5, r); }
  for (const [x, y] of [[cx - 80, gy + 8], [cx - 42, gy + 16], [cx + 102, gy + 14]] as const) { rect(c, x, y - 2, 2, 3, "#FFF4EC"); oell(c, x + 1, y - 3, 2, 1, K.rasp); rect(c, x, y - 4, 1, 1, "#FFFFFF"); }
  if (o.stage >= 3) { oell(c, cx, gy + 24, 9, 3, K.stone); ell(c, cx, gy + 24, 7, 2, K.water); orect(c, cx - 1, gy + 17, 2, 6, K.stone); oell(c, cx, gy + 17, 3, 1, K.stone); }
}

function drawCastle(c: C, cx: number, gy: number, wins: Win[]) {
  const cb = gy - 4;
  // puffy cloud base with two smiling cloud blobs and a curved staircase
  for (const [dx, rr] of [[-32, 8], [-18, 10], [0, 11], [18, 10], [32, 8]] as const) oell(c, cx + dx, cb - 1, rr, 5, K.cloud);
  rect(c, cx - 36, cb + 1, 72, 2, K.cloudLav);
  for (const bx of [cx - 36, cx + 36]) { oell(c, bx, cb + 2, 6, 4, K.cloud); rect(c, bx - 2, cb + 1, 1, 2, P); rect(c, bx + 2, cb + 1, 1, 2, P); rect(c, bx - 1, cb + 4, 3, 1, P); rect(c, bx - 4, cb + 3, 2, 1, K.pink); rect(c, bx + 3, cb + 3, 2, 1, K.pink); }
  for (let i = 0; i < 6; i++) orect(c, cx - 7 + Math.round(Math.sin(i / 2) * 2), cb + i * 2, 14, 1, i % 2 ? K.peach : K.wall);
  // keep
  orect(c, cx - 24, cb - 40, 48, 38, K.wall); rect(c, cx + 16, cb - 40, 8, 38, K.peach); rect(c, cx - 24, cb - 6, 48, 4, K.peach);
  for (let x = cx - 24; x < cx + 24; x += 5) { orect(c, x, cb - 44, 3, 3, K.peach); }
  // side towers with raspberry cones (crooked) and gold ball finials
  orect(c, cx - 38, cb - 54, 14, 52, K.wall); rect(c, cx - 29, cb - 54, 5, 52, K.peach);
  cone(c, cx - 31, cb - 74, 10, 20, K.rasp, K.raspLo, K.raspHi, -3); ball(c, cx - 35, cb - 78);
  orect(c, cx + 24, cb - 58, 14, 56, K.wall); rect(c, cx + 33, cb - 58, 5, 56, K.peach);
  cone(c, cx + 31, cb - 78, 10, 20, K.rasp, K.raspLo, K.raspHi, 3); ball(c, cx + 33, cb - 82);
  // tall centre tower and its cone; the flag is drawn live
  orect(c, cx - 10, cb - 72, 20, 32, K.wall); rect(c, cx + 4, cb - 72, 6, 32, K.peach);
  cone(c, cx, cb - 96, 13, 24, K.rasp, K.raspLo, K.raspHi, 1); ball(c, cx, cb - 100);
  // windows: small blue arches, heart windows, a round rose window
  roundWin(c, cx, cb - 60, 4, wins); rect(c, cx, cb - 64, 1, 9, P); rect(c, cx - 4, cb - 60, 9, 1, P);
  for (const tx of [cx - 31, cx + 31]) { archWin(c, tx - 1, tx < cx ? cb - 42 : cb - 46, 3, 4, wins); heartWin(c, tx - 2, tx < cx ? cb - 28 : cb - 32, wins); }
  for (const wx of [cx - 18, cx + 13]) archWin(c, wx, cb - 30, 4, 6, wins);
  heartWin(c, cx - 2, cb - 38, wins);
  // tall arched doorway with blue trim
  ell(c, cx, cb - 18, 8, 8, P, true); rect(c, cx - 8, cb - 18, 17, 16, P);
  ell(c, cx, cb - 18, 7, 7, K.blue, true); rect(c, cx - 7, cb - 18, 15, 16, K.blue);
  ell(c, cx, cb - 18, 5, 5, K.door, true); rect(c, cx - 5, cb - 18, 11, 16, K.door);
  rect(c, cx, cb - 23, 1, 21, K.timberLo); rect(c, cx + 2, cb - 10, 1, 1, K.gold);
  rect(c, cx - 23, cb - 39, 1, 30, "#FFFFFF");
  // rainbow pennants between the towers
  const RB = [K.rasp, "#FFA55C", K.gold, "#8DD69E", K.blue, K.lavLo];
  for (const [x0, y0, x1, y1] of [[cx - 31, cb - 52, cx - 10, cb - 66], [cx + 10, cb - 66, cx + 31, cb - 56]] as const) {
    const n = 22; for (let i = 0; i <= n; i++) { const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n + Math.round(3 * Math.sin((i / n) * Math.PI)); rect(c, x, y, 1, 1, P); if (i % 4 === 2) { rect(c, x - 1, y + 1, 3, 1, RB[(i / 4) | 0]); rect(c, x, y + 2, 1, 1, RB[(i / 4) | 0]); } }
  }
}

function drawClockTower(c: C, ct: number, gy: number, wins: Win[]) {
  orect(c, ct - 13, gy - 14, 26, 14, K.wall); rect(c, ct + 6, gy - 14, 7, 14, K.peach);
  cone(c, ct, gy - 24, 15, 8, K.rasp, K.raspLo, K.raspHi);
  orect(c, ct - 7, gy - 58, 14, 34, K.wall); rect(c, ct + 3, gy - 58, 4, 34, K.peach);
  cone(c, ct, gy - 46, 10, 5, K.lav, K.lavLo, "#E6DCFF");
  for (const wy of [gy - 36, gy - 54]) archWin(c, ct - 1, wy, 3, 4, wins);
  // the clock housing and its big round face with a gold ring (hands drawn live)
  orect(c, ct - 10, gy - 80, 20, 22, K.wall); rect(c, ct + 5, gy - 80, 5, 22, K.peach);
  oell(c, ct, gy - 69, 8, 8, K.gold); ell(c, ct, gy - 69, 6, 6, "#FFF9EA");
  for (const [dx, dy] of [[0, -5], [5, 0], [0, 5], [-5, 0]] as const) rect(c, ct + dx, gy - 69 + dy, 1, 1, P);
  cone(c, ct, gy - 100, 11, 20, K.rasp, K.raspLo, K.raspHi, 2);
  star(c, ct + 2, gy - 103);
  ell(c, ct, gy - 8, 3, 3, P, true); orect(c, ct - 3, gy - 8, 6, 8, K.door);
}

function drawObservatory(c: C, ob: number, gy: number, wins: Win[]) {
  // faceted indigo rock it sits on
  for (let i = 0; i < 12; i++) { const hw = 24 - Math.round(Math.abs(i - 4) * 1.6), y = gy - 8 + i; rect(c, ob - hw - 1, y, hw * 2 + 3, 1, P); rect(c, ob - hw, y, hw, 1, i < 4 ? K.indigoHi : K.indigo2); rect(c, ob, y, hw + 1, 1, K.indigo); }
  orect(c, ob - 17, gy - 26, 34, 18, K.wall); rect(c, ob + 10, gy - 26, 7, 18, K.peach);
  for (const wx of [ob - 10, ob + 6]) roundWin(c, wx, gy - 17, 3, wins, K.glow);
  // white-lavender ribbed dome with a brass band
  oell(c, ob, gy - 27, 18, 16, K.dome, true);
  for (let i = -15; i <= 15; i += 5) { const h = Math.round(16 * Math.sqrt(Math.max(0, 1 - (i * i) / 324))); rect(c, ob + i, gy - 27 - h + 1, 1, h, K.lav); }
  ell(c, ob - 6, gy - 36, 4, 3, "#FFFFFF", true);
  rect(c, ob - 19, gy - 28, 39, 3, P); rect(c, ob - 18, gy - 27, 37, 1, K.brass);
  rect(c, ob - 1, gy - 42, 3, 14, K.lavLo);
  // telescope on a stand
  const tx = ob + 26, ty = gy - 10;
  rect(c, tx, ty, 1, 8, P); rect(c, tx - 3, ty + 7, 1, 2, P); rect(c, tx + 3, ty + 7, 1, 2, P);
  for (let i = 0; i < 10; i++) rect(c, tx - 4 + i, ty - 2 - Math.round(i * 0.6), 3, 3, P);
  for (let i = 0; i < 10; i++) rect(c, tx - 3 + i, ty - 1 - Math.round(i * 0.6), 2, 1, i < 3 ? K.brass : K.indigo);
}

function drawTreeTrunk(c: C, x: number, base: number) {
  // gnarled plum-brown trunk twisting up, roots spreading over the grass (the canopy sways, drawn live)
  for (let i = 0; i < 24; i++) { const off = Math.round(Math.sin(i / 4) * 2.5), w = 6 - Math.floor(i / 8); rect(c, x + off - w / 2 - 1, base - i, w + 2, 1, P); rect(c, x + off - w / 2, base - i, w, 1, K.trunk); rect(c, x + off + w / 2 - 2, base - i, 1, 1, K.trunkLo); if (i % 5 === 1) rect(c, x + off - w / 2, base - i, 1, 1, K.trunkHi); }
  for (const [dx, len, dir] of [[-3, 9, -1], [3, 8, 1], [0, 6, -1], [1, 5, 1]] as const) for (let j = 0; j < len; j++) rect(c, x + dx + dir * j, base + Math.round(j * 0.25), 2, 1, j === len - 1 ? P : K.trunk);
  for (const [dx, dy, len, dir] of [[-2, -14, 8, -1], [2, -17, 9, 1], [0, -21, 6, -1]] as const) for (let j = 0; j < len; j++) { rect(c, x + dx + dir * j, base + dy - Math.round(j * 0.6) - 1, 2, 3, P); rect(c, x + dx + dir * j, base + dy - Math.round(j * 0.6), 2, 1, K.trunk); }
}

function drawPagoda(c: C, x: number, base: number, wins: Win[]) {
  for (const dx of [-8, 8]) orect(c, x + dx, base - 14, 2, 14, K.red);
  orect(c, x - 9, base - 9, 18, 2, K.timber);
  const roof = (y: number, hw: number) => {
    rect(c, x - hw - 2, y + 4, hw * 2 + 5, 2, P); rect(c, x - hw - 3, y + 2, 2, 3, P); rect(c, x + hw + 2, y + 2, 2, 3, P);
    tri(c, x, y - 4, hw, 8, P); tri(c, x, y - 3, hw - 1, 7, K.teal); rect(c, x + 1, y + 1, hw - 2, 2, K.tealLo);
    rect(c, x - hw - 1, y + 4, hw * 2 + 3, 1, K.red); rect(c, x - hw - 2, y + 3, 1, 1, K.red); rect(c, x + hw + 2, y + 3, 1, 1, K.red);
  };
  roof(base - 19, 13); orect(c, x - 5, base - 26, 10, 5, K.wall); roof(base - 31, 9);
  rect(c, x, base - 39, 1, 4, P); ball(c, x - 1, base - 41);
  orect(c, x + 6, base - 17, 2, 3, K.glowHi); wins.push([x + 6, base - 17, 2, 3]);
}

function drawCottage(c: C, x: number, base: number, wins: Win[]) {
  // timber-frame walls
  orect(c, x - 14, base - 20, 28, 20, K.wall); rect(c, x + 8, base - 20, 6, 20, K.peach);
  for (const bx of [x - 14, x - 1, x + 13]) rect(c, bx, base - 20, 1, 20, K.timber);
  rect(c, x - 14, base - 12, 28, 1, K.timber); for (let i = 0; i < 7; i++) rect(c, x - 13 + i, base - 19 + i, 1, 1, K.timberLo);
  // moss-green scalloped roof tiles
  oell(c, x, base - 20, 19, 12, K.moss, true);
  for (let row = 0; row < 4; row++) for (let i = -16 + (row % 2) * 3; i <= 16; i += 6) { const y = base - 21 - row * 3; const w = Math.round(19 * Math.sqrt(Math.max(0, 1 - ((row * 3 + 1) ** 2) / 144))); if (Math.abs(i) < w - 1) { rect(c, x + i - 1, y, 3, 1, K.mossLo); rect(c, x + i, y - 1, 1, 1, K.mossHi); } }
  orect(c, x + 7, base - 34, 4, 6, K.stone);
  // round window, striped awning over an arched wooden door, hanging lantern
  roundWin(c, x - 7, base - 7, 3, wins, K.blue);
  ell(c, x + 6, base - 8, 3, 3, P, true); orect(c, x + 3, base - 8, 6, 8, K.door); rect(c, x + 7, base - 4, 1, 1, K.gold);
  for (let i = 0; i < 12; i++) { rect(c, x + i, base - 12, 1, 3, Math.floor(i / 2) % 2 ? "#FFF4E6" : K.lily); rect(c, x + i, base - 9, 1, 1 + (i % 2), Math.floor(i / 2) % 2 ? "#FFF4E6" : K.lily); }
  rect(c, x - 1, base - 13, 14, 1, P);
  lantern(c, x - 16, base - 4, wins);
  // black cat napping on the roof, small cat at the door
  { const kx = x - 6, ky = base - 31; rect(c, kx, ky, 6, 3, "#2C2238"); rect(c, kx + 4, ky - 2, 3, 3, "#2C2238"); rect(c, kx + 4, ky - 3, 1, 1, "#2C2238"); rect(c, kx + 6, ky - 3, 1, 1, "#2C2238"); rect(c, kx + 5, ky - 1, 1, 1, K.gold); }
  { const kx = x + 15, ky = base; rect(c, kx, ky - 4, 4, 4, "#FFE0C2"); rect(c, kx, ky - 7, 4, 3, "#FFE0C2"); rect(c, kx, ky - 8, 1, 1, "#FFE0C2"); rect(c, kx + 3, ky - 8, 1, 1, "#FFE0C2"); rect(c, kx + 1, ky - 6, 1, 1, P); rect(c, kx + 3, ky - 6, 1, 1, P); rect(c, kx + 4, ky - 3, 2, 1, "#FFE0C2"); rect(c, kx, ky - 5, 1, 1, K.pink); }
  // flower beds
  for (const fx of [x - 12, x - 4]) { orect(c, fx, base + 1, 6, 2, K.timber); for (let i = 0; i < 3; i++) rect(c, fx + i * 2, base - 1, 1, 2, [K.pink2, K.gold, K.lav][i]); }
}

function drawDungeon(c: C, gx: number, gb: number, wins: Win[]) {
  oell(c, gx, gb - 9, 18, 14, "#E9B8CF", true); ell(c, gx + 6, gb - 12, 8, 9, "#D79BBD", true); ell(c, gx - 9, gb - 6, 4, 3, "#F6D3E2", true);
  for (const [dx, dy] of [[-13, -15], [-4, -22], [5, -21], [13, -14], [-16, -8], [15, -6]]) { rect(c, gx + dx, gb + dy, 3, 2, K.ivy); rect(c, gx + dx + 1, gb + dy - 1, 1, 1, "#A6DDB8"); }
  ell(c, gx, gb - 12, 6, 6, P, true); rect(c, gx - 6, gb - 12, 13, 12, P); ell(c, gx, gb - 12, 5, 5, "#6B4E7A", true); rect(c, gx - 5, gb - 12, 11, 12, "#6B4E7A");
  for (const dx of [-3, 0, 3]) rect(c, gx + dx, gb - 15, 1, 15, "#5A3F69");
  rect(c, gx, gb - 9, 1, 1, K.gold); rect(c, gx, gb - 8, 1, 2, K.gold); wins.push([gx, gb - 9, 1, 3]);
  lantern(c, gx + 15, gb, wins);
}

function drawIslets(c: C, o: WorldOpts, r: () => number, wins: Win[]) {
  const { cx, gy } = geometry(o.W, o.H);
  islet(c, cx - 232, gy - 52, 44, r, "pink");
  islet(c, cx + 236, gy - 64, 36, r, "tree");
  islet(c, cx - 196, gy - 104, 26, r, "none");
  orect(c, cx - 202, gy - 114, 2, 9, K.wall); orect(c, cx - 190, gy - 114, 2, 9, K.wall); cone(c, cx - 196, gy - 126, 9, 9, K.lav, K.lavLo, "#E6DCFF");
  islet(c, cx + 206, gy - 118, 30, r, "pink");
  // little floating rocks round the island
  for (const [x, y, w] of [[cx - 200, gy + 26, 10], [cx + 204, gy + 30, 12], [cx - 140, gy + 46, 7], [cx + 146, gy + 44, 8]] as const) {
    for (let i = 0; i < 6; i++) { const hw = Math.round((w / 2) * (1 - i / 6)); rect(c, x - hw - 1, y + i, hw * 2 + 3, 1, P); rect(c, x - hw, y + i, hw * 2 + 1, 1, i < 2 ? K.rockHi : K.rock2); }
  }
  if (o.stage >= 4) {
    for (let i = 0; i <= 44; i++) { const x = cx - 212 + i * 0.9, y = gy - 46 + Math.round(8 * Math.sin((i / 44) * Math.PI)); rect(c, x, y, 1, 1, P); if (i % 4 === 0) rect(c, x, y - 3, 1, 3, K.timber); }
    roundWin(c, cx - 232, gy - 60, 2, wins, K.glow);
  }
  if (o.stage >= 5) { islet(c, cx + 246, gy - 18, 48, r, "none"); orect(c, cx + 240, gy - 40, 12, 22, K.wall); cone(c, cx + 246, gy - 52, 8, 12, K.rasp, K.raspLo, K.raspHi); }
}

// --- the live world -------------------------------------------------------------------------------------------
export type World = { draw: (c: C, t: number, now: Date) => void; cheer: (t: number) => void; places: Place[] };

export function makeWorld(o: WorldOpts): World {
  const seed = o.seed ?? 7, r = rng(seed);
  const { cx, gy, ct, ob, tx, places } = geometry(o.W, o.H);
  const wins: Win[] = [];
  const back = canvas(o.W, o.H), bc = back.getContext("2d")!;
  drawSky(bc, o);
  const hills = canvas(o.W, o.H); drawHills(hills.getContext("2d")!, o, r); tint(hills, o.weather === "rain" ? "rgba(90,84,120,.2)" : null);
  const isl = canvas(o.W, o.H); drawIslets(isl.getContext("2d")!, o, r, wins); tint(isl, TINT[o.phase]);
  const main = canvas(o.W, o.H); drawIsland(main.getContext("2d")!, o, r, wins); tint(main, TINT[o.phase]); tint(main, o.weather === "rain" ? "rgba(70,70,110,.16)" : null);
  const clouds = Array.from({ length: o.weather === "clear" ? 6 : 10 }, (_, i) => {
    const w = 26 + Math.floor(r() * 30);
    return { cv: cloudSprite(w, 9 + Math.floor(r() * 6), o.phase, o.weather, r, i % 3 === 0), x: r() * (o.W + 80), y: 4 + r() * Math.max(10, gy - 110), v: 1.2 + (i % 3) * 0.9 };
  });
  const sea = Array.from({ length: Math.ceil(o.W / 36) + 3 }, (_, i) => ({ cv: cloudSprite(44, 12, o.phase, o.weather, r, i % 5 === 2), x: i * 36 - 20, y: Math.max(o.H - 10, gy + BOT) + (i % 2) * 3 }));
  const stars = Array.from({ length: 80 }, () => [Math.floor(r() * o.W), Math.floor(r() * (gy - 40)), r()] as const);
  const petals = Array.from({ length: o.stage >= 2 ? 22 : 14 }, () => ({ x: r() * o.W, y: r() * o.H, v: 4 + r() * 5, p: r() * 6, big: r() < 0.3 }));
  const lights = Array.from({ length: 16 }, () => ({ x: cx - 170 + r() * 340, y: gy - 60 + r() * 70, p: r() * 6 }));
  const drops = Array.from({ length: 90 }, () => ({ x: r() * o.W, y: r() * o.H, v: 90 + r() * 60 }));
  const ambient = Array.from({ length: 4 }, (_, i) => ({ x: cx - 140 + i * 90 + r() * 30, p: i / 4 }));
  const hearts: { x: number; y: number; t0: number; dx: number }[] = [];
  const night = o.phase === "night", glowy = night || o.phase === "dusk";
  const moon = { x: ct + 8, y: gy - 84, r: 17 };

  function cheer(t: number) { for (let i = 0; i < 9; i++) hearts.push({ x: cx - 60 + r() * 120, y: gy - 10 + r() * 20, t0: t + i * 90, dx: (r() - 0.5) * 16 }); }

  function draw(c: C, t: number, now: Date) {
    const s = t / 1000;
    c.imageSmoothingEnabled = false;
    c.drawImage(back, 0, 0);
    const sgt = new Date(now.getTime() + 8 * 3600000), mins = sgt.getUTCHours() * 60 + sgt.getUTCMinutes();
    if (night) {
      for (const [x, y, p] of stars) { const tw = (Math.sin(s * 2 + p * 20) + 1) / 2; if (tw < 0.2) continue; const col = p > 0.85 ? "#FFE9A8" : "#F2ECFF"; if (p > 0.78 && tw > 0.6) { rect(c, x - 1, y, 3, 1, col); rect(c, x, y - 1, 1, 3, col); } else rect(c, x, y, 1, 1, col); }
      c.save(); c.globalAlpha = 0.25; c.strokeStyle = "#CDBFFF"; c.lineWidth = 1; c.beginPath();
      for (let i = 0; i < stars.length; i++) for (let j = i + 1; j < stars.length; j++) { const [x1, y1, p1] = stars[i], [x2, y2, p2] = stars[j]; if (p1 > 0.6 && p2 > 0.6 && Math.hypot(x2 - x1, y2 - y1) < 24) { c.moveTo(x1 + 0.5, y1 + 0.5); c.lineTo(x2 + 0.5, y2 + 0.5); } }
      c.stroke(); c.restore();
      // banded streak clouds
      c.save(); c.globalAlpha = 0.3; for (let i = 0; i < 5; i++) { const y = 12 + i * 11, x = ((s * (1 + i * 0.3) * 3 + i * 97) % (o.W + 120)) - 120; rect(c, x, y, 70 + i * 9, 1, "#B9A9EE"); rect(c, x + 10, y + 1, 50, 1, "#8F7FD0"); } c.restore();
      if (Math.floor(s / 47) % 5 === 0 && s % 47 < 1.2) { const k = (s % 47) / 1.2; for (let i = 0; i < 6; i++) rect(c, o.W * 0.75 - k * 60 - i * 2, 10 + k * 18 - i, 1, 1, "#FFFFFF"); }
    }
    if (glowy && o.weather !== "rain") {
      // big soft pale moon with a glow and wisps across it
      c.save(); const g = c.createRadialGradient(moon.x, moon.y, 0, moon.x, moon.y, moon.r * 2.6); g.addColorStop(0, "rgba(255,246,220,.45)"); g.addColorStop(1, "rgba(255,246,220,0)"); c.fillStyle = g; c.fillRect(moon.x - moon.r * 3, moon.y - moon.r * 3, moon.r * 6, moon.r * 6); c.restore();
      ell(c, moon.x, moon.y, moon.r, moon.r, "#FFF8E4"); ell(c, moon.x + 4, moon.y + 3, moon.r - 6, moon.r - 6, "#F7EDD2"); ell(c, moon.x - 6, moon.y - 5, 3, 2, "#EFE3C4"); ell(c, moon.x + 5, moon.y - 7, 2, 2, "#EFE3C4");
      c.save(); c.globalAlpha = 0.55; for (let i = 0; i < 3; i++) { const x = moon.x - 26 + ((s * 2 + i * 19) % 52); rect(c, x, moon.y - 4 + i * 6, 22 - i * 4, 1, "#E7DCFA"); } c.restore();
    } else if (o.weather !== "rain") {
      const sx = Math.round(o.W * 0.86), sy = 20; c.save(); const g = c.createRadialGradient(sx, sy, 0, sx, sy, 24); g.addColorStop(0, "rgba(255,240,200,.6)"); g.addColorStop(1, "rgba(255,240,200,0)"); c.fillStyle = g; c.fillRect(sx - 24, sy - 24, 48, 48); c.restore();
      ell(c, sx, sy, 8, 8, "#FFF4C8"); ell(c, sx - 2, sy - 2, 4, 4, "#FFFBE6");
    }
    c.drawImage(hills, 0, 0);
    for (const cl of clouds) { const x = ((cl.x + s * cl.v) % (o.W + 80)) - 60; c.drawImage(cl.cv, Math.round(x), Math.round(cl.y)); }
    if (!night && o.weather !== "rain") { const bx = ((s * 14) % (o.W + 120)) - 60, by = 24 + Math.sin(s / 3) * 5; for (let i = 0; i < 3; i++) { const x = bx - i * 7, y = by + i * 3, f = Math.floor(s * 4 + i) % 2; rect(c, x, y, 1, 1, P); rect(c, x - 1, y - f, 1, 1, P); rect(c, x + 1, y - f, 1, 1, P); } }
    c.drawImage(isl, 0, Math.round(Math.sin(s / 3) * 1.4));
    const bob = Math.round(Math.sin(s / 4));
    c.drawImage(main, 0, bob);
    c.save(); c.translate(0, bob);
    // flag on the top spire, pennant on the clock tower
    { const f = Math.floor(s * 3) % 2; rect(c, cx, gy - 112, 1, 8, P); rect(c, cx + 1, gy - 112, 6, 3, K.rasp); rect(c, cx + 7, gy - 112 + f, 2, 2, K.rasp); rect(c, cx + 2, gy - 111, 2, 1, K.gold); }
    // clock hands show Singapore time; the face glows after dark
    { const hy = gy - 69; if (glowy) { ell(c, ct, hy, 6, 6, "#FFE9B0"); c.save(); c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(ct, hy, 0, ct, hy, 14); g.addColorStop(0, "rgba(255,200,120,.35)"); g.addColorStop(1, "rgba(255,200,120,0)"); c.fillStyle = g; c.fillRect(ct - 14, hy - 14, 28, 28); c.restore(); }
      const ha = ((mins % 720) / 720) * Math.PI * 2, ma = ((mins % 60) / 60) * Math.PI * 2;
      for (let i = 1; i <= 3; i++) rect(c, ct + Math.round(Math.sin(ha) * i), hy - Math.round(Math.cos(ha) * i), 1, 1, P);
      for (let i = 1; i <= 5; i++) rect(c, ct + Math.round(Math.sin(ma) * i), hy - Math.round(Math.cos(ma) * i), 1, 1, K.raspLo);
      rect(c, ct, hy, 1, 1, P); }
    // chimney smoke from the cottage
    for (let i = 0; i < 3; i++) { const k = (s * 0.4 + i / 3) % 1, x = cx - 143 + Math.round(Math.sin(k * 6 + i) * 2 + k * 6), y = gy - 26 - Math.round(k * 16); c.globalAlpha = 0.7 * (1 - k); ell(c, x, y, 1 + Math.round(k * 2), 1 + Math.round(k * 2), night ? "#B9AEDB" : "#FFFFFF"); c.globalAlpha = 1; }
    // waterfall shimmer and foam, pond ripples
    { const wfX = cx + 88, wfY = gy + 18; for (let y = 0; y < 32; y += 5) rect(c, wfX + 2, wfY + ((y + Math.floor(s * 20)) % 32), 3, 2, K.waterHi);
      for (let i = 0; i < 4; i++) { const k = (s * 0.6 + i / 4) % 1; c.globalAlpha = 1 - k; rect(c, cx + 48 - Math.round(k * 10), gy + 4 + (i % 2), Math.round(k * 20) + 1, 1, K.waterHi); c.globalAlpha = 1; } }
    // the sakura canopy sways (dense pink with light pink and white highlights)
    { const ty = gy + 2, sw = Math.round(Math.sin(s / 1.6));
      for (const [dx, dy, rr] of [[0, -32, 14], [-14, -26, 10], [14, -26, 11], [-7, -40, 9], [8, -40, 9], [-20, -20, 6], [21, -19, 6]] as const) oell(c, tx + dx + sw, ty + dy, rr, Math.round(rr * 0.75), K.pink);
      for (const [dx, dy, rr] of [[-6, -38, 5], [8, -30, 4], [-14, -27, 4], [3, -42, 3], [16, -24, 3]] as const) ell(c, tx + dx + sw, ty + dy, rr, 2, K.pinkHi);
      for (const [dx, dy] of [[3, -26], [-9, -22], [11, -20], [-2, -30], [6, -36], [-16, -24], [18, -22]] as const) rect(c, tx + dx + sw, ty + dy, 2, 1, K.pink2);
      for (const [dx, dy] of [[-4, -42], [10, -34], [-12, -30]] as const) rect(c, tx + dx + sw, ty + dy, 1, 1, "#FFFFFF"); }
    // white goose waddling by the pond
    { const k = (Math.sin(s / 5) + 1) / 2, x = Math.round(cx + 18 + k * 14), y = gy + 18, st = Math.floor(s * 4) % 2, dir = Math.cos(s / 5) > 0 ? 1 : -1;
      rect(c, x - 3, y - 4, 7, 4, P); rect(c, x - 2, y - 3, 5, 2, "#FFFFFF"); rect(c, x + dir * 2, y - 8, 2, 5, P); rect(c, x + dir * 2, y - 7, 1, 4, "#FFFFFF"); rect(c, x + dir * 2 + (dir > 0 ? 1 : -1), y - 7, 2, 1, "#FFA55C"); rect(c, x + dir * 2, y - 7, 1, 1, P);
      rect(c, x - 1 + st, y, 1, 1, "#FFA55C"); rect(c, x + 1 - st, y, 1, 1, "#FFA55C"); }
    // floating crystal beside the castle, magic circle round the observatory, roof sparkles, Dungeon runes
    { const y = gy - 98 + Math.round(Math.sin(s * 1.3) * 2), x = cx - 42; for (let i = 0; i < 4; i++) rect(c, x - i, y + i, 1 + i * 2, 1, i ? "#CBB8FF" : "#FFFFFF"); for (let i = 0; i < 4; i++) rect(c, x - 3 + i, y + 4 + i, 7 - i * 2, 1, i < 2 ? "#A890F0" : "#8C74DE"); rect(c, x - 1, y + 2, 1, 2, "#FFFFFF");
      c.save(); c.globalCompositeOperation = "lighter"; const g = c.createRadialGradient(x, y + 4, 0, x, y + 4, 12); g.addColorStop(0, `rgba(190,170,255,${0.3 + 0.15 * Math.sin(s * 2)})`); g.addColorStop(1, "rgba(190,170,255,0)"); c.fillStyle = g; c.fillRect(x - 12, y - 8, 24, 24); c.restore(); }
    { c.save(); c.globalAlpha = glowy ? 0.55 : 0.25; c.strokeStyle = "#D9CCFF"; c.beginPath(); c.ellipse(ob + 0.5, gy - 2.5, 30, 6, 0, 0, Math.PI * 2); c.stroke(); c.restore();
      for (let i = 0; i < 10; i++) { const a = s * 0.4 + (i / 10) * Math.PI * 2; const x = ob + Math.round(Math.cos(a) * 30), y = gy - 3 + Math.round(Math.sin(a) * 6); c.globalAlpha = glowy ? 0.95 : 0.6; rect(c, x, y, 1, 1, i % 2 ? "#FFE9A8" : "#D9CCFF"); } c.globalAlpha = 1;
      if (night) { c.save(); c.globalAlpha = 0.4; c.strokeStyle = "#E6DCFF"; c.beginPath(); const pts = [[ob - 20, gy - 58], [ob - 8, gy - 66], [ob + 6, gy - 60], [ob + 18, gy - 70], [ob + 26, gy - 56]]; pts.forEach(([x, y], i) => (i ? c.lineTo(x + 0.5, y + 0.5) : c.moveTo(x + 0.5, y + 0.5))); c.stroke(); c.restore(); for (const [x, y] of [[ob - 20, gy - 58], [ob - 8, gy - 66], [ob + 6, gy - 60], [ob + 18, gy - 70], [ob + 26, gy - 56]]) { rect(c, x - 1, y, 3, 1, "#FFF6D6"); rect(c, x, y - 1, 1, 3, "#FFF6D6"); } } }
    for (const [x, y, ph] of [[cx - 35, gy - 84, 0], [cx + 33, gy - 88, 1.3], [cx, gy - 106, 2.1], [ct + 2, gy - 106, 2.9], [cx + 72, gy - 46, 3.7]] as const) if (Math.sin(s * 2.2 + ph) > 0.55) { rect(c, x, y - 1, 1, 3, "#FFFFFF"); rect(c, x - 1, y, 3, 1, "#FFFFFF"); }
    for (let i = 0; i < 5; i++) { const a = Math.PI + (i / 4) * Math.PI, x = cx + 152 + Math.round(Math.cos(a) * 11), y = gy + 1 + Math.round(Math.sin(a) * 11); c.globalAlpha = 0.5 + 0.5 * Math.sin(s * 2 + i); rect(c, x, y, 1, 1, i % 2 ? "#D9CCFF" : "#FFE9A8"); c.globalAlpha = 1; }
    for (let i = 0; i < 3; i++) { const k = (s * 0.15 + i / 3) % 1, x = cx + 132 + Math.round(Math.sin(s * 0.6 + i) * 10) + i * 8, y = gy - 18 - Math.round(k * 22), f = Math.floor(s * 3 + i) % 2; c.globalAlpha = Math.min(1, (1 - k) * 2); rect(c, x - 2, y - f, 2, 2 + f, [K.rasp, K.teal, K.lavLo][i]); rect(c, x + 1, y - f, 2, 2 + f, [K.rasp, K.teal, K.lavLo][i]); rect(c, x, y, 1, 2, P); c.globalAlpha = 1; }
    // the roof cat flicks its tail
    { const x = cx - 152 - 7, y = gy + 10 - 31, f = Math.floor(s * 1.2) % 3; rect(c, x - 1, y - f, 1, 2 + f, "#2C2238"); }
    // warm orange windows and lantern glow after dark
    if (glowy) {
      for (const [x, y, w, h] of wins) { const fl = 0.85 + 0.15 * Math.sin(s * 7 + x); c.globalAlpha = fl; rect(c, x, y, w, h, K.glow); c.globalAlpha = 1; }
      c.save(); c.globalCompositeOperation = "lighter";
      for (const [x, y, w] of wins) { const g = c.createRadialGradient(x + w / 2, y + 1, 0, x + w / 2, y + 1, 7); g.addColorStop(0, `rgba(255,170,90,${night ? 0.3 : 0.16})`); g.addColorStop(1, "rgba(255,170,90,0)"); c.fillStyle = g; c.fillRect(x - 7, y - 7, w + 14, 16); }
      c.restore();
    }
    c.restore();
    // floating lanterns rise at dusk and night
    if (glowy && o.weather !== "rain") for (let i = 0; i < 6; i++) { const k = (s * 0.03 + i / 6) % 1, x = Math.round(cx - 150 + i * 60 + Math.sin(s * 0.5 + i) * 6), y = Math.round(gy - 10 - k * (gy - 10)); c.globalAlpha = Math.min(1, (1 - k) * 2); rect(c, x, y, 2, 3, "#FFC56E"); rect(c, x, y, 2, 1, "#FFE9B0"); c.globalAlpha = 1; }
    // cloud sea in front
    for (const cl of sea) { const x = ((cl.x + s * 2.4) % (o.W + 44)) - 44; c.drawImage(cl.cv, Math.round(x), Math.round(cl.y)); }
    // square sakura petals, butterflies by day, floating lights, drifting hearts, rain
    for (const p of petals) { const y = (p.y + s * p.v) % (o.H + 10) - 5, x = (p.x + Math.sin(s + p.p) * 8 + s * 3) % o.W; rect(c, x, y, p.big ? 2 : 1, p.big ? 2 : 1, p.big ? K.pink : K.pink2); }
    if (o.phase === "day" && o.stage >= 2 && o.weather !== "rain") for (let i = 0; i < 3; i++) { const x = cx - 90 + i * 70 + Math.round(Math.sin(s * 0.7 + i) * 20), y = gy - 8 + Math.round(Math.sin(s * 1.3 + i * 2) * 6), f = Math.floor(s * 6 + i) % 2; rect(c, x - 1 - f, y, 1 + f, 2, [K.gold, K.lav, K.pink2][i]); rect(c, x + 1, y, 1 + f, 2, [K.gold, K.lav, K.pink2][i]); rect(c, x, y, 1, 2, P); }
    if (o.weather !== "rain") { c.save(); c.globalCompositeOperation = "lighter"; for (const f of lights) { const a = (Math.sin(s * 2 + f.p * 3) + 1) / 2; c.globalAlpha = a * (glowy ? 1 : 0.45); rect(c, f.x + Math.sin(s / 2 + f.p) * 6, f.y + Math.cos(s / 3 + f.p) * 4, 1, 1, glowy ? "#FFF3A0" : "#FFFFFF"); } c.restore(); }
    for (const a of ambient) { const k = (s * 0.05 + a.p) % 1; c.globalAlpha = Math.min(1, (1 - k) * 1.5) * 0.8; heart(c, Math.round(a.x + Math.sin(s + a.p * 9) * 4), Math.round(gy - 10 - k * (gy - 20)), K.pink, "#FFFFFF"); c.globalAlpha = 1; }
    for (let i = hearts.length - 1; i >= 0; i--) { const h = hearts[i], k = (t - h.t0) / 2400; if (k < 0) continue; if (k > 1) { hearts.splice(i, 1); continue; } c.globalAlpha = 1 - k * k; heart(c, Math.round(h.x + h.dx * k), Math.round(h.y - k * 70), K.pink2, "#FFFFFF", true); c.globalAlpha = 1; }
    if (o.weather === "rain") { c.save(); c.globalAlpha = 0.55; for (const d of drops) { const y = (d.y + s * d.v) % o.H, x = (d.x - s * 18) % o.W; rect(c, x < 0 ? x + o.W : x, y, 1, 4, "#E6ECFF"); } c.restore(); }
  }
  return { draw, cheer, places };
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
