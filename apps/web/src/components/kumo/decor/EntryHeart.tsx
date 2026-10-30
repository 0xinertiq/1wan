// Round 18: the faint heart behind a date that has a diary entry (the Dungeon's "Your pages" calendar). The same
// pixel heart family as today's heart, filled and drawn in transparent pink (opacity from CSS, about 35%), with no
// outline, so today's stronger heart stays distinct and the date number stays fully readable on top.
const ENTRY_HEART = [".XX.XX.", "XXXXXXX", "XXXXXXX", ".XXXXX.", "..XXX..", "...X..."];

export function EntryHeart() {
  return (
    <svg className="kheart-entry" viewBox="0 0 7 6" shapeRendering="crispEdges" aria-hidden="true">
      {ENTRY_HEART.flatMap((row, y) => row.split("").map((c, x) => (c === "X" ? <rect key={x + "-" + y} x={x} y={y} width={1} height={1} /> : null)))}
    </svg>
  );
}
