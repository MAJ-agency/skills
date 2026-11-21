# Contre-relecture de l'architecte sur Anchorpost #253 (scanner des preuves), sommet `aa001b0` — 2026-11-18

Rapport brut d'un agent en contexte vierge, non retouché, hors les chemins de la machine remplacés par `<dossier d'essai>` et `<dépôt>`. Les fichiers d'essai cités n'existent plus ; chaque forme est écrite dans le texte et se rejoue telle quelle.

---

**Verdict : fausse preuve trouvée hors des limites écrites.**

# Contre-relecture de la PR #253 (Anchorpost), scanner vivant

- **Sha relu** : `aa001b0171e3c6a47b7a3f65007943c05e061a48`, sommet de `fix/spec-all-anc-5-27-scanner-vivant`, comme annoncé.
- **Base** : `origin/sujet/preuve-suffisante-cas` à `da2c883` ; point de départ commun `2bffbf4`. Le diff lu est `origin/sujet/preuve-suffisante-cas...aa001b0`.
- **Lanceurs** : Vitest 4.1.12 (celui du dépôt), `node --test` de Node 22.23.4, Playwright 1.51.1 sans navigateur (installé dans mon dossier, hors du dépôt, qui ne l'a pas dans ses `node_modules`).
- **Scanner** : `collectProofsFrom` de `apps/cli/dist/lib.cjs` construit à `aa001b0` ; l'ancien lecteur est le même appel sur le `dist` construit à `da2c883`.
- Dossier : `<dossier d'essai>/` (noté `$D` plus bas). Le rapport est dans `<dossier d'essai>/rapport.md`, même texte.

Six constats donnent une preuve active à un test que le lanceur ne joue pas, sans figurer dans les limites du README. Aucun n'est créé par la PR : le lecteur de la base comptait déjà ces preuves (observé pour B2, B3, B4 et B6 ; déduit pour B1 et B5, la base ne lisant ni `only` ni options). La PR ne les ferme pas ; pour B5, c'est son code neuf qui lit la forme et la juge du mauvais côté. L'embarquement de TypeScript, les tests existants et le compte sur le dépôt n'ont pas de bloquant.

## 1. Constats

### Bloquants : le lanceur ne joue pas, le scanner compte une preuve, rien au README

**B1. Playwright : un `test.only` dans un fichier arrête les tests des autres fichiers, qui restent des preuves.**
- Essai : `$D/essais/pw-only/tests/` (`a-porte-le-only.spec.ts`, `b-autre-fichier.spec.ts`, `c-porte-un-describe-only.spec.ts`).
- Lanceur : « Running 2 tests », les deux sous `only` ; les deux tests de `b-autre-fichier.spec.ts` ne sont pas joués ; sortie 0 (`forbidOnly` faux par défaut).
- Scanner : `[RULE_ALL_PLW-75]` et `[RULE_ALL_PLW-76]` de `b-autre-fichier.spec.ts` actifs, aucune alerte sur ce fichier.
- Le `only` est écrit en clair, c'est le cas que vise la décision 2. Le README n'écrit en limite que le `.only` « posé depuis un autre fichier (une fonction d'aide importée) ».
- Vitest : le `only` reste dans son fichier (observé, `e01` n'arrête pas `a01`). `node --test --test-only` : un fichier sans `only` ne joue rien, mais c'est un drapeau de la commande.

**B2. Le `describe` étiqueté sans test écrit vaut une preuve, quoi que joue ce qu'il appelle.**
- Essais : `$D/essais/vitest/p01-describe-aide-saute.spec.ts`, `p02-describe-forme-non-lue.spec.ts`, `p03-describe-extend.spec.ts`, `p04-describe-alias.spec.ts`, `p05-describe-crochet-seul.spec.ts` ; `$D/essais/node/n-describe-aide.test.mjs` ; `$D/essais/pw/tests/l-describe-aide.spec.ts`.
- Lanceur : `skipped` ou `todo` pour chaque test. Scanner : le `describe` est une preuve active, sans alerte.
- Formes, toutes dans le même fichier que le `describe` :
  - une aide qui déclare `it.skip`, `it.todo`, `it.skipIf(true)`, `describe.skip` ou `it(nom, { skip: true }, fn)` ; la même aide passée à `forEach` par son nom ; une fonction appelée sur place ;
  - une forme « non lue comme un test », sautée en clair : `test.for([1])("a", { skip: true }, fn)`, `(it)("a", { skip: true }, fn)`, `it!("a", { todo: true }, fn)`, `mien.skipIf(true)(…)` après `test.extend`, `monIt("a", { skip: true }, fn)` par un alias ;
  - un corps qui n'appelle qu'un crochet ou `console.log` : Vitest sort le fichier `failed` sans aucun test en échec, sauf avec `--passWithNoTests`, que le script `test` d'`apps/cli` passe ; il est alors vert (rejoué : sortie 0), et la preuve tient.
- Vu sur les trois lanceurs (`a # SKIP` sous `node:test`, `skipped` sous Playwright).
- Le README dit des formes rares qu'elles « ne donnent donc aucune preuve » : c'est faux sous un `describe` étiqueté. `it.skip` dans une aide n'est pas un « saut hors d'un test » pour `skip-outside-test`, qui écarte les appels de test reconnus.
- Sur ce dépôt : 0 preuve sur 421 passe par cette règle (compté). L'exposition est chez les dépôts qui écrivent `describe("[RULE…]", () => cas(…))`.
- Code : `emitDescribe` et `hasCall`, `apps/cli/src/proofs/scan.ts` vers les lignes 672 à 715.

