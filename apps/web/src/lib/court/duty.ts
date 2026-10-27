import type { BriefKind } from "@/lib/briefKinds";
import type { CourtState } from "./state";
import type { WaterEvt } from "./garden";
import { isDone, dayQ } from "./state";

// Who stands at their desk on the Court today. Real events only: a crew member walks out of the palace
// to their desk once their own work for today exists (a brief filed, a line logged), and stays inside otherwise.
export type Duty = { on: boolean; why: string };

const sgtKey = (iso: string) => new Date(Date.parse(iso) + 8 * 3600000).toISOString().slice(0, 10);
const hm = (iso: string) => new Date(Date.parse(iso) + 8 * 3600000).toISOString().slice(11, 16);

export function crewDuty(o: { k: string; filed: Partial<Record<BriefKind, string>>; water: WaterEvt[]; st: CourtState; sky: boolean }): Record<string, Duty> {
  const { k, filed, water, st } = o;
  const brief = (kinds: BriefKind[], what: string): Duty => {
    const at = kinds.map((x) => filed[x]).filter((x): x is string => !!x && sgtKey(x) === k).sort().pop();
    return at ? { on: true, why: `${what} filed ${hm(at)}` } : { on: false, why: `No ${what.toLowerCase()} yet today` };
  };
  const logged = (sources: string[], what: string): Duty => {
    const e = water.filter((w) => sources.includes(w.source) && sgtKey(w.at) === k).sort((a, b) => a.at.localeCompare(b.at)).pop();
    return e ? { on: true, why: `${what} at ${hm(e.at)}` } : { on: false, why: `No ${what.toLowerCase()} yet today` };
  };
  const dailies = dayQ(k).filter((q) => isDone(st, q.id)).length;
  const pulse = brief(["pulse"], "Morning brief");
  return {
    olli: brief(["intel"], "Intelligence brief"),
    pip: brief(["intel", "pulse"], "News brief"),
    fenn: brief(["scan", "movers"], "Watchlist scan"),
    momo: pulse.on ? pulse : dailies ? { on: true, why: `${dailies} daily quest${dailies === 1 ? "" : "s"} done` } : { on: false, why: "No brief or dailies yet today" },
    luna: o.sky ? { on: true, why: "Sky read for today" } : { on: false, why: "Reading the sky" },
    coco: logged(["spending", "anchor", "anchors"], "Spending or anchor logged"),
    dundun: logged(["trade", "plan"], "Trade or plan checked"),
    poppy: st.cad.x > 0 ? { on: true, why: `${st.cad.x} post${st.cad.x === 1 ? "" : "s"} this week` } : { on: false, why: "No posts counted this week" },
    tilly: { on: false, why: "No research filed yet" },
  };
}
