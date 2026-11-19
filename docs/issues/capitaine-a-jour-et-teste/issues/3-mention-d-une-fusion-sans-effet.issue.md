# La mention d'une fusion sans effet : une clé de contrat `fusionsSansEffet`, que le capitaine écrit dans ses commits de fusion

Status: Fait — PR #131
Type: défaut
Modèle: opus — une fonction partagée qui juge un diff contre une expression lue dans le contrat, branchée sur les fusions jouées par les scripts du capitaine (quatre au départ du ticket, trois sur `main` à la livraison : `## Comments`) sans changer leur chemin (hooks, conflits, avance rapide), et une décision à tenir contre la lettre de la spec (Décision 3).
Blocked by: 1 (`passer.sh`, `sujet.sh` et `github.sh` sont des fichiers chauds du ticket 1, qui restructure leurs fusions en boucle : partir de `main` après sa fusion)
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/fusionner/scripts/github.test.mjs`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, `skills/chaine/socle-chaine-de-production/references/chaine.json`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../capitaine-a-jour-et-teste.spec.md`](../capitaine-a-jour-et-teste.spec.md), lot 3 (décision `A-8`, défaut 2). Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`A-17`, `A-18`). Ticket 1 : [`1-regle-d-ascendance-avant-chaque-fusion.issue.md`](1-regle-d-ascendance-avant-chaque-fusion.issue.md). Base : `origin/main` après la fusion du ticket 1 (plugin **7.16.0** visé par lui ; `4a45634` en 7.15.0, **738 tests**, avant lui). Faits relus à la source sur `4a45634` le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Le défaut vécu sur `fedora`** (défaut 2 de la demande). `develop` reçoit un commentaire dans `schema.prisma`, par une PR dont le commit porte `[sans-migration: <raison>]`. Le hook `commit-msg` du projet exige, sur tout commit qui touche `schema.prisma`, une migration ou cette mention. Quand le capitaine fusionne ensuite `develop` dans une PR (ou dans un sujet, ou un sujet dans une sous-PR), son commit de fusion touche `schema.prisma` et porte le message par défaut de git : le hook le refuse, la mise à jour sort en 3, et la PR reste bloquée. Le hook appartient au projet ; le plugin ne connaît ni Prisma ni la mention.

**Quand le ticket est fait** :

1. Le contrat `.claude/chaine.json` porte une clé facultative `fusionsSansEffet`, une liste d'entrées `{ "fichier", "lignesSansEffet", "mention" }`. Le gabarit la laisse vide.
2. Avant chaque fusion qu'un script du capitaine joue, le script calcule ce que la fusion apporte à chaque `fichier` de la liste (diff entre le sommet de la branche avant la fusion et le résultat). Si chaque ligne ajoutée ou retirée correspond à `lignesSansEffet`, il ajoute `mention` au message du commit de fusion.
3. Sinon, il n'ajoute rien et dit quel fichier porte un changement réel ; les hooks du projet jugent le commit comme aujourd'hui (Décision 3).
4. La note de version donne l'entrée de `schema.prisma` d'un projet Prisma.

## Où

`fus/` abrège `skills/chaine/fusionner/scripts/`, `suj/` abrège `skills/chaine/sujet/scripts/`, `socle/` abrège `skills/chaine/socle-chaine-de-production/references/`. Lignes relues sur `4a45634` ; le ticket 1 déplace `passer.sh` et `sujet.sh` : retrouver chaque fusion par son motif `git merge -q --no-edit`.

**Les quatre fusions jouées par un script** (`grep -n 'git merge -q --no-edit'`, sur `4a45634` puis sur la PR 115 du ticket 1, `2fdeb77`), et les commits qui concluent une fusion en conflit ; l'avance rapide d'`avancer_sujet` n'en est pas une :

