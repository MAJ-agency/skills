#!/usr/bin/env node
/**
 * Migration d'une feature vers la convention du skill `tickets` (`<TYPE>_<CTX>_<TRI>-<n>`, un dossier
 * par contexte). C'est le SEUL script qui lit une ancienne forme : il la convertit, aucun autre ne la
 * connaît. Deux formes d'origine, sous `docs/features/<feature>/` :
 *
 *   A. le socle d'avant le standard, sans identifiant
 *        <feature>.spec.md            → <ctx>/SPEC_<CTX>_<TRI>-<n>-<feature>.spec.md
 *        issues/<N>-<slug>.issue.md   → <ctx>/issues/SPEC_<CTX>_<TRI>-<n>-<feature>.<NN>.issue.md
 *      `n` est le prochain numéro libre (next-id.mjs, et les anciens `<TRI>-<n>` pas encore migrés),
 *      ou celui donné par `--n` ; NN = N sur deux chiffres, un ticket au-delà de 99 est refusé.
 *   B. `<TRI>-<n>` sans type ni contexte (ou `<CTX>-<TRI>-<n>`, le contexte dans le préfixe)
 *        <TRI>-<n>-<slug>.spec.md, .map.md              → <ctx>/SPEC_<CTX>_<TRI>-<n>-<slug>.spec.md, .map.md
 *        issues/[archive/]<TRI>-<n>-<slug>.<NN>.issue.md → <ctx>/issues/[archive/]SPEC_<CTX>_<TRI>-<n>-<slug>.<NN>.issue.md
 *      `n`, le slug et NN sont gardés : un identifiant existant ne se renumérote pas. Les mentions
 *      `<TRI>-<n>` et `<TRI>-<n>.<NN>` de ces specs deviennent `SPEC_<CTX>_<TRI>-<n>[.<NN>]` dans tous
 *      les `docs/**\/*.md` (une règle de même nom dans un registre en tableau le serait aussi : relire
 *      `git diff`).
 *
 * Dans les deux cas : les liens relatifs vers les fichiers déplacés, et ceux que ces fichiers portent,
 * sont réécrits dans tous les `docs/**\/*.md` ; un ticket sans ligne `Type:` reçoit `Type: task`.
 * Forme A : les mentions `N-<slug>` entre backticks suivent, et une ligne `Blocked by:` ou
 * `Bloqué par :` qui cite des numéros courts passe en `Blocked by: NN, NN`.
 *
 * Usage : node scripts/docs/migrer-tickets.mjs <feature> <CTX> <TRI> [--n <n>] [--appliquer]
 * Défaut : dry-run. Sorties : 0 · 2 usage.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, posix } from 'node:path';
import { dossierDuContexte, estArchive, lireIdentifiant } from './identifiants.mjs';

const args = process.argv.slice(2);
const appliquer = args.includes('--appliquer');
const iN = args.indexOf('--n');
const positionnels = args.filter((a, i) => !a.startsWith('--') && (iN < 0 || i !== iN + 1));
const [feature, ctxDemande = '', triDemande = ''] = positionnels;
// Le contexte et le trigramme sont relus par la grammaire : la cible est toujours un identifiant valide.
const cible = positionnels.length === 3 ? lireIdentifiant(`SPEC_${ctxDemande}_${triDemande}-1`) : null;
if (!feature || !cible) {
  console.error('Usage : node scripts/docs/migrer-tickets.mjs <feature> <CTX> <TRI> [--n <n>] [--appliquer]   (ex. socle ALL SOC)');
  process.exit(2);
}
const { contexte: CTX, trigramme: TRI } = cible;
const ctx = dossierDuContexte(CTX);
const git = (...a) => execFileSync('git', a, { encoding: 'utf8' });
const racine = git('rev-parse', '--show-toplevel').trim();
const dossier = `docs/features/${feature}`;
const mds = git('ls-files', '-z', 'docs/**/*.md').split('\0').filter(Boolean);

// ── Forme A : <feature>.spec.md et issues/<N>-<slug>.issue.md ──────────────────────────────────
const spec = mds.find((f) => f === `${dossier}/${feature}.spec.md`);
const tickets = mds.filter((f) => f.startsWith(`${dossier}/issues/`) && /\/(\d+)-[a-z0-9-]+\.issue\.md$/.test(f) && !estArchive(f));
// ── Forme B : <TRI>-<n>-<slug>, ou <CTX>-<TRI>-<n>-<slug>. L'ancienne grammaire ne se lit qu'ici. ──
const ANCIEN = `(?:${CTX}-)?${TRI}-(\\d+)`;
const ANCIEN_FICHIER = new RegExp(`^(${ANCIEN})-([a-z0-9-]+)\\.(?:(spec|map)|(\\d{2})\\.issue)\\.md$`);
const anciens = mds
  .filter((f) => f.startsWith(`${dossier}/`))
  .map((f) => ({ f, m: ANCIEN_FICHIER.exec(basename(f)) }))
  .filter(({ m }) => m);
