import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// Périmètre des tests unitaires : la logique PURE de src/lib et des features
// (apps/web/CLAUDE.md, Testing). Environnement node, à dessein : un test qui
// touche au DOM échoue immédiatement et visiblement — le rendu est couvert par
// Playwright, pas par un cinquième outil.
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
