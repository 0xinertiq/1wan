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

const DAY_EVENTS = [
  ["09:00 to 10:30", "Sample: Study block", "Calendar"],
  ["12:30 to 13:30", "Sample: Lunch with a friend", ""],
  ["21:30 to 21:45", "Sample: Money check", "Momo"],
];

export function TodayWin({ dateLabel }: { dateLabel: string }) {
  return (
    <section className="win" id="todayWin" aria-labelledby="tdT">
      <div className="win-title"><h2 id="tdT">Today</h2><span className="sub" id="tdDate">{dateLabel}</span></div>
      <div id="sinceBox">
        <div className="sec-h">Since yesterday</div>
        <div className="win-line">
          <span className="pillx mid">Sample</span>
          <span className="pillx ">Moon moved Aries to Taurus</span>
          <span className="pillx ok">BTC +1.2% in 24h</span>
          <span className="pillx ">2 US releases today</span>
        </div>
      </div>
      <div className="tabs" role="tablist" aria-label="Today views">
        <button className="ttab" role="tab" id="tt-brief" aria-controls="tp-brief" aria-selected="true" type="button">Brief</button>
        <button className="ttab" role="tab" id="tt-sky" aria-controls="tp-sky" aria-selected="false" tabIndex={-1} type="button">Sky</button>
        <button className="ttab" role="tab" id="tt-week" aria-controls="tp-week" aria-selected="false" tabIndex={-1} type="button">Week</button>
      </div>
      <div className="panel" id="tp-brief" role="tabpanel" aria-labelledby="tt-brief">
        <Sample />
        <div id="stripBox">
          <div className="strip" role="group" aria-label="Today at a glance">
            <span className="sc"><i>Due soon</i><b>2</b></span>
            <span className="sc"><i>Streak</i><b>6</b></span>
            <span className="sc"><i>Habits this week</i><b>9/21</b></span>
          </div>
          <figure className="qod">
            <figcaption>Quote of the day</figcaption>
            <blockquote>Sample quote. Plan the trade, trade the plan.</blockquote>
          </figure>
        </div>
        <div id="recapBox"></div>
        <div id="dayCard" className="daycard">
          <div id="nowCard">
            <div className="now">
              <small>Up next</small>
              <b className="now-t">Sample: Study block</b>
              <span>Starts in 40 min · at 09:00</span>
              <div className="dayprog" role="img" aria-label="Day progress, 3 percent of 08:00 to 22:00"><i style={{ width: "3%" }}></i></div>
              <div className="pick">
                <small>Kumo&apos;s pick</small>
                <span>Sample: one 25-minute focus sprint before the study block.</span>
                <div className="rep-act">
                  <button className="btn sm" type="button">Start 25 min</button>
                  <button className="btn sm ghost" type="button">Not now</button>
                  <button className="btn sm ghost" type="button">Take a rest day</button>
                </div>
              </div>
            </div>
          </div>
          <div id="paceBox"></div>
          <div id="momoBox">
            <div className="tcard" id="momoCard">
              <h3><span className="mini"><PixelSprite name="momo" /></span>Momo, your day</h3>
              <div className="win-line"><span className="pillx mid">Sample events</span><span className="pillx">{dateLabel}</span></div>
              <ul className="evl">
                <li className="nowline"><time>08:20</time><span>Now</span></li>
                {DAY_EVENTS.map(([t, title, cal]) => (
                  <li key={t}><time>{t}</time><span className="t">{title}</span>{cal && <small>{cal}</small>}</li>
                ))}
              </ul>
              <div className="sec-h">Ideas for your free time</div>
              <div className="idea">
                <b>14:00 to 15:30 · Sample: a slow walk</b>
                <span className="why">Because: calm sky · no habits due</span>
              </div>
              <p className="note xd">Ideas only, from your sky, your habits and what is still open. I never write to your calendar.</p>
            </div>
          </div>
          <div id="lifeBox"></div>
        </div>
        <form className="field" id="dumpForm">
          <label htmlFor="dumpIn">Park a thought for later</label>
          <div className="field-row">
            <input id="dumpIn" type="text" autoComplete="off" maxLength={140} placeholder="Anything nagging at you. I will hold it." />
            <button className="btn" type="button">Park it</button>
          </div>
        </form>
        <div id="dumpList"></div>
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

const NEWS = [
  ["12 min ago", "Sample headline: Exchange outflows hit a three-month high", "Crypto and regulation · Sample wire"],
  ["1h ago", "Sample headline: Inflation print due Thursday, forecasts edge higher", "Fed and rates · Sample wire"],
  ["3h ago", "Sample headline: Regulator publishes stablecoin consultation", "Crypto and regulation · Sample wire"],
];
const NEWS_TABS = [["All", 3], ["Macro", 1], ["Markets", 0], ["Crypto", 2], ["World", 0], ["Politics", 0], ["Local", 0], ["Sports", 0], ["Memes", 0]] as const;

export function NewsWin() {
  return (
    <section className="win" id="newsWin" aria-labelledby="nwT">
      <div className="win-title"><h2 id="nwT">Headlines</h2><span className="sub">Pip</span></div>
      <div className="win-body">
        <div id="newsBox">
          <Sample />
          <div className="ntabs" role="group" aria-label="Headline topics">
            {NEWS_TABS.map(([g, n]) => (
              <button key={g} className="chipb" type="button" aria-pressed={g === "All"}>{g} {n}</button>
            ))}
          </div>
          <ul className="evl">
            {NEWS.map(([t, title, src]) => (
              <li key={title}><time>{t}</time><span className="t">{title}</span><small>{src}</small></li>
            ))}
          </ul>
          <p className="note xd">Only the headlines that look important. Secondary until you open the original.</p>
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

const QUESTS: { crew: SpriteName; short: string; title: string; sub: string; xp: number; end: string; ck: string; done?: boolean }[] = [
  { crew: "momo", short: "Momo", title: "Open the morning brief", sub: "Your daily check-in. Keeps the streak.", xp: 10, end: "DONE", ck: "Counted by Kumo", done: true },
  { crew: "kumo", short: "Kumo", title: "One 25-minute focus sprint", sub: "One thing, one timer, pings held.", xp: 25, end: "AUTO", ck: "Kumo times it" },
  { crew: "olli", short: "Olli", title: "Check the macro calendar before the open", sub: "Know which US data releases land today.", xp: 15, end: "AUTO", ck: "Counted when the live release list loads" },
];

export function QuestWin() {
  return (
    <section className="win" id="questWin" aria-labelledby="qT">
      <div className="win-title"><h2 id="qT">Habit Quests</h2><span className="sub" id="qCount">1/3 done</span></div>
      <div className="win-body">
        <Sample />
        <div className="quests" id="quests">
          {QUESTS.map((q) => (
            <div key={q.title} className={q.done ? "quest done" : "quest"}>
              <div className="q-ic">
                <Mini name={q.crew} />
                {q.done && (
                  <span className="ck">
                    <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </span>
                )}
              </div>
              <div className="q-t">
                <b>{q.title}</b>
                <span><span className="q-tag">Daily</span>{q.short} · {q.sub}</span>
                <span className="q-src">{q.ck}</span>
              </div>
              <div className="q-r"><span className="xp">+{q.xp} EXP</span><span className="q-end">{q.end}</span></div>
            </div>
          ))}
        </div>
        <details className="bdet" id="ckDet"><summary>Evening check-in</summary><div id="ckBox"></div></details>
        <button className="btn sm ghost qmore" type="button" id="qMore">Show all quests</button>
      </div>
    </section>
  );
}
