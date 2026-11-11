"use client";
import { useCourt } from "./CourtState";
import { useOwner } from "./Owner";
import { streakNow } from "@/lib/court/questList";

/** Foundations F2: the streak to show = done days up to yesterday, plus today once its 3 core quests are ticked. */
export function useStreak(): number {
  const { st, k } = useCourt();
  return streakNow(st, k, useOwner());
}
