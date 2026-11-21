# Les gardes des fichiers sensibles : le hook d'édition et le capitaine lisent la ligne `Sensibles:` du ticket (lot 5b)

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — le code entier est dans le patch commun aux tickets 71, 72 et 73 ([`71-73-annexes/lot-5.patch`](71-73-annexes/lot-5.patch), écrit sur `25a72c7`, posé selon le § 2 du ticket 71), décrit ci-dessous ; les bancs neufs ou changés sont rouges avant le code, verts après, et les mutations de la série B de [`71-73-annexes/mutations.mjs`](71-73-annexes/mutations.mjs) sont toutes rouges. Rien à concevoir.
Blocked by: 71
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs` et `regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.test.mjs` (neuf), `skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs` et `chemins-sensibles.test.mjs`, `skills/chaine/fusionner/scripts/passer.sh`, `skills/chaine/fusionner/scripts/github.sh`, `skills/chaine/sujet/scripts/sujet.sh`, `skills/chaine/fusionner/scripts/sensibles-du-capitaine.test.mjs` (neuf), `scripts/points-d-entree.test.mjs`. Même PR que les tickets 71 et 73.

## Le besoin

Ce ticket réalise la partie **5b** de la spec `relecture-independante.spec.md` (section « Les lots », point 5) : en régime 8, **un chemin sensible ne se modifie qu'avec l'accord du produit, noté sur le ticket avant d'y toucher** (`P-47`, `P-48`). Il porte `A-73` (un chemin sensible ne se modifie que sur la branche d'un ticket), `A-74` (la ligne `Sensibles:`, lue sur `origin/sujet/*`, sur `origin/develop` pour un ticket sans sujet ; la PR de mise à jour d'un sujet), `A-76` (trois gardes mécaniques : le hook d'édition, `sujet.sh fusionner`, `passer.sh`), `A-105` (les gardes se placent au premier contrôle, sur le diff que la relecture lit) et `A-97` (le hook lit la clé `relecture` dans l'arbre de travail). La forme de la ligne est celle du ticket 55 (`ecartsSensibles` du gate `tickets`, qui la juge).

Ce qui est acquis : le gate juge la forme de `Sensibles:` (ticket 55) ; les chemins sensibles du contrat de la base (`lireBase`, `cheminSensible` de `revue-exigee.mjs`) ; le ticket de la PR (`ticketsDeLaPr` de `double-relecture.mjs`, la définition du capitaine, `A-113`) ; le régime lu par le ticket 71.

## Où

Patch écrit sur `origin/main` à `25a72c7`, posé sur le `main` qui aura reçu les PR A et B (ticket 71, § 2), après le ticket 71 dans la même PR.

| Fichier | Ce qui change |
| --- | --- |
| `…/agent/regles.mjs` | `refusEdition` reçoit `regime8`, `sensibles`, `accordes` ; neuves `refusSensible`, `lireSensibles`, un moteur de motifs (copie de `regexDuMotif` du gate) (décisions 1 à 3) |
| `…/agent/garde-fichiers.mjs` | `accordes()` : la ligne lue sur le sujet (décision 2) |
| `…/agent/garde-fichiers.test.mjs` | **neuf**, 4 tests, sur un dépôt jouet |
| `…/agent/regles.test.mjs` | 2 tests neufs |
| `skills/chaine/revue-adversariale/scripts/chemins-sensibles.mjs` | en-tête ; `lireSensibles`, `couvert` exportées ; `--garde` (décision 4) ; la CLI d'aujourd'hui sous `estPointEntree()`, pour que le module s'importe |
| `…/revue-adversariale/scripts/chemins-sensibles.test.mjs` | 1 test neuf : la parité avec le hook et avec le gate |
| `skills/chaine/fusionner/scripts/github.sh` | neuve : `garde_des_sensibles` (décision 5) |
| `skills/chaine/fusionner/scripts/passer.sh` | la garde, après le premier contrôle du verdict (décision 5) |
| `skills/chaine/sujet/scripts/sujet.sh` | la garde, après le premier contrôle ; pour une PR de mise à jour, les fichiers en conflit et les tickets du sujet (décision 6) |
| `skills/chaine/fusionner/scripts/sensibles-du-capitaine.test.mjs` | **neuf**, 6 tests |
| `scripts/points-d-entree.test.mjs` | `chemins-sensibles.mjs` dans la liste (ses six accès : il reconnaît maintenant son point d'entrée) |

## Décisions

1. **Le hook d'édition, en régime 8 seulement** (`A-76`, `A-97`) : `refusEdition` lit le régime dans le contrat de l'arbre de travail (`Object.hasOwn(CHAINE, 'relecture')`, quelle que soit la forme de la clé : du côté sûr). Un chemin qui touche `cheminsSensibles` (le même contrat ; une liste mal formée rend tout chemin sensible) ne s'écrit que si la ligne `Sensibles:` du ticket de la branche le couvre, **dans chaque copie** du ticket ; sinon refus (sortie 2) avec la raison : s'arrêter, écrire au conducteur le chemin, pourquoi, ce qui y change ; il obtient l'accord et ajoute le chemin au ticket par une PR de documentation vers le sujet (`A-75`). Comparaison sans casse ni forme NFD, comme `revue-exigee.mjs`. Un chemin ordinaire ne fait lire aucun ticket (aucun réseau). Hors régime 8, rien ne change.
2. **Où se lit la ligne, pour le hook** (`A-74`) : `accordes()` dans `garde-fichiers.mjs`, sur le modèle de `dependancesPrevues` de `garde-commandes.mjs` : le ticket de la branche (`identifiantDeBranche`), ses copies sur les `refs/remotes/origin/sujet/*` que `git ls-remote` confirme (une ref déplacée à la main ne compte pas), et, si aucun sujet ne le porte, sur `origin/develop` (confirmé de même) ; jamais l'arbre de travail ni la branche de la session. Pas de ticket, pas de copie, origin injoignable, grammaire absente : `null`, donc refus (« Aucune ligne lue … ») ; une ligne illisible : refus, la cause dite. Le code reste dans le hook, comme ses voisins (« la garde ne s'ouvre jamais »).
3. **`lireSensibles`, la lecture des chemins accordés, en deux copies** (`regles.mjs` pour le hook, `chemins-sensibles.mjs` pour le capitaine : les modules du hook ne chargent rien hors de `scripts/agent/`). En-tête seul (avant la première `## `), aux formes du gate (`X:`, `**X:**`, `- X:`, `* X:`, sans casse) ; `—` ou pas de ligne : rien d'accordé ; sinon des chemins ou des motifs, virgules, accents graves facultatifs, puis ` — accord de <nom>, <AAAA-MM-JJ>` ; un commentaire ` # …` peut suivre. Illisible : deux lignes, un accord absent ou sans date, un chemin à blanc, absolu, à `~`, à `\` ou à `..`. La forme entière (le nom) reste au gate ; une garde n'accorde jamais un chemin que le gate refuse : le banc de `chemins-sensibles.mjs` tient la parité des deux copies et celle avec `ecartsSensibles`.
4. **La garde du capitaine : `chemins-sensibles.mjs --garde --base <B> --titre <t> --branche <tête> [--conflits <fichier>] [--tickets <id>,…]`**, le diff propre sur l'entrée standard. Chemins sensibles : `cheminSensible` sur `lireBase(origin/<B>)`, jamais l'arbre de travail ; contrat illisible : 21. Aucun : 0. La grammaire des identifiants d'abord : absente, 21 (sans elle, `ticketsDeLaPr` rendrait `[]` et la PR serait dite « sans ticket » à tort). Ticket : `ticketsDeLaPr(titre, branche)` ; aucun : 20, « PR sans ticket qui touche un chemin sensible » (`A-73`, `A-76`). Copies : les `origin/sujet/*` qui portent le ticket, sinon `origin/develop` ; un ticket introuvable : 20 ; une ligne illisible : 20 (elle se corrige sur le sujet). Un chemin est couvert quand chaque copie d'un ticket le couvre, quel que soit l'ordre des sujets ; avec deux tickets, l'un suffit. Non couvert : 20, le motif nomme les chemins et dit qui demande l'accord (`A-75`). Sorties accordées à celles des calculs (`A-113`) : 0, 20, 21, 2.
5. **`passer.sh`** (`A-76`, `A-105`) : juste après le premier contrôle du verdict (ticket 71), en régime 8, sur le même diff (`depart..origine`) : `garde_des_sensibles develop "$titre" "$tete"` (`github.sh` ; le script à côté dans un projet, dans le skill `revue-adversariale` du plugin). 20 → sortie 4 (renvoi) ; 21 → 7 ; autre → 3. Une livraison de sujet n'y repasse pas (`A-76`) : le bloc est sous le régime, que la dispense des livraisons laisse à 7.
6. **`sujet.sh fusionner`** : au même endroit, en régime 8, sur la liste que le verdict a lue. Une **PR de mise à jour** (`maj/<nom>`, `A-74`) passe `--conflits` (les fichiers en conflit de sa fusion, `MAJ_CONFLITS` de `verifier_mise_a_jour`) et `--tickets` (les tickets et specs que déclare le sujet, lus par `carte`) : un chemin sensible hors des conflits, une retouche comprise, est renvoyé ; en conflit, il doit être couvert par la ligne d'un ticket du sujet (une spec citée vaut tous ses tickets : un sujet que déclare la spec, et non le ticket, compte). 20 → 4 ; 21 → 7 ; autre → 11 (côté capitaine).

### Remèdes écartés

- **Un module commun au hook et au capitaine** pour `lireSensibles` : les gardes ne chargent que `scripts/agent/` (ticket 18 de l'autre programme), et `chemins-sensibles.mjs` est posé dans `scripts/chaine/`. Deux copies, et un banc de parité, comme `regexDuMotif` aujourd'hui.
- **Lire la ligne dans l'arbre de travail**, plus simple : la session qui code écrirait elle-même son accord (`A-74` l'interdit).

## Questions à l'architecte

1. **Une copie du ticket sur develop et une autre sur un sujet.** Écrit : les copies des sujets font foi quand il y en a, develop sinon (`A-74` : « pour un ticket sans sujet, sur `origin/develop` ») ; plusieurs sujets : chaque copie doit couvrir. **Recommandation : garder** (un ticket ne vit que sur son sujet jusqu'à la livraison). **Tranché : ainsi** (`A-185`, point 3).
2. **Le nom et la date de l'accord ne sont pas jugés par les gardes** (seulement « un nom, puis une date »), le gate les juge en CI. **Recommandation : garder** ; une garde qui recopierait toutes les règles du nom divergerait du gate au premier changement. **Tranché : ainsi** (`A-185`, point 4).

## À faire, dans l'ordre

Comme le ticket 71, § 0 à § 3 : une seule PR, un seul patch, la version commune.

## Surfaces

| Surface | Prouvée par |
| --- | --- |
| Hook, régime 8 : couvert → écrit ; non couvert → refusé ; ordinaire → écrit | `garde-fichiers.test.mjs`, test 1 |
| Hook, régime 7 : rien ne change | test 2 |
| Hook : la copie du sujet fait foi, jamais l'arbre ; develop pour un ticket sans sujet ; sans ticket, refus | test 3 |
| Hook : copie locale non confirmée ignorée ; ligne illisible dite | test 4 |
| `refusEdition` : chaque copie, sans casse, copies vides, `null`, illisible, liste mal formée | `regles.test.mjs`, « lot 5b, refusEdition » |
| `lireSensibles` : formes lues et refusées ; parité hook, capitaine, gate | `regles.test.mjs`, « lot 5b, lireSensibles » ; `chemins-sensibles.test.mjs`, « lot 5b » |
| Capitaine vers develop : couvert entre, non couvert renvoyé avant toute CI | `sensibles-du-capitaine.test.mjs`, test 1 |
| PR sans ticket ; sans chemin sensible, aucun ticket demandé | test 2 |
| Sous-PR : la ligne lue sur le sujet, jamais sur la branche | test 3 |
| PR de mise à jour : en conflit et couvert ; non couvert ; retouche hors conflit ; couvert par le ticket d'une spec que le sujet déclare | test 4 |
| `--garde` : chaque copie, la large sur le premier sujet et l'étroite sur le second ; deux tickets, introuvable, illisible, usage | test 5 |
| `--garde` sans la grammaire : illisible (21), jamais « PR sans ticket » | test 6 |
| Le point d'entrée de `chemins-sensibles.mjs` | `points-d-entree.test.mjs`, six accès |

## Vérification

Voir le ticket 73, § « Vérification » (les comptes du patch entier) ; la série B des mutations.

1. **Rouge avant le code** (même montage que le ticket 71) : **18 rouges pour ce ticket**, sur les deux chemins — `sensibles-du-capitaine.test.mjs` 6 sur 6, `garde-fichiers.test.mjs` 3 sur 4 (le cas « régime 7 » passe déjà), `regles.test.mjs` 2 sur 87, `chemins-sensibles.test.mjs` 1 sur 13, `points-d-entree.test.mjs` 6 sur 66 (les six accès de `chemins-sensibles.mjs --garde`).
2. **Vert après** : les mêmes, tous verts ; la suite entière (ticket 73).
3. **Mutations** : `node "$S/mutations.mjs" B` : « toutes rouges » (série B, 27 mutations).

## Ce qui n'a pas été établi

1. **Une écriture faite par une commande** (`sed -i`, `cp`, un script) n'est pas vue par le hook (`A-76` le dit) : les gardes du capitaine la rattrapent sur le diff.
2. **Toutes les sessions écrivent sous le compte du produit** : une ligne `Sensibles:` peut être écrite par n'importe quelle session sur un sujet par une PR de documentation, relue (limite de la spec, « Ce que cette spec ne ferme pas »).
3. **Le hook interroge le réseau** (`git ls-remote`) à chaque écriture d'un chemin sensible : délai de 10 secondes au plus, non mesuré sur une session cloud.
4. **La CLI d'aujourd'hui de `chemins-sensibles.mjs` passe sous `estPointEntree()`** (pour que le module s'importe) : lancé d'une façon que la fonction ne reconnaît pas, il sortirait en 0 sans rien écrire, ce que `gestes.sh` (skill `relecture`) lirait « rien de sensible ». Les six accès de `points-d-entree.test.mjs` (direct, lien, `--preserve-symlinks-main` deux fois, espace, accent) le reconnaissent ; aucune autre façon n'est employée par la chaîne. Pas de retouche : une garde de plus dans ce fichier toucherait la CLI du régime 7.

## Hors périmètre

- La demande d'accord dans la carte (`A-75`, tableau `## Fichiers sensibles`) et les textes du conducteur : lot 6.
- `chaine-de-production.md` § 3 et `chantier/SKILL.md` (« dans la même PR de cadrage » remplacé, `A-73`) : lot 6a/6b.

## Comments

- 2026-11-21 — Écrit par un agent rédacteur sur la spec (lot 5, partie b ; `A-73`, `A-74`, `A-76`, `A-97`, `A-105`) et sur `origin/main` à `25a72c7`, après le ticket 71 dans la même PR. Code, bancs et mutations joués sur un clone neuf. Points remontés : les deux « Questions à l'architecte ».
- 2026-11-21 — Retouché après le tour de relecture du ticket (`A-186`), par le relecteur : la grammaire lue avant le ticket (décision 4, test 6, mutation B27) ; le banc de `--garde` tient « chaque copie » quel que soit l'ordre des sujets (test 5, mutation B25) et la spec citée par le sujet (test 4, mutation B26) ; la limite de `estPointEntree()` écrite.
