# Contre-relecture de la PR 154 (tickets 86, 87, 88), tour 1

PR https://github.com/MAJ-agency/skills/pull/154, « feat(socle-tests): le gate preuves, la grille par criticité, la mutation
au pivot 3 datée (plugin 8.1.0) », branche `claude/preuve-suffisante-socle-tests` au sommet
`42c51491fcff085e4922e67e95bc4f2c915b9698`, base `main` à `ddb4265` (plugin 8.0.0). Relue le 2026-11-22 sur un clone neuf de
`MAJ-agency/skills`, Node 22.23.5, git 2.43.0, une machine partagée avec d'autres agents (charge notée aux bords de chaque
passe, entre 7 et 29). Lecture seule : rien de poussé, aucun commentaire ni étiquette. Les tickets et leurs annexes :
`claude/hopeful-lovelace-ouk6tz` à `856e1c0`. Anchorpost : un clone de `develop` à `31afa3d`, en lecture, et la CLI publiée
`@maj-agency/anchorpost` 2.0.1 installée à part.

## Verdict : non conforme

Aucun bloquant. Le code tient ses décisions : le relais `preuves.mjs`, joué contre la vraie CLI 2.0.1 sur Anchorpost, rend la
sortie de `compare`, dit chaque écart, bloque la vraie fin de tour d'Anchorpost en `enforce` et ne fait rien sans index au
pivot 3 ; au schéma 2, le périmètre de la mutation est octet pour octet celui de `main` ; le workflow passe `zizmor` (personas
`pedantic` et `auditor`, aucun constat) et son filtre `gh api … --jq … env.BRANCHE` rend le bon passage contre l'API réelle ; les
35 mutations de l'annexe sont rouges ; le geste du § 3 tient pour les cinq ordres d'entrée des PR 152, 153 et 155. Mais **quatre
écarts à corriger** : deux bancs creux sur des chemins qui comptent (le workflow, dont le banc de texte est la seule garde, et le
premier push d'un sujet neuf), la note 8.1.0 qui ne dit pas ce qu'une repose doit reposer avec (dans Anchorpost, le banc reposé
casse `check:tickets`, donc le pre-push et la CI), et la fiche des tests qui définit « prouvée » autrement que la CLI et que
`RULE_ALL_ANC-28`. Chacun a sa retouche essayée, rouge avant, vert après. Après les décisions de l'architecte (`A-205`, plus
bas), une seule retouche, `retouches/retouche-154-tour-1.patch` sur `42c5149` (sha256 `6c441645bac6c21d16c038b467fe80590f20f07a0a4c87db93a0df95dce7887b`),
porte les quatre, le mineur 5, les mineurs 6, 7 et 8 et le chiffre de la question 3 ; **aucun test ajouté : la suite attendue
reste 1 422** sur `main` à `ddb4265`.

| # | Gravité | Objet |
| --- | --- | --- |
| 1 | **à corriger** | `mutation.yml` : le banc ne tient ni le nom de l'artefact dans l'URL de `gh api`, ni la tolérance d'un appel ou d'un téléchargement en échec, ni l'ordre « synthèse puis publication » ; quatre mutations qui cassent la mesure précédente ou la publication sont vertes (C1 à C4) |
| 2 | **à corriger** | `preuves.mjs`, ligne 123 : le premier push d'un sujet neuf (`origin/sujet/<nom>` absent en local) retombe sur la base la plus proche, mais aucun banc ne le joue ; la mutation qui le refuse en « base absente » (sortie 2, en `observe` aussi) est verte (C9), avec deux voisines (C10, C11) |
| 3 | **à corriger** | `NOTES-DE-VERSION.md`, ligne 16 : « Reposer … `preuves.mjs` et son banc » sans ses deux appuis ; dans Anchorpost, le banc reposé ne se charge pas (`scripts/docs/environnement-de-banc.mjs` absent) et `check:tickets` casse |
| 4 | **à corriger** | `tests.md`, ligne 43 : « prouvée quand chacun de ses cas l'est » ; la CLI 2.0.1 dit partielle une règle haute aux cinq cas prouvés dont une famille est sans réponse, et `RULE_ALL_ANC-28` laisse partielle une règle à question ouverte |
| 5 | mineur | décisions 6 et 8 du ticket 86 sans banc : la condition de la grille, la ligne du pre-push, l'entrée dans `gatesRapides`, l'étape de CI (C5 à C8 vertes) |
| 6 | mineur | au pre-push, `compare` juge l'arbre de travail, pas le commit poussé : un commit qui porte un écart passe en `enforce` si sa preuve n'est que dans un fichier non suivi (joué) ; ni l'en-tête ni `SKILL.md` ne le disent |
| 7 | mineur | `preuves.mjs` : un argument sans `--` (`preuves.mjs HEAD~3`) n'est ni refusé ni lu, la décision 5 dit « un usage faux » en 2 |
| 8 | mineur | `preuves.mjs`, en-tête : « la base comme `coverage-diff --base-auto` », mais sans sa règle du sujet mis à jour (`sujetMisAJour`) ; la « Limite » ne dit que le cas où le sujet est le plus proche |

