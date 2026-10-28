// Rule-based readers for brief text (no AI). Each reads only what the brief says; when a part is missing it
// returns nothing (or a fallback built from the brief's own lines), never made-up content.

const strip = (s: string) => s.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[*_`]+/g, "").replace(/\s+/g, " ").trim();
const links = (s: string) => [...s.matchAll(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g)].map((m) => ({ text: m[1], url: m[2] }));

// Lines of the section under a heading matching `re`, up to the next heading of the same or higher level.
function section(body: string, re: RegExp): string[] | null {
  const lines = body.split(/\r?\n/);
  const i = lines.findIndex((l) => /^#{1,4}\s/.test(l) && re.test(l));
  if (i < 0) return null;
  const lvl = lines[i].match(/^#+/)![0].length, out: string[] = [];
  for (const l of lines.slice(i + 1)) { const h = l.match(/^(#{1,4})\s/); if (h && h[1].length <= lvl) break; out.push(l); }
  return out;
}

export type Headline = { title: string; why: string; links: { text: string; url: string }[]; topic?: string };

// One brief item: a paragraph or list item that opens with a bold lead ("**The Fed is expected to hold...**",
// the format the Intel brief stores). The bold lead is the title, the rest is the why, and the trailing
// " — [Source](url), [Source](url)" tail becomes link chips only, so sources never show twice.
// `short` keeps only the first sentence of the why (the Court); News shows it whole.
const SRC_TAIL = /\s*(?:[—–-]\s*)?(?:\[[^\]]+\]\([^)]+\)[\s,;.]*(?:and\s+)?)+\s*$/;
const BOLD = /^\s*(?:(?:[-*•]|\d+[.)])\s+)?\*\*/;
const firstSentence = (s: string, short: boolean) => (short ? (s.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? s) : s);
function item(text: string, short: boolean): Headline {
  const t = text.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim();
  const b = t.match(/^\*\*(.+?)\*\*/);
  const ls = links(t);
  let rest = (b ? t.slice(b[0].length) : t).replace(SRC_TAIL, "");
  if (b) return { title: strip(b[1]), why: firstSentence(strip(rest).replace(/^[—–:.-]\s*/, ""), short), links: ls };
  const head = rest.split(/\s[—–-]\s|:\s/)[0];
  rest = rest.slice(head.length).replace(/^\s*[—–:.-]\s*/, "");
  return { title: strip(head), why: firstSentence(strip(rest), short), links: ls };
}

// Paragraphs (blank-line separated) or list items in a block of lines.
function chunks(lines: string[]): string[] {
  const out: string[] = [];
  let cur = "";
  for (const l of lines) {
    if (!l.trim()) { if (cur) out.push(cur); cur = ""; continue; }
    if (/^\s*(?:[-*•]|\d+[.)])\s+/.test(l) && cur) { out.push(cur); cur = l; continue; }
    cur = cur ? cur + " " + l.trim() : l;
  }
  if (cur) out.push(cur);
  return out;
}

// "## Top 5 headlines": its items, up to five, each its own numbered item. Older briefs without that block:
// one line per "##" section (the section's first item, with the section name as a small topic label).
export function topFive(body: string): { items: Headline[]; fromSection: boolean } {
  const sec = section(body, /top\s*5\s*headlines?/i);
  if (sec) {
    const items = chunks(sec).filter((c) => /\*\*|^\s*(?:[-*•]|\d+[.)])\s/.test(c)).map((c) => item(c, true)).slice(0, 5);
    if (items.length) return { items, fromSection: true };
  }
  const items: Headline[] = [];
  for (const s of briefSections(body).sections) {
    const it = s.items[0];
    if (it) items.push(it.title ? { ...it, why: firstSentence(it.why, true), topic: s.title } : { title: firstSentence(it.why, true), why: "", links: it.links, topic: s.title });
    if (items.length === 5) break;
  }
  return { items, fromSection: false };
}

// The whole brief as sections of uniform items (News). `structured` is false when the brief is not written as
// bold-lead items (scans with tables, older formats); the reader then shows the plain rendered text instead.
export function briefSections(body: string): { intro: string; sections: { title: string; items: Headline[] }[]; structured: boolean } {
  const parts = body.split(/\r?\n(?=##\s)/);
  const intro = strip(chunks(parts[0].split(/\r?\n/)).slice(1).join(" "));
  const sections = parts.slice(1).map((p) => {
    const [head, ...rest] = p.split(/\r?\n/);
    // A paragraph without a bold lead (a footer or note) keeps its text with no title.
    const its = chunks(rest).filter((c) => !/^\s*\|/.test(c) && !/^#/.test(c)).map((c) => (BOLD.test(c) ? item(c, false) : { title: "", why: strip(c.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").replace(SRC_TAIL, "")), links: links(c) }));
    return { title: strip(head.replace(/^#+\s*/, "")), items: its };
  });
  const all = parts.slice(1).flatMap((p) => chunks(p.split(/\r?\n/).slice(1)));
  const structured = all.length > 0 && all.filter((c) => BOLD.test(c)).length >= all.length * 0.7 && !/^\s*\|/m.test(body);
  return { intro, sections, structured };
}

export type PlanRow = { ticker: string; grade: string; entry: string; stop: string; target: string; rr: string; atr?: string };

// Scan's plan: the read-through sentence and the trade-plan table rows, or a "no trade" line.
export function todaysPlan(body: string): { readThrough: string | null; rows: PlanRow[]; noTrade: boolean } {
  const lines = body.split(/\r?\n/);
  const rt = lines.find((l) => /read[\s-]?through/i.test(l) && !/^\s*\|/.test(l));
  const readThrough = rt ? strip(rt.replace(/^#+\s*/, "").replace(/^\s*[*_]*read[\s-]?through[*_]*\s*[:：—-]?\s*[*_]*/i, "")) || null : null;
  const rows: PlanRow[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (!/^\s*\|/.test(lines[i]) || !/^\s*\|[\s:|-]+\|\s*$/.test(lines[i + 1] ?? "")) continue;
    const head = lines[i].split("|").slice(1, -1).map((c) => strip(c).toLowerCase());
    const col = (re: RegExp) => head.findIndex((h) => re.test(h));
    const c = { ticker: col(/ticker|coin|symbol|asset|pair/), grade: col(/grade|setup|quality/), entry: col(/entry/), stop: col(/stop|sl\b|invalidation/), target: col(/target|tp\b|take/), rr: col(/r\s*:\s*r|r\/r|reward|rr\b/), atr: col(/atr/) };
    if (c.ticker < 0 || c.entry < 0 || c.stop < 0) continue;
    for (const l of lines.slice(i + 2)) {
      if (!/^\s*\|/.test(l)) break;
      const cells = l.split("|").slice(1, -1).map(strip);
      const g = (n: number) => (n >= 0 ? cells[n] ?? "" : "");
      rows.push({ ticker: g(c.ticker), grade: g(c.grade), entry: g(c.entry), stop: g(c.stop), target: g(c.target), rr: g(c.rr), ...(c.atr >= 0 ? { atr: g(c.atr) } : {}) });
    }
    break;
  }
  const noTrade = !rows.length && /\bno\s+(?:trade|setups?|valid setups?)\b/i.test(body);
  return { readThrough, rows, noTrade };
}

// A movers run that found nothing notable says so in its text.
export const isNoMovers = (body: string) => /\bno\s+(?:notable\s+|significant\s+|big\s+)?movers?\b|\bnothing\s+(?:moved|notable)\b/i.test(body);

// Kumo's weekly review: the summary (a "Summary" section, else the first paragraph), the per-desk lines
// ("Intel: ...", "Scan: ...") and the suggestions (a "Suggestions" / "Next week" section, else the bullets).
export function reviewParts(body: string): { summary: string; desks: string[]; suggestions: string[] } {
  const para = (ls: string[]) => strip(ls.filter((l) => l.trim() && !/^#/.test(l) && !/^\s*\|/.test(l) && !/^\s*(?:[-*•]|\d+[.)])\s/.test(l)).slice(0, 3).join(" "));
  const sum = section(body, /summary|overview|the week/i);
  const firstPara = body.split(/\r?\n\s*\r?\n/).find((p) => p.trim() && !/^#/.test(p.trim()));
  const summary = sum ? para(sum) : para(firstPara?.split(/\r?\n/) ?? []);
  const sg = section(body, /suggest|recommend|next week|try this/i) ?? body.split(/\r?\n/);
  const suggestions = sg.map((l) => l.match(/^\s*(?:[-*•]|\d+[.)])\s+(.+)$/)?.[1]).filter((x): x is string => !!x).map(strip).slice(0, 8);
  const desks = body.split(/\r?\n/).filter((l) => /^\s*\*{0,2}[A-Z][\w ]{1,24}\*{0,2}:\s+\S/.test(l) && !/^\s*(?:[-*•]|\d+[.)])\s/.test(l)).map(strip).slice(0, 8);
  return { summary: summary.slice(0, 400), desks, suggestions };
}

// Sources line without any mention of Bigdata: the shared display scrubber (lib/noBigdata.ts).
export { noBigdataSources as cleanSources } from "@/lib/noBigdata";

// The Crypto scan on the Court (owner, round 5b): only the opening read-through and the Movers section, plus the
// top three coins by score from the Style Map table ("| A Pullback now | ZRO 75, NEAR 75 |"). The full scan
// (style map, trade plan, catalysts, gaps) stays complete in News.
export function scanCourt(body: string): { md: string; strongest: { ticker: string; score: number; bucket: string }[] } {
  const parts = body.split(/\r?\n(?=##\s)/);
  const movers = parts.slice(1).filter((p) => /^##\s*movers\b/i.test(p));
  const style = parts.slice(1).find((p) => /^##\s*style\s*map\b/i.test(p)) ?? "";
  const strongest: { ticker: string; score: number; bucket: string }[] = [];
  for (const row of style.split(/\r?\n/).filter((l) => /^\s*\|/.test(l) && !/^\s*\|[\s:|-]+\|?\s*$/.test(l))) {
    const [bucket, coins] = row.split("|").slice(1, 3).map((c) => strip(c ?? ""));
    if (!coins || /^bucket$/i.test(bucket)) continue;
    for (const m of coins.matchAll(/\b([A-Z0-9]{2,10})\s+(\d{1,3})\b/g)) strongest.push({ ticker: m[1], score: +m[2], bucket: bucket.replace(/^[A-Z]\s+/, "") });
  }
  strongest.sort((a, b) => b.score - a.score);
  return { md: [parts[0], ...movers].join("\n"), strongest: strongest.slice(0, 3) };
}
