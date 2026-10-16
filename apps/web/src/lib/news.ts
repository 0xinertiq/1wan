// Server only. Fetches the RSS feeds in newsFeeds.ts, caches each for 15 minutes, and returns
// headline, source, group, time and link. A failing feed keeps its last good copy and never breaks the rest.

import { NEWS_FEEDS, type Feed, type NewsGroup } from "./newsFeeds";

export type Headline = { title: string; source: string; group: NewsGroup; at: string | null; link: string };
export type NewsResult = { at: string; items: Headline[]; feeds: { name: string; ok: boolean }[] };

const CACHE_MS = 15 * 60 * 1000;
const cache = new Map<string, { at: number; items: Headline[] }>();

const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", "#39": "'", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…" };
function clean(s: string) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+\d*);/gi, (m, e: string) => {
      if (e[0] === "#") { const n = e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return isFinite(n) ? String.fromCodePoint(n) : m; }
      return ENT[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, " ")
    .trim();
}
const tag = (block: string, name: string) => block.match(new RegExp(String.raw`<${name}(?:\s[^>]*)?>([\s\S]*?)</${name}>`, "i"))?.[1] ?? "";

function parseFeed(xml: string, f: Feed): Headline[] {
  const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s>][\s\S]*?<\/entry>/gi) ?? [];
  return blocks.slice(0, 30).flatMap((b) => {
    const title = clean(tag(b, "title")).slice(0, 220);
    let link = clean(tag(b, "link"));
    if (!link) link = b.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? "";
    if (!link) link = clean(tag(b, "guid"));
    const when = clean(tag(b, "pubDate") || tag(b, "dc:date") || tag(b, "updated") || tag(b, "published"));
    const t = Date.parse(when);
    if (!title || !/^https?:\/\//i.test(link)) return [];
    return [{ title, source: f.name, group: f.group, at: isNaN(t) ? null : new Date(t).toISOString(), link }];
  });
}

async function fetchFeed(f: Feed): Promise<Headline[]> {
  const hit = cache.get(f.id);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.items;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch(f.url, { signal: ctl.signal, cache: "no-store", headers: { "User-Agent": "Mozilla/5.0 (compatible; 1wan-dashboard/1.0)", Accept: "application/rss+xml, application/xml, text/xml" } });
    if (!r.ok) throw new Error("status " + r.status);
    const items = parseFeed(await r.text(), f);
    if (!items.length) throw new Error("no items");
    cache.set(f.id, { at: Date.now(), items });
    return items;
  } catch (e) {
    if (hit) return hit.items;
    throw e;
  } finally {
    clearTimeout(t);
  }
}

export async function loadNews(): Promise<NewsResult> {
  const res = await Promise.allSettled(NEWS_FEEDS.map(fetchFeed));
  const seen = new Set<string>();
  const items: Headline[] = [];
  res.forEach((r) => {
    if (r.status !== "fulfilled") return;
    // Newest 12 per source, so busy crypto feeds do not crowd out the Fed, ECB or SEC.
    const mine = [...r.value].sort((a, b) => (b.at ?? "").localeCompare(a.at ?? "")).slice(0, 12);
    for (const h of mine) {
      const k = h.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      if (seen.has(k)) continue;
      seen.add(k);
      items.push(h);
    }
  });
  const cutoff = Date.now() - 14 * 86400000;
  items.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
  return {
    at: new Date().toISOString(),
    items: items.filter((h) => !h.at || Date.parse(h.at) > cutoff).slice(0, 160),
    feeds: NEWS_FEEDS.map((f, i) => ({ name: f.name, ok: res[i].status === "fulfilled" })),
  };
}
