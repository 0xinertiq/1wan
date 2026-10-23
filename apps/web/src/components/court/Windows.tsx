import { PixelSprite, type SpriteName } from "@/components/PixelSprite";
import { BriefTabs, type BriefDoc } from "./BriefTabs";

// Windows from dashboard-v52. Markup and class names follow v52's render functions.
// NeedWin is clearly labelled sample content until the Court home step: no logic, nothing saves.

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
