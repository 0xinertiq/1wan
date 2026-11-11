"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CalEvent, CourtState, OwnedKey, Recap } from "@/lib/court/state";
import type { PriceResult } from "@/lib/prices";
import { OWNED_KEYS, normalize, tendGarden } from "@/lib/court/state";
import { merge3, same } from "@/lib/court/merge";
import { awardDoneDay } from "@/lib/court/actions";
import { gameKey, sgt } from "@/lib/court/time";

// Foundations F2: key = the game day (changes at 4am in her own time zone); min = real minutes since Singapore midnight.
const clock = (d: Date, tz: unknown) => ({ key: gameKey(d, tz), min: sgt(d).min });

// One client store for her state document. Changes save in the background (debounced) to /api/state,
// sending only the keys that changed, with the version she loaded.

export type SaveState = "idle" | "saving" | "saved" | "offline" | "signedout";
export type CalState = { state: "off" | "loading" | "live" | "error"; cals: { name: string; color: string; ok: boolean }[];
  // round 22: whose calendar this is. "owner": hers from the server settings; otherwise the account's own Google
  // Calendar: "none" (not connected), "connected", "expired" (connect again) or "unavailable" (not set up yet)
  google?: "owner" | "none" | "connected" | "expired" | "unavailable"; account?: string };
export type Sheet = { kind: "crew"; id: string } | { kind: "settings" } | { kind: "wins" } | { kind: "birth" } | { kind: "packet" } | null;

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
  prices: PriceResult | null;
  setPrices: (p: PriceResult) => void;
  pxBusy: boolean;      // true only while a real price fetch is running
  setPxBusy: (b: boolean) => void;
  sheet: Sheet;
  openSheet: (s: Sheet) => void;
};

// Exported for the render tests (tests/render.test.mjs), which give components loaded data directly.
export const CourtCtx = createContext<Ctx | null>(null);
export type CourtCtxValue = Ctx;

export function useCourt() {
  const c = useContext(CourtCtx);
  if (!c) throw new Error("useCourt outside CourtProvider");
  return c;
}

