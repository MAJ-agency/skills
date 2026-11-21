// Les mutations des tickets 67, 68 et 69 (une PR, suite du ticket 66) : chacune remplace un texte exact d'un fichier,
// joue les bancs qu'elle vise, et doit les rendre rouges ; le fichier est remis après chaque mutation. À lancer depuis
// la racine d'un clone où `ticket-67-68-69.patch` est appliqué : `node <chemin>/mutations.mjs [<nom>…]`.
// Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const R = 'skills/chaine/relecteur/scripts/relecteur.mjs';
const D = 'skills/chaine/fusionner/scripts/decision-relecteur.mjs';
const F = 'skills/chaine/sujet/scripts/faux-gh.mjs';
const S = 'skills/chaine/relecteur/SKILL.md';
const BR = 'skills/chaine/relecteur/scripts/relecteur.test.mjs';
const BD = 'skills/chaine/fusionner/scripts/decision-relecteur.test.mjs';
const BF = 'skills/chaine/sujet/scripts/faux-gh.test.mjs';
const BT = 'scripts/relecteur.test.mjs';

const MUTATIONS = [
  // Ticket 67 : la veille, la préparation, la tête relue.
  ['A1 veille : la sortie d’erreur d’une passe sortie en 5 jetée (R3)', R, '(r.status === 0 || r.status === 5) && r.stderr', 'r.status === 0 && r.stderr', [BR]],
  ['A2 veille : `--attendre` ignoré (R5)', R, "const differee = argv.includes('--attendre');", 'const differee = false;', [BR]],
  ['A3 veille : la première pause sans la borne de la durée (R5)', R, "      if (Date.now() + pause * 1000 > fin) break;\n      attendre(pause);", "      if (k > 0 && Date.now() + pause * 1000 > fin) break;\n      attendre(pause);", [BR]],
  ['A4 veille : `--attendre` attend après la première passe, pas avant (R5)', R, 'if (k > 0 || differee) {', 'if (k > 0) {', [BR]],
  ['A5 liste : la tête n’est pas relue avant d’être dite introuvable (18)', R, '  if (!presente()) rapatrier();\n', '', [BR]],
  ['A6 rapatrier : origin relu sur develop seul (la préparation et la tête relue, 18)', R, "const rapatrier = () => gitOk('fetch', '-q', '--prune', 'origin', '+refs/heads/*:refs/remotes/origin/*');", "const rapatrier = () => gitOk('fetch', '-q', '--prune', 'origin', '+refs/heads/develop:refs/remotes/origin/develop');", [BR]],
  ['A7 dépendances : la cause ne dit plus comment se retenter (17)', R, " ; retentée au prochain lockfile de develop, ou par un Relecteur neuf', a: 'architecte' };", "', a: 'architecte' };", [BR]],
  // Ticket 68 : une étiquette restée, un plafond à moitié écrit, une session à un autre couple.
  ['B1 jouer : une étiquette déjà posée ne rend jamais de ligne (le code d’avant, C11)', R, 'else if (poseeApres(n, g.poser, g.marque ?? null)) lignes = [];', 'else lignes = [];', [BR]],
  ['B2 jouer : une étiquette déjà posée rend toujours ses lignes', R, 'else if (poseeApres(n, g.poser, g.marque ?? null)) lignes = [];', 'else if (false) lignes = [];', [BR]],
  ['B3 poseeApres : une pose à la seconde de la marque vaut passage rejoué', R, 'return pose !== undefined && Date.parse(pose.created_at) > Date.parse(marque);', 'return pose !== undefined && Date.parse(pose.created_at) >= Date.parse(marque);', [BR]],
  ['B4 poseeApres : la première pose lue, pas la dernière', R, 'const pose = evenements.findLast((e) =>', 'const pose = evenements.find((e) =>', [BR]],
  ['B5 poseeApres : un retrait lu comme une pose', R, "(e) => e?.event === 'labeled' && typeof e.label?.name", "(e) => typeof e.label?.name", [BR]],
  ['B6 poseeApres : la pose d’une autre étiquette compte', R, " && e.label.name.normalize('NFC') === nom);", ');', [BR]],
  ['B7 poseeApres : le nom comparé sans NFC', R, "e.label.name.normalize('NFC') === nom", 'e.label.name === nom', [BR]],
  ['B8 decision : la marque est le premier commentaire, pas le plus récent à marque', R, 'commentaires[marques.dernier]?.created_at ?? null', 'commentaires[0]?.created_at ?? null', [BR]],
  ['B9 decision : une marque rendue au plafond aussi (ses lignes se tairaient au rejeu)', R, "geste.geste === 'etiqueter' ? { marque:", "['etiqueter', 'plafonner'].includes(geste.geste) ? { marque:", [BR]],
  ['B10 jouer : au plafond, le commentaire avant l’étiquette (l’ordre d’avant, C12)', R, "    if (!avant.includes(g.poser)) ecrire('poser_label', String(n), g.poser);\n    else if (poseeApres(n, g.poser, g.marque ?? null)) lignes = [];\n    joue = true;\n  }\n  // Au plafond, après l'étiquette : un commentaire refusé laisse le plafond à décider de nouveau, ses lignes entières.\n  if (g.geste === 'plafonner' || g.geste === 'panne' || g.geste === 'illisible') {\n    ecrire('commenter', String(n), g.commentaire);\n    joue = true;\n  }", "    if (g.geste === 'plafonner') ecrire('commenter', String(n), g.commentaire);\n    if (!avant.includes(g.poser)) ecrire('poser_label', String(n), g.poser);\n    else if (poseeApres(n, g.poser, g.marque ?? null)) lignes = [];\n    joue = true;\n  }\n  if (g.geste === 'panne' || g.geste === 'illisible') {\n    ecrire('commenter', String(n), g.commentaire);\n    joue = true;\n  }", [BR]],
  ['B11 jouer : l’ancienne étiquette jamais retirée, à aucun geste', R, "    joue = true;\n  }\n  for (const e of g.retirer ?? []) ecrire('retirer_label', String(n), e);", "    joue = true;\n  }\n  for (const e of []) ecrire('retirer_label', String(n), e);", [BR]],
  ['B12 --sessions : `couple` refusé (relecteur.mjs)', R, "const ETATS = ['vivante', 'morte', 'plafond', 'couple'];", "const ETATS = ['vivante', 'morte', 'plafond'];", [BR]],
  ['B13 décision : `couple` refusé', D, "const ETATS_DE_SESSION = ['vivante', 'morte', 'plafond', 'couple'];", "const ETATS_DE_SESSION = ['vivante', 'morte', 'plafond'];", [BD, BR]],
  ['B14 décision : une session `couple` n’est pas hors service', D, "['morte', 'plafond', 'couple'].includes(propre(connues, s))", "['morte', 'plafond'].includes(propre(connues, s))", [BD, BR]],
  ['B19 decision : la marque est la date du dernier verdict, pas celle de la marque la plus récente (`dernier`, A-183 point 6 ; G5 du tour de relecture)', R, '{ marque: commentaires[marques.dernier]?.created_at ?? null }', '{ marque: commentaires[marques.verdicts.at(-1)?.rang]?.created_at ?? null }', [BR]],
  ['B15 faux GitHub : la pose n’ajoute aucun événement', F, '    if (!(p.labels ?? []).includes(champs["labels[]"])) evenement(p, "labeled", champs["labels[]"]);\n', '', [BF, BR]],
  ['B16 faux GitHub : une étiquette déjà posée ajoute un événement', F, 'if (!(p.labels ?? []).includes(champs["labels[]"])) evenement(p, "labeled"', 'if (true) evenement(p, "labeled"', [BF]],
  ['B17 faux GitHub : le retrait n’ajoute aucun événement', F, '    evenement(p, "unlabeled", nom);\n', '', [BF]],
  ['B18 faux GitHub : les événements datés de l’heure de la machine, jamais de `maintenant`', F, 'created_at: etat.maintenant ?? new Date()', 'created_at: new Date()', [BF, BR]],
  // Ticket 69 : le texte du skill, chaque phrase à sa place.
  ['C1 SKILL.md : la relance de la veille déplacée hors de la puce `VEILLE ARRÊTÉE` (E1 du rapport, rejouée)', S, "avec la dernière ligne du journal ; quand cette suite dit « rejouer au réveil suivant » (9, 12, autre), relancer la veille avec `--attendre` : sa fin est ce réveil ;\n- **aucune de ces trois lignes** (l'outil a arrêté la veille) : comme `VEILLE FINIE`.", "avec la dernière ligne du journal ;\n- **aucune de ces trois lignes** (l'outil a arrêté la veille) : comme `VEILLE FINIE` ; quand cette suite dit « rejouer au réveil suivant » (9, 12, autre), relancer la veille avec `--attendre` : sa fin est ce réveil.", [BT]],
  ['C2 SKILL.md : la borne du couple (R2) retirée de « L’état des sessions »', S, " Une session seulement attendue (`rien`, raison `attente`) n'est `couple` que si `get_session` rend les deux champs et que l'un diffère ; un champ absent la laisse `vivante`, et elle ne s'écrit jamais `morte` pour son couple.", '', [BT]],
  ['C2b SKILL.md : le remplacement d’une session `couple` déplacé de « L’état des sessions » dans « Les lignes » (E2 du rapport, rejouée sur la phrase neuve)', S, " Une session `couple` est remplacée comme une morte, une fois par tour (`remplacer`, cause `couple`).\n\n## Les lignes\n\n", "\n\n## Les lignes\n\nUne session `couple` est remplacée comme une morte, une fois par tour (`remplacer`, cause `couple`). ", [BT]],
  ['C3 SKILL.md : la relance sans `--attendre`', S, 'relancer la veille avec `--attendre` : sa fin est ce réveil', 'relancer la veille : sa fin est ce réveil', [BT]],
  ['C4 SKILL.md : la sortie 9 sans borne (R5)', S, "| 9 | le verrou n'est pas venu en 5 minutes : rejouer au réveil suivant ; à la seconde fois, l'architecte, et s'arrêter |", "| 9 | le verrou n'est pas venu en 5 minutes : rejouer au réveil suivant |", [BT]],
  ['C5 SKILL.md : `--attendre` défini hors de « La veille »', S, " `--attendre` : une pause avant la première passe aussi, sous la même borne de 25 minutes ; sans lui, une panne de quelques secondes (une coupure de `git fetch`) se rejouerait aussitôt et compterait pour la seconde fois.", '', [BT]],
  ['C6 SKILL.md : l’état `couple` absent de la forme du fichier', S, '"vivante" | "morte" | "plafond" | "couple" }`', '"vivante" | "morte" | "plafond" }`', [BT]],
  ['C7 SKILL.md : `reecrire` ne remplace pas une session à un autre couple', S, 'sinon (`morte`, `plafond` ou `couple`) `jouer <n> --sessions <fichier>`', 'sinon `jouer <n> --sessions <fichier>`', [BT]],
  ['C8 SKILL.md : `reecrire` hors de la règle de « Créer ou relancer »', S, " `reecrire`, qui réemploie la session, suit cette règle de « Créer ou relancer » : sans les deux champs, `couple`.", '', [BT]],
  ['C9 SKILL.md : `send_message` en échec sans suite (16)', S, "`send_message` en échec (une ligne, ou le message de relance) : le rejouer une fois ; encore en échec, une ligne à l'architecte, « PR <n> : send_message en échec vers <session> : <sa dernière ligne non vide> », puis la suite du geste. Une ligne à l'architecte elle-même en échec deux fois : l'écrire dans sa réponse, et s'arrêter.\n\n", '', [BT]],
  ['C10 SKILL.md : les lignes à l’architecte redeviennent trois formes', S, 'ont quatre formes, et aucune autre', 'ont trois formes, et aucune autre', [BT]],
  ['C11 SKILL.md : la cause « create_session en échec » manque (R4)', S, " ; « create_session en échec : <sa dernière ligne non vide> »", '', [BT]],
  ['C12 SKILL.md : la forme d’une commande coupée sans code manque (R4)', S, ", ou « <sous-commande> sortie aucune : l'outil l'a arrêtée » pour une commande coupée sans code", '', [BT]],
  ['C13 SKILL.md : une étiquette restée tue ses lignes (C11)', S, " Une étiquette déjà là, posée avant la marque la plus récente de la PR (restée d'un tour d'avant, que l'auteur n'a pas retirée), n'est pas un passage rejoué : ses lignes partent.", '', [BT]],
  ['C14 SKILL.md : comment l’installation se retente, retiré de « Mise en place » (17)', S, " Une installation en échec ne se retente qu'au lockfile suivant de develop, ou dans un Relecteur neuf (son dossier est neuf) : la cause « dépendances de develop » le dit à l'architecte.", '', [BT]],
  ['C15 SKILL.md : après `VEILLE GESTE`, la veille relancée sans `--attendre` (A-184, point 3)', S, "« À chaque réveil », puis relancer la veille, avec `--attendre` si un geste de ce réveil a rendu une suite « rejouer au réveil suivant » ;\n- **`VEILLE FINIE`**", "« À chaque réveil », puis relancer la veille ;\n- **`VEILLE FINIE`**", [BT]],
  ['C16 SKILL.md : après `VEILLE FINIE`, la veille relancée sans `--attendre` (A-184, point 3)', S, "sinon « À chaque réveil », puis relancer la veille, avec `--attendre` si un geste de ce réveil a rendu une suite « rejouer au réveil suivant » ;", "sinon « À chaque réveil », puis relancer la veille ;", [BT]],
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
