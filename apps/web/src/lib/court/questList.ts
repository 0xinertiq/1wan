import { QUESTS, TRADING_Q } from "./quests";
import { anchorOn, split, ordered } from "./gardenEdit";
import type { CourtState } from "./state";
import { addDays, wdOf } from "./time";

// Foundations F1: ONE Quests list. It is built from the three places her quests already live (the Habit Quests in
// quests.ts, the Daily anchors in defs.swins plus her own anchors in gedit, and My habits in hab), so nothing is
// copied, moved or deleted, and every tick stays where it was. The only new saved key, ql, holds what the list adds:
// which 3 quests are core (the rest are bonus), a pillar tag (0 to 7, the slot of a grid pillar) and a tiny version.
// No XP, star, streak or tail rule changes here; the streak moves to done days in F2.

export type QSrc = "quest" | "anchor" | "habit";
export type QItem = {
  id: string;            // "q:<quest id>", "a:<anchor id>" or "h:<habit id>"
  src: QSrc; ref: string; name: string; cad: "Daily" | "Weekly";
  core: boolean; pillar: number | null; tiny: string | null; xp: number;
  on: boolean;           // scheduled today
  done: boolean;         // ticked today
};
export type QMeta = { pillar?: number; tiny?: string };
export type QuestList = { core: string[]; auto: boolean; meta: Record<string, QMeta>; sv?: number };   // sv: 1 once the streak counts done days (F2)

export const CORE_N = 3, TINY_MAX = 60, AUTO_DAYS = 28;
// The Daily anchors quest (k1) only counts the anchors, which are now in the list themselves.
const GROUP_Q = ["k1"];
// Tiny versions for the fixed quests (half XP once the game loop lands). Her own anchors and habits start without one.
const TINY: Record<string, string> = {
  m1: "Read the bottom line only", k7: "A 5-minute sprint", k2: "20 minutes of study", o1: "Check today's top release",
  l2: "One word for your mood", f1: "Write the bias line only", c1: "Log one spend",
};
const QID = /^[qah]:[A-Za-z0-9_:.\-]{1,80}$/;

const obj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** Only well-formed values are kept; an absent or odd key reads as "nothing picked yet" (auto core). */
export function normQuestList(v: unknown): QuestList {
  const r = obj(v);
  const core = [...new Set((Array.isArray(r.core) ? r.core : []).filter((x): x is string => typeof x === "string" && QID.test(x)))].slice(0, CORE_N);
  const meta = Object.fromEntries(Object.entries(obj(r.meta)).filter(([id]) => QID.test(id)).map(([id, m]) => {
    const o = obj(m), x: QMeta = {};
    if (Number.isInteger(o.pillar) && (o.pillar as number) >= 0 && (o.pillar as number) < 8) x.pillar = o.pillar as number;
    if (typeof o.tiny === "string" && o.tiny.trim()) x.tiny = o.tiny.trim().slice(0, TINY_MAX);
    return [id, x];
  }).filter(([, x]) => Object.keys(x as QMeta).length).slice(0, 400)) as Record<string, QMeta>;
  return { core, auto: r.auto === false && core.length === CORE_N ? false : true, meta, ...(r.sv === 1 ? { sv: 1 } : {}) };
}

type St = Pick<CourtState, "q" | "days" | "swins" | "hab" | "gedit" | "defs" | "questsOff"> & { ql?: QuestList };

