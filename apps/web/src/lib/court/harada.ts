// Grid & Wins as a Harada "Open Window 64" chart (round 6, addendum 1). Pure helpers, no React.
// The imported chart (defs.grid) stays untouched as the original. Her edits are her own override in the optional
// user_state key gridDefs: { cur, hist (last 5 saved versions), draft (an unfinished wizard) }.
// Tick ids stay tied to the cell position ("1.1" to "8.8", in st.grid.done), so rewording never loses progress.

export type Act = { t: string; why: string; when: string };
export type GridDef = { goal: string; pillars: { name: string; acts: Act[] }[] };
export type GridDefs = { cur: GridDef | null; hist: { at: string; g: GridDef }[]; draft: { step: number; g: GridDef } | null };

export const LIMITS = { goal: 120, name: 60, t: 120, why: 200, when: 60 } as const;
export const HIST_MAX = 5;

const s = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
const o = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null);

/** Always 8 pillars of 8 actions; missing cells are empty text. */
export function cleanGrid(v: unknown): GridDef | null {
  const g = o(v);
  if (!g) return null;
  const ps = Array.isArray(g.pillars) ? g.pillars : [];
  return {
    goal: s(g.goal, LIMITS.goal),
    pillars: Array.from({ length: 8 }, (_, i) => {
      const p = o(ps[i]) ?? {}, acts = Array.isArray(p.acts) ? p.acts : [];
      return { name: s(p.name, LIMITS.name), acts: Array.from({ length: 8 }, (_, j) => { const a = o(acts[j]) ?? {}; return { t: s(a.t, LIMITS.t), why: s(a.why, LIMITS.why), when: s(a.when, LIMITS.when) }; }) };
    }),
  };
}
export const emptyGrid = (): GridDef => cleanGrid({})!;

/** normalize() default for the optional key: odd values are dropped, never thrown on. */
export function normGridDefs(v: unknown): GridDefs {
  const d = o(v) ?? {};
  const hist = (Array.isArray(d.hist) ? d.hist : []).map((h) => { const x = o(h); const g = x && cleanGrid(x.g); return g && typeof x!.at === "string" ? { at: x!.at as string, g } : null; }).filter((x): x is { at: string; g: GridDef } => !!x).slice(0, HIST_MAX);
  const dr = o(d.draft), dg = dr && cleanGrid(dr.g);
  return { cur: cleanGrid(d.cur), hist, draft: dg ? { step: Number.isInteger(dr!.step) ? Math.max(0, Math.min(9, dr!.step as number)) : 0, g: dg } : null };
}

/** The chart she sees: her own version, else the imported one, else nothing (the wizard's first-run state). */
export const chartOf = (imported: unknown, gd: GridDefs): GridDef | null => gd.cur ?? cleanGrid(imported);
export const hasChart = (g: GridDef | null) => !!g && (!!g.goal.trim() || g.pillars.some((p) => p.name.trim() || p.acts.some((a) => a.t.trim())));

export type Cell = { kind: "goal" } | { kind: "pillar"; p: number } | { kind: "act"; p: number; a: number };
/** Edit one cell; the version before it goes into history (newest first, last 5 kept). */
export function editCell(gd: GridDefs, base: GridDef, cell: Cell, patch: Partial<Act> & { text?: string }, at: string, snapshot = true): GridDefs {
  const g: GridDef = JSON.parse(JSON.stringify(base));
  if (cell.kind === "goal") g.goal = s(patch.text ?? g.goal, LIMITS.goal);
  else if (cell.kind === "pillar") g.pillars[cell.p].name = s(patch.text ?? g.pillars[cell.p].name, LIMITS.name);
  else { const a = g.pillars[cell.p].acts[cell.a]; g.pillars[cell.p].acts[cell.a] = { t: s(patch.text ?? a.t, LIMITS.t), why: s(patch.why ?? a.why, LIMITS.why), when: s(patch.when ?? a.when, LIMITS.when) }; }
  return { ...gd, cur: g, hist: snapshot ? [{ at, g: base }, ...gd.hist].slice(0, HIST_MAX) : gd.hist };
}
/** Undo the last saved edit: the newest history version comes back. */
export function undo(gd: GridDefs, imported: unknown): GridDefs {
  if (!gd.hist.length) return gd;
  const [last, ...rest] = gd.hist;
  const orig = cleanGrid(imported);
  return { ...gd, cur: orig && JSON.stringify(orig) === JSON.stringify(last.g) ? null : last.g, hist: rest };
}
/** Back to the imported chart; her current version is kept in history. */
export function resetToImported(gd: GridDefs, base: GridDef | null, at: string): GridDefs {
  return { ...gd, cur: null, hist: base && gd.cur ? [{ at, g: base }, ...gd.hist].slice(0, HIST_MAX) : gd.hist };
}
/** The wizard on an existing chart fills empty cells only, so no ticked action ever changes meaning. */
export function fillEmpty(base: GridDef | null, w: GridDef): GridDef {
  const b = base ?? emptyGrid();
  return {
    goal: b.goal.trim() ? b.goal : w.goal,
    pillars: b.pillars.map((p, i) => ({ name: p.name.trim() ? p.name : w.pillars[i].name, acts: p.acts.map((a, j) => (a.t.trim() ? a : w.pillars[i].acts[j])) })),
  };
}

/** Block layout: 9 blocks in a 3x3; the centre block (4) holds the goal and the 8 pillars; block order around. */
export const AROUND = [0, 1, 2, 3, 5, 6, 7, 8] as const;
export const tickId = (p: number, a: number) => `${p + 1}.${a + 1}`;
