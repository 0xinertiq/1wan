import type { PItem } from "./state";

// Round 13: the Garden's "Edit garden" panel (one new optional key, gedit). It only holds how her lists look:
// names, order, what is folded away, anchor times and days, her own anchors and milestones. Hiding never deletes:
// a hidden item keeps its ticks and history, still exports, and comes back with Unhide. The imported tracker
// definitions (defs), the quest list and every XP, star, streak and tail rule are never changed by this key; her
// own anchors and milestones keep their ticks here and award nothing.
export type Freq = "daily" | "weekdays" | "custom";
export type AnchorMeta = { at?: string; freq?: Freq; days?: number[] };
export type MyItem = { id: string; t: string; d?: string; dt?: string; at: string };
export type EditList = { names: Record<string, string>; hidden: string[]; order: string[] };
export type GardenEdit = {
  hab: { hidden: string[]; order: string[] };   // names stay in hab.list (My habits); questsOff stays the quest switch
  quests: { names: Record<string, string>; order: string[] };
  anchors: EditList & { meta: Record<string, AnchorMeta>; mine: MyItem[]; log: Record<string, string[]> };
  ladder: EditList & { labels: Record<string, string>; targets: Record<string, string>; mine: MyItem[]; done: Record<string, boolean> };
};

export const NAME_MAX = 60, LABEL_MAX = 120, TARGET_MAX = 30, MINE_MAX = 40;
export const MY_ANCHOR = "ma-", MY_MILESTONE = "mm-";

const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const ids = (v: unknown) => [...new Set((Array.isArray(v) ? v : []).filter((x): x is string => typeof x === "string" && x.length > 0 && x.length <= 80))].slice(0, 400);
const texts = (v: unknown, max: number) => Object.fromEntries(Object.entries(obj(v)).filter(([, x]) => typeof x === "string" && x.trim()).map(([id, x]) => [id, (x as string).trim().slice(0, max)])) as Record<string, string>;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const mine = (v: unknown, pre: string): MyItem[] => (Array.isArray(v) ? v : []).map(obj)
  .filter((x) => typeof x.id === "string" && x.id.startsWith(pre) && typeof x.t === "string" && x.t.trim())
  .map((x) => ({ id: x.id as string, t: (x.t as string).trim().slice(0, NAME_MAX), at: typeof x.at === "string" ? x.at : "",
    ...(typeof x.d === "string" && x.d.trim() ? { d: x.d.trim().slice(0, LABEL_MAX) } : {}),
    ...(typeof x.dt === "string" && x.dt.trim() ? { dt: x.dt.trim().slice(0, TARGET_MAX) } : {}) })).slice(0, MINE_MAX);
const wdays = (v: unknown) => [...new Set((Array.isArray(v) ? v : []).filter((d): d is number => Number.isInteger(d) && d >= 0 && d < 7))].sort();

/** Only well-formed values are kept; an absent or odd key reads as "nothing edited", so older documents load as before. */
export function normGardenEdit(v: unknown): GardenEdit {
  const r = obj(v), h = obj(r.hab), q = obj(r.quests), a = obj(r.anchors), l = obj(r.ladder);
  const meta = Object.fromEntries(Object.entries(obj(a.meta)).map(([id, m]) => {
    const o = obj(m), x: AnchorMeta = {};
    if (typeof o.at === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(o.at)) x.at = o.at;
    if (o.freq === "daily" || o.freq === "weekdays" || o.freq === "custom") x.freq = o.freq;
    if (x.freq === "custom") x.days = wdays(o.days);
    return [id, x];
  }).filter(([, x]) => Object.keys(x as AnchorMeta).length)) as Record<string, AnchorMeta>;
  // her own anchors' ticks, the last 400 days kept (older days are dropped, like the 30-day quest history)
  const log = Object.fromEntries(Object.entries(obj(a.log)).filter(([d, x]) => DAY.test(d) && Array.isArray(x)).sort(([x], [y]) => (x < y ? 1 : -1)).slice(0, 400).map(([d, x]) => [d, ids(x)]));
  const done = Object.fromEntries(Object.entries(obj(l.done)).filter(([id, on]) => id.startsWith(MY_MILESTONE) && on === true)) as Record<string, boolean>;
  return {
    hab: { hidden: ids(h.hidden), order: ids(h.order) },
    quests: { names: texts(q.names, NAME_MAX), order: ids(q.order) },
    anchors: { names: texts(a.names, NAME_MAX), hidden: ids(a.hidden), order: ids(a.order), meta, mine: mine(a.mine, MY_ANCHOR), log },
    ladder: { names: texts(l.names, NAME_MAX), labels: texts(l.labels, LABEL_MAX), targets: texts(l.targets, TARGET_MAX), hidden: ids(l.hidden), order: ids(l.order), mine: mine(l.mine, MY_MILESTONE), done },
  };
}

