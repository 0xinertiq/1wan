import type { SpriteName } from "@/components/PixelSprite";

// Crew as the v52 dashboard describes them (names, roles, desks, lines), now drawn as pixel sprites.
// Dundun is new (not in v52); his lines come from the Roster style board.
export type Agent = {
  id: string;
  name: string;
  short: string;
  role: string;
  color: string;
  level: number;
  xp: number;
  sprite: SpriteName;
  work?: keyof typeof NODES;
  mission?: string;
  hello: string;
  owns?: string;
};

// Stage positions in % (x, y) from v52.
export const NODES = {
  g1: [8, 84], g2: [22, 84], g3: [37, 84], g4: [63, 84], g5: [78, 84], g6: [92, 84],
  pl1: [10, 62], pl2: [24, 62], pr1: [76, 62], pr2: [90, 62], pt1: [42, 40], pt2: [58, 40], pal: [50, 22],
} as const;

export const needA = (level: number) => 30 + level * 10;

export const AGENTS: Agent[] = [
  { id: "kumo", name: "Chief Kumo", short: "Kumo", role: "Executive Chief Agent Officer", color: "#FF8FBF", level: 9, xp: 46, sprite: "kumo",
    hello: "Your Majesty! I have your day covered." },
  { id: "olli", name: "Olli", short: "Olli", role: "Macro", color: "#D9C8FA", level: 4, xp: 30, sprite: "olli", work: "pl1",
    mission: "Swoop over the macro calendar", hello: "Hoo hoo! Macro is on my watch, Queen.",
    owns: "Macro calendar, data releases, weekly bias, Friday thesis" },
  { id: "fenn", name: "Fenn", short: "Fenn", role: "Market", color: "#FFAE82", level: 5, xp: 52, sprite: "fenn", work: "pr2",
    mission: "Sniff the prices and watchlist", hello: "Sniff sniff! Fresh levels for you, Queen.",
    owns: "Prices, levels, watchlist, alerts, pre-entry checklist" },
  { id: "pip", name: "Pip", short: "Pip", role: "News", color: "#FFD95E", level: 3, xp: 18, sprite: "pip", work: "pt1",
    mission: "Peck through the overnight headlines", hello: "Tweet tweet! Fresh headlines, just for you.",
    owns: "Headlines, narratives, what moved overnight" },
  { id: "momo", name: "Momo", short: "Momo", role: "Brief", color: "#FF9DBF", level: 4, xp: 40, sprite: "momo", work: "pt2",
    mission: "Fluff up the morning brief", hello: "Hop hop! Your day, all fluffed up.",
    owns: "Morning brief, free-time ideas, Sunday reset" },
  { id: "luna", name: "Luna", short: "Luna", role: "Stars", color: "#B8C4FF", level: 2, xp: 12, sprite: "luna", work: "pl2",
    mission: "Read what the stars say today", hello: "The stars align for you!",
    owns: "Astro weather for the day and week, moods, timing" },
  { id: "tilly", name: "Tilly", short: "Tilly", role: "Research", color: "#8FD9B8", level: 2, xp: 14, sprite: "tilly", work: "pr1",
    mission: "Dig deep into one big question", hello: "Slow and steady, Queen. I dig deep.",
    owns: "Deep-dive dossiers: 3+ sources, disagreements noted, one page, then I stop" },
  { id: "coco", name: "Coco", short: "Coco", role: "Ledger", color: "#F3C98B", level: 1, xp: 5, sprite: "coco", work: "g5",
    mission: "Count up your habit streaks and money routine", hello: "Squeak! Your streaks are safe with me.",
    owns: "Habit streaks, money check routine, weekly money review, spending habits" },
  // v52 put Poppy on pl1 with Olli; moved to g2 so they don't overlap while standing still.
  { id: "poppy", name: "Poppy", short: "Poppy", role: "Content", color: "#9AD0FF", level: 1, xp: 4, sprite: "poppy", work: "g2",
    mission: "Hunt trends and hatch post ideas", hello: "Squawk! Let us make something pretty, Queen.",
    owns: "IG and X content desk: idea bank, trend sparks from your FYP, posting rhythm" },
  { id: "dundun", name: "Dundun", short: "Dundun", role: "Risk", color: "#7FD1C0", level: 1, xp: 6, sprite: "dundun", work: "g6",
    mission: "Guard your stops and position size", hello: "Grr, gently. Your stops are safe with me, Queen.",
    owns: "Stops, position size, cooldowns, privacy and account safety" },
];
