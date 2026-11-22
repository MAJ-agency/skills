# La preuve suffisante, part de `skills` (K1) : la copie de la spec amendée et le gabarit de règle aux gestes datés d'une personne

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — une copie de lecture et deux lignes de gabarit, sans rien à concevoir ; le texte et le code entiers sont dans le patch commun aux tickets 83, 84 et 85 ([`83-85-annexes/pr-tickets.patch`](83-85-annexes/pr-tickets.patch), sha256 `45630f0da7cfc28d5fa24fc8280332a20df4705a1d0fb43da3e4701f222f6e61`, `git apply` sur `main` à `ddb4265`, plugin 8.0.0), décrit fichier par fichier ci-dessous ; les bancs de la PR sont rouges avant le patch et verts après, les mutations de [`83-85-annexes/mutations.mjs`](83-85-annexes/mutations.mjs) toutes rouges. Rien n'est à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas. Premier des trois tickets de la PR « tickets » (83, 84, 85) : ce ticket porte les gestes de la PR entière (« À faire, dans l'ordre »).
Blocked by: —
Dépendances: —
Fichiers chauds: `docs/issues/standard-documentation/preuve-suffisante.spec.md`, `skills/chaine/tickets/references/gabarits/regle.md`, `scripts/depot.test.mjs` (le banc du gabarit, deux lignes) et `scripts/preuve-suffisante-standard.test.mjs` (neuf, commun aux tickets 83 et 84) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`, communs à la PR (ticket 85). Aucun ticket de suite ouvert (75 à 79) ne touche ces fichiers hors des deux fichiers de version ; les PR « socle-tests » (86 à 88) et « anchorpost » (89) non plus.

## Le besoin

La carte du chantier de la preuve suffisante d'Anchorpost (`SPEC_ALL_ANC-5-preuve-suffisante.map.md`, branche `develop` de `MAJ-agency/anchorpost`, section « Part de skills ») porte `K1` : « `docs/issues/standard-documentation/` reçoit la copie de la spec amendée ; le gabarit `skills/chaine/tickets/references/gabarits/regle.md` gagne `criticality`, `cases`, `notApplicableFamilies` ». Le ticket 49 a fait la part du gabarit (les trois clés en commentaire, « à partir de l'index au pivot 3 ») ; la CLI 2.0.0, qui porte le pivot 3, est publiée depuis le 2026-11-20 (2.0.1 le 2026-11-22). Il reste :

- **la copie** : sur `main` à `ddb4265`, `docs/issues/standard-documentation/preuve-suffisante.spec.md` est celle du 2026-11-13 (`10dc74c`, PR 104), qui précède tous les amendements de la spec : le parcours suspendu (2026-11-14), les genres de cas et le plancher (2026-11-17), un agent qui fixe la criticité et les familles dès la moyenne (amendement (2) du 2026-11-17), les gestes datés d'une personne (2026-11-18, `SPEC_ALL_ANC-5.37`) et les cas qu'une personne seule change (2026-11-20, `.38`). La spec qui fait foi est sur `develop` d'Anchorpost (`2be4e7e`), inchangée depuis `ee9b8a2` du 2026-11-20 ;
- **le gabarit** : il ne montre ni la `date` facultative d'une criticité (la personne qui baisse un niveau la date), ni la révision des cas (`caseRevision: { date, by, reason }`), deux gestes que l'en-tête d'une règle porte depuis l'amendement du 2026-11-18 et que le schéma strict de la CLI 2.0.0 lit (`packages/schema/src/v3/rule-file-schema.ts` d'Anchorpost : `criticality.date` facultative, `RuleFileCaseRevisionSchema`).

## Une PR, trois tickets

Une famille de fichiers par PR, trois tickets au plus (`P-65`). La PR « tickets » porte ce que lisent le gate et la revue de ticket : ce ticket (la copie, le gabarit de règle), le ticket 84 (le gate `tickets` : la ligne `Prouve:` et la preuve suffisante d'un ticket prêt) et le ticket 85 (la revue de ticket qui lit `Prouve:`, la version et la note). Les PR « socle-tests » (86 à 88) et « anchorpost » (89) ne touchent aucun de ses fichiers hors des deux fichiers de version : celle qui entre en second suit la règle du § 3. La PR « anchorpost » attend celle-ci et la PR « socle-tests » (sa fiche décrit leurs gates).

## Où

| Fichier | Ce qui change |
| --- | --- |
| `docs/issues/standard-documentation/preuve-suffisante.spec.md` | remplacé : le titre, la note « Copie de lecture » (source, commit, date, ce qui diffère de l'original), puis le texte de `SPEC_ALL_ANC-5` de `develop` d'Anchorpost à partir de sa ligne 2 |
| `skills/chaine/tickets/references/gabarits/regle.md` | sous `# criticality:`, la ligne `#   date: AAAA-MM-JJ # facultative, …` ; après `notApplicableFamilies`, le bloc `# caseRevision:` (`date`, `by`, `reason`) |
| `scripts/depot.test.mjs` | le banc « le gabarit de règle montre `criticality` en bloc » attend `level`, `by`, `reason`, `date`, et lit la forme de la ligne `date` |
| `scripts/preuve-suffisante-standard.test.mjs` | neuf : « la copie de la spec de la preuve suffisante est celle des amendements du 2026-11-14 au 2026-11-20, sans le nom d'une personne » (et le banc du gabarit de ticket du ticket 84) |

