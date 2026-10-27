"use client";

import { useState } from "react";
import { BriefFeedback } from "./BriefFeedback";
import { SourcesLine, TopThree, type BriefDoc } from "./BriefTabs";

// Briefs and scans on the New-look Court: one compact card each for the latest Intel, Scan, Movers and Kumo's
// weekly review. Title, time, the first lines, Open for the full text, the source line, and the same
// useful / not useful feedback Classic has. A desk with nothing filed yet says so.
const KINDS: { key: string; label: string; empty: string }[] = [
  { key: "intel", label: "Intelligence", empty: "No intelligence brief yet. The 07:42 brief lands here." },
  { key: "scan", label: "Watchlist scan", empty: "No scan yet. The 03:50 scan lands here." },
  { key: "movers", label: "Midday movers", empty: "No movers note yet. The 14:30 run lands here." },
  { key: "review", label: "Kumo's weekly review", empty: "No weekly review yet. Kumo files it on Sunday at 08:50." },
];

function Card({ k, d }: { k: (typeof KINDS)[number]; d: BriefDoc | undefined }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="bcard" aria-label={k.label}>
      <div className="bcard-h"><span className="bcard-k">{k.label}</span>{d?.when && <span className="note">{d.when}</span>}</div>
      {d ? (
        <>
          <h3>{d.title}</h3>
          <TopThree top={d.top} />
          {open && <div className="brb open" dangerouslySetInnerHTML={{ __html: d.html }} />}
          <button className="btn sm ghost" type="button" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Close" : "Open"}</button>
          <SourcesLine s={d.sources} />
          <BriefFeedback key={d.key + d.at} kind={d.key} at={d.at} initial={d.vote} />
        </>
      ) : <p className="note">{k.empty}</p>}
    </article>
  );
}

export function BriefCards({ docs }: { docs: BriefDoc[] }) {
  return (
    <section className="win kbriefs" aria-labelledby="kbT">
      <div className="win-title"><h2 id="kbT">Briefs and scans</h2><span className="sub">tracking only, never advice</span></div>
      <div className="win-body bcards">
        {KINDS.map((k) => <Card key={k.key} k={k} d={docs.find((x) => x.key === k.key)} />)}
      </div>
    </section>
  );
}
