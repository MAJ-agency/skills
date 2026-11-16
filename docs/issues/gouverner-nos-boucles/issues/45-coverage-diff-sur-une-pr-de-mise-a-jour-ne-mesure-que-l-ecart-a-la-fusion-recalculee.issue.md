# `coverage-diff` sur une PR de mise à jour d'un sujet ne mesure que l'écart du sommet à la fusion recalculée de develop, et son journal n'est plus coupé quand il passe par un tube

Status: Fait — PR #101
Type: défaut
Label: contre-revue
Modèle: sonnet — une fonction et trois remplacements de ligne dans `coverage-diff.mjs`, un remplacement mécanique de `console.log` par une fonction, un fichier de test donné entier, trois textes donnés mot pour mot (ancien, nouveau) et la version ; tout est joué sur une copie jetable de `origin/main` (voir « Vérification »). Rien à concevoir.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/monorepo/socle-tests/references/scripts/verify/coverage-diff.mjs`, `skills/monorepo/socle-tests/references/scripts/verify/coverage-diff.test.mjs` (créé), `skills/monorepo/socle-tests/references/CONTENU.md`, `skills/monorepo/socle-tests/SKILL.md`, `.claude-plugin/plugin.json`

## Le besoin

Décision A-52 de l'architecte (carte, « Retours de `fedora` », 2026-11-16) : le constat de `fedora`, « `coverage-diff` mesure contre la base d'une PR de mise à jour, donc compte les fichiers venus de develop ; journal par `console.log` puis `process.exit` », était noté « probable, non joué ». **Il a été joué, sur `fa7d3eb` (plugin 7.9.0), dans un dépôt jouet** : les deux défauts sont reproduits.

### Défaut 1, reproduit : les fichiers de develop comptent comme nouveaux

Dépôt jouet : un distant nu, `develop` (un fichier `a.ts`), `sujet/x` parti de `develop` (un fichier `s.ts`), `develop` qui avance ensuite (deux fichiers `d1.ts` et `d2.ts`), puis `maj`, la branche de la PR de mise à jour : partie de `sujet/x`, `develop` fusionné dedans (un commit de fusion à deux parents, aucune retouche). Un `package.json` de `apps/api` avec un script `test` Vitest, le script de `fa7d3eb` en `--dry-run` (Vitest n'est pas lancé : la liste des fichiers est la même que celle qu'il recevrait).

| Appel | Base lue | Fichiers du diff |
| --- | --- | --- |
| `--base origin/sujet/x` (la CI nomme la cible de la PR, base de la PR de mise à jour) | `origin/sujet/x` | **`d1.ts` et `d2.ts`, tous deux « (nouveau) »** : ce que develop apporte, jugé à 90 % de lignes comme du code neuf |
| `--base-auto` sans `PRE_PUSH_REFS` | `origin/develop` : à égalité de distance (2 commits chacun), develop gagne | **`s.ts` « (nouveau) »** : tout le sujet, déjà fusionné |
| `--base-auto` avec `PRE_PUSH_REFS` visant `refs/heads/sujet/x` | `origin/sujet/x` | `d1.ts` et `d2.ts` « (nouveau) » |

Dans les trois cas, la PR de mise à jour, qui **ne contient aucun code écrit par son auteur**, est jugée sur du code qui n'est pas le sien : soit celui de develop (déjà jugé à son entrée dans develop), soit celui du sujet (déjà jugé dans ses sous-PR). Avec le moindre `develop` un peu long, le gate échoue sur des fichiers que l'auteur ne peut ni tester ni exempter : même impasse que le ticket 36 a fermée pour la revue exigée.

Cause : `coverage-diff.mjs:102-105` calcule `git merge-base <base> HEAD` puis `git diff --name-status <merge-base>` : pour une branche de mise à jour dont la base est le sujet, le merge-base est le sommet du sujet, et le diff contient **tout ce que la fusion de develop apporte**. `baseAuto()` (`:89-102`) n'a aucune notion de mise à jour : à égalité (`develop..HEAD` et `sujet..HEAD` comptent autant de commits), il rend develop.

### Défaut 2, reproduit : le journal se coupe dans un tube

Le script écrit par `console.log` (23 appels) et sort par `process.exit` (huit endroits sur `fa7d3eb`, inchangés à `76d90c7` : `:75`, `:119`, `:130`, `:145`, `:216`, `:220`, `:252`, `:274`). Sur un tube, la sortie de `console.log` est asynchrone ; `process.exit` n'attend pas qu'elle soit vidée. Dépôt jouet, 6 000 fichiers neufs dans le diff, `--dry-run` : le fichier de sortie reçoit 6 006 lignes, **un tube lu lentement 834 lignes (64 Ko sur 467 Ko), un tube lu vite 5 533 lignes, un `spawnSync` avec tampon 15 Ko**. Le banc ci-dessous le joue avec 3 000 fichiers et **un tube lent** (le lecteur attend une seconde avant de lire, quand le script a fini d'écrire et sorti) : **830 fichiers lus sur 3 000, cinq fois sur cinq** avant correctif (rejoué cinq fois sur `76d90c7`, cinq rouges ; cinq verts avec le correctif). La sortie est coupée dès qu'elle dépasse le tube (64 Ko, soit quelques centaines de fichiers, liste et tableau compris) : c'est la fin, donc le tableau et la ligne qui dit quel fichier est sous le seuil, qui disparaît. Même défaut que `fedora` a constaté sur `commitlint --verbose` (ticket 44).

### La règle cible

Sur une PR de mise à jour (la forme de A-47, telle que le ticket 40 l'a livrée, PR 99 : la fusion de develop dans le sujet, son premier commit, **puis** des retouches l'une après l'autre), `coverage-diff` ne mesure que **l'écart du sommet à la fusion recalculée** : `git merge-tree --write-tree <sommet du sujet> <commit de develop>`, ce que git ferait seul, puis ce que la PR y a ajouté ou résolu. Un fichier neuf de develop n'est pas un fichier de la PR ; une retouche, un conflit résolu ou un fichier ajouté après la fusion en est un, jugé aux seuils habituels (un fichier neuf reste neuf : 90 %). **Ailleurs, rien ne change** : une sous-PR du sujet, une PR vers develop, un push ordinaire, la base n'est pas touchée. Cohérent avec `verifier_mise_a_jour` de `sujet.sh` (:589-638), qui recalcule la même fusion par `merge-tree` pour borner ce que la fusion peut écrire (conflits et index régénérés), et avec **A-47 ter** (2026-11-16, qui amende A-47 avant la fusion de la PR 99) : la dispense par le formateur est retirée, chaque retouche est jugée commit par commit comme une sous-PR (`juger_retouches`, :643). `coverage-diff` fait de même : chaque fichier qu'une retouche touche compte, formatage compris, comme le compterait une sous-PR partie du sujet mis à jour ; aucune retouche n'est dispensée de mesure. L'intention du ticket tient donc telle quelle : A-47 ter ne retire au diff mesuré que ce qu'aucune version n'y mettait (ce que develop apporte), et lui garde tout ce que la PR écrit.

## Où

Base : `origin/main` à `5ccead9` (PR 99 fusionnée), plugin **7.10.0**, **597 tests**. `coverage-diff.mjs`, `SKILL.md` et `CONTENU.md` de `socle-tests` n'ont pas changé depuis `76d90c7` : les lignes ci-dessous valent pour les deux. La session retrouve chaque ancrage par son texte.

- `skills/monorepo/socle-tests/references/scripts/verify/coverage-diff.mjs` (276 lignes) : `baseAuto()` (`:89-102`), `BASE` (`:102`), `merge-base` (`:105`), la lecture du diff (`:134`), le journal (`:220`, `:252-274`) et ses `process.exit`.
- `…/coverage-diff-regles.mjs` : **ne change pas**. Il porte les règles pures (`choisirBase`, `baseDepuisPush`, `verdict`), testées par `coverage-diff-regles.test.mjs` ; la détection d'une mise à jour parle à git, elle reste dans le script, comme le reste de l'orchestration.
- Le script n'a pas de banc propre aujourd'hui, hors `--base-auto --dry-run` joué par `coverage-diff-regles.test.mjs:252-261`.
- Posé : `references/scripts/verify/*` → `scripts/verify/` (tests compris), `skills/monorepo/socle-tests/SKILL.md` étape 3. Le banc, qui ne lit que son voisin `coverage-diff.mjs`, tourne posé.

## Décisions

1. **Forme reconnue** (`fusionRecalculee(sujet)`, ci-dessous) : sur la première-parent de `HEAD`, le premier commit après le sommet de `origin/sujet/<nom>` est une fusion à **deux parents**, premier parent = ce sommet, second parent = un commit **dans `origin/develop` et absent du sujet** (la forme que `verifier_mise_a_jour` exige). Pas de condition sur ce qui suit : les retouches (A-47 ter) comptent toutes, et une seconde fusion, que le capitaine refuse (sortie 4), entre dans l'écart mesuré, ce qui est plus strict. Tout autre cas (pas de fusion, trois parents, sujet qui a avancé depuis, develop premier parent) : la mesure d'avant. **Un doute se résout toujours vers la mesure la plus stricte** : jamais un fichier de moins par erreur.
2. **Où la règle s'applique** : seulement quand la base retenue (`--base`, `--base-auto`, `PRE_PUSH_REFS`) est un `origin/sujet/*`. En `--base-auto`, une branche qui a la forme d'une mise à jour d'un sujet **choisit ce sujet**, même quand develop est aussi proche (la ligne ajoutée à `baseAuto`), sinon le pre-push d'une branche de mise à jour compterait tout le sujet (tableau du défaut 1, ligne 2).
3. **L'arbre de comparaison** est celui de `git merge-tree --write-tree --no-messages <p1> <p2>` (git ≥ 2.38, déjà exigé par `sujet.sh`). Un conflit (sortie 1) rend aussi son arbre, avec les marques de conflit : le fichier résolu par l'auteur en diffère, donc il compte. Sortie autre que 0 ou 1 : la forme n'est pas reconnue, mesure d'avant.
4. **Le journal par `writeSync`** : `console.log` devient `dire` (écriture synchrone sur la sortie standard, nouvelle tentative sur `EAGAIN`) ; les `process.exit` ne changent pas. Même remède que `commits-a-relire.mjs` de `fedora` #1935 (`writeSync`), sans sa dépendance à un code de sortie par `process.exitCode` : le script sort à de nombreux endroits.
5. **Version** : correctif, patch du plugin (`.claude-plugin/plugin.json:3`, 7.10.0 → 7.10.1 sur `5ccead9`). La version suit celle de `origin/main` à l'ouverture de la PR : le troisième nombre plus un (7.11.1 si la PR 98 du ticket 33, en correction, qui vise 7.11.0, ou le ticket 42, mineur, est fusionnée avant ; un cran de plus si le ticket 41 l'est aussi). **Règle de repli** : si `main` bouge entre l'ouverture et la fusion, la session fusionne `origin/main` dans sa branche par un commit de fusion (jamais de rebase ni de push forcé), recalcule la version sur celle de `main`, puis vérifie la valeur après la fusion.
6. **En CI, la recette du gate lit la tête de la PR, pas la fusion d'essai** (décision de l'architecte, 2026-11-16). `actions/checkout` met par défaut en `HEAD` la fusion d'essai de GitHub (`refs/pull/N/merge`), un commit de fusion dont le second parent est la tête de la PR : la forme d'une mise à jour (fusion de develop, sommet du sujet en premier parent) y est masquée, et un checkout superficiel (c'est celui du job `test-db` d'un projet, profondeur 1) n'a ni l'ascendance ni `origin/develop`. **`fusionRecalculee` ne reconnaît pas la fusion d'essai** : un test le garde (retombée sur la mesure d'avant, la plus stricte). C'est la recette qui change, par cette phrase, mot pour mot, ajoutée au préalable 4 de `skills/monorepo/socle-tests/SKILL.md` et à la section « Le gate `coverage-diff` » de `references/CONTENU.md` :

   > En CI, le job qui joue `coverage-diff` fait le checkout de `github.event.pull_request.head.sha` avec `fetch-depth: 0` (jamais la fusion d'essai que GitHub met par défaut en `HEAD`, qui masque la forme d'une PR de mise à jour : la mesure retombe alors sur la base entière) et dispose d'`origin/develop` (`fetch-depth: 0` rapatrie toutes les branches ; sinon `git fetch origin develop`) ; il passe `--base origin/<cible de la PR>`.

   **Le job du socle** : le `ci.yml` du socle de la chaîne n'a aucun job qui joue `coverage-diff` (`grep -n coverage-diff skills/chaine/socle-chaine-de-production/references/ci/ci.yml` ne rend rien, vérifié encore après la PR 97 qui l'a modifié), et son `qualite` a déjà `fetch-depth: 0` (ligne 26) : rien à y changer. Si un projet ajoute le job, la phrase est sa recette. Les ADR et fiches du projet ne sont pas réécrits par ce ticket.
7. **Aucune dispense de mesure pour une retouche** (A-47 ter). Une retouche de formatage d'un fichier venu de develop, typique après la montée d'un formateur, compte comme un fichier **modifié** (80 % de lignes, 70 % de branches), pas comme un fichier neuf : contre la fusion recalculée, il existe déjà ; c'est ce que mesurerait une sous-PR partie du sujet mis à jour. Un test le garde. Coût, celui d'A-47 ter : après une montée d'outil, les fichiers reformatés doivent être couverts, ou exemptés par la ligne nommée `// coverage-diff: ignore — <raison>`.

## À faire, dans l'ordre

### 0. Le banc d'abord, vu rouge sur `origin/main`

Créer `skills/monorepo/socle-tests/references/scripts/verify/coverage-diff.test.mjs` avec le contenu ci-dessous, **mot pour mot**. Sur `origin/main` : **6 rouges sur 10** (les cinq cas de la PR de mise à jour et le tube lent, ce dernier rouge **cinq fois sur cinq**, joué sur `5ccead9` : `830 fichiers sur 3000`) ; les quatre autres (sous-PR du sujet, PR vers develop, sujet qui a avancé, fusion d'essai) sont verts et le restent : ils gardent la mesure d'avant.

```js
// `node --test scripts/verify/coverage-diff.test.mjs` : ce que `coverage-diff.mjs` compte comme le diff, sur de vrais
// dépôts git jetables (un distant nu, develop, un sujet), en `--dry-run` : Vitest n'est pas lancé. Une PR de mise
// à jour d'un sujet (la fusion de develop dans le sujet, puis des retouches) ne mesure que l'écart du sommet à la
// fusion recalculée ; partout ailleurs, la mesure est celle d'avant. Et le journal d'une longue sortie n'est pas
// coupé quand il passe par un tube lent.
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const ICI = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(ICI, "coverage-diff.mjs");
const ENV = Object.fromEntries(Object.entries(process.env).filter(([c]) => !c.startsWith("GIT_") && c !== "NODE_TEST_CONTEXT" && c !== "PRE_PUSH_REFS"));

const dossiers = [];
const dossier = (prefixe) => {
  const d = mkdtempSync(join(tmpdir(), prefixe));
  dossiers.push(d);
  return d;
};
after(() => {
  for (const d of dossiers) rmSync(d, { recursive: true, force: true });
});

const git = (cwd, ...args) => execFileSync("git", args, { cwd, encoding: "utf8", env: ENV }).trim();
function ecrire(depot, chemin, texte) {
  mkdirSync(join(depot, dirname(chemin)), { recursive: true });
  writeFileSync(join(depot, chemin), texte);
}
function valider(depot, message) {
  git(depot, "add", "-A");
  git(depot, "commit", "-q", "-m", message);
}

/**
 * develop (d1) ; sujet/x parti de d1 (s.ts) ; develop avance (d1.ts, d2.ts) ; `maj` = le sujet plus la fusion de
 * develop. Le paquet apps/api a un `test` Vitest : ses fichiers sont listés en `--dry-run`.
 */
