import ASTRO from "./astroTable.json";
import { addDays, prettyDay } from "./time";

// Luna's daily reading, ported from dashboard-v52 (weather(), explain(), lunaCare() and their word lists) with
// the same precomputed sky table (astroTable.json: her natal chart and 92 days of transits, PyEphem, checked
// against astronomy-engine). No new calculation. Rule-based only: no AI call.
// The astro calendar's text is used as source material only: keywords in its DO / DON'T lines add a few of
// Luna's own short phrases to the lean / gentle lists (never the calendar's words).

type Ev = { t: string; tp: string; a: string; n: string };
type Back = { tp: string; a: string; n: string; o: number };
type Day = { d: string; moon: string; md: number; el: number; ing: { t: string; s: string } | null; mrx: boolean; ev: Ev[]; back: Back[] };
const DAYS = (ASTRO as unknown as { days: Day[] }).days;

const PW: Record<string, number> = { Moon: 0.5, Sun: 1, Mercury: 0.7, Venus: 1, Mars: 1.2, Jupiter: 1.2, Saturn: 1.5, Uranus: 1.5, Neptune: 1.2, Pluto: 1.5 };
const NW: Record<string, number> = { Sun: 1, Moon: 1, Mercury: 0.8, Venus: 0.8, Mars: 0.8, Jupiter: 0.8, Saturn: 0.8, ASC: 0.9, MC: 0.9 };
const ELEM: Record<string, string> = { Aries: "fire", Leo: "fire", Sagittarius: "fire", Taurus: "earth", Virgo: "earth", Capricorn: "earth", Gemini: "air", Libra: "air", Aquarius: "air", Cancer: "water", Scorpio: "water", Pisces: "water" };
const SIGNMOOD: Record<string, string> = { Aries: "quick, direct and a little impatient", Taurus: "steady, sensory and slow to change", Gemini: "curious, talkative and restless", Cancer: "tender, protective and home-seeking", Leo: "warm, expressive and wanting to be seen", Virgo: "precise, practical and detail-minded", Libra: "harmony-seeking and people-focused", Scorpio: "intense, private and probing", Sagittarius: "restless, optimistic and wanting room", Capricorn: "serious, disciplined and goal-minded", Aquarius: "detached, inventive and independent", Pisces: "soft, dreamy and absorbent" };
const ELEMLEAN: Record<string, string[]> = { fire: ["starting things", "moving the body", "saying what you mean"], earth: ["practical work", "routines and tidying", "building one thing steadily"], air: ["talking and planning", "learning and reading", "connecting with people"], water: ["feeling things through", "rest and quiet", "close company"] };
const ELEMEASE: Record<string, string[]> = { fire: ["rash words", "rushing"], earth: ["stubbornness", "over-planning"], air: ["overthinking", "scattering your focus"], water: ["soaking up other people's moods", "brooding"] };
const PHASELEAN: Record<string, string> = { "New moon": "setting quiet intentions", "Waxing crescent": "taking first steps", "First quarter": "pushing through the first obstacle", "Waxing gibbous": "refining and building", "Full moon": "seeing what has come to light", "Waning gibbous": "sharing and passing on", "Last quarter": "letting go of what is not working", "Waning crescent": "resting and clearing space" };
const TPDOES: Record<string, string> = { Moon: "mood", Sun: "energy", Mercury: "thinking", Venus: "ease and affection", Mars: "drive", Jupiter: "optimism", Saturn: "caution", Uranus: "surprise", Neptune: "blur", Pluto: "intensity" };
const NTHEME: Record<string, string> = { Sun: "your sense of self", Moon: "your emotional needs", Mercury: "how you think and speak", Venus: "what you value and enjoy", Mars: "your drive", Jupiter: "your confidence", Saturn: "your limits and discipline", ASC: "how you show up", MC: "your public direction" };
const ASPV: Record<string, string> = { conj: "meets", sextile: "opens a door to", trine: "flows easily into", square: "rubs against", opp: "pulls against" };
const ASPT: Record<string, string> = { conj: "is front and center", sextile: "finds an easy opening", trine: "moves without effort", square: "meets friction", opp: "meets tension to balance" };
export const TONEMSG: Record<string, string> = { Flowing: "Smooth sailing! Effort tends to land today.", Pressured: "A bumpier sky. Slow down and double-check, Queen.", Mixed: "A little of both. One gentle step at a time.", Quiet: "A quiet sky with few direct touches to your chart. The Moon sets the mood." };

