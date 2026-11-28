// Banc des textes de la bascule (lot 6 de la relecture indépendante, plugin 8.0.0 ; A-93, A-94, A-96, A-98 à A-101,
// A-182 point 3, A-185 points 2 et 8, A-187 point 3, A-194). Les skills des rôles disent en tête comment lire le régime,
// décrivent le régime 8 et renvoient à `regime-7.md` ; les documents posés sont ceux du régime 8 ; le gabarit du contrat
// porte la clé `relecture` dans la forme que le capitaine et le Relecteur lisent ; la phrase des clés du socle les
// compte. Chaque phrase est exigée à sa place (la section, l'ordre) ; ce qui ne vaut qu'en régime 7 n'est plus dans le
// texte du régime 8.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const lire = (chemin) => readFileSync(join(RACINE, chemin), "utf8");
const plat = (t) => t.replace(/\s+/g, " ");
const C = "skills/chaine";
const REGIME_7 = `${C}/chantier/references/regime-7.md`;
const CDP = `${C}/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`;
const ROLES = {
  chantier: { premiere: "## 0. Reprendre ou démarrer", section: null },
  architecte: { premiere: "## 0. Lire avant tout", section: "« L'architecte »" },
  fusionner: { premiere: "## Étape 0 — poser", section: "« Le capitaine »" },
  sujet: { premiere: "## Étape 0 — poser", section: "« Les sujets »" },
};

// Le texte entre deux repères, chacun trouvé une fois et dans cet ordre.
const entre = (texte, debut, fin) => {
  const i = texte.indexOf(debut);
  assert.ok(i >= 0, `« ${debut} » attendu`);
  assert.equal(texte.indexOf(debut, i + 1), -1, `« ${debut} » une seule fois`);
  const j = texte.indexOf(fin, i + debut.length);
  assert.ok(j > i, `« ${fin} » attendu après « ${debut} »`);
  return texte.slice(i, j);
};
const exiger = (texte, phrases, ou) => {
  const manque = phrases.filter((p) => !plat(texte).includes(plat(p)));
  assert.deepEqual(manque, [], `${ou} : passages absents`);
};
const interdire = (texte, phrases, ou) => {
  const restent = phrases.filter((p) => plat(texte).includes(plat(p)));
  assert.deepEqual(restent, [], `${ou} : passages du régime 7 encore là`);
};

test("les quatre skills des rôles disent en tête comment lire le régime, avant leur première section, et renvoient à regime-7.md, qui existe", () => {
  for (const [nom, { premiere, section }] of Object.entries(ROLES)) {
    const chemin = `${C}/${nom}/SKILL.md`;
    const texte = lire(chemin);
    const tete = entre(texte, "**Deux régimes, jusqu'au nettoyage du plugin.**", premiere);
    assert.ok(texte.indexOf("**Deux régimes") < texte.indexOf("\n## "), `${chemin} : le régime se dit avant la première section`);
    exiger(tete, ["porte la clé `relecture` dans `.claude/chaine.json` **et** qu'elle a été ouverte après `relecture.depuis` ; sinon en **régime 7**", "décrit le régime 8 ; ce qui ne vaut qu'en régime 7"], chemin);
    const lien = /\]\(([^)]*regime-7\.md)\)/.exec(tete)?.[1];
    assert.ok(lien, `${chemin} : lien vers regime-7.md`);
    assert.equal(join(dirname(join(RACINE, chemin)), lien), join(RACINE, REGIME_7), `${chemin} : le lien mène à ${REGIME_7}`);
    if (section) assert.ok(tete.includes(section), `${chemin} : la section de regime-7.md citée`);
  }
  const sept = lire(REGIME_7);
  const titres = sept.replace(/```[\s\S]*?```/g, "").split("\n").filter((l) => l.startsWith("## "));
  assert.deepEqual(titres, ["## Le conducteur (skill `chantier`)", "## La session qui code (`docs/agents/chaine-de-production.md` § 5, tel que sa branche le porte)", "## L'architecte (skill `architecte` et `references/lancement.md`)", "## Le capitaine (skill `fusionner`)", "## Les sujets (skill `sujet`)"]);
  exiger(sept, ["la ligne `régime 8 : relecture indépendante ; …` dit le régime 8, son absence le régime 7", "un ticket commencé avant la repose finit en régime 7, sur les documents de sa branche"], REGIME_7);
});

