"use client";

import { useEffect, useState } from "react";
import { PixelSprite, type SpriteName } from "@/components/PixelSprite";
import { useCourt } from "../CourtState";
import { dueList, eventsOn, isAstro, money, type CalEvent, type CourtState } from "@/lib/court/state";
import { isAutoPaid } from "./TodayLive";
import { addDays, hm, prettyDay, wdName, wdOf, weekKey } from "@/lib/court/time";
import { branches, needsCare, type WaterEvt } from "@/lib/court/garden";
import { getOnce } from "@/lib/court/once";
import { isStringList, readSaved, writeSaved } from "@/lib/court/store";
import { useVault } from "@/lib/vault";
import { dueSoon, type DueThing } from "@/lib/court/vaultDue";

// Court home cards (docs/build-dashboard-v2.md section 2): Needs you now, weather, This week strip, Week ahead.
// Rules only, from her real records. Each card folds, and the fold is remembered on this device.
type Row = Record<string, unknown> & { id: string };
const Mini = ({ name }: { name: SpriteName }) => <span className="mini sm"><PixelSprite name={name} /></span>;

function useFold(id: string) {
  const [open, setOpen] = useState(true);
  useEffect(() => { try { if (localStorage.getItem("1wan-fold-" + id) === "0") setOpen(false); } catch {} }, [id]);
  const toggle = (o: boolean) => { setOpen(o); try { localStorage.setItem("1wan-fold-" + id, o ? "1" : "0"); } catch {} };
  return [open, toggle] as const;
}
function Card({ id, title, sub, children }: { id: string; title: string; sub?: string; children: React.ReactNode }) {
  const [open, toggle] = useFold(id);
  return (
    <details className="win" id={id} open={open} onToggle={(e) => toggle((e.target as HTMLDetailsElement).open)}>
      <summary className="win-title"><h2>{title}</h2>{sub && <span className="sub">{sub}</span>}</summary>
      <div className="win-body">{children}</div>
    </details>
  );
}
function useRecords() {
  const [plans, setPlans] = useState<Row[]>([]);
  const [evs, setEvs] = useState<WaterEvt[]>([]);
  useEffect(() => {
    getOnce<{ plans?: Row[] }>("/api/ledger").then((j) => setPlans(Array.isArray(j.plans) ? j.plans : []));
    getOnce<{ events?: WaterEvt[] }>("/api/water?days=30").then((j) => setEvs(Array.isArray(j.events) ? j.events : []));
  }, []);
  return { plans, evs };
}

// Needs you now (owner's rules, round 5): only (a) tasks, reminders and bookings due today, overdue, or due
// within 3 days (auto-paid bills and subscriptions stay hidden), plus calendar bookings starting within two
// hours, and (b) agents waiting on her (today's briefs still to rate, as one line). No macro releases, no
// habits, no price alerts. Items on the same day (or at the same time) share one card with one Seen.
type Need = { id: string; crew: SpriteName; t: string; sub?: string; rows?: string[]; go?: string; rank: number };
function needs(st: CourtState, k: string, nm: number, events: CalEvent[], unrated: string[], vdue: DueThing[] = []): Need[] {
  const out: Need[] = [];
  // Round 6: her own tasks (Calendar) and routines (Life Hub) due within 3 days, one row each.
  for (const x of vdue) out.push({ id: x.id + x.d, crew: x.kind === "task" ? "momo" : "coco", rank: x.dd <= 0 ? 1 : 3, go: x.kind === "task" ? "calendar" : "life",
    t: `${x.name} ${x.dd < 0 ? "overdue" : x.dd === 0 ? "due today" : x.dd === 1 ? "due tomorrow" : "due " + prettyDay(x.d)}`, sub: prettyDay(x.d) });
  const due = dueList(st, k, events).filter((x) => !isAutoPaid(x.it) && (x.dd <= 3 || x.it.important === true));
  const byDay = new Map<string, typeof due>();
  for (const x of due) byDay.set(x.d, [...(byDay.get(x.d) ?? []), x]);
  for (const [d, xs] of byDay) {
    const dd = xs[0].dd, when = dd < 0 ? "overdue" : dd === 0 ? "due today" : dd === 1 ? "due tomorrow" : `due ${prettyDay(d)}`;
    const name = (x: (typeof due)[number]) => `${x.it.name}${x.it.amt != null ? " · " + money(x.it.amt) : ""}`;
    out.push({
      id: "due" + d + xs.map((x) => x.it.name).join(), crew: "coco", rank: dd <= 0 ? 1 : 3, go: "life",
      t: xs.length === 1 ? `${xs[0].it.name} ${when}` : `${xs.length} items ${when}`,
      sub: dd > 0 ? `${prettyDay(d)} · in ${dd} day${dd === 1 ? "" : "s"}` : prettyDay(d),
      rows: xs.length > 1 ? xs.map(name) : xs[0].it.amt != null ? [name(xs[0])] : undefined,
    });
  }
  const soon = eventsOn(events, k).filter((e) => !e.allDay && !isAstro(e) && e.a > nm && e.a - nm <= 120);
  const byTime = new Map<number, typeof soon>();
  for (const e of soon) byTime.set(e.a, [...(byTime.get(e.a) ?? []), e]);
  for (const [a, es] of byTime) out.push({
    id: "ev" + k + a, crew: "momo", rank: 2, go: "calendar",
    t: es.length === 1 ? es[0].t : `${es.length} bookings at ${hm(a)}`,
    sub: `${hm(a)} SGT · in ${a - nm} min${es.length === 1 && es[0].loc ? " · " + es[0].loc : ""}`,
    rows: es.length > 1 ? es.map((e) => e.t) : undefined,
  });
  if (unrated.length) out.push({ id: "rate" + k, crew: "kumo", rank: 4, t: `Rate today's ${unrated.length === 1 ? "brief" : "briefs"}: ${unrated.join(", ")}`, sub: "Useful or Needs work, under each brief" });
  return out.sort((x, y) => x.rank - y.rank);
}

