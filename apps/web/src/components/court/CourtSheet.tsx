"use client";

import { useEffect, useRef } from "react";
import { PixelSprite } from "@/components/PixelSprite";
import { useCourt } from "./CourtState";
import { AGENTS } from "./agents";
import { BirthForm, SettingsLive } from "./live/SettingsLive";
import { WinsLive } from "./live/GrowLive";
import type { Latest } from "./StatusLine";
import { kindLabel } from "@/lib/briefs";
import { kindsOf, nextRun } from "@/lib/schedule";
import { hm, prettyDay, sgt } from "@/lib/court/time";
import { TAILS, earned, tailSvg } from "@/lib/court/tails";
import { LunaSky } from "./live/LunaSky";
import { useUi } from "@/components/kumo/useUi";
import { PacketLive } from "./live/PacketLive";

// One overlay for the crew detail (tap a character on the Court) and Settings (header menu).
// Crew detail shows role, latest output, last-updated time and next scheduled run, and nothing else.

function CrewDetail({ id, latest }: { id: string; latest: Latest }) {
  const { st, k, nm, openSheet } = useCourt();
  const ui = useUi();
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
      {id === "luna" && (ui === "new" ? <p><a href="#luna-card">Luna&apos;s card on the Court →</a></p> : <LunaSky />)}
      {id === "kumo" && (() => {
        const on = earned(st, k), n = on.filter(Boolean).length, nx = TAILS.find((_, i) => !on[i]);
        return <div className="tailrow">{ui === "new" ? <a className="btn sm" href="#review-card" onClick={() => openSheet(null)}>Weekly review packet</a> : <button className="btn sm" type="button" onClick={() => openSheet({ kind: "packet" })}>Weekly review packet</button>}<div dangerouslySetInnerHTML={{ __html: tailSvg(on) }} /><p className="note">Nine tails: {n} of 9.{nx ? ` Next, ${nx.n}: ${nx.h}.` : " All nine. Ascended."}</p></div>;
      })()}
    </div>
  );
}

export function CourtSheet({ latest }: { latest: Latest }) {
  const { st, k, nm, sheet, openSheet } = useCourt();
  const closeRef = useRef<HTMLButtonElement>(null);

  // The Gratitude sheet opens once at 21:30 SGT if nothing is saved for today yet.
  useEffect(() => {
    if (nm < 1290 || st.wins[k] || sheet) return;
    const key = "1wan-wins-asked";
    try { if (localStorage.getItem(key) === k) return; localStorage.setItem(key, k); } catch { return; }
    openSheet({ kind: "wins" });
  }, [nm, k, st.wins, sheet, openSheet]);

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
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={sheet.kind === "crew" ? "sheetT" : undefined} aria-label={sheet.kind === "settings" ? "Settings" : sheet.kind === "wins" ? "Gratitude" : sheet.kind === "birth" ? "Birth details" : sheet.kind === "packet" ? "Kumo's weekly review" : undefined}>
        <button ref={closeRef} className="btn sm ghost sheet-x" type="button" onClick={() => openSheet(null)}>Close</button>
        {sheet.kind === "crew" ? <CrewDetail id={sheet.id} latest={latest} /> : sheet.kind === "wins" ? <WinsLive onDone={() => openSheet(null)} /> : sheet.kind === "birth" ? <div className="detail"><BirthForm /></div> : sheet.kind === "packet" ? <PacketLive /> : <SettingsLive open />}
      </div>
    </div>
  );
}
