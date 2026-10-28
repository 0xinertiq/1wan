import { QUESTS, QPRI, CKPRI, needFor, type Quest } from "./quests";
import { addDays, dayGap, domDate, prettyDay, wdOf, weekKey, wdName } from "./time";

// Her state document from the old dashboard (user_state.data), typed for the keys this UI reads and writes.
// Every other key in the document is left exactly as it is.

export type Day = { d: number; t: number; n?: string[] };
export type Win = { w?: string; g?: string; n?: string };
export type Dump = { id: string; t: string; done: boolean; ts: number };
export type LifeRule =
  | { type: "dom"; d: number; from?: string }
  | { type: "every"; n: number; last?: string }
  | { type: "wk"; days: number[] }
  | { type: "once"; date: string };
export type LifeItem = {
  id: string; name: string; cat: string; amt: number | null; rule: LifeRule; lead: number;
  note?: string; sched?: string; paid?: string | number;
  autoPaid?: boolean; important?: boolean;   // optional flags (owner approved, round 5b); absent = derived default
};
export type Seed = { id: string; name: string; pk?: string; q?: string; auto?: string; at: string; w: Record<string, number> };
export type Garden = { seeds: Seed[]; roots: { id: string; name: string; at: string }[]; gone: { name: string; kind: string; on: string }[]; init?: number; v17?: number; weed?: Record<string, string> };
export type Mood = { m: number; n?: string };
// Life > Money figures she types in (key mny). The imported Money Wins blob stays untouched under money.
export type MLine = { id: string; name: string; amt: number };
export type MFund = { id: string; name: string; target: number; saved: number };
export type MAsset = MLine & { kind: "a" | "d" };
export type MItem = { id: string; t: string; done: boolean };
// Her tracker definitions (key defs), imported from the private tracker pages; read-only here.
export type PItem = [string, string, string, string?, number?];   // id, title, detail, date, review flag
export type Phase = { id: string; title: string; when: string; why: string; daily?: boolean; course?: string; items: PItem[] };
export type MoneyDefs = {
  asOf: string; phases: Phase[]; routines: PItem[]; open: PItem[];
  cash: [string, string, number][]; steps: [string, string, number][]; up: [string, string, number | null, string][];
  funds: [string, string, number, string | null, number, string][]; nw: [string, string, string, number, number][];
  k: { base: number; ef: number; sgdExp: number; usdExp: number } | null;
};
export type Defs = {
  grid?: { goal: string; pillars: { name: string; acts: { t: string; why: string; when: string }[] }[] };
  swins?: { phases: Phase[] }; samsara?: { phases: Phase[] }; money?: MoneyDefs;
};
export type Ticks = { done: Record<string, boolean> };
export type MoneyW = Ticks & { t: Record<string, number>; f: Record<string, number>; nw: Record<string, number>; upd?: string };
export type Samsara = Ticks & { t: { hours: number; entries: number; posts: number; replies: number; wk: string } };
// Her own chart levels and lines (Technicals), per coin and timeframe. t is a candle time in ms.
export type ChartLine = { id: string; sym: string; tf: string; kind: "level" | "line"; p1: { t: number; p: number }; p2?: { t: number; p: number }; label: string };
export type Money = { inc: MLine[]; fixed: MLine[]; funds: MFund[]; nw: MAsset[]; goals: MItem[]; open: MItem[]; upd?: string; hideNw?: boolean };

export type CourtState = {
  v: 1; day: string; week: string; streak: number; stars: number; lvl: number; xp: number;
  q: Record<string, [number, number]>; days: Record<string, Day>; wins: Record<string, Win>;
  dump: Dump[]; life: LifeItem[]; gd: Garden; cad: { wk: string; ig: number; x: number };
  mood: Record<string, Mood>; restDay: string | null; restWeek: string | null; uq: string[];
  mny: Money;
  tails: number[];
  lines: ChartLine[];
  packet: Partial<Record<"diary" | "birth" | "sensitive" | "networth" | "notes", boolean>>;   // weekly packet sections she chose
  news: { regions: string[]; movePct: number | null; quietFrom: number | null; quietTo: number | null };   // region lens and alert settings
  tg: { channels: { handle: string; enabled: boolean; title?: string }[] };   // public Telegram channels she follows
  birth: { date: string; time: string; place: string; lat: number; lon: number; tz: string } | null;   // private, never shared
  grid: Ticks; swins: Ticks & { log: Record<string, string[]> }; money: MoneyW; samsara: Samsara; defs: Defs;
  spr: { run: { at: string; tag: "study" | "other" } | null; log: { at: string; tag: "study" | "other"; min: number }[] };   // focus sprints, tagged
  last: Record<string, unknown>; prev: Record<string, unknown> | null;
};

