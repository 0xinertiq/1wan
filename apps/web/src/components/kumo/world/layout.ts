import { FIT_H, FIT_W, geometry } from "./draw";

// Where everything on top of the world canvas goes, in CSS pixels, with collisions resolved. Pure, so the page
// and tests/world-layout.test.mjs use the same numbers.
// - A HUD band across the top holds the focus icon, the greeting and the three chips. The island is fitted
//   below it, so no building, label, fox or bubble sits in the band.
// - Place labels sit above their building; a label that would touch the HUD moves down, and a label that a
//   crew sprite would cover moves up above the crew.
// - Crew stand at their place on the ground, side by side; the fox only uses perches clear of every label,
//   the HUD and the bubble.

export type Box = { id: string; x: number; y: number; w: number; h: number };
// The quote bubble: how many lines it shows, and whether the quote is cut short (a tap opens it in full).
export type Bubble = Box & { lines: number; clamp: boolean };
export const hit = (a: Box, b: Box, pad = 2) => a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

export const PHONE = 768;
export const hudHeight = (w: number) => (w < PHONE ? 52 : 60);
// Label size (14px Nunito, 600, padded glass chip) or, on the phone strip, the 44px hotspot without text.
const labelBox = (id: string, text: string, x: number, y: number, w: number): Box => (w < PHONE
  ? { id, x: x - 22, y: y - 26, w: 44, h: 44 }
  : { id, x: x - (text.length * 7.6 + 22) / 2, y: y - 26, w: text.length * 7.6 + 22, h: 26 });

export type WorldLayout = {
  s: number; W: number; H: number; top: number; px: number; hud: Box;
  places: { id: string; label: string; href: string; box: Box; cx: number; bottom: number }[];
  crew: Box[]; kumo: Box; bubble: Bubble | null; perches: [number, number][]; foxW: number; foxH: number;
};

