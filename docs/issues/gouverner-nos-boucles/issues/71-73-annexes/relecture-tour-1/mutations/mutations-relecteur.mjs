// Les huit mutations du relecteur (tour 1 des tickets 71 à 73), sur le régime 8 : même banc d’essai que
// `71-73-annexes/mutations.mjs` (le texte qui suit la liste en est recopié tel quel). Depuis la racine d’un clone où
// `lot-5.patch` est appliqué : `node <chemin>/mutations-relecteur.mjs [R1 …]`. ROUGE : un banc la voit ; VERTE : aucun.
// `MUTATIONS_PARALLELE=<k>` : k mutations à la fois, chacune dans sa copie du clone (`git worktree`), 1 par défaut.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const F = 'skills/chaine/fusionner/scripts';
const R = `${F}/revue-exigee.mjs`;
const P = `${F}/passer.sh`;
const G = `${F}/github.sh`;
const RV = `${F}/renvoyer.sh`;
const S = 'skills/chaine/sujet/scripts/sujet.sh';
const FG = 'skills/chaine/sujet/scripts/faux-gh.mjs';
const T = 'skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.mjs';
const Y = 'skills/chaine/socle-chaine-de-production/references/ci/pr-titre.yml';
const RG = 'skills/chaine/socle-chaine-de-production/references/agent/regles.mjs';
const GF = 'skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.mjs';
const CS = 'skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs';
const TR = 'skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs';
const TK = 'skills/chaine/tickets/references/scripts/verify/tickets.mjs';
// Les bancs.
const BV = `${F}/verdict-du-capitaine.test.mjs`;
const BS = `${F}/sensibles-du-capitaine.test.mjs`;
const BM = `${F}/messages-du-regime.test.mjs`;
const BR = `${F}/revue-exigee.test.mjs`;
const BT = 'skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs';
const BF = 'skills/chaine/sujet/scripts/faux-gh.test.mjs';
const BSU = 'skills/chaine/sujet/scripts/sujet.test.mjs';
const BRG = 'skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs';
const BGF = 'skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.test.mjs';
const BCS = 'skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs';
const BTK = 'skills/chaine/tickets/references/scripts/verify/tickets.test.mjs';
const BTG = 'skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs';
const BP = 'scripts/points-d-entree.test.mjs';
const BFU = `${F}/fusionner.test.mjs`;

const MUTATIONS = [
  ['R1 github.sh : develop et les sujets ne sont plus relus avant les calculs (A-126)', G, "    git_masque fetch -q origin '+refs/heads/develop:refs/remotes/origin/develop' '+refs/heads/sujet/*:refs/remotes/origin/sujet/*' ||", '    true ||', [BV, BS]],
  ['R2 passer.sh : un push reçu avant la fusion ignoré au second contrôle', P, "    'sommet changé') quitter_capitaine; sortir 5 \"la PR a reçu un push avant la fusion, relancer\" ;;", "    'sommet changé') ;;", [BV]],
  ['R3 sujet.sh : `fusion-bloquée` posée pendant la CI ignorée au second contrôle', S, "  case \"$raison\" in\n    '') ;;\n    'sommet changé') sortir 5 \"la sous-PR #$n a reçu un push avant la fusion", "  case \"${raison/label fusion-bloquée/}\" in\n    '') ;;\n    'sommet changé') sortir 5 \"la sous-PR #$n a reçu un push avant la fusion", [BV]],
  ['R4 sujet.sh : une PR de mise à jour en régime 8 jugée sur sa résolution seule (retouches hors du verdict)', S, 'if [ "$REGIME" = 8 ] && [ -n "$maj" ] && { [ "$statut" = 0 ] || [ "$statut" = 1 ]; }; then', 'if false; then', [BV, BS]],
  ['R5 revue-exigee : « même contenu propre » toujours calculé contre develop', R, 'memeContenu[s] = memeContenuDe(s, tete, base);', "memeContenu[s] = memeContenuDe(s, tete, 'develop');", [BV]],
  ['R6 garde du capitaine : la première copie d’un ticket seule compte', CS, 'accords.push(copies.map((c) => c.chemins));', 'accords.push([copies[0].chemins]);', [BS]],
  ['R7 gate : une règle hors vigueur de l’index compte', TK, 'if (r && r.enVigueur) lus.push(r.niveau);', 'if (r) lus.push(r.niveau);', [BTK, BTG]],
  ['R8 garde du capitaine : une spec citée par le sujet ne vaut plus ses tickets', CS, ' && !(tickets !== undefined && t.startsWith(`${id}.`))', '', [BS]],
];