function depot() {
  const nu = dossier("cov-nu-");
  git(nu, "init", "-q", "--bare");
  const r = dossier("cov-depot-");
  git(r, "init", "-q", "-b", "develop");
  git(r, "config", "user.email", "jouet@example.invalid");
  git(r, "config", "user.name", "Jouet");
  git(r, "remote", "add", "origin", nu);
  ecrire(r, "apps/api/package.json", '{"scripts":{"test":"vitest run"}}\n');
  ecrire(r, "apps/api/src/a.ts", "export const a = 1;\n");
  valider(r, "d1");
  git(r, "push", "-q", "origin", "develop");
  git(r, "checkout", "-q", "-b", "sujet/x");
  ecrire(r, "apps/api/src/s.ts", "export const s = 1;\n");
  valider(r, "s1");
  git(r, "push", "-q", "origin", "sujet/x");
  git(r, "checkout", "-q", "develop");
  ecrire(r, "apps/api/src/d1.ts", "export const d1 = 1;\n");
  ecrire(r, "apps/api/src/d2.ts", "export const d2 = 1;\n");
  valider(r, "d2");
  git(r, "push", "-q", "origin", "develop");
  git(r, "checkout", "-q", "-b", "maj", "sujet/x");
  git(r, "merge", "-q", "--no-ff", "-m", "chore: fusionne develop dans sujet/x", "develop");
  git(r, "fetch", "-q", "origin");
  return r;
}

