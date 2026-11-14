# Le plugin sans chemins écrits en dur ni noms de projet : migrations Prisma, chemins sensibles, prompt de revue, recette, version mineure

Status: Fait — PR #79
Type: task
Modèle: sonnet — les textes à écrire sont donnés mot pour mot ; les scripts et leurs bancs sont spécifiés par leur comportement, cas par cas.
Blocked by: —
Label: contre-revue
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/migrations-ordre.mjs`, `skills/chaine/fusionner/scripts/migrations-ordre.test.mjs`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs`, `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs`, `skills/chaine/tickets/references/gabarits/carte.map.md`, `skills/chaine/tickets/references/CONTENU.md`, `skills/chaine/revue-adversariale/SKILL.md`, `skills/chaine/revue-adversariale/references/prompt.md`, `skills/chaine/revue-adversariale/references/CONTENU.md`, `skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs` (créé), `skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs` (créé), `skills/chaine/revue-de-ticket/SKILL.md`, `skills/chaine/socle-chaine-de-production/SKILL.md`, `skills/chaine/recette-humaine/SKILL.md`, `skills/chaine/recette-humaine/references/methode.md`, `skills/chaine/recette-humaine/references/CONTENU.md`, `README.md`, `.claude-plugin/plugin.json`

## Le besoin

Le plugin est installé tel quel par des projets qu'il ne modifie pas, et aucun projet ne le modifie. Plusieurs skills supposent pourtant la disposition d'un seul projet : les ADR sous `docs/adr/`, les migrations Kysely `<AAAAMMJJHHMM>-<slug>.ts`, les parcours sous `tests/`, les contrats sous `packages/contracts`. Des scripts portent aussi les noms d'un autre projet et de ses clients (noms de registres, une décision `ALL-INF-13`, une branche d'exemple).

Le cas qui l'a révélé est un projet Prisma et Jest (fedora) qui passe à la chaîne du plugin (analyse de ses skills contre le plugin 6.0.0, 2026-11-14, non publiée). Sa disposition diffère sur chacun de ces points : migrations `apps/api/prisma/migrations/<AAAAMMJJHHMMSS>_<slug>/migration.sql`, ADR sous `docs/architecture/adr/`, parcours sous `e2e/`, règle de lint `jest/no-disabled-tests`, aucun `packages/contracts`. Avec le plugin d'aujourd'hui, le contrôle d'ordre des migrations n'y contrôle rien, sans le dire ; le gate refuse ses réservations de migration ; le sous-agent de revue cherche les ADR là où il n'y en a pas ; la recette fait écrire un test sauté que le lint refuse, dans un dossier qui n'existe pas. Un défaut touche tous les projets : l'étape 2 de la revue lit `cheminsSensibles` comme des expressions régulières, alors que le gate `tickets` les lit comme des motifs de chemin ; les motifs à `**/` au milieu (`apps/api/src/**/auth/**`, en usage dans deux projets) ne trouvent rien sous un sous-dossier.

Quand le ticket est fait, un projet Prisma a son ordre de migrations contrôlé et ses réservations acceptées par le gate ; la revue lit les chemins sensibles comme le gate et trouve les ADR où qu'ils soient rangés ; la recette renvoie aux emplacements et à la directive de test sauté du projet ; aucun script du plugin ne porte plus de nom de projet ; aucune clé de `.claude/chaine.json` n'est ajoutée ni modifiée ; le plugin est à la mineure suivante. Les deux défauts de `diff-revue.sh` relevés par la même analyse sont au ticket 22.

## Où

