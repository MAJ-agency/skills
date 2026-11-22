# Les bancs posés isolés du contrat du projet : `regles.test.mjs` lit une copie posée seule, `develop.test.mjs` quitte `references/`, et le garde qui pose les bancs de `references/` au régime 8 et au régime 7

Status: Fait — PR 156 (51596e5, plugin 8.2.1)
Type: défaut
Label: contre-revue
Modèle: sonnet — deux défauts du plugin 8.0.0 trouvés à la pose réelle d'un dépôt neuf, reproduits ici, corrigés sans rien concevoir ; le code entier est dans le patch ([`90-annexes/ticket-90.patch`](90-annexes/ticket-90.patch), sha256 `75b1e31b38b2072b1ed32d77d1a26b8acb3fe8a0077856e4f26f3c2e65dd720f`, `git apply` sur `main` à `61bf51b`, plugin 8.0.1), décrit fichier par fichier ci-dessous ; le garde rouge avant le code (deux bancs posés en échec au régime 8, un au régime 7), vert après ; les 14 mutations de [`90-annexes/mutations.mjs`](90-annexes/mutations.mjs) toutes rouges. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` (la PR 152 est entrée dans `main` à `61bf51b` : son test en fin de fichier est la base du patch) ; `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs` déplacé vers `skills/chaine/socle-chaine-de-production/scripts/develop.test.mjs` ; `skills/chaine/socle-chaine-de-production/references/CONTENU.md` ; `scripts/pose-du-socle.mjs` et `scripts/references-posees.test.mjs` (neufs) ; `README.md` (« Ajouter un skill »). Le garde pose et joue les bancs de `references/` que d'autres PR changent : la PR 154 (`claude/preuve-suffisante-socle-tests`, `c135f19`, 8.1.0) ceux de `socle-tests`, la PR 155 (`claude/preuve-suffisante-tickets`, `277e949`, 8.1.0) ceux de `tickets` ; la PR 153 (`claude/suites-relecteur`, `97428ed`, 8.0.2) ne touche, en commun, que les fichiers de version. `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` : toute PR de suite les touche, la règle du § 3 les reprend.

## Le besoin

La pose du socle de la chaîne 8.0.0 sur un dépôt neuf (essai réel du régime 8, journal du programme du 2026-11-22, 14 h 27 UTC) a trouvé deux défauts ; ce ticket les reproduit tels qu'un projet pose les bancs (`references/agent/*` → `scripts/agent/`, le contrat du gabarit `references/chaine.json` rempli, clé `relecture` comprise), et cherche les autres bancs posés du même genre. Les deux sont encore là en 8.0.1 (`61bf51b`, § 1).

1. **Bloquant : aucun dépôt posé en 8.0.0 ou 8.0.1 ne peut pousser.** `regles.test.mjs`, test « refusEdition laisse éditer .claude/skills… » (ligne 16), appelle `refusEdition(c, nouvelle)` sans `regime8` ni `sensibles` ; `regles.mjs` (lignes 47 à 56) les prend alors par défaut dans `CHAINE`, lu à côté du fichier (`new URL('../../.claude/chaine.json', import.meta.url)`, ligne 24) : posé dans un projet, c'est le contrat du projet. Au régime 8, le gabarit met `.claude/**` dans `cheminsSensibles` : `.claude/skills/chantier/SKILL.md` est refusé (« Aucune ligne lue »), le test est rouge. `check:tickets` joue `node --test … scripts/agent/*.test.mjs …` au pre-push et en CI. Dans le plugin, le banc passe : aucun contrat n'est à côté.
2. **`develop.test.mjs` sort en `ERR_MODULE_NOT_FOUND` dans un projet.** Rangé sous `references/scripts/github/`, à côté de `pr-titre.test.mjs` qui est posé (étape 4 ter), il importe `../../../../sujet/scripts/depot-jouet.mjs` et lit `../../../../../monorepo/socle-monorepo/references/husky/pre-push` : deux chemins du plugin. Copié avec son dossier, `node --test scripts/github/*.test.mjs` (étape 3 du skill) tombe à l'import. Le skill ne le pose pas (étape 9 : `develop.sh` seul ; `poses.test.mjs` : « `develop.sh` part seul, sans son banc » ; `CONTENU.md` : « testé dans le plugin ») : c'est un banc du plugin rangé là où tout le reste est posé.

Mesuré sur `ddb4265` (Node 22.23.5, git 2.43.0), dans un dépôt jouet où les skills sont posés selon leurs `SKILL.md` (`socle-monorepo` : `scripts/docs/`, `scripts/verify/` ; `tickets` ; `fusionner`, `sujet`, `revue-adversariale`, `revue-de-ticket` sous `scripts/chaine/` ; le socle de la chaîne : `scripts/agent/`, `settings-json*`, `pr-titre*`, `develop.sh`, `labels.sh`, le contrat, `index-generes.json` ; `socle-tests` : `scripts/verify/`), chacun des 56 bancs joué seul ([`90-annexes/essai-pose-8.0.0.txt`](90-annexes/essai-pose-8.0.0.txt), outils : [`poser.mjs`](90-annexes/poser.mjs), [`jouer.mjs`](90-annexes/jouer.mjs)) :

| Banc posé | Régime 8 (gabarit) | Régime 7 (gabarit sans `relecture`) |
| --- | --- | --- |
| `scripts/agent/regles.test.mjs` | **rouge** : 86 sur 87, « refusEdition laisse éditer .claude/skills… » | vert, 87 |
| `scripts/github/develop.test.mjs` (copié par erreur) | **rouge** : `ERR_MODULE_NOT_FOUND` | **rouge** : `ERR_MODULE_NOT_FOUND` |
| `scripts/verify/mutation-regles.test.mjs` (`socle-tests`) | rouge : `apps/api/stryker.config.mjs` absent du jouet (hors de ce ticket, « Ce qui a été trouvé en plus ») | rouge, même cause |
| les 53 autres (dont `fusionner.test.mjs`, 107 tests, 494 s au régime 8) | verts | verts |

## Ce qui a été trouvé en plus

Cherché : un banc posé qui lit, par un défaut, le contrat ou l'arbre du dépôt où il tourne, ou qui importe un chemin du plugin hors de ce qui est posé. Lu dans chaque source posée (`chaine.json`, `index-generes.json`, `import.meta.url`, `PROJET_RACINE`, imports statiques `../..`), puis joué.

