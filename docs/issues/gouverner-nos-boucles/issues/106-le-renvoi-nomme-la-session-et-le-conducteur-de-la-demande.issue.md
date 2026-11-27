# Le renvoi nomme la session et le conducteur de la demande `À relire` : le capitaine prévient l'auteur sans chercher un worktree

Status: ready-for-agent
Type: défaut
Modèle: sonnet — une lecture de plus dans `renvoyer.sh` (les commentaires de la PR, lus par `lireMarques` de `decision-relecteur.mjs`, en mode tolérant), deux lignes de sortie, la section « Renvoyer une PR » du skill et ses bancs ; la règle est fixée par les décisions `A-244`, `A-256` (3) et (5), `A-227` et `A-236`. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 96, 101, 105 commité sur la branche
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/renvoyer.sh` (en-tête 2-8 ; le régime 20-35 ; la sortie 64-67) ; `skills/chaine/fusionner/scripts/github.sh` (une fonction neuve, `demande_de_la_pr`, après `pr_json`, 464) ; `skills/chaine/fusionner/SKILL.md` (« Sur un `RENVOI`, le capitaine prévient la session », 104 ; « Renvoyer une PR », 112-115 ; « Fin de passage », 119) et `references/CONTENU.md` (43) ; `skills/chaine/fusionner/scripts/messages-du-regime.test.mjs` (après 46 et 134) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Même PR que 105, en second** (`A-256` (5)) : 105 touche `SKILL.md:27-29` et `:88`, `boucle.sh`, `passer.sh`, `veille.sh` ; d'où « 105 commité sur la branche ». Le ticket 96 change `lireMarques` (les demandes modifiées) et le ticket 101 touche `github.sh:448-452` (`DEMANDE_DE_RELECTURE`) et `messages-du-regime.test.mjs` (14-25, 48, 76, 97) : ils passent d'abord (101 l'annonce dans son en-tête). Le ticket 107, dans la PR suivante, touche `github.sh` (le verrou du passage, 652-833) et `SKILL.md:97-104`, `:138`. Numéros de ligne lus sur `origin/main` à `3daedcd` (plugin 8.5.0), avant 94 à 105 : relire chaque ligne citée sur la branche.

## Le besoin

Constat (4) de l'essai réel du régime 8 (journal de la carte, 2026-11-23, 19 h 02 UTC ; entrée « Fin de l'essai réel du régime 8 »). Au renvoi de la PR #10 du jouet (18:35), `renvoyer.sh` n'a prévenu personne : « worktree propriétaire » vide. Le propriétaire d'une PR se cherche dans un worktree local du capitaine, qui n'existe pas en session cloud : chaque session travaille dans son propre conteneur. Or la demande `À relire` de la PR nomme sa session (`Session:`) et son conducteur (`Conducteur:`). La fille n'a su le renvoi que par le relais du conducteur.

Le besoin : **en régime 8, le renvoi nomme les deux sessions de la dernière demande `À relire` intacte de la PR**, et le capitaine les prévient. Le worktree local reste le chemin du régime 7, qui ne change pas.

## La cause, à la source

Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

1. `skills/chaine/fusionner/scripts/renvoyer.sh:64-67` : la sortie donne `[#n] worktree propriétaire : …`, calculé par `proprietaire.sh` sur la branche de la PR.
2. `skills/chaine/fusionner/scripts/proprietaire.sh:12` : `git worktree list` du clone du capitaine, puis le reflog de chaque worktree. En session cloud, le capitaine n'a que son propre worktree (`SKILL.md:63`) : la liste ne donne aucune session.
3. `skills/chaine/fusionner/SKILL.md:115` : « `list_sessions` donne la session dont le `cwd` est ce worktree, puis `send_message` ». Sans worktree, aucune session n'est trouvée ; « si aucune session n'est ouverte, le noter pour le compte rendu ».
4. La forme de la demande est fixée et lue ailleurs : `decision-relecteur.mjs:51` (`FORME_DEMANDE`), `:112` (la marque `demandes`, `auteur` et `conducteur`, `null` pour `—`), `lireMarques` (`:140`), qui lève `LectureIllisible` sur une marque presque à la forme, sauf avec `{ tolerant: true }` (`:124`, `:137`, `:184`). Le Relecteur la lit déjà pour ses propres lignes (`:383`). `renvoyer.sh` connaît le régime de la PR (`:20-35`), sans lire ses commentaires.

## Décisions

Décidées le 2026-11-27 par l'architecte : **`A-244`**, **`A-256` (3) et (5)**, **`A-227`** et **`A-236`** (spec `relecture-independante.spec.md`). Ce qui suit les applique ; rien n'y est à trancher.

1. **`A-244` — En régime 8, `renvoyer.sh` lit les commentaires de la PR** (`lire_github`, toutes pages) **et en tire la dernière demande intacte** par `lireMarques(commentaires, { tolerant: true })` de `decision-relecteur.mjs`, la fonction du Relecteur, jamais par une expression de plus. Sa sortie remplace la ligne du worktree par deux lignes : `[#n] session de la demande : <id ou —>` et `[#n] conducteur de la demande : <id ou —>`.
2. **La lecture vit dans `github.sh`** : `demande_de_la_pr <n>` écrit les deux champs sur une ligne (`<session> <conducteur>`, `—` pour l'absent), par `node --input-type=module` comme `regime_de_la_pr` (`github.sh:457-460`). Sorties : 0 lue ; 1 aucune demande intacte ; 5 commentaires illisibles (GitHub) ; 21 `LectureIllisible` levée par `lireMarques` malgré `tolerant` (commentaires que `retenir` ne lit pas).
3. **Sans demande lisible, le renvoi va au lanceur** (`A-256` (3)). Sur 1 : les deux lignes valent `—`, et une troisième dit `[#n] aucune demande À relire intacte sur la PR : prévenir le conducteur du chantier, sinon son lanceur`. Sur 5 ou 21 : une seule ligne, `[#n] demande illisible (<cause>) : prévenir le conducteur du chantier, sinon son lanceur`. Dans tous les cas, le renvoi lui-même (labels, commentaire) est déjà posé et ne change pas.
4. **`A-227` vaut ici** : une demande modifiée après sa création ne compte pas, et ses champs ne nomment personne pour un renvoi (`lireMarques` ne la met pas dans `demandes`).
5. **Le régime 7 ne change pas** : sans la clé `relecture` (`renvoyer.sh:24-28`), ou PR en régime 7, la ligne du worktree reste, calculée comme aujourd'hui, aucune ligne « demande » n'est écrite et aucun commentaire n'est lu de plus.
6. **Le geste du capitaine** (`SKILL.md:112-115`) : sur un `RENVOI` en régime 8, lire l'état de chaque session nommée (`get_session`) avant de lui écrire (`A-236`) ; vivante, `send_message` avec la cause ; archivée ou introuvable, ne pas lui écrire, et le dire au conducteur nommé ; aucune des deux vivante, ou une ligne « aucune demande » ou « demande illisible », le noter pour le compte rendu et le dire à son lanceur. En régime 7, le texte d'aujourd'hui (le worktree, puis `list_sessions`).
7. **Les textes** : `SKILL.md:104` (« Sur un `RENVOI`, le capitaine prévient la session ») renvoie à « Renvoyer une PR » ; `:119` (« Fin de passage ») dit « la session prévenue, ou personne, et pourquoi » ; `references/CONTENU.md:43`, la raison en deux phrases (le cas de #10, la demande qui nomme déjà les deux sessions).
8. **La version** : celle de la PR de 105 et 106 ; la note dit que le renvoi nomme les sessions de la demande en régime 8.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/renvoyer.sh:2-8` | l'en-tête : les lignes de la demande, le régime 7 inchangé |
| `skills/chaine/fusionner/scripts/renvoyer.sh:64-67` | la sortie (décisions 1 à 5) ; `branche` n'est plus lue en régime 8 |
| `skills/chaine/fusionner/scripts/github.sh`, après `:464` | `demande_de_la_pr` (décision 2) |
| `skills/chaine/fusionner/scripts/proprietaire.sh` | **rien** : il sert le régime 7 |
| `skills/chaine/fusionner/scripts/decision-relecteur.mjs` | **rien** : `lireMarques` est lue telle que 96 l'a laissée |
| `skills/chaine/fusionner/SKILL.md:104`, `:112-115`, `:119` | décisions 6 et 7 |
| `skills/chaine/fusionner/references/CONTENU.md:43` | la raison |
| `skills/chaine/fusionner/scripts/messages-du-regime.test.mjs` | les tests neufs, après `:46` et `:134` ; `:46`, `:69` et `:134` inchangés (ils ne lisent que le commentaire de renvoi) |
| `skills/chaine/fusionner/scripts/fusionner.test.mjs:306` | **inchangé** ; il ne prouve rien de la ligne du worktree (son jouet est sans clé et n'en vérifie que la cause et les labels) : le régime 7 se prouve par le banc neuf |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la note |

Modèle à imiter : `messages-du-regime.test.mjs:46` (renvoi en régime 8 et en régime 7 sur le même jouet) ; `regime_de_la_pr` (`github.sh:457-460`) pour l'appel de `node` ; les `pannes` de `faux-gh.mjs` (`:54-58`, `route`, `fois`) pour une route en panne.

## À faire, dans l'ordre

1. **Partir de la branche de la PR**, 105 commité : relire chaque ligne citée (96 et 101 entrés).
2. **Les bancs, rouges** (« Surfaces »). Les voir rouges.
3. **`demande_de_la_pr`**, puis **`renvoyer.sh`** (décisions 1 à 5).
4. **Les textes** (décisions 6 et 7). Les bancs verts.
5. Un commit ; la version de la PR, sa note complétée.
6. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| régime 8 : deux demandes intactes, la seconde fait foi : les deux lignes nomment sa session et son conducteur ; plus de ligne « worktree propriétaire » | `messages-du-regime.test.mjs`, test neuf |
| régime 8 : la seule demande est modifiée (`updated_at` ≠ `created_at`) : `—` et `—`, et la ligne « aucune demande À relire intacte » | test neuf |
| régime 8 : une marque presque à la forme parmi les commentaires (`À relire — …` mal formée) et une demande intacte : la demande intacte est nommée (mode tolérant) | test neuf |
| régime 8 : `Conducteur: —` : la ligne du conducteur dit `—` | test neuf |
| régime 8 : la route `issues/<n>/comments` en panne (`pannes`, `fois` ≥ 2) : renvoi posé (labels, commentaire), ligne « demande illisible » | test neuf |
| régime 7 : la même panne (`fois` ≥ 2) : la ligne du worktree, aucune ligne « demande » (aucune lecture des commentaires) | test neuf |
| le skill : « Renvoyer une PR » nomme `get_session` avant `send_message`, et le conducteur quand la session est archivée | test neuf (texte) |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| la première demande retenue au lieu de la dernière | le test des deux demandes |
| une demande modifiée comptée | le test de la demande modifiée |
| `lireMarques` sans `tolerant` | le test de la marque presque à la forme |
| les commentaires lus en régime 7 | le test du régime 7 (la ligne « demande illisible » y paraît) |
| la ligne du worktree gardée en régime 8 | le test des deux demandes |
| `get_session` retiré de « Renvoyer une PR » | le test de texte |

## Vérification

1. Les bancs ciblés : `node --test skills/chaine/fusionner/scripts/messages-du-regime.test.mjs skills/chaine/fusionner/scripts/fusionner.test.mjs skills/chaine/fusionner/scripts/decision-relecteur.test.mjs`, rouges à l'étape 2, verts après.
2. Les mutations : toutes rouges.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass`, recopié dans la PR.

## Ce qui n'a pas été établi

- Que la boucle, lancée par la veille en tâche de fond, rende ses lignes au capitaine assez tôt. Le capitaine suit son journal par un `Monitor` sur `RENVOI` (`SKILL.md:104`) ; les lignes de la demande suivent la ligne `RENVOI`. Non joué en session cloud.
- La forme exacte de `lireMarques` après le ticket 96 (une liste de plus pour les demandes modifiées). Le ticket n'en lit que `demandes`, les demandes intactes.

## Hors périmètre

- La fabrication de la demande (ticket 101) et ce que dit l'écart d'une demande modifiée (ticket 96).
- `proprietaire.sh` en régime 7.
