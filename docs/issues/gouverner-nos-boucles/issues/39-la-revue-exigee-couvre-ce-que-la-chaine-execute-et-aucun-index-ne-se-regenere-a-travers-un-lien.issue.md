# La revue exigée couvre ce que la chaîne exécute, ni la casse ni les guillemets ne la contournent, et le capitaine ne régénère jamais un index à travers un lien symbolique

Status: Fait — PR #94
Type: task
Label: contre-revue
Modèle: sonnet — deux patchs donnés mot pour mot (code, tests), quatorze remplacements de documentation et la version. Tout est joué sur une copie jetable de `origin/main` (voir « Vérification ») ; rien n'est à concevoir.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/revue-exigee.mjs`, `skills/chaine/fusionner/scripts/revue-exigee.test.mjs`, `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/scripts/fusionner.test.mjs`, `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs`, `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs`, `skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs`, `scripts/depot.test.mjs`, `skills/chaine/revue-adversariale/SKILL.md`, `skills/chaine/revue-adversariale/references/CONTENU.md`, `skills/chaine/revue-de-ticket/SKILL.md`, `skills/chaine/fusionner/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/admin.md`, `.claude-plugin/plugin.json`

## Le besoin

Relevé le 2026-11-14 par les deux relecteurs adversaires du ticket 36, et laissé hors de son périmètre (ticket 36, « Hors périmètre » et « Comments »). Rejoué ici sur `main` : chaque point est reproduit (« Reproduit », plus bas).

1. **La revue exigée ne voit pas ce qui pilote la chaîne.** `revue-exigee.mjs` ne tient pour du code que `apps/`, `packages/` et `scripts/`. Une sous-PR ou une PR vers develop qui change la CI (`.github/workflows/`), un hook git (`.husky/`), la configuration de l'agent (`.claude/`), le `package.json` racine, le lockfile, `.npmrc` ou la configuration d'un outil des gates entre sans section de revue. Or le capitaine joue tout cela sur son poste au tour suivant, et la CI d'une PR tourne avec le workflow de la PR elle-même.
2. **La casse.** `Apps/api/x.ts` n'est pas du code pour la règle. Sur un système de fichiers insensible à la casse (macOS, Windows), c'est `apps/api/x.ts`.
3. **`chemins-sensibles.mjs` lit les chemins tels que git les écrit.** Un chemin que git cite entre guillemets (`"scripts/agent/a\"b.mjs"`), ou d'une autre casse (`Scripts/agent/`), ne touche plus son motif : `/security-review` n'est pas demandé.
4. **Un lien symbolique sur un index généré.** Une PR de documentation seule (donc sans revue) remplace un index généré par un lien. La régénération du capitaine écrit à travers lui : hors du dépôt pour un lien absolu, dans un autre fichier pour un lien relatif (worktree sale, en sortie 0). Toutes les voies régénèrent : `passer.sh`, la mise à jour d'une sous-PR, l'avance d'une PR de mise à jour, `rafraichir`.
5. **Un index déclaré par motif, avec une `commande`.** Dans la livraison intermédiaire de `passer.sh`, tout fichier sous le motif est dispensé de revue. Sa régénération ne retire pas un fichier en trop (`apps/gen/pirate.ts` sous `apps/gen/*.ts`) et ne récrit pas un ancien fichier que le générateur ne produit plus.
6. **Le capitaine exécute le contenu de la PR** : `pnpm install`, les hooks `.husky` du sommet, les commandes des index. Le ticket dit ce que le point 1 en ferme et ce qui reste.

