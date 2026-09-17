import { existsSync, readdirSync } from "node:fs";
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
const racine = dirname(fileURLToPath(import.meta.url));
const briques = ["packages", "apps"].flatMap((dossier) => {
  const chemin = join(racine, dossier);
  if (!existsSync(chemin)) return [];
  return readdirSync(chemin, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => join(chemin, d.name))
    .sort();
});
const reglesBriques = (
  await Promise.all(
    briques.map(async (brique) => {
      const fichier = join(brique, "eslint.rules.mjs");
      if (!existsSync(fichier)) return [];
      const module = await import(pathToFileURL(fichier).href);
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
  ...reglesBriques,
);