if (!spec && !tickets.length && !anciens.length) {
  console.error(`Rien à migrer sous ${dossier}/ (ni ${feature}.spec.md, ni issues/<N>-<slug>.issue.md, ni ${TRI}-<n>-<slug>.spec.md).`);
  process.exit(2);
}

const deplaces = new Map();
/** Ancien identifiant de spec → le nouveau (forme B) : les mentions suivent. */
const mentions = new Map();
/** Tickets migrés, par leur ancien chemin : ils reçoivent `Type: task` s'ils n'ont pas de `Type:`. */
const ticketsMigres = new Set();
const ids = [];
const numeros = new Map();
if (spec || tickets.length) {
  // Un ancien `<TRI>-<n>` pas encore migré gardera son numéro : il est déjà pris.
  const dejaPris = Math.max(0, ...mds.map((f) => new RegExp(`^${ANCIEN}-`).exec(basename(f))).filter(Boolean).map((m) => Number(m[1])));
  const suivant = () =>
    Number(execFileSync(process.execPath, [new URL('./next-id.mjs', import.meta.url).pathname, 'SPEC', CTX, TRI], { encoding: 'utf8', cwd: racine, env: { ...process.env, PROJET_RACINE: racine }, stdio: ['ignore', 'pipe', 'ignore'] }).trim());
  const n = iN >= 0 ? Number(args[iN + 1]) : Math.max(suivant(), dejaPris + 1);
  if (!Number.isInteger(n) || n < 1) {
    console.error(`Numéro invalide : ${args[iN + 1]}`);
    process.exit(2);
  }
  const id = `SPEC_${CTX}_${TRI}-${n}`;
  ids.push(id);
  if (spec) deplaces.set(spec, `${dossier}/${ctx}/${id}-${feature}.spec.md`);
  for (const t of tickets) {
    const [, num, slug] = /\/(\d+)-([a-z0-9-]+)\.issue\.md$/.exec(t);
    if (Number(num) > 99) {
      console.error(`${t} : index ${num} au-delà de 99, découper la feature avant de migrer.`);
      process.exit(2);
    }
    const nn = num.padStart(2, '0');
    numeros.set(num, nn);
    deplaces.set(t, `${dossier}/${ctx}/issues/${id}-${feature}.${nn}.issue.md`);
    deplaces.set(`slug:${num}-${slug}`, `${id}-${feature}.${nn}`);
    ticketsMigres.add(t);
  }
} else if (iN >= 0) {
  console.error(`--n ne vaut que pour la forme ${feature}.spec.md : un identifiant ${TRI}-<n> existant garde son numéro.`);
  process.exit(2);
}
for (const { f, m } of anciens) {
  const [, ancienId, n, slug, sorte, nn] = m;
  const id = `SPEC_${CTX}_${TRI}-${n}`;
  if (!ids.includes(id)) ids.push(id);
  mentions.set(ancienId, id);
  if (sorte) deplaces.set(f, `${dossier}/${ctx}/${id}-${slug}.${sorte}.md`);
  else {
    deplaces.set(f, `${dossier}/${ctx}/issues/${estArchive(f) ? 'archive/' : ''}${id}-${slug}.${nn}.issue.md`);
    ticketsMigres.add(f);
  }
}
console.log(`migrer-tickets : ${feature} → ${ids.join(', ')}${appliquer ? '' : ' (dry-run, --appliquer pour renommer)'} :`);
for (const [a, b] of deplaces) if (!a.startsWith('slug:')) console.log(`  ${a}\n    → ${b}`);

