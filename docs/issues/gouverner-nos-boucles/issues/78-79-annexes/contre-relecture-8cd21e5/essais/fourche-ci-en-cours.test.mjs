// Essai de la contre-relecture de la PR 152, tour 2 (sommet 8cd21e5) : une sous-PR de fourche dont la CI tourne tient-elle
// son sujet ? Et une fourche que la mémoire de la boucle (`boucle-tenus`) donne pour tenant au début du tour le rend-elle ?
// Même montage que le banc « boucle.sh : deux sous-PR d'un sujet, l'une de fourche » de `suites-du-lot-5.test.mjs`.
// À lancer depuis la racine d'un clone du plugin : `RACINE=$PWD node --test <chemin>/fourche-ci-en-cours.test.mjs`.
// Il ne juge rien : il écrit ce que la boucle fait (lignes, fusions, écritures) ; le rapport le compare à la décision.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const RACINE = process.env.RACINE ?? process.cwd();
const { depotJouet, script: scriptDe } = await import(pathToFileURL(join(RACINE, "skills/chaine/sujet/scripts/depot-jouet.mjs")).href);
const { ecrireDistribution } = await import(pathToFileURL(scriptDe("fusionner", "decision-relecteur.mjs")).href);
const { ecrireVerdict } = await import(pathToFileURL(scriptDe("fusionner", "verdict.mjs")).href);
const BOUCLE = scriptDe("fusionner", "boucle.sh");
const REGIME8 = { cheminsSensibles: ["scripts/agent/**"], relecture: { depuis: "2026-11-17T09:00:00Z" } };
const REGIME7 = { cheminsSensibles: ["scripts/agent/**"] };
const valide = (sha) => [
  ecrireDistribution({ tour: 1, sommet: sha, sessions: ["session_rel1"] }),
  `${ecrireVerdict({ sommet: sha, tour: 1, verdict: "validé", bloquants: 0, session: "session_rel1", securite: "lancée" })}\n\n- constats`,
];
const CALCULS = [
  ["fusionner", "decision-relecteur.mjs"],
  ["fusionner", "verdict.mjs"],
  ["fusionner", "double-relecture.mjs"],
  ["fusionner", "meme-contenu.sh"],
  ["revue-adversariale", "chemins-sensibles.mjs"],
];
const lignes = (r) => r.stdout.split("\n").filter((l) => /^\[#8[01]\]|^\[sujet\/lot\]/.test(l) && !/^\[#8[01]\] (\[|#8[01] |régime|revue)/.test(l));

function monter(contrat, ciFourche) {
  const d = depotJouet();
  d.ecrire(".claude/chaine.json", `${JSON.stringify(contrat, null, 2)}\n`);
  d.commit("chore: contrat");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
  const checks = {};
  const pulls = [];
  const shas = {};
  for (const n of [80, 81]) {
    const sha = d.branche(`feat/pr-${n}`, "origin/sujet/lot", { [`docs/pr-${n}.md`]: `${n}\n` });
    shas[n] = sha;
    checks[sha] = { qualite: n === 80 ? ciFourche : "SUCCESS" };
    pulls.push({ number: n, title: `docs(lot): pr ${n}`, head: n === 80 ? "fourche/a" : `feat/pr-${n}`, sha, base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n", ...(n === 80 ? { fourche: "autre/jouet" } : {}), commentaires: valide(sha) });
  }
  d.git("push", "-q", "origin", ":refs/heads/feat/pr-80");
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({ exiges: ["qualite"], checks, pulls });
  d.publierChaine();
  for (const [skill, nom] of CALCULS) d.ecrire(`scripts/chaine/${nom}`, readFileSync(scriptDe(skill, nom), "utf8"));
  d.commit("chore(chaine): calculs du régime 8");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  return { d, shas };
}

test("E1 — la fourche « CI en cours » : deux tours, sa CI finie au second (régimes 8 et 7)", () => {
  for (const contrat of [REGIME8, REGIME7]) {
    const { d, shas } = monter(contrat, "IN_PROGRESS");
    const r1 = d.lancer(BOUCLE);
    console.log(`--- ${JSON.stringify(contrat)}, tour 1 (CI de la fourche en cours), sortie ${r1.status}`);
    for (const l of lignes(r1)) console.log(l);
    console.log(`fusionnées : ${JSON.stringify(d.etat().pulls.filter((p) => p.merged_at).map((p) => p.number))}`);
    d.github({ checks: { ...d.etat().checks, [shas[80]]: { qualite: "SUCCESS" } } });
    const r2 = d.lancer(BOUCLE);
    console.log(`--- ${JSON.stringify(contrat)}, tour 2 (CI de la fourche verte), sortie ${r2.status}`);
    for (const l of lignes(r2)) console.log(l);
    console.log(`fusionnées : ${JSON.stringify(d.etat().pulls.filter((p) => p.merged_at).map((p) => p.number))}`);
    console.log(`écritures sur #80 : ${JSON.stringify(d.journal().filter((e) => /^(issues|pulls)\/80\//.test(e.route)).map((e) => e.route))}`);
    assert.equal(r1.status, 0);
    assert.equal(r2.status, 0);
  }
});

test("E2 — la fourche « prête » donnée pour tenante par la mémoire de la boucle (`boucle-tenus`, un tour d'avant la repose) (régime 7)", () => {
  const { d } = monter(REGIME7, "SUCCESS");
  writeFileSync(join(d.travail, ".git", "boucle-tenus"), "sujet/lot:80\n");
  const r = d.lancer(BOUCLE);
  console.log(`--- régime 7, mémoire sujet/lot:80, sortie ${r.status}`);
  for (const l of lignes(r)) console.log(l);
  console.log(`fusionnées : ${JSON.stringify(d.etat().pulls.filter((p) => p.merged_at).map((p) => p.number))}`);
  console.log(`boucle-tenus après : ${JSON.stringify(readFileSync(join(d.travail, ".git", "boucle-tenus"), "utf8"))}`);
  assert.equal(r.status, 0);
});
