# La règle d'ascendance avant chaque fusion : aucune PR n'entre sans avoir été testée sur l'état de la branche où elle entre

Status: ready-for-agent
Type: task
Modèle: opus — une fonction partagée à concevoir (quatre verdicts, contrat lu sur la cible), deux scripts de fusion à restructurer en boucle (mise à jour, CI, contrôle), un faux GitHub à rendre fidèle avant tout banc, et des textes de sécurité du capitaine à tenir justes ; une erreur fait entrer du code non testé dans tous les projets.
Blocked by: —
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/scripts/boucle.sh`, `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/sujet/scripts/faux-gh.mjs`, `skills/chaine/sujet/scripts/depot-jouet.mjs`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, `skills/chaine/socle-chaine-de-production/references/chaine.json`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/chantier/SKILL.md`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`, `scripts/depot.test.mjs`
Label: contre-revue

Spec : [`../capitaine-a-jour-et-teste.spec.md`](../capitaine-a-jour-et-teste.spec.md), lot 1 (décisions `A-1` à `A-6`, `A-16`). Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`P-1`, `P-3`, `A-17`). Base : `origin/main` à `4a45634` (plugin **7.15.0**, **738 tests**, `pnpm test` vert en 190 s environ). Faits relus à la source le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Le défaut vécu le 2026-11-18 sur `fedora`** (plugin 7.14.0). Deux sous-PR (#1968, #1979) sont entrées dans leur sujet alors qu'elles étaient en retard sur lui. Elles ont apporté chacune le même import, et l'erreur (« Duplicate identifier ») n'est apparue qu'à la PR suivante (#1969), puis sur #1971. Vers `develop`, #1986 a été squashée sur un `develop` que son sommet testé ne contenait pas (#1985 venait d'entrer), malgré le réglage « strict » de GitHub ; même cas la veille avec #1961. Dans les deux cas, la combinaison « PR + dernier état de la branche cible » n'avait jamais été testée.

**Quand le ticket est fait** (décision du produit `P-1`) :

1. Juste avant chaque appel de fusion, vers `develop` (`passer.sh`) comme vers un sujet (`sujet.sh fusionner`), le capitaine refait `git fetch` de la cible et lit le verdict d'**une seule fonction** : `à-jour`, `retard-doc`, `retard-code`, `conflit` (avec, pour un conflit, s'il est limité aux index générés).
2. Une PR en retard de code est mise à jour, retestée (CI attendue sur le nouveau sommet), puis contrôlée de nouveau ; jamais squashée telle quelle.
3. Une PR dont le retard ne porte que de la documentation et des index générés entre sans nouvelle CI (`P-3`), après calcul de l'arbre attendu (fusion locale, index régénérés), là où GitHub l'accepte (voir Décision 4).
4. Après le squash, l'arbre du squash est comparé à l'arbre attendu. Un écart sort par un code dédié, **12** : commentaire sur la PR, ARRÊT de la boucle, le capitaine le dit à son lanceur.
5. Le contrat gagne la clé `cheminsDeCode` ; sans elle, tout retard compte comme du code.
6. Le conducteur n'étiquette qu'une sous-PR de code à la fois par sujet.
7. Le plugin passe en **7.16.0**, avec la première note de `NOTES-DE-VERSION.md`.

## Où

`fus/` abrège `skills/chaine/fusionner/scripts/`, `suj/` abrège `skills/chaine/sujet/scripts/`, `socle/` abrège `skills/chaine/socle-chaine-de-production/references/`. Lignes relues sur `4a45634`.

| Fichier | Lignes | Ce qu'on y fait |
| --- | --- | --- |
| `fus/ascendance.mjs` (nouveau) | — | La fonction partagée (`A-1`) : `verdict(teste, cible)`, `classer(chemins, contrat)`, `lireContrat(ref)`, et une CLI (voir Décision 1). Modèle à imiter : `fus/revue-exigee.mjs` (en-tête d'usage l. 1-17, `lireBase` l. 118-132, `lireGit` l. 165-174, `estPointEntree` l. 245-251). |
| `fus/ascendance.test.mjs` (nouveau) | — | Les verdicts et le classement, sur de petits dépôts git (voir Ordre de travail, 2). |
| `fus/revue-exigee.mjs` | 98 | `export` devant `function regexDuMotif` : `ascendance.mjs` l'importe, aucune copie de plus (il en existe déjà trois, l. 95-97). Rien d'autre ne change dans ce fichier. |
| `fus/github.sh` | 59-60 (modèle) | `ASCENDANCE=…/ascendance.mjs` à côté de `IDENTIFIANT`, et `ascendance() { node "$ASCENDANCE" verdict "$@"; }`. |
| `fus/github.sh` | après 218 | `attendre_ci <pr> <sommet>` : l'attente de `passer.sh` l. 289-336, déplacée telle quelle (`A-5`) ; `cible_stricte <branche>` ; `arbre_attendu <testé> <arbre>` (voir Décisions 3 et 4). |
| `fus/passer.sh` | 1-55 | En-tête : étape 5 bis « contrôle d'ascendance », sortie 12. |
| `fus/passer.sh` | 199-337 | Les étapes 2 à 5 (mise à jour, index, push, CI) deviennent le corps d'une boucle de trois tours au plus. Après la l. 337, le contrôle (`A-3`). Le reciblage (l. 269-273) ne se joue qu'au premier tour. |
| `fus/passer.sh` | 356-389 | Le `sha` du squash se lit dans la réponse du `PUT` (l. 363 la jette dans `/dev/null`), sinon par la recherche actuelle (l. 384). La comparaison (l. 385-389) se fait contre l'arbre attendu ; un écart sort en 12 (`A-4`). |
| `suj/sujet.sh` | 18-23, 83-96 | En-tête : `fusionner` met à jour et attend la CI ; sens nouveau de 5 et 8 ; sortie 12. |
| `suj/sujet.sh` | 492-537 (`mettre_a_jour_sous_pr`) | Une fusion propre ne rend plus la main sans rien pousser (l. 501-503) : elle régénère, committe et pousse comme le chemin d'index (l. 518-534). La fin (l. 536, `sortir 8`) rend la main au lieu de sortir : l'appelant attend la CI. |
| `suj/sujet.sh` | 742-756, 763-776 | La lecture unique des checks et le squash de l'ancien sommet (l. 771-775) deviennent la boucle de `A-5` (voir Décision 5). Le rafraîchissement du sujet (l. 764-769) reste avant elle. |
| `suj/sujet.sh` | 757-761 | La PR de mise à jour (`avancer_sujet`) ne change pas : son avance rapide est refusée si le sujet a bougé (l. 685-689), l'ascendance y tient déjà. |
| `fus/boucle.sh` | 25-35 | En-tête : sorties 8 et 12 de `sujet.sh`, sortie 12 de `passer.sh`. |
| `fus/boucle.sh` | 274-322 (`traiter_sujets`) | `12)` : `ARRÊT`. Le `while` tourne dans le sous-shell d'un tube (l. 274) : un `exit` n'y arrête pas la boucle. Le code doit remonter après le tube (`PIPESTATUS`), puis `exit 12`. |
| `fus/boucle.sh` | 365-389 | `12)` explicite : `ARRÊT sur #<n> (sortie 12) : arbre du squash ≠ arbre testé`, `exit 12` (aujourd'hui `*)` le ferait sans le dire). |
| `suj/faux-gh.mjs` | 1-21, 137-140, 227-234, 239-267, 285-311 | Le faux GitHub fidèle (`A-6`, voir Ordre de travail, 1). |
| `suj/faux-gh.test.mjs` | — | Un test par comportement nouveau du faux. |
| `suj/depot-jouet.mjs` | 95-111 | `ascendance.mjs` dans `CHAINE` : sinon la boucle d'un banc ne la trouve pas. |
| `fus/fusionner.test.mjs` | 895 ; `fus/sujet-fusionner.test.mjs` 436 | `ascendance.mjs` dans les listes d'outils copiés (`outilsSansRegeneres`). |
| `socle/chaine.json` | 2-3 | Clé `cheminsDeCode` et sa phrase dans `$comment` (Décision 2). |
| `socle/admin.md` | 6 | « (c'est le `strict: true` dont dépend le capitaine) » devient « (le filet de GitHub ; le capitaine vérifie aussi l'ascendance lui-même avant chaque fusion, skill `fusionner`) ». |
| Textes | voir « 4. Les textes » | `fusionner/SKILL.md`, `fusionner/references/CONTENU.md`, `sujet/SKILL.md`, `sujet/references/CONTENU.md`, `chantier/SKILL.md`, `CONTEXT.md`. |
| Version | voir « 5. La version et la note » | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md` (nouveau), `README.md`, `scripts/depot.test.mjs`. |

Appelants réels : `passer.sh` est lancé par `boucle.sh` (`passer`, l. 332-336), elle-même lancée par `veille.sh` ; `sujet.sh fusionner` par `traiter_sujets` (`boucle.sh:304-320`) ; à la main, par le capitaine (`fusionner/SKILL.md` § « Boucle »). `ascendance.mjs fichiers` est appelé par le conducteur (`chantier/SKILL.md` § 6, Décision 7).

Règles à lire : `fusionner/SKILL.md` en entier, et l'en-tête de `suj/sujet.sh` (l. 1-99).

## Décisions

Tenues (spec et programme) : `P-1` (la règle en trois cas, conflit hors index renvoyé, chemins de code lus dans `.claude/chaine.json`), `P-3` (retard de documentation sans nouvelle CI), `A-1` à `A-6`, `A-16`. Rappel en une ligne chacune, puis ce que le ticket précise.

- `A-1` : une seule fonction, partagée par `passer.sh` et `sujet.sh`, retard lu par `git diff --name-only <testé>...<cible>`.
- `A-2` : `cheminsDeCode`, syntaxe de `cheminsSensibles` ; documentation = index généré déclaré, ou `*.md`, `*.mdx`, `*.txt`, **et** hors de tout motif ; sans la clé, tout retard = code ; clé lue sur la cible, jamais dans l'arbre de la PR.
- `A-3` : contrôle juste avant l'appel de fusion, après `git fetch` de la cible ; `retard-code` repris deux fois au plus par passage, puis sortie 5.
- `A-4` : arbre du squash comparé à l'arbre attendu ; écart = sortie dédiée, ARRÊT, commentaire.
- `A-5` : `sujet.sh fusionner` met à jour, attend la CI lui-même, recontrôle, puis squashe ; l'attente passe dans `github.sh`.
- `A-6` : le faux GitHub d'abord, puis les quatre bancs, chacun vu rouge sur `main`.
- `A-16` : 7.16.0, `NOTES-DE-VERSION.md`, renvoi depuis `README.md`.

Précisions du ticket :

1. **La fonction est un module Node, `fus/ascendance.mjs`** (`A-1` laissait le choix). Raisons : le classement lit un contrat JSON et des motifs, que `revue-exigee.mjs` sait déjà lire ; un module se teste sans dépôt jouet. Le module appelle git par `execFileSync`, comme `lireGit`. CLI :
   - `node ascendance.mjs verdict <testé> <cible>` écrit le verdict en ligne 1 : `à-jour`, `retard-doc`, `retard-code`, `conflit-index` ou `conflit`. La ligne 2 est `arbre <sha>` : l'arbre de `<testé>` pour `à-jour`, celui de `git merge-tree --write-tree <testé> <cible>` pour un retard ; elle est absente pour un conflit. Suivent les chemins, un par ligne : ceux du retard, ou ceux en conflit. Sorties : 0 un verdict ; 1 illisible (réf absente, git en échec), motif sur la sortie d'erreur ; 64 usage.
   - `à-jour` : `git merge-base --is-ancestor <cible> <testé>`. Sinon `git merge-tree --write-tree --name-only --no-messages` : un conflit limité aux index générés déclarés donne `conflit-index`, tout autre conflit `conflit`. Une fusion propre se classe par le diff, sans détection des renommages (`--no-renames`, comme `passer.sh:129`) : une suppression ne se cache pas derrière un ajout.
   - `node ascendance.mjs fichiers <cible>` lit des chemins sur l'entrée standard et écrit `code` ou `documentation` (pour le conducteur, Décision 7).
   - Côté shell : verdict illisible → `passer.sh` sort en 3 (« contrôle d'ascendance illisible », la boucle s'arrête), `sujet.sh` en 11 (côté capitaine, aucun renvoi).
2. **La clé `cheminsDeCode`.** Le gabarit `socle/chaine.json` la place après `cheminsSensibles` :
   `"cheminsDeCode": ["apps/**", "packages/**", "scripts/**", "e2e/**", ".github/**", ".husky/**", ".claude/**", "**/package.json", "pnpm-lock.yaml", "**/*.config.*", "**/tsconfig*.json", "**/.*rc", "**/.*rc.*"]`.
   La phrase ajoutée au `$comment` : « `cheminsDeCode` : les motifs (syntaxe de `cheminsSensibles`) d'un retard de code ; un fichier que la cible a reçu depuis le sommet testé est de documentation s'il est un index généré déclaré ou un `*.md`, `*.mdx` ou `*.txt`, et qu'aucun motif ne le couvre ; tout autre retard fait mettre à jour et retester la PR avant sa fusion. Lue dans le contrat de la cible ; sans la clé, tout retard compte comme du code. »
   Lecture : `.claude/chaine.json` de la cible. Une cible `origin/sujet/<nom>` y ajoute les motifs d'`origin/develop`, comme `lireBase` le fait pour les chemins sensibles, pour qu'un sujet en retard ne perde pas un motif déclaré depuis. Clé absente de la cible, contrat illisible, valeur autre qu'une liste de chaînes : tout est code, et la raison va sur la sortie d'erreur. Index générés : `scripts/docs/index-generes.json` de la cible, `*` = un segment (comme `index_generes_regex`, `github.sh:122-125`).
3. **L'arbre attendu d'un retard de documentation** (`arbre_attendu`, dans `github.sh`) se calcule sans commit, donc sans hook : `git switch -q --detach <testé>`, `git read-tree -u --reset <arbre de merge-tree>`, `regenerer_index` (commandes et contrôles, `github.sh:77-94`). L'arbre attendu tient si `git write-tree` rend le même arbre. Un index qui change, ou un contrôle en échec, fait traiter le retard comme du code : la mise à jour est poussée et retestée. Puis `git reset -q --hard` et `git switch -q --detach origin/develop`.
4. **« Strict » de GitHub et le retard de documentation.** `admin.md:6` pose « Require branches to be up to date » sur `develop` et `main`, et les checks exigés s'y lisent sur le sommet de la tête. GitHub refuse donc de fusionner une PR en retard, même d'un fichier Markdown. Défaut prudent : `cible_stricte <branche>` lit `strict_required_status_checks_policy` (rulesets, `rules/branches/<b>`), sinon `.strict` de l'ancienne protection (`branches/<b>/protection/required_status_checks`) ; illisible = stricte. Vers une cible stricte, `retard-doc` suit le chemin de `retard-code`. Vers une cible sans « strict » (un sujet : `sujet.sh ouvrir` le crée « sans protection de branche », en-tête l. 16), il entre sans nouvelle CI. À confirmer par l'architecte (voir `## Comments`).
5. **`sujet.sh fusionner` (`A-5`)**, chemin ordinaire (hors PR de mise à jour) : jusqu'à trois tours.
   - `à-jour` : `attendre_ci` sur le sommet, puis squash.
   - `retard-doc` : `attendre_ci` sur le sommet, puis `arbre_attendu`, puis squash.
   - `retard-code` ou `conflit-index` : `mettre_a_jour_sous_pr` pousse le nouveau sommet, `attendre_ci` sur lui, puis tour suivant. Au-delà de deux mises à jour : sortie 5.
   - `conflit` : sortie 3, avec le motif actuel de la l. 516, et la branche reste intacte.

   Délais : sur un sommet que le capitaine n'a pas poussé, aucune CI ou une CI qui ne finit pas sort en 5, `REPRISE`, comme la l. 756 aujourd'hui. Sur un sommet qu'il vient de pousser, elle sort en 8 (« mise à jour poussée, CI pas finie : repasse au tour suivant »), le seul sens qui reste à 8. CI rouge : 3, comme la l. 755. Le squash lie `sha` au dernier sommet testé.