Ajouts de l'architecte (2026-11-14, en tête des Comments), portés ici : les `cheminsSensibles` du projet s'ajoutent au plancher, lus dans la base de la PR et jamais dans la PR ; `chemins-sensibles.mjs` lit aussi le contrat de la base (second message de l'architecte), sans quoi une branche qui retire son chemin de `chaine.json` échapperait au label `contre-revue` ; `CLAUDE.md` à toute profondeur, `docs/agents/` et le fichier des critères de la revue exigent la revue ; `admin.md` du socle recommande la protection GitHub, sans la poser. Le lockfile relu va au ticket 38 ; le reste du Markdown de la racine reste dispensé.

Relecture adversaire (2026-11-14, agent neuf), portée ici : une configuration d'outil lue par dossier, sous `docs/` (`docs/lint-staged.config.mjs`), entrait sans revue puis s'exécutait au `pre-commit` du capitaine (bloquante, jouée) ; d'où la revue exigée pour tout fichier exécutable et tout nom de configuration à toute profondeur. Aussi : l'union du contrat d'un sujet en retard avec celui de develop, la normalisation NFC, l'exception d'index de `docs/agents/` réduite aux entrées littérales à `commande`, `CLAUDE.local.md`, et la recommandation de `admin.md` précisée.

Les règles du produit, intangibles :

> jamais `--no-verify`, jamais de push forcé ni de réécriture, jamais de fusion avec un contrôle exigé rouge, jamais de test sauté ou assoupli, jamais de push sur la branche par défaut

Quand le ticket est fait : une PR qui touche du code, ce que la chaîne exécute et lit pour juger, ce que l'agent lit (`CLAUDE.md`, `docs/agents/`, le fichier des critères) ou un chemin sensible du projet n'entre sans section de revue ni dans un sujet ni dans develop, quelle que soit la casse ou la citation de ses chemins. Le contrat se lit dans la base : une PR qui retire son chemin de `chaine.json` n'échappe ni à la revue exigée ni à `/security-review`. Une PR qui ajoute un lien symbolique sur un index généré est renvoyée avec son motif (sortie 4). Un tel lien déjà dans un sujet ou dans develop arrête la régénération avant toute écriture. Une livraison intermédiaire qui apporte un fichier inconnu sous un index par motif repasse par la revue. Rien de ce qui exigeait la revue n'en est dispensé.

## Où

Base : `origin/main` à `fa7d3eb` (PR 93, ticket 36 fusionné), plugin **7.9.0**, **499 tests**. La session retrouve chaque ancrage par son texte. `F` abrège `skills/chaine/fusionner/scripts`, `S` abrège `skills/chaine/sujet/scripts/sujet.sh`, `P` abrège `F/passer.sh`, `G` abrège `F/github.sh`.

### Les faits, à la source

- **`F/revue-exigee.mjs:20`** : `CHEMINS_CODE = /^"?(apps|packages|scripts)\//`, seul critère de `exigeRevue` (`:23`) et de `motifSansRevue` (`:41-44`). Appelants : `P:162` (PR vers develop, hors livraison de sujet) et `S:670` (sous-PR, et `RESOLUTION` d'une PR de mise à jour).
- **Ce que le capitaine exécute**, après la revue exigée et avant tout jugement humain :

| Où | Geste | Ce qui tourne, lu dans l'arbre de la PR |
| --- | --- | --- |
| `P:172-174`, `S:486-487`, `S:717-726`, `S:814` | `git switch` puis `git merge` | les hooks de `.husky/` (`core.hooksPath` vaut `.husky/_`, posé par le script `prepare: husky` ; chaque relais appelle `.husky/<hook>` du worktree) |
| `P:221`, `S:512`, `S:615`, `S:748` | `pnpm install --frozen-lockfile` | `package.json` (`prepare`, `postinstall`), `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `.npmrc`, `.pnpmfile.cjs` (un `readPackage` y est du code) |
| `P:224`, `S:513`, `S:616`, `S:749` | `regenerer_index` (`G:77-88`) | les `commande` et `verification` de `scripts/docs/index-generes.json` (déjà sous `scripts/`) |
| `P:232`, `S:514`, `S:618`, `S:751-753` | `git commit` | `pre-commit` (lint-staged lu dans `package.json`, `pnpm run check:commit`, donc `turbo.json`, `tsconfig*.json`, `vitest.config.*`) et `commit-msg` (`commitlint.config.*`) |
| `P:247`, `S:515`, `S:622`, `S:758`, `S:825` | `git push` | `pre-push` du gabarit (`skills/monorepo/socle-monorepo/references/husky/pre-push`) : `pnpm run check`, tout le code et ses configurations (`eslint.config.*`, `.prettierrc`, `.prettierignore`) |

  `S:654` (`pnpm exec commitlint`, titre de la sous-PR) tourne avant le changement de branche : il lit la configuration du worktree du capitaine, pas celle de la PR.
- **La CI du gabarit** (`skills/chaine/socle-chaine-de-production/references/ci/ci.yml`) tourne sur `pull_request` : c'est le workflow de la tête de la PR qui s'exécute. Elle lit `.nvmrc` (`node-version-file`), joue `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm check:gates`, `pnpm check:tickets`, `pnpm check:commit`, commitlint, et `zizmor` sur `.github/workflows`. Une PR qui récrit `ci.yml` (un job exigé qui ne fait plus que `true`) rend ses propres checks verts.
- **Une configuration se lit par dossier** : lint-staged prend le fichier de configuration le plus proche du fichier indexé et exécute ses commandes ; Prettier et ESLint de même pour leur configuration. Le `pre-commit` du gabarit lance lint-staged ; le capitaine commite chez lui (index régénérés, fusion de develop). Un `docs/lint-staged.config.mjs` dans une PR de documentation s'exécute donc sur son poste. Un second projet du socle a, hors de `apps/`, `packages/` et `scripts/`, 36 fichiers exécutables sous `docs/design/proto/` (captures) et 24 parcours de bout en bout sous `tests/` à la racine.
- **La racine du gabarit** (`skills/monorepo/socle-monorepo/references/racine/`) : `.npmrc`, `.nvmrc`, `.prettierrc`, `.prettierignore`, `commitlint.config.mjs`, `eslint.config.mjs`, `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `turbo.json`, `.claude/`. La racine d'un projet du socle porte en plus `.gitattributes`, `.env.example`, `compose.yaml` et une seconde configuration d'ESLint (`eslint.tests.mjs`) : une liste fermée de noms en oublie. Un `-diff` de `.gitattributes` cache un fichier au diff relu par la revue. Le socle web met ses parcours Playwright dans `e2e/` à la racine (`skills/frontend/socle-web-next/references/tickets/12-parcours-de-bout-en-bout.issue.md:13`) : du code hors des trois dossiers.
- **Les chemins sensibles** (`skills/chaine/socle-chaine-de-production/references/chaine.json:3`) : `scripts/agent/**`, `scripts/chaine/**`, `.husky/**`, `.github/workflows/**`, `.github/actions/**`, `scripts/docs/identifiants.mjs`, `.claude/**`. Lus par le gate `tickets` (`Label: contre-revue` d'un ticket dont les `Fichiers chauds:` en touchent un) et par l'étape 2 de la revue adversariale (`/security-review` en plus). Le projet y ajoute ses modules d'authentification, de droits, de paiement, d'export (`skills/chaine/chantier/SKILL.md:61`). Aujourd'hui, `.husky/**`, `.github/**` et `.claude/**` sont sensibles sans exiger la revue : l'incohérence du point 1.
- **Le contrat du gabarit porte déjà les deux clés lues** (`skills/chaine/socle-chaine-de-production/references/chaine.json`) : `cheminsSensibles` (ligne 3) et `criteresRevue` (ligne 4, `docs/agents/criteres-revue.md`). Le skill `revue-adversariale` pose le fichier des critères à ce chemin, défaut compris (`skills/chaine/revue-adversariale/SKILL.md:18`). L'index des coûts, `docs/agents/couts.md`, est un index généré du gabarit (`skills/chaine/socle-chaine-de-production/references/index-generes.json`) : le capitaine le récrit après une PR de carte.
- **`skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs:61-63`** : chaque ligne passe telle quelle à `motifSensibleTouche`. Le moteur est une copie de celui du gate, gardée par un test de parité (`chemins-sensibles.test.mjs`, « parité »).
- **`G:77-88`, `regenerer_index`** : joue chaque `commande` ; `writeFileSync` de Node, comme toute écriture de fichier, suit un lien symbolique. Les index de `docs/` entrent sans revue, par une sous-PR ou une PR vers develop. Un lien versionné par erreur est déjà arrivé dans ce dépôt (`0ff99d3`, « retire le lien node_modules versionné par erreur »).
- **`P:104-134`, `livraison_intermediaire`** : un fichier de l'écart qui prend `regeneres` (`P:125`, index qui ont une `commande`, motifs compris) est dispensé, sans regarder son contenu.

### Reproduit, dépôt jouet (`depot-jouet.mjs`, faux `gh`), sur `fa7d3eb`

1. Une sous-PR par chemin, sans section de revue : `.github/workflows/ci.yml`, `.husky/pre-push`, `.claude/settings.json`, `package.json`, `pnpm-lock.yaml`, `.npmrc`, `.pnpmfile.cjs`, `turbo.json`, `eslint.config.mjs`, `tsconfig.base.json`, `commitlint.config.mjs`, `e2e/a.spec.ts`. `sujet.sh fusionner 80` : **sortie 0, squashée**, pour chacun. La même chose en PR vers develop, `passer.sh 31` : **sortie 0, fusionnée**, pour chacun.
2. `Apps/api/x.ts` et `PACKAGES/a/b.ts` : de même, sortie 0, dans les deux voies.
3. `chemins-sensibles.mjs`, contrat `["scripts/agent/**", ".claude/**"]` : `"scripts/agent/a\"b.mjs"`, `Scripts/agent/a.mjs` et `".claude/x\tb"` ne rendent rien (sortie 0) ; `scripts/agent/a.mjs` rend sa ligne.
4. Liens symboliques, PR vers develop de documentation seule (ADR 2 ajoutée, `docs/adr/README.md` remplacé par un lien) :
   - lien absolu vers un fichier hors du clone : `passer.sh 31` sortie 0, fusionnée ; le fichier hors du dépôt contient la liste des ADR ;
   - lien relatif `../../README.md` : sortie 0, fusionnée ; `README.md` réécrit, `git status --porcelain` rend ` M README.md`.
   - En sous-PR : `fusionner 80` sortie 0 (squash, aucune régénération sur une fusion propre), puis develop avance et `rafraichir lot` sortie 0 : le fichier hors du dépôt est réécrit.
5. Livraison intermédiaire, index `{ "chemin": "apps/gen/*.ts", "commande": "node scripts/docs/gen.mjs" }` (le générateur écrit `apps/gen/a.ts`) : la livraison ajoute `apps/gen/pirate.ts`, `passer.sh 40` sortie 0, `pirate.ts` est dans develop. Elle récrit `apps/gen/ancien.ts`, que le générateur ne produit pas : sortie 0 de même.

### Le coût, mesuré

Ancienne et nouvelle règle appliquées à chaque PR squashée (un commit de premier parent à un parent ; les livraisons de sujet, commits de merge, en sont dispensées), le contrat et la liste des index lus sur le parent de chaque PR, comme sur sa base :

- **Un projet du socle**, 33 PR lisibles dans son clone : 16 exigent la revue aujourd'hui, **23 avec ce ticket (+7, 21 %)**. Une PR change `.claude/settings.json`, une un workflow ; quatre mettent à jour `CLAUDE.md` (son encadré d'état, à chaque fin de vague), dont une change aussi `docs/agents/` et le fichier des critères ; une change `docs/agents/admin.md`. Sans la liste des index de la base, `docs/agents/couts.md` en ajouterait une : 24. Restent dispensées les PR de tickets, cartes, specs, règles, du graphe de graphify et de l'index lu par Anchorpost. Remesuré après la relecture (fichiers exécutables et noms de configuration à toute profondeur) : **23 sur 33, inchangé** dans cette fenêtre, aucune de ces PR ne touchant un tel fichier hors des quatre dossiers. Un second projet du socle (clone d'un seul commit, historique non lisible) en porte 60 : ses captures sous `docs/design/proto/` et ses parcours sous `tests/` exigeront la revue quand une PR les touchera (accepté par l'architecte). Le nom `*rc` ne prend, sur quatre dépôts et plus de 16 000 fichiers suivis, qu'un fichier qui n'est pas déjà à point : un gabarit `npmrc.txt`, une configuration.
- **Ce dépôt**, 57 PR squashées lisibles sur `main` : 13 aujourd'hui, 45 avec ce ticket, surtout pour `.claude-plugin/plugin.json` (la version, à chaque PR) et `CLAUDE.md`. Sans effet : les PR de `skills` ne passent pas par le capitaine. Le chiffre montre la largeur de la règle.
- Dans un projet du socle, une dépendance s'ajoute dans `apps/*/package.json` ou `packages/*/package.json`, déjà du code : la PR qui change le lockfile était déjà revue. La repose de la chaîne touche `scripts/chaine/`, déjà revue. Le surcoût vient de `CLAUDE.md` : chaque mise à jour de son état passe par une revue (une revue de ticket sur un diff de documentation, quelques minutes).

## Décisions

1. **Deux listes, l'une ajoutée à l'autre.** La revue exigée (`revue-exigee.mjs`) est un plancher fixe, dans le plugin : ce qui est du code, ce qui pilote un outil que la chaîne exécute, ce que l'agent lit. Les chemins sensibles (`cheminsSensibles`, dans le contrat, que le projet allonge) **s'y ajoutent**, et gardent leur rôle : contre-revue et `/security-review` en plus. Elles ne se fondent pas : tout `apps/` sensible ferait exiger `Label: contre-revue` sur presque tout ticket. Chaque chemin sensible du gabarit est aussi dans le plancher, prouvé par un test du plugin (`scripts/depot.test.mjs`, non posé dans les projets) : un projet sans contrat lisible garde la garde de la chaîne.
2. **Le contrat se lit dans la base, jamais dans la PR** (décision de l'architecte). `lireBase(<ref>)` lit sur la base `cheminsSensibles`, `criteresRevue` (`.claude/chaine.json`) et la liste des index générés (`scripts/docs/index-generes.json`), par `git show <ref>:<chemin>`. La base est le troisième argument de la CLI : `origin/develop` pour `passer.sh`, `origin/<sujet>` pour `sujet.sh fusionner`. Sinon une PR retirerait elle-même son chemin de `chaine.json` ; `.claude/chaine.json` exige déjà la revue (segment à point), et le test « une PR qui le retire l'exige encore » le joue. Sans contrat dans la base : le plancher et le fichier des critères par défaut. Base introuvable, contrat illisible ou mal formé (`cheminsSensibles` qui n'est pas une liste de chaînes, `criteresRevue` qui n'est pas un chemin) : **tout chemin exige la revue**, le motif le dit ; jamais une garde ouverte, et une PR revue passe quand même. Liste des index illisible : aucun index n'est retiré de `docs/agents/` (plus strict). Les motifs se lisent comme le gate `tickets` : une troisième copie de `regexDuMotif`, gardée par un test de parité, comme `chemins-sensibles.mjs`, sans casse et en NFC. **Une base de sujet** (`origin/sujet/<nom>`) ajoute le contrat d'`origin/develop` (relecture) : un sujet parti avant qu'un chemin soit déclaré dans develop ne le perd pas. Union des chemins sensibles et des fichiers des critères ; seuls les index présents dans les deux listes restent retirés de `docs/agents/` ; un contrat de develop illisible rend la base illisible.
3. **Ce que l'agent lit exige la revue** (décision de l'architecte) : un `CLAUDE.md` ou un `CLAUDE.local.md` (relecture) à toute profondeur, `docs/agents/`, et le fichier des critères de la revue. Son chemin est `criteresRevue` du contrat de la base ; une clé absente vaut `docs/agents/criteres-revue.md`, le défaut du skill `revue-adversariale` (sous `docs/agents/`, donc déjà pris). Une PR de documentation ne peut plus affaiblir la revue suivante sans être revue. **Un index généré de la base** sous `docs/agents/` (`docs/agents/couts.md` du gabarit) reste dispensé, s'il est déclaré **en littéral avec une `commande`** (relecture) : le capitaine le régénère, et une session ne l'édite pas (le hook le refuse). Une chaîne nue (jamais régénérée) ou un motif (qui ne retire pas un fichier en trop) exigent la revue.
4. **La règle du plancher, par familles et non par noms.** Exige la revue un chemin qui :
   - commence par `apps/`, `packages/`, `scripts/` (comme avant) ou `e2e/` (les parcours du socle web) ;
   - a un segment qui commence par un point, sauf un `.gitkeep` : `.github/`, `.husky/`, `.claude/`, `.npmrc`, `.pnpmfile.cjs`, `.nvmrc`, `.prettierrc`, `.gitattributes`, à toute profondeur. Un `.gitkeep` est un fichier vide qu'aucun outil ne lit, retiré par la première règle d'un registre ;
   - est un fichier de la racine hors Markdown : `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig*.json`, `eslint.config.*`, `vitest.config.*`, `commitlint.config.*`, `playwright.config.*`, et ceux qu'on n'a pas nommés ;
   - est un `package.json`, à toute profondeur : ses scripts tournent au `pnpm install` dès que l'espace de travail l'inclut ;
   - est un fichier de code exécutable, à toute profondeur : `.js`, `.mjs`, `.cjs`, `.ts`, `.mts`, `.cts`, `.jsx`, `.tsx`, `.sh`, `.bash`, `.zsh`, `.py`, `.rb`, `.pl`, `.ps1`, `.php` (relecture, bloquante : `docs/lint-staged.config.mjs`, `infra/deploy.sh`, `tools/x.mjs`, les captures `docs/design/proto/*.mjs`, les parcours de `tests/`) ;
   - porte un nom de configuration, à toute profondeur : `*.config.*`, `*rc`, `*rc.*` (`docs/prettier.config.mjs`, `docs/x/eslint.config.mjs`, `docs/x/lintstagedrc`) ;
   - est l'un de ceux de la décision 3.

   Le Markdown sous `docs/` reste libre (`docs/a.md`), comme le HTML des maquettes et le texte des sources.

   Le reste du Markdown de la racine reste dispensé (`README.md`, `GLOSSARY.md`, `CHANGELOG.md` ; décision de l'architecte). Dans un dossier à point, non : `.claude/rules/*.md` charge des règles d'agent, et `.claude/**` est sensible dans le gabarit. Une liste fermée de noms oublierait `.pnpmfile.cjs` (du code exécuté par `pnpm install`) ou la seconde configuration d'ESLint d'un projet.
5. **Un chemin se lit décité et sans casse** (`cheminLu`, exporté). Git cite entre guillemets, même sous `core.quotePath=false`, un chemin qui porte `"`, `\`, une tabulation ou un saut de ligne, avec les échappements du C (`\a \b \t \n \v \f \r \" \\`) et l'octal (`\303\251`). La ligne est décitée, normalisée en NFC (macOS écrit souvent les noms en NFD ; relecture), puis mise en minuscules ; les motifs du contrat aussi. Une citation mal formée rend `null` et exige la revue. Cela remplace le `"?` de 7.9.0 (ticket 36, décision 11), qui n'était juste que pour le préfixe.
6. **Monotonie.** Rien de ce que la règle de 7.9.0 exigeait n'en est dispensé : un test recopie l'ancienne règle et la joue sur un corpus (préfixes de code cités ou non, suites piégées, quatre mille chaînes tirées sans dépendance) ; tout chemin qu'elle exigeait est encore exigé. Le test rougit sous deux mutations jouées : retirer `c === null ||` (une citation mal formée ne serait plus exigée), retirer `scripts` de `CODE`. **Une seule assertion existante change**, dans le sens strict : `exigeRevue(['docs/agents/evals-skills.md', '.claude/skills/x/SKILL.md'])` valait `false` dans le premier test de `revue-exigee.test.mjs` ; les deux chemins passent dans la liste de ce qui exige la revue, et la ligne devient un commentaire qui le dit. Raisons : `.claude/skills/` porte des skills et des scripts propres au projet, que des sessions exécutent, et `.claude/**` est dans les chemins sensibles du gabarit ; `docs/agents/` exige la revue (décision 3).
7. **Le motif nomme le chemin** : « … alors que la PR touche du code ou ce que la chaîne exécute (`.github/workflows/ci.yml`) : … ». Le début du message ne change pas : `refus.sh` et les tests existants le lisent.
8. **`chemins-sensibles.mjs` lit de même.** Une copie de `cheminLu` (le décitage et le moteur restent copiés ; seule la lecture du contrat de la base est importée, plus bas) ; le motif et le chemin passent en NFC et en minuscules avant `motifSensibleTouche`, le moteur ne change pas, la parité avec le gate tient. La sortie garde la ligne telle que reçue et le motif tel qu'écrit. Une citation mal formée : sortie 2, comme un contrat illisible (le contrôle échoue fermé). Monotone : abaisser la casse des deux côtés garde toute égalité ; une ligne citée ne touchait avant qu'un motif à `**` de tête, qui touche encore la ligne décitée. La table et le test de parité existants restent verts.
   **Il lit aussi le contrat de la base** (décision de l'architecte, second message) : les motifs du contrat de la branche (dossier courant, comme avant) **et** ceux de la base, par le même `lireBase` de `revue-exigee.mjs` (union avec develop pour une base de sujet comprise), importé (à côté dans un projet, dans le skill `fusionner` du plugin) ; une seule lecture du contrat de la base pour les deux gardes. L'union est monotone : tout ce qui était sensible le reste. La base :
   - l'argument de la CLI, la même qu'à l'étape 1 de la revue (`origin/develop`, `origin/sujet/<nom>`) : la commande de l'étape 2 la passe ;
   - sans argument, le script la trouve : le ticket de la branche (`identifiant.mjs ticket-de-pr`, sur le nom de branche), puis son sujet (`sujet.sh de`, la ligne `Sujet:` du ticket ou de sa spec) ; s'il en déclare un et que `origin/sujet/<nom>` existe, c'est la base, sinon `origin/develop` ;
   - hors d'un dépôt git, ou sans argument ni `origin/develop` : le contrat de la branche seul, comme avant, dit sur la sortie d'erreur. Sans cette exception, les bancs existants, joués hors dépôt ou sans `origin`, changeraient ; un projet a toujours `origin/develop` ;
   - base donnée introuvable, contrat de base illisible, ticket dont le sujet ne se lit pas (`sujet.sh` absent ou en échec) : **chaque chemin est sensible**, `chemin<TAB>(base illisible : …)`, sortie 0 ; `/security-review` est lancé. `revue-exigee.mjs` introuvable alors qu'une base est à lire : sortie 2, la revue s'arrête et le pose d'abord.

9. **Un lien symbolique sur un index généré, ou sur l'un de ses dossiers, est refusé en deux points**, par une seule fonction de `github.sh`, `liens_sur_index [<commit> [<base>]]` :
   - **à l'entrée** : `passer.sh` (après la revue exigée, avant l'ordre des migrations, livraisons comprises) et `sujet.sh fusionner` (après la revue exigée, avant les checks) refusent, **sortie 4**, un lien que la PR **ajoute ou change** par rapport à sa base (`origin/develop`, `origin/<sujet>`). La boucle la renvoie avec le motif (`refus.sh`) ;
   - **avant toute régénération** : `regenerer_index` refuse un tel lien dans l'index git du worktree, motif sur la sortie d'erreur, et ne lance aucune commande. Chaque appelant sort comme pour une régénération en échec : `passer.sh` 3 (la boucle s'arrête, le capitaine lit), `rafraichir` 3 (fusion annulée, sujet intact), mise à jour d'une sous-PR 3, avance d'une PR de mise à jour 11.

   L'entrée ne compare qu'à la base : un lien déjà dans develop ferait renvoyer toutes les PR pour une faute qu'aucune n'a commise ; `regenerer_index` l'arrête. « Dossier » couvre les motifs (`docs/generes` d'un index `docs/generes/*.json`, `docs` de tous). La comparaison se fait sans casse. Une liste illisible (git, `jq`) refuse : jamais une garde ouverte. Les deux variantes du point 4 tombent : rien n'est écrit, ni hors du dépôt ni dans un autre fichier.
10. **Livraison intermédiaire, index déclaré par motif** (`P:125`) : un fichier sous un index qui a une `commande` **et** un `*` n'est dispensé que si son blob au sommet est celui de la fusion recalculée (`attendu`) ou d'`origin/develop`. Sinon il va à la revue. Fichier en trop, ancien fichier récrit : revue. Un index littéral qui a une `commande` reste dispensé (sa commande l'écrit). Un index sans `commande` garde la règle du ticket 36 (décision 14 : celui de develop seulement). Nouvelle fonction `index_regeneres_motifs_regex` dans `github.sh` ; illisible, ce n'est pas une livraison (revue exigée). Un test de garde, vert dès `main`, prouve le cas légitime : la version de develop prise par la mise à jour au conflit d'un tel fichier reste dispensée ; il rougit sous la variante qui renverrait tout fichier sous un motif (jouée). Coût : un générateur par motif qui crée un fichier neuf à la mise à jour renverrait sa livraison à la revue. Aucun projet connu n'a d'index par motif.
11. **La PR de mise à jour** (`verifier_mise_a_jour`) ne change pas : un fichier sous un motif y sort du contrôle « hors conflit » mais compte dans `RESOLUTION`, donc il est revu s'il est du code. Un fichier de `docs/` sous un motif y entre sans revue, comme par toute sous-PR de documentation.
12. **Ce que le point 1 ferme du point 6, et ce qui reste.** Fermé : l'entrée **sans revue** de ce qui pilote les outils que le capitaine exécute (hooks, install, configurations des gates, CI). Reste, écrit dans `fusionner/references/CONTENU.md` : le capitaine joue sur son poste le contenu de chaque PR qui entre, revue ou non (hooks, `pnpm install`, commandes des index, le `pnpm check` du pre-push, donc tout le code). La section de revue est écrite par la session, de bonne foi ; elle ne rend pas sûr ce qui entre. Contre une PR hostile, la frontière n'est pas dans la chaîne : un capitaine sur un poste jetable, sans autre secret que son jeton GitHub, et la protection des branches chez GitHub. `admin.md` du socle la **recommande, sans la poser** (décision de l'architecte) : un `.github/CODEOWNERS` qui suit le plancher (`/*`, puis `/*.md` et `/docs/` sans propriétaire, puis `.*`, `package.json`, `CLAUDE.md`, `CLAUDE.local.md`, les extensions exécutables, `*.config.*`, `*rc`, `*rc.*`, `/docs/agents/`, le fichier des critères et les chemins sensibles du projet : la dernière ligne l'emporte, et les motifs y sont sensibles à la casse) ; « Require review from Code Owners » ; « Block force pushes » sur toutes les branches (`~ALL`) ; « Restrict deletions » sur `develop` et `main` ; « Do not allow bypassing the above settings », aucune liste de contournement. Précisé à la relecture : un auteur ne peut pas approuver sa propre PR, donc les sessions ouvrent leurs PR sous une autre identité qu'un propriétaire (un bot, une GitHub App), ou un second humain approuve ; ne pas cocher « Dismiss stale pull request approvals when new commits are pushed » ni « Require approval of the most recent reviewable push », car la mise à jour du capitaine avant chaque fusion retirerait l'approbation. **Écart à la lettre de la demande, tranché ici** : « Require review from Code Owners » est une option de la règle de PR, qui interdit le push direct sur la branche qu'elle garde. Posée sur toutes les branches, elle bloquerait la chaîne : le capitaine pousse sans PR sur les sujets (`rafraichir`, l'avance, `carte`, `geler`) et sur les branches des PR (leur mise à jour), les sessions sur leurs branches. Elle va donc sur `develop` et `main` ; une sous-PR entre dans son sujet sans approbation des propriétaires, et la livraison du sujet vers develop la demande pour tout le lot.
13. **Les hooks d'agent ne changent pas** (`skills/chaine/socle-chaine-de-production/references/agent/` : aucune ligne). Aucune dépendance nouvelle. Ni `--no-verify`, ni test retiré, sauté ou assoupli.
14. **Version : correctif, 7.9.1.** Un durcissement sans format nouveau : `revue-exigee.mjs` lit deux clés de `.claude/chaine.json` qui existent déjà (`cheminsSensibles`, `criteresRevue`), aucune clé n'apparaît ni ne change. La CLI gagne un troisième argument facultatif : une copie d'appelant plus ancienne, sans lui, garde le plancher seul. La sortie de `revue-exigee.mjs` et de `chemins-sensibles.mjs` ne change pas de forme. La session prend la version de `origin/main` à l'ouverture de la PR et monte le troisième chiffre. Si une autre PR du plugin entre d'abord, fusionner `main` dans la branche (commit de fusion, ni rebase ni push forcé) et prendre le correctif qui suit.

### Remèdes écartés

- **Une seule liste** (la revue exigée remplacée par `cheminsSensibles`, ou l'inverse) : décision 1.
- **Lire le contrat dans l'arbre de la PR, ou dans le worktree du capitaine** : la PR retirerait son propre chemin ; le worktree du capitaine n'est pas toujours sur la base (un humain qui lance `sujet.sh fusionner` depuis sa branche). La base est nommée par l'appelant.
- **Une sortie nouvelle pour un contrat de base illisible** (ni 0 ni 4) : la boucle ne la connaît pas ; exiger la revue de tout chemin ferme la garde sans changer les sorties, et develop rouge au gate `tickets` le montre déjà.
- **Lever `docs/agents/` pour tous les index générés, ou pas du tout** : `docs/agents/couts.md` récrit par le capitaine ferait exiger la revue d'une PR de carte (une de plus sur 33) ; seul un index de la base est retiré, et seulement de `docs/agents/`.
- **« Require review from Code Owners » sur toutes les branches** : décision 12, la chaîne pousse sans PR sur les sujets et les branches de travail.
- **Une copie de `lireBase` dans `chemins-sensibles.mjs`**, pour le garder sans import : deux lectures du contrat de la base à tenir égales ; le moteur des motifs reste copié (parité avec le gate), la lecture du contrat est importée.
- **Exiger la base en argument, sans défaut** : une session qui lance le script sans elle s'arrêterait ; le défaut (le sujet du ticket, sinon `origin/develop`) suit ce que `sujet.sh` sait déjà.
- **Base introuvable sans argument (hors dépôt, sans `origin/develop`) lue comme illisible** : chaque chemin serait sensible dans les bancs existants, joués hors dépôt ; seule une base nommée qui ne se lit pas l'est.
- **Une liste fermée de noms de fichiers** : chaque outil ajoute le sien (`.pnpmfile.cjs`, `vitest.workspace.ts`, `knip.json`, `lefthook.yml`), et un nom oublié est un trou. Les familles de la décision 4 prennent ceux qu'on ne connaît pas.
- **Inverser la règle** (tout exige la revue, sauf la documentation) : le graphe de graphify et l'index lu par Anchorpost, récrits par les PR de documentation d'un projet du socle, la feraient exiger à chaque PR de documentation.
- **Exiger la revue pour tout changement de mode `120000`** (seul, ou avec la décision 9) : la section de revue est écrite par la session, elle ne protège pas le poste du capitaine ; un lien entré avant cette version, ou par une autre voie, serait régénéré quand même ; et `revue-exigee.mjs` devrait recevoir les modes (`git diff --raw` au lieu de `--name-only`, un format d'entrée nouveau). La décision 9 ferme l'écriture là où elle a lieu, quelle que soit la voie d'entrée.
- **Refuser tout lien symbolique** : un projet peut lier `AGENTS.md` à `CLAUDE.md`, ou un dossier partagé dans le dépôt ; seul un lien sous un index est dangereux pour la régénération.
- **Refuser à l'entrée tout lien sur un index, même déjà dans la base** : décision 9, il renverrait toutes les PR.
- **Régénérer en retirant d'abord les fichiers sous un motif** : un générateur qui n'écrit que ce qui a changé perdrait des fichiers, et `regenerer_index` changerait pour tous ses appelants.
- **Dispenser un fichier sous un motif dès qu'il existe d'un côté** : un ancien fichier récrit entrerait (joué : sortie 0).

## À faire, dans l'ordre

Les deux patchs ci-dessous s'appliquent sur `fa7d3eb` (`git apply --check`, puis `git apply`). Copier chaque bloc dans un fichier du dossier temporaire de la session, jamais dans le dépôt.

### 0. Les tests d'abord, vus rouges

Sur `origin/main` :

1. appliquer le patch des tests (ci-dessous) ;
2. dans le premier test de `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` (« exigeRevue : apps/, packages/ et scripts/ (seeds compris), pas la documentation »), la ligne

```text
  assert.equal(exigeRevue(['docs/agents/evals-skills.md', '.claude/skills/x/SKILL.md']), false);
```

devient (décision 6 ; les deux chemins sont dans la liste du test « la configuration que la chaîne exécute ou lit ») :

```text
  // `docs/agents/` et `.claude/skills/` l’exigent depuis 7.9.1 : test « la configuration que la chaîne exécute ou lit ».
```

3. jouer `node --test skills/chaine/fusionner/scripts/revue-exigee.test.mjs skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs skills/chaine/fusionner/scripts/fusionner.test.mjs skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs scripts/depot.test.mjs` ;
4. voir **vingt-six `not ok`**, les cent quatre autres verts. Deux tests nouveaux sont verts dès `main`, gardes de non-régression : la monotonie (rouge sous les mutations de la décision 6) et la livraison « dont un fichier sous un index par motif est celui de develop » (rouge sous la variante stricte de la décision 10) ;
5. **puis** seulement écrire le code.

Le patch des tests, vingt-huit tests ajoutés après les tests existants : `revue-exigee.test.mjs` treize, `fusionner.test.mjs` six, `sujet-fusionner.test.mjs` quatre, `chemins-sensibles.test.mjs` quatre, `scripts/depot.test.mjs` un. Deux imports gagnent `symlinkSync` ; `revue-exigee.test.mjs` gagne `import * as revueExigee` (sur une copie sans `cheminLu` ni `SANS_BASE`, seuls leurs tests échouent) et le dépôt jouet du skill `sujet` (un dépôt git jetable). Il ne retire aucune ligne d'un test existant ; la seule qui change est celle du point 2.

````diff
diff --git a/scripts/depot.test.mjs b/scripts/depot.test.mjs
index 028ec00..37ae98d 100644
--- a/scripts/depot.test.mjs
+++ b/scripts/depot.test.mjs
@@ -387,3 +387,15 @@ test("aucun texte de lancement n'affirme que le plugin se met à jour à chaque
   );
   assert.deepEqual(fautes, [], `une session part de l'instantané de son environnement : ${fautes.join(" ; ")}`);
 });
+
+// Deux listes : la revue exigée par le capitaine (revue-exigee.mjs, fixe) et les chemins sensibles du contrat
+// (contre-revue et /security-review, que le projet allonge). Tout chemin sensible du gabarit exige aussi la revue.
+test("chaque chemin sensible du gabarit de .claude/chaine.json exige la revue au passage du capitaine", async () => {
+  const { exigeRevue } = await import(join(RACINE, "skills/chaine/fusionner/scripts/revue-exigee.mjs"));
+  const { cheminsSensibles } = JSON.parse(readFileSync(join(RACINE, "skills/chaine/socle-chaine-de-production/references/chaine.json"), "utf8"));
+  assert.ok(cheminsSensibles.length > 0);
+  for (const motif of cheminsSensibles) {
+    const exemple = (motif.endsWith("/") ? `${motif}x` : motif).replace(/\*\*/g, "x/y").replace(/\*/g, "x");
+    assert.equal(exigeRevue([exemple]), true, `${motif} (${exemple})`);
+  }
+});
diff --git a/skills/chaine/fusionner/scripts/fusionner.test.mjs b/skills/chaine/fusionner/scripts/fusionner.test.mjs
index f738e67..1e71d90 100644
--- a/skills/chaine/fusionner/scripts/fusionner.test.mjs
+++ b/skills/chaine/fusionner/scripts/fusionner.test.mjs
@@ -4,7 +4,7 @@
 import { test } from "node:test";
 import assert from "node:assert/strict";
 import { spawnSync } from "node:child_process";
