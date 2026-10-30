// Safe, versioned per-device settings (localStorage). Every key carries a version ("1wan.v2.<name>"); a value
// that is missing, unreadable or the wrong shape is ignored and removed, and the fallback is used, so an old or
// broken saved value can never break a card. resetDevice() clears only this app's own keys (never server data).

const PREFIX = "1wan.v2.";
const OLD = [/^1wan-/, /^1wan\./, /^kumo\./];

export function readSaved<T>(name: string, valid: (v: unknown) => v is T, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + name);
    if (raw == null) return fallback;
    const v: unknown = JSON.parse(raw);
    if (valid(v)) return v;
    localStorage.removeItem(PREFIX + name);
  } catch { try { localStorage.removeItem(PREFIX + name); } catch {} }
  return fallback;
}
export function writeSaved(name: string, v: unknown) { try { localStorage.setItem(PREFIX + name, JSON.stringify(v)); } catch {} }
export function dropSaved(name: string) { try { localStorage.removeItem(PREFIX + name); } catch {} }

/** Clears this app's settings on this device only (look, theme, folds, seen items, pauses, read state). */
export function resetDevice() {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && (k.startsWith(PREFIX) || OLD.some((re) => re.test(k)))) keys.push(k); }
    for (const k of keys) localStorage.removeItem(k);
  } catch {}
}

export const isStringList = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === "string");
