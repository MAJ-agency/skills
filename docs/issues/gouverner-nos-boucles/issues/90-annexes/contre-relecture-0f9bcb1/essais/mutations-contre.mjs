// Mutations du contre-relecteur (PR 156, sommet 0f9bcb1) : même forme que `90-annexes/mutations.mjs`. Chacune remplace
// un texte exact (ou ajoute un fichier), joue les bancs qu'elle vise, remet le fichier. À lancer depuis la racine du clone.
// `attendu` : ROUGE (tuée) ou VERTE (un angle mort montré). Sortie 0 : chaque mutation rend son attendu.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';

const R = 'skills/chaine/socle-chaine-de-production/references/agent/regles.mjs';
const T = 'skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs';
const G = 'scripts/references-posees.test.mjs';
const P = 'scripts/pose-du-socle.mjs';
const D = 'skills/chaine/socle-chaine-de-production/references/scripts/github/develop.sh';
const DT = 'skills/chaine/socle-chaine-de-production/scripts/develop.test.mjs';
const COND = 'skills/monorepo/socle-monorepo/references/scripts/docs/conditionnel.test.mjs';
const G8 = ['--test-name-pattern=régime 8', G];
const attenduV14 = process.env.ATTENDU_C1 ?? 'VERTE';

// [nom, fichier, avant, après, bancs, attendu, options]
const MUTATIONS = [
  ["C1 V14 joué avec le NODE_PATH du poste (le jouet sans node_modules, un typescript global)", P, "  symlinkSync(join(RACINE, 'node_modules'), join(projet, 'node_modules'), 'dir');\n", '', G8, attenduV14, {}],
  ["C2 un banc posé qui, posé, n'écrit aucun test (son test ne s'écrit que dans le plugin)", COND, null, "import { existsSync } from 'node:fs';\nimport { test } from 'node:test';\nif (existsSync(new URL('../../../SKILL.md', import.meta.url))) test('ne se juge que dans le plugin', () => {});\n", G8, process.env.ATTENDU_C2 ?? 'VERTE', {}],
  ["C3 regles.mjs lit le contrat sous le dossier courant (process.cwd()), plus à côté du fichier", R, "export const CHAINE = lireJson(new URL('../../.claude/chaine.json', import.meta.url)) ?? {};", "export const CHAINE = lireJson(new URL(`file://${process.cwd()}/.claude/chaine.json`)) ?? {};", G8, 'ROUGE', {}],
  ["C4 regles.mjs n'exporte plus RAISON_ILLISIBLE (l'import dynamique rend undefined, sans erreur de liaison)", R, 'export const RAISON_ILLISIBLE', 'const RAISON_ILLISIBLE', [T], 'ROUGE', {}],
  ["C5 develop.sh ne pousse plus develop (le banc déplacé le voit-il encore ?)", D, 'git push -q origin origin/main:refs/heads/develop ||', 'true ||', [DT], 'ROUGE', {}],
  ["C6 le cas « hors accord » de .claude/skills : un refus sans la raison", R, "  return lu.copies.length > 0 && lu.copies.every((motifs) => touche(c, motifs)) ? null : refus('');", "  return lu.copies.length > 0 && lu.copies.every((motifs) => touche(c, motifs)) ? null : `${c} : refusé`;", [T], 'ROUGE', {}],
];

const voulues = process.argv.slice(2);
let ecarts = 0;
for (const [nom, fichier, avant, apres, bancs, attendu, options] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  let remettre;
  if (avant === null) {
    if (existsSync(fichier)) { console.log(`INTROUVABLE ${nom}`); ecarts++; continue; }
    writeFileSync(fichier, apres);
    remettre = () => rmSync(fichier, { force: true });
  } else {
    const texte = readFileSync(fichier, 'utf8');
    if (texte.split(avant).length !== 2) { console.log(`INTROUVABLE ${nom}`); ecarts++; continue; }
    writeFileSync(fichier, texte.replace(avant, () => apres));
    remettre = () => writeFileSync(fichier, texte);
  }
  const env = { ...process.env };
  if (options.sansNodePath) delete env.NODE_PATH;
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', ...bancs], { encoding: 'utf8', env, timeout: 1_800_000, maxBuffer: 64 * 1024 * 1024 });
  remettre();
  const etat = r.status === null ? 'DÉLAI' : r.status !== 0 ? 'ROUGE' : 'VERTE';
  if (etat !== attendu) ecarts++;
  const echecs = (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ');
  const vus = [...new Set((r.stdout.match(/^ {4}\+ {3}'.*'/gm) ?? []).map((l) => l.trim().slice(0, 90)))].join(' ; ');
  const diag = (r.stdout.match(/^# régime .*$/gm) ?? []).join(' ; ');
  console.log(`${etat} (attendu ${attendu}) ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}${vus ? ` — vus : ${vus}` : ''}${diag ? ` — ${diag}` : ''}`);
}
console.log(ecarts === 0 ? 'toutes à leur attendu' : `${ecarts} écart(s)`);
process.exit(ecarts === 0 ? 0 : 1);
