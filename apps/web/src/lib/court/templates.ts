// Foundations F6: starter quests for a new account (the first-run step in the game-loop phase lets them pick 3 as core
// and add one of their own). Generic on purpose: none of her quests, anchors, courses or wording. Each has a tiny
// version for hard days (half XP). Pillar = the universal pillar it waters (renamable later).
export type Template = { id: string; cat: "Body" | "Mind" | "Craft / Work" | "Money & home"; name: string; tiny: string; pillar: string; xp: number };
export const TEMPLATE_CATS = ["Body", "Mind", "Craft / Work", "Money & home"] as const;
export const TEMPLATES: Template[] = [
  { id: "t-move", cat: "Body", name: "Move 10 min", tiny: "2 min stretch", pillar: "Body", xp: 20 },
  { id: "t-bed", cat: "Body", name: "In bed by your time", tiny: "Phone down 15 min earlier", pillar: "Rest", xp: 20 },
  { id: "t-meal", cat: "Body", name: "Eat one proper meal", tiny: "Add one fruit or veg", pillar: "Body", xp: 15 },
  { id: "t-out", cat: "Body", name: "Step outside", tiny: "2 min", pillar: "Rest", xp: 10 },
  { id: "t-journal", cat: "Mind", name: "Journal one line", tiny: "One word", pillar: "Mind", xp: 15 },
  { id: "t-read", cat: "Mind", name: "Read 10 pages", tiny: "One page", pillar: "Mind", xp: 15 },
  { id: "t-breathe", cat: "Mind", name: "Breathe for 5 min", tiny: "Three slow breaths", pillar: "Rest", xp: 10 },
  { id: "t-sprint", cat: "Craft / Work", name: "Focus sprint 25 min", tiny: "5 min", pillar: "Craft", xp: 25 },
  { id: "t-ship", cat: "Craft / Work", name: "Finish one small thing", tiny: "Write the next step", pillar: "Craft", xp: 20 },
  { id: "t-learn", cat: "Craft / Work", name: "Learn for 20 min", tiny: "5 min", pillar: "Craft", xp: 20 },
  { id: "t-spend", cat: "Money & home", name: "Log today's spending", tiny: "Log one spend", pillar: "Money", xp: 15 },
  { id: "t-tidy", cat: "Money & home", name: "Tidy for 10 min", tiny: "Clear one surface", pillar: "Home", xp: 15 },
  { id: "t-call", cat: "Money & home", name: "Message someone close", tiny: "Send one emoji", pillar: "Connection", xp: 10 },
];
export const CUSTOM_SLOTS = 1;
