# Contre-relecture de la PR 152 (tickets 78 et 79), tour 1 — sommet `4afd6e2`

**Verdict : non conforme.** Aucun bloquant ; un à corriger (des bancs, pas du code), avec sa retouche essayée ; quatre
mineurs.

Relu sur un clone neuf de `https://github.com/MAJ-agency/skills`, la PR au sommet `4afd6e20c19926f0243bc2bd79b60557921b4845`
(`claude/suites-capitaine`), contre `main` à `ddb4265` (plugin 8.0.0), les tickets et annexes lus sur
`claude/hopeful-lovelace-ouk6tz`. Node 22.23.5, git 2.43.0, quatre cœurs partagés avec d'autres agents (charge notée aux bords
de chaque passe). Lecture seule : rien de poussé, aucun commentaire, aucune étiquette.

| # | Gravité | Objet |
| --- | --- | --- |
| 1 | **à corriger** | La décision 1 du ticket 78 n'est tenue entière par un banc que pour `passer.sh` : `sujet.sh fusionner` n'est joué qu'en régime 8, et ni `fusionner` ni `relancer` ne sont joués sur une tête sans dépôt (fourche supprimée). Le code est juste ; X1, X2 et X3 restent vertes, rouges avec la retouche (`retouches/retouche-78-bancs.patch`) |
| 2 | mineur | Une sous-PR de fourche tient désormais son sujet, régime 7 compris : sur 8.0.0, la fourche ordinaire (sa branche n'existe pas sur origin) sortait en 128 et rendait le sujet ; elle sort maintenant en 7, et les autres sous-PR attendent tant qu'elle porte `à-fusionner`, sous un message qui ne dit pas « fourche ». La note 8.0.1 ne le dit pas |
| 3 | mineur | Le hook d'édition : develop absent du clone (ou un sujet qu'il n'a jamais lu), et aucune copie locale du ticket : le refus ne dit aucun geste, et le geste qui relit develop et les sujets l'aurait levé. C'était déjà le cas sur 8.0.0 ; « develop absent : le refus dit de relire develop » ne vaut que si une copie locale de sujet porte le ticket |
| 4 | mineur | Décision 2 du ticket 78, le sens 8 → 7 (la revue rejouée sur la liste du régime 7) n'est tenu par aucun banc : X4 reste verte, avec ou sans la retouche |
| 5 | mineur | La note 8.0.1 ne dit pas ce qui ne joue qu'en régime 8 (M1, M2, le hook), ni que rien d'autre ne change en régime 7 hors la fourche, comme le disait la note 7.39.0 ; « Ce qu'un projet fait » est complet |

Ce qui tient, et qui a été joué : la garde de fourche est avant tout fetch dans les trois chemins (relu, et l'espion des bancs
le prouve : F3ʹ et F6 rouges) ; les retouches du tour de relecture sont tenues (constat 1 : `relancer` gardé, l'essai
`fourche-relancer` du tour 1 rejoué sur la PR, sortie 7 dans les deux régimes, aucun appel réseau, la branche d'origin
intacte ; constat 2 : l'espion dans les trois cas ; constat 3 : l'essai `accord-retire` du tour 1 rejoué, refus develop en
retard comme develop relu) ; les 19 mutations des annexes sont rouges sur la PR ; les comptes des § 1 et § 2 sont ceux des
tickets ; le régime 7 est celui de 8.0.0 à l'appel près sur les 19 bancs de l'espion (« Le régime 7 », plus bas) ; le patch,
écrit sur 7.39.0, est juste sur 8.0.0 (le lot 6 ne touche aucun des dix fichiers) ; le titre fait 105 caractères avec
` (#152)`.

## Bloquant

Aucun.

## À corriger

### 1. Les bancs de `sujet.sh` ne tiennent pas toute la décision 1 du ticket 78

**Fichier** : `skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs`, lignes 83 à 99 (le cas `fusionner`) et 101 à 117 (le
cas `relancer`). Le code est juste : `skills/chaine/sujet/scripts/sujet.sh`, lignes 922 à 924 et 1265 à 1268.

**Ce que la décision exige** : la fourche sautée « par `passer.sh`, par `sujet.sh fusionner` et par `sujet.sh relancer`
(`A-199` point 1 : une garde qui manque sur un des trois chemins n'est pas une garde), dans les deux régimes, avant tout fetch
de sa tête, … une tête sans dépôt (`head.repo` nul, une fourche supprimée) comprise ». Le banc ne joue la tête sans dépôt que
pour `passer.sh` (F2), et `sujet.sh fusionner` qu'en régime 8 (le tableau « Surfaces » du ticket ne promet d'ailleurs la tête
sans dépôt que par « le même test ; F2 »).

**Le scénario qui casse** : une régression de la forme de F2 dans `sujet.sh` (`'.head.repo.full_name // .base.repo.full_name'`
dans la garde de `relancer`) laisse une fourche supprimée dont la branche portait le nom d'une branche d'origin passer pour
une tête du dépôt : `relancer` fetche `+refs/heads/<tête>` d'origin, y fusionne le sujet et la pousse, le défaut que F5
prouve ; dans `fusionner`, la branche d'origin du même nom est jugée et fusionnée. Aucun banc ne rougit.

**La preuve jouée** : `mutations/mutations-contre-relecture.mjs` sur le sommet, chacune seule, le fichier remis après
(`mutations/contre-relecture-sur-4afd6e2.txt`) :

| Mutation | Sur `4afd6e2` | Avec la retouche |
| --- | --- | --- |
| X1 `sujet.sh fusionner` : une tête sans dépôt passe pour une tête du dépôt | **verte** (8 s) | rouge (12 s) |
| X2 `sujet.sh relancer` : une tête sans dépôt passe pour une tête du dépôt | **verte** (8 s) | rouge (10 s) |
| X3 `sujet.sh fusionner` : la garde ne joue qu'en régime 8 (le régime lu sans réseau sur la copie locale du sujet, avant tout fetch) | **verte** (9 s) | rouge (10 s) |

**La retouche** : `retouches/retouche-78-bancs.patch` (sha256 `be3baa9960433428e120fd8aa0a901383d3c7791799b7a78a035c15fa41307e5`),
le banc seul, `git apply` sur `4afd6e2` : une aide `sansDepot(d, n)` (le `gh` qui rend `head.repo` nul, celui du cas
`passer.sh`, sorti en fonction) ; le cas `fusionner` joué en régime 8, en régime 7, puis tête sans dépôt ; le cas `relancer`
en régime 8, en régime 7, puis tête sans dépôt ; dans chacun, l'espion (aucun fetch), le motif (« `PR de fourche (dépôt
supprimé)` » pour la tête sans dépôt), aucune écriture, et pour `relancer` la branche d'origin du même nom intacte. Rouge
avant : X1, X2 et X3 rougissent le banc retouché (ci-dessus). Vert après : le banc retouché sur le code de la PR, 6 tests, 6
verts ; sur le code de 8.0.0, 6 tests, 5 rouges, les cinq `not ok` du § 1 (`essais/rouges-verts.txt`) ; les 11 mutations
de l'annexe 78 restent rouges avec lui (11 sur 11, `mutations/annexe-78-avec-retouche.txt`). Les comptes du
ticket ne changent pas (six tests).

## Mineurs

### 2. Une sous-PR de fourche tient son sujet, régime 7 compris

**Fichiers** : `skills/chaine/sujet/scripts/sujet.sh`, lignes 923 à 924 et 1267 à 1268 (sortie 7) ;
`skills/chaine/fusionner/scripts/boucle.sh`, lignes 478 et 487 (`relancer` : « en passage chez un autre capitaine », la sortie
7 tient le sujet), 503 et 517 (`fusionner` : « sous-PR non éligible (fermée, en brouillon, ou en passage chez un autre
capitaine) », de même).

**Le scénario** : une sous-PR de fourche dont la branche porte un nom qu'origin n'a pas (le cas ordinaire d'une fourche),
étiquetée `à-fusionner` par un membre, dans un sujet qui a une autre sous-PR. Joué par `boucle.sh`, deux tours, régime 7
(`essais/fourche-tient-son-sujet.test.mjs`, `essais/fourche-tient-son-sujet.txt`) :

| | 8.0.0 (`ddb4265`) | la PR (`4afd6e2`) |
| --- | --- | --- |
| fourche « prête » (`fusionner`) | `couldn't find remote ref`, « non éligible (sortie 128) », le sujet rendu : #81 FUSIONNÉE au premier tour | sortie 7, « tenu par #80 », « #81 attend son tour » aux deux tours ; rien fusionné |
| fourche « prête (sans CI) » (`relancer`) | sortie 128, le sujet rendu : #81 FUSIONNÉE ; deux commentaires de verrou posés sur la fourche | sortie 7, « en passage chez un autre capitaine », « tenu par #80 » ; #81 attend ; aucune écriture |

