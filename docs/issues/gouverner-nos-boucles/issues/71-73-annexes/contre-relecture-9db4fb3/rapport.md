# Contre-relecture de la PR 149 (tickets 71, 72 et 73, lot 5), tour 1, au sommet `9db4fb3`

PR 149 de `MAJ-agency/skills`, tête `claude/lot-5-verdicts`, sommet `9db4fb347dc3c1120c5b172b78461a75f1b9b9b7`, base
`main` à `2e87bae` (7.38.2), plugin 7.39.0. Effort extra (`P-64`). Lecture seule vis-à-vis de GitHub : rien poussé,
rien commenté, aucune étiquette. Clone neuf, Node 22.23.5, quatre cœurs partagés avec d'autres agents.

## Conclusion

**Verdict proposé : non conforme au sommet `9db4fb347dc3c1120c5b172b78461a75f1b9b9b7`** ; conforme avec
`retouches-tour-1.patch` (sur `9db4fb3`, version inchangée), sous réserve des deux questions. Aucun bloquant : le
régime 7 est celui de `main`, à l'appel près (point 3, prouvé sur 19 bancs de `main` rejoués par un espion), et le
régime 8 n'est allumé par aucun gabarit. Six écarts à corriger, tous du régime 8 : un banc absent sur la règle même
du lot, des textes qu'une session Sonnet suivrait jusqu'à bloquer sa PR, une panne lue comme une lecture illisible.

