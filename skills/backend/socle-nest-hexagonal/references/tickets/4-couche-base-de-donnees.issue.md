# Monter la couche base de données

Status: ready-for-human
Type: task

`DATABASE_URL` et `DATABASE_MIGRATOR_URL` sont validées au démarrage et `compose.yaml` sert un PostgreSQL local, mais **aucun code ne touche la base** : ni `src/db/`, ni migration, ni repository.

Bloqué par : `1-modeliser-le-domaine` — une table sans domaine est une supposition.

## À faire

1. `src/db/database.ts` — connexion Kysely, deux rôles : runtime restreint (`DATABASE_URL`), propriétaire pour les migrations (`DATABASE_MIGRATOR_URL`).
2. `src/db/migrations/` + un script `migrate` joué par le rôle propriétaire.
3. `kysely-codegen` → `src/db/types.ts`, **jamais écrit à la main, pas même un champ**. Scripts `db:types` et `db:types:check`.
4. L'adapter `IUnitOfWork` : transaction + propagation **ambiante** via un store de continuation (`nestjs-cls`), jamais un paramètre `trx` sur une méthode de port.
5. Ajouter `db:types:check` au gate anti-dérive de la CI.

## Rappels non négociables

- **Kysely, jamais un ORM.** Pas de TypeORM, pas de Prisma, pas de décorateur d'entité.
- Les types de lignes **ne sortent jamais du repository**.
- Le mapping ligne ↔ modèle reste **privé** au repository.

## Comments
