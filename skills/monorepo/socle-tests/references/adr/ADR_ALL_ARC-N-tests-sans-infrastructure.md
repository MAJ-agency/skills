# ADR_ALL_ARC-{{N}} — Les suites sans infrastructure entrent dans la porte de qualité ; les suites sur base tournent en CI avec le service

- Statut : **accepté**
- Date : {{DATE}}
- Portée : `pnpm check`, `check:commit`, les hooks git, le job CI `qualite` et le job `test-db`

## Contexte

Le pare-feu répartit les contrôles selon **le besoin d'infrastructure**, pas selon leur nature : ce qui tourne sans rien va dans `pnpm check` (hook pre-push, job `qualite`), ce qui exige Postgres va dans le job `test-db`. Mesuré sur un premier projet qui n'avait pas appliqué ce critère jusqu'au bout : 288 tests écrits ne tournaient nulle part (les paquets partagés et le mobile n'étaient joués par aucun job), une suite était rouge depuis des semaines sans que personne ne le voie.

Le coût d'une suite sans infrastructure est de quelques secondes ; celui d'une suite sur base, plusieurs minutes de mise en place. Les mêler, c'est faire attendre les premières ou sauter les secondes.

## Décision

1. **Toute suite qui n'a besoin d'aucune infrastructure est jouée par `pnpm check:commit`** (pre-commit) et par le job `qualite` : `packages/*`, `apps/web`, `apps/mobile`, et les suites `*.spec.ts` de l'API. Une suite qui dépasse quelques secondes a une dépendance qu'elle devrait déclarer.
2. **Une suite qui exige Postgres se nomme `*.db.spec.ts`** et ne tourne que par `test:db` (configuration Vitest dédiée), en local avec `compose.yaml`, en CI dans le job `test-db` avec le service. Un repository n'est jamais prouvé contre une base simulée.
3. **Aucun job CI de plus** : `qualite` rejoue `pnpm check` tel quel, sans filtre de chemins, sur chaque PR et chaque push.

## Alternatives écartées

- **Un job de test par application** — filtré par chemins, il ne se déclenche pas sur un push direct et ne peut pas être exigé : un check exigé qui ne tourne pas bloque toute fusion.
- **Toutes les suites dans le job qui a Postgres** — ferait attendre deux minutes de base à des suites qui tournent en trois secondes, sans jumeau local au pre-push.
- **Un plancher de couverture par paquet dès le premier jour** — un plancher se pose sous une mesure du jour ; sans mesure, c'est un chiffre inventé. La couverture du diff (ADR « gates de tests ») regarde chaque PR sans attendre un historique.

## Conséquences

Tout test écrit est exécuté et bloquant, sans en écrire un de plus. L'exclusion `*.db.spec.ts` de la configuration Vitest par défaut est un point à maintenir : une suite nouvelle qui exigerait une base doit prendre ce suffixe, sans quoi `pnpm check` échouera hors CI.

## Liens

- `.claude/rules/tests.md` — les conventions et les commandes.
- `docs/methode/pare-feu-ci.md` — le catalogue des gates et leur cadence.
