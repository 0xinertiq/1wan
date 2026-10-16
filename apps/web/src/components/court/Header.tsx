import { PixelSprite } from "@/components/PixelSprite";
import { HeaderMenu } from "./HeaderMenu";

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
        <HeaderMenu />
      </div>
    </header>
  );
}
