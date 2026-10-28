"use client";

import { createContext } from "react";
import type { CourtState } from "@/lib/court/state";
import { wdOf } from "@/lib/court/time";

// Round 7: the Notifications tab and the bell are retired; the alert pop-ups (components/court/Alerts.tsx) read the
// same inputs from here. Her stored notification choices stay in her prefs untouched (an explicit "off" still mutes).

type Brief = { key: string; label: string; at: string };
export const InboxCtx = createContext<{ briefs: Brief[]; review: string | null }>({ briefs: [], review: null });
export const InboxProvider = ({ briefs, review, children }: { briefs: Brief[]; review: string | null; children: React.ReactNode }) => <InboxCtx.Provider value={{ briefs, review }}>{children}</InboxCtx.Provider>;

export function habitsToday(st: CourtState, k: string) {
  const wd = wdOf(k), done = st.hab.log[k] ?? [];
  return st.hab.list.filter((h) => !h.paused && h.days.includes(wd) && !done.includes(h.id)).map((h) => ({ id: h.id, name: h.name }));
}
