"use client";

import { useEffect, useRef, useState } from "react";
import { useCourt } from "../CourtState";
import { useTick } from "../live/GridWins";
import { SamsaraLive } from "../live/SamsaraLive";
import { AROUND, LIMITS, chartOf, editCell, emptyGrid, fillEmpty, hasChart, resetToImported, tickId, undo, type Cell, type GridDef } from "@/lib/court/harada";
import { stamp } from "@/lib/court/time";
import { Btn, Card, EmptyState, TabPills } from "../ui";

// Grid & Wins (Life Hub, full width): Chart | Weekly targets. The chart is the Harada "Open Window 64": nine 3x3
// blocks; the centre block holds the main goal with the 8 sub-goals around it, and each outer block repeats its
// sub-goal in the middle (one field, so the two can never drift apart) with its 8 actions around it. Ticks are
// the existing grid ticks by position (1.1 to 8.8); every tick waters the garden and undo takes it back.

type Sel = Cell | null;
const label = (c: Cell) => (c.kind === "goal" ? "Main goal" : c.kind === "pillar" ? `Sub-goal ${c.p + 1}` : `Action ${tickId(c.p, c.a)}`);

export function GridAndWins() {
  const [tab, setTab] = useState<"chart" | "targets">("chart");
  return (
    <Card title="Grid & Wins" sub="one goal, eight pillars, sixty-four actions" className="kfull" id="grid-wins">
      <TabPills label="Grid & Wins" value={tab} options={[["chart", "Chart"], ["targets", "Weekly targets"]] as const} onChange={setTab} />
      {tab === "chart" ? <Chart /> : <SamsaraLive onWriteThesis={() => { window.location.hash = "trades"; }} />}
    </Card>
  );
}

