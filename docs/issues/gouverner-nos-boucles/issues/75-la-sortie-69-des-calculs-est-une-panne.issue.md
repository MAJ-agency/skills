# La sortie 69 des calculs est une panne : le capitaine sort en 3, le Relecteur en 6, la cause dite, jamais une lecture illisible

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — une décision d'`A-192` (point 1) jouée des deux côtés, chez le capitaine (`revue-exigee.mjs`) et chez le Relecteur (`relecteur.mjs`) ; le code entier est dans le patch ([`75-annexes/ticket-75.patch`](75-annexes/ticket-75.patch), sha256 `6cbb0e81ab0841e68f7f11c30f9a5ddd61bfecd96707c07d8ede2ec75f93e9a7`, `git apply` sur `main` à `97d17e3`, plugin 7.39.0), décrit fichier par fichier ci-dessous ; deux cas de banc rouges avant le code, verts après ; les mutations de [`75-annexes/mutations.mjs`](75-annexes/mutations.mjs) toutes rouges. Rien n'est à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas. Premier des trois tickets de la PR A (75, 76, 77) : « Une PR, trois tickets ».
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/revue-exigee.mjs` et `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs` (aucun autre ticket de suite ne les touche ; le lot 6 non plus, d'après sa liste) ; `skills/chaine/relecteur/scripts/relecteur.mjs` et `relecteur.test.mjs` (le ticket 76 les touche aussi, dans la même PR, ailleurs dans les fichiers : chaque patch s'applique seul sur `97d17e3`, et l'un après l'autre). `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` : portés par le ticket 77 pour la PR entière ; la PR B (tickets 78 et 79) les touche aussi.

## Le besoin

La contre-relecture de la PR 149 (lot 5), premier tour, question 1 (`71-73-annexes/contre-relecture-9db4fb3/rapport.md`, « Questions à l'architecte » ; reprise au troisième tour, « Ce qui reste à la suite », Q1). Les deux calculs que le capitaine et le Relecteur jouent pour chaque PR du régime 8 sortent en 69 quand un outil de la chaîne manque au poste : `meme-contenu.sh` pour `jq`, `mktemp` ou `rm` absents, ou un git plus ancien que 2.41 (son en-tête, « Sorties ») ; `double-relecture.mjs` pour `git` absent ou la grammaire des identifiants introuvable (`SORTIES.outilManquant`). Sur `main` à `97d17e3`, les deux appelants lisent tout code autre que 0 et 20 comme « illisible » :

- **Chez le capitaine**, `exigesDe` et `memeContenuDe` de `revue-exigee.mjs` rendent `'illisible'` ; `tourValide` lève `LectureIllisible` ; la CLI sort en 21 ; `passer.sh` saute la PR en 7, « le Relecteur prévient l'architecte ». Un capitaine à un git ancien saute ainsi, sans bruit et à chaque passage, toute PR dont un tour porte sur un sommet plus ancien (le rapport, Q1).
- **Chez le Relecteur**, `exiges()` et la boucle de `memeContenu` de `relecteur.mjs` rendent `'illisible'` : `decider` rend le geste `illisible`, `jouer` écrit « Lecture illisible — « double relecture exigée » illisible » sur la PR et une ligne à l'architecte, et redit l'une et l'autre à chaque `relecture.delai`, sur chaque PR, alors que la PR n'y est pour rien.

Mesuré sur `97d17e3` (Node 22.23.5, git 2.43.0) : `double-relecture.mjs` copié seul dans un dossier, sans `scripts/docs/identifiants.mjs` à côté, écrit `# illisible : scripts/docs/identifiants.mjs introuvable depuis <dossier>` puis `illisible` sur sa sortie standard, et sort en 69 ; `meme-contenu.sh` écrit `illisible` sur sa sortie standard et sa raison sur sa sortie d'erreur.

## Une PR, trois tickets

