# Les sorties lues par une machine ne prennent plus les couleurs du poste, et `jq` absent se dit en une ligne

Status: Fait — PR #82
Type: défaut
Modèle: sonnet — chaque ligne à changer est donnée ci-dessous ; rien n'est à concevoir.
Blocked by: —
Fichiers chauds: `skills/monorepo/socle-monorepo/references/scripts/docs/next-id.mjs`, `skills/monorepo/socle-monorepo/references/scripts/docs/next-id.test.mjs`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/fusionner/scripts/github.test.mjs`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/sujet/scripts/depot-jouet.mjs`, `skills/chaine/socle-chaine-de-production/references/fragments/readme-prerequis.md` (créé), `skills/chaine/socle-chaine-de-production/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `README.md`, `.claude-plugin/plugin.json`
Label: contre-revue
Dépendances: —

## Le besoin

Le 2026-11-14, le produit a poussé une branche d'`anchorpost` depuis son poste (Ubuntu, zsh). Le contrôle d'avant push (`pnpm run check`, étape `check:tickets`) a rendu **84 tests rouges sur 310**, sans rapport avec sa modification, alors que tout est vert en CI et dans les sessions cloud. Deux causes, toutes deux dans des scripts que ce plugin pose dans les projets :

1. **`jq` absent du poste** (75 rouges). Les scripts de la chaîne appellent le binaire `jq` ; sans lui, chaque appel sort en 127 avec `jq: command not found`, noyé dans 75 traces. Rien ne dit « installe jq ». Le produit l'a trouvé seul (`sudo apt install jq`).
2. **`FORCE_COLOR` défini dans l'environnement** (9 rouges chez lui, davantage une fois `jq` installé, voir plus bas). `console.log` d'un **nombre** est coloré par Node dès que `FORCE_COLOR` est défini, **même vers un tube** : `node -e 'console.log(4)'` écrit `\x1B[33m4\x1B[39m` au lieu de `4`. Une chaîne n'est jamais colorée (`console.log("4")`, `` console.log(`${4}`) ``, `console.log("%d", 4)` et `process.stdout.write(...)` écrivent `4`) ; un nombre, un booléen, un objet ou un tableau l'est, seul ou en argument après une chaîne.

Ce n'est pas un défaut de banc : **les scripts eux-mêmes** rendent une valeur inutilisable à tout appelant qui a `FORCE_COLOR`. Le plus grave est chez le capitaine : `passer.sh` et `sujet.sh fusionner` comptent les caractères du titre par `node -e 'console.log(…length)'`, puis `[ "$longueur" -le 120 ]` échoue (`integer expression expected`) et le script sort en **4, « sujet du squash à \x1B[33m22\x1B[39m caractères (> 120) »** : avec `FORCE_COLOR` dans l'environnement du capitaine, **toute PR est renvoyée pour titre trop long**.

Quand ce ticket est fait :

- aucune sortie lue par une machine ne passe par `console.log` d'une valeur qui n'est pas une chaîne ; les bancs passent avec `FORCE_COLOR=1` comme sans ;
- `jq` absent arrête tout script de la chaîne **dès son entrée**, sur une ligne qui dit quoi installer, avec une sortie qui lui est propre ;
- sans `jq`, les bancs de la chaîne rendent un seul échec par fichier, sur cette même phrase, au lieu de 75 traces ;
- `jq` est écrit dans les prérequis que le socle pose dans le `README.md` d'un projet, et dans le `README.md` de ce dépôt pour qui joue les bancs.

## Où

Relevé le 2026-11-14 sur `origin/main` à `c9a6055` (plugin 7.2.0). Les fichiers de ce ticket n'ont pas changé depuis `7eca328` (7.1.0), où les mesures ci-dessous ont été jouées (arbre extrait par `git archive`, Node 22.23). **La session relève chaque `fichier:ligne` sur sa base** ; si `main` a bougé, elle retrouve chaque ligne par son texte et l'écrit sous `## Comments` de sa PR.

### 1. Les sorties machine non chaînes — inventaire complet

`git grep -n 'console\.log(' origin/main -- skills scripts`, puis lecture de chaque appel dont l'argument n'est pas un littéral de chaîne. **Trois endroits, quatre lignes**, et rien d'autre :

| Ligne | Aujourd'hui | Qui la lit | Devient |
| --- | --- | --- | --- |
| `skills/monorepo/socle-monorepo/references/scripts/docs/next-id.mjs:53` | `console.log(max + 1);` | `skills/chaine/tickets/references/scripts/docs/migrer-tickets.mjs:82` (`Number(execFileSync(…next-id.mjs…).trim())`, puis « Numéro invalide » et sortie 2, l. 83-86) ; le banc `next-id.test.mjs:49` (`r.stdout.trim()`) ; toute session qui écrit `$(node scripts/docs/next-id.mjs …)` (`socle-chaine-de-production/SKILL.md`, étape 8) | `` process.stdout.write(`${max + 1}\n`); `` |
| `skills/chaine/fusionner/scripts/passer.sh:79` | `longueur=$(node -e 'console.log([...process.argv[1]].length)' "$titre (#$N)")` | `passer.sh:80`, `[ "$longueur" -le 120 ] \|\| sortir 4 …` | `longueur=$(node -e 'console.log(String([...process.argv[1]].length))' "$titre (#$N)")` |
| `skills/chaine/fusionner/scripts/passer.sh:290` | même forme, sur `"$sujet"` | `passer.sh:291`, même test | même correction |
| `skills/chaine/sujet/scripts/sujet.sh:477` | même forme, sur `"$titre (#$n)"` | `sujet.sh:478`, même test | même correction |

Les autres `console.log` de `skills/` et de `scripts/` ont été lus un par un et ne rendent que des chaînes : gabarits littéraux, `JSON.stringify(…)` (`tickets/references/scripts/docs/avancement.mjs:203`, `vagues.mjs:152`, `socle-tests/references/scripts/verify/mutation-regles.test.mjs:232,249`), `message(refus)` qui rend une chaîne (`fusionner/scripts/migrations-ordre.mjs:97`), un chemin (`revue-adversariale/scripts/diff-revue.sh:20`, `socle-tests/references/scripts/verify/mutation-regles.mjs:173`), `out.join(…)` (`revue-de-ticket/scripts/contexte-ticket.mjs:276`). **Ne pas les toucher** : une chaîne n'est jamais colorée. `node -p` (qui colore aussi) n'est employé nulle part.

Mesure, `FORCE_COLOR=1` et `jq` présent, sur `7eca328` : **35 rouges** — `fusionner.test.mjs` 19, `sujet-fusionner.test.mjs` 6, `migrations-ordre.test.mjs` 1, `sujet.test.mjs` 1 (ces quatre-là par le compte du titre), `migrer-tickets.test.mjs` 4, `next-id.test.mjs` 4. Sans la variable : 0. **Avec les quatre lignes ci-dessus corrigées et `FORCE_COLOR=1` : 0 rouge** (seul `scripts/depot.test.mjs` échoue, parce que l'arbre extrait n'est pas un dépôt git ; il échoue de même sans la variable). Aucun banc ne compare donc une sortie humaine colorée : aucun n'a besoin de `FORCE_COLOR=0`.

### 2. `jq` — qui l'appelle, et par où tout passe

Binaire `jq` appelé par : `github.sh:34, 51, 53, 55, 100, 111, 128, 141` ; `file.sh:51, 52, 76, 89` ; `passer.sh:64, 246, 262, 308` ; `sujet.sh:468-516` et `621-622` ; le faux `gh` des bancs, `sujet/scripts/faux-gh.mjs:279`. Les `gh api … --jq` (`renvoyer.sh:34`, `boucle.sh:219`, et la plupart de ceux de `sujet.sh`) passent par le jq **embarqué dans `gh`** et ne demandent pas le binaire.

Tout script de la chaîne qui appelle `jq` **source `github.sh` avant** : `file.sh:43`, `passer.sh:56`, `renvoyer.sh:14`, `boucle.sh:206` (dans `rafraichir_outils`, au premier tour), `sujet.sh:81`, et le banc `github.test.mjs:22`. La garde va donc dans `github.sh`, **juste après `DEPOT=…` (ligne 10)**, avant toute autre ligne :

```bash
command -v jq >/dev/null || { echo "ARRÊT : jq est requis par les scripts de la chaîne : sudo apt install jq (ou brew install jq)" >&2; exit 69; }
```

Codes de sortie déjà employés par les scripts de la chaîne, à ne pas détourner : `0` à `10` (`passer.sh` 2-7, `sujet.sh` 2-9, `boucle.sh` 6, 9, 10, `file.sh --next` 1), `64` (`boucle.sh:94`, `veille.sh:34`, usage), `130` et `143` (signaux), `127` (celui du shell pour une commande introuvable, qu'on veut justement remplacer). **`69` n'est employé nulle part** (`git grep -n -E '(exit|sortir|return) 69' origin/main` ne rend rien) ; c'est `EX_UNAVAILABLE` de `sysexits.h` (« un programme de support n'existe pas »), de la même famille que le `64` (`EX_USAGE`) déjà en usage. `boucle.sh` source `github.sh` au premier appel de `rafraichir_outils` (`boucle.sh:206`), avant de passer aucune PR : il s'arrête donc lui-même en 69 ; un `passer.sh` lancé seul sort en 69, que la boucle traiterait par son `*)` (« ARRÊT sur #n (sortie 69) », `boucle.sh:368`). `veille.sh` lit `PIPESTATUS[0]` de la boucle et s'arrête avec son code en le disant : une boucle sortie en 69 arrête la veille sur « la boucle est sortie en 69 », et le message de la garde reste visible, puisqu'il est sur la sortie d'erreur.

Les en-têtes qui listent les sorties gagnent une ligne : `passer.sh`, bloc « Sorties » (lignes 28 à 45) : `#   69 jq absent du poste → l'installer (sudo apt install jq), relancer` ; `sujet.sh`, ligne « Sorties : » (65 à 72) : `· 69 jq absent du poste`.

### 3. Les bancs sans `jq` — un seul échec par fichier

`skills/chaine/sujet/scripts/depot-jouet.mjs` est le dépôt jouet des sept bancs qui lancent les scripts de la chaîne (`boucle-outils`, `fusionner`, `github`, `migrations-ordre`, `sujet-fusionner` dans `fusionner/scripts/` ; `sujet-carte`, `sujet` dans `sujet/scripts/`). Il garde le `PATH` de l'hôte derrière son dossier de faux outils (ligne 92), donc le `jq` du poste. Ajouter, juste après les imports (lignes 6 à 17) :

```js
// Les scripts de la chaîne et le faux gh appellent jq : sans lui, chaque test échouerait sur
// « jq: command not found », noyé dans ses traces. Un seul message, une fois par fichier de test.
if (spawnSync('jq', ['--version']).error)
  throw new Error('jq est requis par les scripts de la chaîne et leurs bancs : sudo apt install jq (ou brew install jq)');
```

Essayé le 2026-11-14 : `node --test` sur deux fichiers qui l'importent, sans `jq` dans le `PATH`, rend `not ok 1 - <fichier>` et `Error: jq est requis …` une fois par fichier, et rien d'autre ; avec `jq`, rien ne change. Aucun test n'est sauté : le fichier échoue, rouge. (`skills/chaine/tickets/references/scripts/docs/depot-jouet.mjs`, l'autre dépôt jouet, réduit le `PATH` à `git` et `node` et ne lance aucun script qui appelle `jq` : il ne change pas.)

### 4. Les tests nouveaux, vus rouges d'abord

Chacun se joue **avant** la correction, et se voit rouge pour la bonne raison (la couleur dans la sortie, ou le `command not found`), puis vert après.

- `skills/monorepo/socle-monorepo/references/scripts/docs/next-id.test.mjs`, après le test « l'ancien usage et un type inconnu sont refusés, sortie 2 » (ligne 108) : **« le numéro sort nu, sans couleur, même avec FORCE_COLOR=1 »**. Dépôt `depotJouet({ fichiers: FICHIERS })`, `spawnSync(process.execPath, [SCRIPT, 'RULE', 'ALL', 'LIC'], { cwd: d.travail, env: { ...ENV, PATH: d.bin, PROJET_RACINE: d.travail, FORCE_COLOR: '1' }, encoding: 'utf8' })`, puis `assert.equal(r.stdout, '4\n')` — **sans `.trim()`** : c'est la sortie exacte qu'on prouve. Rouge avant : `'\x1B[33m4\x1B[39m\n'`.
- `skills/chaine/fusionner/scripts/fusionner.test.mjs`, après « passer.sh : un check rouge non exigé ne retient pas la fusion » (ligne 276, modèle à imiter) : **« passer.sh : FORCE_COLOR=1 dans l'environnement du capitaine ne fait refuser aucun titre »**. Même dépôt (`checksRouges(["qualite"])`), mais lancé par `spawnSync("bash", [script("passer.sh"), "32"], { cwd: d.travail, env: { ...d.env, FORCE_COLOR: "1" }, encoding: "utf8" })` (`d.lancer` ne prend pas d'environnement ; `d.env` est rendu par `depotJouet`) ; attendus : sortie 0, et les mêmes écritures que le modèle. Rouge avant : sortie 4, « sujet du squash à \x1B[33m…\x1B[39m caractères ». Le fichier n'importe pas `spawnSync` : ajouter `import { spawnSync } from "node:child_process";` à ses imports (lignes 4 à 8), sans quoi le test est rouge par `ReferenceError`, pas pour la bonne raison.
- `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, après « fusionner : sans conflit, squash comme avant » (ligne 96, modèle) : **« fusionner : FORCE_COLOR=1 dans l'environnement ne fait refuser aucun titre »**, `sousPrEnConflit("aucun")`, `sujet.sh fusionner 80` lancé par `spawnSync` avec `{ ...d.env, FORCE_COLOR: "1" }` ; attendus : sortie 0, `PUT pulls/80/merge` dans les écritures. Ajouter `import { spawnSync } from "node:child_process";` à ses imports (lignes 4 à 6), absent aujourd'hui.
- `skills/chaine/fusionner/scripts/github.test.mjs`, en fin de fichier : **« jq absent : github.sh s'arrête dès qu'on le source, sortie 69, une ligne qui dit quoi installer »**. `bash` par son chemin absolu (`spawnSync("sh", ["-c", "command -v bash"], { encoding: "utf8" }).stdout.trim()`, comme `boucle-outils.test.mjs:183` le fait pour `git`), lancé sur `-c` et la commande `source <GITHUB>; echo suite`, avec `env: { ...d.env, PATH: <dossier vide créé dans d.racine> }` ; attendus : `status` 69, `stdout` vide (le `echo suite` n'est pas joué), `stderr` d'une seule ligne qui contient `jq est requis` et `sudo apt install jq`. Rouge avant : sortie 0 et `suite`. `spawnSync` y est déjà importé ; ajouter `mkdirSync` à l'import de `node:fs` (ligne 7) et `import { join } from "node:path";`, pour créer le dossier vide.

Tests après : **le compte de `pnpm test` sur `origin/main` au départ de la session, plus 4**.

### 5. Les prérequis écrits

- **Créer `skills/chaine/socle-chaine-de-production/references/fragments/readme-prerequis.md`**, une ligne de tableau, au format du fragment de `socle-nest-hexagonal` (`skills/backend/socle-nest-hexagonal/references/fragments/readme-prerequis.md`, une ligne), exactement :

  ```markdown
  | **jq**     | —                      | scripts de la chaîne (`scripts/chaine/*.sh`) et leurs bancs (`pnpm check:tickets`) : `sudo apt install jq` ou `brew install jq` |
  ```

- `skills/chaine/socle-chaine-de-production/SKILL.md`, tableau des fragments (lignes 44 à 49) : une ligne de plus, à la fin du tableau, qui nomme le fragment `references/fragments/readme-prerequis.md`, le fichier `README.md` et la zone `<!-- socle:prerequis -->`. Le marqueur est posé par `socle-monorepo` (`references/racine/README.md:96`) sous son tableau des prérequis.
- `skills/chaine/socle-chaine-de-production/references/CONTENU.md:41` : « …les commandes et l'arborescence dans `README.md` » devient « …les commandes, l'arborescence et le prérequis `jq` dans `README.md` ».
- `README.md` de ce dépôt : il ne dit nulle part ce que demandent les bancs (`pnpm test`). Ajouter, juste après le bloc de code de `## Structure` (avant `## Ajouter un skill`, ligne 174), un paragraphe d'une phrase : « Les bancs (`pnpm test`, joués aussi par la CI) demandent Node ≥ 22, `git` et `jq` (`sudo apt install jq` ou `brew install jq`) ; sans `jq`, chaque banc de la chaîne échoue sur une ligne qui le dit. »

Les `SKILL.md` de `fusionner` (ligne 14) et de `sujet` (ligne 13) disent déjà « Dépendances : `git`, `jq`, … » : rien à y changer.

### 6. La version — `.claude-plugin/plugin.json`

Ligne 3 : **la mineure qui suit la version de `origin/main` au moment où la session ouvre sa PR** (`git show origin/main:.claude-plugin/plugin.json`). Règle du `README.md`, « Ajouter un skill », étape 4 : « mineure pour un skill ou un gabarit ajouté » — le fragment `readme-prerequis.md` en est un, et ce que le socle pose dans un projet change.

## Décisions

- **C'est le script qui avait tort, pas le banc.** Aucun banc ne reçoit `FORCE_COLOR=0` ni ne retire la variable de son environnement : mesuré, les quatre lignes corrigées suffisent à tout faire passer avec `FORCE_COLOR=1`, et un banc qui neutraliserait la variable cacherait le défaut au lieu de le prouver. Les bancs gardent `FORCE_COLOR` hérité, comme aujourd'hui (`ENV` de `next-id.test.mjs:12-20` et `ENV_GIT` de `depot-jouet.mjs:31-38` ne retirent que les `GIT_*`).
- **`process.stdout.write` pour `next-id.mjs`, `console.log(String(…))` dans les `node -e` des scripts shell** : les deux rendent une chaîne ; `String(…)` garde la ligne courte et lisible entre apostrophes shell. Ne pas écrire de `printf` ni de `wc -m` à la place : `[...s].length` compte les caractères Unicode comme `commitlint`, ce que `wc -m` ne garantit pas selon la locale.
- **La garde de `jq` vit dans `github.sh`**, seul passage commun : un seul message, une seule sortie, aucun script de la chaîne oublié. `exit` et non `return` : `github.sh` n'est sourcé que par des scripts, et un `return` sous `set -e` dépendrait de la façon dont l'appelant le source.
- **Sortie 69** (`EX_UNAVAILABLE`) : voir `## Où`, § 2. La garde de `flock` de `boucle.sh:93` sort en 6, code qui veut dire « arbre pas propre » pour `passer.sh` et `sujet.sh` ; ce ticket n'y touche pas (`## Hors périmètre`).
- **Côté bancs, la garde est à l'import du dépôt jouet**, pas un test de tête : `node --test` joue les fichiers indépendamment, un test de tête n'empêcherait pas les 75 traces des autres fichiers. L'échec à l'import rend un seul échec par fichier, sur la phrase qui dit quoi installer, sans sauter de test.
- **Version mineure** : le fragment de prérequis est un gabarit ajouté (`## Où`, § 6).
- Intangibles : **jamais `--no-verify`**, aucun test retiré, sauté ni assoupli (aucune assertion existante ne change), aucune dépendance nouvelle.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche de documentation du programme sans le modifier, et écrit à l'architecte dès sa PR livrée (ouverte, hors brouillon), sans attendre ni les contrôles ni la fusion.

## Surfaces

| Surface | Preuve |
| --- | --- |
| le numéro de `next-id` sort nu | `skills/monorepo/socle-monorepo/references/scripts/docs/next-id.test.mjs` « le numéro sort nu, sans couleur, même avec FORCE_COLOR=1 » |
| le capitaine compte les titres sans couleur | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : FORCE_COLOR=1 dans l'environnement du capitaine ne fait refuser aucun titre » ; `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` « fusionner : FORCE_COLOR=1 dans l'environnement ne fait refuser aucun titre » |
| plus aucune sortie machine colorable | `git grep -n -E "console\.log\(\[\.\.\.process\|console\.log\(max" -- skills` ne rend rien (la barre est échappée pour le tableau : elle se tape sans la barre oblique inverse) |
| tout le plugin passe avec `FORCE_COLOR=1` | `FORCE_COLOR=1 pnpm test` vert, même nombre de tests que `pnpm test` |
| `jq` absent : une ligne, sortie 69 | `skills/chaine/fusionner/scripts/github.test.mjs` « jq absent : github.sh s'arrête dès qu'on le source, sortie 69, une ligne qui dit quoi installer » |
| le prérequis est écrit | `grep -n jq skills/chaine/socle-chaine-de-production/references/fragments/readme-prerequis.md README.md` rend une ligne chacun ; `grep -n readme-prerequis skills/chaine/socle-chaine-de-production/SKILL.md` rend la ligne du tableau |

## Vérification

1. Les quatre tests nouveaux d'abord, seuls, sur le code de `main` : rouges, pour la raison dite au § 4. Puis les corrections, puis verts.
2. `pnpm test` : le compte de `origin/main` au départ de la session, plus 4, tous verts ; aucun test désactivé.
3. `FORCE_COLOR=1 pnpm test` : le même nombre, tous verts.
4. Deux essais à la main : `FORCE_COLOR=1 node skills/monorepo/socle-monorepo/references/scripts/docs/next-id.mjs SPEC ALL SOC 2>/dev/null | od -c | head -1` ne montre aucun `033` ; sans `jq`, `PATH=<dossier vide> "$(command -v node)" --test skills/chaine/fusionner/scripts/github.test.mjs` rend un seul échec et la phrase `jq est requis par les scripts de la chaîne et leurs bancs`.
5. Ce dépôt n'a pas de gate des tickets : ce ticket n'est contrôlé que par sa relecture et ses surfaces.

## Hors périmètre

- **Les copies posées dans les projets** : `anchorpost` reçoit la même correction par son ticket `SPEC_ALL_SOC-1.21`, sans attendre ce plugin ; les autres projets à leur prochaine repose.
- **Les autres prérequis non écrits**, relevés pour l'architecte et non traités ici : `bash` ≥ 4 (`mapfile`, `sujet.sh:885,892`) — le bash 3.2 de macOS ne suffit pas ; `git` ≥ 2.38 (`git merge-tree --write-tree`, `passer.sh:104`) ; `flock` (util-linux, `boucle.sh:93`, absent de macOS) ; `gh` authentifié pour le capitaine (déjà dit par `fusionner/SKILL.md:14`). Les écrire, et aligner la garde de `flock` (sortie 6) sur la sortie 69, est un autre ticket.
- **Le message de `migrer-tickets.mjs:85`**, « Numéro invalide : `${args[iN + 1]}` » : quand le numéro vient de `next-id.mjs` (`iN` vaut -1), il affiche `args[0]`, le nom de la feature (« Numéro invalide : socle » chez le produit), au lieu de la valeur lue. Une fois `next-id.mjs` corrigé, ce chemin ne s'atteint plus que par un défaut de `next-id.mjs` ; le corriger demanderait un test qui le provoque. Laissé à un autre ticket.
- **Le skill `architecte`** (ticket 6), **les plafonds** (ticket 7), **le plugin sans chemins écrits en dur** (ticket 17, PR 79, fusionnée) : non touchés.

## Comments

- 2026-11-14 — Écrit par un rédacteur (sous-agent) depuis `main` à `c9a6055` (plugin 7.2.0). Mesures jouées sur `7eca328` (7.1.0), sans écart pour les fichiers du ticket : 35 rouges avec `FORCE_COLOR=1`, 0 avec les quatre lignes corrigées ; garde de `jq` essayée en shell (sortie 69, une ligne) et à l'import d'un module de banc (un `not ok` par fichier). Le défaut a été reproduit d'abord dans `anchorpost` (`develop` à `5ace2dd`) : 9 rouges dans `scripts/docs`, 23 de plus dans `scripts/chaine` une fois `jq` présent, 75 sans `jq`. Non vérifié : le comportement sous zsh et macOS (seul Ubuntu a été vu chez le produit) ; le `pnpm test` complet sur `c9a6055` (seul `7eca328` a été joué).
- 2026-11-14 — Relu par un agent neuf : « prêt après corrections mineures » (faits, inventaire et remède rejoués : 0 rouge sous `FORCE_COLOR=1` après les quatre lignes, un seul échec par fichier sans `jq`). Reportés : `Type: défaut`, `Label: contre-revue`, preuves en chemins complets, commandes à la main sous `## Vérification`, imports manquants des tests prescrits, version mineure, compteurs relatifs à `origin/main`, appel de `github.sh` par `rafraichir_outils`, arrêt de la veille sur une boucle sortie en 69.