**B3. Une ligne étiquetée d'une table `describe.each` vaut une preuve, quoi que joue le corps.**
- Essai : `$D/essais/vitest2/q01-ligne-de-table-describe.spec.ts`.
- `describe.each(["[RULE_ALL_ESS-402] ligne"])("%s", () => { it.skip("dedans", fn); })` : Vitest `skipped`, scanner actif. De même avec `it.todo`, `describe.skip`, et un `it` sous `if (false)`.
- Le `it.skip` est écrit en clair dans le corps, sans aide. Code : `scan.ts` vers 1281 à 1288, où la ligne est émise avec le seul `off` de l'appel `each`.

**B4. Un `it.each(table)(titre)` sans corps vaut une preuve.**
- Essai : `$D/essais/vitest2/q02-ligne-de-table-it.spec.ts`.
- `it.each([1])("[RULE_ALL_ESS-415] titre %s")`, `it.each(["[RULE_ALL_ESS-412] ligne"])("%s")`, et le même avec `undefined` : Vitest `todo`, scanner actif.
- Le README range `it(nom)` sans corps en inactif ; la clause ne vaut pas sous une table (`table === undefined`, `scan.ts` vers 1253).

**B5. `node:test` : une option `skip` ou `todo` à valeur fausse autre que `false` saute le test, le scanner le garde.**
- Essai : `$D/essais/node/l-options-fausses.test.mjs`. Les six corps lèvent.
- Lanceur : `{ skip: 0 }`, `{ skip: "" }`, `{ skip: null }` donnent `not ok … # SKIP` ; `{ todo: 0 }`, `{ todo: "" }`, `{ todo: null }` donnent `not ok … # TODO` ; `# fail 0`, sortie 0. L'échec n'est pas compté.
- Scanner : les six actifs, aucune alerte.
- Le README dit « qui n'est pas littéralement faux ». Le scanner tient `0`, `""`, `null` pour faux (`literalTruth`, `scan.ts` vers 1145) ; `node:test` ne tient pour non sauté que `undefined` et `false`.
- C'est le seul constat où le code neuf de la PR lit la forme et se trompe du mauvais côté. L'ancien lecteur ne lisait aucune option : il tenait aussi `{ skip: true }` pour actif (observé sur une ligne de table). La forme est rare. Sous Vitest, `{ skip: 0 }` joue le test : accord.

**B6. Formes voisines de limites écrites, non listées.** À trancher : les fermer, ou les écrire.
- Boucles sur un littéral vide : `for (const x of []) it(…)`, `[].forEach(() => { it(…) })`, `[].map(…)`, `for (let i = 0; i < 0; …)`, `for (const k in {})`. Essai : `$D/essais/vitest/c05-boucles-vides.spec.ts`. Lanceur : non enregistré ; scanner : actif. Le README écrit `for (;false;)` et la table variable vide, et ferme `it.each([])`.
- Corps qui n'est pas une fonction : `it(nom, -1)`, `it(nom, 2 * 1000)`. Essai : `$D/essais/vitest/d07-sans-corps.spec.ts`. Vitest `todo`, scanner actif. Le README écrit `it(nom, [])`. `isBody` est une liste de refus, pas une liste blanche.
- Conditions : `if (!!false)`, `if (1 === 2)`, `if (false || false)`, `null?.f?.(it(…))`. Essai : `$D/essais/vitest/b02-branche-morte-non-litterale.spec.ts`. Même famille que `!1`, écrit.

### À corriger : le lanceur joue, le scanner refuse, forme courante

**C1. Un titre en concaténation n'est plus lu, sans alerte : une perte par rapport à la base.**
- Essais : `$D/essais/vitest3/r01-titres-calcules.spec.ts`, `$D/essais/vitest/f01-formes-courantes.spec.ts`.
- `it("[RULE_ALL_ESS-506] titre concaténé " + "de deux littéraux", fn)` et `it("[RULE_ALL_ESS-507] … " + n, fn)` : Vitest `passed` ; nouveau lecteur : aucun test, aucune alerte ; ancien lecteur : preuve active, titre coupé au premier littéral.
- Sous un `describe` étiqueté, `it("cas " + n, fn)` ne donne plus de preuve non plus : le `describe` a un test écrit, et ce test n'a pas de titre lisible.
- Aucun test étiqueté de ce dépôt n'est écrit ainsi (compte du § 3).

