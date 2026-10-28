"use client";

import { useVault } from "@/lib/vault";
import { dueSoon } from "@/lib/court/vaultDue";
import { useState } from "react";
import { PixelSprite } from "@/components/PixelSprite";
import { useCourt } from "../CourtState";
import { SprintLive } from "./SprintLive";
import { logQuest } from "@/lib/court/actions";
import { quoteOfDay } from "@/lib/court/quotes";
import { QUESTS } from "@/lib/court/quests";
import {
  dayQ, dueList, eventsOn, isDone, momoIdeas, money, openQuests, qScore, weekHab, whenText, type CalEvent,
} from "@/lib/court/state";
import { addDays, dur, greetWord, hm, prettyDay, weekKey } from "@/lib/court/time";

// Today window from dashboard-v52: since yesterday, glance strip, recap, up next, Momo's day,
// ideas for free time, Coming up and Park a thought. All from her saved state.

function Mini({ name }: { name: "momo" | "coco" | "kumo" }) {
  return <span className="mini"><PixelSprite name={name} /></span>;
}

// bare: the New look's merged Today card shows the title, Since yesterday and the glance numbers itself
// (TodayChips), and folds the rest of this window under "More".
export function TodayLive({ bare = false }: { bare?: boolean }) {
  const [tab, setTab] = useState<"brief" | "sky" | "week">("brief");
  const { st, k } = useCourt();
  const dateLabel = prettyDay(k);
  const yd = st.days[addDays(k, -1)];
  const Wrap = bare ? "div" : "section";

  return (
    <Wrap className={bare ? "today-bare" : "win"} id="todayWin" aria-labelledby={bare ? undefined : "tdT"}>
      {!bare && <div className="win-title"><h2 id="tdT">Today</h2><span className="sub" id="tdDate">{dateLabel}</span></div>}
      {!bare && <div id="sinceBox">
        <div className="sec-h">Since yesterday</div>
        <div className="win-line">
          <span className="pillx">{yd ? `Yesterday ${yd.d} of ${yd.t} habits` : "No record for yesterday"}</span>
          <span className={st.streak > 0 ? "pillx ok" : "pillx"}>{st.streak} day streak</span>
        </div>
      </div>}
      <div className="tabs" role="tablist" aria-label="Today views">
        {(["brief", "sky", "week"] as const).map((t) => (
          <button key={t} className="ttab" role="tab" id={`tt-${t}`} aria-controls={`tp-${t}`} aria-selected={tab === t} tabIndex={tab === t ? 0 : -1} type="button" onClick={() => setTab(t)}>
            {t === "brief" ? "Brief" : t === "sky" ? "Sky" : "Week"}
          </button>
        ))}
      </div>
      <div className="panel" id="tp-brief" role="tabpanel" aria-labelledby="tt-brief" hidden={tab !== "brief"}>
        {!bare && <Strip />}
        <RecapBox />
        <div id="dayCard" className="daycard">
          <NowCard />
          <MomoCard />
          <LifeCard />
        </div>
        <SprintLive />
        <DumpBox />
      </div>
      <div className="panel" id="tp-sky" role="tabpanel" aria-labelledby="tt-sky" hidden={tab !== "sky"}>
        <SkyPanel />
      </div>
      <div className="panel" id="tp-week" role="tabpanel" aria-labelledby="tt-week" hidden={tab !== "week"}>
        <WeekPanel />
      </div>
    </Wrap>
  );
}

// The glance numbers and Since yesterday as one compact row (New look's Today card).
export function TodayChips() {
  const { st, k, events } = useCourt();
  // Round 6: her tasks and routines due within 3 days count too.
  const tasks = useVault("tasks"), routines = useVault("routines");
  const wh = weekHab(st, k), due = dueList(st, k, events).filter((x) => x.dd <= 3).length + dueSoon(tasks.rows as never, routines.rows as never, k, 3).length;
  const yd = st.days[addDays(k, -1)];
  return (
    <div className="tchips" role="group" aria-label="Today at a glance">
      <span className="tchip"><i>Due soon</i><b>{due}</b></span>
      <span className="tchip"><i>Streak</i><b>{st.streak}</b></span>
      <span className="tchip"><i>Habits this week</i><b>{wh.d}/{wh.t}</b></span>
      <span className="tchip"><i>Yesterday</i><b>{yd ? `${yd.d}/${yd.t}` : "–"}</b></span>
    </div>
  );
}

