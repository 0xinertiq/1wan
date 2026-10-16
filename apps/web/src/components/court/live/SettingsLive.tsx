"use client";

import { useState } from "react";
import { useCourt } from "../CourtState";
import { LCATS, LEADS, money, ruleText, type LifeRule } from "@/lib/court/state";
import { prettyDay } from "@/lib/court/time";

// Header numbers (streak, stars) from her state.
export function HeaderStats() {
  const { st } = useCourt();
  return (
    <>
      <div className="pill" title="Daily check-in streak">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c1 4.2 5.2 6 5.2 11a5.2 5.2 0 0 1-10.4 0c0-2.2 1-3.5 2.3-4.6.1 2 .9 3.1 2 3.4-.6-4 .4-6.4.9-9.8z" fill="#FF9DBF" stroke="#A34876" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        <b id="streak">{st.streak}</b> day streak
      </div>
      <div className="pill" title="Stars collected">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="#FFD95E" stroke="#A34876" strokeWidth="1.8" strokeLinejoin="round" /></svg>
        <b id="stars">{st.stars}</b> stars
      </div>
    </>
  );
}

const WDS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Settings from dashboard-v52 (moreDet), life admin part: Coco's list behind Coming up.
export function SettingsLive() {
  const { st, k, update } = useCourt();
  const [f, setF] = useState({ name: "", amt: "", kind: "dom", num: "", date: "", cat: "bill", lead: "", wk: [] as number[] });
  const [msg, setMsg] = useState("");

  function add(e: React.FormEvent) {
    e.preventDefault();
    const name = f.name.trim().slice(0, 50);
    if (!name) return setMsg("Give the item a name first.");
    const n = +f.num;
    let rule: LifeRule;
    if (f.kind === "dom") { if (!(n >= 1 && n <= 31)) return setMsg("Pick a day of the month from 1 to 31."); rule = { type: "dom", d: Math.round(n) }; }
    else if (f.kind === "every") { if (!(n >= 1)) return setMsg("Pick how many days between each one."); rule = { type: "every", n: Math.round(n), last: f.date || k }; }
    else if (f.kind === "wk") { if (!f.wk.length) return setMsg("Tick at least one weekday."); rule = { type: "wk", days: [...f.wk].sort() }; }
    else { if (!f.date) return setMsg("Pick the date."); rule = { type: "once", date: f.date }; }
    if (st.life.length >= 60) return setMsg("The list is full. Remove something first.");
    const lead = f.lead === "" ? LEADS[f.cat] : Math.max(0, Math.min(30, +f.lead));
    const amt = f.amt === "" ? null : Math.max(0, +f.amt);
    update((d) => { d.life.push({ id: "u" + Date.now() + Math.floor(Math.random() * 1000), name, cat: f.cat, amt, rule, lead, note: "" }); }, ["life"]);
    setF({ ...f, name: "", amt: "", num: "", date: "" });
    setMsg(`Added "${name}" to the life list.`);
  }

  return (
    <details className="win" id="moreDet">
      <summary className="win-title"><h2>Settings</h2><span className="sub">Life admin, your data</span></summary>
      <div className="win-body">
        <div className="sec-h">Your data</div>
        <p className="note xd">Everything here is private to you. Download a full copy any time.</p>
        <div className="rep-act"><a className="btn sm ghost" href="/api/export">Export my data</a></div>
        <div className="sec-h">Life admin</div>
        <p className="note xd">Coco keeps bills, care and renewals. Momo slots them into free time.</p>
        <div id="lifeList">
          {st.life.length ? st.life.map((it) => (
            <div className="filed-row" key={it.id}>
              <span>{it.name}{it.amt != null && <> <span className="note">{money(it.amt)}</span></>} <span className="note">{LCATS[it.cat] ?? it.cat} · {ruleText(it.rule)}{it.lead ? ` · remind ${it.lead}d ahead` : ""}{it.sched && it.sched >= k ? ` · booked ${prettyDay(it.sched)}` : ""}</span></span>
              <span className="rep-act">
                <input type="date" className="lsd" value={it.sched ?? ""} aria-label={`Booked for ${it.name}`} onChange={(e) => update((d) => { const x = d.life.find((i) => i.id === it.id); if (x) x.sched = e.target.value; }, ["life"])} />
                <button className="btn sm ghost" type="button" onClick={() => update((d) => { d.life = d.life.filter((i) => i.id !== it.id); }, ["life"])}>Remove</button>
              </span>
            </div>
          )) : <p className="note">Nothing on the list.</p>}
        </div>
        <form className="field" id="lifeForm" onSubmit={add}>
          <label htmlFor="lfName">Add an item</label>
          <div className="field-row">
            <input id="lfName" type="text" maxLength={50} autoComplete="off" placeholder="Name, for example Car insurance" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <input id="lfAmt" type="number" min="0" step="0.01" placeholder="Amount" aria-label="Amount" value={f.amt} onChange={(e) => setF({ ...f, amt: e.target.value })} />
          </div>
          <div className="field-row">
            <select id="lfKind" aria-label="Repeats" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
              <option value="dom">Day of month</option><option value="every">Every N days</option><option value="wk">Weekly</option><option value="once">Once</option>
            </select>
            {(f.kind === "dom" || f.kind === "every") && <input id="lfNum" type="number" min="1" max="365" placeholder={f.kind === "dom" ? "Day of month" : "Every how many days"} aria-label="Number" value={f.num} onChange={(e) => setF({ ...f, num: e.target.value })} />}
            {(f.kind === "every" || f.kind === "once") && <input id="lfDate" type="date" aria-label={f.kind === "every" ? "Last done" : "Date"} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} />}
          </div>
          {f.kind === "wk" && (
            <div className="field-row" id="lfWk">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <label key={d}><input type="checkbox" checked={f.wk.includes(d)} onChange={(e) => setF({ ...f, wk: e.target.checked ? [...f.wk, d] : f.wk.filter((x) => x !== d) })} />{WDS[d]}</label>
              ))}
            </div>
          )}
          <div className="field-row">
            <select id="lfCat" aria-label="Kind" value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })}>
              {Object.entries(LCATS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <input id="lfLead" type="number" min="0" max="30" placeholder={`Remind ${LEADS[f.cat]} days ahead`} aria-label="Days of warning" value={f.lead} onChange={(e) => setF({ ...f, lead: e.target.value })} />
            <button className="btn" type="submit">Add</button>
          </div>
          {msg && <p className="note" role="status">{msg}</p>}
        </form>
      </div>
    </details>
  );
}
