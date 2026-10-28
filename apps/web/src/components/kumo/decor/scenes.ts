// Pixel scene headers for every tab (round 6). Code-drawn pixel art only: rows of palette letters on a pixel
// grid, the crew's plum outline #4a2538, one gold accent per sprite, warm window glow. Letters as DECOR_PAL plus
// m mint, v lavender, n night window. "." is empty. Rows may differ in length; the renderer pads them.

export type Sprite = string[];
export type SceneId = "desk" | "clock" | "cottage" | "gate" | "garden" | "board" | "castle";

// pixel-art palette (scene only)
export const SCENE_PAL: Record<string, string> = {
  X: "#4a2538", o: "#FFF6E3", s: "#F3E2C4", c: "#FF9DBF", g: "#FFD95E", p: "#FFB3D1", q: "#F48FB8",
  l: "#9BD8AE", m: "#C9F0D6", b: "#C98E7E", d: "#E8C3A8", r: "#E7DEFF", v: "#CDBFFB", w: "#BFD9FF",
};
// Sky bands top to bottom, by Singapore time. pixel-art
export const SCENE_SKY: Record<"day" | "dusk" | "night", string[]> = {
  day: ["#FBE3F1", "#F7DDF3", "#EEDCFA", "#E5DDFF", "#DDE6FF"],
  dusk: ["#B9A6E8", "#D7A9DA", "#F2B3CF", "#FFC9C4", "#FFDDBE"],
  night: ["#2A2340", "#30294A", "#3A3058", "#463A69", "#54477A"],
};

const desk: Sprite = [
  "....XX..................",
  "...XggX.................",
  "..XgoogX..........XXXX..",
  "..XgoogX.........XooooX.",
  "..XggggX.........XoXXoX.",
  "...XXXX....XXX...XoooXX.",
  "....XX....XgggX..XooXoX.",
  "....XX.....XXX...XXXXXX.",
  "....XX....XgggX.XXX.....",
  "XXXXXXXXXXXXXXXXXXXXXXXX",
  "XbbbbbbbbbbbbbbbbbbbbbbX",
  "XXXXXXXXXXXXXXXXXXXXXXXX",
  ".XbX................XbX.",
  ".XbX................XbX.",
  ".XbX................XbX.",
  ".XXX................XXX.",
];
const clock: Sprite = [
  ".......gg.......",
  "......XqqX......",
  ".....XqqqqX.....",
  "....XqqqqqqX....",
  "...XqqqqqqqqX...",
  "..XXXXXXXXXXXX..",
  "...XooooooooX...",
  "...XoXXXXXXoX...",
  "...XXooXoooXX...",
  "...XXooXoooXX...",
  "...XXooXXXoXX...",
  "...XXooooooXX...",
  "...XoXXXXXXoX...",
  "...XooooooooX...",
  "...XoXXooXXoX...",
  "...XoXgXXgXoX...",
  "...XoXXooXXoX...",
  "...XooooooooX...",
  "...XooopqoooX...",
  "...XoooXXoooX...",
  "...XooXbbXooX...",
  "...XooXbbXooX...",
  ".XXXXXXXXXXXXXX.",
  "XlllplllllllplllX",
  "XllllllpllllllllX",
];
const cottage: Sprite = [
  "........XXXXXXXX...XX...",
  ".......XqqqqqqqqX.XbbX..",
  "......XqqqqqqqqqqXXbbX..",
  ".....XqqqpqqqqqqqqXbbX..",
  "....XqqqqqqqqqpqqqqXX...",
  "...XXXXXXXXXXXXXXXXXXX..",
  "....XddddddddddddddddX..",
  "....XdXXXXddddddXXXXdX..",
  "....XdXggXddXXddXggXdX..",
  "....XdXggXdXbbXdXggXdX..",
  "....XdXXXXdXbbXdXXXXdX..",
  "....XddddddXbbXddddddX..",
  "....XddddddXbgXddddddX..",
  "....XXXXXXXXXXXXXXXXXX..",
];
const cat: Sprite = [
  ".X.X...",
  "XoXoX..",
  "XoooX..",
  "XcXcX.X",
  "XoooXXo",
  ".XXXXX.",
];
const gate: Sprite = [
  "......XXXXXXXXXX......",
  "....XXrrrrrrrrrrXX....",
  "...XrrrrXXXXXXrrrrX...",
  "..XrrrXXbbbbbbXXrrrX..",
  "..XrrXbbbbbbbbbbXrrX..",
  ".XrgrXbbXbbbbXbbXrgrX.",
  ".XrrXbbbXbbbbXbbbXrrX.",
  ".XrvXbbbXbbbbXbbbXvrX.",
  ".XrrXbbbXbggbXbbbXrrX.",
  ".XrgXbbbXbggbXbbbXgrX.",
  ".XrrXbbbXbbbbXbbbXrrX.",
  ".XlrXbbbXbbbbXbbbXrlX.",
  ".XllXbbbXbbbbXbbbXllX.",
  "XXXXXXXXXXXXXXXXXXXXXX",
];
const board: Sprite = [
  "..XXXXXXXXXXXXXXXXXX..",
  ".XqqqqqqqqqqqqqqqqqqX.",
  "XXXXXXXXXXXXXXXXXXXXXX",
  ".XbbbbbbbbbbbbbbbbbbX.",
  ".XbXXXXXbbXXXXbXXXXbX.",
  ".XbXogoXbbXppXbXooXbX.",
  ".XbXoXoXbbXqpXbXXoXbX.",
  ".XbXoooXbbXppXbXooXbX.",
  ".XbXXXXXbbXXXXbXXXXbX.",
  ".XbbbbbbbbbbbbbbbbbbX.",
  ".XXXXXXXXXXXXXXXXXXXX.",
  "...XbX..........XbX...",
  "...XbX..........XbX...",
  "...XXX..........XXX...",
];
const castle: Sprite = [
  "..g.............g...",
  ".XqX....XX.....XqX..",
  "XqqqX..XqqX...XqqqX.",
  "XoooX.XqqqqX..XoooX.",
  "XoXoXXXXXXXXXXXoXoX.",
  "XoooXooooooooooXoooX",
  "XoooXoXXooooXXoXoooX",
  "XoXoXoXgooooXgoXoXoX",
  "XoooXoooooooooooXooX",
  "XoooXooooXXooooXoooX",
  "XoooXoooXbbXoooXoooX",
  "XoooXoooXbbXoooXoooX",
  "XXXXXXXXXXXXXXXXXXXX",
];
const bridge: Sprite = [
  "......XXXXXXXX......",
  "...XXXqqqqqqqqXXX...",
  "..XqqXXXXXXXXXXqqX..",
  ".XqX..X..X..X..XqX..",
  "XqX..............XqX",
];
const heart: Sprite = [".X.X.", "XpXpX", "XpppX", ".XpX.", "..X.."];
const lanternS: Sprite = ["..X..", ".XgX.", "XgogX", "XgggX", ".XXX.", "..X..", "..X.."];
const coin: Sprite = [".XXX.", "XgggX", "XgXgX", "XgggX", ".XXX."];
const rune: Sprite = ["XgX", "g.g", "XgX"];
const sakura: Sprite = [
  "....XXXX.XXX....",
  "..XXppppXpppXX..",
  ".XpppqpppppqppX.",
  "XpppppppppppppqX",
  "XpqppppqppppppX.",
  ".XppppppppqpppX.",
  "..XXppppppppXX..",
  "....XXXbbXXX....",
  ".......bb.......",
  ".......bb.......",
  "......XbbX......",
];
const flower: Sprite = [".p.", "pgp", ".p.", ".l."];