| # | Gravité | Ticket | Constat, en une ligne |
| --- | --- | --- | --- |
| 1 | à corriger | 71 | aucun banc ne tient que le tour validé porte sur le **contenu** du sommet : « même contenu propre » toujours vrai (X8) reste vert |
| 2 | à corriger | 73 | `demarrer` donne la demande de relecture en « À relire — sommet … » : écrite ainsi, c'est une marque presque à la forme, et la PR est sautée à chaque passage, sans renvoi |
| 3 | à corriger | 73 | `renvoyer.sh` dit « remettre `à-fusionner` » à une PR empilée en régime 8, dont la cause dit « demander sa relecture » |
| 4 | à corriger | 71 | `double-relecture.mjs` ou `meme-contenu.sh` absent : sortie 21 (« lecture illisible », PR sautée), pas 3 (panne) comme le dit la décision 4 |
| 5 | à corriger | 72 | le hook refuse un chemin accordé quand la copie locale du sujet est en retard sur origin, sans dire le geste qui la relit |
| 6 | à corriger | 72 | les motifs de la garde du capitaine : « la corriger sur le sujet » fait réécrire l'accord par la session (`A-74` l'interdit) ; « sans ticket », « introuvable » sans geste |
| 7 | mineur | 71 | un push reçu entre la lecture de la PR et le `git fetch` de `passer.sh` : renvoyée (4) faute de verdict, au lieu d'être sautée (7) |
| 8 | mineur | 72 | la garde du capitaine lit un sujet supprimé du distant (le fetch de `revue_du_capitaine` n'élague pas) : renvoi à tort |
| 9 | mineur | 73 | le gate lit la criticité autrement que le calcul (`A-113`, `A-134`) dans les cas mixtes index / en-tête, et son banc fige l'écart |
| 10 | mineur | 73 | `demarrer` ne dit rien du régime 8 pour une PR vers develop (ticket sans sujet, sujet livré) |
| 11 | mineur | 71-73 | sept gestes du régime 8 sans banc : contrat illisible (mêmes faits), clé citée, clé sur un seul sujet, régime de `demarrer`, pagination des commentaires, sensibles du sujet, ticket gelé (`A-185`, point 5) |
| 12 | mineur | 73 | le refus de `demarrer` dit « le lui demander » (au capitaine), qu'une session ne sait pas joindre |
| 13 | mineur | 73 | la note 7.39.0 dit « rien ne change » sans la clé, alors que `etat` et le refus de `demarrer` changent (voulu) |

**Questions** (hors du patch) : Q1, la sortie 69 (outil absent) des calculs ; Q2, les PR de fourche.

**Patch et preuves** : `retouches-tour-1.patch` (sha256 `7941d2598bf49fdb…ad2b`, 20 fichiers, +300 −43), appliqué sur
`9db4fb3` par `git apply` sans écart (arbre `0072374e`) ; bancs touchés rouges avant (15) et verts après (13 bancs du
lot : 369 sur 369) ; mes 19 mutations : les 9 dont le texte est au sommet, **toutes vertes** avant, **toutes rouges**
après (19) ; les 34 mutations de l'annexe qui visent un fichier ou un banc retouché, rouges sur les retouches ;
l'échantillon de 20 de l'annexe, toutes rouges au sommet ; **suite entière sur les retouches : 1 359 sur 1 359**
(1 348 + 11 tests neufs), aucun sauté.
Dossiers `essais/` et `mutations/`.

**Temps** : de 02 h 22 à 03 h 47 UTC, 1 h 25 (voir « Temps »).

## 1. L'arbre de la PR

`essais/egalite.sh` (sortie `essais/egalite.txt`) : `lot-5.patch` (sha256 `4e97a67c94dc185c…806f`) par `git apply -3`
sur `2e87bae` sort en 1, en conflit sur `plugin.json` et `NOTES-DE-VERSION.md` seuls ; ces deux fichiers remis à
`main`, l'écart avec `9db4fb3` est de **0 ligne hors des fichiers de version** ; les deux fichiers de version portent
la seule différence (7.39.0, la note de 16 lignes en tête). 28 fichiers, +1 860 −54.

## 2. Les rouges avant, l'échantillon de mutations

- **Rouges avant** (`essais/rouges-avant.txt`, les 13 bancs du patch posés seuls sur `main`) : **51 sur 358**, fichier
  par fichier comme les tickets : 71 = 18 + 5 + 2 + 1 = 26 ; 72 = 6 + 3 + 2 + 1 + 6 = 18 ; 73 = 3 + 2 + 1 + 1 = 7.
- **Verts après** : la suite entière au sommet, **1 348 sur 1 348**, aucun sauté, 875 s (`essais/suite-9db4fb3.txt`).
- **Échantillon de 20** de `mutations.mjs`, graine 149 (`mutations/echantillon-20.mjs` : mulberry32, Fisher-Yates sur
  A1…A34, B1…B27, C1…C19, les 20 premiers) : A6 A7 A9 A14 A16 A20 A22 A25 A26 A29 A30 B13 B14 B20 B24 B25 C2 C3 C7 C13
  — **toutes rouges (20)**, 14 min (`mutations/echantillon-20.txt`).

## 3. Le régime 7, à l'appel près (`A-186`, point 1)

La charge de la preuve inversée : chaque morceau du patch exécuté sans la clé est nommé, et chacun est joué par un
scénario qui compare `main` et la PR.

**Inventaire** (les 15 fichiers de code du patch, hors version) :

| Morceau | Joué sans la clé ? | Ce qu'il fait de plus que `main` |
| --- | --- | --- |
| `github.sh` `cle_relecture_sur` | oui (`revue_du_capitaine`, `renvoyer.sh`, `demarrer`) | un `git show` local et `jq` |
| `github.sh` `regime_de_la_pr` | non (`renvoyer.sh` ne l'appelle que si une ref porte la clé) | — |
| `github.sh` `revue_du_capitaine` | oui (`passer.sh`, `sujet.sh fusionner`) | sans la clé : ni fetch, ni lecture ; `mktemp`, `jq -s` sur `[]`, la CLI avec ses options, `rm` |
| `github.sh` `garde_des_sensibles` | non (régime 8) | — |
| `passer.sh` étape 1 | oui | la CLI répond `régime 7` en première ligne, que rien ne reprend (le motif est la dernière) ; les codes 21, 5, 2, 3 ne sortent pas sans la clé (ci-dessous) |
| `passer.sh` garde, 5 ter | non (`regime = 8`) | — |
| `renvoyer.sh` | oui | une boucle locale sur `refs/remotes/origin/{develop,sujet/*}` ; sans clé, aucune lecture de la PR |
| `revue-exigee.mjs` CLI | oui (avec options) | `regimeDeLaPr` : relit le contrat de la base en local ; 21 si le contrat ne se lit pas **et** nomme `"relecture"` (décision 1, voulu) ou si `origin/<base>` manque (inatteignable après le fetch des deux scripts) ; 2 inatteignable (les deux scripts passent un sha de 40 caractères et un fichier) |
| `sujet.sh fusionner` | oui | comme `passer.sh` ; la PR de mise à jour garde `juger_retouches` |
| `sujet.sh demarrer` (message) | oui | `cle_relecture_sur` local, puis le texte de `main` |
| `sujet.sh verifier_ticket` (refus) | oui | **texte changé, voulu** (`A-69`, les deux régimes) |
| `sujet.sh etat` | oui | **voulu** (`A-132`, les deux régimes) : un `git fetch` et peut-être un `ls-remote` par sujet sans commit propre ni PR, puis la lecture de ses PR fermées |
| `chemins-sensibles.mjs` CLI | oui | sous `estPointEntree()` : les six accès tenus (`points-d-entree.test.mjs`) |
| `regles.mjs`, `garde-fichiers.mjs` | oui | `regime8` faux : `null` comme avant ; un `import` local de la grammaire |
| `pr-titre.mjs` | oui | `regimeDeLaPr` en local ; 3 au lieu de 1 pour un contrat illisible qui nomme la clé |
| `tickets.mjs`, `tickets-regles.mjs` | oui | un `git ls-files` local de plus (les fichiers de règle, lus même en régime 7) |
| `pr-titre.yml` | oui | une variable `PR_OUVERTE` de plus, lue seulement si la base porte la clé |
| `faux-gh.mjs` | bancs seuls | `pendantCi` : deux formes de plus, l'ancienne inchangée |

**Scénarios.**

- **Les bancs de `main`** (`essais/espion-poser.mjs`, `essais/espion-jouer.sh`) : l'espion se pose à l'identique dans
  `depot-jouet.mjs` de `main` et de la PR (le fichier est le même des deux côtés) ; il journalise chaque appel à `gh`,
  chaque `git fetch`, `ls-remote`, `push`, `pull`, et chaque script lancé (nom, arguments, code de sortie, dernière
  ligne). Les 19 bancs de `main` qui lancent `passer.sh`, `sujet.sh`, `renvoyer.sh`, `boucle.sh`, `file.sh`, `pr-titre`,
  la CLI de `revue-exigee.mjs` et de `chemins-sensibles.mjs`, `gestes.sh`, le gate et les hooks de commande sont joués
  **dans leur version de `main`**, contre les scripts de `main` puis ceux de la PR. Résultat
  (`essais/espion-comparaison.txt`, comptes par banc dans `essais/espion/`) : **554 scripts lancés, 7 961 appels `gh`,
  6 502 appels `git` au réseau, 18 828 lignes de journal, identiques ligne pour ligne**, sauf une : la dernière ligne
  du refus de `demarrer` (`sujet.test.mjs`, test 7 de `main`, seul test rouge sur la PR), le texte d'`A-69`, voulu ;
  mêmes appels et même code de sortie (4). Les 553 autres lancers rendent le même code et la même dernière ligne. Les
  bancs sans appel au faux (`revue-exigee`, `regles`, `garde-commandes`, `tickets`, `tickets-gate`, `relecture`) sont
  verts sur la PR dans leur version de `main` : ce qu'ils figent du régime 7 tient. Le premier jet de l'espion posait
  son `git` dans `bin/`, où un banc de `sujet-fusionner` écrit le sien et cherche « le vrai » par `command -v` : il
  tournait sur lui-même ; l'espion a son dossier, rejoué entier.
- **Ce que les bancs de `main` ne jouent pas** : `etat` sur un sujet sans commit propre en retard (`A-132`, voulu : un
  `git fetch` et peut-être un `ls-remote` de plus par tel sujet) ; un contrat cassé qui nomme `"relecture"` (21, voulu
  par la décision 1 ; le cas qui ne la nomme pas est joué par le banc « régime 7, passer.sh » de la PR : renvoi 4, comme
  `main`) ; `renvoyer.sh` quand un seul sujet porte la clé (une lecture de la PR, voulue par la décision 1 du ticket 73 :
  sans cette lecture, la base d'une PR ne se connaît pas).
- **Le hook d'édition et le gate** (`essais/regime7-hook-gate.mjs`, sorties `regime7-hook-gate-*.txt`) : six
  écritures (chemin sensible accordé ou non, ordinaire, migration livrée, fichier généré, branche sans ticket) et le
  gate, un espion sur tout `git` : `main`, `9db4fb3` et les retouches rendent les mêmes codes, les mêmes refus, aucun
  appel réseau ; seul écart, le `git ls-files docs/metier/regles/*/RULE_*.md` local du gate (ci-dessus).

## 4. Le régime 8, attaqué

Joué, en plus des bancs du lot (chaque essai est dans `essais/`, avec sa sortie) :

| Attaque | Ce qui se passe au sommet | Constat |
| --- | --- | --- |
| verdict sur un sommet ancien, puis un vrai commit | renvoyé (4), mais aucun banc ne le tient | 1 |
| verdict qui change entre les deux contrôles | `refusé`, étiquettes, `fusion-bloquée` pendant la CI : vus (bancs du lot) ; un second tour `refusé` en page 2 : vu, mais aucun banc (le faux ne paginait pas) | 11 |
| demande de relecture écrite comme le dit `demarrer` | sautée (7) au passage 1, au passage 2… (`demande-du-message.txt`) | 2 |
| PR empilée | renvoyée (4) ; le commentaire dit « remettre `à-fusionner` » (`renvoi-pile.txt`) | 3 |
| calcul absent à côté de `revue-exigee.mjs` | 21, sautée (`calcul-absent.txt`) | 4 |
| copie locale du sujet en retard (hook) | refus sans geste (banc `garde-fichiers` 5) | 5 |
| push entre `pr_json` et le fetch | renvoyée (4) (`push-pendant-la-lecture.txt`) | 7 |
| sujet supprimé du distant, ref restée | renvoyée (20 → 4) (`sujet-supprime.txt`) | 8 |
| ticket sur develop et sur un sujet | la copie du sujet fait foi (`A-185`, point 3) : tenu (B16) | — |
| accord mal formé | renvoi, motif qui fait réécrire l'accord par la session | 6 |
| contrat de base illisible, clé lisible | chemin sensible comme chez le Relecteur ; aucun banc | 11 |
| criticité, index et en-tête en désaccord | gate et calcul divergent (`criticite-mixte.txt`) | 9 |
| PR de fourche | aucun verdict possible (`author_association`) ; aucune garde de fourche chez le capitaine, ni sur `main` | Q2 |

**`A-105`, `A-107`, `A-132` et `A-185`, points 1 à 6**, lus dans le code et joués : deux contrôles (étape 1 et 5 ter de
`passer.sh` ; premier contrôle et `verdict_avant_fusion` de `sujet.sh`, avant `avancer_sujet` pour une PR de mise à
jour) ; `/security-review: lancée` exigée dans le verdict sur un chemin sensible (`compter`, fait `sensible`) et la
section du corps plus lue en régime 8 ; `etat` liste le sujet sans commit propre en retard et pas livré ; point 1, la
pile renvoyée (mais le texte du renvoi, constat 3) ; point 2, la sous-PR illisible sautée en 7, son sujet gardé ;
point 3, la copie du sujet fait foi, chaque copie couvre (B16, B25) ; point 4, les gardes ne lisent que « un nom, une
date » (`^\S.*, \d{4}-\d{2}-\d{2}$`) ; point 5, `Relecture: double` exigée hors du garde `pret && !gele`, sans banc
(X15, constat 11) ; point 6, gate en 2 sans `double-relecture.mjs` (banc du gate).

**Mes mutations** (`mutations/mutations-contre.mjs`) : X1 à X15 sur ce qui m'a paru fragile, et A32, C6, C16, C19 de
l'annexe récrites sur le texte retouché (Aʹ32, Cʹ6, Cʹ16, Cʹ19 : leurs textes changent avec les retouches). Sur
`9db4fb3` (`mutations/avant-9db4fb3.txt`) : les 9 dont le texte y est (X1, X2, X3, X4, X6, X7, X8, X12, X15) **toutes
vertes** ; les autres portent sur le code neuf des retouches, dont l'état de `9db4fb3` est le mutant même (les rouges
avant des bancs neufs le prouvent). Sur les retouches (`mutations/apres-retouches.txt`) : **toutes rouges (19)**.

## 5. Les textes qu'une session Sonnet jouera

Aucun `SKILL.md` n'est touché par la PR (la partie 6b les récrit). Les messages : constats 2, 3, 5, 6, 10, 12. Les
messages du capitaine (sauts, pauses, pannes) disent chacun quoi faire ou que rien n'est à faire.

## 6. La suite entière

- Au sommet `9db4fb3` : **1 348 sur 1 348**, aucun sauté, 875 s, charge 0,04 au départ (`essais/suite-9db4fb3.txt`).
- Sur les retouches (`b647d3a`, arbre `0072374e`, celui du patch) : **1 359 sur 1 359**, aucun sauté, 983 s, après
  1 100 s d'attente d'une charge sous 3 (2,83 au départ, jusqu'à 8 en route : l'espion et un autre agent)
  (`essais/suite-retouches.txt`).

## Constats

### 1 — à corriger — le verdict porte sur le contenu du sommet : aucun banc ne le tient (ticket 71, `A-91`)

**Fait.** `verdictEnLigne` calcule « même contenu propre » de chaque sommet de tour avec la tête, et `tourValide` ne
garde un tour que pour le même contenu. Si ce calcul répond toujours « même », un verdict sur un contenu ancien vaut
pour un contenu neuf : la règle même du lot. **Preuve.** X8 (`memeContenu[s] = true`) reste verte sur `verdict-du-capitaine.test.mjs`
(`mutations/avant-9db4fb3.txt`) ; aucun autre banc du lot ne porte un tour sur un sommet plus ancien que la tête ; A10
tient le cas inverse (« toujours différent »), pas celui-là. **Retouche.** Banc « un tour validé sur un
sommet plus ancien, puis un vrai commit de l'auteur : renvoyée en 4, jamais fusionnée » (`verdict-du-capitaine.test.mjs`).
X8 rouge après.

### 2 — à corriger — la demande de relecture, telle que `demarrer` la donne, bloque la PR (ticket 73, décision 2)

**Fait.** En régime 8, `demarrer` écrit « demander la relecture (commentaire « À relire — sommet … », étiquette
à-relire) ». La forme lue (`FORME_DEMANDE` de `decision-relecteur.mjs`) est `À relire — sommet <40 hex> — Session: <id> —
Conducteur: <id ou —>`, seule dans le commentaire ; un commentaire qui commence par `À relire — ` sans elle est une
marque presque à la forme : `tourValide` lève, la CLI sort en 21, et `passer.sh` saute la PR en 7, **à chaque
passage, sans renvoi**, tant que le commentaire reste. Le texte de `renvoyer.sh` donne la forme, sans dire le sha
entier, `—` sans conducteur, ni « seul dans le commentaire ». **Preuve.** `essais/demande-du-message.txt` : la demande
du message, un tour validé : sortie 7 aux passages 1 et 2 ; la forme entière : fusionnée. **Retouche.**
`DEMANDE_DE_RELECTURE` dans `github.sh`, la forme exacte et ses trois précisions, reprise par `renvoyer.sh` (deux
textes) et `demarrer` (nouvelle `demande_de_relecture`). Banc : le gabarit, rempli comme il le dit (avec et sans
conducteur), est lu comme une demande par `lireMarques` (`messages-du-regime.test.mjs`, tests 1 à 4).

### 3 — à corriger — `renvoyer.sh` fait remettre `à-fusionner` à une PR empilée (ticket 73, décision 1, `A-93`)

**Fait.** `regime_de_la_pr` lit le régime sur la base de la PR ; pour une pile, sa base (la branche parente) est hors
de la chaîne : régime 7, et le commentaire dit « Corriger, puis retirer `fusion-bloquée` et remettre `à-fusionner` »
sous la cause « … la recibler sur develop, puis demander sa relecture ». **Preuve.** `essais/renvoi-pile.txt`.
**Retouche.** Base hors de develop et des sujets : lue sur develop, où elle sera reciblée, comme `passer.sh`. Banc test
5 ; X5.

### 4 — à corriger — un calcul absent est une lecture illisible, pas une panne (ticket 71, décision 4)

**Fait.** La décision 4 : « Sortie 3 : en régime 8, l'outil en panne (un calcul absent à côté, une exception) ». Seuls
`decision-relecteur.mjs` et `verdict.mjs` (importés) donnent 3 ; `double-relecture.mjs` et `meme-contenu.sh` absents,
`spawnSync` rend 1 ou 127, lu « illisible » : 21, et `passer.sh` saute chaque PR en 7, « le Relecteur prévient
l'architecte » — qui, lui, a ses outils et ne voit rien. Le banc 19 n'ôte que tous les calculs à la fois.
**Preuve.** `essais/calcul-absent.txt` (21, 21 au sommet ; 3, 3 après). **Retouche.** Les quatre calculs vérifiés
avant toute lecture : absent, exception, sortie 3. Banc ; X9.

### 5 — à corriger — le hook refuse un chemin accordé sans dire de relire le sujet (ticket 72, décision 2)

**Fait.** `accordes()` n'admet qu'une copie locale au sommet d'origin (`ls-remote`), à juste titre. Mais la copie locale
d'un sujet est en retard dès qu'une autre sous-PR y entre ; le chemin accordé est alors refusé avec la raison « écris à
ton conducteur » (si develop porte le ticket) ou « Aucune ligne lue : … ou origin injoignable » : le conducteur a déjà
accordé, rien ne dit `git fetch`. **Preuve.** Banc `garde-fichiers.test.mjs`, test 5 (rouge au sommet). **Retouche.** Les
copies non lues qui portent le ticket sont nommées, et le refus donne le geste exact (`git fetch --prune origin
'+refs/heads/develop:…' '+refs/heads/sujet/*:…'`, la commande que `carte` joue), puis « refaire l'écriture » ; la
règle ne change pas (B10 et B11 tiennent) ; la commande passe le hook de commandes (`essais/geste-du-hook.txt`). X10.

### 6 — à corriger — les motifs de la garde du capitaine (ticket 72, décision 4, `A-74`, `A-75`)

**Fait.** « ligne `Sensibles:` du ticket … illisible : la corriger sur le sujet » : la session renvoyée réécrirait
l'accord elle-même (`A-74` : « la session qui code écrirait elle-même son accord ») ; « PR sans ticket … » et
« ticket … introuvable … » ne disent aucun geste. **Retouche.** Les trois motifs disent d'écrire au conducteur, ce qu'il
fait, et que la session n'écrit jamais l'accord ; bancs `sensibles-du-capitaine.test.mjs` 2 et 5.

### 7 — mineur — un push pendant la lecture de la PR est renvoyé (ticket 71, décision 6)

**Fait.** `passer.sh` lit la PR (sommet X, celui du Relecteur), puis `git fetch` : si l'auteur a poussé entre les deux,
le premier contrôle juge O, que personne n'a relu, et renvoie (4, `fusion-bloquée`, un renvoi compté) ; sur `main`, la
même course finit au contrôle du verrou (« sommet changé », 7). `sujet.sh` juge `head.sha` : non touché.
**Preuve.** `essais/push-pendant-la-lecture.txt`. **Retouche.** En régime 8, sur un refus, `origin/<tête>` différent du
sommet lu : sautée (7), reprise au passage suivant ; le régime 7 n'y passe pas. Banc ; X13.

### 8 — mineur — la garde du capitaine lit un sujet supprimé (ticket 72, décision 4)

**Fait.** La garde lit toutes les refs `origin/sujet/*` ; le fetch de `revue_du_capitaine` ne les élague pas ; un sujet
livré et supprimé garde, dans le clone du capitaine, sa copie ancienne du ticket, qui fait alors foi seule. Dans la
boucle, `file.sh` joue `carte` (qui élague) avant chaque passage : la fenêtre est courte ; `passer.sh` à la main (PR au
plafond) ne l'a pas. **Preuve.** `essais/sujet-supprime.txt` : 20 sans `--prune`, 0 avec. **Retouche.** `--prune`, comme
`carte`. Banc ; X14 ; A32 récrite (Aʹ32).

### 9 — mineur — le gate ne lit pas la criticité comme le calcul (ticket 73, décision 5, `A-113`, `A-134`)

**Fait.** Le calcul (`hautes` de `double-relecture.mjs`) prend le plus haut niveau de l'index et de l'en-tête, et l'un
des deux suffit à dire la règle en vigueur ; le gate écarte chaque source hors vigueur à part. Rejetée dans l'index et
haute, moyenne en vigueur dans l'en-tête : le calcul exige deux relectures, le gate ne prévient pas — et son banc
l'affirme (« la criticité de l'en-tête seule décide », mutation C19). **Preuve.** `essais/criticite-mixte.txt` (le
calcul : « exigée » dans les deux cas mixtes). **Retouche.** `niveauDe` comme `hautes` ; le banc renversé, plus le cas
« rejetée des deux côtés » (0) ; C16 et C19 récrites (Cʹ16, Cʹ19).

### 10 — mineur — `demarrer` ne dit rien du régime 8 vers develop (ticket 73, décision 2)

**Fait.** Le message du régime 8 n'est que sur le chemin du sujet ; « ne déclare pas de sujet » et « sujet déjà livré »
(PR vers develop) n'en disent rien. **Retouche.** `demande_de_relecture develop` sur ces deux chemins quand develop porte
la clé. Banc test 4 ; X11.

### 11 — mineur — sept gestes sans banc (tickets 71 à 73)

Vertes au sommet : X1 (un contrat de base illisible rend le chemin sensible, comme chez le Relecteur), X2 (la clé
nommée entre guillemets : un chemin `skills/chaine/relecture/**` dans un contrat cassé reste en régime 7), X3
(`renvoyer.sh` : la clé sur un seul sujet), X4 (`demarrer` lit le régime sur le sujet, pas sur develop), X6 et X7 (les
commentaires lus sur toutes leurs pages, `A-108` : le faux GitHub ne paginait pas), X12 (les sensibles du contrat du
sujet) ; et X15, `Relecture: double` exigée même d'un ticket gelé (`A-185`, point 5). **Retouche.** Un banc pour chacun ; le faux GitHub pagine (`pageCommentaires`, sans `--paginate` la première
page, avec chaque page, `--jq` par page) et son banc (`faux-gh.test.mjs`).

