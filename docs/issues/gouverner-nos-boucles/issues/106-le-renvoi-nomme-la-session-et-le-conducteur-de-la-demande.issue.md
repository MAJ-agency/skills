# Le renvoi nomme la session et le conducteur de la demande `À relire` : le capitaine prévient l'auteur sans chercher un worktree

Status: needs-triage
Type: défaut
Modèle: sonnet — une lecture de plus dans `renvoyer.sh` (les commentaires de la PR, lus par `lireMarques` de `decision-relecteur.mjs`), deux lignes de sortie, la section « Renvoyer une PR » du skill et ses bancs ; la règle est fixée par les décisions `A-244`, `A-227` et `A-236`. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 96, 101, 105
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/renvoyer.sh` (en-tête 2-8 ; le régime 20-35 ; la sortie 64-67) ; `skills/chaine/fusionner/scripts/github.sh` (une fonction neuve après `pr_json`, 464, si la lecture y vit ; décision 2) ; `skills/chaine/fusionner/SKILL.md` (« Renvoyer une PR », 112-115 ; « Sur un `RENVOI`, le capitaine prévient la session », 104 ; « Fin de passage », 119) et `references/CONTENU.md` (43) ; `skills/chaine/fusionner/scripts/messages-du-regime.test.mjs` (après 46 et 134) et `fusionner.test.mjs` (306) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Même PR que 105 et 107, en deuxième** : 105 touche `SKILL.md:27-29` et `:88`, 107 `github.sh` (le verrou du passage, 744-833) et `CONTENU.md`. Le ticket 96 change `lireMarques` (les demandes modifiées) et le ticket 101 touche `github.sh:448-452` (`DEMANDE_DE_RELECTURE`) et `messages-du-regime.test.mjs` (14-25, 48, 76, 97) : ils passent d'abord, d'où `Blocked by: 96, 101` (101 l'annonce dans son en-tête). Numéros de ligne lus sur `origin/main` à `3daedcd` (plugin 8.5.0), avant 94 à 104 : relire chaque ligne citée sur la branche.

## Le besoin

Constat (4) de l'essai réel du régime 8 (journal de la carte, 2026-11-23, 19 h 02 UTC ; entrée « Fin de l'essai réel du régime 8 »). Au renvoi de la PR #10 du jouet (18:35), `renvoyer.sh` n'a prévenu personne : « worktree propriétaire » vide. Le propriétaire d'une PR se cherche dans un worktree local du capitaine, et ce worktree n'existe pas en session cloud : chaque session travaille dans son propre conteneur. Or la demande `À relire` de la PR nomme sa session (`Session:`) et son conducteur (`Conducteur:`). La fille n'a su le renvoi que par le relais du conducteur.

Le besoin : **en régime 8, le renvoi nomme les deux sessions de la dernière demande `À relire` intacte de la PR**, et le capitaine les prévient. Le worktree local reste le chemin du régime 7, qui ne change pas.

## La cause, à la source

Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

1. `skills/chaine/fusionner/scripts/renvoyer.sh:64-67` : la sortie donne `[#n] worktree propriétaire : …`, calculé par `proprietaire.sh` sur la branche de la PR.
2. `skills/chaine/fusionner/scripts/proprietaire.sh:12-19` : `git worktree list` du clone du capitaine, puis le reflog de chaque worktree. En session cloud, le capitaine n'a que son propre worktree (`SKILL.md:63`) : la liste est vide.
3. `skills/chaine/fusionner/SKILL.md:115` : « `list_sessions` donne la session dont le `cwd` est ce worktree, puis `send_message` ». Sans worktree, aucune session n'est trouvée ; « si aucune session n'est ouverte, le noter pour le compte rendu ».
4. La forme de la demande est fixée et lue ailleurs : `decision-relecteur.mjs:51` (`FORME_DEMANDE`, `Session: <id ou —> — Conducteur: <id ou —>`), `:112` (la marque `demandes`, `auteur` et `conducteur`, `null` pour `—`), `lireMarques` (`:140`). Le Relecteur la lit déjà pour ses propres lignes (`decision-relecteur.mjs:383`). `renvoyer.sh` connaît déjà le régime de la PR (`:20-35`), sans lire ses commentaires.

## Décisions

Décidées le 2026-11-27 par l'architecte : **`A-244`** (il la versera à la spec `relecture-independante.spec.md`), avec **`A-227`** et **`A-236`**, déjà écrites. Ce qui suit les applique ; rien n'y est à trancher.

1. **`A-244` — En régime 8, `renvoyer.sh` lit les commentaires de la PR** (`lire_github`, toutes pages) **et en tire la dernière demande intacte** par `lireMarques` de `decision-relecteur.mjs`, la même fonction que le Relecteur, jamais par une expression de plus. Sa sortie remplace la ligne du worktree par deux lignes : `[#n] session de la demande : <id ou —>` et `[#n] conducteur de la demande : <id ou —>`.
2. **Où vit la lecture** : une fonction de `github.sh`, `demande_de_la_pr <n>`, qui écrit les deux champs sur une ligne (`<session> <conducteur>`, `—` pour l'absent), par `node --input-type=module` comme `regime_de_la_pr` (`github.sh:457-460`). Commentaires illisibles : la fonction sort en 5, et `renvoyer.sh` écrit `[#n] demande illisible (GitHub) : prévenir le conducteur du chantier, sinon son lanceur`, sans changer le renvoi lui-même (labels et commentaire déjà posés).
3. **`A-227` vaut ici** : une demande modifiée après sa création ne compte pas. Ses champs ne nomment personne pour un renvoi. Sans demande intacte, les deux lignes valent `—`, et une troisième dit `[#n] aucune demande À relire intacte sur la PR : prévenir le conducteur du chantier, sinon son lanceur`.
4. **Le régime 7 ne change pas** : sans la clé `relecture` (`renvoyer.sh:24-28`), ou PR en régime 7, la ligne du worktree reste, calculée comme aujourd'hui, et aucun commentaire n'est lu de plus.
5. **Le geste du capitaine** (`SKILL.md:112-115`) : sur un `RENVOI`, lire l'état de chaque session nommée (`get_session`) avant de lui écrire (`A-236`) ; vivante, `send_message` avec la cause ; archivée ou introuvable, ne pas lui écrire, et le dire au conducteur nommé ; aucune des deux vivante, le noter pour le compte rendu et le dire au lanceur. En régime 7, le texte d'aujourd'hui (le worktree, puis `list_sessions`).
6. **Les textes** : `SKILL.md:104` (« Sur un `RENVOI`, le capitaine prévient la session ») renvoie à « Renvoyer une PR » ; `:119` (« Fin de passage ») dit « la session prévenue, ou personne, et pourquoi » ; `references/CONTENU.md:43`, la raison en deux phrases (le cas de #10, la demande qui nomme déjà les deux sessions).
7. **La version** : celle de la PR de 105 à 107 ; la note dit que le renvoi nomme les sessions de la demande en régime 8, et que les projets reposent les scripts de la chaîne.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/renvoyer.sh:2-8` | l'en-tête : les deux lignes, le régime 7 inchangé |
| `skills/chaine/fusionner/scripts/renvoyer.sh:64-67` | la sortie (décisions 1 à 4) ; `branche` n'est plus lue en régime 8 |
| `skills/chaine/fusionner/scripts/github.sh`, après `:464` | `demande_de_la_pr` (décision 2) |
| `skills/chaine/fusionner/scripts/proprietaire.sh` | **rien** : il sert le régime 7 |
| `skills/chaine/fusionner/scripts/decision-relecteur.mjs` | **rien** : `lireMarques` est lue telle que 96 l'a laissée |
| `skills/chaine/fusionner/SKILL.md:104`, `:112-115`, `:119` | décisions 5 et 6 |
| `skills/chaine/fusionner/references/CONTENU.md:43` | la raison |
| `skills/chaine/fusionner/scripts/messages-du-regime.test.mjs` | les tests neufs, après `:46` et `:134` |
| `skills/chaine/fusionner/scripts/fusionner.test.mjs:306` | **inchangé** : le jouet est sans clé, la ligne du worktree reste |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version, la note |

Modèle à imiter : `messages-du-regime.test.mjs:46` (renvoi en régime 8 et en régime 7 sur le même jouet) ; `regime_de_la_pr` (`github.sh:457-460`) pour l'appel de `node`.

## À faire, dans l'ordre

1. **Partir de la branche de la PR**, 105 commité : relire chaque ligne citée (96 et 101 entrés).
2. **Les bancs, rouges** (« Surfaces »). Les voir rouges.
3. **`demande_de_la_pr`**, puis **`renvoyer.sh`** (décisions 1 à 4).
4. **Les textes** (décisions 5 et 6). Les bancs verts.
5. Un commit ; la version est celle de la PR.
6. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| régime 8 : deux demandes intactes, la seconde fait foi : les deux lignes nomment sa session et son conducteur ; plus de ligne « worktree propriétaire » | `messages-du-regime.test.mjs`, test neuf |
| régime 8 : la seule demande est modifiée (`updated_at` ≠ `created_at`) : `—` et `—`, et la ligne « aucune demande À relire intacte » | test neuf |
| régime 8 : `Conducteur: —` : la ligne du conducteur dit `—` | test neuf |
| régime 8 : commentaires illisibles (le faux GitHub rend une erreur) : renvoi posé (labels, commentaire), ligne « demande illisible » | test neuf |
| régime 7 : la ligne du worktree, aucune lecture de `issues/<n>/comments` | test neuf ; `fusionner.test.mjs:306` inchangé et vert |
| le skill : « Renvoyer une PR » nomme `get_session` avant `send_message`, et le conducteur quand la session est archivée | test neuf (texte) |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| la première demande retenue au lieu de la dernière | le test des deux demandes |
| une demande modifiée comptée | le test de la demande modifiée |
| les commentaires lus en régime 7 | le test du régime 7 |
| la ligne du worktree gardée en régime 8 | le test des deux demandes |
| `get_session` retiré de « Renvoyer une PR » | le test de texte |

## Vérification

1. Les bancs ciblés : `node --test skills/chaine/fusionner/scripts/messages-du-regime.test.mjs skills/chaine/fusionner/scripts/fusionner.test.mjs`, rouges à l'étape 2, verts après.
2. Les mutations : toutes rouges.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass`, recopié dans la PR.

## Ce qui n'a pas été établi

- Que la boucle, lancée par la veille en tâche de fond, rende ses deux lignes au capitaine assez tôt. Le capitaine suit son journal par un `Monitor` sur `RENVOI` (`SKILL.md:104`) ; les deux lignes suivent immédiatement la ligne `RENVOI`. Cela n'a pas été joué en session cloud.
- La forme exacte de `lireMarques` après le ticket 96 (une liste de plus pour les demandes modifiées). Le ticket n'en lit que `demandes`, les demandes intactes.

## Hors périmètre

- La fabrication de la demande (ticket 101) et ce que dit l'écart d'une demande modifiée (ticket 96).
- `proprietaire.sh` en régime 7.
