# {{TITRE}}

{{DESCRIPTION}}

> **⚠️ Squelette technique, aucun métier.** L'API démarre (`/health`, Swagger), la configuration NestJS est en place et les gardes de qualité mordent — mais **aucun domaine n'est modélisé** : pas d'entité, pas de use case, pas de base. `CONTEXT.md` est vide.
>
> **Ce qui reste à faire et ce qui reste à trancher est déposé en tickets** dans [`docs/features/socle/issues/`](docs/features/socle/issues/). Commencer par `01-modeliser-le-domaine` : presque tout en dépend.

---

## Comment ce dépôt fonctionne

Le projet se construit en trois temps, dans cet ordre. Chaque étape a ses règles écrites, et rien ne commence avant que la précédente soit close.

```
1. GRILLING          les sources sont interrogées jusqu'à ce que rien
   docs/sources/      ne reste supposé en silence
        │             → docs/methode/grilling.md
        ▼
2. DOCUMENTATION     ce qui est tranché est écrit : vocabulaire, décisions,
   CONTEXT.md         règles métier
   docs/adr/          → docs/methode/decisions.md · docs/methode/nomenclature.md
   docs/metier/
        │
        ▼
3. CODE              domain-first, TDD, architecture hexagonale
   apps/api/          → apps/api/CLAUDE.md
```

**Le projet est neuf** : il n'a aucun flux existant à modifier. Toute demande de fonctionnalité est donc **architecturale** — questions, approches, design, puis spec écrite. Pas de code avant validation explicite.

## Où vit quoi

```
README.md                démarrage, outils, règles — ce fichier
CLAUDE.md                les mêmes repères, en instructions pour un agent
CONTEXT.md               glossaire du domaine (langage ubiquitaire) — et rien d'autre

apps/api/                le service NestJS
  CLAUDE.md              ⚠️ règles impératives back — à lire avant tout code
  docs/ARCHITECTURE_GUIDELINES.md   le pourquoi de l'hexagonal, avec exemples
  openapi.json           GÉNÉRÉ (openapi:emit) — jamais édité à la main
  src/
    domain/shared/       ports SPI transverses (logger, horloge, id) + DomainError
    application/         use cases — vide, le domaine n'est pas modélisé
    infrastructure/      adapters : logging, filtre d'erreurs, horloge, id
    config/              validation de l'environnement (Zod, fail-fast)
    openapi/             document OpenAPI dérivé des schémas Zod
    health/              sonde de vie
    main.ts              bootstrap : pipes, filtres, CORS, Swagger
    app.module.ts        racine de composition

packages/contracts/      schémas Zod du contrat interne

docs/                    TOUTE la documentation, triée par thème
  adr/                   décisions d'architecture — ARC-0001, ARC-0002…
  architecture/          guides techniques qui ne sont pas des décisions
  metier/                règles métier, référence fonctionnelle, réunions
  features/<slug>/       une feature : spec.md + issues/<NN>-<slug>.md
  methode/               comment on travaille (grilling, décisions, conception, CI)
  agents/                configuration des skills (tracker, labels, domaine)
  sources/               documents bruts fournis en entrée — pas de la spec

.husky/                  hooks git partagés par l'équipe
```

**Tout vit sous `docs/`, trié par thème** — il n'y a aucun dossier de travail à côté. Les dossiers naissent avec leur premier document.

Il n'y a **pas de sommaire** dans `docs/adr/` : le nom d'un fichier porte son identité (`ARC-0001`), donc lister le dossier suffit.

## Prérequis

| Outil      | Version                | Pour quoi                                                          |
| ---------- | ---------------------- | ------------------------------------------------------------------ |
| **Node**   | ≥ 22 (`.nvmrc`)        | lancer et construire l'API                                         |
| **pnpm**   | ≥ 9                    | gestionnaire de paquets du monorepo                                |
| **Docker** | —                      | PostgreSQL local (`compose.yaml`) — pas encore utilisé par le code |
| **git**    | —                      | tout                                                               |

## Démarrage

```bash
pnpm install
```

`pnpm install` installe Husky au passage : les hooks git de l'équipe sont posés sans geste supplémentaire.

```bash
pnpm --filter @{{SCOPE}}/{{PROJET}}-api dev
```

L'API écoute sur **3000**. Deux routes existent : `GET /health` et Swagger UI sur `/docs` (hors production seulement), avec le contrat sur `/openapi.json`.

