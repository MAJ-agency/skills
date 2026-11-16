# Une PR de mise à jour porte la fusion de develop puis des retouches : un fichier retouché n'entre sans revue que si le formateur du dépôt le prouve, la boucle ne nomme plus « conflit » un refus de hook

Status: ready-for-agent
Type: évolution
Label: contre-revue
Modèle: sonnet — un patch donné mot pour mot (`sujet.sh`, `boucle.sh`, `refus.sh`, deux bancs, six textes) et la version ; tout est joué sur une copie jetable de `origin/main` à `0860466` (voir « Vérification ») ; rien n'est à concevoir : le jugement que le ticket demandait (le formateur joué sur quel arbre, extrait comment sans rien exécuter, dans quel ordre avec la revue exigée et les checks) est tranché ici et gardé par des tests qui rougissent sous chaque variante écartée. La revue passe `/security-review` en plus de la revue de ticket : une dispense de revue nouvelle, et du code du dépôt (l'arbre déjà jugé) joué par le capitaine.
Blocked by: 39 (PR #94, fusionnée dans `main` à `76d90c7` le 2026-11-16 : `revue-exigee.mjs` et l'appel de `sujet.sh fusionner` que ce ticket reprend)
Dépendances: —
Fichiers chauds: `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/fusionner/scripts/refus.sh`, `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs`, `skills/chaine/sujet/SKILL.md`, `skills/chaine/sujet/references/CONTENU.md`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/chantier/SKILL.md`, `.claude-plugin/plugin.json`

## Le besoin

Rapporté le 2026-11-16 par l'architecte de `fedora`, vérifié à la source par l'architecte du programme (carte, « Retours de `fedora` », constat 1) ; décision **A-47**, qui fait foi.

Après la montée d'un outil ou d'un gate dans develop (`fedora` #1879 : Prettier 3.9.10, 121 fichiers reformatés), la mise à jour d'un sujet exige des **retouches** : reformater les fichiers du sujet, écrire des en-têtes que le gate des tickets exige désormais. Aujourd'hui :

- `rafraichir` fusionne develop sans conflit, mais le pre-push du capitaine (`pnpm check`) refuse le push : sortie 3, et la boucle dit « SUJET EN CONFLIT », à tort ;
- la PR de mise à jour (ticket 36) n'admet qu'un commit, la fusion, et n'écrit que dans les fichiers en conflit : une retouche la fait refuser (sortie 4), et la fusion seule ne passe pas le pre-push de la session ;
- une retouche envoyée en sous-PR squashée casse la filiation qu'apporte l'avance rapide ;
- sur `fedora`, #1918 à #1922 ont donc été fusionnées **à la main par le produit**, en commit de merge, sans label, sans contrôle ni revue. #1921 et #1922 réécrivaient le sujet en plusieurs fusions : hors de cette voie, et elles le restent.

Les règles du produit, intangibles :

> jamais `--no-verify`, jamais de push forcé ni de réécriture, jamais de fusion avec un contrôle exigé rouge, jamais de test sauté ou assoupli, jamais de push sur la branche par défaut

Quand le ticket est fait : une session fille fait la fusion de develop dans une branche partie du sujet, puis des retouches, commits ordinaires, et pousse le tout d'un seul push (le pre-push juge l'arbre de travail, le sommet). Le capitaine vérifie la fusion comme aujourd'hui, en admettant en plus dans son écart hors conflit les fichiers que le formateur prouve (le pre-commit de la session formate ce qu'il indexe). Il fait entrer **sans revue** un fichier retouché que le formateur du dépôt prouve : à chaque retouche qui le touche, sa version est exactement ce que Prettier, à la version que verrouille le sommet, rend de sa version au commit d'avant, sans directive de plus ; le formateur joue sur l'arbre déjà jugé, extrait hors du dépôt, après les checks, sans qu'aucun hook ne se déclenche. Tout autre fichier retouché est jugé comme une sous-PR. Le tout entre par avance rapide. La boucle renvoie une sortie 3 de `sujet.sh fusionner` avec son vrai motif, ne renvoie plus une PR dont les checks tournent encore, et dit `SUJET NON MIS À JOUR` d'un sujet que les hooks refusent sans conflit.

## Où

Base : `origin/main` à `0860466`, plugin **7.9.4**, **581 tests** (suite entière, script `test` de `package.json`). Depuis `76d90c7` (PR 94, ticket 39, 7.9.1), les PR 95 (7.9.2), 96 (7.9.3) et 97 (7.9.4) sont entrées ; seule la 97 touche des fichiers chauds, trois textes (`fusionner/SKILL.md:14`, le paragraphe « Les tests » de `fusionner/references/CONTENU.md`, désormais `:51`, et `socle-chaine-de-production/references/CONTENU.md:29`), hors des lignes que ce ticket cite : le code et les bancs sont ceux de `76d90c7`, et les lignes citées valent sur les deux. Le patch suit le paragraphe des tests de `0860466` : il s'applique sur `0860466`, plus sur `76d90c7` ni `863723a`. La session retrouve chaque ancrage par son texte. `S` abrège `skills/chaine/sujet/scripts/sujet.sh`, `B` abrège `skills/chaine/fusionner/scripts/boucle.sh`, `T` abrège `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`.

### Les faits, à la source (relus sur `76d90c7`, lignes identiques sur `0860466` ; ceux de la carte, `S:549-596`, `S:663-665`, `B:247`, `B:294`, `T:287`, sont aux mêmes lignes sur `fa7d3eb`)

- **`S:549-552`, `est_mise_a_jour`** : PR de mise à jour si sa tête, hors du sujet et de develop, n'apporte que des fusions, au moins une. Une retouche (un commit ordinaire) la fait passer au chemin ordinaire : revue exigée sur tout le develop apporté, puis `rafraichir --abandon-si-conflit`, puis squash.
- **`S:564-596`, `verifier_mise_a_jour`** : un seul commit hors du sujet et de develop (`:567`) ; écart à la fusion recalculée hors conflits et hors index régénérés → sortie 4 (`:590-592`). `RESOLUTION` (`:595`) part à la revue exigée.
- **`S:663-665`** : `fusionner` l'appelle ; **`S:670-671`** (depuis la PR 94) : `revue-exigee.mjs` avec la base `origin/<sujet>` ; **`S:689-690`** : checks rouges → sortie 3, checks **encore en cours** → sortie 3 aussi.
- **`S:766`** : `rafraichir` dont le push est refusé par le pre-push → `abandonner` → sortie 3 (« à corriger par une session sur le sujet », `:727`).
- **`B:244-248`, `rafraichir_sujets`** : toute sortie hors de 0 et 6 → « SUJET EN CONFLIT avec develop » (`:247`), donc aussi un push refusé par un hook, une installation ou un gate des index en échec.
- **`B:292-296`** : la sortie 3 de `sujet.sh fusionner` est renvoyée avec « fusion dans sujet/x refusée par GitHub (conflit avec le sujet) : fusionner sujet/x dans la branche et le résoudre » (`:294`), quelle que soit la cause : checks rouges (`S:689`), checks en cours (`S:690`), hook refusé dans la mise à jour d'une sous-PR (`S:496`, `:510`, `:518`), squash refusé (`:708`). Pour une PR de mise à jour, suivre ce conseil fait une seconde fusion, refusée ensuite en 4. Une sous-PR n'est appelée que « prête » (`file.sh`), mais le sommet peut bouger entre `file.sh` et `fusionner` (CI qui repart), et le capitaine lance `fusionner` à la main sur l'ordre d'un humain.
- **`T:287`** (« écrit hors des fichiers en conflit (ligne Dépendances:) ») et **`T:296-341`** (« d'une autre forme ») ; le dernier cas de la liste (`T:329`, « commit de plus ») attend la sortie 2 d'une fusion suivie d'un commit de documentation : c'est exactement ce que A-47 ouvre (décision 10).
- **Le pre-push du socle** (`skills/monorepo/socle-monorepo/references/husky/pre-push`, dernière ligne) joue `pnpm run check` **sur l'arbre de travail**, pas sur chaque commit poussé : sorti de `rien_de_neuf`, il ne lit jamais les shas qui partent. Poussée d'un arbre propre à son sommet, la branche est jugée à son sommet, retouches comprises ; aucun commit intermédiaire n'est jugé seul. Banc ajouté (§ 0, `develop.test.mjs`). La phrase de `socle-chaine-de-production/references/CONTENU.md:25` qui dit d'un pre-push antérieur à 7.0.1 qu'il « jouerait `pnpm check` sur l'arbre de travail — pas ce qui part » laisse croire que le hook actuel juge ce qui part : il juge l'arbre de travail lui aussi (Hors périmètre).
- **Le pre-commit du socle** (`husky/pre-commit`) joue `lint-staged` (`prettier --write`, et `eslint --fix` chez `fedora`) sur les fichiers indexés. Dans une fusion à conflit, ce sont tous les fichiers que develop change et ceux résolus : ils sont reformatés **dans le commit de fusion** (joué : § « Reproduit », 2).
- **Comment la chaîne joue déjà les outils du projet** : `S` lance `pnpm exec commitlint` (titre, `:654`), `pnpm exec prettier --stdin-filepath` (`ecrire_gel` `:318`, `carte_sujet` `:1096`, sur le `node_modules` présent), et `pnpm install --frozen-lockfile --prefer-offline` sur le sommet détaché avant toute régénération (`mettre_a_jour_sous_pr`, `avancer_sujet`, `rafraichir`) ; `passer.sh:237` de même. Tous jouent dans le worktree du capitaine, sur un arbre déjà jugé (develop, le sujet, un sommet aux checks verts) ; la preuve de ce ticket n'y extrait jamais la PR (décision 5).
- **Les hooks git du socle** (`socle-monorepo`, husky 9, `prepare: husky`) : `core.hooksPath=.husky/_`, dont le relais joue `.husky/<hook>` tel qu'il est dans l'arbre de travail. Tout `git switch`, `git checkout` (même `checkout <arbre> -- <fichier>`), `git merge` ou `git commit` déclenche donc les hooks que l'arbre extrait porte. Relecture du 2026-11-16 (B1) : le premier état de ce ticket extrayait la fusion de la PR dans le worktree du capitaine (`git switch --detach <fusion>`, puis `git checkout <arbre> -- <f>`), et un `.husky/post-checkout` écrit hors conflit s'y exécutait avant toute preuve, là où `main` sort en 4 sans rien exécuter ; un fichier suivi sous `node_modules/` y était extrait de même.
- **Un dépôt sans Prettier** : `carte_sujet` y refuse toute carte (la sortie vide de `prettier` ne vaut pas le fichier). Ici, aucune dispense : tout est jugé comme aujourd'hui.

### Reproduit

1. **`fedora`, à la source** (`/home/user/fedora`, têtes `refs/pull/1918..1920/head`, fusions `73489eec`, `e37fce7a`, `dc62f275`). Chaque PR est **une seule fusion**, sans retouche, dont l'écart à la fusion recalculée (`git merge-tree --write-tree`) déborde des conflits. Fichier par fichier, la version de la fusion comparée à Prettier 3.9.10 (`.prettierrc` de la fusion) appliqué à la version recalculée :
   - #1918 : 7 fichiers hors conflit (`apps/api/…`, `apps/web/…`, `packages/shared-validators/…`), **tous prouvés** ; les 2 autres sont les fichiers en conflit (`anchorpost/anchorpost.json`, un `.ts`) ;
   - #1919 : 2 fichiers hors conflit, **tous deux prouvés** ; 3 fichiers en conflit ;
   - #1920 : 3 fichiers hors conflit **non prouvés** (`docs/agents/couts.md`, la carte et un ticket : les en-têtes que le gate exige) ; le reste en conflit.

   Avec ce ticket : #1918 et #1919 entrent telles quelles, sans revue pour le formatage (la résolution de leur conflit de code reste revue) ; #1920 met ses en-têtes dans une retouche après la fusion : la carte et le ticket entrent sans revue, `docs/agents/couts.md` l'exige (liste de la PR 94).
2. **Le pre-commit formate dans la fusion** (copie jetable, `lint-staged` 15.2.10 et `prettier` 3.3.3 réels) : sujet et develop changent `a.ts` loin l'un de l'autre et `c.md` en conflit ; `git merge` puis `git commit --no-edit` sous un pre-commit `lint-staged` : `a.ts`, fusionné sans conflit, est réécrit par Prettier dans le commit de fusion. Sur `76d90c7`, une telle PR sort en 4 (« elle écrit hors des fichiers en conflit (a.ts) »), et la session ne peut pas l'éviter sans sauter le hook.
3. **Dépôt jouet, sur `76d90c7`** : une fusion suivie d'une retouche de formatage d'`apps/s.ts` part au chemin ordinaire et sort en 4 (« … touche du code … (apps/a.ts) », le code apporté par develop) ; une fusion suivie d'une retouche de documentation sort en 4 de même sans section de revue, et en 2 avec (le `rafraichir --abandon-si-conflit` du chemin ordinaire retombe sur le conflit : `T:329`). Les vingt et un tests nouveaux de `T` sont rouges (§ 0).

## Décisions

1. **Forme de la PR** (A-47). Hors du sujet et de develop, sur la première-parent du sommet :
   - le **premier commit est la fusion**, seule fusion de la plage, vérifiée comme aujourd'hui : message sans ligne `Sujet:` ni `Merge pull request`, deux parents, le sommet actuel du sujet puis un commit de develop absent du sujet ;
   - puis des **retouches**, commits ordinaires l'un après l'autre (la première-parent couvre toute la plage) ; chacune au message sans ligne `Sujet:` ni `Merge pull request`, **accepté par commitlint** (`pnpm exec commitlint`) : elle entre telle quelle dans le sujet, puis dans develop.

   Deux fusions, une retouche suivie d'une seconde fusion : sortie 4, « une seule fusion … son premier commit ». #1921 et #1922 restent hors de cette voie.
2. **Reconnaître la PR** (`est_mise_a_jour`) : la plage contient une fusion dont **les deux parents sont hors de la plage** (dans le sujet ou dans develop). C'est la fusion « du sujet et de develop », au pied de la branche. Une sous-PR où le capitaine a fusionné le sujet (`mettre_a_jour_sous_pr`) a une fusion dont le premier parent est un commit de la session : elle garde le chemin ordinaire, comme une branche dont un commit ordinaire précède la fusion (test « autre forme », cas « retouche avant la fusion »). Une plage faite de seules fusions reste reconnue, comme aujourd'hui.
3. **La preuve** (`formate_comme`). Un fichier est prouvé quand :
   - il existe avant et après, en fichier ordinaire de même mode (`100644` ou `100755`, pas un lien) ;
   - sa version après est **octet pour octet** la sortie de `pnpm exec prettier --stdin-filepath <chemin>` appliqué à sa version avant ;
   - il ne porte **aucune directive de plus** qu'avant : `prettier-ignore`, `eslint-disable`, `/* eslint `, `@ts-`, `istanbul ignore`, `c8 ignore`, `v8 ignore`, `biome-ignore`, `Stryker disable` (lignes comptées). Prettier n'écrit pas de commentaire : la garde est indépendante de l'égalité, et un test la prouve avec un formateur qui écrirait la directive (la liste va au-delà des trois de A-47 : retenue par l'architecte, A-47 bis, carte, journal du 2026-11-16).

   « Avant », pour une retouche : sa version au parent de cette retouche, et **chaque** retouche qui touche le fichier doit le prouver, car chacune entre telle quelle dans l'historique du sujet, puis de develop (relecture du 2026-11-16, B2) ; pour l'écart de la fusion elle-même : sa version dans la fusion recalculée. Un fichier en conflit n'est jamais prouvé : il est dans la résolution, jugée par chemin comme aujourd'hui.
4. **La preuve vaut aussi pour l'écart de la fusion** (retenue par l'architecte : A-47 bis, carte, journal du 2026-11-16 ; A-47 dit « vérifiée comme aujourd'hui »). Le pre-commit de la session formate dans le commit de fusion les fichiers qu'il indexe (reproduit, 2, et `fedora` #1918, #1919) : sans cela, la voie refuserait le cas même qui l'a fait naître. Seul le formatage prouvé y entre en plus ; tout autre écart hors conflit reste refusé (sortie 4, test « fusion … un autre écart hors conflit reste refusé » : ligne `Dépendances:`, code), **même avec une section de revue**. Le reste va dans une retouche, après la fusion.
5. **Sur quel arbre joue le formateur, et comment** (l'arbre retenu par l'architecte, A-47 bis ; la manière décidée après la relecture du 2026-11-16, B1). **L'arbre jugé** : la fusion recalculée (`git merge-tree`), chaque fichier en conflit pris dans la fusion de la PR ; c'est l'arbre du sujet et de develop plus la résolution des conflits, déjà passée à la revue exigée (décision 6). Il se construit **sans checkout** : un index temporaire (`GIT_INDEX_FILE`), `git read-tree <fusion recalculée>`, chaque fichier en conflit par `git update-index --cacheinfo` (`--force-remove` s'il est absent de la fusion), `git write-tree` ; puis il s'extrait par `git archive <arbre> | tar -x -C <dossier>` dans un dossier temporaire hors du dépôt, où `pnpm install --frozen-lockfile --prefer-offline --ignore-scripts` installe ses outils et où Prettier joue (`GIT_CEILING_DIRECTORIES` : aucun dépôt git n'y est trouvé). Le worktree du capitaine n'est jamais touché par la preuve, et aucune commande qui déclenche un hook (`switch`, `checkout`, `merge`, `commit`) ne tourne sur un arbre qui porte un fichier non jugé ; les hooks ne sont jamais désactivés (ni `core.hooksPath`, ni `--no-verify`, ni `HUSKY=0`) : on ne les déclenche pas. Ni une retouche, ni un écart de la fusion ne s'exécutent donc à leur propre jugement : une configuration de Prettier, un greffon, un fichier qu'un greffon lit, un lockfile, un `package.json`, un `.husky/<hook>`, un `node_modules/` écrits par la PR ne changent pas le formateur qui les juge et ne tournent jamais. `--ignore-scripts` : l'installation du formateur ne joue aucun script de cycle de vie, même de l'arbre jugé. Un fichier en conflit qui n'est pas un fichier ordinaire dans la fusion (lien, dossier) : aucune dispense. Joué sur le sommet ou sur la fusion de la PR, une règle de formatage réécrite par la PR (`docs/format.txt` : `cat apps/s.ts`) prouverait n'importe quel code (test « le formateur ne joue jamais un fichier que la PR écrit », rouge sous ces deux variantes) ; extraite dans le worktree du capitaine, la fusion y exécutait son `.husky/post-checkout` (tests « un hook … ne s'exécute jamais » et « node_modules », rouges sous cette variante). **« À la version verrouillée du sommet »** (A-47) : une retouche d'un `package.json`, de `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc` ou `.pnpmfile.cjs` supprime toute dispense, ce qui fait du Prettier de l'arbre du formateur celui que verrouille le sommet chaque fois qu'il dispense.
6. **Ordre : rien du dépôt ne s'exécute avant la revue de la résolution, les liens et les checks** (l'ordre revue puis formateur retenu par l'architecte, A-47 bis ; les checks avant toute preuve, relecture du 2026-11-16, mineure 1). D'abord la forme (décision 1, commitlint du capitaine), puis la résolution (écart de la fusion hors conflit ôté, index compris, et fichiers en conflit) passe `revue-exigee.mjs` (base `origin/<sujet>`, comme la PR 94) : sinon sortie 4. Puis `liens_sur_index`, puis les checks exigés (rouges : 3 ; en cours : 5). Seulement ensuite le formateur (`juger_retouches`), et **seulement si la PR en a besoin** : un fichier hors conflit dans la fusion, ou une retouche que la revue exigerait sans section. Une PR qui a sa section de revue, ou dont les retouches ne touchent que de la documentation, entre sans qu'aucun Prettier ne tourne (test « retouche de documentation ») ; une PR refusée en 3 ou en 4 n'a rien installé ni formaté (test « checks et liens avant toute preuve »). Ce qui s'exécute alors (`pnpm install --ignore-scripts`, Prettier, sa configuration, ses greffons) vient du sujet, de develop ou d'une résolution déjà jugée : la même classe que `rafraichir`, et que `avancer_sujet` après les checks.
7. **Tout autre fichier retouché est jugé comme une sous-PR** : `revue-exigee.mjs` reçoit la résolution et **l'union des fichiers que chaque retouche touche sans preuve**, commit par commit (`git diff --no-renames --name-only <c>^ <c>` pour chaque retouche `c` ; un fichier ajouté par l'une puis retiré par une autre compte : relecture du 2026-11-16, B2), avec le corps et la base de la PR (chemins sensibles du `chaine.json` de la base compris, PR 94). Une retouche de documentation hors `docs/agents/` n'exige pas de revue, une ligne `Dépendances:` d'un ticket non plus : exactement comme une sous-PR, qui l'écrit aujourd'hui sans revue. Les chemins sensibles déclenchent `/security-review` chez la session qui fait sa revue, comme pour toute sous-PR (`revue-adversariale`). Le relecteur lit `git show --remerge-diff <fusion>` et `git log -p --first-parent <fusion>..<sommet>` : chaque retouche, pas le seul diff du sommet.
8. **La section « Retouches » du corps** (fichier, raison) est pour le relecteur ; aucun script ne la lit. Test : une retouche de code avec cette section, sans section de revue, sort en 4.
9. **Aucune dispense** : un dépôt sans `prettier` dans `devDependencies` ou `dependencies` du `package.json` racine (de l'arbre du formateur), un chemin que git cite entre guillemets (écart, retouche ou conflit), un fichier en conflit qui n'est pas un fichier ordinaire dans la fusion, un fichier créé, supprimé, de mode changé, un binaire (Prettier échoue), un fichier que `.prettierignore` écarte (Prettier le rend tel quel : il n'a pas changé, ou il n'est pas prouvé). Prettier déclaré mais introuvable après `pnpm install`, l'installation en échec, ou l'arbre du formateur illisible ou non extrait (`git archive`, `tar`) : **sortie 11** (côté capitaine, sans renvoi, comme les autres outils du capitaine). Le formatage d'un `.md` (tableaux réalignés) ou d'un `.yml` est réputé sans effet, comme A-47 le prend.
10. **Un test existant change, un seul** : le dernier cas de « d'une autre forme » (`T:329`, fusion suivie d'un commit `docs/g.md`, sortie 2 attendue) est retiré de la liste, parce que A-47 fait entrer cette PR ; le test nouveau « une retouche de documentation après la fusion entre sans revue ni formateur » le remplace et en dit l'inverse. Ce n'est pas un test assoupli : le comportement change par décision. Le test `T:296` perd « commit de plus » de son titre. Les autres tests existants passent sans changement.
11. **L'impasse du pre-push** : la recette fait pousser la fusion **et** ses retouches d'un seul `git push origin HEAD:maj/<nom>`, d'un arbre propre. Le pre-push joue `pnpm check` sur l'arbre de travail, c'est-à-dire le sommet : la fusion seule n'est jamais jugée seule, ni poussée. Avant le commit d'une fusion à conflit, `pnpm install --frozen-lockfile --prefer-offline` installe les outils de la fusion : sans lui, le pre-commit reformaterait les fichiers de develop avec le Prettier du sujet (l'ancien), et la fusion sortirait en 4. Une fusion sans conflit, git la committe sans pre-commit. Banc : `develop.test.mjs`, « il juge l'arbre de travail » (vert dès `main` : il fixe le fait sur lequel la recette repose). Il juge l'arbre de travail, **pas ce qui part** : un `git push <sha>:maj/<nom>` depuis un autre arbre passe le hook sur ce que l'arbre de travail porte. La recette le dit (en-tête de `sujet.sh`, `sujet/SKILL.md`) ; seule la CI exigée, que `fusionner` lit sur le sommet de la PR, fait foi (relecture du 2026-11-16, mineure 5).
12. **Les deux motifs faux de la boucle** :
    - `B:294` : la sortie 3 de `sujet.sh fusionner` passe par `refus.sh`, qui renvoie avec la dernière ligne de `sujet.sh` (checks rouges et leur nom, conflit avec le sujet hors index, hook), jamais un conflit supposé ; `refus.sh` reçoit le code en troisième argument, et son repli dit « refusée en sortie 3 », plus « sortie 4 » (relecture du 2026-11-16, mineure 4) ;
    - des checks **encore en cours** (`S:690`) sortent en **5** (« reprise au tour suivant, aucun renvoi ») au lieu de 3 : un renvoi coûte un des trois renvois du plafond, pour une CI qui n'a pas fini. La PR reste dans la file tant que sa CI ne finit pas, sans bruit : `file.sh` la montre `sujet/<nom> : CI en cours` et la boucle ne la passe pas ; une CI bloquée la garde ainsi, c'est au capitaine de la voir (relecture du 2026-11-16, mineure 6) ;
    - `B:247` : `rafraichir_sujets` lit la sortie : 2 → `SUJET EN CONFLIT` (inchangé) ; 5 → sujet bougé, repris au tour suivant ; 6 → `PAS PROPRE` (inchangé) ; 3 → `SUJET NON MIS À JOUR (sortie 3, aucun conflit)`, avec la voie de la PR de mise à jour avec retouches ; 11 → `SUJET NON MIS À JOUR (sortie 11, aucun conflit)` : outil du capitaine en échec, à corriger chez lui, rien à faire par une session ; toute autre (69 : jq absent ; 1 : erreur inattendue) → `SUJET NON MIS À JOUR (sortie n, aucun conflit)` : erreur de `sujet.sh`, à corriger chez le capitaine, jamais la voie des retouches (relecture du 2026-11-16, mineure 4) ;
    - le message de `rafraichir` sur un push refusé par le pre-push (`S:766`) nomme la même voie.
13. **Monotonie**. Rien de ce que la chaîne refuse aujourd'hui ne devient possible, sauf ce que A-47 ouvre, et seulement cela :
    - un fichier de code ou de configuration dont la machine prouve qu'il n'est que le formatage, par le formateur de l'arbre déjà jugé, entre sans section de revue ;
    - des commits ordinaires entrent dans le sujet sans squash, chacun passé par commitlint ;
    - tout le reste d'une retouche passe le jugement d'une sous-PR, que la chaîne accepte déjà.

    Rien de non jugé ne s'exécute chez le capitaine : la preuve n'extrait aucun arbre dans son worktree, ne déclenche aucun hook et n'en désactive aucun (décision 5), et ne joue qu'après la revue de la résolution, les liens et les checks (décision 6). Chaque commit qui entre est jugé : une retouche se prouve contre son parent, et la revue lit l'union des fichiers que les retouches touchent, commit par commit (décision 7). Joué à la relecture du 2026-11-16 : une PR que `main` refuse en 4 sans rien exécuter (un `.husky/post-checkout` écrit hors conflit) le reste, toujours sans rien exécuter ; une retouche intermédiaire non revue (code et workflow ajoutés par l'une, retirés par la suivante) n'entre plus.

    Les écritures dans le sujet restent un `git push` simple (`avancer_sujet`, inchangé), jamais forcé, sous les hooks, sur un sommet dont chaque fichier est jugé ou prouvé ; le sujet qui bouge laisse la PR dehors (sortie 5). Les hooks d'agent ne changent pas.
14. **Version : mineure**, **7.10.0** visée (une voie nouvelle de `fusionner`) : la mineure qui suit `origin/main` à l'ouverture de la PR (7.9.4 au 2026-11-16, après les PR 95 à 97). Le ticket 33, mineure aussi, peut entrer avant : alors la suivante (7.11.0). Repli : si une PR du plugin entre pendant ce temps, fusionner `main` dans la branche (`git merge origin/main`, un commit de fusion, ni rebase ni push forcé) et prendre la mineure qui suit la sienne ; un correctif entré entre-temps (7.9.5) ne change pas la mineure visée.

### Remèdes écartés

- **Joué sur le sommet** (lecture littérale de A-47) : le formateur lirait la configuration, les greffons et les fichiers qu'ils lisent tels que la PR les écrit ; une PR prouverait elle-même son code (décision 5, test).
- **Joué sur la fusion telle que la session l'a committée** : l'écart de la fusion hors conflit (non jugé) s'exécuterait à son propre jugement, de même.
- **Lire la section « Retouches »** pour savoir quoi dispenser : la PR déclarerait ce que la machine croit (A-47).
- **`prettier --check` sur les fichiers retouchés** : il dit qu'un fichier est formaté, pas qu'il n'a changé que par formatage ; une retouche de code formatée passerait.
- **Retouches en sous-PR squashée** : la filiation de develop se perd (ticket 36), et c'est ce qui a mené `fedora` à fusionner à la main.
- **Admettre plusieurs fusions** : #1921 et #1922 réécrivent le sujet ; une seule fusion garde la vérification par `merge-tree`.
- **Extraire la fusion dans le worktree du capitaine** (premier état du ticket : `git switch --detach <fusion>`, puis chaque fichier hors conflit remis à la fusion recalculée par `git checkout <arbre> -- <f>`) : le `switch` et chaque `checkout` déclenchent `post-checkout`, que le relais de husky joue tel que la PR l'écrit, et un `node_modules/` suivi y est extrait (relecture du 2026-11-16, B1 ; tests « un hook … », « node_modules »).
- **Taire les hooks pendant la preuve** (`core.hooksPath`, `--no-verify`, `HUSKY=0`) : interdit ; la preuve ne les déclenche pas.
- **Prouver le seul écart de la fusion au sommet** (premier état du ticket) : une retouche intermédiaire non revue entre dans l'historique du sujet, et un `git revert` de la suivante la remettrait (relecture du 2026-11-16, B2 ; test « chaque retouche se prouve contre son parent »).
- **Garder la fusion stricte** (A-47 à la lettre) : le pre-commit de la session y met le formatage hors conflit, sans contournement permis (reproduit, 2) ; la voie refuserait #1918 et #1919 telles qu'elles sont.
- **Une sortie nouvelle pour les checks en cours** : 5 dit déjà « reprise au tour suivant », et la boucle la traite sans renvoi.

## À faire, dans l'ordre

### 0. Les tests d'abord, vus rouges

Sur `origin/main` (`0860466` ; `76d90c7` et `863723a` donnent le même compte dans `T`) :

1. appliquer la partie « tests » du patch (§ 1.a) : les blocs `diff` du § 1.a dans un fichier, puis `git apply --index` ;
2. jouer `node --test skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs` ;
3. voir **vingt et un `not ok`**, tous dans `T` (les vingt et un tests nouveaux), et les vingt-deux autres de `T` verts, le cas retiré compris ; `develop.test.mjs` vert (onze sur onze, son test nouveau compris : il fixe le fait du pre-push) ;
4. **puis** seulement appliquer le reste.

Les tests nouveaux de `T`, et leur rouge sur `main` :

| Test | Scénario (dépôt jouet, faux `gh`, faux Prettier : guillemets doubles en simples, espaces de fin retirés) | Sur `main` |
| --- | --- | --- |
| retouche de formatage prouvée → entre sans revue | sujet avec `apps/s.ts` non formaté ; fusion, puis `style: formate` qui le formate ; sans section de revue → 0, avance rapide, PR fermée, Prettier joué sur `apps/s.ts` | 4 (chemin ordinaire, revue du develop apporté) |
| formaté autrement → revue | la retouche retire les espaces mais garde les guillemets → 4, motif sur `apps/s.ts`, sujet inchangé, worktree rendu à develop | 4, motif sur `apps/a.ts` |
| `prettier-ignore` ajouté → revue | retouche formatée précédée de `// prettier-ignore` → 4 | 4, autre motif |
| directive que le formateur écrirait → revue | un formateur qui écrit `// eslint-disable-next-line` : égalité, mais directive de plus → 4 | 4, autre motif |
| retouche de code → revue ; « Retouches » ne dispense pas ; une section de revue la fait entrer | `fix(lot): s vaut y` avec la section « Retouches » → 4 ; avec « Revue adversariale » en plus → 0 | 4 / 2 (chemin ordinaire, conflit) |
| autre forme → refus | deux fusions → 4 ; retouche puis seconde fusion → 4 ; commit avant la fusion → chemin ordinaire, 4 sur `apps/a.ts` ; retouche à ligne `Sujet:` → 4 ; retouche hors Conventional Commits → 4 | motifs différents |
| dépôt sans Prettier → revue | même retouche sans `prettier` dans le `package.json` → 4, aucun Prettier joué | 4, autre motif |
| retouche de documentation → entre sans formateur | en-têtes `Responsable:`, `Conducteur:` dans un ticket (cas #1920) → 0, aucun Prettier joué | 4 |
| fusion formatée hors conflit → entre ; autre écart refusé | la résolution formate `apps/s.ts` → 0 ; code ou ligne `Dépendances:` dans la fusion, même avec revue → 4 « autre chose que le formatage » | 4 « hors des fichiers en conflit » pour le premier |
| le formateur ne joue jamais un fichier que la PR écrit | le faux Prettier lit `docs/format.txt` ; la PR le réécrit en `cat apps/s.ts` et change le code, dans une retouche → 4 ; dans la fusion → 4 | 4, autres motifs |
| rien d'autre n'est prouvé | mode changé, fichier créé, supprimé, lockfile retouché (avec revue, fusion formatée : aucune dispense), chemin cité `apps/q"x.ts` → 4 | 4 ou 2, autres motifs |
| Prettier déclaré introuvable → 11 | `--version` en échec → 11, rien d'écrit | 4 |
| checks en cours → 5, rouges → 3 | `IN_PROGRESS` → 5 « reprise » ; `FAILURE` → 3 « checks rouges sur #81 : qualite » | 3 pour les deux |
| boucle : sortie 3 renvoyée avec le motif de `sujet.sh` | sous-PR en conflit d'index, pre-push du capitaine qui refuse → commentaire « mise à jour de #80 refusée par le hook pre-push », jamais « conflit avec le sujet » | « conflit avec le sujet » |
| boucle : `SUJET NON MIS À JOUR` / `SUJET EN CONFLIT` | sujet sans conflit, pre-push qui refuse → « SUJET NON MIS À JOUR (sortie 3, aucun conflit) » ; sujet en conflit → « SUJET EN CONFLIT » | « SUJET EN CONFLIT » pour les deux |
| un hook écrit hors conflit ne s'exécute jamais (B1) | relais de husky simulé (`core.hooksPath` vers un dossier dont chaque hook joue `.husky/<hook>` de l'arbre de travail) ; la fusion formate `apps/s.ts` et écrit `.husky/post-checkout`, `.husky/post-merge` → 4 « hors des fichiers en conflit (.husky/post-checkout .husky/post-merge ) autre chose que le formatage », formateur joué, aucun hook de la PR exécuté | 4, autre motif, sans formateur ; premier état du ticket : `post-checkout` exécuté |
| `node_modules/` hors conflit jamais extrait (B1) | la fusion écrit `node_modules/.bin/prettier` → 4, le fichier jamais vu dans l'arbre de travail du capitaine (noté par chaque hook) ni dans le dossier du formateur | 4, autre motif, sans formateur ; premier état : extrait par le `switch` |
| chaque retouche contre son parent (B2) | retouche 1 ajoute `apps/pirate.ts` et `.github/workflows/x.yml`, retouche 2 les retire et formate `apps/s.ts` → 4 ; `apps/pirate.ts` ajouté puis retiré, rien d'autre → 4 | 4 sur `apps/a.ts` (chemin ordinaire) ; premier état : 0 |
| checks et liens lus avant toute preuve (mineure 1) | retouche de formatage, checks `FAILURE` → 3 ; retouche qui formate et remplace l'index par un lien → 4 « lien symbolique » ; dans les deux cas ni `pnpm install` ni Prettier joués | 4 sur `apps/a.ts` ; premier état : formateur joué avant les checks |
| boucle : panne du capitaine ou de `sujet.sh` (mineure 4) | le `sujet.sh` publié sort en 11, 69, puis 1 dès `rafraichir` → « SUJET NON MIS À JOUR (sortie n, aucun conflit) », « outil du capitaine » ou « erreur de sujet.sh », « rien à faire par une session », jamais « retouches » | « SUJET EN CONFLIT » ; premier état : la voie des retouches pour les trois |
| `refus.sh` : le repli nomme la sortie (mineure 4) | sortie illisible, code 3 → « refusée en sortie 3 » | « refusée en sortie 4 » |

Et dans `develop.test.mjs` : « pre-push du socle : il juge l'arbre de travail … la fusion seule est refusée, suivie de sa retouche elle passe » (vert sur `main`).

Compte : **vingt-deux tests nouveaux** (vingt et un dans `T`, un dans `develop.test.mjs`), un cas retiré d'un test existant ; **603 tests** attendus (581 + 22 sur `0860466`). Les six tests de la relecture (B1, B2, mineures 1 et 4) sont rouges aussi contre les scripts du premier état du ticket.

### 1. Le patch, mot pour mot

Les blocs `diff` des §§ 1.a, 1.b et 2, mis bout à bout, forment un patch qui s'applique sur `0860466` par `git apply --index` (vérifié : `git apply --check`, puis `git apply --index`, de ces blocs extraits du ticket, sur un worktree jetable de `0860466` ; l'arbre obtenu est celui où la suite a été jouée). Il ne touche ni `plugin.json` (§ 3) ni les hooks d'agent. Les tests d'abord (§ 0), puis le reste.

#### 1.a Les bancs

```diff
diff --git a/skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs b/skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs
index 3f8936f..86fc6a4 100644
--- a/skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs
+++ b/skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs
@@ -190,7 +190,8 @@ test("sujet.sh fusionner : une sous-PR d'un sujet gelé sort en 7, jamais en 4,
 // chacun une ADR (conflit sur l'index généré) ; develop touche aussi apps/a.ts, hors conflit. `base`,
 // `sujetEnPlus`, `developEnPlus` et `resolution` : { chemin: contenu }, `null` retire le fichier. La
 // branche maj/lot part de `depuis`, fusionne `fusion`, résout `conflit` et l'index (à la main et mal : la
-// régénération le refait), committe (`message`, sinon celui de git), puis `avantPush(d)` et le push ;
+// régénération le refait), committe (`message`, sinon celui de git), puis `avantPush(d)` (les retouches) et le push ;
+// `avantFusion(d)` agit sur maj/lot avant la fusion ;
 // `apres(d)` agit ensuite sur le distant.
 const TICKET = "docs/features/demo/all/issues/SPEC_ALL_DEM-1-demo.01.issue.md";
 const CARTE = "docs/features/demo/all/SPEC_ALL_DEM-1-demo.map.md";
@@ -209,6 +210,7 @@ function miseAJour({
   message = null,
   depuis = "origin/sujet/lot",
   fusion = "origin/develop",
+  avantFusion = () => {},
   avantPush = () => {},
   apres = () => {},
   body = "Met lot à jour avec develop.\n",
@@ -239,6 +241,7 @@ function miseAJour({
   d.git("push", "-q", "origin", "HEAD:develop");
   d.git("fetch", "-q", "origin");
   d.git("switch", "-q", "-C", "maj/lot", depuis);
+  avantFusion(d);
   const m = spawnSync("git", ["merge", "-q", "--no-edit", fusion], { cwd: d.travail, env: d.env, encoding: "utf8" });
   assert.equal(m.status, 1, "conflit attendu : " + m.stdout + m.stderr);
   appliquer(d, { [conflit]: "résolu\n", [`${ADR}/README.md`]: index("ADR_ALL_ARC-3-c.md"), ...resolution });
@@ -293,7 +296,7 @@ test("fusionner : une PR de mise à jour qui écrit hors des fichiers en conflit
   assert.deepEqual(ecritures(d), []);
 });
 
-test("fusionner : une PR de mise à jour d'une autre forme n'entre pas (sujet avancé, develop premier parent, revue, suppression cachée par un renommage, index sans commande, message forgé, chemin cité, conflit modifier/supprimer ou binaire, commit de plus)", () => {
+test("fusionner : une PR de mise à jour d'une autre forme n'entre pas (sujet avancé, develop premier parent, revue, suppression cachée par un renommage, index sans commande, message forgé, chemin cité, conflit modifier/supprimer ou binaire)", () => {
   const indexSansCommande = JSON.stringify({ index: [{ chemin: `${ADR}/README.md`, commande: "node scripts/docs/adr-index.mjs" }, "apps/genere.json"] });
   const cas = [
     [{ apres: (d) => d.branche("sujet/lot", "origin/sujet/lot", { "docs/autre.md": "autre\n" }, "docs: autre") }, 4, /premier parent.*sommet de sujet\/lot/],
@@ -326,7 +329,6 @@ test("fusionner : une PR de mise à jour d'une autre forme n'entre pas (sujet av
     // ne fait aucun écart ; la revue porte aussi sur les fichiers en conflit.
     [{ base: { "apps/api/legacy.ts": "export const l = 0;\n" }, sujetEnPlus: { "apps/api/legacy.ts": "export const l = 1;\n" }, developEnPlus: { "apps/api/legacy.ts": null } }, 4, /Revue/],
     [{ base: { "apps/img.bin": "\0base\n" }, sujetEnPlus: { "apps/img.bin": "\0sujet\n" }, developEnPlus: { "apps/img.bin": "\0develop\n" } }, 4, /Revue/],
-    [{ avantPush: (d) => (d.ecrire("docs/g.md", "g\n"), d.commit("docs: en plus")), body: "## Revue de ticket\n\nRien.\n" }, 2, /conflit avec develop sur sujet\/lot, fusion annulée/],
   ];
   for (const [options, sortie, motif] of cas) {
     const { d } = miseAJour(options);
@@ -541,3 +543,394 @@ test("fusionner : un chemin sensible déclaré par develop après le départ du
   assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale ».*\(infra\/main\.tf\)/);
   assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
 });
+
+// =============================================================================
+// PR de mise à jour avec retouches (ticket 40) : la fusion d'abord, puis des commits ordinaires. Un fichier
+// retouché n'entre sans revue que si le formateur du dépôt le prouve ; tout autre est jugé comme une sous-PR.
+// =============================================================================
+
+// Le faux `pnpm` du jouet ne formate rien. `formateur` le remplace : `exec prettier` joue `commande` sur l'entrée
+// standard (par défaut un « Prettier » de jouet : guillemets doubles en simples, espaces de fin retirés) et répond à
+// `--version` (sortie `version`) ; `exec commitlint` refuse une première ligne hors Conventional Commits ; le reste
+// lit son entrée. Chaque appel est journalisé. `PRETTIER` déclare Prettier dans le package.json de develop.
+const PRETTIER = { "package.json": '{ "devDependencies": { "prettier": "3.9.10" } }\n' };
+const JOUET_PRETTIER = `sed -e "s/\\"/'/g" -e 's/[[:space:]]*$//'`;
+function formateur(d, { commande = JOUET_PRETTIER, version = 0 } = {}) {
+  const f = join(d.racine, "bin", "pnpm");
+  writeFileSync(
+    f,
+    `#!/bin/sh
+echo "pnpm $*" >> ${JSON.stringify(join(d.racine, "faux-gh", "pnpm.log"))}
+case "$1 $2" in
+  "exec prettier") [ "$3" = --version ] && exit ${version}; ${commande} ;;
+  "exec commitlint") awk 'NR == 1 { l = $0 } END { exit !(l ~ /^[a-z]+(\\([^)]*\\))?!?: /) }' ;;
+  *) cat > /dev/null ;;
+esac
+`,
+  );
+  chmodSync(f, 0o755);
+}
+const pnpmJoue = (d) => {
+  const f = join(d.racine, "faux-gh", "pnpm.log");
+  return existsSync(f) ? readFileSync(f, "utf8") : "";
+};
+// Le sujet porte un fichier de code que le « Prettier » de develop ne laisse pas tel quel.
+const NON_FORMATE = { "apps/s.ts": 'export const s = "x";  \n' };
+const FORMATE = "export const s = 'x';\n";
+const retouche = (fichiers, message = "style: formate avec Prettier 3.9.10") => (d) => {
+  appliquer(d, fichiers);
+  d.commit(message);
+};
+function avecRetouche(options = {}) {
+  const r = miseAJour({ base: PRETTIER, sujetEnPlus: NON_FORMATE, ...options });
+  formateur(r.d, options.formateur);
+  return r;
+}
+const contient = (d, ancetre, tete) =>
+  spawnSync("git", ["merge-base", "--is-ancestor", ancetre, tete], { cwd: d.travail, env: d.env }).status === 0;
+const refusee = (d, r, avant, motif) => {
+  assert.equal(r.status, 4, r.stdout + r.stderr);
+  assert.match(r.stdout, motif);
+  assert.equal(sujetDistant(d), avant, "sujet inchangé");
+  assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ") || e.startsWith("PATCH ")), ecritures(d).join());
+  assert.equal(d.git("status", "--porcelain"), "", "worktree du capitaine propre");
+  assert.equal(d.git("rev-parse", "HEAD"), d.git("rev-parse", "origin/develop"), "worktree rendu à develop");
+};
+
+test("fusionner : une retouche de formatage prouvée par le formateur entre sans revue, par avance rapide, la fusion puis la retouche dans le sujet", () => {
+  const { d, sommet, sujet } = avecRetouche({ avantPush: retouche({ "apps/s.ts": FORMATE }) });
+  const r = d.lancer(SUJET, "fusionner", "81");
+  assert.equal(r.status, 0, r.stdout + r.stderr);
+  assert.match(r.stdout, /#81 fusionnée dans sujet\/lot par avance rapide/);
+  const tete = sujetDistant(d);
+  assert.ok(contient(d, sommet, tete), "le sommet de la PR est dans le sujet, tel quel");
+  assert.equal(d.git("rev-parse", `${sommet}^^1`), sujet, "premier parent de la fusion : l'ancien sommet du sujet");
+  assert.equal(d.git("log", "-1", "--format=%s", sommet), "style: formate avec Prettier 3.9.10");
+  assert.equal(d.git("show", `${tete}:apps/s.ts`) + "\n", FORMATE);
+  assert.match(pnpmJoue(d), /pnpm exec prettier --stdin-filepath apps\/s\.ts/);
+  assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
+  assert.equal(d.etat().pulls[0].state, "closed");
+  assert.equal(d.git("status", "--porcelain"), "");
+});
+
+test("fusionner : une retouche formatée autrement que par le formateur du dépôt exige la revue (sortie 4)", () => {
+  const { d, sujet } = avecRetouche({ avantPush: retouche({ "apps/s.ts": 'export const s = "x";\n' }) });
+  refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, /Revue.*apps\/s\.ts/);
+});
+
+test("fusionner : une retouche de formatage qui ajoute `// prettier-ignore` exige la revue (sortie 4)", () => {
+  const { d, sujet } = avecRetouche({ avantPush: retouche({ "apps/s.ts": `// prettier-ignore\n${FORMATE}` }) });
+  refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, /Revue.*apps\/s\.ts/);
+});
+
+// Garde indépendante de l'égalité : même un formateur qui écrirait la directive ne la fait pas entrer sans revue.
+test("fusionner : une directive de plus (eslint-disable) n'est jamais prouvée, même quand le formateur l'écrit", () => {
+  const ajoute = `{ printf '// eslint-disable-next-line\\n'; ${JOUET_PRETTIER}; }`;
+  const { d, sujet } = avecRetouche({
+    formateur: { commande: ajoute },
+    avantPush: retouche({ "apps/s.ts": `// eslint-disable-next-line\n${FORMATE}` }),
+  });
+  refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, /Revue.*apps\/s\.ts/);
+});
+
+test("fusionner : une retouche de code exige la revue, la section « Retouches » n'en dispense pas, une section de revue la fait entrer", () => {
+  const code = retouche({ "apps/s.ts": "export const s = 'y';\n" }, "fix(lot): s vaut y");
+  const retouches = "Met lot à jour avec develop.\n\n## Retouches\n\n- apps/s.ts : formatage Prettier 3.9.10\n";
+  const { d, sujet } = avecRetouche({ avantPush: code, body: retouches });
+  refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, /sans section « Revue de ticket » ni « Revue adversariale ».*apps\/s\.ts/);
+  const revue = avecRetouche({ avantPush: code, body: `${retouches}\n## Revue adversariale\n\nRien de bloquant.\n` });
+  const r = revue.d.lancer(SUJET, "fusionner", "81");
+  assert.equal(r.status, 0, r.stdout + r.stderr);
+  assert.ok(contient(revue.d, revue.sommet, sujetDistant(revue.d)));
+});
+
+test("fusionner : une PR de mise à jour d'une autre forme que « la fusion, puis des retouches » n'entre pas (deux fusions, retouche puis seconde fusion, retouche avant la fusion, message de retouche forgé ou hors Conventional Commits)", () => {
+  // develop avance encore, et la session le fusionne une seconde fois.
+  const secondeFusion = (d) => {
+    d.git("switch", "-q", "--detach", "origin/develop");
+    d.ecrire("docs/d2.md", "d2\n");
+    d.commit("docs: develop encore");
+    d.git("push", "-q", "origin", "HEAD:develop");
+    d.git("fetch", "-q", "origin");
+    d.git("switch", "-q", "maj/lot");
+    d.git("merge", "-q", "--no-edit", "origin/develop");
+  };
+  const cas = [
+    [{ avantPush: secondeFusion }, 4, /une seule fusion de develop dans sujet\/lot, son premier commit/],
+    [{ avantPush: (d) => (retouche({ "apps/s.ts": FORMATE })(d), secondeFusion(d)) }, 4, /une seule fusion/],
+    // Un commit ordinaire avant la fusion : ce n'est pas une PR de mise à jour ; le chemin ordinaire juge tout le
+    // develop apporté (apps/a.ts).
+    [{ avantFusion: retouche({ "docs/avant.md": "avant\n" }, "docs: avant") }, 4, /sans section .*\(apps\/a\.ts\)/],
+    [{ avantPush: retouche({ "apps/s.ts": FORMATE }, "style: formate\n\nSujet: sujet/fantome") }, 4, /retouche [0-9a-f]+ porte une ligne « Sujet: »/],
+    [{ avantPush: retouche({ "apps/s.ts": FORMATE }, "formatage") }, 4, /retouche [0-9a-f]+ refusé par commitlint/],
+  ];
+  for (const [options, sortie, motif] of cas) {
+    const { d } = avecRetouche(options);
+    const avant = sujetDistant(d);
+    const r = d.lancer(SUJET, "fusionner", "81");
+    assert.equal(r.status, sortie, r.stdout + r.stderr);
+    assert.match(r.stdout, motif);
+    assert.equal(sujetDistant(d), avant, "sujet inchangé");
+    assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
+    assert.equal(d.git("status", "--porcelain"), "");
+  }
+});
+
+test("fusionner : un dépôt sans Prettier dans son package.json ne dispense aucune retouche (revue exigée, aucun formateur joué)", () => {
+  const { d, sujet } = miseAJour({ sujetEnPlus: NON_FORMATE, avantPush: retouche({ "apps/s.ts": FORMATE }) });
+  formateur(d);
+  refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, /Revue.*apps\/s\.ts/);
+  assert.doesNotMatch(pnpmJoue(d), /exec prettier/);
+});
+
+// Comme une sous-PR : des en-têtes de ticket exigés par le gate (cas de fedora #1920) n'exigent pas de revue.
+test("fusionner : une retouche de documentation après la fusion entre sans revue ni formateur", () => {
+  const entete = "# SPEC_ALL_DEM-1.01\n\nStatus: en cours\nResponsable: session_a\nConducteur: session_b\nDépendances: —\n";
+  const { d, sommet } = miseAJour({ avantPush: retouche({ [TICKET]: entete }, "docs(demo): en-têtes exigés par le gate") });
+  formateur(d);
+  const r = d.lancer(SUJET, "fusionner", "81");
+  assert.equal(r.status, 0, r.stdout + r.stderr);
+  assert.ok(contient(d, sommet, sujetDistant(d)));
+  assert.equal(d.git("show", `${sujetDistant(d)}:${TICKET}`) + "\n", entete);
+  assert.doesNotMatch(pnpmJoue(d), /exec prettier/);
+});
+
+// Le pre-commit de la session (lint-staged) formate dans la fusion les fichiers qu'il indexe (fedora #1918, #1919).
+test("fusionner : une fusion dont l'écart hors conflit est prouvé par le formateur entre ; un autre écart hors conflit reste refusé", () => {
+  const formee = avecRetouche({ resolution: { "apps/s.ts": FORMATE } });
+  const r = formee.d.lancer(SUJET, "fusionner", "81");
+  assert.equal(r.status, 0, r.stdout + r.stderr);
+  assert.equal(formee.d.git("show", `${sujetDistant(formee.d)}:apps/s.ts`) + "\n", FORMATE);
+  for (const resolution of [{ "apps/s.ts": "export const s = 'y';\n" }, { [TICKET]: "# SPEC_ALL_DEM-1.01\n\nStatus: en cours\nDépendances: `paquet-pirate`\n" }]) {
+    const { d, sujet } = avecRetouche({ resolution, body: "## Revue adversariale\n\nRien.\n" });
+    refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, /hors des fichiers en conflit .* autre chose que le formatage/);
+  }
+});
+
+// Le formateur lit un fichier du dépôt (ici `docs/format.txt`, comme une configuration ou un greffon) : il est
+// joué sur la fusion recalculée, jamais sur ce que la PR écrit. Sinon la PR prouverait elle-même son code.
+test("fusionner : le formateur ne joue jamais un fichier que la PR écrit (règle de formatage réécrite dans une retouche ou dans la fusion)", () => {
+  const formateurDuDepot = { "docs/format.txt": `${JOUET_PRETTIER}\n` };
+  const pirate = { "docs/format.txt": "cat apps/s.ts\n", "apps/s.ts": "export const s = 'pirate';\n" };
+  const cas = [
+    [{ avantPush: retouche(pirate, "style: formate") }, /Revue.*apps\/s\.ts/],
+    // Joué sur la fusion de la PR, le formateur prouverait le code pirate : seul docs/format.txt resterait à juger.
+    [{ resolution: pirate }, /hors des fichiers en conflit \(apps\/s\.ts docs\/format\.txt \)/],
+  ];
+  for (const [options, motif] of cas) {
+    const { d, sujet } = avecRetouche({ base: { ...PRETTIER, ...formateurDuDepot }, formateur: { commande: "sh docs/format.txt" }, ...options });
+    refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, motif);
+  }
+});
+
+test("fusionner : rien d'autre n'est prouvé (mode changé, fichier créé ou supprimé, lockfile retouché, chemin cité par git)", () => {
+  const executable = (d) => {
+    appliquer(d, { "apps/s.ts": FORMATE });
+    chmodSync(join(d.travail, "apps/s.ts"), 0o755);
+    d.commit("style: formate");
+  };
+  const cas = [
+    [{ avantPush: executable }, /Revue.*apps\/s\.ts/],
+    [{ avantPush: retouche({ "apps/neuf.ts": "export const n = 'n';\n" }) }, /Revue.*apps\/neuf\.ts/],
+    [{ avantPush: retouche({ "apps/s.ts": null }) }, /Revue.*apps\/s\.ts/],
+    // Un lockfile retouché : le formateur n'est plus celui que verrouille le sommet, aucune dispense, même revue faite.
+    [{ resolution: { "apps/s.ts": FORMATE }, avantPush: retouche({ "pnpm-lock.yaml": "lockfileVersion: '9.0'\n" }, "chore: lockfile"), body: "## Revue adversariale\n\nRien.\n" }, /hors des fichiers en conflit/],
+    [{ sujetEnPlus: { 'apps/q"x.ts': 'export const q = "x";  \n' }, avantPush: retouche({ 'apps/q"x.ts': "export const q = 'x';\n" }) }, /Revue/],
+  ];
+  for (const [options, motif] of cas) {
+    const { d, sujet } = avecRetouche(options);
+    refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, motif);
+  }
+});
+
+test("fusionner : Prettier déclaré mais introuvable après pnpm install sort en 11 (côté capitaine), sans rien écrire", () => {
+  const { d, sujet } = avecRetouche({ formateur: { version: 1 }, avantPush: retouche({ "apps/s.ts": FORMATE }) });
+  const r = d.lancer(SUJET, "fusionner", "81");
+  assert.equal(r.status, 11, r.stdout + r.stderr);
+  assert.match(r.stdout, /Prettier déclaré mais introuvable/);
+  assert.equal(sujetDistant(d), sujet);
+  assert.deepEqual(ecritures(d), []);
+  assert.equal(d.git("status", "--porcelain"), "");
+});
+
+test("fusionner : des checks encore en cours sortent en 5 (reprise, aucun renvoi), des checks rouges en 3 avec leur nom", () => {
+  for (const [etat, sortie, motif] of [
+    ["IN_PROGRESS", 5, /checks encore en cours sur #81 : reprise au tour suivant/],
+    ["FAILURE", 3, /checks rouges sur #81 : qualite/],
+  ]) {
+    const { d, sujet } = miseAJour();
+    d.github({ checks: { "*": { qualite: etat } } });
+    const r = d.lancer(SUJET, "fusionner", "81");
+    assert.equal(r.status, sortie, r.stdout + r.stderr);
+    assert.match(r.stdout, motif);
+    assert.equal(sujetDistant(d), sujet);
+  }
+});
+
+// Un hook git du capitaine qui refuse tout push, posé après la publication des scripts.
+function prePushRefuse(d) {
+  const hooks = join(d.racine, "hooks");
+  mkdirSync(hooks, { recursive: true });
+  writeFileSync(join(hooks, "pre-push"), "#!/bin/sh\necho 'pnpm check rouge (formatage)' >&2\nexit 1\n");
+  chmodSync(join(hooks, "pre-push"), 0o755);
+  d.git("config", "core.hooksPath", hooks);
+}
+
+test("boucle.sh : une sous-PR que sujet.sh refuse en sortie 3 est renvoyée avec le motif de sujet.sh, jamais « conflit avec le sujet »", () => {
+  const { d } = sousPrEnConflit("index");
+  d.publierChaine();
+  prePushRefuse(d);
+  const r = d.lancer(BOUCLE);
+  assert.match(r.stdout, /RENVOI/, r.stdout + r.stderr);
+  const commentaire = d.etat().pulls[0].commentaires.at(-1);
+  assert.match(commentaire, /mise à jour de #80 refusée par le hook pre-push/);
+  assert.doesNotMatch(commentaire, /conflit avec le sujet/);
+});
+
+test("boucle.sh : un sujet dont la mise à jour est refusée par un hook se dit NON MIS À JOUR, jamais EN CONFLIT ; un vrai conflit reste SUJET EN CONFLIT", () => {
+  for (const conflit of [false, true]) {
+    const d = depotJouet();
+    d.ecrire("docs/f.md", "0\n");
+    d.commit("docs: base");
+    d.git("push", "-q", "origin", "HEAD:develop");
+    d.git("fetch", "-q", "origin");
+    d.branche("sujet/lot", "origin/develop", { [conflit ? "docs/f.md" : "docs/lot.md"]: "sujet\n" });
+    d.git("switch", "-q", "--detach", "origin/develop");
+    d.publierChaine();
+    d.branche("autre", "origin/develop", { "docs/f.md": "develop\n" });
+    d.git("push", "-q", "origin", "HEAD:develop");
+    d.git("fetch", "-q", "origin");
+    d.git("switch", "-q", "--detach", "origin/develop");
+    if (!conflit) prePushRefuse(d);
+    const r = d.lancer(BOUCLE);
+    if (conflit) assert.match(r.stdout, /\[sujet\/lot\] SUJET EN CONFLIT avec develop/, r.stdout + r.stderr);
+    else {
+      assert.match(r.stdout, /\[sujet\/lot\] SUJET NON MIS À JOUR \(sortie 3, aucun conflit\)/, r.stdout + r.stderr);
+      assert.doesNotMatch(r.stdout, /SUJET EN CONFLIT/);
+    }
+  }
+});
+
+// Relais de husky 9, simulé (la souche n'est pas dans le lockfile du plugin) : `core.hooksPath` vers un dossier dont
+// chaque hook joue `.husky/<hook>` tel qu'il est dans l'arbre de travail du capitaine, comme `.husky/_/h`. `observe` :
+// un chemin que chaque hook note dans `vu.log` s'il est alors dans l'arbre de travail.
+function relaisHusky(d, observe = null) {
+  const relais = join(d.racine, "relais-husky");
+  mkdirSync(relais, { recursive: true });
+  const note = observe ? `[ -e ${JSON.stringify(observe)} ] && echo "$(basename "$0")" >> ${JSON.stringify(join(d.racine, "vu.log"))}\n` : "";
+  for (const hook of ["post-checkout", "post-merge", "pre-commit", "post-commit"]) {
+    writeFileSync(join(relais, hook), `#!/bin/sh\n${note}h=".husky/$(basename "$0")"\n[ -f "$h" ] || exit 0\nexec sh -e "$h" "$@"\n`);
+    chmodSync(join(relais, hook), 0o755);
+  }
+  d.git("config", "core.hooksPath", relais);
+}
+const lu = (d, nom) => (existsSync(join(d.racine, nom)) ? readFileSync(join(d.racine, nom), "utf8") : "");
+
+// Relecture du 2026-11-16 (B1) : l'arbre de la PR n'est jamais extrait chez le capitaine, aucun hook ne se déclenche sur
+// lui. Sur 7.9.1, la même PR sort en 4 sans rien exécuter : la voie nouvelle ne doit rien exécuter de plus.
+test("fusionner : un hook (post-checkout, post-merge) que la fusion écrit hors conflit ne s'exécute jamais chez le capitaine, la PR sort en 4", () => {
+  const { d, sujet } = avecRetouche({
+    resolution: {
+      "apps/s.ts": FORMATE,
+      ".husky/post-checkout": "echo post-checkout >> ../piege.log\n",
+      ".husky/post-merge": "echo post-merge >> ../piege.log\n",
+    },
+  });
+  relaisHusky(d);
+  refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, /hors des fichiers en conflit \(\.husky\/post-checkout \.husky\/post-merge \) autre chose que le formatage/);
+  assert.match(pnpmJoue(d), /pnpm exec prettier --stdin-filepath apps\/s\.ts/, "le formateur a joué");
+  assert.equal(lu(d, "piege.log"), "", "aucun hook de la PR exécuté");
+});
+
+test("fusionner : un fichier sous node_modules/ que la fusion écrit hors conflit n'est jamais écrit dans le dépôt du capitaine, ni vu du formateur", () => {
+  const piege = "node_modules/.bin/prettier";
+  const { d, sujet } = avecRetouche({
+    resolution: { "apps/s.ts": FORMATE, [piege]: "#!/bin/sh\necho piege >> ../../../piege.log\n" },
+    formateur: { commande: `{ [ -e ${piege} ] && echo formateur >> ../vu.log; ${JOUET_PRETTIER}; }` },
+  });
+  relaisHusky(d, piege);
+  refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, /hors des fichiers en conflit \(node_modules\/\.bin\/prettier \)/);
+  assert.match(pnpmJoue(d), /pnpm exec prettier --stdin-filepath apps\/s\.ts/, "le formateur a joué");
+  assert.equal(lu(d, "vu.log"), "", "le fichier n'a jamais été dans l'arbre de travail du capitaine");
+  assert.ok(!existsSync(join(d.travail, piege)));
+});
+
+// Relecture du 2026-11-16 (B2) : une retouche intermédiaire entre telle quelle dans l'historique du sujet ; elle se
+// prouve contre son parent, et la revue juge l'union des fichiers touchés commit par commit.
+test("fusionner : chaque retouche se prouve contre son parent ; un fichier ajouté par une retouche puis retiré par une autre exige la revue", () => {
+  const cas = [
+    (d) => {
+      retouche({ "apps/pirate.ts": "export const p = 1;\n", ".github/workflows/x.yml": "on: push\n" }, "chore: ajoute")(d);
+      retouche({ "apps/pirate.ts": null, ".github/workflows/x.yml": null, "apps/s.ts": FORMATE })(d);
+    },
+    (d) => {
+      retouche({ "apps/pirate.ts": "export const p = 1;\n" }, "feat: pirate")(d);
+      retouche({ "apps/pirate.ts": null }, "chore: retire")(d);
+    },
+  ];
+  for (const avantPush of cas) {
+    const { d, sujet } = avecRetouche({ avantPush });
+    refusee(d, d.lancer(SUJET, "fusionner", "81"), sujet, /Revue.*\((\.github\/workflows\/x\.yml|apps\/pirate\.ts)\)/);
+  }
+});
+
+// Relecture du 2026-11-16 (mineure 1) : checks rouges ou lien sur un index, la PR est refusée sans que rien ne s'installe
+// ni ne formate.
+test("fusionner : une PR de mise à jour lit ses checks et ses liens sur les index avant toute preuve (rien installé, aucun formateur)", () => {
+  const lien = (d) => {
+    appliquer(d, { "apps/s.ts": FORMATE });
+    d.git("rm", "-q", `${ADR}/README.md`);
+    symlinkSync("../../README.md", join(d.travail, ADR, "README.md"));
+    d.commit("style: formate");
+  };
+  const cas = [
+    [retouche({ "apps/s.ts": FORMATE }), "FAILURE", 3, /checks rouges sur #81 : qualite/],
+    [lien, "SUCCESS", 4, /lien symbolique sur un index généré/],
+  ];
+  for (const [avantPush, etat, sortie, motif] of cas) {
+    const { d, sujet } = avecRetouche({ avantPush });
+    d.github({ checks: { "*": { qualite: etat } } });
+    const r = d.lancer(SUJET, "fusionner", "81");
+    assert.equal(r.status, sortie, r.stdout + r.stderr);
+    assert.match(r.stdout, motif);
+    assert.equal(sujetDistant(d), sujet);
+    assert.doesNotMatch(pnpmJoue(d), /pnpm (install|exec prettier)/);
+  }
+});
+
+// Relecture du 2026-11-16 (mineure 4) : une panne du capitaine ou de sujet.sh n'est pas un hook rouge à retoucher.
+test("boucle.sh : un sujet non mis à jour pour une panne du capitaine (sortie 11) ou une erreur de sujet.sh (69, 1) ne renvoie jamais à une PR de mise à jour", () => {
+  for (const [code, motif] of [
+    [11, /SUJET NON MIS À JOUR \(sortie 11, aucun conflit\) : outil du capitaine en échec.*rien à faire par une session/],
+    [69, /SUJET NON MIS À JOUR \(sortie 69, aucun conflit\) : erreur de sujet\.sh .* rien à faire par une session/],
+    [1, /SUJET NON MIS À JOUR \(sortie 1, aucun conflit\) : erreur de sujet\.sh .* rien à faire par une session/],
+  ]) {
+    const d = depotJouet();
+    d.ecrire("docs/f.md", "0\n");
+    d.commit("docs: base");
+    d.git("push", "-q", "origin", "HEAD:develop");
+    d.git("fetch", "-q", "origin");
+    d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "sujet\n" });
+    d.git("switch", "-q", "--detach", "origin/develop");
+    d.publierChaine();
+    // Le sujet.sh que la boucle copie d'origin/develop sort en <code> dès `rafraichir`.
+    const s = d.lire("scripts/chaine/sujet.sh");
+    assert.ok(s.includes("\nrafraichir() {\n"));
+    d.ecrire("scripts/chaine/sujet.sh", s.replace("\nrafraichir() {\n", `\nrafraichir() {\n  echo "panne simulée" >&2\n  exit ${code}\n`));
+    d.commit("chore: sujet.sh en panne");
+    d.git("push", "-q", "origin", "HEAD:develop");
+    d.git("fetch", "-q", "origin");
+    const r = d.lancer(BOUCLE);
+    assert.match(r.stdout, motif, r.stdout + r.stderr);
+    assert.doesNotMatch(r.stdout, /retouches|SUJET EN CONFLIT/);
+  }
+});
+
+test("refus.sh : une sortie 3 sans motif lisible se dit « refusée en sortie 3 », jamais « sortie 4 »", () => {
+  const d = depotJouet();
+  d.branche("feat/x", "origin/develop", { "docs/x.md": "x\n" });
+  d.github({ pulls: [{ number: 63, title: "docs(demo): x", head: "feat/x", base: "sujet/lot", labels: ["à-fusionner"] }] });
+  const r = d.lancer(scriptDe("fusionner", "refus.sh"), "63", "absent.txt", "3");
+  assert.equal(r.status, 0, r.stdout + r.stderr);
+  assert.match(r.stdout, /RENVOI : refusée en sortie 3, voir le journal du capitaine/);
+});
diff --git a/skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs b/skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs
index 08a4e44..19e3f35 100644
--- a/skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs
+++ b/skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs
@@ -248,3 +248,21 @@ test('pre-push du socle : sous un git worktree, pnpm ne voit ni GIT_DIR ni GIT_I
   assert.equal(gitWt('rev-parse', 'HEAD'), sommet, 'aucun commit « jouet » sur la branche du worktree');
   assert.notEqual(d.git('config', '--get', 'core.bare'), 'true');
 });
+
+// La PR de mise à jour avec retouches (en-tête de sujet.sh) : la fusion seule ne passe pas un `pnpm check` rouge
+// sur ce que develop apporte, la fusion suivie de sa retouche, poussée d'un arbre propre à son sommet, passe. Le hook
+// juge l'arbre de travail, pas chaque commit qui part.
+test("pre-push du socle : il juge l'arbre de travail, le sommet poussé d'un arbre propre : la fusion seule est refusée, suivie de sa retouche elle passe", () => {
+  const d = depotJouet();
+  writeFileSync(join(d.racine, 'bin', 'pnpm'), '#!/bin/sh\n[ "$*" = "run check" ] || exit 0\n! grep -rqs --exclude-dir=.git NON_FORMATE .\n');
+  writeFileSync(join(d.travail, 'a.ts'), 'NON_FORMATE\n');
+  d.git('add', '-A');
+  d.git('commit', '-q', '-m', 'chore: fusion');
+  const seule = spawnSync('git', ['push', '-q', 'origin', 'HEAD:refs/heads/maj/lot'], { cwd: d.travail, env: d.env });
+  assert.notEqual(seule.status, 0, 'la fusion seule est refusée');
+  writeFileSync(join(d.travail, 'a.ts'), 'formaté\n');
+  d.git('commit', '-q', '-am', 'style: formate');
+  const avec = spawnSync('git', ['push', '-q', 'origin', 'HEAD:refs/heads/maj/lot'], { cwd: d.travail, env: d.env });
+  assert.equal(avec.status, 0, avec.stderr.toString());
+  assert.equal(d.tetes()['refs/heads/maj/lot'], d.git('rev-parse', 'HEAD'));
+});
```

#### 1.b Les scripts

```diff
diff --git a/skills/chaine/fusionner/scripts/boucle.sh b/skills/chaine/fusionner/scripts/boucle.sh
index cb62d66..1bfc5dc 100755
--- a/skills/chaine/fusionner/scripts/boucle.sh
+++ b/skills/chaine/fusionner/scripts/boucle.sh
@@ -24,7 +24,13 @@
 # fusionner` la met à jour, régénère et pousse (sortie 8, MISE À JOUR) ; elle repasse CI verte.
 # Un conflit est annulé et signalé (SUJET EN CONFLIT), jamais résolu ici : une session le
 # résout dans une PR de mise à jour (en-tête de sujet.sh), que `sujet.sh fusionner` fait entrer par
-# avance rapide.
+# avance rapide. Une fusion sans conflit refusée par un contrôle (hook, dépendances, gate des index, sortie 3)
+# est annulée de même et dite SUJET NON MIS À JOUR, jamais SUJET EN CONFLIT : un pre-push rouge sur ce que
+# develop apporte se corrige par une PR de mise à jour avec retouches. Une panne du capitaine (sortie 11) ou de
+# sujet.sh (69, 1) se dit SUJET NON MIS À JOUR aussi, à corriger chez le capitaine, jamais par une session.
+# Une sous-PR que `sujet.sh fusionner` refuse en sortie 3 (checks rouges, conflit avec le sujet, hook) est
+# renvoyée avec le motif de `sujet.sh` (refus.sh) ; des checks encore en cours sortent en 5 (REPRISE, aucun
+# renvoi) : la PR reste dans la file tant que sa CI ne finit pas.
 # Un sujet « prêt à livrer » (plus de sous-PR, tickets faits) est livré par `sujet.sh
 # livrer-prets` (LIVRÉ), sauf label `sujet-manuel` sur une de ses sous-PR. La PR finale passe
 # par un commit de merge (passer.sh) : develop garde un commit par sous-PR.
@@ -236,15 +242,22 @@ traiter_rouges() {
 # develop dans chaque sujet ni livré (sa PR vers develop, passer.sh la tient à jour) ni actif
 # (une sous-PR ouverte : la mise à jour la remettrait en conflit avec la nouvelle tête).
 rafraichir_sujets() {
-  local nom sous verdict
+  local nom sous verdict rc
   bash "$SUJET" etat 2>/dev/null | tail -n +2 | while IFS="$(printf '\t')" read -r nom _ _ sous _ verdict; do
     case "$verdict" in livré*) continue ;; esac
     [ "$sous" = "—" ] || continue
     bash "$SUJET" rafraichir "$nom" --abandon-si-conflit 2>&1 | sed "s#^#[sujet/$nom] #"
-    case "${PIPESTATUS[0]}" in
+    rc=${PIPESTATUS[0]}
+    case "$rc" in
       0) ;;
+      2) echo "[sujet/$nom] SUJET EN CONFLIT avec develop : à résoudre par une session, PR de mise à jour vers sujet/$nom (en-tête de sujet.sh)" ;;
+      5) echo "[sujet/$nom] sujet bougé pendant la mise à jour : repris au tour suivant" ;;
       6) echo "[sujet/$nom] PAS PROPRE : worktree du capitaine à nettoyer, sujet laissé tel quel (aucun conflit)" ;;
-      *) echo "[sujet/$nom] SUJET EN CONFLIT avec develop : à résoudre par une session, PR de mise à jour vers sujet/$nom (en-tête de sujet.sh)" ;;
+      # Aucun conflit : la fusion de develop est refusée par un contrôle (hook, dépendances, gate des index).
+      3) echo "[sujet/$nom] SUJET NON MIS À JOUR (sortie 3, aucun conflit) : cause ci-dessus ; un hook rouge sur ce que develop apporte (pre-push, formateur monté) se corrige par une PR de mise à jour avec retouches vers sujet/$nom (en-tête de sujet.sh)" ;;
+      # Rien qu'une session puisse corriger : un outil du capitaine, ou sujet.sh lui-même (69 : jq absent ; 1 : erreur).
+      11) echo "[sujet/$nom] SUJET NON MIS À JOUR (sortie 11, aucun conflit) : outil du capitaine en échec, cause ci-dessus : à corriger chez le capitaine, rien à faire par une session" ;;
+      *) echo "[sujet/$nom] SUJET NON MIS À JOUR (sortie $rc, aucun conflit) : erreur de sujet.sh (69 : jq absent du poste ; 1 : erreur inattendue), cause ci-dessus : à corriger chez le capitaine, rien à faire par une session" ;;
     esac
   done
   git switch -q --detach origin/develop 2>/dev/null || true
@@ -291,9 +304,10 @@ traiter_sujets() {
         rc=${PIPESTATUS[0]}
         case "$rc" in
           0) echo "[#$n] FUSIONNÉE dans ${etat%%:*}" ;;
-          3) bash "$outils/renvoyer.sh" "$n" "fusion dans ${etat%%:*} refusée par GitHub (conflit avec le sujet) : fusionner ${etat%%:*} dans la branche et le résoudre" ;;
+          # Checks rouges, conflit avec le sujet, hook : le motif est celui de sujet.sh, jamais un conflit supposé.
+          3) bash "$outils/refus.sh" "$n" "$sortie" 3 ;;
           4) bash "$outils/refus.sh" "$n" "$sortie" ;; # corrigeable (titre, revue, base) : renvoyée
-          5) echo "[#$n] sous-PR bougée pendant sa mise à jour : reprise au tour suivant" ;;
+          5) echo "[#$n] REPRISE au tour suivant (sous-PR ou sujet bougé, checks en cours), aucun renvoi" ;;
           # Worktree du capitaine sale : rien que l'auteur puisse corriger, jamais un renvoi.
           6) echo "[#$n] PAS PROPRE : worktree du capitaine à nettoyer, sous-PR laissée dans la file (aucun renvoi)" ;;
           7) echo "[#$n] sous-PR non éligible (fermée ou en brouillon)" ;;
diff --git a/skills/chaine/fusionner/scripts/refus.sh b/skills/chaine/fusionner/scripts/refus.sh
index 5a8439d..a5f3edf 100755
--- a/skills/chaine/fusionner/scripts/refus.sh
+++ b/skills/chaine/fusionner/scripts/refus.sh
@@ -1,16 +1,19 @@
 #!/usr/bin/env bash
 # =============================================================================
-# Renvoie une PR refusée en sortie 4 (skill `fusionner`) : motif = dernière ligne de la sortie du
+# Renvoie une PR refusée en sortie 4 (skill `fusionner`), ou par `sujet.sh fusionner` en sortie 3 (checks rouges,
+# conflit avec le sujet, hook) : motif = dernière ligne de la sortie du
 # script qui a refusé (préfixe « [#n] » retiré), transmis tel quel à renvoyer.sh. Sans motif
-# lisible : « refusée en sortie 4, voir le journal du capitaine ». Un refus transitoire ou sans
-# correction possible sort en 7 de passer.sh et sujet.sh : il ne passe jamais ici.
+# lisible : « refusée en sortie <code>, voir le journal du capitaine » (code : 4 sans troisième
+# argument). Un refus transitoire ou sans correction possible sort en 7 de passer.sh et sujet.sh : il
+# ne passe jamais ici.
 #
-# Usage : bash scripts/chaine/refus.sh <numéro> <fichier de la sortie>
+# Usage : bash scripts/chaine/refus.sh <numéro> <fichier de la sortie> [<code de sortie>]
 # =============================================================================
 set -euo pipefail
-N=${1:?usage : refus.sh <numéro> <fichier>}
+N=${1:?usage : refus.sh <numéro> <fichier> [<code>]}
 fichier=${2:?fichier de la sortie manquant}
+code=${3:-4}
 outils=$(cd "$(dirname "$0")" && pwd)
 motif=$(grep -v '^[[:space:]]*$' "$fichier" 2>/dev/null | tail -1 | sed -E 's/^\[#[0-9]+\] //; s/[.[:space:]]+$//' || true)
-[ -n "$motif" ] || motif="refusée en sortie 4, voir le journal du capitaine"
+[ -n "$motif" ] || motif="refusée en sortie $code, voir le journal du capitaine"
 bash "$outils/renvoyer.sh" "$N" "$motif"
diff --git a/skills/chaine/sujet/scripts/sujet.sh b/skills/chaine/sujet/scripts/sujet.sh
index aedaab9..e374a46 100755
--- a/skills/chaine/sujet/scripts/sujet.sh
+++ b/skills/chaine/sujet/scripts/sujet.sh
@@ -18,9 +18,9 @@
 #   fusionner <pr>        squash d'une sous-PR dans son sujet : checks exigés verts sur son sommet,
 #                         titre qui passe commitlint
 #                         (lancé par le capitaine pour une sous-PR étiquetée `à-fusionner`) ;
-#                         PR de mise à jour (sa tête n'apporte que la fusion de develop dans le sujet, conflit
-#                         résolu) : entre par avance rapide, sans squash, si elle est exactement la résolution
-#                         (voir « PR de mise à jour » plus bas), sinon sortie 4
+#                         PR de mise à jour (la fusion de develop dans le sujet, conflit résolu, puis des
+#                         retouches) : entre par avance rapide, sans squash, si elle a cette forme (voir « PR de
+#                         mise à jour » plus bas), sinon sortie 4
 #   rafraichir <nom> [--abandon-si-conflit]
 #                         fusionne develop dans sujet/<nom> (jamais de rebase), index régénérés ;
 #                         `--abandon-si-conflit` (capitaine) annule la fusion au lieu de la laisser en cours
@@ -68,17 +68,18 @@
 #                         sort en 0 si le sujet est gelé, 1 sinon. Toute valeur non vide gèle, datée ou non
 #                         (ligne écrite à la main dans l'éditeur de GitHub)
 #
-# Sorties : 0 fait · 2 conflit · 3 checks rouges ou en cours, ou fusion, commit ou push refusé par un hook git
+# Sorties : 0 fait · 2 conflit · 3 checks rouges, ou fusion, commit ou push refusé par un hook git
 # (sa sortie sur stderr : la lire, corriger, jamais en sautant le hook ; le pre-push contrôle l'arbre de travail) · 4 refus corrigeable par l'auteur (sa
 # dernière ligne est le motif, `fusionner` : titre, commitlint, revue, lien symbolique sur un index généré, base ; `fusionner` et `relancer` : tête gardée, develop, main, la branche par défaut ou un sujet) · 6 arbre de travail pas
 # propre (`fusionner`, `rafraichir`, `regrouper`, `relancer` : à nettoyer par qui lance, jamais un renvoi de la PR,
 # comme la sortie 6 de passer.sh) · 7 `fusionner` d'une PR fermée, en brouillon ou d'un sujet gelé (rien à
 # corriger : sautée) · 9 `carte <nom>` refusée, ou `geler`/`degeler` dont le push échoue deux fois (rien n'est poussé)
 # `fusionner`, `rafraichir`, `relancer`, `livrer` : 5 la branche a bougé pendant l'écriture, relancer
-# `fusionner` encore : la sous-PR a bougé pendant sa mise à jour (reprise au tour suivant) · 8 conflit
+# `fusionner` encore : la sous-PR a bougé pendant sa mise à jour, ou ses checks sont encore en cours (reprise au
+# tour suivant, aucun renvoi : la PR reste dans la file tant que sa CI ne finit pas) · 8 conflit
 # avec le sujet sur des index générés seuls : branche mise à jour (index régénérés) et poussée, CI
 # relancée, aucun squash · 11 `fusionner` d'une PR de mise à jour : échec côté capitaine (git sans
-# `merge-tree --write-tree`, dépendances, régénération, commit ou push refusé), rien à corriger côté PR,
+# `merge-tree --write-tree`, dépendances, arbre du formateur, Prettier déclaré introuvable, régénération, commit ou push refusé), rien à corriger côté PR,
 # aucun renvoi · 69 jq absent du poste
 # Tout passe par l'API REST (`gh api`) : GraphQL est refusé depuis les sessions cloud. Depuis la
 # racine du dépôt ; sans argument, affiche cette aide.
@@ -532,43 +533,161 @@ refuser_tete_gardee() {
   fi
 }
 
-# PR de mise à jour d'un sujet : un conflit de code entre le sujet et develop, que `rafraichir` ne résout pas
-# (sortie 2) et qu'aucune session ne pousse (le hook refuse tout push vers sujet/…). Une session fille,
-# lancée pour ce geste, résout dans une branche de travail :
+# PR de mise à jour d'un sujet : develop fusionné dans le sujet par une session, quand le capitaine ne le peut pas
+# (`rafraichir`, sortie 2 : un conflit de code ; sortie 3 : une fusion sans conflit que les hooks refusent, par
+# exemple `pnpm check` rouge après la montée d'un formateur dans develop) et qu'aucune session ne pousse (le hook
+# refuse tout push vers sujet/…). Une session fille, lancée pour ce geste, la fait dans une branche de travail :
 #   git fetch origin develop sujet/<nom>
 #   git switch -c maj/<nom> origin/sujet/<nom>
-#   git merge origin/develop                 conflit résolu, puis `git add <fichiers résolus>` ; un index
-#                                            généré en conflit ne s'édite pas (le hook le refuse) :
-#                                            `git checkout --theirs -- <index>`, puis `git add <index>`, le
-#                                            capitaine le régénère
-#   git commit --no-edit                     message de git, sans ligne `Sujet:`
-#   git push origin HEAD:maj/<nom>, puis PR vers sujet/<nom>, titre `chore(sujet): met <nom> à jour avec
-#   develop`, étiquetée `à-fusionner`
-# Le capitaine la reconnaît : hors du sujet et de develop, sa tête n'apporte que des commits de fusion. Une
-# sous-PR qui porte un commit ordinaire garde le chemin ordinaire (sujet rafraîchi, puis squash).
+#   git merge origin/develop                 sans conflit, git committe la fusion ; sinon conflit résolu, puis
+#                                            `git add <fichiers résolus>` ; un index généré en conflit ne
+#                                            s'édite pas (le hook le refuse) : `git checkout --theirs -- <index>`,
+#                                            puis `git add <index>`, le capitaine le régénère
+#   pnpm install --frozen-lockfile --prefer-offline
+#                                            les outils de la fusion avant son commit : le pre-commit formate
+#                                            les fichiers qu'il indexe, avec le Prettier installé
+#   git commit --no-edit                     (conflit seulement) message de git, sans ligne `Sujet:`
+#   retouches                                commits ordinaires après la fusion, jamais une seconde fusion :
+#                                            ce que develop exige du sujet (`pnpm exec prettier --write <fichiers>`,
+#                                            en-têtes d'un ticket), message Conventional Commits sans ligne `Sujet:`
+#   git push origin HEAD:maj/<nom>           arbre propre : le pre-push joue `pnpm check` sur l'arbre de travail,
+#                                            le sommet, retouches comprises ; la fusion seule n'est jamais poussée.
+#                                            Il juge l'arbre de travail, pas ce qui part : `git push <sha>:maj/<nom>`
+#                                            depuis un autre arbre passe le hook ; seule la CI exigée sur le sommet,
+#                                            que `fusionner` lit, fait foi
+#   puis PR vers sujet/<nom>, titre `chore(sujet): met <nom> à jour avec develop`, étiquetée `à-fusionner`, une
+#   section « Retouches » (fichier, raison) pour le relecteur, que le capitaine ne lit jamais, et une section de
+#   revue si un fichier la demande (ci-dessous)
+# Le capitaine la reconnaît : hors du sujet et de develop, une fusion dont les deux parents sont hors de cette plage
+# (son premier commit). Une sous-PR dont la fusion vient après un commit ordinaire (le capitaine y a fusionné le
+# sujet) garde le chemin ordinaire (sujet rafraîchi, puis squash).
 est_mise_a_jour() {
-  [ -n "$(git rev-list --merges -n 1 "$1" "^origin/$2" ^origin/develop)" ] &&
-    [ -z "$(git rev-list --no-merges -n 1 "$1" "^origin/$2" ^origin/develop)" ]
+  local m
+  while IFS= read -r m; do
+    [ -n "$m" ] || continue
+    [ -n "$(git rev-list -n 1 "$m^@" "^origin/$2" ^origin/develop)" ] || return 0
+  done <<<"$(git rev-list --merges "$1" "^origin/$2" ^origin/develop)"
+  return 1
 }
 
-# Elle n'entre que si elle est exactement la résolution, sinon sortie 4 (motif à la session) : un seul
-# commit hors du sujet et de develop, son sommet ; un message sans ligne `Sujet:` ni `Merge pull request`
-# (`sujet_livre` les cherche dans les fusions de develop) ; une fusion à deux parents, le sommet du sujet
-# d'abord (avance rapide, et `livrer` lit le sujet par ses premiers parents), puis un commit de develop
-# absent du sujet ; un arbre qui ne s'écarte de la fusion recalculée (`git merge-tree`, git ≥ 2.38, comme
-# passer.sh) que sur les fichiers en conflit et les index régénérés. L'écart se lit sans détection des
-# renommages : un fichier supprimé derrière un chemin en conflit recréé compte. Rien d'autre n'entre par
-# cette voie : un fichier hors conflit (une ligne `Dépendances:`, du code) part en sous-PR, squashée comme
-# les autres. RESOLUTION : l'écart, index compris, et les fichiers en conflit, que lit la revue exigée.
-# Un outil du capitaine en échec (git sans `merge-tree --write-tree`) : sortie 11, rien à corriger côté PR.
+# Directives qui taisent un contrôle : un fichier qui en porte une de plus n'est jamais prouvé par le formateur.
+DIRECTIVES='prettier-ignore|eslint-disable|/\*[[:space:]]*eslint[[:space:]]|@ts-|istanbul[[:space:]]+ignore|[cv]8[[:space:]]+ignore|biome-ignore|Stryker[[:space:]]+disable'
+
+# pnpm joué dans le dossier du formateur (FORMATEUR, prouver_formatage), sans jamais remonter jusqu'à un dépôt git.
+formateur() { (cd "$FORMATEUR" && GIT_CEILING_DIRECTORIES=${FORMATEUR%/*} pnpm "$@"); }
+
+# Vrai si <après>:<f> est exactement ce que le formateur rend de <avant>:<f> : le fichier existe des deux côtés, en
+# fichier ordinaire de même mode, et ne porte aucune directive de plus. Les deux versions se lisent dans les objets
+# de git, jamais dans un arbre de travail.
+formate_comme() {
+  local avant=$1 apres=$2 f=$3 ma mb sortie
+  ma=$(git --literal-pathspecs ls-tree "$avant" -- "$f" | awk '{ print $1 }')
+  mb=$(git --literal-pathspecs ls-tree "$apres" -- "$f" | awk '{ print $1 }')
+  [ -n "$ma" ] && [ "$ma" = "$mb" ] && { [ "$ma" = 100644 ] || [ "$ma" = 100755 ]; } || return 1
+  [ "$(git cat-file blob "$apres:$f" | grep -cE "$DIRECTIVES" || true)" -le "$(git cat-file blob "$avant:$f" | grep -cE "$DIRECTIVES" || true)" ] ||
+    return 1
+  sortie=$(mktemp)
+  if git cat-file blob "$avant:$f" | formateur exec prettier --stdin-filepath "$f" >"$sortie" 2>/dev/null &&
+    git cat-file blob "$apres:$f" | cmp -s - "$sortie"; then
+    rm -f "$sortie"
+    return 0
+  fi
+  rm -f "$sortie"
+  return 1
+}
+
+# Le formateur du dépôt, joué pour prouver un formatage, sans rien extraire chez le capitaine. Son arbre, l'arbre
+# jugé : la fusion recalculée, chaque fichier en conflit pris dans la fusion de la PR (la résolution, jugée avant),
+# écrit par un index temporaire (`read-tree`, `update-index --cacheinfo`, `write-tree`), puis extrait par
+# `git archive | tar -x` dans un dossier temporaire hors du dépôt, où jouent `pnpm install --ignore-scripts` et
+# Prettier. Ni le worktree du capitaine ni aucune commande qui déclenche un hook (`switch`, `checkout`, `merge`,
+# `commit`) ne touchent cet arbre ni celui de la PR, et aucun hook n'est désactivé : on ne les déclenche pas. Rien de
+# ce que la PR écrit hors conflit ni aucune retouche n'y entre : une configuration, un greffon, un lockfile, un
+# `.husky/`, un `node_modules/` écrits par la PR ne s'exécutent jamais à leur propre jugement. Sa version : celle que
+# verrouille le sommet, car une retouche d'un lockfile ou d'un package.json ne dispense de rien. Aucune dispense (tout
+# reste à juger) : un dépôt sans `prettier` dans le package.json racine, un chemin que git cite entre guillemets, un
+# fichier en conflit qui n'est pas un fichier ordinaire dans la fusion de la PR.
+# Entrées : la fusion recalculée, la fusion, l'écart de la fusion hors conflit, les retouches (« commit<TAB>chemin »,
+# chaque fichier que chaque retouche touche), les fichiers en conflit. Sorties : HORS_NON, l'écart de la fusion que le
+# formateur ne prouve pas ; RETOUCHES_NON, les fichiers dont une retouche au moins n'est pas prouvée contre son parent.
+prouver_formatage() {
+  local n=$1 arbre=$2 m=$3 hors=$4 retouches=$5 conflits=$6 apres f c entree index juge
+  apres=$(cut -f2- <<<"$retouches" | sed '/^$/d' | sort -u)
+  HORS_NON=$hors
+  RETOUCHES_NON=$apres
+  ! grep -qE '(^|/)(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|\.npmrc|\.pnpmfile\.cjs)$' <<<"$hors"$'\n'"$apres" || return 0
+  ! grep -q '^"' <<<"$hors"$'\n'"$apres"$'\n'"$conflits" || return 0
+  FORMATEUR=$(mktemp -d)
+  index="$FORMATEUR.index"
+  local echec
+  echec() {
+    rm -rf "$FORMATEUR" "$index"
+    sortir 11 "$1, côté capitaine : #$n laissée dans la file"
+  }
+  GIT_INDEX_FILE=$index git read-tree "$arbre" || echec "arbre du formateur illisible"
+  while IFS= read -r f; do
+    [ -n "$f" ] || continue
+    entree=$(git --literal-pathspecs ls-tree "$m" -- "$f")
+    case $entree in
+      '') GIT_INDEX_FILE=$index git update-index --force-remove -- "$f" ;;
+      "100644 blob "* | "100755 blob "*)
+        GIT_INDEX_FILE=$index git update-index --add --cacheinfo "${entree%% *},$(cut -d ' ' -f3 <<<"${entree%%$'\t'*}"),$f" ;;
+      *) false ;;
+    esac || {
+      rm -rf "$FORMATEUR" "$index"
+      return 0
+    }
+  done <<<"$conflits"
+  juge=$(GIT_INDEX_FILE=$index git write-tree) || echec "arbre du formateur illisible"
+  rm -f "$index"
+  git archive "$juge" | tar -x -C "$FORMATEUR" || echec "arbre du formateur non extrait (git archive, tar)"
+  if jq -e '(.devDependencies.prettier // .dependencies.prettier) | type == "string"' "$FORMATEUR/package.json" >/dev/null 2>&1; then
+    formateur install --frozen-lockfile --prefer-offline --ignore-scripts >/dev/null 2>&1 </dev/null || echec "pnpm install en échec"
+    formateur exec prettier --version >/dev/null 2>&1 </dev/null || echec "Prettier déclaré mais introuvable après pnpm install"
+    HORS_NON=''
+    while IFS= read -r f; do
+      if [ -n "$f" ] && ! formate_comme "$arbre" "$m" "$f"; then HORS_NON+="$f"$'\n'; fi
+    done <<<"$hors"
+    HORS_NON=$(sed '/^$/d' <<<"$HORS_NON")
+    # Chaque retouche contre son parent : une retouche intermédiaire entre telle quelle dans l'historique du sujet.
+    # Un fichier en conflit est déjà à juger.
+    RETOUCHES_NON=''
+    while IFS=$'\t' read -r c f; do
+      [ -n "$f" ] || continue
+      ! grep -qxF -- "$f" <<<"$conflits" || continue
+      formate_comme "$c^" "$c" "$f" || RETOUCHES_NON+="$f"$'\n'
+    done <<<"$retouches"
+    RETOUCHES_NON=$(sed '/^$/d' <<<"$RETOUCHES_NON" | sort -u)
+  fi
+  rm -rf "$FORMATEUR"
+}
+
+# Elle n'entre que si elle a cette forme, sinon sortie 4 (motif à la session) :
+#   - hors du sujet et de develop, une seule fusion, son premier commit, puis des retouches l'une après l'autre ;
+#   - la fusion : un message sans ligne `Sujet:` ni `Merge pull request` (`sujet_livre` les cherche dans les fusions de
+#     develop), deux parents, le sommet du sujet d'abord (avance rapide, et `livrer` lit le sujet par ses premiers
+#     parents), puis un commit de develop absent du sujet ; un arbre qui ne s'écarte de la fusion recalculée (`git
+#     merge-tree`, git ≥ 2.38, comme passer.sh) que sur les fichiers en conflit, les index régénérés et des fichiers
+#     que le formateur prouve (le pre-commit de la session formate ceux qu'il indexe) ;
+#   - chaque retouche : un message sans ces lignes, que commitlint accepte (il entre tel quel dans develop).
+# L'écart se lit sans détection des renommages : un fichier supprimé derrière un chemin en conflit recréé compte.
+# A_JUGER, que `fusionner` passe à la revue exigée avant toute exécution : l'écart de la fusion hors conflit et hors
+# index ôté, index compris, et les fichiers en conflit. MAJ_* : la fusion, la fusion recalculée, les fichiers en
+# conflit, l'écart hors conflit (HORS), les retouches commit par commit et leur union (APRES), que juger_retouches lit
+# après les checks. Un outil du capitaine en échec (git sans `merge-tree --write-tree`) : sortie 11, rien à corriger
+# côté PR.
 verifier_mise_a_jour() {
-  local n=$1 sommet=$2 base=$3 s p1 p2 reste fusion rc arbre conflits ecart hors regeneres
+  local n=$1 sommet=$2 base=$3 s c f p1 p2 reste fusion rc ecart regeneres fichiers
+  local -a chaine
   s=$(git rev-parse "origin/$base")
-  [ "$(git rev-list --count "$sommet" "^origin/$base" ^origin/develop)" = 1 ] ||
-    sortir 4 "#$n, PR de mise à jour : une seule fusion de develop dans $base, rien d'autre ; une correction part ensuite en sous-PR"
-  ! grep -qE '^(- )?\**Sujet ?:|^Merge pull request' <<<"$(git log -1 --format=%B "$sommet")" ||
+  mapfile -t chaine < <(git rev-list --first-parent "$sommet" "^origin/$base" ^origin/develop)
+  [ "$(git rev-list --merges --count "$sommet" "^origin/$base" ^origin/develop)" = 1 ] &&
+    [ "${#chaine[@]}" = "$(git rev-list --count "$sommet" "^origin/$base" ^origin/develop)" ] ||
+    sortir 4 "#$n, PR de mise à jour : une seule fusion de develop dans $base, son premier commit, puis des retouches l'une après l'autre ; jamais une seconde fusion"
+  MAJ_M=${chaine[-1]}
+  ! grep -qE '^(- )?\**Sujet ?:|^Merge pull request' <<<"$(git log -1 --format=%B "$MAJ_M")" ||
     sortir 4 "#$n, PR de mise à jour : le message de la fusion porte une ligne « Sujet: » ou « Merge pull request » : refaire la fusion avec le message de git"
-  read -r _ p1 p2 reste <<<"$(git rev-list --parents -n 1 "$sommet")"
+  read -r _ p1 p2 reste <<<"$(git rev-list --parents -n 1 "$MAJ_M")"
   [ -n "$p2" ] && [ -z "$reste" ] ||
     sortir 4 "#$n, PR de mise à jour : une fusion à deux parents, le sommet de $base puis develop"
   [ "$p1" = "$s" ] ||
@@ -576,23 +695,50 @@ verifier_mise_a_jour() {
   if ! git merge-base --is-ancestor "$p2" origin/develop || git merge-base --is-ancestor "$p2" "$s"; then
     sortir 4 "#$n, PR de mise à jour : le second parent n'est pas un commit de develop absent de $base"
   fi
+  MAJ_RETOUCHES=''
+  for c in "${chaine[@]:0:${#chaine[@]}-1}"; do
+    ! grep -qE '^(- )?\**Sujet ?:|^Merge pull request' <<<"$(git log -1 --format=%B "$c")" ||
+      sortir 4 "#$n, PR de mise à jour : la retouche $(git rev-parse --short "$c") porte une ligne « Sujet: » ou « Merge pull request » : la retirer du message"
+    git log -1 --format=%B "$c" | pnpm exec commitlint >/dev/null 2>&1 ||
+      sortir 4 "#$n, PR de mise à jour : message de la retouche $(git rev-parse --short "$c") refusé par commitlint (Conventional Commits) : il entre tel quel dans $base"
+    # Chaque fichier que la retouche touche, contre son parent : un fichier ajouté puis retiré compte.
+    fichiers=$(git -c core.quotePath=false diff --no-renames --name-only "$c^" "$c") ||
+      sortir 11 "#$n : diff de la retouche $(git rev-parse --short "$c") illisible, côté capitaine : PR laissée dans la file"
+    while IFS= read -r f; do
+      [ -z "$f" ] || MAJ_RETOUCHES+="$c"$'\t'"$f"$'\n'
+    done <<<"$fichiers"
+  done
+  MAJ_APRES=$(cut -f2- <<<"$MAJ_RETOUCHES" | sed '/^$/d' | sort -u)
   fusion=$(git -c core.quotePath=false merge-tree --write-tree --name-only --no-messages "$p1" "$p2") && rc=0 || rc=$?
   [ "$rc" -le 1 ] || sortir 11 "#$n : git merge-tree --write-tree en échec (git ≥ 2.38 requis), côté capitaine : PR laissée dans la file"
-  arbre=$(sed -n 1p <<<"$fusion")
-  conflits=$(sed -n '2,$p' <<<"$fusion")
-  ecart=$(git -c core.quotePath=false diff --no-renames --name-only "$arbre" "$sommet") ||
+  MAJ_ARBRE=$(sed -n 1p <<<"$fusion")
+  MAJ_CONFLITS=$(sed -n '2,$p' <<<"$fusion")
+  ecart=$(git -c core.quotePath=false diff --no-renames --name-only "$MAJ_ARBRE" "$MAJ_M") ||
     sortir 11 "#$n : diff de la résolution illisible, côté capitaine : PR laissée dans la file"
   # La liste des index régénérés illisible (fonction absente, jq en échec) : jamais une garde ouverte. Un projet
   # sans index généré a une liste vide, `^()$`, qui ne prend aucun chemin.
   regeneres=$(index_regeneres_regex) && [ -n "$regeneres" ] ||
     sortir 11 "#$n : liste des index régénérés illisible (index_regeneres_regex de github.sh), côté capitaine : PR laissée dans la file"
   # Un chemin cité par git (`"apps/a\"b.ts"`) l'est de même dans les deux listes : la comparaison tient.
-  hors=$(comm -23 <(printf '%s\n' "$ecart" | grep -Ev "$regeneres" | sed '/^$/d' | sort -u) <(printf '%s\n' "$conflits" | sort -u))
-  [ -z "$hors" ] ||
-    sortir 4 "#$n, PR de mise à jour : elle écrit hors des fichiers en conflit ($(tr '\n' ' ' <<<"$hors")) : elle n'apporte que la résolution, le reste part en sous-PR"
+  MAJ_HORS=$(comm -23 <(printf '%s\n' "$ecart" | grep -Ev "$regeneres" | sed '/^$/d' | sort -u) <(printf '%s\n' "$MAJ_CONFLITS" | sort -u))
   # La revue porte sur l'écart et sur les fichiers en conflit : un conflit modifier/supprimer ou binaire dont la
   # résolution garde la version du sujet ne fait aucun écart avec l'arbre recalculé, qui la porte déjà.
-  RESOLUTION=$(printf '%s\n%s\n' "$ecart" "$conflits" | sed '/^$/d' | sort -u)
+  A_JUGER=$(comm -23 <(printf '%s\n%s\n' "$ecart" "$MAJ_CONFLITS" | sed '/^$/d' | sort -u) <(printf '%s\n' "$MAJ_HORS" | sed '/^$/d' | sort -u))
+}
+
+# Après les checks et les liens sur les index : rien du dépôt ne s'exécute pour une PR qu'ils refusent. Le formateur
+# ne joue que si la PR en a besoin (un écart hors conflit dans la fusion, ou une retouche que la revue exigerait sans
+# section) ; puis la revue exigée juge la résolution et toute retouche qu'il ne prouve pas, comme une sous-PR. La
+# section « Retouches » du corps n'est jamais lue.
+juger_retouches() {
+  local n=$1 motif
+  if [ -z "$MAJ_HORS" ] && juger "$(printf '%s\n%s\n' "$A_JUGER" "$MAJ_APRES")" >/dev/null; then
+    return 0
+  fi
+  prouver_formatage "$n" "$MAJ_ARBRE" "$MAJ_M" "$MAJ_HORS" "$MAJ_RETOUCHES" "$MAJ_CONFLITS"
+  [ -z "$HORS_NON" ] ||
+    sortir 4 "#$n, PR de mise à jour : elle écrit hors des fichiers en conflit ($(tr '\n' ' ' <<<"$HORS_NON")) autre chose que le formatage : la fusion n'apporte que la résolution, le reste vient en retouche, dans un commit après elle"
+  motif=$(juger "$(printf '%s\n%s\n' "$A_JUGER" "$RETOUCHES_NON" | sed '/^$/d' | sort -u)") || sortir 4 "#$n $motif"
 }
 
 # Avance rapide du sujet jusqu'à la PR de mise à jour vérifiée : index régénérés et contrôlés sur son sommet
@@ -655,20 +801,23 @@ fusionner() {
     sortir 4 "titre refusé par commitlint (Conventional Commits) : $titre"
   # Revue adversariale (ADR « chaîne de production »), comme au passage vers develop : la livraison
   # du sujet en est dispensée, c'est donc ici qu'on l'exige.
-  local revue motif fichiers maj=''
+  local revue motif fichiers corps maj=''
   revue="$ici/revue-exigee.mjs"
   [ -f "$revue" ] || revue="$ici/../../fusionner/scripts/revue-exigee.mjs"
+  corps=$(jq -r '.body // ""' <<<"$pr")
+  # Le contrat (chemins sensibles, fichier des critères) se lit sur le sujet, jamais dans la sous-PR.
+  juger() { printf '%s\n' "$1" | node "$revue" "$corps" "$titre" "origin/$base"; }
   git fetch -q origin develop "$base" "$(jq -r .head.ref <<<"$pr")"
-  # PR de mise à jour : la revue porte sur la résolution seule, pas sur le develop qu'elle apporte.
+  # PR de mise à jour : la revue porte d'abord sur la résolution seule, pas sur le develop apporté ; ses retouches
+  # se jugent après les checks (juger_retouches).
   if est_mise_a_jour "$sommet" "$base"; then
     verifier_mise_a_jour "$n" "$sommet" "$base"
     maj=1
-    fichiers=$RESOLUTION
+    fichiers=$A_JUGER
   else
     fichiers=$(git -c core.quotePath=false diff --no-renames --name-only "$(git merge-base "$sommet" "origin/$base")" "$sommet")
   fi
-  # Le contrat (chemins sensibles, fichier des critères) se lit sur le sujet, jamais dans la sous-PR.
-  motif=$(printf '%s\n' "$fichiers" | node "$revue" "$(jq -r '.body // ""' <<<"$pr")" "$titre" "origin/$base") || sortir 4 "#$n $motif"
+  motif=$(juger "$fichiers") || sortir 4 "#$n $motif"
   # Lien symbolique sur un index généré ou son dossier, que la PR ajoute ou change : la régénération du capitaine
   # (mise à jour, avance, rafraichir) écrirait à travers lui.
   motif=$(liens_sur_index "$sommet" "origin/$base") || sortir 4 "#$n $motif"
@@ -687,8 +836,9 @@ fusionner() {
     esac
   done <<<"$requis"
   [ -z "$rouges" ] || sortir 3 "checks rouges sur #$n :$rouges"
-  [ "$attente" = 0 ] || sortir 3 "checks encore en cours sur #$n : attendre leur fin"
+  [ "$attente" = 0 ] || sortir 5 "checks encore en cours sur #$n : reprise au tour suivant, aucun renvoi (la PR reste dans la file tant que la CI ne finit pas)"
   if [ -n "$maj" ]; then
+    juger_retouches "$n"
     avancer_sujet "$n" "$base" "$sommet"
     return 0
   fi
@@ -763,7 +913,7 @@ rafraichir() {
   case $statut in
     0) ;;
     5) git reset -q --hard "origin/$branche"; sortir 5 "$branche a bougé pendant la mise à jour : relancer" ;;
-    *) abandonner "push refusé par le hook pre-push (ou le distant) : sortie ci-dessus" ;;
+    *) abandonner "push refusé par le hook pre-push (ou le distant) : sortie ci-dessus ; ce que develop apporte ne passe pas les contrôles du sujet, une PR de mise à jour avec retouches le corrige (en-tête de sujet.sh)" ;;
   esac
   echo "$branche à jour avec develop ($(git rev-parse --short HEAD))"
 }
```

### 2. Les textes, mot pour mot

Dans le même patch (`git apply --index` du § 1 les porte) ; donnés ici à part pour la relecture. Six fichiers : `sujet/SKILL.md` (sorties, recette et règle, `:34`), `fusionner/SKILL.md:60` (filtre du `Monitor`, PR de mise à jour, sortie 3, `SUJET NON MIS À JOUR`), `sujet/references/CONTENU.md:9` (la voie et ses raisons), `fusionner/references/CONTENU.md:51` (les bancs), `socle-chaine-de-production/references/CONTENU.md:25` (le banc du pre-push), `chantier/SKILL.md:96` (le conducteur lance la fille aussi sur une sortie 3). L'en-tête de `sujet.sh` (recette, sorties 3, 5 et 11), celui de `boucle.sh` et celui de `refus.sh` sont dans le § 1.b.

```diff
diff --git a/skills/chaine/chantier/SKILL.md b/skills/chaine/chantier/SKILL.md
index c7f1d32..e643692 100644
--- a/skills/chaine/chantier/SKILL.md
+++ b/skills/chaine/chantier/SKILL.md
@@ -93,7 +93,7 @@ Puis : la vague dans la carte (ticket → session), `/compact`, et `send_later`
 3. Une PR renvoyée : vérifier que sa fille l'a vue (le capitaine la prévient), sinon `send_message`. Session inactive (`send_message` refusé) : relancer une fille sur la branche de la PR (`source_revision` = la branche) avec, en ligne de situation, le renvoi à lire dans les commentaires de la PR.
 4. Une question de fille : y répondre si la carte la tranche ; la trancher soi-même si elle est technique (décision `A-n` dans la carte) ; sinon la **réécrire** dans la forme de `chaine-de-production.md` § 2 (« Une question au produit » : le besoin en une phrase de métier, les options par leurs conséquences, la recommandation d'abord, aucun terme technique) et la remonter au produit par `AskUserQuestion` (dans un programme, à l'architecte par `send_message`). Jamais la question de la fille recopiée telle quelle. Une question en prose est restée 17 h sans réponse : le produit ne savait pas comment répondre ; une question en jargon a reçu « j'ai rien compris ».
 5. **Contre-revue du conducteur** sur toute PR qui touche un chemin sensible (`.claude/chaine.json`), par sous-agent, une fois le code poussé (pas sur le seul commit de réservation) ; des écarts réels ont été trouvés dans chacun des neuf tickets API relus, malgré la revue adversariale de la fille. Écart bloquant : `fusion-bloquée` et la liste à la fille, avant que le capitaine squashe. Le capitaine fusionne dès la CI verte, avant le réveil suivant. Pour un ticket `Label: contre-revue` (ou l'ancien `Label: architecte`), la fille livre **sans** `à-fusionner` ; le conducteur contre-relit, puis pose le label lui-même.
-6. Vague entièrement fusionnée dans le sujet → `git show --stat` du squash de chaque sous-PR : une PR étiquetée avant que son push aboutisse entre avec son seul commit de réservation. Puis `bash scripts/chaine/sujet.sh rafraichir <nom>` : entre deux vagues aucune sous-PR n'est ouverte, c'est le moment de recevoir develop. Conflit de code (sortie 2) : `git merge --abort`, puis il lance une session fille pour ce geste, qui ouvre la PR de mise à jour du sujet (en-tête de `sujet.sh`) ; il ne résout jamais lui-même. Le capitaine la fait entrer avant la vague suivante. Puis, pour chaque fille de la vague dont la PR est fusionnée : `get_session`, sa ligne dans la section `## Coût` de la carte (§ 7), **puis `archive_session`**. C'est le conducteur qui archive ses filles, pas le capitaine : le capitaine ne veille que sur sa file, et quatre filles finies sont restées ouvertes. Une fille qui attend une réponse ou dont la PR est renvoyée ne s'archive pas. Le registre transverse `docs/agents/couts.md` en est régénéré à la fusion suivante (index généré) : il donne à tout moment le coût de production de tous les chantiers. Puis vague suivante (§ 5), `Phase: 4-vague-<k+1>`. Sinon `send_later` à 45 min.
+6. Vague entièrement fusionnée dans le sujet → `git show --stat` du squash de chaque sous-PR : une PR étiquetée avant que son push aboutisse entre avec son seul commit de réservation. Puis `bash scripts/chaine/sujet.sh rafraichir <nom>` : entre deux vagues aucune sous-PR n'est ouverte, c'est le moment de recevoir develop. Conflit de code (sortie 2) : `git merge --abort`, puis il lance une session fille pour ce geste, qui ouvre la PR de mise à jour du sujet (en-tête de `sujet.sh`) ; il ne résout jamais lui-même. Fusion refusée sans conflit par un hook (sortie 3, par exemple `pnpm check` rouge après la montée d'un formateur dans develop) : de même, une session fille ouvre la PR de mise à jour avec ses retouches. Le capitaine la fait entrer avant la vague suivante. Puis, pour chaque fille de la vague dont la PR est fusionnée : `get_session`, sa ligne dans la section `## Coût` de la carte (§ 7), **puis `archive_session`**. C'est le conducteur qui archive ses filles, pas le capitaine : le capitaine ne veille que sur sa file, et quatre filles finies sont restées ouvertes. Une fille qui attend une réponse ou dont la PR est renvoyée ne s'archive pas. Le registre transverse `docs/agents/couts.md` en est régénéré à la fusion suivante (index généré) : il donne à tout moment le coût de production de tous les chantiers. Puis vague suivante (§ 5), `Phase: 4-vague-<k+1>`. Sinon `send_later` à 45 min.
 7. Le produit (ou l'architecte) demande l'avancement : la sortie de `node scripts/docs/avancement.mjs sujet/<nom>` (pourcentage de tickets faits, PR, CI, bloqués). Pas de réexamen.
 
 ## Arrêter un chantier
diff --git a/skills/chaine/fusionner/SKILL.md b/skills/chaine/fusionner/SKILL.md
index 3acaf8e..5908c8e 100644
--- a/skills/chaine/fusionner/SKILL.md
+++ b/skills/chaine/fusionner/SKILL.md
@@ -57,7 +57,7 @@ La veille s'arrête d'elle-même, et sa fin réveille la session :
 - **`VEILLE FINIE`** (sortie 0) : durée écoulée (110 min, sous la limite de 2 h d'une tâche de fond). La relancer telle quelle.
 - **`VEILLE ARRÊTÉE`** : la boucle est sortie en code non nul (`ARRÊT` : gates, install, CI bloquée), et la veille avec le même code. Traiter le cas (suite par code : en-tête de `passer.sh`), puis relancer la veille. Sortie 9 : une autre boucle tient le verrou, ne rien relancer avant de savoir laquelle ; sortie 10 : arrêt demandé, `--reprendre` quand on veut repartir.
 
-Suivre le journal avec un `Monitor` filtré sur `VEILLE FINIE|VEILLE ARRÊTÉE|FUSIONNÉE|MISE À JOUR|sortie=|ARRÊT|conflit|rouges|RELANCE|RENVOI|REGROUPÉE|RECIBLÉE|SUJET EN CONFLIT|LIVRÉ|REFUS|PAS PROPRE|ÉCHEC DU CAPITAINE`. La boucle traite seule les sorties 2 à 5 de `passer.sh` et la CI rouge (une relance, puis renvoi) ; un refus corrigeable (sortie 4 : titre trop long ou refusé par commitlint, revue adversariale absente, base hors `sujet/`, tête gardée : `develop`, `main`, la branche par défaut, ou un sujet pour une sous-PR ; sortie 4 de `sujet.sh relancer` comprise) renvoie la PR avec son motif (`refus.sh`) ; une PR non éligible sans correction possible (sortie 7 : fermée, brouillon, sans label, déjà `fusion-bloquée`, empilée sur une parente non fusionnée) est sautée sans bruit. Un worktree du capitaine pas propre n'est jamais un renvoi : sortie 6 de `passer.sh` (arrêt) comme de `sujet.sh fusionner`, `relancer`, `rafraichir` ou `regrouper` (`PAS PROPRE`, sous-PR laissée dans la file) ; le nettoyer, puis relancer. Une livraison de sujet, tête `sujet/<nom>` ou `livraison/<nom>-<date>`, passe avant `prio:haute`. Une sous-PR en conflit avec son sujet **sur des index générés seuls** n'est pas renvoyée : `sujet.sh fusionner` la met à jour, régénère et pousse (sortie 8, `MISE À JOUR`) ; elle repasse au tour suivant, CI verte. Une PR de mise à jour d'un sujet (sa tête n'apporte que la fusion de develop, conflit résolu par une session fille : en-tête de `sujet.sh`) entre par avance rapide, sans squash, et le capitaine la ferme (`FUSIONNÉE`) ; d'une autre forme, elle est renvoyée avec son motif (sortie 4) ; un échec de ses outils (git sans `merge-tree --write-tree`, dépendances, régénération, push refusé) sort en 11, `ÉCHEC DU CAPITAINE`, sans renvoi : le capitaine lit la cause et la corrige chez lui. Sur un `RENVOI`, le capitaine prévient la session. Les renvois se comptent sur la PR (marque invisible dans chaque commentaire de `renvoyer.sh`, comptée seulement sous le compte qui tient le capitaine, `gh api user` ; ce compte illisible, toute PR se lit au plafond, et `file.sh` le dit une fois) : au plafond (`plafonds.renvoisParPR`, 3), le commentaire et la ligne `RENVOI n sur 3` disent que la PR attend un humain, et `file.sh` la montre `humain` : ni passée, ni relancée, ni renvoyée. Une PR d'un sujet gelé (`Gel:` de sa carte : sous-PR, livraison ou PR à recibler) se lit `gelée`, avant `humain`, et reçoit le même traitement ; `sujet.sh fusionner` d'une telle sous-PR sort en 7. Le gel se lève d'une ligne (`sujet.sh degeler`). Sur l'ordre d'un humain, le capitaine la passe à la main (`passer.sh <n>`, ou `sujet.sh fusionner <n>` pour une sous-PR) ; le compte ne se remet pas à zéro.
+Suivre le journal avec un `Monitor` filtré sur `VEILLE FINIE|VEILLE ARRÊTÉE|FUSIONNÉE|MISE À JOUR|sortie=|ARRÊT|conflit|rouges|RELANCE|RENVOI|REGROUPÉE|RECIBLÉE|SUJET EN CONFLIT|SUJET NON MIS À JOUR|REPRISE|LIVRÉ|REFUS|PAS PROPRE|ÉCHEC DU CAPITAINE`. La boucle traite seule les sorties 2 à 5 de `passer.sh` et la CI rouge (une relance, puis renvoi) ; un refus corrigeable (sortie 4 : titre trop long ou refusé par commitlint, revue adversariale absente, base hors `sujet/`, tête gardée : `develop`, `main`, la branche par défaut, ou un sujet pour une sous-PR ; sortie 4 de `sujet.sh relancer` comprise) renvoie la PR avec son motif (`refus.sh`) ; une PR non éligible sans correction possible (sortie 7 : fermée, brouillon, sans label, déjà `fusion-bloquée`, empilée sur une parente non fusionnée) est sautée sans bruit. Un worktree du capitaine pas propre n'est jamais un renvoi : sortie 6 de `passer.sh` (arrêt) comme de `sujet.sh fusionner`, `relancer`, `rafraichir` ou `regrouper` (`PAS PROPRE`, sous-PR laissée dans la file) ; le nettoyer, puis relancer. Une livraison de sujet, tête `sujet/<nom>` ou `livraison/<nom>-<date>`, passe avant `prio:haute`. Une sous-PR en conflit avec son sujet **sur des index générés seuls** n'est pas renvoyée : `sujet.sh fusionner` la met à jour, régénère et pousse (sortie 8, `MISE À JOUR`) ; elle repasse au tour suivant, CI verte. Une PR de mise à jour d'un sujet (la fusion de develop par une session fille, puis ses retouches : en-tête de `sujet.sh`) entre par avance rapide, sans squash, et le capitaine la ferme (`FUSIONNÉE`) ; un fichier retouché n'y entre sans revue que si le formateur du dépôt le prouve à chaque retouche qui le touche, joué hors du worktree du capitaine sur l'arbre déjà jugé et après les checks, tout autre est jugé comme une sous-PR ; d'une autre forme, elle est renvoyée avec son motif (sortie 4) ; un échec de ses outils (git sans `merge-tree --write-tree`, dépendances, arbre du formateur, Prettier déclaré introuvable, régénération, push refusé) sort en 11, `ÉCHEC DU CAPITAINE`, sans renvoi : le capitaine lit la cause et la corrige chez lui. Une sous-PR que `sujet.sh fusionner` refuse en sortie 3 (checks rouges, conflit avec le sujet, hook) est renvoyée avec le motif de `sujet.sh`, jamais un conflit supposé ; des checks encore en cours sortent en 5 (`REPRISE`, aucun renvoi : la PR reste dans la file tant que sa CI ne finit pas). Un sujet dont la mise à jour avec develop est refusée sans conflit se dit `SUJET NON MIS À JOUR`, pas `SUJET EN CONFLIT` : un hook, des dépendances ou le gate des index (sortie 3) se corrigent par une PR de mise à jour avec retouches, une panne du capitaine (sortie 11) ou de `sujet.sh` (69, 1) chez le capitaine, jamais par une session. Sur un `RENVOI`, le capitaine prévient la session. Les renvois se comptent sur la PR (marque invisible dans chaque commentaire de `renvoyer.sh`, comptée seulement sous le compte qui tient le capitaine, `gh api user` ; ce compte illisible, toute PR se lit au plafond, et `file.sh` le dit une fois) : au plafond (`plafonds.renvoisParPR`, 3), le commentaire et la ligne `RENVOI n sur 3` disent que la PR attend un humain, et `file.sh` la montre `humain` : ni passée, ni relancée, ni renvoyée. Une PR d'un sujet gelé (`Gel:` de sa carte : sous-PR, livraison ou PR à recibler) se lit `gelée`, avant `humain`, et reçoit le même traitement ; `sujet.sh fusionner` d'une telle sous-PR sort en 7. Le gel se lève d'une ligne (`sujet.sh degeler`). Sur l'ordre d'un humain, le capitaine la passe à la main (`passer.sh <n>`, ou `sujet.sh fusionner <n>` pour une sous-PR) ; le compte ne se remet pas à zéro.
 
 **Sans veille en cours** (capitaine démarré avant que `veille.sh` soit posé, veille arrêtée et pas encore relancée), qui pose `à-fusionner` prévient le capitaine par `send_message` : `docs/agents/chaine-de-production.md` § 2.
 
diff --git a/skills/chaine/fusionner/references/CONTENU.md b/skills/chaine/fusionner/references/CONTENU.md
index 800fb2f..b0a0ab6 100644
--- a/skills/chaine/fusionner/references/CONTENU.md
+++ b/skills/chaine/fusionner/references/CONTENU.md
@@ -48,4 +48,4 @@ Les messages de commit jugés par la CI, jumeau du hook `commit-msg` : `node scr
 
 ## Les tests
 
-`commits-a-relire.test.mjs`, sur un dépôt jouet et un faux `commitlint` : le choix des commits d'une PR de mise à jour (le vieux titre de develop ne la rougit plus, sans `--hors` il la rougit, un commit fautif propre à la PR reste refusé), une PR vers develop et un push inchangés, le clone superficiel refusé, une réf introuvable ou un usage invalide, le point d'entrée par lien symbolique (aussi sous `--preserve-symlinks-main`, dossier à espace et accent), et le banc isolé de `GIT_*` (un `GIT_DIR` hérité d'un hook ne fait écrire aucun `git` dans le dépôt visé). `fusionner.test.mjs` et `revue-exigee.test.mjs`, sur le dépôt jouet du skill `sujet` : ordre de la file, conflit d'index régénéré, conflit de code jamais résolu, pile dont la parente est squashée, checks exigés rouges ou non exigés, renvoi, titre trop long, boucle qui renvoie et saute, revue exigée lue sans renommage ni guillemets (script déplacé hors de `scripts/`, code à nom accentué), livraison intermédiaire dont une suppression se cache derrière un index généré ajouté renvoyée à la revue, livraison dont un index sans `commande` est celui de develop dispensée, d'un autre contenu ou retiré renvoyée à la revue, et de même quand la liste des index régénérés ne se lit pas ; `revue-exigee.test.mjs` : un chemin de code cité entre guillemets par git exige la revue, la configuration que la chaîne exécute ou lit aussi, la casse ne la contourne pas, `cheminLu` décite comme git cite, rien de ce que la règle d'avant exigeait n'en est dispensé, `CLAUDE.md`, `CLAUDE.local.md`, `docs/agents/` et le fichier des critères l'exigent (un index généré littéral à `commande` de `docs/agents/` non, une chaîne nue ou un motif si), un fichier exécutable et un nom de configuration à toute profondeur l'exigent, un chemin NFD touche son motif NFC, une base de sujet ajoute le contrat de develop, un chemin sensible lu dans la base l'exige, un contrat de base illisible l'exige pour tout chemin, la parité avec le gate, et la CLI qui lit le contrat dans la base, pas dans la PR ; `fusionner.test.mjs` encore : une PR vers develop qui touche la configuration de la chaîne ou du code d'une autre casse sans section de revue renvoyée, de même pour un chemin sensible du projet (même retiré de `chaine.json` par la PR), le fichier des critères, un `CLAUDE.md` et `docs/agents/`, un index généré remplacé par un lien symbolique (absolu ou relatif) refusé sans rien écrire à travers lui, le même lien déjà dans develop qui arrête la régénération (sortie 3) sans renvoyer la PR, une livraison intermédiaire qui ajoute ou réécrit un fichier sous un index déclaré par motif renvoyée à la revue, et dont un tel fichier est celui de develop dispensée. `identifiant.test.mjs` : chaque commande du point d'entrée, l'ancienne forme refusée, la grammaire trouvée dans chaque disposition et la sortie 6 sans elle. `github.test.mjs` : les contrôles de `regenerer_index` (ordre, dédoublonnage, échec qui annule `rafraichir`). `fusionner.test.mjs` encore : la livraison intermédiaire mise à jour puis relancée reste un commit de merge, un commit ajouté dessus la renvoie à la revue, le corps du merge nomme le sujet ; les scripts sous les hooks git du jouet (aucun saut) : `passer.sh` sur un conflit d'index sous des hooks de banc (pre-commit, commit-msg, pre-push), un pre-commit, un pre-push ou un commit-msg qui refuse (sortie 3, sortie du hook sur stderr, distant inchangé) ; le contenu du `pre-commit` du socle (lint-staged lit l'index, `check:commit` ne voit ni `GIT_DIR` ni `GIT_INDEX_FILE`, depuis un worktree) est éprouvé contre le gabarit par `scripts/pre-commit-socle.test.mjs` du plugin, qui n'est pas posé ; `sujet.sh` (`fusionner`, `ouvrir`, `livrer` intermédiaire, `rafraichir`, `relancer`, `geler`) qui réveille le pre-push et sort en 3 quand il refuse. `sujet-fusionner.test.mjs` : la sous-PR en conflit sur un index mise à jour (sortie 8), le conflit de code renvoyé, la boucle qui ne renvoie pas, le worktree du capitaine pas propre (sortie 6, aucun renvoi) ; la PR de mise à jour d'un sujet entrée par avance rapide (develop en second parent, index régénérés, aucun squash, PR fermée), refusée (sortie 4, sujet inchangé) quand elle écrit hors des fichiers en conflit (ligne `Dépendances:`, suppression cachée derrière un renommage, index sans commande), quand le sujet a avancé, quand develop est son premier parent, quand son message porte une ligne `Sujet:` ou `Merge pull request` ou quand sa résolution de code n'a pas de revue (chemin cité par git, conflit modifier/supprimer ou binaire gardé compris), d'un sujet gelé (sortie 7), jamais poussée sur un sujet qui bouge (sortie 5, le commit de l'autre session reste), un git sans `merge-tree --write-tree` (sortie 11, la boucle ne la renvoie pas), une liste des index régénérés illisible (sortie 11) et un projet sans index généré (rien n'y est dispensé), passée par la boucle (`FUSIONNÉE`) ; une sous-PR qui déplace un script hors de `scripts/` exige la revue ; une sous-PR qui touche la configuration de la chaîne ou du code d'une autre casse sans section de revue sort en 4, une sous-PR qui remplace un index généré par un lien symbolique sort en 4, et `rafraichir` ne régénère jamais à travers un lien déjà dans le sujet (sortie 3, rien d'écrit hors du dépôt) ; un chemin sensible lu dans le `chaine.json` du sujet exige la revue d'une sous-PR, et de même un chemin que develop déclare après le départ du sujet. `boucle-outils.test.mjs`, sur des scripts de remplacement publiés sur le develop du jouet : un script modifié sur develop pendant la boucle joué au tour suivant, `boucle.sh` modifié relancée une seule fois, la copie du worktree jamais jouée, `origin/develop` introuvable arrêtée sans rien jouer, la grammaire copiée à côté des outils et son absence arrêtée (6) ; seconde boucle refusée (9), y compris après l'`exec` de relance, `--arreter` pendant un tour (143, fichier posé, aucun second passage), fichier d'arrêt lu à chaque tour et avant `livrer-prets` (10), relance refusée tant qu'il existe, `--reprendre` (et refusé pendant qu'une boucle tient le verrou), trappe qui remet propre un worktree en pleine fusion, orphelins d'une boucle tuée par `kill -9` arrêtés par le groupe noté, option inconnue (64) ; les autres suites de la boucle publient les vrais scripts par `publierChaine()`. `migrations-ordre.test.mjs` : la règle (horodatage, pas de 10 minutes qui passe l'heure, le jour et l'année, refus et horodatage proposé), la forme Prisma à 14 chiffres (règle et CLI), `passer.sh` qui refuse sans fusionner, `sujet.sh livrer` qui n'ouvre aucune PR. `veille.test.mjs`, avec des doublures de `boucle.sh` et `file.sh` : relance sur une PR prête ou rouge, pas sur « CI en cours », une seule relance pour une PR sautée, PR sans CI reprise, `VEILLE FINIE`, `VEILLE ARRÊTÉE`.
+`commits-a-relire.test.mjs`, sur un dépôt jouet et un faux `commitlint` : le choix des commits d'une PR de mise à jour (le vieux titre de develop ne la rougit plus, sans `--hors` il la rougit, un commit fautif propre à la PR reste refusé), une PR vers develop et un push inchangés, le clone superficiel refusé, une réf introuvable ou un usage invalide, le point d'entrée par lien symbolique (aussi sous `--preserve-symlinks-main`, dossier à espace et accent), et le banc isolé de `GIT_*` (un `GIT_DIR` hérité d'un hook ne fait écrire aucun `git` dans le dépôt visé). `fusionner.test.mjs` et `revue-exigee.test.mjs`, sur le dépôt jouet du skill `sujet` : ordre de la file, conflit d'index régénéré, conflit de code jamais résolu, pile dont la parente est squashée, checks exigés rouges ou non exigés, renvoi, titre trop long, boucle qui renvoie et saute, revue exigée lue sans renommage ni guillemets (script déplacé hors de `scripts/`, code à nom accentué), livraison intermédiaire dont une suppression se cache derrière un index généré ajouté renvoyée à la revue, livraison dont un index sans `commande` est celui de develop dispensée, d'un autre contenu ou retiré renvoyée à la revue, et de même quand la liste des index régénérés ne se lit pas ; `revue-exigee.test.mjs` : un chemin de code cité entre guillemets par git exige la revue, la configuration que la chaîne exécute ou lit aussi, la casse ne la contourne pas, `cheminLu` décite comme git cite, rien de ce que la règle d'avant exigeait n'en est dispensé, `CLAUDE.md`, `CLAUDE.local.md`, `docs/agents/` et le fichier des critères l'exigent (un index généré littéral à `commande` de `docs/agents/` non, une chaîne nue ou un motif si), un fichier exécutable et un nom de configuration à toute profondeur l'exigent, un chemin NFD touche son motif NFC, une base de sujet ajoute le contrat de develop, un chemin sensible lu dans la base l'exige, un contrat de base illisible l'exige pour tout chemin, la parité avec le gate, et la CLI qui lit le contrat dans la base, pas dans la PR ; `fusionner.test.mjs` encore : une PR vers develop qui touche la configuration de la chaîne ou du code d'une autre casse sans section de revue renvoyée, de même pour un chemin sensible du projet (même retiré de `chaine.json` par la PR), le fichier des critères, un `CLAUDE.md` et `docs/agents/`, un index généré remplacé par un lien symbolique (absolu ou relatif) refusé sans rien écrire à travers lui, le même lien déjà dans develop qui arrête la régénération (sortie 3) sans renvoyer la PR, une livraison intermédiaire qui ajoute ou réécrit un fichier sous un index déclaré par motif renvoyée à la revue, et dont un tel fichier est celui de develop dispensée. `identifiant.test.mjs` : chaque commande du point d'entrée, l'ancienne forme refusée, la grammaire trouvée dans chaque disposition et la sortie 6 sans elle. `github.test.mjs` : les contrôles de `regenerer_index` (ordre, dédoublonnage, échec qui annule `rafraichir`). `fusionner.test.mjs` encore : la livraison intermédiaire mise à jour puis relancée reste un commit de merge, un commit ajouté dessus la renvoie à la revue, le corps du merge nomme le sujet ; les scripts sous les hooks git du jouet (aucun saut) : `passer.sh` sur un conflit d'index sous des hooks de banc (pre-commit, commit-msg, pre-push), un pre-commit, un pre-push ou un commit-msg qui refuse (sortie 3, sortie du hook sur stderr, distant inchangé) ; le contenu du `pre-commit` du socle (lint-staged lit l'index, `check:commit` ne voit ni `GIT_DIR` ni `GIT_INDEX_FILE`, depuis un worktree) est éprouvé contre le gabarit par `scripts/pre-commit-socle.test.mjs` du plugin, qui n'est pas posé ; `sujet.sh` (`fusionner`, `ouvrir`, `livrer` intermédiaire, `rafraichir`, `relancer`, `geler`) qui réveille le pre-push et sort en 3 quand il refuse. `sujet-fusionner.test.mjs` : la sous-PR en conflit sur un index mise à jour (sortie 8), le conflit de code renvoyé, la boucle qui ne renvoie pas, le worktree du capitaine pas propre (sortie 6, aucun renvoi) ; la PR de mise à jour d'un sujet entrée par avance rapide (develop en second parent, index régénérés, aucun squash, PR fermée), refusée (sortie 4, sujet inchangé) quand elle écrit hors des fichiers en conflit (ligne `Dépendances:`, suppression cachée derrière un renommage, index sans commande), quand le sujet a avancé, quand develop est son premier parent, quand son message porte une ligne `Sujet:` ou `Merge pull request` ou quand sa résolution de code n'a pas de revue (chemin cité par git, conflit modifier/supprimer ou binaire gardé compris), d'un sujet gelé (sortie 7), jamais poussée sur un sujet qui bouge (sortie 5, le commit de l'autre session reste), un git sans `merge-tree --write-tree` (sortie 11, la boucle ne la renvoie pas), une liste des index régénérés illisible (sortie 11) et un projet sans index généré (rien n'y est dispensé), passée par la boucle (`FUSIONNÉE`) ; ses retouches (ticket 40) : une retouche de formatage prouvée entre sans revue, chaque retouche prouvée contre son parent (un fichier ajouté par l'une puis retiré par une autre exige la revue), un hook (`post-checkout`, `post-merge`) ou un `node_modules/` écrit hors conflit par la fusion jamais extrait ni exécuté chez le capitaine (relais de husky simulé), checks et liens sur les index lus avant toute preuve (rien installé, aucun formateur pour une PR refusée en 3 ou en 4), formatée autrement, avec `prettier-ignore` ou une directive que le formateur écrirait, de code (même avec une section « Retouches »), créée, supprimée, de mode changé, à chemin cité ou dans un dépôt sans Prettier exige la revue, une section de revue fait entrer une retouche de code, une retouche de documentation entre sans formateur, deux fusions, une retouche avant la fusion ou au message forgé ou hors Conventional Commits refusées, une fusion formatée hors conflit entre et tout autre écart de la fusion reste refusé, un lockfile retouché ne dispense de rien, le formateur ne joue jamais un fichier que la PR écrit (règle de formatage réécrite), Prettier déclaré introuvable sort en 11 ; des checks en cours sortent en 5 et des checks rouges en 3 ; la boucle renvoie une sortie 3 avec le motif de `sujet.sh` et dit `SUJET NON MIS À JOUR` d'un sujet refusé par un hook, `SUJET EN CONFLIT` d'un vrai conflit, et ne renvoie jamais à une PR de mise à jour une panne du capitaine (11) ou de `sujet.sh` (69, 1) ; `refus.sh` sans motif lisible nomme la sortie reçue (3), jamais 4 ; une sous-PR qui déplace un script hors de `scripts/` exige la revue ; une sous-PR qui touche la configuration de la chaîne ou du code d'une autre casse sans section de revue sort en 4, une sous-PR qui remplace un index généré par un lien symbolique sort en 4, et `rafraichir` ne régénère jamais à travers un lien déjà dans le sujet (sortie 3, rien d'écrit hors du dépôt) ; un chemin sensible lu dans le `chaine.json` du sujet exige la revue d'une sous-PR, et de même un chemin que develop déclare après le départ du sujet. `boucle-outils.test.mjs`, sur des scripts de remplacement publiés sur le develop du jouet : un script modifié sur develop pendant la boucle joué au tour suivant, `boucle.sh` modifié relancée une seule fois, la copie du worktree jamais jouée, `origin/develop` introuvable arrêtée sans rien jouer, la grammaire copiée à côté des outils et son absence arrêtée (6) ; seconde boucle refusée (9), y compris après l'`exec` de relance, `--arreter` pendant un tour (143, fichier posé, aucun second passage), fichier d'arrêt lu à chaque tour et avant `livrer-prets` (10), relance refusée tant qu'il existe, `--reprendre` (et refusé pendant qu'une boucle tient le verrou), trappe qui remet propre un worktree en pleine fusion, orphelins d'une boucle tuée par `kill -9` arrêtés par le groupe noté, option inconnue (64) ; les autres suites de la boucle publient les vrais scripts par `publierChaine()`. `migrations-ordre.test.mjs` : la règle (horodatage, pas de 10 minutes qui passe l'heure, le jour et l'année, refus et horodatage proposé), la forme Prisma à 14 chiffres (règle et CLI), `passer.sh` qui refuse sans fusionner, `sujet.sh livrer` qui n'ouvre aucune PR. `veille.test.mjs`, avec des doublures de `boucle.sh` et `file.sh` : relance sur une PR prête ou rouge, pas sur « CI en cours », une seule relance pour une PR sautée, PR sans CI reprise, `VEILLE FINIE`, `VEILLE ARRÊTÉE`.
diff --git a/skills/chaine/socle-chaine-de-production/references/CONTENU.md b/skills/chaine/socle-chaine-de-production/references/CONTENU.md
index 8b0c6c5..43b38ef 100644
--- a/skills/chaine/socle-chaine-de-production/references/CONTENU.md
+++ b/skills/chaine/socle-chaine-de-production/references/CONTENU.md
@@ -22,7 +22,7 @@ Les sept mots du protocole entre les skills, créés en REST, idempotent. Un pro
 
 ## La branche `develop` — `scripts/github/develop.sh`
 
-Créée sur le distant depuis `origin/main`, une fois, puis rapatriée : la couverture du diff et la revue comparent à `origin/develop`. Par `git push` sous le hook pre-push, jamais en le sautant : le push ne porte que `origin/main`, déjà sur le distant, et le pre-push du socle (`husky/pre-push`) sort 0 quand rien de neuf ne part (chaque commit connu des refs de suivi du distant visé, puis de ses branches lues par `git ls-remote --heads` : une ref de suivi se fabrique sur place). Un `.husky/pre-push` antérieur au socle 7.0.1 jouerait `pnpm check` sur l'arbre de travail — pas ce qui part — et `coverage-diff` chercherait `origin/develop` comme base : la branche que ce push crée (refus, sortie 2, vu le 2026-11-09) ; le reposer, jamais le sauter. La commande tapée à la main reste à éviter : le script est idempotent et donne ses sorties. L'API GitHub (`POST git/refs`) ne convient pas : le proxy des sessions cloud la refuse (403), comme pour `sujet.sh ouvrir`. Sorties : 4 précondition (pas de `origin`, `main` absente du distant), 5 push refusé, 6 distant injoignable (`ls-remote` ou `fetch` en échec : jamais pris pour une `main` absente). Idempotent ; testé dans le plugin (`develop.test.mjs`, dépôt jouet sous le pre-push du socle, avec un faux `pnpm` : develop créée, rien joué ; le hook seul : commit neuf contrôlé, entrée vide ou illisible contrôlée, suppression sans contrôle, ref de suivi fabriquée sur place ou distant nommé par son URL contrôlés, worktree sans `GIT_DIR`, variables du capitaine (`PASSER_OUTILS`, `BOUCLE_*`) retirées avant les contrôles). Limites du pre-push : un commit déjà sur une branche du distant passe sans contrôle local, la CI exigée le rejoue sur la PR ; la confirmation ouvre une seconde connexion au distant, et en interactif une seconde authentification peut être demandée ; quand le distant a un `pushurl` distinct de son URL de lecture, ou qu'un `url.<x>.pushInsteadOf` réécrit celle du push, la confirmation lit l'URL de lecture, pas celle où part le push ; une greffe locale (`.git/info/grafts`) peut faire croire au hook que le distant connaît le commit : le push échoue alors au transport, rien n'arrive sur le distant ; les variables du capitaine ne sont retirées que pour ses contrôles, pas pour un banc lancé à la main (le dépôt jouet des bancs les retire lui-même) ; un hook sauté (`HUSKY=0`, `core.hooksPath`) ne joue rien du tout. La frontière reste la CI exigée.
+Créée sur le distant depuis `origin/main`, une fois, puis rapatriée : la couverture du diff et la revue comparent à `origin/develop`. Par `git push` sous le hook pre-push, jamais en le sautant : le push ne porte que `origin/main`, déjà sur le distant, et le pre-push du socle (`husky/pre-push`) sort 0 quand rien de neuf ne part (chaque commit connu des refs de suivi du distant visé, puis de ses branches lues par `git ls-remote --heads` : une ref de suivi se fabrique sur place). Un `.husky/pre-push` antérieur au socle 7.0.1 jouerait `pnpm check` sur l'arbre de travail — pas ce qui part — et `coverage-diff` chercherait `origin/develop` comme base : la branche que ce push crée (refus, sortie 2, vu le 2026-11-09) ; le reposer, jamais le sauter. La commande tapée à la main reste à éviter : le script est idempotent et donne ses sorties. L'API GitHub (`POST git/refs`) ne convient pas : le proxy des sessions cloud la refuse (403), comme pour `sujet.sh ouvrir`. Sorties : 4 précondition (pas de `origin`, `main` absente du distant), 5 push refusé, 6 distant injoignable (`ls-remote` ou `fetch` en échec : jamais pris pour une `main` absente). Idempotent ; testé dans le plugin (`develop.test.mjs`, dépôt jouet sous le pre-push du socle, avec un faux `pnpm` : develop créée, rien joué ; le hook seul : commit neuf contrôlé, entrée vide ou illisible contrôlée, suppression sans contrôle, ref de suivi fabriquée sur place ou distant nommé par son URL contrôlés, l'arbre de travail jugé et non chaque commit qui part (une fusion refusée seule passe suivie de sa retouche, ce qu'exige la PR de mise à jour de `sujet.sh`), worktree sans `GIT_DIR`, variables du capitaine (`PASSER_OUTILS`, `BOUCLE_*`) retirées avant les contrôles). Limites du pre-push : un commit déjà sur une branche du distant passe sans contrôle local, la CI exigée le rejoue sur la PR ; la confirmation ouvre une seconde connexion au distant, et en interactif une seconde authentification peut être demandée ; quand le distant a un `pushurl` distinct de son URL de lecture, ou qu'un `url.<x>.pushInsteadOf` réécrit celle du push, la confirmation lit l'URL de lecture, pas celle où part le push ; une greffe locale (`.git/info/grafts`) peut faire croire au hook que le distant connaît le commit : le push échoue alors au transport, rien n'arrive sur le distant ; les variables du capitaine ne sont retirées que pour ses contrôles, pas pour un banc lancé à la main (le dépôt jouet des bancs les retire lui-même) ; un hook sauté (`HUSKY=0`, `core.hooksPath`) ne joue rien du tout. La frontière reste la CI exigée.
 
 ## La CI — `ci/ci.yml`
 
diff --git a/skills/chaine/sujet/SKILL.md b/skills/chaine/sujet/SKILL.md
index d057efb..7d40636 100644
--- a/skills/chaine/sujet/SKILL.md
+++ b/skills/chaine/sujet/SKILL.md
@@ -31,7 +31,7 @@ Le sujet se **déclare au découpage** : `Sujet: sujet/<nom>` en tête de la spe
 
 ## Commandes
 
-Chaque commande, son effet et ses sorties : en-tête de `sujet.sh` ; `sujet.sh` sans argument affiche l'aide. Sorties : 0 fait · 2 conflit · 3 checks rouges ou en cours · 4 refus corrigeable par l'auteur · 6 arbre de travail pas propre (`fusionner`, `rafraichir`, `regrouper`, `relancer` : à nettoyer par qui lance, jamais un renvoi de la PR) · 7 sautée · 9 `carte <nom>` refusée, ou `geler`/`degeler` dont le push échoue deux fois. `fusionner` a deux sorties de plus : 5, la sous-PR a bougé pendant sa mise à jour (reprise au tour suivant) ; 8, la sous-PR était en conflit avec son sujet **sur des index générés seuls** — le capitaine a fusionné le sujet dans sa branche (merge, avance rapide, jamais de force), régénéré les index, poussé : CI relancée, aucun squash, la boucle la laisse dans la file (`MISE À JOUR`). Un conflit hors index reste un renvoi (sortie 3). Un conflit de code entre le sujet et develop (`rafraichir`, sortie 2 ; `SUJET EN CONFLIT` de la boucle) ne se pousse pas : une session fille, lancée pour ce geste (jamais le conducteur ni le capitaine), le résout dans une **PR de mise à jour** : `git fetch origin develop sujet/<nom>`, `git switch -c maj/<nom> origin/sujet/<nom>`, `git merge origin/develop`, conflit résolu puis `git add <fichiers résolus>` (un index généré en conflit ne s'édite pas : `git checkout --theirs -- <index>`, puis `git add <index>`, le capitaine le régénère), `git commit --no-edit`, push de la branche, PR vers `sujet/<nom>` titrée `chore(sujet): met <nom> à jour avec develop`, `à-fusionner`. `fusionner` la fait entrer par avance rapide, sans squash : la filiation de develop reste, et le capitaine ferme la PR en nommant le sommet. Elle n'entre que si elle n'apporte que cette fusion (message de git, sans ligne `Sujet:`), le sommet du sujet en premier parent et en second un commit de develop absent du sujet, et n'écrit que dans les fichiers en conflit (et les index qui ont une `commande`, régénérés) ; sinon sortie 4, motif à la session. Sa revue exigée porte sur ce qu'elle écrit et sur les fichiers en conflit (`git show --remerge-diff <sommet>`) : comme pour une sous-PR, la liste est celle de `revue-exigee.mjs` (skill `fusionner`) : une résolution qui n'y est pas (une ligne `Gel:` ou `Dépendances:` en conflit, un Markdown de `docs/`) n'en exige pas. Un sujet qui bouge pendant l'avance la laisse dehors (sortie 5, rien d'écrasé, jamais de force) ; un échec côté capitaine (git, dépendances, régénération, push) sort en 11, sans renvoi.
+Chaque commande, son effet et ses sorties : en-tête de `sujet.sh` ; `sujet.sh` sans argument affiche l'aide. Sorties : 0 fait · 2 conflit · 3 checks rouges · 4 refus corrigeable par l'auteur · 6 arbre de travail pas propre (`fusionner`, `rafraichir`, `regrouper`, `relancer` : à nettoyer par qui lance, jamais un renvoi de la PR) · 7 sautée · 9 `carte <nom>` refusée, ou `geler`/`degeler` dont le push échoue deux fois. `fusionner` a deux sorties de plus : 5, la sous-PR a bougé pendant sa mise à jour ou ses checks sont encore en cours (reprise au tour suivant, aucun renvoi : la PR reste dans la file tant que sa CI ne finit pas) ; 8, la sous-PR était en conflit avec son sujet **sur des index générés seuls** — le capitaine a fusionné le sujet dans sa branche (merge, avance rapide, jamais de force), régénéré les index, poussé : CI relancée, aucun squash, la boucle la laisse dans la file (`MISE À JOUR`). Un conflit hors index reste un renvoi (sortie 3). Un conflit de code entre le sujet et develop (`rafraichir`, sortie 2 ; `SUJET EN CONFLIT` de la boucle), ou une fusion sans conflit que les hooks refusent (sortie 3 ; `SUJET NON MIS À JOUR` : un `pnpm check` rouge sur ce que develop apporte, un formateur monté), ne se pousse pas : une session fille, lancée pour ce geste (jamais le conducteur ni le capitaine), la fait dans une **PR de mise à jour** : `git fetch origin develop sujet/<nom>`, `git switch -c maj/<nom> origin/sujet/<nom>`, `git merge origin/develop`, conflit résolu puis `git add <fichiers résolus>` (un index généré en conflit ne s'édite pas : `git checkout --theirs -- <index>`, puis `git add <index>`, le capitaine le régénère), `pnpm install --frozen-lockfile --prefer-offline` (le pre-commit formate avec le Prettier installé), `git commit --no-edit` ; puis les **retouches**, des commits ordinaires après la fusion, jamais une seconde fusion (`pnpm exec prettier --write <fichiers>`, en-têtes exigés par un gate), messages Conventional Commits sans ligne `Sujet:` ; push de la branche d'un arbre propre (le pre-push joue `pnpm check` sur l'arbre de travail : le sommet, retouches comprises ; la fusion seule n'est jamais poussée ; il juge l'arbre de travail, pas ce qui part : un `git push <sha>:maj/<nom>` depuis un autre arbre passe le hook, seule la CI exigée sur le sommet fait foi), PR vers `sujet/<nom>` titrée `chore(sujet): met <nom> à jour avec develop`, une section « Retouches » (fichier, raison) pour le relecteur, `à-fusionner`. `fusionner` la fait entrer par avance rapide, sans squash : la filiation de develop reste, et le capitaine ferme la PR en nommant le sommet. Elle n'entre que si son premier commit hors du sujet et de develop est la fusion, seule (message de git, sans ligne `Sujet:`), le sommet du sujet en premier parent et en second un commit de develop absent du sujet, et que la fusion n'écrit que dans les fichiers en conflit, les index qui ont une `commande` (régénérés) et des fichiers que le formateur prouve ; sinon sortie 4, motif à la session. Un fichier retouché entre **sans revue** s'il est prouvé : sa version au sommet est exactement ce que Prettier, à la version que verrouille le sommet, rend de sa version dans la fusion, sans directive de plus (`prettier-ignore`, `eslint-disable`, `@ts-…`) ; le formateur est joué par le capitaine sur l'arbre jugé (la fusion recalculée et la résolution des conflits), jamais sur ce que la PR écrit, après les checks exigés, sans rien extraire dans son worktree ni déclencher aucun hook (index temporaire, `git archive` vers un dossier hors du dépôt) ; chaque retouche se prouve contre son parent, et un fichier qu'une retouche touche sans preuve est jugé, même retiré par une autre ; un dépôt sans `prettier` dans son `package.json` n'a aucune dispense. Tout autre fichier retouché est jugé comme une sous-PR. La section « Retouches » n'est jamais lue pour dispenser. Sa revue exigée porte sur la résolution, sur les fichiers en conflit (`git show --remerge-diff <fusion>`) et sur les retouches non prouvées (`git log -p --first-parent <fusion>..<sommet>`, commit par commit) : comme pour une sous-PR, la liste est celle de `revue-exigee.mjs` (skill `fusionner`) : une résolution ou une retouche qui n'y est pas (une ligne `Gel:` ou `Dépendances:`, un Markdown de `docs/`) n'en exige pas. Un sujet qui bouge pendant l'avance la laisse dehors (sortie 5, rien d'écrasé, jamais de force) ; un échec côté capitaine (git, dépendances, Prettier déclaré introuvable, régénération, push) sort en 11, sans renvoi.
 
 ## Geler un chantier (`geler`, `degeler`, `gel`)
 
diff --git a/skills/chaine/sujet/references/CONTENU.md b/skills/chaine/sujet/references/CONTENU.md
index 4dc72d8..b0425ce 100644
--- a/skills/chaine/sujet/references/CONTENU.md
+++ b/skills/chaine/sujet/references/CONTENU.md
@@ -6,7 +6,7 @@ Une commande par geste : `demarrer`, `ouvrir`, `fusionner`, `rafraichir`, `livre
 
 `carte <nom>` est, avec `geler` et `degeler` (qui ne changent que la ligne `Gel:` de la carte, par plomberie et sans force), le seul geste d'écriture d'une session sur un sujet, car le hook d'agent refuse tout `git push` vers `sujet/…` : sans ce refus, une session écrirait elle-même la ligne `Dépendances:` qui l'autorise. La commande ne laisse passer que des mises à jour en place de la carte qui déclare déjà ce sujet (statut `M`, mode 100644, un seul fichier par commit, ligne `Sujet:` qui nomme ce sujet avant et après, seul ou parmi plusieurs, Prettier passé) et pousse le sommet qu'elle a vérifié, sans force ; tout le reste sort en 9. Cas vécu : un commit pouvait créer sur le sujet une seconde carte que `phase_carte` aurait lue la première, ou réécrire la carte d'un autre sujet pour citer celui-ci.
 
-La PR de mise à jour (`fusionner`) fait entrer dans un sujet la résolution d'un conflit de code avec develop : `rafraichir` s'arrête sur ce conflit (sortie 2), la session ne pousse pas le sujet, et le squash d'une telle PR perdait la filiation de develop. Elle passe par le capitaine, comme toute sous-PR (gel, titre, revue, checks exigés), puis entre par un `git push` simple du sommet de la PR sur le sujet (avance rapide), et le capitaine ferme la PR. La forme est vérifiée : un seul commit hors du sujet et de develop, au message sans ligne `Sujet:` ni `Merge pull request` (`sujet_livre` les lit dans les fusions de develop), une fusion dont le premier parent est le sommet du sujet et le second un commit de develop, un arbre qui ne s'écarte de la fusion recalculée par `git merge-tree` (git ≥ 2.38, comme `passer.sh`) que sur les fichiers en conflit et les index générés qui ont une `commande` (régénérés, donc écrasés ; un index sans commande ne l'est jamais). L'écart se lit sans détection des renommages : sinon un conflit renommage/renommage laissait recréer le chemin d'origine avec le contenu d'un script de garde et supprimer ce script, la suppression cachée derrière le chemin recréé. La revue exigée lit l'écart et les fichiers en conflit : un conflit modifier/supprimer ou binaire dont la résolution garde la version du sujet ne fait aucun écart. Une liste des index régénérés illisible sort en 11, jamais une garde ouverte. Elle n'ouvre rien que `fusionner` n'ouvrait : une sous-PR aux checks verts et revue entrait déjà, squashée, avec un contenu quelconque ; la PR de mise à jour n'apporte que develop et la résolution des fichiers en conflit, et un sujet qui bouge refuse son push (sortie 5). Un outil du capitaine en échec sort en 11 : la boucle le dit (`ÉCHEC DU CAPITAINE`) et ne renvoie pas la PR, car le conseil d'un renvoi (« fusionner le sujet dans la branche ») lui ferait une seconde fusion, refusée ensuite. Le hook d'agent ne change pas : il ne lit pas le `git push` de `sujet.sh`, et refuse toujours le push d'une session vers `sujet/…`. Pas d'option `rafraichir --depuis <branche>` : le hook la laisserait lancer par toute session, sans checks ni revue. La revue exigée d'une sous-PR se lit de même sans renommage et sans guillemets (`core.quotePath=false`) : un script déplacé hors de `scripts/`, ou un fichier de code à nom accentué, que git citait entre guillemets, l'exigent ; un chemin que git cite encore (`"`, `\`, tabulation, saut de ligne) est pris par `revue-exigee.mjs`, qui admet le guillemet de tête.
+La PR de mise à jour (`fusionner`) fait entrer dans un sujet la résolution d'un conflit de code avec develop : `rafraichir` s'arrête sur ce conflit (sortie 2), la session ne pousse pas le sujet, et le squash d'une telle PR perdait la filiation de develop. Elle passe par le capitaine, comme toute sous-PR (gel, titre, revue, checks exigés), puis entre par un `git push` simple du sommet de la PR sur le sujet (avance rapide), et le capitaine ferme la PR. La forme est vérifiée : un seul commit hors du sujet et de develop, au message sans ligne `Sujet:` ni `Merge pull request` (`sujet_livre` les lit dans les fusions de develop), une fusion dont le premier parent est le sommet du sujet et le second un commit de develop, un arbre qui ne s'écarte de la fusion recalculée par `git merge-tree` (git ≥ 2.38, comme `passer.sh`) que sur les fichiers en conflit et les index générés qui ont une `commande` (régénérés, donc écrasés ; un index sans commande ne l'est jamais). L'écart se lit sans détection des renommages : sinon un conflit renommage/renommage laissait recréer le chemin d'origine avec le contenu d'un script de garde et supprimer ce script, la suppression cachée derrière le chemin recréé. La revue exigée lit l'écart et les fichiers en conflit : un conflit modifier/supprimer ou binaire dont la résolution garde la version du sujet ne fait aucun écart. Une liste des index régénérés illisible sort en 11, jamais une garde ouverte. Elle n'ouvre rien que `fusionner` n'ouvrait : une sous-PR aux checks verts et revue entrait déjà, squashée, avec un contenu quelconque ; la PR de mise à jour n'apporte que develop et la résolution des fichiers en conflit, et un sujet qui bouge refuse son push (sortie 5). Un outil du capitaine en échec sort en 11 : la boucle le dit (`ÉCHEC DU CAPITAINE`) et ne renvoie pas la PR, car le conseil d'un renvoi (« fusionner le sujet dans la branche ») lui ferait une seconde fusion, refusée ensuite. Le hook d'agent ne change pas : il ne lit pas le `git push` de `sujet.sh`, et refuse toujours le push d'une session vers `sujet/…`. Pas d'option `rafraichir --depuis <branche>` : le hook la laisserait lancer par toute session, sans checks ni revue. La fusion peut être suivie de **retouches** (décision A-47 du programme « gouverner nos boucles ») : après la montée d'un outil ou d'un gate dans develop, la fusion seule ne passe pas le pre-push, et les retouches en sous-PR squashée perdraient la filiation. Le premier commit hors du sujet et de develop reste la fusion, seule, vérifiée comme avant ; son écart hors conflit n'admet en plus que des fichiers que le formateur prouve, car le pre-commit de la session (lint-staged) formate dans la fusion les fichiers qu'il indexe (vu sur `fedora` #1918 et #1919). Les retouches suivent, commits ordinaires, chacune au message sans ligne `Sujet:` ni `Merge pull request` et accepté par commitlint, puisqu'elle entre telle quelle. Un fichier retouché entre sans revue s'il est prouvé par la machine : à chaque retouche qui le touche, sa version est exactement ce que `pnpm exec prettier --stdin-filepath` rend de sa version au commit d'avant (la fusion recalculée pour l'écart de la fusion), fichier présent des deux côtés, même mode, aucune directive de plus. Chaque retouche entre telle quelle dans l'historique du sujet, puis de develop : une preuve sur le seul écart de la fusion au sommet laissait entrer sans revue une retouche intermédiaire (du code ajouté par l'une, retiré par la suivante, qu'un `git revert` remettrait). Le formateur joue sur l'arbre jugé, la fusion recalculée plus la résolution des conflits, écrit par un index temporaire (`read-tree`, `update-index --cacheinfo`, `write-tree`) et extrait par `git archive | tar -x` dans un dossier temporaire hors du dépôt, où `pnpm install --frozen-lockfile --ignore-scripts` installe ses outils : rien n'est extrait dans le worktree du capitaine et aucune commande qui déclenche un hook (`switch`, `checkout`, `merge`, `commit`) ne touche un arbre qui porte un fichier non jugé ; les hooks ne sont jamais désactivés, ils ne sont pas déclenchés. Un premier état extrayait la fusion de la PR dans le worktree (`git switch`) : un `.husky/post-checkout` écrit hors conflit s'y exécutait, relayé par husky, avant toute preuve, là où la même PR sortait en 4 sans rien exécuter. Ni une configuration, ni un greffon, ni un lockfile, ni un `node_modules/` écrits par la PR ne s'exécutent donc à leur propre jugement, et la version est celle que verrouille le sommet (un lockfile ou un `package.json` retouché, et aucune dispense). Il ne joue qu'après la revue exigée de la résolution, les checks exigés et les liens sur les index (une PR refusée en 3 ou en 4 n'exécute rien), et seulement quand la PR en a besoin (un fichier hors conflit dans la fusion, ou une retouche que la revue exigerait sans section). Un dépôt sans `prettier` dans son `package.json` racine, ou un chemin que git cite entre guillemets : aucune dispense. Tout autre fichier retouché est jugé comme une sous-PR (`revue-exigee.mjs` sur l'union des fichiers que chaque retouche touche, chemins sensibles compris) ; la section « Retouches » du corps de PR est pour le relecteur, jamais lue. Sortie 3 de `fusionner` (checks rouges, conflit, hook) : la boucle renvoie avec le motif de `sujet.sh` ; checks encore en cours : sortie 5, sans renvoi, la PR reste dans la file tant que sa CI ne finit pas. Une mise à jour du sujet refusée sans conflit : `SUJET NON MIS À JOUR` (un hook, sortie 3 : la PR de mise à jour avec retouches ; un outil du capitaine, sortie 11, ou une erreur de `sujet.sh` : à corriger chez le capitaine). Le pre-push de la session juge l'arbre de travail, pas ce qui part : un `git push <sha>:maj/<nom>` depuis un autre arbre passe le hook ; seule la CI exigée sur le sommet, que `fusionner` lit, fait foi. La revue exigée d'une sous-PR se lit de même sans renommage et sans guillemets (`core.quotePath=false`) : un script déplacé hors de `scripts/`, ou un fichier de code à nom accentué, que git citait entre guillemets, l'exigent ; un chemin que git cite encore (`"`, `\`, tabulation, saut de ligne) est pris par `revue-exigee.mjs`, qui admet le guillemet de tête.
 
 Ce qui vient du projet : l'identifiant de ticket (`SPEC_ALL_SOC-1.03` dans un titre de PR ou un nom de fichier, `spec-all-soc-1-03` dans une branche), lu par `identifiant.mjs` du skill `fusionner`, qui importe la grammaire de `scripts/docs/identifiants.mjs` (skill `socle-monorepo`) : `sujet.sh` n'écrit plus la grammaire (type, contexte, trigramme), il ne fait que retirer l'index `.NN` d'un identifiant déjà lu et chercher un fichier par son identifiant littéral, les index générés et leurs commandes (`scripts/docs/index-generes.json`), la branche d'intégration `develop`.
 
```

### 3. La version : `.claude-plugin/plugin.json:3`

`"version": "7.9.4"` → la mineure suivante de `origin/main` à l'ouverture de la PR (décision 14 ; **7.10.0** visée, 7.11.0 si le ticket 33 entre avant).

## Surfaces

| Surface | Preuve |
| --- | --- |
| `est_mise_a_jour` : la fusion au pied de la plage | tests « autre forme » (commit avant la fusion), « retouche de formatage prouvée » |
| `verifier_mise_a_jour` : une fusion, en premier, retouches commitlintées | test « autre forme » |
| `formate_comme` : égalité, mode, directives | tests « formaté autrement », « prettier-ignore », « directive », « rien d'autre n'est prouvé » |
| `prouver_formatage` : arbre jugé sans checkout (index temporaire, `git archive` hors du dépôt), aucun hook déclenché | tests « un hook … ne s'exécute jamais », « node_modules », « le formateur ne joue jamais… » |
| `prouver_formatage` : chaque retouche contre son parent, union commit par commit | test « chaque retouche se prouve contre son parent » |
| `juger_retouches` après `liens_sur_index` et les checks | test « checks et liens avant toute preuve » |
| `prouver_formatage` : arbre du formateur, sans Prettier, lockfile, chemin cité, 11 | tests « le formateur ne joue jamais… », « sans Prettier », « rien d'autre », « introuvable » |
| écart de la fusion prouvé | test « fusion formatée hors conflit » |
| ordre : résolution jugée avant tout formateur ; formateur seulement au besoin | tests existants « autre forme » (`apps/x.ts` en conflit : 4 sans Prettier) et « retouche de documentation » (aucun Prettier joué) |
| la section « Retouches » jamais lue | test « retouche de code » |
| `S:690` checks en cours → 5 | test « checks en cours » |
| `B:294` motif de `sujet.sh` | test « boucle : sortie 3 » |
| `B:247` `SUJET NON MIS À JOUR` | test « boucle : SUJET NON MIS À JOUR » |
| `B:247` sorties 11, 69, 1 ; repli de `refus.sh` | tests « boucle : panne du capitaine », « refus.sh : sortie 3 » |
| la recette : un push, le sommet jugé | `develop.test.mjs`, « il juge l'arbre de travail » |
| textes | relecture du § 2 contre le code |

## Vérification

- Premier état joué le 2026-11-16 sur la branche de la PR 94 (`3c68695`, même arbre que `76d90c7`) ; état corrigé après relecture joué le 2026-11-16 sur un worktree jetable de `origin/main` à `863723a` (7.9.3), puis rejoué à `0860466` (7.9.4, PR 97 entrée pendant la correction) :
  - § 0 : vingt et un `not ok` dans `T`, vingt-deux verts ; `develop.test.mjs` onze sur onze ;
  - patch entier : `sujet-fusionner.test.mjs` 43 sur 43, `develop.test.mjs` 11 sur 11, suite entière **594 sur 594** (572 + 22) sur `863723a`, **603 sur 603** (581 + 22) sur `0860466` ;
  - tests de ce patch, scripts du premier état : les six tests de la relecture `not ok`, les trente-sept autres verts ;
  - mutations, chacune rougit un test nouveau : formateur joué sur l'arbre de la fusion de la PR au lieu de l'arbre jugé (« le formateur ne joue jamais… ») ; garde des directives retirée (« directive de plus ») ; condition du lockfile retirée (« rien d'autre n'est prouvé ») ; et, du premier état (vu par son rédacteur) : formateur joué sur le sommet, `est_mise_a_jour` d'avant (« retouche de formatage prouvée »), `B:294` d'avant (« boucle : sortie 3 ») ; du premier état encore (scripts entiers) : la fusion extraite dans le worktree (« un hook … », « node_modules »), la preuve sur le seul diff de la fusion au sommet (« chaque retouche … »), le formateur avant les checks (« checks et liens … ») ;
  - husky : la souche n'est pas dans le lockfile du plugin ; les bancs simulent son relais (`core.hooksPath` vers un dossier dont chaque hook joue `.husky/<hook>` de l'arbre de travail, comme `.husky/_/h` de husky 9). Aucun hook n'est désactivé.
- La session rejoue : `git apply --check`, § 0 (rouges), patch, `node --test` des deux bancs, puis la suite entière ; `bash -n` sur `sujet.sh`, `boucle.sh`, `refus.sh` ; `shellcheck` si présent.
- La revue de ticket (`revue-de-ticket`) puis `/security-review`, qui joue au moins les attaques ci-dessous.

### Attaques que la contre-relecture jouera

1. **Le formateur sous influence** : une retouche ou l'écart de la fusion réécrit `.prettierrc`, `prettier.config.*`, `.prettierignore`, `.editorconfig`, un greffon déclaré par chemin, un fichier que ce greffon lit, un `package.json` (clé `prettier`), le lockfile, `.npmrc`, `.pnpmfile.cjs`, `.gitattributes` (`export-ignore`, `export-subst`, lus par `git archive`) : rien de cela n'entre dans l'arbre jugé (décision 5) ; vérifier qu'il ne prend que la fusion recalculée et les fichiers en conflit de la fusion, et qu'une retouche n'y est jamais.
2. **Un conflit sur l'outillage** : la résolution d'un conflit sur `.prettierrc.mjs` ou le lockfile entre dans l'arbre du formateur ; elle est jugée avant (décision 6) : sans section de revue, sortie 4 sans rien exécuter (cas existant `apps/x.ts`, à rejouer sur `.prettierrc.mjs` et `pnpm-lock.yaml`).
3. **Une directive** sous une autre graphie (`/*eslint-disable*/`, `// @ts-expect-error`, `/* istanbul ignore next */`, `<!-- prettier-ignore -->` en Markdown) ; un formateur qui en écrirait une.
4. **Un changement de sens que Prettier « prouve »** : guillemets dans un JSON à clés dupliquées, un Markdown dont le formatage change le rendu, un YAML à ancres ; dire ce qui reste au relecteur.
5. **La forme** : octopus, fusion de `maj/` avec elle-même, une retouche qui est une fusion vide, une fusion dont le second parent est le sujet, la première-parent qui ne couvre pas la plage, un message de retouche `Merge pull request #n from o/sujet/x` sur un commit ordinaire.
6. **Les chemins** : guillemets de git, espace, `:` de tête (pathspec magique), `--literal-pathspecs` sur `ls-tree`, `checkout` et `rm` ; un fichier qui est un dossier d'un côté.
7. **Rien d'extrait, rien de déclenché** : la preuve ne touche jamais le worktree du capitaine (ni `switch`, ni `checkout`, ni `merge`, ni `commit`), aucun hook ne joue (relais de husky réel si possible, sinon simulé comme les bancs) et aucun n'est désactivé ; le dossier et l'index temporaires sont retirés à chaque sortie (11, retour normal, aucune dispense) ; `pnpm install --ignore-scripts` dans le dossier ne joue aucun script ; un `tar` qui suivrait un lien de l'arbre jugé hors du dossier.
8. **Le pre-push juge l'arbre de travail** (décision 11) : une session qui pousse `<sha>:maj/<nom>` depuis un autre arbre passe le hook ; seule la CI exigée sur le sommet fait foi (`fusionner` la lit) : vérifier qu'aucune voie ne fait entrer un sommet sans ses checks verts.
9. **La boucle** : `refus.sh` sur une sortie 3 dont la dernière ligne vient de stderr (un hook bavard), qui donnerait un motif illisible ; la sortie 5 « checks en cours » qui ne finit jamais (CI bloquée) laisse la PR dans la file sans bruit (décision 12) : dire si le capitaine la voit.
10. **Monotonie** : une sous-PR ordinaire d'aujourd'hui (fusion du sujet par le capitaine, commit avant la fusion) ne prend jamais la voie nouvelle ; une branche partie du sujet qui fusionne develop puis code la prend, et ses commits entrent sans squash, jugés comme une sous-PR : dire si cela suffit.

## Hors périmètre

- **`eslint --fix` du pre-commit** (`fedora`) : ses changements dans la fusion ne sont pas prouvés (sortie 4), dans une retouche ils sont jugés comme une sous-PR. Prouver ESLint demanderait de le jouer avec ses règles de l'arbre déjà jugé ; à trancher si le cas se présente.
- **Un lockfile en conflit** : `garde-fichiers` refuse son édition ; `pnpm install --frozen-lockfile` de la recette échoue sur un lockfile incohérent. Hors de cette voie, comme aujourd'hui.
- **#1921 et #1922** (réécritures du sujet en plusieurs fusions) : refusées, sortie 4.
- **La phrase de `socle-chaine-de-production/references/CONTENU.md:25`** sur le pre-push antérieur à 7.0.1 (« pas ce qui part ») : le hook actuel ne juge pas non plus ce qui part ; à reformuler au ticket qui touchera ce paragraphe.
- **`coverage-diff`** sur une PR de mise à jour : ticket 45, qui lit la même forme (première-parent, la fusion d'abord).
- **Le coût** : un Prettier par fichier et par retouche qui le touche (un processus `node` chacun) ; après une montée de formateur (121 fichiers chez `fedora`), une minute environ au capitaine ; en plus, l'arbre jugé extrait et un `pnpm install --ignore-scripts` complet dans un dossier neuf (depuis le magasin de pnpm), chaque fois que le formateur joue. Un seul appel par lot reste possible plus tard.
- **`.gitattributes` de l'arbre jugé** : `git archive` applique `export-ignore` et `export-subst` ; une configuration ainsi écartée fait jouer Prettier sans elle (au pire une preuve qui échoue, ou un formatage par défaut d'un fichier jugé). L'arbre est déjà jugé ; à reprendre si le cas se présente.

## Comments

- 2026-11-16 — Instruit sur `fa7d3eb`, joué sur la branche de la PR 94 (`3c68695`), devenue `main` à `76d90c7` pendant l'instruction (même arbre). Faits de la carte revérifiés, lignes comprises ; `fedora` #1918 à #1920 relues à la source et rejouées contre Prettier 3.9.10 ; le pre-commit `lint-staged` réel rejoué sur une copie jetable. Décisions de rédaction retenues par l'architecte (A-47 bis, carte, journal du 2026-11-16) : la preuve étendue à l'écart de la fusion (4), l'arbre du formateur (5), l'ordre revue puis formateur (6), la liste des directives (3), les checks en cours en sortie 5 (12), commitlint sur chaque retouche (1).
- 2026-11-16 — Corrigé après relecture (agent neuf, opus, sur `76d90c7` : « pas prêt », deux bloquantes jouées), par un correcteur, le rédacteur n'étant plus joignable ; décisions de l'architecte (journal du 2026-11-16). B1 : l'arbre du formateur se construit sans checkout (index temporaire, `write-tree`, `git archive` vers un dossier hors du dépôt, `pnpm install --ignore-scripts`), aucun hook déclenché ni désactivé (décision 5). B2 : chaque retouche se prouve contre son parent, la revue juge l'union des fichiers touchés commit par commit (décisions 3, 7). Mineures : checks et liens lus avant toute preuve (`juger_retouches`, décision 6) ; version 7.10.0 et repli (14) ; restes de rédaction retirés ; `rafraichir_sujets` dit 11, 69 et 1 sans la voie des retouches, `refus.sh` nomme la sortie reçue (12) ; le pre-push juge l'arbre de travail, pas ce qui part (11) ; la sortie 5 laisse la PR dans la file (12). Six tests nouveaux, vus rouges contre le premier état avant le remède ; le test « le formateur ne joue jamais… » resserré (il ne mordait pas sur l'arbre de la fusion de la PR). Rejoué sur `863723a` (7.9.3) puis sur `0860466` (7.9.4 ; la PR 97 a changé le paragraphe des tests de `fusionner/references/CONTENU.md`, que le patch suit désormais) : 21 rouges dans `T` sans le code, 603 sur 603 avec. Relais de husky simulé dans les bancs (la souche n'est pas dans le lockfile du plugin).
