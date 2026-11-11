import type { Prefs } from "./state";

// Foundations F6: what the crew calls the player. The owner keeps "Queen" (her title choice arrives with first-run in
// the game-loop phase); a friend is called by the name they gave in the Welcome tour, or "friend" until then.
export const OWNER_TITLE = "Queen", FRIEND_TITLE = "friend";
export function titleFor(prefs: Pick<Prefs, "name">, owner: boolean): string {
  if (owner) return OWNER_TITLE;
  const n = typeof prefs.name === "string" ? prefs.name.trim().slice(0, 40) : "";
  return n || FRIEND_TITLE;
}
/** Swap the owner's title in fixed crew lines for this player's. */
export const withTitle = (text: string, title: string) => (title === OWNER_TITLE ? text : text.replace(/\bQueen\b/g, title));
