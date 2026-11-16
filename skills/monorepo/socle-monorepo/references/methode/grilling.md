# Grilling — protocole d'interrogatoire d'un plan

Le grilling est la discipline qui précède toute écriture : **faire tomber les non-dits avant de coder ou de documenter**. Il ne s'agit pas de poser quelques questions de clarification puis de foncer — c'est un parcours exhaustif de l'arbre de décision jusqu'à ce qu'il ne reste plus rien de silencieusement supposé.

Sources : skills `mattpocock-skills:grilling`, `grill-with-docs`, `domain-modeling`, `superpowers:brainstorming`.

## Lancer un grilling : toujours par les skills

**On grille toujours avec les skills de Matt Pocock, jamais à la main.** Ce document explique la méthode ; ce sont les skills qui la portent pendant la session.

- **L'humain tape `/mattpocock-skills:grill-with-docs`.** Ce skill charge deux skills : `grilling` (l'interrogatoire par tours) et `domain-modeling` (le glossaire et les ADR écrits au fil de l'eau).
- **L'agent ne peut pas lancer `grill-with-docs` lui-même** : le skill est réservé à l'humain. Quand un grilling s'impose sans qu'on l'ait tapé — un plan à interroger, un terme flou, une décision à prendre —, l'agent charge directement `mattpocock-skills:grilling` puis `mattpocock-skills:domain-modeling`. Le résultat est le même.
- **`grill-me` ne suffit pas ici.** Il ne charge que `grilling` : les questions, sans le glossaire ni les ADR. Si l'humain tape `/mattpocock-skills:grill-me`, l'agent charge aussi `mattpocock-skills:domain-modeling`. Dans ce dépôt, un grilling, c'est toujours `grill-with-docs`.
- **Le glossaire est [`GLOSSARY.md`](../../GLOSSARY.md)**, le nom qu'attendent les skills : ils le lisent et le complètent tels quels. Détail : [`../agents/domain.md`](../agents/domain.md).
- **Ce document reste la référence pour ce que les skills ne disent pas** : la prose en français, le classement des points (nouveau, confirme, précise, contredit), le cycle de validation des règles, la classification de l'effort.

---

## Le modèle : un arbre de décision et sa frontière

Une décision en débloque d'autres. L'ensemble forme un **arbre** : chaque décision branche sur celles qui en dépendent.

La **frontière** est l'ensemble des décisions dont les prérequis sont déjà tranchés — les questions qu'on peut poser **maintenant**, sans deviner une réponse qu'on n'a pas encore entendue.

**Une question dont la réponse dépend d'une autre question encore ouverte dans le tour courant appartient au tour suivant, pas à celui-ci.** C'est la règle qui distingue un grilling d'une avalanche de questions.

---

## Le déroulé : par tours

1. Calculer la frontière.
2. Poser **toute la frontière en un seul tour**, numérotée, chaque question accompagnée de **ta réponse recommandée**.
3. **Attendre** les réponses. Ne rien faire d'autre.
4. Les réponses redessinent l'arbre : les décisions tranchées poussent la frontière plus loin. Recalculer, tour suivant.

Format d'un tour :

```
❓ **Q1** — **<titre de la question>** : <corps de la question, éventuellement plusieurs
paragraphes, éventuellement des choix multiples>

➡️ <ta réponse recommandée>

---

❓ **Q2** — **<titre>** : <corps>

➡️ <ta réponse recommandée>
```

La recommandation n'est pas optionnelle : une question sans recommandation reporte la charge cognitive sur l'humain sans rien lui apporter. Recommander force à avoir un avis, et rend le désaccord facile à exprimer.

---

## Écrire une question qu'un humain comprend

**Une question de grilling se lit sans ouvrir le dépôt.** Elle est écrite pour la personne qui décide, pas pour l'agent qui l'écrit ni pour celui qui la relira. Le test, avant d'envoyer un tour : relire chaque question comme quelqu'un qui ne connaît ni les fichiers ni le code. Si une phrase exige de connaître un nom de fichier, un champ ou une commande pour être comprise, elle est à réécrire.

- **Une idée par phrase.** Des phrases courtes, avec un verbe. Jamais une suite de couples « x → y » séparés par des points-virgules : chaque transformation se dit en une phrase complète, et une liste de cas devient une liste à puces, une phrase par puce.
- **Le mot avant le symbole.** On nomme la chose en français d'abord (« le statut de réalisation », « le fichier généré que lit Anchorpost »). L'identifiant de code vient après, une fois, seulement s'il faut aller le chercher. Au plus un identifiant de code par phrase.
- **Dire ce qui change pour l'humain.** Aujourd'hui, demain, ce que ça coûte, ce que ça casse. Un exemple concret vaut mieux qu'une règle abstraite : montrer la ligne telle qu'elle s'écrira, le nom du test, le nom du fichier.
- **Une analogie quand le concept est neuf**, puis le terme exact du glossaire.
- **Une seule décision par question.** Deux décisions dans une question font une réponse qui n'en tranche aucune.
- **Les choix techniques ne font pas une question.** Commande, outil, bibliothèque, forme d'un fichier de configuration, mécanisme interne : l'agent tranche par défaut prudent, l'écrit dans le ticket ou la carte, et l'humain peut le rouvrir d'un mot. Seules les décisions de standard et de métier lui remontent. La même règle, écrite pour la chaîne de production : `docs/agents/chaine-de-production.md` § « Une question au produit ».

Cas vécu : une question écrite « `couverte` → dérivé (prouvée si une étiquette existe, sinon `à construire` + alerte santé) ; `configuree` → dérivé (`config[]` non vide et aucune preuve) ; … » a reçu « rien compris » et a coûté un tour entier. La même question, lisible : « Aujourd'hui le projet écrit à la main que telle règle est couverte. Demain, c'est la machine qui le dit, en cherchant un test qui porte le nom de la règle. Une règle dite couverte sans un tel test apparaîtra comme un écart à corriger. D'accord ? »

---

## La répartition du travail

- **Les faits sont ton travail, jamais celui de l'utilisateur.** Quand une question de la frontière a besoin d'un fait de l'environnement (contenu d'un fichier, version d'une dépendance, ce que fait vraiment le code), va le chercher. Ne demande jamais ce que tu peux lire.
- **Ne bloque pas dessus.** Une exploration en cours est un prérequis non tranché : seules les questions qui en dépendent attendent. Pose le reste de la frontière tout de suite.
- **Les décisions sont celles de l'utilisateur.** Chacune lui est posée, et on attend.

---

## Condition de fin

**La session est finie quand la frontière est vide** : toutes les branches de l'arbre visitées, rien de silencieusement supposé.

**Ne rien implémenter tant que l'utilisateur n'a pas confirmé qu'on a atteint une compréhension partagée.** La porte d'approbation ne se négocie pas ; ce qui varie avec la taille de la tâche, c'est le livrable (deux phrases en chat ou une spec écrite), jamais la porte.

---

## Ce que le grilling produit au fil de l'eau

Le grilling n'est pas qu'une conversation : il **écrit** pendant qu'il interroge (skill `grill-with-docs` = `grilling` + `domain-modeling`).

- **Un terme tranché → [`GLOSSARY.md`](../../GLOSSARY.md) immédiatement.** Ne pas empiler pour plus tard : capturer au moment où ça se cristallise.
- **Une décision structurante tranchée → une ADR** dans [`docs/adr/`](../adr/), si et seulement si les trois critères sont réunis (voir [decisions.md](decisions.md)).
- **Une question qui ne se tranche qu'en construisant** a deux réponses possibles : une **balle traçante** — une tranche minuscule de bout en bout, du code qu'on garde — quand la question porte sur la faisabilité ou la forme d'un chemin réel ; un **prototype** (`/mattpocock-skills:prototype`) — du code qu'on jette — quand elle porte sur un modèle d'état ou une interface qu'on veut sentir avant de s'engager. Choisir avant d'écrire : un prototype qu'on garde est une dette, une tranche qu'on jette est du temps perdu.
- **Une question non tranchée → `docs/questions-ouvertes.md`**, datée, avec ce qui bloque. Une question ouverte assumée vaut mieux qu'un arbitrage implicite.
- **Une contradiction entre deux sources → une question ouverte, pas un arbitrage solo.** Les contradictions remontent **en tête**, jamais noyées dans le corps d'un compte rendu.

---

## Pendant le grilling : les gestes de modélisation

Repris de `mattpocock-skills:domain-modeling`.

- **Challenger contre le glossaire.** Quand un terme employé entre en conflit avec `GLOSSARY.md`, le dire immédiatement : « ton glossaire définit X comme ceci, mais tu sembles vouloir dire cela. Lequel ? »
- **Aiguiser le vocabulaire flou.** Un terme vague ou surchargé appelle une proposition de terme canonique précis : « tu dis "compte" : tu parles du licencié ou de l'utilisateur ? Ce sont deux choses. »
- **Éprouver par des scénarios concrets.** Quand une relation de domaine est en discussion, inventer des scénarios qui sondent les cas limites et forcent la précision sur les frontières entre concepts.
- **Confronter au code.** Quand l'utilisateur affirme comment quelque chose marche, vérifier que le code est d'accord. En cas de contradiction, la remonter.

---

## Classer ce qui sort d'une session

Chaque point issu d'une session (réunion, document, entretien) est classé :

| Classe        | Sens                                                              |
| ------------- | ----------------------------------------------------------------- |
| **nouveau**   | rien n'existait sur ce point                                      |
| **confirme**  | redit ce qui est déjà écrit                                       |
| **précise**   | affine une règle existante sans la contredire                     |
| **contredit** | entre en conflit avec l'existant → **remonte en tête**, en alerte |

Toute règle candidate est **sourcée** (document + section, ou locuteur + horodatage).

---

## Cycle de validation — la machine ne valide jamais

```
validation (écrite par un humain)      candidate ──(geste humain)──▶ validated
                                            ├──▶ rejected  (avec sa raison)
                                            └──▶ obsolete  (avec sa raison)

réalisation (calculée, jamais écrite)  to-build · configured · proven (P0, P1, P2)
                                       exceptions écrites à la main : not-applicable, contradiction
```

- **Une règle n'entre jamais en `validated` sans un geste humain.** Ni skill, ni agent, ni moi n'écrivons « validée ». Le champ dit la date et qui a tranché, par son nom.
- **Personne n'écrit « implémentée ».** La réalisation se lit dans les tests : une règle est prouvée quand un test porte son identifiant entre crochets dans son nom. Une règle dite couverte sans un tel test n'est pas couverte, et l'index la signale.
- **Une règle n'est jamais supprimée** : elle est marquée `rejected` ou `obsolete` avec sa raison. L'historique des arbitrages a plus de valeur que la propreté du fichier.
- **Une question ouverte ne change pas le statut.** Une règle validée reste validée quand `docs/questions-ouvertes.md` la cite dans une ligne `Bloque :` ; elle porte en plus l'indicateur « a une question ouverte ».
- **Le signal d'alerte à surveiller** : un stock de `candidate` non arbitrées qui gonfle, ou des `candidate` qui ont des tests. La validation ne suit pas, et le registre ment par omission.

---

## Re-griller ce qui a déjà été décidé

Une ADR n'est pas figée à vie. **Après quelques semaines d'application réelle**, on re-grille la décision et on ajoute une section datée à l'ADR.

```md
- Statut : **accepté** (grillé le JJ/MM/AAAA)

## Amendements du grill (JJ/MM/AAAA)

Grillée après N semaines d'application (tickets #x–#y, revues des …).
<ce que l'usage a invalidé, précisé ou confirmé>
```

Quand un **paquet** de décisions est revu d'un bloc, les corrections sont numérotées (`C1`, `C2`, …) et référencées depuis l'index ADR, chacune pointant l'ADR qu'elle amende. Une correction de **recette** n'invalide pas la décision — elle la rend applicable.

---

## Classer l'effort avant de commencer

Repris de `superpowers:brainstorming`. Annoncer la classification à voix haute avant la première question, pour que l'utilisateur puisse la corriger.

| Classe            | Quand                                                                                  | Livrable                                          |
| ----------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Spike**         | question de faisabilité, dont la sortie est une réponse, pas du code qu'on garde       | recommandation ; tout code produit est jetable    |
| **Bounded**       | changement bien cadré **sur un flux qui existe déjà dans ce dépôt** et qu'on peut lire | design court en chat, puis approbation, puis code |
| **Architectural** | nouveau projet, nouveau sous-système, changement d'interfaces dont d'autres dépendent  | questions → approches → design → **spec écrite**  |

- **Dans le doute entre deux classes, prendre la plus lourde.**
- **Le cliquet est à sens unique** : une complexité cachée découverte en cours de route fait monter d'un cran — on s'arrête, on le dit. Rien ne redescend en cours de tâche.
- **« Je connais ce genre d'appli » ne rend pas une tâche bounded.** Bounded se mesure au dépôt, pas à ta familiarité. Un projet neuf n'a aucun flux existant : il est **architectural**. **C'est le cas du projet aujourd'hui.**

---

## Anti-patterns

| Pensée                                                             | Réalité                                                                              |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| « C'est trop simple pour mériter un design »                       | Simple = design court, pas absence de design. Deux phrases, puis approbation.        |
| « Je pose la question et je commence pendant qu'il lit »           | La porte, c'est l'approbation, pas la longueur du design. Présenter, puis s'arrêter. |
| « Je vais demander à l'utilisateur ce que fait ce fichier »        | Les faits sont ton travail. Va le lire.                                              |
| « Je pose les 40 questions d'un coup »                             | Une question dont le prérequis est ouvert appartient à un tour ultérieur.            |
| « Ces deux documents se contredisent, je tranche au plus logique » | Une contradiction est une question ouverte, pas un arbitrage solo.                   |
| « Ça a grossi mais j'ai presque fini, pas la peine de reclasser »  | La complexité cachée fait monter d'un cran. On s'arrête et on le dit.                |
