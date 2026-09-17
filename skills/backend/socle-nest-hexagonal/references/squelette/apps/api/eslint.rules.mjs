// Règles ESLint propres au service API — chargées par eslint.config.mjs à la racine.
// Frontières hexagonales verrouillées par le lint — voir apps/api/CLAUDE.md.
//
// ⚠️ Un seul bloc `no-restricted-imports` par couche : en flat config, deux blocs
// qui matchent le même fichier ne fusionnent PAS leurs options — le dernier
// écrase le premier. Tout ce qui concerne une couche vit donc dans son bloc.
export default ({ globals }) => [
  // Node / TypeScript
  {
    files: ["apps/api/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
  },
  // Un script de gate PARLE : console autorisée.
  {
    files: ["apps/api/src/openapi/emit.ts"],
    rules: { "no-console": "off" },
  },
  // ---- Couche domaine : pure. Aucun framework, aucune I/O, aucune couche externe.
  {
    files: ["apps/api/src/domain/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@nestjs/*"],
              message:
                "Le domaine doit rester pur : aucun import @nestjs/* (apps/api/CLAUDE.md, Domain layer).",
            },
            {
              group: ["kysely", "kysely/*", "nestjs-zod", "nestjs-cls"],
              message:
                "Le domaine doit rester pur : ni Kysely, ni nestjs-zod, ni CLS (apps/api/CLAUDE.md, Domain layer).",
            },
            {
              group: ["@infrastructure/*", "@application/*", "**/infrastructure/**"],
              message:
                "Dépendance inversée : domain/ n'importe ni application/ ni infrastructure/ (apps/api/CLAUDE.md, Golden rule).",
            },
          ],
        },
      ],
    },
  },
  // ---- Couche application : @nestjs/common pour les décorateurs DI UNIQUEMENT.
  // Jamais un service concret (Logger → IAppLoggerService, ConfigService → port).
  {
    files: ["apps/api/src/application/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@nestjs/common",
              importNames: ["Logger"],
              message:
                "N'instancie pas Logger : injecte le port IAppLoggerService par token (apps/api/CLAUDE.md, Application layer).",
            },
          ],
          patterns: [
            {
              group: ["@nestjs/config", "@nestjs/axios"],
              message:
                "Couche application : dépends d'un port SPI typé, pas d'un module d'infra @nestjs (ConfigService, HttpService…).",
            },
            {
              group: ["kysely", "kysely/*", "nestjs-cls"],
              message:
                "La couche application ne touche jamais la base : passe par le port IUnitOfWork et un repository (apps/api/CLAUDE.md).",
            },
            {
              group: ["@infrastructure/*", "**/infrastructure/**"],
              message:
                "Dépendance inversée : application/ n'importe jamais infrastructure/ (apps/api/CLAUDE.md, Golden rule).",
            },
          ],
        },
      ],
    },
  },
];