## Les décisions de l'architecte (`A-205`) et ce que la retouche en porte

| Constat ou question | Décision | Dans `retouche-154-tour-1.patch` |
| --- | --- | --- |
| 1 à 4 (à corriger) | les retouches retenues | les bancs du workflow (1) et du relais (2), la note (3), la fiche (4) |
| 5 (mineur) | dans la retouche | quatre phrases exigées (C5 à C8 rouges) |
| 6 (mineur) | par le texte : le pre-push juge l'arbre de travail, la CI le commit | l'en-tête de `preuves.mjs` (« Limites ») et l'étape 2.3 de `SKILL.md`, une phrase exigée (C19) |
| 7 (mineur) | refuser un argument sans `--` si c'est trois lignes et un cas de banc | une ligne de code et son commentaire, l'usage de l'en-tête ; `["HEAD~3"]` et `["--base-auto", "origin/develop"]` dans la boucle d'usage du banc, sans test neuf (C18) |
| 8 (mineur) | par le texte : la base et ses deux cas | l'en-tête (« Limites ») et `SKILL.md`, une phrase exigée (C21) |
| question 1 | l'annexe n'est pas régénérée ; à la fusion de `main`, la note se repose depuis la branche (`git diff $(git merge-base origin/main HEAD) HEAD -- NOTES-DE-VERSION.md`), jamais depuis l'annexe | rien ; le banc de la note (3) garde le geste honnête : joué, il rougit si la note vient de l'annexe (`essais/ordres-d-entree-a205.txt`) |
| question 2 | le dire | constat 6 |
| question 3 | gardé dans `gatesRapides`, le chiffre écrit | `SKILL.md` : « 13 à 17 s par passage, mesurés sur Anchorpost à une charge de 14 à 18 », une phrase exigée (C20) |

## Les constats

### 1. À corriger — le banc du workflow ne tient pas trois gestes dont la mesure précédente dépend

**Où.** `skills/monorepo/socle-tests/references/ci/mutation.yml`, lignes 46 à 71 ; son banc,
`scripts/preuve-suffisante-socle-tests.test.mjs`, lignes 40 à 71. Le workflow n'a jamais tourné sous Actions : `A-202` a fait
de ce banc sa seule garde (ticket 88, « Le patch », dernier point).

**Les scénarios qui cassent, sans qu'aucun banc ne rougisse** (mutations jouées, `mutations/contre-sur-42c5149.txt`) :

- **C1** : `actions/artifacts?name=mesure-regles&per_page=30` devient `actions/artifacts?per_page=30`. Le `[0]` du filtre est
  alors le dernier artefact de la branche par défaut, de n'importe quel workflow : contre l'API réelle, sur Anchorpost, c'est un
  paquet de la CLI (`essais/gh-api.txt`). `gh run download <id> -n mesure-regles` échoue, la synthèse dit chaque dimanche « Pas
  de mesure précédente lisible » et la baisse d'une règle moyenne ne se dit jamais. Le banc exige le `select(…)` et le
  `gh run download`, pas le nom.
- **C2** : l'étape « Mesure datée » passe avant « Synthèse par règle ». Le fichier n'existe pas encore, `if-no-files-found:
  ignore` : rien n'est jamais publié, rien n'est rouge. Le banc ne tient que l'ordre « Mesure précédente » puis « Mutation ».
- **C3, C4** : `|| id=''` ou `|| echo "mesure précédente illisible"` retirés. Sous le `bash -e` des étapes d'Actions, un appel
  à l'API ou un téléchargement en échec fait échouer l'étape, la mutation est sautée, le passage de la semaine est perdu ; la
  décision 3 du ticket 88 dit « aucun, ou un téléchargement en échec : la synthèse le dit ».