test("regime-7.md garde ce qui ne vaut qu'en régime 7, et les skills ne le disent plus pour le régime 8", () => {
  exiger(lire(REGIME_7), [
    "Un ticket dont `Fichiers chauds:` touche `cheminsSensibles` de `.claude/chaine.json` porte la ligne `Label: contre-revue` en tête, obligatoire",
    "**La contre-revue du conducteur** sur toute PR qui touche un chemin sensible",
    "la fille livre **sans** `à-fusionner` ; le conducteur contre-relit, puis pose le label lui-même.",
    "| Session de travail   | label `à-fusionner` dès le push                        |",
    "| Propriétaire renvoyé | corrige, retire `fusion-bloquée`, remet `à-fusionner`  |",
    "Le renvoi dit « corriger, puis retirer `fusion-bloquée` et remettre `à-fusionner` » (`renvoyer.sh`).",
  ], REGIME_7);
  interdire(lire(`${C}/chantier/SKILL.md`), ["**Contre-revue du conducteur**", "ligne `Label: contre-revue` en tête, obligatoire", "le régime de livraison se lit sur `Label:`", "puis `archive_session`**", "que le conducteur pose après sa contre-revue", "Poser un socle est du cadrage, pas un ticket"], "chantier/SKILL.md");
  interdire(lire(`${C}/fusionner/SKILL.md`), ["| Session de travail   | label `à-fusionner` dès le push", "remet `à-fusionner`  |", "c'est leur conducteur qui les archive", "`boucle.sh --reprendre`), puisqu'une"], "fusionner/SKILL.md");
  interdire(lire(`${C}/sujet/SKILL.md`), ["étiquetée `à-fusionner`", "Label `à-fusionner` et PR jamais empilée", "le poser après la relecture qu'elle demande (contre-revue"], "sujet/SKILL.md");
});

