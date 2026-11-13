# Un chantier se gèle d'une ligne, et le plugin monte de version pour clore le lot

Status: ready-for-agent
Type: task
Blocked by: 6, 7
Modèle: sonnet
Fichiers chauds: `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/fusionner/scripts/file.sh`, `skills/chaine/chantier/SKILL.md`, `.claude-plugin/plugin.json`

## Le besoin

Rien ne permet aujourd'hui d'arrêter un chantier : seule la boucle locale du capitaine s'arrête (`boucle.sh --arreter`). Les sessions filles continuent de partir et leurs PR d'entrer.

Quand le ticket est fait, un chantier se gèle d'une ligne, que le produit peut écrire lui-même sur GitHub sans ouvrir de session : plus aucune session ne part de son sujet, plus aucune de ses PR n'entre. Le conducteur a une procédure pour arrêter son chantier. Et la version du plugin monte une fois, pour tout le lot des tickets 4 à 8.

## Où

Les lignes citées sont celles de `origin/main` à `1f29a3a` (2026-11-13). Les tickets 5, 6 et 7 en auront déplacé une partie : retrouver chaque endroit par le nom ou le texte cité.

**La ligne `Gel:`** (`A-11`) vit dans la fiche de la carte du chantier et se lit sur `origin/sujet/<nom>`. Non vide, le chantier est gelé.

- `skills/chaine/tickets/references/gabarits/carte.map.md` : ajouter la ligne `Gel:`, vide, dans la fiche (lignes 5 à 14).
- `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs` : `controlerCarte` (ligne 444, appelée par `tickets.mjs` ligne 158) ne refuse aujourd'hui aucune ligne inconnue de la fiche. Le prouver par un test dans `tickets.test.mjs`, pour que personne ne casse cette tolérance.

**`skills/chaine/sujet/scripts/sujet.sh`** (752 lignes). L'en-tête décrit chaque commande (lignes 7 à 52) et chaque sortie (lignes 54 à 61) ; l'aiguillage est lignes 742 à 752.

