import type { CourtState } from "./state";
import { addDays } from "./time";

// Kumo's nine tails, ported from dashboard-v52 (TAILS) and re-pointed to the new data:
// streaks from daily anchors, level from XP, wins and gratitude from the Diary, posts from the shared
// counter, courses from Samsara. Once earned a tail stays (key tails, as in v52).
export function anchorStreak(st: CourtState, k: string) {
  const has = (d: string) => (st.swins.log[d] || []).length > 0;
  let d = has(k) ? k : addDays(k, -1), n = 0;
  while (has(d) && n < 400) { n++; d = addDays(d, -1); }
  return n;
}

export const TAILS: { n: string; h: string; ok: (st: CourtState, k: string) => boolean }[] = [
  { n: "Steady Flame", h: "a 3-day streak of daily anchors", ok: (st, k) => anchorStreak(st, k) >= 3 },
  { n: "Seven Moons", h: "a 7-day streak of daily anchors", ok: (st, k) => anchorStreak(st, k) >= 7 },
  { n: "Rising Qi", h: "reach level 5", ok: (st) => st.lvl >= 5 },
  { n: "First Win", h: "log a win in the Diary", ok: (st) => Object.values(st.wins).some((w) => w?.w) },
  { n: "Grateful Heart", h: "7 days of gratitude lines", ok: (st) => Object.values(st.wins).filter((w) => w?.g).length >= 7 },
  { n: "Found Voice", h: "post once and count it", ok: (st) => (st.cad?.ig || 0) + (st.cad?.x || 0) >= 1 },
  { n: "Tidy Hearth", h: "tick off a life admin item", ok: (st) => st.life.some((i) => i.paid) || Object.values(st.money.done).some(Boolean) },
  { n: "Scholar", h: "finish a course (Samsara)", ok: (st) => ["b1", "c1", "e1"].some((id) => st.samsara.done[id]) },
  { n: "Ascension", h: "reach level 12", ok: (st) => st.lvl >= 12 },
];

export const earned = (st: CourtState, k: string) => TAILS.map((t, i) => st.tails.includes(i) || t.ok(st, k));

export function tailSvg(on: boolean[]) {
  let h = '<svg viewBox="0 0 200 122" width="200" height="122" aria-hidden="true">';
  const s = "#C9B6FF";
  for (let i = 0; i < 9; i++) {
    const a = -80 + i * 20;
    h += `<g transform="translate(100 92) rotate(${a})"><path d="M0 0C-16 -8 -20 -34 -4 -62C0 -54 8 -50 12 -38C16 -22 10 -6 0 0Z" fill="${on[i] ? "#fff" : "none"}" stroke="${on[i] ? s : "var(--line)"}" stroke-width="2" stroke-linejoin="round"${on[i] ? "" : ' stroke-dasharray="3 3" opacity=".45"'}/>${on[i] ? '<path d="M-4 -62C0 -54 8 -50 12 -38C8 -40 2 -44 -4 -62Z" fill="#FFC2DD"/>' : ""}</g>`;
  }
  return h + `<ellipse cx="100" cy="98" rx="22" ry="18" fill="#fff" stroke="${s}" stroke-width="2"/><path d="M86 60 L82 38 L97 52 Z" fill="#fff" stroke="${s}" stroke-width="2" stroke-linejoin="round"/><path d="M114 60 L118 38 L103 52 Z" fill="#fff" stroke="${s}" stroke-width="2" stroke-linejoin="round"/></svg>`;
}