Ce qui change donc en régime 7 pour une fourche n'est pas seulement la garde : le sujet reste bloqué jusqu'à ce qu'un humain
retire l'étiquette, et la ligne de la boucle ne nomme pas la fourche (le motif est la ligne d'avant). Le ticket l'écrit
(« Ce qui n'a pas été établi », point 2) et le tour de relecture en a relevé le message (constat 7) ; le fait neuf est la
comparaison avec 8.0.0, où la fourche ordinaire rendait son sujet, et `fusionner/SKILL.md` (8.0.0) dit d'une sous-PR sautée
qui garde son sujet que sa cause est « presque toujours commune aux PR du dépôt », ce qui n'est pas le cas d'une fourche. La
note 8.0.1 ne le dit pas. Question 1.

### 3. Le hook d'édition : develop absent, ou un sujet jamais lu, sans copie locale du ticket : aucun geste

**Fichier** : `skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.mjs`, lignes 115 (`developConfirme`),
121 à 124 (`herite`) et 151 (`origin/develop` nommée seulement si `herite` a jugé).

**Le scénario** (`essais/geste-sans-copie-locale.test.mjs`, `essais/geste-sans-copie-locale.txt`, joué sur 8.0.0 et sur la PR,
mêmes résultats) : E1, régime 8, le clone n'a pas `refs/remotes/origin/develop` (un clone qui n'a lu que sa branche), le ticket
accordé sur develop seul, aucun sujet : refus « (Aucune ligne lue : … ou origin injoignable.) », sans geste ; le geste qui relit
develop et les sujets joué, l'écriture passe. E2, le sujet qui a écrit l'accord est sur origin mais jamais lu par le clone :
de même. La session lit « Arrête-toi et écris à ton conducteur » pour un accord déjà donné, le défaut que M4 visait. La PR
calcule `developConfirme` et ne s'en sert que dans `herite` : develop absent ne fait dire le geste que si une copie locale de
sujet porte le ticket (le cas « absente » du banc M4). Ce n'est pas un recul (8.0.0 fait de même), et la décision 1 ne parle
que de `herite` ; mais le geste est sans coût et la garde reste du côté qui refuse. Question 2.