6. **Sortie 12, la première libre.** Codes relevés : `passer.sh` sort en 0, 2, 3, 4, 5, 6, 7, et 69 par `github.sh:12` ; `sujet.sh` en 0, 2, 3, 4, 5, 6, 7, 8, 9, 11, 69 ; `boucle.sh` en 1 (erreur inattendue, l. 352), 6, 9, 10, 64, 130, 143, et transmet tout code inconnu (l. 381, 388). **12** n'est utilisé nulle part (`grep -E '(sortir|exit|return) 1[2-9]'` ne rend rien).
   - Le script qui a fusionné (`passer.sh` ou `sujet.sh`) pose lui-même le commentaire, puisqu'il a les deux arbres ; ainsi le commentaire est aussi posé quand le capitaine joue le script à la main. Ce commentaire porte la marque invisible `<!-- arbre-different-capitaine -->`, la phrase « arbre du squash ≠ arbre testé », le sha du squash et son arbre, le sommet testé et l'arbre attendu, la liste de `git diff --name-only <arbre attendu> <squash>`, puis le pied de page des scripts (`\n\n---\n_Generated by [Claude Code](https://claude.ai/code)_`, comme `passer.sh:374`).
   - Le script retire ensuite `à-fusionner` et écrit `ARBRE DIFFÉRENT : …` ; il sort en 12, même si le commentaire n'a pas pu être posé (il le dit alors).
   - La boucle s'arrête (`ARRÊT`). La veille sort avec le même code (`VEILLE ARRÊTÉE`). Le capitaine le dit à son lanceur.
   - Écart avec la lettre de `A-4`, qui faisait écrire le commentaire par la boucle ; le résultat est le même.
