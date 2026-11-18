// `node --test scripts/verify/coverage-diff.test.mjs` : ce que `coverage-diff.mjs` compte comme le diff, sur de vrais
// dépôts git jetables (un distant nu, develop, un sujet), en `--dry-run` : Vitest n'est pas lancé. Une PR de mise
// à jour d'un sujet (la fusion de develop dans le sujet, puis des retouches) ne mesure que l'écart du sommet à la
// fusion recalculée ; partout ailleurs, la mesure est celle d'avant. Et le journal d'une longue sortie n'est pas
// coupé quand il passe par un tube lent.
import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(ICI, "coverage-diff.mjs");
const ENV = Object.fromEntries(Object.entries(process.env).filter(([c]) => !c.startsWith("GIT_") && c !== "NODE_TEST_CONTEXT" && c !== "PRE_PUSH_REFS"));

const dossiers = [];
const dossier = (prefixe) => {
  const d = mkdtempSync(join(tmpdir(), prefixe));
  dossiers.push(d);
  return d;
};
after(() => {
  for (const d of dossiers) rmSync(d, { recursive: true, force: true });
});

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", env: ENV }).trim();
function ecrire(depot, chemin, texte) {
  mkdirSync(join(depot, dirname(chemin)), { recursive: true });
  writeFileSync(join(depot, chemin), texte);
}
function valider(depot, message) {
  git(depot, "add", "-A");
  git(depot, "commit", "-q", "-m", message);
}

/**
 * develop (d1) ; sujet/x parti de d1 (s.ts) ; develop avance (d1.ts, d2.ts) ; `maj` = le sujet plus la fusion de
 * develop. Le paquet apps/api a un `test` Vitest : ses fichiers sont listés en `--dry-run`.
 */
function depot() {
  const nu = dossier("cov-nu-");
  git(nu, "init", "-q", "--bare");
  const r = dossier("cov-depot-");
  git(r, "init", "-q", "-b", "develop");
  git(r, "config", "user.email", "jouet@example.invalid");
  git(r, "config", "user.name", "Jouet");
  git(r, "remote", "add", "origin", nu);
  ecrire(r, "apps/api/package.json", '{"scripts":{"test":"vitest run"}}\n');
  ecrire(r, "apps/api/src/a.ts", "export const a = 1;\n");
  valider(r, "d1");
  git(r, "push", "-q", "origin", "develop");
  git(r, "checkout", "-q", "-b", "sujet/x");
  ecrire(r, "apps/api/src/s.ts", "export const s = 1;\n");
  valider(r, "s1");
  git(r, "push", "-q", "origin", "sujet/x");
  git(r, "checkout", "-q", "develop");
  ecrire(r, "apps/api/src/d1.ts", "export const d1 = 1;\n");
  ecrire(r, "apps/api/src/d2.ts", "export const d2 = 1;\n");
  valider(r, "d2");
  git(r, "push", "-q", "origin", "develop");
  git(r, "checkout", "-q", "-b", "maj", "sujet/x");
  git(r, "merge", "-q", "--no-ff", "-m", "chore: fusionne develop dans sujet/x", "develop");
  git(r, "fetch", "-q", "origin");
  return r;
}

function jouer(r, args, env = {}) {
  const res = spawnSync(process.execPath, [SCRIPT, "--dry-run", ...args], {
    cwd: r,
    env: { ...ENV, PROJET_RACINE: r, ...env },
    encoding: "utf8",
  });
  const listes = (res.stdout.match(/^ {3}• (\S+)/gm) ?? []).map((l) => l.replace(/^ {3}• /, ""));
  return { statut: res.status, sortie: res.stdout + res.stderr, listes, brut: res.stdout };
}

// Sans `--dry-run` : le faux Vitest du dépôt jouet est lancé. DATABASE_URL et GITHUB_ACTIONS sont retirées de
// l'environnement, sauf quand un test les pose : la machine qui joue le banc peut les porter.
function jouerReel(r, args, env = {}) {
  const { DATABASE_URL: _d, GITHUB_ACTIONS: _g, ...propre } = ENV;
  const res = spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: r,
    env: { ...propre, PROJET_RACINE: r, ...env },
    encoding: "utf8",
  });
  return { statut: res.status, sortie: res.stdout + res.stderr };
}

