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

// Fonts (locked): the New look uses only the font tokens (Playfair Display, Nunito, Inter for journal writing,
// Silkscreen for tiny labels, the CJK fallback). No font family is named outside kumo-tokens.css.
test("New look uses only the locked fonts, through the tokens", () => {
  const css = fs.readFileSync(path.join(root, "app/(court)/kumo-new.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const ok = /^(--kumo-font-display|--kumo-font-body|--k-font-(head|body|journal|label|cjk))$/;
  const bad = [];
  for (const m of css.matchAll(/(?:^|[;{\s])(font-family|font)\s*:\s*([^;}]+)/g)) {
    const v = m[2];
    for (const x of v.matchAll(/var\((--[a-z0-9-]+)\)/g)) if (!/^--(fs|lh)-/.test(x[1]) && !ok.test(x[1])) bad.push(`${m[1]}: ${v.trim()}`);
    if (/["']|\b(serif|sans-serif|monospace|system-ui|georgia|inter|nunito|playfair|quicksand|baloo|atkinson|silkscreen)\b/i.test(v.replace(/var\([^)]*\)/g, ""))) bad.push(`${m[1]}: ${v.trim()}`);
  }
  const comp = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(path.join(root, "components")).filter((f) => /\.tsx$/.test(f))) if (/fontFamily\s*:/.test(fs.readFileSync(f, "utf8"))) comp.push(path.relative(root, f));
  assert.deepEqual([...new Set(bad), ...comp], []);
});

// Contrast, day and night, from the tokens themselves: text, secondary text, links, title bars, chips, brief body
// (7:1), nav labels (4.5:1), icons (3:1), and the world HUD glass over the real sky colours of the scene.
function tokenSets() {
  const css = fs.readFileSync(path.join(root, "app/(court)/kumo-tokens.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const block = (sel) => { const i = css.indexOf(sel + "{"); const j = css.indexOf("}", i); return css.slice(i + sel.length + 1, j); };
  const decls = (b) => Object.fromEntries([...b.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  const pal = decls(block(":root")), day = decls(block(':root[data-ui="new"]')), night = decls(block(':root[data-ui="new"][data-theme="dark"]'));
  return { day: { ...pal, ...day }, night: { ...pal, ...day, ...night } };
}
const resolve = (t, v, d = 0) => { const m = /^var\((--[a-z0-9-]+)\)$/.exec(v); return m && d < 9 ? resolve(t, t[m[1]], d + 1) : v; };
function rgba(v) {
  let m = /^#([0-9a-f]{6})$/i.exec(v); if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16)).concat(1);
  m = /^rgba?\(([^)]+)\)$/.exec(v); if (m) { const p = m[1].split(",").map(Number); return [p[0], p[1], p[2], p[3] ?? 1]; }
  throw new Error("not a colour: " + v);
}
const over = (fg, bg) => [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3])).concat(1);
const lum = (c) => { const f = (x) => { x /= 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

test("contrast of text, links, titles, chips and icons in day and night", () => {
  const sets = tokenSets(), bad = [];
  for (const [mode, t] of Object.entries(sets)) {
    const c = (name, base) => { const v = rgba(resolve(t, `var(${name})`)); return v[3] < 1 ? over(v, base ?? c("--k-bg")) : v; };
    const titles = mode === "day" ? ["--k-title-a", "--k-title-b"] : ["--k-night-title-a", "--k-night-title-b"];
    const pairs = [
      ...["--k-bg", "--k-surface", "--k-surface-2", "--k-panel", "--k-tint-sakura", "--k-tint-lav"].map((b) => ["--k-text", b, 7]),
      ...["--k-bg", "--k-surface", "--k-surface-2", "--k-panel"].map((b) => ["--k-text-muted", b, 4.5]),
      ...["--k-bg", "--k-surface", "--k-surface-2", "--k-panel", "--k-tint-sakura", "--k-tint-lav"].map((b) => ["--k-link", b, 4.5]),
      ...titles.map((b) => ["--k-title-text", b, 4.5]),
      ...["--k-tint-lav", "--k-tint-sakura", "--k-tint-gold", "--k-tint-mint", "--k-tint-peach", "--k-tint-sky"].map((b) => ["--k-chip-text", b, 4.5]),
      ...["--k-bg", "--k-surface"].map((b) => ["--k-nav-text", b, 4.5]),
      ...["--k-bg", "--k-surface"].map((b) => ["--k-icon-line", b, 3]),
      ["--k-icon-on", "--k-icon-on-bg", 3],
      ...(mode === "night" ? ["--k-bg", "--k-surface"].map((b) => ["--k-icon-fill", b, 3]) : []),
    ];
    for (const [fg, bg, min] of pairs) {
      const B = c(bg, c("--k-surface", c("--k-bg", [255, 255, 255, 1]))), r = ratio(c(fg, B), B);
      if (r < min) bad.push(`${mode}: ${fg} on ${bg} is ${r.toFixed(2)}:1 (needs ${min})`);
    }
  }
  assert.deepEqual(bad, []);
});

test("world HUD and place labels are readable over the real sky, whatever the theme", () => {
  const t = tokenSets().day;
  const draw = fs.readFileSync(path.join(root, "components/kumo/world/draw.ts"), "utf8");
  const sky = Object.fromEntries([...draw.match(/const SKY[^{]*\{([^}]*)\}/)[1].matchAll(/(\w+):\s*\["(#[0-9A-Fa-f]{6})",\s*"(#[0-9A-Fa-f]{6})"\]/g)].map((m) => [m[1], [m[2], m[3]]]));
  const col = (n) => rgba(resolve(t, `var(${n})`)), bad = [];
  // scene-light (dawn, day): cream glass and plum text; scene-dark (dusk, night): plum glass and light text
  for (const [phase, [glass, text]] of [["dawn", ["--k-hud-light", "--k-plum-text"]], ["day", ["--k-hud-light", "--k-plum-text"]], ["dusk", ["--k-hud-dark", "--k-night-text"]], ["night", ["--k-hud-dark", "--k-night-text"]]])
    for (const s of [...sky[phase], "#FFFFFF", "#4a2538"]) {
      const B = over(col(glass), rgba(s)), r = ratio(col(text), B);
      if (r < 4.5) bad.push(`${phase} over ${s}: ${r.toFixed(2)}:1`);
    }
  assert.ok(Object.keys(sky).length === 4, "sky colours not found in draw.ts");
  assert.deepEqual(bad, []);
});
