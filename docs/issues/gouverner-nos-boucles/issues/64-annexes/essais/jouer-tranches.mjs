// Joue un banc comme `poses` le joue : travaux de `tranches.mjs`, PARALLELE à la fois, plus gros d'abord.
// node jouer-tranches.mjs <racine du dépôt> <banc relatif> <entier|decoupe>
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { availableParallelism, tmpdir } from "node:os";
import { join } from "node:path";

const [racine, banc, mode] = process.argv.slice(2);
const { nomsDesTests, travaux, aDesSousTests, couverture, RAPPORTEUR } = await import(join(racine, "scripts/tranches.mjs"));
const source = readFileSync(join(racine, banc), "utf8");
const liste = travaux(banc, nomsDesTests(source), 10, { entier: mode === "entier" ? aDesSousTests(source) : false });
const PARALLELE = Math.max(2, availableParallelism() - 1);
const dossier = mkdtempSync(join(tmpdir(), "tranches-"));
writeFileSync(join(dossier, "rapporteur.mjs"), RAPPORTEUR);
const env = Object.fromEntries(Object.entries(process.env).filter(([c]) => !c.startsWith("GIT_") && c !== "NODE_TEST_CONTEXT"));
const debut = Date.now();
const jouer = (t, i) => new Promise((fin) => {
  const rapport = join(dossier, `r-${i}.jsonl`);
  const d = Date.now();
  const e = spawn(process.execPath, ["--test", `--test-reporter=${join(dossier, "rapporteur.mjs")}`, `--test-reporter-destination=${rapport}`, ...t.args], { cwd: racine, env, stdio: "ignore" });
  e.on("close", (code, signal) => {
    let noms = [];
    try { noms = readFileSync(rapport, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l).nom); } catch {}
    fin({ sorte: t.sorte, code, signal, s: (Date.now() - d) / 1000, noms });
  });
});
const res = new Array(liste.length);
let suivant = 0;
await Promise.all(Array.from({ length: Math.min(PARALLELE, liste.length) }, async () => {
  while (suivant < liste.length) { const i = suivant++; res[i] = await jouer(liste[i], i); }
}));
for (const r of res) console.log(`${r.sorte}\tsortie ${r.code ?? r.signal}\t${r.s.toFixed(1)} s\t${r.noms.length} tests`);
console.log(`travaux ${liste.length}, parallèle ${PARALLELE}, total ${((Date.now() - debut) / 1000).toFixed(1)} s, couverture ${JSON.stringify(couverture(liste, res.map((r) => r.noms)))}`);