Base : `origin/main` à `c9a6055` (#77, plugin **7.2.0**), qui contient le ticket 16 (PR 75), la PR 76 et le ticket 18 (PR 77). Toutes les lignes ci-dessous sont relues sur `c9a6055` le 2026-11-14 ; `pnpm test` y donne **391 tests**, tous verts. Si `main` a bougé au lancement, la session retrouve chaque ligne par son texte et l'écrit sous `## Comments` de sa PR.

### Les constats relevés en 6.0.0, revérifiés

| Constat (6.0.0) | Sur `c9a6055` | Ce ticket |
| --- | --- | --- |
| `docs/adr/` écrit en dur dans le prompt de revue | confirmé : `skills/chaine/revue-adversariale/references/prompt.md:3` « les ADR de docs/adr/ » | § 4 |
| `tests/` et `packages/contracts` écrits en dur dans `recette-humaine` | confirmé : `recette-humaine/SKILL.md:30` et `:58` (`packages/contracts`), `:54` (`tests/recette-<sujet>.spec.ts`), `references/methode.md:81` et `:96` (`tests/`), `:82` (`apps/api`), `references/CONTENU.md:5` (`packages/contracts`) ; **en plus**, `SKILL.md:56` donne la forme `// skip: <TICKET> — <raison>`, qui contredit la fiche que le socle pose lui-même (`skills/monorepo/socle-monorepo/references/racine/.claude/rules/tests.md:36` : `// eslint-disable-next-line vitest/no-disabled-tests -- skip: <TICKET> <raison>`, la directive que le lint exige ; même texte dans `skills/monorepo/socle-tests/references/scripts/verify/tests-creux.mjs:172`) | § 6 |
| `cheminsSensibles` lu en regex par `revue-adversariale/SKILL.md` ~41, en motifs par le gate | confirmé : `SKILL.md:41` passe `"^" + c` à `grep -E` ; le gate lit des motifs (`skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:256-267`, `regexDuMotif` : `**/` dossiers facultatifs, `**` tout, `*` un segment, `/` final un dossier ; appliqué par `motifSensibleTouche`, `:391`). Rejoué le 2026-11-14 : `grep -E '^apps/api/src/**/auth/**'` ne trouve pas `apps/api/src/infrastructure/http/auth/guard.ts`, `'^src/paiement/*webhook*'` ne trouve pas `src/paiement/stripe-webhook.ts`, `'^scripts/docs/identifiants.mjs'` trouve `scripts/docs/identifiantsXmjs` | § 3 |
| `migrations-ordre.mjs` ~20 ignore Prisma | confirmé : `skills/chaine/fusionner/scripts/migrations-ordre.mjs:20` `const FORME = /^(\d{12})-.+\.ts$/;` (en-tête `:10-12`, message `:67` qui retire `^\d{12}-`) ; un dossier Prisma est ignoré sans un mot. **En plus** : le gate refuse une réservation Prisma dans une carte, `tickets-regles.mjs:594` (`formeMigrations` : `/^\d{12}$/`), message `:583` | § 1, § 2 |
| noms de projet dans `passer.sh` (~15, ~237) | confirmé, lignes déplacées : `skills/chaine/fusionner/scripts/passer.sh:15` « Régénère les index (ADR, registre config, manifestes, règles) », `:261` « (« E2E Web par fédération ») » | § 7 |
| noms de projet dans `sujet.sh` (~15, ~605, ~625) | confirmé, lignes déplacées : `skills/chaine/sujet/scripts/sujet.sh:14-15` « (A-8 de ALL-INF-13) », `:649` et `:669` « `chore/ffsb-vivante-stats` → `chore/ffsb-vivante-*` » | § 7 |
| `diff-revue.sh:15` (fetch en échec ignoré) et `:24-29` (diff vide accepté), les deux correctifs « à remonter » | confirmés | **ticket 22** |

Aucun constat n'est abandonné : tous tiennent sur `c9a6055` ; seuls les numéros de ligne de `passer.sh` et `sujet.sh` ont bougé (ticket 16).

### Le reste du relevé, classé

Commandes : `git grep -n -i -E "fedora|iroki|ffsb|ALL-INF|fédération|federation|registre config" origin/main -- skills/`, puis `git grep -n -e "packages/contracts" -e "apps/api" -e "apps/web" -e "apps/mobile" -e "docs/adr" -e "tests/" origin/main -- skills/chaine/`.

| Où | Classement |
| --- | --- |
| `revue-adversariale/references/prompt.md:33` « Critères non concernés : S… P… » : impose les préfixes du socle aux critères du projet | à rendre générique (§ 4) |
| `anchorpost/SKILL.md:55`, `:69` ; `tickets/references/agents/issue-tracker.md:9` ; `socle-monorepo/references/methode/nomenclature.md:41,49,55,165`, `decisions.md:92`, `adr/ADR_ALL_ARC-1-…md:11` ; `socle-chaine-de-production/references/agent/regles.test.mjs:16`, `fusionner/scripts/revue-exigee.test.mjs:14`, `revue-de-ticket/scripts/contexte-ticket.test.mjs:117`, `tickets/references/scripts/verify/tickets.test.mjs:38` ; les identifiants `FNSMR`, `FFSA` des bancs et des tables ; `recette-humaine/references/methode.md:95` | légitime : exemples de la convention |
| `revue-adversariale/references/prompt.md:2-3` (`apps/*/CLAUDE.md`, `packages/CLAUDE.md`) | légitime : des fichiers que le sous-agent lit s'ils existent |
| les mentions d'Anchorpost hors du skill `anchorpost` (`criteres-socle.md:63-89`, `criteres-ticket.md:29,33`, `pieges.md:21` ; l'index `anchorpost/anchorpost.json` lu par `socle-tests`) | légitime : journal de cas vécus, et le produit Anchorpost |
| numéros de PR d'un autre dépôt : `passer.sh:13`, `:77`, `:83`, `:254-255` ; `fusionner/scripts/file.sh:62` ; `fusionner/scripts/github.sh:126` ; `fusionner/scripts/revue-exigee.mjs:9` ; `sujet.sh:29` | légitime (journal) : aucun nom de projet, rien de faux ; laissés |
| `revue-adversariale/SKILL.md:36` et `diff-revue.sh:6,28` : zones `apps/api, apps/web, apps/mobile, packages + scripts` | légitime : exemple de découpage ; `<zone>` est libre |
| `revue-adversariale/references/criteres-socle.md` (S1-S21 : `apps/api/CLAUDE.md`, `packages/contracts`) | légitime : critères du socle, que le projet garde, retire ou remplace (`SKILL.md:16-18`) |
| `revue-de-ticket/references/criteres-documentation.md:3` « les ADR (`docs/adr/` ou `docs/architecture/adr/`) » | légitime : liste de rôles qui couvre les deux dispositions connues |
| `socle-chaine-de-production/SKILL.md:23,25` ; `references/chaine.json` (`migrations`) ; `references/agent/regles.mjs:50` (défaut `apps/api/src/db/migrations/`) | légitime : recommandations à la pose et valeur par défaut d'une clé existante |
| `fusionner/scripts/revue-exigee.mjs:18` `CHEMINS_CODE = /^(apps\|packages\|scripts)\//` | légitime : disposition du monorepo du socle ; à paramétrer le jour où un projet hors monorepo arrive, hors périmètre |
| `sujet/scripts/depot-jouet.mjs:41-47,122-125` (`docs/adr/` du jouet) ; `tickets/references/gabarits/regle.md:20` ; `tickets/references/agents/issue-tracker.md:16` | légitime : dépôt jouet des bancs, gabarits posés que le projet adapte |
| `fusionner/scripts/github.sh:14` : phrase de commentaire coupée (suite à la ligne 41) | sans rapport avec un projet ; hors périmètre |

