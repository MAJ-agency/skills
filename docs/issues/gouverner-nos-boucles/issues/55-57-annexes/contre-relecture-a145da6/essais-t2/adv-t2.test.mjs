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
import { readFileSync } from "node:fs";
const SKILLS_SUJET = new URL("../../sujet/scripts/", import.meta.url).pathname;
// Le faux gh, dont la lecture brute (sans --jq) des commentaires de #<n> rend une fois un 502 tant que `marque` existe.
const pannePour = (d, n, marque) => writeFileSync(join(d.racine, "bin", "gh"), `#!/bin/sh\ncase " $* " in *issues/${n}/comments*) case " $* " in *" --jq "*) ;; *) if [ -f ${JSON.stringify(marque)} ]; then rm -f ${JSON.stringify(marque)}; echo "gh: Bad Gateway (HTTP 502)" >&2; exit 1; fi ;; esac ;; esac\nexec node ${JSON.stringify(join(SKILLS_SUJET, "faux-gh.mjs"))} "$@"\n`, { mode: 0o755 });
const lignes = (r) => r.stdout.split("\n").filter((l) => /#8\d|sujet\/lot\]|FILE VIDE/.test(l)).join("\n");

test("T2-ADV1 : sortie 128 de fusionner (git fatal) : « non éligible », pas de signal, le sujet est rendu et la suivante est prise dans le tour", () => {
  const d = sousPrDeSujets({ lot: [80, 81] }, { retard: ["lot"] });
  writeFileSync(join(d.racine, "bin", "git"), '#!/bin/sh\ncase " $* " in *" fetch "*feat/pr-80*) echo "fatal: unable to access \'https://x/\': Could not resolve host" >&2; exit 128 ;; esac\nPATH=${PATH#*:} exec git "$@"\n', { mode: 0o755 });
  const r = tour(d);
  console.log(`--- T2-ADV1\n${lignes(r)}`);
  assert.match(r.stdout, /^\[#80\] sous-PR non éligible \(sortie 128\)$/m);
  assert.doesNotMatch(r.stdout, /signal/);
  assert.doesNotMatch(r.stdout, /tenu par #80/);
  assert.deepEqual(poussees(r), [81]);
});

test("T2-ADV1r : sortie 128 de relancer (sous-PR sans CI) : le sujet est rendu, sans ligne de signal", () => {
  const d = sousPrDeSujets({ lot: [80, 81] }, { retard: ["lot"] });
  sansCi(d, 80);
  writeFileSync(join(d.racine, "bin", "git"), '#!/bin/sh\ncase " $* " in *" fetch "*feat/pr-80*) echo "fatal: unable to access \'https://x/\': Could not resolve host" >&2; exit 128 ;; esac\nPATH=${PATH#*:} exec git "$@"\n', { mode: 0o755 });
  const r = tour(d);
  console.log(`--- T2-ADV1r\n${lignes(r)}`);
  assert.doesNotMatch(r.stdout, /signal/);
  assert.doesNotMatch(r.stdout, /tenu par #80/);
  assert.deepEqual(poussees(r), [81]);
});

test("T2-ADV2 : une lecture en panne pendant la CI de celle que la boucle tient : personne n'est pris, la mémoire reste ; une seule mise à jour par sous-PR jusqu'au bout", () => {
  const d = sousPrDeSujets({ lot: [80, 81] }, { retard: ["lot"] });
  let r = tour(d);
  assert.deepEqual(poussees(r), [80], r.stdout);
  ci(d, "IN_PROGRESS");
  const marque = join(d.racine, "panne-81");
  writeFileSync(marque, "");
  pannePour(d, 81, marque);
  r = tour(d);
  console.log(`--- T2-ADV2 tour 2\n${lignes(r)}\nmémoire : ${readFileSync(join(d.travail, ".git", "boucle-tenus"), "utf8").replace(/\n/g, "⏎")}`);
  assert.deepEqual(poussees(r), []);
  assert.match(r.stdout, /^\[#81\] REPRISE au tour suivant : commentaires de #81 illisibles \(GitHub\), aucune sous-PR de sujet\/lot n'est prise à ce tour$/m);
  assert.match(readFileSync(join(d.travail, ".git", "boucle-tenus"), "utf8"), /^sujet\/lot:80$/m);
  assert.ok(!existsSync(marque));
  r = tour(d);
  console.log(`--- T2-ADV2 tour 3\n${lignes(r)}`);
  assert.match(r.stdout, tenu("lot", 80, "CI en cours"));
  assert.match(r.stdout, attend(81, 80));
  checksDe(d, "SUCCESS", 80);
  r = tour(d);
  console.log(`--- T2-ADV2 tour 4\n${lignes(r)}`);
  assert.match(r.stdout, entree(80));
  assert.deepEqual(poussees(r), [81]);
});

// La veille réelle sur la vraie boucle (même montage que le cas 12 du banc) : `sleep 7777` joue l'étape suivante.
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

test("T2-ADV6 : une panne de lecture au premier tour de la veille, puis une file qui ne change plus : aucune relance de toute la veille ; la veille suivante reprend le sujet à son premier tour", () => {
  const d = sousPrDeSujets({ lot: [80, 81] });
  const marque = join(d.racine, "panne-80");
  writeFileSync(marque, "");
  pannePour(d, 80, marque);
  let r = veilleReelle(d, [], 8);
  const relances = r.stdout.split("\n").filter((l) => /boucle relancée$/.test(l));
  console.log(`--- T2-ADV6 veille 1\n${r.stdout.split("\n").filter((l) => /VEILLE|REPRISE|sautée|FUSIONNÉE|FILE VIDE/.test(l)).join("\n")}`);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(relances, []);
  assert.deepEqual(fusionnees(d), []);
  writeFileSync(join(d.racine, "k"), "0");
  r = veilleReelle(d, [], 1);
  console.log(`--- T2-ADV6 veille 2\n${r.stdout.split("\n").filter((l) => /VEILLE|REPRISE|sautée|FUSIONNÉE|FILE VIDE|attend|tenu/.test(l)).join("\n")}`);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(fusionnees(d).includes(80), JSON.stringify(fusionnees(d)));
});

test("T2-ADV7 : une panne pendant que la boucle tient une sous-PR plus récente que la plus ancienne : la mémoire survit au tour suspendu, celle qu'elle tenait entre la première", () => {
  const d = sousPrDeSujets({ lot: [80, 81] }, { retard: ["lot"] });
  changerPr(d, 80, { labels: [] });
  let r = tour(d);
  assert.deepEqual(poussees(r), [81], r.stdout);
  changerPr(d, 80, { labels: ["à-fusionner"] });
  checksDe(d, "SUCCESS", 81);
  const marque = join(d.racine, "panne-80");
  writeFileSync(marque, "");
  pannePour(d, 80, marque);
  r = tour(d);
  console.log(`--- T2-ADV7 tour 2\n${lignes(r)}\nmémoire : ${readFileSync(join(d.travail, ".git", "boucle-tenus"), "utf8").replace(/\n/g, "⏎")}`);
  assert.deepEqual(poussees(r), []);
  assert.deepEqual(fusionnees(d), []);
  r = tour(d);
  console.log(`--- T2-ADV7 tour 3\n${lignes(r)}`);
  assert.match(r.stdout, entree(81));
  assert.deepEqual(poussees(r), [80]);
});
