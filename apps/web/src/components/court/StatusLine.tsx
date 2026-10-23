"use client";

import { useCourt } from "./CourtState";
import { AGENTS } from "./agents";
import { RUNS, nextRun } from "@/lib/schedule";
import { hm, sgt } from "@/lib/court/time";
import type { BriefKind } from "@/lib/briefKinds";

// One small line under the stage, driven by real events only: a fetch that is running right now,
// the last brief filed today, and the next scheduled run. Nothing here is invented.

export type Latest = Partial<Record<BriefKind, { title: string; at: string }>>;

const short = (id: string) => AGENTS.find((a) => a.id === id)?.short ?? id;

export function StatusLine({ latest }: { latest: Latest }) {
  const { k, nm, pxBusy, cal } = useCourt();
  const parts: string[] = [];

  if (pxBusy) parts.push("Fenn is checking prices");
  if (cal.state === "loading") parts.push("Momo is reading your calendars");

  const filed = RUNS.map((r) => ({ r, b: latest[r.kind] }))
    .filter((x) => x.b && sgt(new Date(x.b.at)).key === k)
    .sort((a, b) => b.b!.at.localeCompare(a.b!.at))[0];
  if (filed && !parts.length) parts.push(`${short(filed.r.crew)} filed the ${hm(sgt(new Date(filed.b!.at)).min)} brief`);

  const nx = nextRun(k, nm);
  if (nx) parts.push(`${short(nx.run.crew)} next: ${nx.label}`);

  if (!parts.length) return null;
  return <p className="statusline" id="statusLine" aria-live="polite">{parts.join(" · ")}</p>;
}
