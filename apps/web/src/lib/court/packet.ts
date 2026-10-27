import { QUESTS } from "./quests";
import { dueList, eventsOn, isAstro, type CalEvent, type CourtState } from "./state";
import { addDays, prettyDay, weekKey } from "./time";
import { branches, type WaterEvt } from "./garden";

// Kumo weekly review packet (BUILD-ORDER step 14). A compact, structured summary of Monday to Sunday (SGT)
// built only from her own records. The same function feeds "Copy for Claude" and GET /api/export/weekly.
// Sensitive sections are OFF unless she turns them on in the preview.
export type PacketOpts = { diary: boolean; birth: boolean; sensitive: boolean; networth: boolean; notes: boolean };
export const PACKET_DEFAULT: PacketOpts = { diary: false, birth: false, sensitive: false, networth: false, notes: false };
export const PACKET_LABELS: Record<keyof PacketOpts, string> = {
  diary: "Diary text (wins, gratitude, notes)", birth: "Birth details", sensitive: "Legal and health items",
  networth: "Net worth and loan figures", notes: "Free-text notes (plan theses, trade lessons)",
};
type Row = Record<string, unknown>;
export type PacketIn = { st: CourtState; k: string; events: CalEvent[]; trades: Row[]; plans: Row[]; water: WaterEvt[]; spending: { at: string; amount: number; category: string }[]; sky: { at: Date; t: string }[]; opts: PacketOpts };

const sgtDay = (iso: string) => new Date(Date.parse(iso) + 8 * 3600000).toISOString().slice(0, 10);
const r1 = (x: number) => Math.round(x * 10) / 10;