1. **`regles.test.mjs`, trois autres cas, et une deuxième lecture par défaut.** `regles.mjs` lit aussi par défaut `CHAINE.migrations` et la liste des index générés (`scripts/docs/index-generes.json`, ligne 27, que rien ne remplace : `FICHIERS_GENERES` n'est pas un paramètre). Joué ([`90-annexes/essai-variantes.mjs`](90-annexes/essai-variantes.mjs), journal [`essai-variantes.txt`](90-annexes/essai-variantes.txt)), le banc de `ddb4265` posé au régime 8 :
   - avec un contrat qui ajoute `apps/api/**` à ses chemins sensibles (ce que la question 1 de l'étape 1 du skill demande : les dossiers sensibles du projet) : **3 rouges sur 87**, « refusEdition refuse une migration déjà livrée et laisse écrire une nouvelle » (une migration nouvelle est sensible), « …laisse éditer .claude/skills… », « refusEdition refuse le lockfile et les fichiers .env, laisse .env.example » (`apps/api/.env.example` et `apps/api/src/main.ts`) ;
   - avec un index `docs/*` dans `index-generes.json` : **3 rouges sur 87**, « …laisse éditer .claude/skills… », « refusEdition normalise le chemin… » (`docs/CODEOWNERS`) et « lot 5b, refusEdition en régime 8… » (`docs/notes.md`).
   La copie posée seule (décision 1) les isole tous : **87 verts** dans les quatre dépôts (régime 8, régime 7, chemins sensibles du projet, index `docs/*`).
2. **Aucun autre banc posé ne lit le contrat par un défaut.** `settings-json.test.mjs` et les bancs du gate `tickets` passent `PROJET_RACINE` vers leur jouet ; `garde-*.test.mjs`, `apres-edition.test.mjs`, `fin-de-tour.test.mjs` copient `regles.mjs` dans leur jouet ; `pr-titre.test.mjs` et les bancs de `scripts/chaine/` lisent le contrat de leurs dépôts jouets. Joués au régime 8 et au régime 7 : verts (table ci-dessus).
3. **Aucun autre import vers le plugin sans repli.** Les seuls imports statiques en `../..` des bancs et sources de `references/` sont celui de `develop.test.mjs` et celui de `socle-tests/references/gabarits/stryker.regles.config.mjs` (`../../scripts/verify/mutation-regles.mjs`), juste une fois posé sous `apps/api/`. Les autres chemins du plugin (`garde-commandes.test.mjs`, `garde-fichiers.test.mjs`, `pr-titre.test.mjs`, `tests-creux.test.mjs`, `coverage-diff.test.mjs`…) sont des replis derrière un `existsSync` de leur place posée.
4. **`mutation-regles.test.mjs` (`socle-tests`) lit l'arbre du projet par construction** : `apps/api/stryker.config.mjs` et `stryker.regles.config.mjs`, posés par l'étape 5 de `socle-tests`. Sans `apps/api/` (un monorepo sans API, ou une API ailleurs), il lève à l'import (`ERR_INVALID_ARG_TYPE`) ; avec les gabarits posés, il passe (le garde les pose : décision 4). À la liste des suites, au lot de `socle-tests` (`A-209` point 5).
5. **Le test sauté de l'essai réel** (« 1 000 tests sur 1 003 verts, un sauté », origine demandée) : `pr-titre.test.mjs:308`, « le workflow donne PR_OUVERTE… », sauté quand `../../ci/pr-titre.yml` n'est pas à côté : posé, le workflow vit sous `.github/workflows/`, et le banc ne le lit que dans le plugin, par choix écrit en commentaire. Gardé ; le garde l'admet nommément, et lui seul.
6. **Hors de la classe, noté** : une dizaine de bancs de `references/` laissent des dossiers dans `TMPDIR` (13 préfixes) : 94 après un seul passage, posés par le garde, dans un `TMPDIR` neuf ([`90-annexes/essai-restes.txt`](90-annexes/essai-restes.txt) : `garde-github-*` 20, `garde-illisible-*` 19, `next-id-*` 16, `mutation-regles-*` 15, `tests-creux-*` 7…). À la liste des suites (`A-209` point 5).
7. **Le garde lui-même, dans sa première écriture, avait le défaut qu'il cherche** (relecture du tour 1, `A-212`) : le jouet n'avait pas de `node_modules`, et `tests-creux.test.mjs` posé résout `typescript` à l'import (`createRequire(import.meta.url).resolve("typescript/package.json")`, ligne 18). Sur les postes des sessions, un `NODE_PATH` mène à un `typescript` installé globalement : le garde y passait. Le job `bancs` de la CI du plugin n'a pas ce chemin : il y aurait été rouge aux deux régimes (rejoué par `env -u NODE_PATH`, mutation V14). D'où le lien vers `node_modules` du plugin (décision 4) et le garde joué sous `env -u NODE_PATH` (décision 7).
8. **Aucun banc ne prouve que le hook refuse l'édition d'un index généré** (hors du ticket, `A-212`) : `FICHIERS_GENERES` privé de `INDEX_GENERES` reste vert sur les sept bancs de `agent/` ; seul le lockfile est éprouvé. C'était vrai avant ce ticket ; la copie posée seule le rend visible. À la liste des suites : un cas de `garde-fichiers.test.mjs` avec un index dans le jouet.

## Découpage

La PR 152 (8.0.1) est entrée dans `main` à `61bf51b` : le patch est écrit sur ce `main`, et le test qu'elle a ajouté en fin de `regles.test.mjs` lit lui aussi la copie isolée (88 tests sur 88, § 2). Les trois autres PR de suite partent en parallèle, **sans « Blocked by »** (`A-209` point 6) ; celle qui entre en second suit la règle du § 3. Joué : le patch s'applique, hors des deux fichiers de version, sur les sommets des PR 153 (`97428ed`), 154 (`c135f19`) et 155 (`277e949`) ; fusionné avec la PR 153, seul `NOTES-DE-VERSION.md` est en conflit ([`essai-note-depuis-la-branche.txt`](90-annexes/essai-note-depuis-la-branche.txt)). À la relecture du tour 1, le patch d'avant, fusionné avec les quatre PR à la fois, gardait le garde vert : 30 bancs, 414 tests par régime, `preuves.test.mjs` de la PR 154 compris.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` | les deux `import … from './regles.mjs'` deviennent la lecture d'une copie de `regles.mjs` posée seule sous un dossier neuf (`mkdtempSync`, retirée par `after`), et l'import dynamique du test « lot 5b, lireSensibles… » aussi ; le test « …laisse éditer .claude/skills… » devient « refusEdition et .claude/skills : laissé éditable en régime 7 ; en régime 8, sous `.claude/**` sensible, refusé sans la ligne `Sensibles:`, permis par elle », et son cas « hors accord » exige que la ligne a été lue |
| `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs` → `skills/chaine/socle-chaine-de-production/scripts/develop.test.mjs` | déplacé (`git mv`), ses trois chemins relatifs suivis (`depot-jouet.mjs`, `develop.sh`, le pre-push du gabarit), son en-tête : banc du plugin, jamais posé |
| `skills/chaine/socle-chaine-de-production/references/CONTENU.md` | « testées par `regles.test.mjs` » : la copie posée seule, et `.claude/skills/` en régime 8 ; « testé dans le plugin par un banc jamais posé (`develop.test.mjs`… » : sa place et le garde |
| `scripts/pose-du-socle.mjs` (neuf) | la pose d'un projet jouet : les bancs de `references/` à leur place de projet, leurs voisins, les dépendances de la racine (un lien vers `node_modules` du plugin, hors de l'index : `.gitignore`), le contrat du gabarit au régime 8 ou 7 ; une table |
| `scripts/references-posees.test.mjs` (neuf) | le garde : trois tests |
| `README.md` | « Ajouter un skill » : la règle, un banc sous `references/` est un banc posé, et la place d'un banc du plugin |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | 8.0.2 et sa note (§ 3 : la version suivante de `main` au moment de livrer) |

## Décisions

1. **`regles.test.mjs` lit une copie de `regles.mjs` posée seule, et non des paramètres explicites à chaque appel** (`A-209` point 1). La copie, sous `<tmp>/regles-XXXX/scripts/agent/regles.mjs`, n'a ni `.claude/chaine.json` ni `scripts/docs/index-generes.json` à côté : `CHAINE` vaut `{}`, `INDEX_GENERES` `[]`, comme dans le plugin, quel que soit le projet. Raisons : les défauts lus sont quatre (`regime8`, `sensibles`, `migrations`, et les index, qui ne sont pas un paramètre) ; une seule place isole tous les cas, ceux qui viendront et celui de la PR 152 ; `regles.mjs` ne change pas. Tout import du banc lit la copie, l'import dynamique de « lot 5b, lireSensibles… » compris. Les assertions sont les mêmes, mot pour mot, hors du deuxième test (décision 2), qui en gagne. Les hooks posés gardent leur lecture du contrat du projet : c'est ce que `garde-fichiers.test.mjs` éprouve, sur son jouet.
2. **`.claude/skills/` en régime 8 : refusé sans accord, comme tout chemin sensible** (`A-209` point 2). Le gabarit met `.claude/**` dans `cheminsSensibles` ; le hook (`garde-fichiers.mjs`, `refusEdition` avec les défauts du projet) le refuse déjà ainsi, et la revue exigée du capitaine couvre `.claude/**` (`CONTENU.md`, « La revue exigée au passage du capitaine… ») : seul le banc disait autre chose. Un skill du projet est une consigne que toute session suit, celles de relecture comprises : il relève de l'accord du produit (ligne `Sensibles:` du ticket). Le banc qui la tient : le deuxième test de `regles.test.mjs`, sur les trois chemins d'avant — régime 7 (sans contrat, puis avec `.claude/**` sensible) : `null` ; régime 8, `.claude/**` sensible : sans ticket lu, refus « Aucune ligne lue » ; hors accord, refus « hors de la ligne `Sensibles:` », jamais « Aucune ligne lue » (la ligne a été lue) ; accordé par `.claude/skills/**` : `null`. Mutations V2 à V4, V13.
3. **`develop.test.mjs` quitte `references/`, et son import n'est pas « corrigé vers ce qui est posé »** (`A-209` point 3). Il a deux chemins du plugin, pas un : l'import et le pre-push du gabarit (`HOOK_SOCLE`), qu'il augmente de la ligne de `socle-tests` et dont il compte les appels. Posé, il lirait `.husky/pre-push` du projet, que `socle-tests` augmente déjà et que le projet peut changer : le défaut même de ce ticket. Il éprouve le gabarit du pre-push et `develop.sh` ; le skill ne le pose pas. Sa place : `skills/chaine/socle-chaine-de-production/scripts/`, que `pnpm test` joue (`skills/*/*/scripts/*.test.mjs`) et que rien ne pose. Avec le garde, une règle, écrite au README (« Ajouter un skill ») : **un banc sous `references/` est un banc posé.**
4. **Le garde : tout banc de `references/`, posé au régime 8 puis au régime 7, joué d'un seul `node --test`** (`A-209` point 4). `pose-du-socle.mjs` lit les bancs sous `references/` des skills (29 sur `61bf51b` après ce patch : `socle-monorepo` 6, `tickets` 9, socle de la chaîne 9, `socle-tests` 5), pose chacun avec tout son dossier à sa place de projet (`references/agent/` → `scripts/agent/`, `references/scripts/<d>/` → `scripts/<d>/` ; ailleurs : une faute, « le poser, ou le ranger hors de references/ »), leurs voisins (les scripts de `fusionner`, `sujet`, `revue-adversariale`, `revue-de-ticket` sous `scripts/chaine/`, que le check `PR titre` appelle ; les gabarits Stryker sous `apps/api/` ; `commitlint.config.mjs` et `.husky/pre-push`), les dépendances de la racine (`node_modules`, un lien vers celles du plugin, `/node_modules` dans `.gitignore` : un projet a les siennes, `A-212`), le contrat du gabarit (`{{DEPUIS}}` rempli au régime 8, la clé `relecture` retirée au régime 7), `index-generes.json` du gabarit, puis un `git init`. Le garde exige : aucun `not ok`, sortie 0, `fail`, `cancelled` et `todo` à 0, le seul saut nommé (décision 5), au moins 350 tests joués (388 aujourd'hui), le régime du contrat posé et `.claude/**` dans ses chemins sensibles. Le régime 7 : les projets posés avant 8.0.0 reposent les mêmes bancs sans la clé, et un banc « corrigé pour le 8 » en lisant le contrat y tomberait. **La plus petite garde suffisante** : `poses.test.mjs` pose déjà les bancs de `scripts/chaine/`, sans contrat, à 493 à 572 s sur un plafond de 600 ; les y rejouer deux fois, contrat posé, le ferait déborder ; l'essai les montre verts aux deux régimes et aucun ne lit le contrat par un défaut (« Ce qui a été trouvé en plus », 2). Pas de troisième passage aux chemins sensibles d'un projet (`A-212`) : la copie posée seule les isole par construction. La table de `pose-du-socle.mjs` est séparée du garde pour s'étendre (« L'extension », plus bas).
5. **Un seul test sauté admis**, « le workflow donne PR_OUVERTE… » de `pr-titre.test.mjs` (« Ce qui a été trouvé en plus », 5), **sous-tests compris** : la ligne TAP d'un sous-test est indentée, le garde la lit (`/^ *ok \d+ - (.*) # SKIP\b/`), et un test « todo », dont l'échec ne fait rien échouer, le rougit (`A-212`). Tout autre saut est un banc qui ne se juge plus une fois posé. Mutations V7, V11, V12.
6. **Le garde joue un banc à la fois** (`--test-concurrency=1`) : `regles.test.mjs` mesure des durées (« le plafond à 20 000 caractères : chaque pire cas mesuré se lit sous 10 s… ») ; joué seul, il passe sous une charge de 16 ; dans le garde, trois enfants à la fois sous cette charge, il a dépassé. Un à la fois, le garde a passé sous la même charge ; sous une charge de 21, dans la suite entière, deux de ces cas ont encore dépassé au régime 7. **Jamais un test sauté pour une durée** (`A-209` point 5) : un cas qui dépasse sous charge se corrige (borne, banc) au ticket 91 ; aucun `--test-skip-pattern`.
7. **Le garde ne dépend d'aucun module installé hors du dépôt** (`A-212`) : aux § 1 et § 2, il se joue sous `env -u NODE_PATH`, la condition du job `bancs` de la CI. Mutation V14.
8. **À une fusion de `main`, la note se repose depuis la branche, jamais depuis l'annexe** (`A-205` point 2, `A-212`) : l'annexe porte la note d'avant les retouches de la contre-relecture.
9. **La session lit le job `bancs` de sa PR avant de rendre la main, et le dit au lanceur** (`A-212`) : ce ticket existe parce qu'un banc vert sur un poste ne disait rien ailleurs.

