import { nextDue, type LifeItem } from "./state";
import { routineNext, type Routine, type Task } from "./vaultDue";
import { dayGap } from "./time";

// Foundations F5: ONE Home list (tasks, routines and life admin), built from where each already lives: tasks and
// routines in their own records, life admin (bills, care, renewals) in her saved state. Nothing is copied or moved,
// so the desktop Routine, My tasks and Life admin cards keep reading their own records and look the same. The phone
// Life tab opens this list as one sheet. Today's to-dos stay on the Today card, as before.
export type HomeSrc = "task" | "routine" | "admin";
export type HomeItem = { id: string; src: HomeSrc; ref: string; title: string; due: string | null; dd: number | null; high: boolean; note?: string; amt?: number | null };

const isDay = (s: unknown): s is string => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

export function homeItems(tasks: Task[], routines: Routine[], life: LifeItem[], today: string): HomeItem[] {
  const out: HomeItem[] = [];
  for (const t of tasks) if (t && !t.done && !t.todo && typeof t.title === "string") {
    const due = isDay(t.due) ? t.due : null;
    out.push({ id: "t:" + t.id, src: "task", ref: t.id, title: t.title, due, dd: due ? dayGap(today, due) : null, high: t.pri === "high" });
  }
  for (const r of routines) if (r && !r.paused && typeof r.name === "string") {
    const due = routineNext(r, today);
    out.push({ id: "r:" + r.id, src: "routine", ref: r.id, title: r.name, due, dd: dayGap(today, due), high: false });
  }
  for (const it of life) if (it && typeof it.name === "string") {
    const due = nextDue(it, today);
    out.push({ id: "l:" + it.id, src: "admin", ref: it.id, title: it.name, due, dd: due ? dayGap(today, due) : null, high: false, note: it.cat, amt: it.amt });
  }
  // soonest first (overdue on top), undated last; the important ones first within a day
  return out.sort((a, b) => (a.dd ?? 1e9) - (b.dd ?? 1e9) || Number(b.high) - Number(a.high) || a.title.localeCompare(b.title));
}

export const homeFilter = (items: HomeItem[], src: HomeSrc | "all") => (src === "all" ? items : items.filter((x) => x.src === src));
