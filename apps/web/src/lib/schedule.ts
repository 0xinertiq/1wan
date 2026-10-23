import type { BriefKind } from "./briefKinds";
import { addDays, hm, wdName, wdOf } from "./court/time";

// Her scheduled cloud tasks (CLAUDE.md), in Singapore time, and which crew member files each one.
// days: 0 is Sunday; left out means every day (Pulse weekday and weekend both run at 07:27).
export type Run = { kind: BriefKind; crew: string; min: number; days?: number[] };

export const RUNS: Run[] = [
  { kind: "scan", crew: "fenn", min: 3 * 60 + 50 },
  { kind: "pulse", crew: "momo", min: 7 * 60 + 27 },
  { kind: "intel", crew: "olli", min: 7 * 60 + 52 },
  { kind: "review", crew: "kumo", min: 8 * 60 + 50, days: [0] },
  { kind: "movers", crew: "pip", min: 14 * 60 + 30 },
];

export type NextRun = { run: Run; key: string; min: number; label: string };

// The next run after now (SGT day key and minutes), optionally only for one crew member.
export function nextRun(k: string, nm: number, crew?: string): NextRun | null {
  const runs = RUNS.filter((r) => !crew || r.crew === crew);
  for (let i = 0; i < 8; i++) {
    const key = addDays(k, i);
    const wd = wdOf(key);
    const hit = runs
      .filter((r) => (!r.days || r.days.includes(wd)) && (i > 0 || r.min > nm))
      .sort((a, b) => a.min - b.min)[0];
    if (hit) return { run: hit, key, min: hit.min, label: i === 0 ? hm(hit.min) : i === 1 ? `tomorrow ${hm(hit.min)}` : `${wdName(wd)} ${hm(hit.min)}` };
  }
  return null;
}

export const kindsOf = (crew: string) => RUNS.filter((r) => r.crew === crew).map((r) => r.kind);
