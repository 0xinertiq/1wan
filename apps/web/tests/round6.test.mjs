// Round 6 checks: due tasks and routines, the size calculator and stats maths, and the astro rule on the Calendar.
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { CourtCtx } from "../src/components/court/CourtState.tsx";
import { normalize } from "../src/lib/court/state.ts";
import { dueSoon, routineNext } from "../src/lib/court/vaultDue.ts";
import { sizeCalc, perf } from "../src/components/court/pages/TradesPage.tsx";
import { CalendarPage } from "../src/components/court/pages/CalendarPage.tsx";
import { CalendarTab } from "../src/components/court/live/CalendarTab.tsx";

const K = "2026-10-28", h = React.createElement;
const ctx = (events) => ({ st: normalize({}, K), k: K, nm: 600, recap: null, clearRecap() {}, update() {}, levelUp() {}, save: "idle", events, cal: { state: "live", cals: [] }, setCalendar() {}, prices: null, setPrices() {}, pxBusy: false, setPxBusy() {}, sheet: null, openSheet() {} });

test("tasks and routines due within 3 days, overdue first, done and paused left out", () => {
  const tasks = [{ id: "a", title: "Renew passport", due: "2026-10-30" }, { id: "b", title: "Done one", due: K, done: true }, { id: "c", title: "Late", due: "2026-10-20", pri: "high" }, { id: "d", title: "Later", due: "2026-11-20" }];
  const routines = [{ id: "r", name: "Dog grooming", every: 30, last: "2026-10-01" }, { id: "p", name: "Paused", every: 1, paused: true }];
  assert.equal(routineNext(routines[0], K), "2026-10-31");
  assert.deepEqual(dueSoon(tasks, routines, K).map((x) => x.name), ["Late", "Renew passport", "Dog grooming"]);
});

test("position size: risk ÷ stop distance, R:R only when the target is on the right side", () => {
  const r = sizeCalc(10000, 1, 100, 95, 115);
  assert.equal(r.risk, 100); assert.equal(r.size, 20); assert.equal(r.rr, 3);
  assert.equal(sizeCalc(10000, 1, 100, 95, 90).rr, null);
  assert.equal(sizeCalc(0, 1, 100, 95), null);
  assert.equal(sizeCalc(1000, 1, 100, 100), null);
});

test("performance stats from closed trades only", () => {
  const t = (id, entry, stop, exit, setup) => ({ id, entry, stop, exit, setup, dir: "long", date: "2026-10-0" + id });
  const p = perf([t("1", 100, 90, 120, "Pullback"), t("2", 100, 90, 95, "Pullback"), t("3", 100, 90, 110, "Breakout"), { id: "4", entry: 1, stop: 0.9 }]);
  assert.equal(p.n, 3);
  assert.ok(Math.abs(p.winRate - 2 / 3) < 1e-9);
  assert.equal(p.best, 2); assert.equal(p.worst, -0.5);
  assert.deepEqual(p.bySetup.map((g) => g.g).sort(), ["Breakout", "Pullback"]);
});

