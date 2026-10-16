// Server only. Reads her Google Calendars from their secret iCal addresses (env GCAL_ICAL_URL_1 to _5,
// labels GCAL_NAME_1 to _5). The addresses never leave the server and are never logged.
// Handles all-day events, time zones (default Asia/Singapore), RRULE (daily, weekly, monthly, yearly with
// INTERVAL, COUNT, UNTIL, BYDAY, BYMONTHDAY, BYMONTH), EXDATE and moved or cancelled single occurrences.

import type { CalEvent } from "./court/state";
import { addDays, sgt } from "./court/time";

const DEFAULT_TZ = "Asia/Singapore";
const COLORS = ["#FF8FBF", "#7FD1C0", "#B8C4FF", "#FFD95E", "#FFAE82"];
const CACHE_MS = 15 * 60 * 1000;

export type CalStatus = { name: string; color: string; ok: boolean };
export type CalResult = { state: "off" | "live" | "error"; cals: CalStatus[]; events: CalEvent[] };

/* ---------- time zone maths ---------- */
type Wall = { y: number; m: number; d: number; hh: number; mm: number; ss: number };

function validTz(tz: string) {
  try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; }
}
function tzOffsetMs(tz: string, utcMs: number) {
  const o: Record<string, number> = {};
  new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric" })
    .formatToParts(new Date(utcMs)).forEach((p) => { if (p.type !== "literal") o[p.type] = +p.value; });
  return Date.UTC(o.year, o.month - 1, o.day, o.hour % 24, o.minute, o.second) - utcMs;
}
function wallToUtc(w: Wall, tz: string) {
  const guess = Date.UTC(w.y, w.m - 1, w.d, w.hh, w.mm, w.ss);
  let t = guess - tzOffsetMs(tz, guess);
  t = guess - tzOffsetMs(tz, t); // second pass settles DST edges
  return t;
}
const wallOfDate = (s: string): Wall => ({ y: +s.slice(0, 4), m: +s.slice(4, 6), d: +s.slice(6, 8), hh: +s.slice(9, 11) || 0, mm: +s.slice(11, 13) || 0, ss: +s.slice(13, 15) || 0 });
const dayKeyOf = (w: Wall) => `${w.y}-${String(w.m).padStart(2, "0")}-${String(w.d).padStart(2, "0")}`;
const wallAddDays = (w: Wall, n: number): Wall => { const t = new Date(Date.UTC(w.y, w.m - 1, w.d + n)); return { ...w, y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() }; };
const wdOfWall = (w: Wall) => new Date(Date.UTC(w.y, w.m - 1, w.d)).getUTCDay();
const daysInMonth = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/* ---------- ICS parsing ---------- */
type Prop = { name: string; params: Record<string, string>; value: string };
type Stamp = { allDay: boolean; wall: Wall; tz: string; utc: number };
type VEvent = { uid: string; summary: string; location: string; start: Stamp; end: Stamp | null; durMs: number | null; rrule: string | null; exdates: number[]; recurId: number | null; cancelled: boolean };