7. **Une sous-PR de code à la fois par sujet** (texte exact en « 4. Les textes »). Les filles posent elles-mêmes `à-fusionner` (`chaine-de-production.md` § 5, étape 6). C'est donc le conducteur qui, à chaque réveil, ne laisse le label que sur la plus ancienne des sous-PR de code étiquetées d'un même sujet. Sur les autres, il retire le label par `issue_write`, avec un commentaire, et le repose quand la précédente est entrée. Le brief des filles ne change pas. Une sous-PR de documentation garde son label. Ce n'est qu'une économie de CI : la sûreté vient de `A-5`. Défaut choisi par le ticket, à confirmer à la contre-relecture.
8. **Les messages lus par les bancs et la boucle** (à garder tels quels) :
   - `passer.sh` : `FUSIONNÉE : <sha>, arbre = arbre testé` (inchangé), `FUSIONNÉE : <sha>, arbre = arbre attendu (retard de documentation : <fichiers>)`, et `develop a bougé pendant la CI (retard de code : <fichiers>) : nouvelle mise à jour (<k> sur 2)`.
   - `sujet.sh` : `#<n> en retard de code sur <base> (<fichiers>) : mise à jour poussée (<sha court>), attente de la CI`, `#<n> en retard de documentation sur <base> (<fichiers>) : fusion sans nouvelle CI`, et `#<n> fusionnée dans <base>` (préfixe inchangé, lu par les bancs).
   - Les motifs que la boucle cherche (`checks exigés rouges`, `CI non déclenchée`, `conflit avec develop hors index générés :` suivi des fichiers indentés) ne changent pas.
9. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : la forme interne de la boucle de `passer.sh` (fonction ou `while`), le nom des fonctions de `github.sh`, le découpage des bancs en plusieurs tests. Elle ne tranche **pas** : le nombre de reprises (2), le code 12, la liste du gabarit.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`. Chaque étape est vue rouge avant le code qui la rend verte. « Rouge sur `main` » veut dire : le banc échoue avec le faux GitHub de l'étape 1, sans le code de l'étape 3.

### 1. Le faux GitHub fidèle (`suj/faux-gh.mjs`), d'abord

Sans lui, aucun banc ne montre le défaut : la fusion du faux ne refuse que si la tête a bougé (l. 297), son squash prend toujours l'arbre du sommet (`${sha}^{tree}`, l. 301-303), et ses checks sont rangés par PR (`checksDe`, l. 137-140). Ajouts, chacun documenté dans l'en-tête (l. 4-21) :

- **`strict`** : la liste des branches où GitHub exige une PR à jour. Le `PUT pulls/<n>/merge` d'une PR dont la base n'est pas ancêtre de `sha` répond `gh: Head branch is not up to date with the base branch (HTTP 405)`. `rules/branches/<b>` porte `strict_required_status_checks_policy` dans le paramètre de `required_status_checks`, et l'ancienne protection (`protectionClassique`) porte `.strict`. Absente : aucune branche stricte, et les bancs existants ne changent pas.
- **Arbre de la fusion comme GitHub** : le commit de squash ou de merge prend l'arbre de `git merge-tree --write-tree <base> <sha>`. Quand la base est ancêtre du sommet, c'est l'arbre du sommet, comme aujourd'hui. En conflit : `gh: Pull Request is not mergeable (HTTP 405)`.
- **Checks par commit** : une clé `checks` qui est un sha complet prime sur `#<n>` (qui ne vaut que pour la tête courante de la PR, comme aujourd'hui), puis sur `*`. Un état peut être une liste : chaque lecture des `check-runs` de ce commit consomme le premier élément tant qu'il en reste plus d'un (`["IN_PROGRESS", "SUCCESS"]`).
- **`pendantCi`** : une liste de déplacements `{ lectures, branche, vers }`, joués dans l'ordre. À la `lectures`-ième lecture des `check-runs` depuis le déplacement précédent, `update-ref refs/heads/<branche> <vers>` dans le dépôt nu, puis le déplacement est retiré de l'état. C'est la cible qui bouge pendant la CI ; le banc a poussé `vers` sur une branche à part.
- **`avantFusion`** : `{ branche, vers }`, joué au `PUT` avant le contrôle « strict » et le calcul de l'arbre, puis retiré. C'est une fusion concurrente que GitHub a acceptée, le cas de `fedora`.
- La réponse du `PUT` garde `{ merged: true, sha }`.

