"use client";

import { NewsRoom } from "@/components/kumo/decor/MoreRooms";
import type { VRow } from "@/lib/vault";
import type { Lens } from "@/lib/court/state";
import { PageHead } from "../ui";

// News. Research notes (Tilly) keep their type and lens filter here for the tests; the notes themselves live in
// research_notes (Trades macro desk, Export my data).

export type Research = VRow & { kind: "note" | "macro"; title: string; text: string; tags: string[]; url?: string; pinned?: boolean; lens?: Exclude<Lens, "off">; watch?: string };

/** Which notes the strip shows for a lens: "any" shows every note; otherwise notes tagged to that lens. */
export const forLens = (rows: Research[], lens: Lens) => (lens === "off" ? [] : rows.filter((r) => r.kind !== "macro" && (lens === "any" || (r.lens ?? "trading") === lens)));

// Round 8: one column. Today's briefing (rules only, from the scored headlines) above the headlines, both following
// her lenses. The Intel and Pulse briefs live on the Court; the scans and movers in Trades; Kumo's weekly review and
// the packet in Settings. Saved research notes stay in research_notes and Export my data.
export function NewsPage({ headlines }: { headlines: React.ReactNode }) {
  return (
    <div className="kpage">
      <PageHead room={<NewsRoom />} title="News" sub="Today's briefing and the headlines, following the lenses you chose in Settings." />
      {headlines}
    </div>
  );
}
