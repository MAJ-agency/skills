# Ce que contient le socle, et pourquoi

Inventaire des gabarits, avec la raison d'être de chacun. À lire quand une règle du socle paraît arbitraire.

## Méthode — `methode/`

Quatre documents qui font autorité sur la façon de travailler.

| Fichier              | Ce qu'il porte                                                                                                                     |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `grilling.md`        | L'arbre de décision et sa **frontière** ; le déroulé par tours, chaque question accompagnée d'une recommandation ; « les faits sont ton travail, les décisions sont celles de l'humain » ; le cycle `candidate → validée` qu'aucune machine ne franchit ; le re-grilling daté d'une décision. |
| `decisions.md`       | Les **trois critères** pour écrire une ADR (difficile à défaire, surprenante, vrai arbitrage) ; le format MADR ; les règles de tenue du glossaire ; le registre de règles métier ; la documentation vivante en trois couches ; comment écrire pour un agent. |
| `nomenclature.md`    | `<TRI>-<NNNN>-<slug>.md`, le registre des trigrammes, la procédure d'en créer un, et les quatre thèmes de `docs/`.                  |
| `conception.md`      | Le vocabulaire des **modules profonds** (module, interface, profondeur, couture, adapter, levier, localité) ; la boucle TDD et ses anti-patterns ; la revue sur deux axes. |
| `pare-feu-ci.md`     | « Aucun invariant critique ne dépend d'un relecteur » ; l'activation d'un gate **au sprint où apparaît la surface qu'il protège** ; le catalogue des gates, dont les deux branches du gate d'isolation. |

## Règles back — `api/`

- **`CLAUDE.md`** — les contraintes impératives, en anglais pour rester diffable : règle d'or des dépendances (`infrastructure → application → domain`), alias de chemins obligatoires, décisions gelées, règles par couche, invariants (concurrence, idempotence, authentification, journal d'audit), frontières de contrat, nommage des ports, injection par token, stratégie de test, definition of done, ordre de génération domain-first.
- **`docs/ARCHITECTURE_GUIDELINES.md`** — le _pourquoi_, avec exemples de code et check-lists. Les exemples utilisent un domaine placeholder (`Demande`, `Ressource`) **explicitement étiqueté** : il illustre une forme, pas un métier.

## Squelette de code — `squelette/`

Ce qui démarre, et pourquoi c'est là plutôt qu'ailleurs.

- **`main.ts`** — `rawBody` (vérifier une signature de webhook sur l'octet exact ; l'ajouter après coup est une régression silencieuse), `cookieParser`, `ZodValidationPipe` global, `DomainErrorFilter` global, CORS, Swagger **hors production seulement**. `trust proxy` **non configuré**, avec le commentaire qui explique quand et comment le régler.
- **`app.module.ts`** — n'assemble que des modules. Aucun provider en direct : chaque module de feature câble le sien par token.
- **`shared.module.ts`** — `@Global`, câble les trois ports techniques (journalisation, horloge, identifiants). **C'est le seul endroit du dépôt où des classes concrètes apparaissent.**
- **Journalisation** — port `IAppLoggerService` côté domaine, adapter côté infrastructure : seul endroit où `new Logger()` est légitime. Le lint interdit l'import ailleurs.
- **Erreurs** — `DomainError` abstraite portant un code stable, filtre global qui traduit en statut HTTP. **Table livrée vide**, avec la procédure d'ajout, une grille de choix du statut et la règle « ne jamais faire d'un refus un oracle ».
- **Horloge et identifiants** — injectés par token. Une horloge injectée rend déterministe tout test dépendant de l'instant ; les UUID v7 sont frappés côté application, jamais par la base.
- **`config/`** — environnement validé par Zod **au démarrage**, fail-fast, avec durcissement production (secrets longs, origine https). Les valeurs de développement sont **committées** dans `env.development.ts` et ne sont jamais injectées en production. Sous Vitest, le `.env` de la machine n'est pas chargé : les tests restent déterministes.
- **`openapi/`** — document dérivé des schémas Zod, jamais écrit à la main, avec un gate anti-dérive (`openapi:check`).
- **`health/`** — sonde de vie qui ne dit **rien** de l'état interne : ni version, ni base, ni dépendances. Une sonde bavarde est une surface de reconnaissance.

## Configuration — `squelette/racine/` et `squelette/husky/`

- **`eslint.config.mjs`** — les frontières hexagonales verrouillées par `no-restricted-imports`. **Un seul bloc par couche** : en flat config, deux blocs qui matchent le même fichier ne fusionnent pas leurs options, le dernier écrase le premier. C'est un piège coûteux.
- **`tsconfig.arch.json`** — compile `domain/` + `application/` **sans** `infrastructure/`. Si ça casse, une dépendance pointe dans le mauvais sens.
- **Husky** — `commit-msg` (commitlint), `pre-commit` (lint-staged + point d'extension local), `pre-push` (`pnpm check`), et les **relais** `post-commit` / `post-checkout` vers graphify, indispensables parce que Husky détourne `core.hooksPath`.
- **`compose.yaml`** — PostgreSQL sur **5433**, pas 5432 : pour ne pas entrer en conflit avec une instance locale.

## ADR — `adr/`

- **`ARC-0001`** — la nomenclature `<TRI>-<NNNN>-<slug>.md`, avec ses alternatives écartées.
- **`ARC-0002`** — transactions et isolation, **à deux branches**. En garder une, supprimer l'autre. Une ADR qui laisse les deux options ouvertes n'a rien décidé.

## Tickets — `tickets/`

Ce que le socle a délibérément laissé ouvert, en neuf tickets. `01-modeliser-le-domaine` est bloquant : presque tout en dépend.

Les adapter au projet réel. Un ticket qui pose une question déjà tranchée est du bruit.
