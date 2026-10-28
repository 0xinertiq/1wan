import { addDays, dayGap } from "./time";

// Round 6 records that can be due: Kumo tasks (Calendar) and pets and self-care routines (Life Hub). Pure helpers,
// shared by the Calendar, Life Hub, Today, Needs you now and the Notifications inbox.
export type Task = { id: string; title: string; due?: string; pri?: "high" | "normal" | "low"; done?: boolean; [k: string]: unknown };
export type Routine = { id: string; name: string; kind?: "pet" | "self" | "custom"; every: number; last?: string; start?: string; paused?: boolean; [k: string]: unknown };
export type DueThing = { id: string; name: string; d: string; dd: number; kind: "task" | "routine"; high: boolean };

const isDay = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Next due day of a routine: last done plus its cadence, else its start day, else today. */
export function routineNext(r: Routine, today: string): string {
  const every = Number.isFinite(r.every) && r.every > 0 ? Math.round(r.every) : 7;
  if (isDay(r.last)) return addDays(r.last, every);
  return isDay(r.start) ? r.start : today;
}

/** Open tasks and active routines due within `within` days (overdue included), soonest first. */
export function dueSoon(tasks: Task[], routines: Routine[], today: string, within = 3): DueThing[] {
  const out: DueThing[] = [];
  // Today to-dos (round 10) live on the Today card only
  for (const t of tasks) if (t && !t.done && !t.todo && isDay(t.due) && typeof t.title === "string") out.push({ id: "task" + t.id, name: t.title, d: t.due, dd: dayGap(today, t.due), kind: "task", high: t.pri === "high" });
  for (const r of routines) if (r && !r.paused && typeof r.name === "string") { const d = routineNext(r, today); out.push({ id: "rt" + r.id + d, name: r.name, d, dd: dayGap(today, d), kind: "routine", high: false }); }
  return out.filter((x) => x.dd <= within).sort((a, b) => a.dd - b.dd || Number(b.high) - Number(a.high));
}