| Fichier | Lignes (`4a45634` ; PR 115) | Fusion | Après le ticket 1 |
| --- | --- | --- | --- |
| `fus/passer.sh` | 202 ; PR 115 : 220 ; commit 253-264 (`git commit -q --no-edit`, l. 254) | `origin/develop` dans `capitaine/<n>` (tête de la PR) | dans la boucle de trois tours (sa Décision 2), même commande |
| `suj/sujet.sh` | 501 ; PR 115 : 518 ; commit 528 | `origin/<sujet>` dans `capitaine/<n>` (`mettre_a_jour_sous_pr`) | même commande ; une fusion propre régénère, committe et pousse (sa Décision 4) |
| `suj/sujet.sh` | 797 ; PR 115 : 866 ; commit 821-822 | `origin/develop` dans `sujet/<nom>` (`rafraichir`) | inchangé |
| `suj/sujet.sh` | 885 ; PR 115 : 954 | `origin/<sujet>` dans la tête d'une sous-PR (`relancer`) | le ticket 2 la remplace par `mettre_a_jour_sous_pr` ; si le ticket 2 n'est pas encore fusionné, la traiter ici aussi |

| Fichier | Lignes | Ce qu'on y fait |
| --- | --- | --- |
| `fus/github.sh` | après `ascendance` (ticket 1), près de `index_generes_regex` (l. 122-125) | `mentions_de_fusion <réf>` et `fusionner_avec <réf>` (Décision 1). |
| `fus/github.sh` | 1-9 (en-tête) | Rien : les fonctions se documentent en commentaire au-dessus d'elles, comme `regenerer_index` (l. 73-76). |
| `fus/github.test.mjs` | modèle : les tests qui sourcent `github.sh` sur le dépôt jouet (l. 1-37), comme ceux d'`ascendance` (ticket 1) | Les verdicts de `mentions_de_fusion`. |
| `fus/passer.sh` | 202 | `git merge -q --no-edit origin/develop` devient `fusionner_avec origin/develop`. Le reste du chemin (refus sans fichier en conflit, l. 204-210 ; conflits, l. 211-247 ; commit, l. 253-264) ne change pas : en conflit, le message passé par `-m` est déjà dans `MERGE_MSG`, que `git commit -q --no-edit` (l. 254) reprend. |
| `fus/passer.sh` | 25-26 (en-tête) | Une phrase : les fusions du capitaine portent la mention de `fusionsSansEffet` quand elle s'applique (skill `fusionner`). |
| `suj/sujet.sh` | 501, 797, (885) ; PR 115 : 518, 866, (954) | Même remplacement. |
| `suj/sujet.sh` | 83-96 (en-tête, sorties) | Rien : aucune sortie nouvelle. |
| `socle/chaine.json` | clé nouvelle, `$comment` (l. 2) | `"fusionsSansEffet": []`, et dans le `$comment` : « `fusionsSansEffet` : les fichiers qu'un hook du projet garde (une migration exigée, par exemple), avec l'expression des lignes sans effet (`grep -E`) et la mention que le capitaine écrit dans son commit de fusion quand la fusion ne leur apporte que de telles lignes (skill `fusionner`) ». |
| `socle/CONTENU.md` | 5 (§ « Le contrat ») | « Sept clés » devient « Huit clés » ; la clé, et sa raison : le hook appartient au projet, le plugin ne connaît ni Prisma ni la mention ; une clé générique, vérifiée par diff. |
| `skills/chaine/fusionner/SKILL.md` | après « La règle d'ascendance » (section du ticket 1) | Un paragraphe « **Fusion sans effet** » : la clé, ce que le capitaine en fait, ce qu'il ne fait pas (aucune mention sur un changement réel ; le hook juge). |
| `skills/chaine/fusionner/references/CONTENU.md` | 5 (§ `github.sh`), 51 (§ « Les tests ») | Les deux fonctions ; les bancs. |
| `scripts/depot.test.mjs` | un test, après celui de la l. 213 (gabarit de `.claude/chaine.json`) | Le gabarit porte `fusionsSansEffet` vide, et son `$comment` la nomme. |
| Version | voir « 5. La version et la note » | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md`. |

Appelants réels :

- `passer.sh` : `boucle.sh` (`passer`, l. 332-336), lancée par `veille.sh` ; à la main par le capitaine.
- `mettre_a_jour_sous_pr` : `sujet.sh fusionner` (l. 770, et la boucle du ticket 1), `relancer` après le ticket 2.
- `rafraichir` : `rafraichir_sujets` (`boucle.sh:251`), `sujet.sh fusionner` (l. 767), `regrouper` (l. 951), à la main par un conducteur (`chantier/SKILL.md` § 6.6).
- `mentions_de_fusion` n'est appelée que par `fusionner_avec`.

Règles à lire : l'en-tête de `fus/passer.sh` (l. 1-55) et le § « Le contrat » de `socle/CONTENU.md` (l. 5).

## Décisions

Tenues : `A-8` (une clé de contrat générique, vérifiée par diff ; gabarit vide ; l'entrée Prisma dans la note), `A-16` (une note par version, qui dit ce qu'un projet fait), `A-34` (ce que repose Iroki, dans la note).

1. **Deux fonctions de `github.sh`.**
   - `mentions_de_fusion <réf>` : appelée avant la fusion, la branche à fusionner sur `HEAD`.
     - Le contrat se lit sur `origin/develop` (`git show origin/develop:.claude/chaine.json`), **jamais** dans l'arbre de travail : le worktree du capitaine porte alors la branche d'une PR, et une PR ne s'accorde pas elle-même une mention.
     - L'arbre de la fusion : `git merge-tree --write-tree --no-messages HEAD <réf>`, première ligne (git ≥ 2.38, déjà employé par `passer.sh:125`). En conflit, `merge-tree` sort en 1 mais donne l'arbre : seuls les fichiers en conflit y portent des marqueurs, et un `fichier` de la liste en conflit sera renvoyé de toute façon (conflit hors index).
     - Pour chaque entrée : `git diff --no-textconv --no-ext-diff --no-color -U0 --no-renames HEAD <arbre> -- ":(literal)<fichier>"` (le chemin est lu tel quel : un `*` ou un `:` du contrat ne fait pas un motif), puis les seules lignes qui suivent le premier `@@` (`sed -n '/^@@/,$p'`) et commencent par `+` ou `-`, premier caractère retiré. Un filtre « hors `+++ ` et `--- ` » appliqué à tout le diff écarterait une ligne retirée qui commence par `-- ` ou ajoutée qui commence par `++ ` : l'en-tête se coupe par sa position, jamais par son texte. Aucune ligne : rien. Toutes conformes à `lignesSansEffet`, ligne entière (`grep -xE`) : `mention` sur la sortie standard. Sinon : sur la sortie d'erreur, `fusion sans mention : <fichier> porte un changement réel (lignes hors de lignesSansEffet) ; les hooks du projet jugent le commit`.
     - Entrée mal formée (champ manquant ou non textuel, expression que `grep -E` refuse, `mention` vide, sur plusieurs lignes, qui commence par `Sujet:` ou `Merge pull request`, que `sujet_livre` lit dans les fusions de develop, ou par `#`, qu'un `commit.cleanup=strip` retirerait du message) : aucune mention pour elle, le motif sur la sortie d'erreur. Contrat absent, illisible ou sans la clé : rien, en silence. La fonction sort toujours en 0 : elle n'arrête jamais une fusion, les hooks jugent.
   - `fusionner_avec <réf>` : `git merge -q --no-edit <réf>` quand `mentions_de_fusion` ne rend rien ; sinon `git merge -q --no-edit -m "Merge remote-tracking branch '<réf>' into <branche courante>" -m "<mention 1>" …`, soit le message par défaut de git suivi des mentions (toutes les réfs fusionnées par les scripts sont des `origin/…`). Elle rend le code et les sorties de `git merge`, sans rien en changer.
   - Raisons : une seule lecture du contrat et une seule règle, pour quatre fusions ; le chemin de chaque appelant reste le sien (refus de hook, conflits, avance rapide). Le premier paragraphe reste celui de git, `Merge remote-tracking branch '…'`, que commitlint ignore (`ignores` du gabarit, `socle-monorepo/references/racine/commitlint.config.mjs:35`, qui n'ignore que `Merge pull request`, `Merge branch` et `Merge remote-tracking branch` : un `Merge origin/develop into …` serait refusé). Pas de `git merge --no-commit` suivi d'un `git commit` : sur une fusion propre, il ferait jouer au capitaine le `pre-commit` du projet (lint-staged), que `git merge` ne joue pas aujourd'hui, et le formatage entrerait dans la fusion.
2. **La mention n'est que du texte du commit.** Le capitaine n'écrit rien d'autre, ne crée aucune migration et ne touche à aucun fichier. Une fusion en avance rapide ne crée pas de commit : rien à mentionner.
3. **Un changement réel n'arrête pas le script** (écart avec la lettre d'`A-8`, voir `## Comments`). La fonction le dit sur la sortie d'erreur et n'ajoute aucune mention ; le commit passe sous les hooks du projet, comme aujourd'hui. Un hook qui refuse sort par le chemin existant (sortie 3, sa sortie sur stderr). Raison : un changement réel de `schema.prisma` arrive dans develop avec sa migration, et le commit de fusion porte les deux ; s'arrêter à chaque fois bloquerait toutes les PR après chaque migration.
4. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : le nom des variables, le texte exact du motif d'une entrée mal formée. Elle ne tranche **pas** : la lecture du contrat sur `origin/develop`, l'absence de `--no-commit`, la Décision 3.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`, ticket 1 fusionné. Chaque banc est vu rouge avant le code qui le rend vert.

### 1. Les bancs, chacun vu rouge

`fus/github.test.mjs`, **« mentions_de_fusion : … »**, sur un dépôt jouet dont `origin/develop` porte le contrat avec l'entrée `{ "fichier": "prisma/schema.prisma", "lignesSansEffet": "^[[:space:]]*(//.*)?$", "mention": "[sans-migration: commentaire seul, apporté par une mise à jour]" }` :

- develop n'apporte qu'un commentaire et une ligne vide au fichier : la mention, sortie 0 ;
- develop y apporte un modèle : rien sur la sortie standard, la sortie d'erreur nomme le fichier ;
- develop ne touche pas le fichier : rien, en silence ;
- contrat sans la clé, ou absent : rien, en silence ;
- develop retire du fichier une ligne qui commence par `-- ` ou y ajoute une ligne qui commence par `++ ` (hors de `lignesSansEffet`) : rien sur la sortie standard, la sortie d'erreur nomme le fichier (un filtre d'en-têtes appliqué à tout le diff les aurait écartées et aurait donné la mention) ;
- une ligne qui ne correspond à l'expression qu'en partie (`// x` suivi de code, contre `^[[:space:]]*(//.*)?$` sans ancre) : changement réel (`grep -xE`) ;
- entrée mal formée (expression refusée par `grep -E`, mention sur deux lignes, mention `Sujet: sujet/x`, mention `# x`) : rien, motif sur la sortie d'erreur ;
- un `fichier` qui contient un caractère de motif (`prisma/*.prisma`) : lu comme un chemin littéral, il ne correspond à aucun fichier, rien ;
- un contrat de l'arbre de travail qui porte l'entrée, absent d'`origin/develop` : rien (le contrat de la PR ne compte pas).

