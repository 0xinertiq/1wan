import type { DecorDef } from "./types";
import { moon } from "./moon";
import { star } from "./star";
import { sakura_0 } from "./sakura_0";
import { sakura_1 } from "./sakura_1";
import { sakura_2 } from "./sakura_2";
import { sakura_3 } from "./sakura_3";
import { sakura_4 } from "./sakura_4";
import { lantern } from "./lantern";
import { flowers } from "./flowers";
import { mushroom } from "./mushroom";

// Every decoration by id. Add a file per item and list it here.
// Sakura stages 0-4 share one 32x32 box and anchor (ground line), so growing never jumps in size.
export const DECOR: Record<string, DecorDef> = { moon, star, sakura_0, sakura_1, sakura_2, sakura_3, sakura_4, lantern, flowers, mushroom };
export type { DecorDef } from "./types";
