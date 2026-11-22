# La preuve suffisante, part de `skills` (K6) : la mutation du `code` des règles lit l'index au pivot 3, garde les règles prouvées et partielles, et mesure chaque règle

Status: Fait — PR 154 (`56ba394`, plugin 8.2.0)
Type: task
Label: contre-revue
Modèle: sonnet — le périmètre de la mutation étendu au pivot 3 et une mesure par règle, sans rien à concevoir ; le code entier est dans le patch commun aux tickets 86, 87 et 88 ([`86-88-annexes/pr-socle-tests.patch`](86-88-annexes/pr-socle-tests.patch), sha256 `2d18d2842e677e39788054dbbe949cbde74009f57f648e24eabb2f9613a8e74a`, `git apply` sur `ddb4265`) ; les gestes sont ceux du ticket 86, « À faire, dans l'ordre ». Rien n'est à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/monorepo/socle-tests/references/scripts/verify/mutation-regles.mjs` et `mutation-regles.test.mjs`, `mutation-regles-synthese.mjs` et `mutation-regles-synthese.test.mjs` (communs au ticket 88), `references/gabarits/stryker.regles.config.mjs` ; `SKILL.md` et `CONTENU.md` du skill (communs aux tickets 86 et 88). Aucun ticket de suite ouvert ne les touche.

## Le besoin

`K6` de la carte du chantier (`SPEC_ALL_ANC-5-preuve-suffisante.map.md` d'Anchorpost) : « `mutation-regles.mjs` lit un index `"3"` (et toujours `"2"`), garde les règles `proven` **et** `partial` (aujourd'hui `proven` seules, ligne 76) ». Sur `main` à `ddb4265`, `perimetre()` refuse tout index d'un autre schéma que `"2"` : depuis le passage d'Anchorpost au pivot 3 (`SPEC_ALL_ANC-5.12`), `mutation:regles` n'y mute plus rien et le dit (`A-18` de la carte : « Entre `.09` et la repose de `K6` (`.23`), `mutation:regles` ne mute plus rien »). Et au pivot 3, « prouvée » exige chaque cas attendu prouvé : une règle qui a des preuves sans l'être est « partielle » (`A-20`, § 2 de la spec) ; sur l'index d'Anchorpost (`develop`, `2be4e7e`), 24 règles sont partielles et 2 prouvées. Leurs tests existent : leur solidité se mesure (§ 7, `RULE_ALL_ANC-29`).

`RULE_ALL_ANC-29` dit aussi : « Une règle dont les preuves ne sont pas rejouées, par exemple parce qu'elles ont besoin d'une base de données que la mesure ne lance pas, est dite « non mesurée », jamais « 0 % ». » Sur `main`, la synthèse ne donne qu'un score d'ensemble et les survivants de chaque règle ; un fichier que seule une preuve sur base atteint y compte ses mutants en survivants (`NoCoverage`).

## Où

| Fichier | Ce qui change |
| --- | --- |
| `mutation-regles.mjs` | l'en-tête ; `SCHEMAS` (`"2"`, `"3"`) et `RETENUES` (`proven` au schéma 2 ; `proven` et `partial` au 3) à la place de `SCHEMA` ; chaque règle retenue porte `criticite` (`low`, `medium`, `high`, ou `null`) ; les raisons d'un périmètre vide disent « prouvée(s) ou partielle(s) » au pivot 3 ; `perimetreDuPaquet` porte `criticite` |
| `mutation-regles.test.mjs` | quatre cas existants à la forme nouvelle (`criticite: null` dans deux `deepEqual`, le message du schéma, le message des fichiers d'un autre paquet) ; trois cas neufs, au pivot 3 |
| `mutation-regles-synthese.mjs` | `mesure()`, neuve : par règle, `tues`, `survivants`, `score` (en pour cent), `null` quand aucun mutant n'est atteint ; la synthèse écrit, sous le titre de chaque règle, « Criticité : <niveau>. Score : … » ou « Non mesurée : … ; jamais « 0 % » » ; le titre devient « Mutation sur les règles prouvées et partielles », et celui d'un périmètre vide de même (« Mutation sur les règles prouvées et partielles : périmètre vide — … ») |
| `mutation-regles-synthese.test.mjs` | « la mesure par règle … », « la synthèse dit la date, et pour chaque règle sa criticité et son score, ou « non mesurée » … » ; le titre d'un périmètre vide, dans « sans index : la synthèse dit périmètre vide … » |
| `scripts/points-d-entree.test.mjs` | la sortie attendue de `mutation-regles-synthese.mjs`, à ce titre |
| `gabarits/stryker.regles.config.mjs` | son commentaire : `proven`, et `partial` au pivot 3 |
| `SKILL.md` (étape 2.5), `CONTENU.md` | le périmètre au schéma 2 ou 3 ; la synthèse par règle |

## Décisions

1. **Le périmètre, par schéma** : au schéma `"2"`, les règles `proven` (le sens d'avant : une preuve au moins) ; au schéma `"3"`, `proven` et `partial` (une preuve au moins : `to-build`, `configured`, `not-applicable` et `contradiction` n'en ont pas, ou ne se mesurent pas). Un `schema` qui n'est ni l'une ni l'autre chaîne (`3` en nombre compris) : vide, la raison dite, sortie 0, comme aujourd'hui.
2. **La criticité est portée, jamais jugée** : `criticality.level` de l'index, `null` pour une règle « à classer » ou un niveau hors vocabulaire. La mutation ne refuse toujours rien (pas de seuil avant la première série de mesures, `SPEC_ALL_ANC-5` § 7).
3. **« Non mesurée »** : une règle dont aucun mutant n'est tué ni n'a survécu en étant atteint (`Killed`, `Timeout`, `Survived` : aucun) — tous `NoCoverage`, ou aucun mutant. Son score est `null`, et la synthèse écrit « Non mesurée : aucun mutant de son code n'est atteint par un test rejoué (preuves sur base, ou hors de Stryker) ; jamais « 0 % » ». Sinon le score est `tués / (tués + survivants)`, survivants `Survived` et `NoCoverage` compris, comme le score d'ensemble. Un fichier partagé compte pour chacune de ses règles.
4. **La synthèse garde sa forme** : le titre de chaque règle (`## <règle> — <n> survivant(s)`) ne change pas ; la ligne nouvelle vient dessous. Le score d'ensemble ne change pas. Le texte d'un périmètre vide prend le titre de la synthèse (`A-202`).

