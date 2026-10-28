// Round 7 checks: no astrology on the Calendar, one source for her habits, alert rules (with the Sunday review),
// the multi-select market lens, the size calculator's plain checks, and that hiding cards deletes nothing.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { CourtCtx } from "../src/components/court/CourtState.tsx";
import { normalize, OWNED_KEYS, normLenses } from "../src/lib/court/state.ts";
import { CalendarPage } from "../src/components/court/pages/CalendarPage.tsx";
import { CalendarTab } from "../src/components/court/live/CalendarTab.tsx";
import { HAB_PREFIX, habitPhase, habitQuests } from "../src/lib/court/habits.ts";
import { buildAlerts, showing } from "../src/lib/court/alerts.ts";
import { briefTabs, headlineShown, toggleLens } from "../src/lib/court/lenses.ts";
import { sizeCheck, sizeCalc } from "../src/components/court/pages/TradesPage.tsx";

const K = "2026-10-28", h = React.createElement;   // a Wednesday
const ctx = (events, st = normalize({}, K)) => ({ st, k: K, nm: 600, recap: null, clearRecap() {}, update() {}, levelUp() {}, save: "idle", events, cal: { state: "live", cals: [] }, setCalendar() {}, prices: null, setPrices() {}, pxBusy: false, setPxBusy() {}, sheet: null, openSheet() {} });
const strip = (s) => s.replace(/<!-- -->/g, "");

test("Calendar tab: no astro, moon or astrology item, chip or note, and Momo's day card is gone", () => {
  const events = [
    { id: "a", title: "Moon trine Venus", cal: "Astro calendar", color: "#ccf", allDay: true, sk: K, ek: "2026-10-29", desc: "DO: rest" },
    { id: "m", title: "Full Moon in Taurus", cal: "Luna", color: "#ccf", allDay: true, sk: K, ek: "2026-10-29", desc: "astro" },
    { id: "b", title: "Dentist", cal: "Personal", color: "#f9c", allDay: false, sk: K, ek: K, sm: 600, em: 660 },
  ];
  const html = strip(renderToString(h(CourtCtx.Provider, { value: ctx(events) }, h(CalendarPage, { main: h(CalendarTab, { noWeek: true }), econ: null }))));
  assert.ok(!/astro|moon|astrolog|luna/i.test(html), "astro text found on the Calendar tab");
  assert.ok(!/Momo, your day/.test(html));
  assert.match(html, /Dentist/);
  assert.match(html, /clock tower/i, "the pilot room banner is on the Calendar");
});

test("a habit added in My habits shows in Quests and once in the Wins ladder, with her ids unchanged", () => {
  const hab = { list: [{ id: "h1", name: "Stretch", days: [0, 1, 2, 3, 4, 5, 6], at: "" }, { id: "h1", name: "Stretch copy", days: [3], at: "" }, { id: "h2", name: "Paused", days: [3], paused: true, at: "" }], log: { "2026-10-26": ["h1"] } };
  assert.deepEqual(habitQuests(hab, K), [{ id: "h1", name: "Stretch", done: false }]);
  const mine = habitPhase(hab, K);
  assert.deepEqual(mine.phase.items.map((i) => i[0]), [HAB_PREFIX + "h1"], "one ladder item per habit, paused left out");
  assert.deepEqual(mine.done, { [HAB_PREFIX + "h1"]: true }, "ticked on Monday counts for the week");
  assert.equal(habitPhase({ list: [], log: {} }, K), null);
});

test("Wins ladder: Small Wins ids and ticks unchanged, her habits appended once", async () => {
  const { WinsLadder } = await import("../src/components/court/pages/GardenPage.tsx");
  const raw = { defs: { swins: { phases: [{ id: "p1", title: "Phase 1", when: "Nov", why: "w", items: [["b3", "No late-night trades", "14 days"], ["a3", "Rules", "x"]] }] } }, swins: { done: { a3: true } },
    hab: { list: [{ id: "h9", name: "Ten minutes of stretching", days: [3], at: "" }], log: { [K]: ["h9"] } } };
  const st = normalize(raw, K);
  const html = strip(renderToString(h(CourtCtx.Provider, { value: { ...ctx([]), st } }, h(WinsLadder))));
  assert.equal(html.split("Ten minutes of stretching").length - 1, 1);
  assert.match(html, /2 \/ 3 milestones/);
  assert.deepEqual(st.swins.done, { a3: true }, "her Small Wins ticks are not rewritten");
  assert.deepEqual(st.defs.swins.phases[0].items.map((i) => i[0]), ["b3", "a3"]);
});

