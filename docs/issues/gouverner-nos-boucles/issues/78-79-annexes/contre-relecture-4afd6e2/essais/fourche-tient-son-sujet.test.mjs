// Essai de la contre-relecture de la PR 152 (mineur 2) : une sous-PR de fourche dont la branche porte un nom qu'origin
// n'a pas (le cas ordinaire d'une fourche), étiquetée `à-fusionner` par un membre, dans un sujet qui a une autre sous-PR.
// Joué par `boucle.sh` (`traiter_sujets`), deux tours, régime 7 (le contrat du dépôt jouet n'a pas la clé `relecture`).
// À poser dans `skills/chaine/fusionner/scripts/` d'un arbre (8.0.0 ou la PR), puis `node --test <ce fichier>` ; le
// fichier se retire après. Il n'asserte rien sur le résultat : il écrit ce que la boucle a fait, pour comparer.
import { test } from "node:test";
import { existsSync } from "node:fs";
const { depotJouet, script: scriptDe } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs"
);
const BOUCLE = scriptDe("fusionner", "boucle.sh");

function monter({ sansCi }) {
  const d = depotJouet();
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" }, "feat(lot): lot (#1)");
  const checks = {};
  const pulls = [];
  for (const n of [80, 81]) {
    const sha = d.branche(`feat/pr-${n}`, "origin/sujet/lot", { [`docs/pr-${n}.md`]: `${n}\n` });
    if (!(sansCi && n === 80)) checks[sha] = { qualite: "SUCCESS" };
    // #80 : une fourche (`autre/jouet`) dont la branche `fourche/a` n'existe pas sur origin, au sommet de feat/pr-80.
    pulls.push({ number: n, title: `docs(lot): pr ${n}`, head: n === 80 ? "fourche/a" : `feat/pr-${n}`, sha, base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n", ...(n === 80 ? { fourche: "autre/jouet" } : {}) });
  }
  d.git("push", "-q", "origin", ":refs/heads/feat/pr-80");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks, pulls });
  d.publierChaine();
  return d;
}

for (const sansCi of [false, true]) {
  test(`fourche #80 ${sansCi ? "« prête (sans CI) » (relancer)" : "« prête » (fusionner)"}, sous-PR ordinaire #81 dans le même sujet`, () => {
    const d = monter({ sansCi });
    for (const t of [1, 2]) {
      const r = d.lancer(BOUCLE);
      const lignes = r.stdout.split("\n").filter((l) => /^\[(#80|#81|sujet\/lot)\]/.test(l) && !/^\[#8[01]\] \[#8[01]\]/.test(l));
      console.log(`--- ${sansCi ? "relancer" : "fusionner"}, tour ${t} (sortie ${r.status})\n${lignes.join("\n")}`);
    }
    const fusionnees = d.etat().pulls.filter((p) => p.merged_at).map((p) => p.number);
    const ecritesSur80 = d.journal().filter((e) => /^(issues|pulls)\/80\//.test(e.route)).map((e) => `${e.methode} ${e.route}`);
    console.log(`fusionnées : [${fusionnees.join(", ")}] ; écritures sur #80 : ${ecritesSur80.length} (${[...new Set(ecritesSur80)].join(", ")})`);
  });
}
