"use client";

import { useEffect } from "react";
import { useCourt } from "./CourtState";
import type { CalEvent } from "@/lib/court/state";

// Only well-formed events get in (an object with a day key); a missing title or calendar name gets a safe default,
// so one odd event cannot break the cards that read the calendar.
export function cleanEvents(raw: unknown): CalEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((e): e is CalEvent => !!e && typeof e === "object" && typeof (e as CalEvent).sk === "string" && (e as CalEvent).sk.length === 10)
    .map((e) => ({ ...e, title: typeof e.title === "string" ? e.title : "(no title)", cal: typeof e.cal === "string" ? e.cal : "", color: typeof e.color === "string" ? e.color : "", allDay: !!e.allDay, ek: typeof e.ek === "string" ? e.ek : e.sk, sm: Number.isFinite(e.sm) ? e.sm : 0, em: Number.isFinite(e.em) ? e.em : 0 }));
}

// Loads her calendar events into the court store, then refreshes every 15 minutes (the server caches too).
export function CalendarLoader() {
  const { setCalendar } = useCourt();
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/calendar");
        const j = await r.json();
        if (alive) setCalendar(cleanEvents(j.events), { state: j.state ?? "error", cals: Array.isArray(j.cals) ? j.cals : [] });
      } catch {
        if (alive) setCalendar([], { state: "error", cals: [] });
      }
    }
    load();
    const t = window.setInterval(load, 15 * 60 * 1000);
    return () => { alive = false; window.clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