**Rouge sur `main`** : la fonction n'existe pas.

`fus/fusionner.test.mjs`, avec les hooks de banc (`hooks(d)`, l. 1023-1050) et un `commit-msg` de banc de plus, écrit par le test : il refuse un commit qui touche `prisma/schema.prisma` sans fichier sous `prisma/migrations/` et sans `[sans-migration:` dans son message (comme le hook de `fedora`). Les commits de fixture se font avant la pose des hooks.

1. **« passer.sh : develop n'apporte qu'un commentaire au schéma, la fusion porte la mention du contrat et passe le commit-msg »**. Attendu : sortie 0, `FUSIONNÉE`, le commit de fusion de la branche de la PR porte la mention. **Rouge sur `main`** : sortie 3, « fusion de develop refusée (hook git ou fichier non suivi) ».
2. **« passer.sh : sans fusionsSansEffet, la même fusion est refusée par le hook comme avant »**. Attendu : sortie 3, la sortie du hook sur stderr, aucune fusion en cours. Vert sur `main` : il garde le comportement.
3. **« passer.sh : un changement réel du schéma, venu avec sa migration, entre sans mention, et le capitaine le dit »**. Attendu : sortie 0, aucune mention dans le commit, la sortie d'erreur nomme `prisma/schema.prisma`.

