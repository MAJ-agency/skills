# Une session qui dépasse son plafond est arrêtée, et une PR renvoyée trois fois attend un humain

Status: ready-for-agent
Type: task
Blocked by: 5
Modèle: sonnet
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/chaine.json`, `skills/chaine/chantier/SKILL.md`, `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs`, `skills/chaine/tickets/references/gabarits/carte.map.md`, `skills/chaine/fusionner/scripts/renvoyer.sh`, `skills/chaine/fusionner/scripts/file.sh`, `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, `skills/chaine/tickets/references/scripts/verify/tickets.mjs`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/chantier/references/CONTENU.md`, `skills/chaine/sujet/scripts/faux-gh.mjs`, `skills/chaine/fusionner/SKILL.md`

## Le besoin

Sur les deux premiers chantiers d'Anchorpost, les plafonds de contexte étaient écrits et ont été dépassés cinq fois sans que rien ne s'arrête : une session qui pilotait à 726 000 tokens, un ticket à 30,72 $ pour un repère de 4 à 7 $. Et rien ne borne les renvois d'une PR par le capitaine : `renvoyer.sh` ne garde aucun compte.

Le produit a tranché (`P-3`). Quand le ticket est fait : une session de ticket est interrompue à 300 000 tokens de contexte ou à 20 $, et la question revient au produit (découper le ticket, relancer, ou accepter le dépassement par écrit) ; un conducteur ou un architecte passe la main à 400 000 tokens ; une PR renvoyée trois fois attend un humain. Limite connue et acceptée : le contrôle a lieu à chaque réveil, toutes les 45 minutes.

## Où

Les lignes citées sont celles de `origin/main` à `8eb1c9b` (2026-11-13), après la PR 61 (ticket 4, le contrôle automatique) et la PR 62 (ticket 5, les rôles), qui a déplacé celles de `chantier/SKILL.md`, de `chaine-de-production.md`, de `carte.map.md`, de `tickets-regles.mjs`, de `tickets.mjs` et de `tickets.test.mjs` : elles ont été revérifiées une à une sur ce commit. Si `main` a encore bougé, retrouver chaque endroit par le texte ou le nom cité.

**Le contrat.**

- `skills/chaine/socle-chaine-de-production/references/chaine.json` : ajouter la clé `plafonds` et ses quatre valeurs (`A-9`) : `contexteFille` 300000, `coutFille` 20, `contextePilote` 400000, `renvoisParPR` 3. Compléter le `$comment`.
- `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, lignes 3 à 5 : le paragraphe annonce « quatre lignes » alors que le fichier a cinq clés (il oublie `gatesRapides`). Le corriger et y décrire `plafonds`. Ne rien changer d'autre dans ce fichier.

**La décision, dans un script testé.**

