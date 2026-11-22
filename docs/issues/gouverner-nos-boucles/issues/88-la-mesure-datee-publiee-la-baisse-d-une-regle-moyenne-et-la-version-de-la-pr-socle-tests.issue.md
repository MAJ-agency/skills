# La preuve suffisante, part de `skills` (K6, suite) : la mesure datée publiée en artefact, la baisse d'une règle moyenne, le workflow, l'ADR, la version de la PR « socle-tests »

Status: Fait — PR 154 (`56ba394`, plugin 8.2.0)
Type: task
Label: contre-revue
Modèle: sonnet — le § 7 de `SPEC_ALL_ANC-5` et `A-26` joués dans la synthèse et le workflow du socle ; le code et le texte entiers sont dans le patch commun aux tickets 86, 87 et 88 ([`86-88-annexes/pr-socle-tests.patch`](86-88-annexes/pr-socle-tests.patch), sha256 `2d18d2842e677e39788054dbbe949cbde74009f57f648e24eabb2f9613a8e74a`, `git apply` sur `ddb4265`) ; les gestes sont ceux du ticket 86, « À faire, dans l'ordre ». Rien n'est à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/monorepo/socle-tests/references/scripts/verify/mutation-regles-synthese.mjs` et `mutation-regles-synthese.test.mjs` (communs au ticket 87), `references/ci/mutation.yml`, `references/adr/ADR_ALL_ARC-N-score-de-mutation.md`, `scripts/preuve-suffisante-socle-tests.test.mjs` (commun au ticket 86) ; `SKILL.md` et `CONTENU.md` du skill ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`, pour la PR entière. Aucun ticket de suite ouvert ne touche `socle-tests/`.

## Le besoin

`K6` de la carte du chantier, suite : « `mutation.yml` date sa mesure, la publie en artefact, relit l'artefact précédent pour dire une baisse sur une règle moyenne […] ; le gabarit d'ADR de mutation suit l'ADR de `.20` ». Le § 7 de la spec : « Chaque semaine : le workflow `mutation.yml` du socle (`cron: '43 3 * * 0'`, sur la branche par défaut, `develop`), lancé par le planificateur de la CI, jamais par un agent. Il mesure le `code` de toutes les règles qui ont des preuves, publie la mesure datée (`A-26`), et signale une baisse sur une règle moyenne. » `A-26` : « Une mesure de solidité ne vit ni dans l'index ni dans le dépôt. […] Le workflow publie la mesure, datée, en artefact et dans le résumé du job ; le passage suivant relit l'artefact précédent pour dire une baisse. » L'ADR de `.20` est `ADR_ALL_ARC-18` d'Anchorpost (« Le `code` des règles est muté chaque semaine, et à chaque PR pour les règles hautes », amende `ADR_ALL_ARC-7`). `RULE_ALL_ANC-29` : « Pour une règle moyenne, la mesure ne baisse plus. […] Chaque mesure porte sa date. »

