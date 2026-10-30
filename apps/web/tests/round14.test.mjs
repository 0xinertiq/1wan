// Round 14: the Daily anchors target follows what is shown and scheduled, four branch states, three more room
// banners on the shared frame, and no banner on Settings or Kingdom Mode.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { CourtCtx } from "../src/components/court/CourtState.tsx";
import { normalize } from "../src/lib/court/state.ts";
import { anchorCount, normGardenEdit } from "../src/lib/court/gardenEdit.ts";
import { branchProgress } from "../src/lib/court/branchChart.ts";

const K = "2026-10-28", h = React.createElement;   // a Wednesday
const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");
const ctx = (st) => ({ st, k: K, nm: 600, recap: null, clearRecap() {}, update() {}, levelUp() {}, save: "idle", events: [], cal: { state: "live", cals: [] }, setCalendar() {}, prices: null, setPrices() {}, pxBusy: false, setPxBusy() {}, sheet: null, openSheet() {} });
const EIGHT = Array.from({ length: 8 }, (_, i) => ["d" + (i + 1), "Anchor " + (i + 1), ""]);

test("Daily anchors: the target is the anchors shown and scheduled today", () => {
  assert.deepEqual(anchorCount(EIGHT, normGardenEdit(undefined), 3, ["d1", "d2"]), { target: 8, done: 2 }, "nothing edited: 8, as before");
  const hid = normGardenEdit({ anchors: { hidden: ["d8"] } });
  assert.deepEqual(anchorCount(EIGHT, hid, 3, ["d1", "d2", "d3", "d4", "d5", "d6", "d7", "d8"]), { target: 7, done: 7 }, "hiding one makes it 7/7; the hidden tick is kept, not counted");
  const wk = normGardenEdit({ anchors: { meta: { d1: { freq: "weekdays" }, d2: { freq: "custom", days: [3] } } } });
  assert.equal(anchorCount(EIGHT, wk, 0, []).target, 6, "Sunday: the weekday and Wednesday-only anchors are not due");
  assert.equal(anchorCount(EIGHT, wk, 3, []).target, 8);
  const mine = normGardenEdit({ anchors: { mine: [{ id: "ma-1", t: "Mine" }] } });
  assert.equal(anchorCount(EIGHT, mine, 3, ["ma-1"]).target, 8, "her own anchors never count");
  // only the count changed: finishing still goes through logQuest; the XP, quest and tails rules are untouched
  const g = src("components/court/live/GrowLive.tsx");
  assert.match(g, /if \(c\.target > 0 && c\.done >= c\.target\) \{ d\.q\.k1 = \[0, goal - 1\]; const r = logQuest\(d, "k1"\);/);
  for (const f of ["lib/court/actions.ts", "lib/court/quests.ts", "lib/court/tails.ts"]) assert.ok(!/anchorCount|gedit/.test(src(f)), f + " unchanged");
  assert.match(src("lib/court/quests.ts"), /id: "k1".*goal: 8/, "the quest definition is unchanged");
  // the quest card shows the live count, a day with nothing due says so, and lowering the target finishes it now
  assert.match(g, /p = live \? k1\.done : progOf\(st, q\.id\), goal = live \? k1\.target : q\.goal/);
  assert.match(g, /"No anchors are due today\."/);
  assert.match(g, /aCount\.target > 0 && aCount\.done >= aCount\.target && !isDone\(st, "k1"\)/);
});

test("branch progress: grey never started, faint tint quiet, green active, gold edge done", () => {
  assert.deepEqual(branchProgress({ blossoms: 0, last: null }, K), { state: "idle", share: 0 });
  assert.deepEqual(branchProgress({ blossoms: 0, last: "2026-10-01" }, K), { state: "idle", share: 0 }, "old activity, no cells: grey");
  assert.deepEqual(branchProgress({ blossoms: 3, last: "2026-10-01" }, K), { state: "quiet", share: 0.375 }, "cells done, quiet this week");
  assert.deepEqual(branchProgress({ blossoms: 3, last: null }, K), { state: "quiet", share: 0.375 });
  assert.deepEqual(branchProgress({ blossoms: 0, last: "2026-10-26" }, K), { state: "active", share: 0 }, "activity this week");
  assert.deepEqual(branchProgress({ blossoms: 8, last: "2026-10-01" }, K), { state: "done", share: 1 });
  const css = src("app/(court)/kumo-new.css");
  for (const s of ["idle", "quiet", "active", "done"]) assert.match(css, new RegExp(`\\.gk\\[data-bp="${s}"\\]\\{`), s + " has its own background");
});

test("Life Hub, Trades and News banners: the shared room frame and size, the agent already tied to each tab", async () => {
  const rooms = await import("../src/components/kumo/decor/MoreRooms.tsx");
  const clock = renderToString(h((await import("../src/components/kumo/decor/ClockRoom.tsx")).ClockRoom));
  const box = (html) => html.match(/class="kroom ph-day[^"]*"/)?.[0].replace(/ kroom-[a-z]+(?=")/, "");
  for (const [name, id, who, page, file] of [["LifeRoom", "life", "coco", "LifeRoom", "LifeHub.tsx"], ["TradesRoom", "trades", "fenn", "TradesRoom", "TradesPage.tsx"], ["NewsRoom", "news", "pip", "NewsRoom", "NewsPage.tsx"]]) {
    const html = renderToString(h(rooms[name]));
    assert.equal(box(html), box(clock), name + " uses the same .kroom box as the Calendar banner");
    assert.match(html, /viewBox="0 0 400 60"/, name + " is on the same 400 x 60 grid");
    assert.match(html, new RegExp(`class="kroom ph-day kroom-${id}"`));
    assert.match(html, new RegExp(`data-who="${who}"`), name + " shows " + who);
    assert.match(src("components/court/pages/" + file), new RegExp(`<PageHead room=\\{<${page} />\\}`));
  }
  // no room changes the shared size: per-room CSS only places the agent
  const css = src("app/(court)/kumo-new.css");
  for (const id of ["life", "trades", "news"]) for (const rule of css.match(new RegExp(`\\.kroom-${id}[^{]*\\{[^}]*\\}`, "g")) ?? []) assert.match(rule, /^\.kroom-[a-z]+ \.kroom-agent\{left:[\d.]+%\}$/, rule);
  // one gold accent per room, in the new art file
  const art = await import("../src/components/kumo/decor/moreRoomsArt.ts");
  const gold = (keys) => keys.reduce((n, k) => n + art[k].join("").split("g").length - 1, 0);
  assert.equal(gold(["plannerDesk", "pottedPlant", "armchair"]) > 0 && gold(["pottedPlant", "armchair"]), 0, "Life: the planner ribbon only");
  assert.equal(gold(["chartDesk"]), 0); assert.ok(gold(["tickerBoard"]) > 0, "Trades: the ticker arrow only");
  assert.equal(gold(["wirePrinter", "newsDesk"]), 0); assert.equal(gold(["pinboard"]), 1, "News: one gold pin");
  for (const [k, s] of Object.entries(art)) assert.ok(s.every((r) => r.length === s[0].length), k + " rows are one width");
});

test("Settings and Kingdom Mode render no banner; their title and content stay", async () => {
  const st = normalize({}, K);
  const { KingdomPage } = await import("../src/components/court/pages/Welcome.tsx");
  const kh = renderToString(h(CourtCtx.Provider, { value: ctx(st) }, h(KingdomPage, { world: h("div", { id: "world-here" }) })));
  assert.ok(!/class="kscene|class="kroom/.test(kh), "no banner in Kingdom Mode");
  assert.match(kh, /Kingdom Mode/); assert.match(kh, /id="world-here"/); assert.match(kh, /What can live in your kingdom/);
  const s = src("components/court/pages/SettingsPage.tsx");
  assert.match(s, /<PageHead title="Settings" sub=/, "Settings keeps its title, with no scene or room");
  assert.ok(!/<PageHead[^>]*(scene|room)=/.test(s));
  // the scene art and its files are kept
  assert.match(src("components/kumo/decor/scenes.ts"), /castle:/);
});
