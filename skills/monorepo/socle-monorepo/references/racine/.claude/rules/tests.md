---
paths:
  - "**/*.spec.ts"
  - "**/*.test.ts"
  - "**/*.test.mjs"
  - "**/vitest*.config.ts"
  - "tests/**"
---

# Tests — conventions et gates

S'applique dès qu'on lit ou écrit un test ou une configuration de test. Le détail par couche est dans le `CLAUDE.md` de chaque service ; les gates et leur cadence dans `docs/methode/pare-feu-ci.md`. Cette fiche dit ce qui vaut pour toutes les briques.

| Type                     | Outil      | Emplacement                                   | Suffixe        |
| ------------------------ | ---------- | --------------------------------------------- | -------------- |
| Unitaire, sans infra     | Vitest     | à côté du code                                | `.spec.ts`     |
| Scripts et skills        | `node --test` | à côté du script                           | `.test.mjs`    |
<!-- socle:tests -->

Le critère de séparation est **le besoin d'infrastructure**, pas la couche : une suite qui exige une base ou un service se nomme `*.db.spec.ts` et ne tourne que par la commande dédiée de sa brique. Tout le reste tourne partout, au pre-commit comme au pre-push, sans base.

## Règles

- **Le nom dit le comportement** : `describe('<Sujet>')` puis `it('should <comportement> when <condition>')`.
- **Un test qui prouve une règle du registre porte son identifiant entre crochets en tête du nom** : `it('[RULE_ALL_LIC-2] should refuse a second licence in the same season')`. Plusieurs étiquettes se juxtaposent (`[RULE_ALL_LIC-2] [RULE_FNSMR_LIC-05] …`) ; une étiquette sur un `describe` vaut pour tous ses tests. L'identifiant est complet, contexte compris, `ALL` écrit. Jamais d'étiquette sur un test qui ne prouve pas la règle, jamais sur un test de recette (`recette.*`). C'est ce que lit `anchorpost index` pour dire qu'une règle est prouvée ; la catégorie et le niveau de la preuve viennent du tableau ci-dessus (`.spec.ts` unitaire P0, `.db.spec.ts` base réelle P0, `.property.spec.ts` propriétés P0, `apps/api/test/**` intégration P1, `tests/**` et `e2e/**` e2e P2).
- **Tester le comportement, pas l'implémentation.** Un test qui casse à un refactor sans changement de comportement est un test à réécrire.
- **Jamais la base mockée dans un repository.** Le mapping ligne ↔ modèle, l'atomicité et l'idempotence se prouvent contre une vraie base. Les ports, eux, se mockent dans les tests de cas d'usage.
- **AAA, un sujet par test, mocks neufs** : `afterEach(() => vi.clearAllMocks())`. Mocks partagés dans `@test/mocks/`.
- **Déterministe** : pas de `setTimeout` pour attendre, on attend une promesse ou une condition ; pas de date système, l'horloge est un port (voir « Le jour et l'heure ») ; pas d'ordre de tests qui compte.
- **Un test qui clignote est un bug** jusqu'à preuve du contraire : le rejouer trois fois, puis ouvrir un ticket, jamais un `retry`.

## Le jour et l'heure

Un test qui dépend du jour, de la date ou de l'heure casse selon le moment du run s'il lit l'horloge de la machine ou le jour UTC. Trois règles :

- **Le jour se lit dans le fuseau du métier, par l'horloge injectée.** Le fuseau du métier est une constante du domaine (un nom IANA), jamais celui de la machine, ni UTC par défaut. Le code reçoit l'instant de l'horloge injectée (le port `IClock` du socle Nest, ou son équivalent), ou le jour en paramètre, jamais `new Date()`. `toISOString().slice(0, 10)` rend le jour UTC, faux entre minuit et l'écart du fuseau.
- **Un test crée ses données au lieu de lire celles du seed partagé.** Le seed dépend du jour où il a tourné : un test qui y cherche « aujourd'hui » ou une année écrite en dur casse quand la date change. Ce qui dépend du jour se crée dans le test, à partir de l'instant posé ; une année attendue s'écrit comme une forme (`\d{4}`), jamais comme une valeur.
- **Un banc tourne avec une horloge posée.** Le code qui dépend de l'heure se joue aux instants qui cassent, dans le fuseau du métier : en journée, juste avant et juste après minuit, et les jours de changement d'heure. Jamais seulement à l'heure du run. Un seed relatif au jour prend l'instant en paramètre, pour qu'un test puisse le poser.

Gabarit : `docs/agents/gabarits/exemple.jour-metier.spec.ts`.

## Tests creux — interdits

Un `it` sans assertion ; un `it` dont la seule assertion est `toBeDefined` ou `toBeTruthy` ; une assertion sous condition ; un `it.skip` ou `it.todo` sans ticket ; un `expect` dans un `try` sans `expect.assertions`. Le lint des tests (`eslint.tests.mjs`) et le gate `tests-creux` (`scripts/verify/tests-creux.mjs`, dans `pnpm check`) les refusent ; posés par le skill `socle-tests`. Un cas assumé porte `// tests-creux: ignore — <raison>` sur la ligne au-dessus.

Un test désactivé porte son ticket sur la ligne au-dessus, dans la directive que le lint exige : `// eslint-disable-next-line vitest/no-disabled-tests -- skip: <TICKET> <raison>` ; un `it.todo` porte le ticket dans son titre. Le correctif retire le `skip` **sans changer l'attendu**.

## Couverture

- Tout fichier de code touché par un diff a au moins un test qui l'exécute. Le périmètre est le code des apps et des paquets (hors specs, routes, migrations, types générés, ui vendored) ; les scripts de `scripts/` sont tenus par leurs bancs `*.test.mjs`, joués par `check:tickets`. Une exemption se nomme dans les dix premières lignes du fichier : `// coverage-diff: ignore — <raison>`.
- Le gate `coverage-diff` (`pnpm check:coverage`, pre-push et job CI `test-db`) refuse tout fichier de code du diff qu'aucun test n'exécute, ou sous 80 % de lignes / 70 % de branches (90 % de lignes pour un fichier nouveau) ; les suites sur base comptent quand `DATABASE_URL` est définie. Posé par le skill `socle-tests`. Un plancher daté se relève quand la mesure progresse, jamais ne baisse.

<!-- ══ TENANT-B ══ -->
## Tests d'isolation — bloquants

Trois tests prouvent l'isolation des tenants et bloquent la fusion (`docs/methode/pare-feu-ci.md` § isolation) : fuite cross-tenant (sous A, rien de B n'est lisible, une écriture violant `WITH CHECK` est refusée), fuite de GUC (le réglage tenant est remis à zéro hors transaction), introspection SQL (toute table `public` est RLS-forcée ou dans l'allowlist versionnée).
<!-- ══ /TENANT-B ══ -->

## Propriétés

Une fonction pure qui porte un invariant métier chiffré — montants, quantités, dates, arrondis — gagne un test de propriétés à côté d'elle (`*.property.spec.ts`, `fast-check`, à installer à la première ; gabarit `docs/agents/gabarits/exemple.property.spec.ts`). L'oracle est indépendant de l'implémentation : entiers exacts pour l'argent, aller-retour pour un format. Une propriété rouge est un bug : corriger le code, garder le contre-exemple minimal comme test d'exemple.

## Commandes

- `pnpm check` : build, lint, typecheck, cycles, toutes briques — ne joue aucun test.
- `pnpm check:commit` : typecheck et tests sans infra, joué au pre-commit.
- `pnpm check:gates` : les gates propres à chaque brique, chacune expose le sien.
<!-- socle:tests-commandes -->
