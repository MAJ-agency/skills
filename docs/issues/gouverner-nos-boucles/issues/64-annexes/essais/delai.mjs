// Le délai de la décision 9 (première version du ticket 64) sur les bancs posés d'un arbre : somme des bornes / P + max + 60 s.
// node delai.mjs <racine> <parallele>
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { aDesSousTests } from "./code-seul.mjs";
const [racine, p = "3"] = process.argv.slice(2);
const { nomsDesTests, travaux } = await import(join(racine, "scripts/tranches.mjs"));
const dossiers = ["skills/chaine/fusionner/scripts", "skills/chaine/sujet/scripts", "skills/chaine/revue-adversariale/scripts", "skills/chaine/revue-de-ticket/scripts"];
const bancs = dossiers.flatMap((d) => readdirSync(join(racine, d)).filter((n) => n.endsWith(".test.mjs")).map((n) => join(d, n)));
bancs.push("skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs");
let somme = 0, max = 0, nb = 0;
for (const b of bancs) {
  const s = readFileSync(join(racine, b), "utf8");
  const noms = nomsDesTests(s);
  for (const t of travaux(b, noms, 10, { entier: aDesSousTests(s) })) {
    const lignes = (s.match(/^test\(/gm) ?? []).length;
    const poids = t.sorte === "reste" ? Math.max(1, lignes - noms.length) : Math.max(1, t.noms.length);
    const borne = Math.max(300, 60 * poids);
    somme += borne; max = Math.max(max, borne); nb++;
  }
}
console.log(`${bancs.length} bancs, ${nb} travaux, somme des bornes ${somme} s, plus grande ${max} s, délai ${Math.round(somme / +p + max + 60)} s (P = ${p})`);