### 12 — mineur — le refus de `demarrer` : « le lui demander » (ticket 73, décision 3)

**Fait.** « attendre, ou le lui demander » (au capitaine) : une session ne sait pas joindre le capitaine ; la consigne du
ticket 56 fait passer par le conducteur. **Retouche.** « attendre, ou l'écrire à ton conducteur (à qui t'a lancé), qui le
demande au capitaine » ; `sujet.test.mjs` ; C6 récrite (Cʹ6).

### 13 — mineur — la note 7.39.0

**Fait.** « Rien ne change pour une PR du régime 7, ni pour un dépôt sans la clé `relecture` » : `etat` (`A-132`) et le
refus de `demarrer` (`A-69`) changent dans les deux régimes, comme voulu. **Retouche.** La ligne le dit ; une ligne sous la
7.39.0 décrit les retouches. Version inchangée.

## Questions à l'architecte

1. **La sortie 69 des calculs** (`double-relecture.mjs`, `meme-contenu.sh` : git plus ancien que 2.41, `jq` absent).
   Aujourd'hui « illisible » des deux côtés, comme le Relecteur : la PR est sautée en 7 à chaque passage. Un capitaine à
   un git ancien sauterait ainsi, sans bruit, toute PR dont un tour porte sur un sommet plus ancien. **Recommandation :**
   chez le capitaine, 3 (panne, la boucle s'arrête et le dit), comme un calcul absent (constat 4) ; non porté au patch,
   parce qu'il touche « les mêmes faits que le Relecteur ».
2. **Les PR de fourche.** Ni `main` ni la PR ne regardent `head.repo` ; le Relecteur dit une fourche illisible. Aucune
   fourche n'obtient de verdict (seuls OWNER, MEMBER, COLLABORATOR comptent) : pas de fusion. Mais une fourche dont la
   branche porte le nom d'une branche d'origin fait juger, mettre à jour et pousser la branche d'origin (sur `main`
   déjà), puis tourne en pause (« sommet changé », 5). **Recommandation :** un ticket de suite : `passer.sh` et
   `sujet.sh fusionner` sautent (7) une PR de fourche, comme le Relecteur.

