// One decoration per file: id, size (pixel grid), anchor (0-1 within the box), the scene slots it may sit in,
// and either code-drawn pixel rows or a commissioned `file`. Swapping in real art = set `file`, nothing else.
export type DecorDef = {
  id: string;
  label: string;
  size: { w: number; h: number };
  anchor: { x: number; y: number };
  slots: string[];
  prototype: boolean;
  rows?: string[];
  file?: string;
};

// Pixel row letters: X plum outline, o cream fill, s soft shade, c blush cheek, g gold accent,
// p sakura pink, q deeper pink, l leaf, b bark, d soil, r stone, w water. "." is empty.
export const DECOR_PAL: Record<string, string> = {
  X: "#4a2538", o: "#FFF6E3", s: "#F3E2C4", c: "#FF9DBF", g: "#FFD95E",
  p: "#FFB3D1", q: "#F48FB8", l: "#9BD8AE", b: "#A9776B", d: "#D9B59C", r: "#D8CFE0", w: "#AFCBFF",
};
