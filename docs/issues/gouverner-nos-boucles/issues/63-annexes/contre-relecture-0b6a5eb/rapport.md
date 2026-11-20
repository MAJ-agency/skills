# Contre-relecture de la PR 143 (MAJ-agency/skills)

## Premier tour

Verdict : **conforme après retouches** — 0 bloquant, 11 mineurs (voir « Constats »). Bancs : relecture 36/36, `depot.test.mjs` 66/66. Mutations : 34 jouées (16 de la session, toutes rouges ; 18 miennes, 5 rouges), 13 vertes : 7 trous du banc, 6 équivalentes.

Sommet relu : `0b6a5ebb7c3cf5f21fa550bfb5c1afe16a03ad85` (vérifié par `git ls-remote https://github.com/MAJ-agency/skills refs/pull/143/head`). Base : `main` à `e64f93b`. Clone neuf sous `depot/`, PR en `pr143`. Node 22.23.5, git 2.43.0, 4 cœurs. Ticket 63 et annexes extraits de `origin/claude/compassionate-euler-st84s9` sous `ticket/`.

### Bancs

- `node --test --test-reporter=spec scripts/relecture.test.mjs` au sommet : 36 tests, 36 réussis, statut 0, 39,7 s (charge 1,71 avant, 1,51 après). Sortie : `essais/banc-relecture-pr.txt`.
- `node --test --test-reporter=spec scripts/depot.test.mjs` au sommet : 66 tests, 66 réussis, statut 0, 0,26 s (charge 1,39). Sortie : `essais/banc-depot-pr.txt`.

### Fidélité (au fil de l'eau)

- Les trois tests donnés entiers par le ticket (décision 7, décision 8 bis, deux tests) sont dans le banc, octet pour octet (`essais/bloc-2.js` à `bloc-4.js`, extraits du ticket, cherchés par `includes` dans `scripts/relecture.test.mjs` : « présent tel quel » trois fois).
- La panne `FAUX_GIT_NUMSTAT_FUSION` est la ligne du ticket, telle quelle ; `miseAJour` porte la forme de la décision 6 bis.

### Essais du ticket, rejoués (sommet et `main`)

`PLUGIN=<worktree> ESSAIS=<dossier> bash annexes/essais/<essai>.sh`, sorties sous `essais/<essai>-pr.txt` et `-main.txt` (charge 0,90 à 0,86, 15 s pour les douze).

