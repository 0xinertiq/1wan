"use client";

import { useState } from "react";
import { useCourt } from "../CourtState";
import { DecorSprite } from "@/components/kumo/DecorSprite";
import { stageFor, STAGES } from "@/components/kumo/kingdom";
import type { Lens } from "@/lib/court/state";
import { normLenses } from "@/lib/court/state";
import { Btn, Callout, Card, Chip, PageHead, SectionLabel } from "../ui";
import { useOwner } from "../Owner";
import { FRIEND_LENSES, LENS_LABEL, toggleLens } from "@/lib/court/lenses";

// Onboarding for friends (round 6, basic flow): five skippable steps saved to her own prefs, replayable from
// Settings. Invite-only; never asks for API keys; the app tracks and never advises.

export const INTERESTS = [
  ["habits", "Habits and routines"], ["goals", "Goals and projects"], ["journal", "Journal and mood"], ["money", "Money (manual)"],
  ["health", "Health and fitness"], ["learning", "Learning and study"], ["pets", "Routine (pets and self-care)"], ["markets", "Markets and trading"],
] as const;
/** Which tabs a room choice switches off (Settings can switch them back). Court, Calendar, Life Hub and Settings always stay. */
export const ROOM_TABS: Record<string, string[]> = { habits: ["garden"], journal: ["diary"], markets: ["trades", "news"] };
export const hiddenTabs = (rooms?: Record<string, boolean>) => Object.entries(ROOM_TABS).filter(([r]) => rooms?.[r] === false).flatMap(([, t]) => t);

