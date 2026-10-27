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
