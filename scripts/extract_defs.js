// Reads her tracker pages (data-import/trackers/trackers-pack/, git-ignored) and prints their item
// definitions as one JSON object on stdout, for import_trackers.py to store in user_state key defs.
// Only the constant declarations at the top of each page script are evaluated, in an empty sandbox.
// Never run this with output going to a terminal or log: the definitions are private.
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const SRC = path.join(__dirname, "..", "data-import", "trackers", "trackers-pack");

function consts(name, names, startRe, stopRe) {
  const p = path.join(SRC, name, "index.html");
  if (!fs.existsSync(p)) return null;
  const html = fs.readFileSync(p, "utf8");
  const s = html.search(startRe);
  if (s < 0) return null;
  const rest = html.slice(s);
  const e = rest.search(stopRe);
  const code = rest.slice(0, e < 0 ? undefined : e);
  const box = {};
  vm.runInNewContext(code + "\n;__out={" + names.join(",") + "};", box, { timeout: 1000 });
  return box.__out;
}

const out = {};
const grid = consts("64-actionables", ["GOAL", "P"], /const GOAL=/, /\/\/ block positions/);
if (grid) out.grid = { goal: grid.GOAL, pillars: grid.P.map(([name, acts]) => ({ name, acts: acts.map(([t, why, when]) => ({ t, why, when })) })) };

const sw = consts("small-wins", ["PHASES"], /const PHASES=/, /const DAILY=/);
if (sw) out.swins = { phases: sw.PHASES };

const mw = consts("money-wins", ["AS_OF", "PHASES", "ROUTINES", "OPEN", "CASH", "STEPS", "UP", "FUNDS", "NW"], /const AS_OF=/, /const stEl=/);
const mk = (() => {
  const p = path.join(SRC, "money-wins", "index.html");
  if (!fs.existsSync(p)) return null;
  const m = fs.readFileSync(p, "utf8").match(/const BASE=(\d+(?:\.\d+)?),EF=(\d+(?:\.\d+)?),SGD_EXP=(\d+(?:\.\d+)?),USD_EXP=(\d+(?:\.\d+)?)/);
  return m ? { base: +m[1], ef: +m[2], sgdExp: +m[3], usdExp: +m[4] } : null;
})();
if (mw) out.money = { asOf: mw.AS_OF, phases: mw.PHASES, routines: mw.ROUTINES, open: mw.OPEN, cash: mw.CASH, steps: mw.STEPS, up: mw.UP, funds: mw.FUNDS, nw: mw.NW, k: mk };

const sm = consts("samsara", ["PHASES"], /const PHASES=/, /const stEl=/);
if (sm) out.samsara = { phases: sm.PHASES };

process.stdout.write(JSON.stringify(out));
