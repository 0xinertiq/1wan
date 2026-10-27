// Server only. Fetches the RSS feeds in newsFeeds.ts, caches each for 5 minutes, and returns
// headline, source, group, region, tier, time and link. Tracks source health per feed (in memory). A failing feed keeps its last good copy and never breaks the rest.

import { NEWS_FEEDS, type Feed, type NewsGroup, type Region, type Tier } from "./newsFeeds";

export type Headline = { title: string; source: string; sid: string; group: NewsGroup; region: Region; tier: Tier; at: string | null; link: string };
export type SourceStatus = "ok" | "no_new" | "failed" | "rate_limited" | "stale";
export type FeedHealth = { id: string; name: string; region: Region; tier: Tier; ok: boolean; status: SourceStatus; lastOk: string | null; newest: string | null; error?: string; ms?: number };
export type NewsResult = { at: string; items: Headline[]; feeds: FeedHealth[] };

const CACHE_MS = 5 * 60 * 1000;
const health = new Map<string, { lastOk: number | null; error?: string; ms?: number; rate?: boolean }>();
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
    return [{ title, source: f.name, sid: f.id, group: f.group, region: f.region ?? "Global", tier: f.tier ?? "media", at: isNaN(t) ? null : new Date(t).toISOString(), link }];
  });
}

async function fetchFeed(f: Feed): Promise<Headline[]> {
  const hit = cache.get(f.id);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.items;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000), t0 = Date.now();
  try {
    const r = await fetch(f.url, { signal: ctl.signal, cache: "no-store", headers: { "User-Agent": "Mozilla/5.0 (compatible; 1wan-dashboard/1.0)", Accept: "application/rss+xml, application/xml, text/xml" } });
    if (!r.ok) { if (r.status === 429) health.set(f.id, { ...health.get(f.id), lastOk: health.get(f.id)?.lastOk ?? null, rate: true }); throw new Error("status " + r.status); }
    const items = parseFeed(await r.text(), f);
    if (!items.length) throw new Error("no items");
    cache.set(f.id, { at: Date.now(), items });
    health.set(f.id, { lastOk: Date.now(), ms: Date.now() - t0 });
    return items;
  } catch (e) {
    const h = health.get(f.id);
    health.set(f.id, { lastOk: h?.lastOk ?? null, rate: h?.rate, error: e instanceof Error ? (e.name === "AbortError" ? "timed out" : e.message) : "failed" });
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
      // Exact dedupe: same URL or same normalised headline. Near-duplicates are clustered on the page.
      const k = h.title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(), u = h.link.replace(/[?#].*$/, "").replace(/\/$/, "");
      if (seen.has(k) || seen.has(u)) continue;
      seen.add(k); seen.add(u);
      items.push(h);
    }
  });
  const cutoff = Date.now() - 14 * 86400000;
  items.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
  return {
    at: new Date().toISOString(),
    items: items.filter((h) => !h.at || Date.parse(h.at) > cutoff).slice(0, 300),
    feeds: NEWS_FEEDS.map((f, i): FeedHealth => {
      const h = health.get(f.id), ok = res[i].status === "fulfilled";
      const newestT = ok ? Math.max(0, ...(res[i] as PromiseFulfilledResult<Headline[]>).value.map((x) => (x.at ? Date.parse(x.at) : 0))) : 0;
      // Failed now; stale when the last success is over 2 hours old; no_new when its newest item is over 3 days old.
      const status: SourceStatus = !ok ? (h?.rate ? "rate_limited" : "failed") : h?.error && h.lastOk && Date.now() - h.lastOk > 2 * 3600e3 ? "stale"
        : newestT && Date.now() - newestT > 3 * 86400e3 ? "no_new" : "ok";
      return { id: f.id, name: f.name, region: f.region ?? "Global", tier: f.tier ?? "media", ok, status, lastOk: h?.lastOk ? new Date(h.lastOk).toISOString() : null, newest: newestT ? new Date(newestT).toISOString() : null, error: h?.error, ms: h?.ms };
    }),
  };
}
