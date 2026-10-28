import type { LifeItem } from "./state";
import { addDays, wdOf } from "./time";

// Editable finance tracker (round 9): pure maths for loans owed to her, the monthly cash flow and folding done items.
// Tracks and explains only, never advises. No account numbers anywhere.

export type Repay = { date: string; amt: number };
export type Loan = { id: string; name: string; lent: number; date?: string; repaid: Repay[]; off: number };

/** Lent, repaid, written off and still expected (never below zero). Net worth counts only the expected part. */
export function loanMath(l: Pick<Loan, "lent" | "repaid" | "off">) {
  const lent = Math.max(0, +l.lent || 0);
  const repaid = (l.repaid ?? []).reduce((t, r) => t + Math.max(0, +r.amt || 0), 0);
  const off = Math.max(0, +l.off || 0);
  return { lent, repaid, off, expected: Math.max(0, lent - repaid - off) };
}

const daysOf = (month: string) => { const out: string[] = []; for (let d = month + "-01"; d.slice(0, 7) === month; d = addDays(d, 1)) out.push(d); return out; };

/** How many times a Life admin rule falls in a month (YYYY-MM). */
export function hitsInMonth(rule: LifeItem["rule"], month: string) {
  const days = daysOf(month);
  switch (rule.type) {
    case "dom": return rule.from && rule.from.slice(0, 7) > month ? 0 : 1;
    case "wk": return days.filter((d) => rule.days.includes(wdOf(d))).length;
    case "once": return rule.date.slice(0, 7) === month ? 1 : 0;
    case "every": {
      if (!(rule.n >= 1)) return 0;
      // phase-aligned to the last time it was done, before or after, so past months never change when it is ticked
      const start = rule.last ?? days[0];
      return days.filter((d) => { const gap = Math.round((Date.parse(d) - Date.parse(start)) / 86400e3); return ((gap % rule.n) + rule.n) % rule.n === 0; }).length;
    }
  }
}

/** Fixed bills for a month, pulled from Life admin (bills with an amount), each item once with its count. */
export function billsForMonth(life: LifeItem[], month: string) {
  const rows = life.filter((it) => it.cat === "bill" && typeof it.amt === "number" && it.amt > 0)
    .map((it) => { const n = hitsInMonth(it.rule, month); return { id: it.id, name: it.name, n, amt: (it.amt as number) * n }; })
    .filter((x) => x.n > 0);
  return { rows, total: rows.reduce((t, x) => t + x.amt, 0) };
}

/** Income in − fixed bills − sinking fund set-asides − logged spending = left over. */
export function cashflow(x: { income: number; bills: number; sinking: number; spending: number }) {
  return { ...x, left: x.income - x.bills - x.sinking - x.spending };
}

/** Life admin items that are done for now (auto-paid, a one-off paid, or paid this month) fold under "Show paid". */
export function isPaidNow(it: Pick<LifeItem, "paid" | "rule">, autoPaid: boolean, k: string) {
  if (autoPaid) return true;
  if (it.paid === 1 || (it.rule.type === "once" && !!it.paid)) return true;
  if (it.rule.type === "every" && it.rule.last && it.rule.last.slice(0, 7) === k.slice(0, 7)) return true;
  return typeof it.paid === "string" && it.paid.slice(0, 7) === k.slice(0, 7);
}

/** Split a list into still open and done; done items keep their order and are never removed. */
export function foldDone<T>(items: T[], done: (x: T) => boolean) {
  return { open: items.filter((x) => !done(x)), done: items.filter(done) };
}
