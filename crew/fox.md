The fox (crew spec v2, 1(WAN), round 5c). Rules-only character; no AI, no text generation.
v1 (round 5) was a thin side-view sprite; v2 redraws him to match the crew.

Look (original design; no headband, no swirl marks, nothing resembling an existing anime character):
- Drawn on the crew's 32-pixel grid (a 40 x 32 canvas so a full fan of tails fits), 1px plum outline #4a2538 traced round every shape like the crew, nearest-neighbour rendering.
- Chibi proportions: a big round head (about 55-60% of the sprite), a tiny round body, short stubby legs, big pointed ears with soft pink insides and red tips.
- Face in the crew's language: 2x3 dark eyes with a one-pixel highlight, blush cheeks, a tiny nose and a small happy mouth; red cheek stripes are his signature.
- Soft white fur with light lavender-pink shading, red markings (ear tips, cheek stripes, tail tips), one gold accent: a tiny bell on a red collar.
- Tails: plump, round and fluffy with red tips, fanned behind him; the number is the existing tails value (lib/court/tails.ts, read-only), the next one drawn as a faint ghost.
- A small lavender spirit flame floats beside him and glows brighter as tails grow.
- Drawing: apps/web/src/components/kumo/foxArt.ts (pure); component: apps/web/src/components/kumo/Fox.tsx.

Size and place: the same pixel scale as the crew (about 15% of the scene height on desktop), standing in front of the buildings; only on perches clear of place labels, the HUD band and the quote bubble (components/kumo/world/layout.ts, checked by tests/world-layout.test.mjs).

Behaviour: a squash-and-stretch hop (anticipation, jump, soft landing) every 16 seconds, 1.8 seconds per hop; a sleepy nap pose (closed eyes, floating "z") on rooftops; a happy bounce and sparkle when she earns XP (a habit, a trade or another logged win); a gentle tail wag while idle. Pauses off-screen and in hidden tabs; reduced motion shows him sitting still with his tails visible. Tap or focus opens his card: what each tail means and progress to the next.

Replaces the "tails n/9" chip in the New-look header (Classic keeps the chip).
