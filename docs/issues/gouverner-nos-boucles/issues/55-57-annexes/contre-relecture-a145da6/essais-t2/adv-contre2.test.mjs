// Une sous-PR à la fois par sujet (ticket 57 de gouverner-nos-boucles, décisions A-104 et A-142) : `traiter_sujets`
// de boucle.sh ne prend, à chaque tour, qu'une sous-PR en route par sujet (celle qui tient déjà le sujet, sinon la plus
// ancienne) ; les autres attendent leur tour, sans mise à jour, ni CI, ni renvoi. Dépôt jouet et faux `gh` du skill
// sujet : aucun réseau. Les deux cas qui demandent une PR de mise à jour sont dans sujet-fusionner.test.mjs.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { depotJouet, script: scriptDe } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url))
    ? "./depot-jouet.mjs"
    : "../../sujet/scripts/depot-jouet.mjs"
);

const BOUCLE = scriptDe("fusionner", "boucle.sh");
const VEILLE = scriptDe("fusionner", "veille.sh");
// La marque de passage d'un autre capitaine, sans epoch : datée par le `created_at` que le faux lui donne.
const marqueDe = (id) => `Passage du capitaine \`${id}\` depuis 12:00 UTC.\n<!-- capitaine:passage ${id} -->`;
const DATE_DU_FAUX = "2026-11-17T12:00:00Z";
// Écritures sur GitHub hors commentaires du verrou du passage (posé, rafraîchi, terminé ou retiré par chaque passage).
const passage = (e) => (/^issues\/\d+\/comments$|^issues\/comments\/\d+$/.test(e.route) && (e.methode === "DELETE" || (e.champs?.body ?? "").includes("<!-- capitaine:passage ")));
const ecritures = (d) => d.journal().filter((e) => !passage(e)).map((e) => `${e.methode} ${e.route}`);
// Tout ce qui est écrit sur la PR `n`, verrou compris.
const ecritesSur = (d, n) => d.journal().filter((e) => new RegExp(`^(issues|pulls)/${n}/`).test(e.route)).map((e) => `${e.methode} ${e.route}`);

