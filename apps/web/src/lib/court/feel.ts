import { questItems } from "./questList";
import type { CourtState } from "./state";

// Game loop G1: tick feedback. A tiny burst where she tapped and a soft pixel sound, ON by default with a mute saved in
// her prefs (prefs.mute). Nothing here changes XP, streak or any saved rule; it only reacts to a tick that just happened.

/** How many of today's scheduled quests, anchors and habits are ticked. A tick is a rise in this number. */
export const doneCount = (st: Pick<CourtState, "q" | "days" | "swins" | "hab" | "gedit" | "defs" | "questsOff"> & { ql?: CourtState["ql"] }, k: string, owner: boolean) =>
  questItems(st, k, owner).filter((x) => x.on && x.done).length;

/** A tick counts as hers only when she touched the page a moment ago (so auto-ticks on load stay silent). */
export const RECENT_MS = 1500;
export const isRecent = (touchedAt: number, now: number) => touchedAt > 0 && now - touchedAt <= RECENT_MS;

let ctx: AudioContext | null = null;
/** Two short soft notes. Safe to call anywhere: it does nothing without a browser audio context or when muted. */
export function playTick(mute: boolean | undefined) {
  if (mute || typeof window === "undefined") return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime;
    [[660, 0], [880, 0.07]].forEach(([f, d]) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain();
      o.type = "square"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(0.05, t0 + d + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.12);
      o.connect(g); g.connect(ctx!.destination);
      o.start(t0 + d); o.stop(t0 + d + 0.13);
    });
  } catch { /* no audio on this device: the tick still counts */ }
}

export type TickDetail = { x: number; y: number };
export const TICK_EVENT = "kumo:tick";

/** Tell the burst component where to draw (the last pointer position, or the focused control for a key press). */
export function fireTick(pos: TickDetail, mute: boolean | undefined) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<TickDetail>(TICK_EVENT, { detail: pos }));
  playTick(mute);
}
