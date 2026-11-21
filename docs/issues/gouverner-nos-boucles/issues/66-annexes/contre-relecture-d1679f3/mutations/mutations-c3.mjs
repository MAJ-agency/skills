// Contre-relecture de la PR 146, troisième tour : trois mutations E1 à E3, sur les deux phrases du delta a32476a..643dd10 (les
// retouches du second tour, R1 et R2). Même mécanique que mutations-c1.mjs. À lancer depuis la racine de l'arbre :
// `node <chemin>/mutations-c3.mjs [E<n>…]`. Sortie 0 : toutes rouges ; 1 : une au moins verte, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const S = 'skills/chaine/relecteur/SKILL.md';
const BT = 'scripts/relecteur.test.mjs';

const MUTATIONS = [
  ['E1 SKILL.md : la relance de la veille déplacée sur la puce d’après (hors de `VEILLE ARRÊTÉE`)', S, "avec la dernière ligne du journal ; quand cette suite dit « rejouer au réveil suivant » (9, 12, autre), relancer la veille : sa fin est ce réveil ;\n- **aucune de ces trois lignes** (l'outil a arrêté la veille) : comme `VEILLE FINIE`.", "avec la dernière ligne du journal ;\n- **aucune de ces trois lignes** (l'outil a arrêté la veille) : comme `VEILLE FINIE` ; quand cette suite dit « rejouer au réveil suivant » (9, 12, autre), relancer la veille : sa fin est ce réveil.", [BT]],
  ['E2 SKILL.md : la borne du couple déplacée de « L’état des sessions » dans « Les lignes »', S, " Le couple ne se lit que pour réemployer une session (« Créer ou relancer ») : une session seulement attendue (`rien`, raison `attente`) ne s'écrit jamais `morte` pour son couple.\n\n## Les lignes\n\n", "\n\n## Les lignes\n\nLe couple ne se lit que pour réemployer une session (« Créer ou relancer ») : une session seulement attendue (`rien`, raison `attente`) ne s'écrit jamais `morte` pour son couple. ", [BT]],
  ['E3 SKILL.md : la sortie 9 retirée des sorties qui relancent la veille', S, '« rejouer au réveil suivant » (9, 12, autre)', '« rejouer au réveil suivant » (12, autre)', [BT]],
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
