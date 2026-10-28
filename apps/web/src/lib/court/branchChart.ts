import type { Branch } from "./garden";
import { chartOf } from "./harada";
import type { CourtState } from "./state";

// Round 12: the Garden's Branches read the same chart the Grid & Wins editor saves (her edits over the import for
// 2026, the separate 2027 chart), and blossoms count that year's ticks. Ticks are keyed by position (pillar.act),
// so a renamed pillar keeps its ticks and blossoms. Decay (stage, idle) comes from lib/court/garden.ts unchanged.
export function chartBranches(list: Branch[], st: Pick<CourtState, "defs" | "gridDefs" | "gridDefs2027" | "grid" | "grid2027done">, year: "2026" | "2027") {
  const chart = year === "2027" ? chartOf(null, st.gridDefs2027) : chartOf(st.defs.grid, st.gridDefs);
  const done = year === "2027" ? st.grid2027done : st.grid.done;
  return list.map((b) => ({ ...b, name: chart?.pillars[b.n - 1]?.name?.trim() || (year === "2027" ? `Sub-goal ${b.n}` : b.name), blossoms: Array.from({ length: 8 }, (_, i) => done[`${b.n}.${i + 1}`]).filter(Boolean).length }));
}
