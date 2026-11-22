# La preuve suffisante, part de `skills` (K3, suite) : la revue de ticket lit `Prouve:`, la version et la note de la PR « tickets »

Status: Fait — PR 155 (`679df86`, plugin 8.1.0)
Type: task
Label: contre-revue
Modèle: sonnet — la seconde moitié de la décision de l'architecte sur `Prouve:` (« le gate et la revue de ticket lisent les deux lignes »), la version et la note ; le code entier est dans le patch commun aux tickets 83, 84 et 85 ([`83-85-annexes/pr-tickets.patch`](83-85-annexes/pr-tickets.patch), sha256 `32d5e04da25d3b0b5ac17fddecacdd55f613f75b8574ef3ebbe8d5874425af46`, `git apply` sur `ddb4265`) ; les gestes sont ceux du ticket 83, « À faire, dans l'ordre ». Rien n'est à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs` et `contexte-ticket.test.mjs`, `skills/chaine/revue-de-ticket/references/criteres-ticket.md` et `CONTENU.md`, `skills/chaine/relecture/references/criteres-ticket.md` (la copie du régime 8 ; aucun ticket de suite ne touche `relecture/`), `scripts/depot.test.mjs` (le passage de `T3`, une ligne) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`, pour la PR entière (les PR de suite, « socle-tests » et « anchorpost » les touchent aussi : § 3 du ticket 83). Aucun ticket de suite ouvert ne touche `revue-de-ticket/`.

## Le besoin

