# CLAUDE.md

{{TITRE}} — {{DESCRIPTION}}

**Le code, les commentaires, les commits (conventional commits) et la documentation sont en {{LANGUE}}.** Conserver cette convention.

> **État du dépôt — squelette technique, aucun métier.** L'API NestJS démarre et les gardes de qualité mordent, mais **aucun domaine n'est modélisé** : `application/` est vide, il n'y a pas de couche base de données, `CONTEXT.md` est vide et `docs/metier/` n'existe pas. Ce qui reste à faire et ce qui reste à trancher est **déposé en tickets** dans `docs/features/socle/issues/`. Ne rien supposer d'existant qui ne soit pas listé ici.

## Les règles vivent ici — carte d'orientation

| Document                                                                               | Fait autorité sur                                                                        |
| -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [`README.md`](README.md)                                                               | démarrage, outils, comment se repérer dans le dépôt (pour un humain)                     |
| [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md)                                             | **règles impératives back** — les lire avant d'écrire du code                            |
| [`apps/api/docs/ARCHITECTURE_GUIDELINES.md`](apps/api/docs/ARCHITECTURE_GUIDELINES.md) | le _pourquoi_ de l'hexagonal, avec exemples                                              |
| [`docs/adr/`](docs/adr/)                                                               | les décisions structurantes et leur _pourquoi_                                           |
| [`docs/methode/grilling.md`](docs/methode/grilling.md)                                 | **comment on interroge un plan** avant de l'écrire                                       |
| [`docs/methode/decisions.md`](docs/methode/decisions.md)                               | ADR, `CONTEXT.md`, registre de règles, documentation vivante                             |
| [`docs/methode/nomenclature.md`](docs/methode/nomenclature.md)                         | **nommer un document** : `<TRI>-<NNNN>-<slug>.md`, et le **registre des trigrammes**      |
| [`docs/methode/conception.md`](docs/methode/conception.md)                             | modules profonds, TDD, revue                                                             |
| [`docs/methode/pare-feu-ci.md`](docs/methode/pare-feu-ci.md)                            | les invariants vérifiés par la machine                                                   |
| [`CONTEXT.md`](CONTEXT.md)                                                             | le langage ubiquitaire (glossaire, et rien d'autre)                                      |

**Avant d'écrire la moindre ligne de code applicatif, lire [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md) en entier.**

Architecture : **hexagonale (ports & adapters)**, travail **domain-first**. Stack : **NestJS** · **Kysely** (jamais un ORM) · **Zod / `nestjs-zod`** (jamais `class-validator`) · **PostgreSQL** · **Vitest** · **pnpm** · Node ≥ 22.

Toute divergence par rapport à ces règles fait l'objet d'une **ADR**, justifiée — jamais d'un écart silencieux.

## Méthode de travail

1. **Grilling** — faire tomber les non-dits avant d'écrire quoi que ce soit. Protocole : [`docs/methode/grilling.md`](docs/methode/grilling.md). Le projet est neuf : il est **architectural**, donc questions → approches → design → **spec écrite**.
2. **Documentation** — glossaire, règles métier, ADR, spec technique. Format : [`docs/methode/decisions.md`](docs/methode/decisions.md).
3. **Code** — domain-first, TDD, en suivant [`apps/api/CLAUDE.md`](apps/api/CLAUDE.md).

Les documents fournis en cours de projet atterrissent dans [`docs/sources/`](docs/sources/) — ce sont des **entrées brutes**, pas de la spécification.

## Agent skills

### Issue tracker

Les issues et les specs vivent en markdown sous `docs/features/<feature>/` — pas de tracker externe, et **aucun dossier de travail hors de `docs/`**. Voir [`docs/agents/issue-tracker.md`](docs/agents/issue-tracker.md).

### Triage labels

Les cinq rôles canoniques, sans renommage, portés par une ligne `Status:` en tête de chaque ticket. Voir [`docs/agents/triage-labels.md`](docs/agents/triage-labels.md).

### Domain docs

Contexte unique : `CONTEXT.md` + `docs/adr/` à la racine. Voir [`docs/agents/domain.md`](docs/agents/domain.md).