**C2. Le ticket ne dit pas la perte réelle sur ce dépôt.** Il écrit « 2 preuves perdues » ; à `aa001b0` c'est 30, dont 9 de `RULE_ALL_ANC-28` (§ 3). Toutes justifiées, aucune écrite.

**C3. Une régression sans test.** Retirer `ts.isParameter(node)` de `rebound` fait d'un `it` reçu en paramètre un lanceur, donc une preuve ; aucun test ne rougit (R10, § 5).

### Notes

- **Titre variable sous un `describe` étiqueté** (`for (const c of cas) it(c.nom, fn)`, `cas.forEach((c) => it(c.nom, fn))`) : aucune preuve, avec l'ancien lecteur comme avec le nouveau. Préexistant.
- **Extensions** : `x.spec.tsx`, `.spec.mts`, `.spec.js`, `.spec.cts` sont joués par Vitest et non lus hors d'un dossier de la table (motifs par défaut inchangés par la PR). `.jsx` n'est dans aucune extension lue : le « dialecte TSX pour `.tsx` et `.jsx` » du README ne s'atteint pas pour `.jsx`.
- **`node:test`** : un parent à sous-tests `t.test(…)` est inactif avec `test-context-unread`, le sous-test non lu ; `(t, done) => done()` inactif ; `suite(…)` non lu ; `test("x")` sans corps est joué et inactif.
- **Playwright** : `test.step.skip(…)` dans un test coupe tout le fichier (`skip-outside-test`) alors que le test tourne ; `const test = base.extend(…)` n'est jamais lu (écrit au README).
- **Alias du contexte** : `const c = ctx; c.skip()` coupe tout le fichier (`skip-outside-test`), pas le seul test comme le dit le README.
- **`.mjs` lu en TypeScript** : `it < T > ("[RULE…] x", fn)` est une comparaison en JavaScript, aucun test ; le scanner y lit `it<T>(…)` et compte une preuve (`$D/essais/node/o-ambigu.test.mjs`). Code qui cherche à tromper : relève de la relecture.
- **Table `each`** : une chaîne étiquetée qui n'est pas un titre de ligne (`{ nom: "a", attendu: "[RULE…] x" }`), ou dans une branche morte de la table, donne une preuve ; le test de la table, lui, tourne. Règle d'avant la PR.
- **`tests/n13.spec.helper.ts`** : `.spec.` au milieu du nom suffit sous `tests/` ; conforme au `*.spec.*` écrit.

## 2. Tableau des formes essayées

« Limite » : le README écrit que le scanner lit la forme. Tables complètes : `$D/essais/croise-vitest.md` (312 formes), `croise-vitest2.txt`, `croise-node.txt`, `croise-pw.txt`, `croise-pw-only.txt`.

### Vitest 4.1.12

