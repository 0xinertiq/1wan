"use client";

import { useState } from "react";
import { PixelSprite } from "@/components/PixelSprite";
import { AGENTS, needA } from "./agents";

// Kumo's capes from v52. The player is level 7 in the sample, so Mint and Lilac show as locked.
const CAPES = [
  { id: "rose", name: "Rose", c: "#FFB3D1", lvl: 0 },
  { id: "mint", name: "Mint", c: "#BFEBD6", lvl: 8 },
  { id: "lav", name: "Lilac", c: "#D9C8FA", lvl: 10 },
];
const PLAYER_LEVEL = 7;

function LockSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2.5" fill="#fff" stroke="#A34876" strokeWidth="2.4" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="#A34876" strokeWidth="2.4" />
    </svg>
  );
}

// Roster and agent detail from dashboard-v52. Tapping a tile opens or closes its card, as in v52.
// Display only: the chat box and wardrobe don't do anything yet.
export function Roster() {
  const [sel, setSel] = useState("kumo");
  const [open, setOpen] = useState(true);
  const d = AGENTS.find((a) => a.id === sel)!;
  const need = needA(d.level);

  function pick(id: string) {
    setOpen(!(open && sel === id));
    setSel(id);
  }

  return (
    <div id="rosterWrap">
      <section className="roster" id="roster" aria-label="Court roster">
        {AGENTS.map((a) => (
          <button
            key={a.id}
            className={sel === a.id ? "rt sel" : "rt"}
            type="button"
            data-id={a.id}
            aria-label={`${a.name}, ${a.role}`}
            onClick={() => pick(a.id)}
          >
            <span className="mini"><PixelSprite name={a.sprite} /></span>
            <b>{a.short}</b>
            <small>{a.role}</small>
            {a.id !== "kumo" && <span className="st-dot shift"></span>}
          </button>
        ))}
      </section>
      <section className="detail" id="agentDetail" aria-live="polite" hidden={!open}>
        <div className="dhead">
          <div className="mini"><PixelSprite name={d.sprite} /></div>
          <div>
            <b>{d.name}</b>
            <span className="role">{d.role}{d.id === "kumo" ? "" : " agent"}</span>
          </div>
        </div>
        <p>{d.hello}</p>
        {d.id === "kumo" ? (
          <div className="wardrobe">
            <small>Wardrobe</small>
            {CAPES.map((c) => {
              const locked = PLAYER_LEVEL < c.lvl;
              return (
                <button
                  key={c.id}
                  className="sw"
                  type="button"
                  style={{ background: c.c }}
                  aria-label={`${c.name} cape${locked ? `, unlocks at level ${c.lvl}` : ""}`}
                  aria-pressed={c.id === "rose"}
                  disabled={locked}
                  title={locked ? `Unlocks at level ${c.lvl}` : undefined}
                >
                  {locked && <LockSvg />}
                </button>
              );
            })}
          </div>
        ) : (
          <>
            <p className="note">Owns: {d.owns}</p>
            <div className="lv-xp">
              <label>LV {d.level} <em>{d.xp}/{need}</em></label>
              <div className="track"><i style={{ width: `${(d.xp / need) * 100}%`, background: d.color }}></i></div>
            </div>
            <p className="note">{d.mission} · At their desk</p>
          </>
        )}
        <div className="achat">
          <p className="m ag">Sample chat. Messages to {d.short} arrive in a later step.</p>
          <form className="field" id="agentForm">
            <div className="field-row">
              <input id="agentIn" type="text" autoComplete="off" maxLength={400} placeholder={`Message ${d.short}`} />
              <button className="btn" type="button">Send</button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
