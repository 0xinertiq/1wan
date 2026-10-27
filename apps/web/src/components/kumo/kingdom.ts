import type { Box, Crop } from "./PaintedBanner";

// The Living Kingdom world. Backdrops are prototype crops from concept image 26 (top row: Starter 0-760,
// Growing 764-1536), listed in docs/kumo-redesign/MISSING_ART.md. Boxes are where the concept painted mock UI
// (title card, place chips, speech bubble), in scene pixels; the real chips and cards sit exactly on them.

type Scene = { boxes: Record<string, Box>; desktop: Omit<Crop, "boxes">; mobile: Omit<Crop, "boxes"> & { ox: number; oy: number } };

const SCENES: Record<"starter" | "growing", Scene> = {
  starter: {
    boxes: { title: [16, 11, 238, 73], castle: [477, 60, 99, 38], clock: [131, 154, 108, 38], obs: [585, 150, 111, 38], garden: [310, 220, 120, 38],
      life: [112, 341, 89, 39], diary: [628, 328, 91, 38], bubble: [376, 342, 152, 98] },
    desktop: { file: "/kumo/kingdom-starter-desktop.webp", w: 760, h: 528, fx: 0.5 },
    mobile: { file: "/kumo/kingdom-starter-mobile.webp", w: 680, h: 500, fx: 0.5, ox: 40, oy: 0 },
  },
  growing: {
    boxes: { title: [11, 10, 263, 74], castle: [457, 18, 146, 88], clock: [114, 154, 108, 38], obs: [630, 160, 107, 39], garden: [334, 229, 122, 39],
      life: [107, 362, 90, 38], diary: [675, 371, 93, 38], bubble: [396, 378, 192, 70] },
    desktop: { file: "/kumo/kingdom-growing-desktop.webp", w: 772, h: 528, fx: 0.5 },
    mobile: { file: "/kumo/kingdom-growing-mobile.webp", w: 700, h: 500, fx: 0.5, ox: 40, oy: 0 },
  },
};

const shift = (b: Record<string, Box>, ox: number, oy: number) =>
  Object.fromEntries(Object.entries(b).map(([k, [x, y, w, h]]) => [k, [x - ox, y - oy, w, h] as Box]));

export function kingdomCrops(scene: "starter" | "growing"): { desktop: Crop; mobile: Crop } {
  const s = SCENES[scene];
  const { ox, oy, ...m } = s.mobile;
  return { desktop: { ...s.desktop, boxes: s.boxes }, mobile: { ...m, boxes: shift(s.boxes, ox, oy) } };
}

// Growth stage from her existing level, read-only. Cosmetic only: no feature is ever behind a stage, and a
// missed day never lowers it. Thresholds are placeholders (UNLOCKS_AND_PROGRESS.md), NEEDS OWNER APPROVAL.
export const STAGES = [
  { n: 1, name: "Starter Kingdom", from: 1, scene: "starter" },
  { n: 2, name: "Growing Kingdom", from: 2, scene: "growing" },
  { n: 3, name: "Expanding Kingdom", from: 5, scene: "growing" },
  { n: 4, name: "Thriving Kingdom", from: 7, scene: "growing" },
  { n: 5, name: "Your Own Kingdom", from: 10, scene: "growing" },
] as const;
export const stageFor = (lvl: number) => [...STAGES].reverse().find((s) => lvl >= s.from) ?? STAGES[0];

// Code-drawn additions on the Growing scene for stages 3-5 (no painted art yet), in Growing scene pixels:
// [decor id, x, y (ground point), size]. Placed clear of the place chips.
export const ADDITIONS: [stage: number, id: string, x: number, y: number, size: number][] = [
  [3, "flowers", 252, 500, 44], [3, "flowers", 548, 506, 44],
  [4, "lantern", 196, 470, 40], [4, "lantern", 610, 470, 40],
  [5, "sakura_4", 44, 312, 56], [5, "mushroom", 726, 500, 40],
];

// Which crew stand at which place when they are at work (lib/court/duty.ts decides "at work").
export const CREW_AT: Record<string, string[]> = {
  obs: ["olli", "pip", "fenn", "tilly", "luna"], clock: ["momo"], life: ["coco", "poppy"], castle: ["dundun"],
};
