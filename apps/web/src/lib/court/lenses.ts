import type { LensId } from "./state";

// News lenses (round 7): several at once. Headlines on the News tab show the topics she follows; the Briefs card
// shows Intel when a news or markets lens is on and Pulse when Tech or Markets is on. "Any topic" shows everything;
// "Off" hides both. Rules only.
export const LENS_LABEL: Record<LensId, string> = { crypto: "Crypto", macro: "Macro", markets: "Markets", world: "World", local: "Local", tech: "Tech", any: "Any topic", off: "Off" };
const OF_GROUP: Record<string, LensId> = { Crypto: "crypto", Macro: "macro", Markets: "markets", World: "world", Local: "local", Tech: "tech" };

/** Does a headline topic (Crypto, Macro, Markets, World, Local, Tech or Telegram) show under these lenses? */
export function headlineShown(group: string, lenses: LensId[]) {
  if (lenses.includes("off")) return false;
  if (lenses.includes("any") || group === "Telegram") return true;
  const id = OF_GROUP[group];
  return !!id && lenses.includes(id);
}

/** Which brief tabs the News Briefs card shows. */
export function briefTabs(lenses: LensId[]): ("intel" | "pulse")[] {
  if (lenses.includes("off")) return [];
  if (lenses.includes("any")) return ["intel", "pulse"];
  const out: ("intel" | "pulse")[] = [];
  if (lenses.some((l) => ["crypto", "macro", "markets", "world", "local"].includes(l))) out.push("intel");
  if (lenses.some((l) => l === "tech" || l === "markets")) out.push("pulse");
  return out;
}

/** Tap a lens chip: topics toggle together; "Any topic" and "Off" stand alone. Never leaves nothing chosen. */
export function toggleLens(cur: LensId[], id: LensId): LensId[] {
  if (id === "any" || id === "off") return cur.length === 1 && cur[0] === id ? ["crypto", "macro", "markets"] : [id];
  const topics = cur.filter((x) => x !== "any" && x !== "off");
  const next = topics.includes(id) ? topics.filter((x) => x !== id) : [...topics, id];
  return next.length ? next : cur;
}