| Forme | Lanceur | Scanner | Alerte |
|---|---|---|---|
| `it.skip`, `test.skip`, `describe.skip` (direct, et deux niveaux plus haut), `it.concurrent.skip`, `it.skip.each` | skipped | inactif | |
| `it.todo` (avec ou sans corps), `test.todo`, `describe.todo` | todo | inactif | |
| `skipIf(true)`, `runIf(false)`, sur `it` et `describe`, condition littérale ou variable | skipped | inactif | |
| `skipIf(false)`, `runIf(true)`, `describe.runIf(true)` | joué | inactif (décidé) | |
| `it.fails`, `test.fails`, `{ fails: true }` | joué, passe quand le corps lève | inactif (décidé) | |
| `xit`, `xdescribe`, `xtest` | ReferenceError, fichier en échec | inactif | |
| `if (false)` bloc ou ligne, `false &&`, `true \|\|`, `?:`, `else` d'un `if (true)`, `while (false)`, `0`, `""`, `null`, `undefined`, `void 0`, `NaN`, `!true`, `-0`, `0n`, `1 \|\|`, `"a" \|\|` | non enregistré | inactif | |
| `!1`, `false as boolean`, `for (;false;)`, `"a" ?? it`, `switch`, `if (variable)` | non enregistré | actif | limite |
| `!!false`, `1 === 2`, `false \|\| false`, `typeof window`, `null?.f?.(it(…))` | non enregistré | actif | **B6** |
| après `return` ; après `throw` dans un `try` | non enregistré | inactif | |
| après `if (true) return`, après `continue`, après `break`, dans un `catch` jamais pris | non enregistré | actif | limite |
| `function`, flèche, méthode, générateur jamais appelés | non enregistré | non lu | |
| aide déclarée puis appelée, fonction appelée sur place, fonction nommée à `forEach`, alias de `describe` ou de `it` | joué | non lu | limite (excès) |
| `beforeAll`, `afterAll`, `beforeEach`, `setTimeout`, `vi.mock`, fonction maison | non enregistré | non lu | |
| `.then`, `queueMicrotask`, `new Promise` | **joué** | non lu | excès, README inexact (§ 7) |
| `it.each([])`, `[] as T`, `<T>[]`, `([])`, `[...[]]`, `[...[], ...[]]`, `[] satisfies T`, `describe.each([])` | non enregistré | inactif | |
| `it.each([[]])`, `it.each([1, 2])`, `describe.each([1])` | joué | actif | |
| `it.each(variable vide)`, `[].slice()`, `Array()`, `[...""]`, `...[[]]` | non enregistré | actif | limite |
| `it.each(new Array(0))`, `it.each([].concat([]))` | non enregistré | actif | famille de la limite |
| `it.each` en gabarit, en-tête seule | joué une fois | actif | |
| `for…of [1, 2]`, `for` classique, `[1].forEach`, `.map`, `.flatMap`, `for…in` | joué | actif | |
| `for…of []`, `[].forEach`, `[].map`, `for (i < 0)`, `for…in {}`, `.map` d'un objet maison | non enregistré | actif | **B6** |
| `(ctx) => ctx.skip()`, `({ skip }) => skip()`, `ctx["skip"]()` | skipped | inactif | `test-context-unread` |
| `ctx.skip(false)` | joué | inactif | `test-context-unread` (excès) |
| `const c = ctx; c.skip()` | skipped ; le voisin est joué | inactif, fichier coupé | `test-context-unread`, `skip-outside-test` |
| `ctx.expect`, `({ expect })`, `({ task }) => task.name` | joué | actif | |
| `beforeEach((ctx) => ctx.skip())`, `beforeEach(({ skip }) => skip())` | skipped ; l'autre groupe joué | groupe inactif, autre groupe actif | `test-context-unread` |
| `{ skip: true }`, `{ todo: true }`, sur `it` et `describe` | skipped, todo | inactif | |
| `{ skip: false }`, `{ timeout }`, `{ retry }`, `{ concurrent }`, `it(n, fn, 1000)` | joué | actif | |
| `{ skip: cond }`, options en variable, `{ ...base }` | skipped ; le voisin est joué | tout le fichier inactif | `test-options-unread` |
| `it(n)`, `it(n, undefined)`, `void 0`, `{ timeout: 1 }`, `5000`, `null` | todo | inactif | |
| `it(n, [])` | todo | actif | limite |
| `it(n, -1)`, `it(n, 2 * 1000)` | todo | actif | **B6** |
| test écrit dans un test | intérieur non enregistré, extérieur en échec | intérieur inactif, extérieur actif | |
| `it(n, fn, { skip: true })` | fichier en échec (Vitest 4 le refuse) | inactif | `test-options-unread` |
| `it.only`, `describe.only`, `test.only`, `it["only"]`, ``it[`only`]``, `{ only: true }`, `it.only.each`, `it.concurrent.only`, `only` imbriqué, `describe { only: true }` | voisins skipped, sous `only` joué | tout le fichier inactif | `test-only-in-file` |
| `const filtre = { only: true }` sans rapport ; `it.only` en branche morte | tout est joué | tout le fichier inactif | `test-only-in-file` (excès décidé) |
| `only` en identifiant libre, en chaîne, en commentaire | joué | actif | |
| `fit`, `fdescribe` | ReferenceError, fichier en échec | inactif | `test-only-in-file` |
| appel en commentaire, en chaîne, en gabarit, en expression régulière | non enregistré | non lu | |
| appel dans le `${…}` d'un gabarit ; deux appels sur une ligne | joué | actif | |
| titre en gabarit, avec ou sans interpolation ; `describe` imbriqués ; `it.each` non vide ; `test.concurrent` ; `it.sequential` ; rappel `async`, fléché, `function` ; corps passé par un nom | joué | actif | |
| titre en concaténation | joué | non lu | **C1** |
| `test.extend`, `test.for`, `(it)(…)`, `it!(…)`, `it` dans `static {}` | joué | non lu | limite (excès) |
| `const it = v.it`, `v.test(…)`, `declare const it` | joué | non lu | écrit |
| global sans import | joué | actif | |
| un paramètre nommé `test` dans le fichier | joué | `it` actif, `test` non lu | écrit |
| `describe` étiqueté, aide qui joue | joué | actif | |
| `describe` étiqueté, aide qui saute, forme non lue sautée, crochet seul | skipped, todo, rien | actif | **B2** |
| `describe` étiqueté au corps vide | rien | non lu | `describe-labelled-empty` |
| aide `(ctx) => ctx.skip()` dans le même fichier | skipped ; le voisin est joué | fichier inactif | `skip-outside-test` |
| ligne étiquetée d'un `describe.each`, corps sauté | skipped, todo | actif | **B3** |
| `it.each(…)(titre)` sans corps | todo | actif | **B4** |
| `[RULE…#Nominal]` | joué | non lu | `case-label-malformed` |
| commentaire de bloc jamais fermé ; erreur de syntaxe | fichier en échec | non lu | `test-block-unclosed`, `test-file-unreadable` |
| `let a; let a;` ; `/a/gg` | fichier en échec | actif | limite |
| fichier exclu par `exclude` de la configuration | non joué | actif | limite |
| `tests/helpers.ts`, `x.ts`, `x.spec.ts.bak`, `x.spec.txt`, `x.spec.d.ts` | non joué | non lu | |
| `x.test.ts`, `x.test.mjs` | joué | actif | |
| `x.spec.tsx`, `.spec.mts`, `.spec.js`, `.spec.jsx`, `.spec.cts` | joué | non lu | note |
| `x.e2e-spec.ts` | hors de l'`include` par défaut | actif | limite (configuration) |
| `recette.x.spec.ts` | joué | non lu | `recette-labelled` |

