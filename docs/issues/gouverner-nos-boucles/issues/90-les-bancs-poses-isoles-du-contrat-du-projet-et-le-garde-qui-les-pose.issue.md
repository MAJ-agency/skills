# Les bancs posés isolés du contrat du projet : `regles.test.mjs` lit une copie posée seule, `develop.test.mjs` quitte `references/`, et le garde qui pose les bancs de `references/` au régime 8 et au régime 7

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — deux défauts du plugin 8.0.0 trouvés à la pose réelle d'un dépôt neuf, reproduits ici, corrigés sans rien concevoir ; le code entier est dans le patch ([`90-annexes/ticket-90.patch`](90-annexes/ticket-90.patch), sha256 `53d0ad1b1672c7e37de5fb1d4a3ce8c75c2614041b2fb5f9a76efd3d71e324af`, `git apply` sur `main` à `ddb4265`, plugin 8.0.0), décrit fichier par fichier ci-dessous ; le garde rouge avant le code (deux bancs posés en échec au régime 8, un au régime 7), vert après ; les mutations de [`90-annexes/mutations.mjs`](90-annexes/mutations.mjs) toutes rouges. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` (la PR B, PR 152, `claude/suites-capitaine` à `4afd6e2`, le touche aussi : elle ajoute un test en fin de fichier, ce patch change son en-tête et son deuxième test ; hunks disjoints, voir « Découpage ») ; `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs` déplacé vers `skills/chaine/socle-chaine-de-production/scripts/develop.test.mjs` ; `skills/chaine/socle-chaine-de-production/references/CONTENU.md` ; `scripts/pose-du-socle.mjs` et `scripts/references-posees.test.mjs` (neufs). `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` : toute PR de suite les touche, la règle du § 3 les reprend.

## Le besoin

La pose du socle de la chaîne 8.0.0 sur un dépôt neuf (essai réel du régime 8, journal du programme du 2026-11-22, 14 h 27 UTC) a trouvé deux défauts ; ce ticket les reproduit tels qu'un projet pose les bancs (`references/agent/*` → `scripts/agent/`, le contrat du gabarit `references/chaine.json` rempli, clé `relecture` comprise), et cherche les autres bancs posés du même genre.

1. **Bloquant : aucun dépôt posé en 8.0.0 ne peut pousser.** `regles.test.mjs`, test « refusEdition laisse éditer .claude/skills… » (ligne 16 sur `ddb4265`), appelle `refusEdition(c, nouvelle)` sans `regime8` ni `sensibles` ; `regles.mjs` (lignes 47 à 56) les prend alors par défaut dans `CHAINE`, lu à côté du fichier (`new URL('../../.claude/chaine.json', import.meta.url)`, ligne 24) : posé dans un projet, c'est le contrat du projet. Au régime 8, le gabarit met `.claude/**` dans `cheminsSensibles` : `.claude/skills/chantier/SKILL.md` est refusé (« Aucune ligne lue »), le test est rouge. `check:tickets` joue `node --test … scripts/agent/*.test.mjs …` au pre-push et en CI. Dans le plugin, le banc passe : aucun contrat n'est à côté.
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
4. **`mutation-regles.test.mjs` (`socle-tests`) lit l'arbre du projet par construction** : `apps/api/stryker.config.mjs` et `stryker.regles.config.mjs`, posés par l'étape 5 de `socle-tests`. Sans `apps/api/` (un monorepo sans API, ou une API ailleurs), il lève à l'import (`ERR_INVALID_ARG_TYPE`) ; avec les gabarits posés, il passe (le garde les pose : décision 4). `socle-tests/**` est fichier chaud des tickets 86 à 88 : ce ticket ne le touche pas (question 3).
5. **Le test sauté de l'essai réel** (« 1 000 tests sur 1 003 verts, un sauté », origine demandée) : `pr-titre.test.mjs:308`, « le workflow donne PR_OUVERTE… », sauté quand `../../ci/pr-titre.yml` n'est pas à côté : posé, le workflow vit sous `.github/workflows/`, et le banc ne le lit que dans le plugin, par choix écrit en commentaire. Gardé ; le garde l'admet nommément, et lui seul.
6. **Hors de la classe, noté** : une dizaine de bancs de `references/` laissent des dossiers dans `TMPDIR` (13 préfixes) : 94 après un seul passage, posés par le garde, dans un `TMPDIR` neuf ([`90-annexes/essai-restes.txt`](90-annexes/essai-restes.txt) : `garde-github-*` 20, `garde-illisible-*` 19, `next-id-*` 16, `mutation-regles-*` 15, `tests-creux-*` 7…). `nettoyage-des-bancs.test.mjs` ne garde que les dépôts jouets et trois bancs. Le garde de ce ticket pourrait l'exiger (son `TMPDIR` est neuf) : question 4.

