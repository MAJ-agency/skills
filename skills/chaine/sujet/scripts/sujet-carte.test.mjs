// `sujet.sh carte <nom>` sur le dépôt jouet : seul geste d'écriture d'une session sur
// `sujet/<nom>`, réservé aux mises à jour de la carte du chantier (un seul `*.map.md` par commit).
import { test } from "node:test";
import assert from "node:assert/strict";
import { chmodSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { depotJouet, script } from "./depot-jouet.mjs";

const SCRIPT = script("sujet", "sujet.sh");
const CARTE = "docs/features/demo/DEM-1-demo.map.md";
const AUTRE = "docs/features/autre/AUT-1-autre.map.md";
const carte = (sujet, suite = "") =>
  `# DEM-1 — Carte\n\nSujet: sujet/${sujet}\n\n## Fiche\n\nPhase: 3${suite}\n`;

// Le faux `pnpm` du jouet ne formate rien : `formateur` le remplace par un « Prettier » de jouet,
// identité (tout est formaté) ou qui retire les espaces de fin de ligne.
function formateur(d, corps = "cat") {
  const fichier = join(d.racine, "bin", "pnpm");
  writeFileSync(fichier, `#!/bin/sh\n${corps}\n`);
  chmodSync(fichier, 0o755);
}

// Sujet `demo` ouvert avec sa carte ; la branche de travail part de son sommet.
function depot() {
  const d = depotJouet();
  formateur(d);
  d.ecrire(CARTE, carte("demo"));
  d.ecrire(AUTRE, carte("autre"));
  d.ecrire("src/code.ts", "export {};\n");
  d.commit("docs: cartes");
  d.git("push", "-q", "origin", "HEAD:develop", "HEAD:refs/heads/sujet/demo");
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "-c", "docs/demo-carte", "origin/sujet/demo");
  return d;
}
const carteSur = (d) => d.git("show", "origin/sujet/demo:" + CARTE);
const lancer = (d, ...args) => d.lancer(SCRIPT, "carte", ...args);

test("pousse sur le sujet les commits de carte de la branche courante", () => {
  const d = depot();
  d.ecrire(CARTE, carte("demo", "\nSessions: s1"));
  d.commit("docs(demo): phase 3");
  d.ecrire(CARTE, carte("demo", "\nSessions: s1, s2"));
  d.commit("docs(demo): sessions");
  const r = lancer(d, "demo");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  d.git("fetch", "-q", "origin");
  assert.match(carteSur(d), /Sessions: s1, s2/);
  assert.equal(d.git("rev-parse", "origin/sujet/demo"), d.git("rev-parse", "HEAD"));
});

test("sans commit en avance, il n'y a rien à pousser", () => {
  const d = depot();
  const r = lancer(d, "demo");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /rien à pousser/);
});

test("refuse un commit qui touche un autre fichier que la carte", () => {
  const d = depot();
  d.ecrire(CARTE, carte("demo", "\nSessions: s1"));
  d.ecrire("src/code.ts", "export const x = 1;\n");
  d.commit("docs(demo): carte et code");
  const r = lancer(d, "demo");
  assert.equal(r.status, 9, r.stdout + r.stderr);
  assert.match(r.stdout, /REFUS/);
  d.git("fetch", "-q", "origin");
  assert.doesNotMatch(carteSur(d), /Sessions/);
});

test("refuse un commit qui ne touche aucune carte (un fichier de code seul)", () => {
  const d = depot();
  d.ecrire("src/code.ts", "export const x = 1;\n");
  d.commit("feat: code");
  assert.equal(lancer(d, "demo").status, 9);
});

test("refuse la carte d'un autre sujet", () => {
  const d = depot();
  d.ecrire(AUTRE, carte("autre", "\nSessions: s1"));
  d.commit("docs(autre): sessions");
  const r = lancer(d, "demo");
  assert.equal(r.status, 9, r.stdout + r.stderr);
  assert.match(r.stdout, /sujet\/demo/);
});

test("refuse un commit de fusion", () => {
  const d = depot();
  d.git("switch", "-q", "-c", "annexe", "origin/sujet/demo");
  d.ecrire(AUTRE, carte("autre", "\nIncidents: i1"));
  d.commit("docs: annexe");
  d.git("switch", "-q", "docs/demo-carte");
  d.ecrire(CARTE, carte("demo", "\nSessions: s1"));
  d.commit("docs: sessions");
  d.git("merge", "-q", "--no-ff", "-m", "merge", "annexe");
  assert.equal(lancer(d, "demo").status, 9);
});

test("refuse un fichier que Prettier changerait", () => {
  const d = depot();
  formateur(d, "sed 's/[ ]*$//'");
  d.ecrire(CARTE, carte("demo", "\nSessions: s1   "));
  d.commit("docs(demo): sessions");
  const r = lancer(d, "demo");
  assert.equal(r.status, 9, r.stdout + r.stderr);
  assert.match(r.stdout, /Prettier/);
});