export function CourtProvider({ initial, version, recap: recap0, dirty, nowIso, base, owner = true, children }: {
  initial: CourtState; version: number; recap: Recap | null; dirty: OwnedKey[]; nowIso: string; children: React.ReactNode;
  owner?: boolean; // F3: which quests count as core for the done-day bonus (friends never have her trading quests)
  base?: unknown; // the saved document as loaded (before rollover), for the two-device merge; unknown counts as empty,
                  // so every change on this device is kept
}) {
  const [st, setSt] = useState(initial);
  const [now, setNow] = useState(() => clock(new Date(nowIso), initial.prefs.tz));
  const [recap, setRecap] = useState(recap0);
  const [save, setSave] = useState<SaveState>("idle");
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [cal, setCal] = useState<CalState>({ state: "loading", cals: [] });
  const [prices, setPrices] = useState<PriceResult | null>(null);
  const [pxBusy, setPxBusy] = useState(false);
  const [sheet, openSheet] = useState<Sheet>(null);

  const stRef = useRef(st);
  const ver = useRef(version);
  // What this device last knew the server had, per key (round 22, two devices): updated after every save.
  const known = useRef<CourtState>(normalize(base ?? {}, clock(new Date(nowIso), initial.prefs.tz).key));
  const pending = useRef(new Set<OwnedKey>(dirty));
  const timer = useRef<number | undefined>(undefined);
  const inFlight = useRef(false);
  // The sign-in has expired (the save answered 401): stop retrying, keep the changes, ask her to sign in again,
  // and save as soon as she is back on this tab.
  const signedOut = useRef(false);

  const flush = useCallback(async () => {
    if (inFlight.current || !pending.current.size) return;
    inFlight.current = true;
    const keys = [...pending.current];
    pending.current.clear();
    const patch: Record<string, unknown> = {};
    for (const key of keys) patch[key] = stRef.current[key];
    setSave("saving");
    try {
      // keepalive while the tab is going away, so a tick made just before closing still reaches the server
      // (browsers cap keepalive bodies at 64KB; a bigger one fails here and is retried when she is back)
      const r = await fetch("/api/state", { method: "POST", keepalive: document.visibilityState === "hidden", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ version: ver.current, patch }) });
      if (r.status === 401) { signedOut.current = true; keys.forEach((x) => pending.current.add(x)); setSave("signedout"); return; }
      // Out of date: another device saved first. Merge its newer copy with this device's changes, key by key
      // (merge3: ticks on both devices are kept), show the result, and save what still differs.
      const sj = r.status === 409 ? await r.json().catch(() => null) : null;
      if (sj?.stale && typeof sj.version === "number") {
        const remote = normalize(sj.data ?? {}, clock(new Date(), stRef.current.prefs.tz).key), cur = stRef.current;
        const merged = { ...cur } as Record<string, unknown>;
        for (const key of OWNED_KEYS) merged[key] = merge3(known.current[key], cur[key], remote[key]) ?? remote[key];
        stRef.current = merged as CourtState;
        setSt(stRef.current);
        known.current = remote;
        ver.current = sj.version;
        for (const key of OWNED_KEYS) if (!same(merged[key], remote[key])) pending.current.add(key);
        return;
      }
      if (!r.ok) throw new Error(String(r.status));
      const j = await r.json();
      ver.current = j.version;
      known.current = { ...known.current, ...patch } as CourtState;
      setSave("saved");
    } catch {
      keys.forEach((x) => pending.current.add(x));
      setSave("offline");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(flush, 15000); // one calm retry later, not a loop of hammering
    } finally {
      inFlight.current = false;
      if (pending.current.size && !timer.current && !signedOut.current) timer.current = window.setTimeout(flush, 800);
    }
  }, []);

  const schedule = useCallback(() => {
    window.clearTimeout(timer.current);
    if (signedOut.current) return; // kept until she has signed in again
    timer.current = window.setTimeout(() => { timer.current = undefined; flush(); }, 800);
  }, [flush]);

  const update = useCallback((fn: (d: CourtState) => void, keys: OwnedKey[]) => {
    const d = structuredClone(stRef.current);
    fn(d);
    const today = clock(new Date(), d.prefs.tz).key;
    // Habit watering follows every change (v52 autoWater ran on each save).
    if (tendGarden(d, today) && !keys.includes("gd")) keys = [...keys, "gd"];
    // F3: the first time today's 3 core quests are all ticked, the done-day bonus (once a day).
    if (d.day === today) { const a = awardDoneDay(d, today, owner); if (a.xp) { keys = [...new Set([...keys, "xp", "lvl", "ql"] as OwnedKey[])]; if (a.leveled) window.setTimeout(() => lvlRef.current(a.leveled!), 0); } }
    stRef.current = d;
    setSt(d);
    keys.forEach((x) => pending.current.add(x));
    schedule();
  }, [schedule, owner]);

  // Save what loading changed (rollover, morning-brief quest, garden).
  useEffect(() => { if (pending.current.size) schedule(); }, [schedule]);

  // Clock, and a save before the tab goes away.
  useEffect(() => {
    const t = window.setInterval(() => setNow(clock(new Date(), stRef.current.prefs.tz)), 30000);
    setNow(clock(new Date(), stRef.current.prefs.tz));
    const hide = () => { if (document.visibilityState === "hidden") flush(); };
    // back on this tab after signing in again (the button opens the login screen in a new tab): save what waited
    const back = () => { if (signedOut.current && document.visibilityState === "visible") { signedOut.current = false; flush(); } };
    document.addEventListener("visibilitychange", hide);
    document.addEventListener("visibilitychange", back);
    window.addEventListener("focus", back);
    return () => { window.clearInterval(t); document.removeEventListener("visibilitychange", hide); document.removeEventListener("visibilitychange", back); window.removeEventListener("focus", back); };
  }, [flush]);

  // Past 4am (her time zone) with the page still open: save, then reload so the rollover runs.
  useEffect(() => {
    if (now.key === stRef.current.day) return;
    const t = window.setTimeout(async () => { await flush(); window.location.reload(); }, 3000);
    return () => window.clearTimeout(t);
  }, [now.key, flush]);

  const lvlRef = useRef<(lvl: number) => void>(() => {});
  const levelUp = useCallback((lvl: number) => {
    const b = document.getElementById("lvlBanner"), t = document.getElementById("lvlTxt"), s = document.getElementById("lvlSub");
    if (!b || !t) return;
    t.textContent = "LEVEL " + lvl;
    if (s) s.textContent = "Kumo approves your promotion";
    b.hidden = false;
    window.setTimeout(() => { b.hidden = true; }, 2800);
  }, []);
  lvlRef.current = levelUp;

  const value = useMemo<Ctx>(() => ({
    st, k: now.key, nm: now.min, recap, clearRecap: () => setRecap(null), update, levelUp, save,
    events, cal, setCalendar: (e, c) => { setEvents(e); setCal(c); },
    prices, setPrices, pxBusy, setPxBusy, sheet, openSheet,
  }), [st, now, recap, update, levelUp, save, events, cal, prices, pxBusy, sheet]);

  return <CourtCtx.Provider value={value}>{children}</CourtCtx.Provider>;
}