test("le conducteur en régime 8 : il ne contre-relit pas, arbitre, reçoit les plafonds, et nomme à l'architecte ce qu'il ne peut pas archiver (A-94, A-88, A-89, A-185 point 8, P-62)", () => {
  const texte = lire(`${C}/chantier/SKILL.md`);
  const suivi = entre(texte, "## 6. Suivi (à chaque réveil)", "## Arrêter un chantier");
  const p5 = entre(suivi, "5. **La relecture est indépendante : le conducteur ne contre-relit rien et ne relaie aucun constat.**", "**Une sous-PR à la fois par sujet");
  exiger(p5, [
    "Sur la PR d'une fille, le conducteur ne pose ni ne retire jamais `à-fusionner`, `à-relire` ou `à-reprendre`, hors le cas sans étiquette ci-dessous ; ses propres PR (cadrage, documentation, nettoyage) demandent leur relecture comme celle d'une fille, avec `Conducteur: —`.",
    // Le périmètre figé (ticket 2) : le renvoi à § 5 pour la déclaration de ses PR de documentation.
    "Une PR de documentation déclare d'abord son périmètre (`docs/agents/chaine-de-production.md` § 5).",
    "- **Arbitrer** une contestation de sa fille (`Contesté — <critère, fichier et ligne> — <raison>` sur la PR, et une ligne de la fille)",
    "`Arbitrage — <critère, fichier et ligne> — maintenu`, ou `— écarté — <raison>`",
    "- **Recevoir un plafond** (trois tours refusés : `Plafond — décision attendue` sur la PR, une ligne du Relecteur)",
    "- **Une règle haute** (deux verdicts validés exigés) : le message d'information au produit part de lui",
    "- **À chaque réveil**, les PR ouvertes de son sujet qui ne portent aucune des quatre étiquettes",
    "il pose lui-même `à-relire` avec le commentaire `À relire — sommet <sha> — Session: — — Conducteur: <la sienne>`",
    "« session de relecture <id> remplacée au plafond de contexte, PR <n> » se note dans `## Dépassements` comme un plafond",
    // Contre-relecture de la PR 151, tour 1 : l'arbitrage et la décision de plafond sont dits à la fille ; la règle sans
    // étiquette ne prend ni un brouillon ni une PR en régime 7.
    "; il le lui écrit en une ligne (`send_message`), et la fille redemande la relecture (maintenu : le bloquant corrigé d'abord) : sans demande, la PR reste `à-reprendre`, hors de la file du Relecteur.",
    "la décision écrite, par lui ou par l'architecte, il l'écrit en une ligne à la fille, qui la suit et redemande la relecture.",
    "hors brouillon (une fille qui code, ou arrêtée avant sa demande) et en régime 8 (ouvertes après `relecture.depuis` de leur base",
  ], "chantier § 6, point 5");
  exiger(entre(suivi, "1. `node scripts/docs/avancement.mjs sujet/<nom>`", "1 bis. **Plafonds.**"), ["et, en régime 8, au Relecteur du dépôt (l'identifiant de la ligne `Relecteur:` de la fiche ; une ligne d'une fille, « `à-relire` depuis plus de trois heures sans distribution », le fait relever aussitôt)"], "chantier § 6, point 1");
  const p6 = entre(suivi, "6. Vague entièrement fusionnée dans le sujet", "7. Le produit (ou l'architecte) demande l'avancement");
  exiger(p6, [
    "et de même pour chaque session de relecture de sa PR (rôle `relecture`), lues sur les distributions du Relecteur (`Relecture — tour <k> — sommet <sha> — sessions <…>`, remplacées comprises)",
    "**puis une ligne à l'architecte par session, `à archiver : <session>, <ticket>, <coût>`** (sans programme, au produit).",
    "Le conducteur n'archive rien lui-même : la garde du mode « Auto » lui refuse `archive_session`",
  ], "chantier § 6, point 6");
  assert.ok(p6.indexOf("`get_session`, sa ligne dans la section `## Coût`") < p6.indexOf("à archiver : <session>"), "le coût se relève avant la ligne « à archiver »");
  const decoupage = entre(texte, "## 3. Phase 2", "## 4. Phase 3");
  exiger(decoupage, [
    "**Fichiers sensibles : l'accord avant le code.**",
    "`Sensibles: scripts/chaine/passer.sh — accord de <nom>, <AAAA-MM-JJ>`, ou `Sensibles: —`",
    "les lignes `Sensibles:` ne se remplissent qu'après l'accord, dans la PR de cadrage",
    "porte `Relecture: double`",
    "par **un ticket du chantier**, le premier quand d'autres en dépendent",
    "En régime 8, un ticket qui cite sur sa ligne `Règles:` une règle de criticité haute porte `Relecture: double`",
    "En régime 8, un ticket qui crée un module d'authentification",
    "avec la section `## Fichiers sensibles` de la carte, dont l'accord se donne là, une fois",
    "sa relecture se demande comme celle d'une fille (`chaine-de-production.md` § 5, étape 5 : le commentaire `À relire — sommet <sha> — Session: <la sienne> — Conducteur: —`, puis `à-relire` par `issue_write`), jamais `à-fusionner` ; en régime 7, label `à-fusionner`",
  ], "chantier § 3");
  const terrain = entre(texte, "## 0. Reprendre ou démarrer", "## 1. Setup");
  assert.ok(/^5\. Vérifie qu'un capitaine tourne/m.test(terrain), "le point 5 du § 0 reste celui des capitaines (cité ailleurs)");
  exiger(terrain, ["**aucune autre fille ne part avant sa fusion**", "est en régime 7 : elle passe au capitaine comme une PR de cadrage de ce régime, `à-fusionner` posé par le conducteur", "En régime 8, un socle posé ensuite (`socle-tests`) touche des chemins sensibles : c'est un ticket du chantier"], "chantier § 0, point 4");
  assert.ok(/^6\. Vérifie que le \*\*Relecteur\*\* du dépôt tourne \(régime 8\), quand `\.claude\/chaine\.json` d'`origin\/develop` porte la clé `relecture`/m.test(terrain), "le point 6 vérifie le Relecteur, avec la clé seulement");
  exiger(entre(texte, "## 4. Phase 3", "## 5. Phase 4"), ["et redemande la relecture (`chaine-de-production.md` § 5, étape 6)."], "chantier § 4");
  const livraison = entre(texte, "## 7. Phase 5", "## Ne jamais");
  exiger(livraison, ["que le conducteur pose aussitôt en régime 8 (en régime 7 : `references/regime-7.md`)", "redevient une PR ordinaire : en régime 8, il pose alors `à-relire`", "les sessions de relecture de ses propres PR (rôle `relecture`, lues sur leurs distributions) et, sans programme, le Relecteur qu'il a lancé (rôle `relecteur`)", "avec celles de ses propres PR fusionnées"], "chantier § 7");
  exiger(entre(texte, "## Ne jamais", "\n- Lancer une fille"), ["Contre-relire une PR, relayer ou résumer un constat, poser `à-fusionner` sur une PR en régime 8", "ou appeler `archive_session` (`P-62`)"], "chantier, Ne jamais");
});

test("le capitaine en régime 8 : « Le verdict », la sous-PR sautée qui garde son sujet, la table des rôles, l'archivage (A-91, A-105, A-185 point 2, A-188)", () => {
  const texte = lire(`${C}/fusionner/SKILL.md`);
  const regle = entre(texte, "## La règle (`CLAUDE.md` § « Fusion vers develop »)", "## La règle d'ascendance");
  exiger(regle, [
    "| Session de travail   | demande la relecture (`À relire`, puis `à-relire`) après son dernier push",
    "| Relecteur            | distribue les relectures ; `à-fusionner` sur un tour validé, `à-reprendre` sur un refus",
    "| Propriétaire renvoyé | corrige, redemande la relecture (`à-relire`, sans retirer `fusion-bloquée`)",
    "| remettre `à-fusionner` (une livraison de sujet exceptée), fusionner « puisque c'est corrigé » |",
  ], "fusionner, La règle");
  const verdict = entre(texte, "## Le verdict (régime 8)", "## La règle d'ascendance");
  exiger(verdict, [
    "qu'il contrôle **deux fois** : à l'éligibilité, avant toute mise à jour et toute CI ; puis juste avant l'appel de fusion, sur le sommet fusionné",
    "le renvoi dit « corriger, puis poser `à-relire` »",
    "Une mise à jour du capitaine (fusion de develop, index régénérés), une ou plusieurs fois, garde le verdict",
    "**Une sous-PR sautée ainsi garde son sujet** : `boucle.sh` lit la sortie 7 comme un sujet tenu, et les autres sous-PR de ce sujet attendent tant que la cause demeure",
    "Un calcul absent ou en panne : sortie 3, jamais un renvoi.",
    "n'est pas un renvoi : la PR est sautée (7), le Relecteur prévient l'architecte",
  ], "fusionner, Le verdict");
  // La sortie 7 garde le sujet : le skill dit ce que `boucle.sh` fait, pas une règle à part.
  assert.match(lire(`${C}/fusionner/scripts/boucle.sh`), /\b7\)/, "boucle.sh classe la sortie 7");
  const fin = entre(texte, "## Fin de passage", "## Ne jamais");
  exiger(fin, ["**Le capitaine n'archive aucune session**", "leur conducteur les relève et les nomme à l'architecte, qui archive (skill `chantier` § 6.6, `P-62`)", "supprime sa garde (`delete_trigger`, « Réveil de garde »), puis son lanceur l'archive"], "fusionner, Fin de passage");
  const miseEnPlace = entre(texte, "**`CAPITAINE_ID`**", "\n\n");
  assert.ok(!miseEnPlace.includes("`boucle.sh --reprendre`"), "le paragraphe CAPITAINE_ID ne cite plus `boucle.sh --reprendre` (mineur 9 de la PR 150)");
});

test("sujet en régime 8 : la session demande la relecture, la PR de réception aussi, la livraison sans relecture propre (A-92, A-98)", () => {
  const texte = lire(`${C}/sujet/SKILL.md`);
  exiger(entre(texte, "## Session de travail", "## Capitaine (automatique)"), ["jamais `à-fusionner`, que le Relecteur pose sur un verdict validé"], "sujet, Session de travail");
  const reception = entre(texte, "## Recevoir develop dans un sujet", "## Geler un chantier");
  exiger(reception, ["**La PR de réception n'est pas exemptée de relecture**", "rendu par `sujet.sh a-juger <sommet> <base>` : la résolution de la fusion, en entier, puis chaque retouche", "Et, en régime 8, un tour de relecture validé pour le sommet, contrôlé deux fois"], "sujet, Recevoir develop");
  assert.match(lire(`${C}/sujet/scripts/sujet.sh`), /a-juger\)/, "sujet.sh a la commande a-juger");
  exiger(entre(texte, "## Livrer", "## Clore un sujet livré"), ["le poser aussitôt, `issue_write` en session cloud ; une livraison de sujet n'a pas de relecture propre", "Une livraison intermédiaire qui échoue à sa preuve redevient une PR ordinaire : `à-relire`", "; en régime 7, `regime-7.md`, « Les sujets » (la contre-revue d'abord, sur un chemin sensible)."], "sujet, Livrer");
});

