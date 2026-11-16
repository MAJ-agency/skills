# Les bancs de la chaîne retirent leurs dossiers temporaires : `depotJouet()` et ses semblables enregistrent chaque dossier créé et le suppriment à la sortie du processus, `passer.sh` retire sa copie

Status: Fait — PR #92
Type: défaut
Label: contre-revue
Modèle: sonnet — un bloc identique inséré dans deux `depot-jouet.mjs`, quelques remplacements exacts dans deux bancs et dans `passer.sh`, un fichier de test donné entier, deux phrases de documentation et la version ; tout est joué sur une copie jetable de `origin/main` (voir « Vérification ») ; rien n'est à concevoir.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/sujet/scripts/depot-jouet.mjs`, `skills/chaine/tickets/references/scripts/docs/depot-jouet.mjs`, `skills/chaine/revue-adversariale/scripts/diff-revue.test.mjs`, `skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs`, `skills/chaine/fusionner/scripts/passer.sh`, `scripts/nettoyage-des-bancs.test.mjs` (créé), `skills/chaine/sujet/references/CONTENU.md`, `skills/chaine/tickets/references/CONTENU.md`, `.claude-plugin/plugin.json`

## Le besoin

**Le fait**, mesuré le 2026-11-14 : les bancs ne suppriment pas leurs dossiers temporaires. Dans le plugin, 28 appels `mkdtempSync(` pour 6 `rmSync(` (`git grep -n 'mkdtempSync(' -- skills scripts` et `git grep -n 'rmSync(' -- skills scripts` sur `cadb4e5`). Les deux `depot-jouet.mjs` (`skills/chaine/sujet/scripts/` et `skills/chaine/tickets/references/scripts/docs/`) créent un dépôt jouet d'environ un mégaoctet par appel (`mkdtempSync(join(tmpdir(), 'jouet-'))`) et ne le retirent jamais. Sur une machine de session, après une journée de relectures et de pre-push, il restait **49 448 dossiers** sous le dossier temporaire, dont 30 459 `jouet-*`, de l'ordre de **34 Go** : disque plein (« No space left on device »). Depuis que les scripts du capitaine poussent sous les hooks git, chaque push d'un capitaine joue ces bancs : le disque d'un capitaine au long cours se remplit de même (mesuré chez un capitaine : 196 `jouet-*` après un seul pre-push complet).

Quand le ticket est fait, un banc de la chaîne n'emporte plus ses dépôts jouets : ils sont retirés à la sortie du processus du banc, que ses tests passent ou non, avec la copie des scripts du skill `tickets` et les dossiers des deux bancs de revue ; et `passer.sh` ne laisse plus sa copie `passer.XXXXXX` à chaque PR passée. Un banc qu'on veut lire après un échec garde ses dossiers avec `GARDER_JOUETS=1`. Les autres bancs, petits, sont le ticket suivant (voir « Hors périmètre »).

## Où

Base : `origin/main` à `cadb4e5` (plugin **7.7.0**, **456** tests). Les lignes ont été relevées le 2026-11-14. La session les relève sur `origin/main` d'alors et retrouve chaque phrase par son texte.

### La mesure, copie jetable de `cadb4e5`

`pnpm test` avec `TMPDIR` privé (un dossier neuf, vide), puis ce qui y reste :

| | Avant (`origin/main`) | Après (ce ticket) |
| --- | --- | --- |
| Dossiers | **626** | **130** |
| Fichiers | 45 874 | 2 885 |
| Taille (`du -sm`) | **341 Mo** | **23 Mo** |
| `jouet-*` | 375 (314 Mo, soit 0,85 Mo chacun) | 0 |
| `sens-*` (`chemins-sensibles.test.mjs`) | 102 | 0 |
| `revue-*` (`diff-revue.test.mjs`) | 10 | 0 |
| `tickets-poses-*` (copie des scripts du skill `tickets`) | 9 | 0 |

