# Le banc du capitaine, posé, ne suppose plus le pre-commit du gabarit : hooks de banc dans `fusionner.test.mjs`, gabarit éprouvé à part, patch du plugin

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — les deux bancs et le garde sont donnés entiers ou en remplacements exacts, joués sur une copie jetable (voir « Où ») ; rien n'est à concevoir.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `scripts/pre-commit-socle.test.mjs` (créé), `scripts/poses.test.mjs`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `.claude-plugin/plugin.json`

## Le besoin

**Le fait rapporté**, le 2026-11-14, par le conducteur d'un projet qui pose le socle en 7.5.0 (`8c670e5`), scripts posés à plat sous `scripts/chaine/` : `node --test scripts/chaine/fusionner.test.mjs` rend 33 réussis et 2 échoués. Le pre-commit lu est celui du projet. Il diffère du gabarit : `pnpm exec lint-staged`, un audit propre au projet, `unset GIT_DIR GIT_INDEX_FILE`, puis un `pre-commit.local`, sans `pnpm run check:commit`. Le hook a tourné et réussi, les codes de sortie sont ceux attendus ; seules tombent les assertions qui attendent des lignes de journal que seul le gabarit fait écrire.

Quand le ticket est fait : posé dans un projet, `fusionner.test.mjs` prouve que les scripts du capitaine commitent et poussent sous des hooks git, et qu'un refus de hook donne la sortie 3 sans rien pousser, **sans rien supposer du hook du projet**. Le contenu du `pre-commit` du socle (lint-staged lit l'index, `check:commit` ne voit ni `GIT_DIR` ni `GIT_INDEX_FILE`) est prouvé contre le gabarit par un banc du plugin qui n'est jamais posé. Le garde `scripts/poses.test.mjs` tombe si un banc posé joue le pre-commit du projet.

## Où

Base : `origin/main` à `8c670e5` (plugin **7.5.0**), lignes relues le 2026-11-14. La session relève chaque ligne sur `origin/main` d'alors et retrouve les phrases par leur texte.

### La cause

`skills/chaine/fusionner/scripts/fusionner.test.mjs` :

- `:751-757` : posé (`depot-jouet.mjs` à côté), `PRE_COMMIT` vaut `../../.husky/pre-commit`, le hook du projet (`:754`) ; dans le plugin, le gabarit `socle-monorepo/references/husky/pre-commit` (`:755`).
- `:783` : `hooks(d)` copie ce fichier tel quel comme `pre-commit` du dépôt jouet.
- `:789` : un faux `npx` écrit `lint-staged GIT_INDEX_FILE=…` dans le journal. Seul un hook qui appelle **`npx`** l'écrit : le gabarit le fait (`npx --no -- lint-staged`, ligne 15 du gabarit).
- `:790-794` : un faux `pnpm` n'écrit `check:commit GIT_INDEX_FILE=…` dans le journal que pour **`pnpm run check:commit`**, la dernière ligne du gabarit (19). Toute autre commande `pnpm` réussit sans rien écrire dans le journal des hooks (il écrit dans `faux-gh/pnpm.log`, que personne ne lit).
- `:811-812` (test « passer.sh : un conflit d'index conclu sous les hooks (pre-commit, commit-msg, pre-push) ; lint-staged voit GIT_INDEX_FILE, check:commit non ») et `:883-884` (test « sujet.sh fusionner : une sous-PR en conflit d'index passe sous les hooks (sortie 8) ; un pre-push qui refuse donne 3, pas 5 ») exigent ces deux lignes.

Ces deux assertions éprouvent **l'ordre du gabarit** : lint-staged avant le `unset`, `check:commit` après. Elles n'éprouvent pas les scripts du capitaine. Le ticket 24 (PR 84) a mis le hook du projet à la place du gabarit sans séparer les deux : un projet dont le pre-commit diffère du gabarit voit ces tests rouges alors que ses scripts passent.

### Ce que chaque test « sous les hooks » suppose du hook

Les hooks `pre-push` et `commit-msg` sont écrits par le banc (`:772`, `:782`). Seul `pre-commit` vient d'un fichier.