## Décidé, ce que le ticket laissait ouvert (`A-209`, `A-212`)

1. L'isolement de `regles.test.mjs` : la copie posée seule (`A-209` point 1).
2. `develop.test.mjs` : hors de `references/` (`A-209` point 3).
3. `mutation-regles.test.mjs` sans `apps/api/`, et les dossiers laissés dans `TMPDIR` : à la liste des suites, hors de ce ticket (`A-209` point 5).
4. Les cas de durée de `regles.test.mjs` sous charge : jamais sautés ; au ticket 91 (`A-209` point 5).
5. Le refus d'éditer un index généré, sans banc : à la liste des suites (`A-212`).

## L'extension : « le socle posé passe son propre gate »

La pose réelle en « chaîne seule » a trouvé (ticket 91) 14 erreurs ESLint dans les scripts posés et 11 références des gabarits vers des briques non posées (`check:contexte`). Le garde peut s'étendre à `pnpm lint` et `pnpm check:contexte` sur le projet jouet. Ce que cela coûte :

- **La pose de la racine** dans `pose-du-socle.mjs` : les lignes de `socle-monorepo/references/TABLE-RACINE.md` (`package.json` et ses scripts `check:*`, la configuration ESLint et Prettier, `.claude/rules/`, `CLAUDE.md`, `docs/`), la substitution des placeholders (`{{PROJET}}`, `{{SCOPE}}`, `{{DATE}}`, `{{N}}`), et les fragments du socle de la chaîne insérés à leurs marqueurs (`<!-- socle:routing -->`…). Ces gestes sont écrits en prose dans les `SKILL.md` : la table les recopierait, sans rien qui la tienne alignée, sauf à faire des tables des skills la source (`TABLE-RACINE.md` l'est déjà presque ; l'étape 2 du socle de la chaîne non). Environ 150 à 250 lignes.
- **Les dépendances de la racine** dans le jouet : celles d'un vrai projet (ESLint, ses greffons, Prettier), et non le seul `typescript` du plugin que le lien donne aujourd'hui : `pnpm install` à chaque passage, ou un lockfile du jouet versionné dans le plugin, avec son réseau ou son cache en CI : de 30 à 90 s de plus, et le registre comme dépendance du garde.
- **Le gate lui-même** : `pnpm lint` et `pnpm check:contexte` sur le jouet, environ 20 à 60 s ; deux régimes n'y changent rien (un seul passage suffit).
- **Le préalable** : les 14 erreurs et les 11 références corrigées (ticket 91), sans quoi le garde étendu naît rouge.