// null when the box is too small to hold the HUD band and the island (hidden tab, collapsed or still sizing):
// the page then shows no world rather than a negative or giant canvas.
export function worldLayout(w: number, h: number, crewOn: { id: string; place: string }[], quoteLen: number): WorldLayout | null {
  const hudH = hudHeight(w);
  if (!(w >= 120 && h >= hudH + 80 && Number.isFinite(w) && Number.isFinite(h))) return null;
  const s = Math.min(w / FIT_W, (h - hudH) / FIT_H);
  const W = Math.ceil(w / s), H = Math.floor(h / s), top = hudH / s;
  const g = geometry(W, H, top);
  const px = Math.round(h * (w < PHONE ? 0.2 : 0.15));
  const hud: Box = { id: "hud", x: 0, y: 0, w, h: hudH };

  // crew: at their place, side by side, standing on the ground (bottom at the desk point)
  const crew: Box[] = [];
  for (const p of g.places) {
    const mates = crewOn.filter((c) => c.place === p.id);
    mates.forEach((c, j) => {
      const cx = p.desk[0] * s + (j - (mates.length - 1) / 2) * px * 0.9;
      crew.push({ id: c.id, x: cx - px / 2, y: p.desk[1] * s - px, w: px, h: px });
    });
  }
  const kpx = Math.round(px * 0.75);
  const kumo: Box = { id: "kumo", x: (g.cx + 58) * s - kpx / 2, y: (g.gy - 54) * s - kpx, w: kpx, h: kpx };

  // labels (desktop and tablet; on the phone strip six 44px targets cannot sit apart, and the bottom bar already
  // goes to the same places, so the strip has none): start above the building, keep out of the HUD, lift above
  // any crew that would cover them, then push apart labels that touch (the lower one moves down, or up when
  // moving down would land on the crew).
  const boxes = w < PHONE ? [] : g.places.map((p) => {
    let box = labelBox(p.id, p.label, p.x * s, p.y * s, w);
    if (box.y < hud.h + 4) box = { ...box, y: hud.h + 4 };
    for (const c of [...crew, kumo]) if (hit(box, c)) box = { ...box, y: Math.max(hud.h + 4, c.y - box.h - 4) };
    return box;
  });
  for (let pass = 0; pass < 4; pass++) for (let i = 0; i < boxes.length; i++) for (let j = 0; j < boxes.length; j++) {
    const a = boxes[i], b = boxes[j];
    if (i === j || !hit(a, b) || a.y < b.y) continue;
    const down = { ...a, y: b.y + b.h + 4 }, up = { ...b, y: a.y - b.h - 4 };
    if (![...crew, kumo].some((c) => hit(down, c))) boxes[i] = down;
    else if (up.y >= hud.h + 4) boxes[j] = up;
  }
  const places = boxes.map((box, i) => ({ id: g.places[i].id, label: g.places[i].label, href: g.places[i].href, box, cx: box.x + box.w / 2, bottom: box.y + box.h }));

  // quote bubble (round 10, every screen): it sits inside the court scene, rising from Kumo (above him, to either side
  // of him, or beside him), clear of the HUD, every label and the crew. The whole quote shows when it fits; when it
  // does not (a long quote on a short scene, the phone), the bubble keeps the most lines that fit and ends with "…",
  // and a tap opens the full quote. Only if no spot at all is free does it sit under the strip.
  let bubble: Bubble | null = null;
  {
    const phone = w < PHONE, cw = phone ? 6.9 : 7.9, lh = phone ? 19 : 22, pad = phone ? 22 : 30;
    const kx = kumo.x + kumo.w / 2;
    const free = (b: Box) => b.x >= 0 && b.x + b.w <= w && b.y >= hud.h + 4 && b.y + b.h <= h - 4 &&
      ![...places.map((p) => p.box), ...crew, kumo].some((o) => hit(b, o));
    const at = (bw: number, lines: number): Box | null => {
      const bh = lines * lh + pad, clampX = (x: number) => Math.max(0, Math.min(w - bw, x));
      const spots: [number, number][] = [
        [kx - 18, kumo.y - 14 - bh], [kx + 18 - bw, kumo.y - 14 - bh], [kx - bw / 2, kumo.y - 14 - bh],
        [kumo.x + kumo.w + 8, kumo.y + kumo.h / 2 - bh], [kumo.x - 8 - bw, kumo.y + kumo.h / 2 - bh],
        // beside Kumo at the top of the free band (the short phone strip)
        [kumo.x - 8 - bw, hud.h + 4], [kumo.x + kumo.w + 8, hud.h + 4],
      ];
      return spots.map(([x, y]) => ({ id: "bubble", x: clampX(x), y, w: bw, h: bh })).find(free) ?? null;
    };
    const widths = phone ? [Math.min(260, w * 0.7), Math.min(200, w * 0.56)] : [Math.min(320, w * 0.46), Math.min(380, w * 0.46), Math.min(260, w * 0.4)];
    const need = (bw: number) => Math.max(1, Math.ceil((quoteLen * cw) / (bw - pad - 6)));
    for (const bw of widths) { const n = need(bw), b = at(bw, n); if (b) { bubble = { ...b, lines: n, clamp: false }; break; } }
    for (let n = Math.max(...widths.map(need)) - 1; !bubble && n >= 1; n--) for (const bw of widths) {
      if (n >= need(bw)) continue;
      const b = at(bw, n); if (b) { bubble = { ...b, lines: n, clamp: true }; break; }
    }
  }

  // fox: only perches whose box stays clear of labels, the HUD and the bubble
  const foxH = px, foxW = Math.round((px * 40) / 32);   // the same pixel scale as the crew (40 x 32 grid)
  const foxBox = ([x, y]: [number, number]): Box => ({ id: "fox", x: x * s - foxW / 2, y: y * s - foxH, w: foxW, h: foxH });
  const blockers = [hud, ...places.map((p) => p.box), ...(bubble ? [bubble] : [])];
  const perches = g.perches.filter((pt) => !blockers.some((b) => hit(foxBox(pt), b)));

  return { s, W, H, top, px, hud, places, crew, kumo, bubble, perches, foxW, foxH };
}

// The fox's box at a perch, for the test.
export const foxAt = (L: WorldLayout, [x, y]: [number, number]): Box => ({ id: "fox", x: x * L.s - L.foxW / 2, y: y * L.s - L.foxH, w: L.foxW, h: L.foxH });
