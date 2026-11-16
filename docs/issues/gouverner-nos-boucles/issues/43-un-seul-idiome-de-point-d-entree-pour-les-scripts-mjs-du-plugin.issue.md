# Un seul idiome de point d'entrée pour les scripts `.mjs` du plugin : `import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href`, dans un `try`, et un banc qui lance chaque script par un lien symbolique, un chemin à espace et un chemin à accent

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — une petite fonction identique collée dans sept scripts, deux ou trois imports par script, un fichier de test donné entier, une phrase de documentation et la version ; tout est joué sur une copie jetable de `origin/main` (voir « Vérification »). Rien à concevoir.
Blocked by: 39 (la PR 94 modifie `revue-exigee.mjs` : même fichier, même zone du bas ; ce ticket se rebase sur elle une fois fusionnée)
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/migrations-ordre.mjs`, `skills/chaine/fusionner/scripts/revue-exigee.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/demarrage.mjs`, `skills/chaine/tickets/references/scripts/docs/vagues.mjs`, `skills/chaine/tickets/references/scripts/docs/couts.mjs`, `skills/monorepo/socle-tests/references/scripts/verify/mutation-regles.mjs`, `skills/monorepo/socle-tests/references/scripts/verify/mutation-regles-synthese.mjs`, `scripts/points-d-entree.test.mjs` (créé), `.claude-plugin/plugin.json`

## Le besoin

Décision A-50 de l'architecte (carte, « Retours de `fedora` », 2026-11-16), constat 3 du relevé. Sept scripts `.mjs` du plugin ne s'exécutent que « si le fichier est le point d'entrée », et trois façons de le dire coexistent. Deux sont fausses :

- ``import.meta.url === `file://${process.argv[1]}` `` (trois scripts) : `import.meta.url` est une URL, donc le chemin y est encodé (`%20` pour une espace, `%C3%A9` pour `é`), et Node la donne **après résolution du lien symbolique**, alors que `argv[1]` est le chemin tel qu'il a été tapé. Un lien symbolique, une espace ou un accent dans le chemin : la comparaison est fausse, le script **sort en 0 sans rien faire**, sans un mot.
- `pathToFileURL(process.argv[1]).href` (quatre scripts) : l'encodage est bon (espace et accent passent), mais le lien symbolique reste en défaut, faute de `realpathSync`.

Un contrôle qui ne tourne pas passe pour vert. Ici, deux des trois scripts du premier groupe sont des **gardes du capitaine** : `revue-exigee.mjs` (sortie 0 = « la PR n'exige pas de revue ») et `migrations-ordre.mjs` (sortie 0 = « l'ordre des migrations est bon »). `passer.sh:162` et `:169` les lancent depuis `$PASSER_OUTILS`, la copie `.git/boucle-outils` du dépôt du capitaine ; `sujet.sh:659-660` et `:780-781` les lancent depuis le dossier du script. Un dépôt dont le chemin porte une espace ou un accent (`/home/jérôme/projets/…`, `C:\Users\Zoé\…` sous WSL) ou qui est atteint par un lien symbolique **fait passer la garde au vert sans l'exécuter**. Ce chemin de bout en bout (le capitaine lui-même dans un dossier à accent) n'a pas été joué ; ce qui l'a été, c'est chaque script, ci-dessous.

Quand le ticket est fait : les sept scripts se reconnaissent comme point d'entrée quel que soit le chemin par lequel on les lance (direct, lien symbolique, dossier à espace, dossier à accent), avec **la même fonction à une ligne près**, et un banc de la racine le prouve, script par script.

Le correctif retenu côté `fedora` est celui de leur PR **#1935** (fusionnée le 2026-11-16 à 13 h 47 UTC), fonction `estPointEntree(urlModule, chemin)` de `scripts/ci/commits-a-relire.mjs` : `pathToFileURL(realpathSync(chemin)).href` dans un `try`, `false` en cas d'erreur, et un test « point d'entrée : lancé par un lien symbolique, depuis un dossier à espace et accent, une plage fautive sort en 1 ». Leur note de ticket (`SPEC_ALL_INF-14.17`, `## Comments`) renvoie ces deux scripts du plugin à « un ticket à part » : c'est celui-ci.

