# Les renvois, les messages et le gate selon le régime ; `sujet.sh etat` voit un sujet sans commit propre (lot 5c, `A-132`)

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — le code entier est dans le patch commun aux tickets 71, 72 et 73 ([`71-73-annexes/lot-5.patch`](71-73-annexes/lot-5.patch), écrit sur `25a72c7`, posé selon le § 2 du ticket 71), décrit ci-dessous ; les bancs neufs ou changés sont rouges avant le code, verts après, les mutations de la série C sont toutes rouges, et la suite entière est verte (« Vérification », qui vaut pour les trois tickets). Rien à concevoir.
Blocked by: 71, 72
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/renvoyer.sh`, `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/sujet/scripts/sujet.sh` et `sujet.test.mjs`, `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs`, `tickets.mjs`, `tickets.test.mjs` et `tickets-gate.test.mjs`, `skills/chaine/fusionner/scripts/messages-du-regime.test.mjs` (neuf). Même PR que les tickets 71 et 72.

## Le besoin

Ce ticket réalise la partie **5c** de la spec `relecture-independante.spec.md` (section « Les lots », point 5) : **les renvois, les messages et le gate disent le régime 8**. En régime 8, l'auteur ne pose jamais `à-fusionner` (`A-84`, `A-93`) : un renvoi du capitaine lui dit de corriger puis de redemander la relecture (`A-91` : « `renvoyer.sh` dit alors corriger, puis poser `à-relire` ») ; `sujet.sh demarrer` le dit au départ ; le gate `tickets` cesse d'exiger `Label: contre-revue` (`A-94`) et exige `Relecture: double` sur un ticket ouvert qui cite une règle haute (`A-90`). Il porte aussi deux suites que l'architecte a rangées avec ce lot parce qu'elles écrivent `sujet.sh` (`A-149`) :

- **`A-132`** (contre-relecture de la PR 136, ticket 56) : `sujet.sh etat` ne liste plus un sujet sans commit propre ni PR ouverte, ce que devient un sujet juste après sa livraison intermédiaire ; la boucle du capitaine (`rafraichir_sujets`, qui lit `etat`) n'y reporte donc jamais develop, et le conducteur ne le voit pas en retard. Prouvé sur le vrai `sujet.sh` par la contre-relecture ; noté « ticket de suite » (carte, 2026-11-19, 11 h 30 UTC ; spec, `A-131`, `A-132`).
- **Le reliquat du ticket 56** (`A-69`, son commentaire de fin) : le refus de `demarrer` conseille encore `sujet.sh rafraichir <nom>` à une session, geste que seul le capitaine fait.

## Où

Patch écrit sur `origin/main` à `25a72c7`, posé sur le `main` qui aura reçu les PR A et B (ticket 71, § 2), après les tickets 71 et 72 dans la même PR.

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/renvoyer.sh` | en-tête ; le régime de la PR lu, la suite du commentaire en régime 8, la réception en deux fusions comprise (décision 1) |
| `skills/chaine/fusionner/scripts/github.sh` | neuves : `regime_de_la_pr`, `cle_relecture_sur` (décisions 1, 2) ; « les sept labels » devient « les neuf labels » (le relevé du ticket 66, point 7) |
| `skills/chaine/sujet/scripts/sujet.sh` | `demarrer` : le message du régime 8 ; `verifier_ticket` : le refus sans `sujet.sh rafraichir` ; `etat` : le sujet sans commit propre (décisions 2 à 4) |
| `skills/chaine/sujet/scripts/sujet.test.mjs` | « demarrer refuse quand la spec du ticket n'est pas encore sur le sujet » : l'assertion récrite ; 1 test neuf (`A-132`) |
| `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs` | `ecartsFormatPret` reçoit `regime` ; neuve `ecartsRelectureDouble` ; `controlerTicket` reçoit `regime` et `niveauDe` (décision 5) |
| `skills/chaine/tickets/references/scripts/verify/tickets.mjs` | en-tête (règles 13 et 14) ; le régime lu dans le contrat ; `niveauDe`, par les lecteurs de `double-relecture.mjs` (décision 5) |
| `…/verify/tickets.test.mjs`, `…/verify/tickets-gate.test.mjs` | 1 test neuf chacun |
| `skills/chaine/fusionner/scripts/messages-du-regime.test.mjs` | **neuf**, 3 tests |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante de `main` (7.39.0) et la note des trois tickets, posées par `note-et-version.mjs` (ticket 71, § 2) |

