# Le hook d'édition, suites de la PR 149 : l'héritage jugé contre le develop d'origin, le geste en tête du refus, un banc du clone entier

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — trois mineurs des tours 3 et 4 de la contre-relecture de la PR 149 (M4, 23, 24), chacun avec sa décision et ses cas de banc ; le code entier est dans le patch ([`79-annexes/ticket-79.patch`](79-annexes/ticket-79.patch), sha256 `002640abcc28b80598dc4477bc65fde85648ecc738dc5d49d1f12c4d28d17245`, `git apply` sur `97d17e3`), avec la version et la note de la PR B ; des cas rouges avant le code, verts après ; les mutations de [`79-annexes/mutations.mjs`](79-annexes/mutations.mjs) toutes rouges ; puis la vérification et la livraison de la PR entière. Rien n'est à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas. Dernier des deux tickets de la PR B (ticket 78, « Une PR, deux tickets »).
Blocked by: 78
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.mjs`, `regles.mjs`, `garde-fichiers.test.mjs`, `regles.test.mjs` : aucun autre ticket ouvert ne les touche (le lot 6 nomme `socle/SKILL.md` et `socle/chaine.json`, pas le hook). `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` : portés ici pour la PR B ; la PR A les touche aussi ; la version est la suivante de `main` au moment de livrer (§ 3).

## Le besoin

La contre-relecture de la PR 149 (`71-73-annexes/contre-relecture-9db4fb3/rapport.md`) : troisième tour, constat 22 (M4 de « Ce qui reste à la suite ») ; quatrième tour, constats 23 et 24. Faits lus sur `main` à `97d17e3`, et rejoués par les bancs (§ 1) :

### M4 — le hook juge l'héritage contre la copie locale de develop, sans la confirmer

`accordes()` de `garde-fichiers.mjs` (`A-193`) dit héritée une copie de sujet identique à celle de sa base de fusion avec develop ; il calcule cette base avec `refs/remotes/origin/develop` **local**, que `git ls-remote` ne confirme pas (il confirme les sujets). Une copie locale de develop plus ancienne que le develop que le sujet a reçu donne une base de fusion plus ancienne : une copie héritée y paraît écrite, compte, et le refus ne dit aucun geste. Mesuré : develop porte le ticket sans accord (D0), puis un accord sur `docs/agents/regles.md` (D1), que le sujet `autre` reçoit, puis l'accord sur `scripts/agent/**` (D2) ; la session a relu le sujet, pas develop (sa copie à D0). Écrire `scripts/agent/garde.mjs` est refusé (la copie du sujet, celle de D1, compte), sans « relire » : la session écrit au conducteur un accord déjà donné.

### 23 — aucun banc ne tient que le geste du clone superficiel n'est dit que dans un clone superficiel

La mutation T2 du quatrième tour (le geste dit à chaque refus) reste verte. Dit dans un clone entier, `git fetch --unshallow origin` y échouerait (« --unshallow on a complete repository does not make sense »).

### 24 — le geste vient après la demande au conducteur

Le refus commence par « … Arrête-toi et écris à ton conducteur (à qui t'a lancé, hors chantier) : le chemin, pourquoi, ce qui y change ; … », et le geste qui relit ou approfondit vient après, entre parenthèses (« (Copie du ticket non lue : … Avant d'écrire au conducteur : `git fetch …`, puis refaire l'écriture.) »). Une session qui lit dans l'ordre s'arrête et écrit au conducteur avant d'arriver au geste qui aurait levé le refus.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `…/references/agent/garde-fichiers.mjs` | `accordes()` : `developConfirme` (develop local égal au develop de `ls-remote`), `developPerime` ; `herite` ne juge rien sans develop confirmé ; `origin/develop` nommée dans `perimees` ; le commentaire de la fonction |
| `…/references/agent/regles.mjs` | `refusSensible` : les gestes en tête du refus, puis « Encore refusée : » et la raison |
| `…/references/agent/garde-fichiers.test.mjs` | trois motifs suivent le refus neuf ; deux cas neufs, à la fin |
| `…/references/agent/regles.test.mjs` | un cas neuf, après « lot 5b, refusEdition en régime 8… » |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante de `main`, et la note de la PR B (tickets 78 et 79) |

## Décisions

1. **L'héritage se juge contre le develop d'origin** (M4) : `herite` ne compare la copie du sujet à celle de sa base de fusion que si la copie locale de develop est celle que `git ls-remote` rend (`developConfirme`) ; sinon il ne juge rien, la copie du sujet compte (le côté sûr, comme un clone superficiel), et `origin/develop` entre dans `perimees`, ce qui fait dire au refus le geste qui relit develop et les sujets. Une copie locale de develop absente est traitée de même. Raison : comme les copies des sujets, que le hook ne lit que confirmées ; la règle d'`A-193` suppose la base de fusion avec le develop que le sujet a reçu.
2. **Le geste en tête du refus** (24), quand il y en a un : « `<chemin> : d'abord, <geste>[, puis <geste>], puis refaire l'écriture. Encore refusée : <la raison d'aujourd'hui>[ (Aucune ligne lue : …) | (Ligne illisible : …)]` », les gestes :
   - « relire les copies du ticket (`<refs>` n'est pas au sommet d'origin) : `git fetch --prune origin '+refs/heads/develop:refs/remotes/origin/develop' '+refs/heads/sujet/*:refs/remotes/origin/sujet/*'` » ;
   - « approfondir le clone (clone superficiel : la base de fusion d'un sujet avec develop ne s'y lit pas, et une copie du ticket que le sujet n'a pas écrite a pu compter) : `git fetch --unshallow origin` ».

   Sans geste, le refus est celui d'aujourd'hui, mot pour mot. Les gestes eux-mêmes ne changent pas (le premier passe le hook de commandes, le second aussi : quatrième tour, `geste-superficiel.txt`).
3. **Le clone entier ne nomme jamais le clone superficiel** (23) : un banc, un sujet orphelin (aucune base de fusion avec develop) dans un clone entier ; le refus ne dit ni « superficiel » ni `--unshallow`. Le code est juste (le quatrième tour l'a lu) ; le banc tue T2.

## À faire, dans l'ordre

Après le ticket 78, § 2, dans la même branche (`claude/suites-capitaine`).

### § 1 — Les bancs de ce ticket d'abord, vus rouges, dans un arbre à part

```bash
git worktree add --detach "$S/rouge" HEAD
(cd "$S/rouge" && git apply "$S/78/ticket-78.patch" && git apply --include='*.test.mjs' "$S/79/ticket-79.patch" && git status --short)
(cd "$S/rouge" && timeout 900 node --test --test-reporter=tap skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.test.mjs skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok')
git worktree remove --force "$S/rouge"
```

Attendu : ``# tests 98`, `# pass 93`, `# fail 5`, et les `not ok` : les trois cas dont le motif suit le refus neuf (« une copie locale du sujet en retard sur origin… », « le refus ne nomme que les copies en retard… », « dans un clone superficiel… »), le cas neuf de M4 (« … l'héritage d'une copie de sujet se juge contre le develop d'origin… ») et « suite 24 du lot 5, refusEdition en régime 8… »`. Le cas du clone entier (« … un refus ne nomme jamais le clone superficiel… ») est vert sans le code : il tient ce que le code fait déjà (décision 3), et la mutation H4 le fait rougir. Recopier les comptes dans la PR.

### § 2 — Le patch, la version et la note, dans la branche

```bash
git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md "$S/79/ticket-79.patch" && git status --short
node "$S/79/version-suivante.mjs" "$S/79/ticket-79.patch"
timeout 900 node --test --test-reporter=tap skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.test.mjs skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs scripts/depot.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok'
```

`version-suivante.mjs` écrit la version prise et la date (« 7.39.1 — <date> » sur `97d17e3`) ; rejoué, il sort en 1 sans rien écrire. Attendu : ``# tests 167`, `# pass 167`, `# fail 0` (98 et 69)`.

### § 3 — Vérifier, commiter, livrer la PR B

```bash
git add -A && git diff --cached --stat origin/main | tail -n 1
git commit -m "fix(chaine): fourches sautées, une revue par mise à jour, le geste en tête du refus (plugin <version>)"
git status --short
```

`<version>` : celle que `version-suivante.mjs` a écrite. La dernière ligne du `--stat` : `10 files changed` ; `git status --short` vide. Puis les mutations, en tâche de fond (`run_in_background`), avec le `timeout` de l'outil Bash à `3700000` :

```bash
timeout 3600 sh -c 'for n in 78 79; do node "$S/$n/mutations.mjs"; done' > "$S/mutations.log" 2>&1; echo "sortie $?"; grep -c '^ROUGE' "$S/mutations.log"; grep -v '^ROUGE' "$S/mutations.log"; git status --short
```

Attendu : `sortie 0`, `17` rouges, deux lignes `toutes rouges`, `git status --short` vide. Puis la suite entière, seule, en tâche de fond, avec le `timeout` de l'outil Bash à `1900000` ; noter la charge avant (`uptime`) et attendre qu'elle soit sous 3 :

```bash
uptime; timeout 1800 pnpm test > "$S/suite.log" 2>&1; echo "sortie $?"; uptime; grep -E '^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) ' "$S/suite.log"
```

Attendu : `sortie 0`, `# tests 1392`, `# pass 1392`, `# fail 0` sur `97d17e3` (1 384, plus 5 du ticket 78, 3 de celui-ci ; 1 398 si la PR A est entrée avant). Puis :

```bash
git push origin claude/suites-capitaine
```

La PR vers `main`, prête (pas en brouillon), sans étiquette, son titre le message du commit. Dans le corps : les rouges avant et les verts après des deux tickets, les deux journaux de mutations, la suite entière (compte, durée, charge avant et après). La session ne la fusionne pas. `Label: contre-revue` : l'architecte la fait contre-relire. La session rend au lanceur l'URL de la PR et ces sorties, puis s'arrête.

**Si `main` bouge entre l'ouverture de la PR et sa fusion** (la PR A entrée) : fusionner `origin/main` dans la branche par un commit de fusion, jamais de rebase ni de push forcé ; `NOTES-DE-VERSION.md` (et `.claude-plugin/plugin.json` s'il l'est) en conflit, et eux seuls, se reprennent de `main` et la version suivante se pose de nouveau, la note au-dessus de celle de `main` :

```bash
git fetch origin main
git merge --no-ff --no-edit origin/main; git diff --name-only --diff-filter=U
git checkout origin/main -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
node "$S/79/version-suivante.mjs" "$S/79/ticket-79.patch"
git add -A && git commit --no-edit && git push origin claude/suites-capitaine
```

Un autre fichier en conflit : s'arrêter et l'écrire au lanceur. Puis la suite entière à nouveau, et le titre de la PR à la version prise (7.39.2).

## Surfaces

| Surface | Preuve |
| --- | --- |
| L'héritage jugé contre le develop d'origin : une copie locale de develop en retard ne juge rien, le refus dit de la relire ; relue, le chemin accordé passe ; une copie que le sujet a écrite compte, develop en retard ou non | `garde-fichiers.test.mjs`, « … l'héritage d'une copie de sujet se juge contre le develop d'origin… » ; mutations H1, H2, H3 |
| Le geste en tête du refus, avant la demande au conducteur ; deux gestes dans l'ordre ; « Aucune ligne lue » et « Ligne illisible » gardés après | `regles.test.mjs`, « suite 24 du lot 5… » ; les trois motifs retouchés de `garde-fichiers.test.mjs` ; H5, H6, H7, H8 |
| Sans geste, le refus d'aujourd'hui | `regles.test.mjs`, « suite 24 du lot 5… » (sans geste) ; les cas d'avant de `garde-fichiers.test.mjs` |
| Dans un clone entier, jamais le clone superficiel | `garde-fichiers.test.mjs`, « … dans un clone entier, un refus ne nomme jamais le clone superficiel… » ; H4 |
| Le régime 7 du hook | `refusSensible` ne joue qu'en régime 8 (`refusEdition`) ; « régime 7 (sans la clé `relecture`) » ; la suite entière |
| La version et la note | les tests de version de `scripts/depot.test.mjs` |

## Mutations

[`79-annexes/mutations.mjs`](79-annexes/mutations.mjs), depuis la racine, la branche commitée (§ 3). Journal : [`79-annexes/mutations.txt`](79-annexes/mutations.txt).

| Mutation | Banc | Issue |
| --- | --- | --- |
| H1 garde-fichiers.mjs : l'héritage jugé contre la copie locale de develop, sans la confirmer (le code d'avant, M4 de la PR 149) | `garde-fichiers.test.mjs` | rouge (6 s) |
| H2 garde-fichiers.mjs : develop non confirmé, sans geste (la copie compte, le refus ne dit pas de relire develop) | `garde-fichiers.test.mjs` | rouge (7 s) |
| H3 garde-fichiers.mjs : develop non confirmé, la copie du sujet dite héritée (la garde ouverte) | `garde-fichiers.test.mjs` | rouge (7 s) |
| H4 garde-fichiers.mjs : le clone dit superficiel à toute base de fusion qui ne se lit pas (T2 du quatrième tour, constat 23) | `garde-fichiers.test.mjs` | rouge (7 s) |
| H5 regles.mjs : le geste après la raison, entre parenthèses (l'ordre d'avant, constat 24) | `garde-fichiers.test.mjs`, `regles.test.mjs` | rouge (16 s) |
| H6 regles.mjs : le geste en tête, sans « puis refaire l'écriture » | `garde-fichiers.test.mjs`, `regles.test.mjs` | rouge (16 s) |
| H7 regles.mjs : « Aucune ligne lue » perdu quand un geste est dit | `garde-fichiers.test.mjs`, `regles.test.mjs` | rouge (18 s) |
| H8 regles.mjs : le geste du clone superficiel oublié quand il suit celui des copies | `garde-fichiers.test.mjs`, `regles.test.mjs` | rouge (17 s) |

8 rouges sur 8.

## Vérification

1. § 1 : 5 rouges sur 98 avant le code ; § 2 : 167 verts sur 167.
2. § 3 : les mutations des deux tickets, 17 rouges sur 17 ; la suite entière, 1 392 sur 1 392 sur `97d17e3` ; `git diff --stat origin/main` : les dix fichiers des deux tickets, et eux seuls.

### Ce qui a été joué en écrivant ce ticket

Sur un clone neuf de `https://github.com/MAJ-agency/skills` à `97d17e3` (plugin 7.39.0), le 2026-11-22, Node 22.23.5, git 2.43.0, quatre cœurs partagés avec d'autres agents (charge notée aux bords de chaque passe) :
- **Les patchs** : chacun des deux, `git apply --check` seul sur `97d17e3` ; puis 78 et 79 l'un après l'autre : l'arbre obtenu (`6f023b15…`) est celui d'où ils sont tirés. Sur la PR A posée d'abord (tickets 75 à 77, 7.39.1), les deux s'appliquent avec les deux `--exclude` ; la fusion inverse (ticket 77, § 3) a été jouée de bout en bout, `NOTES-DE-VERSION.md` seul en conflit ; le même chemin vaut ici, `version-suivante.mjs` étant le même script.
- **Les blocs des § 1 et § 2 des deux tickets**, joués tels quels sur une branche neuve de `97d17e3` : 78, 4 rouges sur 5 puis 113 verts sur 113 ; 79, 5 rouges sur 98 puis 167 verts sur 167 ; `version-suivante.mjs` pose 7.39.1, rejoué il sort en 1 ; `--stat` : 10 fichiers.
- **Les mutations des deux tickets**, chacune seule, sur l'arbre des deux patchs, le fichier remis après : 9 et 8, **17 rouges sur 17** (journaux dans les annexes). Une première passe du ticket 79 a laissé deux vertes : H3 (develop non confirmé, la copie du sujet dite héritée), que le cas de M4 ne distinguait pas, et H8, mal écrite (elle ne changeait rien au code). Le cas de M4 a reçu sa seconde partie (une copie que le sujet a écrite compte, develop en retard) et H8 a été récrite ; la passe entière de 79 a été rejouée : 8 rouges sur 8.
- **La suite entière**, les quatre motifs de `pnpm test` joués par `node --test`, d'un seul tenant, en tâche de fond avec un `timeout` explicite, sur les deux patchs tels qu'ils sont publiés : **1 392 tests, 1 392 verts**, aucun échec, sauté ni annulé ; 15 min 58 s (08:10:52 → 08:26:51 UTC, `duration_ms` 958394), charge 2,59 au départ (après 5 minutes d'attente), 1,24 à la fin. Une première passe, avant la seconde partie du cas de M4, avait rendu 1 392 sur 1 392 elle aussi (24 min, 07:29 → 07:53, charge montée à 15 par un autre agent).

## Ce qui n'a pas été établi

1. **Un vrai clone de session cloud** : le clone superficiel et la copie de develop en retard sont joués sur le dépôt jouet ; le geste « relire » de M4 est celui qui existait déjà pour les sujets (tour 1 de la PR 149, constat 5).
2. **La limite d'`A-193`** (une copie ramenée au contenu de sa base de fusion passe pour héritée) reste : elle est écrite dans le ticket 72 (« Ce qui n'a pas été établi », point 5), sans code.
3. **Le coût** : `ls-remote` était déjà joué à chaque écriture d'un chemin sensible ; rien de plus n'est lu.

## Hors périmètre

- La garde du capitaine (`chemins-sensibles.mjs --garde`), qui juge dans un clone approfondi, develop relu juste avant (`revue_du_capitaine`) : inchangée sur ce point.
- Les textes de la chaîne qui citent le refus : aucun (lu par `grep` en écrivant ce ticket : seul `garde-fichiers.test.mjs` citait « Copie du ticket non lue » et « Clone superficiel »).

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur `A-193` et la contre-relecture de la PR 149 (constat 22, M4 ; constats 23 et 24 du quatrième tour), sur un clone neuf de `main` à `97d17e3` ; bancs, mutations et suite joués (« Ce qui a été joué »).
