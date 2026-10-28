// Display-only scrubber for Bigdata.com (permanently disconnected). Used by every place that renders brief,
// review, desk-note or sources text (the page builds every brief through it; desk notes and source lines too).
// Stored data and the ingest / export routes are untouched. Removes, in any capitalisation:
// - whole headings, list items and table rows that mention Bigdata;
// - link chips and list entries ("Sources: Bigdata.com, CNBC") that mention it, and parentheticals about it;
// - any remaining sentence that mentions it (such as "Bigdata.com was unavailable, so ...").
const BIG = /big\s*data/i;

function line(l: string): string | null {
  if (!BIG.test(l)) return l;
  if (/^\s*(?:\||[-*•]\s|\d+[.)]\s|#)/.test(l)) return null;
  let s = l.replace(/\[[^\]]*\]\([^)]*\)/g, (m) => (BIG.test(m) ? "" : m)).replace(/\s*\([^)]*big\s*data[^)]*\)/gi, "");
  s = s.replace(/(\)|\s)\s*,\s*(?=$|\s*[.;])/g, "$1").replace(/\s*[—–-]\s*$/, "").replace(/(\))\s*,\s*$/, "$1");
  // A labelled list ("Sources: A, B", "**Gaps:** A; B"): drop the entries that mention Bigdata, keep the rest.
  const lab = /^(\s*(?:\*\*[^*]{1,30}:\*\*|[A-Z][\w ]{1,24}:))\s*(.*)$/.exec(s);
  if (lab && BIG.test(lab[2])) {
    const sep = /;/.test(lab[2]) ? "; " : ", ";
    const kept = lab[2].split(/\s*[;,·]\s*/).filter((x) => x && !BIG.test(x)).join(sep).trim();
    return kept ? `${lab[1]} ${kept}` : null;
  }
  // Prose: drop every sentence that mentions it.
  s = s.split(/(?<=[.!?])\s+/).filter((x) => !BIG.test(x)).join(" ").replace(/\s{2,}/g, " ").trim();
  return s && !/^\s*(?:\*\*[^*]{1,30}:\*\*|[A-Z][\w ]{1,24}:)\s*$/.test(s) ? s : null;
}

export function noBigdata(text: string): string;
export function noBigdata(text: string | null): string | null;
export function noBigdata(text: string | null): string | null {
  if (text == null) return text;
  return text.split(/\r?\n/).map(line).filter((l): l is string => l !== null).join("\n");
}

// A sources list ("RSS; Bigdata.com", "Bigdata unavailable, used web search"): drop the entries that mention it.
export function noBigdataSources(s: string | null): string | null {
  if (!s) return s;
  const kept = s.split(/[,;]\s*/).map((p) => p.trim()).filter((p) => p && !BIG.test(p)).join(", ");
  return kept || null;
}
