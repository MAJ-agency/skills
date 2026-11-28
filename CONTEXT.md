# Chaîne de production par agents

Le vocabulaire de la méthode que ce dépôt pose dans les projets : qui tient quel rôle quand plusieurs sessions d'agent construisent un logiciel en parallèle.

## Language

### Rôles

**Produit**:
La personne qui tranche ce qui change la vie des utilisateurs, le coût ou le délai, et qui répond du résultat.
_Avoid_: client, humain, PO

**Architecte**:
La session unique d'un programme qui mène l'amont — questions au produit, décisions, specs — et qui est seule à parler au produit.
_Avoid_: conducteur (ancien sens, cartes d'avant le 2026-11-13), architecte de chantier

**Conducteur de chantier**:
La session qui fait tourner un chantier à partir d'une spec validée : elle découpe les tickets, lance les sessions filles et les suit.
_Avoid_: architecte (ancien sens, cartes d'avant le 2026-11-13), chef de chantier

**Session fille**:
La session qui réalise un ticket, et un seul, puis s'arrête.
_Avoid_: worker, sous-agent (un sous-agent vit dans la session qui le lance)

**Capitaine de fusion**:
Une session qui fait entrer les PR prêtes dans la branche d'intégration, une par une ; plusieurs peuvent tenir la même file.
_Avoid_: merger, intégrateur

### Relecture indépendante

Le vocabulaire du régime 8, où l'auteur d'une PR ne la relit plus. Les textes du régime 7 (`revue-de-ticket`, `revue-adversariale`) gardent leurs mots jusqu'à leur retrait.

**Relecteur**:
La session qui aiguille les relectures d'un dépôt : elle lance une session de relecture par PR, et ne relit rien elle-même.
_Avoid_: « relecteur » pour autre chose (la session qui relit est une session de relecture, son sous-agent un axe)

**Session de relecture**:
La session que le Relecteur lance pour relire une PR, et qui écrit le verdict ; ce n'est jamais l'auteur de la PR.
_Avoid_: relecteur

**Axe**:
Un sous-agent en contexte vierge, lancé par la session de relecture avec une liste fermée de critères.
_Avoid_: relecteur, revue

**Agent défini**:
Une définition de sous-agent livrée par le plugin, lancée par un skill sous son nom `maj-skills:<nom>`, qui fixe ses outils, son modèle et son contexte.
_Avoid_: « agent personnalisé », « type d'agent » pour une définition

**Constat**:
Ce qu'un axe relève. Deux gravités : bloquant (un écart à un critère écrit : il se corrige, ou se conteste) et doute (une question, sans obligation).
_Avoid_: défaut, « à corriger », mineur

**Verdict**:
Le commentaire de la session de relecture sur la PR, de forme fixe ; il vaut validé (aucun bloquant), refusé (au moins un bloquant, même si un axe n'a pas pu être joué) ou incomplet (aucun bloquant, et un axe n'a pas pu être joué).
_Avoid_: « à corriger »

**Tour**:
Une distribution d'une PR à une ou deux sessions de relecture, numérotée, et les verdicts qui y répondent ; il finit validé, refusé ou abandonné.
_Avoid_: aller-retour

**Même contenu propre**:
Deux sommets d'une PR, celui du verdict et celui qu'on juge, que ne séparent que des fusions de la cible et des commits d'index générés. En code : `meme-contenu.sh`.
_Avoid_: « aux index près » sans définition

**Contestation**:
La réponse de l'auteur à un bloquant qu'il juge faux, écrite sur la PR.

**Arbitrage**:
La décision d'un arbitre, qui n'est jamais l'auteur, de maintenir ou d'écarter un bloquant contesté.

**Décision de plafond**:
Ce que décide l'architecte après le troisième tour refusé d'une PR. Ce plafond compte des tours de relecture, pas la mémoire de travail d'une session (« Plafond », plus bas). Au plafond de sa propre PR, voir le skill `architecte`, § 5.
_Avoid_: arbitrage

**Étiquette**:
Un label GitHub posé sur une PR : `à-relire`, `à-reprendre`, `à-fusionner`, `fusion-bloquée`.
_Avoid_: label, dans la prose du régime 8

**Auteur**:
La session qui a écrit la PR.
_Avoid_: propriétaire

**PR de documentation**:
Une PR dont le diff ne contient aucun chemin qui exige la revue, au sens de `revue-exigee.mjs`.
_Avoid_: PR de doc, PR sans code

**Périmètre**:
Ce qu'une PR de documentation déclare contenir avant sa première demande de relecture : ses fichiers, ses décisions, ses sujets ; un commentaire `Périmètre — <objet>`, jamais modifié.
_Avoid_: scope, portée

**Suite**:
Un commentaire `Suite — <objet> — <ticket ou PR>` où l'auteur d'une PR de documentation cite le ticket ou la PR qui reçoit ce qu'il retire ou ce qu'un constat révèle hors de son périmètre ; au tri, la session de relecture classe « renvoyé en suite » un bloquant dont la levée demande une décision, un fait ou un fichier hors du périmètre déclaré, quand une suite nomme un ticket ou une PR qui existe.
_Avoid_: report, reliquat

### Travail

**Programme**:
Un ensemble de chantiers qui servent un même objectif et partagent un architecte.
_Avoid_: projet, épopée

**Chantier**:
Un lot de tickets issu d'une spec, mené par un conducteur de chantier et livré en une fois.

**Responsable**:
La personne nommée qui répond d'un chantier ou d'un programme.
_Avoid_: sprint, lot

**Branche gardée**:
Une branche qu'aucune session n'écrit elle-même : un sujet (`sujet/…`), `develop`, `main` ou la branche par défaut, sous toutes leurs graphies ; le capitaine y entre par ses scripts, le conducteur un sujet par `sujet.sh`. Une seule définition (`brancheGardee`) sert les hooks pour `git push`, `gh` et les outils GitHub.
_Avoid_: branche protégée (réglage côté GitHub)

**Fusion sans effet**:
Une fusion jouée par le capitaine qui n'apporte à un fichier gardé par un hook du projet que des lignes sans effet (`fusionsSansEffet` du contrat, lu sur develop) ; son commit porte la mention que le hook attend. Un changement réel n'en porte aucune.
_Avoid_: dispense, exemption

**Plafond**:
La limite de mémoire de travail au-delà de laquelle une session est signalée au produit, qui décide ; elle n'est jamais interrompue pour cela.
_Avoid_: budget, quota

**Règle d'ascendance**:
La vérification, juste avant chaque fusion, que la PR a été testée sur l'état de la branche où elle entre ; une PR en retard est mise à jour et retestée, sans exception.
_Avoid_: « à jour » au sens du réglage de GitHub

**Verrou du passage**:
Le commentaire marqué `<!-- capitaine:passage <id> <epoch> -->` qu'un capitaine pose sur une PR au début de son passage et termine à sa sortie, TERM et INT compris, même pendant sa pose ou sa relecture : un autre capitaine saute la PR tant qu'il vit (90 minutes depuis sa date, le plus tard de l'epoch de la marque, réécrit à chaque rafraîchissement, et de sa création : au moins 90 minutes depuis sa pose ; un epoch en avance de plus de 5 minutes sur le lecteur est ignoré tant qu'il le reste, puis compte, donc une marque posée par une horloge en avance peut revivre jusqu'à son epoch + 90 minutes ; jamais de gel). Il évite le travail en double, la règle d'ascendance garde la sûreté. En code : `prendre_passage`, `rafraichir_passage`, `finir_passage` (`github.sh`), signés par `CAPITAINE_ID`.
_Avoid_: verrou de la boucle (le `flock`, local à un clone)
