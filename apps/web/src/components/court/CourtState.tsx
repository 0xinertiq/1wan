"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CalEvent, CourtState, OwnedKey, Recap } from "@/lib/court/state";
import { tendGarden } from "@/lib/court/state";
import { sgt } from "@/lib/court/time";

// One client store for her state document. Changes save in the background (debounced) to /api/state,
// sending only the keys that changed, with the version she loaded.

export type SaveState = "idle" | "saving" | "saved" | "offline";
export type CalState = { state: "off" | "loading" | "live" | "error"; cals: { name: string; color: string; ok: boolean }[] };

type Ctx = {
  st: CourtState;
  k: string;            // today, SGT day key
  nm: number;           // minutes since SGT midnight, ticks each minute
  recap: Recap | null;
  clearRecap: () => void;
  update: (fn: (d: CourtState) => void, keys: OwnedKey[]) => void;
  levelUp: (lvl: number) => void;
  save: SaveState;
  events: CalEvent[];
  cal: CalState;
  setCalendar: (events: CalEvent[], cal: CalState) => void;
};

const CourtCtx = createContext<Ctx | null>(null);

export function useCourt() {
  const c = useContext(CourtCtx);
  if (!c) throw new Error("useCourt outside CourtProvider");
  return c;
}

export function CourtProvider({ initial, version, recap: recap0, dirty, nowIso, children }: {
  initial: CourtState; version: number; recap: Recap | null; dirty: OwnedKey[]; nowIso: string; children: React.ReactNode;
}) {
  const [st, setSt] = useState(initial);
  const [now, setNow] = useState(() => sgt(new Date(nowIso)));
  const [recap, setRecap] = useState(recap0);
  const [save, setSave] = useState<SaveState>("idle");
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [cal, setCal] = useState<CalState>({ state: "loading", cals: [] });

  const stRef = useRef(st);
  const ver = useRef(version);
  const pending = useRef(new Set<OwnedKey>(dirty));
  const timer = useRef<number | undefined>(undefined);
  const inFlight = useRef(false);

  const flush = useCallback(async () => {
    if (inFlight.current || !pending.current.size) return;
    inFlight.current = true;
    const keys = [...pending.current];
    pending.current.clear();
    const patch: Record<string, unknown> = {};
    for (const key of keys) patch[key] = stRef.current[key];
    setSave("saving");
    try {
      const r = await fetch("/api/state", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: ver.current, patch }) });
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      ver.current = j.version;
      setSave("saved");
    } catch {
      keys.forEach((x) => pending.current.add(x));
      setSave("offline");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, 15000); // one calm retry later, not a loop of hammering
    } finally {
      inFlight.current = false;
      if (pending.current.size && !timer.current) timer.current = window.setTimeout(flush, 800);
    }
  }, []);

  const schedule = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { timer.current = undefined; flush(); }, 800);
  }, [flush]);

  const update = useCallback((fn: (d: CourtState) => void, keys: OwnedKey[]) => {
    const d = structuredClone(stRef.current);
    fn(d);
    // Habit watering follows every change (v52 autoWater ran on each save).
    if (tendGarden(d, sgt(new Date()).key) && !keys.includes("gd")) keys = [...keys, "gd"];
    stRef.current = d;
    setSt(d);
    keys.forEach((x) => pending.current.add(x));
    schedule();
  }, [schedule]);

  // Save what loading changed (rollover, morning-brief quest, garden).
  useEffect(() => { if (pending.current.size) schedule(); }, [schedule]);

  // Clock, and a save before the tab goes away.
  useEffect(() => {
    const t = window.setInterval(() => setNow(sgt(new Date())), 30000);
    setNow(sgt(new Date()));
    const hide = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", hide);
    return () => { window.clearInterval(t); document.removeEventListener("visibilitychange", hide); };
  }, [flush]);

  // Past midnight in Singapore with the page still open: save, then reload so the rollover runs.
  useEffect(() => {
    if (now.key === stRef.current.day) return;
    const t = window.setTimeout(async () => { await flush(); window.location.reload(); }, 3000);
    return () => window.clearTimeout(t);
  }, [now.key, flush]);

  const levelUp = useCallback((lvl: number) => {
    const b = document.getElementById("lvlBanner"), t = document.getElementById("lvlTxt"), s = document.getElementById("lvlSub");
    if (!b || !t) return;
    t.textContent = "LEVEL " + lvl;
    if (s) s.textContent = "Kumo approves your promotion";
    b.hidden = false;
    window.setTimeout(() => { b.hidden = true; }, 2800);
  }, []);

  const value = useMemo<Ctx>(() => ({
    st, k: now.key, nm: now.min, recap, clearRecap: () => setRecap(null), update, levelUp, save,
    events, cal, setCalendar: (e, c) => { setEvents(e); setCal(c); },
  }), [st, now, recap, update, levelUp, save, events, cal]);

  return <CourtCtx.Provider value={value}>{children}</CourtCtx.Provider>;
}
