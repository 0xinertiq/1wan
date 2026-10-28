// Round 8 checks: no solid pink buttons, a footer buffer on every page, the grid's double press (same stored key as
// the editor's Done box), Weekly targets unchanged, the rule-built headline briefing, no astro on the Calendar, and
// nothing deleted by the layout changes.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";
import { CourtCtx } from "../src/components/court/CourtState.tsx";
import { normalize } from "../src/lib/court/state.ts";
import { isDoublePress, tickId } from "../src/lib/court/harada.ts";
import { briefing } from "../src/lib/court/briefing.ts";

const K = "2026-10-28", h = React.createElement;
const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");
const css = src("app/(court)/kumo-new.css").replace(/\/\*[\s\S]*?\*\//g, "");
const ctx = (st, update = () => {}) => ({ st, k: K, nm: 600, recap: null, clearRecap() {}, update, levelUp() {}, save: "idle", events: [], cal: { state: "live", cals: [] }, setCalendar() {}, prices: null, setPrices() {}, pxBusy: false, setPxBusy() {}, sheet: null, openSheet() {} });

test("no solid pink buttons: no New-look button rule fills with the solid accent", () => {
  const bad = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)]
    .filter(([, sel, body]) => /\.btn|button|\.kseg|\.chipb/.test(sel) && !/::(after|before)/.test(sel) && /background(-color)?:\s*var\(--(k-accent|btn-bg|kumo-pink|k-sakura-500|k-sakura-600|k-accent-hover)\)/.test(body))
    .map(([, sel]) => sel.trim().slice(0, 100));
  assert.deepEqual(bad, []);
  assert.match(css, /\.btn\{[^}]*background:var\(--k-btn-fill\)/);
});

test("every page ends with a footer buffer (48px plus the safe area)", () => {
  assert.match(css, /\.tabpanel\{padding-bottom:calc\(var\(--sp-12\) \+ env\(safe-area-inset-bottom,0px\)\)\}/);
  const tabs = src("components/court/AppTabs.tsx");
  assert.equal((tabs.match(/className=\{`tabpanel tp-\$\{id\}`\}/g) ?? []).length, 2, "both the main tabs and the extra pages render inside a tabpanel");
});

test("grid: a double press marks an action done with the same key and watering as the Done box; one press opens the editor", () => {
  assert.equal(tickId(2, 4), "3.5");
  assert.ok(isDoublePress({ key: "a3", at: 1000 }, "a3", 1200));
  assert.ok(!isDoublePress({ key: "a3", at: 1000 }, "a3", 1400), "too slow is two single presses");
  assert.ok(!isDoublePress({ key: "a2", at: 1000 }, "a3", 1100), "a different cell");
  assert.ok(!isDoublePress(null, "a3", 1100));
  const g = src("components/court/pages/GridChart.tsx");
  assert.match(g, /isDoublePress\(last\.current, key, now\)\) \{ last\.current = null; const id = tickId\(c\.p, c\.a\); tick\("grid", id, !done\[id\], "grid"\); return; \}/);
  assert.match(g, /last\.current = \{ key, at: now \};\n\s+setSel\(c\);/);
  assert.match(g, /tick\("grid", id!, e\.target\.checked, "grid"\)/, "the editor's Done box is still there");
});

test("useTick stores a grid tick under its p.a key and waters the garden", async () => {
  const { useTick } = await import("../src/components/court/live/GridWins.tsx");
  const calls = [], orig = globalThis.fetch;
  globalThis.fetch = (u, o) => { calls.push([u, JSON.parse(o.body)]); return Promise.resolve({ ok: true }); };
  const st = normalize({ grid: { done: { "1.1": true } } }, K);
  let saved = null;
  const update = (fn, keys) => { const d = structuredClone(st); fn(d); saved = { done: d.grid.done, keys }; };
  function Probe() { const tick = useTick(); tick("grid", "3.5", true, "grid"); return null; }
  try { renderToString(h(CourtCtx.Provider, { value: ctx(st, update) }, h(Probe))); } finally { globalThis.fetch = orig; }
  assert.deepEqual(saved, { done: { "1.1": true, "3.5": true }, keys: ["grid"] });
  assert.deepEqual(calls[0], ["/api/water", { source: "grid", ref: "grid:3.5", on: true, weight: 1 }]);
});

