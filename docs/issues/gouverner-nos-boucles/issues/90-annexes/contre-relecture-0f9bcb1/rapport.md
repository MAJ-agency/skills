# PR 156, contre-relecture, tour 1 (ticket 90)

Relu : la PR 156, branche `claude/bancs-poses`, sommet `0f9bcb1aff5b7208856172d52023084e69cdd622` (`e212a38`, le patch sur `679df86`, puis la fusion de `main` à `56ba394`, 8.2.0) ; le ticket `90-les-bancs-poses-isoles-du-contrat-du-projet-et-le-garde-qui-les-pose.issue.md`, son tour de relecture (`90-relecture-tour-1/rapport.md`) et les décisions `A-209` et `A-212`, sur `claude/hopeful-lovelace-ouk6tz`. Clone neuf, Node 22.23.5, git 2.43.0, quatre cœurs partagés, un `NODE_PATH` du poste qui porte un `typescript` global.

## Verdict

**Non conforme** au sommet `0f9bcb1aff5b7208856172d52023084e69cdd622`, **aucun bloquant**, deux à corriger, quatre mineurs.

Le correctif tient. Quatre points sont établis :

- La copie de `regles.mjs` posée seule isole les 88 cas de `regles.test.mjs`, et aucune assertion n'est assouplie.
- `.claude/skills/` est refusé sans accord au régime 8 et éditable au régime 7 ; un banc le tient aux deux régimes.
- `develop.test.mjs` n'est plus cherché sous `references/`, et il garde encore `develop.sh`.
- Le garde pose les 30 bancs comme un projet les pose. Il les joue tous, pour de vrai : posés, ils jouent les mêmes tests, aux mêmes noms, que dans le plugin, le seul saut nommé à part. Les bancs de la PR 154 y sont compris (`preuves.test.mjs` 8, `mutation-regles.test.mjs` 26, `mutation-regles-synthese.test.mjs` 16).

Les 14 mutations V1 à V14 sont rouges sur `0f9bcb1`, et la CI est verte au sommet (`bancs`, 17 min 51 s).

Les deux écarts à corriger :

- **C1.** Le garde passe le `NODE_PATH` du poste aux bancs posés. Le README (« et le joue sans `NODE_PATH` ») et la note (« un `typescript` global du poste ne le fait plus passer ») disent ce que le code ne tient pas.
- **C2.** La note 8.2.1 dit « posé en 8.0.0 ou 8.0.1 » pour un défaut que portent toutes les versions de 8.0.0 à 8.2.0.

Les retouches sont dans [`retouche-156-0f9bcb1.patch`](retouche-156-0f9bcb1.patch) (sha256 `bd93e383429b91439b62ad5644e1b49541e9b052e7f3d2c887858ee5929f2e8e`, `git apply` sur `0f9bcb1`, deux fichiers, aucun fichier neuf). Une retouche facultative du mineur m1 est dans [`retouche-156-0f9bcb1-banc-vide.patch`](retouche-156-0f9bcb1-banc-vide.patch) (sha256 `3a6bd5cfa92a3acb35a2c731ec75ca5963cfcda76ccc292302ad999aeaa51979`, à appliquer après la première).

## Constats

### Bloquant

Aucun.

### À corriger

**C1. Le garde joue les bancs posés avec le `NODE_PATH` du poste.** La règle écrite et le code ne disent pas la même chose :

- Le README, au paragraphe ajouté sous « Ajouter un skill », dit : « … et le joue sans `NODE_PATH` ».
- La note 8.2.1 dit : « Il ne dépend d'aucun module installé hors du dépôt : un `typescript` global du poste ne le fait plus passer ».
- Mais `scripts/references-posees.test.mjs`, ligne 50, lance l'enfant avec `env: { ...environnementDeBanc(), TMPDIR: temporaire }`. Or `environnementDeBanc()` ne retire que `GIT_*`, `PASSER_*`, `BOUCLE_*`, `PRE_PUSH_*`, `REVUE_*`, `FORCE_COLOR` et `NODE_TEST_CONTEXT` : `NODE_PATH` passe.

