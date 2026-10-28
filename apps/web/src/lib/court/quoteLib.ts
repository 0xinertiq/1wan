// Her own quote library (round 12): typed, pasted or uploaded (.txt or .csv), never fetched from the internet.
// One quote per line, with an optional author after a "|" or in a second CSV column. Blank lines and duplicates
// are skipped, each quote is cut to 160 characters, and her library holds at most 500.
export type MyQuote = { t: string; a?: string };
export type QuoteSrc = "both" | "builtin" | "mine";
export const QUOTE_MAX = 160, LIBRARY_MAX = 500;

const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const key = (s: string) => clean(s).toLowerCase().replace(/[^a-z0-9 ]+/g, "");
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

/** One CSV line into cells (quoted cells may hold commas and doubled quotes). */
function csvCells(line: string) {
  const out: string[] = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === ",") { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur);
  return out;
}

/** Parse pasted or uploaded text. csv: read a second column as the author. existing: what she already has. */
export function parseQuotes(text: string, existing: { t: string }[] = [], csv = false) {
  const seen = new Set(existing.map((x) => key(x.t)));
  const add: MyQuote[] = []; let blank = 0, dup = 0, long = 0;
  for (const raw of text.split(/\r?\n/)) {
    if (!raw.trim()) { blank++; continue; }
    let t: string, a: string | undefined;
    if (raw.includes("|")) { const [q, ...rest] = raw.split("|"); t = q; a = rest.join("|"); }
    else if (csv) { const cells = csvCells(raw); t = cells[0] ?? ""; a = cells[1]; }
    else t = raw;
    t = clean(t).replace(/^["“]|["”]$/g, ""); a = a ? clean(a).replace(/^[-—–]\s*/, "") : undefined;
    if (!t) { blank++; continue; }
    if (t.length > QUOTE_MAX) { long++; t = cut(t, QUOTE_MAX); }
    const k = key(t);
    if (!k || seen.has(k)) { dup++; continue; }
    seen.add(k);
    add.push(a ? { t, a: cut(a, 60) } : { t });
  }
  const room = Math.max(0, LIBRARY_MAX - existing.length);
  return { add: add.slice(0, room), blank, dup, long, over: Math.max(0, add.length - room) };
}

/** The quotes the rotation draws from, by her choice (her own fall back to the built-in set when she has none). */
export function quotePool(builtin: string[], mine: MyQuote[], legacy: string[], src: QuoteSrc) {
  const own = [...legacy, ...mine.map((q) => (q.a ? `${q.t} — ${q.a}` : q.t))];
  if (src === "builtin" || !own.length) return builtin;
  return src === "mine" ? own : [...builtin, ...own];
}

export function normQuotes(v: unknown): { mine: MyQuote[]; src: QuoteSrc } {
  const o = v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  const mine = (Array.isArray(o.mine) ? o.mine : []).filter((q): q is MyQuote => !!q && typeof (q as MyQuote).t === "string" && !!(q as MyQuote).t.trim())
    .map((q) => ({ t: cut(clean(q.t), QUOTE_MAX), ...(typeof q.a === "string" && q.a.trim() ? { a: cut(clean(q.a), 60) } : {}) })).slice(0, LIBRARY_MAX);
  const src: QuoteSrc = o.src === "builtin" || o.src === "mine" ? o.src : "both";
  return { mine, src };
}