function jouer(r, args, env = {}) {
  const res = spawnSync(process.execPath, [SCRIPT, "--dry-run", ...args], {
    cwd: r,
    env: { ...ENV, PROJET_RACINE: r, ...env },
    encoding: "utf8",
  });
  const listes = (res.stdout.match(/^ {3}• (\S+)/gm) ?? []).map((l) => l.replace(/^ {3}• /, ""));
  return { statut: res.status, sortie: res.stdout + res.stderr, listes, brut: res.stdout };
}

test("PR de mise à jour, la fusion seule : aucun fichier de develop ne compte", () => {
  const r = depot();
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.equal(j.statut, 0, j.sortie);
  assert.deepEqual(j.listes, []);
  assert.match(j.sortie, /aucun fichier de code dans le diff/);
});

test("PR de mise à jour avec retouches : seules les retouches comptent, un fichier neuf reste neuf", () => {
  const r = depot();
  ecrire(r, "apps/api/src/s.ts", "export const s = 2;\n");
  ecrire(r, "apps/api/src/retouche.ts", "export const retouche = 1;\n");
  valider(r, "retouche");
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.deepEqual(j.listes, ["apps/api/src/retouche.ts", "apps/api/src/s.ts"]);
  assert.match(j.brut, /retouche\.ts \(nouveau\)/);
  assert.doesNotMatch(j.brut, /s\.ts \(nouveau\)/);
});