test("l'architecte en régime 8 : le Relecteur lancé et relevé, l'arbitrage et le plafond, l'archivage, la repose en quatre gestes (A-83, A-89, A-99, P-62)", () => {
  const texte = lire(`${C}/architecte/SKILL.md`);
  exiger(entre(texte, "## 4. Lancer", "## 5. Le suivi"), ["Dans un dépôt dont `.claude/chaine.json` d'`origin/develop` porte la clé `relecture` (régime 8 ; avant la repose, aucun : § 8, point 2), **un Relecteur** se lance en même temps que le capitaine", "le Relecteur dans `Relecteurs:`"], "architecte § 4");
  exiger(entre(texte, "## 2. Tenir la carte", "## 3. Le grilling"), ["capitaines et Relecteurs lancés par l'architecte"], "architecte § 2");
  const suivi = entre(texte, "## 5. Le suivi", "## 6. Changer d'architecte");
  exiger(suivi, ["- **En régime 8, une PR livrée** ne se nomme ni au Relecteur ni à un capitaine", "**Il arbitre** une contestation sur une PR du conducteur", "**Il décide au plafond**", "Le Relecteur de chaque dépôt (`Relecteurs:`) se relève de même.", "**Archiver** (`P-62`).",
    "écrit sur la PR, puis dit au conducteur en une ligne : il redemande la relecture)",
    "et le produit en est informé en une ligne, le conducteur aussi, qui la dit à la fille (sur sa propre PR, il la suit) : l'auteur redemande la relecture, sans quoi la PR reste `à-reprendre`, hors de la file du Relecteur",
    "et supprimé d'abord ses réveils en attente (`list_triggers`, les entrées dont `persistent_session_id` est cette session, `delete_trigger`)",
    "celles de ses propres PR, l'architecte les archive lui-même, la PR fusionnée",
    "Au plafond d'une PR dont il est l'auteur, l'architecte écrit `Décision de plafond — …`",
    "avec son commentaire `Suite — <objet> — <ticket ou PR>`",
    "Un bloquant sur une règle de criticité haute reste décidé par le produit.",
    "l'architecte lit son niveau dans le fichier de la règle ; dans le doute, le produit décide",
    // Le périmètre figé (ticket 2) : le renvoi à § 5 pour la déclaration de ses PR de documentation.
    "documentation comprise (une PR de documentation déclare d'abord son périmètre, `docs/agents/chaine-de-production.md` § 5)",
  ], "architecte § 5");
  assert.ok(!suivi.includes("au plafond d'une PR de l'architecte, le produit décide"), "§ 5 ne renvoie plus au produit le plafond d'une PR de l'architecte");
  const adr = lire(`${C}/socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-relecture-independante.md`);
  assert.ok(!adr.includes("le produit pour une PR de l'architecte"), "l'ADR ne renvoie plus au produit le plafond d'une PR de l'architecte");
  assert.ok(adr.includes("(le contenu de sa décision : skill `architecte`, § 5)"), "l'ADR renvoie à § 5");
  // Le périmètre figé (ticket 3, A-18) : au point 2, le Relecteur pose aussi `à-reprendre` sur un périmètre absent ou dépassé.
  const point2 = adr.split("\n").find((l) => l.startsWith("2. **Un Relecteur par dépôt**")) ?? "";
  assert.ok(point2.includes("Sur une PR de documentation sans déclaration de périmètre, ou qui touche un fichier hors de son périmètre, il pose aussi `à-reprendre`, sans lancer de session de relecture ni compter de tour (`Périmètre absent`, `Périmètre dépassé — <fichiers>`)."), "l'ADR, point 2 : le périmètre absent ou dépassé");
  assert.ok(suivi.indexOf("- **En régime 8, une PR livrée**") < suivi.indexOf("- **Une PR livrée, en régime 7 ou dans un dépôt sans la chaîne,**"), "le régime 8 d'abord, puis le régime 7 et le dépôt sans la chaîne");
  const repose = entre(texte, "## 8. La repose d'un dépôt au régime 8", "## Ne jamais");
  const points = repose.split("\n").filter((l) => /^\d\. /.test(l));
  assert.deepEqual(points.map((l) => l.slice(0, 3)), ["1. ", "2. ", "3. ", "4. "], repose);
  assert.ok(points[0].startsWith("1. **L'accord, une fois.**") && points[1].startsWith("2. **Le Relecteur**") && points[2].startsWith("3. **La PR de repose**") && points[3].startsWith("4. **Le capitaine relancé, les conducteurs relevés**"), "les quatre gestes d'A-99, dans l'ordre");
  exiger(points[2], ["la quatrième ADR du socle (`next-id.mjs ADR ALL ARC`, son identifiant à la place du placeholder `ADR_RELECTURE` de ces documents)", "ceux de `fusionner`, `sujet`, `relecture` et du socle, le gate `settings-json` compris", "le dernier de cette PR, écrit après son ouverture", "ouverte avant `depuis`, elle est relue et fusionnée en régime 7", "Elle retire `mcp__claude-code-remote__create_session` des `permissions.allow`"], "architecte § 8, point 3");
});

