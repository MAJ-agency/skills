# Un chantier se gèle d'une ligne, et le plugin monte de version pour clore le lot

Status: ready-for-agent
Type: task
Blocked by: 6, 7
Modèle: sonnet
Fichiers chauds: `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/fusionner/scripts/file.sh`, `skills/chaine/chantier/SKILL.md`, `.claude-plugin/plugin.json`, `skills/chaine/tickets/references/gabarits/carte.map.md`, `skills/chaine/sujet/SKILL.md`, `skills/chaine/sujet/references/CONTENU.md`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `README.md`, `skills/chaine/sujet/scripts/sujet.test.mjs`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs`

## Le besoin

Rien ne permet aujourd'hui d'arrêter un chantier : seule la boucle locale du capitaine s'arrête (`boucle.sh --arreter`). Les sessions filles continuent de partir et leurs PR d'entrer. Depuis le ticket 7 (PR 63), une fille au plafond est interrompue et une PR renvoyée trois fois attend un humain : ce sont des arrêts d'une session ou d'une PR, pas du chantier.

Quand le ticket est fait, un chantier se gèle d'une ligne, que le produit peut écrire lui-même sur GitHub sans ouvrir de session : plus aucune session ne part de son sujet, plus aucune de ses PR n'entre. Le conducteur a une procédure pour arrêter son chantier. Et la version du plugin monte une fois, pour tout le lot des tickets 4 à 8.

## Où

- **Deux corrections de prose à ne pas oublier**, dans `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` : le § 5, étape 3 (décision `A-15` ci-dessous : dans un programme, le doute de design d'une fille part à son conducteur) ; et le gabarit de prompt d'une session fille, ligne 102, où « une question à l'humain » ne vaut que hors programme.
Les lignes citées sont celles de `origin/main` à `5a5e4f3` (2026-11-13), après les PR 61 (ticket 4, le contrôle automatique), 62 (ticket 5, les rôles), 63 (ticket 7, les plafonds et les renvois comptés) et 64 (ticket 6, le skill de l'architecte) : elles ont été revérifiées une à une sur ce commit. Ces PR ont déplacé les lignes citées de `file.sh`, de `fusionner.test.mjs`, de `chantier/SKILL.md`, de `carte.map.md`, de `tickets-regles.mjs`, de `tickets.mjs`, de `tickets.test.mjs` et de `README.md` ; `sujet.sh` (un mot de son en-tête, ligne 41), `boucle.sh`, `veille.sh`, `sujet.test.mjs`, `sujet-carte.test.mjs`, `sujet/SKILL.md` et `sujet/references/CONTENU.md` n'ont pas bougé. Si `main` a encore bougé, retrouver chaque endroit par le nom ou le texte cité.

**La ligne `Gel:`** (`A-11`) vit dans la fiche de la carte du chantier et se lit sur `origin/sujet/<nom>`. Non vide, le chantier est gelé.

- `skills/chaine/tickets/references/gabarits/carte.map.md` : ajouter la ligne `Gel:`, vide, dans la fiche (lignes 5 à 16 ; depuis la PR 62 elle nomme `Responsable:`, `Architecte:` et `Conducteur:`, lignes 8 à 10).
- `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs` : `controlerCarte` (ligne 549, signature `{ nom, texte, ficheGelee = false, plafonds = null }` ; appelée par `tickets.mjs` ligne 191 pour le contrôle, et ligne 171 pour repérer les cartes sans `Responsable:` ni `Conducteur:`) ne refuse aujourd'hui aucune ligne inconnue de la fiche. Le prouver par un test dans `tickets.test.mjs`, à la suite des tests de la carte (lignes 67 à 113 ; la fabrique `FICHE` est ligne 78), pour que personne ne casse cette tolérance. Attention au mot : dans ces trois fichiers, « gelée » (`ficheGelee`, la dette `fiches`, les tests des lignes 103 et 403) désigne déjà une carte d'avant les rôles, tolérée par le gate. Ce gel-là n'a rien à voir avec la ligne `Gel:` : ne pas réemployer ces noms.

**`skills/chaine/sujet/scripts/sujet.sh`** (752 lignes). L'en-tête décrit chaque commande (lignes 7 à 52) et chaque sortie (lignes 54 à 61) ; l'aiguillage est lignes 742 à 752, et sa ligne 751 écrit l'usage, qui nomme chaque commande.

- Modèle pour lire une ligne de la fiche : `phase_carte` (lignes 182 à 194, appelée par `livrer` ligne 431), qui cherche la carte dont la ligne `Sujet:` nomme le sujet. Elle lit le sujet puis `develop` ; pour `Gel:`, le sujet seul.
- Deux commandes nouvelles : `geler <nom> "<raison>"` écrit la ligne dans la carte et la pousse sur le sujet ; `degeler <nom>` la vide. Ce qu'un commit de carte doit respecter est ce que vérifie `carte_sujet` (lignes 697 à 740, appelée par l'aiguillage ligne 744) : un seul fichier `docs/**/*.map.md` modifié en place, dont la ligne `Sujet:` nomme exactement le sujet (`carte_cite_le_sujet`, lignes 689 à 695), formaté par Prettier, poussé sans force.
- `demarrer` (lignes 196 à 250 ; toute session l'appelle avant son premier commit) refuse un sujet gelé, sortie 4, une fois le sujet rapatrié (ligne 229) et avant `verifier_ticket` (ligne 230).
- `livrer` (lignes 425 à 454 ; appelée à la main et par `livrer_prets` ligne 680) refuse un sujet gelé, sortie 4, après le rapatriement de la ligne 428.
- `livrer_prets` (lignes 652 à 683, appelée par `boucle.sh` ligne 305) appelle `livrer` dans le même shell, où un refus termine le script (`sortir`, ligne 71) : elle ne doit jamais l'appeler pour un sujet gelé, sans quoi les sujets prêts qui suivent ne seraient pas livrés. Elle ne retient que les sujets au verdict « prêt à livrer » d'`etat` (ligne 654).
- Une commande de lecture pour `file.sh`, sur le modèle de `livre` (aiguillage ligne 748, fonction `sujet_livre` lignes 163 à 176, appelée par `file.sh` ligne 104) : sortie 0 si le sujet est gelé.
- Tests à étendre : `sujet.test.mjs` (les refus de `demarrer` à partir de la ligne 30, `livrer-prets` ligne 285, `livrer` avec une carte qui ne vit que sur le sujet lignes 460 à 480) ; pour une carte sur un sujet avec un Prettier de jouet, le dépôt de `sujet-carte.test.mjs`, lignes 12 à 37.
- Prose : `skills/chaine/sujet/SKILL.md` (`argument-hint` ligne 4, « Commandes » lignes 32 à 34) et `skills/chaine/sujet/references/CONTENU.md`, ligne 5.

**`skills/chaine/fusionner/scripts/file.sh`.** Le tri est lignes 73 à 82, la cascade des états lignes 108 à 130, l'en-tête qui les décrit lignes 7 à 32. Le ticket 7 (PR 63) y a posé l'état « humain » : en-tête lignes 17 à 19, branche lignes 112 et 113, juste après « brouillon » (ligne 108) et « bloquée » (ligne 110). À cet endroit sont disponibles `$base` et `$tete` (lus ligne 83) et `sujet_ticket` (lignes 96 à 100). Une PR d'un sujet gelé prend l'état « gelée », jamais « prête » : sa branche se place avant celle de « humain » (voir « Décisions »). Ceux qui lisent ces états : `file.sh` lui-même (`--next` ligne 136, `--rouges` ligne 137) ; `boucle.sh` lignes 216, 258 (son `case`, lignes 266 à 301, agit sur « vers sujet/… » et « sujet/… : prête »), 327 et 373 ; `veille.sh` lignes 54 à 58, qui relance sur tout état contenant `prête`, `sans CI` ou `CI rouge`. Tests : `skills/chaine/fusionner/scripts/fusionner.test.mjs`. Modèle le plus proche, les deux tests de l'état « humain » : « file.sh : une PR renvoyée autant de fois que le plafond est montrée humain, et ni --next ni --rouges ne la rendent » (lignes 363 à 385) et « boucle.sh : une PR à l'état humain n'est ni passée, ni relancée, ni renvoyée » (lignes 387 à 403). Pour un dépôt de jouet qui porte une carte : `depotSujetLivre` (lignes 496 à 513) et ses trois tests (lignes 516 à 540). `skills/chaine/fusionner/SKILL.md` nomme le nouvel état : il renvoie les états à l'en-tête de `file.sh` (ligne 64) et dit « humain » ligne 68.

**Le skill du conducteur**, `skills/chaine/chantier/SKILL.md`.

- § 6 (« Suivi (à chaque réveil) », ligne 83) : la ligne `Gel:` se lit en premier à chaque réveil, avant de réarmer (point 0, ligne 85). Gelé : ni vague, ni réarmement.
- Une procédure nouvelle, « Arrêter un chantier » : geler ; `list_sessions` par le tag `chantier:<nom>` (le tag est posé ligne 74, lu ligne 86) ; `interrupt_session` sur chacune (déjà employé ligne 88, depuis le ticket 7, pour une fille au plafond) ; `list_triggers` puis `delete_trigger` (déjà employés ligne 104) ; une ligne au journal de la carte.
- La carte n'a pas de journal aujourd'hui : `carte.map.md` n'a que les sections Fiche, Decisions-so-far, Fog, Vagues, Coût, Dépassements (ticket 7) et Rétro. Modèle de forme pour un journal : le gabarit de programme du ticket 6, `skills/chaine/tickets/references/gabarits/programme.md`, section `## Journal` (lignes 48 à 50).

