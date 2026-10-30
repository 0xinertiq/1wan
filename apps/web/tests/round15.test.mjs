// Round 15: four redesigned room banners (Dungeon, Life Hub, Trades, News) on the Calendar banner's frame, each
// with the agent already tied to its tab, gentle CSS motion that stops under prefers-reduced-motion.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import React from "react";
import { renderToString } from "react-dom/server";

const h = React.createElement;
const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");
const ROOMS = [
  ["room2Dungeon", "DungeonStudy", "dungeon", "sisi", "Dungeon.tsx"],
  ["room2Life", "LifeMorning", "life", "coco", "LifeHub.tsx"],
  ["room2Trades", "TradesNight", "trades", "fenn", "TradesPage.tsx"],
  ["room2News", "NewsDawn", "news", "pip", "NewsPage.tsx"],
];
// the frame's structure, with the per-room classes and phase stripped
const frame = (html) => html.replace(/<div class="kroom-art">[\s\S]*<\/div><\/div><\/div>/, '<div class="kroom-art">ART</div></div></div>')
  .replace(/ ph-[a-z]+/g, "").replace(/ kroom-v2 kroom2-[a-z]+/g, "").replace(/aria-label="[^"]*"/g, "");

test("each banner uses the Calendar banner's frame, grid and size, on its tab's page", async () => {
  const clock = renderToString(h((await import("../src/components/kumo/decor/ClockRoom.tsx")).ClockRoom));
  for (const [file, name, id, , page] of ROOMS) {
    const html = renderToString(h((await import(`../src/components/kumo/decor/${file}.tsx`))[name]));
    assert.equal(frame(html), frame(clock), name + ": same RoomFrame structure as the clock tower");
    assert.match(html, /<svg viewBox="0 0 400 60"/, name + ": the same 400 x 60 grid");
    assert.match(html, new RegExp(`class="kroom ph-[a-z]+ kroom-v2 kroom2-${id}"`));
    assert.ok(!/<text|<image|<foreignObject/.test(html), name + ": shapes only, nothing readable");
    assert.match(src("components/court/pages/" + page), new RegExp(`<PageHead room=\\{<${name} />\\}`), name + " is on " + page);
  }
  // no new rule changes a banner's size (the shared .kroom box and the short-screen cap still decide it)
  const css = src("app/(court)/kumo-new.css");
  for (const rule of css.match(/[^}]*\.kroom(?:-v2|2-[a-z]+)[^{]*\{[^}]*\}/g) ?? []) assert.ok(!/(^|[;{])(width|height|min-height|max-height|aspect-ratio)\s*:/.test(rule.slice(rule.indexOf("{"))), rule.trim());
  assert.match(css, /@media \(min-width:1200px\)\{:root\[data-ui="new"\] \.kroom\{min-height:120px;max-height:max\(120px,calc\(100vh - 504px\)\)\}\}/, "the short-screen cap is unchanged");
  assert.ok(!/ClockRoom/.test(ROOMS.map(([f]) => src(`components/kumo/decor/${f}.tsx`)).join("")), "the clock tower is unchanged");
});

test("each room shows the agent already tied to its tab, and differs from the others", async () => {
  const pal = [];
  for (const [file, name, , who] of ROOMS) {
    const html = renderToString(h((await import(`../src/components/kumo/decor/${file}.tsx`))[name]));
    assert.match(html, new RegExp(`data-who="${who}"`), name + " shows " + who);
    assert.match(html, /class="kroom-agent k2-idle"/, "the agent has a small idle motion");
    assert.match(html, /fill="#FFD95E"/, name + " has its gold accent");
    assert.match(html, /fill="#4a2538"/, name + " uses the plum outline");
    const fills = new Set([...html.matchAll(/fill="(#[0-9A-Fa-f]{6})"/g)].map((m) => m[1].toUpperCase()));
    fills.delete("#4A2538"); fills.delete("#FFD95E");
    pal.push([name, fills]);
  }
  // each room's colour family is its own: few colours shared between any two rooms
  for (let i = 0; i < pal.length; i++) for (let j = i + 1; j < pal.length; j++) {
    const shared = [...pal[i][1]].filter((c) => pal[j][1].has(c));
    assert.ok(shared.length <= 4, `${pal[i][0]} and ${pal[j][0]} share ${shared.length} colours`);
  }
  // fixed lighting baked into each room: torchlit night study, sunny morning, cool-glow night desk, dawn
  const phases = ROOMS.map(([file]) => src(`components/kumo/decor/${file}.tsx`).match(/phase="([a-z]+)"/)[1]);
  assert.deepEqual(phases, ["night", "day", "night", "day"]);
});

test("motion is CSS only, slow, and off under prefers-reduced-motion", () => {
  for (const f of ["roomKit.tsx", ...ROOMS.map(([file]) => file + ".tsx")]) {
    assert.ok(!/setInterval|setTimeout|requestAnimationFrame|useEffect/.test(src("components/kumo/decor/" + f)), f + ": no timers");
  }
  const css = src("app/(court)/kumo-new.css");
  assert.match(css, /@media \(prefers-reduced-motion:reduce\)\{:root\[data-ui="new"\] \.kroom-v2 \*,:root\[data-ui="new"\] \.kroom-v2 \.k2-idle\{animation:none!important\}\}/);
  // every k2 animation is scoped to the new rooms and slow (3 seconds or more per cycle)
  for (const m of css.matchAll(/([^}\n]*)\{animation:(k2-[a-z]+) ([\d.]+)s/g)) {
    assert.match(m[1], /\.kroom-v2/, m[2] + " is scoped to the new rooms");
    assert.ok(Number(m[3]) >= 3, m[2] + " is slow");
  }
});