// Keys this UI owns. Saves send only these; the server refuses anything else.
// The two optional life-admin flags are kept only when they are true or false; any other value is dropped, so
// existing items load exactly as before (no migration, no rewrite).
function lifeFlags(i: LifeItem): LifeItem {
  if (!("autoPaid" in i) && !("important" in i)) return i;
  const o = { ...i };
  if ("autoPaid" in o && typeof o.autoPaid !== "boolean") delete o.autoPaid;
  if ("important" in o && typeof o.important !== "boolean") delete o.important;
  return o;
}

export const OWNED_KEYS = ["v", "day", "week", "streak", "stars", "lvl", "xp", "q", "days", "wins", "dump", "life", "gd", "cad", "restDay", "restWeek", "mny", "tails", "lines", "packet", "news", "tg", "birth", "grid", "swins", "money", "samsara", "spr", "last", "prev"] as const;
export type OwnedKey = (typeof OWNED_KEYS)[number];

export type Recap = { old: string; done: number; total: number; newWeek: boolean; lost: boolean; restY: boolean };

const obj = <T,>(v: unknown, d: T): T => (v && typeof v === "object" && !Array.isArray(v) ? (v as T) : d);
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const num = (v: unknown, d: number) => (typeof v === "number" && isFinite(v) ? v : d);
const str = (v: unknown, d: string) => (typeof v === "string" ? v : d);

function normMoney(v: unknown): Money {
  const m = obj<Partial<Money>>(v, {});
  const ok = <T extends { id?: unknown }>(a: unknown) => arr<T>(a).filter((x) => x && typeof x.id === "string");
  return { inc: ok(m.inc), fixed: ok(m.fixed), funds: ok(m.funds), nw: ok(m.nw), goals: ok(m.goals), open: ok(m.open),
    upd: typeof m.upd === "string" ? m.upd : undefined, hideNw: m.hideNw !== false };
}

