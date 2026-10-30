"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCourt } from "./CourtState";
import { useEcon } from "./live/EconLive";
import { isAutoPaid } from "./live/TodayLive";
import { needs } from "./live/CourtHome";
import { InboxCtx, habitsToday } from "./pages/Inbox";
import { useReview } from "@/components/kumo/reviewRead";
import { useUi } from "@/components/kumo/useUi";
import { dueList } from "@/lib/court/state";
import { liquidityList } from "@/lib/liquidity";
import { AGENT_NAME, buildAlerts, showing, type Agent, type Alert } from "@/lib/court/alerts";
import { dueSoon } from "@/lib/court/vaultDue";
import { isStringList, readSaved, writeSaved } from "@/lib/court/store";
import { sgtHourOf } from "@/lib/court/time";
import { useVault } from "@/lib/vault";

// Alert pop-ups (round 7, replaces the Notifications tab): a pixel "!" on the agent, on the Court roster and in
// their room banner. A click opens a small speech bubble: what needs doing, a link to its one place, Dismiss and
// Later (three hours). Dismissed and later choices are kept on this device. New look only; nothing is pushed.

type Ctx = { alerts: Alert[]; dismiss: (id: string) => void; later: (id: string) => void };
const AlertCtx = createContext<Ctx>({ alerts: [], dismiss: () => {}, later: () => {} });
const isLater = (v: unknown): v is Record<string, number> => !!v && typeof v === "object" && !Array.isArray(v) && Object.values(v).every((n) => typeof n === "number");
const LATER_MS = 3 * 3600e3;

export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const { st, k, nm, events } = useCourt();
  const { briefs, review } = useContext(InboxCtx);
  const rv = useReview(review);
  const econ = useEcon();
  const tasks = useVault("tasks"), routines = useVault("routines");
  const [gone, setGone] = useState<string[]>([]);
  const [later, setLater] = useState<Record<string, number>>({});
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setGone(readSaved("alerts.dismissed", isStringList, []));
    setLater(readSaved("alerts.later", isLater, {}));
    setReady(true);
    // look again every ten minutes, so "Later" alerts come back and the hour rules move on
    const t = window.setInterval(() => setTick((n) => n + 1), 600e3);
    return () => window.clearInterval(t);
  }, []);
  const all = useMemo(() => {
    const vdue = dueSoon(tasks.rows as never, routines.rows as never, k, 0);
    const life = dueList(st, k, events).filter((x) => !isAutoPaid(x.it) && x.dd <= 0);
    return buildAlerts({
      k, hour: sgtHourOf(Date.now()),
      briefs: briefs.filter((b) => Date.parse(b.at) > Date.now() - 86400e3),
      releases: liquidityList(econ?.items ?? [], Date.now(), Date.now() + 2 * 86400e3).map((r) => ({ at: r.at, name: r.name })),
      due: [...vdue.map((x) => ({ id: x.id, name: x.name, dd: x.dd, kind: x.kind })), ...life.map((x) => ({ id: x.it.id, name: x.it.name, dd: x.dd, kind: "life" as const }))],
      habits: habitsToday(st, k),
      needs: needs(st, k, nm, events, []).filter((n) => n.id.startsWith("ev")).map((n) => ({ id: n.id, t: n.t })),
      review: review ? { at: review, unread: rv.unread } : null,
      on: (id) => st.prefs.notif?.[id] !== false,
    });
  }, [st, k, nm, events, briefs, review, rv.unread, econ, tasks.rows, routines.rows, tick]); // eslint-disable-line react-hooks/exhaustive-deps
  // nothing shows until her Dismiss and Later choices are read, so a dismissed "!" never flashes on load
  const alerts = ready ? showing(all, gone, later, Date.now()) : [];
  const dismiss = (id: string) => { const x = [...new Set([...gone, id])].slice(-300); setGone(x); writeSaved("alerts.dismissed", x); };
  const putOff = (id: string) => {
    const now = Date.now();
    const x = Object.fromEntries([...Object.entries(later).filter(([, t]) => t > now), [id, now + LATER_MS]]);
    setLater(x); writeSaved("alerts.later", x);
  };
  return <AlertCtx.Provider value={{ alerts, dismiss, later: putOff }}>{children}</AlertCtx.Provider>;
}

export const useAlerts = () => useContext(AlertCtx);

/** The pixel "!" on an agent (only when that agent has something), and its speech bubble. */
export function AlertMark({ agent }: { agent: Agent }) {
  const ui = useUi();
  const { alerts, dismiss, later } = useAlerts();
  const mine = alerts.filter((a) => a.agent === agent);
  const [at, setAt] = useState<{ left: number; top: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null), pop = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!at) return;
    const close = (e: Event) => { if (!pop.current?.contains(e.target as Node) && !btn.current?.contains(e.target as Node)) setAt(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setAt(null); btn.current?.focus(); } };
    const away = () => setAt(null);
    document.addEventListener("pointerdown", close); document.addEventListener("keydown", esc); window.addEventListener("resize", away); window.addEventListener("scroll", away, true);
    pop.current?.querySelector<HTMLElement>("a,button")?.focus();
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); window.removeEventListener("resize", away); window.removeEventListener("scroll", away, true); };
  }, [at]);
  useEffect(() => { if (!mine.length) setAt(null); }, [mine.length]);
  if (ui !== "new" || !mine.length) return null;
  const open = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    setAt(at ? null : { left: Math.max(16, Math.min(r.left - 24, window.innerWidth - 336)), top: r.bottom + 8 });
  };
  return (
    <>
      <button ref={btn} type="button" className="kalert" aria-expanded={!!at} aria-label={`${AGENT_NAME[agent]} has ${mine.length === 1 ? "something" : mine.length + " things"} for you`} onClick={open}>
        <svg viewBox="0 0 5 9" shapeRendering="crispEdges" aria-hidden="true">
          {["XXXXX", "XgggX", "XgggX", "XgggX", ".XgX.", ".XXX.", "XXXXX", "XgggX", "XXXXX"].flatMap((row, y) => row.split("").map((c, x) => (c === "." ? null : <rect key={x + "-" + y} className={"ka-" + c} x={x} y={y} width={1} height={1} />)))}
        </svg>
      </button>
      {at && (
        <div ref={pop} className="kalert-pop" role="dialog" aria-label={`${AGENT_NAME[agent]} says`} style={{ left: at.left, top: at.top }}>
          <b className="kalert-who">{AGENT_NAME[agent]}</b>
          {mine.map((a) => (
            <div className="kalert-item" key={a.id}>
              <p>{a.text}</p>
              <div className="kalert-act">
                <a className="btn sm" href={"#" + a.go} onClick={() => { setAt(null); if (window.location.hash === "#" + a.go) window.dispatchEvent(new HashChangeEvent("hashchange")); }}>{a.label}</a>
                <button type="button" className="btn sm ghost" onClick={() => { if (mine.length === 1) { setAt(null); document.querySelector<HTMLElement>(".tabnav button[aria-current=page]")?.focus(); } dismiss(a.id); }}>Dismiss</button>
                <button type="button" className="btn sm ghost" onClick={() => later(a.id)}>Later</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
