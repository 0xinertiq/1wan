"use client";

import type { VRow } from "@/lib/vault";
import type { Lens } from "@/lib/court/state";
import { PageHead } from "../ui";

// News. Research notes (Tilly) keep their type and lens filter here for the Dungeon and the tests.

export type Research = VRow & { kind: "note" | "macro"; title: string; text: string; tags: string[]; url?: string; pinned?: boolean; lens?: Exclude<Lens, "off">; watch?: string };

/** Which notes the strip shows for a lens: "any" shows every note; otherwise notes tagged to that lens. */
export const forLens = (rows: Research[], lens: Lens) => (lens === "off" ? [] : rows.filter((r) => r.kind !== "macro" && (lens === "any" || (r.lens ?? "trading") === lens)));

// Round 7: one column. Headlines first (following her lenses), then one Briefs card with Intel | Pulse. The
// scans and movers live in Trades; Kumo's weekly review and the packet live in Settings. The Saved and research
// strip is retired from the page: saved notes stay in research_notes, Export my data, and the Dungeon's attach list.
export function NewsPage({ headlines, library }: { headlines: React.ReactNode; library: React.ReactNode }) {
  return (
    <div className="kpage">
      <PageHead scene="board" title="News" sub="Headlines and briefs, following the lenses you chose in Settings." />
      {headlines}
      {library}
    </div>
  );
}
