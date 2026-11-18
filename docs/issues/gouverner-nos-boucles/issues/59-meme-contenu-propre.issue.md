# « Même contenu propre » : un seul calcul, pas à pas de V à T, `meme-contenu.sh` et son banc sur dépôts jouets (lot 3b)

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — le script et son banc sont donnés mot pour mot (annexes A et B), joués sur un clone neuf d'`origin/main` : 47 tests verts, 39 mutations nommées, toutes tuées sauf une, dite et expliquée, la suite entière du dépôt verte avec eux. Restent la version, la note et le rejeu. Rien à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/meme-contenu.sh` (créé), `skills/chaine/fusionner/scripts/meme-contenu.test.mjs` (créé), `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`

## Le besoin

Ce ticket réalise le lot 3b de la spec [`relecture-independante.spec.md`](../relecture-independante.spec.md) (sixième version) : ses décisions `A-81` et `A-106`, sous les règles de `A-108` et dans l'ordre de `A-109`. Les choix que la spec ne portait pas ont été tranchés par l'architecte le 2026-11-18, décision `A-112`. Une relecture adversariale de la première version de ce ticket l'a rendue « pas prête » : deux faux « même » et un « illisible » manqué, tous reproduits ; l'architecte a adopté toutes ses corrections, décision `A-114`. Un second tour a fermé ces corrections et reproduit trois faux « même » nouveaux : l'architecte a cessé de boucher cas par cas, et posé quatre règles de structure, décision `A-119` (Décision 13). Les trois sont marquées ainsi dans « Décisions » ; le script et le banc des annexes sont ceux d'après `A-119`.

**Ce qui manque.** En régime 8, un verdict de relecture porte sur un sommet, V. Le capitaine met à jour et reteste toute PR en retard sur sa cible, jusqu'à trois fois par passage (plugin 7.16.0) : le sommet qu'il fusionne, T, est un commit qu'il a écrit lui-même. Deux lecteurs devront dire si le verdict de V vaut encore pour T : le Relecteur à chaque réveil (`A-85`, règles 2 et 3, lot 4) et le capitaine à ses deux contrôles (`A-105`, lot 5a). `A-81` veut un seul calcul, écrit une fois, à côté des scripts du capitaine. Il n'existe pas. Ce ticket l'écrit et l'éprouve ; **il ne le branche nulle part** : ni `passer.sh`, ni `sujet.sh`, ni aucun skill ne l'appelle encore.

**La définition** (`A-106`, mot pour mot) :

> De V, le sommet du verdict, à T, le sommet jugé, sur la ligne des premiers parents de T, chaque commit est :
>
> - soit **une fusion** à deux parents, dont le second est un ancêtre de la cible (`origin/B`), et dont l'arbre est celui de la fusion calculée de ses deux parents (`git merge-tree`, arbre pris même en conflit), aux index générés près ;
> - soit **un commit qui ne touche que des index générés**.
>
> Tout autre commit : « différent » ; V absent de cette ligne : « différent ».

**Ce que `main` a déjà, et pourquoi le calcul ne le reprend pas.** **La base de ce ticket est `origin/main` à `8f8cfd9` (plugin 7.21.1)**, relue après `git fetch origin main`. `passer.sh`, `github.sh` et `sujet.sh` y sont ceux de `1c4acb1` (7.17.0), le commit que la spec et le rapport de vérification citent : `git diff 1c4acb1 8f8cfd9 -- skills/chaine/fusionner/scripts/passer.sh skills/chaine/fusionner/scripts/github.sh skills/chaine/sujet/scripts/sujet.sh` est vide. `depot-jouet.mjs` (le ticket 13 de l'autre programme y est entré), `boucle.sh`, `fusionner/SKILL.md`, `README.md` et les tests de `scripts/` ont bougé depuis : leurs repères de ligne sont ceux de `8f8cfd9`.

- Les deux sortes de commits que le capitaine écrit sur la branche d'une PR : la fusion de la cible (`skills/chaine/fusionner/scripts/passer.sh:220`, `skills/chaine/sujet/scripts/sujet.sh:518`), conclue par `git commit --no-edit` quand un index était en conflit, après `git checkout --theirs` sur lui et la régénération (`passer.sh:261`, `:272` ; `sujet.sh:534`, `:539`) ; et, quand la fusion était propre et qu'un index change à la régénération, un commit à part, `docs: régénère les index après mise à jour avec …` (`passer.sh:274`, `sujet.sh:541`).
- `verifier_mise_a_jour` (`sujet.sh:618`) juge déjà une fusion contre celle qu'elle recalcule de ses deux parents : c'est l'esprit du calcul. Mais elle lit la liste des index par l'arbre de travail d'abord, joue `commitlint`, et sort par `sortir`.
- `livraison_intermediaire` (`passer.sh:126`) applique les trois classes d'index. Mais elle lit la liste par `index_json` (`skills/chaine/fusionner/scripts/github.sh:64`), **l'arbre de travail d'abord**, et compare un index au **sommet courant** d'`origin/develop` (`passer.sh:153`, `:157`). `A-81` interdit l'un et `A-106` l'autre.
- `ascendance` (`github.sh:138`) est le modèle : paramétrée par des réfs, elle lit la liste sur la cible (`git show "$cible:scripts/docs/index-generes.json"`), et ne rend jamais un verdict par défaut quand une lecture échoue.

**Ce qui a été joué pour écrire ce ticket** (2026-11-18, git 2.43.0, bash 5.2.21, jq 1.7, Node 22.23.4), sur un clone neuf d'`origin/main` à `8f8cfd9` : le script de l'annexe A et le banc de l'annexe B, 47 tests verts en environ 30 s ; les 39 mutations de « Vérification », 38 tuées, une qui survit et qui est dite (la 35) ; la suite entière avec les deux fichiers ajoutés (897 tests, tous verts). **Le cas que la définition par M jugeait mal et que la définition pas à pas rend « même »** (rapport `relecture-independante.verif-716.md`, § 2.2, limite 3) : cas 8. Son montage est prouvé dans le banc (la fusion directe de V avec la cible n'a pas l'arbre de T). À savoir : T2 n'y porte plus le changement que la PR faisait sur `f`, la cible l'ayant annulé ; « même » y dit que rien d'autre que des mises à jour avec la cible n'a été écrit depuis V, pas que la PR apporte encore tout ce que V apportait. `A-112` le confirme (Décision 8, i). **L'autre cas du rapport (limite 4, deux bases de fusion) rend « différent » depuis `A-119`** : c'est le prix de S2, dit en Décision 5 et joué au cas 9. **Les attaques des deux tours de relecture adversariale** ont toutes été rejouées, rouges par leur mutation, vertes ici : cas 30 à 47. Hors banc : le dossier temporaire plein, sur un tmpfs (« Ce qui n'a pas été établi », point 3), et la condition de rechange de S2 (Décision 5).

## Où

| Fichier | Geste |
| ------- | ----- |
| `skills/chaine/fusionner/scripts/meme-contenu.sh` | créé, mode `100755` comme les autres `.sh` du dossier (annexe A) |
| `skills/chaine/fusionner/scripts/meme-contenu.test.mjs` | créé (annexe B) |
| `.claude-plugin/plugin.json` | la version |
| `NOTES-DE-VERSION.md` | la note, en tête |

Aucun autre fichier. `skills/chaine/sujet/scripts/depot-jouet.mjs` n'est pas modifié.

## Décisions

### 1. La forme : un script bash exécuté, pas un module

Confirmée par `A-112`. `skills/chaine/fusionner/scripts/meme-contenu.sh`, posé en `scripts/chaine/meme-contenu.sh`. Il s'exécute (`bash …/meme-contenu.sh`), il ne se source pas : ses variables et son `exit` ne touchent pas l'appelant. Raisons :

- **Il est posé sans toucher à aucun fichier existant.** L'étape `poser` de `fusionner` copie `scripts/*.sh` et « les tests `scripts/*.test.mjs` » par motif, mais les `.mjs` **un par un, par leur nom** (`skills/chaine/fusionner/SKILL.md:14`). Un calcul `.mjs` neuf ne serait pas posé tant que cette ligne ne le nomme pas, alors que son banc le serait : le banc posé tomberait chez le projet. `fusionner/SKILL.md` est un fichier chaud de l'autre programme ; ce lot n'écrit que des fichiers neufs (`A-109`). Un `.sh` et son `.test.mjs` passent par les deux motifs.
- Ses trois appelants sont en bash ou lancent des commandes : `passer.sh` (`bash "$PASSER_OUTILS/meme-contenu.sh" …`), `sujet.sh` (`bash "$ici/meme-contenu.sh" …`, avec le repli vers `fusionner/scripts/` que `sujet.sh:738-739` fait déjà pour `revue-exigee.mjs`), et le Relecteur, qui lit GitHub par `github.sh` (`A-83`). La copie de travail de la boucle prend tout `scripts/chaine` d'`origin/develop` (`skills/chaine/fusionner/scripts/boucle.sh:221`) : le script y sera sans rien ajouter.
- Pas d'idiome de point d'entrée à porter, donc aucune ligne due à `scripts/points-d-entree.test.mjs`, qui ne liste que des `.mjs`.
- Dépendances : `bash` ≥ 4, `git` ≥ 2.41 (`merge-tree --write-tree`, que `ascendance` exige depuis 2.38, et `--attr-source`, S4), `jq` (déjà exigé par `github.sh:12`), `mktemp` et `rm` pour le dossier du dépôt propre (S1). Aucun autre outil : ni `awk`, ni `grep`, ni `sed`. Rien d'installé, aucun `node_modules`, aucun arbre de travail lu ; le dépôt réel n'est pas écrit.

### 2. L'appel et les entrées

```
bash scripts/chaine/meme-contenu.sh <V> <T> <B>
```

Depuis un dépôt git (nu ou non), de n'importe lequel de ses dossiers : le dépôt jugé est celui du dossier courant, quelles que soient les variables `GIT_*` héritées, sa configuration et celle du poste (S1, Décision 13). Trois arguments, pas un de moins. `<B>` est un nom de branche : confirmé par `A-112`.

| Entrée | Forme | Sens |
| ------ | ----- | ---- |
| `<V>` | sha de 40 caractères hexadécimaux en minuscules | le sommet du verdict (`Sommet relu:`, `A-80`) |
| `<T>` | de même | le sommet jugé : la tête de la PR, ou le sommet que le capitaine fusionne (`A-105`) |
| `<B>` | un nom de branche (`develop`, `sujet/<nom>`), jamais une réf, ni `HEAD`, ni une réf symbolique | la branche de base **de la PR** ; le script lit `refs/remotes/origin/<B>`, et rien d'autre |

Le script **ne lit pas le réseau**. Qui l'appelle a relu la cible juste avant, par un refspec explicite (`git fetch origin "+refs/heads/<B>:refs/remotes/origin/<B>"`, comme `passer.sh:326` et `sujet.sh:825`), et a les commits de la PR (`T`). Raison du nom de branche plutôt que d'une réf : un appelant ne peut pas passer par mégarde une branche locale périmée, et `A-106` dit « sur la cible (`origin/B`) ».

### 3. Les sorties

Sortie standard : **une seule ligne, le verdict**, écrite en dernier. Sortie d'erreur : une ligne, sa raison, en français ; elle nomme le commit par ses neuf premiers caractères et le fichier, et ses caractères de contrôle sont remplacés par des espaces. **Un argument refusé n'est jamais recopié**, ni sur l'une ni sur l'autre (`A-114`) : la première ligne de la sortie standard en est aussi la dernière, quoi que portent V, T et B.

| Code | Sortie standard | Quand |
| ---- | --------------- | ----- |
| 0 | `même` | V est T, ou chaque commit de V à T passe la définition, **et le compte y est** (S3) |
| 20 | `différent` | un commit ne la passe pas, V n'est pas sur la ligne des premiers parents de T, ou V est introuvable dans le dépôt |
| 21 | `illisible` | le script ne peut pas conclure : usage, bash < 4, dépôt, nom de branche refusé, **dossier temporaire plein ou absent**, clone superficiel, `origin/<B>` absente, T introuvable, liste des index mal formée, une commande git en échec, une lecture vide ou incohérente, un compte de commits qui ne tombe pas juste |
| 69 | `illisible` | `git`, `jq`, `mktemp` ou `rm` absent du poste, **ou git plus ancien que 2.41** (« git ≥ 2.41 requis, ici X ») ; c'est le code de toute la chaîne pour un outil qui manque (`github.sh:12`) |

Les quatre codes sont confirmés par `A-112`. **Seul le code 0 vaut « même ».** Tout autre code que 0 et 20 se lit « illisible », y compris un code que ce tableau ne nomme pas (signal, erreur de bash) : une lecture en échec ne vaut jamais « même » (`A-106`). Les codes 20 et 21 ne sont pris par aucun script de la chaîne : relevé sur `main`, les `.sh` de `skills/chaine` sortent en 0 à 12, 64 et 69 (dont 12 dans `passer.sh` et `sujet.sh`, 8 et 11 dans `sujet.sh fusionner`, que le rapport, § 3.4 point 6, interdit de réemployer). Les lots 4 et 5a diront ce que l'appelant fait de « illisible » ; ce n'est pas ici.

### 4. L'ordre des lectures

1. bash ≥ 4 ; trois arguments ; V et T de 40 caractères, d'une seule ligne. Sinon 21, sans recopier l'argument.
2. `git`, `jq`, `mktemp` et `rm` présents ; toute variable `GIT_*` héritée est oubliée (sauf `GIT_CEILING_DIRECTORIES`, qui ne fait que borner la recherche du dépôt) ; `git version` dit au moins 2.41. Sinon 69.
3. **Le dépôt réel**, celui du dossier courant, ne répond qu'à ceci : y a-t-il un dépôt ; `<B>` est-il un nom de branche valide (ni espace ni caractère de contrôle, pas `HEAD`, `git check-ref-format`) ; `refs/remotes/origin/<B>` est-elle une réf symbolique (alors 21) ; où sont ses objets (`git rev-parse --path-format=absolute --git-path objects`) ; plus bas, quel sha porte `refs/remotes/origin/<B>`, et est-il superficiel. Aucun objet n'y est lu.
4. **Le dépôt propre** (S1, Décision 13) se crée sous `${TMPDIR:-/tmp}`. Il ne se crée pas, ou ne s'écrit pas : 21.
5. T est un commit, lu dans le dépôt propre. Sinon 21. **V est T : `même`, raison « V est T »**, sans lire ni la cible ni la liste (`A-81`).
6. Clone superficiel : 21. `origin/<B>` absente, ou qui n'est pas un commit : 21.
7. V n'est pas un commit : `différent` (`A-81` : « V introuvable après une réécriture »).
8. La ligne des premiers parents de T (`git rev-list --first-parent --reverse`) : chaque ligne est un sha et la dernière est T, sinon 21. V n'y est pas : `différent`. **Le nombre de commits qui suivent V doit être celui que rend une autre commande, `git rev-list --count --first-parent V..T`, et valoir au moins 1** : sinon 21 (S3).
9. La ligne des premiers parents de la cible (`git rev-list --first-parent origin/<B>`), pour S2 ; la liste des index de la cible (Décision 6), écrite dans le dossier du dépôt propre et lue de là par `jq`. Mal formée : 21.
10. Chaque commit du chemin, **du plus ancien au plus récent** ; le premier qui ne passe pas donne la raison. Un commit dont chaque ligne de l'écart a été jugée est **accepté et compté**.
11. **`même` ne sort que si le nombre de commits acceptés est le nombre attendu** (S3) ; sinon 21.

### 5. Un commit du chemin

Ses parents se lisent par `git rev-list --parents -n 1` : la ligne rendue doit avoir la forme attendue et commencer par le commit lui-même, sinon 21. Son arbre par `git rev-parse <commit>^{tree}`.

- **Deux parents, `p1` et `p2` : une mise à jour, si S2 le dit** (`A-119`, qui amende `A-106`). Le second parent doit être **sur la ligne des premiers parents de `origin/<B>`** : il a été un jour le sommet de la cible. Sinon `différent`. Et il ne doit **pas être un ancêtre du premier** (`git merge-base --is-ancestor p2 p1` rend 1) : la fusion apporte quelque chose de la cible. Sinon `différent` ; toute autre sortie : 21. Puis `git --attr-source=<arbre vide> merge-tree --write-tree --name-only --no-messages p1 p2` (S4) : sortie 0 ou 1, la première ligne est l'arbre calculé, **pris même en conflit** (il porte alors les marqueurs), les suivantes sont **les fichiers en conflit** ; toute autre sortie : 21 ; une sortie 1 sans fichier en conflit, ou une sortie 0 avec : 21. L'arbre de départ de l'écart est l'arbre calculé.
- **Un parent** : l'arbre de départ est celui du parent.
- **Plus de deux parents** : `différent`.

L'écart est `git diff-tree -r --raw --no-abbrev --no-renames <arbre de départ> <arbre du commit>` : une ligne par chemin, qui porte aussi le mode et le blob du côté du commit. **Il est vide si, et seulement si, les deux arbres sont le même objet** : un écart vide entre deux arbres différents, ou l'inverse, est une lecture en échec, donc 21 (`A-114`). Chaque ligne doit avoir la forme attendue (sinon 21) et son chemin être dispensé (Décision 7). Un commit vide passe : son arbre est celui de son parent.

