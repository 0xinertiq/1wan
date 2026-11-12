"use client";

import { useEffect, useRef, useState } from "react";
import { DAY_EVENT, type DayDoneDetail } from "@/lib/court/feel";

// Game loop G2: the day-complete sheet. A calm pop-up on top of the page (fixed, never part of the layout), shown once
// per game day. Tap Continue, tap outside or press Escape to close. Reduced motion: no pop-in. Wording is kind, never
// about shortfalls.
export function DayComplete() {
  const [d, setD] = useState<DayDoneDetail | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let t: number | undefined;
    const on = (e: Event) => { const x = (e as CustomEvent<DayDoneDetail>).detail; window.clearTimeout(t); t = window.setTimeout(() => setD(x), 450); };
    window.addEventListener(DAY_EVENT, on);
    return () => { window.removeEventListener(DAY_EVENT, on); window.clearTimeout(t); };
  }, []);
  useEffect(() => {
    if (!d) return;
    btn.current?.focus();
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setD(null); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [d]);
  if (!d) return null;
  const calm = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return (
    <div role="presentation" onClick={() => setD(null)} style={{ position: "fixed", inset: 0, zIndex: 9998, display: "grid", placeItems: "center", background: "var(--k-glass)", padding: 16 }}>
      <div role="dialog" aria-modal="true" aria-labelledby="ddT" onClick={(e) => e.stopPropagation()}
        style={{ width: "min(92vw, 340px)", textAlign: "center", background: "var(--k-bg)", color: "var(--k-text)", border: "2px solid var(--k-line)", borderRadius: 16, boxShadow: "var(--k-shadow-card)", padding: "24px 20px", animation: calm ? undefined : "ddIn .28s cubic-bezier(.2,.8,.3,1.2)" }}>
        <style>{"@keyframes ddIn{from{transform:scale(.88);opacity:0}to{transform:scale(1);opacity:1}}"}</style>
        <svg width="64" height="64" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden="true" style={{ imageRendering: "pixelated" }}>
          <rect x="2" y="2" width="12" height="12" fill="var(--k-gold-500)" stroke="var(--k-plum-900)" strokeWidth="1" />
          <path d="M5 8.5l2 2 4-4.5" fill="none" stroke="var(--k-plum-900)" strokeWidth="1.6" />
        </svg>
        <h2 id="ddT" style={{ margin: "12px 0 4px", font: "inherit", fontWeight: 800, fontSize: 22 }}>Day complete</h2>
        <p style={{ margin: "0 0 4px" }}>Your 3 core quests are done.</p>
        <p style={{ margin: "0 0 4px" }}><b>+{d.xp} XP</b>{d.comeback ? " · welcome back, this day counts double" : ""}</p>
        {d.level ? <p style={{ margin: "0 0 4px" }}>Level {d.level}</p> : null}
        <p style={{ margin: "0 0 16px" }}>{d.streak} {d.streak === 1 ? "done day" : "done days"} in a row</p>
        <button ref={btn} type="button" className="btn" onClick={() => setD(null)}>Continue</button>
      </div>
    </div>
  );
}