Soit un ticket de taille moyenne après le 91, environ 2 à 3 min de plus par `pnpm test` ; rien de ce ticket n'est à refaire (le garde gagne un test, la table des lignes).

## À faire, dans l'ordre

Chaque bloc se joue tel quel depuis la racine du dépôt, `S` étant le scratchpad de la session (`S=<son chemin absolu>`). Un geste qui ne rend pas ce qui est écrit : s'arrêter et l'écrire au lanceur, sans improviser.

### § 0 — Partir de `main`, les annexes

```bash
git fetch origin main '+refs/heads/claude/hopeful-lovelace-ouk6tz:refs/remotes/origin/claude/hopeful-lovelace-ouk6tz'
git switch -C claude/bancs-poses origin/main
mkdir -p "$S/90" && for f in ticket-90.patch mutations.mjs version-suivante.mjs; do git show "origin/claude/hopeful-lovelace-ouk6tz:docs/issues/gouverner-nos-boucles/issues/90-annexes/$f" > "$S/90/$f"; done
sha256sum "$S/90/ticket-90.patch"
git log -1 --format=%h origin/main; git show origin/main:.claude-plugin/plugin.json | grep '"version"'
pnpm install --frozen-lockfile
```

Les annexes se lisent sur la branche de documentation du programme (sur `main` si la PR de documentation qui porte ce ticket y est entrée : `git show origin/main:<chemin>`), et s'écrivent dans `S`, jamais dans le dépôt. La somme attendue : **`75b1e31b38b2072b1ed32d77d1a26b8acb3fe8a0077856e4f26f3c2e65dd720f`** ; une autre : s'arrêter. `main` attendu : `61bf51b`, `"version": "8.0.1"`. Un autre `main` (une PR de suite y est entrée, table du § 3) : les gestes des § 1 et § 2 sont les mêmes, hors de la ligne `git apply` du § 2 (« Sur un `main` bougé », au § 2), et on n'y juge que les noms (« Sur un `main` bougé », au § 2).

