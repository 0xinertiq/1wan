import type { CourtState, Win } from "./state";

// Foundations F4: one journal record per day. Win, thanks and mood live together in her synced wins record
// (st.wins[day]: w = what went well / the day's win, g = thanks, m = mood 1 to 5), which is already saved with her
// state and exported. Her old diary moods (st.mood, imported) are read as they are and never rewritten. Moods that
// were picked on a Dungeon page before F4 were kept only on that device; they are copied in once, never overwriting.
export const MOOD_MIN = 1, MOOD_MAX = 5;
const okMood = (m: unknown): m is number => Number.isInteger(m) && (m as number) >= MOOD_MIN && (m as number) <= MOOD_MAX;

/** The mood for a day: the journal record first, then her old diary mood, then a mood only this device knew. */
export function moodOf(st: Pick<CourtState, "wins" | "mood">, d: string, deviceMood?: unknown): number | null {
  const w = (st.wins[d] as (Win & { m?: unknown }) | undefined)?.m;
  if (okMood(w)) return w;
  if (okMood(st.mood[d]?.m)) return st.mood[d].m;
  return okMood(deviceMood) ? deviceMood : null;
}

/** Set the mood in the day's journal record (other fields kept). */
export function setMood(st: Pick<CourtState, "wins">, d: string, m: number) {
  if (!okMood(m)) return;
  st.wins = { ...st.wins, [d]: { ...(st.wins[d] ?? {}), m } as Win };
}

/** Device-only Dungeon moods that the synced record does not have yet: [day, mood] pairs to copy in once. */
export function moodsToCopy(st: Pick<CourtState, "wins" | "mood">, rows: { day: string; mood?: unknown }[]): [string, number][] {
  return rows.filter((e) => typeof e.day === "string" && okMood(e.mood) && moodOf(st, e.day) === null).map((e) => [e.day, e.mood as number]);
}

/** Has the day any written journal lines (a mood alone does not count as written)? */
export const wroteOn = (w: Win | undefined) => !!(w?.w || w?.g || w?.n);

/** The day's journal record as one object. */
export function journalDay(st: Pick<CourtState, "wins" | "mood">, d: string, page?: { text?: string; mood?: unknown }) {
  const w = st.wins[d] ?? {};
  return { win: w.w ?? "", thanks: w.g ?? "", notes: w.n ?? "", mood: moodOf(st, d, page?.mood), text: page?.text ?? "" };
}
