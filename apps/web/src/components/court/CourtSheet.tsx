"use client";

import { useEffect, useRef } from "react";
import { PixelSprite } from "@/components/PixelSprite";
import { useCourt } from "./CourtState";
import { AGENTS } from "./agents";
import { SettingsLive } from "./live/SettingsLive";
import type { Latest } from "./StatusLine";
import { kindLabel } from "@/lib/briefs";
import { kindsOf, nextRun } from "@/lib/schedule";
import { hm, prettyDay, sgt } from "@/lib/court/time";

// One overlay for the crew detail (tap a character on the Court) and Settings (header menu).
// Crew detail shows role, latest output, last-updated time and next scheduled run, and nothing else.

function CrewDetail({ id, latest }: { id: string; latest: Latest }) {
  const { k, nm } = useCourt();
  const d = AGENTS.find((a) => a.id === id);
  if (!d) return null;
  const mine = kindsOf(id).map((kind) => ({ kind, b: latest[kind] })).filter((x) => x.b).sort((a, b) => b.b!.at.localeCompare(a.b!.at))[0];
  const nx = nextRun(k, nm, id);
  let when = "";
  if (mine) {
    const t = sgt(new Date(mine.b!.at));
    when = `${t.key === k ? "Today" : prettyDay(t.key)} ${hm(t.min)}`;
  }
  return (
    <div className="detail crewd">
      <div className="dhead">
        <div className="mini"><PixelSprite name={d.sprite} /></div>
        <div><b id="sheetT">{d.name}</b><span className="role">{d.role}</span></div>
      </div>
      <dl className="crewfacts">
        <dt>Latest output</dt>
        <dd>{mine ? `${kindLabel(mine.kind)}: ${mine.b!.title || kindLabel(mine.kind)}` : "Nothing filed yet"}</dd>
        <dt>Last updated</dt>
        <dd>{when || "Not yet"}</dd>
        <dt>Next scheduled run</dt>
        <dd>{nx ? `${kindLabel(nx.run.kind)}, ${nx.label}` : "No scheduled task"}</dd>
      </dl>
    </div>
  );
}

export function CourtSheet({ latest }: { latest: Latest }) {
  const { sheet, openSheet } = useCourt();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!sheet) return;
    closeRef.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") openSheet(null); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [sheet, openSheet]);

  if (!sheet) return null;
  return (
    <div className="sheet-bg" onPointerDown={(e) => { if (e.target === e.currentTarget) openSheet(null); }}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={sheet.kind === "crew" ? "sheetT" : undefined} aria-label={sheet.kind === "settings" ? "Settings" : undefined}>
        <button ref={closeRef} className="btn sm ghost sheet-x" type="button" onClick={() => openSheet(null)}>Close</button>
        {sheet.kind === "crew" ? <CrewDetail id={sheet.id} latest={latest} /> : <SettingsLive open />}
      </div>
    </div>
  );
}
