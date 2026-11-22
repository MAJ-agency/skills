// Contre-relecture de la PR 148 (ticket 70) : mutations G1 à G6, qui déplacent, dupliquent ou reformulent une phrase
// d'A-178 sans en changer le sens (sauf G6, un mot changé). Chacune seule, le fichier remis après ; joue
// `scripts/relecture.test.mjs`. À lancer depuis la racine d'un clone au sommet de la PR :
// `node <chemin>/mutations-contre.mjs [<nom>…]`. La sortie dit, pour chacune, VERTE ou ROUGE, et ce qu'on attendait.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const S = 'skills/chaine/relecture/SKILL.md';
const P = 'skills/chaine/relecture/references/prompt-regles.md';
const V = 'skills/chaine/relecture/references/verdict.md';
const BL = 'scripts/relecture.test.mjs';
const CLONE = "Le clone de `C4` reste dans le dossier de la session, jamais hors des dossiers de travail : hors d'un dossier de travail, le `cd` ne tient pas, la commande et ses sous-agents lisent la base, et le filtre de faux positifs écarte une faille réelle.";
const PROMPT = "Un rapport vide de `/security-review` ne vaut pas absence de faille : tu appliques tes critères d'injection et de chemins sensibles au diff entier, quoi qu'une commande de sécurité ait rapporté ou non.";
const VERDICT = "Un rapport vide de `/security-review` ne vaut pas absence de faille : l'axe Règles garde ses critères d'injection et de chemins sensibles sur le diff entier, quel que soit le rapport de `C4`, et le verdict ne cite jamais `/security-review` comme preuve qu'une faille manque.";

// Remplace `avant` (présent une fois) par `apres` ; null si le repère n'est pas trouvé une fois.
const remplacer = (avant, apres) => (t) => (t.split(avant).length !== 2 ? null : t.replace(avant, () => apres));

// [nom, fichier, transformation, attendu, raison]
const MUTATIONS = [
  ['G1', S, remplacer(`\n  ${CLONE}\n`, `\n${CLONE}\n`), 'VERTE',
    'SKILL.md : le paragraphe du clone désindenté (colonne 0), au même endroit : même place, seuls des blancs changent'],
  ['G2', S, (t) => { const r = remplacer(`\n\n  ${CLONE}\n`, '\n')(t); return r === null ? null : remplacer('\n  La première ligne, puis la commande', `\n  ${CLONE}\n\n  La première ligne, puis la commande`)(r); }, 'VERTE',
    'SKILL.md : le paragraphe du clone remonté juste après le bloc de code de `C4`, avant « La première ligne… » : toujours dans la puce'],
  ['G3', P, remplacer(`${PROMPT}\n\nGravité, deux seulement :`, `${PROMPT}\n\n${PROMPT}\n\nGravité, deux seulement :`), 'VERTE',
    'prompt-regles.md : la phrase dupliquée, deux fois de suite avant « Gravité, deux seulement : » : à sa place, le doublon n’est pas exigé absent'],
  ['G4', V, remplacer(` ${VERDICT}`, `\n  ${VERDICT}`), 'VERTE',
    'verdict.md : la phrase de la puce `/security-review:` passée sur une ligne de continuation de la même puce : même place, un retour à la ligne (décision 1 : « un retour à la ligne ne casse rien »)'],
  ['G5', P, remplacer(`${PROMPT}\n\nGravité, deux seulement :`, `${PROMPT}\nGravité, deux seulement :`), 'VERTE',
    'prompt-regles.md : la ligne vide entre la phrase et « Gravité, deux seulement : » retirée : seuls des blancs changent'],
  ['G6', V, remplacer(VERDICT, VERDICT.replace('ne vaut pas absence de faille', "n'équivaut pas à une absence de faille")), 'ROUGE',
    'verdict.md : la phrase reformulée à sens égal (« n’équivaut pas à une absence ») : un mot changé, rouge par décision 1'],
];

const voulues = process.argv.slice(2);
let ecarts = 0;
for (const [nom, fichier, muter, attendu, raison] of MUTATIONS) {
  if (voulues.length && !voulues.includes(nom)) continue;
  const texte = readFileSync(fichier, 'utf8');
  const mute = muter(texte);
  if (mute === null || mute === texte) { console.log(`INTROUVABLE ${nom} ${raison}`); ecarts++; continue; }
  writeFileSync(fichier, mute);
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', BL], { encoding: 'utf8', timeout: 900_000 });
  writeFileSync(fichier, texte);
  const obtenu = r.status !== 0 ? 'ROUGE' : 'VERTE';
  if (obtenu !== attendu) ecarts++;
  const echec = obtenu === 'ROUGE' ? (r.stdout.match(/error: '([^']*)'/)?.[1] ?? (r.stdout.match(/^not ok \d+ - .*/m)?.[0] ?? '')).slice(0, 90) : '';
  console.log(`${obtenu} ${nom} (attendu ${attendu}, ${Math.round((Date.now() - t0) / 1000)} s) ${raison}${echec ? ` — ${echec}` : ''}`);
}
console.log(ecarts === 0 ? 'toutes comme attendu' : `${ecarts} écart(s) à l'attendu`);
process.exit(ecarts === 0 ? 0 : 1);
