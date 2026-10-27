// Real dates inside grid item text, for the Calendar's "Grid dates" layer. Only a full day counts:
// 2026-11-15, 15 Nov (2026), Nov 15 (2026). Month-only ("by end of Nov"), weekdays and "weekly" never do.
// Without a year, the next such day from today (SGT) is used. Returns YYYY-MM-DD keys.
const MON = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const M = String.raw`(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?`;
const ISO = /\b(20\d\d)-(\d\d)-(\d\d)\b/g;
const DAY_MON = new RegExp(String.raw`\b(\d{1,2})(?:st|nd|rd|th)?\s+${M}(?:,?\s+(20\d\d))?\b`, "gi");
const MON_DAY = new RegExp(String.raw`\b${M}\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d\d))?\b`, "gi");

function key(y: number, m: number, d: number) {
  const dt = new Date(Date.UTC(y, m, d));
  if (m < 0 || dt.getUTCMonth() !== m || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}
function withYear(m: number, d: number, y: string | undefined, today: string) {
  if (y) return key(+y, m, d);
  const ty = +today.slice(0, 4), k = key(ty, m, d);
  return k && k < today ? key(ty + 1, m, d) : k;
}
const monIx = (s: string) => MON.indexOf(s.slice(0, 3).toLowerCase());

export function datesIn(text: string, today: string): string[] {
  const s = String(text || ""), out = new Set<string>();
  for (const x of s.matchAll(ISO)) { const k = key(+x[1], +x[2] - 1, +x[3]); if (k) out.add(k); }
  for (const x of s.matchAll(DAY_MON)) { const k = withYear(monIx(x[2]), +x[1], x[3], today); if (k) out.add(k); }
  for (const x of s.matchAll(MON_DAY)) { const k = withYear(monIx(x[1]), +x[2], x[3], today); if (k) out.add(k); }
  return [...out].sort();
}