`P-65` : une famille de fichiers par PR, trois tickets au plus, chacun un tour de relecture. La PR A porte les suites du Relecteur : ce ticket (le fait commun au capitaine et au Relecteur, `A-192` point 1 : « traités ensemble »), le ticket 76 (le script du Relecteur) et le ticket 77 (son texte, avec la suite de la sortie 6 que ce ticket ouvre, la version et la note). La PR B (tickets 78 et 79, le capitaine et le hook) ne touche aucun de leurs fichiers hors des deux fichiers de version : les deux PR partent en parallèle, et celle qui entre en second suit la règle du ticket 77, § 3.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/revue-exigee.mjs` | `sansOutil(calcul, r)`, après la classe `Illisible` : une sortie 69 lève une `Error` (une panne), avec la cause ; appelée par `exigesDe` et `memeContenuDe` avant leur lecture du code ; l'en-tête, « Sortie 3 » |
| `skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs` | un test, après « double-relecture.mjs ou meme-contenu.sh absent… » |
| `skills/chaine/relecteur/scripts/relecteur.mjs` | `sansOutil(calcul, r)`, avant `exiges` : une sortie 69 arrête en 6, avec la cause ; appelée par `exiges` et dans la boucle de `memeContenu` ; l'en-tête, « Sorties », 6 |
| `skills/chaine/relecteur/scripts/relecteur.test.mjs` | un test, après « N1 à N4, N7 » |

## Décisions

1. **Une sortie 69 d'un calcul est une panne, jamais une lecture illisible** (`A-192`, point 1), des deux côtés, et elle seule : une sortie 21 reste « illisible » (une PR que son auteur ne peut pas corriger : sautée chez le capitaine, tracée chez le Relecteur, `A-113`). Raison : un outil absent du poste le serait pour toute PR ; le dire « illisible », c'est sauter ou tracer chaque PR, en silence chez le capitaine, à chaque délai chez le Relecteur, sans que personne ne répare le poste.
2. **Chez le capitaine, la sortie 3** : `sansOutil` lève une `Error`, que `verdictEnLigne` laisse passer (elle n'est pas une `LectureIllisible`) ; la CLI écrit « `revue du capitaine en échec : <calcul> : un outil de la chaîne manque au poste (sortie 69) : <cause>` » et sort en 3, le chemin d'un calcul absent (décision 4 du ticket 71). `passer.sh` sort alors en 3 (« revue du capitaine en échec (sortie 3) : … »), `sujet.sh fusionner` en 11 : leur branche « autre » d'aujourd'hui, sans retouche. `A-192` dit « le capitaine sort en 3 ».
3. **Chez le Relecteur, la sortie 6** : `sansOutil` appelle `arreter(6, …)`, qui traverse `decision` (son `catch` ne retient que `LectureIllisible`) ; la sous-commande écrit « `relecteur : <calcul> : un outil de la chaîne manque au poste (sortie 69) : <cause>` » et sort en 6, sans rien écrire sur GitHub, et la veille s'arrête en « `VEILLE ARRÊTÉE sortie 6` ». C'est la sortie des calculs absents (`preparer`, « `scripts/chaine/` incomplet ») et de `flock` manquant : un poste qui ne porte pas la chaîne. La suite de la sortie 6 dans le skill (« l'architecte, et s'arrêter ») nomme la sortie 69 au ticket 77. `A-192` laisse le code du Relecteur à choisir (« le même fait ») : question 1.
4. **La cause** : la première ligne non vide qui n'est pas le seul mot `illisible`, sur la sortie d'erreur puis sur la sortie standard, le préfixe `# illisible : ` retiré (`double-relecture.mjs` écrit sa cause en `# illisible : …` sur la sortie standard ; `meme-contenu.sh` sur sa sortie d'erreur) ; aucune : « sans cause écrite ». La même fonction dans les deux fichiers, aucun module commun : `relecteur.mjs` ne charge rien de `revue-exigee.mjs`.

## Questions à l'architecte

1. **Le code du Relecteur pour une sortie 69 : 6.** La spec ne le tranche pas. 6 est la sortie de « ce poste ne porte pas la chaîne » (calculs absents, `flock` manquant), dont la suite est « l'architecte, et s'arrêter » ; l'architecte répare le poste ou relance un Relecteur ailleurs. Autre choix : 3, comme le capitaine ; mais 3 veut dire chez le Relecteur « la PR est fermée, ou le geste a changé », dont la suite est `passe` : la session tournerait en rond. **Recommandation : 6.**

## À faire, dans l'ordre

Chaque bloc se joue tel quel depuis la racine du dépôt, `S` étant le scratchpad de la session (`S=<son chemin absolu>`). Un geste qui ne rend pas ce qui est écrit : s'arrêter et l'écrire au lanceur, sans improviser. Les trois tickets de la PR A se jouent l'un après l'autre dans la même branche : ce § 0 une fois, puis les § 1 et § 2 de 75, de 76 et de 77, puis le § 3 du ticket 77.

### § 0 — Partir de `main`, les annexes des trois tickets

