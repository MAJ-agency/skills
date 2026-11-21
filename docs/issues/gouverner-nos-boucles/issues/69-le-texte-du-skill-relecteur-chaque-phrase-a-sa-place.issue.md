# Le texte du skill `relecteur`, suite de la PR 146 : `--attendre` et la borne de la sortie 9, l'état `couple`, `send_message` en échec, les causes des lignes, et chaque phrase exigée à sa place

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — six mineurs de texte (15, 16, 17, R4, R5, R6 de la contre-relecture de la PR 146) et le texte des tickets 67 et 68 ; chaque phrase est donnée mot pour mot (« À faire »), avec le banc des textes qui l'exige à sa place, la version et la note de la PR. Joué sur un clone neuf de `main` à `25a72c7`, après les tickets 67 et 68. Rien n'est à concevoir, sauf ce que « Questions à l'architecte » remonte, déjà écrit selon la recommandation. Ce ticket part dans une même PR que les tickets 67 et 68 : « Dans la même PR que les tickets 67 et 68 ».
Blocked by: 68
Dépendances: —
Fichiers chauds: `skills/chaine/relecteur/SKILL.md`, `skills/chaine/relecteur/references/CONTENU.md`, `scripts/relecteur.test.mjs` : aucune autre PR ne les touche. `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` : la PR 44 (hors programme) et la PR du ticket 70 les touchent aussi ; la version est la suivante de `main` au moment de livrer.

## Le besoin

Les mineurs de texte de la liste consolidée du rapport de contre-relecture de la PR 146 (`66-annexes/contre-relecture-d1679f3/rapport.md`, fin du troisième tour), et le texte que les tickets 67 et 68 demandent au skill. Les faits sont lus sur `main` à `25a72c7` (plugin 7.38.0), `skills/chaine/relecteur/SKILL.md`, 105 lignes.

- **15 (`A-182`, point 2)** : le skill ne dit pas quand une session de relecture tourne à un autre couple que la PR, ni quoi en faire. Le ticket 68 donne à `--sessions` l'état `couple` ; le texte doit dire comment le lire (`get_session`), pour `reecrire` comme pour une session attendue, sans défaire la phrase de R2 (« une session seulement attendue (`rien`, raison `attente`) ne s'écrit jamais `morte` pour son couple », `SKILL.md:72`).
- **16** : `send_message` en échec (une ligne, une relance) n'a pas de suite.
- **17** : rien ne dit comment une installation en échec se retente ; la cause du ticket 67 le dit à l'architecte, le texte le dit à la session.
- **R4** : la liste des causes des lignes à l'architecte (`SKILL.md:78`) n'a ni « create_session en échec : <son message> », que la phrase sur `create_session` appelle (`SKILL.md:66`), ni la forme d'une commande coupée sans code (« sortie aucune »).
- **R5** : la ligne de la sortie 9 (`SKILL.md:58`) dit « rejouer au réveil suivant » sans borne, et la puce `VEILLE ARRÊTÉE` (`SKILL.md:94`) relance la veille sans `--attendre` (ticket 67).
- **R6** : `scripts/relecteur.test.mjs:65-66` exige les phrases de R1 et R2 dans le fichier, pas à leur place ; les mutations E1 (la relance hors de la puce `VEILLE ARRÊTÉE`) et E2 (la borne du couple hors de « L'état des sessions ») du rapport (`mutations/mutations-c3.mjs`) survivent au banc du dépôt.
- **Le texte des tickets 67 et 68** : une étiquette restée n'est pas un passage rejoué (« Les lignes ») ; `CONTENU.md` décrit le script et le banc tels qu'ils sont.

## Dans la même PR que les tickets 67 et 68

Voir le ticket 67, même section. Ce ticket porte la version et la note de la PR entière. Il se joue sur l'arbre du ticket 68.

## Où

- `skills/chaine/relecteur/SKILL.md` : « Mise en place », point 2 (17) ; la table d'« À chaque réveil », lignes `remplacer` et `reecrire` (15) ; la table des sorties, ligne 9 (R5) ; « L'état des sessions » (15) ; « Les lignes » (C11, 16, R4, la quatrième forme) ; « La veille », la puce `VEILLE ARRÊTÉE` et le paragraphe qui suit (R5). 107 lignes après, sous les 200 d'`A-98`.
- `skills/chaine/relecteur/references/CONTENU.md` : le paragraphe du script et celui du banc.
- `scripts/relecteur.test.mjs` : deux aides, `section` et `ligne` ; le cas « contre-relecture de la PR 146 », dont les phrases de R1, R2 et des formes sont exigées à leur place ; un cas neuf, à la fin.
- `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`.

## Décisions

1. **R5 : la sortie 9 a la borne de 12**, « rejouer au réveil suivant ; à la seconde fois, l'architecte, et s'arrêter », et la puce `VEILLE ARRÊTÉE` relance la veille **avec `--attendre`** ; « La veille » dit ce que fait l'option et pourquoi. C'est le remède du rapport, mot pour mot.
2. **15 : l'état `couple` se lit par `get_session`**, `session_context.model` qui ne contient pas `faits.modele`, ou `session_context.effort_level` qui n'est pas `faits.effort`.
   - `reecrire` réemploie la session : il suit la règle de « Créer ou relancer » d'`A-182`, point 1 (sans les deux champs, le couple n'est pas tenu pour égal : `couple`).
   - Une session seulement attendue (`rien`, raison `attente`) n'est `couple` que si `get_session` rend les deux champs et que l'un diffère : un champ absent la laisse `vivante` (question 2). La phrase de R2 en garde le sens : elle ne s'écrit jamais `morte` pour son couple.
   - Une session `couple` est remplacée comme une morte, une fois par tour ; la ligne `remplacer` le dit (rien de plus que la session neuve au couple de `faits`), la ligne `reecrire` aussi.
