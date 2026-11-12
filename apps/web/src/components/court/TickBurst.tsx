"use client";

import { useEffect, useRef } from "react";
import { TICK_EVENT, type TickDetail } from "@/lib/court/feel";

// Game loop G1: a small pixel burst where she tapped. Fixed to the screen on top of the page (never in the layout), so
// no desktop card moves. Skipped for people who ask their device for less motion. Gold and blush squares, plum edge.
// pixel-art: the burst squares use the sprite palette (gold, blush, plum edge)
const COLORS = ["#FFD95E", "#FFA3C8", "#FFD3E5", "#FFD95E"];

export function TickBurst() {
  const last = useRef<TickDetail>({ x: 0, y: 0 });
  useEffect(() => {
    const on = (e: Event) => {
      const d = (e as CustomEvent<TickDetail>).detail;
      last.current = d;
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
      for (let i = 0; i < 8; i++) {
        const el = document.createElement("span");
        el.setAttribute("aria-hidden", "true");
        // pixel-art: same palette
        el.style.cssText = `position:fixed;left:${d.x}px;top:${d.y}px;width:6px;height:6px;margin:-3px 0 0 -3px;background:${COLORS[i % COLORS.length]};border:1px solid #4a2538;pointer-events:none;z-index:9999;image-rendering:pixelated`;
        document.body.appendChild(el);
        const a = (Math.PI * 2 * i) / 8, r = 26 + (i % 2) * 10;
        const anim = el.animate(
          [{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r - 6}px) scale(.4)`, opacity: 0 }],
          { duration: 520, easing: "cubic-bezier(.2,.7,.3,1)", fill: "forwards" });
        anim.onfinish = () => el.remove();
      }
    };
    window.addEventListener(TICK_EVENT, on);
    return () => window.removeEventListener(TICK_EVENT, on);
  }, []);
  return null;
}
