# skills

Skills d'ingénierie maison, installables comme **un seul plugin Claude Code**. Même forme que [`mattpocock/skills`](https://github.com/mattpocock/skills) : un plugin, plusieurs skills groupés par catégorie.

Ces skills ne portent **aucune règle métier**. Ce sont des règles de configuration, d'architecture et de méthode — réutilisables d'un projet à l'autre.

## Installer

Le dépôt est **public** : aucun accès à demander, aucune authentification GitHub pour installer.

```bash
claude plugin marketplace add MAJ-agency/skills
claude plugin install maj-skills@maj
```

Une installation, tous les skills disponibles. Pour mettre à jour, deux commandes — la première rafraîchit le catalogue, la seconde installe la nouvelle version, puis redémarrer Claude Code :

```bash
claude plugin marketplace update maj
claude plugin update maj-skills@maj
```

**Dans un environnement cloud** (sessions Claude Code sur claude.ai), le script de configuration de l'environnement de chaque projet installe le plugin depuis GitHub et le met à jour. Il ne se rejoue pas à chaque session : l'environnement garde un instantané du disque pris à son dernier passage, et toute session, celles lancées par une autre comprises, part de cet instantané, avec la version du plugin qu'il porte ; le script ne repasse qu'à un changement du script ou des hôtes autorisés, ou à l'expiration de l'instantané (environ sept jours, documentation de Claude Code, page des environnements cloud). Une mise à jour jouée dans la session change les fichiers du marketplace, pas les skills déjà chargés : une session lancée par l'architecte se met à niveau en tête de son prompt (`skills/chaine/architecte/references/lancement.md`, § « La mise à niveau »). `install` ne touche pas à un plugin déjà présent.

```bash
claude plugin marketplace add MAJ-agency/skills || true
claude plugin install maj-skills@maj || true
claude plugin marketplace update maj || true
claude plugin update maj-skills@maj || true
```

## Les skills

### `monorepo/`

| Skill                                                       | Ce qu'il fait                                                                                                                                                        |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`socle-monorepo`](skills/monorepo/socle-monorepo/SKILL.md) | Amorce la racine d'un monorepo pnpm/Turborepo — hooks, méthode, documentation, outillage agent — puis installe les services choisis                                  |
| [`socle-tests`](skills/monorepo/socle-tests/SKILL.md)       | Pose les gates de qualité des tests : tests creux refusés (lint + AST), couverture du diff sur Vitest, propriétés `fast-check`, score de mutation Stryker, trois ADR |

Invocation : `/maj-skills:socle-monorepo`. C'est le point d'entrée d'un projet neuf : il demande quels services installer et invoque leur skill, puis `socle-tests` et, après le premier push, `socle-chaine-de-production` quand ils sont cochés. Un dépôt amorcé sort complet : socle, gates de tests, chaîne de production.

### `packages/`

| Skill                                                       | Ce qu'il fait                                                                                                                              |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| [`socle-contrats`](skills/packages/socle-contrats/SKILL.md) | Pose `packages/contracts` (schémas Zod, types inférés, formes de réponse) et ses règles ; `packages/utils` à la première fonction partagée |

Invocation : `/maj-skills:socle-contrats`. Invoqué par `socle-monorepo` avant tout service : c'est ce que l'API et ses clients partagent.

### `backend/`

| Skill                                                                  | Ce qu'il fait                                                                                             |
| ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| [`socle-nest-hexagonal`](skills/backend/socle-nest-hexagonal/SKILL.md) | Amorce un backend NestJS hexagonal complet dans le monorepo, et dépose en tickets ce qui reste à trancher |

Invocation : `/maj-skills:socle-nest-hexagonal`. Lancé seul dans un dépôt vide, il pose d'abord la racine via `socle-monorepo`.

### `frontend/`

| Skill                                                       | Ce qu'il fait                                                                                                                                              |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`socle-web-next`](skills/frontend/socle-web-next/SKILL.md) | Amorce un client web Next.js App Router — routes minces, features feuilles verrouillées par le lint, un seul client HTTP à cookies — et dépose ses tickets |

Invocation : `/maj-skills:socle-web-next`. Suppose la racine et les contrats posés ; la page d'accueil interroge `/health` de l'API pour prouver la chaîne complète.

### `mobile/`

| Skill                                                           | Ce qu'il fait                                                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`socle-mobile-expo`](skills/mobile/socle-mobile-expo/SKILL.md) | Amorce un client mobile Expo — même architecture que le web, session par jetons dans le Keychain, bundle Metro comme gate — et dépose ses tickets |