function Strip() {
  const { st, k, events } = useCourt();
  const wh = weekHab(st, k), due = dueList(st, k, events).filter((x) => x.dd <= 3).length;
  return (
    <div id="stripBox">
      <div className="strip" role="group" aria-label="Today at a glance">
        <span className="sc"><i>Due soon</i><b>{due}</b></span>
        <span className="sc"><i>Streak</i><b>{st.streak}</b></span>
        <span className="sc"><i>Habits this week</i><b>{wh.d}/{wh.t}</b></span>
      </div>
      <figure className="qod">
        <figcaption>Quote of the day</figcaption>
        <blockquote>{quoteOfDay(k, st.uq)}</blockquote>
      </figure>
    </div>
  );
}

export function RecapBox() {
  const { recap: r, clearRecap, nm } = useCourt();
  if (!r) return <div id="recapBox"></div>;
  return (
    <div id="recapBox">
      <div className="recap">
        <b>{greetWord(nm)}, Queen.</b> <span>Last time was {prettyDay(r.old)}: you finished {r.done} of {r.total} daily habits.</span>
        {r.lost ? <> <span>Your streak reset. That is fine. Day one again, gently.</span></> : r.restY ? <> <span>Your rest pass kept the streak safe.</span></> : null}
        {r.newWeek && <> <span>New week: weekly quests are fresh.</span></>}
        <div className="rep-act"><button className="btn sm" type="button" onClick={clearRecap}>Start fresh</button></div>
      </div>
    </div>
  );
}

// noPick: the New look shows Kumo's pick as its own card on the Court (KumoPick below).
function NowCard({ noPick = false }: { noPick?: boolean }) {
  const { st, k, nm, events, cal } = useCourt();
  const evs = eventsOn(events, k).filter((e) => !e.allDay);
  const cur = evs.find((e) => e.a <= nm && nm < e.b), nxt = evs.find((e) => e.a > nm);

  if (st.restDay === k)
    return (
      <div id="nowCard"><div className="now rest"><small>Rest day</small><b className="now-t">Nothing is owed today.</b><span>Your streak is protected.</span></div></div>
    );

  let lab = "Today", title = cal.state === "live" ? "Nothing else on the calendar" : "Calendar not connected yet", sub = "", soon = false;
  if (cur) { lab = "Right now"; title = cur.t; sub = `Ends in ${dur(Math.max(1, cur.b - nm))} · until ${hm(cur.b)}`; }
  else if (nxt) { lab = "Up next"; title = nxt.t; sub = `Starts in ${dur(Math.max(1, nxt.a - nm))} · at ${hm(nxt.a)}`; soon = nxt.a - nm <= 15; }

  const pct = Math.max(0, Math.min(100, ((nm - 480) / (1320 - 480)) * 100));

  return (
    <div id="nowCard">
      <div className={soon ? "now soon" : "now"}>
        <small>{lab}</small>
        <b className="now-t">{title}</b>
        {sub && <span>{sub}</span>}
        {soon && <span className="soonmsg">Start wrapping up. Save your place.</span>}
        <div className="dayprog" role="img" aria-label={`Day progress, ${Math.round(pct)} percent of 08:00 to 22:00`}><i style={{ width: pct + "%" }}></i></div>
        {!noPick && <KumoPick />}
      </div>
    </div>
  );
}

// Kumo's pick (v52 pickList, without sprint and reports): the next open quest she can tick herself.
export function KumoPick() {
  const { st, k, nm, update, levelUp } = useCourt();
  const [pickI, setPickI] = useState(0);
  const canRest = st.restDay !== k && st.restWeek !== weekKey(k);
  const picks = openQuests(st, k, nm).filter((q) => qScore(q, k, nm) < 60 && !q.auto).slice(0, 3);
  const pick = picks.length ? picks[pickI % picks.length] : null;
  return (
    <div className="pick">
      <small>Kumo&apos;s pick</small>
      <span>{pick ? pick.title : "All clear. Rest is a valid move."}</span>
      <div className="rep-act">
        {pick && (
          <button className="btn sm" type="button" onClick={() => update((d) => { const r = logQuest(d, pick.id); if (r.leveled) levelUp(r.leveled); }, ["q", "stars", "streak", "xp", "lvl"])}>I did it</button>
        )}
        {picks.length > 1 && <button className="btn sm ghost" type="button" onClick={() => setPickI(pickI + 1)}>Not now</button>}
        {canRest && (
          <button className="btn sm ghost" type="button" onClick={() => update((d) => { d.restDay = k; d.restWeek = weekKey(k); }, ["restDay", "restWeek"])}>Take a rest day</button>
        )}
      </div>
    </div>
  );
}