Aucun `.env` n'est nécessaire en local : les valeurs de développement de `apps/api/src/config/env.development.ts` comblent tout ce qui manque. Pour des secrets locaux, copier `.env.example` en `.env` (gitignored) — `process.env` garde toujours la priorité.

### Vérifier

```bash
pnpm check
```

`build` + `lint` + `typecheck` + `check:cycles`. C'est aussi ce que joue le hook `pre-push`, donc un push qui casse la qualité est refusé avant d'atteindre le dépôt.

| Commande                                            | Effet                                                          |
| --------------------------------------------------- | -------------------------------------------------------------- |
| `pnpm build` · `pnpm lint` · `pnpm typecheck`       | par brique, orchestré par Turborepo                            |
| `pnpm test`                                          | Vitest                                                         |
| `pnpm --filter @{{SCOPE}}/{{PROJET}}-api check:arch` | `domain/` + `application/` compilent sans `infrastructure/`    |
| `pnpm --filter @{{SCOPE}}/{{PROJET}}-api check:cycles` | dépendances circulaires (dpdm)                               |
| `pnpm --filter @{{SCOPE}}/{{PROJET}}-api openapi:emit` | régénère `apps/api/openapi.json` depuis les schémas Zod      |
| `pnpm --filter @{{SCOPE}}/{{PROJET}}-api openapi:check` | gate : échoue si `openapi.json` a dérivé des schémas        |
| `docker compose up -d`                               | PostgreSQL local sur **5433**                                  |

### Puis lire, dans cet ordre

1. Ce fichier — tu y es.
2. [`docs/features/socle/issues/`](docs/features/socle/issues/) — ce qui reste à faire et à trancher.
3. [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md) — les règles impératives, **avant d'écrire une ligne de code**.

## Les règles à suivre

| Document                                                                               | Fait autorité sur                                                     |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md)                                             | **règles impératives back** — hexagonal, Kysely, Zod, sécurité, tests |
| [`apps/api/docs/ARCHITECTURE_GUIDELINES.md`](apps/api/docs/ARCHITECTURE_GUIDELINES.md) | le _pourquoi_ de l'hexagonal, avec exemples de code                   |
| [`docs/methode/grilling.md`](docs/methode/grilling.md)                                 | comment interroger un plan avant de l'écrire                          |
| [`docs/methode/decisions.md`](docs/methode/decisions.md)                               | quand écrire une ADR, tenir le glossaire et le registre de règles     |
| [`docs/methode/nomenclature.md`](docs/methode/nomenclature.md)                         | nommer un document, et créer un trigramme qui manque au registre      |
| [`docs/methode/conception.md`](docs/methode/conception.md)                             | modules profonds, TDD, revue                                          |
| [`docs/methode/pare-feu-ci.md`](docs/methode/pare-feu-ci.md)                            | les invariants que la machine doit garantir                           |

Quelques règles transverses, pour ne pas avoir à les chercher :

- **Tout est en {{LANGUE}}** — code, commentaires, commits (conventional commits), documentation. Deux exceptions assumées : `apps/api/CLAUDE.md` et `ARCHITECTURE_GUIDELINES.md` restent en anglais, pour rester diffables avec le gabarit d'origine.
- **Un document de contenu se nomme `<TRI>-<NNNN>-<slug>.md`** et se cite par son identifiant court (`ARC-0001`), jamais par son chemin. Si le sujet n'a pas de trigramme, **on l'inscrit au registre avant de créer le fichier**.
- **Aucun invariant critique ne dépend d'un relecteur** : chacun est un test bloquant en CI.
- **Rien n'est « validé » sans un geste humain.** Ni skill, ni agent n'écrit ce statut.

## Ce fichier doit rester vrai

Un README faux est pire que pas de README : il envoie chercher une commande qui n'existe pas, ou tait celle qui existe.

| Déclencheur                                       | À mettre à jour ici                    |
| ------------------------------------------------- | -------------------------------------- |
| Une commande de développement change              | **Démarrage**                          |
| Un outil devient nécessaire                       | **Prérequis**                          |
| Un dossier de premier niveau apparaît / disparaît | **Où vit quoi**                        |
| Une règle transverse est ajoutée ou levée         | **Les règles à suivre**                |
| Le premier module métier arrive                   | l'encadré d'état — il dit « aucun métier » |
