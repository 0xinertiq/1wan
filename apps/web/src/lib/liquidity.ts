import type { EconEvent } from "./econ";

// Releases that move liquidity (owner's whitelist, round 5): FOMC rate decision, statement, press conference
// and minutes; US jobs (NFP), CPI, PPI, PCE and GDP; ECB, BoJ and BoE rate decisions; Treasury refunding.
// High impact only. Releases at the same moment from the same place collapse into one named row.
const RULES: { name: string; country: string; re: RegExp }[] = [
  { name: "FOMC decision", country: "USD", re: /federal funds|fomc statement|fomc decision/i },
  { name: "FOMC press conference", country: "USD", re: /fomc press conference/i },
  { name: "FOMC minutes", country: "USD", re: /fomc (meeting )?minutes/i },
  { name: "US jobs (NFP)", country: "USD", re: /non-?farm|unemployment rate/i },
  { name: "US CPI", country: "USD", re: /\bcpi\b/i },
  { name: "US PPI", country: "USD", re: /\bppi\b/i },
  { name: "US PCE", country: "USD", re: /\bpce\b/i },
  { name: "US GDP", country: "USD", re: /\bgdp\b/i },
  { name: "Treasury refunding", country: "USD", re: /refunding/i },
  { name: "ECB rate decision", country: "EUR", re: /main refinancing rate|ecb (monetary policy|press conference|rate)|deposit facility rate/i },
  { name: "BoJ rate decision", country: "JPY", re: /boj policy rate|boj (monetary policy|press conference)|policy rate/i },
  { name: "BoE rate decision", country: "GBP", re: /official bank rate|boe (monetary policy|rate)|mpc official/i },
];

export type Liq = { at: string; name: string; titles: string[] };

export function liquidityName(e: Pick<EconEvent, "country" | "title">): string | null {
  return RULES.find((r) => r.country === e.country && r.re.test(e.title))?.name ?? null;
}

export function liquidityList(items: EconEvent[], fromMs: number, toMs: number): Liq[] {
  const out: Liq[] = [];
  for (const e of items) {
    const t = Date.parse(e.at), name = liquidityName(e);
    if (!name || e.impact !== "High" || t < fromMs || t > toMs) continue;
    const same = out.find((x) => x.at === e.at && x.name === name);
    if (same) same.titles.push(e.title); else out.push({ at: e.at, name, titles: [e.title] });
  }
  return out.sort((a, b) => a.at.localeCompare(b.at));
}

// The next one within 48 hours (Singapore time is only formatting), or null.
export const nextLiquidity = (items: EconEvent[], now = Date.now()) => liquidityList(items, now - 10 * 60e3, now + 48 * 3600e3)[0] ?? null;

export const sgtShort = (iso: string) => new Date(iso).toLocaleString("en-SG", { timeZone: "Asia/Singapore", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).replace(",", "");
export const inText = (iso: string, now = Date.now()) => {
  const m = Math.round((Date.parse(iso) - now) / 60000);
  return m <= 0 ? "now" : m < 60 ? `in ${m} min` : `in ${Math.round(m / 60)}h`;
};