- Créer `skills/chaine/chantier/scripts/plafonds.mjs` et son banc `plafonds.test.mjs` : ce sont les premiers scripts du skill `chantier` (`skills/chaine/chantier/references/CONTENU.md`, ligne 3, dit qu'il n'en a aucun : le corriger). Le motif `skills/*/*/scripts/*.test.mjs` du script `test` (`package.json`, ligne 7) joue déjà le banc.
- Modèle à imiter : `skills/chaine/fusionner/scripts/migrations-ordre.mjs` : l'en-tête qui donne l'usage et les sorties (lignes 1 à 16), la règle pure exportée (`controlerOrdre`, lignes 40 à 60, appelée par `refusEntre` ligne 86), la lecture du contrat par une fonction qui reçoit son chemin (`refusEntre`, lignes 79 à 87, appelée par le bloc de commande ligne 95, que lancent `passer.sh` ligne 144 et `sujet.sh` ligne 439), et son banc `migrations-ordre.test.mjs`.
- La règle (`A-9`, `P-3`) : rôle `fille`, verdict `interrompre` dès que le contexte atteint `contexteFille` ou que le coût atteint `coutFille` ; rôles `conducteur` et `architecte`, verdict `passer-la-main` dès que le contexte atteint `contextePilote` ; sinon `ok`.
- Appelants réels : le conducteur, à chaque réveil (skill `chantier` § 6), et l'architecte à chaque fin d'étape (skill du ticket 6, qui renvoie à l'en-tête du script). Dans un projet, le script vit dans `scripts/chaine/plafonds.mjs` avec son banc : écrire cette pose dans `skills/chaine/chantier/SKILL.md` § 0, point 4, « Le terrain » (ligne 22).

**Le suivi.** `skills/chaine/chantier/SKILL.md` § 6, « Suivi (à chaque réveil) », lignes 83 à 92 ; le réveil à 45 minutes s'arme lignes 79, 85 et 91. Après le point 1, qui lit déjà chaque session par `get_session` (ligne 86) : le conducteur passe ses relevés et le sien à `plafonds.mjs` et suit le verdict, sans juger lui-même. `interrompre` : `interrupt_session`, la ligne dans `## Dépassements` de la carte, puis la question au produit, dans la forme de `chaine-de-production.md` § 2, avec ses trois réponses possibles. `passer-la-main` : la passation dans la carte, puis la session de suite, que nomme alors la ligne `Conducteur:` de la fiche. Les deux champs à lire sont déjà nommés ligne 98 : `external_metadata.usage.cost_usd` et `context_usage.used_tokens`.

Déjà fait par la PR 62, à ne pas réécrire au § 6 : dans un programme, le conducteur ne s'adresse jamais au produit. La ligne 14 du skill dit une fois pour toutes que, partout où il écrit « le produit », le même contenu part à l'architecte par `send_message` ; la question d'un dépassement suit cette règle sans la redire.

Trois phrases de `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` parlent des plafonds et sont à accorder : ligne 83 (une fille au-delà de 300 k tokens « signale » un ticket mal découpé), ligne 134 (le plafond du conducteur) et ligne 138 (le relevé des coûts). La PR 62 n'y a changé que les mots : la ligne 134 dit déjà « Plafond du conducteur » et « (`Conducteur:` mis à jour) », la ligne 138 que le conducteur relève les coûts et s'écrit `conducteur` dans la colonne « Rôle ». Reste à ce ticket ce qui touche aux plafonds eux-mêmes.

**La carte.**

- `skills/chaine/tickets/references/gabarits/carte.map.md` : ajouter `## Dépassements` après `## Coût` (lignes 31 à 34), un tableau à cinq colonnes : session, ticket, mesure, décision du produit, date.
- `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs` : `controlerCarte` (ligne 452, signature `{ nom, texte, ficheGelee = false }` depuis la PR 62 ; appelée par `tickets.mjs` ligne 184 pour le contrôle, et ligne 164 pour repérer les cartes sans `Responsable:` ni `Conducteur:`) ne vérifie de `## Coût` que sa présence (lignes 481 et 482). Elle doit refuser une ligne de `## Coût` au-delà du plafond de son rôle quand `## Dépassements` n'a pas de ligne pour la même session. L'en-tête exact du tableau des coûts est `| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |` (`carte.map.md`, ligne 33). Dans la colonne « Rôle », la session du chantier s'écrit `conducteur` depuis la PR 62 (`chantier/SKILL.md`, ligne 98).
- Les plafonds arrivent à `controlerCarte` par son appelant : `tickets.mjs` lit déjà le contrat lignes 107 à 114. Modèle pour la lecture : `lireCheminsSensibles` (`tickets-regles.mjs`, lignes 274 à 286, appelée par `tickets.mjs` ligne 110), qui rend une valeur neutre sans contrat et lève sur un contrat mal formé ; son test est `tickets.test.mjs`, lignes 161 à 167. Aucun gate ne valide aujourd'hui la forme du reste du contrat.
- Les formes réelles des cellules, relevées dans les cartes du dépôt `anchorpost` : « Contexte max » vaut `174 k` ou `726 k (compactée)`, « Coût $ » vaut `2,20`. Pour le coût, la lecture existe déjà : `montant` (`skills/chaine/tickets/references/scripts/docs/couts.mjs`, lignes 25 à 28, appelée par `lireCarte` ligne 58), avec ses valeurs attendues ligne 62 (cellule vide, `—`, `à relever`, gabarit). La reprendre ou l'importer, au choix de la session.
- Décrire la règle dans l'en-tête de `tickets.mjs`, règle 4 (lignes 16 à 20, que la PR 62 a allongée de `Responsable:`, de `Conducteur:` et de la dette `fiches`).
- Modèles de test pour la carte gelée, posés par la PR 62 : `tickets.test.mjs`, ligne 101 (« une carte gelée passe avec `Architecte:` seul ; non gelée, la même carte est refusée »), et `tickets-gate.test.mjs`, ligne 131 (« dette des fiches : gelée une fois, jamais agrandie, élaguée quand la carte nomme son responsable et son conducteur »).

**Les renvois** (`A-10`).

- `skills/chaine/fusionner/scripts/renvoyer.sh` : les labels sont posés lignes 16 et 17, le commentaire lignes 18 à 23, par `commenter` (`github.sh`, ligne 104). Ses appelants : `boucle.sh` lignes 230, 284, 292 et 351, et `refus.sh` ligne 16 (lui-même appelé par `boucle.sh` lignes 293 et 366). Il ne garde aucun compte. Chaque commentaire porte désormais une marque invisible (un commentaire HTML) ; avant de commenter, le script compte les marques déjà sur la PR ; au plafond, le commentaire et la sortie disent que la PR attend un humain. Les deux labels se posent comme aujourd'hui.
- `skills/chaine/fusionner/scripts/file.sh` : la cascade des états va de la ligne 104 à la ligne 124 (la spec dit « 104 à 108 » : ce sont ses trois premières branches, là où s'insère le nouvel état) ; l'en-tête, lignes 7 à 29, décrit chaque état. Une PR dont les marques atteignent le plafond prend l'état « humain », jamais « prête ». Ceux qui lisent ces états : `boucle.sh` lignes 216 (`--rouges`), 258, 327 et 373, et `veille.sh` ligne 54, qui relance la boucle sur tout état contenant `prête`, `sans CI` ou `CI rouge` (lignes 55 à 58). Le nouvel état ne contient aucun de ces mots.
- Le faux `gh` des bancs, `skills/chaine/sujet/scripts/faux-gh.mjs`, ne répond qu'à l'écriture d'un commentaire (lignes 193 à 196, `POST issues/<n>/comments`) : lui apprendre la lecture, qui rend les `commentaires` de la PR.
- Pour lire le contrat depuis un script shell, modèle : `index_json` (`github.sh`, lignes 21 à 24 : l'arbre de travail, sinon `origin/develop`).
- Tests à étendre, dans `skills/chaine/fusionner/scripts/fusionner.test.mjs` : « renvoyer.sh : pose fusion-bloquée, retire à-fusionner et commente la cause » (lignes 285 à 322) et le test des états de `file.sh` (lignes 29 à 85, dont la dernière assertion, « file.sh ne fait que lire », doit rester vraie).
- `skills/chaine/fusionner/SKILL.md` : « Renvoyer une PR » (lignes 66 à 69) et le filtre du journal (ligne 60).

## Décisions

- Relecture du 2026-11-13 par un agent neuf, trois points fermés. **Rôles jugés dans `## Coût`** : `fille` (plafonds d'une fille), `conducteur` et `architecte` (plafond d'un pilote) ; tout autre rôle (`capitaine`, `ticket`…) n'est pas jugé et ne fait pas d'erreur. **Formes lues pour le contexte** : un entier, avec ou sans espaces (`121 835`), ou suivi de `k` (`174 k`) ; une autre forme sur une ligne d'un rôle jugé est une erreur du gate, pas une ligne ignorée (même principe que le coût illisible de `couts.mjs`). **Qui pose `plafonds.mjs` dans un projet** : l'étape « poser » du skill `fusionner`, qui copie déjà `sujet.sh` d'un autre skill vers `scripts/chaine/` ; ajouter `plafonds.mjs` et son banc à sa liste.
Tranché :

- `A-9` : les plafonds vivent dans `.claude/chaine.json`, la décision dans `plafonds.mjs` ; le conducteur ne juge pas lui-même ; un dépassement s'écrit dans `## Dépassements` (session, ticket, mesure, décision du produit, date).
- `A-10` : les renvois se comptent sur la PR elle-même ; aucun label nouveau (un label demande un administrateur).
- `P-3` : les quatre valeurs, et les trois réponses possibles du produit.
- `A-12` : le rôle d'une session de ticket s'écrit `fille`.
- `A-1` : la ligne `version` de `.claude-plugin/plugin.json` ne bouge pas.

Compatibilité, précisément :

- **Cartes existantes.** Elles ne sont pas réécrites. Une carte gelée par la dette que le ticket 5 a posée (les cartes d'avant les lignes `Responsable:` et `Conducteur:`, sous la clé `fiches` de `scripts/verify/tickets-dette.json` du projet, écrite une fois par `tickets.mjs --geler-fiches`) n'est pas jugée sur ses dépassements ; elle le devient le jour où elle sort de cette dette. Ce gel arrive déjà à `controlerCarte` par son paramètre `ficheGelee` (`tickets.mjs`, ligne 184). Dans ces cartes, « architecte » nomme encore la session du chantier, dans la fiche comme dans la colonne « Rôle » de `## Coût` (vérifié sur les deux cartes d'`anchorpost`). Aucune dette nouvelle n'est créée par ce ticket.
- **Contrat sans la clé `plafonds`** (un projet qui repose les scripts sans compléter son `.claude/chaine.json`) : les quatre valeurs de `A-9` s'appliquent par défaut. Clé présente mais mal formée : `plafonds.mjs` et le gate sortent en erreur, comme `lireCheminsSensibles`. `renvoyer.sh` et `file.sh`, eux, ne s'arrêtent jamais pour un contrat mal formé, parce que la file du capitaine ne doit pas tomber : ils prennent la valeur par défaut et le disent sur la sortie d'erreur. Projet sans contrat du tout : le gate ne contrôle aucun plafond, comme il n'exige aucun chemin sensible.
- **PR déjà renvoyées** : leurs anciens commentaires n'ont pas la marque, leur compte part de zéro.

La session tranche seule, par défaut prudent, et le dit dans la PR :

- l'interface de `plafonds.mjs`. Forme proposée : sur l'entrée standard, une liste JSON d'objets `session`, `role`, `contexte` (tokens) et `cout` (dollars) ; sur la sortie, une ligne par session, identifiant, verdict, motif. Un rôle inconnu ou une mesure illisible fait sortir en erreur : jamais un `ok` par défaut ;
- le seuil : un plafond est atteint dès l'égalité, dans le script comme dans le contrôle des cartes ;
- dans une carte, un rôle sans plafond (`capitaine`) n'est pas jugé ; une cellule « Contexte max » vide, `—`, `à relever` ou encore au gabarit n'est pas jugée ; toute autre forme illisible est une erreur de la carte, nommée avec sa ligne ; la ligne de `## Dépassements` se rapproche par l'identifiant de session ;
- le texte de la marque, et celui du commentaire au plafond ;
- la place de « humain » dans la cascade : après « brouillon » et « bloquée ». `file.sh` ne liste que les PR étiquetées `à-fusionner` (ligne 69) : une PR au plafond qui revient dans la file est montrée « humain » et ne passe plus ; tant qu'elle ne porte que `fusion-bloquée`, elle reste hors de la liste, comme aujourd'hui ;
- comment une PR sort de l'état « humain » : aucun mécanisme nouveau. Sur l'ordre d'un humain, le capitaine la passe à la main (`passer.sh <n>`, ou `sujet.sh fusionner <n>` pour une sous-PR), qui ne lisent pas la file. Le compte ne se remet pas à zéro.

Hors de ce ticket : la ligne `Gel:` (ticket 8) ; un plafond de réveils par chantier, qui attend une mesure ; `README.md`, `skills/chaine/tickets/SKILL.md`, `skills/chaine/tickets/references/CONTENU.md`, `skills/chaine/architecte/`, `.claude-plugin/plugin.json` et `demarrage.mjs`, que le ticket 6 modifie dans la même vague.

## Surfaces

| Surface                                           | Preuve                                                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Une fille sous ses plafonds                       | `plafonds.test.mjs` « une fille sous ses deux plafonds est rendue ok »                                                                           |
| Une fille au plafond                              | `plafonds.test.mjs` « une fille au plafond de contexte ou de coût est à interrompre, la mesure et le plafond nommés »                            |
| Un conducteur ou un architecte au plafond         | `plafonds.test.mjs` « un conducteur ou un architecte au plafond de contexte passe la main »                                                      |
| Contrat sans la clé, clé mal formée               | `plafonds.test.mjs` « sans clé plafonds, les valeurs par défaut s'appliquent ; mal formée, le script sort en erreur »                            |
| Entrée douteuse                                   | `plafonds.test.mjs` « un rôle inconnu ou une mesure illisible n'est jamais rendu ok »                                                            |
| Carte : coût au-delà du plafond                   | `tickets.test.mjs` « une ligne de coût au-delà du plafond de son rôle est refusée sans ligne de dépassement pour sa session ; avec, elle passe » |
| Carte : cellules réelles                          | `tickets.test.mjs` « le contexte se lit en milliers (`174 k`), une cellule vide ou à relever n'est pas jugée, une autre forme est une erreur »   |
| Carte gelée                                       | `tickets.test.mjs` « une carte gelée d'avant les rôles n'est pas jugée sur ses dépassements »                                                    |
| Gate complet                                      | `tickets-gate.test.mjs` « gate complet : une fille au-delà du plafond sans dépassement écrit est refusée, la carte et la session nommées »       |
| `renvoyer.sh`, renvoi ordinaire                   | `fusionner.test.mjs` « renvoyer.sh : pose fusion-bloquée, retire à-fusionner et commente la cause », étendu : le commentaire porte la marque     |
| `renvoyer.sh`, au plafond                         | `fusionner.test.mjs` « renvoyer.sh : au troisième renvoi, le commentaire dit que la PR attend un humain »                                        |
| `file.sh`, PR au plafond                          | `fusionner.test.mjs` « file.sh : une PR renvoyée autant de fois que le plafond est montrée humain, et ni --next ni --rouges ne la rendent »      |
| `boucle.sh` ne reprend pas une PR « humain »      | `fusionner.test.mjs` « boucle.sh : une PR à l'état humain n'est ni passée, ni relancée, ni renvoyée »                                            |
| Gabarit de carte, prose du skill et de la méthode | lecture de `carte.map.md`, de `chantier/SKILL.md` § 6 et des trois phrases de `chaine-de-production.md`                                          |

## Vérification

`pnpm install --frozen-lockfile` puis `pnpm test`. Bancs ciblés : `node --test skills/chaine/chantier/scripts/plafonds.test.mjs`, `node --test skills/chaine/tickets/references/scripts/verify/*.test.mjs`, `node --test skills/chaine/fusionner/scripts/fusionner.test.mjs skills/chaine/fusionner/scripts/veille.test.mjs skills/chaine/sujet/scripts/faux-gh.test.mjs`. Depuis la PR 61, toute PR vers `main` rejoue seule `pnpm install --frozen-lockfile` puis `pnpm test` (`.github/workflows/ci.yml`, job `bancs`).

Avant de commencer, vérifier que le ticket 5 est sur `origin/main` : `git grep -n 'contre-revue' origin/main -- skills/chaine/tickets/references/gabarits/ticket.issue.md` rend une ligne (c'est le cas à `8eb1c9b`, ligne 10).

Essai à la main : passer à `plafonds.mjs` une fille à 299 999 tokens et 3 $, une fille à 301 000 tokens, une fille à 25 $ et un conducteur à 410 000 tokens, et lire les quatre verdicts.

## Livrer

Branche `feat/gnb-7-plafonds-et-renvois` depuis `origin/main`. Avant la PR, revue adversariale en suivant `skills/chaine/revue-adversariale/SKILL.md` de ce dépôt, avec les seuls critères du socle (le dépôt n'a pas de `.claude/chaine.json`) ; sa section va dans le corps de la PR. Une PR vers `main`, titre en conventional commit, corps en français, qui dit ce que le gate accepte encore et l'interface retenue pour `plafonds.mjs`. **Ne jamais la fusionner** : le capitaine de `skills` fusionne les PR que l'architecte lui nomme. Ne pas modifier ce ticket : l'architecte du programme tient son statut dans la carte. Pas d'accès `gh` : utiliser les outils GitHub MCP. Finir par un message à l'architecte (`send_message`) en cinq lignes : PR, fait, reste, décision prise par défaut, question.
