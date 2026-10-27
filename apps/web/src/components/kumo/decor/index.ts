import type { DecorDef } from "./types";
import { moon } from "./moon";
import { star } from "./star";

// Every decoration by id. Add a file per item and list it here.
export const DECOR: Record<string, DecorDef> = { moon, star };
export type { DecorDef } from "./types";
