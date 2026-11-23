# Un socle posé en « chaîne seule » passe son propre gate : le lint et Prettier hors des scripts posés, les références d'une brique absente gelées et dites, un seul nom pour la liste de l'admin, une règle de checks exigés vide dite réglage du dépôt, et les durées de `regles.test.mjs` en étalons

Status: Fait — PR 159 (`4403173`, plugin 8.3.2)
Type: défaut
Label: contre-revue
Modèle: sonnet — sept défauts du plugin trouvés à la pose réelle d'un dépôt neuf en « chaîne seule » (plugin 8.0.0), reproduits sur `main` à `24fbd72` (plugin 8.3.0), corrigés sans rien concevoir ; le code entier est dans le patch ([`91-annexes/ticket-91.patch`](91-annexes/ticket-91.patch), sha256 `00365efa28362f3edc3e81809897492eb75beaeb630ba2f581a4c5da0653d1dc`, `git apply` sur `main` à `24fbd72`), décrit fichier par fichier ci-dessous, note de version 8.3.1 comprise ; les bancs neufs rouges avant le code (8 sur 9, et 1 sur 1), verts après ; les 26 mutations de [`91-annexes/mutations.mjs`](91-annexes/mutations.mjs) toutes rouges ; retouché après la relecture du ticket ([`91-annexes/relecture-tour-1.md`](91-annexes/relecture-tour-1.md), décision A-219). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` (les six cas de durée) ; `skills/chaine/fusionner/scripts/github.sh` (`checks_exiges`, `attendre_ci`), `file.sh`, `boucle.sh`, `passer.sh` ; `skills/chaine/sujet/scripts/sujet.sh` et `faux-gh.mjs` (le banc d'essai de toute la chaîne) ; `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` (un test ajouté) ; `skills/monorepo/socle-monorepo/SKILL.md` (197 lignes sur 200) et `references/racine/{.prettierignore,eslint.config.mjs}` ; `skills/chaine/socle-chaine-de-production/SKILL.md` et `references/admin.md` ; `scripts/pose-du-socle.mjs` (un `export`) et `scripts/references-posees.test.mjs` (un commentaire) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`, que toute PR de suite touche (la règle du § 3). PR ouvertes sur ces fichiers, au 2026-11-23 : la PR 44 (plugin 7.32.0, 24 commits de retard sur `main`) touche `skills/chaine/sujet/scripts/sujet.sh` (la fonction `livrer`, autour des lignes 1063 à 1103, loin des hunks de ce patch, qui s'applique sur elle sans conflit), `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` ; la PR 56 n'a aucun commit commun avec `main` et ne touche que deux tickets de documentation (`docs/issues/pose-du-socle/issues/3-…` et `4-…`).

## Le besoin

L'essai réel du régime 8 a posé le plugin 8.0.0 dans un dépôt neuf (journal du programme, 2026-11-22, 14 h 32 et 15 h 05 UTC) en « chaîne seule » : `socle-monorepo` sans aucun service (ni api, ni web, ni mobile, ni tests ; mono-tenant, sans rôles, sans Anchorpost), puis `socle-chaine-de-production`. Sa PR de pose écrit seize écarts au plugin ; ce ticket prend ceux de la classe « un gabarit posé en chaîne seule casse le gate du projet qui le pose », plus la liste de checks exigés vide vue deux fois ensuite (journal, 18 h 33 et 18 h 35 UTC). Chacun est mesuré sur le plugin 8.3.0, dans un dépôt jouet posé à la main selon les `SKILL.md` ([`poser-chaine-seule.mjs`](91-annexes/poser-chaine-seule.mjs), joué par [`essai-chaine-seule.sh`](91-annexes/essai-chaine-seule.sh) : la pose, `pnpm install`, puis ce que le gate joue la première fois ; journal [`essai-8.3.0.txt`](91-annexes/essai-8.3.0.txt)) ; Node 22.23.5, pnpm 9.15.4, ESLint 9.39.5, Prettier 3.10.1.

| # | Défaut (écart de la PR de pose) | Mesuré sur 8.3.0 |
| --- | --- | --- |
| 1 | **Le lint de la racine refuse les scripts posés** (écart 3) : l'ESLint du gabarit lint `scripts/{agent,chaine,docs,github,verify}/**`, code du plugin | `pnpm lint` sortie 1 : **14 erreurs dans 9 fichiers**, les mêmes qu'en 8.0.0 (`regles.mjs:1440` no-this-alias et `:2828` no-control-regex, `double-relecture.mjs` 3, `meme-contenu.test.mjs` 1, `sujet-fusionner.test.mjs` 2, `une-sous-pr-a-la-fois.test.mjs` 1, `veille.test.mjs` 2, `verdict.test.mjs` 1, `tickets-regles.mjs` 1, `tickets.test.mjs` 1) : `pnpm check` rouge à sa deuxième étape |
| 2 | **Prettier, par lint-staged, reformate les scripts posés au commit** (écart 14) | `prettier --list-different` : **93 scripts posés** (`scripts/chaine` 37, `scripts/docs` 26, `scripts/agent` 15, `scripts/verify` 13, `scripts/github` 2), tous reformatés par le premier commit : chaque repose rediffère d'avec le plugin |
| 3 | **Des références de gabarit vers une brique non posée** (écart 5) | `check:contexte` sortie 1 : **13** références cassées, une de plus qu'en 8.0.0 (`tests.md` en cite une de plus, `preuves.mjs`) et une que l'essai n'avait pas (« Ce qui a été trouvé en plus », 1) : `.claude/rules/tests.md` 4 (vers `socle-tests`), `docs/agents/criteres-revue.md` 7 (sections de `apps/api/CLAUDE.md`), `docs/agents/pieges.md` 1 (`scripts/db/demarrer-local.sh`), `docs/agents/chaine-de-production.md` 1 (`docs/agents/couts.md`) ; aucun skill ne dit de les geler ni comment (le gate n'a pas d'option de gel : l'essai a écrit la dette à la main) |
| 4 | **Deux liens de `docs/methode/` vers des briques absentes** (écart 11), que `references-agent` ne lit pas | [`liens.mjs`](91-annexes/liens.mjs) : `conception.md:3 → ../../apps/api/CLAUDE.md`, `pare-feu-ci.md:29 → ../adr/ADR_ALL_ARC-2-transactions-et-isolation.md` ; 2 liens cassés sur 36 fichiers `.md` |
| 5 | **`docs/agents/admin.md` contre `docs/agents/chaine-admin.md`** (écart 15) | la chaîne pose `chaine-admin.md` (et `develop.sh` le nomme) ; `socle-monorepo` (étape 8), `anchorpost` (étape 6 et son ADR) et `pieges.md` nomment `admin.md` ; un dépôt réel posé avant ce ticket porte les deux fichiers |
| 6 | **Les cas de durée de `regles.test.mjs` dépassent sous charge** (décision 6 du ticket 90) | sous 20 boucles à vide sur quatre cœurs (charge de 15 à 20), le pire cas de « le plafond à 20 000 caractères : chaque pire cas mesuré se lit sous 10 s… », `["gh pr close 1 -","d","!"]`, prend 13 583 ms pour une borne de 10 000 ms, contre 2 457 ms sur le même poste libre ([`etalon.txt`](91-annexes/etalon.txt), [`mesurer.mjs`](91-annexes/mesurer.mjs)) : le banc de `main` y rougit (§ 1, [`durees-sous-charge.txt`](91-annexes/durees-sous-charge.txt)) ; et le rapport du cas « contre-relecture C1 », en secondes avec 0,2 s de marge fixe, y rougit aussi (`0.027849725 s puis 1.0523034789999999 s`, la relecture du ticket) |
| 7 | **Une liste vide de checks exigés lue « sans CI »** (journal, 18 h 33 et 18 h 35 UTC) | `checks_exiges` rend `[]` sur un ruleset dont la règle `required_status_checks` n'exige rien : `file.sh` dit la PR « prête (sans CI) » quelle que soit sa CI, `attendre_ci` sort 2, `passer.sh` « CI non déclenchée », la boucle la met de côté ; et le banc l'éprouvait ainsi : le faux `gh` de `sujet` rend cette règle vide pour tout dépôt « sans CI », et `github.test.mjs` exige `[]` (« règles vides, protection absente (404) ») |

**`tests.md` sans `socle-tests`.** `.claude/rules/tests.md` est posé par `socle-monorepo` (`TABLE-RACINE.md`, sa ligne propre), avec ou sans **tests** coché. Il doit l'être : ses règles valent pour tout test (`paths:` couvre `**/*.test.mjs`, les bancs des scripts posés), et ses zones `<!-- socle:tests -->` reçoivent la ligne de chaque service. Ses quatre références à `socle-tests` se gèlent à l'allumage et s'élaguent à l'arrivée de `socle-tests`.

## Ce qui a été trouvé en plus

Cherché : ce qu'un gabarit posé en chaîne seule fait rougir, ou rend faux, dans le gate du projet qui le pose, au-delà des sept écarts. Le dépôt jouet a été posé, puis son gate joué entier (`pnpm check`), avant et après le patch.

1. **Le registre des coûts, `docs/agents/couts.md`, n'est généré par aucune étape de la pose** : c'est un index généré (`index-generes.json` du gabarit), que `chaine-de-production.md:151` cite ; sans lui, `check:contexte` est rouge. L'essai réel l'avait généré de lui-même (`node scripts/docs/couts.mjs`), d'où ses 11 références au lieu de 12 (plus `preuves.mjs`). Corrigé : l'étape 2.3 du socle de la chaîne dit de générer chaque index de la liste par sa commande.
2. **Lire `docs/methode/` par `references-agent` coûte 16 références de plus et n'aurait pas trouvé les deux liens** ([`methode-mesure.txt`](91-annexes/methode-mesure.txt), [`mesurer-methode.sh`](91-annexes/mesurer-methode.sh)) : 16 de plus dans le dépôt jouet et dans le dépôt de l'essai réel, 12 de plus dans un dépôt réel posé avec l'API, le web et la chaîne ; toutes fausses (les dossiers d'exemple de `nomenclature.md`, qui naissent avec leur premier fichier, son ticket d'exemple `SPEC_ALL_LIC-12.03`, le plugin facultatif `superpowers:brainstorming`). Et le gate ne lit pas les liens markdown : il lit le code entre accents graves, et `apps/api/CLAUDE.md` y est ignoré dans un dépôt sans `apps/` (« premier segment inconnu à la racine »), comme `ADR_ALL_ARC-2` (il ne vérifie que les identifiants de ticket). D'où la décision 4.
3. **Prettier reformate aussi 18 fichiers posés qui ne sont pas des scripts**, au même premier commit : `docs/agents/` 5, `docs/methode/` 3, les tickets du socle 3, `.github/workflows/` 2 (dont `pr-titre.yml`, posé « tel quel »), `CLAUDE.md`, `README.md`, `.claude/rules/tests.md`, `eslint.config.mjs`, `commitlint.config.mjs` : les gabarits ne sont pas écrits au format de la configuration Prettier qu'ils posent (`printWidth` 100). Ils sont au projet une fois posés, sauf ceux qu'une repose remplace (`chaine-de-production.md`, `pieges.md`, `pr-titre.yml`), qui rediffèrent. Hors du ticket (« Hors périmètre ») : le gate ne rougit pas.
4. **Les données du projet dans les dossiers posés** : `scripts/docs/index-generes.json`, `scripts/verify/references-agent-dette.json`, `tickets-dette.json` et `references-agent-integrees.json` vivent sous des dossiers que le bloc sort de Prettier. Ce sont des JSON écrits par les scripts (`JSON.stringify`, `--geler`, `--elaguer`) ou à la main, qu'ESLint ne lit pas ; aucun code du projet n'y vit (mesuré : aucun skill ne fait écrire au projet un `.mjs` ou un `.ts` dans ces cinq dossiers). Les sortir de Prettier ne coûte rien (Prettier y repliait les tableaux que les scripts récrivent dépliés). `scripts/db/` (le seul script shell de l'API) reste au projet : ni ESLint ni Prettier ne lisent un `.sh`.
5. **L'index OpenAPI du gabarit `index-generes.json`** est posé sans API : inerte (`pnpm --filter @<scope>/<projet>-api openapi:emit` sort en 0 sur « No projects matched », rien n'est ajouté), mais il nomme une brique absente ; l'essai l'a retiré à la main. À la liste des suites (« Hors périmètre »).
6. **D'autres bancs posés bornent une durée en millisecondes**, sans dépassement vu : `tickets.test.mjs` (3 000 ms, quelques millisecondes mesurées), `vagues.test.mjs` (3 000 ms), `double-relecture.test.mjs` (2 000 ms). Leur marge est de deux ordres ; hors du ticket, à la liste des suites, avec la même recette si l'un dépasse.
7. **La veille ne voit pas l'erreur de `file.sh`** (`etat_file`, `2>/dev/null`) : sans effet ici, la veille lance la boucle à son démarrage, et la boucle dit le réglage et s'arrête (`VEILLE ARRÊTÉE`, sortie 6).
8. **Le socle posé, patch appliqué, passe son gate entier** : `pnpm check` du dépôt jouet, 9 étapes vertes en 571 s, `check:tickets` 1 019 tests verts, `references-agent : OK — 17 fichiers, 0 nouvelle, 12 gelée(s)` ([`check-8.3.1.txt`](91-annexes/check-8.3.1.txt)).

## Décisions

1. **Une liste unique des dossiers posés, dans `.prettierignore`, que tout le reste suit.** Le gabarit `socle-monorepo/references/racine/.prettierignore` porte le bloc `# socle:poses-du-plugin` … `# /socle:poses-du-plugin` (`scripts/agent/`, `scripts/chaine/`, `scripts/docs/`, `scripts/github/`, `scripts/verify/`), placé avant la section que les services complètent en fin de fichier. Prettier le lit nativement, lint-staged aussi par lui (Prettier saute de lui-même un fichier ignoré qu'on lui nomme ; ESLint, dans lint-staged, a déjà `--no-warn-ignored`), et `eslint.config.mjs` lit ce bloc (`posesDuPlugin`) pour ses `ignores` : la liste n'est écrite qu'une fois. La lecture découpe le fichier par `/\r?\n/` (un `.prettierignore` en CRLF se lit de même) et lève une erreur qui nomme le bloc quand il manque, jamais une liste vide : sans lui, ESLint relirait les scripts posés (un projet posé avant 8.3.1 qui ne reprend que `eslint.config.mjs`). Ni `@eslint/compat` (une dépendance nouvelle) ni une seconde liste dans `eslint.config.mjs`. Les 14 erreurs restent hors du ticket : elles ne sont pas des défauts du gate du projet, et la CI du plugin est le gate de ces scripts. Mesuré : `pnpm lint` sortie 0, aucun script posé reformaté au commit.
2. **Un banc du plugin tient la liste égale aux dossiers posés**, ni plus ni moins (`scripts/dossiers-poses.test.mjs`) : les dossiers de `scripts/` d'un projet que les skills posent, lus dans l'arbre du plugin (`references/agent/`, `references/scripts/<d>/`, `references/squelette/scripts/<d>/`, les scripts posés à plat sous `scripts/chaine/` de la table de `pose-du-socle.mjs`, et tout `` `scripts/<d>/ `` qu'un `SKILL.md` ou `TABLE-RACINE.md` nomme), hors de `scripts/db/` (nommé, avec sa raison) ; et la lecture du bloc par `eslint.config.mjs`, jouée telle qu'écrite sur le `.prettierignore` du gabarit, sur un texte en CRLF et sur un texte sans bloc. Mutations V1 à V5, V25, V26.
3. **Le gel à l'allumage est dit, et seulement pour une brique non posée.** `socle-monorepo`, étape 7, nomme les quatre références de `tests.md` vers `socle-tests` ; le socle de la chaîne, étape 3, les sept sections de `apps/api/CLAUDE.md` (critères S1, S2, S4, S8, S9, S10) et `scripts/db/demarrer-local.sh` de `pieges.md`. Le geste est écrit : chaque ligne `<fichier>:<ligne> — <nature> « <référence> » introuvable` du gate devient l'entrée `"<fichier>:<ligne>:<référence>"` de `scripts/verify/references-agent-dette.json`, et `--elaguer` les retire à l'arrivée de la brique. Toute autre référence nommée se corrige. Pas d'option `--geler` (du code à concevoir) ; aucun gabarit réécrit pour éviter le gate : les critères S1… disent vrai dès que l'API arrive, et `--elaguer` le constate. Mutations V19, V20.
4. **`references-agent` ne lit pas `docs/methode/` ; les deux liens quittent le gabarit.** La lecture coûterait 16 fausses références par projet en chaîne seule, 12 dans un projet complet, sans trouver ces liens (« Ce qui a été trouvé en plus », 2). `conception.md` cite « le `CLAUDE.md` de chaque service, `apps/<service>/CLAUDE.md` », et `pare-feu-ci.md` « `ADR_ALL_ARC-2`, posée avec l'API par `socle-nest-hexagonal` », par son identifiant, sans lien (la nomenclature : un identifiant ne casse pas). L'étape 7 de `socle-monorepo` (« aucun lien markdown cassé ») devient vraie en chaîne seule : 0 lien cassé. `scripts/chaine-seule.test.mjs` tient les liens de la méthode posée par la racine dans ce qu'un dépôt sans service a. Mutation V18.
5. **Un seul nom : `docs/agents/chaine-admin.md`.** C'est ce que pose la chaîne (étape 2.11) et ce que nomme `develop.sh` ; rien ne s'y oppose. Changent : `socle-monorepo/SKILL.md` (étape 8), `socle-chaine-de-production/SKILL.md` (étapes 2.5 et 2.9 : `admin.md` → `chaine-admin.md`), `anchorpost/SKILL.md` (étape 6) et son gabarit d'ADR, `docs-agents/pieges.md`, le commentaire de `checks_exiges` (`github.sh`). Restent, parce qu'ils nomment la source du plugin et pas le fichier du projet : `socle-chaine-de-production/references/admin.md` lui-même et le titre de son `CONTENU.md`, `fusionner/references/CONTENU.md` (« `admin.md` du socle »), `anchorpost/references/fragments/admin.md`, et les notes de version passées. Un projet qui a un `docs/agents/admin.md` en reporte la section dans `chaine-admin.md` (la note). `scripts/chaine-seule.test.mjs` refuse `docs/agents/admin.md` sous `skills/` et au README. Mutation V17.
6. **Une règle de checks exigés vide est un réglage du dépôt, dit à la première lecture, et la boucle s'arrête.** `checks_exiges` (`github.sh`) sort en **6**, `RÉGLAGE DU DÉPÔT : <où> porte une règle « Require status checks to pass » (required_status_checks) qui n'exige aucun check ; … À un admin : y ajouter les checks exigés de la CI (qualite, test-db, zizmor : docs/agents/chaine-admin.md, « Protection de develop ») ; puis relancer le capitaine.`, `<où>` nommant la branche et le ruleset (`la branche develop (ruleset <id>)`) ou l'ancienne protection (`la protection de branche de develop (Settings → Branches)`), rien sur la sortie standard. `file.sh` sort en 6 (son `exit $?`) ; la boucle, qui lit `file.sh` à chaque tour, s'arrête : `ARRÊT : réglage du dépôt (file.sh, sortie 6, motif ci-dessus) : un admin le fait, puis le capitaine relance`, sortie 6 ; la veille, qui la lance à son démarrage, s'arrête avec elle. `attendre_ci` rend le 6 ; `passer.sh` sort en 3 (`réglage du dépôt (motif ci-dessus) : …`, que la boucle classe en ARRÊT, comme un refus durable), `sujet.sh fusionner` en 11 (aucun renvoi), à l'attente de la CI comme à la lecture unique d'une PR de mise à jour. Un dépôt **sans aucune** règle de checks (pas de règle, ou la protection qui répond 404) reste « sans CI », comme avant, et **rien n'y entre non plus** : `attendre_ci` ne voit aucun check exigé apparaître et rend 2, `passer.sh` sort en 3 « CI non déclenchée », la boucle met chaque PR de côté, sans rien dire (sonde de la relecture, [`sonde-sans-regle.test.mjs`](91-annexes/sonde-sans-regle.test.mjs) : CI verte, aucune fusion). C'est l'état d'un dépôt entre la pose et la case « Protection de develop ». Ce cas va à un **ticket de suite** (famille `fusionner` : « aucun check exigé » lu comme un réglage du dépôt) : il change `github.test.mjs` (« règles vides, protection absente (404) ») et chaque banc qui pose `exiges: []`. Ici, le geste dit est donc d'ajouter les checks, **jamais de retirer la règle** (qui mènerait à ce cas) : ni le message `RÉGLAGE DU DÉPÔT`, ni la case de `chaine-admin.md` ne le proposent. L'arrêt plutôt que « de côté » : la règle vide vaut pour toutes les PR, aucune ne peut entrer, et seul un admin y peut quelque chose. `chaine-admin.md` le dit à la case de la protection de `develop` (« **jamais une règle sans check** »), avec la commande qui le vérifie ; `fusionner/SKILL.md` dit le geste du capitaine. Le faux `gh` de `sujet` cesse de rendre une règle vide pour un dépôt sans checks (il rend `[]`, comme GitHub sans règle) ; `regleVide` modèle le dépôt de l'essai. Mutations V6 à V12, V21, V23, V24.
7. **Les durées de `regles.test.mjs` se bornent en étalons, sans rien affaiblir.** L'étalon est un travail fixe, hors de la garde, du même moteur d'expressions : `/^-[a-z]*a[a-z]*$/` sur `-` + 16 000 `a` + `!`, qui recule au carré (250 ms sur le poste de mesure, de 240 à 440 ms libre). Il se mesure juste avant et juste après chaque cas, et le plus lent des deux compte ; un étalon sous 20 ms (un moteur qui ne reculerait plus) rougit le banc. Les sept bornes gardent leur force sur un poste libre : 10 s → 40 étalons, 5 s → 20, 2 s → 8, 1 s → 4 (le refus à 20 001 caractères se rapporte à l'étalon de son cas), et le rapport du cas « contre-relecture C1 » (trois fois plus long, moins de six fois plus de temps) se lit en étalons, chaque mesure rapportée à son étalon : `grand.etalons < 6 * petit.etalons + 0.8`, la marge de 0,8 étalon valant les 0,2 s d'avant sur le poste de mesure. En secondes, ce rapport rougissait sous charge (la relecture : `0.028 s puis 1.05 s`, deux passes sur deux) ; en étalons, il passe trois fois sur trois sous la même charge, et il rougit sur une lecture devenue quadratique dès que le grand cas coûte plus de deux étalons environ (V22 : 1,96 étalon pour une borne de 1,52). Le rapport ne bouge guère avec la charge (pire cas 7,2 étalons libre, 8,9 sous 20 boucles à vide, charge de 15 à 20, alors que sa durée passe de 2,5 s à 13,6 s : [`etalon.txt`](91-annexes/etalon.txt)) : la borne de 40 garde une marge de 4,5. Le banc d'avant, sous 20 boucles à vide, rougit ; celui du patch passe, 88 sur 88, trois passes sur trois ([`s2-vert.txt`](91-annexes/s2-vert.txt)). Ce qui reste prouvé (mutations V13 à V16, jouées aussi contre le banc d'avant, [`mutations-banc-d-avant.txt`](91-annexes/mutations-banc-d-avant.txt)) : la lecture de 7.9.x redevenue quadratique sur une suite de chiffres (V13, 30,7 étalons pour 4), le plafond testé après la lecture (V14, 7,9 pour 4), le pire cas dix fois plus lent (V15, 91,4 pour 40), l'étalon qui ne mesure plus (V16), la lecture après un mot à expansion devenue quadratique (V22). Coût : le banc passe de 13 s à 23 s sur un poste libre (deux étalons par mesure). Aucun saut, aucun `--test-skip-pattern`, aucune nouvelle tentative.
8. **À une fusion de `main`, la note se repose depuis la branche, jamais depuis l'annexe** (`A-205` point 2, `A-212`, comme au ticket 90).
9. **La session lit le job `bancs` de sa PR avant de rendre la main, et le dit au lanceur** (`A-212`).

## Questions à l'architecte

Aucune : la mesure n'a rien laissé à trancher que les préférences écrites ne tranchent. Deux choix sont écrits en décision avec leur raison, à changer par l'architecte s'il le veut : l'arrêt de la boucle sur le réglage du dépôt (décision 6, l'autre branche : mettre de côté chaque PR avec le motif, et continuer, ce qui ne fait entrer aucune PR non plus), et le gel écrit à la main (décision 3, l'autre branche : une option `--geler-absentes` du gate, du code à concevoir, et une liste des briques à tenir dans le gate). Tranché après la relecture (A-219) : les deux choix tiennent, et le cas « aucun check exigé » va à un ticket de suite (décision 6).

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/monorepo/socle-monorepo/references/racine/.prettierignore` | le bloc `socle:poses-du-plugin` et son commentaire (décision 1) |
| `skills/monorepo/socle-monorepo/references/racine/eslint.config.mjs` | `readFileSync` importé ; `prettierignore` découpé par `/\r?\n/`, `debutPoses`, `finPoses`, une erreur sans bloc, `posesDuPlugin` lus du bloc ; `...posesDuPlugin` aux `ignores` |
| `skills/monorepo/socle-monorepo/SKILL.md` | étape 7 : « Les références d'une brique non posée » (décision 3) ; étape 8 : `docs/agents/chaine-admin.md` |
| `skills/monorepo/socle-monorepo/references/CONTENU.md` | le bloc de `.prettierignore`, sa raison, son banc |
| `skills/monorepo/socle-monorepo/references/methode/conception.md`, `pare-feu-ci.md` | les deux liens (décision 4) |
| `skills/chaine/socle-chaine-de-production/SKILL.md` | étape 2.3 : générer les index ; 2.5 et 2.9 : `chaine-admin.md` ; étape 3 : le gel des références vers l'API, et le bloc pour un projet posé avant 8.3.1 |
| `skills/chaine/socle-chaine-de-production/references/admin.md` | « jamais une règle sans check » à la protection de `develop`, le geste (« y ajouter les checks, jamais retirer la règle »), et sa vérification |
| `skills/chaine/socle-chaine-de-production/references/docs-agents/pieges.md` | `chaine-admin.md` |
| `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` | l'étalon (`ETALON`, `duree`, `etalon`, `enEtalons`) et les sept bornes en étalons, rapport C1 compris (décision 7) ; deux titres de test disent leur borne en étalons |
| `skills/chaine/anchorpost/SKILL.md`, `references/adr/ADR_ALL_ARC-N-index-anchorpost.md` | `docs/agents/chaine-admin.md` |
| `skills/chaine/fusionner/scripts/github.sh` | `reglage_checks_vides`, `checks_exiges` (sortie 6), `attendre_ci` (rend le 6) |
| `skills/chaine/fusionner/scripts/file.sh`, `boucle.sh`, `passer.sh` | sortie 6 ; `ARRÊT : réglage du dépôt` ; sortie 3 sur le réglage |
| `skills/chaine/sujet/scripts/sujet.sh` | sortie 11 sur le réglage, aux deux lectures, et son en-tête |
| `skills/chaine/sujet/scripts/faux-gh.mjs` | sans check exigé, aucune règle ; `regleVide` ; `ruleset_id` |
| `skills/chaine/fusionner/SKILL.md` | devant `RÉGLAGE DU DÉPÔT`, le geste du capitaine |
| `skills/chaine/fusionner/scripts/checks-exiges-vides.test.mjs` (neuf) | trois tests : `checks_exiges`, `file.sh` puis `boucle.sh`, `passer.sh` |
| `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` | un test : `sujet.sh fusionner` sort en 11 |
| `scripts/dossiers-poses.test.mjs` (neuf) | trois tests (décision 2), la lecture du bloc en CRLF et sans bloc comprise |
| `scripts/chaine-seule.test.mjs` (neuf) | trois tests : un seul nom (et la case des checks, son geste), les liens de la méthode, le gel et les index dits |
| `scripts/pose-du-socle.mjs` | `VOISINS_PAR_DOSSIER` exporté |
| `scripts/references-posees.test.mjs` | le commentaire de `--test-concurrency=1` |
| `README.md` | « Ajouter un skill » : un dossier posé de plus va au bloc, et son banc |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | 8.3.1 et sa note (§ 3 : la version suivante de `main` au moment de livrer) |

## À faire, dans l'ordre

Chaque bloc se joue tel quel depuis la racine du dépôt, `S` étant le scratchpad de la session (`S=<son chemin absolu>`). Un geste qui ne rend pas ce qui est écrit : s'arrêter et l'écrire au lanceur, sans improviser.

### § 0 — Partir de `main`, les annexes

```bash
git fetch origin main '+refs/heads/claude-jfrt-fam/lucid-pasteur-q59f3p:refs/remotes/origin/claude-jfrt-fam/lucid-pasteur-q59f3p'
git switch -C claude/chaine-seule origin/main
mkdir -p "$S/91" && for f in ticket-91.patch mutations.mjs version-suivante.mjs charge.sh durees-sous-charge.sh poser-chaine-seule.mjs essai-chaine-seule.sh liens.mjs; do git show "origin/claude-jfrt-fam/lucid-pasteur-q59f3p:docs/issues/gouverner-nos-boucles/issues/91-annexes/$f" > "$S/91/$f"; done
sha256sum "$S/91/ticket-91.patch"
git log -1 --format=%h origin/main; git show origin/main:.claude-plugin/plugin.json | grep '"version"'
pnpm install --frozen-lockfile
```

Les annexes se lisent sur la branche de documentation du programme (sur `main` si la PR de documentation qui porte ce ticket y est entrée : `git show origin/main:<chemin>`), et s'écrivent dans `S`, jamais dans le dépôt. La somme attendue : **`00365efa28362f3edc3e81809897492eb75beaeb630ba2f581a4c5da0653d1dc`** ; une autre : s'arrêter. `main` attendu : `24fbd72`, `"version": "8.3.0"`. Un autre `main` : les gestes des § 1 et § 2 sont les mêmes, hors de la ligne `git apply` du § 2 (« Sur un `main` bougé ») ; on n'y juge que les noms.

### § 1 — Les bancs neufs d'abord, vus rouges, dans un arbre à part ; puis le banc des durées sous charge

```bash
git worktree add --detach "$S/rouge" HEAD
(cd "$S/rouge" && git apply --include='scripts/*' --include='skills/chaine/fusionner/scripts/*.test.mjs' --include='skills/chaine/sujet/scripts/faux-gh.mjs' "$S/91/ticket-91.patch" && git status --short && pnpm install --frozen-lockfile > /dev/null)
(cd "$S/rouge" && env -u NODE_PATH timeout 900 node --test --test-reporter=tap scripts/dossiers-poses.test.mjs scripts/chaine-seule.test.mjs skills/chaine/fusionner/scripts/checks-exiges-vides.test.mjs 2>&1 | grep -E '^not ok|^ok|^# (tests|pass|fail) ')
(cd "$S/rouge" && env -u NODE_PATH timeout 900 node --test --test-reporter=tap --test-name-pattern='checks exigés vide' skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs 2>&1 | grep -E '^not ok|^ok|^# (tests|pass|fail) ')
git worktree remove --force "$S/rouge"
sh "$S/91/charge.sh" 20 node --test --test-reporter=tap skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs 2>&1 | grep -E '^not ok|ms à 20000|load average|^# (tests|pass|fail) '
```

`git status --short` : quatre ` M` (`scripts/pose-du-socle.mjs`, `scripts/references-posees.test.mjs`, `sujet-fusionner.test.mjs`, `faux-gh.mjs`) et trois `??` (`scripts/chaine-seule.test.mjs`, `scripts/dossiers-poses.test.mjs`, `checks-exiges-vides.test.mjs`) : les bancs seuls, sur le code de `main`. Attendu sur `24fbd72` : `# tests 9`, `# pass 1`, `# fail 8`, le seul vert étant `blocDuPlugin : la liste entre les deux marqueurs…` (une fonction du banc) ; puis `# tests 1`, `# fail 1`, `not ok 1 - sujet.sh fusionner : une règle de checks exigés vide sur develop sort en 11…`. Le dernier bloc joue le banc de `main`, seul, sous 20 boucles à vide qu'il pose et retire (`charge.sh`, environ 1 min) : attendu `not ok … le plafond à 20 000 caractères : chaque pire cas mesuré se lit sous 10 s…` et une ligne `ms à 20000 caractères` au-delà de 10 000 ms. Sur un poste de plus de quatre cœurs, la charge ne suffit pas toujours : `charge.sh 40`, une fois ; s'il reste vert, l'écrire dans la PR, sans rien changer. Recopier ces lignes dans la PR.

### § 2 — Le patch, dans la branche, et ses bancs verts

```bash
git apply "$S/91/ticket-91.patch" && git status --short | awk '{ print $1 }' | sort | uniq -c
env -u NODE_PATH timeout 1500 node --test --test-reporter=tap scripts/dossiers-poses.test.mjs scripts/chaine-seule.test.mjs skills/chaine/fusionner/scripts/checks-exiges-vides.test.mjs skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs scripts/references-posees.test.mjs 2>&1 | grep -E '^# (tests|pass|fail|skipped|todo|cancelled) |^# régime|^not ok'
env -u NODE_PATH timeout 900 node --test --test-reporter=tap --test-name-pattern='checks exigés vide' skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok'
sh "$S/91/charge.sh" 20 node --test --test-reporter=tap skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs 2>&1 | grep -E '^not ok|load average|^# (tests|pass|fail) '
```

Le décompte de `git status --short` : `25 M` et `3 ??`. Attendu sur `24fbd72` : `# régime 8 : 30 bancs, 414 tests, 413 verts, 1 sautés`, la même ligne au régime 7, `# tests 100`, `# pass 100`, `# fail 0`, `cancelled`, `skipped` et `todo` à 0, aucun `not ok` ; puis `# tests 1`, `# pass 1` ; puis, sous charge (environ 2 min 30), `# tests 88`, `# pass 88`, aucun `not ok`.

**Le socle posé en chaîne seule passe son gate** (environ 2 min, `pnpm install` d'un jouet, registre npm) :

```bash
bash "$S/91/essai-chaine-seule.sh" "$PWD" "$S/jouet-91" --geler 2>&1 | grep -E '^==|^sortie|^references-agent|lien\(s\) cassé|gelée :'
```

Attendu : après `== pnpm lint`, `sortie 0` ; douze lignes `gelée :` (quatre de `.claude/rules/tests.md`, sept de `docs/agents/criteres-revue.md`, une de `docs/agents/pieges.md`) ; `references-agent : OK — 17 fichiers, 0 nouvelle, 12 gelée(s)` et `sortie 0` ; `0 lien(s) cassé(s)` ; après `== premier commit`, `sortie 0`, et aucun `scripts/…` sous `== reformatés par lint-staged au commit`. Puis `rm -rf "$S/jouet-91"`.

**Sur un `main` bougé** (§ 0) : le premier geste du § 2 devient

```bash
git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md "$S/91/ticket-91.patch"
node "$S/91/version-suivante.mjs" "$S/91/ticket-91.patch"
git status --short | awk '{ print $1 }' | sort | uniq -c
```

(au départ seulement, la branche n'ayant pas encore de note, l'annexe la donne ; `version-suivante.mjs` écrit la version prise), et l'on n'y juge que : au § 1, `# fail 8` et `# fail 1`, et les mêmes noms en échec ; au § 2, `25 M` et `3 ??`, aucun `not ok`, `# fail 0`, `1 sautés` à chaque régime du garde, et les attendus de l'essai de pose. Un `git apply` qui échoue sur un autre fichier que les deux de version : s'arrêter et l'écrire au lanceur.

Le patch, fichier par fichier (il fait foi) :

- **`.prettierignore`** (gabarit) : après `docs/**/*.html`, une ligne vide, trois lignes de commentaire, `# socle:poses-du-plugin`, les cinq dossiers, `# /socle:poses-du-plugin`.
- **`eslint.config.mjs`** (gabarit) : `readFileSync` dans l'import de `node:fs` ; après `root`, quatre lignes de commentaire, `prettierignore` : `readFileSync(join(root, ".prettierignore"), "utf8")` découpé par `/\r?\n/`, chaque ligne sans blancs aux bords ; `debutPoses`, `finPoses` (les lignes `# socle:poses-du-plugin` et `# /socle:poses-du-plugin`) ; sans l'un, ou dans le désordre, `throw new Error(".prettierignore : le bloc « # socle:poses-du-plugin » … « # /socle:poses-du-plugin » manque ; …")` ; puis `posesDuPlugin` : les lignes entre les deux, sans vide ni commentaire, `scripts/agent/` → `scripts/agent/**` ; `...posesDuPlugin,` à la fin des `ignores`.
- **`regles.test.mjs`** : avant `const livree`, un commentaire (ticket 91, pourquoi l'étalon, les mesures), `ETALON`, `duree(f)`, `etalon()` (l'assertion « au moins 20 ms »), `enEtalons(f)` ; « ticket 33 : … 30 000 lignes … » : `enEtalons`, borne 20, titre « en moins de 20 étalons (5 s sur un poste libre) » ; « ticket 33, contre-relecture C1 » : `mesure` par `enEtalons`, `grand.etalons < 8` au lieu de `grand.s < 2`, et le rapport « moins de six fois » en étalons, `grand.etalons < 6 * petit.etalons + 0.8` au lieu de `grand.s < 6 * petit.s + 0.2`, avec son commentaire ; « Le cas qui coûtait au cube » et « le plafond se teste avant toute lecture » : borne 8 ; « le plafond à 20 000 caractères » : un commentaire de plus, titre « sous 40 étalons (10 s sur un poste libre) », borne 40, le refus par `duree` rapporté à l'étalon du cas, borne 4 ; « ticket 48 : `ajouts(code)`… » : borne 4. Plus aucun `Date.now()` ; `process.hrtime` dans `duree` seule.
- **`github.sh`** : l'en-tête de `checks_exiges` (la sortie 6) ; `reglage_checks_vides <où>` (la ligne, sortie 6) ; `checks_exiges` : la liste des rulesets dans `exiges`, puis, vide, une règle `required_status_checks` présente → `reglage_checks_vides "la branche develop (ruleset <ids>)"` ; l'ancienne protection lue `--absent 'null'` : `null` → `[]`, une liste vide → `reglage_checks_vides "la protection de branche de develop (Settings → Branches)"` ; `attendre_ci` : `|| return $?`, et le 6 dans son en-tête.
- **`file.sh`** : l'en-tête (sortie 6), `|| exit $?`. **`boucle.sh`** : `6) echo "ARRÊT : réglage du dépôt …"; exit 6 ;;` avant `*)`. **`passer.sh`** : l'en-tête (« réglage du dépôt »), `6) sortir 3 "réglage du dépôt …"` avant `*)`. **`sujet.sh`** : l'en-tête (· 11 `fusionner` : réglage du dépôt), la lecture unique (`[ $? != 6 ] || sortir 11 …` puis `sortir 5 …`), `6) sortir 11 …` après le 5 de l'attente.
- **`faux-gh.mjs`** : `rules/branches/develop` rend `[]` sous `protectionClassique` ou sans check exigé ni `regleVide`, sinon la règle avec `ruleset_id: 42` ; l'ancienne protection : 404 « Branch not protected » sans `protectionClassique`, `{ contexts }` avec des checks ou `regleVide`, sinon 404 « Required status checks not enabled ».
- **`checks-exiges-vides.test.mjs`**, **`sujet-fusionner.test.mjs`** (un test avant « Contre-relecture (M2, M3) »), **`dossiers-poses.test.mjs`**, **`chaine-seule.test.mjs`** : les tests des décisions 1, 2, 4, 5, 6 (le message `RÉGLAGE DU DÉPÔT` lu en entier, sans « retirer la règle » ; la case de `admin.md` et son geste).
- **Les textes** : `socle-monorepo/SKILL.md` (un paragraphe à l'étape 7, un nom à l'étape 8 ; 197 lignes), `CONTENU.md`, `conception.md`, `pare-feu-ci.md`, `socle-chaine-de-production/SKILL.md` (90 lignes), `admin.md`, `pieges.md`, `anchorpost/SKILL.md` et son ADR, `fusionner/SKILL.md` (une phrase, 139 lignes), `README.md`, `pose-du-socle.mjs` (`export`), le commentaire de `references-posees.test.mjs`, **`NOTES-DE-VERSION.md`** (« Ce qui change », « Ce qu'un projet fait pour en profiter » : le bloc et sa lecture, reposer les scripts, reporter un `docs/agents/admin.md`, vérifier la règle de checks, qui rend `qualite`, `test-db` et `zizmor`), **`plugin.json`** (8.3.1).

### § 3 — Vérifier, commiter, livrer

```bash
git add -A && git diff --cached --stat origin/main | tail -n 1
git commit -m "fix(socle): un socle posé en chaîne seule passe son propre gate (plugin <version>)"
git status --short
```

`<version>` : 8.3.1 sur `24fbd72` ; sinon celle que `version-suivante.mjs` a écrite. La dernière ligne du `--stat` : `28 files changed` (`448 insertions(+), 60 deletions(-)` sur `24fbd72`) ; `git status --short` vide. Puis les mutations, en tâche de fond (`run_in_background`), avec le `timeout` de l'outil Bash à `3700000` :

```bash
timeout 3600 node "$S/91/mutations.mjs" > "$S/mutations.log" 2>&1; echo "sortie $?"; grep -c '^ROUGE ' "$S/mutations.log"; grep -v '^ROUGE ' "$S/mutations.log"; git status --short
```

Attendu : `sortie 0`, `26` rouges, la seule ligne `toutes rouges`, `git status --short` vide (V4 ajoute un dossier et le retire). Une ligne `DÉLAI` n'est pas un rouge : la rejouer seule (`node "$S/91/mutations.mjs" V<n>`), et si elle redépasse, s'arrêter et l'écrire au lanceur. Puis la suite entière, seule (pas pendant les mutations), en tâche de fond, avec le `timeout` de l'outil Bash à `1900000` ; noter la charge avant (`uptime`) :

```bash
uptime; env -u NODE_PATH timeout 1800 pnpm test > "$S/suite.log" 2>&1; echo "sortie $?"; uptime; grep -E '^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) ' "$S/suite.log"
```

Attendu : `sortie 0`, `# tests 1471`, `# pass 1471`, `# fail 0` sur `24fbd72` (1 461 sur `main`, plus les 10 des bancs neufs) ; ailleurs, le compte de `main` plus 10. Un cas de durée qui dépasse : jamais sauté ; rejouer la suite une fois, puis l'écrire au lanceur. Puis :

```bash
git push origin claude/chaine-seule
```

La PR vers `main`, prête (pas en brouillon), sans étiquette, son titre le message du commit. Dans le corps : le § 1 (rouges avant, dont le banc des durées sous charge), le § 2 (verts après, l'essai de pose), le journal des mutations, la suite entière (compte, durée, charge avant et après), et les décisions 1, 6 et 7 en une phrase chacune. La session ne la fusionne pas. `Label: contre-revue` : l'architecte la fait contre-relire.

**Le job `bancs` de la PR** (décision 9), en tâche de fond, avec le `timeout` de l'outil Bash à `2800000` (`<n>` : le numéro de la PR) :

```bash
timeout 2700 gh pr checks <n> --watch --interval 60; echo "sortie $?"
```

Attendu : la ligne `bancs` en `pass`, `sortie 0`. Si `gh` est refusé : l'outil GitHub MCP `pull_request_read`, méthode `get_check_runs`, toutes pages lues, relu toutes les 5 minutes, au plus 45 minutes : le check run `bancs` du sommet poussé en `completed`, conclusion `success`. Rouge, ou toujours en cours au bout de 45 minutes : la session ne corrige rien ; elle rend au lanceur les lignes `not ok` du journal du job. Puis elle rend au lanceur l'URL de la PR, ces sorties et l'issue du job `bancs`, et s'arrête.

**Si `main` a bougé entre l'ouverture de la PR et sa fusion** : fusionner `origin/main` dans la branche par un commit de fusion, jamais de rebase ni de push forcé ; la note se repose depuis la branche (décision 8), prise avant la fusion ; `NOTES-DE-VERSION.md` et `.claude-plugin/plugin.json` en conflit, et eux seuls, se reprennent de `main`, et la version suivante se pose de nouveau :

```bash
git fetch origin main
git diff "$(git merge-base origin/main HEAD)" HEAD -- NOTES-DE-VERSION.md > "$S/91/note-de-la-branche.patch"
git merge --no-ff --no-edit origin/main; git diff --name-only --diff-filter=U
git checkout origin/main -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
node "$S/91/version-suivante.mjs" "$S/91/note-de-la-branche.patch"
git add -A && git commit --no-edit && git push origin claude/chaine-seule
```

Un autre fichier en conflit : s'arrêter et l'écrire au lanceur. Puis la suite entière à nouveau, le titre de la PR à la version prise, et le job `bancs` du nouveau sommet relu comme plus haut.

## Surfaces

| Surface | Preuve |
| --- | --- |
| le lint de la racine ne lit pas les scripts posés ; Prettier et lint-staged ne les reformatent pas | l'essai de pose (§ 2 : `pnpm lint` sortie 0, aucun script reformaté) ; `dossiers-poses.test.mjs` ; V3, V5 |
| la liste des dossiers posés est unique et égale aux dossiers que les skills posent, hors de `scripts/db/` | `dossiers-poses.test.mjs` ; V1, V2, V4 |
| `eslint.config.mjs` lit le bloc en CRLF, et sans bloc lève une erreur qui le nomme | `dossiers-poses.test.mjs` (test 3) ; V25, V26 |
| les références d'une brique non posée sont dites, et elles seules gelées ; le registre des coûts est généré à la pose | `chaine-seule.test.mjs` (test 3) ; l'essai de pose (`0 nouvelle, 12 gelée(s)`) ; V19, V20 |
| la méthode posée par la racine n'a aucun lien vers une brique absente | `chaine-seule.test.mjs` (test 2) ; l'essai de pose (`0 lien(s) cassé(s)`) ; V18 |
| un seul nom, `docs/agents/chaine-admin.md` | `chaine-seule.test.mjs` (test 1) ; V17 |
| une règle de checks exigés vide (ruleset ou ancienne protection) sort en 6, dite à la première lecture ; sans règle, « sans CI » comme avant | `checks-exiges-vides.test.mjs` (test 1), `github.test.mjs` inchangé ; V6, V7 |
| `file.sh` sort en 6, la boucle s'arrête sur le réglage, jamais « de côté » | `checks-exiges-vides.test.mjs` (test 2) ; V8, V9 |
| `passer.sh` sort en 3, `sujet.sh fusionner` en 11, sur le réglage | `checks-exiges-vides.test.mjs` (test 3), `sujet-fusionner.test.mjs` ; V10, V11, V12 |
| `chaine-admin.md` dit la règle vide à la protection de `develop`, et le geste : ajouter les checks, jamais retirer la règle ; le message `RÉGLAGE DU DÉPÔT` de même | `chaine-seule.test.mjs` (test 1), `checks-exiges-vides.test.mjs` (test 1) ; V21, V23, V24 |
| les durées de `regles.test.mjs` passent sous charge, et prouvent ce qu'elles prouvaient, rapport C1 compris | § 1 et § 2 sous `charge.sh 20` ; V13 à V16, V22, et V13 à V15 contre le banc d'avant |
| le garde du ticket 90 (bancs posés, régimes 8 et 7) reste vert, `regles.test.mjs` posé compris | `references-posees.test.mjs`, sans `NODE_PATH` (§ 2) |

## Mutations

[`91-annexes/mutations.mjs`](91-annexes/mutations.mjs), depuis la racine, la branche commitée (§ 3) : `node "$S/91/mutations.mjs"`. Chacune seule, le fichier remis (ou retiré) après, sur le banc qu'elle nomme ; le journal donne le test en échec et la première ligne de son erreur. Journal : [`91-annexes/mutations.txt`](91-annexes/mutations.txt).

| Mutation | Banc | Issue |
| --- | --- | --- |
| V1 `.prettierignore` du gabarit : `scripts/github/` sort du bloc | `dossiers-poses.test.mjs` | rouge |
| V2 `.prettierignore` du gabarit : `scripts/db/` (au projet) entre dans le bloc | `dossiers-poses.test.mjs` | rouge |
| V3 `eslint.config.mjs` du gabarit : les dossiers lus ne vont pas aux `ignores` | `dossiers-poses.test.mjs` | rouge |
| V4 un skill pose un dossier de `scripts/` de plus (`references/scripts/nouveau/`), hors du bloc | `dossiers-poses.test.mjs` | rouge |
| V5 lint-staged du gabarit : ESLint sans `--no-warn-ignored` | `dossiers-poses.test.mjs` | rouge |
| V6 `checks_exiges` : une règle de ruleset vide se lit `[]` (le code d'avant) | `checks-exiges-vides.test.mjs` | rouge (6 s) |
| V7 `checks_exiges` : une protection de branche à liste vide se lit `[]` | `checks-exiges-vides.test.mjs` | rouge (3 s) |
| V8 `file.sh` : le réglage du dépôt sort en 5 (« GitHub illisible », la boucle en pause) | `checks-exiges-vides.test.mjs` | rouge (2 s) |
| V9 `boucle.sh` : la sortie 6 de `file.sh` n'est pas dite réglage du dépôt | `checks-exiges-vides.test.mjs` | rouge (3 s) |
| V10 `passer.sh` : la sortie 6 d'`attendre_ci` lue « checks toujours en attente » | `checks-exiges-vides.test.mjs` | rouge (3 s) |
| V11 `sujet.sh fusionner` : la sortie 6 d'`attendre_ci` lue comme une CI pas finie | `sujet-fusionner.test.mjs` | rouge (1 s) |
| V12 `sujet.sh fusionner` : la lecture unique d'une PR de mise à jour lit le réglage « GitHub illisible » | `sujet-fusionner.test.mjs` | rouge (2 s) |
| V13 `regles.mjs` : `(?<!\d)` retiré, la lecture de 7.9.x redevient quadratique sur une suite de chiffres | `regles.test.mjs` (« ticket 48 ») | rouge : 30,7 étalons pour 4 |
| V14 `regles.mjs` : le plafond se teste après les deux lectures | `regles.test.mjs` (« le plafond à 20 000 ») | rouge : 7,9 étalons pour 4 |
| V15 `regles.mjs` : le pire cas `gh pr close 1 -ddd…!` dix fois plus lent | `regles.test.mjs` (« le plafond à 20 000 ») | rouge : 91,4 étalons pour 40 |
| V16 `regles.test.mjs` : l'étalon ne recule plus (une expression linéaire) | `regles.test.mjs` | rouge : « étalon de 0,09 ms » |
| V17 `anchorpost` : la recette de l'admin de nouveau dans `docs/agents/admin.md` | `chaine-seule.test.mjs` | rouge |
| V18 `conception.md` : le lien vers `apps/api/CLAUDE.md` de retour | `chaine-seule.test.mjs` | rouge |
| V19 `socle-chaine-de-production` : la génération du registre des coûts n'est plus dite | `chaine-seule.test.mjs` | rouge |
| V20 `socle-monorepo` : le gel à l'allumage n'est plus dit | `chaine-seule.test.mjs` | rouge |
| V21 `chaine-admin.md` : la case des checks exigés ne dit plus la règle vide | `chaine-seule.test.mjs` | rouge |
| V22 `regles.mjs` : la lecture relit toute la commande à chaque expansion (quadratique sur le cas C1) | `regles.test.mjs` (« contre-relecture C1 ») | rouge : 1,96 étalon pour une borne de 1,52 (0,12 pour le petit cas) |
| V23 `checks_exiges` : `RÉGLAGE DU DÉPÔT` propose de nouveau « ou retirer la règle » | `checks-exiges-vides.test.mjs` | rouge |
| V24 `chaine-admin.md` : la case des checks exigés propose de nouveau de ne poser la règle qu'après le premier run | `chaine-seule.test.mjs` | rouge |
| V25 `eslint.config.mjs` du gabarit : `.prettierignore` découpé sur `\n` seul, sans `trim` (un fichier en CRLF ne se lit plus) | `dossiers-poses.test.mjs` | rouge |
| V26 `eslint.config.mjs` du gabarit : sans le bloc, aucune erreur | `dossiers-poses.test.mjs` | rouge |

26 rouges sur 26. V13 à V15, jouées depuis un clone de `main` à `24fbd72` (le banc d'avant, ses bornes en millisecondes), y sont rouges aussi : 8 699 ms pour 1 000, 2 568 ms pour 1 000, 24 101 ms pour 10 000 ([`mutations-banc-d-avant.txt`](91-annexes/mutations-banc-d-avant.txt)) : les étalons ne laissent passer aucune des trois.

## Vérification

1. § 1 : 8 rouges sur 9 et 1 sur 1, sans `NODE_PATH` ; le banc des durées de `main` rouge sous charge.
2. § 2 : 100 verts sur 100 et 1 sur 1, sans `NODE_PATH`, le garde aux deux régimes ; le banc des durées du patch vert sous la même charge, rapport C1 compris ; le socle posé en chaîne seule passe `pnpm lint` et `check:contexte`.
3. Les mutations, depuis la racine, la branche commitée : « toutes rouges » (26).
4. La suite entière : 1 471 sur `24fbd72`, sortie 0, sans `NODE_PATH`.
5. Le job `bancs` de la PR : `success`.

### Ce qui a été joué en écrivant ce ticket

Sur un clone neuf de `main` à `24fbd72` (plugin 8.3.0), le 2026-11-23, Node 22.23.5, git 2.43.0, quatre cœurs (charge notée aux bords de chaque passe) :

- **L'essai de pose, avant et après** ([`essai-8.3.0.txt`](91-annexes/essai-8.3.0.txt), [`essai-8.3.1.txt`](91-annexes/essai-8.3.1.txt)) : les sept défauts mesurés (table du « Besoin »), puis le patch : `pnpm lint` sortie 0 ; `references-agent : OK — 17 fichiers, 0 nouvelle, 12 gelée(s)` ; 0 lien cassé ; au premier commit, aucun script posé reformaté (les 18 autres fichiers le restent, « Ce qui a été trouvé en plus », 3). Puis `pnpm check` du jouet patché, entier : 9 étapes vertes en 571 s ([`check-8.3.1.txt`](91-annexes/check-8.3.1.txt)). Le dépôt de l'essai réel, lu sans être modifié, a servi de témoin : la liste de ses fichiers posés est celle du jouet, hors de ses fichiers d'essai, de `docs/agents/couts.md` (généré), de `scripts/chaine/suites-du-lot-5.test.mjs` (neuf depuis 8.0.0) et de `scripts/github/develop.test.mjs` (sorti de `references/` au ticket 90).
- **La lecture de `docs/methode/`** ([`methode-mesure.txt`](91-annexes/methode-mesure.txt)) : `references-agent` tel quel, puis avec `docs/methode/` lu, sur le jouet, sur le dépôt de l'essai réel et sur un dépôt réel posé avec l'API, le web et la chaîne, chacun copié, dette vidée.
- **Les durées** : chaque cas de `regles.test.mjs` mesuré libre et sous 20 boucles à vide ([`mesures.txt`](91-annexes/mesures.txt)) ; l'étalon, et le rapport de chaque pire cas, libre et sous charge ([`etalon.mjs`](91-annexes/etalon.mjs), [`etalon.txt`](91-annexes/etalon.txt)) ; les deux bancs entiers sous charge ([`durees-sous-charge.sh`](91-annexes/durees-sous-charge.sh), [`durees-sous-charge.txt`](91-annexes/durees-sous-charge.txt) : celui de `main` rouge, 12 469 ms ; celui du patch 88 sur 88, sous une charge montée de 13 à 20).
- **La relecture du ticket, puis ses retouches** (A-219, [`relecture-tour-1.md`](91-annexes/relecture-tour-1.md), ses journaux sous [`relecture-tour-1/`](91-annexes/relecture-tour-1/)) : le patch d'avant rejoué entier (§ 1, § 2, l'essai de pose, `pnpm check` du jouet, 21 mutations, la suite) ; le rapport C1 en secondes rouge sous `charge.sh 20` ; un dépôt sans aucune règle de checks rejoué contre le faux `gh` ([`sonde-sans-regle.test.mjs`](91-annexes/sonde-sans-regle.test.mjs)) ; les mesures du cas C1, libre et sous charge, avec et sans lecture quadratique ([`sonde-c1.mjs`](91-annexes/sonde-c1.mjs)). Puis, le patch retouché : l'essai de pose rejoué (mêmes attendus qu'au § 2 ; un `.prettierignore` en CRLF : `pnpm lint` sortie 0 ; sans bloc : sortie 1, l'erreur qui nomme le bloc), et tout ce qui suit.
- **Les § 0 à § 3**, le patch appliqué sur un clone neuf (§ 1, [`s1-rouge.txt`](91-annexes/s1-rouge.txt) : 8 rouges sur 9, 1 sur 1 ; § 2, [`s2-vert.txt`](91-annexes/s2-vert.txt) : 25 ` M`, 3 `??`, le garde à 30 bancs et 414 tests par régime, 100 sur 100, 1 sur 1 ; le commit du § 3 : `28 files changed, 448 insertions(+), 60 deletions(-)`, arbre `5c153632…`) ; les mutations, la branche commitée ([`mutations.txt`](91-annexes/mutations.txt)) : **26 rouges sur 26**, `sortie 0`, `git status --short` vide ; la suite entière, seule, après les mutations, sans `NODE_PATH` ([`suite.txt`](91-annexes/suite.txt)) : **1 471 tests, 1 471 verts**, aucun échec, saut, annulation ni « todo », 14 min 20 s (09:59:00 → 10:13:21 UTC, `duration_ms` 860432), charge 3,82 au départ (la fin des mutations), 1,19 à la fin ; et celle de `main` à `24fbd72`, de même : 1 461 tests, 1 461 verts, 16 min 56 s ([`suite-main.txt`](91-annexes/suite-main.txt)).

## Ce qui n'a pas été établi

1. **Une vraie pose en 8.3.1 par une session qui suit les `SKILL.md`** : le jouet est posé par un script qui les recopie ([`poser-chaine-seule.mjs`](91-annexes/poser-chaine-seule.mjs) : sans graphify ni `setup-matt-pocock-skills`, le repli de l'étape 4 ; ADR numérotées 5 à 9 comme à l'essai) ; un geste qu'il ne suit pas lui échappe. Rien, dans le plugin, ne joue `pnpm lint` ni `check:contexte` sur un socle posé (l'extension du ticket 90, « Hors périmètre ») : la liste du bloc est tenue par `dossiers-poses.test.mjs`, ESLint et Prettier ne sont joués que dans l'essai.
2. **Une pose avec services** (api, web, mobile, `socle-tests`) : non jouée. Ce qu'elle change ici : les références gelées sont moins nombreuses (aucune avec l'API et `socle-tests`), les liens de la méthode résolvaient déjà ; `apps/*/eslint.rules.mjs` et les blocs de `.prettierignore` des services ne touchent pas aux cinq dossiers.
3. **La règle de checks vide sur le vrai GitHub** : jouée contre le faux `gh` seul, à la forme que l'essai réel a rapportée (une règle `required_status_checks` à liste vide dans `rules/branches/develop`) ; la réponse exacte de l'ancienne protection à « Require status checks » coché sans check (`{"contexts": []}` supposé) n'a pas été lue sur GitHub. Le `ruleset_id` du message vient de la réponse ; absent, le message dit `?`.
4. **L'étalon sur un autre poste et un autre Node** : mesuré sur un seul poste (quatre cœurs, Node 22.23.5) ; les bornes en étalons y valent les bornes d'avant. Le rapport C1 en étalons est vert trois fois sur trois sous `charge.sh 20` ; sous une charge plus haute encore (une autre session sur le poste, la relecture), seul l'essai de la retouche l'a joué, trois fois. Sa marge de 0,8 étalon laisse passer une lecture quadratique qui coûterait moins de deux étalons environ au grand cas : le banc prouve « pas de croissance quadratique coûteuse », pas « linéaire » au sens strict. Un moteur d'expressions plus rapide sur la forme de l'étalon que sur celles de la garde abaisserait la marge ; un moteur qui ne recule plus du tout rougit le banc (V16), il ne le fait pas passer.
5. **Les projets posés avant 8.3.1** : la note leur dit d'ajouter le bloc et sa lecture à leur `.prettierignore` et à leur `eslint.config.mjs`, qui sont à eux ; aucun banc ne le vérifie chez eux.
6. **Un dépôt sans aucune règle de checks exigés** : rien n'y entre (décision 6, `passer.sh` sortie 3 « CI non déclenchée », la PR de côté), et rien ne le dit ; ce ticket ne le change pas, un ticket de suite de la famille `fusionner` le lira comme un réglage du dépôt.
7. **Le job `bancs` réel de la CI du plugin** : la suite a tourné sur un poste de session, sous `env -u NODE_PATH` ; la session lit le vrai job (décision 9).

## Hors périmètre

- **Les 14 erreurs ESLint des scripts posés** : la CI du plugin est leur gate (décision 1) ; elles ne rougissent plus aucun projet.
- **Le garde étendu** (« L'extension » du ticket 90) : jouer `pnpm lint` et `pnpm check:contexte` sur le projet jouet du garde, avec la pose de la racine et ses dépendances ; un ticket suivant, que ce ticket rend possible (le jouet passe déjà les deux).
- **Les 18 fichiers posés hors des scripts que Prettier reformate** (« Ce qui a été trouvé en plus », 3) : écrire les gabarits au format qu'ils posent demanderait Prettier dans le plugin (une dépendance nouvelle) ; à la liste des suites.
- **L'entrée OpenAPI du gabarit `index-generes.json`** posée sans API (« Ce qui a été trouvé en plus », 5), et **les autres bornes en millisecondes** des bancs posés (6) : à la liste des suites.
- **« Aucun check exigé » lu comme un réglage du dépôt** (décision 6) : un ticket de suite, famille `fusionner` (`checks_exiges` ou ses appelants, `github.test.mjs`, les bancs à `exiges: []`).
- **La garde textuelle des commandes contournée par reformulation** (information de la PR de pose) : sans rapport avec le gate du projet.

## Comments

- 2026-11-23 — Écrit par un agent rédacteur sur l'essai réel de la pose du socle en chaîne seule (journal du programme, 14 h 32 et 15 h 05 UTC du 2026-11-22), sur un clone neuf de `main` à `24fbd72` (plugin 8.3.0) ; essais, bancs, mutations et suite joués.
- 2026-11-23 — Retouché après la relecture du ticket (A-219 : tous les constats pris, [`91-annexes/relecture-tour-1.md`](91-annexes/relecture-tour-1.md)), par le relecteur, le rédacteur d'origine perdu dans un redémarrage du conteneur : le rapport C1 de `regles.test.mjs` en étalons (B1, mutation V22) ; « ou retirer la règle » retiré du message `RÉGLAGE DU DÉPÔT`, de son test et de `admin.md`, le cas « aucun check exigé » écrit et renvoyé à un ticket de suite (B2, V23, V24) ; `zizmor` dans la note (m1) ; `eslint.config.mjs` découpé par `/\r?\n/`, une erreur sans bloc (m2, V25, V26) ; une seule mesure de charge, celle d'`etalon.txt` (m3) ; les PR 44 et 56 dans « Fichiers chauds » (m4). Patch régénéré sur `24fbd72` (sha256 `00365efa…`, arbre `5c153632…`, `448 insertions(+), 60 deletions(-)`) ; § 1, § 2, l'essai de pose, les 26 mutations et la suite entière rejoués, seuls sur le poste. Pas de second tour sur le ticket : les deux tours de la PR vont à un agent neuf.