| Test (`origin/main`) | Commit sous pre-commit ? | Ce qu'il suppose du contenu du pre-commit |
| --- | --- | --- |
| `:803` « passer.sh : un conflit d'index conclu sous les hooks (pre-commit, commit-msg, pre-push) ; lint-staged voit GIT_INDEX_FILE, check:commit non » | oui (commit de fusion) | qu'il réussisse dans le jouet, **qu'il appelle `npx` avant le `unset` et `pnpm run check:commit` après** (`:811-812`) |
| `:816` « passer.sh : un pre-push qui refuse donne la sortie 3, sa sortie sur stderr, le distant inchangé et un worktree propre » | oui | qu'il réussisse dans le jouet (sinon le refus vient du pre-commit et la sortie du pre-push manque, `:823`) |
| `:831` « passer.sh : un commit-msg qui refuse la fusion sans conflit donne la sortie 3, sans fusion en cours » | oui | rien, le refus vient du commit-msg écrit par le banc |
| `:877` « sujet.sh fusionner : une sous-PR en conflit d'index passe sous les hooks (sortie 8) ; un pre-push qui refuse donne 3, pas 5 » | oui | qu'il réussisse dans le jouet, **les deux lignes `npx` et `check:commit`** (`:883-884`) |
| `:934` « sujet.sh : ouvrir, livrer intermédiaire, rafraichir, relancer et geler réveillent le pre-push » | selon le geste | qu'il réussisse dans le jouet |
| `:944` « sujet.sh : un pre-push qui refuse donne 3 (geler : au premier essai, hook joué une fois, pas 9), distant inchangé, sortie du hook visible » | selon le geste | qu'il réussisse dans le jouet |

