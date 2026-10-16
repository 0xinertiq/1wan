"use client";

import { useState } from "react";

import { BriefFeedback } from "./BriefFeedback";

export type BriefDoc = {
  key: string; label: string; title: string; when: string; html: string;
  at: string; sources: string | null; vote: { vote: "up" | "down"; note: string } | null;
};

// Source-status line under each brief (Step 6). Says plainly when the task did not record its sources.
export function SourcesLine({ s }: { s: string | null }) {
  return <p className="note xd brsrc"><b>Sources:</b> {s ?? "not recorded by this task"}</p>;
}

// Brief tabs from dashboard-v52, with the source line and useful / not useful saved to feedback.
export function BriefTabs({ docs, initial }: { docs: BriefDoc[]; initial: string }) {
  const [sel, setSel] = useState(initial);
  const [open, setOpen] = useState(true);
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
      <div className={open ? "brb open" : "brb"} dangerouslySetInnerHTML={{ __html: d.html }} />
      <button className="btn sm ghost inline" type="button" onClick={() => setOpen(!open)}>
        {open ? "Show less" : "Read all"}
      </button>
      <SourcesLine s={d.sources} />
      <BriefFeedback key={d.key + d.at} kind={d.key} at={d.at} initial={d.vote} />
    </>
  );
}