**La clôture du lot.**

- `.claude-plugin/plugin.json`, ligne 3 : la version, aujourd'hui `4.2.0`.
- Deux phrases que la vague précédente a laissées pour garder ses fichiers disjoints (elles manquent toujours à `5a5e4f3`) : dans `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, la phrase d'entrée (ligne 5, « Pour lancer un chantier : `/maj-skills:chantier <objectif>` ») nomme aussi l'invocation du skill de l'architecte, `/maj-skills:architecte` ; dans `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, le paragraphe des hooks (ligne 13, qui décrit déjà `demarrage.mjs`) dit ses deux signalements (`signalementsDemarrage`, `demarrage.mjs` ligne 70 ; le `SKILL.md` du socle les dit déjà, ligne 35).
- `README.md` : l'arbre de « Structure » donne des scripts au skill `chantier` (lignes 166 et 167 : `plafonds.mjs` et son banc, posés par le ticket 7, n'y figurent pas), la ligne du skill `sujet` (ligne 84) nomme le gel. Relire que le README décrit tout le lot. Y sont déjà : le skill `architecte` (table ligne 86, invocations ligne 90, arbre lignes 163 à 165, PR 64) et la ligne du conducteur (ligne 87, PR 62) ; n'y sont pas : les plafonds, les renvois comptés, le gel.

