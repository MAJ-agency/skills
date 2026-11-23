import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

// Configuration ESLint de la racine : les règles communes à tout le monorepo.
//
// Chaque brique — service sous `apps/`, paquet sous `packages/` — porte SES
// règles dans son `eslint.rules.mjs` : un module qui exporte une fonction
// `({ globals }) => [blocs de config]`. Ce fichier les charge tous, paquets
// puis services, dans l'ordre alphabétique. Une brique sans fichier de règles
// n'ajoute rien. La racine ne connaît donc aucune stack : c'est le skill qui
// pose une brique qui pose ses règles, en bloc.
//
// ⚠️ Un seul bloc `no-restricted-imports` par groupe de fichiers : en flat
// config, deux blocs qui matchent le même fichier ne fusionnent PAS leurs
// options — le dernier écrase le premier. Tout ce qui concerne un groupe de
// fichiers vit donc dans un seul bloc, dans le fichier du service concerné.
const root = dirname(fileURLToPath(import.meta.url));
// Les scripts posés par le plugin maj-skills (`scripts/agent/`, `scripts/chaine/`…) : du code vendu, tenu par la CI
// du plugin, que le projet ne modifie jamais. Leur liste vit dans `.prettierignore`, entre `# socle:poses-du-plugin`
// et `# /socle:poses-du-plugin`, seule : ESLint la lit là, Prettier et lint-staged la suivent d'eux-mêmes. Sans le
// bloc, ESLint lirait ces scripts : la configuration le refuse, plutôt que de lire une liste vide.
const prettierignore = readFileSync(join(root, ".prettierignore"), "utf8")
  .split(/\r?\n/)
  .map((ligne) => ligne.trim());
const debutPoses = prettierignore.indexOf("# socle:poses-du-plugin");
const finPoses = prettierignore.indexOf("# /socle:poses-du-plugin");
if (debutPoses < 0 || finPoses < debutPoses)
  throw new Error(
    ".prettierignore : le bloc « # socle:poses-du-plugin » … « # /socle:poses-du-plugin » manque ; le reprendre du gabarit de socle-monorepo (NOTES-DE-VERSION.md du plugin, 8.3.1)",
  );
const posesDuPlugin = prettierignore
  .slice(debutPoses + 1, finPoses)
  .filter((ligne) => ligne && !ligne.startsWith("#"))
  .map((dossier) => `${dossier.replace(/\/$/, "")}/**`);
const bricks = ["packages", "apps"].flatMap((dir) => {
  const path = join(root, dir);
  if (!existsSync(path)) return [];
  return readdirSync(path, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(path, d.name))
    .sort();
});
const brickRules = (
  await Promise.all(
    bricks.map(async (brick) => {
      const file = join(brick, "eslint.rules.mjs");
      if (!existsSync(file)) return [];
      const module = await import(pathToFileURL(file).href);
      return module.default({ globals });
    }),
  )
).flat();

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/node_modules/**",
      "**/.turbo/**",
      "**/*.config.{js,cjs,mjs,ts}",
      "**/eslint.rules.mjs",
      ...posesDuPlugin,
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  // Paquets partagés : du TypeScript pur, exécutable côté Node comme côté client.
  {
    files: ["packages/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
  },
  // Un script de gate PARLE : console autorisée — à la racine comme dans une brique.
  {
    files: ["scripts/**/*.{mjs,ts}", "**/scripts/**/*.{mjs,ts}"],
    languageOptions: { globals: { ...globals.node } },
    rules: { "no-console": "off" },
  },
  // Règles propres à chaque brique (packages/<paquet>/ et apps/<service>/eslint.rules.mjs).
  // Le lint des tests, posé par le skill socle-tests (`eslint.tests.mjs` à la racine).
  ...(existsSync(join(root, "eslint.tests.mjs")) ? (await import(pathToFileURL(join(root, "eslint.tests.mjs")).href)).default : []),
  ...brickRules,
);