/** Every quest in one list, in this order: Habit Quests, anchors, her habits (her saved order and hidden items respected). */
function baseItems(st: St, k: string, owner: boolean): Omit<QItem, "core">[] {
  const ql = st.ql ?? normQuestList(undefined), wd = wdOf(k);
  const meta = (id: string) => ql.meta[id] ?? {};
  const quests = QUESTS.filter((x) => !GROUP_Q.includes(x.id) && !st.questsOff.includes(x.id) && (owner || !TRADING_Q.includes(x.id)))
    .map((x) => { const id = "q:" + x.id; return { id, src: "quest" as const, ref: x.id, name: st.gedit.quests.names[x.id] ?? x.title, cad: x.cad,
      pillar: meta(id).pillar ?? null, tiny: meta(id).tiny ?? TINY[x.id] ?? null, xp: x.xp, on: !x.days || x.days.includes(wd), done: !!st.q[x.id]?.[0] }; });
  const e = st.gedit, imported = st.defs.swins?.phases.find((p) => p.daily)?.items ?? [], ticked = [...(st.swins.log[k] ?? []), ...(e.anchors.log[k] ?? [])];
  const all = [
    ...imported.map(([id, t]) => ({ id, t: e.anchors.names[id] ?? t })),
    ...e.anchors.mine.map((m) => ({ id: m.id, t: e.anchors.names[m.id] ?? m.t })),
  ];
  const anchors = split(ordered(all, (x) => x.id, e.anchors.order), (x) => x.id, e.anchors.hidden).shown
    .map((a) => { const id = "a:" + a.id; return { id, src: "anchor" as const, ref: a.id, name: a.t, cad: "Daily" as const,
      pillar: meta(id).pillar ?? null, tiny: meta(id).tiny ?? null, xp: 10, on: anchorOn(e.anchors.meta[a.id], wd), done: ticked.includes(a.id) }; });
  const habTicks = st.hab.log[k] ?? [];
  const habits = split(ordered(st.hab.list.filter((h) => !h.paused), (h) => h.id, e.hab.order), (h) => h.id, e.hab.hidden).shown
    .map((h) => { const id = "h:" + h.id; return { id, src: "habit" as const, ref: h.id, name: h.name, cad: "Daily" as const,
      pillar: meta(id).pillar ?? null, tiny: meta(id).tiny ?? null, xp: 10, on: h.days.includes(wd), done: habTicks.includes(h.id) }; });
  const seen = new Set<string>();
  return [...quests, ...anchors, ...habits].filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}

/** Was this item ticked on day d? Quests from the saved day record (titles), anchors and habits from their logs. */
export function doneOn(st: St, item: Pick<QItem, "src" | "ref">, d: string, today: string): boolean {
  if (item.src === "quest") {
    if (d === today) return !!st.q[item.ref]?.[0];
    const title = QUESTS.find((x) => x.id === item.ref)?.title;
    return !!title && (st.days[d]?.n ?? []).includes(title);
  }
  if (item.src === "anchor") return (st.swins.log[d] ?? []).includes(item.ref) || (st.gedit.anchors.log[d] ?? []).includes(item.ref);
  return (st.hab.log[d] ?? []).includes(item.ref);
}

/** Until she picks her own 3: her 3 most-ticked daily quests over the last 28 days (ties keep list order). */
export function autoCore(st: St, k: string, owner: boolean): string[] {
  const items = baseItems(st, k, owner).filter((x) => x.cad === "Daily");
  const days = Array.from({ length: AUTO_DAYS }, (_, i) => addDays(k, -i));
  return items.map((x, i) => ({ id: x.id, i, n: days.filter((d) => doneOn(st, x, d, k)).length }))
    .sort((a, b) => b.n - a.n || a.i - b.i).slice(0, CORE_N).map((x) => x.id);
}

/** The 3 core quests today: her own pick when she has made one (and all 3 still exist), otherwise the auto pick. */
export function coreIds(st: St, k: string, owner: boolean): string[] {
  const ql = st.ql ?? normQuestList(undefined);
  if (!ql.auto) { const ids = new Set(baseItems(st, k, owner).map((x) => x.id)); if (ql.core.every((id) => ids.has(id))) return ql.core; }
  return autoCore(st, k, owner);
}

/** The one Quests list for day k: core first (in core order), then bonus in list order. */
export function questItems(st: St, k: string, owner: boolean): QItem[] {
  const core = coreIds(st, k, owner), base = baseItems(st, k, owner);
  const pick = core.map((id) => base.find((x) => x.id === id)).filter((x): x is Omit<QItem, "core"> => !!x).map((x) => ({ ...x, core: true }));
  return [...pick, ...base.filter((x) => !core.includes(x.id)).map((x) => ({ ...x, core: false }))];
}

/** Foundations F2: a done day = all 3 core quests ticked that day. */
export function coreDoneOn(st: St, d: string, today: string, owner = true): boolean {
  const core = coreIds(st, d, owner), base = baseItems(st, d, owner);
  const items = core.map((id) => base.find((x) => x.id === id)).filter((x): x is Omit<QItem, "core"> => !!x);
  return items.length === CORE_N && items.every((x) => doneOn(st, x, d, today));
}
/** The streak to show: done days up to yesterday (saved), plus today once its 3 core quests are ticked. */
export function streakNow(st: St & { streak: number }, k: string, owner = true): number {
  return st.streak + (coreDoneOn(st, k, k, owner) ? 1 : 0);
}