Sur `main` à `ddb4265`, la synthèse n'a pas de date, rien ne l'écrit hors du résumé du job, et rien ne relit un passage précédent. Le ticket `.23` d'Anchorpost attend ce gabarit.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `mutation-regles-synthese.mjs` | l'en-tête ; `lireMesure`, `baisses`, `lireOptions`, neuves ; `synthese(…, options)` : `Mesure du <date>.` sous les comptes, « (jour UTC du passage) » quand la date n'est pas donnée par `--date`, et, avec `precedente`, la section « Baisses sur une règle moyenne » ; `texteDuPaquet(racine, cwd, options)` écrit la mesure en JSON (`--mesure`) et lit la précédente (`--precedente`) ; le point d'entrée lit `--date`, `--mesure`, `--precedente`, sort en 2 sur un usage faux (une `--date` qui n'est pas un jour du calendrier en est un) |
| `mutation-regles-synthese.test.mjs` | quatre tests : les baisses, leur section, `lireMesure` et `lireOptions`, le point d'entrée |
| `ci/mutation.yml` | l'en-tête ; `actions: read` ; l'étape « Mesure précédente » (avant la mutation) ; la synthèse avec `--mesure` et `--precedente` ; l'étape « Mesure datée » (l'artefact `mesure-regles`, 90 jours) |
| `adr/ADR_ALL_ARC-N-score-de-mutation.md` | le point 5 réécrit sur `ADR_ALL_ARC-18` d'Anchorpost ; une alternative écartée de plus |
| `SKILL.md` (étapes 2.4, 2.5), `CONTENU.md` | la mesure datée, l'artefact, la baisse |
| `scripts/preuve-suffisante-socle-tests.test.mjs` | « le workflow de mutation date sa mesure, la publie en artefact et relit la précédente, sans expression dans un run: » (le jeton de `gh`, le filtre de la branche par défaut et de l'expiration, la publication en `always()` et sa rétention compris) |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | 8.1.0 et sa note (la PR entière) |

## Décisions

1. **La mesure est un fichier JSON daté** : `{ date, regles: [{ regle, criticite, tues, survivants, score }] }` (`score` en pour cent, `null` pour « non mesurée », ticket 87), écrit par `--mesure <fichier>` dans `reports/mutation/mesure-regles.json`, à côté du rapport de Stryker, jamais dans le dépôt (`reports/` est ignoré par git, étape 2.5). La date : `--date AAAA-MM-JJ`, un jour du calendrier (`2026-02-30` et `2026-13-45` sont des usages faux), ou le jour UTC du passage, et la synthèse ne dit « (jour UTC du passage) » que dans ce cas — c'est la date d'un passage de CI, pas un jour métier. Rien n'est écrit quand il n'y a pas de synthèse (périmètre vide, passage interrompu).
2. **La baisse** : une règle **moyenne aujourd'hui**, mesurée les deux fois (score non `null`), dont le score est plus bas que la fois précédente. Une haute (le job de PR la juge, `SPEC_ALL_ANC-5.24`), une basse (« mesurée sans être exigée »), une non mesurée, une nouvelle, une égalité : pas une baisse. La synthèse la dit (« - <règle> : 80 % le <date d'avant>, 79 % aujourd'hui ») ; aucune : « Aucune depuis la mesure du <date> » ; pas de mesure précédente lisible (absente, tronquée, d'une autre forme) : « Pas de mesure précédente lisible : aucune baisse ne se juge ». **Elle ne refuse rien** : la sortie reste 0 (aucun seuil avant la première série de mesures, § 7).
3. **La mesure précédente, dans le workflow** : le dernier artefact `mesure-regles` non expiré **de la branche par défaut** (`github.event.repository.default_branch`), par le `gh` du runner (`gh api …/actions/artifacts?name=mesure-regles`, puis `gh run download`), avec `GH_TOKEN: ${{ github.token }}` et la permission `actions: read` ; aucun, ou un téléchargement en échec : la synthèse le dit. L'étape joue avant la mutation, donc avant que la nouvelle mesure ne soit publiée. Aucune expression `${{ }}` dans un `run:` (`zizmor`), comme le reste du workflow.
4. **La publication** : l'étape « Mesure datée », `always()` sur `regles`, `actions/upload-artifact` à l'empreinte du workflow existant, `if-no-files-found: ignore`, `retention-days: 90` (la mesure d'il y a une semaine doit survivre à un passage manqué ; la mesure « périmée » au-delà de huit jours est l'affaire du job de PR, `.24`).
5. **L'ADR du socle suit `ADR_ALL_ARC-18`** pour le `code` des règles, sans la recopier : chaque semaine, par le planificateur, jamais par un agent ; `proven` et `partial` ; mesure datée, publiée en artefact et dans le résumé, ni dans l'index ni dans le dépôt ; une baisse d'une règle moyenne signalée, rien de refusé ; « non mesurée », jamais « 0 % » ; le noyau reste à la demande. **La mutation à chaque PR des règles hautes touchées** est une décision du projet, par une ADR à part (le socle ne la porte pas encore : question 2 du ticket 86).
6. **La version** : la mineure suivante, 8.1.0 sur `ddb4265` (ticket 85, décision 2, et `version-mineure.mjs`).

## Le patch, pour ce ticket (il fait foi)

- **`mutation-regles-synthese.mjs`** : l'en-tête (la mesure datée, `--mesure`, `--precedente`, la baisse, « non mesurée », `A-26`) ; `JOUR` et `jourValide` (un jour du calendrier) ; `lireMesure(texte)` (`date` en chaîne, `regles` en liste, chaque `score` un nombre ou `null`) ; `baisses(precedente, actuelle)` (décision 2) ; dans `synthese`, la ligne de la date (« (jour UTC du passage) » avec l'option `utc`, que `texteDuPaquet` pose quand `--date` manque) et la section des baisses ; `texteDuPaquet(…, options)` ; `lireOptions(args)` ; le point d'entrée et son usage.
- **`mutation-regles-synthese.test.mjs`** : « les baisses : … », « la section des baisses : … », « lireMesure et lireOptions : … », « le point d'entrée : --mesure écrit la mesure datée en JSON, --precedente dit la baisse ; un usage faux sort en 2 ».
- **`mutation.yml`** : décisions 3 et 4, l'étape « Mutation des règles prouvées » renommée « Mutation des règles qui ont des preuves ».
- **`preuve-suffisante-socle-tests.test.mjs`** : le banc du workflow exige aussi `GH_TOKEN` et `BRANCHE` dans l'`env:` de l'étape « Mesure précédente », le filtre `select(.expired == false and .workflow_run.head_branch == env.BRANCHE)`, l'étape « Mesure datée » en `always()`, et `retention-days: 90` : le workflow n'a jamais tourné sous Actions, ce banc est sa seule garde (`A-202`).
- **`ADR_ALL_ARC-N-score-de-mutation.md`** : décision 5 ; « Committer la mesure » parmi les alternatives écartées.
- **`plugin.json`** : `"version": "8.1.0"` ; **`NOTES-DE-VERSION.md`** : la note 8.1.0 en tête (« Ce qui change » : le gate `preuves`, la fiche des tests, la mutation au pivot 3 datée ; « Ce qu'un projet fait pour en profiter » : rien sans index au pivot 3, hors la sortie 2 de `preuves.mjs` sur un index présent qui n'est pas un objet JSON et la forme neuve de la synthèse ; la repose pièce par pièce).