export function WelcomePage() {
  const { st, k, update } = useCourt();
  const p = st.prefs;
  const [step, setStep] = useState(0);
  const [f, setF] = useState({ name: p.name ?? "", tz: p.tz ?? "Asia/Singapore", rooms: { ...Object.fromEntries(INTERESTS.map(([id]) => [id, true])), ...(p.rooms ?? {}) } as Record<string, boolean>, lens: (st.lenses.includes("off") ? "off" : st.lenses.includes("any") ? "any" : st.lenses.length === 1 && st.lenses[0] === "local" ? "local" : "trading") as Lens, companion: p.companion ?? "fox", morning: p.notif?.morning ?? true });
  // round 7: the tour's simple lens choice writes her lenses only when she changes it there (Settings allows several)
  const [lens0] = useState(f.lens), [rooms0] = useState(f.rooms.markets);
  // round 22: a friend picks the shared feed's news categories in their own step (several at once, never Off)
  const owner = useOwner();
  const [cats, setCats] = useState(() => (st.lenses.includes("off") ? ["crypto", "macro", "markets"] as typeof st.lenses : st.lenses));
  const [cats0] = useState(cats);
  const save = (done = false) => update((d) => { const lens = f.rooms.markets ? f.lens : "off"; d.prefs = { ...d.prefs, name: f.name.trim().slice(0, 40) || undefined, tz: f.tz, rooms: f.rooms, lens, companion: f.companion, notif: { ...(d.prefs.notif ?? {}), morning: f.morning }, ...(done ? { onboarded: k } : {}) }; if (owner && (f.lens !== lens0 || f.rooms.markets !== rooms0)) d.lenses = normLenses([], lens); if (!owner && cats !== cats0) d.lenses = normLenses(cats); }, ["prefs", "lenses"]);
  const steps = owner ? ["Welcome", "Interests", "Connections", "Theme and companion", "Enter the kingdom"] : ["Welcome", "Interests", "Your news", "Connections", "Theme and companion", "Enter the kingdom"];
  const last = steps.length - 1, name = steps[step];
  const next = () => { save(); setStep(Math.min(last, step + 1)); };
  return (
    <div className="kpage">
      <PageHead scene="castle" title="Welcome to the kingdom" sub={`${owner ? "Five" : "Six"} short steps. Skip any of them; you can change everything later in Settings.`} />
      <Card title={name} sub={`Step ${step + 1} of ${steps.length}`}>
        <div className="kstep">
          <div className="kstep-dots" aria-hidden="true">{steps.map((s, i) => <i key={s} className={i <= step ? "on" : ""} />)}</div>
          {name === "Welcome" && <>
            <label className="kform">What should the crew call you?<input maxLength={40} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Your name" /></label>
            <label className="kform">Your timezone<select value={f.tz} onChange={(e) => setF({ ...f, tz: e.target.value })}>{["Asia/Singapore", "Asia/Tokyo", "Asia/Hong_Kong", "Europe/London", "America/New_York", "Australia/Sydney"].map((z) => <option key={z}>{z}</option>)}</select></label>
            <p className="note">Times in the app show in Singapore time for now.</p>
          </>}
          {name === "Interests" && <>
            <p>Pick what you want the kingdom to help with. Each choice switches its rooms on or off.</p>
            <div className="kgrid-opts">{INTERESTS.filter(([id]) => owner || id !== "markets").map(([id, l]) => <label className="kcheck" key={id}><input type="checkbox" checked={f.rooms[id] !== false} onChange={(e) => setF({ ...f, rooms: { ...f.rooms, [id]: e.target.checked } })} />{l}</label>)}</div>
            {owner && f.rooms.markets !== false && <>
              <SectionLabel>Market lens</SectionLabel>
              <div className="kchips" role="group" aria-label="Market lens">{([["trading", "Trading"], ["local", "Local news"], ["any", "Any topic"]] as const).map(([v, l]) => <button key={v} type="button" className="chipb" aria-pressed={f.lens === v} onClick={() => setF({ ...f, lens: v })}>{l}</button>)}</div>
            </>}
          </>}
          {name === "Your news" && <>
            <p>Pick the news you want on your News tab. Choose as many as you like.</p>
            <div className="kchips" role="group" aria-label="News categories">{FRIEND_LENSES.map((id) => <button key={id} type="button" className="chipb" aria-pressed={cats.includes(id)} onClick={() => setCats(toggleLens(cats, id))}>{id === "local" ? "Local (Singapore)" : LENS_LABEL[id]}</button>)}</div>
            <p className="note">Headlines only, from public news sites, with a link to the original. Change them any time in Settings.</p>
          </>}
          {name === "Connections" && <>
            {owner ? <>
              <p>Connections that really work today: a read-only calendar link. Nothing is ever written to your calendar.</p>
              <p className="note">Your calendar link is added by the owner for now; a sign-in with Google comes later. The app never asks for passwords or API keys.</p>
            </> : <>
              <p>Connect your Google Calendar so Today shows your day. It is read-only: nothing is ever written to your calendar.</p>
              <div className="kbtn-row"><a className="btn sm" href="/api/google/connect" onClick={() => save()}>Connect Google Calendar</a></div>
              <p className="note">You can also do this later in Settings, Connections. The app never asks for passwords or API keys.</p>
            </>}
          </>}
          {name === "Theme and companion" && <>
            <SectionLabel>Your companion</SectionLabel>
            <div className="kchips" role="group" aria-label="Companion">{[["fox", "9-Tails"], ["kumo", "Chief Kumo"], ["luna", "Luna"]].map(([v, l]) => <button key={v} type="button" className="chipb" aria-pressed={f.companion === v} onClick={() => setF({ ...f, companion: v })}>{l}</button>)}</div>
            <label className="kcheck"><input type="checkbox" checked={f.morning} onChange={(e) => setF({ ...f, morning: e.target.checked })} />One calm morning summary (everything else stays off until you choose it)</label>
            <p className="note">Day or night and the look can be changed any time in Settings.</p>
          </>}
          {name === "Enter the kingdom" && <>
            <Callout tone="lav">Your journal is private: never shown to friends, and included when you export your data. The app tracks; it never gives financial advice.</Callout>
            <p>The tour comes later; for now, every room has a short line under its title explaining what lives there.</p>
          </>}
          <div className="kform-row">
            <Btn kind="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>Back</Btn>
            {step < last ? <><Btn onClick={next}>Next</Btn><Btn kind="ghost" onClick={() => setStep(step + 1)}>Skip</Btn></> : <a className="btn" href="#" onClick={() => save(true)}>Enter the kingdom</a>}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Kingdom Mode (preview only): a large world with the same tappable places, and a read-only look at what can live
// in the kingdom later. No purchases, no star deductions, no ownership writes, no unlock or shop logic.
type State = "LOCKED" | "UNLOCKED_UNOWNED" | "OWNED_UNPLACED" | "PLACED";
const CATALOGUE: { group: string; items: { id: string; name: string; art?: string; state: State }[] }[] = [
  { group: "Structures", items: [{ id: "castle", name: "Castle", state: "PLACED" }, { id: "clock", name: "Clock tower", state: "PLACED" }, { id: "pagoda", name: "Pagoda", state: "LOCKED" }] },
  { group: "Nature", items: [{ id: "sakura", name: "Sakura tree", art: "sakura_4", state: "PLACED" }, { id: "flowers", name: "Flower patch", art: "flowers", state: "UNLOCKED_UNOWNED" }, { id: "mushroom", name: "Mushroom ring", art: "mushroom", state: "LOCKED" }] },
  { group: "Furniture", items: [{ id: "lantern", name: "Lantern", art: "lantern", state: "OWNED_UNPLACED" }, { id: "bench", name: "Garden bench", state: "LOCKED" }] },
  { group: "Companions", items: [{ id: "fox", name: "9-Tails", state: "PLACED" }, { id: "goose", name: "Goose", state: "PLACED" }, { id: "cat", name: "Cottage cat", state: "LOCKED" }] },
  { group: "Themes", items: [{ id: "dusk", name: "Pastel dusk", art: "moon", state: "PLACED" }, { id: "snow", name: "Winter", state: "LOCKED" }] },
];
const STATE_TXT: Record<State, string> = { LOCKED: "Locked", UNLOCKED_UNOWNED: "Unlocked", OWNED_UNPLACED: "Owned, not placed", PLACED: "Placed" };

export function KingdomPage({ world }: { world: React.ReactNode }) {
  const { st } = useCourt();
  const stage = stageFor(st.lvl);
  return (
    <div className="kpage">
      <PageHead title="Kingdom Mode" sub={`${stage.name} · level ${st.lvl}. A preview: cosmetic only, nothing is ever locked away from you.`} />
      {world}
      <Card title="What can live in your kingdom" sub="preview only, nothing to buy">
        <p className="note">Stages: {STAGES.map((s) => s.name).join(" · ")}. Thresholds are placeholders until the customisation catalogue is built.</p>
        {CATALOGUE.map((g) => (
          <div key={g.group}>
            <SectionLabel>{g.group}</SectionLabel>
            <div className="kcat">{g.items.map((i) => (
              <div key={i.id} aria-label={`${i.name}: ${STATE_TXT[i.state]}`}>
                {i.art ? <DecorSprite id={i.art} className="kcat-art" /> : <span className="kcat-art" aria-hidden="true" />}
                <b>{i.name}</b>
                <Chip tone={i.state === "PLACED" ? "mint" : i.state === "LOCKED" ? "lav" : "gold"}>{STATE_TXT[i.state]}</Chip>
              </div>
            ))}</div>
          </div>
        ))}
        <p className="note">Slots are ready for the catalogue and the crew wardrobe; no stars are spent and nothing is written.</p>
      </Card>
    </div>
  );
}
