The fox (crew spec v1, 1(WAN)). Rules-only character; no AI, no text generation.

Look (locked, original design):
- Code-drawn pixel kitsune, plum outline #4a2538, crisp nearest-neighbour scaling.
- White fur; red markings on the ear insides, cheeks and tail tips; blush cheeks; dot eyes; one gold accent (a tiny bell at the collar).
- Ear tufts, layered fluffy tails fanned behind him. No headband, no swirl marks, no resemblance to any existing anime character.
- A small lavender spirit flame floats beside him and glows brighter as tails grow.
- Drawing: `apps/web/src/components/kumo/Fox.tsx` (BODY, TAIL and FLAME grids).

What he shows (read-only):
- The existing tails value, 0 to 9 (`apps/web/src/lib/court/tails.ts`, TAILS and earned). One full tail per earned tail; the next one is a faint ghost. He never changes tails, XP, stars or streaks.
- Tap or focus opens a card: what each tail stands for (the TAILS list) and progress to the next one where the rule has a count (streak days, level, gratitude days).

Behaviour in the world:
- Hops between perches (rooftops, a lantern, the sakura tree, the path, the Dungeon rock) every few seconds; naps on rooftops ("z").
- Happy jump and sparkle when she earns XP (a habit, a trade or another logged win), with hearts rising from the island.
- About 9-11% of the scene height. Pauses when off-screen or the tab is hidden. Reduced motion: sits still with his tails visible.
- Replaces the "tails n/9" chip in the New-look header (Classic keeps the chip).
