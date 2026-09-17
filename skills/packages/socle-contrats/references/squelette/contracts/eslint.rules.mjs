// Règles ESLint propres au paquet de contrats — chargées par eslint.config.mjs à la racine.
// Un contrat est du TypeScript pur + Zod : il tourne côté Node comme côté client.
// Voir packages/CLAUDE.md.
export default () => [
  {
    files: ["packages/contracts/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
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
                "Un contrat ne dépend d'aucun framework : Zod et rien d'autre (packages/CLAUDE.md, Zero framework).",
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