## Décisions

1. **La copie est la spec de `develop` d'Anchorpost, mot pour mot, sauf un nom de personne.** Le dépôt `skills` est public : le nom de la personne du produit qui a fixé la criticité de `SPEC_ALL_ANC-5` (2026-11-16) est remplacé par « une personne du produit » dans le texte (§ « Amendement (2) ») et par `Alice Martin`, la personne fictive que la spec emploie déjà dans ses exemples, dans les deux exemples JSON. La note de tête le dit. Rien d'autre ne change : les noms de projets que la copie du 2026-11-13 citait déjà y restent.
2. **La copie se lit, elle ne se modifie pas** (la note le dit) : un amendement se fait dans Anchorpost, puis la copie est reprise par un ticket.
3. **Le gabarit montre les deux gestes d'une personne, en commentaire**, comme les trois clés du ticket 49 : `date` sous `criticality` (« jamais écrite par un agent »), et `caseRevision` après `notApplicableFamilies` (« jamais écrite par un agent ; distincte de `validation`, que la MOA seule écrit »). Un projet au pivot 2 qui copie le gabarit ne les voit pas décommentées.

## À faire, dans l'ordre

Chaque bloc se joue tel quel depuis la racine du dépôt, `S` étant le scratchpad de la session (`S=<son chemin absolu>`). Un geste qui ne rend pas ce qui est écrit : s'arrêter et l'écrire au lanceur, sans improviser. Les trois tickets de la PR se jouent ensemble dans la même branche, par un seul patch : les § 0 à 3 de ce ticket valent pour 83, 84 et 85.

### § 0 — Partir de `main`, les annexes

```bash
git fetch origin main '+refs/heads/claude/hopeful-lovelace-ouk6tz:refs/remotes/origin/claude/hopeful-lovelace-ouk6tz'
git switch -C claude/preuve-suffisante-tickets origin/main
mkdir -p "$S/pr" && for f in pr-tickets.patch mutations.mjs version-mineure.mjs; do git show "origin/claude/hopeful-lovelace-ouk6tz:docs/issues/gouverner-nos-boucles/issues/83-85-annexes/$f" > "$S/pr/$f"; done
sha256sum "$S/pr/pr-tickets.patch"
git show origin/main:.claude-plugin/plugin.json | grep '"version"'
pnpm install --frozen-lockfile
```

Les annexes se lisent sur la branche de documentation du programme (sur `main` si la PR de documentation qui porte ces tickets y est entrée : `git show origin/main:<chemin>`), et s'écrivent dans `S`, jamais dans le dépôt. La somme attendue : **`45630f0da7cfc28d5fa24fc8280332a20df4705a1d0fb43da3e4701f222f6e61`** ; une autre : s'arrêter. La version de `main` : 8.0.0 (`ddb4265`) ; une autre (une PR de suite ou une autre PR de la preuve suffisante entrée avant) : les gestes du § 2 changent d'une ligne, dite là.

### § 1 — Les bancs d'abord, vus rouges, dans un arbre à part

```bash
git worktree add --detach "$S/rouge" HEAD
(cd "$S/rouge" && git apply --include='*.test.mjs' "$S/pr/pr-tickets.patch" && git status --short)
(cd "$S/rouge" && timeout 900 node --test --test-reporter=tap scripts/depot.test.mjs scripts/preuve-suffisante-standard.test.mjs skills/chaine/revue-de-ticket/scripts/contexte-ticket.test.mjs skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs skills/chaine/tickets/references/scripts/verify/tickets.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok')
git worktree remove --force "$S/rouge"
```