// Un faux Vitest : pour chaque fichier de `related`, une entrée istanbul à zéro dans le dossier du rapport, et la
// ligne « Test Files » que le script lit. Le paquet porte un `vitest.db.config.ts` ; node_modules est ignoré.
const FAUX_VITEST = `#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const args = process.argv.slice(2);
const dir = args.find((a) => a.startsWith("--coverage.reportsDirectory=")).split("=")[1];
const fichiers = args.slice(1, args.indexOf("--run"));
const rapport = {};
for (const f of fichiers) {
  const abs = path.resolve(process.cwd(), f);
  rapport[abs] = {
    statementMap: { 0: { start: { line: 1 } } }, s: { 0: 0 },
    fnMap: { 0: {} }, f: { 0: 0 }, branchMap: {}, b: {},
  };
}
fs.writeFileSync(path.join(dir, "coverage-final.json"), JSON.stringify(rapport));
console.log(" Test Files  1 passed (1)");
`;

/** Une branche de travail avec un fichier neuf `repo.ts` jamais exécuté, et ce que `specDb` dit de lui. */
function depotSuiteSurBase({ specDb = true } = {}) {
  const r = depot();
  git(r, "checkout", "-q", "-b", "feat/db", "develop");
  ecrire(r, ".gitignore", "node_modules\n");
  ecrire(r, "apps/api/vitest.db.config.ts", "export default {};\n");
  ecrire(r, "apps/api/node_modules/.bin/vitest", FAUX_VITEST);
  chmodSync(join(r, "apps/api/node_modules/.bin/vitest"), 0o755);
  ecrire(r, "apps/api/src/repo.ts", "export const repo = 1;\n");
  if (specDb) ecrire(r, "apps/api/src/repo.db.spec.ts", 'import { repo } from "./repo";\nrepo;\n');
  valider(r, "repo");
  return r;
}

test("PR de mise à jour, la fusion seule : aucun fichier de develop ne compte", () => {
  const r = depot();
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.equal(j.statut, 0, j.sortie);
  assert.deepEqual(j.listes, []);
  assert.match(j.sortie, /aucun fichier de code dans le diff/);
});

test("PR de mise à jour avec retouches : seules les retouches comptent, un fichier neuf reste neuf", () => {
  const r = depot();
  ecrire(r, "apps/api/src/s.ts", "export const s = 2;\n");
  ecrire(r, "apps/api/src/retouche.ts", "export const retouche = 1;\n");
  valider(r, "retouche");
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.deepEqual(j.listes, ["apps/api/src/retouche.ts", "apps/api/src/s.ts"]);
  assert.match(j.brut, /retouche\.ts \(nouveau\)/);
  assert.doesNotMatch(j.brut, /s\.ts \(nouveau\)/);
});

test("PR de mise à jour avec un conflit résolu : le fichier en conflit compte, pas ceux de develop", () => {
  const r = depot();
  git(r, "checkout", "-q", "develop");
  ecrire(r, "apps/api/src/a.ts", "export const a = 'develop';\n");
  valider(r, "develop touche a");
  git(r, "push", "-q", "origin", "develop");
  git(r, "checkout", "-q", "sujet/x");
  ecrire(r, "apps/api/src/a.ts", "export const a = 'sujet';\n");
  valider(r, "sujet touche a");
  git(r, "push", "-q", "origin", "sujet/x");
  git(r, "checkout", "-q", "-b", "maj2", "sujet/x");
  assert.throws(() => git(r, "merge", "--no-ff", "-m", "chore: fusionne develop dans sujet/x", "develop"));
  ecrire(r, "apps/api/src/a.ts", "export const a = 'les deux';\n");
  git(r, "add", "-A");
  git(r, "commit", "-q", "--no-edit");
  git(r, "fetch", "-q", "origin");
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.deepEqual(j.listes, ["apps/api/src/a.ts"]);
});

