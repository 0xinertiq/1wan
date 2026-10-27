// Test-only resolver: lets node --test load the app's TypeScript modules, which import without
// extensions ("./quests") and through the "@/" alias. Loaded with node --import.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src");

registerHooks({
  resolve(spec, ctx, next) {
    let s = spec;
    if (s.startsWith("@/")) s = pathToFileURL(path.join(SRC, s.slice(2))).href;
    const parent = ctx.parentURL && ctx.parentURL.startsWith("file:") ? fileURLToPath(ctx.parentURL) : null;
    if ((s.startsWith("file:") || s.startsWith(".")) && parent !== null) {
      const base = s.startsWith("file:") ? fileURLToPath(s) : path.resolve(path.dirname(parent), s);
      for (const ext of ["", ".ts", ".tsx", "/index.ts"]) if (existsSync(base + ext) && !(ext === "" && !path.extname(base))) return next(pathToFileURL(base + ext).href, ctx);
    }
    return next(s, ctx);
  },
});