const LIEN = /\]\(([^)\s#]+)(#[^)\s]*)?\)/g;
const EXTERNE = /^([a-z][a-z0-9+.-]*:|\/|#)/i;
function reecrire(ancien, texte) {
  const nouvelEmplacement = deplaces.get(ancien) ?? ancien;
  let sortie = texte.replace(LIEN, (tout, cible, ancre = '') => {
    if (EXTERNE.test(cible)) return tout;
    const cibleAbsolue = posix.normalize(posix.join(dirname(ancien), cible));
    // Un lien qui ne vise pas un fichier déplacé, dans un fichier qui ne bouge pas, reste tel quel.
    if (!deplaces.has(cibleAbsolue) && nouvelEmplacement === ancien) return tout;
    const cibleFinale = deplaces.get(cibleAbsolue) ?? cibleAbsolue;
    const relatif = posix.relative(dirname(nouvelEmplacement), cibleFinale);
    return relatif === cible ? tout : `](${relatif}${ancre})`;
  });
  for (const [cle, nouveau] of deplaces) {
    if (!cle.startsWith('slug:')) continue;
    const ancienSlug = cle.slice(5);
    sortie = sortie.replace(new RegExp(`\`${ancienSlug}\``, 'g'), `\`${nouveau}\``);
  }
  // Un ticket migré : sa ligne `Blocked by:` / `Bloqué par :` passe en liste de tête à deux chiffres,
  // lue sur la ligne d'origine (avant la réécriture des slugs, dont le `1` de `SOC-1` serait pris pour
  // un numéro) ; la raison qui suivait est gardée après un tiret, les slugs y deviennent leur index.
  if (tickets.includes(ancien)) {
    const ligne = /^(Blocked by|Bloqué par)\s*:\s*(.+)$/m.exec(texte);
    // « Bloqué par : rien. … » n'est pas une liste : la ligne reste une phrase, slugs réécrits.
    if (ligne && !/^(rien|aucun|non|—|–|-)\b/i.test(ligne[2].trim())) {
      const reste = ligne[2];
      const nums = [...reste.matchAll(/`(\d+)-[a-z0-9-]+`|(?<![\w.-])(\d{1,2})(?![\w.-])/g)]
        .map((m) => (m[1] ?? m[2]).padStart(2, "0"))
        .filter((x) => numeros.has(String(Number(x))));
      if (nums.length) {
        const raison = reste
          .replace(/`(\d+)-[a-z0-9-]+`/g, (_m, n) => n.padStart(2, "0"))
          .replace(/^[\s—–-]*/, "")
          .replace(/^(\d{2}|\d{2}(?:\s*(?:,|et)\s*\d{2})*)[\s.]*$/, "")
          .trim();
        // Un seul bloquant : sa reprise en tête de raison (« 04 — … », « 04 (…) ») est redondante.
        const unique = [...new Set(nums)];
        // La reprise de la liste en tête de raison (« 04 — … », « 04 (…) », « 07 et 14 — … ») est redondante.
        const tete = unique.sort().join(", ");
        const reprise = new RegExp(`^(?:${unique.join("|")})(?:\\s*(?:,|et)\\s*(?:${unique.join("|")}))*\\s*(?:[—–-]\\s*)?`);
        const raisonNette =
          unique.length === 1 && raison.startsWith(unique[0])
            ? raison.slice(2).replace(/^\s*[—–-]?\s*/, "").replace(/^\((.*)\)\.?$/, "$1").trim()
            : reprise.test(raison) && /[—–-]\s*$/.test(reprise.exec(raison)[0])
              ? raison.replace(reprise, "").trim()
              : raison;
        sortie = sortie.replace(/^(Blocked by|Bloqué par)\s*:.*$/m, raisonNette ? `Blocked by: ${tete} — ${raisonNette}` : `Blocked by: ${tete}`);
      }
    }
  }
  // Forme B : les mentions de l'ancien identifiant, ticket compris (`SOC-1.03`), jamais un autre numéro
  // (`SOC-12`) ni un identifiant déjà typé (`SPEC_ALL_SOC-1`, `ALL-SOC-1`).
  for (const [ancienId, nouveau] of mentions) sortie = sortie.replace(new RegExp(`(?<![\\w-])${ancienId}(?!\\w)`, 'g'), nouveau);
  if (ticketsMigres.has(ancien)) sortie = avecType(sortie);
  return sortie;
}

/** Un ticket sans ligne `Type:` dans son en-tête reçoit `Type: task`, sous sa ligne `Status:` (sinon sous son titre). */
function avecType(texte) {
  const lignes = texte.split('\n');
  const finEnTete = lignes.findIndex((l) => l.startsWith('## '));
  const enTete = finEnTete < 0 ? lignes : lignes.slice(0, finEnTete);
  if (enTete.some((l) => /^(?:- )?\**Type\**\s*:/i.test(l))) return texte;
  const status = enTete.findIndex((l) => /^(?:- )?\**Status\**\s*:/i.test(l));
  if (status >= 0) lignes.splice(status + 1, 0, 'Type: task');
  else {
    const titre = enTete.findIndex((l) => l.startsWith('# '));
    lignes.splice(titre + 1, 0, '', 'Type: task');
  }
  return lignes.join('\n');
}
if (!appliquer) process.exit(0);
for (const [ancien, nouveau] of deplaces) {
  if (ancien.startsWith('slug:')) continue;
  mkdirSync(`${racine}/${dirname(nouveau)}`, { recursive: true });
  git('mv', ancien, nouveau);
}
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
