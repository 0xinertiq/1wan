"use client";

import { useState } from "react";

export type BriefDoc = { key: string; label: string; title: string; when: string; html: string };

// Brief tabs from dashboard-v52. Only switches which brief is shown; rating buttons are display only.
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
      <div className="brfb">
        <div className="brfr">
          <span className="note">Was this useful?</span>
          <button className="chipb" type="button">Useful</button>
          <button className="chipb" type="button">Needs work</button>
        </div>
        <input className="brin" type="text" maxLength={200} placeholder="One line on what to change (optional)" aria-label="What to change" />
      </div>
    </>
  );
}