-import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
+import { chmodSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
 import { join } from "node:path";
 import { fileURLToPath } from "node:url";
 // Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
@@ -1231,3 +1231,199 @@ test("sujet.sh : un pre-push qui refuse donne 3 (geler : au premier essai, hook
     assert.equal(d.git("status", "--porcelain"), "", `${nom} : worktree propre`);
   }
 });
+
+// Ce que la chaîne exécute ou lit pour juger, et du code d'une autre casse : une PR vers develop qui les change,
+// sans section de revue, n'entre pas (avant : sortie 0, fusionnée sans revue).
+const CONFIGURATION_CHAINE = [".github/workflows/ci.yml", ".husky/pre-push", ".claude/settings.json", "package.json", "pnpm-lock.yaml", "Apps/api/x.ts", "docs/prettier.config.mjs", "infra/deploy.sh"];
+test("passer.sh : une PR qui touche la configuration de la chaîne (CI, hooks, agent, install) ou du code d'une autre casse sans section de revue n'est pas éligible", () => {
+  for (const f of CONFIGURATION_CHAINE) {
+    const d = depotJouet();
+    d.branche("chore/x", "origin/develop", { [f]: "x\n" }, "chore: x");
+    d.git("switch", "-q", "--detach", "origin/develop");
+    d.github({
+      exiges: ["qualite"],
+      checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
+      pulls: [pr(31, "chore/x", { title: "chore: x", body: "Rien.\n" })],
+    });
+    const r = d.lancer(script("passer.sh"), "31");
+    assert.equal(r.status, 4, `${f} : ${r.stdout}${r.stderr}`);
+    assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/, f);
+    assert.deepEqual(d.journal(), [], f);
+  }
+});
+
+// Le contrat d'origin/develop ajoute au plancher ses chemins sensibles et son fichier des critères ; ce que l'agent
+// lit (CLAUDE.md, docs/agents/) l'exige aussi. Une PR qui retire son chemin de chaine.json n'y échappe pas.
+test("passer.sh : un chemin sensible du projet, le fichier des critères, CLAUDE.md et docs/agents/ exigent la revue, même quand la PR retire le chemin de chaine.json", () => {
+  const cas = {
+    "chemin sensible du projet": (d) => d.ecrire("infra/main.tf", "x\n"),
+    "retiré de chaine.json par la PR": (d) => {
+      d.ecrire(".claude/chaine.json", JSON.stringify({ cheminsSensibles: [], criteresRevue: "docs/revue/criteres.md" }));
+      d.ecrire("infra/main.tf", "x\n");
+    },
+    "fichier des critères": (d) => d.ecrire("docs/revue/criteres.md", "S1 rien\n"),
+    "CLAUDE.md": (d) => d.ecrire("docs/CLAUDE.md", "x\n"),
+    "docs/agents/": (d) => d.ecrire("docs/agents/pieges.md", "x\n"),
+  };
+  for (const [nom, geste] of Object.entries(cas)) {
+    const d = depotJouet();
+    d.ecrire(".claude/chaine.json", JSON.stringify({ cheminsSensibles: ["infra/**"], criteresRevue: "docs/revue/criteres.md" }));
+    d.commit("chore: contrat");
+    d.git("push", "-q", "origin", "HEAD:develop");
+    d.git("fetch", "-q", "origin");
+    d.git("switch", "-q", "-C", "docs/x", "origin/develop");
+    geste(d);
+    d.commit("docs: x");
+    d.git("push", "-q", "origin", "HEAD:refs/heads/docs/x");
+    d.git("fetch", "-q", "origin");
+    d.git("switch", "-q", "--detach", "origin/develop");
+    d.github({
+      exiges: ["qualite"],
+      checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
+      pulls: [pr(31, "docs/x", { title: "docs: x", body: "Rien.\n" })],
+    });
+    const r = d.lancer(script("passer.sh"), "31");
+    assert.equal(r.status, 4, `${nom} : ${r.stdout}${r.stderr}`);
+    assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/, nom);
+    assert.deepEqual(d.journal(), [], nom);
+  }
+});
+
+// Un index généré (docs/, entré sans revue) remplacé par un lien symbolique : la régénération écrivait à travers
+// lui, hors du dépôt (lien absolu) ou dans un autre fichier (lien relatif, worktree sale), en sortie 0.
+function prLienSurIndex(cible) {
+  const d = depotJouet();
+  writeFileSync(join(d.racine, "dehors.txt"), "à moi\n");
+  d.git("switch", "-q", "-C", "docs/lien", "origin/develop");
+  d.ecrire(`${ADR}/ADR_ALL_ARC-2-b.md`, "# 2\n");
+  d.git("rm", "-q", `${ADR}/README.md`);
+  symlinkSync(cible(d), join(d.travail, `${ADR}/README.md`));
+  d.git("add", "-A");
+  d.git("commit", "-q", "-m", "docs(adr): ADR 2");
+  d.git("push", "-q", "origin", "HEAD:refs/heads/docs/lien");
+  d.git("fetch", "-q", "origin");
+  d.git("switch", "-q", "--detach", "origin/develop");
+  d.github({
+    exiges: ["qualite"],
+    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
+    pulls: [pr(31, "docs/lien", { title: "docs(adr): ADR 2", body: "Rien.\n" })],
+  });
+  return d;
+}
+test("passer.sh : un index généré remplacé par un lien symbolique (absolu ou relatif) est refusé (sortie 4), rien n'est écrit à travers lui", () => {
+  for (const [cas, cible] of [["absolu", (d) => join(d.racine, "dehors.txt")], ["relatif", () => "../../README.md"]]) {
+    const d = prLienSurIndex(cible);
+    const r = d.lancer(script("passer.sh"), "31");
+    assert.equal(r.status, 4, `${cas} : ${r.stdout}${r.stderr}`);
+    assert.match(r.stdout, /lien symbolique sur un index généré ou son dossier : docs\/adr\/README\.md/, cas);
+    assert.equal(readFileSync(join(d.racine, "dehors.txt"), "utf8"), "à moi\n", `${cas} : rien d'écrit hors du dépôt`);
+    assert.equal(d.lire("README.md"), "jouet\n", `${cas} : rien d'écrit dans un autre fichier`);
+    assert.equal(d.git("status", "--porcelain"), "", cas);
+    assert.deepEqual(d.journal(), [], cas);
+  }
+});
+
+// Le même lien déjà dans develop (entré avant cette version) : une PR qui ne le touche pas n'est pas renvoyée pour
+// lui, et la régénération s'arrête avant d'écrire (sortie 3, que la boucle porte au capitaine).
+test("passer.sh : un lien symbolique déjà dans develop sur un index généré arrête la régénération (sortie 3) sans renvoyer la PR, rien n'est écrit à travers lui", () => {
+  const d = depotJouet();
+  const dehors = join(d.racine, "dehors.txt");
+  writeFileSync(dehors, "à moi\n");
+  d.git("rm", "-q", `${ADR}/README.md`);
+  mkdirSync(join(d.travail, ADR), { recursive: true });
+  symlinkSync(dehors, join(d.travail, `${ADR}/README.md`));
+  d.commit("docs: lien");
+  d.git("push", "-q", "origin", "HEAD:develop");
+  d.git("fetch", "-q", "origin");
+  d.branche("docs/adr-2", "origin/develop", { [`${ADR}/ADR_ALL_ARC-2-b.md`]: "# 2\n" }, "docs(adr): ADR 2");
+  d.git("switch", "-q", "--detach", "origin/develop");
+  d.github({
+    exiges: ["qualite"],
+    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
+    pulls: [pr(31, "docs/adr-2", { title: "docs(adr): ADR 2", body: "Rien.\n" })],
+  });
+  const r = d.lancer(script("passer.sh"), "31");
+  assert.equal(r.status, 3, r.stdout + r.stderr);
+  assert.match(r.stderr, /lien symbolique sur un index généré ou son dossier : docs\/adr\/README\.md/);
+  assert.equal(readFileSync(dehors, "utf8"), "à moi\n", "rien d'écrit hors du dépôt");
+  assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucune fusion");
+});
+
+// Livraison intermédiaire d'un projet dont un index est déclaré par motif, avec une `commande` (`apps/gen/*.ts`) :
+// la régénération réécrit `a.ts` et ne retire pas un fichier en trop. `geste(d)` agit sur la livraison.
+const GEN = "import { mkdirSync, writeFileSync } from 'node:fs';\nmkdirSync('apps/gen', { recursive: true });\nwriteFileSync('apps/gen/a.ts', 'export const a = 1;\\n');\n";
+function livraisonMotif(geste) {
+  const d = depotJouet();
+  d.ecrire("scripts/docs/gen.mjs", GEN);
+  d.ecrire(
+    "scripts/docs/index-generes.json",
+    JSON.stringify({ index: [{ chemin: `${ADR}/README.md`, commande: "node scripts/docs/adr-index.mjs" }, { chemin: "apps/gen/*.ts", commande: "node scripts/docs/gen.mjs" }] }),
+  );
+  d.ecrire("apps/gen/a.ts", "export const a = 1;\n");
+  d.ecrire("apps/gen/ancien.ts", "export const ancien = 1;\n");
+  d.commit("chore: index par motif");
+  d.git("push", "-q", "origin", "HEAD:develop");
+  d.git("fetch", "-q", "origin");
+  d.branche("sujet/lot", "origin/develop", { "docs/lot.md": "lot\n" });
+  d.git("switch", "-q", "-C", LIVRAISON, "origin/sujet/lot");
+  geste(d);
+  d.commit("docs: index");
+  d.git("push", "-q", "origin", `HEAD:refs/heads/${LIVRAISON}`);
+  d.git("fetch", "-q", "origin");
+  d.git("switch", "-q", "--detach", "origin/develop");
+  d.github({
+    exiges: ["qualite"],
+    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } },
+    pulls: [pr(40, LIVRAISON, { title: "feat(demo): livraison intermédiaire" })],
+  });
+  return d;
+}
+test("passer.sh : une livraison intermédiaire qui ajoute ou réécrit un fichier sous un index déclaré par motif repasse par la revue", () => {
+  const gestes = {
+    "fichier en trop": (d) => d.ecrire("apps/gen/pirate.ts", "export const pirate = 1;\n"),
+    "ancien fichier réécrit": (d) => d.ecrire("apps/gen/ancien.ts", "export const pirate = 1;\n"),
+  };
+  for (const [cas, geste] of Object.entries(gestes)) {
+    const d = livraisonMotif(geste);
+    const avant = d.git("rev-parse", "origin/develop");
+    const r = d.lancer(script("passer.sh"), "40");
+    assert.equal(r.status, 4, `${cas} : ${r.stdout}${r.stderr}`);
+    assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/, cas);
+    d.git("fetch", "-q", "origin");
+    assert.equal(d.git("rev-parse", "origin/develop"), avant, `${cas} : develop inchangé`);
+  }
+});
+
+// Garde de non-régression : le fichier sous le motif que la mise à jour a pris de develop (conflit sur un index seul,
+// `commande` qui ne le réécrit pas) reste dispensé. Une variante qui renverrait tout fichier sous un motif à la
+// revue la ferait sortir en 4.
+test("passer.sh : une livraison intermédiaire dont un fichier sous un index par motif est celui de develop reste une livraison (sans revue)", () => {
+  const d = depotJouet();
+  d.ecrire(
+    "scripts/docs/index-generes.json",
+    JSON.stringify({ index: [{ chemin: `${ADR}/README.md`, commande: "node scripts/docs/adr-index.mjs" }, { chemin: "docs/generes/*.json", commande: "true" }] }),
+  );
+  d.ecrire("docs/generes/a.json", "0\n");
+  d.commit("docs: index par motif");
+  d.git("push", "-q", "origin", "HEAD:develop");
+  d.git("fetch", "-q", "origin");
+  d.branche("sujet/lot", "origin/develop", { "apps/api/lot.ts": "export const lot = 1;\n", "docs/generes/a.json": "sujet\n" });
+  d.git("push", "-q", "origin", `origin/sujet/lot:refs/heads/${LIVRAISON}`);
+  d.branche("develop", "origin/develop", { "docs/generes/a.json": "develop\n" }, "docs: a (#39)");
+  d.git("switch", "-q", "--detach", "origin/develop");
+  d.github({
+    exiges: ["qualite"],
+    checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "FAILURE" } },
+    pulls: [pr(40, LIVRAISON, { title: "feat(demo): livraison intermédiaire" })],
+  });
+  const premier = d.lancer(script("passer.sh"), "40");
+  assert.equal(premier.status, 3, premier.stdout + premier.stderr);
+  assert.match(premier.stdout, /mise à jour poussée/);
+  d.git("fetch", "-q", "origin");
+  assert.equal(d.git("show", `origin/${LIVRAISON}:docs/generes/a.json`), "develop", "version de develop prise au conflit");
+  d.github({ checks: { "*": { [PERIMETRE]: "SUCCESS", qualite: "SUCCESS" } } });
+  const r = d.lancer(script("passer.sh"), "40");
+  assert.equal(r.status, 0, r.stdout + r.stderr);
+  d.git("fetch", "-q", "origin");
+  assert.equal(d.git("rev-list", "--parents", "-1", "origin/develop").split(" ").length, 3, "commit de merge : deux parents");
+});
diff --git a/skills/chaine/fusionner/scripts/revue-exigee.test.mjs b/skills/chaine/fusionner/scripts/revue-exigee.test.mjs
index bce9072..f76eddd 100644
--- a/skills/chaine/fusionner/scripts/revue-exigee.test.mjs
+++ b/skills/chaine/fusionner/scripts/revue-exigee.test.mjs
@@ -1,8 +1,13 @@
 import { test } from 'node:test';
 import assert from 'node:assert/strict';
-import { execFileSync } from 'node:child_process';
+import { execFileSync, spawnSync } from 'node:child_process';
+import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
+import { join } from 'node:path';
 import { fileURLToPath } from 'node:url';
 import { aSectionRevue, exigeRevue, motifSansRevue, motifTitreSansCode } from './revue-exigee.mjs';
+import * as revueExigee from './revue-exigee.mjs';
+// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
+const jouet = await import(existsSync(new URL('./depot-jouet.mjs', import.meta.url)) ? './depot-jouet.mjs' : '../../sujet/scripts/depot-jouet.mjs');
 
 const SECTION = '## Résumé\n\nTexte.\n\n## Revue adversariale\n\n- Sommet relu : `abc1234`\n';
 
@@ -107,3 +112,216 @@ test('exigeRevue : un chemin de code que git cite entre guillemets l’exige aus
     assert.equal(exigeRevue([cite]), true, cite);
   assert.equal(exigeRevue(['"docs/a\\"b.md"']), false);
 });
