// Round 11 checks: the Gratitude log (saves, lists, edits, exports), no "Count your wins" left, a news chip opens
// every headline in it, Settings' Sign out uses the existing sign-out route, and no agent tag on the Trade log.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { CourtCtx } from "../src/components/court/CourtState.tsx";
import { normalize } from "../src/lib/court/state.ts";

const K = "2026-10-28", h = React.createElement;
const root = path.resolve(import.meta.dirname, "../src");
const src = (f) => fs.readFileSync(path.join(root, f), "utf8");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const ctx = (st, update = () => {}) => ({ st, k: K, nm: 600, recap: null, clearRecap() {}, update, levelUp() {}, save: "idle", events: [], cal: { state: "live", cals: [] }, setCalendar() {}, prices: null, setPrices() {}, pxBusy: false, setPxBusy() {}, sheet: null, openSheet() {} });

test("Gratitude: entries save under the existing key, list newest first, edit in place, and export", async () => {
  const { gratitudeLog } = await import("../src/components/court/pages/Dungeon.tsx");
  const st = normalize({ wins: { "2026-10-26": { w: "Walked", g: "Mum" }, "2026-10-28": { w: "Shipped", g: "Tea", n: "calm" }, "2026-10-27": {}, bad: { w: "x" } } }, K);
  assert.deepEqual(gratitudeLog(st.wins).map((x) => x.day), ["2026-10-28", "2026-10-26"], "newest first, empty days left out");
  assert.deepEqual(gratitudeLog(st.wins)[0], { day: "2026-10-28", w: "Shipped", g: "Tea", s: "", n: "calm" });
  const { DungeonPage } = await import("../src/components/court/pages/Dungeon.tsx");
  const html = renderToString(h(CourtCtx.Provider, { value: ctx(st) }, h(DungeonPage))).replace(/<!-- -->/g, "");
  assert.match(html, /Gratitude log/);
  const log = html.slice(html.indexOf("Gratitude log"));
  assert.ok(log.indexOf("Wed 28 Oct") > 0 && log.indexOf("Wed 28 Oct") < log.indexOf("Mon 26 Oct"), "newest first on the page");
  const d = src("components/court/pages/Dungeon.tsx");
  assert.match(d, /update\(\(d\) => \{ d\.wins = \{ \.\.\.d\.wins, \[f\.day\]: \{ \.\.\.d\.wins\[f\.day\], w: f\.w\.slice\(0, 2000\), g: f\.g\.slice\(0, 2000\), s: f\.s\.slice\(0, 300\), n: f\.n\.slice\(0, 6000\) \} \}; \}, \["wins"\]\)/, "an edit writes only the words, under the same key");
  assert.ok(!/logQuest|levelUp|d\.xp|d\.streak/.test(d.slice(d.indexOf("function GratitudeLog"), d.indexOf("export function WeeklyLookBack"))), "editing never touches quests, XP or the streak");
  assert.match(src("components/court/live/GrowLive.tsx"), /d\.wins\[k\] = \{ \.\.\.d\.wins\[k\], w: w\.slice\(0, 2000\), g: g\.slice\(0, 2000\), n: n\.slice\(0, 6000\) \}; \}, \["wins"\]/, "the evening sheet saves as before and keeps the small win");
  const { OWNED_KEYS } = await import("../src/lib/court/state.ts");
  assert.ok(OWNED_KEYS.includes("wins"), "wins is part of her saved state, so Export my data includes it");
});

test("the rename leaves no 'Count your wins' anywhere in the app", () => {
  const hits = walk(root).filter((f) => /\.(tsx?|css)$/.test(f)).filter((f) => /count your wins/i.test(fs.readFileSync(f, "utf8")));
  assert.deepEqual(hits.map((f) => path.relative(root, f)), []);
  assert.match(src("components/court/CourtSheet.tsx"), /sheet\.kind === "wins" \? "Gratitude"/);
});

test("a news category chip opens every headline in that category; Collapse goes back", () => {
  const n = src("components/court/NewsLive.tsx");
  assert.match(n, /onClick=\{\(\) => \{ setTab\(g\); setMore\(true\); \}\}/);
  assert.match(n, /const shown = more \? list : list\.slice\(0, 8\);/, "no cap of 40 once open");
  assert.match(n, /\{more \? "Collapse" : "More headlines"\}/);
});

test("Settings: Sign out sits beside Replay the tour and posts to the existing sign-out route", async () => {
  const { SettingsPage } = await import("../src/components/court/pages/SettingsPage.tsx");
  const html = renderToString(h(CourtCtx.Provider, { value: ctx(normalize({}, K)) }, h(SettingsPage, {})));
  assert.match(html, /<div class="kpage-act"><a class="btn sm ghost" href="#welcome">Replay the tour<\/a><form class="kbtn-row" action="\/auth\/signout" method="post"><button class="btn sm" type="submit">Sign out<\/button><\/form><\/div>/);
  assert.equal((html.match(/Sign out<\/button>/g) ?? []).length, 1, "one Sign out, in the header");
  assert.match(src("app/auth/signout/route.ts"), /supabase\.auth\.signOut\(\);\n\s+return NextResponse\.redirect\(new URL\("\/login", request\.url\)/, "the existing route signs out and returns to login");
});

test("Trades: no agent tag beside the Trade log title", () => {
  assert.match(src("components/court/pages/TradesPage.tsx"), /<Card title="Trade log" id="tlog" actions=/);
});
