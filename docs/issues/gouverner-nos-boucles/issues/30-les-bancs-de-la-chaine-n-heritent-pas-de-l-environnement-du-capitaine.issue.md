# Les bancs de la chaîne n'héritent plus de l'environnement du capitaine : le dépôt jouet retire `PASSER_*`, `BOUCLE_*`, `PRE_PUSH_*`, `REVUE_*` avec les `GIT_*`

Status: Fait — PR #87
Type: défaut
Label: contre-revue
Modèle: sonnet — un remplacement exact dans `depot-jouet.mjs`, un fichier de test donné entier, deux phrases de documentation et la version ; tout est joué sur une copie jetable de `origin/main` (voir « Vérification ») ; rien n'est à concevoir.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/sujet/scripts/depot-jouet.mjs`, `skills/chaine/sujet/scripts/environnement-des-bancs.test.mjs` (créé), `skills/chaine/sujet/SKILL.md`, `skills/chaine/sujet/references/CONTENU.md`, `.claude-plugin/plugin.json`

## Le besoin

**Le fait**, le 2026-11-14, chez un projet qui pose le socle : le capitaine de fusion met à jour une PR en retard sur la branche d'intégration et pousse. Depuis que `passer.sh` pousse sans sauter le hook (plugin 7.0.1), le pre-push du projet joue ses contrôles, bancs de `scripts/chaine/` compris, **sous le capitaine**. Il refuse le push : 10 tests rouges de `fusionner.test.mjs` (conflit d'index régénéré, conflit de code en sortie 2, PR sans section de revue, pile squashée, checks exigés rouges ou anciens, `FORCE_COLOR`, migration plus ancienne), tous avec `Error: Cannot find module '<dépôt>/.git/boucle-outils/scripts/chaine/revue-exigee.mjs'`. La veille s'arrête en sortie 3. **Toute PR en retard devient infusionnable.**

Quand le ticket est fait, un banc de la chaîne qui tourne sous le capitaine ne lit plus rien de l'environnement du vrai capitaine. Le `passer.sh` du jouet lit ses propres outils, la boucle du jouet n'écrase plus la copie des outils du capitaine et ne saute aucune PR du jouet à cause de lui. La suite est verte, variables du capitaine posées ou non.

## Où

Base : `origin/main` à `8c670e5` (plugin **7.5.0**, 428 tests). Les lignes ont été relues le 2026-11-14. La session les relève sur `origin/main` d'alors et retrouve chaque phrase par son texte.

### La cause

- `skills/chaine/fusionner/scripts/passer.sh:52-57` : `if [ -z "${PASSER_OUTILS:-}" ]` recopie le script et se relance avec `PASSER_OUTILS=<dossier> exec bash "$copie"`. Sinon il lit `"$PASSER_OUTILS/github.sh"` (`:57`), `revue-exigee.mjs` (`:140`) et `migrations-ordre.mjs` (`:147`). Le `PASSER_OUTILS` du capitaine passe à `git push`, au hook, à `pnpm`, au banc, puis au `passer.sh` que le banc lance dans son dépôt jouet. Ce `passer.sh`-là lit alors les outils du vrai capitaine.
- `skills/chaine/fusionner/scripts/boucle.sh:86-88` : `COPIE=${BOUCLE_COPIE:-…}` puis `export BOUCLE_COPIE`. `rafraichir_outils` fait `rm -rf "$COPIE" && mv "$COPIE.nouveau" "$COPIE"`. Une boucle de banc qui hérite de `BOUCLE_COPIE` **remplace la copie des outils du vrai capitaine** par la chaîne du jouet. Celle de `boucle-outils.test.mjs` n'a ni `revue-exigee.mjs` ni `migrations-ordre.mjs`, et son `passer.sh` est une doublure. C'est l'erreur rapportée : les tests `passer.sh` qui suivent lisent cette copie par `PASSER_OUTILS`.
- `skills/chaine/sujet/scripts/depot-jouet.mjs:34-44` (`ENV_GIT`) ne retire de `process.env` que les clés `GIT_*`.

### Les variables de la chaîne qui fuient

Inventaire par `git grep` sur les `.sh` et `.mjs` (hors tests) de `skills/chaine/*/scripts/`, `skills/chaine/socle-chaine-de-production/references/{agent,scripts}` et les gabarits `skills/monorepo/socle-monorepo/references/husky/*`. Il retient toute variable lue par `${NOM:-…}` ou `process.env.NOM`, ou exportée. Les autres majuscules de ces scripts (`DEPOT`, `SUJET`, `COPIE`, `VERROU`, `GENERES`…) sont affectées avant d'être lues : rien n'en fuit.

