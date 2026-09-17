// Règles ESLint propres au paquet d'utilitaires — chargées par eslint.config.mjs à la racine.
// Un utilitaire est une fonction pure, sans dépendance : il tourne côté Node comme côté client.
// Voir packages/CLAUDE.md.
export default () => [
  {
    files: ["packages/utils/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "zod",
                "react",
                "react-*",
                "react-native",
                "@nestjs/*",
                "nestjs-zod",
                "nestjs-cls",
                "kysely",
                "kysely/*",
                "next",
                "next/*",
                "expo",
                "expo-*",
              ],
              message:
                "Un utilitaire ne dépend d'aucun framework, ni de Zod : une fonction pure (packages/CLAUDE.md, Zero framework).",
            },
            {
              group: ["@{{SCOPE}}/*"],
              message:
                "Les paquets partagés ne dépendent pas les uns des autres (packages/CLAUDE.md, Flat).",
            },
          ],
        },
      ],
    },
  },
];
