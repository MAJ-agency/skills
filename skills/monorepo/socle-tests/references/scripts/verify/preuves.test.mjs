// `node --test scripts/verify/preuves.test.mjs` : le relais `preuves.mjs` sur de vrais dépôts git jetables (un distant
// nu, develop, un sujet), la CLI Anchorpost remplacée par un talon qui écrit ses arguments et rend le rapport qu'on lui
// donne. Ce qui est prouvé : rien sans index au pivot 3, la base choisie comme `coverage-diff --base-auto`, la sortie de
// la CLI rendue, le résumé, et chaque panne dite.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { etatDeLIndex, resume } from "./preuves.mjs";

const ICI = dirname(fileURLToPath(import.meta.url));
// Posé dans un projet, le module est dans scripts/docs/ ; dans le plugin, dans le skill `socle-monorepo`.
const { environnementDeBanc } = await import(
  existsSync(join(ICI, "../docs/environnement-de-banc.mjs"))
    ? "../docs/environnement-de-banc.mjs"
    : "../../../../socle-monorepo/references/scripts/docs/environnement-de-banc.mjs"
);
const ENV = environnementDeBanc();

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

const INDEX_3 = '{ "schema": "3", "rules": [] }\n';
// Le talon de la CLI : écrit ses arguments dans `talon.args` (un appel par ligne), puis rend `talon.json` et sort en
// `talon.sortie` (0 par défaut). Sans `--json`, il rend le rapport en markdown, pour le résumé du job.
const TALON = `#!/usr/bin/env node
const { appendFileSync, existsSync, readFileSync } = require("node:fs");
const ici = __dirname + "/../..";
appendFileSync(ici + "/talon.args", JSON.stringify(process.argv.slice(2)) + "\\n");
const sortie = existsSync(ici + "/talon.sortie") ? Number(readFileSync(ici + "/talon.sortie", "utf8")) : 0;
if (sortie === 2) { process.stderr.write("Comparaison impossible : base inconnue\\n"); process.exit(2); }
process.stdout.write(process.argv.includes("--json") ? readFileSync(ici + "/talon.json", "utf8") : "# Rapport de preuves\\n");
process.exit(sortie);
`;

/** develop (d1) poussé ; sujet/x parti de d1, un commit ; `travail` parti du sujet, un commit. Le projet suit Anchorpost. */
function depot({ index = INDEX_3, cli = true, rapport = { sufficiency: "observe", touched: [], gaps: [], warnings: [] } } = {}) {
  const nu = dossier("preuves-nu-");
  git(nu, "init", "-q", "--bare");
  const r = dossier("preuves-depot-");
  git(r, "init", "-q", "-b", "develop");
  git(r, "config", "user.email", "jouet@example.invalid");
  git(r, "config", "user.name", "Jouet");
  git(r, "remote", "add", "origin", nu);
  ecrire(r, ".gitignore", "node_modules/\ntalon.*\n");
  if (index !== null) ecrire(r, "anchorpost/anchorpost.json", index);
  git(r, "add", "-A");
  git(r, "commit", "-q", "-m", "d1");
  git(r, "push", "-q", "origin", "develop");
  git(r, "checkout", "-q", "-b", "sujet/x");
  ecrire(r, "a.ts", "export const a = 1;\n");
  git(r, "add", "-A");
  git(r, "commit", "-q", "-m", "s1");
  git(r, "push", "-q", "origin", "sujet/x");
  git(r, "checkout", "-q", "-b", "travail");
  ecrire(r, "b.ts", "export const b = 1;\n");
  git(r, "add", "-A");
  git(r, "commit", "-q", "-m", "t1");
  mkdirSync(join(r, "scripts/verify"), { recursive: true });
  for (const f of ["preuves.mjs", "coverage-diff-regles.mjs"]) copyFileSync(join(ICI, f), join(r, "scripts/verify", f));
  if (cli) {
    ecrire(r, "node_modules/.bin/anchorpost", TALON);
    chmodSync(join(r, "node_modules/.bin/anchorpost"), 0o755);
  }
  writeFileSync(join(r, "talon.json"), typeof rapport === "string" ? rapport : JSON.stringify(rapport));
  return r;
}
const lancer = (r, args = [], env = {}) =>
  spawnSync(process.execPath, [join(r, "scripts/verify/preuves.mjs"), ...args], {
    cwd: r,
    encoding: "utf8",
    env: { ...ENV, PROJET_RACINE: undefined, PRE_PUSH_REFS: undefined, GITHUB_STEP_SUMMARY: undefined, ...env },
  });
