"use client";

import { useEffect, useState } from "react";
import { PixelSprite, type SpriteName } from "@/components/PixelSprite";
import { useCourt } from "../CourtState";
import { dueList, eventsOn, isDone, money, type CalEvent, type CourtState } from "@/lib/court/state";
import { addDays, hm, prettyDay, wdName, wdOf, weekKey } from "@/lib/court/time";
import { branches, needsCare, type WaterEvt } from "@/lib/court/garden";
import { getOnce } from "@/lib/court/once";

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

// t is the bold first line (and the "Seen" key); sub is the smaller second line; rows list grouped releases.
type Need = { rank: number; crew: SpriteName; t: string; go?: string; id?: string; sub?: string; rows?: { name: string; vals: string }[] };
function needs(st: CourtState, k: string, nm: number, events: CalEvent[], plans: Row[], evs: WaterEvt[]): Need[] {
  const out: Need[] = [];
  for (const x of dueList(st, k, events)) if (x.dd === 0 && (x.it.cat === "bill" || x.it.cat === "money")) out.push({ rank: 1, crew: "coco", t: `${x.it.name} is due today${x.it.amt != null ? " · " + money(x.it.amt) : ""}.` });
  for (const p of plans) if (p.triggered && !p.placed && p.outcome === "open") out.push({ rank: 2, crew: "fenn", t: `Your ${String(p.inst ?? "")} plan reached entry with no order logged. Mark it placed, or note why you held off.`, go: "life" });
  const g = branches(st, k, evs);
  for (const b of [g.trunk, ...g.list].filter(needsCare)) out.push({ rank: 3, crew: "coco", t: `${b.n ? b.name : "The trunk"} is ${b.stage}, ${b.idle} days since activity.`, go: "garden" });
  for (const e of eventsOn(events, k)) if (!e.allDay && e.a > nm && e.a - nm <= 120) out.push({ rank: 4, crew: "momo", t: `${e.t} at ${hm(e.a)}${e.loc ? ", " + e.loc : ""}.`, go: "calendar" });
  if (!isDone(st, "m1")) out.push({ rank: 5, crew: "kumo", t: "Today's brief is not opened yet." });
  return out.sort((a, b) => a.rank - b.rank);
}

// Her own chart lines: price within 0.5% of a saved level, or of a saved line extended to now (in-app only).
function useLineTouches() {
  const { st } = useCourt();
  const [last, setLast] = useState<Record<string, number>>({});
  const syms = [...new Set(st.lines.map((l) => l.sym))].slice(0, 12).join(",");
  useEffect(() => {
    if (!syms) return;
    getOnce<{ items?: { sym: string; snap?: { last: number } | null }[] }>(`/api/ta?tf=1h&syms=${syms}`).then((j) => { const m: Record<string, number> = {}; for (const x of j.items ?? []) if (x.snap) m[x.sym] = x.snap.last; setLast(m); });
  }, [syms]);
  const now = Date.now(), out: Need[] = [];
  for (const l of st.lines) {
    const px = last[l.sym]; if (px == null) continue;
    const at = l.kind === "level" || !l.p2 ? l.p1.p : l.p1.p + ((l.p2.p - l.p1.p) * (now - l.p1.t)) / ((l.p2.t - l.p1.t) || 1);
    if (at > 0 && Math.abs(px - at) / at <= 0.005) out.push({ rank: 2, crew: "fenn", t: `${l.sym} is at your ${l.kind === "level" ? "level" : "line"} near ${at.toPrecision(5)} (${l.tf}).`, go: "court" });
  }
  return out;
}