test("PR de mise à jour : une retouche de formatage d'un fichier venu de develop compte, comme dans une sous-PR (A-47 ter : aucune dispense)", () => {
  const r = depot();
  ecrire(r, "apps/api/src/d1.ts", "export const d1 = 1\n");
  valider(r, "style: formate d1");
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.deepEqual(j.listes, ["apps/api/src/d1.ts"]);
  assert.doesNotMatch(j.brut, /d1\.ts \(nouveau\)/, "un fichier de develop retouché est modifié, pas neuf");
});

test("pre-push d'une branche de mise à jour (--base-auto) : la base est le sujet, même à égalité avec develop", () => {
  const r = depot();
  const j = jouer(r, ["--base-auto"]);
  assert.match(j.sortie, /la fusion recalculée de develop dans origin\/sujet\/x/);
  assert.deepEqual(j.listes, []);
});

test("hors mise à jour, rien ne change : une sous-PR du sujet compte ses fichiers contre le sujet", () => {
  const r = depot();
  git(r, "checkout", "-q", "-b", "feat/y", "sujet/x");
  ecrire(r, "apps/api/src/y.ts", "export const y = 1;\n");
  valider(r, "y");
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.deepEqual(j.listes, ["apps/api/src/y.ts"]);
  assert.match(j.brut, /y\.ts \(nouveau\)/);
});

test("hors mise à jour, rien ne change : une PR vers develop compte ses fichiers contre develop", () => {
  const r = depot();
  git(r, "checkout", "-q", "-b", "feat/z", "develop");
  ecrire(r, "apps/api/src/z.ts", "export const z = 1;\n");
  valider(r, "z");
  const j = jouer(r, ["--base", "origin/develop"]);
  assert.deepEqual(j.listes, ["apps/api/src/z.ts"]);
});

test("un sujet qui a avancé depuis la fusion : plus de fusion recalculée, repli sur origin/develop, les fichiers de develop ne comptent plus", () => {
  const r = depot();
  git(r, "checkout", "-q", "sujet/x");
  ecrire(r, "apps/api/src/avance.ts", "export const avance = 1;\n");
  valider(r, "le sujet avance");
  git(r, "push", "-q", "origin", "sujet/x");
  git(r, "checkout", "-q", "maj");
  git(r, "fetch", "-q", "origin");
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.doesNotMatch(j.sortie, /la fusion recalculée/);
  assert.ok(!j.listes.includes("apps/api/src/d1.ts"), j.sortie);
  assert.ok(j.listes.includes("apps/api/src/s.ts"), j.sortie);
  assert.match(j.sortie, /HEAD contient develop/);
});

test("la fusion d'essai de GitHub (refs/pull/N/merge) n'est pas une mise à jour reconnue : repli sur origin/develop", () => {
  const r = depot();
  // Le checkout par défaut d'un `pull_request` : un commit de fusion du sujet et de la tête de la PR (qui contient
  // déjà le sujet). Son second parent n'est pas dans develop : la forme d'une mise à jour est masquée.
  git(r, "checkout", "-q", "-b", "essai", "sujet/x");
  git(r, "merge", "-q", "--no-ff", "-m", "Merge maj into sujet/x", "maj");
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.ok(!j.listes.includes("apps/api/src/d1.ts"), j.sortie);
  assert.doesNotMatch(j.sortie, /la fusion recalculée/);
});

test("réception de develop dont la fusion a develop pour premier parent : lue contre origin/develop, aucun fichier de develop ne compte", () => {
  const r = depot();
  git(r, "checkout", "-q", "-b", "recu", "develop");
  git(r, "merge", "-q", "--no-ff", "-m", "Merge sujet/x into develop", "sujet/x");
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.deepEqual(j.listes, ["apps/api/src/s.ts"], j.sortie);
  assert.match(j.sortie, /HEAD contient develop/);
});

test("réception de develop précédée d'une retouche : lue contre origin/develop", () => {
  const r = depot();
  git(r, "checkout", "-q", "-b", "retouche", "sujet/x");
  ecrire(r, "apps/api/src/retouche.ts", "export const retouche = 1;\n");
  valider(r, "retouche");
  git(r, "merge", "-q", "--no-ff", "-m", "chore: fusionne develop dans sujet/x", "develop");
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.ok(j.listes.includes("apps/api/src/retouche.ts"), j.sortie);
  assert.ok(!j.listes.includes("apps/api/src/d1.ts"), j.sortie);
});

