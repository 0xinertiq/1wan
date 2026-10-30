"use client";

import { useState } from "react";

import { cleanSources } from "@/components/kumo/briefParse";
import { BriefFeedback } from "./BriefFeedback";

export type BriefDoc = {
  key: string; label: string; title: string; when: string; html: string; top: string[];
  at: string; sources: string | null; vote: { vote: "up" | "down"; note: string } | null;
  body?: string;   // raw markdown, for the rule-based readers on the New-look Court
};

// The sources a brief recorded, as small names joined by a middle dot (no label); nothing when it recorded none.
// cleanSources is the shared Bigdata scrubber for sources lines.
export function SourcesLine({ s }: { s: string | null }) {
  const c = cleanSources(s);
  return c ? <p className="brsrc-line">{c.split(/\s*[,;]\s*/).filter(Boolean).join(" · ")}</p> : null;
}

// "3 things that matter": plain text from the brief's own headings or first lines (lib/briefTop.ts), no AI.
export function TopThree({ top }: { top: string[] }) {
  if (!top.length) return null;
  return (
    <div className="brtop">
      <p className="note"><b>{top.length === 3 ? "3 things that matter" : "What matters"}</b></p>
      <ol>{top.map((t) => <li key={t}>{t}</li>)}</ol>
    </div>
  );
}

// Brief tabs from dashboard-v52, with the source line and useful / not useful saved to feedback.
export function BriefTabs({ docs, initial }: { docs: BriefDoc[]; initial: string }) {
  const [sel, setSel] = useState(initial);
  const [open, setOpen] = useState(false);
  const d = docs.find((x) => x.key === sel) ?? docs[0];
  return (
    <>
      <div className="ntabs" role="group" aria-label="Briefs">
        {docs.map((k) => (
          <button key={k.key} className="chipb" type="button" aria-pressed={k.key === d.key} onClick={() => setSel(k.key)}>
            {k.label}
          </button>
        ))}
      </div>
      <p className="note brh">
        <b>{d.title}</b>
        {d.when && ` · ${d.when}`}
      </p>
      <TopThree top={d.top} />
      <div className={open ? "brb open" : "brb"} dangerouslySetInnerHTML={{ __html: d.html }} />
      <button className="btn sm ghost inline" type="button" onClick={() => setOpen(!open)}>
        {open ? "Show less" : "Read the full brief"}
      </button>
      <SourcesLine s={d.sources} />
      <BriefFeedback key={d.key + d.at} kind={d.key} at={d.at} initial={d.vote} />
    </>
  );
}