test("PR de mise à jour avec un conflit résolu : le fichier en conflit compte, pas ceux de develop", () => {
  const r = depot();
  git(r, "checkout", "-q", "develop");
  ecrire(r, "apps/api/src/a.ts", "export const a = 'develop';\n");
  valider(r, "develop touche a");
  git(r, "push", "-q", "origin", "develop");
  git(r, "checkout", "-q", "sujet/x");
  ecrire(r, "apps/api/src/a.ts", "export const a = 'sujet';\n");
  valider(r, "sujet touche a");
  git(r, "push", "-q", "origin", "sujet/x");
  git(r, "checkout", "-q", "-b", "maj2", "sujet/x");
  assert.throws(() => git(r, "merge", "--no-ff", "-m", "chore: fusionne develop dans sujet/x", "develop"));
  ecrire(r, "apps/api/src/a.ts", "export const a = 'les deux';\n");
  git(r, "add", "-A");
  git(r, "commit", "-q", "--no-edit");
  git(r, "fetch", "-q", "origin");
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.deepEqual(j.listes, ["apps/api/src/a.ts"]);
});

test("PR de mise à jour : une retouche de formatage d'un fichier venu de develop compte, comme dans une sous-PR (A-47 ter : aucune dispense)", () => {
  const r = depot();
  ecrire(r, "apps/api/src/d1.ts", "export const d1 = 1\n");
  valider(r, "style: formate d1");
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.deepEqual(j.listes, ["apps/api/src/d1.ts"]);
  assert.doesNotMatch(j.brut, /d1\.ts \(nouveau\)/, "un fichier de develop retouché est modifié, pas neuf");
});