```bash
git fetch origin main '+refs/heads/claude/hopeful-lovelace-ouk6tz:refs/remotes/origin/claude/hopeful-lovelace-ouk6tz'
git switch -C claude/suites-relecteur origin/main
for n in 75 76 77; do mkdir -p "$S/$n" && for f in ticket-$n.patch mutations.mjs; do git show "origin/claude/hopeful-lovelace-ouk6tz:docs/issues/gouverner-nos-boucles/issues/$n-annexes/$f" > "$S/$n/$f"; done; done
git show "origin/claude/hopeful-lovelace-ouk6tz:docs/issues/gouverner-nos-boucles/issues/77-annexes/version-suivante.mjs" > "$S/77/version-suivante.mjs"
sha256sum "$S"/75/ticket-75.patch "$S"/76/ticket-76.patch "$S"/77/ticket-77.patch
git show origin/main:.claude-plugin/plugin.json | grep '"version"'
pnpm install --frozen-lockfile
```

Les annexes se lisent sur la branche de documentation du programme (sur `main` si la PR de documentation qui porte ces tickets y est entrée : `git show origin/main:<chemin>`), et s'écrivent dans `S`, jamais dans le dépôt. Les sommes attendues : **`6cbb0e81ab0841e68f7f11c30f9a5ddd61bfecd96707c07d8ede2ec75f93e9a7`**, **`698a71b872451d8863152db1c1bd130e49005dc45e8ca2aa0a3d18823de02be1`**, **`e73b4ef762a3bae330a23007e9aa3c537164fe84cd5fe4f11bdefb5a1ffb3937`** ; une autre : s'arrêter. La version de `main` : 7.39.0 (`97d17e3`), 7.39.1 si la PR B est entrée avant, 8.0.0 depuis l'entrée du lot 6 (`ddb4265`, PR 151, le 2026-11-22 : le cas d'aujourd'hui), 8.0.1 si la PR B y est entrée ensuite ; les gestes sont les mêmes ; les comptes des § 1 et § 2 aussi (le lot 6 ne touche aucun de leurs bancs : rejoué au tour de relecture), ceux de la suite entière sont ceux de la table du ticket 77, § 3.

### § 1 — Les bancs de ce ticket d'abord, vus rouges, dans un arbre à part

```bash
git worktree add --detach "$S/rouge" HEAD
(cd "$S/rouge" && git apply --include='*.test.mjs' "$S/75/ticket-75.patch" && git status --short)
(cd "$S/rouge" && timeout 900 node --test --test-reporter=tap skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs skills/chaine/relecteur/scripts/relecteur.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok')
git worktree remove --force "$S/rouge"
```

Deux fichiers posés (`git status --short` : deux lignes ` M`), jamais dans la branche de la session. Attendu : `# tests 74`, `# pass 72`, `# fail 2`, et les deux `not ok` : « régime 8 : un calcul sorti en 69 (un outil de la chaîne manque au poste) est une panne (3)… » et « suite du lot 5 — un calcul sorti en 69… : la passe et `jouer` sortent en 6… ». Recopier les deux comptes dans la PR.

### § 2 — Le patch, dans la branche, et ses bancs verts

```bash
git apply "$S/75/ticket-75.patch" && git status --short
timeout 900 node --test --test-reporter=tap skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs skills/chaine/relecteur/scripts/relecteur.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |^not ok'
```

Quatre fichiers modifiés ; attendu : `# tests 74`, `# pass 74`, `# fail 0`. Puis le ticket 76, § 1.

Le patch, fichier par fichier (il fait foi) :