test("le sujet a avancé, la branche est en retard : avance rapide, puis rien à pousser", () => {
  const d = depot();
  d.git("switch", "-q", "-c", "autre-session", "origin/sujet/demo");
  d.ecrire(CARTE, carte("demo", "\nCoûts: 3"));
  d.commit("docs(demo): coûts");
  d.git("push", "-q", "origin", "HEAD:refs/heads/sujet/demo");
  d.git("switch", "-q", "docs/demo-carte");
  const r = lancer(d, "demo");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(d.lire(CARTE), /Coûts: 3/, "la branche a rattrapé le sujet");
});

test("refuse un historique divergent : le sujet a avancé et la branche a ses propres commits", () => {
  const d = depot();
  d.git("switch", "-q", "-c", "autre-session", "origin/sujet/demo");
  d.ecrire(CARTE, carte("demo", "\nCoûts: 3"));
  d.commit("docs(demo): coûts");
  d.git("push", "-q", "origin", "HEAD:refs/heads/sujet/demo");
  d.git("switch", "-q", "docs/demo-carte");
  d.ecrire(CARTE, carte("demo", "\nSessions: s1"));
  d.commit("docs(demo): sessions");
  const r = lancer(d, "demo");
  assert.equal(r.status, 9, r.stdout + r.stderr);
  assert.match(r.stdout, /diverge/);
  d.git("fetch", "-q", "origin");
  assert.doesNotMatch(carteSur(d), /Sessions/);
});

test("refuse de forcer le push", () => {
  const d = depot();
  d.ecrire(CARTE, carte("demo", "\nSessions: s1"));
  d.commit("docs(demo): sessions");
  for (const option of ["--force", "-f", "--force-with-lease", "+HEAD"]) {
    const r = lancer(d, "demo", option);
    assert.equal(r.status, 9, option + r.stdout + r.stderr);
  }
  d.git("fetch", "-q", "origin");
  assert.doesNotMatch(carteSur(d), /Sessions/);
});

// Chemins par lesquels un commit « de carte » pousserait autre chose qu'une mise à jour de la carte.
const refusSansRienPousser = (d, message, motif = /REFUS/) => {
  const avant = d.git("rev-parse", "origin/sujet/demo");
  const r = lancer(d, "demo");
  assert.equal(r.status, 9, message + r.stdout + r.stderr);
  assert.match(r.stdout, /REFUS/, message);
  assert.match(r.stdout, motif, message);
  d.git("fetch", "-q", "origin");
  assert.equal(d.git("rev-parse", "origin/sujet/demo"), avant, message);
};

test("plusieurs commits : un seul qui touche du code, et rien n'est poussé", () => {
  const d = depot();
  d.ecrire(CARTE, carte("demo", "\nSessions: s1"));
  d.commit("docs(demo): sessions");
  d.ecrire("src/code.ts", "export const x = 1;\n");
  d.commit("feat: code");
  d.ecrire(CARTE, carte("demo", "\nSessions: s1, s2"));
  d.commit("docs(demo): sessions encore");
  refusSansRienPousser(d, "code au milieu", /autre chose/);
  assert.doesNotMatch(carteSur(d), /Sessions/);
});

test("refuse une carte créée sur le sujet : seule la carte existante se met à jour", () => {
  const d = depot();
  d.ecrire("docs/features/demo/AAA-1-pirate.map.md", carte("demo", "\nPhase: 6-nettoyage"));
  d.commit("docs(demo): seconde carte");
  refusSansRienPousser(d, "création", /en place/);
});

test("refuse la suppression et le renommage de la carte", () => {
  const d = depot();
  d.git("rm", "-q", CARTE);
  d.commit("docs(demo): suppression");
  refusSansRienPousser(d, "suppression", /en place/);
  const e = depot();
  e.git("mv", CARTE, "docs/features/demo/DEM-1-renommee.map.md");
  e.commit("docs(demo): renommage");
  refusSansRienPousser(e, "renommage", /autre chose/);
});

test("refuse la carte d'un autre sujet réécrite pour citer celui-ci", () => {
  const d = depot();
  d.ecrire(AUTRE, carte("demo", "\nSessions: s1"));
  d.commit("docs(autre): détournée");
  refusSansRienPousser(d, "carte d'un autre sujet", /ne déclarait pas/);
});

test("refuse une ligne Sujet: qui ne nomme pas exactement ce sujet", () => {
  const d = depot();
  d.ecrire(CARTE, carte("autre (ex sujet/demo)", "\nSessions: s1"));
  d.commit("docs(demo): sujet changé");
  refusSansRienPousser(d, "Sujet: sujet/autre (ex sujet/demo)", /plus exactement/);
});

test("refuse un changement de mode de la carte", () => {
  const d = depot();
  chmodSync(join(d.travail, CARTE), 0o755);
  d.commit("docs(demo): exécutable");
  refusSansRienPousser(d, "mode", /en place/);
});

test("refuse un nom de sujet vide", () => {
  const d = depot();
  assert.equal(lancer(d, "").status, 9);
});

test("refuse un sujet absent d'origin", () => {
  const d = depot();
  assert.equal(lancer(d, "fantome").status, 9);
});