test("origin/develop illisible : pas de repli, la sortie le dit", () => {
  const r = depot();
  git(r, "checkout", "-q", "-b", "essai", "sujet/x");
  git(r, "merge", "-q", "--no-ff", "-m", "Merge maj into sujet/x", "maj");
  git(r, "update-ref", "-d", "refs/remotes/origin/develop");
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.match(j.sortie, /origin\/develop illisible/);
});

test("sans DATABASE_URL, un fichier que seule une suite sur base cible passe en avertissement, sortie 0", () => {
  const r = depotSuiteSurBase();
  const j = jouerReel(r, ["--base", "origin/develop"]);
  assert.equal(j.statut, 0, j.sortie);
  assert.match(j.sortie, /⚠ suites sur base non jouées \(\*\.db\.spec\.ts\) : DATABASE_URL absente \(apps\/api\)/);
  assert.match(j.sortie, /AVERTISSEMENT apps\/api\/src\/repo\.ts : couverture non mesurée sans base : la CI la juge avec Postgres \(/);
  assert.match(j.sortie, /repo\.ts.*⚠/);
});

test("sans DATABASE_URL, un fichier non couvert qu'aucune suite sur base ne cible échoue, comme avant", () => {
  const r = depotSuiteSurBase({ specDb: false });
  const j = jouerReel(r, ["--base", "origin/develop"]);
  assert.equal(j.statut, 1, j.sortie);
  assert.doesNotMatch(j.sortie, /AVERTISSEMENT/);
  assert.match(j.sortie, /✖ apps\/api\/src\/repo\.ts/);
});

test("avec DATABASE_URL, le même fichier non couvert échoue, sans avertissement", () => {
  const r = depotSuiteSurBase();
  const j = jouerReel(r, ["--base", "origin/develop"], { DATABASE_URL: "postgres://x" });
  assert.equal(j.statut, 1, j.sortie);
  assert.doesNotMatch(j.sortie, /AVERTISSEMENT|⚠/);
});

test("sous GitHub Actions sans DATABASE_URL, aucun avertissement : le fichier échoue", () => {
  const r = depotSuiteSurBase();
  const j = jouerReel(r, ["--base", "origin/develop"], { GITHUB_ACTIONS: "true" });
  assert.equal(j.statut, 1, j.sortie);
  assert.doesNotMatch(j.sortie, /AVERTISSEMENT|⚠/);
});

// Une sortie longue lue par un tube lent : le lecteur ne commence à lire qu'après une seconde, quand le script a
// fini d'écrire et sorti. Avec `console.log` puis `process.exit`, la sortie est coupée à chaque fois.
test("une longue sortie lue par un tube lent n'est jamais coupée", async () => {
  const r = depot();
  git(r, "checkout", "-q", "-b", "gros", "develop");
  const n = 3000;
  for (let i = 0; i < n; i++) ecrire(r, `apps/api/src/g/fichier-numero-${i}-avec-un-nom-assez-long.ts`, `export const v${i} = ${i};\n`);
  valider(r, "gros");
  // Sans shell : le script écrit dans un tube, que ce processus ne lit qu'après une seconde.
  const enfant = spawn(process.execPath, [SCRIPT, "--dry-run", "--base", "origin/develop"], {
    cwd: r,
    env: { ...ENV, PROJET_RACINE: r },
    stdio: ["ignore", "pipe", "ignore"],
  });
  const fini = new Promise((resolve) => enfant.on("close", resolve));
  await new Promise((resolve) => setTimeout(resolve, 1000));
  let sortie = "";
  enfant.stdout.setEncoding("utf8");
  for await (const morceau of enfant.stdout) sortie += morceau;
  await fini;
  const lus = (sortie.match(/^ {3}• /gm) ?? []).length;
  assert.equal(lus, n, `${lus} fichiers sur ${n} : la sortie a été coupée`);
  assert.match(sortie, new RegExp(`--dry-run — ${n} fichier\\(s\\) à mesurer`));
});