export function NeedsNow({ unrated = [] }: { unrated?: string[] }) {
  const { st, k, nm, events } = useCourt();
  const [seen, setSeen] = useState<string[]>([]);
  const [all, setAll] = useState(false);
  // Seen items for today, on this device (versioned key; an old or broken value is ignored).
  useEffect(() => { setSeen(readSaved("seen." + k, isStringList, [])); }, [k]);
  const hide = (id: string) => { const x = [...seen, id]; setSeen(x); writeSaved("seen." + k, x); };
  const tasks = useVault("tasks"), routines = useVault("routines");
  const list = needs(st, k, nm, events, unrated, dueSoon(tasks.rows as never, routines.rows as never, k, 3)).filter((x) => !seen.includes(x.id));
  const shown = all ? list : list.slice(0, 3);
  // When nothing is waiting the card animates away and leaves no space; it returns when something is due.
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (list.length) { setGone(false); return; }
    const t = window.setTimeout(() => setGone(true), 320);
    return () => window.clearTimeout(t);
  }, [list.length]);
  if (gone) return null;
  return (
    <div className={"kneed-wrap" + (list.length ? "" : " closing")}>
    <Card id="needWin" title="Needs you now" sub={`${list.length} waiting`}>
      {list.length > 0 && <>
        {shown.map((x) => (
          <div className="kneed" key={x.id}>
            <Mini name={x.crew} />
            <div className="kneed-b">
              <b className="kneed-t">{x.t}</b>
              {x.sub && <span className="kneed-s ts">{x.sub}</span>}
              {x.rows && x.rows.map((r) => <span className="kneed-r" key={r}>{r}</span>)}
            </div>
            <div className="kneed-a">{x.go && <a className="btn sm ghost kneed-btn" href={"#" + x.go}>Open</a>}<button className="btn sm ghost kneed-btn" type="button" onClick={() => hide(x.id)}>Seen</button></div>
          </div>
        ))}
        {list.length > 3 && <button className="btn sm ghost kneed-btn" type="button" aria-expanded={all} onClick={() => setAll(!all)}>{all ? "Show fewer" : `+${list.length - 3} more`}</button>}
      </>}
    </Card>
    </div>
  );
}

type Wx = { now: number | null; sky?: string; hi?: number; lo?: number; rain?: number; reason?: string };
export function WeatherLine() {
  const [w, setW] = useState<Wx | null>(null);
  useEffect(() => { fetch("/api/weather").then((r) => r.json()).then(setW).catch(() => setW({ now: null, reason: "Weather not reachable" })); }, []);
  if (!w) return <p className="note wx">Weather loading…</p>;
  if (w.now == null) return <p className="note wx">{w.reason ?? "Weather not reachable"}.</p>;
  return (
    <p className="note wx">
      <b>Singapore {Math.round(w.now)}°C</b> · {w.sky}{w.lo != null && w.hi != null ? ` · ${Math.round(w.lo)} to ${Math.round(w.hi)}°C` : ""}{w.rain != null ? ` · rain ${w.rain}%` : ""} · Open-Meteo
    </p>
  );
}

