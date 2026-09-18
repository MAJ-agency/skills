# Monter la couche base de données

Status: ready-for-human
Type: task

`DATABASE_URL` et `DATABASE_MIGRATOR_URL` sont validées au démarrage et `compose.yaml` sert un PostgreSQL local, mais **aucun code ne touche la base** : ni `src/db/`, ni migration, ni repository.

Bloqué par : `1-modeliser-le-domaine` — une table sans domaine est une supposition.

## À faire

<!-- ══ TENANT-A ══ -->
1. `src/db/database.ts` — connexion Kysely, deux rôles : runtime restreint (`DATABASE_URL`), propriétaire pour les migrations (`DATABASE_MIGRATOR_URL`).
2. `src/db/migrations/` + un script `migrate` joué par le rôle propriétaire.
3. `kysely-codegen` → `src/db/types.ts`, **jamais écrit à la main, pas même un champ**. Scripts `db:types` et `db:types:check`.
4. L'adapter `IUnitOfWork.run(work)` : transaction + propagation **ambiante** via un store de continuation (`nestjs-cls`), jamais un paramètre `trx` sur une méthode de port.
5. Ajouter `db:types:check` au gate anti-dérive de la CI, et le **gate d'appartenance** (`pare-feu-ci.md`) dès la première route possédée.
<!-- ══ /TENANT-A ══ -->
<!-- ══ TENANT-B ══ -->
1. `src/db/database.ts` — connexion Kysely, deux rôles : runtime restreint **et `NOBYPASSRLS`** (`DATABASE_URL`), propriétaire pour les migrations (`DATABASE_MIGRATOR_URL`). `compose.yaml` ne crée que le rôle propriétaire : la première migration crée le rôle runtime.
2. `src/db/migrations/` + un script `migrate` joué par le rôle propriétaire.
3. `kysely-codegen` → `src/db/types.ts`, **jamais écrit à la main, pas même un champ**. Scripts `db:types` et `db:types:check`.
4. L'adapter `IUnitOfWork.runInTenant(tenantId, work)` : transaction + réglage tenant posé en **`LOCAL`** + propagation **ambiante** via un store de continuation (`nestjs-cls`), jamais un paramètre `trx` sur une méthode de port. Vérifié par `ARC-2`.
5. Le **gabarit de migration d'une table tenant** : `tenant_id NOT NULL`, `ENABLE` + `FORCE ROW LEVEL SECURITY`, politique `USING` + `WITH CHECK` fail-closed sur le réglage de session ; et l'**allowlist versionnée** des tables hors tenant (vide au départ, chaque entrée justifiée par une ADR).
6. Ajouter `db:types:check` et le **gate anti-fuite tenant** (introspection SQL, fuite cross-tenant, fuite de GUC — `pare-feu-ci.md`) aux gates de la CI.
7. Vérifier **avant de s'engager** que l'hébergement cible (`2-hebergement-et-trust-proxy`) permet de créer un rôle `NOBYPASSRLS` sur son PostgreSQL managé. C'est éliminatoire.
<!-- ══ /TENANT-B ══ -->
<!-- ══ ROLES-B ══ -->
8. La table d'**affectation des rôles** (qui porte quel rôle, dans quel tenant si multi-tenant), tenant-scopée comme les autres si la RLS s'applique ; le catalogue lui-même reste dans `packages/contracts/src/roles.ts`.
<!-- ══ /ROLES-B ══ -->

## Rappels non négociables

- **Kysely, jamais un ORM.** Pas de TypeORM, pas de Prisma, pas de décorateur d'entité.
- Les types de lignes **ne sortent jamais du repository**.
- Le mapping ligne ↔ modèle reste **privé** au repository.

## Comments
