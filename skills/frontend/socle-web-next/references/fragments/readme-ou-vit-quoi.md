```
apps/web/                le client web Next.js
  CLAUDE.md              ⚠️ règles impératives front — à lire avant tout code
  docs/FRONTEND_GUIDELINES.md   le pourquoi des règles, avec exemples
  eslint.rules.mjs       frontières entre features, cliquet de dette
  src/
    app/                 routes UNIQUEMENT : page, layout, loading, error
    features/<module>/   une feature = une feuille : api/ hooks/ components/ index.ts
    components/ui/       primitives shadcn/ui vendored
    components/shared/   composants réutilisés par plusieurs features
    lib/                 socle transverse : client HTTP, query provider, clés, env
```
