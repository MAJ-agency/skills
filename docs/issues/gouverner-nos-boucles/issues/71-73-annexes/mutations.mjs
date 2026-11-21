// Les mutations des tickets 71 (lot 5a, A…), 72 (lot 5b, B…) et 73 (lot 5c, C…), A31 à A34, B25 à B27, C18 et C19 ajoutées
// après la relecture des tickets (A-186) : chacune remplace un texte exact d'un
// fichier, joue les bancs qu'elle vise, et doit les rendre rouges ; le fichier est remis après chaque mutation. À lancer
// depuis la racine d'un clone où `lot-5.patch` est appliqué : `node <chemin>/mutations.mjs [<nom>…]` (`A`, `B`, `C` : une
// série ; `A7` : une mutation). Sortie 0 : toutes rouges ; 1 : une au moins verte ou introuvable, nommée.
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
  // ── Ticket 71, lot 5a : le verdict au passage du capitaine ────────────────────────────────────────────────────
  ['A1 régime 8 : la section de revue encore exigée', R, 'if (regime === 8) return [motifTitreSansCode', 'if (regime === 9) return [motifTitreSansCode', [BR, BV, BT]],
  ['A2 régime : une PR ouverte à l’instant de `depuis` est en régime 8', R, 'regime: t > cle.depuis ? 8 : 7', 'regime: t >= cle.depuis ? 8 : 7', [BR, BV]],
  ['A3 régime : une clé mal formée lue comme absente', R, "if (cle === 'illisible') return { illisible:", "if (cle === 'jamais') return { illisible:", [BR, BV]],
  ['A4 régime : une date d’ouverture illisible ignorée', R, "if (typeof ouverte !== 'string' || !Number.isFinite(t)) return", 'if (false) return', [BR, BT]],
  ['A5 régime : une base hors de la chaîne lue sur son contrat', R, "if (nom !== 'develop' && !/^sujet\\/[A-Za-z0-9._-]+$/.test(nom)) return { regime: 7 };", '', [BR]],
  ['A6 clé : `delai` n’est plus vérifié', R, "if (r.delai !== undefined && !(Number.isSafeInteger(r.delai) && r.delai >= 1)) return 'illisible';", '', [BR]],
  ['A7 verdict : tout tour vaut validé', R, 'if (tour !== null) return { tour };', 'return { tour: tour ?? { numero: 0, sommet: tete } };', [BR, BV]],
  ['A8 verdict : le chemin sensible n’est jamais vu', R, 'const sensible = fichiers.length > 0 && cheminSensible(fichiers, lireBase(`origin/${base}`)) !== null;', 'const sensible = false;', [BV]],
  ['A9 verdict : un seul verdict toujours exigé', R, "return r.status === 0 ? 1 : r.status === 20 ? 2 : 'illisible';", 'return 1;', [BV]],
  ['A10 verdict : « même contenu propre » toujours « différent »', R, 'return r.status === 0 ? true : r.status === 20 ? false :', 'return r.status === -1 ? true : r.status === 20 ? false :', [BV]],
  ['A11 verdict : un illisible renvoie au lieu de sauter', R, 'if (e instanceof LectureIllisible) throw new Illisible(e.message);', 'if (e instanceof LectureIllisible) return { motif: e.message };', [BV]],
  ['A12 CLI : le régime 8 validé ne se dit plus (pas de second contrôle)', R, 'process.stdout.write(`régime 8 : tour ${lu.tour.numero}', 'process.stdout.write(`tour ${lu.tour.numero}', [BV]],
  ['A13 CLI : le régime ne se dit plus sur un refus', R, "const enTete = options.ouverte === undefined ? '' : `régime ${regime}\\n`;", "const enTete = '';", [BV]],
  ['A14 CLI : des options incomplètes admises', R, 'return n === 4 && /^[0-9a-f]{40}$/.test(options.tete)', 'return n >= 1 && /^[0-9a-f]{40}$/.test(options.tete ?? "a".repeat(40))', [BR]],
  ['A15 github.sh : GitHub illisible sur les commentaires lu comme une file vide', G, 'brut=$(lire_github "$DEPOT/issues/$(jq -r .number <<<"$pr")/comments?per_page=100" --paginate) || return 5', 'brut=$(lire_github "$DEPOT/issues/$(jq -r .number <<<"$pr")/comments?per_page=100" --paginate) || brut=[]', [BV]],
  ['A16 passer.sh : plus de second contrôle', P, 'if [ "$regime" = 8 ]; then\n  pr_relu=', 'if [ "$regime" = 9 ]; then\n  pr_relu=', [BV]],
  ['A17 passer.sh : `à-fusionner` retirée pendant la CI, fusionnée quand même', P, '    *) quitter_capitaine; sortir 7 "PR plus éligible juste avant la fusion ($raison) : sautée" ;;', '    *) : ;;', [BV]],
  ['A18 passer.sh : une pile en régime 8 admise', P, '[ "$regime" != 8 ] || [ "$base" = develop ] ||', '[ "$regime" != 8 ] || true ||', [BV]],
  ['A19 passer.sh : un illisible renvoyé', P, '    21) sortir 7 "$(tail -n 1 <<<"$revue") : sautée sans renvoi', '    21) sortir 4 "$(tail -n 1 <<<"$revue") : sautée sans renvoi', [BV]],
  ['A20 passer.sh : sans verdict, sauté au lieu d’être renvoyé', P, '    1) sortir 4 "$(tail -n 1 <<<"$revue")" ;;', '    1) sortir 7 "$(tail -n 1 <<<"$revue")" ;;', [BV]],
  ['A21 sujet.sh : plus de premier contrôle', S, '  juger_revue "$n" "$statut" "$revu"\n  # Régime 8, les gardes', '  true\n  # Régime 8, les gardes', [BV]],
  ['A22 sujet.sh : plus de second contrôle d’une sous-PR', S, '[ "$REGIME" != 8 ] || verdict_avant_fusion "$n" "$sommet" "$(git', '[ "$REGIME" != 9 ] || verdict_avant_fusion "$n" "$sommet" "$(git', [BV]],
  ['A23 sujet.sh : une PR de mise à jour jugée comme en régime 7 avant d’avancer', S, 'if [ "$REGIME" = 8 ]; then verdict_avant_fusion "$n" "$sommet" "$lus" "$base"; else juger_retouches "$n"; fi', 'juger_retouches "$n"', [BV]],
  ['A24 sujet.sh : `à-fusionner` relue nulle part', S, '    *) sortir 7 "#$n : PR plus éligible juste avant la fusion ($raison) : sautée" ;;', '    *) : ;;', [BV]],
  ['A25 pr-titre : le régime n’est pas passé aux motifs', T, 'fichiers: liste, base, regime: lu.regime })', 'fichiers: liste, base, regime: 7 })', [BT]],
  ['A26 pr-titre : un régime illisible passe', T, 'if (lu.illisible) echouer(3,', 'if (false) echouer(3,', [BT]],
  ['A27 workflow : `PR_OUVERTE` n’est plus donnée', Y, '          PR_OUVERTE: ${{ github.event.pull_request.created_at }}\n', '', [BT]],
  ['A28 faux GitHub : un commentaire de `pendantCi` ne tombe jamais', FG, 'if (suivant.commentaire !== undefined) cible.commentaires', 'if (false) cible.commentaires', [BF, BV]],
  ['A29 faux GitHub : les étiquettes de `pendantCi` ne changent jamais', FG, 'else if (suivant.labels !== undefined) cible.labels = [...suivant.labels];', 'else if (suivant.labels !== undefined) cible.labels = cible.labels;', [BF, BV]],
  ['A30 github.sh : la clé `relecture` absente, les commentaires lus quand même (régime 7 : une lecture de plus)', G, 'if cle_relecture_sur "origin/$base"; then', 'if true; then', [BFU]],
  // Relecture des tickets (A-186) : le régime 7 tel que main, les gestes sans banc.
  ['A31 régime 7 : un contrat illisible qui ne nomme pas la clé est sauté (A-186)', R, "return /\"relecture\"/.test(texte) ? 'illisible' : null;", "return 'illisible';", [BR, BV]],
  ['A32 github.sh : develop et les sujets ne sont plus relus avant les calculs (A-126)', G, "    git_masque fetch -q origin '+refs/heads/develop:refs/remotes/origin/develop' '+refs/heads/sujet/*:refs/remotes/origin/sujet/*' ||", '    true ||', [BV]],
  ['A33 sujet.sh : `fusion-bloquée` posée pendant la CI ignorée au second contrôle', S, "  case \"$raison\" in\n    '') ;;\n    'sommet changé') sortir 5 \"la sous-PR #$n a reçu un push avant la fusion", "  case \"${raison/label fusion-bloquée/}\" in\n    '') ;;\n    'sommet changé') sortir 5 \"la sous-PR #$n a reçu un push avant la fusion", [BV]],
  ['A34 CLI : une panne de l’outil en régime 8 sort en 1, lu « renvoi »', R, 'process.exit(3);', 'process.exit(1);', [BV]],
  // ── Ticket 72, lot 5b : les gardes des fichiers sensibles ─────────────────────────────────────────────────────
  ['B1 hook : le régime 8 jamais lu', RG, "regime8 = Object.hasOwn(CHAINE, 'relecture'),", 'regime8 = false,', [BGF]],
  ['B2 hook : aucun chemin sensible refusé', RG, 'return regime8 ? refusSensible(c, sensibles, accordes) : null;', 'return null;', [BRG, BGF]],
  ['B3 hook : une copie sur deux suffit', RG, 'lu.copies.every((motifs) => touche(c, motifs))', 'lu.copies.some((motifs) => touche(c, motifs))', [BRG]],
  ['B4 hook : aucune copie vaut accord', RG, 'return lu.copies.length > 0 && lu.copies.every(', 'return lu.copies.every(', [BRG]],
  ['B5 hook : la casse compte', RG, "regexDuMotif(comparable(m.replace(/^\\.\\//, ''))).test(comparable(c))", "regexDuMotif(m.replace(/^\\.\\//, '')).test(c)", [BRG]],
  ['B6 hook : une liste mal formée ne rend rien sensible', RG, ": ['**'];", ': [];', [BRG]],
  ['B7 hook : `..` accordé', RG, " || c.startsWith('~') || c.split('/').includes('..'))", " || c.startsWith('~'))", [BRG, BCS]],
  ['B8 hook : deux lignes `Sensibles:` admises', RG, 'if (valeurs.length > 1) return { illisible:', 'if (valeurs.length > 9) return { illisible:', [BRG, BCS]],
  ['B9 hook : un accord sans date admis', RG, "if (i <= 0 || !/^\\S.*, \\d{4}-\\d{2}-\\d{2}$/.test(accord)) return", 'if (i <= 0) return', [BRG, BCS]],
  ['B10 garde-fichiers : une copie locale du sujet compte', GF, "        if (distants.get(ref.replace('refs/remotes/origin/', 'refs/heads/')) !== sha) continue;\n", '', [BGF]],
  ['B11 garde-fichiers : develop jamais lu pour un ticket sans sujet', GF, "    if (copies.length === 0) copies = copiesSous('refs/remotes/origin/develop');\n", '', [BGF]],
  ['B12 garde-fichiers : une ligne illisible lue comme vide', GF, 'return illisible ? { illisible: illisible.illisible } :', 'return false ? { illisible: illisible.illisible } :', [BGF]],
  ['B13 garde du capitaine : aucun chemin sensible vu', CS, 'if (sensibles.length === 0) return null;', 'if (true) return null;', [BS]],
  ['B14 garde du capitaine : une PR sans ticket passe au motif ordinaire', CS, 'if (ids.length === 0) throw new Motif(`PR sans ticket', 'if (ids.length === -1) throw new Motif(`PR sans ticket', [BS]],
  ['B15 garde du capitaine : un chemin sensible hors conflit admis', CS, 'if (hors) throw new Motif(`PR de mise à jour', 'if (false) throw new Motif(`PR de mise à jour', [BS]],
  ['B16 garde du capitaine : la copie de develop avant celles des sujets', CS, 'let parTicket = copiesSur(sujets, id);', 'let parTicket = copiesSur([develop], id);', [BS]],
  ['B17 garde du capitaine : une copie sur deux suffit', CS, 'return copies.length > 0 && copies.every((motifs) => motifSensibleTouche', 'return copies.length > 0 && copies.some((motifs) => motifSensibleTouche', [BS]],
  ['B18 garde du capitaine : un ticket introuvable lu comme un accord vide', CS, 'if (parTicket.size === 0 && tickets === undefined) throw new Motif(`ticket', 'if (false) throw new Motif(`ticket', [BS]],
  ['B19 garde du capitaine : une ligne illisible ignorée', CS, '      if (mal) throw new Motif(', '      if (false) throw new Motif(', [BS]],
  ['B20 passer.sh : plus de garde', P, 'if [ "$regime" = 8 ]; then\n  motif=$(git -c core.quotePath=false diff', 'if [ "$regime" = 9 ]; then\n  motif=$(git -c core.quotePath=false diff', [BS]],
  ['B21 sujet.sh : plus de garde', S, '  if [ "$REGIME" = 8 ]; then\n    local garde', '  if [ "$REGIME" = 9 ]; then\n    local garde', [BS]],
  ['B22 sujet.sh : une PR de mise à jour sans les tickets du sujet', S, 'sujet_de=(--conflits "$conflits" --tickets "$(carte', 'sujet_de=(--conflits "$conflits" --ignore "$(carte', [BS]],
  ['B23 sujet.sh : les retouches d’une PR de mise à jour hors du diff lu', S, "lus=$(printf '%s\\n%s\\n' \"$A_JUGER\" \"$MAJ_APRES\" | sed '/^$/d' | sort -u)", "lus=$(printf '%s\\n' \"$A_JUGER\" | sed '/^$/d' | sort -u)", [BS]],
  ['B24 chemins-sensibles : le point d’entrée ne se reconnaît plus par un lien', CS, 'return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1]);', 'return fileURLToPath(import.meta.url) === process.argv[1];', [BP]],
  ['B25 garde du capitaine : la première copie d’un ticket seule compte', CS, 'accords.push(copies.map((c) => c.chemins));', 'accords.push([copies[0].chemins]);', [BS]],
  ['B26 garde du capitaine : une spec citée par le sujet ne vaut plus ses tickets', CS, ' && !(tickets !== undefined && t.startsWith(`${id}.`))', '', [BS]],
  ['B27 garde du capitaine : sans la grammaire, « PR sans ticket » au lieu d’illisible', CS, '  if (!GRAMMAIRE) throw new Illisible("scripts/docs/identifiants.mjs introuvable : le ticket ne se lit pas");\n', '', [BS]],
  // ── Ticket 73, lot 5c : les renvois, les messages et le gate selon le régime ────────────────────────────────
  ['C1 renvoyer.sh : en régime 8, remettre `à-fusionner`', RV, 'if [ "$regime" = 8 ]; then\n  suite="Corriger, puis redemander', 'if [ "$regime" = 9 ]; then\n  suite="Corriger, puis redemander', [BM]],
  ['C2 renvoyer.sh : la nouvelle réception porte `à-fusionner` en régime 8', RV, '    if [ "$regime" = 8 ]; then\n      suite="Refaire', '    if [ "$regime" = 9 ]; then\n      suite="Refaire', [BM]],
  ['C3 github.sh : la date d’ouverture ignorée par `regime_de_la_pr`', G, 'ouverte: process.argv[3] });', "ouverte: '2999-01-01T00:00:00Z' });", [BM]],
  ['C4 sujet.sh demarrer : le message du régime 8 jamais dit', S, 'if cle_relecture_sur "origin/$branche"; then', 'if false; then', [BM]],
  ['C5 github.sh : la clé `relecture` jamais trouvée', G, "jq -e 'type == \"object\" and has(\"relecture\")'", "jq -e 'type == \"object\" and has(\"relecturex\")'", [BM]],
  ['C6 sujet.sh demarrer : le refus conseille de nouveau `sujet.sh rafraichir`', S, "la recible sur le sujet) ; si elle est déjà dans develop, le capitaine la reporte dans le sujet de lui-même à chaque\nlancement de sa boucle (A-69) : attendre, ou le lui demander ; une session ne lance jamais \\`sujet.sh rafraichir\\`.\"", "la recible sur le sujet), ou \\`sujet.sh rafraichir ${base#sujet/}\\` si elle est déjà dans develop.\"", [BSU]],
  ['C7 sujet.sh etat : un sujet sans commit propre n’est plus listé (A-132)', S, '      [ "$retard" -gt 0 ] && ! sujet_livre "$nom" || continue', '      continue', [BSU]],
  ['C8 sujet.sh etat : un sujet livré listé de nouveau', S, '      [ "$retard" -gt 0 ] && ! sujet_livre "$nom" || continue', '      [ "$retard" -gt 0 ] || continue', [BSU]],
  ['C9 gate : `Label: contre-revue` encore exigé en régime 8', TR, 'if (regime !== 8 && chauds && ', 'if (chauds && ', [BTK, BTG]],
  ['C10 gate : `Relecture: double` jamais exigée', TR, "if (n === 'high') ecarts.push(", "if (n === 'haute') ecarts.push(", [BTK, BTG]],
  ['C11 gate : un ticket fait encore jugé', TR, '/^(Fait|wontfix)\\b/.test(status', '/^(wontfix)\\b/.test(status', [BTK]],
  ['C12 gate : une criticité illisible lue comme basse', TR, 'else if (n?.illisible) ecarts.push(', 'else if (false) ecarts.push(', [BTK]],
  ['C13 gate : la ligne `Relecture: double` ignorée', TR, 'if (relecture || /^(Fait|wontfix)', 'if (/^(Fait|wontfix)', [BTK, BTG]],
  ['C14 gate : le régime 8 jamais lu dans le contrat', TK, "Object.hasOwn(c, 'relecture')) regime = 8;", "Object.hasOwn(c, 'relecturex')) regime = 8;", [BTG]],
  ['C15 gate : double-relecture.mjs absent sans le dire', TK, '  if (!double) {', '  if (false) {', [BTG]],
  ['C16 gate : la criticité de l’en-tête jamais lue', TK, '        if (e.enVigueur) lus.push(e.niveau);', '        if (false) lus.push(e.niveau);', [BTG]],
  ['C17 gate : le régime pas transmis au contrôle des tickets', TK, '    regime,\n    niveauDe,\n  });', '    niveauDe,\n  });', [BTG]],
  ['C18 renvoyer.sh : la PR lue pour son régime même sans la clé (régime 7 : une lecture de plus)', RV, 'if [ "$cle" = 0 ] && pr=$(pr_json', 'if pr=$(pr_json', [BM]],
  ['C19 gate : une règle rejetée de l’index compte', TK, 'if (r && r.enVigueur) lus.push(r.niveau);', 'if (r) lus.push(r.niveau);', [BTG]],
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