/** Her saved order first (in that order), then anything new in its original place. Nothing is dropped. */
export function ordered<T>(items: T[], idOf: (x: T) => string, order: string[]): T[] {
  const at = new Map(order.map((id, i) => [id, i]));
  return items.map((x, i) => ({ x, i, o: at.get(idOf(x)) })).sort((a, b) => (a.o ?? order.length + a.i) - (b.o ?? order.length + b.i)).map((y) => y.x);
}
/** Split a list into what shows and what is folded away (hidden items are kept, never removed). */
export function split<T>(items: T[], idOf: (x: T) => string, hidden: string[]) {
  const off = new Set(hidden);
  return { shown: items.filter((x) => !off.has(idOf(x))), folded: items.filter((x) => off.has(idOf(x))) };
}
/** Move one id up or down in the full current order; returns the new order to save. */
export function move(current: string[], id: string, dir: -1 | 1) {
  const list = [...current], i = list.indexOf(id), j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return list;
  [list[i], list[j]] = [list[j], list[i]];
  return list;
}
/** Move one shown id among the shown ones, keeping every hidden item's saved place in the full order. */
export function moveShown(full: string[], shown: string[], id: string, dir: -1 | 1) {
  const local = move(shown, id, dir);
  return full.map((y) => (shown.includes(y) ? local[shown.indexOf(y)] : y));
}
export const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/** A quest's name as she renamed it (display only). */
export const questName = (e: GardenEdit, q: { id: string; title: string }) => e.quests.names[q.id] ?? q.title;
/** Her habits as shown: her order, folded-away ones left out (they stay in hab with their ticks). */
export function shownHabits<H extends { id: string }>(list: H[], e: GardenEdit) { return split(ordered(list, (h) => h.id, e.hab.order), (h) => h.id, e.hab.hidden); }

/** Is this anchor scheduled on weekday wd (0 = Sunday)? No setting means every day, as before. */
export function anchorOn(m: AnchorMeta | undefined, wd: number) {
  if (!m?.freq || m.freq === "daily") return true;
  if (m.freq === "weekdays") return wd >= 1 && wd <= 5;
  return (m.days ?? []).includes(wd);
}

/** Round 14: the Daily anchors quest's target for a day: the imported anchors scheduled that day and not hidden.
 *  Her own anchors never count. done = ticks among those (a hidden anchor's ticks stay in swins, uncounted). */
export function anchorCount(imported: PItem[], e: GardenEdit, wd: number, ticked: string[]) {
  const counted = imported.map((x) => x[0]).filter((id) => !e.anchors.hidden.includes(id) && anchorOn(e.anchors.meta[id], wd));
  return { target: counted.length, done: counted.filter((id) => ticked.includes(id)).length };
}

export type AnchorRow = { id: string; t: string; d: string; at?: string; mine: boolean; on: boolean };
/** Her anchors as shown: imported anchors (ids and ticks untouched) then her own, renamed, ordered, hidden ones folded. */
export function anchorRows(imported: PItem[], e: GardenEdit, wd: number) {
  const all: AnchorRow[] = [
    ...imported.map(([id, t, d]) => ({ id, t: e.anchors.names[id] ?? t, d: d ?? "", mine: false })),
    ...e.anchors.mine.map((m) => ({ id: m.id, t: e.anchors.names[m.id] ?? m.t, d: m.d ?? "", mine: true })),
  ].map((x) => ({ ...x, at: e.anchors.meta[x.id]?.at, on: anchorOn(e.anchors.meta[x.id], wd) }));
  return split(ordered(all, (x) => x.id, e.anchors.order), (x) => x.id, e.anchors.hidden);
}

/** One ladder phase as shown: names, labels and targets over the imported ones, her order, hidden ones folded. */
export function ladderItems(items: PItem[], e: GardenEdit): PItem[] {
  const shown = split(ordered(items, (x) => x[0], e.ladder.order), (x) => x[0], e.ladder.hidden).shown;
  return shown.map(([id, t, d, dt, rv]) => [id, e.ladder.names[id] ?? t, e.ladder.labels[id] ?? d, e.ladder.targets[id] ?? dt, rv] as PItem);
}
/** Her own milestones as ladder items (run them through ladderItems; ticks kept in gedit, no XP). */
export const myMilestones = (e: GardenEdit): PItem[] => e.ladder.mine.map((m) => [m.id, m.t, m.d ?? "", m.dt ?? ""] as PItem);