## Découpage : sans recoupement avec la PR B

La PR B (PR 152, `claude/suites-capitaine`, sommet `4afd6e2`, 8.0.1) touche `regles.mjs` (`refusSensible`) et `regles.test.mjs` (un test ajouté en fin de fichier). Ce ticket ne touche pas `regles.mjs`, et change dans `regles.test.mjs` l'en-tête (les imports) et le deuxième test, à 1 950 lignes du test de la PR B. Joué : le patch s'applique sur `ddb4265` et, hors des deux fichiers de version, sur `4afd6e2` ; la branche du patch et `claude/suites-capitaine` se fusionnent dans les deux sens avec **le seul `NOTES-DE-VERSION.md` en conflit** (`plugin.json` porte 8.0.1 des deux côtés) ; sur `4afd6e2` plus le patch, le garde et `regles.test.mjs` sont verts (91 tests, le test de la PR B compris, qui lit lui aussi la copie isolée). **Pas de « Blocked by »** : les deux PR partent en parallèle, celle qui entre en second suit la règle du § 3. Écrire le patch sur la PR B l'aurait fait attendre sa contre-relecture sans rien gagner.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` | les deux `import … from './regles.mjs'` deviennent la lecture d'une copie de `regles.mjs` posée seule sous un dossier neuf (`mkdtempSync`, retiré par `after`) ; le test « …laisse éditer .claude/skills… » devient « refusEdition et .claude/skills : laissé éditable en régime 7 ; en régime 8, sous `.claude/**` sensible, refusé sans la ligne `Sensibles:`, permis par elle » |
| `skills/chaine/socle-chaine-de-production/references/scripts/github/develop.test.mjs` → `skills/chaine/socle-chaine-de-production/scripts/develop.test.mjs` | déplacé (`git mv`), ses trois chemins relatifs suivis (`depot-jouet.mjs`, `develop.sh`, le pre-push du gabarit), son en-tête : banc du plugin, jamais posé |
| `skills/chaine/socle-chaine-de-production/references/CONTENU.md` | « testées par `regles.test.mjs` », la copie posée seule et `.claude/skills/` en régime 8 ; « testé dans le plugin (`develop.test.mjs`… », sa place et le garde |
| `scripts/pose-du-socle.mjs` (neuf) | la pose d'un projet jouet : les bancs de `references/` à leur place de projet, leurs voisins, le contrat du gabarit au régime 8 ou 7 ; une table |
| `scripts/references-posees.test.mjs` (neuf) | le garde : trois tests |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | 8.0.1 et sa note (§ 3 : la version suivante de `main` au moment de livrer) |

## Décisions

1. **`regles.test.mjs` lit une copie de `regles.mjs` posée seule, et non des paramètres explicites à chaque appel.** La copie, sous `<tmp>/regles-XXXX/scripts/agent/regles.mjs`, n'a ni `.claude/chaine.json` ni `scripts/docs/index-generes.json` à côté : `CHAINE` vaut `{}`, `INDEX_GENERES` `[]`, comme dans le plugin, quel que soit le projet. Raisons : les défauts lus sont quatre (`regime8`, `sensibles`, `migrations`, et les index, qui ne sont pas un paramètre) ; une seule place isole les 87 cas, ceux qui viendront et celui de la PR B ; `regles.mjs` ne change pas (la PR B le touche). Les assertions sont les mêmes, mot pour mot, hors du deuxième test (décision 2), qui en gagne. Les hooks posés gardent leur lecture du contrat du projet : c'est ce que `garde-fichiers.test.mjs` éprouve, sur son jouet. Autre choix, écarté : `regime8: false, sensibles: []` dans `livree` et `nouvelle`, un paramètre `generes` ajouté à `refusEdition`, une quinzaine d'appels retouchés : question 1.
2. **`.claude/skills/` en régime 8 : refusé sans accord, comme tout chemin sensible.** Le gabarit met `.claude/**` dans `cheminsSensibles` ; le hook (`garde-fichiers.mjs`, `refusEdition` avec les défauts du projet) le refuse déjà ainsi en 8.0.0, et la revue exigée du capitaine couvre `.claude/**` (`CONTENU.md`, « La revue exigée au passage du capitaine… ») : seul le banc disait autre chose. Un skill du projet est une consigne que toute session suit, celles de relecture comprises : il relève de l'accord du produit (ligne `Sensibles:` du ticket). Le laisser éditable demanderait une exception dans `refusSensible` contre le contrat du projet, et le capitaine exigerait encore la revue sensible. **Recommandation : refusé** ; le banc qui la tient : le deuxième test de `regles.test.mjs`, sur les trois chemins d'avant — régime 7 (sans contrat, puis avec `.claude/**` sensible) : `null` ; régime 8, `.claude/**` sensible : sans ticket lu, refus « Aucune ligne lue » ; hors accord, refus « hors de la ligne `Sensibles:` » ; accordé par `.claude/skills/**` : `null`. Mutations V2 à V4.
3. **`develop.test.mjs` quitte `references/`, et son import n'est pas « corrigé vers ce qui est posé ».** Il a deux chemins du plugin, pas un : l'import et le pre-push du gabarit (`HOOK_SOCLE`), qu'il augmente de la ligne de `socle-tests` et dont il compte les appels. Posé, il lirait `.husky/pre-push` du projet, que `socle-tests` augmente déjà et que le projet peut changer : le défaut même de ce ticket. Il éprouve le gabarit du pre-push et `develop.sh` ; le skill ne le pose pas. Sa place : `skills/chaine/socle-chaine-de-production/scripts/`, que `pnpm test` joue (`skills/*/*/scripts/*.test.mjs`) et que rien ne pose. Avec le garde, une règle : **un banc sous `references/` est un banc posé.** Autre choix, écarté : le rendre posable par repli (`PROJET ? …`, comme `pr-titre.test.mjs`) : question 2.
4. **Le garde : tout banc de `references/`, posé au régime 8 puis au régime 7, joué d'un seul `node --test`.** `pose-du-socle.mjs` lit les bancs sous `references/` des skills (29 sur `ddb4265` après ce patch : `socle-monorepo` 6, `tickets` 9, socle de la chaîne 9, `socle-tests` 5), pose chacun avec tout son dossier à sa place de projet (`references/agent/` → `scripts/agent/`, `references/scripts/<d>/` → `scripts/<d>/` ; ailleurs : une faute, « le poser, ou le ranger hors de references/ »), leurs voisins (les scripts de `fusionner`, `sujet`, `revue-adversariale`, `revue-de-ticket` sous `scripts/chaine/`, que le check `PR titre` appelle ; les gabarits Stryker sous `apps/api/` ; `commitlint.config.mjs` et `.husky/pre-push`), le contrat du gabarit (`{{DEPUIS}}` rempli au régime 8, la clé `relecture` retirée au régime 7), `index-generes.json` du gabarit, puis un `git init`. Le garde exige : aucun `not ok`, sortie 0, `fail` et `cancelled` à 0, le seul saut nommé (décision 5), au moins 350 tests joués (385 aujourd'hui), le régime du contrat posé et `.claude/**` dans ses chemins sensibles. Le régime 7 : les projets posés avant 8.0.0 reposent les mêmes bancs sans la clé, et un banc « corrigé pour le 8 » en lisant le contrat y tomberait. **La plus petite garde suffisante** : `poses.test.mjs` pose déjà les bancs de `scripts/chaine/`, sans contrat, à 493 à 572 s sur un plafond de 600 ; les y rejouer deux fois, contrat posé, le ferait déborder ; l'essai les montre verts aux deux régimes et aucun ne lit le contrat par un défaut (« Ce qui a été trouvé en plus », 2). Les bancs de `references/` coûtent de 45 s (trois à la fois, charge 7) à 165 s (un à la fois, décision 6, charge 16) par régime. La table de `pose-du-socle.mjs` est séparée du garde pour s'étendre (« L'extension », plus bas).
5. **Un seul test sauté admis**, « le workflow donne PR_OUVERTE… » de `pr-titre.test.mjs` (« Ce qui a été trouvé en plus », 5) : tout autre saut est un banc qui ne se juge plus une fois posé. Mutation V7.
6. **Le garde joue un banc à la fois** (`--test-concurrency=1`) : `regles.test.mjs` mesure des durées (« le plafond à 20 000 caractères : chaque pire cas mesuré se lit sous 10 s… ») ; joué seul, il passe sous une charge de 16 ; dans le garde, trois enfants à la fois sous cette charge, il a dépassé (vu au rejeu, aux deux régimes). Un à la fois, le garde a passé sous la même charge, en 334 s pour les deux régimes ; sous une charge de 21, dans la suite entière, deux de ces cas ont encore dépassé au régime 7 (question 5). `pnpm test` joue déjà ses fichiers en parallèle : le garde n'y ajoute qu'un processus.

## Questions à l'architecte

1. **L'isolement de `regles.test.mjs` : la copie posée seule (décision 1) ou des paramètres explicites ?** Les paramètres laissent le banc lire les index du projet (seul un paramètre neuf dans `regles.mjs`, que la PR B touche, l'éviterait) et chaque cas futur doit y penser. **Recommandation : la copie.**
2. **`develop.test.mjs` hors de `references/` (décision 3), ou posable par repli ?** Posable, il éprouverait le pre-push du projet, pas celui du gabarit, et rougirait chez un projet qui l'a changé. **Recommandation : hors de `references/`.**
3. **`mutation-regles.test.mjs` sans `apps/api/`** (« Ce qui a été trouvé en plus », 4) : un ticket de `socle-tests` (après 86 à 88), qui le fait chercher la configuration là où le projet l'a posée ou sauter avec sa raison. **Recommandation : un ticket à part, au lot de `socle-tests`.**
4. **Les dossiers laissés dans `TMPDIR`** (« Ce qui a été trouvé en plus », 6) : le garde peut exiger son `TMPDIR` vide à la fin ; il serait rouge aujourd'hui (une dizaine de bancs de `references/` à corriger). **Recommandation : un ticket à part, qui ajoute l'assertion au garde avec les corrections.**
5. **Le garde rejoue les cas de durée de `regles.test.mjs`** (« le plafond à 20 000 caractères… sous 10 s », « …en temps et mémoire linéaires ») deux fois de plus par `pnpm test`. Sous une charge de 21 (d'autres agents), la suite entière du rejeu a vu deux de ces cas dépasser dans le garde, au régime 7 seulement, quand le banc joué directement passait ; `poses.test.mjs` y a aussi dépassé sa borne de 600 s (`une-sous-pr-a-la-fois.test.mjs`, le plafond déjà noté au journal). Sous une charge de 3, verte (« Ce qui a été joué »). Autre choix : `--test-skip-pattern` pour ces deux noms dans le garde, admis dans `SAUTES` ; leur durée ne dépend pas du contrat. **Recommandation : garder le garde tel quel** (la CI du plugin tourne sans autres agents ; la règle « charge sous 3 » du § 3 vaut déjà pour la suite), et sauter ces deux cas seulement si la CI les voit dépasser.

## L'extension : « le socle posé passe son propre gate »

La pose réelle en « chaîne seule » a trouvé (ticket 91) 14 erreurs ESLint dans les scripts posés et 11 références des gabarits vers des briques non posées (`check:contexte`). Le garde peut s'étendre à `pnpm lint` et `pnpm check:contexte` sur le projet jouet. Ce que cela coûte :

- **La pose de la racine** dans `pose-du-socle.mjs` : les lignes de `socle-monorepo/references/TABLE-RACINE.md` (`package.json` et ses scripts `check:*`, la configuration ESLint et Prettier, `.claude/rules/`, `CLAUDE.md`, `docs/`), la substitution des placeholders (`{{PROJET}}`, `{{SCOPE}}`, `{{DATE}}`, `{{N}}`), et les fragments du socle de la chaîne insérés à leurs marqueurs (`<!-- socle:routing -->`…). Ces gestes sont écrits en prose dans les `SKILL.md` : la table les recopierait, sans rien qui la tienne alignée, sauf à faire des tables des skills la source (`TABLE-RACINE.md` l'est déjà presque ; l'étape 2 du socle de la chaîne non). Environ 150 à 250 lignes.
- **Les dépendances de la racine** dans le jouet : `pnpm install` (ESLint, ses greffons, Prettier, TypeScript) à chaque passage, ou un lockfile du jouet versionné dans le plugin, avec son réseau ou son cache en CI : de 30 à 90 s de plus, et le registre comme dépendance du garde.
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
git show origin/main:.claude-plugin/plugin.json | grep '"version"'
pnpm install --frozen-lockfile
```

Les annexes se lisent sur la branche de documentation du programme (sur `main` si la PR de documentation qui porte ce ticket y est entrée : `git show origin/main:<chemin>`), et s'écrivent dans `S`, jamais dans le dépôt. La somme attendue : **`53d0ad1b1672c7e37de5fb1d4a3ce8c75c2614041b2fb5f9a76efd3d71e324af`** ; une autre : s'arrêter. La version de `main` : 8.0.0 (`ddb4265`) ; une autre si une PR de suite y est entrée (table du § 3) : les gestes des § 1 et § 2 sont les mêmes, le patch s'appliquant alors hors des deux fichiers de version (§ 3).

### § 1 — Le garde d'abord, vu rouge, dans un arbre à part

```bash
git worktree add --detach "$S/rouge" HEAD
(cd "$S/rouge" && git apply --include='scripts/*' "$S/90/ticket-90.patch" && git status --short)
(cd "$S/rouge" && timeout 900 node --test --test-reporter=tap scripts/references-posees.test.mjs 2>&1 | grep -E "^# (tests|pass|fail) |^# régime|^not ok|^    \+   '")
git worktree remove --force "$S/rouge"
```

Deux fichiers posés (`git status --short` : deux lignes `??`, `scripts/pose-du-socle.mjs` et `scripts/references-posees.test.mjs`), jamais dans la branche de la session. Attendu : `# tests 3`, `# pass 1`, `# fail 2` ; `not ok 2 - les bancs de references/, posés dans un projet au régime 8…` avec `# régime 8 : 30 bancs, 386 tests, 383 verts, 1 sautés` et deux bancs en échec, `'refusEdition laisse éditer .claude/skills : les skills du plugin vivent hors du dépôt, ceux du projet sont à lui'` et `'scripts/github/develop.test.mjs'` ; `not ok 3 - … au régime 7…` avec `# régime 7 : 30 bancs, 386 tests, 384 verts, 1 sautés` et le seul `'scripts/github/develop.test.mjs'`. Recopier ces lignes dans la PR.

### § 2 — Le patch, dans la branche, et ses bancs verts

```bash
git apply "$S/90/ticket-90.patch" && git status --short
timeout 900 node --test --test-reporter=tap scripts/references-posees.test.mjs skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs skills/chaine/socle-chaine-de-production/scripts/develop.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^# régime|^not ok'
```

`git status --short` : quatre lignes ` M` (`.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`, `CONTENU.md`, `regles.test.mjs`), une ` D` (`references/scripts/github/develop.test.mjs`) et trois `??` (`scripts/pose-du-socle.mjs`, `scripts/references-posees.test.mjs`, `skills/chaine/socle-chaine-de-production/scripts/`). Attendu : `# régime 8 : 29 bancs, 385 tests, 384 verts, 1 sautés`, la même ligne au régime 7, `# tests 101`, `# pass 101`, `# fail 0`, aucun `not ok`.

Le patch, fichier par fichier (il fait foi) :

- **`regles.test.mjs`** : imports `copyFileSync, mkdirSync, mkdtempSync, rmSync`, `tmpdir`, `join`, `after`, `pathToFileURL` ; un commentaire (la copie posée seule, pourquoi, ticket 90) ; `ISOLE = mkdtempSync(join(tmpdir(), 'regles-'))`, retiré par `after` ; `regles.mjs` copié sous `ISOLE/scripts/agent/` ; les deux listes de noms d'avant, prises de `await import(REGLES)`. Le deuxième test, renommé (décision 2), précédé de son commentaire, sur les trois chemins d'avant : `refusEdition(c, nouvelle)` → `null` ; `{ ...nouvelle, regime8: false, sensibles: ['.claude/**'] }` → `null` ; `huit = { ...nouvelle, regime8: true, sensibles: ['.claude/**'] }` : sans `accordes`, `/^\.claude\/skills\/.* chemin sensible .*\(Aucune ligne lue : /` ; `accordes` d'une copie `['docs/x.md']`, `/hors de la ligne `Sensibles:`/` ; d'une copie `['.claude/skills/**']`, `null`. Les 85 autres tests ne changent pas.
- **`develop.test.mjs`** (déplacé) : `'../../sujet/scripts/depot-jouet.mjs'`, `SCRIPT = join(ICI, '../references/scripts/github/develop.sh')`, `HOOK_SOCLE = join(ICI, '../../../monorepo/socle-monorepo/references/husky/pre-push')`, deux commentaires ; ses 11 tests ne changent pas.
- **`pose-du-socle.mjs`** : `destinationDuDossier`, `bancsDesReferences`, `poserLeSocle(projet, { regime })` (décision 4), `environnementDeBanc` du socle pour le `git init` et le commit (sans `--no-verify` : `scripts/depot.test.mjs` refuse tout script du plugin qui saute un hook git, et le jouet n'en a pas).
- **`references-posees.test.mjs`** : `PLANCHER = 350`, `SAUTES` (décision 5) ; « destinationDuDossier : agent/ et scripts/<d>/ de references/ ont leur place, rien d'autre » ; pour 8 puis 7, « les bancs de references/, posés dans un projet au régime N (contrat du gabarit), y passent » : un `node --test --test-concurrency=1 --test-reporter=tap` enfant (décision 6), `cwd` le projet jouet, `TMPDIR` neuf, `environnementDeBanc()`, délai de 840 s ; un diagnostic `régime N : B bancs, T tests, P verts, S sautés`.
- **`CONTENU.md`**, **`NOTES-DE-VERSION.md`** (« Ce qui change », « Ce qu'un projet fait pour en profiter » : reposer `socle-chaine-de-production`, `regles.test.mjs` ; supprimer un `scripts/github/develop.test.mjs` copié par erreur), **`plugin.json`** (8.0.1).

### § 3 — Vérifier, commiter, livrer

```bash
git add -A && git diff --cached --stat origin/main | tail -n 1
git commit -m "fix(chaine): bancs posés isolés du contrat du projet, develop.test.mjs hors de references/ (plugin <version>)"
git status --short
```

`<version>` : 8.0.1 sur `ddb4265` ; sinon celle que `version-suivante.mjs` a écrite (plus bas). La dernière ligne du `--stat` : `7 files changed` ; `git status --short` vide. Puis les mutations, en tâche de fond (`run_in_background`), avec le `timeout` de l'outil Bash à `3700000` :

```bash
timeout 3600 node "$S/90/mutations.mjs" > "$S/mutations.log" 2>&1; echo "sortie $?"; grep -c '^ROUGE' "$S/mutations.log"; grep -v '^ROUGE' "$S/mutations.log"; git status --short
```

Attendu : `sortie 0`, `10` rouges, la ligne `toutes rouges`, `git status --short` vide (V5 et V6 ajoutent un fichier et le retirent). Puis la suite entière, seule (pas pendant les mutations), en tâche de fond, avec le `timeout` de l'outil Bash à `1900000` ; noter la charge avant (`uptime`) et attendre qu'elle soit sous 3 :

```bash
uptime; timeout 1800 pnpm test > "$S/suite.log" 2>&1; echo "sortie $?"; uptime; grep -E '^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) ' "$S/suite.log"
```

Attendu : `sortie 0`, `# tests 1399`, `# pass 1399`, `# fail 0` sur `ddb4265` (1 396, plus les 3 du garde) ; ailleurs, le compte de `main` plus 3. Puis :

```bash
git push origin claude/bancs-poses
```

La PR vers `main`, prête (pas en brouillon), sans étiquette, son titre le message du commit (112 caractères avec `(#nnn)` à 8.0.1, de même à toute version `x.y.z` à un chiffre par nombre). Dans le corps : le § 1 (rouges avant), le § 2 (verts après), le journal des mutations, la suite entière (compte, durée, charge avant et après), et la décision 2 en une phrase (`.claude/skills/` refusé sans accord en régime 8). La session ne la fusionne pas. `Label: contre-revue` : l'architecte la fait contre-relire. La session rend au lanceur l'URL de la PR et ces sorties, puis s'arrête.

**Si `main` a bougé, au départ ou entre l'ouverture de la PR et sa fusion** (d'autres PR de suite prennent 8.0.1, 8.0.2, puis 8.1.0 à 8.3.0) : fusionner `origin/main` dans la branche par un commit de fusion, jamais de rebase ni de push forcé ; `NOTES-DE-VERSION.md` et `.claude-plugin/plugin.json` en conflit, et eux seuls (quand `main` porte 8.0.1, comme la branche, `plugin.json` ne l'est pas), se reprennent de `main`, et la version suivante se pose de nouveau, la note au-dessus de celle de `main` :

```bash
git fetch origin main
git merge --no-ff --no-edit origin/main; git diff --name-only --diff-filter=U
git checkout origin/main -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
node "$S/90/version-suivante.mjs" "$S/90/ticket-90.patch"
git add -A && git commit --no-edit && git push origin claude/bancs-poses
```

Une branche qui part d'un `main` déjà bougé fait de même au § 2 : `git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md "$S/90/ticket-90.patch"`, puis `node "$S/90/version-suivante.mjs" "$S/90/ticket-90.patch"`. Un autre fichier en conflit : s'arrêter et l'écrire au lanceur. Puis la suite entière à nouveau, et le titre de la PR à la version que `version-suivante.mjs` a écrite (le troisième nombre de celle de `main`, plus un). Attendu, selon ce que `main` a reçu :

| `main` porte | version prise | fichiers en conflit | suite entière |
| --- | --- | --- | --- |
| 8.0.0 (`ddb4265`) | 8.0.1 | — | 1 399 |
| 8.0.1 (la PR B, ou la PR A) | 8.0.2 | `NOTES-DE-VERSION.md` | celle de `main` plus 3 |
| 8.0.2, ou de 8.1.0 à 8.3.0 | 8.0.3, ou 8.1.1 à 8.3.1 | `NOTES-DE-VERSION.md`, `.claude-plugin/plugin.json` | celle de `main` plus 3 |

Joué en écrivant ce ticket : la première ligne de bout en bout ; la deuxième par la fusion de la branche du patch avec `claude/suites-capitaine` (`4afd6e2`, 8.0.1), dans les deux sens (« Découpage ») ; la troisième ne l'est pas (ces PR ne sont pas écrites).

## Surfaces

| Surface | Preuve |
| --- | --- |
| `regles.test.mjs` posé au régime 8 (gabarit) passe | le garde, régime 8 ; mutation V1 |
| `regles.test.mjs` posé dans un projet à chemins sensibles ou index propres passe | « Ce qui a été joué », variantes (87 sur 87) ; V1 |
| `.claude/skills/` : éditable en régime 7, refusé sans accord en régime 8, permis par l'accord | `regles.test.mjs`, deuxième test ; V2, V3, V4 |
| aucun banc posé n'importe un chemin du plugin (`develop.test.mjs` hors de `references/`) | le garde, régimes 8 et 7 ; V5 |
| un banc sous `references/` sans place de projet est une faute | le garde ; V6, V10 |
| un saut hors du seul attendu rougit | le garde ; V7 |
| le garde joue ce qu'il croit (plancher, régime du contrat posé) | le garde ; V8, V9 |
| `develop.test.mjs` éprouve toujours `develop.sh` et le pre-push du gabarit | ses 11 tests, à sa place neuve (§ 2) |

## Mutations

[`90-annexes/mutations.mjs`](90-annexes/mutations.mjs), depuis la racine, la branche commitée (§ 3) : `node "$S/90/mutations.mjs"`. Chacune seule, le fichier remis (ou retiré) après, sur le banc qu'elle nomme ; journal : [`90-annexes/mutations.txt`](90-annexes/mutations.txt). V5 lit l'ancien banc dans `ddb4265` (`git show`), ancêtre de la branche.

| Mutation | Banc | Issue |
| --- | --- | --- |
| V1 regles.test.mjs : le banc lit ./regles.mjs (le code d'avant), le contrat du projet entre dans ses défauts | le garde | rouge (336 s) |
| V2 regles.mjs : .claude/skills/ laissé éditable en régime 8 (l'autre décision) | `regles.test.mjs` | rouge (19 s) |
| V3 regles.mjs : le régime 8 n'est jamais appliqué | `regles.test.mjs` | rouge (21 s) |
| V4 regles.mjs : les chemins sensibles gardés en régime 7 aussi | `regles.test.mjs` | rouge (21 s) |
| V5 develop.test.mjs de retour sous references/scripts/github/ (le banc d'avant, à sa place d'avant) | le garde | rouge (311 s) |
| V6 un banc rangé sous references/ hors de agent/ et scripts/<d>/ | le garde | rouge (1 s) |
| V7 pr-titre.test.mjs : un deuxième test sauté une fois posé | le garde | rouge (393 s) |
| V8 le garde ne joue que scripts/agent/ (sous le plancher) | le garde | rouge (140 s) |
| V9 pose-du-socle.mjs : le contrat posé au régime 8 n'a pas la clé relecture | le garde | rouge (163 s) |
| V10 pose-du-socle.mjs : tout dossier de references/ a une place | le garde | rouge (359 s) |

10 rouges sur 10.

## Vérification

1. § 1 : le garde rouge sur `ddb4265`, 2 bancs en échec au régime 8, 1 au régime 7 ; § 2 : 101 verts sur 101.
2. Les mutations, depuis la racine, la branche commitée : « toutes rouges » (10).
3. La suite entière : 1 399 sur `ddb4265`, sortie 0.

### Ce qui a été joué en écrivant ce ticket

Sur un clone neuf de `https://github.com/MAJ-agency/skills` à `ddb4265` (plugin 8.0.0), le 2026-11-22, Node 22.23.5, git 2.43.0, quatre cœurs partagés avec d'autres agents (charge notée aux bords de chaque passe) :
- **L'essai de pose** ([`essai-pose-8.0.0.txt`](90-annexes/essai-pose-8.0.0.txt), [`poser.mjs`](90-annexes/poser.mjs) puis [`jouer.mjs`](90-annexes/jouer.mjs)) : les 56 bancs posés, chacun seul, trois à la fois, au régime 8 puis au régime 7 (table du « Besoin ») ; 14:30:26 → 15:02:16 UTC, charge de 3,5 à 9,9.
- **Les variantes** ([`essai-variantes.mjs`](90-annexes/essai-variantes.mjs), [`essai-variantes.txt`](90-annexes/essai-variantes.txt)) : `regles.test.mjs` de `ddb4265`, puis celui du patch, posé au régime 8, au régime 7, avec `apps/api/**` sensible, avec un index `docs/*`.
- **Le patch** : `git apply --check` sur `ddb4265` ; hors des deux fichiers de version, sur `4afd6e2` ; les deux fusions (« Découpage ») ; sur `4afd6e2` plus le patch, le garde (388 tests posés par régime) et `regles.test.mjs` (91) verts.
- **§ 1 à § 3 rejoués tels quels** sur un clone neuf : § 0 (les annexes copiées du dossier de publication au lieu du `git show`, la somme vérifiée), § 1 (`# tests 3`, `# pass 1`, `# fail 2`, les deux diagnostics et les noms attendus), § 2 (quatre ` M`, une ` D`, trois `??` ; `# tests 101`, `# pass 101` ; 29 bancs et 385 tests à chaque régime), le commit du § 3 (`7 files changed, 224 insertions(+), 13 deletions(-)`, `git status --short` vide, arbre `62081c60…`, le même que la branche du rédacteur).
- **Les mutations** : sur le clone neuf du rejeu, la branche commitée (arbre `62081c60…`, celui de la branche du rédacteur), **10 rouges sur 10** (16:21:54 → vers 16:51 UTC, charge de 18 à 21,5 ; la tâche de fond a été arrêtée juste après « toutes rouges », avant d'écrire sa sortie : `git status --short` vide après) ; deux passages antérieurs, sur les versions du patch d'avant les corrections du rejeu (« Comments »), avaient rendu les mêmes 10 rouges
- **La suite entière** : les quatre motifs de `pnpm test`, sur le clone neuf du rejeu, la branche commitée, d'un seul tenant, en tâche de fond sous `setsid --wait`, `timeout 1800` : **1 399 tests, 1 399 verts**, aucun échec, sauté ni annulé ; 23 min 50 s (17:26:20 → 17:50:10 UTC, `duration_ms` 1429696), charge 2,47 au départ, 5,69 à la fin ([`90-annexes/suite.txt`](90-annexes/suite.txt)). Un passage antérieur, lancé sous une charge de 21,6 (`timeout 3000`), avait rendu 1 397 sur 1 399 : `poses.test.mjs` (une tranche de `une-sous-pr-a-la-fois.test.mjs` tuée à sa borne de 600 s) et le garde au régime 7 (deux cas de durée de `regles.test.mjs`) : question 5.

## Ce qui n'a pas été établi

1. **Un vrai dépôt posé en 8.0.1** : le garde pose ce que les `SKILL.md` disent de poser, par une table recopiée ; un geste d'une étape `poser` qu'elle ne suit pas lui échappe (l'extension, ci-dessus, en partie).
2. **Un projet dont `TMPDIR` ou `HOME` porte un `.claude/chaine.json`** au-dessus du dossier de la copie de `regles.mjs` : sans effet, la copie lit `../../.claude/chaine.json` relatif à elle-même, sous son dossier neuf.
3. **Les bancs de `scripts/chaine/` au régime 8 dans `poses.test.mjs`** : verts dans l'essai, mais rien ne les y rejoue avec un contrat (décision 4).
4. **Le garde sous une forte charge** : deux cas de durée de `regles.test.mjs` y ont dépassé sous une charge de 21 (question 5) ; rien n'a été mesuré sur le poste de la CI du plugin.

## Hors périmètre

- `socle-tests/**` (`mutation-regles.test.mjs` sans `apps/api/`) : question 3, fichiers chauds des tickets 86 à 88.
- Les dossiers laissés dans `TMPDIR` : question 4.
- Les 14 erreurs ESLint et les 11 références des gabarits : ticket 91 ; le garde étendu : « L'extension ».
- `poses.test.mjs` : inchangé (son plafond).

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur l'essai réel de la pose du socle 8.0.0 (journal du programme, 14 h 27 UTC), sur un clone neuf de `main` à `ddb4265` (plugin 8.0.0) ; essais, bancs, mutations et suite joués (« Ce qui a été joué »).
- 2026-11-22 — Le rejeu sur un clone neuf a trouvé deux défauts du patch, corrigés avant publication : `pose-du-socle.mjs` commitait le jouet par `--no-verify` (la suite entière, `scripts/depot.test.mjs`, « aucun script du plugin ne saute un hook git », rouge) ; le garde jouait trois bancs à la fois, et un cas de durée de `regles.test.mjs` a dépassé sous une charge de 16 (décision 6). Le patch, sa somme, les § 1 à § 3, les mutations et la suite sont ceux d'après ces corrections.
