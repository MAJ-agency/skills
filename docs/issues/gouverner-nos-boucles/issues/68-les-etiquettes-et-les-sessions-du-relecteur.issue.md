# Les étiquettes et les sessions du Relecteur, suite de la PR 146 : une étiquette restée ne tait plus le verdict, un plafond à moitié écrit se rejoue entier, une session à un autre couple est remplacée

Status: Fait — PR 147 (`7352df8`, plugin 7.38.1)
Type: défaut
Label: contre-revue
Modèle: sonnet — trois mineurs mesurés (13 ou C11, 14 ou C12, 15 de la contre-relecture de la PR 146), la décision de l'architecte pour le troisième (`A-182`, point 2), un faux GitHub qui rend les événements d'étiquette ; le changement entier est donné (« À faire », et le patch commun en annexe), joué sur un clone neuf de `main` à `25a72c7` après le ticket 67. Rien n'est à concevoir, sauf ce que « Questions à l'architecte » remonte, déjà écrit selon la recommandation. Ce ticket part dans une même PR que les tickets 67 et 69 : « Dans la même PR que les tickets 67 et 69 ».
Blocked by: 67
Dépendances: —
Fichiers chauds: `skills/chaine/relecteur/scripts/relecteur.mjs` et son banc (le ticket 67 les touche aussi, dans la même PR), `skills/chaine/fusionner/scripts/decision-relecteur.mjs` et son banc, `skills/chaine/sujet/scripts/faux-gh.mjs` et `faux-gh.test.mjs` (le faux GitHub de tous les bancs de la chaîne : un ajout seulement, une route et un champ ; un ticket des lots 5 qui l'ouvre en même temps le fusionne sans conflit de sens). Les PR ouvertes hors programme (44 et 56, d'après la passation du 2026-11-21) ne touchent aucun de ces fichiers.

## Le besoin

Trois mineurs de la liste consolidée du rapport de contre-relecture de la PR 146 (`66-annexes/contre-relecture-d1679f3/rapport.md`, fin du troisième tour), envoyés à un ticket de suite par `A-182` (points 2 et 5). Les faits sont lus sur `main` à `25a72c7` (plugin 7.38.0), sur un clone neuf ; les numéros de ligne sont ceux de `25a72c7`.

### 13 (C11) — un refus sur une `à-reprendre` restée ne prévient pas l'auteur

Le premier tour d'une PR est refusé : `à-reprendre` est posée, l'auteur et le conducteur prévenus. L'auteur corrige, redemande la relecture (`à-relire`), mais ne retire pas `à-reprendre`. Le tour suivant est refusé à son tour : la règle 4 rend `etiqueter`, poser `à-reprendre`, retirer `à-relire`. `jouer` (`relecteur.mjs:314`) voit `à-reprendre` déjà posée et vide `lignes` : personne n'apprend le refus, et la PR attend sans fin. C'est la règle d'`A-118` (une ligne ne part qu'au changement d'étiquette), qui vaut pour un passage rejoué ; mais `jouer` ne distingue pas une étiquette restée d'un tour d'avant d'une étiquette que lui-même vient de poser, sans l'historique des étiquettes. L'essai C11 du rapport (`essais/essais-c1.test.mjs`) est rouge sur `25a72c7`. La même confusion touche tout geste `etiqueter` dont l'étiquette à poser est déjà là et qui a une étiquette à retirer : un `validé` sur une `à-fusionner` restée, une règle 3.

### 14 (C12) — un plafond à moitié écrit ne prévient pas l'architecte au rejeu

Au plafond (règle 1, trois tours refusés comptés), `jouer` écrit d'abord le commentaire `Plafond — décision attendue`, puis pose `à-reprendre` (lignes 308 à 318). Si la pose est refusée (sortie 7), le commentaire reste. Au passage suivant, la règle 1 voit un plafond plus récent que toute décision : `etiqueter`, avec les lignes « décision de plafond attendue » à l'auteur et au conducteur seulement. L'architecte, qui décide au plafond (`A-89`), n'en sait rien. L'essai C12 du rapport est rouge sur `25a72c7`.

### 15 — une PR devenue sensible ou « double » sans push garde ses sessions à l'ancien couple

`A-180`, point 2 : une session n'est réemployée qu'à couple égal, et une PR qui devient sensible ou « double » reçoit une session neuve au bon couple (`P-64` prime sur `P-52`). `distribuer` compare le couple qu'on lui passe au couple que la PR demande ; mais pour `reecrire` (une session relancée) et pour une session attendue (règle 5), rien ne compare le couple **de la session** : quand le contrat de develop ou le titre de la PR change pendant un tour, la session du tour continue à l'ancien effort. `A-182`, point 2, l'a décidé : « un ticket de suite ajoute la cause « couple » à `remplacer` dans la décision du lot 3a ».

## Dans la même PR que les tickets 67 et 69

Voir le ticket 67, même section : une PR, une version, une note (portées par le ticket 69), le patch commun [`67-annexes/ticket-67-68-69.patch`](67-annexes/ticket-67-68-69.patch). Ce ticket se joue sur l'arbre du ticket 67.

## Où

- `skills/chaine/relecteur/scripts/relecteur.mjs` :
  - l'en-tête : `jouer` et ses lignes, l'ordre du plafond, l'état `couple` de `--sessions` ;
  - `ETATS`, `couple` en plus ; le message de `lireSessions` ;
  - `decision`, la `marque` rendue avec un geste `etiqueter` ;
  - `poseeApres`, neuve, juste avant `ecrire` ;
  - `jouerGeste`, la pose, le commentaire, le retrait, dans cet ordre.
- `skills/chaine/fusionner/scripts/decision-relecteur.mjs` : le JSDoc d'`EtatPR` (`sessions`), `ETATS_DE_SESSION`, `horsService` (règle 5).
- `skills/chaine/sujet/scripts/faux-gh.mjs` : l'en-tête (`PR.evenements`), `evenement`, neuve, la pose et le retrait d'une étiquette, la route `GET issues/<n>/events`.
- Les bancs : `relecteur.test.mjs` (deux cas d'`A-118` précisés, l'ordre du plafond, cinq cas neufs), `decision-relecteur.test.mjs` (un cas neuf, à la fin), `faux-gh.test.mjs` (un cas neuf, à la fin).

`decision-relecteur.mjs` est posé dans chaque projet sous `scripts/chaine/` par `fusionner poser`, et `relecteur.mjs` joue celui de develop : un projet qui ne repose pas garde une décision qui refuse l'état `couple` (`TypeError`, sortie 1). La note de version le dit (ticket 69).

## Décisions

