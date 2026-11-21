// Les mutations du ticket 70 : chacune déplace ou retire une phrase d'A-178, joue `scripts/relecture.test.mjs`, et doit
// le rendre rouge ; le fichier est remis après chaque mutation. À lancer depuis la racine d'un clone où
// `ticket-70.patch` est appliqué : `node <chemin>/mutations.mjs [<nom>…]`. Sortie 0 : toutes rouges.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const S = 'skills/chaine/relecture/SKILL.md';
const P = 'skills/chaine/relecture/references/prompt-regles.md';
const V = 'skills/chaine/relecture/references/verdict.md';
const BL = 'scripts/relecture.test.mjs';
const CLONE = "Le clone de `C4` reste dans le dossier de la session, jamais hors des dossiers de travail : hors d'un dossier de travail, le `cd` ne tient pas, la commande et ses sous-agents lisent la base, et le filtre de faux positifs écarte une faille réelle.";
const PROMPT = "Un rapport vide de `/security-review` ne vaut pas absence de faille : tu appliques tes critères d'injection et de chemins sensibles au diff entier, quoi qu'une commande de sécurité ait rapporté ou non.";
const VERDICT = " Un rapport vide de `/security-review` ne vaut pas absence de faille : l'axe Règles garde ses critères d'injection et de chemins sensibles sur le diff entier, quel que soit le rapport de `C4`, et le verdict ne cite jamais `/security-review` comme preuve qu'une faille manque.";

// Une mutation : [nom, fichier, transformation du texte entier]. `deplacer` retire `phrase` (une fois) et la pose
// juste avant `repere` (une fois).
const deplacer = (phrase, repere) => (t) => {
  if (t.split(phrase).length !== 2 || t.split(repere).length !== 2) return null;
  return t.replace(phrase, '').replace(repere, `${phrase.trim()}\n\n${repere}`);
};
const MUTATIONS = [
  ['F1 SKILL.md : le paragraphe du clone déplacé de la puce `C4` à la fin de l’étape 2 (M4 de la contre-relecture de la PR 145)', S, deplacer(`\n  ${CLONE}\n`, '## Étape 3 — Le diff relu')],
  ['F2 SKILL.md : le paragraphe du clone déplacé avant la puce `C4` (dans la puce `C3`)', S, deplacer(`\n  ${CLONE}\n`, '- **`C4`, `/security-review`**')],
  ['F3 SKILL.md : le paragraphe du clone déplacé dans l’étape 6', S, deplacer(`\n  ${CLONE}\n`, "## Étape 7 — Trier avant d'écrire")],
  ['F4 prompt-regles.md : la phrase déplacée après la liste des gravités', P, (t) => { const r = deplacer(`${PROMPT}\n\n`, 'Gravité, deux seulement :')(t); return r === null ? null : r.replace(`${PROMPT}\n\nGravité, deux seulement :`, 'Gravité, deux seulement :').replace('\n- doute :', `\n${PROMPT}\n- doute :`); }],
  ['F5 prompt-regles.md : la phrase déplacée en tête du prompt', P, (t) => (t.split(`${PROMPT}\n\n`).length !== 2 ? null : `${PROMPT}\n\n${t.replace(`${PROMPT}\n\n`, '')}`)],
  ['F6 verdict.md : la phrase sortie de la puce `/security-review:`, en paragraphe après elle', V, (t) => (t.split(VERDICT).length !== 2 ? null : t.replace(VERDICT, '').replace('\n\n**Un refus reste un refus.**', `\n\n${VERDICT.trim()}\n\n**Un refus reste un refus.**`))],
  ['F7 verdict.md : la phrase retirée', V, (t) => (t.split(VERDICT).length !== 2 ? null : t.replace(VERDICT, ''))],
];

const voulues = process.argv.slice(2);
let vertes = 0;
for (const [nom, fichier, muter] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `))) continue;
  const texte = readFileSync(fichier, 'utf8');
  const mute = muter(texte);
  if (mute === null || mute === texte) {
    console.log(`INTROUVABLE ${nom}`);
    vertes++;
    continue;
  }
  writeFileSync(fichier, mute);
  const t0 = Date.now();
  const r = spawnSync(process.execPath, ['--test', BL], { encoding: 'utf8', timeout: 900_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? 'ROUGE' : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