test("pre-push d'une branche de mise à jour (--base-auto) : la base est le sujet, même à égalité avec develop", () => {
  const r = depot();
  const j = jouer(r, ["--base-auto"]);
  assert.match(j.sortie, /la fusion recalculée de develop dans origin\/sujet\/x/);
  assert.deepEqual(j.listes, []);
});

test("hors mise à jour, rien ne change : une sous-PR du sujet compte ses fichiers contre le sujet", () => {
  const r = depot();
  git(r, "checkout", "-q", "-b", "feat/y", "sujet/x");
  ecrire(r, "apps/api/src/y.ts", "export const y = 1;\n");
  valider(r, "y");
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.deepEqual(j.listes, ["apps/api/src/y.ts"]);
  assert.match(j.brut, /y\.ts \(nouveau\)/);
});

test("hors mise à jour, rien ne change : une PR vers develop compte ses fichiers contre develop", () => {
  const r = depot();
  git(r, "checkout", "-q", "-b", "feat/z", "develop");
  ecrire(r, "apps/api/src/z.ts", "export const z = 1;\n");
  valider(r, "z");
  const j = jouer(r, ["--base", "origin/develop"]);
  assert.deepEqual(j.listes, ["apps/api/src/z.ts"]);
});

test("un sujet qui a avancé depuis la fusion : la forme n'est plus celle d'une mise à jour, la mesure est celle d'avant", () => {
  const r = depot();
  git(r, "checkout", "-q", "sujet/x");
  ecrire(r, "apps/api/src/avance.ts", "export const avance = 1;\n");
  valider(r, "le sujet avance");
  git(r, "push", "-q", "origin", "sujet/x");
  git(r, "checkout", "-q", "maj");
  git(r, "fetch", "-q", "origin");
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.ok(j.listes.includes("apps/api/src/d1.ts"), j.sortie);
});

test("la fusion d'essai de GitHub (refs/pull/N/merge) n'est pas reconnue : la mesure est celle d'avant, la plus stricte", () => {
  const r = depot();
  // Le checkout par défaut d'un `pull_request` : un commit de fusion du sujet et de la tête de la PR (qui contient
  // déjà le sujet). Son second parent n'est pas dans develop : la forme d'une mise à jour est masquée.
  git(r, "checkout", "-q", "-b", "essai", "sujet/x");
  git(r, "merge", "-q", "--no-ff", "-m", "Merge maj into sujet/x", "maj");
  const j = jouer(r, ["--base", "origin/sujet/x"]);
  assert.ok(j.listes.includes("apps/api/src/d1.ts"), j.sortie);
  assert.doesNotMatch(j.sortie, /la fusion recalculée/);
});

