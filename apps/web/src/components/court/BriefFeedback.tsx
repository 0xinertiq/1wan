"use client";

import { useRef, useState } from "react";

// Useful / not useful on a brief (v52 brFeedbackHtml), saved to the feedback table.
export function BriefFeedback({ kind, at, initial }: { kind: string; at: string; initial: { vote: "up" | "down"; note: string } | null }) {
  const [vote, setVote] = useState(initial?.vote ?? null);
  const [note, setNote] = useState(initial?.note ?? "");
  const [msg, setMsg] = useState("");
  const sent = useRef(initial?.note ?? "");

  async function send(v: "up" | "down", n = note) {
    setVote(v);
    sent.current = n;
    setMsg("Saving...");
    try {
      const r = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, at, vote: v, note: n }) });
      setMsg(r.ok ? "Thanks. The crew reads this." : "Not saved. Try again in a moment.");
    } catch {
      setMsg("Not saved. Try again in a moment.");
    }
  }

  return (
    <div className="brfb">
      <div className="brfr">
        <span className="note">Was this useful?</span>
        <button className="chipb" type="button" aria-pressed={vote === "up"} onClick={() => send("up")}>Useful</button>
        <button className="chipb" type="button" aria-pressed={vote === "down"} onClick={() => send("down")}>Not useful</button>
        {msg && <span className="note" role="status">{msg}</span>}
      </div>
      <input className="brin" type="text" maxLength={200} placeholder="One line on what to change (optional)" aria-label="What to change"
        value={note} onChange={(e) => setNote(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && vote) send(vote, note); }}
        onBlur={() => { if (vote && note !== sent.current) send(vote, note); }} />
    </div>
  );
}