// Quote of the day on its own (New look's quiet third row).
export function QuoteOfDay() {
  const { st, k } = useCourt();
  return (
    <figure className="qod">
      <figcaption>Quote of the day</figcaption>
      <blockquote>{quoteOfDay(k, st.uq)}</blockquote>
    </figure>
  );
}

function CalPill() {
  const { cal } = useCourt();
  if (cal.state === "live") return <span className="pillx ok">Live from Google Calendar</span>;
  if (cal.state === "loading") return <span className="pillx quiet">Loading</span>;
  if (cal.state === "error") return <span className="pillx warn">Calendar not reachable</span>;
  return <span className="pillx mid">Calendar not connected yet</span>;
}

/** Round 7: Momo on the Court's Today card says one thing only: ideas for your free time today. */
export function MomoIdeas() {
  const { st, k, nm, events } = useCourt();
  const ideas = momoIdeas(st, k, k, eventsOn(events, k), nm, events);
  return (
    <div className="kmomo-ideas">
      <div className="sec-h"><Mini name="momo" />Momo: ideas for your free time</div>
      {!ideas.length ? <p className="note">No free gap of 45 minutes or more between 08:00 and 22:00.</p> : ideas.map((x) => (
        <div className="idea" key={x.id}>
          <b>{hm(x.a)} to {hm(x.b)} · {x.title}</b>
          <span className="why">Because: {x.why.join(" · ")}</span>
        </div>
      ))}
    </div>
  );
}

export function MomoCard() {
  const { st, k, nm, events, cal } = useCourt();
  const [hide, setHide] = useState<string[]>([]);
  const shown = events.filter((e) => !hide.includes(e.cal));
  const evs = eventsOn(shown, k);
  const ideas = momoIdeas(st, k, k, evs, nm, shown);
  const rows: React.ReactNode[] = [];
  let marked = false;
  evs.forEach((e, i) => {
    if (!marked && !e.allDay && e.a > nm) { rows.push(<li key="now" className="nowline"><time>{hm(nm)}</time><span>Now</span></li>); marked = true; }
    rows.push(
      <li key={i}>
        <time>{e.allDay ? "All day" : `${hm(e.a)} to ${hm(e.b)}`}</time>
        <span className="t">{e.t}</span>
        <small><i className="caldot" style={{ background: e.color }} aria-hidden="true"></i>{[e.cal, e.loc].filter(Boolean).join(" · ")}</small>
      </li>
    );
  });
  if (evs.length && !marked) rows.push(<li key="now" className="nowline"><time>{hm(nm)}</time><span>Now</span></li>);

  return (
    <div id="momoBox">
      <div className="tcard" id="momoCard">
        <h3><Mini name="momo" />Momo, your day</h3>
        <div className="win-line"><CalPill /><span className="pillx">{prettyDay(k)}</span></div>
        {cal.cals.length > 1 && (
          <div className="ntabs" role="group" aria-label="Show calendars">
            {cal.cals.map((c) => (
              <button key={c.name} className="chipb" type="button" aria-pressed={!hide.includes(c.name)} onClick={() => setHide(hide.includes(c.name) ? hide.filter((h) => h !== c.name) : [...hide, c.name])}>
                <i className="caldot" style={{ background: c.color }} aria-hidden="true"></i>{c.name}{c.ok ? "" : " (not reachable)"}
              </button>
            ))}
          </div>
        )}
        {cal.state === "off" && <p className="note">Calendar not connected yet. Ideas below assume a free day.</p>}
        {cal.state === "error" && <p className="note">Could not read the calendar just now. I will try again in a few minutes.</p>}
        {cal.state === "live" && !evs.length && <p>Nothing on the calendar. A clear day.</p>}
        {rows.length > 0 && <ul className="evl">{rows}</ul>}
        <div className="sec-h">Ideas for your free time</div>
        {!ideas.length && <p className="note">No free gap of 45 minutes or more between 08:00 and 22:00.</p>}
        {ideas.map((x) => (
          <div className="idea" key={x.id}>
            <b>{hm(x.a)} to {hm(x.b)} · {x.title}</b>
            <span className="why">Because: {x.why.join(" · ")}</span>
            {x.act === "dump" && <div className="rep-act"><button className="btn sm" type="button" onClick={() => document.getElementById("dumpIn")?.focus()}>Open</button></div>}
          </div>
        ))}
        <p className="note xd">Ideas only, from your habits and what is still open. I never write to your calendar.</p>
      </div>
    </div>
  );
}