### `node --test`, Node 22.23.4

| Forme | Lanceur | Scanner | Alerte |
|---|---|---|---|
| `test.skip`, `it.skip`, `{ skip: true }`, `{ skip: "raison" }` ; sous `describe.skip` ou `describe { skip: true }` | skip ; non enregistré sous un groupe sauté | inactif | |
| `test.todo`, `it.todo`, `describe.todo`, `{ todo: true }` | todo | inactif | |
| `{ skip: false }`, `{ timeout: 1000 }` | joué | actif | |
| `(t) => t.skip()`, `function () { this.skip() }` sous `test` et sous `it` | skip | inactif | `test-context-unread` |
| `(t) => t.todo()` | todo | inactif | `test-context-unread` |
| `t.diagnostic`, `t.assert.ok` | joué | actif | |
| `beforeEach((t) => t.skip())` | skip ; l'autre groupe joué | groupe inactif, autre actif | `test-context-unread` |
| `{ skip: 0 }`, `{ skip: "" }`, `{ skip: null }` | `# SKIP`, échec non compté | actif | **B5** |
| `{ todo: 0 }`, `{ todo: "" }`, `{ todo: null }` | `# TODO`, échec non compté | actif | **B5** |
| `{ skip: cond }` | skip ; le voisin est joué | fichier inactif | `test-options-unread` |
| `test.only`, `{ only: true }`, `only(…)` importé, `describe.only`, `it.only` | sans drapeau : tout est joué ; avec `--test-only` : le voisin n'est pas joué | fichier inactif | `test-only-in-file` |
| `skip(…)`, `todo(…)` importés | skip, todo | non lu | |
| `suite(…)`, sous-test `t.test(…)`, `(t, done)`, `test("x")` sans corps | joué | non lu ou inactif | note |
| `{ expectFailure: true }` | échec (non géré par Node 22) | inactif | |
| `describe` étiqueté, aide qui saute | `a # SKIP` | actif | **B2** |
| commentaire, fonction jamais appelée, `if (false)` | non enregistré | non lu, inactif | |
| `it < T > (…)` dans un `.mjs` | non enregistré | actif | note |

### Playwright 1.51.1, sans navigateur

| Forme | Lanceur | Scanner | Alerte |
|---|---|---|---|
| `test.skip(titre, fn)`, `test.fixme(titre, fn)`, `test.describe.skip`, `test.describe.fixme` | skipped | inactif | |
| `test.fail(titre, fn)`, `test.fail()` et `testInfo.fail()` dans le corps | échec attendu | inactif | `test-context-unread` pour `testInfo` |
| `test.describe`, `.serial`, `.parallel`, `test.describe` anonyme, `test.slow()`, `{ tag }`, annotation `issue` | joué | actif | |
| `test.skip()`, `test.skip(true, "r")`, `test.fixme()` dans le corps | skipped | inactif | |
| `test.skip(false, "r")` dans le corps | joué | inactif (décidé) | |
| `test.skip(true, "r")` dans un groupe ; `test.skip(({ browserName }) => …, "r")` | skipped | groupe inactif | |
| `test.skip(true, "r")` au premier niveau | skipped | fichier inactif | |
| `testInfo.skip()`, `test.info().skip()`, `testInfo.fixme()` | skipped | inactif | `test-context-unread` |
| `testInfo.title` | joué | actif | |
| `test.beforeEach` avec `testInfo.skip()` ou `test.skip(true)` | skipped | groupe inactif | `test-context-unread` |
| `{ annotation: { type: "skip" } }` | skipped | inactif | |
| `async ({}, { skip }) => skip()` | **failed** (le test lève) | inactif | `test-context-unread`, conforme à la limite |
| `test.skip(n, aide)` au premier niveau | le voisin est joué | fichier inactif | conforme à la limite (excès) |
| `const test = base.extend(…)` | joué | non lu | écrit |
| `test.step.skip(…)` dans un test | joué | fichier inactif | `skip-outside-test` (excès) |
| `test.only`, `test.describe.only` : même fichier | voisin non joué | fichier inactif | `test-only-in-file` |
| `test.only` : **les autres fichiers du projet** | non joués | actifs | **B1** |
| groupe étiqueté, aide à `test.skip("b", fn)` ou `test.fixme("c", fn)` | skipped | actif | **B2** |

