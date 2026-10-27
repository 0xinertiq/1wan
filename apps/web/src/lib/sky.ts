import * as A from "astronomy-engine";

// Luna's sky (docs/build-dashboard-v2.md section 6): rules only, no AI. Tropical zodiac, Placidus houses.
// Positions from astronomy-engine (checked: Sun 0.00° at the 2026 March equinox; Moon 270° from the Sun
// at a third quarter). Wording only restates positions and dates; it never predicts outcomes.
export const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
export const GLYPH: Record<string, string> = { Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃", Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇" };
const BODIES = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"] as const;
const SLOW = BODIES.filter((b) => b !== "Sun" && b !== "Moon");
export type BodyName = (typeof BODIES)[number];

const norm = (x: number) => ((x % 360) + 360) % 360;
const rad = (d: number) => (d * Math.PI) / 180, deg = (r: number) => (r * 180) / Math.PI;
export const signOf = (lon: number) => SIGNS[Math.floor(norm(lon) / 30)];
export const fmtDeg = (lon: number) => { const x = norm(lon) % 30; return `${Math.floor(x)}°${String(Math.floor((x % 1) * 60)).padStart(2, "0")}'`; };

export function lonOf(b: BodyName, d: Date) {
  if (b === "Sun") return A.SunPosition(d).elon;
  if (b === "Moon") return A.EclipticGeoMoon(d).lon;
  return A.Ecliptic(A.GeoVector(A.Body[b], d, true)).elon;
}
const speed = (b: BodyName, d: Date) => { const x = lonOf(b, new Date(d.getTime() + 43200000)) - lonOf(b, new Date(d.getTime() - 43200000)); return ((x + 540) % 360) - 180; };

export type Pos = { b: BodyName; lon: number; sign: string; retro: boolean };
export function positions(d: Date): Pos[] {
  return BODIES.map((b) => { const lon = lonOf(b, d); return { b, lon, sign: signOf(lon), retro: b !== "Sun" && b !== "Moon" && speed(b, d) < 0 }; });
}

export function moonPhase(d: Date) {
  const a = A.MoonPhase(d), ill = A.Illumination(A.Body.Moon, d).phase_fraction;
  const name = a < 22.5 || a >= 337.5 ? "New Moon" : a < 67.5 ? "Waxing crescent" : a < 112.5 ? "First quarter" : a < 157.5 ? "Waxing gibbous" : a < 202.5 ? "Full Moon" : a < 247.5 ? "Waning gibbous" : a < 292.5 ? "Last quarter" : "Waning crescent";
  return { angle: a, ill, name };
}

