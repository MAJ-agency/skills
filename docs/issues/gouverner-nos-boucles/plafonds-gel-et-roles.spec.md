# Plafonds, gel d'un chantier et rôles — spec du chantier 2

Programme : [`map.md`](map.md) (« gouverner nos boucles »). Décisions du produit : `P-1` à `P-4` de la carte, validées le 2026-11-13. État : découpage proposé, à valider par le produit avant tout ticket.

## Le problème

Trois faits relevés sur les deux premiers chantiers d'Anchorpost. Les plafonds de contexte étaient écrits et ont été dépassés cinq fois sans que rien ne s'arrête (une session qui pilote à 726 000 tokens, un ticket à 30,72 $ pour un repère de 4 à 7 $). Aucun moyen n'existait d'arrêter un chantier : seule la boucle locale du capitaine s'arrête. Et la session qui parle au produit, présente dans les cartes sous le nom de « Conducteur », n'a ni définition ni mode d'emploi.

## Ce qui change, vu par le produit

- **Les rôles prennent les mots du bâtiment** (`P-1`) : l'architecte conçoit et parle au produit, le conducteur de chantier fait tourner un chantier. Chaque carte nomme aussi un **responsable**, une personne.
- **L'architecte a son skill** (`P-2`) : il s'arrête à la spec validée ; le conducteur découpe, lance et suit.
- **Une session qui dépasse est arrêtée** (`P-3`), et la question revient au produit : découper le ticket, relancer, ou accepter le dépassement par écrit. Une PR renvoyée trois fois attend un humain au lieu de repartir en boucle.
- **Un chantier se gèle d'une ligne**, que le produit peut écrire lui-même sur GitHub, sans ouvrir de session : plus aucune session ne part, plus aucune PR du chantier n'entre.
- **Chaque PR de `skills` passe un contrôle automatique** avant la lecture du produit (`P-4`).

## Décisions de conception (architecte)

- `A-6` — **Le label de ticket dit ce qui se passe, pas qui le fait** : `Label: contre-revue` remplace `Label: architecte`. Le gate accepte l'ancienne valeur sur les tickets existants. Raison : le chantier 3 redéfinira qui relit ; un nom de rôle dans une valeur lue par la machine se renommerait deux fois.
- `A-7` — **La fiche d'une carte nomme trois choses** : `Responsable:` (une personne), `Architecte:` (la session du programme, facultative quand le chantier n'a pas de programme) et `Conducteur:` (la session qui mène le chantier). Le gate exige `Responsable:` et `Conducteur:` ; pour une carte d'avant le 2026-11-13, `Architecte:` seul reste accepté. Les cartes existantes ne sont pas réécrites : leur dette est gelée dans un fichier qui ne reçoit jamais d'entrée nouvelle, comme `tickets-dette.json`.
- `A-8` — **Un programme a sa carte, distincte d'une carte de chantier** : fichier `*.programme.md`, gabarit propre (fiche, chantiers dans l'ordre, décisions `P-n` et `A-n`, brouillard, coût, journal), hors du contrôle des cartes de chantier. Modèle : la carte de ce programme.
- `A-9` — **Les plafonds vivent dans `.claude/chaine.json`, la décision dans un script testé.** Clé `plafonds` : `contexteFille` (300000), `coutFille` (20), `contextePilote` (400000, conducteur et architecte), `renvoisParPR` (3). Le conducteur lit ses sessions par `get_session`, passe le résultat à `plafonds.mjs`, qui rend pour chacune `ok`, `interrompre` ou `passer-la-main` ; il ne juge pas lui-même. Un dépassement s'écrit dans la carte, section `## Dépassements` (session, ticket, mesure, décision du produit, date). Le contrôle des cartes refuse une ligne de `## Coût` au-delà du plafond de son rôle sans ligne correspondante dans `## Dépassements`.
- `A-10` — **Les renvois se comptent sur la PR elle-même** : chaque commentaire de `renvoyer.sh` porte une marque invisible, le script compte les marques existantes. Au plafond, il dit que la PR attend un humain, `file.sh` la montre dans l'état « humain », et aucun label nouveau n'est créé (un label demande un administrateur).
- `A-11` — **Le gel est une ligne `Gel:` dans la fiche de la carte, lue sur `origin/sujet/<nom>`.** Non vide (date et raison), le chantier est gelé. Elle se pose par `sujet.sh geler <nom> "<raison>"` ou à la main dans l'éditeur de GitHub ; `sujet.sh degeler <nom>` la vide. Raison du choix : la carte est déjà l'état du chantier que toute session lit, et un label GitHub ne s'attache pas à une branche.
- `A-12` — **« Fille » reste le mot** pour la session d'un ticket : c'est le mot vivant du produit et celui du code (`fillesParVague`, rôle `fille` du registre des coûts).
- `A-13` — **Le contrôle automatique de `skills` est un seul workflow** : installer, puis `pnpm test`, sur toute PR vers `main`. Le rendre obligatoire est un réglage GitHub, à faire par un administrateur.