export type Place = { s: Sprite; x: number; y?: number; scale?: number };
// Each scene: the landmark and its friends on a 160 x 40 pixel stage (ground at y 34).
export const SCENES: Record<SceneId, { label: string; parts: Place[]; pond?: boolean }> = {
  desk: { label: "A little trading desk with a lantern and coins under the moon", parts: [{ s: desk, x: 64 }, { s: coin, x: 92 }, { s: coin, x: 98 }, { s: heart, x: 40, y: 12 }, { s: flower, x: 30 }, { s: flower, x: 120 }] },
  clock: { label: "The clock tower on a sakura hill", parts: [{ s: clock, x: 70 }, { s: sakura, x: 44 }, { s: sakura, x: 96 }, { s: heart, x: 120, y: 10 }, { s: flower, x: 30 }] },
  cottage: { label: "The cosy timber cottage with a cat and a lantern", parts: [{ s: cottage, x: 66 }, { s: cat, x: 92 }, { s: lanternS, x: 58 }, { s: flower, x: 40 }, { s: flower, x: 110 }, { s: heart, x: 120, y: 12 }] },
  gate: { label: "The enchanted dungeon gate with runes and a lantern", parts: [{ s: gate, x: 68 }, { s: lanternS, x: 60 }, { s: lanternS, x: 94 }, { s: rune, x: 48, y: 14 }, { s: rune, x: 110, y: 10 }, { s: flower, x: 36 }] },
  garden: { label: "The sakura tree, bridge and pond", parts: [{ s: sakura, x: 40, scale: 2 }, { s: bridge, x: 90, y: 31 }, { s: lanternS, x: 120 }, { s: flower, x: 76 }, { s: heart, x: 132, y: 10 }], pond: true },
  board: { label: "A pixel notice board in the sky", parts: [{ s: board, x: 68 }, { s: heart, x: 52, y: 10 }, { s: heart, x: 100, y: 14 }, { s: flower, x: 40 }, { s: flower, x: 112 }] },
  castle: { label: "The castle on its cloud", parts: [{ s: castle, x: 68 }, { s: sakura, x: 44 }, { s: lanternS, x: 94 }, { s: heart, x: 110, y: 10 }, { s: flower, x: 120 }] },
};
export const SPARKLES: [number, number][] = [[12, 6], [26, 14], [108, 5], [140, 9], [150, 18], [20, 22], [128, 24]];
