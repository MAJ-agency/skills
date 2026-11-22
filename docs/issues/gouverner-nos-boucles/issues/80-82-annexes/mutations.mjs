// Les mutations du lot 6 (tickets 80 à 82, la bascule en 8.0.0) : chacune change une phrase d'un texte du régime 8, une
// valeur du gabarit du contrat ou une ligne de code (avancement, gate settings-json), joue les bancs qu'elle nomme, et
// doit en rendre un rouge ; le fichier est remis après chaque mutation. À lancer depuis la racine d'un clone où
// `lot-6.patch` est appliqué : `node <chemin>/mutations.mjs [<préfixe>…]` (`B`, `V`, `A`, `S`, `D`, `R`, ou un nom : `B12`).
// Sortie 0 : toutes rouges.
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const C = 'skills/chaine';
const F = {
  chantier: `${C}/chantier/SKILL.md`,
  fusionner: `${C}/fusionner/SKILL.md`,
  sujet: `${C}/sujet/SKILL.md`,
  architecte: `${C}/architecte/SKILL.md`,
  lancement: `${C}/architecte/references/lancement.md`,
  sept: `${C}/chantier/references/regime-7.md`,
  cdp: `${C}/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`,
  fragment: `${C}/socle-chaine-de-production/references/fragments/claude-md-fusion.md`,
  tracker: `${C}/tickets/references/agents/issue-tracker.md`,
  contrat: `${C}/socle-chaine-de-production/references/chaine.json`,
  contenu: `${C}/socle-chaine-de-production/references/CONTENU.md`,
  socle: `${C}/socle-chaine-de-production/SKILL.md`,
  conception: 'skills/monorepo/socle-monorepo/references/methode/conception.md',
  avReg: `${C}/tickets/references/scripts/docs/avancement-regles.mjs`,
  sReg: `${C}/socle-chaine-de-production/references/scripts/verify/settings-json-regles.mjs`,
  sGate: `${C}/socle-chaine-de-production/references/scripts/verify/settings-json.mjs`,
};
const B = 'scripts/bascule.test.mjs';
const V = 'scripts/veille-du-capitaine.test.mjs';
const D = 'scripts/depot.test.mjs';
const A = `${C}/tickets/references/scripts/docs/avancement.test.mjs`;
const S = `${C}/socle-chaine-de-production/references/scripts/verify/settings-json.test.mjs`;

// `avant` doit se trouver une fois exactement ; sinon la mutation est introuvable.
const remplacer = (avant, apres) => (t) => (t.split(avant).length !== 2 ? null : t.replace(avant, () => apres));
const retirer = (bloc) => remplacer(bloc, '');
// Échange deux passages (chacun trouvé une fois, `a` avant `b`).
const echanger = (a, b) => (t) => {
  const i = t.indexOf(a);
  const j = t.indexOf(b);
  if (t.split(a).length !== 2 || t.split(b).length !== 2 || i < 0 || j <= i + a.length - 1) return null;
  return t.slice(0, i) + b + t.slice(i + a.length, j) + a + t.slice(j + b.length);
};
// Une suite de transformations, toutes trouvées.
const suite = (...fs) => (t) => fs.reduce((x, f) => (x === null ? null : f(x)), t);