## Où

Base : `origin/main` à `fa7d3eb`, plugin **7.9.0**, **499 tests** (`pnpm test`, relevé par le ticket 39 ; la session le recompte). Lignes relevées le 2026-11-16 ; la session retrouve chaque ligne par son texte.

### Le relevé complet : `argv[1]` dans tous les `.mjs`

`git grep -n 'argv\[1\]' origin/main -- '*.mjs'` (hors `node_modules`) rend **sept lignes, et aucune autre** :

| Script | Ligne | Idiome actuel | Posé chez un projet (`poser`) |
| --- | --- | --- | --- |
| `skills/chaine/fusionner/scripts/migrations-ordre.mjs` | 105 | ``file://${argv[1]}`` | `scripts/chaine/` ; aussi appelé par la CI du gabarit (`ci.yml:38`, chemin relatif) |
| `skills/chaine/fusionner/scripts/revue-exigee.mjs` | 58 | ``file://${argv[1]}`` | `scripts/chaine/` |
| `skills/chaine/socle-chaine-de-production/references/agent/demarrage.mjs` | 114 | ``argv[1] && file://${argv[1]}`` | `scripts/agent/`, lancé par le hook `SessionStart` (`"$CLAUDE_PROJECT_DIR"/scripts/agent/demarrage.mjs`) |
| `skills/chaine/tickets/references/scripts/docs/vagues.mjs` | 166 | `pathToFileURL(argv[1])`, sans `realpathSync` | `scripts/docs/` |
| `skills/chaine/tickets/references/scripts/docs/couts.mjs` | 174 | `pathToFileURL(argv[1] ?? "")`, sans `realpathSync` | `scripts/docs/` |
| `skills/monorepo/socle-tests/references/scripts/verify/mutation-regles.mjs` | 190 | `pathToFileURL(argv[1])`, sans `realpathSync` | `scripts/verify/` |
| `skills/monorepo/socle-tests/references/scripts/verify/mutation-regles-synthese.mjs` | 99 | `pathToFileURL(argv[1])`, sans `realpathSync` | `scripts/verify/` |

Hors des `.mjs`, `argv[1]` apparaît dans cinq commandes `node -e` de scripts shell (`sujet.sh:651`, `passer.sh:87` et `:313`, `diff-revue.sh:24`, `labels.sh:28`) : c'est le premier argument de `node -e`, pas un point d'entrée. **Sans objet.** Aucun script `.mjs` n'emploie `import.meta.main`, `process.argv.at(1)` ni une autre forme de test d'entrée ; les autres usages de `import.meta.url` (`fileURLToPath(import.meta.url)`, `new URL(…, import.meta.url)` passé à `readFileSync`) ne comparent rien à `argv[1]` et ne sont pas le défaut (voir « Hors périmètre » pour `.pathname`).

### Comment chaque script est copié dans un projet : une fonction locale, pas un module partagé

Les quatre groupes vont dans **quatre dossiers de projet distincts** (`scripts/chaine/`, `scripts/agent/`, `scripts/docs/`, `scripts/verify/`), posés par quatre skills différents (`fusionner`, le socle de la chaîne, `tickets`, `socle-tests`). Aucun module commun n'est copié avec eux : `revue-exigee.mjs` n'importe rien du tout, `migrations-ordre.mjs` n'importe que des modules Node, et `scripts/docs/` (`identifiants.mjs`, `ligne-sujet.mjs`…) n'est pas posé avec `scripts/verify/` ni `scripts/chaine/`. Un module partagé obligerait un nouveau fichier posé à quatre endroits, et un script qui l'importe tomberait en `ERR_MODULE_NOT_FOUND` chez un projet qui n'a posé que son skill (et `revue-exigee.mjs` tourne aussi depuis `.git/boucle-outils`, une copie isolée par `passer.sh`). **Décision : une petite fonction locale par script**, sept copies de neuf lignes, identiques. Le banc ci-dessous garde les sept en accord par leur comportement.