Tests dans `suj/faux-gh.test.mjs`, un par ajout. Puis `pnpm test` complet : les 738 tests restent verts. Un test qui rougit a reposé sur un squash d'une tête en retard sur sa base : le nommer dans la PR avant d'y toucher.

### 2. Les bancs, chacun vu rouge

`fus/ascendance.test.mjs`, sur de petits dépôts git, couvre :

- chaque verdict ;
- sans clé, tout est code ; contrat illisible, code ;
- `apps/api/CLAUDE.md` est code (un motif le couvre), `docs/x.json` aussi (pas une forme de documentation) ;
- `docs/a.md`, `docs/a.mdx` et `notes.txt` sont de la documentation, et un index généré déclaré aussi, même en `.json` ;
- `conflit-index` contre `conflit`, ce dernier avec ses fichiers ;
- une PR qui retire la clé dans son propre arbre n'y change rien (contrat lu sur la cible) ;
- une cible de sujet ajoute les motifs d'`origin/develop`.

Puis les quatre bancs exigés par le produit (`A-6`). Le titre de chacun commence par le libellé donné ici :

1. **« sous-PR en retard de code : mise à jour, CI attendue sur le nouveau sommet, puis squash »** (`fus/sujet-fusionner.test.mjs`). Le sujet reçoit `apps/a.ts` après le départ de la sous-PR #80. L'ancien sommet est `SUCCESS` par son sha, et `*` vaut `qualite: ["IN_PROGRESS", "SUCCESS"]`. Attendu :
   - sortie 0 ;
   - la branche de la sous-PR avance d'un commit de fusion (premier parent l'ancien sommet, second le sujet) ;
   - `PUT pulls/80/merge` porte `sha` = le nouveau sommet, et l'arbre du squash est celui du nouveau sommet.

   Variante : le nouveau sommet est `FAILURE` → sortie 3, aucun `PUT`. **Rouge sur `main`** : `main` squashe l'ancien sommet (l. 771-775).
2. **« retard de documentation : fusion sans nouvelle CI, arbre attendu »**. Vers un sujet, dont le contrat porte `cheminsDeCode` (la liste du gabarit), le sujet reçoit `docs/guide.md`. Attendu :
   - sortie 0, rien de poussé sur la branche de la sous-PR ;
   - `sha` = l'ancien sommet ;
   - arbre du squash = `merge-tree(sujet, sommet)` ;
   - la ligne `en retard de documentation`.

   Contrastes dans le même test : sans la clé, la même sous-PR est mise à jour et poussée ; un retard `apps/api/CLAUDE.md` est du code. Vers `develop` (`passer.sh`), `develop` reçoit un Markdown pendant la CI (`pendantCi`) : sans `strict`, fusion sans seconde CI et `arbre = arbre attendu` ; avec `strict: ["develop"]`, seconde mise à jour et seconde CI. **Rouge sur `main`** : sans la clé, `main` ne pousse jamais sur une fusion propre, et les lignes attendues n'existent pas.
3. **« cible qui bouge pendant la CI : mise à jour reprise, deux fois au plus »** (`fus/fusionner.test.mjs`). PR #40 vers `develop`, avec `strict: ["develop"]` ; `pendantCi` amène sur `develop` un commit `apps/b.ts` à la deuxième lecture des checks. Attendu :
   - sortie 0 ;
   - deux poussées sur la branche de la PR ;
   - `sha` du `PUT` = le second sommet, qui contient le nouveau `develop` ;
   - `arbre = arbre testé`.

   Trois déplacements de suite → sortie 5, aucun `PUT` accepté. Même cas pour une sous-PR dont le sujet bouge pendant `attendre_ci`. **Rouge sur `main`** : `main` squashe le premier sommet, le faux « strict » refuse, sortie 5.
