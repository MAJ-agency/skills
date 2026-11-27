prêt après retouches

Ticket lu sur origin/claude/compassionate-euler-st84s9 (sommet d2cbddf, le fichier y est identique à 0cdd101). Code lu et joué sur e64f93b (clone neuf, Node 22.23.5, git 2.43.0, 4 cœurs). Banc témoin : 31 sur 31, statut 0.

B l.212 (décision 8 bis, défaut 4) : la règle ouvre un défaut. Un fichier du diff relu, lu en texte contre le sujet mais binaire contre `<fusion>^2` (develop y a écrit un NUL), entre dans `binaires.txt`. Du coup `lus 1` sur le diff relu ne demande plus à l'axe de l'avoir lu, alors que `diff.patch` montre son texte (`+if (process.env.X) eval(process.env.X);`). Joué avec mon essai `e4b` (jouet.sh, `apps/api/src/facture/regle.ts`) : sur e64f93b, « binaires : 0 » et `lus 1` sort en 1 avec le fichier non lu ; avec un prototype écrit d'après 8 bis, « binaires : 1, dont illisibles : 1 » et `lus : sortie 0`. Pour un code, le verdict reste `incomplet`. Pour une extension image, police ou archive, rien ne le rattrape. Retouche : ne garder que les fichiers de `resolution.txt` absents d'`attendus.txt` (`… | comm -12 - resolution.txt | comm -23 - attendus.txt`). Jouée : `e4b` revient à `lus` en 1, et le cas 73 reste vert.

B l.286 et l.288, avec Vérification 2 l.293 (« toutes rouges ») : plusieurs mutations listées restent vertes avec les cas que le ticket donne, et la session devrait concevoir des cas en plus.
- Défaut 4, joué avec mon prototype et les cas 72 et 73 insérés : restriction à `resolution.txt` retirée, 33 sur 33, statut 0 ; `binaires.txt` remplacé au lieu d'être complété, 33 sur 33, statut 0 ; numstat en échec lu comme vide (`|| true`), 33 sur 33, statut 0. Sans `^2` : 1 échec, comme le ticket le dit.
- Défaut 1 : « la vérification d'union retirée » et « la vérification des lignes retirée » sont des mutants équivalents sur toute entrée normale. Sur e64f93b, retirer `gestes.sh:388` ou `:389` des lots du diff relu laisse le banc à 31 sur 31, statut 0.
Il faut, soit donner les cas qui les tuent (un second binaire hors conflit, un binaire au diff relu sur une PR de mise à jour, un faux git dont le numstat échoue), soit retirer ces mutations de la liste.

B l.174 (décision 2) : « le cas un seul lot ne retire que [le dossier de travail] » fait rougir un test existant que le ticket ne nomme pas. Le test « un diff de plus de 2 000 lignes… » exige `!existsSync(join(B2, "lots"))` (`relecture.test.mjs:1257`). Joué : `lots` de e64f93b, réécrite pour travailler dans `$B/lots/travail-diff` et retirer ce seul dossier, échoue à `relecture.test.mjs:1257:10`. Retouche : dire que `$B/lots` vide est retiré, ou que ce test change, et comment.

m l.9 (Fichiers chauds) : la PR 141, ouverte, touche aussi `README.md` (`gh api repos/MAJ-agency/skills/pulls/141/files` : `plugin.json`, `NOTES-DE-VERSION.md`, `README.md`). Le ticket ne modifie pas `README.md`, donc l'oubli est sans effet, mais la ligne est incomplète. PR 44 : `plugin.json` et `NOTES-DE-VERSION.md`. Aucune PR ouverte (141, 56, 44) ne touche `skills/chaine/relecture/` ni `scripts/relecture.test.mjs`.

