#!/usr/bin/env node
/**
 * Vagues d'un chantier calculées depuis les tickets.
 *
 * Pourquoi. L'architecte répartissait les tickets en vagues à la main ; trois sous-PR d'une même vague
 * sont revenues en conflit sur des fichiers chauds communs. Les tickets portent déjà `Status:`,
 * `Blocked by:` et `Fichiers chauds:` : ce script les croise. Il propose, l'architecte décide : il ne
 * modifie pas la carte. Rien n'est lu de GitHub, tout vient des fichiers de la branche courante.
 *
 * Usage : node scripts/docs/vagues.mjs <SPEC|chemin de la spec> [--max N] [--json]
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { lireTicket } from './avancement-regles.mjs';
import { estSpec, fichiersDeLaSpec, identifiantDuFichier } from './identifiants.mjs';

/** Valeur d'une ligne d'en-tête, sous ses formes `X:`, `**X:**`, `- X:`. */
function enTete(texte, nom) {
  const motif = new RegExp(`^(?:- )?\\**${nom}\\**\\s*:\\**\\s*(.*)$`, 'i');
  for (const l of texte.split('\n')) {
    const m = motif.exec(l);
    if (m) return m[1].trim();
  }
  return null;
}

/** `a/{b,c}.ts` → `a/b.ts`, `a/c.ts`. */
function developper(chemin) {
  const m = /\{([^{}]+)\}/.exec(chemin);
  if (!m) return [chemin];
  return m[1].split(',').flatMap((x) => developper(chemin.slice(0, m.index) + x.trim() + chemin.slice(m.index + m[0].length)));
}

/**
 * Chemins de la ligne `Fichiers chauds:` : entre backticks s'il y en a, sinon séparés par des
 * virgules. Dans chaque élément : `\*` redevient `*`, ce qui suit un espace (commentaire) est
 * ignoré, les accolades sont développées.
 */
