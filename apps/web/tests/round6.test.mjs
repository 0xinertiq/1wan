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
