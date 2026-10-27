"use client";

import { useEffect, useState } from "react";
import { useCourt } from "../CourtState";
import { prettyDay } from "@/lib/court/time";

// Life > Trade (docs/build-trackers.md, Screens; docs/build-intel.md section G).
// Tracks and explains only: no buy, sell, size or timing suggestions, no auto-trading, ever.
type Row = Record<string, unknown> & { id: string; at?: string };
type Ledger = { trades: Row[]; plans: Row[]; gamble: Row[]; settings: { account: number | null; risk_pct: number | null; rules: string[] } | null };
type Atr = { atr: number | null; at?: string; reason?: string };

const CHECKS = ["c1", "c2", "c3", "c4", "c5", "c6", "c7", "c8", "c9"];
// Default wording only; she can rename each check to match her old ledger. c6 is the 11pm to 6am rule.
const CHECK_DEFAULT: Record<string, string> = {
  c1: "Thesis written down", c2: "Entry level set", c3: "Stop set before entry", c4: "Size from the sizer, within my risk %",
  c5: "Risk/reward checked", c6: "Not between 11pm and 6am", c7: "News and calendar checked", c8: "Calm: not chasing, not revenge", c9: "My three rules re-read",
};
const n = (v: unknown) => (v === "" || v == null ? null : isFinite(+v) ? +v : null);
const fmt = (v: number | null, d = 2) => (v == null ? "–" : (Math.round(v * 10 ** d) / 10 ** d).toLocaleString("en-SG"));
const uid = (p: string) => p + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
const sgtHour = (iso: string) => new Date(Date.parse(iso) + 8 * 3600000).getUTCHours();
const lateNight = (iso?: string) => !!iso && (sgtHour(iso) >= 23 || sgtHour(iso) < 6);
export function checkCount(c: unknown) {
  if (Array.isArray(c)) return c.filter((x) => CHECKS.includes(String(x))).length;
  if (c && typeof c === "object") return CHECKS.filter((id) => (c as Record<string, unknown>)[id]).length;
  return 0;
}