## Les lots, et où ils se branchent

Faits relevés sur `origin/main` (`342171d`) le 2026-11-13. `socle/` abrège `skills/chaine/socle-chaine-de-production/references/`, `tickets/` abrège `skills/chaine/tickets/references/`, `fus/` abrège `skills/chaine/fusionner/scripts/`.

### Lot 1 — rôles et responsable

- Prose à renommer, en nombre d'occurrences d'« architecte » : `skills/chaine/chantier/SKILL.md` (18), `socle/docs-agents/chaine-de-production.md` (34, dont la table des rôles lignes 9 à 21 et le relevé des coûts ligne 134), `socle/adr/ADR_ALL_ARC-N-chaine-de-production.md` (5), `tickets/SKILL.md` (3), `tickets/references/CONTENU.md` (2), `revue-de-ticket/SKILL.md` (2), `fusionner/SKILL.md` (1), `socle/docs-agents/pieges.md` (1), `socle/fragments/readme-commandes.md` (1). « Conducteur » n'apparaît qu'une fois, `chaine-de-production.md:35`.
- Valeurs lues par la machine : `tickets/scripts/verify/tickets-regles.mjs:318` (`Label: architecte`, message ligne 323) et `:436` (`Architecte:`, erreur lignes 459 et 460) ; leurs tests `tickets.test.mjs` (lignes 65, 93, 94, 98, 124) et `tickets-gate.test.mjs` (lignes 50, 51) ; les gabarits `tickets/gabarits/carte.map.md:8` et `ticket.issue.md:10`.
- `tickets/scripts/docs/couts.mjs` ne compare aucun rôle à « architecte » (il ne filtre que `fille`, ligne 82) : seuls les jeux d'essai de `couts.test.mjs` changent.
- La table des rôles gagne une ligne : l'architecte du programme. La coupure de `P-2` s'écrit dans `chantier/SKILL.md` : lancé avec une spec validée, le skill commence au découpage ; le grilling complet appartient à l'architecte.

### Lot 2 — skill de l'architecte

- Nouveau skill `skills/chaine/architecte/`, déclaré dans `.claude-plugin/plugin.json`, lancé par un humain. Il dit : quoi lire au départ, comment tenir la carte du programme (`A-8`), où s'arrête l'amont, comment un conducteur est lancé, quand passer la main (`A-9`).
- Gabarit `tickets/gabarits/programme.md`.
- `socle/agent/demarrage.mjs` (hook `SessionStart`, ne bloque jamais, étapes listées ligne 17) signale deux manques au lieu de les laisser découvrir : `CLAUDE.md` demande `graphify` et la commande ou `graphify-out/graph.json` manque ; les skills de la chaîne ne sont pas disponibles dans la session.
- Ce lot dépend de la question ouverte ci-dessous.

### Lot 3 — plafonds et renvois