function LifeCard() {
  const { st, k, events, update } = useCourt();
  const all = dueList(st, k, events);
  const L = all.filter((x) => x.dd <= 10).slice(0, 6);
  let total = 0;
  all.forEach((x) => { if (x.dd >= 0 && x.dd <= 7 && x.it.amt != null && (x.it.cat === "bill" || x.it.cat === "money")) total += x.it.amt; });

  function done(id: string) {
    update((d) => {
      const x = dueList(d, k, events).find((y) => y.it.id === id);
      if (!x) return;
      const it = d.life.find((i) => i.id === id)!;
      it.sched = "";
      if (it.rule.type === "every") it.rule.last = k; else it.paid = it.rule.type === "once" ? 1 : x.d;
    }, ["life"]);
  }
  function booked(id: string, v: string) {
    update((d) => { const it = d.life.find((i) => i.id === id); if (it) it.sched = v || ""; }, ["life"]);
  }

  return (
    <div id="lifeBox">
      <div className="tcard" id="lifeCard">
        <h3><Mini name="coco" />Coming up</h3>
        {!L.length && <p className="note">Nothing due in the next 10 days.</p>}
        {L.map((x) => {
          const btn = x.it.rule.type === "every" ? "Done today" : x.it.cat === "decision" ? "Decided" : x.it.rule.type === "once" ? "Done" : "Paid";
          return (
            <div className="idea" key={x.it.id}>
              <b>{x.it.name}{x.it.amt != null ? " · " + money(x.it.amt) : ""}</b>
              <span className="why">{whenText(x.dd, x.d)}{x.it.note ? " · " + x.it.note : ""}</span>
              <div className="rep-act">
                <button className="btn sm ghost" type="button" onClick={() => done(x.it.id)}>{btn}</button>
                <label className="lsd">Booked for <input type="date" min={k} aria-label="Already booked? Pick the date" onChange={(e) => booked(x.it.id, e.target.value)} /></label>
              </div>
            </div>
          );
        })}
        {total > 0 && <p className="note">Bills and transfers due in the next 7 days: {money(total)}.</p>}
      </div>
    </div>
  );
}

// Parked thoughts for the New-look Today card (the one-line input lives under the world).
export function ParkedList() {
  const { st, update } = useCourt();
  const open = st.dump.filter((d) => !d.done).slice(0, 6);
  return (
    <div className="kparked">
      <div className="sec-h">Parked thoughts</div>
      {open.length ? open.map((d) => (
        <div className="filed-row" key={d.id}>
          <span>{d.t}</span>
          <button className="btn sm ghost" type="button" aria-label="Mark done" onClick={() => update((s) => { const it = s.dump.find((x) => x.id === d.id); if (it) it.done = true; }, ["dump"])}>Done</button>
        </div>
      )) : <p className="note">Nothing parked.</p>}
    </div>
  );
}

