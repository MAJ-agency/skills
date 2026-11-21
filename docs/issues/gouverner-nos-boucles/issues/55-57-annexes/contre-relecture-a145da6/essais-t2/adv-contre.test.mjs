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
const SKILLS_SUJET = new URL("../../sujet/scripts/", import.meta.url).pathname;
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
// ---------------------------------------------------------------------------------------------------------------
// Essais de la contre-relecture de la PR 141 (tour 1). Chaque test AFFIRME le comportement observé du code de la PR.

test("ADV1 : un git du passage qui meurt en 128 (erreur fatale de git, pas un signal) est dit « interrompu par un signal » et tient le sujet, tour après tour", () => {
  const d = sousPrDeSujets({ lot: [80, 81] }, { retard: ["lot"] });
  // `git fetch … feat/pr-80` meurt en 128, comme un git fatal (réseau coupé, référence introuvable).
  writeFileSync(join(d.racine, "bin", "git"), '#!/bin/sh\ncase " $* " in *" fetch "*feat/pr-80*) echo "fatal: unable to access \'https://x/\': Could not resolve host" >&2; exit 128 ;; esac\nPATH=${PATH#*:} exec git "$@"\n', { mode: 0o755 });
  for (let k = 1; k <= 2; k++) {
    const r = tour(d);
    console.log(`--- ADV1 tour ${k}\n${r.stdout.split("\n").filter((l) => /#80|#81|sujet\/lot\]/.test(l)).join("\n")}`);
    assert.match(r.stdout, /^\[#80\] ÉCHEC DU CAPITAINE : passage interrompu par un signal \(sortie 128\)/m);
    assert.match(r.stdout, attend(81, 80));
    assert.match(r.stdout, tenu("lot", 80, "sortie 128 de fusionner"));
    assert.deepEqual(poussees(r), []);
  }
});

test("ADV2 : une lecture des commentaires en panne sur une sous-PR qui ne tient rien lui donne le sujet devant celle que la boucle tenait et dont la CI tourne : deux mises à jour en vol", () => {
  const d = sousPrDeSujets({ lot: [80, 81] }, { retard: ["lot"] });
  // Tour 1 : #80, la plus ancienne, est mise à jour (sortie 8) et tient le sujet ; #81 attend.
  let r = tour(d);
  assert.deepEqual(poussees(r), [80], r.stdout);
  assert.match(r.stdout, attend(81, 80));
  // Tour 2 : la CI de la mise à jour de #80 tourne. Une seule lecture brute (lire_github, sans --jq) des commentaires
  // de #81 rend un 502 : celle de `verrou_d_un_autre`. Le passage, qui relit ensuite, lit bien.
  ci(d, "IN_PROGRESS");
  const marque = join(d.racine, "panne-81");
  writeFileSync(marque, "");
  writeFileSync(join(d.racine, "bin", "gh"), `#!/bin/sh\ncase " $* " in *issues/81/comments*) case " $* " in *" --jq "*) ;; *) if [ -f ${JSON.stringify(marque)} ]; then rm -f ${JSON.stringify(marque)}; echo "gh: Bad Gateway (HTTP 502)" >&2; exit 1; fi ;; esac ;; esac\nexec node ${JSON.stringify(join(SKILLS_SUJET, "faux-gh.mjs"))} "$@"\n`, { mode: 0o755 });
  r = tour(d);
  console.log(`--- ADV2 tour 2\n${r.stdout.split("\n").filter((l) => /#80|#81|sujet\/lot\]/.test(l)).join("\n")}`);
  assert.match(r.stdout, /^\[#81\] marque de passage d'un autre capitaine \(illisible\) : elle tient sujet\/lot$/m);
  assert.deepEqual(poussees(r), [81], "la sous-PR qui ne tenait rien est mise à jour pendant la CI de celle qui tenait");
  assert.match(r.stdout, attend(80, 81));
  assert.ok(!existsSync(marque));
});