| Variable | Posée par | Lue par | Effet dans un banc, sous le capitaine |
| --- | --- | --- | --- |
| `PASSER_OUTILS` | `passer.sh:55` (préfixe d'`exec`) | `passer.sh:52,57,140,147` | le `passer.sh` du jouet lit les outils du vrai capitaine : `Cannot find module …/revue-exigee.mjs` |
| `BOUCLE_COPIE` | `boucle.sh:88` (`export`) | `boucle.sh:86` | la boucle du jouet efface et remplace la copie du vrai capitaine |
| `BOUCLE_SAUTEES`, `BOUCLE_ATTENTE` | `boucle.sh:202` (préfixe d'`exec`) | `boucle.sh:318,320` | la boucle du jouet saute les PR dont le numéro est sauté chez le capitaine |
| `BOUCLE_VERROU_PID` | `boucle.sh:155` (`export`) | `boucle.sh:151` | sans effet constaté (il faudrait le même pid) ; même préfixe |
| `PRE_PUSH_REFS` | gabarit `husky/pre-push:17-18` (`export`) | `socle-tests/…/verify/coverage-diff.mjs:91` | sans effet constaté sur les bancs de la chaîne ; ce sont les refs du vrai push |
| `REVUE_DIR` | la session de revue | `revue-adversariale/scripts/diff-revue.sh:14` | sans effet constaté : `diff-revue.test.mjs` le pose lui-même |
| `GIT_*` | git, sous un hook | git | déjà retirées (`GIT_DIR`, `GIT_INDEX_FILE` : piège connu) |

Aucune variable `VEILLE_*` ni `SUJET_*` n'est lue par un script de la chaîne. Les hooks d'agent lisent `CLAUDE_PROJECT_DIR`, `CLAUDE_ENV_FILE`, `PGHOST`, `PGPORT` et `NODE_EXTRA_CA_CERTS`, qui viennent de la session et non de la chaîne : hors de ce ticket.

### Les bancs qui construisent leur environnement autrement

Ces bancs passent par `process.env` (lu explicitement, ou hérité par un `spawnSync` sans `env`) sans passer par `depot-jouet.mjs`. Aucun ne lance un script qui lit une variable de la chaîne, aucun ne change :

- `veille.test.mjs` : hérite de tout, mais `boucle.sh` et `file.sh` y sont des doublures, et `veille.sh` ne lit aucune variable.
- `contexte-ticket.test.mjs` : `PROJET_RACINE`, posé par le banc.
- `faux-gh.test.mjs` : `FAUX_GH*`, posés par le banc.
- `chemins-sensibles.test.mjs` : filtre `GIT_*`, et `chemins-sensibles.mjs` ne lit aucune variable.
- Les bancs des hooks d'agent (`references/agent/*.test.mjs`) : `CLAUDE_PROJECT_DIR`, posé par le banc. `garde-commandes.test.mjs` passe par le `depot-jouet.mjs` du skill `tickets`, qui ne lance aucun script de la chaîne.
- `scripts/poses.test.mjs` : filtre `GIT_*` et `NODE_TEST_CONTEXT`. Les bancs posés qu'il rejoue filtrent eux-mêmes après ce ticket.

Les bancs qui lancent `passer.sh`, `boucle.sh`, `sujet.sh` ou `diff-revue.sh` passent tous par `depotJouet()` : `fusionner`, `sujet-fusionner`, `boucle-outils`, `migrations-ordre`, `github`, `sujet`, `sujet-carte`, `diff-revue`. Un seul remplacement les couvre tous.

### Reproduction, copie jetable de `8c670e5`

- `pnpm test` : **428 sur 428**.
- Avec, dans l'environnement, `PASSER_OUTILS=<c>/.git/boucle-outils/scripts/chaine`, `BOUCLE_COPIE=<c>/.git/boucle-outils` (copie sans `revue-exigee.mjs`), `BOUCLE_SAUTEES` et `BOUCLE_ATTENTE` à `" 1 2 … 300 "`, `PRE_PUSH_REFS`, `REVUE_DIR` et `BOUCLE_VERROU_PID` : **405 sur 428, 23 rouges**. Ce sont les 8 tests `passer.sh` du fait, la migration plus ancienne, 9 de `boucle-outils.test.mjs`, 4 tests `boucle.sh`, et le garde `scripts/poses.test.mjs`.
- Un banc posé à plat, `BOUCLE_COPIE` seul pointé vers un dossier témoin : `boucle-outils.test.mjs` est **vert (16 sur 16)**, et le dossier témoin a perdu son fichier pour devenir `scripts/chaine/{boucle,file,github,identifiant,passer,refus,renvoyer,sujet}` : **sans `revue-exigee.mjs`**, avec un `passer.sh` de doublure. C'est la copie incomplète rapportée.

## Décisions

1. **Retirer par préfixe, dans le dépôt jouet** : `GIT_`, `PASSER_`, `BOUCLE_`, `PRE_PUSH_`, `REVUE_`. C'est la même forme que le filtre `GIT_*` d'aujourd'hui, au même endroit, et il ne retire que ce que la chaîne pose. Les valeurs que les bancs posent **après** le filtre survivent : `d.env.BOUCLE_COPIE` et `d.env.TRACE` (`boucle-outils.test.mjs`), `FORCE_COLOR` (`fusionner`, `sujet-fusionner`), `REVUE_DIR` en tête de commande (`diff-revue.test.mjs`). La suite verte le montre.
2. **Pas de liste blanche** (ne garder que `PATH`, `HOME`, `TMPDIR`, `LANG`, `LC_*`, `NODE_*`…). Elle protégerait aussi d'une variable future, mais elle retire ce dont l'outillage d'un poste a besoin sans le dire : `SHELL`, `TERM`, `USER`, les variables des gestionnaires de versions (`VOLTA_HOME`, `ASDF_*`, `NVM_*`, dont un `node` de raccourci a besoin), `NIX_*`, `LD_LIBRARY_PATH`, les certificats. Chaque poste y perdrait de façon différente, et le défaut tomberait sur des bancs sans lien avec la chaîne. Une variable future de la chaîne prend l'un des cinq préfixes, ou s'ajoute à la liste, et le test nouveau la piège.
3. **Pas de correction de `passer.sh`** : son `PASSER_OUTILS` hérité est le mécanisme même de sa recopie. Pas de correction de `boucle.sh`, pour la même raison (`BOUCLE_COPIE`, `BOUCLE_SAUTEES`, `BOUCLE_ATTENTE`, `BOUCLE_VERROU_PID` portent son état d'une relance à l'autre).
4. **Défense en profondeur côté hook, laissée à part.** Le gabarit `husky/pre-push` pourrait faire `unset PASSER_OUTILS BOUCLE_COPIE BOUCLE_SAUTEES BOUCLE_ATTENTE BOUCLE_VERROU_PID REVUE_DIR` à côté de `unset GIT_DIR GIT_INDEX_FILE` (`:42`). **Pas `PRE_PUSH_REFS`**, que le hook exporte pour `check:coverage --base-auto`. Ce remède ne couvre que le pre-push : un capitaine qui joue un banc à la main, ou un pre-commit, fuit encore. Il touche aussi le gabarit qu'un autre ticket ouvert modifie (28). À instruire à part s'il est voulu.
5. **La preuve est un fichier de test nouveau**, `skills/chaine/sujet/scripts/environnement-des-bancs.test.mjs`, à côté de `depot-jouet.mjs`. `fusionner.test.mjs` et `scripts/poses.test.mjs` ne changent pas (un autre ticket en cours les modifie). Le scénario tourne dans un `node` enfant qui hérite des variables piégées, parce que `depot-jouet.mjs` lit `process.env` à son chargement. C'est la forme exacte du fait. Il est **posé** : `scripts/poses.test.mjs` copie le dossier `skills/chaine/sujet/scripts` entier (`POSES`, ligne 15), aucune liste n'est à toucher, et le garde le rejoue à plat. Seule la phrase « poser » de `sujet/SKILL.md`, qui nomme les fichiers du banc, le nomme aussi.
6. **Version : mineure.** Règle du `README.md`, « Ajouter un skill », étape 4 : patch pour une correction, mineure pour un skill ou un gabarit ajouté. Ici, c'est une correction, mais **ce que `poser` copie change** : un fichier de plus arrive sous `scripts/chaine/` chez un projet qui repose. Le précédent de la PR 84 (bancs posés autonomes, 7.4.1 → 7.5.0) va dans le même sens. On prend donc la mineure qui suit `origin/main` à l'ouverture de la PR (deuxième chiffre, troisième à 0). **Si une autre PR du plugin entre d'abord, fusionner `main` dans la branche (commit de fusion, ni rebase ni push forcé) et prendre la version qui suit la sienne.**
7. PR vers `main`, titre `fix(chaine): les bancs n'héritent plus de l'environnement du capitaine (plugin <version>)`. `Label: contre-revue` : PR ouverte hors brouillon, **sans `à-fusionner`**, et un mot à l'architecte dès la PR livrée. Commits sous les hooks, jamais `--no-verify`. Aucun test retiré, sauté ni assoupli.

## À faire, dans l'ordre

### 0. Le test d'abord, vu rouge sur `origin/main`

Créer le fichier du § 2 seul, puis `node --test skills/chaine/sujet/scripts/environnement-des-bancs.test.mjs` : **rouge**, `The input did not match the regular expression /\[#7\] FUSIONNÉE/` (`FILE VIDE` : `BOUCLE_SAUTEES=" 7 "` a sauté la PR). Puis le § 1, et le test passe au vert.

### 1. `skills/chaine/sujet/scripts/depot-jouet.mjs:34-37`

Remplacer ces lignes :

```js
// Sans les GIT_* hérités : sous le hook pre-push, GIT_DIR et GIT_INDEX_FILE visent le vrai dépôt,
// et les commandes du dépôt jouet y écriraient (commit « initial » sur la branche poussée).
const ENV_GIT = {
  ...Object.fromEntries(Object.entries(process.env).filter(([cle]) => !cle.startsWith('GIT_'))),
```

par :

```js
// Sans les variables de la chaîne héritées. Sous le hook pre-push, GIT_DIR et GIT_INDEX_FILE visent
// le vrai dépôt, et les commandes du dépôt jouet y écriraient (commit « initial » sur la branche
// poussée). Sous le capitaine (passer.sh pousse sans sauter le hook), PASSER_OUTILS ferait lire au
// passer.sh du jouet les outils du vrai capitaine, BOUCLE_COPIE ferait écraser sa copie par la boucle
// du jouet, BOUCLE_SAUTEES et BOUCLE_ATTENTE y sauteraient des PR ; PRE_PUSH_REFS et REVUE_DIR sont
// ceux du vrai push et de la vraie revue.
const PREFIXES_CHAINE = ['GIT_', 'PASSER_', 'BOUCLE_', 'PRE_PUSH_', 'REVUE_'];
const ENV_GIT = {
  ...Object.fromEntries(
    Object.entries(process.env).filter(([cle]) => !PREFIXES_CHAINE.some((p) => cle.startsWith(p))),
  ),
```

La suite de l'objet (`GIT_CONFIG_GLOBAL` … `GIT_COMMITTER_EMAIL`) ne change pas.

### 2. `skills/chaine/sujet/scripts/environnement-des-bancs.test.mjs` (créé)

Mot pour mot, dans la forme Prettier des projets (`printWidth` 100), pour que le fichier posé soit identique au source :

```js
// Les bancs de la chaîne tournent sous le pre-push, donc sous le capitaine quand passer.sh pousse :
// ils héritent alors de PASSER_OUTILS, BOUCLE_COPIE, BOUCLE_SAUTEES, PRE_PUSH_REFS… du vrai
// capitaine. Le dépôt jouet (depot-jouet.mjs) les retire : le passer.sh d'un banc lit ses propres
// outils, la boucle d'un banc n'écrase pas la copie du vrai capitaine ni ne saute ses PR.
// Le scénario tourne dans un node enfant, car depot-jouet.mjs lit process.env à son chargement.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const DEPOT_JOUET = new URL("./depot-jouet.mjs", import.meta.url).href;

// Une PR prête (#7) sur le jouet, la boucle du jouet la passe ; l'enfant rend l'env du jouet et la sortie.
const SCENARIO = `
import { depotJouet, script } from ${JSON.stringify(DEPOT_JOUET)};
const d = depotJouet();
d.publierChaine();
d.branche("docs/simple", "origin/develop", { "docs/simple.md": "simple\\n" });
d.git("switch", "-q", "--detach", "origin/develop");
d.github({
  exiges: ["qualite"],
  checks: { "*": { qualite: "SUCCESS" } },
  pulls: [{ number: 7, title: "docs(demo): simple", head: "docs/simple", base: "develop", labels: ["à-fusionner"] }],
});
const r = d.lancer(script("fusionner", "boucle.sh"));
console.log(JSON.stringify({ cles: Object.keys(d.env), status: r.status, sortie: r.stdout + r.stderr }));
`;

// Ce que le capitaine exporte quand passer.sh pousse sous le pre-push : outils et copie du vrai
// capitaine (sa copie, incomplète, sans revue-exigee.mjs), PR sautées, refs du vrai push.
function capitainePiege() {
  const racine = mkdtempSync(join(tmpdir(), "capitaine-"));
  const copie = join(racine, ".git", "boucle-outils");
  const outils = join(copie, "scripts", "chaine");
  mkdirSync(outils, { recursive: true });
  writeFileSync(join(copie, "MARQUE"), "copie du vrai capitaine\n");
  const env = {
    PASSER_OUTILS: outils,
    BOUCLE_COPIE: copie,
    BOUCLE_SAUTEES: " 7 ",
    BOUCLE_ATTENTE: " 7 ",
    BOUCLE_VERROU_PID: "1",
    PRE_PUSH_REFS: `refs/heads/vraie ${"1".repeat(40)} refs/heads/vraie ${"2".repeat(40)}`,
    REVUE_DIR: join(racine, "revue"),
  };
  return { racine, copie, env };
}

test(
  "sous les variables du capitaine héritées, la boucle d'un banc fusionne sa PR avec ses propres outils et laisse la copie du capitaine intacte",
  { timeout: 120_000 },
  () => {
    const p = capitainePiege();
    try {
      const r = spawnSync(process.execPath, ["--input-type=module", "-e", SCENARIO], {
        env: { ...process.env, ...p.env },
        encoding: "utf8",
      });
      assert.equal(r.status, 0, r.stdout + r.stderr);
      const { cles, status, sortie } = JSON.parse(r.stdout.trim().split("\n").at(-1));
      assert.equal(status, 0, sortie);
      assert.match(sortie, /\[#7\] FUSIONNÉE/);
      assert.ok(
        existsSync(join(p.copie, "MARQUE")),
        "la copie des outils du capitaine a été remplacée",
      );
      assert.deepEqual(readdirSync(join(p.racine, ".git")), ["boucle-outils"]);
      assert.deepEqual(
        cles.filter((cle) => cle in p.env),
        [],
        "l'environnement du dépôt jouet garde des variables du capitaine",
      );
    } finally {
      rmSync(p.racine, { recursive: true, force: true });
    }
  },
);
```

La boucle passe par `passer.sh` : sans le § 1, c'est le `passer.sh` du jouet qui lirait `PASSER_OUTILS`. Le dernier `deepEqual` tombe si l'un des cinq préfixes manque, même quand le comportement reste vert (`PRE_PUSH_REFS`, `REVUE_DIR`, `BOUCLE_VERROU_PID`).

### 3. Les textes

- `skills/chaine/sujet/SKILL.md:13`, dans la liste du banc d'essai, après `` `scripts/depot-jouet.mjs`, `` : insérer `` `scripts/environnement-des-bancs.test.mjs`, ``. La phrase devient « … `scripts/depot-jouet.mjs`, `scripts/environnement-des-bancs.test.mjs`, `scripts/faux-gh.mjs` et `scripts/faux-gh.test.mjs` → `scripts/chaine/` … ». Rien d'autre ne change.
- `skills/chaine/sujet/references/CONTENU.md`, section `## \`scripts/depot-jouet.mjs\`, \`scripts/faux-gh.mjs\``, après le paragraphe qui finit par « aucun état tronqué. » (ligne 13), une ligne vide puis ce paragraphe :

```markdown
Le dépôt jouet retire de l'environnement hérité les variables de la chaîne, par préfixe (`GIT_`, `PASSER_`, `BOUCLE_`, `PRE_PUSH_`, `REVUE_`) : depuis que `passer.sh` pousse sous le pre-push, les bancs tournent sous le capitaine, et le `passer.sh` d'un banc lisait les outils du vrai capitaine (`PASSER_OUTILS`), sa boucle remplaçait la copie du vrai capitaine (`BOUCLE_COPIE`) et sautait ses PR (`BOUCLE_SAUTEES`). Cas vécu : une mise à jour de PR refusée par dix tests rouges sous le capitaine. `scripts/environnement-des-bancs.test.mjs` rejoue une boucle du jouet sous ces variables piégées.
```

### 4. La version — `.claude-plugin/plugin.json:3`

La mineure qui suit `origin/main` à l'ouverture de la PR (décision 6). Rien d'autre ne change dans ce fichier.

### 5. Ce qui ne change pas

`passer.sh`, `boucle.sh`, le gabarit `husky/pre-push`, `fusionner.test.mjs`, `scripts/poses.test.mjs`, le `depot-jouet.mjs` du skill `tickets` (`skills/chaine/tickets/references/scripts/docs/`), et tous les bancs listés plus haut sous « Les bancs qui construisent leur environnement autrement ».

## Surfaces

| Surface | Preuve |
| --- | --- |
| sous les variables du capitaine, le banc joue ses propres outils, sa boucle n'écrase pas la copie du capitaine et ne saute pas ses PR (le fait) | `skills/chaine/sujet/scripts/environnement-des-bancs.test.mjs` « sous les variables du capitaine héritées, la boucle d'un banc fusionne sa PR avec ses propres outils et laisse la copie du capitaine intacte » |
| le banc nouveau, posé à plat chez un projet, tourne hors du plugin | `scripts/poses.test.mjs` « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » (inchangé, il rejoue le fichier nouveau) |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, à la mineure qui suit |

## Vérification

Joué le 2026-11-14 dans une copie jetable de `8c670e5`, avec les §§ 1-4 appliqués mot pour mot :

- Test du § 2 sans le § 1 : rouge, `FILE VIDE` au lieu de `[#7] FUSIONNÉE`. Le `deepEqual` final, joué en tête, nomme les 7 variables gardées. Avec le § 1 : vert.
- `pnpm test` : **429 sur 429** (428 + 1).
- `pnpm test` avec les variables piégées dans l'environnement (`PASSER_OUTILS` et `BOUCLE_COPIE` vers une copie incomplète de capitaine, `BOUCLE_SAUTEES`/`BOUCLE_ATTENTE` à `" 1 2 … 300 "`, `PRE_PUSH_REFS`, `REVUE_DIR`, `BOUCLE_VERROU_PID=1`) : **429 sur 429**, contre 405 sur 428 sans le § 1. La copie piégée garde son fichier témoin.
- `node --test scripts/depot.test.mjs` : vert (`SKILL.md` sous 200 lignes).

Pour la session :

1. Le § 0, puis `pnpm install --frozen-lockfile && pnpm test` : vert, avec **le compte de `origin/main` plus 1**. Aucun test retiré ni sauté. `git diff origin/main --stat -- '*.test.mjs'` ne montre que `skills/chaine/sujet/scripts/environnement-des-bancs.test.mjs`.
2. L'essai décisif : `PASSER_OUTILS=/nulle/part BOUCLE_COPIE=/nulle/part BOUCLE_SAUTEES=" 7 30 32 " PRE_PUSH_REFS=x pnpm test` → vert, même compte (joué : 429 sur 429 ; sans le § 1, 26 rouges sur 429).
3. `git grep -n "PREFIXES_CHAINE" -- skills` ne rend que `skills/chaine/sujet/scripts/depot-jouet.mjs` (deux lignes).

## Hors périmètre

- **Le gabarit `husky/pre-push`** (décision 4) : `unset` des variables de la chaîne à côté de `unset GIT_DIR GIT_INDEX_FILE`, en défense en profondeur. À instruire à part, après le ticket 28 qui touche le même fichier.
- **Les dossiers `jouet-*` que les bancs laissent dans le dossier temporaire** : `depotJouet()` ne les retire jamais. Sur une machine qui joue souvent les bancs, ils s'accumulent : plus de 30 000 relevés le 2026-11-14 dans le dossier temporaire d'une machine d'essai, qui ont fini par remplir son disque. À instruire à part.
- `skills/chaine/tickets/references/scripts/docs/depot-jouet.mjs` : il ne filtre que `GIT_*`, mais aucun banc qui le lit ne lance un script de la chaîne qui lise une variable de la chaîne. Rien ne fuit aujourd'hui.

## Comments

- 2026-11-14 — Instruit sur `8c670e5` (plugin 7.5.0). Fait reproduit : sous les variables du capitaine, 23 rouges sur 428 dans le plugin. Chez un projet posé à plat : 23 rouges sur 165 avec `PASSER_OUTILS` et `BOUCLE_COPIE` vers un dossier vide, 9 vers une copie de capitaine sans `revue-exigee.mjs` (les tests du fait, `Cannot find module …/boucle-outils/scripts/chaine/revue-exigee.mjs`), 13 sur 60 avec `BOUCLE_SAUTEES` seul. `boucle-outils.test.mjs`, vert, remplace une copie témoin par une chaîne sans `revue-exigee.mjs` : c'est la copie incomplète du fait. Remède joué dans le plugin (429/429, piégé ou non) et chez le projet (166/166 sur `scripts/chaine/`, 200/200 avec `scripts/agent/` sous les variables piégées).
