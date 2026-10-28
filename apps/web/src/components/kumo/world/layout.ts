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
  crew: Box[]; kumo: Box; bubble: Box | null; perches: [number, number][]; foxW: number; foxH: number;
};

export function worldLayout(w: number, h: number, crewOn: { id: string; place: string }[], quoteLen: number): WorldLayout {
  const hudH = hudHeight(w);
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

  // quote bubble (desktop and tablet; on the phone it sits under the strip): rises from Kumo, up and right
  // The quote is always shown in full: the bubble grows (up to about 320px wide, then taller) to fit it. It takes
  // the first spot that touches nothing (rising from Kumo, the top-right sky, beside the castle label); when no
  // spot in the scene is free it sits under the world strip instead (bubble = null), as on the phone.
  let bubble: Box | null = null;
  if (w >= PHONE) {
    const free = (b: Box) => b.x >= 0 && b.x + b.w <= w && b.y >= hud.h + 4 && b.y + b.h <= h - 4 &&
      ![...places.map((p) => p.box), ...crew, kumo].some((o) => hit(b, o));
    const castle = places.find((p) => p.id === "castle")?.box;
    for (const bw of [Math.min(320, w * 0.46), Math.min(380, w * 0.46)]) {
      const bh = Math.max(1, Math.ceil((quoteLen * 7.9) / (bw - 36))) * 22 + 30;
      const spots: [number, number][] = [
        [(g.cx + 68) * s, kumo.y - 4 - bh],
        [w - bw - 12, hud.h + 4],
        ...(castle ? [[castle.x + castle.w + 12, hud.h + 4] as [number, number]] : []),
      ];
      const ok = spots.map(([x, y]) => ({ id: "bubble", x, y, w: bw, h: bh })).find(free);
      if (ok) { bubble = ok; break; }
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