export function fichiersChauds(valeur) {
  if (!valeur || /^(—|-|aucun)(?!\w)/i.test(valeur)) return [];
  const backticks = [...valeur.matchAll(/`([^`]+)`/g)].map((m) => m[1].trim());
  const bruts = backticks.length ? backticks : valeur.split(/,(?![^{]*\})/).map((s) => s.trim());
  return bruts.map((c) => c.replace(/\\/g, '').split(/\s/)[0]).filter(Boolean).flatMap(developper);
}

/** Le chemin sans ses `/` de queue, en un seul passage (`/\/+$/` est quadratique). */
export const sansBarresFinales = (chemin) => {
  let fin = chemin.length;
  while (fin > 0 && chemin[fin - 1] === '/') fin--;
  return chemin.slice(0, fin);
};
const motif = (chemin) =>
  new RegExp('^' + sansBarresFinales(chemin).replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '(/.*)?$');
const nomSeul = (c) => !c.includes('/');

/**
 * Deux chemins se recouvrent s'ils sont égaux, si l'un (dossier, avec ou sans `/` final, ou joker
 * `*`) couvre l'autre, ou si l'un est un nom nu qui égale le dernier segment de l'autre.
 */
export function seRecouvrent(a, b) {
  if (motif(a).test(b) || motif(b).test(a)) return true;
  const fin = (c) => sansBarresFinales(c).split('/').pop();
  return (nomSeul(a) && motif(a).test(fin(b))) || (nomSeul(b) && motif(b).test(fin(a)));
}

const enConflit = (a, b) => a.chauds.some((x) => b.chauds.some((y) => seRecouvrent(x, y)));

/** Tickets lus avec leurs fichiers chauds : `{ ...lireTicket, chauds, sansChauds }`. */
export function lireTickets(entrees) {
  return entrees.map(({ nom, texte }) => {
    const base = lireTicket(nom, texte);
    const valeur = enTete(texte, 'Fichiers chauds');
    return { ...base, chauds: fichiersChauds(valeur), sansChauds: valeur === null };
  });
}

/**
 * Répartit les tickets éligibles (`ready-for-agent`, tous les `Blocked by:` à `Fait`) en vagues :
 * pas de fichier chaud commun dans une vague, au plus `max` tickets, plus petits index d'abord.
 * Un bloquant absent des tickets du chantier compte comme non fait.
 */
export function vagues(tickets, max = 6) {
  const parId = new Map(tickets.map((t) => [t.id, t]));
  const eligibles = tickets
    .filter((t) => t.etat === 'prêt (agent)')
    .filter((t) => t.blockedBy.every((b) => parId.get(b)?.etat === 'fait'))
    .sort((a, b) => a.id.localeCompare(b.id));
  const bloques = tickets
    .filter((t) => t.etat === 'prêt (agent)' && !eligibles.includes(t))
    .map((t) => ({ id: t.id, attend: t.blockedBy.filter((b) => parId.get(b)?.etat !== 'fait') }));
  const restants = [...eligibles];
  const resultat = [];
  while (restants.length) {
    const vague = [];
    for (const t of [...restants]) {
      if (vague.length >= max) break;
      if (vague.some((v) => enConflit(v, t))) continue;
      vague.push(t);
      restants.splice(restants.indexOf(t), 1);
    }
    resultat.push(vague);
  }
  return { vagues: resultat, bloques };
}

/** Tableau Markdown : vague · ticket · objet · modèle · fichiers chauds. */
export function enMarkdown(nom, { vagues: liste, bloques }) {
  const sortie = [`# Vagues proposées — ${nom}`, ''];
  if (!liste.length) sortie.push('Aucun ticket éligible (`ready-for-agent`, bloquants faits).', '');
  else {
    sortie.push('| Vague | Ticket | Objet | Modèle | Fichiers chauds |', '| --- | --- | --- | --- | --- |');
    liste.forEach((vague, i) => {
      for (const t of vague) {
        const chauds = t.chauds.length ? t.chauds.map((c) => `\`${c}\``).join(', ') : t.sansChauds ? '⚠ sans fichiers chauds déclarés' : '—';
        sortie.push(`| ${i + 1} | ${t.id} | ${t.titre} | ${t.modele ?? '—'} | ${chauds} |`);
      }
    });
    sortie.push('');
  }
  if (bloques.length) sortie.push('Prêts mais bloqués : ' + bloques.map((b) => `${b.id} (attend ${b.attend.join(', ')})`).join(' · '), '');
  sortie.push("Proposition : l'architecte la relit, une raison écrite pour s'en écarter, puis la copie dans la carte.");
  return sortie.join('\n') + '\n';
}

function principal() {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const i = args.indexOf('--max');
  const max = i >= 0 ? Number(args[i + 1]) : 6;
  const arg = args.find((a, k) => !a.startsWith('--') && args[k - 1] !== '--max') ?? '';
  // L'identifiant seul, ou le chemin de la spec (ou de sa carte), dont le nom commence par lui.
  const spec = [arg.toUpperCase(), identifiantDuFichier(arg.split('/').pop())].find(estSpec);
  if (!spec || !Number.isInteger(max) || max < 1) {
    console.error('Usage : node scripts/docs/vagues.mjs <SPEC|chemin de la spec> [--max N] [--json]   (ex. SPEC_ALL_SOC-1)');
    process.exit(2);
  }
  const fichiers = execFileSync('git', ['ls-files', '--full-name', ':/docs'], { encoding: 'utf8' })
    .split('\n')
    .filter((f) => f.endsWith('.issue.md') && fichiersDeLaSpec(spec).test(f));
  if (!fichiers.length) {
    console.error(`Aucun ticket pour ${spec} sur la branche courante.`);
    process.exit(2);
  }
  const racine = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  const tickets = lireTickets(
    fichiers.filter((nom) => existsSync(join(racine, nom))).map((nom) => ({ nom, texte: readFileSync(join(racine, nom), 'utf8') })),
  );
  const resultat = vagues(tickets, max);
  if (json)
    console.log(
      JSON.stringify(
        {
          chantier: spec,
          vagues: resultat.vagues.map((v) => v.map((t) => ({ ticket: t.id, objet: t.titre, modele: t.modele, fichiersChauds: t.chauds, sansFichiersChauds: t.sansChauds }))),
          bloques: resultat.bloques,
        },
        null,
        2,
      ),
    );
  else process.stdout.write(enMarkdown(spec, resultat));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) principal();
