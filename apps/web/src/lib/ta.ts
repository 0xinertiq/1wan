// Watchlist technicals (docs/build-intel.md section K). Pure functions over real candles only; nothing is
// filled in or invented. Output is description, never a signal. Tests: tests/ta.test.mjs.
export type Candle = { t: number; o: number; h: number; l: number; c: number; v: number };

export function sma(xs: number[], n: number): (number | null)[] {
  let s = 0;
  return xs.map((x, i) => { s += x; if (i >= n) s -= xs[i - n]; return i >= n - 1 ? s / n : null; });
}
// EMA seeded with the SMA of the first n values (the usual charting convention).
export function ema(xs: number[], n: number): (number | null)[] {
  const k = 2 / (n + 1), out: (number | null)[] = [];
  let e: number | null = null;
  xs.forEach((x, i) => {
    if (i < n - 1) { out.push(null); return; }
    e = e == null ? xs.slice(0, n).reduce((a, b) => a + b, 0) / n : x * k + e * (1 - k);
    out.push(e);
  });
  return out;
}
// Wilder RSI.
export function rsi(xs: number[], n = 14): (number | null)[] {
  const out: (number | null)[] = [null];
  let g = 0, l = 0;
  for (let i = 1; i < xs.length; i++) {
    const d = xs[i] - xs[i - 1], up = Math.max(d, 0), dn = Math.max(-d, 0);
    if (i <= n) { g += up; l += dn; if (i < n) { out.push(null); continue; } g /= n; l /= n; }
    else { g = (g * (n - 1) + up) / n; l = (l * (n - 1) + dn) / n; }
    out.push(l === 0 ? 100 : 100 - 100 / (1 + g / l));
  }
  return out;
}
// Wilder ATR.
export function atr(cs: Candle[], n = 14): (number | null)[] {
  const tr = cs.map((c, i) => (i ? Math.max(c.h - c.l, Math.abs(c.h - cs[i - 1].c), Math.abs(c.l - cs[i - 1].c)) : c.h - c.l));
  const out: (number | null)[] = [];
  let a: number | null = null;
  tr.forEach((x, i) => {
    if (i < n) { out.push(null); return; }
    a = a == null ? tr.slice(1, n + 1).reduce((p, q) => p + q, 0) / n : (a * (n - 1) + x) / n;
    out.push(a);
  });
  return out;
}
export function macd(xs: number[], f = 12, s = 26, sig = 9) {
  const ef = ema(xs, f), es = ema(xs, s);
  const line = xs.map((_, i) => (ef[i] != null && es[i] != null ? ef[i]! - es[i]! : null));
  const valid = line.filter((x): x is number => x != null), sigv = ema(valid, sig), off = line.length - valid.length;
  const signal = line.map((_, i) => (i >= off ? sigv[i - off] : null));
  return { line, signal, hist: line.map((x, i) => (x != null && signal[i] != null ? x - signal[i]! : null)) };
}
export function bollinger(xs: number[], n = 20, k = 2) {
  const m = sma(xs, n);
  return xs.map((_, i) => {
    if (m[i] == null) return null;
    const w = xs.slice(i - n + 1, i + 1), sd = Math.sqrt(w.reduce((a, x) => a + (x - m[i]!) ** 2, 0) / n);
    return { mid: m[i]!, up: m[i]! + k * sd, lo: m[i]! - k * sd };
  });
}

// Swing pivots: a high (low) that is the highest (lowest) of `w` candles each side.
export type Pivot = { i: number; t: number; p: number; kind: "high" | "low" };
export function pivots(cs: Candle[], w = 3): Pivot[] {
  const out: Pivot[] = [];
  for (let i = w; i < cs.length - w; i++) {
    const win = cs.slice(i - w, i + w + 1);
    if (cs[i].h === Math.max(...win.map((c) => c.h))) out.push({ i, t: cs[i].t, p: cs[i].h, kind: "high" });
    if (cs[i].l === Math.min(...win.map((c) => c.l))) out.push({ i, t: cs[i].t, p: cs[i].l, kind: "low" });
  }
  return out;
}
// Support and resistance zones from pivots: pivots within `tol` (fraction of price) merge into one level.
export type Level = { p: number; touches: number; kind: "support" | "resistance" };
export function levels(cs: Candle[], ps: Pivot[], tol = 0.006): Level[] {
  const last = cs[cs.length - 1]?.c ?? 0, zones: { p: number; n: number }[] = [];
  for (const pv of ps) {
    const z = zones.find((x) => Math.abs(x.p - pv.p) / pv.p <= tol);
    if (z) { z.p = (z.p * z.n + pv.p) / (z.n + 1); z.n++; } else zones.push({ p: pv.p, n: 1 });
  }
  return zones.map((z) => ({ p: z.p, touches: z.n, kind: (z.p < last ? "support" : "resistance") as Level["kind"] })).sort((a, b) => a.p - b.p);
}
export function nearest(lv: Level[], price: number) {
  const below = lv.filter((x) => x.p < price).sort((a, b) => b.p - a.p)[0] ?? null;
  const above = lv.filter((x) => x.p > price).sort((a, b) => a.p - b.p)[0] ?? null;
  return { below, above };
}

