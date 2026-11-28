# Le Relecteur sur un poste sans `gh` s'arrête en 6 avec sa cause, jamais une pause sans fin

Status: ready-for-agent
Type: défaut
Modèle: sonnet — une lecture de `gh` en tête de `preparer`, sur le modèle de celle de `flock` (`relecteur.mjs:564`), une ligne de l'en-tête, une cellule du skill, et leurs bancs sur le modèle du banc sans `jq` ; la règle est `A-203` (3), la sortie 6 sur le modèle d'`A-197` (1). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/relecteur/scripts/relecteur.mjs` (en-tête, les sorties, 97-101 ; `preparer` 166-168) ; `skills/chaine/relecteur/scripts/relecteur.test.mjs` (le banc sans `jq`, 827-862 ; un test neuf après lui, après 862) ; `skills/chaine/relecteur/SKILL.md` (« Les sorties », la ligne 6, 59) ; `scripts/bascule.test.mjs` (un test neuf, après 325) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Seul dans sa PR.** `scripts/relecteur.test.mjs:240` exige un morceau de la ligne 6 du skill : la phrase neuve le garde tel quel. La PR de 119 à 121 touche `scripts/bascule.test.mjs` (deux tests neufs) et les fichiers de version ; la PR du ticket 123, les fichiers de version : la seconde à entrer se remet sur `main`. Lignes lues sur `origin/main` à `b5c7ac3` (plugin 8.9.5).

## Le besoin

Une suite laissée par la contre-relecture de la PR 153 (carte, 2026-11-22, 15 h 30 UTC : « Suites ajoutées : `gh` absent du poste du Relecteur »), décidée par `A-203` (3) : « **`gh` absent du poste du Relecteur** (même pause sans fin, hors `A-192`) : à la liste des suites (`preparer` vérifie `gh` et sort en 6) », et renvoyée à plus tard par `A-249`.

Sans `gh`, chaque lecture de GitHub du Relecteur échoue. `lire()` la dit « GitHub illisible », sortie 5. La veille lit une sortie 5 de `passe` comme une panne passagère et se met en pause, puis rejoue, sans fin : aucune ligne ne part à l'architecte, et aucune PR n'est relue. C'est le défaut que `A-203` (1) a fermé pour `jq` ; `gh` y échappe parce que `github.sh` ne le teste pas à son chargement.

Le besoin : **un poste sans `gh` fait sortir le Relecteur en 6**, la cause dite (« `gh` absent »), comme `flock` ou `jq` absents ; la session le dit à l'architecte et s'arrête.

## La cause, à la source

Lignes lues sur `origin/main` à `b5c7ac3` (plugin 8.9.5).

1. `skills/chaine/relecteur/scripts/relecteur.mjs:166-168` (`preparer`) : vérifie les outils de `scripts/chaine/` (`OUTILS`, `:114`), puis le dossier propre (`:169-170`) ; rien sur `gh`. `passe` (`:397-399`), `jouer` (`:405-409`) et `distribuer` (`:447-461`) jouent `preparer` avant toute lecture.
2. `relecteur.mjs:156-164` (`lire`) : `lire_github` de `github.sh`, sourcé ; `sansOutil('github.sh', r)` (`:161`) n'arrête en 6 que sur une sortie 69 ; toute autre sortie non nulle est `arreter(5, …)` (`:162`). Sans `gh`, `lire_github` échoue sur « gh: command not found », sortie 127 puis non nulle : sortie 5.
3. `skills/chaine/fusionner/scripts/github.sh:12` : le chargement ne teste que `jq` (`command -v jq … exit 69`). `gh` n'y est pas testé.
4. `relecteur.mjs:564` (`sousVerrou`) : `if (spawnSync('flock', ['-V']).error) arreter(6, 'flock (util-linux) est requis');` : le modèle d'un outil absent du poste, lu avant tout.
5. `relecteur.mjs:97-101` (l'en-tête, la sortie 6) et `skills/chaine/relecteur/SKILL.md:59` (« Les sorties », la ligne 6) nomment `flock` et les outils d'un calcul (git, `jq`, la grammaire), pas `gh`.

## Décisions

Décidées par l'architecte : **`A-203` (3)** (`gh` absent : `preparer` le vérifie et sort en 6, hors `A-192`), la sortie 6 sur le modèle d'**`A-197` (1)** (un outil de la chaîne qui manque au poste : l'architecte, et s'arrêter ; jamais une lecture illisible). Ce qui suit les applique ; rien n'y est à trancher.

1. **`preparer`**, en tête, avant `OUTILS` : `if (spawnSync('gh', ['--version']).error) arreter(6, "gh (GitHub CLI) est requis par le Relecteur : l'installer sur le poste");`. Le test porte sur la présence seule (`error`, donc `ENOENT`), comme pour `flock` : un `gh` présent qui répond mal reste une lecture, jugée par `lire`.
2. **L'en-tête** (`:97-101`) : la sortie 6 compte « `gh` absent du poste », à côté de « `flock` manque ».
3. **Le skill** (`SKILL.md:59`) : la ligne 6 dit « `gh` ou `flock` manque » à la place de « ou `flock` manque », sa suite inchangée (« l'architecte, et s'arrêter »). Le morceau qu'exige `scripts/relecteur.test.mjs:240` ne change pas.
4. **La version** : la suivante de `main` au moment de livrer, au troisième chiffre. La note dit que le Relecteur s'arrête en 6 sans `gh`. `relecteur.mjs` se lance depuis le dossier du skill (`README.md:173`), jamais posé : un projet n'a rien à reposer, la mise à jour du plugin suffit.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/relecteur/scripts/relecteur.mjs:166-168` | la lecture de `gh` (décision 1) |
| `skills/chaine/relecteur/scripts/relecteur.mjs:97-101` | l'en-tête (décision 2) |
| `skills/chaine/relecteur/SKILL.md:59` | la ligne 6 (décision 3) |
| `skills/chaine/relecteur/scripts/relecteur.test.mjs`, après 862 | un test neuf (« Surfaces ») |
| `scripts/bascule.test.mjs`, après 325 | un test neuf de texte (« Surfaces ») |
| `scripts/relecteur.test.mjs:240` | **inchangé** |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version, la note |

