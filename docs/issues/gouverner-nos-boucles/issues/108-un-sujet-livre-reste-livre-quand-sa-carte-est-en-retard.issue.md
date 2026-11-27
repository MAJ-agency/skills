# Un sujet livré reste livré quand sa carte est en retard : un ticket ajouté ensuite part de develop, et rien ne rouvre le sujet

Status: needs-triage
Type: défaut
Modèle: opus — une condition de plus dans `sujet_livre`, que lisent `demarrer`, `regrouper`, `etat`, `file.sh` et `clore` ; un saut dans `regrouper-series` ; une ligne de sortie de `clore` ; deux phrases des skills `sujet` et `chantier`, et leurs bancs. La règle est fixée par les décisions `A-246` et `A-247` ; la place d'un ticket d'après la livraison reste la règle écrite (`demarrer`, `sujet.sh:476-483`). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 100
Dépendances: —
Fichiers chauds: `skills/chaine/sujet/scripts/sujet.sh` (`sujet_livre` 285-305 ; `series_a_regrouper` 1383-1403 et `regrouper_series` 1405-1435 ; `clore` 1572-1638, la sortie 3 à 1636) ; `skills/chaine/sujet/SKILL.md` (« Regrouper », 94 ; « Clore », 96-98) et `references/CONTENU.md` ; `skills/chaine/chantier/SKILL.md` (§ 7, points 1 et 4, 120 et 124) ; `skills/chaine/sujet/scripts/sujet.test.mjs` (468-546, 893) et `sujet-clore.test.mjs` (193-203) ; `skills/chaine/fusionner/scripts/file.sh` (**lu, inchangé** : 140-146) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Même PR que 109, en premier** : 109 touche `sujet.sh` (`livrer` 1176-1244, `carte_sujet` 1640-1680), `sujet/SKILL.md` (88-92) et `sujet.test.mjs` (548-640). Les tickets 104, 102 et 100 touchent `chantier/SKILL.md` (lignes 22, 67, 82, 86-98, 102, 126-136) et 104 `sujet/SKILL.md:80`, dans une PR : elle passe d'abord, d'où `Blocked by: 100`, la dernière de ses trois. Le ticket 105 touche `sujet.sh` (`fusionner`, 914-997) dans une autre PR : la seconde à entrer relit `sujet.sh` sur `main`. Numéros de ligne lus sur `origin/main` à `3daedcd` (plugin 8.5.0), avant 94 à 107 : relire chaque ligne citée sur la branche.

## Le besoin

