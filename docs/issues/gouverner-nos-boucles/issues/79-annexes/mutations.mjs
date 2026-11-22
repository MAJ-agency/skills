// Les mutations du ticket 79 : chacune remplace un texte exact d'un fichier, joue les bancs qu'elle vise, et doit
// les rendre rouges ; le fichier est remis après chaque mutation. À lancer depuis la racine d'un clone où
// `ticket-79.patch` est appliqué : `node <chemin>/mutations.mjs [<nom>…]`.
// Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const G = 'skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.mjs';
const RG = 'skills/chaine/socle-chaine-de-production/references/agent/regles.mjs';
const BG = 'skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.test.mjs';
const BRG = 'skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs';

const MUTATIONS = [
  ["H1 garde-fichiers.mjs : l'héritage jugé contre la copie locale de develop, sans la confirmer (le code d'avant, M4 de la PR 149)", G, "const developConfirme = develop !== null && distants.get('refs/heads/develop') === develop;", "const developConfirme = develop !== null;", [BG]],
  ["H2 garde-fichiers.mjs : develop non confirmé, sans geste (la copie compte, le refus ne dit pas de relire develop)", G, "    if (developPerime && !perimees.includes('origin/develop')) perimees.push('origin/develop');\n", "", [BG]],
  ["H3 garde-fichiers.mjs : develop non confirmé, la copie du sujet dite héritée (la garde ouverte)", G, "      if (!developConfirme) {\n        developPerime = true;\n        return false;\n      }", "      if (!developConfirme) {\n        developPerime = true;\n        return true;\n      }", [BG]],
  ["H4 garde-fichiers.mjs : le clone dit superficiel à toute base de fusion qui ne se lit pas (T2 du quatrième tour, constat 23)", G, "          superficiel ||= git('rev-parse', '--is-shallow-repository') === 'true';", "          superficiel = true;", [BG]],
  ["H5 regles.mjs : le geste après la raison, entre parenthèses (l'ordre d'avant, constat 24)", RG, "      ? `${c} : d'abord, ${gestes.join(', puis ')}, puis refaire l'écriture. Encore refusée : ${RAISON_SENSIBLE}${detail}`", "      ? `${c} : ${RAISON_SENSIBLE}${detail} (Avant d'écrire au conducteur : ${gestes.join(', puis ')}, puis refaire l'écriture.)`", [BG, BRG]],
  ["H6 regles.mjs : le geste en tête, sans « puis refaire l'écriture »", RG, "${gestes.join(', puis ')}, puis refaire l'écriture. Encore refusée :", "${gestes.join(', puis ')}. Encore refusée :", [BG, BRG]],
  ["H7 regles.mjs : « Aucune ligne lue » perdu quand un geste est dit", RG, "    return refus(' (Aucune ligne lue : branche sans ticket, ticket absent de origin/sujet/* et de origin/develop, ou origin injoignable.)');", "    return refus(gestes.length > 0 ? '' : ' (Aucune ligne lue : branche sans ticket, ticket absent de origin/sujet/* et de origin/develop, ou origin injoignable.)');", [BG, BRG]],
  ["H8 regles.mjs : le geste du clone superficiel oublié quand il suit celui des copies", RG, "    ...(lu?.superficiel\n", "    ...(lu?.superficiel && !lu?.perimees\n", [BG, BRG]],
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
  const r = spawnSync(process.execPath, ['--test', ...bancs], { encoding: 'utf8', timeout: 900_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? (r.status === null ? 'ROUGE(délai)' : 'ROUGE') : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