Modèle : `relecteur.test.mjs:827-862`, le banc sans `jq`. Le PATH sans `gh` se construit de même, avec deux différences : le faux `gh` du jouet vit dans `<racine>/bin` (`depot-jouet.mjs:116-124`), que le PATH du banc sans `jq` met en tête ; et le poste du banc peut porter un vrai `gh` (`/usr/bin/gh`). Le dossier du banc reçoit donc en liens les entrées de `<racine>/bin`, puis celles des dossiers du PATH, `node` en lien direct, toutes sauf `gh` ; le banc vérifie `command -v gh` en échec sous ce PATH.

## À faire, dans l'ordre

1. **Partir de `main`** : une branche neuve depuis `origin/main` ; relire chaque ligne citée.
2. **Les bancs, rouges** (« Surfaces »).
3. **`preparer`**, puis **l'en-tête** et **le skill**. Les bancs verts.
4. Un commit ; **la version** et sa note.
5. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| un PATH sans `gh` : `passe` sort en 6, `relecteur : gh (GitHub CLI) est requis par le Relecteur` sur la sortie d'erreur ; `jouer 12` et `distribuer 12 --sommet <sommet> --couple opus/medium session_rel1` (appel bien formé) en 6 ; la veille (`--pause 0 --sondes 2`) finit sur `VEILLE ARRÊTÉE sortie 6` puis `SOURDINES aucune`, aucune ligne `PAUSE` ; rien d'écrit au faux GitHub | `relecteur.test.mjs`, test neuf |
| `relecteur/SKILL.md` « Les sorties », la ligne 6 : « `gh` ou `flock` manque », « l'architecte, et s'arrêter » ; l'en-tête de `relecteur.mjs` nomme `gh` à la sortie 6 | `scripts/bascule.test.mjs`, test neuf |
| le banc sans `jq` et les autres bancs du Relecteur : inchangés | `relecteur.test.mjs`, vert |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| la lecture de `gh` retirée de `preparer` | le test neuf (sortie 5, la veille en `PAUSE`) |
| `arreter(5, …)` à la place de `arreter(6, …)` | le test neuf |
| « `gh` ou » retiré de `SKILL.md:59` | le test neuf de `scripts/bascule.test.mjs` |

## Vérification

1. Les bancs ciblés : `env -u NODE_PATH node --test skills/chaine/relecteur/scripts/relecteur.test.mjs scripts/relecteur.test.mjs scripts/bascule.test.mjs`, rouges à l'étape 2, verts après.
2. Les mutations : toutes rouges.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass` plus `# skipped`. Le relevé part du compte de `main` au départ, plus les deux tests neufs ; il est recopié dans la PR. La session lit le job `bancs` de sa PR avant de rendre la main (`A-212`).

## Hors périmètre

- `gh` absent chez le capitaine : `boucle.sh` et `passer.sh` lisent GitHub par `gh` à chaque tour, et la file illisible y est une `PAUSE` aussi ; la décision `A-203` (3) ne vise que le Relecteur. À la liste des suites si l'architecte le veut.
- Un `gh` non authentifié (`A-271` (2)).

## Comments

- 2026-11-28 — Écrit par un agent rédacteur sur `origin/main` à `b5c7ac3` (plugin 8.9.5), sur `A-203` (3) et `A-249`. Chaque ligne citée a été relue à ce sommet. `Status: ready-for-agent` ; la question 1 attend l'architecte.
- 2026-11-28 — Question de l'architecte tranchée sur la recommandation du rédacteur : `A-271` (2) ; la section « Questions à l'architecte » est retirée.
- 2026-11-28 — Relu (agent neuf) ; trois écarts corrigés par l'architecte : numéros du banc sans `jq` (827-862) et de l'exigence de la ligne 6 (`relecteur.test.mjs:240`), fondement `A-203` (3) avec le modèle d'`A-197` (1), plus `A-192` (1).
