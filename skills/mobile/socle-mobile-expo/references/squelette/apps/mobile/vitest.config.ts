import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// Périmètre des tests unitaires : la logique PURE de src/lib et des features,
// sans import React Native ni Expo (apps/mobile/CLAUDE.md, Testing). Environnement
// Node à dessein : un test qui touche au natif échoue immédiatement.
export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
  resolve: {
    alias: { "@": resolve(__dirname, "src") },
  },
});
