# Le script du Relecteur, suites de la PR 147 : l'usage entier, le plafond rejoué écrit et tenu, la marque sans les traces d'illisible

Status: Fait — PR 153 (`2a2d215`, plugin 8.0.2)
Type: défaut
Label: contre-revue
Modèle: sonnet — trois mineurs mesurés (le mineur 7 des tickets 67 à 70, le constat 7 et le constat 13 de la contre-relecture de la PR 147), chacun avec sa décision et son banc ; le code entier est dans le patch ([`76-annexes/ticket-76.patch`](76-annexes/ticket-76.patch), sha256 `698a71b872451d8863152db1c1bd130e49005dc45e8ca2aa0a3d18823de02be1`, `git apply` sur `97d17e3`, seul ou après le ticket 75), décrit ci-dessous ; un cas rouge avant le code, deux cas qui tiennent ce que le code fait déjà ; les mutations de [`76-annexes/mutations.mjs`](76-annexes/mutations.mjs) toutes rouges. Rien n'est à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas. Deuxième des trois tickets de la PR A (ticket 75, « Une PR, trois tickets »).
Blocked by: 75
Dépendances: —
Fichiers chauds: `skills/chaine/relecteur/scripts/relecteur.mjs` et `relecteur.test.mjs` : le ticket 75 les touche aussi, dans la même PR, ailleurs dans les fichiers (en-tête, « Sorties » ; `exiges` ; un test après « N1 à N4 ») ; ce patch-ci touche l'en-tête de `jouer`, le message d'usage et la fin du banc. Aucun autre ticket ouvert ne les touche. Les fichiers de version : ticket 77.

## Le besoin

Sur `main` à `97d17e3` (plugin 7.39.0), trois mineurs du script du Relecteur restent ouverts :

### Le mineur 7 des tickets 67 à 70 — l'usage omet `--sondes`

`relecteur.mjs` sans sous-commande sort en 2 avec « `usage : relecteur.mjs passe | jouer <n> [--sessions <fichier>] | distribuer … | veille [--pause <s>] [--duree <min>] [--taire <n>,…] [--attendre]` » ; son en-tête (lignes 10 et 11) dit `veille [--pause <s>] [--duree <min>] [--taire <n>,…] [--sondes <k>] [--attendre]`. Une session qui lit l'usage pour se corriger (sortie 2 : « le refaire une fois d'après la cause ») ne voit pas `--sondes`, que les bancs emploient.

### Le constat 7 de la PR 147 — le plafond rejoué redit « décision de plafond attendue »

`67-annexes/contre-relecture-686dcc6/rapport.md`, constat 7 et question 1 ; tranché par `A-189`, point 1 : **garder le comportement, et l'écrire**. Au plafond, l'étiquette `à-reprendre` se pose avant le commentaire (`A-183` point 1), et ce commentaire devient la marque la plus récente. Si le retrait de `à-relire` est refusé (`retirer_label` le tait) ou coupé, le passage suivant rend `etiqueter` (règle 1), lit l'étiquette posée **avant** sa marque, et ses lignes repartent : « PR <n> : décision de plafond attendue » à l'auteur et au conducteur. L'essai K1 du rapport le montre (rouge parce qu'il attendait le silence). Le texte d'en-tête dit seulement « un plafond à moitié écrit se rejoue entier, ses lignes avec lui » ; aucun banc ne tient le comportement gardé. Raison d'`A-189` : si GitHub écrit le commentaire du plafond mais répond en échec, ne plus le compter comme marque laisserait le plafond sans personne de prévenu.

### Le constat 13 de la PR 147 — les traces d'illisible exclues de la marque, sans banc

Second tour du même rapport, constat 13 : la marque d'un `etiqueter` est `marques.dernier`, qui exclut les traces d'illisible (`A-183` point 6). Une marque qui les compterait ferait repartir les lignes d'un passage rejoué quand une trace s'écrit entre la pose et le rejeu (un retrait refusé, puis un calcul en panne, revenu depuis). Le code est juste ; la mutation N3 survit aux 47 cas du banc ; l'essai K8 (`67-annexes/contre-relecture-686dcc6/essais/essais-ffb7e2c.test.mjs`) la tue.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/relecteur/scripts/relecteur.mjs` | l'en-tête de `jouer` : le plafond rejoué (deux lignes de plus) ; le message d'usage : `[--sondes <k>]` |
| `skills/chaine/relecteur/scripts/relecteur.test.mjs` | trois cas, à la fin, sous « Suites de la PR 147 (ticket 76) » |

## Décisions