// Une sortie longue lue par un tube lent : le lecteur ne commence à lire qu'après une seconde, quand le script a
// fini d'écrire et sorti. Avec `console.log` puis `process.exit`, la sortie est coupée à chaque fois.
test("une longue sortie lue par un tube lent n'est jamais coupée", () => {
  const r = depot();
  git(r, "checkout", "-q", "-b", "gros", "develop");
  const n = 3000;
  for (let i = 0; i < n; i++) ecrire(r, `apps/api/src/g/fichier-numero-${i}-avec-un-nom-assez-long.ts`, `export const v${i} = ${i};\n`);
  valider(r, "gros");
  const res = spawnSync("sh", ["-c", '"$0" "$@" | { sleep 1; cat; }', process.execPath, SCRIPT, "--dry-run", "--base", "origin/develop"], {
    cwd: r,
    env: { ...ENV, PROJET_RACINE: r },
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const lus = (res.stdout.match(/^ {3}• /gm) ?? []).length;
  assert.equal(lus, n, `${lus} fichiers sur ${n} : la sortie a été coupée`);
  assert.match(res.stdout, new RegExp(`--dry-run — ${n} fichier\\(s\\) à mesurer`));
});
```

### 1. `coverage-diff.mjs`

Cinq remplacements, dans cet ordre.

**a. Import** : `import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";` devient `import { existsSync, mkdtempSync, readFileSync, rmSync, writeSync } from "node:fs";`.

**b. Le journal.** Avant `const ROOT = resolve(…)`, insérer :

```js
/**
 * Le journal, écrit d'un bloc synchrone sur la sortie standard : `console.log` suivi de `process.exit` coupe une
 * sortie longue lue par un tube (le tube n'est pas vidé à la sortie). EAGAIN (tube plein, descripteur non
 * bloquant) : on réessaie.
 */
function dire(texte = "") {
  const octets = Buffer.from(`${texte}\n`);
  for (let ecrit = 0; ecrit < octets.length; ) {
    try {
      ecrit += writeSync(1, octets, ecrit);
    } catch (e) {
      if (e.code !== "EAGAIN") throw e;
    }
  }
}

```

puis remplacer **chacun des 23** `console.log(` du fichier par `dire(` (`git grep -c 'console.log(' origin/main -- <le fichier>` rend 23 ; après : 0). Aucun appel n'a plus d'un argument.

**c. La détection.** Juste avant le commentaire `/** Ce sur quoi le travail sera fusionné`, insérer :

```js
/**
 * PR de mise à jour d'un sujet (la fusion de develop dans le sujet, puis des retouches) : le premier commit de
 * HEAD hors de `sujet` est une fusion à deux parents, le sommet du sujet puis un commit de develop absent du sujet.
 * Rend l'arbre de la fusion recalculée par git (`merge-tree`, git >= 2.38), à qui on compare le sommet : seules les
 * retouches et les conflits résolus comptent, pas ce que develop apporte. Null si HEAD n'a pas cette forme, ou si
 * git ne sait pas la recalculer : la mesure est alors celle d'avant, plus stricte, jamais plus lâche.
 */
function fusionRecalculee(sujet) {
  const sommet = gitOk("rev-parse", "--verify", "--quiet", `${sujet}^{commit}`);
  if (!sommet) return null;
  const premier = (gitOk("rev-list", "--first-parent", "--reverse", `${sommet}..HEAD`) ?? "").split("\n")[0];
  if (!premier) return null;
  const [, p1, p2, reste] = (gitOk("rev-list", "--parents", "-n", "1", premier) ?? "").split(" ");
  if (p1 !== sommet || !p2 || reste) return null;
  if (gitOk("merge-base", "--is-ancestor", p2, BASE_DEFAUT) === null) return null;
  if (gitOk("merge-base", "--is-ancestor", p2, sommet) !== null) return null;
  const r = spawnSync("git", ["merge-tree", "--write-tree", "--no-messages", p1, p2], { cwd: ROOT, encoding: "utf8" });
  return r.status === 0 || r.status === 1 ? r.stdout.split("\n")[0] || null : null;
}

```

**d. `baseAuto()`** : avant la ligne `const candidats = [BASE_DEFAUT, ...refs]`, insérer

```js
  // Une branche de mise à jour d'un sujet se mesure contre ce sujet, même à égalité de distance avec develop.
  const sujetMisAJour = refs.find((ref) => fusionRecalculee(ref));
  if (sujetMisAJour) return sujetMisAJour;
```

**e. La référence du diff.** Après le bloc `try { mergeBase = … } catch { … }` et avant `/** fichier → 'A' (nouveau) | 'M' (modifié). */`, insérer

```js
// PR de mise à jour : on compare le sommet à la fusion recalculée, pas à la base.
const fusion = /^origin\/sujet\//.test(String(BASE)) ? fusionRecalculee(BASE) : null;
const REFERENCE = fusion ?? mergeBase;
const COMPARE_A = fusion ? `la fusion recalculée de develop dans ${BASE} (${fusion.slice(0, 8)})` : `${BASE} (${mergeBase.slice(0, 8)})`;
```

puis, dans la lecture du diff, `git("diff", "--name-status", "--diff-filter=ACMR", mergeBase)` devient `…, REFERENCE)`, et les deux messages qui disent `${BASE} (${mergeBase.slice(0, 8)})` (« aucun fichier de code dans le diff par rapport à … » et « base … — N fichier(s) de code dans le diff ») disent `${COMPARE_A}`.

### 2. Les textes, mot pour mot

Chaque « Ancien » apparaît **une seule fois** dans son fichier à `5ccead9` (vérifié) ; T2 et T3 sont des insertions dont l'ancre est répétée : à appliquer une fois. T1 et T2 portent la phrase exacte de la décision 6. (La rédaction précédente disait « ligne de l'étape 4 » de `SKILL.md` : c'est le préalable 4, seule ligne qui parle de `--base-auto` ; l'étape 4 est l'historique.)

#### T1 — `skills/monorepo/socle-tests/SKILL.md`, préalable 4

Ancien :

````text
et au pre-push (`--base-auto`) au sujet visé par le push ou au plus proche de develop et des `origin/sujet/*`.
````

Nouveau :

````text
et au pre-push (`--base-auto`) au sujet visé par le push ou au plus proche de develop et des `origin/sujet/*` (une branche de mise à jour d'un sujet choisit ce sujet). Sur une PR de mise à jour d'un sujet, seul l'écart du sommet à la fusion recalculée de develop compte, retouches et conflits résolus compris. En CI, le job qui joue `coverage-diff` fait le checkout de `github.event.pull_request.head.sha` avec `fetch-depth: 0` (jamais la fusion d'essai que GitHub met par défaut en `HEAD`, qui masque la forme d'une PR de mise à jour : la mesure retombe alors sur la base entière) et dispose d'`origin/develop` (`fetch-depth: 0` rapatrie toutes les branches ; sinon `git fetch origin develop`) ; il passe `--base origin/<cible de la PR>`.
````

#### T2 — `skills/monorepo/socle-tests/references/CONTENU.md`, section « Le gate `coverage-diff` », fin du paragraphe « La base est ce sur quoi le travail sera fusionné »

Ancien :

````text
Aucun seuil ne baisse, aucun fichier n'est exempté.
````

Nouveau :

````text
Aucun seuil ne baisse, aucun fichier n'est exempté. **Sur une PR de mise à jour d'un sujet** (la fusion de develop dans le sujet, son premier commit, puis des retouches), seul compte l'écart du sommet à la fusion recalculée (`git merge-tree --write-tree` du sommet du sujet et du commit de develop), jamais ce que develop apporte : les conflits résolus et chaque retouche, jugée comme une sous-PR, formatage compris (aucune dispense par le formateur), aux seuils habituels ; la sortie le dit (« la fusion recalculée de develop dans … ») ; toute autre forme (pas de fusion, trois parents, sujet qui a avancé, fusion d'essai de GitHub) se mesure comme avant, contre la base entière. Le journal s'écrit de façon synchrone (`writeSync`) : un tube lu lentement ne le coupe plus. En CI, le job qui joue `coverage-diff` fait le checkout de `github.event.pull_request.head.sha` avec `fetch-depth: 0` (jamais la fusion d'essai que GitHub met par défaut en `HEAD`, qui masque la forme d'une PR de mise à jour : la mesure retombe alors sur la base entière) et dispose d'`origin/develop` (`fetch-depth: 0` rapatrie toutes les branches ; sinon `git fetch origin develop`) ; il passe `--base origin/<cible de la PR>`.
````

#### T3 — `skills/monorepo/socle-tests/references/scripts/verify/coverage-diff.mjs`, en-tête, « Ce qu'il fait », point 1

Ancien :

````text
 *      compris, fichiers non suivis compris), filtrés sur le code (`coverage-diff-regles.mjs`).
````

Nouveau :

````text
 *      compris, fichiers non suivis compris), filtrés sur le code (`coverage-diff-regles.mjs`).
 *      PR de mise à jour d'un sujet : le diff part de la fusion recalculée de develop dans le sujet.