// Least-squares line through points (x = candle index).
export function fit(pts: { i: number; p: number }[]) {
  const n = pts.length, sx = pts.reduce((a, q) => a + q.i, 0), sy = pts.reduce((a, q) => a + q.p, 0);
  const sxx = pts.reduce((a, q) => a + q.i * q.i, 0), sxy = pts.reduce((a, q) => a + q.i * q.p, 0);
  const d = n * sxx - sx * sx, slope = d ? (n * sxy - sx * sy) / d : 0;
  return { slope, icpt: (sy - slope * sx) / n };
}
// Auto trendlines: the 3 most recent swing highs (and lows), fitted; kept when 3+ candles touch the line
// (within tol), marked broken when the last close sits beyond it.
export type TLine = { kind: "rising support" | "falling resistance" | "support" | "resistance"; from: Pivot; to: Pivot; slope: number; icpt: number; touches: number; broken: boolean; at: (i: number) => number };
export function autoLines(cs: Candle[], ps: Pivot[], tol = 0.004): TLine[] {
  const out: TLine[] = [], n = cs.length - 1;
  for (const kind of ["high", "low"] as const) {
    const pts = ps.filter((x) => x.kind === kind).slice(-3);
    if (pts.length < 2) continue;
    const { slope, icpt } = fit(pts), at = (i: number) => icpt + slope * i;
    const touches = cs.slice(pts[0].i).filter((c, j) => { const y = at(pts[0].i + j), v = kind === "high" ? c.h : c.l; return Math.abs(v - y) / y <= tol; }).length;
    if (touches < 3) continue;
    const y = at(n), broken = kind === "high" ? cs[n].c > y : cs[n].c < y;
    const name = kind === "low" ? (slope > 0 ? "rising support" : "support") : slope < 0 ? "falling resistance" : "resistance";
    out.push({ kind: name, from: pts[0], to: pts[pts.length - 1], slope, icpt, touches, broken, at });
  }
  return out;
}

// Plain-words snapshot of where price sits. Describes state; never buy, sell, targets or predictions.
export type Snapshot = { last: number; at: number; ema20: number | null; ema50: number | null; ema200: number | null; rsi: number | null; atr: number | null; atrPct: number | null;
  volVsAvg: number | null; hi30: number; lo30: number; below: Level | null; above: Level | null; lv: Level[]; lineNow: { kind: string; y: number; broken: boolean }[]; lines: TLine[]; words: string[] };
export function snapshot(cs: Candle[]): Snapshot | null {
  if (cs.length < 30) return null;
  const c = cs.map((x) => x.c), n = cs.length - 1, last = c[n];
  const e20 = ema(c, 20)[n], e50 = ema(c, 50)[n], e200 = ema(c, 200)[n], r = rsi(c)[n], a = atr(cs)[n];
  const v20 = sma(cs.map((x) => x.v), 20)[n], ps = pivots(cs), lines = autoLines(cs, ps);
  // A level counts once price has turned there at least twice; single swing points are too noisy.
  const all = levels(cs, ps), strong = all.filter((x) => x.touches >= 2), nr = nearest(strong.length ? strong : all, last);
  const w30 = cs.slice(-30), hi30 = Math.max(...w30.map((x) => x.h)), lo30 = Math.min(...w30.map((x) => x.l));
  const words: string[] = [];
  if (e50 != null) words.push(`${last >= e50 ? "above" : "below"} the 50 EMA`);
  if (e200 != null) words.push(`${last >= e200 ? "above" : "below"} the 200 EMA`);
  if (r != null) words.push(`RSI ${Math.round(r)}${r >= 70 ? ", above 70" : r <= 30 ? ", below 30" : ""}`);
  if (a != null) words.push(`ATR ${((a / last) * 100).toFixed(1)}% of price`);
  if (nr.below) words.push(`nearest support ${fmt(nr.below.p)} (${(((last - nr.below.p) / last) * 100).toFixed(1)}% below)`);
  if (nr.above) words.push(`nearest resistance ${fmt(nr.above.p)} (${(((nr.above.p - last) / last) * 100).toFixed(1)}% above)`);
  for (const l of lines) words.push(`${l.kind} line ${l.broken ? "broken" : "intact"} (${l.touches} touches)`);
  const lv = strong.length ? strong : all, lineNow = lines.map((l) => ({ kind: l.kind, y: l.at(n), broken: l.broken }));
  return { lv, lineNow, last, at: cs[n].t, ema20: e20, ema50: e50, ema200: e200, rsi: r, atr: a, atrPct: a != null ? a / last : null, volVsAvg: v20 ? cs[n].v / v20 : null, hi30, lo30, below: nr.below, above: nr.above, lines, words };
}
export const fmt = (p: number) => (p >= 1000 ? p.toFixed(0) : p >= 1 ? p.toFixed(2) : p.toPrecision(4));

// Where an entry sits between levels: within one ATR of support or resistance, else mid-range.
export function contextAt(entry: number, lv: Level[], atrV: number | null) {
  const { below, above } = nearest(lv, entry), band = atrV ?? entry * 0.01;
  if (below && entry - below.p <= band) return "near support";
  if (above && above.p - entry <= band) return "near resistance";
  return "mid-range";
}
