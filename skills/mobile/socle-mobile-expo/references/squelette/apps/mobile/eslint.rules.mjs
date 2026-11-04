// Règles ESLint propres au client mobile — chargées par eslint.config.mjs à la racine.
// Même architecture que le client web : routes minces, features feuilles, lib/ en
// dessous de tout — voir apps/mobile/CLAUDE.md.
//
// ⚠️ Un seul bloc `no-restricted-imports` par groupe de fichiers : en flat config,
// deux blocs qui matchent le même fichier ne fusionnent PAS leurs options — le
// dernier écrase le premier. Les groupes ci-dessous sont DISJOINTS et chaque bloc
// porte la totalité de ses interdits.
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import reactHooks from "eslint-plugin-react-hooks";

const here = dirname(fileURLToPath(import.meta.url));
const featuresDir = join(here, "src", "features");

/** Cliquet de dette des imports entre features — vide sur un projet neuf. Même contrat que le web. */
export const FEATURE_DEBT = {};

export const features = existsSync(featuresDir)
  ? readdirSync(featuresDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort()
  : [];

// Interdits valables partout dans l'app : chemins relatifs remontants, imports
// profonds, et les deux pièges mobiles — un jeton hors du Keychain, un style
// hors de NativeWind.
const COMMON_RESTRICTIONS = {
  paths: [
    {
      name: "react-native",
      importNames: ["StyleSheet"],
      message:
        "Pas de StyleSheet : NativeWind (className) partout (apps/mobile/CLAUDE.md, Components).",
    },
  ],
  patterns: [
    {
      group: ["../*"],
      message:
        "Pas d'import relatif remontant : utiliser l'alias `@/…` (apps/mobile/CLAUDE.md, Imports).",
    },
    {
      group: ["@{{SCOPE}}/*/src/*"],
      message:
        "Importer depuis le barrel du paquet, jamais un chemin interne (packages/CLAUDE.md).",
    },
    {
      group: ["@react-native-async-storage/*", "expo-secure-store"],
      message:
        "Un jeton vit dans lib/secure-store.ts et nulle part ailleurs ; AsyncStorage n'accueille jamais un secret (apps/mobile/CLAUDE.md, Session).",
    },
  ],
};

const toFeatures = (except = []) =>
  features
    .filter((f) => !except.includes(f))
    .flatMap((f) => [`@/features/${f}`, `@/features/${f}/*`]);

const block = (files, extraPatterns = [], allowSecureStore = false) => ({
  files,
  rules: {
    "no-restricted-imports": [
      "error",
      {
        paths: COMMON_RESTRICTIONS.paths,
        patterns: [
          ...COMMON_RESTRICTIONS.patterns.filter((p) =>
            allowSecureStore ? !p.group.includes("expo-secure-store") : true,
          ),
          ...extraPatterns,
        ],
      },
    ],
  },
});

export default ({ globals }) => [
  // Sorties générées : jamais lintées.
  {
    ignores: [
      "apps/mobile/.expo/**",
      "apps/mobile/dist/**",
      "apps/mobile/android/**",
      "apps/mobile/ios/**",
      "apps/mobile/expo-env.d.ts",
      "apps/mobile/nativewind-env.d.ts",
    ],
  },
  {
    files: ["apps/mobile/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
    },
  },
  // ---- features/<F> : une feuille. Jamais une autre feature, sauf dette déclarée.
  ...features.map((f) =>
    block(
      [`apps/mobile/src/features/${f}/**/*.{ts,tsx}`],
      toFeatures([f, ...(FEATURE_DEBT[f] ?? [])]).length
        ? [
            {
              group: toFeatures([f, ...(FEATURE_DEBT[f] ?? [])]),
              message: `features/${f} n'importe jamais une autre feature : ce qui est partagé va dans components/shared, lib/ ou packages/ (apps/mobile/CLAUDE.md, Features).`,
            },
          ]
        : [],
    ),
  ),
  // ---- lib/ : le socle transverse — seul endroit autorisé à toucher le Keychain.
  block(
    ["apps/mobile/src/lib/**/*.{ts,tsx}"],
    [
      {
        group: ["@/features/*", "@/components/*", "@/app/*"],
        message:
          "lib/ est en dessous de tout : il n'importe ni features/, ni components/, ni app/ (apps/mobile/CLAUDE.md, Import direction).",
      },
    ],
    true,
  ),
  // ---- components/ : partagé, donc n'importe aucune feature.
  block(
    ["apps/mobile/src/components/**/*.{ts,tsx}"],
    [
      {
        group: ["@/features/*", "@/app/*"],
        message:
          "components/ est partagé : il n'importe jamais une feature ni une route (apps/mobile/CLAUDE.md, Import direction).",
      },
    ],
  ),
  // ---- app/ : des routes minces.
  block(["apps/mobile/app/**/*.{ts,tsx}"]),
];
