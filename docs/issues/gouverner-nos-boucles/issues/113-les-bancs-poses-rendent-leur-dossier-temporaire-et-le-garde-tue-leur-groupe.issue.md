# Les bancs posés rendent leur dossier temporaire, le garde le vérifie et tue leur groupe à son délai, et un banc prouve le refus d'éditer un index généré

Status: Fait — PR 171 (`b0e112d`, plugin 8.5.2)
Type: défaut
Modèle: sonnet — le même `after()` dans neuf bancs, une assertion et un lanceur par groupe de processus dans le garde `references-posees.test.mjs`, un cas de plus dans `garde-fichiers.test.mjs` ; rien à concevoir hors des décisions `A-258` à `A-260`. Le cas de l'index généré et sa mutation ont été joués en écrivant ce ticket. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 112 commité sur la branche
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/agent/garde-github.test.mjs` (`jouet`, 15-16), `garde-illisible.test.mjs` (37), `fin-de-tour.test.mjs` (13), `apres-edition.test.mjs` (13), `garde-fichiers.test.mjs` (un test neuf, en fin de fichier, après 261) ; `skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs` (169-173) et `skills/chaine/tickets/references/scripts/docs/avancement.test.mjs` (106) ; `skills/monorepo/socle-monorepo/references/scripts/verify/references-agent.test.mjs` (158-166), `budget-contexte.test.mjs` (10) et `references/scripts/docs/next-id.test.mjs` (23) ; `scripts/references-posees.test.mjs` (le délai et la lecture de la sortie, 35-77 ; un test neuf) ; `scripts/pose-du-socle.mjs` (une fonction neuve, `jouerEnGroupe`, après `poserLeSocle`, 110) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Même PR que 112, en second** (`A-258`) : l'assertion « dossier temporaire vide » du garde n'est verte qu'avec les trois bancs de `socle-tests` nettoyés par 112, d'où « 112 commité sur la branche ». **Le ticket 114 touche ensuite `scripts/pose-du-socle.mjs`** (la pose de la racine) : il part après cette PR. Aucun des tickets 93 à 110 ne touche ces fichiers. Le ticket 111 (`needs-info`) relira les exemples d'identifiants des tests de `tickets` et de `socle-monorepo` : le second à entrer relit ces bancs sur `main`. Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

## Le besoin

Trois suites du ticket 90, toutes sur les bancs que les skills posent dans un projet.

1. **Les dossiers laissés dans `TMPDIR`** (ticket 90, « Ce qui a été trouvé en plus », 6) : un projet joue ces bancs à chaque pre-push et en CI, et un capitaine dont chaque push les joue remplit son disque (le disque plein de l'architecte, journal de la carte, 2026-11-14, 15 h 28 UTC). Le banc `scripts/nettoyage-des-bancs.test.mjs` ne garde que deux bancs nommés et les dépôts jouets ; rien ne garde les autres.
2. **Le délai du garde ne tue pas les petits-enfants** (contre-relecture de la PR 156, `m4`) : au délai, un banc posé qui a lancé un processus le laisse orphelin, et il survit au retrait du jouet.
3. **Aucun banc ne prouve que le hook refuse l'édition d'un index généré** (ticket 90, « Ce qui a été trouvé en plus », 8, `A-212`) : privé de `INDEX_GENERES`, `FICHIERS_GENERES` reste vert sur les sept bancs de `agent/` ; seul le lockfile est éprouvé.

## La cause, à la source

Lignes lues sur `origin/main` à `3daedcd` (plugin 8.5.0).

1. **Le relevé.** Les 30 bancs de `references/`, posés par `poserLeSocle` (`scripts/pose-du-socle.mjs:58`) au régime 8 (le relevé vaut au régime 7 de même : le garde rejoue les deux, et l'étape 2 aussi) et joués comme le garde les joue (un `node --test --test-concurrency=1`, `TMPDIR` neuf, sans `NODE_PATH`) : sortie 0, 414 tests, **96 dossiers restants**, par préfixe : `garde-github` 20, `garde-illisible` 19, `mutation-regles` 16, `next-id` 16, `tests-creux` 7, `mutation-synthese` 5, `fin-de-tour` 4, `apres-edition` 3, `budget-contexte` 2, `avancement` 1, `mutation-dehors` 1, `references-agent` 1, `tickets-sans-grammaire` 1. Les quatre de `socle-tests` sont au ticket 112 ; les neuf autres sont ici. Chacun vient d'un seul `mkdtempSync` sans retrait : `garde-github.test.mjs:16`, `garde-illisible.test.mjs:37`, `fin-de-tour.test.mjs:13`, `apres-edition.test.mjs:13`, `tickets-gate.test.mjs:173`, `avancement.test.mjs:106`, `references-agent.test.mjs:166`, `budget-contexte.test.mjs:10`, `next-id.test.mjs:23`.
2. **Le garde ne regarde pas son `TMPDIR`.** `scripts/references-posees.test.mjs:39-47` donne aux bancs un `TMPDIR` neuf sous le jouet, puis le retire avec le jouet (`:75-76`) sans l'avoir lu.
3. **Le délai.** `references-posees.test.mjs:52-58` : `spawnSync(…, { timeout: 840_000 })` n'envoie `SIGTERM` qu'au `node --test` enfant. Joué à la contre-relecture de la PR 156 (`90-annexes/contre-relecture-0f9bcb1/essais/delai-et-banc-vide.txt`) : un banc qui lance `sleep 47` sous un délai de 3 s ; `spawnSync` rend `ETIMEDOUT` à 3 s et `sleep` reste orphelin (parent 1). `scripts/tranches.mjs:296-330` (`lancer`) tue par groupe de processus pour cette raison, mais il fond la sortie standard et la sortie d'erreur en une seule (`sortie`), et le garde lit le TAP de la sortie standard (`:59-72`).
4. **L'index généré.** `regles.mjs:27` lit `INDEX_GENERES` dans `../docs/index-generes.json` à côté du fichier ; `:33-36` en fait `FICHIERS_GENERES`, avec le lockfile. `regles.test.mjs` lit une copie posée seule (`:12-16`), sans liste d'index ; `garde-fichiers.test.mjs` copie `regles.mjs` dans `outils/scripts/agent/` (`:37`) sans `outils/scripts/docs/index-generes.json`. Aucun des sept bancs n'écrit de liste : un index n'est jamais refusé devant eux.

## Décisions

Décidées le 2026-11-27 par l'architecte : **`A-258`**, **`A-259`** et **`A-260`**. Ce qui suit les applique ; rien n'y est à trancher.

1. **`A-258` (1) — Chaque banc retire ce qu'il crée**, à la forme du ticket 112 : `after` de `node:test`, `rmSync` de `node:fs`, une liste `DOSSIERS` au niveau du module, chaque `mkdtempSync` y pousse son dossier, `after(() => { for (const d of DOSSIERS) rmSync(d, { recursive: true, force: true }); })`. `after`, `rmSync` et `DOSSIERS` vont au niveau du module dans chacun des neuf, y compris là où `mkdtempSync` s'importe aujourd'hui dans un test ou plus bas dans le fichier (`tickets-gate.test.mjs:169`, `references-agent.test.mjs:158`, `next-id.test.mjs:3`) : l'import se remonte en tête. Dans `tickets-gate.test.mjs:169-173`, le dossier est celui que rend `mkdtempSync`, pas son sous-dossier `scripts/verify`. Rien d'autre ne change dans ces neuf bancs : aucune assertion, aucun nom de test.
2. **`A-258` (2) — Le garde lit son `TMPDIR`.** Après le passage de chaque régime, avant le retrait du jouet : `assert.deepEqual(readdirSync(temporaire), [], \`régime ${regime} : dossiers laissés dans TMPDIR par les bancs posés\`)`. C'est la preuve pour tous les bancs posés à la fois, sans coût : le garde les joue déjà dans ce `TMPDIR`. Un banc neuf qui laisse un dossier rougit le garde, sans liste à tenir.
3. **`A-259` — Le délai tue le groupe.** `scripts/pose-du-socle.mjs` exporte `jouerEnGroupe(args, { cwd, env, borne })` : `spawn(process.execPath, args, { cwd, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })`, les deux sorties lues **à part** ; à `borne`, `process.kill(-pid, 'SIGKILL')` (`ESRCH` ignoré). La promesse rend `{ status, signal, stdout, stderr, tue }` comme `lancer` se résout (`tranches.mjs:333-341`) : sans kill, sur `close` (les flux lus jusqu'au bout) ; tuée, sur `exit`, flux détruits (un petit-enfant qui tient le tube ne la retient pas) ; sur `error` (le lancement échoue), elle rend aussi un résultat, `status` et `signal` nuls, sans jamais lever ni pendre ; une seule résolution. Pas `lancer` de `tranches.mjs` : il fond les deux sorties, et le TAP du garde se lit sur la sortie standard seule. Le garde devient `async` et l'appelle avec `borne: 840_000` ; l'assertion `assert.equal(r.tue, false, \`régime ${regime} : délai de 840 s atteint, groupe tué\`)`, avant les autres, sert au message : il nomme la borne au lieu d'une sortie nulle et sans échec lisible. `maxBuffer` disparaît (les sorties s'accumulent en mémoire, comme dans `lancer`). À côté de `delete env.NODE_PATH` (`references-posees.test.mjs:49`), `delete env.GARDER_JOUETS` : sinon un poste qui l'exporte garde les dépôts jouets et rougit l'assertion `TMPDIR` vide. La borne, `PLANCHER` (350) et `SAUTES` ne changent pas.
4. **`A-260` — L'index généré.** Un test neuf dans `garde-fichiers.test.mjs`, sur `depot()` : `docs/index/regles.md` passe sans liste ; puis `outils/scripts/docs/index-generes.json` écrit (`{ index: [{ chemin: 'docs/index/*.md', commande: 'node scripts/docs/index.mjs' }] }`), le même chemin est refusé, sortie 2, `docs/index/regles.md est généré : le régénérer avec « node scripts/docs/index.mjs »` ; `docs/index/sous/regles.md` passe (`*` est un segment). Le chemin est hors des chemins sensibles de `CONTRAT` : le refus vient de la liste seule.
5. **La version** : celle de la PR de 112 et 113 (ticket 112, décision 5) ; la note ajoute que les bancs posés ne laissent plus rien dans le dossier temporaire, et qu'un projet repose `scripts/agent/`, `scripts/docs/` et `scripts/verify/` (`/maj-skills:socle-chaine-de-production`, `/maj-skills:tickets`, `/maj-skills:socle-monorepo`, pièce par pièce).

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/socle-chaine-de-production/references/agent/garde-github.test.mjs:6-16`, `garde-illisible.test.mjs:7-37`, `fin-de-tour.test.mjs:5-13`, `apres-edition.test.mjs:5-13` | `DOSSIERS`, `after`, `rmSync` (décision 1) |
| `skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs:169-173`, `…/scripts/docs/avancement.test.mjs:3-106` | de même |
| `skills/monorepo/socle-monorepo/references/scripts/verify/references-agent.test.mjs:158-166`, `budget-contexte.test.mjs:3-10`, `…/scripts/docs/next-id.test.mjs:3-23` | de même |
| `skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.test.mjs` | le test neuf de la décision 4, en fin de fichier ; `writeFileSync` est déjà importé (`:8`) |
| `scripts/pose-du-socle.mjs` | `jouerEnGroupe`, exportée, après `poserLeSocle` (`:110`) ; l'en-tête (1-3) la nomme |
| `scripts/references-posees.test.mjs:35-77` | **change à dessein** : le test de chaque régime devient `async` ; `spawnSync` (`:52-58`) remplacé par `await jouerEnGroupe([...], { cwd: projet, env, borne: 840_000 })` ; `r.stdout`, `r.stderr`, `r.status`, `r.signal` gardent leurs noms ; une assertion `r.tue` en tête ; l'assertion `TMPDIR` vide (décision 2) après `PLANCHER` |
| `scripts/references-posees.test.mjs` | un test neuf de `jouerEnGroupe` (« Surfaces ») |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la note (décision 5) |

Modèles : `scripts/tranches.mjs:296-330` pour le kill par groupe ; `scripts/tranches.test.mjs:316-331` pour le test du petit-enfant mort (`/proc/<pid>/stat` absent ou zombie) ; `garde-fichiers.test.mjs:57` pour un cas sur `depot()`.

## À faire, dans l'ordre

1. **Sur la branche de 112**, 112 commité.
2. **Les bancs, rouges** : l'assertion `TMPDIR` vide d'abord, seule, dans le garde : rouge, avec les neuf préfixes de « La cause » (1) ; le test de `jouerEnGroupe` (la fonction absente : rouge) ; le cas de l'index généré, rouge sous la mutation « `INDEX_GENERES` hors de `FICHIERS_GENERES` ».
3. **Les neuf bancs** (décision 1), puis **`jouerEnGroupe`** et le garde (décision 3), puis le cas de l'index (décision 4). Les bancs verts.
4. Un commit ; la note complétée.
5. **Les mutations**, puis **la vérification**.

## Surfaces

| Surface | Banc |
| --- | --- |
| les bancs posés, aux régimes 8 et 7 : `TMPDIR` vide après leur passage | `scripts/references-posees.test.mjs`, les deux tests de régime (l'assertion neuve) |
| `jouerEnGroupe`, tué : un script `-e` qui lance `sleep 60` (`stdio: 'inherit'`), écrit son pid sur la sortie standard et attend, sous `borne: 1_000` : résolue en moins de 3 s, `tue` vrai, le petit-enfant mort (`/proc/<pid>/stat` absent ou zombie) ; le petit-enfant tué dans un `finally` (`-pid` puis `pid`), sous un garde-fou d'attente, comme l'aide `jouer` de `tranches.test.mjs:290-314` | `scripts/references-posees.test.mjs`, test neuf, sur le modèle de `tranches.test.mjs:316` |
| `jouerEnGroupe`, non tué : un second script qui écrit une ligne sur la sortie standard et une sur la sortie d'erreur, puis sort : `tue` faux, `status` 0, chaque ligne dans sa seule sortie | de même |
| le hook d'édition : un index de la liste du projet refusé, sa commande nommée ; sans la liste, le même chemin passe ; un segment de plus passe | `garde-fichiers.test.mjs`, test neuf |
| les neuf bancs : leurs tests inchangés, verts dans le plugin | chacun, ciblé |

## Mutations

Chacune seule, le fichier remis après : chacune rouge.

| Mutation | Rougit |
| --- | --- |
| l'`after` de `garde-github.test.mjs` retiré | le garde, assertion `TMPDIR` (régimes 8 et 7) |
| l'`after` de `next-id.test.mjs` retiré | de même |
| `jouerEnGroupe` qui tue l'enfant seul (`enfant.kill('SIGKILL')`) | le test neuf de `jouerEnGroupe` (petit-enfant vivant) |
| `jouerEnGroupe` qui fond `stderr` dans `stdout` | le test neuf (les deux sorties à part) |
| `...INDEX_GENERES.map(…)` retiré de `FICHIERS_GENERES` (`regles.mjs:34`) | `garde-fichiers.test.mjs`, test neuf (joué en écrivant ce ticket : `# fail 1`) |

## Vérification

1. Les bancs ciblés : `env -u NODE_PATH node --test scripts/references-posees.test.mjs skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.test.mjs`, puis chacun des neuf bancs ; verts.
2. Joué en écrivant ce ticket, sur `3daedcd` : le relevé de « La cause » (1) ; le cas de la décision 4, vert, et rouge sous sa mutation.
3. La suite entière, seule, en tâche de fond, sans `NODE_PATH` : `env -u NODE_PATH timeout 1800 pnpm test`, sortie 0, `# fail 0`, `# tests` égal à `# pass` (le compte de `main` au départ, plus les tests neufs de 112 et 113), recopié dans la PR. La session lit le job `bancs` de sa PR avant de rendre la main (`A-212`).

## Ce qui n'a pas été établi

- Un banc posé qui laisse un dossier hors de `TMPDIR` (sous le dépôt, sous `HOME`) : non cherché ; l'assertion ne le voit pas.
- Un petit-enfant qui sort lui-même du groupe (`setsid`, `detached`) survit au kill, comme dans `lancer` (`tranches.mjs:293-295`) : non couvert.
- Les bancs de `scripts/chaine/` (fusionner, sujet, revue) posés en projet : leurs dossiers passent par `depot-jouet.mjs`, que `nettoyage-des-bancs.test.mjs` garde déjà ; le garde de ce ticket ne joue que les bancs de `references/`.

## Hors périmètre

- Les dossiers de `socle-tests` : ticket 112.
- Les bornes en millisecondes des bancs posés (`tickets.test.mjs:244`, `:469`, `vagues.test.mjs:55`, `double-relecture.test.mjs:1080`, `:1118`) : aucun dépassement vu ; rien à faire tant qu'aucune ne dépasse (`A-263`).
- Le garde étendu à `pnpm lint` et `check:contexte` : ticket 114.

## Comments

- 2026-11-27 — Écrit par un agent rédacteur sur `origin/main` à `3daedcd` (plugin 8.5.0), sur la liste des suites (ticket 90, « Ce qui a été trouvé en plus », 6 et 8 ; contre-relecture de la PR 156, `m4`) ; les restes de `TMPDIR` mesurés sur les 30 bancs posés, le cas de l'index généré joué avec sa mutation.
