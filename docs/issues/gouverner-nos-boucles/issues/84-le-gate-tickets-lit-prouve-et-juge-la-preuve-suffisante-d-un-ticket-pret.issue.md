# La preuve suffisante, part de `skills` (K3) : le gate `tickets` lit la ligne `Prouve:` et juge la criticité et les cas des règles d'un ticket prêt

Status: Fait — PR 155 (`679df86`, plugin 8.1.0)
Type: task
Label: contre-revue
Modèle: sonnet — une décision de l'architecte (la ligne `Prouve:`, 2026-11-17) et le § 8 de `SPEC_ALL_ANC-5` joués dans le gate ; le code entier est dans le patch commun aux tickets 83, 84 et 85 ([`83-85-annexes/pr-tickets.patch`](83-85-annexes/pr-tickets.patch), sha256 `32d5e04da25d3b0b5ac17fddecacdd55f613f75b8574ef3ebbe8d5874425af46`, `git apply` sur `ddb4265`), décrit ci-dessous ; les gestes sont ceux du ticket 83, « À faire, dans l'ordre » (une seule PR). Rien n'est à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs`, `tickets.mjs`, `tickets.test.mjs`, `tickets-gate.test.mjs` ; `skills/chaine/tickets/SKILL.md`, `references/CONTENU.md`, `references/agents/issue-tracker.md`, `references/gabarits/ticket.issue.md` ; `scripts/preuve-suffisante-standard.test.mjs` (commun au ticket 83). Aucun ticket de suite ouvert ne les touche ; le lot 6 (8.0.0) a touché `issue-tracker.md` et `avancement*.mjs`, déjà sur `main`.

## Le besoin

La carte du chantier de la preuve suffisante (`SPEC_ALL_ANC-5-preuve-suffisante.map.md` d'Anchorpost, « Part de skills ») porte `K3` : « le gate refuse un ticket `ready-for-agent` dont `Règles:` cite une règle sans criticité ou sans cas (en `enforce` ; avertissement en `observe` ; rien sans index) ; le tableau `## Surfaces` nomme, pour chaque cas attendu des règles citées, la preuve qui le portera. **La ligne `Prouve:`** (décision de l'architecte, 2026-11-17) : un ticket qui prouve une règle sans la réaliser la nomme sur une ligne `Prouve:` de son en-tête, jamais sur `Règles:`, qui garde le sens de `P-34` (ce que la feature réalise) ; la criticité d'une feature ne descend pas par `Prouve:` ; le gate et la revue de ticket lisent les deux lignes. » Le § 8 de la spec dit de même. Les tickets `.14` et `.15` d'Anchorpost ne déclarent déjà plus la règle qu'ils prouvent (`A-24` de la carte) : ils attendent cette ligne.

Sur `main` à `ddb4265`, le gate ne lit que `Règles:` (règle 10 de `tickets.mjs`), et rien ne lit la criticité ni les cas d'une règle citée, hors du régime 8, où l'index ne sert qu'à exiger `Relecture: double` d'une règle haute (règle 14). Mesuré sur l'index d'Anchorpost (`develop`, `2be4e7e`, pivot 3, `observe`) : 19 règles sur 31 sont « à classer » ; un ticket prêt qui en cite une passe le gate sans un mot.

## Où

| Fichier | Ce qui change |
| --- | --- |
| `tickets-regles.mjs` | `PROUVE_EN_TETE` ; `ecartsRegles(valeur, { contexte, regleExiste, nom })` (le nom de la ligne dans les messages) ; `ecartsSuffisance({ ids, surfaces, suffisance })`, neuve ; `controlerTicket` lit `Prouve:`, reçoit `suffisance`, et rend `avertissements` |
| `tickets.mjs` | l'en-tête, règles 15 et 16 (un index illisible : sortie 1, quel que soit le pivot ou le régime, `--elaguer` et `--geler-*` compris) ; la lecture de l'index commis (`schema`, `project.sufficiency`, `rules[].criticality.level`, `rules[].cases[].id`, `rules[].validation.status`) en `suffisance` ; les avertissements écrits avant `OK` |
| `tickets.test.mjs` | trois tests « K3 : … » |
| `tickets-gate.test.mjs` | trois tests « K3, gate : … » |
| `SKILL.md`, `CONTENU.md`, `issue-tracker.md` | la ligne `Prouve:` et la preuve suffisante d'un ticket prêt |
| `gabarits/ticket.issue.md` | la ligne `Prouve:`, sous `Règles:`, qui dit que la criticité d'une feature ne descend pas par elle ; une ligne de `## Surfaces` par cas attendu |
| `scripts/preuve-suffisante-standard.test.mjs` | « le gabarit de ticket porte la ligne `Prouve:` sous `Règles:`, et une ligne de `## Surfaces` par cas attendu » |