test("alerts: one agent per rule, the calm morning summary, explicit offs, and Dismiss / Later", () => {
  const base = { k: K, hour: 8, briefs: [{ key: "intel", label: "Intelligence", at: "2026-10-27T23:52:00Z" }, { key: "pulse", label: "Pulse", at: "2026-10-27T23:27:00Z" }],
    releases: [{ at: "2026-10-29T18:00:00Z", name: "FOMC decision" }], due: [{ id: "t1", name: "Renew passport", dd: 0, kind: "task" }, { id: "r1", name: "Dog grooming", dd: 2, kind: "routine" }],
    habits: [{ id: "h1", name: "Stretch" }], needs: [{ id: "ev1", t: "Dentist" }], review: { at: "2026-10-25T00:50:00Z", unread: true }, on: () => true };
  const am = buildAlerts(base);
  assert.deepEqual(am.map((a) => a.agent), ["momo", "olli", "coco", "kumo"], "morning: Momo's one summary speaks for the briefs; no habit nudge before 17:00");
  assert.match(am[0].text, /^Good morning\. 2 new briefs: Intelligence and Pulse\.$/);
  assert.equal(am[2].go, "calendar"); assert.match(am[2].text, /Renew passport/); assert.ok(!/Dog grooming/.test(am[2].text), "only due today or overdue");
  const pm = buildAlerts({ ...base, hour: 18 });
  assert.deepEqual(pm.map((a) => a.agent), ["pip", "pip", "olli", "coco", "momo", "kumo"]);
  assert.equal(new Set(pm.map((a) => a.id)).size, pm.length);
  assert.deepEqual(buildAlerts({ ...base, hour: 18, on: (id) => id !== "briefs" && id !== "habits" }).map((a) => a.agent), ["olli", "coco", "kumo"]);
  const later = { [am[1].id]: Date.parse("2026-10-28T03:00:00Z") };
  assert.deepEqual(showing(am, [am[0].id], later, Date.parse("2026-10-28T01:00:00Z")).map((a) => a.agent), ["coco", "kumo"]);
  assert.deepEqual(showing(am, [am[0].id], later, Date.parse("2026-10-28T04:00:00Z")).map((a) => a.agent), ["olli", "coco", "kumo"], "Later comes back");
});

test("Kumo's Sunday alert opens the weekly review card in Settings", async () => {
  const sun = "2026-11-01";
  const x = { k: sun, hour: 9, briefs: [], releases: [], due: [], habits: [], needs: [], review: { at: "2026-11-01T00:50:00Z", unread: true }, on: () => true };
  const a = buildAlerts(x);
  assert.deepEqual(a.map((y) => [y.agent, y.go]), [["kumo", "review-card"]]);
  assert.deepEqual(buildAlerts({ ...x, k: K }), [], "not on a weekday");
  const { resolveHash } = await import("../src/components/court/AppTabs.tsx");
  assert.deepEqual(resolveHash("review-card"), { tab: "settings", rewrite: false });
  assert.deepEqual(resolveHash("needWin"), { tab: "court", rewrite: false });
  assert.deepEqual(resolveHash("inbox"), { tab: "court", rewrite: true }, "the retired Notifications tab opens the Court");
});