test("lancement.md : la phrase du régime coupée en deux, seule la moitié des dépôts à chaîne change (A-94, A-101) ; l'archivage d'un capitaine supprime sa garde d'abord (A-187 point 3)", () => {
  const lancement = lire(`${C}/architecte/references/lancement.md`);
  const ticket = lancement.split("## La session d'un ticket hors chantier")[1] ?? "";
  const prompt = ticket.match(/```text\n([\s\S]*?)```/)?.[1] ?? "";
  const huit = "Dans un dépôt qui a .claude/chaine.json, tu livres selon le régime que `sujet.sh demarrer` te donne : en régime 8 (sa ligne « régime 8 : relecture indépendante »), tu demandes la relecture comme elle le dit et comme § 5 le détaille, tu ne lances aucun relecteur et tu ne poses jamais `à-fusionner` ; une contestation d'un bloquant m'est écrite ; en régime 7, tu livres selon la ligne Label: du ticket.";
  const sansChaine = "Dans un dépôt sans .claude/chaine.json et sans `Label: contre-revue`, livrer, c'est écrire sur la PR, après ton dernier push, le commentaire `à-fusionner au sommet <sha>`";
  assert.ok(prompt.includes(huit), "la moitié des dépôts à chaîne, récrite");
  assert.ok(prompt.includes(sansChaine), "la moitié du dépôt sans la chaîne, telle quelle");
  assert.ok(prompt.indexOf(huit) < prompt.indexOf(sansChaine), "les deux moitiés dans l'ordre");
  assert.equal(prompt.split("tu livres selon la ligne Label: du ticket").length, 2, "« selon la ligne Label: » n'est plus dit qu'une fois, pour le régime 7");
  const ligne = ticket.split("\n").find((l) => l.startsWith("L'architecte y tient la place du conducteur.")) ?? "";
  assert.ok(ligne.includes("En régime 8, il ne contre-relit rien") && ligne.indexOf("En régime 8") < ligne.indexOf("contre-relit lui-même"), "la place du conducteur : le régime 8 d'abord");
  const apres = lancement.split("## Après le lancement")[1] ?? "";
  exiger(apres, ["- **Archiver un capitaine** du skill `fusionner`", "d'abord sa garde, `delete_trigger` sur le `trigger_id` que le capitaine a noté", "`list_triggers` et `delete_trigger` sur « Garde de la veille du capitaine » dont `persistent_session_id` est la session de ce capitaine, jamais sur le seul nom", "; puis `archive_session`."], "lancement.md, Après le lancement");
});

