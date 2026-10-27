import { BRANCH_DEFAULTS, branchOf, isTrunk, stageOf, type BranchStage } from "@/lib/gardenMap";
import type { CourtState } from "./state";
import { addDays, dayGap, weekKey } from "./time";

// Garden state computed from real records only: watering_events, grid ticks and the anchors log.
export type WaterEvt = { at: string; source: string; ref: string; weight: number };
export type Branch = { n: number; name: string; last: string | null; idle: number; stage: BranchStage | "sprout"; blossoms: number; resting: boolean };

const sgtDay = (iso: string) => new Date(Date.parse(iso) + 8 * 3600000).toISOString().slice(0, 10);

export function branches(st: CourtState, k: string, evs: WaterEvt[]): { trunk: Branch; list: Branch[] } {
  const resting = st.restDay === k || st.restWeek === weekKey(k);
  const last: Record<number, string> = {};
  const bump = (b: number, d: string) => { if (!last[b] || d > last[b]) last[b] = d; };
  for (const e of evs) {
    const d = sgtDay(e.at), b = branchOf(e.source, e.ref);
    if (b != null) bump(b, d);
    if (isTrunk(e.source)) bump(0, d);
  }
  for (const [d, ids] of Object.entries(st.swins.log)) if (Array.isArray(ids) && ids.length && d <= k) bump(0, d);
  const weed = st.gd.weed ?? {};
  const mk = (n: number, name: string): Branch => {
    const w = weed[String(n)], l = last[n] && (!w || last[n] >= w) ? last[n] : null;
    const from = l ?? w ?? null;
    let idle = from ? dayGap(from, k) : 0;
    if (resting && idle > 0) idle -= 1;    // rest days pause decay
    const blossoms = n ? Array.from({ length: 8 }, (_, i) => st.grid.done[`${n}.${i + 1}`]).filter(Boolean).length : 0;
    return { n, name, last: l, idle, stage: from ? stageOf(idle) : "sprout", blossoms, resting };
  };
  const names = st.defs.grid?.pillars.map((p) => p.name) ?? BRANCH_DEFAULTS;
  return { trunk: mk(0, "Trunk"), list: names.slice(0, 8).map((nm, i) => mk(i + 1, nm)) };
}

export const needsCare = (b: Branch) => b.stage === "wilting" || b.stage === "withered" || b.stage === "dead";
export const anchorsToday = (st: CourtState, k: string) => (st.swins.log[k] || []).length;
export const daysAgo = (k: string, n: number) => addDays(k, -n);
