# Le gabarit `demarrer-local.sh` du socle Nest crée sa base en UTF8, et refuse une base qui ne l'est pas

Status: Fait — PR #116
Type: défaut
Modèle: sonnet — un script shell court à corriger sur un modèle existant (le correctif d'Iroki, à réécrire), et un banc à faux binaires sur le patron de `scripts/pre-commit-socle.test.mjs` ; aucune conception.
Blocked by: —
Dépendances: — (aucune dépendance nouvelle)
Fichiers chauds: `skills/backend/socle-nest-hexagonal/references/squelette/scripts/db/demarrer-local.sh`, `skills/backend/socle-nest-hexagonal/references/CONTENU.md`, `scripts/demarrer-local-socle.test.mjs`, `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`
Label: contre-revue

Spec : [`../remontees-iroki.spec.md`](../remontees-iroki.spec.md), ticket 10 (point A1, décision `A-19`, part gabarit ; `A-34` pour la note). Source : [`../sources/2026-11-18-remontees-iroki.md`](../sources/2026-11-18-remontees-iroki.md), point 1. Programme : [`../../../programmes/capitaine-a-jour-et-teste.programme.md`](../../../programmes/capitaine-a-jour-et-teste.programme.md) (`A-17`, `A-18`). Base : `origin/main` à `4a45634` (plugin **7.15.0**, **738 tests**, `pnpm test` vert). Faits relus à la source le 2026-11-18 ; les écarts avec la spec sont sous `## Comments`.

## Le besoin

**Le défaut vécu chez Iroki.** Une session cloud démarre sur une machine en locale C/POSIX. Le gabarit `demarrer-local.sh` du socle Nest y lance `initdb`, puis `createdb`, sans encodage. PostgreSQL choisit alors `SQL_ASCII`. Sur une telle base, `normalize(…)` échoue, et le pre-push échoue avec lui. La base de la machine recyclée du capitaine d'Iroki était en `SQL_ASCII`. Iroki l'a corrigé chez lui (`SPEC_ALL_SOC-4.34`) ; tout projet qui adopte le socle Nest garde le défaut.

**Quand le ticket est fait :**

1. Une base créée par le gabarit est en UTF8 : `initdb --encoding=UTF8`, avec une locale UTF-8 (`C.UTF-8` si le système la connaît, sinon `--no-locale`), puis `createdb -E UTF8 -T template0`.
2. Une base ou un serveur déjà existant qui n'est pas en UTF8 est **refusé**, en sortie 6, avec les commandes à copier pour le recréer. Le script ne supprime jamais rien lui-même.
3. Un banc du plugin joue le gabarit contre de faux `initdb`, `pg_ctl`, `psql` et `createdb`, sans PostgreSQL réel.
4. Le plugin prend une version, et `NOTES-DE-VERSION.md` dit ce qu'un projet repose.

## Où

`nest/` abrège `skills/backend/socle-nest-hexagonal/references/`. Lignes relues sur `4a45634`.

| Fichier | Lignes | Ce qu'on y fait |
| --- | --- | --- |
| `nest/squelette/scripts/db/demarrer-local.sh` | 1-14 | En-tête : le paragraphe « Encodage » (UTF8 toujours ; refus d'une base ou d'un serveur existant qui ne l'est pas, sortie 6, jamais de suppression) ; la variable facultative `PG_LOCALE_UTF8` ; les sorties (2, 3, 4, 5 existent, 6 est nouvelle). |
| idem | après 72 (`port_ouvert`) | `encodage_de <base>` (requête sur la base `postgres` : `SELECT pg_encoding_to_char(encoding) FROM pg_database WHERE datname = '<base>'`, vide si absente) et `verifier_base_utf8` (refus en 6). |
| idem | 74-77 et 84-87 | Les deux sorties « répond déjà » appellent d'abord `verifier_base_utf8`. |
| idem | 107-114 | Le choix de la locale (`locale -a`, comparaison sans casse, `utf-8` égal à `utf8`), puis `initdb … --encoding=UTF8 "$option_locale"` (l. 112). Repli sur `--no-locale` dit sur la sortie standard. |
| idem | après 125 (`pg_ctl start`) | Serveur déjà initialisé dans un autre encodage (`encodage_de template1` différent de `UTF8`) : refus en 6, avec les commandes `pg_ctl -D <données> stop` (préfixées de `runuser -u postgres -- ` quand le script tourne en root, comme `en_pg`), `rm -rf <données>`, puis la relance du script. |
| idem | 127-129 | `createdb … -E UTF8 -T template0 "$base"` (l. 128), puis `verifier_base_utf8`. |
| `nest/CONTENU.md` | 27 | Ajouter : « crée sa base en UTF8 (une base en `SQL_ASCII` fait échouer `normalize(…)`), et refuse une base ou un serveur existant qui ne l'est pas, en donnant les commandes pour le recréer (sortie 6). » |
| `scripts/demarrer-local-socle.test.mjs` (nouveau) | — | Le banc, voir « Ordre de travail ». Modèle de forme : `scripts/pre-commit-socle.test.mjs` (banc du plugin, jamais posé, qui éprouve un gabarit). |
| Version | — | `.claude-plugin/plugin.json:3`, `NOTES-DE-VERSION.md` (voir « La version et la note »). |

Appelants réels du script dans les projets : le script de l'environnement cloud (`skills/chaine/socle-chaine-de-production/references/admin.md:22`, avec `|| true`), les commandes des index générés (`nest/tickets/4-couche-base-de-donnees.issue.md:18`, `:26`), et à la main (`nest/fragments/readme-commandes.md:6`). Plus tard, la clé `preparerCapitaine` du capitaine (ticket 8).

**Référence, à réécrire et jamais à copier** : le correctif d'Iroki, `SPEC_ALL_SOC-4.34`, PR #486 (`0e97d710`) puis #495 (`0623fdd1`, messages de refus), sur `develop` :

- `scripts/db/demarrer-local.sh:12-18` (en-tête), `:76-102` (`prefixe_pg`, `encodage_de`, `verifier_base_utf8`), `:144-154` (locale et `initdb`), `:169-184` (serveur existant, `createdb`) ;
- son banc, `scripts/db/demarrer-local.test.mjs:1-151`.

Ses messages citent `pnpm --filter @iroki/iroki-api db:migrate` : rien de cela n'entre dans le gabarit. Le gabarit ne connaît pas encore la commande de migration du projet (le ticket gabarit 4 la pose) ; le message dit « puis rejouer les migrations du projet ». Iroki a aussi ajouté `COMPOSE_FICHIER` pour son banc ; le gabarit n'en a pas besoin (voir Décision 4).

Règles à lire : l'en-tête du script (l. 1-14), et `scripts/pre-commit-socle.test.mjs` en entier.

## Décisions

Tenue (spec) : `A-19`, part gabarit : « Le gabarit `demarrer-local.sh` du socle Nest crée désormais sa base en UTF8 (`initdb --encoding=UTF8`, `createdb -E UTF8 -T template0`). »

Précisions du ticket :

1. **La locale accompagne l'encodage.** `initdb --encoding=UTF8` échoue si la locale héritée est d'un autre encodage (« encoding UTF8 does not match locale »). Le script passe donc `--locale=<PG_LOCALE_UTF8, C.UTF-8 par défaut>` si `locale -a` la connaît, sinon `--no-locale`, qui garde l'UTF8. Le repli s'écrit sur la sortie standard : `demarrer-local : locale <x> absente de ce système, repli sur --no-locale (encodage UTF8 conservé)`.
2. **Une base existante qui n'est pas en UTF8 est refusée, jamais supprimée.** Sans ce refus, un projet qui repose le gabarit sur un poste dont la base est déjà en `SQL_ASCII` garde le défaut sans le voir. Sortie **6**, la première libre (le script sort aujourd'hui en 2, 3, 4, 5). Messages sur la sortie d'erreur, à garder tels quels (le banc les lit) :
   - base : `demarrer-local : base <base> en <encodage> : la recréer (la base locale est jetable : rien à sauvegarder). Commandes :`, puis la commande `psql … -d postgres -c 'DROP DATABASE <base>'` complète, `bash scripts/db/demarrer-local.sh`, et `puis rejouer les migrations du projet` ;
   - serveur : `demarrer-local : serveur <données> initialisé en <encodage> : l'arrêter et supprimer <données> (la base locale est jetable : rien à sauvegarder). Commandes :`, puis `pg_ctl -D <données> stop`, `rm -rf <données>`, la relance et la même dernière ligne.
3. **Le chemin Docker ne change pas** : l'image `postgres:16` de `compose.yaml` initialise déjà en UTF8.
4. **Le banc copie le gabarit dans un projet jetable** (`<tmp>/projet/scripts/db/demarrer-local.sh` et `<tmp>/projet/compose.yaml`) : le script lit `compose.yaml` à `../..` de lui-même (l. 17-18). Aucune variable `COMPOSE_FICHIER` n'est ajoutée au gabarit.
5. **La fille tranche seule**, par défaut prudent, et le note sous `## Comments` : le découpage des tests, la forme des faux binaires. Elle ne tranche **pas** : le code 6, l'absence de toute suppression automatique, les messages ci-dessus.

## Ordre de travail (TDD)

Une branche de travail partie d'`origin/main`. Chaque test est vu rouge avant le code qui le rend vert. Commits sous les hooks, jamais `--no-verify`.

### 1. Le banc, vu rouge sur `main`

`scripts/demarrer-local-socle.test.mjs`, plugin seul (le glob `scripts/*.test.mjs` de `package.json` le joue ; il n'est pas posé). Dossiers par `dossierTemporaire` de `skills/chaine/sujet/scripts/depot-jouet.mjs` (retirés à la sortie, convention des bancs). Dans un `<tmp>` neuf :

- `pg/16/bin/` (passé par `PG_RACINE`) : faux `initdb` (journalise ses arguments, crée `<-D>/PG_VERSION`), `pg_ctl` (journalise ; `status` sort en 3, le reste en 0), `createdb` (journalise, marque la base comme existante), `psql` (`SELECT 1` répond selon que la base existe ; la requête d'encodage de `template1` rend `$ENC_SERVEUR`, `UTF8` par défaut ; celle de la base rend `$ENC_BASE` si elle existe). Aucun faux n'exécute de `DROP`.
- `fakes/`, en tête de `PATH` : `docker` (sort en 1, donc chemin sans Docker), `id` (rend `1000` : le banc ne passe jamais par `runuser` ni `useradd`, même joué en root), `locale` (rend la liste du test).
- `PGDATA_LOCAL=<tmp>/donnees` ; un `compose.yaml` jetable dont le port est libre au moment du test (un serveur `net` ouvert sur le port 0, son port lu, puis fermé) : `port_ouvert` (l. 72) teste le vrai port.
- L'environnement du `spawnSync` retire les `GIT_*` hérités, comme les autres bancs.

Tests, titres à garder tels quels :

1. « demarrer-local du socle : initdb reçoit --encoding=UTF8 et la locale C.UTF-8 » — **rouge sur `main`** (l. 112 sans encodage).
2. « demarrer-local du socle : locale C.UTF-8 absente, repli sur --no-locale, encodage UTF8 gardé, dit au journal » — rouge sur `main`.
3. « demarrer-local du socle : createdb reçoit -E UTF8 -T template0 » — rouge sur `main` (l. 128).
4. « demarrer-local du socle : base existante en SQL_ASCII, sortie 6, commandes à copier, jamais de DROP » — sortie 6, la ligne `DROP DATABASE` dans le message, aucun appel journalisé ne contient `DROP`, aucun `createdb` ; le message ne contient ni `iroki` ni `--filter` — rouge sur `main` (sortie 0).
5. « demarrer-local du socle : serveur initialisé en SQL_ASCII, sortie 6, arrêt et suppression à copier » — rouge sur `main`.
6. « demarrer-local du socle : base existante en UTF8, rien n'est recréé » — vert sur `main` aussi : c'est la non-régression, dite comme telle dans la PR.

### 2. Le code

Le script, dans l'ordre des lignes du tableau « Où ». `bash -n` dessus. Puis `nest/CONTENU.md:27`.

### 3. La version et la note

- `.claude-plugin/plugin.json:3` : **mineure ou patch selon `README.md:186`, sur la version de `main` au moment de la livraison**. Ici, une correction d'un gabarit : un patch. Si `main` a bougé pendant le travail, fusionner `origin/main` dans la branche par un commit de merge (jamais de rebase ni de push forcé), prendre le numéro suivant celui de `main`, et le reporter dans la note.
- `NOTES-DE-VERSION.md` : une note **en tête**, sous le titre du fichier. Si le fichier n'existe pas encore sur `main` (le ticket 1 le crée), le créer avec l'en-tête que le ticket 1 donne (`# Notes de version` et son paragraphe), recopié tel quel. La note :

  ```markdown
  ## <version> — <date de la PR>

  ### Ce qui change

  Le gabarit `scripts/db/demarrer-local.sh` du socle Nest crée sa base en UTF8 (`initdb --encoding=UTF8` avec une locale UTF-8, `createdb -E UTF8 -T template0`) : sur une machine en locale C/POSIX, PostgreSQL choisissait `SQL_ASCII`, et `normalize(…)` échouait au pre-push. Une base ou un serveur existant qui n'est pas en UTF8 est refusé (sortie 6), avec les commandes pour le recréer ; rien n'est supprimé par le script.

  ### Ce qu'un projet fait pour en profiter

  1. Mettre à jour le plugin : `claude plugin marketplace update maj`, puis `claude plugin update maj-skills@maj`, puis redémarrer Claude Code.
  2. Dans une PR du projet, recopier `~/.claude/plugins/marketplaces/maj/skills/backend/socle-nest-hexagonal/references/squelette/scripts/db/demarrer-local.sh` sur `scripts/db/demarrer-local.sh`, tel quel (il n'a aucun marqueur à substituer). Aucune commande `poser` : le socle Nest se pose une fois.
  3. Lancer `bash scripts/db/demarrer-local.sh`. S'il sort en 6, suivre les commandes qu'il imprime, puis rejouer les migrations. Le script de l'environnement cloud l'appelle avec `|| true` (`admin.md`) : un refus y passe inaperçu, il se voit au premier appel de la session.

  **Iroki** : rien à reposer. Son script (`SPEC_ALL_SOC-4.34`, #486 et #495) fait déjà tout cela, avec `COMPOSE_FICHIER` et son banc en plus ; le gabarit ne doit pas l'écraser.
  ```

## Surfaces

| Surface | Preuve |
| --- | --- |
| `initdb` en UTF8, locale `C.UTF-8` ou repli `--no-locale` | `scripts/demarrer-local-socle.test.mjs` « demarrer-local du socle : initdb reçoit --encoding=UTF8 et la locale C.UTF-8 », « demarrer-local du socle : locale C.UTF-8 absente, repli sur --no-locale, encodage UTF8 gardé, dit au journal » |
| `createdb` en UTF8 depuis `template0` | idem, « demarrer-local du socle : createdb reçoit -E UTF8 -T template0 » |
| Refus d'une base ou d'un serveur existant hors UTF8, sans suppression | idem, « demarrer-local du socle : base existante en SQL_ASCII, sortie 6, commandes à copier, jamais de DROP », « demarrer-local du socle : serveur initialisé en SQL_ASCII, sortie 6, arrêt et suppression à copier » |
| Base existante en UTF8 inchangée | idem, « demarrer-local du socle : base existante en UTF8, rien n'est recréé » |

## Vérification

1. Ciblée : `node --test scripts/demarrer-local-socle.test.mjs` ; `bash -n skills/backend/socle-nest-hexagonal/references/squelette/scripts/db/demarrer-local.sh`.
2. `pnpm test` complet : le nombre de `main` au départ (**738** sur `4a45634`), plus les six tests ajoutés, zéro échec. Aucun test retiré, sauté ni assoupli.
3. **Mutations**, chacune jouée sur une copie jetable, vue rouge, puis annulée, listées dans la PR avec les tests qui ont rougi : retirer `--encoding=UTF8` (tests 1 et 2) ; retirer `-T template0` (test 3) ; `verifier_base_utf8` ne sort plus (test 4) ; le contrôle de `template1` retiré (test 5).
4. `graphify update .`
5. **Revue de ticket** (`/maj-skills:revue-de-ticket`, trois sous-agents), section `## Revue de ticket` dans le corps de la PR.
6. **Livraison sur ce dépôt.** Il n'a ni `develop` ni `.claude/chaine.json`, et aucun capitaine : le produit fusionne (fiche du programme, `Capitaines:`).
   - La session ouvre une PR vers `main`, hors brouillon, titrée `fix(socle-nest): demarrer-local crée sa base en UTF8 (plugin <version>)`. Le titre tient en 120 caractères avec ` (#n)`.
   - Le ticket porte `Label: contre-revue` : la session ne pose **ni** le commentaire `à-fusionner au sommet <sha>` **ni** le label (`architecte/references/lancement.md:76`). Elle écrit à l'architecte (`send_message`) dès la PR livrée.
   - L'architecte contre-relit par un sous-agent. Puis il écrit sur la PR le commentaire `à-fusionner au sommet <sha>` (le sha complet du sommet relu) et pose `à-fusionner` (`lancement.md:80`). Le produit fusionne.
   - Dans la PR, le ticket passe à `Status: Fait — PR #<n>`.

## Hors périmètre

- La clé `preparerCapitaine` et la veille du capitaine (ticket 8) : la commande de préparation appartient au projet.
- Ce qui est propre à Iroki : migrer depuis `develop` seul, refuser une migration absente de `develop`.
- Le chemin Docker, `compose.yaml`, et le ticket gabarit 4 (couche base de données).
- Une repose automatique dans les projets : chacun la fait d'après la note.

## Comments

- 2026-11-18 — Ticket écrit par un sous-agent de l'architecte, sources relues sur `4a45634` et sur `develop` d'Iroki. Écarts avec la spec :
  - Lignes citées (`demarrer-local.sh`, l. 112 et 128) : exactes.
  - `A-19` ne nomme que les deux options d'encodage. Le ticket y ajoute la locale (Décision 1), sans laquelle `--encoding=UTF8` échoue sous une locale d'un autre encodage, et le refus d'une base existante hors UTF8 (Décision 2), sans lequel un projet qui repose le gabarit garde sa base en `SQL_ASCII` sans le voir. Les deux viennent du correctif d'Iroki (#486, #495). À confirmer à la contre-relecture.
  - Le gabarit n'avait aucun banc. Le ticket en pose un à la racine du plugin, sur le modèle de `scripts/pre-commit-socle.test.mjs`.