1. **L'usage nomme chaque option de l'en-tête**, dans le même ordre : `veille [--pause <s>] [--duree <min>] [--taire <n>,…] [--sondes <k>] [--attendre]`. Le banc lit les quatre appels de l'en-tête (`//   node '<dossier du skill>/scripts/relecteur.mjs' <appel>`, lignes de suite comprises) et exige chacun dans l'usage, blancs ramenés à une espace : l'en-tête et l'usage ne peuvent plus diverger sans qu'il rougisse.
2. **Le plafond rejoué, écrit** (`A-189`, point 1), dans l'en-tête de `jouer`, après « un plafond à moitié écrit se rejoue entier, ses lignes avec lui » : « Rejoué après un retrait refusé, un plafond redit « décision de plafond attendue » à l'auteur et au conducteur : son étiquette s'est posée avant son commentaire, la marque la plus récente (A-189, point 1). » Le skill le dit au ticket 77.
3. **Le plafond rejoué, tenu** : un cas de banc, la forme de K1 retournée ; trois tours refusés, un retrait refusé une fois (un 502 que `retirer_label` tait) ; le premier `jouer` plafonne (lignes à l'auteur, au conducteur et à l'architecte, les deux étiquettes restées) ; le second rend `etiqueter`, règle 1, et ses lignes sont exactement « PR 12 : décision de plafond attendue » à l'auteur et au conducteur ; à la fin, `à-reprendre` seule et un seul commentaire du plafond.
4. **La marque sans les traces d'illisible, tenue** : K8 au banc, dans la forme du banc (le `gh` qui refuse un retrait une fois, comme les cas « contre-relecture 147 ») ; N3 à la liste des mutations.

## À faire, dans l'ordre

Après le ticket 75, § 2, dans la même branche (`claude/suites-relecteur`).

### § 1 — Les bancs de ce ticket d'abord, vus rouges, dans un arbre à part

```bash
git worktree add --detach "$S/rouge" HEAD
(cd "$S/rouge" && git apply "$S/75/ticket-75.patch" && git apply --include='*.test.mjs' "$S/76/ticket-76.patch" && git status --short)
(cd "$S/rouge" && timeout 900 node --test --test-reporter=tap skills/chaine/relecteur/scripts/relecteur.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok')
git worktree remove --force "$S/rouge"
```

L'arbre à part porte le ticket 75 et les seuls bancs de celui-ci. Attendu : `# tests 51`, `# pass 50`, `# fail 1`, le `not ok` « suite de la PR 147 — l'usage nomme chaque option de chaque sous-commande, comme l'en-tête (`--sondes` compris) ». Les deux autres cas neufs sont verts sans le code : ils tiennent ce que le code fait déjà (décisions 3 et 4), et leurs mutations (P1, P2, N3) les font rougir. Recopier les comptes dans la PR.

### § 2 — Le patch, dans la branche, et son banc vert

```bash
git apply "$S/76/ticket-76.patch" && git status --short
timeout 900 node --test --test-reporter=tap skills/chaine/relecteur/scripts/relecteur.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok'
```

Attendu : `# tests 51`, `# pass 51`, `# fail 0`. Puis le ticket 77, § 1.

## Surfaces

| Surface | Preuve |
| --- | --- |
| L'usage nomme chaque option de chaque sous-commande, comme l'en-tête | `relecteur.test.mjs`, « suite de la PR 147 — l'usage nomme chaque option… » ; mutations U1, U2, U3 |
| Un plafond rejoué après un retrait refusé redit « décision de plafond attendue » à l'auteur et au conducteur | « suite de la PR 147 — un plafond rejoué après un retrait refusé… » ; P1, P2 |
| Une trace d'illisible entre la pose et le rejeu n'est pas la marque | « suite de la PR 147 — une trace d'illisible écrite entre la pose et le rejeu… » ; N3 |
| L'en-tête dit le plafond rejoué | relu ; le texte du skill est tenu au ticket 77 |

## Mutations

[`76-annexes/mutations.mjs`](76-annexes/mutations.mjs), depuis la racine, la branche commitée (ticket 77, § 3) : `node "$S/76/mutations.mjs"`. Journal : [`76-annexes/mutations.txt`](76-annexes/mutations.txt).

| Mutation | Banc | Issue |
| --- | --- | --- |
| U1 relecteur.mjs : l'usage omet `--sondes` (le code d'avant, mineur 7 des tickets 67 à 70) | `relecteur.test.mjs` | rouge (99 s) |
| U2 relecteur.mjs : l'usage omet `--remplace <id>` de `distribuer` | `relecteur.test.mjs` | rouge (211 s) |
| U3 relecteur.mjs : l'en-tête omet `--sondes`, l'usage le garde (les deux ne disent plus la même chose) | `relecteur.test.mjs` | rouge (233 s) |
| P1 jouer : un plafond rejoué (règle 1) ne redit rien, même après un retrait refusé (la question 1 tranchée autrement) | `relecteur.test.mjs` | rouge (222 s) |
| P2 decision : la marque d'un `etiqueter` de la règle 1 est la date du dernier verdict, pas celle du commentaire du plafond | `relecteur.test.mjs` | rouge (237 s) |
| N3 decision : les traces d'illisible comptent dans la marque (`dernier` les exclut, A-183 point 6 ; contre-relecture de la PR 147, second tour) | `relecteur.test.mjs` | rouge (153 s) |

