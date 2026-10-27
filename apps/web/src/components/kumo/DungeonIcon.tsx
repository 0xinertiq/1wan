// The Dungeon's pixel icon: an arched door in a rock frame, a glowing gold keyhole, a tiny lantern.
// Plum outline, one gold accent, crisp pixels at any size.
const G = [
  "....XXXXXX....X.",
  "...XrrrrrrX..XpX",
  "..XrrXXXXrrX..X.",
  ".XrrXddddXrrX...",
  ".XrXddddddXrX...",
  "XrrXddddddXrrX..",
  "XrXdddwwdddXrX..",
  "XrXddwggwddXrX..",
  "XrXdddggdddXrX..",
  "XrXddddgdddXrX..",
  "XrXddddddddXrX..",
  "XrXdwddddwdXrX..",
  "XmXddddddddXmX..",
  "XmmXXXXXXXXmmX..",
  "XXXXXXXXXXXXXX..",
];
const F: Record<string, string> = { X: "#4a2538", r: "#E9B8CF", d: "#6B4E7A", w: "#8C6B9C", g: "#FFD95E", m: "#7CC79A", p: "#FFB3D1" };

export function DungeonIcon({ size = 32, label }: { size?: number; label?: string }) {
  return (
    <svg viewBox="0 0 16 15" width={size} height={size} shapeRendering="crispEdges" role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {G.flatMap((row, y) => row.split("").map((c, x) => (c === "." ? null : <rect key={x + "-" + y} x={x} y={y} width="1" height="1" fill={F[c]} />)))}
    </svg>
  );
}