Outils dont dispose le hook dans le jouet : `git`, `node`, `jq`, le faux `gh`, le faux `pnpm` du dépôt jouet (`depot-jouet.mjs:93`, remplacé par celui de `:790-794`, qui réussit pour toute commande et n'écrit dans le journal des hooks que pour `pnpm run check:commit`), le faux `npx` (`:789`), et `sleep`. Le jouet n'a **ni `node_modules`, ni les scripts du projet, ni son `package.json`** : seuls `README.md`, `scripts/docs/adr-index.mjs`, `scripts/docs/index-generes.json` et `docs/adr/README.md` (`depot-jouet.mjs:126-130`).

### Reproduction, copie jetable

Copie de `origin/main` (`8c670e5`) : `skills/chaine/{fusionner,sujet,revue-adversariale}/scripts/*` posés à plat sous `scripts/chaine/`, `scripts/docs/` et `scripts/verify/` posés comme le fait le garde, le `commitlint.config.mjs` du socle à la racine, et un `.husky/pre-commit` différent du gabarit. Résultats de `node --test scripts/chaine/fusionner.test.mjs` (35 tests) :

- **Hook du type rapporté** : `pnpm exec lint-staged || exit 1`, `pnpm run audit:local || exit 1`, `unset GIT_DIR GIT_INDEX_FILE`, `if [ -x .husky/pre-commit.local ]; then .husky/pre-commit.local || exit 1; fi`. On obtient **33 réussis, 2 échoués**, comme chez le conducteur :
  - « passer.sh : un conflit d'index conclu sous les hooks (pre-commit, commit-msg, pre-push) ; lint-staged voit GIT_INDEX_FILE, check:commit non » : `AssertionError: lint-staged a vu GIT_INDEX_FILE : commit-msg,pre-push` (`:811`) ;
  - « sujet.sh fusionner : une sous-PR en conflit d'index passe sous les hooks (sortie 8) ; un pre-push qui refuse donne 3, pas 5 » : `AssertionError: check:commit GIT_INDEX_FILE=absent : commit-msg,pre-push` (`:883`).
- **Hook dont l'audit est un script du projet** : `pnpm exec lint-staged`, `node scripts/audit-local.mjs`, `unset GIT_DIR GIT_INDEX_FILE`, `[ -x .husky/pre-commit.local ] && .husky/pre-commit.local`. On obtient **32 réussis, 3 échoués**, et le hook refuse chaque commit du jouet (`Error: Cannot find module '<jouet>/travail/scripts/audit-local.mjs'`) :
  - `:803` : `[#30] commit refusé par un hook git (commit-msg, pre-commit) : sortie ci-dessus ; corriger, jamais en sautant le hook`, `3 !== 0` ;
  - `:816` : `AssertionError: la sortie du hook est visible` ;
  - `:877` : `commit refusé par un hook git (sortie ci-dessus) : mise à jour de #80 avec sujet/lot annulée`, `3 !== 8`.

Ce second cas montre que le hook réel d'un projet ne peut pas, en général, tourner dans le dépôt jouet. Il appelle ce que le jouet n'a pas : ses scripts, ses dépendances (`lint-staged`, `eslint`, `tsc`…), son `package.json`. Quand il passe, c'est que ses commandes tombent sur le faux `pnpm`, qui réussit toujours : il ne prouve alors rien de plus qu'un hook vide. Le banc ne joue donc jamais le hook réel. La preuve que les scripts passent sous le vrai hook du projet est l'usage même du capitaine dans le projet, et la CI.

### Pourquoi le garde ne l'a pas vu

`scripts/poses.test.mjs:24-27` (`RACINE_PROJET`) pose **le gabarit** `skills/monorepo/socle-monorepo/references/husky/pre-commit` comme `.husky/pre-commit` du projet jouet. Posé, le banc lit donc le gabarit, comme dans le plugin, et les deux lignes de journal sont écrites. Le garde ne joue jamais un pre-commit de projet différent du gabarit.

### Ce que dit la documentation

- `skills/chaine/fusionner/SKILL.md:14` : « et `fusionner.test.mjs` joue les scripts sous le `.husky/pre-commit` et le `commitlint.config.mjs` de la racine du projet ».
- `skills/chaine/fusionner/references/CONTENU.md:45` : « `passer.sh` sur un conflit d'index avec le vrai `pre-commit` du socle, un pre-push ou un commit-msg qui refuse (sortie 3, sortie du hook sur stderr, distant inchangé) ».
- `fusionner.test.mjs:744-750` : le commentaire d'en-tête du groupe.

## Décisions

1. **La décision du ticket 24 « posé, le banc joue sous les hooks du projet » (décision 3) est retirée pour le pre-commit.** C'est une décision de l'architecte à revoir. Elle reposait sur l'idée que le banc ferait tourner le hook réel, ce qui est impossible dans le dépôt jouet (§ « Reproduction »). Elle est **restreinte** au seul `commitlint.config.mjs` : posé, le banc lit les `ignores` de celui de la racine du projet, que le commit de fusion du capitaine doit passer. Le reporter passe avec la configuration de son projet. Un projet dont la configuration n'exporte pas `ignores` ne fait plus tomber le banc : le `commit-msg` de banc se replie sur `[(m) => /^Merge /.test(m)]` (décision 8).
2. **`fusionner.test.mjs` joue les scripts sous des hooks de banc qu'il écrit lui-même**, dans le plugin comme posé : `pre-commit`, `pre-push` et `commit-msg` journalisent leur nom et refusent sur demande (fichier `refus.<hook>`). Il ne lit plus aucun `pre-commit`. Ce qu'il prouve dans un projet : (a) les scripts du capitaine et de `sujet.sh` commitent et poussent sous des hooks, sans saut ; (b) un refus de hook (pre-commit, commit-msg, pre-push) donne la sortie 3, sans fusion en cours et sans rien pousser. Le pre-commit de banc ne fait pas de `unset` : un hook ne change pas l'environnement de son appelant, l'`unset` ne protège que les commandes du hook lui-même. C'est une propriété du gabarit, prouvée au point 3.
3. **Le contenu du gabarit est éprouvé par un banc du plugin, jamais posé** : `scripts/pre-commit-socle.test.mjs`, à la racine du plugin (les bancs de `scripts/` ne sont posés par aucune étape `poser`, voir `scripts/depot.test.mjs` et `scripts/poses.test.mjs`). Les assertions `:811-812` et `:883-884` n'y sont **ni retirées ni assouplies** : elles sont déplacées et renforcées. Le commit est fait depuis un `git worktree`, où git exporte `GIT_DIR` en plus de `GIT_INDEX_FILE`, et `check:commit` ne doit voir **ni l'un ni l'autre**. Trois mutations du gabarit, jouées, le font tomber : `unset` retiré, `unset` remonté avant lint-staged, `unset GIT_INDEX_FILE` seul.
4. **Le garde pose un pre-commit de projet qui refuse tout** et non plus le gabarit. Un banc posé qui le joue tombe. Une seule passe : le coût de `pnpm test` ne change pas (environ 50 s pour le garde, joué seul : 58 s, rouge, sur `origin/main`).
5. Un test de plus dans `fusionner.test.mjs` : un pre-commit qui refuse donne la sortie 3. Le cas rapporté porte sur le pre-commit, et aucun test ne prouvait son refus.
6. Ni `--no-verify`, ni test retiré, sauté ou assoupli ; aucune dépendance nouvelle.
7. **Patch** (§ 6). Si une autre PR du plugin entre d'abord, fusionner `main` dans la branche (commit de fusion, ni rebase ni push forcé) et prendre la version qui suit la sienne. Ordre décidé par l'architecte : 25, puis 26, puis 27 (le 26 touche la même ligne `version` de `plugin.json` et le même `fusionner/SKILL.md`).
8. **Un `commitlint.config.mjs` sans `ignores` ne fait plus tomber le banc.** Sur `origin/main`, le `commit-msg` de banc fait `config.ignores.some(…)` (`:778`) : sans `ignores`, `TypeError: Cannot read properties of undefined (reading 'some')`, le hook refuse chaque commit, et 5 à 7 tests tombent sans nommer le fichier (joué par le relecteur). La ligne devient `(config.ignores ?? [(m) => /^Merge /.test(m)]).some((f) => f(msg))`. Le repli `Merge` est nécessaire : un `?? []` fait refuser par le `commit-msg` de banc le commit de fusion du capitaine (`Merge …`, joué : `commit-msg jouet : message refusé`). Un test le prouve (§ 1.e).

### Remèdes écartés

- **Garder le hook du projet sans rien en supposer** (le test ne vérifie que le code de sortie et l'état git). Il est rouge dès que le hook appelle un script ou une dépendance du projet (second cas de la reproduction, 3 échecs). Quand il est vert, c'est parce que ses commandes tombent sur le faux `pnpm` : il ne prouve rien de plus qu'un hook de banc, et dépend en plus du hook de chaque projet.
- **Faire écrire au faux `pnpm` une ligne `lint-staged` pour `pnpm exec lint-staged`**, ou reconnaître d'autres formes du hook. On courrait après les variantes de chaque projet (`pnpm exec`, `npx`, `pnpm dlx`, scripts propres), et le banc continuerait d'éprouver le contenu d'un hook qu'il ne peut pas faire tourner.
- **Sauter les assertions de contenu quand le banc est posé** (`if (!POSE)`) : un test sauté dans un projet est un test retiré pour lui.
- **Garder le test du gabarit dans `fusionner.test.mjs`, joué sur le gabarit lu par le chemin du plugin** : posé, ce chemin n'existe pas (ticket 24), et il faudrait le sauter ou le faire échouer.
- **Poser le gabarit à côté du banc** (`scripts/chaine/socle/husky/pre-commit`) : on éprouverait dans le projet un fichier qui n'est pas son hook, et ce serait une copie de plus à tenir.
- **Rejouer le garde deux fois** (gabarit, puis hook de projet différent) : environ 50 s de plus pour rien. Après le remède, aucun banc posé ne lit le pre-commit, et une seule passe avec un hook qui refuse tout couvre les deux.

## À faire, dans l'ordre

### 0. Les tests d'abord, vus rouges sur `origin/main`

Écrire le garde du § 3, le jouer et le voir rouge ; puis seulement changer `fusionner.test.mjs`. Sur `8c670e5`, le garde seul (`node --test scripts/poses.test.mjs`) sort en 1, en 58 s, avec trois échecs de l'enfant :

- « passer.sh : un conflit d'index conclu sous les hooks (pre-commit, commit-msg, pre-push) ; lint-staged voit GIT_INDEX_FILE, check:commit non »
- « passer.sh : un pre-push qui refuse donne la sortie 3, sa sortie sur stderr, le distant inchangé et un worktree propre »
- « sujet.sh fusionner : une sous-PR en conflit d'index passe sous les hooks (sortie 8) ; un pre-push qui refuse donne 3, pas 5 »

### 1. `skills/chaine/fusionner/scripts/fusionner.test.mjs`

Remplacements exacts, joués (§ « Vérification »).

**a.** Remplacer les lignes `:744-799` (le commentaire `// Les scripts passent sous les hooks git du projet : …` jusqu'à la fin de `function hooks(d) { … }`, accolade fermante comprise ; la ligne `// ====…` de `:743` reste) par :

```js
// Les scripts passent sous les hooks git : jamais de saut (`--no-verify`). Le jouet reçoit des hooks de
// banc, écrits ici, qui journalisent leur nom et refusent sur demande (un fichier `refus.<hook>` dans la
// racine du jouet) : `pre-commit`, `pre-push`, et un `commit-msg` qui applique `ignores` du
// commitlint.config.mjs. Le contenu du `pre-commit` du socle (ordre de lint-staged et du `unset`) est
// prouvé contre le gabarit par scripts/pre-commit-socle.test.mjs du plugin, jamais posé : le hook d'un
// projet appelle ce que le jouet n'a pas (ses scripts, ses dépendances), il ne s'y joue pas.
// =============================================================================
// Posé dans un projet (depot-jouet.mjs à côté), commitlint.config.mjs est celui de la racine du projet ;
// dans le plugin, celui du socle. Absent, ces tests échouent sur une ligne qui le nomme, jamais sautés.
const POSE = existsSync(new URL("./depot-jouet.mjs", import.meta.url));
const COMMITLINT = fileURLToPath(
  new URL(POSE ? "../../commitlint.config.mjs" : "../../../monorepo/socle-monorepo/references/racine/commitlint.config.mjs", import.meta.url),
);
const REFUS = /pre-push jouet : refus/;

function hooks(d, commitlint = COMMITLINT) {
  if (!existsSync(commitlint)) assert.fail(`fichier manquant : ${commitlint} (posé par socle-monorepo) ; les tests sous les hooks en ont besoin`);
  const dir = join(d.racine, "hooks");
  const journal = join(d.racine, "hooks.log");
  const J = JSON.stringify(journal);
  mkdirSync(dir);
  const poser = (nom, corps) => {
    writeFileSync(join(dir, nom), `#!/bin/sh\n${corps}\n`);
    chmodSync(join(dir, nom), 0o755);
  };
  const refuse = (nom) =>
    `if [ -e ${JSON.stringify(join(d.racine, `refus.${nom}`))} ]; then echo "${nom} jouet : refus" >&2; exit 1; fi`;
  poser("pre-commit", `echo pre-commit >> ${J}\n${refuse("pre-commit")}`);
  poser("pre-push", `echo pre-push >> ${J}\n${refuse("pre-push")}`);
  writeFileSync(
    join(dir, "commit-msg.mjs"),
    `import { readFileSync } from "node:fs";
const { default: config } = await import(${JSON.stringify(commitlint)});
const msg = readFileSync(process.argv[2], "utf8");
if ((config.ignores ?? [(m) => /^Merge /.test(m)]).some((f) => f(msg))) process.exit(0);
if (!/^(feat|fix|docs|chore|refactor|test)(\\([a-z-]+\\))?: .+/.test(msg)) { console.error("commit-msg jouet : message refusé"); process.exit(1); }
`,
  );
  poser("commit-msg", `echo commit-msg >> ${J}\n${refuse("commit-msg")}\nexec node "$(dirname "$0")/commit-msg.mjs" "$1"`);
  d.git("config", "core.hooksPath", dir);
  const lire = () => (existsSync(journal) ? readFileSync(journal, "utf8").trim().split("\n") : []);
  const refuser = (nom) => writeFileSync(join(d.racine, `refus.${nom}`), "");
  return { lire, refuser, pushes: () => lire().filter((l) => l === "pre-push").length };
}
```

Le corps de `commit-msg.mjs` et la ligne `poser("commit-msg", …)` sont ceux de `origin/main` (`:773-782`), à deux changements près : le module importé est le paramètre `commitlint` (par défaut `COMMITLINT`, pour que le § 1.e pose une autre configuration) et le repli de `ignores` (décision 8). Disparaissent : `PRE_COMMIT`, `MANQUANT`, la copie du pre-commit (`:783-784`), le faux `npx` (`:789`) et le faux `pnpm` du banc (`:790-794`). Le faux `pnpm` du dépôt jouet (`depot-jouet.mjs:93`) reste celui que voient les scripts.

**b.** Test `:803` : le titre devient « passer.sh : un conflit d'index conclu sous les hooks (pre-commit, commit-msg, pre-push) » (la partie « ; lint-staged voit GIT_INDEX_FILE, check:commit non » part, avec ses assertions, dans `scripts/pre-commit-socle.test.mjs`). Les lignes `:809-812` deviennent :

```js
  assert.ok(lus.includes("pre-commit"), "pre-commit joué sur le commit de fusion");
  assert.ok(lus.includes("commit-msg"), "commit-msg joué sur le commit de fusion");
  assert.ok(lus.includes("pre-push"), "pre-push joué");
```

**c.** Test `:877`, titre inchangé : les lignes `:883-884` deviennent

```js
  for (const attendu of ["pre-commit", "commit-msg", "pre-push"]) assert.ok(lus.includes(attendu), `${attendu} : ${lus}`);
```

**d.** Nouveau test, juste avant le commentaire `// Sous-PR #80 et sujet/lot qui ajoutent chacun une ADR : conflit sur l'index seul.` :

```js
test("passer.sh : un pre-commit qui refuse le commit de fusion donne la sortie 3, sa sortie sur stderr, sans fusion en cours, distant inchangé", () => {
  const d = conflitIndex();
  const h = hooks(d);
  h.refuser("pre-commit");
  const avant = distant(d);
  const r = d.lancer(script("passer.sh"), "30");
  assert.equal(r.status, 3, r.stdout + r.stderr);
  assert.match(r.stderr, /pre-commit jouet : refus/);
  sansFusion(d);
  assert.equal(d.git("status", "--porcelain"), "");
  assert.equal(distant(d), avant);
  assert.equal(h.pushes(), 0, "rien n'est poussé");
});
```

**e.** Nouveau test, juste après celui du § 1.d (avant le même commentaire) :

```js
test("passer.sh : un commitlint.config.mjs sans ignores laisse passer le commit de fusion du capitaine", () => {
  const d = conflitIndex();
  const sansIgnores = join(d.racine, "commitlint.config.mjs");
  writeFileSync(sansIgnores, "export default { extends: ['@commitlint/config-conventional'] };\n");
  const h = hooks(d, sansIgnores);
  const r = d.lancer(script("passer.sh"), "30");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(h.lire().includes("commit-msg"), "commit-msg joué sur le commit de fusion");
  assert.match(d.git("log", "-1", "--format=%s", "origin/develop"), /^docs\(adr\): ADR 2 \(#30\)$/);
});
```

Joué dans la copie : rouge avec la ligne `config.ignores.some(…)` de `origin/main` (`[#30] commit refusé par un hook git (commit-msg, pre-commit) : sortie ci-dessus ; corriger, jamais en sautant le hook`, `TypeError: Cannot read properties of undefined (reading 'some')`, `3 !== 0`) ; rouge avec un repli `?? []` (`commit-msg jouet : message refusé`) ; vert avec le repli `Merge`. Il se pose sans rien de plus : la configuration est écrite dans la racine du jouet, hors du projet.

Les imports de `:7` restent : `readFileSync` et `chmodSync` servent toujours. Les autres tests « sous les hooks » (`:816`, `:831`, `:934`, `:944`) ne changent pas.

### 2. `scripts/pre-commit-socle.test.mjs` (créé)

Le fichier entier :

```js
// Le gabarit `husky/pre-commit` du socle, joué sur le dépôt jouet du skill `sujet` depuis un worktree :
// lint-staged lit l'index du commit (GIT_INDEX_FILE), `pnpm run check:commit` ne voit plus ni GIT_DIR ni
// GIT_INDEX_FILE (sinon ses bancs à `git init` jouet écriraient dans le dépôt réel). Banc du plugin, jamais
// posé : il éprouve le gabarit, pas le hook d'un projet. Les scripts du capitaine sous un hook quelconque
// sont éprouvés par fusionner.test.mjs, posé.
import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { depotJouet } from "../skills/chaine/sujet/scripts/depot-jouet.mjs";

const PRE_COMMIT = fileURLToPath(new URL("../skills/monorepo/socle-monorepo/references/husky/pre-commit", import.meta.url));

test("pre-commit du socle, depuis un worktree : lint-staged voit GIT_INDEX_FILE, check:commit ne voit ni GIT_DIR ni GIT_INDEX_FILE", () => {
  const d = depotJouet();
  const journal = join(d.racine, "hooks.log");
  const J = JSON.stringify(journal);
  const outil = (dossier, nom, corps) => {
    writeFileSync(join(dossier, nom), `#!/bin/sh\n${corps}\n`);
    chmodSync(join(dossier, nom), 0o755);
  };
  const hooks = join(d.racine, "hooks");
  mkdirSync(hooks);
  writeFileSync(join(hooks, "pre-commit"), readFileSync(PRE_COMMIT, "utf8"));
  chmodSync(join(hooks, "pre-commit"), 0o755);
  const vu = (nom) => `echo "${nom} GIT_DIR=\${GIT_DIR-absent} GIT_INDEX_FILE=\${GIT_INDEX_FILE-absent}" >> ${J}`;
  outil(join(d.racine, "bin"), "npx", vu("lint-staged"));
  outil(join(d.racine, "bin"), "pnpm", `cat > /dev/null\n[ "$1 $2" != "run check:commit" ] || ${vu("check:commit")}`);
  d.git("config", "core.hooksPath", hooks);
  const arbre = join(d.racine, "arbre");
  d.git("worktree", "add", "-q", "-b", "feat/w", arbre, "origin/develop");
  writeFileSync(join(arbre, "w.md"), "w\n");
  d.git("-C", arbre, "add", "w.md");
  d.git("-C", arbre, "commit", "-q", "-m", "docs: w");
  const lus = existsSync(journal) ? readFileSync(journal, "utf8").trim().split("\n") : [];
  assert.ok(lus.some((l) => /^lint-staged .*GIT_INDEX_FILE=(?!absent)/.test(l)), `lint-staged a vu GIT_INDEX_FILE : ${lus}`);
  assert.ok(lus.includes("check:commit GIT_DIR=absent GIT_INDEX_FILE=absent"), `check:commit ne les a pas vus : ${lus}`);
});
```

Il est vert sur le gabarit de `origin/main`, comme les assertions qu'il reprend. Sa preuve est la mutation : le gabarit modifié à la main dans une copie, il tombe dans les trois cas. `unset` retiré : `check:commit ne les a pas vus : … check:commit GIT_DIR=<jouet>/travail/.git/worktrees/arbre GIT_INDEX_FILE=…/index`. `unset` remonté avant lint-staged : `lint-staged a vu GIT_INDEX_FILE : lint-staged GIT_DIR=absent GIT_INDEX_FILE=absent,…`. `unset GIT_INDEX_FILE` seul : `check:commit ne les a pas vus : … check:commit GIT_DIR=<…> GIT_INDEX_FILE=absent`. Rien de la mutation n'est commité.

### 3. `scripts/poses.test.mjs` : le garde

- `:6` : ajouter `writeFileSync` à l'import de `node:fs` : `import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";`
- `:23-27` : remplacer `RACINE_PROJET` (et son commentaire) par :