// Tolerates missing or odd keys: anything absent gets the old dashboard's default.
export function normalize(raw: unknown, today: string): CourtState {
  const r = obj<Record<string, unknown>>(raw, {});
  const gd = obj<Partial<Garden>>(r.gd, {});
  return {
    v: 1,
    day: str(r.day, today),
    week: str(r.week, weekKey(str(r.day, today))),
    streak: num(r.streak, 0), stars: num(r.stars, 0), lvl: num(r.lvl, 1), xp: num(r.xp, 0),
    q: obj(r.q, {}), days: obj(r.days, {}), wins: obj(r.wins, {}),
    dump: arr<Dump>(r.dump).filter((d) => d && typeof d.t === "string"),
    life: arr<LifeItem>(r.life).filter((i) => i && i.rule && typeof i.name === "string").map(lifeFlags),
    gd: { ...gd, seeds: arr(gd.seeds), roots: arr(gd.roots), gone: arr(gd.gone) } as Garden,
    cad: obj(r.cad, { wk: weekKey(today), ig: 0, x: 0 }),
    mood: obj(r.mood, {}),
    restDay: typeof r.restDay === "string" ? r.restDay : null,
    restWeek: typeof r.restWeek === "string" ? r.restWeek : null,
    uq: arr<string>(r.uq).filter((s) => typeof s === "string"),
    mny: normMoney(r.mny),
    birth: (() => { const b = obj<Record<string, unknown>>(r.birth, {}); return typeof b.date === "string" && typeof b.lat === "number" && typeof b.lon === "number"
      ? { date: b.date, time: str(b.time, ""), place: str(b.place, ""), lat: b.lat, lon: b.lon, tz: str(b.tz, "UTC") } : null; })(),
    news: (() => { const n = obj<Record<string, unknown>>(r.news, {}); const h = (v: unknown) => (typeof v === "number" && v >= 0 && v < 24 ? v : null);
      return { regions: arr<string>(n.regions).filter((x) => typeof x === "string"), movePct: typeof n.movePct === "number" && n.movePct > 0 ? n.movePct : null, quietFrom: h(n.quietFrom), quietTo: h(n.quietTo) }; })(),
    tg: { channels: arr<{ handle: string; enabled: boolean; title?: string }>(obj<Record<string, unknown>>(r.tg, {}).channels).filter((c) => c && typeof c.handle === "string").slice(0, 20) },
    packet: obj(r.packet, {}),
    lines: arr<ChartLine>(r.lines).filter((l) => l && typeof l.sym === "string" && l.p1 && typeof l.p1.p === "number").slice(-200),
    tails: arr<number>(r.tails).filter((n) => Number.isInteger(n) && n >= 0 && n < 9),
    grid: { done: obj(obj<Ticks>(r.grid, { done: {} }).done, {}) },
    swins: (() => { const w = obj<Record<string, unknown>>(r.swins, {}); return { done: obj(w.done, {}), log: obj(w.log, {}) }; })(),
    money: (() => { const w = obj<Record<string, unknown>>(r.money, {}); return { done: obj(w.done, {}), t: obj(w.t, {}), f: obj(w.f, {}), nw: obj(w.nw, {}), ...(typeof w.upd === "string" ? { upd: w.upd } : {}) }; })(),
    samsara: (() => { const w = obj<Record<string, unknown>>(r.samsara, {}); const t = obj<Record<string, unknown>>(w.t, {});
      return { done: obj(w.done, {}), t: { hours: num(t.hours, 0), entries: num(t.entries, 0), posts: num(t.posts, 0), replies: num(t.replies, 0), wk: str(t.wk, "") } }; })(),
    defs: obj(r.defs, {}),
    spr: (() => { const w = obj<Record<string, unknown>>(r.spr, {}); const tag = (x: unknown) => (x === "study" ? "study" : "other") as "study" | "other";
      const run = obj<Record<string, unknown>>(w.run, {});
      return { run: typeof run.at === "string" ? { at: run.at, tag: tag(run.tag) } : null,
        log: arr<Record<string, unknown>>(w.log).filter((x) => x && typeof x.at === "string" && typeof x.min === "number").map((x) => ({ at: x.at as string, tag: tag(x.tag), min: x.min as number })).slice(-200) }; })(),
    last: obj(r.last, {}), prev: r.prev && typeof r.prev === "object" ? (r.prev as Record<string, unknown>) : null,
  };
}

export const isDone = (st: CourtState, id: string) => !!st.q[id]?.[0];
export const progOf = (st: CourtState, id: string) => st.q[id]?.[1] ?? 0;

export const dayQ = (k: string) => { const wd = wdOf(k); return QUESTS.filter((q) => q.cad === "Daily" && (!q.days || q.days.includes(wd))); };
export function activeQ(st: CourtState, k: string) {
  const wd = wdOf(k);
  return QUESTS.filter((q) => !q.days || q.days.includes(wd) || isDone(st, q.id));
}
export function qScore(q: Quest, k: string, nm: number) {
  let s = (q.cad === "Daily" ? 0 : 30) + (QPRI.includes(q.id) ? QPRI.indexOf(q.id) : 40);
  const wd = wdOf(k);
  if ((q.id === "c1" || q.id === "k1") && nm < 1080) s += 60;
  if (q.id === "k2" && (wd < 1 || wd > 4)) s += 60;
  return s;
}
export function openQuests(st: CourtState, k: string, nm: number) {
  return activeQ(st, k).filter((q) => !isDone(st, q.id)).sort((a, b) => qScore(a, k, nm) - qScore(b, k, nm));
}
export function manualOpen(st: CourtState, k: string) {
  const wk = wdOf(k) === 0 || wdOf(k) >= 5;
  return QUESTS.filter((q) => !isDone(st, q.id) && !q.auto && CKPRI.includes(q.id) && (q.cad === "Daily" || wk))
    .sort((a, b) => CKPRI.indexOf(a.id) - CKPRI.indexOf(b.id))
    .slice(0, 3);
}
export const doneToday = (st: CourtState, k: string) => dayQ(k).filter((q) => isDone(st, q.id));

