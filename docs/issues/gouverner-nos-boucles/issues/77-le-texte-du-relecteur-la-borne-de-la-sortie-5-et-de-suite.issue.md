# Le texte du Relecteur, suites des PR 147 et 149 : la borne de la sortie 5, « rejouer au réveil suivant », « de suite », la sortie 69

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — les suites de texte d'`A-189` (points 1 à 3) et la suite de la sortie 6 que le ticket 75 ouvre (`A-192`, point 1), chacune mot pour mot ; le texte entier est dans le patch ([`77-annexes/ticket-77.patch`](77-annexes/ticket-77.patch), sha256 `6aac8d63ffa63c50591fd58087fb61570b5ffbb67e009cac2e01c0d661b60e62`, `git apply` sur `97d17e3`), avec la version et la note de la PR A ; les phrases sont exigées à leur place par le banc des textes, rouge avant, vert après ; les mutations de [`77-annexes/mutations.mjs`](77-annexes/mutations.mjs) toutes rouges ; puis la vérification et la livraison de la PR entière. Rien n'est à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas. Dernier des trois tickets de la PR A (ticket 75, « Une PR, trois tickets »).
Blocked by: 76
Dépendances: —
Fichiers chauds: `skills/chaine/relecteur/SKILL.md`, `skills/chaine/relecteur/references/CONTENU.md`, `scripts/relecteur.test.mjs` : aucun autre ticket ouvert ne les touche (le lot 6 ne nomme pas le skill `relecteur` ; s'il venait à changer `scripts/relecteur.test.mjs`, qui compare aussi des lignes de `architecte/references/lancement.md`, la PR qui entre en second fusionne `main` et rejoue ce banc). `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` : portés ici pour la PR A ; la PR B les touche aussi ; la version est la suivante de `main` au moment de livrer (§ 3).

## Le besoin

La contre-relecture de la PR 147 (`67-annexes/contre-relecture-686dcc6/rapport.md`, constats 7 à 12) et sa décision, `A-189` :

1. **Constat 8 et `A-189` point 2 — la sortie 5 de `jouer` n'a pas de borne, et sa suite ne se lit pas « rejouer au réveil suivant ».** La table dit « `| 5 | GitHub n'a pas répondu : rien, le réveil suivant rejoue |` ». `--attendre` se déclenche sur une suite « rejouer au réveil suivant » : une session qui lit à la lettre relance la veille sans pause après un 5. Et `jouer` est seul à lire les événements de la PR : une panne de cette seule lecture fait réveiller la session à chaque sonde (`passe` rend le geste), `jouer` sort en 5, sans fin et sans une ligne (essai K7). `A-189` : au second 5 de suite sur la même PR, la ligne à l'architecte et `--taire <n>`, comme la sortie 7 ; les deux suites qui renvoient au réveil suivant, et celle de `create_session` en échec (« rejouer le geste au réveil suivant »), s'écrivent « rejouer au réveil suivant ».
2. **Constat 11 — « à la seconde fois » ne dit pas « de suite »** (9, 12, « autre », `create_session`) : une sortie 12 un jour et une autre le lendemain arrêteraient le Relecteur. `A-182` point 4 dit « rejouer une fois, puis… ». La sortie 7 (« au second refus ») a la même lecture.
3. **Constat 10 — la ligne `reecrire` dit que `jouer <n> --sessions <fichier>` « rend `remplacer` »** ; il rend `panne` quand une session a déjà été remplacée dans ce tour (`decider`, règle 5), et ses lignes sont alors à envoyer.
4. **Constat 9 — « sans les deux champs, `couple` »** se lit aussi « si les deux champs manquent » ; la phrase qui suit dit qu'un champ absent laisse une session attendue `vivante`.
5. **Constat 7 et `A-189` point 1 — le plafond rejoué** redit « décision de plafond attendue » : gardé, à écrire dans « Les lignes », qui dit aujourd'hui « rejoué, il n'en rend aucune » (le script l'écrit au ticket 76).
6. **Le ticket 75** fait sortir le Relecteur en 6 sur une sortie 69 d'un calcul : la ligne de la sortie 6 le nomme.

Le constat 12 (un titre prescrit sous 120 caractères) ne touche aucun fichier du dépôt : les titres prescrits par les tickets 75 à 79 le sont (§ 3 : 98 caractères, 105 avec « (#nnn) »).

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/relecteur/SKILL.md` | « À chaque réveil », la ligne `reecrire` ; « Les sorties », les lignes 5, 6, 7, 9, 12 et « autre » ; « Créer ou relancer les sessions », `create_session` en échec ; « L'état des sessions », `reecrire` et ses deux champs ; « Les lignes », le plafond rejoué ; « La veille », « de suite » |
| `skills/chaine/relecteur/references/CONTENU.md` | « Le banc », une phrase pour les tickets 75 et 76 |
| `scripts/relecteur.test.mjs` | trois cas suivent le texte (« de suite », un champ absent) ; un cas neuf, à la fin |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante de `main`, et la note de la PR A (tickets 75 à 77) |

## Décisions

Les phrases, mot pour mot (le patch fait foi) :

1. **La sortie 5** : « `| 5 | GitHub n'a pas répondu : rejouer au réveil suivant ; \`jouer <n>\` sorti en 5 pour la seconde fois de suite sur la même PR : l'architecte, et \`--taire <n>\` |` ». La ligne à l'architecte est la première forme, « PR <n> : <cause> ; PR tue », sa cause « jouer sortie 5 : <dernière ligne de sa sortie d'erreur> » (« Les lignes », déjà). Une sortie 5 de `passe` ou de `distribuer` garde « rejouer au réveil suivant », sans borne : la veille, qui joue `passe`, fait déjà sa pause sur un 5 (`PAUSE`).
2. **« de suite »** sur chaque borne : 7 (« au second refus de suite, l'architecte et `--taire <n>` »), 9, 12, « autre » (« à la seconde fois de suite, l'architecte, et s'arrêter »), `create_session` en échec, et la phrase de `--attendre` (« compterait pour la seconde fois de suite »).
3. **`create_session` en échec pour une autre cause** : « rejouer au réveil suivant ; à la seconde fois de suite, l'architecte, et `--taire <n>` ».
4. **La ligne `reecrire`** : « … `jouer <n> --sessions <fichier>`, qui rend `remplacer`, ou `panne` (une session déjà remplacée dans ce tour) : ses lignes (« Les lignes ») ».
5. **`reecrire` et les deux champs** : « `reecrire`, qui réemploie la session, suit cette règle de « Créer ou relancer » : il lui faut les deux champs ; un champ absent, `couple`. »
6. **Le plafond rejoué**, dans « Les lignes », après « rejoué, il n'en rend aucune. » : « Une exception, voulue : rejoué après un retrait refusé, un plafond redit « décision de plafond attendue » à l'auteur et au conducteur (son étiquette s'est posée avant son commentaire) ; ces lignes partent comme les autres. »
7. **La sortie 6** : « …, un calcul dit qu'un outil de la chaîne manque au poste (sa sortie 69 : git plus ancien que 2.41, `jq` absent), ou `flock` manque : l'architecte, et s'arrêter ».
8. **Le banc des textes** exige chaque phrase à sa ligne ou dans sa section (`ligne`, `section`, `exigerA`, déjà dans le fichier), et qu'aucune borne ne dise plus « à la seconde fois, », ni la sortie 5 « le réveil suivant rejoue », ni `reecrire` « sans les deux champs » ; les puces `VEILLE GESTE` et `VEILLE FINIE` gardent « avec `--attendre` si un geste de ce réveil a rendu une suite « rejouer au réveil suivant » », que la sortie 5 déclenche désormais.
9. **La version** : la suivante de `main` au moment de livrer, le troisième nombre plus un (7.39.1 sur `97d17e3` ; 7.39.2 si la PR B est entrée avant), posée par `version-suivante.mjs` avec la note du patch, au-dessus de la première note. Le patch porte 7.39.1 : il a été écrit sur `97d17e3`.

## À faire, dans l'ordre

Après le ticket 76, § 2, dans la même branche.

### § 1 — Le banc des textes d'abord, vu rouge, dans un arbre à part

```bash
git worktree add --detach "$S/rouge" HEAD
(cd "$S/rouge" && git apply "$S/75/ticket-75.patch" && git apply "$S/76/ticket-76.patch" && git apply --include='*.test.mjs' "$S/77/ticket-77.patch" && git status --short)
(cd "$S/rouge" && timeout 600 node --test --test-reporter=tap scripts/relecteur.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok')
git worktree remove --force "$S/rouge"
```

Attendu : `# tests 11`, `# pass 7`, `# fail 4` : « A-180 — la veille sous le plafond… », « suite du ticket 66 (ticket 69) — chaque phrase neuve à sa place… », « contre-relecture de la PR 147 — les quatre formes… », et le cas neuf « suites de la PR 147 et du lot 5 (ticket 77) — … ». Recopier les comptes dans la PR.

### § 2 — Le patch, la version et la note, dans la branche

```bash
git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md "$S/77/ticket-77.patch" && git status --short
node "$S/77/version-suivante.mjs" "$S/77/ticket-77.patch"
timeout 600 node --test --test-reporter=tap scripts/relecteur.test.mjs scripts/depot.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok'
```

`version-suivante.mjs` écrit la version prise et la date (« 7.39.1 — <date> » sur `97d17e3`) ; rejoué, il sort en 1 sans rien écrire. Attendu : `# tests 80`, `# pass 80`, `# fail 0` (11 et 69). `git status --short` : les neuf fichiers des trois tickets en ` M`, et eux seuls.

### § 3 — Vérifier, commiter, livrer la PR A

```bash
git add -A && git diff --cached --stat origin/main | tail -n 1
git commit -m "fix(relecteur): sortie 69 des calculs en panne, usage entier, borne de la sortie 5 (plugin <version>)"
git status --short
```

`<version>` : celle que `version-suivante.mjs` a écrite. La dernière ligne du `--stat` : `9 files changed` ; `git status --short` vide. Puis les mutations, en tâche de fond (`run_in_background`), avec le `timeout` de l'outil Bash à `3700000` :

```bash
timeout 3600 sh -c 'for n in 75 76 77; do node "$S/$n/mutations.mjs"; done' > "$S/mutations.log" 2>&1; echo "sortie $?"; grep -c '^ROUGE' "$S/mutations.log"; grep -v '^ROUGE' "$S/mutations.log"; git status --short
```

Attendu : `sortie 0`, `27` rouges, trois lignes `toutes rouges`, `git status --short` vide. Puis la suite entière, seule (pas pendant les mutations), en tâche de fond, avec le `timeout` de l'outil Bash à `1900000` ; noter la charge avant (`uptime`) et attendre qu'elle soit sous 3 :

```bash
uptime; timeout 1800 pnpm test > "$S/suite.log" 2>&1; echo "sortie $?"; uptime; grep -E '^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) ' "$S/suite.log"
```

Attendu : `sortie 0`, `# tests 1390`, `# pass 1390`, `# fail 0` sur `97d17e3` (1 384, plus 2 du ticket 75, 3 du ticket 76, 1 de celui-ci ; 1 398 si la PR B est entrée avant). Puis :

```bash
git push origin claude/suites-relecteur
```

La PR vers `main`, prête (pas en brouillon), sans étiquette, son titre le message du commit. Dans le corps : les rouges avant et les verts après de chaque ticket (leurs § 1 et § 2), les trois journaux de mutations, la suite entière (compte, durée, charge avant et après). La session ne la fusionne pas. `Label: contre-revue` : l'architecte la fait contre-relire. La session rend au lanceur l'URL de la PR et ces sorties, puis s'arrête.

**Si `main` bouge entre l'ouverture de la PR et sa fusion** (la PR B entrée) : fusionner `origin/main` dans la branche par un commit de fusion, jamais de rebase ni de push forcé ; `NOTES-DE-VERSION.md` (et `.claude-plugin/plugin.json` s'il l'est) en conflit, et eux seuls, se reprennent de `main` et la version suivante se pose de nouveau, la note au-dessus de celle de `main` :

```bash
git fetch origin main
git merge --no-ff --no-edit origin/main; git diff --name-only --diff-filter=U
git checkout origin/main -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
node "$S/77/version-suivante.mjs" "$S/77/ticket-77.patch"
git add -A && git commit --no-edit && git push origin claude/suites-relecteur
```

Un autre fichier en conflit : s'arrêter et l'écrire au lanceur. Puis la suite entière à nouveau, et le titre de la PR à la version prise (7.39.2). Essayé en écrivant ce ticket : la PR B sur `97d17e3`, puis cette fusion ; seul `NOTES-DE-VERSION.md` est en conflit (`plugin.json` porte 7.39.1 des deux côtés), et l'arbre obtenu est celui de la PR B suivie des trois patchs posés par `git apply`.

## Surfaces

| Surface | Preuve |
| --- | --- |
| La sortie 5 : « rejouer au réveil suivant », sa borne à la seconde fois de suite sur la même PR, l'architecte et `--taire <n>` | `scripts/relecteur.test.mjs`, « suites de la PR 147 et du lot 5 (ticket 77) » ; mutations T1, T2, T3 |
| « de suite » sur les bornes de 7, 9, 12, « autre » et `create_session` | le même cas, et ceux qui exigeaient « à la seconde fois » (R5, contre-relecture de la PR 147, A-180) ; T4, T5 |
| `create_session` en échec : « rejouer au réveil suivant » | le même cas ; T6 |
| La sortie 6 nomme la sortie 69 des calculs | le même cas ; T7 |
| `reecrire` peut rendre `panne`, dont les lignes partent | le même cas ; T8 |
| « il lui faut les deux champs ; un champ absent, `couple` » | le même cas, et « suite du ticket 66 (ticket 69) » ; T9 |
| Le plafond rejoué, dans « Les lignes » | le même cas ; T10, T11 |
| `--attendre` après une suite « rejouer au réveil suivant », sortie 5 comprise | le même cas (puces `VEILLE GESTE`, `VEILLE FINIE`) |
| La version et la note | les tests de version de `scripts/depot.test.mjs` |

## Mutations

[`77-annexes/mutations.mjs`](77-annexes/mutations.mjs), depuis la racine, la branche commitée (§ 3). Journal : [`77-annexes/mutations.txt`](77-annexes/mutations.txt).

| Mutation | Banc | Issue |
| --- | --- | --- |
| T1 SKILL.md : la sortie 5 sans borne ni « rejouer au réveil suivant » (le texte d'avant, constat 8 de la PR 147) | `relecteur.test.mjs` | rouge (0 s) |
| T2 SKILL.md : la sortie 5 sans sa borne | `relecteur.test.mjs` | rouge (0 s) |
| T3 SKILL.md : la borne de 5 sans « sur la même PR » | `relecteur.test.mjs` | rouge (0 s) |
| T4 SKILL.md : la sortie 9 sans « de suite » | `relecteur.test.mjs` | rouge (0 s) |
| T5 SKILL.md : la sortie 7 sans « de suite » | `relecteur.test.mjs` | rouge (0 s) |
| T6 SKILL.md : `create_session` en échec, « rejouer le geste au réveil suivant » (le texte d'avant) | `relecteur.test.mjs` | rouge (0 s) |
| T7 SKILL.md : la sortie 6 ne nomme pas la sortie 69 des calculs | `relecteur.test.mjs` | rouge (0 s) |
| T8 SKILL.md : `reecrire` ne dit plus qu'il peut rendre `panne` | `relecteur.test.mjs` | rouge (0 s) |
| T9 SKILL.md : « sans les deux champs, `couple` » (le texte d'avant, mineur 9 de la PR 147) | `relecteur.test.mjs` | rouge (0 s) |
| T10 SKILL.md : le plafond rejoué n'est plus écrit | `relecteur.test.mjs` | rouge (0 s) |
| T11 SKILL.md : le plafond rejoué écrit dans « L'état des sessions », hors de « Les lignes » | `relecteur.test.mjs` | rouge (0 s) |

11 rouges sur 11.

## Vérification

1. § 1 : 4 rouges sur 11 ; § 2 : 80 verts sur 80.
2. § 3 : les mutations des trois tickets, 27 rouges sur 27 ; la suite entière, 1 390 sur 1 390 sur `97d17e3` ; `git diff --stat origin/main` : les neuf fichiers, et eux seuls.

### Ce qui a été joué en écrivant ce ticket

Sur un clone neuf de `https://github.com/MAJ-agency/skills` à `97d17e3` (plugin 7.39.0), le 2026-11-22, Node 22.23.5, git 2.43.0, quatre cœurs partagés avec d'autres agents (charge notée aux bords de chaque passe) :
- **Les patchs** : chacun des trois, `git apply --check` seul sur `97d17e3` ; puis 75, 76 et 77 l'un après l'autre : l'arbre obtenu (`9df116dc…`) est celui d'où ils sont tirés. Sur la PR B posée d'abord (tickets 78 et 79, 7.39.1), les trois s'appliquent avec les deux `--exclude`, et `version-suivante.mjs` pose 7.39.2 au-dessus de la note de la PR B ; la fusion de la PR B dans la branche (le chemin du § 3 du ticket 77) ne met en conflit que `NOTES-DE-VERSION.md` et donne le même arbre (`dde9aad7…`).
- **Rouges avant** (§ 1, sur les tickets 75 et 76, le banc des textes de ce ticket posé) : **4 rouges sur 11** ; **verts après** (§ 2) : **80 sur 80** (`scripts/relecteur.test.mjs` 11, `scripts/depot.test.mjs` 69).
- **Les mutations des trois tickets**, chacune seule, sur l'arbre des trois patchs, le fichier remis après : 10, 6 et 11, **27 rouges sur 27** (07:13 → 07:47 UTC, charge de 7,7 à 11,5) ; l'arbre propre après chaque passe (journaux dans les annexes).
- **La suite entière**, les quatre motifs de `pnpm test` joués par `node --test`, d'un seul tenant, en tâche de fond avec un `timeout` explicite, sur les trois patchs : **1 390 tests, 1 390 verts**, aucun échec, sauté ni annulé ; 16 min 14 s (06:56:37 → 07:12:52 UTC, `duration_ms` 974056), charge 0,37 au départ, 7,46 à la fin (un autre agent jouait ses bancs).

## Ce qui n'a pas été établi

1. **Une session Sonnet réelle** qui compte « de suite » d'un réveil à l'autre : le banc tient des places, pas une conduite. Le Relecteur n'a pas de mémoire écrite de ses sorties (« rien ne vit dans sa mémoire ») ; une session relancée à neuf recompte de zéro, le côté qui fait répéter une fois de plus.
2. **La borne de la sortie 5 de `distribuer`** : non écrite (`A-189` ne la demande que pour `jouer`) ; `distribuer` ne lit que la PR et ses commentaires, que `passe` vient de lire.

## Hors périmètre

- `fusionner/SKILL.md`, `architecte/references/lancement.md` et les autres textes des rôles : lot 6.
- Le code du Relecteur : tickets 75 et 76.

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur `A-189` (points 1 à 3), `A-192` (point 1) et la contre-relecture de la PR 147 (constats 7 à 12), sur un clone neuf de `main` à `97d17e3` ; banc, mutations et suite joués (« Ce qui a été joué »).