test("Weekly targets: the same numbers and ids, only restyled", async () => {
  const { SamsaraLive } = await import("../src/components/court/live/SamsaraLive.tsx");
  const st = normalize({ samsara: { done: { a1: true }, t: { hours: 2, replies: 4, wk: "2026-10-26" } }, cad: { wk: "2026-10-26", ig: 0, x: 3 },
    defs: { samsara: { phases: [{ id: "w", title: "Weekly rhythm", when: "every week", why: "", daily: true, items: [["w4", "Post and reply", "2 posts, 3 replies"]] }, { id: "p1", title: "Phase 1", when: "Nov", why: "w", items: [["a1", "First thesis", "x"], ["b2", "Eight entries", "x"]] }] } } }, K);
  const html = renderToString(h(CourtCtx.Provider, { value: ctx(st) }, h(SamsaraLive, { onWriteThesis() {} }))).replace(/<!-- -->/g, "");
  assert.match(html, /3 · 4/, "posts and replies this week");
  assert.match(html, /1 \/ 2/, "milestones count from the same ids");
  assert.match(html, /3 posts · 4 replies/);
  assert.match(src("components/court/pages/GridChart.tsx"), /<div className="kweekly"><SamsaraLive/);
});

test("Today's briefing: near-duplicates grouped, top five by score, only her lenses", () => {
  const it = (title, source, group, at = "2026-10-28T01:00:00Z", tier = "media") => ({ title, source, group, at, link: "https://x/" + encodeURIComponent(title + source), tier });
  const c = (score, items) => ({ lead: items[0], items, sources: items.length, independent: items.length, syndicated: false, score, why: [] });
  const clusters = [
    c(90, [it("Fed holds rates steady as inflation cools", "Reuters", "Macro")]),
    c(85, [it("Fed holds rates steady while inflation cools", "AP", "Macro"), it("Fed holds", "CNBC", "Macro")]),
    c(80, [it("Bitcoin tops 120k", "CoinDesk", "Crypto")]),
    c(70, [it("Nvidia earnings beat", "FT", "Tech")]),
    c(60, [it("Local MRT line delayed", "CNA", "Local")]),
    c(50, [it("Solana ETF filing", "The Block", "Crypto")]),
    c(40, [it("Oil slips", "Bloomberg", "Markets")]),
    c(30, [it("ETH gas falls", "Decrypt", "Crypto")]),
    c(99, [it("Telegram chatter", "Channel (Telegram)", "Telegram", undefined, "social")]),
  ];
  const all = briefing(clusters, ["any"]);
  assert.equal(all.stories.length, 5);
  assert.deepEqual(all.stories.map((s) => s.title.slice(0, 12)), ["Fed holds ra", "Bitcoin tops", "Nvidia earni", "Local MRT li", "Solana ETF f"]);
  assert.deepEqual(all.stories[0].sources, ["Reuters", "AP", "CNBC"], "the near-duplicate's sources are added up");
  assert.equal(all.headlines, 9, "social-only stories are left out of the count");
  const crypto = briefing(clusters, ["crypto"]);
  assert.deepEqual(crypto.stories.map((s) => s.group), ["Crypto", "Crypto", "Crypto"]);
  assert.deepEqual(briefing(clusters, ["off"]).stories, []);
});

test("Calendar tab still has no astro, and only the Calendar and Economic calendar", async () => {
  const { CalendarPage } = await import("../src/components/court/pages/CalendarPage.tsx");
  const { CalendarTab } = await import("../src/components/court/live/CalendarTab.tsx");
  const events = [{ id: "m", title: "Full Moon in Taurus", cal: "Luna", color: "#ccf", allDay: true, sk: K, ek: "2026-10-29" }, { id: "b", title: "Dentist", cal: "Personal", color: "#f9c", allDay: false, sk: K, ek: K, sm: 600, em: 660 }];
  const html = renderToString(h(CourtCtx.Provider, { value: { ...ctx(normalize({}, K)), events } }, h(CalendarPage, { main: h(CalendarTab, { noWeek: true }), econ: h("p", null, "ECON") })));
  assert.ok(!/astro|moon|astrolog|luna/i.test(html));
  assert.ok(!/My tasks|Month at a glance|Upcoming/.test(html));
  assert.match(html, /Dentist/); assert.match(html, /ECON/);
});

test("nothing deleted: tasks still feed Needs you now, and every table stays in the export", async () => {
  const { TABLES } = await import("../src/lib/vault.ts");
  assert.ok(TABLES.includes("tasks") && TABLES.includes("research_notes"));
  assert.match(src("components/court/live/CourtHome.tsx"), /useVault\("tasks"\)/);
  assert.match(src("app/api/export/route.ts"), /tasks/);
  for (const f of ["components/court/pages/CalendarPage.tsx", "components/court/pages/NewsPage.tsx", "components/court/pages/Dungeon.tsx", "components/court/pages/TradesPage.tsx"]) assert.ok(!/localStorage\.removeItem|dropSaved\(/.test(src(f)), f);
});
