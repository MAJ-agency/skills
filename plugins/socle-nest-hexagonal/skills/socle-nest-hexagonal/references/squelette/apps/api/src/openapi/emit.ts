import "reflect-metadata";
import { writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "../app.module";
import { buildOpenApiDocument } from "./openapi";

/**
 * Émet `apps/api/openapi.json` depuis l'application (sans l'écouter) — même
 * philosophie que les types générés : le fichier committé est GÉNÉRÉ, jamais
 * édité à la main, et `--check` (joué en CI) échoue s'il a dérivé des schémas
 * Zod. C'est le gate anti-drift du contrat (docs/methode/pare-feu-ci.md).
 */
const OUT_FILE = resolve(__dirname, "../../openapi.json");

async function emit(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  const contenu = `${JSON.stringify(buildOpenApiDocument(app), null, 2)}\n`;
  await app.close();

  if (process.argv.includes("--check")) {
    let actuel = "";
    try {
      actuel = readFileSync(OUT_FILE, "utf8");
    } catch {
      // absent : le check échoue ci-dessous
    }
    if (actuel !== contenu) {
      console.error(
        `✗ ${OUT_FILE} a dérivé des schémas Zod. Rejouer : pnpm --filter @{{SCOPE}}/{{PROJET}}-api openapi:emit`,
      );
      process.exit(1);
    }
    console.log(`✔ ${OUT_FILE} est à jour avec les schémas Zod.`);
    return;
  }

  writeFileSync(OUT_FILE, contenu);
  console.log(`✔ ${OUT_FILE} émis.`);
}

void emit();
