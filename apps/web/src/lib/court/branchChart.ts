import type { Branch, WaterEvt } from "./garden";
import { chartOf } from "./harada";
import type { CourtState } from "./state";
import { sgtKeyOf, weekKey } from "./time";

// Round 12: the Garden's Branches read the same chart the Grid & Wins editor saves (her edits over the import for
// 2026, the separate 2027 chart), and blossoms count that year's ticks. Ticks are keyed by position (pillar.act),
// so a renamed pillar keeps its ticks and blossoms. Decay (stage, idle) comes from lib/court/garden.ts unchanged.
// Round 16: for 2027 the colour's "active this week" comes from that chart's own ticks (watering refs
// grid2027:p.a), as `seen`. Display only: decay and recovery still come from garden.ts unchanged.
export function chartBranches(list: Branch[], st: Pick<CourtState, "defs" | "gridDefs" | "gridDefs2027" | "grid" | "grid2027done">, year: "2026" | "2027", evs: WaterEvt[] = []) {
  const chart = year === "2027" ? chartOf(null, st.gridDefs2027) : chartOf(st.defs.grid, st.gridDefs);
  const done = year === "2027" ? st.grid2027done : st.grid.done;
  const seen = (n: number) => evs.filter((e) => e && typeof e.ref === "string" && e.ref.startsWith(`grid2027:${n}.`)).map((e) => sgtKeyOf(e.at)).filter(Boolean).sort().pop() ?? null;
  return list.map((b) => ({ ...b, name: chart?.pillars[b.n - 1]?.name?.trim() || `Sub-goal ${b.n}`, blossoms: Array.from({ length: 8 }, (_, i) => done[`${b.n}.${i + 1}`]).filter(Boolean).length,
    ...(year === "2027" ? { seen: seen(b.n) } : {}) }));
}

// Round 13/14: each branch's progress background on the Branches card. Grey: never started. Faint pastel tint:
// cells done but quiet this week. Full pastel green: activity this week. Soft gold edge: all eight cells done.
// share is the cells done in the effective chart. Display only.
export type BranchProgress = { state: "idle" | "quiet" | "active" | "done"; share: number };
export function branchProgress(b: { blossoms: number; last: string | null; seen?: string | null }, k: string): BranchProgress {
  const share = Math.max(0, Math.min(1, b.blossoms / 8)), last = b.seen !== undefined ? b.seen : b.last;
  if (share >= 1) return { state: "done", share: 1 };
  if (last && last >= weekKey(k)) return { state: "active", share };
  return share > 0 ? { state: "quiet", share } : { state: "idle", share: 0 };
}
