// One place that maps brief kind names. The old dashboard used pulse/intel/scan/movers;
// the database rows imported from her scheduled tasks use weekday/daily/scan/movers.
// Every reader and the ingest endpoint go through canonKind().

export type BriefKind = "pulse" | "intel" | "scan" | "movers" | "review";

export const BRIEF_KINDS: Record<BriefKind, { label: string; aliases: string[] }> = {
  pulse: { label: "Pulse", aliases: ["pulse", "weekday", "weekend", "pulse-weekday", "pulse-weekend", "morning"] },
  intel: { label: "Intelligence", aliases: ["intel", "daily", "intelligence", "daily-intel"] },
  scan: { label: "Crypto scan", aliases: ["scan", "watchlist", "watchlist-scan"] },
  movers: { label: "Midday movers", aliases: ["movers", "midday", "midday-movers"] },
  review: { label: "Kumo weekly review", aliases: ["review", "weekly", "weekly-review"] },
};

// Tab order, as in v52 BKEYS (review added at the end).
export const KIND_ORDER: BriefKind[] = ["pulse", "intel", "scan", "movers", "review"];

const ALIAS = new Map<string, BriefKind>();
for (const [k, v] of Object.entries(BRIEF_KINDS) as [BriefKind, (typeof BRIEF_KINDS)[BriefKind]][]) for (const a of v.aliases) ALIAS.set(a, k);

export function canonKind(raw: unknown): BriefKind | null {
  if (typeof raw !== "string") return null;
  return ALIAS.get(raw.trim().toLowerCase()) ?? null;
}

// Every stored name that means this kind, for database filters.
export const kindAliases = (k: BriefKind) => BRIEF_KINDS[k].aliases;
