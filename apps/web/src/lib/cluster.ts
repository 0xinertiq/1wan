// News pipeline steps 3 to 6 (docs/build-intel.md C), deterministic and cheap: near-duplicate detection on
// headline trigrams, clustering, syndication flag, a 0 to 100 score from rules only, ad filter.
// Every original item is kept inside its cluster. Tests: tests/cluster.test.mjs.
export type Item = { title: string; source: string; tier: "primary" | "wire" | "media" | "social"; at: string | null; link: string; group?: string; region?: string };
export type Cluster = { lead: Item; items: Item[]; sources: number; independent: number; syndicated: boolean; score: number; why: string[] };

const STOP = new Set(["the", "a", "an", "of", "to", "in", "on", "for", "and", "or", "as", "at", "by", "with", "is", "are", "be", "its", "it", "from", "after", "over", "says", "say", "new"]);
export const norm = (t: string) => t.toLowerCase().replace(/&[a-z]+;/g, " ").replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w)).join(" ");
export function grams(t: string) { const s = ` ${norm(t)} `, g = new Set<string>(); for (let i = 0; i < s.length - 2; i++) g.add(s.slice(i, i + 3)); return g; }
export function sim(a: Set<string>, b: Set<string>) { let n = 0; for (const x of a) if (b.has(x)) n++; return n / (a.size + b.size - n || 1); }

// Ads, referral and price-spam headlines are dropped before clustering.
export const isSpam = (t: string) => /\b(sponsored|promoted|advertorial|partner content|use (?:my|this) (?:link|code)|referral|promo code|100x|to the moon|price prediction \d{4})\b/i.test(t);

const TIER: Record<Item["tier"], number> = { primary: 35, wire: 25, media: 15, social: 8 };

export function cluster(items: Item[], opts: { watch?: string[]; releases?: string[]; now?: number; threshold?: number } = {}): Cluster[] {
  const now = opts.now ?? Date.now(), th = opts.threshold ?? 0.45;
  const list = items.filter((x) => x.title && !isSpam(x.title)).sort((a, b) => (b.at ?? "").localeCompare(a.at ?? ""));
  const groups: { g: Set<string>; items: Item[] }[] = [];
  for (const it of list) {
    const g = grams(it.title);
    const hit = groups.find((c) => sim(c.g, g) >= th);
    if (hit) hit.items.push(it); else groups.push({ g, items: [it] });
  }
  const watch = (opts.watch ?? []).map((w) => w.toLowerCase()).filter((w) => w.length >= 2);
  const rel = (opts.releases ?? []).map(norm).filter(Boolean);
  return groups.map(({ items: xs }) => {
    const best = [...xs].sort((a, b) => TIER[b.tier] - TIER[a.tier] || (b.at ?? "").localeCompare(a.at ?? ""))[0];
    const sources = new Set(xs.map((x) => x.source)).size;
    // Independent = distinct wordings across different sources. Identical copies are syndication, counted once.
    const independent = new Set(xs.map((x) => norm(x.title))).size;
    const syndicated = sources > 1 && independent === 1;
    const why: string[] = [];
    let score = TIER[best.tier]; why.push(`${best.tier} source +${TIER[best.tier]}`);
    const newest = Math.max(...xs.map((x) => (x.at ? Date.parse(x.at) : 0)));
    const age = newest ? (now - newest) / 3600e3 : 99, rec = age < 1 ? 25 : age < 6 ? 18 : age < 24 ? 10 : 3;
    score += rec; why.push(`${age < 1 ? "under 1 hour" : age < 24 ? Math.round(age) + " hours" : "over a day"} old +${rec}`);
    const words = ` ${norm(xs.map((x) => x.title).join(" "))} `;
    const w = watch.find((s) => words.includes(` ${s} `));
    if (w) { score += 20; why.push(`mentions ${w.toUpperCase()} on your watchlist +20`); }
    if (rel.some((r) => r.split(" ").filter((t) => t.length > 2).every((t) => words.includes(` ${t} `)))) { score += 10; why.push("matches a scheduled release +10"); }
    const extra = Math.min(15, Math.max(0, independent - 1) * 5);
    if (extra) { score += extra; why.push(`${independent} independent sources +${extra}`); }
    if (syndicated) why.push("same wording in every source: syndicated, counted once");
    return { lead: best, items: xs, sources, independent, syndicated, score: Math.min(100, score), why };
  }).sort((a, b) => (b.lead.at ?? "").localeCompare(a.lead.at ?? ""));
}
