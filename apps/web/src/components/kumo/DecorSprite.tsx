import { DECOR } from "./decor/index";
import { DECOR_PAL } from "./decor/types";

// Draws one decoration from its def: a commissioned file if set, otherwise the code-drawn pixel rows
// (runs of one colour merged into a single rect, crisp edges, so it scales nearest-neighbour).
export function Decor({ id, className, label, style }: { id: string; className?: string; label?: string; style?: React.CSSProperties }) {
  const d = DECOR[id];
  if (!d) return null;
  const aria = label ? { role: "img", "aria-label": label } : { "aria-hidden": true as const };
  if (d.file) return <img className={className} src={d.file} alt={label ?? ""} width={d.size.w} height={d.size.h} style={{ imageRendering: "pixelated", ...style }} />;
  const rects: React.ReactNode[] = [];
  (d.rows ?? []).forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const c = row[x];
      let n = 1;
      while (row[x + n] === c) n++;
      if (c !== "." && DECOR_PAL[c]) rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={n} height={1} fill={DECOR_PAL[c]} />);
      x += n;
    }
  });
  return (
    <svg className={className} style={style} viewBox={`0 0 ${d.size.w} ${d.size.h}`} shapeRendering="crispEdges" {...aria}>
      {rects}
    </svg>
  );
}
