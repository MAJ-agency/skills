# skills

Skills d'ingénierie maison, installables comme **un seul plugin Claude Code**. Même forme que [`mattpocock/skills`](https://github.com/mattpocock/skills) : un plugin, plusieurs skills groupés par catégorie.

Ces skills ne portent **aucune règle métier**. Ce sont des règles de configuration, d'architecture et de méthode — réutilisables d'un projet à l'autre.

## Installer

```bash
claude plugin marketplace add MAJ-agency/skills
claude plugin install maj-skills@maj
```

Une installation, tous les skills disponibles. Pour mettre à jour :

```bash
claude plugin marketplace update maj
```

## Les skills

### `backend/`

| Skill                                                                  | Ce qu'il fait                                                                                              |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [`socle-nest-hexagonal`](skills/backend/socle-nest-hexagonal/SKILL.md) | Amorce un backend NestJS hexagonal complet dans un dépôt vide, et dépose en tickets ce qui reste à trancher |

Invocation : `/maj-skills:socle-nest-hexagonal`.

## `socle-nest-hexagonal` en deux mots

**Un service qui démarre.** NestJS 11, TypeScript strict, monorepo pnpm + Turborepo. `GET /health` répond, Swagger UI est servi hors production, le document OpenAPI est **généré depuis les schémas Zod** avec un gate anti-dérive.

**Une architecture verrouillée par la machine.** Hexagonal ports & adapters, dépendances vers l'intérieur uniquement. Les frontières ne sont pas que documentées : `no-restricted-imports` les fait échouer au lint, et `check:arch` compile `domain/` + `application/` sans `infrastructure/` pour prouver que la règle d'or tient.

**Les ports techniques déjà câblés.** Journalisation, horloge et identifiants injectés par token — jamais un `new Logger()` ni un `new Date()` en dur. Gestion des erreurs de domaine avec filtre global et table code → statut HTTP livrée **vide**, accompagnée de sa procédure d'ajout.

**Une configuration qui refuse de mentir.** L'environnement est validé par Zod au démarrage, fail-fast, avec durcissement production. Les valeurs de développement sont committées et jamais injectées en production. Sous Vitest, le `.env` de la machine n'est pas chargé : les tests restent déterministes.

**Une méthode écrite.** Cinq documents qui font autorité : comment interroger un plan (grilling), quand écrire une ADR, comment nommer un document, comment concevoir un module profond, quels invariants la machine doit garantir.

**Une documentation structurée.** Tout sous `docs/`, trié par thème — ADR, architecture, métier, features. Nomenclature `<TRI>-<NNNN>-<slug>.md` avec registre de trigrammes, pour qu'une référence ne casse jamais au déplacement d'un fichier.

**L'outillage agent installé.** graphify avec ses hooks, les skills Matt Pocock et superpowers, et la configuration `docs/agents/` produite en invoquant `setup-matt-pocock-skills` — pas recopiée à la main.

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
  backend/
    socle-nest-hexagonal/
      SKILL.md         le processus, en sept étapes
      references/      gabarits copiés verbatim par le skill
```

## Ajouter un skill

1. Créer `skills/<categorie>/<nom>/SKILL.md`, avec un frontmatter `name` + `description`. La description décide **quand** le skill se déclenche : y mettre les branches, pas une paraphrase du titre.
2. Ajouter `"./skills/<categorie>/<nom>"` au tableau `skills` de `.claude-plugin/plugin.json`.
3. Ajouter une ligne au tableau ci-dessus.

Ce qui dépasse une page va dans `references/`, atteint par un pointeur depuis `SKILL.md` — le corps du skill reste lisible, et les détails ne se chargent qu'au besoin.

> **Les liens à l'intérieur de `references/` ne résolvent pas dans ce dépôt, et c'est normal.** Ce sont des gabarits : leurs chemins relatifs visent le **projet généré**, pas l'arborescence du skill. Les cliquer depuis GitHub donne des 404 sans que rien ne soit cassé. Ce qui doit résoudre ici, ce sont les liens du `README.md`, des `SKILL.md` et de leurs `CONTENU.md`.

## Renommer

Deux chaînes à changer, et rien d'autre :

- `maj` — le nom du **marketplace**, dans `.claude-plugin/marketplace.json`. Il n'a pas à correspondre au nom du dépôt GitHub : c'est lui qu'on écrit après le `@` dans `claude plugin install <plugin>@<marketplace>`.
- `maj-skills` — le nom du **plugin**, dans les deux manifestes. C'est le préfixe d'invocation (`/maj-skills:<skill>`).

## Licence

MIT.
