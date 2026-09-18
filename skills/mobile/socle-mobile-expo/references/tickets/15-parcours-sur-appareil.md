# Poser les parcours de bout en bout sur appareil

Status: ready-for-human
Type: task

`MOB-0001` place les parcours hors des tests unitaires : ils se jouent sur un simulateur ou un appareil, contre une vraie API. Rien n'est posé encore.

Bloqué par : `07-pare-feu-ci` et `14-distribution-eas-et-stores` — un parcours qui ne tourne pas en CI n'est pas un gate, et il faut un build à instrumenter.

## À faire

1. Choisir l'outil : **Maestro** (flux en YAML, pas d'instrumentation, tourne sur Expo Go et sur un build) — _recommandé pour commencer_ — ou **Detox** (plus profond, exige un dev client instrumenté).
2. `apps/mobile/e2e/` : un premier flux — l'écran d'accueil affiche l'état de l'API.
3. Les identifiants d'accessibilité (`testID`) posés sur les éléments de parcours, jamais des textes.
4. Le job CI : build preview, simulateur Android, Maestro Cloud ou runner dédié ; rapport en artefact sur échec.

## Rappels non négociables

- Un parcours entre dans le gate CI **quand il est vert trois fois de suite**.
- Jamais d'URL, d'identifiant de seed ni de compte en dur dans un flux : tout vient de l'environnement.

## Comments
