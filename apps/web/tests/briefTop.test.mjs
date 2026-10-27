// "3 things that matter" rules (lib/briefTop.ts). Made-up brief text, not real briefs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { topThree } from "../src/lib/briefTop.ts";

test("bottom line first, then headings with their first line", () => {
  const t = topThree("# Daily Brief\n**Bottom line:** Quiet day, CPI tomorrow.\n## Macro\n- Fed speakers at 2pm\n## Crypto\nBTC range holds — [CoinDesk](https://x.y)\n## Asia\nNikkei up");
  assert.deepEqual(t, ["Quiet day, CPI tomorrow.", "Macro: Fed speakers at 2pm", "Crypto: BTC range holds"]);
});

test("no headings: first lines, markdown stripped, max three", () => {
  assert.deepEqual(topThree("Pulse Morning Brief\n- **One** thing\n- Two `x`\n- Three\n- Four"), ["One thing", "Two x", "Three"]);
});

test("empty brief gives nothing", () => assert.deepEqual(topThree(""), []));