Cinq fichiers posés (`git status --short` : quatre ` M`, un `??`), jamais dans la branche de la session. Attendu : `# tests 136`, `# pass 126`, `# fail 10`, et les dix `not ok` : le gabarit de règle en bloc (ce ticket), la copie de la spec (ce ticket), T3 (« cas déclarés », ticket 85), le gabarit de ticket et la ligne `Prouve:` (ticket 84), le contexte de ticket et `Prouve:` (ticket 85), les deux cas « K3, gate » et les trois cas « K3 » (ticket 84). Recopier les comptes dans la PR.

### § 2 — Le patch, dans la branche, et ses bancs verts

Sur `main` à 8.0.0 :

```bash
git apply "$S/pr/pr-tickets.patch" && git status --short
```

Sur un `main` à une autre version : `git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md "$S/pr/pr-tickets.patch" && node "$S/pr/version-mineure.mjs" "$S/pr/pr-tickets.patch"` (la mineure suivante, la note au-dessus de celle de `main`). Puis :

```bash
timeout 900 node --test --test-reporter=tap scripts/depot.test.mjs scripts/preuve-suffisante-standard.test.mjs skills/chaine/revue-de-ticket/scripts/contexte-ticket.test.mjs skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs skills/chaine/tickets/references/scripts/verify/tickets.test.mjs scripts/relecture.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok'
```

Dix-neuf fichiers (`git status --short` : dix-huit ` M`, un `??`) ; attendu : `# tests 175`, `# pass 175`, `# fail 0` (les 136 du § 1 et les 39 de `relecture.test.mjs`, qui tient la copie du critère `T3` du régime 8, ticket 85).

Le patch, pour ce ticket (il fait foi) :