`fus/sujet-fusionner.test.mjs` :

4. **« rafraichir et fusionner : la mention vaut aussi pour develop dans un sujet et pour un sujet dans une sous-PR »**. Deux cas sous le même `commit-msg` de banc : `sujet.sh rafraichir <nom>` sort en 0 et le commit de fusion du sujet porte la mention ; `sujet.sh fusionner <n>` d'une sous-PR en retard sur un sujet qui a reçu le commentaire : la mise à jour poussée porte la mention. **Rouge sur `main`** : sortie 3 pour les deux.

`scripts/depot.test.mjs` : **« le gabarit de .claude/chaine.json porte fusionsSansEffet vide, et son $comment la nomme »**.

### 2. Le code

`github.sh` (`mentions_de_fusion`, `fusionner_avec`), puis `passer.sh`, puis `sujet.sh`, puis le gabarit `chaine.json`. Commits sous les hooks, jamais `--no-verify`.

### 3. Les textes

Ceux du tableau « Où » : `fusionner/SKILL.md`, `fusionner/references/CONTENU.md`, `socle/CONTENU.md:5`, l'en-tête de `passer.sh`.

### 4. Tests existants

Ils restent verts sans changer : `fusionner.test.mjs:1055` (conflit d'index sous les hooks), `:1082` (commit-msg qui refuse une fusion sans conflit : sortie 3, sans fusion en cours), `:1153`, et les bancs du ticket 1. Si l'un rougit, le nommer dans la PR avant d'y toucher.

### 5. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici, une clé de contrat nouvelle, facultative, dans un gabarit : une mineure. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  Clé de contrat facultative `fusionsSansEffet` (`.claude/chaine.json`) : pour chaque fichier qu'un hook du projet garde, l'expression des lignes sans effet et la mention à écrire. Quand une fusion jouée par le capitaine (mise à jour d'une PR avec develop, d'un sujet avec develop, d'une sous-PR avec son sujet) n'apporte à ce fichier que de telles lignes, son commit de fusion porte la mention, et le hook du projet le laisse passer. Un changement réel n'a pas de mention : le capitaine le dit, et le hook juge comme avant.

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
  2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser`.
  3. Si un hook du projet exige une mention sur un fichier, ajouter la clé à `.claude/chaine.json`, dans la même PR (le capitaine la lit sur develop). Pour un projet Prisma dont le `commit-msg` exige une migration ou `[sans-migration: <raison>]` :

     ```json
     "fusionsSansEffet": [
       {
         "fichier": "prisma/schema.prisma",
         "lignesSansEffet": "^[[:space:]]*(//.*)?$",
         "mention": "[sans-migration: commentaire seul, apporté par une mise à jour du capitaine]"
       }
     ]
     ```

     Le chemin du schéma est celui du projet ; l'expression est celle de `grep -E` (POSIX étendue : `[[:space:]]`, jamais `\s`).
  4. Relancer le capitaine une fois cette PR entrée dans develop : la boucle prend les scripts de develop au tour suivant ; la veille tourne sur une copie : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée (skill `fusionner` § « Boucle »).

  **Iroki** : son `.husky/commit-msg` n'exige aucune mention de migration ; rien à ajouter au contrat. Reposer `passer.sh`, `sujet.sh` et `github.sh` remplace ses versions, qui ont divergé (`github.sh` de 539 lignes) : la repose est celle de 7.16.0, ce ticket n'en ajoute pas.
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| `mentions_de_fusion` : commentaire seul, changement réel, fichier intact, contrat absent ou mal formé, contrat de la PR ignoré | `skills/chaine/fusionner/scripts/github.test.mjs` « mentions_de_fusion : … » |
| `passer.sh` : mention écrite, hook passé | `fusionner.test.mjs` « passer.sh : develop n'apporte qu'un commentaire au schéma, la fusion porte la mention du contrat et passe le commit-msg » |
| `passer.sh` : sans la clé, comportement d'avant | `fusionner.test.mjs` « passer.sh : sans fusionsSansEffet, la même fusion est refusée par le hook comme avant » |
| `passer.sh` : changement réel, aucune mention, le capitaine le dit | `fusionner.test.mjs` « passer.sh : un changement réel du schéma, venu avec sa migration, entre sans mention, et le capitaine le dit » |
| `sujet.sh` `rafraichir` et `mettre_a_jour_sous_pr` | `sujet-fusionner.test.mjs` « rafraichir et fusionner : la mention vaut aussi pour develop dans un sujet et pour un sujet dans une sous-PR » |
| Gabarit du contrat | `scripts/depot.test.mjs` « le gabarit de .claude/chaine.json porte fusionsSansEffet vide, et son $comment la nomme » |
| Scripts posés dans un projet | `scripts/poses.test.mjs` |

## Vérification

1. Ciblée, à chaque étape :
   - `node --test skills/chaine/fusionner/scripts/github.test.mjs` ;
   - `node --test skills/chaine/fusionner/scripts/fusionner.test.mjs skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` ;
   - `node --test scripts/depot.test.mjs scripts/poses.test.mjs` ;
   - `bash -n` sur chaque script touché.
2. `pnpm test` complet : le nombre de `main` au départ, plus les tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli.
3. **Mutations**, chacune jouée sur une copie jetable, vue rouge, puis annulée, listées dans la PR avec les tests qui ont rougi :
   - le contrat lu dans l'arbre de travail plutôt que sur `origin/develop` : le cas « contrat de la PR ignoré » rougit ;
   - une ligne hors de `lignesSansEffet` tolérée : le banc 3 rougit (une mention apparaît) ;
   - `passer.sh` garde `git merge -q --no-edit` : le banc 1 rougit.
4. `graphify update .`
5. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR. Puis `/security-review` (scripts du capitaine, contrat), section `## Sécurité`.
6. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `feat(chaine): mention d'une fusion sans effet, clé fusionsSansEffet du contrat (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- Le hook du projet, et la mention exacte qu'il attend : à chaque projet.
- Les commits qui ne sont pas des fusions : `docs: régénère les index après mise à jour avec develop` (`passer.sh:256`, `sujet.sh:824`) ne touche que des index générés.
- L'avance rapide d'une PR de mise à jour (`avancer_sujet`) : aucun commit du capitaine.
- La repose dans `fedora` et l'ajout de son entrée : sa session, d'après la note.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, sources relues sur `4a45634`, et sur `develop` d'Iroki (`e3dbd235`). Écarts avec la spec :
  - **Changement réel : pas d'arrêt.** `A-8` dit « sinon, il s'arrête en disant quel fichier porte un changement réel ». Une migration livrée dans develop arrive avec son changement de schéma, et le commit de fusion du capitaine porte les deux : le hook de `fedora` l'accepte aujourd'hui. S'arrêter bloquerait toute PR à chaque migration de develop. Le ticket garde « en disant quel fichier », sans l'arrêt : le hook juge (Décision 3). **À confirmer par l'architecte.**
  - **Le diff se calcule avant la fusion** (`merge-tree`), pas sur le commit déjà fait : la mention doit être dans le message au moment où `commit-msg` le juge. Le résultat est le même que « diff entre le sommet de la branche avant la fusion et le résultat ».
  - **Pas de `--no-commit`** : sur une fusion propre, `git merge` ne joue pas le `pre-commit` du projet ; `git merge --no-commit` suivi de `git commit` le jouerait (lint-staged, formatage entré dans la fusion, déjà vu sur `fedora` #1918 et #1919). D'où `git merge -m`.
  - **Le contrat se lit sur `origin/develop`** : la spec ne disait pas où. Le worktree du capitaine porte la branche de la PR pendant la fusion.
  - **`relancer`** (`sujet.sh:885`) : la spec la citait ; le ticket 2 la fait passer par `mettre_a_jour_sous_pr`. Si le ticket 2 n'est pas fusionné au lancement de celui-ci, la fusion de `relancer` passe aussi par `fusionner_avec`.
- 2026-11-18 — Repris après une relecture neuve (« pas prêt »), décision de l'architecte : le diff ne se lit qu'après le premier `@@` (une ligne `-- ` ou `++ ` du contenu n'est plus prise pour un en-tête), avec son cas au banc ; `grep -xE` ; `git diff --no-textconv --no-ext-diff --no-color` ; `fichier` lu comme chemin littéral (`:(literal)`) ; `mention` qui commence par `#` refusée ; quatre fusions, et non cinq (`passer.sh:220`, `sujet.sh:518`, `:866`, `:954` sur la PR 115).
- 2026-11-19 — Fait par la session du ticket, sur `origin/main` `3b42387` (plugin 7.27.0, tickets 1, 2, 7, 8, 9, 11 et 18 fusionnés). Choix tranchés (Décision 4) :
  - **Trois fusions, et non quatre** : sur `main`, `relancer` passe par `mettre_a_jour_sous_pr` (ticket 2). `git merge -q --no-edit` n'est plus joué que par `fusionner_avec` ; ses trois appelants sont `passer.sh` (dans la boucle de trois tours), `mettre_a_jour_sous_pr` (`sujet.sh fusionner` et `relancer`, y compris la résolution d'un conflit d'index : le message passé par `-m` est dans `MERGE_MSG`, que `git commit -q --no-edit` reprend) et `rafraichir`.
  - **Les avis sur le descripteur 3** : les appelants capturent la sortie de `git merge` (`2>&1`) pour ne la montrer que sur un refus ; l'avis « changement réel » s'y serait perdu sur une fusion réussie. `fusionner_avec` écrit les avis de `mentions_de_fusion` sur le descripteur 3 s'il est ouvert, et les appelants l'y relient (`fusionner_avec <réf> 3>&2 2>&1`) ; sans lui, sur la sortie d'erreur. La sortie de `git merge` reste capturée comme avant.
  - **Motifs d'une entrée mal formée** : `fusionsSansEffet[<i>] ignorée : <motif>`, un par champ (objet, `fichier`, `lignesSansEffet`, `mention` : manquant, vide ou non textuel ; caractère de contrôle, fin de ligne comprise, dans l'un des trois : une expression sur deux lignes ferait deux motifs pour `grep -E`) ; mention qui commence par `Sujet:`, `Merge pull request` ou `#` ; expression que `grep -E` refuse (sortie 2, validée avant usage). Une clé qui n'est pas une liste le dit aussi (`fusionsSansEffet n'est pas une liste`), au lieu du silence : elle est présente, donc mal formée. `lignesSansEffet` vide est refusée (prudence : `-xE ''` n'accepterait que des lignes vides, sans doute pas l'intention).
  - **Arbre de fusion illisible** (git < 2.38) : aucune mention, motif sur la sortie d'erreur, sortie 0 ; la fusion suit son chemin.
  - **Mentions identiques** de deux entrées : écrites une fois.
  - **Mineure de la relecture** : le banc de la ligne entière porte une expression sans ancre (`[[:space:]]*//.*|}`) et une ligne `model B { // x` qui ne doit pas correspondre ; la mutation « `grep -E` sans `-x` » le rend rouge.
- 2026-11-19 — Contre-relecture de l'architecte (conforme), mineures portées : `|| true` sur l'arbre de `merge-tree` (sous `pipefail`, une fusion en conflit ailleurs faisait sortir l'appelant), avec son banc ; note de version (`github.sh` d'Iroki de 549 lignes, paragraphe **Fedora** : le hook lit tout le message) ; la recette de la PR de mise à jour d'un sujet par une session (`sujet/SKILL.md`, en-tête et sortie 4 de `sujet.sh`) fusionne par `fusionner_avec`, avec son banc ; « quatre fusions » de la ligne `Modèle:` harmonisé avec les trois de main.