### 4. Décision 2 du ticket 78 : le sens 8 → 7 n'est tenu par aucun banc

**Fichier** : `skills/chaine/sujet/scripts/sujet.sh`, ligne 969 (`lus=$(lister "$REGIME")`).

X4 (`lus=$(lister 8)` : la revue rejouée toujours sur la liste du régime 8) reste verte, sur la PR comme avec la retouche
(9 s, `mutations/contre-relecture-avec-retouche.txt`) : le seul banc du rejeu (« … le régime lu d'abord diffère… ») joue 7
lu d'abord, 8 relu. Le sens inverse (le contrat du sujet qui perd la clé `relecture` entre les deux lectures) ferait juger, au premier contrôle d'un régime 7, la
section de revue sur les retouches aussi, alors que le régime 7 les juge après les checks (`juger_retouches`). Coût : un renvoi
au premier contrôle au lieu d'un renvoi après les checks, dans une fenêtre de quelques secondes. Un cas de banc qui le tient :
une résolution de documentation, une retouche de code, la première lecture forcée à 8 (le `node` du banc M1b), le contrat du
sujet en régime 7 ; attendu, le renvoi de `juger_retouches`, pas celui du premier contrôle.

### 5. La note 8.0.1 ne dit pas le régime de chaque changement

**Fichier** : `NOTES-DE-VERSION.md`, lignes 5 à 17.

Elle dit vrai sur ce qu'elle dit (vérifié contre le code et les bancs : les trois chemins, sortie 7, les deux régimes, avant
tout fetch ; une revue au premier contrôle ; le motif de M2 ; l'héritage jugé contre develop d'origin, la copie qui ne compte
pas, le geste en tête). Elle ne dit pas que M1, M2 et le hook ne jouent qu'en régime 8 (en régime 7, le premier contrôle ne
jouait déjà qu'une revue, la garde du capitaine et le refus du hook ne tournent pas), ni que rien d'autre ne change en régime 7
hors la fourche, la phrase que portait la note 7.39.0 ; et pas le mineur 2. « Ce qu'un projet fait » est complet : les cinq
fichiers de code touchés sont posés par `fusionner poser` (`passer.sh`), `sujet poser` (`sujet.sh`), `revue-adversariale
poser` (`chemins-sensibles.mjs`) et `socle-chaine-de-production` (le hook, `garde-fichiers.mjs` et `regles.mjs`), le banc neuf
suit `fusionner poser` (« Les tests `scripts/*.test.mjs` suivent »), et il se lit dans un projet (`script()` de
`depot-jouet.mjs` les cherche tous dans `scripts/chaine/`) ; « relancer le capitaine » est dit. Proposé, une puce : « Rien
d'autre ne change en régime 7 : la fourche y est sautée aussi, et une sous-PR de fourche étiquetée garde son sujet (les autres
sous-PR attendent qu'on lui retire `à-fusionner`). »

