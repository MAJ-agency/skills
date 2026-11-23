// Mutations de mon cru : chacune appliquée seule dans la copie `mut`, le banc visé joué, le fichier restauré.
// node muter.mjs <racine de la copie> <liste.json> [filtre]
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
const [RACINE, LISTE, FILTRE] = process.argv.slice(2);
const mutations = JSON.parse(readFileSync(LISTE, "utf8")).filter((m) => !FILTRE || m.id.startsWith(FILTRE));
const env = Object.fromEntries(Object.entries(process.env).filter(([k]) => !k.startsWith("GIT_") && k !== "NODE_TEST_CONTEXT"));
env.TMPDIR = "<dossier du contre-relecteur>/tmp";
const jouer = (banc, motif) => {
  const args = ["--test", "--test-reporter=dot", ...(motif ? [`--test-name-pattern=${motif}`] : []), banc];
  const r = spawnSync(process.execPath, args, { cwd: RACINE, env, encoding: "utf8", timeout: 900_000 });
  return { code: r.status, fin: (r.stdout + r.stderr).split("\n").filter((l) => /^ℹ (tests|pass|fail)/.test(l)).join(" ") };
};
for (const m of mutations) {
  const chemin = join(RACINE, m.fichier);
  const avant = readFileSync(chemin, "utf8");
  const n = avant.split(m.old).length - 1;
  if (n !== 1) { console.log(`${m.id} NON APPLIQUÉE (${n} occurrences)`); continue; }
  writeFileSync(chemin, avant.replace(m.old, m.new));
  try {
    let r = jouer(m.banc, m.motif);
    let ou = m.motif ? "tests visés" : "banc entier";
    if (r.code === 0 && m.motif) { r = jouer(m.banc); ou = "banc entier"; }
    console.log(`${m.id} ${r.code === 0 ? "VERTE (survit)" : "rouge (tuée)"} [${ou}] ${r.fin} — ${m.quoi}`);
  } finally {
    writeFileSync(chemin, avant);
  }
}