**Pourquoi S2.** La règle d'`A-106`, « le second parent est un ancêtre de la cible », admettait un second parent **latéral** : un commit entré dans la cible par le second parent d'une fusion, qui ne porte pas tout ce que la cible portait avant lui. Une fusion écrite à la main avec lui fabriquait un conflit sur un index sans commande, y mettait le contenu de ce second parent, et le squash faisait perdre à la cible une ligne que le commit latéral n'avait jamais eue (cas 32). Un commit qui a été le sommet de la cible porte, lui, tout ce que la cible portait avant : une fusion avec lui est une mise à jour que le capitaine aurait pu écrire. La relecture proposait une autre condition (chaque base de fusion de `p1` et de la cible est un ancêtre de `p2`) : **elle n'est pas ajoutée**. Aucun cas n'a été trouvé que S2 laisse et qu'elle ferme, et elle fait basculer à « différent » une mise à jour honnête dès que la base de la PR entre ensuite dans la cible par un second parent (une PR partie du sommet d'un sujet, mise à jour avec develop, puis le sujet livré) : joué hors banc.

**Ce que S2 coûte**, et que la sixième version de la spec promettait à l'inverse (rapport § 2.2, limite 4) : **une sous-PR qui a fusionné elle-même un `develop` plus récent que son sujet rend « différent »**, avant comme après que le sujet a reçu ce `develop` (cas 9). Ce commit de `develop` est entré dans le sujet par un second parent : il n'en a jamais été le sommet, et c'est exactement la forme de l'attaque. Un verdict rendu **après** cette fusion tient (cas 9, dernier appel), et la mise à jour d'une sous-PR par le capitaine avec son sujet, une fois que le sujet a reçu develop, rend « même » (cas 10).

### 6. La liste des index : où, quelles clés

Le fichier est `scripts/docs/index-generes.json`, lu **dans l'arbre de `refs/remotes/origin/<B>`** (`git ls-tree`, puis `git cat-file blob`), jamais dans l'arbre de travail, jamais sur la PR. Sa forme, vérifiée dans `github.sh` (`index_generes`, `:68` ; `index_commandes`, `:70` ; `index_regeneres_regex`, `:174` ; `index_regeneres_motifs_regex`, `:181`) et dans le gabarit du plugin (`skills/chaine/socle-chaine-de-production/references/index-generes.json`) : un objet dont la clé `index` est un tableau ; chaque entrée est soit **une chaîne nue**, le chemin d'un index sans commande, soit **un objet** `{ "chemin": "…", "commande": "…", "verification": "…" }`, où `commande` et `verification` sont facultatifs. Dans un chemin, `*` vaut un ou plusieurs caractères hors `/` (« un segment »).

- Fichier absent de la cible : aucun index (comme `ascendance`, `github.sh:158-162`). Seules les fusions pures et les commits vides passent alors.
- Fichier présent mais mal formé : 21. Mal formé : pas du JSON, `index` qui n'est pas un tableau, une entrée qui n'est ni une chaîne non vide ni un objet à `chemin` chaîne non vide, une `commande` qui n'est pas une chaîne.
- `verification` n'est pas lu.

### 7. « Aux index générés près » : les trois classes, à chaque commit

Un chemin en écart reçoit sa classe **dans l'ordre de `livraison_intermediaire`** (`passer.sh:148-159`) :

1. git le cite (il commence par un guillemet), ou aucune entrée de la liste ne le touche : **hors index** ;
2. sinon, une entrée à `commande` dont le chemin porte `*` le touche : **motif** ;
3. sinon, aucune entrée à `commande` ne le touche : **sans commande** ;
4. sinon : **régénéré** (un chemin littéral à `commande`).

Une « entrée » d'arbre est le couple mode et blob. « Ordinaire » : mode `100644` ou `100755`.

| Classe | Dans une fusion (deux parents) | Dans un commit à un parent |
| ------ | ------------------------------ | -------------------------- |
| hors index | `différent` | `différent` |
| régénéré | dispensé, si le chemin est absent du commit ou y est un fichier ordinaire | de même |
| sans commande | dispensé seulement si le chemin est **en conflit dans la fusion calculée**, et si son entrée dans le commit est ordinaire et **est celle du second parent**, la cible fusionnée ; hors conflit, `différent` | `différent` |
| motif | de même | `différent` |

Ce que ce tableau fixe, et d'où il vient :

- **Un index sans commande ou sous motif n'est dispensé que dans un conflit** (`A-114`, qui amende `A-106`). Hors conflit, la fusion calculée dit déjà ce qu'il doit porter, et il se juge comme tout fichier. La version relue le dispensait dès qu'il avait le contenu du second parent : une fusion écrite à la main, dont le second parent est un vieux commit de la cible, reculait le registre jusqu'à lui, et le squash perdait ce que la cible y avait écrit depuis (cas 31, a ; S2 la refuse désormais avant même cette règle, le second parent étant un ancêtre du premier). La règle reste nécessaire à côté de S2 : avec un vrai sommet de la cible, une fusion sans conflit peut encore écraser l'index par celui de la cible (cas 31, b). Le capitaine, lui, ne prend le côté de la cible que sur un fichier en conflit (`git checkout --theirs -- <fichiers en conflit>`, `passer.sh:261`, `sujet.sh:534`).
- **Le contenu connu est celui du second parent**, jamais le sommet courant de la cible (`A-106`). Les mots « ou celui de la fusion calculée » ne demandaient aucun code : un chemin n'est dans l'écart que si son entrée n'est pas celle de la fusion calculée. `A-112` les retire d'`A-106`.
- **Classes 2 et 3 ont donc la même règle** dans une fusion : c'est déjà vrai de `livraison_intermediaire`, à ceci près qu'elle compare au sommet courant.
- **Absent n'est pas un contenu connu** pour les classes 2 et 3 (`passer.sh:154`, `:158` ; son commentaire : « absent d'un côté, il diffère et va à la revue »).
- Le calcul ne joue aucune commande et ne régénère rien : il ne sait pas si un index régénéré est à jour.
- **Limite, à connaître** (`A-114`) : **un index à commande est dispensé quel que soit son contenu.** S'il n'a pas de `verification` jouée en CI, une retouche à la main de cet index après le verdict n'est vue par personne : ni par ce calcul, ni par la relecture, qui ne lit pas les index générés. C'est la limite d'aujourd'hui (la revue les exclut déjà de son diff) ; elle est dite ici pour ne pas être découverte plus tard.

### 8. Ce que la spec ne disait pas : tranché par `A-112`

La sixième version de la spec ne portait pas ces points. L'architecte les a tranchés le 2026-11-18 (`A-112`) : (a) à (e), (h) et (i) sont ses décisions ; (f) est un choix d'écriture de ce ticket ; (g) vient de `A-114`. Chacun est du côté sûr (« différent » ou « illisible »), sauf (c) et (i), où aucun contenu propre n'a changé. La session ne revient sur aucun.

- **(a) Un index sans commande, ou sous motif, qui change dans un commit à un parent.** `A-106` ne donne le « contenu connu » que pour une fusion. Aucun contenu connu, donc `différent` (`A-112`). Le capitaine n'écrit jamais ce commit pour un index sans commande. Pour un index sous motif, voir (h).
- **(b) Un index dispensé qui devient un lien symbolique** (ou un sous-module) : `différent` (`A-112`). La spec ne le disait pas ; `liens_sur_index` (`github.sh:196`) existe parce que la régénération écrirait à travers lui.
- **(c) Un commit vide** entre V et T : `même` (`A-112`).
- **(d) Un clone superficiel** : `illisible` (`A-112`), avec la commande (`git fetch --unshallow origin`). Sur un historique tronqué, la ligne des premiers parents s'arrête sans le dire et la base d'une fusion calculée peut manquer. `passer.sh:111` et `sujet.sh:113` complètent déjà leur clone avant de juger ; une session cloud part d'un clone superficiel (`passer.sh:108`), et le Relecteur devra faire de même (lot 4).
- **(e) V introuvable** : `différent` (`A-81`, `A-112`), alors que T introuvable, cible absente et liste illisible donnent `illisible` (`A-106`, « une lecture en échec »). Raison : après une réécriture de la branche, V n'est plus atteignable d'aucune réf et un clone neuf ne l'aura jamais ; `illisible` y serait un état sans fin.
- **(f) Les caractères d'un chemin de la liste.** `github.sh` n'échappe que `.` et `*` en bâtissant ses expressions régulières (`:123`, `:176`) : un chemin de la liste qui porte `(`, `+` ou `[` y vaut autre chose que lui-même. Ici tout caractère autre que `*` est pris à la lettre. Écart assumé avec `github.sh`, qui n'est pas touché.
- **(g) Les chemins se lisent sans `-z`, sous `core.quotePath=false` écrit sur chaque commande, et un chemin que git cite n'est jamais un index** (`A-114`). Git cite un chemin, et le fait alors commencer par un guillemet, dès qu'il porte un caractère de contrôle, un guillemet ou une barre oblique inverse ; aucun chemin non cité ne commence par un guillemet. La version relue comparait le chemin cité à la liste : une entrée de la liste écrite elle-même entre guillemets, `"apps/a\tb.ts"`, faisait passer pour un index le fichier `apps/a<TAB>b.ts` (cas 36). La relecture demandait `-z` « là où c'est possible » : ce ne l'est pas sans perdre une garde. Une substitution de commande de bash jette les octets nuls, et une substitution de processus perd le statut de git, donc la règle « une lecture en échec n'est jamais une lecture vide » ; un fichier temporaire ajouterait un outil et une écriture. La règle du guillemet ferme le même trou, et elle se prouve : cas 25 et 36.
- **(h) Un index déclaré par motif, récrit d'un contenu nouveau par une régénération : `différent`, et la relecture de plus est acceptée** (`A-112`). Dans une fusion, son entrée n'est celle du second parent que si la régénération n'y a rien changé ; dans le commit d'index à part, il n'a aucun contenu connu (a). Une PR dont le capitaine régénère ainsi un index sous motif perd donc son verdict. Raisons de l'architecte : le calcul ne peut pas rejouer la commande qui a produit le fichier, donc il ne distingue pas une régénération d'une retouche ; l'erreur est du seul côté sûr ; et le cas est rare, le gabarit du plugin ne déclarant aucun motif. `A-112` amende la dernière phrase d'`A-81` : « garde son verdict, sauf un index sous motif récrit d'un contenu nouveau ». Un index sans commande n'est pas concerné : le capitaine ne le régénère pas, et en conflit il prend le contenu de la cible (cas 6).
- **(i) La cible annule un changement que la PR faisait aussi : `même`, alors que T ne porte plus ce changement** (`A-112`, cas 8). C'est juste : le contenu propre de la PR n'a pas changé, c'est la cible qui l'a défait, et la CI du sommet fusionné juge le résultat.

### 9. Le script ne s'arrête pas sur une erreur, ne passe par aucun here-document, et prouve « même » (S3)

`set -uo pipefail`, **sans `-e`**. Chaque commande a son statut lu et sa suite écrite (`différent`, `illisible`, ou on continue). Raison : sous `set -e`, un git en échec arrêterait le script en sortie 1 sans verdict.

**Quatre outils, pas un de plus** : `git`, `jq`, et, pour le dossier du dépôt propre, `mktemp` et `rm`. Tout le reste est du bash. La première version passait par `grep`, `sed` et `awk` : sur un poste sans `awk`, la lecture revenait vide et le script rendait `même` (cas 30). La deuxième les avait retirés, mais découpait ses lectures par des here-documents (`mapfile -t … <<<"$sortie"`) : bash écrit un here-document dans un fichier du dossier temporaire, et sur un dossier plein la lecture revenait vide, la boucle ne jugeait aucune ligne d'un commit de 2 500 fichiers, et le script rendait `même`. **S3** (`A-119`) ferme la famille au lieu du cas :

- **aucun here-document, aucune substitution de processus, aucun tube vers une lecture** : un texte se découpe en lignes par le découpage des mots de bash (`IFS` réduit au saut de ligne, développement des noms de fichiers coupé), et une ligne se lit par une expression régulière. Le banc le vérifie sur le texte du script (cas 46) ;
- **aucun fichier temporaire hors du dossier de S1** ; un seul y est écrit, la liste des index, par une redirection dont le statut est lu ;
- chaque lecture est une substitution de commande seule, dont le statut est lu, et **elle est relue dans sa forme** : un sha est un sha, la ligne des premiers parents finit par T, celle de la cible commence par la cible, le premier mot de `rev-list --parents` est le commit demandé, chaque ligne de l'écart a la forme de `--raw`, l'écart n'est vide que si les deux arbres sont le même, la liste absente l'est pour deux commandes ;
- **`même` se prouve par un compte** : le nombre de commits de V à T, rendu par `git rev-list --count --first-parent V..T`, est comparé au nombre de commits que la boucle a examinés et acceptés un à un, chacun après que toutes les lignes de son écart ont été jugées. Pas égaux, ou nuls alors que V n'est pas T : 21. Un `même` ne se déduit donc jamais d'une boucle qui n'a rien lu.

### 10. Le banc monte ses dépôts sans modifier `depot-jouet.mjs`

Il importe `depotJouet`, `dossierTemporaire` et `script` de `depot-jouet.mjs` par le repli des autres bancs du dossier (à côté quand il est posé à plat, dans le skill `sujet` sinon : `skills/chaine/fusionner/scripts/github.test.mjs:9-14`). `depotJouet()` donne un `origin` nu, un clone, `develop` et un index à commande (`docs/adr/README.md`, commande `node scripts/docs/adr-index.mjs`) : tout le reste se monte par ses poignées (`git`, `ecrire`, `commit`, `branche`, `github`, `lancer`). Une autre liste d'index se pousse sur `develop` comme un commit ordinaire. Les dossiers passent par `dossierTemporaire` : ils sont retirés à la sortie, et tout `git` reçoit `d.env` (ni `GIT_*` hérité, ni variable du capitaine) : le banc ne recopie pas le filtre des variables `GIT_*`, que `scripts/un-seul-environnement-de-banc.test.mjs` refuse dans tout banc depuis le ticket 13 de l'autre programme (`README.md:194`).

Les commits du capitaine sont écrits de deux façons : par une aide du banc, `miseAJour`, qui rejoue avec le vrai `git` les gestes de `passer.sh:220-274` et de `sujet.sh:518-541` ; et, pour deux cas (12 et 13), **par `passer.sh` et `sujet.sh fusionner` eux-mêmes** sur le faux GitHub, pour que la preuve porte sur ce que le capitaine écrit vraiment.

### 11. Version et note

La mineure suivante de la version de `main` au moment de livrer (7.23.0 tant que `main` porte la 7.22.0 : il y est arrivé, à `289323c`, pendant le dernier rejeu, par une PR qui ne touche aucun fichier cité ici ; un script ajouté, `README.md` « Ajouter un skill », point 4). La note, en tête de `NOTES-DE-VERSION.md`, à la forme des précédentes (`## <version> — <date>`, « ### Ce qui change », « ### Ce qu'un projet fait pour en profiter » : `scripts/depot.test.mjs:1095-1105` exige que la première note commence par la version de `plugin.json` et porte ces deux titres) :

- « Ce qui change » : `fusionner` porte `scripts/meme-contenu.sh` et son banc. Le calcul dit si deux sommets d'une PR ne sont séparés que par des fusions de la cible et des commits d'index générés ; sorties 0 « même », 20 « différent », 21 « illisible » ; **il demande git ≥ 2.41** (`--attr-source`), bash ≥ 4, `jq`, `mktemp` et `rm`, et un dossier temporaire où écrire. Rien ne l'appelle encore : il prépare la relecture indépendante.
- « Ce qu'un projet fait pour en profiter » : mettre à jour le plugin ; rien d'autre aujourd'hui. À prévoir pour la suite : **un poste de capitaine ou de Relecteur dont le git est plus ancien que 2.41 rendra « illisible » (sortie 69) à chaque appel** : relever `git --version` sur ces postes avant que le capitaine et le Relecteur n'appellent ce calcul. Le script et son banc arrivent dans `scripts/chaine/` à la prochaine fois que le projet rejoue `/maj-skills:fusionner poser` ; aucun script de la boucle ne change, le capitaine ne se relance pas.

`.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` sont disputés par toute PR ouverte du plugin : partir de `main`, et **reprendre `main` avant de livrer** (version et note recalées sur ce que `main` porte alors).

### 12. Ce qui reste dû, hors de ce ticket

La ligne du script et de son banc dans `skills/chaine/fusionner/references/CONTENU.md` et dans l'arbre du `README.md` (`:169`) : ces fichiers sont tenus par l'autre programme, la ligne s'écrit une fois ses tickets 2, 3, 4, 8 et 9 entrés, au plus tard avec le lot 3d (spec, « Les lots », point 3). **Aucun test de `main` n'exige qu'un fichier neuf sous `fusionner/scripts/` soit listé quelque part** : `scripts/poses.test.mjs` pose les dossiers entiers (`:15-23`, `:61`), `scripts/points-d-entree.test.mjs` ne tient qu'une liste écrite à la main de `.mjs` (`:18-28` ; `commits-a-relire.mjs` n'y est pas), et `scripts/depot.test.mjs` ne lit `CONTENU.md` de `fusionner` nulle part. Vérifié par lecture, puis par la suite entière, verte avec les deux fichiers ajoutés et rien d'autre.

### 13. Les quatre règles de structure (`A-119`)

Deux tours de relecture adversariale ont trouvé, chacun, des faux « même » d'une même sorte : une configuration, un dossier, une variable, un outil dont le calcul dépendait sans le dire. `A-114` les avait bouchés un par un, par une option écrite pour chaque réglage ; le second tour en a trouvé d'autres (`merge.text.driver`, un pilote de fusion commité, le dossier temporaire plein). **`A-119` arrête de boucher cas par cas** : quatre règles ferment les familles.

- **S1, un dépôt propre pour calculer.** Tout calcul git (ligne des premiers parents, arbres, écarts, `merge-tree`, lecture de la liste) se fait dans **un dépôt nu jetable**, créé par `mktemp -d` sous le dossier temporaire puis `git init --bare --template=`, qui emprunte les objets du dépôt réel par une ligne dans `objects/info/alternates`. Chaque commande y tourne avec `GIT_CONFIG_GLOBAL=/dev/null`, `GIT_CONFIG_SYSTEM=/dev/null`, `GIT_CONFIG_NOSYSTEM=1`, `GIT_ATTR_NOSYSTEM=1`, et sans aucune variable `GIT_*` héritée. Ce dépôt n'a ni configuration (hors les trois lignes de `git init`), ni `info/attributes`, ni greffes, ni `refs/replace`, ni arbre de travail, ni `HEAD` : rien de tout cela ne peut peser, quel que soit le poste. V et T sont des sha ; la cible se résout une fois en sha dans le dépôt réel ; tout le reste se fait par sha. La fusion calculée s'écrit dans le dépôt propre : **le dépôt réel n'est plus écrit du tout**. Le dépôt propre est retiré à la sortie (`trap … EXIT`).
- **S2, quelle fusion compte comme une mise à jour** : Décision 5.
- **S3, « même » se prouve** : Décision 9.
- **S4, aucun attribut dans la fusion calculée** : `--attr-source=<arbre vide>` sur `git merge-tree`. La fusion calculée est la fusion à trois voies nue. **Git ≥ 2.41 est donc exigé** (c'est la version qui apporte `--attr-source` ; la version d'`A-114` disait 2.40 à tort) : le contrôle est en tête, sortie 69, « git ≥ 2.41 requis, ici X », et l'exigence s'écrit dans la note de version (Décision 11).

**Ce qui tombe sous S1 sans garde particulière.** Le script ne porte plus aucune des parades d'`A-114` que voici ; leurs cas sont restés au banc, verts. La mutation 22, qui fait calculer dans le dépôt réel, rougit les cas 33, 35 et 41 (et le 45, qui regarde que le dépôt réel n'est pas écrit). Le cas 42 demande de retirer S1 **et** S4 (mutation 39) : l'une ou l'autre suffit à le fermer. Le cas 34 reste vert même sous la mutation 22 : `git diff-tree` n'obéit pas à `diff.relative`, et `--full-tree` est resté écrit sur `git ls-tree`.

| Attaque | Cas | Parade d'`A-114`, retirée |
| ------- | --- | ------------------------- |
| `diff.ignoreSubmodules`, `ignore` de `.gitmodules` (premier tour, attaque 2) | 33 | `--ignore-submodules=none` |
| `diff.relative` et le dossier courant (premier tour, attaque 2) | 34 | `--no-relative`, se placer à la racine |
| `git replace` | 35 | `GIT_NO_REPLACE_OBJECTS=1` |
| greffes (`info/grafts`) | 35 | `GIT_GRAFT_FILE=/dev/null` |
| `.gitattributes` non commité de l'arbre de travail | 41 | `--attr-source=<premier parent>` |
| `merge.default=union` dans la configuration du dépôt | 41 | `-c merge.default=text` |
| `merge.text.driver true` (second tour, attaque 4) | 41 | aucune : elle n'était pas fermée |
| `info/attributes` du dépôt | 41 | le refus « attributs locaux », sortie 21 : il n'a plus lieu d'être, le dépôt réel peut en porter |
| `merge.ours.driver true` avec `merge=ours` commité (second tour, attaque 3, avec configuration) | 42 | aucune : elle n'était pas fermée |
| la configuration de l'utilisateur (`~/.gitconfig` à `merge.default=union`) | 41 | `-c merge.default=text` ; sous S1, c'est la mutation 23 qui la rougit |

**Ce qui a demandé une garde de plus**, parce que S1 à S4 ne le couvrent pas :

- **`-c core.quotePath=false`**, écrit sur chaque commande du dépôt propre : sans lui, un dépôt sans configuration cite les chemins accentués, et un index au chemin accentué passerait pour un chemin cité (cas 40, mutation 26). Ce n'est pas une parade contre un poste, c'est le format que le script lit.
- **`--no-renames`** sur `git diff-tree` : de même, un format (cas 38, mutation 25).
- **Oublier les variables `GIT_*` héritées** : c'est dans l'énoncé de S1, mais cela vaut aussi pour les trois questions posées au dépôt réel ; un `GIT_DIR` hérité ferait répondre un autre dépôt (cas 39, mutation 24).
- **Le chemin cité hors index, les arguments jamais recopiés, `HEAD` et les réfs symboliques refusés, le lien symbolique** : ce sont des règles sur ce que le script lit et écrit, pas sur le poste (cas 36, 37, 22).
- **La règle du conflit** (Décision 7) reste nécessaire à côté de S2 : avec un vrai sommet de la cible en second parent, une fusion sans conflit peut encore écraser un index sans commande par celui de la cible (cas 31, b, mutation 21).

**S4 seule, sous S1** : retirer `--attr-source` ne rougit aucun cas sur git 2.43 (mutation 35). Le dépôt propre est nu et son `HEAD` ne désigne rien : git n'y trouve aucun attribut à lire. S4 est écrite quand même, parce que c'est la règle de l'architecte et qu'un autre git pourrait lire autrement ; ce qu'elle interdit est prouvé par la mutation 34 (les attributs lus dans l'arbre du premier parent, comme le faisait `A-114` : le cas 42 rougit).

