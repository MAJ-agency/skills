```
apps/api/                le service NestJS
  CLAUDE.md              ⚠️ règles impératives back — à lire avant tout code
  docs/ARCHITECTURE_GUIDELINES.md   le pourquoi de l'hexagonal, avec exemples
  openapi.json           GÉNÉRÉ (openapi:emit) — jamais édité à la main
  src/
    domain/shared/       ports SPI transverses (logger, horloge, id) + DomainError
    application/         use cases — vide, le domaine n'est pas modélisé
    infrastructure/      adapters : logging, filtre d'erreurs, horloge, id
    config/              validation de l'environnement (Zod, fail-fast)
    openapi/             document OpenAPI dérivé des schémas Zod
    health/              sonde de vie
    main.ts              bootstrap : pipes, filtres, CORS, Swagger
    app.module.ts        racine de composition

packages/contracts/      schémas Zod du contrat interne
compose.yaml             PostgreSQL local sur 5433
```
