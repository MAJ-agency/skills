const { codeSeul } = await import(process.argv[2]);
import { readFileSync } from "node:fs";
for (const f of process.argv.slice(3)) { const s = readFileSync(f, "utf8"); const c = codeSeul(s); console.log(c === null ? "DOUTE" : c.length === s.length ? "ok" : "LONGUEUR", f); }