**Limite de S4, à connaître** : une fusion **réelle** faite sous un pilote s'écarte de la fusion nue. Un projet qui déclare `merge=union` (ou tout autre pilote) sur un fichier verra ses PR rendre « différent », donc être relues, après chaque mise à jour du capitaine qui fusionne ce fichier des deux côtés. C'est le côté sûr : sous `merge=union`, git mêle deux contenus sans conflit, et personne n'a relu le résultat (cas 42).

## À faire, dans l'ordre

1. Partir d'`origin/main` à jour. Relever sa version (`.claude-plugin/plugin.json`) et vérifier que `skills/chaine/fusionner/scripts/` ne porte pas déjà un `meme-contenu.*`.
2. Créer `skills/chaine/fusionner/scripts/meme-contenu.sh` avec le contenu de l'annexe A, **mot pour mot**, puis `chmod +x` (mode `100755` dans git, comme `passer.sh`). Contrôle : `git hash-object skills/chaine/fusionner/scripts/meme-contenu.sh` rend `6c43a791684235e8ac4cf88edbcbb12e5a1bfc34`.
3. Créer `skills/chaine/fusionner/scripts/meme-contenu.test.mjs` avec le contenu de l'annexe B, mot pour mot. Contrôle : `git hash-object` rend `0db4237f38242332dc5ef48970b5cf539de2a633`.
4. `node --test skills/chaine/fusionner/scripts/meme-contenu.test.mjs` : 47 tests, tous verts. Un cas rouge ne se corrige pas en changeant ce qu'il attend : il se dit au lanceur, avec sa sortie. Un cas rouge sur un autre git que celui de l'écriture se dit aussi, avec `git --version`. Si c'est le cas 12 ou le cas 13 (ils appellent `passer.sh` et `sujet.sh fusionner`), regarder d'abord si un ticket de l'autre programme, entré depuis, a changé l'appel ou les sorties de ces scripts : seule la ligne d'appel ou la sortie attendue du script du capitaine se recale alors, jamais le verdict attendu du calcul.
5. Les mutations de « Vérification », une à la fois, chacune retirée avant la suivante.
6. La version et la note (Décision 11).
7. La suite entière : `pnpm install --frozen-lockfile`, puis `pnpm test`, verte. Relever la durée du test « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » (plafond de 600 s, `scripts/poses.test.mjs:49`, `:75`).
8. Reprendre `main`, recaler version et note, rejouer l'étape 7 si `main` a bougé, puis livrer : une PR vers `main`, selon la procédure du dépôt.

## Les cas du banc, un par un

