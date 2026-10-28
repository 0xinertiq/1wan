// Render guard (bug fix after round 5d): renders the Court and every tab with react-dom/server, with empty,
// partial, old-format and fully loaded data, and fails on any thrown error or console error. Made-up data only.
// Needs tests/tsx.mjs (compiles .tsx). Effects do not run here; components are given loaded data directly through
// the court context instead (calendar events, prices), which is what they hold after their fetches finish.
import { test } from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToString } from "react-dom/server";
import { CourtCtx } from "../src/components/court/CourtState.tsx";
import { normalize } from "../src/lib/court/state.ts";
import { mdLite } from "../src/components/court/mdLite.ts";
import { CourtLayout } from "../src/components/court/live/KumoHome.tsx";
import { resolveHash } from "../src/components/court/AppTabs.tsx";
import { LivingWorld, CrewRoster } from "../src/components/court/live/LivingWorld.tsx";
import { NeedsNow, WeekAhead } from "../src/components/court/live/CourtHome.tsx";
import { BriefsBlock, BriefsLibrary, MoversCard, ReviewCard } from "../src/components/court/CourtBriefs.tsx";
import { StatusLine } from "../src/components/court/StatusLine.tsx";
import { EconLive, NextLiquidityLine } from "../src/components/court/live/EconLive.tsx";
import { MomoCard, KumoPick, TodayLive } from "../src/components/court/live/TodayLive.tsx";
import { CalendarTab } from "../src/components/court/live/CalendarTab.tsx";
import { LiveWatch } from "../src/components/court/live/LiveWatch.tsx";
import { TechLive } from "../src/components/court/live/TechLive.tsx";
import { TradeLive } from "../src/components/court/live/TradeLive.tsx";
import { NewsLive } from "../src/components/court/NewsLive.tsx";
import { GardenLive, DiaryLive, WinsButton } from "../src/components/court/live/GrowLive.tsx";
import { LifeTabs } from "../src/components/court/LifeTabs.tsx";
import { LunaSky } from "../src/components/court/live/LunaSky.tsx";
import { Header } from "../src/components/court/Header.tsx";
import { AppTabs } from "../src/components/court/AppTabs.tsx";
import { SettingsLive } from "../src/components/court/live/SettingsLive.tsx";
import { TradesPage } from "../src/components/court/pages/TradesPage.tsx";
import { CalendarPage } from "../src/components/court/pages/CalendarPage.tsx";
import { LifeHub } from "../src/components/court/pages/LifeHub.tsx";
import { DungeonPage } from "../src/components/court/pages/Dungeon.tsx";
import { GardenPage } from "../src/components/court/pages/GardenPage.tsx";
import { NewsPage } from "../src/components/court/pages/NewsPage.tsx";

const K = "2026-10-28", NOW = "2026-10-28T03:02:00Z";
const h = React.createElement;

const doc = (key, body, extra = {}) => ({ key, label: key, title: key + " brief", when: "Today 07:52 SGT · 2h ago", html: mdLite(body ?? ""), top: [], body, at: "2026-10-27T23:52:00Z", sources: "RSS, Bigdata.com", vote: null, ...extra });
const BODIES = {
  intel: "Daily Intel Brief\n\nCalm.\n\n## Top 5 headlines\n\n**The Fed holds.** Why. — [CNBC](https://a.example)\n\n## Asia\n\n**Kospi up.** Chips. — [AP](https://b.example)",
  scan: "Crypto Watchlist Scan\n\nMajors hold.\n\n## Movers\n\n**ZRO +12% day** unlock.\n\n## Style Map\n\n| Bucket | Coins (score) |\n|---|---|\n| A Pullback now | ZRO 75 |",
  pulse: "Pulse Morning Brief\n\n## VC and tech deals\n\n- one deal",
  review: "Chief Kumo weekly review\n\nA calm week.\n\nIntel: filed.\n\n- Sleep earlier",
  movers: "No notable movers at 14:30.",
};
const DOCS = {
  empty: [],
  partial: [doc("intel", ""), doc("scan", "no headings at all"), doc("review", null)],
  full: Object.entries(BODIES).map(([k, b]) => doc(k, b)),
  odd: [doc("intel", BODIES.intel, { at: "not a date", when: "" }), doc("scan", BODIES.scan, { sources: null, title: "" })],
};
const STATES = {
  empty: normalize({}, K),
  partial: normalize({ lvl: 3, xp: 40, streak: 2, dump: [{ id: "d1", t: "call mum", done: false, ts: 1 }], life: [{ id: "l1", name: "Dog grooming", cat: "pet", amt: null, rule: { type: "dom", d: 29 }, lead: 3 }] }, K),
  chart: normalize({ defs: { grid: { goal: "G", pillars: [{ name: "P1", acts: [{ t: "a", why: "w", when: "x" }] }] }, money: { phases: [] } }, grid: { done: { "1.1": true } }, gridDefs: { cur: null, hist: [], draft: { step: 3, g: {} } } }, K),
  old: normalize({ v: 1, life: [{ id: "x", name: "Spotify", cat: "bill", amt: 9.9, rule: { type: "dom", d: 28 }, lead: 0, autoPaid: "yes", important: 1 }, { name: "broken" }, null], spr: { run: { at: "2026-10-28T02:50:00Z", tag: "study" }, log: [{ at: "bad", tag: "x", min: 25 }] }, tails: [0, 1, "x"], restDay: K, uq: ["A quote she saved."], days: { "2026-10-27": { d: 3, t: 8 } } }, K),
};
const EVENTS = [
  { id: "e1", title: "Dog grooming", cal: "Personal", color: "#f9c", allDay: false, sk: K, ek: K, sm: 190, em: 250, loc: "Pet shop" },
  { id: "e2", title: "Public holiday", cal: "Holidays", color: "#9cf", allDay: true, sk: K, ek: "2026-10-29" },
  { id: "e3", title: "Moon trine Venus", cal: "Astro calendar", color: "#ccf", allDay: true, sk: K, ek: "2026-10-29", desc: "Tense · rest\n• Moon trine Venus at 04:00 UTC\n✅ DO: rest\n🚫 DON'T: rush" },
];
const PRICES = {
  none: null,
  empty: { at: NOW, source: "cache", stale: true, prices: [] },
  live: { at: NOW, source: "crypto.com", stale: false, prices: [{ sym: "BTC", usd: 80800, ch24: 1.2 }, { sym: "SOL", usd: 190.5, ch24: null }, { sym: "ZRO", usd: 0.0123, ch24: -3 }] },
};