## Décisions

- Relecture du 2026-11-13 par un agent neuf (verdict « à compléter »), cinq points fermés. **La commande de lecture du gel** s'appelle `sujet.sh gel <nom>` : elle écrit la valeur de `Gel:` et sort en 0 si le sujet est gelé, en 1 sinon ; `file.sh` l'appelle. **Un sujet gelé dont la livraison est déjà ouverte** se lit « gelé » : le gel prime, et `rafraichir_sujets` ne rafraîchit ni ne livre un sujet gelé. **Le dégel ne réveille personne tout seul** : un conducteur gelé supprime ses réveils et s'arrête, pour ne rien coûter ; celui qui dégèle (`sujet.sh degeler`) prévient le conducteur par message s'il vit encore, sinon le chantier se relance par le skill `chantier` avec le nom du sujet, qui reprend à la phase de la carte. La procédure le dit. **La section « Arrêter un chantier »** se place dans `chantier/SKILL.md` juste après le § 6 (suivi), avant la livraison. **L'identifiant de l'architecte**, destinataire du message final, est dans le prompt de lancement.
- Deux points fermés par l'architecte le 2026-11-13, après la remise à jour du ticket sur `main` (`5a5e4f3`). **La preuve de `A-15`** est une relecture, pas un test : la règle est de la prose ; la PR cite la phrase avant et après. **Le gabarit de prompt d'une session fille** (`chaine-de-production.md`, ligne 102) s'aligne dans la même PR : dans un programme, une question part au conducteur par `send_message` ; la formule « une question à l'humain » ne vaut que hors programme.
- `A-15` (2026-11-13, sur une question de la session du ticket 5) — **ce ticket corrige aussi `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` § 5, étape 3** : elle fait encore poser un doute de design au produit par la session fille (`AskUserQuestion`), ce qui contredit `P-1` dans un programme. Nouvelle règle à y écrire : dans un programme, une fille n'a personne devant elle ; elle écrit son doute de design à son conducteur (`send_message`), qui le relaie à l'architecte, lequel le pose au produit dans la forme du § 2. Hors programme, la règle actuelle reste. Le produit garde la liberté d'ouvrir lui-même la session d'une fille pour faire évoluer un écran avec elle. Où, à `5a5e4f3` : § 5 commence ligne 95, l'étape 3 tient lignes 112 et 113, et la phrase à corriger est ligne 113 (« Un doute sur le design […] se pose au produit par `AskUserQuestion` ») ; les PR 62 à 64 ne l'ont pas touchée. La forme du § 2 est « Une question au produit », lignes 42 à 51. Les deux autres maillons sont déjà écrits à ce commit : le conducteur relaie à l'architecte (`skills/chaine/chantier/SKILL.md`, § 6 point 4, ligne 92), l'architecte réécrit la question et la pose au produit (`skills/chaine/architecte/SKILL.md`, § 5, ligne 65).