1. **C11 : une étiquette déjà posée n'est un passage rejoué que si les événements de la PR la disent posée après sa marque la plus récente.**
   - `decision` (de `relecteur.mjs`) rend, avec un geste `etiqueter`, `marque` : la date du commentaire à marque le plus récent, `dernier` de `lireMarques` (le calcul existe ; la décision ne change pas pour cela).
   - `jouer`, quand l'étiquette à poser est déjà là, lit `GET issues/<n>/events` (toutes pages, par `lire_github`) et prend la **dernière** pose (`labeled`) de cette étiquette, nom comparé en NFC.
   - Posée **strictement après** la marque : un passage rejoué, `lignes` vide (`A-118` tient). Posée avant, à la même seconde, sans pose lue, ou sans marque : les lignes partent ; dans le doute, une ligne de trop plutôt qu'une PR muette (question 3).
   - Les événements ne se lisent que sur ce chemin : une étiquette à poser absente, rien ne change.
   - Raison : le rapport propose de comparer « le rang de la marque qui déclenche » à « la date de l'étiquette (événements de la PR) ». La marque la plus récente est celle qui déclenche, ou plus récente qu'elle ; une marque plus récente que la pose ne peut que faire repartir une ligne, jamais en taire une.
2. **C12 : au plafond, l'étiquette d'abord, puis le commentaire, puis le retrait de l'ancienne.** Une pose refusée ne laisse rien d'écrit : le passage suivant redécide le plafond, ses lignes entières. Un commentaire refusé après la pose laisse `à-reprendre` sans commentaire de plafond : le passage suivant redécide aussi le plafond (aucun commentaire ne le dit encore décidé), et ses lignes partent, puisqu'un plafond ne rend pas de `marque`. `A-84` tient : la nouvelle étiquette est posée avant que l'ancienne parte. C'est le premier des deux remèdes du rapport (question 1).
3. **15 : l'état `couple`, et la cause `couple` de `remplacer`** (`A-182`, point 2).
   - `--sessions` admet un quatrième état, `couple` : la session tourne à un autre modèle ou un autre effort que ceux que la PR demande (`faits`) ; le modèle le lit par `get_session` (texte du skill, ticket 69).
   - La décision le tient hors service, comme `morte` et `plafond` : `reecrire` ne la relance pas, et `remplacer` la remplace, cause `couple`, **une fois par tour**, comme les autres causes ; une seconde session hors service dans le même tour, c'est la panne (question 2).
   - Une PR devenue « double » ajoute d'abord sa session (`completer`, au couple de `faits`), puis remplace l'ancienne si elle est `couple`.
   - Rien d'autre ne change dans la décision : le capitaine ne lit pas l'état des sessions.
4. **Le faux GitHub tient les événements d'étiquette**, comme GitHub : `PR.evenements`, `[{ event, label, created_at }]`, rendus par `GET issues/<n>/events` sous la forme `{ event, label: { name }, created_at }` ; une pose d'une étiquette absente ajoute `labeled`, un retrait `unlabeled`, datés de `maintenant` (sinon l'heure de la machine). Une étiquette déjà posée n'ajoute rien. Aucun autre banc ne lit ce champ.
5. **Les deux cas d'`A-118` du banc du Relecteur** (« NFC », « une étiquette déjà posée ») deviennent des passages rejoués : leur état porte la pose de l'étiquette après le verdict, et ils gardent leur assertion (aucune ligne). L'ordre des écritures du cas « le plafond » devient `labels`, `comments`, `DELETE`.

### Remèdes écartés

- **Que `decider` rende la marque qui déclenche, règle par règle** (le texte du rapport) : vingt-deux assertions `deepEqual` de `decision-relecteur.test.mjs` sur un geste `etiqueter` changeraient, pour la même issue dans le doute ; la marque la plus récente se lit déjà par `lireMarques`.
- **Un témoin local des poses** (un fichier du dossier du Relecteur) : un Relecteur relancé à neuf le perdrait, et « rien ne vit dans sa mémoire » ; les événements sont sur GitHub.
- **C12 par la règle 1 qui rendrait aussi l'architecte** (le second remède du rapport) : voir la question 1.

## Questions à l'architecte

Tranchées par `A-183`, points 1, 2 et 3, sur les recommandations ci-dessous, telles que le code les écrit ; le point 6 retient la marque la plus récente (décision 1). Gardées pour la trace.

1. **C12, lequel des deux remèdes ?** (a) Au plafond, l'étiquette avant le commentaire (`relecteur.mjs` seul) ; (b) la règle 1, quand un plafond attend sa décision, rend aussi une ligne à l'architecte (`decision-relecteur.mjs`, un `deepEqual` du banc de la décision). **Recommandation : (a).** La décision et le capitaine n'y changent rien, et l'architecte n'apprend le plafond qu'une fois, avec la ligne qui dit « troisième tour refusé ». (b) lui redirait « décision de plafond attendue » chaque fois que l'auteur repose `à-relire` sur une PR au plafond ; ce peut être voulu, comme un rappel.
2. **15, une session `couple` remplacée compte-t-elle dans le remplacement unique du tour ?** **Recommandation : oui**, comme `morte`, `plafond` ou `muette` : une seconde session hors service dans le même tour, c'est `Relecture en panne`, l'architecte prévenu. Le cas des deux sessions d'une PR « double » qui changent toutes deux de couple pendant un tour (le contrat de develop modifié) finit donc en panne ; `A-182` le dit rare. L'autre voie : la cause `couple` hors du compte (une condition de plus dans la règle 5).
3. **C11, le doute : une pose à la même seconde que la marque, ou aucune pose lue.** **Recommandation : la ligne part** (une ligne en double plutôt qu'une PR que personne ne reprend ; `A-182`, « un arrêt dit coûte moins qu'une boucle muette »). La pose du Relecteur suit toujours la marque d'au moins le temps d'une passe ; seule une étiquette restée tombe à la même seconde, par hasard.

## À faire, dans l'ordre

### § 0 — Partir de l'arbre du ticket 67

Même branche, après le ticket 67 (« À faire » du ticket 67, § 0, pour `main` et les annexes).

### § 1 — Les bancs d'abord, vus rouges

Les changements des trois bancs du diff ci-dessous, seuls, sur l'arbre du ticket 67 : `node --test skills/chaine/relecteur/scripts/relecteur.test.mjs skills/chaine/fusionner/scripts/decision-relecteur.test.mjs skills/chaine/sujet/scripts/faux-gh.test.mjs` rend **7 rouges sur 98** : « le plafond » (l'ordre), « suite 66 — C11 », « suite 66 — C11, A-183 point 6 », « suite 66 — C12 », « suite 66 — A-182 (2) » du banc du Relecteur ; « A-182 (2) » du banc de la décision ; « faux gh, événements ». Les cas « NFC », « une étiquette déjà posée après la marque la plus récente » et « suite 66 — un passage rejoué » sont verts avant et après : ils tiennent qu'aucune ligne ne repart d'un passage rejoué.

### § 2 — Le code