// Daily and weekly rollover (v52 rollover): summarise the last day, reset what resets,
// keep the streak only if the morning brief was opened or a rest day was used.
export function rollover(st: CourtState, today: string): { st: CourtState; recap: Recap | null } {
  if (!st.day || st.day === today) return { st, recap: null };
  const old = st.day, wkNew = weekKey(today) !== (st.week || weekKey(old));
  const daily = dayQ(old), done = daily.filter((x) => isDone(st, x.id));
  const m1 = isDone(st, "m1"), restY = st.restDay === old;
  const days = { ...st.days, [old]: { d: done.length, t: daily.length, n: done.map((x) => x.title).slice(0, 12) } };
  const ks = Object.keys(days).sort();
  while (ks.length > 30) delete days[ks.shift()!];
  let streak = st.streak, lost = false;
  if (!m1 && !restY && streak > 0) { streak = 0; lost = true; }
  const q: CourtState["q"] = {};
  for (const x of QUESTS) if (!(x.cad === "Daily" || wkNew) && st.q[x.id]) q[x.id] = st.q[x.id];
  const prev = st.last && Object.keys(st.last).length ? { ...st.last, day: old } : null;
  return {
    st: { ...st, day: today, week: weekKey(today), days, streak, q, prev, last: {}, restDay: null },
    recap: { old, done: done.length, total: daily.length, newWeek: wkNew, lost, restY },
  };
}

export function weekHab(st: CourtState, k: string) {
  const wk = weekKey(k);
  let d = 0, t = 0;
  for (let i = 0; i < 7; i++) {
    const day = addDays(wk, i);
    if (day > k) break;
    if (day === k) { const q = dayQ(k); d += q.filter((z) => isDone(st, z.id)).length; t += q.length; }
    else { const x = st.days[day]; if (x) { d += x.d; t += x.t; } }
  }
  return { d, t };
}

export function winTally(st: CourtState, k: string) {
  const auto = doneToday(st, k).length, yd = st.days[addDays(k, -1)] ?? null, wk = weekKey(k);
  let wsum = 0, wtot = 0;
  for (let i = 0; i < 7; i++) {
    const day = addDays(wk, i);
    if (day > k) break;
    const d = day === k ? { d: auto, t: dayQ(k).length } : st.days[day];
    if (d) { wsum += d.d; wtot += d.t; }
  }
  const posts = st.cad?.wk === wk ? (st.cad.ig || 0) + (st.cad.x || 0) : 0;
  return { td: auto, tt: dayQ(k).length, yd, wsum, wtot, posts };
}

/* ---------- Sakura Garden ---------- */
export const STAGES = ["Seed", "Sprout", "Sapling", "Young tree", "Blossoming tree"];
export type SeedInfo = { n: number; run: number; pts: number; stage: number; idle: number; mood: "ok" | "thirsty" | "wilting"; wet: boolean };

export function seedInfo(sd: Seed, k: string): SeedInfo {
  const ds = Object.keys(sd.w || {}).sort();
  let run = 0, prev: string | null = null, pts = 0;
  for (const d of ds) { run = prev && addDays(prev, 1) === d ? run + 1 : 1; pts += 1 + Math.min(run, 10) * 0.1; prev = d; }
  const last = ds.length ? ds[ds.length - 1] : null;
  const live = last && dayGap(last, k) <= 1 ? run : 0, idle = dayGap(last || sd.at || k, k);
  const q = sd.q ? QUESTS.find((x) => x.id === sd.q) : null;
  let th = [4, 8];
  if (q) { if (q.cad === "Weekly") th = [10, 16]; else if (q.days) th = [7, 11]; }
  const stage = pts < 2 ? 0 : pts < 6 ? 1 : pts < 15 ? 2 : pts < 31 ? 3 : 4;
  return { n: ds.length, run: live, pts, stage, idle, mood: idle >= th[1] ? "wilting" : idle >= th[0] ? "thirsty" : "ok", wet: !!sd.w?.[k] };
}