test("les documents posés sont ceux du régime 8 : la méthode, le fragment, le tracker, la conception, la criticité, la recette (A-93, A-87, P-62)", () => {
  const cdp = lire(CDP);
  const roles = entre(cdp, "## 1. Les rôles", "## 2. Le cycle");
  for (const r of ["| Relecteur            | un par dépôt ", "| Session de relecture | une par PR et par tour ", "poser `à-fusionner` (une livraison de sujet exceptée) ;"]) assert.ok(roles.includes(r), `rôles : « ${r} »`);
  assert.ok(!roles.includes("Relecteur adversaire"), "le relecteur adversaire de la session qui code n'est plus un rôle");
  assert.ok(entre(cdp, "## 2. Le cycle", "## 3. Un ticket").includes("4 bis. **Relecture.** Toute PR, documentation comprise, est relue par une session de relecture que lance le Relecteur du dépôt ; la session qui l'a écrite ne se relit pas."), "le cycle porte la relecture");
  const s3 = entre(cdp, "## 3. Un ticket prêt pour agent", "## 4. Branches");
  exiger(s3, ["Sensibles: scripts/chaine/passer.sh, apps/api/src/auth/** — accord de <nom>, <AAAA-MM-JJ>", "Relecture: double # exigée par le gate tickets", "**Fichiers sensibles : l'accord avant le code.**", "et jamais par la PR de cadrage"], "§ 3");
  assert.ok(!s3.includes("Label: contre-revue # obligatoire"), "§ 3 : `Label: contre-revue` n'est plus montré comme obligatoire");
  const s5 = entre(cdp, "## 5. Session fille", "## 6. Économie");
  const etapes = s5.split("\n").filter((l) => /^\d\. \*\*/.test(l));
  assert.deepEqual(etapes.map((l) => l.slice(0, l.indexOf("**", 5) + 2)), ["1. **Environnement.**", "2. **Réserver**", "3. **Lire**", "4. **Coder**", "5. **Demander la relecture.**", "6. **Sur `à-reprendre`**", "7. **Rendre la main**"]);
  exiger(etapes[4], ["La fille ne se relit pas et ne lance aucun relecteur", "le commentaire `À relire — sommet <sha> — Session: <la sienne> — Conducteur: <celle du conducteur>`", "**Jamais `à-fusionner`**", "le sha entier du dernier push"], "§ 5, étape 5");
  exiger(etapes[5], ["corriger chaque bloquant avec le test qui l'aurait attrapé, ou le contester sur la PR, `Contesté — <critère, fichier et ligne> — <raison>`", "`à-relire` posée avant de retirer `à-reprendre`", "qui arbitre (`Arbitrage — … — maintenu` ou `écarté`) et le lui écrit.", "**Un bloquant contesté attend son arbitrage** : la relecture se redemande une fois l'arbitrage écrit (maintenu : le bloquant corrigé d'abord), au même sommet si rien n'a été poussé, jamais avant", "la fille attend la décision, qu'on lui écrit, la suit, puis redemande la relecture : sans demande, la PR reste `à-reprendre`, hors de la file du Relecteur."], "§ 5, étape 6");
  // Le périmètre figé (ticket 2, A-13) : les règles 1 à 3 et la partie auteur de la règle 4, mot pour mot, avec leur numéro.
  exiger(etapes[4], ["Périmètre, règle 1 : **Déclaration.** Avant sa première demande de relecture, l'auteur écrit un commentaire dont la première ligne est `Périmètre — <objet en une ligne>`, suivie de trois lignes : `Fichiers:` (chemins ou dossiers), `Décisions:` (identifiants des décisions et des ADR que la PR écrit, ou « aucune ») et `Sujets:`. Seul le premier commentaire de cette forme compte, et il n'est jamais modifié. Au tour 1, tout fichier du diff est couvert par la ligne `Fichiers:`.", "le Relecteur écrit `Périmètre absent`"], "§ 5, étape 5, périmètre");
  exiger(etapes[5], [
    "Périmètre, règle 2 : **Corrections.** Entre deux tours, les fichiers que l'auteur modifie sont ceux de la ligne `Fichiers:` et ceux que nomme un bloquant du dernier verdict refusé. Dans ces fichiers, il ne corrige que les constats de ce verdict. Il peut aussi clarifier un passage que le verdict nomme sous « Écartés au tri » avec le motif « faux », sans en changer le sens : par exemple citer la règle qui justifie une définition, ou écrire le résultat attendu d'une commande de preuve.",
    "Périmètre, règle 3 : une décision, un fait ou une ADR que la déclaration ne nomme pas est un bloquant. Sa correction est le retrait, jamais l'ajout de ce qui manque autour.",
    "Périmètre, règle 4 : **Suite.** Ce qui est retiré, ou ce qu'un constat révèle hors du périmètre, s'écrit dans un ticket ou dans une autre PR. L'auteur le cite sur la PR courante par un commentaire `Suite — <objet> — <ticket ou PR>`.",
    "`Périmètre dépassé — <fichiers>`",
  ], "§ 5, étape 6, périmètre");
  // Le réveil de secours (A-86) : ses cinq cas, dans l'ordre.
  const secours = entre(etapes[6], "**le réveil de secours**", "Puis s'arrêter");
  const cas = ["si la PR porte `à-reprendre`", "`fusion-bloquée` sans `à-relire`, lire le renvoi du capitaine", "aucune des quatre étiquettes", "`à-relire` depuis plus de trois heures sans distribution", "sinon rien, et le réarmer une fois"];
  const rangs = cas.map((c) => secours.indexOf(c));
  assert.ok(rangs.every((r) => r >= 0) && rangs.every((r, i) => i === 0 || r > rangs[i - 1]), `réveil de secours : ${cas.join(" / ")}, dans l'ordre`);
  exiger(secours, ["l'écrire au conducteur (un Relecteur arrêté)", "un `send_later` à 120 minutes (le second réveil, à quatre heures, voit le cas des trois heures), à chaque demande de relecture et à chaque contestation"], "réveil de secours");
  assert.ok(!s5.includes("Revue de ticket** (skill"), "§ 5 : la fille ne joue plus la revue de ticket");
  exiger(cdp, ["**Le conducteur nomme ensuite ses filles et leurs sessions de relecture à l'architecte**", "`à archiver : <session>, <ticket>, <coût>`"], "Relevé des coûts");
  const fragment = lire(`${C}/socle-chaine-de-production/references/fragments/claude-md-fusion.md`);
  exiger(fragment, ["- **Relecture indépendante.**", "**la session qui code ne se relit pas** et ne pose jamais `à-fusionner`", "`À relire — sommet <sha> — Session: <id> — Conducteur: <id>`", "déclare d'abord son périmètre"], "fragment fusion");
  assert.ok(!fragment.includes("remettre `à-fusionner`") && !fragment.includes("Avant le label, toute PR qui réalise un ticket passe la **revue de ticket**"), "fragment : plus de revue par l'auteur ni de label remis par lui");
  exiger(lire(`${C}/tickets/references/agents/issue-tracker.md`), ["3. **Livrer, c'est demander la relecture**", "puis poser `à-relire` (sous-PR de sujet comprise) ; jamais `à-fusionner`"], "issue-tracker.md");
  exiger(lire("skills/monorepo/socle-monorepo/references/methode/conception.md"), ["la revue d'une PR est celle d'une **session de relecture** que son auteur ne contrôle pas", "Sans cette chaîne : avant le commit qui clôt une feature"], "conception.md");
  exiger(lire(`${C}/criticite/SKILL.md`), ["la relecture de la PR le relève (axe « Règles métier », critère `D8`)"], "criticite");
  exiger(lire(`${C}/recette-humaine/SKILL.md`), ["relecture demandée par `à-relire`", "correctif, relecture demandée (`à-relire`"], "recette-humaine");
  // La forme de la demande que les documents montrent est celle que `renvoyer.sh` et `sujet.sh demarrer` font écrire.
  assert.ok(lire(`${C}/fusionner/scripts/github.sh`).includes("À relire — sommet <sha> — Session: <id> — Conducteur: <id>"), "github.sh : la même forme");
});

