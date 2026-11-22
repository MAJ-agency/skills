// Les mutations du ticket 90 : chacune remplace un texte exact d'un fichier (ou ajoute un fichier), joue les bancs
// qu'elle vise, et doit les rendre rouges ; le fichier est remis (ou retiré) après chaque mutation. À lancer depuis la
// racine d'un clone où `ticket-90.patch` est appliqué : `node <chemin>/mutations.mjs [<nom>…]`.
// Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable, nommée.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const T = 'skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs';
const R = 'skills/chaine/socle-chaine-de-production/references/agent/regles.mjs';
const PT = 'skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs';
const G = 'scripts/references-posees.test.mjs';
const P = 'scripts/pose-du-socle.mjs';
const ANCIEN_DEVELOP = 'skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs';
// Le banc d'avant, à son ancienne place : lu dans le commit de départ du ticket (`ddb4265`), qui le porte.
const ancienDevelop = () => execFileSync('git', ['show', `ddb4265:${ANCIEN_DEVELOP}`], { encoding: 'utf8' });
const VIDE = 'skills/chaine/socle-chaine-de-production/references/ci/vide.test.mjs';

// [nom, fichier, avant, après, bancs] ; `avant` null : le fichier est ajouté (`après` : son contenu, ou une fonction).
const MUTATIONS = [
  ["V1 regles.test.mjs : le banc lit ./regles.mjs (le code d'avant), le contrat du projet entre dans ses défauts", T, "const REGLES = pathToFileURL(join(ISOLE, 'scripts/agent/regles.mjs')).href;", "const REGLES = new URL('./regles.mjs', import.meta.url).href;", [G]],
  ["V2 regles.mjs : .claude/skills/ laissé éditable en régime 8 (l'autre décision)", R, "function refusSensible(c, sensibles, accordes) {\n", "function refusSensible(c, sensibles, accordes) {\n  if (c.startsWith('.claude/skills/')) return null;\n", [T]],
  ["V3 regles.mjs : le régime 8 n'est jamais appliqué", R, "  return regime8 ? refusSensible(c, sensibles, accordes) : null;", "  return null;", [T]],
  ["V4 regles.mjs : les chemins sensibles gardés en régime 7 aussi", R, "  return regime8 ? refusSensible(c, sensibles, accordes) : null;", "  return refusSensible(c, sensibles, accordes);", [T]],
  ["V5 develop.test.mjs de retour sous references/scripts/github/ (le banc d'avant, à sa place d'avant)", ANCIEN_DEVELOP, null, ancienDevelop, [G]],
  ["V6 un banc rangé sous references/ hors de agent/ et scripts/<d>/", VIDE, null, "import { test } from 'node:test';\ntest('vide', () => {});\n", [G]],
  ["V7 pr-titre.test.mjs : un deuxième test sauté une fois posé", PT, "test('PR vers develop : du code sans section de revue est refusé avec le motif exact du capitaine ; avec la section, conforme ; de la documentation seule, conforme', () => {", "test('PR vers develop : du code sans section de revue est refusé avec le motif exact du capitaine ; avec la section, conforme ; de la documentation seule, conforme', { skip: !existsSync(new URL('../../ci/pr-titre.yml', import.meta.url)) }, () => {", [G]],
  ["V8 le garde ne joue que scripts/agent/ (sous le plancher)", G, "['--test', '--test-concurrency=1', '--test-reporter=tap', ...bancs]", "['--test', '--test-concurrency=1', '--test-reporter=tap', ...bancs.filter((b) => b.startsWith('scripts/agent/'))]", [G]],
  ["V9 pose-du-socle.mjs : le contrat posé au régime 8 n'a pas la clé relecture", P, "  if (regime === 8) contrat.relecture.depuis = '2026-11-22T00:00:00Z';", "  if (regime === 8) delete contrat.relecture;", [G]],
  ["V10 pose-du-socle.mjs : tout dossier de references/ a une place", P, "  if (!m) return null;", "  if (!m) return 'scripts/autre';", [G]],
];

const voulues = process.argv.slice(2);
let vertes = 0;
for (const [nom, fichier, avant, apres, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  let remettre;
  if (avant === null) {
    if (existsSync(fichier)) {
      console.log(`INTROUVABLE ${nom} (${fichier} existe déjà)`);
      vertes++;
      continue;
    }
    writeFileSync(fichier, typeof apres === 'function' ? apres() : apres);
    remettre = () => rmSync(fichier, { recursive: false, force: true });
  } else {
    const texte = readFileSync(fichier, 'utf8');
    if (texte.split(avant).length !== 2) {
      console.log(`INTROUVABLE ${nom}`);
      vertes++;
      continue;
    }
    writeFileSync(fichier, texte.replace(avant, () => apres));
    remettre = () => writeFileSync(fichier, texte);
  }
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...bancs], { encoding: 'utf8', timeout: 1_800_000, maxBuffer: 64 * 1024 * 1024 });
  remettre();
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? (r.status === null ? 'ROUGE(délai)' : 'ROUGE') : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
// Le dossier `references/ci/` existe dans le plugin : seul le fichier de V6 est retiré, jamais le dossier.
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