Aujourd'hui, c'est le lien vers `node_modules` qui rend le garde juste. Le garde n'en garantit rien lui-même : `env -u NODE_PATH` (décision 7) n'est qu'une consigne de session, aux § 1 et § 2. Si le lien se perd, ou si un banc posé importe un module que le plugin n'installe pas, le garde reste vert sur tout poste dont le `NODE_PATH` porte ce module. Il ne rougit qu'en CI. C'est le défaut que le ticket corrige : `A-212` dit que « sa garde ne peut pas avoir le même défaut ». Le poste de cette relecture a d'ailleurs, sous son `NODE_PATH`, `typescript`, `eslint`, `prettier` et `ts-node`.

- **Joué** ([`essais/mutations-contre-0f9bcb1.txt`](essais/mutations-contre-0f9bcb1.txt)) : **C1** est V14 (le jouet sans `node_modules`), jouée avec le `NODE_PATH` du poste. Elle est **VERTE** sur `0f9bcb1` : 30 bancs, 414 tests, 413 verts, 1 sauté. La même mutation sous `env -u NODE_PATH` (V14 de l'annexe) est rouge.
- **Retouche** (dans `retouche-156-0f9bcb1.patch`) : le garde retire `NODE_PATH` de l'environnement de l'enfant (`const env = { ...environnementDeBanc(), TMPDIR: temporaire }; delete env.NODE_PATH;`), avec son commentaire. La note devient « il joue les bancs sans `NODE_PATH`, et un `typescript` global du poste ne le fait plus passer ». Le README devient vrai tel qu'il est écrit.
- **Joué sur la retouche** ([`essais/mutations-retouche.txt`](essais/mutations-retouche.txt)) : C1 est **ROUGE**, et `+ 'scripts/verify/tests-creux.test.mjs'` est vu. V8, V11, V12 et V14 restent rouges. La suite entière passe (« Ce qui a été joué »).

**C2. La note 8.2.1 date du `main` à 8.0.1.** Sa première puce dit : « **Un dépôt posé en 8.0.0 ou 8.0.1 peut pousser** ». La note a été reposée depuis la branche (décision 8), mot pour mot, entre l'annexe à 8.0.2, `e212a38` à 8.1.1 et `0f9bcb1` à 8.2.1, et la plage n'a pas suivi. Or le défaut est dans toutes les versions publiées depuis 8.0.0. Lu dans chaque `main` : l'ancien cas « refusEdition laisse éditer .claude/skills… » et `references/scripts/github/develop.test.mjs` sont présents à `ddb4265` (8.0.0), `61bf51b` (8.0.1), `2a2d215` (8.0.2), `679df86` (8.1.0) et `56ba394` (8.2.0), et absents à `0f9bcb1` seul. Un projet posé en 8.0.2, 8.1.0 ou 8.2.0 lit donc qu'il n'est pas concerné, alors que son pre-push est rouge au régime 8.

- **Retouche** (dans `retouche-156-0f9bcb1.patch`) : « **Un dépôt posé de 8.0.0 à 8.2.0 peut pousser** ».

### Mineur

**m1. Un banc posé qui n'écrit aucun test une fois posé passe le garde.** Le cas : un banc dont les tests ne s'écrivent que dans le plugin, par exemple `if (existsSync(<un chemin du plugin>)) test(…)`. Posé, il ne joue rien et ne saute rien. `node --test` le rend comme un test vert au nom de son fichier (`ok N - scripts/docs/x.test.mjs`). Aucun échec, aucun saut, et le plancher reste loin. C'est le « banc qui ne se juge plus une fois posé » de la décision 5, sans la ligne `# SKIP` que le garde lit.

- **Joué** : **C2**, un tel banc sous `socle-monorepo/references/scripts/docs/`, est **VERTE** sur `0f9bcb1` (31 bancs, 415 tests, 414 verts, 1 sauté). La forme TAP d'un banc vide est dans [`essais/delai-et-banc-vide.txt`](essais/delai-et-banc-vide.txt).
- Aucun banc d'aujourd'hui n'a ce défaut. Posés au régime 8, puis joués en place, les 30 bancs rendent les mêmes 414 noms, banc par banc ; seul `pr-titre.test.mjs` diffère, par son saut admis ([`essais/comparaison-pose-plugin.txt`](essais/comparaison-pose-plugin.txt)). Aucun `test(` n'est écrit sous condition dans les bancs de `references/` : seuls des `test(` en boucle, dans `settings-json.test.mjs`.
- **Retouche facultative** (`retouche-156-0f9bcb1-banc-vide.patch`, quatre lignes au garde, une phrase à la note) : le garde refuse toute ligne `ok N - <banc posé>`. Jouée, C2 y est **ROUGE**, avec `+ 'scripts/docs/conditionnel.test.mjs'` ; le garde passe aux deux régimes dans la suite entière. Elle ne voit pas un banc qui perd *une partie* de ses tests une fois posé (question 2).

**m2. README : « vit sous `scripts/` de son skill » n'est pas partout un lieu jamais posé.** Les `scripts/` de `fusionner`, `sujet`, `revue-adversariale` et `revue-de-ticket` sont posés en entier sous `scripts/chaine/` (`POSES` de `scripts/poses.test.mjs`) : un banc du plugin rangé là serait posé. `socle-chaine-de-production/scripts/`, la place neuve de `develop.test.mjs`, ne l'est pas, et c'est juste. Phrase proposée : « Un banc du plugin, qui lit l'arbre du plugin (un gabarit, un autre skill), vit sous `scripts/` d'un skill que rien ne pose (hors de `POSES`), jamais sous `references/` ».

**m3. `CONTENU.md` (les hooks d'agent) : « chaque cas donne son régime et ses chemins sensibles ».** C'est trop dire : la plupart des cas ne donnent rien, et valent alors pour un dépôt sans contrat. C'est ce que dit, juste, le commentaire en tête de `regles.test.mjs` : « Chaque cas donne ce qui le concerne ; sans, il vaut pour un dépôt sans contrat ». Phrase proposée : « chaque cas qui en dépend donne son régime et ses chemins sensibles ; les autres valent pour un dépôt sans contrat ».

**m4. Le délai du garde ne tue pas les petits-enfants.** `spawnSync(…, { timeout: 840_000 })` n'envoie `SIGTERM` qu'au `node --test` enfant. Le délai du test (900 s) ne peut pas jouer tant que le `spawnSync` synchrone tient le fil.

- **Joué** ([`essais/delai-et-banc-vide.txt`](essais/delai-et-banc-vide.txt)) : un `node --test` enfant dont le banc lance `sleep 47`, sous un délai de 3 s. `spawnSync` rend `ETIMEDOUT` à 3 s, et `sleep` reste orphelin (parent 1). Au délai, des processus d'un banc posé survivraient au `rmSync` du jouet. `poses.test.mjs` tue par groupe de processus (`tranches.mjs`) pour cette raison.
- Le garde a une marge d'environ dix fois sa durée : 85 à 90 s par régime ici, sous une charge de 1 à 5,6, contre 840 s. Donc à la liste des suites, pas ici.

## Questions à l'architecte

1. **m1 : la retouche facultative entre-t-elle dans cette PR ?** Elle fait quatre lignes, ne coûte aucune seconde, et C2 y est rouge. Elle tient la décision 5 pour un banc entier qui ne se juge plus. **Recommandation : oui**, avec C1 et C2, dans le même commit de retouche. Sinon, à la liste des suites.
2. **Un banc qui perd une partie de ses tests une fois posé** n'est vu ni par le garde ni par la retouche facultative. Seule une comparaison banc par banc avec le plugin le verrait : environ 80 s de plus par `pnpm test`, ou les noms rendus par le plugin, gardés à côté. **Recommandation : pas dans ce ticket.** La mesure d'aujourd'hui est faite (mêmes noms, banc par banc), et le garde étendu (« L'extension ») est le bon moment.
3. **m4, le délai du garde par groupe de processus.** **Recommandation : à la liste des suites**, avec les dossiers laissés dans `TMPDIR` (`A-209` point 5).

## Ce qui a été joué

Clone neuf de `https://github.com/MAJ-agency/skills`, `git fetch origin claude/bancs-poses claude/hopeful-lovelace-ouk6tz main`, sommet `0f9bcb1` détaché, `pnpm install --frozen-lockfile`. Un passage lourd à la fois, en tâche de fond sous `setsid --wait`, `TMPDIR` privé, charge notée aux bords.

- **Le contenu de la PR** : `e212a38` est `679df86` plus `ticket-90.patch` (sha256 `75b1e31b…`, vérifiée) hors des fichiers de version. Le diff de `679df86` à `e212a38` et celui de `56ba394` à `0f9bcb1` sont identiques hors des fichiers de version et des lignes `index`. Huit fichiers changés : `236 insertions(+), 14 deletions(-)`. La note 8.2.1 est mot pour mot celle de `e212a38` (8.1.1) et celle de l'annexe (8.0.2), hors du titre.
- **Le titre** : 105 caractères, 112 avec ` (#156)`, sous 120. La version 8.2.1 est le troisième nombre de `main` plus un ; la note est au-dessus de 8.2.0, et `plugin.json` est à 8.2.1. Le message de `e212a38` dit encore « 8.1.1 » : sans effet, la fusion par squash prend le titre de la PR.
- **La CI au sommet** (outil GitHub en lecture) : `bancs` `success` (21:00:22 → 21:18:13 UTC, 17 min 51 s ; la PR 154 : 17 min 09 s), CodeQL `success`.
- **Le garde sous `env -u NODE_PATH`** ([`essais/garde-0f9bcb1.txt`](essais/garde-0f9bcb1.txt), 21:25:58 → 21:28:55 UTC, charge 5,59 → 5,64) : `# tests 3`, `# pass 3`, `# fail 0`. Aux deux régimes : 30 bancs, 414 tests, 413 verts, 1 sauté. Durée 177 s.
- **Les bancs posés, test par test** ([`essais/comparaison-pose-plugin.txt`](essais/comparaison-pose-plugin.txt), outils [`jouer-garde.mjs`](essais/jouer-garde.mjs), [`rapporteur.mjs`](essais/rapporteur.mjs) et [`comparer.mjs`](essais/comparer.mjs)). Les 30 bancs sont posés au régime 8 comme le garde les pose, puis joués en place, sans `NODE_PATH` : 85 s posés, 82 s dans le plugin. Banc par banc, ce sont les mêmes noms et les mêmes comptes (414), tous au premier niveau, aucun « todo ». Seul `pr-titre.test.mjs` diffère : 1 sauté une fois posé, « le workflow donne PR_OUVERTE… ».
  - **Les bancs de la PR 154 sont joués pour de vrai.** Posés, `mutation-regles.test.mjs` trouve les gabarits Stryker posés sous `apps/api/` (`../../gabarits` n'existe pas dans le jouet). `preuves.test.mjs` et `coverage-diff.test.mjs` lisent `../docs/environnement-de-banc.mjs` posé.
- **Lu : l'isolement de `regles.test.mjs`.**
  - `regles.mjs` n'importe que `node:fs` et `node:path`. Il ne lit que `CHAINE` (`../../.claude/chaine.json`) et `INDEX_GENERES` (`../docs/index-generes.json`), tous deux relatifs à lui-même, et rien sous le dossier courant ni l'environnement. La copie sous un dossier neuf les isole donc tous.
  - Le banc n'importe d'ailleurs que `./demarrage.mjs`, dont les fonctions jouées sont pures et ne lisent pas le contrat. Il ne lance aucun hook.
  - Le diff du banc a trois morceaux : les imports, le deuxième test (renforcé : ses trois anciens cas, plus le régime 7 à `.claude/**` sensible, et au régime 8 sans ticket, hors accord et accordé) et l'import de `lireSensibles`. Aucune autre assertion ne change.
  - L'import dynamique ne lève plus à la liaison pour un export disparu, mais chaque nom importé est appelé ou comparé. **C4** (`RAISON_ILLISIBLE` qui n'est plus exportée) est **ROUGE**.
- **Lu : la pose comme un projet la fait.** Les tables des `SKILL.md` (`tickets`, `socle-tests`, `TABLE-RACINE.md` : `references/scripts/<d>/*` → `scripts/<d>/`) et du socle de la chaîne (étape 2.3 : `index-generes.json` ; 2.4 : `agent/*` ; 4 bis et 4 ter ; 9 : `develop.sh`), les voisins (`scripts/chaine/`, les gabarits Stryker, `commitlint.config.mjs`, `.husky/pre-push`) et le contrat du gabarit (régime 8 : `{{DEPUIS}}` rempli ; régime 7 : `relecture` retirée). Ce que le garde ne pose pas (`labels.sh`, la CI, `.claude/settings.json`, `docs/`), aucun banc posé ne le lit, hors du workflow du saut admis.
  - Un banc neuf rangé sous `references/` hors de `agent/` et `scripts/<d>/` est une faute (V6, V10).
  - Le plancher est de 350, pour 414 tests joués.
- **Lu : `develop.test.mjs`.** Plus rien ne le cherche sous `references/` : `git grep` ne le trouve que dans `CONTENU.md` et la note, mis à jour, et dans des tickets clos de `docs/issues/`. `poses.test.mjs` et `depot.test.mjs` ne nomment que `develop.sh`. Sa place neuve est jouée par `pnpm test` (`skills/*/*/scripts/*.test.mjs`) et n'est dans aucun `POSES`. **C5** (`develop.sh` qui ne pousse plus) est **ROUGE** sur le banc déplacé.
- **Les mutations V1 à V14 de l'annexe, sur `0f9bcb1`** ([`essais/mutations-v1-v14-0f9bcb1.txt`](essais/mutations-v1-v14-0f9bcb1.txt), 21:32:22 → 21:51:06 UTC, charge 1,67 → 1,19) : `sortie 0`, **14 rouges**, `toutes rouges`, `git status --short` vide. Le journal nomme chaque banc vu en échec : V1 au seul régime 8 (le deuxième test) ; V5 aux deux régimes (`scripts/github/develop.test.mjs`) ; V14 (`scripts/verify/tests-creux.test.mjs`).
- **Mes mutations** ([`mutations-contre.mjs`](essais/mutations-contre.mjs), [`essais/mutations-contre-0f9bcb1.txt`](essais/mutations-contre-0f9bcb1.txt), 21:51:23 → 21:56:13 UTC, charge 0,93 → 1,10, chacune à son attendu) :
  - **C1** VERTE (constat C1) ; **C2** VERTE (m1).
  - **C3** (`regles.mjs` qui lit le contrat sous le dossier courant) ROUGE : le garde, au régime 8, voit `regles.test.mjs` et les bancs des hooks. La copie seule n'aurait pas isolé cette classe, et le garde la voit.
  - **C4** ROUGE.
  - **C5** ROUGE.
  - **C6** (le refus « hors accord » sans sa raison) ROUGE.
- **La retouche** (`0f9bcb1` plus les deux patchs, [`essais/mutations-retouche.txt`](essais/mutations-retouche.txt), 21:57:16 → 22:05:32 UTC, charge 0,37 → 1,14) : C1 et C2 sont ROUGES. V8, V11, V12 et V14 restent ROUGES. `git status --short` est vide. Les deux patchs s'appliquent sur `0f9bcb1` (`git apply --check`), l'un après l'autre.
- **La suite entière, une seule, sur la retouche, sous `env -u NODE_PATH`** (la condition de la CI ; [`essais/suite-retouche.txt`](essais/suite-retouche.txt)) : 22:05:52 → 22:23:12 UTC, charge 0,81 → 2,34 (d'autres agents sur le poste). `sortie 0`, **1 459 tests, 1 459 verts** : le compte de la CI au sommet, la retouche n'ajoutant aucun test. Aucun échec, saut, annulation ni « todo » ; `duration_ms` 1039572. Dans la suite, le garde de la retouche passe aux deux régimes : 30 bancs, 414 tests, 413 verts, 1 sauté, en 102 s puis 105 s. `git status --short` est vide après.
- **La durée** : le garde ajoute deux passages en série d'environ 85 à 90 s, qui occupent un cœur, sous une charge de 1 à 5,6. En CI, le job passe de 17 min 09 s (PR 154) à 17 min 51 s. Dans la suite jouée ici, `poses.test.mjs` tient 614 s sur son plafond de 1 800 s (34,1 %). Sa marge la plus courte est de 48,5 % (une tranche de `une-sous-pr-a-la-fois.test.mjs`, 309 s sur la borne de 600 s de ses dix tests), pendant que le garde tournait à côté.

## Ce qui n'a pas été établi

1. **La CI sur la retouche** : rien n'a été poussé. La condition de la CI est rejouée par `env -u NODE_PATH`, et la retouche la rend vraie par construction.
2. **La comparaison test par test au régime 7** : seuls les comptes du garde ont été lus à ce régime (414, 413 verts, 1 sauté). Le contrat n'y diffère que par la clé `relecture`.
3. **Le garde sous une charge de 16 à 21** : non rejoué, faute de cette charge. Les cas de durée de `regles.test.mjs` sont au ticket 91.
4. **Un vrai dépôt posé en 8.2.1** : le garde pose par une table recopiée des `SKILL.md` (le point 1 du ticket le dit déjà).
5. **Un banc qui perd une partie de ses tests une fois posé** : il n'est cherché que par la comparaison d'aujourd'hui (question 2).