// One-time seeding (v52 g.init / g.v17) and habit watering (v52 autoWater). Returns true if it changed anything.
export function tendGarden(st: CourtState, k: string): boolean {
  const g = st.gd;
  let ch = false;
  if (!g.init) {
    g.init = 1; ch = true;
    for (const q of QUESTS) if (!g.seeds.some((s) => s.q === q.id)) g.seeds.push({ id: "q_" + q.id, name: q.title, pk: "q_" + q.id, q: q.id, auto: "q", at: k, w: {} });
  }
  if (!g.v17) {
    g.v17 = 1; ch = true;
    if (!g.seeds.some((s) => s.id === "diary")) g.seeds.push({ id: "diary", name: "Write a win or a thank-you", pk: "wins", auto: "wins", at: k, w: {} });
  }
  const wn = doneToday(st, k).length, w = st.wins[k], wk = weekKey(k);
  for (const sd of g.seeds) {
    sd.w = sd.w || {};
    if (sd.w[k]) continue;
    let water = false;
    if (sd.auto === "wins" && w && (w.w || w.g)) water = true;
    if (sd.auto === "quests" && wn >= 3) water = true;
    if (sd.q) {
      const q = QUESTS.find((x) => x.id === sd.q);
      if (q && isDone(st, q.id)) {
        if (q.cad === "Weekly") { let has = false; for (let i = 0; i < 7; i++) if (sd.w[addDays(wk, i)]) has = true; water = !has; }
        else water = true;
      }
    }
    if (water) { sd.w[k] = 1; ch = true; }
  }
  return ch;
}

export function gardenWeek(st: CourtState, k: string) {
  const wk = weekKey(k);
  let water = 0, rel = 0;
  for (const sd of st.gd.seeds) for (let i = 0; i < 7; i++) { const d = addDays(wk, i); if (d <= k && sd.w?.[d]) water++; }
  for (const g of st.gd.gone) if (g.on >= wk && g.on <= k) rel++;
  return { water, rel };
}

/* ---------- Calendar events (filled by /api/calendar in Step 4) ---------- */
// sk/ek are SGT day keys, sm/em minutes from midnight. All-day events end on ek (exclusive).
export type CalEvent = { id: string; title: string; cal: string; color: string; allDay: boolean; sk: string; ek: string; sm: number; em: number; loc?: string; desc?: string };
export type DayEvent = { t: string; cal: string; color: string; loc?: string; desc?: string; allDay: boolean; a: number; b: number };

// The purchased "astro" feed (matched by its GCAL_NAME label) is Luna's layer, kept out of normal views.
export const isAstro = (e: { cal: string }) => /astro/i.test(e.cal);
export function eventsOn(evs: CalEvent[], k: string, withAstro = false): DayEvent[] {
  return evs
    .filter((e) => withAstro || !isAstro(e))
    .filter((e) => (e.allDay ? e.sk <= k && k < e.ek : e.sk === k || (e.sk < k && (e.ek > k || (e.ek === k && e.em > 0)))))
    .map((e) => ({
      t: e.title, cal: e.cal, color: e.color, loc: e.loc, desc: e.desc, allDay: e.allDay,
      a: e.allDay ? 0 : e.sk < k ? 0 : e.sm,
      b: e.allDay ? 1440 : e.ek > k ? 1440 : e.em,
    }))
    .sort((x, y) => (x.allDay ? -1 : 0) - (y.allDay ? -1 : 0) || x.a - y.a);
}

/* ---------- Coming up (Coco's life list) ---------- */
export const LCATS: Record<string, string> = { bill: "Bill", care: "Self care", pet: "Pet", money: "Money", decision: "Decision", habit: "Routine" };
export const LEADS: Record<string, number> = { bill: 7, decision: 7, care: 3, pet: 3, money: 1, habit: 0 };
export const money = (n: number | null | undefined) => (n == null ? "" : "S$" + (Math.round(n * 100) / 100).toString());

export function nextDue(it: LifeItem, from: string): string | null {
  const r = it.rule;
  if (r.type === "once") return it.paid ? null : r.date;
  if (r.type === "every") return r.last ? addDays(r.last, r.n) : null;
  if (r.type === "wk") { for (let i = 0; i < 7; i++) { const k = addDays(from, i); if (r.days.includes(wdOf(k))) return k; } return null; }
  if (r.type === "dom") {
    const y = +from.slice(0, 4), mo = +from.slice(5, 7) - 1;
    for (let j = 0; j < 26; j++) {
      const c = domDate(y + Math.floor((mo + j) / 12), (mo + j) % 12, r.d);
      if (c >= from && (!r.from || c >= r.from) && (!it.paid || c > String(it.paid))) return c;
    }
  }
  return null;
}