## Décisions

1. **`renvoyer.sh`** (`A-91`, `A-93`) : le régime de la PR (`regime_de_la_pr <base> <created_at>`, qui joue `regimeDeLaPr` du ticket 71) choisit la suite. Régime 8 : « Corriger, puis redemander la relecture : le commentaire `À relire — sommet <sha> — Session: <la tienne> — Conducteur: <le tien>` et l'étiquette `à-relire`, sans retirer `fusion-bloquée` ; jamais `à-fusionner`, que le Relecteur pose sur un verdict validé ». `fusion-bloquée` reste : la décision du Relecteur la retire quand elle pose `à-fusionner` (`ETIQUETTES`, `A-84`), et une PR `fusion-bloquée` sans `à-relire` n'est pas regardée (`A-115`). La réception de develop en deux fusions : la nouvelle PR demande sa relecture. PR ou régime illisibles : le texte du régime 7, tel qu'aujourd'hui. Sans la clé sur `origin/develop` ni sur aucun `origin/sujet/*` (`cle_relecture_sur`, une lecture locale), la PR n'est pas lue pour son régime : aucune lecture de plus que sur `main` (`A-186`, point 1 ; mutation C18). Le plafond des renvois ne change pas (`A-89`).
2. **`sujet.sh demarrer`** : la PR qui part maintenant sera en régime 8 si sa base porte la clé (`cle_relecture_sur origin/<sujet>`, une lecture de `.claude/chaine.json` ; sa forme se juge au passage du capitaine) ; le message dit alors de demander la relecture (dernier push, PR hors brouillon, commentaire `À relire — sommet …`, étiquette `à-relire`) et que le Relecteur pose `à-fusionner`. Sinon, le message d'aujourd'hui.
3. **Le refus de `verifier_ticket`** (spec absente du sujet, `A-69`) ne conseille plus `sujet.sh rafraichir` : « si elle est déjà dans develop, le capitaine la reporte dans le sujet de lui-même à chaque lancement de sa boucle (A-69) : attendre, ou le lui demander ; une session ne lance jamais `sujet.sh rafraichir` ». Vaut pour les deux régimes.
4. **`sujet.sh etat` (`A-132`)** : un sujet sans commit propre (`avance` 0) ni PR ouverte reste listé tant qu'il est en retard sur develop (`retard` > 0) et qu'il n'est pas livré (`sujet_livre` : sa carte sur develop à `6-nettoyage` ou `fini`, ou, sans carte, son commit de merge dans develop et sa branche absente) ; son verdict est « en cours » (jamais « prêt à livrer », qui veut `avance` > 0). `rafraichir_sujets` de `boucle.sh` n'a rien à changer : il lit `etat` et reporte develop dans tout sujet listé sans sous-PR, ici par avance rapide. Un sujet livré n'est jamais rouvert ; un sujet à jour sort du tableau. Limite : sans carte, `sujet_livre` ne reconnaît un sujet livré qu'une fois sa branche supprimée (`clore`) ; d'ici là, `etat` le liste « en cours » s'il est en retard, et la boucle y reporte develop par avance rapide. Sans effet sur develop ; le sujet sort du tableau au passage suivant. Les deux autres cas d'`A-132` (une livraison ouverte : `passer.sh` met la PR de livraison à jour ; une sous-PR hors vague restée ouverte : le sujet est actif) restent à la consigne du ticket 56 : le conducteur demande au capitaine.
5. **Le gate `tickets` en régime 8** (`A-90`, `A-94`, `A-97`) : le régime se lit dans le contrat de l'arbre de travail (la clé `relecture`, quelle que soit sa forme). `Label: contre-revue` n'est plus exigé (règle 7) ; la valeur reste lisible. Un ticket **ouvert** (ni `Fait`, ni `wontfix`) qui cite sur une ligne `Règles:` de son en-tête une règle de criticité haute porte `Relecture: double` (règle 14). La criticité : la plus haute de l'en-tête du fichier de la règle (`enTeteDeRegle`) et de l'index Anchorpost (`reglesDeLIndex`, `anchorpost/anchorpost.json`), règles rejetées ou obsolètes exclues, par les lecteurs de `double-relecture.mjs` (la seule définition, `A-113`) ; un en-tête ou un index illisibles se lisent haute, la cause dite. Sans `scripts/chaine/double-relecture.mjs` en régime 8, le gate sort en 2 en le disant. Le calcul « double relecture exigée » reste celui qui décide : ce contrôle ne fait que prévenir au découpage (`A-90`). En régime 7, rien ne change.

