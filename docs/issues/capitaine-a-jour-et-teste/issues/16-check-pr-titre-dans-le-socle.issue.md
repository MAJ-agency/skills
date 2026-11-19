# Le check `pr-titre` entre dans le socle : l'auteur voit, dès l'ouverture, ce que le capitaine refusera, PR de réception comprise

Status: Fait — PR #130
Type: task
Modèle: opus — un check de CI qui doit juger exactement comme le capitaine (même lecture du diff, mêmes motifs, même reconnaissance d'une PR de réception) sans en recopier la règle, d'où une fonction de `revue-exigee.mjs` et une commande de `sujet.sh` à extraire de leurs appelants ; un workflow `pull_request` qui lit un titre et un corps écrits par l'auteur (injection) ; une erreur rend le check rouge à tort ou vert sur ce que le capitaine renverra.
Blocked by: 9, 11, 18 (`sujet.sh`, `github.sh` et `passer.sh` sont des fichiers chauds du 9 ; `sujet.sh` du 11 ; `revue-exigee.mjs` du 18, qui passe avant : `A-43`. Partir de `main` après leur fusion ; les lots 2 à 4 et 7, qui touchent aussi `github.sh` et `passer.sh`, s'ordonnent avec lui)
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/ci/pr-titre.yml`, `skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs`, `skills/chaine/fusionner/scripts/revue-exigee.mjs`, `skills/chaine/fusionner/scripts/revue-exigee.test.mjs`, `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, `skills/chaine/socle-chaine-de-production/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/sujet/references/CONTENU.md`, `scripts/poses.test.mjs`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../remontees-iroki.spec.md`](../remontees-iroki.spec.md), ticket 16 (points C12 et A6 pour sa voie de réception, décision `A-32` ; `A-34` pour la note). Source : [`../sources/2026-11-18-remontees-iroki.md`](../sources/2026-11-18-remontees-iroki.md), points 6 et 12. Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`A-17`, `A-18`). Base : `origin/main` à `4a45634` (plugin **7.15.0**, **738 tests**), puis les tickets 1, 8 et 9 fusionnés. Faits relus à la source le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Le constat.** Le capitaine refuse une PR à son passage pour son titre ou sa section de revue (`passer.sh:94-98`, `:185-188` ; `sujet.sh:712-737`), parfois après une heure de file. Le plugin n'a aucun check qui le montre à l'auteur avant : la CI du socle (`socle/ci/ci.yml`) ne joue que l'ordre des migrations et les messages de commit « comme le capitaine » (l. 35-44). Iroki a son check, `pr-titre` (`SPEC_ALL_SOC-4.38`, #528 ; repris par #628, `c1db1088`, `scripts/ci/pr-titre.mjs`, `.github/workflows/pr-titre.yml`), qui lit le diff comme son capitaine depuis #628, et qui reconnaît une PR de réception de `develop` dans un sujet par le nom de sa branche (`chore/<nom>-recoit-develop`, `SPEC_ALL_SOC-4.41`, #539, `pr-titre.mjs:16-20`, `:69-138`) : sans elle, la PR de réception échouait faute de section de revue (A6), parce que le diff `base...tête` compte tout le code apporté par `develop`. Ses scripts ont divergé et sa voie de réception lui est propre : le check se **réécrit** ici, sur les règles du plugin.

**Quand le ticket est fait** (`A-32`) :

1. Le socle pose un workflow `PR titre`, non exigé, lancé à l'ouverture, à chaque retouche du titre ou du corps et à chaque push d'une PR vers `develop` ou un sujet.
2. Il juge comme le capitaine, avec ses fonctions : la longueur du sujet du squash, commitlint pour une sous-PR, la section de revue sur les fichiers que le capitaine lirait, le titre de code sur un diff de documentation seule.
3. Une PR de mise à jour d'un sujet (la réception de `develop`) se reconnaît **à sa forme**, comme `sujet.sh fusionner` la reconnaît, et se juge sur la résolution et ses retouches, pas sur le `develop` apporté.
4. Le plugin prend une version, et `NOTES-DE-VERSION.md` dit ce qu'un projet pose.

## Où

`socle/` abrège `skills/chaine/socle-chaine-de-production/references/`, `fus/` abrège `skills/chaine/fusionner/scripts/`, `suj/` abrège `skills/chaine/sujet/scripts/`. Lignes relues sur `4a45634` ; les tickets 1 et 9 auront décalé celles de `passer.sh` et `sujet.sh`.

| Fichier | Lignes | Ce qu'on y fait |
| --- | --- | --- |
| `fus/revue-exigee.mjs` | 223-243, 253-264 | `motifsDuCapitaine({ corps, titre, fichiers, base })`, exportée : la liste des motifs que la CLI rend aujourd'hui (`motifSansRevue`, puis `motifTitreSansCode`). La CLI (l. 253-264) l'appelle et garde sa sortie (le premier motif, sortie 1). Aucune règle ne change. |
| `fus/revue-exigee.test.mjs` | fin | `motifsDuCapitaine` rend ce que rend la CLI, motif pour motif. |
| `suj/sujet.sh` | 719-737 (`fusionner`) | `fichiers_a_juger <n> <sommet> <base>` : la reconnaissance d'une PR de mise à jour (`est_mise_a_jour`, `verifier_mise_a_jour`) et la liste des fichiers jugés (`A_JUGER`, sinon le diff depuis le point de départ du sujet), extraites de `fusionner`, qui l'appelle. |
| `fus/passer.sh` | 109-164 (`livraison_intermediaire` et son appel) | La fonction passe dans `github.sh`, sans son `git fetch` (l. 119), qui reste dans `passer.sh` juste avant l'appel ; `passer.sh` l'appelle comme aujourd'hui, comportement inchangé (Décision 6). |
| `fus/github.sh` | après `index_regeneres_motifs_regex` | `livraison_intermediaire <nom> <sommet>` : la règle de `passer.sh:117-155`, sur les refs déjà là (`origin/develop`, `origin/sujet/<nom>`), sans fetch ni appel GitHub. |
| idem (`suj/sujet.sh`) | dispatch, en-tête | `est-livraison <tête> <sommet>` : commande de lecture ; 0 livraison prouvée (tête `sujet/<nom>` dont `origin/sujet/<nom>` existe, ou tête `livraison/<nom>-<AAAAMMJJ-HHMM>` que `livraison_intermediaire` reconnaît), 1 PR ordinaire, 11 lecture impossible (refs absentes). |
| idem | dispatch (l. 1266-1275), en-tête (l. 7-82) | `a-juger <sommet> <base> [<n>]` : commande de lecture, sans appel GitHub, qui écrit les fichiers que le capitaine jugerait, un par ligne, l'union d'`A_JUGER` et de `MAJ_APRES` pour une PR de mise à jour ; un refus de forme sort en 4 avec le motif de `verifier_mise_a_jour`. |
| `socle/scripts/github/pr-titre.mjs` | nouveau | Le check (Décision 2). |
| `socle/scripts/github/pr-titre.test.mjs` | nouveau | Les bancs (voir « Ordre de travail »). |
| `socle/ci/pr-titre.yml` | nouveau | Le workflow (Décision 3). |
| `skills/chaine/socle-chaine-de-production/SKILL.md` | 38 (4 ter), 40 (6) | 4 ter : `pr-titre.mjs` et son banc posés avec `codeowners*` dans `scripts/github/`. 6 : `references/ci/pr-titre.yml` → `.github/workflows/pr-titre.yml`, non exigé ; ne pas l'ajouter à la protection de `develop`. |
| `socle/CONTENU.md` | après 31 (§ « La CI ») | Un § `pr-titre` : ce qu'il juge, pourquoi il appelle les fonctions du capitaine au lieu de les recopier, pourquoi un workflow à part (`edited`). |
| `skills/chaine/sujet/references/CONTENU.md` | § `sujet.sh` | `a-juger`. |
| `scripts/poses.test.mjs` | 26-29 (`FICHIERS_POSES`) | `pr-titre.mjs` et `pr-titre.test.mjs` posés dans `scripts/github/`. |
| `scripts/depot.test.mjs` | fin | Le contrôle de texte du workflow (voir « Ordre de travail »). |
| Version | — | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md`. |

**Ce que les tickets 1, 8 et 9 auront changé** (à relire sur `main` avant de commencer) : dans `sujet.sh fusionner`, le ticket 1 lit l'ascendance avant les checks et attend la CI d'une sous-PR mise à jour ; la lecture de la revue (l. 719-737 sur `4a45634`) reste avant, inchangée ; le ticket 9 fait sortir `fusionner` en 5 sur une lecture GitHub refusée. Aucun ne touche `revue-exigee.mjs` (le ticket 1 l'écrit : « inchangés »). Le ticket 8 ne touche pas ces fichiers.

Appelants réels :

- `pr-titre.mjs` : le workflow `PR titre`, sur `pull_request` ; à la main, une session (variables d'environnement de la Décision 2).
- `motifsDuCapitaine` : la CLI de `revue-exigee.mjs` (appelée par `passer.sh:186` et `sujet.sh:726`), et `pr-titre.mjs`.
- `fichiers_a_juger` : `sujet.sh fusionner`, et `sujet.sh a-juger` (appelé par `pr-titre.mjs`).
- `livraison_intermediaire` : `passer.sh` (après son `git fetch` du sujet), et `sujet.sh est-livraison` (appelé par `pr-titre.mjs`).

Règles à lire : l'en-tête de `fus/revue-exigee.mjs` (l. 1-62) et ses motifs (l. 210-243) ; `suj/sujet.sh` l. 548-660 (PR de mise à jour) et 700-737 (`fusionner`) ; `fus/passer.sh` l. 89-98, 156-188 (titre, point de départ, livraison, revue).

## Décisions

Tenues (spec et programme) : `A-32` (le check entre dans `socle-chaine-de-production`, lit le diff comme le capitaine, voie de réception comprise ; les identifiants nus n'entrent pas dans ce chantier), `A-34`. Hors périmètre de `A-32`, gardé hors du plugin : la voie `chore/<nom>-recoit-develop` d'Iroki, reconnue par un nom de branche.

Précisions du ticket :

1. **Une seule règle, celle du capitaine.** Le check n'écrit aucune règle : il appelle `motifsDuCapitaine` et `lireBase` de `revue-exigee.mjs`, et `sujet.sh a-juger`. Le ticket 18 (`/security-review` vérifié) passe avant (`A-43`) : son motif (`motifSansSecurite`) est déjà dans la CLI de `revue-exigee.mjs` ; ce ticket le range dans `motifsDuCapitaine`, dans l'ordre de la CLI (section, ligne `/security-review`, titre), et le check le donne ainsi.
2. **`scripts/github/pr-titre.mjs`**, chemin sensible du gabarit (`scripts/github/**`), posé par le socle :
   - **entrées**, par l'environnement, jamais par le shell : `PR_TITRE`, `PR_NUMERO`, `PR_BASE` (`base.ref`), `PR_TETE` (`head.ref`), `PR_SOMMET` (`head.sha`), requises : une absente ou vide, sortie 2 ; `PR_CORPS`, facultative : un corps vide ou absent (`body` nul de GitHub) se lit `""`, jamais une variable manquante ;
   - **le sujet du squash** : `« <titre> (#<n>) »` en caractères, au plus 120 (`passer.sh:97-98`, `sujet.sh:714-715`) ;
   - **commitlint**, pour une PR vers `sujet/*` seulement, comme `sujet.sh:717-718` (`pnpm exec commitlint` sur le sujet du squash). Une PR vers `develop` n'y passe pas : `passer.sh` ne le juge pas, et le check ne refuse pas plus que le capitaine ;
   - **les fichiers jugés** :
     - tête `sujet/<nom>` ou `livraison/…` vers `develop` : `bash <sujet.sh> est-livraison <tête> <sommet>`. Sortie 0 : section de revue non exigée, et la sortie le dit (« livraison de sujet prouvée : chaque sous-PR a passé la revue », `passer.sh:184`). Sortie 1 : **une PR ordinaire**, jugée par le cas général ci-dessous, section exigée comme au passage du capitaine (`passer.sh:163`) ; jamais une dispense sur le seul nom de la branche. Sortie 11 : le check échoue en le disant ;
     - base `sujet/<nom>` : `bash <sujet.sh> a-juger <sommet> sujet/<nom> <n>` ; une sortie 4 donne le motif de `sujet.sh` (refus de forme d'une PR de réception) ; tout autre code non nul : le check échoue en disant que la lecture a échoué, jamais un vert ;
     - sinon : `git -c core.quotePath=false diff --no-renames --name-only $(git merge-base <sommet> origin/<base>) <sommet>`, comme `passer.sh:168`, `:186` ;
   - **la base lue** : `lireBase('origin/<base>')`, comme la CLI (`passer.sh:186` passe `origin/develop`, `sujet.sh:726` `origin/<base>`) ;
   - **les motifs** : ceux du titre, puis `motifsDuCapitaine`, chacun sur une ligne `✗ <motif>` de la sortie d'erreur ; sortie 1 s'il y en a un, sinon 0 et « Titre et description conformes : le capitaine les acceptera. » ;
   - **`sujet.sh` et `revue-exigee.mjs`** se trouvent par deux chemins de profondeurs différentes : dans un projet, `../chaine/<outil>` depuis `scripts/github/` ; dans le plugin, `../../../../<skill>/scripts/<outil>` depuis `skills/chaine/socle-chaine-de-production/references/scripts/github/` (`fusionner` pour `revue-exigee.mjs`, `sujet` pour `sujet.sh`). **En CI** (`GITHUB_ACTIONS=true`), seul le chemin du projet vaut : outil absent, le check est rouge et dit lequel manque et comment le poser (`/maj-skills:fusionner poser`, `/maj-skills:sujet poser`), sans repli vers le plugin.
3. **`.github/workflows/pr-titre.yml`**, un workflow à part : `edited` dans `ci.yml` relancerait toute la CI à chaque retouche de la description (raison d'Iroki, `.github/workflows/pr-titre.yml:4` d'`origin/develop`) :
   - `on: pull_request`, `branches: ['develop', 'sujet/**']`, `types: [opened, edited, reopened, ready_for_review, synchronize]` ; jamais `pull_request_target` ;
   - `permissions: contents: read` ; `concurrency` par PR, `cancel-in-progress: true` ; job sauté sur un brouillon ;
   - `actions/checkout` avec `fetch-depth: 0` et `persist-credentials: false`, `pnpm/action-setup`, `actions/setup-node`, `pnpm install --frozen-lockfile` : actions épinglées par sha, les mêmes que `ci.yml:25-30` ;
   - `run: node scripts/github/pr-titre.mjs`, les valeurs de l'événement par `env:` (`github.event.pull_request.title`, `.body`, `.number`, `.base.ref`, `.head.ref`, `.head.sha`), jamais dans `run:` ; le job `zizmor` de `ci.yml` l'audite ;
   - non exigé par la protection de `develop` : le capitaine reste le juge ; le check montre seulement son refus plus tôt.
4. **`livraison_intermediaire` partagée** (`A-43`) : le check ne dispense une tête `livraison/*` que sur la preuve du capitaine (un ancêtre commun de la tête et du sujet, hors de `develop`, dont la fusion avec le `develop` de la tête donne l'arbre de la tête aux index générés près, `passer.sh:109-116`), lue par la même fonction. Le déplacement ne change rien à `passer.sh` : ses bancs de livraison intermédiaire (`fusionner.test.mjs`) restent verts sans retouche.
5. **`fichiers_a_juger` et `a-juger`** : l'extraction ne change pas ce que juge `fusionner` (les bancs de `sujet-fusionner.test.mjs` restent verts sans retouche). `a-juger` n'appelle ni `gh` ni le réseau ; il suppose les refs `origin/develop` et `origin/<base>` présentes (le `checkout` à `fetch-depth: 0` les rapatrie) et le dit s'il ne les trouve pas (sortie 11, « refs absentes : fetch d'abord »). Pour une PR de mise à jour, la liste est l'union de la résolution (`A_JUGER`) et des fichiers de chaque retouche (`MAJ_APRES`) : le capitaine juge les deux, avant et après les checks, et le check doit exiger la même section.
6. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : la forme interne de `pr-titre.mjs`, le nom de la fonction extraite de `sujet.sh`, le découpage des bancs. Elle ne tranche **pas** : le check non exigé, l'absence de règle recopiée, la reconnaissance d'une PR de réception et d'une livraison intermédiaire par leur forme, l'absence de repli vers le plugin en CI, la lecture du diff comme `passer.sh`, `commitlint` réservé aux sous-PR, le workflow à part.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`, tickets 1, 8 et 9 fusionnés. Chaque banc est vu rouge avant le code qui le rend vert. Commits sous les hooks, jamais `--no-verify`.

### 1. Les extractions, sans changement de comportement

`motifsDuCapitaine` (test : la même sortie que la CLI sur les cas existants de `revue-exigee.test.mjs`), puis `fichiers_a_juger` dans `sujet.sh`, puis `livraison_intermediaire` de `passer.sh` vers `github.sh`. `pnpm test` complet : tout reste vert.

### 2. Les bancs, chacun vu rouge

Dans `socle/scripts/github/pr-titre.test.mjs`, sur le dépôt jouet du skill `sujet` (`depot-jouet.mjs` : `../chaine/depot-jouet.mjs` dans un projet, `../../../../sujet/scripts/depot-jouet.mjs` dans le plugin, sur le modèle de `garde-commandes.test.mjs:13-16`), avec son faux `pnpm` (l. 125-128 de `depot-jouet.mjs`) qu'un banc fait refuser. Titres à garder tels quels :

1. « PR vers develop : du code sans section de revue est refusé avec le motif exact du capitaine ; avec la section, conforme ; de la documentation seule, conforme » — le motif est, au caractère près, celui que la CLI de `revue-exigee.mjs` écrit pour la même PR.
2. « sujet du squash à plus de 120 caractères : refusé ; titre de code sur un diff de documentation seule : refusé ».
3. « sous-PR : titre refusé par commitlint, refusé ; PR vers develop : commitlint n'est pas joué ».
4. « PR de réception sans conflit de code ni retouche de code : conforme sans section de revue » — la PR de mise à jour de `sujet-fusionner.test.mjs` (fusion de `develop` qui apporte `apps/`, conflit sur un index généré seul). C'est le cas A6 d'Iroki.
5. « PR de réception avec une retouche de formatage sous apps/ : refusée sans section de revue, conforme avec » — même cas que la retouche de `sujet-fusionner.test.mjs` (ticket 40 de l'ancien chantier).
6. « PR de réception en deux fusions : refusée avec le motif de sujet.sh ».
7. « livraison de sujet (tête sujet/<nom>) : section non exigée, et la sortie le dit ».
7 bis. « branche livraison/ qui n'apporte pas un sommet du sujet : section exigée » — tête `livraison/lot-20261118-1200` qui porte un `apps/x.ts` absent du sujet, sans section : refusée avec le motif du capitaine ; une vraie livraison intermédiaire (un sommet du sujet fusionné avec `develop`) : section non exigée. Mêmes fixtures que les bancs de livraison intermédiaire de `fusionner.test.mjs`, que `passer.sh` juge de même.
8. « une variable d'entrée manque : sortie 2 ; un corps vide n'en est pas une ; refs absentes pour a-juger : échec dit, jamais conforme ; en CI, un outil absent du projet : rouge, sans repli vers le plugin ».

Dans `fus/sujet-fusionner.test.mjs` :

9. « sujet.sh a-juger écrit les fichiers que fusionner juge : résolution et retouches d'une PR de mise à jour, diff depuis le départ du sujet sinon ; un refus de forme sort en 4 ».

Dans `scripts/depot.test.mjs` :

10. « le workflow pr-titre du socle : pull_request vers develop et sujet/**, types avec edited, permissions en lecture, actions épinglées, valeurs de l'événement par env et jamais dans run, jamais pull_request_target ».

Tous **rouges sur `main`** : ni le script, ni le workflow, ni `a-juger` n'existent.

### 3. Le code et les textes

`pr-titre.mjs`, `pr-titre.yml`, `a-juger` (dispatch et en-tête de `sujet.sh`), `FICHIERS_POSES`. Puis `socle-chaine-de-production/SKILL.md`, `socle/CONTENU.md`, `sujet/references/CONTENU.md`. `bash -n` sur `sujet.sh`.

### 4. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici un gabarit ajouté (un workflow et son script) : une mineure. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  Le socle de la chaîne pose un check `PR titre` (`.github/workflows/pr-titre.yml`, `scripts/github/pr-titre.mjs`), non exigé : à l'ouverture d'une PR vers `develop` ou un sujet, à chaque retouche de son titre ou de son corps et à chaque push, il montre ce que le capitaine refusera (sujet du squash trop long, commitlint pour une sous-PR, section de revue absente, titre de code sur de la documentation seule). Il juge avec les fonctions du capitaine (`revue-exigee.mjs`, `sujet.sh a-juger`) : une PR de réception de `develop` dans un sujet se reconnaît à sa forme et se juge sur sa résolution et ses retouches.

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
  2. Dans une PR du projet : `/maj-skills:fusionner poser` et `/maj-skills:sujet poser` (`revue-exigee.mjs`, `sujet.sh` et leurs bancs), puis, de `/maj-skills:socle-chaine-de-production`, les étapes 4 ter (`scripts/github/pr-titre.mjs` et son banc) et 6 (`.github/workflows/pr-titre.yml`). `.github/workflows/**` et `scripts/github/**` sont des chemins sensibles : contre-revue et `/security-review`. Aucune clé de contrat.
  3. Ne pas ajouter `PR titre` aux checks exigés de `develop` : le capitaine reste le juge.

  **Iroki**, hors du plugin : son `scripts/ci/pr-titre.mjs` et son `.github/workflows/pr-titre.yml` (#628, et sa voie de réception, #539) sont à remplacer par ceux du socle ; sa voie `chore/<nom>-recoit-develop`, reconnue par le nom de branche, n'existe pas dans le plugin, qui reconnaît une PR de réception à sa forme (une seule fusion de `develop`, son premier commit, puis des retouches). Ses PR de réception qui n'ont pas cette forme seront refusées par le check comme par le capitaine du plugin.
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| `motifsDuCapitaine` = la CLI | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs`, test ajouté |
| Revue exigée vers `develop`, motif exact | `skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs` « PR vers develop : du code sans section de revue est refusé avec le motif exact du capitaine ; avec la section, conforme ; de la documentation seule, conforme » |
| Titre : longueur, code sur documentation | idem, « sujet du squash à plus de 120 caractères : refusé ; titre de code sur un diff de documentation seule : refusé » |
| commitlint réservé aux sous-PR | idem, « sous-PR : titre refusé par commitlint, refusé ; PR vers develop : commitlint n'est pas joué » |
| Réception sans retouche de code | idem, « PR de réception sans conflit de code ni retouche de code : conforme sans section de revue » |
| Réception avec retouche de code | idem, « PR de réception avec une retouche de formatage sous apps/ : refusée sans section de revue, conforme avec » |
| Réception de mauvaise forme | idem, « PR de réception en deux fusions : refusée avec le motif de sujet.sh » |
| Livraison de sujet | idem, « livraison de sujet (tête sujet/<nom>) : section non exigée, et la sortie le dit » |
| Livraison intermédiaire prouvée par sa forme | idem, « branche livraison/ qui n'apporte pas un sommet du sujet : section exigée » |
| Entrées et lecture en échec | idem, « une variable d'entrée manque : sortie 2 ; un corps vide n'en est pas une ; refs absentes pour a-juger : échec dit, jamais conforme ; en CI, un outil absent du projet : rouge, sans repli vers le plugin » |
| `a-juger` = ce que juge `fusionner` | `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, banc 9 |
| Le workflow | `scripts/depot.test.mjs`, banc 10 |
| Scripts posés dans un projet | `scripts/poses.test.mjs` (`FICHIERS_POSES`) |

## Vérification

1. Ciblée : `node --test skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs skills/chaine/fusionner/scripts/revue-exigee.test.mjs skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs scripts/depot.test.mjs scripts/poses.test.mjs` ; `bash -n skills/chaine/sujet/scripts/sujet.sh` ; `zizmor` sur `pr-titre.yml` s'il est installé (sinon le dire dans la PR).
2. `pnpm test` complet : le nombre de `main` au départ, plus les tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli.
3. **Mutations**, jouées sur une copie jetable, vues rouges, puis annulées, listées dans la PR : le check lit `base...tête` au lieu d'`a-juger` sur une sous-PR (banc 4) ; une tête `livraison/*` dispensée sur son nom (banc 7 bis) ; `a-juger` oublie `MAJ_APRES` (banc 5) ; commitlint joué sur une PR vers `develop` (banc 3) ; une sortie non nulle d'`a-juger` lue comme une liste vide (banc 8).
4. `graphify update .`
5. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR. Puis `/security-review`, obligatoire : un workflow qui lit un titre et un corps écrits par l'auteur, et des chemins sensibles du gabarit (`.github/workflows/**`, `scripts/github/**`, `scripts/chaine/**`) ; son rendu va dans une section `## Sécurité`.
6. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `feat(chaine): le check pr-titre montre dès l'ouverture ce que le capitaine refusera (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- Les identifiants nus (C11) : un ticket à part pour le skill `anchorpost` (`A-32`).
- La documentation de la réception dans `sujet/SKILL.md` et la recette du refus : ticket 11.
- La ligne `/security-review` vérifiée : ticket 18 (Décision 1 pour l'ordre).
- La voie `chore/<nom>-recoit-develop` d'Iroki.
- La repose dans les projets : chacun la fait d'après la note de version.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, après relecture de `revue-exigee.mjs`, `passer.sh`, `sujet.sh`, `chemins-sensibles.mjs`, de la CI et du `SKILL.md` du socle sur `4a45634`, et du check d'Iroki (`c1db1088`, `scripts/ci/pr-titre.mjs`, `.github/workflows/pr-titre.yml` d'`origin/develop`). Écarts avec la spec et choix à confirmer :
  - **Workflow à part, pas `socle/ci/ci.yml`** (fichier chaud de la spec) : `edited` dans `ci.yml` relancerait toute la CI à chaque retouche de la description. `ci.yml` ne change pas ; son job `zizmor` audite le nouveau.
  - **`sujet.sh` est un fichier chaud de plus** : reconnaître une PR de réception « comme le capitaine » sans recopier `est_mise_a_jour` et `verifier_mise_a_jour` demande que le check les appelle. Une copie Node divergerait, comme celle d'Iroki (par nom de branche). Fichier partagé avec le ticket 11, tous deux après le 9 : l'architecte les ordonne.
  - **Le script dans `scripts/github/`** et non `scripts/ci/` comme chez Iroki : `scripts/github/**` est déjà un chemin sensible du gabarit et un dossier que le socle pose ; Iroki a dû ajouter `scripts/ci/**` à ses chemins sensibles (#628).
  - **commitlint réservé aux sous-PR** : le check d'Iroki le joue sur toute PR ; le capitaine du plugin ne le juge que dans `sujet.sh fusionner`. Un check plus strict que le capitaine serait rouge sur une PR qui passe.
- 2026-11-18 — Repris après relecture (« pas prêt », un bloquant ; `A-43`) : une tête `livraison/*` ne se dispense plus sur son nom ; `livraison_intermediaire` passe de `passer.sh` à `github.sh`, et `sujet.sh est-livraison` la lit pour le check (banc 7 bis) ; `PR_CORPS` facultative ; outils cherchés aux deux profondeurs, sans repli vers le plugin en CI ; dépôt jouet du banc en `../chaine/depot-jouet.mjs` dans un projet ; bloqué par 9, 11 et 18.
- 2026-11-19 — Livré dans la PR #130 (plugin **7.28.0**). Les choix laissés à la fille par la Décision 6, chacun tranché par défaut prudent :
  - **La forme de `pr-titre.mjs`** : un script en ligne de commande sans export. Il a quatre codes de sortie : 0 conforme, 1 motifs (chacun en `✗ <motif>` sur la sortie d'erreur), 2 entrée absente ou mal formée, **3 lecture impossible**. Le code 3 couvre un outil absent, des refs absentes, et un git ou un outil en échec. Le ticket ne fixait pas ce code : il se distingue d'un refus et ne vaut jamais un vert. `PR_NUMERO`, `PR_SOMMET`, `PR_BASE` et `PR_TETE` sont validés avant d'atteindre git : un numéro, un sha en hexadécimal, un nom de branche sans `-` initial, sans blanc ni caractère de contrôle, sans `..`. `motifsDuCapitaine` rend **tous** les motifs, dans l'ordre de la CLI : une PR sans section qui touche un chemin sensible voit donc aussi le motif de la ligne `/security-review`. La CLI n'en rend que le premier, comme avant.
  - **Le nom de la fonction extraite de `sujet.sh`** : `fichiers_a_juger <n> <sommet> <base>`. Elle pose `FICHIERS_JUGES` et `MAJ`, et `fusionner` l'appelle à la place de son bloc. Les deux lectures sont `a_juger` et `est_livraison`, dispatchées en `a-juger` et `est-livraison`.
  - **Le découpage des bancs** : les bancs 1 à 8 sont dans `pr-titre.test.mjs`, avec les titres du ticket. Les fixtures de réception et de livraison y sont réécrites sur le modèle de `miseAJour` (`sujet-fusionner.test.mjs`) et de `livraison` (`fusionner.test.mjs`), car ces fichiers de test n'exportent rien. Le banc 9 est à la fin de `sujet-fusionner.test.mjs`, le banc 10 à la fin de `scripts/depot.test.mjs`. Le test de `motifsDuCapitaine` est à la fin de `revue-exigee.test.mjs`.
  - **Clone superficiel** : `a-juger` et `est-livraison` sortent en 11, au lieu de jouer `git fetch --unshallow` comme les autres commandes de `sujet.sh`. Ils ne doivent appeler ni le réseau ni `gh` (Décision 5), et un merge-base lu sur un clone superficiel serait faux.
  - **`est-livraison`, refs absentes** : une tête `sujet/<nom>` dont `origin/sujet/<nom>` manque sort en 11. La tête d'une PR existe sur le distant : son absence locale veut dire un fetch manquant. Une tête `livraison/<nom>-…` dont le sujet manque sort en 1 (PR ordinaire), comme `passer.sh` quand son fetch du sujet échoue.
  - **`livraison_intermediaire <nom> <sommet>`** (mineure de la relecture) : elle calcule elle-même la liste des index générés par `index_generes_regex`. Une liste illisible rend 1, jamais une dispense. Elle vérifie que `origin/sujet/<nom>` et le sommet sont là, sans fetch. `passer.sh` garde son `git fetch` du sujet juste avant l'appel.
  - **`skills/chaine/fusionner/references/CONTENU.md`**, hors de la table « Où » : il décrit `github.sh` et `revue-exigee.mjs`. La fonction déplacée dans l'un et la fonction exportée de l'autre y sont nommées en une phrase chacune, sinon la documentation du skill ne dirait plus où vit la règle de livraison.
  - **Limite notée** : le `checkout` d'un `pull_request` lit l'arbre de la PR, son `scripts/chaine/` compris. Une PR qui modifie ces scripts se juge donc avec sa propre version. Cela reste acceptable : le check n'est pas exigé, le capitaine rejoue ses règles depuis sa propre copie, et ces chemins sont sensibles (contre-revue). La limite est écrite dans `socle-chaine-de-production/references/CONTENU.md`.
- 2026-11-19 — La contre-relecture de l'architecte (sommet `6d763dc`) rend la PR conforme, avec deux mineures de parité, corrigées chacune avec un banc vu rouge avant :
  - **A** : le capitaine juge la résolution d'une PR de mise à jour seule, avant les checks, puis l'union avec les retouches. `a-juger` rend maintenant les deux listes, séparées par une ligne vide (git n'écrit jamais un chemin vide), et le check appelle `motifsDuCapitaine` sur chacune, dans cet ordre, sans doublon. Banc : une réception titrée `fix(sujet): …`, dont la résolution ne touche que `docs/`, avec une retouche sous `apps/` et une section de revue, est refusée pour son titre de code.
  - **B** : `est-livraison` exige que le sommet d'une tête `sujet/<nom>` soit celui d'`origin/sujet/<nom>` ; sinon, sortie 1 (PR ordinaire). Banc : dans le banc 7, un sommet étranger sous `sujet/lot`.
  - **Cosmétique** : sur un clone superficiel, le check le dit en ces termes (sortie 3), au lieu de « refs absentes ». Banc : ajouté au banc 8.
