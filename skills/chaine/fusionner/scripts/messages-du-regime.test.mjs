// Banc du lot 5c (relecture indépendante) : les renvois et les messages suivent le régime de la PR (A-97). En régime 8,
// `renvoyer.sh` dit de redemander la relecture (`à-relire`), jamais de remettre `à-fusionner` (A-91, A-93) ; `sujet.sh
// demarrer` dit comment demander la relecture (son refus qui ne conseille plus `sujet.sh rafraichir` : sujet.test.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const { depotJouet, script: scriptDe } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs"
);

const RENVOYER = scriptDe("fusionner", "renvoyer.sh");
const SUJET = scriptDe("sujet", "sujet.sh");
const HUIT = { cheminsSensibles: [], relecture: { depuis: "2026-11-17T09:00:00Z" } };
const contrat = (d, c) => {
  d.ecrire(".claude/chaine.json", `${JSON.stringify(c)}\n`);
  d.commit("chore: contrat");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
};
const commentaire = (d) => d.etat().pulls[0].commentaires.at(-1);
// Un espion sur `gh` : chaque appel, ses arguments, dans un journal ; rend la lecture de ce journal.
const espionner = (d) => {
  const bin = join(d.racine, "bin");
  const faux = readFileSync(join(bin, "gh"), "utf8").split("\n")[1];
  const journal = join(d.racine, "gh.log");
  writeFileSync(join(bin, "gh"), `#!/bin/sh\necho "$*" >> ${JSON.stringify(journal)}\n${faux}\n`);
  return () => (existsSync(journal) ? readFileSync(journal, "utf8").split("\n").filter(Boolean) : []);
};

test("renvoyer.sh : en régime 8, redemander la relecture (`à-relire`) sans retirer `fusion-bloquée`, jamais `à-fusionner` ; en régime 7, comme avant", () => {
  for (const [c, plus, attendu, absent] of [
    [HUIT, {}, /Corriger, puis redemander la relecture : le commentaire `À relire — sommet <sha> — Session: <la tienne> — Conducteur: <le tien>` et l'étiquette `à-relire`, sans retirer `fusion-bloquée` ; jamais `à-fusionner`/, /remettre `à-fusionner`/],
    [HUIT, { created_at: "2026-11-17T08:00:00Z" }, /Corriger, puis retirer `fusion-bloquée` et remettre `à-fusionner`/, /à-relire/],
    [{ cheminsSensibles: [] }, {}, /Corriger, puis retirer `fusion-bloquée` et remettre `à-fusionner`/, /à-relire/],
  ]) {
    const d = depotJouet();
    contrat(d, c);
    d.branche("feat/a", "origin/develop", { "docs/a.md": "a\n" });
    d.github({ pulls: [{ number: 30, title: "docs(a): a", head: "feat/a", base: "develop", labels: ["à-fusionner"], ...plus }] });
    const appels = espionner(d);
    const r = d.lancer(RENVOYER, "30", "aucun tour de relecture validé");
    assert.equal(r.status, 0, r.stdout + r.stderr);
    // Sans la clé nulle part (A-186) : aucune lecture de la PR de plus que sur main (la seule est celle de `head.ref`, à la fin).
    const lectures = appels().filter((l) => /\/pulls\/30$/.test(l)).length;
    assert.equal(lectures, Object.hasOwn(c, "relecture") ? 1 : 0, `lectures de la PR pour son régime : ${JSON.stringify(plus)}`);
    assert.match(commentaire(d), attendu, JSON.stringify(plus));
    assert.doesNotMatch(commentaire(d), absent);
    assert.deepEqual(d.etat().pulls[0].labels, ["fusion-bloquée"]);
  }
});

test("renvoyer.sh : une réception de develop en deux fusions, en régime 8, fait ouvrir une nouvelle PR qui demande sa relecture", () => {
  const d = depotJouet();
  contrat(d, HUIT);
  d.branche("maj/lot", "origin/develop", { "docs/a.md": "a\n" });
  d.github({ pulls: [{ number: 81, title: "chore(sujet): met lot à jour avec develop", head: "maj/lot", base: "develop", labels: ["à-fusionner"] }] });
  const r = d.lancer(RENVOYER, "81", "#81, PR de mise à jour : une seule fusion de develop, jamais une seconde fusion");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(commentaire(d), /la nouvelle PR demande sa relecture \(`à-relire`, avec son commentaire `À relire — …`\), jamais `à-fusionner`/);
});

// Un sujet `demo`, sa spec (qui le déclare) et un ticket, sur develop et sur le sujet ; le contrat de develop.
function sujetDemo(c) {
  const d = depotJouet();
  d.ecrire("docs/features/demo/all/SPEC_ALL_DEM-1-demo.spec.md", "# SPEC_ALL_DEM-1\n\nSujet: sujet/demo\n");
  d.ecrire("docs/features/demo/all/issues/SPEC_ALL_DEM-1-demo.01.issue.md", "# .01\n\nStatus: ready-for-agent\nBlocked by: —\n");
  d.ecrire(".claude/chaine.json", `${JSON.stringify(c)}\n`);
  d.commit("docs: specs");
  d.git("push", "-q", "origin", "HEAD:develop", "HEAD:refs/heads/sujet/demo");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "-c", "feat/spec-all-dem-1-01-travail", "origin/develop");
  return d;
}

test("sujet.sh demarrer : en régime 8, demander la relecture, jamais `à-fusionner` ; en régime 7, l'étiquette dès le push", () => {
  const huit = sujetDemo(HUIT);
  const r = huit.lancer(SUJET, "demarrer", "SPEC_ALL_DEM-1.01");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /régime 8 : relecture indépendante ; .* étiquette à-relire\),\njamais à-fusionner : le Relecteur la pose sur un verdict validé/);
  assert.doesNotMatch(r.stdout, /label à-fusionner dès le push/);
  const sept = sujetDemo({ cheminsSensibles: [] });
  const r2 = sept.lancer(SUJET, "demarrer", "SPEC_ALL_DEM-1.01");
  assert.equal(r2.status, 0, r2.stdout + r2.stderr);
  assert.match(r2.stdout, /label à-fusionner dès le push/);
});
