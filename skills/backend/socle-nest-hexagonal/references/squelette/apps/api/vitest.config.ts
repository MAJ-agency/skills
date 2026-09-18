import { defineConfig } from "vitest/config";
import swc from "unplugin-swc";
import { resolve } from "node:path";

// Alias hexagonaux : miroir des `paths` de tsconfig.json. On les déclare via
// resolve.alias (natif Vite) plutôt qu'un plugin, pour rester insensible aux
// versions (vite-tsconfig-paths v6 exige Vite 6, or Vitest 2.1 embarque Vite 5).
const r = (p: string): string => resolve(__dirname, p);

export default defineConfig({
  test: {
    globals: false,
    environment: "node",
    // Le critère : le besoin d'infrastructure. Une suite qui exige Postgres se
    // nomme `*.db.spec.ts` ; elle est exclue ici et jouée par `test:db`
    // (vitest.db.config.ts), en CI avec le service. Tout le reste tourne partout :
    // au pre-commit, au pre-push, sans base.
    exclude: ["**/node_modules/**", "**/dist/**", "**/*.db.spec.ts"],
  },
  resolve: {
    alias: {
      "@domain": r("src/domain"),
      "@application": r("src/application"),
      "@infrastructure": r("src/infrastructure"),
      "@shared": r("src/domain/shared"),
      "@test": r("src/utils/tests"),
      "@db": r("src/db"),
    },
  },
  plugins: [
    swc.vite({
      module: { type: "es6" },
      jsc: {
        parser: {
          syntax: "typescript",
          decorators: true,
        },
        transform: {
          decoratorMetadata: true,
        },
      },
    }),
  ],
});