### § 1 — Le garde d'abord, vu rouge, dans un arbre à part

```bash
git worktree add --detach "$S/rouge" HEAD
(cd "$S/rouge" && git apply --include='scripts/*' "$S/90/ticket-90.patch" && git status --short && pnpm install --frozen-lockfile > /dev/null)
(cd "$S/rouge" && env -u NODE_PATH timeout 900 node --test --test-reporter=tap scripts/references-posees.test.mjs 2>&1 | grep -E "^# (tests|pass|fail) |^# régime|^not ok|^    \+   '")
git worktree remove --force "$S/rouge"
```

Deux fichiers posés (`git status --short` : deux lignes `??`, `scripts/pose-du-socle.mjs` et `scripts/references-posees.test.mjs`), jamais dans la branche de la session ; `pnpm install` donne à l'arbre à part le `node_modules` que le jouet lie. Le garde se joue sans `NODE_PATH` : un module global du poste ne doit pas le faire passer (décision 7). Attendu sur `61bf51b` : `# tests 3`, `# pass 1`, `# fail 2` ; `not ok 2 - les bancs de references/, posés dans un projet au régime 8…` avec `# régime 8 : 30 bancs, 389 tests, 386 verts, 1 sautés` et deux bancs en échec, `'refusEdition laisse éditer .claude/skills : les skills du plugin vivent hors du dépôt, ceux du projet sont à lui'` et `'scripts/github/develop.test.mjs'` ; `not ok 3 - … au régime 7…` avec `# régime 7 : 30 bancs, 389 tests, 387 verts, 1 sautés` et le seul `'scripts/github/develop.test.mjs'`. Recopier ces lignes dans la PR.

### § 2 — Le patch, dans la branche, et ses bancs verts

```bash
git apply "$S/90/ticket-90.patch" && git status --short
env -u NODE_PATH timeout 900 node --test --test-reporter=tap scripts/references-posees.test.mjs skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs skills/chaine/socle-chaine-de-production/scripts/develop.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^# régime|^not ok'
```

`git status --short` : cinq lignes ` M` (`.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`, `README.md`, `CONTENU.md`, `regles.test.mjs`), une ` D` (`references/scripts/github/develop.test.mjs`) et trois `??` (`scripts/pose-du-socle.mjs`, `scripts/references-posees.test.mjs`, `skills/chaine/socle-chaine-de-production/scripts/`). Attendu sur `61bf51b` : `# régime 8 : 29 bancs, 388 tests, 387 verts, 1 sautés`, la même ligne au régime 7, `# tests 102`, `# pass 102`, `# fail 0`, aucun `not ok`.

**Sur un `main` bougé** (§ 0) : le bloc du § 2 devient

```bash
git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md "$S/90/ticket-90.patch"
node "$S/90/version-suivante.mjs" "$S/90/ticket-90.patch"
git status --short
env -u NODE_PATH timeout 900 node --test --test-reporter=tap scripts/references-posees.test.mjs skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs skills/chaine/socle-chaine-de-production/scripts/develop.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^# régime|^not ok'
```

(au départ seulement, la branche n'ayant pas encore de note, l'annexe la donne ; `version-suivante.mjs` écrit la version prise), et les comptes des § 1 et § 2 sont ceux de ce `main`. On n'y juge que : au § 1, `# fail 2` et les noms en échec (les deux mêmes au régime 8, le seul `'scripts/github/develop.test.mjs'` au régime 7) ; au § 2, les mêmes neuf lignes de `git status --short`, aucun `not ok`, `# fail 0`, `1 sautés` à chaque régime, et au moins 29 bancs par régime (30 avec la PR 154, qui ajoute `preuves.test.mjs`).

Le patch, fichier par fichier (il fait foi) :

