// 11 Nov: the dashboard page is a server component. Anything it renders from a "use client" file must be a real
// component; a bare context provider (X.Provider) passed across that boundary breaks the page for signed-in users
// (React error 306). The browser test page renders everything in the browser, so it cannot catch this; this does.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(import.meta.dirname, "../src");
const files = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(d, e.name)) : /\.tsx?$/.test(e.name) ? [path.join(d, e.name)] : []));

test("no client file exports a bare context provider (X.Provider) for server components to render", () => {
  const bad = files(SRC).filter((f) => { const s = fs.readFileSync(f, "utf8"); return /^["']use client["']/.test(s.trimStart()) && /export\s+const\s+\w+\s*=\s*\w+\.Provider\b/.test(s); });
  assert.deepEqual(bad.map((f) => path.relative(SRC, f)), []);
});

test("OwnerProvider is a real component", () => {
  assert.match(fs.readFileSync(path.join(SRC, "components/court/Owner.tsx"), "utf8"), /export function OwnerProvider\(/);
});
