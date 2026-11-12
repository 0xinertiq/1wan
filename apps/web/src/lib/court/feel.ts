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

// Game loop G2: the day-complete sheet. Shown once per game day, the moment the 3 core quests are all ticked by her.
// "Once" comes from the done-day bonus itself (ql.bd, set by awardDoneDay), so undoing and re-ticking never shows it twice.
export type DayDoneDetail = { xp: number; streak: number; comeback: boolean; level: number | null };
export const DAY_EVENT = "kumo:daydone";

/** Four rising notes, just after the tick burst. Silent when muted or when the device has no audio. */
export function playDone(mute: boolean | undefined) {
  if (mute || typeof window === "undefined") return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = ctx ?? new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const t0 = ctx.currentTime + 0.35;
    [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.32]].forEach(([f, d]) => {
      const o = ctx!.createOscillator(), g = ctx!.createGain();
      o.type = "triangle"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(0.07, t0 + d + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.28);
      o.connect(g); g.connect(ctx!.destination);
      o.start(t0 + d); o.stop(t0 + d + 0.3);
    });
  } catch { /* no audio: the sheet still shows */ }
}

export function fireDayDone(detail: DayDoneDetail, mute: boolean | undefined) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<DayDoneDetail>(DAY_EVENT, { detail }));
  playDone(mute);
}

export type TickDetail = { x: number; y: number };
export const TICK_EVENT = "kumo:tick";

/** Tell the burst component where to draw (the last pointer position, or the focused control for a key press). */
export function fireTick(pos: TickDetail, mute: boolean | undefined) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<TickDetail>(TICK_EVENT, { detail: pos }));
  playTick(mute);
}