La revue de ticket (`K4`, livré : le critère `T3` réécrit) relit les preuves des règles du ticket : celles de la ligne `Règles:`, que `contexte-ticket.mjs` rend sous « Règles du ticket », fichier de règle compris (c'est là que le relecteur lit les cas). Un ticket qui prouve une règle sans la réaliser la nomme désormais sur `Prouve:` (ticket 84) : sur `main` à `ddb4265`, le contexte la range parmi les « Identifiants cités », et `T3` ne la relit pas. La décision de l'architecte (2026-11-17, carte de `SPEC_ALL_ANC-5`, `K3`) : « le gate et la revue de ticket lisent les deux lignes ».

## Où

| Fichier | Ce qui change |
| --- | --- |
| `revue-de-ticket/scripts/contexte-ticket.mjs` | l'en-tête, point 3 ; la ligne `Prouve:` de l'en-tête du ticket, lue comme `Règles:` ; ses règles rendues sous « Règles du ticket », après celles de `Règles:`, marquées « règle prouvée par le ticket, sans la réaliser » ; ses jetons illisibles signalés ; une règle des deux lignes rendue une fois, sous `Règles:` ; aucune répétée parmi les cités |
| `revue-de-ticket/scripts/contexte-ticket.test.mjs` | un test, à la fin (et, dans ce test, le commentaire de la ligne retiré, une ligne `Prouve:` du corps ignorée) |
| `revue-de-ticket/references/criteres-ticket.md` | la tête du critère, et `T3` : « les règles sont celles des lignes `Règles:` et `Prouve:` du ticket » ; sa clause (d) : « sa ligne `Règles:` ou `Prouve:` cite la règle » |
| `revue-de-ticket/references/CONTENU.md` | le contexte de l'axe Ticket : la ligne `Prouve:` rendue de même |
| `relecture/references/criteres-ticket.md` | la même tête, le même `T3` et la même clause (d) : le bloc du régime 8 reprend celui du régime 7 mot pour mot, aux réécritures nommées près (`scripts/relecture.test.mjs`, « les critères repris du régime 7 ne perdent rien ») |
| `scripts/depot.test.mjs` | les passages de `T3` exigés (sa tête et sa clause (d)), à ces mots |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | 8.1.0 et sa note (la PR entière) |

## Décisions

1. **`Prouve:` est lue par le contexte comme `Règles:`** : la première ligne de l'en-tête qui commence par `Prouve:`, son commentaire (` # …`) retiré, ses identifiants par la grammaire ; ses règles sont des « règles du ticket » pour `T3`, qui relit leurs preuves comme celles de `Règles:`, dans ses deux branches. La revue ne juge pas qu'une règle soit sur les deux lignes : le gate la refuse (ticket 84). Une ligne `Prouve:` du corps du ticket n'est pas la ligne.
2. **La version** : ces tickets ajoutent un comportement, la mineure suivante : **8.1.0** sur `ddb4265` ; une PR de suite (75 à 79, des correctifs) entrée avant donne 8.0.x à `main`, et cette PR prend 8.1.0 de même ; une autre PR de la preuve suffisante entrée avant donne 8.1.0 à `main`, et celle-ci prend 8.2.0 (`version-mineure.mjs`, ticket 83, § 2 et § 3).
3. **La clause (d) de `T3` lit aussi `Prouve:`** (`A-202`, question 3) : un cas qu'un autre ticket porte ne fait plus écart quand la ligne `Règles:` **ou `Prouve:`** de ce ticket cite la règle, les quatre autres conditions inchangées. Sans elle, le ticket qui réalise une règle et laisse un cas au ticket qui la prouve (`| RULE_X#a | porté par .14 |`, ce que le gate accepte, `A-200` point 1) restait refusé à la revue, en régime 7 comme en régime 8. Les deux copies du critère disent la même phrase.

## Questions à l'architecte

1. **Le régime de K3 : l'index, pas la chaîne.** Le gate juge la preuve suffisante sur le seul `schema` de l'index et sur `project.sufficiency` (ticket 84, décision 3) : un projet sans index au pivot 3 ne voit rien, en régime 7 comme en régime 8 ; un projet au pivot 3 en `observe` n'est jamais refusé. **Recommandation : tel quel**, c'est la lettre du § 8 de la spec et d'`A-22` ; aucune clé de plus dans `.claude/chaine.json`.
2. **`--sans-label` pour `sujet.sh livrer` : pas de ticket.** Sur `main` (depuis 7.25.0), `livrer` ouvre la PR de livraison **sans** `à-fusionner` (« la session qui livre le pose après la relecture de la PR ») ; seul `livrer-prets`, le geste du capitaine, étiquette ses livraisons, et le label `sujet-manuel` sur une sous-PR l'en empêche. En régime 8, une livraison de sujet n'a pas de relecture propre (`P-60`, `sujet/SKILL.md` « Livrer ») ; en régime 7, `regime-7.md` (« Livrer à la main ») dit « le poser après la relecture qu'elle demande (contre-revue si elle touche un chemin sensible) ». La remarque vient de la copie de `sujet.sh` d'Anchorpost, d'avant 7.25.0, qui étiquette encore `à-fusionner` dans `livrer` (sa ligne 871) : **la repose de `sujet.sh` dans Anchorpost (son lot 7 ou `.21`) l'apporte. Recommandation : aucune option ; dire au conducteur d'Anchorpost de livrer un sujet à la main (`sujet-manuel`) quand il veut une contre-revue de la livraison.**
3. **`double-relecture.mjs` (skill `fusionner`) ne lit que `Règles:`** pour exiger deux relectures d'une règle haute (régime 8). Un ticket qui prouve une règle haute sans la réaliser y échappe. La décision de l'architecte ne le tranche pas. **Recommandation : un ticket à part, après l'entrée des PR de suite 75 à 79 (fichiers de la chaîne du régime 8), qui y lise `Prouve:` aussi** ; le relecteur indépendant d'une règle moyenne ou haute en dépend.

## Le patch, pour ce ticket (il fait foi)

- **`contexte-ticket.mjs`** : `reglesRealisees` (l'ancienne `reglesDuTicket`), puis `ligneProuve`, `valeurProuve`, `reglesProuvees` (sans celles de `Règles:`), et `reglesDuTicket` qui les réunit (les cités en sont exclus) ; `illisibles(valeur)` sert aux deux lignes ; le corps cité est le ticket sans ses deux lignes ; `rendreLigne(codes, nom, marque)` rend les deux listes, la ligne `Prouve:` recopiée entre elles.
- **`contexte-ticket.test.mjs`** : « une règle de la ligne Prouve: est rendue sous « Règles du ticket », après celles de Règles:, et n'est pas répétée parmi les cités » ; dans le même test, `Prouve: RULE_ALL_LIC-4 # écrit par .14` rend la règle sans jeton illisible, et une ligne `Prouve:` du seul corps n'est pas rendue.
- **`criteres-ticket.md`** (des deux skills, `revue-de-ticket` et `relecture`, aux mêmes mots), **`CONTENU.md`**, **`depot.test.mjs`** : décisions 1 et 3, aux mots du patch.
- **`plugin.json`** : `"version": "8.1.0"` ; **`NOTES-DE-VERSION.md`** : la note 8.1.0 en tête (« Ce qui change » : la ligne `Prouve:`, le gate de la preuve suffisante, la copie et le gabarit ; « Ce qu'un projet fait pour en profiter » : rien sans index au pivot 3, deux points mis à part, la ligne `Prouve:` et un index présent qui n'est pas du JSON, qui fait sortir le gate en 1 quel que soit le pivot, régime 7, `--elaguer` et `--geler-*` compris ; la repose des scripts et des gabarits).

## Surfaces

| Surface | Preuve |
| --- | --- |
| la revue de ticket rend les règles de `Prouve:` sous « Règles du ticket », une fois chacune | `contexte-ticket.test.mjs`, « une règle de la ligne Prouve: est rendue … » ; C1, C2, C3 |
| la ligne `Prouve:` de l'en-tête seule, son commentaire retiré | le même test ; C4, C5 |
| `T3` relit les règles des deux lignes | `depot.test.mjs`, « T3, branche « cas déclarés » … » ; D5 |
| la copie du régime 8 dit de même | `scripts/relecture.test.mjs`, « les critères repris du régime 7 ne perdent rien … » ; D6 |
| `T3` (d) : un cas porté par un ticket qui prouve la règle sur `Prouve:` ne fait pas écart, dans les deux copies | `depot.test.mjs`, « T3, branche « cas déclarés » … » ; `scripts/relecture.test.mjs` ; D7, D8 |
| la version et sa note | `depot.test.mjs`, le banc des notes de version (la note en tête porte la version de `plugin.json`) |

## Mutations

Dans [`83-85-annexes/mutations.mjs`](83-85-annexes/mutations.mjs), celles de ce ticket : C1 (la ligne Prouve: n'est pas rendue), C2 (une règle des deux lignes est rendue deux fois), C3 (une règle de Prouve: est répétée parmi les cités), D5 (critère T3 : Prouve: n'est plus lue), D6 (critère T3 du régime 8 : Prouve: n'est plus lue), C4 (la ligne Prouve: se lit hors de l'en-tête), C5 (son commentaire n'est pas retiré), D7 et D8 (la clause (d) de T3, dans chaque copie, ne lit plus Prouve:) ; toutes rouges. Le journal de la PR : [`83-85-annexes/mutations.txt`](83-85-annexes/mutations.txt), **38 rouges sur 38**.

## Vérification

Ticket 83, « Vérification » : la PR entière.

### Ce qui a été joué en écrivant ce ticket

_Avec le patch d'avant les retouches d'`A-202` ; les comptes d'après sont sous « Rejoué par la relecture »._

Sur un clone neuf de `https://github.com/MAJ-agency/skills` à `ddb4265` (plugin 8.0.0), le 2026-11-22, Node 22.23.5, git 2.43.0, une machine partagée avec d'autres agents (charge notée) :

- **Le patch** : `git apply --check` seul sur `ddb4265` ; l'arbre obtenu est celui d'où il est tiré. Les trois PR de la preuve suffisante posées l'une sur l'autre (tickets, puis socle-tests et anchorpost par `--exclude` et `version-mineure.mjs`) donnent 8.1.0, 8.2.0, 8.3.0, trois notes en tête ; un second passage de `version-mineure.mjs` n'écrit rien (sortie 1). Le chemin du § 3 (fusion de `main` dans la branche, les deux fichiers de version repris de `main`, la version reposée) ne met en conflit que `NOTES-DE-VERSION.md` (et `plugin.json` pour la troisième), et donne, `NOTES-DE-VERSION.md` mis à part, l'arbre des trois patchs posés.
- **Rouges avant** (§ 1) : **10 rouges sur 136** ; **verts après** (§ 2) : **175 sur 175**.
- **La copie du critère au régime 8** : la première suite entière sur les trois PR posées a trouvé un seul rouge, `scripts/relecture.test.mjs` (« les critères repris du régime 7 ne perdent rien ») : `skills/chaine/relecture/references/criteres-ticket.md` reprend le bloc de `T3` mot pour mot ; le patch y porte la même phrase, et la mutation D6 le tient.
- **Les mutations** : **27 rouges sur 27**, le fichier remis après chacune, l'arbre propre après la passe ([`83-85-annexes/mutations.txt`](83-85-annexes/mutations.txt)).
- **La suite entière** : la suite entière, les quatre motifs de `pnpm test` d'un seul tenant, en tâche de fond avec un `timeout` explicite, sur l'arbre des trois PR posées l'une sur l'autre (plugin 8.3.0) : **1 431 tests, 1 431 verts**, aucun échec, sauté ni annulé ; 18 min 10 s (12:43:23 → 13:01:33 UTC, `duration_ms` 1090263), charge 0,83 au départ, 3,99 à la fin (d'autres agents jouaient leurs bancs) ; [`89-annexes/suite.txt`](89-annexes/suite.txt). Une première passe, avant le patch de la copie du critère du régime 8, rendait 1 430 sur 1 431 (ticket 85). Sur `ddb4265` seul, la suite compte 1 396 tests (1 431 moins les 35 des trois PR : 8, 25 et 2), compte tiré des bancs touchés joués avant et après chaque patch.

### Rejoué par la relecture, après les retouches (`A-202`)

Sur un clone neuf de `main` à `ddb4265`, le 2026-11-22, chaque bloc des § 0 à 3 du ticket 83 tel qu'écrit, la branche de documentation remplacée par un commit local qui porte ces tickets et ces annexes : somme vérifiée ; § 1 : 5 fichiers (4 ` M`, 1 `??`), **11 rouges sur 137** ; § 2 : 19 fichiers (18 ` M`, 1 `??`), **176 sur 176** ; `19 files changed`, arbre propre ; mutations : `sortie 0`, **38 rouges sur 38**, arbre propre ([`83-85-annexes/mutations.txt`](83-85-annexes/mutations.txt)). Les ordres d'entrée de la table du ticket 83 : la PR B (`4afd6e2`, 8.0.1) dans `main` au départ, § 2 : 8.1.0, 19 fichiers ; la PR B entrée pendant que la PR est ouverte, § 3 : `plugin.json` et `NOTES-DE-VERSION.md` seuls en conflit, 8.1.0. La suite entière, sur l'arbre des trois PR empilées (cette PR, puis « socle-tests » et « anchorpost » par leur § 3) : sortie 0, **1 433 tests, 1 433 verts**, aucun échec, sauté ni annulé (1 396, plus 9, 26 et 2) ; 14:55:11 → 15:25:34 UTC (`duration_ms` 1822258), charge 7,1 au départ, 19,0 à la fin, jamais sous 4 (d'autres agents jouaient leurs bancs)

## Ce qui n'a pas été établi

1. **Un relecteur réel** sur un ticket qui porte `Prouve:` : le contexte est joué sur un dépôt jouet ; la première repose (`.21` d'Anchorpost, dont les tickets `.14` et `.15` attendent la ligne) le dira.
2. **Les autres formes de la ligne** : le contexte ne lit que la première ligne `Prouve:` de forme nue de l'en-tête, comme `Règles:` sur `main` ; le gate lit aussi `**Prouve:**`, `- Prouve:`, `* Prouve:`, et chaque ligne. Une règle de `- **Prouve:** RULE_X` passe le gate et tombe dans « Identifiants cités » : `T3` ne la relit pas. Laissé, pour les deux lignes ensemble, à un ticket de suite (`A-202`).

## Hors périmètre

- `double-relecture.mjs` : question 3.
- `sujet.sh livrer` : question 2, aucun changement.

## Comments

- 2026-11-22 — Écrit par un agent rédacteur sur `K3` de la carte de `SPEC_ALL_ANC-5`, sur un clone neuf de `main` à `ddb4265` ; la remarque de l'architecte d'Anchorpost sur `sujet.sh livrer --sans-label` évaluée contre `sujet.sh`, `sujet/SKILL.md` et `chantier/references/regime-7.md` de `main` (question 2).
- 2026-11-22 — Retouché par le relecteur du tour 1 (`83-89-relecture-tour-1/rapport.md`, « Retouches portées »), sur les décisions d'`A-202` : la clause (d) de `T3` lit aussi `Prouve:`, dans les deux copies (D7, D8) ; le contexte ne lit `Prouve:` que dans l'en-tête et en retire le commentaire (C4, C5) ; la note dit l'index illisible, régime 7 compris ; les autres formes de la ligne notées.