4. **« arbre du squash différent de l'arbre testé : sortie 12, commentaire, ARRÊT de la boucle »**. PR #41 vers `develop` sans `strict` ; `avantFusion` amène sur `develop` un commit `apps/c.ts`. Attendu :
   - `passer.sh` sort en 12 ;
   - la PR porte un commentaire avec la marque, « arbre du squash ≠ arbre testé », les deux arbres et `apps/c.ts` ;
   - `boucle.sh` écrit `ARRÊT sur #41 (sortie 12)`, sort en 12, et ne passe pas la PR #42, pourtant prête.

   Même cas pour une sous-PR, par `traiter_sujets` : la boucle sort en 12 (le code remonte du sous-shell). **Rouge sur `main`** : `main` sort en 0 avec « à examiner » (l. 388).

Tests existants qui changent de sens. Chacun est gardé, réécrit au plus près de son sens, et listé dans la PR :

- `sujet-fusionner.test.mjs:98`, « fusionner : sans conflit, squash comme avant ». Son retard `docs/autre.md` est du code sans clé : soit il devient un cas de retard de code, soit le contrat du sujet porte la clé. Il ne sera jamais supprimé.
- `:68` et `:119`, ainsi que `fusionner.test.mjs:1153` (sortie 8). Ils gardent leur sens : le nouveau sommet n'a pas de checks (checks par sha sur l'ancien seulement), d'où la sortie 8.
- `:696` (checks en cours → 5) : il reste vrai, après l'attente.

### 3. Le code

Dans l'ordre : `ascendance.mjs` (et l'`export` de `regexDuMotif`), puis `github.sh`, `passer.sh`, `sujet.sh` et `boucle.sh`, enfin `CHAINE` et les listes d'outils des bancs. Ensuite le gabarit `chaine.json` et `admin.md:6`. Commits sous les hooks, jamais `--no-verify`.

### 4. Les textes

