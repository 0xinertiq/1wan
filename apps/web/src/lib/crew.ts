import type { SpriteName } from "@/components/PixelSprite";

// The crew, from CLAUDE.md. Identical for every user.
export type CrewMember = { sprite: SpriteName; name: string; role: string; soon?: string };

export const CREW: CrewMember[] = [
  { sprite: "kumo", name: "Chief Kumo", role: "Chief" },
  { sprite: "dundun", name: "Dundun", role: "Risk" },
  { sprite: "olli", name: "Olli", role: "Macro" },
  { sprite: "pip", name: "Pip", role: "News" },
  { sprite: "fenn", name: "Fenn", role: "Trading analyst" },
  { sprite: "tilly", name: "Tilly", role: "Research" },
  { sprite: "luna", name: "Luna", role: "Sky" },
  { sprite: "momo", name: "Momo", role: "Dailies" },
  { sprite: "coco", name: "Coco", role: "Habits, life admin" },
  { sprite: "poppy", name: "Poppy", role: "Content" },
  { sprite: "sisi", name: "Sisi", role: "Journal", soon: "Joins when journalling ships" },
];