3. **16 : `send_message` en échec se rejoue une fois** ; encore en échec, une ligne à l'architecte, puis la suite du geste ; une ligne à l'architecte elle-même en échec deux fois : l'écrire dans sa réponse, et s'arrêter, comme pour un outil absent (« Mise en place », point 1). Une relance perdue n'a pas d'autre suite : la session relancée devient `muette` au délai, et la règle 5 la remplace.
4. **Une quatrième forme de ligne à l'architecte**, pour une ligne perdue : « PR <n> : send_message en échec vers <session> : <son message> » (question 1). Les trois formes d'`A-182`, point 4, ne changent pas.
5. **R4 : deux causes de plus** dans la liste : « <sous-commande> sortie aucune : l'outil l'a arrêtée » pour une commande coupée sans code, et « create_session en échec : <son message> ».
6. **17** : « Mise en place », point 2 : l'installation ne se retente qu'au lockfile suivant de develop, ou dans un Relecteur neuf, et la cause le dit à l'architecte.
7. **C11 (ticket 68)** : « Les lignes » dit qu'une étiquette posée avant la marque la plus récente n'est pas un passage rejoué.
8. **R6 : chaque phrase exigée l'est à sa place.** Deux aides du banc des textes : `section(texte, titre)`, du titre au titre suivant de même niveau ; `ligne(texte, titre, debut)`, la seule ligne de la section qui commence par `debut` (une puce, une ligne de table). Les phrases de R1 (dans la puce `VEILLE ARRÊTÉE`), de R2 (dans « L'état des sessions ») et des formes (dans « Les lignes ») passent de la liste du fichier à leur place ; chaque phrase neuve de ce ticket est exigée à la sienne. Raison : la phrase d'`A-182` l'était déjà ainsi ; une phrase déplacée hors de son geste ne se lit plus au moment de le jouer.
9. **La version** : la PR entière prend la suivante de `main` au moment de livrer, le troisième nombre plus un (7.38.1 sur `25a72c7`) ; si `main` a bougé (la PR du ticket 70 entrée avant), la suivante de celle-là, et la note se place avant la première note du fichier, à la date du jour.

### Remèdes écartés

- **Garder trois formes et faire taire la PR** quand une ligne se perd (« PR <n> : <cause> ; PR tue ») : la PR n'a plus de geste à taire, son étiquette est posée ; l'architecte lirait « PR tue » pour une PR qui va bien.
- **Ne rien dire d'une ligne perdue à l'auteur** : c'est C11 de nouveau, une PR que personne ne reprend.

## Questions à l'architecte

Chacune est écrite dans le texte selon la recommandation.

1. **Une quatrième forme de ligne à l'architecte** (16), alors qu'`A-182`, point 4, en a fixé trois « et aucune autre ». **Recommandation : oui**, « PR <n> : send_message en échec vers <session> : <son message> ». Une ligne perdue n'est ni une PR tue, ni un arrêt, ni une orpheline ; la faire entrer dans l'une des trois mentirait sur l'état de la PR.
2. **Un champ de `get_session` absent pour une session seulement attendue** (15) : `vivante`, ou `couple` comme au réemploi ? **Recommandation : `vivante`.** R2 a borné la phrase d'`A-182`, point 1, au réemploi pour cette raison : `couple` coûterait le remplacement unique du tour, et un second `get_session` sans `effort_level` (l'outil prévient qu'un effort peut être retiré) écrirait `Relecture en panne` pour rien. `reecrire`, qui réemploie, reste sous la règle du réemploi.

## À faire, dans l'ordre

### § 0 — Partir de l'arbre du ticket 68

Même branche, après le ticket 68 (« À faire » du ticket 67, § 0, pour `main` et les annexes).

### § 1 — Le banc des textes d'abord, vu rouge

Les changements de `scripts/relecteur.test.mjs` du diff ci-dessous, seuls, sur l'arbre du ticket 68 : `node --test scripts/relecteur.test.mjs` rend **2 rouges sur 9** : « contre-relecture de la PR 146 — aucun geste laissé à improviser… » (la relance sans `--attendre`, la borne du couple et les quatre formes) et « suite du ticket 66 (ticket 69) — chaque phrase neuve à sa place… ».

### § 2 — Le texte, la version et la note

Le diff entier du ticket, contre l'arbre du ticket 68 (le patch commun le porte aussi). Les phrases du skill sont à recopier mot pour mot : le banc des textes les compare à la lettre.