## 3. Le compte sur le dépôt

Les deux lecteurs sur le même arbre (`aa001b0`) : **451 preuves avec l'ancien, 421 avec le nouveau ; 30 perdues, 0 gagnée**. Détail : `$D/essais/compte-depot.txt`.

| Règle | Fichier | Perdues | Raison |
|---|---|---|---|
| `RULE_ALL_ANC-28` | `apps/cli/src/compare/index.spec.ts`, tests des lignes 92, 117, 154, 175, 204, 221, 235, 259, 273 | 9 | L'ancien lecteur prolongeait le `describe("[RULE_ALL_ANC-28] compareRoot")` (lignes 17 à 89) jusqu'à la fin du fichier ; la chaîne `"{ pas du json"` de la ligne 74 porte une accolade jamais fermée. Vitest range ces 9 tests sous quatre autres `describe` (`ancestorTitles`). Le nouveau lecteur a raison. |
| `RULE_ALL_ANC-26` | `apps/cli/src/check/labels.spec.ts` | 2 | Fixtures en chaîne ; déjà écrit au ticket. |
| `RULE_ALL_ANC-9` | `apps/cli/src/proofs/scan.spec.ts` | 1 | Un `it("[RULE_ALL_ANC-9] …"` écrit dans une chaîne. |
| `RULE_ALL_JOU-1` (règle jouet, absente du dépôt) | `apps/cli/src/proofs/scan.spec.ts` | 18 | Fixtures en chaîne ou en gabarit. |

- Index des deux CLI sur deux copies de l'arbre : `ANC-26` passe de 10 à 8 preuves, `ANC-28` de 45 à 36, `ANC-9` de 74 à 73 ; aucune règle ne change de statut (les trois restent `partial`), la liste `health` est identique.
- L'index du nouveau lecteur est, à l'octet, `anchorpost/anchorpost.json` commis à `aa001b0` ; `check` sort 0.
- L'attendu « aucun écart sur de vrais fichiers de test » n'est pas tenu à la lettre : 9 preuves tombent d'un vrai fichier de test. Elles étaient fausses ; je n'ai pas vu la description de la PR, et le ticket ne les écrit pas (C2).

## 4. L'embarquement de TypeScript

- **Diff lu en entier** : `apps/cli/tsup.config.ts`, `apps/cli/scripts/post-build.mjs`, `apps/cli/scripts/pack-check.mjs`. `apps/cli/package.json` et `pnpm-lock.yaml` ne sont pas dans le diff.
- **Une seule copie** : `cli.cjs` et `lib.cjs` portent chacun un `require("./typescript.cjs")` et rien de TypeScript (0 occurrence de `versionMajorMinor`) ; `dist/typescript.cjs` seul le porte.
- **Minifiée** : 3 589 909 octets en 446 lignes, pour 9 112 572 octets de `typescript/lib/typescript.js`.
- **Licence** : `dist/THIRD-PARTY-LICENSES.txt` s'ouvre sur `typescript@5.9.3 — Apache-2.0`, avec les mentions de tiers.
- **Aucune dépendance d'exécution** : `dependencies` absent du `package.json` empaqueté, `typescript` reste en `devDependencies`, `lib.d.ts` ne cite pas `typescript`.
- **`pack:check`** : vert sur le paquet construit (sortie 0, 8 s). Sur une archive refaite sans `dist/typescript.cjs` : sortie 1, « Cannot find module './typescript.cjs' » dès `--version` (contrôle 3) ; le contrôle « 7 bis » n'est donc pas atteint, ce que le ticket annonce. La même commande sur l'archive entière sort 0.

