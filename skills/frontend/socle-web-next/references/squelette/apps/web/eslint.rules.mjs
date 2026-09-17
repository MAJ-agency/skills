// Règles ESLint propres au client web — chargées par eslint.config.mjs à la racine.
// Frontières entre features verrouillées par le lint — voir apps/web/CLAUDE.md.
//
// ⚠️ Un seul bloc `no-restricted-imports` par groupe de fichiers : en flat config,
// deux blocs qui matchent le même fichier ne fusionnent PAS leurs options — le
// dernier écrase le premier. Les groupes ci-dessous sont DISJOINTS (features/<F>,
// lib, components, app) et chaque bloc porte la totalité de ses interdits.
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import nextPlugin from "@next/eslint-plugin-next";

const ici = dirname(fileURLToPath(import.meta.url));
const dossierFeatures = join(ici, "src", "features");

/**
 * CLIQUET DE DETTE — couplages entre features TOLÉRÉS, gelés avec leur date.
 * Sur un projet neuf cette liste est VIDE et le reste. Sur un projet qui hérite
 * de couplages, on y inscrit l'existant (mesure du jour en commentaire), puis :
 *   • on n'y AJOUTE jamais une entrée pour faire passer un lot ;
 *   • on en RETIRE une dès que le couplage est résorbé — `pnpm check:dette`
 *     échoue si une entrée déclarée n'est plus utilisée, ce qui force son retrait.
 * Forme : { featureQuiImporte: ["featureImportee", …] }.
 */
export const DETTE_FEATURES = {};

export const features = existsSync(dossierFeatures)
  ? readdirSync(dossierFeatures, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
  : [];

const INTERDITS_COMMUNS = [
  {
    group: ["../*"],
    message:
      "Pas d'import relatif remontant : utiliser l'alias `@/…` — il dit d'où vient le module (apps/web/CLAUDE.md, Imports).",
  },
  {
    group: ["@{{SCOPE}}/*/src/*"],
    message: "Importer depuis le barrel du paquet, jamais un chemin interne (packages/CLAUDE.md).",
  },
];

const versFeatures = (sauf = []) =>
  features
    .filter((f) => !sauf.includes(f))
    .flatMap((f) => [`@/features/${f}`, `@/features/${f}/*`]);

const reglesNext = {
  ...(nextPlugin.configs?.recommended?.rules ?? {}),
  ...(nextPlugin.configs?.["core-web-vitals"]?.rules ?? {}),
};

export default ({ globals }) => [
  // Sorties générées par Next : jamais lintées. Un bloc `ignores` seul est global,
  // où qu'il soit dans la configuration.
  { ignores: ["apps/web/.next/**", "apps/web/out/**", "apps/web/next-env.d.ts"] },
  // Navigateur + Node (composants serveur, config) ; React, accessibilité, Next.
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      "@next/next": nextPlugin,
    },
    settings: { react: { version: "detect" } },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      ...reglesNext,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  // ---- features/<F> : une feuille. Jamais une autre feature, sauf dette déclarée.
  ...features.map((f) => ({
    files: [`apps/web/src/features/${f}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...INTERDITS_COMMUNS,
            ...(versFeatures([f, ...(DETTE_FEATURES[f] ?? [])]).length
              ? [
                  {
                    group: versFeatures([f, ...(DETTE_FEATURES[f] ?? [])]),
                    message: `features/${f} n'importe jamais une autre feature : ce qui est partagé va dans components/shared, lib/ ou packages/ (apps/web/CLAUDE.md, Features).`,
                  },
                ]
              : []),
          ],
        },
      ],
    },
  })),
  // ---- lib/ : le socle transverse. Ne connaît ni features/ ni components/.
  {
    files: ["apps/web/src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...INTERDITS_COMMUNS,
            {
              group: ["@/features/*", "@/components/*", "@/app/*"],
              message:
                "lib/ est en dessous de tout : il n'importe ni features/, ni components/, ni app/ (apps/web/CLAUDE.md, Import direction).",
            },
          ],
        },
      ],
    },
  },
  // ---- components/ : réutilisable par toutes les features, donc n'en importe aucune.
  {
    files: ["apps/web/src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...INTERDITS_COMMUNS,
            {
              group: ["@/features/*", "@/app/*"],
              message:
                "components/ est partagé : il n'importe jamais une feature ni une route (apps/web/CLAUDE.md, Import direction).",
            },
          ],
        },
      ],
    },
  },
  // ---- app/ : des routes minces, qui importent par alias.
  {
    files: ["apps/web/src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { patterns: INTERDITS_COMMUNS }],
    },
  },
];
