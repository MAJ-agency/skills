# `next-id` lit develop, tous les sujets et les PR ouvertes après un fetch, et numérote aussi les tickets d'une spec

Status: Fait — PR #123
Type: défaut
Modèle: sonnet — un script de numérotation à étendre sur le module de lecture des PR ouvertes du ticket 6 (`pr-ouvertes.mjs`), un mode de plus sur la grammaire existante (`fichiersDeLaSpec`), et des bancs sur le dépôt jouet du script ; aucune conception au-delà de ce que le ticket tranche.
Blocked by: 6, 13 (le module `pr-ouvertes.mjs`, `A-14`, que ce ticket réutilise ; l'environnement de banc de `next-id.test.mjs`, que le 13 pose : `A-43`)
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/monorepo/socle-monorepo/references/scripts/docs/next-id.mjs`, `skills/monorepo/socle-monorepo/references/scripts/docs/next-id-branches.mjs`, `skills/monorepo/socle-monorepo/references/scripts/docs/next-id.test.mjs`, `skills/monorepo/socle-monorepo/references/TABLE-RACINE.md`, `skills/chaine/tickets/SKILL.md`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../remontees-iroki.spec.md`](../remontees-iroki.spec.md), ticket 14 (point C14, décision `A-26` ; `A-34` pour la note). Source : [`../sources/2026-11-18-remontees-iroki.md`](../sources/2026-11-18-remontees-iroki.md), point 14. Spec du chantier 1 : [`../capitaine-a-jour-et-teste.spec.md`](../capitaine-a-jour-et-teste.spec.md), lot 6 (`A-14`). Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`A-17`, `A-18`). Base : `origin/main` à `4a45634` (plugin **7.15.0**, **738 tests** ; `next-id.test.mjs` 7 tests), puis le ticket 6 fusionné. Faits relus à la source le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Le défaut vécu chez Iroki.** Deux sessions de deux comptes ont créé en même temps deux `SPEC_ALL_SOC-4.78` et deux `ADR_ALL_ARC-18`. `next-id.mjs` relève le plus grand numéro dans l'arbre de travail et sur `origin/sujet/*` et `origin/docs/*` (`next-id-branches.mjs:13-37`), **sans `fetch`** (il le dit, `next-id.mjs:54-56`), **sans `origin/develop`** (une spec entrée dans develop après le dernier `pull` de la session n'est pas vue), et **sans les PR ouvertes** (une spec poussée sur `feat/…` n'est vue de personne). Et **aucun outil ne numérote un ticket `.NN`** : la session choisit l'index à la main, d'où les deux `SOC-4.78`.

**Quand le ticket est fait** (`A-26`) :

1. `next-id` fait un `fetch` de `develop`, des `sujet/*` et des `docs/*`, puis lit l'arbre de travail, `origin/develop`, tous les `origin/sujet/*`, les `origin/docs/*` et les fichiers des PR ouvertes.
2. La lecture des PR ouvertes est celle de `ticket-libre.mjs` (`A-14`, ticket 6) : un seul module, partagé.
3. `next-id <SPEC>` (un identifiant de spec, `SPEC_ALL_SOC-4`) rend le prochain index de ticket libre, sur deux chiffres, lu aux mêmes sources.
4. Sans `gh` utilisable, le numéro sort quand même, sortie 0, et la sortie d'erreur dit que les PR ouvertes n'ont pas été lues et comment les lire par l'outil GitHub MCP.
5. Le plugin prend une version, et `NOTES-DE-VERSION.md` dit ce qu'un projet repose.

## Où

`sm/` abrège `skills/monorepo/socle-monorepo/references/scripts/docs/`, `tk/` abrège `skills/chaine/tickets/references/scripts/docs/`. Lignes relues sur `4a45634`.

| Fichier | Lignes | Ce qu'on y fait |
| --- | --- | --- |
| `sm/next-id-branches.mjs` | 1-38 | `plusGrandSurBranches` lit aussi `refs/remotes/origin/develop` (en plus de `sujet/*` et `docs/*`). Le `fetch` n'y entre pas : la fonction garde son `git` injecté et reste pure de réseau ; l'en-tête dit qui fait le fetch. |
| `sm/next-id.mjs` | 1-16 (en-tête) | Les sources, le fetch, le mode ticket, la sortie sans `gh`. |
| idem | 22-28 (arguments) | Deux formes : `<TYPE> <CTX> <TRI>` (aujourd'hui) ; un seul argument qui est une spec (`lireIdentifiant`, `estSpec` de `identifiants.mjs:52-72`) → mode ticket. Toute autre forme : sortie 2, l'usage aux deux formes. |
| idem | avant 51 | Le fetch (Décision 1), joué dans `PROJET_RACINE` (`cwd`), puis les lectures. |
| idem | 51-56 | Les fichiers des PR ouvertes comptent comme les autres sources ; le message de la l. 54-56 devient celui de la Décision 4 (ou rien, quand tout a été lu). |
| `sm/pr-ouvertes.mjs` | (ticket 6) | **Inchangé** : `next-id.mjs` l'importe (`import { lirePrOuvertes } from './pr-ouvertes.mjs'`), à côté d'`identifiants.mjs`. |
| `sm/next-id.test.mjs` | modèle l. 9-66 (`depotJouet`), 89-106 | Les bancs (voir « Ordre de travail ») ; un faux `gh` écrit dans le banc (le socle pose ce banc sans la chaîne, donc sans `faux-gh.mjs`, l. 10-11). |
| `skills/monorepo/socle-monorepo/references/TABLE-RACINE.md` | 14 | La numérotation : `next-id.mjs` rend aussi le prochain index d'un ticket (`node scripts/docs/next-id.mjs SPEC_ALL_SOC-4`), lu après un fetch (`pr-ouvertes.mjs` y est nommé par le ticket 6). |
| `skills/chaine/tickets/SKILL.md` | 15, 61 | l. 15 : `next-id.mjs` numérote aussi les tickets. l. 61 : « Numéroter » : la forme ticket (`node scripts/docs/next-id.mjs SPEC_ALL_SOC-4` → `79`), les sources lues après un fetch, la consigne de réserver aussitôt (branche et PR brouillon) ; plus de « `git fetch origin` d'abord ». |
| Version | — | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md`. |

**Ce que le ticket 6 aura changé** (à relire sur `main` avant de commencer ; [`6-ticket-libre-lit-les-fichiers-des-pr-ouvertes.issue.md`](6-ticket-libre-lit-les-fichiers-des-pr-ouvertes.issue.md), Décisions 1 et 3) : un module `sm/pr-ouvertes.mjs`, posé par `socle-monorepo` dans `scripts/docs/`, avec `lirePrOuvertes({ gh = ghReel, fichiers = true } = {})`, qui rend `{ verifiees: true, prs: [{ numero, tete, brouillon, titre, fichiers: [{ chemin, ancien, statut }] }] }`, ou `{ verifiees: false }` si `gh` manque ou échoue à un appel quelconque, jamais une liste partielle, et rien sur la console ; `ticket-libre.mjs` l'importe ; `tk/depot-jouet.mjs` le copie (`DU_SOCLE`) ; `TABLE-RACINE.md:14` le nomme. Un fichier de PR compte quand son statut est `added`, `modified`, `renamed`, `copied` ou `changed` ; un `removed`, ou l'ancien chemin d'un renommage, ne compte pas.

**Ce que le ticket 13 aura changé** (à relire sur `main` avant de commencer ; [`13-un-seul-environnement-de-banc.issue.md`](13-un-seul-environnement-de-banc.issue.md)) : un module `sm/environnement-de-banc.mjs`, avec `environnementDeBanc(base = process.env)` (une copie sans `GIT_*`, sans `FORCE_COLOR` ni `NODE_TEST_CONTEXT`, sans les variables de la chaîne, avec `NO_COLOR=1`) ; `next-id.test.mjs` l'importe (`./environnement-de-banc.mjs`) au lieu de son filtre recopié (l. 9-20 sur `4a45634`), et le test « le numéro sort nu » (l. 117-125) s'y appuie. Le second clone et le faux `gh` de ce ticket partent de cet environnement, `PATH` réduit compris.

Appelants réels :

- `next-id.mjs` : les sessions (skill `tickets`, l. 61) ; `migrer-tickets.mjs:82`, par `execFileSync` (une sortie non nulle y lève : la sortie reste 0 sans `gh`) ; le message du gate `tickets` (`tickets.mjs:131`) le cite.
- `lirePrOuvertes` : `ticket-libre.mjs` (ticket 6) et `next-id.mjs`.

Aucune CLI nouvelle (une forme d'argument de plus). `scripts/points-d-entree.test.mjs` ne change pas.

Règles à lire : `tickets/SKILL.md` (l. 15-30 : la grammaire, le fichier d'un ticket) ; `sm/identifiants.mjs:1-60` et `:170-184` (`fichiersDeLaSpec`, `fichierDuTicket`).

## Décisions

Tenues (spec et programme) : `A-26` (fetch, `origin/develop`, tous les `origin/sujet/*`, fichiers des PR ouvertes, lecture mutualisée avec `ticket-libre.mjs`, numérotation des tickets `.NN`), `A-14` (la lecture des PR ouvertes de `ticket-libre.mjs`), `A-41` (module des PR ouvertes dans `socle-monorepo`), `A-34`.

Précisions du ticket :

1. **Le fetch** : `git fetch -q --prune origin [develop] '+refs/heads/sujet/*:refs/remotes/origin/sujet/*' '+refs/heads/docs/*:refs/remotes/origin/docs/*'`, depuis `PROJET_RACINE`. `develop` n'est nommé que s'il existe sur le distant (`git ls-remote --exit-code --heads origin develop`) : un dépôt sans `develop` (posé par le socle avant la chaîne, ou ce dépôt-ci) ferait échouer tout le fetch sur une ref absente ; `origin/develop` absent n'est alors pas lu, sans message d'erreur. L'élagage ne vise que ces refspecs (comme `sujet.sh carte`, ticket 11) : un sujet supprimé ne garde pas un numéro « pris » à tort, et rien d'autre n'est élagué. En échec : les refs locales sont lues, et la sortie d'erreur le dit (« fetch impossible : copies locales lues »). Le numéro sort quand même.
2. **Le module des PR ouvertes est celui du ticket 6, inchangé** : `lirePrOuvertes()` (avec ses fichiers), dans `sm/`, à côté de `next-id.mjs` (`A-41` : `next-id.mjs` est posé par le socle seul, avant et sans le skill `tickets`). Ce ticket ne le modifie pas ; un besoin de plus se note sous `## Comments` et se porte au module, avec son test (`sm/pr-ouvertes.test.mjs`).
3. **Ce que `next-id` en lit** : pour chaque PR ouverte, brouillons compris, le `chemin` de chaque fichier dont le `statut` est `added`, `modified`, `renamed`, `copied` ou `changed` (la règle du ticket 6, Décision 3), jamais l'`ancien`. Le nom de fichier se lit par la même fonction que pour l'arbre (`numeroDe`, ou la forme ticket). `{ verifiees: false }` : la Décision 4.
4. **Sans `gh`** : sortie 0, le numéro sur la sortie standard (calculé sur les sources git), et sur la sortie d'erreur :

   > `PR ouvertes non lues (gh indisponible) : une PR ouverte peut déjà porter ce numéro. Par l'outil GitHub MCP : list_pull_requests (state open), puis pull_request_read get_files pour chacune ; prendre le suivant d'un numéro qu'un de leurs fichiers porte. Réserver aussitôt (branche et PR brouillon).`
5. **Le mode ticket**, `next-id <SPEC>` :
   - les fichiers qui comptent : ceux dont le **nom de base** (`chemin.split('/').pop()`) se lit par `identifiantDuTicket` (`identifiants.mjs:86-89`, `SPEC_ALL_SOC-4-x.03.issue.md` → `SPEC_ALL_SOC-4.03`), puis par `lireTicket` (`:61-66`), dont la spec est celle demandée ; jamais par `fichiersDeLaSpec`, qui exige un `/` devant le nom et ne lit donc pas un nom de base. Archive comprise (`issues/archive/` : un index archivé reste pris), aux mêmes sources que le mode spec ;
   - la sortie : le plus grand `NN` trouvé, plus un, sur deux chiffres (`01` quand la spec n'a pas encore de ticket) ;
   - au-delà de `99` (la grammaire `TICKET`, `identifiants.mjs:37`, n'a que deux chiffres) : sortie 2, « plus d'index libre dans <SPEC> : découper une nouvelle spec » ;
   - une spec introuvable à toutes les sources n'est pas une erreur : `01`.
6. **La fenêtre qui reste** : deux sessions qui lancent `next-id` dans la même minute, avant que l'une ait poussé sa PR brouillon, prennent encore le même numéro. Le ticket ne la ferme pas ; la consigne de réserver aussitôt (Décision 4, `tickets/SKILL.md:61`) la réduit. Le gate `tickets` refuse une **spec** portée par deux fichiers (`tickets.mjs:127-131`), mais pas deux tickets `.NN` d'une même spec : `identifiantsEnDouble` (`tickets-regles.mjs:186-198`) range les tickets sous le numéro de leur spec. Deux `.NN` en double se heurtent au mieux en conflit add/add, quand ils portent le même nom de fichier ; sous deux slugs, rien ne les arrête.
7. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : la forme interne du module et de son appel, le découpage des bancs, le texte de l'usage. Elle ne tranche **pas** : les sources lues, la place du module dans le socle, la sortie 0 sans `gh`, les deux chiffres et l'archive comptée.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`, ticket 6 fusionné. Chaque banc est vu rouge avant le code qui le rend vert. Commits sous les hooks, jamais `--no-verify`.

### 1. Le banc : un second clone et un faux `gh`

Dans `sm/next-id.test.mjs`, `depotJouet` gagne un second clone du même dépôt nu (l'autre session) et un faux `gh` dans `bin` : un petit script qui répond aux deux appels de `lirePrOuvertes` (`api --paginate 'repos/{owner}/{repo}/pulls?state=open&per_page=100' --jq …` et `api --paginate 'repos/{owner}/{repo}/pulls/<n>/files?per_page=100' --jq …`, sorties TSV déjà filtrées) depuis un fichier du banc, et sort en 1 quand ce fichier manque (gh indisponible). Sans `faux-gh.mjs` du skill `sujet` : le socle pose ce banc sans la chaîne. Les tests de `lirePrOuvertes` elle-même restent ceux du ticket 6.

### 2. Les bancs, chacun vu rouge

Titres à garder tels quels :

1. « une spec entrée dans develop après la dernière lecture compte : next-id fait un fetch et lit origin/develop » — le jeu de données part d'une seule spec, `SPEC_ALL_SOC-2-x.spec.md`, dans l'arbre et sur `develop` ; l'autre clone pousse `SPEC_ALL_SOC-3-y.spec.md` sur `develop` ; le clone de travail, en retard, rend `4`. **Rouge sur `main`** : `3`.
2. « un sujet ouvert par une autre session après la dernière lecture compte » — l'autre clone pousse une spec sur `sujet/y`. **Rouge sur `main`**.
3. « une spec que seule une PR ouverte ajoute compte » — le faux `gh` liste une PR dont les fichiers portent `docs/features/x/all/SPEC_ALL_SOC-5-x.spec.md` ; rend `6`. **Rouge sur `main`**.
4. « gh indisponible : le numéro sort, sortie 0, et la sortie d'erreur dit comment lire les PR ouvertes par l'outil GitHub MCP ». **Rouge sur `main`** (aucune ligne).
5. « tickets : next-id SPEC_ALL_SOC-4 rend le prochain index sur deux chiffres, lu dans l'arbre, develop, les sujets, les PR ouvertes et l'archive » — un `.03` dans l'arbre, un `.07` sur un sujet, un `.11` archivé sur develop, un `.12` dans une PR ouverte : `13` ; une spec sans ticket : `01`. **Rouge sur `main`** (forme refusée, sortie 2).
6. « tickets : au-delà de 99, sortie 2 et le message de découpage ».
7. « fetch en échec : copies locales lues, numéro rendu, la sortie d'erreur le dit ».
8 bis. « dépôt sans develop : le fetch ne nomme pas develop, les sujets et les docs sont lus, le numéro sort » — le dépôt nu n'a que `main` et une branche `sujet/z` porteuse d'une spec ; la sortie d'erreur ne dit pas « fetch impossible ».
8. « un sujet supprimé du distant ne garde pas son numéro pris » — non-régression de l'élagage limité : `sujet/z` supprimé du dépôt nu, sa spec n'est plus comptée ; une branche `autre/w` n'est pas élaguée.

Les 7 tests existants restent verts, `plusGrandSurBranches` compris (l. 127), et ceux de `pr-ouvertes.test.mjs` et `ticket-libre.test.mjs` (ticket 6) aussi, sans changement.

### 3. Le code

`next-id-branches.mjs`, puis `next-id.mjs` (arguments, fetch, `lirePrOuvertes`, mode ticket). Puis `TABLE-RACINE.md` et `tickets/SKILL.md`.

### 4. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici une forme d'usage nouvelle : une mineure. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  `next-id.mjs` fait un `fetch`, puis lit l'arbre de travail, `origin/develop`, tous les `origin/sujet/*` et `origin/docs/*`, et les fichiers des PR ouvertes (`scripts/docs/pr-ouvertes.mjs`, la lecture de `ticket-libre.mjs`). Il numérote aussi les tickets d'une spec : `node scripts/docs/next-id.mjs SPEC_ALL_SOC-4` rend le prochain index sur deux chiffres. Sans `gh`, le numéro sort, et la sortie d'erreur dit comment lire les PR ouvertes par l'outil GitHub MCP.

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code (session cloud : `lancement.md` § « La mise à niveau »).
  2. Reposer, dans une PR du projet : `/maj-skills:socle-monorepo` pour `scripts/docs/next-id.mjs`, `next-id-branches.mjs` et `next-id.test.mjs` (la ligne `references/scripts/docs/*` de `TABLE-RACINE.md` ; `pr-ouvertes.mjs` est arrivé avec la version du ticket 6). Aucune clé de contrat.
  3. Numéroter un ticket par `next-id.mjs <SPEC>`, puis le réserver aussitôt (branche et PR brouillon).

  **Iroki**, hors du plugin : ses deux `SPEC_ALL_SOC-4.78` et ses deux `ADR_ALL_ARC-18` se renomment chez lui ; la repose de ces scripts suffit ensuite.
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| Fetch et `origin/develop` | `skills/monorepo/socle-monorepo/references/scripts/docs/next-id.test.mjs` « une spec entrée dans develop après la dernière lecture compte : next-id fait un fetch et lit origin/develop » |
| Sujet ouvert ailleurs | idem, « un sujet ouvert par une autre session après la dernière lecture compte » |
| PR ouvertes | idem, « une spec que seule une PR ouverte ajoute compte » |
| Sans `gh` | idem, « gh indisponible : le numéro sort, sortie 0, et la sortie d'erreur dit comment lire les PR ouvertes par l'outil GitHub MCP » |
| Mode ticket, archive, deux chiffres | idem, « tickets : next-id SPEC_ALL_SOC-4 rend le prochain index sur deux chiffres, lu dans l'arbre, develop, les sujets, les PR ouvertes et l'archive » |
| Au-delà de 99 | idem, « tickets : au-delà de 99, sortie 2 et le message de découpage » |
| Fetch en échec | idem, « fetch en échec : copies locales lues, numéro rendu, la sortie d'erreur le dit » |
| Dépôt sans `develop` | idem, « dépôt sans develop : le fetch ne nomme pas develop, les sujets et les docs sont lus, le numéro sort » |
| Élagage limité | idem, « un sujet supprimé du distant ne garde pas son numéro pris » |
| Module partagé inchangé | `skills/monorepo/socle-monorepo/references/scripts/docs/pr-ouvertes.test.mjs` et `skills/chaine/tickets/references/scripts/docs/ticket-libre.test.mjs` (ticket 6), inchangés et verts |
| Scripts posés dans un projet | `scripts/poses.test.mjs` |

## Vérification

1. Ciblée : `node --test skills/monorepo/socle-monorepo/references/scripts/docs/next-id.test.mjs skills/monorepo/socle-monorepo/references/scripts/docs/pr-ouvertes.test.mjs skills/chaine/tickets/references/scripts/docs/ticket-libre.test.mjs skills/chaine/tickets/references/scripts/docs/migrer-tickets.test.mjs`.
2. `pnpm test` complet : le nombre de `main` au départ, plus les tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli.
3. **Mutations**, jouées sur une copie jetable, vues rouges, puis annulées, listées dans la PR : le fetch retiré (bancs 1 et 2) ; `origin/develop` retiré des refs (banc 1) ; les fichiers des PR ignorés (bancs 3 et 5) ; l'archive exclue (banc 5) ; une sortie 3 sans `gh` (banc 4, et `migrer-tickets.test.mjs`).
4. `graphify update .`
5. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR. `/security-review` n'est pas requise : aucun chemin sensible du gabarit (`scripts/docs/identifiants.mjs` seul l'est, et il ne change pas) ; la section de revue le dit en une ligne.
6. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `fix(tickets): next-id lit develop, les sujets et les PR ouvertes, et numérote les tickets (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #123`.

## Hors périmètre

- La lecture des PR ouvertes elle-même (`pr-ouvertes.mjs`) et `ticket-libre.mjs` : ticket 6.
- Une réservation atomique entre sessions (la fenêtre de la Décision 6).
- Les doublons déjà créés chez Iroki.
- La repose dans les projets : chacun la fait d'après la note de version.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, après relecture de `next-id.mjs`, `next-id-branches.mjs`, `identifiants.mjs`, `ticket-libre.mjs`, de leurs bancs et des appelants (`migrer-tickets.mjs:82`, `tickets.mjs:131`) sur `4a45634`. Écarts avec la spec et choix à confirmer :
  - **Spec exacte** sur C14 (`next-id-branches.mjs:13-37` : ni fetch, ni `origin/develop`, ni PR ouvertes ; aucun outil pour un `.NN`). Il lit déjà `origin/docs/*`, que la spec ne nommait pas : gardé.
  - **Ticket 6 écrit en parallèle** (`46a1f00`) : il place `pr-ouvertes.mjs` dans `socle-monorepo` (`A-41`) et en donne la forme (`lirePrOuvertes`) ; ce ticket la reprend telle quelle et ne touche ni le module, ni `ticket-libre.mjs`, ni `tk/depot-jouet.mjs`.
  - **Sortie 0 sans `gh`**, contre la sortie 3 de `ticket-libre.mjs` : `migrer-tickets.mjs:82` appelle `next-id` par `execFileSync`, qu'une sortie non nulle fait lever.
  - **Fichiers chauds partagés avec le ticket 13** (`next-id.test.mjs`, `TABLE-RACINE.md`) : tranché (`A-42`, `A-43`), le 13 passe avant.
- 2026-11-18 — Retouché après relecture (`A-43`) : bloqué par 6 et 13, avec « Ce que le ticket 13 aura changé » ; `develop` n'est nommé dans le fetch que s'il existe (banc 8 bis) ; banc 1 sur la spec `SOC-2` du jeu de données ; Décision 6 corrigée (le gate ne compare que les numéros de spec, deux `.NN` d'une même spec ne sont pas refusés) ; Décision 5 : nom de base lu par `identifiantDuTicket` puis `lireTicket`, jamais par `fichiersDeLaSpec`.
- 2026-11-18 — Choix de la session (base `fad725d`, plugin 7.21.0 → 7.22.0) :
  - Le `fetch` est joué par `next-id.mjs` (fonction `fetcher`), `plusGrandSurBranches` reste sans réseau. `ls-remote --exit-code` : sortie 2 = develop absent (pas une erreur) ; toute autre erreur = « fetch impossible : copies locales lues ».
  - Dépôt sans `develop` : quand `ls-remote` dit develop absent, la copie locale `refs/remotes/origin/develop` d'un fetch ancien est supprimée (`update-ref -d`), pour ne pas être lue (relevé de la revue, vu par le banc 8 bis).
  - Mode ticket : `numeroDe` est la seule fonction de lecture, sur le nom de base, pour l'arbre, les branches et les fichiers de PR ; au-delà de 99, sortie 2.
  - Mutation de l'archive : le premier banc 5 ne la voyait pas (la PR portait le plus grand index) ; une assertion sans PR (`12`) l'y rend rouge.
  - `pr-ouvertes.mjs`, `ticket-libre.mjs` et leurs bancs inchangés.
