import { QUESTS, needFor, type Quest } from "./quests";
import { isDone, progOf, rollover, tendGarden, type CourtState, type OwnedKey, type Recap } from "./state";
import { coreDoneOn, questItems } from "./questList";
import { addDays } from "./time";

// Foundations F3: XP only (stars are no longer earned; the saved stars number is kept as it is). The level curve is
// unchanged (needFor). Quest XP gets the streak bonus (+10% / 25% / 50% from 3 / 7 / 14 done days) and doubles in a
// new account's first week. A tiny version is worth half.
export const DONE_BONUS = 10;
export const streakMult = (streak: number) => (streak >= 14 ? 1.5 : streak >= 7 ? 1.25 : streak >= 3 ? 1.1 : 1);
export const weekOne = (st: CourtState, k: string) => !!st.ql.start && k >= st.ql.start && k < addDays(st.ql.start, 7);
export const questXP = (st: CourtState, base: number, k: string, tiny = false) =>
  Math.round((tiny ? base / 2 : base) * streakMult(st.streak) * (weekOne(st, k) ? 2 : 1));

/** Add XP and level up on the unchanged curve. Returns the new level if she levelled up. */
export function addXP(st: CourtState, n: number): number | null {
  st.xp += n;
  let leveled: number | null = null;
  while (st.xp >= needFor(st.lvl)) { st.xp -= needFor(st.lvl); st.lvl += 1; leveled = st.lvl; }
  return leveled;
}

// Quest completion (v52 completeQuest), XP only since F3. Mutates st. Returns the new level if she levelled up.
export function completeQuest(st: CourtState, q: Quest): number | null {
  st.q[q.id] = [1, q.goal];
  return addXP(st, questXP(st, q.xp, st.day));
}

/** F3: the first time today's 3 core quests are all ticked: +10 XP once a day (kept if a tick is undone later).
 *  The first done day after a break is a comeback and counts double: the day's core quest XP is given again on top. */
export function awardDoneDay(st: CourtState, k: string, owner = true): { xp: number; leveled: number | null } {
  if (st.ql.bd === k || !coreDoneOn(st, k, k, owner)) return { xp: 0, leveled: null };
  const comeback = !!st.ql.ld && st.ql.ld < addDays(k, -1);
  const coreXP = questItems(st, k, owner).filter((x) => x.core).reduce((t, x) => t + x.xp, 0);
  const xp = (DONE_BONUS + (comeback ? coreXP + DONE_BONUS : 0)) * (weekOne(st, k) ? 2 : 1);
  st.ql = { ...st.ql, bd: k, ld: k };
  return { xp, leveled: addXP(st, xp) };
}

/** A brand-new account (nothing done yet) starts its first week today: week-one double XP. */
export const isFresh = (st: CourtState) => st.lvl <= 1 && st.xp === 0 && !Object.keys(st.days).length && !Object.keys(st.swins.log).length && !Object.keys(st.hab.log).length;

// Log one step of a manual quest (v52 logQuest). Returns the new level, if any.
export function logQuest(st: CourtState, id: string): { done: boolean; leveled: number | null } {
  const q = QUESTS.find((x) => x.id === id);
  if (!q || isDone(st, id)) return { done: false, leveled: null };
  const p = progOf(st, id) + 1;
  if (p >= q.goal) return { done: true, leveled: completeQuest(st, q) };
  st.q[id] = [0, p];
  return { done: false, leveled: null };
}

// Progress quests counted from things the page sees (v52 quest(evt)).
export function questEvt(st: CourtState, evt: string): boolean {
  let ch = false;
  for (const q of QUESTS) if (q.evt === evt && !isDone(st, q.id)) { logQuest(st, q.id); ch = true; }
  return ch;
}

// What happens on load (v52 applyState + selfChecks): day rollover, garden seeding and watering,
// and the morning-brief quest. Pure, so the server can render the result without a flash.
export function bootState(start: CourtState, k: string, owner = true): { st: CourtState; recap: Recap | null; dirty: OwnedKey[] } {
  const r = rollover(start, k, owner);
  const st = structuredClone(r.st);
  const dirty = new Set<OwnedKey>();
  if (r.recap) ["v", "day", "week", "days", "streak", "q", "prev", "last", "restDay", "ql"].forEach((x) => dirty.add(x as OwnedKey));
  // Foundations F2, first load on the same day: the old rule had already counted today's morning brief, but today now
  // counts once its 3 core quests are ticked, so the saved streak becomes "done days up to yesterday" (never below 0).
  if (st.ql.sv !== 1) { if (isDone(st, "m1")) st.streak = Math.max(0, st.streak - 1); st.ql = { ...st.ql, sv: 1 }; dirty.add("streak"); dirty.add("ql"); }
  if (!st.ql.start && isFresh(st)) { st.ql = { ...st.ql, start: k }; dirty.add("ql"); }
  if (questEvt(st, "brief")) ["q", "xp", "lvl"].forEach((x) => dirty.add(x as OwnedKey));
  if (tendGarden(st, k)) dirty.add("gd");
  return { st, recap: r.recap, dirty: [...dirty] };
}
