// Les mutations de la contre-relecture de la PR 152 (sommet 4afd6e2), en plus des 19 des annexes 78 et 79 : chacune
// remplace un texte exact, joue les bancs qu'elle vise, et doit les rendre rouges ; le fichier est remis après chaque
// mutation. Même mécanique que `78-annexes/mutations.mjs`. À lancer depuis la racine d'un clone au sommet de la PR (X1 à
// X4 : avec ou sans la retouche ; P1 à P5 : avec `retouches/retouche-152-tour-1.patch`) :
// `node <chemin>/mutations-contre-relecture.mjs [<nom>…]`.
// Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const SU = 'skills/chaine/sujet/scripts/sujet.sh';
const BO = 'skills/chaine/fusionner/scripts/boucle.sh';
const BS = 'skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs';
const UN = 'skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs';
const FOURCHE = '  [[ "$fin" == "#$1 : PR de fourche ("*") : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi" ]]';
const NOMME = 'fourche) echo "[#$n] sous-PR de fourche, sautée (aucun renvoi) : elle ne tient pas ${etat%% :*}" ;;\n';
const GARDE_F = "avant tout fetch de sa tête.\n  [ \"$(jq -r '.head.repo.full_name // \"\"' <<<\"$pr\")\" = ";
const GARDE_R = "pousserait sur la branche d'origin du même nom.\n  [ \"$(jq -r '.head.repo.full_name // \"\"' <<<\"$pr\")\" = ";

const MUTATIONS = [
  // F2 de l'annexe 78, portée sur les deux gardes de sujet.sh : une tête sans dépôt (fourche supprimée, `head.repo` nul)
  // passe pour une tête du dépôt ; le capitaine lit, fusionne ou pousse alors la branche d'origin du même nom.
  ["X1 sujet.sh fusionner : une tête sans dépôt (fourche supprimée) passe pour une tête du dépôt", SU, GARDE_F, GARDE_F.replace(`// ""'`, "// .base.repo.full_name'"), [BS]],
  ["X2 sujet.sh relancer : une tête sans dépôt (fourche supprimée) passe pour une tête du dépôt", SU, GARDE_R, GARDE_R.replace(`// ""'`, "// .base.repo.full_name'"), [BS]],
  // La garde de `fusionner` qui ne joue qu'en régime 8, le régime lu sans réseau sur la copie locale du sujet : avant
  // tout fetch, comme la décision le veut, mais pas « dans les deux régimes ».
  ["X3 sujet.sh fusionner : la garde de fourche ne joue qu'en régime 8", SU, GARDE_F, "avant tout fetch de sa tête.\n  [ \"$(regime_de_la_pr \"$(jq -r .base.ref <<<\"$pr\")\" \"$(jq -r '.created_at // \"\"' <<<\"$pr\")\")\" != 8 ] || [ \"$(jq -r '.head.repo.full_name // \"\"' <<<\"$pr\")\" = ", [BS]],
  // Le premier contrôle rejoué sur la liste du régime 8 quel que soit le régime relu (le sens 8 → 7 de la décision 2).
  ["X4 sujet.sh fusionner : la revue rejouée toujours sur la liste du régime 8", SU, '    lus=$(lister "$REGIME")', '    lus=$(lister 8)', [BS]],
  // La retouche du tour 1, point 2 (A-201) : une sous-PR de fourche ne tient pas son sujet dans boucle.sh. Ne s'appliquent
  // que sur un arbre où `retouches/retouche-152-tour-1.patch` est posé (sinon INTROUVABLE).
  ["P1 boucle.sh : la fourche n'est pas reconnue (le code de 4afd6e2 : elle tient son sujet)", BO, FOURCHE, '  false', [BS]],
  ["P2 boucle.sh : la fourche reconnue après relancer seulement (fusionner : elle tient son sujet)", BO, '        rc=${PIPESTATUS[0]}\n        [ "$rc" != 7 ] || ! fourche_sautee "$n" "$sortie" || rc=fourche\n        geste="sortie $rc de fusionner"', '        rc=${PIPESTATUS[0]}\n        geste="sortie $rc de fusionner"', [BS]],
  ["P3 boucle.sh : la fourche reconnue après fusionner seulement (relancer : elle tient son sujet)", BO, '        [ "$rc" != 7 ] || ! fourche_sautee "$n" "$sortie" || rc=fourche\n        geste="sortie $rc de relancer"', '        geste="sortie $rc de relancer"', [BS]],
  ["P4 boucle.sh : le sujet rendu, mais la ligne de relancer ne nomme pas la fourche", BO, `          ${NOMME}          7) echo "[#$n] en passage`, '          fourche) echo "[#$n] en passage chez un autre capitaine : sautée (aucun renvoi)" ;;\n          7) echo "[#$n] en passage', [BS]],
  ["P5 boucle.sh : toute sortie 7 rend le sujet (le verrou d'un autre capitaine compris)", BO, FOURCHE, '  true', [UN]],
];

const voulues = process.argv.slice(2);
let vertes = 0;
for (const [nom, fichier, avant, apres, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  if (texte.split(avant).length !== 2 || avant === apres) {
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
