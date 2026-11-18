# La règle d'ascendance avant chaque fusion : aucune PR n'entre sans avoir été testée sur l'état de la branche où elle entre

Status: ready-for-agent
Type: task
Modèle: opus — une fonction partagée à concevoir (quatre verdicts), deux scripts de fusion à restructurer en boucle (mise à jour, CI, contrôle), un faux GitHub à rendre fidèle avant tout banc, et des textes de sécurité du capitaine à tenir justes ; une erreur fait entrer du code non testé dans tous les projets.
Blocked by: —
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/fusionner/scripts/github.test.mjs`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/sujet/scripts/faux-gh.mjs`, `skills/chaine/sujet/scripts/faux-gh.test.mjs`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/sujet/SKILL.md`, `skills/chaine/sujet/references/CONTENU.md`, `skills/chaine/chantier/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/admin.md`, `CONTEXT.md`, `README.md`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`, `scripts/depot.test.mjs`
Label: contre-revue

Spec : [`../capitaine-a-jour-et-teste.spec.md`](../capitaine-a-jour-et-teste.spec.md), lot 1 (décisions `A-1` à `A-6`, `A-16`). Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`P-1`, `P-6`, `A-17`). Base : `origin/main` à `4a45634` (plugin **7.15.0**, **738 tests**, `pnpm test` vert en 190 s environ). Faits relus à la source le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Le défaut vécu le 2026-11-18 sur `fedora`** (plugin 7.14.0). Deux sous-PR (#1968, #1979) sont entrées dans leur sujet alors qu'elles étaient en retard sur lui. Elles ont apporté chacune le même import, et l'erreur (« Duplicate identifier ») n'est apparue qu'à la PR suivante (#1969), puis sur #1971. Vers `develop`, #1986 a été squashée sur un `develop` que son sommet testé ne contenait pas (#1985 venait d'entrer), malgré le réglage « strict » de GitHub ; même cas la veille avec #1961. Dans les deux cas, la combinaison « PR + dernier état de la branche cible » n'avait jamais été testée.

**Quand le ticket est fait** (décisions du produit `P-1` et `P-6`) :

1. Juste avant chaque appel de fusion, vers `develop` (`passer.sh`) comme vers un sujet (`sujet.sh fusionner`), le capitaine refait `git fetch` de la cible et lit le verdict d'**une seule fonction** : `à-jour`, `retard`, `conflit-index` (conflit limité aux index générés) ou `conflit`.
2. **Aucune PR en retard n'entre sans mise à jour et retest, même pour de la documentation** (`P-6`). Une PR en retard, ou en conflit sur les seuls index générés, est mise à jour, retestée (CI attendue sur le nouveau sommet), puis contrôlée de nouveau. Elle n'est jamais squashée telle quelle.
3. Une PR en conflit hors des index générés est renvoyée, sans résolution.
4. Après le squash, l'arbre du squash est comparé à l'arbre testé. Un écart sort par un code dédié, **12** : commentaire sur la PR, ARRÊT de la boucle, le capitaine le dit à son lanceur.
5. Le conducteur n'étiquette qu'une sous-PR à la fois par sujet.
6. Le plugin passe en **7.16.0**, avec la première note de `NOTES-DE-VERSION.md`.

## Où

`fus/` abrège `skills/chaine/fusionner/scripts/`, `suj/` abrège `skills/chaine/sujet/scripts/`. Lignes relues sur `4a45634`.

| Fichier | Lignes | Ce qu'on y fait |
| --- | --- | --- |
| `fus/github.sh` | après 125 (`index_generes_regex`) | `ascendance <testé> <cible>` : la fonction partagée (`A-1`, Décision 1). |
| `fus/github.sh` | après 218 | `attendre_ci <pr> <sommet>` : l'attente de `passer.sh` l. 289-336, déplacée telle quelle (`A-5`, Décision 3). |
| `fus/github.test.mjs` | modèle l. 1-37 | Les verdicts de `ascendance`, joués par `source github.sh` sur le dépôt jouet, comme `regenerer_index`. |
| `fus/passer.sh` | 1-55 | En-tête : étape 5 bis « contrôle d'ascendance », sortie 12. |
| `fus/passer.sh` | 199-337 | Les étapes 2 à 5 (mise à jour, index, push, CI) deviennent le corps d'une boucle de trois tours au plus. Après la l. 337 vient le contrôle (Décision 2). Le reciblage d'une pile (l. 269-273) ne se joue qu'au premier tour. |
| `fus/passer.sh` | 356-389 | Le `sha` du squash se lit dans la réponse du `PUT` (l. 363 la jette dans `/dev/null`), sinon par la recherche actuelle (l. 384). L'arbre du squash est comparé à celui du sommet testé (l. 385-389). Un écart sort en 12 (`A-4`, Décision 5). |
| `suj/sujet.sh` | 18-23, 83-96 | En-tête : `fusionner` met à jour et attend la CI ; sens nouveau de 5 et 8 ; sortie 12. |
| `suj/sujet.sh` | 492-537 (`mettre_a_jour_sous_pr`) | Une fusion propre ne rend plus la main sans rien pousser (l. 501-503). Elle régénère, committe et pousse, comme le chemin d'index (l. 518-534). La fin (l. 536, `sortir 8`) rend la main au lieu de sortir : l'appelant attend la CI. |
| `suj/sujet.sh` | 742-756, 763-776 | Sur le chemin ordinaire, la lecture unique des checks et le squash de l'ancien sommet (l. 771-775) deviennent la boucle de la Décision 4. Le rafraîchissement du sujet (l. 764-769) reste avant elle. Le squash prend son `sha` dans la réponse du `PUT`, puis compare l'arbre et sort en 12 sur un écart (Décision 5). |
| `suj/sujet.sh` | 742-761 (chemin de la PR de mise à jour) | Inchangé : la PR de mise à jour (`maj`) garde la lecture unique des checks (l. 742-756), et son avance rapide est refusée si le sujet a bougé (`avancer_sujet`, l. 685-689). L'ascendance y tient déjà. |
| `fus/boucle.sh` | 25-35 | En-tête : sorties 8 et 12 de `sujet.sh`, sortie 12 de `passer.sh`. |
| `fus/boucle.sh` | 274-322 (`traiter_sujets`) | `12)` : `ARRÊT`. Le `while` tourne dans le sous-shell d'un tube (l. 274) : un `exit` n'y arrête pas la boucle. Le code doit remonter après le tube (`PIPESTATUS`), puis `exit 12`. |
| `fus/boucle.sh` | 365-389 | `12)` explicite : `ARRÊT sur #<n> (sortie 12) : arbre du squash ≠ arbre testé`, `exit 12` (aujourd'hui `*)` le ferait sans le dire). |
| `suj/faux-gh.mjs` | 1-21, 137-140, 227-234, 285-311 | Le faux GitHub fidèle (`A-6`, voir Ordre de travail, 1). |
| `suj/faux-gh.test.mjs` | — | Un test par comportement nouveau du faux. |
| `skills/chaine/socle-chaine-de-production/references/admin.md` | 6 | « (c'est le `strict: true` dont dépend le capitaine) » devient « (le filet de GitHub ; le capitaine vérifie aussi l'ascendance lui-même avant chaque fusion, skill `fusionner`) ». |
| Textes | voir « 4. Les textes » | `fusionner/SKILL.md`, `fusionner/references/CONTENU.md`, `sujet/SKILL.md`, `sujet/references/CONTENU.md`, `chantier/SKILL.md`, `CONTEXT.md`. |
| Version | voir « 5. La version et la note » | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md` (nouveau), `README.md`, `scripts/depot.test.mjs`. |

Appelants réels :

- `passer.sh` est lancé par `boucle.sh` (`passer`, l. 332-336), elle-même lancée par `veille.sh`.
- `sujet.sh fusionner` est lancé par `traiter_sujets` (`boucle.sh:304-320`).
- À la main, le capitaine joue l'un et l'autre (`fusionner/SKILL.md` § « Boucle »).
- `ascendance` et `attendre_ci` ne sont appelées que par ces deux scripts.

Aucune CLI nouvelle : la fonction vit dans `github.sh`, que les scripts sourcent déjà. `scripts/points-d-entree.test.mjs`, `depot-jouet.mjs` (`CHAINE`) et les listes d'outils copiés des bancs (`fusionner.test.mjs:895`, `sujet-fusionner.test.mjs:436`) ne changent donc pas.

Règles à lire : `fusionner/SKILL.md` en entier, et l'en-tête de `suj/sujet.sh` (l. 1-99).

## Décisions

Tenues (spec et programme) : `P-1` (la règle, conflit hors index renvoyé), `P-6` (aucune exception pour la documentation, remplace `P-3`), `A-1` à `A-6`, `A-16`. Rappel en une ligne chacune, puis ce que le ticket précise.

- `A-1` : une seule fonction, partagée par `passer.sh` et `sujet.sh` ; quatre verdicts, fondés sur `git merge-base --is-ancestor` et un essai de fusion.
- `A-2` : aucune exception pour la documentation, donc ni clé de contrat, ni tri du retard, ni lecture du réglage « à jour » de GitHub.
- `A-3` : contrôle juste avant l'appel de fusion, après `git fetch` de la cible ; `retard` ou `conflit-index` repris deux fois au plus par passage, puis sortie 5 ; `conflit` renvoyé.
- `A-4` : arbre du squash comparé à l'arbre du sommet testé ; écart = sortie dédiée, ARRÊT, commentaire.
- `A-5` : `sujet.sh fusionner` met à jour, attend la CI lui-même, recontrôle, puis squashe ; l'attente passe dans `github.sh`.
- `A-6` : le faux GitHub d'abord, puis les quatre bancs, chacun vu rouge sur `main`.
- `A-16` : 7.16.0, `NOTES-DE-VERSION.md`, renvoi depuis `README.md`.

Précisions du ticket :

1. **`ascendance <testé> <cible>`, une fonction de `github.sh`** (`A-1` laissait le choix d'un module Node). Raison : sans tri du retard, il ne reste que deux commandes git et la liste des index générés, que `github.sh` lit déjà (`index_generes_regex`, l. 122-125).
   - Elle écrit le verdict en ligne 1, puis, pour un conflit, les fichiers en conflit, un par ligne.
   - Les verdicts :
     - `à-jour` si `git merge-base --is-ancestor <cible> <testé>` réussit ;
     - sinon, la fonction essaie `git merge-tree --write-tree --name-only --no-messages <testé> <cible>` (git ≥ 2.38, déjà exigé par `passer.sh:125`) ;
     - une fusion propre donne `retard` ;
     - un conflit dont tous les fichiers sont des index générés déclarés donne `conflit-index` ;
     - tout autre conflit donne `conflit`.
   - Sortie 0 avec un verdict. Sortie 1 si la fonction ne peut pas conclure (réf absente, git en échec), avec le motif sur la sortie d'erreur ; ce n'est jamais un `à-jour` par défaut.
   - Une sortie 1 fait sortir `passer.sh` en 3 (« contrôle d'ascendance illisible », la boucle s'arrête), et `sujet.sh` en 11 (côté capitaine, aucun renvoi).
2. **`passer.sh` : le contrôle d'après la CI** (après la l. 337, juste avant le `PUT`), sur `origin/develop` qui vient d'être relu.

   | Verdict | Ce que fait `passer.sh` | Compte dans les deux reprises |
   | --- | --- | --- |
   | `à-jour` | squash, `sha` = le sommet testé | — |
   | `retard` | ligne `develop a bougé pendant la CI : nouvelle mise à jour (<k> sur 2)`, puis nouveau tour : mise à jour (étape 2), index, push, CI | oui |
   | `conflit-index` | même ligne, nouveau tour : l'étape 2 prend la version de develop puis régénère (l. 240-245) | oui |
   | `conflit` | sortie 2, avec la ligne `conflit avec develop hors index générés :` puis les fichiers indentés de deux espaces (l. 236-238) : la boucle renvoie la PR (l. 367-372) | non, la PR sort du passage |
   | illisible | sortie 3 | non |

   Une troisième reprise demandée donne la sortie 5 (« develop a bougé trois fois pendant la CI, relancer »). La boucle relance une fois, comme aujourd'hui (l. 359-363). Pendant un tour, un conflit à la mise à jour de l'étape 2 suit le chemin d'aujourd'hui (règle de pile, puis sortie 2).
3. **`attendre_ci <pr> <sommet>`** reprend les trois attentes de `passer.sh` : apparition du sommet (l. 290-293), apparition d'un check exigé (l. 295-310), verdict des checks (l. 311-336). Ses retours :
   - 0 vert ;
   - 1 rouge, la liste sur la sortie standard dans la forme de la l. 323-324 ;
   - 2 aucun check au bout de 5 minutes ;
   - 3 encore en attente après 60 minutes.

   `passer.sh` garde ses messages (`checks exigés rouges`, `CI non déclenchée`, `toujours en attente après 60 min`), que la boucle lit (l. 374-379).
4. **`sujet.sh fusionner`, chemin ordinaire** (hors PR de mise à jour) : un premier contrôle, puis trois tours au plus (`A-5`). Chaque tour attend la CI, relit la cible, puis contrôle ; il ne squashe que sur `à-jour`. Le contrôle est donc refait juste avant le `PUT`, comme dans `passer.sh`.
   - **Avant le premier tour**, `git fetch` du sujet, puis `ascendance <sommet> origin/<base>`, avant toute lecture de checks :
     - `conflit` : sortie 3, motif de la l. 516 (renvoi), la branche reste intacte ;
     - `retard` ou `conflit-index` : `mettre_a_jour_sous_pr` pousse le nouveau sommet (ligne `#<n> en retard sur <base> : mise à jour poussée (<sha court>), attente de la CI`) ;
     - `à-jour` : rien à pousser.
   - **Chaque tour** : `attendre_ci <n> <sommet>`, puis `git fetch` de la base, puis `ascendance` :
     - `à-jour` : squash, `sha` = ce sommet ;
     - `retard` ou `conflit-index` : nouvelle mise à jour poussée, tour suivant (deux reprises au plus, puis sortie 5) ;
     - `conflit` : sortie 3.
   - **Délais de `attendre_ci`** :
     - rouge : 3, comme la l. 755 (`checks rouges sur #<n> :` puis les noms) ;
     - sur un sommet que le capitaine n'a pas poussé, aucune CI ou une CI qui ne finit pas : 5, `REPRISE`, comme la l. 756 ;
     - sur un sommet qu'il vient de pousser : 8, « mise à jour poussée, CI pas finie : repasse au tour suivant ». C'est le seul sens qui reste à 8.

   Cela réalise déjà la part de `A-7` (lot 2) qui concerne `fusionner` : le conflit y est lu avant les checks (voir « Hors périmètre »).
5. **Sortie 12, la première libre.**
   - Codes relevés :
     - `passer.sh` sort en 0, 2, 3, 4, 5, 6, 7, et en 69 par `github.sh:12` ;
     - `sujet.sh` sort en 0, 2, 3, 4, 5, 6, 7, 8, 9, 11, 69 ;
     - `boucle.sh` sort en 1 (erreur inattendue, l. 352), 6, 9, 10, 64, 130, 143, et transmet tout code inconnu (l. 381, 388).

     **12** n'est utilisé nulle part : `grep -E '(sortir|exit|return) 1[2-9]'` ne rend rien.
   - Dans les deux scripts, le `sha` du squash se lit dans la réponse du `PUT` (`--jq .sha`), et son arbre se compare à celui du sommet testé.
   - Sur un écart, le script qui a fusionné pose lui-même le commentaire, puisqu'il a les deux arbres ; il est donc posé aussi quand le capitaine joue le script à la main. Le commentaire porte :
     - la marque invisible `<!-- arbre-different-capitaine -->` ;
     - la phrase « arbre du squash ≠ arbre testé » ;
     - le sha du squash et son arbre, le sommet testé et son arbre ;
     - la liste de `git diff --name-only <sommet testé> <squash>` ;
     - le pied de page des scripts (`\n\n---\n_Generated by [Claude Code](https://claude.ai/code)_`, comme `passer.sh:374`).
   - Le script retire ensuite `à-fusionner`, écrit `ARBRE DIFFÉRENT : …` et sort en 12, même si le commentaire n'a pas pu être posé (il le dit alors).
   - La boucle s'arrête (`ARRÊT`). La veille sort avec le même code (`VEILLE ARRÊTÉE`), et le capitaine le dit à son lanceur.
   - Écart avec la lettre de `A-4`, qui faisait écrire le commentaire par la boucle : le résultat est le même.
6. **Une sous-PR à la fois par sujet** (texte exact en « 4. Les textes »).
   - Les filles posent elles-mêmes `à-fusionner` (`chaine-de-production.md` § 5, étape 6). À chaque réveil, le conducteur ne laisse donc le label que sur la plus ancienne des sous-PR étiquetées d'un même sujet. Sur les autres, il le retire par `issue_write`, avec un commentaire, et le repose quand la précédente est entrée. Le brief des filles ne change pas.
   - Ce n'est qu'une économie de CI : la sûreté vient de `A-5`.
   - Avec `P-6`, une sous-PR de documentation remet elle aussi les autres en retard, et aucun outil ne trie plus le code de la documentation : la règle vaut pour toute sous-PR (voir `## Comments`).
7. **Les messages lus par les bancs et la boucle** (à garder tels quels) :
   - `passer.sh` : `FUSIONNÉE : <sha>, arbre = arbre testé` (inchangé) ;
   - `sujet.sh` : `#<n> fusionnée dans <base>` (préfixe inchangé) ;
   - les motifs que cherche la boucle (`checks exigés rouges`, `CI non déclenchée`, `conflit avec develop hors index générés :`) et les lignes nouvelles des Décisions 2, 4 et 5.
8. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : la forme interne des boucles, le nom des variables, le découpage des bancs en plusieurs tests. Elle ne tranche **pas** : le nombre de reprises (2), le code 12, l'ordre « attendre, relire, contrôler, squasher ».

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`. Chaque étape est vue rouge avant le code qui la rend verte. « Rouge sur `main` » veut dire que le banc échoue avec le faux GitHub de l'étape 1, sans le code de l'étape 3.

### 1. Le faux GitHub fidèle (`suj/faux-gh.mjs`), d'abord

Sans lui, aucun banc ne montre le défaut. Aujourd'hui, la fusion du faux ne refuse que si la tête a bougé (l. 297), son squash prend toujours l'arbre du sommet (`${sha}^{tree}`, l. 301-303), et ses checks sont rangés par PR (`checksDe`, l. 137-140). Ajouts, chacun documenté dans l'en-tête (l. 4-21) :

- **`strict`** : la liste des branches où GitHub exige une PR à jour. Le `PUT pulls/<n>/merge` d'une PR dont la base n'est pas ancêtre de `sha` y répond `gh: Head branch is not up to date with the base branch (HTTP 405)`. Sans la clé, aucune branche n'est stricte, et les bancs existants ne changent pas. Aucun script ne lit ce réglage (`A-2`) : il ne sert qu'à faire refuser le faux comme GitHub.
- **Arbre de la fusion comme GitHub** : le commit de squash ou de merge prend l'arbre de `git merge-tree --write-tree <base> <sha>`. Quand la base est ancêtre du sommet, c'est l'arbre du sommet, comme aujourd'hui. En conflit, le faux répond `gh: Pull Request is not mergeable (HTTP 405)`.
- **Checks par commit** : une clé de `checks` qui est un sha complet prime sur `#<n>` (qui ne vaut que pour la tête courante de la PR, comme aujourd'hui), puis sur `*`. Un état peut être une liste (`["IN_PROGRESS", "SUCCESS"]`), consommée **par sha** : le faux compte les lectures des `check-runs` de chaque commit (`lectures[<sha>]` dans l'état) et rend l'élément de ce rang, le dernier une fois la liste épuisée. Deux sommets qui lisent la même entrée `*` ont chacun leur compte.
- **`pendantCi`** : une liste de déplacements `{ lectures, branche, vers }`, joués dans l'ordre. À la `lectures`-ième lecture des `check-runs` depuis le déplacement précédent, le faux joue `update-ref refs/heads/<branche> <vers>` dans le dépôt nu, puis retire le déplacement de l'état. C'est la cible qui bouge pendant la CI ; le banc a poussé `vers` sur une branche à part.
- **`avantFusion`** : `{ branche, vers }`, joué au `PUT` avant le contrôle « strict » et le calcul de l'arbre, puis retiré. C'est une fusion concurrente que GitHub a acceptée, le cas de `fedora`.
- La réponse du `PUT` garde `{ merged: true, sha }`.

Tests dans `suj/faux-gh.test.mjs`, un par ajout. Puis `pnpm test` complet : les 738 tests restent verts. Un test qui rougit a reposé sur un squash d'une tête en retard sur sa base : le nommer dans la PR avant d'y toucher.

### 2. Les bancs, chacun vu rouge

`fus/github.test.mjs` couvre `ascendance` :

- chaque verdict ;
- un conflit sur un index généré seul (`conflit-index`) contre un conflit sur `docs/f.md` (`conflit`, avec le fichier) ;
- une réf absente donne la sortie 1, jamais `à-jour`.

Puis les quatre bancs exigés par le produit (`A-6`), le titre de chacun commençant par le libellé donné ici :

1. **« sous-PR en retard de code : mise à jour, CI attendue sur le nouveau sommet, puis squash »** (`fus/sujet-fusionner.test.mjs`). Le sujet reçoit `apps/a.ts` après le départ de la sous-PR #80. L'ancien sommet est `SUCCESS` par son sha, et `*` vaut `qualite: ["IN_PROGRESS", "SUCCESS"]`. Attendu :
   - sortie 0 ;
   - la branche de la sous-PR avance d'un commit de fusion (premier parent l'ancien sommet, second le sujet) ;
   - `PUT pulls/80/merge` porte `sha` = le nouveau sommet, et l'arbre du squash est celui du nouveau sommet.

   Variante : le nouveau sommet est `FAILURE` → sortie 3, aucun `PUT`. **Rouge sur `main`** : `main` squashe l'ancien sommet (l. 771-775).
2. **« retard de documentation seule : mis à jour et retesté »**. Même scénario, mais le sujet ne reçoit que `docs/guide.md`. Attendu : la sous-PR est mise à jour et poussée, et la CI est attendue sur le nouveau sommet, dont le `sha` part dans le `PUT`. Variante vers `develop` (`passer.sh`, `strict: ["develop"]`) : `develop` reçoit un Markdown pendant la CI (`pendantCi`), d'où une seconde mise à jour et une seconde CI. **Rouge sur `main`** : `main` squashe la sous-PR sans la pousser ; vers `develop`, `main` squashe le premier sommet, et le faux « strict » le refuse (sortie 5).
3. **« cible qui bouge pendant la CI : mise à jour reprise, deux fois au plus »** (`fus/fusionner.test.mjs`). PR #40 vers `develop`, avec `strict: ["develop"]` ; `pendantCi` amène sur `develop` un commit `apps/b.ts` à la deuxième lecture des checks. Attendu :
   - sortie 0 ;
   - deux poussées sur la branche de la PR ;
   - le `sha` du `PUT` est le second sommet, qui contient le nouveau `develop` ;
   - la ligne `arbre = arbre testé`.

   Avec trois déplacements de suite : sortie 5, aucun `PUT` accepté. Même cas pour une sous-PR dont le sujet bouge pendant `attendre_ci` : elle est remise à jour au tour suivant, jamais squashée sur l'ancien sujet. **Rouge sur `main`** : `main` squashe le premier sommet, le faux « strict » le refuse, d'où la sortie 5 ; vers un sujet, `main` ne relit pas le sujet.
4. **« arbre du squash différent de l'arbre testé : sortie 12, commentaire, ARRÊT de la boucle »**. PR #41 vers `develop`, sans `strict` ; `avantFusion` amène sur `develop` un commit `apps/c.ts`. Attendu :
   - `passer.sh` sort en 12 ;
   - la PR porte un commentaire avec la marque, « arbre du squash ≠ arbre testé », les deux arbres et `apps/c.ts` ;
   - `boucle.sh` écrit `ARRÊT sur #41 (sortie 12)` et sort en 12, sans passer la PR #42, pourtant prête.

   Même cas pour une sous-PR, par `traiter_sujets` : la boucle sort en 12, le code remontant du sous-shell. **Rouge sur `main`** : `main` sort en 0 avec « à examiner » (l. 388).

Tests existants qui changent de sens ou de fixture, chacun gardé et listé dans la PR :

- `sujet-fusionner.test.mjs:98`, « fusionner : sans conflit, squash comme avant ». Son sujet reçoit `docs/autre.md`, donc la sous-PR est en retard. Fixture réécrite : la sous-PR part du sujet (à jour), et le test garde son sens (« squash comme avant, branche intacte »). Le cas en retard est le banc 2.
- `sujet-fusionner.test.mjs:68` et `:119`, ainsi que `fusionner.test.mjs:1153` (sortie 8). Fixture réécrite : `*` retiré, checks par sha sur l'ancien sommet. Le nouveau sommet n'a pas de checks, d'où la sortie 8 (« mise à jour poussée, CI pas finie »).
- `sujet-fusionner.test.mjs:696` (checks en cours → 5, checks rouges → 3) : chemin de la PR de mise à jour, inchangé.

### 3. Le code

`github.sh` (`ascendance`, `attendre_ci`), puis `passer.sh`, `sujet.sh` et `boucle.sh`, enfin `admin.md:6`. Commits sous les hooks, jamais `--no-verify`.

### 4. Les textes

- `skills/chaine/fusionner/SKILL.md` :
  - l. 10 : après « remet donc **toutes** les autres PR en retard », ajouter « Le capitaine vérifie lui-même, juste avant chaque fusion, que la PR a été testée sur l'état de la branche où elle entre : il ne s'en remet pas au réglage « strict » de GitHub. »
  - Une section **« La règle d'ascendance »**, après « La règle » (l. 16-22). Elle donne :
    - les quatre verdicts de `ascendance` et ce que chaque script en fait ;
    - qu'aucune exception n'existe pour la documentation ;
    - les deux reprises, puis la sortie 5 ;
    - la sortie 12 (ARRÊT, commentaire, le dire au lanceur).

    Elle finit par cette phrase : « Dans un sujet, une seule sous-PR porte `à-fusionner` à la fois : le conducteur y veille (skill `chantier` § 6) ; deux à la fois se remettent l'une l'autre en retard, et la CI repasse à chaque fois. »
  - l. 58 et 60 :
    - la sortie 12 dans « VEILLE ARRÊTÉE », et `ARBRE DIFFÉRENT` dans le filtre du `Monitor` ;
    - réécrire, selon la Décision 4, la phrase « n'est pas renvoyée : `sujet.sh fusionner` la met à jour […] (sortie 8, `MISE À JOUR`) ; elle repasse au tour suivant, CI verte » ;
    - préciser, à « des checks encore en cours sortent en 5 », qu'ils y sortent après l'attente.
  - l. 94 (Enseignements) : « « Arbre du squash ≠ arbre testé » : sortie 12, la boucle s'arrête et la PR porte le commentaire ; une fusion ne se défait pas d'elle-même, un humain examine (`git diff <sommet testé> <squash>`). »
  - l. 38 (« un seul `role:capitaine` actif ») **ne change pas** : c'est le lot 4.
- `skills/chaine/fusionner/references/CONTENU.md` :
  - § `github.sh` (l. 5) : `ascendance` et `attendre_ci`, avec le pourquoi : deux copies de la règle ont divergé entre `passer.sh` et `sujet.sh` ;
  - § `passer.sh` (l. 17) : le contrôle avant la fusion ; « Sept codes de sortie » devient « Huit » ;
  - § `boucle.sh` (l. 21) : 8 et 12 ;
  - § « Les tests » (l. 51) : les quatre bancs.
- `skills/chaine/sujet/SKILL.md:34` : les sorties de `fusionner` (5, 8, 12) selon les Décisions 4 et 5 ; la mise à jour de toute sous-PR en retard.
- `skills/chaine/sujet/references/CONTENU.md:15` : le faux GitHub (« strict », arbre de la fusion, checks par commit et en liste consommée par sha, `pendantCi`, `avantFusion`).
- `skills/chaine/chantier/SKILL.md` § 6, à la fin de l'étape 5 (l. 95) :

  > **Une sous-PR à la fois par sujet.** Le capitaine met à jour et reteste toute sous-PR en retard sur son sujet, même pour de la documentation (skill `fusionner`, « La règle d'ascendance ») : deux sous-PR étiquetées ensemble se remettent l'une l'autre en retard, et la CI repasse à chaque fois. À chaque réveil, quand plusieurs sous-PR d'un même sujet portent `à-fusionner`, le conducteur ne le laisse qu'à la plus ancienne. Il le retire des autres (`issue_write`) avec le commentaire « `à-fusionner` retiré par le conducteur : une sous-PR à la fois dans `sujet/<nom>`, reposé après #<n> », puis le repose sur la suivante dès que la précédente est entrée.
- `CONTEXT.md` (§ Travail), un terme, sur la forme des existants : **Règle d'ascendance** : « La vérification, juste avant chaque fusion, que la PR a été testée sur l'état de la branche où elle entre ; une PR en retard est mise à jour et retestée, sans exception. » `_Avoid_` : « à jour » au sens du réglage de GitHub.

### 5. La version et la note

- `.claude-plugin/plugin.json:3` : `7.15.0` → `7.16.0`, une mineure : un comportement plus strict, des sorties nouvelles, rien de retiré (`README.md:186`). **Repli** : si `main` a bougé et porte déjà une version au-delà de 7.15.0, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre la mineure suivante et reporter le numéro dans la note.
- `NOTES-DE-VERSION.md` (nouveau, racine) :

  ```markdown
  # Notes de version

  La plus récente en haut. Les scripts de la chaîne sont copiés dans chaque projet par `poser` : une version publiée ne change rien chez un projet qui ne les repose pas. Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter.

  ## 7.16.0 — <date de la PR>

  ### Ce qui change

  <la règle d'ascendance vers develop et vers un sujet ; toute PR en retard, documentation comprise, mise à jour et retestée avant sa fusion ; la sortie 12 et l'arrêt du capitaine ; une sous-PR étiquetée à la fois par sujet>

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
  2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser`.
  3. Relancer le capitaine une fois cette PR entrée dans develop : la boucle prend les scripts de develop au tour suivant ; la veille, elle, tourne sur une copie : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée (skill `fusionner` § « Boucle »).
  ```

  Aucune clé de contrat à ajouter (`P-6`).
- `README.md` :
  - § « Installer », après les deux commandes de mise à jour (l. 18-21) : « Ce qu'un projet fait après une mise à jour, version par version : [`NOTES-DE-VERSION.md`](NOTES-DE-VERSION.md). »
  - l. 186 : ajouter « Écrire sa note en tête de `NOTES-DE-VERSION.md` (« Ce qui change », « Ce qu'un projet fait pour en profiter »). »
- `scripts/depot.test.mjs` : un test ajouté à la fin, avec `auMoins` (l. 912-917) et `exiger` (l. 751-755). Il vérifie quatre points :
  - la version du plugin est au moins 7.16.0 (message : la règle d'ascendance est celle du plugin 7.16.0 et des suivants) ;
  - le premier titre `## ` de `NOTES-DE-VERSION.md` commence par la version de `plugin.json`, et sa note porte `### Ce qui change` et `### Ce qu'un projet fait pour en profiter` ;
  - `README.md` renvoie à `NOTES-DE-VERSION.md` ;
  - `fusionner/SKILL.md` porte la phrase « une seule sous-PR porte `à-fusionner` à la fois ».

  Le test du T3 (l. 1010-1011, `auMoins(version, "7.15.0")`) ne change pas.

## Surfaces

| Surface | Preuve |
| --- | --- |
| Faux GitHub : « strict », arbre de la fusion, checks par commit et en liste consommée par sha, `pendantCi`, `avantFusion` | `skills/chaine/sujet/scripts/faux-gh.test.mjs`, un test par ajout |
| `ascendance` : quatre verdicts, sortie 1 jamais `à-jour` | `skills/chaine/fusionner/scripts/github.test.mjs` |
| `sujet.sh fusionner`, retard de code | `sujet-fusionner.test.mjs` « sous-PR en retard de code : mise à jour, CI attendue sur le nouveau sommet, puis squash » |
| `sujet.sh fusionner` et `passer.sh`, retard de documentation seule | `sujet-fusionner.test.mjs` « retard de documentation seule : mis à jour et retesté » |
| `passer.sh` et `sujet.sh`, cible qui bouge, deux reprises puis 5 | `fusionner.test.mjs` « cible qui bouge pendant la CI : mise à jour reprise, deux fois au plus » |
| `passer.sh`, `sujet.sh`, `boucle.sh` : sortie 12, commentaire, ARRÊT | `fusionner.test.mjs` « arbre du squash différent de l'arbre testé : sortie 12, commentaire, ARRÊT de la boucle » |
| Version, note, renvoi du README, phrase du conducteur | `scripts/depot.test.mjs`, test ajouté |
| Scripts posés dans un projet (`scripts/chaine/` à plat) | `scripts/poses.test.mjs` (rejoue les bancs posés) |

## Vérification

1. Ciblée, à chaque étape :
   - `node --test skills/chaine/sujet/scripts/faux-gh.test.mjs` ;
   - `node --test skills/chaine/fusionner/scripts/github.test.mjs` ;
   - `node --test skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs skills/chaine/fusionner/scripts/fusionner.test.mjs` ;
   - `node --test scripts/depot.test.mjs scripts/poses.test.mjs` ;
   - `bash -n` sur chaque script touché.
2. `pnpm test` complet : **738 avant** (`4a45634`), **738 plus les tests ajoutés après**, zéro échec. Aucun test retiré, sauté ni assoupli. Chaque fixture réécrite est nommée dans la PR (étape 2).
3. **Mutations**, chacune jouée sur une copie jetable, vue rouge, puis annulée. La PR liste chaque mutation et les tests qui ont rougi :
   - `ascendance` rend toujours `à-jour` : les bancs 1, 2 et 3 rougissent ;
   - `ascendance` rend `retard` sur un conflit de code : `github.test.mjs` rougit ;
   - `sujet.sh` squashe sans refaire le contrôle après `attendre_ci` : la variante sous-PR du banc 3 rougit ;
   - la comparaison d'arbres après le squash est retirée : le banc 4 rougit ;
   - aucune limite de reprises : le banc 3 (trois déplacements) rougit ou dépasse son délai ;
   - `traiter_sujets` ne fait pas remonter 12 : la variante sous-PR du banc 4 rougit.
4. `graphify update .`
5. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), dont le rendu va dans une section `## Revue de ticket` du corps de la PR. Puis `/security-review` : les scripts du capitaine sont des chemins sensibles du gabarit (`scripts/chaine/**` dans les projets). Son résultat va dans une section `## Sécurité` de la PR.
6. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `feat(chaine): le capitaine vérifie l'ascendance avant chaque fusion (plugin 7.16.0)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- Les lots 2 à 7 de la spec. Le lot 2 perd la part de `A-7` qui concerne `sujet.sh fusionner` : ce ticket y lit déjà le verdict avant les checks (Décision 4). Il ne garde que `relancer` (conflit sur index) et l'état « en conflit » de `file.sh`. Restent hors de ce ticket :
  - `fusionsSansEffet` ;
  - le verrou du passage et plusieurs capitaines : la règle « un seul `role:capitaine` actif » reste ;
  - le contrôle de vie et `send_message` au premier geste ;
  - `ticket-libre.mjs` ;
  - la ligne 8 (`livrer`, `fait_sur`, `github.sh:216`).
- La PR de mise à jour d'un sujet (`avancer_sujet`, lecture unique des checks) et `file.sh` : inchangés.
- `revue-exigee.mjs` et le contrat `.claude/chaine.json` : inchangés (`A-2`, aucune clé nouvelle).
- La repose dans les projets : chacun la fait d'après la note de version.

## Comments

- 2026-11-18 — Ticket ouvert au découpage du lot 1 de la spec, par un sous-agent de l'architecte, après relecture de la source sur `4a45634` et une suite complète (`pnpm test`, 738 verts, sur `51787f0`, documentation seule au-dessus de `main`). Écarts avec la spec relevés alors :
  - **Faux GitHub** : en plus de « strict » et des checks par PR (relevés par la spec), son squash prend toujours l'arbre du sommet (`faux-gh.mjs:301-303`). Le banc 4 est impossible sans l'arbre de `merge-tree`.
  - **`sujet.sh fusionner`** ne compare aucun arbre après son squash : la spec ne relevait la comparaison que pour `passer.sh`.
  - **Lignes citées** : toutes exactes, à une près : le `sha` du squash est passé l. 361, l'appel `PUT` est l. 363.
  - **`admin.md:6`** dit que le capitaine « dépend » de `strict: true` ; la spec ne le citait pas, le ticket le corrige.
  - **`A-4`** faisait écrire le commentaire par la boucle ; le ticket le fait écrire par le script qui a fusionné (Décision 5).
  - **Qui étiquette** : les filles posent `à-fusionner` elles-mêmes (`chaine-de-production.md:122`). « Le conducteur n'étiquette qu'une sous-PR à la fois » demande donc un geste du conducteur (Décision 6).
  - **Ordonnancement** : `chantier/SKILL.md` (§ 6) est touché par ce lot **et** par le lot 5, et `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` par chaque lot. Le lot 5 ne peut donc pas partir en même temps que celui-ci sans conflit sur ces fichiers.
- 2026-11-18 — Ticket repris après une relecture par un agent neuf et la décision du produit `P-6` (aucune PR en retard sans retest, même de documentation), qui remplace `P-3`.
  - Retirés avec `P-6` : la clé `cheminsDeCode`, le verdict `retard-doc`, l'arbre attendu d'un retard de documentation, la lecture du réglage « à jour », et la question qui restait ouverte sur ce point.
  - Faute de tri à faire, la fonction passe dans `github.sh` : plus de module Node, aucune CLI nouvelle, aucun `export` dans `revue-exigee.mjs`.
  - Portées de la relecture :
    - `sujet.sh` ne squashe qu'après l'attente, la relecture de la cible et un `à-jour` (M1) ;
    - table du contrôle de `passer.sh` (M2) ;
    - `sha` lu dans la réponse du `PUT` et arbre comparé dans `sujet.sh` (M4) ;
    - listes de checks consommées par sha (M6) ;
    - fixtures réécrites des tests à sortie 8 (M7) ;
    - fichiers chauds complétés ; sans CLI nouvelle, `points-d-entree.test.mjs` ne change pas (M8) ;
    - part de `A-7` réalisée ici (M10).
  - **Écart avec la spec** : la spec garde « une sous-PR de code à la fois par sujet ». Avec `P-6`, une sous-PR de documentation remet elle aussi les autres en retard, et aucun outil ne sépare plus le code de la documentation : le ticket dit « une sous-PR à la fois ». Si l'architecte veut garder « de code », il faut un tri par le conducteur, que `P-6` a retiré.
