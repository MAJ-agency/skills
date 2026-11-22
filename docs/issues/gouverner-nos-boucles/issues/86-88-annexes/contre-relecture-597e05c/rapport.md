# Contre-relecture de la PR 154 (tickets 86, 87, 88), tour 2

PR https://github.com/MAJ-agency/skills/pull/154, branche `claude/preuve-suffisante-socle-tests`, **le delta seul** entre
le sommet du tour 1 `42c51491fcff085e4922e67e95bc4f2c915b9698` et le sommet `597e05c737acc504296a190795520facf38d4171` (un
commit, « test(socle-tests): bancs du workflow de mesure, du premier push d'un sujet, la note et la fiche précisées
(retouche du tour 1) », six fichiers, `49 insertions(+), 10 deletions(-)`), base `main` à `ddb4265`. Relu le 2026-11-22
par un relecteur neuf, sur un clone neuf de `MAJ-agency/skills`, Node 22.23.5, pnpm 10.28.0, git 2.43.0, une machine
partagée (charge notée aux bords de chaque passe, entre 3,6 et 12,4). Lecture seule : rien de poussé, aucun commentaire ni
étiquette. Les décisions du tour 1 : `A-205` (`relecture-independante.spec.md`, branche `claude/hopeful-lovelace-ouk6tz` à
`fbe8fee`) et le rapport `contre-relecture-42c5149/rapport.md`. Anchorpost : un clone de `develop` à `31afa3d`, en lecture,
et la CLI publiée `@maj-agency/anchorpost` 2.0.2 installée à part.

## Verdict : non conforme au sommet `597e05c737acc504296a190795520facf38d4171`

Aucun bloquant. Le delta est le patch du tour 1 à l'octet (l'arbre de `42c5149` plus `retouche-154-tour-1.patch`,
`6c441645…`, est `e20d1f4d…`, celui de `597e05c`), et il ferme ce qu'`A-205` demandait : les mutations C1 à C11, C13, C15 et
C18 à C23 du tour 1 sont rouges, les 35 de l'annexe aussi, la CI de GitHub est verte sur `597e05c` (1 422 sur
1 422). La ligne de code de `preuves.mjs` ne casse aucun appel du socle ni d'Anchorpost : la fin de tour le lance sans
argument, le pre-push avec `--base-auto`, la CI avec `--base "origin/$BASE"`. Mais **un écart à corriger** : le texte que
le delta ajoute pour dire les deux bases d'une branche de mise à jour d'un sujet (mineur 8 du tour 1) renverse la
condition qui fait choisir develop, et affirme « jamais plus lâche » là où, contre develop, la comparaison l'est. Joué
contre la vraie CLI sur Anchorpost, en `enforce` : la fin de tour passe (0 écart, sortie 0) une mise à jour qui perd une
règle du sujet, et la CI la refuse (`rule-removed`, sortie 1). Quatre mineurs, des bancs encore creux à côté de ceux que le
delta pose. Une retouche, `retouches/retouche-154-tour-2.patch` sur `597e05c` (sha256
`48fb0c011c23d945c58b2e60abeb9b27d876c4a35e5b94260445fc391ab26fc7`, `retouches/SHA256SUMS`), porte les cinq ; elle ne
change aucune ligne de code exécutée, **aucun test n'est ajouté : la suite attendue reste 1 422**.

| # | Gravité | Objet |
| --- | --- | --- |
| 1 | **à corriger** | `preuves.mjs` (en-tête, « Limites ») et `SKILL.md` (étape 3) : la branche de mise à jour comparée à develop quand « le sujet a plus de commits que develop n'en apporte », c'est l'inverse ; et « plus large, jamais plus lâche » pour les deux bases, faux contre develop (une règle, un cas, une criticité que la mise à jour remet comme sur develop n'y paraissent pas) |
| 2 | mineur | `mutation.yml` : le banc d'ordre tient « mesure précédente, mutation » et « synthèse, publication », pas « mutation, synthèse » (D8 verte) ; ni le `if:` de « Mesure précédente » (D9 verte) |
| 3 | mineur | `NOTES-DE-VERSION.md`, ligne 16 : `BASE_DEFAUT` absent des imports nommés, aucune version de `coverage-diff-regles.mjs` (il faut 3.10.4), « un projet qui a ces deux fichiers d'avant » ne dit pas le projet à qui `environnement-de-banc.mjs` manque (Anchorpost) ; trois propositions sans banc (D17 à D19) |
| 4 | mineur | `preuves.test.mjs` : aucun cas d'usage ne met un argument après `--base <ref>` ; la mutation qui accepte tout ce qui suit `--base` est verte (D4) |
| 5 | mineur | le banc de la fiche ne tient pas l'énumération de « partielle » (D12 verte) |