6 rouges sur 6.

## Vérification

1. § 1 : 1 rouge sur 51 avant le code (deux cas neufs verts, voulus) ; § 2 : 51 verts sur 51.
2. Les mutations : « toutes rouges » (6).
3. La suite entière et le diff : ticket 77, § 3.

### Ce qui a été joué en écrivant ce ticket

Sur un clone neuf de `https://github.com/MAJ-agency/skills` à `97d17e3` (plugin 7.39.0), le 2026-11-22, Node 22.23.5, git 2.43.0, quatre cœurs partagés avec d'autres agents (charge notée aux bords de chaque passe) :
- **Les patchs** : chacun des trois, `git apply --check` seul sur `97d17e3` ; puis 75, 76 et 77 l'un après l'autre : l'arbre obtenu (`b0e930ab…`, le ticket 77 retouché au tour de relecture) est celui de la branche que les § 1 à 3 construisent (patchs, `--exclude`, `version-suivante.mjs`, 7.39.1). Les autres ordres d'entrée, joués de bout en bout au tour de relecture par les gestes du § 3 du ticket 77 : après la PR B, seul `NOTES-DE-VERSION.md` en conflit, 7.39.2, et le même arbre que la PR B suivie des trois patchs posés par `git apply --exclude` et `version-suivante.mjs` ; après le lot 6 (`claude/lot-6-bascule-8` à `3dcb467`), les deux fichiers de version en conflit, 8.0.1 ; après le lot 6 et la PR B, 8.0.2. Ces arbres portent la date que `version-suivante.mjs` écrit dans la note : ils ne se citent pas.
- **Rouges avant** (§ 1, sur `97d17e3` et le ticket 75, le banc de ce ticket posé) : **1 rouge sur 51** (l'usage) ; les deux cas qui tiennent le code déjà juste, verts, rougis par P1, P2 et N3 ; **verts après** (§ 2) : **51 sur 51**.
- **Les mutations des trois tickets**, chacune seule, sur l'arbre des trois patchs, le fichier remis après : 10, 6 et 11, **27 rouges sur 27** (07:13 → 07:47 UTC, charge de 7,7 à 11,5) ; l'arbre propre après chaque passe (journaux dans les annexes).
- **La suite entière**, les quatre motifs de `pnpm test` joués par `node --test`, d'un seul tenant, en tâche de fond avec un `timeout` explicite, sur les trois patchs : **1 390 tests, 1 390 verts**, aucun échec, sauté ni annulé ; 16 min 14 s (06:56:37 → 07:12:52 UTC, `duration_ms` 974056), charge 0,37 au départ, 7,46 à la fin (un autre agent jouait ses bancs).

## Ce qui n'a pas été établi

1. **Un commentaire du plafond écrit, dont GitHub répond en échec** : le rejeu prévient l'auteur et le conducteur, pas l'architecte (le rapport de la PR 147, « Ce qui n'a pas été établi ») ; inchangé, c'est le comportement qu'`A-189` garde.
2. **Le banc de l'usage lit l'en-tête tel qu'il est écrit** (`//   node '<dossier du skill>/scripts/relecteur.mjs' `) : un appel écrit autrement dans l'en-tête n'y serait pas lu ; le banc exige les quatre appels, `passe`, `jouer`, `distribuer`, `veille`, dans cet ordre.

## Hors périmètre

- Le texte du skill (`SKILL.md`, « Les lignes ») : ticket 77.
- La décision elle-même (`decision-relecteur.mjs`) : inchangée.

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur `A-189` (points 1 et 3), la contre-relecture de la PR 147 (constats 7 et 13, essais K1 et K8, mutation N3) et le mineur 7 des tickets 67 à 70, sur un clone neuf de `main` à `97d17e3` ; bancs, mutations et suite joués (« Ce qui a été joué »).
- 2026-11-22 — Tour de relecture (`75-79-relecture-tour-1/rapport.md`, `A-199`) : ce ticket ne change pas ; « Les patchs » sous « Ce qui a été joué » récrit (le ticket 77 retouché, l'arbre `dde9aad7…` retiré) ; blocs et suite rejoués par le relecteur.