## Le patch des retouches

`retouches-tour-1.patch`, sur `9db4fb3`, par `git apply` (vérifié sur un arbre neuf : arbre `0072374e152d…`, égal à
celui de la branche locale des retouches). 20 fichiers : `github.sh`, `passer.sh`, `renvoyer.sh`, `revue-exigee.mjs`,
`sujet.sh`, `faux-gh.mjs`, `chemins-sensibles.mjs`, `regles.mjs`, `garde-fichiers.mjs`, `tickets.mjs`, neuf bancs
(`verdict-du-capitaine` +5 tests, `sensibles-du-capitaine` +2, `messages-du-regime` +2, `garde-fichiers` +1,
`faux-gh` +1 ; `revue-exigee`, `tickets-gate`, `tickets` et `sujet.test` complétés ou récrits), `NOTES-DE-VERSION.md`
(une ligne corrigée et une ligne sous la 7.39.0). `plugin.json` inchangé (7.39.0).

- **Rouges avant** (`essais/retouches-rouges-avant.txt`, les bancs retouchés posés seuls sur `9db4fb3`) : **15** —
  `verdict-du-capitaine` 2 (calcul absent, push pendant la lecture), `messages-du-regime` 5, `garde-fichiers` 1,
  `sensibles-du-capitaine` 3, `tickets-gate` 1, `faux-gh` 1, `sujet.test` 1. Les tests neufs verts au sommet (six,
  et une assertion de `tickets.test.mjs`) gardent du code juste : les mutations X1, X2, X6, X7, X8, X12 et X15, vertes
  au sommet et rouges après, les prouvent.