Vocabulaire du tableau. **Jouet** : `depotJouet()`, soit `develop` avec un commit initial (`README.md`, `scripts/docs/adr-index.mjs`, `scripts/docs/index-generes.json` qui déclare `docs/adr/README.md` à commande, `docs/adr/README.md` vide). **Pousser `b` { fichiers }** : un commit sur la branche `b` (créée depuis `origin/develop` si elle n'existe pas), poussé, puis `git fetch`. **Mise à jour** : les gestes du capitaine, `git switch -C capitaine/… origin/<tête>`, `git merge -q --no-edit origin/<cible>` ; en conflit, `git checkout --theirs -- <fichiers en conflit>` et `git add` ; la régénération quand le cas en nomme une ; puis `git commit --no-edit` si la fusion était en conflit, sinon, si quelque chose a changé, `git commit -m 'docs: régénère les index après mise à jour avec <cible>'` ; `git push origin HEAD:refs/heads/<tête>`. **Index(a, b)** : le contenu `- a⏎- b⏎` de `docs/adr/README.md`. Sauf mention, `<B>` est `develop`. Dans la colonne « Attendu », le mot en police fixe est la sortie standard, entière ; le texte entre guillemets est lu sur la sortie d'erreur.

### « même » (code 0)

| n° | Montage | Attendu |
| -- | ------- | ------- |
| 1 | Pousser `feat/a` { `apps/a.ts` } = V. Appels `(V, V, develop)` et `(V, V, sujet/inconnu)`. | `même`, « V est T », les deux fois : la cible n'est pas lue |
| 2 | **Retard sans conflit.** Pousser `feat/a` { `apps/a.ts` } = V. Pousser `develop` { `docs/b.md` }. Mise à jour de `feat/a`, sans régénération = T (fusion à deux parents). | `même`, « 1 fusion(s) de origin/develop, 0 commit(s) d'index » |
| 3 | **Retard sans conflit, index périmé.** Pousser `feat/a` { `docs/adr/ADR_1.md` } = V (index non régénéré). Pousser `develop` { `docs/b.md` }. Mise à jour avec `node scripts/docs/adr-index.mjs` = T : un commit à un parent, dont le parent est la fusion ; `T:docs/adr/README.md` = Index(ADR_1.md). | `même`, « 1 fusion(s) …, 1 commit(s) d'index » |
| 4 | **Conflit d'index.** Pousser `feat/a` { `docs/adr/ADR_1.md`, README = Index(ADR_1.md) } = V. Pousser `develop` { `docs/adr/ADR_2.md`, README = Index(ADR_2.md) }. Mise à jour avec régénération = T : fusion dont le README est Index(ADR_1.md, ADR_2.md), ni celui de la cible ni celui de la fusion calculée. | `même`, « 1 fusion » |
| 5 | **Deux mises à jour de suite, puis la cible qui avance.** Suite du cas 4 (T1). Pousser `develop` { `docs/adr/ADR_3.md`, README = Index(ADR_2.md, ADR_3.md), `apps/c.ts` }. Seconde mise à jour avec régénération = T2 (`T2^1` = T1). Puis pousser `develop` { `docs/adr/ADR_4.md`, README = Index(ADR_2.md, ADR_3.md, ADR_4.md) }, sans mise à jour. | `(V, T2)` : `même`, « 2 fusion(s) » ; `(T1, T2)` : `même`, « 1 fusion(s) » ; `(V, T2)` après l'avance de la cible : `même` encore |
| 6 | **Index sans commande.** Pousser `develop` { `docs/registre.md` = `base` }, puis la liste `[docs/adr/README.md à commande, "docs/registre.md"]`. Pousser `feat/a` { `docs/registre.md` = `pr`, `apps/a.ts` } = V. Pousser `develop` { `docs/registre.md` = `cible` }. Mise à jour sans régénération = T : conflit sur le registre, côté de la cible ; son blob dans T est celui de la cible fusionnée. Puis pousser `develop` { `docs/registre.md` = `cible, plus tard` }. | `même` ; `même` encore après que la cible a récrit le registre (jamais le sommet courant : rapport § 2.2, limite 1) |
| 7 | **Index déclaré par motif.** Pousser `develop` { `docs/gen/a.md` = `base` }, puis la liste `[…, { chemin: "docs/gen/*.md", commande: "true" }]`. Pousser `feat/a` { `docs/gen/a.md` = `pr`, `apps/a.ts` } = V. Pousser `develop` { `docs/gen/a.md` = `cible` }. Mise à jour sans régénération = T : `T:docs/gen/a.md` = `cible`. | `même` |
| 8 | **La cible annule un changement identique entre deux mises à jour** (rapport § 2.2, limite 3). Pousser `develop` { `f` = `a` }. Pousser `feat/a` { `f` = `b`, `p` = `pr` } = V. Pousser `develop` { `f` = `b` }. Mise à jour = T1. Pousser `develop` { `f` = `a` }. Mise à jour = T2. Preuves du montage : `T2:f` = `a` (le changement est perdu) ; l'arbre de `git merge-tree --write-tree V origin/develop` n'est pas celui de T2 (la définition par M disait « différent »). | `(V, T1)` : `même` ; `(V, T2)` : `même`, « 2 fusion(s) » |
| 9 | **Deux bases de fusion : la sous-PR a fusionné develop elle-même** (rapport § 2.2, limite 4). Pousser `sujet/x` { `s` }. Pousser `travail`, depuis `origin/sujet/x`, { `p` } = V. Pousser `develop` { `dev` }. Sur `travail`, `git merge -q --no-edit origin/develop`, poussé = T0. Appel `(V, T0, sujet/x)`. Puis `sujet/x` reçoit develop (`git merge -q --no-edit origin/develop`, poussé) : `git merge-base --all T0 origin/sujet/x` rend deux lignes. Appel `(V, T0, sujet/x)`. Puis mise à jour de `travail` avec `sujet/x` = T1. | `(V, T0)` avant et après que le sujet a reçu develop, et `(V, T1)` : `différent`, « second parent … pas sur la ligne des premiers parents de origin/sujet/x » (S2 : ce commit de develop n'a jamais été le sommet du sujet) ; `(T0, T1, sujet/x)` : `même`, « 1 fusion(s) de origin/sujet/x » |
| 10 | **Une sous-PR mise à jour avec son sujet, après que le sujet a reçu develop.** Pousser `sujet/x` { `s` }. Pousser `travail`, depuis `origin/sujet/x`, { `p` } = V. Pousser `develop` { `dev` }. `sujet/x` reçoit develop (`git merge -q --no-edit origin/develop`, poussé : son premier parent reste le sujet). Mise à jour de `travail` avec `sujet/x` = T1. Pousser `sujet/x` { `autre` } ; seconde mise à jour = T2. | `(V, T1, sujet/x)` : `même`, « 1 fusion(s) de origin/sujet/x » ; `(V, T2, sujet/x)` : `même`, « 2 fusion(s) » |
| 11 | **Commit vide.** Pousser `feat/a` { `apps/a.ts` } = V. `git commit --allow-empty` = T. | `même`, « 0 fusion(s) …, 1 commit(s) d'index » |
| 12 | **Par `passer.sh`.** Le montage de « cible qui bouge pendant la CI » de `fusionner.test.mjs` (`cibleQuiBouge(1)`) : `feat/b` { `docs/b.md` } = V, `develop` avance d'un commit, une branche `ailleurs` que `develop` rejoint pendant la CI (`pendantCi`), PR 40 étiquetée, check `qualite` en cours puis vert, `strict`. `passer.sh 40` sort en 0 après deux « mise à jour poussée ». T = `origin/feat/b` ; `T^1^1` = V. | `même`, « 2 fusion(s) de origin/develop, 0 commit(s) d'index » |
| 13 | **Par `sujet.sh fusionner`.** Le montage de « conflit sur un index généré seul » de `sujet-fusionner.test.mjs` : `develop` porte l'ADR 1 et son index ; `docs/sous` { ADR 2, index (1, 2) } = V ; `sujet/lot` { ADR 3, index (1, 3) } ; PR 80 vers `sujet/lot`. `sujet.sh fusionner 80` sort en 8. T = `origin/docs/sous` ; `T^1` = V ; son index est (1, 2, 3). | `(V, T, sujet/lot)` : `même`, « 1 fusion(s) de origin/sujet/lot » ; `(V, T, develop)` : `différent`, « second parent … pas sur la ligne des premiers parents de origin/develop » (B est la base de la PR, pas une autre) |

### « différent » (code 20)

| n° | Montage | Attendu |
| -- | ------- | ------- |
| 14 | **Un commit de l'auteur après V.** Pousser `feat/a` { `apps/a.ts` = `a` } = V, puis { `apps/a.ts` = `a2` } = T. Puis pousser `develop` { `docs/b.md` } et mise à jour = T2. | `(V, T)` : `différent`, « n'est ni une fusion de la cible ni un commit d'index : apps/a.ts n'est pas un index généré » ; `(V, T2)` : `différent` ; `(T, T2)` : `même` |
| 15 | **Conflit hors index, résolu à la main** (c'est aussi la résolution d'un conflit de pile, `passer.sh:234-251`). Pousser `develop` { `apps/a.ts` = `base` }. Pousser `feat/a` { `apps/a.ts` = `pr` } = V. Pousser `develop` { `apps/a.ts` = `cible` }. Sur `feat/a` : `git merge origin/develop` (conflit), `git checkout --ours -- apps/a.ts`, `git add`, `git commit --no-edit` = T. | `différent`, « s'écarte de la fusion calculée de ses parents : apps/a.ts … » |
| 16 | **Fusion propre retouchée** (un reformatage par le `pre-commit`, un fichier glissé). V comme au cas 2, `develop` avance. Sur `feat/a` : `git merge -q --no-edit origin/develop`, puis `apps/a.ts` récrit et `git commit --amend --no-edit` = T (toujours deux parents). | `différent`, « s'écarte de la fusion calculée … apps/a.ts » |
| 17 | **Second parent hors de la cible.** Pousser `feat/a` = V. Pousser `autre` { `apps/autre.ts` } (jamais fusionnée dans `develop`). Sur `feat/a` : `git merge -q --no-edit origin/autre` = T. | `différent`, « second parent … pas sur la ligne des premiers parents de origin/develop » |
| 18 | **V absent de la ligne des premiers parents.** (a) T = le sommet d'une autre branche, `feat/b`. (b) Pousser `develop` { `docs/b.md` } ; branche `inverse` depuis `origin/develop`, `git merge --no-ff origin/feat/a` = T : V est le **second** parent de T. (c) Sur `feat/a`, `git commit --amend -m …` = T (réécriture, même contenu). (d) V = `000…01`, un sha qui n'existe pas. | (a), (b), (c) : `différent`, « n'est pas sur la ligne des premiers parents » ; (d) : `différent`, « V introuvable » |
| 19 | **Commit d'index qui touche aussi un autre fichier.** Pousser `feat/a` { `docs/adr/ADR_1.md` } = V ; puis { README = Index(ADR_1.md) } = T1 ; puis { README récrit, `apps/a.ts` } = T2. | `(V, T1)` : `même`, « 1 commit(s) d'index » ; `(V, T2)` : `différent`, « apps/a.ts n'est pas un index généré » |
| 20 | **Index sans commande, quatre refus.** Liste et registre du cas 6 ; V = `feat/a` { registre = `pr` } ; `develop` { registre = `cible` }. Depuis V, `git merge origin/develop` (conflit), résolu : (a) par un troisième contenu ; (b) par `git checkout --ours` (le côté de la PR) ; (c) par `git rm`. (d) Un commit à un parent, sur `feat/a`, qui récrit le registre. | (a), (b), (c) : `différent`, « n'a pas le contenu de la cible fusionnée » ; (d) : `différent`, « change dans un commit d'index : aucun contenu connu » |
| 21 | **Index par motif, deux refus.** Liste `[…, { chemin: "apps/gen/*.ts", commande: "true" }]`. V = `feat/a` { `apps/a.ts` } ; `develop` avance. (a) Fusion propre amendée pour ajouter `apps/gen/glisse.ts`. (b) Un commit à un parent, depuis V, qui ajoute `apps/gen/glisse.ts`. | (a) : `différent`, « n'est pas en conflit dans la fusion calculée » ; (b) : `différent`, « aucun contenu connu » |
| 22 | **Lien symbolique.** V = `feat/a`. Un commit qui remplace `docs/adr/README.md` par un lien vers `../../apps/a.ts` = T. | `différent`, « index généré, n'est plus un fichier ordinaire » |
| 23 | **Trois parents.** V = `feat/a` ; pousser `autre` ; pousser `develop` ; sur `feat/a`, `git merge -q --no-edit origin/develop origin/autre` = T (trois parents). | `différent`, « fusion à plus de deux parents » |
| 24 | **La liste se lit sur la cible.** (a) Pousser `feat/a` { la liste, qui déclare en plus `apps/a.ts` à commande ; `apps/a.ts` } = V, puis { `apps/a.ts` récrit } = T ; l'arbre de travail est sur `feat/a`, sa liste nomme `apps/a.ts`. (b) Une cible `sans-liste`, où le fichier de liste est supprimé ; `feat/c` depuis elle = W, puis { `docs/adr/README.md` } = T ; appel `(W, T, sans-liste)`. | (a) : `différent`, « apps/a.ts n'est pas un index généré de origin/develop » ; (b) : `différent`, « docs/adr/README.md n'est pas un index généré de origin/sans-liste » |
| 25 | **Nom de fichier à saut de ligne.** V = `feat/a`. Un commit qui ajoute le fichier nommé `docs/adr/README.md⏎docs/adr/README.md` = T. | `différent`, « n'est pas un index généré » |

### « illisible » (code 21, ou 69) : jamais « même »

Montage commun : le cas 2 (V, T, une fusion propre).

| n° | Appel ou montage | Attendu |
| -- | ---------------- | ------- |
| 26 | `<B>` = `sujet/inconnu` · T = `000…01` · V réduit à 12 caractères · T = `origin/feat/a` (ni l'un ni l'autre recopié) · `<B>` = `a..b` · deux arguments · depuis un dossier hors de tout dépôt (`GIT_CEILING_DIRECTORIES` posé) · la liste de la cible remplacée tour à tour par `{`, `{"index":"x"}`, `{"index":[{"commande":"x"}]}`, `{"index":[42]}`, `[]` | chaque fois 21 et `illisible`, avec sa raison (« origin/sujet/inconnu introuvable », « T introuvable », « V n'est pas un sha de 40 caractères », « T n'est pas un sha… », « nom de branche cible invalide », l'usage, « pas dans un dépôt git », « index-generes.json de origin/develop mal formé ») |
| 27 | Un clone `--depth 1 --no-single-branch` de l'origin du jouet ; appel depuis lui. | 21, « clone superficiel » |
| 28 | Un faux `git` en tête de `PATH` qui sort en 129 sur `merge-tree` (celui de `sujet-fusionner.test.mjs:381-388`). | 21, « git merge-tree --write-tree en échec (129) » |
| 29 | Un `PATH` qui ne porte que `bash` ; puis `bash` et `git` ; puis `bash`, `git`, `jq` ; puis `bash`, `git`, `jq`, `mktemp`. | 69 et `illisible` chaque fois : « git est requis », « jq est requis », « mktemp est requis », « rm est requis » |

### Les attaques des deux tours de relecture adversariale (`A-114`, `A-119`), et celles de la même famille

Chacune rendait `même` (ou manquait `illisible`) sur la version que le tour relisait, sauf mention. Les réglages se posent dans la configuration du dépôt jouet (`git config …`), jamais dans celle du poste.

| n° | Montage | Attendu |
| -- | ------- | ------- |
| 30 | **Outil absent.** Un `PATH` réduit à `bash`, `git`, `jq`, `mktemp` et `rm` (ni `awk`, ni `grep`, ni `sed`). V = `feat/a` { `docs/adr/ADR_1.md` } ; `develop` avance ; mise à jour avec régénération = T (une fusion, un commit d'index) ; puis un commit de l'auteur { `apps/a.ts` } = U. | `(V, T)` : `même`, « 1 fusion(s) …, 1 commit(s) d'index » ; `(V, U)` : `différent`, « apps/a.ts n'est pas un index généré » |
| 31 | **Une fusion qui recule un index sans commande, ou l'écrase hors de tout conflit.** `develop` : D1 { registre = `ligne1⏎l2…l8`, la liste `[…, "docs/registre.md"]` }, puis D2 { `ligne2` ajoutée sous `ligne1` }. V = `feat/a`, depuis D2, { `lignePR` ajoutée en bas du registre }. Une fusion s'écrit à la main : `git read-tree <arbre>` ; `git update-index --cacheinfo 100644,<blob du registre de la source>,docs/registre.md` ; `T=$(git commit-tree $(git write-tree) -p V -p <second parent> -m x)`. (a) Arbre de V, registre de D1, second parent D1 : le registre recule. (b) `develop` : D3 { `ligne0` ajoutée en haut }. Arbre de `git merge-tree --write-tree V D3` (fusion sans conflit, les deux ajouts), registre de D3, second parent D3 : `lignePR` disparaît. | (a) : `différent`, « second parent … déjà ancêtre de son premier parent » (S2) ; (b) : `différent`, « docs/registre.md, index sans commande ou déclaré par motif, n'est pas en conflit dans la fusion calculée » |
| 32 | **Un conflit fabriqué par un second parent latéral** (second tour, attaque 1). `develop` : D0 { registre = `a⏎…⏎j`, la liste `[…, "docs/registre.md"]` }. `sujet/s`, depuis D0 : SK { `ligneS` ajoutée en bas }. `develop` : DJ { `ligne2` ajoutée en haut }. V = `feat/a`, depuis DJ, { `ligneP` ajoutée en bas }. `develop` fusionne `sujet/s` (`git merge --no-ff`), poussé : SK est un ancêtre de la cible, par un second parent. `git merge-tree --write-tree V SK` sort en 1 (conflit sur le registre) ; `git read-tree <son arbre>` ; registre := blob de SK ; `T=$(git commit-tree $(git write-tree) -p V -p SK -m x)`. `T:docs/registre.md` ne porte plus `ligne2`. | `différent`, « second parent … pas sur la ligne des premiers parents de origin/develop » |
| 33 | **Un sous-module déplacé.** V porte `.gitmodules` (`ignore = all` pour `vendor/lib`) et un sous-module `vendor/lib` (`git update-index --add --cacheinfo 160000,<sha>,vendor/lib`). T = un commit qui le déplace (`--cacheinfo 160000,<autre sha>,vendor/lib`). Rejoué avec `diff.ignoreSubmodules=all`. | `différent` les deux fois, « vendor/lib n'est pas un index généré » |
| 34 | **Depuis un sous-dossier, sous `diff.relative=true`.** Appels lancés depuis `docs/adr`. (a) V = `feat/a` { `apps/a.ts` }, T = { `apps/a.ts` récrit }. (b) W = `feat/c` { `docs/adr/ADR_1.md` }, X = { README = Index(ADR_1.md) }. | (a) : `différent`, « apps/a.ts n'est pas un index généré » ; (b) : `même`, « 1 commit(s) d'index » (la liste de la cible est trouvée) |
| 35 | **`git replace` et greffe.** V, puis T = { `apps/a.ts` récrit }. (a) `git replace T <commit vide posé sur V>`. (b) Le remplacement retiré ; un commit R qui remet `apps/a.ts` comme en V (l'arbre de R est celui de V) ; `.git/info/grafts` = `R V`. | (a) `(V, T)` : `différent` ; (b) `(V, R)` : `différent`, « apps/a.ts n'est pas un index généré » (le commit de l'auteur est lu) |
| 36 | **Un chemin de la liste écrit comme git cite.** La liste porte `{ "chemin": "\"apps/a\\tb.ts\"", "commande": "true" }`. V = `feat/a` { le fichier `apps/a<TAB>b.ts` }, T = le même fichier récrit. | `différent`, « n'est pas un index généré » |
| 37 | **Arguments hostiles.** V = `x⏎même` ; T = `<T>⏎même` ; `<B>` = `develop⏎même` ; V = `<V>⏎`. Puis, `refs/remotes/origin/HEAD` et `refs/remotes/origin/alias` posées en réfs symboliques vers `origin/develop` : `<B>` = `HEAD`, `<B>` = `alias`. | chaque fois 21, la sortie standard vaut exactement `illisible⏎`, la sortie d'erreur tient en une ligne et ne porte pas `même` ; `HEAD` : « nom de branche cible invalide » ; `alias` : « réf symbolique » |
| 38 | **Un fichier renommé vers le chemin d'un index, sous `diff.renames=copies`.** La liste porte `docs/agents/couts.md` à commande. V = `feat/a` { `apps/a.ts` } ; T = `git mv apps/a.ts docs/agents/couts.md`. | `différent`, « apps/a.ts n'est pas un index généré » (la suppression est lue) |
| 39 | **`GIT_DIR` et `GIT_WORK_TREE` hérités d'un autre dépôt.** Un second clone, dont `refs/remotes/origin/develop` est déplacée sur un commit qui déclare `apps/a.ts` index à commande. V, T = { `apps/a.ts` récrit }. Appel depuis le second clone, puis depuis le premier avec `GIT_DIR` et `GIT_WORK_TREE` pointés sur le second. | depuis le second clone : `même` (le piège y est réel) ; depuis le premier, variables héritées : `différent`, « apps/a.ts n'est pas un index généré de origin/develop » |
| 40 | **`core.quotePath`.** La liste porte `docs/métier/index.md` à commande. V, T = { `docs/métier/index.md` }. Rejoué avec `core.quotePath=true`, puis `false`. | `même` les deux fois, « 1 commit(s) d'index » |
| 41 | **Les attributs et les pilotes de fusion, où qu'ils soient écrits.** `develop` { `apps/a.ts` = `base⏎l2⏎l3` } ; V = `feat/a` { `pr⏎l2⏎l3` } ; `develop` { `cible⏎l2⏎l3` }. Sur `feat/a`, `git merge origin/develop` (conflit), résolu à la main par les deux côtés l'un sous l'autre (`pr⏎cible⏎l2⏎l3`, ce qu'un pilote `union` écrirait) = T. Six appels : tel quel ; avec un `.gitattributes` **non commité** dans l'arbre de travail (`apps/a.ts merge=union`) ; avec `merge.default=union` dans la configuration du dépôt ; avec `merge.text.driver=true` (second tour, attaque 4) ; avec `.git/info/attributes` = `apps/a.ts merge=union` ; avec un `HOME` dont le `.gitconfig` porte `merge.default=union`. | `différent` les six fois, « s'écarte de la fusion calculée … apps/a.ts » |
| 42 | **Un pilote de fusion commité avec V** (second tour, attaque 3). `develop` { `apps/auth.ts` = `base⏎l2⏎l3` }. Deux PR, `feat/union` et `feat/ours` : V = { `.gitattributes` = `apps/auth.ts merge=union` (ou `merge=ours`), `apps/auth.ts` = `pr⏎l2⏎l3` }. `develop` { `apps/auth.ts` = `correctif⏎l2⏎l3` }. Mise à jour de `feat/union`, sans aucune configuration : git mêle sans conflit, `T:apps/auth.ts` = `pr⏎correctif⏎l2⏎l3`. Puis `git config merge.ours.driver true` et mise à jour de `feat/ours` : `T:apps/auth.ts` = `pr⏎l2⏎l3`, le correctif de la cible est perdu. | `différent` les deux fois, « s'écarte de la fusion calculée … apps/auth.ts » (S4) |
| 43 | **Lectures vides ou incohérentes.** V, T = un commit de l'auteur. Un faux `git` en tête de `PATH`, muet et en sortie 0 tour à tour pour `diff-tree`, pour `rev-list --first-parent`, pour `rev-list --parents`, pour `rev-parse <T>^{tree}`, pour `rev-list --count`. | 21 chaque fois : « écart de … illisible », « ligne des premiers parents de T illisible », « parents de … illisibles », « arbre de … illisible », « compte des commits de V à T incohérent » |
| 44 | **git plus ancien que 2.41** (second tour, constat 5). Un faux `git` qui répond `git version 2.40.1`, puis `git version 1.9.5 (Apple Git-50)`, puis `2.41.0`, puis `3.0.0`. V, T = un commit de l'auteur. | 69 et `illisible`, « git ≥ 2.41 requis, ici 2.40 », puis « … ici 1.9 » ; `différent` aux deux derniers (le calcul tourne) |
| 45 | **S1 : le dépôt propre.** Le conflit d'index du cas 4 (V, T), `TMPDIR` posé sur un dossier vide. Puis `TMPDIR` posé sur un dossier qui n'existe pas, puis sur un fichier. | `même`, le dossier de `TMPDIR` est vide après l'appel, et `git count-objects -v` du dépôt réel n'a pas bougé (la fusion calculée ne s'y écrit pas) ; puis 21 deux fois, « dossier temporaire impossible à créer » |
| 46 | **S3 : aucun here-document, et un long écart** (second tour, attaque 2). Le texte du script, hors commentaires, ne porte ni `<<`, ni substitution de processus, ni tube vers `read`, `while` ou `mapfile`. V = `feat/a` ; T = un commit de 2 500 fichiers sous `apps/gros/`. Puis la liste porte 200 index à commande `gen/f<i>.md` ; W = `feat/b` ; X = un commit de ces 200 fichiers et de `zzz/dernier.ts`. | `(V, T)` : `différent`, « apps/gros/f0.ts n'est pas un index généré » ; `(W, X)` : `différent`, « zzz/dernier.ts n'est pas un index généré » (la dernière ligne de l'écart est lue) |
| 47 | **S3 : le compte.** V, puis un commit de l'auteur { `apps/a.ts` }, puis un commit vide = T. Un faux `git` dont `rev-list … --reverse` ne rend que V et T (le commit de l'auteur sauté : seul le commit vide serait jugé) ; puis un faux `git` dont `rev-list --count` rend 1. | sans faux git : `différent` ; puis 21 deux fois, « compte des commits de V à T incohérent » |

## Surfaces

| Surface | Preuve (cas du banc `meme-contenu.test.mjs`) |
| ------- | -------------------------------------------- |
| `même` quand V est T, sans lire la cible | cas 1 |
| une mise à jour : arbre de la fusion calculée de ses deux parents | cas 2, 5, 15, 16 |
| S2 : le second parent a été le sommet de `origin/<B>`, n'est pas un ancêtre du premier, et `<B>` est la base de la PR | cas 9, 10, 13, 17, 31, 32 |
| V sur la ligne des premiers parents de T ; V introuvable | cas 18 |
| un commit qui ne touche que des index générés ; un commit vide | cas 3, 11, 14, 19 |
| classe « régénéré » | cas 3, 4, 5, 22 |
| classe « sans commande » : en conflit seulement, contre le second parent et jamais le sommet courant | cas 6, 20, 31 |
| classe « motif » | cas 7, 21 |
| une fusion à plus de deux parents | cas 23 |
| la liste lue sur la cible, jamais sur la PR ni dans l'arbre de travail ; cible sans liste | cas 24, 34, 39 |
| un chemin cité par git n'est jamais un index | cas 25, 36 |
| le cas que la définition par M jugeait mal et qui rend `même` ; celui que S2 rend `différent` | cas 8 ; cas 9 |
| les commits que `passer.sh` et `sujet.sh fusionner` écrivent | cas 12, 13 |
| S1 : le dépôt propre, créé, retiré ; le dépôt réel jamais écrit ; ni configuration, ni attributs, ni remplacement, ni greffe, ni dossier courant, ni variable héritée | cas 33, 34, 35, 39, 41, 45 |
| S3 : aucun here-document, un compte confronté, une lecture vide ou incohérente est `illisible` | cas 43, 46, 47 |
| S4 : la fusion à trois voies nue ; git ≥ 2.41 | cas 41, 42, 44 |
| quatre outils et pas un de plus | cas 29, 30 |
| la sortie standard ne porte que le verdict ; aucun argument recopié ; `<B>` est une branche | cas 37 |
| `illisible`, sorties 21 et 69, jamais `même` | cas 26, 27, 28, 29, 43, 44, 45, 47 |
| version et note | les tests de version de `scripts/depot.test.mjs` (« la règle d'ascendance du plugin 7.16.0 : version, note de version en tête… ») |

Le cas n est le n-ième test du banc, dans l'ordre du fichier.

## Vérification

1. `node --test skills/chaine/fusionner/scripts/meme-contenu.test.mjs` : 47 tests verts (environ 30 s à l'écriture, dont environ 5 s pour les cas 12 et 13 et 3 s pour le cas 46).
2. **Les mutations**, chacune appliquée seule à `meme-contenu.sh`, le banc rejoué, puis retirée. Chacune doit rougir au moins le cas nommé, sauf la 35, qui survit et dit pourquoi ; toutes ont été jouées à l'écriture.

   | n° | Mutation | Test qui rougit, au moins |
   | -- | -------- | ------------------------- |
   | 1 | **S2 : revenir à l'ancienne règle**, le second parent simple ancêtre de la cible (`git merge-base --is-ancestor p2 origin/<B>`) | cas 32 (et 9) |
   | 2 | S2 : admettre un second parent déjà ancêtre du premier | cas 31 |
   | 3 | ne plus vérifier le second parent du tout | cas 17 (et 9, 13, 32) |
   | 4 | comparer les index aussi : `classe` rend toujours `hors` | cas 3, 4 (et une quinzaine d'autres) |
   | 5 | accepter un commit quelconque : pour un commit à un parent, l'arbre de départ est celui du commit | cas 14, 19 (et une quinzaine d'autres) |
   | 6 | lire la liste dans l'arbre de travail d'abord : `cat scripts/docs/index-generes.json \|\| git cat-file blob …` | cas 24 (et 39) |
   | 7 | suivre tous les parents pour la ligne de T : `--topo-order --reverse` à la place de `--first-parent --reverse` | cas 18 (et presque tous les autres) |
   | 8 | tolérer un `git merge-tree` en échec : sans arbre calculé, prendre celui du commit | cas 28 |
   | 9 | dispenser un index sans commande ou sous motif en conflit sans le comparer au second parent | cas 20 |
   | 10 | ne plus comparer l'arbre d'une fusion à la fusion calculée | cas 15, 16 (et 20, 21, 31, 41, 42) |
   | 11 | prendre pour contenu connu le sommet courant de la cible | cas 6 |
   | 12 | dispenser un index régénéré devenu lien symbolique | cas 22 |
   | 13 | accepter un clone superficiel | cas 27 |
   | 14 | accepter une fusion à plus de deux parents | cas 23 |
   | 15 | prendre un index sous motif pour un index régénéré | cas 21 |
   | 16 | dispenser un index sans commande ou sous motif dans un commit à un parent | cas 20, 21 |
   | 17 | tolérer une cible absente : `cible=$T` quand `origin/<B>` manque | cas 26 |
   | 18 | lire une liste mal formée comme une liste vide | cas 26 |
   | 19 | ne plus écarter un chemin que git cite | cas 36 |
   | 20 | rendre `même` quand V est introuvable | cas 18 |
   | 21 | dispenser un index sans commande ou sous motif hors conflit | cas 31 (et 21) |
   | 22 | **S1 : calculer dans le dépôt réel** (`git` sans `--git-dir=<dépôt propre>`) | cas 33, 35, 41, 45 |
   | 23 | S1 : ne plus écarter la configuration de l'utilisateur et du poste (`GIT_CONFIG_GLOBAL=/dev/null` et les trois autres retirés) | cas 41 |
   | 24 | garder les variables `GIT_*` héritées | cas 39 |
   | 25 | détecter les renommages : `-M` à la place de `--no-renames` | cas 38 |
   | 26 | retirer `-c core.quotePath=false` | cas 40 |
   | 27 | recopier un argument refusé dans la raison | cas 37 (et 26) |
   | 28 | écrire la raison sur la sortie standard | tous les cas |
   | 29 | accepter `HEAD` comme nom de branche | cas 37 |
   | 30 | accepter une réf symbolique | cas 37 |
   | 31 | tolérer un écart vide entre deux arbres différents | cas 43 |
   | 32 | **S3 : ne plus confronter le compte** des commits, ni avant la boucle ni après | cas 47 |
   | 33 | **S3 : réemployer un here-document** (`mapfile -t LIGNES <<<"$ecart"`) | cas 46 (et dix autres : un écart vide y devient une ligne vide) |
   | 34 | **S4 : lire les attributs dans l'arbre du premier parent** (`--attr-source=<p1>`, la règle d'`A-114`) | cas 42 |
   | 35 | S4 : retirer `--attr-source`, S1 restant | **aucun : elle survit** sur git 2.43 (Décision 13 : le dépôt propre n'a aucun attribut à lire) |
   | 36 | ne plus contrôler la version de git | cas 44 |
   | 37 | S1 : ignorer `TMPDIR`, `/tmp` en dur | cas 45 |
   | 38 | S1 : ne plus retirer le dépôt propre | cas 45 |
   | 39 | ni S1 ni S4 : calculer dans le dépôt réel, sans `--attr-source` | cas 42 (et 33, 35, 41, 45) |

3. La suite entière (`pnpm test`), verte. À l'écriture, sur un clone neuf de `8f8cfd9` : 897 tests, tous verts. Le compte se relève sur le `main` du moment : il bouge à chaque PR de l'autre programme. Le test des bancs posés à plat, qui rejoue ce banc hors du plugin, a pris de 181 à 390 s sur 600 ; ce banc seul y compte pour une trentaine de secondes.
4. `git diff --stat origin/main` : quatre fichiers, dont deux créés. `git diff origin/main -- skills/chaine/sujet/scripts/depot-jouet.mjs` : vide.
5. Le banc ne laisse rien : `TMPDIR=<dossier vide> node --test skills/chaine/fusionner/scripts/meme-contenu.test.mjs`, puis il n'y reste aucun dossier du banc ni du calcul (`jouet-…`, `path-…`, `autre-…`, `maison-…`, `meme-contenu.…`) ; seul un `node-compile-cache`, que Node y pose selon le poste, peut y paraître (vérifié à l'écriture).

## Ce qui n'a pas été établi

1. **Un autre git que le 2.43.0 de l'écriture.** Le contrôle de version refuse tout git plus ancien que 2.41 (joué avec un faux `git version`, cas 44) ; ni 2.41 ni 2.42 n'ont été joués pour de vrai. Sur 2.43, retirer `--attr-source` ne change rien sous S1 (mutation 35) : comment un autre git lirait les attributs d'un dépôt nu sans `HEAD` n'est pas établi, et c'est la raison de garder S4 écrite. bash 3.2 (macOS) rend « illisible » dès la première ligne : écrit, non joué.
2. **Le dépôt propre emprunte les objets du dépôt réel par `objects/info/alternates`.** Joué sur des clones ordinaires. Non joué : un dépôt réel qui emprunte lui-même ses objets ailleurs par un chemin relatif (`git clone --shared`, certains arbres de travail liés), un clone partiel (objets à la demande), un dépôt à `extensions.objectFormat=sha256`. Dans chacun, un objet manquerait au dépôt propre : une commande échouerait, donc « illisible », jamais « même ».
3. **Le dossier temporaire plein** (second tour, attaque 2) : rejoué hors banc sur un tmpfs monté sous `unshare -m` (8 Ko : « illisible », le dépôt propre ne se crée pas ; 64 Ko, 400 Ko, 4 Mo : « différent » pour le commit de 2 500 fichiers). Le banc, lui, ne monte pas de tmpfs (il doit tourner sans droits et hors de Linux) : il vérifie l'absence de here-document dans le texte du script, le dossier temporaire absent, et un long écart (cas 45, 46).
4. **La fusion calculée contre la fusion réelle, hors pilote** : `merge.renames`, `merge.directoryRenames`, `merge.conflictStyle`, la renormalisation des fins de ligne ne pèsent plus sur le calcul (S1), mais ils ont pu peser sur la fusion réelle du poste qui l'a faite. Un écart donnerait « différent », du côté sûr. Non joué.
5. **Le `pre-commit` d'un projet sur une fusion que le capitaine conclut** (rapport § 2.2, limite 5) : rejoué ici par une fusion amendée (cas 16), pas par un vrai `lint-staged`.
6. **Le conflit de pile résolu par `passer.sh`** (même limite) : rejoué par un choix de côté à la main (cas 15), pas par `passer.sh` sur une vraie pile.
7. **Une sous-PR d'un sujet mise à jour deux fois par `sujet.sh fusionner`** : le cas 13 n'en joue qu'une (sortie 8). Les deux mises à jour de suite sont jouées par `passer.sh` (cas 12) et par l'aide du banc (cas 5, 10).
8. **Les cibles dont la ligne des premiers parents n'est pas l'histoire de leurs sommets.** S2 suppose que la cible n'avance que par des commits dont elle est le premier parent : squash, fusion `--no-ff` avec la cible en premier, report de develop dans un sujet, avance rapide jusqu'à une PR de mise à jour dont le premier parent est le sommet du sujet (`verifier_mise_a_jour` l'exige, `sujet.sh:618`). Une cible avancée par une avance rapide vers une fusion **dont elle est le second parent** sortirait ses anciens sommets de cette ligne, et toute mise à jour antérieure rendrait « différent ». Aucun script de la chaîne ne le fait ; non joué.
9. **Un historique très long, une longue liste d'index.** La ligne des premiers parents de la cible est lue en entier à chaque appel ; chaque chemin d'un écart est confronté à la liste par une expression régulière que bash recompile à chaque fois. Avec 200 index et 200 fichiers, le cas 46 prend moins de trois secondes ; avec 2 499 index et autant de fichiers, un essai a dépassé cinq minutes. Non mesuré au-delà.
10. **Les cas 12 et 13 dépendent de l'appel de `passer.sh` et de `sujet.sh fusionner`** tels qu'ils sont sur `main`. Un ticket de l'autre programme qui change cet appel (son ticket 4 rend `CAPITAINE_ID` obligatoire) devra les garder verts ; ils passent par `d.lancer` et `d.env`, donc par l'environnement que `depot-jouet.mjs` donnera alors. Non essayé contre ces tickets, qui ne sont pas sur `main`.
11. **Ce que l'appelant fait de « illisible »** (pause, renvoi, nouvel essai) : lots 4 et 5a. Un git plus ancien que 2.41 et un dossier temporaire plein en sont deux causes de poste, que l'appelant devra dire à un humain plutôt qu'à l'auteur de la PR.
12. **La marge du plafond de 600 s** : le test des bancs posés à plat n'a pas été mesuré sans ce banc.

## Hors périmètre

- Tout appel du calcul : `passer.sh`, `sujet.sh` (lot 5a), le skill `relecteur` (lot 4). Tout `git fetch` : c'est l'appelant qui relit la cible.
- `skills/chaine/sujet/scripts/depot-jouet.mjs` (ticket 13 de l'autre programme, entré ; son ticket 4, à venir) : non modifié. Sa liste `CHAINE`, que `publierChaine()` publie sur le `develop` du jouet, ne nomme pas `meme-contenu.sh` : le lot 5a, qui le fera appeler par la boucle, l'y ajoutera.
- `github.sh` : ses lecteurs d'index (`index_json`, `index_regeneres_regex`, `index_regeneres_motifs_regex`) restent tels quels, arbre de travail d'abord ; `livraison_intermediaire` aussi.
- `skills/chaine/fusionner/references/CONTENU.md`, `fusionner/SKILL.md`, `README.md`, `CONTEXT.md`, `scripts/points-d-entree.test.mjs`, `scripts/poses.test.mjs` : aucune ligne (Décision 12).
- Le lecteur de verdict et la fonction de décision (lot 3a), « double relecture exigée » (lot 3c).

## Comments

- 2026-11-18 — Première version, écrite et jouée sur une copie jetable d'`origin/main` à `99a6214` (plugin 7.18.0 ; la spec et le rapport citent `1c4acb1`, 7.17.0 : `main` a avancé depuis, jusqu'à `22b2d49`, 7.18.1, sans toucher un fichier de la chaîne). Joué : le banc (28 tests), 18 mutations, la suite entière, puis le banc seul sur `22b2d49` depuis les annexes. (Ces comptes sont ceux de la première version : voir l'entrée `A-114`.)
- 2026-11-18 — Décisions de l'architecte portées au ticket (`A-112`) : un index sous motif récrit d'un contenu nouveau donne « différent », la relecture de plus est acceptée ; les choix du rédacteur sont confirmés (commit à un parent, lien symbolique, clone superficiel, commit vide, V introuvable, forme `.sh`, `<B>` nom de branche, codes 0, 20, 21 et 69, cas 8). Base relue : `origin/main` à `22b2d49` (7.18.1). Ni le script ni le banc ne changent, leurs empreintes non plus : rien n'a été rejoué.
- 2026-11-18 — Relecture adversariale : « pas prêt », deux faux « même » (une fusion qui recule un index sans commande ; `git diff` obéissant à la configuration et au dossier courant) et un « illisible » manqué (outil absent). `A-114` adopte toutes ses corrections. Portées ici : la règle du conflit (Décision 7), la plomberie à options écrites (la Décision 13 d'alors, que les règles de structure d'`A-119` remplacent), aucun outil hors git et jq et toute lecture relue (Décision 9), la sortie standard réduite au verdict (Décision 3), le chemin cité hors index (Décision 8, g), la limite des index à commande (Décision 7). Trouvés en plus, de la même famille, et fermés : les attributs de fusion lus dans l'arbre de travail, `merge.default`. Le script est récrit, le banc passe de 28 à 40 cas, les empreintes changent ; base relue, `origin/main` à `e45a504` (7.19.1) ; banc, 38 mutations et suite entière rejoués sur un clone neuf de `6fc652d`, puis banc et suite entière sur un clone neuf de `e45a504`.
- 2026-11-18 — Second tour de relecture adversariale : les huit corrections d'`A-114` sont fermées, trois faux « même » nouveaux sont reproduits (un conflit fabriqué par un second parent latéral ; un dossier temporaire plein, par les here-documents ; un pilote de fusion commité, ou posé dans la configuration). `A-119` : quatre règles de structure, S1 (un dépôt propre pour calculer), S2 (le second parent a été le sommet de la cible et n'est pas un ancêtre du premier), S3 (« même » se prouve par un compte, aucun here-document), S4 (aucun attribut dans la fusion calculée, git ≥ 2.41). Portées ici : Décisions 3, 4, 5, 9 et 13. Les parades d'`A-114` que S1 rend inutiles sont retirées du script ; leurs cas restent au banc. Le cas des deux bases de fusion (limite 4 du rapport) rend désormais « différent » : S2. La condition de rechange proposée pour S2 n'est pas ajoutée (Décision 5). Le script est récrit, le banc passe à 47 cas, les empreintes changent ; base relue, `origin/main` à `8f8cfd9` (7.21.1) ; banc, 39 mutations et suite entière rejoués sur un clone neuf de `8f8cfd9`. `main` est passé à `289323c` (7.22.0) pendant ce rejeu : rien de ce que ce ticket cite n'y a bougé, et rien n'y a été rejoué.

## Annexe A — `skills/chaine/fusionner/scripts/meme-contenu.sh`

`git hash-object` : `6c43a791684235e8ac4cf88edbcbb12e5a1bfc34`.

````bash
#!/usr/bin/env bash
# =============================================================================
# « Même contenu propre » : le sommet d'un verdict (V) et le sommet jugé (T) d'une PR ne sont-ils séparés que par
# des mises à jour avec la cible et des commits d'index générés ? Un seul calcul, pour le capitaine et pour le
# Relecteur.
#
#   bash scripts/chaine/meme-contenu.sh <V> <T> <B>
#
#   <V>  sommet du verdict, sha de 40 caractères
#   <T>  sommet jugé, sha de 40 caractères
#   <B>  branche cible de la PR (`develop`, `sujet/<nom>`), lue dans `refs/remotes/origin/<B>` : qui appelle l'a
#        relue juste avant (`git fetch origin "+refs/heads/<B>:refs/remotes/origin/<B>"`) ; ce script ne lit pas
#        le réseau, ni aucun arbre de travail, et n'écrit rien dans le dépôt.
#
# De V à T, sur la ligne des premiers parents de T, chaque commit est :
#   - une mise à jour : une fusion à deux parents, dont le second est sur la ligne des premiers parents de
#     origin/<B> (il a été un jour le sommet de la cible) sans être un ancêtre du premier (elle apporte quelque
#     chose), et dont l'arbre est celui de la fusion calculée de ses deux parents (`git merge-tree --write-tree`,
#     fusion à trois voies nue, sans aucun attribut ; arbre pris même en conflit), aux index générés près ;
#   - ou un commit à un parent qui ne touche que des index générés.
# Les index générés sont ceux de `origin/<B>:scripts/docs/index-generes.json` (fichier absent : aucun). Un chemin
# en écart est dispensé selon sa classe, dans cet ordre :
#   motif         il touche une entrée à `commande` dont le chemin porte `*` : dispensé seulement dans une fusion,
#                 s'il est en conflit dans la fusion calculée et si son entrée (mode et blob) est celle du second
#                 parent ; hors conflit, il se juge comme tout fichier ;
#   sans-commande aucune entrée à `commande` ne le touche : de même ;
#   régénéré      sinon (un chemin littéral à `commande`) : dispensé, absent ou fichier ordinaire.
# Un index dispensé n'est jamais un lien symbolique ni un sous-module. Un chemin que git cite (il commence par un
# guillemet : caractère de contrôle, guillemet ou barre oblique inverse dans le nom) n'est jamais un index.
#
# Quatre règles de structure :
#   S1  tout calcul se fait dans un dépôt nu jetable, sous le dossier temporaire, qui emprunte les objets du dépôt
#       réel (`objects/info/alternates`) : ni sa configuration, ni celle de l'utilisateur ou du poste, ni ses
#       `info/attributes`, ses greffes ou ses `refs/replace`, ni le dossier courant, ni une variable `GIT_*` héritée
#       n'y pèsent. Le dépôt réel ne dit que trois choses : où sont ses objets, le sha de la cible, s'il est
#       superficiel. Le dépôt propre ne se crée pas : `illisible` ;
#   S2  la fusion admise est celle que dit le premier tiret ci-dessus ;
#   S3  `même` se prouve : le nombre de commits de V à T, compté par git, est celui des commits examinés et
#       acceptés un à un. Toute commande en échec, toute lecture vide là où une ligne est attendue : `illisible`.
#       Aucun here-document, aucun fichier temporaire hors du dossier de S1 ;
#   S4  la fusion calculée ne lit aucun attribut (`--attr-source=<arbre vide>`, git ≥ 2.41) : une fusion faite
#       sous un pilote (`merge=union`, `merge=ours`) s'en écarte, donc `différent`.
#
# Sortie standard : une seule ligne, le verdict. Sortie d'erreur : une ligne, sa raison. Un argument refusé n'est
# jamais recopié. Sorties : 0 `même` · 20 `différent` · 21 `illisible` (usage, dépôt, réf, liste, dossier
# temporaire, git en échec ou lecture vide : jamais `même`) · 69 `illisible`, outil absent (git, jq, mktemp, rm) ou
# git plus ancien que 2.41. Seul 0 vaut `même` : tout autre code (signal, erreur de bash) se lit `illisible`.
# =============================================================================
# Sans `set -e` : le statut de chaque commande est lu, et sa suite écrite (`différent`, `illisible`, ou on continue).
set -uo pipefail
export LC_ALL=C

propre=''
menage() { case $propre in */meme-contenu.??????) rm -rf "$propre" ;; esac; }
trap menage EXIT
rendre() { # <code> <verdict> <raison> : la raison sur une ligne, puis le verdict, seul sur la sortie standard
  printf '%s\n' "${3//[[:cntrl:]]/ }" >&2
  printf '%s\n' "$2"
  exit "$1"
}
meme() { rendre 0 même "$1"; }
different() { rendre 20 différent "$1"; }
illisible() { rendre 21 illisible "$1"; }
SHA='^[0-9a-f]{40}$'
NOMBRE='^(0|[1-9][0-9]*)$'
court() { printf '%s' "${1:0:9}"; }
# Un texte en lignes, dans LIGNES, sans here-document (bash en écrirait un fichier sous le dossier temporaire).
decouper() {
  local IFS=$'\n'
  set -f
  # shellcheck disable=SC2206
  LIGNES=($1)
  set +f
}

[ "${BASH_VERSINFO[0]}" -ge 4 ] || illisible "bash ≥ 4 requis"
[ $# -eq 3 ] || illisible "usage : meme-contenu.sh <V> <T> <B>"
V=$1 T=$2 B=$3
[[ "$V" =~ $SHA ]] || illisible "V n'est pas un sha de 40 caractères"
[[ "$T" =~ $SHA ]] || illisible "T n'est pas un sha de 40 caractères"
for outil in git jq mktemp rm; do
  command -v "$outil" >/dev/null || rendre 69 illisible "$outil est requis par les scripts de la chaîne (jq : sudo apt install jq, ou brew install jq)"
done
# Aucune variable GIT_* héritée, sauf celle qui borne la recherche du dépôt.
for variable in $(compgen -v GIT_); do
  [ "$variable" = GIT_CEILING_DIRECTORIES ] || unset "$variable"
done
version=$(git version 2>/dev/null) || rendre 69 illisible "git version en échec"
[[ "$version" =~ ^git\ version\ ([0-9]+)\.([0-9]+) ]] || rendre 69 illisible "version de git illisible"
[ "${BASH_REMATCH[1]}" -gt 2 ] || { [ "${BASH_REMATCH[1]}" = 2 ] && [ "${BASH_REMATCH[2]}" -ge 41 ]; } ||
  rendre 69 illisible "git ≥ 2.41 requis, ici ${BASH_REMATCH[1]}.${BASH_REMATCH[2]}"

# ── Le dépôt réel : où sont ses objets, le sha de la cible, s'il est superficiel. Rien d'autre. ────────────────
git rev-parse --git-dir >/dev/null 2>&1 || illisible "pas dans un dépôt git"
[[ "$B" != *[[:cntrl:][:space:]]* ]] && [ "$B" != HEAD ] && git check-ref-format "refs/remotes/origin/$B" 2>/dev/null ||
  illisible "nom de branche cible invalide"
! git symbolic-ref -q "refs/remotes/origin/$B" >/dev/null 2>&1 || illisible "origin/$B est une réf symbolique, pas une branche"
objets=$(git rev-parse --path-format=absolute --git-path objects 2>/dev/null) && [[ "$objets" == /* ]] && [[ "$objets" != *$'\n'* ]] && [ -d "$objets" ] ||
  illisible "dossier des objets du dépôt illisible"

# ── S1 : le dépôt propre ────────────────────────────────────────────────────────────────────────────────────
propre=$(mktemp -d "${TMPDIR:-/tmp}/meme-contenu.XXXXXX" 2>/dev/null) && [ -n "$propre" ] && [ -d "$propre" ] ||
  { propre=''; illisible "dossier temporaire impossible à créer (plein ou absent)"; }
p() {
  GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_ATTR_NOSYSTEM=1 \
    git --git-dir="$propre/depot" -c core.quotePath=false "$@"
}
GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null GIT_CONFIG_NOSYSTEM=1 git init -q --bare --template= "$propre/depot" >/dev/null 2>&1 ||
  illisible "dépôt propre impossible à créer sous le dossier temporaire"
printf '%s\n' "$objets" >"$propre/depot/objects/info/alternates" 2>/dev/null || illisible "dépôt propre impossible à écrire sous le dossier temporaire"
VIDE=$(p hash-object -w -t tree --stdin </dev/null 2>/dev/null) && [[ "$VIDE" =~ $SHA ]] || illisible "dépôt propre impossible à écrire sous le dossier temporaire"
p cat-file -e "$T^{commit}" 2>/dev/null || illisible "T introuvable dans ce dépôt : $T"
[ "$V" != "$T" ] || meme "V est T"

superficiel=$(git rev-parse --is-shallow-repository 2>/dev/null) || illisible "git rev-parse --is-shallow-repository en échec"
[ "$superficiel" = false ] || illisible "clone superficiel : l'historique est tronqué (git fetch --unshallow origin)"
cible=$(git rev-parse -q --verify "refs/remotes/origin/$B" 2>/dev/null) && [[ "$cible" =~ $SHA ]] ||
  illisible "origin/$B introuvable : relire la cible d'abord"
p cat-file -e "$cible^{commit}" 2>/dev/null || illisible "origin/$B n'est pas un commit lisible"
p cat-file -e "$V^{commit}" 2>/dev/null || different "V introuvable dans ce dépôt (branche réécrite ?) : $(court "$V")"

# La ligne des premiers parents de T, du plus ancien au plus récent : le chemin est ce qui suit V.
sortie=$(p rev-list --first-parent --reverse "$T" 2>/dev/null) || illisible "git rev-list --first-parent en échec"
decouper "$sortie"
[ "${#LIGNES[@]}" -ge 1 ] && [ "${LIGNES[${#LIGNES[@]} - 1]}" = "$T" ] || illisible "ligne des premiers parents de T illisible"
chemin=()
vu=0
for c in "${LIGNES[@]}"; do
  [[ "$c" =~ $SHA ]] || illisible "ligne des premiers parents de T illisible"
  if [ "$vu" = 1 ]; then chemin+=("$c"); elif [ "$c" = "$V" ]; then vu=1; fi
done
[ "$vu" = 1 ] || different "V ($(court "$V")) n'est pas sur la ligne des premiers parents de T ($(court "$T"))"
# S3 : le nombre de commits à examiner, compté par une autre commande.
attendu=$(p rev-list --count --first-parent "$V..$T" 2>/dev/null) && [[ "$attendu" =~ $NOMBRE ]] && [ "$attendu" -ge 1 ] && [ "$attendu" = "${#chemin[@]}" ] ||
  illisible "compte des commits de V à T incohérent"
# S2 : la ligne des premiers parents de la cible, entre deux sauts de ligne pour y chercher un sha entier.
sortie=$(p rev-list --first-parent "$cible" 2>/dev/null) && [[ "$sortie" == "$cible"* ]] || illisible "ligne des premiers parents de origin/$B illisible"
LIGNE_CIBLE=$'\n'$sortie$'\n'

# La liste des index, sur la cible. Trois expressions régulières (ERE) : tous, ceux à `commande`, ceux à
# `commande` déclarés par motif. `*` vaut `[^/]+` ; tout autre caractère est pris à la lettre.
FORME='(.index | type == "array") and all(.index[];
  if type == "string" then . != ""
  elif type == "object" then (.chemin | type) == "string" and .chemin != "" and ((.commande // "") | type) == "string"
  else false end)'
REGEX='def lettre: gsub("(?<c>[\\[\\]\\\\.^$+?(){}|])"; "\\\(.c)");
  def regex: map(split("*") | map(lettre) | join("[^/]+")) | "^(" + join("|") + ")$";
  [.index[] | if type == "string" then {chemin: ., commande: ""} else {chemin, commande: (.commande // "")} end] |
  (map(.chemin) | regex), (map(select(.commande != "") | .chemin) | regex),
  (map(select(.commande != "" and (.chemin | contains("*"))) | .chemin) | regex)'
sortie=$(p ls-tree --full-tree "$cible" -- scripts/docs/index-generes.json 2>/dev/null) || illisible "arbre de origin/$B illisible"
LISTE=$propre/index-generes.json
if [ -z "$sortie" ]; then
  # Absente pour de bon, ou lecture vide ? Une seconde lecture, d'une autre commande, doit dire « absente » aussi.
  ! p cat-file -e "$cible:scripts/docs/index-generes.json" 2>/dev/null || illisible "arbre de origin/$B illisible"
  printf '%s\n' '{"index":[]}' >"$LISTE" 2>/dev/null || illisible "dépôt propre impossible à écrire sous le dossier temporaire"
else
  p cat-file blob "$cible:scripts/docs/index-generes.json" >"$LISTE" 2>/dev/null && [ -s "$LISTE" ] ||
    illisible "scripts/docs/index-generes.json de origin/$B illisible"
fi
forme=$(jq -r "$FORME" "$LISTE" 2>/dev/null) && [ "$forme" = true ] || illisible "scripts/docs/index-generes.json de origin/$B mal formé"
sortie=$(jq -r "$REGEX" "$LISTE" 2>/dev/null) || illisible "scripts/docs/index-generes.json de origin/$B : liste des index illisible"
decouper "$sortie"
[ "${#LIGNES[@]}" = 3 ] || illisible "scripts/docs/index-generes.json de origin/$B : liste des index illisible"
for r in "${LIGNES[@]}"; do
  [[ "$r" == '^('*')$' ]] || illisible "scripts/docs/index-generes.json de origin/$B : liste des index illisible"
done
GENERES=${LIGNES[0]} REGENERES=${LIGNES[1]} MOTIFS=${LIGNES[2]}

# Classe d'un chemin, dans l'ordre de `livraison_intermediaire` : hors, motif, sans-commande, régénéré.
classe() {
  if [[ "$1" == '"'* ]] || ! [[ "$1" =~ $GENERES ]]; then echo hors
  elif [[ "$1" =~ $MOTIFS ]]; then echo motif
  elif ! [[ "$1" =~ $REGENERES ]]; then echo sans-commande
  else echo régénéré; fi
}
ordinaire() { [ "$1" = 100644 ] || [ "$1" = 100755 ]; }
ENTREE=$'^([0-7]{6}) [a-z]+ ([0-9a-f]{40})\t'
# Entrée d'un chemin dans l'arbre d'un commit : « mode sha », vide s'il est absent. Sortie 1 : lecture en échec.
entree() {
  local lue
  lue=$(p ls-tree --full-tree "$1" -- "$2" 2>/dev/null) || return 1
  [ -n "$lue" ] || return 0
  [[ "$lue" != *$'\n'* ]] && [[ "$lue" =~ $ENTREE ]] || return 1
  echo "${BASH_REMATCH[1]} ${BASH_REMATCH[2]}"
}
# Écart entre deux arbres, une ligne par chemin : « :mode mode sha sha lettre<TAB>chemin ». Vide si, et seulement
# si, les deux arbres sont le même : une lecture vide entre deux arbres différents est une lecture en échec.
ECART=$'^:[0-7]{6} ([0-7]{6}) [0-9a-f]{40} ([0-9a-f]{40}) [A-Z][0-9]*\t(.+)$'
ecart_de() {
  local a=$1 b=$2 lu
  [[ "$a" =~ $SHA ]] && [[ "$b" =~ $SHA ]] || return 1
  lu=$(p diff-tree -r --raw --no-abbrev --no-renames "$a" "$b" 2>/dev/null) || return 1
  if [ "$a" = "$b" ]; then [ -z "$lu" ] || return 1; else [ -n "$lu" ] || return 1; fi
  printf '%s' "$lu"
}
PARENTS='^([0-9a-f]{40}) ([0-9a-f]{40})( ([0-9a-f]{40}))?( .+)?$'

acceptes=0
fusions=0
index=0
for c in "${chemin[@]}"; do
  sortie=$(p rev-list --parents -n 1 "$c" 2>/dev/null) && [[ "$sortie" =~ $PARENTS ]] && [ "${BASH_REMATCH[1]}" = "$c" ] ||
    illisible "parents de $(court "$c") illisibles"
  p1=${BASH_REMATCH[2]} p2=${BASH_REMATCH[4]} reste=${BASH_REMATCH[5]}
  [ -z "$reste" ] || different "$(court "$c") est une fusion à plus de deux parents"
  arbre_c=$(p rev-parse -q --verify "$c^{tree}" 2>/dev/null) && [[ "$arbre_c" =~ $SHA ]] || illisible "arbre de $(court "$c") illisible"
  conflits=()
  if [ -n "$p2" ]; then
    # S2 : le second parent a été un jour le sommet de la cible, et la fusion apporte quelque chose.
    [[ "$LIGNE_CIBLE" == *$'\n'"$p2"$'\n'* ]] ||
      different "la fusion $(court "$c") a pour second parent $(court "$p2"), qui n'est pas sur la ligne des premiers parents de origin/$B"
    p merge-base --is-ancestor "$p2" "$p1" 2>/dev/null && rc=0 || rc=$?
    case $rc in
      1) ;;
      0) different "la fusion $(court "$c") a pour second parent $(court "$p2"), déjà ancêtre de son premier parent : elle n'apporte rien de la cible" ;;
      *) illisible "git merge-base --is-ancestor en échec ($rc) sur $(court "$c")" ;;
    esac
    # S4 : la fusion à trois voies nue, sans aucun attribut.
    sortie=$(p --attr-source="$VIDE" merge-tree --write-tree --name-only --no-messages "$p1" "$p2" 2>/dev/null) && rc=0 || rc=$?
    [ "$rc" -le 1 ] || illisible "git merge-tree --write-tree en échec ($rc) sur $(court "$c")"
    decouper "$sortie"
    depart=${LIGNES[0]:-}
    [[ "$depart" =~ $SHA ]] || illisible "arbre de la fusion calculée de $(court "$c") illisible"
    conflits=("${LIGNES[@]:1}")
    # Sortie 1 : un conflit, donc au moins un fichier en conflit ; sortie 0 : aucun.
    if [ "$rc" = 1 ]; then [ "${#conflits[@]}" -ge 1 ]; else [ "${#conflits[@]}" = 0 ]; fi ||
      illisible "fichiers en conflit de la fusion calculée de $(court "$c") illisibles"
    sorte="la fusion $(court "$c") s'écarte de la fusion calculée de ses parents"
  else
    depart=$(p rev-parse -q --verify "$p1^{tree}" 2>/dev/null) && [[ "$depart" =~ $SHA ]] || illisible "arbre de $(court "$p1") illisible"
    sorte="le commit $(court "$c") n'est ni une fusion de la cible ni un commit d'index"
  fi
  ecart=$(ecart_de "$depart" "$arbre_c") || illisible "écart de $(court "$c") illisible"
  decouper "$ecart"
  juges=0
  for l in ${LIGNES[@]+"${LIGNES[@]}"}; do
    [[ "$l" =~ $ECART ]] || illisible "écart de $(court "$c") illisible"
    mode=${BASH_REMATCH[1]} sha=${BASH_REMATCH[2]} f=${BASH_REMATCH[3]}
    case $(classe "$f") in
      hors) different "$sorte : $f n'est pas un index généré de origin/$B" ;;
      régénéré)
        [ "$mode" = 000000 ] || ordinaire "$mode" || different "$sorte : $f, index généré, n'est plus un fichier ordinaire"
        ;;
      motif | sans-commande)
        [ -n "$p2" ] || different "$sorte : $f, index sans commande ou déclaré par motif, change dans un commit d'index : aucun contenu connu"
        en_conflit=0
        for k in ${conflits[@]+"${conflits[@]}"}; do [ "$k" != "$f" ] || en_conflit=1; done
        [ "$en_conflit" = 1 ] || different "$sorte : $f, index sans commande ou déclaré par motif, n'est pas en conflit dans la fusion calculée : il se juge comme tout fichier"
        connu=$(entree "$p2" "$f") || illisible "arbre de $(court "$p2") illisible pour $f"
        ordinaire "$mode" && [ "$mode $sha" = "$connu" ] || different "$sorte : $f, index sans commande ou déclaré par motif, n'a pas le contenu de la cible fusionnée"
        ;;
      *) illisible "classe de $f illisible" ;;
    esac
    juges=$((juges + 1))
  done
  # S3 : chaque ligne de l'écart a été jugée, le commit est accepté, et compté.
  [ "$juges" = "${#LIGNES[@]}" ] || illisible "écart de $(court "$c") jugé à moitié"
  if [ -n "$p2" ]; then fusions=$((fusions + 1)); else index=$((index + 1)); fi
  acceptes=$((acceptes + 1))
done
# S3 : « même » ne sort que si chaque commit compté par git a été examiné et accepté.
[ "$acceptes" = "$attendu" ] && [ "$acceptes" -ge 1 ] && [ $((fusions + index)) = "$acceptes" ] ||
  illisible "$acceptes commit(s) examiné(s) pour $attendu de V à T"
meme "de V à T : $fusions fusion(s) de origin/$B, $index commit(s) d'index générés"
````

## Annexe B — `skills/chaine/fusionner/scripts/meme-contenu.test.mjs`

`git hash-object` : `0db4237f38242332dc5ef48970b5cf539de2a633`.

````js
// `meme-contenu.sh` : « même contenu propre », de V (sommet du verdict) à T (sommet jugé), pas à pas sur la ligne
// des premiers parents, dans un dépôt propre. Dépôts jouets (depot-jouet.mjs, sans le modifier) : de vraies fusions git, et deux cas
// où ce sont passer.sh et sujet.sh qui écrivent les commits du capitaine. Aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
// Posé dans un projet, depot-jouet.mjs est à côté (scripts/chaine/) ; dans le plugin, il est dans le skill sujet.
const { depotJouet, dossierTemporaire, script } = await import(
  existsSync(new URL("./depot-jouet.mjs", import.meta.url)) ? "./depot-jouet.mjs" : "../../sujet/scripts/depot-jouet.mjs"
);

const CALCUL = script("fusionner", "meme-contenu.sh");
const ADR = "docs/adr";
const LISTE = "scripts/docs/index-generes.json";
const index = (...adr) => adr.map((f) => `- ${f}\n`).join("");
const ABSENT = "0".repeat(39) + "1";

// Le calcul, depuis le clone de travail : { code, verdict, raison }. La sortie standard ne porte qu'une ligne,
// le verdict ; la raison est sur la sortie d'erreur, une ligne aussi.
function juger(d, V, T, B = "develop", { env = d.env, cwd = d.travail } = {}) {
  const r = spawnSync("bash", [CALCUL, V, T, B], { cwd, env, encoding: "utf8" });
  const lignes = r.stdout.split("\n");
  assert.deepEqual([lignes.length, lignes[1]], [2, ""], `une seule ligne sur la sortie standard : ${JSON.stringify(r.stdout)}`);
  return { code: r.status, verdict: lignes[0], raison: r.stderr.trim(), sortie: r.stdout + r.stderr };
}
const estMeme = (r, raison) => {
  assert.deepEqual([r.code, r.verdict], [0, "même"], r.sortie);
  if (raison) assert.match(r.raison, raison);
};
const estDifferent = (r, raison) => {
  assert.deepEqual([r.code, r.verdict], [20, "différent"], r.sortie);
  assert.match(r.raison, raison);
};
const estIllisible = (r, raison) => {
  assert.deepEqual([r.code, r.verdict], [21, "illisible"], r.sortie);
  assert.match(r.raison, raison);
};

// Un commit poussé sur `nom` (créée depuis `depuis` si elle n'existe pas sur origin) ; rend son sha.
const pousser = (d, nom, fichiers, depuis = "origin/develop") =>
  d.branche(nom, d.git("branch", "-r", "--list", `origin/${nom}`) ? `origin/${nom}` : depuis, fichiers, `feat: ${nom}`);
// Les deux écritures du capitaine sur la branche d'une PR (passer.sh étapes 2 à 4, mettre_a_jour_sous_pr de
// sujet.sh) : fusion de la cible, en conflit le côté de la cible sur les index, régénération, puis le commit qui
// conclut la fusion, ou un commit d'index à part. `regenerer` écrit les index (par défaut la commande du jouet).
function miseAJour(d, tete, cible = "develop", regenerer = () => {}) {
  d.git("fetch", "-q", "origin");
  d.git("switch", "-q", "-C", `capitaine/${tete.replaceAll("/", "-")}`, `origin/${tete}`);
  const fusion = spawnSync("git", ["merge", "-q", "--no-edit", `origin/${cible}`], { cwd: d.travail, env: d.env, encoding: "utf8" });
  let enCours = false;
  if (fusion.status !== 0) {
    const conflits = d.git("diff", "--name-only", "--diff-filter=U").split("\n").filter(Boolean);
    assert.ok(conflits.length, fusion.stdout + fusion.stderr);
    d.git("checkout", "--theirs", "--", ...conflits);
    d.git("add", "--", ...conflits);
    enCours = true;
  }
  regenerer();
  d.git("add", "-A");
  if (enCours) d.git("commit", "-q", "--no-edit");
  else if (d.git("status", "--porcelain")) d.git("commit", "-q", "-m", `docs: régénère les index après mise à jour avec ${cible}`);
  d.git("push", "-q", "origin", `HEAD:refs/heads/${tete}`);
  d.git("fetch", "-q", "origin");
  return d.git("rev-parse", "HEAD");
}
const adrIndex = (d) => () => {
  const r = spawnSync("node", ["scripts/docs/adr-index.mjs"], { cwd: d.travail, env: d.env, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
};
const rien = () => {};
const parents = (d, c) => d.git("rev-list", "--parents", "-n", "1", c).split(" ").slice(1);
// La liste des index de la cible, remplacée sur develop.
const declarer = (d, liste) => pousser(d, "develop", { [LISTE]: JSON.stringify({ index: liste }) });
const ADR_CMD = { chemin: `${ADR}/README.md`, commande: "node scripts/docs/adr-index.mjs" };

// ── « même » ────────────────────────────────────────────────────────────────────────────────────────────────
test("V est T : même, sans rien lire d'autre (cible absente comprise)", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  estMeme(juger(d, V, V), /^V est T$/);
  estMeme(juger(d, V, V, "sujet/inconnu"), /^V est T$/);
});

test("retard sans conflit : la fusion de la cible par le capitaine garde le verdict", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  assert.equal(parents(d, T).length, 2);
  estMeme(juger(d, V, T), /1 fusion\(s\) de origin\/develop, 0 commit\(s\) d'index/);
});

test("retard sans conflit, index périmé : fusion, puis commit d'index à part", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { [`${ADR}/ADR_1.md`]: "# 1\n" }); // index pas régénéré par l'auteur
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", adrIndex(d));
  assert.equal(parents(d, T).length, 1, "le sommet est le commit d'index");
  assert.equal(parents(d, `${T}^`).length, 2, "son parent est la fusion");
  assert.equal(d.git("show", `${T}:${ADR}/README.md`) + "\n", index("ADR_1.md"));
  estMeme(juger(d, V, T), /1 fusion\(s\) de origin\/develop, 1 commit\(s\) d'index/);
});

// PR et cible ajoutent chacune une ADR et régénèrent l'index : conflit sur l'index seul.
function conflitIndex(d) {
  const V = pousser(d, "feat/a", { [`${ADR}/ADR_1.md`]: "# 1\n", [`${ADR}/README.md`]: index("ADR_1.md") });
  pousser(d, "develop", { [`${ADR}/ADR_2.md`]: "# 2\n", [`${ADR}/README.md`]: index("ADR_2.md") });
  return V;
}
test("conflit d'index : la fusion porte l'index régénéré, ni celui de la cible ni celui de la fusion calculée", () => {
  const d = depotJouet();
  const V = conflitIndex(d);
  const T = miseAJour(d, "feat/a", "develop", adrIndex(d));
  assert.equal(parents(d, T).length, 2);
  assert.equal(d.git("show", `${T}:${ADR}/README.md`) + "\n", index("ADR_1.md", "ADR_2.md"));
  estMeme(juger(d, V, T), /1 fusion/);
});

test("deux mises à jour de suite, puis la cible qui avance encore, index compris, sans nouvelle mise à jour", () => {
  const d = depotJouet();
  const V = conflitIndex(d);
  const T1 = miseAJour(d, "feat/a", "develop", adrIndex(d));
  pousser(d, "develop", { [`${ADR}/ADR_3.md`]: "# 3\n", [`${ADR}/README.md`]: index("ADR_2.md", "ADR_3.md"), "apps/c.ts": "c\n" });
  const T2 = miseAJour(d, "feat/a", "develop", adrIndex(d));
  assert.equal(d.git("rev-parse", `${T2}^1`), T1);
  estMeme(juger(d, V, T2), /2 fusion\(s\)/);
  estMeme(juger(d, T1, T2), /1 fusion\(s\)/);
  // La cible avance après la mise à jour, et récrit l'index : T2 n'a pas bougé.
  pousser(d, "develop", { [`${ADR}/ADR_4.md`]: "# 4\n", [`${ADR}/README.md`]: index("ADR_2.md", "ADR_3.md", "ADR_4.md") });
  estMeme(juger(d, V, T2), /2 fusion\(s\)/);
});

test("index sans commande : en conflit, la version de la cible fusionnée est dispensée, même si la cible le récrit ensuite", () => {
  const d = depotJouet();
  pousser(d, "develop", { "docs/registre.md": "base\n" });
  declarer(d, [ADR_CMD, "docs/registre.md"]);
  const V = pousser(d, "feat/a", { "docs/registre.md": "pr\n", "apps/a.ts": "a\n" });
  const cible = pousser(d, "develop", { "docs/registre.md": "cible\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  assert.equal(d.git("rev-parse", `${T}:docs/registre.md`), d.git("rev-parse", `${cible}:docs/registre.md`));
  estMeme(juger(d, V, T));
  pousser(d, "develop", { "docs/registre.md": "cible, plus tard\n" });
  estMeme(juger(d, V, T));
});

test("index déclaré par motif : en conflit, le fichier qui a le contenu de la cible fusionnée est dispensé", () => {
  const d = depotJouet();
  pousser(d, "develop", { "docs/gen/a.md": "base\n" });
  declarer(d, [ADR_CMD, { chemin: "docs/gen/*.md", commande: "true" }]);
  const V = pousser(d, "feat/a", { "docs/gen/a.md": "pr\n", "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/gen/a.md": "cible\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  assert.equal(d.git("show", `${T}:docs/gen/a.md`), "cible");
  estMeme(juger(d, V, T));
});

test("la cible annule un changement identique entre deux mises à jour : même (la définition par M disait différent)", () => {
  const d = depotJouet();
  pousser(d, "develop", { f: "a\n" });
  const V = pousser(d, "feat/a", { f: "b\n", p: "pr\n" });
  pousser(d, "develop", { f: "b\n" });
  const T1 = miseAJour(d, "feat/a", "develop", rien);
  pousser(d, "develop", { f: "a\n" });
  const T2 = miseAJour(d, "feat/a", "develop", rien);
  assert.equal(d.git("show", `${T2}:f`), "a", "la branche mise à jour deux fois a perdu le changement");
  const direct = d.git("merge-tree", "--write-tree", V, "origin/develop").split("\n")[0];
  assert.notEqual(direct, d.git("rev-parse", `${T2}^{tree}`), "la fusion directe de V avec la cible le garde");
  estMeme(juger(d, V, T1));
  estMeme(juger(d, V, T2), /2 fusion\(s\)/);
});

// Sous-PR partie du sujet, qui fusionne un develop plus récent que son sujet ; le sujet est rafraîchi ensuite.
function deuxBases(d) {
  pousser(d, "sujet/x", { s: "s\n" });
  const V = pousser(d, "travail", { p: "p\n" }, "origin/sujet/x");
  pousser(d, "develop", { dev: "d\n" });
  d.git("switch", "-q", "-C", "travail", "origin/travail");
  d.git("merge", "-q", "--no-edit", "origin/develop");
  d.git("push", "-q", "origin", "HEAD:refs/heads/travail");
  const T0 = d.git("rev-parse", "HEAD");
  const rafraichir = () => {
    d.git("switch", "-q", "-C", "sujet/x", "origin/sujet/x");
    d.git("merge", "-q", "--no-edit", "origin/develop");
    d.git("push", "-q", "origin", "HEAD:refs/heads/sujet/x");
    d.git("fetch", "-q", "origin");
  };
  return { V, T0, rafraichir };
}
test("deux bases de fusion : la sous-PR a fusionné develop elle-même, différent avant comme après que le sujet l'a reçu (S2)", () => {
  const d = depotJouet();
  const { V, T0, rafraichir } = deuxBases(d);
  const lateral = /second parent .* pas sur la ligne des premiers parents de origin\/sujet\/x/;
  estDifferent(juger(d, V, T0, "sujet/x"), lateral);
  rafraichir();
  assert.equal(d.git("merge-base", "--all", T0, "origin/sujet/x").split("\n").length, 2, "deux bases de fusion");
  // Le commit de develop est entré dans le sujet par un second parent : il n'en a jamais été le sommet.
  estDifferent(juger(d, V, T0, "sujet/x"), lateral);
  const T1 = miseAJour(d, "travail", "sujet/x", rien);
  estDifferent(juger(d, V, T1, "sujet/x"), lateral);
  estMeme(juger(d, T0, T1, "sujet/x"), /1 fusion\(s\) de origin\/sujet\/x/); // un verdict rendu sur T0 tient
});

test("une sous-PR mise à jour avec son sujet, après que le sujet a reçu develop : même", () => {
  const d = depotJouet();
  pousser(d, "sujet/x", { s: "s\n" });
  const V = pousser(d, "travail", { p: "p\n" }, "origin/sujet/x");
  pousser(d, "develop", { dev: "d\n" });
  d.git("switch", "-q", "-C", "sujet/x", "origin/sujet/x");
  d.git("merge", "-q", "--no-edit", "origin/develop"); // le sujet reçoit develop : son premier parent reste le sujet
  d.git("push", "-q", "origin", "HEAD:refs/heads/sujet/x");
  const T1 = miseAJour(d, "travail", "sujet/x", rien);
  estMeme(juger(d, V, T1, "sujet/x"), /1 fusion\(s\) de origin\/sujet\/x/);
  pousser(d, "sujet/x", { autre: "x\n" });
  const T2 = miseAJour(d, "travail", "sujet/x", rien);
  estMeme(juger(d, V, T2, "sujet/x"), /2 fusion\(s\) de origin\/sujet\/x/);
});

test("un commit vide après V : même", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  d.git("commit", "-q", "--allow-empty", "-m", "chore: relance la CI");
  estMeme(juger(d, V, d.git("rev-parse", "HEAD")), /0 fusion\(s\) de origin\/develop, 1 commit\(s\) d'index/);
});

// ── Les commits que le capitaine écrit vraiment ─────────────────────────────────────────────────────────────
test("passer.sh : PR en retard, la cible bouge pendant la CI, deux mises à jour poussées : le sommet fusionné garde le verdict", () => {
  const d = depotJouet();
  const V = d.branche("feat/b", "origin/develop", { "docs/b.md": "b\n" });
  d.branche("develop", "origin/develop", { "docs/avant.md": "avant\n" });
  const vers = d.branche("ailleurs", "origin/develop", { "apps/b0.ts": "export const b0 = 0;\n" });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    strict: ["develop"],
    checks: { "*": { qualite: ["IN_PROGRESS", "SUCCESS"] } },
    pendantCi: [{ lectures: 2, branche: "develop", vers }],
    pulls: [{ number: 40, title: "docs(demo): b", head: "feat/b", base: "develop", labels: ["à-fusionner"] }],
  });
  const r = d.lancer(script("fusionner", "passer.sh"), "40");
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.equal((r.stdout.match(/mise à jour poussée/g) ?? []).length, 2, r.stdout);
  d.git("fetch", "-q", "origin");
  const T = d.git("rev-parse", "origin/feat/b");
  assert.equal(d.git("rev-parse", `${T}^1^1`), V);
  estMeme(juger(d, V, T), /2 fusion\(s\) de origin\/develop, 0 commit\(s\) d'index/);
});

test("sujet.sh fusionner : sous-PR en conflit sur un index, mise à jour et index régénéré par le capitaine (sortie 8) : même", () => {
  const d = depotJouet();
  d.ecrire(`${ADR}/ADR_ALL_ARC-1-a.md`, "# 1\n");
  d.ecrire(`${ADR}/README.md`, index("ADR_ALL_ARC-1-a.md"));
  d.commit("docs: adr 1");
  d.git("push", "-q", "origin", "HEAD:develop");
  d.git("fetch", "-q", "origin");
  const V = d.branche("docs/sous", "origin/develop", {
    [`${ADR}/ADR_ALL_ARC-2-b.md`]: "# 2\n",
    [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-2-b.md"),
  });
  d.branche("sujet/lot", "origin/develop", {
    [`${ADR}/ADR_ALL_ARC-3-c.md`]: "# 3\n",
    [`${ADR}/README.md`]: index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-3-c.md"),
  });
  d.git("switch", "-q", "--detach", "origin/develop");
  d.github({
    exiges: ["qualite"],
    checks: { [V]: { qualite: "SUCCESS" } },
    pulls: [{ number: 80, title: "docs(adr): ADR 2", head: "docs/sous", base: "sujet/lot", labels: ["à-fusionner"], body: "## Revue de ticket\n\nRien de bloquant.\n" }],
  });
  const r = d.lancer(script("sujet", "sujet.sh"), "fusionner", "80");
  assert.equal(r.status, 8, r.stdout + r.stderr);
  d.git("fetch", "-q", "origin");
  const T = d.git("rev-parse", "origin/docs/sous");
  assert.equal(d.git("rev-parse", `${T}^1`), V);
  assert.equal(d.git("show", `${T}:${ADR}/README.md`) + "\n", index("ADR_ALL_ARC-1-a.md", "ADR_ALL_ARC-2-b.md", "ADR_ALL_ARC-3-c.md"));
  estMeme(juger(d, V, T, "sujet/lot"), /1 fusion\(s\) de origin\/sujet\/lot/);
  estDifferent(juger(d, V, T, "develop"), /second parent .* pas sur la ligne des premiers parents de origin\/develop/);
});

// ── « différent » ───────────────────────────────────────────────────────────────────────────────────────────
test("un commit de l'auteur après V : différent, avant comme après une mise à jour du capitaine", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  estDifferent(juger(d, V, T), /n'est ni une fusion de la cible ni un commit d'index : apps\/a\.ts n'est pas un index généré/);
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T2 = miseAJour(d, "feat/a", "develop", rien);
  estDifferent(juger(d, V, T2), /apps\/a\.ts/);
  estMeme(juger(d, T, T2));
});

test("une fusion en conflit hors index, résolue à la main : différent", () => {
  const d = depotJouet();
  pousser(d, "develop", { "apps/a.ts": "base\n" });
  const V = pousser(d, "feat/a", { "apps/a.ts": "pr\n" });
  pousser(d, "develop", { "apps/a.ts": "cible\n" });
  d.git("switch", "-q", "-C", "feat/a", "origin/feat/a");
  assert.notEqual(spawnSync("git", ["merge", "-q", "--no-edit", "origin/develop"], { cwd: d.travail, env: d.env }).status, 0);
  d.git("checkout", "--ours", "--", "apps/a.ts"); // le choix d'un côté, comme la résolution d'un conflit de pile
  d.git("add", "apps/a.ts");
  d.git("commit", "-q", "--no-edit");
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /s'écarte de la fusion calculée de ses parents : apps\/a\.ts n'est pas un index généré/);
});

test("une fusion propre dont l'arbre est retouché (reformatage, fichier glissé) : différent", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  d.git("switch", "-q", "-C", "feat/a", "origin/feat/a");
  d.git("merge", "-q", "--no-edit", "origin/develop");
  d.ecrire("apps/a.ts", "a ;\n");
  d.git("add", "-A");
  d.git("commit", "-q", "--amend", "--no-edit");
  const T = d.git("rev-parse", "HEAD");
  assert.equal(parents(d, T).length, 2);
  estDifferent(juger(d, V, T), /s'écarte de la fusion calculée de ses parents : apps\/a\.ts/);
});

test("une fusion dont le second parent n'est pas un ancêtre de la cible : différent", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "autre", { "apps/autre.ts": "autre\n" });
  d.git("switch", "-q", "-C", "feat/a", "origin/feat/a");
  d.git("merge", "-q", "--no-edit", "origin/autre");
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /second parent .* pas sur la ligne des premiers parents de origin\/develop/);
});

test("V absent de la ligne des premiers parents de T : différent (autre branche, second parent, réécriture, sha inconnu)", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const ailleurs = pousser(d, "feat/b", { "apps/b.ts": "b\n" });
  estDifferent(juger(d, V, ailleurs), /n'est pas sur la ligne des premiers parents/);
  // La cible en premier parent : V est un ancêtre de T, mais par le second parent.
  pousser(d, "develop", { "docs/b.md": "b\n" });
  d.git("switch", "-q", "-C", "inverse", "origin/develop");
  d.git("merge", "-q", "--no-edit", "--no-ff", "origin/feat/a");
  const inverse = d.git("rev-parse", "HEAD");
  assert.equal(parents(d, inverse)[1], V);
  estDifferent(juger(d, V, inverse), /n'est pas sur la ligne des premiers parents/);
  // Réécriture : le même contenu, un autre commit.
  d.git("switch", "-q", "-C", "feat/a", "origin/feat/a");
  d.git("commit", "-q", "--amend", "-m", "feat: a, récrit");
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /n'est pas sur la ligne des premiers parents/);
  estDifferent(juger(d, ABSENT, V), /V introuvable/);
});

test("un commit d'index qui touche aussi un autre fichier : différent", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { [`${ADR}/ADR_1.md`]: "# 1\n" });
  const seul = pousser(d, "feat/a", { [`${ADR}/README.md`]: index("ADR_1.md") });
  estMeme(juger(d, V, seul), /1 commit\(s\) d'index/);
  const T = pousser(d, "feat/a", { [`${ADR}/README.md`]: index("ADR_1.md", "x"), "apps/a.ts": "a\n" });
  estDifferent(juger(d, V, T), /apps\/a\.ts n'est pas un index généré/);
});

test("index sans commande : d'un autre contenu que la cible fusionnée, retiré, ou changé dans un commit d'index : différent", () => {
  const d = depotJouet();
  pousser(d, "develop", { "docs/registre.md": "base\n" });
  declarer(d, [ADR_CMD, "docs/registre.md"]);
  const V = pousser(d, "feat/a", { "docs/registre.md": "pr\n" });
  pousser(d, "develop", { "docs/registre.md": "cible\n" });
  const fusion = (resoudre) => {
    d.git("switch", "-q", "-C", "essai", V);
    spawnSync("git", ["merge", "-q", "--no-edit", "origin/develop"], { cwd: d.travail, env: d.env });
    resoudre();
    d.git("commit", "-q", "--no-edit");
    return d.git("rev-parse", "HEAD");
  };
  const autre = fusion(() => { d.ecrire("docs/registre.md", "à la main\n"); d.git("add", "-A"); });
  estDifferent(juger(d, V, autre), /docs\/registre\.md, index sans commande ou déclaré par motif, n'a pas le contenu de la cible fusionnée/);
  const cotePr = fusion(() => { d.git("checkout", "--ours", "--", "docs/registre.md"); d.git("add", "-A"); });
  estDifferent(juger(d, V, cotePr), /n'a pas le contenu de la cible fusionnée/);
  const retire = fusion(() => d.git("rm", "-q", "-f", "docs/registre.md"));
  estDifferent(juger(d, V, retire), /n'a pas le contenu de la cible fusionnée/);
  const seul = pousser(d, "feat/a", { "docs/registre.md": "pr, encore\n" });
  estDifferent(juger(d, V, seul), /change dans un commit d'index : aucun contenu connu/);
});

test("index déclaré par motif : un fichier ajouté ou récrit sous le motif, dans la fusion ou dans un commit d'index : différent", () => {
  const d = depotJouet();
  declarer(d, [ADR_CMD, { chemin: "apps/gen/*.ts", commande: "true" }]);
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  d.git("switch", "-q", "-C", "feat/a", "origin/feat/a");
  d.git("merge", "-q", "--no-edit", "origin/develop");
  d.ecrire("apps/gen/glisse.ts", "export const glisse = 1;\n");
  d.git("add", "-A");
  d.git("commit", "-q", "--amend", "--no-edit");
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /apps\/gen\/glisse\.ts, index sans commande ou déclaré par motif, n'est pas en conflit dans la fusion calculée/);
  const seul = pousser(d, "feat/b", { "apps/gen/glisse.ts": "export const glisse = 1;\n" }, V);
  estDifferent(juger(d, V, seul), /apps\/gen\/glisse\.ts.*aucun contenu connu/);
});

test("un index régénéré remplacé par un lien symbolique : différent", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  d.git("rm", "-q", `${ADR}/README.md`);
  mkdirSync(join(d.travail, ADR), { recursive: true });
  symlinkSync("../../apps/a.ts", join(d.travail, ADR, "README.md"));
  d.commit("docs: index");
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /docs\/adr\/README\.md, index généré, n'est plus un fichier ordinaire/);
});

test("une fusion à trois parents : différent", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "autre", { "apps/autre.ts": "autre\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  d.git("switch", "-q", "-C", "feat/a", "origin/feat/a");
  d.git("merge", "-q", "--no-edit", "origin/develop", "origin/autre");
  const T = d.git("rev-parse", "HEAD");
  assert.equal(parents(d, T).length, 3);
  estDifferent(juger(d, V, T), /fusion à plus de deux parents/);
});

test("la liste des index se lit sur la cible, jamais sur la PR ni dans l'arbre de travail", () => {
  const d = depotJouet();
  // La PR se déclare un index à elle dès V, et l'arbre de travail du capitaine est sur elle.
  const V = pousser(d, "feat/a", { [LISTE]: JSON.stringify({ index: [ADR_CMD, { chemin: "apps/a.ts", commande: "true" }] }), "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  assert.match(d.lire(LISTE), /apps\/a\.ts/);
  estDifferent(juger(d, V, T), /apps\/a\.ts n'est pas un index généré de origin\/develop/);
  // Sans fichier de liste sur la cible : aucun index, une fusion pure passe, un commit d'index non.
  d.git("switch", "-q", "-C", "sans", "origin/develop");
  d.git("rm", "-q", LISTE);
  d.git("commit", "-q", "-m", "chore: sans liste");
  d.git("push", "-q", "origin", "HEAD:refs/heads/sans-liste");
  d.git("fetch", "-q", "origin");
  const W = pousser(d, "feat/c", { "apps/c.ts": "c\n" }, "origin/sans-liste");
  const index1 = pousser(d, "feat/c", { [`${ADR}/README.md`]: index("x") });
  estDifferent(juger(d, W, index1, "sans-liste"), /docs\/adr\/README\.md n'est pas un index généré de origin\/sans-liste/);
});

test("un nom de fichier à saut de ligne dont chaque ligne est le chemin d'un index : différent", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  // Chaque ligne du nom est le chemin d'un index : lu ligne à ligne, il passerait pour un index.
  const piege = `${ADR}/README.md\n${ADR}/README.md`;
  mkdirSync(join(d.travail, piege, ".."), { recursive: true });
  writeFileSync(join(d.travail, piege), "piège\n");
  d.commit("docs: index");
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /n'est pas un index généré/);
});

// ── « illisible » : jamais « même » ─────────────────────────────────────────────────────────────────────────
test("illisible : cible absente, T introuvable, usage, liste mal formée, hors dépôt", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  estIllisible(juger(d, V, T, "sujet/inconnu"), /origin\/sujet\/inconnu introuvable/);
  estIllisible(juger(d, V, ABSENT), /T introuvable/);
  estIllisible(juger(d, V.slice(0, 12), T), /^V n'est pas un sha de 40 caractères$/);
  estIllisible(juger(d, V, "origin/feat/a"), /^T n'est pas un sha de 40 caractères$/);
  estIllisible(juger(d, V, T, "a..b"), /nom de branche cible invalide/);
  const sans = spawnSync("bash", [CALCUL, V, T], { cwd: d.travail, env: d.env, encoding: "utf8" });
  assert.deepEqual([sans.status, sans.stdout], [21, "illisible\n"]);
  // Hors de tout dépôt, même si le dossier temporaire du poste est lui-même dans un dépôt.
  const dehors = dossierTemporaire("hors-depot-");
  estIllisible(juger(d, V, T, "develop", { cwd: dehors, env: { ...d.env, GIT_CEILING_DIRECTORIES: dirname(dehors) } }), /pas dans un dépôt git/);
  for (const contenu of ["{", '{"index":"x"}', '{"index":[{"commande":"x"}]}', '{"index":[42]}', "[]"]) {
    pousser(d, "develop", { [LISTE]: contenu });
    estIllisible(juger(d, V, T), /index-generes\.json de origin\/develop (mal formé|illisible)/);
  }
});

test("illisible : un clone superficiel, dont l'historique est tronqué", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  const clone = join(dossierTemporaire("superficiel-"), "clone");
  const r = spawnSync("git", ["clone", "-q", "--depth", "1", "--no-single-branch", `file://${d.origine}`, clone], { env: d.env, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  estIllisible(juger(d, V, T, "develop", { cwd: clone }), /clone superficiel/);
});

test("illisible : git merge-tree en échec n'est jamais « même »", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  const vrai = spawnSync("sh", ["-c", "command -v git"], { env: d.env, encoding: "utf8" }).stdout.trim();
  writeFileSync(
    join(d.racine, "bin", "git"),
    `#!/bin/sh\nfor a in "$@"; do [ "$a" = merge-tree ] && { echo "git: merge-tree --write-tree inconnu" >&2; exit 129; }; done\nexec ${JSON.stringify(vrai)} "$@"\n`,
  );
  chmodSync(join(d.racine, "bin", "git"), 0o755);
  estIllisible(juger(d, V, T), /git merge-tree --write-tree en échec \(129\)/);
});

// Un PATH qui ne porte que les outils nommés (liens vers ceux du poste).
function pathReduit(d, ...outils) {
  const bin = dossierTemporaire("path-");
  for (const o of outils) symlinkSync(spawnSync("sh", ["-c", `command -v ${o}`], { env: d.env, encoding: "utf8" }).stdout.trim(), join(bin, o));
  return { ...d.env, PATH: bin };
}
test("illisible : un outil absent (git, jq, mktemp, rm), sortie 69, jamais « même »", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  for (const [outils, manque] of [
    [["bash"], /^git est requis/],
    [["bash", "git"], /^jq est requis/],
    [["bash", "git", "jq"], /^mktemp est requis/],
    [["bash", "git", "jq", "mktemp"], /^rm est requis/],
  ]) {
    const r = juger(d, V, T, "develop", { env: pathReduit(d, ...outils) });
    assert.deepEqual([r.code, r.verdict], [69, "illisible"], r.sortie);
    assert.match(r.raison, manque);
  }
});

// ── Ce que la relecture adversariale a trouvé (A-114) : chaque attaque est un cas ───────────────────────────
test("un PATH réduit à bash, git, jq, mktemp et rm : le calcul n'emploie aucun autre outil, et rend les mêmes verdicts", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { [`${ADR}/ADR_1.md`]: "# 1\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", adrIndex(d));
  const auteur = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  const env = pathReduit(d, "bash", "git", "jq", "mktemp", "rm");
  estMeme(juger(d, V, T, "develop", { env }), /1 fusion\(s\) de origin\/develop, 1 commit\(s\) d'index/);
  estDifferent(juger(d, V, auteur, "develop", { env }), /apps\/a\.ts n'est pas un index généré/);
});

test("une fusion qui recule un index sans commande, ou l'écrase hors de tout conflit : différent", () => {
  const d = depotJouet();
  const D1 = pousser(d, "develop", { "docs/registre.md": "ligne1\nl2\nl3\nl4\nl5\nl6\nl7\nl8\n", [LISTE]: JSON.stringify({ index: [ADR_CMD, "docs/registre.md"] }) });
  pousser(d, "develop", { "docs/registre.md": "ligne1\nligne2\nl2\nl3\nl4\nl5\nl6\nl7\nl8\n" });
  const V = pousser(d, "feat/a", { "docs/registre.md": "ligne1\nligne2\nl2\nl3\nl4\nl5\nl6\nl7\nl8\nlignePR\n" });
  // Une fusion écrite à la main : `arbre`, sauf le registre, repris de `source` ; parents V et `second`.
  const ecrite = (arbre, source, second) => {
    d.git("read-tree", arbre);
    d.git("update-index", "--cacheinfo", `100644,${d.git("rev-parse", `${source}:docs/registre.md`)},docs/registre.md`);
    const T = d.git("commit-tree", d.git("write-tree"), "-p", V, "-p", second, "-m", "x");
    d.git("read-tree", "HEAD");
    return T;
  };
  // (a) Le second parent est un vieux sommet de la cible, déjà ancêtre de V : le registre recule jusqu'à lui.
  const recul = ecrite(V, D1, D1);
  assert.equal(d.git("show", `${recul}:docs/registre.md`).split("\n")[1], "l2", "le sommet a perdu la ligne 2 de la cible");
  estDifferent(juger(d, V, recul), /second parent .* déjà ancêtre de son premier parent/);
  // (b) Un vrai sommet de la cible, fusion sans conflit ; le registre de la fusion calculée (les deux ajouts)
  // est écrasé par celui de la cible.
  const D3 = pousser(d, "develop", { "docs/registre.md": "ligne0\nligne1\nligne2\nl2\nl3\nl4\nl5\nl6\nl7\nl8\n" });
  const ecrase = ecrite(d.git("merge-tree", "--write-tree", V, D3).split("\n")[0], D3, D3);
  assert.doesNotMatch(d.git("show", `${ecrase}:docs/registre.md`), /lignePR/);
  estDifferent(juger(d, V, ecrase), /docs\/registre\.md, index sans commande ou déclaré par motif, n'est pas en conflit dans la fusion calculée/);
});

test("un conflit fabriqué par un second parent latéral, entré dans la cible par une fusion : différent (S2)", () => {
  const d = depotJouet();
  const lettres = "a\nb\nc\nd\ne\nf\ng\nh\ni\nj\n";
  pousser(d, "develop", { "docs/registre.md": lettres, [LISTE]: JSON.stringify({ index: [ADR_CMD, "docs/registre.md"] }) });
  const SK = pousser(d, "sujet/s", { "docs/registre.md": `${lettres}ligneS\n` });
  pousser(d, "develop", { "docs/registre.md": `ligne2\n${lettres}` });
  const V = pousser(d, "feat/a", { "docs/registre.md": `ligne2\n${lettres}ligneP\n` });
  d.git("switch", "-q", "-C", "develop", "origin/develop");
  d.git("merge", "-q", "--no-ff", "--no-edit", "origin/sujet/s");
  d.git("push", "-q", "origin", "HEAD:refs/heads/develop");
  d.git("fetch", "-q", "origin");
  assert.equal(spawnSync("git", ["merge-base", "--is-ancestor", SK, "origin/develop"], { cwd: d.travail, env: d.env }).status, 0, "SK est un ancêtre de la cible");
  // La fusion calculée de V et de SK est en conflit sur le registre ; l'attaque y met le registre de SK.
  const calcule = spawnSync("git", ["merge-tree", "--write-tree", V, SK], { cwd: d.travail, env: d.env, encoding: "utf8" });
  assert.equal(calcule.status, 1, "conflit fabriqué");
  d.git("read-tree", calcule.stdout.split("\n")[0]);
  d.git("update-index", "--cacheinfo", `100644,${d.git("rev-parse", `${SK}:docs/registre.md`)},docs/registre.md`);
  const T = d.git("commit-tree", d.git("write-tree"), "-p", V, "-p", SK, "-m", "x");
  d.git("read-tree", "HEAD");
  assert.doesNotMatch(d.git("show", `${T}:docs/registre.md`), /ligne2/, "le sommet a perdu la ligne 2 de la cible");
  estDifferent(juger(d, V, T), /second parent .* pas sur la ligne des premiers parents de origin\/develop/);
});

test("un sous-module déplacé après V : différent, quoi que disent .gitmodules et diff.ignoreSubmodules", () => {
  const d = depotJouet();
  d.git("switch", "-q", "-C", "feat/a", "origin/develop");
  d.ecrire(".gitmodules", '[submodule "vendor/lib"]\n\tpath = vendor/lib\n\turl = ./lib\n\tignore = all\n');
  d.git("add", ".gitmodules");
  d.git("update-index", "--add", "--cacheinfo", `160000,${"1".repeat(40)},vendor/lib`);
  d.git("commit", "-q", "-m", "feat: sous-module");
  const V = d.git("rev-parse", "HEAD");
  d.git("update-index", "--cacheinfo", `160000,${"2".repeat(40)},vendor/lib`);
  d.git("commit", "-q", "-m", "chore: sous-module");
  const T = d.git("rev-parse", "HEAD");
  estDifferent(juger(d, V, T), /vendor\/lib n'est pas un index généré/);
  d.git("config", "diff.ignoreSubmodules", "all");
  estDifferent(juger(d, V, T), /vendor\/lib n'est pas un index généré/);
});

test("depuis un sous-dossier, sous diff.relative : le dossier courant ne change rien", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  const W = pousser(d, "feat/c", { [`${ADR}/ADR_1.md`]: "# 1\n" });
  const X = pousser(d, "feat/c", { [`${ADR}/README.md`]: index("ADR_1.md") });
  d.git("config", "diff.relative", "true");
  const cwd = join(d.travail, ADR);
  estDifferent(juger(d, V, T, "develop", { cwd }), /apps\/a\.ts n'est pas un index généré/);
  // La liste de la cible se lit depuis la racine de son arbre : le commit d'index est reconnu.
  estMeme(juger(d, W, X, "develop", { cwd }), /1 commit\(s\) d'index/);
});

test("un sommet remplacé (git replace) ou greffé (info/grafts) : les commits se lisent tels qu'ils sont", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  const vide = d.git("commit-tree", `${V}^{tree}`, "-p", V, "-m", "vide");
  d.git("replace", T, vide);
  estDifferent(juger(d, V, T), /apps\/a\.ts n'est pas un index généré/);
  d.git("replace", "-d", T);
  // Un commit de l'auteur, puis son retour : greffé sur V, le second cacherait le premier.
  const retour = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  assert.equal(d.git("rev-parse", `${retour}^{tree}`), d.git("rev-parse", `${V}^{tree}`));
  mkdirSync(join(d.travail, ".git/info"), { recursive: true });
  writeFileSync(join(d.travail, ".git/info/grafts"), `${retour} ${V}\n`);
  estDifferent(juger(d, V, retour), /apps\/a\.ts n'est pas un index généré/);
});

test("un chemin de la liste écrit comme git cite : le fichier cité n'est pas un index", () => {
  const d = depotJouet();
  declarer(d, [ADR_CMD, { chemin: '"apps/a\\tb.ts"', commande: "true" }]);
  const V = pousser(d, "feat/a", { "apps/a\tb.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a\tb.ts": "a2\n" });
  estDifferent(juger(d, V, T), /n'est pas un index généré/);
});

test("des arguments hostiles : jamais recopiés, la sortie standard ne porte que le verdict", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  for (const args of [["x\nmême", T, "develop"], [V, `${T}\nmême`, "develop"], [V, T, "develop\nmême"], [`${V}\n`, T, "develop"]]) {
    const r = spawnSync("bash", [CALCUL, ...args], { cwd: d.travail, env: d.env, encoding: "utf8" });
    assert.deepEqual([r.status, r.stdout], [21, "illisible\n"], JSON.stringify(args));
    assert.doesNotMatch(r.stderr, /même/);
    assert.equal(r.stderr.trim().split("\n").length, 1, r.stderr);
  }
  // HEAD n'est pas une branche, et une réf symbolique non plus.
  d.git("symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/develop");
  d.git("symbolic-ref", "refs/remotes/origin/alias", "refs/remotes/origin/develop");
  estIllisible(juger(d, V, T, "HEAD"), /^nom de branche cible invalide$/);
  estIllisible(juger(d, V, T, "alias"), /réf symbolique/);
});

test("un fichier renommé vers le chemin d'un index, sous diff.renames : la suppression ne se cache pas", () => {
  const d = depotJouet();
  declarer(d, [ADR_CMD, { chemin: "docs/agents/couts.md", commande: "true" }]);
  const V = pousser(d, "feat/a", { "apps/a.ts": "une ligne\nune autre\nune troisième\n" });
  mkdirSync(join(d.travail, "docs/agents"), { recursive: true });
  d.git("mv", "apps/a.ts", "docs/agents/couts.md");
  d.git("commit", "-q", "-m", "docs: index");
  d.git("config", "diff.renames", "copies");
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /: apps\/a\.ts n'est pas un index généré/);
});

test("GIT_DIR et GIT_WORK_TREE hérités d'un autre dépôt : c'est le dépôt du dossier courant qui est jugé", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  // Un autre clone, dont origin/develop déclare apps/a.ts index à commande.
  pousser(d, "piege", { [LISTE]: JSON.stringify({ index: [ADR_CMD, { chemin: "apps/a.ts", commande: "true" }] }) });
  const autre = join(dossierTemporaire("autre-"), "clone");
  assert.equal(spawnSync("git", ["clone", "-q", d.origine, autre], { env: d.env }).status, 0);
  const dans = (...args) => spawnSync("git", args, { cwd: autre, env: d.env, encoding: "utf8" });
  assert.equal(dans("update-ref", "refs/remotes/origin/develop", "refs/remotes/origin/piege").status, 0);
  estMeme(juger(d, V, T, "develop", { cwd: autre }), /1 commit\(s\) d'index/); // le piège fonctionne, lu chez lui
  const env = { ...d.env, GIT_DIR: join(autre, ".git"), GIT_WORK_TREE: autre };
  estDifferent(juger(d, V, T, "develop", { env }), /apps\/a\.ts n'est pas un index généré de origin\/develop/);
});

test("core.quotePath du dépôt : un index au chemin accentué reste reconnu", () => {
  const d = depotJouet();
  declarer(d, [ADR_CMD, { chemin: "docs/métier/index.md", commande: "true" }]);
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "docs/métier/index.md": "x\n" });
  for (const valeur of ["true", "false"]) {
    d.git("config", "core.quotePath", valeur);
    estMeme(juger(d, V, T), /1 commit\(s\) d'index/);
  }
});

test("les attributs et les pilotes de fusion : la fusion calculée est la fusion à trois voies nue, où qu'ils soient écrits", () => {
  const d = depotJouet();
  pousser(d, "develop", { "apps/a.ts": "base\nl2\nl3\n" });
  const V = pousser(d, "feat/a", { "apps/a.ts": "pr\nl2\nl3\n" });
  pousser(d, "develop", { "apps/a.ts": "cible\nl2\nl3\n" });
  // Une résolution à la main : les deux côtés l'un sous l'autre, ce qu'un pilote `union` aurait écrit.
  d.git("switch", "-q", "-C", "feat/a", "origin/feat/a");
  assert.notEqual(spawnSync("git", ["merge", "-q", "--no-edit", "origin/develop"], { cwd: d.travail, env: d.env }).status, 0);
  d.ecrire("apps/a.ts", "pr\ncible\nl2\nl3\n");
  d.git("add", "-A");
  d.git("commit", "-q", "--no-edit");
  const T = d.git("rev-parse", "HEAD");
  const refus = /s'écarte de la fusion calculée de ses parents : apps\/a\.ts/;
  estDifferent(juger(d, V, T), refus);
  // Dans l'arbre de travail de qui calcule, non commité.
  d.ecrire(".gitattributes", "apps/a.ts merge=union\n");
  estDifferent(juger(d, V, T), refus);
  // Dans la configuration du dépôt : le pilote par défaut, puis le pilote `text` remplacé.
  d.git("config", "merge.default", "union");
  estDifferent(juger(d, V, T), refus);
  d.git("config", "--unset", "merge.default");
  d.git("config", "merge.text.driver", "true");
  estDifferent(juger(d, V, T), refus);
  d.git("config", "--unset", "merge.text.driver");
  // Dans les attributs locaux du dépôt.
  mkdirSync(join(d.travail, ".git/info"), { recursive: true });
  writeFileSync(join(d.travail, ".git/info/attributes"), "apps/a.ts merge=union\n");
  estDifferent(juger(d, V, T), refus);
  writeFileSync(join(d.travail, ".git/info/attributes"), "");
  // Dans la configuration de l'utilisateur.
  const maison = dossierTemporaire("maison-");
  writeFileSync(join(maison, ".gitconfig"), "[merge]\n\tdefault = union\n");
  estDifferent(juger(d, V, T, "develop", { env: { ...d.env, HOME: maison, XDG_CONFIG_HOME: join(maison, "xdg") } }), refus);
});

test("un pilote de fusion commité avec V (merge=union, merge=ours) : la fusion faite sous lui s'écarte de la fusion nue, différent (S4)", () => {
  const d = depotJouet();
  pousser(d, "develop", { "apps/auth.ts": "base\nl2\nl3\n" });
  const fusionSous = (attribut, branche) => {
    const V = pousser(d, branche, { ".gitattributes": `apps/auth.ts merge=${attribut}\n`, "apps/auth.ts": "pr\nl2\nl3\n" });
    return { V, T: () => miseAJour(d, branche, "develop", rien) };
  };
  const union = fusionSous("union", "feat/union");
  const ours = fusionSous("ours", "feat/ours");
  pousser(d, "develop", { "apps/auth.ts": "correctif\nl2\nl3\n" }); // la cible corrige le fichier
  // Sans aucune configuration : git mêle les deux côtés, sans conflit, et personne n'a relu ce contenu.
  const Tu = union.T();
  assert.equal(d.git("show", `${Tu}:apps/auth.ts`), "pr\ncorrectif\nl2\nl3");
  estDifferent(juger(d, union.V, Tu), /s'écarte de la fusion calculée de ses parents : apps\/auth\.ts/);
  // Avec `merge.ours.driver true` dans le clone : le côté de la PR est gardé, le correctif de la cible perdu.
  d.git("config", "merge.ours.driver", "true");
  const To = ours.T();
  assert.equal(d.git("show", `${To}:apps/auth.ts`), "pr\nl2\nl3");
  estDifferent(juger(d, ours.V, To), /s'écarte de la fusion calculée de ses parents : apps\/auth\.ts/);
});

test("illisible : une lecture de git vide ou incohérente n'est jamais « même »", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  const vrai = spawnSync("sh", ["-c", "command -v git"], { env: d.env, encoding: "utf8" }).stdout.trim();
  // Un faux git, muet et en sortie 0 pour la commande donnée (et son drapeau, s'il y en a un).
  const muet = (commande, drapeau = commande) =>
    writeFileSync(
      join(d.racine, "bin", "git"),
      `#!/bin/sh\nc=0; f=0\nfor a in "$@"; do [ "$a" = '${commande}' ] && c=1; [ "$a" = '${drapeau}' ] && f=1; done\n[ "$c$f" = 11 ] && exit 0\nexec ${JSON.stringify(vrai)} "$@"\n`,
      { mode: 0o755 },
    );
  muet("diff-tree");
  estIllisible(juger(d, V, T), /écart de [0-9a-f]{9} illisible/);
  muet("rev-list", "--first-parent");
  estIllisible(juger(d, V, T), /ligne des premiers parents de T illisible/);
  muet("rev-list", "--parents");
  estIllisible(juger(d, V, T), /parents de [0-9a-f]{9} illisibles/);
  muet("rev-parse", `${T}^{tree}`);
  estIllisible(juger(d, V, T), /arbre de [0-9a-f]{9} illisible/);
  muet("rev-list", "--count");
  estIllisible(juger(d, V, T), /compte des commits de V à T incohérent/);
});

// ── Les règles de structure (A-119) ─────────────────────────────────────────────────────────────────────────
// Un faux git en tête de PATH : `corps` (du sh) passe avant le vrai, joignable par "$VRAI".
function fauxGit(d, corps) {
  const chemin = join(d.racine, "bin", "git");
  const vrai = existsSync(chemin) ? null : spawnSync("sh", ["-c", "command -v git"], { env: d.env, encoding: "utf8" }).stdout.trim();
  d.vraiGit ??= vrai;
  writeFileSync(chemin, `#!/bin/sh\nVRAI=${JSON.stringify(d.vraiGit)}\n${corps}\nexec "$VRAI" "$@"\n`, { mode: 0o755 });
}

test("git plus ancien que 2.41 : sortie 69, la version dite, avant tout calcul", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const T = pousser(d, "feat/a", { "apps/a.ts": "a2\n" });
  for (const [version, attendu] of [["2.40.1", /^git ≥ 2\.41 requis, ici 2\.40$/], ["1.9.5 (Apple Git-50)", /^git ≥ 2\.41 requis, ici 1\.9$/]]) {
    fauxGit(d, `[ "$1" = version ] && { echo "git version ${version}"; exit 0; }`);
    const r = juger(d, V, T);
    assert.deepEqual([r.code, r.verdict], [69, "illisible"], r.sortie);
    assert.match(r.raison, attendu);
  }
  fauxGit(d, `[ "$1" = version ] && { echo "git version 2.41.0"; exit 0; }`);
  estDifferent(juger(d, V, T), /apps\/a\.ts n'est pas un index généré/);
  fauxGit(d, `[ "$1" = version ] && { echo "git version 3.0.0"; exit 0; }`);
  estDifferent(juger(d, V, T), /apps\/a\.ts n'est pas un index généré/);
});

test("S1 : le dépôt propre se crée sous le dossier temporaire, y est retiré, et le dépôt réel n'est pas écrit", () => {
  const d = depotJouet();
  const V = conflitIndex(d);
  const T = miseAJour(d, "feat/a", "develop", adrIndex(d));
  const temporaire = dossierTemporaire("tmp-du-calcul-");
  const objets = () => d.git("count-objects", "-v");
  const avant = objets();
  estMeme(juger(d, V, T, "develop", { env: { ...d.env, TMPDIR: temporaire } }), /1 fusion/);
  assert.deepEqual(readdirSync(temporaire), [], "le dépôt propre est retiré");
  assert.equal(objets(), avant, "la fusion calculée ne s'écrit pas dans le dépôt réel");
  // Dossier temporaire absent, ou qui n'est pas un dossier : le dépôt propre ne se crée pas.
  for (const TMPDIR of [join(temporaire, "absent"), join(d.travail, "README.md")])
    estIllisible(juger(d, V, T, "develop", { env: { ...d.env, TMPDIR } }), /^dossier temporaire impossible à créer/);
});

test("S3 : aucun here-document dans le script, et un commit de 2 500 fichiers se juge en entier", () => {
  // bash écrit un here-document dans un fichier du dossier temporaire : plein, la lecture reviendrait vide.
  const lignes = readFileSync(CALCUL, "utf8").split("\n").filter((l) => !/^\s*#/.test(l));
  assert.deepEqual(lignes.filter((l) => l.includes("<<")), [], "ni here-document ni here-string");
  assert.deepEqual(lignes.filter((l) => /<\s*<\(/.test(l) || /\|\s*(while|read|mapfile)/.test(l)), [], "ni substitution de processus ni tube vers une lecture");
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  const beaucoup = Object.fromEntries(Array.from({ length: 2500 }, (_, i) => [`apps/gros/f${i}.ts`, `export const f${i} = ${i};\n`]));
  const T = pousser(d, "feat/a", beaucoup);
  estDifferent(juger(d, V, T), /apps\/gros\/f0\.ts n'est pas un index généré/);
  // Un écart long dont seule la dernière ligne n'est pas un index : elle est lue.
  declarer(d, [ADR_CMD, ...Array.from({ length: 200 }, (_, i) => ({ chemin: `gen/f${i}.md`, commande: "true" }))]);
  const W = pousser(d, "feat/b", { "apps/b.ts": "b\n" });
  const X = pousser(d, "feat/b", { ...Object.fromEntries(Array.from({ length: 200 }, (_, i) => [`gen/f${i}.md`, `${i}\n`])), "zzz/dernier.ts": "z\n" });
  estDifferent(juger(d, W, X), /zzz\/dernier\.ts n'est pas un index généré/);
});

test("S3 : une ligne des premiers parents tronquée, ou un compte qui ne dit pas la même chose : illisible", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "feat/a", { "apps/a.ts": "a2\n" }); // un commit de l'auteur
  d.git("commit", "-q", "--allow-empty", "-m", "chore: vide");
  const T = d.git("rev-parse", "HEAD");
  estDifferent(juger(d, V, T), /apps\/a\.ts n'est pas un index généré/);
  // Un git qui saute le commit de l'auteur dans la ligne des premiers parents de T : seul le commit vide serait jugé.
  fauxGit(d, `for a in "$@"; do [ "$a" = --reverse ] && { printf '%s\\n' ${V} ${T}; exit 0; }; done`);
  estIllisible(juger(d, V, T), /compte des commits de V à T incohérent/);
  // Et un git dont le compte, lui, est faux.
  fauxGit(d, `for a in "$@"; do [ "$a" = --count ] && { echo 1; exit 0; }; done`);
  estIllisible(juger(d, V, T), /compte des commits de V à T incohérent/);
});
````