- `skills/chaine/fusionner/SKILL.md` :
  - l. 10 : après « remet donc **toutes** les autres PR en retard », ajouter « Le capitaine vérifie lui-même, juste avant chaque fusion, que la PR a été testée sur l'état de la branche où elle entre : il ne s'en remet pas au réglage « strict » de GitHub. »
  - Une section **« La règle d'ascendance »**, après « La règle » (l. 16-22). Elle donne les quatre verdicts de `ascendance.mjs`, `cheminsDeCode` (sans la clé, tout retard = code), le cas d'une cible « strict » (Décision 4), les deux reprises puis la sortie 5, et la sortie 12 (ARRÊT, commentaire, le dire au lanceur). Elle finit par cette phrase : « Dans un sujet, une seule sous-PR de code porte `à-fusionner` à la fois : le conducteur y veille (skill `chantier` § 6) ; deux à la fois se remettent l'une l'autre en retard, et la CI repasse à chaque fois. »
  - l. 14 : `scripts/ascendance.mjs` dans la liste posée.
  - l. 58 et 60 : la sortie 12 dans « VEILLE ARRÊTÉE », `ARBRE DIFFÉRENT` dans le filtre du `Monitor`. Les phrases sur la sortie 8 et sur les checks en cours (« n'est pas renvoyée : `sujet.sh fusionner` la met à jour […] (sortie 8, `MISE À JOUR`) ; elle repasse au tour suivant, CI verte », « des checks encore en cours sortent en 5 ») sont réécrites selon la Décision 5.
  - l. 94 (Enseignements) : « « Arbre du squash ≠ arbre testé » : sortie 12, la boucle s'arrête et la PR porte le commentaire ; une fusion ne se défait pas d'elle-même, un humain examine (`git diff <sommet testé> <squash>`). »
  - l. 38 (« un seul `role:capitaine` actif ») **ne change pas** : c'est le lot 4.
- `skills/chaine/fusionner/references/CONTENU.md` :
  - § `github.sh` (l. 5) : `ascendance`, `attendre_ci`, `cible_stricte`, `arbre_attendu`.
  - Section nouvelle `## scripts/ascendance.mjs`, avec le pourquoi : deux copies de la règle ont divergé entre `passer.sh` et `sujet.sh`.
  - § `passer.sh` (l. 17) : le contrôle avant la fusion ; « Sept codes de sortie » devient « Huit ».
  - § `boucle.sh` (l. 21) : 8 et 12.
  - § « Les tests » (l. 51) : les quatre bancs.
- `skills/chaine/sujet/SKILL.md:34` : les sorties de `fusionner` (5, 8, 12) selon la Décision 5 ; la mise à jour d'une sous-PR en retard de code.
- `skills/chaine/sujet/references/CONTENU.md:15` : le faux GitHub (« strict », arbre de la fusion, checks par commit et en liste, `pendantCi`, `avantFusion`).
- `skills/chaine/chantier/SKILL.md` § 6, à la fin de l'étape 5 (l. 95) :

  > **Une sous-PR de code à la fois par sujet.** Le capitaine met à jour et reteste toute sous-PR en retard de code sur son sujet (skill `fusionner`, « La règle d'ascendance ») : deux sous-PR de code étiquetées ensemble se remettent l'une l'autre en retard, et la CI repasse à chaque fois. À chaque réveil, quand plusieurs sous-PR de code d'un même sujet portent `à-fusionner`, le conducteur ne le laisse qu'à la plus ancienne. Il le retire des autres (`issue_write`) avec le commentaire « `à-fusionner` retiré par le conducteur : une sous-PR de code à la fois dans `sujet/<nom>`, reposé après #<n> », et le repose sur la suivante dès que la précédente est entrée. Une sous-PR est de code quand `git diff --name-only origin/sujet/<nom>...origin/<branche> | node scripts/chaine/ascendance.mjs fichiers origin/sujet/<nom>` rend `code` ; une sous-PR de documentation garde son label.
- `CONTEXT.md` (§ Travail) : deux termes, sur la forme des existants.
  - **Règle d'ascendance** : « La vérification, juste avant chaque fusion, que la PR a été testée sur l'état de la branche où elle entre. »
  - **Retard de documentation** : « Ce que la cible a reçu depuis le sommet testé, quand ce n'est que de la documentation ou des index générés hors des chemins de code ; tout autre retard est de code. » `_Avoid_` : « à jour » au sens de GitHub.

### 5. La version et la note

- `.claude-plugin/plugin.json:3` : `7.15.0` → `7.16.0` (mineure : une clé de contrat nouvelle et facultative, un comportement plus strict, rien de retiré ; `README.md:186`). **Repli** : si `main` a bougé et porte déjà une version au-delà de 7.15.0, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre la mineure suivante, et reporter le numéro dans la note.
- `NOTES-DE-VERSION.md` (nouveau, racine) :

  ```markdown
  # Notes de version

  La plus récente en haut. Les scripts de la chaîne sont copiés dans chaque projet par `poser` : une version publiée ne change rien chez un projet qui ne les repose pas. Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter.

  ## 7.16.0 — <date de la PR>

  ### Ce qui change

  <la règle d'ascendance vers develop et vers un sujet ; la mise à jour et la CI d'une sous-PR en retard de code ; le retard de documentation sans nouvelle CI vers une cible sans « strict » ; la sortie 12 et l'arrêt du capitaine ; la clé `cheminsDeCode` ; une sous-PR de code étiquetée à la fois par sujet>

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
  2. Reposer les scripts, dans une PR du projet : `/maj-skills:fusionner poser`, puis `/maj-skills:sujet poser` (`scripts/chaine/ascendance.mjs` arrive avec eux).
  3. Ajouter à `.claude/chaine.json`, après `cheminsSensibles`, la ligne `"cheminsDeCode": [...]` du gabarit, recopiée telle quelle (`.claude/**` est un chemin sensible : contre-revue). Sans elle, le capitaine retient tout retard comme du code : rien n'entre sans test, mais chaque retard coûte une CI.
  4. Relancer le capitaine une fois la PR entrée dans develop : la boucle prend les scripts de develop au tour suivant ; la veille, elle, tourne sur une copie : `bash scripts/chaine/boucle.sh --arreter`, nouvelle copie dans `<scratchpad>/outils`, puis `veille.sh` relancée (skill `fusionner` § « Boucle »).
  ```
- `README.md` :
  - § « Installer », après les deux commandes de mise à jour (l. 18-21) : « Ce qu'un projet fait après une mise à jour, version par version : [`NOTES-DE-VERSION.md`](NOTES-DE-VERSION.md). »
  - l. 186 : ajouter « Écrire sa note en tête de `NOTES-DE-VERSION.md` (« Ce qui change », « Ce qu'un projet fait pour en profiter »). »
- `scripts/depot.test.mjs` : un test ajouté à la fin, avec `auMoins` (l. 912-917) et `exiger` (l. 751-755), qui vérifie quatre points :
  - version du plugin ≥ 7.16.0 (message : la règle d'ascendance est celle du plugin 7.16.0 et des suivants) ;
  - le premier titre `## ` de `NOTES-DE-VERSION.md` commence par la version de `plugin.json`, et sa note porte `### Ce qui change` et `### Ce qu'un projet fait pour en profiter` ;
  - `README.md` renvoie à `NOTES-DE-VERSION.md` ;
  - `fusionner/SKILL.md` porte la phrase « une seule sous-PR de code porte `à-fusionner` à la fois ».

  Le test du T3 (l. 1010-1011, `auMoins(version, "7.15.0")`) ne change pas.

## Surfaces

| Surface | Preuve |
| --- | --- |
| Faux GitHub : « strict », arbre de la fusion, checks par commit et en liste, `pendantCi`, `avantFusion` | `skills/chaine/sujet/scripts/faux-gh.test.mjs`, un test par ajout |
| `ascendance.mjs` : verdicts, classement, contrat lu sur la cible | `skills/chaine/fusionner/scripts/ascendance.test.mjs` |
| `sujet.sh fusionner`, retard de code | `sujet-fusionner.test.mjs` « sous-PR en retard de code : mise à jour, CI attendue sur le nouveau sommet, puis squash » |
| `sujet.sh fusionner` et `passer.sh`, retard de documentation, cible stricte ou non | `sujet-fusionner.test.mjs` « retard de documentation : fusion sans nouvelle CI, arbre attendu » |
| `passer.sh`, cible qui bouge, deux reprises puis 5 ; idem vers un sujet | `fusionner.test.mjs` « cible qui bouge pendant la CI : mise à jour reprise, deux fois au plus » |
| `passer.sh`, `sujet.sh`, `boucle.sh` : sortie 12, commentaire, ARRÊT | `fusionner.test.mjs` « arbre du squash différent de l'arbre testé : sortie 12, commentaire, ARRÊT de la boucle » |
| Gabarit `chaine.json` (`cheminsDeCode`) | `ascendance.test.mjs` (la liste du gabarit lue telle quelle) et `scripts/poses.test.mjs` (bancs posés avec le gabarit, l. 97-99) |
| Version, note, renvoi du README, phrase du conducteur | `scripts/depot.test.mjs`, test ajouté |
| Scripts posés dans un projet (`scripts/chaine/` à plat) | `scripts/poses.test.mjs` (rejoue les bancs posés ; `ascendance.mjs` part avec `fusionner/scripts`) |

## Vérification

1. Ciblée, à chaque étape :
   - `node --test skills/chaine/sujet/scripts/faux-gh.test.mjs` ;
   - `node --test skills/chaine/fusionner/scripts/ascendance.test.mjs` ;
   - `node --test skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs skills/chaine/fusionner/scripts/fusionner.test.mjs` ;
   - `node --test scripts/depot.test.mjs scripts/poses.test.mjs` ;
   - `bash -n` sur chaque script touché.
2. `pnpm test` complet : **738 avant** (`4a45634`), **738 + les tests ajoutés après**, zéro échec. Aucun test retiré, sauté ni assoupli. Chaque test qui change de sens est nommé dans la PR (étape 2).
3. **Mutations**, chacune jouée sur une copie jetable, vue rouge, puis annulée. La PR liste chaque mutation et les tests qui ont rougi :
   - `ascendance` rend toujours `à-jour` : les bancs 1 et 3 rougissent ;
   - le classement ignore `cheminsDeCode`, tout est de la documentation : le contraste `apps/api/CLAUDE.md` du banc 2 rougit ;
   - le classement compte tout comme du code : le cas principal du banc 2 rougit ;
   - le contrat est lu dans l'arbre testé : `ascendance.test.mjs` rougit ;
   - la comparaison d'arbres après le squash est retirée : le banc 4 rougit ;
   - aucune limite de reprises : le banc 3 (trois déplacements) rougit ou dépasse son délai ;
   - `traiter_sujets` ne fait pas remonter 12 : la variante sous-PR du banc 4 rougit.
4. `graphify update .`
5. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR. Puis `/security-review` : les scripts du capitaine sont des chemins sensibles du gabarit (`scripts/chaine/**` dans les projets). Son résultat va dans une section `## Sécurité` de la PR.
6. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `feat(chaine): le capitaine vérifie l'ascendance avant chaque fusion (plugin 7.16.0)` (120 caractères au plus avec ` (#n)`).
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`) ; le produit fusionne.
   - Ticket : `Status: Fait — PR #<n>` dans la PR.

## Hors périmètre

- Les lots 2 à 7 de la spec :
  - le conflit lu avant les checks, `relancer` sur index et `file.sh` « en conflit » ;
  - `fusionsSansEffet` ;
  - le verrou du passage et plusieurs capitaines : la règle « un seul `role:capitaine` actif » reste ;
  - le contrôle de vie et `send_message` au premier geste ;
  - `ticket-libre.mjs` ;
  - la ligne 8 (`livrer`, `fait_sur`, `github.sh:216`).
- Faire lire `cheminsDeCode` par `revue-exigee.mjs` (spec, Hors périmètre) : seul l'`export` de `regexDuMotif` change.
- La PR de mise à jour d'un sujet (`avancer_sujet`) et `file.sh` : inchangés.
- La repose dans les projets : chacun la fait d'après la note de version.

## Comments

- 2026-11-18 — Ticket ouvert au découpage du lot 1 de la spec, par un sous-agent de l'architecte, après relecture de la source sur `4a45634` et une suite complète (`pnpm test`, 738 verts, sur `51787f0`, documentation seule au-dessus de `main`). Écarts avec la spec :
  - **En-tête de la spec** : « à valider par le produit », alors que la carte la dit validée (`P-4`, 17 h 40 UTC) ; l'en-tête n'a pas été mis à jour.
  - **`P-3` vers `develop`** : avec « Require branches to be up to date » (`admin.md:6`) et des checks exigés lus sur le sommet de la tête, GitHub refuse la fusion d'une PR en retard, même de documentation. Un retard de documentation n'entre donc sans nouvelle CI que vers une cible sans « strict », c'est-à-dire un sujet. Défaut prudent du ticket (Décision 4), **à confirmer par l'architecte auprès du produit**.
  - **`admin.md:6`** dit que le capitaine « dépend » de `strict: true` ; la spec ne le citait pas, le ticket le corrige.
  - **Faux GitHub** : en plus de « strict » et des checks par PR (relevés par la spec), son squash prend toujours l'arbre du sommet (`faux-gh.mjs:301-303`). Le banc 4 est impossible sans l'arbre de `merge-tree`.
  - **`sujet.sh fusionner`** ne compare aucun arbre après son squash : la spec ne relevait la comparaison que pour `passer.sh`.
  - **Lignes citées** : toutes exactes, à une près : le `sha` du squash est passé l. 361, l'appel `PUT` est l. 363.
  - **`A-4`** faisait écrire le commentaire par la boucle ; le ticket le fait écrire par le script qui a fusionné (Décision 6).
  - **Qui étiquette** : les filles posent `à-fusionner` elles-mêmes (`chaine-de-production.md:122`). « Le conducteur n'étiquette qu'une sous-PR de code à la fois » demande donc un geste du conducteur (Décision 7), à confirmer à la contre-relecture.
  - **Ordonnancement** : `chantier/SKILL.md` (§ 6) est touché par ce lot **et** par le lot 5, et `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` par chaque lot. Le lot 5 ne peut donc pas partir en même temps que celui-ci sans conflit sur ces fichiers.