// Stations, ingresses, moon phases and eclipses between two dates, sampled daily then refined to the hour.
export type SkyEvent = { at: Date; kind: "station" | "ingress" | "phase" | "eclipse"; t: string; b?: BodyName; sign?: string; dir?: "retrograde" | "direct" };
export function skyEvents(from: Date, days: number): SkyEvent[] {
  const out: SkyEvent[] = [], H = 3600000, end = from.getTime() + days * 86400000;
  for (const b of [...SLOW, "Sun" as BodyName]) {
    let t = from.getTime(), pl = lonOf(b, new Date(t)), ps = speed(b, new Date(t));
    for (t += 86400000; t <= end; t += 86400000) {
      const d = new Date(t), l = lonOf(b, d), s = b === "Sun" ? 1 : speed(b, d);
      if (Math.floor(norm(l) / 30) !== Math.floor(norm(pl) / 30)) {
        let a = t - 86400000, z = t; while (z - a > H) { const m = (a + z) / 2; if (Math.floor(norm(lonOf(b, new Date(m))) / 30) === Math.floor(norm(pl) / 30)) a = m; else z = m; }
        out.push({ at: new Date(z), kind: "ingress", b, sign: signOf(l), t: `${b} enters ${signOf(l)}` });
      }
      if (b !== "Sun" && Math.sign(s) !== Math.sign(ps)) {
        let a = t - 86400000, z = t; while (z - a > H) { const m = (a + z) / 2; if (Math.sign(speed(b, new Date(m))) === Math.sign(ps)) a = m; else z = m; }
        const dir = s < 0 ? "retrograde" : "direct";
        out.push({ at: new Date(z), kind: "station", b, dir, sign: signOf(lonOf(b, new Date(z))), t: `${b} stations ${dir} in ${signOf(lonOf(b, new Date(z)))}` });
      }
      pl = l; ps = s;
    }
  }
  let q = A.SearchMoonQuarter(from);
  while (q.time.date.getTime() <= end) {
    const lon = A.EclipticGeoMoon(q.time.date).lon;
    out.push({ at: q.time.date, kind: "phase", t: `${["New Moon", "First quarter", "Full Moon", "Last quarter"][q.quarter]} in ${signOf(lon)}`, sign: signOf(lon) });
    q = A.NextMoonQuarter(q);
  }
  const le = A.SearchLunarEclipse(from);
  if (le.peak.date.getTime() <= end) out.push({ at: le.peak.date, kind: "eclipse", t: `Lunar eclipse (${le.kind}) in ${signOf(A.EclipticGeoMoon(le.peak.date).lon)}` });
  const se = A.SearchGlobalSolarEclipse(from);
  if (se.peak.date.getTime() <= end) out.push({ at: se.peak.date, kind: "eclipse", t: `Solar eclipse (${se.kind}) in ${signOf(A.SunPosition(se.peak.date).elon)}` });
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

// Placidus cusps for a moment and place. RAMC from sidereal time; houses 11, 12, 2, 3 by trisecting the
// semi-arcs (iterated), the rest are opposite. Falls back to equal houses near the poles.
export function houses(d: Date, lat: number, lon: number): number[] {
  const eps = rad(23.4392911 - 0.0130042 * ((d.getTime() / 86400000 + 2440587.5 - 2451545) / 36525));
  const ramc = norm(A.SiderealTime(d) * 15 + lon), phi = rad(lat);
  const mc = norm(deg(Math.atan2(Math.sin(rad(ramc)), Math.cos(rad(ramc)) * Math.cos(eps))));
  const asc = norm(deg(Math.atan2(Math.cos(rad(ramc)), -(Math.sin(rad(ramc)) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)))));
  if (Math.abs(lat) > 66) return Array.from({ length: 12 }, (_, i) => norm(asc + i * 30));
  const cusp = (f: number, below: boolean) => {
    let l = norm(below ? asc + f * 90 : mc + f * 90);
    for (let i = 0; i < 30; i++) {
      const dec = Math.asin(Math.sin(eps) * Math.sin(rad(l)));
      const dsa = deg(Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(dec))))), nsa = 180 - dsa;
      const ra = below ? ramc + 180 - (1 - f) * nsa : ramc + f * dsa;
      l = norm(deg(Math.atan2(Math.sin(rad(ra)), Math.cos(rad(ra)) * Math.cos(eps))));
    }
    return l;
  };
  const c11 = cusp(1 / 3, false), c12 = cusp(2 / 3, false), c2 = cusp(1 / 3, true), c3 = cusp(2 / 3, true);
  const h = [asc, c2, c3, norm(mc + 180), 0, 0, norm(asc + 180), norm(c2 + 180), norm(c3 + 180), mc, c11, c12];
  h[4] = norm(c11 + 180); h[5] = norm(c12 + 180);
  return h;
}
export function houseOf(lon: number, cusps: number[]) {
  for (let i = 0; i < 12; i++) { const a = cusps[i], b = cusps[(i + 1) % 12], span = norm(b - a); if (norm(lon - a) < span) return i + 1; }
  return 1;
}

export type Birth = { date: string; time: string; place: string; lat: number; lon: number; tz: string };
// Local birth time in its own time zone to a UTC moment (two passes cover DST edges).
export function birthMoment(b: Birth) {
  const guess = Date.parse(`${b.date}T${b.time || "12:00"}:00Z`);
  const off = (t: number) => { const p = new Intl.DateTimeFormat("en-US", { timeZone: b.tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(t)); const g = (k: string) => +p.find((x) => x.type === k)!.value; return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute")) - t; };
  let t = guess - off(guess); t = guess - off(t);
  return new Date(t);
}

const ASPECTS: [number, string][] = [[0, "conjunct"], [60, "sextile"], [90, "square"], [120, "trine"], [180, "opposite"]];
export type Transit = { t: string; orb: number; house: number };
// Transits within 1.5 degrees from today's planets to natal points, with the natal house they fall in.
export function transits(now: Date, natal: Pos[], cusps: number[]): Transit[] {
  const out: Transit[] = [];
  const points = [...natal.map((p) => ({ n: p.b as string, lon: p.lon })), { n: "Ascendant", lon: cusps[0] }, { n: "Midheaven", lon: cusps[9] }];
  for (const p of positions(now)) for (const q of points) for (const [ang, name] of ASPECTS) {
    const sep = Math.abs(((norm(p.lon - q.lon) + 180) % 360) - 180), orb = Math.abs(sep - ang);
    if (orb <= 1.5) out.push({ t: `${p.b}${p.retro ? " (retrograde)" : ""} ${name} natal ${q.n}`, orb, house: houseOf(p.lon, cusps) });
  }
  return out.sort((a, b) => a.orb - b.orb);
}
