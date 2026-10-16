"use client";

import { useEffect } from "react";
import { useCourt } from "./CourtState";

// Loads her calendar events into the court store, then refreshes every 15 minutes (the server caches too).
export function CalendarLoader() {
  const { setCalendar } = useCourt();
  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const r = await fetch("/api/calendar");
        const j = await r.json();
        if (alive) setCalendar(Array.isArray(j.events) ? j.events : [], { state: j.state ?? "error", cals: Array.isArray(j.cals) ? j.cals : [] });
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