```diff
diff --git a/.claude-plugin/plugin.json b/.claude-plugin/plugin.json
index 818adbf..83facdb 100644
--- a/.claude-plugin/plugin.json
+++ b/.claude-plugin/plugin.json
@@ -1,6 +1,6 @@
 {
   "name": "maj-skills",
-  "version": "7.38.0",
+  "version": "7.38.1",
   "description": "Skills d'ingénierie maison : amorçage de monorepo et de socles (API NestJS hexagonale, web Next.js, mobile Expo), chaîne de production pour des sessions d'agent en parallèle (tickets, sujets, capitaine de fusion, revue adversariale, chantier, recette). Aucune règle métier.",
   "author": {
     "name": "Guillaume Jauffret"
diff --git a/NOTES-DE-VERSION.md b/NOTES-DE-VERSION.md
index 9e2e48c..92e7ceb 100644
--- a/NOTES-DE-VERSION.md
+++ b/NOTES-DE-VERSION.md
@@ -2,6 +2,26 @@
 
 La plus récente en haut. Les scripts de la chaîne sont copiés dans chaque projet par `poser` : une version publiée ne change rien chez un projet qui ne les repose pas. Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter.
 
+## 7.38.1 — 2026-11-21
+
+### Ce qui change
+
+Les mineurs de la contre-relecture de la PR 146, sur le skill `relecteur` (tickets 67 à 69) :
+
+- **Une étiquette restée n'étouffe plus une ligne** : `jouer` lit les événements de la PR ; une étiquette déjà posée n'est un passage rejoué que si elle l'a été après la marque la plus récente de la PR. Restée d'un tour d'avant, le refus ou la validation se disent à l'auteur et au conducteur.
+- **Le plafond pose l'étiquette avant son commentaire** : un plafond à moitié écrit se rejoue entier, et l'architecte en est prévenu.
+- **Une session de relecture à un autre couple que la PR** (`couple`, la PR devenue sensible ou « double » sans push) est remplacée, une fois par tour, cause `couple` (`decision-relecteur.mjs`, `A-182`).
+- **La veille** garde l'erreur d'une installation quand GitHub se tait ensuite (sortie 5) ; `--attendre` met une pause avant sa première passe, pour une veille relancée sur une sortie à rejouer ; la sortie 9 s'arrête à la seconde fois, comme 12.
+- **La préparation** relit origin avant de dire une tête introuvable ; la cause « dépendances de develop » dit comment l'installation se retente.
+- **Le skill** dit la suite d'un `send_message` en échec, les causes des lignes à l'architecte (`create_session` en échec, une commande coupée sans code), et une quatrième forme de ligne, une ligne perdue.
+- Le faux GitHub des bancs tient les événements d'étiquette d'une PR (`GET issues/<n>/events`).
+
+### Ce qu'un projet fait pour en profiter
+
+1. Mettre à jour le plugin (comme pour 7.31.0, étape 1).
+2. Reposer les scripts dans une PR du projet : `/maj-skills:fusionner poser` (la décision du Relecteur admet l'état `couple` ; sans repose, un Relecteur à jour qui l'écrit sort en 1 sur la décision de develop).
+3. Rien d'autre tant que le dépôt n'est pas en régime 8.
+
 ## 7.38.0 — 2026-11-20
 
 ### Ce qui change
diff --git a/scripts/relecteur.test.mjs b/scripts/relecteur.test.mjs
index bee9b85..879f619 100644
--- a/scripts/relecteur.test.mjs
+++ b/scripts/relecteur.test.mjs
@@ -15,6 +15,22 @@ const exigerDans = (chemin, phrases) => {
   const texte = lire(chemin);
   for (const p of phrases) assert.ok(texte.includes(p), `${chemin} : « ${p} » attendu`);
 };
+// Une section de SKILL.md, de son titre au titre suivant de même niveau ; une ligne de cette section (une puce, une
+// ligne de table) qui commence par `debut`. Une phrase exigée à sa place ne passe plus si elle quitte sa section ou sa puce.
+const section = (texte, titre) => {
+  const i = texte.indexOf(`\n${titre}\n`);
+  assert.ok(i >= 0, `section « ${titre} » attendue`);
+  const fin = texte.indexOf("\n## ", i + 1);
+  return texte.slice(i, fin === -1 ? texte.length : fin);
+};
+const ligne = (texte, titre, debut) => {
+  const l = section(texte, titre).split("\n").filter((x) => x.startsWith(debut));
+  assert.equal(l.length, 1, `« ${titre} » : une ligne qui commence par « ${debut} »`);
+  return l[0];
+};
+const exigerA = (morceau, ou, phrases) => {
+  for (const p of phrases) assert.ok(morceau.includes(p), `${ou} : « ${p} » attendu à cette place`);
+};
 const bloc = (texte, titre) => {
   const i = texte.indexOf(titre);
   assert.ok(i >= 0, `section « ${titre} » attendue`);
@@ -59,12 +75,15 @@ test("contre-relecture de la PR 146 — aucun geste laissé à improviser : le d
     "(`session_context.model` qui contient `faits.modele`, `claude-opus-…` pour `opus`, et `session_context.effort_level` égal à `faits.effort`)",
     "`plafond` : plus de 700 000 tokens de contexte (`external_metadata.context_usage.used_tokens`)",
     "(`get_session` sans argument, `external_metadata.context_usage.used_tokens`)",
-    "Les lignes du Relecteur lui-même à l'architecte ont trois formes, et aucune autre : « PR <n> : <cause> ; PR tue »",
     "tant que la passe lui rend le même geste à la même règle",
     "une erreur de `passe`, qui ne nomme aucune PR : l'architecte, et s'arrêter",
-    "quand cette suite dit « rejouer au réveil suivant » (9, 12, autre), relancer la veille : sa fin est ce réveil",
-    "une session seulement attendue (`rien`, raison `attente`) ne s'écrit jamais `morte` pour son couple",
   ]);
+  // R6 (troisième tour) : les phrases de R1 et R2 à leur place, la relance dans la puce `VEILLE ARRÊTÉE`, la borne du
+  // couple dans « L'état des sessions » (les mutations E1 et E2 les déplaçaient sans qu'aucun banc ne rougisse).
+  const texte = lire(`${SKILL}/SKILL.md`);
+  exigerA(ligne(texte, "## La veille", "- **`VEILLE ARRÊTÉE sortie <c>`**"), "la puce `VEILLE ARRÊTÉE`", ["quand cette suite dit « rejouer au réveil suivant » (9, 12, autre), relancer la veille avec `--attendre` : sa fin est ce réveil"]);
+  exigerA(section(texte, "## L'état des sessions"), "« L'état des sessions »", ["Une session seulement attendue (`rien`, raison `attente`) n'est `couple` que si `get_session` rend les deux champs et que l'un diffère ; un champ absent la laisse `vivante`, et elle ne s'écrit jamais `morte` pour son couple."]);
+  exigerA(section(texte, "## Les lignes"), "« Les lignes »", ["Les lignes du Relecteur lui-même à l'architecte ont quatre formes, et aucune autre : « PR <n> : <cause> ; PR tue »"]);
   // A-182 : un champ que get_session ne rend pas, dans les deux sections qui le lisent.
   const phrase = "Sans compte de tokens (`context_usage`), la session n'est pas tenue au plafond ; sans `effort_level`, le couple n'est pas tenu pour égal, et la PR reçoit une session neuve.";
   const skillA182 = lire(`${SKILL}/SKILL.md`);
@@ -122,3 +141,29 @@ test("les cartes nomment le Relecteur : `Relecteurs:` dans la fiche d'un program
 test("fusionner/references/CONTENU.md décrit les trois calculs de la relecture (A-137)", () => {
   exigerDans("skills/chaine/fusionner/references/CONTENU.md", ["## `scripts/verdict.mjs`, `scripts/decision-relecteur.mjs`", "## `scripts/meme-contenu.sh`", "## `scripts/double-relecture.mjs`", "Un refus ne compte jamais moins qu'un refus"]);
 });
+
+test("suite du ticket 66 (ticket 69) — chaque phrase neuve à sa place : `--attendre` et la borne de 9, l'état `couple`, `send_message` en échec, les causes des lignes, une étiquette restée, l'installation à retenter", () => {
+  const texte = lire(`${SKILL}/SKILL.md`);
+  // R5 : la sortie 9 a la borne de 12, et `--attendre` se dit dans « La veille ».
+  exigerA(ligne(texte, "## Les sorties de `passe`, `jouer` et `distribuer`", "| 9 |"), "la ligne de la sortie 9", ["rejouer au réveil suivant ; à la seconde fois, l'architecte, et s'arrêter"]);
+  exigerA(section(texte, "## La veille"), "« La veille »", ["`--attendre` : une pause avant la première passe aussi, sous la même borne de 25 minutes"]);
+  // 15 (A-182, point 2) : l'état `couple`, lu pour `reecrire` comme pour une session attendue, remplacé une fois par tour.
+  exigerA(section(texte, "## L'état des sessions"), "« L'état des sessions »", [
+    '`{ "<session>": "vivante" | "morte" | "plafond" | "couple" }`',
+    "`couple` : elle tourne à un autre couple que celui de `faits` (`session_context.model` ne contient pas `faits.modele`, ou `session_context.effort_level` n'est pas `faits.effort`)",
+    "`reecrire`, qui réemploie la session, suit cette règle de « Créer ou relancer » : sans les deux champs, `couple`.",
+    "Une session `couple` est remplacée comme une morte, une fois par tour (`remplacer`, cause `couple`).",
+  ]);
+  exigerA(ligne(texte, "## À chaque réveil", "| `reecrire` |"), "la ligne de `reecrire`", ["sinon (`morte`, `plafond` ou `couple`) `jouer <n> --sessions <fichier>`, qui rend `remplacer`"]);
+  exigerA(ligne(texte, "## À chaque réveil", "| `remplacer` |"), "la ligne de `remplacer`", ["cause `couple` : rien de plus, la neuve est au couple de `faits`"]);
+  // 16, R4 et C11 : `send_message` en échec, les causes des lignes à l'architecte, une étiquette restée.
+  exigerA(section(texte, "## Les lignes"), "« Les lignes »", [
+    "`send_message` en échec (une ligne, ou le message de relance) : le rejouer une fois ; encore en échec, une ligne à l'architecte, « PR <n> : send_message en échec vers <session> : <son message> », puis la suite du geste. Une ligne à l'architecte elle-même en échec deux fois : l'écrire dans sa réponse, et s'arrêter.",
+    "« <sous-commande> sortie aucune : l'outil l'a arrêtée » pour une commande coupée sans code",
+    "« create_session en échec : <son message> »",
+    "Une étiquette déjà là, posée avant la marque la plus récente de la PR (restée d'un tour d'avant, que l'auteur n'a pas retirée), n'est pas un passage rejoué : ses lignes partent.",
+  ]);
+  // 17 : comment l'installation se retente.
+  exigerA(section(texte, "## Mise en place (une fois par session)"), "« Mise en place »", ["Une installation en échec ne se retente qu'au lockfile suivant de develop, ou dans un Relecteur neuf (son dossier est neuf) : la cause « dépendances de develop » le dit à l'architecte."]);
+  assert.ok(!texte.includes("ont trois formes"), "les lignes à l'architecte ont quatre formes");
+});
diff --git a/skills/chaine/relecteur/SKILL.md b/skills/chaine/relecteur/SKILL.md
index dda57ce..a7ce4a1 100644
--- a/skills/chaine/relecteur/SKILL.md
+++ b/skills/chaine/relecteur/SKILL.md
@@ -24,7 +24,7 @@ Une PR du régime 8 n'est pas relue par son auteur : une **session de relecture*
 ## Mise en place (une fois par session)
 
 1. Charger les outils de session : `ToolSearch`, requête `select:mcp__claude-code-remote__send_message,mcp__claude-code-remote__create_session,mcp__claude-code-remote__get_session,TaskStop`. Un outil absent : écrire « <outil> absent » dans sa réponse, et « Relecteur arrêté : <outil> absent » à l'architecte par `send_message` s'il est là ; puis s'arrêter : l'architecte le lit à son relevé.
-2. Le dossier de la session est **le sien seul** : il n'y écrit, n'y commite et n'y pousse rien. Les scripts le placent sur `origin/develop` à chaque geste, sans hook ni fsmonitor, approfondissent le clone une fois et installent les dépendances de develop quand son lockfile change. **Un verrou** (`flock`) tient le dossier pendant chaque sous-commande : un geste lancé pendant une passe de la veille attend sa fin.
+2. Le dossier de la session est **le sien seul** : il n'y écrit, n'y commite et n'y pousse rien. Les scripts le placent sur `origin/develop` à chaque geste, sans hook ni fsmonitor, approfondissent le clone une fois et installent les dépendances de develop quand son lockfile change. Une installation en échec ne se retente qu'au lockfile suivant de develop, ou dans un Relecteur neuf (son dossier est neuf) : la cause « dépendances de develop » le dit à l'architecte. **Un verrou** (`flock`) tient le dossier pendant chaque sous-commande : un geste lancé pendant une passe de la veille attend sa fin.
 3. Le premier geste : `node '<dossier du skill>/scripts/relecteur.mjs' passe`, et ses sorties comme celles de `jouer` (« Les sorties »).
 4. Puis la veille (« La veille »).
 
@@ -39,8 +39,8 @@ Fin de la veille, message d'une session : **`passe` d'abord**, toujours, puis le
 | `etiqueter`, `plafonner`, `panne`, `illisible` | `jouer <n>`, puis chaque ligne de `lignes` (« Les lignes ») |
 | `distribuer` (règles 4 et 6) | « Créer ou relancer les sessions », puis `distribuer <n> --sommet <sommet> --couple <modele>/<effort> <sessions…>`, puis le message de relance aux sessions réemployées |
 | `completer` | créer `manque` sessions neuves, puis `distribuer <n> --sommet … --couple … <neuves…>` |
-| `remplacer` | créer une session neuve, puis `distribuer <n> --sommet … --couple … --remplace <ancienne> <neuve>` ; cause `plafond` : une ligne au conducteur (`faits.conducteur`), « session de relecture <id> remplacée au plafond de contexte, PR <n> » |
-| `reecrire` | lire l'état de la session ; vivante : `distribuer <n> --sommet … --couple …`, puis le message de relance ; sinon `jouer <n> --sessions <fichier>`, qui rend `remplacer` |
+| `remplacer` | créer une session neuve, puis `distribuer <n> --sommet … --couple … --remplace <ancienne> <neuve>` ; cause `plafond` : une ligne au conducteur (`faits.conducteur`), « session de relecture <id> remplacée au plafond de contexte, PR <n> » ; cause `couple` : rien de plus, la neuve est au couple de `faits` |
+| `reecrire` | lire l'état de la session (« L'état des sessions ») ; vivante : `distribuer <n> --sommet … --couple …`, puis le message de relance ; sinon (`morte`, `plafond` ou `couple`) `jouer <n> --sessions <fichier>`, qui rend `remplacer` |
 
 `jouer <n>` refait la décision de la PR et joue sur GitHub ce qui s'y écrit : la nouvelle étiquette **avant** de retirer l'ancienne, le commentaire du plafond, de la panne ou de l'illisible. Pour un geste de session, il n'écrit rien et rend le geste à jouer, avec `faits` : `modele` et `effort` de la session à créer, `sensible`, `exiges`, `auteur`, `conducteur`. `distribuer` reçoit le sommet et le couple que le geste nommait, refait la décision et **sort en 3 sans rien écrire** si le geste, le sommet ou le couple ont changé entre-temps (un verdict tombé, un push, une PR devenue sensible).
 
@@ -55,7 +55,7 @@ Fin de la veille, message d'une session : **`passe` d'abord**, toujours, puis le
 | 5 | GitHub n'a pas répondu : rien, le réveil suivant rejoue |
 | 6 | le dossier n'est pas propre, `scripts/chaine/` n'a pas les calculs de la relecture (`fusionner`, `sujet`, `relecture` à reposer), ou `flock` manque : l'architecte, et s'arrêter |
 | 7 | GitHub a refusé une écriture : la rejouer au réveil suivant ; au second refus, l'architecte et `--taire <n>` |
-| 9 | le verrou n'est pas venu en 5 minutes : rejouer au réveil suivant |
+| 9 | le verrou n'est pas venu en 5 minutes : rejouer au réveil suivant ; à la seconde fois, l'architecte, et s'arrêter |
 | 12 | git ne lit pas `origin` : rejouer au réveil suivant ; à la seconde fois, l'architecte, et s'arrêter |
 | autre, ou aucune (l'outil a arrêté la commande) | rejouer au réveil suivant ; à la seconde fois, l'architecte, et s'arrêter |
 
@@ -69,13 +69,15 @@ Fin de la veille, message d'une session : **`passe` d'abord**, toujours, puis le
 
 ## L'état des sessions
 
-Il se lit par `get_session`, pour les règles 4, 5 et 6 seulement : les `preferees` d'un geste `distribuer`, et, pour chaque PR que la passe range en règle 5 (`reecrire`, ou `rien` avec la raison `attente`), chaque session attendue, écrite dans un fichier du scratchpad, `{ "<session>": "vivante" | "morte" | "plafond" }`, puis `jouer <n> --sessions <fichier>`. `morte` : archivée, en échec (`status_bucket` `failed`), ou introuvable ; `plafond` : plus de 700 000 tokens de contexte (`external_metadata.context_usage.used_tokens`) ; sinon `vivante`. Sans compte de tokens (`context_usage`), la session n'est pas tenue au plafond ; sans `effort_level`, le couple n'est pas tenu pour égal, et la PR reçoit une session neuve. Le couple ne se lit que pour réemployer une session (« Créer ou relancer ») : une session seulement attendue (`rien`, raison `attente`) ne s'écrit jamais `morte` pour son couple.
+Il se lit par `get_session`, pour les règles 4, 5 et 6 seulement : les `preferees` d'un geste `distribuer`, et, pour chaque PR que la passe range en règle 5 (`reecrire`, ou `rien` avec la raison `attente`), chaque session attendue, écrite dans un fichier du scratchpad, `{ "<session>": "vivante" | "morte" | "plafond" | "couple" }`, puis `jouer <n> --sessions <fichier>`. `morte` : archivée, en échec (`status_bucket` `failed`), ou introuvable ; `plafond` : plus de 700 000 tokens de contexte (`external_metadata.context_usage.used_tokens`) ; `couple` : elle tourne à un autre couple que celui de `faits` (`session_context.model` ne contient pas `faits.modele`, ou `session_context.effort_level` n'est pas `faits.effort`), une PR devenue sensible ou « double » sans push ; sinon `vivante`. Sans compte de tokens (`context_usage`), la session n'est pas tenue au plafond ; sans `effort_level`, le couple n'est pas tenu pour égal, et la PR reçoit une session neuve. `reecrire`, qui réemploie la session, suit cette règle de « Créer ou relancer » : sans les deux champs, `couple`. Une session seulement attendue (`rien`, raison `attente`) n'est `couple` que si `get_session` rend les deux champs et que l'un diffère ; un champ absent la laisse `vivante`, et elle ne s'écrit jamais `morte` pour son couple. Une session `couple` est remplacée comme une morte, une fois par tour (`remplacer`, cause `couple`).
 
 ## Les lignes
 
-`lignes` est une liste de `{ a, session, texte }`. `a` vaut `auteur` ou `conducteur` : le `texte` part à `session` par `send_message`, tel quel ; `session` vaut `null` (une PR écrite sans session, `Session: —`) : personne n'est sonné. `a` vaut `architecte` : le `texte` part à la session de la ligne « Architecte : ». Jamais un constat, jamais un résumé, jamais un mot de plus. `jouer` ne rend une ligne qu'au changement d'étiquette, ou avec le commentaire du plafond : rejoué, il n'en rend aucune.
+`lignes` est une liste de `{ a, session, texte }`. `a` vaut `auteur` ou `conducteur` : le `texte` part à `session` par `send_message`, tel quel ; `session` vaut `null` (une PR écrite sans session, `Session: —`) : personne n'est sonné. `a` vaut `architecte` : le `texte` part à la session de la ligne « Architecte : ». Jamais un constat, jamais un résumé, jamais un mot de plus. `jouer` ne rend une ligne qu'au changement d'étiquette, ou avec le commentaire du plafond : rejoué, il n'en rend aucune. Une étiquette déjà là, posée avant la marque la plus récente de la PR (restée d'un tour d'avant, que l'auteur n'a pas retirée), n'est pas un passage rejoué : ses lignes partent.
 
-Les lignes du Relecteur lui-même à l'architecte ont trois formes, et aucune autre : « PR <n> : <cause> ; PR tue » quand il fait taire une PR ; « Relecteur arrêté : <cause> » quand il s'arrête ; « PR <n> : session <id> orpheline, à archiver ». La `<cause>` : la `raison` de la passe (`contrat-illisible`) ; « <sous-commande> sortie <c> : <dernière ligne de sa sortie d'erreur> » ; « create_session refuse effort » ; « <outil> absent » ; « contexte à <k> tokens » (le sien, à `VEILLE FINIE`).
+`send_message` en échec (une ligne, ou le message de relance) : le rejouer une fois ; encore en échec, une ligne à l'architecte, « PR <n> : send_message en échec vers <session> : <son message> », puis la suite du geste. Une ligne à l'architecte elle-même en échec deux fois : l'écrire dans sa réponse, et s'arrêter.
+
+Les lignes du Relecteur lui-même à l'architecte ont quatre formes, et aucune autre : « PR <n> : <cause> ; PR tue » quand il fait taire une PR ; « Relecteur arrêté : <cause> » quand il s'arrête ; « PR <n> : session <id> orpheline, à archiver » ; « PR <n> : send_message en échec vers <session> : <son message> », une ligne perdue. La `<cause>` : la `raison` de la passe (`contrat-illisible`) ; « <sous-commande> sortie <c> : <dernière ligne de sa sortie d'erreur> », ou « <sous-commande> sortie aucune : l'outil l'a arrêtée » pour une commande coupée sans code ; « create_session refuse effort » ; « create_session en échec : <son message> » ; « <outil> absent » ; « contexte à <k> tokens » (le sien, à `VEILLE FINIE`).
 
 ## Les messages des sessions de relecture
 
@@ -91,10 +93,10 @@ Un message ne fait que hâter : la veille fait le même travail à sa sonde suiv
 
 - **`VEILLE GESTE`** suivi d'une ligne `GESTE <n> <geste> règle <r>` par PR : « À chaque réveil », puis relancer la veille ;
 - **`VEILLE FINIE`** : 25 minutes sans geste ; relever son propre contexte (`get_session` sans argument, `external_metadata.context_usage.used_tokens`) : au-delà de 500 000 tokens, l'écrire à l'architecte, qui lance un Relecteur neuf, et s'arrêter ; sinon « À chaque réveil », puis relancer la veille ;
-- **`VEILLE ARRÊTÉE sortie <c>`** : la passe est sortie autrement qu'en 0 ou en 5 ; la suite de cette sortie (« Les sorties »), avec la dernière ligne du journal ; quand cette suite dit « rejouer au réveil suivant » (9, 12, autre), relancer la veille : sa fin est ce réveil ;
+- **`VEILLE ARRÊTÉE sortie <c>`** : la passe est sortie autrement qu'en 0 ou en 5 ; la suite de cette sortie (« Les sorties »), avec la dernière ligne du journal ; quand cette suite dit « rejouer au réveil suivant » (9, 12, autre), relancer la veille avec `--attendre` : sa fin est ce réveil ;
 - **aucune de ces trois lignes** (l'outil a arrêté la veille) : comme `VEILLE FINIE`.
 
-`PAUSE` dans le journal : GitHub n'a pas répondu, la veille continue. `--taire <n>,…` : ces PR ne la réveillent plus, pour un geste qui ne peut pas se jouer ; une ligne à l'architecte l'a dit. Une PR tue le reste, d'une veille à la suivante, tant que la passe lui rend le même geste à la même règle ; son geste ne se joue pas au réveil. Un autre geste, ou une autre règle, la fait sortir de `--taire`. Une seule veille à la fois : l'arrêter (`TaskStop`) avant d'en relancer une.
+`PAUSE` dans le journal : GitHub n'a pas répondu, la veille continue. `--taire <n>,…` : ces PR ne la réveillent plus, pour un geste qui ne peut pas se jouer ; une ligne à l'architecte l'a dit. Une PR tue le reste, d'une veille à la suivante, tant que la passe lui rend le même geste à la même règle ; son geste ne se joue pas au réveil. Un autre geste, ou une autre règle, la fait sortir de `--taire`. `--attendre` : une pause avant la première passe aussi, sous la même borne de 25 minutes ; sans lui, une panne de quelques secondes (une coupure de `git fetch`) se rejouerait aussitôt et compterait pour la seconde fois. Une seule veille à la fois : l'arrêter (`TaskStop`) avant d'en relancer une.
 
 ## Ne jamais
 
diff --git a/skills/chaine/relecteur/references/CONTENU.md b/skills/chaine/relecteur/references/CONTENU.md
index 1b2ef1b..b5bf81b 100644
--- a/skills/chaine/relecteur/references/CONTENU.md
+++ b/skills/chaine/relecteur/references/CONTENU.md
@@ -8,13 +8,13 @@ Qui lance le Relecteur et qui reçoit ses lignes (`A-83`) ; la mise en place ; l
 
 ## Le script — `scripts/relecteur.mjs`
 
-Quatre sous-commandes, `passe`, `jouer`, `distribuer`, `veille`. Il ne porte aucune règle de décision : il joue `decision-relecteur.mjs` de develop, **la même fonction que le capitaine** (`A-85`), et lui fournit ses faits par les calculs de develop — « double relecture exigée » (`A-82`), « même contenu propre » (`A-81`), les chemins sensibles, `sujet.sh a-juger` — et lit GitHub par `lire_github` de `github.sh`, la seule lecture qui décide (`A-108`). Il prépare son dossier à chaque geste, sous un verrou `flock` (deux préparations ne se croisent jamais, `A-180`) : propre, approfondi une fois (`A-126`), toutes les branches relues, placé sur `origin/develop`, dépendances de develop installées quand son lockfile change (`a-juger` joue commitlint sur les retouches d'une PR de mise à jour ; une installation en échec écrit sa sortie d'erreur et ne se retente qu'au lockfile suivant). Chaque git, le sien comme celui des scripts, porte `core.hooksPath` vide et `core.fsmonitor=false` : un hook du dépôt ne salit jamais le dossier. Le régime d'une PR se lit sur sa base et sur sa date (`A-97`) ; une clé `relecture` mal formée se dit (`contrat-illisible`), jamais une file vide. Un diff propre qui ne se lit pas donne le geste `illisible`, sa cause nommée (PR de fourche, tête introuvable, dépendances de develop, forme refusée par `a-juger`, qui va à l'auteur), signalé une fois par délai (`A-113`, `A-116`, `A-180`). `jouer` pose la nouvelle étiquette avant de retirer l'ancienne (`A-84`) et ne rend une ligne qu'au changement d'étiquette (`A-85`, `A-118`). `distribuer` reçoit le sommet et le couple que le geste nommait, refait la décision avant d'écrire et refuse un geste, un sommet ou un couple qui ont changé : la distribution s'écrit après la création de la session, jamais pour un tour que la machine ne demande plus, ni pour une session créée au mauvais effort (`A-180`). `jouer` et `distribuer` refusent une PR fermée. `veille` ne réveille la session que pour un geste à jouer, et dure 25 minutes, sous les 30 minutes après lesquelles l'outil Bash arrête une tâche de fond : elle ne commence aucune pause qui finirait après, et la sortie d'erreur de ses passes (une installation en échec) va à son journal. Le commentaire du plafond, neuf par construction, part toujours avec ses lignes, même sur une étiquette `à-reprendre` restée posée.
+Quatre sous-commandes, `passe`, `jouer`, `distribuer`, `veille`. Il ne porte aucune règle de décision : il joue `decision-relecteur.mjs` de develop, **la même fonction que le capitaine** (`A-85`), et lui fournit ses faits par les calculs de develop — « double relecture exigée » (`A-82`), « même contenu propre » (`A-81`), les chemins sensibles, `sujet.sh a-juger` — et lit GitHub par `lire_github` de `github.sh`, la seule lecture qui décide (`A-108`). Il prépare son dossier à chaque geste, sous un verrou `flock` (deux préparations ne se croisent jamais, `A-180`) : propre, approfondi une fois (`A-126`), toutes les branches relues, placé sur `origin/develop`, dépendances de develop installées quand son lockfile change (`a-juger` joue commitlint sur les retouches d'une PR de mise à jour ; une installation en échec écrit sa sortie d'erreur et ne se retente qu'au lockfile suivant). Chaque git, le sien comme celui des scripts, porte `core.hooksPath` vide et `core.fsmonitor=false` : un hook du dépôt ne salit jamais le dossier. Le régime d'une PR se lit sur sa base et sur sa date (`A-97`) ; une clé `relecture` mal formée se dit (`contrat-illisible`), jamais une file vide. Un diff propre qui ne se lit pas donne le geste `illisible`, sa cause nommée (PR de fourche, tête introuvable après une seconde lecture d'origin, dépendances de develop, qui disent comment l'installation se retente, forme refusée par `a-juger`, qui va à l'auteur), signalé une fois par délai (`A-113`, `A-116`, `A-180`). `jouer` pose la nouvelle étiquette avant de retirer l'ancienne (`A-84`) et ne rend une ligne qu'au changement d'étiquette (`A-85`, `A-118`) : une étiquette déjà là n'est un passage rejoué que si les événements de la PR la disent posée après sa marque la plus récente ; restée d'un tour d'avant, ses lignes partent. `distribuer` reçoit le sommet et le couple que le geste nommait, refait la décision avant d'écrire et refuse un geste, un sommet ou un couple qui ont changé : la distribution s'écrit après la création de la session, jamais pour un tour que la machine ne demande plus, ni pour une session créée au mauvais effort (`A-180`). `jouer` et `distribuer` refusent une PR fermée. `veille` ne réveille la session que pour un geste à jouer, et dure 25 minutes, sous les 30 minutes après lesquelles l'outil Bash arrête une tâche de fond : elle ne commence aucune pause qui finirait après, et la sortie d'erreur de ses passes sorties en 0 ou en 5 (une installation en échec) va à son journal ; `--attendre` met une pause avant sa première passe, pour une veille relancée sur une sortie à rejouer. Le commentaire du plafond, neuf par construction, part toujours avec ses lignes, même sur une étiquette `à-reprendre` restée posée ; l'étiquette se pose avant lui, et un plafond à moitié écrit se rejoue entier. Une session de relecture que le modèle lit à un autre couple que la PR (`couple`) est remplacée comme une morte, une fois par tour (`A-182`).
 
 La clé `relecture` du contrat que le script lit (`A-179`) : `depuis` (ISO 8601 en UTC, `Z`, avec ou sans millisecondes ; un décalage `+00:00` n'est pas admis), `delai` (en minutes, 120 par défaut), `ordinaire` et `sensible`, chacun `{ "modele", "effort" }`, `modele` valant `opus` ou `sonnet` (`opus`/`medium` et `opus`/`xhigh` par défaut, `A-128`). Le lot 6c la pose dans le gabarit du socle avec ces valeurs.
 
 ## Le banc — `scripts/relecteur.test.mjs`
 
-Le script joué comme la session le joue, dans une copie du dépôt jouet du skill `sujet`, avec les vrais scripts de la chaîne sur develop et le faux GitHub : la file et le régime, le cas nominal de la distribution à `à-fusionner`, l'ordre des étiquettes, une ligne qui ne repart pas, un refus sur un chemin sensible, le remplacement d'une session morte, la relance d'un `incomplet`, le plafond, une PR mise à jour par le capitaine qui garde son verdict, une sous-PR vers un sujet, la préparation du dossier, les dépendances, la veille, une écriture refusée ; et, depuis `A-180`, le sommet ou le couple changés (X1), `depuis` et `modele` (X3), `--sessions` mal formé (X5), une PR fermée (X7), les causes d'illisible (X15), le verrou (X16), les hooks (X17), les calculs en panne par des talons, `completer`, la reprise après arbitrage, deux pages, la panne ; et, depuis la contre-relecture de la PR 146, la veille finie à sa durée, le plafond dit sur une étiquette restée, les `GIT_CONFIG_*` de la session gardés, aucun hook de git ni fsmonitor, le verrou attendu, une installation en échec au journal de la veille, une PR de mise à jour acceptée, les autres causes d'illisible (`a-juger` ou le diff en échec, une fourche supprimée) et leur trace redite après le délai.
+Le script joué comme la session le joue, dans une copie du dépôt jouet du skill `sujet`, avec les vrais scripts de la chaîne sur develop et le faux GitHub : la file et le régime, le cas nominal de la distribution à `à-fusionner`, l'ordre des étiquettes, une ligne qui ne repart pas, un refus sur un chemin sensible, le remplacement d'une session morte, la relance d'un `incomplet`, le plafond, une PR mise à jour par le capitaine qui garde son verdict, une sous-PR vers un sujet, la préparation du dossier, les dépendances, la veille, une écriture refusée ; et, depuis `A-180`, le sommet ou le couple changés (X1), `depuis` et `modele` (X3), `--sessions` mal formé (X5), une PR fermée (X7), les causes d'illisible (X15), le verrou (X16), les hooks (X17), les calculs en panne par des talons, `completer`, la reprise après arbitrage, deux pages, la panne ; et, depuis la contre-relecture de la PR 146, la veille finie à sa durée, le plafond dit sur une étiquette restée, les `GIT_CONFIG_*` de la session gardés, aucun hook de git ni fsmonitor, le verrou attendu, une installation en échec au journal de la veille, une PR de mise à jour acceptée, les autres causes d'illisible (`a-juger` ou le diff en échec, une fourche supprimée) et leur trace redite après le délai ; et, depuis les tickets 67 et 68 (suite du ticket 66), l'erreur d'installation gardée quand GitHub se tait ensuite, `--attendre`, la tête relue après un push, l'étiquette restée et le passage rejoué lus dans les événements de la PR, le plafond à moitié écrit, une session à un autre couple.
 
 ## Le prompt — `prompt-session.md`
 
```