test("market lens: several at once, saved under its own key, Any and Off stand alone, old single lens carried over", () => {
  assert.ok(OWNED_KEYS.includes("lenses"));
  const st = normalize({ lenses: ["tech", "crypto", "weird", "crypto"] }, K);
  assert.deepEqual(st.lenses, ["crypto", "tech"]);
  assert.deepEqual(normalize(JSON.parse(JSON.stringify(st)), K).lenses, ["crypto", "tech"], "persists through a save and reload");
  assert.deepEqual(normalize({}, K).lenses, ["crypto", "macro", "markets"], "older documents: trading by default");
  assert.deepEqual(normalize({ prefs: { lens: "local" } }, K).lenses, ["local"]);
  assert.deepEqual(normLenses(["crypto", "off"]), ["off"]);
  assert.deepEqual(toggleLens(["crypto"], "tech"), ["crypto", "tech"]);
  assert.deepEqual(toggleLens(["crypto"], "crypto"), ["crypto"], "never leaves nothing chosen");
  assert.deepEqual(toggleLens(["crypto", "tech"], "any"), ["any"]);
  assert.deepEqual(toggleLens(["any"], "world"), ["world"]);
  assert.ok(headlineShown("Tech", ["tech"]) && !headlineShown("Crypto", ["tech"]) && headlineShown("Telegram", ["tech"]) && !headlineShown("World", ["off"]));
  assert.deepEqual(briefTabs(["tech"]), ["pulse"]);
  assert.deepEqual(briefTabs(["crypto", "world"]), ["intel"]);
  assert.deepEqual(briefTabs(["off"]), []);
});

test("size calculator: plain messages for a wrong-side stop or a negative price, then the numbers", () => {
  assert.equal(sizeCheck("long", 10000, 1, 100, 105), "Enter a stop below your entry for a long.");
  assert.equal(sizeCheck("short", 10000, 1, 100, 95), "Enter a stop above your entry for a short.");
  assert.equal(sizeCheck("long", 10000, 1, -5, 95), "Enter an entry price above zero.");
  assert.equal(sizeCheck("long", 10000, 1, 100, -1), "Enter a stop price above zero.");
  assert.equal(sizeCheck("long", 0, 1, 100, 95), "Enter your equity, above zero.");
  assert.match(sizeCheck("long", 10000, 1, 100, 95, 90), /target above your entry/);
  assert.equal(sizeCheck("long", 10000, 1, 100, 95, 115), null);
  assert.equal(sizeCheck("short", 10000, 1, 100, 105, null), null);
  const r = sizeCalc(10000, 1, 100, 105, 85);
  assert.equal(r.size, 20); assert.equal(r.rr, 3);
});

test("hiding cards deletes nothing: tables, export, stored choices and the late-night flag stay", async () => {
  const { TABLES } = await import("../src/lib/vault.ts");
  for (const t of ["goals", "research_notes", "journal_entries", "finance_entries", "longterm_watchlist", "tasks", "routines"]) assert.ok(TABLES.includes(t), t);
  const exp = fs.readFileSync(path.resolve(import.meta.dirname, "../src/app/api/export/route.ts"), "utf8");
  for (const t of ["goals", "research_notes"]) assert.ok(exp.includes(t), "export still includes " + t);
  const st = normalize({ prefs: { notif: { briefs: true, habits: false } }, lines: [{ id: "l1", sym: "BTC", tf: "4h", kind: "level", p1: { t: 1, p: 60000 }, label: "mine" }] }, K);
  assert.deepEqual(st.prefs.notif, { briefs: true, habits: false }, "notification choices kept after the card was removed");
  assert.equal(st.lines.length, 1, "her chart lines are kept after the chart button was removed");
  const { lateNight } = await import("../src/components/court/live/TradeLive.tsx");
  assert.equal(typeof lateNight, "function");
  const pages = ["LifeHub.tsx", "NewsPage.tsx", "TradesPage.tsx", "SettingsPage.tsx"].map((f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src/components/court/pages", f), "utf8")).join("\n");
  assert.ok(!/useVault<[^>]*>\("goals"\)[\s\S]{0,200}remove|dropSaved\(|localStorage\.removeItem/.test(pages), "no page clears records");
});

test("the Calendar's sky filter hides sky phrasing only, never a real event that shares a word", async () => {
  const { isSkyItem, isAstro } = await import("../src/lib/court/state.ts");
  for (const t of ["Full Moon in Taurus", "Mercury retrograde", "Venus trine Jupiter", "Sun enters Scorpio"]) assert.ok(isSkyItem({ cal: "Personal", t }), t);
  for (const t of ["Cancer screening", "Mars bar run", "Dentist", "Honeymoon planning"]) assert.ok(!isSkyItem({ cal: "Personal", t }), t);
  assert.ok(isAstro({ cal: "Astro calendar" }) && !isAstro({ cal: "Luna" }), "isAstro itself is unchanged");
});
