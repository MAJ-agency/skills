# Les bancs posés tournent dans un projet, et une spec se trouve par son identifiant où qu'elle soit sous `docs/`, mineure du plugin

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — les deux replis d'import et le test de garde sont donnés entiers, les textes mot pour mot ; ils ont été joués sur une copie jetable (voir « Où »), rien n'est à concevoir.
Blocked by: — (le ticket 23, qui touchait aussi `.claude-plugin/plugin.json` et la fiche « Ajouter un skill » du `README.md`, est livré par la PR 83, plugin 7.4.1 : la session part d'un `main` où il est entré)
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs`, `scripts/poses.test.mjs` (créé), `README.md`, `skills/chaine/revue-adversariale/SKILL.md`, `skills/chaine/revue-adversariale/references/CONTENU.md`, `skills/chaine/fusionner/SKILL.md`, `skills/chaine/socle-chaine-de-production/SKILL.md`, `skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs`, `skills/chaine/revue-de-ticket/scripts/contexte-ticket.test.mjs`, `skills/chaine/revue-de-ticket/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.test.mjs`, `.claude-plugin/plugin.json`

## Le besoin

**Les faits rapportés**, le 2026-11-14, par l'architecte d'un projet qui repose le socle en 7.3.0 :

1. « `fusionner.test.mjs` et `chemins-sensibles.test.mjs` ne tournent pas une fois copiés dans un projet sous `scripts/chaine/` (ils lisent l'arbre du plugin). »
2. « `contexte-ticket.mjs` ne cherche les specs que sous `docs/features/` », alors que ce projet range des specs sous d'autres dossiers de premier niveau : `docs/<domaine>/<ctx>/SPEC_<CTX>_<TRI>-<n>-<slug>.spec.md`, `<domaine>` étant un dossier d'infrastructure, de produit, d'architecture ou de design ; seules les fonctionnalités sont sous `docs/features/<feature>/<ctx>/` ; les tickets sont à côté de leur spec, sous `issues/`.

Le conducteur de ce projet a joué les deux bancs sur 7.4.0 (`1748f73`), copiés à plat sous `scripts/chaine/` avec les autres scripts de `fusionner/`, `sujet/` et `revue-adversariale/scripts/` : `fusionner.test.mjs` 29 réussis, 6 échoués, ENOENT sur `<racine du projet>/../monorepo/socle-monorepo/references/husky/pre-commit` ; `chemins-sensibles.test.mjs` ne se charge pas, ERR_MODULE_NOT_FOUND sur `<racine>/tickets/references/scripts/docs/depot-jouet.mjs`.

Quand le ticket est fait : chaque banc que les étapes `poser` copient sous `scripts/chaine/` tourne vert dans un projet, un test du plugin le rejoue à chaque PR, l'étape `poser` de `revue-adversariale` dit sans ambiguïté qu'elle pose ses bancs, et une spec (ou un ticket qui cite une spec) se trouve par son identifiant n'importe où sous `docs/`, pour la revue de ticket comme pour le laissez-passer des dépendances du hook `garde-commandes`.

## Où

Base : `origin/main` à `0361598` (plugin **7.4.1**), lignes relues le 2026-11-14 (instruit sur `1748f73` ; la PR 83 du ticket 23 n'a touché aucun des fichiers cités ici, hormis `README.md:176-183` et `.claude-plugin/plugin.json`). La session relève chaque ligne sur `origin/main` d'alors et retrouve les phrases par leur texte.

### Ce que posent les étapes `poser`, banc par banc

Copie jetable faite à la main comme le disent les skills : `socle-monorepo` (`scripts/docs/`, `scripts/verify/`), `tickets` (`references/scripts/docs/*` → `scripts/docs/`, `references/scripts/verify/*` → `scripts/verify/`), `fusionner/scripts/*`, `sujet/scripts/*`, `revue-adversariale/scripts/*` et `revue-de-ticket/scripts/*` → `scripts/chaine/`, `socle-chaine-de-production/references/agent/*` → `scripts/agent/` ; puis chaque banc joué seul par `node --test <banc>`.

| Banc | Posé (phrase source) | Dépendances hors de son dossier | Tourne posé à plat |
| --- | --- | --- | --- |
| `fusionner/scripts/fusionner.test.mjs` | oui, `fusionner/SKILL.md:14` « Les tests `scripts/*.test.mjs` suivent » | `depot-jouet.mjs` (repli à côté, `:11-15`) ; **`SOCLE` = `../../../monorepo/socle-monorepo/references/` (`:749`), lu en `:767` (`racine/commitlint.config.mjs`) et `:774` (`husky/pre-commit`)**, sans repli | **non** : 29 réussis, 6 échoués (`:794`, `:807`, `:822`, `:868`, `:925`, `:935`, les tests « sous les hooks » du ticket 16), ENOENT sur `…/monorepo/socle-monorepo/references/husky/pre-commit` |
| `revue-adversariale/scripts/chemins-sensibles.test.mjs` | ambigu : la table de `revue-adversariale/SKILL.md:13-17` ne le nomme pas, `CONTENU.md:9` dit « il reste dans le plugin (l'étape 0 ne le pose pas) », mais `socle-chaine-de-production/SKILL.md:32` dit « les scripts du capitaine et du sujet dans `scripts/chaine/`, avec leurs tests » et un projet copie `scripts/*` | **import statique `../../tickets/references/scripts/docs/depot-jouet.mjs` (`:8`)**, pour charger le gate `verify/tickets-regles.mjs` (`:59`) | **non** : le fichier ne se charge pas, ERR_MODULE_NOT_FOUND sur `<racine>/tickets/references/scripts/docs/depot-jouet.mjs` |
| `revue-adversariale/scripts/diff-revue.test.mjs` | même ambiguïté (`CONTENU.md:5` « qui reste dans le plugin ») | `depot-jouet.mjs`, repli à côté (`:7-11`) | oui, 5 sur 5 |
| `revue-de-ticket/scripts/contexte-ticket.test.mjs` | oui, `revue-de-ticket/SKILL.md:15` « et son test » | grammaire `../docs/identifiants.mjs`, repli plugin (`:16-20`) | oui, 8 sur 8 |
| `fusionner/scripts/boucle-outils`, `github`, `migrations-ordre`, `sujet-fusionner` `.test.mjs` | oui, `fusionner/SKILL.md:14` | `depot-jouet.mjs`, repli à côté | oui (16, 7, 12, 9) |
| `fusionner/scripts/identifiant.test.mjs` | oui | grammaire, repli `../docs/` (`:11-14`) | oui, 8 |
| `fusionner/scripts/revue-exigee.test.mjs`, `veille.test.mjs` | oui | aucune | oui (8, 13) |
| `sujet/scripts/sujet.test.mjs`, `sujet-carte.test.mjs`, `faux-gh.test.mjs` | oui, `sujet/SKILL.md:13` | `./depot-jouet.mjs`, posé avec eux | oui (30, 18, 1) |
| `tickets/references/scripts/docs/*.test.mjs`, `scripts/verify/tickets*.test.mjs` | oui, `tickets/SKILL.md:45-46` « tests `*.test.mjs` compris » | `depot-jouet.mjs` de `tickets`, qui prend la grammaire posée à côté (`scripts()`, `:24-25`) | oui, tous |
| `socle-chaine-de-production/references/agent/*.test.mjs` | oui, `socle-chaine-de-production/SKILL.md:35` | repli `PROJET ? '../docs/' : plugin` (`garde-commandes.test.mjs:12-15`) | oui, tous |
| `socle-chaine-de-production/references/scripts/verify/settings-json.test.mjs` | oui, `:36` (4 bis) | aucune | oui, 19 |
| `socle-chaine-de-production/references/scripts/github/develop.test.mjs` | non : `:41` (étape 9) ne copie que `develop.sh` | `husky/pre-push` du socle par le chemin du plugin (`:16`) | non posé (posé à la main : 8 échecs, ENOENT) — hors périmètre |
| `socle-tests/references/scripts/verify/*.test.mjs` | oui, `socle-tests/SKILL.md:31` « tests compris » | `mutation-regles.test.mjs:12` cherche ses configurations dans `../../gabarits/` ou `../../apps/api/` | oui, sauf `mutation-regles.test.mjs` dans un dépôt sans `apps/api/stryker*.config.mjs` (TypeError) — hors périmètre, voir § Hors périmètre |
| `socle-monorepo/references/scripts/*/*.test.mjs` | oui | aucune hors du projet | oui |

Deux bancs posés sous `scripts/chaine/` tombent, et ce sont exactement ceux du fait 1. Le repli d'import existe déjà ailleurs dans le plugin, sous trois formes : `depot-jouet.mjs` à côté sinon dans `sujet` (`fusionner.test.mjs:11-15`, `diff-revue.test.mjs:7-11`), la grammaire à côté sinon dans `socle-monorepo` (`identifiant.test.mjs:11-14`, `contexte-ticket.test.mjs:16-20`), `PROJET ? projet : plugin` (`garde-commandes.test.mjs:12-15`). Les deux bancs fautifs n'en ont pas pour la dépendance qui casse.

**Reproduction et remède joués** dans une copie jetable : les deux replis du § 1 et § 2 appliqués, `chemins-sensibles.test.mjs` et `fusionner.test.mjs` rendent 42 sur 42, posés à plat (avec `.husky/pre-commit` et `commitlint.config.mjs` du socle à la racine du jouet) **et** à leur place dans l'arbre du plugin.

### Fait 2 — `contexte-ticket.mjs` (276 lignes)

- `:85` trouve le ticket partout sous `docs/` (`fichierDuTicket(id)`, `walk(join(ROOT, "docs"))` en `:72`) ; mais `:91-95` ne cherche sa spec que si `rel(p).startsWith("docs/features/")`. Spec ailleurs : `## Spec — introuvable : docs/features/**/<SPEC>-<slug>.spec.md` (`:245`), « (aucune ligne de la spec ne cite ce ticket) », **sortie 0**. L'axe Ticket de la revue perd la ligne de spec du ticket sans que rien ne s'arrête. Reproduit : ticket `docs/infrastructure/all/issues/SPEC_ALL_INF-1-hebergement.01.issue.md`, spec à côté, sortie ci-dessus.
- `:182-190` : une spec **citée** dans le ticket subit le même filtre (`:187`) et se dit introuvable avec `docs/features/**/…` (`:184`).
- `:19` : le commentaire d'en-tête porte la même hypothèse.
- Le reste est légitime et reste : `:139` (règle sous `docs/metier/regles/<ctx>/`) et `:192` (demande sous `docs/demandes/<ctx>/`) suivent la convention écrite du socle et le registre que lit Anchorpost ; `:179` et `:204` cherchent déjà sous `docs/**`.

Appelants : `revue-de-ticket/SKILL.md:27` (la commande de la revue) et `revue-de-ticket/references/criteres-ticket.md:3` ; `sujet/scripts/depot-jouet.mjs:73` le publie sur le develop du jouet.

**La même hypothèse ailleurs dans le plugin** (`git grep -n "docs/features" origin/main -- skills ':!*.md'`, puis les `.md` qui donnent une commande) :

| Occurrence | Classement |
| --- | --- |
| `contexte-ticket.mjs:19, :93, :184, :187, :245` | **à corriger** (ci-dessus) |
| `socle-chaine-de-production/references/agent/garde-commandes.mjs:51` : `git ls-tree -r --name-only <sujet> docs/features` | **à corriger** : le laissez-passer de la ligne `Dépendances:` ne lit les tickets d'un sujet que sous `docs/features/` ; pour un ticket rangé sous `docs/<autre>/<ctx>/issues/`, le hook refuse un paquet que son ticket prévoit. Lu, non joué : le test du § 6 le montre rouge |
| `tickets/references/scripts/docs/migrer-tickets.mjs:5, :49` | légitime : migre l'ancienne forme, définie sous `docs/features/<feature>/`, et prend la feature en argument |
| bancs `*.test.mjs` (`fusionner`, `sujet`, `tickets`, `socle-monorepo`, `garde-commandes`) | légitimes : chemins d'exemple dans un dépôt jouet |
| `tickets/SKILL.md:3, :23, :72` ; `tickets/references/agents/issue-tracker.md`, `triage-labels.md` ; `socle-monorepo/SKILL.md`, `references/agents/*`, `references/methode/nomenclature.md:31, :93`, `references/racine/*` ; gabarits de tickets des socles back, web, mobile ; `anchorpost/SKILL.md:48` | légitimes : convention documentée du socle et chemins où un socle écrit ses propres tickets ; aucune commande n'y échoue sur une spec rangée ailleurs |

Les autres scripts lisent déjà tout `docs/` : `sujet.sh:124, :184`, `avancement.mjs:70`, `ticket-libre.mjs:49`, `vagues.mjs:139`, `archiver-tickets.mjs:36`, `couts.mjs:171`, et le gate `tickets-regles.mjs:182-185` (`identifiantsEnDouble`) refuse déjà un identifiant de spec porté par deux fichiers **n'importe où sous `docs/**`** (banc `tickets-gate.test.mjs:26` « un identifiant porté par deux specs est refusé »).

**La convention du socle le permet** : `socle-monorepo/references/methode/nomenclature.md` § « Pourquoi » : « L'arborescence ne porte plus que le rangement ; le nom porte l'identité. Un fichier peut déménager, sa citation reste juste. » Une spec se reconnaît par son nom (`identifiantDeLaSpec`, `identifiants.mjs:92-94` : `^SPEC_<CTX>_<TRI>-<n>-<slug>\.spec\.md$`), où qu'elle soit. Le remède est donc de chercher par identifiant sous `docs/**`, comme pour les ADR (`:204`), **sans clé nouvelle dans `.claude/chaine.json`**.

## Décisions

1. **Les bancs de `revue-adversariale` sont posés**, et dits posés : un projet a intérêt à rejouer la parité entre son gate `scripts/verify/tickets-regles.mjs` et sa copie de `chemins-sensibles.mjs` (le moteur est recopié, pas importé : c'est dans le projet qu'une divergence de versions apparaît). Revient sur la décision du ticket 17 (« les deux bancs nouveaux restent dans le plugin ») et du ticket 22 (décision 4), qu'un projet n'a pas suivie faute d'une phrase claire.
2. **Chaque banc posé se rend autonome par un repli d'import**, sur le modèle existant (§ « Où ») : le fichier du projet s'il existe, sinon celui du plugin. Aucun test ne change d'assertion.
3. Dans un projet, `fusionner.test.mjs` joue les scripts sous **le `.husky/pre-commit` et le `commitlint.config.mjs` de la racine du projet** (posés par `socle-monorepo`, `TABLE-RACINE.md:7, :9`), plus ceux du plugin : c'est bien sous les hooks du projet que le capitaine fusionne. Un projet dont le hook diverge du socle le verra rouge, et c'est voulu. Un projet à qui manque l'un des deux fichiers voit ces six tests échouer sur une ligne qui nomme le fichier manquant, jamais sur un `ENOENT` d'un chemin du plugin, et jamais sautés.
4. **Un test du plugin pose à plat et rejoue** les bancs de `scripts/chaine/` (`scripts/poses.test.mjs`), pour que ce défaut ne revienne pas avec le prochain banc. Coût mesuré : environ 50 s de plus pour `pnpm test`. Restreindre le garde aux deux bancs réparés ne gagne rien : `fusionner` fait à lui seul 48 s, et `node --test` joue les bancs en parallèle. Les sources se lisent dans les dossiers des skills posés (`readdirSync`), pas dans un tableau recopié.
5. `contexte-ticket.mjs` et `garde-commandes.mjs` cherchent une spec et ses tickets **par identifiant sous `docs/`**. Pas de clé dans `.claude/chaine.json` : la nomenclature dit déjà que le nom porte l'identité, et le gate des tickets cherche déjà sous `docs/**`. Une spec en double trouvée par la revue de ticket n'est pas signalée par `contexte-ticket.mjs`, qui prend la première ; le gate `identifiantsEnDouble` l'a déjà refusée.
6. Ni `--no-verify`, ni test retiré, sauté ou assoupli ; aucune dépendance nouvelle.
7. **La version est une mineure** (§ 7), décidé par l'architecte.

**`garde-commandes.mjs` ne s'élargit pas en confiance.** Le hook lit toujours la ligne `Dépendances:` du ticket de la branche sur `origin/sujet/*` ; passer de `docs/features` à `docs` élargit le lieu de lecture, pas la confiance. Un doublon donne l'intersection des paquets, donc plus strict ; un `ls-tree` qui déborderait donne un refus, jamais un laissez-passer.

### Remèdes écartés

- **Ne pas poser `fusionner.test.mjs` ni `chemins-sensibles.test.mjs`, et le dire dans `poser`** : `fusionner.test.mjs` est le banc principal des scripts du capitaine (35 tests), `fusionner/SKILL.md:14` le pose depuis toujours ; le retirer changerait le contrat de `poser` et ôterait au projet la seule preuve que ses scripts passent sous ses hooks. Pour `chemins-sensibles`, voir décision 1.
- **Sauter les six tests « sous les hooks » hors du plugin** (`test.skip` quand le socle est absent) : un test sauté est un test retiré pour le projet.
- **Poser les fichiers du socle à côté du banc** (`scripts/chaine/socle/husky/pre-commit`…) : une copie de plus à tenir à jour, qui ne serait pas le hook réel du projet.
- **Une clé `dossiersSpecs` dans `.claude/chaine.json`** : inutile, l'identifiant suffit ; une clé de plus à tenir, que le gate n'a pas.
- **Garder `docs/features/` et ajouter les dossiers de la nomenclature** (`docs/architecture/`, `docs/infrastructure/`…) : liste fermée qui manquerait le prochain dossier d'un projet (`produit`, `design`).

## À faire, dans l'ordre

### 0. Les tests d'abord, vus rouges sur `origin/main`

Écrire le § 3 (garde), le § 5 (deux tests de `contexte-ticket`) et le § 6 (test de `garde-commandes`), les jouer, les voir rouges avec les motifs donnés dans « Surfaces », **puis** seulement corriger.

### 1. `skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs`

- `:5` : ajouter `existsSync` à l'import de `node:fs` : `import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";`
- `:8` : remplacer la ligne `import { module as chargerModule } from "../../tickets/references/scripts/docs/depot-jouet.mjs";` par :

```js
// Posé dans un projet, le gate est dans scripts/verify/ ; dans le plugin, le dépôt jouet du skill tickets le pose.
const GATE_POSE = new URL("../verify/tickets-regles.mjs", import.meta.url);
const chargerGate = existsSync(GATE_POSE)
  ? () => import(GATE_POSE.href)
  : async () => (await import("../../tickets/references/scripts/docs/depot-jouet.mjs")).module("verify/tickets-regles.mjs");
```

- `:59` : `const gate = await chargerModule("verify/tickets-regles.mjs");` devient `const gate = await chargerGate();`. Rien d'autre ne change.

### 2. `skills/chaine/fusionner/scripts/fusionner.test.mjs`

- `:749` : remplacer la ligne `const SOCLE = …` par (le signe « posé » est celui que le banc utilise déjà en `:11-15` : `depot-jouet.mjs` à côté) :

```js
// Posé dans un projet (depot-jouet.mjs à côté), les scripts passent sous le hook et la configuration de la
// racine du projet ; dans le plugin, sous ceux du socle. Un fichier absent fait échouer ces tests, jamais les sauter.
const POSE = existsSync(new URL("./depot-jouet.mjs", import.meta.url));
const [PRE_COMMIT, COMMITLINT] = (
  POSE
    ? ["../../.husky/pre-commit", "../../commitlint.config.mjs"]
    : ["../../../monorepo/socle-monorepo/references/husky/pre-commit", "../../../monorepo/socle-monorepo/references/racine/commitlint.config.mjs"]
).map((chemin) => fileURLToPath(new URL(chemin, import.meta.url)));
const MANQUANT = [PRE_COMMIT, COMMITLINT].find((f) => !existsSync(f));
```

- Juste après `function hooks(d) {` (`:752`), première ligne du corps : ``if (MANQUANT) assert.fail(`fichier manquant : ${MANQUANT} (posé par socle-monorepo) ; les tests sous les hooks en ont besoin`);``
- `:767` : `${JSON.stringify(join(SOCLE, "racine/commitlint.config.mjs"))}` devient `${JSON.stringify(COMMITLINT)}`.
- `:774` : `readFileSync(join(SOCLE, "husky/pre-commit"), "utf8")` devient `readFileSync(PRE_COMMIT, "utf8")`.
- `grep -n SOCLE skills/chaine/fusionner/scripts/fusionner.test.mjs` ne rend plus rien.

Joué sur une copie de `0361598` : 35 sur 35 dans le plugin et posé à plat ; posé sans `commitlint.config.mjs`, 29 réussis et les six tests « sous les hooks » échouent chacun sur `fichier manquant : <racine>/commitlint.config.mjs (posé par socle-monorepo) ; les tests sous les hooks en ont besoin`.

### 3. `scripts/poses.test.mjs` (créé) : le garde

Un test, titre exact « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin ». Il pose dans un dossier temporaire **chaque fichier** des dossiers `scripts/` des skills posés, lus par `readdirSync` (jamais une liste de fichiers recopiée : un script ou un banc ajouté à l'un de ces dossiers est posé par le garde sans qu'on y pense), plus les deux fichiers de racine que lit `fusionner.test.mjs` ; il refuse un nom posé deux fois (deux skills qui poseraient le même nom s'écraseraient) ; puis il joue `node --test` sur les `scripts/chaine/*.test.mjs` posés. Le fichier entier, joué sur une copie de `0361598` (rouge : 171 tests, 7 échecs, les 6 de `fusionner.test.mjs` et le chargement de `chemins-sensibles.test.mjs` ; vert après § 1-2 ; 42 à 52 s) :

```js
// Les bancs que les étapes `poser` copient à plat sous `scripts/chaine/` d'un projet tournent hors du
// plugin : aucun ne lit l'arbre du plugin sans repli. Les sources se lisent dans les dossiers des
// skills posés, pas dans une liste recopiée : un script ajouté à l'un d'eux est posé ici aussi.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const RACINE = fileURLToPath(new URL("..", import.meta.url));
// [dossier source dans le plugin, dossier de destination dans le projet]
const POSES = [
  ["skills/chaine/fusionner/scripts", "scripts/chaine"],
  ["skills/chaine/sujet/scripts", "scripts/chaine"],
  ["skills/chaine/revue-adversariale/scripts", "scripts/chaine"],
  ["skills/chaine/revue-de-ticket/scripts", "scripts/chaine"],
  ["skills/monorepo/socle-monorepo/references/scripts/docs", "scripts/docs"],
  ["skills/chaine/tickets/references/scripts/docs", "scripts/docs"],
  ["skills/chaine/tickets/references/scripts/verify", "scripts/verify"],
];
// Fichiers de la racine du projet que les bancs posés lisent (socle-monorepo, TABLE-RACINE.md).
const RACINE_PROJET = [
  ["skills/monorepo/socle-monorepo/references/husky/pre-commit", ".husky/pre-commit"],
  ["skills/monorepo/socle-monorepo/references/racine/commitlint.config.mjs", "commitlint.config.mjs"],
];
// Sans les GIT_* hérités (sous un hook git, ils visent le vrai dépôt) ni NODE_TEST_CONTEXT : avec lui, le
// `node --test` enfant rend ses résultats au parent au lieu de les jouer et de sortir non nul.
const env = () =>
  Object.fromEntries(Object.entries(process.env).filter(([cle]) => !cle.startsWith("GIT_") && cle !== "NODE_TEST_CONTEXT"));

test("les bancs posés à plat sous scripts/chaine/ tournent hors du plugin", { timeout: 320_000 }, () => {
  const projet = mkdtempSync(join(tmpdir(), "poses-"));
  const poses = new Map();
  const poser = (source, destination) => {
    assert.ok(!poses.has(destination), `${destination} posé deux fois : ${poses.get(destination)} et ${source}`);
    poses.set(destination, source);
    mkdirSync(join(projet, destination, ".."), { recursive: true });
    copyFileSync(join(RACINE, source), join(projet, destination));
    if (/\.sh$|pre-commit$/.test(destination)) chmodSync(join(projet, destination), 0o755);
  };
  for (const [dossier, vers] of POSES)
    for (const nom of readdirSync(join(RACINE, dossier))) poser(`${dossier}/${nom}`, `${vers}/${nom}`);
  for (const [source, destination] of RACINE_PROJET) poser(source, destination);
  const bancs = readdirSync(join(projet, "scripts/chaine"))
    .filter((n) => n.endsWith(".test.mjs"))
    .sort()
    .map((n) => join("scripts/chaine", n));
  const r = spawnSync(process.execPath, ["--test", ...bancs], { cwd: projet, env: env(), encoding: "utf8", timeout: 300_000 });
  assert.equal(r.status, 0, (r.stdout + r.stderr).trim().split("\n").slice(-40).join("\n"));
});
```

`NODE_TEST_CONTEXT` doit être retiré de l'environnement de l'enfant : avec lui, le `node --test` enfant rend ses résultats au parent et le test passe en 0 s sans rien jouer (vu en écrivant le garde). Un nouveau skill dont l'étape `poser` copie un dossier de scripts sous `scripts/chaine/` ajoute ce dossier à `POSES`, dans la même PR (phrase du `README.md`, § 4).

### 4. Les étapes `poser`, sans ambiguïté

- `skills/chaine/revue-adversariale/SKILL.md`, table de l'étape 0 (`:13-17`) : ajouter, après la ligne de `scripts/chemins-sensibles.mjs`, la ligne `| `scripts/*.test.mjs` | `scripts/chaine/` (`diff-revue.test.mjs` lit `depot-jouet.mjs`, posé par `sujet poser` ; `chemins-sensibles.test.mjs` lit le gate `scripts/verify/tickets-regles.mjs`, posé par `tickets poser`) |`.
- `skills/chaine/revue-adversariale/references/CONTENU.md:5` : « Banc : `diff-revue.test.mjs`, sur le dépôt jouet du skill `sujet`, qui reste dans le plugin. » devient « Banc : `diff-revue.test.mjs`, sur le dépôt jouet du skill `sujet` ; posé avec le script, il prend `depot-jouet.mjs` à côté de lui. »
- même fichier, `:9` : « `chemins-sensibles.test.mjs` garde la parité avec le gate ; il reste dans le plugin (l'étape 0 ne le pose pas), parce qu'il lit le gate par le chemin du plugin. » devient « `chemins-sensibles.test.mjs` garde la parité avec le gate ; posé dans un projet, il la vérifie contre le gate du projet (`scripts/verify/tickets-regles.mjs`), dans le plugin contre celui du skill `tickets`. »
- `skills/chaine/socle-chaine-de-production/SKILL.md:32` : « (`scripts/chaine/diff-revue.sh` et `chemins-sensibles.mjs`, le fichier de critères) » devient « (`scripts/chaine/diff-revue.sh` et `chemins-sensibles.mjs` avec leurs bancs, le fichier de critères) ».
- `skills/chaine/fusionner/SKILL.md:14`, après « ils lisent `depot-jouet.mjs` et `faux-gh.mjs`, posés par `sujet poser` » : ajouter « , et `fusionner.test.mjs` joue les scripts sous le `.husky/pre-commit` et le `commitlint.config.mjs` de la racine du projet ».
- `README.md`, fiche « Ajouter un skill » (`:176-183`), après le paragraphe « Cette règle vaut pour **tout** changement de contenu, pas seulement l'ajout d'un skill. » : ajouter le paragraphe « Un skill dont l'étape `poser` copie un dossier de scripts dans `scripts/chaine/` d'un projet ajoute ce dossier à `POSES` dans `scripts/poses.test.mjs` : le garde pose ses fichiers à plat et rejoue ses bancs hors du plugin. Un banc posé ne lit jamais l'arbre du plugin sans repli vers le fichier du projet. » `README.md` devient un fichier chaud ; aucun ticket en cours ne le touche (le 23, qui modifiait la même fiche, est livré).

### 5. `skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs`

- `:19` : `docs/features/**\/<ID>-<slug>.spec.md` devient `docs/**\/<ID>-<slug>.spec.md, où qu'elle soit rangée (le nom porte l'identité)`.
- `:91-95` : retirer la condition `rel(p).startsWith("docs/features/") &&` ; il reste `docs.find((p) => identifiantDeLaSpec(basename(p)) === spec)`.
- `:184` : `docs/features/**/${code}-<slug>.spec.md` devient `docs/**/${code}-<slug>.spec.md`.
- `:186-189` : retirer la condition `rel(p).startsWith("docs/features/") &&`.
- `:245` : `introuvable : docs/features/**/${spec}-<slug>.spec.md` devient `introuvable : docs/**/${spec}-<slug>.spec.md`.
- `git grep -n "docs/features" -- skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs` ne rend plus rien.

Dans `skills/chaine/revue-de-ticket/scripts/contexte-ticket.test.mjs`, deux tests, écrits d'abord :

- « une spec rangée hors de docs/features/ est trouvée par son identifiant, avec la ligne qui cite le ticket » : `depot({ "docs/infrastructure/all/SPEC_ALL_INF-1-hebergement.spec.md": "# SPEC_ALL_INF-1 — Hébergement\n\n| NN | Objet |\n| --- | --- |\n| 01 | Mesurer l'hébergement |\n", "docs/infrastructure/all/issues/SPEC_ALL_INF-1-hebergement.01.issue.md": "# Mesurer\n\nStatus: ready-for-agent\nType: task\n" })`, lancé sur `SPEC_ALL_INF-1.01` : sortie 0, la sortie porte `## Spec — docs/infrastructure/all/SPEC_ALL_INF-1-hebergement.spec.md` et la ligne `| 01 | Mesurer l'hébergement |`. Rouge sur `origin/main` : `## Spec — introuvable : docs/features/**/SPEC_ALL_INF-1-<slug>.spec.md`.
- « une spec citée hors de docs/features/ est trouvée ; absente, le chemin cherché est docs/** » : le ticket `TICKET` du banc cite `SPEC_ALL_DES-2` et `SPEC_ALL_ARC-9` ; `docs/design/all/SPEC_ALL_DES-2-charte.spec.md` (`# SPEC_ALL_DES-2 — Charte\n`) existe, `SPEC_ALL_ARC-9` non : `section(o, "SPEC_ALL_DES-2")` porte `- trouvé : docs/design/all/SPEC_ALL_DES-2-charte.spec.md — SPEC_ALL_DES-2 — Charte`, `section(o, "SPEC_ALL_ARC-9")` porte `- introuvable : docs/**/SPEC_ALL_ARC-9-<slug>.spec.md`. Rouge sur `origin/main` : `SPEC_ALL_DES-2` introuvable.

`skills/chaine/revue-de-ticket/references/CONTENU.md:5`, après « avec le chemin cherché ; » : ajouter « une spec se trouve par son identifiant n'importe où sous `docs/` (le nom porte l'identité, `nomenclature.md`), pas seulement sous `docs/features/` ; ».

### 6. `skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.mjs:51`

`git('ls-tree', '-r', '--name-only', sha, 'docs/features')` devient `git('ls-tree', '-r', '--name-only', sha, 'docs')`. Le filtre qui suit (`identifiantDuTicket(…) === id`, `!estArchive`) reste.

Dans `garde-commandes.test.mjs` : la fonction `depot` reçoit en option le chemin du ticket, la branche et le titre, par défaut ceux d'aujourd'hui (`TICKET`, `feat/spec-all-demo-1-01-carte`) ; l'aide `ticket()` (`:19`) code son titre en dur (`# SPEC_ALL_DEMO-1.01 — x`) et peut rester telle quelle, le hook ne lisant que la ligne `Dépendances:` (le relecteur a écrit ce test en paramétrant chemin, branche et titre : rouge, puis vert après la ligne `:51`) ; un test, écrit d'abord, « ticket rangé hors de docs/features/ avec Dépendances: `leaflet` sur le sujet → pnpm add leaflet passe » : ticket `docs/infrastructure/all/issues/SPEC_ALL_INF-1-hebergement.01.issue.md` (titre `# SPEC_ALL_INF-1.01 — x`), branche `feat/spec-all-inf-1-01-mesure`, ligne `Dépendances: \`leaflet\`` sur `origin/sujet/demo` : `passe(lancer(d, 'pnpm add leaflet@1.9.4'))`, `refuse(lancer(d, 'pnpm add leaflet zod'))`. Rouge sur `origin/main` : `pnpm add leaflet@1.9.4` sort en 2.

### 7. La version — `.claude-plugin/plugin.json:3`

Règle du `README.md`, « Ajouter un skill », étape 4 : « Patch pour une correction, mineure pour un skill ou un gabarit ajouté, majeure quand un skill existant change de contrat. » Ici, ce que `poser` copie dans les projets change (deux bancs posés qui ne l'étaient pas, un script de hook et un script de revue qui lisent plus de dossiers, des étapes `poser` précisées) : **mineure**. La session prend la version de `origin/main` à l'ouverture de la PR et monte le deuxième chiffre.

## Surfaces

| Surface | Preuve |
| --- | --- |
| bancs posés à plat (fait 1) | `scripts/poses.test.mjs` « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » (rouge sur `origin/main`, vert après § 1-2) |
| `chemins-sensibles.test.mjs` dans le plugin | `skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs` « parité : même verdict que motifSensibleTouche du gate » et les six autres, inchangés et verts |
| `fusionner.test.mjs` dans le plugin | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : un conflit d'index conclu sous les hooks (pre-commit, commit-msg, pre-push) ; lint-staged voit GIT_INDEX_FILE, check:commit non » et les cinq autres tests « sous les hooks » (`:807`, `:822`, `:868`, `:925`, `:935`), inchangés et verts |
| spec du ticket hors de `docs/features/` (fait 2) | `skills/chaine/revue-de-ticket/scripts/contexte-ticket.test.mjs` « une spec rangée hors de docs/features/ est trouvée par son identifiant, avec la ligne qui cite le ticket » |
| spec citée hors de `docs/features/` | `skills/chaine/revue-de-ticket/scripts/contexte-ticket.test.mjs` « une spec citée hors de docs/features/ est trouvée ; absente, le chemin cherché est docs/** » |
| laissez-passer des dépendances | `skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.test.mjs` « ticket rangé hors de docs/features/ avec Dépendances: `leaflet` sur le sujet → pnpm add leaflet passe » |
| les étapes `poser` | `git grep -n "scripts/\*.test.mjs" -- skills/chaine/revue-adversariale/SKILL.md` rend la ligne de la table ; `git grep -n "reste dans le plugin" -- skills/chaine/revue-adversariale/references/CONTENU.md` ne rend rien |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, à la mineure qui suit |

## Vérification

- `pnpm test` vert : le nombre de `origin/main` au départ plus 4. Aucun test existant retiré, sauté ni assoupli : `git diff origin/main --stat -- '*.test.mjs'` ne montre que les quatre fichiers de bancs nommés et `scripts/poses.test.mjs` ; dans `fusionner.test.mjs` et `chemins-sensibles.test.mjs`, aucune ligne `assert` ne change (`git diff origin/main -- skills/chaine/fusionner/scripts/fusionner.test.mjs skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs | grep -c "^[-+].*assert"` rend 0).
- `git grep -n "docs/features" origin/main -- skills ':!*.md' ':!*.test.mjs'`, rejoué sur la branche, ne rend plus que `migrer-tickets.mjs:5, :49`.
- `git grep -n "^import .*\.\./\.\./" -- 'skills/chaine/*/scripts/*.test.mjs'` ne rend rien (sur `0361598`, il rend `chemins-sensibles.test.mjs:8`).
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche de documentation du programme sans le modifier, commite sous les hooks (jamais `--no-verify`), ouvre sa PR hors brouillon **sans poser `à-fusionner`** (`Label: contre-revue`), et écrit à l'architecte dès sa PR livrée.

## Hors périmètre

- `socle-chaine-de-production/references/scripts/github/develop.test.mjs` : il lit `husky/pre-push` par le chemin du plugin (`:16`), mais l'étape 9 ne le pose pas ; il n'est pas sous `scripts/chaine/`.
- `socle-tests/references/scripts/verify/mutation-regles.test.mjs` : posé, il cherche ses configurations Stryker dans `apps/api/` (`:12`) et tombe en TypeError dans un dépôt sans API ; défaut distinct, à instruire à part.
- La convention écrite (`nomenclature.md:31`, `tickets/SKILL.md:23`, `issue-tracker.md`) qui range les specs sous `docs/features/` : ce ticket rend les scripts indifférents au rangement, il ne change pas la convention. L'élargir, ou documenter les specs de domaine, est une décision de l'architecte.
- Les règles (`docs/metier/regles/<ctx>/`) et les demandes (`docs/demandes/<ctx>/`) : chemins de la convention, lus aussi par Anchorpost, laissés.
- Les dépôts de projet : reposer les bancs et les scripts est leur affaire.

## Comments

- 2026-11-14 — Instruit sur `1748f73` (plugin 7.4.0). Fait 1 reproduit dans une copie jetable posée à la main (mêmes premières erreurs que celles du conducteur du projet), remède des § 1-2 joué dans la copie et dans l'arbre du plugin (42 sur 42). Fait 2 reproduit (spec sous `docs/infrastructure/all/`, `## Spec — introuvable`, sortie 0) ; correction du § 5 jouée dans la copie, les 8 tests existants restent verts. Le défaut de `garde-commandes.mjs:51` est lu, non joué.
- 2026-11-14 — Relu par un agent neuf : « prêt après corrections mineures », reproduction refaite à l'identique, remèdes rejoués (`fusionner` 35 sur 35, `chemins-sensibles` 7 sur 7, à plat comme dans le plugin ; test de `garde-commandes` rouge puis vert). Décisions de l'architecte : bancs de `revue-adversariale` posés, `fusionner.test.mjs` sous les hooks du projet, convention de rangement inchangée, version mineure. Base mise à `0361598` (plugin 7.4.1, ticket 23 livré par la PR 83). Repli de `fusionner.test.mjs` avec message d'une ligne et garde `scripts/poses.test.mjs` rejoués sur une copie de `0361598` : garde rouge (171 tests, 7 échecs) puis vert (52 s) ; `fusionner` 35 sur 35 dans le plugin, 29 réussis et 6 échecs « fichier manquant » posé sans `commitlint.config.mjs`.
