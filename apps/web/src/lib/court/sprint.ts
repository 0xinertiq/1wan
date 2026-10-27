import type { CourtState } from "./state";
import { weekKey } from "./time";

// Focus sprints (quest k7). Each sprint carries a tag; study hours in Samsara and the weekly packet
// come from sprints tagged "study" this week (Monday to Sunday SGT), plus any half-hours she typed by hand.
export const SPRINT_MIN = 25;
export type SprintTag = "study" | "other";
export type SprintLog = { at: string; tag: SprintTag; min: number };

const sgtKey = (iso: string) => new Date(Date.parse(iso) + 8 * 3600000).toISOString().slice(0, 10);

export function sprintMinutes(st: CourtState, wk: string, tag: SprintTag = "study") {
  return st.spr.log.filter((s) => s.tag === tag && weekKey(sgtKey(s.at)) === wk).reduce((a, s) => a + s.min, 0);
}
export const sprintHours = (st: CourtState, wk: string) => Math.round((sprintMinutes(st, wk) / 60) * 10) / 10;

// Typed half-hours plus tagged study sprints, for this week only.
export function studyHours(st: CourtState, wk: string) {
  const typed = st.samsara.t.wk === wk ? st.samsara.t.hours : 0;
  const spr = sprintHours(st, wk);
  return { typed, spr, total: Math.round((typed + spr) * 10) / 10 };
}
