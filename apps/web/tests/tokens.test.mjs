// Design-token check (round 6): the New look takes every colour, spacing and radius from
// src/app/(court)/kumo-tokens.css. This fails when kumo-new.css or a New-look component uses a raw colour,
// or when kumo-new.css uses spacing or radii off the 4/8/12/16/24/32/48 scale instead of the tokens.
// Allowed: the token file itself, Classic's dashboard.css, and pixel-art / illustration files (listed below),
// plus the line after a "pixel-art" comment. lib/court/tails.ts (the tail drawing) and lib/calendar.ts (feed
// colours) are protected files, so they are listed rather than changed.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../src");
const ART = [
  "components/spriteDefs.ts", "components/PixelSprite.tsx", "components/kumo/world/draw.ts", "components/kumo/Fox.tsx",
  "components/kumo/DungeonIcon.tsx", "components/kumo/decor/", "components/court/HeaderMenu.tsx", "components/court/live/GrowLive.tsx",
  "components/court/Stage.tsx", "components/court/StageSky.tsx", "components/court/StageActors.tsx", "components/court/CourtDefs.tsx",
  "components/court/agents.ts", "lib/court/tails.ts", "lib/calendar.ts", "app/manifest.ts", "app/(court)/layout.tsx", "app/(app)/layout.tsx",
];
const HEX = /(^|["'`\s:(,=])#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![\w-])/;
const RAW = /\b(?:rgba?|hsla?)\(\s*\d/;

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
}

test("kumo-new.css has no raw colours", () => {
  const css = fs.readFileSync(path.join(root, "app/(court)/kumo-new.css"), "utf8");
  const bad = css.split(/\r?\n/).map((l, i) => [i + 1, l]).filter(([, l]) => HEX.test(l) || RAW.test(l));
  assert.deepEqual(bad.map(([n, l]) => `${n}: ${l.slice(0, 120)}`), []);
});

test("kumo-new.css spacing and radii come from the scale tokens", () => {
  const css = fs.readFileSync(path.join(root, "app/(court)/kumo-new.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const bad = [...css.matchAll(/(?:^|[;{\s])((?:padding|margin|gap|row-gap|column-gap)(?:-[a-z-]+)?|border(?:-[a-z]+)*-radius)\s*:\s*([^;}]+)/g)]
    .filter((m) => /(?<![\w.-])(?!0px)\d+(?:\.\d+)?px/.test(m[2])).map((m) => `${m[1]}: ${m[2].trim().slice(0, 60)}`);
  assert.deepEqual(bad, []);
});

test("New-look components use tokens, not raw colours (pixel art excepted)", () => {
  const files = walk(root).filter((f) => /\.(tsx?|mjs)$/.test(f)).map((f) => path.relative(root, f).split(path.sep).join("/")).filter((f) => !ART.some((a) => f.startsWith(a)));
  const bad = [];
  for (const f of files) {
    const lines = fs.readFileSync(path.join(root, f), "utf8").split(/\r?\n/);
    lines.forEach((l, i) => {
      if (/pixel-art/.test(l) || /pixel-art/.test(lines[i - 1] ?? "")) return;
      if (HEX.test(l) || RAW.test(l)) bad.push(`${f}:${i + 1}`);
    });
  }
  assert.deepEqual(bad, []);
});
