// "3 things that matter" for a brief card. Rules only, no AI: the brief's own Bottom line first,
// then its headings with the first line under each, else its first bullets or lines.
// Returns plain text (markdown stripped); the caller renders it as text, never as HTML.
const SKIP = /^(Daily Brief|Pulse Morning Brief|Weekend Pulse|Crypto Watchlist Scan)\b/;

export function plain(s: string) {
  return s
    .replace(/\s+—\s+\[.*$/, "")
    .replace(/\[([^\]]+)\]\((?:[^)]*)\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^(?:[-*•]|\d+[.)])\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

const cut = (s: string, max = 160) => (s.length > max ? s.slice(0, max - 1).replace(/\s+\S*$/, "") + "…" : s);

export function topThree(src: string): string[] {
  const lines = String(src || "").replace(/\r/g, "").split("\n").map((l) => l.trim()).filter(Boolean);
  const body = lines.filter((l, i) => !(i === 0 && (/^#\s/.test(l) || SKIP.test(l))) && l.charAt(0) !== "|");
  const out: string[] = [];
  const add = (s: string) => { const p = cut(plain(s)); if (p && !out.includes(p) && out.length < 3) out.push(p); };

  const bl = body.find((l) => /^\*\*Bottom line:?\*\*/i.test(l));
  if (bl) add(bl.replace(/^\*\*Bottom line:?\*\*:?\s*/i, ""));

  const heads = body.map((l, i) => [l, i] as const).filter(([l]) => /^#{2,4}\s+/.test(l));
  if (heads.length >= 2) {
    for (const [h, i] of heads) {
      const title = plain(h.replace(/^#{2,4}\s+/, ""));
      const nx = body[i + 1];
      const first = nx && !/^#{1,4}\s/.test(nx) ? plain(nx) : "";
      add(first ? `${title}: ${first}` : title);
    }
  } else {
    for (const l of body) if (!/^#{1,4}\s/.test(l) && !/^\*\*(Watch next|Gaps):?\*\*:?\s*$/i.test(l)) add(l);
  }
  return out;
}