+
+// Ce que la chaîne exécute ou lit pour juger : la CI que la PR fait tourner, les hooks git joués chez le capitaine,
+// la configuration de l'agent, ce que lit `pnpm install`, les configurations des outils des gates.
+const CONFIGURATION = [
+  '.github/workflows/ci.yml',
+  '.github/actions/installer/action.yml',
+  '.husky/pre-push',
+  '.husky/commit-msg',
+  '.claude/settings.json',
+  '.claude/chaine.json',
+  '.claude/rules/tests.md',
+  '.claude/skills/x/SKILL.md',
+  'package.json',
+  'pnpm-lock.yaml',
+  'pnpm-workspace.yaml',
+  '.npmrc',
+  '.pnpmfile.cjs',
+  '.nvmrc',
+  'turbo.json',
+  'tsconfig.base.json',
+  'eslint.config.mjs',
+  'vitest.config.ts',
+  'playwright.config.ts',
+  'commitlint.config.mjs',
+  '.prettierrc',
+  '.prettierignore',
+  '.gitattributes',
+  'docs/.gitattributes',
+  'outils/x/package.json',
+  'e2e/parcours.spec.ts',
+  'docs/agents/evals-skills.md',
+];
+test('exigeRevue : la configuration que la chaîne exécute ou lit l’exige (CI, hooks git et d’agent, install, outils des gates)', () => {
+  for (const f of CONFIGURATION) assert.equal(exigeRevue([f]), true, f);
+  for (const f of ['README.md', 'CHANGELOG.md', 'GLOSSARY.md', 'docs/features/a/all/issues/SPEC_ALL_A-1-a.01.issue.md', 'docs/metier/regles/all/.gitkeep'])
+    assert.equal(exigeRevue([f]), false, f);
+  assert.match(motifSansRevue({ corps: '', fichiers: ['docs/a.md', '.github/workflows/ci.yml'] }), /\(\.github\/workflows\/ci\.yml\)/);
+});
+
+test('exigeRevue : la casse ne la contourne pas (Apps/, PACKAGES/, .GitHub/, Package.json)', () => {
+  for (const f of ['Apps/api/x.ts', 'PACKAGES/a/b.ts', 'Scripts/verify/x.mjs', '.GitHub/workflows/ci.yml', '.Husky/pre-push', 'Package.json', 'outils/x/PACKAGE.JSON', '"Apps/a\\"b.ts"'])
+    assert.equal(exigeRevue([f]), true, f);
+  assert.equal(exigeRevue(['Docs/README.MD']), false);
+});
+
+// Par l'espace de noms : sur une copie d'avant, sans `cheminLu`, ce seul test échoue.
+const cheminLu = (ligne) => revueExigee.cheminLu(ligne);
+test('cheminLu : décite un chemin comme git le cite, et une citation mal formée rend null', () => {
+  assert.equal(cheminLu('"apps/a\\"b.ts"'), 'apps/a"b.ts');
+  assert.equal(cheminLu('"docs/\\303\\251t\\303\\251.md"'), 'docs/été.md');
+  assert.equal(cheminLu('"docs/a\\tb.md"'), 'docs/a\tb.md');
+  assert.equal(cheminLu('Apps/X.ts'), 'apps/x.ts');
+  for (const f of ['"docs/a.md', '"docs/a\\qb.md"', '"docs/a"b.md"', '"'])
+    assert.equal(cheminLu(f), null, f);
+  assert.equal(exigeRevue(['"docs/a.md']), true, 'mal formé : exigée');
+});
+
+// Monotonie : la règle de 7.9.0, recopiée ici, sur un corpus de chemins. Tout chemin qu’elle soumettait à la revue
+// y reste soumis.
+const AVANT = (f) => /^"?(apps|packages|scripts)\//.test(f.trim());
+test('exigeRevue : rien de ce que la règle d’avant exigeait n’en est dispensé', () => {
+  const prefixes = ['apps/', 'packages/', 'scripts/', '"apps/', '"packages/', '"scripts/', ' apps/', 'scripts/db/', 'docs/', '"docs/', 'apps', ''];
+  const suites = ['x.ts', 'a\\"b.ts', '\\303\\251.ts', 'b.md', 'sous/c.json', '"', '\\q', 'x.ts"', '', 'db/seed.ts'];
+  const corpus = [];
+  for (const p of prefixes) for (const s of suites) corpus.push(p + s);
+  // Tirage déterministe, sans dépendance : des chaînes faites des caractères qui comptent pour la règle.
+  const alphabet = ['a', 'p', 's', '/', '"', '\\', '.', 'm', 'd', 'A', '3', '0', ' ', 'k', 'g'];
+  let graine = 39;
+  const tirer = (n) => ((graine = (graine * 1103515245 + 12345) % 2147483648), graine % n);
+  for (let i = 0; i < 4000; i++) {
+    const base = prefixes[tirer(prefixes.length)];
+    let suite = '';
+    for (let j = tirer(10); j > 0; j--) suite += alphabet[tirer(alphabet.length)];
+    corpus.push(base + suite);
+  }
+  const exiges = corpus.filter(AVANT);
+  assert.ok(exiges.length > 1000, `corpus trop pauvre : ${exiges.length}`);
+  for (const f of exiges) assert.equal(exigeRevue([f]), true, JSON.stringify(f));
+});
+
+// Ce que l’agent lit pour travailler et pour relire : une PR de documentation ne doit pas affaiblir la revue suivante
+// sans être revue.
+test('exigeRevue : CLAUDE.md à toute profondeur, docs/agents/ et le fichier des critères l’exigent ; un index généré de docs/agents/ non', () => {
+  for (const f of ['CLAUDE.md', 'docs/CLAUDE.md', 'Docs/Claude.MD', 'docs/agents/chaine-de-production.md', 'docs/agents/gabarits/ticket.issue.md', 'docs/agents/criteres-revue.md'])
+    assert.equal(exigeRevue([f]), true, f);
+  const base = { ...revueExigee.SANS_BASE, criteres: ['./docs/revue/criteres.md'], generes: ['docs/agents/couts.md'] };
+  assert.equal(exigeRevue(['docs/revue/criteres.md'], base), true, 'fichier des critères déclaré');
+  assert.equal(exigeRevue(['docs/revue/criteres.md']), false, 'sans base : le chemin par défaut seul');
+  assert.equal(exigeRevue(['docs/agents/couts.md'], base), false, 'index généré : le capitaine le régénère');
+  assert.equal(exigeRevue(['docs/agents/couts.md']), true, 'sans base, aucun index connu');
+  for (const f of ['README.md', 'CHANGELOG.md', 'docs/README.md', 'docs/generes/a.json']) assert.equal(exigeRevue([f], base), false, f);
+});
+
+test('exigeRevue : un chemin sensible du projet, lu dans la base, l’exige ; un contrat de base illisible l’exige pour tout chemin', () => {
+  const base = { ...revueExigee.SANS_BASE, sensibles: ['infra/**', 'federations/*/droits.json'] };
+  for (const f of ['infra/main.tf', 'Infra/Main.tf', '"infra/a\\"b.tf"', 'federations/x/droits.json']) assert.equal(exigeRevue([f], base), true, f);
+  assert.equal(exigeRevue(['federations/x/regles.json'], base), false);
+  assert.equal(exigeRevue(['infra/main.tf']), false, 'sans base : le plancher seul');
+  const illisible = { ...revueExigee.SANS_BASE, illisible: 'contrat de origin/develop illisible (x)' };
+  assert.equal(exigeRevue(['docs/README.md'], illisible), true);
+  assert.match(motifSansRevue({ corps: '', fichiers: ['docs/README.md'], base: illisible }), /contrat de origin\/develop illisible/);
+});
+
+// Posé dans un projet, le gate est dans scripts/verify/ ; dans le plugin, le dépôt jouet du skill tickets le pose.
+const GATE_POSE = new URL('../verify/tickets-regles.mjs', import.meta.url);
+const chargerGate = existsSync(GATE_POSE)
+  ? () => import(GATE_POSE.href)
+  : async () => (await import('../../tickets/references/scripts/docs/depot-jouet.mjs')).module('verify/tickets-regles.mjs');
+test('parité : un chemin sensible de la base se lit comme le gate (motifSensibleTouche)', async () => {
+  const gate = await chargerGate();
+  const table = [
+    ['src/paiement/*webhook*', 'src/paiement/stripe-webhook.json'],
+    ['src/paiement/*webhook*', 'src/paiement/sous/webhook.json'],
+    ['**/auth/**', 'auth/a.json'],
+    ['**/auth/**', 'src/authz/a.json'],
+    ['src/paiement/', 'src/paiement/relevé de compte.json'],
+    ['src/*.pem', 'src/sous/cle.pem'],
+    ['src/a.b+c(d).json', 'src/a.b+c(d).json'],
+    ['src/a.b+c(d).json', 'src/aXb+c(d).json'],
+  ];
+  for (const [motif, chemin] of table) {
+    const base = { ...revueExigee.SANS_BASE, sensibles: [motif] };
+    assert.equal(exigeRevue([chemin], base), gate.motifSensibleTouche(chemin, [motif]) !== null, `${motif} / ${chemin}`);
+  }
+});
+
+// La CLI lit le contrat sur la base nommée, jamais dans l’arbre de travail (la PR) : une PR qui retire son chemin
+// sensible de chaine.json, ou y renomme le fichier des critères, l’exige encore.
+test('CLI : le contrat se lit dans la base ; une PR qui retire son chemin sensible de chaine.json l’exige encore', () => {
+  const { dossierTemporaire } = jouet;
+  const d = dossierTemporaire('revue-base-');
+  const env = {
+    ...Object.fromEntries(Object.entries(process.env).filter(([cle]) => !cle.startsWith('GIT_'))),
+    GIT_CONFIG_GLOBAL: '/dev/null',
+    GIT_CONFIG_NOSYSTEM: '1',
+    GIT_AUTHOR_NAME: 't',
+    GIT_AUTHOR_EMAIL: 't@example.org',
+    GIT_COMMITTER_NAME: 't',
+    GIT_COMMITTER_EMAIL: 't@example.org',
+  };
+  const git = (...a) => execFileSync('git', a, { cwd: d, env, encoding: 'utf8' });
+  const contrat = (c) => {
+    mkdirSync(join(d, '.claude'), { recursive: true });
+    writeFileSync(join(d, '.claude/chaine.json'), JSON.stringify(c));
+  };
+  git('init', '-q', '-b', 'develop');
+  contrat({ cheminsSensibles: ['infra/**'], criteresRevue: 'docs/revue/criteres.md' });
+  git('add', '-A');
+  git('commit', '-q', '-m', 'base');
+  git('switch', '-q', '-c', 'pr');
+  contrat({ cheminsSensibles: [], criteresRevue: 'docs/autre.md' });
+  git('add', '-A');
+  git('commit', '-q', '-m', 'retire infra');
+  const cli = fileURLToPath(new URL('./revue-exigee.mjs', import.meta.url));
+  const lancer = (entree, ...base) => spawnSync('node', [cli, '', '', ...base], { cwd: d, env, input: entree, encoding: 'utf8' });
+  for (const f of ['infra/main.tf', 'docs/revue/criteres.md']) {
+    const r = lancer(`${f}\n`, 'develop');
+    assert.equal(r.status, 1, `${f} : ${r.stdout}${r.stderr}`);
+    assert.match(r.stdout, new RegExp(f.replace(/[./]/g, '\\$&')), f);
+  }
+  assert.equal(lancer('docs/autre.md\n', 'develop').status, 0, 'le fichier des critères de la PR ne compte pas');
+  assert.equal(lancer('infra/main.tf\n').status, 0, 'sans base : le plancher seul');
+  const introuvable = lancer('docs/README.md\n', 'nulle-part');
+  assert.equal(introuvable.status, 1, 'base introuvable : la revue est exigée');
+  assert.match(introuvable.stdout, /contrat de nulle-part illisible/);
+});
+
+// Une configuration d’outil lue par dossier (lint-staged, Prettier, ESLint prennent la plus proche) et tout fichier
+// de code exécutable, à toute profondeur : le capitaine les exécute à son pre-commit, même sous docs/.
+test('exigeRevue : un fichier exécutable et un nom de configuration l’exigent à toute profondeur ; le Markdown de docs/ non', () => {
+  for (const f of ['docs/prettier.config.mjs', 'docs/lint-staged.config.mjs', 'docs/x/eslint.config.mjs', 'infra/deploy.sh', 'tools/x.mjs', 'docs/design/proto/capture.mjs', 'docs/x/lintstagedrc', 'docs/x/prettierrc.json', 'outils/a.PY'])
+    assert.equal(exigeRevue([f]), true, f);
+  for (const f of ['docs/a.md', 'docs/design/proto/ecran.html', 'docs/sources/note.txt']) assert.equal(exigeRevue([f]), false, f);
+});
+
+test('exigeRevue : CLAUDE.local.md à toute profondeur l’exige', () => {
+  for (const f of ['CLAUDE.local.md', 'docs/CLAUDE.local.md', 'apps/web/Claude.Local.md']) assert.equal(exigeRevue([f]), true, f);
+});
+
+// macOS écrit souvent les noms en NFD : un motif écrit en NFC (ou l’inverse) touche le même chemin.
+test('exigeRevue : un chemin sensible en NFD touche son motif en NFC, et l’inverse', () => {
+  const nfc = 'src/paiement/réglé.json'.normalize('NFC');
+  const nfd = 'src/paiement/réglé.json'.normalize('NFD');
+  assert.notEqual(nfc, nfd);
+  assert.equal(exigeRevue([nfd], { ...revueExigee.SANS_BASE, sensibles: [nfc] }), true, 'chemin NFD, motif NFC');
+  assert.equal(exigeRevue([nfc], { ...revueExigee.SANS_BASE, sensibles: [nfd] }), true, 'chemin NFC, motif NFD');
+});
+
+// L’exception d’index de docs/agents/ ne vaut que pour une entrée littérale qui a une `commande`.
+test('lireBase : seul un index littéral à commande sort de docs/agents/ ; chaîne nue et motif l’exigent', () => {
+  const lire = (ref, chemin) =>
+    chemin === 'scripts/docs/index-generes.json'
+      ? JSON.stringify({ index: [{ chemin: 'docs/agents/couts.md', commande: 'node x.mjs' }, 'docs/agents/nu.md', { chemin: 'docs/agents/*.json', commande: 'node y.mjs' }, { chemin: 'docs/agents/sans.md' }] })
+      : null;
+  const base = revueExigee.lireBase('origin/develop', lire);
+  assert.equal(base.illisible, null);
+  assert.equal(exigeRevue(['docs/agents/couts.md'], base), false, 'littéral à commande');
+  for (const f of ['docs/agents/nu.md', 'docs/agents/a.json', 'docs/agents/sans.md']) assert.equal(exigeRevue([f], base), true, f);
+});
+
+// Un sujet en retard sur develop : le contrat de develop s’ajoute au sien.
+test('lireBase : une base de sujet ajoute le contrat d’origin/develop (sujet en retard)', () => {
+  const contrats = {
+    'origin/sujet/lot': JSON.stringify({ cheminsSensibles: ['lot/**'] }),
+    'origin/develop': JSON.stringify({ cheminsSensibles: ['infra/**'], criteresRevue: 'docs/revue/criteres.md' }),
+  };
+  const lire = (ref, chemin) => (chemin === '.claude/chaine.json' ? contrats[ref] ?? null : null);
+  const base = revueExigee.lireBase('origin/sujet/lot', lire);
+  for (const f of ['infra/main.tf', 'lot/a.txt', 'docs/revue/criteres.md']) assert.equal(exigeRevue([f], base), true, f);
+  assert.equal(exigeRevue(['infra/main.tf'], revueExigee.lireBase('origin/autre', lire)), false, 'une autre base que sujet/ : la sienne seule');
+  const casse = revueExigee.lireBase('origin/sujet/lot', (ref, chemin) => (ref === 'origin/develop' ? '{illisible' : lire(ref, chemin)));
+  assert.match(casse.illisible ?? '', /origin\/develop/);
+});
diff --git a/skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs b/skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs
index 08dd8f2..498820f 100644
--- a/skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs
+++ b/skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs
@@ -4,7 +4,7 @@
 import { test } from "node:test";
 import assert from "node:assert/strict";
 import { spawnSync } from "node:child_process";
-import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
+import { chmodSync, existsSync, mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
 import { join } from "node:path";
 // Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
 const { depotJouet, script: scriptDe } = await import(
@@ -460,3 +460,84 @@ test("fusionner : une PR de mise à jour sans liste lisible des index régénér
   assert.equal(r3.status, 4, r3.stdout + r3.stderr);
   assert.match(r3.stdout, /hors des fichiers en conflit.*SPEC_ALL_DEM-1-demo\.01\.issue\.md/);
 });
+
+// Une sous-PR qui change ce que la chaîne exécute (CI, hooks git et d'agent, install) ou du code d'une autre casse,
+// sans section de revue : avant, squashée dans le sujet (sortie 0), puis exécutée par le capitaine au rafraîchissement.
+test("fusionner : une sous-PR qui touche la configuration de la chaîne ou du code d'une autre casse sans section de revue sort en 4, sans squash", () => {
+  for (const f of [".github/workflows/ci.yml", ".husky/pre-push", ".claude/settings.json", "package.json", ".npmrc", "Apps/api/x.ts", "docs/lint-staged.config.mjs", "tools/x.mjs"]) {
+    const { d } = sousPrEnConflit("aucun");
+    d.branche("chore/x", "origin/sujet/lot", { [f]: "x\n" }, "chore: x");
+    d.git("switch", "-q", "--detach", "origin/develop");
+    d.github({ pulls: [{ number: 80, title: "chore: x", head: "chore/x", base: "sujet/lot", labels: ["à-fusionner"], body: "Rien.\n" }] });
+    const r = d.lancer(SUJET, "fusionner", "80");
+    assert.equal(r.status, 4, `${f} : ${r.stdout}${r.stderr}`);
+    assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale »/, f);
+    assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), `${f} : aucun squash`);
+  }
+});
+
+// Un index généré remplacé par un lien symbolique absolu vers un fichier hors du dépôt : la sous-PR (docs seule)
+// entrait sans revue, et le `rafraichir` suivant du capitaine régénérait l'index à travers le lien.
+test("fusionner : une sous-PR qui remplace un index généré par un lien symbolique sort en 4 ; rafraichir ne régénère jamais à travers un lien déjà dans le sujet", () => {
+  const { d } = sousPrEnConflit("aucun");
+  const dehors = join(d.racine, "dehors.txt");
+  writeFileSync(dehors, "à moi\n");
+  const lien = (branche, depuis) => {
+    d.git("switch", "-q", "-C", branche, depuis);
+    d.ecrire(`${ADR}/ADR_ALL_ARC-2-b.md`, "# 2\n");
+    d.git("rm", "-q", `${ADR}/README.md`);
+    symlinkSync(dehors, join(d.travail, `${ADR}/README.md`));
+    d.git("add", "-A");
+    d.git("commit", "-q", "-m", "docs(adr): ADR 2");
+  };
+  lien("docs/lien", "origin/sujet/lot");
+  d.git("push", "-q", "origin", "HEAD:refs/heads/docs/lien");
+  d.git("fetch", "-q", "origin");
+  d.git("switch", "-q", "--detach", "origin/develop");
+  d.github({ pulls: [{ number: 80, title: "docs(adr): ADR 2", head: "docs/lien", base: "sujet/lot", labels: ["à-fusionner"], body: "Rien.\n" }] });
+  const r = d.lancer(SUJET, "fusionner", "80");
+  assert.equal(r.status, 4, r.stdout + r.stderr);
+  assert.match(r.stdout, /#80 lien symbolique sur un index généré ou son dossier : docs\/adr\/README\.md/);
+  assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
+  // Le même lien déjà dans le sujet (entré avant cette version), develop qui avance : rafraichir abandonne.
+  lien("sujet/lot", "origin/sujet/lot");
+  d.git("push", "-q", "origin", "HEAD:refs/heads/sujet/lot");
+  d.branche("develop", "origin/develop", { "docs/autre.md": "autre\n" }, "docs: autre (#39)");
+  d.git("switch", "-q", "--detach", "origin/develop");
+  const sujetAvant = d.git("rev-parse", "origin/sujet/lot");
+  const r2 = d.lancer(SUJET, "rafraichir", "lot");
+  assert.equal(r2.status, 3, r2.stdout + r2.stderr);
+  assert.match(r2.stderr, /lien symbolique sur un index généré ou son dossier : docs\/adr\/README\.md/);
+  assert.equal(readFileSync(dehors, "utf8"), "à moi\n", "rien d'écrit hors du dépôt");
+  d.git("fetch", "-q", "origin");
+  assert.equal(d.git("rev-parse", "origin/sujet/lot"), sujetAvant, "sujet inchangé");
+  assert.equal(d.git("status", "--porcelain"), "");
+});
+
+// Le contrat d'une sous-PR se lit sur son sujet : un chemin sensible que le sujet déclare (et develop pas encore)
+// exige la revue d'une sous-PR qui le touche.
+test("fusionner : un chemin sensible du projet, lu dans le chaine.json du sujet, exige la revue d'une sous-PR", () => {
+  const { d } = sousPrEnConflit("aucun");
+  d.branche("sujet/lot", "origin/sujet/lot", { ".claude/chaine.json": JSON.stringify({ cheminsSensibles: ["infra/**"] }) }, "chore: contrat du lot");
+  d.branche("infra/x", "origin/sujet/lot", { "infra/main.tf": "x\n" }, "chore: infra");
+  d.git("switch", "-q", "--detach", "origin/develop");
+  d.github({ pulls: [{ number: 80, title: "chore: infra", head: "infra/x", base: "sujet/lot", labels: ["à-fusionner"], body: "Rien.\n" }] });
+  const r = d.lancer(SUJET, "fusionner", "80");
+  assert.equal(r.status, 4, r.stdout + r.stderr);
+  assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale ».*\(infra\/main\.tf\)/);
+  assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
+});
+
+// Un sujet en retard sur develop : develop déclare `infra/**` après le départ du sujet. Le contrat du sujet ne le
+// porte pas encore, celui de develop si : une sous-PR qui touche infra/ exige la revue.
+test("fusionner : un chemin sensible déclaré par develop après le départ du sujet exige la revue d'une sous-PR", () => {
+  const { d } = sousPrEnConflit("aucun");
+  d.branche("develop", "origin/develop", { ".claude/chaine.json": JSON.stringify({ cheminsSensibles: ["infra/**"] }) }, "chore: contrat (#41)");
+  d.branche("infra/x", "origin/sujet/lot", { "infra/main.tf": "x\n" }, "chore: infra");
+  d.git("switch", "-q", "--detach", "origin/develop");
+  d.github({ pulls: [{ number: 80, title: "chore: infra", head: "infra/x", base: "sujet/lot", labels: ["à-fusionner"], body: "Rien.\n" }] });
+  const r = d.lancer(SUJET, "fusionner", "80");
+  assert.equal(r.status, 4, r.stdout + r.stderr);
+  assert.match(r.stdout, /sans section « Revue de ticket » ni « Revue adversariale ».*\(infra\/main\.tf\)/);
+  assert.ok(!ecritures(d).some((e) => e.startsWith("PUT ")), "aucun squash");
+});
diff --git a/skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs b/skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs
index e01f356..8071c6d 100644
--- a/skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs
+++ b/skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs
@@ -149,3 +149,92 @@ test("la commande de l'étape 2 : git en échec dans le tube, avec pipefail, sor
   );
   assert.notEqual(r.status, 0);
 });