function unfold(text: string) { return text.replace(/\r\n/g, "\n").replace(/\n[ \t]/g, "").split("\n"); }
function parseLine(line: string): Prop | null {
  const colon = line.search(/:(?=(?:[^"]*"[^"]*")*[^"]*$)/);
  if (colon < 0) return null;
  const head = line.slice(0, colon).split(";");
  const params: Record<string, string> = {};
  for (const p of head.slice(1)) { const i = p.indexOf("="); if (i > 0) params[p.slice(0, i).toUpperCase()] = p.slice(i + 1).replace(/^"|"$/g, ""); }
  return { name: head[0].toUpperCase(), params, value: line.slice(colon + 1) };
}
const unescapeText = (s: string) => s.replace(/\\n/gi, " ").replace(/\\([,;\\])/g, "$1").trim();

function parseStamp(p: Prop, value = p.value): Stamp {
  const v = value.trim();
  if (p.params.VALUE === "DATE" || /^\d{8}$/.test(v)) {
    const wall = wallOfDate(v);
    return { allDay: true, wall, tz: "UTC", utc: Date.UTC(wall.y, wall.m - 1, wall.d) };
  }
  const wall = wallOfDate(v);
  if (v.endsWith("Z")) return { allDay: false, wall, tz: "UTC", utc: Date.UTC(wall.y, wall.m - 1, wall.d, wall.hh, wall.mm, wall.ss) };
  const tz = p.params.TZID && validTz(p.params.TZID) ? p.params.TZID : DEFAULT_TZ;
  return { allDay: false, wall, tz, utc: wallToUtc(wall, tz) };
}
function parseDuration(s: string): number | null {
  const m = s.match(/^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!m) return null;
  const ms = ((+(m[2] || 0) * 7 + +(m[3] || 0)) * 86400 + +(m[4] || 0) * 3600 + +(m[5] || 0) * 60 + +(m[6] || 0)) * 1000;
  return m[1] === "-" ? -ms : ms;
}

function parseIcs(text: string): VEvent[] {
  const out: VEvent[] = [];
  let cur: Prop[] | null = null;
  for (const line of unfold(text)) {
    if (line === "BEGIN:VEVENT") { cur = []; continue; }
    if (line === "END:VEVENT") {
      if (cur) { const ev = toEvent(cur); if (ev) out.push(ev); }
      cur = null; continue;
    }
    if (cur) { const p = parseLine(line); if (p) cur.push(p); }
  }
  return out;
}
function toEvent(props: Prop[]): VEvent | null {
  const get = (n: string) => props.find((p) => p.name === n);
  const ds = get("DTSTART");
  if (!ds) return null;
  const start = parseStamp(ds);
  const de = get("DTEND"), du = get("DURATION"), rid = get("RECURRENCE-ID");
  const exdates: number[] = [];
  for (const p of props.filter((x) => x.name === "EXDATE")) for (const v of p.value.split(",")) exdates.push(parseStamp(p, v).utc);
  return {
    uid: get("UID")?.value ?? Math.random().toString(36),
    summary: unescapeText(get("SUMMARY")?.value ?? "(no title)"),
    location: unescapeText(get("LOCATION")?.value ?? ""),
    start, end: de ? parseStamp(de) : null, durMs: du ? parseDuration(du.value) : null,
    rrule: get("RRULE")?.value ?? null, exdates,
    recurId: rid ? parseStamp(rid).utc : null,
    cancelled: (get("STATUS")?.value ?? "").toUpperCase() === "CANCELLED",
  };
}

/* ---------- recurrence ---------- */
const WD: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

function expand(ev: VEvent, winStart: number, winEnd: number): number[] {
  if (!ev.rrule) return [ev.start.utc];
  const r: Record<string, string> = {};
  for (const part of ev.rrule.split(";")) { const [k, v] = part.split("="); if (k && v) r[k.toUpperCase()] = v; }
  const freq = r.FREQ, interval = Math.max(1, +(r.INTERVAL || 1)), count = r.COUNT ? +r.COUNT : Infinity;
  const until = r.UNTIL ? parseStamp({ name: "UNTIL", params: {}, value: r.UNTIL }).utc + (/^\d{8}$/.test(r.UNTIL) ? 86399999 : 0) : Infinity;
  const byday = r.BYDAY ? r.BYDAY.split(",").map((s) => { const m = s.match(/^([+-]?\d+)?([A-Z]{2})$/); return m ? { n: m[1] ? +m[1] : 0, wd: WD[m[2]] } : null; }).filter((x): x is { n: number; wd: number } => !!x && x.wd != null) : [];
  const bymd = r.BYMONTHDAY ? r.BYMONTHDAY.split(",").map(Number).filter((n) => n) : [];
  const bymonth = r.BYMONTH ? r.BYMONTH.split(",").map(Number) : [];
  const s = ev.start, out: number[] = [];
  const toUtc = (w: Wall) => (s.allDay ? Date.UTC(w.y, w.m - 1, w.d) : s.tz === "UTC" ? Date.UTC(w.y, w.m - 1, w.d, w.hh, w.mm, w.ss) : wallToUtc(w, s.tz));
  let n = 0;
  // Without COUNT, jump close to the window instead of walking years of past occurrences.
  let i0 = 0;
  if (count === Infinity) {
    const gap = winStart - 86400000 * 40 - s.utc, day = 86400000;
    if (gap > 0) {
      if (freq === "DAILY") i0 = Math.floor(gap / (interval * day));
      else if (freq === "WEEKLY") i0 = Math.max(0, Math.floor(gap / (interval * 7 * day)) - 1);
      else if (freq === "MONTHLY") i0 = Math.max(0, Math.floor(gap / (interval * 31 * day)) - 1);
      else if (freq === "YEARLY") i0 = Math.max(0, Math.floor(gap / (interval * 366 * day)) - 1);
    }
  }
  const take = (w: Wall) => {
    const t = toUtc(w);
    if (t < s.utc) return true;
    if (t > until || n >= count) return false;
    n++;
    if (t >= winStart - 86400000 * 40 && t <= winEnd) out.push(t);
    return true;
  };
  for (let i = i0; i < i0 + 2000; i++) {
    let cands: Wall[] = [];
    if (freq === "DAILY") cands = [wallAddDays(s.wall, i * interval)];
    else if (freq === "WEEKLY") {
      const monday = wallAddDays(s.wall, -((wdOfWall(s.wall) + 6) % 7) + i * interval * 7);
      const days = byday.length ? byday.map((b) => b.wd) : [wdOfWall(s.wall)];
      cands = [...new Set(days)].map((d) => wallAddDays(monday, (d + 6) % 7)).sort((a, b) => dayKeyOf(a).localeCompare(dayKeyOf(b)));
    } else if (freq === "MONTHLY") {
      const mi = s.wall.m - 1 + i * interval, y = s.wall.y + Math.floor(mi / 12), m = (mi % 12) + 1, dim = daysInMonth(y, m);
      let ds: number[] = [];
      if (byday.length) {
        for (const b of byday) {
          const all: number[] = [];
          for (let d = 1; d <= dim; d++) if (new Date(Date.UTC(y, m - 1, d)).getUTCDay() === b.wd) all.push(d);
          if (b.n > 0 && all[b.n - 1]) ds.push(all[b.n - 1]); else if (b.n < 0 && all[all.length + b.n]) ds.push(all[all.length + b.n]); else if (b.n === 0) ds.push(...all);
        }
      } else if (bymd.length) ds = bymd.map((d) => (d > 0 ? d : dim + d + 1)).filter((d) => d >= 1 && d <= dim);
      else if (s.wall.d <= dim) ds = [s.wall.d];
      cands = [...new Set(ds)].sort((a, b) => a - b).map((d) => ({ ...s.wall, y, m, d }));
    } else if (freq === "YEARLY") {
      const y = s.wall.y + i * interval;
      const months = bymonth.length ? bymonth : [s.wall.m];
      cands = months.filter((m) => s.wall.d <= daysInMonth(y, m)).map((m) => ({ ...s.wall, y, m }));
    } else return [s.utc];
    let stop = false;
    for (const c of cands) if (!take(c)) { stop = true; break; }
    if (stop) break;
    if (cands.length && toUtc(cands[cands.length - 1]) > winEnd) break;
  }
  return out;
}

/* ---------- to the dashboard's shape ---------- */
function occurrences(evs: VEvent[], cal: string, color: string, winStart: number, winEnd: number): CalEvent[] {
  const out: CalEvent[] = [];
  const overrides = new Map<string, VEvent[]>();
  for (const e of evs) if (e.recurId != null) overrides.set(e.uid, [...(overrides.get(e.uid) ?? []), e]);
  const emit = (e: VEvent, startUtc: number) => {
    if (e.cancelled) return;
    const len = e.end ? e.end.utc - e.start.utc : e.durMs ?? (e.start.allDay ? 86400000 : 0);
    const endUtc = startUtc + Math.max(0, len);
    if (endUtc < winStart || startUtc > winEnd) return;
    if (e.start.allDay) {
      const sk = new Date(startUtc).toISOString().slice(0, 10), ek = new Date(Math.max(endUtc, startUtc + 86400000)).toISOString().slice(0, 10);
      out.push({ id: `${e.uid}@${sk}`, title: e.summary, cal, color, allDay: true, sk, ek, sm: 0, em: 0, loc: e.location || undefined });
    } else {
      const a = sgt(new Date(startUtc)), b = sgt(new Date(endUtc));
      out.push({ id: `${e.uid}@${startUtc}`, title: e.summary, cal, color, allDay: false, sk: a.key, ek: b.key, sm: a.min, em: b.min, loc: e.location || undefined });
    }
  };
  for (const e of evs) {
    if (e.recurId != null) continue;
    const moved = new Set((overrides.get(e.uid) ?? []).map((o) => o.recurId!));
    const ex = new Set(e.exdates);
    for (const t of expand(e, winStart, winEnd)) if (!ex.has(t) && !moved.has(t)) emit(e, t);
  }
  for (const list of overrides.values()) for (const o of list) emit(o, o.start.utc);
  return out;
}

/* ---------- fetch with cache ---------- */
function configured() {
  const out: { url: string; name: string; color: string }[] = [];
  for (let i = 1; i <= 5; i++) {
    const url = (process.env[`GCAL_ICAL_URL_${i}`] ?? "").trim();
    if (!url) continue;
    out.push({ url, name: (process.env[`GCAL_NAME_${i}`] ?? "").trim().slice(0, 24) || `Calendar ${i}`, color: COLORS[(i - 1) % COLORS.length] });
  }
  // The older single-address setting (GCAL_ICAL_URL) still works.
  const one = (process.env.GCAL_ICAL_URL ?? "").trim();
  if (one && !out.some((c) => c.url === one)) out.push({ url: one, name: "Calendar", color: COLORS[out.length % COLORS.length] });
  return out;
}

const cache = new Map<string, { at: number; events: VEvent[] }>();

async function fetchCal(url: string): Promise<VEvent[]> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.events;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 10000);
  try {
    const r = await fetch(url, { signal: ctl.signal, cache: "no-store", headers: { "User-Agent": "1wan-dashboard" } });
    if (!r.ok) throw new Error("status " + r.status);
    const text = await r.text();
    if (!text.includes("BEGIN:VCALENDAR")) throw new Error("not a calendar");
    const events = parseIcs(text);
    cache.set(url, { at: Date.now(), events });
    return events;
  } catch (e) {
    if (hit) return hit.events; // keep the last good copy
    throw e;
  } finally {
    clearTimeout(t);
  }
}

export async function loadCalendars(): Promise<CalResult> {
  const cals = configured();
  if (!cals.length) return { state: "off", cals: [], events: [] };
  const today = sgt(new Date()).key;
  const winStart = Date.parse(addDays(today, -2) + "T00:00:00+08:00"), winEnd = Date.parse(addDays(today, 31) + "T00:00:00+08:00");
  const results = await Promise.allSettled(cals.map((c) => fetchCal(c.url)));
  const status: CalStatus[] = [];
  const seen = new Set<string>();
  const events: CalEvent[] = [];
  results.forEach((r, i) => {
    const c = cals[i];
    status.push({ name: c.name, color: c.color, ok: r.status === "fulfilled" });
    if (r.status !== "fulfilled") { console.warn(`calendar ${i + 1} (${c.name}) could not be read`); return; }
    for (const e of occurrences(r.value, c.name, c.color, winStart, winEnd)) {
      const key = `${e.title}|${e.allDay}|${e.sk}|${e.sm}|${e.ek}|${e.em}`; // same event on two calendars shows once
      if (seen.has(key)) continue;
      seen.add(key);
      events.push(e);
    }
  });
  events.sort((a, b) => a.sk.localeCompare(b.sk) || a.sm - b.sm);
  return { state: status.some((s) => s.ok) ? "live" : "error", cals: status, events: events.slice(0, 800) };
}

// Exposed for the parser self-test only.
export const __test = { parseIcs, occurrences };