## Surfaces

| Surface | Preuve |
| --- | --- |
| la mesure datée, écrite en JSON par `--mesure` ; la date dite ; le jour UTC par défaut, dit « jour UTC du passage » seulement alors | `mutation-regles-synthese.test.mjs`, « le point d'entrée : … », « la synthèse dit la date … » ; T4, T6, T10 |
| la baisse d'une règle moyenne seule, mesurée les deux fois, strictement plus basse | « les baisses : … », « la section des baisses : … » ; T2, T3 |
| une mesure précédente illisible ou d'une autre forme : « pas de mesure précédente lisible » | « lireMesure et lireOptions : … », « le point d'entrée : … » ; T5 |
| un usage faux, une `--date` hors du calendrier comprise : sortie 2 | « lireMesure et lireOptions : … », « le point d'entrée : … » ; T7, T8 |
| le workflow : `actions: read`, la mesure précédente avant la nouvelle, l'artefact, aucune expression dans un `run:` ; `GH_TOKEN`, le filtre de la branche par défaut et de l'expiration, la publication en `always()`, 90 jours | `preuve-suffisante-socle-tests.test.mjs`, « le workflow de mutation date sa mesure … » ; W1 à W8 |

## Mutations

Dans [`86-88-annexes/mutations.mjs`](86-88-annexes/mutations.mjs), celles de ce ticket :

| Mutation | Banc | Issue |
| --- | --- | --- |
| T2 une baisse d'une règle haute est dite | `mutation-regles-synthese.test.mjs` | rouge |
| T3 une égalité est une baisse | `mutation-regles-synthese.test.mjs` | rouge |
| T4 la mesure n'est pas écrite | `mutation-regles-synthese.test.mjs` | rouge |
| T5 une mesure précédente d'une autre forme se lit | `mutation-regles-synthese.test.mjs` | rouge |
| T6 la date n'est pas dite | `mutation-regles-synthese.test.mjs` | rouge |
| T7 une date mal écrite est acceptée | `mutation-regles-synthese.test.mjs` | rouge |
| W1 sans la permission de lire l'artefact précédent | `preuve-suffisante-socle-tests.test.mjs` | rouge |
| W2 la mesure n'est pas publiée | `preuve-suffisante-socle-tests.test.mjs` | rouge |
| W3 une expression dans un run: | `preuve-suffisante-socle-tests.test.mjs` | rouge |
| W4 sans GH_TOKEN (gh non authentifié : jamais de mesure précédente) | `preuve-suffisante-socle-tests.test.mjs` | rouge |
| W5 la mesure précédente de n'importe quelle branche | `preuve-suffisante-socle-tests.test.mjs` | rouge |
| W6 un artefact expiré compte | `preuve-suffisante-socle-tests.test.mjs` | rouge |
| W7 la mesure gardée un jour | `preuve-suffisante-socle-tests.test.mjs` | rouge |
| W8 la mesure n'est pas publiée après un échec | `preuve-suffisante-socle-tests.test.mjs` | rouge |
| T8 un jour hors calendrier est accepté (la forme seule) | `mutation-regles-synthese.test.mjs` | rouge |
| T10 une --date donnée est dite « jour UTC du passage » | `mutation-regles-synthese.test.mjs` | rouge |

Le journal de la PR : [`86-88-annexes/mutations.txt`](86-88-annexes/mutations.txt), **35 rouges sur 35**.

## Vérification

Ticket 86, « Vérification » : la PR entière.

### Ce qui a été joué en écrivant ce ticket

_Avec le patch d'avant les retouches d'`A-202` ; les comptes d'après sont sous « Rejoué par la relecture »._

Sur un clone neuf de `https://github.com/MAJ-agency/skills` à `ddb4265` (plugin 8.0.0), le 2026-11-22, Node 22.23.5, git 2.43.0, une machine partagée avec d'autres agents (charge notée) :