test("le gabarit du contrat porte la clé relecture, lue par le capitaine telle quelle ; la phrase des clés du socle les compte (A-100, A-108, A-128)", async () => {
  const gabarit = JSON.parse(lire(`${C}/socle-chaine-de-production/references/chaine.json`));
  assert.deepEqual(gabarit.relecture, { depuis: "{{DEPUIS}}", delai: 120, ordinaire: { modele: "opus", effort: "medium" }, sensible: { modele: "opus", effort: "xhigh" } });
  assert.match(gabarit.$comment, /`relecture` : la relecture indépendante/);
  const { lireCleRelecture } = await import(pathToFileURL(join(RACINE, `${C}/fusionner/scripts/revue-exigee.mjs`)).href);
  const pose = JSON.stringify({ ...gabarit, relecture: { ...gabarit.relecture, depuis: "2026-11-22T08:00:00Z" } });
  assert.deepEqual(lireCleRelecture(pose), { depuis: Date.parse("2026-11-22T08:00:00Z") }, "le gabarit, `depuis` substitué, se lit");
  assert.equal(lireCleRelecture(JSON.stringify(gabarit)), "illisible", "un `{{DEPUIS}}` oublié se lit illisible : aucune PR n'entre, du côté sûr");
  // Les valeurs par défaut du Relecteur sont celles du gabarit (P-64).
  assert.ok(lire(`${C}/relecteur/scripts/relecteur.mjs`).includes("const DEFAUTS = { delai: 120, ordinaire: { modele: 'opus', effort: 'medium' }, sensible: { modele: 'opus', effort: 'xhigh' } };"));
  const NOMBRES = ["Une", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit", "Neuf", "Dix"];
  const ORDINAUX = ["", "", "", "", "", "", "", "huitième", "neuvième", "dixième"];
  const cles = Object.keys(gabarit).filter((k) => k !== "$comment");
  const contenu = lire(`${C}/socle-chaine-de-production/references/CONTENU.md`);
  assert.ok(contenu.includes(`${NOMBRES[cles.length - 1]} clés, et rien d'autre, que les skills d'exploitation lisent`), `CONTENU.md : « ${NOMBRES[cles.length - 1]} clés » (${cles.join(", ")})`);
  assert.ok(contenu.includes(`Une ${ORDINAUX[cles.length]}, facultative et absente du gabarit : \`preparerCapitaine\``), "CONTENU.md : la clé facultative vient après");
  assert.ok(contenu.includes("et la **relecture indépendante** (`relecture` :"), "CONTENU.md : la clé relecture décrite dans la phrase");
  const socle = lire(`${C}/socle-chaine-de-production/SKILL.md`);
  // Chaque placeholder des gabarits du socle est déclaré dans la liste du skill (ou à l'étape des ADR).
  const declares = new Set([...(/substituer les placeholders ([^\n]*)\./.exec(socle)?.[1].matchAll(/\{\{([A-Z_]+)\}\}/g) ?? [])].map((m) => m[1]).concat("N"));
  const { execFileSync } = await import("node:child_process");
  const fichiers = execFileSync("git", ["ls-files", "-co", "--exclude-standard", `${C}/socle-chaine-de-production/references`], { cwd: RACINE, encoding: "utf8" }).split("\n").filter(Boolean).filter((f) => existsSync(join(RACINE, f)));
  const employes = new Set(fichiers.flatMap((f) => [...lire(f).matchAll(/\{\{([A-Z_]+)\}\}/g)].map((m) => m[1])));
  assert.deepEqual([...employes].filter((p) => !declares.has(p)).sort(), [], "placeholders employés et non déclarés dans SKILL.md");
  exiger(socle, ["`{{DEPUIS}}` vaut l'instant de la pose, en UTC : `date -u +%Y-%m-%dT%H:%M:%SZ`", "puis l'« Étape 0 — poser » du skill `relecture`, lue et suivie de même dans son fichier, `~/.claude/plugins/marketplaces/maj/skills/chaine/relecture/SKILL.md`", "une entrée qui pré-approuve `create_session` quand `.claude/chaine.json` porte la clé `relecture`"], "socle SKILL.md");
  assert.ok(lire(`${C}/relecture/SKILL.md`).includes("## Étape 0 — poser"), "le skill relecture a son étape 0");
});
