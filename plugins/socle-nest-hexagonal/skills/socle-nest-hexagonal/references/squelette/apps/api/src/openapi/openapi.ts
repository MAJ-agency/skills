import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { OpenAPIObject } from "@nestjs/swagger";
import { cleanupOpenApiDoc, createZodDto } from "nestjs-zod";
import { ErreurDto } from "@{{SCOPE}}/{{PROJET}}-contracts";

/**
 * Corps d'erreur commun : la forme que le `DomainErrorFilter` global rend pour
 * tout refus. Déclarée UNE fois, en réponse `4XX` globale — pas endpoint par
 * endpoint : le filtre étant global, « toute route peut refuser avec ce corps »
 * est la vérité de l'API, et c'est ce que le document doit dire pour que le
 * canal d'erreur d'un client typé le soit aussi.
 */
class ErreurResponse extends createZodDto(ErreurDto) {}

/**
 * Document OpenAPI de l'API interne : généré depuis les schémas Zod via
 * nestjs-zod — le document n'est JAMAIS écrit à la main, Zod est la source de
 * vérité unique (apps/api/CLAUDE.md, Contract boundaries).
 *
 * Consommé par : Swagger UI (dev), l'émission `openapi:emit` (fichier committé
 * `openapi.json`), et la génération d'un client typé le jour où un client existe.
 */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle("{{TITRE}} — API interne")
    .setDescription("Contrat interne du portefeuille de licence numérique.")
    .setVersion("0.0.1")
    .addGlobalResponse({
      status: "4XX",
      type: ErreurResponse,
      description:
        "Refus (domaine, accès ou validation) : `code` stable du domaine + `message` prescriptif.",
    })
    .build();
  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
}