function Chart() {
  const { st, update, save } = useCourt();
  const tick = useTick();
  const g = chartOf(st.defs.grid, st.gridDefs);
  const [sel, setSel] = useState<Sel>(null);
  const [view, setView] = useState<"chart" | "list">("chart");
  const [focus, setFocus] = useState(4);
  const [wizard, setWizard] = useState(false);
  const done = st.grid.done;
  const pDone = (p: number) => Array.from({ length: 8 }, (_, a) => !!done[tickId(p, a)]).filter(Boolean).length;

  if (wizard || !hasChart(g)) {
    if (!wizard) return (
      <EmptyState who="kumo">
        No chart yet. Build one goal, eight sub-goals and sixty-four small actions, one step at a time. <Btn kind="sm" onClick={() => setWizard(true)}>Start the guided wizard</Btn>
      </EmptyState>
    );
    return <HaradaWizard base={hasChart(g) ? g : null} onClose={() => setWizard(false)} />;
  }
  const chart = g!;
  const total = Object.keys(done).filter((id) => done[id] && /^[1-8]\.[1-8]$/.test(id)).length;
  const cellBtn = (c: Cell, text: string, cls: string, key: string) => (
    <button key={key} type="button" className={"hcell " + cls + (sel && JSON.stringify(sel) === JSON.stringify(c) ? " sel" : "")} onClick={() => setSel(c)} aria-label={`${label(c)}: ${text || "empty"}${c.kind === "act" && done[tickId(c.p, c.a)] ? ", done" : ""}`}>
      <span>{text || "+"}</span>
    </button>
  );
  const block = (b: number) => {
    if (b === 4) return (
      <div key={b} className={"hblock centre" + (focus === 4 ? " focus" : "")} role="group" aria-label="Main goal and sub-goals">
        {Array.from({ length: 9 }, (_, i) => i === 4 ? cellBtn({ kind: "goal" }, chart.goal, "goal" + (total === 64 ? " full" : ""), "g")
          : (() => { const p = AROUND.indexOf(i as never); return cellBtn({ kind: "pillar", p }, chart.pillars[p].name, "pillar" + (pDone(p) === 8 ? " full" : ""), "c" + i); })())}
      </div>
    );
    const p = AROUND.indexOf(b as never);
    return (
      <div key={b} className={"hblock" + (pDone(p) === 8 ? " sparkle" : "") + (focus === b ? " focus" : "")} role="group" aria-label={`Sub-goal ${p + 1}: ${chart.pillars[p].name}`}>
        {Array.from({ length: 9 }, (_, i) => i === 4 ? cellBtn({ kind: "pillar", p }, chart.pillars[p].name, "pillar mid", "m")
          : (() => { const a = AROUND.indexOf(i as never); return cellBtn({ kind: "act", p, a }, chart.pillars[p].acts[a].t, done[tickId(p, a)] ? "act on" : "act", "a" + i); })())}
      </div>
    );
  };
  return (
    <div className="hwrap">
      <div className="kform-row">
        <TabPills label="Chart or list" value={view} options={[["chart", "Chart"], ["list", "List"]] as const} onChange={setView} />
        <span className="note">{total} of 64 done · {save === "saving" ? "saving…" : save === "offline" ? "not saved yet, retrying" : "all changes saved"}</span>
      </div>
      {view === "chart" ? <>
        <div className="hpick" role="group" aria-label="Show one block">
          {[4, ...AROUND].map((b) => <button key={b} type="button" aria-pressed={focus === b} aria-label={b === 4 ? "Main goal block" : `Sub-goal ${AROUND.indexOf(b as never) + 1}: ${chart.pillars[AROUND.indexOf(b as never)].name}`} className={focus === b ? "on" : ""} onClick={() => setFocus(b)}>{b === 4 ? "Goal" : AROUND.indexOf(b as never) + 1}</button>)}
        </div>
        <div className="hgrid">{Array.from({ length: 9 }, (_, b) => block(b))}</div>
      </> : (
        <div className="hlist">
          <p><b>{chart.goal}</b></p>
          {chart.pillars.map((p, pi) => (
            <details key={pi} className="pillar"><summary><b>{pi + 1}. {p.name || "(empty sub-goal)"}</b> <span className="note">{pDone(pi)}/8</span></summary>
              {p.acts.map((a, ai) => (
                <div className="krow" key={ai}>
                  <label className="kcheck"><input type="checkbox" aria-label={`Done: ${tickId(pi, ai)} ${a.t}`} checked={!!done[tickId(pi, ai)]} onChange={(e) => tick("grid", tickId(pi, ai), e.target.checked, "grid")} /><span className="note">{tickId(pi, ai)}</span></label>
                  <span className="krow-main">{a.t || "(empty)"}{(a.when || a.why) && <><br /><span className="note">{[a.when, a.why].filter(Boolean).join(" · ")}</span></>}</span>
                  <Btn kind="sm ghost" onClick={() => setSel({ kind: "act", p: pi, a: ai })}>Edit</Btn>
                </div>
              ))}
            </details>
          ))}
        </div>
      )}
      {sel && <Editor key={JSON.stringify(sel)} cell={sel} chart={chart} onClose={() => setSel(null)} />}
      <div className="kform-row">
        <Btn kind="sm ghost" disabled={!st.gridDefs.hist.length} onClick={() => update((d) => { d.gridDefs = undo(d.gridDefs, d.defs.grid); }, ["gridDefs"])}>Undo last edit</Btn>
        <Btn kind="sm ghost" disabled={!st.gridDefs.cur || !st.defs.grid} onClick={() => window.confirm("Go back to your imported chart? Your current version is kept in the history.") && update((d) => { d.gridDefs = resetToImported(d.gridDefs, chartOf(d.defs.grid, d.gridDefs), new Date().toISOString()); }, ["gridDefs"])}>Reset to my imported chart</Btn>
        <Btn kind="sm ghost" onClick={() => setWizard(true)}>Rebuild with the guided wizard</Btn>
      </div>
      {st.gridDefs.hist.length > 0 && (
        <details><summary className="note">Version history (last {st.gridDefs.hist.length})</summary>
          {st.gridDefs.hist.map((h, i) => (
            <div className="krow" key={h.at + i}><span className="krow-main"><time className="ts">{stamp(h.at)}</time> · {h.g.goal || "(no goal)"}</span>
              <Btn kind="sm ghost" onClick={() => update((d) => { const base = chartOf(d.defs.grid, d.gridDefs) ?? emptyGrid(); d.gridDefs = { ...d.gridDefs, cur: h.g, hist: [{ at: new Date().toISOString(), g: base }, ...d.gridDefs.hist.filter((_, j) => j !== i)].slice(0, 5) }; }, ["gridDefs"])}>Restore</Btn></div>
          ))}
        </details>
      )}
      <p className="note">Tap a cell for its full text, timing and why. Astrology gives timing, not outcomes.</p>
    </div>
  );
}