- `e19` : au sommet, `lot resolution-1 : 1 fichiers, 3016 lignes`, `lot resolution-2 : 1 fichiers, 11 lignes`, `lots de la résolution : 2`, plus de ligne `{{DIFF}} de la résolution` ; `PIEGE : 0`. Sur `main` : la résolution entière.
- `e21` : `1 : gardé` des deux côtés (le correctif ne touche pas `meme_retrait`).
- `e22` : `neuf` identique des deux côtés ; `ours` au sommet : « binaires : 1, dont illisibles : 1 », « binaires sous un chemin sensible : 1 », `lus 1 resolution` en 0 sans rien de lu ; sur `main` : « binaires : 0 », `lus : sortie 1` ; `ajout` : `liste` en 4 des deux côtés.
- `e4b` : `binaires.txt` vide, `lus 1` sans `regle.ts` en 1, des deux côtés (B1 d'`A-168` tenu).

### Essais de la contre-relecture (au sommet)

Bibliothèque `essais/outils/maj.sh` (sur `jouet.sh` du ticket : une PR de mise à jour dont l'essai écrit chaque phase). Sorties brutes à côté de chaque script. Charge entre 0,04 et 0,27, chaque essai sous 5 s.

- `a1-gros-seul.sh` (une résolution d'un seul fichier de 5 000 lignes) : `ours` (5 016 lignes de résolution, diff relu vide) et `neuve` (diff relu 10 005 lignes, résolution 15 009) : aucun lot de la résolution, la ligne `{{DIFF}} de la résolution` d'avant, `lots/` absent, `lus 1 resolution` en 0, `lus 1 resolution-1` en 12 (« lot inconnu »). Tient.
- `a2-double-decoupe.sh` (diff relu en 2 lots et résolution en 3 lots, quatre zones) : `lots/` porte `lot-1 lot-2 resolution-1 resolution-2 resolution-3`, aucun `travail-*` ; les `relus.txt` des lots font `relus.txt` et `resolution.txt`, leurs `diff.patch` bout à bout font `diff.patch` et `resolution.patch` (quatre `cmp`, vrais) ; `lus` sur chacun des cinq lots : 0 avec ses fichiers, 1 sans ; `lus 2 resolution-2` en 12 ; après `c1`, un `relus.txt` de lot récrit, un `lots/resolution-4/` ajouté, un `binaires.txt` de lot retiré : `garde` en 14 chaque fois, en 0 une fois remis. Tient.
- `a3-noms-hostiles.sh` (tabulation, guillemet, `$(touch PIEGE)`, retour à la ligne, `x b/y.ts`, barre oblique inverse, `-tiret.ts`, 3 lots de la résolution) : chaque nom dans un lot et un seul, sous sa forme citée ; `lus 1 resolution-<j>` en 0 avec les noms cités, en 1 avec les noms décités ; `PIEGE : 0` ; l'empreinte porte 12 fichiers de `lots/resolution-*`. Tient.
- `a4-binaires-resolution.sh` (six fichiers de la seule résolution ; variantes `petit` et `lots`) : un binaire hors chemin sensible (`x.bin`), une image sous le chemin sensible (`logo.png` : binaire, pas illisible, sensible), un texte que le sujet rend binaire (`t2b.ts`), un texte que develop rend binaire et que la résolution laisse au sujet (`b2t.ts`), un nom cité sous le chemin sensible (`"…clé \"q\"\tx.bin"`) : tous dans `binaires.txt` (6), illisibles 5, « binaires sous un chemin sensible : 3 » ; `lus 1 resolution` (ou chaque `resolution-<j>`) en 0 sans rien de lu, sauf le lot de texte (`gros.ts`) en 1. Tient, selon la décision 8 bis (« le second [parent voit] ce qu'elle jette de develop ») : `b2t.ts`, texte du sujet gardé tel quel, est compté binaire illisible, donc `incomplet` ; c'est le sens prudent.
- `a6-diff-seul-resolution-lots.sh` (diff relu d'un seul gros fichier, résolution en 2 lots, un conflit modify/delete) : « un seul fichier … le diff relu entier », puis les deux lots de la résolution ; `lots/` ne porte que `resolution-1 resolution-2`. Tient.

### Fidélité, lue

- Décisions 1 à 5 : codées telles quelles (`gestes.sh:309-311`, `:319`, `:340-347`, `:355-412`, `:597-600`) ; rien de plus, `meme_retrait` non touché (`git diff main...pr143 -- gestes.sh` ne touche pas `meme_retrait`, `:631-671`).
- Décision 2, B3 d'`A-168` : `rmdir -- "$B/lots" 2> /dev/null || true` après `rm -rf -- "$W"` (`gestes.sh:388-389`) ; le test de `main:1257` est à `:1258`, inchangé (seul décalage : une ligne de commentaire du faux git).
- Décision 8 bis, B1 : `comm -23 - "$B/attendus.txt"` présent (`gestes.sh:345`), la panne `FAUX_GIT_NUMSTAT_FUSION` telle que donnée (`relecture.test.mjs:692`).
- Décision 6 : `SKILL.md:69` et `:108` (phrase exigée par `:1970` gardée entière), `cas-limites.md:60` et `:82`, `gestes.md:39` et `:42` ; **`gestes.md:68` (`lus`) et `:40` (`binaires.txt`) ne sont pas touchés**, alors que la décision 6 et le « Où » du défaut 4 les nomment (voir constats).
- Version : `plugin.json` 7.36.0 → 7.36.1, `main` toujours à `e64f93b` (`git ls-remote origin refs/heads/main`) ; `NOTES-DE-VERSION.md` : note 7.36.1 en tête, aucune ligne ôtée (`git diff main...pr143 -- NOTES-DE-VERSION.md | grep -c '^-[^-]'` : 0), `grep -c remerge` : 1. `README.md` non touché, comme le ticket le veut.
- Numéros de PR jouets : 72 à 76 libres sur `main`, pris une fois chacun.
- Rien de privé : `git diff main...pr143 | grep -nE '^\+' | grep -niE '/home|/tmp/|/root|Users/|<nom de l'auteur>|@…|session_0|claude\.ai'` ne rend rien (statut 1).

### Rouge avant, vérifié

Le banc de la PR joué sur le `gestes.sh` de `main` (worktree `plugin-mut3`, `git checkout main -- gestes.sh`, restauré après) : 36 tests, 33 réussis, 3 échecs (`:1953` défaut 1, `:2027` et `:2046` défaut 4), statut 1 ; `:1987` et `:2005` verts avant, comme la table du ticket le dit. Sortie : `essais/banc-pr-sur-gestes-main.txt` (charge 2,94).

### Mutations

Outillage : `essais/mutations/definir.py` (les 34 mutations, remplacements exacts, chacun compté), `appliquer.py`, `jouer.sh` (une seule à la fois, le banc relecture entier, `git checkout -- .` après). Trois worktrees en parallèle ; chaque banc 37 à 41 s, charge 0,01 à 4,20. Le diff de chaque mutation et la sortie brute du banc : `essais/mutations/<id>.diff` et `<id>.out` ; table : `essais/mutations/tableau.md`.

**Celles de la session (corps de la PR)** : le corps annonce « 15 mutations » et en nomme 16. Les 16, rejouées : toutes rouges, 36 tests, 1 échec chacune (`S14-hors-lots` : 1 échec et non 3, ma forme garde `lus` cohérent avec le dossier déplacé).

**Les miennes (18, sur le code neuf)** : 5 rouges (`O04` illisibles non recalculés, `O07` ligne `{{DIFF}}` toujours écrite, `O10` lots nommés « lot <j> », `O17` lus lit la sortie de la résolution entière, `O18` un seul lot de la résolution qui fait `rm -rf lots/`). 13 vertes :

| Mutation verte | Raison | Preuve jouée |
| --- | --- | --- |
| `O01` l'échec du seul `numstat ^2` ignoré (`gestes.sh:344`) | trou du banc : `FAUX_GIT_NUMSTAT_FUSION` fait échouer `^1` **et** `^2` (`relecture.test.mjs:692`, motif `"^"[12]`), le `^1` sort en 12 d'abord | banc 36/36 |
| `O02` l'échec du seul `numstat ^1` ignoré (`:343`) | trou du banc, même raison (le `^2` sort en 12) | banc 36/36 |
| `O03` le premier parent retiré (`:343`) | trou du banc : seul `^1` voit une résolution qui prend le binaire de develop puis une retouche qui remet celui du sujet ; aucun cas | `essais/a5-parents-inverses.sh`, `VARIANTE=theirs-retouche` : au sommet `binaires : 1`, `lus 1 resolution` en 0 ; sous `O03`, `binaires : 0`, `lus : sortie 1` (`a5-theirs-retouche-{pr,mut}.txt`). Les parents inversés sont refusés par `C2` (`liste` sortie 4, `a5-inverse-pr.txt`) |
| `O05` binaires de la résolution ajoutés en fin, sans tri (`:345`) | trou du banc : aucun cas n'a un binaire du diff relu qui se trie après un binaire de la seule résolution | `essais/a7-binaires-melés.sh` : au sommet `a.bin|z.bin`, `lus` en 0 ; sous `O05`, `z.bin|a.bin`, `comm: file 2 is not in sorted order`, `lus : sortie 1` (`a7-O05.txt`) |
| `O06` le dossier de travail laissé (`:409`) | trou du banc, sans effet sur la machine (rien ne lit `travail-*`, l'empreinte le hache) | `a2` sous `O06` : `lots/` porte deux `travail-*` (`a2-O06.txt`) |
| `O08` « lot inconnu » retiré pour `resolution-<j>` (`:599`) | équivalente : `relus.txt absent` sort aussi en 12 | banc 36/36 |
| `O09` « un seul lot, le diff relu entier » écrit pour la résolution (`:390`) | trou du banc : `:1987` ne lit pas l'absence de ce message | `a1` `ours` sous `O09` : le message paraît alors que le diff relu est vide (`a1-O09.txt`) |
| `O11` le compte des lignes somme tous les lots (`:408`, `"$B"/lots/*-*/`) | trou du banc : aucun cas n'a le diff relu **et** la résolution en lots | `a2` sous `O11` : « lots de la résolution : leurs lignes ne font pas la résolution », `diff : sortie 12` (`a2-O11.txt`) |
| `O12` binaires de la résolution ajoutés après les lots | équivalente pour la machine : les `binaires.txt` de lot ne sont lus par aucune sous-commande (`lus` lit celui de `$B`, `:610`) | banc 36/36 ; `grep -n binaires gestes.sh` |
| `O13` `binaires.txt` de lot vide (`:403`) | équivalente, même raison (et déjà vrai des lots du diff relu sur `main`) | banc 36/36 |
| `O14` motif `resolution-` élargi (`:597`) | équivalente : la vérification du dossier refuse | banc 36/36 |
| `O15` la restriction compare à `relus.txt` (`:345`) | équivalente sur toute entrée où `diff-revue.sh` écarte `hors.txt` et `dispenses.txt` (`gestes.md:36`), donc `relus.txt` = `attendus.txt` | banc 36/36 |
| `O16` le dossier de travail sous `$B` et non sous `$B/lots` | équivalente : retiré dans les deux cas | banc 36/36 |

Comptes : 34 mutations jouées (16 de la session, 18 miennes) ; 13 vertes, toutes miennes : 7 trous du banc (`O01`, `O02`, `O03`, `O05`, `O06`, `O09`, `O11`), 6 équivalentes (`O08`, `O12` à `O16`). Le code de la PR tient sur chacun des trous (essais `a2`, `a5`, `a7`, `a1` au sommet).

### Constats

- m — `skills/chaine/relecture/references/gestes.md:40` et `:68` non touchés : la décision 6 nomme `:68` (`lus`), le « Où » du défaut 4 nomme `:40` (`binaires.txt`) ; `:40` dit encore « les fichiers du diff relu dont le diff ne porte que « Binary files … differ » », inexact depuis le défaut 4, et `:68` ne nomme ni `resolution` ni `resolution-<j>` (le texte est à `:39`). Commande : `git diff main...pr143 -- skills/chaine/relecture/references/gestes.md` (seules `:39` et `:42` changent).
- m — `scripts/relecture.test.mjs:692` : la panne `FAUX_GIT_NUMSTAT_FUSION` fait tomber les deux `numstat` à la fois ; la lecture par son code de chacun (`gestes.sh:343`, `:344`) n'est pas tenue seule. Mutations `O01`, `O02` vertes (`essais/mutations/jouer.sh`).
- m — aucun cas où seul `<fusion>^1` voit le binaire (`gestes.sh:343`) : mutation `O03` verte ; `essais/a5-parents-inverses.sh` `VARIANTE=theirs-retouche` le montre (sommet : `binaires : 1` ; sous `O03` : `lus : sortie 1`).
- m — le tri de la liste complétée (`gestes.sh:345`, `sort -u - … -o`) n'est pas tenu : aucun cas mêlant un binaire du diff relu et un binaire de la seule résolution ; mutation `O05` verte ; `essais/a7-binaires-melés.sh` sous `O05` : `lus` en 1 sur une erreur de `comm`.
- m — aucun cas où le diff relu et la résolution sont découpés tous les deux (`gestes.sh:408`, le motif `"$nom"-*`) : mutation `O11` verte ; `essais/a2-double-decoupe.sh` le joue au sommet (vert) et sous `O11` (`diff : sortie 12`).
- m — `gestes.sh:390` et `:409` : le message « un seul lot, le diff relu entier » et le retrait du dossier de travail ne sont lus par aucune assertion (`O09`, `O06` vertes) ; effet : un message faux ou un `travail-*` sous `lots/`, sans validation à tort.
- m — `scripts/relecture.test.mjs:1956` : `gros.ts` fait 2 100 lignes, la table du ticket dit 3 000 ; et le test du défaut 2 (`:2005`) vient après les deux du défaut 1 (`:1953`, `:1987`), quand la décision 7 le place « juste après » `:1945` (le « Où » du ticket donne l'ordre de la PR). Sans effet sur ce que le banc prouve. Commandes : `grep -n 'length: 2100'`, `grep -n '^test("A-164'`.
- m — `NOTES-DE-VERSION.md:9` : « trois suites de la contre-relecture de 7.36.0 », or le défaut 4 vient de la préparation du ticket (`A-167`), pas de la contre-relecture ; et la phrase de rappel d'`A-164` ouvre la section, quand la décision 8 la met après les changements (« Puis une phrase de rappel »). Commande : `sed -n 5,18p NOTES-DE-VERSION.md`.
- m — `gestes.sh:346` recopie l'expression des illisibles de `:307` : deux copies à tenir égales ; un seul calcul après `binaires_resolution` suffirait. Lu.
- m — les deux sorties 12 neuves (« lots de la résolution : … », « liste des binaires de la résolution illisible ») ne sont pas dans la liste de `SKILL.md:70` ni dans la ligne de `cas-limites.md:57` (« rejouer `diff` une fois ») ; « Toute autre sortie » les couvre, le ticket ne le demandait pas. Lu.
- m — corps de la PR : « 15 mutations », 16 nommées. Lu (`mcp github pull_request_read get`).

Aucun bloquant : ni validation à tort, ni lot du diff relu jeté ou mêlé (`a2`, `a6`, `:1987`, `S10`, `O18`), ni nom hostile mal lu (`a3`), ni binaire de la seule résolution manqué dans les cas que `C2` admet (`a4`, `a5`, `e22`), ni lot récrit après `C1` que l'empreinte ne voit pas (`a2`, `:1953`). `set -euo pipefail` : chaque commande neuve est lue par son code (`|| quitter 12` sur les deux `numstat`, `errexit` sur `cat`, `mktemp` et le tube de `:345`, `rmdir … || true` voulu) ; le tube de `:345` sort en 1 et non en 12 s'il échouait, comme celui de `:304` déjà sur `main`, et `diff` en traite toute sortie non nulle par « Toute autre sortie ».