const appels = (r) => (existsSync(join(r, "talon.args")) ? readFileSync(join(r, "talon.args"), "utf8").trim().split("\n").map((l) => JSON.parse(l)) : []);

test("etatDeLIndex : absent, illisible, d'un autre schéma, au pivot 3", () => {
  assert.deepEqual(etatDeLIndex(undefined), { etat: "absent" });
  for (const t of ["{ cassé", "null", "[]", '"3"']) assert.deepEqual(etatDeLIndex(t), { etat: "illisible" }, t);
  assert.deepEqual(etatDeLIndex('{ "schema": "2" }'), { etat: "autre", schema: "2" });
  assert.deepEqual(etatDeLIndex('{ "schema": 3 }'), { etat: "autre", schema: 3 }, "un nombre n'est pas le pivot 3");
  assert.deepEqual(etatDeLIndex("{}"), { etat: "autre", schema: undefined });
  assert.deepEqual(etatDeLIndex(INDEX_3), { etat: "pivot-3" });
});

test("resume : le mode jugé, les comptes, un écart par ligne (refus en enforce, avertissement en observe), les valeurs sur une ligne", () => {
  const rapport = {
    sufficiency: "enforce",
    touched: [{ key: "RULE_ALL_LIC-3" }],
    gaps: [{ kind: "case-without-proof", subject: "RULE_ALL_LIC-3#lien-expire", message: "aucune preuve\nne porte ce cas" }],
    warnings: [{ kind: "stale", subject: "x", message: "m" }],
  };
  assert.deepEqual(resume(rapport, "origin/develop"), [
    "preuves : base origin/develop, mode jugé enforce ; 1 règle(s) touchée(s), 1 écart(s), 1 avertissement(s)",
    "  refus case-without-proof RULE_ALL_LIC-3#lien-expire : aucune preuve ne porte ce cas",
    "  avertissement stale x : m",
    "  le rapport entier : pnpm exec anchorpost compare --base origin/develop",
  ]);
  assert.equal(resume({ ...rapport, sufficiency: "observe" }, "b")[1], "  avertissement (observe) case-without-proof RULE_ALL_LIC-3#lien-expire : aucune preuve ne porte ce cas");
  assert.deepEqual(resume({}, "b"), ["preuves : base b, mode jugé observe ; 0 règle(s) touchée(s), 0 écart(s), 0 avertissement(s)"]);
});

test("sans index, ou d'un autre schéma que 3 : rien à comparer, la CLI n'est pas lancée, sortie 0", () => {
  const sans = depot({ index: null });
  const r = lancer(sans);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /preuves : pas d'index anchorpost\/anchorpost\.json : le projet ne suit pas Anchorpost, rien à comparer/);
  assert.deepEqual(appels(sans), []);
  const deux = depot({ index: '{ "schema": "2", "rules": [] }\n' });
  const r2 = lancer(deux, ["--base-auto"]);
  assert.equal(r2.status, 0, r2.stderr);
  assert.match(r2.stdout, /index anchorpost\/anchorpost\.json au schéma "2" : la preuve suffisante se juge au pivot 3 \(CLI Anchorpost ≥ 2\.0\.0\), rien à comparer/);
  assert.deepEqual(appels(deux), []);
});