### § 3 — Livrer

Une PR vers `main`, pour les tickets 67, 68 et 69, titre `fix(relecteur): une étiquette restée, un plafond à moitié écrit, une session à un autre couple, une veille qui attend (plugin <version>)`. `Label: contre-revue` : l'architecte la fait contre-relire. Les tickets passent à `Status: Fait — PR <n> (…)` à la fusion, par l'architecte. Dans le corps : les rouges avant (4, 6 et 2, ticket par ticket), les verts après, les mutations, la suite entière.

## Surfaces

| Surface | Preuve |
| --- | --- |
| La relance de la veille dans la puce `VEILLE ARRÊTÉE`, avec `--attendre` (R1, R5) | `scripts/relecteur.test.mjs`, « contre-relecture de la PR 146… » ; mutations C1, C3 |
| La borne de la sortie 9 ; `--attendre` dit dans « La veille » (R5) | « suite du ticket 66 (ticket 69)… » ; mutations C4, C5 |
| L'état `couple` dans « L'état des sessions », pour `reecrire` et une session attendue ; la borne de R2 à sa place (15, R2) | les deux cas ; mutations C2, C2b, C6, C8 |
| Les lignes `reecrire` et `remplacer` de la table (15) | « suite du ticket 66 (ticket 69)… » ; mutation C7 |
| `send_message` en échec ; quatre formes ; les causes neuves (16, R4) | les deux cas ; mutations C9, C10, C11, C12 |
| Une étiquette restée (C11) ; l'installation à retenter (17) | « suite du ticket 66 (ticket 69)… » ; mutations C13, C14 |
| `SKILL.md` sous 200 lignes, déclaré, marqué | « le skill relecteur est un rôle… », inchangé |
| La version et la note | les tests de version de `scripts/depot.test.mjs` |