```js
// Fichiers de la racine du projet que les bancs posés lisent (socle-monorepo, TABLE-RACINE.md).
const RACINE_PROJET = [["skills/monorepo/socle-monorepo/references/racine/commitlint.config.mjs", "commitlint.config.mjs"]];
// Le pre-commit d'un projet n'est pas le gabarit, et le dépôt jouet ne peut pas le faire tourner (il appelle
// les scripts et les dépendances du projet) : celui du garde refuse tout, un banc posé qui le joue tombe.
const PRE_COMMIT_PROJET = `#!/bin/sh
echo "pre-commit du projet : un banc posé ne le joue pas" >&2
exit 1
`;
```

- Juste après `for (const [source, destination] of RACINE_PROJET) poser(source, destination);` :

```js
    mkdirSync(join(projet, ".husky"));
    writeFileSync(join(projet, ".husky/pre-commit"), PRE_COMMIT_PROJET, { mode: 0o755 });
```

Rien d'autre ne change : titre, `PLANCHER`, délais. Rouge sur `origin/main` (§ 0), vert après le § 1.

### 4. Les textes

- `skills/chaine/fusionner/SKILL.md:14` : « et `fusionner.test.mjs` joue les scripts sous le `.husky/pre-commit` et le `commitlint.config.mjs` de la racine du projet » devient « et `fusionner.test.mjs` joue les scripts sous des hooks de banc qu'il écrit lui-même (jamais le `.husky/pre-commit` du projet, que le dépôt jouet ne peut pas faire tourner), avec les `ignores` du `commitlint.config.mjs` de la racine du projet ».
- `skills/chaine/fusionner/references/CONTENU.md:45` : « `passer.sh` sur un conflit d'index avec le vrai `pre-commit` du socle, un pre-push ou un commit-msg qui refuse (sortie 3, sortie du hook sur stderr, distant inchangé) » devient « `passer.sh` sur un conflit d'index sous des hooks de banc (pre-commit, commit-msg, pre-push), un pre-commit, un pre-push ou un commit-msg qui refuse (sortie 3, sortie du hook sur stderr, distant inchangé) ; le contenu du `pre-commit` du socle (lint-staged lit l'index, `check:commit` ne voit ni `GIT_DIR` ni `GIT_INDEX_FILE`, depuis un worktree) est éprouvé contre le gabarit par `scripts/pre-commit-socle.test.mjs` du plugin, qui n'est pas posé ».

### 5. Ce qui ne change pas

Aucun script (`passer.sh`, `sujet.sh`), aucun gabarit (`husky/pre-commit`, `husky/pre-push`, `commitlint.config.mjs`), aucune étape `poser`. Les projets n'ont rien à changer, sauf reposer `fusionner.test.mjs`.

### 6. La version — `.claude-plugin/plugin.json:3`

Règle du `README.md`, « Ajouter un skill », étape 4 : « Patch pour une correction, mineure pour un skill ou un gabarit ajouté, majeure quand un skill existant change de contrat. » Ici, une correction de banc : un banc posé change, aucun script ni gabarit, aucun contrat. On monte donc d'un **patch** la version qui suit `origin/main` à l'ouverture de la PR (troisième chiffre).

## Surfaces

| Surface | Preuve |
| --- | --- |
| banc posé avec un pre-commit de projet différent du gabarit (le fait) | `scripts/poses.test.mjs` « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » (rouge sur `origin/main` avec le pre-commit qui refuse tout, vert après le § 1) |
| les scripts sous les hooks, sans supposer le contenu du pre-commit | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : un conflit d'index conclu sous les hooks (pre-commit, commit-msg, pre-push) » et « sujet.sh fusionner : une sous-PR en conflit d'index passe sous les hooks (sortie 8) ; un pre-push qui refuse donne 3, pas 5 » |
| un refus du pre-commit donne 3, rien n'est poussé | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : un pre-commit qui refuse le commit de fusion donne la sortie 3, sa sortie sur stderr, sans fusion en cours, distant inchangé » |
| un `commitlint.config.mjs` de projet sans `ignores` | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : un commitlint.config.mjs sans ignores laisse passer le commit de fusion du capitaine » |
| le contenu du gabarit (déplacé, renforcé de `GIT_DIR`) | `scripts/pre-commit-socle.test.mjs` « pre-commit du socle, depuis un worktree : lint-staged voit GIT_INDEX_FILE, check:commit ne voit ni GIT_DIR ni GIT_INDEX_FILE » |
| les autres tests sous les hooks, inchangés et verts | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : un pre-push qui refuse donne la sortie 3, sa sortie sur stderr, le distant inchangé et un worktree propre », « passer.sh : un commit-msg qui refuse la fusion sans conflit donne la sortie 3, sans fusion en cours », « sujet.sh : ouvrir, livrer intermédiaire, rafraichir, relancer et geler réveillent le pre-push », « sujet.sh : un pre-push qui refuse donne 3 (geler : au premier essai, hook joué une fois, pas 9), distant inchangé, sortie du hook visible » |
| les textes | `git grep -n "vrai \`pre-commit\` du socle" -- skills/chaine/fusionner` et `git grep -n "sous le \`.husky/pre-commit\`" -- skills` ne rendent rien |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, au patch qui suit |

## Vérification

Joué sur une copie jetable de `8c670e5` avec les §§ 1-4 appliqués mot pour mot (chaque bloc de code de ce ticket est contenu tel quel dans les fichiers de la copie) :

- `fusionner.test.mjs` : avant le § 1.e, **36 sur 36** dans le plugin, et posé à plat 36 sur 36 avec le hook du type rapporté, avec un hook qui appelle un script absent du jouet et avec le gabarit. Avec le § 1.e, 37 tests ; posé, il est rejoué par le garde, sous le pre-commit qui refuse tout, vert.
- `scripts/pre-commit-socle.test.mjs` : 1 sur 1, rouge sous chacune des trois mutations du § 2.
- `pnpm test`, la copie faite dépôt git : **431 sur 431**, contre 428 sur `origin/main`, soit +3 (le test du § 1.d, celui du § 1.e, `scripts/pre-commit-socle.test.mjs`), en 72 s ; `scripts/poses.test.mjs` vert.

Pour la session :

- `pnpm test` vert, avec le compte de `origin/main` **plus 3**. Aucun test retiré ni sauté. Les assertions qui quittent `fusionner.test.mjs` (`lint-staged GIT_INDEX_FILE`, `check:commit GIT_INDEX_FILE=absent`) se retrouvent dans `scripts/pre-commit-socle.test.mjs` : `git grep -n "check:commit GIT_DIR=absent GIT_INDEX_FILE=absent" -- scripts/pre-commit-socle.test.mjs` rend une ligne. `git diff origin/main --stat -- '*.test.mjs'` ne montre que `fusionner.test.mjs`, `scripts/poses.test.mjs` et `scripts/pre-commit-socle.test.mjs`.
- `git grep -n "PRE_COMMIT\|lint-staged\|check:commit" -- skills/chaine/fusionner/scripts/fusionner.test.mjs` ne rend que le commentaire d'en-tête (aucune assertion, aucun outil).
- Posé à la main dans un dossier temporaire avec un `.husky/pre-commit` qui fait `exit 1` : `node --test scripts/chaine/fusionner.test.mjs` est vert. C'est ce que fait le garde.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche de documentation du programme sans le modifier, et commite sous les hooks, jamais avec `--no-verify`. Elle ouvre sa PR hors brouillon **sans poser `à-fusionner`** (`Label: contre-revue`) et écrit à l'architecte dès sa PR livrée.

## Hors périmètre

- **Un `commitlint.config.mjs` de projet en CommonJS** (`module.exports = …` dans un fichier `.mjs`) : le `commit-msg` de banc l'importe en module ES et tombe. Joué dans la copie avec le test du § 1.e, configuration remplacée par `module.exports = { extends: ['@commitlint/config-conventional'] };` : `[#30] commit refusé par un hook git (commit-msg, pre-commit) : sortie ci-dessus ; corriger, jamais en sautant le hook`, `ReferenceError: module is not defined in ES module scope`. Le socle pose une configuration ES (`export default`) ; un projet qui en change le format le verra rouge. À instruire à part si un projet le rencontre.
- `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs`, qui lit le gabarit `husky/pre-push` par le chemin du plugin : non posé (ticket 24, hors périmètre).
- Les hooks réels des projets : les adapter ou non au gabarit est leur affaire. Ce ticket cesse seulement de l'exiger.

## Comments

- 2026-11-14 — Instruit sur `8c670e5` (plugin 7.5.0). Fait reproduit dans une copie jetable posée à plat : 33 réussis, 2 échoués, mêmes titres et premières erreurs que le conducteur (`:811`, `:883`). Avec un audit qui est un script du projet : 32 et 3, le hook refuse chaque commit du jouet. Remède des §§ 1-3 joué : `fusionner` 36 sur 36 dans le plugin et posé sous trois pre-commit différents ; banc du gabarit rouge sous trois mutations ; garde rouge sur `origin/main` (58 s, trois échecs de l'enfant), vert après ; suite 428 → 430.
- 2026-11-14 — Relu : « prêt après corrections mineures », aucun bloquant. Corrections portées : un `commitlint.config.mjs` sans `ignores` est corrigé ici (décision 8, § 1.e ; test joué rouge sans la ligne, rouge avec `?? []`, vert avec le repli `Merge`), le cas CommonJS reste hors périmètre avec son résultat joué ; ordre 25, 26, 27 et fusion de `main` dans la branche si une autre PR du plugin entre d'abord (décision 7) ; le faux `pnpm` « n'écrit rien dans le journal des hooks ». Textes du § 4 appliqués dans la copie : les deux `git grep` du tableau « Surfaces » ne rendent rien. `pnpm test` dans la copie : 431 sur 431 (428 + 3).
