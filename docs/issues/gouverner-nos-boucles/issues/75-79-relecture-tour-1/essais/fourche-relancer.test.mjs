// Essai du relecteur des tickets 75 à 79 : une sous-PR de fourche passe-t-elle par un chemin du capitaine qui fetch,
// fusionne ou pousse la branche d'origin du même nom ? `passer.sh` et `sujet.sh fusionner` ont la garde du ticket 78 ;
// `sujet.sh relancer` (appelé par boucle.sh pour une sous-PR « prête (sans CI) » ou « prête (en conflit) ») ne l'a pas.
// Lancer : ARBRE=<racine d'un arbre de la PR B> node --test fourche-relancer.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { writeFileSync, readFileSync, existsSync, chmodSync } from "node:fs";
const ARBRE = process.env.ARBRE;
const { depotJouet, script: scriptDe } = await import(join(ARBRE, "skills/chaine/sujet/scripts/depot-jouet.mjs"));
const SUJET = scriptDe("sujet", "sujet.sh");
const BOUCLE = scriptDe("fusionner", "boucle.sh");
const REGIME8 = { cheminsSensibles: ["scripts/agent/**"], relecture: { depuis: "2026-11-17T09:00:00Z" } };
const REGIME7 = { cheminsSensibles: ["scripts/agent/**"] };

// Un `git` du PATH qui journalise chaque fetch et chaque push, puis joue le vrai git.
function espion(d) {
  const vrai = process.env.GIT_VRAI ?? "/usr/bin/git";
  const log = join(d.racine, "git-reseau.log");
  writeFileSync(join(d.racine, "bin/git"), `#!/bin/sh\ncase "$1" in fetch|push|ls-remote) echo "$*" >> ${JSON.stringify(log)} ;; esac\nexec ${vrai} "$@"\n`);
  chmodSync(join(d.racine, "bin/git"), 0o755);
  return () => (existsSync(log) ? readFileSync(log, "utf8").trim().split("\n") : []);
}

function monter(contrat) {
  const d = depotJouet();
  d.ecrire(".claude/chaine.json", `${JSON.stringify(contrat, null, 2)}\n`);
  d.commit("chore: contrat");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
  // `feat/a` existe sur origin ; la fourche « autre/jouet » ouvre sa PR depuis une branche du même nom, au même sommet
  // (une fourche copie les branches d'origin).
  const sha = d.branche("feat/a", "origin/sujet/lot", { "docs/a.md": "a\n" });
  // Le sujet avance : la sous-PR est en retard sur lui.
  d.branche("sujet/lot", "origin/sujet/lot", { "docs/lot2.md": "lot2\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ checks: {}, pulls: [{ number: 80, title: "docs(a): a", head: "feat/a", base: "sujet/lot", labels: ["à-fusionner"], fourche: "autre/jouet", commentaires: [] }] });
  return { d, sha };
}

for (const [nom, contrat] of [["régime 8", REGIME8], ["régime 7", REGIME7]]) {
  test(`${nom} : sujet.sh relancer d'une sous-PR de fourche fetch, fusionne et pousse la branche d'origin du même nom`, () => {
    const { d, sha } = monter(contrat);
    const reseau = espion(d);
    const r = d.lancer(SUJET, "relancer", "80");
    console.log(`# ${nom} relancer sortie ${r.status} : ${r.stdout.trim().split("\n").at(-1)}`);
    console.log(`# ${nom} git réseau : ${reseau().join(" | ")}`);
    d.git("fetch", "-q", "origin");
    const apres = d.git("rev-parse", "origin/feat/a");
    console.log(`# ${nom} origin/feat/a ${sha.slice(0, 8)} -> ${apres.slice(0, 8)}`);
    // Ce que la décision 1 du ticket 78 veut : sautée (7) avant tout fetch, la branche d'origin intacte.
    assert.equal(apres, sha, "la branche d'origin du même nom a été mise à jour et poussée à la place de la fourche");
  });
}

test("régime 8 : boucle.sh, de bout en bout, sur une sous-PR de fourche « prête (sans CI) »", () => {
  const { d, sha } = monter(REGIME8);
  d.publierChaine();
  const reseau = espion(d);
  const r = d.lancer(BOUCLE);
  console.log(r.stdout.split("\n").filter((l) => /#80|feat\/a/.test(l)).map((l) => `# boucle : ${l}`).join("\n"));
  console.log(`# boucle git réseau sur feat/a : ${reseau().filter((l) => /feat\/a/.test(l)).join(" | ")}`);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("rev-parse", "origin/feat/a"), sha, "boucle.sh a poussé sur la branche d'origin du même nom");
});
