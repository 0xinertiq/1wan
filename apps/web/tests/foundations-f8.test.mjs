// Foundations F8: the Classic look is retired (code kept): everyone is on the New look, an old "classic" choice is
// forgotten, and no switch or address can turn it back on.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const src = (f) => fs.readFileSync(path.resolve(import.meta.dirname, "../src", f), "utf8");

test("before paint: always the New look; an old classic choice is removed; ?ui= no longer switches", () => {
  const l = src("app/(court)/layout.tsx");
  assert.match(l, /d\.setAttribute\('data-ui','new'\)/);
  assert.match(l, /localStorage\.removeItem\('kumo\.ui'\)/);
  assert.doesNotMatch(l, /get\('ui'\)/);
  // run the boot script against a fake page that had chosen classic
  const boot = l.match(/const BOOT =\s*([\s\S]*?);\n\nexport/)[1];
  const code = eval(boot);
  const store = { "kumo.ui": "classic" }, attrs = {};
  const fn = new Function("localStorage", "document", "location", code);
  fn({ getItem: (k) => store[k] ?? null, removeItem: (k) => { delete store[k]; }, setItem: (k, v) => { store[k] = v; } },
    { documentElement: { setAttribute: (k, v) => { attrs[k] = v; } } }, { search: "?ui=classic" });
  assert.equal(attrs["data-ui"], "new"); assert.equal(store["kumo.ui"], undefined);
});

test("no Classic switch left on any screen; the Classic code itself is kept", () => {
  assert.doesNotMatch(src("components/court/pages/SettingsPage.tsx"), /<LookSwitch/);
  assert.doesNotMatch(src("components/court/live/SettingsLive.tsx"), /<LookSwitch/);
  assert.match(src("components/court/live/SettingsLive.tsx"), /export function LookSwitch/);
  assert.match(src("components/court/pages/SettingsPage.tsx"), /Day or night/);
});