### 1. `skills/chaine/fusionner/scripts/migrations-ordre.mjs` (100 lignes)

- Deux formes reconnues, dans le dossier de la clé `migrations` (inchangée) : Kysely, un fichier `^(\d{12})-.+\.ts$` (la forme d'aujourd'hui) ; Prisma, un dossier `^(\d{14})_[^/]+$` (ce que `git ls-tree --name-only <ref> <dossier>/`, `:72-76`, rend pour `apps/api/prisma/migrations/20260906120000_slug/`). Tout autre nom est ignoré comme aujourd'hui (`migration_lock.toml` de Prisma, un `README`).
- `horodatage(nom)` rend les chiffres tels qu'écrits (12 ou 14), sinon `null`.
- `plus10Minutes(h)` garde la longueur reçue : 12 chiffres `AAAAMMJJHHMM`, 14 chiffres `AAAAMMJJHHMMSS` (secondes conservées). Les cas à 12 chiffres de `migrations-ordre.test.mjs:22-26` ne changent pas.
- `controlerOrdre`, l'algorithme exact :
  - `norm(h)` = `h.padEnd(14, "0")` ; `pris` (l'ensemble), `dernier` et `plancher` sont tenus **en 14 chiffres** ;
  - pour une migration ajoutée de longueur `L` (12 ou 14) refusée : `propose14 = plus10Minutes(plancher)`, répété tant que `pris.has(propose14)` ; `pris.add(propose14)` ; `plancher = propose14` ; `propose = propose14.slice(0, L)` ;
  - `refus.dernier` est rendu **tel qu'écrit** : les chiffres du nom de la dernière migration de la base, pas sa forme normalisée ;
  - ainsi `migrations-ordre.test.mjs:35-47` (12 chiffres : propositions `202612011010` puis `202612011020`) reste vert sans retouche.
- `message` remplace les chiffres de tête en gardant le séparateur : `renommer en 202612011010-c.ts` (inchangé) ou `renommer en 20261201101000_c`. La parenthèse reste « (git mv, et corriger la réservation dans la carte) ».
- L'en-tête (`:10-12`) et le commentaire de `horodatage` (`:22`) nomment les deux formes.

### 2. Les réservations — `tickets-regles.mjs`, gabarit de carte, `tickets/references/CONTENU.md`

- `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs:594` `formeMigrations` : chaque horodatage fait 12 **ou** 14 chiffres (`/^\d{12}(\d{2})?$/`). `migrationsReservees` (`:597`) et `reservationsEnDouble` ne changent pas : les réservations se comparent comme écrites (un projet n'a qu'une forme).
- `:583`, le message : « attendu des horodatages de 12 chiffres (AAAAMMJJHHMM) ou de 14 (AAAAMMJJHHMMSS, Prisma) séparés par des virgules, ou « — » ». Le banc `tickets.test.mjs:190` cherche `/Migrations.*12 chiffres/` : il reste vert sans retouche.
- `skills/chaine/tickets/references/gabarits/carte.map.md:15` : « (AAAAMMJJHHMM, AAAAMMJJHHMM ; AAAAMMJJHHMMSS pour des migrations Prisma) ».
- `skills/chaine/tickets/references/CONTENU.md:29` : « ligne `Migrations:` bien formée si présente » devient « ligne `Migrations:` bien formée si présente, horodatages de 12 ou 14 chiffres ».

### 3. Les chemins sensibles — `chemins-sensibles.mjs` (créé), ce qui le pose et ce qui l'appelle

- `skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs`, script autonome, sans import :
  - lit `.claude/chaine.json` du dossier courant, `cheminsSensibles` ; reçoit les chemins sur l'entrée standard, un par ligne ;
  - écrit `chemin<TAB>motif` pour chaque chemin qui touche un motif, rien sinon ; sortie 0 dans ces deux cas, et sans `.claude/chaine.json` (aucun motif, comme le gate : `tickets-regles.mjs:274-288`) ;
  - sortie 2 si le contrat est illisible ou si `cheminsSensibles` n'est pas une liste de chaînes, motif sur la sortie d'erreur : un contrôle de sécurité échoue fermé, comme le gate ;
  - le moteur est **celui du gate, recopié à l'identique** (`tickets-regles.mjs:256-267`, avec son commentaire et un renvoi à ce fichier), gardé par un banc de parité (Décisions).
- `revue-adversariale/SKILL.md:41`, la commande devient :

  ```bash
  git -c core.quotepath=false diff --name-only --no-renames <base>...HEAD | node scripts/chaine/chemins-sensibles.mjs
  ```

  (`core.quotepath=false` : un chemin accentué sort tel quel, pas entre guillemets en octal ; `--no-renames` : un fichier déplacé hors d'un dossier sensible garde son ancien chemin dans la liste.)
- `revue-adversariale/SKILL.md:44`, ajouter après la première phrase : « Les motifs se lisent comme le gate `tickets` (`**` tout, `*` un segment, `/` final un dossier). Sortie 2 : la revue s'arrête, le contrat se corrige. Script absent (projet posé avant cette version) : la revue s'arrête et le pose d'abord (étape 0), sans revenir à l'ancienne commande. »
- `revue-adversariale/SKILL.md:13-16`, l'étape 0 : une ligne de tableau de plus, `scripts/chemins-sensibles.mjs` → `scripts/chaine/chemins-sensibles.mjs`.
- `skills/chaine/socle-chaine-de-production/SKILL.md:32` : « (`scripts/chaine/diff-revue.sh`, le fichier de critères) » devient « (`scripts/chaine/diff-revue.sh` et `chemins-sensibles.mjs`, le fichier de critères) ».
- `skills/chaine/revue-de-ticket/SKILL.md:15` : « (`scripts/chaine/diff-revue.sh`, fichier de critères) » devient « (`scripts/chaine/diff-revue.sh` et `chemins-sensibles.mjs`, fichier de critères) ». `:30` (« Chemins sensibles : comme la revue adversariale (étape 2 de son SKILL) ») ne change pas.
- `README.md:155` : `scripts/         diff-revue.sh` devient `scripts/         diff-revue.sh, chemins-sensibles.mjs`.

### 4. Le prompt de revue — `skills/chaine/revue-adversariale/references/prompt.md` (41 lignes)

Garder la ligne 1 ; les lignes 2 à 5 deviennent exactement (la ligne 2 garde son début, « session qui l'a écrit. ») :

```text
session qui l'a écrit. Tu travailles en lecture seule : tu peux lire CLAUDE.md, les règles de
apps/*/CLAUDE.md, packages/CLAUDE.md et .claude/rules/*.md, les ADR du dépôt (fichiers ADR_*.md
sous docs/, où qu'ils soient rangés) et les fichiers entiers touchés par le diff pour vérifier un
point ; tu ne modifies rien, tu ne lances aucune commande qui écrit.
```

La ligne 33 devient exactement :

```text
- puis une dernière ligne : « Critères non concernés : » suivi des identifiants des critères de la liste que le diff ne touche pas.
```

`revue-adversariale/SKILL.md:50` ne change pas (`{{PROJET}}`, `<critères>`, `<diff>` restent les seuls remplacements).

### 5. Ce qui est au ticket 22

`diff-revue.sh`, son banc, `revue-adversariale/SKILL.md:34`, la section `scripts/diff-revue.sh` de `revue-adversariale/references/CONTENU.md` et `revue-de-ticket/SKILL.md:26-30`. Fichiers partagés avec lui, lignes disjointes : `revue-adversariale/SKILL.md` (ce ticket : lignes 13-16, 41, 44 ; le 22 : ligne 34), `revue-adversariale/references/CONTENU.md` (ce ticket : une section nouvelle ; le 22 : la section `scripts/diff-revue.sh`), `revue-de-ticket/SKILL.md` (ce ticket : ligne 15 ; le 22 : lignes 26-30), `.claude-plugin/plugin.json`. Le 22 part après la fusion de celui-ci.

### 6. La recette — `skills/chaine/recette-humaine/`

- `SKILL.md:30` : « (le catalogue de rôles de `packages/contracts`) » devient « (le catalogue de rôles du projet, que nomment les règles du chemin ; `packages/contracts` dans le socle) ».
- `SKILL.md:54`, la ligne entière devient : « - Emplacements de `.claude/rules/tests.md`. Nom : `recette.<sujet>.db.spec.ts` ou `recette.<sujet>.spec.ts` à côté du code, `recette-<sujet>.spec.ts` dans le dossier des parcours de `.claude/rules/tests.md` pour un parcours. En tête de fichier : le numéro de test de l'inventaire, la famille, l'invariant. »
- `SKILL.md:56`, la ligne entière devient : « - **Rouge = `it.skip` avec ticket**, dans la directive de test désactivé que `.claude/rules/tests.md` exige, sur la ligne au-dessus (dans le socle : `// eslint-disable-next-line vitest/no-disabled-tests -- skip: <TICKET> <raison>`) ; `it.skip.each` pour une table. Le correctif retire le `skip` sans changer l'attendu. Un ticket `Fait` dont le `skip` est encore là est une dette à retirer dans la PR du correctif. »
- `SKILL.md:58` : « (`packages/contracts`) » devient « (le paquet de contrats partagés du projet ; `packages/contracts` dans le socle) ».
- `references/methode.md:81`, colonne « Où » : « `recette-<sujet>.spec.ts` dans le dossier des parcours de `.claude/rules/tests.md` » ; `:82` : « `recette.<sujet>.spec.ts` dans `apps/api`, ou là où les règles du chemin rangent un test transverse » ; `:96` : `e2e/recette-licence.spec.ts`, le dossier des parcours du socle web (`skills/frontend/socle-web-next/references/tickets/12-parcours-de-bout-en-bout.issue.md:13`).
- `references/CONTENU.md:5` : « le catalogue de rôles et les schémas de `packages/contracts` » devient « le catalogue de rôles et les schémas partagés (`packages/contracts` dans le socle) ».

### 7. Les noms de projet — `passer.sh` et `sujet.sh` (commentaires seuls)

- `passer.sh:15` : « #   3. Régénère les index générés (`scripts/docs/index-generes.json`) et passe leurs » ; `:16` inchangée.
- `passer.sh:261` : « # créés, et un check de synthèse (qui attend toute une matrice) n'apparaît qu'en fin de matrice. »
- `sujet.sh:14-15` : « crée sujet/<nom> depuis develop, sans protection de branche ; » puis « `--specs` recible sur le sujet la PR de specs du lot » (alignement de l'en-tête gardé).
- `sujet.sh:649` : `chore/tableau-bord-stats` → `chore/tableau-bord-*` ; `:669` : `(chore/tableau-bord-*)`.

### 8. Les fiches `CONTENU.md`

- `skills/chaine/fusionner/references/CONTENU.md:41` : « seuls les fichiers `<AAAAMMJJHHMM>-<slug>.ts` (Kysely) et les dossiers `<AAAAMMJJHHMMSS>_<slug>` (Prisma) comptent » ; `:45`, la phrase de `migrations-ordre.test.mjs` cite la forme Prisma.
- `skills/chaine/revue-adversariale/references/CONTENU.md` : une section `scripts/chemins-sensibles.mjs` (le moteur du gate, pourquoi recopié, le banc de parité, le banc qui reste dans le plugin), insérée après la section `scripts/diff-revue.sh`, que ce ticket ne touche pas.

### 9. La version — `.claude-plugin/plugin.json:3`

La mineure qui suit la version de `origin/main` à l'ouverture de la PR (`git show origin/main:.claude-plugin/plugin.json`) : 7.2.0 aujourd'hui donne **7.3.0**. Critère du `README.md:179` : « Patch pour une correction, mineure pour un skill ou un gabarit ajouté, majeure quand un skill existant change de contrat ». Ce ticket ajoute un script à poser (`chemins-sensibles.mjs`, au même titre qu'un gabarit) : mineure. Aucune clé de `.claude/chaine.json` n'est ajoutée ni rendue obligatoire : pas de majeure. Le ticket 22 prend la version suivante.

## Décisions

1. **Aucune clé nouvelle dans `.claude/chaine.json`.** Les ADR se trouvent par leur identifiant (`docs/**/ADR_*.md`), comme le fait déjà `revue-de-ticket/scripts/contexte-ticket.mjs:21` ; une clé `adr` aurait été un contrat de plus pour un seul lecteur. Les migrations Prisma se reconnaissent à leur forme, dans le dossier de la clé `migrations` existante (que `socle-chaine-de-production/SKILL.md:25` recommande déjà à `apps/api/prisma/migrations/` pour un projet Prisma, et que `regles.mjs` sait déjà protéger : `regles.test.mjs:12`). Les chemins sensibles gardent leur clé ; seul leur lecteur change.
2. **Le moteur des motifs est recopié, pas importé.** `chemins-sensibles.mjs` est posé dans `scripts/chaine/` ; importer `scripts/verify/tickets-regles.mjs` le lierait à la version du gate posée dans le projet (un projet posé avant ce gate n'a pas `motifSensibleTouche`) et, dans le plugin, à l'assemblage du dépôt jouet de `tickets` (`tickets/references/scripts/docs/depot-jouet.mjs:24-36`). La recopie est gardée par un banc de parité.
3. **Script absent : l'étape 2 s'arrête**, elle ne revient pas à l'ancien `grep -E`. Raison : cette commande ne voit pas les motifs à `**/` au milieu, et une étape de sécurité qui trouve moins sans le montrer est pire qu'une étape qui s'arrête et dit « poser `chemins-sensibles.mjs` » (une copie de fichier).
4. **Le banc `chemins-sensibles.test.mjs` reste dans le plugin** : l'étape 0 ne le pose pas, parce que le test de parité lit le gate par le chemin du plugin. À l'inverse, les trois tests Prisma de `migrations-ordre.test.mjs` et celui de `tickets.test.mjs` partent dans les projets à la prochaine pose (`fusionner/SKILL.md:14` et `tickets/SKILL.md` posent leurs bancs) : c'est voulu, ils ne dépendent que du dépôt jouet déjà posé.
5. **Ce qu'un projet garde, et ce qu'il doit faire.** Aucune clé de `.claude/chaine.json` n'est ajoutée ni modifiée. Un projet repose `scripts/chaine/` (et `scripts/verify/tickets-regles.mjs`) pour bénéficier des corrections ; sans reposer, son comportement actuel est conservé, sauf l'étape 2 de la revue, qui s'arrête et dit de poser le script (décision 3). Les bancs existants verts sans retouche ne prouvent que la non-régression des tests.
6. **L'étape 2 corrigée trouve davantage, chez tous les projets** qui ont des motifs à `**/` au milieu : une revue y lancera `/security-review` là où elle ne le faisait pas. C'est la correction voulue (le gate exige déjà `Label: contre-revue` sur ces chemins) ; l'architecte le dit aux architectes des projets à la sortie de la version.
7. **Formes de migration mêlées** : comparées sur 14 chiffres, sans refus ni avertissement ; un projet n'en a qu'une, le cas ne vaut pas une règle.
8. **La recette renvoie au projet, avec la valeur du socle entre parenthèses** : la forme `// skip: …` d'aujourd'hui casse le lint de tout projet du socle (`vitest/no-disabled-tests`) comme d'un projet sous Jest (`jest/no-disabled-tests`) ; la directive exacte est celle de `.claude/rules/tests.md`, que chaque projet tient.
9. **« Critères non concernés »** ne nomme plus de préfixe : un projet qui numérote ses critères `C1`…`C15` les garde.
10. Ni `--no-verify`, ni test retiré ou assoupli ; aucune dépendance ; `package.json` ne change pas (ses globs couvrent `skills/*/*/scripts/*.test.mjs`).

## Surfaces

Bancs à écrire **d'abord**, et à voir rouges sur `origin/main` avant tout autre changement :

| Surface | Preuve |
| --- | --- |
| migrations Prisma | `skills/chaine/fusionner/scripts/migrations-ordre.test.mjs`, trois tests nouveaux : « horodatage et plus10Minutes : la forme Prisma à 14 chiffres » (`horodatage("20260906120000_pass")` rend `"20260906120000"`, `horodatage("migration_lock.toml")` rend `null`, `plus10Minutes("20261231235500")` rend `"20270101000500"`) ; « controlerOrdre : une migration Prisma antérieure est refusée, proposée dans sa forme » (base `["20261201100000_b"]`, ajoutée `20261128100000_c` : `propose` `"20261201101000"`, `dernier` `"20261201100000"`, `message` contient `renommer en 20261201101000_c`) ; « CLI : un dossier Prisma plus ancien que develop sort en 1 » (`depotJouet()`, `.claude/chaine.json` `{"migrations":"apps/api/prisma/migrations/"}`, `20261201100000_livree/migration.sql` et `migration_lock.toml` sur develop, une branche qui ajoute `20261128100000_nouvelle/migration.sql` : sortie 1 et `20261201101000_nouvelle` ; un ajout postérieur : sortie 0). Rouges sur `origin/main` : `horodatage` rend `null`, la CLI sort 0 |
| réservation Prisma dans une carte | `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs`, un test nouveau après celui de la ligne 188 : « Migrations: accepte 12 ou 14 chiffres, rien d'autre » (`20261127100000` sans erreur et réservé ; `2026112710` refusé, message `/12 chiffres.*14/`). Rouge sur `origin/main` |
| chemins sensibles | `skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs` (créé), cinq tests : (1) la table : `apps/api/src/**/auth/**` touche `apps/api/src/auth/guard.ts` et `apps/api/src/infrastructure/http/auth/guard.ts`, pas `apps/api/src/authz/x.ts` ; `src/paiement/*webhook*` touche `src/paiement/stripe-webhook.ts`, pas `src/paiement/sous/webhook.ts` ; `scripts/docs/identifiants.mjs` se touche lui-même, pas `scripts/docs/identifiantsXmjs` ; `apps/web/src/lib/auth/` touche `apps/web/src/lib/auth/session.ts` ; `.claude/**` touche `.claude/settings.json`, pas `x.claude/a` ; (2) parité : sur la même table, même verdict que `motifSensibleTouche`, chargé par la fonction `module` de `../../tickets/references/scripts/docs/depot-jouet.mjs`, importée sous un autre nom (`import { module as chargerModule } from …`, puis `chargerModule('verify/tickets-regles.mjs')`) ; (3) CLI dans un dossier temporaire : chemins sur l'entrée, `chemin<TAB>motif` des seuls touchés, sortie 0 ; sans `.claude/chaine.json`, sortie vide et 0 ; (4) contrat illisible, puis `cheminsSensibles` qui n'est pas une liste : sortie 2, motif sur la sortie d'erreur ; (5) la commande exacte de l'étape 2, jouée dans un dépôt git temporaire (`git init`, sans `GIT_*` hérités) avec `cheminsSensibles` `["src/paiement/"]` : un commit qui déplace `src/paiement/stripe-webhook.ts` vers `src/divers/ancien.ts` et ajoute `src/paiement/réglé.ts` ; la sortie nomme `src/paiement/stripe-webhook.ts` et `src/paiement/réglé.ts`, accent écrit tel quel. Rouges : le script n'existe pas |
| l'étape 2, ce qui la pose, le prompt | `git grep -n "grep -E -f" -- skills/chaine/revue-adversariale` ne rend rien ; `git grep -n "chemins-sensibles.mjs" -- skills/chaine/revue-adversariale/SKILL.md skills/chaine/socle-chaine-de-production/SKILL.md skills/chaine/revue-de-ticket/SKILL.md README.md` rend l'étape 0 et l'étape 2 de la revue, `socle-chaine-de-production/SKILL.md:32`, `revue-de-ticket/SKILL.md:15` et `README.md:155` ; `git grep -n "docs/adr" -- skills/chaine/revue-adversariale` ne rend rien ; `git grep -n "S… P…" -- skills/chaine/revue-adversariale` ne rend rien |
| la recette | `git grep -n -e "tests/recette" -e "// skip:" -- skills/chaine/recette-humaine` ne rend rien ; `git grep -n "packages/contracts" -- skills/chaine/recette-humaine` ne rend que les trois parenthèses « dans le socle » (`SKILL.md:30`, `:58`, `CONTENU.md:5`) ; `git grep -n "rules/tests.md" -- skills/chaine/recette-humaine/SKILL.md` rend les lignes 54 et 56 |
| aucun nom de projet dans les scripts | la commande sous ce tableau ne rend rien |
| le socle et le contrat | `git diff origin/main --stat -- skills/chaine/socle-chaine-de-production` ne nomme que `SKILL.md`, et `git diff origin/main -- skills/chaine/socle-chaine-de-production/SKILL.md` ne change que la ligne 32 : ni `chaine.json` ni rien de `references/` du socle |
| les bancs existants | `git diff --numstat origin/main...HEAD -- skills/chaine/fusionner/scripts/migrations-ordre.test.mjs skills/chaine/tickets/references/scripts/verify/tickets.test.mjs` donne `0` en deuxième colonne pour les deux (aucune ligne retirée) ; aucun autre `*.test.mjs` existant n'apparaît dans `git diff --stat origin/main...HEAD` |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, à la mineure qui suit celle de `origin/main` |

La commande « aucun nom de projet » (les alternatives sont des `|` nus d'expression étendue) :

```bash
git grep -n -i -E "fedora|iroki|ffsb|ALL-INF|fédération|federation|registre config" -- 'skills/**/scripts/*' ':!*.test.mjs'
```

Sur `c9a6055` elle rend `passer.sh:15`, `:261`, `sujet.sh:15`, `:649`, `:669` ; après le ticket, rien.

## Vérification

- `pnpm test` vert. À `c9a6055` : **391 tests**. Ce ticket en ajoute 9 (3 dans `migrations-ordre.test.mjs`, 1 dans `tickets.test.mjs`, 5 dans `chemins-sensibles.test.mjs`) et n'en modifie aucun : **400** attendus, plus ceux qu'une PR fusionnée entre-temps aurait ajoutés. Aucun test désactivé ni retiré.
- Rouge d'abord : les trois bancs écrits et joués seuls sur `origin/main` (`node --test <fichier>`), échecs constatés et notés sous `## Comments` de la PR, puis le code.
- `bash -n` sur `passer.sh` et `sujet.sh` ; le garde-fou « aucun script du plugin ne saute un hook git » (`scripts/depot.test.mjs:255`) vert.
- Ce dépôt n'a pas de gate des tickets : ce ticket n'est contrôlé que par sa relecture et ses surfaces.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche de documentation du programme sans le modifier, ouvre sa PR hors brouillon **sans poser `à-fusionner`** (`Label: contre-revue` : l'architecte la contre-relit et la nomme au capitaine), et écrit à l'architecte dès sa PR livrée.

## Hors périmètre

- **`diff-revue.sh`** (fetch en échec ignoré, diff vide accepté) : ticket 22, après celui-ci.
- **Les dépôts de projet** : reposer `scripts/chaine/` (`migrations-ordre.mjs`, `chemins-sensibles.mjs`) et `scripts/verify/tickets-regles.mjs` est l'affaire de chaque projet. Pour un projet Prisma qui passe à la chaîne restent de son côté : `scripts/docs/index-generes.json` en entrées-objets (sans quoi `regenerer_index` ne régénère rien au passage), son fichier de critères, sa clé `migrations` à `apps/api/prisma/migrations/`, ses motifs `cheminsSensibles`, sa directive de test sauté dans `.claude/rules/tests.md`.
- **Un point d'extension pour un avertissement propre au projet** à `sujet.sh livrer` et `etat` : une demande d'évolution, à cadrer à part.
- **La lecture de l'ancienne grammaire dans le titre d'une PR** (`fusionner/scripts/file.sh`) : à vérifier sur les PR ouvertes du projet concerné avant son passage, pas ici.
- `fusionner/scripts/github.sh:14`, la phrase de commentaire coupée ; `revue-exigee.mjs:18`, les racines du code ; les numéros de PR des cas vécus (§ « Le reste du relevé »).
- **Les plafonds de session** et **le skill `architecte`** : aucune ligne touchée.
- Fichiers partagés avec d'autres tickets ouverts le 2026-11-14, sur d'autres lignes : `skills/chaine/fusionner/references/CONTENU.md` (ticket 20, `veille.sh`), `skills/chaine/socle-chaine-de-production/SKILL.md` (ticket 21), `.claude-plugin/plugin.json` (tous) ; la version se calcule sur `origin/main` à l'ouverture de la PR, quel que soit l'ordre.

## Comments

- 2026-11-14 — Écrit par un rédacteur (sous-agent) depuis `main` à `7eca328`, puis relevé de nouveau sur `c9a6055` (plugin 7.2.0, 391 tests) : aucun fichier du ticket n'a changé entre les deux, `README.md` excepté (ligne 155 relue). Tous les constats de l'analyse sur 6.0.0 tiennent ; s'y ajoutent la forme du test sauté de `recette-humaine/SKILL.md:56` (contraire au socle lui-même), la réservation Prisma refusée par le gate des cartes et les préfixes imposés par `prompt.md:33`.
- 2026-11-14 — Relu par un agent neuf : « prêt après corrections mineures ». Reportées : `diff-revue.sh` sorti au ticket 22 ; texte exact du prompt dans un bloc ; `README.md:155`, `socle-chaine-de-production/SKILL.md:32`, `revue-de-ticket/SKILL.md:15` et `tickets/references/CONTENU.md:29` ajoutés ; ce qu'un projet garde réécrit (décision 5) et l'arrêt de l'étape 2 sans script choisi (décision 3) ; commande sans `\|` hors tableau ; `--numstat` ; algorithme de `controlerOrdre` ; base `c9a6055` et `Blocked by: —` ; version justifiée par le critère du `README.md` ; commande de l'étape 2 avec `core.quotepath=false` et `--no-renames` et son cas au banc ; classements complétés. Vingt et un fichiers, dont deux créés ; six de code hors bancs (dont `plugin.json`).