````

### 3. La version : `.claude-plugin/plugin.json:3`

`"version"` seule, patch : 7.10.0 → 7.10.1 si rien n'a bougé ; règle de repli : décision 5.

## Surfaces

| Surface | Preuve |
| --- | --- |
| PR de mise à jour, la fusion seule : aucun fichier de develop | `coverage-diff.test.mjs` « PR de mise à jour, la fusion seule : aucun fichier de develop ne compte » |
| avec retouches : seules les retouches, un fichier neuf reste neuf | « PR de mise à jour avec retouches : seules les retouches comptent, un fichier neuf reste neuf » |
| conflit résolu | « PR de mise à jour avec un conflit résolu : le fichier en conflit compte, pas ceux de develop » |
| retouche de formatage d'un fichier de develop : comptée, modifiée et non neuve (A-47 ter) | « PR de mise à jour : une retouche de formatage d'un fichier venu de develop compte, comme dans une sous-PR (A-47 ter : aucune dispense) » |
| pre-push (`--base-auto`) | « pre-push d'une branche de mise à jour (--base-auto) : la base est le sujet, même à égalité avec develop » |
| sous-PR du sujet inchangée | « hors mise à jour, rien ne change : une sous-PR du sujet compte ses fichiers contre le sujet » |
| PR vers develop inchangée | « hors mise à jour, rien ne change : une PR vers develop compte ses fichiers contre develop » |
| forme non reconnue : mesure d'avant | « un sujet qui a avancé depuis la fusion : la forme n'est plus celle d'une mise à jour, la mesure est celle d'avant » |
| journal complet dans un tube lent | « une longue sortie lue par un tube lent n'est jamais coupée » (rouge cinq fois sur cinq sans le correctif) |
| la fusion d'essai de GitHub n'est pas reconnue : mesure d'avant | « la fusion d'essai de GitHub (refs/pull/N/merge) n'est pas reconnue : la mesure est celle d'avant, la plus stricte » |
| la recette CI du gate dit de lire la tête, à profondeur complète | `grep -n 'head.sha' skills/monorepo/socle-tests/SKILL.md skills/monorepo/socle-tests/references/CONTENU.md` rend la phrase de la décision 6 aux deux endroits ; `grep -n 'coverage-diff' skills/chaine/socle-chaine-de-production/references/ci/ci.yml` ne rend rien (le job du socle n'existe pas : voir décision 6) |
| les règles pures | `coverage-diff-regles.test.mjs`, inchangé et vert |
| plus de `console.log` | `git grep -c 'console.log(' -- skills/monorepo/socle-tests/references/scripts/verify/coverage-diff.mjs` vaut 0 |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` |

## Vérification

Dans une copie jetable de `origin/main` : `git worktree add --detach <dossier jetable> origin/main`, un `TMPDIR` privé (`export TMPDIR=<dossier jetable>/tmp && mkdir -p "$TMPDIR"`).

- Le banc du § 0 seul sur `origin/main` : **6 rouges, 4 verts** (dont « 830 fichiers sur 3000 : la sortie a été coupée », **cinq fois sur cinq** : lancer cinq fois `node --test --test-name-pattern='tube lent' …`, cinq rouges attendus). Avec le § 1 : **10 verts sur 10**, et cinq passes du banc entier vertes (joué le 2026-11-16 sur `76d90c7`, puis sur `5ccead9` : cinq passes à 6 rouges sans le § 1, cinq à 10 verts avec).
- `pnpm install --frozen-lockfile && pnpm test` : le compte de `origin/main` **plus 10** (597 + 10 = **607**, joué sur `5ccead9` avec les §§ 1 à 3), tout vert, sans test retiré ni sauté. `git diff origin/main --stat -- '*.test.mjs'` ne montre que le banc du § 0 ; `git diff origin/main --stat` les cinq fichiers de « Fichiers chauds ». Avec les tickets 41 et 42 appliqués avant lui : 628 sur 628, sans conflit.
- `ls "$TMPDIR" | grep -c '^cov-'` vaut **0** après la passe : le banc retire ses dossiers.
- Retirer la copie jetable à la fin (`git worktree remove --force`) et le `TMPDIR` privé.

## Ce qui n'a pas été établi

- **La mesure Vitest elle-même** : tout est joué en `--dry-run`, donc sur la liste des fichiers que le script donnerait à `vitest related`. Les seuils, la couverture et la fusion des rapports ne changent pas.
- **La CI réelle d'un projet** : la recette (décision 6) n'a pas été jouée sur un projet posé ; la forme de la fusion d'essai pour une mise à jour n'a pas été relevée sur GitHub (le test la fabrique, un commit de fusion `sujet` + tête). Si un projet constate que `head.sha` ne suffit pas, la phrase se corrige, pas le script.
- Une PR de mise à jour qui précède le ticket 40 (la fusion seule, sans retouche) est déjà couverte : le cas « la fusion seule » du banc.

## Hors périmètre

- La forme de la PR de mise à jour et ses contrôles (`sujet.sh`, `boucle.sh`) : ticket 40, fait (PR 99, avec A-47 ter).
- `coverage-diff.mjs:60` calcule `ROOT` par `new URL("../..", import.meta.url).pathname` : faux dans un chemin à espace ou à accent sans `PROJET_RACINE` (relevé au ticket 43, « Hors périmètre »).

## Comments

- 2026-11-16 — **Fait** : PR 101, fusionnée `22ae4cd`, plugin 7.10.1. Contre-relue conforme (13 scénarios adverses dont une fusion à code caché : aucun fichier de code changé n'échappe à la mesure ; replis fermés). Test du tube lent réécrit sans shell pour une alerte CodeQL (rouge 5/5 sur l'ancien script).
- 2026-11-16 — Instruit sur `fa7d3eb` (plugin 7.9.0). Les deux défauts sont reproduits (voir « Le besoin »), le correctif et son banc sont joués sur une copie jetable : 5 rouges sur 8 avant, 8 verts sur 8 après, `coverage-diff-regles.test.mjs` vert. Le ticket 40 (A-47) n'est pas encore écrit : la forme reconnue est celle de la décision A-47 de la carte ; si le ticket 40 la précise autrement (par exemple l'ordre des parents), ajuster `fusionRecalculee` et les cas 1 à 4 du banc.
- 2026-11-16 (relecture) — Recalé sur `76d90c7` (7.9.1, 528 tests ; le ticket 40 est écrit : la forme reconnue, première-parent = fusion à deux parents, sommet du sujet puis develop, puis des retouches linéaires, est la sienne). Corrigé : la CI (décision 6, phrase exacte, test de la fusion d'essai) ; le test du tube lit par un tube lent (`sleep 1`), rouge cinq fois sur cinq sans le correctif ; l'affirmation « une centaine de fichiers » retirée (non mesurée).
- 2026-11-16 — Remis à jour sur `5ccead9` (plugin 7.10.0, 597 tests ; PR 99 fusionnée avec A-47 ter) : `coverage-diff.mjs` n'a pas changé, les cinq remplacements du § 1 s'appliquent tels quels ; l'intention tient, A-47 ter la confirme (les retouches se jugent comme une sous-PR : `coverage-diff` les mesure toutes, formatage compris) ; ajoutés la décision 7 et un dixième test (retouche de formatage d'un fichier de develop : comptée, modifiée et non neuve), rouge sur `main` ; le § 2, en prose, réécrit en trois textes mot pour mot (T1 à T3), « ligne de l'étape 4 » corrigé en préalable 4 ; `Blocked by:` vidé (40 fait) ; version 7.10.1 avec la règle de repli. Joué : 6 rouges sur 10 sur `main` cinq fois sur cinq, 10 verts avec le correctif, 607 tests (597 + 10), 628 avec 41 et 42 ; `TMPDIR` sans dossier `cov-` après la passe.