### Reproduit, sur `fa7d3eb`, par un essai à la main

Dossier jetable, dépôt git vide pour cwd, chaque script lancé directement, par un lien symbolique, depuis une copie de son dossier sous `avec espace/` puis sous `accentué-é/`. Ce que chacun fait, **le même script, quatre chemins** :

| Script | direct | lien symbolique | dossier à espace | dossier à accent |
| --- | --- | --- | --- | --- |
| `migrations-ordre.mjs` (sans argument) | sortie 2, « usage » | **sortie 0, muet** | **sortie 0, muet** | **sortie 0, muet** |
| `revue-exigee.mjs` (`apps/a.ts` sur stdin, titre `feat: x`) | sortie 1, « sans section « Revue de ticket » » | **sortie 0, muet** | **sortie 0, muet** | **sortie 0, muet** |
| `demarrage.mjs` | écrit « démarrage : fetch-develop — échec… » | **rien** | **rien** | **rien** |
| `vagues.mjs` (sans argument) | sortie 2, « Usage » | **sortie 0, muet** | agit | agit |
| `couts.mjs --verify` | sortie 1, « n'est pas à jour » | **sortie 0, muet** | agit | agit |
| `mutation-regles.mjs` (sans argument) | sortie 2, « usage » | **sortie 0, muet** | agit | agit |
| `mutation-regles-synthese.mjs` | « périmètre vide » | **rien** | agit | agit |

C'est le banc du § 1, joué sur `origin/main` : **13 rouges sur 28** (les neuf accès « lien / espace / accent » des trois scripts du premier groupe, et le lien symbolique des quatre autres). Les sept accès directs sont verts, ce qui explique que le défaut ait échappé à tout test : aucun banc ne lançait un script par autre chose que son chemin d'origine.

## Décisions

1. **Un idiome, une fonction locale par script** (voir plus haut), nommée `estPointEntree`, sans paramètre :

   ```js
   /** Vrai quand ce fichier est lancé en ligne de commande, par un lien symbolique ou un chemin à espace ou à accent aussi. */
   function estPointEntree() {
     try {
       return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
     } catch {
       return false;
     }
   }
   ```

   `realpathSync` lève si `argv[1]` est absent (`node -e`, REPL, import dynamique sans script : `realpathSync(undefined)` lève `ERR_INVALID_ARG_TYPE`) ou n'existe pas : le `try` rend `false`, donc le garde `process.argv[1] &&` de trois scripts et le `?? ""` de `couts.mjs` disparaissent, remplacés par la fonction. La forme est celle de `estPointEntree(urlModule, chemin)` de `fedora` #1935 ; **elle perd les deux paramètres** pour ne rien laisser à mal passer (un seul appel possible : `import.meta.url` et `process.argv[1]`). Le résultat est identique pour tout appel de `fedora`.