const MUTATIONS = [
  // Les skills des rôles : la tête, le renvoi à regime-7.md.
  ['B1 chantier : le paragraphe des deux régimes retiré', F.chantier, (t) => {
    const i = t.indexOf("**Deux régimes, jusqu'au nettoyage du plugin.**");
    const j = t.indexOf('\n\n', i);
    return i < 0 || j < 0 ? null : t.slice(0, i) + t.slice(j + 2);
  }, [B]],
  ['B2 fusionner : le lien vers regime-7.md mène ailleurs', F.fusionner, remplacer('](../chantier/references/regime-7.md)', '](../chantier/references/regime-8.md)'), [B]],
  ['B3 sujet : la section de regime-7.md citée sous un autre nom', F.sujet, remplacer('(../chantier/references/regime-7.md), « Les sujets ».', '(../chantier/references/regime-7.md), « Les branches ».'), [B]],
  ['B4 regime-7.md : la section des sujets sans son titre', F.sept, remplacer('## Les sujets (skill `sujet`)\n', ''), [B]],
  // Le conducteur.
  ['B5 chantier : le conducteur archive de nouveau lui-même', F.chantier, remplacer("**puis une ligne à l'architecte par session, `à archiver : <session>, <ticket>, <coût>`** (sans programme, au produit).", '**puis `archive_session`**.'), [B]],
  ['B6 chantier : le Relecteur au point 5 du § 0, le capitaine au point 6', F.chantier, suite(remplacer("5. Vérifie qu'un capitaine tourne", "6. Vérifie qu'un capitaine tourne"), remplacer('6. Vérifie que le **Relecteur**', '5. Vérifie que le **Relecteur**')), [B]],
  ['B7 chantier : le plafond n’est plus reçu par le conducteur', F.chantier, (t) => {
    const i = t.indexOf('   - **Recevoir un plafond**');
    const j = t.indexOf('\n', i);
    return i < 0 ? null : t.slice(0, i) + t.slice(j + 1);
  }, [B]],
  ['B8 chantier : la contre-revue revient en titre du point 5', F.chantier, remplacer('5. **La relecture est indépendante : le conducteur ne contre-relit rien et ne relaie aucun constat.**', '5. **Contre-revue du conducteur** sur toute PR qui touche un chemin sensible.'), [B]],
  // Le capitaine.
  ['B9 fusionner : la sous-PR sautée ne garde plus son sujet', F.fusionner, retirer(' **Une sous-PR sautée ainsi garde son sujet** : `boucle.sh` lit la sortie 7 comme un sujet tenu, et les autres sous-PR de ce sujet attendent tant que la cause demeure (presque toujours commune aux PR du dépôt : un en-tête de règle, un clone partiel) ; le dire une fois au lanceur.'), [B]],
  ['B10 fusionner : CAPITAINE_ID cite de nouveau `boucle.sh --reprendre`', F.fusionner, remplacer('`sujet.sh fusionner`, `sujet.sh relancer`), puisqu', '`sujet.sh fusionner`, `sujet.sh relancer`, `boucle.sh --reprendre`), puisqu'), [B]],
  ['B11 fusionner : le propriétaire renvoyé remet `à-fusionner`', F.fusionner, remplacer('| Propriétaire renvoyé | corrige, redemande la relecture (`à-relire`, sans retirer `fusion-bloquée`)          |', '| Propriétaire renvoyé | corrige, retire `fusion-bloquée`, remet `à-fusionner`  |'), [B]],
  ['B12 fusionner : le second contrôle du verdict n’est plus dit', F.fusionner, remplacer('**deux fois** : à l\'éligibilité, avant toute mise à jour et toute CI ; puis juste avant l\'appel de fusion, sur le sommet fusionné', 'une fois, à l\'éligibilité, avant toute mise à jour et toute CI'), [B]],
  ['B13 fusionner : le capitaine archive de nouveau les sessions sans tag', F.fusionner, remplacer("**Le capitaine n'archive aucune session**", '**Le capitaine archive une session « completed » sans tag `chantier:`**'), [B]],
  // Les sujets.
  ['B14 sujet : le corps type de réception reprend sa « Revue de ticket »', F.sujet, remplacer('| `<fichier>` | <ce que develop exige du sujet> |\n```', '| `<fichier>` | <ce que develop exige du sujet> |\n\n## Revue de ticket\n\n<section de la revue de ticket>\n```'), [D]],
  ['B15 sujet : la livraison attend de nouveau une relecture', F.sujet, remplacer('le poser aussitôt, `issue_write` en session cloud ;', 'le poser après la relecture qu\'elle demande (contre-revue si elle touche un chemin sensible), `issue_write` en session cloud ;'), [B]],
  ['B16 sujet : la PR de réception exemptée', F.sujet, remplacer("**La PR de réception n'est pas exemptée de relecture**", '**La PR de réception est exemptée de relecture**'), [B]],
  // L'architecte et le lancement.
  ['B17 architecte : la repose, points 3 et 4 échangés', F.architecte, (t) => {
    const i = t.indexOf('3. **La PR de repose**');
    const j = t.indexOf('4. **Le capitaine relancé');
    const k = t.indexOf('\n\n## Ne jamais', j);
    if (i < 0 || j < 0 || k < 0) return null;
    const p3 = t.slice(i, j).replace(/\n$/, '');
    const p4 = t.slice(j, k);
    return t.slice(0, i) + p4.replace('4. ', '3. ') + '\n' + p3.replace('3. ', '4. ') + t.slice(k);
  }, [B]],
  ['B18 architecte : la repose ne retire plus create_session', F.architecte, retirer(' Elle retire `mcp__claude-code-remote__create_session` des `permissions.allow` de `.claude/settings.json` (le gate `settings-json` le refuse en régime 8 : l\'outil refuse `effort` à une session où il est pré-approuvé).'), [B]],
  ['B19 architecte : le Relecteur n’est plus relevé', F.architecte, retirer('Le Relecteur de chaque dépôt (`Relecteurs:`) se relève de même. '), [B]],
  ['B20 lancement : la phrase du régime remise d’un seul tenant', F.lancement, remplacer("Dans un dépôt qui a .claude/chaine.json, tu livres selon le régime que `sujet.sh demarrer` te donne : en régime 8 (sa ligne « régime 8 : relecture indépendante »), tu demandes la relecture comme elle le dit et comme § 5 le détaille, tu ne lances aucun relecteur et tu ne poses jamais `à-fusionner` ; une contestation d'un bloquant m'est écrite ; en régime 7, tu livres selon la ligne Label: du ticket.", 'Tu livres selon la ligne Label: du ticket.'), [B]],
  ['B21 lancement : le capitaine archivé sans sa garde supprimée', F.lancement, remplacer("d'abord sa garde, `delete_trigger` sur le `trigger_id` que le capitaine a noté", 'sans toucher à sa garde'), [B]],
  // Les documents posés.
  ['B22 chaine-de-production.md : le relecteur adversaire revient parmi les rôles', F.cdp, remplacer('| Relecteur            | un par dépôt                 |', '| Relecteur adversaire | un par dépôt                 |'), [B]],
  ['B23 chaine-de-production.md : la fille pose `à-fusionner`', F.cdp, remplacer('**Jamais `à-fusionner`** : le Relecteur la pose', 'Puis `à-fusionner` : le Relecteur la confirme'), [B]],
  ['B24 chaine-de-production.md : le réveil de secours, deux cas échangés', F.cdp, echanger('aucune des quatre étiquettes (`à-relire`, `à-reprendre`, `à-fusionner`, `fusion-bloquée`), reposer `à-relire`', '`à-relire` depuis plus de trois heures sans distribution du Relecteur pour son sommet (`Relecture — tour <k> — sommet <sha> — …`), l\'écrire au conducteur (un Relecteur arrêté)'), [B]],
  ['B25 chaine-de-production.md : `Label: contre-revue` remis obligatoire au § 3', F.cdp, remplacer('Relecture: double # exigée par le gate tickets', 'Label: contre-revue # obligatoire quand Fichiers chauds touche cheminsSensibles\nRelecture: double # exigée par le gate tickets'), [B]],
  ['B26 chaine-de-production.md : la revue de ticket revient à l’étape 5', F.cdp, remplacer('5. **Demander la relecture.**', '5. **Revue de ticket** (skill `revue-de-ticket`), puis demander la relecture.'), [B]],
  ['B27 fragment : `fusion-bloquée` fait remettre `à-fusionner`', F.fragment, remplacer('corriger, puis redemander la relecture (`à-relire`, sans retirer `fusion-bloquée`).', 'corriger, retirer `fusion-bloquée`, remettre `à-fusionner`.'), [B]],
  ['B28 issue-tracker : livrer, c’est poser `à-fusionner`', F.tracker, remplacer('puis poser `à-relire` (sous-PR de sujet comprise) ; jamais `à-fusionner`', 'puis poser `à-fusionner` (sous-PR de sujet comprise)'), [B]],
  ['B29 conception.md : la relecture indépendante n’est plus dite', F.conception, (t) => {
    const i = t.indexOf('**Quand.** Avec la chaîne de production en relecture indépendante');
    const j = t.indexOf('Sans cette chaîne : avant le commit qui clôt une feature', i);
    return i < 0 || j < 0 ? null : `${t.slice(0, i)}**Quand.** Avant le commit qui clôt une feature${t.slice(j + 'Sans cette chaîne : avant le commit qui clôt une feature'.length)}`;
  }, [B]],
  // Le gabarit du contrat, la phrase des clés, le socle.
  ['B30 chaine.json : la session sensible en effort high', F.contrat, remplacer('"sensible": { "modele": "opus", "effort": "xhigh" }', '"sensible": { "modele": "opus", "effort": "high" }'), [B]],
  ['B31 chaine.json : la clé relecture retirée', F.contrat, (t) => {
    const i = t.indexOf('  "relecture": {');
    const j = t.indexOf('  },\n', i);
    return i < 0 || j < 0 ? null : t.slice(0, i) + t.slice(j + 5);
  }, [B]],
  ['B32 chaine.json : depuis déjà rempli dans le gabarit', F.contrat, remplacer('"depuis": "{{DEPUIS}}"', '"depuis": "2026-11-22T08:00:00Z"'), [B]],
  ['B33 CONTENU.md : « Sept clés » de nouveau', F.contenu, remplacer("Huit clés, et rien d'autre", "Sept clés, et rien d'autre"), [B]],
  ['B34 socle SKILL.md : `{{DEPUIS}}` absent de la liste des placeholders', F.socle, remplacer('`{{DATE}}`, `{{DEPUIS}}`, `{{ADR_CHAINE}}`', '`{{DATE}}`, `{{ADR_CHAINE}}`'), [B]],
  ['B35 socle SKILL.md : `{{ADR_RELECTURE}}` absent de la liste des placeholders', F.socle, remplacer('`{{ADR_SUJET}}`, `{{ADR_RELECTURE}}`.', '`{{ADR_SUJET}}`.'), [B]],
  ['B36 socle SKILL.md : la relecture ne se pose plus', F.socle, remplacer("puis l'« Étape 0 — poser » du skill `relecture`", 'puis le skill `relecture`'), [B]],
  // La veille du capitaine (mineurs 8, 9, 11, 12 et 13 de la PR 150 ; A-187 point 3).
  ['V1 fusionner : la sortie 10 laisse lever l’arrêt par qui se réveille', F.fusionner, remplacer("sortie 10 : arrêt demandé, levé par qui l'a posé (`--reprendre`), jamais par la session qui se réveille.", 'sortie 10 : arrêt demandé, la veille relancée avec `--reprendre` quand on veut repartir.'), [V]],
  ['V2 fusionner : la copie d’avant `--etat` reconnue à la seule sortie 64', F.fusionner, remplacer("; la ligne `CAPITAINE_ID requis`, sortie 64 (la copie est d'avant `--etat`, les scripts du projet ne sont pas reposés ; tout autre 64, hors d'un dépôt git par exemple, se rejoue depuis le worktree) : pas de garde,", "; une autre sortie (64 : la copie est d'avant `--etat`, les scripts du projet ne sont pas reposés) : pas de garde,"), [V]],
  ['V3 fusionner : l’heure de l’arrêt de la garde n’est plus notée', F.fusionner, remplacer("3. Noter l'heure du geste (`date +%FT%T`), puis, depuis le worktree,", '3. Depuis le worktree,'), [V]],
  ['V4 fusionner : l’arrêt de la garde, resté posé, n’est plus reconnu', F.fusionner, retirer(" Au réveil de garde suivant, un `arrêt demandé` « posé le » à l'heure notée est le sien, resté posé parce que la relance n'a pas abouti : relancer la veille avec `--reprendre`, sans rejouer `--arreter`."), [V]],
  ['V5 fusionner : le trigger_id de la garde n’est plus noté', F.fusionner, retirer(" Noter le `trigger_id` qu'il rend, chaque fois, le dernier remplaçant le précédent : avant tout arrêt du capitaine et son archivage, `delete_trigger` sur lui ; perdu, le retrouver par `list_triggers`, sous ce nom."), [V]],
  ['V6 fusionner : la boucle sans veille dite à chaque passage, sans son pid', F.fusionner, remplacer('puis le dire une fois au lanceur, avec le pid du `REFUS` et le script du projet à fermer (`9>&-`) ;', 'puis le dire au lanceur ;'), [V]],
  // Le tableau d'avancement.
  ['A1 avancement : « à reprendre » ne lit que les tickets ouverts (un `Fait` en relecture disparaît)', F.avReg, remplacer('    aReprendre: lignes.filter(', '    aReprendre: ouverts.filter('), [A]],
  ['A2 avancement : les étiquettes comparées sans NFC', F.avReg, remplacer("(l.pr.labels ?? []).some((e) => String(e).normalize('NFC') === nom.normalize('NFC'))", '(l.pr.labels ?? []).includes(nom)'), [A]],
  ['A3 avancement : un renvoi (`fusion-bloquée`) n’est plus « à reprendre »', F.avReg, remplacer(" || aEtiquette(l, 'fusion-bloquée')", ''), [A]],
  ['A4 avancement : une PR fusionnée compte encore', F.avReg, remplacer("l.pr && l.pr.etat !== 'fusionnée' && ", 'l.pr && '), [A]],
  ['A6 avancement : « en relecture » ne lit que les tickets ouverts', F.avReg, remplacer('    enRelecture: lignes.filter(', '    enRelecture: ouverts.filter('), [A]],
  ['A5 avancement : la ligne « En relecture » absente de la sortie', F.avReg, retirer("    `- **En relecture :** ${a.enRelecture.join(', ') || '—'}`,\n"), [A]],
  // Le gate settings-json.
  ['S1 settings-json : create_session refusé aussi en régime 7', F.sReg, remplacer('if (relecture && preApprouveCreateSession(entree))', 'if (preApprouveCreateSession(entree))'), [S]],
  ['S2 settings-json : le joker du serveur passe', F.sReg, remplacer("['mcp__claude-code-remote', 'mcp__claude-code-remote__*']", "['mcp__claude-code-remote']"), [S]],
  ['S3 settings-json : le serveur entier passe', F.sReg, remplacer("['mcp__claude-code-remote', 'mcp__claude-code-remote__*']", "['mcp__claude-code-remote__*']"), [S]],
  ['S4 settings-json : un contrat illisible qui nomme la clé lu sans elle', F.sGate, remplacer('    return /"relecture"\\s*:/.test(texte);', '    return false;'), [S]],
  ['S5 settings-json : le gate ne lit pas le contrat', F.sGate, remplacer('  relecture: aCleRelecture(),\n', ''), [S]],
  ['S6 settings-json : la clé lue n’importe où dans le texte (le $comment du gabarit la nomme)', F.sGate, remplacer("return c !== null && typeof c === 'object' && Object.hasOwn(c, 'relecture');", "return /relecture/.test(texte);"), [S]],
  // Le banc de dépôt.
  ['D1 regime-7.md : l’ordre de passage du régime 7 retiré', F.sept, (t) => {
    const i = t.indexOf("- **L'ordre de passage.**");
    const j = t.indexOf('\n', i);
    return i < 0 ? null : t.slice(0, i) + t.slice(j + 1);
  }, [D]],
  // Le tour de relecture des tickets (A-196) : les trous des bancs (R1 à R9), puis les retouches (R10 à R13).
  ['R1 chantier, Ne jamais : archive_session de nouveau permis', F.chantier, remplacer(', ou appeler `archive_session` (`P-62`).', '.'), [B]],
  ['R2 chaine-de-production § 5, étape 5 : le sha court du dernier push', F.cdp, remplacer("le sha entier du dernier push ; puis l'étiquette", "le sha court du dernier push ; puis l'étiquette"), [B]],
  ['R3 réveil de secours : relancer le Relecteur soi-même au lieu de l’écrire au conducteur', F.cdp, remplacer("l'écrire au conducteur (un Relecteur arrêté)", 'relancer soi-même le Relecteur'), [B]],
  ['R4 architecte § 8 : `depuis` écrit avant l’ouverture de la PR de repose', F.architecte, remplacer('le dernier de cette PR, écrit après son ouverture', 'le premier de cette PR, écrit avant son ouverture'), [B]],
  ['R5 regime-7.md : la fille d’un ticket Label: contre-revue livre de nouveau avec à-fusionner', F.sept, remplacer('la fille livre **sans** `à-fusionner` ; le conducteur contre-relit, puis pose le label lui-même.', 'la fille livre avec `à-fusionner` ; le conducteur contre-relit ensuite.'), [B, D]],
  ['R6 chantier § 6.5 : le conducteur pose à-fusionner sur une PR sans étiquette', F.chantier, remplacer('il pose lui-même `à-relire` avec le commentaire', 'il pose lui-même `à-fusionner` avec le commentaire'), [B]],
  ['R7 fusionner, Le verdict : une lecture illisible devient un renvoi', F.fusionner, remplacer("n'est pas un renvoi : la PR est sautée (7)", 'est un renvoi : la PR est renvoyée (4)'), [B, D]],
  ['R8 settings-json : le motif de create_session sans ancre de fin', F.sReg, remplacer('__create_session$/', '__create_session/'), [S]],
  ['R9 settings-json : une clé relecture à null lue absente (du côté non sûr)', F.sGate, remplacer("Object.hasOwn(c, 'relecture')", 'c.relecture != null'), [S]],
  ['R10 chantier § 3 : la PR de cadrage reçoit de nouveau à-fusionner en régime 8', F.chantier, remplacer("sa relecture se demande comme celle d'une fille", 'label à-fusionner, ou sa relecture'), [B]],
  ['R11 réveil de secours : le cas fusion-bloquée vaut de nouveau avec à-relire', F.cdp, remplacer('`fusion-bloquée` sans `à-relire`, lire le renvoi', '`fusion-bloquée`, lire le renvoi'), [B]],
  ['R12 chantier § 0 : la pose du socle sans chaîne n’est plus dite en régime 7', F.chantier, remplacer("est en régime 7 : elle passe au capitaine comme une PR de cadrage de ce régime, `à-fusionner` posé par le conducteur", 'est relue comme les autres'), [B]],
  ['R13 chantier § 6.5 : le plafond de contexte d’une session de relecture n’est plus noté', F.chantier, remplacer('se note dans `## Dépassements` comme un plafond', 'se lit'), [B]],
];