/** The editor sheet for one cell: autosaves after a short pause; the version before the first change goes into history. */
function Editor({ cell, chart, onClose }: { cell: Cell; chart: GridDef; onClose: () => void }) {
  const { st, update } = useCourt();
  const tick = useTick();
  const a = cell.kind === "act" ? chart.pillars[cell.p].acts[cell.a] : null;
  const [f, setF] = useState({ text: cell.kind === "goal" ? chart.goal : cell.kind === "pillar" ? chart.pillars[cell.p].name : a!.t, why: a?.why ?? "", when: a?.when ?? "" });
  const first = useRef(true), timer = useRef<number | undefined>(undefined), pending = useRef<typeof f | null>(null);
  const max = cell.kind === "goal" ? LIMITS.goal : cell.kind === "pillar" ? LIMITS.name : LIMITS.t;
  function change(next: typeof f) {
    setF(next);
    pending.current = next;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(flush, 600);
  }
  function flush() {
    const next = pending.current;
    if (!next) return;
    pending.current = null;
    const snap = first.current; first.current = false;
    update((d) => { d.gridDefs = editCell(d.gridDefs, chartOf(d.defs.grid, d.gridDefs) ?? emptyGrid(), cell, next, new Date().toISOString(), snap); }, ["gridDefs"]);
  }
  // closing the editor or tapping another cell saves what was typed, never drops it
  useEffect(() => () => { window.clearTimeout(timer.current); flush(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const id = cell.kind === "act" ? tickId(cell.p, cell.a) : null;
  return (
    <div className="kform hedit" role="dialog" aria-label={"Edit " + label(cell)}>
      <div className="kform-row"><b>{label(cell)}</b><Btn kind="sm ghost" onClick={onClose}>Close</Btn></div>
      {cell.kind === "pillar" && <p className="note">This sub-goal shows in the centre block and in the middle of its own block.</p>}
      <textarea aria-label={label(cell)} maxLength={max} value={f.text} onChange={(e) => change({ ...f, text: e.target.value })} />
      <span className="note">{f.text.length} / {max}</span>
      {a && <>
        <input aria-label="When" placeholder="When (e.g. weekly, Sundays)" maxLength={LIMITS.when} value={f.when} onChange={(e) => change({ ...f, when: e.target.value })} />
        <textarea aria-label="Why" placeholder="Why it matters" maxLength={LIMITS.why} value={f.why} onChange={(e) => change({ ...f, why: e.target.value })} />
        <label className="kcheck"><input type="checkbox" checked={!!st.grid.done[id!]} onChange={(e) => tick("grid", id!, e.target.checked, "grid")} />Done ({id})</label>
      </>}
    </div>
  );
}

/** Reusable guided wizard: main goal, then 8 sub-goals, then 8 actions for each. Skippable and resumable; the draft
 *  is saved as she goes. On an existing chart it fills empty cells only, so a ticked action never changes meaning. */
export function HaradaWizard({ base, onClose }: { base: GridDef | null; onClose: () => void }) {
  const { st, update } = useCourt();
  const start = st.gridDefs.draft ?? { step: 0, g: base ?? emptyGrid() };
  // on an existing chart the cells that already have text are shown but locked: the wizard fills empty cells only
  const locked = (t?: string) => !!base && !!t?.trim();
  const [w, setW] = useState(start);
  const saveDraft = (next: typeof w) => { setW(next); update((d) => { d.gridDefs = { ...d.gridDefs, draft: next }; }, ["gridDefs"]); };
  const finish = () => update((d) => {
    const cur = chartOf(d.defs.grid, d.gridDefs);
    const g = fillEmpty(hasChart(cur) ? cur : null, w.g);
    d.gridDefs = { cur: g, hist: cur && hasChart(cur) ? [{ at: new Date().toISOString(), g: cur }, ...d.gridDefs.hist].slice(0, 5) : d.gridDefs.hist, draft: null };
  }, ["gridDefs"]);
  const set = (fn: (g: GridDef) => void) => { const g: GridDef = JSON.parse(JSON.stringify(w.g)); fn(g); setW({ ...w, g }); };
  const step = w.step, p = step - 2;
  return (
    <div className="kstep" aria-label="Guided chart wizard">
      <div className="kstep-dots" aria-hidden="true">{Array.from({ length: 10 }, (_, i) => <i key={i} className={i <= step ? "on" : ""} />)}</div>
      <p className="note">Step {step + 1} of 10 · saved as a draft as you go{base ? " · fills only the cells that are still empty" : ""}</p>
      {step === 0 && <label className="kform">Your main goal<input maxLength={LIMITS.goal} readOnly={locked(base?.goal)} value={locked(base?.goal) ? base!.goal : w.g.goal} onChange={(e) => set((g) => { g.goal = e.target.value; })} placeholder="For example: a calm, funded life by 2030" /></label>}
      {step === 1 && <div className="kform">Eight sub-goals (pillars){w.g.pillars.map((x, i) => <input key={i} aria-label={`Sub-goal ${i + 1}`} maxLength={LIMITS.name} readOnly={locked(base?.pillars[i].name)} value={locked(base?.pillars[i].name) ? base!.pillars[i].name : x.name} onChange={(e) => set((g) => { g.pillars[i].name = e.target.value; })} placeholder={`Sub-goal ${i + 1}`} />)}</div>}
      {step >= 2 && <div className="kform">Eight actions for “{w.g.pillars[p].name || `sub-goal ${p + 1}`}”{w.g.pillars[p].acts.map((x, i) => <input key={i} aria-label={`Action ${tickId(p, i)}`} maxLength={LIMITS.t} readOnly={locked(base?.pillars[p].acts[i].t)} value={locked(base?.pillars[p].acts[i].t) ? base!.pillars[p].acts[i].t : x.t} onChange={(e) => set((g) => { g.pillars[p].acts[i].t = e.target.value; })} placeholder={`Action ${tickId(p, i)}`} />)}</div>}
      <div className="kform-row">
        <Btn kind="ghost" disabled={step === 0} onClick={() => saveDraft({ ...w, step: step - 1 })}>Back</Btn>
        {step < 9 ? <Btn onClick={() => saveDraft({ ...w, step: step + 1 })}>Next (or skip)</Btn> : <Btn onClick={() => { finish(); onClose(); }}>Finish</Btn>}
        <Btn kind="ghost" onClick={() => { saveDraft(w); onClose(); }}>Save draft and close</Btn>
      </div>
    </div>
  );
}
