# Poser les parcours de bout en bout (Playwright + axe)

Status: ready-for-human
Type: task

`WEB-1` place le rendu et les parcours hors des tests unitaires : ils se testent de bout en bout, contre une vraie API. Rien n'est posé encore.

Bloqué par : `7-pare-feu-ci` — un parcours qui ne tourne pas en CI n'est pas un gate.

## À faire

1. `e2e/` à la **racine** du monorepo (les parcours traversent web et API) : `playwright.config.ts` avec ports paramétrables (`E2E_WEB_PORT`, `E2E_API_PORT`), un seul projet Chromium, `retries: 1`, capture d'écran sur échec seulement.
2. `e2e/helpers/api-base.ts` : source unique des adresses. Dans un parcours, naviguer en **chemins relatifs** ; jamais une URL ni un identifiant de seed en dur.
3. `e2e/helpers/a11y.ts` : `verifierAccessibilite(page)` via `@axe-core/playwright`, qui **échoue sur `serious` et `critical`** et journalise le reste.
4. Premier parcours : la page d'accueil affiche l'état de l'API, sans violation d'accessibilité.
5. Le job CI `e2e-web` : API + client construits et lancés, attente sur `/health`, puis Playwright ; rapport en artefact sur échec.

## Rappels non négociables

- Un parcours entre dans le gate CI **quand il est vert trois fois de suite**, pas avant.
- Le client lit `NEXT_PUBLIC_API_URL` **au build** : changer le port de l'API impose de reconstruire `apps/web`.

## Comments