## Décisions

1. **`Prouve:` se lit comme `Règles:`** (la décision de l'architecte : « le gate et la revue de ticket lisent les deux lignes ») : chaque ligne de l'en-tête, sous les formes que lit `Règles:` (`X:`, `**X:**`, `- X:`, `* X:`), chaque identifiant complet, au registre, du contexte du ticket ou de `ALL`, quel que soit le statut du ticket. **Une règle n'est jamais sur les deux lignes** : refusée, « une règle que le ticket réalise va sur `Règles:` seule ». **`Prouve: —` est refusée** (« ne dit rien ») : `Règles: —` dit qu'un ticket ne réalise aucune règle, une ligne `Prouve:` vide n'a pas de sens.
2. **La criticité d'une feature ne descend pas par `Prouve:`** : c'est le calcul de la CLI, qui ne lit que `Règles:` (`featureDeclaredRules`) ; le gate n'y change rien et le gabarit le dit.
3. **Le gate se règle par l'index commis, et par lui seul** (le réglage du régime d'avant, demandé au lanceur) : `anchorpost/anchorpost.json`, lu dans l'arbre de travail, comme le skill `criticite` (`A-56` : « seul l'index compte », jamais la version de la CLI). Absent, ou d'un `schema` autre que `"3"` : **rien n'est jugé**, le gate rend ce qu'il rend sur `main`. Au pivot 3 : `project.sufficiency` de l'index (la clé `sufficiency` du manifeste, recopiée par la CLI) dit **`enforce` : refus ; `observe`, ou clé absente : avertissement**, écrit sur la sortie standard avant `OK`, sortie 0. C'est le § 8 de la spec (« en `enforce` ; avertissement en `observe`, et rien sans index ») et `A-22` (« un projet passe du constat au refus par une clé du manifeste, `sufficiency`, qui vaut `observe` (par défaut) ou `enforce` » ; la date du passage est une décision du produit). Ni la clé `relecture` (régime 7 ou 8 de la chaîne) ni une transition datée n'entrent : un projet au pivot 3 en `observe` n'est jamais refusé, un projet sans index au pivot 3 ne voit rien. Un index présent qui n'est pas du JSON fait sortir le gate en 1, la cause dite (`anchorpost check` le refuse déjà), quel que soit le pivot ou le régime de la chaîne, régime 7 compris, et sous `--elaguer` ou `--geler-*` aussi : un texte qui n'est pas du JSON n'a pas de `schema` lisible (`A-202`, question 2) ; la note de version le dit.
4. **Ce qui se juge, sur un ticket `ready-for-agent` hors dette** (le format prêt, qu'un ticket gelé ne porte pas), pour chaque règle de `Règles:` et de `Prouve:` qui est au registre : une règle absente de l'index (« régénérer l'index ») ; sans criticité (`criticality.level` absent : « à classer ») ; sans cas (`cases` vide) ; et chaque cas attendu que `## Surfaces` ne nomme pas, `RULE_…#<cas>` (identifiant complet, `#`, l'identifiant du cas, cas voisin exclu : `#nominal-bis` ne nomme pas `#nominal`) n'importe où dans la section : la cellule dit la preuve qui le portera, ou le ticket qui la portera. Une règle rejetée ou obsolète dans l'index ne se juge pas ; une règle absente du registre n'a que le refus du registre. L'index se lit à sa forme : `schema`, la chaîne `"3"` (`3` en nombre n'est pas le pivot 3) ; `criticality.level` parmi `low`, `medium`, `high` (un autre niveau est « à classer ») ; `cases[].id`, une chaîne (un cas sans identifiant ne compte pas) ; `validation.status` `rejected` ou `obsolete`, une règle close. Une règle citée sur deux lignes se juge une fois.
5. **Le message dit le mode et le geste** : `ready-for-agent : preuve suffisante (enforce|observe) : RULE_… n'a pas de criticité dans l'index (« à classer ») : la classer par le skill criticite (/maj-skills:criticite) avant de lancer le ticket`.

## Questions à l'architecte

1. **`## Surfaces` nomme chaque cas de chaque règle citée, même quand plusieurs tickets réalisent la même règle.** La spec le dit sans exception (« pour chaque cas attendu des règles citées ») ; un ticket qui n'en porte qu'une part nomme les autres « porté par `.NN` » dans la cellule. **Recommandation : tel quel**, la cellule libre suffit ; sinon, il faudrait une syntaxe « cas hors de ce ticket » que la spec n'a pas.
2. **Un ticket prêt gelé dans la dette ne se juge pas** (décision 4), comme son format. La spec ne le dit pas. **Recommandation : tel quel** ; un projet qui passe en `enforce` vide d'abord sa dette (`--elaguer`).

## Le patch, pour ce ticket (il fait foi)

- **`tickets-regles.mjs`** : `const PROUVE_EN_TETE = ligneDEnTete('Prouve');` après `REGLES_EN_TETE` ; `ecartsRegles` prend `nom = 'Règles'`, ses quatre messages commencent par `${nom}` ; `ecartsSuffisance` (son commentaire dit la forme de `suffisance`) ; dans `controlerTicket`, après les lignes `Règles:`, la lecture des lignes `Prouve:` (décision 1) ; dans le bloc `pret && !gele`, `ids` (les règles des deux lignes, au registre) et le tri des messages selon `suffisance.mode` ; le retour porte `avertissements`.
- **`tickets.mjs`** : l'en-tête, règles 15 et 16 ; avant `const erreurs`, `suffisance` (null sans index au pivot 3 ; sortie 1 sur un index qui n'est pas du JSON) ; `suffisance` passée à `controlerTicket` ; ses avertissements, écrits avant le compte rendu.
- **`tickets.test.mjs`** : « K3 : la ligne Prouve: se lit comme Règles: … », « K3 : sans index au pivot 3, rien ; en observe, un avertissement ; en enforce, un refus … » (une règle citée sur deux lignes `Règles:` s'y juge une fois), « K3 : `## Surfaces` nomme chaque cas attendu … ».
- **`tickets-gate.test.mjs`** : « K3, gate : sans index ou d'un autre schéma que 3, rien ne change ; un index au pivot 3 en observe signale, en enforce refuse », « K3, gate : un index présent qui n'est pas du JSON … », « K3, gate : une règle rejetée ou obsolète dans l'index ne se juge pas ; un niveau ou un cas hors de la forme de l'index ne compte pas » (`enforce`, sur un vrai index jouet : une règle rejetée et une obsolète sans criticité ni cas ne disent rien ; un niveau `critique` et un cas sans `id` donnent « à classer » et « aucun cas » ; `3` en nombre ne juge rien). La criticité de l'index jouet est posée par une variable : aucun texte du plugin ne la montre en ligne (`scripts/depot.test.mjs`).
- **`SKILL.md`** (la table des en-têtes, le gate), **`CONTENU.md`**, **`issue-tracker.md`**, **`gabarits/ticket.issue.md`** : décisions 1 à 4, en une phrase chacune ; la ligne `Prouve:` du gabarit dit « la criticité d'une feature ne descend pas par cette ligne, seulement par `Règles:` » (décision 2).

## Surfaces

| Surface | Preuve |
| --- | --- |
| `Prouve:` lue comme `Règles:` (forme, registre, contexte), refusée sur une règle de `Règles:`, `Prouve: —` refusée | `tickets.test.mjs`, « K3 : la ligne Prouve: se lit comme Règles: … » ; P1, P2, P3 |
| sans index au pivot 3 : rien ; `observe` : avertissement, sortie 0 ; `enforce` : refus | `tickets-gate.test.mjs`, « K3, gate : sans index ou d'un autre schéma que 3 … » ; `tickets.test.mjs`, « K3 : sans index au pivot 3 … » ; S1, S2, G1, G2, G4 |
| une règle « à classer », sans cas, absente de l'index ; une règle close ignorée ; un ticket gelé ignoré | `tickets.test.mjs`, « K3 : sans index au pivot 3 … » ; S3, S4, S7, S8, S9, G5 |
| `Prouve:` entre dans la preuve suffisante | les deux mêmes ; P4 |
| `## Surfaces` nomme chaque cas, un voisin ne compte pas, hors de la section non plus | `tickets.test.mjs`, « K3 : `## Surfaces` nomme chaque cas attendu … » ; S5, S6 |
| un index qui n'est pas du JSON : sortie 1, la cause dite | `tickets-gate.test.mjs`, « K3, gate : un index présent qui n'est pas du JSON … » ; G3 |
| le gabarit de ticket porte `Prouve:` sous `Règles:` | `preuve-suffisante-standard.test.mjs`, « le gabarit de ticket porte la ligne `Prouve:` … » ; D4 |
| le gabarit dit que la criticité d'une feature ne descend pas par `Prouve:` | le même test ; D9 |
| l'index lu à sa forme : une règle rejetée ou obsolète de l'index non jugée, un niveau hors vocabulaire « à classer », un cas sans identifiant ignoré, `3` en nombre qui n'est pas le pivot 3 | `tickets-gate.test.mjs`, « K3, gate : une règle rejetée ou obsolète dans l'index ne se juge pas … » ; G6 à G10 |
| une règle citée sur deux lignes se juge une fois | `tickets.test.mjs`, « K3 : sans index au pivot 3 … » ; S10 |

## Mutations

Dans [`83-85-annexes/mutations.mjs`](83-85-annexes/mutations.mjs) (gestes : ticket 83, § 3), celles de ce ticket :

| Mutation | Banc | Issue |
| --- | --- | --- |
| P1 la ligne Prouve: n'est pas lue | `tickets.test.mjs`, `tickets-gate.test.mjs` | rouge |
| P2 une règle sur Règles: et sur Prouve: passe | `tickets.test.mjs` | rouge |
| P3 Prouve: — passe | `tickets.test.mjs` | rouge |
| P4 Prouve: n'entre pas dans la preuve suffisante | les deux | rouge |
| S1 en enforce, un avertissement et non un refus | les deux | rouge |
| S2 en observe, un refus et non un avertissement | les deux | rouge |
| S3 une règle « à classer » passe | les deux | rouge |
| S4 une règle sans cas passe | les deux | rouge |
| S5 un cas que ## Surfaces ne nomme pas passe | les deux | rouge |
| S6 un cas voisin (#nominal-bis) nomme #nominal | `tickets.test.mjs` | rouge |
| S7 une règle absente de l'index passe | `tickets.test.mjs` | rouge |
| S8 une règle rejetée ou obsolète se juge | `tickets.test.mjs` | rouge |
| S9 un ticket prêt gelé se juge | `tickets.test.mjs` | rouge |
| G1 un index au schéma 2 se juge comme le pivot 3 | `tickets-gate.test.mjs` | rouge |
| G2 project.sufficiency n'est pas lu (toujours observe) | `tickets-gate.test.mjs` | rouge |
| G3 un index qui n'est pas du JSON se tait | `tickets-gate.test.mjs` | rouge |
| G4 les avertissements ne sont pas écrits | `tickets-gate.test.mjs` | rouge |
| G5 la criticité se lit à la racine de la règle (forme nue) | `tickets-gate.test.mjs` | rouge |
| D4 gabarit de ticket : sans la ligne Prouve: | `depot.test.mjs`, `preuve-suffisante-standard.test.mjs` | rouge |
| G6 un schema 3 en nombre se juge comme "3" | `tickets-gate.test.mjs` | rouge |
| G7 un niveau hors vocabulaire compte pour une criticité | `tickets-gate.test.mjs` | rouge |
| G8 validation.status n'est pas lu (aucune règle close) | `tickets-gate.test.mjs` | rouge |
| G9 une règle obsolète se juge | `tickets-gate.test.mjs` | rouge |
| G10 un cas sans id compte | `tickets-gate.test.mjs` | rouge |
| S10 une règle citée sur deux lignes se juge deux fois | `tickets.test.mjs` | rouge |
| D9 gabarit de ticket : la criticité qui ne descend pas par Prouve: n'est plus dite | `depot.test.mjs`, `preuve-suffisante-standard.test.mjs` | rouge |

## Vérification

Ticket 83, « Vérification » : la PR entière.

### Ce qui a été joué en écrivant ce ticket

Le gate du patch (`tickets.mjs`, `tickets-regles.mjs`, avec `ligne-sujet.mjs` du plugin et la grammaire d'Anchorpost), joué sur un clone neuf d'Anchorpost (`develop`, `2be4e7e` : index au pivot 3, `observe`, `PROJET_RACINE` à la racine du clone) : `tickets : 1 avertissement(s) de la preuve suffisante (observe : rien n'est refusé)` — `SPEC_ALL_ANC-5-preuve-suffisante.24.issue.md:3 : … RULE_ALL_ANC-29 ne déclare aucun cas attendu dans l'index …` —, puis `tickets : OK — 232 tickets`, sortie 0. En `enforce`, ce seul ticket serait refusé. Le reste de la PR : ticket 85.

## Ce qui n'a pas été établi

1. **Un projet au pivot 3 en `enforce`** : aucun n'existe ; le refus n'est joué que sur des dépôts jouets.
2. **Un index périmé** (une règle écrite, l'index pas régénéré) : la règle est « absente de l'index », un avertissement ou un refus selon le mode ; le gate ne régénère rien.
3. **La règle 14 du gate** (régime 8, `Relecture: double` exigée d'un ticket qui cite une règle haute) ne lit que `Règles:`, comme `double-relecture.mjs` : un ticket qui prouve une règle haute sur `Prouve:` n'a pas à porter `Relecture: double`. Le ticket de suite d'`A-200` point 3 couvre les deux, cette règle et le calcul, pour que le gate et le capitaine restent d'accord (`A-202`, question 4).
4. **La clé d'une règle se lit à la lettre** (`rules[].key`) ; le calcul « double relecture exigée » la compare à la casse près. Sans effet sur un index écrit par la CLI : laissé (`A-202`).

## Hors périmètre

- Le calcul « double relecture exigée » du skill `fusionner` (`double-relecture.mjs`), qui ne lit que `Règles:` pour exiger deux relectures d'une règle haute : fichiers de la chaîne du régime 8, que les PR de suite touchent ; question 3 du ticket 85.
- La criticité d'une règle elle-même : le skill `criticite` la fixe.

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur `K3` de la carte de `SPEC_ALL_ANC-5`, le § 8 de la spec et la décision de l'architecte du 2026-11-17 sur `Prouve:`, sur un clone neuf de `main` à `ddb4265` ; joué avec la PR entière (ticket 85).
- 2026-11-22 — Retouché par le relecteur du tour 1 (`83-89-relecture-tour-1/rapport.md`, « Retouches portées »), sur les décisions d'`A-202` : la lecture de l'index tenue par un banc neuf (une règle rejetée ou obsolète, un niveau hors vocabulaire, un cas sans identifiant, `3` en nombre ; G6 à G10), le doublon (S10), le gabarit qui dit que la criticité ne descend pas par `Prouve:` (D9), l'index illisible dit pour tout pivot, `--elaguer` compris ; la règle 14 et la clé à la lettre notées.