const voulues = process.argv.slice(2);
const choisies = MUTATIONS.filter(([nom]) => !voulues.length || voulues.some((v) => nom.startsWith(`${v} `) || (/^[ABC]$/.test(v) && nom.startsWith(v))));
const parallele = Math.max(1, Number(process.env.MUTATIONS_PARALLELE ?? 1));
const racine = process.cwd();

// Une mutation jouée dans `dossier` (le clone, ou une copie) : 'ROUGE', 'VERTE' ou 'INTROUVABLE'.
function jouer(dossier, [, fichier, avant, apres, bancs]) {
  const chemin = join(dossier, fichier);
  const texte = readFileSync(chemin, 'utf8');
  if (texte.split(avant).length !== 2) return 'INTROUVABLE';
  writeFileSync(chemin, texte.replace(avant, () => apres));
  try {
    const r = spawnSync(process.execPath, ['--test', ...bancs], { cwd: dossier, encoding: 'utf8', timeout: 900_000 });
    return r.status !== 0 ? 'ROUGE' : 'VERTE';
  } finally {
    writeFileSync(chemin, texte);
  }
}

let nonRouges = 0;
const dire = (nom, issue) => {
  if (issue !== 'ROUGE') nonRouges++;
  console.log(`${issue} ${nom}`);
};
if (parallele === 1) {
  for (const m of choisies) dire(m[0], jouer(racine, m));
} else {
  // Des copies du clone, une par file, l'arbre de travail recopié tel quel (le patch appliqué, non commité).
  const { Worker } = await import('node:worker_threads');
  const base = mkdtempSync(join(tmpdir(), 'mutations-lot-5-'));
  const copies = [];
  for (let k = 0; k < parallele; k++) {
    const d = join(base, `copie-${k}`);
    spawnSync('cp', ['-a', racine, d]);
    copies.push(d);
  }
  const files = copies.map(() => []);
  choisies.forEach((m, i) => files[i % parallele].push(m));
  const travail = `
    const { workerData, parentPort } = require('node:worker_threads');
    const { spawnSync } = require('node:child_process');
    const { readFileSync, writeFileSync } = require('node:fs');
    const { join } = require('node:path');
    for (const [nom, fichier, avant, apres, bancs] of workerData.file) {
      const chemin = join(workerData.dossier, fichier);
      const texte = readFileSync(chemin, 'utf8');
      if (texte.split(avant).length !== 2) { parentPort.postMessage([nom, 'INTROUVABLE']); continue; }
      writeFileSync(chemin, texte.replace(avant, () => apres));
      const r = spawnSync(process.execPath, ['--test', ...bancs], { cwd: workerData.dossier, encoding: 'utf8', timeout: 900000 });
      writeFileSync(chemin, texte);
      parentPort.postMessage([nom, r.status !== 0 ? 'ROUGE' : 'VERTE']);
    }`;
  await Promise.all(
    copies.map(
      (dossier, k) =>
        new Promise((fini) => {
          const w = new Worker(travail, { eval: true, workerData: { dossier, file: files[k] } });
          w.on('message', ([nom, issue]) => dire(nom, issue));
          w.on('exit', fini);
        }),
    ),
  );
  rmSync(base, { recursive: true, force: true });
}
console.log(nonRouges === 0 ? `toutes rouges (${choisies.length})` : `${nonRouges} mutation(s) non rouge(s) sur ${choisies.length}`);
process.exit(nonRouges === 0 ? 0 : 1);