- **Verts après** (`essais/retouches-verts-apres.txt`) : les 13 bancs du lot, **369 sur 369** (358 + 11).
- **Mutations** : `mutations/apres-retouches.txt`, toutes rouges (19). Les 80 de l'annexe trouvent leur texte sur les
  retouches sauf A32, C6, C16, C19, que `mutations-contre.mjs` récrit (Aʹ32, Cʹ6, Cʹ16, Cʹ19, rouges) ; à reporter dans
  `mutations.mjs` si le patch entre. Les 34 de l'annexe qui visent un fichier ou un banc retouché, rejouées sur les
  retouches : **toutes rouges (34)** (`mutations/annexe-sur-retouches.txt`).
- **Suite entière** : 1 359 sur 1 359, aucun sauté (`essais/suite-retouches.txt`).

## Ce qui n'a pas été établi

- Les gestes réels (GitHub, pagination réelle, session cloud) : comme les tickets le disent, partie 6c.
- La fenêtre entre le second contrôle et le `PUT` (ticket 71, « non établi » 2) : inchangée.
- Les 80 mutations de l'annexe n'ont pas été rejouées toutes sur les retouches : l'échantillon de 20 sur le sommet, les
  34 qui visent un fichier ou un banc retouché, et mes 19, sur les retouches.