Invocation : `/maj-skills:socle-mobile-expo`. Suppose la racine et les contrats posés ; l'écran d'accueil interroge `/health` de l'API.

### `chaine/`

| Skill                                                                             | Ce qu'il fait                                                                                                                                                                                                                                                   |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`socle-chaine-de-production`](skills/chaine/socle-chaine-de-production/SKILL.md) | Pose ce que supposent les skills de la chaîne : `develop` intègre et `main` livre, les sept labels, les hooks d'agent, le contrat `.claude/chaine.json`, les index générés, une CI minimale, un `.github/CODEOWNERS` généré depuis les chemins sensibles, la méthode et quatre ADR |
| [`tickets`](skills/chaine/tickets/SKILL.md)                                       | La convention des specs et tickets (`SPEC_ALL_SOC-1`, `SPEC_ALL_SOC-1.03`), les scripts qui la lisent (numéro suivant, ticket libre, vagues, avancement, archivage, gate) et la migration d'un dépôt                                                            |
| [`anchorpost`](skills/chaine/anchorpost/SKILL.md)                                 | Branche un dépôt sur Anchorpost, le site qui montre à la MOA les règles, les preuves, les défauts et les demandes lus dans la documentation : la CLI privée, le manifeste, l'index généré et son gate, la fiche d'écriture, la recette d'installation de la clé |
| [`criticite`](skills/chaine/criticite/SKILL.md)                                   | La criticité d'une règle à sa création ou au changement de son énoncé, avant tout code : un sous-agent vierge, dont le message est fabriqué par un script, rend le niveau et sa raison, les cas attendus et les dix familles ; jamais « basse » sans raison, le niveau supérieur dans le doute, un agent écrit `by: agent` et ne baisse jamais un niveau ; la commande et chaque sortie brute dans la PR ; sans index au pivot 3, il s'arrête |
| [`revue-adversariale`](skills/chaine/revue-adversariale/SKILL.md)                 | Avant `à-fusionner` : un sous-agent vierge, le diff seul, une liste fermée de critères (vingt et un du socle, plus ceux du projet), une section de PR                                                                                                           |
| [`revue-de-ticket`](skills/chaine/revue-de-ticket/SKILL.md)                       | Quand un ticket est « fini » : trois sous-agents vierges — règles (la revue adversariale), ticket (surfaces, décisions, règles et cas de bord, périmètre), documentation — une seule section de PR                                                              |
| [`sujet`](skills/chaine/sujet/SKILL.md)                                           | Un lot de PR liées sur `sujet/<nom>` dès sa première PR, entré dans develop en une PR par un commit de merge ; `demarrer`, `etat`, `livrer`, `geler` / `degeler` (le gel d'un chantier)                                                                         |
| [`fusionner`](skills/chaine/fusionner/SKILL.md)                                   | Le capitaine de fusion : la file `à-fusionner` passée une PR à la fois, les sous-PR dans leur sujet, les renvois comptés (au plafond, la PR attend un humain), les PR d'un sujet gelé laissées dans la file ; une seule session                                 |
| [`architecte`](skills/chaine/architecte/SKILL.md)                                 | L'architecte d'un programme : seul à parler au produit, il tient la carte du programme, mène le grilling jusqu'à la spec validée, lance sans lui demander conducteurs, capitaines et sessions de ticket prêtes, avec leur procédure entière et ses consignes, ouvre lui-même les PR de documentation, relaie les plafonds au produit                                   |
| [`chantier`](skills/chaine/chantier/SKILL.md)                                     | Le conducteur de chantier : depuis une spec validée, carte, tickets prêts pour agent, sujet, vagues de sessions filles, suivi sans attente active, rétro ; reprenable ; signale un plafond sans rien couper, arrête un chantier gelé                            |
| [`recette-humaine`](skills/chaine/recette-humaine/SKILL.md)                       | La recette d'un module en quatre phases, arrêt après l'inventaire pour que le produit tranche, tests rouges, tickets de défauts                                                                                                                                 |

Invocation : `/maj-skills:socle-chaine-de-production` une fois par dépôt (depuis `socle-monorepo`, ou à la main ; `chantier` le réclame s'il manque), qui pose les scripts des quatre autres dans `scripts/chaine/` ; `/maj-skills:tickets` et `/maj-skills:revue-adversariale` au quotidien dans une session de travail ; `/maj-skills:criticite` à toute création d'un fichier de règle et à tout changement de son énoncé, quelle que soit la session ; `/maj-skills:sujet` au début de tout ticket ; `/maj-skills:architecte`, `/maj-skills:fusionner` et `/maj-skills:chantier` chacun dans une session dédiée (l'architecte dans une session ouverte par le produit) ; `/maj-skills:recette-humaine` sur un module livré.

**La racine est une seule source.** `socle-monorepo` la pose ; un skill de service n'écrit que dans `apps/<service>/`, ses paquets, et des fragments insérés dans les zones `<!-- socle:… -->` de `README.md` et `CLAUDE.md`. Ses règles de lint vivent dans `apps/<service>/eslint.rules.mjs`, chargé par l'ESLint racine.

## `socle-nest-hexagonal` en deux mots

**Un service qui démarre.** NestJS 11, TypeScript strict, monorepo pnpm + Turborepo. `GET /health` répond, Swagger UI est servi hors production, le document OpenAPI est **généré depuis les schémas Zod** avec un gate anti-dérive.

**Une architecture verrouillée par la machine.** Hexagonal ports & adapters, dépendances vers l'intérieur uniquement. Les frontières ne sont pas que documentées : `no-restricted-imports` les fait échouer au lint, et `check:arch` compile `domain/` + `application/` sans `infrastructure/` pour prouver que la règle d'or tient.

**Les ports techniques déjà câblés.** Journalisation, horloge et identifiants injectés par token — jamais un `new Logger()` ni un `new Date()` en dur. Gestion des erreurs de domaine avec filtre global et table code → statut HTTP livrée **vide**, accompagnée de sa procédure d'ajout.

**Une configuration qui refuse de mentir.** L'environnement est validé par Zod au démarrage, fail-fast, avec durcissement production. Les valeurs de développement sont committées et jamais injectées en production. Sous Vitest, le `.env` de la machine n'est pas chargé : les tests restent déterministes.

**Une méthode écrite.** Cinq documents qui font autorité : comment interroger un plan (grilling), quand écrire une ADR, comment nommer un document, comment concevoir un module profond, quels invariants la machine doit garantir.

**Une documentation structurée.** Tout sous `docs/`, trié par thème — ADR, architecture, métier, features. Nomenclature `<TYPE>_<CTX>_<TRI>-<n>-<slug>.md` (`ADR_ALL_ARC-2`, `SPEC_ALL_SOC-1`, `RULE_ALL_LIC-3` ; six types, le contexte `ALL` toujours écrit, sans zéro de tête) avec registre de trigrammes, pour qu'une référence ne casse jamais au déplacement d'un fichier.

**L'outillage agent installé** (par `socle-monorepo`). graphify avec ses hooks, les skills Matt Pocock et superpowers, et la configuration `docs/agents/` produite en invoquant `setup-matt-pocock-skills` — pas recopiée à la main.

**Neuf tickets.** Ce que le socle a délibérément laissé ouvert : modéliser le domaine, choisir l'hébergement, décider s'il y a un client, monter la couche base de données, l'authentification, le journal d'audit, le pare-feu CI, l'observabilité, le registre des règles métier.

### Ce qu'il ne fait pas, volontairement

- **Aucune couche base de données.** Le schéma dépend d'un domaine qui n'existe pas encore.
- **Aucun front.** Le jour où un client naît, ses règles se reprennent en bloc.
- **Aucune décision d'hébergement**, donc `trust proxy` reste non configuré — le défaut d'Express échoue du bon côté, et poser un chiffre au hasard inventerait une topologie.
- **Aucune authentification implémentée.** Sa forme dépend du client : cookies pour un navigateur, jetons porteurs pour du mobile, signature de pass pour un portefeuille. La recette est écrite, elle attend la réponse.

## Structure

```
.claude-plugin/
  marketplace.json     le marketplace « maj », qui expose le plugin
  plugin.json          le plugin « maj-skills », qui déclare ses skills
skills/
  monorepo/
    socle-monorepo/
      SKILL.md         le processus, en huit étapes
      references/      racine, hooks, méthode, ADR transverses, tickets transverses
  packages/
    socle-contrats/
      SKILL.md         le processus, en trois étapes
      references/      paquets contracts et utils, règles des paquets, fragments de racine
  backend/
    socle-nest-hexagonal/
      SKILL.md         le processus, en quatre étapes
      references/      squelette du service, règles back, fragments de racine, tickets API
  frontend/
    socle-web-next/
      SKILL.md         le processus, en trois étapes
      references/      squelette du client, règles front, ADR_ALL_WEB-1, fragments, tickets web
  mobile/
    socle-mobile-expo/
      SKILL.md         le processus, en trois étapes
      references/      squelette Expo, règles mobile, ADR_ALL_MOB-1, fragments, tickets mobile
  chaine/
    socle-chaine-de-production/
      SKILL.md         le processus, en quatre étapes
      references/      contrat, index générés, hooks d'agent, labels, CI, CODEOWNERS et son gate, méthode, quatre ADR, fragments, liste admin
    tickets/
      SKILL.md         la convention, poser, au quotidien, migrer
      references/      scripts (docs/, verify/) et leurs tests, tracker, labels de triage, gabarits
    criticite/
      SKILL.md         quand, l'index au pivot 3, le message du sous-agent, tracer, retenir ou corriger, relancer
      scripts/         contexte-regle.mjs (le message du sous-agent) et son banc
      references/      le prompt exact du sous-agent, la source des définitions
    revue-adversariale/
      SKILL.md         poser, quand, le diff, les chemins sensibles, le sous-agent, trier, corriger
      scripts/         diff-revue.sh, chemins-sensibles.mjs
      references/      critères du socle, prompt exact, section de PR
    sujet/
      SKILL.md         quand un sujet, session de travail, capitaine, livrer
      scripts/         sujet.sh, le dépôt jouet et le faux gh, les tests
    fusionner/
      SKILL.md         la règle, REST seulement, mise en place, boucle, renvoyer, fin de passage
      scripts/         github.sh, identifiant.mjs, file.sh, passer.sh, boucle.sh, renvoyer.sh, refus.sh, proprietaire.sh, revue-exigee.mjs, migrations-ordre.mjs, commits-a-relire.mjs, les tests
    architecte/
      SKILL.md         lire, vérifier l'environnement, la carte du programme, le grilling, lancer, suivre, changer d'architecte
      references/      les prompts de lancement d'un conducteur et d'un capitaine
    chantier/
      SKILL.md         reprendre ou démarrer, setup, les six phases, le suivi à chaque réveil, l'arrêt d'un chantier
      references/      CONTENU.md
    recette-humaine/
      SKILL.md         quand, les règles du jeu, les quatre phases
      references/      la méthode : familles de défauts, grilles, gabarit de l'inventaire
```

Les bancs (`pnpm test`, joués aussi par la CI) demandent Node ≥ 22, `git` et `jq` (`sudo apt install jq` ou `brew install jq`) ; sans `jq`, chaque banc de la chaîne échoue sur une ligne qui le dit.

## Ajouter un skill

1. Créer `skills/<categorie>/<nom>/SKILL.md`, avec un frontmatter `name` + `description`. La description décide **quand** le skill se déclenche : y mettre les branches, pas une paraphrase du titre.
2. Ajouter `"./skills/<categorie>/<nom>"` au tableau `skills` de `.claude-plugin/plugin.json`.
3. Ajouter une ligne au tableau ci-dessus.
4. **Bumper `version` dans `.claude-plugin/plugin.json`** — c'est ce champ que `claude plugin update maj-skills@maj` compare : sans bump, aucun changement de contenu n'est détecté chez ceux qui ont installé le plugin. Patch pour une correction, mineure pour un skill ou un gabarit ajouté, majeure quand un skill existant change de contrat.

Cette règle vaut pour **tout** changement de contenu, pas seulement l'ajout d'un skill.

Un skill dont l'étape `poser` copie un dossier de scripts dans `scripts/chaine/` d'un projet ajoute ce dossier à `POSES` dans `scripts/poses.test.mjs` : le garde pose ses fichiers à plat et rejoue ses bancs hors du plugin. Un banc posé ne lit jamais l'arbre du plugin sans repli vers le fichier du projet.

Ce qui dépasse une page va dans `references/`, atteint par un pointeur depuis `SKILL.md` — le corps du skill reste lisible, et les détails ne se chargent qu'au besoin.

> **Les liens à l'intérieur de `references/` ne résolvent pas dans ce dépôt, et c'est normal.** Ce sont des gabarits : leurs chemins relatifs visent le **projet généré**, pas l'arborescence du skill. Les cliquer depuis GitHub donne des 404 sans que rien ne soit cassé. Ce qui doit résoudre ici, ce sont les liens du `README.md`, des `SKILL.md` et de leurs `CONTENU.md`.

## Renommer

Deux chaînes à changer, et rien d'autre :

- `maj` — le nom du **marketplace**, dans `.claude-plugin/marketplace.json`. Il n'a pas à correspondre au nom du dépôt GitHub : c'est lui qu'on écrit après le `@` dans `claude plugin install <plugin>@<marketplace>`.
- `maj-skills` — le nom du **plugin**, dans les deux manifestes. C'est le préfixe d'invocation (`/maj-skills:<skill>`).

## Licence

MIT.
