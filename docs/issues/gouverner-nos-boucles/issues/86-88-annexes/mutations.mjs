// Les mutations de la PR « socle-tests » (tickets 86 à 88) : chacune remplace un texte exact d'un fichier, joue les
// bancs qu'elle vise, et doit les rendre rouges ; le fichier est remis après chaque mutation. À lancer depuis la racine
// d'un clone où le patch de la PR est appliqué : `node <chemin>/mutations.mjs [<nom>…]`.
// Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const V = 'skills/monorepo/socle-tests/references/scripts/verify';
const P = `${V}/preuves.mjs`;
const BP = `${V}/preuves.test.mjs`;
const M = `${V}/mutation-regles.mjs`;
const BM = `${V}/mutation-regles.test.mjs`;
const S = `${V}/mutation-regles-synthese.mjs`;
const BS = `${V}/mutation-regles-synthese.test.mjs`;
const W = 'skills/monorepo/socle-tests/references/ci/mutation.yml';
const F = 'skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md';
const DT = 'scripts/depot.test.mjs';
const PS = 'scripts/preuve-suffisante-socle-tests.test.mjs';

const MUTATIONS = [
  ["R1 preuves.mjs : un index d'un autre schéma se compare quand même", P, 'return lu.schema === "3" ? { etat: "pivot-3" }', 'return ["2", "3"].includes(lu.schema) ? { etat: "pivot-3" }', [BP]],
  ["R2 preuves.mjs : sans index, la CLI est lancée", P, '  if (index.etat === "absent") {\n    dire(', '  if (index.etat === "absent" && false) {\n    dire(', [BP]],
  ["R3 preuves.mjs : la sortie de la CLI n'est pas rendue (toujours 0)", P, "  return r.status;\n}", "  return 0;\n}", [BP]],
  ["R4 preuves.mjs : une panne de la CLI (sortie 2) passe pour un rapport", P, "if (r.status !== 0 && r.status !== 1) {", "if (r.status !== 0 && r.status !== 1 && r.status !== 2) {", [BP]],
  ["R5 preuves.mjs : le sujet visé par le push est ignoré", P, "    if (poussee && existe(poussee)) base = poussee;", "    if (false) base = poussee;", [BP]],
  ["R6 preuves.mjs : develop toujours, jamais le sujet le plus proche", P, "      base = choisirBase(candidats);", "      base = BASE_DEFAUT;", [BP]],
  ["R7 preuves.mjs : le premier push d'un dépôt neuf est refusé", P, '    if (decision === "premier-push") {', '    if (decision === "jamais") {', [BP]],
  ["R8 preuves.mjs : le rapport entier n'entre pas dans le résumé du job", P, "  if (process.env.GITHUB_STEP_SUMMARY) {", "  if (process.env.GITHUB_STEP_SUMMARY_JAMAIS) {", [BP]],
  ["R9 preuves.mjs : en enforce, un écart se dit « avertissement »", P, 'const sorte = mode === "enforce" ? "refus" : "avertissement (observe)";', 'const sorte = "avertissement (observe)";', [BP]],
  ["R10 preuves.mjs : une option inconnue est acceptée", P, "|| inconnues.length) return refuser(", ") return refuser(", [BP]],
  ["M1 mutation-regles.mjs : au pivot 3, seules les règles prouvées (le code d'avant)", M, 'RETENUES = { 2: ["proven"], 3: ["proven", "partial"] }', 'RETENUES = { 2: ["proven"], 3: ["proven"] }', [BM]],
  ["M2 mutation-regles.mjs : au schéma 2, partial entre aussi", M, 'RETENUES = { 2: ["proven"], 3: ["proven", "partial"] }', 'RETENUES = { 2: ["proven", "partial"], 3: ["proven", "partial"] }', [BM]],
  ["M3 mutation-regles.mjs : le schéma 3 n'est pas lu (le code d'avant)", M, 'export const SCHEMAS = ["2", "3"];', 'export const SCHEMAS = ["2"];', [BM]],
  ["M4 mutation-regles.mjs : la criticité n'est pas portée", M, "    const criticite = NIVEAUX.includes(r?.criticality?.level) ? r.criticality.level : null;", "    const criticite = null;", [BM]],
  ["T1 synthèse : une règle non mesurée vaut 0 %", S, "score: atteints ? Math.round((100 * tues) / (tues + survivants)) : null", "score: tues + survivants ? Math.round((100 * tues) / (tues + survivants)) : null", [BS]],
  ["T2 synthèse : une baisse d'une règle haute est dite", S, 'r.criticite === "medium" && r.score !== null', '["medium", "high"].includes(r.criticite) && r.score !== null', [BS]],
  ["T3 synthèse : une égalité est une baisse", S, "&& r.score < avant.get(r.regle))", "&& r.score <= avant.get(r.regle))", [BS]],
  ["T4 synthèse : la mesure n'est pas écrite", S, "  if (options.mesure) writeFileSync(", "  if (false) writeFileSync(", [BS]],
  ["T5 synthèse : une mesure précédente d'une autre forme se lit", S, "    if (typeof m?.date !== \"string\" || !Array.isArray(m.regles)) return null;", "    if (!Array.isArray(m?.regles)) return null;", [BS]],
  ["T6 synthèse : la date n'est pas dite", S, '  if (options.date) lignes.splice(3, 0, "", `Mesure du ${ligne(options.date)} (jour UTC du passage).`);', "", [BS]],
  ["T7 synthèse : une date mal écrite est acceptée", S, '    if (nom === "--date" && !JOUR.test(valeur)) return null;', "", [BS]],
  ["W1 mutation.yml : sans la permission de lire l'artefact précédent", W, "  actions: read # lire l'artefact de la mesure précédente\n", "", [DT, PS]],
  ["W2 mutation.yml : la mesure n'est pas publiée", W, "          name: mesure-regles\n          path: apps/api/reports/mutation/mesure-regles.json", "          name: mesure-regles\n          path: apps/api/reports/mutation/", [DT, PS]],
  ["W3 mutation.yml : une expression dans un run:", W, "id=$(gh api \"repos/$GITHUB_REPOSITORY/", "id=$(gh api \"repos/${{ github.repository }}/", [DT, PS]],
  ["F1 fiche des tests : la grille d'une règle haute n'exige pas le bout en bout", F, "| haute                 | une preuve P2          |", "| haute                 | une preuve             |", [DT, PS]],
  ["F2 fiche des tests : sans l'étiquette de cas", F, "`it('[RULE_ALL_LIC-2#seconde-licence] refuse", "`it('[RULE_ALL_LIC-2] refuse", [DT, PS]],
];

const voulues = process.argv.slice(2);
let vertes = 0;
for (const [nom, fichier, avant, apres, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2) {
    console.log(`INTROUVABLE ${nom}`);
    vertes++;
    continue;
  }
  writeFileSync(fichier, texte.replace(avant, () => apres));
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...bancs], { encoding: 'utf8', timeout: 900_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? (r.status === null ? 'ROUGE(délai)' : 'ROUGE') : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