const voulues = process.argv.slice(2);
let vertes = 0;
let jouees = 0;
let rouges = 0;
for (const [nom, fichier, muter, bancs] of MUTATIONS) {
  if (voulues.length && !voulues.some((v) => nom.startsWith(`${v} `) || nom.startsWith(v) && /^[A-Z]$/.test(v))) continue;
  const texte = readFileSync(fichier, 'utf8');
  const mute = muter(texte);
  if (mute === null || mute === texte) {
    console.log(`INTROUVABLE ${nom}`);
    vertes++;
    continue;
  }
  jouees++;
  writeFileSync(fichier, mute);
  const t0 = Date.now();
  let r;
  try {
    r = spawnSync(process.execPath, ['--test', ...bancs], { encoding: 'utf8', timeout: 900_000 });
  } finally {
    writeFileSync(fichier, texte);
  }
  const rouge = r.status !== 0;
  if (rouge) rouges++;
  else vertes++;
  const echecs = rouge ? (r.stdout.match(/^not ok \d+ - .*/gm) ?? []).map((l) => l.replace(/^not ok \d+ - /, '').slice(0, 60)).join(' | ') : '';
  console.log(`${rouge ? 'ROUGE' : 'VERTE'} ${nom} (${Math.round((Date.now() - t0) / 1000)} s)${echecs ? ` — ${echecs}` : ''}`);
}
console.log(`${rouges} rouges sur ${jouees} jouées, ${MUTATIONS.length} dans le fichier`);
console.log(vertes === 0 ? 'toutes rouges' : `${vertes} mutation(s) non rouge(s)`);
process.exit(vertes === 0 ? 0 : 1);