+
+test("CLI : un chemin que git cite entre guillemets, ou d'une autre casse, touche son motif ; une citation mal formée sort en 2", () => {
+  const d = dossierAvec(JSON.stringify({ cheminsSensibles: ["scripts/agent/**", ".claude/**", "src/paiement/"] }));
+  const entree = ['"scripts/agent/a\\"b.mjs"', '".claude/x\\tb"', '"src/paiement/r\\303\\251gl\\303\\251.ts"', "Scripts/Agent/a.mjs", ".Claude/settings.json", '"docs/a\\"b.md"'];
+  const r = lancer(d, `${entree.join("\n")}\n`);
+  assert.equal(r.status, 0, r.stderr);
+  assert.equal(
+    r.stdout,
+    `${entree[0]}\tscripts/agent/**\n${entree[1]}\t.claude/**\n${entree[2]}\tsrc/paiement/\n${entree[3]}\tscripts/agent/**\n${entree[4]}\t.claude/**\n`,
+  );
+  for (const mal of ['"scripts/agent/a.mjs', '"scripts/agent/a\\qb.mjs"']) {
+    const m = lancer(d, `${mal}\n`);
+    assert.equal(m.status, 2, mal);
+    assert.match(m.stderr, /illisible/, mal);
+  }
+});
+
+// Le contrat de la base s'ajoute à celui de l'arbre : une branche qui retire son chemin de chaine.json le garde
+// sensible (le label contre-revue et /security-review ne s'esquivent pas).
+test("CLI : le contrat de la base s'ajoute ; une branche qui retire un chemin sensible de chaine.json et le touche reste sensible", () => {
+  const d = dossierAvec(JSON.stringify({ cheminsSensibles: ["src/paiement/"] }));
+  const env = {
+    ...sansGit(),
+    GIT_CONFIG_GLOBAL: "/dev/null",
+    GIT_CONFIG_NOSYSTEM: "1",
+    GIT_AUTHOR_NAME: "t",
+    GIT_AUTHOR_EMAIL: "t@example.org",
+    GIT_COMMITTER_NAME: "t",
+    GIT_COMMITTER_EMAIL: "t@example.org",
+  };
+  const git = (...a) => execFileSync("git", a, { cwd: d, env, encoding: "utf8" });
+  git("init", "-q", "-b", "develop");
+  git("add", "-A");
+  git("commit", "-q", "-m", "contrat");
+  git("update-ref", "refs/remotes/origin/develop", "develop");
+  git("switch", "-q", "-c", "feat");
+  writeFileSync(join(d, ".claude/chaine.json"), JSON.stringify({ cheminsSensibles: [] }));
+  mkdirSync(join(d, "src/paiement"), { recursive: true });
+  writeFileSync(join(d, "src/paiement/x.ts"), "export const x = 1;\n");
+  writeFileSync(join(d, "a.md"), "a\n");
+  git("add", "-A");
+  git("commit", "-q", "-m", "retire le chemin");
+  const lancerIci = (...base) =>
+    spawnSync("node", [CLI, ...base], { cwd: d, env, input: "a.md\nsrc/paiement/x.ts\n", encoding: "utf8" });
+  for (const base of [[], ["origin/develop"]]) {
+    const r = lancerIci(...base);
+    assert.equal(r.status, 0, r.stderr);
+    assert.equal(r.stdout, "src/paiement/x.ts\tsrc/paiement/\n", `base ${base[0] ?? "par défaut"}`);
+  }
+  const illisible = lancerIci("nulle-part");
+  assert.equal(illisible.status, 0, illisible.stderr);
+  assert.deepEqual(
+    illisible.stdout.trim().split("\n").map((l) => l.replace(/\t\(base illisible : .*\)$/, "\t?")),
+    ["a.md\t?", "src/paiement/x.ts\t?"],
+    "base illisible : chaque chemin est sensible",
+  );
+});
+
+// Sans base donnée, une branche dont le ticket déclare un sujet lit le contrat de ce sujet.
+test("CLI : sans base donnée, le sujet du ticket de la branche fait la base", async () => {
+  const { depotJouet } = await import(
+    existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs"
+  );
+  const d = depotJouet();
+  d.ecrire("docs/features/demo/all/SPEC_ALL_DEM-1-demo.spec.md", "# Démo\n\nSujet: sujet/lot\n");
+  d.commit("docs: spec");
+  d.git("push", "-q", "origin", "HEAD:develop");
+  d.git("fetch", "-q", "origin");
+  d.branche("sujet/lot", "origin/develop", { ".claude/chaine.json": JSON.stringify({ cheminsSensibles: ["infra/**"] }) }, "chore: contrat du lot");
+  d.git("switch", "-q", "-C", "feat/spec-all-dem-1-01-infra", "origin/sujet/lot");
+  d.ecrire(".claude/chaine.json", JSON.stringify({ cheminsSensibles: [] }));
+  d.ecrire("infra/main.tf", "x\n");
+  d.commit("chore: infra");
+  const r = spawnSync("node", [CLI], { cwd: d.travail, env: d.env, input: "infra/main.tf\n", encoding: "utf8" });
+  assert.equal(r.status, 0, r.stderr);
+  assert.equal(r.stdout, "infra/main.tf\tinfra/**\n");
+});
+
+// macOS écrit souvent les noms en NFD : un chemin NFD touche un motif NFC, et l'inverse.
+test("CLI : un chemin en NFD touche son motif en NFC, et l'inverse", () => {
+  const nfc = "src/paiement/réglé.ts".normalize("NFC");
+  const nfd = "src/paiement/réglé.ts".normalize("NFD");
+  assert.notEqual(nfc, nfd);
+  for (const [motif, chemin] of [[nfc, nfd], [nfd, nfc]]) {
+    const r = lancer(dossierAvec(JSON.stringify({ cheminsSensibles: [motif] })), `${chemin}\n`);
+    assert.equal(r.status, 0, r.stderr);
+    assert.equal(r.stdout, `${chemin}\t${motif}\n`);
+  }
+});
````

### 1. Le code