const phaseName = (el: number) => (el < 22.5 || el >= 337.5 ? "New moon" : el < 67.5 ? "Waxing crescent" : el < 112.5 ? "First quarter" : el < 157.5 ? "Waxing gibbous" : el < 202.5 ? "Full moon" : el < 247.5 ? "Waning gibbous" : el < 292.5 ? "Last quarter" : "Waning crescent");

type Item = { tp: string; a: string; n: string; t?: string; o?: number; back: boolean; w: number };
function aspScore(e: { tp: string; a: string; n: string }) {
  let s = ({ trine: 2, sextile: 1, square: -2, opp: -2 } as Record<string, number>)[e.a] ?? 0;
  if (e.a === "conj") { const ben = ["Venus", "Jupiter"], mal = ["Mars", "Saturn"]; s = ben.includes(e.tp) || ben.includes(e.n) ? 1 : mal.includes(e.tp) || mal.includes(e.n) ? -1 : 0; }
  return s * PW[e.tp] * NW[e.n];
}

export type LunaDay = {
  day: string; moon: string; el: string; phase: string; tone: "Flowing" | "Pressured" | "Mixed" | "Quiet"; mood: string; mrx: boolean;
  ing: { t: string; s: string } | null; items: Item[]; lean: string[]; ease: string[]; merc: string | null; care: string[];
};
export const lunaRange = () => ({ from: DAYS[0].d, to: DAYS[DAYS.length - 1].d });

export function lunaDay(k: string): LunaDay | null {
  const i = DAYS.findIndex((d) => d.d === k);
  const d = DAYS[i]; if (!d) return null;
  const items: Item[] = [...d.ev.map((e) => ({ tp: e.tp, a: e.a, n: e.n, t: e.t, back: false, w: 0 })), ...d.back.map((b) => ({ tp: b.tp, a: b.a, n: b.n, o: b.o, back: true, w: 0 }))];
  let score = 0;
  for (const e of items) { e.w = Math.abs(aspScore(e)) + PW[e.tp] * NW[e.n] * 0.1; score += aspScore(e) * (e.back ? 0.5 : 1); }
  const tone = items.length === 0 ? "Quiet" : score >= 1.5 ? "Flowing" : score <= -1.5 ? "Pressured" : "Mixed";
  const phase = phaseName(d.el), el = ELEM[d.moon];
  items.sort((a, b) => b.w - a.w);
  const rxIdx = DAYS.findIndex((x) => x.mrx);
  const merc = d.mrx ? "Mercury is retrograde. Review, revise and re-check. Avoid rushing signatures."
    : rxIdx > -1 && rxIdx > i && rxIdx - i <= 21 ? `Mercury turns retrograde around ${prettyDay(DAYS[rxIdx - 1].d)} (${rxIdx - 1 - i} day${rxIdx - 1 - i === 1 ? "" : "s"} away). Tie up loose ends and back things up.` : null;
  const w = { day: d.d, moon: d.moon, el, phase, tone, mood: SIGNMOOD[d.moon], mrx: d.mrx, ing: d.ing, items, lean: [...ELEMLEAN[el].slice(0, 2), PHASELEAN[phase]], ease: ELEMEASE[el], merc } as LunaDay;
  w.care = lunaCare(w);
  return w;
}

