#!/usr/bin/env node
/**
 * Archivage des tickets faits (skill `tickets`).
 *
 * Un ticket dont `Status:` est `Fait — PR #n` depuis plus de 180 jours quitte `issues/` pour
 * `issues/archive/` (même nom, `git mv`) : il sort du chemin des gates (`tickets.mjs`), de la
 * réservation (`ticket-libre.mjs`), du tableau d'avancement et de la carte des sujets, mais reste un
 * fichier git, et un `Blocked by:` peut toujours le citer. Les liens relatifs qui le visent, et ceux
 * qu'il porte lui-même (un niveau plus profond), sont réécrits dans tous les `docs/**\/*.md`.
 *
 * La date vient de git, pas du texte : celle du dernier commit qui a posé une ligne `Status: Fait`,
 * soit la fusion de la PR. Sur un clone superficiel l'historique peut manquer : un ticket sans date
 * est signalé et laissé en place.
 *
 * Lancé par le capitaine, à la main, une fois par mois — jamais en CI.
 *
 * Usage : node scripts/docs/archiver-tickets.mjs [--appliquer] [--jours=180] [--aujourdhui=AAAA-MM-JJ]
 * Défaut : --dry-run (liste ce qui serait déplacé). Sorties : 0 · 2 usage.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, posix } from 'node:path';

const args = process.argv.slice(2);
const inconnus = args.filter((a) => !/^--(appliquer|jours=\d+|aujourdhui=\d{4}-\d{2}-\d{2})$/.test(a));
if (inconnus.length) {
  console.error(`Option inconnue : ${inconnus.join(' ')}\nUsage : node scripts/docs/archiver-tickets.mjs [--appliquer] [--jours=180] [--aujourdhui=AAAA-MM-JJ]`);
  process.exit(2);
}
const appliquer = args.includes('--appliquer');
const jours = Number(args.find((a) => a.startsWith('--jours='))?.slice(8) ?? 180);
const aujourdhui = args.find((a) => a.startsWith('--aujourdhui='))?.slice(13) ?? new Date().toISOString().slice(0, 10);

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
const mds = [...new Set(git('ls-files', '-z', 'docs/**/*.md').split('\0').filter(Boolean))];
if (git('rev-parse', '--is-shallow-repository').trim() === 'true')
  console.warn('! clone superficiel : des tickets anciens peuvent paraître récents (`git fetch --unshallow` pour un relevé exact).');
const ageEnJours = (date) => Math.floor((Date.parse(aujourdhui) - Date.parse(date)) / 86_400_000);

const LIGNE_FAIT = /^(?:- )?\**Status\**\s*:\**\s*Fait — PR #(\d+)/im;
const aArchiver = [];
const sansDate = [];
for (const f of mds) {
  if (!f.endsWith('.issue.md') || f.includes('/issues/archive/') || basename(dirname(f)) !== 'issues') continue;
  const m = LIGNE_FAIT.exec(readFileSync(f, 'utf8'));
  if (!m) continue;
  const date = git('log', '-1', '--format=%cs', '-G', '^(- )?\\**Status\\**\\s*:\\**\\s*Fait — PR', '--', f).trim();
  if (!date) {
    sansDate.push(f);
    continue;
  }
  const age = ageEnJours(date);
  if (age > jours) aArchiver.push({ f, pr: m[1], date, age });
}
if (sansDate.length) console.warn(`! ${sansDate.length} ticket(s) fait(s) sans date dans l'historique, laissés en place :\n  ${sansDate.join('\n  ')}`);
if (!aArchiver.length) {
  console.log(`archiver-tickets : rien à archiver (Fait depuis plus de ${jours} jours).`);
  process.exit(0);
}
const nouveau = (f) => posix.join(dirname(f), 'archive', basename(f));
const deplaces = new Map(aArchiver.map(({ f }) => [f, nouveau(f)]));
console.log(`archiver-tickets : ${aArchiver.length} ticket(s) Fait depuis plus de ${jours} jours${appliquer ? '' : ' (dry-run, --appliquer pour déplacer)'} :`);
for (const { f, pr, date, age } of aArchiver) console.log(`  ${f}  (PR #${pr}, ${date}, ${age} j)`);

const LIEN = /\]\(([^)\s#]+)(#[^)\s]*)?\)/g;
const EXTERNE = /^([a-z][a-z0-9+.-]*:|\/|#)/i;
function reecrire(ancien, texte) {
  const nouvelEmplacement = deplaces.get(ancien) ?? ancien;
  return texte.replace(LIEN, (tout, cible, ancre = '') => {
    if (EXTERNE.test(cible)) return tout;
    const cibleAbsolue = posix.normalize(posix.join(dirname(ancien), cible));
    const cibleFinale = deplaces.get(cibleAbsolue) ?? cibleAbsolue;
    const relatif = posix.relative(dirname(nouvelEmplacement), cibleFinale);
    return relatif === cible ? tout : `](${relatif}${ancre})`;
  });
}
if (!appliquer) process.exit(0);
let liens = 0;
for (const [ancien, cible] of deplaces) {
  mkdirSync(dirname(cible), { recursive: true });
  git('mv', ancien, cible);
}
for (const f of mds) {
  const apres = deplaces.get(f) ?? f;
  const texte = readFileSync(apres, 'utf8');
  const reecrit = reecrire(f, texte);
  if (reecrit !== texte) {
    writeFileSync(apres, reecrit);
    liens++;
  }
}
console.log(`archiver-tickets : ${deplaces.size} déplacé(s), liens réécrits dans ${liens} fichier(s).`);
