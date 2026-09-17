# Ce que contient le service, et pourquoi

Inventaire des gabarits du socle API, avec la raison d'être de chacun. À lire quand une règle du socle paraît arbitraire. La racine du monorepo (méthode, hooks, configuration commune) est décrite dans le `CONTENU.md` de `socle-monorepo`.

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
- **`eslint.rules.mjs`** — les frontières hexagonales verrouillées par `no-restricted-imports`, chargées par l'ESLint racine. **Un seul bloc par couche** : en flat config, deux blocs qui matchent le même fichier ne fusionnent pas leurs options, le dernier écrase le premier. C'est un piège coûteux.
- **`tsconfig.arch.json`** — compile `domain/` + `application/` **sans** `infrastructure/`. Si ça casse, une dépendance pointe dans le mauvais sens.
- **`packages/contracts`** — les schémas Zod du contrat interne, consommés par l'API et, plus tard, par ses clients.
- **`compose.yaml`** — PostgreSQL sur **5433**, pas 5432 : pour ne pas entrer en conflit avec une instance locale. Fichier de racine, mais posé par ce skill : c'est l'API qui en a besoin.

## Fragments de racine — `fragments/`

Ce que le service ajoute aux fichiers génériques de la racine : ses lignes dans la carte d'orientation de `CLAUDE.md`, sa sous-arborescence, ses commandes et ses règles dans `README.md`, son bloc de variables dans `.env.example`, ses fichiers générés dans `.prettierignore`. Un fragment par zone, inséré au-dessus du marqueur `<!-- socle:… -->` correspondant.

## ADR — `adr/`

- **`ARC-0002`** — transactions et isolation, **à deux branches**. En garder une, supprimer l'autre. Une ADR qui laisse les deux options ouvertes n'a rien décidé.

## Tickets — `tickets/`

Ce que le service a délibérément laissé ouvert, en trois tickets : `04` couche base de données, `05` authentification, `06` journal d'audit. Tous dépendent de `01-modeliser-le-domaine`, déposé par `socle-monorepo`.

Les adapter au projet réel. Un ticket qui pose une question déjà tranchée est du bruit.