export function TradeLive() {
  const { st, k, update } = useCourt();
  const [L, setL] = useState<Ledger | null>(null);
  const [setup, setSetup] = useState(false);
  const [msg, setMsg] = useState("");
  const label = (id: string) => st.tchk[id] || CHECK_DEFAULT[id];

  useEffect(() => {
    fetch("/api/ledger").then((r) => r.json()).then((j) => {
      if (j.setup) { setSetup(true); return; }
      if (j.trades) setL(j);
      else setMsg("Could not load the ledger. Try again later.");
    }).catch(() => setMsg("Could not load the ledger. Try again later."));
  }, []);

  async function save(table: "trades" | "plans" | "gamble" | "ledger_settings", row: Record<string, unknown>) {
    const r = await fetch("/api/ledger", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ table, row }) });
    const j = await r.json().catch(() => ({}));
    if (j.setup) { setSetup(true); return false; }
    if (!r.ok) { setMsg(j.error || "Could not save."); return false; }
    setMsg("Saved.");
    if (table !== "ledger_settings" && j.row) setL((l) => l && { ...l, [table]: [j.row, ...l[table].filter((x) => x.id !== j.row.id)] });
    if (table === "ledger_settings") setL((l) => l && { ...l, settings: row as Ledger["settings"] });
    return true;
  }
  async function remove(table: "trades" | "plans" | "gamble", id: string) {
    const r = await fetch(`/api/ledger?table=${table}&id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (r.ok) setL((l) => l && { ...l, [table]: l[table].filter((x) => x.id !== id) });
  }

  if (setup) return <p className="note">The trade ledger needs one setup step first. See <b>docs/manual-steps.md</b>, section G. Your old ledger comes in with that step too.</p>;
  if (!L) return <p className="note">{msg || "Loading…"}</p>;

  return (
    <div className="money trade">
      <p className="note xd">Fenn keeps your ledger. Everything here tracks and explains your own records; none of it is advice.</p>
      {msg && <p className="note" role="status">{msg}</p>}
      <Sizer s={L.settings} onSave={(row) => save("ledger_settings", row)} />
      <Review trades={L.trades} />
      <Plans plans={L.plans} k={k} label={label} onSave={(r) => save("plans", r)} onRemove={(id) => remove("plans", id)} />
      <Trades trades={L.trades} plans={L.plans} k={k} label={label} onSave={(r) => save("trades", r)} onRemove={(id) => remove("trades", id)} />
      <Gamble rows={L.gamble} k={k} onSave={(r) => save("gamble", r)} onRemove={(id) => remove("gamble", id)} />
      <details>
        <summary className="sec-h">Wording of the "Before you enter" checks</summary>
        <p className="note">Rename any check so it matches your old ledger. The ids stay the same, so your history still lines up.</p>
        {CHECKS.map((id) => (
          <div className="field-row" key={id}>
            <span className="note">{id}</span>
            <input type="text" maxLength={60} aria-label={`Wording for ${id}`} value={label(id)} onChange={(e) => update((d) => { d.tchk = { ...d.tchk, [id]: e.target.value }; }, ["tchk"])} />
          </div>
        ))}
      </details>
    </div>
  );
}

function Sizer({ s, onSave }: { s: Ledger["settings"]; onSave: (row: Record<string, unknown>) => Promise<boolean> }) {
  const [acc, setAcc] = useState(s?.account != null ? String(s.account) : "");
  const [risk, setRisk] = useState(s?.risk_pct != null ? String(s.risk_pct) : "");
  const [rules, setRules] = useState<string[]>([0, 1, 2].map((i) => s?.rules?.[i] ?? ""));
  const [e, setE] = useState({ entry: "", stop: "" });
  const a = n(acc), r = n(risk), en = n(e.entry), sp = n(e.stop);
  const riskAmt = a != null && r != null ? (a * r) / 100 : null;
  const dist = en != null && sp != null ? Math.abs(en - sp) : null;
  const units = riskAmt != null && dist ? riskAmt / dist : null;
  return (
    <>
      <div className="sec-h">Position sizer</div>
      <p className="note xd">Plain arithmetic: how many units put your chosen risk % between entry and stop.</p>
      <div className="field-row">
        <input type="number" min="0" step="any" placeholder="Account (S$ or USDT)" aria-label="Account" value={acc} onChange={(x) => setAcc(x.target.value)} />
        <input type="number" min="0" max="100" step="any" placeholder="Risk %" aria-label="Risk percent" value={risk} onChange={(x) => setRisk(x.target.value)} />
      </div>
      <div className="field-row">
        <input type="number" step="any" placeholder="Entry" aria-label="Entry" value={e.entry} onChange={(x) => setE({ ...e, entry: x.target.value })} />
        <input type="number" step="any" placeholder="Stop" aria-label="Stop" value={e.stop} onChange={(x) => setE({ ...e, stop: x.target.value })} />
      </div>
      <div className="filed-row"><span>Risk amount</span><span>{fmt(riskAmt)}</span></div>
      <div className="filed-row"><span>Units</span><span>{fmt(units, 6)}</span></div>
      <div className="filed-row"><span>Position value at entry</span><span>{fmt(units != null && en != null ? units * en : null)}</span></div>
      <div className="sec-h">My three rules</div>
      {rules.map((x, i) => <input key={i} type="text" maxLength={140} placeholder={`Rule ${i + 1}`} aria-label={`Rule ${i + 1}`} value={x} onChange={(ev) => setRules(rules.map((y, j) => (j === i ? ev.target.value : y)))} />)}
      <p className="note">{rules.every((x) => x.trim()) ? "All three rules written (this also ticks Small Wins a3 and grid 1.2)." : "Write all three to tick Small Wins a3 and grid 1.2."}</p>
      <div className="rep-act"><button className="btn sm" type="button" onClick={() => onSave({ account: a, risk_pct: r, rules: rules.map((x) => x.trim()) })}>Save account, risk and rules</button></div>
    </>
  );
}

function Review({ trades }: { trades: Row[] }) {
  const closed = trades.filter((t) => n(t.pnl) != null);
  const pnl = closed.map((t) => n(t.pnl)!);
  const wins = pnl.filter((x) => x > 0), losses = pnl.filter((x) => x < 0);
  const total = pnl.reduce((a, b) => a + b, 0);
  const avgW = wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : null;
  const avgL = losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : null;
  const full = trades.filter((t) => checkCount(t.checks) === 9).length;
  const late = trades.filter((t) => lateNight(t.at)).length;
  const tags: Record<string, number> = {};
  closed.filter((t) => n(t.pnl)! < 0).forEach((t) => (Array.isArray(t.tags) ? t.tags : []).forEach((g) => { const s = String(g).trim().toLowerCase(); if (s) tags[s] = (tags[s] ?? 0) + 1; }));
  const top = Object.entries(tags).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const tiles: [string, string][] = [
    ["Trades logged", String(trades.length)], ["Closed with P&L", String(closed.length)],
    ["Win rate", closed.length ? Math.round((wins.length / closed.length) * 100) + "%" : "–"],
    ["Average win", fmt(avgW)], ["Average loss", fmt(avgL)],
    ["Expectancy per trade", closed.length ? fmt(total / closed.length) : "–"], ["Total P&L", fmt(total)],
    ["Checklist 9/9", trades.length ? Math.round((full / trades.length) * 100) + "%" : "–"],
    ["Placed 11pm to 6am", String(late)],
  ];
  return (
    <>
      <div className="sec-h">Review</div>
      <div className="tiles">{tiles.map(([a, b]) => <div className="tile" key={a}><span className="note">{a}</span><b>{b}</b></div>)}</div>
      <p className="note">Gamble results are kept apart and never counted here.</p>
      <div className="sec-h">Recurring mistakes</div>
      {top.length ? top.map(([g, c]) => <div className="filed-row" key={g}><span>{g}</span><span>{c}×</span></div>) : <p className="note">No tags on losing trades yet. Tag a loss (for example fomo, early exit) and patterns show here.</p>}
    </>
  );
}

function Checks({ value, onChange, label }: { value: Record<string, boolean>; onChange: (v: Record<string, boolean>) => void; label: (id: string) => string }) {
  return (
    <fieldset className="checks">
      <legend className="note">Before you enter ({CHECKS.filter((c) => value[c]).length}/9)</legend>
      {CHECKS.map((id) => <label key={id}><input type="checkbox" checked={!!value[id]} onChange={(e) => onChange({ ...value, [id]: e.target.checked })} /> {label(id)}</label>)}
    </fieldset>
  );
}

// Section G: information flags only, never blocking. ATR is fetched, never typed.
function PlanFlags({ p }: { p: Row }) {
  const [atr, setAtr] = useState<Atr | null>(null);
  const entry = n(p.entry), stop = n(p.stop), target = n(p.target);
  const sym = String(p.inst ?? "").toUpperCase().replace(/[^A-Z0-9].*$/, "");
  if (entry == null || stop == null) return null;
  const dist = Math.abs(entry - stop);
  const rr = target != null && dist ? Math.abs(target - entry) / dist : null;
  const flags: string[] = [];
  if (atr?.atr != null && dist < atr.atr) flags.push(`Stop is under 1 ATR from entry (${fmt(dist)} vs ATR ${fmt(atr.atr)}).`);
  if (entry && dist / entry > 0.3) flags.push("Stop is more than 30% from entry.");
  return (
    <div className="note">
      {rr != null && <>Risk/reward {fmt(rr)} : 1. </>}
      {atr == null ? <button className="btn sm ghost" type="button" disabled={!sym} onClick={() => fetch("/api/atr?sym=" + sym).then((r) => r.json()).then(setAtr).catch(() => setAtr({ atr: null, reason: "Candles not reachable" }))}>Check stop vs ATR</button>
        : atr.atr == null ? <>ATR not available for {sym} ({atr.reason}). </> : <>Daily ATR(14) {fmt(atr.atr)}, candles from Crypto.com, {new Date(atr.at!).toLocaleString("en-SG", { timeZone: "Asia/Singapore" })}. </>}
      {flags.map((f) => <span key={f} className="flag"> ⚑ {f}</span>)}
      {(flags.length > 0 || dist / (entry || 1) > 0.3) && <> Review threshold, not a rule.</>}
    </div>
  );
}

function Plans({ plans, k, label, onSave, onRemove }: { plans: Row[]; k: string; label: (id: string) => string; onSave: (r: Record<string, unknown>) => Promise<boolean>; onRemove: (id: string) => void }) {
  const blank = { inst: "", dir: "long", entry: "", stop: "", target: "", until: "", narrative: "", seen_where: "", thesis: "", wrong: "", stage: "", confidence: "", share_x: false, checks: {} as Record<string, boolean> };
  const [f, setF] = useState(blank);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const go = () => { if (location.hash === "#write-thesis") { setOpen(true); document.getElementById("planForm")?.scrollIntoView({ block: "start" }); } };
    go(); window.addEventListener("hashchange", go); return () => window.removeEventListener("hashchange", go);
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.inst.trim() || !f.thesis.trim()) return;
    const ok = await onSave({ ...f, id: uid("p"), date: k, inst: f.inst.trim().toUpperCase(), entry: n(f.entry), stop: n(f.stop), target: n(f.target), until: f.until || null, confidence: n(f.confidence), at: new Date().toISOString() });
    if (ok) { setF(blank); setOpen(false); }
  }
  const set = (key: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [key]: e.target.value });
  return (
    <>
      <div className="sec-h">Plans and thesis log ({plans.length})</div>
      <details id="planForm" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
        <summary className="btn sm">Write a plan / thesis</summary>
        <form className="field" onSubmit={submit}>
          <div className="field-row">
            <input type="text" maxLength={20} placeholder="Instrument, for example BTC" aria-label="Instrument" value={f.inst} onChange={set("inst")} required />
            <select aria-label="Direction" value={f.dir} onChange={set("dir")}><option value="long">Long</option><option value="short">Short</option></select>
          </div>
          <div className="field-row">
            <input type="number" step="any" placeholder="Entry" aria-label="Entry" value={f.entry} onChange={set("entry")} />
            <input type="number" step="any" placeholder="Stop" aria-label="Stop" value={f.stop} onChange={set("stop")} />
            <input type="number" step="any" placeholder="Target" aria-label="Target" value={f.target} onChange={set("target")} />
          </div>
          <label className="note">Valid until <input type="date" value={f.until} onChange={set("until")} /></label>
          <textarea maxLength={600} placeholder="Narrative: what story is the market telling?" aria-label="Narrative" value={f.narrative} onChange={set("narrative")} />
          <input type="text" maxLength={120} placeholder="Where I saw it" aria-label="Where I saw it" value={f.seen_where} onChange={set("seen_where")} />
          <textarea maxLength={600} placeholder="Thesis" aria-label="Thesis" value={f.thesis} onChange={set("thesis")} required />
          <textarea maxLength={400} placeholder="What would prove it wrong" aria-label="What would prove it wrong" value={f.wrong} onChange={set("wrong")} />
          <div className="field-row">
            <input type="text" maxLength={40} placeholder="Stage (idea, watching, ready)" aria-label="Stage" value={f.stage} onChange={set("stage")} />
            <select aria-label="Confidence" value={f.confidence} onChange={set("confidence")}><option value="">Confidence</option>{[1, 2, 3, 4, 5].map((x) => <option key={x} value={x}>{x} of 5</option>)}</select>
          </div>
          <label><input type="checkbox" checked={f.share_x} onChange={(e) => setF({ ...f, share_x: e.target.checked })} /> Share on X</label>
          <Checks value={f.checks} onChange={(checks) => setF({ ...f, checks })} label={label} />
          <button className="btn" type="submit">Save plan</button>
        </form>
      </details>
      {plans.map((p) => (
        <div className="filed-row col" key={p.id}>
          <span><b>{String(p.inst ?? "")}</b> {String(p.dir ?? "")} <span className="note">{p.date ? prettyDay(String(p.date)) : ""} · {String(p.outcome ?? "open")} · checks {checkCount(p.checks)}/9{p.until ? " · until " + prettyDay(String(p.until)) : ""}</span></span>
          {!!p.thesis && <span className="note">{String(p.thesis)}</span>}
          <PlanFlags p={p} />
          <span className="rep-act">
            <select aria-label="Outcome" value={String(p.outcome ?? "open")} onChange={(e) => onSave({ ...p, outcome: e.target.value })}>{["open", "triggered", "placed", "invalidated", "expired", "done"].map((o) => <option key={o} value={o}>{o}</option>)}</select>
            <button className="btn sm ghost" type="button" onClick={() => onRemove(p.id)}>Remove</button>
          </span>
        </div>
      ))}
    </>
  );
}

function Trades({ trades, plans, k, label, onSave, onRemove }: { trades: Row[]; plans: Row[]; k: string; label: (id: string) => string; onSave: (r: Record<string, unknown>) => Promise<boolean>; onRemove: (id: string) => void }) {
  const blank = { date: k, inst: "", dir: "long", entry: "", stop: "", exit: "", size: "", lev: "", pnl: "", setup: "", lesson: "", tags: "", plan_id: "", checks: {} as Record<string, boolean> };
  const [f, setF] = useState(blank);
  const set = (key: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [key]: e.target.value });
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.inst.trim()) return;
    const ok = await onSave({ ...f, id: uid("t"), inst: f.inst.trim().toUpperCase(), entry: n(f.entry), stop: n(f.stop), exit: n(f.exit), size: n(f.size), lev: n(f.lev), pnl: n(f.pnl), plan_id: f.plan_id || null, tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 10), at: new Date().toISOString() });
    if (ok) setF(blank);
  }
  return (
    <>
      <div className="sec-h">Trade log ({trades.length})</div>
      <details>
        <summary className="btn sm">Log a trade</summary>
        <form className="field" onSubmit={submit}>
          <div className="field-row">
            <input type="date" aria-label="Date" value={f.date} onChange={set("date")} />
            <input type="text" maxLength={20} placeholder="Instrument" aria-label="Instrument" value={f.inst} onChange={set("inst")} required />
            <select aria-label="Direction" value={f.dir} onChange={set("dir")}><option value="long">Long</option><option value="short">Short</option></select>
          </div>
          <div className="field-row">
            <input type="number" step="any" placeholder="Entry" aria-label="Entry" value={f.entry} onChange={set("entry")} />
            <input type="number" step="any" placeholder="Stop" aria-label="Stop" value={f.stop} onChange={set("stop")} />
            <input type="number" step="any" placeholder="Exit" aria-label="Exit" value={f.exit} onChange={set("exit")} />
          </div>
          <div className="field-row">
            <input type="number" step="any" placeholder="Size" aria-label="Size" value={f.size} onChange={set("size")} />
            <input type="number" step="any" placeholder="Leverage" aria-label="Leverage" value={f.lev} onChange={set("lev")} />
            <input type="number" step="any" placeholder="P&L" aria-label="P and L" value={f.pnl} onChange={set("pnl")} />
          </div>
          <select aria-label="From plan" value={f.plan_id} onChange={set("plan_id")}><option value="">Not from a plan</option>{plans.map((p) => <option key={p.id} value={p.id}>{String(p.inst)} {String(p.dir)} {p.date ? prettyDay(String(p.date)) : ""}</option>)}</select>
          <input type="text" maxLength={120} placeholder="Setup" aria-label="Setup" value={f.setup} onChange={set("setup")} />
          <textarea maxLength={400} placeholder="Lesson (after)" aria-label="Lesson" value={f.lesson} onChange={set("lesson")} />
          <input type="text" maxLength={120} placeholder="Tags, comma separated (for example fomo, early exit)" aria-label="Tags" value={f.tags} onChange={set("tags")} />
          <Checks value={f.checks} onChange={(checks) => setF({ ...f, checks })} label={label} />
          <button className="btn" type="submit">Save trade</button>
        </form>
      </details>
      {trades.slice(0, 50).map((t) => (
        <div className="filed-row" key={t.id}>
          <span><b>{String(t.inst ?? "")}</b> {String(t.dir ?? "")} <span className="note">{t.date ? prettyDay(String(t.date)) : ""} · P&L {fmt(n(t.pnl))} · checks {checkCount(t.checks)}/9{lateNight(t.at) ? " · placed 11pm to 6am" : ""}</span></span>
          <button className="btn sm ghost" type="button" onClick={() => onRemove(t.id)}>Remove</button>
        </div>
      ))}
    </>
  );
}

function Gamble({ rows, k, onSave, onRemove }: { rows: Row[]; k: string; onSave: (r: Record<string, unknown>) => Promise<boolean>; onRemove: (id: string) => void }) {
  const [f, setF] = useState({ what: "", pnl: "", note: "" });
  const total = rows.reduce((a, r) => a + (n(r.pnl) ?? 0), 0);
  return (
    <details>
      <summary className="sec-h">Gamble log ({rows.length}), kept out of trading stats</summary>
      <div className="filed-row"><span>Total</span><span>{fmt(total)}</span></div>
      <form className="field" onSubmit={async (e) => { e.preventDefault(); if (!f.what.trim()) return; if (await onSave({ id: uid("g"), date: k, what: f.what.trim(), pnl: n(f.pnl), note: f.note.trim() || null, at: new Date().toISOString() })) setF({ what: "", pnl: "", note: "" }); }}>
        <div className="field-row">
          <input type="text" maxLength={60} placeholder="What" aria-label="What" value={f.what} onChange={(e) => setF({ ...f, what: e.target.value })} />
          <input type="number" step="any" placeholder="Result" aria-label="Result" value={f.pnl} onChange={(e) => setF({ ...f, pnl: e.target.value })} />
          <button className="btn sm" type="submit">Add</button>
        </div>
      </form>
      {rows.slice(0, 30).map((r) => (
        <div className="filed-row" key={r.id}>
          <span>{String(r.what ?? "")} <span className="note">{r.date ? prettyDay(String(r.date)) : ""} · {fmt(n(r.pnl))}</span></span>
          <button className="btn sm ghost" type="button" onClick={() => onRemove(r.id)}>Remove</button>
        </div>
      ))}
    </details>
  );
}
