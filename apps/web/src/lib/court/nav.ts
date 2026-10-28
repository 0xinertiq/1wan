// Deep links between tabs: "#calendar" with an optional "?day=YYYY-MM-DD". The tab bar listens for hashchange,
// and the target page reads (then clears) its parameter.
export function openTab(tab: string, params?: Record<string, string>) {
  const q = params ? "?" + new URLSearchParams(params).toString() : "";
  history.pushState(null, "", window.location.pathname + q + "#" + tab);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
  window.scrollTo({ top: 0 });
}
/** Reads a deep-link parameter once and removes it from the address, so a later visit starts fresh. */
export function takeParam(name: string, valid: (v: string) => boolean): string | null {
  const u = new URL(window.location.href), v = u.searchParams.get(name);
  if (v == null) return null;
  u.searchParams.delete(name);
  history.replaceState(null, "", u.pathname + (u.searchParams.toString() ? "?" + u.searchParams : "") + u.hash);
  return valid(v) ? v : null;
}
export const isDayKey = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v + "T00:00:00Z"));
