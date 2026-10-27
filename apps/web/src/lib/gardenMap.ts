// Which garden branch each real activity waters (docs/build-dashboard-v2.md section 4).
// Branches are the eight grid pillars (1..8); 0 is the trunk (daily anchors and routines).
// Edit this file to change the mapping; nothing else hard-codes it.
import type { SpriteName } from "@/components/PixelSprite";

export const BRANCH_DEFAULTS = ["Trading craft", "1(WAN) app", "Agent system", "X brand", "Instagram and photography", "Learning", "Freight and warehouse AI", "Home and body"];

// Daily anchors (Small Wins d1..d8) that also water a branch, besides the trunk.
const ANCHOR_BRANCH: Record<string, number> = { d1: 8, d2: 8, d5: 8, d6: 8, d7: 8, d8: 8 };

// source + ref from watering_events -> branch number, or null when it only waters the trunk.
export function branchOf(source: string, ref: string): number | null {
  if (source === "trade" || source === "plan") return 1;
  if (source === "grid") { const m = ref.match(/^grid:(\d)\./); return m ? +m[1] : null; }
  if (source === "samsara") return 6;
  if (source === "quest") {
    if (/^quest:(k2|k7)/.test(ref)) return 6;
    if (/^quest:(f1|o2)/.test(ref)) return 1;
    if (/^quest:x/.test(ref)) return 4;
  }
  if (source === "milestone" && ref.startsWith("samsara:")) return 6;
  if (source === "anchor") { const m = ref.match(/^anchor:(d\d)/); return m ? ANCHOR_BRANCH[m[1]] ?? null : null; }
  return null;
}

// Trunk: daily anchors and the money routine (spending logged) keep it watered.
export const isTrunk = (source: string) => source === "anchor" || source === "anchors" || source === "spending";

// The crew member who gives the one gentle nudge when a branch wilts, and what the nudge is.
export const NUDGE: Record<number, { crew: SpriteName; t: string }> = {
  0: { crew: "momo", t: "Tick one daily anchor today. Tea first counts." },
  1: { crew: "fenn", t: "Write one plan, even a small one, before any trade." },
  2: { crew: "kumo", t: "Ten minutes on the app: one small fix or note." },
  3: { crew: "kumo", t: "Ten minutes mapping one Claude project to its agent." },
  4: { crew: "poppy", t: "One thoughtful reply on X." },
  5: { crew: "poppy", t: "Edit one photo from the archive." },
  6: { crew: "tilly", t: "One 25-minute study sprint." },
  7: { crew: "tilly", t: "Ten minutes sketching one freight flow." },
  8: { crew: "coco", t: "A 10-minute walk, then a glass of water." },
};

// Decay from days without activity. Rest days pause it.
export type BranchStage = "blooming" | "thirsty" | "wilting" | "withered" | "dead";
export function stageOf(idle: number): BranchStage {
  return idle <= 1 ? "blooming" : idle === 2 ? "thirsty" : idle <= 4 ? "wilting" : idle <= 7 ? "withered" : "dead";
}
