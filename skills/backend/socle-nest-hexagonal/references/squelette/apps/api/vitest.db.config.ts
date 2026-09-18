import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config";

// Les suites qui exigent Postgres (`*.db.spec.ts`) : `pnpm test:db`, joué en CI
// avec le service, jamais dans un hook. Même alias, même transformation.
export default mergeConfig(base, defineConfig({
  test: { include: ["src/**/*.db.spec.ts"], exclude: ["**/node_modules/**", "**/dist/**"] },
}));
