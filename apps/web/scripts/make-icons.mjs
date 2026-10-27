// Builds the app icons from Chief Kumo's pixel sprite (src/components/spriteDefs.ts), still frame, no animation.
// Run from apps/web: node scripts/make-icons.mjs  (writes public/icons/*). Re-run only if the sprite changes.
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";
import { SPRITE_DEFS } from "../src/components/spriteDefs.ts";

const BG = "#FFE0EE", KUMO = ["#ffc2d4", "#f598b5", "#ffe3ec", "#fff4ec"];
const style = `.px-m{fill:${KUMO[0]}}.px-m2{fill:${KUMO[1]}}.px-m3{fill:${KUMO[2]}}.px-b{fill:${KUMO[3]}}`;

// pad = share of the canvas left around the sprite (maskable icons need a wider safe zone).
function svg(pad, round) {
  const s = 32 / (1 - 2 * pad), o = -s * pad;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${o} ${o - 1} ${s} ${s}" shape-rendering="crispEdges">` +
    `<style>${style}</style><defs>${SPRITE_DEFS}</defs>` +
    `<rect x="${o}" y="${o - 1}" width="${s}" height="${s}" rx="${round ? s * 0.22 : 0}" fill="${BG}"/>` +
    `<use href="#cKumo"/></svg>`;
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon.svg", svg(0.1, true));
const out = [["icon-192.png", 192, 0.1, true], ["icon-512.png", 512, 0.1, true], ["maskable-512.png", 512, 0.2, false], ["apple-touch-icon.png", 180, 0.12, false]];
for (const [name, size, pad, round] of out) {
  await sharp(Buffer.from(svg(pad, round)), { density: 72 * Math.ceil(size / 32) }).resize(size, size, { kernel: "nearest" }).png().toFile("public/icons/" + name);
  console.log("wrote public/icons/" + name);
}