Tranché :

- `A-11` : le gel est une ligne `Gel:` de la fiche, lue sur `origin/sujet/<nom>` ; non vide (date et raison), le chantier est gelé ; elle se pose par `sujet.sh geler` ou à la main dans l'éditeur de GitHub, `sujet.sh degeler` la vide. Aucun label.
- La spec, lot 4 : `demarrer` et `livrer` refusent un sujet gelé ; une PR d'un sujet gelé prend l'état « gelée » ; la procédure d'arrêt et son ordre.
- `A-1` : une seule montée de version par lot, ici.
- La règle de version, `README.md`, « Ajouter un skill », étape 4 (ligne 178) : « Patch pour une correction, mineure pour un skill ou un gabarit ajouté, majeure quand un skill existant change de contrat », et ligne 180 : « Cette règle vaut pour **tout** changement de contenu, pas seulement l'ajout d'un skill. » Le lot ajoute un skill et un gabarit, et change le contrat de skills existants (`tickets` exige une fiche nouvelle, `chantier` commence au découpage, `fusionner` et `sujet` refusent ce qu'ils acceptaient). C'est une majeure : `4.2.0` devient `5.0.0`. Si la version de `origin/main` a bougé entre-temps, partir de celle-là (à `5a5e4f3` elle est toujours `4.2.0` : les PR 61 à 64 n'ont pas touché la ligne `version`). Le `CLAUDE.md` racine du gabarit, `skills/monorepo/socle-monorepo/references/racine/CLAUDE.md`, ligne 44, annonce déjà depuis la PR 64 « plugin ≥ 3.2 ; `architecte` ≥ 5.0 » : il s'accorde avec `5.0.0`, rien à y changer. Précédent pour le titre : le commit `a96bd46`, « feat!: … (plugin 4.0.0) ».

Compatibilité, précisément :

- **Cartes existantes.** Aucune n'a de ligne `Gel:` : elles ne sont pas gelées, et rien n'est à réécrire. Le gate n'exige pas la ligne. `geler` l'ajoute à la fiche quand elle manque.
- **Sujet sans carte sur sa branche** (une série regroupée par le capitaine, ou un cadrage pas encore fusionné) : il ne peut pas être gelé. `geler` refuse, sortie 4, et dit pourquoi.
- **Ligne écrite à la main** : toute valeur non vide gèle, datée ou non. Le gate n'en refuse aucune forme : une ligne du produit ne doit jamais rougir un contrôle.

La session tranche seule, par défaut prudent, et le dit dans la PR :

- ce qu'écrit `geler` : `Gel: AAAA-MM-JJ — <raison>`, raison obligatoire ;
- `geler` ne dépend ni de la branche courante ni de l'arbre de travail de qui l'appelle : il construit son commit sur `origin/sujet/<nom>` et le pousse sans force et sans hook (comme `ouvrir`, ligne 265). Jamais de `git worktree` (`pieges.md`, ligne 8). Si le sujet a bougé entre-temps : un second essai, puis sortie 9, comme `carte <nom>` ;
- sujet déjà gelé : `geler` refuse (sortie 4) et montre la ligne en place ; `degeler` d'un sujet qui ne l'est pas sort en 0 ;
- quelles PR sont « gelées » : la spec nomme la sous-PR (`$base`) et la PR à recibler (`sujet_ticket`). La livraison du sujet (tête `sujet/<nom>` ou `livraison/<nom>-…`, reconnues ligne 75 de `file.sh`) l'est aussi : « plus aucune PR du chantier n'entre » ;
- la place de « gelée » dans la cascade de `file.sh` : après « brouillon » (ligne 108) et « bloquée » (ligne 110), **avant « humain »** (ligne 112, posé par le ticket 7), donc avant toutes les branches qui lisent la CI ou qui reciblent : la sous-PR (ligne 114), « vers sujet/… » (ligne 116), la PR directe vers develop, où tombe une livraison (ligne 118), et la PR empilée (ligne 121). Une PR d'un sujet gelé qui a aussi atteint le plafond de renvois se lit « gelée » tant que le gel dure et redevient « humain » au dégel : le gel est l'arrêt le plus large, et il se lève d'une ligne. `renvois_de` (un appel à l'API par PR, `github.sh` ligne 19) n'est alors pas appelé pour elle. Aucun des deux états ne contient `prête`, `sans CI` ni `CI rouge` : ni `--next`, ni `--rouges`, ni `boucle.sh`, ni `veille.sh` ne les prennent ;
- `etat` (lignes 598 à 646, verdicts décrits lignes 593 à 597 et dans l'en-tête lignes 51 et 52 ; appelée par `boucle.sh` lignes 239 et 376 et par `livrer_prets`) donne le verdict « gelé » : le capitaine le voit en fin de boucle, et `livrer_prets` l'écarte de lui-même. `rafraichir_sujets` (`boucle.sh`, lignes 237 à 250) ne saute que le verdict `livré*` : un sujet gelé reste rafraîchi, ce que « Hors de ce ticket » admet ;
- `fusionner <pr>` (lignes 323 à 377 ; ses sorties 7 d'aujourd'hui, PR fermée ou en brouillon, sont lignes 327 et 328) lancé à la main sur une sous-PR d'un sujet gelé sort en 7 (rien à corriger côté auteur), jamais en 4 : la sortie 4 renverrait la PR à sa session (`boucle.sh`, ligne 293). Son banc est `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` ;
- `carte <nom>` reste permise sur un sujet gelé : c'est par elle que s'écrit la ligne de journal ;
- le journal de la carte : une section `## Journal` ajoutée au gabarit, que le gate n'exige pas.

Hors de ce ticket : `passer.sh` lancé à la main, qui reste un geste décidé par un humain ; `rafraichir` et `regrouper` ; l'essai réel de la spec (geler un sujet d'`anchorpost`), qui vient après la repose du plugin, par un autre ticket ; toute autre montée de version.

## Surfaces

| Surface                                       | Preuve                                                                                                                                               |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `geler`                                       | `sujet.test.mjs` « geler écrit la ligne Gel: datée dans la carte du sujet, sans toucher la branche courante ni l'arbre de travail »                  |
| `degeler`                                     | `sujet.test.mjs` « degeler vide la ligne Gel: ; sur un sujet non gelé, il ne pousse rien »                                                           |
| Les refus de `geler`                          | `sujet.test.mjs` « geler refuse un sujet sans carte, une raison vide et un sujet déjà gelé, sans rien pousser »                                      |
| `demarrer` sur un sujet gelé                  | `sujet.test.mjs` « demarrer refuse un sujet gelé, sortie 4, la raison du gel citée »                                                                 |
| `livrer` et `livrer-prets`                    | `sujet.test.mjs` « livrer refuse un sujet gelé ; livrer-prets livre le sujet prêt qui le suit »                                                      |
| Gel écrit à la main                           | `sujet.test.mjs` « une ligne Gel: écrite à la main, sans date, gèle aussi »                                                                          |
| `file.sh`                                     | `fusionner.test.mjs` « file.sh : la sous-PR, la PR à recibler et la livraison d'un sujet gelé sont gelées, et ni --next ni --rouges ne les rendent » |
| `boucle.sh`                                   | `fusionner.test.mjs` « boucle.sh : une sous-PR d'un sujet gelé n'est ni fusionnée, ni renvoyée, ni reciblée »                                        |
| Le gate des cartes                            | `tickets.test.mjs` « carte de chantier : la ligne Gel:, vide, datée ou écrite à la main, ne crée aucune erreur »                                     |
| La version et le plugin                       | lecture de `plugin.json` ; `scripts/depot.test.mjs`, déjà en place, reste vert                                                                       |
| Procédure d'arrêt, phrases de clôture, README | lecture de `chantier/SKILL.md`, de `chaine-de-production.md`, de `CONTENU.md` et de `README.md`                                                      |
| `chaine-de-production.md` § 5, étape 3 (`A-15`) | relecture : la PR cite la phrase avant et après |
| `chaine-de-production.md`, gabarit de prompt d'une fille (ligne 102) | relecture : la PR cite la phrase avant et après |
| Section `## Journal` du gabarit `carte.map.md` | un test qui lit le gabarit et y trouve `## Journal`, dans le banc qui vérifie déjà les gabarits, sinon dans `scripts/depot.test.mjs` |

## Vérification

`pnpm install --frozen-lockfile` puis `pnpm test`. Bancs ciblés : `node --test skills/chaine/sujet/scripts/*.test.mjs`, `node --test skills/chaine/fusionner/scripts/fusionner.test.mjs skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs skills/chaine/fusionner/scripts/veille.test.mjs`, `node --test skills/chaine/tickets/references/scripts/verify/tickets.test.mjs`. Depuis la PR 61, toute PR vers `main` rejoue seule `pnpm install --frozen-lockfile` puis `pnpm test` (`.github/workflows/ci.yml`, job `bancs`).

Avant de commencer, vérifier que les tickets 6 et 7 sont sur `origin/main` : `git cat-file -e origin/main:skills/chaine/architecte/SKILL.md` et `git cat-file -e origin/main:skills/chaine/chantier/scripts/plafonds.mjs` sortent tous deux en 0 (c'est le cas à `5a5e4f3`).

À la main : `bash skills/chaine/sujet/scripts/sujet.sh` sans argument affiche l'aide, qui nomme `geler` et `degeler`, puis sort en 4 comme aujourd'hui (ligne 751) ; `git diff origin/main -- .claude-plugin/plugin.json` ne montre que la ligne `version`.

## Livrer

Branche `feat/gnb-8-gel-de-chantier` depuis `origin/main`. Avant la PR, revue adversariale en suivant `skills/chaine/revue-adversariale/SKILL.md` de ce dépôt, avec les seuls critères du socle (le dépôt n'a pas de `.claude/chaine.json`) ; sa section va dans le corps de la PR. Une PR vers `main`, titre en conventional commit qui se termine par la version du plugin, corps en français, qui dit ce qui change pour un projet à la repose (tickets 4 à 8). **Ne jamais la fusionner** : le capitaine de `skills` fusionne les PR que l'architecte lui nomme. Ne pas modifier ce ticket : l'architecte du programme tient son statut dans la carte. Pas d'accès `gh` : utiliser les outils GitHub MCP. Finir par un message à l'architecte (`send_message`) en cinq lignes : PR, fait, reste, décision prise par défaut, question.