- **`regles.test.mjs`** : imports `copyFileSync, mkdirSync, mkdtempSync, rmSync`, `tmpdir`, `join`, `after`, `pathToFileURL` ; un commentaire (la copie posée seule, pourquoi, ticket 90) ; `ISOLE = mkdtempSync(join(tmpdir(), 'regles-'))`, retiré par `after` ; `regles.mjs` copié sous `ISOLE/scripts/agent/` ; les deux listes de noms d'avant, prises de `await import(REGLES)`, et `lireSensibles` de même dans « lot 5b, lireSensibles… ». Le deuxième test, renommé (décision 2), précédé de son commentaire, sur les trois chemins d'avant : `refusEdition(c, nouvelle)` → `null` ; `{ ...nouvelle, regime8: false, sensibles: ['.claude/**'] }` → `null` ; `huit = { ...nouvelle, regime8: true, sensibles: ['.claude/**'] }` : sans `accordes`, `/^\.claude\/skills\/.* chemin sensible .*\(Aucune ligne lue : /` ; `accordes` d'une copie `['docs/x.md']`, `/hors de la ligne `Sensibles:`/` et jamais `/Aucune ligne lue/` ; d'une copie `['.claude/skills/**']`, `null`. Les autres tests ne changent pas.
- **`develop.test.mjs`** (déplacé) : `'../../sujet/scripts/depot-jouet.mjs'`, `SCRIPT = join(ICI, '../references/scripts/github/develop.sh')`, `HOOK_SOCLE = join(ICI, '../../../monorepo/socle-monorepo/references/husky/pre-push')`, deux commentaires ; ses 11 tests ne changent pas.
- **`pose-du-socle.mjs`** : `destinationDuDossier`, `bancsDesReferences`, `poserLeSocle(projet, { regime })` (décision 4), le lien `node_modules` et `.gitignore` avant le commit, `environnementDeBanc` du socle pour le `git init` et le commit (sans `--no-verify` : `scripts/depot.test.mjs` refuse tout script du plugin qui saute un hook git, et le jouet n'en a pas).
- **`references-posees.test.mjs`** : `PLANCHER = 350`, `SAUTES` (décision 5) ; « destinationDuDossier : agent/ et scripts/<d>/ de references/ ont leur place, rien d'autre » ; pour 8 puis 7, « les bancs de references/, posés dans un projet au régime N (contrat du gabarit), y passent » : un `node --test --test-concurrency=1 --test-reporter=tap` enfant (décision 6), `cwd` le projet jouet, `TMPDIR` neuf, `environnementDeBanc()`, délai de 840 s ; un diagnostic `régime N : B bancs, T tests, P verts, S sautés` ; les sauts lus à tout niveau (`/^ *ok … # SKIP/`), `todo` à 0.
- **`README.md`** : un paragraphe après celui de `POSES` (la règle des bancs de `references/`, le garde, la place d'un banc du plugin).
- **`CONTENU.md`**, **`NOTES-DE-VERSION.md`** (« Ce qui change », « Ce qu'un projet fait pour en profiter » : reposer `socle-chaine-de-production`, `regles.test.mjs` ; supprimer un `scripts/github/develop.test.mjs` copié par erreur), **`plugin.json`** (8.0.2).

### § 3 — Vérifier, commiter, livrer

```bash
git add -A && git diff --cached --stat origin/main | tail -n 1
git commit -m "fix(chaine): bancs posés isolés du contrat du projet, develop.test.mjs hors de references/ (plugin <version>)"
git status --short
```

`<version>` : 8.0.2 sur `61bf51b` ; sinon celle que `version-suivante.mjs` a écrite. La dernière ligne du `--stat` : `8 files changed` ; `git status --short` vide. Puis les mutations, en tâche de fond (`run_in_background`), avec le `timeout` de l'outil Bash à `3700000` :

```bash
timeout 3600 node "$S/90/mutations.mjs" > "$S/mutations.log" 2>&1; echo "sortie $?"; grep -c '^ROUGE ' "$S/mutations.log"; grep -v '^ROUGE ' "$S/mutations.log"; git status --short
```

Attendu : `sortie 0`, `14` rouges, la seule ligne `toutes rouges`, `git status --short` vide (V5, V6, V11 et V12 ajoutent un fichier et le retirent). Une ligne `DÉLAI` n'est pas un rouge : la mutation n'a rien prouvé ; la rejouer seule (`node "$S/90/mutations.mjs" V<n>`), et si elle redépasse, s'arrêter et l'écrire au lanceur. Puis la suite entière, seule (pas pendant les mutations), en tâche de fond, avec le `timeout` de l'outil Bash à `1900000` ; noter la charge avant (`uptime`) et attendre qu'elle soit sous 3 :

```bash
uptime; timeout 1800 pnpm test > "$S/suite.log" 2>&1; echo "sortie $?"; uptime; grep -E '^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) ' "$S/suite.log"
```

Attendu : `sortie 0`, `# tests 1412`, `# pass 1412`, `# fail 0` sur `61bf51b` (1 409, plus les 3 du garde) ; ailleurs, le compte de `main` plus 3. Un cas de durée qui dépasse : jamais sauté (décision 6) ; rejouer la suite une fois sous une charge plus basse, puis l'écrire au lanceur. Puis :

```bash
git push origin claude/bancs-poses
```

La PR vers `main`, prête (pas en brouillon), sans étiquette, son titre le message du commit (112 caractères avec `(#nnn)` à 8.0.2, de même à toute version `x.y.z` à un chiffre par nombre). Dans le corps : le § 1 (rouges avant), le § 2 (verts après), le journal des mutations, la suite entière (compte, durée, charge avant et après), et la décision 2 en une phrase (`.claude/skills/` refusé sans accord en régime 8). La session ne la fusionne pas. `Label: contre-revue` : l'architecte la fait contre-relire.

**Le job `bancs` de la PR** (décision 9), en tâche de fond, avec le `timeout` de l'outil Bash à `2800000` (`<n>` : le numéro de la PR) :

```bash
timeout 2700 gh pr checks <n> --watch --interval 60; echo "sortie $?"
```

Attendu : la ligne `bancs` en `pass`, `sortie 0`. Si `gh` est refusé : l'outil GitHub MCP `pull_request_read`, méthode `get_check_runs`, toutes pages lues, relu toutes les 5 minutes (`sleep 300` en tâche de fond entre deux lectures), au plus 45 minutes : le check run `bancs` du sommet poussé en `completed`, conclusion `success`. Rouge, ou toujours en cours au bout de 45 minutes : la session ne corrige rien ; elle rend au lanceur les lignes `not ok` du journal du job (`gh run view <id> --log-failed`, ou l'outil GitHub MCP `get_job_logs`). Puis elle rend au lanceur l'URL de la PR, ces sorties et l'issue du job `bancs` (conclusion, durée), et s'arrête.

**Si `main` a bougé entre l'ouverture de la PR et sa fusion** (d'autres PR de suite prennent 8.0.2, puis 8.1.0 et plus) : fusionner `origin/main` dans la branche par un commit de fusion, jamais de rebase ni de push forcé ; **la note se repose depuis la branche, jamais depuis l'annexe** (décision 8), prise avant la fusion ; `NOTES-DE-VERSION.md` et `.claude-plugin/plugin.json` en conflit, et eux seuls, se reprennent de `main` (quand `main` porte la version même de la branche, 8.0.2 après la PR 153, `plugin.json` ne l'est pas), et la version suivante se pose de nouveau, la note au-dessus de celle de `main` :

```bash
git fetch origin main
git diff "$(git merge-base origin/main HEAD)" HEAD -- NOTES-DE-VERSION.md > "$S/90/note-de-la-branche.patch"
git merge --no-ff --no-edit origin/main; git diff --name-only --diff-filter=U
git checkout origin/main -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
node "$S/90/version-suivante.mjs" "$S/90/note-de-la-branche.patch"
git add -A && git commit --no-edit && git push origin claude/bancs-poses
```

La note se prend avant la fusion : après, la base de fusion est `origin/main` et le diff est vide. Un autre fichier en conflit : s'arrêter et l'écrire au lanceur. Puis la suite entière à nouveau, le titre de la PR à la version que `version-suivante.mjs` a écrite (le troisième nombre de celle de `main`, plus un), et le job `bancs` du nouveau sommet relu comme plus haut. Attendu, selon ce que `main` a reçu :

