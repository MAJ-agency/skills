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

test("boucle.sh : une sous-PR à la fois par sujet — la plus ancienne tient le sujet tant qu'elle est en route, la suivante est prise dans le tour où elle entre ; trois sous-PR, trois mises à jour, une par sous-PR ; un autre sujet n'attend pas", () => {
  const d = sousPrDeSujets({ lot: [80, 81, 82], autre: [83] }, { retard: ["lot"] });
  const depart = { 81: teteDe(d, 81), 82: teteDe(d, 82) };
  const intactes = (...numeros) => numeros.forEach((n) => assert.equal(teteDe(d, n), depart[n], `#${n} n'a reçu aucun push`));
  // Tour 1 : #80, en retard, est mise à jour et poussée ; sa CI ne finit pas (sortie 8). #81 et #82 ne sont ni mises à
  // jour ni fusionnées. #83, d'un autre sujet, entre dans le même tour.
  let r = tour(d);
  assert.match(r.stdout, /\[#80\] MISE À JOUR avec sujet\/lot poussée, CI pas finie : repasse au tour suivant/);
  assert.deepEqual(poussees(r), [80], `une seule mise à jour poussée dans le tour : ${r.stdout}`);
  intactes(81, 82);
  assert.match(r.stdout, attend(81, 80));
  assert.match(r.stdout, attend(82, 80));
  assert.match(r.stdout, entree(83, "autre"));
  // La boucle nomme le sujet tenu, celle qui le tient et la raison ; un sujet rendu n'a pas de ligne.
  assert.match(r.stdout, tenu("lot", 80, "sortie 8 de fusionner"));
  assert.doesNotMatch(r.stdout, /\[sujet\/autre\] tenu par/);
  // Tour 2 : la CI de #80 tourne (« CI en cours », aucun geste de la boucle) : elle tient toujours le sujet.
  ci(d, "IN_PROGRESS");
  r = tour(d);
  assert.deepEqual(poussees(r), [], `aucune mise à jour pendant la CI de #80 : ${r.stdout}`);
  intactes(81, 82);
  assert.deepEqual(fusionnees(d), [83]);
  assert.match(r.stdout, attend(81, 80));
  assert.match(r.stdout, attend(82, 80));
  assert.match(r.stdout, tenu("lot", 80, "CI en cours"));
  // Tour 3 : la CI de #80 est verte : elle entre, le sujet est rendu, #81 est prise dans le même tour (mise à jour
  // poussée, sortie 8) et tient le sujet à son tour.
  ci(d, null);
  checksDe(d, "SUCCESS", 80);
  r = tour(d);
  assert.match(r.stdout, entree(80));
  assert.deepEqual(poussees(r), [81], r.stdout);
  assert.match(r.stdout, attend(82, 81));
  assert.match(r.stdout, tenu("lot", 81, "sortie 8 de fusionner"));
  intactes(82);
  // Tour 4 : #81 entre, #82 est mise à jour à son tour, et plus rien n'attend.
  checksDe(d, "SUCCESS", 81);
  r = tour(d);
  assert.match(r.stdout, entree(81));
  assert.deepEqual(poussees(r), [82], r.stdout);
  assert.doesNotMatch(r.stdout, /attend son tour/);
  assert.deepEqual(fusionnees(d), [80, 81, 83]);
  // Trois mises à jour en tout, une par sous-PR : une seule fusion du capitaine sur chaque branche.
  d.git("fetch", "-q", "origin");
  for (const n of [80, 81, 82]) assert.equal(d.git("rev-list", "--merges", "--count", `origin/feat/pr-${n}`), "1", `#${n}`);
  // Aucune étiquette touchée, aucun commentaire hors ceux du verrou du passage : chaque sous-PR a gardé `à-fusionner`.
  assert.ok(!ecritures(d).some((e) => /issues\/\d+\/(labels|comments)/.test(e)), ecritures(d).join());
});

test("boucle.sh : une sous-PR qui sort de la file ou n'est pas en route ne tient pas son sujet, la suivante est prise dans le même tour (renvoyée, CI rouge, bloquée, en brouillon, sans CI et déjà à jour)", () => {
  const d = sousPrDeSujets({ renvoi: [80, 81], rouge: [82, 83], bloquee: [84, 85], brouillon: [86, 87], "sans-ci": [88, 89] });
  changerPr(d, 80, { title: `docs(renvoi): ${"x".repeat(120)}` });
  checksDe(d, "FAILURE", 82);
  changerPr(d, 84, { labels: ["à-fusionner", "fusion-bloquée"] });
  changerPr(d, 86, { draft: true });
  // Sans CI et déjà à jour : `sujet.sh relancer` sort en 3 (« contient déjà »), sans rien pousser, à chaque tour.
  sansCi(d, 88);
  const r = tour(d);
  assert.match(r.stdout, /\[#80\] RENVOI : sujet du squash à \d+ caractères/);
  assert.match(r.stdout, /\[#88\] #88 contient déjà sujet\/sans-ci : aucun commit à pousser/);
  for (const [n, sujet] of [[81, "renvoi"], [83, "rouge"], [85, "bloquee"], [87, "brouillon"], [89, "sans-ci"]]) assert.match(r.stdout, entree(n, sujet), r.stdout);
  assert.doesNotMatch(r.stdout, /attend son tour|tenu par/);
  assert.deepEqual(fusionnees(d), [81, 83, 85, 87, 89]);
});

test("boucle.sh : un renvoi rend le sujet, la suivante est prise dans le même tour (conflit hors index vu par fusionner, sortie 3, et par relancer, sortie 2 ; tête gardée vue par relancer, sortie 4)", () => {
  const d = sousPrDeSujets({ code: [80, 81], "sans-ci": [82, 83], garde: [85] }, { conflit: [80, 82] });
  // #80 : verte sur son sommet, en conflit avec son sujet hors index (`fusionner`, sortie 3). #82 : la même sans CI,
  // « prête (en conflit) » (`relancer`, sortie 2). #84 : sans CI, sa tête est develop, branche gardée (`relancer`, 4).
  sansCi(d, 82);
  d.github({ pulls: [...d.etat().pulls, { number: 84, title: "docs(garde): pr 84", head: "develop", base: "sujet/garde", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n" }] });
  const r = tour(d);
  assert.match(r.stdout, /\[#80\] RENVOI : fusion refusée par GitHub \(conflit avec sujet\/code hors index générés/);
  assert.match(r.stdout, /\[#82\] RENVOI : conflit avec sujet\/sans-ci hors index générés : `docs\/pr-82\.md`/);
  assert.match(r.stdout, /\[#84\] RENVOI : #84 : tête develop, branche gardée/);
  // Les suivantes sont prises dans le tour : #81 et #83, en retard, sont mises à jour ; #85, à jour, entre.
  assert.deepEqual(poussees(r), [81, 83], r.stdout);
  assert.match(r.stdout, entree(85, "garde"));
  assert.doesNotMatch(r.stdout, /attend son tour/);
});

test("boucle.sh : une sous-PR en passage chez un autre capitaine tient son sujet (sortie 7, la date du verrou lue sur la dernière ligne et dite dans la ligne du sujet tenu) ; ce passage terminé, elle entre et la suivante est prise dans le même tour ; une sortie 7 sans verrou tient le sujet un tour, sans date", () => {
  const d = sousPrDeSujets({ course: [78, 79], lot: [80, 81] });
  ci(d, "SUCCESS");
  // Tour 1, `sujet/course` seul dans la file. #78 perd son étiquette pendant que le capitaine pose son verrou (le
  // premier commentaire posé du tour) : relue une fois le verrou pris, elle n'est plus éligible, sortie 7 sans verrou
  // d'un autre capitaine. Elle tient le sujet à ce tour, et la ligne du sujet tenu ne porte aucune date.
  changerPr(d, 80, { labels: [] });
  changerPr(d, 81, { labels: [] });
  d.github({ apresCommentaire: { labels: [] } });
  let r = tour(d);
  assert.match(r.stdout, /\[#78\] #78 : PR plus éligible une fois le verrou pris \(sans le label à-fusionner\) : sautée/);
  assert.match(r.stdout, attend(79, 78, "course"));
  assert.match(r.stdout, tenu("course", 78, "sortie 7 de fusionner"));
  // Tour 2 : #78 n'est plus dans la file, #79 entre. #80 porte la marque de passage d'un autre capitaine. Un outil du
  // passage (ici `git fetch`) écrit avant la ligne de sortie une ligne de la même forme : seule la dernière compte.
  changerPr(d, 80, { labels: ["à-fusionner"], commentaires: [marqueDe("capitaine-jordan")] });
  changerPr(d, 81, { labels: ["à-fusionner"] });
  writeFileSync(join(d.racine, "bin", "git"), '#!/bin/sh\n[ "$1" != fetch ] || echo "#80 en passage chez le capitaine un-outil depuis 2020-01-01T00:00:00Z : ligne d\'un outil" >&2\nPATH=${PATH#*:} exec git "$@"\n', { mode: 0o755 });
  r = tour(d);
  assert.match(r.stdout, entree(79, "course"));
  assert.match(r.stdout, /^\[#80\] #80 en passage chez le capitaine un-outil depuis 2020-01-01T00:00:00Z : ligne d'un outil$/m, "la ligne de l'outil est dans la sortie du passage");
  assert.match(r.stdout, /\[#80\] sous-PR non éligible \(fermée, en brouillon, ou en passage chez un autre capitaine\)/);
  assert.match(r.stdout, attend(81, 80));
  assert.match(r.stdout, tenu("lot", 80, `sortie 7 de fusionner, verrou du ${DATE_DU_FAUX}`));
  assert.deepEqual(fusionnees(d), [79]);
  assert.deepEqual(ecritesSur(d, 81), [], "rien d'écrit sur #81, pas même un verrou");
  // Tour 3 : l'autre capitaine a terminé son passage (marque de fin) sans faire entrer #80.
  changerPr(d, 80, { commentaires: [`${marqueDe("capitaine-jordan")}\n<!-- capitaine:fin -->`], supprimes: [], editions: {} });
  r = tour(d);
  assert.match(r.stdout, entree(80));
  assert.match(r.stdout, entree(81));
  assert.deepEqual(fusionnees(d), [79, 80, 81]);
});

test("boucle.sh : une reprise (sortie 5) et un échec du capitaine (sortie 11, de fusionner et de relancer) laissent le sujet tenu : la suivante attend son tour", () => {
  const d = sousPrDeSujets({ reprise: [80, 81], echec: [82, 83], "echec-r": [84, 85] }, { retard: ["echec-r"] });
  // #80 : GitHub illisible à la lecture de la PR par `fusionner` (5). #82 et #84 : le commentaire du verrou du passage
  // est refusé (11), à `fusionner` et à `relancer` (#84 est sans CI).
  sansCi(d, 84);
  d.github({ pannes: [{ route: "^pulls/80$" }], commentairesRefuses: "capitaine:passage" });
  const r = tour(d);
  assert.match(r.stdout, /\[#80\] REPRISE au tour suivant \(sous-PR ou sujet bougé/);
  assert.match(r.stdout, attend(81, 80, "reprise"));
  assert.match(r.stdout, tenu("reprise", 80, "sortie 5 de fusionner"));
  for (const [n, sujet, geste] of [[82, "echec", "fusionner"], [84, "echec-r", "relancer"]]) {
    assert.match(r.stdout, new RegExp(`^\\[#${n}\\] ÉCHEC DU CAPITAINE : sous-PR laissée dans la file`, "m"));
    assert.match(r.stdout, attend(n + 1, n, sujet));
    assert.match(r.stdout, tenu(sujet, n, `sortie 11 de ${geste}`));
  }
  assert.doesNotMatch(r.stdout, /RENVOI/);
  assert.deepEqual(poussees(r), []);
  assert.deepEqual(fusionnees(d), []);
});

test("boucle.sh : relancer laisse le sujet tenu quand il met à jour une sous-PR sans CI et en retard (sortie 0), la trouve en passage chez un autre capitaine (7) ou bougée depuis sa lecture (5) : la suivante attend son tour", () => {
  const d = sousPrDeSujets({ retard: [80, 81], verrou: [82, 83], bouge: [84, 85] }, { retard: ["retard", "verrou"] });
  sansCi(d, 80, 82);
  changerPr(d, 82, { commentaires: [marqueDe("capitaine-jordan")] });
  // #84 : le sommet que GitHub rend n'est plus celui de sa branche (elle a bougé depuis sa lecture), et il est sans CI.
  changerPr(d, 84, { sha: d.git("rev-parse", "origin/sujet/bouge") });
  const depart = Object.fromEntries([81, 82, 83, 84, 85].map((n) => [n, teteDe(d, n)]));
  const r = tour(d);
  assert.match(r.stdout, /\[#80\] #80 : sujet\/retard fusionné dans sa branche \([0-9a-f]+\), CI lancée/);
  assert.match(r.stdout, attend(81, 80, "retard"));
  assert.match(r.stdout, tenu("retard", 80, "sortie 0 de relancer"));
  assert.match(r.stdout, /\[#82\] en passage chez un autre capitaine : sautée \(aucun renvoi\)/);
  assert.match(r.stdout, attend(83, 82, "verrou"));
  assert.match(r.stdout, tenu("verrou", 82, `sortie 7 de relancer, verrou du ${DATE_DU_FAUX}`));
  assert.match(r.stdout, /\[#84\] REPRISE au tour suivant \(sous-PR bougée ou GitHub illisible\)/);
  assert.match(r.stdout, attend(85, 84, "bouge"));
  assert.match(r.stdout, tenu("bouge", 84, "sortie 5 de relancer"));
  for (const n of [81, 82, 83, 84, 85]) assert.equal(teteDe(d, n), depart[n], `#${n} n'a reçu aucun push`);
  assert.deepEqual(poussees(r), [80]);
  assert.deepEqual(fusionnees(d), []);
});

test("boucle.sh : worktree du capitaine pas propre (sortie 6 de fusionner et de relancer), le sujet reste tenu : la suivante attend son tour", () => {
  const d = sousPrDeSujets({ lot: [80, 81], "sans-ci": [82, 83] });
  sansCi(d, 82);
  d.ecrire("brouillon.txt", "en cours\n");
  const r = tour(d);
  for (const [n, sujet, geste] of [[80, "lot", "fusionner"], [82, "sans-ci", "relancer"]]) {
    assert.match(r.stdout, new RegExp(`^\\[#${n}\\] PAS PROPRE : worktree du capitaine à nettoyer, sous-PR laissée dans la file`, "m"));
    assert.match(r.stdout, attend(n + 1, n, sujet));
    assert.match(r.stdout, tenu(sujet, n, `sortie 6 de ${geste}`));
  }
  assert.deepEqual(fusionnees(d), []);
});

test("boucle.sh : un passage interrompu par un signal (sortie 143 de fusionner et de relancer) laisse le sujet tenu à ce tour : la suivante attend, rien n'est renvoyé", () => {
  const d = sousPrDeSujets({ lot: [80, 81], "sans-ci": [82, 83] }, { retard: ["lot", "sans-ci"] });
  sansCi(d, 82);
  // Le faux pnpm envoie TERM au passage qui le lance pour l'install d'une mise à jour (`sujet.sh`, son parent).
  writeFileSync(join(d.racine, "bin", "pnpm"), '#!/bin/sh\ncat > /dev/null\nif [ "$1" = install ]; then kill -TERM $PPID; sleep 1; fi\nexit 0\n');
  const depart = Object.fromEntries([80, 81, 82, 83].map((n) => [n, teteDe(d, n)]));
  const r = tour(d);
  for (const [n, sujet, geste] of [[80, "lot", "fusionner"], [82, "sans-ci", "relancer"]]) {
    assert.match(r.stdout, new RegExp(`^\\[#${n}\\] ÉCHEC DU CAPITAINE : passage interrompu par un signal \\(sortie 143\\), état de la sous-PR inconnu`, "m"), r.stdout);
    assert.match(r.stdout, attend(n + 1, n, sujet));
    assert.match(r.stdout, tenu(sujet, n, `sortie 143 de ${geste}`));
  }
  assert.doesNotMatch(r.stdout, /RENVOI|non éligible/);
  for (const n of [80, 81, 82, 83]) assert.equal(teteDe(d, n), depart[n], `#${n} n'a reçu aucun push`);
});

// Rien ne s'écrit après la ligne du `sortir` de sujet.sh : la boucle classe sa sortie sur son code et sur sa dernière
// ligne, et refus.sh prend cette dernière ligne pour motif. La ligne du sujet tenu est écrite par la boucle, après ce
// classement, jamais dans la sortie classée.
test("boucle.sh : la ligne du sujet tenu ne suit pas la ligne de sortie de sujet.sh dans ce que la boucle classe — le renvoi qui la suit dans le tour garde pour motif la dernière ligne de sujet.sh, et la sortie 3 de relancer reste classée sur la sienne ; après une sortie 8 sans CI apparue, le sujet est rendu au tour suivant", () => {
  const d = sousPrDeSujets({ tenu: [80, 81], renvoi: [82, 83], muette: [84, 85] }, { retard: ["tenu"] });
  changerPr(d, 82, { title: `docs(renvoi): ${"x".repeat(120)}` });
  sansCi(d, 84);
  const r = tour(d);
  // Dans l'ordre du journal : la sortie 8 de #80, la ligne du sujet tenu, puis le renvoi de #82 et la sortie 3 de #84.
  const lignes = r.stdout.split("\n");
  const rang = (re) => lignes.findIndex((l) => re.test(l));
  assert.equal(rang(/^\[sujet\/tenu\] tenu par #80 \(sortie 8 de fusionner\)$/), rang(/^\[#80\] MISE À JOUR avec sujet\/tenu poussée/) + 1, r.stdout);
  assert.ok(rang(/^\[sujet\/tenu\] tenu par #80/) < rang(/^\[#82\] RENVOI : /), r.stdout);
  // Le motif du renvoi de #82 est la dernière ligne de `sujet.sh fusionner 82`, mot pour mot, et rien d'autre.
  const renvoi = d.journal().find((e) => e.methode === "POST" && e.route === "issues/82/comments" && !passage(e));
  assert.match(renvoi.champs.body, /^\*\*Renvoyée par le capitaine de fusion\*\* : sujet du squash à \d+ caractères \(> 120\) : raccourcir le titre\.\n/);
  assert.doesNotMatch(renvoi.champs.body, /tenu par|attend son tour/);
  // #84, sans CI et déjà à jour : sortie 3 dont la dernière ligne n'est pas celle du pre-push, donc muette, le sujet
  // rendu (#85 entre) ; la ligne du sujet tenu, écrite plus haut dans le tour, n'y change rien.
  assert.match(r.stdout, entree(83, "renvoi"));
  assert.match(r.stdout, entree(85, "muette"));
  assert.deepEqual(ecritesSur(d, 84).filter((e) => !/comments/.test(e)), [], "ni étiquette ni renvoi sur #84");
  // Tour 2, rien n'a changé sur GitHub : la CI de la mise à jour de #80 n'est pas apparue. #80, que la boucle tenait,
  // se lit « prête (sans CI) » et déjà à jour : `relancer` sort en 3, le sujet est rendu, et #81 est prise à son tour.
  const suite = tour(d);
  assert.match(suite.stdout, /\[#80\] #80 contient déjà sujet\/tenu : aucun commit à pousser/);
  // (#84, sans CI, en retard depuis l'entrée de #85, est mise à jour par `relancer` dans ce même tour.)
  assert.deepEqual(poussees(suite), [81, 84], suite.stdout);
  assert.match(suite.stdout, tenu("tenu", 81, "sortie 8 de fusionner"));
  assert.doesNotMatch(suite.stdout, /attend son tour/);
});

// Qui tient le sujet le garde, avant tout ordre de numéro (A-142). Deux sujets dont un nom est le début de l'autre
// (`lot`, `lot-2`), et un numéro (#8) qui est le début d'un autre (#83) : les clés se comparent entières.
test("boucle.sh : qui tient le sujet le garde — une sous-PR de numéro plus petit, étiquetée pendant la CI de celle qui tient, attend son tour ; la CI verte, celle qui tenait entre d'abord, et la plus ancienne est prise dans le même tour ; une mise à jour par sous-PR", () => {
  const d = sousPrDeSujets({ "lot-2": [80, 81], lot: [8, 83] }, { retard: ["lot", "lot-2"] });
  const depart = { 8: teteDe(d, 8), 80: teteDe(d, 80) };
  const intactes = (...numeros) => numeros.forEach((n) => assert.equal(teteDe(d, n), depart[n], `#${n} n'a reçu aucun push`));
  // Tour 1 : #8 et #80 ne sont pas encore étiquetées. #81 et #83 sont mises à jour, leur CI ne finit pas (sortie 8).
  changerPr(d, 8, { labels: [] });
  changerPr(d, 80, { labels: [] });
  let r = tour(d);
  assert.deepEqual(poussees(r), [81, 83], r.stdout);
  assert.match(r.stdout, tenu("lot-2", 81, "sortie 8 de fusionner"));
  assert.match(r.stdout, tenu("lot", 83, "sortie 8 de fusionner"));
  // Tour 2 : la CI des deux mises à jour tourne ; #8 et #80 reçoivent leur étiquette. Chacune attend celle qui tient
  // son sujet, bien que son numéro soit plus petit ; la ligne de chaque sujet nomme la bonne sous-PR.
  ci(d, "IN_PROGRESS");
  changerPr(d, 8, { labels: ["à-fusionner"] });
  changerPr(d, 80, { labels: ["à-fusionner"] });
  r = tour(d);
  assert.deepEqual(poussees(r), [], `aucune mise à jour pendant la CI de celle qui tient : ${r.stdout}`);
  assert.match(r.stdout, attend(80, 81, "lot-2"));
  assert.match(r.stdout, attend(8, 83));
  assert.match(r.stdout, tenu("lot-2", 81, "CI en cours"));
  assert.match(r.stdout, tenu("lot", 83, "CI en cours"));
  assert.equal((r.stdout.match(/tenu par #/g) ?? []).length, 2, r.stdout);
  intactes(8, 80);
  // Tour 3. `sujet/lot` : les deux sous-PR sont « prête », #83 verte sur sa mise à jour : elle tenait le sujet, elle
  // entre d'abord, et #8, la plus ancienne, est prise dans le même tour (sa mise à jour, sortie 8).
  // `sujet/lot-2` : #81 est verte, et la CI de #80 tourne (un push de sa session) : #81, que la boucle tenait, entre
  // d'abord ; #80 tient ensuite le sujet par sa CI.
  // GitHub est d'abord illisible à la lecture de la file (`traiter_sujets` ne lit rien, puis PAUSE) : la boucle
  // n'oublie pas pour autant qui tenait.
  ci(d, null);
  checksDe(d, "SUCCESS", 81, 83);
  checksDe(d, "IN_PROGRESS", 80);
  d.github({ pannes: [{ route: "^pulls\\?state=open", fois: 12 }] });
  r = tour(d);
  assert.match(r.stdout, /^PAUSE \d\d:\d\d \(file\.sh, sortie 5\) : file illisible/m);
  // Selon l'endroit où GitHub redevient lisible, les gestes du tour sont dans cette boucle ou dans la suivante.
  d.github({ pannes: [] });
  r = { stdout: r.stdout + tour(d).stdout };
  assert.match(r.stdout, entree(83));
  assert.match(r.stdout, entree(81, "lot-2"));
  assert.deepEqual(poussees(r), [8], r.stdout);
  assert.ok(r.stdout.indexOf("[#83] FUSIONNÉE") < r.stdout.indexOf("[#8] #8 en retard"), "celle qui tenait passe avant la plus ancienne");
  assert.match(r.stdout, tenu("lot", 8, "sortie 8 de fusionner"));
  assert.match(r.stdout, tenu("lot-2", 80, "CI en cours"));
  assert.doesNotMatch(r.stdout, /attend son tour/);
  intactes(80);
  // Tour 4 : #8 entre ; #80, verte sur son sommet mais en retard, reçoit sa mise à jour.
  checksDe(d, "SUCCESS", 8, 80);
  r = tour(d);
  assert.match(r.stdout, entree(8));
  assert.deepEqual(poussees(r), [80], r.stdout);
  assert.deepEqual(fusionnees(d), [8, 81, 83]);
  // Une mise à jour du capitaine par sous-PR, jamais deux.
  d.git("fetch", "-q", "origin");
  for (const n of [8, 80, 81, 83]) assert.equal(d.git("rev-list", "--merges", "--count", `origin/feat/pr-${n}`), "1", `#${n}`);
});

// Deux capitaines sur la même file (A-142) : ce capitaine-ci ne prend aucune autre sous-PR d'un sujet dont une sous-PR
// est en passage chez un autre, que sa mise à jour attende sa CI ou que sa marque de passage vienne d'être posée.
test("boucle.sh : deux capitaines — une sous-PR en passage chez un autre capitaine tient son sujet devant une plus ancienne (marque de passage et CI en cours, marque seule, CI en cours seule, marque illisible), et devant celle que cette boucle tenait ; une marque expirée ne tient rien ; rien n'est écrit sur celle qui attend", () => {
  const d = sousPrDeSujets({ adv: [80, 81], verrou: [82, 83], doute: [84, 85], expire: [86, 87], ci: [88, 89] }, { retard: ["adv", "doute", "expire"] });
  // #81 : l'autre capitaine l'a mise à jour et attend sa CI, verrou posé. #83 : il vient de poser sa marque, rien n'est
  // poussé. #85 : une marque dont la date est illisible. #87 : la marque d'un capitaine mort, expirée. #89 : sa CI
  // tourne, sans marque (le passage de l'autre capitaine est sorti en 8, ou sa session vient de pousser).
  const marque = { commentaires: [marqueDe("capitaine-jordan")] };
  changerPr(d, 81, marque);
  checksDe(d, "IN_PROGRESS", 81, 89);
  changerPr(d, 83, marque);
  changerPr(d, 85, { commentaires: [{ body: marqueDe("capitaine-jordan"), created_at: "une date illisible" }] });
  changerPr(d, 87, { commentaires: [{ body: marqueDe("capitaine-mort"), created_at: "2020-01-01T00:00:00Z" }] });
  const depart = Object.fromEntries([80, 81, 82, 83, 84, 85, 87, 88, 89].map((n) => [n, teteDe(d, n)]));
  const marqueLue = (n, lue, sujet) => new RegExp(`^\\[#${n}\\] marque de passage d'un autre capitaine \\(${lue}\\) : elle tient sujet/${sujet}$`, "m");
  let r = tour(d);
  // `sujet/adv` : #81, marquée et « CI en cours », tient ; #80, plus ancienne, n'est pas mise à jour.
  assert.match(r.stdout, marqueLue(81, `capitaine-jordan ${DATE_DU_FAUX}`, "adv"));
  assert.match(r.stdout, attend(80, 81, "adv"));
  assert.match(r.stdout, tenu("adv", 81, "CI en cours"));
  // `sujet/verrou` : la marque de l'autre capitaine sur #83 est lue avant que #82 soit prise ; le passage de #83 sort en 7.
  assert.match(r.stdout, marqueLue(83, `capitaine-jordan ${DATE_DU_FAUX}`, "verrou"));
  assert.match(r.stdout, attend(82, 83, "verrou"));
  assert.match(r.stdout, tenu("verrou", 83, `sortie 7 de fusionner, verrou du ${DATE_DU_FAUX}`));
  // `sujet/doute` : marque illisible, dans le doute #85 tient ; son passage ne lit pas mieux le verrou (sortie 5).
  assert.match(r.stdout, marqueLue(85, "illisible", "doute"));
  assert.match(r.stdout, attend(84, 85, "doute"));
  assert.match(r.stdout, tenu("doute", 85, "sortie 5 de fusionner"));
  // `sujet/expire` : la marque expirée ne tient rien ; #86, la plus ancienne, prend le sujet (sa mise à jour).
  assert.doesNotMatch(r.stdout, /\[#87\] marque de passage/);
  assert.match(r.stdout, attend(87, 86, "expire"));
  // `sujet/ci` : sans marque, #89, « CI en cours », tient ; #88, à jour et verte, n'entre pas.
  assert.match(r.stdout, attend(88, 89, "ci"));
  assert.match(r.stdout, tenu("ci", 89, "CI en cours"));
  assert.deepEqual(poussees(r), [86], r.stdout);
  for (const n of [80, 81, 82, 83, 84, 85, 87, 88, 89]) assert.equal(teteDe(d, n), depart[n], `#${n} n'a reçu aucun push`);
  for (const n of [80, 82, 84, 87, 88]) assert.deepEqual(ecritesSur(d, n), [], `rien d'écrit sur #${n}, pas même un verrou`);
  assert.deepEqual(fusionnees(d), []);
  // Tour 2, deux sujets gardés dans la file. `sujet/verrou` : l'autre capitaine a terminé son passage sur #83 sans la
  // faire entrer : #83, que cette boucle tenait, entre d'abord, et #82, la plus ancienne, est prise dans le même tour
  // (en retard depuis l'entrée de #83 : sa mise à jour). `sujet/expire` : cette boucle tenait #86 (sa mise à jour, sans
  // CI apparue) ; l'autre capitaine pose sa marque sur #87 : c'est #87 qui tient, et #86 attend.
  for (const n of [80, 81, 84, 85, 88, 89]) changerPr(d, n, { labels: [] });
  changerPr(d, 83, { commentaires: [`${marqueDe("capitaine-jordan")}\n<!-- capitaine:fin -->`], supprimes: [], editions: {} });
  changerPr(d, 87, marque);
  r = tour(d);
  assert.match(r.stdout, entree(83, "verrou"));
  assert.deepEqual(poussees(r), [82], r.stdout);
  assert.ok(r.stdout.indexOf("[#83] FUSIONNÉE") < r.stdout.indexOf("[#82] #82 en retard"), r.stdout);
  assert.match(r.stdout, marqueLue(87, `capitaine-jordan ${DATE_DU_FAUX}`, "expire"));
  assert.match(r.stdout, attend(86, 87, "expire"));
  assert.match(r.stdout, tenu("expire", 87, `sortie 7 de fusionner, verrou du ${DATE_DU_FAUX}`));
  assert.deepEqual(fusionnees(d), [83]);
});

// La veille du plugin lance la vraie boucle sur le dépôt jouet ; le `sleep` du jouet joue, à chaque pause de la veille
// (argument 7777), l'étape suivante : du JavaScript qui retouche `etat`, l'état du faux GitHub.
function veilleReelle(d, etapes, sondes) {
  const etat = JSON.stringify(join(d.racine, "faux-gh", "etat.json"));
  etapes.forEach((corps, k) => {
    if (corps) writeFileSync(join(d.racine, `etape.${k}.mjs`), `import { readFileSync, writeFileSync } from "node:fs";\nconst etat = JSON.parse(readFileSync(${etat}, "utf8"));\n${corps}\nwriteFileSync(${etat}, JSON.stringify(etat));\n`);
  });
  const k = JSON.stringify(join(d.racine, "k"));
  const etape = JSON.stringify(join(d.racine, "etape."));
  writeFileSync(join(d.racine, "bin", "sleep"), `#!/bin/sh\nif [ "$1" = 7777 ]; then k=$(cat ${k} 2>/dev/null || echo 0); echo $((k + 1)) > ${k}; [ ! -f ${etape}$k.mjs ] || node ${etape}$k.mjs; fi\nexit 0\n`);
  return spawnSync("bash", [VEILLE, "--pause", "7777", "--sondes", String(sondes)], { cwd: d.travail, env: d.env, encoding: "utf8" });
}

test("veille.sh et boucle.sh : le verrou d'un capitaine mort tient un sujet ; il expire sans que rien ne change dans la file, et la veille relance la boucle une fois : les sous-PR entrent ; une CI qui ne finit pas tient un sujet jusqu'au geste du capitaine, qui fait relancer la boucle", () => {
  const d = sousPrDeSujets({ lot: [80, 81], ci: [82, 83], seule: [84] });
  ci(d, "SUCCESS");
  // La marque du capitaine mort (sur #80, et sur #84, seule dans son sujet) date de plus de 95 minutes à l'horloge de
  // ce poste, celle de la veille ; le faux GitHub, dont les dates sont figées au 2026-11-17, la compte vivante tant que
  // l'étape ne l'a pas vieillie. La CI de #82 tourne et ne finit pas.
  const pose = new Date(Date.now() - 96 * 60_000).toISOString().replace(/\.\d+Z$/, "Z");
  for (const n of [80, 84]) changerPr(d, n, { commentaires: [{ body: marqueDe("capitaine-mort"), created_at: pose }] });
  checksDe(d, "IN_PROGRESS", 82);
  // Avant la sonde 2, GitHub compte les marques expirées à son tour (datées de 2020) : un passage les prendrait, la
  // file ne change pas. Avant la sonde 3, le capitaine retire `à-fusionner` de #82, dont la CI ne finit pas.
  const expire = 'for (const n of [80, 84]) etat.pulls.find((p) => p.number === n).commentaires[0].created_at = "2020-01-01T00:00:00Z";';
  const geste = "etat.pulls.find((p) => p.number === 82).labels = [];";
  const r = veilleReelle(d, [null, expire, geste], 5);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  const relances = r.stdout.split("\n").filter((l) => /boucle relancée$/.test(l)).map((l) => l.replace(/^VEILLE \d\d:\d\d : /, ""));
  assert.deepEqual(relances, [
    "file à traiter (81 attend #80 (sujet/lot : prête),83 attend #82 (sujet/ci : CI en cours)), boucle relancée",
    "verrou d'un autre capitaine expiré (sa date a plus de 95 min), boucle relancée",
    "file à traiter (83 attend #82 (hors de la file)), boucle relancée",
  ], r.stdout);
  // Avant l'expiration, chaque tour laisse #80 et #84 tenir leur sujet (sortie 7) ; à la relance, elles entrent, et #81
  // avec #80. Tant que la CI de #82 tourne, la boucle le dit à chaque tour ; #82 sortie de la file, #83 entre.
  for (const [sujet, n] of [["lot", 80], ["seule", 84]])
    assert.equal((r.stdout.match(new RegExp(`^\\[sujet/${sujet}\\] tenu par #${n} \\(sortie 7 de fusionner, verrou du ${pose}\\)$`, "gm")) ?? []).length, 2, r.stdout);
  assert.equal((r.stdout.match(/^\[sujet\/ci\] tenu par #82 \(CI en cours\)$/gm) ?? []).length, 3, r.stdout);
  assert.deepEqual(fusionnees(d), [80, 81, 83, 84]);
});

// ── Contre-relecture de la PR 141, tour 1 (décision A-161) ─────────────────────────────────────────────────────────
// Une sortie 128 est une erreur fatale de git (réseau coupé, référence introuvable, index verrouillé), pas un signal :
// elle suit la table d'une erreur et rend le sujet. Seules les sorties 129 et plus tiennent le sujet comme un signal.
const gitQuiMeurt = (d, code) =>
  writeFileSync(join(d.racine, "bin", "git"), `#!/bin/sh\ncase " $* " in *" fetch "*feat/pr-80*) echo "fatal: unable to access 'https://x/': Could not resolve host" >&2; exit ${code} ;; esac\nPATH=\${PATH#*:} exec git "$@"\n`, { mode: 0o755 });

test("boucle.sh : une sortie 128 de fusionner (erreur fatale de git) n'est pas un signal : le sujet est rendu, la suivante est prise dans le tour", () => {
  const d = sousPrDeSujets({ lot: [80, 81] }, { retard: ["lot"] });
  gitQuiMeurt(d, 128);
  const r = tour(d);
  assert.match(r.stdout, /^\[#80\] sous-PR non éligible \(sortie 128\)$/m, r.stdout);
  assert.doesNotMatch(r.stdout, /signal/);
  assert.deepEqual(poussees(r), [81], r.stdout);
  assert.match(r.stdout, tenu("lot", 81, "sortie 8 de fusionner"));
  assert.doesNotMatch(r.stdout, /tenu par #80|attend son tour : #80/);
});

test("boucle.sh : une sortie 129 de fusionner (un signal) laisse le sujet tenu à ce tour : la suivante attend", () => {
  const d = sousPrDeSujets({ lot: [80, 81] }, { retard: ["lot"] });
  gitQuiMeurt(d, 129);
  const r = tour(d);
  assert.match(r.stdout, /^\[#80\] ÉCHEC DU CAPITAINE : passage interrompu par un signal \(sortie 129\)/m, r.stdout);
  assert.match(r.stdout, attend(81, 80));
  assert.match(r.stdout, tenu("lot", 80, "sortie 129 de fusionner"));
  assert.deepEqual(poussees(r), []);
});

// A-161 (2) : une lecture GitHub en panne ne donne jamais le sujet. L'essai ADV2 du contre-relecteur : la boucle tient
// #80 (sa CI tourne) ; un 502 sur la lecture des commentaires de #81 ne la lui fait pas prendre, ni aucune autre.
test("boucle.sh : une lecture des commentaires en panne ne donne pas le sujet : à ce tour, aucune sous-PR de ce sujet n'est prise, et celle que la boucle tenait le garde au tour suivant", () => {
  const d = sousPrDeSujets({ lot: [80, 81] }, { retard: ["lot"] });
  let r = tour(d);
  assert.deepEqual(poussees(r), [80], r.stdout);
  ci(d, "IN_PROGRESS");
  const marque = join(d.racine, "panne-81");
  writeFileSync(marque, "");
  // Posé dans un projet, faux-gh.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
  const fauxGh = new URL(existsSync(new URL("./faux-gh.mjs", import.meta.url)) ? "./faux-gh.mjs" : "../../sujet/scripts/faux-gh.mjs", import.meta.url).pathname;
  writeFileSync(join(d.racine, "bin", "gh"), `#!/bin/sh\ncase " $* " in *issues/81/comments*) case " $* " in *" --jq "*) ;; *) if [ -f ${JSON.stringify(marque)} ]; then rm -f ${JSON.stringify(marque)}; echo "gh: Bad Gateway (HTTP 502)" >&2; exit 1; fi ;; esac ;; esac\nexec node ${JSON.stringify(fauxGh)} "$@"\n`, { mode: 0o755 });
  r = tour(d);
  assert.ok(!existsSync(marque), "la lecture en panne a bien eu lieu");
  assert.match(r.stdout, /^\[#81\] REPRISE au tour suivant : commentaires de #81 illisibles \(GitHub\), aucune sous-PR de sujet\/lot n'est prise à ce tour$/m, r.stdout);
  assert.doesNotMatch(r.stdout, /marque de passage d'un autre capitaine/);
  assert.deepEqual(poussees(r), [], r.stdout);
  assert.doesNotMatch(r.stdout, /attend son tour : #81/);
  // Le tour suivant relit : la mémoire a gardé #80, qui tient toujours (« CI en cours »), #81 attend.
  r = tour(d);
  assert.match(r.stdout, attend(81, 80), r.stdout);
  assert.match(r.stdout, tenu("lot", 80, "CI en cours"));
  assert.deepEqual(poussees(r), []);
});

// Contre-relecture, constat 8 (mutation L3) : sans mémoire ni marque, deux sous-PR « CI en cours » : la plus ancienne tient.
test("boucle.sh : deux sous-PR « CI en cours » dans un sujet, sans mémoire ni marque : la plus ancienne tient le sujet", () => {
  const d = sousPrDeSujets({ lot: [80, 81] });
  checksDe(d, "IN_PROGRESS", 80, 81);
  const r = tour(d);
  assert.match(r.stdout, attend(81, 80), r.stdout);
  assert.match(r.stdout, tenu("lot", 80, "CI en cours"));
  assert.doesNotMatch(r.stdout, /tenu par #81/);
});