## Ce que le delta ferme (`A-205`)

| Demandé par `A-205` | Au sommet `597e05c` | Preuve |
| --- | --- | --- |
| banc de `mutation.yml` : le nom de l'artefact dans l'URL, l'ordre synthèse puis publication, les replis sous `bash -e` | fermé | C1 à C4 rouges ; D10 (le plus ancien artefact) et D11 (le dossier de la précédente) rouges ; reste le constat 2 |
| le premier push d'un sujet neuf, la base nommée absente | fermé | C9, C10, C11 rouges ; D6 (repli sur develop au lieu de la plus proche) et D7 (rien à comparer) rouges |
| la note 8.1.0 : ce que la repose repose avec, le point 5 de l'ADR | fermé sur le fond, vrai | `essais/repose-dans-anchorpost.txt` ; C22 rouge ; D20 (la version) rouge ; le constat 3 pour la précision et le banc |
| « prouvée » dans `tests.md` comme la CLI | fermé | C23, D13 (familles de la seule haute), D14 (la question comptée pour une réponse) rouges ; la phrase est celle de `realisationOf`, `missingOf` et `unansweredFamilies` (source d'Anchorpost `develop`, mêmes expressions dans le paquet 2.0.2) |
| les bancs de la condition « pivot 3 » et des points d'entrée (mineur 5) | fermé | C5 à C8 rouges |
| `preuves.mjs` refuse un argument hors `--base <ref>` et `--base-auto` (mineur 7) | fermé | C18, D1, D2, D3, D5 rouges ; aucun appel cassé (`essais/appels-du-socle.txt`) ; reste le constat 4 |
| les « Limites » : le pre-push juge l'arbre de travail, la CI le commit (mineur 6) | fermé | C19, D15 rouges ; joué (`essais/cout-et-arbre.txt`) |
| les « Limites » : les deux bases d'une PR de mise à jour (mineur 8) | **non** | constat 1 |
| le coût mesuré dans `SKILL.md` (question 3) | fermé | C20 rouge ; 10 à 11 s par passage à charge 8 à 10, cohérent avec « 13 à 17 s … à une charge de 14 à 18 » |

## Les constats

### 1. À corriger — les deux bases d'une branche de mise à jour, dites à l'envers et « jamais plus lâche » à tort

**Où.** `skills/monorepo/socle-tests/references/scripts/verify/preuves.mjs`, lignes 24 à 27 :

> Une PR de mise à jour d'un sujet (develop fusionné dans le sujet) se compare à la base la plus proche, ni à la fusion
> recalculée de `coverage-diff`, ni au sujet que `coverage-diff --base-auto` retient pour elle : contre le sujet, elle
> peut juger des règles que develop a touchées ; contre develop (le sujet a plus de commits que develop n'en apporte), tout
> le travail du sujet. La comparaison est alors plus large, jamais plus lâche.

et `skills/monorepo/socle-tests/SKILL.md`, ligne 31 (étape 3) : « Une PR de mise à jour d'un sujet se compare à la plus
proche de ses deux bases, le sujet ou develop, jamais à la fusion recalculée de `coverage-diff` : plus large, jamais plus
lâche. » Le banc de texte exige la phrase de `SKILL.md` jusqu'à `coverage-diff` (ligne 48), pas sa fin.

**La condition est renversée.** `choisirBase` garde la plus petite `rev-list --count <ref>..HEAD`, develop à égalité. Sur
une branche de mise à jour (la fusion du sommet du sujet et de develop) : la distance au sujet est le nombre de commits que
develop apporte, plus la fusion ; la distance à develop, le nombre de commits du sujet, plus la fusion. Develop est donc
retenu quand develop apporte autant de commits que le sujet en a, ou plus ; le sujet, quand le sujet en a plus. Joué
(`essais/base-de-la-mise-a-jour.sh`, `.txt`, le relais de `597e05c` et un talon de la CLI) : sujet à 5 commits, develop
qui en apporte 1, `preuves : base origin/sujet/x` ; sujet à 1, develop à 5, `preuves : base origin/develop`. La phrase du
constat 8 du tour 1 portait déjà ce renversement ; le patch l'a recopiée.

**« Jamais plus lâche » est faux contre develop.** Les écarts de `compare` se lisent de la base à la tête
(`apps/cli/src/compare/changes.ts` : `rule-removed`, `criticality-change-refused`, `business-case-without-validation`,
`technical-case-without-revision`, `floor-lowered`, `rule-devalidated`…). Contre develop, ce que la mise à jour défait du
sujet (une règle, un cas, une criticité que la résolution d'un conflit remet comme sur develop) n'existe ni dans la base ni
dans la tête : rien ne se voit. Joué (`essais/mise-a-jour-plus-lache.sh`, `.txt`), CLI 2.0.2 sur un clone d'Anchorpost
`develop` (index au pivot 3) : le sujet ajoute une règle, develop apporte deux commits (trois en `enforce`), la mise à jour
fusionne develop et perd la règle. Fin de tour (sans option, ce que fait aussi le pre-push vers une branche qui n'est pas un
sujet) : `base origin/develop … 0 écart(s)`, sortie 0, **en `enforce` aussi**. Avec `--base origin/sujet/x`, ce que la CI
passe (la cible de la PR) : `refus rule-removed RULE_ALL_ANC-99`, sortie 1. La CI rattrape, mais le gate local est plus lâche
qu'elle, le contraire de ce que le texte dit. Contre le sujet, la phrase est juste : la comparaison est celle de la CI,
élargie à ce que develop apporte.

**Pourquoi « à corriger ».** C'est le texte qu'`A-205` a fait écrire pour dire où le gate local diffère de la CI (« par le
texte : la base et ses deux cas ») ; il dit l'inverse pour l'un des deux cas. Le code n'est pas en cause : la plus proche
est la décision 3 du ticket 86. **La retouche** (partie 1) : l'en-tête et `SKILL.md` disent la bonne condition, « plus
large, jamais plus lâche » pour le sujet, et pour develop ce qu'il ne voit pas et que la CI juge ; la phrase entière exigée
dans le banc de texte ; et, dans le test « la base : … » de `preuves.test.mjs`, les deux formes de la mise à jour jouées
(develop qui apporte plus : develop ; le sujet qui a plus : le sujet), pour que le texte et le code ne se quittent plus. La
mutation E1 (la mise à jour toujours mesurée contre le sujet, la règle de `coverage-diff`) est verte sur `597e05c`, rouge la
retouche posée, par la seule assertion neuve « mise à jour, develop apporte plus : develop ». Question 1 plus bas.

### 2. Mineur — l'ordre des étapes de `mutation.yml` tenu à moitié

`scripts/preuve-suffisante-socle-tests.test.mjs`, lignes 93 et 94 : « Mesure précédente » avant « Mutation des règles… », et
« Synthèse par règle » avant « Mesure datée ». Verte, contre ce banc et `depot.test.mjs` : **D8**, la synthèse avant la
mutation. Elle lit un rapport de Stryker absent : chaque dimanche « pas de rapport », aucune mesure publiée, rien de rouge.
Verte aussi : **D9**, le `if:` de « Mesure précédente » sur `noyau` : sur `regles`, la précédente n'est jamais lue, la baisse
d'une règle moyenne jamais dite (l'effet de C1). Le texte du workflow n'est pas dans le delta, mais ce banc en est la seule
garde (`A-202`) et le delta y a posé l'ordre. **La retouche** (partie 2) : l'assertion « mutation, puis synthèse », et le
`if: env.CIBLE == 'regles'` en tête de la phrase `env: GH_TOKEN: …` déjà exigée. D8 et D9 rouges la retouche posée.

### 3. Mineur — la ligne « Reposer » de la note, vraie mais imprécise

`NOTES-DE-VERSION.md`, ligne 16. Ce qu'elle dit tient (`essais/repose-dans-anchorpost.txt`) : dans Anchorpost `develop`, le
banc reposé sort sur `ERR_MODULE_NOT_FOUND` sans `scripts/docs/environnement-de-banc.mjs`, 8 sur 8 avec ; ce module date
bien du 7.21.0 (`fad725d`) ; `check:tickets` joue `scripts/verify/*.test.mjs` (skill `tickets`) ; le point 5 du gabarit
d'ADR est amendé dans cette PR. Mais :

- elle nomme trois imports sur quatre : `BASE_DEFAUT` manque, et c'est lui que nomme l'erreur d'un projet d'avant le
  2026-11-10 (`SyntaxError: … does not provide an export named 'BASE_DEFAUT'`, avec le fichier du plugin 3.7.1) ;
- elle ne date pas `coverage-diff-regles.mjs` : avec celui du 3.10.1 (`1b7c7fb`), les quatre noms sont là, le relais se
  charge, mais `decisionSansBase` ne prend pas de branche et ne rend jamais `base-a-fetcher` : le banc échoue, 7 sur 8
  (« une base introuvable »), donc `check:tickets`. Il faut le 3.10.4 (`a6d8e16`, 2026-11-11) ;
- « un projet qui a ces deux fichiers d'avant les repose avec » ne dit pas, à la lettre, le projet qui n'a pas du tout
  `environnement-de-banc.mjs` : le cas d'Anchorpost, celui qui a fait le constat 3 du tour 1 ;
- D17 (le point 5 de l'ADR du projet), D18 (l'adaptation dans le dépôt de la CLI) et D19 (ce qui casse sans les deux
  appuis) retirés de la note : verts.

**La retouche** (partie 3) : les quatre imports, « du socle 3.10.4 ou plus récent », « un projet à qui l'un manque, ou qui
l'a d'avant, le repose avec », et ce qui casse selon le cas ; la parenthèse entière et la clause de l'ADR exigées. D17 à D19,
E5 à E7 rouges la retouche posée. `A-205` point 2 vaut : à la fusion de `main`, la note se repose depuis la branche.

### 4. Mineur — l'usage, sans cas d'un argument après `--base <ref>`

La boucle d'usage de `preuves.test.mjs` (ligne 146) a `["HEAD~3"]` et `["--base-auto", "origin/develop"]`, pas
`["--base", "origin/develop", "HEAD~3"]`. Le code le refuse ; **D4** (`!(k > i && i !== -1)` : tout ce qui suit `--base` est
accepté) est verte. **La retouche** (partie 4) : ce cas dans la boucle. D4 rouge.

### 5. Mineur — « partielle » sans banc

Le banc de la fiche exige « Une règle est « prouvée » quand … a sa réponse » et « ou une question ouverte, qui la laisse
partielle », pas l'énumération de « partielle » entre les deux : **D12** (« pas de cas normal » retiré) est verte. La phrase
est juste (c'est `missingOf` : `nominal`, `families`, et les cas sans preuve). **La retouche** (partie 5) : l'énumération
exigée. D12 rouge.

**Pour mémoire, sans retouche.** C12, C14, C16 et C17 restent vertes, sans conséquence, comme le tour 1 l'a dit. D21 et E8
(les « Limites » de l'en-tête de `preuves.mjs`, un commentaire) sont vertes : le banc tient la phrase de `SKILL.md`, qui dit la
même chose (C19, D15, E2 à E4).

## La retouche du tour 2

`retouches/retouche-154-tour-2.patch`, sur `597e05c`, sha256 `48fb0c011c23d945c58b2e60abeb9b27d876c4a35e5b94260445fc391ab26fc7`
(`retouches/SHA256SUMS`) ; `git apply --check` propre ; cinq fichiers, `44 insertions(+), 12 deletions(-)`, aucun neuf.

| Partie | Constat | Fichiers |
| --- | --- | --- |
| 1 | 1 (les deux bases d'une mise à jour) | `preuves.mjs` (l'en-tête seul, aucune ligne de code), `SKILL.md`, `preuves.test.mjs` (deux formes jouées dans « la base : … »), le banc de texte |
| 2 | 2 (l'ordre et la garde du workflow) | `scripts/preuve-suffisante-socle-tests.test.mjs` |
| 3 | 3 (la ligne « Reposer ») | `NOTES-DE-VERSION.md`, le banc de texte |
| 4 | 4 (l'usage) | `preuves.test.mjs` |
| 5 | 5 (« partielle ») | le banc de texte |

**Rouge avant, vert après** (`essais/bancs-et-ci.txt`) : les quatre bancs touchés (`preuves.test.mjs`, le banc de texte,
`points-d-entree.test.mjs`, `depot.test.mjs`), 152 tests : sur `597e05c`, 152 verts ; les seuls fichiers de bancs de la
retouche posés sur `597e05c`, 151 verts et 1 rouge (« le relais preuves dit qu'il sort en 2 … » : la phrase des deux bases,
la ligne « Reposer ») ; la retouche entière, 152 verts. Les parties 2, 4, 5 et les deux formes de la partie 1 tiennent un code
ou un texte juste : leur rouge est celui des mutations. **Mutations, la retouche posée** : `mutations/retouche-t2.mjs`, 14
rouges sur 15 (E8 verte, le commentaire ci-dessus) ; E1 verte sur `597e05c` (`retouche-t2-E1-sur-597e05c.txt`) ;
`contre.mjs` du tour 1 : 28 rouges, les 4 vertes de toujours, C21 et C22 introuvables (leurs textes sont récrits, E2 à E7 et
D17 à D19 les remplacent) ; l'annexe : 35 rouges sur 35, `toutes rouges`.

## Questions à l'architecte

1. **Le constat 1, par le texte ou par le code ?** Le relais pourrait retenir le sujet pour une branche de mise à jour, comme
   `coverage-diff --base-auto` (`sujetMisAJour`, la forme lue par `fusionRecalculee`) : le gate local jugerait alors une mise
   à jour comme la CI. **Recommandation : le texte dans cette PR** (la retouche) : la plus proche est la décision 3 du ticket
   86, voulue, et la CI rattrape ; le code, une décision à part, si un projet en `enforce` s'y heurte.

## Ce qui a été joué

- **L'identité du delta** : `retouche-154-tour-1.patch` (sha256 vérifié `6c441645…`) posé sur `42c5149`, arbre `e20d1f4d…`,
  celui de `597e05c`.
- **Les appels du relais** (`essais/appels-du-socle.txt`) : la fin de tour du socle et celle d'Anchorpost lancent la gate sans
  argument ; `pnpm run` passe `--base-auto` tel quel (pnpm 10.28.0, et `--` passé tel quel, refusé avant comme après) ; la CI
  `--base "origin/$BASE"`. Sur Anchorpost : sans option, `--base-auto`, `--base origin/develop` rendent la sortie 2 « CLI
  introuvable » de la décision 7, `HEAD~3` l'usage.
- **Les bancs touchés**, avant et après la retouche, et les bancs du delta seuls sur `42c5149` : 83 tests, 3 rouges, le rouge
  avant du tour 1 (`essais/bancs-et-ci.txt`).
- **Mutations** : `contre.mjs` du tour 1 sur `597e05c` (30 rouges, C12, C14, C16, C17 vertes : le compte du tour 1 sur la
  retouche, `mutations/contre-sur-597e05c.txt`) ; l'annexe, 35 sur 35 (`mutations/annexe-sur-597e05c.txt`) ; `delta.mjs`,
  21 mutations neuves du delta (D1 à D21) : 12 rouges, 9 vertes (D4, D8, D9, D12, D16 à D19, D21 ;
  `mutations/delta-sur-597e05c.txt`) ; puis la retouche posée (ci-dessus).
- **La base d'une mise à jour** (talon) et **la mise à jour plus lâche** (CLI 2.0.2, Anchorpost, `observe` et `enforce`).
- **La repose dans Anchorpost** (`essais/repose-dans-anchorpost.sh`, `.txt`) : le banc sans et avec l'environnement de
  banc ; trois `coverage-diff-regles.mjs` d'avant (3.7.1, 3.10.1, 3.10.4).
- **Le coût et l'arbre de travail** (`essais/cout-et-arbre.txt`) : trois passages de 10,1 à 10,9 s à charge 8,4 à 9,8 ;
  une règle remise dans l'arbre, non suivie, fait passer un commit qui la retire.
- **La fiche contre la CLI** : `realisation.ts` et `families.ts` d'Anchorpost `develop`, et les mêmes expressions dans
  `dist/cli.cjs` du paquet 2.0.2.
- **La CI de GitHub sur `597e05c`** (lecture seule) : CI, job « bancs », success, `pnpm test` 1 422 tests, 1 422 verts
  (1 036 s) ; CodeQL (`actions`, `javascript-typescript`) success.

## Ce qui n'a pas été établi

1. **La suite entière** : pas jouée ici, ni sur `597e05c` (la CI et la session la donnent à 1 422) ni sur la retouche, dont
   seuls les quatre bancs touchés ont tourné (152 sur 152). Le compte de 1 422 tient par construction (aucun test ajouté).
2. **Les autres écarts relatifs à la base dans une mise à jour contre develop** (criticité, cas, plancher) : seul
   `rule-removed` a été joué ; les autres se lisent dans `changes.ts`, non joués.
3. **Le workflow de mutation sous GitHub Actions** : jamais tourné, comme au tour 1.
4. **Un vrai `git push`** sous le hook husky : le pre-push est joué par `node` et `PRE_PUSH_REFS`, pas par git.
5. **La CLI 2.0.1** du tour 1 : non rejouée ; la 2.0.2 a servi, sa règle de réalisation est celle de la source d'Anchorpost
   `develop`.
6. **Les ordres d'entrée du § 3** : non rejoués ; le delta et la retouche ne touchent que des fichiers déjà dans la PR, dont la
   note, qui se repose depuis la branche (`A-205` point 2).
