import type { CSSProperties } from "react";
import { SPRITE_DEFS } from "./spriteDefs";

// Palette per character: body, shade, highlight, belly. From Roster.dc.html.
const PALETTES = {
  kumo: ["#ffc2d4", "#f598b5", "#ffe3ec", "#fff4ec"],
  olli: ["#d9c8fa", "#b9a3ef", "#efe6ff", "#fff4ec"],
  fenn: ["#ffae82", "#e88c5c", "#ffd0b4", "#fff4ec"],
  pip: ["#ffd95e", "#e8b93a", "#fff0a8", "#fff4ec"],
  momo: ["#ff9dbf", "#e8749f", "#ffc4d9", "#fff4ec"],
  luna: ["#d8d0ff", "#b4a8f0", "#efeaff", "#f6f2ff"],
  tilly: ["#8fd9b8", "#5fb88f", "#bdf0d8", "#fff4ec"],
  coco: ["#f3c98b", "#e2a85f", "#ffe8c4", "#fff1dc"],
  poppy: ["#9ad0ff", "#6fb2f0", "#cde8ff", "#fff4ec"],
  dundun: ["#7fd1c0", "#4fb3a1", "#b5ece0", "#fff4ec"],
  nini: ["#fff4ec", "#e8dccf", "#ffffff", "#fff4ec"],
  sisi: ["#fff4ec", "#e8dccf", "#ffffff", "#fff4ec"],
  jin: ["#f6c453", "#e0a93b", "#ffe38f", "#fff1c9"],
  imp: ["#ff7a8a", "#e0566d", "#ffb3bd", "#fff4ec"],
  tilt: ["#a79bd0", "#8a7fb0", "#cfc6ee", "#fff4ec"],
  slink: ["#c98f5a", "#a8703f", "#e3b07e", "#fff1dc"],
} as const;

const SPRITE_IDS: Record<SpriteName, string> = {
  kumo: "cKumo", olli: "cOlli", fenn: "cFenn", pip: "cPip", momo: "cMomo", luna: "cLuna",
  tilly: "cTilly", coco: "cCoco", poppy: "cPoppy", dundun: "cDun", nini: "cNini", sisi: "cSisi",
  jin: "cJin", imp: "cImp", tilt: "cTilt", slink: "cSlink",
};

export type SpriteName = keyof typeof PALETTES;

// Render once per page, before any <PixelSprite />.
export function PixelDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
      <defs dangerouslySetInnerHTML={{ __html: SPRITE_DEFS }} />
    </svg>
  );
}

export function PixelSprite({ name, size = 96, label }: { name: SpriteName; size?: number; label?: string }) {
  const [c, c2, c3, b] = PALETTES[name];
  const style = { "--c": c, "--c2": c2, "--c3": c3, "--b": b } as CSSProperties;
  return (
    <svg
      className="px"
      viewBox="0 -1 32 32"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={style}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <use href={`#${SPRITE_IDS[name]}`} />
    </svg>
  );
}
