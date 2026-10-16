import { QUESTS, needFor, type Quest } from "./quests";
import { isDone, progOf, rollover, tendGarden, type CourtState, type OwnedKey, type Recap } from "./state";

// Quest completion from v52 completeQuest/addXP: stars, streak (morning brief only), EXP and level-ups.
// Mutates st. Returns the new level if she levelled up.
export function completeQuest(st: CourtState, q: Quest): number | null {
  st.q[q.id] = [1, q.goal];
  st.stars += q.star;
  if (q.streak) st.streak += 1;
  st.xp += q.xp;
  let leveled: number | null = null;
  while (st.xp >= needFor(st.lvl)) { st.xp -= needFor(st.lvl); st.lvl += 1; leveled = st.lvl; }
  return leveled;
}

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
export function bootState(start: CourtState, k: string): { st: CourtState; recap: Recap | null; dirty: OwnedKey[] } {
  const r = rollover(start, k);
  const st = structuredClone(r.st);
  const dirty = new Set<OwnedKey>();
  if (r.recap) ["v", "day", "week", "days", "streak", "q", "prev", "last", "restDay"].forEach((x) => dirty.add(x as OwnedKey));
  if (questEvt(st, "brief")) ["q", "stars", "streak", "xp", "lvl"].forEach((x) => dirty.add(x as OwnedKey));
  if (tendGarden(st, k)) dirty.add("gd");
  return { st, recap: r.recap, dirty: [...dirty] };
}
