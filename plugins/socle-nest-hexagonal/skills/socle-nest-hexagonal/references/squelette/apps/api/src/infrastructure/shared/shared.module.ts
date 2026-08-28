import { Global, Module } from "@nestjs/common";
import { APP_LOGGER_SERVICE } from "@domain/shared/spi/app-logger.spi";
import { CLOCK } from "@domain/shared/spi/clock.spi";
import { ID_GENERATOR } from "@domain/shared/spi/id-generator.spi";
import { NestAppLogger } from "./logging/nest-app-logger";
import { SystemClock } from "./date-time/system-clock";
import { UuidV7Generator } from "./id/uuid-v7.generator";

/**
 * Racine de composition des ports techniques transverses. `@Global` : ces trois
 * ports sont attendus par presque tout use case, les ré-importer dans chaque
 * module de feature serait du bruit sans contrepartie.
 *
 * C'est ici — et NULLE PART ailleurs — que les classes concrètes apparaissent
 * (apps/api/CLAUDE.md, Dependency injection). Partout ailleurs on injecte
 * l'interface par son token.
 */
@Global()
@Module({
  providers: [
    { provide: APP_LOGGER_SERVICE, useClass: NestAppLogger },
    { provide: CLOCK, useClass: SystemClock },
    { provide: ID_GENERATOR, useClass: UuidV7Generator },
  ],
  exports: [APP_LOGGER_SERVICE, CLOCK, ID_GENERATOR],
})
export class SharedModule {}
