import { PixelSprite, type SpriteName } from "@/components/PixelSprite";
import { BriefTabs, type BriefDoc } from "./BriefTabs";

// Windows from dashboard-v52. Markup and class names follow v52's render functions.
// Everything except BriefWin is clearly labelled sample content: no logic, nothing saves.

function Sample({ what = "Sample content" }: { what?: string }) {
  return (
    <p className="note">
      <span className="pillx mid">{what}</span> Not live yet. Nothing here saves.
    </p>
  );
}

function Mini({ name, sm }: { name: SpriteName; sm?: boolean }) {
  return (
    <div className={sm ? "mini sm" : "mini"}>
      <PixelSprite name={name} />
    </div>
  );
}

export function SprintBar() {
  return (
    <section className="sprint" id="sprintBar" aria-label="Focus sprint">
      <span id="sprintTxt">Focus sprint: Sample task</span><b id="sprintTime" role="timer">25:00</b>
      <button className="btn sm ghost" type="button" id="sprintStop">Stop</button>
    </section>
  );
}

const THOUGHTS: [string, string, string][] = [
  ["Fenn", "#FFAE82", "Two coins near key levels"],
  ["Pip", "#FFD95E", "Reading overnight headlines"],
  ["Olli", "#D9C8FA", "CPI lands Thursday"],
];

export function UsePanel() {
  const stars = (on: number) => (
    <span className="ustars" aria-hidden="true">
      {Array.from({ length: 10 }, (_, i) => <i key={i} className={i < on ? "ustar on" : "ustar"}></i>)}
    </span>
  );
  return (
    <section className="usepop" id="usePanel" aria-label="Usage and thoughts">
      <div id="useBody">
        <Sample />
        <div className="uline"><b>Live data pulls</b><span>12 of 60 today</span>{stars(2)}</div>
        <div className="uline"><b>Claude questions</b><span>3 of 20 today</span>{stars(2)}</div>
        <div className="sec-h">What the crew is thinking</div>
        <div className="tbubs">
          {THOUGHTS.map(([who, c, t]) => (
            <span key={who} className="tbub" style={{ "--c": c } as React.CSSProperties}>
              <b>{who}</b> {t} <i>5 min ago</i>
            </span>
          ))}
        </div>
        <p className="note xd">Your Claude plan limits cannot be read from a page. Check Settings, then Usage in Claude. These are the calls this page itself made.</p>
      </div>
    </section>
  );
}

export function AskWin() {
  return (
    <section className="win askwin" id="askWin" aria-labelledby="askT">
      <div className="win-title"><h2 id="askT">Ask the crew</h2><span className="sub" id="askSub">Kumo routes it</span></div>
      <div className="win-body">
        <div id="delBox">
          <form className="field" id="delForm">
            <label htmlFor="taskIn">Ask anything! Kumo sends it to the right agent.</label>
            <div className="field-row">
              <input id="taskIn" type="text" autoComplete="off" maxLength={400} placeholder="Ask anything. Kumo or the right agent answers." />
              <button className="btn" type="button">Ask</button>
            </div>
          </form>
          <div className="route"><b>Routing</b><span>Olli (Macro)</span><span>Fenn (Market)</span></div>
        </div>
        <div id="tradeBox"></div>
        <div id="couBox"></div>
        <div id="replyBox" aria-live="polite">
          <div className="reply">
            <div className="rep-h">
              <Mini name="olli" sm />
              <div><b>Olli</b><small>Macro · answering: Sample question: what lands this week?</small></div>
            </div>
            <p className="rtext">Sample answer. Three US releases this week could move liquidity. The inflation print lands Thursday.</p>
            <p className="note xd">A conversation, not a verified report. Built only from the facts this page holds.</p>
            <div className="rep-act"><button className="btn sm ghost" type="button">Close</button></div>
          </div>
          <Sample />
        </div>
      </div>
    </section>
  );
}

export function BriefWin({ docs, initial }: { docs: BriefDoc[]; initial: string }) {
  return (
    <section className="win" id="briefWin" aria-labelledby="brT">
      <div className="win-title"><h2 id="brT">Briefs</h2><span className="sub">your scheduled tasks</span></div>
      <div className="win-body">
        <div id="briefBox">
          {docs.length ? (
            <BriefTabs docs={docs} initial={initial} />
          ) : (
            <p className="note">Nothing here yet. Your scheduled briefs land here after their next run.</p>
          )}
        </div>
      </div>
    </section>
  );
}

export function NeedWin() {
  return (
    <section className="win" id="needWin" aria-labelledby="needT">
      <div className="win-title"><h2 id="needT">Needs you</h2><span className="sub" id="needSub">2 waiting</span></div>
      <div className="win-body">
        <Sample />
        <div id="optBox">
          <div className="dec">
            <div className="dec-h"><Mini name="kumo" sm /><h3>Sample: How strict should the source rule be?</h3></div>
            <p>Sample choice. Kumo recommends two sources before a report is filed as verified.</p>
            <div className="opts" role="group" aria-label="Options">
              <button className="opt rec" type="button" aria-pressed="false">Two sources</button>
              <button className="opt" type="button" aria-pressed="false">One fresh primary</button>
            </div>
          </div>
        </div>
        <div id="verBox">
          <div className="rep">
            <span className="verdict v-ok">VERIFIED</span>
            <div className="rep-h">
              <Mini name="fenn" sm />
              <div><b>Fenn, Market</b><small>Asked: Sample: scan the watchlist</small></div>
            </div>
            <p>Sample report. Watchlist scanned. 2 coins sit near key levels.</p>
            <div className="srcs">
              <span className="src">Sample exchange ticker</span>
              <span className="src">Sample chart levels</span>
            </div>
            <ul className="checks">
              <li><i>✓</i>Two sources agree</li>
              <li><i>✓</i>Fresh within the hour</li>
            </ul>
            <div className="rep-act">
              <button className="btn sm" type="button">File it</button>
              <button className="btn sm ghost" type="button">Reject</button>
              <button className="btn sm ghost" type="button">Ask the council</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
