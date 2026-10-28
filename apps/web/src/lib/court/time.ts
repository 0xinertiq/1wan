// Date helpers from dashboard-v52. Day keys are YYYY-MM-DD in Singapore time; minutes count from local midnight.

export const SGT = "Asia/Singapore";
const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function sgt(d: Date): { key: string; min: number } {
  const o: Record<string, string> = {};
  new Intl.DateTimeFormat("en-GB", { timeZone: SGT, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(d)
    .forEach((x) => { o[x.type] = x.value; });
  return { key: `${o.year}-${o.month}-${o.day}`, min: (+o.hour % 24) * 60 + +o.minute };
}
export const todayKey = () => sgt(new Date()).key;
export const nowMin = () => sgt(new Date()).min;

const p2 = (n: number) => (n < 10 ? "0" : "") + n;
export function addDays(k: string, n: number) {
  const d = new Date(k + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export const wdOf = (k: string) => new Date(k + "T00:00:00Z").getUTCDay();
export const wdName = (n: number) => WD[n];
export function prettyDay(k: string) {
  const d = new Date(k + "T00:00:00Z");
  return `${WD[d.getUTCDay()]} ${d.getUTCDate()} ${MON[d.getUTCMonth()]}`;
}
export const weekKey = (k: string) => addDays(k, -((wdOf(k) + 6) % 7)); // Monday
export const dayGap = (a: string, b: string) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 86400000);
export function hm(m: number) {
  m = Math.max(0, Math.min(1440, Math.round(m)));
  return p2(Math.floor(m / 60) % 24) + ":" + p2(m % 60);
}
export function dur(m: number) {
  const h = Math.floor(m / 60), mm = m % 60;
  return (h ? h + "h" : "") + (h && mm ? " " : "") + (mm ? mm + "m" : "");
}
export function domDate(y: number, m: number, d: number) {
  const ml = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return `${y}-${p2(m + 1)}-${p2(Math.min(d, ml))}`;
}
export function greetWord(m: number) {
  return m < 720 ? "Good morning" : m < 1080 ? "Good afternoon" : "Good evening";
}
export function dayIdx(k: string) {
  let n = 0;
  for (let i = 0; i < k.length; i++) n = (n * 31 + k.charCodeAt(i)) % 100003;
  return n;
}

// ---- The one date and time formatter (owner, round 5d). Every date or time the app shows goes through these:
// 24-hour Singapore time with a leading zero and an "SGT" tag; "Today 05:40 SGT" for today, otherwise
// "27 Oct 07:45 SGT"; a weekday is three letters with the date ("Thu 29 Oct"); ages read "· 3h ago".
// tests/tokens.test.mjs fails if a component formats a date or time by hand.
const SGT_MS = 8 * 3600e3;
export const SGT_OFFSET_S = 8 * 3600;   // for chart axes that take seconds
const ms = (t: string | number | Date) => (t instanceof Date ? t.getTime() : typeof t === "number" ? t : Date.parse(t));
const shifted = (t: string | number | Date) => new Date(ms(t) + SGT_MS);
/** The Singapore day key (YYYY-MM-DD) of a moment. */
export const sgtKeyOf = (t: string | number | Date) => shifted(t).toISOString().slice(0, 10);
/** Minutes since Singapore midnight, and the hour. */
export const sgtMinOf = (t: string | number | Date) => { const d = shifted(t); return d.getUTCHours() * 60 + d.getUTCMinutes(); };
export const sgtHourOf = (t: string | number | Date) => Math.floor(sgtMinOf(t) / 60);
/** "05:40" */
export const clock = (t: string | number | Date) => hm(sgtMinOf(t));
/** "27 Oct" */
const dayMonth = (k: string) => { const d = new Date(k + "T00:00:00Z"); return `${d.getUTCDate()} ${MON[d.getUTCMonth()]}`; };
/** "Today 05:40 SGT" or "27 Oct 07:45 SGT" */
export const stamp = (t: string | number | Date, now: string | number | Date = Date.now()) =>
  `${sgtKeyOf(t) === sgtKeyOf(now) ? "Today" : dayMonth(sgtKeyOf(t))} ${clock(t)} SGT`;
/** "Thu 29 Oct 02:00 SGT" */
export const dayStamp = (t: string | number | Date) => `${prettyDay(sgtKeyOf(t))} ${clock(t)} SGT`;
/** "just now", "12 min ago", "3h ago", "2d ago" */
export function ageText(t: string | number | Date, now: string | number | Date = Date.now()) {
  const m = Math.round((ms(now) - ms(t)) / 60000);
  return m < 1 ? "just now" : m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : `${Math.round(m / 1440)}d ago`;
}
/** "in 28 min", "in 16h", "now" */
export function inText(t: string | number | Date, now: string | number | Date = Date.now()) {
  const m = Math.round((ms(t) - ms(now)) / 60000);
  return m <= 0 ? "now" : m < 60 ? `in ${m} min` : `in ${Math.round(m / 60)}h`;
}
/** "Today 05:40 SGT · 3h ago" */
export const stampAge = (t: string | number | Date, now: string | number | Date = Date.now()) => `${stamp(t, now)} · ${ageText(t, now)}`;
/** The header badge: "WED 28 OCT · 10:12 SGT" (the colon blinks in the badge itself). */
export const badgeParts = (t: string | number | Date = Date.now()) => {
  const k = sgtKeyOf(t), c = clock(t).split(":");
  return { day: prettyDay(k).toUpperCase(), hh: c[0], mm: c[1] };
};
/** "October 2026" */
export const monthTitle = (k: string) => {
  const d = new Date(k + "T00:00:00Z");
  return `${["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][d.getUTCMonth()]} ${d.getUTCFullYear()}`;
};