`revue-exigee.mjs` (décisions 2 à 5 et 7 : `cheminLu`, `lireBase`, `SANS_BASE`, la copie de `regexDuMotif`, la base en troisième argument de la CLI), `chemins-sensibles.mjs` (décision 8 : `cheminLu`, la casse, le contrat de la base et la base par défaut), `github.sh` (`liens_sur_index`, `index_dossiers_regex`, `index_regeneres_motifs_regex`, la garde de `regenerer_index` : décisions 9 et 10), `passer.sh` (la base passée à la revue, l'entrée, la livraison par motif, deux commentaires), `sujet.sh` (la base passée à la revue, l'entrée, une ligne de l'en-tête).

````diff
diff --git a/skills/chaine/fusionner/scripts/github.sh b/skills/chaine/fusionner/scripts/github.sh
index 5d7189a..073fe08 100755
--- a/skills/chaine/fusionner/scripts/github.sh
+++ b/skills/chaine/fusionner/scripts/github.sh
@@ -75,7 +75,13 @@ index_verifications() { index_json | jq -r '.index[] | objects | .verification /
 # commande ou d'un contrôle en échec part sur stderr, préfixée de sa commande (cas vécu : base
 # éteinte, `db:types` échouait sans un mot).
 regenerer_index() {
-  local c
+  local c motif
+  # Avant toute commande : un index (ou l'un de ses dossiers) en lien symbolique ferait écrire la commande à
+  # travers lui, hors du dépôt ou dans un autre fichier.
+  if ! motif=$(liens_sur_index); then
+    printf '%s\n' "$motif" >&2
+    return 1
+  fi
   while IFS= read -r c; do
     [ -n "$c" ] || continue
     jouer_ou_dire "$c" || return 1
@@ -124,6 +130,45 @@ index_regeneres_regex() {
   index_json | jq -r '.index[] | objects | select((.commande // "") != "") | .chemin' |
     jq -Rrs 'split("\n") | map(select(. != "") | gsub("\\."; "\\.") | gsub("\\*"; "[^/]+")) | "^(" + join("|") + ")$"'
 }
+# Ceux qui ont une `commande` et sont déclarés par motif (`*`) : leur régénération réécrit les fichiers qu'elle
+# produit, sans retirer un fichier en trop sous le motif ni récrire un ancien. `passer.sh` (livraison
+# intermédiaire) ne les dispense que sur un contenu déjà connu.
+index_regeneres_motifs_regex() {
+  index_json | jq -r '.index[] | objects | select((.commande // "") != "" and (.chemin | contains("*"))) | .chemin' |
+    jq -Rrs 'split("\n") | map(select(. != "") | gsub("\\."; "\\.") | gsub("\\*"; "[^/]+")) | "^(" + join("|") + ")$"'
+}
+# Les dossiers d'un index généré (`docs/adr` pour `docs/adr/README.md`, motif compris), en expression régulière.
+index_dossiers_regex() {
+  index_generes | jq -Rrs 'split("\n") | map(select(. != "") | split("/") | . as $s | range(1; length) | $s[:.] | join("/"))
+    | map(gsub("\\."; "\\.") | gsub("\\*"; "[^/]+")) | "^(" + join("|") + ")$"'
+}
+# Liens symboliques sur un index généré, ou sur l'un de ses dossiers, dans l'arbre de `<commit>` (sans argument :
+# l'index git du worktree) ; avec `<base>`, ceux seulement que `<commit>` ajoute ou change par rapport à elle (un
+# lien déjà dans develop ne fait pas renvoyer toutes les PR : `regenerer_index` l'arrête). La régénération
+# écrirait à travers eux : hors du dépôt (lien absolu, ou relatif qui en sort) ou dans un autre fichier du dépôt
+# (worktree sale). Sortie 0 aucun ; 1 sinon, motif sur la sortie standard. Liste illisible (git, jq) : 1, jamais
+# une garde ouverte. Sans casse : sur un système de fichiers insensible à la casse, `Docs` est `docs`.
+liens_sur_index() {
+  local entrees deja='' liens generes dossiers l
+  if [ -n "${1:-}" ]; then
+    entrees=$(git -c core.quotePath=false ls-tree -r --full-tree "$1") || { echo "arbre de $1 illisible : liens symboliques non vérifiés"; return 1; }
+  else
+    entrees=$(git -c core.quotePath=false ls-files -s) || { echo "index git illisible : liens symboliques non vérifiés"; return 1; }
+  fi
+  if [ -n "${2:-}" ]; then
+    deja=$(git -c core.quotePath=false ls-tree -r --full-tree "$2" | awk -F '\t' '$1 ~ /^120000 /') || { echo "arbre de $2 illisible : liens symboliques non vérifiés"; return 1; }
+  fi
+  liens=$(comm -23 <(printf '%s\n' "$entrees" | awk -F '\t' '$1 ~ /^120000 /' | sort) <(printf '%s\n' "$deja" | sort) | cut -f2-)
+  [ -n "$liens" ] || return 0
+  generes=$(index_generes_regex) && dossiers=$(index_dossiers_regex) && [ -n "$generes" ] && [ -n "$dossiers" ] ||
+    { echo "liste des index générés illisible : liens symboliques non vérifiés"; return 1; }
+  while IFS= read -r l; do
+    if grep -qiE "$generes|$dossiers" <<<"$l"; then
+      echo "lien symbolique sur un index généré ou son dossier : $l ; la régénération écrirait à travers lui (hors du dépôt ou dans un autre fichier) : le remplacer par un fichier ordinaire, jamais un lien"
+      return 1
+    fi
+  done <<<"$liens"
+}
 # Indexe les index générés modifiés, ajoutés ou supprimés (un motif sans fichier n'est pas une erreur).
 ajouter_index() {
   local f
diff --git a/skills/chaine/fusionner/scripts/passer.sh b/skills/chaine/fusionner/scripts/passer.sh
index 08f4ded..9208606 100755
--- a/skills/chaine/fusionner/scripts/passer.sh
+++ b/skills/chaine/fusionner/scripts/passer.sh
@@ -35,7 +35,8 @@
 #   3  aucun check sur le sommet après 5 min : CI non déclenchée → ni fermeture-réouverture ni
 #      commit vide ; boucle.sh la met de côté jusqu'à la fusion suivante, qui la poussera
 #   4  refus que l'auteur peut corriger (migration plus ancienne que la dernière de develop,
-#      titre trop long, sans section « Revue adversariale », titre de code sur un diff docs seul) : la dernière ligne dit pourquoi ; boucle.sh renvoie
+#      titre trop long, sans section « Revue adversariale », titre de code sur un diff docs seul, lien
+#      symbolique sur un index généré) : la dernière ligne dit pourquoi ; boucle.sh renvoie
 #      la PR (refus.sh) avec ce motif, jamais de saut silencieux
 #   7  pas éligible, rien à corriger côté auteur (non ouverte, brouillon, sans `à-fusionner`,
 #      déjà `fusion-bloquée`, empilée sur une parente pas encore fusionnée) : la boucle la saute
@@ -102,7 +103,7 @@ origine=$(git rev-parse "origin/$tete")
 # sujet, hors de develop, dont la fusion avec le develop que la tête contient donne l'arbre de la
 # tête, aux index générés près. Sinon la PR repasse par le chemin ordinaire (revue exigée, squash).
 livraison_intermediaire() {
-  local nom=$1 d s attendu ecart hors regeneres
+  local nom=$1 d s attendu ecart hors regeneres motifs
   git fetch -q origin "sujet/$nom" 2>/dev/null || return 1
   d=$(git merge-base "$origine" origin/develop) || return 1
   for s in $(git merge-base --all "$origine" "origin/sujet/$nom" 2>/dev/null); do
@@ -117,11 +118,19 @@ livraison_intermediaire() {
     # Un index qui a une `commande` est régénéré : dispensé. Un index sans commande ne l'est que si son
     # blob au sommet est celui d'origin/develop (la version de develop prise au conflit par la mise à
     # jour) ; absent d'un côté, il diffère et va à la revue.
+    # Un index déclaré par motif, même avec une `commande`, ne l'est que sur un contenu déjà connu (celui de la
+    # fusion recalculée ou d'origin/develop) : sa régénération ne retire pas un fichier en trop sous le motif.
     # Liste illisible (fonction absente, jq en échec) : pas une livraison, la revue est exigée.
     regeneres=$(index_regeneres_regex) && [ -n "$regeneres" ] || return 1
+    motifs=$(index_regeneres_motifs_regex) && [ -n "$motifs" ] || return 1
     hors=$(printf '%s\n' "$ecart" | sed '/^$/d' | while IFS= read -r f; do
       if ! grep -qE "$GENERES" <<<"$f"; then
         printf '%s\n' "$f"
+      elif grep -qE "$motifs" <<<"$f"; then
+        a=$(git rev-parse -q --verify "$origine:$f" 2>/dev/null) || a=''
+        b=$(git rev-parse -q --verify "$attendu:$f" 2>/dev/null) || b=''
+        c=$(git rev-parse -q --verify "origin/develop:$f" 2>/dev/null) || c=''
+        [ -n "$a" ] && { [ "$a" = "$b" ] || [ "$a" = "$c" ]; } || printf '%s\n' "$f"
       elif ! grep -qE "$regeneres" <<<"$f"; then
         a=$(git rev-parse -q --verify "$origine:$f" 2>/dev/null) || a=''
         b=$(git rev-parse -q --verify "origin/develop:$f" 2>/dev/null) || b=''
@@ -156,13 +165,20 @@ else
   depart_pile=$(git merge-base "$origine" "$depart")
 fi
 
-# Revue adversariale (ADR « chaîne de production ») : exigée dès que le diff touche apps/, packages/ ou scripts/.
+# Revue adversariale (ADR « chaîne de production ») : exigée dès que le diff touche du code ou ce que la chaîne
+# exécute (revue-exigee.mjs : apps/, packages/, scripts/, e2e/, un segment à point, un fichier de la racine hors
+# Markdown, un package.json, un CLAUDE.md, docs/agents/), ou un chemin sensible et le fichier des critères du
+# contrat d'origin/develop, jamais de celui de la PR.
 # Une livraison de sujet en est dispensée : chaque sous-PR l'a passée (sujet.sh fusionner).
 if [ "$livraison_sujet" = 0 ]; then
-  motif=$(git -c core.quotePath=false diff --no-renames --name-only "$depart" "$origine" | node "$PASSER_OUTILS/revue-exigee.mjs" "$(champ '.body // ""')" "$titre") ||
+  motif=$(git -c core.quotePath=false diff --no-renames --name-only "$depart" "$origine" | node "$PASSER_OUTILS/revue-exigee.mjs" "$(champ '.body // ""')" "$titre" origin/develop) ||
     sortir 4 "$motif"
 fi
 
+# Lien symbolique sur un index généré ou son dossier, que la PR ajoute ou change (livraisons comprises) : la
+# régénération de l'étape 3 écrirait à travers lui. Refus que l'auteur corrige.
+motif=$(liens_sur_index "$origine" origin/develop) || sortir 4 "$motif"
+
 # Ordre des migrations : une migration ajoutée par la PR est strictement postérieure à la dernière
 # de develop, sinon le migrateur refuserait la livraison. Valable pour la livraison d'un sujet comme
 # pour une PR directe ; les sous-PR vers un sujet passent par sujet.sh, hors de ce contrôle.
diff --git a/skills/chaine/fusionner/scripts/revue-exigee.mjs b/skills/chaine/fusionner/scripts/revue-exigee.mjs
index 657751f..661cce2 100644
--- a/skills/chaine/fusionner/scripts/revue-exigee.mjs
+++ b/skills/chaine/fusionner/scripts/revue-exigee.mjs
@@ -1,9 +1,9 @@
 // =============================================================================
 // Revue adversariale exigée au passage du capitaine (ADR « chaîne de production »).
 //
-// Une PR qui touche du code (apps/, packages/, scripts/, donc les seeds de scripts/db/)
-// n'est éligible que si sa description porte une section « Revue de ticket » ou « Revue adversariale » : un titre
-// Markdown hors bloc de code. Règles pures, testées par revue-exigee.test.mjs ; la CLI sert
+// Une PR qui touche du code (apps/, packages/, scripts/, donc les seeds de scripts/db/, e2e/) ou ce que la
+// chaîne exécute et lit pour juger (voir `exigeRevue`) n'est éligible que si sa description porte une section
+// « Revue de ticket » ou « Revue adversariale » : un titre Markdown hors bloc de code. Règles pures, testées par revue-exigee.test.mjs ; la CLI sert
 // passer.sh et sujet.sh.
 //
 // Garde-fou ajouté le 20/10 (#844, #939) : une PR dont le titre annonce du code (feat, fix…)
@@ -11,17 +11,197 @@
 // `à-fusionner` pendant que son pre-push, long, n'a pas encore poussé le code ; la boucle squashe
 // alors la seule ligne Status du commit de réservation et le code reste sur la branche.
 //
-// Usage : printf '%s\n' "$fichiers" | node revue-exigee.mjs "$corps" ["$titre"]
+// Usage : printf '%s\n' "$fichiers" | node revue-exigee.mjs "$corps" ["$titre"] ["<base>"]
+// `<base>` : la branche que la PR vise (`origin/develop`, `origin/sujet/<nom>`) ; ses `cheminsSensibles` et son
+// fichier des critères s'ajoutent au plancher (`lireBase`). Sans elle, le plancher seul.
 // Sortie 0 éligible · 1 non éligible, motif sur la sortie standard.
 // =============================================================================
 
-// `"?` : git cite entre guillemets un chemin qui porte `"`, `\`, une tabulation ou un saut de ligne, même sous
-// `core.quotePath=false` (`"apps/a\"b.ts"`) ; cité, il reste du code.
-const CHEMINS_CODE = /^"?(apps|packages|scripts)\//;
+import { execFileSync } from 'node:child_process';
+
+// Ce qui exige la revue, lu sur le chemin décité, en NFC et en minuscules (`cheminLu`) :
+//   - le code : apps/, packages/, scripts/, e2e/ ;
+//   - un fichier de code exécutable à toute profondeur (`.js .mjs .cjs .ts .mts .cts .jsx .tsx .sh .bash .zsh
+//     .py .rb .pl .ps1 .php`) et un nom de configuration à toute profondeur (`*.config.*`, `*rc`, `*rc.*`) :
+//     lint-staged, Prettier ou ESLint prennent la configuration la plus proche du fichier, et l'exécutent au
+//     `pre-commit` du capitaine (`docs/lint-staged.config.mjs`) ;
+//   - un segment qui commence par un point, sauf un `.gitkeep` : `.github/` (la CI et ses actions, que la PR
+//     elle-même fait tourner), `.husky/` (les hooks git, joués chez le capitaine), `.claude/` (hooks d'agent,
+//     règles, contrat de la chaîne), `.npmrc`, `.pnpmfile.cjs` (lus par `pnpm install`), `.nvmrc`,
+//     `.prettierrc`, `.gitattributes` (un `-diff` cache un fichier au diff relu) ;
+//   - un fichier à la racine, hors Markdown : `package.json` (`prepare`, `postinstall`, les commandes des
+//     gates), `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig*.json`, `eslint.config.*`,
+//     `vitest.config.*`, `commitlint.config.*`, `playwright.config.*` ;
+//   - un `package.json` à toute profondeur : ses scripts tournent au `pnpm install` dès que l'espace de travail
+//     l'inclut.
+//   - ce que l'agent lit pour travailler et pour relire : un `CLAUDE.md` ou `CLAUDE.local.md` à toute profondeur,
+//     `docs/agents/` (sauf un index généré de la base déclaré en littéral avec une `commande`, que le capitaine
+//     régénère), le fichier des critères de la revue (`criteresRevue` du contrat de la base,
+//     `docs/agents/criteres-revue.md` sans lui) ;
+//   - un chemin sensible du projet (`cheminsSensibles` du contrat de la base).
+// Le contrat se lit dans la base, jamais dans l'arbre de la PR : sinon une PR retirerait elle-même son chemin. Une
+// base de sujet ajoute le contrat d'origin/develop : un sujet en retard ne perd pas un chemin déclaré depuis.
+// Les chemins sensibles gardent leur rôle : contre-revue et `/security-review` en plus. Ceux du gabarit sont
+// aussi dans le plancher (scripts/depot.test.mjs du plugin).
+const CODE = /^(apps|packages|scripts|e2e)\//;
+const EXECUTABLE = /\.(js|mjs|cjs|ts|mts|cts|jsx|tsx|sh|bash|zsh|py|rb|pl|ps1|php)$/;
+const CONFIGURATION = /(^|\/)[^/]*\.config\.[^/]+$/;
+const RC = /(^|\/)\.?[^/]*rc(\.[^/]+)?$/;
+const CLAUDE_MD = /(^|\/)claude(\.local)?\.md$/;
+// Comparable : NFC (macOS écrit souvent en NFD) puis minuscules, pour les chemins comme pour les motifs.
+const comparable = (s) => s.normalize('NFC').toLowerCase();
+const DOCS_AGENTS = /^docs\/agents\//;
+const CRITERES_DEFAUT = 'docs/agents/criteres-revue.md';
+/** Contexte d'une PR sans base lue : le plancher seul. */
+export const SANS_BASE = Object.freeze({ sensibles: [], criteres: [CRITERES_DEFAUT], generes: [], illisible: null });
+const SEGMENT_A_POINT = /(^|\/)\.(?!gitkeep$)/;
+const RACINE_HORS_MARKDOWN = /^[^/]+$/;
+const PACKAGE_JSON = /(^|\/)package\.json$/;
+const ECHAPPEMENTS = { a: 7, b: 8, t: 9, n: 10, v: 11, f: 12, r: 13, '"': 34, '\\': 92 };
+
+/**
+ * Chemin d'une ligne de `git diff --name-only`, comparable : guillemets de git retirés (`core.quotePath` ; git
+ * cite encore, même à `false`, un chemin qui porte `"`, `\`, une tabulation ou un saut de ligne), en minuscules
+ * (sur un système de fichiers insensible à la casse, macOS ou Windows, `Apps/` est `apps/`). Une ligne citée
+ * mal formée rend `null` : jamais lue comme un chemin de documentation.
+ */
+export function cheminLu(ligne) {
+  const f = ligne.trim();
+  if (!f.startsWith('"')) return comparable(f);
+  if (f.length < 2 || !f.endsWith('"')) return null;
+  const car = [...f.slice(1, -1)];
+  const octets = [];
+  for (let i = 0; i < car.length; i++) {
+    if (car[i] === '"') return null;
+    if (car[i] !== '\\') {
+      octets.push(...Buffer.from(car[i]));
+      continue;
+    }
+    const e = car[++i];
+    const octal = car.slice(i, i + 3).join('');
+    if (e in ECHAPPEMENTS) octets.push(ECHAPPEMENTS[e]);
+    else if (/^[0-3][0-7]{2}$/.test(octal)) {
+      octets.push(parseInt(octal, 8));
+      i += 2;
+    } else return null;
+  }
+  return comparable(Buffer.from(octets).toString('utf8'));
+}
+
+/**
+ * Motif de chemin (`**` = tout, y compris zéro dossier avant `/` ; `*` = un segment) → expression régulière.
+ * Copie de `regexDuMotif` du gate `tickets` (`tickets-regles.mjs`), comme `chemins-sensibles.mjs` ;
+ * `revue-exigee.test.mjs` garde la parité.
+ */
+function regexDuMotif(motif) {
+  const complet = motif.endsWith('/') ? `${motif}**` : motif;
+  const re = complet.replace(/\*\*\/|\*\*|\*|[.+?^${}()|[\]\\]/g, (m) => {
+    if (m === '**/') return '(?:.*/)?';
+    if (m === '**') return '.*';
+    if (m === '*') return '[^/]*';
+    return `\\${m}`;
+  });
+  return new RegExp(`^${re}$`);
+}
+/**
+ * Contexte de la base : `cheminsSensibles` et `criteresRevue` de `.claude/chaine.json`, et les index générés
+ * déclarés en littéral avec une `commande` (`scripts/docs/index-generes.json`), lus sur `<ref>` (`lire(ref,
+ * chemin)` rend le contenu, `null` pour un fichier absent, lève si la base ne se lit pas). Sans contrat : le
+ * plancher et le fichier des critères par défaut. Base introuvable, contrat illisible ou mal formé :
+ * `illisible` (tout chemin exige alors la revue, jamais une garde ouverte). Liste des index illisible : aucun
+ * index n'est retiré de `docs/agents/` (plus strict). Une base de sujet (`origin/sujet/<nom>`) ajoute le
+ * contrat d'`origin/develop` : union des chemins sensibles et des fichiers des critères, et seuls les index des
+ * deux listes restent retirés.
+ */
+export function lireBase(ref, lire = lireGit) {
+  try {
+    const base = lireUne(ref, lire);
+    if (!/^(origin\/)?sujet\//.test(ref)) return base;
+    const develop = lireUne('origin/develop', lire);
+    return {
+      sensibles: [...base.sensibles, ...develop.sensibles],
+      criteres: [...new Set([...base.criteres, ...develop.criteres])],
+      generes: base.generes.filter((g) => develop.generes.includes(g)),
+      illisible: null,
+    };
+  } catch (e) {
+    return { ...SANS_BASE, illisible: `contrat de ${e.ref ?? ref} illisible (${e.message})` };
+  }
+}
+
+function lireUne(ref, lire) {
+  try {
+    const contrat = lire(ref, '.claude/chaine.json');
+    let sensibles = [];
+    let criteres = CRITERES_DEFAUT;
+    if (contrat !== null) {
+      const c = JSON.parse(contrat);
+      const s = c?.cheminsSensibles ?? [];
+      if (!Array.isArray(s) || s.some((m) => typeof m !== 'string')) throw new Error('`cheminsSensibles` doit être une liste de motifs');
+      if (c?.criteresRevue !== undefined && (typeof c.criteresRevue !== 'string' || c.criteresRevue.trim() === ''))
+        throw new Error('`criteresRevue` doit être un chemin');
+      sensibles = s;
+      criteres = c?.criteresRevue ?? CRITERES_DEFAUT;
+    }
+    let generes = [];
+    try {
+      const index = lire(ref, 'scripts/docs/index-generes.json');
+      if (index !== null)
+        generes = (JSON.parse(index).index ?? [])
+          .filter((e) => typeof e?.chemin === 'string' && !e.chemin.includes('*') && typeof e.commande === 'string' && e.commande.trim() !== '')
+          .map((e) => e.chemin);
+    } catch {
+      generes = [];
+    }
+    return { sensibles, criteres: [criteres], generes, illisible: null };
+  } catch (e) {
+    e.ref = ref;
+    throw e;
+  }
+}
+
+function lireGit(ref, chemin) {
+  const git = (...a) => execFileSync('git', a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
+  git('rev-parse', '--verify', '-q', `${ref}^{commit}`);
+  try {
+    git('cat-file', '-e', `${ref}:${chemin}`);
+  } catch {
+    return null;
+  }
+  return git('show', `${ref}:${chemin}`);
+}
+
+/** Premier chemin du diff qui exige la revue, tel que git l'écrit, ou `null`. `base` : `lireBase`, ou `SANS_BASE`. */
+export function cheminExige(fichiers, base = SANS_BASE) {
+  const sensibles = base.sensibles.map((m) => regexDuMotif(comparable(m)));
+  const generes = new Set(base.generes.map((g) => comparable(g.replace(/^\.\//, ''))));
+  const criteres = new Set(base.criteres.map((c) => comparable(c.replace(/^\.\//, ''))));
+  return (
+    fichiers.find((f) => {
+      if (f.trim() === '') return false;
+      const c = cheminLu(f);
+      return (
+        base.illisible !== null ||
+        c === null ||
+        CODE.test(c) ||
+        SEGMENT_A_POINT.test(c) ||
+        (RACINE_HORS_MARKDOWN.test(c) && !c.endsWith('.md')) ||
+        PACKAGE_JSON.test(c) ||
+        EXECUTABLE.test(c) ||
+        CONFIGURATION.test(c) ||
+        RC.test(c) ||
+        CLAUDE_MD.test(c) ||
+        criteres.has(c) ||
+        (DOCS_AGENTS.test(c) && !generes.has(c)) ||
+        sensibles.some((re) => re.test(c))
+      );
+    }) ?? null
+  );
+}
 
 /** Le diff touche-t-il un chemin qui exige la revue ? */
-export function exigeRevue(fichiers) {
-  return fichiers.some((f) => CHEMINS_CODE.test(f.trim()));
+export function exigeRevue(fichiers, base = SANS_BASE) {
+  return cheminExige(fichiers, base) !== null;
 }
 
 /** La description a-t-elle un titre « Revue de ticket » ou « Revue adversariale » hors bloc de code ? */
@@ -38,9 +218,12 @@ export function aSectionRevue(corps) {
 }
 
 /** Motif de non-éligibilité, ou null si la PR peut passer. */
-export function motifSansRevue({ corps, fichiers }) {
-  if (!exigeRevue(fichiers) || aSectionRevue(corps)) return null;
-  return 'sans section « Revue de ticket » ni « Revue adversariale » dans la description alors que la PR touche apps/, packages/ ou scripts/ : lancer le skill revue-de-ticket (ou revue-adversariale pour une PR sans ticket)';
+export function motifSansRevue({ corps, fichiers, base = SANS_BASE }) {
+  const chemin = cheminExige(fichiers, base);
+  if (chemin === null || aSectionRevue(corps)) return null;
+  if (base.illisible !== null)
+    return `sans section « Revue de ticket » ni « Revue adversariale » dans la description, et le ${base.illisible} : la revue est exigée pour tout chemin ; lancer le skill revue-de-ticket (ou revue-adversariale pour une PR sans ticket)`;
+  return `sans section « Revue de ticket » ni « Revue adversariale » dans la description alors que la PR touche du code ou ce que la chaîne exécute (${chemin.trim()}) : lancer le skill revue-de-ticket (ou revue-adversariale pour une PR sans ticket)`;
 }
 
 const TYPES_AVEC_CODE = /^(feat|fix|refactor|perf)(\([^)]*\))?!?:/;
@@ -58,8 +241,9 @@ export function motifTitreSansCode({ titre, fichiers }) {
 if (import.meta.url === `file://${process.argv[1]}`) {
   const { readFileSync } = await import('node:fs');
   const fichiers = readFileSync(0, 'utf8').split('\n').filter(Boolean);
+  const base = process.argv[4] ? lireBase(process.argv[4]) : SANS_BASE;
   const motif =
-    motifSansRevue({ corps: process.argv[2] ?? '', fichiers }) ??
+    motifSansRevue({ corps: process.argv[2] ?? '', fichiers, base }) ??
     motifTitreSansCode({ titre: process.argv[3] ?? '', fichiers });
   if (motif) {
     process.stdout.write(`${motif}\n`);
diff --git a/skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs b/skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs
index 28e3408..0f79d06 100644
--- a/skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs
+++ b/skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs
@@ -8,13 +8,33 @@
 // l'entrée est vide (diff vide, ou git a échoué en amont : jamais lu comme « rien de sensible »),
 // motif sur la sortie d'erreur : un contrôle de sécurité échoue fermé, comme le gate.
 //
-// Usage : set -o pipefail; git -c core.quotepath=false diff --name-only --no-renames <base>...HEAD | node scripts/chaine/chemins-sensibles.mjs
+// Usage : set -o pipefail; git -c core.quotepath=false diff --name-only --no-renames <base>...HEAD | node scripts/chaine/chemins-sensibles.mjs [<base>]
 //
-// Autonome, sans import : le moteur des motifs est celui du gate `tickets`
-// (`tickets/references/scripts/verify/tickets-regles.mjs`, `regexDuMotif` et `motifSensibleTouche`),
-// recopié à l'identique ; `chemins-sensibles.test.mjs` garde la parité.
+// Les motifs sont ceux du contrat de l'arbre de travail **et** ceux du contrat de la base (`lireBase` de
+// revue-exigee.mjs, skill fusionner : à côté dans un projet) : une branche qui retire son propre chemin de
+// `chaine.json` le garde sensible. `<base>` : celle du diff (`origin/develop`, `origin/sujet/<nom>`). Sans elle :
+// le sujet du ticket de la branche (`sujet.sh de`, ticket lu dans le nom de branche par `identifiant.mjs`) s'il en
+// déclare un et que `origin/sujet/<nom>` existe, sinon `origin/develop`. Hors d'un dépôt git, ou sans
+// `origin/develop` ni base donnée : le contrat de l'arbre seul, dit sur la sortie d'erreur. Base donnée
+// introuvable, contrat de base illisible, ou sujet du ticket qui ne se lit pas : chaque chemin est sensible
+// (`chemin<TAB>(base illisible : …)`), jamais une garde ouverte. revue-exigee.mjs introuvable alors qu'une base
+// est à lire : sortie 2.
+//
+// Le moteur des motifs est celui du gate `tickets` (`tickets/references/scripts/verify/tickets-regles.mjs`,
+// `regexDuMotif` et `motifSensibleTouche`), recopié à l'identique ; `chemins-sensibles.test.mjs` garde la parité.
+//
+// Chaque ligne est lue décitée (git cite encore, sous `core.quotepath=false`, un chemin qui porte `"`, `\`,
+// une tabulation ou un saut de ligne), en NFC (macOS écrit souvent en NFD) et sans casse (sur un système de
+// fichiers insensible à la casse, `Scripts/agent/` est `scripts/agent/`), motifs compris ; une ligne citée mal formée : sortie 2. Le moteur reste celui du gate.
 // =============================================================================
+import { execFileSync, spawnSync } from "node:child_process";
 import { existsSync, readFileSync } from "node:fs";
+import { dirname, join } from "node:path";
+import { fileURLToPath, pathToFileURL } from "node:url";
+
+const ICI = dirname(fileURLToPath(import.meta.url));
+// Un outil de la chaîne : à côté (scripts/chaine/ d'un projet), sinon dans son skill du plugin.
+const outil = (skill, nom) => [join(ICI, nom), join(ICI, "../..", skill, "scripts", nom)].find(existsSync);
 
 /**
  * Motif de chemin (`**` = tout, y compris zéro dossier avant `/` ; `*` = un segment) → expression
@@ -39,6 +59,31 @@ function motifSensibleTouche(chemin, cheminsSensibles) {
   return cheminsSensibles.find((motif) => regexDuMotif(motif).test(c)) ?? null;
 }
 
+const ECHAPPEMENTS = { a: 7, b: 8, t: 9, n: 10, v: 11, f: 12, r: 13, '"': 34, "\\": 92 };
+/** Ligne de git décitée et en minuscules, `null` si sa citation est mal formée (copie de `cheminLu`, revue-exigee.mjs). */
+function cheminLu(ligne) {
+  const f = ligne.trim();
+  if (!f.startsWith('"')) return f.normalize("NFC").toLowerCase();
+  if (f.length < 2 || !f.endsWith('"')) return null;
+  const car = [...f.slice(1, -1)];
+  const octets = [];
+  for (let i = 0; i < car.length; i++) {
+    if (car[i] === '"') return null;
+    if (car[i] !== "\\") {
+      octets.push(...Buffer.from(car[i]));
+      continue;
+    }
+    const e = car[++i];
+    const octal = car.slice(i, i + 3).join("");
+    if (e in ECHAPPEMENTS) octets.push(ECHAPPEMENTS[e]);
+    else if (/^[0-3][0-7]{2}$/.test(octal)) {
+      octets.push(parseInt(octal, 8));
+      i += 2;
+    } else return null;
+  }
+  return Buffer.from(octets).toString("utf8").normalize("NFC").toLowerCase();
+}
+
 function lireMotifs(fichier = ".claude/chaine.json") {
   if (!existsSync(fichier)) return [];
   let contrat;
@@ -53,14 +98,67 @@ function lireMotifs(fichier = ".claude/chaine.json") {
   return liste;
 }
 
+/**
+ * Base du diff quand l'appelant n'en donne pas : `{ ref }`, `{ illisible }`, ou `null` (pas de base : hors d'un
+ * dépôt git, ou sans `origin/develop`).
+ */
+function baseParDefaut() {
+  const git = (...a) => execFileSync("git", a, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
+  const existe = (ref) => {
+    try {
+      git("rev-parse", "--verify", "-q", `${ref}^{commit}`);
+      return true;
+    } catch {
+      return false;
+    }
+  };
+  let branche;
+  try {
+    branche = git("rev-parse", "--abbrev-ref", "HEAD");
+  } catch {
+    return null;
+  }
+  const identifiant = outil("fusionner", "identifiant.mjs");
+  const ticket = identifiant ? spawnSync("node", [identifiant, "ticket-de-pr", "", branche], { encoding: "utf8" }).stdout?.trim() ?? "" : "";
+  if (ticket) {
+    const sujet = outil("sujet", "sujet.sh");
+    if (!sujet) return { illisible: `sujet.sh introuvable : le sujet du ticket ${ticket} ne se lit pas` };
+    const r = spawnSync("bash", [sujet, "de", ticket], { encoding: "utf8" });
+    if (r.status !== 0) return { illisible: `sujet du ticket ${ticket} illisible (sujet.sh de, sortie ${r.status})` };
+    const nom = r.stdout.trim().split("\n").pop();
+    if (nom && existe(`origin/sujet/${nom}`)) return { ref: `origin/sujet/${nom}` };
+  }
+  return existe("origin/develop") ? { ref: "origin/develop" } : null;
+}
+
+/** Motifs du contrat de la base, ou `{ illisible }`. */
+async function motifsDeLaBase(base) {
+  if (base === null) {
+    console.error("chemins-sensibles : aucune base (ni argument, ni origin/develop) : le contrat de l'arbre de travail seul");
+    return [];
+  }
+  if (base.illisible) return base;
+  const module = outil("fusionner", "revue-exigee.mjs");
+  if (!module) throw new Error("revue-exigee.mjs introuvable (skill fusionner) : le contrat de la base ne se lit pas ; la revue s'arrête");
+  const lue = (await import(pathToFileURL(module).href)).lireBase(base.ref);
+  return lue.illisible ? { illisible: lue.illisible } : lue.sensibles;
+}
+
 try {
-  const motifs = lireMotifs();
+  const deLaBase = await motifsDeLaBase(process.argv[2] ? { ref: process.argv[2] } : baseParDefaut());
+  const motifs = Array.isArray(deLaBase) ? [...lireMotifs(), ...deLaBase] : lireMotifs();
   const chemins = readFileSync(0, "utf8").split("\n").filter(Boolean);
   if (chemins.length === 0)
     throw new Error("aucun fichier reçu : le diff est vide ou git a échoué ; la revue s'arrête");
   for (const chemin of chemins) {
-    const motif = motifSensibleTouche(chemin, motifs);
-    if (motif !== null) console.log(`${chemin}\t${motif}`);
+    const lu = cheminLu(chemin);
+    if (lu === null) throw new Error(`ligne illisible : ${chemin} (citation de git mal formée) ; la revue s'arrête`);
+    if (!Array.isArray(deLaBase)) {
+      console.log(`${chemin}\t(base illisible : ${deLaBase.illisible})`);
+      continue;
+    }
+    const motif = motifs.find((m) => motifSensibleTouche(lu, [m.normalize("NFC").toLowerCase()]) !== null);
+    if (motif !== undefined) console.log(`${chemin}\t${motif}`);
   }
 } catch (e) {
   console.error(e.message);
diff --git a/skills/chaine/sujet/scripts/sujet.sh b/skills/chaine/sujet/scripts/sujet.sh
index fd766fa..aedaab9 100755
--- a/skills/chaine/sujet/scripts/sujet.sh
+++ b/skills/chaine/sujet/scripts/sujet.sh
@@ -70,7 +70,7 @@
 #
 # Sorties : 0 fait · 2 conflit · 3 checks rouges ou en cours, ou fusion, commit ou push refusé par un hook git
 # (sa sortie sur stderr : la lire, corriger, jamais en sautant le hook ; le pre-push contrôle l'arbre de travail) · 4 refus corrigeable par l'auteur (sa
-# dernière ligne est le motif, `fusionner` : titre, commitlint, revue, base ; `fusionner` et `relancer` : tête gardée, develop, main, la branche par défaut ou un sujet) · 6 arbre de travail pas
+# dernière ligne est le motif, `fusionner` : titre, commitlint, revue, lien symbolique sur un index généré, base ; `fusionner` et `relancer` : tête gardée, develop, main, la branche par défaut ou un sujet) · 6 arbre de travail pas
 # propre (`fusionner`, `rafraichir`, `regrouper`, `relancer` : à nettoyer par qui lance, jamais un renvoi de la PR,
 # comme la sortie 6 de passer.sh) · 7 `fusionner` d'une PR fermée, en brouillon ou d'un sujet gelé (rien à
 # corriger : sautée) · 9 `carte <nom>` refusée, ou `geler`/`degeler` dont le push échoue deux fois (rien n'est poussé)
@@ -667,7 +667,11 @@ fusionner() {
   else
     fichiers=$(git -c core.quotePath=false diff --no-renames --name-only "$(git merge-base "$sommet" "origin/$base")" "$sommet")
   fi
-  motif=$(printf '%s\n' "$fichiers" | node "$revue" "$(jq -r '.body // ""' <<<"$pr")" "$titre") || sortir 4 "#$n $motif"
+  # Le contrat (chemins sensibles, fichier des critères) se lit sur le sujet, jamais dans la sous-PR.
+  motif=$(printf '%s\n' "$fichiers" | node "$revue" "$(jq -r '.body // ""' <<<"$pr")" "$titre" "origin/$base") || sortir 4 "#$n $motif"
+  # Lien symbolique sur un index généré ou son dossier, que la PR ajoute ou change : la régénération du capitaine
+  # (mise à jour, avance, rafraichir) écrirait à travers lui.
+  motif=$(liens_sur_index "$sommet" "origin/$base") || sortir 4 "#$n $motif"
 
   # Checks exigés sur develop, lus sur le sommet de la sous-PR. Les E2E y sont sautés
   # (branche de sujet), donc comptés réussis : ils tournent sur la PR finale.
````

### 2. Les textes, mot pour mot

Chaque remplacement porte sur un passage qui n'apparaît qu'une fois dans son fichier, et s'applique dans l'ordre.

- **`skills/chaine/revue-adversariale/SKILL.md`**, ligne 16 : remplacer

```text
`scripts/chaine/chemins-sensibles.mjs`                                 |
```

par

```text
`scripts/chaine/chemins-sensibles.mjs` (lit le contrat de la base par `revue-exigee.mjs`, et le sujet de la branche par `identifiant.mjs` et `sujet.sh`, posés à côté par `fusionner` et `sujet`) |
```

- **`skills/chaine/revue-adversariale/SKILL.md`**, ligne 24 : remplacer

```text
une PR qui touche `apps/`, `packages/` ou `scripts/` ; refaite pour
```

par

```text
une PR qui touche du code ou ce que la chaîne exécute : `apps/`, `packages/`, `scripts/`, `e2e/`, un chemin dont un segment commence par un point (`.github/`, `.husky/`, `.claude/`, `.npmrc`), un fichier de la racine hors Markdown (`package.json`, `pnpm-lock.yaml`, `turbo.json`, les configurations d'outils), un `package.json`, un fichier exécutable ou un nom de configuration à toute profondeur (`*.mjs`, `*.sh`, `*.config.*`, `*rc`), un `CLAUDE.md` ou `CLAUDE.local.md`, `docs/agents/`, le fichier des critères, un chemin sensible du contrat de la base, quelle que soit la casse (`revue-exigee.mjs`, skill `fusionner`) ; refaite pour
```

- **`skills/chaine/revue-adversariale/SKILL.md`**, ligne 26 : remplacer

```text
documentation seule (`docs/`, `*.md`) : la
```

par

```text
documentation seule (`docs/` hors `docs/agents/` et hors fichier exécutable ou de configuration, `*.md` hors `CLAUDE.md`, `CLAUDE.local.md` et d'un dossier à point) : la
```

- **`skills/chaine/revue-adversariale/SKILL.md`**, ligne 43 : remplacer

```text
node scripts/chaine/chemins-sensibles.mjs
```

par

```text
node scripts/chaine/chemins-sensibles.mjs <base>
```

- **`skills/chaine/revue-adversariale/SKILL.md`**, ligne 46 : remplacer

```text
segment, `/` final un dossier). Sortie non nulle (contrat
```

par

```text
segment, `/` final un dossier) ; un chemin que git cite entre guillemets est décité, en NFC, et la casse ne compte pas. Les motifs du contrat de `<base>` (et, pour un sujet, d'`origin/develop`) (la même qu'à l'étape 1) s'ajoutent à ceux de la branche : une branche qui retire son chemin de `chaine.json` reste sensible. Sans `<base>`, le script prend le sujet du ticket de la branche s'il en déclare un, sinon `origin/develop`. Une base qui ne se lit pas rend chaque chemin sensible (`(base illisible : …)`) : lancer `/security-review`, et corriger la base. Sortie non nulle (contrat
```

- **`skills/chaine/revue-adversariale/references/CONTENU.md`**, ligne 9 : remplacer

```text
un `chemin<TAB>motif` par ligne ; sortie 2
```

par

```text
un `chemin<TAB>motif` par ligne. Les motifs sont ceux du contrat de la branche **et** ceux du contrat de la base, lus par `lireBase` de `revue-exigee.mjs` (skill `fusionner`), la même lecture que la revue exigée du capitaine (une base de sujet y ajoute le contrat d'`origin/develop`) ; chemins et motifs en NFC et sans casse : sinon une branche qui retire son propre chemin de `chaine.json` échapperait à `/security-review` et au label `contre-revue`. La base est l'argument (`origin/develop`, `origin/sujet/<nom>`) ; sans lui, le sujet du ticket de la branche (`identifiant.mjs ticket-de-pr`, puis `sujet.sh de`) s'il en déclare un et que sa branche existe, sinon `origin/develop` ; hors d'un dépôt ou sans `origin/develop`, le contrat de la branche seul, dit sur la sortie d'erreur. Base donnée introuvable, contrat de base illisible, sujet du ticket illisible : chaque chemin est sensible, `chemin<TAB>(base illisible : …)` ; sortie 2
```

- **`skills/chaine/revue-adversariale/references/CONTENU.md`**, ligne 9 : remplacer

```text
hors d'un dossier sensible, chemin accentué.
```

par

```text
hors d'un dossier sensible, chemin accentué ; une branche qui retire un chemin sensible de `chaine.json` et le touche reste sensible (base par défaut, base nommée, base introuvable) ; sans base donnée, le sujet du ticket de la branche fait la base ; un chemin NFD touche son motif NFC, et l'inverse.
```

- **`skills/chaine/revue-de-ticket/SKILL.md`**, ligne 19 : remplacer

```text
ticket et touche `apps/`, `packages/` ou `scripts/` ; refaite pour
```

par

```text
ticket et touche du code ou ce que la chaîne exécute (la liste de `revue-exigee.mjs`, skill `fusionner` : `apps/`, `packages/`, `scripts/`, `e2e/`, un segment à point, un fichier de la racine hors Markdown, un `package.json`, un fichier exécutable ou un nom de configuration à toute profondeur, un `CLAUDE.md` ou `CLAUDE.local.md`, `docs/agents/`, le fichier des critères, un chemin sensible du contrat de la base) ; refaite pour
```

- **`skills/chaine/fusionner/references/CONTENU.md`**, ligne 17 : remplacer

```text
s'il est celui de develop) : vrai après la
```

par

```text
s'il est celui de develop ; un fichier sous un index déclaré par motif, que la régénération ne retire ni ne récrit forcément, seulement s'il est celui de develop ou de la fusion recalculée) : vrai après la
```

- **`skills/chaine/fusionner/references/CONTENU.md`**, ligne 37, le paragraphe entier : remplacer

```text
Le garde-fou de la revue adversariale : une PR qui touche `apps/`, `packages/` ou `scripts/` n'est éligible que si sa description porte un titre « Revue adversariale » hors bloc de code ; et une PR dont le titre annonce du code mais dont le diff ne contient que de la documentation est refusée (le label posé avant que le push n'aboutisse).
```

par

```text
Le garde-fou de la revue adversariale : une PR qui touche du code ou ce que la chaîne exécute et lit pour juger n'est éligible que si sa description porte un titre « Revue adversariale » hors bloc de code. La liste, fixe : `apps/`, `packages/`, `scripts/`, `e2e/` ; un chemin dont un segment commence par un point, sauf un `.gitkeep` (`.github/`, la CI que la PR fait tourner elle-même ; `.husky/`, les hooks joués chez le capitaine ; `.claude/` ; `.npmrc`, `.pnpmfile.cjs`, lus par `pnpm install` ; `.gitattributes`, dont un `-diff` cache un fichier au diff relu) ; un fichier de la racine hors Markdown (`package.json` et ses `prepare` ou `postinstall`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig*.json`, les configurations d'ESLint, Vitest, Prettier, commitlint, Playwright) ; un `package.json` à toute profondeur ; un fichier de code exécutable (`.js`, `.mjs`, `.cjs`, `.ts`, `.mts`, `.cts`, `.jsx`, `.tsx`, `.sh`, `.bash`, `.zsh`, `.py`, `.rb`, `.pl`, `.ps1`, `.php`) et un nom de configuration (`*.config.*`, `*rc`, `*rc.*`) à toute profondeur, car lint-staged, Prettier ou ESLint prennent la configuration la plus proche et l'exécutent au `pre-commit` du capitaine (`docs/lint-staged.config.mjs`) ; ce que l'agent lit pour travailler et pour relire, un `CLAUDE.md` ou `CLAUDE.local.md` à toute profondeur, `docs/agents/` (sauf un index généré de la base déclaré en littéral avec une `commande`, que le capitaine régénère) et le fichier des critères de la revue (`criteresRevue`, `docs/agents/criteres-revue.md` sans lui) ; un chemin sensible du projet (`cheminsSensibles`). Le contrat se lit sur la base de la PR (`origin/develop`, ou le sujet d'une sous-PR : troisième argument de la CLI), jamais dans la PR, qui retirerait elle-même son chemin ; une base de sujet y ajoute le contrat d'`origin/develop` (un sujet en retard ne perd pas un chemin déclaré depuis son départ) ; une base dont le contrat ne se lit pas exige la revue pour tout chemin. Chaque chemin se lit en NFC (macOS écrit souvent en NFD), motifs compris, décité (git cite encore entre guillemets, sous `core.quotePath=false`, un chemin qui porte `"`, `\`, une tabulation ou un saut de ligne ; une citation mal formée exige la revue) et sans casse : sur un système de fichiers insensible à la casse, `Apps/` est `apps/`. Rien de ce que la règle d'avant (`apps/`, `packages/`, `scripts/`) exigeait n'en est dispensé. Les chemins sensibles gardent leur rôle : contre-revue et `/security-review` en plus ; ceux du gabarit sont aussi dans le plancher. Et une PR dont le titre annonce du code mais dont le diff ne contient que de la documentation est refusée (le label posé avant que le push n'aboutisse).

Ce que le capitaine exécute : à chaque mise à jour, il joue sur son poste le contenu de la PR ou du sujet, hooks git de `.husky/` (commit, push : le pre-push lance `pnpm check`), `pnpm install` (scripts du `package.json`, `.npmrc`, `.pnpmfile.cjs`), les `commande` et `verification` des index générés. La revue exigée ferme l'entrée sans revue de ce qui pilote ces outils ; elle ne rend pas sûr ce qui entre : la section de revue est écrite par la session, de bonne foi. Contre une PR hostile, la frontière n'est pas dans la chaîne : un capitaine sur un poste jetable, sans autre secret que son jeton GitHub, et la protection des branches chez GitHub (`admin.md` du socle, recommandation non posée par défaut). Avant toute régénération, un index généré (ou l'un de ses dossiers) en lien symbolique est refusé (`liens_sur_index` de `github.sh`) : `passer.sh` et `sujet.sh fusionner` refusent celui qu'une PR ajoute ou change (sortie 4, renvoi), `regenerer_index` tout autre, avant toute commande (un lien déjà dans un sujet ou dans develop : la mise à jour s'arrête) ; la commande écrirait à travers lui, hors du dépôt ou dans un autre fichier.
```

- **`skills/chaine/fusionner/references/CONTENU.md`**, ligne 45 : remplacer

```text
exige la revue. `identifiant.test.mjs` :
```

par

```text
exige la revue, la configuration que la chaîne exécute ou lit aussi, la casse ne la contourne pas, `cheminLu` décite comme git cite, rien de ce que la règle d'avant exigeait n'en est dispensé, `CLAUDE.md`, `CLAUDE.local.md`, `docs/agents/` et le fichier des critères l'exigent (un index généré littéral à `commande` de `docs/agents/` non, une chaîne nue ou un motif si), un fichier exécutable et un nom de configuration à toute profondeur l'exigent, un chemin NFD touche son motif NFC, une base de sujet ajoute le contrat de develop, un chemin sensible lu dans la base l'exige, un contrat de base illisible l'exige pour tout chemin, la parité avec le gate, et la CLI qui lit le contrat dans la base, pas dans la PR ; `fusionner.test.mjs` encore : une PR vers develop qui touche la configuration de la chaîne ou du code d'une autre casse sans section de revue renvoyée, de même pour un chemin sensible du projet (même retiré de `chaine.json` par la PR), le fichier des critères, un `CLAUDE.md` et `docs/agents/`, un index généré remplacé par un lien symbolique (absolu ou relatif) refusé sans rien écrire à travers lui, le même lien déjà dans develop qui arrête la régénération (sortie 3) sans renvoyer la PR, une livraison intermédiaire qui ajoute ou réécrit un fichier sous un index déclaré par motif renvoyée à la revue, et dont un tel fichier est celui de develop dispensée. `identifiant.test.mjs` :
```

- **`skills/chaine/fusionner/references/CONTENU.md`**, ligne 45 : remplacer

```text
exige la revue. `boucle-outils.test.mjs`, sur
```

par

```text
exige la revue ; une sous-PR qui touche la configuration de la chaîne ou du code d'une autre casse sans section de revue sort en 4, une sous-PR qui remplace un index généré par un lien symbolique sort en 4, et `rafraichir` ne régénère jamais à travers un lien déjà dans le sujet (sortie 3, rien d'écrit hors du dépôt) ; un chemin sensible lu dans le `chaine.json` du sujet exige la revue d'une sous-PR, et de même un chemin que develop déclare après le départ du sujet. `boucle-outils.test.mjs`, sur
```

- **`skills/chaine/socle-chaine-de-production/references/CONTENU.md`**, ligne 5 : remplacer

```text
porte `Label: contre-revue`. Un projet posé
```

par

```text
porte `Label: contre-revue`. La revue exigée au passage du capitaine est une autre liste, fixe (`revue-exigee.mjs`, skill `fusionner`) : elle contient ces chemins du gabarit et en couvre davantage (`package.json`, le lockfile, les configurations d'outils et les fichiers exécutables à toute profondeur, `CLAUDE.md`, `docs/agents/`, le fichier des critères) ; les chemins sensibles qu'un projet ajoute s'y ajoutent, lus sur la base de la PR (`origin/develop`, ou le sujet et `origin/develop`), jamais dans la PR. Un projet posé
```

- **`skills/chaine/socle-chaine-de-production/references/admin.md`**, avant la ligne 26 : remplacer

```text

Vérification : `gh api repos/{owner}/{re
```

par

```text
- [ ] **Recommandé, non posé par défaut : la frontière contre une PR hostile.** La revue exigée par le capitaine vaut pour des sessions de bonne foi : la section de revue est écrite par la session, et le capitaine exécute ce qui entre (hooks git, `pnpm install`, `pnpm check`). Seul GitHub tient contre une PR hostile :
  - un fichier `.github/CODEOWNERS` qui suit le plancher de `revue-exigee.mjs` (skill `fusionner`). La dernière ligne qui touche un chemin l'emporte, et les motifs sont **sensibles à la casse** (`Apps/` n'est pas `apps/` pour GitHub) : d'abord `/*` (tout, à la racine), puis `/*.md` et les dossiers de documentation (`/docs/`) **sans propriétaire**, puis, avec un propriétaire : `.*` (fichiers et dossiers à point, à toute profondeur), `package.json`, `CLAUDE.md`, `CLAUDE.local.md`, les extensions exécutables (`*.js`, `*.mjs`, `*.cjs`, `*.ts`, `*.mts`, `*.cts`, `*.jsx`, `*.tsx`, `*.sh`, `*.bash`, `*.zsh`, `*.py`, `*.rb`, `*.pl`, `*.ps1`, `*.php`), `*.config.*`, `*rc`, `*rc.*`, `/docs/agents/`, le fichier des critères (`criteresRevue`), et les chemins sensibles du projet ;
  - un propriétaire ne peut pas approuver sa propre PR. Les sessions ouvrent donc leurs PR sous une autre identité que celle d'un propriétaire (un bot, une GitHub App), ou un second humain approuve ;
  - sur `develop` et `main`, la règle de PR avec « Require review from Code Owners » : une PR qui touche ces chemins attend l'approbation d'un propriétaire avant que le capitaine la fusionne. **Ne pas cocher** « Dismiss stale pull request approvals when new commits are pushed » ni « Require approval of the most recent reviewable push » : le capitaine pousse la mise à jour avec develop juste avant chaque fusion, et l'approbation tomberait à chaque fois. Pas sur `sujet/*` ni sur les branches de travail, où le capitaine et les sessions poussent sans PR (une règle de PR y bloquerait la chaîne) : une sous-PR entre dans son sujet sans cette approbation, et la livraison du sujet vers develop la demande ;
  - « Block force pushes » sur toutes les branches (cible `~ALL`) ;
  - « Restrict deletions » sur `develop` et `main` ;
  - « Do not allow bypassing the above settings », et aucune liste de contournement (« Bypass list » vide).

  Coût : chaque PR qui touche ces chemins attend un humain, livraisons de sujet comprises.

Vérification : `gh api repos/{owner}/{re
```

### 3. La version : `.claude-plugin/plugin.json:3`

Correctif (décision 14) : `"version": "7.9.0"` devient `"version": "7.9.1"`. Rien d'autre ne change dans ce fichier.

## Surfaces

| Surface | Preuve |
| --- | --- |
| la configuration que la chaîne exécute ou lit exige la revue ; la documentation non | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` « exigeRevue : la configuration que la chaîne exécute ou lit l’exige (CI, hooks git et d’agent, install, outils des gates) » |
| la casse ne contourne pas la revue | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` « exigeRevue : la casse ne la contourne pas (Apps/, PACKAGES/, .GitHub/, Package.json) » |
| un chemin se lit décité ; une citation mal formée exige la revue | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` « cheminLu : décite un chemin comme git le cite, et une citation mal formée rend null » |
| `CLAUDE.md`, `docs/agents/` et le fichier des critères exigent la revue ; un index généré de `docs/agents/` non | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` « exigeRevue : CLAUDE.md à toute profondeur, docs/agents/ et le fichier des critères l’exigent ; un index généré de docs/agents/ non » |
| un chemin sensible lu dans la base l'exige ; un contrat de base illisible l'exige pour tout chemin | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` « exigeRevue : un chemin sensible du projet, lu dans la base, l’exige ; un contrat de base illisible l’exige pour tout chemin » |
| les motifs de la base se lisent comme le gate | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` « parité : un chemin sensible de la base se lit comme le gate (motifSensibleTouche) » |
| le contrat se lit dans la base, pas dans la PR : retirer son chemin de `chaine.json` ne dispense pas | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` « CLI : le contrat se lit dans la base ; une PR qui retire son chemin sensible de chaine.json l’exige encore » |
| PR vers develop : chemin sensible du projet (même retiré par la PR), fichier des critères, `CLAUDE.md`, `docs/agents/` | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : un chemin sensible du projet, le fichier des critères, CLAUDE.md et docs/agents/ exigent la revue, même quand la PR retire le chemin de chaine.json » |
| sous-PR : le contrat se lit sur le sujet | `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` « fusionner : un chemin sensible du projet, lu dans le chaine.json du sujet, exige la revue d'une sous-PR » |
| `chemins-sensibles.mjs` : le contrat de la base s'ajoute ; une branche qui retire un chemin sensible de `chaine.json` et le touche reste sensible ; base illisible, chaque chemin sensible | `skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs` « CLI : le contrat de la base s'ajoute ; une branche qui retire un chemin sensible de chaine.json et le touche reste sensible » |
| `chemins-sensibles.mjs` sans base donnée : le sujet du ticket de la branche | `skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs` « CLI : sans base donnée, le sujet du ticket de la branche fait la base » |
| un fichier exécutable et un nom de configuration à toute profondeur ; le Markdown de `docs/` libre | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` « exigeRevue : un fichier exécutable et un nom de configuration l’exigent à toute profondeur ; le Markdown de docs/ non » ; en PR vers develop (`docs/prettier.config.mjs`, `infra/deploy.sh`) et en sous-PR (`docs/lint-staged.config.mjs`, `tools/x.mjs`) : les tests « configuration de la chaîne » de `fusionner.test.mjs` et `sujet-fusionner.test.mjs` |
| `CLAUDE.local.md` | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` « exigeRevue : CLAUDE.local.md à toute profondeur l’exige » |
| NFD contre NFC, dans les deux scripts | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` « exigeRevue : un chemin sensible en NFD touche son motif en NFC, et l’inverse » ; `skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs` « CLI : un chemin en NFD touche son motif en NFC, et l'inverse » |
| index de `docs/agents/` : littéral à `commande` seul | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` « lireBase : seul un index littéral à commande sort de docs/agents/ ; chaîne nue et motif l’exigent » |
| base de sujet : union avec develop | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` « lireBase : une base de sujet ajoute le contrat d’origin/develop (sujet en retard) » ; `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` « fusionner : un chemin sensible déclaré par develop après le départ du sujet exige la revue d'une sous-PR » |
| la protection GitHub recommandée, non posée | `skills/chaine/socle-chaine-de-production/references/admin.md`, l'entrée « Recommandé, non posé par défaut » (texte, pas de test) |
| monotonie : rien de ce que la règle d'avant exigeait n'en est dispensé | `skills/chaine/fusionner/scripts/revue-exigee.test.mjs` « exigeRevue : rien de ce que la règle d’avant exigeait n’en est dispensé », et les tests existants des cinq fichiers, verts |
| chaque chemin sensible du gabarit exige la revue | `scripts/depot.test.mjs` « chaque chemin sensible du gabarit de .claude/chaine.json exige la revue au passage du capitaine » |
| PR vers develop : configuration de la chaîne ou code d'une autre casse sans revue, renvoyée | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : une PR qui touche la configuration de la chaîne (CI, hooks, agent, install) ou du code d'une autre casse sans section de revue n'est pas éligible » |
| sous-PR : de même, sortie 4, aucun squash | `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` « fusionner : une sous-PR qui touche la configuration de la chaîne ou du code d'une autre casse sans section de revue sort en 4, sans squash » |
| chemins sensibles cités par git ou d'une autre casse ; citation mal formée, sortie 2 | `skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs` « CLI : un chemin que git cite entre guillemets, ou d'une autre casse, touche son motif ; une citation mal formée sort en 2 », et « parité : même verdict que motifSensibleTouche du gate », inchangé et vert |
| lien sur un index dans une PR vers develop (absolu, relatif) : sortie 4, rien d'écrit | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : un index généré remplacé par un lien symbolique (absolu ou relatif) est refusé (sortie 4), rien n'est écrit à travers lui » |
| lien déjà dans develop : la régénération s'arrête (3), la PR n'est pas renvoyée | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : un lien symbolique déjà dans develop sur un index généré arrête la régénération (sortie 3) sans renvoyer la PR, rien n'est écrit à travers lui » |
| lien dans une sous-PR (4) ; lien déjà dans le sujet, `rafraichir` (3), rien d'écrit | `skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs` « fusionner : une sous-PR qui remplace un index généré par un lien symbolique sort en 4 ; rafraichir ne régénère jamais à travers un lien déjà dans le sujet » |
| livraison : fichier en trop ou ancien fichier récrit sous un motif, revue | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : une livraison intermédiaire qui ajoute ou réécrit un fichier sous un index déclaré par motif repasse par la revue » |
| livraison : un fichier sous un motif qui est celui de develop reste dispensé | `skills/chaine/fusionner/scripts/fusionner.test.mjs` « passer.sh : une livraison intermédiaire dont un fichier sous un index par motif est celui de develop reste une livraison (sans revue) » |
| hooks d'agent inchangés | `git diff origin/main --stat -- skills/chaine/socle-chaine-de-production/references/agent/` est vide |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, au correctif qui suit |

## Vérification

Joué le 2026-11-14 dans un `git worktree` jetable de `fa7d3eb`, ce ticket appliqué mot pour mot (les deux patchs, le remplacement du § 0, les quatorze remplacements, la version), `TMPDIR` sous un dossier jetable :

- `pnpm install --frozen-lockfile && pnpm test` : **527 sur 527** (499 + 28). Sur `fa7d3eb` sans rien : 499 sur 499.
- Les vingt-huit tests nouveaux sur le code de `fa7d3eb` (le § 0 seul) : **vingt-six `not ok`**, les cent quatre autres des cinq fichiers verts. Les deux de `chemins-sensibles.mjs` sur la base y rendent une sortie vide au lieu du chemin sensible. Les six ajoutés après la décision de l'architecte y sont rouges : sortie 0 au lieu de 4 pour le chemin sensible du projet, le fichier des critères, `CLAUDE.md` et `docs/agents/` (PR vers develop et sous-PR), et `SANS_BASE` ou `lireBase` absents pour les tests unitaires. Sorties lues : 0 au lieu de 4 pour les PR et sous-PR sans revue, 0 au lieu de 4 pour le lien sur un index (le fichier hors du dépôt réécrit), 0 au lieu de 3 pour le lien déjà dans develop et pour `rafraichir`, 0 au lieu de 4 pour la livraison. Joués seuls sur `fa7d3eb`, le lien relatif (0 au lieu de 4), l'ancien fichier récrit sous un motif (0 au lieu de 4) et le `rafraichir` à travers un lien du sujet (0 au lieu de 3) sont rouges chacun. Avec le code : verts.
- Les deux gardes, en mutation : la monotonie rougit quand `c === null ||` est retiré, et quand `scripts` sort de `CODE` ; la livraison « celui de develop » rougit (4 au lieu de 0) quand tout fichier sous un motif est renvoyé à la revue.
- `bash -n` sur `github.sh`, `passer.sh`, `sujet.sh` : rien.

**Non joué** :

- **Un vrai système de fichiers insensible à la casse** (macOS, Windows) : la règle est éprouvée sur les chaînes, et les chemins `Apps/…` passent par `passer.sh` et `sujet.sh` sur le jouet (Linux).
- **GitHub réel** : qu'un workflow récrit par la PR tourne bien depuis sa tête (documenté par GitHub pour `pull_request`, non rejoué ici) ; les réglages recommandés dans `admin.md` (CODEOWNERS, rulesets), non posés sur un dépôt.
- `shellcheck`, absent du poste.

Pour la session :

1. Le § 0, puis `pnpm install --frozen-lockfile && pnpm test` : vert, **le compte de `origin/main` plus 28**.
2. Contrôles du diff :
   - `git diff origin/main --stat -- '*.test.mjs'` ne montre que `revue-exigee.test.mjs`, `chemins-sensibles.test.mjs`, `fusionner.test.mjs`, `sujet-fusionner.test.mjs` et `scripts/depot.test.mjs` ;
   - `git diff origin/main -- '*.test.mjs' | grep -c "^-.*assert"` rend **1** : la ligne de la décision 6 ;
   - `git diff origin/main --stat -- skills/chaine/socle-chaine-de-production/references/agent/` est vide.
3. `bash -n skills/chaine/fusionner/scripts/github.sh skills/chaine/fusionner/scripts/passer.sh skills/chaine/sujet/scripts/sujet.sh` : rien.
4. Revue de ticket, puis `/security-review` sur la branche : le ticket change ce que la chaîne exige et refuse. Leurs sections vont dans le corps de la PR.
5. La PR vise `main`, titre `fix(chaine): la revue exigée couvre ce que la chaîne exécute, aucun index régénéré à travers un lien (plugin <version>)`. La session :
   - part de `origin/main` et lit ce ticket sur la branche de documentation du programme, sans le modifier ;
   - commite sous les hooks, jamais `--no-verify` ;
   - ouvre sa PR hors brouillon, **sans poser `à-fusionner`** (`Label: contre-revue`) ;
   - écrit à l'architecte dès sa PR livrée.

## Hors périmètre

- **Le contenu exécuté reste exécuté** (décision 12) : un poste jetable pour le capitaine et la protection des branches chez GitHub sont des réglages, pas du code du plugin ; `admin.md` les recommande sans les poser.
- **Le lockfile que la revue ne lit pas** : `diff-revue.sh` écarte `pnpm-lock.yaml` du diff relu. Une PR qui ne change que le lockfile exige désormais la revue, mais le relecteur n'en voit rien. **Ticket 38** (décision de l'architecte : y montrer au moins les paquets ajoutés, retirés ou changés).
- **Le reste du Markdown de la racine** (`README.md`, `GLOSSARY.md`, `CHANGELOG.md`) reste dispensé (décision de l'architecte).
- **Un lien symbolique hors d'un index** : un générateur qui lit une entrée liée hors du dépôt (une carte, une ADR) en recopierait le contenu dans un index poussé. Les générateurs du socle ne recopient que des noms de fichiers ou des lignes de tableau ; c'est la limite de la décision 12. Un lien à la racine (`node_modules`, comme `0ff99d3`) exige la revue avec ce ticket (fichier de la racine hors Markdown).
- **Les autres alias d'un système de fichiers** : points finaux et flux NTFS sous Windows, caractères ignorés par HFS+. Le capitaine tourne sous Linux ou macOS (APFS).
- **`passer.sh` laissé sur `capitaine/<n>` après une régénération en échec** (déjà vrai avant ce ticket) : la PR suivante voit un worktree propre ou sort en 6.
- **Le motif d'une sous-PR renvoyée en 3** : `boucle.sh` lit la sortie 3 de `sujet.sh fusionner` comme un conflit avec le sujet. Une mise à jour de sous-PR arrêtée par un lien déjà dans le sujet (entré avant cette version) est donc renvoyée avec un motif inexact ; la sortie d'erreur dit le vrai. Cas rare, laissé tel quel.
- **Un index généré au nom cité par git** (`"`, `\`, tabulation) : `liens_sur_index` compare le chemin tel que git l'écrit ; aucun projet n'a de tel index.
- **Les dépôts de projet** : reposer `scripts/chaine/` (`revue-exigee.mjs`, `github.sh`, `passer.sh`, `sujet.sh`, `chemins-sensibles.mjs` et leurs bancs) est leur affaire.

## Comments

- 2026-11-16 — **Fait** : PR 94, fusionnée `76d90c7`, plugin 7.9.1. Contre-relue non conforme une fois : `package.yaml`/`yml`/`json5` imbriqués entraient sans revue (exécutés par lint-staged) ; corrigé, avec le repli de casse de `ſ`, CODEOWNERS explicite, et l'exception d'index de `docs/agents/` au chemin exact (relevée par `/security-review`). Limite écrite : fichiers sans extension, `Dockerfile`/`Makefile` imbriqués, YAML sous `docs/`, langages hors socle.
- 2026-11-15 — **Décision de l'architecte** sur la question du motif `/*` de CODEOWNERS (prend-il les dossiers de la racine ?) : non établi ici ; la recommandation de `admin.md` le dit et demande d'essayer le fichier sur un dépôt d'essai avant de l'appliquer (GitHub signale les erreurs de CODEOWNERS dans l'interface du fichier) ; la session de ce ticket ajoute cette phrase à `admin.md`. Pas de nouvelle relecture du ticket : la contre-relecture de la PR jouera ses propres attaques.
- 2026-11-14 — **Porté après la relecture adversaire** (agent neuf ; rejoué sur un worktree neuf de `fa7d3eb`, ticket appliqué mot pour mot) : B1, fichier exécutable et nom de configuration (`*.config.*`, `*rc`, `*rc.*`) à toute profondeur (décision 4) ; M1, une base de sujet ajoute le contrat d'`origin/develop` dans les deux scripts (décision 2) ; M2, NFC des deux côtés dans les deux scripts (décisions 5 et 8) ; M3, exception d'index de `docs/agents/` aux seules entrées littérales à `commande` (décision 3) ; M4, `admin.md` précisé (identité des sessions, approbations non retirées, CODEOWNERS sensible à la casse et qui suit le plancher, « Do not allow bypassing ») ; M5, `CLAUDE.local.md`. Joué : 527 sur 527 (499 + 28), vingt-six rouges sur `main`, les deux gardes vertes dès `main`. Coût : 23 sur 33 inchangé dans le projet mesuré ; un second projet du socle porte 60 fichiers que B1 fait entrer dans la revue (`docs/design/proto/`, `tests/`). Version : 7.9.1 tient.
- 2026-11-14 — **Décision de l'architecte** : l'exception de `chemins-sensibles.mjs` hors dépôt git ou sans `origin/develop` (contrat de la branche seul, dit sur la sortie d'erreur) est acceptée : la garde qui tient contre une PR est celle du capitaine (`revue-exigee.mjs` lu par `passer.sh` et `sujet.sh`, qui ont toujours leur base) ; `chemins-sensibles.mjs` sert la session de bonne foi.
- 2026-11-14 — **Porté après le second message de l'architecte** (rejoué sur un worktree neuf de `fa7d3eb`, ticket appliqué mot pour mot) : décision 12 gardée telle quelle (« Require review from Code Owners » sur `develop` et `main`) ; `chemins-sensibles.mjs` ajoute aux motifs de la branche ceux du contrat de la base, par le `lireBase` importé de `revue-exigee.mjs` ; base en argument (celle de l'étape 1), sinon le sujet du ticket de la branche (`identifiant.mjs`, `sujet.sh de`), sinon `origin/develop` ; base nommée illisible : chaque chemin sensible ; hors dépôt ou sans `origin/develop` : le contrat de la branche seul, pour que les bancs existants ne changent pas (décision 8). Version : 7.9.1 tient. Joué : 520 sur 520 (499 + 21), dix-neuf rouges sur `main`, les deux gardes vertes dès `main`. Coût accepté par l'architecte (+7 PR sur 33).
- 2026-11-14 — **Porté après les décisions de l'architecte** (rejoué sur un worktree neuf de `fa7d3eb`, ticket appliqué mot pour mot) : les `cheminsSensibles` et `criteresRevue` du contrat de la base s'ajoutent au plancher (`lireBase`, base en troisième argument de la CLI, contrat illisible : revue exigée pour tout chemin) ; `CLAUDE.md` à toute profondeur, `docs/agents/` (sauf un index généré de la base) et le fichier des critères exigent la revue ; `admin.md` recommande la protection GitHub, « Require review from Code Owners » sur `develop` et `main` seulement (sur toutes les branches, elle bloquerait les pushes de la chaîne : décision 12) ; lockfile au ticket 38, Markdown de la racine inchangé. Les deux clés existent déjà dans le gabarit : **7.9.1 tient**. Joué : 518 sur 518 (499 + 19), dix-sept rouges sur `main`, les deux gardes vertes dès `main`. Coût remesuré : +7 PR sur 33 dans un projet du socle (dont quatre pour `CLAUDE.md`), contre +2 avant.
- 2026-11-14 — **Décisions de l'architecte sur les cinq questions du rédacteur** : (1) **oui**, les `cheminsSensibles` du projet s'ajoutent au plancher, mais lus dans la version de la **base** (`origin/develop`, ou le sujet pour une sous-PR), jamais dans celle de la PR — sinon une PR retirerait elle-même son chemin ; `.claude/chaine.json` est déjà sous le plancher (segment à point) ; test : un chemin sensible propre au projet exige la revue, et une PR qui le retire de `chaine.json` l'exige encore ; (2) le lockfile écarté de `diff-revue.sh` : renvoyé au ticket 38 (ce que voit le relecteur) — y montrer au moins la liste des paquets ajoutés, retirés ou changés ; (3) **oui**, revue exigée pour `CLAUDE.md` (à toute profondeur), `docs/agents/` et le fichier des critères de revue du projet (lire son chemin dans `chaine.json` de la base) : une PR de documentation ne doit pas affaiblir la revue suivante sans être revue ; (4) le reste du Markdown de la racine reste dispensé (README, CHANGELOG) ; (5) **oui**, écrire dans `admin.md` une recommandation, non posée par défaut : `CODEOWNERS` sur les chemins du plancher, règle « Require review from Code Owners » et « Block force pushes » sur toutes les branches, « Restrict deletions » sur `develop` et `main`, sans liste de contournement — la frontière contre une PR hostile reste GitHub.
- 2026-11-14 — Instruit sur `fa7d3eb` (plugin 7.9.0, 499 tests). Les six points du besoin reproduits sur le dépôt jouet, chacun seul. Coût mesuré sur l'historique de ce dépôt et d'un projet du socle (+2 PR sur 33). Choix tranchés : deux listes et une inclusion testée (décision 1) ; des familles de chemins (décision 2) ; les liens refusés à l'entrée et avant toute régénération (décision 7) ; les fichiers sous un motif dispensés sur un contenu connu seulement (décision 8) ; correctif 7.9.1. Joué : 512 sur 512 (499 + 13), onze rouges sur `main`, deux gardes vertes dès `main` et rouges en mutation. Ticket réappliqué mot pour mot sur un worktree neuf : même diff que la copie jouée.
  - Questions à l'architecte : (1) lire `cheminsSensibles` à l'exécution, pour qu'un chemin sensible d'un projet hors du plancher exige la revue (remède écarté ici) ; (2) montrer au relecteur les résolutions du lockfile qui sortent du registre, que `diff-revue.sh` écarte ; (3) exiger la revue pour `CLAUDE.md`, `docs/agents/` et le fichier de critères (`criteresRevue`), que lit l'agent ; (4) le Markdown de la racine dispensé et celui de `.claude/` exigé, à garder ; (5) une protection GitHub des chemins de la chaîne (`CODEOWNERS` sur `.github/`, `.husky/`, `.claude/`, `scripts/chaine/`) à écrire dans `admin.md` du socle, seule frontière contre une PR hostile.
