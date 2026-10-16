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
