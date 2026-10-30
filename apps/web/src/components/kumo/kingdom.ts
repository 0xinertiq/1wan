// Kingdom growth for the Living World (COURT_SPEC): stage from her existing level, read-only, and which crew
// work at which place.

// Growth stage from her existing level, read-only. Cosmetic only: no feature is ever behind a stage, and a
// missed day never lowers it. Thresholds are placeholders (UNLOCKS_AND_PROGRESS.md), NEEDS OWNER APPROVAL.
export const STAGES = [
  { n: 1, name: "Starter Kingdom", from: 1 },
  { n: 2, name: "Growing Kingdom", from: 2 },
  { n: 3, name: "Expanding Kingdom", from: 5 },
  { n: 4, name: "Thriving Kingdom", from: 7 },
  { n: 5, name: "Your Own Kingdom", from: 10 },
] as const;
export const stageFor = (lvl: number) => [...STAGES].reverse().find((s) => lvl >= s.from) ?? STAGES[0];

// Which crew stand at which place when they are at work (lib/court/duty.ts decides "at work").
export const CREW_AT: Record<string, string[]> = {
  obs: ["olli", "pip", "fenn", "tilly", "luna"], clock: ["momo"], life: ["coco", "poppy"], castle: ["dundun"],
};
