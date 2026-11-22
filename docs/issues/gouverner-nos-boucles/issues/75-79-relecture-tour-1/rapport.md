# Relecture des tickets 75 à 79 (suites des lots 4 et 5), tour 1

Relu sur la branche de documentation du programme au sommet `7ca3a35c0f7237099c467606a464b2d358a102f1`, contre `main` à
`97d17e3db902c3c06ba9d8f9229809bd8e7bfbed` (plugin 7.39.0), sur un clone neuf, Node 22.23.5, git 2.43.0, quatre cœurs
partagés avec d'autres agents (charge notée aux bords de chaque suite). Le lot 6 : `80-82-annexes/lot-6.patch` du même
sommet. Lecture seule : rien de poussé, aucun ticket modifié.

## Conclusion

| PR | Tickets | Verdict |
| --- | --- | --- |
| A (`claude/suites-relecteur`) | 75, 76, 77 | **prêts après retouches** (une retouche de texte, constat 4 ; aucun bloquant) |
| B (`claude/suites-capitaine`) | 78, 79 | **prêts après retouches** : un bloquant (constat 1) et deux à corriger (2, 3), chacun avec sa retouche essayée |

| # | Ticket | Gravité | Objet |
| --- | --- | --- | --- |
| 1 | 78 | **bloquant** | `sujet.sh relancer` n'a pas la garde de fourche : une sous-PR de fourche « prête (sans CI) » (l'état ordinaire d'une fourche, dont la CI attend une approbation) fait fetcher, fusionner et pousser la branche d'origin du même nom, dans les deux régimes, par `boucle.sh` de bout en bout : Q2 reste ouvert sur ce chemin |
| 2 | 78 | **à corriger** | « avant tout fetch » n'est tenu par aucun banc : F3 retire la garde (le double de F1), elle ne la déplace pas ; la garde déplacée après le fetch survit (R1, R2 vertes) |
| 3 | 79 | **à corriger** | décision 1, « la copie du sujet compte (le côté sûr) » : faux quand develop a retiré un accord que le sujet a hérité ; `main` refuse l'écriture, la PR B l'accepte, develop local en retard (essai `accord-retire`) |
| 4 | 77, 79 | **à corriger** | le § 3 ne dit que « la PR B (ou A) entrée » : après le lot 6, la version prise est 8.0.1 (et non 7.39.2), les deux fichiers de version sont en conflit, et la suite compte 1 402 (A) ou 1 404 (B), nombres que le ticket ne donne pas : une session qui suit « un geste qui ne rend pas ce qui est écrit : s'arrêter » s'arrête et écrit au lanceur |
| 5 | 78 | mineur | R4 survit : le régime lu d'abord sur develop au lieu du sujet ; dans le banc, develop et le sujet ont le même contrat (coût seul, une revue de plus) |
| 6 | 78 | mineur | `regrouper` (lu, non joué) recible une PR de fourche vers develop dans un sujet (`PATCH base`, `sujet-auto`, un commentaire) avant toute garde ; sans fetch ni push, mais la fourche devient une sous-PR qui garde son sujet (« Ce qui n'a pas été établi », point 2) |
| 7 | 78 | mineur | `fusionner/SKILL.md` (celui du lot 6 compris) ne nomme pas « PR de fourche » parmi les sorties 7 ; et `boucle.sh` écrit « en passage chez un autre capitaine » pour toute sortie 7 de `relancer` (après la retouche 1, une fourche aussi ; le motif est la ligne d'avant) |
| 8 | 78, 79 | mineur | les « Attendu » des § 1 et § 2 ouvrent par deux accents graves et ferment par un (quatre endroits) : le texte se lit, le rendu non |
| 9 | 75 à 77 | mineur | « Ce qui a été joué » : l'arbre « PR B puis les trois patchs » est `44e94a8…` par les deux chemins (fusion et `git apply`), pas `dde9aad7…` ; rien à jouer n'en dépend |
| 10 | 77 | mineur | la ligne de la sortie 6 omet « la grammaire des identifiants introuvable », que l'en-tête du script et la note nomment |

## 1. Le besoin

| Point | Porté par | Réparé ? |
| --- | --- | --- |
| `A-189` mineur 7 (le plafond rejoué, écrit et tenu) | 76 (en-tête, banc P1/P2), 77 (« Les lignes », T10, T11) | oui |
| mineur 8 (la borne de la sortie 5, « rejouer au réveil suivant ») | 77 | oui (T1 à T3, T6) |
| mineur 9 (« un champ absent, `couple` ») | 77 | oui (T9) |
| mineur 10 (`reecrire` peut rendre `panne`) | 77 | oui (T8) |
| mineur 11 (« de suite ») | 77 | oui (T4, T5) |
| mineur 12 (un titre sous 120 caractères) | `A-197` point 2 ; titres des tickets | oui : 98 et 99 caractères, 105 et 106 avec ` (#nnn)` ; 108 au plus avec `(plugin 8.0.1) (#1520)` |
| mineur 13 (K8, N3) | 76 | oui : le cas de banc, N3 rouge |
| `A-192` Q1 (sortie 69 : panne) | 75 | oui, des deux côtés (3 chez le capitaine, 6 chez le Relecteur, `A-197` point 1) |
| `A-192` Q2 (fourche sautée) | 78 | **en partie** : `passer.sh` et `sujet.sh fusionner`, pas `sujet.sh relancer` (constat 1) |
| M1 (une revue par mise à jour) | 78 | oui (trois lectures des commentaires au lieu de quatre, M1a à M1c) |
| M2 (le motif d'une mise à jour sans ticket déclaré) | 78 | oui (M2a, M2b) |
| M3 (la limite d'`A-193` écrite) | ticket 72, décision 7 et « Ce qui n'a pas été établi » 5 | oui (diff `46dd04e..7ca3a35` relu) |
| M4 (develop confirmé) | 79 | oui pour le défaut mesuré ; ouvre le constat 3 |
| 23 (le clone entier ne nomme pas le superficiel) | 79 | oui (H4 rouge) |
| 24 (le geste en tête) | 79 | oui (H5 à H8, R3) |
| mineur 7 des tickets 67 à 70 (`--sondes`) | 76 | oui (U1 à U3) |
| mineur 10 de la PR 150 | ticket 74 (diff relu) | oui : l'empreinte `c5608c9b…` est celle de `74-annexes/ticket-74.patch` ; l'arbre `64c2c2a5…` est celui de `37233f8` (#150) |

Rien d'autre n'est glissé : les cinq patchs ne touchent que les fichiers de leur « Où » (`git diff --stat` : 9 fichiers pour A,
10 pour B), et les arbres obtenus (`9df116dc…`, `6f023b15…`) sont ceux que les tickets citent.

Les essais des rapports, rejoués : K1 et K8 sont repris tels quels dans le banc du ticket 76 (verts, rougis par P1, P2, N3) ;
K7 (constat 8) n'est plus qu'un texte, tenu par T1 à T3 ; la fourche du rapport de la PR 149 (Q2) l'est par le banc du ticket
78 (`passer.sh`, `fusionner`) et, pour `relancer`, par `essais/fourche-relancer.test.mjs` (constat 1) ; E4 et E5 du troisième
tour : la limite d'E4 est écrite (ticket 72), E5 est tenu par le cas « clone superficiel » du banc, vert sur la PR B.

## 2. Le code

### Ticket 78 — une PR de fourche, dans les deux régimes

`passer.sh` : la garde vient après les lectures de la PR et des étiquettes, avant `git fetch` (ligne 146) et avant
`prendre_passage` ; aucune écriture, aucun fetch, dans les deux régimes. `sujet.sh fusionner` : après le brouillon, avant le
fetch du sujet (gel) et celui de la tête. Relu et joué avec un espion de `git` (`fetch`, `push`) : rien avant la sortie 7.

**`sujet.sh relancer` n'a pas de garde** (constat 1). `boucle.sh` (`traiter_sujets`) l'appelle pour toute sous-PR que
`file.sh` dit « prête (sans CI) » ou « prête (en conflit) » ; une fourche n'a souvent aucun check (ses workflows attendent
l'approbation d'un membre). `relancer` fetche `+refs/heads/<tête>` d'origin, compare son sommet au `head.sha` de la fourche,
puis `mettre_a_jour_sous_pr` fusionne le sujet dans cette branche d'origin et la pousse. Une fourche qui a copié les branches
d'origin a le même sommet : la branche d'origin du même nom est mise à jour et poussée. Mesuré
(`essais/fourche-relancer.test.mjs`, sur la PR B) : régime 8 et régime 7, `relancer` sort en 0, « sujet/lot fusionné dans sa
branche », `push -q origin HEAD:refs/heads/feat/a` ; `boucle.sh` de bout en bout : « #80 en retard sur sujet/lot : mise à jour
poussée ». Une tête de fourche à un autre sommet : sortie 5 à chaque tour (`REPRISE`), sans fin.

Le premier contrôle d'une PR de mise à jour (M1) : le régime 7 n'y fait qu'un appel local de plus (`regime_de_la_pr`, un
`node` qui lit `origin/<sujet>:.claude/chaine.json` par `git`), aucun appel réseau ; une sous-PR ordinaire, rien de changé.
Un régime relu différent rejoue la revue une fois, sur la liste du régime relu (M1b, M1c rouges) ; `prevu` illisible : la
revue sort en 21 et n'est pas rejouée, comme avant.

### Ticket 79 — `ls-remote` sans réseau

`accordes()` appelait déjà `git ls-remote --heads origin 'refs/heads/sujet/*' refs/heads/develop` (délai 10 s) : le patch
n'ajoute aucune lecture. Sans réseau, `ls-remote` échoue, `accordes()` rend `null`, et le refus est celui de `main` mot pour
mot : « (Aucune ligne lue : … ou origin injoignable.) », sans geste (`gestes` est vide : ni `perimees` ni `superficiel`).
`ls-remote` qui répond sans `develop` : develop non confirmé, le geste qui relit develop est dit.

**Le constat 3.** Décision 1 : develop non confirmé, `herite` rend `false`, la copie du sujet compte « du côté sûr ». Ce
n'est sûr que si la copie refuse. Cas joué (`essais/accord-retire.test.mjs`) : develop accorde `scripts/agent/**` (D0), le
sujet `autre` part de D0, develop retire l'accord (D1), la session n'a relu que le sujet. `main` : refus (la copie du sujet,
égale à sa base de fusion avec la copie locale de develop, est héritée ; develop local non confirmé ne compte pas ; « relire »),
puis, develop relu, refus. PR B : **écriture acceptée** develop en retard, refus develop relu (`essais/accord-retire.txt`).
La règle d'`A-193` refuse ; la PR B ouvre la garde tant que develop n'est pas relu. Rare (un accord retiré), mais c'est un
recul de `main` sur une garde de chemin sensible.

### Le régime 7 à l'appel près

Les 19 bancs de `main` que la contre-relecture de la PR 149 jouait sous son espion (`espion-poser.mjs`, `espion-jouer.sh`,
repris tels quels), joués contre les scripts de `main` puis contre ceux de la PR B, les bancs de `main` dans les deux arbres
(`essais/espion-comparaison.txt`) : mêmes comptes de tests, et les 19 journaux identiques ligne pour ligne, **560 lancements,
8 022 appels `gh`, 6 567 appels `git` au réseau** (chaque lancement avec son code et sa dernière ligne). Le régime 7 de la PR B
est celui de `main` à l'appel près sur ces bancs, qui n'ont pas de fourche : ce que la décision 1 change exprès (la fourche
sautée dans les deux régimes) n'y paraît pas, et rien d'autre ne change. PR A : relu seulement ; `sansOutil` ne joue que sur
une sortie 69 des deux calculs, que le régime 7 ne lance pas (`revue_du_capitaine` sans la clé `relecture` ne lit ni ne
calcule rien), et le Relecteur ne tourne qu'en régime 8.

### Mes huit mutations

`mutations/mutations-relecteur.mjs`, chacune seule, le fichier remis après ; journaux `mutations/mutations-relecteur-A.txt`
et `-B.txt`.

| Mutation | Banc | Issue |
| --- | --- | --- |
| R1 passer.sh : la garde déplacée après le fetch de la tête, avant toute écriture | `suites-du-lot-5` | **verte** (constat 2) ; rouge avec la retouche |
| R2 sujet.sh fusionner : la garde déplacée après le fetch de la tête | `suites-du-lot-5` | **verte** (constat 2) ; rouge avec la retouche (F6) |
| R3 regles.mjs : les deux gestes dans l'ordre inverse | `garde-fichiers`, `regles` | rouge |
| R4 sujet.sh : le régime d'abord lu sur develop, pas sur le sujet | `suites-du-lot-5` | **verte** (constat 5) |
| R5 relecteur.mjs : la sortie 69 en 3 | `relecteur.test.mjs` | rouge (115 s) |
| R6 relecteur.mjs : `--sondes` après `--attendre` dans l'usage | `relecteur.test.mjs` | rouge (113 s) |
| R7 SKILL.md : la borne de 5 sans `--taire <n>` | `scripts/relecteur.test.mjs` | rouge (0 s) |
| R8 revue-exigee.mjs : la cause lue sur la seule sortie standard | `verdict-du-capitaine` | rouge (47 s) |

5 rouges, 3 vertes (R1, R2 : constat 2 ; R4 : constat 5). Les quatre de la PR A sont rouges : ses bancs tiennent ce qu'ils
disent.

## 3. Ce que les tickets supposent de `main`

- Chaque patch : `git apply --check` seul sur `97d17e3`, vert ; 75, 76, 77 l'un après l'autre : arbre `9df116dc…` ; 78, 79 :
  `6f023b15…` ; la branche de chaque PR construite comme le § 2 le dit (patchs, `--exclude`, `version-suivante.mjs`) : le
  même arbre, 7.39.1, `version-suivante.mjs` rejoué sort en 1.
- Une PR sur l'autre, par le chemin du § 3 (fusion de l'autre branche, les deux fichiers de version repris, version
  suivante) : A après B, seul `NOTES-DE-VERSION.md` en conflit, 7.39.2, arbre `44e94a8…` (le même que B puis les trois patchs
  par `git apply --exclude`) ; B après A, de même, `d4743395…`.
- Après le lot 6 (`lot-6.patch` posé et commité, 8.0.0) : les patchs de A et de B par `git apply -3` ne sont en conflit que
  sur `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` ; le chemin du § 3 (fusion du lot 6 dans chaque branche) : les deux
  fichiers en conflit, et eux seuls, la version prise **8.0.1**. Sur ces arbres : `scripts/relecteur.test.mjs` et
  `scripts/depot.test.mjs` 80 sur 80 (A) ; `garde-fichiers`, `regles`, `depot` 167 sur 167 (B). Le lot 6 ne touche aucun
  fichier de code de A ni de B.
- Rouges avant, verts après (`essais/rouges-verts.sh`, sortie `essais/rouges-verts.txt`), chaque bloc joué tel qu'écrit :
  75 : 2 rouges sur 74, puis 74 sur 74 ; 76 : 1 sur 51, puis 51 ; 77 : 4 sur 11, puis 80 sur 80 ; 78 : 4 sur 5 (le cas du
  régime relu vert, voulu), puis 113 sur 113 ; 79 : 5 sur 98, puis 167 sur 167. Tous comme écrit.
- Échantillon de dix mutations des annexes, chacune seule sur la branche de sa PR (`mutations/echantillon-annexes.txt`) :
  Q2, Q7, Q9 (75), U3, N3 (76), T3 (77), F2, M1b (78), H3, H8 (79) : **10 rouges sur 10**, de 0 à 116 s.
- La suite entière, une fois sur chaque PR, en tâche de fond, `timeout 1800` : **A, 1 390 sur 1 390**, 1 092 s (08:44:29 →
  09:02:41 UTC, charge 1,31 au départ, 1,69 à la fin, 7,9 au plus pendant, d'autres agents jouant leurs bancs) ; **B,
  1 392 sur 1 392**, 964 s (09:03:09 → 09:19:14, charge 1,11 puis 7,94). Aucun échec, sauté ni annulé ; arbres propres après
  (`essais/suite-A.txt`, `essais/suite-B.txt`).

## 4. Ce que jouera une session Sonnet

Les gestes du § 0 au § 3 se jouent tels quels (rejoués ici bloc par bloc). Les sommes des patchs sont justes. Les titres :
98 et 99 caractères (102 octets pour B), 105 et 106 avec ` (#nnn)`, sous 120 (`A-197` point 2). Ce qui reste à improviser :

- **Après le lot 6** (constat 4) : le § 3 nomme « la PR B (A) entrée » et « 7.39.2 » ; il ne dit ni 8.0.1, ni que
  `plugin.json` sera en conflit cette fois, ni les comptes : lot 6 seul 1 396 (le ticket 80), donc **1 402** pour A, **1 404**
  pour B (1 405 avec la retouche 1), **1 410** pour l'une après l'autre (1 411). `A-197` veut que la PR qui suit le lot 6
  rejoue `scripts/relecteur.test.mjs` : la suite entière le joue, le ticket ne le nomme pas.
- Le reste ne laisse rien à choisir.

## Retouches, essayées

### Constats 1 et 2 — `retouches/retouche-78.patch`

Sur l'arbre de la PR B (78 et 79 posés), sha256 dans `retouches/SHA256SUMS`. `sujet.sh relancer` : la même garde que
`fusionner`, juste après `pr_json`, avant `refuser_tete_gardee` et tout fetch. Le banc : un espion de `git` (`fetch`, `push`)
dans les trois cas de fourche (« aucun fetch avant la garde ») et un cas neuf, « sujet.sh relancer : une sous-PR de fourche
« prête (sans CI) » est sautée sans renvoi (7), dans les deux régimes, avant tout fetch ». Rouge sans le code (le cas neuf),
vert avec : `suites-du-lot-5.test.mjs` 6 sur 6 ; § 1 rejoué avec la retouche : `# tests 6`, `# pass 1`, `# fail 5`. Les mutations du ticket, récrites
(`mutations/mutations-78-retouche.mjs`) : F3ʹ (la garde de `passer.sh` déplacée après le fetch, au lieu de retirée), F4ʹ
(ancrée sur son commentaire : le texte de la garde est maintenant deux fois dans `sujet.sh`), F5 (la garde de `relancer`
retirée), F6 (celle de `fusionner` déplacée après le fetch) : **11 rouges sur 11**
(`mutations/mutations-78-retouche-sur-retouches.txt`).

À reporter dans le ticket 78 : « Où » (`sujet.sh` : `relancer` aussi) ; décision 1 (« par `passer.sh`, `sujet.sh fusionner`
et `sujet.sh relancer` ») ; § 1 : `# tests 6`, `# pass 1`, `# fail 5` (le cas neuf rouge) ; § 2 : `# tests 114` ; ticket 79, § 1 inchangé (98, 5 rouges, rejoué avec la retouche 79) ; Surfaces :
une ligne pour `relancer` (F5) et « avant tout fetch » prouvé par l'espion (F3ʹ, F6) ; Mutations : 11 ; « Ce qui n'a pas été
établi » 2 : la sortie 7 de `relancer` aussi garde le sujet ; la note de version : « `passer.sh`, `sujet.sh fusionner` et
`relancer` » ; les sommes du patch et des mutations. **La suite entière, la PR B et les deux retouches : 1 393 sur 1 393**,
851 s (09:49:23 → 10:03:35 UTC, charge 1,37 puis 0,92 ; `essais/suite-B-retouches.txt`) ; 1 399 après la PR A, 1 405 après le
lot 6, 1 411 après les deux.

### Constat 3 — `retouches/retouche-79.patch`

Develop non confirmé : `herite` rend `true` (la copie du sujet ne compte pas), `developPerime` nomme `origin/develop` ; la
garde refuse avec le geste qui relit develop, puis la règle d'`A-193` juge. Le commentaire de la fonction et celui de
`developConfirme` le disent. Le banc du cas de M4 : sa seconde partie (une copie que le sujet a écrite, develop en retard)
attend le refus avec le geste, puis l'écriture acceptée après le geste ; une troisième partie joue l'accord retiré (refus
develop en retard, refus develop relu) ; une quatrième, la copie locale de develop absente (refus, le geste qui relit
develop : sans elle, H2 survivait à la retouche, `origin/develop` étant déjà nommé par la lecture des copies de develop).
`garde-fichiers` et `regles` : 98 sur 98 ; le cas rouge sans le code ; l'essai `accord-retire` vert
(`essais/accord-retire.txt`). Les mutations du ticket, H3 récrite en H3ʹ (`mutations/mutations-79-retouche.mjs`) : **8 rouges
sur 8** (`mutations/mutations-79-retouche-sur-retouches.txt`). Coût : une session à develop en retard paie un `git fetch` avant d'écrire un chemin sensible qu'un
sujet accorde ; c'est un geste, jamais une question.

À reporter dans le ticket 79 : décision 1 (« sinon il ne juge rien et la copie du sujet ne compte pas : comptée, une copie
héritée d'un accord que develop a retiré l'accorderait encore ; `origin/develop` entre dans `perimees`, le refus dit le geste
qui relit develop ») ; Surfaces (« une copie que le sujet a écrite compte une fois develop relu ») ; H3 s'inverse : le patch
fait déjà ce qu'elle faisait ; H3ʹ = « develop non confirmé, la copie du sujet compte (`return false`) », rouge sur le cas
retouché.

### Constat 4 — texte du § 3 des tickets 77 et 79

Après « Si `main` bouge entre l'ouverture de la PR et sa fusion (la PR B entrée) », remplacer par :

> Si `main` bouge entre l'ouverture de la PR et sa fusion (la PR B entrée, ou le lot 6, 8.0.0) : fusionner `origin/main`
> […, les mêmes gestes]. La version prise est celle que `version-suivante.mjs` écrit : 7.39.2 après la PR B, 8.0.1 après le
> lot 6, 8.0.2 après les deux ; `plugin.json` est en conflit après le lot 6, il se reprend de `main` comme la note. Puis la
> suite entière à nouveau : 1 398 après la PR B, 1 402 après le lot 6, 1 410 après les deux (elle rejoue
> `scripts/relecteur.test.mjs`, qui lit `lancement.md` du lot 6 : `A-197`).

Et de même au ticket 79 (1 398 après la PR A, 1 404 après le lot 6, 1 410 après les deux), plus un avec la retouche 1.

## Questions à l'architecte

1. **Le clone superficiel, même cas que le constat 3** (ticket 72 décision 7, `A-193`) : un clone superficiel compte la copie
   du sujet « du côté sûr », et ouvre de même la garde sur un accord retiré de develop. Recommandation : le même traitement que
   la retouche 3 (la copie ne compte pas, le geste `--unshallow` en tête), dans un ticket de suite, pas dans la PR B : il
   change une décision écrite (`A-193`) et fait payer un `--unshallow` à chaque session cloud qui écrit un chemin sensible.
2. **`regrouper` et une fourche** (constat 6) : recommandation, un mineur du lot 6 (6b, la sous-PR sautée qui garde son
   sujet), pas une retouche ici.

## Comptes

- Arbres : 5 patchs `--check` verts seuls, 2 enchaînements, 2 ordres A/B, 2 après le lot 6 : identiques ou attendus.
- Rouges avant / verts après : 10 blocs, tous comme écrit.
- Mutations à moi : 8, 5 rouges et 3 vertes (constats 2 et 5) ; échantillon des annexes : 10 rouges sur 10 ; avec les
  retouches : 11 sur 11 (78, récrites) et 8 sur 8 (79, H3ʹ).
- Essais : 3 (`fourche-relancer` : 3 rouges sur la PR B, 3 verts avec la retouche ; `accord-retire` : vert sur `main`, rouge
  sur la PR B, vert avec la retouche ; `rouges-verts`) ; espion du régime 7 : 19 bancs, deux arbres, 560 lancements,
  8 022 appels `gh`, 6 567 appels `git` au réseau, identiques.
- Suites entières : A 1 390 sur 1 390, B 1 392 sur 1 392, B et les retouches 1 393 sur 1 393.
- Constats : 1 bloquant, 3 à corriger, 6 mineurs ; 2 questions.

## Temps

De 08 h 28 à 10 h 30 UTC (2 h 02), dont trois suites entières (18, 16 et 14 min) et deux passes de l'espion (une première
perdue : un chemin de journal relatif, que l'espion de `gh` et de `git` écrit depuis le dépôt jouet ; rejouée en chemin
absolu, 20 min) en tâche de fond, la charge montée à 8 par d'autres agents pendant les deux premières suites.

## Retouches portées (après `A-199`)

Portées par le relecteur dans les tickets 75 à 79 et leurs annexes, publiées à leurs chemins
(`docs/issues/gouverner-nos-boucles/issues/7[5-9]-*.issue.md`, `7[7-9]-annexes/`), sur un clone neuf de `97d17e3`. Pendant ce
travail, `main` a reçu le lot 6 (`ddb4265`, PR 151, 8.0.0, le même arbre que `claude/lot-6-bascule-8` à `3dcb467`) : les
chemins « depuis `main` » et « après le lot 6 » ont été joués tous les deux.

| Ticket | sha256 du patch | Ce qui change |
| --- | --- | --- |
| 75 | `6cbb0e81…` (inchangé) | § 0 : l'empreinte du 77, les versions de `main` (8.0.0 aujourd'hui) ; « Les patchs » sans l'arbre `dde9aad7…` (constat 9) |
| 76 | `698a71b8…` (inchangé) | « Les patchs » récrit (constat 9) |
| 77 | `e73b4ef7…` | décision 7 et la ligne de la sortie 6 : la grammaire des identifiants (constat 10 ; le banc des textes et T7 suivent) ; § 3 : le lot 6, 8.0.1, `plugin.json` en conflit, la table des comptes, le rejeu de `scripts/relecteur.test.mjs` (constat 4) |
| 78 | `f582b4a1…` | la garde dans `relancer`, l'espion de `git`, un cas neuf (constats 1, 2) ; F3ʹ, F4ʹ, F5, F6 ; § 1 6 tests / 5 rouges, § 2 114 ; accents graves (constat 8) |
| 79 | `126f2e2d…` | décision 1 récrite (`A-199` point 2), le cas M4 en quatre parties, H3ʹ ; la note (`relancer`, la copie qui ne compte pas) ; § 3 et sa table (constat 4) ; accents graves |

Joué : chaque patch seul et à la suite sur un clone neuf de `97d17e3` (arbres `b0e930ab…`, `cd47a2b6…`) ; les § 1 et § 2 de
chaque ticket, depuis `97d17e3` puis depuis `ddb4265`, aux mêmes comptes (`essais/rouges-verts-N.txt`,
`essais/rouges-verts-main.txt`) ; les mutations des annexes touchées, 11 (77), 11 (78), 8 (79), toutes rouges ; les ordres
d'entrée du § 3 (après l'autre PR, après le lot 6, après les deux) par leurs gestes, conflits et versions de la table ; la
suite entière : voir `essais/suites-retouches.txt`.
