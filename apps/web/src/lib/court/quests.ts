import type { SpriteName } from "@/components/PixelSprite";

// Habit quests from dashboard-v52 (QUESTS). Done/progress per quest is saved in her state under `q`.
export type Quest = {
  id: string; crew: SpriteName; cad: "Daily" | "Weekly"; title: string; sub: string;
  xp: number; star: number; goal: number; auto?: boolean; evt?: string; streak?: boolean;
  cal?: RegExp; calCat?: RegExp; days?: number[]; ck: string;
};

export const QUESTS: Quest[] = [
  { id: "m1", crew: "momo", cad: "Daily", title: "Open the morning brief", sub: "Your daily check-in. Keeps the streak.", xp: 10, star: 2, goal: 1, auto: true, evt: "brief", streak: true, ck: "Counted when the brief opens" },
  { id: "k7", crew: "kumo", cad: "Daily", title: "One 25-minute focus sprint", sub: "One thing, one timer, pings held.", xp: 25, star: 3, goal: 1, auto: true, evt: "sprint", ck: "Kumo times it" },
  { id: "k2", crew: "kumo", cad: "Daily", title: "Study block, 1.5 hours", sub: "Your Mon to Thu course session.", xp: 25, star: 3, goal: 1, auto: true, cal: /study/i, days: [1, 2, 3, 4], ck: "Logs itself when the block ends" },
  { id: "o1", crew: "olli", cad: "Daily", title: "Check the macro calendar before the open", sub: "Know which US data releases land today.", xp: 15, star: 2, goal: 1, auto: true, evt: "macro", ck: "Counted when the live release list loads" },
  { id: "l2", crew: "luna", cad: "Daily", title: "Note your mood against the sky", sub: "One line on the Sky tab.", xp: 15, star: 2, goal: 1, auto: true, evt: "mood", ck: "Counted when you save a mood" },
  { id: "k1", crew: "kumo", cad: "Daily", title: "Daily anchors", sub: "Your eight Small Wins anchors, ticked in the Garden.", xp: 30, star: 4, goal: 8, auto: true, ck: "Counts your anchor ticks, n/8" },
  { id: "f1", crew: "fenn", cad: "Daily", title: "Run the pre-entry checklist", sub: "Bias written, limit entry, stop beyond the swing, size from risk, backup alert set.", xp: 30, star: 4, goal: 1, auto: true, ck: "Auto: a trade or plan saved today with the checklist at 9/9" },
  { id: "c1", crew: "coco", cad: "Daily", title: "Log today's spending, habit level", sub: "Categories only. No account numbers.", xp: 15, star: 2, goal: 1, auto: true, ck: "Auto: a spending line logged today (Money)" },
  { id: "k5", crew: "kumo", cad: "Weekly", title: "Heavenly Tribulation: weekly review", sub: "What worked, what slipped, one change for next week.", xp: 40, star: 6, goal: 1, auto: true, cal: /weekly review|review|reset/i, ck: "Logs itself when the review block ends" },
  { id: "o2", crew: "olli", cad: "Weekly", title: "Write your weekly bias", sub: "One line, plus what would prove it wrong.", xp: 25, star: 3, goal: 1, auto: true, ck: "Auto: a plan with a thesis written this week (Trade)" },
  { id: "c2", crew: "coco", cad: "Weekly", title: "Weekly money review", sub: "Look at the week's pattern and pick one tweak.", xp: 30, star: 4, goal: 1, auto: true, ck: "Auto: Sunday reset ticked and money figures updated that day" },
];

export const QPRI = ["m1", "k7", "o1", "l2", "k2", "k1", "f1", "c1", "k5", "o2", "c2"];
export const CKPRI = ["k1", "f1", "c1", "o2", "c2"];
export const needFor = (lvl: number) => 60 + lvl * 20;