| Mesure | Base `da2c883` | PR `aa001b0` |
|---|---|---|
| Archive (`pnpm pack`) | 510 257 octets | 1 569 664 octets ; 6,5 Mo dépaquetée, 7 fichiers |
| `index` sur le dépôt, trois passes | 725, 755, 801 ms | 1 879, 1 842, 1 983 ms |
| `check` sur le dépôt, trois passes | non mesuré | 1 828, 1 833, 1 903 ms |
| `--version`, trois passes | 92, 92, 81 ms | 212, 204, 205 ms |

## 5. Les régressions de mon cru

Une à la fois dans `apps/cli/src/proofs/scan.ts`, puis `vitest run src/proofs test/scanner-vivant.spec.ts`, hors des deux tests de temps (`-t '^(?!.*linear time)'`). Sortie : `$D/essais/regressions.txt`. Sauf mention, le test rouge est dans `src/proofs/scan.spec.ts`.

| | Régression | Test qui rougit |
|---|---|---|
| R1 | une clé `only` d'un littéral d'objet ne coupe plus | « toute écriture d'un only lue dans l'arbre coupe le fichier… » |
| R2 | `skipIf(…)` tenu pour actif | « un test sous skipIf ou runIf n'est jamais une preuve… », et un second |
| R3 | le corps d'un `beforeAll` est lu | « une fonction passée à un autre appel qu'un test ou forEach, map, flatMap n'est pas lue » |
| R4 | `fdescribe` oublié | « toute écriture d'un only… » |
| R5 | `{ skip: cond }` n'est plus signalé | « une option skip, todo, fails ou expectFailure qui n'est pas littéralement fausse, ou une option illisible… » |
| R6 | un `each` à table vide actif | « un each sur une table littéralement vide… », et un second |
| R7 | le code après un `return` reste vivant | « du code jamais exécuté n'est pas lu… » |
| R8 | un import nommé `only` ne coupe plus | « toute écriture d'un only… » |
| R9 | un test dans un test reste actif | « un test écrit dans un test n'est pas une preuve… » |
| **R10** | **un paramètre nommé `it` ne délie plus le lanceur** | **aucun.** Vérifié à part : `[faux].forEach((it) => { it("[RULE_ALL_JOU-1] a", fn) })` devient une preuve active. |
| R11 | hors d'un test, `….todo()` n'est plus un saut | « node:test : t.todo() dans un test, ou hors d'un test… » |
| R12 | `true \|\| it(…)` reste vivant | « la branche morte d'un littéral n'est pas une preuve… » |
| R13 | `this` d'une `function` n'est plus un porteur | 4 tests |
| R14 | `it(nom, void 0)` tenu pour un test à corps | « it(nom, void 0), it(nom, (undefined))… » |
| R15 | un crochet qui se saute ne coupe plus son groupe | 6 tests |
| R16 | ``it[`only`]`` n'est plus vu | « toute écriture d'un only… » |

15 régressions sur 16 font rougir un test.

## 6. Les tests existants

