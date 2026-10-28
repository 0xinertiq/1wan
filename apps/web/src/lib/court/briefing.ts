import { grams, sim, type Cluster } from "@/lib/cluster";
import { headlineShown } from "./lenses";
import type { LensId } from "./state";

// Today's briefing on the News tab: built by rules from the scored headline clusters, no AI, no tokens.
// 1. keep stories in the lenses she follows (social-only stories are left to the Telegram chip);
// 2. round 9: group headlines about the same subject, by meaning rather than exact text: case and punctuation are
//    normalised, key entities (coins, the Fed, names) and numbers are compared, plus word overlap and trigram
//    similarity; only the best-scored headline of a group stays, its other sources are "also reported by";
// 3. rank by score, then by how recent, and take the top five. One line each: title, source, age, also reported by.
export type Story = { title: string; link: string; group: string; at: string | null; score: number; source: string; also: string[]; sources: string[]; why: string };

const STOP = new Set(["the", "a", "an", "of", "to", "in", "on", "for", "and", "or", "as", "at", "by", "with", "is", "are", "be", "its", "it", "from", "after", "over", "says", "say", "new", "amid", "into", "up", "down", "back", "more", "than", "this", "that", "will", "could", "may", "us", "says", "report", "reports", "live", "update", "news"]);
// Different words for the same subject.
const ALIAS: Record<string, string> = { btc: "bitcoin", bitcoins: "bitcoin", eth: "ethereum", ether: "ethereum", sol: "solana", xrp: "ripple", fomc: "fed", "federal": "fed", powell: "fed", rebound: "rebounds", rebounded: "rebounds", bounces: "rebounds", bounce: "rebounds", rallies: "rises", rally: "rises", jumps: "rises", climbs: "rises", gains: "rises", surges: "rises", falls: "drops", slides: "drops", tumbles: "drops", sinks: "drops", slumps: "drops", cuts: "cut", hikes: "hike" };
// The subject of a story: two headlines about different subjects (Bitcoin and Ethereum, the Fed and the ECB) are never
// merged, however alike the wording.
const ENTITY = new Set(["bitcoin", "ethereum", "solana", "ripple", "dogecoin", "fed", "ecb", "boj", "boe", "pboc", "rba", "mas", "nvidia", "apple", "tesla", "microsoft", "google", "amazon", "meta", "china", "japan", "singapore", "europe", "trump", "opec", "binance", "coinbase", "blackrock", "microstrategy", "gold", "oil"]);

/** Normalised meaning of a headline: content words (aliases folded), key entities and numbers. */
export function meaning(title: string) {
  const raw = title.toLowerCase().replace(/&[a-z]+;/g, " ").replace(/[’'`]/g, "");
  const nums = new Set((raw.match(/\d[\d,.]*\s?[km%]?/g) ?? []).map((n) => {
    const t = n.replace(/[,\s]/g, ""), v = parseFloat(t) * (/k$/.test(t) ? 1e3 : /m$/.test(t) ? 1e6 : 1);
    return Number.isFinite(v) ? String(Math.round(v * 100) / 100) + (t.endsWith("%") ? "%" : "") : t;
  }).filter((n) => !/^(19|20)\d\d$/.test(n)));   // years say nothing about the subject
  const words = raw.replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w) && !/^\d/.test(w)).map((w) => ALIAS[w] ?? w);
  const ents = new Set(words.filter((w) => ENTITY.has(w)));
  const dir = words.some((w) => UP.has(w)) ? "up" : words.some((w) => DOWN.has(w)) ? "down" : null;
  return { words: new Set(words), ents, nums, dir };
}
// Direction of a move: "Bitcoin rebounds" and "Bitcoin drops" are different stories.
const UP = new Set(["rises", "rebounds", "soars", "hike", "higher", "record", "high", "inflows"]);
const DOWN = new Set(["drops", "crashes", "plunges", "cut", "lower", "low", "outflows", "selloff"]);
const overlap = (a: Set<string>, b: Set<string>) => { let n = 0; for (const x of a) if (b.has(x)) n++; return n / (a.size + b.size - n || 1); };
const shares = (a: Set<string>, b: Set<string>) => [...a].some((x) => b.has(x));

/** Two headlines say the same thing: close wording, or the same subject with a shared number or overlapping words. */
export function sameStory(a: string, b: string, near = 0.35) {
  const x = meaning(a), y = meaning(b);
  // different named subjects are different stories
  if (x.ents.size && y.ents.size && !shares(x.ents, y.ents)) return false;
  if (x.dir && y.dir && x.dir !== y.dir) return false;
  if (sim(grams(a), grams(b)) >= near) return true;
  const w = overlap(x.words, y.words);
  if (!shares(x.ents, y.ents)) return w >= 0.6;
  return w >= 0.25 || (x.nums.size > 0 && shares(x.nums, y.nums));
}

export function briefing(clusters: Cluster[], lenses: LensId[], n = 5): { stories: Story[]; headlines: number } {
  const keep = clusters.filter((c) => c.items.some((x) => x.tier !== "social") && headlineShown(c.lead.group ?? "", lenses));
  const headlines = keep.reduce((t, c) => t + c.items.filter((x) => x.tier !== "social").length, 0);
  const groups: { titles: string[]; s: Story; lift?: string }[] = [];
  for (const c of [...keep].sort((a, b) => b.score - a.score || (b.lead.at ?? "").localeCompare(a.lead.at ?? ""))) {
    const titles = [...new Set(c.items.filter((x) => x.tier !== "social").map((x) => x.title))];
    const names = [...new Set(c.items.filter((x) => x.tier !== "social").map((x) => x.source))];
    // compare with each group's lead only, so matches never chain from one story to the next
    const twin = groups.find((g) => titles.some((u) => sameStory(g.s.title, u)));
    if (twin) { twin.titles.push(...titles); twin.s.sources = [...new Set([...twin.s.sources, ...names])]; twin.s.also = twin.s.sources.filter((x) => x !== twin.s.source); continue; }
    // round 10 (D4): why this story: its score, how many sources, and the rule that lifted it most
    const lift = c.why.find((w) => /watchlist|release|independent/.test(w));
    groups.push({ titles, s: { title: c.lead.title, link: c.lead.link, group: c.lead.group ?? "", at: c.lead.at ?? null, score: c.score, source: c.lead.source, sources: names, also: names.filter((x) => x !== c.lead.source), why: "" }, lift });
  }
  for (const g of groups) g.s.why = [`score ${g.s.score}`, `${g.s.sources.length} source${g.s.sources.length === 1 ? "" : "s"}`, g.lift].filter(Boolean).join(" · ");
  const ranked = groups.map((g) => g.s).sort((a, b) => b.score - a.score || (b.at ?? "").localeCompare(a.at ?? ""));
  // hard check across all items: no two stories in the briefing may be the same story
  const stories: Story[] = [];
  for (const x of ranked) {
    const twin = stories.find((y) => sameStory(y.title, x.title));
    if (twin) { twin.sources = [...new Set([...twin.sources, ...x.sources])]; twin.also = twin.sources.filter((s) => s !== twin.source); continue; }
    if (stories.length < n) stories.push(x);
  }
  return { stories, headlines };
}