Le diff entier du ticket, contre l'arbre du ticket 67 (le patch commun le porte aussi) :

```diff
diff --git a/skills/chaine/fusionner/scripts/decision-relecteur.mjs b/skills/chaine/fusionner/scripts/decision-relecteur.mjs
index 5befb86..f83ffef 100644
--- a/skills/chaine/fusionner/scripts/decision-relecteur.mjs
+++ b/skills/chaine/fusionner/scripts/decision-relecteur.mjs
@@ -323,7 +323,7 @@ export function tourValide(entree) {
   return juge !== null && juge.etat === 'valide' ? juge : null;
 }
 
-const ETATS_DE_SESSION = ['vivante', 'morte', 'plafond'];
+const ETATS_DE_SESSION = ['vivante', 'morte', 'plafond', 'couple'];
 
 /**
  * @typedef {object} EtatPR
@@ -337,7 +337,9 @@ const ETATS_DE_SESSION = ['vivante', 'morte', 'plafond'];
  * @property {Record<string, boolean|'illisible'>} [memeContenu]  une clé par sommet que `sommetsDesTours` rend, sans exception
  * @property {number} maintenant                      l'instant, en millisecondes depuis l'époque (un nombre fini)
  * @property {number} [delaiMs]                       `relecture.delai` en millisecondes ; `DELAI_MS` par défaut
- * @property {Record<string, 'vivante'|'morte'|'plafond'>} [sessions]  l'état des sessions, quand il est connu
+ * @property {Record<string, 'vivante'|'morte'|'plafond'|'couple'>} [sessions]  l'état des sessions, quand il est connu ;
+ *   `couple` : la session tourne à un autre modèle ou un autre effort que ceux que la PR demande (A-182) : hors
+ *   service comme `morte` ou `plafond`, elle est remplacée, une fois par tour, cause `couple`
  *
  * @param {EtatPR} etat
  * @returns {object}  un seul geste : la première règle qui s'applique
@@ -426,7 +428,8 @@ export function decider(etat) {
     if (sessions.length < exiges) return geste('completer', { manque: exiges - sessions.length });
     const attendues = sessions.filter((s) => verdicts[s]?.verdict !== 'validé');
     const relance = (s) => distributions.findLast((d) => d.mention === 'relance' && d.cible === s) ?? null;
-    const horsService = (s) => propre(connues, s) === 'morte' || propre(connues, s) === 'plafond';
+    // Hors service : morte, au plafond de contexte, ou à un autre couple que celui de la PR (A-182, point 2).
+    const horsService = (s) => ['morte', 'plafond', 'couple'].includes(propre(connues, s));
     const aRelancer = attendues.find((s) => verdicts[s] !== undefined && relance(s) === null && !horsService(s));
     if (aRelancer !== undefined) return geste('reecrire', { session: aRelancer });
     // « Depuis » : la relance de la session, sinon la distribution qui l'a nommée la première dans ce tour.
diff --git a/skills/chaine/fusionner/scripts/decision-relecteur.test.mjs b/skills/chaine/fusionner/scripts/decision-relecteur.test.mjs
index e22c70a..b2762f0 100644
--- a/skills/chaine/fusionner/scripts/decision-relecteur.test.mjs
+++ b/skills/chaine/fusionner/scripts/decision-relecteur.test.mjs
@@ -931,3 +931,23 @@ test("A-118 — une clé venue de l'entrée n'est jamais lue sur un prototype :
   // L'état hérité d'une session n'est pas un état connu.
   assert.equal(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1'])), sessions: Object.create({ r1: 'morte' }) }).raison, 'attente');
 });
+
+// --- Suite du ticket 66 (ticket 68) : A-182, point 2 -------------------------------------------------------------------
+
+test("A-182 (2) — une session à un autre couple que la PR (`couple`) est remplacée, cause `couple`, jamais relancée ; une fois par tour, puis la panne", () => {
+  const distribue = [DEMANDE(), D(1, V1, ['r1'])];
+  assert.deepEqual(joue({ commentaires: fil(...distribue), sessions: { r1: 'couple' } }), { regle: 5, geste: 'remplacer', tour: 1, sommet: V1, sessions: ['r1'], session: 'r1', cause: 'couple' });
+  // Un `incomplet` à relancer, mais la session est à l'ancien couple : remplacée, pas relancée.
+  const incomplet = [...distribue, verdict(1, 'r1', 'incomplet')];
+  assert.equal(joue({ commentaires: fil(...incomplet) }).geste, 'reecrire');
+  assert.deepEqual(joue({ commentaires: fil(...incomplet), sessions: { r1: 'couple' } }), { regle: 5, geste: 'remplacer', tour: 1, sommet: V1, sessions: ['r1'], session: 'r1', cause: 'couple' });
+  // Une PR devenue double : la session ajoutée d'abord (`completer`), puis l'ancienne au mauvais couple remplacée.
+  assert.equal(joue({ commentaires: fil(...distribue), exiges: 2, sessions: { r1: 'couple' } }).geste, 'completer');
+  assert.deepEqual(joue({ commentaires: fil(DEMANDE(), D(1, V1, ['r1']), D(1, V1, ['r1', 'r2'], 'complète')), exiges: 2, sessions: { r1: 'couple', r2: 'vivante' } }), { regle: 5, geste: 'remplacer', tour: 1, sommet: V1, sessions: ['r1', 'r2'], session: 'r1', cause: 'couple' });
+  // Déjà remplacée une fois dans ce tour : la remplaçante à un autre couple, c'est la panne.
+  const remplace = [...distribue, D(1, V1, ['r2'], 'remplace', 'r1')];
+  assert.equal(joue({ commentaires: fil(...remplace), sessions: { r2: 'couple' } }).geste, 'panne');
+  // `vivante` reste vivante, et un mot hors des quatre reste refusé.
+  assert.equal(joue({ commentaires: fil(...distribue), sessions: { r1: 'vivante' } }).raison, 'attente');
+  assert.throws(() => joue({ commentaires: fil(...distribue), sessions: { r1: 'autre-couple' } }), TypeError);
+});
diff --git a/skills/chaine/relecteur/scripts/relecteur.mjs b/skills/chaine/relecteur/scripts/relecteur.mjs
index c598be9..f4fab5e 100644
--- a/skills/chaine/relecteur/scripts/relecteur.mjs
+++ b/skills/chaine/relecteur/scripts/relecteur.mjs
@@ -32,8 +32,9 @@
 //     push tombé entre la préparation et la lecture de la PR n'en est pas une), dépendances de develop (une installation
 //     en échec), forme refusée par `a-juger` (la ligne va à l'auteur, la seule cause qui soit à lui), `a-juger` ou le
 //     diff en échec — et rien tant que cette trace est la plus récente et date de `relecture.delai` au plus (A-116) ;
-//   - `--sessions <fichier>` : un objet JSON { <session>: vivante | morte | plafond } que le modèle a lu (get_session) ;
-//     une autre forme sort en 2, la cause dite.
+//   - `--sessions <fichier>` : un objet JSON { <session>: vivante | morte | plafond | couple } que le modèle a lu
+//     (get_session ; `couple` : la session tourne à un autre modèle ou un autre effort que `faits`, A-182) ; une autre
+//     forme sort en 2, la cause dite.
 //
 // `passe` écrit une ligne JSON par PR ouverte : `{ pr, base, tete, branche, regle, geste, …, faits }`, `geste` valant
 // `hors-regime` (régime 7, ou base hors de la chaîne), `contrat-illisible` (la clé `relecture` mal formée), `pause`
@@ -41,10 +42,13 @@
 // `modele`/`effort` de la session à créer (A-128 : `relecture.sensible` quand le diff touche un chemin sensible ou
 // que deux verdicts sont exigés, `relecture.ordinaire` sinon), et `auteur`, `conducteur`, lus sur la dernière demande.
 // `jouer <n>` refait la décision de la PR n et joue ce qui s'écrit sur GitHub : une étiquette (la nouvelle posée avant
-// que l'ancienne soit retirée, A-84), le commentaire du plafond, de la panne ou de l'illisible. Il écrit une ligne JSON :
-// la décision, `joue` (vrai s'il a écrit), et `lignes`, ce que le modèle envoie (`send_message`) ; une étiquette déjà
-// posée avant lui n'envoie aucune ligne : une ligne ne part qu'au changement d'étiquette (A-85, A-118), ou avec le
-// commentaire du plafond, qui ne s'écrit qu'une fois. Un geste de
+// que l'ancienne soit retirée, A-84), le commentaire du plafond, de la panne ou de l'illisible ; au plafond, l'étiquette
+// d'abord, puis le commentaire : un plafond à moitié écrit se rejoue entier, ses lignes avec lui. Il écrit une ligne
+// JSON : la décision, `joue` (vrai s'il a écrit), et `lignes`, ce que le modèle envoie (`send_message`). Une ligne ne
+// part qu'au changement d'étiquette (A-85, A-118), ou avec le commentaire du plafond, qui ne s'écrit qu'une fois. Une
+// étiquette déjà posée ne renvoie rien si les événements de la PR la disent posée après sa marque la plus récente (un
+// passage rejoué) ; posée avant (restée d'un tour d'avant), à la même seconde, ou sans pose lisible, ses lignes
+// partent (`marque` : la date de cette marque, rendue avec un geste `etiqueter`). Un geste de
 // session (`distribuer`, `completer`, `remplacer`, `reecrire`) n'écrit rien : c'est au modèle de le jouer.
 // `distribuer <n> --sommet <sha> --couple <modele>/<effort> [<session>…]` écrit la distribution d'un geste de session,
 // après que le modèle a créé ou relancé les sessions (A-85, règle 6) : il refait la décision, refuse (sortie 3) si le
@@ -81,7 +85,7 @@ const ROUTE = 'repos/{owner}/{repo}';
 const ID = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;
 const EFFORTS = ['low', 'medium', 'high', 'xhigh', 'max'];
 const MODELES = ['opus', 'sonnet'];
-const ETATS = ['vivante', 'morte', 'plafond'];
+const ETATS = ['vivante', 'morte', 'plafond', 'couple'];
 const DEFAUTS = { delai: 120, ordinaire: { modele: 'opus', effort: 'medium' }, sensible: { modele: 'opus', effort: 'xhigh' } };
 
 class Arret extends Error {
@@ -232,7 +236,7 @@ function lireSessions(argv) {
   } catch (e) {
     return arreter(2, `--sessions : ${fichier} ne se lit pas en JSON (${e.message})`);
   }
-  if (etats === null || typeof etats !== 'object' || Array.isArray(etats)) arreter(2, `--sessions : ${fichier} n'est pas un objet { <session>: vivante | morte | plafond }`);
+  if (etats === null || typeof etats !== 'object' || Array.isArray(etats)) arreter(2, `--sessions : ${fichier} n'est pas un objet { <session>: vivante | morte | plafond | couple }`);
   for (const [id, etat] of Object.entries(etats)) {
     if (!ID.test(id)) arreter(2, `--sessions : « ${id} » n'est pas un identifiant de session`);
     if (!ETATS.includes(etat)) arreter(2, `--sessions : ${id} vaut « ${etat} », attendu ${ETATS.join(', ')}`);
@@ -271,9 +275,12 @@ async function decision(json, sessions) {
       memeContenu[s] = r.status === 0 ? true : r.status === 20 ? false : 'illisible';
     }
     const geste = d.decider({ ...commun, commentaires, exiges: faits.exiges, sensible: faits.sensible, memeContenu });
-    const demande = d.lireMarques(commentaires, { tolerant: true }).demandes.at(-1) ?? { auteur: null, conducteur: null };
+    const marques = d.lireMarques(commentaires, { tolerant: true });
+    const demande = marques.demandes.at(-1) ?? { auteur: null, conducteur: null };
     const couple = faits.sensible || faits.exiges === 'illisible' || faits.exiges >= 2 ? cle.sensible : cle.ordinaire;
-    return { ...tete, ...geste, faits: { ...faits, modele: couple.modele, effort: couple.effort, auteur: demande.auteur, conducteur: demande.conducteur } };
+    // Pour `jouer` : la date de la marque la plus récente (`dernier`), que la pose d'une étiquette déjà là doit suivre.
+    const marque = geste.geste === 'etiqueter' ? { marque: commentaires[marques.dernier]?.created_at ?? null } : {};
+    return { ...tete, ...geste, ...marque, faits: { ...faits, modele: couple.modele, effort: couple.effort, auteur: demande.auteur, conducteur: demande.conducteur } };
   } catch (e) {
     if (e instanceof v.LectureIllisible) return { ...tete, regle: null, geste: 'pause', raison: `commentaires illisibles : ${e.message}` };
     throw e;
@@ -293,6 +300,18 @@ function illisible(d, commentaires, commun, { cause, a }) {
   return { regle: null, geste: 'illisible', commentaire, lignes };
 }
 
+// Vrai quand la dernière pose de l'étiquette `nom` sur la PR `n` (ses événements, toutes pages) est plus récente que
+// `marque` : `jouer` rejoue un passage qui l'a posée, ses lignes sont parties ou perdues avec lui (A-118). Faux quand
+// elle est plus ancienne (une étiquette restée d'un tour d'avant, que l'auteur n'a pas retirée), à la même seconde,
+// sans marque ou sans pose lue : dans le doute, la ligne part.
+function poseeApres(n, nom, marque) {
+  if (marque === null || !Number.isFinite(Date.parse(marque))) return false;
+  const evenements = lire(`${ROUTE}/issues/${n}/events?per_page=100`, { pages: true });
+  if (!Array.isArray(evenements)) arreter(5, `GitHub illisible (événements de la PR ${n})`);
+  const pose = evenements.findLast((e) => e?.event === 'labeled' && typeof e.label?.name === 'string' && e.label.name.normalize('NFC') === nom);
+  return pose !== undefined && Date.parse(pose.created_at) > Date.parse(marque);
+}
+
 const ecrire = (fonction, ...args) => {
   const r = github(fonction, ...args);
   if (r.status !== 0) arreter(7, `écriture refusée (${fonction} ${args[0]}) : ${(r.stderr || '').trim().split('\n').at(-1)}`);
@@ -316,20 +335,22 @@ async function jouerGeste(argv) {
   const avant = (json.labels ?? []).map((l) => l.name.normalize('NFC'));
   let joue = false;
   let lignes = g.lignes ?? [];
-  if (g.geste === 'plafonner' || g.geste === 'panne' || g.geste === 'illisible') {
-    ecrire('commenter', String(n), g.commentaire);
+  if (g.geste === 'etiqueter' || g.geste === 'plafonner') {
+    // La nouvelle avant l'ancienne (A-84) : jamais une PR sans étiquette. Déjà posée après la marque la plus récente :
+    // un passage rejoué, aucune ligne ne repart ; posée avant, une étiquette restée : ses lignes partent.
+    // Un plafond ne rend pas de `marque` : son commentaire est neuf par construction, ses lignes partent toujours, même
+    // sur une étiquette `à-reprendre` restée (le plafond ne se décide que sans commentaire de plafond depuis la
+    // dernière décision).
+    if (!avant.includes(g.poser)) ecrire('poser_label', String(n), g.poser);
+    else if (poseeApres(n, g.poser, g.marque ?? null)) lignes = [];
     joue = true;
   }
-  if (g.geste === 'etiqueter' || g.geste === 'plafonner') {
-    // La nouvelle avant l'ancienne (A-84) : jamais une PR sans étiquette. Déjà posée : aucune ligne ne repart.
-    if (avant.includes(g.poser)) lignes = [];
-    else ecrire('poser_label', String(n), g.poser);
-    for (const e of g.retirer) ecrire('retirer_label', String(n), e);
+  // Au plafond, après l'étiquette : un commentaire refusé laisse le plafond à décider de nouveau, ses lignes entières.
+  if (g.geste === 'plafonner' || g.geste === 'panne' || g.geste === 'illisible') {
+    ecrire('commenter', String(n), g.commentaire);
     joue = true;
   }
-  // Le plafond ne se décide que sans commentaire de plafond depuis la dernière décision : celui qu'il vient d'écrire
-  // est neuf, et ses lignes n'ont jamais pu partir, même si `à-reprendre` était déjà posée (une étiquette restée).
-  if (g.geste === 'plafonner') lignes = g.lignes;
+  for (const e of g.retirer ?? []) ecrire('retirer_label', String(n), e);
   process.stdout.write(`${JSON.stringify({ ...g, joue, lignes })}\n`);
 }
 
diff --git a/skills/chaine/relecteur/scripts/relecteur.test.mjs b/skills/chaine/relecteur/scripts/relecteur.test.mjs
index c845332..96c4fcc 100644
--- a/skills/chaine/relecteur/scripts/relecteur.test.mjs
+++ b/skills/chaine/relecteur/scripts/relecteur.test.mjs
@@ -124,20 +124,22 @@ test('nominal : distribuer (r6), écrire la distribution après la session, atte
   assert.deepEqual([encore.geste, encore.raison, encore.joue, encore.lignes], ['rien', 'etiquette-en-place', false, []]);
 });
 
-test('les étiquettes se comparent en NFC : `à-fusionner` décomposée est déjà posée, aucune pose, aucune ligne', () => {
+test('les étiquettes se comparent en NFC : `à-fusionner` décomposée est déjà posée (après le verdict, un passage rejoué), aucune pose, aucune ligne', () => {
   const d = monter();
   const sha = pr(d, { labels: ['a\u0300-relire', 'a\u0300-fusionner'] });
   ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'validé'), 3]);
+  d.github({ pulls: [{ ...d.etat().pulls[0], evenements: [{ event: 'labeled', label: 'a\u0300-fusionner', created_at: minute(4) }] }] });
   const g = d.json(d.lancer('jouer', '12'))[0];
   assert.deepEqual([g.geste, g.poser, g.lignes], ['etiqueter', 'à-fusionner', []]);
   assert.ok(!ecritures(d).some((e) => e.startsWith('POST')), 'rien de posé');
 });
 
-test('une étiquette déjà posée avant le geste n’envoie aucune ligne : l’ancienne est retirée, sans redire le verdict', () => {
+test('une étiquette déjà posée après la marque la plus récente (un passage rejoué) n’envoie aucune ligne : l’ancienne est retirée, sans redire le verdict', () => {
   const d = monter();
   const sha = pr(d, { labels: ['à-relire', 'à-fusionner'] });
   const p = d.etat().pulls[0];
   p.commentaires.push({ body: distribution(1, sha, ['session_rel1']), created_at: minute(2) }, { body: verdict(sha, 1, 'session_rel1', 'validé'), created_at: minute(3) });
+  p.evenements = [{ event: 'labeled', label: 'à-fusionner', created_at: minute(4) }];
   d.github({ pulls: [p] });
   const g = d.json(d.lancer('jouer', '12'))[0];
   assert.deepEqual([g.geste, g.poser, g.retirer, g.lignes], ['etiqueter', 'à-fusionner', ['à-relire'], []]);
@@ -193,7 +195,7 @@ test('règle 5 : une session que le modèle lit morte est remplacée une fois, l
   assert.equal(e.json(q)[0].distribution, distribution(1, s2, ['session_rel2'], ' (remplace session_rel1)'));
 });
 
-test('le plafond : au troisième tour refusé, le commentaire `Plafond — décision attendue`, puis `à-reprendre` ; l’architecte prévenu', () => {
+test('le plafond : au troisième tour refusé, `à-reprendre`, puis le commentaire `Plafond — décision attendue` ; l’architecte prévenu', () => {
   const d = monter();
   const sha = pr(d);
   const p = d.etat().pulls[0];
@@ -203,7 +205,7 @@ test('le plafond : au troisième tour refusé, le commentaire `Plafond — déci
   const g = d.json(d.lancer('jouer', '12'))[0];
   assert.deepEqual([g.regle, g.geste, g.joue], [1, 'plafonner', true]);
   assert.deepEqual(g.lignes.map((l) => l.a), ['auteur', 'conducteur', 'architecte']);
-  assert.deepEqual(ecritures(d), ['POST issues/12/comments', 'POST issues/12/labels à-reprendre', 'DELETE issues/12/labels/à-relire']);
+  assert.deepEqual(ecritures(d), ['POST issues/12/labels à-reprendre', 'POST issues/12/comments', 'DELETE issues/12/labels/à-relire'], 'l’étiquette, puis le commentaire, puis le retrait (suite du ticket 66)');
   assert.equal(d.etat().pulls[0].commentaires.at(-1).body, 'Plafond — décision attendue');
   assert.equal(d.json(d.lancer('jouer', '12'))[0].geste, 'rien', 'rejoué : rien, aucune ligne de plus');
 });
@@ -773,3 +775,89 @@ test('suite 66 — 18 : un push entre la préparation et la lecture de la PR : l
   assert.deepEqual([g.tete, g.geste, g.regle], [neuf, 'distribuer', 6], JSON.stringify(g));
   assert.ok(!d.etat().pulls[0].commentaires.some((c) => /^Lecture illisible/.test(c.body ?? c)), 'aucune trace d’illisible');
 });
+
+// --- Suite du ticket 66, ticket 68 : une étiquette restée, un plafond à moitié écrit, une session à un autre couple ---
+
+test('suite 66 — C11 : une étiquette restée d’un tour d’avant (posée avant le verdict) n’est pas un passage rejoué : le refus se dit à l’auteur et au conducteur ; à la même seconde, ou sans pose lue, aussi', () => {
+  for (const [nom, evenements] of [
+    ['posée avant le verdict', [{ event: 'labeled', label: 'à-reprendre', created_at: minute(2) }]],
+    ['posée à la seconde du verdict', [{ event: 'labeled', label: 'à-reprendre', created_at: minute(3) }]],
+    ['aucune pose lue', []],
+    ['un retrait n’est pas une pose', [{ event: 'labeled', label: 'à-reprendre', created_at: minute(2) }, { event: 'unlabeled', label: 'à-reprendre', created_at: minute(5) }]],
+    ['la pose d’une autre étiquette ne compte pas', [{ event: 'labeled', label: 'à-reprendre', created_at: minute(2) }, { event: 'labeled', label: 'à-autre', created_at: minute(5) }]],
+  ]) {
+    const d = monter();
+    const sha = pr(d, { labels: ['à-relire', 'à-reprendre'] });
+    ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3]);
+    d.github({ pulls: [{ ...d.etat().pulls[0], evenements }] });
+    const g = d.json(d.lancer('jouer', '12'))[0];
+    assert.deepEqual([g.regle, g.geste, g.marque], [4, 'etiqueter', minute(3)], nom);
+    assert.deepEqual(g.lignes.map((l) => [l.a, l.texte]), [['auteur', 'verdict écrit sur la PR 12 : refusé'], ['conducteur', 'verdict écrit sur la PR 12 : refusé']], nom);
+    assert.deepEqual(ecritures(d), ['DELETE issues/12/labels/à-relire'], `${nom} : rien de posé, l’ancienne retirée`);
+  }
+});
+
+test('suite 66 — C11, A-183 point 6 : une marque plus récente que la pose (une demande refaite sans push) fait repartir les lignes', () => {
+  const d = monter();
+  const sha = pr(d, { labels: ['à-relire', 'à-reprendre'] });
+  // Le tour refusé (minute 3), `à-reprendre` posée par le Relecteur après lui (minute 4), puis l'auteur redemande la
+  // relecture du même sommet (minute 5) sans retirer `à-reprendre` : la marque la plus récente est sa demande.
+  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3], [DEMANDE(sha), 5]);
+  d.github({ pulls: [{ ...d.etat().pulls[0], evenements: [{ event: 'labeled', label: 'à-reprendre', created_at: minute(4) }] }] });
+  const g = d.json(d.lancer('jouer', '12'))[0];
+  assert.deepEqual([g.regle, g.geste, g.marque], [4, 'etiqueter', minute(5)], JSON.stringify(g));
+  assert.deepEqual(g.lignes.map((l) => l.a), ['auteur', 'conducteur'], 'posée avant la marque la plus récente : les lignes partent');
+});
+
+test('suite 66 — un passage rejoué (l’étiquette posée par lui, après le verdict, l’ancienne pas retirée) ne redit rien ; la dernière pose compte', () => {
+  const d = monter();
+  const sha = pr(d);
+  ajouter(d, [distribution(1, sha, ['session_rel1']), 2], [verdict(sha, 1, 'session_rel1', 'refusé'), 3]);
+  // Un retrait refusé (et tu, comme `retirer_label` le fait) : la PR garde ses deux étiquettes.
+  Object.assign(d.env, { BANC_FAUX_GH: join(CHAINE, 'sujet/scripts/faux-gh.mjs') });
+  writeFileSync(join(d.racine, 'bin/gh'), '#!/bin/sh\ncase "$*" in *"-X DELETE"*labels*) echo "gh: Bad Gateway (HTTP 502)" >&2; exit 1 ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n');
+  const premier = d.json(d.lancer('jouer', '12'))[0];
+  assert.deepEqual(premier.lignes.map((l) => l.a), ['auteur', 'conducteur']);
+  assert.deepEqual(d.etat().pulls[0].labels, ['à-relire', 'à-reprendre']);
+  const rejoue = d.json(d.lancer('jouer', '12'))[0];
+  assert.deepEqual([rejoue.geste, rejoue.poser, rejoue.lignes], ['etiqueter', 'à-reprendre', []], 'posée à la minute 30, après le verdict de la minute 3 : rien ne repart');
+  // Posée une première fois avant le verdict, retirée, puis reposée après lui : la dernière pose compte.
+  const e = monter();
+  const s2 = pr(e, { labels: ['à-relire', 'à-reprendre'] });
+  ajouter(e, [distribution(1, s2, ['session_rel1']), 2], [verdict(s2, 1, 'session_rel1', 'refusé'), 3]);
+  const evenements = [['labeled', 1], ['unlabeled', 2], ['labeled', 4]].map(([event, m]) => ({ event, label: 'à-reprendre', created_at: minute(m) }));
+  e.github({ pulls: [{ ...e.etat().pulls[0], evenements }] });
+  assert.deepEqual(e.json(e.lancer('jouer', '12'))[0].lignes, []);
+});
+
+test('suite 66 — C12 : un plafond à moitié écrit se rejoue entier : l’étiquette d’abord ; la pose ou le commentaire refusés, le rejeu prévient l’architecte, un seul commentaire', () => {
+  for (const refus of ['-X POST*labels', '-X POST*comments']) {
+    const d = monter();
+    const sha = pr(d);
+    let m = 2;
+    for (const tour of [1, 2, 3]) ajouter(d, [distribution(tour, sha, ['session_rel1']), m++], [verdict(sha, tour, 'session_rel1', 'refusé'), m++]);
+    // Un gh qui refuse une fois la première écriture de cette forme, puis laisse passer.
+    Object.assign(d.env, { BANC_FAUX_GH: join(CHAINE, 'sujet/scripts/faux-gh.mjs'), BANC_REFUS: refus });
+    writeFileSync(join(d.racine, 'bin/gh'), '#!/bin/sh\ncase "$*" in *"-X POST"*) case "$BANC_REFUS:$*" in *labels:*labels*|*comments:*comments*) if [ ! -e "$FAUX_GH/refus-fait" ]; then touch "$FAUX_GH/refus-fait"; echo "gh: Bad Gateway (HTTP 502)" >&2; exit 1; fi ;; esac ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n');
+    assert.equal(d.lancer('jouer', '12').status, 7, refus);
+    const r = d.lancer('jouer', '12');
+    assert.equal(r.status, 0, r.stderr);
+    const g = d.json(r)[0];
+    assert.deepEqual([g.geste, g.lignes.map((l) => l.a)], ['plafonner', ['auteur', 'conducteur', 'architecte']], refus);
+    assert.equal(d.etat().pulls[0].commentaires.filter((c) => (c.body ?? c) === 'Plafond — décision attendue').length, 1, refus);
+    assert.deepEqual(d.etat().pulls[0].labels, ['à-reprendre'], refus);
+  }
+});
+
+test('suite 66 — A-182 (2) : une session que le modèle lit à un autre couple (`couple`) est remplacée, cause `couple`, au couple que la PR demande', () => {
+  const d = monter();
+  const sha = pr(d, { fichiers: { 'scripts/agent/garde.mjs': 'export const g = 1;\n' } });
+  ajouter(d, [distribution(1, sha, ['session_rel1']), 2]);
+  const etats = join(d.racine, 'sessions.json');
+  writeFileSync(etats, JSON.stringify({ session_rel1: 'couple' }));
+  const g = d.json(d.lancer('jouer', '12', '--sessions', etats))[0];
+  assert.deepEqual([g.geste, g.session, g.cause, g.faits.modele, g.faits.effort], ['remplacer', 'session_rel1', 'couple', 'opus', 'xhigh']);
+  const r = distribuer(d, sha, 'opus/xhigh', 'session_rel2', '--sessions', etats);
+  assert.equal(r.status, 0, r.stderr);
+  assert.equal(d.json(r)[0].distribution, distribution(1, sha, ['session_rel2'], ' (remplace session_rel1)'));
+});
diff --git a/skills/chaine/sujet/scripts/faux-gh.mjs b/skills/chaine/sujet/scripts/faux-gh.mjs
index 25a81cb..e32f1a2 100644
--- a/skills/chaine/sujet/scripts/faux-gh.mjs
+++ b/skills/chaine/sujet/scripts/faux-gh.mjs
@@ -8,6 +8,10 @@
 //   maintenant  ISO 8601 : la date que reçoit tout commentaire posé (`POST issues/<n>/comments`), à la place de la date
 //               de son rang ; le banc l'avance, comme l'horloge de GitHub. Sans la clé, la date du rang
 //               `commentaires` : [corps], écrits par le compte du capitaine, ou { auteur, body } d'un autre compte
+//               `evenements` : les poses et retraits d'étiquettes, [{ event: labeled | unlabeled, label: <nom>,
+//               created_at }], que `GET issues/<n>/events` rend comme GitHub ({ event, label: { name }, created_at }) ;
+//               une pose (`POST issues/<n>/labels`) d'une étiquette absente y ajoute `labeled`, un retrait `unlabeled`,
+//               datés de `maintenant` (sans la clé, l'heure de la machine)
 //   capitaine   compte que rend `gh api user` (défaut « capitaine ») ; compteIllisible : `user` répond 403
 //   refusPost   message d'un refus du `POST pulls` (`gh: … (HTTP 422)`), code 1
 //   brancheParDefaut  branche par défaut du dépôt (défaut « main »), dans `base.repo.default_branch`
@@ -173,6 +177,11 @@ function versRest(pr) {
     requested_teams: (pr.equipes ?? []).map((slug) => ({ slug })),
   };
 }
+// Une pose ou un retrait d'étiquette, daté comme un commentaire posé : `maintenant`, sinon l'heure de la machine.
+function evenement(p, event, label) {
+  p.evenements ??= [];
+  p.evenements.push({ event, label, created_at: etat.maintenant ?? new Date().toISOString().replace(/\.\d{3}Z$/, "Z") });
+}
 // Date d'un commentaire sans date, par son rang : 2026-11-17T12:00:00Z, puis une seconde de plus par rang.
 const dateDuRang = (i) => new Date(Date.UTC(2026, 10, 17, 12, 0, i)).toISOString().replace(/\.000Z$/, "Z");
 // Commentaire `i` de la PR `p`, comme GitHub le rend. Id unique dans le dépôt (numéro × 1000 + rang + 1), croissant
@@ -296,6 +305,7 @@ function repondre() {
     return fusionner(pr(m[1]), JSON.parse(entree));
   if ((m = route.match(/^issues\/(\d+)\/labels$/)) && methode === "POST") {
     const p = pr(m[1]);
+    if (!(p.labels ?? []).includes(champs["labels[]"])) evenement(p, "labeled", champs["labels[]"]);
     p.labels = [...new Set([...(p.labels ?? []), champs["labels[]"]])];
     return p.labels.map((name) => ({ name }));
   }
@@ -308,8 +318,12 @@ function repondre() {
     if (!(p.labels ?? []).includes(nom))
       echec("gh: Label does not exist (HTTP 404)");
     p.labels = p.labels.filter((l) => l !== nom);
+    evenement(p, "unlabeled", nom);
     return [];
   }
+  // Les événements d'étiquette de la PR, comme GitHub les rend (le Relecteur les lit pour une étiquette déjà posée).
+  if ((m = route.match(/^issues\/(\d+)\/events$/)) && methode === "GET")
+    return (pr(m[1]).evenements ?? []).map((e) => ({ event: e.event, label: { name: e.label }, created_at: e.created_at }));
   if ((m = route.match(/^issues\/(\d+)\/comments$/)) && methode === "POST") {
     const refus = etat.commentairesRefuses;
     if (refus === true || (typeof refus === "string" && new RegExp(refus).test(champs.body ?? "")))
diff --git a/skills/chaine/sujet/scripts/faux-gh.test.mjs b/skills/chaine/sujet/scripts/faux-gh.test.mjs
index f752286..37f864b 100644
--- a/skills/chaine/sujet/scripts/faux-gh.test.mjs
+++ b/skills/chaine/sujet/scripts/faux-gh.test.mjs
@@ -304,3 +304,22 @@ test('faux gh, Relecteur : une PR rend sa date d’ouverture (défaut ou la sien
     ['à l’heure', '2026-11-20T09:05:00Z'],
   ]);
 });
+
+// Suite du ticket 66 (ticket 68) : le Relecteur lit les événements d'une PR pour savoir quand une étiquette déjà posée
+// l'a été (une étiquette restée d'un tour d'avant, ou un passage rejoué) : le faux les tient comme GitHub.
+test('faux gh, événements : une pose d’étiquette absente ajoute `labeled`, un retrait `unlabeled`, datés de `maintenant` ; `GET issues/<n>/events` les rend comme GitHub', () => {
+  const d = depotJouet();
+  d.github({ pulls: [{ number: 3, title: 't', base: 'develop', head: 'x', labels: ['à-relire'], evenements: [{ event: 'labeled', label: 'à-relire', created_at: '2026-11-20T09:00:00Z' }] }], maintenant: '2026-11-20T10:00:00Z' });
+  assert.equal(gh(d, '-X', 'POST', 'repos/{owner}/{repo}/issues/3/labels', '-f', 'labels[]=à-fusionner').status, 0);
+  assert.equal(gh(d, '-X', 'POST', 'repos/{owner}/{repo}/issues/3/labels', '-f', 'labels[]=à-fusionner').status, 0, 'déjà posée : aucun événement de plus');
+  d.github({ maintenant: '2026-11-20T10:01:00Z' });
+  assert.equal(gh(d, '-X', 'DELETE', `repos/{owner}/{repo}/issues/3/labels/${encodeURIComponent('à-relire')}`).status, 0);
+  const lus = JSON.parse(gh(d, 'repos/{owner}/{repo}/issues/3/events?per_page=100').stdout);
+  assert.deepEqual(lus, [
+    { event: 'labeled', label: { name: 'à-relire' }, created_at: '2026-11-20T09:00:00Z' },
+    { event: 'labeled', label: { name: 'à-fusionner' }, created_at: '2026-11-20T10:00:00Z' },
+    { event: 'unlabeled', label: { name: 'à-relire' }, created_at: '2026-11-20T10:01:00Z' },
+  ]);
+  d.github({ pulls: [{ number: 4, title: 'u', base: 'develop', head: 'y', labels: [] }] });
+  assert.deepEqual(JSON.parse(gh(d, 'repos/{owner}/{repo}/issues/4/events').stdout), [], 'une PR sans événement : une liste vide');
+});
```

## Surfaces

| Surface | Preuve |
| --- | --- |
| Une étiquette restée (posée avant la marque, à la même seconde, sans pose lue) : les lignes partent | `relecteur.test.mjs`, « suite 66 — C11 » (cinq états) ; mutations B1, B3, B5, B6, B8 |
| La marque est la plus récente (`dernier`, `A-183` point 6) : une demande refaite après la pose fait repartir les lignes | « suite 66 — C11, A-183 point 6 » (l'essai `essai-marque` du tour de relecture) ; mutation B19 |
| Un passage rejoué (posée après la marque ; la dernière pose compte ; NFC) : aucune ligne | « suite 66 — un passage rejoué », « NFC », « une étiquette déjà posée après la marque la plus récente » ; mutations B2, B4, B7 |
| Au plafond, l'étiquette, puis le commentaire, puis le retrait ; un plafond à moitié écrit se rejoue entier | « le plafond », « suite 66 — C12 » (la pose refusée, le commentaire refusé) ; mutations B9, B10, B11 |
| L'état `couple` lu, la session remplacée, cause `couple`, une fois par tour | `decision-relecteur.test.mjs`, « A-182 (2) » ; `relecteur.test.mjs`, « suite 66 — A-182 (2) » ; mutations B12, B13, B14 |
| Le faux GitHub rend les événements d'étiquette | `faux-gh.test.mjs`, « faux gh, événements » ; mutations B15 à B18 |

## Mutations

Dans [`67-annexes/mutations.mjs`](67-annexes/mutations.mjs), B1 à B19 (B19 est G5 du tour de relecture), sur l'arbre de la PR, chacune seule : **19 sur 19 rouges** (journal : [`67-annexes/mutations.txt`](67-annexes/mutations.txt)).

## Vérification

1. Le rouge, avant le code (§ 1) : 7 rouges sur 98.
2. Le vert, après : les trois bancs, 98 sur 98 (42 pour le Relecteur, 40 pour la décision, 16 pour le faux).
3. Les mutations B1 à B19 : « toutes rouges ».
4. La suite entière : « Vérification » du ticket 69, pour la PR.

### Ce qui a été joué en écrivant ce ticket

Sur le même clone neuf, après le ticket 67 :

- **Rouge avant le code.** Les trois bancs du ticket sur l'arbre du ticket 67 : **7 rouges sur 98** (ceux du § 1).
- **Vert après.** Le diff du ticket : 98 sur 98.
- **Mutations.** B1 à B18, sur l'arbre de la PR : 18 sur 18 rouges ; B19, ajoutée après le tour de relecture, rouge.
- **Le doute à la seconde près.** Le cas « suite 66 — C11 » joue cinq états : la pose avant le verdict, à la même minute, aucune pose, un retrait plus récent, la pose d'une autre étiquette ; chacun rend les deux lignes. Le cas « un passage rejoué » joue la vraie course : un retrait refusé (et tu) laisse les deux étiquettes, le rejeu ne redit rien.
- **Les essais du rapport**, rejoués : C11 et C12 (`essais-c1.test.mjs`) rouges sur `25a72c7`, verts sur l'arbre de la PR.

## Ce qui n'a pas été établi

- **Les événements d'une vraie PR** ne sont lus par aucun banc : le faux rend la forme que l'API REST documente pour `GET /repos/{owner}/{repo}/issues/{n}/events` (`event`, `label.name`, `created_at`, à la seconde). Une PR à plus de cent événements se lit par `--paginate`, comme ses commentaires, jouée sur une page seulement.
- **Une pose faite à la main par quelqu'un après la marque** passe pour un passage rejoué : aucune ligne. C'est le côté d'`A-118` ; la PR porte alors l'étiquette juste, posée par un humain.
- **Le couple d'une session** n'est lu que par le modèle (`get_session`) : aucun banc ne joue cet outil, comme au ticket 66 (« Ce qui n'a pas été établi », point 5).

## Hors périmètre

- Le texte du skill qui dit quand écrire `couple` : ticket 69.
- Le second remède de C12 (la règle 1 qui rendrait l'architecte) : question 1.

## Comments

- 2026-11-21 — Retouché après le tour unique de relecture (`67-annexes/relecture-tour-1/rapport.md`, constat 4 ; `A-184`, point 3) : le cas de l'essai `essai-marque` au banc du Relecteur, et sa mutation G5 dans l'annexe, sous le nom B19 ; 7 rouges sur 98 avant le code.

- 2026-11-21 — Écrit par un agent rédacteur sur la liste consolidée du rapport de contre-relecture de la PR 146 et sur `A-182` ; code, bancs et mutations joués sur un clone neuf de `25a72c7` (« Vérification »).
