// Round 22: the shared friend news feed. Categories, sources and the pure rules (de-duplication, expiry, a cap per
// category, the failed-source fallback, filtering by category), kept apart from the fetching so they are tested
// on their own. Headline, publisher, time, category and link only: never article text.

export type NewsCat = "crypto" | "macro" | "markets" | "world" | "local" | "tech" | "politics" | "health" | "science";
export const NEWS_CATS: NewsCat[] = ["crypto", "macro", "markets", "world", "local", "tech", "politics", "health", "science"];
export const CAT_LABEL: Record<NewsCat, string> = { crypto: "Crypto", macro: "Macro", markets: "Markets", world: "World", local: "Local (Singapore)", tech: "Tech", politics: "Politics & elections", health: "Health & wellness", science: "Science" };

// Free public RSS feeds, each checked live on 2 Nov 2026 (the first block also on 16 and 27 Oct). `publisher` is
// what the page shows: the publisher's own name, never a feed or data-provider name.
export type Source = { id: string; publisher: string; cat: NewsCat; url: string };
export const SOURCES: Source[] = [
  { id: "coindesk", publisher: "CoinDesk", cat: "crypto", url: "https://www.coindesk.com/arc/outboundfeeds/rss/" },
  { id: "cointelegraph", publisher: "Cointelegraph", cat: "crypto", url: "https://cointelegraph.com/rss" },
  { id: "decrypt", publisher: "Decrypt", cat: "crypto", url: "https://decrypt.co/feed" },
  { id: "theblock", publisher: "The Block", cat: "crypto", url: "https://www.theblock.co/rss.xml" },
  { id: "fed", publisher: "Federal Reserve", cat: "macro", url: "https://www.federalreserve.gov/feeds/press_all.xml" },
  { id: "ecb", publisher: "European Central Bank", cat: "macro", url: "https://www.ecb.europa.eu/rss/press.html" },
  { id: "bls", publisher: "US Bureau of Labor Statistics", cat: "macro", url: "https://www.bls.gov/feed/bls_latest.rss" },
  { id: "boj", publisher: "Bank of Japan", cat: "macro", url: "https://www.boj.or.jp/en/rss/whatsnew.xml" },
  { id: "cnbc", publisher: "CNBC", cat: "markets", url: "https://www.cnbc.com/id/10000664/device/rss/rss.html" },
  { id: "cna-biz", publisher: "CNA", cat: "markets", url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6936" },
  { id: "guardian-biz", publisher: "The Guardian", cat: "markets", url: "https://www.theguardian.com/uk/business/rss" },
  { id: "dw-biz", publisher: "DW", cat: "markets", url: "https://rss.dw.com/rdf/rss-en-bus" },
  { id: "bbc-world", publisher: "BBC", cat: "world", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
  { id: "aljazeera", publisher: "Al Jazeera", cat: "world", url: "https://www.aljazeera.com/xml/rss/all.xml" },
  { id: "guardian-world", publisher: "The Guardian", cat: "world", url: "https://www.theguardian.com/world/rss" },
  { id: "cna-asia", publisher: "CNA", cat: "world", url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=6511" },
  { id: "cna-sg", publisher: "CNA", cat: "local", url: "https://www.channelnewsasia.com/api/v1/rss-outbound-feed?_format=xml&category=10416" },
  { id: "st-sg", publisher: "The Straits Times", cat: "local", url: "https://www.straitstimes.com/news/singapore/rss.xml" },
  { id: "bt-sg", publisher: "The Business Times", cat: "local", url: "https://www.businesstimes.com.sg/rss/top-stories" },
  { id: "bbc-tech", publisher: "BBC", cat: "tech", url: "https://feeds.bbci.co.uk/news/technology/rss.xml" },
  { id: "ars", publisher: "Ars Technica", cat: "tech", url: "https://feeds.arstechnica.com/arstechnica/index" },
  { id: "verge", publisher: "The Verge", cat: "tech", url: "https://www.theverge.com/rss/index.xml" },
  { id: "guardian-tech", publisher: "The Guardian", cat: "tech", url: "https://www.theguardian.com/uk/technology/rss" },
  { id: "bbc-politics", publisher: "BBC", cat: "politics", url: "https://feeds.bbci.co.uk/news/politics/rss.xml" },
  { id: "guardian-politics", publisher: "The Guardian", cat: "politics", url: "https://www.theguardian.com/politics/rss" },
  { id: "dw-all", publisher: "DW", cat: "politics", url: "https://rss.dw.com/rdf/rss-en-all" },
  { id: "bbc-health", publisher: "BBC", cat: "health", url: "https://feeds.bbci.co.uk/news/health/rss.xml" },
  { id: "npr-health", publisher: "NPR", cat: "health", url: "https://feeds.npr.org/1128/rss.xml" },
  { id: "guardian-wellness", publisher: "The Guardian", cat: "health", url: "https://www.theguardian.com/lifeandstyle/health-and-wellbeing/rss" },
  { id: "bbc-science", publisher: "BBC", cat: "science", url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml" },
  { id: "nasa", publisher: "NASA", cat: "science", url: "https://www.nasa.gov/news-release/feed/" },
  { id: "sciencedaily", publisher: "ScienceDaily", cat: "science", url: "https://www.sciencedaily.com/rss/all.xml" },
  { id: "guardian-science", publisher: "The Guardian", cat: "science", url: "https://www.theguardian.com/science/rss" },
];

export type Item = { id: string; title: string; publisher: string; source: string; category: NewsCat; link: string; published_at: string | null; fetched_at: string };

export const KEEP_DAYS = 3;       // older items expire
export const PER_CAT = 40;        // newest kept per category
export const PER_SOURCE = 12;     // newest taken from one source per refresh, so a busy feed cannot crowd the rest

export const normLink = (u: string) => u.trim().replace(/^http:/i, "https:").replace(/[?#].*$/, "").replace(/\/+$/, "").toLowerCase();
export const normTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
/** A short stable id from the link (FNV-1a), so the same story saved twice is one row. */
export function idOf(link: string): string {
  let h = 0x811c9dc5;
  for (const ch of normLink(link)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(36) + "-" + normLink(link).length.toString(36);
}
const when = (x: Item) => x.published_at ?? x.fetched_at;

/** One copy of each story: the same link, or the same headline from another source; the first seen wins. */
export function dedupe(items: Item[]): Item[] {
  const seen = new Set<string>(), out: Item[] = [];
  for (const x of items) {
    const a = "u:" + normLink(x.link), b = "t:" + normTitle(x.title);
    if (seen.has(a) || seen.has(b)) continue;
    seen.add(a); seen.add(b);
    out.push(x);
  }
  return out;
}
/** Drops items older than KEEP_DAYS (by their published time, or when they were fetched if they have none). */
export const expire = (items: Item[], now: number, days = KEEP_DAYS) => items.filter((x) => Date.parse(when(x)) > now - days * 86400e3);
/** Newest first, at most `cap` per category. */
export function capPerCat(items: Item[], cap = PER_CAT): Item[] {
  const n = new Map<NewsCat, number>();
  return [...items].sort((a, b) => when(b).localeCompare(when(a))).filter((x) => { const c = n.get(x.category) ?? 0; n.set(x.category, c + 1); return c < cap; });
}
/**
 * The feed after one refresh: what was stored, plus what came in fresh, one copy each, expired items dropped and
 * capped per category. A source that failed this time simply has nothing fresh, so its last good items stay.
 */
export function nextFeed(stored: Item[], fresh: Item[], now: number): Item[] {
  return capPerCat(expire(dedupe([...stored, ...fresh]), now));
}
/** What a friend sees: their chosen categories ("any" shows everything), then the chip they tapped. */
export function forCats(items: Item[], cats: string[], chip: NewsCat | "all" = "all"): Item[] {
  const all = cats.includes("any") || !cats.some((c) => (NEWS_CATS as string[]).includes(c));
  return items.filter((x) => (all || cats.includes(x.category)) && (chip === "all" || x.category === chip));
}
