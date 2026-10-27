// Indicator tests (docs/build-intel.md K). Fixtures are the StockCharts worked examples (mocked data,
// not live). Run: npm test   (Node 24 loads the TypeScript source directly).
import { test } from "node:test";
import assert from "node:assert/strict";
import { ema, sma, rsi, atr, fit, pivots, autoLines, levels, snapshot } from "../src/lib/ta.ts";

const near = (a, b, d = 0.01) => assert.ok(Math.abs(a - b) <= d, `${a} vs ${b}`);

test("SMA", () => { assert.deepEqual(sma([1, 2, 3, 4], 2), [null, 1.5, 2.5, 3.5]); });

test("EMA 10 matches StockCharts example", () => {
  const c = [22.27, 22.19, 22.08, 22.17, 22.18, 22.13, 22.23, 22.43, 22.24, 22.29, 22.15, 22.39, 22.38];
  const e = ema(c, 10);
  near(e[9], 22.22); near(e[10], 22.21); near(e[11], 22.24); near(e[12], 22.27);
});

test("RSI 14 (Wilder) matches StockCharts example", () => {
  const c = [44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.10, 45.42, 45.84, 46.08, 45.89, 46.03, 45.61, 46.28, 46.28, 46.00];
  const r = rsi(c, 14);
  // StockCharts shows 70.53 and 66.32 because its sheet rounds the averages to 2 decimals each step;
  // unrounded Wilder smoothing gives 70.46 and 66.25.
  near(r[14], 70.46, 0.01); near(r[15], 66.25, 0.02);
});

test("ATR on constant ranges equals the range", () => {
  const cs = Array.from({ length: 20 }, (_, i) => ({ t: i, o: 10, h: 11, l: 9, c: 10, v: 1 }));
  near(atr(cs, 14)[19], 2, 1e-9);
});

test("least-squares fit", () => { const f = fit([{ i: 0, p: 1 }, { i: 1, p: 3 }, { i: 2, p: 5 }]); near(f.slope, 2, 1e-9); near(f.icpt, 1, 1e-9); });

// Synthetic zig-zag rising market: swing lows on a rising line.
const zig = Array.from({ length: 80 }, (_, i) => { const base = 100 + i * 0.5, w = Math.sin(i / 2.5) * 3; const c = base + w; return { t: i, o: c, h: c + 0.4, l: c - 0.4, c, v: 100 }; });

test("pivots find alternating swing highs and lows", () => {
  const p = pivots(zig, 3);
  assert.ok(p.filter((x) => x.kind === "high").length >= 4 && p.filter((x) => x.kind === "low").length >= 4);
});

test("auto line: rising support intact, broken after a drop", () => {
  const l = autoLines(zig, pivots(zig, 3), 0.01).find((x) => x.kind === "rising support");
  assert.ok(l && l.touches >= 3 && !l.broken);
  const crash = [...zig, ...Array.from({ length: 4 }, (_, j) => ({ t: 80 + j, o: 90, h: 90.4, l: 89.6, c: 90, v: 100 }))];
  const p2 = pivots(zig, 3); // pivots from before the drop
  const l2 = autoLines(crash, p2, 0.01).find((x) => x.kind === "rising support");
  assert.ok(l2 && l2.broken);
});

test("levels and snapshot describe, never advise", () => {
  const s = snapshot(zig);
  assert.ok(s && s.words.length > 0);
  assert.ok(!s.words.join(" ").match(/\b(buy|sell|target|will)\b/i));
  assert.ok(levels(zig, pivots(zig)).length > 0);
});
