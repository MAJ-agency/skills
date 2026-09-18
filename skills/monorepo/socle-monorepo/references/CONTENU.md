# Ce que contient la racine, et pourquoi

Inventaire des gabarits du socle monorepo, avec la raison d'être de chacun. À lire quand une règle du socle paraît arbitraire. Ce que contient chaque **service** est décrit dans le `CONTENU.md` de son skill.

## Méthode — `methode/`

Cinq documents qui font autorité sur la façon de travailler.

| Fichier              | Ce qu'il porte                                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `grilling.md`        | L'arbre de décision et sa **frontière** ; le déroulé par tours, chaque question accompagnée d'une recommandation ; « les faits sont ton travail, les décisions sont celles de l'humain » ; le cycle `candidate → validée` qu'aucune machine ne franchit ; le re-grilling daté d'une décision. |
| `decisions.md`       | Les **trois critères** pour écrire une ADR (difficile à défaire, surprenante, vrai arbitrage) ; le format MADR ; les règles de tenue du glossaire ; le registre de règles métier ; la documentation vivante en trois couches ; comment écrire pour un agent. |
| `nomenclature.md`    | `<TRI>-<NNNN>-<slug>.md`, le registre des trigrammes, la procédure d'en créer un, et les quatre thèmes de `docs/`.                  |
| `conception.md`      | Le vocabulaire des **modules profonds** (module, interface, profondeur, couture, adapter, levier, localité) ; la boucle TDD et ses anti-patterns ; la revue sur deux axes. |
| `pare-feu-ci.md`     | « Aucun invariant critique ne dépend d'un relecteur » ; l'activation d'un gate **au sprint où apparaît la surface qu'il protège** ; le catalogue des gates, dont les deux branches du gate d'isolation. |

## Configuration — `racine/` et `husky/`

- **`package.json`** — les scripts orchestrés par Turborepo (`build`, `lint`, `typecheck`, `test`, `check:cycles`, `check:gates`) et `pnpm check` qui les enchaîne ; commitlint et lint-staged. `check:gates` est le point d'accroche des gates propres à chaque brique (frontières d'architecture, dérive de contrat, cliquet de dette) : une brique qui en a expose un script `check:gates`, la racine n'a pas à le connaître. Aucune dépendance de service : chaque service porte les siennes.
- **`turbo.json`** — chaque tâche dépend de `^build` : sans ça, `typecheck` ment sur les paquets partagés non construits.
- **`eslint.config.mjs`** — les règles communes, et **le chargement des règles de chaque brique** depuis `packages/<paquet>/eslint.rules.mjs` et `apps/<service>/eslint.rules.mjs`. La racine ne connaît aucune stack. **Un seul bloc `no-restricted-imports` par groupe de fichiers** : en flat config, deux blocs qui matchent le même fichier ne fusionnent pas leurs options, le dernier écrase le premier. C'est un piège coûteux, d'où un bloc par couche, dans le fichier du service.
- **`tsconfig.base.json`** — strict, `noUncheckedIndexedAccess`, `noImplicitOverride`. Chaque brique l'étend.
- **`README.md` et `CLAUDE.md`** — génériques, avec des **zones d'insertion** `<!-- socle:… -->` où chaque service dépose ses lignes. Les marqueurs restent : ils permettent d'ajouter un service après coup.
- **`CONTEXT.md`** — le glossaire, **vide et c'est voulu**.
- **`.env.example` et `.prettierignore`** — un en-tête générique ; chaque service ajoute son bloc en fin de fichier.
- **`gitignore`** — stocké sans point pour ne pas s'appliquer au dépôt du skill ; ignore `graphify-out/` (graphe local, reconstruit en continu) et `.husky/*.local` (gardes de la machine).
- **Husky** — `commit-msg` (commitlint), `pre-commit` (lint-staged + point d'extension local `.husky/pre-commit.local`, non versionné), `pre-push` (`pnpm check`), et les **relais** `post-commit` / `post-checkout` vers graphify, indispensables parce que Husky détourne `core.hooksPath`.

## ADR — `adr/`

- **`ARC-0001`** — la nomenclature `<TRI>-<NNNN>-<slug>.md`, avec ses alternatives écartées. Transverse, donc à la racine du socle.

## Skills Matt Pocock — `agents/`

Les trois fichiers de configuration (`issue-tracker.md`, `triage-labels.md`, `domain.md`) tels que `setup-matt-pocock-skills` les produirait, **déjà corrigés** : tracker sous `docs/features/`, ADR citées `ARC-0001`, règles d'écriture déléguées à `methode/`. À copier seulement si la skill amont ne peut pas tourner.

## Sources — `sources/README.md`

« Une source n'est pas une spécification. » Le dossier des entrées brutes, exclu de la nomenclature.

## Tickets — `tickets/`

Ce que la racine a délibérément laissé ouvert, en six tickets : `01` modéliser le domaine (bloquant : presque tout en dépend), `02` hébergement, `03` client et forme de l'authentification (**tranché d'office si un client est installé**), `07` pare-feu CI, `08` observabilité, `09` registre des règles métier. Les numéros `04`–`06` sont réservés à l'API, `10`–`12` au web, `13`–`15` au mobile, `16` et suivants aux services à venir.

Les adapter au projet réel. Un ticket qui pose une question déjà tranchée est du bruit.