## Questions à l'architecte

1. **La fourche qui tient son sujet** (mineur 2) : la boucle doit-elle rendre le sujet sur la sortie 7 d'une fourche (une sortie
   à part, ou le motif reconnu), puisque sa cause ne passe pas d'elle-même ? Sinon, le dire dans la note et dans
   `fusionner/SKILL.md` (« une sous-PR de fourche étiquetée garde son sujet ; retirer l'étiquette »), avec le motif nommé par la
   ligne de la boucle. Recommandation : un ticket de suite avec `regrouper` (`A-199` point 4), pas une retouche ici.
2. **Le geste sans copie locale** (mineur 3) : étendre le geste à « develop ou un sujet qu'origin porte et que le clone n'a pas
   au sommet » (nommer `origin/develop` dans `perimees` dès que `developConfirme` est faux et qu'origin a develop ; de même pour
   un sujet de `ls-remote` sans copie locale) ? Le refus resterait le même, le geste en plus. Cela change la décision 1 au-delà
   de `herite` : un ticket de suite, ou le ticket du clone superficiel (`A-199` point 3), qui touche la même fonction.
3. **Deux chemins de fourche hors des trois, lus, non joués, et d'avant la PR** : (a) la boucle relance les jobs rouges d'une PR
   étiquetée, puis la renvoie (`boucle.sh`, lignes 281 à 296, `renvoyer.sh`) : une fourche à la CI rouge est renvoyée
   (`fusion-bloquée`, un commentaire), alors que la décision 1 veut « sans renvoi » ; (b) `sujet.sh etat` (lignes 1459 à 1460 et 1486) compte comme livraison
   d'un sujet toute PR ouverte vers develop dont la tête s'appelle `sujet/<nom>`, sans regarder son dépôt ni ses étiquettes :
   une PR de fourche ouverte par n'importe qui depuis une branche `sujet/<nom>` fait dire le sujet « livré #n », que
   `rafraichir_sujets` saute alors (`boucle.sh`, ligne 305) et que `livrer-prets` ne livre pas, tant qu'elle est ouverte. Ni l'un ni l'autre n'agit sur une branche
   d'origin. À la liste des suites ?

## Ce qui a été joué

- **Clone et arbres** : clone neuf, `git fetch origin claude/suites-capitaine claude/hopeful-lovelace-ouk6tz`, `pnpm install
  --frozen-lockfile` ; arbres détachés : `ddb4265` (8.0.0), `4afd6e2` (la PR), `4afd6e2` avec les bancs de 8.0.0
  (`regles.test.mjs`, `garde-fichiers.test.mjs`) pour l'espion, `4afd6e2` avec la retouche. `git diff --stat ddb4265 4afd6e2` :
  10 fichiers ; `git diff --stat 97d17e3 ddb4265` : le lot 6 ne touche aucun d'eux.
- **Les § 1 et § 2 des deux tickets** (`essais/rouges-verts.txt`) : 78, `# tests 6`, `# pass 1`, `# fail 5` (les cinq `not ok`
  attendus) puis `# tests 114`, `# pass 114` ; 79, `# tests 98`, `# pass 93`, `# fail 5` (les cinq attendus) puis `# tests 167`,
  `# pass 167`. Charge 5,6 à 5,8.
- **Les mutations des annexes**, sur la PR, `node 78-annexes/mutations.mjs` puis `79-annexes/mutations.mjs`
  (`mutations/annexe-78-sur-4afd6e2.txt`, `mutations/annexe-79-sur-4afd6e2.txt`) : 11 et 8 rouges, `toutes rouges` deux fois,
  sortie 0, l'arbre propre après (`mutations/arbre-apres.txt`).
- **Mes quatre mutations** (`mutations/mutations-contre-relecture.mjs`) : sur la PR, X1 à X4 vertes ; avec la retouche,
  X1, X2 et X3 rouges, X4 verte (`mutations/contre-relecture-avec-retouche.txt`) ; l'annexe 78 avec la retouche : 11 rouges sur 11, `toutes rouges`.
- **Les essais du tour de relecture**, rejoués tels quels sur la PR (`essais/essais-du-tour-1-sur-4afd6e2.txt`) :
  `accord-retire.test.mjs` (refus develop en retard, avec le geste en tête ; refus develop relu) et `fourche-relancer.test.mjs`
  (régimes 8 et 7 : sortie 7, aucun appel réseau, `origin/feat/a` inchangée ; la boucle de bout en bout : sortie 7, rien sur
  `feat/a`).
- **Mes essais** : `essais/fourche-tient-son-sujet.*` (mineur 2) et `essais/geste-sans-copie-locale.*` (mineur 3), chacun sur
  8.0.0 et sur la PR.
- **Le régime 7 à l'appel près** (`essais/espion-comparaison.txt`) : les 19 bancs de `main` (`ddb4265`) sous l'espion de la
  contre-relecture de la PR 149 (`71-73-annexes/contre-relecture-9db4fb3/essais/espion-poser.mjs`, `espion-jouer.sh`,
  `espion-comparer.sh`, repris tels quels), joués contre les scripts de 8.0.0, puis contre ceux de la PR, les bancs de 8.0.0
  remis dans l'arbre de la PR : mêmes comptes de tests (aucun rouge des deux côtés), et les 19 journaux identiques ligne pour
  ligne, **560 lancements, 8 022 appels `gh`, 6 567 appels `git` au réseau**, chaque lancement avec son code de sortie et sa
  dernière ligne (12:50 → 13:51 UTC, charge 6,6 puis 12,7). Sans la clé `relecture`, rien ne change sur ces bancs, qui n'ont
  pas de fourche ; le seul changement du régime 7 est la fourche (mineur 2).
- **La suite entière** (`essais/suite-entiere.txt`) : `timeout 1800 pnpm test` sur la PR, en tâche de fond, deux fois, sans
  compte final : la première coupée par son `timeout` (sortie 124, charge 2,0 au départ, 13 à 17 ensuite : d'autres agents,
  et l'espion en même temps), 726 tests de tête rendus, aucun rouge ; la seconde arrêtée à la main au bout de 11 minutes (trois
  suites entières sur la machine, charge 22), 165 rendus, aucun rouge. Puis, seuls, les bancs qui lisent `lancement.md` et les skills du lot 6 (`scripts/relecteur.test.mjs`, `bascule.test.mjs`,
  `relecture.test.mjs`) : `# tests 58`, `# pass 58`, `# fail 0`.
- **Le titre** : « fix(chaine): fourches sautées, une revue par mise à jour, le geste en tête du refus (plugin 8.0.1) »,
  lu sur GitHub, le message du commit ; 105 caractères avec ` (#152)`.

## Ce qui n'a pas été établi

1. **Une vraie fourche sur GitHub** : `head.repo` nul ou d'un autre dépôt est joué par le faux GitHub et un `gh` de banc, comme
   dans le ticket.
2. **Le régime 7 sur une fourche** n'est pas dans les bancs de l'espion (aucun n'a de fourche) : il est joué par
   `suites-du-lot-5.test.mjs` (`passer.sh`, `relancer`, et `fusionner` avec la retouche) et par l'essai du mineur 2.
3. **Les chemins de la question 3** : lus, non joués.
4. **Le sens 8 → 7 de M1** (mineur 4) : lu et muté (X4), pas joué de bout en bout.
5. **Le hook dans une vraie session cloud** (clone superficiel ou à une branche) : joué sur le dépôt jouet seulement.
6. **La suite entière à son terme** : les 1 405 sur 1 405 que la session de la PR rapporte (709,6 s, charge 1,0 puis 1,3) ne
   sont pas rejoués jusqu'au bout ici, la machine trop chargée ; ce qui a été rendu (726 tests de tête, aucun rouge), les bancs
   des deux tickets, ceux qui lisent `lancement.md` et l'espion du régime 7 sont verts.