export function explain(e: { tp: string; a: string; n: string }) {
  return `${e.tp} ${ASPV[e.a]} ${NTHEME[e.n]}: ${TPDOES[e.tp]} ${ASPT[e.a]}.`;
}

function lunaCare(w: LunaDay) {
  const E: Record<string, string[]> = { fire: ["Move your body for 20 minutes to burn off restless energy", "Drink water and say the direct thing kindly, once"], earth: ["Eat a warm, grounding meal", "Tidy one small surface and take a slow walk"], air: ["Write the loose thoughts down, then close the notebook", "Get fresh air and message one friend"], water: ["Take a warm bath or shower and keep the evening quiet", "Stay near people who calm you and go easy on the feeds"] };
  const P: Record<string, string> = { "New moon": "Write one small intention and go to bed early", "Waxing crescent": "Start one gentle new habit, five minutes only", "First quarter": "Do the one thing you have been avoiding, then rest", "Waxing gibbous": "Tweak your routine rather than starting over", "Full moon": "Sleep can run light: dim screens early and skip caffeine after noon", "Waning gibbous": "Share something you learned with someone", "Last quarter": "Clear one thing from your space or your list", "Waning crescent": "Rest. Cancel what you can and sleep a little longer" };
  const T: Record<string, string> = { Flowing: "Do the hard task first, then enjoy the afternoon", Pressured: "Halve your list and re-check anything you send or sign", Mixed: "Alternate effort with short breaks, one gentle step at a time", Quiet: "Use the quiet for rest or unhurried reading" };
  const L = [...(E[w.el] ?? []), P[w.phase], T[w.tone]];
  if (w.mrx) L.push("Back up your files and re-read messages before sending");
  return L.filter(Boolean);
}

// Themes Luna listens for in the calendar's DO / DON'T text, each with her own short phrase. Only themes that
// match today's chart words are added (at most two per list), and only if not already there.
const THEMES: [RegExp, string][] = [
  [/communicat|conversation|talk|speak|message|write|email/i, "clear, kind conversations"],
  [/rest|sleep|slow|pause|quiet|retreat/i, "slowing down"],
  [/plan|organi[sz]|structure|schedule|list/i, "planning and sorting"],
  [/creat|art|play|express/i, "something creative"],
  [/relationship|partner|friend|love|connect|social/i, "time with people you trust"],
  [/body|exercise|move|walk|yoga|stretch/i, "moving the body"],
  [/review|revis|re-?check|edit|reflect/i, "reviewing before you act"],
  [/learn|study|read|research/i, "learning something small"],
  [/home|family|nest|cook/i, "home comforts"],
];
const EASE_THEMES: [RegExp, string][] = [
  [/impuls|rush|hast|hurry/i, "rushing decisions"],
  [/argu|conflict|confront|fight|clash/i, "sharp words"],
  [/sign|contract|commit|agreement/i, "signing things in a hurry"],
  [/spend|purchas|buy|shopping|money/i, "impulse spending"],
  [/overwork|overcommit|push too|burn/i, "taking on too much"],
  [/assum|misunder|mix-?up|confus/i, "assumptions"],
  [/scroll|screen|feed|news/i, "endless scrolling"],
];
export function enrich(w: LunaDay, dos: string | null, donts: string | null): LunaDay {
  const add = (list: string[], src: string | null, map: [RegExp, string][]) => {
    if (!src) return list;
    const out = [...list];
    for (const [re, phrase] of map) if (re.test(src) && !out.includes(phrase) && out.length < list.length + 2) out.push(phrase);
    return out;
  };
  return { ...w, lean: add(w.lean, dos, THEMES), ease: add(w.ease, donts, EASE_THEMES) };
}

// The next Moon sign change from today (today's, or the first one in the following days), in SGT.
export function nextIngress(k: string): { day: string; t: string; s: string } | null {
  for (let n = 0; n < 4; n++) { const d = DAYS.find((x) => x.d === addDays(k, n)); if (d?.ing) return { day: d.d, ...d.ing }; }
  return null;
}