- Modèle pour lire une ligne de la fiche : `phase_carte` (lignes 182 à 194, appelée par `livrer` ligne 431), qui cherche la carte dont la ligne `Sujet:` nomme le sujet. Elle lit le sujet puis `develop` ; pour `Gel:`, le sujet seul.
- Deux commandes nouvelles : `geler <nom> "<raison>"` écrit la ligne dans la carte et la pousse sur le sujet ; `degeler <nom>` la vide. Ce qu'un commit de carte doit respecter est ce que vérifie `carte_sujet` (lignes 697 à 740, appelée par l'aiguillage ligne 744) : un seul fichier `docs/**/*.map.md` modifié en place, dont la ligne `Sujet:` nomme exactement le sujet (`carte_cite_le_sujet`, lignes 689 à 695), formaté par Prettier, poussé sans force.
- `demarrer` (lignes 196 à 250 ; toute session l'appelle avant son premier commit) refuse un sujet gelé, sortie 4, une fois le sujet rapatrié (ligne 229) et avant `verifier_ticket` (ligne 230).
- `livrer` (lignes 425 à 454 ; appelée à la main et par `livrer_prets` ligne 680) refuse un sujet gelé, sortie 4, après le rapatriement de la ligne 428.
- `livrer_prets` (lignes 652 à 683, appelée par `boucle.sh` ligne 305) appelle `livrer` dans le même shell, où un refus termine le script (`sortir`, ligne 71) : elle ne doit jamais l'appeler pour un sujet gelé, sans quoi les sujets prêts qui suivent ne seraient pas livrés. Elle ne retient que les sujets au verdict « prêt à livrer » d'`etat` (ligne 654).
- Une commande de lecture pour `file.sh`, sur le modèle de `livre` (aiguillage ligne 748, fonction `sujet_livre` lignes 163 à 176, appelée par `file.sh` ligne 100) : sortie 0 si le sujet est gelé.
- Tests à étendre : `sujet.test.mjs` (les refus de `demarrer` à partir de la ligne 30, `livrer-prets` ligne 285, `livrer` avec une carte qui ne vit que sur le sujet lignes 460 à 480) ; pour une carte sur un sujet avec un Prettier de jouet, le dépôt de `sujet-carte.test.mjs`, lignes 12 à 37.
- Prose : `skills/chaine/sujet/SKILL.md` (`argument-hint` ligne 4, « Commandes » ligne 34) et `skills/chaine/sujet/references/CONTENU.md`, ligne 5.

**`skills/chaine/fusionner/scripts/file.sh`.** Le tri est lignes 69 à 78, la cascade des états lignes 104 à 124 (plus l'état « humain » du ticket 7), l'en-tête qui les décrit lignes 7 à 29. À cet endroit sont disponibles `$base` et `$tete` (lus ligne 79) et `sujet_ticket` (lignes 92 à 96). Une PR d'un sujet gelé prend l'état « gelée », jamais « prête ». Ceux qui lisent ces états : `boucle.sh` lignes 216, 258 (son `case`, lignes 266 à 301, agit sur « vers sujet/… » et « sujet/… : prête »), 327 et 373 ; `veille.sh` lignes 54 à 58, qui relance sur tout état contenant `prête`, `sans CI` ou `CI rouge`. Tests : `skills/chaine/fusionner/scripts/fusionner.test.mjs`, sur le modèle de `depotSujetLivre` (lignes 415 à 432) et de ses trois tests (lignes 435 à 459). `skills/chaine/fusionner/SKILL.md` nomme le nouvel état.

**Le skill du conducteur**, `skills/chaine/chantier/SKILL.md`.

- § 6 : la ligne `Gel:` se lit en premier à chaque réveil, avant de réarmer (point 0, ligne 78). Gelé : ni vague, ni réarmement.
- Une procédure nouvelle, « Arrêter un chantier » : geler ; `list_sessions` par le tag `chantier:<nom>` (le tag est posé ligne 67, lu ligne 79) ; `interrupt_session` sur chacune ; `list_triggers` puis `delete_trigger` (déjà employés ligne 94) ; une ligne au journal de la carte.
- La carte n'a pas de journal aujourd'hui : `carte.map.md` n'a que les sections Fiche, Decisions-so-far, Fog, Vagues, Coût et Rétro (plus Dépassements depuis le ticket 7).

**La clôture du lot.**

- `.claude-plugin/plugin.json`, ligne 3 : la version, aujourd'hui `4.2.0`.
- Deux phrases que la vague précédente a laissées pour garder ses fichiers disjoints : dans `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md`, la phrase d'entrée (ligne 5) nomme aussi l'invocation du skill de l'architecte ; dans `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, le paragraphe des hooks (ligne 13) dit les deux signalements de `demarrage.mjs`.
- `README.md` : l'arbre de « Structure » donne des scripts au skill `chantier` (lignes 162 et 163), la ligne du skill `sujet` (ligne 84) nomme le gel. Relire que le README décrit tout le lot.

## Décisions

Tranché :

- `A-11` : le gel est une ligne `Gel:` de la fiche, lue sur `origin/sujet/<nom>` ; non vide (date et raison), le chantier est gelé ; elle se pose par `sujet.sh geler` ou à la main dans l'éditeur de GitHub, `sujet.sh degeler` la vide. Aucun label.
- La spec, lot 4 : `demarrer` et `livrer` refusent un sujet gelé ; une PR d'un sujet gelé prend l'état « gelée » ; la procédure d'arrêt et son ordre.
- `A-1` : une seule montée de version par lot, ici.
- La règle de version, `README.md`, « Ajouter un skill », étape 4 (ligne 174) : « Patch pour une correction, mineure pour un skill ou un gabarit ajouté, majeure quand un skill existant change de contrat », et ligne 176 : « Cette règle vaut pour **tout** changement de contenu, pas seulement l'ajout d'un skill. » Le lot ajoute un skill et un gabarit, et change le contrat de skills existants (`tickets` exige une fiche nouvelle, `chantier` commence au découpage, `fusionner` et `sujet` refusent ce qu'ils acceptaient). C'est une majeure : `4.2.0` devient `5.0.0`. Si la version de `origin/main` a bougé entre-temps, partir de celle-là. Précédent pour le titre : le commit `a96bd46`, « feat!: … (plugin 4.0.0) ».

Compatibilité, précisément :

- **Cartes existantes.** Aucune n'a de ligne `Gel:` : elles ne sont pas gelées, et rien n'est à réécrire. Le gate n'exige pas la ligne. `geler` l'ajoute à la fiche quand elle manque.
- **Sujet sans carte sur sa branche** (une série regroupée par le capitaine, ou un cadrage pas encore fusionné) : il ne peut pas être gelé. `geler` refuse, sortie 4, et dit pourquoi.
- **Ligne écrite à la main** : toute valeur non vide gèle, datée ou non. Le gate n'en refuse aucune forme : une ligne du produit ne doit jamais rougir un contrôle.

La session tranche seule, par défaut prudent, et le dit dans la PR :

- ce qu'écrit `geler` : `Gel: AAAA-MM-JJ — <raison>`, raison obligatoire ;
- `geler` ne dépend ni de la branche courante ni de l'arbre de travail de qui l'appelle : il construit son commit sur `origin/sujet/<nom>` et le pousse sans force et sans hook (comme `ouvrir`, ligne 265). Jamais de `git worktree` (`pieges.md`, ligne 8). Si le sujet a bougé entre-temps : un second essai, puis sortie 9, comme `carte <nom>` ;
- sujet déjà gelé : `geler` refuse (sortie 4) et montre la ligne en place ; `degeler` d'un sujet qui ne l'est pas sort en 0 ;
- quelles PR sont « gelées » : la spec nomme la sous-PR (`$base`) et la PR à recibler (`sujet_ticket`). La livraison du sujet (tête `sujet/<nom>` ou `livraison/<nom>-…`, reconnues ligne 71) l'est aussi : « plus aucune PR du chantier n'entre » ;
- la place de « gelée » dans la cascade : après « brouillon » et « bloquée », avant « humain » ;
- `etat` (lignes 598 à 646, appelée par `boucle.sh` lignes 239 et 376 et par `livrer_prets`) donne le verdict « gelé » : le capitaine le voit en fin de boucle, et `livrer_prets` l'écarte de lui-même ;
- `fusionner <pr>` lancé à la main sur une sous-PR d'un sujet gelé sort en 7 (rien à corriger côté auteur), jamais en 4 : la sortie 4 renverrait la PR à sa session (`boucle.sh`, ligne 293) ;
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

## Vérification

`pnpm install --frozen-lockfile` puis `pnpm test`. Bancs ciblés : `node --test skills/chaine/sujet/scripts/*.test.mjs`, `node --test skills/chaine/fusionner/scripts/fusionner.test.mjs skills/chaine/fusionner/scripts/veille.test.mjs`, `node --test skills/chaine/tickets/references/scripts/verify/tickets.test.mjs`.

Avant de commencer, vérifier que les tickets 6 et 7 sont sur `origin/main` : `git cat-file -e origin/main:skills/chaine/architecte/SKILL.md` et `git cat-file -e origin/main:skills/chaine/chantier/scripts/plafonds.mjs` sortent tous deux en 0.

À la main : `bash skills/chaine/sujet/scripts/sujet.sh` sans argument affiche l'aide, qui nomme `geler` et `degeler` ; `git diff origin/main -- .claude-plugin/plugin.json` ne montre que la ligne `version`.

## Livrer

Branche `feat/gnb-8-gel-de-chantier` depuis `origin/main`. Avant la PR, revue adversariale en suivant `skills/chaine/revue-adversariale/SKILL.md` de ce dépôt, avec les seuls critères du socle (le dépôt n'a pas de `.claude/chaine.json`) ; sa section va dans le corps de la PR. Une PR vers `main`, titre en conventional commit qui se termine par la version du plugin, corps en français, qui dit ce qui change pour un projet à la repose (tickets 4 à 8). **Ne jamais la fusionner** : le capitaine de `skills` fusionne les PR que l'architecte lui nomme. Ne pas modifier ce ticket : l'architecte du programme tient son statut dans la carte. Pas d'accès `gh` : utiliser les outils GitHub MCP. Finir par un message à l'architecte (`send_message`) en cinq lignes : PR, fait, reste, décision prise par défaut, question.