export { ctx, K, EVENTS, STATES };
function ctx(st, events, prices, cal = "live") {
  const noop = () => {};
  return { st, k: K, nm: 662, recap: null, clearRecap: noop, update: noop, levelUp: noop, save: "idle", events, cal: { state: cal, cals: [] }, setCalendar: noop, prices, setPrices: noop, pxBusy: false, setPxBusy: noop, sheet: null, openSheet: noop };
}

function screens(docs) {
  const docOf = (k) => docs.find((d) => d.key === k) ?? null;
  const filed = Object.fromEntries(docs.map((d) => [d.key, d.at]));
  const latest = Object.fromEntries(docs.map((d) => [d.key, { title: d.title, at: d.at }]));
  const slots = {
    weather: null, today: h(TodayLive), todayBare: h(TodayLive, { bare: true }), stage: null, statusLine: h(StatusLine, { latest }), luna: h(LunaSky),
    brief: null, scan: null, tech: h(TechLive), weekStrip: null, weekAhead: h(WeekAhead), econ: h(EconLive), news: h(NewsLive), needs: h(NeedsNow, { unrated: ["Intel"] }),
    status: null, briefs: h(BriefsBlock, { docs: { pulse: docOf("pulse"), intel: docOf("intel"), scan: docOf("scan") }, mem: { intel: { lessons: ["Prefer primary sources", "Bigdata.com was down"], selfCheck: "ok", stats: { n: 2, up: 1, down: 1 } } } }),
    review: h(ReviewCard, { d: docOf("review") }), world: h(LivingWorld, { filed }), roster: h(CrewRoster, { filed }),
  };
  return {
    header: h(Header),
    court: h(CourtLayout, { s: slots }),
    calendar: h("div", null, h(NextLiquidityLine), h(CalendarTab), h(CalendarPage, { main: h(CalendarTab, { noWeek: true }), econ: h(EconLive), momo: h(MomoCard) })),
    trades: h("div", null, h(TradeLive), h(TradesPage, { left: h("div", null, h(LiveWatch), h(MoversCard, { list: docs.filter((d) => d.key === "movers") }), h(TechLive)), scan: docOf("scan"), intel: docOf("intel") })),
    news: h(NewsPage, { headlines: h(NewsLive, { top5: ["The Fed holds."] }), library: h(BriefsLibrary, { history: docs }) }),
    garden: h("div", null, h(KumoPick), h(GardenLive)),
    diary: h("div", null, h(WinsButton), h(DiaryLive, { open: true })),
    life: h(LifeTabs), lifeHub: h(LifeHub), dungeon: h(DungeonPage), gardenPage: h(GardenPage), settings: h(SettingsLive, { open: true }),
    tabs: h(AppTabs, { panels: { court: h("p", null, "c"), calendar: null, garden: null, diary: null, life: null }, extra: { trades: h("p"), news: h("p"), inbox: h("p"), settings: h("p"), kingdom: h("p"), welcome: h("p") } }),
  };
}

for (const [sName, st] of Object.entries(STATES)) for (const [dName, docs] of Object.entries(DOCS)) for (const [pName, prices] of Object.entries(PRICES)) {
  test(`renders every screen: state ${sName}, briefs ${dName}, prices ${pName}`, () => {
    const errors = [], orig = console.error;
    console.error = (...a) => errors.push(a.map(String).join(" ").slice(0, 300));
    try {
      for (const events of [[], EVENTS]) for (const [name, el] of Object.entries(screens(docs))) {
        try { renderToString(h(CourtCtx.Provider, { value: ctx(st, events, prices) }, el)); }
        catch (e) { errors.push(`${name} (${events.length} events): ${e && e.stack ? e.stack.split("\n").slice(0, 4).join(" | ") : e}`); }
      }
    } finally { console.error = orig; }
    assert.deepEqual(errors, []);
  });
}

// Round 6: the Observatory is gone; old links land on the Court, and the retired Life sub-tabs on their new homes.
test("old links redirect: Observatory to the Court, Samsara and Money to the Life Hub, Trade to Trades", () => {
  assert.deepEqual(resolveHash("observatory"), { tab: "court", rewrite: true });
  assert.deepEqual(resolveHash("samsara"), { tab: "life", rewrite: true });
  assert.deepEqual(resolveHash("money"), { tab: "life", rewrite: true });
  assert.deepEqual(resolveHash("trade"), { tab: "trades", rewrite: true });
  assert.deepEqual(resolveHash("trades"), { tab: "trades", rewrite: false });
  assert.deepEqual(resolveHash("luna-card"), { tab: "court", rewrite: false });
  const html = renderToString(h(CourtCtx.Provider, { value: ctx(STATES.partial, [], null) }, screens(DOCS.full).tabs));
  assert.ok(!/Observatory/.test(html), "no Observatory tab in the nav");
});
