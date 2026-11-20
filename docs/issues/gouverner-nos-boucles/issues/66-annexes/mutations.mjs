// Les mutations du ticket 66 : chacune remplace un texte exact d'un fichier, joue les bancs qu'elle vise, et doit
// les rendre rouges ; le fichier est remis après chaque mutation. À lancer depuis la racine d'un clone où le ticket
// est appliqué : `node <chemin>/mutations.mjs [<nom>…]`. Sortie 0 : toutes rouges ; 1 : une au moins verte, nommée.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const D = 'skills/chaine/fusionner/scripts/decision-relecteur.mjs';
const R = 'skills/chaine/relecteur/scripts/relecteur.mjs';
const F = 'skills/chaine/sujet/scripts/faux-gh.mjs';
const BD = 'skills/chaine/fusionner/scripts/decision-relecteur.test.mjs';
const BR = 'skills/chaine/relecteur/scripts/relecteur.test.mjs';
const BL = 'scripts/relecture.test.mjs';
const BT = 'scripts/relecteur.test.mjs';
const BF = 'skills/chaine/sujet/scripts/faux-gh.test.mjs';
const BP = 'scripts/points-d-entree.test.mjs';

const MUTATIONS = [
  ['M1 compter : un refus sans « lancée » se relit incomplet (le code d’avant)', D, "v.verdict !== 'refusé' && (v.illisible", "(v.illisible", [BD, BL, BR]],
  ['M2 compter : un refus sur un autre sommet se relit incomplet', D, "v.verdict !== 'refusé' && (v.illisible || v.sommet !== sommet || (sensible && v.securite !== 'lancée'))", "v.sommet !== sommet || (v.verdict !== 'refusé' && (v.illisible || (sensible && v.securite !== 'lancée')))", [BD]],
  ['M3 compter : plus aucun verdict n’exige « lancée »', D, "(sensible && v.securite !== 'lancée')", 'false', [BD, BL, BR]],
  ['M4 jouer : l’ancienne étiquette retirée avant que la nouvelle soit posée', R, "    if (avant.includes(g.poser)) lignes = [];\n    else ecrire('poser_label', String(n), g.poser);\n    for (const e of g.retirer) ecrire('retirer_label', String(n), e);", "    for (const e of g.retirer) ecrire('retirer_label', String(n), e);\n    if (avant.includes(g.poser)) lignes = [];\n    else ecrire('poser_label', String(n), g.poser);", [BR]],
  ['M5 jouer : les lignes repartent quand l’étiquette était déjà posée', R, 'if (avant.includes(g.poser)) lignes = [];\n    else ecrire', 'if (avant.includes(g.poser)) lignes = lignes;\n    else ecrire', [BR]],
  ['M6 jouer : la nouvelle étiquette n’est jamais posée', R, "else ecrire('poser_label', String(n), g.poser);", 'else lignes = lignes;', [BR]],
  ['M7 jouer : le commentaire du plafond n’est pas écrit', R, "    ecrire('commenter', String(n), g.commentaire);\n    joue = true;", '    joue = true;', [BR]],
  ['M8 régime : la date d’ouverture n’est pas comparée à `depuis`', R, "!(Date.parse(json.created_at) > cle.depuis)", 'false', [BR]],
  ['M9 contrat : une clé `relecture` mal formée est lue comme absente', R, "if (cle === 'illisible') return", "if (cle === 'illisible-jamais') return", [BR]],
  ['M10 contrat : `delai` n’est plus vérifié', R, "if (r.delai !== undefined && !(Number.isSafeInteger(r.delai) && r.delai >= 1)) return 'illisible';", '', [BR]],
  ['M11 diff propre : une sous-PR vers un sujet lue à trois points contre develop', R, "  const a = jouer('bash', [join(CHAINE, 'sujet.sh'), 'a-juger', tete, base, String(n)]);", "  const a = { status: 0, stdout: git('-c', 'core.quotePath=false', 'diff', '--no-renames', '--name-only', `refs/remotes/origin/develop...${tete}`).stdout };", [BR]],
  ['M12 diff propre illisible : « double relecture » rendue 1', R, "if (fichiers === null) return 'illisible';", 'if (fichiers === null) return 1;', [BR]],
  ['M13 chemins sensibles : un chemin touché ne rend plus la PR sensible', R, "return r.status !== 0 || r.stdout.trim() !== '';", 'return r.status !== 0;', [BR]],
  ['M14 « même contenu propre » toujours « différent »', R, "memeContenu[s] = r.status === 0 ? true :", 'memeContenu[s] = r.status === -1 ? true :', [BR]],
  ['M15 couple : une PR sensible reçoit le couple ordinaire', R, "? cle.sensible : cle.ordinaire", '? cle.ordinaire : cle.ordinaire', [BR]],
  ['M16 distribuer : le geste n’est pas refait, la distribution part quand même', R, "if (attendu === undefined) arreter(3,", "if (attendu === null) arreter(3,", [BR]],
  ['M17 distribuer : la remplaçante s’ajoute au lieu de remplacer', R, "sessions: g.sessions.map((s) => (s === g.session ? ids[0] : s)), mention: 'remplace'", "sessions: [...g.sessions, ids[0]], mention: 'remplace'", [BR]],
  ['M18 distribuer : la relance n’est pas tracée', R, "mention: 'relance', cible: g.session", 'mention: null, cible: null', [BR]],
  ['M19 distribuer : une remplaçante qui est déjà du tour est admise', R, "if (g.geste !== 'distribuer' && ids.some((s) => g.sessions.includes(s)))", 'if (false)', [BR]],
  ['M20 préparer : le clone superficiel n’est pas approfondi', R, "gitOk('fetch', '-q', '--unshallow', 'origin');", ';', [BR]],
  ['M21 préparer : un dossier sale est accepté', R, "if (sale.status !== 0 || sale.stdout.trim() !== '')", 'if (sale.status !== 0)', [BR]],
  ['M22 préparer : les calculs manquants ne sont pas vus', R, "if (manque.length > 0) arreter(6,", 'if (manque.length > 99) arreter(6,', [BR]],
  ['M23 dépendances : installées à chaque passe', R, "readFileSync(temoin, 'utf8').trim() === empreinte", "readFileSync(temoin, 'utf8').trim() === 'jamais'", [BR]],
  ['M24 écriture refusée : passée sous silence', R, "if (r.status !== 0) arreter(7,", 'if (r.status === 99) arreter(7,', [BR]],
  ['M25 veille : une attente la réveille', R, "!['rien', 'hors-regime', 'pause'].includes(g.geste)", "!['hors-regime', 'pause'].includes(g.geste)", [BR]],
  ['M26 veille : `--taire` ignoré', R, '&& !taire.has(g.pr)', '', [BR]],
  ['M27 veille : GitHub illisible l’arrête', R, 'if (r.status === 5) {', 'if (r.status === -5) {', [BR]],
  ['M28 relecteur.mjs ne reconnaît plus son point d’entrée', R, 'return realpathSync(ICI) === realpathSync(process.argv[1]);', 'return ICI === process.argv[1];', [BP]],
  ['M29 faux GitHub : plus de date d’ouverture', F, '    created_at: pr.created_at ?? "2026-11-17T11:00:00Z",\n', '', [BF, BR]],
  ['M30 faux GitHub : `maintenant` ignoré', F, 'etat.maintenant ? { body: champs.body, created_at: etat.maintenant } : champs.body', 'champs.body', [BF, BR]],
  ['M31 labels.sh : `à-reprendre` manque', 'skills/chaine/socle-chaine-de-production/references/labels.sh', 'à-reprendre|C2410C|', 'a-reprendre|C2410C|', [BT]],
  ['M32 gabarit : la commande du Relecteur n’est plus en première ligne', 'skills/chaine/architecte/references/lancement.md', '```text\n/maj-skills:relecteur\n', '```text\nRelecteur :\n/maj-skills:relecteur\n', [BT]],
  ['M33 prompt de session : la commande du skill relecture n’est plus en tête', 'skills/chaine/relecteur/references/prompt-session.md', '```text\n/maj-skills:relecture <n> <tour> <sommet>\n', '```text\nRelecture : /maj-skills:relecture <n> <tour> <sommet>\n', [BT]],
  ['M34 verdict.md : la limite de `compter` revient', 'skills/chaine/relecture/references/verdict.md', '**Un refus reste un refus.**', '**Limite connue.** **Un refus reste un refus.**', [BL]],
  ['M35 A-178 : la phrase du rapport vide retirée de criteres-session.md', 'skills/chaine/relecture/references/criteres-session.md', '**Un rapport vide de `/security-review` ne vaut pas absence de faille**', 'Un rapport', [BL]],
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
  const r = spawnSync(process.execPath, ['--test', ...bancs], { encoding: 'utf8', timeout: 600_000 });
  writeFileSync(fichier, texte);
  const rouge = r.status !== 0;
  if (!rouge) vertes++;
  console.log(`${rouge ? 'ROUGE' : 'VERTE'} ${nom}`);
}
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
