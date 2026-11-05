---
name: socle-tests
description: Pose dans un monorepo du socle les gates de qualité des tests que les règles promettent — tests creux refusés (lint ESLint des specs et analyse AST), couverture du diff par Vitest (chaque fichier de code touché est exécuté par un test, et assez), tests de propriétés fast-check, score de mutation Stryker sur le noyau critique — avec leurs scripts, leurs gabarits et trois ADR. Use when a project's test rules say a gate is "to be set up", when adding coverage or mutation gates to a monorepo, or when a chain skill says tests-creux or coverage-diff is missing.
---

# Socle des tests

La fiche `.claude/rules/tests.md` du socle monorepo écrit les règles — tests creux interdits, couverture du diff, propriétés, plancher daté — et promet les machines qui les tiennent. Ce skill les pose. **Il n'écrit aucun test** : il pose ce qui refuse un mauvais test et ce qui mesure l'absence de test.

Tous les gabarits vivent dans [`references/`](references/). Les copier **verbatim** puis substituer `{{PROJET}}`, `{{SCOPE}}`, `{{DATE}}`, `{{N}}`. Ce que chaque pièce fait et pourquoi : [`references/CONTENU.md`](references/CONTENU.md).

## Avant de commencer — vérifier le terrain

1. **La racine est posée** (`pnpm-workspace.yaml`, `scripts/check.mjs`, `.claude/rules/tests.md`) ; sinon `/maj-skills:socle-monorepo` d'abord.
2. **Les paquets testent par Vitest** (`"test": "vitest …"` dans chaque `package.json`). Un paquet sous Jest n'est pas mesuré par `coverage-diff` : le dire, ne pas l'adapter.
3. Si `scripts/verify/coverage-diff.mjs` existe, le socle est posé : **s'arrêter et demander** ; une mise à jour se fait pièce par pièce.
4. La chaîne de production (`.claude/chaine.json`) n'est pas requise, mais si elle est là, `coverage-diff` compare à `origin/develop` : c'est son défaut.

## Étape 1 — les questions

Une seule, avec sa recommandation : **les seuils de couverture du diff**. _(Recommandé : 80 % de lignes et 70 % de branches pour un fichier modifié, 90 % de lignes pour un fichier nouveau — les valeurs de `coverage-diff-regles.mjs`, mesurées sur un premier projet comme le point où les PR cessent de laisser des surfaces sans test.)_ Rien d'autre : le périmètre (le code des apps et des paquets, hors specs, routes, migrations, types générés, ui vendored) est dans le script et se corrige par PR, pas par question.

## Étape 2 — poser