// Alerts from section E: macro release in the next 2 hours, sources failing, a price move above her
// threshold, fresh headlines on her watchlist. Quiet hours hold them; "Seen" hides one for the day.
function useAlerts(): Need[] {
  const { st, nm, prices } = useCourt();
  const [econ, setEcon] = useState<{ at: string; title: string; country: string; top: boolean; impact: string; forecast?: string; previous?: string }[]>([]);
  const [news, setNews] = useState<{ title: string; link: string; at: string | null }[]>([]);
  const [fails, setFails] = useState(0);
  useEffect(() => {
    getOnce<{ items?: typeof econ }>("/api/econ?days=30").then((j) => setEcon(j.items ?? []));
    getOnce<{ items?: typeof news; feeds?: { ok: boolean }[] }>("/api/news").then((j) => { setNews(j.items ?? []); setFails((j.feeds ?? []).filter((f) => !f.ok).length); });
  }, []);
  const n = st.news, h = Math.floor(nm / 60);
  const quiet = n.quietFrom != null && n.quietTo != null && (n.quietFrom <= n.quietTo ? h >= n.quietFrom && h < n.quietTo : h >= n.quietFrom || h < n.quietTo);
  if (quiet) return [];
  const out: Need[] = [];
  // Releases at the same time from the same country become one card with a row per release. Only the
  // fields the calendar has are shown (it has no actuals today); nothing is invented.
  const groups = new Map<string, typeof econ>();
  for (const e of econ) { const m = (Date.parse(e.at) - Date.now()) / 60000; if (m > 0 && m <= 120 && (e.top || e.impact === "High")) groups.set(e.at + e.country, [...(groups.get(e.at + e.country) ?? []), e]); }
  for (const g of groups.values()) {
    const m = Math.round((Date.parse(g[0].at) - Date.now()) / 60000), sgtHm = new Date(Date.parse(g[0].at) + 8 * 3600000).toISOString().slice(11, 16);
    out.push({
      rank: 1, crew: "olli", id: g[0].at + g[0].country, t: `${g[0].country} ${g.length > 1 ? econName(g.map((e) => e.title)) : g[0].title}, in ${m} min`,
      sub: `${sgtHm} SGT · in ${m} min · ${g.some((e) => e.impact === "High") ? "High" : g[0].impact} impact`,
      rows: g.map((e) => ({ name: e.title, vals: [e.forecast && `Forecast ${e.forecast}`, e.previous && `Previous ${e.previous}`].filter(Boolean).join(" · ") })),
    });
  }
  if (n.movePct) for (const p of prices?.prices ?? []) if (p.ch24 != null && Math.abs(p.ch24) >= n.movePct) out.push({ rank: 2, crew: "dundun", t: `${p.sym} moved ${p.ch24 > 0 ? "+" : ""}${p.ch24.toFixed(1)}% in 24h (your alert is ${n.movePct}%).` });
  const syms = (prices?.prices ?? []).map((p) => p.sym);
  const hot = news.filter((x) => x.at && Date.now() - Date.parse(x.at) < 3 * 3600e3 && syms.some((s) => new RegExp("\\b" + s + "\\b").test(x.title)));
  if (hot.length >= 2) out.push({ rank: 3, crew: "pip", t: `${hot.length} fresh headlines mention your watchlist, for example: ${hot[0].title.slice(0, 90)}`, go: "court" });
  if (fails >= 4) out.push({ rank: 4, crew: "pip", t: `${fails} news sources are not reachable right now. See Settings, Source health.` });
  return out;
}

// A short name for a group of releases: the word they share (CPI for "CPI m/m", "Trimmed Mean CPI m/m").
function econName(titles: string[]) {
  const words = titles[0].split(/\s+/).filter((w) => /^[A-Za-z][\w-]{1,}$/.test(w) && !/^(m\/m|y\/y|q\/q)$/i.test(w));
  return words.find((w) => titles.every((t) => t.split(/\s+/).includes(w))) ?? "releases";
}

export function NeedsNow() {
  const { st, k, nm, events } = useCourt();
  const { plans, evs } = useRecords();
  const touches = useLineTouches();
  const alerts = useAlerts();
  const [seen, setSeen] = useState<string[]>([]);
  useEffect(() => { try { setSeen(JSON.parse(localStorage.getItem("1wan-seen-" + k) ?? "[]")); } catch {} }, [k]);
  const hide = (t: string) => { const x = [...seen, t]; setSeen(x); try { localStorage.setItem("1wan-seen-" + k, JSON.stringify(x)); } catch {} };
  const list = [...needs(st, k, nm, events, plans, evs), ...touches, ...alerts].filter((x) => !seen.includes(x.id ?? x.t)).sort((a, b) => a.rank - b.rank);
  return (
    <Card id="needWin" title="Needs you now" sub={list.length ? `${list.length} waiting` : "all clear"}>
      {list.length ? list.slice(0, 3).map((x, i) => (
        <div className="kneed" key={i}>
          <Mini name={x.crew} />
          <div className="kneed-b">
            <b className="kneed-t">{x.t}</b>
            {x.sub && <span className="kneed-s">{x.sub}</span>}
            {x.rows && x.rows.map((r) => <span className="kneed-r" key={r.name}><b>{r.name}</b>{r.vals && <> · {r.vals}</>}</span>)}
          </div>
          <div className="kneed-a">{x.go && <a className="btn sm ghost" href={"#" + x.go}>Open</a>}<button className="btn sm ghost" type="button" onClick={() => hide(x.id ?? x.t)}>Seen</button></div>
        </div>
      )) : <p className="note">Nothing needs you right now. Lovely.</p>}
    </Card>
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
