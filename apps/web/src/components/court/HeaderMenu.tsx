"use client";

import { useEffect, useRef, useState } from "react";
import { useCourt } from "./CourtState";

// Header menu from dashboard-v52 (menuBtn opens hmenu). Settings, day or night and Export my data work;
// quiet queue, showcase and calm are still display only.

const THEME_KEY = "kumo.theme";

function effTheme(): "dark" | "light" {
  const set = document.documentElement.getAttribute("data-theme");
  if (set === "dark" || set === "light") return set;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

const MOON = (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="#FFB3D1" stroke="#A34876" strokeWidth="2" strokeLinejoin="round" /></svg>
);
const SUN = (
  <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="#FFD95E" stroke="#E888B3" strokeWidth="2" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" stroke="#E888B3" strokeWidth="2" strokeLinecap="round" /></svg>
);

export function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const { openSheet } = useCourt();

  useEffect(() => {
    setDark(effTheme() === "dark");
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const on = () => setDark(effTheme() === "dark");
    mq?.addEventListener("change", on);
    return () => mq?.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", esc); };
  }, [open]);

  function toggleTheme() {
    const nt = effTheme() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", nt);
    try { localStorage.setItem(THEME_KEY, nt); } catch { /* private window: choice lasts this visit only */ }
    setDark(nt === "dark");
  }

  return (
    <div className="hmenuwrap" ref={wrap}>
      <button className="icon-btn" id="menuBtn" type="button" aria-expanded={open} aria-controls="hmenu" aria-label="Menu" title="Menu" onClick={() => setOpen(!open)}>
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2" fill="#A34876" /><circle cx="12" cy="12" r="2" fill="#A34876" /><circle cx="19" cy="12" r="2" fill="#A34876" /></svg>
        <span className="cnt" id="menuDot" hidden>!</span>
      </button>
      <div id="hmenu" role="menu" hidden={!open}>
        <button className="icon-btn" id="bellBtn" data-lbl="Quiet queue" type="button" aria-label="Quiet queue, 0 waiting" title="Quiet queue">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z" fill="#FFD3E5" stroke="#A34876" strokeWidth="2" strokeLinejoin="round" /><path d="M10 21a2 2 0 0 0 4 0" fill="none" stroke="#A34876" strokeWidth="2" strokeLinecap="round" /></svg>
          <span className="cnt" id="bellCnt" hidden>0</span>
        </button>
        <button className="icon-btn" id="showBtn" data-lbl="Showcase mode" type="button" aria-pressed="false" aria-label="Showcase mode" title="Showcase mode: hides the extras for screen recording"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" fill="#FFD3E5" stroke="#A34876" strokeWidth="2" /><circle cx="12" cy="12" r="3.2" fill="#fff" stroke="#A34876" strokeWidth="2" /></svg></button>
        <button className="icon-btn" id="calmBtn" data-lbl="Calm mode" type="button" aria-pressed="false" aria-label="Calm mode" title="Calm mode">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14c3-5 6-5 8 0s5 5 8 0" fill="none" stroke="#A34876" strokeWidth="2.4" strokeLinecap="round" /><path d="M4 9c3-4 6-4 8 0s5 4 8 0" fill="none" stroke="#A34876" strokeWidth="2.4" strokeLinecap="round" opacity=".5" /></svg>
        </button>
        <button className="icon-btn" id="setBtn" data-lbl="Settings" type="button" aria-label="Settings" onClick={() => { setOpen(false); if (document.documentElement.getAttribute("data-ui") === "classic") openSheet({ kind: "settings" }); else window.location.hash = "settings"; }}><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5" fill="#FFD95E" stroke="#A34876" strokeWidth="2" /><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" stroke="#A34876" strokeWidth="2.2" strokeLinecap="round" /></svg></button>
        <button className="icon-btn" id="birthBtn" data-lbl="Birth details" type="button" aria-label="Birth details for Luna" onClick={() => { setOpen(false); if (document.documentElement.getAttribute("data-ui") === "classic") openSheet({ kind: "birth" }); else window.location.hash = "settings"; }}><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M15.5 4.5a8 8 0 1 0 4 10.6A6.5 6.5 0 0 1 15.5 4.5z" fill="#E7DEFF" stroke="#A34876" strokeWidth="2" strokeLinejoin="round" /><path d="M18 3l.7 1.6L20.3 5.3l-1.6.7L18 7.6l-.7-1.6-1.6-.7 1.6-.7z" fill="#FFD95E" /></svg></button>
        <button className="icon-btn" id="packetBtn" data-lbl="Weekly review (Kumo)" type="button" aria-label="Kumo's weekly review packet" onClick={() => { setOpen(false); if (document.documentElement.getAttribute("data-ui") === "classic") openSheet({ kind: "packet" }); else window.location.hash = "news"; }}><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="2.5" fill="#FFF4D6" stroke="#A34876" strokeWidth="2" /><path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" stroke="#A34876" strokeWidth="2" strokeLinecap="round" /></svg></button>
        <button className="icon-btn" id="themeBtn" data-lbl="Day or night" type="button" aria-label="Switch between day and night" onClick={toggleTheme}>{dark ? SUN : MOON}</button>
        <a className="icon-btn" id="progBtn" data-lbl="Progress" href="/progress" aria-label="Progress" title="Build progress"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V13M10 19V8M16 19v-4M22 19H2" fill="none" stroke="#A34876" strokeWidth="2.4" strokeLinecap="round" /></svg></a>
        <a className="icon-btn" id="expBtn" data-lbl="Export my data" href="/api/export" aria-label="Export my data" title="Export my data"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14" fill="none" stroke="#A34876" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></a>
      </div>
    </div>
  );
}