m l.131-157 (mesure du défaut 4) : le script de l'essai n'est pas versionné. `git ls-tree` de la branche ne montre sous `61-annexes/…/essais/` que `e01` à `e21`, rien sur `cle.bin`. Je l'ai rejoué avec mon propre essai, un conflit modify/modify au lieu de add/add. « ours » donne le même trou : `resolution.patch` réduit à l'en-tête et aux deux lignes `remerge`, `binaires : 0`, « binaires sous un chemin sensible : 0 », `lus : sortie 1`, `git diff --numstat ^2` donne `-	-	apps/api/src/auth/cle.bin`. « neuve » tient : binaires 1, illisibles 1, sensibles 1.

m l.38 et l.60 : `e19`, `e21` et `outils/jouet.sh` ne sont que sur la branche de l'architecte, pas sur `main`. Une session partie de `main` ne les a pas sans lire cette branche.

m l.252 (deuxième cas du défaut 1) : `miseAJour` (`relecture.test.mjs:1891`) ne sait pas poser un commit après la fusion. La session doit étendre l'aide ou écrire la mise en place. La forme est jouable : j'ai rejoué `e17` v4, `liste` sort en 0 et la retouche entre au diff relu.

m l.125 et l.243 : `depot.test.mjs:1203-1213` puis `:1204-1213`. Le test commence à la ligne 1204 (`sed -n 1204p`).

Faits vérifiés, conformes :
- Ligne 20 : banc à 31 sur 31.
- Lignes 38-58 : `e19` rejoué sur e64f93b. `resolution.patch` fait 3 027 lignes, 3 016 et 11 par en-tête, en un seul lot. Ni `lot …` ni `lots :`, et `lots/` ne porte que `resolution/`.
- Lignes 60-67 : `lots` extraite (`gestes.sh:63-73`, `:238-239`, `:338-393`) et jouée seule sur une copie donne lot 1 de 3 016 lignes, lot 2 de 11, `lots : 2`, sortie 0.
- Lignes 83-106 et 265-284 : le cas 72 inséré après `:1945` est vert. Sous P9 (ligne 646 remplacée par `      }`), 31 sur 31 sans le cas, 32 tests et 1 échec avec. Sous M2, pareil. `e21` donne `1 : gardé`, et `1 : écarté…` sous P9. `tri-1-develop.diff` et `tri-1-fusion.diff` sont identiques au ticket. Ligne 646 supprimée entière : `1 : gardé`.
- Ligne 254 : le cas 73 est rouge sur e64f93b (`binaires.txt` et `illisibles.txt` vides). Il est vert avec un prototype de 8 bis : 33 sur 33.
- Ligne 115 : `grep -c remerge NOTES-DE-VERSION.md` donne 0 ; `sed -n 5,16p | grep -c -i 'résolution\|mise à jour'` donne 0.
- Les lignes citées de `gestes.sh`, `SKILL.md` (69, 108, 118), `gestes.md` (39, 40, 42, 68), `cas-limites.md` (60, 80-82), `README.md` (193, 195) et `relecture.test.mjs` (458-461, 1891, 1919, 1945, 1947, 1970) correspondent au code. Les numéros 72 et 73 sont libres.
- Défaut 1 : le découpage traite le `rm -rf` et les fichiers de l'`awk` (décision 2) ; il ne reste que le piège du test 1257 ci-dessus. Les lots de la résolution sont dans l'empreinte (`gestes.sh:148-150` hache tout `lots/`) et vérifiés par `lus` (décision 5).
- Défaut 4 : le binaire est vu partout où l'est un binaire du diff relu (`illisibles`, `binaires-sensibles`, le compte, `lus`, `binaires.txt` de chaque lot, `c4-verifier` par soustraction), sous réserve du premier B.
- Version : un patch, « la suivante de `main` au moment de livrer » ; aucun test n'écrit 7.36.0 en dur (`grep -rn '7\.36\.0' scripts/*.test.mjs` vide).
- A-162, A-164 et A-167 sont fidèles à la spec (`grep '^- \`A-16'` ciblé).
- Rien de privé : `grep` de `/home`, `/tmp`, `/root`, `@` (hors en-têtes `@@` de diff) et de noms propres ne donne rien.