- **`revue-exigee.mjs`** : l'en-tête, « Sortie 3 : en régime 8, l'outil en panne (un calcul absent à côté, une exception, ou un calcul sorti en 69 : un outil de la chaîne manque au poste, git plus ancien que 2.41, `jq` absent, A-192 point 1) : jamais un refus, jamais une lecture illisible. » ; après `class Illisible extends Error {}`, `sansOutil(calcul, r)` et son commentaire (décisions 1, 2 et 4) ; `sansOutil('double-relecture.mjs', r);` en tête du retour de `exigesDe`, `sansOutil('meme-contenu.sh', r);` en tête de celui de `memeContenuDe`.
- **`relecteur.mjs`** : l'en-tête, la sortie 6 (« ou un calcul dit qu'un outil de la chaîne manque au poste (sa sortie 69 : git plus ancien que 2.41, `jq` absent, la grammaire des identifiants introuvable), jamais une lecture illisible (A-192, point 1) ») ; avant `exiges`, `sansOutil(calcul, r)` et son commentaire (décisions 1, 3 et 4) ; `sansOutil('double-relecture.mjs', r);` dans `exiges`, `sansOutil('meme-contenu.sh', r);` dans la boucle de `memeContenu`.
- **`verdict-du-capitaine.test.mjs`**, « régime 8 : un calcul sorti en 69 (un outil de la chaîne manque au poste) est une panne (3), la cause dite, jamais une lecture illisible (21) » : les calculs copiés dans `projet/scripts/chaine/` (comme le test qui le précède) ; sans la grammaire, le vrai `double-relecture.mjs` sort en 69, et la CLI en 3, sa cause dite ; un talon de `meme-contenu.sh` qui sort en 69 pour le sommet d'un tour plus ancien, 3 ; un talon de `double-relecture.mjs` qui sort en 21, toujours 21.
- **`relecteur.test.mjs`**, « suite du lot 5 — un calcul sorti en 69… » : un talon de `double-relecture.mjs` sur develop qui sort en 69 (sa cause en `# illisible : …`) : `passe` et `jouer` sortent en 6, la cause dite, rien d'écrit sur GitHub, et `veille --pause 0 --sondes 1` finit par `VEILLE ARRÊTÉE sortie 6` ; un talon de `meme-contenu.sh` qui sort en 69 (sa cause sur la sortie d'erreur), sur une PR poussée après un tour validé : `jouer` sort en 6 ; un talon qui sort en 21 : le geste reste `illisible`.

## Surfaces

| Surface | Preuve |
| --- | --- |
| Capitaine : une sortie 69 de « double relecture exigée » est une panne (3), la cause dite | `verdict-du-capitaine.test.mjs`, « régime 8 : un calcul sorti en 69… » ; mutations Q1, Q3, Q4 |
| Capitaine : une sortie 69 de « même contenu propre » est une panne (3) | le même test ; Q2 |
| Capitaine : une sortie 21 reste une lecture illisible (21) | le même test ; Q5 |
| Relecteur : une sortie 69 de « double relecture exigée » arrête en 6, rien d'écrit, la cause dite ; la veille s'arrête | `relecteur.test.mjs`, « suite du lot 5 — un calcul sorti en 69… » ; Q6, Q8, Q9 |
| Relecteur : une sortie 69 de « même contenu propre » arrête en 6 | le même test ; Q7 |
| Relecteur : une sortie 21 reste le geste `illisible` | le même test, et « N1 à N4, N7 » ; Q10 |

## Mutations

[`75-annexes/mutations.mjs`](75-annexes/mutations.mjs), depuis la racine, la branche commitée (ticket 77, § 3) : `node "$S/75/mutations.mjs"`. Chacune seule, le fichier remis après, sur le banc qu'elle nomme ; journal : [`75-annexes/mutations.txt`](75-annexes/mutations.txt).

