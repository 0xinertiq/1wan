// One shared GET per URL per page load, so several cards reading the ledger or watering events
// do not each hit the server. Screens that save keep their own copy after this first read.
const cache = new Map<string, Promise<unknown>>();
export function getOnce<T = Record<string, unknown>>(url: string): Promise<T> {
  if (!cache.has(url)) cache.set(url, fetch(url).then((r) => r.json()).catch(() => ({})));
  return cache.get(url) as Promise<T>;
}