Deux constats de l'essai réel du régime 8, d'une seule cause (journal de la carte ; entrée « Fin de l'essai réel du régime 8 »).

1. **Constat (9)** (2026-11-23, 20 h 36 UTC, PR #13 du jouet). Deux tickets jouets, `.08` et `.09`, ont été ajoutés au chantier après la livraison de son sujet (#11, entrée à 20:05). Pour que `demarrer` ne les place pas sur le sujet livré, il a fallu passer la carte en `Phase: 6-nettoyage` pendant qu'une vague tournait encore. La relecture l'a exigé (`K4`) : sinon, `sujet_livre` tenait le sujet pour vivant.
2. **Constat (10)** (2026-11-23, 21 h 15 UTC, PR #13). La PR #13, vers `develop`, validée, n'est pas entrée dans `develop`. Un regroupement automatique du capitaine a recréé `sujet/essai-regime-8` depuis `develop`, basculé la base de #13 et l'a squashée dans ce sujet rouvert, étiqueté `sujet-auto`. Les tickets héritaient `Sujet:` de la spec, et la carte sur `develop` disait encore `4-vague-2` : la mise en `6-nettoyage` était dans #13 elle-même. Un sujet livré s'est rouvert sans décision de personne.

S'y ajoute **le constat (16)** (2026-11-24, 02 h 55 UTC) : `sujet.sh clore` n'a pas pu supprimer `sujet/essai-regime-8` depuis une session cloud (proxy, HTTP 403). La commande le dit déjà (sortie 3, « à jouer d'un poste local ») ; ce qui manque est qu'une personne l'apprenne avant `Phase: fini`.

Le besoin : **un sujet dont la livraison est fusionnée et la branche supprimée est livré, quelle que soit la phase de sa carte.** Un ticket ajouté ensuite part de `develop` (`hors-sujet`), comme la règle de `demarrer` le prévoit déjà ; aucun automatisme ne rouvre le sujet ; la carte n'a plus à passer en `6-nettoyage` avant la fin. Et une branche que `clore` laisse est dite à qui la supprimera.

## La cause, à la source

Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

1. `skills/chaine/sujet/scripts/sujet.sh:285-291` : « Un sujet livré ne se rouvre jamais par automatisme : file.sh, regrouper et demarrer s'en remettent à cette seule fonction. » `sujet_livre` (`:292-305`) cherche la carte du sujet sur `origin/develop`. Trouvée, seule sa phase décide (`:298-299`, `6-nettoyage` ou `fini`) et la fonction rend 1 sinon (`:301`). La seconde preuve, la branche absente d'origin et la fusion de livraison dans `develop` (`:302-304`), ne joue que **sans carte**.
2. La carte vit sur le sujet jusqu'à la livraison (`phase_carte`, `:307-310`) : elle entre dans `develop` avec la livraison, dans la phase où elle était (`4-vague-2` sur l'essai). La passer en `6-nettoyage` demande ensuite une PR de documentation vers `develop` (`chantier/SKILL.md:124`). Entre les deux, le sujet est « non livré ».
3. Ce que lit cette réponse : `demarrer` (`sujet.sh:476-483`, la PR vise develop, `hors-sujet`, si livré ; sinon `ouvrir` le recrée, `:485`) ; `file.sh:140-146` (livré : 4e colonne, `hors-sujet` posé par la boucle, `boucle.sh:433` ; sinon « vers sujet/<nom> », et la boucle joue `regrouper`, `boucle.sh:454-462`) ; `regrouper` (`sujet.sh:1355`, refus si livré ; sinon `ouvrir` puis `sujet-auto`, `:1356`, `:1367`) ; `etat` (`:1453`) ; `clore` (`:1608`).
4. `series_a_regrouper` (`sujet.sh:1383-1403`) prend pour une série « spec X » le sujet qui a déjà reçu une PR de cette spec (`existants`, `:1408-1412`, PR ouvertes **ou fermées**), livré ou non. Une fois `sujet_livre` juste, `regrouper` refuse ce sujet en sortie 4 (`:1355`), et `sortir` termine `regrouper-series` tout entier (`:143`) : les séries suivantes ne seraient plus regroupées, à chaque tour.
5. `clore` (`sujet.sh:1636`) : une suppression refusée sort en 3, « hook pre-push, protection de branche ou proxy : sortie ci-dessus. Si c'est le distant, à jouer d'un poste local ». La sortie du push est dans `SORTIE_JOUEE` (`github.sh:109`). `chantier/SKILL.md:124` dit de la jouer alors d'un poste local, puis de passer la carte en `Phase: fini`, sans dire à qui la branche restante est nommée.

## Décisions

Décidées le 2026-11-27 par l'architecte : **`A-246`** et **`A-247`** (il les versera à la spec `relecture-independante.spec.md`). Ce qui suit les applique ; rien n'y est à trancher.

1. **`A-246` — `sujet_livre <nom>` rend 0 aussi quand la carte existe dans une autre phase**, si `sujet/<nom>` est absent d'origin et que `develop` porte la fusion de livraison du sujet (la ligne `Sujet: sujet/<nom>` d'un commit de merge, ou le message par défaut de GitHub : la recherche de `:302-304`, inchangée). La carte en `6-nettoyage` ou `fini` suffit toujours, comme aujourd'hui. Une livraison intermédiaire laisse la branche : le sujet n'est pas livré, comme aujourd'hui.
2. **`clore` ne change pas de règle** : il ne joue que sur une branche présente (`:1594-1595`), où la condition neuve ne s'applique pas ; il exige toujours la carte en `6-nettoyage` ou `fini`.
3. **`regrouper-series` saute une série dont le sujet choisi est livré** : `series_a_regrouper` n'écrit pas la ligne, et `regrouper-series --dry-run` dit `série « <clé> » : sujet/<nom> livré, PR laissées vers develop (hors-sujet)`. `regrouper` garde son refus (sortie 4) pour l'appel à la main.
4. **La place d'un ticket d'après la livraison** est celle que `demarrer` donne déjà (`:476-483`) : il part de `develop`, sa PR vise `develop`, la boucle lui pose `hors-sujet`. La carte garde sa phase pendant la vague (`4-vague-<k>`), et ne passe en `6-nettoyage` qu'à la fin (`chantier/SKILL.md:124`). Rouvrir un sujet livré reste un geste écrit : `sujet.sh ouvrir <nom>` (le sujet rouvert a une branche, et la carte qui n'est pas en `6-nettoyage` ou `fini` le dit vivant), jamais un automatisme.
5. **`A-247` — Ce que `clore` laisse se dit** : la sortie 3 de `clore` nomme la cause qu'elle lit dans la sortie du push (`SORTIE_JOUEE`) : « refusée par le proxy de la session (HTTP 403) » quand `403` y est, sinon la phrase d'aujourd'hui ; la consigne « à jouer d'un poste local : `git push origin :refs/heads/sujet/<nom>` » reste. `chantier/SKILL.md:124` : les branches que le conducteur n'a pas pu supprimer sont écrites dans la carte, dans la PR de documentation qui passe en `Phase: fini`, à la ligne `Branches à supprimer d'un poste local :`, et nommées dans sa ligne de fin à l'architecte (au produit sans programme).
6. **Les textes** : `sujet/SKILL.md` (« Regrouper », 94) dit qu'un sujet livré (branche supprimée, fusion de livraison dans `develop`) ne reçoit plus de PR, quelle que soit sa carte ; « Clore » (96-98), la cause dite ; `chantier/SKILL.md:120` (point 1) dit qu'un ticket ajouté après la livraison part de `develop`, sans changer la phase de la carte ; `sujet/references/CONTENU.md`, la raison d'`A-246` en deux phrases (#13 de l'essai). L'en-tête de `sujet.sh` (`livre`, `clore`, `regrouper-series`) suit.
7. **La version** : la suivante de `main` au moment de livrer, au troisième chiffre, avec 109 dans la même PR ; la note : un sujet livré ne se rouvre plus quand sa carte est en retard ; les projets reposent `sujet.sh` (`sujet poser`).

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/sujet/scripts/sujet.sh:285-305` | `sujet_livre` (décision 1) et son commentaire |
| `skills/chaine/sujet/scripts/sujet.sh:1383-1435` | le saut d'une série au sujet livré (décision 3) |
| `skills/chaine/sujet/scripts/sujet.sh:1636` | la cause dite (décision 5) |
| `skills/chaine/sujet/scripts/sujet.sh:3-110` | l'en-tête : `clore`, `regrouper-series`, `livre` |
| `skills/chaine/fusionner/scripts/file.sh:140-146`, `boucle.sh:433` | **rien** : ils lisent `sujet.sh livre` |
| `skills/chaine/sujet/SKILL.md:94`, `:96-98`, `references/CONTENU.md` | décision 6 |
| `skills/chaine/chantier/SKILL.md:120`, `:124` | décisions 4 à 6 |
| `skills/chaine/sujet/scripts/sujet.test.mjs` | les tests neufs, après `:546` ; **`:893` ne change pas** (carte multiple en phase 4, aucune branche ni fusion de livraison : non livré) ; **`:961` ne change pas** (livraison intermédiaire, branche présente : `en cours`) |
| `skills/chaine/sujet/scripts/sujet-clore.test.mjs:193-203` | le test du distant qui refuse : la cause 403 dite (nouvelle assertion) ; « à jouer d'un poste local » gardé |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version, la note |

Modèles à imiter : `sujet.test.mjs:487` (« sans carte, livré par passer.sh puis branche supprimée, demarrer ne le rouvre pas ») et `:468` (« regrouper refuse un sujet livré, sans créer de branche ») ; `sujet-clore.test.mjs:193`.

## À faire, dans l'ordre

1. **Partir de `main`**, la PR de 104, 102 et 100 entrée : une branche neuve depuis `origin/main` ; relire chaque ligne citée.
2. **Les bancs, rouges** (« Surfaces »). Les voir rouges.
3. **`sujet_livre`** (décision 1), puis **`regrouper-series`** (décision 3), puis **`clore`** (décision 5).
4. **Les textes** (décisions 4 à 6). Les bancs verts.
5. Un commit ; **la version** et sa note, dans la PR de 108 et 109.
6. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| carte en `4-vague-2` sur develop, branche absente, fusion de livraison dans develop : `sujet.sh livre` rend 0 ; `demarrer` d'un ticket du sujet donne `base=develop`, aucune branche créée | `sujet.test.mjs`, test neuf |
| même carte, **branche présente** (livraison intermédiaire) : rend 1, comme aujourd'hui | test neuf |
| même carte, branche absente, **aucune fusion de livraison** : rend 1 | test neuf |
| `file.sh` sur ce sujet : la 4e colonne « sujet livré » pour une PR vers develop du ticket ; jamais « vers sujet/<nom> » | test neuf (le faux GitHub de `faux-gh.mjs`) |
| `regrouper` à la main : refus 4, aucune branche ; `regrouper-series` : la série sautée, la série suivante (un autre sujet) regroupée au même appel | test neuf |
| `clore`, push refusé avec `403` dans sa sortie : sortie 3, « proxy » et « à jouer d'un poste local » dits, branche intacte | `sujet-clore.test.mjs:193`, assertion neuve |
| `chantier/SKILL.md` : la ligne `Branches à supprimer d'un poste local :` au § 7.4 ; le ticket d'après la livraison au § 7.1 | test de texte neuf, dans `sujet.test.mjs` (le texte des skills se lit depuis l'arbre du plugin) |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| la condition neuve retirée (la phase seule décide) | le test de la carte en `4-vague-2` |
| la condition neuve sans l'absence de la branche | le test de la livraison intermédiaire |
| la condition neuve sans la fusion de livraison | le test « aucune fusion » |
| `series_a_regrouper` qui écrit la série au sujet livré | le test de `regrouper-series` |
| la cause 403 retirée de `clore` | l'assertion neuve de `sujet-clore.test.mjs` |

