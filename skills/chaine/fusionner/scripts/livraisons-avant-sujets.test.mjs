// L'ordre d'un tour de boucle.sh : les livraisons vers develop prêtes passent avant la mise à jour des sujets avec
// develop (`rafraichir_sujets`), qui vient en dernier et s'interrompt dès qu'une livraison devient prête. Cas vécu : une
// vingtaine de sujets rafraîchis en tête de chaque lancement de la boucle, chaque mise à jour rejouant le pre-push
// (7 à 15 minutes), et une livraison prête en tête de file a attendu plus de deux heures. Dépôt jouet et faux `gh` du
// skill sujet : aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { depotJouet, script: scriptDe } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url))
    ? "./depot-jouet.mjs"
    : "../../sujet/scripts/depot-jouet.mjs"
);

const BOUCLE = scriptDe("fusionner", "boucle.sh");
const pr = (number, head) => ({ number, title: `docs(demo): ${head.replace(/^[a-z]+\//, "")}`, head, base: "develop", labels: ["à-fusionner"] });

// Deux sujets sans sous-PR, `sujet/a` et `sujet/b`, en retard sur develop (les scripts de la chaîne y sont publiés
// après eux) ; `livraisons` : des PR vers develop prêtes dès le départ, une branche chacune.
function sujetsEnRetard(livraisons = []) {
  const d = depotJouet();
  for (const nom of ["a", "b"]) d.branche(`sujet/${nom}`, "origin/develop", { [`docs/${nom}.md`]: `${nom}\n` }, `feat(${nom}): lot (#1)`);
  d.git("switch", "-q", "--detach", "origin/develop");
  d.publierChaine();
  for (const n of [40, 41]) d.branche(`docs/livraison-${n}`, "origin/develop", { [`docs/livraison-${n}.md`]: `${n}\n` });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks: { "*": { qualite: "SUCCESS" } }, pulls: livraisons.map((n) => pr(n, `docs/livraison-${n}`)) });
  return d;
}
const aJour = (d, nom) => {
  d.git("fetch", "-q", "origin");
  return d.git("merge-base", "--is-ancestor", "origin/develop", `origin/sujet/${nom}`) === "";
};
// Position de la première ligne du journal qui commence par `debut`.
const ligne = (r, debut) => r.stdout.split("\n").findIndex((l) => l.startsWith(debut));

test("boucle.sh : une livraison prête passe avant la mise à jour des sujets avec develop, qui vient en dernier et reçoit la livraison", () => {
  const d = sujetsEnRetard([40]);
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const debut = ligne(r, "[#40] DÉBUT");
  assert.ok(debut >= 0, r.stdout);
  assert.match(r.stdout, /\[#40\] FUSIONNÉE/);
  for (const nom of ["a", "b"]) {
    const sujet = ligne(r, `[sujet/${nom}] `);
    assert.ok(sujet > debut, `sujet/${nom} mis à jour après la livraison, jamais avant :\n${r.stdout}`);
  }
  assert.ok(ligne(r, "FILE VIDE") > ligne(r, "[sujet/b] "), r.stdout);
  // Une seule mise à jour par sujet, faite sur le develop qui contient déjà la livraison.
  for (const nom of ["a", "b"]) {
    assert.ok(aJour(d, nom), `sujet/${nom} à jour avec develop`);
    assert.equal(d.git("rev-list", "--merges", "--count", "--first-parent", "origin/develop..origin/sujet/" + nom), "1", `sujet/${nom}`);
  }
  assert.doesNotMatch(r.stdout, /\[sujets\] #\d+ prête vers develop/);
});

test("boucle.sh : une livraison devenue prête pendant la mise à jour des sujets passe avant les sujets restants, qui sont repris ensuite", () => {
  const d = sujetsEnRetard();
  // Le pre-push du sujet `a` (la première mise à jour) rend #41 prête : la livraison arrive pendant le rafraîchissement.
  const hooks = join(d.racine, "hooks");
  mkdirSync(hooks, { recursive: true });
  const etat = join(d.env.FAUX_GH, "etat.json");
  const ajout = join(hooks, "ajout.cjs");
  writeFileSync(ajout, `const fs = require("fs"), f = process.argv[2], e = JSON.parse(fs.readFileSync(f, "utf8"));
if (!e.pulls.some((p) => p.number === 41)) { e.pulls.push(${JSON.stringify(pr(41, "docs/livraison-41"))}); fs.writeFileSync(f, JSON.stringify(e)); }
`);
  writeFileSync(join(hooks, "pre-push"), `#!/bin/sh\nlu=$(cat)\ncase "$lu" in *" refs/heads/sujet/a "*) ;; *) exit 0 ;; esac\nexec node ${JSON.stringify(ajout)} ${JSON.stringify(etat)}\n`);
  chmodSync(join(hooks, "pre-push"), 0o755);
  d.git("config", "core.hooksPath", hooks);

  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const a = ligne(r, "[sujet/a] ");
  const interruption = ligne(r, "[sujets] #41 prête vers develop : elle passe avant les sujets restants");
  const debut = ligne(r, "[#41] DÉBUT");
  const b = ligne(r, "[sujet/b] ");
  assert.ok(a >= 0 && a < interruption && interruption < debut && debut < b, `sujet/a, puis #41, puis sujet/b :\n${r.stdout}`);
  assert.match(r.stdout, /\[#41\] FUSIONNÉE/);
  assert.ok(ligne(r, "FILE VIDE") > b, r.stdout);
  // Les sujets restants sont repris quand la file vers develop est vide : les deux reçoivent la livraison.
  for (const nom of ["a", "b"]) assert.ok(aJour(d, nom), `sujet/${nom} à jour avec develop, #41 comprise :\n${r.stdout}`);
});

test("boucle.sh : un sujet déjà à jour avec develop n'est pas remis à jour, et la file n'est pas relue pour lui", () => {
  const d = sujetsEnRetard();
  let r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(aJour(d, "a") && aJour(d, "b"), r.stdout);
  // Second lancement, develop n'a pas bougé : aucune ligne de sujet, aucune relecture de la file entre deux sujets.
  r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.doesNotMatch(r.stdout, /^\[sujet\/[ab]\] |^\[sujets\] .*prête vers develop/m);
  assert.match(r.stdout, /FILE VIDE/);
});