## Mutations

Dans [`67-annexes/mutations.mjs`](67-annexes/mutations.mjs), C1 à C14 et C2b (C1 et C2b rejouent E1 et E2 du rapport sur les phrases neuves), chacune seule : **15 sur 15 rouges** (journal : [`67-annexes/mutations.txt`](67-annexes/mutations.txt)).

## Vérification

### Pour la session

1. Le rouge, ticket par ticket, avant leur code : 4 (ticket 67), 6 (ticket 68), 2 (ticket 69).
2. Le vert, après les trois : `node --test skills/chaine/relecteur/scripts/relecteur.test.mjs skills/chaine/fusionner/scripts/decision-relecteur.test.mjs skills/chaine/sujet/scripts/faux-gh.test.mjs scripts/relecteur.test.mjs scripts/depot.test.mjs scripts/points-d-entree.test.mjs scripts/relecture.test.mjs` ; puis `pnpm test`, la suite entière, d'un seul tenant, avec son compte, sa durée et la charge (`uptime` avant et après).
3. `node <scratchpad>/mutations.mjs` depuis la racine : « toutes rouges » (40). Sur `main` plus avancé, une mutation « INTROUVABLE » dit qu'un texte a bougé : la refaire sur le texte nouveau.
4. `git diff --stat origin/main` : les onze fichiers des « Où » des trois tickets, et eux seuls.

