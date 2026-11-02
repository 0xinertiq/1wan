// Save merge for her user_state document (used by /api/state). Pure, so it is tested on its own.
// A patch may only hold keys this UI owns; it replaces those keys and leaves every other key untouched.
export function mergePatch(doc: unknown, patch: unknown, owned: ReadonlySet<string>):
  { ok: true; merged: Record<string, unknown> } | { ok: false; error: string } {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return { ok: false, error: "Missing patch" };
  const bad = Object.keys(patch).filter((k) => !owned.has(k));
  if (bad.length) return { ok: false, error: "Keys not owned by this page: " + bad.join(", ") };
  const base = doc && typeof doc === "object" && !Array.isArray(doc) ? (doc as Record<string, unknown>) : {};
  return { ok: true, merged: { ...base, ...(patch as Record<string, unknown>) } };
}

// Round 22: two devices. When a save is out of date (another device saved first), the client merges three copies
// per key: `base` (what this device last knew the server had), `local` (this device now) and `remote` (the newer
// server copy). A side that did not change keeps the other side's change; when both changed, plain objects merge
// key by key and lists of items with an id merge item by item, so ticks on one device never wipe ticks on another.
// Anything else changed on both sides keeps this device's value (the change being saved now).
type J = unknown;
const isPlain = (v: J): v is Record<string, J> => !!v && typeof v === "object" && !Array.isArray(v);
const isIdList = (v: J): v is { id: string }[] => Array.isArray(v) && v.every((x) => isPlain(x) && typeof x.id === "string") && new Set(v.map((x) => (x as { id: string }).id)).size === v.length;
export function same(a: J, b: J): boolean {
  if (a === b) return true;
  if (Array.isArray(a)) return Array.isArray(b) && a.length === b.length && a.every((x, i) => same(x, b[i]));
  if (isPlain(a)) {
    if (!isPlain(b)) return false;
    const ka = Object.keys(a).filter((k) => a[k] !== undefined), kb = Object.keys(b).filter((k) => b[k] !== undefined);
    return ka.length === kb.length && ka.every((k) => same(a[k], b[k]));
  }
  return false;
}
export function merge3(base: J, local: J, remote: J): J {
  if (same(local, remote)) return local;
  if (same(base, local)) return remote;
  if (same(base, remote)) return local;
  if (isPlain(local) && isPlain(remote)) {
    const b = isPlain(base) ? base : {};
    const out: Record<string, J> = {};
    for (const k of new Set([...Object.keys(remote), ...Object.keys(local)])) {
      const v = merge3(b[k], local[k], remote[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  if (isIdList(local) && isIdList(remote)) {
    const by = (l: { id: string }[]) => new Map(l.map((x) => [x.id, x]));
    const bm = by(isIdList(base) ? base : []), lm = by(local), rm = by(remote);
    const ids = [...remote.map((x) => x.id), ...local.map((x) => x.id).filter((id) => !rm.has(id))];
    return ids.map((id) => merge3(bm.get(id), lm.get(id), rm.get(id))).filter((v) => v !== undefined);
  }
  return local;
}
