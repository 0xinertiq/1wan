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

export type Headline = { title: string; why: string; links: { text: string; url: string }[] };

// "## Top 5 headlines": list items, headline in bold (or before a dash or colon), the rest is the why.
// Older briefs without it: the first line of each "##" block.
export function topFive(body: string): { items: Headline[]; fromSection: boolean } {
  const sec = section(body, /top\s*5\s*headlines?/i);
  if (sec) {
    const items: Headline[] = [];
    for (const l of sec) {
      const m = l.match(/^\s*(?:[-*•]|\d+[.)])\s+(.+)$/);
      if (!m) {
        if (items.length && l.trim()) { const last = items[items.length - 1]; last.why = strip(last.why + " " + l); last.links.push(...links(l)); }
        continue;
      }
      const t = m[1], b = t.match(/\*\*(.+?)\*\*/);
      const head = t.split(/\s[—–-]\s|:\s/)[0];
      const title = b ? strip(b[1]) : strip(head);
      const rest = b ? t.replace(b[0], "") : t.slice(head.length);
      items.push({ title, why: strip(rest.replace(/^\s*[—–:.-]\s*/, "")), links: links(t) });
      if (items.length === 5) break;
    }
    if (items.length) return { items, fromSection: true };
  }
  const items: Headline[] = [];
  for (const b of body.split(/\r?\n(?=##\s)/).slice(1)) {
    const [head, ...rest] = b.split(/\r?\n/);
    const first = rest.find((l) => l.trim() && !/^#/.test(l));
    if (first) items.push({ title: strip(head.replace(/^#+\s*/, "")), why: strip(first.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "")), links: links(first) });
    if (items.length === 5) break;
  }
  return { items, fromSection: false };
}

export type PlanRow = { ticker: string; grade: string; entry: string; stop: string; target: string; rr: string };

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
    const c = { ticker: col(/ticker|coin|symbol|asset|pair/), grade: col(/grade|setup|quality/), entry: col(/entry/), stop: col(/stop|sl\b|invalidation/), target: col(/target|tp\b|take/), rr: col(/r\s*:\s*r|r\/r|reward|rr\b/) };
    if (c.ticker < 0 || c.entry < 0 || c.stop < 0) continue;
    for (const l of lines.slice(i + 2)) {
      if (!/^\s*\|/.test(l)) break;
      const cells = l.split("|").slice(1, -1).map(strip);
      const g = (n: number) => (n >= 0 ? cells[n] ?? "" : "");
      rows.push({ ticker: g(c.ticker), grade: g(c.grade), entry: g(c.entry), stop: g(c.stop), target: g(c.target), rr: g(c.rr) });
    }
    break;
  }
  const noTrade = !rows.length && /\bno\s+(?:trade|setups?|valid setups?)\b/i.test(body);
  return { readThrough, rows, noTrade };
}

// A movers run that found nothing notable says so in its text.
export const isNoMovers = (body: string) => /\bno\s+(?:notable\s+|significant\s+|big\s+)?movers?\b|\bnothing\s+(?:moved|notable)\b/i.test(body);

// Kumo's weekly review: the summary (a "Summary" section, else the first paragraph) and up to three
// suggestions (a "Suggestions" / "Recommendations" / "Next week" section).
export function reviewParts(body: string): { summary: string; suggestions: string[] } {
  const para = (ls: string[]) => strip(ls.filter((l) => l.trim() && !/^#/.test(l) && !/^\s*\|/.test(l) && !/^\s*(?:[-*•]|\d+[.)])\s/.test(l)).slice(0, 3).join(" "));
  const sum = section(body, /summary|overview|the week/i);
  const firstPara = body.split(/\r?\n\s*\r?\n/).find((p) => p.trim() && !/^#/.test(p.trim()));
  const summary = sum ? para(sum) : para(firstPara?.split(/\r?\n/) ?? []);
  const sg = section(body, /suggest|recommend|next week|try this/i) ?? [];
  const suggestions = sg.map((l) => l.match(/^\s*(?:[-*•]|\d+[.)])\s+(.+)$/)?.[1]).filter((x): x is string => !!x).map(strip).slice(0, 3);
  return { summary: summary.slice(0, 400), suggestions };
}

// Sources line without any mention of Bigdata (permanently disconnected).
export function cleanSources(s: string | null): string | null {
  if (!s) return s;
  const kept = s.split(/[,;]\s*/).map((p) => p.trim()).filter((p) => p && !/big\s*data/i.test(p)).join(", ");
  return kept || null;
}
