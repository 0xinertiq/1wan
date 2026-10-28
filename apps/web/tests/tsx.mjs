// Test-only loader for the render tests: on top of resolve.mjs ("@/" alias, extensionless imports), it compiles
// .tsx files with the TypeScript compiler (JSX to React.createElement) and turns CSS imports into empty modules,
// so node --test can render the app's client components with react-dom/server. Loaded with node --import.
import "./resolve.mjs";
import { createRequire, registerHooks } from "node:module";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// React and react-dom are CommonJS: ESM named imports ("import { useState } from 'react'") need a shim that
// re-exports every key by name.
const require = createRequire(import.meta.url);
const SHIM = ["react", "react-dom", "react-dom/server"];

registerHooks({
  resolve(spec, ctx, next) {
    if (SHIM.includes(spec) && !(ctx.conditions ?? []).includes("require")) return { url: "shim:" + spec, shortCircuit: true };
    return next(spec, ctx);
  },
  load(url, ctx, next) {
    if (url.startsWith("shim:")) {
      const id = url.slice(5), keys = Object.keys(require(id)).filter((k) => /^[A-Za-z_$][\w$]*$/.test(k) && k !== "default");
      return { format: "module", shortCircuit: true, source: `import { createRequire } from "node:module"; const R = createRequire(${JSON.stringify(import.meta.url)})(${JSON.stringify(id)}); export default R; export const { ${keys.join(", ")} } = R;` };
    }
    if (url.endsWith(".css")) return { format: "module", source: "export default {};", shortCircuit: true };
    // markdown imports as plain text, as next.config.mjs does (crew/kumo.md)
    if (url.endsWith(".md")) return { format: "module", source: "export default " + JSON.stringify(readFileSync(fileURLToPath(url), "utf8")) + ";", shortCircuit: true };
    if (url.endsWith(".tsx") || (url.endsWith(".json") && url.includes("/src/"))) {
      if (url.endsWith(".json")) return { format: "module", source: "export default " + readFileSync(fileURLToPath(url), "utf8") + ";", shortCircuit: true };
      const src = readFileSync(fileURLToPath(url), "utf8");
      // classic createElement (react is CommonJS, so the automatic runtime's named exports are not visible to ESM)
      const out = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React, jsxFactory: "__R.createElement", jsxFragmentFactory: "__R.Fragment", esModuleInterop: true }, fileName: fileURLToPath(url) });
      return { format: "module", source: 'import __R from "react";\n' + out.outputText, shortCircuit: true };
    }
    return next(url, ctx);
  },
});
