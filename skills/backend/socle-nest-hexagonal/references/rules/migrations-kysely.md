---
paths:
  - "apps/api/src/db/**"
  - "apps/api/src/infrastructure/**/*.repository.ts"
  - "scripts/db/**"
  - "compose.yaml"
---

# Base de données, migrations Kysely et types générés

S'applique dès qu'on touche `src/db/`, une migration, un repository ou le Postgres local. Décisions : `apps/api/CLAUDE.md` § « Frozen architecture decisions » (Kysely, jamais un ORM), `ARC-2` (transactions et isolation). La couche est à monter par le ticket `4-couche-base-de-donnees` ; ses règles valent dès la première table.

## Nommage

| Quoi          | Convention                                        | Exemple                        |
| ------------- | ------------------------------------------------- | ------------------------------ |
| Table         | nom en code du glossaire, `snake_case`, singulier | `request`, `resource`          |
| Colonne       | `snake_case`                                      | `birth_date`, `created_at`     |
| Clé primaire  | `id` UUID v7, généré par le port `IIdGenerator`   |                                |
| Clé étrangère | `<table>_id`                                      | `request_id`                   |
| Horodatage    | `timestamptz`, `created_at` et `updated_at`       |                                |
| État          | `enum` PostgreSQL, valeurs en anglais             | `draft`, `active`, `closed`    |
| Montant       | entier en centimes, jamais `float`                | `amount_cents`                 |

Les identifiants SQL sont en anglais (`ARC-4`), les noms de code de `GLOSSARY.md` font foi.

## Règles

- **Toute table a** `id`, `created_at`, `updated_at`.
<!-- ══ TENANT-B ══ -->
- **Une table d'organisation a en plus `tenant_id NOT NULL`** (gabarit ci-dessous).
<!-- ══ /TENANT-B ══ -->
- **Suppression logique** par un état, jamais un `DELETE` sur une entité du domaine : le journal d'audit doit pouvoir la retrouver.
- **Index** sur chaque clé étrangère, chaque colonne d'état filtrée, chaque borne de date interrogée. Un index se justifie par une requête qui existe.
- **Les types de lignes sont générés** par `kysely-codegen` dans `src/db/types.ts`, jamais écrits à la main, pas même un champ. Ils ne sortent jamais du repository : le mapping ligne ↔ modèle est privé.
- **Kysely n'est importé que dans `infrastructure/`** et `src/db/`. Le lint et `check:arch` le refusent ailleurs.
- **SQL brut** : le tag `sql` de Kysely seulement, dans un repository ou une migration. Jamais une chaîne concaténée.

## Migrations

<!-- ══ TENANT-A ══ -->
- Une migration est **écrite à la main**, dans `src/db/migrations/<AAAAMMJJHHMM>-<slug>.ts`, jouée par le rôle propriétaire (`DATABASE_MIGRATOR_URL`). Le rôle runtime (`DATABASE_URL`) est restreint et ne migre jamais.
<!-- ══ /TENANT-A ══ -->
<!-- ══ TENANT-B ══ -->
- Une migration est **écrite à la main**, dans `src/db/migrations/<AAAAMMJJHHMM>-<slug>.ts`, jouée par le rôle propriétaire (`DATABASE_MIGRATOR_URL`). Le rôle runtime (`DATABASE_URL`) est `NOBYPASSRLS` et ne migre jamais.
<!-- ══ /TENANT-B ══ -->
- **Même commit** : la migration, les types régénérés (`db:types`) et le repository qui les consomme. `db:types:check` refuse une dérive.
- **Jamais éditer une migration existante.** On en écrit une nouvelle. Une migration jouée quelque part est figée.
- **Tout changement destructif est explicite et relu** : suppression de colonne, de table, de valeur d'enum, changement de type, colonne `NOT NULL` sans défaut. Jamais un outil qui « synchronise » le schéma.
- **Expand puis contract.** Dès que l'application est déployée en continu, l'ancien code tourne quelques secondes sur le nouveau schéma. Toute opération qui casse le code déployé se fait en deux déploiements : ajouter la nouvelle forme et écrire dans les deux, puis retirer l'ancienne forme dans un déploiement ultérieur. Un renommage est un expand/contract, jamais un `DROP` + `ADD`.

<!-- ══ TENANT-A ══ -->
## Gabarit d'une table

```sql
CREATE TABLE resource (
  id uuid PRIMARY KEY,
  -- colonnes métier
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

L'appartenance d'une ligne à un compte se prouve dans le cas d'usage (`ARC-2`) : une clé étrangère vers le compte n'est pas une preuve, c'est le `SELECT` du use case qui l'est.
<!-- ══ /TENANT-A ══ -->
<!-- ══ TENANT-B ══ -->
## Gabarit d'une table d'organisation

```sql
CREATE TABLE resource (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL,
  -- colonnes métier
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE resource ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource FORCE ROW LEVEL SECURITY;
CREATE POLICY resource_tenant ON resource
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);
```

Le réglage `app.tenant_id` est posé en **`LOCAL`** par l'adapter de `IUnitOfWork`, jamais autrement. Une table sans `tenant_id` entre dans l'allowlist versionnée, avec son ADR, sinon le gate d'introspection la refuse (`docs/methode/pare-feu-ci.md` § isolation).
<!-- ══ /TENANT-B ══ -->

## Seeds

Un seed vit dans `scripts/db/`, est rejouable (`ON CONFLICT DO NOTHING` ou équivalent) et porte des identifiants stables.
<!-- ══ TENANT-B ══ -->
C'est le seul endroit, avec les tests, où un identifiant d'organisation s'écrit en dur.
<!-- ══ /TENANT-B ══ -->
