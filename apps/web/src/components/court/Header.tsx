import { PixelSprite } from "@/components/PixelSprite";

// Pixel clock icon from dashboard-v52 pxClock(): X outline, o face, H hands.
const CLOCK_GRID = ["XX.XXXXX.XX", ".XoooooooX.", "XooooHooooX", "XooooHooooX", "XooooHooooX", "XooooHHHooX", "XoooooooooX", "XoooooooooX", ".XoooooooX.", "..XXXXXXX..", ".X.......X."];
const CLOCK_ICON = CLOCK_GRID.flatMap((row, y) =>
  row.split("").map((c, x) =>
    c === "." ? null : <rect key={`${x}-${y}`} className={c === "X" ? "px-o" : c === "o" ? "px-f" : "px-h"} x={x} y={y} width="1" height="1" />
  )
);

// Header from dashboard-v52. Display only: buttons do nothing yet, clock shows render time.
export function Header() {
  const [hh, mm] = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Singapore" })
    .format(new Date())
    .split(":");
  return (
    <header className="top">
      <div className="brand">
        <div className="brand-mini" id="brandMini" aria-hidden="true"><PixelSprite name="kumo" /></div>
        <div>
          <h1>The Kumo High Court</h1>
          <p id="greet">Good day, Queen. Chief Kumo has your day.</p>
        </div>
      </div>
      <div className="pills">
        <div className="pill clockpill" title="Time in Singapore"><svg id="clkIcon" width="22" height="22" viewBox="0 0 11 11" shapeRendering="crispEdges" aria-hidden="true">{CLOCK_ICON}</svg><b id="clk" aria-label={`Time in Singapore, ${hh}:${mm}`}>{hh}<i>:</i>{mm}</b></div>
        <div className="pill" title="Daily check-in streak">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c1 4.2 5.2 6 5.2 11a5.2 5.2 0 0 1-10.4 0c0-2.2 1-3.5 2.3-4.6.1 2 .9 3.1 2 3.4-.6-4 .4-6.4.9-9.8z" fill="#FF9DBF" stroke="#A34876" strokeWidth="1.8" strokeLinejoin="round" /></svg>
          <b id="streak">6</b> day streak
        </div>
        <div className="pill" title="Stars collected">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4 6.1 20.5l1.2-6.5L2.5 9.4l6.6-.9z" fill="#FFD95E" stroke="#A34876" strokeWidth="1.8" strokeLinejoin="round" /></svg>
          <b id="stars">42</b> stars
        </div>
        <div className="hmenuwrap"><button className="icon-btn" id="menuBtn" type="button" aria-expanded="false" aria-controls="hmenu" aria-label="Menu" title="Menu"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="2" fill="#A34876" /><circle cx="12" cy="12" r="2" fill="#A34876" /><circle cx="19" cy="12" r="2" fill="#A34876" /></svg><span className="cnt" id="menuDot" hidden>!</span></button><div id="hmenu" role="menu" hidden>
    <button className="icon-btn" id="bellBtn" data-lbl="Quiet queue" type="button" aria-label="Quiet queue, 0 waiting" title="Quiet queue">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17V11a6 6 0 0 1 12 0v6l1.5 2h-15z" fill="#FFD3E5" stroke="#A34876" strokeWidth="2" strokeLinejoin="round" /><path d="M10 21a2 2 0 0 0 4 0" fill="none" stroke="#A34876" strokeWidth="2" strokeLinecap="round" /></svg>
          <span className="cnt" id="bellCnt" hidden>0</span>
        </button>
        <button className="icon-btn" id="useBtn" data-lbl="Usage" type="button" aria-expanded="false" aria-label="Usage and thoughts" title="Usage and thoughts"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.4 6.2 6.6.5-5 4.3 1.6 6.5L12 16.6 6.4 20l1.6-6.5-5-4.3 6.6-.5z" fill="#FFD95E" stroke="#A34876" strokeWidth="1.8" strokeLinejoin="round" /></svg><span className="cnt" id="useCnt">0%</span></button>
        <button className="icon-btn" id="showBtn" data-lbl="Showcase mode" type="button" aria-pressed="false" aria-label="Showcase mode" title="Showcase mode: hides the extras for screen recording"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3" fill="#FFD3E5" stroke="#A34876" strokeWidth="2" /><circle cx="12" cy="12" r="3.2" fill="#fff" stroke="#A34876" strokeWidth="2" /></svg></button>
        <button className="icon-btn" id="calmBtn" data-lbl="Calm mode" type="button" aria-pressed="false" aria-label="Calm mode" title="Calm mode">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 14c3-5 6-5 8 0s5 5 8 0" fill="none" stroke="#A34876" strokeWidth="2.4" strokeLinecap="round" /><path d="M4 9c3-4 6-4 8 0s5 4 8 0" fill="none" stroke="#A34876" strokeWidth="2.4" strokeLinecap="round" opacity=".5" /></svg>
        </button>
        <button className="icon-btn" id="themeBtn" data-lbl="Day or night" type="button" aria-label="Switch between day and night"><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="#FFB3D1" stroke="#A34876" strokeWidth="2" strokeLinejoin="round" /></svg></button>
        <button className="icon-btn" id="expBtn" data-lbl="Export my data" type="button" aria-label="Export my data" title="Export my data" hidden><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v10m0 0l-4-4m4 4l4-4M5 19h14" fill="none" stroke="#A34876" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
      </div></div>
      </div>
    </header>
  );
}