## Temps

De 02 h 22 à 03 h 47 UTC (1 h 25), dont la suite entière deux fois en tâche de fond (875 s, puis 983 s après 18 min
d'attente d'une charge sous 3), l'espion du régime 7 deux fois (le premier jet tournait en rond sur un banc qui pose
son propre `git` : corrigé, rejoué entier, 23 min), l'échantillon de 20 (14 min) et les mutations (8 + 9 min).

## Second tour, au sommet `450903a` (delta `9db4fb3..450903a`)

Sommet `450903a4c6f830166a7e81df1c4dfd60f4c3572a`, parent direct `9db4fb3`, un commit. Mêmes règles : lecture seule
vis-à-vis de GitHub, clone privé, la suite entière non rejouée (consigne). Essais et mutations neufs dans `second-tour/`.

### Conclusion du second tour

**Verdict proposé : non conforme au sommet `450903a4c6f830166a7e81df1c4dfd60f4c3572a`**, pour un seul écart, le
constat 14, **à corriger** : il était déjà dans `9db4fb3` (ticket 72), le premier tour ne l'avait pas vu. Conforme avec
`second-tour/retouches-tour-2.patch` (sur `450903a`, version inchangée). Les constats 1 à 13 sont fermés. Le régime 7
reste celui de `main`, à l'appel près, après les retouches. Les contrôles GitHub du sommet sont verts.