2. **Le corps de chaque script ne change pas** : seule la condition du `if` (ou de la ligne finale) devient `estPointEntree()`. Aucun changement de comportement hors du défaut : sortie, code, effets.
3. **Imports** : `realpathSync` de `node:fs` et `pathToFileURL` de `node:url` s'ajoutent à l'import existant du même module quand il existe (`vagues.mjs`, `couts.mjs`, `mutation-regles-synthese.mjs`, `mutation-regles.mjs` ont déjà `pathToFileURL` ou `realpathSync`), sinon une ligne `import` en tête de fichier : `migrations-ordre.mjs`, `revue-exigee.mjs` (qui n'importe rien : `import { realpathSync } from 'node:fs'` et `import { pathToFileURL } from 'node:url'`, **avant** `CHEMINS_CODE`, pas au milieu du fichier), `demarrage.mjs` (`pathToFileURL`, `realpathSync` à l'import de `node:fs`).
4. **Le banc est un seul fichier à la racine, `scripts/points-d-entree.test.mjs`** (même dossier que `poses.test.mjs`, joué par le glob `scripts/*.test.mjs` de `pnpm test`), et **n'est pas posé chez un projet** : c'est un banc du plugin, qui lance les scripts du plugin tels que `poser` les copie. Il pose chaque script dans un dossier du banc avec les dossiers frères que `poser` lui met (`avec` : `identifiants.mjs` et `ligne-sujet.mjs` de `socle-monorepo` pour `vagues` et `couts`), puis le lance quatre fois. Il ne compte pas sur le code de sortie seul (un script muet sort aussi en 0) : chaque cas attend **la sortie propre du script**.
5. **Version** : correctif, patch du plugin (`7.9.1` à l'écriture ; la session la recale sur la version de `main` au moment de sa PR, les tickets 39 et 40 la montent aussi).

## À faire, dans l'ordre

### 0. Le banc d'abord, vu rouge sur `origin/main`

Créer `scripts/points-d-entree.test.mjs` avec le contenu ci-dessous, **mot pour mot**, puis `node --test scripts/points-d-entree.test.mjs` sur `origin/main` : **13 rouges sur 28**, les quinze verts étant les sept accès directs et les huit accès « espace » et « accent » des quatre scripts à demi bons.

```js
// Banc du ticket 43 (A-50) : chaque script .mjs du plugin qui se joue en ligne de commande agit quand on le
// lance, quel que soit le chemin par lequel on le lance : direct, par un lien symbolique, depuis un dossier à
// espace, depuis un dossier à accent. Un script qui ne reconnaît pas son point d'entrée sort en 0 sans rien
// faire : un contrôle qui ne tourne pas passe pour vert.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const SANS_GIT = Object.fromEntries(Object.entries(process.env).filter(([c]) => !c.startsWith("GIT_") && c !== "NODE_TEST_CONTEXT"));

// Un script, ce qu'on lui donne et la preuve qu'il a agi (sa sortie propre, pas le code 0 d'un script muet).
const SCRIPTS = [
  { nom: "migrations-ordre", fichier: "skills/chaine/fusionner/scripts/migrations-ordre.mjs", args: [], statut: 2, sortie: /usage : node migrations-ordre\.mjs/ },
  { nom: "revue-exigee", fichier: "skills/chaine/fusionner/scripts/revue-exigee.mjs", args: ["", "feat: x"], entree: "apps/a.ts\n", statut: 1, sortie: /sans section « Revue de ticket »/ },
  { nom: "demarrage", fichier: "skills/chaine/socle-chaine-de-production/references/agent/demarrage.mjs", args: [], statut: 0, sortie: /démarrage : fetch-develop/ },
  { nom: "vagues", fichier: "skills/chaine/tickets/references/scripts/docs/vagues.mjs", avec: ["skills/monorepo/socle-monorepo/references/scripts/docs"], args: [], statut: 2, sortie: /Usage : node scripts\/docs\/vagues\.mjs/ },
  { nom: "couts", fichier: "skills/chaine/tickets/references/scripts/docs/couts.mjs", avec: ["skills/monorepo/socle-monorepo/references/scripts/docs"], args: ["--verify"], statut: 1, sortie: /couts : .* n'est pas à jour/ },
  { nom: "mutation-regles", fichier: "skills/monorepo/socle-tests/references/scripts/verify/mutation-regles.mjs", args: [], statut: 2, sortie: /usage : node scripts\/verify\/mutation-regles\.mjs/ },
  { nom: "mutation-regles-synthese", fichier: "skills/monorepo/socle-tests/references/scripts/verify/mutation-regles-synthese.mjs", args: [], statut: 0, sortie: /Mutation sur les règles prouvées : périmètre vide/ },
];

const tmp = mkdtempSync(join(tmpdir(), "entree-"));
after(() => rmSync(tmp, { recursive: true, force: true }));

// Un dépôt git vide : c'est le dossier de travail de chaque essai.
const depot = join(tmp, "depot");
mkdirSync(depot);
spawnSync("git", ["init", "-q", depot], { env: SANS_GIT });

/**
 * Le chemin par lequel on lance `script`, pour chacun des quatre accès. Le script est posé comme chez un projet :
 * son dossier, avec les dossiers du plugin que `poser` copie au même endroit (`avec`), dans un dossier du banc.
 */
function chemins(script) {
  const poser = (parent) => {
    const vers = join(tmp, parent, "scripts");
    mkdirSync(vers, { recursive: true });
    for (const dossier of [dirname(script.fichier), ...(script.avec ?? [])]) cpSync(join(RACINE, dossier), vers, { recursive: true });
    return join(vers, basename(script.fichier));
  };
  const direct = poser(`pose ${script.nom}`.replace(/ /g, "-"));
  const lien = join(tmp, "lien", `${script.nom}.mjs`);
  mkdirSync(dirname(lien), { recursive: true });
  symlinkSync(direct, lien);
  return {
    direct,
    "lien symbolique": lien,
    "dossier à espace": poser(`avec espace ${script.nom}`),
    "dossier à accent": poser(`accentué-é ${script.nom}`),
  };
}

for (const script of SCRIPTS) {
  const accès = chemins(script);
  for (const [nom, chemin] of Object.entries(accès)) {
    test(`${script.nom} agit quand on le lance : ${nom}`, () => {
      const r = spawnSync(process.execPath, [chemin, ...script.args], {
        cwd: depot,
        env: { ...SANS_GIT, CLAUDE_PROJECT_DIR: depot, CLAUDE_ENV_FILE: "" },
        input: script.entree ?? "",
        encoding: "utf8",
        timeout: 60_000,
      });
      assert.match(r.stdout + r.stderr, script.sortie, `muet (statut ${r.status}) : le point d'entrée n'est pas reconnu par ${chemin}`);
      assert.equal(r.status, script.statut);
    });
  }
}
```

### 1. Les sept scripts

Dans chacun des sept fichiers de « Où », ajouter la fonction de la décision 1 juste avant la condition d'entrée, remplacer la condition par `estPointEntree()` (`if (estPointEntree()) {…}`, ou `if (estPointEntree()) principal();`, `if (estPointEntree()) process.exit(main(process.argv.slice(2)));`, `if (estPointEntree()) process.stdout.write(texteDuPaquet());` selon le script), et compléter les imports (décision 3). Rien d'autre.

### 2. Un mot de documentation

Les `CONTENU.md` ne décrivent pas ces scripts ligne à ligne : **rien à changer**, sauf à constater le contraire en grep (`git grep -n "file://" -- skills`, qui ne doit plus rien rendre). Si une phrase de `skills/chaine/sujet/SKILL.md` ou de `skills/chaine/fusionner/SKILL.md` dit qu'un script « se lance par son chemin », la corriger ; la session le vérifie.

### 3. La version : `.claude-plugin/plugin.json:3`

`"version"` seule, patch.

## Surfaces

| Surface | Preuve |
| --- | --- |
| les sept scripts agissent lancés directement | `scripts/points-d-entree.test.mjs` « <script> agit quand on le lance : direct » (sept cas) |
| par un lien symbolique | idem « : lien symbolique » (sept cas) |
| depuis un dossier à espace | idem « : dossier à espace » (sept cas) |
| depuis un dossier à accent | idem « : dossier à accent » (sept cas) |
| un script importé (sans point d'entrée) ne s'exécute pas | les bancs existants, qui importent ces modules (`revue-exigee.test.mjs`, `migrations-ordre.test.mjs`, `mutation-regles.test.mjs`, `mutation-regles-synthese.test.mjs`) restent verts, inchangés |
| plus aucune comparaison à ``file://${argv[1]}`` | `git grep -n 'file://\${' -- 'skills/**/*.mjs'` ne rend plus que des lignes qui ne sont pas un point d'entrée (la session le lit) |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` |

## Vérification

Dans une copie jetable de `origin/main` : `git worktree add --detach <dossier jetable> origin/main`, un `TMPDIR` privé (`export TMPDIR=<dossier jetable>/tmp && mkdir -p "$TMPDIR"`).

- Le banc du § 0 seul sur `origin/main` : **13 rouges, 15 verts** (28 cas). Avec le § 1 : **28 verts**. Joué le 2026-11-16 sur `fa7d3eb` : 13 rouges, puis 28 verts avec le correctif.
- `pnpm install --frozen-lockfile && pnpm test` : le compte de `origin/main` **plus 28** (499 + 28 = **527**, joué le 2026-11-16 : 527 sur 527), tout vert, sans test retiré ni sauté. `git diff origin/main --stat -- '*.test.mjs'` ne montre que `scripts/points-d-entree.test.mjs`.
- `scripts/poses.test.mjs` (« les bancs posés à plat sous scripts/chaine/ tournent hors du plugin ») reste vert : `revue-exigee.mjs` et `migrations-ordre.mjs` posés à plat tournent avec leur fonction locale (aucune nouvelle dépendance).
- `ls "$TMPDIR" | grep -c '^entree-'` vaut **0** après la passe (le banc retire son dossier à la fin : `after`).
- Retirer la copie jetable à la fin (`git worktree remove --force`) et le `TMPDIR` privé.

## Hors périmètre

- **`new URL('../..', import.meta.url).pathname` comme racine du projet** : même famille, autre défaut. `.pathname` d'une URL garde l'encodage (`%20`, `%C3%A9`), donc dans un projet dont le chemin porte une espace ou un accent, `ROOT` ne désigne aucun dossier tant que `PROJET_RACINE` (ou `CLAUDE_PROJECT_DIR`) n'est pas posé. Relevé : `agent/entree.mjs:26` (`RACINE`, donc `demarrage.mjs` et les gardes), `tickets/references/scripts/verify/tickets.mjs:69`, `socle-monorepo/references/scripts/docs/next-id.mjs:36`, `socle-monorepo/references/scripts/verify/budget-contexte.mjs:30` et `references-agent.mjs:30`, `socle-tests/references/scripts/verify/coverage-diff.mjs:60` et `tests-creux.mjs:43`, `socle-chaine-de-production/references/scripts/verify/settings-json.mjs:25`, `chaine/anchorpost/references/scripts/verify/anchorpost.mjs:14`, `chaine/revue-de-ticket/scripts/contexte-ticket.mjs:52`. Le remède est `fileURLToPath(new URL('../..', import.meta.url))`. **Non joué** (seul `demarrage.mjs` a été lancé, avec `CLAUDE_PROJECT_DIR` posé) : à instruire dans un ticket à part, avec son banc, qui étend celui-ci. Les bancs du plugin qui font `new URL(…).pathname` (`identifiant.test.mjs`, `veille.test.mjs`…) ne tournent que depuis le dépôt du plugin ; non concernés.
- **Les `import.meta.url` qui passent par `fileURLToPath`** (`depot-jouet.mjs`, `identifiant.mjs`, les `eslint.rules.mjs`, `eslint.config.mjs`) : corrects.
- **Un module partagé** : écarté (« Où », décision 1).

## Comments

- 2026-11-16 — Instruit sur `fa7d3eb` (plugin 7.9.0). Relevé : sept `argv[1]` dans les `.mjs`, aucun autre ; l'essai à la main et le banc donnent 13 rouges sur 28, puis 28 verts avec la fonction locale collée dans les sept scripts (joué sur une copie jetable, rien de poussé). `revue-exigee.mjs` est dans la PR 94 (ticket 39) : ce ticket l'attend. Correctif de référence : `fedora` #1935, `estPointEntree` de `scripts/ci/commits-a-relire.mjs`, qui a trouvé le défaut en l'écrivant et l'a signalé pour `migrations-ordre.mjs` et `revue-exigee.mjs`.
- 2026-11-16 — Gravité : les deux scripts de garde (`revue-exigee`, `migrations-ordre`) échouent **ouverts** : un capitaine installé sous un chemin à accent ou à espace, ou atteint par un lien, ne contrôle plus ni la revue exigée ni l'ordre des migrations. Non rejoué de bout en bout (`passer.sh` dans un dépôt à chemin accentué) : à joindre à la contre-relecture si on veut la preuve complète.
