// Server only. Economic calendar (docs/build-intel.md A): an UNOFFICIAL free weekly calendar file
// (tested 27 Oct: 97 events with forecast and previous; no actuals), plus the official 2026 FOMC dates from
// federalreserve.gov stored below. Cached 60 minutes. Times are converted to Singapore time.
export type EconEvent = { at: string; country: string; title: string; impact: "High" | "Medium" | "Low" | "Holiday"; forecast: string; previous: string; top: boolean; source: "unofficial calendar" | "Federal Reserve" };

// Read from https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm on 27 Oct 2026. Decision day
// is the second day, statement at 2:00 pm Eastern.
const FOMC_2026 = ["2026-01-28", "2026-03-18", "2026-04-29", "2026-06-17", "2026-07-29", "2026-09-16", "2026-10-28", "2026-12-09"];
// The releases that move liquidity go first: US jobs, CPI, FOMC, GDP, PCE.
const TOP = /non-?farm|unemployment rate|\bcpi\b|fomc|federal funds|\bgdp\b|\bpce\b/i;

const URLS = ["https://nfs.faireconomy.media/ff_calendar_thisweek.json", "https://nfs.faireconomy.media/ff_calendar_nextweek.json"];
let cache: { at: number; items: EconEvent[]; ok: boolean; error?: string } | null = null;

// 2:00 pm New York on a date, as a UTC instant (handles daylight saving through Intl).
function nyTwoPm(d: string) {
  const guess = Date.parse(d + "T18:00:00Z");
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).formatToParts(new Date(guess));
  const h = +p.find((x) => x.type === "hour")!.value;
  return new Date(guess + (14 - h) * 3600e3).toISOString();
}

export async function loadEcon(): Promise<{ items: EconEvent[]; ok: boolean; at: string; error?: string }> {
  if (cache && Date.now() - cache.at < 60 * 60e3) return { ...cache, at: new Date(cache.at).toISOString() };
  const got: EconEvent[] = [];
  let ok = false, error: string | undefined;
  for (const u of URLS) {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000);
    try {
      const r = await fetch(u, { signal: ctl.signal, cache: "no-store", headers: { "User-Agent": "Mozilla/5.0 (compatible; 1wan-dashboard/1.0)" } });
      if (!r.ok) { if (u === URLS[0]) error = "status " + r.status; continue; }
      const j = (await r.json()) as { title: string; country: string; date: string; impact: EconEvent["impact"]; forecast: string; previous: string }[];
      for (const e of j) {
        const at = Date.parse(e.date);
        if (!isFinite(at)) continue;
        got.push({ at: new Date(at).toISOString(), country: e.country, title: e.title, impact: e.impact, forecast: e.forecast ?? "", previous: e.previous ?? "", top: e.country === "USD" && TOP.test(e.title), source: "unofficial calendar" });
      }
      if (u === URLS[0]) ok = true;
    } catch (x) { if (u === URLS[0]) error = x instanceof Error && x.name === "AbortError" ? "timed out" : "not reachable"; }
    finally { clearTimeout(t); }
  }
  // Official FOMC decisions the weekly file does not cover yet.
  for (const d of FOMC_2026) {
    const at = nyTwoPm(d);
    if (!got.some((e) => /fomc statement|federal funds/i.test(e.title) && Math.abs(Date.parse(e.at) - Date.parse(at)) < 36 * 3600e3))
      got.push({ at, country: "USD", title: "FOMC decision and statement", impact: "High", forecast: "", previous: "", top: true, source: "Federal Reserve" });
  }
  got.sort((a, b) => a.at.localeCompare(b.at));
  cache = { at: Date.now(), items: got, ok, error };
  return { items: got, ok, at: new Date().toISOString(), error };
}