## Vérification

1. Les bancs ciblés : `node --test skills/chaine/sujet/scripts/sujet.test.mjs skills/chaine/sujet/scripts/sujet-clore.test.mjs skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs`, rouges à l'étape 2, verts après.
2. Les mutations : toutes rouges.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass`, recopié dans la PR.

## Ce qui n'a pas été établi

- Si la livraison #11 de l'essai est partie de `sujet/essai-regime-8` ou d'une branche jetable `livraison/…`. Le journal dit le second parent « sommet du sujet », et que `regrouper` a dû recréer la branche : elle était donc absente. La décision 1 couvre ce cas ; une livraison intermédiaire, branche gardée, reste un sujet vivant, comme aujourd'hui.
- Un dépôt sans le réglage « Automatically delete head branches » garde la branche après une livraison complète : la condition neuve n'y joue pas, et la carte en `6-nettoyage` reste la seule preuve. Le réglage est sur la liste de l'admin (`socle-chaine-de-production`).

## Hors périmètre

- Un sujet « de suite » déclaré pour les tickets d'après la livraison (`Sujet: sujet/<nom>-suite`) : possible aujourd'hui par la spec ou le ticket, non prescrit ici (question au produit dans le rapport de l'architecte).
- Les PR de fourche vers develop qui déclarent un sujet (`regrouper` sur une fourche) : un autre ticket.