| `main` porte | version prise | fichiers en conflit | suite entière |
| --- | --- | --- | --- |
| 8.0.1 (`61bf51b`) | 8.0.2 | — | 1 412 |
| 8.0.2 (la PR 153) | 8.0.3 | `NOTES-DE-VERSION.md` | celle de `main` plus 3 |
| 8.0.3, ou de 8.1.0 à 8.3.0 | 8.0.4, ou 8.1.1 à 8.3.1 | `NOTES-DE-VERSION.md`, `.claude-plugin/plugin.json` | celle de `main` plus 3 |

Joué en écrivant ce ticket : la première ligne de bout en bout ; la deuxième par la fusion de la branche du patch avec la PR 153 (`97428ed`, 8.0.2), avec les deux recettes de la note : celle de l'annexe perd une retouche de la note, celle de la branche la garde ([`essai-note-depuis-la-branche.sh`](90-annexes/essai-note-depuis-la-branche.sh), journal [`essai-note-depuis-la-branche.txt`](90-annexes/essai-note-depuis-la-branche.txt)) ; la troisième ne l'est pas (les PR 154 et 155 ne sont pas encore sur `61bf51b`).

## Surfaces

| Surface | Preuve |
| --- | --- |
| `regles.test.mjs` posé au régime 8 (gabarit) passe | le garde, régime 8 ; mutation V1 |
| `regles.test.mjs` posé dans un projet à chemins sensibles ou index propres passe | « Ce qui a été trouvé en plus », 1 (variantes, 87 sur 87) ; V1 |
| `.claude/skills/` : éditable en régime 7, refusé sans accord en régime 8 (sans ticket lu : « Aucune ligne lue » ; hors accord : la ligne lue), permis par l'accord | `regles.test.mjs`, deuxième test ; V2, V3, V4, V13 |
| aucun banc posé n'importe un chemin du plugin (`develop.test.mjs` hors de `references/`) | le garde, régimes 8 et 7 ; V5 |
| un banc sous `references/` sans place de projet est une faute | le garde ; V6, V10 |
| un saut hors du seul attendu, ou un « todo », rougit, sous-tests compris | le garde ; V7, V11, V12 |
| le garde joue ce qu'il croit (plancher, régime du contrat posé) | le garde ; V8, V9 |
| le garde ne dépend d'aucun module hors du dépôt (la CI sans `NODE_PATH`) | le garde sous `env -u NODE_PATH` (§ 1, § 2) ; V14 |
| `develop.test.mjs` éprouve toujours `develop.sh` et le pre-push du gabarit | ses 11 tests, à sa place neuve (§ 2) |
| la note reposée à une fusion de `main` garde les retouches de la branche | `essai-note-depuis-la-branche.sh` (§ 3) |

## Mutations

[`90-annexes/mutations.mjs`](90-annexes/mutations.mjs), depuis la racine, la branche commitée (§ 3) : `node "$S/90/mutations.mjs"`. Chacune seule, le fichier remis (ou retiré) après, sur le banc qu'elle nomme ; pour le garde, le journal nomme les bancs posés qu'il a vus en échec (`vus : + '…'`) ; une mutation qui dépasse son délai s'écrit `DÉLAI` et ne compte pas pour rouge. V5 lit l'ancien banc dans `ddb4265` (`git show`), ancêtre de `61bf51b`. V11, V12 et V14 jouent le seul régime 8 ; V14 sans `NODE_PATH`. Journal : [`90-annexes/mutations.txt`](90-annexes/mutations.txt).