1. **Dépendances** (demander avant : le hook d'agent le fait aussi) : `pnpm add -D @vitest/eslint-plugin -w`, puis `pnpm add -D @vitest/coverage-v8@<version de vitest> --filter <chaque paquet qui teste>`. `fast-check` et Stryker s'installent au premier usage, pas ici.
2. **Le lint des tests** : `references/racine/eslint.tests.mjs` → `eslint.tests.mjs` à la racine. Le `eslint.config.mjs` du socle monorepo le charge s'il existe ; sur un dépôt antérieur, ajouter avant `...brickRules` :
   ```js
   ...(existsSync(join(root, "eslint.tests.mjs")) ? (await import(pathToFileURL(join(root, "eslint.tests.mjs")).href)).default : []),
   ```
   et `"eslint.tests.mjs"` dans `ignores`.
3. **Les gates** : `references/scripts/verify/*` → `scripts/verify/` (tests compris). Dans `package.json` : `check:tests-creux` (`node scripts/verify/tests-creux.mjs`) et `check:coverage` (`node scripts/verify/coverage-diff.mjs`). Dans `scripts/check.mjs`, une étape `check:tests-creux` après `lint`, avec son message. Dans `.husky/pre-push`, `pnpm run check:coverage` après `pnpm run check`.
4. **La CI** : dans le job qui a Postgres (`test-db` du socle de la chaîne, ou le job de tests), après `test:db`, une étape sur `pull_request` : `pnpm check:coverage --base "origin/$BASE"` avec `env: BASE: ${{ github.event.pull_request.base.ref }}` (jamais le gabarit dans le `run:`, `zizmor` le refuse) et `DATABASE_URL` — les suites sur base comptent. Le job a `fetch-depth: 0` ou fait `git fetch origin <base>` avant.
5. **Les gabarits** : `references/gabarits/exemple.property.spec.ts` → `docs/agents/gabarits/` ; `references/gabarits/stryker.config.mjs` → `apps/api/stryker.config.mjs` (placeholders substitués, `mutate` vide, `break: 0`), et un script `mutation` (`stryker run`) dans le `package.json` de l'API ; `reports/` et `.stryker-tmp/` dans `.gitignore`.
6. **La fiche** `.claude/rules/tests.md` : les phrases « à poser par le ticket … » deviennent les commandes réelles (le gabarit du socle monorepo ≥ 3.1 les a déjà) ; `pnpm check:coverage` et `mutation` dans la section Commandes ; `docs/methode/pare-feu-ci.md` reçoit les deux gates dans son catalogue. Si la chaîne est posée, deux critères de projet dans le fichier de critères de la revue (`criteresRevue` de `.claude/chaine.json`) : une fonction pure nouvelle qui porte un invariant chiffré a son `*.property.spec.ts` (ADR propriétés) ; un fichier du périmètre `mutate` de `stryker.config.mjs` modifié vient avec sa mesure de mutation dans la PR (ADR mutation).
7. **Les ADR** : `node scripts/docs/next-id.mjs ARC` trois fois ; `references/adr/ARC-N-tests-sans-infrastructure.md`, `ARC-N-tests-de-proprietes.md`, `ARC-N-score-de-mutation.md` → `docs/adr/`, `{{N}}` et `{{DATE}}` substitués, une ligne `Décideurs`.
8. **Le ticket** du pare-feu CI, s'il existe : un commentaire daté qui dit ce que ce skill a fermé, et ce qui reste (secrets, E2E, gates propres aux invariants).

## Étape 3 — vérifier, puis seulement conclure

```bash
pnpm lint                      # le plugin vitest charge, zéro erreur
pnpm check:tests-creux         # « tests-creux: N cas analysés » puis OK
node --test scripts/verify/*.test.mjs
node scripts/verify/coverage-diff.mjs --dry-run
```

Puis **une preuve que le gate mord** : ajouter une ligne vide à un fichier de code sans test, `pnpm check:coverage` doit le refuser « aucun test n'exécute ce fichier » ; retirer la ligne. Et `pnpm check` complet, vert.

## Étape 4 — l'historique

Invoqué seul : `chore(tests): pose les gates de qualité des tests`, puis `docs(adr): consigne les tests sans infrastructure, les propriétés et le score de mutation`.

## Ce que ce skill ne fait pas

- **Aucun test, aucune propriété, aucun périmètre de mutation** : il pose les machines ; les tests viennent avec le code, la propriété avec la première fonction pure, le périmètre avec le premier fichier d'argent.
- **Aucun plancher global de couverture** : un plancher se pose sous une mesure du jour ; sans mesure, c'est un chiffre inventé. Le diff, lui, se mesure dès la première PR.
- **Pas d'E2E** : Playwright et le bundle mobile sont posés par les socles de service ; leur cadence (au passage du capitaine) est celle de la chaîne.

## Anti-patterns

| Tentation | Pourquoi c'est faux |
| --- | --- |
| « Je baisse le seuil pour faire passer cette PR » | Un seuil est un plancher daté : il monte quand la mesure progresse, jamais ne baisse. Une PR sous le seuil écrit ses tests ou exempte le fichier avec une raison. |
| « `// coverage-diff: ignore` sur ce service, il est dur à tester » | L'exemption est pour ce qui n'est pas testable en unitaire (amorçage, câblage). Un service dur à tester est un service à découper : c'est le signal du gate. |
| « Je mets `toBeDefined()` en attendant » | C'est exactement le test creux que le gate refuse : il passe sur `{}`. Contraindre le résultat, ou ne pas écrire le cas. |
| « La mutation à chaque PR, pour être sûr » | Plusieurs minutes de runner par PR pour un signal qui bouge peu. À la demande, après un changement du périmètre. |
| « Jest mesurait mieux » | `vitest related` + `@vitest/coverage-v8` donnent le même rapport istanbul ; le gate lit le rapport, pas l'outil. |
