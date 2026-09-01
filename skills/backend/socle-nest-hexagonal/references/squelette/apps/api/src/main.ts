import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Logger } from "@nestjs/common";
import { ZodValidationPipe } from "nestjs-zod";
import cookieParser from "cookie-parser";
import { SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { DomainErrorFilter } from "./infrastructure/shared/filters/domain-error.filter";
import { env } from "./config/env-configuration";
import { buildOpenApiDocument } from "./openapi/openapi";

async function bootstrap(): Promise<void> {
  // rawBody : conserve le corps brut des requêtes. Indispensable pour vérifier
  // une signature HMAC de webhook AVANT toute désérialisation — vérifier sur le
  // corps re-sérialisé ne prouve rien (l'octet exact compte). Posé dès
  // maintenant : l'ajouter après coup est une régression silencieuse.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

  // `trust proxy` — DÉLIBÉRÉMENT NON CONFIGURÉ pour l'instant.
  //
  // Derrière un proxy (routeur d'hébergeur, CDN), la connexion TCP vient du
  // proxy : `req.ip` serait le même pour tout le monde. D'où l'en-tête
  // `X-Forwarded-For`, que chaque intermédiaire COMPLÈTE. Piège : le client
  // peut en envoyer un lui-même, et le proxy ajoute sa ligne EN DESSOUS. La
  // valeur la plus à gauche est donc écrite par le client — un mensonge
  // possible. `trust proxy: N` dit « j'ai N intermédiaires à moi ; remonte de
  // N crans depuis la connexion ».
  //
  // Se tromper coûte cher, dans les deux sens :
  //   trop haut (`true`, ou 2 alors qu'il n'y en a qu'un) → le client choisit
  //     son IP, il change à chaque requête, tout comptage par IP est contourné ;
  //   trop bas  → tout le monde partage l'IP du proxy, le premier bruyant fait
  //     bloquer les autres.
  //
  // Pourquoi rien ici : (1) AUCUN code ne lit `req.ip` — pas d'auth, pas de
  // compteur de cadence ; (2) l'hébergement n'est pas encore décidé, donc
  // le nombre d'intermédiaires est inconnu. Poser un chiffre serait inventer
  // une topologie. Le défaut d'Express échoue du bon côté : trop restrictif,
  // jamais contournable.
  //
  // ➜ À CONFIGURER au premier des deux événements : un endpoint qui compte par
  //    IP, ou une mise en production derrière un proxy. Le nombre se VÉRIFIE
  //    (envoyer un `X-Forwarded-For` bidon depuis une IP connue, comparer à ce
  //    que l'app journalise), il ne se devine pas.

  app.use(cookieParser());
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new DomainErrorFilter());
  app.enableCors({ origin: env.CORS_ORIGIN, credentials: true });

  // Swagger UI + /openapi.json hors production : le contrat interne se lit en
  // dev, il ne s'expose pas en prod.
  if (env.NODE_ENV !== "production") {
    SwaggerModule.setup("docs", app, buildOpenApiDocument(app), {
      jsonDocumentUrl: "openapi.json",
    });
  }

  await app.listen(env.PORT);
  new Logger("Bootstrap").log(
    `API {{TITRE}} → http://localhost:${env.PORT} (${env.NODE_ENV})`,
  );
}

void bootstrap();