## Les quatre suites rangées avec le lot 5

| Suite | Où elle se retrouve | Ce qu'elle devient |
| --- | --- | --- |
| `A-132`, `sujet.sh etat` | spec `A-131`/`A-132` ; carte, PR 136 ; ticket 56 | **ce ticket**, décision 4 |
| La « veille morte » : une veille du capitaine morte avec son conteneur, file vide, ne prévient personne (5 h 40 sans lecture de la file le 2026-11-19 ; le capitaine d'Anchorpost a posé un réveil horaire de garde) | carte, 2026-11-19 07 h 05 ; passation du 2026-11-19, « Tickets du plugin notés », point 2 | **hors des fichiers du lot 5** (`fusionner/SKILL.md`, `veille.sh`) : un ticket à part (ci-dessous) |
| `archive_session` refusé au conducteur : `chantier/SKILL.md` § 6 point 6 et `chaine-de-production.md` (« Relevé des coûts ») lui font archiver ses filles ; la garde du mode « auto » le refuse (l'outil le réserve à une session dont un humain a pris acte) ; `P-62` : l'architecte archive, sur une ligne « à archiver : session, ticket, coût » | carte, 2026-11-19 ; passations du 2026-11-19, point 3 ; consignes du conducteur, point 10 | **hors des fichiers du lot 5** : la partie 6b récrit `chantier/SKILL.md` et 6a `chaine-de-production.md`, et `A-87` y ajoute l'archivage des sessions de relecture : le porter là |
| La veille qui ne repart pas après une panne, et la veille du capitaine qui meurt au plafond de 30 minutes des tâches de fond de l'outil Bash (`A-180`, point 1) | spec `A-180` ; ticket 66, décision 10 ; passation du 2026-11-21, « Quoi faire », point 2 | **hors des fichiers du lot 5** : le même ticket à part que la veille morte |

**Le ticket à part recommandé** (`fusionner/SKILL.md` et `veille.sh`, une famille de fichiers, sans aucun fichier du lot 5) : (1) la veille se lance avec le `timeout` de l'outil Bash posé à 7 200 000 ms (le maximum, deux heures) : `veille.sh` suppose deux heures (`limite=120`, `--marge 40`), alors que l'outil arrête une tâche de fond à 30 minutes par défaut, sans ligne finale, au milieu d'un passage s'il le faut ; (2) une fin sans `VEILLE FINIE` ni `VEILLE ARRÊTÉE` (tâche tuée, conteneur redémarré) se lit comme une veille morte : relancer la veille, après `boucle.sh --arreter` ; (3) un réveil de garde (`send_later` à 60 minutes, réarmé à chaque réveil) relit la file et relance une veille morte, ce qui couvre la panne de conteneur que rien ne réveille ; (4) un test de dépôt fige les trois phrases. Il peut partir avant le lot 6, qui récrira `fusionner/SKILL.md` (6b) sur le `main` qu'il trouvera.

## Questions à l'architecte

1. **`Relecture: double` en régime 8 sur un ticket que le gate gèle (la dette `tickets`)** : écrit, elle est exigée de tout ticket ouvert, gelé ou non (la dette ne couvre que le format « prêt »). **Recommandation : garder** ; aucun ticket gelé ne cite encore une règle haute dans les trois projets, à vérifier à la repose (lot 7). **Tranché : ainsi** (`A-185`, point 5).
2. **Le gate sort en 2 sans `double-relecture.mjs` en régime 8.** Autre choix : lire les en-têtes de règle sans lui. **Recommandation : garder** ; une seule définition de la criticité (`A-113`), et la repose qui pose la clé pose aussi `fusionner`. **Tranché : ainsi** (`A-185`, point 6).

## À faire, dans l'ordre

Comme le ticket 71, § 0 à § 3 : une seule PR, un seul patch, la version commune.

## Surfaces

| Surface | Prouvée par |
| --- | --- |
| Renvoi en régime 8 : `à-relire`, `fusion-bloquée` gardée, jamais `à-fusionner` ; régime 7 (ouverte avant, sans clé) comme avant ; sans la clé, la PR n'est pas lue pour son régime (un espion sur `gh`) | `messages-du-regime.test.mjs`, test 1 |
| Réception en deux fusions, régime 8 | test 2 |
| `demarrer` : le message du régime 8 ; régime 7 inchangé | test 3 |
| Le refus de `demarrer` sans `sujet.sh rafraichir` | `sujet.test.mjs`, « demarrer refuse quand la spec du ticket n'est pas encore sur le sujet » |
| `etat` : sujet sans commit propre, en retard, pas livré, listé ; reporté ; livré, jamais | `sujet.test.mjs`, « etat : un sujet sans commit propre ni PR… (A-132) » |
| Gate : `Label` non exigé, `Relecture: double` exigée, ticket fermé, criticité illisible, `Règles: —` | `tickets.test.mjs`, « lot 5c, régime 8 » |
| Gate : une règle rejetée de l'index ne compte pas, même haute ; en vigueur, elle compte | `tickets-gate.test.mjs`, « régime 8 : … » |
| Gate de bout en bout : en-tête de règle lu, `double-relecture.mjs` absent | `tickets-gate.test.mjs`, « régime 8 : … » |

## Vérification

Ces comptes valent pour la PR entière, les trois tickets ensemble. **Chemin A** : `main` après les PR A puis B (`A-185`, point 9 ; le chemin attendu, `A-186`, point 2), joué geste pour geste par le § 0 à § 2 du ticket 71. **Chemin 0** : `main` encore à `25a72c7`, si le lot 5 partait seul. Mesurés par le relecteur le 2026-11-21 (`71-73-annexes/relecture-tour-1/`), Node 22.23.5, quatre cœurs partagés.

1. **Rouge avant le code** (ticket 71, § 1 : les treize bancs du patch posés seuls dans un arbre à part, chacun par `node --test`) : **51 rouges**, sur 358 tests (chemin A) ou 357 (chemin 0) — ticket 71 : 26 (`verdict-du-capitaine` 18 sur 19, `revue-exigee` 5 sur 37, `pr-titre` 2 sur 12, `faux-gh` 1 sur 17, ou 1 sur 16 sur le chemin 0) ; ticket 72 : 18 (`sensibles-du-capitaine` 6 sur 6, `garde-fichiers` 3 sur 4, `regles` 2 sur 87, `chemins-sensibles` 1 sur 13, `points-d-entree` 6 sur 66) ; ce ticket : 7 (`messages-du-regime` 3 sur 3, `sujet.test.mjs` 2 sur 45, `tickets-gate` 1 sur 12, `tickets.test.mjs` 1 sur 37). Les deux seuls tests neufs verts avant le code figent le régime 7 (« régime 7, passer.sh », « régime 7 (sans la clé `relecture`) »).
2. **Vert après.** Les mêmes treize fichiers dans la branche : 358 sur 358 (chemin A), 357 sur 357 (chemin 0). Sur le chemin A, les bancs que la PR A change et que ce patch joue sont verts aussi : `relecteur.test.mjs` 42, `scripts/relecteur.test.mjs` 9, `decision-relecteur.test.mjs` 40, `scripts/relecture.test.mjs` 39.
3. **La suite entière**, `node --test` sur les quatre motifs de `pnpm test` : **1 331 sur 1 331** sur le chemin 0, aucun sauté, 1 075 s (charge 2,7 au départ, jusqu'à 9 au milieu : deux autres agents sur le poste) ; **1 342 sur 1 342** sur le chemin A (le `main` simulé des PR A, patch `d88e9889…`, et B, 7.38.2), aucun sauté, 1 197 s. `scripts/poses.test.mjs` (les bancs posés à plat, les trois bancs neufs du capitaine compris) en est, vert. Sur un `main` plus récent encore : le total de `main` plus les 52 tests neufs du patch, aucun rouge.
4. **Mutations.** [`71-73-annexes/mutations.mjs`](71-73-annexes/mutations.mjs), sur la branche commitée (`MUTATIONS_PARALLELE=<k>` : k copies à la fois) : **80 mutations** (A1 à A34 pour le ticket 71, B1 à B27 pour le 72, C1 à C19 pour celui-ci), chacune trouvée une fois exactement dans son fichier : **toutes rouges (80)**, en 26 min avec deux copies, sur le chemin 0. Elles ont été jouées sur le patch avant sa dernière retouche, une ligne de `tickets-gate.test.mjs` (la criticité de l'index posée par une variable, que `scripts/depot.test.mjs` exige) ; les huit mutations qui jouent ce banc (C9, C10, C13 à C17, C19), rejouées sur le patch final : rouges. `node "$S/mutations.mjs" [A|B|C|<nom>]` pour une série ou une mutation. A30 joue `fusionner.test.mjs` entier (quatre minutes) ; les autres, un à trois bancs du lot.
5. `git diff --stat origin/main` : les fichiers de « Où » des trois tickets, et eux seuls (28 fichiers, dont 4 neufs, tous des bancs).

Pour la session : les points 1 à 5, dans cet ordre, et leur sortie dans le corps de la PR. Le patch : [`71-73-annexes/lot-5.patch`](71-73-annexes/lot-5.patch), sha256 `4e97a67c94dc185cb0b347481e8011d10bae0e5ea14dbd3845bd2c952e61806f`.

## Ce qui n'a pas été établi

1. **Les textes des skills** (`fusionner/SKILL.md`, `sujet/SKILL.md`, `chantier/SKILL.md`) ne disent pas encore le régime 8 : partie 6b. Les messages des scripts le disent seuls d'ici là.
2. **`etat` appelle `sujet_livre`** (un `git fetch` et un `ls-remote`) pour chaque sujet sans commit propre ni PR : un ou deux par lancement de la boucle d'ordinaire ; non mesuré sur un dépôt à dix sujets.
3. **Le gate lit l'index Anchorpost de l'arbre de travail** : une PR qui monte une règle sans régénérer l'index n'est vue que par l'en-tête de la règle (lu aussi), comme le calcul.

## Hors périmètre

- La veille du capitaine et `archive_session` (tableau ci-dessus).
- La bascule (lot 6) : la clé dans le gabarit, les skills à deux régimes, la version 8.0.0.

## Comments

- 2026-11-21 — Écrit par un agent rédacteur sur la spec (lot 5, partie c ; `A-69`, `A-84`, `A-90`, `A-91`, `A-93`, `A-94`, `A-97`, `A-132`, `A-149`) et sur `origin/main` à `25a72c7`, après les tickets 71 et 72 dans la même PR. Code, bancs, mutations et suite entière joués sur un clone neuf. Points remontés : les deux « Questions à l'architecte », et le ticket à part de la veille.
- 2026-11-21 — Retouché après le tour de relecture du ticket (`A-186`), par le relecteur : `renvoyer.sh` ne lit plus la PR sans la clé (décision 1, l'espion du test 1, mutation C18) ; la limite d'`etat` sans carte écrite (décision 4) ; une règle rejetée de l'index au gate (`tickets-gate.test.mjs`, mutation C19) ; la « Vérification » pour les deux chemins, patch, mutations et suites rejoués.
