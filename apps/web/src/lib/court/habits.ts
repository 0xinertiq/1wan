import type { Habit, Phase } from "./state";
import { addDays, wdOf, weekKey } from "./time";

// Her own habits (optional key hab) and where they show (round 7). My habits in the Garden is the single place to
// add or edit them; Quests and the Wins ladder read the same list, so there is never a second copy to keep in step.
// Derived only: nothing here is stored, no XP is awarded, and the Small Wins ids and ticks are never touched.
type Hab = { list: Habit[]; log: Record<string, string[]> };
export const HAB_PREFIX = "hab:";

const unique = (list: Habit[]) => { const seen = new Set<string>(); return list.filter((h) => (seen.has(h.id) ? false : (seen.add(h.id), true))); };
const weekSoFar = (k: string) => { const wk = weekKey(k); return Array.from({ length: 7 }, (_, i) => addDays(wk, i)).filter((d) => d <= k); };

/** This week in the garden, rule-based. */
export function habitWeek(st: { hab: Hab; swins: { log: Record<string, string[]> } }, k: string) {
  const days = weekSoFar(k);
  const planned = days.reduce((t, d) => { const wd = wdOf(d); return t + st.hab.list.filter((h) => !h.paused && h.days.includes(wd)).length; }, 0);
  const done = days.reduce((t, d) => t + (st.hab.log[d] ?? []).filter((id) => st.hab.list.some((h) => h.id === id)).length, 0);
  const anchors = days.reduce((t, d) => t + (st.swins.log[d] ?? []).length, 0);
  return { days: days.length, planned, done, anchors };
}

/** Her habits scheduled today (not paused), as Quest rows; ticking one ticks the same habit in My habits. */
export function habitQuests(hab: Hab, k: string) {
  const wd = wdOf(k), today = hab.log[k] ?? [];
  return unique(hab.list).filter((h) => !h.paused && h.days.includes(wd)).map((h) => ({ id: h.id, name: h.name, done: today.includes(h.id) }));
}

/** Her habits as one extra phase of the Wins ladder, ticked for today (the same tick as My habits and Quests). */
export function habitPhase(hab: Hab, k: string): { phase: Phase; done: Record<string, boolean> } | null {
  const live = unique(hab.list).filter((h) => !h.paused);
  if (!live.length) return null;
  const today = hab.log[k] ?? [];
  return {
    phase: { id: "hab", title: "Your habits", when: "today", why: "Added in My habits. Tick them there, in Quests or here: it is the same habit.", items: live.map((h) => [HAB_PREFIX + h.id, h.name, "from My habits"]) },
    done: Object.fromEntries(live.map((h) => [HAB_PREFIX + h.id, today.includes(h.id)])),
  };
}

/** Round 10 (D1): the garden's stage from real activity ticked this week (quests done, anchor ticks, her habits).
 *  1 tick sprouts it, 5 give leaves, 12 a young tree, 20 blossoms. Decay and recovery (branches) are unchanged. */
export const GROW_AT = [0, 1, 5, 12, 20] as const;
export const gardenStage = (ticks: number) => GROW_AT.reduce<number>((s, at, i) => (ticks >= at ? i : s), 0);