| # | Gravité | Constat neuf, en une ligne |
| --- | --- | --- |
| 14 | à corriger | une copie de ticket qu'un sujet n'a pas écrite, seulement héritée de develop, fait foi pour la garde du capitaine et le hook : l'accord écrit sur develop (ticket sans sujet) ou sur le sujet du ticket est ignoré, la PR renvoyée, l'écriture refusée |
| 15 | mineur | aucun banc ne tient que le saut d'une PR poussée pendant sa lecture (constat 7) ne joue qu'en régime 8 (Y1 verte) |
| 16 | mineur | aucun banc ne tient que le refus du hook ne nomme que les copies en retard qui portent le ticket (Y3 verte) |
| 17 | mineur | le faux GitHub paginé, sans commentaire : sa page vide n'est tenue par aucun banc (Y4 verte) |
| 18 | mineur | « Aucune ligne lue » : le geste qui relit une copie en retard n'est tenu par aucun banc (Y5 verte) |

Les mineurs 15 à 18 sont des bancs manquants sur les retouches du premier tour, le code est juste ; leurs bancs sont dans
le patch du tour 2 (s'il n'entre pas, ils vont à un ticket de suite). `A-192` : la sortie 69 et les PR de fourche (Q1,
Q2) vont à des tickets de suite.

**Comptes** : arbre égal (une commande) ; espion du régime 7 sur 19 bancs de `main`, `main` contre `450903a` : 554
lancers, 7 961 appels `gh`, 6 502 appels `git` réseau identiques, une ligne d'écart, voulue ; mes 19 mutations du premier
tour : toutes rouges sur `450903a` ; 5 neuves sur le delta : 1 rouge, 4 vertes (constats 15 à 18), toutes rouges avec le
patch du tour 2 ; contrôles GitHub : 4 sur 4 verts ; patch du tour 2 : 2 rouges avant, 374 sur 374 après sur les 13
bancs du lot, `poses.test.mjs` et `depot.test.mjs` verts, ses 3 mutations Z1 à Z3 rouges, et avec lui 8 + 19 + 27
mutations rouges.

### 1. L'arbre

`second-tour/essais/egalite.sh` (une commande : le patch du premier tour appliqué dans un index jetable posé sur
`9db4fb3`) : arbre `0072374e152d…`, celui de `450903a` (`second-tour/essais/egalite.txt`).

### 2. Les constats 1 à 13

Tous fermés, chacun par son banc (rouge sur `9db4fb3`, vert sur `450903a`) et par sa mutation (verte ou absente sur
`9db4fb3`, rouge sur `450903a`) : `second-tour/mutations/mutations-450903a.txt`, mes 19 mutations **toutes rouges** sur
`450903a`. Relus en relecteur neuf : les textes de `renvoyer.sh`, `demarrer` et des motifs de la garde donnent chacun un
geste entier ; la demande de relecture, remplie comme dite, est lue par `lireMarques` ; le gate combine la criticité
comme `hautes` ; la note dit ce qui change.

### 3. Le régime 7 après les retouches

- **L'espion**, rejoué sur les 19 bancs de `main`, `main` contre `450903a` (`second-tour/essais/espion-comparaison-450903a.txt`,
  comptes dans `second-tour/essais/espion/`) : 554 scripts lancés, 7 961 appels `gh`, 6 502 appels `git` au réseau,
  identiques ligne pour ligne, sauf la dernière ligne du refus de `demarrer` (`sujet.test.mjs`, test 7 de `main`) : le
  texte d'`A-69`, retouché (constat 12), voulu ; mêmes appels, même code (4). L'heure du jour qu'écrit `boucle.sh` est
  remplacée par un jeton avant la comparaison (`espion-comparer.sh`) : les deux côtés n'ont pas tourné à la même heure.
- **Ce que les retouches ajoutent au régime 7**, lu dans le code : `DEMANDE_DE_RELECTURE`, une variable posée au
  chargement de `github.sh` (aucun appel) ; `cle_relecture_sur origin/develop` sur les deux chemins de `demarrer` vers
  develop (un `git show` local) ; rien d'autre (le saut du constat 7, la base d'une pile, le `--prune`, la panne d'un
  calcul, la copie en retard, la criticité ne jouent qu'en régime 8).
