# Un seul environnement de banc : sans `GIT_*` ni `FORCE_COLOR`, avec `NO_COLOR=1`, importé par chaque banc au lieu de onze filtres recopiés

Status: ready-for-agent
Type: défaut
Modèle: sonnet — une fonction pure de dix lignes, puis onze remplacements mécaniques dans des bancs, chacun avec son chemin d'import posé ou plugin ; le seul piège est l'import d'un banc posé sans la chaîne, tranché ci-dessous.
Blocked by: 1 (`skills/chaine/sujet/scripts/depot-jouet.mjs` est un fichier chaud du ticket 1 : partir de main après sa fusion)
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/sujet/scripts/depot-jouet.mjs`, `skills/chaine/sujet/scripts/environnement-des-bancs.test.mjs`, `skills/monorepo/socle-monorepo/references/scripts/docs/environnement-de-banc.mjs`, `skills/monorepo/socle-monorepo/references/scripts/docs/environnement-de-banc.test.mjs`, `skills/monorepo/socle-monorepo/references/scripts/docs/next-id.test.mjs`, `skills/monorepo/socle-monorepo/references/TABLE-RACINE.md`, `skills/chaine/tickets/references/scripts/docs/depot-jouet.mjs`, `skills/chaine/tickets/references/scripts/docs/avancement.test.mjs`, `skills/chaine/fusionner/scripts/commits-a-relire.test.mjs`, `skills/chaine/fusionner/scripts/revue-exigee.test.mjs`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, `skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs`, `skills/monorepo/socle-tests/references/scripts/verify/coverage-diff.test.mjs`, `scripts/nettoyage-des-bancs.test.mjs`, `scripts/points-d-entree.test.mjs`, `scripts/poses.test.mjs`, `scripts/un-seul-environnement-de-banc.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../remontees-iroki.spec.md`](../remontees-iroki.spec.md), ticket 13 (point C13, décision `A-25` ; `A-34` pour la note). Source : [`../sources/2026-11-18-remontees-iroki.md`](../sources/2026-11-18-remontees-iroki.md), point 13. Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`A-17`, `A-18`). Base : `origin/main` à `4a45634` (plugin **7.15.0**, **738 tests** ; `environnement-des-bancs.test.mjs` 1 test, `next-id.test.mjs` 7). Faits relus à la source le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Le défaut vécu chez Iroki.** Sous un terminal, `node --test` pose `FORCE_COLOR=1` dans chaque fichier de test. Un enfant qu'un banc lance en hérite, et sa sortie, lue par le banc, porte des séquences ANSI : `console.log(4)` rend `\x1b[33m4\x1b[39m`. Un banc vert en CI rougit alors sur le poste d'un développeur. Iroki l'a corrigé dans une seule fonction (`environnementGitIsole`, #616).

**Dans le plugin**, aucun banc ne retire `FORCE_COLOR`. Et le filtre des variables `GIT_*` est recopié à onze endroits, chacun un peu différent : certains retirent aussi `NODE_TEST_CONTEXT`, `PRE_PUSH_REFS` ou `GARDER_JOUETS`, d'autres non. Une copie de plus finirait par diverger.

**Quand le ticket est fait :**

1. Une seule fonction, `environnementDeBanc(base = process.env)`, rend une copie de `base` sans `GIT_*`, sans `FORCE_COLOR`, sans `NODE_TEST_CONTEXT`, sans les variables de la chaîne (`PASSER_*`, `BOUCLE_*`, `PRE_PUSH_*`, `REVUE_*`), et avec `NO_COLOR=1`.
2. `skills/chaine/sujet/scripts/depot-jouet.mjs` l'exporte et s'en sert. Chaque banc qui recopiait son filtre l'importe.
3. Un banc du plugin refuse toute nouvelle copie du filtre.
4. Le plugin prend une version, et `NOTES-DE-VERSION.md` dit ce qu'un projet repose.

## Où

Lignes relues sur `4a45634`. **Les copies du filtre**, une par ligne (le relevé `grep -rn "startsWith(['\"]GIT_" --include=*.mjs skills scripts` en rend onze, plus `depot-jouet.mjs` lui-même) :

| # | Fichier : lignes | Posé dans un projet | Import après le ticket |
| --- | --- | --- | --- |
| 0 | `skills/chaine/sujet/scripts/depot-jouet.mjs:63-80` (`PREFIXES_CHAINE`, `ENV_GIT`) | `scripts/chaine/` | La source : importe la fonction (voir Décision 2) et la réexporte ; `ENV_GIT` devient `{ ...environnementDeBanc(), GIT_CONFIG_GLOBAL, GIT_CONFIG_NOSYSTEM, identité }`. |
| 1 | `skills/chaine/fusionner/scripts/commits-a-relire.test.mjs:15-23` et `:209` | `scripts/chaine/` | Par `depot-jouet.mjs`, avec le repli des autres bancs de `fusionner` (`existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs"`, modèle `revue-exigee.test.mjs:10`). |
| 2 | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs:251-259` | `scripts/chaine/` | `jouet.environnementDeBanc()` (le module est déjà importé l. 10). |
| 3 | `skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs:19-20` (`sansGit`) | `scripts/chaine/` | Par `depot-jouet.mjs`, avec le même repli (l. 7-11 importe déjà `dossierTemporaire` ainsi). |
| 4 | `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs:18-26` | jamais (`scripts/poses.test.mjs:23-24`) | `../../../../sujet/scripts/depot-jouet.mjs`. |
| 5 | `skills/chaine/tickets/references/scripts/docs/depot-jouet.mjs:66-74` (`ENV`) | `scripts/docs/` | Le module du socle, voir Décision 2 ; ajouté à `DU_SOCLE` (l. 41) pour la copie des scripts dans le plugin. |
| 6 | `skills/chaine/tickets/references/scripts/docs/avancement.test.mjs:85-93` | `scripts/docs/` | `ENV` de `./depot-jouet.mjs` (l. 7 en importe déjà `module` et `script`). |
| 7 | `skills/monorepo/socle-monorepo/references/scripts/docs/next-id.test.mjs:9-20` | `scripts/docs/` | `./environnement-de-banc.mjs`, même dossier dans le plugin et dans un projet. Le commentaire l. 9-11 (« le socle pose ce banc sans la chaîne ») reste vrai. |
| 8 | `skills/monorepo/socle-tests/references/scripts/verify/coverage-diff.test.mjs:16` | `scripts/verify/` | `../docs/environnement-de-banc.mjs` dans un projet, `../../../../socle-monorepo/references/scripts/docs/environnement-de-banc.mjs` dans le plugin. `PRE_PUSH_REFS` est déjà dans la fonction. |
| 9 | `scripts/nettoyage-des-bancs.test.mjs:17-25` (`envEnfant`) | jamais | `{ ...environnementDeBanc(), GARDER_JOUETS: undefined, TMPDIR, ...plus }` : `GARDER_JOUETS` est propre à ce banc, la fonction ne le connaît pas. |
| 10 | `scripts/points-d-entree.test.mjs:14` (`SANS_GIT`) | jamais | `../skills/chaine/sujet/scripts/depot-jouet.mjs`. |
| 11 | `scripts/poses.test.mjs:42-47` (`env`) | jamais | idem. |

**Les autres fichiers :**

| Fichier | Lignes | Ce qu'on y fait |
| --- | --- | --- |
| `skills/monorepo/socle-monorepo/references/scripts/docs/environnement-de-banc.mjs` (nouveau) | — | La fonction, et le pourquoi en tête : les hooks git (`GIT_DIR`, `GIT_INDEX_FILE`), le capitaine (`PASSER_OUTILS`, `BOUCLE_*`, `PRE_PUSH_REFS`, `REVUE_DIR`, voir `depot-jouet.mjs:63-68`), `node --test` sous un terminal (`FORCE_COLOR`) et `NODE_TEST_CONTEXT` (un `node --test` enfant rendrait ses résultats au parent). Aucun effet à l'import, aucune dépendance. |
| idem, `environnement-de-banc.test.mjs` (nouveau) | — | Ses tests unitaires (voir « Ordre de travail »). Posé avec lui (`TABLE-RACINE.md:14` : « tests `*.test.mjs` compris »). |
| `skills/monorepo/socle-monorepo/references/TABLE-RACINE.md` | 14 | Nommer `environnement-de-banc.mjs` parmi les scripts de `scripts/docs/` : « l'environnement des bancs, que tous les bancs des skills importent ». |
| `skills/chaine/sujet/scripts/environnement-des-bancs.test.mjs` | fin | Les bancs de la couleur (voir « Ordre de travail »). |
| `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` | 108-117 | `env: { ...d.env, FORCE_COLOR: "1", NO_COLOR: undefined }` : le test garde l'environnement réel du capitaine, `FORCE_COLOR=1` sans `NO_COLOR` (Node ignore `NO_COLOR` sous `FORCE_COLOR`, avec un avertissement sur la sortie d'erreur). |
| `skills/chaine/fusionner/scripts/fusionner.test.mjs` | 288-300 | Idem. |
| `skills/monorepo/socle-monorepo/references/scripts/docs/next-id.test.mjs` | 117-125 | Idem (`NO_COLOR: undefined`). |
| `scripts/un-seul-environnement-de-banc.test.mjs` (nouveau) | — | Le garde contre une nouvelle copie (voir « Ordre de travail »). Un fichier à lui évite `scripts/depot.test.mjs`, que les tickets 1, 15 et 19 touchent aussi. |
| Version | — | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md` (voir « La version et la note »). |

**Référence, à réécrire et jamais à copier** : Iroki, `SPEC_ALL_SOC-4.72`, PR #616 (`12b20c6d`) : `scripts/chaine/git-isole.mjs:1-19` (`environnementGitIsole`) et ses tests `scripts/chaine/git-isole.test.mjs` (« retire FORCE_COLOR et pose NO_COLOR=1 », « un enfant de banc ne rend aucune séquence ANSI quand le processus porte FORCE_COLOR=1 »). Iroki garde `GIT_AUTHOR_*`, `GIT_COMMITTER_*`, `GIT_TERMINAL_PROMPT` et `GIT_CONFIG_NOSYSTEM` ; le plugin retire tout `GIT_*`, comme ses onze copies le font aujourd'hui, et le banc qui en a besoin repose son identité.

Règles à lire : `depot-jouet.mjs:1-111` (sujet) et `scripts/nettoyage-des-bancs.test.mjs:1-36`.

## Décisions

Tenue (spec) : `A-25` — un seul environnement de banc, exporté par `suj/depot-jouet.mjs`, qui retire `GIT_*` et `FORCE_COLOR` et pose `NO_COLOR=1` ; les bancs qui recopient leur filtre l'importent.

Précisions du ticket :

1. **Ce que la fonction retire.** `GIT_*`, `FORCE_COLOR`, `NODE_TEST_CONTEXT`, et les préfixes de la chaîne de `depot-jouet.mjs:69` (`PASSER_`, `BOUCLE_`, `PRE_PUSH_`, `REVUE_`). Elle pose `NO_COLOR=1`, quelle que soit sa valeur héritée. Elle ne modifie pas `base`. C'est l'union des copies actuelles : aucun banc ne perd un retrait qu'il faisait. Retirer `NODE_TEST_CONTEXT` partout est sans risque : aucun banc ne veut qu'un enfant rende ses résultats au runner parent.
2. **Où vit la définition.** Dans `skills/monorepo/socle-monorepo/references/scripts/docs/environnement-de-banc.mjs`, posé dans `scripts/docs/` de chaque projet, et **réexportée** par `depot-jouet.mjs` du sujet (`export { environnementDeBanc }`) : les bancs de la chaîne l'importent de `depot-jouet.mjs`, comme `A-25` le dit. Deux raisons empêchent de la définir dans `depot-jouet.mjs` :
   - trois bancs sont posés sans la chaîne : `next-id.test.mjs` (`socle-monorepo`, l. 9-11 le dit), `coverage-diff.test.mjs` (`socle-tests`, « La chaîne de production n'est pas requise », `SKILL.md:17`) et le dépôt jouet de `tickets` (`check:tickets` tourne « sans ce socle », `tickets/SKILL.md:51`) ; `scripts/chaine/depot-jouet.mjs` n'existe pas chez eux ;
   - `depot-jouet.mjs` lève une erreur à l'import quand `jq` manque (l. 22-23) : un banc de `socle-tests` ne doit pas exiger `jq`.

   `scripts/docs/` du socle, lui, est posé partout, avant tout autre skill (`TABLE-RACINE.md:14`). `depot-jouet.mjs` le trouve comme il trouve déjà la grammaire (`GRAMMAIRE`, l. 90-92) : `../docs/environnement-de-banc.mjs` dans un projet, `SKILLS/../monorepo/socle-monorepo/references/scripts/docs/environnement-de-banc.mjs` dans le plugin, par un `import()` de premier niveau. Introuvable : une erreur qui dit `environnement-de-banc.mjs introuvable : reposer scripts/docs/ du socle (socle-monorepo)`.
3. **Ce qui reste propre à un banc ne se met pas dans la fonction** : `GARDER_JOUETS` (n° 9), l'identité git et `GIT_CONFIG_GLOBAL` (n° 0, 2, 4, 5), le `GIT_DIR` leurre de `commits-a-relire.test.mjs:209` (n° 1). Un banc les ajoute après l'appel.
4. **`commits-a-relire.test.mjs` modifie `process.env`** (l. 20-22), parce que le module qu'il teste lance git dans le processus du banc. Il garde ce geste, sans recopier le filtre : il retire de `process.env` chaque clé absente de `environnementDeBanc()`, sauf `NODE_TEST_CONTEXT` (le runner de ce fichier en a besoin), puis y pose `NO_COLOR` et ses deux `GIT_CONFIG_*`.
5. **Le garde contre une copie.** Un test de `scripts/un-seul-environnement-de-banc.test.mjs` lit chaque `*.test.mjs` et chaque `depot-jouet.mjs` de `scripts/` et de `skills/`, et refuse toute ligne qui filtre `GIT_` (`startsWith('GIT_')` ou `startsWith("GIT_")`), hors `environnement-de-banc.mjs`. Il nomme les fichiers fautifs.
6. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : la forme de l'`import()` de repli, le nom des constantes locales. Elle ne tranche **pas** : la liste des retraits, l'emplacement de la définition, le garde.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`. Chaque test est vu rouge avant le code qui le rend vert. Commits sous les hooks, jamais `--no-verify`.

### 1. Les bancs, vus rouges sur `main`

`skills/monorepo/socle-monorepo/references/scripts/docs/environnement-de-banc.test.mjs` :

- « environnementDeBanc : retire GIT_*, FORCE_COLOR, NODE_TEST_CONTEXT et les variables de la chaîne, pose NO_COLOR=1, garde le reste et ne modifie pas sa base » — avec `GIT_DIR`, `GIT_AUTHOR_NAME`, `FORCE_COLOR: "1"`, `NO_COLOR: ""`, `NODE_TEST_CONTEXT`, `PASSER_OUTILS`, `PRE_PUSH_REFS`, `PATH`, `MON_GIT_X` ; `MON_GIT_X` et `PATH` restent.

`skills/chaine/sujet/scripts/environnement-des-bancs.test.mjs`, par le même procédé que son test actuel (scénario dans un `node` enfant, car `depot-jouet.mjs` lit `process.env` à son chargement) :

- « sous FORCE_COLOR=1 hérité (node --test sous un terminal), l'environnement du dépôt jouet n'a pas FORCE_COLOR et porte NO_COLOR=1 » — **rouge sur `main`**.
- « un enfant d'un banc ne rend aucune séquence ANSI quand le banc hérite de FORCE_COLOR=1 » — `node -e "console.log(4)"` sous `d.env` rend exactement `4\n` — rouge sur `main`.

`scripts/un-seul-environnement-de-banc.test.mjs` (joué par le glob `scripts/*.test.mjs`) :

- « un seul environnement de banc : aucun banc ne recopie le filtre des variables GIT_* » — **rouge sur `main`** : il nomme les onze copies du tableau.

### 2. Le code

La fonction et son test ; `depot-jouet.mjs` (sujet) ; puis les copies n° 1 à 11, dans l'ordre du tableau, chacune suivie de son fichier de test joué seul. Puis `TABLE-RACINE.md:14` et les trois tests à `FORCE_COLOR` (`NO_COLOR: undefined`).

### 3. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici, un fichier nouveau posé par `socle-monorepo` : une mineure. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier. Si le fichier n'existe pas encore sur `main` (le ticket 1 le crée), le créer avec l'en-tête que le ticket 1 donne, recopié tel quel. La note :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  Un seul environnement de banc, `scripts/docs/environnement-de-banc.mjs` (socle-monorepo), réexporté par `scripts/chaine/depot-jouet.mjs` : sans `GIT_*`, `FORCE_COLOR`, `NODE_TEST_CONTEXT` ni variables du capitaine, avec `NO_COLOR=1`. Les bancs des skills l'importent : ils ne prennent plus la couleur de `node --test` sous un terminal.

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
  2. Dans une PR du projet, **d'abord** recopier `environnement-de-banc.mjs` et `environnement-de-banc.test.mjs` depuis `~/.claude/plugins/marketplaces/maj/skills/monorepo/socle-monorepo/references/scripts/docs/` vers `scripts/docs/`, avec `next-id.test.mjs` du même dossier : sans eux, les bancs reposés ensuite ne se chargent pas.
  3. Puis reposer : `/maj-skills:tickets poser` (son `depot-jouet.mjs` et `avancement.test.mjs`), `/maj-skills:revue-adversariale poser`, `/maj-skills:fusionner poser`, `/maj-skills:sujet poser`. Et recopier `coverage-diff.test.mjs` de socle-tests (`references/scripts/verify/`) vers `scripts/verify/` s'il est posé.
  4. `node --test scripts/docs/*.test.mjs scripts/verify/*.test.mjs scripts/chaine/*.test.mjs` : vert.

  **Iroki** : son `environnementGitIsole` (`scripts/chaine/git-isole.mjs`, #616) reste à lui, avec ses importeurs. Les bancs reposés depuis le plugin prennent `environnement-de-banc.mjs` ; les deux coexistent. Différence à connaître : le sien garde `GIT_AUTHOR_*` et `GIT_COMMITTER_*`, celui du plugin les retire. Retirer `git-isole.mjs` au profit du module du plugin est un choix de son conducteur, hors de cette version.
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| La fonction : retraits, `NO_COLOR`, base intacte | `skills/monorepo/socle-monorepo/references/scripts/docs/environnement-de-banc.test.mjs` « environnementDeBanc : retire GIT_*, FORCE_COLOR, NODE_TEST_CONTEXT et les variables de la chaîne, pose NO_COLOR=1, garde le reste et ne modifie pas sa base » |
| Le dépôt jouet sous `FORCE_COLOR=1` hérité | `skills/chaine/sujet/scripts/environnement-des-bancs.test.mjs` « sous FORCE_COLOR=1 hérité (node --test sous un terminal), l'environnement du dépôt jouet n'a pas FORCE_COLOR et porte NO_COLOR=1 », « un enfant d'un banc ne rend aucune séquence ANSI quand le banc hérite de FORCE_COLOR=1 » |
| Aucune copie du filtre | `scripts/un-seul-environnement-de-banc.test.mjs` « un seul environnement de banc : aucun banc ne recopie le filtre des variables GIT_* » |
| Les bancs posés trouvent la fonction hors du plugin | `scripts/poses.test.mjs` (rejoue `scripts/chaine/` et `scripts/docs/` posés à plat, `socle-monorepo` compris, `POSES` l. 14-22) |
| Les dossiers temporaires restent retirés | `scripts/nettoyage-des-bancs.test.mjs` (inchangé, joué tel quel) |

## Vérification

1. Ciblée, chaque fichier touché joué seul : `node --test <fichier>` pour les douze fichiers du tableau et la fonction ; puis `node --test scripts/un-seul-environnement-de-banc.test.mjs scripts/poses.test.mjs scripts/nettoyage-des-bancs.test.mjs`.
2. `pnpm test` complet : le nombre de `main` au départ (**738** sur `4a45634`), plus les quatre tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli.
3. **Sous un terminal**, une fois : `script -qc "pnpm test" /dev/null` (un pseudo-terminal, donc `FORCE_COLOR=1` posé par `node --test`) : vert, et la sortie le dit dans la PR. C'est le cas vécu.
4. **Mutations**, chacune jouée sur une copie jetable, vue rouge, puis annulée, listées dans la PR : la fonction ne retire plus `FORCE_COLOR` (les deux tests de couleur) ; un filtre `startsWith('GIT_')` recopié dans un banc (le garde).
5. `graphify update .`
6. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR.
7. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `fix(chaine): un seul environnement de banc, sans couleur héritée (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- Les scripts eux-mêmes (`next-id.mjs`, `passer.sh`, …) : déjà sans couleur dans leurs sorties lues (`next-id.test.mjs:117`, `fusionner.test.mjs:288`, `sujet-fusionner.test.mjs:108`).
- Les bancs qui passent `process.env` tel quel à un enfant sans filtre : ils ne recopient rien ; les convertir n'est pas demandé.
- `git-isole.mjs` d'Iroki et ses importeurs.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, sources relues sur `4a45634` et sur `develop` d'Iroki. Écarts avec la spec :
  - La spec compte **neuf** bancs qui recopient leur filtre ; le relevé en trouve **onze**, dans dix fichiers (tableau, n° 1 à 11), plus `depot-jouet.mjs` lui-même.
  - `A-25` fait exporter la fonction par `suj/depot-jouet.mjs`. Trois des copies sont posées dans des projets sans la chaîne, et `depot-jouet.mjs` exige `jq` à l'import : la définition va donc dans `scripts/docs/` du socle, et `depot-jouet.mjs` la réexporte (Décision 2). La lettre d'`A-25` tient pour les bancs de la chaîne. À confirmer à la contre-relecture ; si l'architecte préfère la lettre, ces trois bancs gardent une copie, et le garde les nomme en exception.
  - `A-25` ne nomme que `GIT_*` et `FORCE_COLOR`. La fonction retire aussi ce que les copies retiraient déjà (`NODE_TEST_CONTEXT`, les variables du capitaine, Décision 1), sans quoi des bancs perdraient un retrait.
  - **Ordonnancement** : la spec donne ce ticket sans blocage, mais `skills/chaine/sujet/scripts/depot-jouet.mjs` est aussi un fichier chaud du ticket 1 (sa liste `CHAINE`, l. 95-111). Les deux touchent des lignes distinctes (l. 63-80 ici), mais deux tickets d'une même vague ne partagent pas un fichier chaud. Même cas pour `fusionner.test.mjs` et `sujet-fusionner.test.mjs` (ici, un seul `NO_COLOR: undefined` aux l. 292 et 112). À ordonner par l'architecte : après le ticket 1, ou en parallèle avec un merge d'`origin/main` à la livraison.
