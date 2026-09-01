import { Injectable, Logger } from "@nestjs/common";
import type { IAppLoggerService } from "@domain/shared/spi/app-logger.spi";

/**
 * Adapter du port IAppLoggerService adossé au Logger NestJS. `new Logger()` est
 * légitime ICI (couche infrastructure) : c'est le seul endroit du dépôt qui
 * touche le framework de log. `meta` est sérialisé en suffixe structuré.
 */
@Injectable()
export class NestAppLogger implements IAppLoggerService {
  log(context: string, message: string, meta?: Record<string, unknown>): void {
    new Logger(context).log(this.format(message, meta));
  }

  warn(context: string, message: string, meta?: Record<string, unknown>): void {
    new Logger(context).warn(this.format(message, meta));
  }

  error(context: string, error: unknown, meta?: Record<string, unknown>): void {
    new Logger(context).error(this.format(String(error), meta));
  }

  private format(message: string, meta?: Record<string, unknown>): string {
    return meta ? `${message} ${JSON.stringify(meta)}` : message;
  }
}
