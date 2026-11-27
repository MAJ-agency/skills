# Un garde du plugin pose un socle en « chaîne seule » et y joue `lint` et `check:contexte` : le socle posé passe son propre gate

Status: needs-info
Type: task
Modèle: opus — une pose de la racine à porter depuis l'annexe du ticket 91 dans `scripts/pose-du-socle.mjs`, le gel des références écrit par les skills rejoué en code, un garde neuf qui joue deux scripts du projet posé sans `pnpm`, et quatre dépendances de développement du plugin ; les choix sont fixés par la décision `A-261`. Le garde a été joué à la main en écrivant ce ticket (« Vérification »). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 113
Dépendances: `eslint`, `@eslint/js`, `globals`, `typescript-eslint`
Fichiers chauds: `scripts/pose-du-socle.mjs` (une fonction neuve, `poserLaChaineSeule`, après `jouerEnGroupe` du ticket 113 ; l'en-tête, 1-3) ; **neuf** `scripts/socle-pose-passe-son-gate.test.mjs` ; `package.json` et `pnpm-lock.yaml` du plugin (par `pnpm add -D`, jamais à la main) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Seul dans sa PR, après celle de 112 et 113** : 113 ajoute `jouerEnGroupe` à `scripts/pose-du-socle.mjs`, d'où `Blocked by: 113`. Aucun des tickets 93 à 110 ne touche ces fichiers ; le ticket 111 (`needs-info`) cite `package.json` : le second à entrer relit `package.json` sur `main`. Le ticket 116 change le gabarit `index-generes.json`, que ce garde pose : la seconde PR à entrer rejoue ce garde sur `main`. Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

## Le besoin

Ticket 90, « L'extension : le socle posé passe son propre gate », et ticket 91, « Hors périmètre ». La pose réelle en « chaîne seule » a trouvé, à la main, 14 erreurs ESLint dans les scripts posés et 11 références des gabarits vers des briques non posées (`check:contexte`) ; le ticket 91 les a corrigées (le bloc `socle:poses-du-plugin`, le gel écrit). Rien, dans le plugin, ne rejoue cette pose : le prochain gabarit qui rougit le lint ou `references-agent` d'un projet neuf ne se verra qu'à une pose réelle. Le besoin : **un garde du plugin pose un dépôt « chaîne seule » comme les skills le disent, puis y joue `lint` et `check:contexte`, verts.**

## La cause, à la source

Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

1. `scripts/pose-du-socle.mjs:58-110` (`poserLeSocle`) ne pose que les scripts et leurs voisins : ni `package.json` du gabarit, ni `eslint.config.mjs`, ni `.prettierignore`, ni `CLAUDE.md`, ni `docs/`. Son en-tête (`:1-3`) le prévoit : « une table, pour que la pose de la racine […] puisse s'y ajouter sans réécrire le garde ».
2. La pose de la racine existe en annexe : `docs/issues/gouverner-nos-boucles/issues/91-annexes/poser-chaine-seule.mjs` (175 lignes, « à la main selon les SKILL.md ») et `essai-chaine-seule.sh` (le jeu : `pnpm install`, `pnpm lint`, le registre des coûts, le gel, `check:contexte`). **Rejoués sur `3daedcd`** : 170 fichiers posés, aucun placeholder restant ; `pnpm lint` sortie 0 ; après le registre des coûts (`node scripts/docs/couts.mjs`) et le gel, `references-agent : OK — 17 fichiers, 0 nouvelle, 12 gelée(s)`, `check:contexte` sortie 0 ; 0 lien markdown cassé. Les 12 gelées : quatre de `.claude/rules/tests.md` (`scripts/verify/preuves.mjs`, `scripts/verify/tests-creux.mjs`, `docs/agents/gabarits/exemple.jour-metier.spec.ts`, `docs/agents/gabarits/exemple.property.spec.ts` : `socle-tests` absent), sept sections de `docs/agents/criteres-revue.md` (`apps/api/CLAUDE.md` absent) et `scripts/db/demarrer-local.sh` de `docs/agents/pieges.md` (l'API absente).
3. Le jouet du garde n'a pour dépendances que celles du plugin, par un lien (`pose-du-socle.mjs:98-99`) : `typescript` seul (`package.json` du plugin). `eslint.config.mjs` du gabarit importe `@eslint/js`, `globals` et `typescript-eslint`. **Joué** : ces quatre paquets ajoutés au plugin par `pnpm add -D` (2 s), le jouet posé par l'annexe et lié à `node_modules` du plugin, `eslint .` sort en 0 en 1,0 s, `check:contexte` en 0,8 s ; la pose, 0,07 s. `node_modules` du plugin passe à 48 Mo.
4. Deux pièges vus en le jouant : `.gitignore` du gabarit écrit `node_modules/`, qui ne couvre pas un lien (un fichier) : `git add -A` suit le lien, et `references-agent` (qui lit les fichiers suivis) le compterait ; et `package.json` du gabarit déclare `packageManager: pnpm@9.15.4` : `pnpm` 10 du plugin y bascule de version (l'essai l'affiche : « pnpm 9.15.4 »), ce qui demande le réseau.

## Décisions

Décidée le 2026-11-27 par l'architecte : **`A-261`**. Ce qui suit l'applique ; rien n'y est à trancher.

1. **La pose** : `poserLaChaineSeule(projet)` dans `scripts/pose-du-socle.mjs`, portée de l'annexe `poser-chaine-seule.mjs` sans en changer les gestes : le plugin est `RACINE`, le jouet `projet` (un dossier vide) ; elle rend `{ poses, restes }` (les fichiers posés, les placeholders restants). Son commentaire de tête garde la phrase de l'annexe : elle recopie les `SKILL.md`, rien ne la tient alignée sur eux ; un geste qu'elle ne suit pas lui échappe.
2. **Les dépendances** : les quatre paquets de `eslint.config.mjs` du gabarit, aux bornes de `socle-monorepo/references/racine/package.json` (`^9.17.0`, `^9.17.0`, `^15.14.0`, `^8.19.1`), en dépendances de développement du plugin, par `pnpm add -D` à la racine. Le jouet les lit par le lien de `node_modules`, comme `typescript` aujourd'hui : aucune installation par passage, aucun réseau hors de l'installation de la CI.
3. **Le lien hors de l'index** : `/node_modules` dans `.git/info/exclude` du jouet, avant `git add -A`.
4. **Le jeu, sans `pnpm`** : les scripts `lint` et `check:contexte` sont lus dans `package.json` posé et lancés par `sh -c`, `node_modules/.bin` en tête du `PATH`, l'environnement de `environnementDeBanc()` sans `NODE_PATH`, par `jouerEnGroupe` (ticket 113) à une borne de 120 s. Avant `check:contexte`, les deux gestes que les skills écrivent pour le premier `pnpm check` : `node scripts/docs/couts.mjs` (socle de la chaîne, étape 3), puis le gel (étape 7 de `socle-monorepo`, étape 3 du socle de la chaîne) : chaque ligne `<fichier>:<ligne> — <nature> « <référence> » introuvable` de `node scripts/verify/references-agent.mjs` devient l'entrée `"<fichier>:<ligne>:<référence>"` de `scripts/verify/references-agent-dette.json`, comme `essai-chaine-seule.sh --geler` le fait.
5. **Le garde** : `scripts/socle-pose-passe-son-gate.test.mjs`, un seul passage (le régime n'y change rien, ticket 90, « L'extension »). Il exige : aucun placeholder restant ; `lint` sortie 0 ; la liste gelée égale, par fichier et par référence (sans numéro de ligne, qui bouge à chaque retouche d'un gabarit), aux douze de « La cause » (2), chacune avec la brique qui l'explique écrite dans le banc ; `check:contexte` sortie 0. Une référence gelée de plus, ou de moins, rougit le garde : la liste se corrige avec sa raison. Le jouet se pose sous un dossier neuf, retiré à la fin ; son `TMPDIR` est neuf et vide à la fin (`A-258`).
6. **Prettier n'est pas joué** : les 18 fichiers posés qu'il reformate encore (ticket 91, « Ce qui a été trouvé en plus », 3) rougiraient le garde. Ils vont à un ticket qui viendra après celui-ci (« Hors périmètre »).
7. **La version** : la suivante de `main` au moment de livrer, au troisième chiffre ; la note dit que rien ne change pour un projet (un garde du plugin seul).

## Où

| Fichier | Ce qui change |
| --- | --- |
| `scripts/pose-du-socle.mjs` | `poserLaChaineSeule` (décision 1), après `jouerEnGroupe` ; l'en-tête (`:1-3`) la nomme |
| `scripts/socle-pose-passe-son-gate.test.mjs` | **neuf** (décisions 3 à 5) |
| `package.json`, `pnpm-lock.yaml` | les quatre paquets (décision 2), par `pnpm add -D` |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version, la note |

Modèles : l'annexe `91-annexes/poser-chaine-seule.mjs` (la pose, à porter) et `91-annexes/essai-chaine-seule.sh` (le jeu et le gel, lignes 15-27) ; `scripts/references-posees.test.mjs` (un jouet sous un dossier neuf, son `TMPDIR`, le retrait en `finally`). `scripts/un-seul-environnement-de-banc.test.mjs` refuse tout filtre de `GIT_*` recopié : passer par `environnementDeBanc()`.

## À faire, dans l'ordre

1. **Partir de `main`**, la PR de 112 et 113 entrée : une branche neuve depuis `origin/main`.
2. **Les dépendances** (décision 2), par `pnpm add -D` (la ligne `Dépendances:` les prévoit).
3. **Le garde, rouge** : `scripts/socle-pose-passe-son-gate.test.mjs` écrit contre `poserLaChaineSeule` absente.
4. **La pose** (décision 1), puis le jeu (décisions 3 et 4). Le garde vert.
5. Un commit ; la version et sa note.
6. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| la pose « chaîne seule » : aucun placeholder restant | `scripts/socle-pose-passe-son-gate.test.mjs` |
| `lint` du projet posé, sortie 0 | de même |
| le gel : les douze références attendues, ni plus ni moins, par fichier et référence | de même |
| `check:contexte` du projet posé, sortie 0, après le registre des coûts et le gel | de même |
| le lien `node_modules` hors de l'index du jouet | de même (`git ls-files` ne le rend pas) |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| le bloc `socle:poses-du-plugin` retiré du `.prettierignore` du gabarit (ESLint relit les scripts posés) | le garde, `lint` (les 14 erreurs du ticket 91 reviennent) |
| une référence de plus vers un script absent dans un gabarit posé (`docs/agents/pieges.md` : `` `scripts/verify/absent.mjs` `` ; un chemin sous `apps/` ne compte pas : `references-agent` ignore un premier segment inconnu à la racine) | le garde, la liste gelée |
| le registre des coûts non généré | le garde, `check:contexte` (`docs/agents/couts.md` introuvable) |
| `.git/info/exclude` non écrit | le garde, le lien suivi par git |

## Vérification

1. Le garde : `env -u NODE_PATH node --test scripts/socle-pose-passe-son-gate.test.mjs`, rouge à l'étape 3, vert après ; sa durée recopiée dans la PR (attendu : quelques secondes).
2. Joué en écrivant ce ticket, sur `3daedcd`, avec l'annexe : la pose, `eslint .` à 1,0 s, le gel des douze, `check:contexte` à 0,8 s, tous en sortie 0.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass` (le compte de `main` au départ, plus les tests neufs), recopié dans la PR. La session lit le job `bancs` de sa PR (l'installation de la CI y prend les quatre paquets) avant de rendre la main.

## Ce qui n'a pas été établi

- **L'alignement de la pose sur les `SKILL.md`** : la pose est un script qui les recopie (décision 1) ; un geste écrit en prose et qu'elle ne suit pas lui échappe. Faire des tables des skills la source (`TABLE-RACINE.md` l'est presque) est un autre ticket.
- **Une pose avec services** (api, web, mobile, `socle-tests`) : non jouée ; le garde ne pose que la « chaîne seule ».
- La durée de l'installation de la CI du plugin avec les quatre paquets : non mesurée sous Actions (2 s en local, cache chaud).

## Hors périmètre

- **Les 18 fichiers posés que Prettier reformate encore** (ticket 91, « Ce qui a été trouvé en plus », 3 ; rejoué sur `3daedcd` : les mêmes 18, `.claude/rules/` 1, `.github/workflows/` 2, `CLAUDE.md`, `README.md`, `commitlint.config.mjs`, `eslint.config.mjs`, `docs/agents/` 5, `docs/features/` 3, `docs/methode/` 3). Une fois ce garde posé, `prettier` est à portée (sa dépendance s'ajoute comme les quatre de la décision 2) : un ticket suivant réécrit les gabarits au format qu'ils posent et ajoute `format:check` au garde. Il touche `docs-agents/chaine-de-production.md`, que les tickets 96 et 104 changent : il part après eux.
- Le jeu de `pnpm check` entier sur le jouet : `lint` et `check:contexte` seulement.

## Comments

- 2026-11-27 — Écrit par un agent rédacteur sur `origin/main` à `3daedcd` (plugin 8.5.0), sur la liste des suites (ticket 90, « L'extension » ; ticket 91, « Hors périmètre ») ; l'essai du ticket 91 rejoué sur `main`, puis le garde joué à la main avec les quatre paquets ajoutés à une copie du plugin.