- **Le hook et le gate** (`regime7-hook-gate.mjs`) : identiques sur `450903a` et avec le patch du tour 2
  (`second-tour/essais/regime7-hook-gate-tour2.txt`).

### 4. Les mutations neuves sur le delta

`second-tour/mutations/mutations-t2.mjs` : Y1 à Y5 sur les retouches du premier tour, Z1 à Z3 sur le patch du tour 2.
Sur `450903a` (`mutations-450903a.txt`) : Y2 rouge ; **Y1, Y3, Y4, Y5 vertes** (constats 15 à 18). Avec le patch du
tour 2 (`mutations-tour2.txt`) : **toutes rouges (8)**, et mes 19 du premier tour, toutes rouges.

### 5. Les contrôles GitHub au sommet

Lus le 2026-11-22 (`second-tour/essais/controles-github-450903a.txt`) : `bancs`, `CodeQL`, `Analyze (actions)`,
`Analyze (javascript-typescript)` : terminés, succès ; la PR ouverte, hors brouillon, `mergeable_state` « clean », sans
étiquette.

### Constat 14 — à corriger — une copie héritée de develop fait foi (ticket 72, décisions 2 et 4, `A-74`, `A-185` point 3)

**Fait.** La garde du capitaine (`copiesSur`) et le hook (`copiesSous`) prennent pour copie du ticket tout fichier du
ticket sur un `origin/sujet/*`. Or un sujet ouvert depuis develop, ou rafraîchi avec lui (la boucle y reporte develop à
chaque lancement, `A-69`, `A-132`), porte tous les tickets de develop, qu'il n'a pas écrits. Ces copies héritées font foi
devant celle de develop et, « chaque copie doit couvrir », bloquent l'accord : (1) un ticket sans sujet dont l'accord
entre dans develop, alors qu'un autre sujet est parti avant, est lu sur ce sujet (`A-74` dit : « sur origin/develop pour
un ticket sans sujet ») ; (2) un ticket de sujet entré dans develop (livraison intermédiaire) et reçu par un autre
sujet : l'accord écrit sur son sujet (`A-75`) ne suffit plus. Le cas est ordinaire dès qu'il y a plus d'un sujet.
**Preuve.** `second-tour/essais/copie-heritee-450903a.txt` : les deux cas, sortie 20 (renvoi) ; avec le patch,
`copie-heritee-tour2.txt` : 0. **Retouche** (`retouches-tour-2.patch`, garde et hook, même règle) : une copie de sujet ne
compte que si le sujet l'a écrite, c'est-à-dire si elle diffère de celle de sa base de fusion avec develop ; héritée,
c'est la copie de develop qui fait foi. Une copie écrite par un autre sujet compte toujours (« chaque copie »). Bancs :
`sensibles-du-capitaine.test.mjs` (les deux cas, et la copie écrite qui compte encore), `garde-fichiers.test.mjs` (le
hook) ; le test 5 de la garde a son ticket sans accord sur develop, pour que ses deux copies de sujet soient écrites
(sinon B25 deviendrait équivalente). Mutations Z1 à Z3.

**Question à l'architecte** (la règle, que la spec ne dit pas) : « présent sur un sujet » lu comme « écrit par lui depuis
sa base de fusion avec develop ». **Recommandation : la garder** ; l'autre lecture (seul le sujet que déclare le ticket,
par sa ligne `Sujet:`) demanderait au hook de lire la carte, hors de `scripts/agent/`.

### Le patch du tour 2

`second-tour/retouches-tour-2.patch` sur `450903a` (sha256 `3302725c14cbf8f7d0ef495c072ce6e9f1056f12287443f1c80d7f9b8d521705`,
7 fichiers, +137 −8 ; arbre `310fba1ec1eb…`, vérifié par un index jetable) : `chemins-sensibles.mjs`,
`garde-fichiers.mjs`, quatre bancs, une ligne de la note sous la 7.39.0. Version inchangée (7.39.0).

- **Rouges avant** (`second-tour/essais/tour2-rouges-avant.txt`, les bancs posés seuls sur `450903a`) : 2 (les copies
  héritées, garde et hook) ; les quatre bancs des constats 15 à 18 y sont verts : ils gardent du code juste, Y1, Y3, Y4,
  Y5 le prouvent.
- **Verts après** (`second-tour/essais/tour2-verts-apres.txt`) : les 13 bancs du lot, **374 sur 374** (369 + 5) ;
  `scripts/poses.test.mjs` (les bancs posés à plat) et `scripts/depot.test.mjs` (69) verts.
- **Mutations** (`second-tour/mutations/mutations-tour2.txt`) : Y1 à Y5 et Z1 à Z3, toutes rouges (8) ; mes 19 du
  premier tour, toutes rouges (19) ; la série B de l'annexe (les gardes, 27), toutes rouges.
- **Non rejoué** : la suite entière (consigne du tour). Le patch ne touche que la garde du capitaine, le hook et des
  bancs ; les bancs qui les jouent, et ceux qui posent les scripts à plat, sont ci-dessus.

### Temps du second tour

De 04 h 00 à 04 h 48 UTC (48 min), dont l'espion (18 min) et les mutations (8 + 22 min) en tâche de fond.
