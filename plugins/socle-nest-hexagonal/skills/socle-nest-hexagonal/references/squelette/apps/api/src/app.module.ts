import { Module } from "@nestjs/common";
import { SharedModule } from "./infrastructure/shared/shared.module";
import { HealthModule } from "./health/health.module";

/**
 * Racine de composition. Elle n'assemble QUE des modules — aucun provider, aucun
 * contrôleur en direct : chaque module de feature câble ses propres use cases,
 * repositories et adapters par token (apps/api/CLAUDE.md, Module organization).
 *
 * Un module de feature s'ajoute ici au moment où il naît. Le projet n'en a
 * encore aucun : son domaine n'est pas modélisé.

 */
@Module({
  imports: [SharedModule, HealthModule],
})
export class AppModule {}