**La retouche** (partie 1 de `retouche-154-tour-1.patch`, le banc seul) : trois phrases de plus dans `exiger` (l'URL avec
`name=mesure-regles`, `][0].workflow_run.id // empty') || id=''`, le `gh run download … || echo "mesure précédente illisible"`)
et l'ordre `Synthèse par règle` avant `Mesure datée`. **Rouge avant, vert après** : C1 à C4 vertes sur `42c5149`, rouges la
retouche posée (`mutations/contre-sur-retouche.txt`) ; le banc vert sur le vrai workflow ; les W1 à W8 de l'annexe toujours
rouges, contre ce seul banc comme avec `depot.test.mjs`.

### 2. À corriger — le premier push d'un sujet neuf n'est joué par aucun banc

**Où.** `skills/monorepo/socle-tests/references/scripts/verify/preuves.mjs`, ligne 123 :
`if (poussee && existe(poussee)) base = poussee;`. Son banc, `preuves.test.mjs`, « la base : … » (ligne 153) et « une base
introuvable : … » (ligne 171).

**Le scénario.** `sujet.sh demarrer` crée `sujet/<nom>` et le pousse : le pre-push exporte `PRE_PUSH_REFS` vers
`refs/heads/sujet/<nom>`, que `origin/` ne connaît pas encore. Le code retombe sur la base la plus proche (comme
`coverage-diff`, `baseAuto`) : c'est juste. Mais la mutation **C9** (`if (poussee) base = poussee;`) est verte : la base devient
`origin/sujet/<nom>`, introuvable, `decisionSansBase` rend `base-absente`, sortie 2 ; chaque naissance de sujet serait refusée au
pre-push, dans tout projet au pivot 3, en `observe` aussi. Les bancs ne poussent que vers un sujet qui existe. Deux voisines
vertes : **C10** (une base nommée par `--base`, absente en local, passée telle quelle à la CLI) et **C11** (le geste d'une base
absente nomme toujours `develop` : « git fetch origin develop » pour `--base origin/sujet/x`).

**La retouche** (partie 2, le banc seul, sans test neuf : les comptes du ticket ne
bougent pas) : dans « la base : … », un push vers `sujet/neuf` absent rend la plus proche (`origin/sujet/x`), sortie 0 ; dans
« une base introuvable : … », `--base origin/sujet/x` absent sort en 2 avec « git fetch origin sujet/x », la CLI non lancée.
**Rouge avant, vert après** : C9, C10, C11 vertes sur `42c5149`, rouges la retouche posée ; le banc 8 sur 8.

### 3. À corriger — la note 8.1.0 ne dit pas ce que la repose de `preuves.mjs` repose avec

**Où.** `NOTES-DE-VERSION.md`, ligne 16 : « **Reposer** (skill `socle-tests`, pièce par pièce) : `scripts/verify/preuves.mjs`
et son banc, … ».