// Already booked: a date she picked, or a matching calendar event in the next 14 days.
export function bookedDate(it: LifeItem, k: string, evs: CalEvent[]): string | null {
  if (it.sched && it.sched >= k) return it.sched;
  const nm = String(it.name || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  if (nm.length < 4) return null;
  const ws = nm.split(" ").filter((w) => w.length > 3), end = addDays(k, 14);
  let best: string | null = null;
  for (const e of evs) {
    if (e.sk < k || e.sk > end) continue;
    const t = e.title.toLowerCase();
    if (t.includes(nm) || (ws.length > 1 && ws.every((w) => t.includes(w)))) if (!best || e.sk < best) best = e.sk;
  }
  return best;
}

export function dueList(st: CourtState, k: string, evs: CalEvent[]) {
  const out: { it: LifeItem; d: string; dd: number }[] = [];
  for (const it of st.life) {
    if (it.rule.type === "wk") continue;
    const d = nextDue(it, k);
    if (d == null || bookedDate(it, k, evs)) continue;
    out.push({ it, d, dd: dayGap(k, d) });
  }
  return out.sort((a, b) => a.dd - b.dd);
}

export function ruleText(r: LifeRule) {
  if (r.type === "dom") return `Day ${r.d} each month${r.from ? ", from " + r.from : ""}`;
  if (r.type === "every") return `Every ${r.n} days${r.last ? ", last " + r.last : ""}`;
  if (r.type === "wk") return "Weekly: " + r.days.map(wdName).join(", ");
  return "Once, " + r.date;
}
export function whenText(dd: number, d: string) {
  return dd < 0 ? `overdue by ${-dd} day${dd === -1 ? "" : "s"}` : dd === 0 ? "today" : dd === 1 ? "tomorrow" : `in ${dd} days (${prettyDay(d)})`;
}

/* ---------- Ideas for your free time (Momo) ---------- */
// Free gaps of 45 minutes or more between 08:00 and 22:00 (from now, if it is today).
export function freeWindows(evs: DayEvent[], fromMin: number) {
  const hi = 1320, lo = Math.max(480, Math.ceil(fromMin / 15) * 15);
  const iv = evs.filter((e) => !e.allDay).map((e) => [e.a, e.b]).sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  let cur = lo;
  for (const [a, b] of iv) { if (a > cur && a - cur >= 45) out.push([cur, Math.min(a, hi)]); cur = Math.max(cur, b); }
  if (hi - cur >= 45 && cur < hi) out.push([cur, hi]);
  return out.filter((w) => w[1] - w[0] >= 45);
}

export type Idea = { a: number; b: number; id: string; act: "dump" | null; title: string; why: string[] };
type Cand = { id: string; act?: "dump"; t: (c: Slot) => string; sc: (c: Slot) => number; why: (c: Slot) => string[] };
type Slot = { a: number; b: number; len: number };

// v52 momoIdeas, without the sky reading (Luna's astro data is not ported yet).
export function momoIdeas(st: CourtState, k: string, today: string, dayEvs: DayEvent[], fromMin: number, evs: CalEvent[]): Idea[] {
  const fw = freeWindows(dayEvs, fromMin).sort((a, b) => b[1] - b[0] - (a[1] - a[0])).slice(0, 3).sort((a, b) => a[0] - b[0]);
  const wd = wdOf(k), isT = k === today;
  const mood = isT ? st.mood[k]?.m ?? 0 : 0, low = mood > 0 && mood <= 2;
  const dumpN = st.dump.filter((d) => !d.done).length;
  const open = (id: string) => !isT || !isDone(st, id);
  const C: Cand[] = [
    { id: "sprint", t: () => "One focus sprint on your hardest thing", sc: (c) => 1 + (open("k7") ? 2 : 0) + (c.len >= 60 ? 1 : 0) + (c.a < 780 ? 1 : 0) - (low ? 2 : 0), why: () => (open("k7") ? ["your sprint quest is still open"] : ["a good block of quiet time"]) },
    { id: "study", t: (c) => `Study block, ${Math.min(c.len, 90)} min`, sc: (c) => (wd >= 1 && wd <= 4 && open("k2") && c.len >= 60 ? 6 : 0), why: () => ["course day", ...(open("k2") ? ["study quest still open"] : [])] },
    { id: "move", t: () => "Walk or stretch outside", sc: () => 1 + (low ? 3 : 0), why: () => (low ? ["you noted a low mood"] : ["a gentle reset between tasks"]) },
    { id: "dump", act: "dump", t: () => "Clear your parked thoughts", sc: () => (dumpN >= 2 ? 3 + dumpN * 0.5 : 0), why: () => [`${dumpN} thoughts are parked and waiting`] },
    { id: "charts", t: () => "Chart review: write your bias and levels", sc: (c) => (wd >= 1 && wd <= 5 && open("f1") ? (c.a >= 1020 ? 3 : 2) : 0), why: () => ["your pre-entry checklist is still open", "the crew tracks, you decide"] },
    { id: "review", t: () => "Heavenly Tribulation: weekly review with Kumo", sc: () => ((wd === 0 || wd === 5) && open("k5") ? 4 : 0), why: () => ["weekly review is still open"] },
    { id: "rest", t: () => "Slow time: tea, stretch, no screens", sc: (c) => (low ? 4 : 0) + (c.a >= 1200 ? 1 : 0), why: () => (low ? ["you noted a low mood"] : ["end of day"]) },
    { id: "read", t: () => "Read something that feeds your thinking", sc: () => 1, why: () => ["keeps your mind fed"] },
    { id: "friend", t: () => "Message or meet someone close", sc: (c) => 1 + (c.a >= 1020 ? 1 : 0), why: () => ["time with people keeps the week balanced"] },
    { id: "money", t: () => "Log today's spending, 2 minutes", sc: (c) => (isT && open("c1") && c.a >= 1140 ? 4 : 0), why: () => ["the spending log is still open", "categories only, no account numbers"] },
  ];
  // Coco's life list (v52 lifeIdeas).
  const dl = dueList(st, k, evs);
  for (const x of dl) {
    const it = x.it;
    if ((it.cat === "care" || it.cat === "pet") && x.dd <= it.lead)
      C.push({ id: "life-" + it.id, t: () => (x.dd < 0 ? "Overdue: " : "") + it.name, sc: (c) => (c.len >= 60 ? (x.dd < 0 ? 7 : 4) : 0), why: () => [(x.dd < 0 ? "was due " : "due ") + prettyDay(x.d), "it is on Coco's life list"] });
  }
  for (const [id, a, b, lbl] of [["feeds-am", 750, 840, "midday"], ["feeds-pm", 1170, 1260, "evening"]] as const)
    C.push({ id, t: () => "Feed check, 10 min: Pip's headlines, then paste your FYP for Poppy", sc: (c) => (c.a <= b && c.b >= a ? 4 : 0), why: () => [`your ${lbl} feed window, twice a day instead of scrolling`, "keeps you in touch without the rabbit hole"] });
  const bills = dl.filter((x) => (x.it.cat === "bill" || x.it.cat === "money") && x.dd <= x.it.lead);
  if (bills.length)
    C.push({ id: "life-bills", t: () => "Bills check: " + bills.slice(0, 3).map((x) => x.it.name).join(", ") + (bills.length > 3 ? " and more" : ""), sc: () => 3 + (bills.some((x) => x.dd <= 1) ? 2 : 0), why: () => [`${bills.length} due within their reminder window`, "10 minutes now saves a late fee"] });
  for (const it of st.life)
    if (it.rule.type === "wk" && it.rule.days.includes(wd))
      C.push({ id: "life-" + it.id, t: () => it.name, sc: (c) => (c.len >= 60 ? 5 : 0), why: () => [`it is one of your ${it.name} days`] });

  const used: Record<string, 1> = {}, out: Idea[] = [];
  for (const [a, b] of fw) {
    const c = { a, b, len: b - a };
    let best: Cand | null = null, bs = 0;
    for (const x of C) { if (used[x.id]) continue; const s = x.sc(c); if (s > bs) { bs = s; best = x; } }
    if (!best) continue;
    used[best.id] = 1;
    out.push({ a, b, id: best.id, act: best.act ?? null, title: best.t(c), why: best.why(c) });
  }
  return out;
}

export { needFor };