| Mutation | Banc | Issue |
| --- | --- | --- |
| Q1 revue-exigee.mjs : la sortie 69 de « double relecture exigée » lue « illisible » (le code d'avant) | `verdict-du-capitaine.test.mjs` | rouge (77 s) |
| Q2 revue-exigee.mjs : la sortie 69 de « même contenu propre » lue « illisible » | `verdict-du-capitaine.test.mjs` | rouge (78 s) |
| Q3 revue-exigee.mjs : la sortie 69 est une lecture illisible (21), pas une panne (3) | `verdict-du-capitaine.test.mjs` | rouge (76 s) |
| Q4 revue-exigee.mjs : la cause est la dernière ligne non vide (« illisible »), pas celle du calcul | `verdict-du-capitaine.test.mjs` | rouge (70 s) |
| Q5 revue-exigee.mjs : toute sortie non nulle est une panne (une sortie 21 aussi) | `verdict-du-capitaine.test.mjs` | rouge (66 s) |
| Q6 relecteur.mjs : la sortie 69 de « double relecture exigée » lue « illisible » (le code d'avant) | `relecteur.test.mjs` | rouge (105 s) |
| Q7 relecteur.mjs : la sortie 69 de « même contenu propre » lue « illisible » | `relecteur.test.mjs` | rouge (107 s) |
| Q8 relecteur.mjs : la sortie 69 est GitHub illisible (5, une pause sans fin), pas 6 | `relecteur.test.mjs` | rouge (100 s) |
| Q9 relecteur.mjs : la cause est la dernière ligne non vide (« illisible »), pas celle du calcul | `relecteur.test.mjs` | rouge (97 s) |
| Q10 relecteur.mjs : toute sortie non nulle est une panne (une sortie 21 aussi) | `relecteur.test.mjs` | rouge (98 s) |

10 rouges sur 10.

## Vérification

1. § 1 : 2 rouges sur 74 avant le code ; § 2 : 74 verts sur 74.
2. Les mutations, depuis la racine, la branche commitée : « toutes rouges » (10).
3. La suite entière et le diff : ticket 77, § 3.

### Ce qui a été joué en écrivant ce ticket

Sur un clone neuf de `https://github.com/MAJ-agency/skills` à `97d17e3` (plugin 7.39.0), le 2026-11-22, Node 22.23.5, git 2.43.0, quatre cœurs partagés avec d'autres agents (charge notée aux bords de chaque passe) :
- **Les patchs** : chacun des trois, `git apply --check` seul sur `97d17e3` ; puis 75, 76 et 77 l'un après l'autre : l'arbre obtenu (`b0e930ab…`, le ticket 77 retouché au tour de relecture) est celui de la branche que les § 1 à 3 construisent (patchs, `--exclude`, `version-suivante.mjs`, 7.39.1). Les autres ordres d'entrée, joués de bout en bout au tour de relecture par les gestes du § 3 du ticket 77 : après la PR B, seul `NOTES-DE-VERSION.md` en conflit, 7.39.2, et le même arbre que la PR B suivie des trois patchs posés par `git apply --exclude` et `version-suivante.mjs` ; après le lot 6 (`claude/lot-6-bascule-8` à `3dcb467`), les deux fichiers de version en conflit, 8.0.1 ; après le lot 6 et la PR B, 8.0.2. Ces arbres portent la date que `version-suivante.mjs` écrit dans la note : ils ne se citent pas.
- **Rouges avant** (§ 1, les deux bancs du patch seuls posés sur `97d17e3`) : **2 rouges sur 74**, les deux cas neufs ; **verts après** (§ 2) : **74 sur 74**.
- **Les mutations des trois tickets**, chacune seule, sur l'arbre des trois patchs, le fichier remis après : 10, 6 et 11, **27 rouges sur 27** (07:13 → 07:47 UTC, charge de 7,7 à 11,5) ; l'arbre propre après chaque passe (journaux dans les annexes).
- **La suite entière**, les quatre motifs de `pnpm test` joués par `node --test`, d'un seul tenant, en tâche de fond avec un `timeout` explicite, sur les trois patchs : **1 390 tests, 1 390 verts**, aucun échec, sauté ni annulé ; 16 min 14 s (06:56:37 → 07:12:52 UTC, `duration_ms` 974056), charge 0,37 au départ, 7,46 à la fin (un autre agent jouait ses bancs).

## Ce qui n'a pas été établi

1. **Un vrai poste à git 2.40 ou sans `jq`** : les sorties 69 sont jouées par la grammaire absente (la vraie sortie 69 de `double-relecture.mjs`) et par des talons. Sans `jq`, `github.sh` sort lui-même en 69 dès son chargement : le capitaine s'arrête avant tout calcul (`passer.sh`, sortie 69), et le Relecteur lit chaque lecture de GitHub en 5 (`lire`, « GitHub illisible »), une pause, et la borne de la sortie 5 du ticket 77 ne vaut que pour `jouer`, qui ne se joue jamais ici : la veille rejouerait sans fin, sans prévenir personne. La contre-relecture de la PR 153 (tour 1, `A-203`) l'a joué ; la retouche de la PR fait de cette sortie 69 une sortie 6 (`sansOutil('github.sh', r)` en tête de `lire`).
2. **La boucle du capitaine sur une sortie 3 de `passer.sh`** suit ce qu'elle fait aujourd'hui pour « revue du capitaine en échec » (un calcul absent, décision 4 du ticket 71) : rien de neuf n'est joué contre `boucle.sh`.

## Hors périmètre

- `fusionner/SKILL.md` (la suite de la sortie 3 chez le capitaine) : lot 6, partie 6b ; il ne change pas ici, la sortie 3 en a déjà une.
- La sortie 69 de `github.sh` lui-même (`jq` absent au chargement), déjà une panne chez le capitaine.

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur `A-192` (point 1) et la contre-relecture de la PR 149 (Q1), sur un clone neuf de `main` à `97d17e3` (plugin 7.39.0) ; bancs, mutations et suite joués (« Ce qui a été joué »).
- 2026-11-22 — Tour de relecture (`75-79-relecture-tour-1/rapport.md`, `A-199`) : ce ticket ne change pas ; l'empreinte du ticket 77 (retouché) au § 0, les versions de `main` possibles, et « Les patchs » sous « Ce qui a été joué » (l'arbre `dde9aad7…` n'était pas reproductible : il dépend de la date de la note) ; blocs et suite rejoués par le relecteur.