// `sujets` : { <nom>: [numéros] } ; chaque sous-PR part de son sujet et ajoute `docs/pr-<n>.md` ; un sujet nommé dans
// `retard` reçoit ensuite un fichier : ses sous-PR sont en retard ; une sous-PR nommée dans `conflit` voit son sujet
// écrire son propre fichier : elle est en conflit avec lui, hors index. Checks : verts sur les sommets de départ (par
// sha) ; aucun sur un autre commit (le sommet d'une mise à jour du capitaine, dont `sujet.sh fusionner` sort alors
// en 8), jusqu'à `ci` ou `checksDe`.
function sousPrDeSujets(sujets, { retard = [], conflit = [] } = {}) {
  const d = depotJouet();
  const checks = {};
  const pulls = [];
  for (const [nom, numeros] of Object.entries(sujets)) {
    d.branche(`sujet/${nom}`, "origin/develop", { [`docs/${nom}.md`]: `${nom}\n` }, `feat(${nom}): lot (#1)`);
    for (const n of numeros) {
      checks[d.branche(`feat/pr-${n}`, `origin/sujet/${nom}`, { [`docs/pr-${n}.md`]: `${n}\n` })] = { qualite: "SUCCESS" };
      pulls.push({ number: n, title: `docs(${nom}): pr ${n}`, head: `feat/pr-${n}`, base: `sujet/${nom}`, labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n" });
    }
    const suite = Object.fromEntries(numeros.filter((n) => conflit.includes(n)).map((n) => [`docs/pr-${n}.md`, "sujet\n"]));
    if (retard.includes(nom)) suite[`docs/${nom}-suite.md`] = "suite\n";
    if (Object.keys(suite).length) d.branche(`sujet/${nom}`, `origin/sujet/${nom}`, suite, `feat(${nom}): suite (#2)`);
  }
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks, pulls });
  d.publierChaine();
  return d;
}
const teteDe = (d, n) => d.git("ls-remote", "origin", `refs/heads/feat/pr-${n}`).split("\t")[0];
// Numéros des sous-PR que la boucle a mises à jour et poussées dans ce tour, dans l'ordre du journal.
const poussees = (r) => [...r.stdout.matchAll(/^\[#(\d+)\] #\d+ en retard sur sujet\/\S+ : mise à jour poussée/gm)].map((m) => Number(m[1]));
const attend = (n, par, sujet = "lot") => new RegExp(`^\\[#${n}\\] attend son tour : #${par} passe d'abord dans sujet/${sujet}$`, "m");
// La ligne que la boucle écrit à chaque tour pour un sujet encore tenu après le passage de celle qui le tient.
const tenu = (sujet, n, raison) => new RegExp(`^\\[sujet/${sujet}\\] tenu par #${n} \\(${raison}\\)$`, "m");
const entree = (n, sujet = "lot") => new RegExp(`^\\[#${n}\\] FUSIONNÉE dans sujet/${sujet} $`, "m");
const fusionnees = (d) => d.etat().pulls.filter((p) => p.merged_at).map((p) => p.number).sort((a, b) => a - b);
// La CI des commits sans entrée à leur sha : `ci(d, "IN_PROGRESS")` la dit en cours, `ci(d, null)` la retire.
const ci = (d, etat) => {
  const { "*": _, ...checks } = d.etat().checks;
  d.github({ checks: etat === null ? checks : { ...checks, "*": { qualite: etat } } });
};
// La CI du sommet courant de ces sous-PR ; `sansCi` la retire (aucun check sur leur sommet).
const checksDe = (d, etat, ...numeros) => d.github({ checks: { ...d.etat().checks, ...Object.fromEntries(numeros.map((n) => [teteDe(d, n), { qualite: etat }])) } });
const sansCi = (d, ...numeros) => {
  const tetes = numeros.map((n) => teteDe(d, n));
  d.github({ checks: Object.fromEntries(Object.entries(d.etat().checks).filter(([sha]) => !tetes.includes(sha))) });
};
const changerPr = (d, n, champs) => d.github({ pulls: d.etat().pulls.map((p) => (p.number === n ? { ...p, ...champs } : p)) });
const tour = (d) => {
  const r = d.lancer(BOUCLE);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  return r;
};
import { mkdirSync, readFileSync } from "node:fs";
// ---------------------------------------------------------------------------------------------------------------
// Essais du second contre-relecteur de la PR 141 (tour 1). Chaque test AFFIRME le comportement observé du code.

// Un second capitaine : un autre clone de l'origine, un autre CAPITAINE_ID, le même faux GitHub.
function capitaineB(d, id = "capitaine-b") {
  const travail = join(d.racine, "travail-b");
  const r0 = spawnSync("git", ["clone", "-q", d.origine, travail], { env: d.env, encoding: "utf8" });
  assert.equal(r0.status, 0, r0.stderr);
  const env = { ...d.env, CAPITAINE_ID: id };
  return () => {
    const r = spawnSync("bash", [BOUCLE], { cwd: travail, env, encoding: "utf8" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    return r;
  };
}
const extrait = (r) => r.stdout.split("\n").filter((l) => /#8\d|sujet\/lot\]|FILE VIDE/.test(l)).join("\n");

test("ADV3 : deux capitaines, deux mémoires — B prend la plus ancienne pendant que A tient l'autre par sa mémoire : la plus ancienne reçoit deux mises à jour", () => {
  const d = sousPrDeSujets({ lot: [80, 81] }, { retard: ["lot"] });
  changerPr(d, 80, { labels: [] });
  // A, tour 1 : #81 seule étiquetée, mise à jour (sortie 8) ; sa mémoire : sujet/lot:81.
  let r = tour(d);
  console.log(`--- ADV3 A1\n${extrait(r)}`);
  assert.deepEqual(poussees(r), [81]);
  assert.equal(readFileSync(join(d.travail, ".git", "boucle-tenus"), "utf8").includes("sujet/lot:81"), true);
  // #80 étiquetée ; la CI de la mise à jour de #81 finit verte.
  changerPr(d, 80, { labels: ["à-fusionner"] });
  checksDe(d, "SUCCESS", 81);
  // B, son premier tour : aucune marque vivante, pas de mémoire, aucune « CI en cours » : #80, la plus ancienne.
  const b = capitaineB(d);
  r = b();
  console.log(`--- ADV3 B1\n${extrait(r)}`);
  assert.deepEqual(poussees(r), [80]);
  assert.match(r.stdout, attend(81, 80));
  ci(d, "IN_PROGRESS");
  // A, tour 2 : sa mémoire tient #81, qui entre ; #80, dont la CI de la mise à jour de B tourne, prend le sujet.
  r = tour(d);
  console.log(`--- ADV3 A2\n${extrait(r)}`);
  assert.match(r.stdout, entree(81));
  assert.match(r.stdout, tenu("lot", 80, "CI en cours"));
  // La CI de #80 finit verte : #80 est en retard sur le sujet où #81 vient d'entrer, seconde mise à jour.
  checksDe(d, "SUCCESS", 80);
  r = tour(d);
  console.log(`--- ADV3 A3\n${extrait(r)}`);
  assert.deepEqual(poussees(r), [80], "seconde mise à jour de #80");
});

test("ADV4 : la mémoire — une PR fermée y reste un tour sans rien tenir ; un fichier boucle-tenus qui est un dossier ne casse pas le tour", () => {
  const d = sousPrDeSujets({ lot: [80, 81, 82] }, { retard: ["lot"] });
  const tenus = join(d.travail, ".git", "boucle-tenus");
  // (a) La mémoire dit #82 ; #82 est fermée (hors de la file) : #80, la plus ancienne, prend le sujet dans le tour.
  writeFileSync(tenus, "\nsujet/lot:82\n\n");
  d.github({ pulls: d.etat().pulls.filter((p) => p.number !== 82) });
  let r = tour(d);
  console.log(`--- ADV4a\n${extrait(r)}\n${readFileSync(tenus, "utf8").replace(/\n/g, "⏎")}`);
  assert.deepEqual(poussees(r), [80]);
  assert.match(r.stdout, attend(81, 80));
  assert.match(readFileSync(tenus, "utf8"), /^sujet\/lot:80$/m);
  // (b) boucle-tenus devient un dossier : la lecture échoue en silence, l'écriture se plaint ; le tour sort en 0.
  const d2 = sousPrDeSujets({ lot: [80, 81] }, { retard: ["lot"] });
  mkdirSync(join(d2.travail, ".git", "boucle-tenus"));
  r = tour(d2);
  console.log(`--- ADV4b\n${extrait(r)}\nstderr: ${r.stderr.split("\n").filter((l) => /tenus/.test(l)).join(" | ")}`);
  assert.deepEqual(poussees(r), [80]);
  assert.match(r.stderr, /boucle-tenus: Is a directory/);
});
