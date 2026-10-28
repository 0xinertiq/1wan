// Round 10 checks: Calendar nav row, the mini month's last week, the reflection selector, the separate 2027 chart,
// loans (remove, restore, S$40,000), leverage maths, briefing uniqueness, Today to-dos across a day boundary, quote
// rotation, the garden's growth and past catalyst dates.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { CourtCtx } from "../src/components/court/CourtState.tsx";
import { OWNED_KEYS, normalize } from "../src/lib/court/state.ts";

const h = React.createElement;
const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");
const css = src("app/(court)/kumo-new.css");
const ctx = (k, st = normalize({}, k)) => ({ st, k, nm: 600, recap: null, clearRecap() {}, update() {}, levelUp() {}, save: "idle", events: [], cal: { state: "live", cals: [] }, setCalendar() {}, prices: null, setPrices() {}, pxBusy: false, setPxBusy() {}, sheet: null, openSheet() {} });
const html = (k, el, st) => renderToString(h(CourtCtx.Provider, { value: ctx(k, st) }, el)).replace(/<!-- -->/g, "");

test("Calendar nav: Back left, the label centred, Next right, on one row", async () => {
  const { CalendarTab } = await import("../src/components/court/live/CalendarTab.tsx");
  const out = html("2026-10-28", h(CalendarTab, { noWeek: true }));
  assert.match(out, /<div class="kcal-nav"><button[^>]*>‹ Back<\/button><span class="kcal-nav-l"><b>[^<]+<\/b><\/span><button[^>]*>Next ›<\/button><\/div>/);
  assert.match(css, /\.kcal-nav\{display:grid;grid-template-columns:auto minmax\(0,1fr\) auto;align-items:center/);
});

test("mini month, last week of the month: one number per cell, the heart sits behind it", async () => {
  const { MiniMonth } = await import("../src/components/court/pages/CalendarPage.tsx");
  for (const k of ["2026-10-28", "2026-10-31", "2026-11-30"]) {
    const out = html(k, h(MiniMonth, { marks: () => false, onPick() {}, picked: k }));
    const cell = out.match(/<button type="button" class="is-today[^"]*"[^>]*>([\s\S]*?)<\/button>/);
    assert.ok(cell, "today's cell uses is-today, not Classic's .today grid class");
    assert.deepEqual([...cell[1].matchAll(/<span>(\d+)<\/span>/g)].map((m) => m[1]), [String(+k.slice(8))], k);
    assert.match(cell[1], /^<svg class="kheart on"/, "the heart comes first, behind the number");
    assert.ok(!/class="today /.test(out));
  }
  assert.ok(!/\.kmini button\.today\b/.test(css));
});

test("trade reflection: no 'Not a trade' option, and no selector without trades", async () => {
  const d = src("components/court/pages/Dungeon.tsx");
  assert.ok(!/Not about a trade|Not a trade/.test(d));
  assert.match(d, /\{trades\.length > 0 && <select aria-label="Link a trade"/);
});

test("the 2027 chart is its own: separate key and ticks, blank to start, 2026 untouched", async () => {
  assert.ok(OWNED_KEYS.includes("gridDefs2027") && OWNED_KEYS.includes("grid2027done"));
  const old = normalize({ grid: { done: { "1.1": true } } }, "2026-10-28");
  assert.deepEqual(old.gridDefs2027, { cur: null, hist: [], draft: null });
  assert.deepEqual(old.grid2027done, {});
  assert.deepEqual(old.grid.done, { "1.1": true });
  const st = normalize({ grid2027done: { "2.3": true, "9.9": true, "1.1": "yes" } }, "2026-10-28");
  assert.deepEqual(st.grid2027done, { "2.3": true }, "only well-formed ticks are kept");
  const { copyChart, chartOf, emptyGrid } = await import("../src/lib/court/harada.ts");
  const g26 = emptyGrid(); g26.goal = "Calm 2026"; g26.pillars[0].name = "Health";
  const gd = copyChart({ cur: null, hist: [], draft: null }, g26);
  assert.equal(chartOf(null, gd).goal, "Calm 2026");
  gd.cur.goal = "Calm 2027";
  assert.equal(g26.goal, "Calm 2026", "copying never changes 2026");
  const g = src("components/court/pages/GridChart.tsx");
  assert.match(g, /d\.grid2027done = x; \}, \["grid2027done"\]\)/, "2027 ticks write only grid2027done");
  assert.match(g, /\["chart", "Chart 2026"\], \["c2027", "Chart 2027"\], \["targets", "Weekly targets"\]/);
});

test("loans: the USD 9,000 entry is removed (restorable), SGD loans come to S$40,000, edits keep history", async () => {
  const { loanFix, loanMath } = await import("../src/lib/court/finance.ts");
  assert.deepEqual(loanFix([{ id: "a", name: "Loan USD", lent: 9000 }]), { remove: ["a"], amend: null, add: { name: "Loans owed to me (SGD)", lent: 40000 } });
  assert.deepEqual(loanFix([{ id: "a", name: "Friend", lent: 9000 }, { id: "b", name: "Family", lent: 25000 }]), { remove: ["a"], amend: { id: "b", from: 25000 }, add: null });
  assert.deepEqual(loanFix([{ id: "b", name: "Family", lent: 40000 }]).add, null);
  assert.deepEqual(loanFix([{ id: "a", name: "Old", lent: 9000, deleted: true }, { id: "b", name: "Family", lent: 40000 }]), { remove: [], amend: null, add: null }, "a removed loan stays removed, nothing else changes");
  assert.equal(loanMath({ lent: 40000, repaid: [], off: 0 }).expected, 40000);
  const f = src("components/court/live/FinanceTracker.tsx");
  assert.match(f, /v\.put\(\{ id: l\.id, deleted: false \} as Partial<Row>\); log\("loan\." \+ l\.id, `Restored loan/, "Restore brings a removed loan back");
  assert.match(f, /v\.put\(\{ kind: "fix", key: "r10-loans" \}/, "the one-time change runs once");
  const { cleanRows } = await import("../src/lib/vault.ts");
  assert.equal(cleanRows("finance_entries", [{ id: "l", kind: "loan", name: "x", lent: 1, deleted: true }])[0].deleted, true);
});

test("leverage: notional, margin, liquidation estimate and the warning before the stop", async () => {
  const { leverageCalc, levCheck } = await import("../src/components/court/pages/TradesPage.tsx");
  const r = leverageCalc("long", 1000, 1, 100, 95, 115, 5);
  assert.equal(r.size, 2); assert.equal(r.notional, 200); assert.equal(r.margin, 40); assert.equal(r.liq, 80); assert.equal(r.liqFirst, false);
  const risky = leverageCalc("long", 1000, 1, 100, 85, null, 10);
  assert.equal(risky.liq, 90); assert.equal(risky.liqFirst, true, "liquidation at 90 comes before the stop at 85");
  const short = leverageCalc("short", 1000, 1, 100, 105, 90, 20);
  assert.equal(short.liq, 105); assert.equal(short.liqFirst, true);
  assert.equal(leverageCalc("long", 1000, 1, 100, 95, null, 1).liq, null, "no leverage, no liquidation");
  assert.equal(levCheck(""), null); assert.equal(levCheck("0.5"), "Enter leverage from 1 to 200 (1 means none).");
  assert.match(src("components/court/pages/TradesPage.tsx"), /Approximate; fees and maintenance margin not included\./);
});

test("Today's briefing: no two items are the same story, across all items, with a why line", async () => {
  const { briefing, sameStory } = await import("../src/lib/court/briefing.ts");
  const c = (title, source, score, group = "Crypto") => ({ lead: { title, source, group, at: "2026-10-28T01:00:00Z", link: "https://x/" + encodeURIComponent(source + title), tier: "media" }, items: [{ title, source, group, at: "2026-10-28T01:00:00Z", link: "https://x/" + encodeURIComponent(source + title), tier: "media" }], sources: 1, independent: 1, syndicated: false, score, why: score > 80 ? ["mentions BTC on your watchlist +20"] : [] });
  const list = [c("Bitcoin rebounds above $60,000", "CoinDesk", 90), c("BTC bounces back to 60K", "The Block", 85), c("Bitcoin rebounds as traders return", "Decrypt", 70),
    c("Bitcoin drops below $58,000", "Reuters", 65), c("Fed holds rates steady", "AP", 60, "Macro"), c("FOMC keeps rates unchanged", "CNBC", 55, "Macro"), c("ECB holds rates", "FT", 50, "Macro"), c("Solana ETF filing", "Bloomberg", 45)];
  const b = briefing(list, ["any"]);
  for (let i = 0; i < b.stories.length; i++) for (let j = i + 1; j < b.stories.length; j++) assert.ok(!sameStory(b.stories[i].title, b.stories[j].title), `${b.stories[i].title} / ${b.stories[j].title}`);
  assert.deepEqual(b.stories.map((s) => s.title), ["Bitcoin rebounds above $60,000", "Bitcoin drops below $58,000", "Fed holds rates steady", "ECB holds rates", "Solana ETF filing"]);
  assert.deepEqual(b.stories[0].also.sort(), ["Decrypt", "The Block"]);
  assert.equal(b.stories[0].why, "score 90 · 3 sources · mentions BTC on your watchlist +20");
  assert.ok(!sameStory("Bitcoin rebounds", "Bitcoin drops"), "same asset, opposite direction");
});

test("Today to-dos carry over across a day boundary; done ones clear after their day and stay as history", async () => {
  const { todayTodos } = await import("../src/lib/court/todo.ts");
  const rows = [
    { id: "a", title: "Call bank", todo: true, day: "2026-10-27", done: false },
    { id: "b", title: "Water plants", todo: true, day: "2026-10-27", done: true, doneOn: "2026-10-27" },
    { id: "c", title: "Book dentist", todo: true, day: "2026-10-28", done: false },
    { id: "d", title: "Pay rent", todo: true, day: "2026-10-28", done: true, doneOn: "2026-10-28" },
    { id: "t", title: "A Life Hub task", due: "2026-10-28" },
  ];
  const day1 = todayTodos(rows, "2026-10-27");
  assert.deepEqual(day1.open.map((x) => [x.id, x.from]), [["a", null], ["c", null]]);
  const day2 = todayTodos(rows, "2026-10-28");
  assert.deepEqual(day2.open.map((x) => [x.id, x.from]), [["a", "2026-10-27"], ["c", null]], "yesterday's unfinished item carries over");
  assert.deepEqual(day2.done.map((x) => x.id), ["d"], "yesterday's done item clears");
  assert.equal(day2.history, 1, "and stays in the table as history");
  const { dueSoon } = await import("../src/lib/court/vaultDue.ts");
  assert.deepEqual(dueSoon([{ id: "x", title: "todo", todo: true, due: "2026-10-28" }], [], "2026-10-28"), [], "to-dos stay off Needs you now");
});

test("quotes rotate: never the same one twice in a row, none repeated until all have had a turn", async () => {
  const { nextQuote } = await import("../src/lib/court/quotes.ts");
  let seen = [], last = null, r = 0.37;
  const rnd = () => (r = (r * 9301 + 49297) % 233280 / 233280);
  const shown = [];
  for (let n = 0; n < 12; n++) { const x = nextQuote(5, seen, last, rnd); shown.push(x.i); seen = x.seen; last = x.i; }
  for (let i = 1; i < shown.length; i++) assert.notEqual(shown[i], shown[i - 1], "no immediate repeat");
  assert.deepEqual([...shown.slice(0, 5)].sort(), [0, 1, 2, 3, 4], "the first five are all different");
  assert.deepEqual([...shown.slice(5, 10)].sort(), [0, 1, 2, 3, 4], "then the library starts again");
  assert.match(src("components/court/live/LivingWorld.tsx"), /window\.setInterval\(turn, 4 \* 60e3\)/);
  assert.match(src("components/kumo/world/layout.ts"), /\[kumo\.x \+ kumo\.w \* 0\.5 - 18, kumo\.y - 14 - bh\]/, "the bubble rises from Kumo");
});

test("the garden grows on real activity this week, and past catalyst dates are flagged", async () => {
  const { gardenStage } = await import("../src/lib/court/habits.ts");
  assert.deepEqual([0, 1, 4, 5, 11, 12, 19, 20, 60].map(gardenStage), [0, 1, 1, 2, 2, 3, 3, 4, 4]);
  const { pastDates } = await import("../src/components/court/pages/TradesPage.tsx");
  assert.deepEqual(pastDates("Unlock 12 Oct · FOMC Nov 5 · listing 2026-10-30 · old 2026-09-01", "2026-10-28").sort(), ["2026-09-01", "2026-10-12"]);
});
