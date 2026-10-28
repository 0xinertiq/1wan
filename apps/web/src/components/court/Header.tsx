import { PixelSprite } from "@/components/PixelSprite";
import { HeaderMenu } from "./HeaderMenu";
import { HeaderClock, HeaderProgress, HeaderStats } from "./live/SettingsLive";
import { clock } from "@/lib/court/time";

// Pixel clock icon from dashboard-v52 pxClock(): X outline, o face, H hands.
const CLOCK_GRID = ["XX.XXXXX.XX", ".XoooooooX.", "XooooHooooX", "XooooHooooX", "XooooHooooX", "XooooHHHooX", "XoooooooooX", "XoooooooooX", ".XoooooooX.", "..XXXXXXX..", ".X.......X."];
const CLOCK_ICON = CLOCK_GRID.flatMap((row, y) =>
  row.split("").map((c, x) =>
    c === "." ? null : <rect key={`${x}-${y}`} className={c === "X" ? "px-o" : c === "o" ? "px-f" : "px-h"} x={x} y={y} width="1" height="1" />
  )
);

// Header from dashboard-v52. Streak and stars are live; the clock shows render time.
export function Header() {
  const [hh, mm] = clock(Date.now()).split(":");
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
        <HeaderClock icon={CLOCK_ICON} />
        <div className="pill clockpill hclock-classic" title="Time in Singapore"><svg id="clkIcon" width="22" height="22" viewBox="0 0 11 11" shapeRendering="crispEdges" aria-hidden="true">{CLOCK_ICON}</svg><b id="clk" aria-label={`Time in Singapore, ${hh}:${mm}`}>{hh}<i>:</i>{mm}</b></div>
        <HeaderProgress />
        <HeaderStats />
        <HeaderMenu />
      </div>
    </header>
  );
}