- **`preuve-suffisante.spec.md`** : la ligne 1 (le titre) ; puis `> **Copie de lecture.** Le fichier qui fait foi est … branche `develop` (`2be4e7e`, fichier inchangé depuis `ee9b8a2` du 2026-11-20). Copie du 2026-11-22, qui remplace celle du 2026-11-13 (`10dc74c`) …` ; puis les lignes 2 et suivantes de la spec d'Anchorpost, aux trois noms près (décision 1).
- **`regle.md`** : `#   date: AAAA-MM-JJ # facultative, à partir de la CLI Anchorpost 2.0.0 ; jamais écrite par un agent : la personne qui baisse un niveau la date, et `anchorpost compare` refuse en `enforce` une baisse qui ne porte pas une date nouvelle` ; `# caseRevision:   à partir de la CLI Anchorpost 2.0.0 ; la révision des cas, le geste daté d'une personne qui retire ou affaiblit un cas technique (`RULE_ALL_ANC-27`) ; …` et ses trois clés.
- **`depot.test.mjs`** : `["level", "by", "reason", "date"]` et l'assertion de la forme de `date`.
- **`preuve-suffisante-standard.test.mjs`** : la tête de la copie, cinq passages des amendements (la source, l'amendement (2), celui du 2026-11-18, `caseRevision`, la sortie 4 amendée le 2026-11-20), plus de « Copie du 2026-11-13. », et les deux seuls `"by"` des exemples valent `Alice Martin`.

Puis le ticket 84, puis le ticket 85 : leurs § « Le patch » se lisent sur le même arbre.

### § 3 — Vérifier, commiter, livrer la PR

```bash
git add -A && git diff --cached --stat origin/main | tail -n 1
git commit -m "feat(tickets): la ligne Prouve:, la preuve suffisante d'un ticket prêt, la spec amendée (plugin <version>)"
git status --short
```

`<version>` : 8.1.0, ou celle que `version-mineure.mjs` a écrite. La dernière ligne du `--stat` : `19 files changed` ; `git status --short` vide. Puis les mutations, en tâche de fond (`run_in_background`), avec le `timeout` de l'outil Bash à `1900000` :

```bash
timeout 1800 node "$S/pr/mutations.mjs" > "$S/mutations.log" 2>&1; echo "sortie $?"; grep -c '^ROUGE' "$S/mutations.log"; grep -v '^ROUGE' "$S/mutations.log"; git status --short
```

Attendu : `sortie 0`, `27` rouges, la ligne `toutes rouges`, `git status --short` vide. Puis la suite entière, seule (pas pendant les mutations), en tâche de fond, avec le `timeout` de l'outil Bash à `1900000` ; noter la charge avant (`uptime`) et attendre qu'elle soit sous 3 :

```bash
uptime; timeout 1800 pnpm test > "$S/suite.log" 2>&1; echo "sortie $?"; uptime; grep -E '^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) ' "$S/suite.log"
```

Attendu : `sortie 0`, `# tests 1404`, `# pass 1404`, `# fail 0` sur `ddb4265` (1 396, plus 8 de cette PR) ; si d'autres PR sont entrées avant, leur compte s'ajoute (la PR « socle-tests » : 25 ; la PR « anchorpost » : 2). Puis :

```bash
git push origin claude/preuve-suffisante-tickets
```

La PR vers `main`, prête (pas en brouillon), sans étiquette, son titre le message du commit (moins de 120 caractères, numéro compris, `A-197`). Dans le corps : les rouges avant et les verts après (§ 1 et § 2), le journal des mutations, la suite entière (compte, durée, charge avant et après). La session ne la fusionne pas. `Label: contre-revue` : l'architecte la fait contre-relire. La session rend au lanceur l'URL de la PR et ces sorties, puis s'arrête.

**Si `main` bouge entre l'ouverture de la PR et sa fusion** (une PR de suite, ou une autre PR de la preuve suffisante, entrée) : fusionner `origin/main` dans la branche par un commit de fusion, jamais de rebase ni de push forcé ; `NOTES-DE-VERSION.md` et `.claude-plugin/plugin.json` en conflit, et eux seuls, se reprennent de `main` et la version suivante se pose de nouveau, la note au-dessus de celle de `main` :

```bash
git fetch origin main
git merge --no-ff --no-edit origin/main; git diff --name-only --diff-filter=U
git checkout origin/main -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
node "$S/pr/version-mineure.mjs" "$S/pr/pr-tickets.patch"
git add -A && git commit --no-edit && git push origin claude/preuve-suffisante-tickets
```

Un autre fichier en conflit : s'arrêter et l'écrire au lanceur. Puis la suite entière à nouveau, et le titre de la PR à la version prise. Essayé en écrivant ce ticket (« Ce qui a été joué ») : les trois PR fusionnées l'une après l'autre par ce chemin ne mettent en conflit que ces deux fichiers, et donnent l'arbre des trois patchs posés l'un sur l'autre.

## Surfaces

| Surface | Preuve |
| --- | --- |
| la copie est celle de la spec amendée, sa source et son commit dits | `scripts/preuve-suffisante-standard.test.mjs`, « la copie de la spec de la preuve suffisante est celle des amendements… » ; mutation D1 |
| aucun nom de personne dans les exemples de la copie | le même test ; mutation D2 |
| le gabarit de règle montre la `date` d'une criticité, en bloc, une clé par ligne | `scripts/depot.test.mjs`, « le gabarit de règle montre `criticality` en bloc… » ; mutation D3 |

## Mutations

[`83-85-annexes/mutations.mjs`](83-85-annexes/mutations.mjs), depuis la racine, la branche commitée (§ 3) : `node "$S/pr/mutations.mjs"`, ou une par son préfixe (`node "$S/pr/mutations.mjs" D1`). Chacune seule, le fichier remis après, sur les bancs qu'elle nomme ; journal : [`83-85-annexes/mutations.txt`](83-85-annexes/mutations.txt). Celles de ce ticket :

| Mutation | Banc | Issue |
| --- | --- | --- |
| D1 copie de la spec : celle du 2026-11-13 (la tête d'avant) | `depot.test.mjs`, `preuve-suffisante-standard.test.mjs` | rouge |
| D2 copie de la spec : le nom d'une personne dans un exemple | les mêmes | rouge |
| D3 gabarit de règle : sans la date de la criticité | les mêmes | rouge |

## Vérification

1. § 1 : 10 rouges sur 136 avant le patch ; § 2 : 175 verts sur 175.
2. Les mutations de la PR, la branche commitée : « toutes rouges » (27).
3. La suite entière, verte (§ 3).

### Ce qui a été joué en écrivant ce ticket

Voir le ticket 85, « Ce qui a été joué » : la PR entière.

## Ce qui n'a pas été établi

1. **Une copie tenue à jour d'elle-même** : rien ne relève qu'Anchorpost amende la spec après `ee9b8a2` ; la copie se reprend par un ticket, comme celle-ci.

## Hors périmètre

- Le texte de la spec : il fait foi dans Anchorpost.
- Les trois clés `criticality`, `cases`, `notApplicableFamilies` du gabarit : posées par le ticket 49 (plugin 7.14.0).

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur la section « Part de skills » de la carte de `SPEC_ALL_ANC-5` (Anchorpost, `develop`, `2be4e7e`) et la spec elle-même, sur un clone neuf de `main` à `ddb4265` (plugin 8.0.0) ; bancs, mutations et suite joués (ticket 85).
