import { grams, sim, type Cluster } from "@/lib/cluster";
import { headlineShown } from "./lenses";
import type { LensId } from "./state";

// Today's briefing on the News tab (round 8): built by rules from the scored headline clusters, no AI, no tokens.
// 1. keep stories in the lenses she follows (social-only stories are left to the Telegram chip);
// 2. group near-duplicates that the feed clustering kept apart (similar lead titles), adding up their sources;
// 3. rank by score, then by how recent, and take the top five. One line each: title, sources, age.
export type Story = { title: string; link: string; group: string; at: string | null; score: number; sources: string[] };

export function briefing(clusters: Cluster[], lenses: LensId[], n = 5, near = 0.35): { stories: Story[]; headlines: number } {
  const keep = clusters.filter((c) => c.items.some((x) => x.tier !== "social") && headlineShown(c.lead.group ?? "", lenses));
  const headlines = keep.reduce((t, c) => t + c.items.length, 0);
  const groups: { g: Set<string>; s: Story }[] = [];
  for (const c of [...keep].sort((a, b) => b.score - a.score)) {
    const g = grams(c.lead.title), names = [...new Set(c.items.map((x) => x.source))];
    const twin = groups.find((x) => sim(x.g, g) >= near);
    if (twin) { twin.s.sources = [...new Set([...twin.s.sources, ...names])]; continue; }
    groups.push({ g, s: { title: c.lead.title, link: c.lead.link, group: c.lead.group ?? "", at: c.lead.at ?? null, score: c.score, sources: names } });
  }
  const stories = groups.map((x) => x.s).sort((a, b) => b.score - a.score || (b.at ?? "").localeCompare(a.at ?? "")).slice(0, n);
  return { stories, headlines };
}
