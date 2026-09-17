| `pnpm --filter @{{SCOPE}}/{{PROJET}}-api check:arch` | `domain/` + `application/` compilent sans `infrastructure/`    |
| `pnpm --filter @{{SCOPE}}/{{PROJET}}-api check:cycles` | dépendances circulaires (dpdm)                               |
| `pnpm --filter @{{SCOPE}}/{{PROJET}}-api openapi:emit` | régénère `apps/api/openapi.json` depuis les schémas Zod      |
| `pnpm --filter @{{SCOPE}}/{{PROJET}}-api openapi:check` | gate : échoue si `openapi.json` a dérivé des schémas        |
| `docker compose up -d`                               | PostgreSQL local sur **5433**                                  |