### Ce qui a été joué en écrivant ce ticket

Sur un clone neuf de `https://github.com/MAJ-agency/skills` à `25a72c7` (plugin 7.38.0), le 2026-11-21, Node 22.23.5, git 2.43.0, quatre cœurs :

- **Rouge avant le texte.** `scripts/relecteur.test.mjs` sur l'arbre du ticket 68 : **2 rouges sur 9** (ceux du § 1). Ticket par ticket, avant chaque code : 4, 6 et 2, soit **12 rouges** pour la PR.
- **Vert après.** `scripts/relecteur.test.mjs` 9 sur 9 ; avec `depot.test.mjs`, `points-d-entree.test.mjs` et `relecture.test.mjs` : 177 sur 177.
- **Mutations.** Les 40 de [`67-annexes/mutations.mjs`](67-annexes/mutations.mjs) (A1 à A7, B1 à B18, C1 à C14 et C2b), sur l'arbre de la PR, chacune seule : **40 rouges sur 40** ; aucune « INTROUVABLE ». Les textes des mutations E1 et E2 du rapport n'existent plus sous leur forme d'avant : C1 et C2b les rejouent sur les phrases neuves.
- **Les essais du rapport** : C11, C12 et R3 rouges sur `25a72c7`, verts sur l'arbre de la PR (tickets 67 et 68).
- **La suite entière**, `pnpm test` (`node --test` sur ses quatre motifs), d'un seul tenant, sur le clone neuf avec le patch : **1 289 tests, 1 289 verts**, aucun échec, sauté ni annulé (1 279 sur `25a72c7`, plus les dix cas neufs : sept au banc du Relecteur, un à celui de la décision, un au faux GitHub, un au banc des textes) ; 13 min 29 s (20:07:29 → 20:20:58 UTC, `duration_ms` 808751), quatre cœurs, charge 0,91 au départ, 2,29 à la fin, notée aux bords seulement.
- **Le patch** : [`67-annexes/ticket-67-68-69.patch`](67-annexes/ticket-67-68-69.patch), `git apply --check` puis `git apply` sur le clone neuf : onze fichiers, l'arbre `c0aa2ddfd07f1651e0da93d8dd97f5bcf77e252c`, le même que les trois diffs des tickets appliqués l'un après l'autre.

## Ce qui n'a pas été établi

- **Les gestes du modèle** (`get_session`, `send_message`, `create_session`) ne se jouent sur aucun banc ; le banc des textes tient que le skill dit le geste à sa place, pas qu'une session le fasse.
- **La forme exacte d'un `send_message` en échec** (le texte d'erreur de l'outil) n'est pas connue ; la ligne recopie « son message » tel quel.
- **Les aides `section` et `ligne`** lisent le texte par ses titres et le début de ses lignes : un titre renommé rougit le banc sans faute de sens. C'est un rouge qui dit « relis la place », pas une preuve de conduite.

## Hors périmètre

- Le code des tickets 67 et 68.
- Les bancs du skill `relecture` et du gate `tickets` : ticket 70, une autre PR.

## Comments

- 2026-11-21 — Écrit par un agent rédacteur sur la liste consolidée du rapport de contre-relecture de la PR 146 et sur `A-182` ; texte, bancs et mutations joués sur un clone neuf de `25a72c7` (« Vérification »).