test("no astro event or sky layer can appear anywhere on the Calendar tab", () => {
  const events = [
    { id: "a", title: "Moon trine Venus", cal: "Astro calendar", color: "#ccf", allDay: true, sk: K, ek: "2026-10-29", desc: "DO: rest" },
    { id: "b", title: "Dentist", cal: "Personal", color: "#f9c", allDay: false, sk: K, ek: K, sm: 600, em: 660 },
  ];
  const html = renderToString(h(CourtCtx.Provider, { value: ctx(events) }, h(CalendarPage, { main: h(CalendarTab, { noWeek: true }), econ: null, momo: null })));
  assert.ok(!/Moon trine|Astro calendar|Luna&#x27;s sky|Luna's sky/i.test(html), "astro text found on the Calendar");
  assert.ok(/Calendar/.test(html));
});

test("finance CSV: dated rows only, spending and income told apart", async () => {
  const { parseCsv } = await import("../src/components/court/pages/LifeHub.tsx");
  const rows = parseCsv("date,amount,category,note\n2026-10-01,-12.5,food,lunch\n2026-10-02,3000,income,salary\nbad,1,food\n2026-10-03,9,weird,x");
  assert.deepEqual(rows.map((r) => [r.cat, r.type, r.amt]), [["food", "out", 12.5], ["income", "in", 3000], ["other", "out", 9]]);
});

test("Dungeon weekly look-back is rule-based: pages, moods, tags, wins, quests", async () => {
  const { lookBack } = await import("../src/components/court/pages/Dungeon.tsx");
  const e = (day, text, mood, tags = []) => ({ id: "j" + day, day, text, mood, tags, notes: [], at: "", up: "" });
  // 2026-10-28 is a Wednesday; the week starts Monday 26 Oct
  const L = lookBack([e("2026-10-26", "a", 4, ["calm"]), e("2026-10-27", "", 2, ["calm", "work"]), e("2026-10-20", "old", 5)], { "2026-10-28": { w: "a win" } }, { "2026-10-28": { m: 3 } }, "2026-10-28", 4, { "2026-10-26": { d: 3, t: 5 } });
  assert.equal(L.days, 3); assert.equal(L.written, 3); assert.equal(L.avgMood, 3);
  assert.deepEqual(L.topTags, ["calm", "work"]); assert.equal(L.winsDays, 1); assert.equal(L.quests, 3);
});

test("Garden: own habits counted on scheduled days only; quests and XP untouched", async () => {
  const { habitWeek } = await import("../src/components/court/pages/GardenPage.tsx");
  const st = { hab: { list: [{ id: "h1", name: "Stretch", days: [1, 2, 3], at: "" }, { id: "h2", name: "Paused", days: [1], paused: true, at: "" }], log: { "2026-10-26": ["h1"], "2026-10-27": ["h1", "gone"] } }, swins: { log: { "2026-10-26": ["d1", "d6"] } } };
  assert.deepEqual(habitWeek(st, "2026-10-28"), { days: 3, planned: 3, done: 2, anchors: 2 });
});

test("Small Wins ladder in the Garden keeps its ids and auto items", async () => {
  const React = (await import("react")).default;
  const { renderToString } = await import("react-dom/server");
  const { WinsLadder } = await import("../src/components/court/pages/GardenPage.tsx");
  const st = normalize({ defs: { swins: { phases: [{ id: "p1", title: "Phase 1", when: "Nov", why: "w", items: [["b3", "No late-night trades", "14 days"], ["b6", "Tea", "14 days"], ["a3", "Rules", "x"]] }] } }, swins: { done: { a3: true } } }, K);
  const html = renderToString(React.createElement(CourtCtx.Provider, { value: { ...ctx([]), st } }, React.createElement(WinsLadder)));
  assert.match(html, /auto: 0 of 14 days in a row from your d6 ticks/);
  assert.match(html, /self-report/);
  assert.match(html.replace(/<!-- -->/g, ""), /1 \/ 3 milestones/);
});

test("Saved and research follows the market lens; macro notes stay on the Macro desk", async () => {
  const { forLens } = await import("../src/components/court/pages/NewsPage.tsx");
  const n = (id, lens, kind = "note") => ({ id, kind, lens, title: id, text: "", tags: [], at: "", up: "" });
  const rows = [n("a", "trading"), n("b", "local"), n("c", undefined), n("m", "trading", "macro")];
  assert.deepEqual(forLens(rows, "trading").map((r) => r.id), ["a", "c"]);
  assert.deepEqual(forLens(rows, "local").map((r) => r.id), ["b"]);
  assert.deepEqual(forLens(rows, "any").map((r) => r.id), ["a", "b", "c"]);
  assert.deepEqual(forLens(rows, "off"), []);
});
