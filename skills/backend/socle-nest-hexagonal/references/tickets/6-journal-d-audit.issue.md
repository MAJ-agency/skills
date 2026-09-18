# Mettre en place le journal d'audit

Status: ready-for-human
Type: task

Un log technique est un diagnostic éphémère. Un **événement métier sensible** — une transition portant argent, identité ou droit — est une **preuve**, et n'a rien à faire dans un `logger.error`.

Bloqué par : `4-couche-base-de-donnees`.

## À faire

1. Table `audit_log` : `id` (UUID v7), `at`, `type`, acteur, `metadata` (JSONB), IP et user-agent optionnels.
2. **Immuable en base**, pas par convention : `REVOKE UPDATE, DELETE, TRUNCATE` au rôle applicatif **plus** un trigger qui lève une exception sur mutation.
3. Port SPI `IAuditLog` côté domaine, adapter côté infrastructure. Le port n'expose que des modèles du domaine.
4. **Rédaction** : ni jeton, ni secret, ni cookie dans `metadata`.
5. Tests : un test d'immuabilité vérifie qu'un `UPDATE` sous le rôle runtime échoue.

Premier appelant naturel : la détection de réutilisation d'un refresh, qui doit **journaliser avant** de lever son erreur.

## Comments
