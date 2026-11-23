// Applique une mutation (remplacement exact, unique) à arbre-mut/scripts/tranches.mjs, joue le banc, restaure.
// Usage : node muter.mjs mutations.json
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
const racine = new URL("./arbre-mut/", import.meta.url).pathname;
const muts = JSON.parse(readFileSync(process.argv[2], "utf8"));
const f = racine + "scripts/tranches.mjs";
const orig = readFileSync(f, "utf8");
const jouer = () => spawnSync(process.execPath, ["--test", "scripts/tranches.test.mjs"], { cwd: racine, encoding: "utf8", timeout: 60_000, env: { PATH: process.env.PATH, TMPDIR: process.env.TMPDIR } });
const temoin = jouer();
console.log(`témoin : sortie ${temoin.status}`);
if (temoin.status !== 0) process.exit(1);
let tuees = 0;
for (const { nom, de, vers, fichier } of muts) {
  const cible = fichier ? racine + fichier : f;
  const o = readFileSync(cible, "utf8");
  const k = o.split(de).length - 1;
  if (k !== 1) { console.log(`INAPPLICABLE (${k}) ${nom}`); continue; }
  writeFileSync(cible, o.replace(de, vers));
  const r = jouer();
  writeFileSync(cible, o);
  const echecs = (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.slice(0, 80));
  if (r.status !== 0) tuees++;
  console.log(`${r.status !== 0 ? "tuée  " : "VIVANTE"} ${nom}${echecs.length ? "  ← " + echecs.join(" | ") : ""}`);
}
if (readFileSync(f, "utf8") !== orig) throw new Error("non restauré");
console.log(`${tuees} tuées sur ${muts.length}`);