export function buildPacket({ st, k, events, trades, plans, water, spending, sky, opts }: PacketIn): string {
  const wk = weekKey(k), end = addDays(wk, 6), days = Array.from({ length: 7 }, (_, i) => addDays(wk, i)).filter((d) => d <= k);
  const inWeek = (d: string) => d >= wk && d <= end;
  const L: string[] = [`WEEKLY PACKET · ${prettyDay(wk)} to ${prettyDay(end)} (SGT) · built ${prettyDay(k)}`, ""];

  L.push("QUESTS (daily done of total)");
  L.push(days.map((d) => { const x = st.days[d]; return `${prettyDay(d)} ${x ? `${x.d}/${x.t}` : "no record"}`; }).join(" · "));
  const auto = QUESTS.filter((q) => q.auto).map((q) => q.title), self = QUESTS.filter((q) => !q.auto).map((q) => q.title);
  L.push(`Sources: auto quests (${auto.length}) count from records; self-report quests: ${self.length ? self.join(", ") : "none"}.`);
  L.push("Daily anchors ticked (self-report): " + days.map((d) => `${prettyDay(d)} ${(st.swins.log[d] || []).length}/8`).join(" · "), "");

  const g = branches(st, k, water);
  L.push("GARDEN");
  L.push(`Trunk ${g.trunk.stage}${g.trunk.last ? `, last ${prettyDay(g.trunk.last)}` : ""}`);
  for (const b of g.list) L.push(`${b.n}. ${b.name}: ${b.stage}, ${b.last ? b.idle + " days since activity" : "no activity yet"}, ${b.blossoms}/8 blossoms`);
  const gridWeek = water.filter((e) => e.source === "grid" && inWeek(sgtDay(e.at)));
  L.push(`Grid ticks this week: ${gridWeek.length}${gridWeek.length ? " (" + gridWeek.map((e) => e.ref.replace("grid:", "")).join(", ") + ")" : ""}`, "");

  const tw = trades.filter((t) => inWeek(String(t.date ?? ""))), pw = plans.filter((p) => inWeek(String(p.date ?? "")));
  const closed = tw.filter((t) => t.exit != null || t.pnl != null);
  const scores = tw.map((t) => (typeof t.rules === "number" ? t.rules : null)).filter((x): x is number => x != null);
  const trig = plans.filter((p) => p.triggered), froze = trig.filter((p) => !p.placed);
  const late = tw.filter((t) => { const h = new Date(Date.parse(String(t.at)) + 8 * 3600000).getUTCHours(); return h >= 23 || h < 6; });
  L.push("TRADING (counts only)");
  L.push(`Trades logged ${tw.length}, closed ${closed.length}, wins ${closed.filter((t) => Number(t.pnl) > 0).length}. Checklist average ${scores.length ? r1(scores.reduce((a, b) => a + b, 0) / scores.length) + "/9" : "not scored"}. Placed 11pm to 6am: ${late.length}.`);
  L.push(`Plans written this week ${pw.length}. Freeze rate (all plans) ${trig.length ? Math.round((froze.length / trig.length) * 100) + "% (" + froze.length + " of " + trig.length + " triggered)" : "no plans triggered"}.`);
  const tags: Record<string, number> = {}; for (const t of tw) for (const x of Array.isArray(t.tags) ? t.tags : []) tags[String(x)] = (tags[String(x)] ?? 0) + 1;
  if (Object.keys(tags).length) L.push("Mistake tags: " + Object.entries(tags).map(([a, b]) => `${a} ${b}`).join(", "));
  if (opts.notes) for (const p of pw) if (p.thesis) L.push(`Thesis (${String(p.inst)}): ${String(p.thesis).slice(0, 200)}`);
  if (opts.notes) for (const t of tw) if (t.lesson) L.push(`Lesson (${String(t.inst)}): ${String(t.lesson).slice(0, 200)}`);
  L.push("");

  const sw = spending.filter((x) => inWeek(sgtDay(x.at))), cats: Record<string, number> = {};
  for (const x of sw) cats[x.category] = (cats[x.category] ?? 0) + Number(x.amount);
  L.push("MONEY");
  L.push(`Spending lines ${sw.length}: ${Object.entries(cats).map(([c, v]) => `${c} ${r1(v)}`).join(", ") || "none logged"}.`);
  const due = dueList(st, k, events).filter((x) => x.dd >= 0 && x.dd <= 7 && (x.it.cat === "bill" || x.it.cat === "money"));
  L.push(`Bills due in the next 7 days: ${due.map((x) => `${x.it.name} ${prettyDay(x.d)}`).join(", ") || "none"}.`);
  const sens = (c: string) => c === "care" || c === "decision";
  const paid = st.life.filter((i) => typeof i.paid === "string" && inWeek(i.paid) && (opts.sensitive || !sens(i.cat)));
  L.push(`Life admin done this week: ${paid.map((i) => i.name).join(", ") || "none recorded"}.`);
  const mw = st.defs.money;
  if (mw) {
    const behind = mw.funds.filter(([id, , target, due2, monthly]) => { const bal = st.money.f[id] ?? 0; return due2 && due2 >= k && bal + monthly < target - 0.05; }).length;
    L.push(`Sinking funds: ${mw.funds.length}, ${behind ? behind + " may be behind pace" : "none flagged"}. Money routines: r1 ${sw.length ? "logged" : "no lines"}, r2 Sunday reset ${st.money.done.r2 ? "ticked" : "not ticked"}.`);
    if (mw.k) L.push(`Free SGD vs baseline: ${r1((st.money.t.free ?? 0) - mw.k.base)}.`);
    if (opts.networth) L.push(`Net worth: ${Math.round(mw.nw.reduce((a, r) => a + r[4] * (st.money.nw[r[0]] ?? r[3]), 0))}. Loans back: SGD ${st.money.t.sgd ?? 0}, USD ${st.money.t.usd ?? 0}.`);
  }
  L.push("");

  L.push("CALENDAR");
  L.push(Array.from({ length: 7 }, (_, i) => addDays(wk, i)).map((d) => `${prettyDay(d)} ${eventsOn(events, d).length}`).join(" · ") + " events");
  const nextWk = addDays(wk, 7);
  L.push(`Next week: ${Array.from({ length: 7 }, (_, i) => eventsOn(events, addDays(nextWk, i)).length).reduce((a, b) => a + b, 0)} events.`, "");

  const t = st.samsara.t.wk === wk ? st.samsara.t : { hours: 0, replies: 0 };
  const posts = st.cad?.wk === wk ? st.cad.x || 0 : 0;
  L.push("RHYTHM");
  L.push(`Study ${t.hours}/6 h. X posts ${posts}, replies ${t.replies}. Nights in bed before midnight: ${days.filter((d) => (st.swins.log[d] || []).includes("d1")).length}/${days.length}.`, "");

  L.push("SKY (context only)");
  L.push(sky.filter((e) => { const d = sgtDay(e.at.toISOString()); return d >= wk && d <= addDays(nextWk, 6); }).map((e) => `${prettyDay(sgtDay(e.at.toISOString()))} ${e.t}`).join(" · ") || "no stations, ingresses or eclipses");
  const astro = events.filter((e) => isAstro(e) && e.sk >= wk && e.sk <= end).length;
  if (astro) L.push(`Astro calendar entries this week: ${astro}.`);

  if (opts.diary) {
    L.push("", "DIARY (included by her)");
    for (const d of days) { const w = st.wins[d]; if (w && (w.w || w.g || w.n)) L.push(`${prettyDay(d)}: ${[w.w && "win: " + w.w, w.g && "grateful: " + w.g, w.n && "notes: " + w.n.slice(0, 400)].filter(Boolean).join(" | ")}`); }
  }
  if (opts.birth && st.birth) L.push("", `BIRTH (included by her): ${st.birth.date} ${st.birth.time}, ${st.birth.place}`);
  return L.join("\n");
}
