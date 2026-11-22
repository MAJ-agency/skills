// Les mutations du ticket 78 : chacune remplace un texte exact d'un fichier, joue les bancs qu'elle vise, et doit
// les rendre rouges ; le fichier est remis après chaque mutation. À lancer depuis la racine d'un clone où
// `ticket-78.patch` est appliqué : `node <chemin>/mutations.mjs [<nom>…]`.
// Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const PA = 'skills/chaine/fusionner/scripts/passer.sh';
const SU = 'skills/chaine/sujet/scripts/sujet.sh';
const CS = 'skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs';
const BS = 'skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs';

const MUTATIONS = [
  ["F1 passer.sh : une PR de fourche n'est pas sautée (le code d'avant, Q2 de la PR 149)", PA, "[ \"$(champ '.head.repo.full_name // \"\"')\" = \"$(champ '.base.repo.full_name // \"\"')\" ] ||\n  sortir 7", "true ||\n  sortir 7", [BS]],
  ["F2 passer.sh : une tête sans dépôt (fourche supprimée) passe pour une tête du dépôt", PA, "[ \"$(champ '.head.repo.full_name // \"\"')\" = ", "[ \"$(champ '.head.repo.full_name // .base.repo.full_name')\" = ", [BS]],
  ["F3 passer.sh : la garde de fourche après le fetch de la tête (la branche d'origin du même nom lue)", PA, "[ \"$(champ '.head.repo.full_name // \"\"')\" = \"$(champ '.base.repo.full_name // \"\"')\" ] ||\n  sortir 7 \"PR de fourche ($(champ '.head.repo.full_name // \"dépôt supprimé\"')) : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi\"\n", "", [BS]],
  ["F4 sujet.sh fusionner : une sous-PR de fourche n'est pas sautée", SU, "  [ \"$(jq -r '.head.repo.full_name // \"\"' <<<\"$pr\")\" = \"$(jq -r '.base.repo.full_name // \"\"' <<<\"$pr\")\" ] ||\n    sortir 7", "  true ||\n    sortir 7", [BS]],
  ["M1a sujet.sh fusionner : le régime n'est pas lu d'abord (deux revues au premier contrôle, le code d'avant en coût)", SU, "  [ -z \"$maj\" ] || prevu=$(regime_de_la_pr", "  [ -n \"$maj\" ] || prevu=$(regime_de_la_pr", [BS]],
  ["M1b sujet.sh fusionner : la revue n'est pas rejouée quand le régime relu diffère de celui lu d'abord", SU, "  if [ -n \"$maj\" ] && [ -n \"$REGIME\" ] && [ \"$REGIME\" != \"$prevu\" ]", "  if false && [ -n \"$REGIME\" ] && [ \"$REGIME\" != \"$prevu\" ]", [BS]],
  ["M1c sujet.sh fusionner : la liste d'une PR de mise à jour en régime 8 sans ses retouches", SU, "if [ \"$1\" = 8 ] && [ -n \"$maj\" ]; then printf '%s\\n%s\\n' \"$A_JUGER\" \"$MAJ_APRES\"", "if [ \"$1\" = 8 ] && [ -n \"$maj\" ]; then printf '%s\\n' \"$A_JUGER\"", [BS]],
  ["M2a chemins-sensibles.mjs : une PR de mise à jour sans ticket déclaré reçoit le motif d'une PR sans ticket (le code d'avant)", CS, "  if (ids.length === 0 && tickets !== undefined) throw new Motif(", "  if (false) throw new Motif(", [BS]],
  ["M2b chemins-sensibles.mjs : toute PR sans ticket reçoit le motif d'une PR de mise à jour", CS, "  if (ids.length === 0 && tickets !== undefined) throw new Motif(", "  if (ids.length === 0) throw new Motif(", [BS]],
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