test("un index illisible, une CLI absente ou en panne, un rapport illisible, un usage faux : sortie 2, la cause dite", () => {
  const illisible = lancer(depot({ index: "{ cassé" }));
  assert.equal(illisible.status, 2);
  assert.match(illisible.stderr, /preuves : anchorpost\/anchorpost\.json illisible \(pas un objet JSON\) : régénérer l'index/);
  const sansCli = lancer(depot({ cli: false }));
  assert.equal(sansCli.status, 2);
  assert.match(sansCli.stderr, /la CLI Anchorpost est introuvable \(node_modules\/\.bin\/anchorpost\) : pnpm install/);
  const panne = depot();
  writeFileSync(join(panne, "talon.sortie"), "2");
  const p = lancer(panne);
  assert.equal(p.status, 2);
  assert.match(p.stderr, /preuves : anchorpost compare en panne \(sortie 2\) : Comparaison impossible : base inconnue/);
  const json = lancer(depot({ rapport: "pas du json" }));
  assert.equal(json.status, 2);
  assert.match(json.stderr, /le rapport de anchorpost compare --json ne se lit pas/);
  for (const args of [["--base"], ["--base", "--json"], ["--tout"], ["HEAD~3"], ["--base-auto", "origin/develop"], ["--base", "origin/develop", "HEAD~3"]]) {
    const u = lancer(depot(), args);
    assert.equal(u.status, 2, args.join(" "));
    assert.match(u.stderr, /preuves : usage : node scripts\/verify\/preuves\.mjs \[--base <ref> \| --base-auto\]/);
  }
});

test("la base : nommée par --base ; sinon le sujet visé par le push ; sinon la plus proche de develop et des sujets", () => {
  const r = depot();
  assert.equal(lancer(r, ["--base", "origin/develop"]).status, 0);
  assert.equal(lancer(r).status, 0);
  git(r, "push", "-q", "origin", "develop:sujet/y");
  git(r, "fetch", "-q", "origin");
  const sommet = git(r, "rev-parse", "HEAD");
  assert.equal(lancer(r, ["--base-auto"], { PRE_PUSH_REFS: `refs/heads/travail ${sommet} refs/heads/sujet/y 0000\n` }).status, 0);
  assert.deepEqual(appels(r), [
    ["compare", "--base", "origin/develop", "--json"],
    ["compare", "--base", "origin/sujet/x", "--json"],
    ["compare", "--base", "origin/sujet/y", "--json"],
  ], "nommée ; la plus proche (le sujet dont la branche est partie) ; celle que vise le push, même plus loin");
  // Le premier push d'un sujet neuf (`sujet.sh demarrer`) : `origin/sujet/neuf` n'existe pas encore, la base est la plus
  // proche, comme pour `coverage-diff --base-auto` ; jamais un refus « base absente ».
  const neuf = lancer(r, ["--base-auto"], { PRE_PUSH_REFS: `refs/heads/travail ${sommet} refs/heads/sujet/neuf 0000\n` });
  assert.equal(neuf.status, 0, neuf.stderr);
  assert.deepEqual(appels(r).at(-1), ["compare", "--base", "origin/sujet/x", "--json"], "le premier push d'un sujet neuf : la plus proche");
  git(r, "checkout", "-q", "-b", "correctif", "develop");
  assert.equal(lancer(r).status, 0);
  assert.deepEqual(appels(r).at(-1), ["compare", "--base", "origin/develop", "--json"], "partie de develop : develop");
  // Une branche de mise à jour d'un sujet (develop fusionné dans le sujet) : la plus proche de ses deux bases, comme
  // l'en-tête le dit. Develop apporte deux commits, le sujet en a un : develop ; puis le sujet en a quatre : le sujet.
  git(r, "checkout", "-q", "develop");
  for (const k of [2, 3]) {
    ecrire(r, `d${k}.ts`, `export const d${k} = 1;\n`);
    git(r, "add", "-A", "--", `d${k}.ts`);
    git(r, "commit", "-q", "-m", `d${k}`);
  }
  git(r, "push", "-q", "origin", "develop");
  git(r, "checkout", "-q", "-b", "maj", "origin/sujet/x");
  git(r, "merge", "-q", "--no-edit", "origin/develop");
  assert.equal(lancer(r).status, 0);
  assert.deepEqual(appels(r).at(-1), ["compare", "--base", "origin/develop", "--json"], "mise à jour, develop apporte plus : develop");
  git(r, "checkout", "-q", "-b", "sujet-long", "origin/sujet/x");
  for (const k of [2, 3, 4]) {
    ecrire(r, `s${k}.ts`, `export const s${k} = 1;\n`);
    git(r, "add", "-A", "--", `s${k}.ts`);
    git(r, "commit", "-q", "-m", `s${k}`);
  }
  git(r, "push", "-q", "origin", "sujet-long:sujet/x");
  git(r, "fetch", "-q", "origin");
  git(r, "checkout", "-q", "-b", "maj-2", "origin/sujet/x");
  git(r, "merge", "-q", "--no-edit", "origin/develop");
  assert.equal(lancer(r).status, 0);
  assert.deepEqual(appels(r).at(-1), ["compare", "--base", "origin/sujet/x", "--json"], "mise à jour, le sujet a plus : le sujet");
});

test("une base introuvable : premier push d'un dépôt neuf, sortie 0 ; sinon sortie 2, avec le geste qui la rapatrie", () => {
  const r = depot();
  git(r, "update-ref", "-d", "refs/remotes/origin/develop");
  git(r, "update-ref", "-d", "refs/remotes/origin/sujet/x");
  const a = lancer(r);
  assert.equal(a.status, 2);
  assert.match(a.stderr, /référence de base « origin\/develop » introuvable en local — elle existe sur le distant : git fetch origin develop/);
  // Une base nommée absente en local n'est pas passée à la CLI, et le geste nomme sa branche.
  const nommee = lancer(r, ["--base", "origin/sujet/x"]);
  assert.equal(nommee.status, 2);
  assert.match(nommee.stderr, /référence de base « origin\/sujet\/x » introuvable en local — elle existe sur le distant : git fetch origin sujet\/x/);
  assert.deepEqual(appels(r), [], "la CLI n'est pas lancée sur une base introuvable");
  const neuf = depot();
  const nu = dossier("preuves-nu-vide-");
  git(nu, "init", "-q", "--bare");
  git(neuf, "remote", "set-url", "origin", nu);
  git(neuf, "update-ref", "-d", "refs/remotes/origin/develop");
  git(neuf, "update-ref", "-d", "refs/remotes/origin/sujet/x");
  const p = lancer(neuf);
  assert.equal(p.status, 0, p.stderr);
  assert.match(p.stdout, /preuves : dépôt distant vide, premier push — rien à comparer/);
  assert.deepEqual(appels(neuf), []);
});

test("la sortie de la CLI est rendue : 1 sur un écart en enforce, 0 en observe ; le résumé dit chaque écart", () => {
  const ecart = { kind: "case-without-proof", subject: "RULE_ALL_LIC-3#lien-expire", message: "aucune preuve ne porte ce cas" };
  const enforce = depot({ rapport: { sufficiency: "enforce", touched: [{}], gaps: [ecart], warnings: [] } });
  writeFileSync(join(enforce, "talon.sortie"), "1");
  const e = lancer(enforce);
  assert.equal(e.status, 1);
  assert.match(e.stdout, /preuves : base origin\/sujet\/x, mode jugé enforce ; 1 règle\(s\) touchée\(s\), 1 écart\(s\), 0 avertissement\(s\)\n {2}refus case-without-proof RULE_ALL_LIC-3#lien-expire : aucune preuve ne porte ce cas\n/);
  const observe = lancer(depot({ rapport: { sufficiency: "observe", touched: [{}], gaps: [ecart], warnings: [] } }));
  assert.equal(observe.status, 0);
  assert.match(observe.stdout, /avertissement \(observe\) case-without-proof RULE_ALL_LIC-3#lien-expire/);
});

test("sous GitHub Actions, le rapport entier en markdown s'ajoute au résumé du job ; la sortie reste celle du passage JSON", () => {
  const r = depot();
  const resumeDuJob = join(dossier("preuves-resume-"), "resume.md");
  writeFileSync(resumeDuJob, "avant\n");
  const s = lancer(r, ["--base", "origin/develop"], { GITHUB_STEP_SUMMARY: resumeDuJob });
  assert.equal(s.status, 0, s.stderr);
  assert.equal(readFileSync(resumeDuJob, "utf8"), "avant\n# Rapport de preuves\n\n");
  assert.deepEqual(appels(r), [["compare", "--base", "origin/develop", "--json"], ["compare", "--base", "origin/develop"]]);
});