Ce qui reste après le ticket, par préfixe (chacun est le `mkdtempSync` d'un banc sans retrait, voir « Hors périmètre ») : `veille-` 28, `garde-github-` 20, `contexte-ticket-` 20, `mutation-regles-` 15, `develop-sh-` 13, `tests-creux-` 6, `next-id-` 6, `mutation-synthese-` 4, `fin-de-tour-` 4, `apres-edition-` 3, `identifiant-` 2, `faux-gh-` 2, `budget-contexte-` 2, et un chacun `tickets-sans-grammaire-`, `references-agent-`, `mutation-dehors-`, `avancement-`. Plus `node-compile-cache` : c'est le cache de compilation de Node lui-même (un seul dossier, partagé entre les passes), pas une fuite des bancs.

Les deux autres passes de `pnpm test` (la seconde, puis sous `PASSER_OUTILS=/x BOUCLE_COPIE=/x`) laissent exactement la même liste : le nettoyage d'un banc ne gêne pas le suivant.

### Le relevé à la source

`git grep -n "mkdtemp\|tmpdir()\|mktemp" origin/main -- '*.mjs' '*.sh'` : 60 lignes. Pour chacune, qui crée, qui devrait retirer, et si un retrait existe. « Posé » : le fichier est copié chez un projet par `poser` (`scripts/poses.test.mjs`, tableau `POSES`, et les `SKILL.md` qui listent les fichiers posés) ; le remède doit y valoir sans le plugin.

| Création | Qui crée / qui devrait retirer | Retrait existant | Posé chez un projet | Ce ticket |
| --- | --- | --- | --- | --- |
| `skills/chaine/sujet/scripts/depot-jouet.mjs` `jouet-` (`depotJouet()`, une trentaine de bancs, des dizaines d'appels chacun) | le banc ; à défaut le processus du banc, à sa sortie | aucun | oui (`scripts/chaine/`) | **retrait à la sortie** |
| `skills/chaine/tickets/references/scripts/docs/depot-jouet.mjs` `jouet-` et `tickets-poses-` (copie des scripts, une par processus) | idem | aucun | oui (`scripts/docs/`) | **retrait à la sortie** |
| `revue-adversariale/scripts/chemins-sensibles.test.mjs` `sens-` (102 par passe) | le banc | aucun | oui | **`dossierTemporaire`** |
| `revue-adversariale/scripts/diff-revue.test.mjs` `revue-` | le banc | aucun | oui | **`dossierTemporaire`** |
| `fusionner/scripts/passer.sh:53` `mktemp passer.XXXXXX` (copie du script, relancée par `exec`) | la copie elle-même, une fois lancée | aucun : chaque PR passée laisse un fichier de 19 Ko chez un vrai capitaine | oui | **retrait dès que la copie tourne** |
| `veille.test.mjs`, `contexte-ticket.test.mjs`, `identifiant.test.mjs`, `faux-gh.test.mjs`, `avancement.test.mjs`, `next-id.test.mjs`, `tickets-gate.test.mjs` | le banc | aucun | oui | ticket suivant |
| `socle-chaine-de-production/references/agent/{garde-github,fin-de-tour,apres-edition}.test.mjs`, `references/scripts/github/develop.test.mjs` | le banc | aucun | oui (`scripts/agent/`, `scripts/github/`) | ticket suivant |
| `socle-tests/references/scripts/verify/{mutation-regles,mutation-regles-synthese,tests-creux}.test.mjs`, `socle-monorepo/references/scripts/verify/{budget-contexte,references-agent}.test.mjs` | le banc | aucun | oui (`scripts/verify/`) | ticket suivant |
| `socle-tests/references/scripts/verify/coverage-diff.mjs:187` `coverage-diff-`, `coverage-diff-regles.test.mjs:237` `base-auto-` | le script ; le banc | `rmSync` (`:212`, `:266`), hors `finally` pour le script | oui | rien |
| `scripts/depot.test.mjs:214` `chaine-json-`, `scripts/poses.test.mjs:39` `poses-`, `sujet/scripts/environnement-des-bancs.test.mjs:34` `capitaine-` | le banc | `rmSync` en `finally` | `environnement-des-bancs` oui | rien |
| `fusionner/scripts/boucle.sh:311`, `veille.sh:45` `mktemp` (sortie gardée) | le script | `trap 'rm -f …' EXIT` posé juste après | oui | rien |
| `sujet/scripts/sujet.sh:274` `mktemp -u` (index temporaire), `:909` `mktemp -d` | le script | `rm -f "$idx"` et `rm -rf "$tmp"` sur le chemin nominal seulement ; un `refuser` avant laisse le dossier | oui | hors périmètre |
| `socle-nest-hexagonal/references/squelette/scripts/db/demarrer-local.sh:108` `mktemp` (mot de passe) | le script | `trap 'rm -f "$mdp"' EXIT` | squelette, pas la chaîne | rien |
| `socle-chaine-de-production/references/scripts/github/develop.test.mjs:44` `mktemp -d` dans un faux `pnpm` | le faux `pnpm`, sous le `TMPDIR` du banc (sa racine `develop-sh-`) | retiré avec la racine quand elle l'est | oui | rien (la racine est du ticket suivant) |

Hors des bancs, `skills/chaine/revue-adversariale/scripts/diff-revue.sh:14` écrit dans `${TMPDIR:-/tmp}/revue` : nom fixe, écrasé à chaque revue et lu par la session de revue. Ce n'est pas une fuite, ce ticket n'y touche pas. La copie des outils de la boucle vit sous `.git/boucle-outils` (`boucle.sh:86`), pas dans le dossier temporaire : elle est gardée exprès, et le verrou de la boucle n'est pas un fichier temporaire non plus (`.git/boucle.verrou`). Aucun remède de ce ticket ne les touche.

### La cause

`depotJouet()` (les deux fichiers) fait `mkdtempSync` et rend `racine` à un test qui n'a aucune raison de la retirer : une trentaine de bancs l'appellent, des dizaines de fois chacun, et un retrait par test serait à écrire à chaque appel. `node --test` joue **un fichier de test par processus** : le processus qui a créé les dossiers est celui qui peut les retirer à sa sortie, en un seul endroit.

## Décisions

1. **Retirer à la sortie du processus, par enregistrement dans le dépôt jouet.** Chaque dossier créé par `depotJouet()` (et par la copie des scripts du skill `tickets`) entre dans une liste ; `process.on('exit', …)` les retire avec `rmSync(…, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 })`. `dossierTemporaire` refuse (exception) un chemin qui ne serait pas sous `tmpdir()` : le `rmSync` récursif de la sortie ne peut pas viser ailleurs. Les bancs qui appellent `depotJouet()` ne changent pas. Le même mécanisme est exporté sous `dossierTemporaire(prefixe)`, que les bancs qui font leur propre `mkdtempSync(join(tmpdir(), …))` appellent à la place. Écarté : un `try { … } finally { rmSync(…) }` ou un `after()` par banc, qui demande de toucher chaque test de chaque fichier (plus de vingt fichiers) pour un résultat identique. Prix : un fichier de test garde ses dossiers jusqu'à sa fin, soit au plus 0,85 Mo par jouet de ce fichier.
2. **Le bloc est écrit deux fois, à l'identique.** Les deux `depot-jouet.mjs` sont posés dans deux dossiers différents d'un projet (`scripts/chaine/` et `scripts/docs/`), et un banc posé ne lit jamais l'arbre du plugin sans repli : l'un ne peut pas importer l'autre.
3. **Retiré même quand le banc échoue.** `GARDER_JOUETS=1` (lu à la sortie, dans le processus du banc) garde les dossiers et écrit sur la sortie d'erreur leur nombre et le premier chemin : `GARDER_JOUETS : <n> dossier(s) gardé(s) sous <tmpdir>, dont <chemin>`. Conserver les dossiers *seulement* quand `process.exitCode` est non nul est écarté : un capitaine dont le pre-push échoue et qui relance (CI rouge relancée une fois, puis PR renvoyée) remplirait le disque exactement par le chemin qu'on ferme, et les échecs des bancs disent déjà leur sortie et leur statut dans leur message d'assertion.
4. **`GARDER_JOUETS` n'est pas ajouté à `PREFIXES_CHAINE`** (ticket 30). Cette liste retire de l'environnement des commandes du jouet les variables que les *scripts de la chaîne* lisent ; aucun script du jouet ne lit `GARDER_JOUETS` (seul le processus du banc le lit, dans son propre `process.env`), donc la retirer n'aurait aucun effet, et un `node --test` imbriqué (le garde `scripts/poses.test.mjs` joue les bancs posés dans un enfant) doit au contraire en hériter. Le test du ticket la retire de l'environnement de ses enfants, pour ne pas dépendre de celui du poste.
5. **La sortie ne peut pas échouer pour un dossier.** `rmSync` est dans un `try/catch` et rejoue 3 fois (50 ms). Les bancs qui lancent des processus en arrière-plan (`boucle-outils.test.mjs`, qui tue le groupe de processus dans son `finally` ; `veille.test.mjs`, qui attend la fin de `veille.sh`) n'en laissent aucun à la sortie. Si un enfant écrivait encore, le coût serait un dossier laissé, jamais un banc rouge ni un processus orphelin : le retrait ne lance ni n'attend aucun processus. Les signaux d'arrêt (`SIGINT`, `SIGTERM`, `SIGHUP` : délai `--test-timeout` dépassé, Ctrl-C, `kill` du groupe) sont reroutés vers `process.exit(130/143/129)`, donc vers `exit` : sans cela l'événement `exit` ne part pas et le jouet reste. Aucun banc existant ne pose son propre gestionnaire de ces signaux (`git grep -n "process.on(" -- '*.mjs'` ne rend que le `exit` de `faux-gh.mjs`) : rien n'est doublé. **Limite : `SIGKILL`** ne s'intercepte pas, un banc tué ainsi laisse ses dossiers. Joué : trois passes complètes, aucun rouge.
6. **`passer.sh` retire sa copie dès qu'elle tourne**, et non par un `trap … EXIT`, et seulement si le chemin est bien un `passer.*` du dossier temporaire (`case` sur `"${TMPDIR:-/tmp}"/passer.*`) : le script se relance par `exec bash "$copie"`, donc c'est la copie, une fois lancée, qui retire son propre fichier (bash le garde ouvert et le lit jusqu'au bout), tandis qu'un `trap` ne s'exécuterait pas sur un `kill` du groupe de processus, que la boucle envoie pour `--arreter`. `PASSER_COPIE` porte le chemin de l'ancien processus au nouveau, puis est retirée de l'environnement : elle ne descend ni à `git push`, ni au hook, ni à un banc (elle porterait de toute façon le préfixe `PASSER_` que `depot-jouet.mjs` retire). Le verrou et la copie des outils de la boucle ne sont pas touchés.
7. **`boucle.sh` et `veille.sh` ne changent pas** : leur `mktemp` est déjà suivi d'un `trap … EXIT`. **`sujet.sh`** (`:274`, `:909`) ne change pas ici : voir « Hors périmètre ».
8. **La preuve est un fichier de test nouveau**, `scripts/nettoyage-des-bancs.test.mjs`, qui joue chaque banc dans un `node --test` enfant dont le `TMPDIR` est un dossier neuf et attend ce dossier vide à la fin. Il est **à la racine de `scripts/`**, pas posé : il lit les deux `depot-jouet.mjs` du plugin, et le garde d'un projet n'a pas à le rejouer. Le garde `scripts/poses.test.mjs` **ne change pas** : il rejoue les bancs posés dans un enfant qui hérite de `TMPDIR`, et y attendre « zéro dossier » échouerait tant que les bancs du ticket suivant ne sont pas traités. Cette attente (un `TMPDIR` neuf pour l'enfant, un `readdirSync` vide après lui) s'ajoute à ce garde au ticket suivant, quand elle peut passer ; elle n'alourdit pas le garde (aucune exécution de plus). Elle n'a pas été jouée ici.
9. **Version : correction (patch).** Règle du `README.md`, « Ajouter un skill », étape 4 (patch pour une correction, mineure pour un skill ou un gabarit ajouté), **précisée par la règle de version de l'architecte, que le `README.md` ne dit pas** : patch pour une correction, y compris quand le contenu d'un fichier déjà posé change ; mineure quand un skill, un gabarit ou un fichier posé s'ajoute. Ici aucun fichier posé ne s'ajoute (`scripts/nettoyage-des-bancs.test.mjs` n'est pas posé), des fichiers déjà posés changent de contenu : **`7.7.1`**. Si une autre PR du plugin entre d'abord, fusionner `main` dans la branche (commit de fusion, ni rebase ni push forcé) et prendre la version qui suit la sienne.
10. PR vers `main`, titre `fix(chaine): les bancs retirent leurs dossiers temporaires (plugin 7.7.1)`. `Label: contre-revue` : PR ouverte hors brouillon, **sans `à-fusionner`**, et un mot à l'architecte dès la PR livrée. Commits sous les hooks, jamais `--no-verify`. Aucun test retiré, sauté ni assoupli.

## À faire, dans l'ordre

### 0. Le test d'abord, vu rouge sur `origin/main`

Créer le fichier du § 7 seul, puis `node --test scripts/nettoyage-des-bancs.test.mjs` (avec un `TMPDIR` privé, voir « Vérification ») : **10 rouges sur 10**. Puis les §§ 1 à 6, et il passe au vert.

### 1. `skills/chaine/sujet/scripts/depot-jouet.mjs`

a. Dans l'import `node:fs`, ajouter `rmSync,` entre `readFileSync,` et `writeFileSync,`. Remplacer `import { dirname, join } from 'node:path';` par `import { dirname, join, resolve, sep } from 'node:path';`.

b. Après le bloc `if (spawnSync('jq', …)) throw …;` et avant `const ICI = dirname(fileURLToPath(import.meta.url));`, insérer (une ligne vide avant et après) :

```js
// Dossiers temporaires du banc, retirés à la sortie du processus : `node --test` joue un fichier de
// test par processus, et chaque dépôt jouet pèse environ un mégaoctet. `GARDER_JOUETS=1` les garde
// pour les lire après un échec, et dit combien. Un signal d'arrêt (délai dépassé, Ctrl-C, `kill`
// du groupe) passe par `process.exit`, donc par `exit` ; seul `SIGKILL` ne peut pas être intercepté.
const A_RETIRER = [];
process.on('exit', () => {
  if (process.env.GARDER_JOUETS) {
    if (A_RETIRER.length) console.error(`GARDER_JOUETS : ${A_RETIRER.length} dossier(s) gardé(s) sous ${tmpdir()}, dont ${A_RETIRER[0]}`);
    return;
  }
  for (const dossier of A_RETIRER) {
    try {
      rmSync(dossier, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    } catch {
      /* au pire il reste : la sortie du banc ne doit jamais échouer pour un dossier */
    }
  }
});
for (const [signal, code] of [['SIGINT', 130], ['SIGTERM', 143], ['SIGHUP', 129]]) process.on(signal, () => process.exit(code));
/** Crée un dossier temporaire que la sortie du processus retire. */
export function dossierTemporaire(prefixe) {
  const dossier = resolve(mkdtempSync(join(tmpdir(), prefixe)));
  if (!dossier.startsWith(resolve(tmpdir()) + sep)) throw new Error(`dossierTemporaire : ${dossier} est hors de ${tmpdir()}`);
  A_RETIRER.push(dossier);
  return dossier;
}
```

c. Dans `depotJouet()`, remplacer `const racine = mkdtempSync(join(tmpdir(), 'jouet-'));` par `const racine = dossierTemporaire('jouet-');`.

### 2. `skills/chaine/tickets/references/scripts/docs/depot-jouet.mjs`

a. Remplacer la ligne d'import

```js
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
```

par

```js
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
```

et `import { dirname, join } from 'node:path';` par `import { dirname, join, resolve, sep } from 'node:path';`.

b. Après la ligne `import { fileURLToPath, pathToFileURL } from 'node:url';` et avant `const ICI = dirname(fileURLToPath(import.meta.url));`, insérer le **même bloc** qu'au § 1b (une ligne vide avant et après).

c. Dans `scripts()`, remplacer `pose = join(mkdtempSync(join(tmpdir(), 'tickets-poses-')), 'scripts');` par `pose = join(dossierTemporaire('tickets-poses-'), 'scripts');`.

d. Dans `depotJouet()`, remplacer `const racine = mkdtempSync(join(tmpdir(), 'jouet-'));` par `const racine = dossierTemporaire('jouet-');`.

### 3. `skills/chaine/revue-adversariale/scripts/diff-revue.test.mjs`

- Remplacer `import { existsSync, mkdtempSync, readFileSync } from "node:fs";` par `import { existsSync, readFileSync } from "node:fs";`, et supprimer la ligne `import { tmpdir } from "node:os";`.
- Remplacer `const { depotJouet } = await import(` par `const { depotJouet, dossierTemporaire } = await import(`.
- Remplacer les **deux** `mkdtempSync(join(tmpdir(), "revue-"))` par `dossierTemporaire("revue-")`.

### 4. `skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs`

- Remplacer `import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";` par `import { existsSync, mkdirSync, writeFileSync } from "node:fs";`, et supprimer la ligne `import { tmpdir } from "node:os";`.
- Après la ligne `import { join } from "node:path";`, insérer :

```js
const { dossierTemporaire } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url))
    ? "./depot-jouet.mjs"
    : "../../sujet/scripts/depot-jouet.mjs"
);
```

- Remplacer `mkdtempSync(join(tmpdir(), "sens-"))` par `dossierTemporaire("sens-")`.

### 5. `skills/chaine/fusionner/scripts/passer.sh`

Remplacer ces trois lignes (`:54-56`) :

```bash
  cp "$0" "$copie"
  PASSER_OUTILS=$(cd "$(dirname "$0")" && pwd) exec bash "$copie" "$@"
fi
```

par :

```bash
  cp "$0" "$copie"
  PASSER_COPIE=$copie PASSER_OUTILS=$(cd "$(dirname "$0")" && pwd) exec bash "$copie" "$@"
fi
# La copie se retire dès qu'elle tourne (bash la garde ouverte, elle reste lisible jusqu'au bout) :
# sinon chaque PR passée laisse un passer.XXXXXX dans le dossier temporaire du capitaine.
case ${PASSER_COPIE:-} in "${TMPDIR:-/tmp}"/passer.*) rm -f "$PASSER_COPIE" ;; esac
unset PASSER_COPIE
```

Le motif est celui du `mktemp "${TMPDIR:-/tmp}/passer.XXXXXX"` de la ligne 53 : la même expansion, donc le même préfixe, et le `rm` ne supprime que ce que ce `mktemp` a nommé, jamais un chemin que l'environnement aurait posé.

La ligne suivante (`. "$PASSER_OUTILS/github.sh"`) ne change pas.

### 6. Les textes

- `skills/chaine/sujet/references/CONTENU.md`, section `` ## `scripts/depot-jouet.mjs`, `scripts/faux-gh.mjs` ``, après le paragraphe qui finit par « rejoue une boucle du jouet sous ces variables piégées. », une ligne vide puis ce paragraphe :

```markdown
Les dossiers que le banc crée sont retirés à la sortie de son processus (`node --test` joue un fichier par processus) : `depotJouet()` et `dossierTemporaire(prefixe)`, que les bancs appellent à la place de `mkdtempSync(join(tmpdir(), …))`. Un dépôt jouet pèse environ un mégaoctet : sans retrait, des centaines de dossiers par pre-push remplissaient le disque d'un capitaine. `GARDER_JOUETS=1` les garde pour lire un échec et dit combien. Posé, `passer.sh` retire aussi sa copie temporaire dès qu'elle tourne.
```

- `skills/chaine/tickets/references/CONTENU.md`, section `` ## `depot-jouet.mjs` et les tests ``, après le paragraphe qui finit par « comme dans un projet. », une ligne vide puis ce paragraphe :

```markdown
Les dossiers temporaires du banc (`depotJouet()`, la copie des scripts, `dossierTemporaire(prefixe)`) sont retirés à la sortie du processus de test ; `GARDER_JOUETS=1` les garde pour lire un échec.
```

- Dans la même section, une phrase à retenir (dans la PR) : `chemins-sensibles.test.mjs` importe désormais le `depot-jouet.mjs` du skill `sujet`, qui exige `jq` et lève sinon une erreur nommée. `diff-revue.test.mjs` en dépendait déjà ; `jq` est un prérequis des bancs de la chaîne, rien à poser pour cela.
- `.claude-plugin/plugin.json:3` : `"version": "7.7.0"` devient `"version": "7.7.1"`. Rien d'autre ne change dans ce fichier.

### 7. `scripts/nettoyage-des-bancs.test.mjs` (créé)

Mot pour mot (les titres sont écrits en toutes lettres, dans des fonctions appelées par `test("…", …)` : le gate des tickets cherche chaque titre de la colonne « Preuve » comme chaîne littérale, un gabarit `${nom}` dans une boucle ne se trouverait pas) :

```js
// Les bancs ne laissent rien dans le dossier temporaire : chaque banc est joué dans un `node --test`
// enfant dont le TMPDIR est neuf, et ce dossier doit être vide quand l'enfant a fini. Sans cela, un
// capitaine dont chaque push joue les bancs posés remplit son disque (un dépôt jouet pèse environ un
// mégaoctet, et le pre-push en crée des centaines).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
const JOUET_SUJET = join(RACINE, "skills/chaine/sujet/scripts/depot-jouet.mjs");
const JOUET_TICKETS = join(RACINE, "skills/chaine/tickets/references/scripts/docs/depot-jouet.mjs");

// Sans les GIT_* hérités (sous un hook git, ils visent le vrai dépôt), ni NODE_TEST_CONTEXT (l'enfant
// rendrait ses résultats au parent au lieu de les jouer), ni GARDER_JOUETS (il garde les dossiers).
const envEnfant = (temporaire, plus = {}) => ({
  ...Object.fromEntries(
    Object.entries(process.env).filter(([cle]) => !cle.startsWith("GIT_") && cle !== "NODE_TEST_CONTEXT" && cle !== "GARDER_JOUETS"),
  ),
  TMPDIR: temporaire,
  ...plus,
});

// Joue `fichier` sous `node --test` avec un TMPDIR neuf ; rend la sortie et ce qui reste dans ce TMPDIR.
function jouer(fichier, plus = {}) {
  const temporaire = mkdtempSync(join(tmpdir(), "nettoyage-"));
  try {
    const r = spawnSync(process.execPath, ["--test", fichier], { env: envEnfant(temporaire, plus), encoding: "utf8", timeout: 120_000 });
    return { ...r, reste: readdirSync(temporaire).sort() };
  } finally {
    rmSync(temporaire, { recursive: true, force: true });
  }
}

// Un banc minuscule, écrit hors du TMPDIR de l'enfant, qui appelle `corps` après avoir importé le dépôt jouet.
function bancJetable(jouet, corps) {
  const dossier = mkdtempSync(join(tmpdir(), "nettoyage-banc-"));
  const fichier = join(dossier, "jetable.test.mjs");
  writeFileSync(
    fichier,
    `import { test } from "node:test";\nimport assert from "node:assert/strict";\nconst jouet = await import(${JSON.stringify(pathToFileURL(jouet).href)});\ntest("banc", () => {\n${corps}\n});\n`,
  );
  return { fichier, retirer: () => rmSync(dossier, { recursive: true, force: true }) };
}

function retireLesJouets(jouet) {
  const banc = bancJetable(jouet, "jouet.depotJouet(); jouet.depotJouet();");
  try {
    const r = jouer(banc.fichier);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.deepEqual(r.reste, []);
  } finally {
    banc.retirer();
  }
}

function retireAussiQuandIlEchoue(jouet) {
  const banc = bancJetable(jouet, "jouet.depotJouet(); assert.fail('échec voulu');");
  try {
    const r = jouer(banc.fichier);
    assert.notEqual(r.status, 0, "le banc devait échouer");
    assert.deepEqual(r.reste, []);
  } finally {
    banc.retirer();
  }
}

function gardeLesJouets(jouet) {
  const banc = bancJetable(jouet, "jouet.depotJouet(); jouet.depotJouet();");
  try {
    const r = jouer(banc.fichier, { GARDER_JOUETS: "1" });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(r.reste.length, 2, r.reste.join(", "));
    assert.ok(r.reste.every((n) => n.startsWith("jouet-")), r.reste.join(", "));
    assert.match(r.stdout + r.stderr, /GARDER_JOUETS : 2 dossier\(s\) gardé\(s\)/);
  } finally {
    banc.retirer();
  }
}

// Les titres sont écrits en toutes lettres : le gate des tickets les cherche littéralement.
test("depot-jouet (sujet) : les dépôts jouets d'un banc sont retirés à sa sortie", () => retireLesJouets(JOUET_SUJET));
test("depot-jouet (tickets) : les dépôts jouets d'un banc sont retirés à sa sortie", () => retireLesJouets(JOUET_TICKETS));
test("depot-jouet (sujet) : un banc qui échoue retire aussi ses dossiers", () => retireAussiQuandIlEchoue(JOUET_SUJET));
test("depot-jouet (tickets) : un banc qui échoue retire aussi ses dossiers", () => retireAussiQuandIlEchoue(JOUET_TICKETS));
test("depot-jouet (sujet) : GARDER_JOUETS=1 garde les dossiers et dit combien", () => gardeLesJouets(JOUET_SUJET));
test("depot-jouet (tickets) : GARDER_JOUETS=1 garde les dossiers et dit combien", () => gardeLesJouets(JOUET_TICKETS));

test("depot-jouet (tickets) : la copie des scripts du plugin est retirée aussi", () => {
  const banc = bancJetable(JOUET_TICKETS, "assert.ok(jouet.script('docs/vagues.mjs'));");
  try {
    const r = jouer(banc.fichier);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.deepEqual(r.reste, []);
  } finally {
    banc.retirer();
  }
});

// Bancs réels : l'un crée des dépôts jouets et ses propres dossiers (`revue-`), l'autre ses dossiers (`sens-`)
// et la copie des scripts du skill tickets.
function bancReelNeLaissePasDeDossier(banc) {
  assert.ok(existsSync(join(RACINE, banc)));
  const r = jouer(join(RACINE, banc));
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.deepEqual(r.reste, []);
}
test("diff-revue.test.mjs ne laisse rien dans le dossier temporaire", () =>
  bancReelNeLaissePasDeDossier("skills/chaine/revue-adversariale/scripts/diff-revue.test.mjs"));
test("chemins-sensibles.test.mjs ne laisse rien dans le dossier temporaire", () =>
  bancReelNeLaissePasDeDossier("skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs"));

// Hors des bancs : chez un vrai capitaine, `passer.sh` se relance depuis une copie (`mktemp`), une par PR passée.
test("passer.sh retire sa copie du dossier temporaire dès qu'elle tourne", async () => {
  const { depotJouet, script } = await import(pathToFileURL(JOUET_SUJET).href);
  const d = depotJouet();
  d.publierChaine();
  d.github({ pulls: [{ number: 7, title: "docs(demo): simple", head: "docs/simple", base: "develop", labels: [] }] });
  const r = d.lancer(script("fusionner", "passer.sh"), "7");
  assert.equal(r.status, 7, r.stdout + r.stderr);
  assert.match(r.stdout, /\[#7\] sans le label à-fusionner/, "la copie n'a pas tourné jusqu'à l'éligibilité");
  assert.deepEqual(readdirSync(d.env.TMPDIR).filter((n) => n.startsWith("passer.")), []);
});
```

Les tests des bancs réels (`diff-revue`, `chemins-sensibles`) prouvent les §§ 1 à 4 de bout en bout ; celui de `passer.sh` prouve le § 5 (il joue le vrai `passer.sh` sur un dépôt jouet, qui sort en 7 faute de label, après sa copie : sans le § 5 il reste un `passer.XXXXXX`).

### 8. Ce qui ne change pas

`boucle.sh`, `veille.sh`, `sujet.sh`, `diff-revue.sh`, `scripts/poses.test.mjs`, `scripts/depot.test.mjs`, les bancs de « Hors périmètre », `faux-gh.mjs`, et les `SKILL.md` (aucun fichier posé n'est ajouté ni renommé : `scripts/nettoyage-des-bancs.test.mjs` n'est pas dans `POSES`).

## Surfaces

| Surface | Preuve |
| --- | --- |
| les dépôts jouets de `depotJouet()` (skill `sujet`) sont retirés à la sortie du processus du banc | `scripts/nettoyage-des-bancs.test.mjs` « depot-jouet (sujet) : les dépôts jouets d'un banc sont retirés à sa sortie » |
| idem pour le `depotJouet()` du skill `tickets` | `scripts/nettoyage-des-bancs.test.mjs` « depot-jouet (tickets) : les dépôts jouets d'un banc sont retirés à sa sortie » |
| un banc qui échoue retire aussi ses dossiers (décision 3) | `scripts/nettoyage-des-bancs.test.mjs` « depot-jouet (sujet) : un banc qui échoue retire aussi ses dossiers » et « depot-jouet (tickets) : un banc qui échoue retire aussi ses dossiers » |
| `GARDER_JOUETS=1` garde les dossiers et dit combien | `scripts/nettoyage-des-bancs.test.mjs` « depot-jouet (sujet) : GARDER_JOUETS=1 garde les dossiers et dit combien » et « depot-jouet (tickets) : GARDER_JOUETS=1 garde les dossiers et dit combien » |
| la copie des scripts du skill `tickets` est retirée aussi | `scripts/nettoyage-des-bancs.test.mjs` « depot-jouet (tickets) : la copie des scripts du plugin est retirée aussi » |
| un banc réel qui crée des jouets et ses propres dossiers (`dossierTemporaire`) ne laisse rien | `scripts/nettoyage-des-bancs.test.mjs` « diff-revue.test.mjs ne laisse rien dans le dossier temporaire » et « chemins-sensibles.test.mjs ne laisse rien dans le dossier temporaire » |
| `passer.sh` retire sa copie dès qu'elle tourne | `scripts/nettoyage-des-bancs.test.mjs` « passer.sh retire sa copie du dossier temporaire dès qu'elle tourne » |
| les bancs posés à plat chez un projet tournent toujours, avec le `depot-jouet.mjs` et le `passer.sh` modifiés | `scripts/poses.test.mjs` « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » (inchangé) |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, à `7.7.1` |

## Vérification

Joué le 2026-11-14 dans une copie jetable de `cadb4e5` (`git worktree add --detach`), avec les §§ 1 à 7 appliqués mot pour mot. **Dans chaque commande qui joue des tests**, un dossier temporaire privé : `export TMPDIR=<dossier jetable>/tmp && mkdir -p "$TMPDIR"` ; c'est aussi la mesure.

- Test du § 7 seul sur `origin/main` : **10 rouges sur 10**. Avec les §§ 1 à 6 : **10 verts sur 10**.
- `pnpm test` : **466 sur 466** (456 + 10), trois fois de suite : deux passes (la seconde montre qu'un nettoyage ne gêne pas un banc suivant), puis sous `PASSER_OUTILS=/x BOUCLE_COPIE=/x`.
- Ce qui reste dans `$TMPDIR` après chaque passe : **130 dossiers, 23 Mo, 2 885 fichiers**, contre 626 dossiers, 341 Mo, 45 874 fichiers avant ; zéro `jouet-*`, `sens-*`, `revue-*`, `tickets-poses-*`, `passer.*`. La liste restante est celle de « Où » : les bancs du ticket suivant, et `node-compile-cache`.

Pour la session :

1. Le § 0, puis `pnpm install --frozen-lockfile && pnpm test` : vert, avec **le compte de `origin/main` plus 10**. Aucun test retiré ni sauté. `git diff origin/main --stat -- '*.test.mjs'` ne montre que les deux bancs des §§ 3 et 4 et le fichier du § 7.
2. Deux passes de suite, chacune avec son `TMPDIR` privé, puis `PASSER_OUTILS=/x BOUCLE_COPIE=/x pnpm test` : même compte, tout vert.
3. Après une passe : `ls "$TMPDIR" | grep -c '^jouet-\|^sens-\|^revue-\|^tickets-poses-\|^passer\.'` vaut **0**. Compter le reste (`ls "$TMPDIR" | wc -l`, `du -sm "$TMPDIR"`) et le dire dans la PR : l'ordre de grandeur est 130 dossiers et 23 Mo ; un écart notable (une centaine de dossiers de plus, ou des mégaoctets de `jouet-`) dit qu'un remplacement a été oublié.
4. `git grep -n "dossierTemporaire" -- skills` ne rend que les deux `depot-jouet.mjs` (définition et usages), les deux bancs des §§ 3 et 4 et les deux `CONTENU.md` du § 6.
5. Retirer la copie jetable à la fin (`git worktree remove --force`) et le `TMPDIR` privé.

## Hors périmètre

- **Les autres bancs qui font leur propre `mkdtempSync` sans retrait** : `veille`, `contexte-ticket`, `identifiant`, `faux-gh`, `avancement`, `next-id`, `tickets-gate`, `garde-github`, `fin-de-tour`, `apres-edition`, `develop`, `mutation-regles`, `mutation-regles-synthese`, `tests-creux`, `budget-contexte`, `references-agent` : 16 fichiers, 130 dossiers et 23 Mo par passe. Ils sont petits (aucun dépôt jouet), mais ce sont des centaines de dossiers par pre-push, et tous sont posés chez un projet. **Le ticket suivant** : chacun retire son dossier (`try { … } finally { rmSync(…, { recursive: true, force: true }) }` ou un `after()` de `node:test`, selon ce qui change le moins de lignes), puis l'attente « `TMPDIR` neuf vide » entre dans le garde `scripts/poses.test.mjs` (décision 8). Le lot dépasse huit fichiers de code : il se coupe en deux (les bancs de `scripts/chaine/` et `scripts/docs/`, qui appellent `dossierTemporaire` de leur `depot-jouet.mjs`, et ceux de `scripts/agent/`, `scripts/github/` et `scripts/verify/`, qui n'ont aucun `depot-jouet.mjs` à côté d'eux : bloc de six lignes recopié par fichier, ou petit fichier posé avec eux, à trancher à l'instruction).
- **`sujet.sh`** : `:909` (`tmp=$(mktemp -d)`) n'est retiré que sur le chemin nominal : un `refuser` avant laisse un dossier de deux fichiers ; `:274`, l'index temporaire (`mktemp -u`, puis `GIT_INDEX_FILE`), n'est retiré qu'après `write-tree`. Le remède probable est un `trap 'rm -rf "$tmp"' EXIT` (et `rm -f "$idx"`) posé juste après la création, mais `sujet.sh` a de nombreuses sorties et sa suite (`sujet.test.mjs`, `sujet-carte.test.mjs`) est la plus longue du plugin : à instruire à part, avec son banc. La fuite est de quelques fichiers par refus, pas par appel.
- **`socle-tests/…/coverage-diff.mjs:212`** : `rmSync(dir)` est hors `finally` ; une exception entre la création et le retrait laisse le dossier. Petit, rare, hors du sujet des bancs.
- **Un nettoyage des dossiers anciens au démarrage** (`jouet-*` de plus d'un jour) : écarté. Une machine dont le disque est déjà plein n'a pas besoin du remède mais d'un `rm` à la main des `jouet-*` de son dossier temporaire ; ce ticket ne le fait pas à sa place.

## Comments

- 2026-11-14 — **Fait** : PR 92, fusionnée `2826309`, plugin 7.8.2. Écart décidé par l'architecte à la contre-relecture : la décision 5 (retrait sur signal) est retirée — les gestionnaires retardaient l'arrêt d'un `pnpm test` à 40-50 s sans retirer plus de dossiers ; un signal laisse les dossiers, comme `SIGKILL`. Ajoutés : garde de la racine avant la création, motif de `passer.sh` fermé à `/../`. Mesure : 645 dossiers / 353 Mo → 136 / 26 Mo.
- 2026-11-14 — Instruit sur `cadb4e5` (plugin 7.7.0, 456 tests). Mesure avant : 626 dossiers, 341 Mo, 45 874 fichiers dans un `TMPDIR` privé après `pnpm test`, dont 375 `jouet-*` (314 Mo), 102 `sens-*`, 10 `revue-*`, 9 `tickets-poses-*`. Remède joué : 466/466 trois fois (deux passes, puis sous l'environnement d'un capitaine), 130 dossiers et 23 Mo restants. Le garde `scripts/poses.test.mjs` n'est pas modifié ; l'attente « zéro dossier » y entre au ticket des autres bancs.
