```bash
pnpm --filter @{{SCOPE}}/{{PROJET}}-api dev
```

L'API écoute sur **3000**. Deux routes existent : `GET /health` et Swagger UI sur `/docs` (hors production seulement), avec le contrat sur `/openapi.json`. Les valeurs de développement viennent de `apps/api/src/config/env.development.ts`.