// Coming up on the New-look Court: only what needs her soon. Auto-paid bills (GIRO, auto-deducted tax) and
// subscriptions are left out here by their name or note (there is no auto-paid flag yet; NEEDS OWNER
// APPROVAL to add one). Every item stays in Settings, Life admin.
const AUTO = /\bgiro\b|auto[\s-]?(?:pay|paid|deduct|debit|renew)|instal?ments?|income tax|property tax|subscription|spotify|claude|netflix|icloud|google one|youtube|disney|apple (?:one|music|tv)/i;
// Her own "Auto-paid" toggle wins; until she sets it, GIRO, auto-deducted tax and subscriptions count as auto-paid.
export const autoPaidDefault = (it: { cat: string; name: string; note?: string }) => (it.cat === "bill" || it.cat === "money") && AUTO.test(it.name + " " + (it.note ?? ""));
export const isAutoPaid = (it: { cat: string; name: string; note?: string; autoPaid?: boolean }) => it.autoPaid ?? autoPaidDefault(it);
export function ComingUpCourt() {
  const { st, k, events, update } = useCourt();
  const list = dueList(st, k, events).filter((x) => x.dd <= 10 && !((x.it.cat === "bill" || x.it.cat === "money") && AUTO.test(x.it.name + " " + (x.it.note ?? "")))).slice(0, 5);
  const done = (id: string) => update((d) => {
    const x = dueList(d, k, events).find((y) => y.it.id === id);
    if (!x) return;
    const it = d.life.find((i) => i.id === id)!;
    it.sched = "";
    if (it.rule.type === "every") it.rule.last = k; else it.paid = it.rule.type === "once" ? 1 : x.d;
  }, ["life"]);
  return (
    <section className="win kcoming" aria-labelledby="kcuT">
      <div className="win-title"><h2 id="kcuT">Coming up</h2><span className="sub">needs you soon</span></div>
      <div className="win-body">
        {list.length ? list.map((x) => (
          <div className="filed-row" key={x.it.id}>
            <span>{x.it.name}{x.it.amt != null ? " · " + money(x.it.amt) : ""} <span className="note">{whenText(x.dd, x.d)}</span></span>
            <button className="btn sm ghost" type="button" onClick={() => done(x.it.id)}>{x.it.rule.type === "every" ? "Done today" : x.it.cat === "decision" ? "Decided" : x.it.rule.type === "once" ? "Done" : "Paid"}</button>
          </div>
        )) : <p className="note">Nothing needs you in the next 10 days.</p>}
      </div>
    </section>
  );
}

function DumpBox() {
  const { st, update } = useCourt();
  const [t, setT] = useState("");
  const open = st.dump.filter((d) => !d.done).slice(0, 6);
  return (
    <>
      <form className="field" id="dumpForm" onSubmit={(e) => {
        e.preventDefault();
        const v = t.trim();
        if (!v) return;
        update((d) => { d.dump.unshift({ id: "d" + Date.now(), t: v.slice(0, 140), done: false, ts: Date.now() }); d.dump = d.dump.slice(0, 40); }, ["dump"]);
        setT("");
      }}>
        <label htmlFor="dumpIn">Park a thought for later</label>
        <div className="field-row">
          <input id="dumpIn" type="text" autoComplete="off" maxLength={140} placeholder="Anything nagging at you. I will hold it." value={t} onChange={(e) => setT(e.target.value)} />
          <button className="btn" type="submit">Park it</button>
        </div>
      </form>
      <div id="dumpList">
        {open.length ? open.map((d) => (
          <div className="filed-row" key={d.id}>
            <span>{d.t}</span>
            <button className="btn sm ghost" type="button" aria-label="Mark done" onClick={() => update((s) => { const it = s.dump.find((x) => x.id === d.id); if (it) it.done = true; }, ["dump"])}>Done</button>
          </div>
        )) : <p className="note xd">Nothing parked. Anything nagging at you can wait here.</p>}
      </div>
    </>
  );
}

const MOODS = ["Low", "Flat", "Okay", "Good", "Bright"];

function SkyPanel() {
  const { st } = useCourt();
  const mk = Object.keys(st.mood).sort().slice(-7).reverse();
  return (
    <div id="lunaBox">
      <p className="note">Luna&apos;s sky reading is not ported yet. Your saved moods:</p>
      {mk.length ? (
        <ul className="evl">{mk.map((d) => <li key={d}><time>{prettyDay(d)}</time><span className="t">{MOODS[(st.mood[d].m || 3) - 1]}</span>{st.mood[d].n && <small>{st.mood[d].n}</small>}</li>)}</ul>
      ) : <p className="note">No moods saved yet.</p>}
    </div>
  );
}

function WeekPanel() {
  const { st, k } = useCourt();
  const wk = weekKey(k);
  const days = Array.from({ length: 7 }, (_, i) => addDays(wk, i));
  return (
    <div>
      <ul className="evl">
        {days.map((d) => {
          const rec = d === k ? { d: dayQ(k).filter((q) => isDone(st, q.id)).length, t: dayQ(k).length } : st.days[d];
          return <li key={d}><time>{prettyDay(d)}</time><span className="t">{d > k ? "Still ahead" : rec ? `${rec.d} of ${rec.t} habits` : "No record"}</span>{d === k && <small>today</small>}</li>;
        })}
      </ul>
      <p className="note">Weekly quests: {QUESTS.filter((q) => q.cad === "Weekly").map((q) => `${q.title}${isDone(st, q.id) ? " (done)" : ""}`).join(" · ")}</p>
    </div>
  );
}

export type { CalEvent };
