// Splits an astro calendar description into the parts Luna's Court card shows, taken word for word from the
// calendar text: the transit bullet lines ("• ..."), the "✅ DO:" line and the "🚫 DON'T:" line. A part the
// text does not contain stays empty; nothing is ever written here. Times the text gives in UTC are shown in
// Singapore time. The "Applies all day, wherever you are." boilerplate is dropped from the full text.

const BOILER = /\s*Applies all day, wherever you are\.?/i;

export function utcToSgt(s: string) {
  return s.replace(/\b(\d{1,2}):(\d{2})\s*UTC\b/g, (_, h: string, m: string) => {
    const hh = +h + 8;
    return `${String(hh % 24).padStart(2, "0")}:${m} SGT${hh >= 24 ? " (next day)" : ""}`;
  });
}

export function astroParts(desc?: string): { energy: string | null; transits: string[]; dos: string | null; donts: string | null; extra: string; full: string; source: string | null } {
  const lines = (desc ?? "").split(/\r?\n/).map((l) => l.trim());
  const transits = lines.filter((l) => /^[•·]\s*/.test(l)).map((l) => utcToSgt(l.replace(/^[•·]\s*/, "")));
  const pick = (re: RegExp) => { const m = lines.map((l) => l.match(re)).find((x) => x); return m ? utcToSgt(m[1].trim()) : null; };
  const dos = pick(/^(?:✅\s*)?DOS?:\s*(.+)$/i);
  const donts = pick(/^(?:🚫\s*)?DON['’]?TS?:\s*(.+)$/i);
  const source = (desc ?? "").match(/©\s*([^\n]+)/)?.[1]?.trim() ?? null;
  const full = utcToSgt((desc ?? "").replace(BOILER, "")).trim();
  // The energy line: the first plain line with "·" separators, before the bullets (for example "Tense · ...").
  const energy = lines.find((l) => l && !/^[•·]/.test(l) && !/^(?:✅|🚫)/.test(l) && !/^(?:DOS?|DON['’]?TS?):/i.test(l) && /\s·\s/.test(l)) ?? null;
  // Anything the Court card does not show (for the Observatory only).
  const shown = new Set([energy, ...lines.filter((l) => /^[•·]\s*/.test(l) || /^(?:✅\s*)?DOS?:/i.test(l) || /^(?:🚫\s*)?DON['’]?TS?:/i.test(l))]);
  const extra = lines.filter((l) => l && !shown.has(l) && !BOILER.test(" " + l) && !/^©/.test(l) && !/^Applies all day/i.test(l)).map(utcToSgt).join("\n").replace(/\s*©[^\n]*$/, "").trim();
  return { energy, transits, dos, donts, extra, full, source };
}