## Le patch, pour ce ticket (il fait foi)

- **`mutation-regles.mjs`** : l'en-tête (le périmètre au schéma 2 ou 3, la criticité) ; `SCHEMAS`, `RETENUES`, `NIVEAUX` ; dans `perimetre`, le refus d'un autre schéma (« la mutation lit les schémas "2" et "3" »), `prouvees` selon `RETENUES[index.schema]`, `quoi` (« prouvée(s) » ou « prouvée(s) ou partielle(s) »), `criticite` sur chaque règle ; la ligne de `--lancer` : « fichier(s) de règles qui ont des preuves sont dans un autre paquet ».
- **`mutation-regles.test.mjs`** : « pivot 3 : les règles prouvées et partielles entrent, avec leur criticité ; to-build, configured et les autres non », « pivot 3 : sans règle prouvée ou partielle, la raison le dit avec les mots du pivot 3 », « --list sur un index au pivot 3 : une règle partielle donne ses fichiers ». La criticité de l'index jouet est posée par une fonction (`niveauDeclare`) : aucun texte du plugin ne la montre en ligne (`scripts/depot.test.mjs`).
- **`mutation-regles-synthese.mjs`** : `CRITICITES` ; `mesure(regles, mutation, versDepot, date)` ; dans `synthese`, `parRegle` et la ligne sous chaque titre (décision 3) ; le titre, et celui de `texteDuPaquet` pour un périmètre vide.
- **`mutation-regles-synthese.test.mjs`** : les deux tests de ce ticket (`SUR_BASE` : deux fichiers dont les mutants sont `NoCoverage`).

## Surfaces

| Surface | Preuve |
| --- | --- |
| au pivot 3, `proven` et `partial` entrent ; au schéma 2, `proven` seule | `mutation-regles.test.mjs`, « pivot 3 : les règles prouvées et partielles entrent … » ; M1, M2, M3 |
| la criticité portée, `null` à classer | le même test ; M4 |
| les raisons d'un périmètre vide au pivot 3 ; un schéma en nombre refusé | « pivot 3 : sans règle prouvée ou partielle … » |
| `--list` sur un index au pivot 3 | « --list sur un index au pivot 3 … » |
| le score par règle ; « non mesurée », jamais 0 % | `mutation-regles-synthese.test.mjs`, « la mesure par règle … », « la synthèse dit la date … » ; T1 |
| le titre d'un périmètre vide, celui de la synthèse | « sans index : la synthèse dit périmètre vide … » ; `points-d-entree.test.mjs` ; T9 |

## Mutations

Dans [`86-88-annexes/mutations.mjs`](86-88-annexes/mutations.mjs) (gestes : ticket 86, § 3), celles de ce ticket :

| Mutation | Banc | Issue |
| --- | --- | --- |
| M1 au pivot 3, seules les règles prouvées (le code d'avant) | `mutation-regles.test.mjs` | rouge |
| M2 au schéma 2, partial entre aussi | `mutation-regles.test.mjs` | rouge |
| M3 le schéma 3 n'est pas lu (le code d'avant) | `mutation-regles.test.mjs` | rouge |
| M4 la criticité n'est pas portée | `mutation-regles.test.mjs` | rouge |
| T1 une règle non mesurée vaut 0 % | `mutation-regles-synthese.test.mjs` | rouge |
| T9 le périmètre vide garde le titre d'avant | `mutation-regles-synthese.test.mjs` | rouge |

## Vérification

Ticket 86, « Vérification » : la PR entière.

## Ce qui n'a pas été établi

1. **Une vraie passe de Stryker au pivot 3** : jouée par les bancs, sur des rapports jouets. La repose dans Anchorpost (`.23`) la jouera sur `develop`, et dira si ses cinq règles dont une preuve ne tourne pas sous Stryker (`A-57` : `RULE_ALL_ANC-4`, `-15`, `-16`, `-20`, `-22`) sortent « non mesurées ». Une règle qu'une preuve sans base atteint en partie seulement n'est pas « non mesurée » : son score compte ses mutants non atteints en survivants, comme le score d'ensemble ; `.23` décide, par son ADR, s'il lui faut mieux.

## Hors périmètre

- La date, la publication et la baisse : ticket 88.
- Les fichiers que la mutation écarte (contrôleurs, modules, dto…) : inchangés.

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur `K6` de la carte de `SPEC_ALL_ANC-5`, son § 7 et `RULE_ALL_ANC-29`, sur un clone neuf de `main` à `ddb4265` ; joué avec la PR entière (ticket 88).
- 2026-11-22 — Retouché par le relecteur du tour 1 (`83-89-relecture-tour-1/rapport.md`, « Retouches portées »), sur les décisions d'`A-202` : le titre d'un périmètre vide suit celui de la synthèse (T9).