- `scan.spec.ts` : 14 lignes retirées sur tout le diff, 1 568 ajoutées.
  - 9 de ces lignes sont six entrées de test récrites d'une ligne en plusieurs, attendus inchangés. J'en ai rejoué cinq telles qu'à l'origine contre le nouveau scanner, avec les attendus d'origine : 5 tests verts (celle de « profond / vivant » non rejouée). J'en déduis que la réécriture est neutre.
  - 3 lignes : « should count a labelled describe whose body is never closed… » devient « should give no proof… », attendu retourné, écrit au ticket (`A-62`).
  - 2 lignes : `` it.each`never closed `` sort de l'entrée commune et gagne son assertion (`tests` vide), même décision.
- `categories.spec.ts` : deux lignes de table changent (`tests/parcours.ts` devient `tests/parcours.spec.ts`, `src/a.e2e-spec.ts` devient `apps/api/src/a.e2e-spec.ts`), écrit au ticket (nom de fichier exigé, `.e2e-spec` hors de l'API en `P0`).
- Aucun `.skip`, `.todo` ni `.only` réel : les 152 tests de `src/proofs` et de `test/scanner-vivant.spec.ts` sont `passed`.
- **Décision 3 tenue** : « should read describe.each titles in linear time » appelle `expectLinear` avec les mêmes arguments qu'à la base, donc 10 000 puis 100 000, seuil 50, 5 tours au meilleur de 3 ; `apps/cli/test/linear.ts` n'est pas dans le diff. Seul ajout : `}, 300_000);` et un commentaire. Le test dure 34 s ici.
- Aucun test existant n'est affaibli hors d'une décision écrite.

## 7. Le README dit-il vrai ?

140 cas rejoués sur le scanner seul, 0 écart après cinq attendus que j'avais mal écrits : `$D/essais/limites.md`. Aucune limite annoncée « inactif avec alerte » ne fabrique de preuve. Quatre phrases sont inexactes :

1. « Ne sont pas lues comme des tests des formes rares, qui ne donnent donc aucune preuve » : faux sous un `describe` étiqueté (B2).
2. « Une fonction passée à … `.then`, à `new Promise` … n'est pas lue : Vitest n'enregistre pas les tests qu'elle écrit » : le scanner ne les lit pas, mais Vitest les enregistre et les joue (`.then`, `queueMicrotask`, `new Promise` : `passed`, `$D/essais/vitest/b06-rappels.spec.ts`). Excès, du côté sûr.
3. `test(n, (0, function () { this.skip() }))` « n'est pas lu » : tel qu'écrit, le fichier est coupé par `skip-outside-test`. La limite ne vaut que sous une forme calculée (`this["sk" + "ip"]()`), rejouée : actif.
4. « dialecte TSX pour `.tsx` et `.jsx` » : `.jsx` n'est jamais lu.

`(it as any)[m]` coupe le fichier : plus strict que la limite écrite pour `(<any>it)[k]`, qui reste non vue comme annoncé.

## 8. Ce que je n'ai pas essayé

- **Jest** : absent du dépôt, non installé. `xit`, `xdescribe`, `fit`, `fdescribe`, `test.failing` n'ont pas tourné chez leur lanceur ; sous Vitest ce sont des ReferenceError.
- **Playwright avec navigateur** : aucun test à `page`, `browser` ou `context`.
- **Le décorateur d'un paramètre de méthode** sous `node:test` (limite écrite) : non rejoué.
- **Les deux tests de temps sous régression**, et le test à 300 s en CI ou sous couverture.
- **`pnpm check` entier, lint, typecheck, Stryker** : non lancés.
- **La description de la PR sur GitHub** : non lue.
- **`core.hooksPath`** vaut `.husky/_` après mes `pnpm install` (script `prepare` de husky) ; je ne l'avais pas relevé avant.

## 9. État du dépôt et rejeu

- `git worktree list` et `git status --short` de `<dépôt>` sont ceux du début (branche `docs/anc-5-12-decisions-p12` à `6fb2e2b`, statut vide, l'arbre `empreintes` déjà là). Mes deux arbres sont retirés. Le `fetch` demandé a avancé les deux références `origin/…`.
- Rien poussé, aucune PR, aucun commentaire.

```bash
D=<dossier d'essai>
export TMPDIR=$D/tmp
git -C <dépôt> worktree add --detach $D/arbre aa001b0171e3c6a47b7a3f65007943c05e061a48
git -C <dépôt> worktree add --detach $D/base da2c88345eed7c21c3ff9c36d9306a41890178f0
for a in arbre base; do (cd $D/$a && pnpm install --frozen-lockfile --prefer-offline && pnpm --filter @maj-agency/anchorpost build); done
LIB=$D/arbre/apps/cli/dist/lib.cjs

# Vitest (les liens node_modules des jouets pointent vers $D/arbre/apps/cli/node_modules)
node $D/outils/cas-vitest.mjs $D/essais/vitest
(cd $D/essais/vitest && env -u CI ./node_modules/.bin/vitest run --reporter=json --outputFile=$D/essais/vitest.json)
node $D/outils/scan.cjs $LIB $D/essais/vitest --json > $D/essais/scan-vitest.json
node $D/outils/compare-vitest.mjs $D/essais/vitest.json $D/essais/scan-vitest.json $D/essais/vitest
# B3, B4 : même enchaînement dans $D/essais/vitest2 ; C1 : $D/essais/vitest3, puis
node $D/outils/scan.cjs $LIB $D/essais/vitest3 ; node $D/outils/scan.cjs $D/base/apps/cli/dist/lib.cjs $D/essais/vitest3

# node:test (B5, B2), avec ou sans --test-only
node $D/outils/compare-node.mjs $LIB $D/essais/node

# Playwright (B1, B2)
(cd $D/essais/pw-only && env -u CI ./node_modules/.bin/playwright test) ; node $D/outils/compare-pw.mjs $LIB $D/essais/pw-only
(cd $D/essais/pw && env -u CI ./node_modules/.bin/playwright test) ; node $D/outils/compare-pw.mjs $LIB $D/essais/pw

# Limites du README, compte sur le dépôt, régressions
node $D/outils/limites.cjs $LIB
node $D/outils/compte-depot.cjs $D/base/apps/cli/dist/lib.cjs $LIB $D/arbre
python3 $D/outils/regressions.py $D/arbre          # ou : … $D/arbre R10

# Paquet
(cd $D/arbre && pnpm --filter @maj-agency/anchorpost pack:check)
(cd $D/arbre/apps/cli && node scripts/pack-check.mjs --archive $D/paquet-sans-ts/maj-agency-anchorpost-0.0.0.tgz)   # sortie 1

git -C <dépôt> worktree remove --force $D/arbre ; git -C <dépôt> worktree remove --force $D/base
```