- Contrat : `socle/chaine.json` (cinq clés aujourd'hui) et sa description `socle/CONTENU.md:3-5`, qui annonce « quatre lignes » et oublie `gatesRapides` : à corriger en passant. Aucun gate ne valide la forme du fichier ; `tickets-regles.mjs:279-283` ne refuse qu'un JSON illisible.
- `plafonds.mjs` et son banc : nouveau, dans `skills/chaine/chantier/scripts/`, posé dans `scripts/chaine/` du projet.
- Suivi : `chantier/SKILL.md` § 6 (réveil toutes les 45 minutes) appelle `get_session`, puis `plafonds.mjs`, puis `interrupt_session`, puis la question au produit.
- Carte : `tickets/gabarits/carte.map.md` gagne `## Dépassements` ; `controlerCarte` (`tickets-regles.mjs:444-474`) ne vérifie aujourd'hui que la présence de `## Coût` (ligne 462), pas son contenu. En-tête exact du tableau : `| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |`.
- Renvois : `fus/renvoyer.sh` (label lignes 16 et 17, commentaire lignes 18 à 23) ne garde aucun compte ; ses appelants sont `boucle.sh:230`, `:284`, `:292`, `:351` et `refus.sh:16`. États de `fus/file.sh` : lignes 104 à 108.

### Lot 4 — gel

- `skills/chaine/sujet/scripts/sujet.sh` : commandes `geler` et `degeler` ; `demarrer` et `livrer` refusent un sujet gelé.
- `fus/file.sh` : le tri `jq` est lignes 69 à 78, la cascade des états lignes 104 à 108 ; `$base` et `sujet_ticket` y sont disponibles. Une PR d'un sujet gelé prend l'état « gelée », jamais « prête ».
- `chantier/SKILL.md` : la ligne `Gel:` se lit en premier à chaque réveil ; nouvelle procédure « arrêter un chantier » : geler, `list_sessions` par tag `chantier:<nom>`, `interrupt_session`, `list_triggers`, `delete_trigger`, ligne au journal de la carte.
- `controlerCarte` accepte la ligne `Gel:`.

### Lot 5 — contrôle automatique de `skills`

- `.github/workflows/ci.yml` : aucune expression dans un `run:`, actions épinglées (ticket `docs/issues/pose-du-socle/issues/1-ci-sans-expression-dans-run.issue.md`). Le script `test` de `package.json` joue déjà tous les bancs.

## Question ouverte, qui conditionne le lot 2

Une session créée par une autre session ne reçoit qu'un dépôt, celui du projet. Or les skills de la chaîne ne s'installent que si le dépôt `skills` est cloné à côté, et un projet ne les porte pas (`anchorpost` n'a aucun dossier `.claude/skills/`). Conséquence : une session que l'architecte crée n'a ni `chantier`, ni `revue-de-ticket`, ni `fusionner`. Constat du 2026-11-13 : l'attache du second dépôt en cours de session a été refusée deux fois par le classifieur de permissions. Question `Q10` posée au produit ; la recommandation est de recopier les skills d'exploitation dans chaque projet, avec leur version, et de faire signaler tout écart au démarrage.

## Hors périmètre

Chantier 3 : la relecture des tickets par un agent neuf avant la vague, la revue que l'auteur ne contrôle pas, la session de fin de chantier, les garde-fous rejoués en CI, l'index de santé de la chaîne, les régimes de vérification. Le plafond de réveils par chantier attend une mesure.

## Découpage proposé

| Ticket | Objet                                                                 | Lot | Modèle | Fichiers chauds                                                                       | Bloqué par          |
| ------ | --------------------------------------------------------------------- | --- | ------ | ------------------------------------------------------------------------------------- | ------------------- |
| 4      | Contrôle automatique de `skills`                                      | 5   | sonnet | `.github/workflows/ci.yml`                                                            | 2 (PR 58 fusionnée) |
| 5      | Rôles, responsable, `Label: contre-revue`, coupure amont et aval      | 1   | opus   | `chantier/SKILL.md`, `chaine-de-production.md`, `tickets-regles.mjs`, gabarits        | 1, 3 (PR 59 et 60)  |
| 6      | Skill de l'architecte, carte de programme, signalements au démarrage  | 2   | opus   | `skills/chaine/architecte/`, `plugin.json`, `demarrage.mjs`                           | 5, et `Q10`         |
| 7      | Plafonds et renvois comptés                                           | 3   | sonnet | `socle/chaine.json`, `chantier/SKILL.md` § 6, `tickets-regles.mjs`, `renvoyer.sh`, `file.sh` | 5                   |
| 8      | Gel d'un chantier, et la montée de version du plugin qui clôt le lot  | 4   | sonnet | `sujet.sh`, `file.sh`, `chantier/SKILL.md`, `plugin.json`                             | 6, 7                |

Vagues : 4 et 5 ensemble ; puis 6 et 7 ensemble (fichiers disjoints) ; puis 8. Trois tours de fusion par le produit.

## Vérification d'ensemble

`pnpm test` vert sur chaque PR ; puis, une fois le lot fusionné, la repose dans `anchorpost` par un ticket de ce dépôt, et un essai réel : geler un sujet jouet, constater que `file.sh` montre ses PR « gelées » et que `sujet.sh demarrer` refuse.