| Mutation | Banc | Issue |
| --- | --- | --- |
| V1 regles.test.mjs : le banc lit ./regles.mjs (le code d'avant), le contrat du projet entre dans ses défauts | le garde | rouge (169 s) |
| V2 regles.mjs : .claude/skills/ laissé éditable en régime 8 (l'autre décision) | `regles.test.mjs` | rouge (13 s) |
| V3 regles.mjs : le régime 8 n'est jamais appliqué | `regles.test.mjs` | rouge (12 s) |
| V4 regles.mjs : les chemins sensibles gardés en régime 7 aussi | `regles.test.mjs` | rouge (12 s) |
| V5 develop.test.mjs de retour sous references/scripts/github/ (le banc d'avant, à sa place d'avant) | le garde | rouge (158 s) |
| V6 un banc rangé sous references/ hors de agent/ et scripts/<d>/ | le garde | rouge (moins de 1 s) |
| V7 pr-titre.test.mjs : un deuxième test sauté une fois posé | le garde | rouge (160 s) |
| V8 le garde ne joue que scripts/agent/ (sous le plancher) | le garde | rouge (70 s) |
| V9 pose-du-socle.mjs : le contrat posé au régime 8 n'a pas la clé relecture | le garde | rouge (80 s) |
| V10 pose-du-socle.mjs : tout dossier de references/ a une place | le garde | rouge (158 s) |
| V11 un banc posé saute un sous-test (la ligne TAP est indentée) | le garde, régime 8 | rouge (83 s) |
| V12 un banc posé marque « todo » un sous-test rouge (jamais jugé, sortie 0) | le garde, régime 8 | rouge (85 s) |
| V13 regles.mjs : une ligne `Sensibles:` lue qui ne couvre pas le chemin est refusée comme « Aucune ligne lue » | `regles.test.mjs` | rouge (13 s) |
| V14 pose-du-socle.mjs : le jouet sans node_modules, joué sans NODE_PATH (la CI) | le garde, régime 8, sans `NODE_PATH` | rouge (81 s) |

14 rouges sur 14.

## Vérification

1. § 1 : le garde rouge sur `61bf51b`, sans `NODE_PATH`, 2 bancs en échec au régime 8, 1 au régime 7 ; § 2 : 102 verts sur 102, sans `NODE_PATH`.
2. Les mutations, depuis la racine, la branche commitée : « toutes rouges » (14).
3. La suite entière : 1 412 sur `61bf51b`, sortie 0.
4. Le job `bancs` de la PR : `success`.

### Ce qui a été joué en écrivant ce ticket

- **L'essai de pose**, sur un clone neuf à `ddb4265` (plugin 8.0.0), le 2026-11-22, Node 22.23.5, git 2.43.0 ([`essai-pose-8.0.0.txt`](90-annexes/essai-pose-8.0.0.txt), [`poser.mjs`](90-annexes/poser.mjs) puis [`jouer.mjs`](90-annexes/jouer.mjs)) : les 56 bancs posés, chacun seul, trois à la fois, au régime 8 puis au régime 7 (table du « Besoin ») ; 14:30:26 → 15:02:16 UTC, charge de 3,5 à 9,9.
- **Les variantes** ([`essai-variantes.mjs`](90-annexes/essai-variantes.mjs), [`essai-variantes.txt`](90-annexes/essai-variantes.txt)) : `regles.test.mjs` de `ddb4265`, puis celui du patch, posé au régime 8, au régime 7, avec `apps/api/**` sensible, avec un index `docs/*`.
- **La relecture du tour 1** (`A-212`, sur le patch d'avant, `ddb4265`) : les § 0 à § 3 rejoués tels quels ; le garde sous `env -u NODE_PATH`, rouge (`tests-creux.test.mjs`, « Ce qui a été trouvé en plus », 7) ; la fusion avec les quatre PR de suite à la fois, garde vert (30 bancs, 414 tests par régime) ; les sous-tests sautés et « todo » rouges que le garde ne voyait pas ; la note de l'annexe qui efface une retouche.
- **Ce ticket, sur `61bf51b`** (plugin 8.0.1), un clone neuf, Node 22.23.5, git 2.43.0, quatre cœurs partagés avec d'autres agents (charge notée aux bords de chaque passe) : le patch refait (celui d'avant hors des fichiers de version, plus les retouches du tour 1, la règle au README, la note à 8.0.2) ; `git apply --check` hors des fichiers de version sur les sommets des PR 153 (`97428ed`), 154 (`c135f19`) et 155 (`277e949`) ; § 0 (les annexes copiées du dossier de publication au lieu du `git show`, la somme vérifiée, `61bf51b`, `"version": "8.0.1"`) ; § 1 (19:13:39 → 19:16:24 UTC, charge 0,51 → 0,92 : `# tests 3`, `# pass 1`, `# fail 2`, les deux diagnostics et les noms attendus) ; § 2 (→ 19:19:06, charge 1,03 : cinq ` M`, une ` D`, trois `??` ; 29 bancs, 388 tests à chaque régime ; `# tests 102`, `# pass 102`) ; le commit du § 3 (`8 files changed, 236 insertions(+), 14 deletions(-)`, `git status --short` vide, arbre `cec09869…`) ; les mutations, la branche commitée, en tâche de fond sous `setsid --wait` ([`mutations.txt`](90-annexes/mutations.txt), 19:19:06 → 19:37:18 UTC, charge 1,03 → 1,22) : **14 rouges sur 14**, chacune pour la raison qu'elle vise (le journal nomme le banc posé vu en échec), `sortie 0`, `git status --short` vide ; la suite entière, seule, après les mutations, sous `setsid --wait`, `timeout 1800` ([`suite.txt`](90-annexes/suite.txt)) : **1 412 tests, 1 412 verts**, aucun échec, saut, annulation ni « todo » ; 17 min 03 s (19:37:44 → 19:54:47 UTC, `duration_ms` 1022734), charge 0,81 au départ, 1,37 à la fin ; la recette de la note avec la PR 153 (§ 3).

## Ce qui n'a pas été établi

1. **Un vrai dépôt posé en 8.0.2** : le garde pose ce que les `SKILL.md` disent de poser, par une table recopiée ; un geste d'une étape `poser` qu'elle ne suit pas lui échappe (l'extension, ci-dessus, en partie).
2. **Un projet dont `TMPDIR` ou `HOME` porte un `.claude/chaine.json`** au-dessus du dossier de la copie de `regles.mjs` : sans effet, la copie lit `../../.claude/chaine.json` relatif à elle-même, sous son dossier neuf.
3. **Les bancs de `scripts/chaine/` au régime 8 dans `poses.test.mjs`** : verts dans l'essai, mais rien ne les y rejoue avec un contrat (décision 4).
4. **Le job `bancs` réel de la CI du plugin** : le garde n'a tourné que sur des postes de session ; la condition de la CI est rejouée par `env -u NODE_PATH` (décision 7, V14), et la session lit le vrai job (décision 9). La suite entière n'a pas été jouée sans `NODE_PATH` : un autre banc du plugin qui dépendrait d'un module global du poste n'a pas été cherché.
5. **Le garde sous une forte charge** : deux cas de durée de `regles.test.mjs` y ont dépassé sous une charge de 21 ; au ticket 91 (décision 6).
6. **La troisième ligne de la table du § 3** : les PR 154 et 155 ne sont pas encore sur `61bf51b`.

## Hors périmètre

- `socle-tests/**` (`mutation-regles.test.mjs` sans `apps/api/`) : à la liste des suites, au lot de `socle-tests`.
- Les dossiers laissés dans `TMPDIR`, et le refus d'éditer un index généré sans banc : à la liste des suites.
- Les cas de durée de `regles.test.mjs` sous charge, les 14 erreurs ESLint et les 11 références des gabarits : ticket 91 ; le garde étendu : « L'extension ».
- `poses.test.mjs` : inchangé (son plafond).

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur l'essai réel de la pose du socle 8.0.0 (journal du programme, 14 h 27 UTC), sur un clone neuf de `main` à `ddb4265` (plugin 8.0.0) ; essais, bancs, mutations et suite joués.
- 2026-11-22 — Le rejeu sur un clone neuf a trouvé deux défauts du patch, corrigés avant publication : `pose-du-socle.mjs` commitait le jouet par `--no-verify` (la suite entière, `scripts/depot.test.mjs`, « aucun script du plugin ne saute un hook git », rouge) ; le garde jouait trois bancs à la fois, et un cas de durée de `regles.test.mjs` a dépassé sous une charge de 16 (décision 6).
- 2026-11-22 — Relecture du tour 1 (« prêt après retouches », un bloquant : le garde rouge en CI, faute de `node_modules` dans le jouet) et décisions de l'architecte (`A-212`) : le lien vers `node_modules` du plugin, le garde sous `env -u NODE_PATH`, les sous-tests sautés et « todo » vus, le cas « hors accord » distinct, l'import de `lireSensibles` isolé, la règle au README, la note reposée depuis la branche, les attendus jugés par les noms sur un `main` bougé, les questions tranchées retirées, le job `bancs` lu par la session. La PR 152 entrée (`61bf51b`, 8.0.1) : patch refait sur ce `main`, version 8.0.2 ; les § 0 à § 3, les 14 mutations et la suite rejoués depuis `61bf51b`.
