export const APP_LOGGER_SERVICE = "IAppLoggerService";

/**
 * Journalisation applicative (`apps/api/docs/ARCHITECTURE_GUIDELINES.md`,
 * section Logging). Port SPI transverse : l'application et le domaine loguent
 * en l'injectant par token, JAMAIS via `new Logger()` (couple au runtime
 * NestJS — gate lint `no-restricted-imports`). L'adapter infra l'adosse au
 * logger du framework.
 *
 * `context` = origine du log (nom de la classe), `meta` = données structurées.
 *
 * Un log technique est un diagnostic éphémère. Un ÉVÉNEMENT MÉTIER SENSIBLE
 * (transition portant argent, identité ou droit) relève de la traçabilité et
 * va dans `audit_log` via le port `IAuditLog` — pas ici.
 */
export interface IAppLoggerService {
  log(context: string, message: string, meta?: Record<string, unknown>): void;
  warn(context: string, message: string, meta?: Record<string, unknown>): void;
  error(context: string, error: unknown, meta?: Record<string, unknown>): void;
}
