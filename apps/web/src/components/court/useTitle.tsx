"use client";
import { useCourt } from "./CourtState";
import { useOwner } from "./Owner";
import { titleFor } from "@/lib/court/title";

/** Foundations F6: "Queen" for her; a friend's own name (or "friend"). */
export function useTitle(): string {
  const { st } = useCourt();
  return titleFor(st.prefs, useOwner());
}

/** The header greeting, unchanged for her. */
export function Greet() {
  const title = useTitle();
  return <p id="greet">Good day, {title}. Chief Kumo has your day.</p>;
}
