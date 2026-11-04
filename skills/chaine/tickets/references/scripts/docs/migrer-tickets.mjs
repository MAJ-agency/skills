#!/usr/bin/env node
/**
 * Migration d'une feature vers la convention du skill `tickets`, pour un dépôt qui a déjà des tickets
 * au format du socle (`docs/features/<feature>/<feature>.spec.md` et `issues/<N>-<slug>.issue.md`).
 *
 *   <feature>.spec.md            → <TRI>-<n>-<feature>.spec.md
 *   issues/<N>-<slug>.issue.md   → issues/<TRI>-<n>-<feature>.<NN>.issue.md   (NN = N sur deux chiffres)
 *
 * `n` est le prochain numéro libre du préfixe (next-id.mjs), ou celui donné par `--n`. Les liens
 * relatifs vers les fichiers déplacés sont réécrits dans tous les `docs/**\/*.md`, ainsi que les
 * mentions `N-<slug>` entre backticks ; une ligne `Blocked by:` ou `Bloqué par :` qui cite des numéros
 * courts passe en `Blocked by: NN, NN`. Un ticket de plus de 99 est refusé : découper la feature.
 *
 * Usage : node scripts/docs/migrer-tickets.mjs <feature> <TRI> [--n <n>] [--appliquer]
 * Défaut : dry-run. Sorties : 0 · 2 usage.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, posix } from 'node:path';

const args = process.argv.slice(2);
const [feature, tri] = args.filter((a) => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--n');
const appliquer = args.includes('--appliquer');
const iN = args.indexOf('--n');
if (!feature || !/^[A-Z][A-Z0-9]*(-[A-Z][A-Z0-9]*)*$/.test(tri ?? '')) {
  console.error('Usage : node scripts/docs/migrer-tickets.mjs <feature> <TRI> [--n <n>] [--appliquer]   (ex. socle SOC)');
  process.exit(2);
}
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
const racine = git('rev-parse', '--show-toplevel').trim();
const dossier = `docs/features/${feature}`;
const mds = git('ls-files', '-z', 'docs/**/*.md').split('\0').filter(Boolean);
const spec = mds.find((f) => f === `${dossier}/${feature}.spec.md`);
const tickets = mds.filter((f) => f.startsWith(`${dossier}/issues/`) && /\/(\d+)-[a-z0-9-]+\.issue\.md$/.test(f) && !f.includes('/archive/'));
if (!spec && !tickets.length) {
  console.error(`Rien à migrer sous ${dossier}/ (ni ${feature}.spec.md ni issues/<N>-<slug>.issue.md).`);
  process.exit(2);
}
const n =
  iN >= 0
    ? Number(args[iN + 1])
    : Number(execFileSync(process.execPath, [new URL('./next-id.mjs', import.meta.url).pathname, ...tri.split('-')], { encoding: 'utf8', cwd: racine, env: { ...process.env, PROJET_RACINE: racine }, stdio: ['ignore', 'pipe', 'ignore'] }).trim());
if (!Number.isInteger(n) || n < 1) {
  console.error(`Numéro invalide : ${n}`);
  process.exit(2);
}
const id = `${tri}-${n}`;
const deplaces = new Map();
if (spec) deplaces.set(spec, `${dossier}/${id}-${feature}.spec.md`);
const numeros = new Map();
for (const t of tickets) {
  const [, num, slug] = /\/(\d+)-([a-z0-9-]+)\.issue\.md$/.exec(t);
  if (Number(num) > 99) {
    console.error(`${t} : index ${num} au-delà de 99, découper la feature avant de migrer.`);
    process.exit(2);
  }
  const nn = num.padStart(2, '0');
  numeros.set(num, nn);
  deplaces.set(t, `${dossier}/issues/${id}-${feature}.${nn}.issue.md`);
  deplaces.set(`slug:${num}-${slug}`, `${id}-${feature}.${nn}`);
}
console.log(`migrer-tickets : ${feature} → ${id}${appliquer ? '' : ' (dry-run, --appliquer pour renommer)'} :`);
for (const [a, b] of deplaces) if (!a.startsWith('slug:')) console.log(`  ${a}\n    → ${b}`);

const LIEN = /\]\(([^)\s#]+)(#[^)\s]*)?\)/g;
const EXTERNE = /^([a-z][a-z0-9+.-]*:|\/|#)/i;
function reecrire(ancien, texte) {
  const nouvelEmplacement = deplaces.get(ancien) ?? ancien;
  let sortie = texte.replace(LIEN, (tout, cible, ancre = '') => {
    if (EXTERNE.test(cible)) return tout;
    const cibleAbsolue = posix.normalize(posix.join(dirname(ancien), cible));
    const cibleFinale = deplaces.get(cibleAbsolue) ?? cibleAbsolue;
    const relatif = posix.relative(dirname(nouvelEmplacement), cibleFinale);
    return relatif === cible ? tout : `](${relatif}${ancre})`;
  });
  for (const [cle, nouveau] of deplaces) {
    if (!cle.startsWith('slug:')) continue;
    const ancienSlug = cle.slice(5);
    sortie = sortie.replace(new RegExp(`\`${ancienSlug}\``, 'g'), `\`${nouveau}\``);
  }
  // Un ticket migré : ses numéros courts de `Blocked by:` / `Bloqué par :` passent sur deux chiffres.
  if (ancien.startsWith(`${dossier}/issues/`)) {
    sortie = sortie.replace(/^(Blocked by|Bloqué par)\s*:\s*(.+)$/m, (tout, _k, reste) => {
      const nums = [...reste.matchAll(/`?(\d+)-[a-z0-9-]+`?|\b(\d{1,2})\b/g)].map((m) => (m[1] ?? m[2]).padStart(2, '0')).filter((x) => numeros.has(String(Number(x))));
      return nums.length ? `Blocked by: ${[...new Set(nums)].join(', ')}` : tout;
    });
  }
  return sortie;
}
if (!appliquer) process.exit(0);
for (const [ancien, cible] of deplaces) if (!ancien.startsWith('slug:')) git('mv', ancien, cible);
let touches = 0;
for (const f of mds) {
  const apres = deplaces.get(f) ?? f;
  const texte = readFileSync(`${racine}/${apres}`, 'utf8');
  const reecrit = reecrire(f, texte);
  if (reecrit !== texte) {
    writeFileSync(`${racine}/${apres}`, reecrit);
    touches++;
  }
}
console.log(`migrer-tickets : ${[...deplaces.keys()].filter((k) => !k.startsWith('slug:')).length} fichier(s) renommé(s), références réécrites dans ${touches} fichier(s). Relire \`git diff\`, puis \`node scripts/verify/tickets.mjs\`.`);
