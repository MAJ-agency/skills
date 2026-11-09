# Monter la couche base de données

Status: ready-for-human
Type: task

`DATABASE_URL` et `DATABASE_MIGRATOR_URL` sont validées au démarrage et `compose.yaml` sert un PostgreSQL local, mais **aucun code ne touche la base** : ni `src/db/`, ni migration, ni repository.

Bloqué par : `1-modeliser-le-domaine` — une table sans domaine est une supposition.

## À faire

<!-- ══ TENANT-A ══ -->
1. `src/db/database.ts` — connexion Kysely, deux rôles : runtime restreint (`DATABASE_URL`), propriétaire pour les migrations (`DATABASE_MIGRATOR_URL`).
2. `src/db/migrations/` + un script `migrate` joué par le rôle propriétaire.
3. `kysely-codegen` → `src/db/types.ts`, **jamais écrit à la main, pas même un champ**. Scripts `db:types` et `db:types:check`, qui lisent une **base jetable** (§ « Base jetable » ci-dessous), jamais la base locale.
4. L'adapter `IUnitOfWork.run(work)` : transaction + propagation **ambiante** via un store de continuation (`nestjs-cls`), jamais un paramètre `trx` sur une méthode de port.
5. Ajouter `db:types:check` au gate anti-dérive de la CI, déclarer `src/db/types.ts` dans `scripts/docs/index-generes.json` si la chaîne de production est posée (`commande` : `db:types`, `verification` : `db:types:check`), et le **gate d'appartenance** (`docs/methode/pare-feu-ci.md` § isolation) dès la première route possédée.
<!-- ══ /TENANT-A ══ -->
<!-- ══ TENANT-B ══ -->
1. `src/db/database.ts` — connexion Kysely, deux rôles : runtime restreint **et `NOBYPASSRLS`** (`DATABASE_URL`), propriétaire pour les migrations (`DATABASE_MIGRATOR_URL`). `compose.yaml` ne crée que le rôle propriétaire : la première migration crée le rôle runtime.
2. `src/db/migrations/` + un script `migrate` joué par le rôle propriétaire.
3. `kysely-codegen` → `src/db/types.ts`, **jamais écrit à la main, pas même un champ**. Scripts `db:types` et `db:types:check`, qui lisent une **base jetable** (§ « Base jetable » ci-dessous), jamais la base locale.
4. L'adapter `IUnitOfWork.runInTenant(tenantId, work)` : transaction + réglage tenant posé en **`LOCAL`** + propagation **ambiante** via un store de continuation (`nestjs-cls`), jamais un paramètre `trx` sur une méthode de port. Vérifié par `ARC-2`.
5. Le **gabarit de migration d'une table tenant** : `tenant_id NOT NULL`, `ENABLE` + `FORCE ROW LEVEL SECURITY`, politique `USING` + `WITH CHECK` fail-closed sur le réglage de session ; et l'**allowlist versionnée** des tables hors tenant (vide au départ, chaque entrée justifiée par une ADR).
6. Déclarer `src/db/types.ts` dans `scripts/docs/index-generes.json` si la chaîne de production est posée (`commande` : `db:types`, `verification` : `db:types:check`). Ajouter `db:types:check` et le **gate anti-fuite tenant** (introspection SQL, fuite cross-tenant, fuite de GUC — `docs/methode/pare-feu-ci.md` § isolation) aux gates de la CI.
7. Vérifier **avant de s'engager** que l'hébergement cible (`2-hebergement-et-trust-proxy`) permet de créer un rôle `NOBYPASSRLS` sur son PostgreSQL managé. C'est éliminatoire.
<!-- ══ /TENANT-B ══ -->
<!-- ══ ROLES-B ══ -->
8. La table d'**affectation des rôles** (qui porte quel rôle, dans quel tenant si multi-tenant), tenant-scopée comme les autres si la RLS s'applique ; le catalogue lui-même reste dans `packages/contracts/src/roles.ts`.
<!-- ══ /ROLES-B ══ -->

## Base jetable

`db:types` et `db:types:check` ne lisent jamais la base locale de développement : elle porte les migrations de la dernière branche qui l'a touchée. Cas vécu : `types.ts` régénéré contre une base sans les migrations du sujet, une table entière effacée des types ; et « refuser si la base n'est pas à jour » laisse le cas inverse, une base qui a des migrations que la branche ignore.

- `src/db/scratch-database.ts` — `withScratchDatabase(adminUrl, fn)` : `CREATE DATABASE` d'un nom aléatoire (`<projet>_types_<hex>`, inséré par `sql.id`, jamais saisi) sur le serveur de `DATABASE_MIGRATOR_URL` ; préparée comme par le script `migrate` (mêmes préalables) puis migrée depuis zéro avec les migrations de l'arbre de travail ; `fn(urlJetable)` ; `DROP DATABASE … WITH (FORCE)` dans un `finally`, **même quand `fn` lève**. Même hôte, port et rôle que `adminUrl`, seul le nom change. Deux sessions sur la même machine ne se marchent pas dessus.
- `src/db/generate-types.ts` — enveloppe de `kysely-codegen` (`--url` de la base jetable, `--verify` pour `db:types:check`) ; l'URL vient de la configuration validée, pas d'un `.env` que la CI n'a pas.
- Le rôle migrateur doit pouvoir créer une base : c'est le superutilisateur de `compose.yaml` et du Postgres de service de la CI. Sans ce droit, un message clair (« le rôle de `DATABASE_MIGRATOR_URL` doit pouvoir créer une base »), **aucun repli** sur la base locale.
- Test `scratch-database.db.spec.ts` : la base est créée et migrée (une table de la première migration y est), puis supprimée ; supprimée aussi quand `fn` lève, l'erreur propagée ; un rôle sans droit est signalé sans appeler `fn` ; l'URL jetable ne change que le nom de la base.
- Avec la base jetable, `db:types:check` ne dépend plus d'un `db:migrate` préalable : le job de CI peut garder `db:migrate && db:types:check`.

## Rappels non négociables

- **Kysely, jamais un ORM.** Pas de TypeORM, pas de Prisma, pas de décorateur d'entité.
- Les types de lignes **ne sortent jamais du repository**.
- Le mapping ligne ↔ modèle reste **privé** au repository.

## Comments
