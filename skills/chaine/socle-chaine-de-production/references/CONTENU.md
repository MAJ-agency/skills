# Ce que contient le socle de la chaîne de production, et pourquoi

## Le contrat — `chaine.json`

Quatre lignes, et rien d'autre, que les skills d'exploitation lisent au lieu de deviner : les **chemins sensibles** (un diff qui les touche passe en plus `/security-review`), le **fichier de critères** de la revue adversariale propre au projet, le nombre de **filles par vague** par défaut, et le **dossier des migrations** (que le hook `garde-fichiers` protège). Les branches ne s'y déclarent pas : `develop` intègre, `main` livre, pour tous les projets.

## Les index générés — `index-generes.json`

Une liste unique des fichiers qu'on régénère et qu'on n'édite jamais, avec leur commande : lue par le capitaine avant chaque push, par `diff.sh` de la revue (exclus du diff relu), et par `regles.mjs` (édition refusée). Une entrée peut porter une `verification`, le gate anti-dérive de l'index (`openapi:check`, `db:types:check`) : `regenerer_index` le joue après toutes les régénérations, et un échec annule la mise à jour du sujet ou le passage de la PR, au lieu de laisser partir un index régénéré contre un état faux. Chaque socle de service y ajoute ses entrées ; le socle API y met l'OpenAPI. La chaîne y met le registre des coûts de production, `docs/agents/couts.md` : `scripts/docs/couts.mjs` (posé par `tickets`) l'agrège depuis la section `## Coût` des cartes de chantier.

## Les hooks d'agent — `agent/`

Ce que les règles disent « jamais » et qu'une consigne ne garantit pas : le hook le refuse avant que l'agent ne construise dessus. `garde-commandes` refuse le push forcé, `--no-verify`, le push direct sur `develop` ou `main`, le rebase d'une branche partagée, `npm` et `yarn`, et **demande** avant une dépendance nouvelle, sauf si chaque paquet figure sur la ligne `Dépendances:` du ticket de la branche (`feat/spec-all-soc-1-04-hook` → `SPEC_ALL_SOC-1.04`, lu par `scripts/docs/identifiants.mjs` du skill `tickets` : `regles.mjs` ne recopie aucune expression d'identifiant), lue sur `origin/sujet/*` (jamais dans l'arbre de travail : une session ne s'autorise pas elle-même) ; un `.npmrc` ou un `pnpm-workspace.yaml` qui diffère de develop, ou non suivi, suspend ce laissez-passer. Il refuse aussi tout `git push` vers un `sujet/…`, quelle que soit la branche et la forme (guillemets, `git -C`, chemin de git, préfixe comme `timeout`, sous-shell, `--repo`, `HEAD` ou push nu depuis une branche `sujet/…`), sans quoi la session écrirait elle-même la ligne qui l'autorise : la carte du chantier passe par `sujet.sh carte <nom>`, que le refus indique. Une destination illisible (variable, substitution, motif, `--all`, `--mirror`) demande. Cas vécu : un ticket validé au découpage, bloqué 46 h sur le paquet qu'il prévoyait. La garde vaut pour des sessions de bonne foi : un contournement délibéré (`remote set-url`, un script lancé par la session) échappe à la lecture du hook ; seule une protection de `sujet/*` côté GitHub en ferait une frontière. `garde-fichiers` refuse l'édition d'un index généré, du lockfile, d'un `.env` et d'une migration déjà livrée. Les règles sont des fonctions pures dans `regles.mjs`, testées par `regles.test.mjs` ; `garde-commandes.test.mjs` éprouve la lecture du ticket sur un dépôt jouet. `apres-edition.mjs` passe Prettier puis ESLint sur chaque fichier édité et renvoie l'erreur à l'agent tout de suite ; `fin-de-tour.mjs` rejoue les gates rapides (`gatesRapides` du contrat) avant que l'agent rende la main, une fois. `demarrage.mjs`, au démarrage de chaque session, met l'environnement en état de coder et de pousser : `origin/develop` et `origin/HEAD` (la couverture du diff et la revue comparent à develop), les dépendances si le lockfile a changé, le certificat du proxy des sessions cloud ; idempotent, jamais bloquant. Les étapes d'une base locale sont écrites et désactivées jusqu'à la couche base de données. Le fragment `settings-hooks.json` les déclare dans `.claude/settings.json`, à côté des hooks de graphify.

## Le gate `settings-json` — `scripts/verify/`

La forme de `.claude/settings.json` : JSON valide (une virgule en trop et Claude Code ignore le fichier entier, hooks compris), `permissions.allow` à sa place et non vide s'il existe, rien qui autorise ce que les hooks refusent, les quatre événements de hook présents et chaque commande vers un script existant. Il lit, ne corrige pas.

## Les labels — `labels.sh`

Les sept mots du protocole entre les skills, créés en REST, idempotent. Un projet n'a aucune raison de les renommer.

## La CI — `ci/ci.yml`

Deux jobs exigés par la protection de `develop` : `qualite` et `test-db`. Un brouillon ne lance rien. Les E2E s'ajoutent en job séparé quand ils existent.

## La méthode — `docs-agents/chaine-de-production.md`

Les rôles, le cycle, le ticket prêt pour agent, les fichiers chauds, les consignes des filles et l'économie de tokens avec ses mesures. C'est le document que le prompt de fille cite par renvoi : il n'est écrit qu'une fois. À côté, `pieges.md` : la liste que la rétro de chaque chantier alimente, amorcée avec les pièges déjà connus.

## Les ADR — `adr/`

Trois gabarits, numérotés à l'installation par `next-id.mjs ADR ALL ARC` : la chaîne de production (un rôle par session, le ticket prêt, la revue adversariale, le capitaine), les branches de sujet, la recette humaine. Ils portent la décision et les faits mesurés qui la fondent ; le projet les date et peut les réviser. Les skills ne les relisent jamais.

## Les fragments — `fragments/`

Ce que le socle ajoute aux fichiers de la racine : la section « Fusion vers `develop` » et deux lignes de routage dans `CLAUDE.md`, les commandes et l'arborescence dans `README.md`.

## Ce qu'un admin fait à la main — `admin.md`

La protection des branches, la suppression automatique des branches fusionnées, les labels depuis un poste authentifié : l'API refuse ces réglages depuis une session cloud.