export function WeekStrip() {
  const { k, events } = useCourt();
  const wk = weekKey(k);
  return (
    <Card id="weekStrip" title="This week">
      <div className="wstrip">
        {Array.from({ length: 7 }, (_, i) => {
          const d = addDays(wk, i), n = eventsOn(events, d).length;
          return (
            <a key={d} href="#calendar" className={"wday" + (d === k ? " today" : "")} aria-label={`${prettyDay(d)}: ${n} event${n === 1 ? "" : "s"}`}>
              <span>{wdName(wdOf(d)).slice(0, 3)}</span><b>{d.slice(8)}</b><span className="dots">{"•".repeat(Math.min(n, 4))}</span>
            </a>
          );
        })}
      </div>
    </Card>
  );
}

// A free 45-minute slot between 09:00 and 21:00, from timed events.
function hasFreeSlot(evs: { a: number; b: number; allDay: boolean }[]) {
  const busy = evs.filter((e) => !e.allDay).map((e) => [Math.max(540, e.a), Math.min(1260, e.b)]).filter(([a, b]) => b > a).sort((x, y) => x[0] - y[0]);
  let t = 540;
  for (const [a, b] of busy) { if (a - t >= 45) return true; t = Math.max(t, b); }
  return 1260 - t >= 45;
}

export function WeekAhead({ strip = false }: { strip?: boolean }) {
  const { st, k, events } = useCourt();
  const { plans, evs } = useRecords();
  const wk = weekKey(k), end = addDays(wk, 6);
  const items: { d: string; t: string }[] = [];
  for (let i = 0; i < 7; i++) { const d = addDays(wk, i); if (d < k) continue; for (const e of eventsOn(events, d)) items.push({ d, t: (e.allDay ? "" : hm(e.a) + " ") + e.t }); }
  for (const x of dueList(st, k, events)) if (x.d <= end && x.dd >= 0) items.push({ d: x.d, t: `${x.it.name} due${x.it.amt != null ? " · " + money(x.it.amt) : ""}` });
  items.sort((a, b) => a.d.localeCompare(b.d));
  const deadlines: string[] = [];
  for (const p of plans) if (p.outcome === "open" && p.until && String(p.until) >= k && String(p.until) <= end) deadlines.push(`${String(p.inst)} plan timeframe ends ${prettyDay(String(p.until))}`);
  if (!plans.some((p) => String(p.date ?? "") >= wk)) deadlines.push("Friday thesis entry not written yet this week");
  const g = branches(st, k, evs);
  const care = [g.trunk, ...g.list].filter(needsCare).map((b) => `${b.n ? b.name : "Trunk"}: ${b.idle} days since activity`);
  const noSlot: string[] = [];
  for (let i = 0; i < 7; i++) { const d = addDays(wk, i); if (d >= k && !hasFreeSlot(eventsOn(events, d))) noSlot.push(prettyDay(d)); }
  const t = st.samsara.t.wk === wk ? st.samsara.t : { hours: 0, replies: 0 };
  const posts = st.cad?.wk === wk ? st.cad.x || 0 : 0;
  let sleep = 0;
  for (let i = 0; i < 7; i++) { const d = addDays(wk, i); if (d <= k && (st.swins.log[d] || []).includes("d1")) sleep++; }
  return (
    <Card id="weekAhead" title="Week ahead" sub={`${prettyDay(wk)} to ${prettyDay(end)}`}>
      {strip && (
        <div className="wstrip">
          {Array.from({ length: 7 }, (_, i) => {
            const d = addDays(wk, i), n = eventsOn(events, d).length;
            return <a key={d} href="#calendar" className={"wday" + (d === k ? " today" : "")} aria-label={`${prettyDay(d)}: ${n} event${n === 1 ? "" : "s"}`}><span>{wdName(wdOf(d)).slice(0, 3)}</span><b>{d.slice(8)}</b><span className="dots">{"•".repeat(Math.min(n, 4))}</span></a>;
          })}
        </div>
      )}
      {items.length ? items.slice(0, 14).map((x, i) => <div className="filed-row" key={i}><span className="note">{prettyDay(x.d)}</span><span>{x.t}</span></div>) : <p className="note">No events or bills left this week.</p>}
      {deadlines.length > 0 && <><div className="sec-h">Not yet acted on</div>{deadlines.map((x) => <p className="note" key={x}>{x}</p>)}</>}
      {care.length > 0 && <><div className="sec-h">Garden</div>{care.map((x) => <p className="note" key={x}>{x}</p>)}</>}
      {noSlot.length > 0 && <><div className="sec-h">Gaps</div><p className="note">No free 45-minute slot between 9am and 9pm on {noSlot.join(", ")}.</p></>}
      <div className="sec-h">Weekly targets</div>
      <div className="filed-row"><span>Study</span><span>{t.hours} / 6 h</span></div>
      <div className="filed-row"><span>X posts · replies</span><span>{posts} / 2 · {t.replies} / 3</span></div>
      <div className="filed-row"><span>Nights in bed before midnight</span><span>{sleep} / 5</span></div>
    </Card>
  );
}