- **Le patch** : `git apply --check` seul sur `ddb4265` ; l'arbre obtenu est celui d'où il est tiré ; posé après la PR « tickets » (par `--exclude` et `version-mineure.mjs`, ou par la fusion du § 3), seul `NOTES-DE-VERSION.md` est en conflit, et la version prise est 8.2.0.
- **Rouges avant** (§ 1) : **17 rouges sur 102** ; **verts après** (§ 2) : **124 sur 124**.
- **Les mutations** : **26 rouges sur 26** (R5 et W3, vertes au premier jet, ont fait renforcer leurs bancs : le push vers un sujet plus loin que le plus proche ; les lignes d'un bloc `run: |` lues en entier) ; le fichier remis après chacune, l'arbre propre après la passe.
- **La suite entière** : la suite entière, les quatre motifs de `pnpm test` d'un seul tenant, en tâche de fond avec un `timeout` explicite, sur l'arbre des trois PR posées l'une sur l'autre (plugin 8.3.0) : **1 431 tests, 1 431 verts**, aucun échec, sauté ni annulé ; 18 min 10 s (12:43:23 → 13:01:33 UTC, `duration_ms` 1090263), charge 0,83 au départ, 3,99 à la fin (d'autres agents jouaient leurs bancs) ; [`89-annexes/suite.txt`](89-annexes/suite.txt). Une première passe, avant le patch de la copie du critère du régime 8, rendait 1 430 sur 1 431 (ticket 85). Sur `ddb4265` seul, la suite compte 1 396 tests (1 431 moins les 35 des trois PR : 8, 25 et 2), compte tiré des bancs touchés joués avant et après chaque patch.

### Rejoué par la relecture, après les retouches (`A-202`)

Sur un clone neuf de `main` à `ddb4265`, le 2026-11-22, chaque bloc des § 0 à 3 du ticket 86 tel qu'écrit, la branche de documentation remplacée par un commit local qui porte ces tickets et ces annexes : somme vérifiée ; § 1 : 5 fichiers (3 ` M`, 2 `??`), **24 rouges sur 103** ; § 2 : 16 fichiers (13 ` M`, 3 `??`), **125 sur 125** ; `16 files changed`, arbre propre ; mutations : `sortie 0`, **35 rouges sur 35**, arbre propre ([`86-88-annexes/mutations.txt`](86-88-annexes/mutations.txt)). La PR « tickets » entrée pendant que celle-ci est ouverte, § 3 : `NOTES-DE-VERSION.md` seul en conflit (les deux branches à 8.1.0), 8.2.0. La suite entière, sur l'arbre des trois PR empilées : sortie 0, **1 433 tests, 1 433 verts**, aucun échec, sauté ni annulé (1 396, plus 9, 26 et 2) ; 14:55:11 → 15:25:34 UTC (`duration_ms` 1822258), charge 7,1 au départ, 19,0 à la fin, jamais sous 4 (d'autres agents jouaient leurs bancs)

## Ce qui n'a pas été établi

1. **Le workflow sous GitHub Actions** : il n'a jamais tourné ; le banc ne lit que son texte. La relecture a joué en lecture, contre l'API réelle, `gh api "repos/<dépôt>/actions/artifacts?name=<nom>&per_page=30" --jq '[.artifacts[] | select(.expired == false and .workflow_run.head_branch == env.BRANCHE)][0].workflow_run.id // empty'` : il rend l'identifiant du dernier passage de la branche, vide pour une autre branche ou un nom absent, sortie 0 ; `gh run download <id> -n <nom> -D <dossier>` accepte ses options, mais le téléchargement et l'artefact d'un fichier seul n'ont pas tourné (réseau). La première exécution réelle est celle de `.23` d'Anchorpost, déclenchée à la main par l'architecte ou le conducteur (« Vérification d'ensemble » de la spec), puis le passage suivant, une semaine après, dira si la mesure précédente se relit.
2. **`zizmor`** n'a pas été joué sur le gabarit (il l'est dans le projet qui le pose).

## Hors périmètre

- Le job de PR des règles hautes et la mesure « périmée » (§ 7, troisième et quatrième points) : Anchorpost `.24` ; question 2 du ticket 86.
- Un seuil de mutation : aucun avant la première série de mesures.

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur `K6` de la carte de `SPEC_ALL_ANC-5`, son § 7, `A-26`, `RULE_ALL_ANC-29` et `ADR_ALL_ARC-18` d'Anchorpost, sur un clone neuf de `main` à `ddb4265`.
- 2026-11-22 — Retouché par le relecteur du tour 1 (`83-89-relecture-tour-1/rapport.md`, « Retouches portées »), sur les décisions d'`A-202` : le banc du workflow tient `GH_TOKEN`, le filtre de branche et d'expiration, `always()` et la rétention (W4 à W8) ; une `--date` est un jour du calendrier (T8) ; « jour UTC du passage » seulement sans `--date` (T10) ; la note complète.
