"use client";

import { useEffect, useState } from "react";
import * as A from "astronomy-engine";
import { moonPhase } from "@/lib/sky";

// The Court sky from Luna's real data: sun height over Singapore sets the colour (night, dawn, day, dusk),
// and the moon shows its true phase and sits where it really is. Refreshes every 5 minutes.
const SG = new A.Observer(1.29, 103.85, 15);
type Sky = { phase: "night" | "dawn" | "day" | "dusk"; sun: { alt: number; az: number }; moon: { alt: number; az: number; ill: number; waxing: boolean; name: string } };

function altAz(body: A.Body, d: Date) {
  const eq = A.Equator(body, d, SG, true, true);
  const h = A.Horizon(d, SG, eq.ra, eq.dec, "normal");
  return { alt: h.altitude, az: h.azimuth };
}
export function readSky(d: Date): Sky {
  const sun = altAz(A.Body.Sun, d), m = altAz(A.Body.Moon, d), mp = moonPhase(d);
  const phase = sun.alt < -6 ? "night" : sun.alt < 6 ? (sun.az < 180 ? "dawn" : "dusk") : "day";
  return { phase, sun, moon: { ...m, ill: mp.ill, waxing: mp.angle < 180, name: mp.name } };
}

// East on the left, west on the right; higher in the sky = higher on the stage.
const place = (alt: number, az: number) => ({ left: Math.max(4, Math.min(86, 4 + ((az - 60) / 240) * 82)) + "%", top: Math.max(3, 36 - (Math.max(0, alt) / 90) * 32) + "%" });

// Lit part of the moon: outer limb on the lit side, terminator as a half ellipse.
function moonPath(ill: number, waxing: boolean, r = 20, c = 22) {
  const rx = r * Math.abs(1 - 2 * ill), gib = ill > 0.5;
  const limb = waxing ? 1 : 0, term = waxing ? (gib ? 1 : 0) : gib ? 0 : 1;
  return `M${c} ${c - r}A${r} ${r} 0 0 ${limb} ${c} ${c + r}A${rx} ${r} 0 0 ${term} ${c} ${c - r}Z`;
}

export function StageSky() {
  const [sky, setSky] = useState<Sky | null>(null);
  useEffect(() => {
    const run = () => setSky(readSky(new Date()));
    run();
    const t = window.setInterval(run, 5 * 60 * 1000);
    return () => window.clearInterval(t);
  }, []);
  useEffect(() => {
    const st = document.getElementById("stage");
    if (st && sky) st.dataset.sky = sky.phase;
  }, [sky]);
  if (!sky) return null;
  const { sun, moon } = sky;
  const pct = Math.round(moon.ill * 100);
  return (
    <>
      {sun.alt > -1 && <div className="orb sun" style={place(sun.alt, sun.az)} aria-hidden="true"></div>}
      {moon.alt > -1 && (
        <svg className="moon" viewBox="0 0 44 44" style={place(moon.alt, moon.az)} role="img" aria-label={`Moon: ${moon.name}, ${pct}% lit`}>
          <title>{`${moon.name}, ${pct}% lit (Luna)`}</title>
          <circle cx="22" cy="22" r="20" fill="var(--moon-dark)" stroke="var(--line)" strokeWidth="2.5" />
          {pct > 0 && <path d={moonPath(moon.ill, moon.waxing)} fill="var(--moon-lit)" />}
          <circle cx="22" cy="22" r="20" fill="none" stroke="var(--line)" strokeWidth="2.5" />
        </svg>
      )}
    </>
  );
}