**Le scénario qui casse** (`essais/anchorpost.txt`, essais 9 et 10). Le relais importe `BASE_DEFAUT`, `baseDepuisPush`,
`choisirBase` et `decisionSansBase` de `coverage-diff-regles.mjs` (posés le 2026-11-10) ; son banc charge
`scripts/docs/environnement-de-banc.mjs` (socle 7.21.0, le 2026-11-18), et sinon un repli qui n'existe que dans le plugin.
Anchorpost `develop` a les exports, **pas** l'environnement de banc. Reposés comme la note le dit, `preuves.mjs` et
`preuves.test.mjs` dans `scripts/verify/` : `node --test scripts/verify/preuves.test.mjs`, ce que joue `check:tickets`
(`package.json` d'Anchorpost, ligne 27), sort sur `ERR_MODULE_NOT_FOUND`, 1 échec ; donc `pnpm run check`, le pre-push et la
CI sont rouges. Avec `scripts/docs/environnement-de-banc.mjs` posé : 8 sur 8. Et dans un projet posé avant le 2026-11-10, le
relais lui-même ne se charge pas : `SyntaxError … does not provide an export named 'BASE_DEFAUT'`, sortie 1, **sans index
Anchorpost aussi** (`essais/relais-et-ancien-coverage-diff-regles.txt`), donc à chaque pre-push et à chaque fin de tour qui
change un fichier : le contraire du « Rien, tant que son index Anchorpost n'est pas au pivot 3 » de la note. La note dit aussi « Le gabarit d'ADR du score de mutation le dit (point
5) », mais « Reposer » ne dit pas que l'ADR du projet s'amende (son point 5 dit l'ancien workflow une fois celui-ci reposé), ni,
pour le dépôt de la CLI, que le relais s'adapte (décision 7, dite par `SKILL.md`).

**La retouche** (partie 3) : la ligne « Reposer » nomme les deux appuis
et ce qui casse sans eux, l'adaptation dans le dépôt de la CLI, et le point 5 de l'ADR du projet ; une phrase exigée dans le
banc de texte (« le relais preuves dit qu'il sort en 2 … »). **Rouge avant, vert après** : le banc seul sur `42c5149`, 1 échec
sur 3 ; la retouche entière, 3 sur 3 (`essais/retouche-rouges-verts.txt`, pour le patch entier) ; `depot.test.mjs` vert. **Attention au § 3 du ticket 86** : `version-mineure.mjs` reconstruit la note depuis l'annexe
`pr-socle-tests.patch`, pas depuis la branche : la fusion de `main` remettrait l'ancienne note. **Décision `A-205`** : l'annexe ne se
régénère pas, la note se repose depuis la branche. Joué (`essais/ordres-d-entree-a205.sh`, `.txt`), sur la branche retouchée,
après 152, après 155 et après 152, 153 et 155 : la note prise de la branche, le banc de texte 3 sur 3 ; prise de l'annexe, il
rougit (« le relais preuves dit qu'il sort en 2 … »), dans les trois cas.

### 4. À corriger — la fiche des tests dit « prouvée » autrement que la CLI et que `RULE_ALL_ANC-28`

**Où.** `skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md`, ligne 43 : « Une règle est « prouvée » quand
chacun de ses cas l'est, « partielle » quand elle a une preuve et qu'un cas manque, ou qu'elle n'en déclare aucun. Une règle
moyenne ou haute répond aux dix familles de cas limites (un cas, un « sans objet » motivé, ou une question ouverte) ».

**L'écart.** La CLI 2.0.x (`apps/cli/src/build/realisation.ts`, `realisationOf` et `missingOf`, `SPEC_ALL_ANC-5.28`) ne dit
« prouvée » qu'avec un cas `nominal` déclaré, chaque cas prouvé **et**, moyenne ou haute, une réponse à chacune des dix
familles. Joué (`essais/anchorpost.txt`, essai 11) : `RULE_ALL_ANC-19`, haute, ses cinq cas prouvés, la famille `limits` retirée
de `notApplicableFamilies` : `partial`, `missing: { families: ["limits"] }`. La fiche la dirait prouvée. Et `RULE_ALL_ANC-28` :
« Tant qu'une question reste ouverte, la règle reste « partielle » » ; la fiche range la question parmi les réponses sans le
dire. C'est le texte qu'une session lit pour savoir quoi écrire (décision 8 : la fiche « porte la grille de la spec ») : la
grille est juste, la phrase qui la suit ne l'est pas.

**La retouche** (partie 5) : « Une règle est « prouvée » quand elle déclare un
cas normal, que chacun de ses cas est prouvé et, moyenne ou haute, que chacune des dix familles de cas limites a sa réponse ;
« partielle » quand elle a une preuve sans l'être (un cas sans preuve, aucun cas déclaré, pas de cas normal, une famille sans
réponse). Une règle moyenne ou haute répond aux dix familles (un cas, un « sans objet » motivé, ou une question ouverte, qui la
laisse partielle) » ; deux phrases exigées dans « la fiche des tests porte la grille … ». **Rouge avant, vert après** : le banc
seul sur `42c5149`, 1 échec sur 3 ; la retouche entière, 3 sur 3 (`essais/retouche-rouges-verts.txt`, pour le patch entier) ;
C23 (le texte d'avant remis) rouge.

### 5. Mineur — les décisions 6 et 8 du ticket 86 n'ont pas de banc

Vertes sur `42c5149` : **C5** (la grille sans « Projet suivi par Anchorpost, index au pivot 3 » : un projet sans pivot 3 s'y
croirait tenu, le point (2) de cette relecture), **C6** (la ligne `pnpm run check:preuves --base-auto` du pre-push retirée de
`SKILL.md`), **C7** (l'entrée dans `gatesRapides` retirée), **C8** (l'étape de CI retirée). Retouche proposée
(partie 4, quatre phrases exigées ; retenue par `A-205`) : C5 à C8 rouges.

### 6. Mineur — au pre-push, `compare` juge l'arbre de travail

`compareRoot` construit l'index de la tête depuis l'arbre (`buildIndex(root)`), et `changedFiles` ajoute le non commis et le non
suivi (`apps/cli/src/repo/git.ts`, lignes 96 à 108). Joué (essais 7 et 8) : en `enforce`, un commit qui ajoute un cas sans
preuve, la preuve dans un fichier non suivi : le pre-push (`--base-auto`, `PRE_PUSH_REFS` du commit) sort en 0 ; le même commit
sur un arbre propre, ce que juge la CI, sort en 1. Plus lâche au pre-push, la CI rattrape ; l'inverse (un travail en cours qui
bloque le push d'un commit propre) aussi. `coverage-diff` a la même nature (il joue Vitest sur l'arbre). **Recommandation** : le
dire en une ligne dans l'en-tête de `preuves.mjs` et à l'étape 2.3 de `SKILL.md` (« l'arbre de travail, pas le commit poussé :
la CI juge le commit ») ; question 2 ci-dessous. **Décision `A-205`** : le dire ; fait dans l'en-tête et dans `SKILL.md` (partie
6 du patch), la phrase de `SKILL.md` exigée (C19).

### 7. Mineur — un argument sans `--` n'est pas un usage faux

`preuves.mjs`, lignes 92 à 95 : `inconnues` ne lit que ce qui commence par `--`. `node scripts/verify/preuves.mjs HEAD~3` compare
à `origin/develop` et sort en 0 (`essais/argument-positionnel.txt`) ; le résumé dit bien la base, mais la décision 5 du ticket
86 range « un usage faux » en 2. Une ligne : refuser tout argument qui n'est ni `--base`, ni sa valeur, ni `--base-auto`.
**Décision `A-205`** : refusé (partie 6) : `inconnues` ne garde plus le seul préfixe `--` ; `HEAD~3` et
`--base-auto origin/develop` sortent en 2 avec l'usage, dans la boucle d'usage du banc existant (C18 rouge). Les appels du socle
(sans option, `--base-auto`, `--base "origin/$BASE"`) ne changent pas.

### 8. Mineur — « comme `coverage-diff --base-auto` », sauf le sujet mis à jour

`coverage-diff.mjs`, `baseAuto` (ligne 146) : une branche de mise à jour d'un sujet se mesure contre ce sujet « même à égalité
de distance avec develop » (`fusionRecalculee`). `preuves.mjs` prend la plus proche (décision 3, voulue) : quand le sujet a plus
de commits que develop n'en apporte, c'est `origin/develop`, et la comparaison juge tout le travail du sujet. Plus large, jamais
plus lâche, comme le dit l'en-tête ; mais sa « Limite » (ligne 24) ne nomme que le cas inverse (« elle peut juger des règles
que develop a touchées »). Une demi-phrase. **Décision `A-205`** : par le texte ; les « Limites » de l'en-tête et `SKILL.md` disent les
deux cas (partie 6, C21).

## Ce qui tient (vérifié)

- **Ticket 86.** Décision 1 : le relais rend 0, 1 et 2 de la CLI réelle (essais 2 à 8), le mode jugé est celui du rapport. Décision
  2 : sans index et au schéma `"2"`, « rien à comparer », la CLI pas lancée (bancs ; essai sur Anchorpost au dernier index au schéma
  2, `3a6d656~1`, `essais/schema-2-et-3.txt`). Décision 3 : la base nommée, le sujet poussé, la plus proche, develop à égalité, par
  les fonctions de `coverage-diff-regles.mjs` sans copie (leurs exports identiques à ceux d'Anchorpost). Décision 4 : une ligne,
  puis une par écart (« refus » en `enforce`) et la commande du rapport ; sous `GITHUB_STEP_SUMMARY`, le markdown entier (38
  lignes sur Anchorpost). Décision 5 : CLI absente, en panne, rapport illisible, usage faux en 2 (hors le constat 7). Décision 7 :
  dans Anchorpost tel quel, sortie 2 « CLI introuvable » (essai 1), comme `SKILL.md` le dit. Décision 8 : la grille est celle du
  § 2 de la spec, ligne pour ligne. Le hook de fin de tour réel d'Anchorpost, `gatesRapides` réduit au relais, en `enforce` avec un
  cas sans preuve : « Gates rouges », sortie 2, le résumé dedans (essai 6).
- **Ticket 87.** Au schéma 2, le périmètre de `--list` est celui de `main` (l'index de `develop` réécrit au schéma `"2"` : 8
  fichiers des deux côtés, identiques) ; au pivot 3, 53 fichiers (`proven` et `partial`) là où `main` n'en mute aucun ; `3` en
  nombre refusé ; la criticité portée, `null` à classer ; « non mesurée » seulement sans mutant atteint, jamais « 0 % ».
- **Ticket 88.** La mesure JSON écrite par `--mesure`, rien sans synthèse ; la date, « (jour UTC du passage) » seulement sans
  `--date` ; un jour hors calendrier refusé ; la baisse d'une moyenne seule, strictement, mesurée deux fois ; rien de refusé.
  `mutation.yml` : `contents: read` et `actions: read`, rien d'autre ; le jeton par `env:` de la seule étape qui l'emploie ; aucune
  expression `${{ }}` dans un `run:` ; `zizmor` 1.32.0 hors ligne, `pedantic` et `auditor` : aucun constat, avant comme après
  (`essais/zizmor.txt`). Le filtre `--jq` et son `env.BRANCHE` contre l'API réelle : l'identifiant du dernier passage de la branche,
  vide pour une autre ; l'API liste du plus récent au plus ancien (`essais/gh-api.txt`).
- **La note** : vraie hors le constat 3. **Le titre** : 104 caractères, 111 avec « (#154) ».
- **Le § 3** (`essais/ordres-d-entree.txt`, le geste tel qu'écrit sur un `main` simulé) : après 152 seule, 152 puis 153 (8.0.2),
  155 seule, 152 puis 155, 152, 153 puis 155 : seuls `NOTES-DE-VERSION.md` et `.claude-plugin/plugin.json` en conflit
  (`plugin.json` pas quand `main` est déjà à 8.1.0, comme le ticket le dit), la version prise 8.1.0 ou 8.2.0, la note en tête,
  aucun marqueur restant, le diff propre inchangé (`16 files changed, 831 insertions(+), 53 deletions(-)`), le test d'ascendance
  vert. Aucun autre fichier commun avec 152, 153 et 155.

## Questions à l'architecte

1. **Les retouches et l'annexe du § 3.** `version-mineure.mjs` reconstruit la note depuis `pr-socle-tests.patch`. Si la retouche 3
   (ou toute retouche de la note) entre, régénérer l'annexe et sa somme dans les tickets 86 à 88, comme au tour 1 ?
   **Recommandation : oui**, l'annexe régénérée depuis la branche retouchée ; le banc de la retouche 3 rougit sinon.
   **Décision `A-205`** : non ; la note se repose depuis la branche, pour toutes les PR (constat 3).
2. **Le pre-push et l'arbre de travail** (constat 6). Le dire seulement, ou faire juger au pre-push le commit poussé (un arbre
   jetable du commit, `compare` y joué : le double du coût) ? **Recommandation : le dire**, la CI juge le commit ; changer le relais
   serait une décision neuve, hors de ces tickets. **Décision `A-205`** : le dire (constat 6).
3. **Le coût en fin de tour** (question 1 du ticket 86). Mesuré ici : 13 à 17 s par passage sur Anchorpost, charge 14 à 18 (8 s à
   charge 4 au ticket), sous le `timeout` de 120 s du hook `Stop` du socle, partagé avec les autres gates rapides.
   **Recommandation : celle du ticket** (dans `gatesRapides`), en notant ce chiffre dans `SKILL.md` à la place de « quelques
   secondes ». **Décision `A-205`** : gardé dans `gatesRapides`, le chiffre écrit (partie 6, C20).

## La retouche du tour 1

`retouches/retouche-154-tour-1.patch`, sur `42c5149`, sha256 `6c441645bac6c21d16c038b467fe80590f20f07a0a4c87db93a0df95dce7887b` (`retouches/SHA256SUMS`) ; `git apply`
pose six fichiers (`49 insertions(+), 10 deletions(-)`), aucun neuf. Elle remplace les cinq patchs de la première remise. Ses
parties :

| Partie | Constat | Fichiers |
| --- | --- | --- |
| 1 | 1 (le banc du workflow) | `scripts/preuve-suffisante-socle-tests.test.mjs` |
| 2 | 2 (le premier push d'un sujet neuf, la base nommée absente) | `skills/monorepo/socle-tests/references/scripts/verify/preuves.test.mjs` |
| 3 | 3 (la note) | `NOTES-DE-VERSION.md`, le banc de texte |
| 4 | 5 (la condition de la grille, la pose du gate) | le banc de texte |
| 5 | 4 (« prouvée » dans la fiche) | `skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md`, le banc de texte |
| 6 | 6, 7, 8 et question 3 (`A-205`) | `skills/monorepo/socle-tests/references/scripts/verify/preuves.mjs` (l'usage, les « Limites »), `SKILL.md` (l'arbre de travail, les deux bases, le coût mesuré), `preuves.test.mjs` (deux cas d'usage), le banc de texte |

**Rouge avant, vert après** (`essais/retouche-rouges-verts.txt`), les cinq bancs de la PR :

- ses seuls fichiers de bancs posés sur `42c5149` (`git apply --include='*.test.mjs'`) : **125 tests, 122 verts, 3 rouges** —
  « la fiche des tests porte la grille … » (la phrase de « prouvée »), « le relais preuves dit qu'il sort en 2 … » (la note,
  l'arbre de travail, les deux bases, le coût), « un index illisible, une CLI absente … un usage faux » (`HEAD~3` accepté) ;
- le patch entier : **125 sur 125** ; `scripts/depot.test.mjs` : **69 sur 69**.

Les parties 1, 2 et 4 renforcent des bancs sur un code juste : leur rouge est celui des mutations qu'ils tiennent désormais.
**Mutations** : `mutations/contre.mjs` (34 : les 11 W et F de l'annexe rejouées contre le seul banc de texte, et 23 ajoutées,
C1 à C23), sur `42c5149` : 13 rouges (les W1 à W8 et F1 à F3 de l'annexe contre le
seul banc de texte, C13, C15), 15 vertes (C1 à C12, C14, C16, C17), 6 sans objet (C18 à C23 : leurs textes n'existent pas avant
la retouche) (`mutations/contre-sur-42c5149.txt`) ; la retouche posée : **30 rouges**, 4 vertes sans conséquence (C12, C14, C16,
C17) (`mutations/contre-sur-retouche.txt`). L'annexe (`86-88-annexes/mutations.mjs`), la retouche posée : **35 rouges sur 35**,
`toutes rouges`, sortie 0, l'arbre remis (`mutations/annexe-sur-retouche.txt`).

**Le compte attendu de la suite** : aucun test ajouté (les cas neufs vont dans des tests existants), donc **1 422** sur `main` à
`ddb4265` (1 396 + 26), et, sur un `main` qui a bougé, le compte de la table du ticket 86 inchangé (par exemple 1 446 après 152,
153 et 155 : 1 396 + 9 + 6 + 9 + 26). Le § 1 du ticket (103 tests, 24 rouges sur le patch d'origine) et le § 2 (125) ne bougent
pas non plus.

## Ce qui a été joué

- **Bancs** (§ 1 et § 2 du ticket 86) : avant le patch, **103 tests, 79 verts, 24 rouges** ; à `42c5149`, **125 sur 125**
  (`essais/bancs-rouges-verts.txt`). La retouche : ci-dessus.
- **Mutations de l'annexe** sur `42c5149` : **35 rouges sur 35**, `toutes rouges`, arbre propre (`mutations/annexe-sur-42c5149.txt`) ;
  la retouche posée : 35 sur 35 (`mutations/annexe-sur-retouche.txt`). Les W1 à W8 et F1 à F3 rejouées contre le seul banc de
  texte, sans `depot.test.mjs` : 11 rouges (`mutations/contre-sur-42c5149.txt`).
- **Mutations ajoutées** (`mutations/contre.mjs`, C1 à C23) : voir « La retouche du tour 1 ». Les quatre qui restent vertes, sans
  conséquence : C12 (le tampon de 256 Mio, le rapport d'Anchorpost fait 6,7 ko), C14 (la CLI lancée du dossier courant : chaque
  appelant lance depuis la racine), C16 (une règle sans clé dans la mesure précédente), C17 (l'arrondi du score, non spécifié).
- **Anchorpost** (`essais/anchorpost.sh`, `essais/anchorpost.txt`, onze essais) : le relais tel quel, puis contre la CLI 2.0.1 ; la
  fin de tour, une PR de trois commits, le résumé du job, un écart en `enforce`, le vrai hook de fin de tour, le pre-push sur un
  arbre sale, le banc reposé, la réalisation d'une règle à famille sans réponse. L'arbre jetable remis après.
- **Schémas 2 et 3** (`essais/schema-2-et-3.txt`) : `mutation-regles.mjs --list` de `main` et de la PR sur deux index réels.
- **`zizmor`** 1.32.0, **`gh api`** en lecture (`essais/zizmor.txt`, `essais/gh-api.txt`).
- **Le § 3**, cinq ordres d'entrée, sur `42c5149` (`essais/ordres-d-entree.sh`, `.txt`) ; puis, sur la branche retouchée, trois
  ordres, la note reposée depuis la branche (`A-205`) ou depuis l'annexe (`essais/ordres-d-entree-a205.sh`, `.txt`).
- **La suite entière**, une fois, sur l'arbre des quatre PR (152, 153, 155 entrées dans un `main` simulé, puis le § 3 de celle-ci,
  plugin 8.2.0) : voir ci-dessous.

**La suite entière, non finie.** `pnpm test`, une fois, sur l'arbre des quatre PR (compte attendu : 1 396 + 9 + 6 + 9 + 26 =
**1 446**), 15:54:41 → 16:34:41 UTC, charge 8,8 au départ, 19,8 à la fin : arrêtée par la borne de 40 minutes que cette
relecture lui avait posée (la session l'a jouée en 12 minutes à charge 1). Rendus avant l'arrêt : 738 tests, 737 verts, 1 rouge,
« les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » (`scripts/poses.test.mjs`) : sa tranche
`une-sous-pr-a-la-fois.test.mjs` (du skill `fusionner`, qu'aucune des quatre PR ne touche) tuée à sa borne de 600 s
(`essais/suite-combinee.txt`). Rejouée seule sur le même arbre, cette tranche passe, **19 sur 19**, en 22 min 29 s, charge 19
à 25 (`essais/tranche-seule.txt`) : une borne de 600 s dépassée sous la charge, pas un écart. En remplacement de la suite, sur le même arbre, **les seize fichiers de bancs que les quatre PR
touchent**, d'un seul tenant : **454 sur 454**, 0 échec, 7 min 48 s, charge 20,8 → 21,0 (`essais/cible-combinee.txt`). Sur
l'arbre de la première remise des retouches, `depot.test.mjs`, `points-d-entree` et le banc de texte : 144 sur 144 ; sur celui de
`retouche-154-tour-1.patch`, `depot.test.mjs` : 69 sur 69. Pas de suite entière sur la retouche : la session la jouera (`A-205`).

## Ce qui n'a pas été établi

1. **Le workflow sous GitHub Actions** : jamais tourné ici non plus ; `gh run download` est refusé par le mandataire réseau de la
   session (l'hôte de stockage des artefacts), donc ni le téléchargement ni la forme du dossier (`-n <nom> -D <dossier>` qui pose
   le fichier à la racine du dossier) n'ont été vus.
2. **Une vraie passe de Stryker au pivot 3** (ticket 87) : non jouée.
3. **Le relais dans un vrai pre-push** (le hook husky d'Anchorpost, `pnpm run check:preuves --base-auto`) : joué par `node` avec
   `PRE_PUSH_REFS` posé, pas par `git push` (Anchorpost n'a pas été installé).
4. **L'étape de CI de `preuves.mjs`** sous Actions (checkout de la fusion d'essai de GitHub ou du sommet) : non jouée.
5. **Les ordres d'entrée** : `main` simulé localement (squash, notes posées comme le feraient les PR), pas les fusions réelles.
6. **La suite entière** sur l'arbre des quatre PR : arrêtée à 738 tests sur 1 446 (ci-dessus) ; le compte de 1 446 n'est donc pas
   vu, seulement les bancs touchés (454) et la suite de la PR seule que la session rapporte (1 422).
