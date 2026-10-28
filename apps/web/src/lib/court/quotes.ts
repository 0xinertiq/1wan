import { dayIdx } from "./time";

// Built-in quotes from dashboard-v52 (QUOTES). Her own saved quotes (state key `uq`) are added after these.
export const QUOTES = [
  "Generosity, which we all admire, must stop short of both profligacy and parsimony in order to be of any use.",
  "She cried for the life she could not control, for the profound loneliness that filled her heart, for the future which suddenly felt so uncertain.",
  "The worst kind of loneliness is the isolation that comes from being misunderstood. It can make people lose their grip on reality.",
  "Non-resistance is the key to the greatest power in the universe.",
  "Elimination of psychological time, not clock time.",
  "The more you perceive life through a mental screen of abstraction and conceptualisation, the more lifeless and flat the world around you becomes.",
  "Ambition means tying your wellbeing to what others do. Sanity means tying it to your own actions.",
  "Fight Club moments.",
  "Old friend denial.",
  "The sterile world I had grown accustomed to dulled my creativity and limited my vision.",
  "Do not be penny wise, pound foolish.",
  "Time is a great leveller.",
  "Punctuality is the courtesy of kings.",
  "Words are like lost opportunity: they cannot be taken back once uttered.",
  "If you meet the Buddha on the road, kill him.",
  "Sammasati: the seventh step in the Buddha's eightfold path.",
];

export function quoteOfDay(k: string, own: string[]) {
  const all = QUOTES.concat(own);
  const q = all[dayIdx(k) % all.length];
  return q.length > 240 ? q.slice(0, 237) + "..." : q;
}

/** Round 10: the next quote to show: never the one just shown, and none twice until every quote has had a turn. */
export function nextQuote(count: number, seen: number[], last: number | null, rnd = Math.random) {
  if (count <= 0) return { i: -1, seen: [] as number[] };
  let pool = Array.from({ length: count }, (_, i) => i).filter((i) => !seen.includes(i));
  let used = seen.filter((i) => i < count);
  if (!pool.length) { used = []; pool = Array.from({ length: count }, (_, i) => i).filter((i) => i !== last || count === 1); }
  const i = pool[Math.floor(rnd() * pool.length) % pool.length];
  return { i, seen: [...used, i] };
}
export const trimQuote = (q: string) => (q.length > 240 ? q.slice(0, 237) + "..." : q);
