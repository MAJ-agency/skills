# « Même contenu propre » : un seul calcul, pas à pas de V à T, `meme-contenu.sh` et son banc sur dépôts jouets (lot 3b)

Status: ready-for-agent
Type: task
Label: contre-revue
Modèle: sonnet — le script et son banc sont donnés mot pour mot (annexes A et B), joués sur une copie jetable de `origin/main` : 28 tests verts, 18 mutations nommées toutes tuées, la suite entière du dépôt verte avec eux. Restent la version, la note et le rejeu. Rien à concevoir : qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/fusionner/scripts/meme-contenu.sh` (créé), `skills/chaine/fusionner/scripts/meme-contenu.test.mjs` (créé), `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`

## Le besoin

Ce ticket réalise le lot 3b de la spec [`relecture-independante.spec.md`](../relecture-independante.spec.md) (sixième version) : ses décisions `A-81` et `A-106`, sous les règles de `A-108` et dans l'ordre de `A-109`. Les choix que la spec ne portait pas ont été tranchés par l'architecte le 2026-11-18, décision `A-112` : ils sont marqués ainsi dans « Décisions ».

**Ce qui manque.** En régime 8, un verdict de relecture porte sur un sommet, V. Le capitaine met à jour et reteste toute PR en retard sur sa cible, jusqu'à trois fois par passage (plugin 7.16.0) : le sommet qu'il fusionne, T, est un commit qu'il a écrit lui-même. Deux lecteurs devront dire si le verdict de V vaut encore pour T : le Relecteur à chaque réveil (`A-85`, règles 2 et 3, lot 4) et le capitaine à ses deux contrôles (`A-105`, lot 5a). `A-81` veut un seul calcul, écrit une fois, à côté des scripts du capitaine. Il n'existe pas. Ce ticket l'écrit et l'éprouve ; **il ne le branche nulle part** : ni `passer.sh`, ni `sujet.sh`, ni aucun skill ne l'appelle encore.

**La définition** (`A-106`, mot pour mot) :

> De V, le sommet du verdict, à T, le sommet jugé, sur la ligne des premiers parents de T, chaque commit est :
>
> - soit **une fusion** à deux parents, dont le second est un ancêtre de la cible (`origin/B`), et dont l'arbre est celui de la fusion calculée de ses deux parents (`git merge-tree`, arbre pris même en conflit), aux index générés près ;
> - soit **un commit qui ne touche que des index générés**.
>
> Tout autre commit : « différent » ; V absent de cette ligne : « différent ».

**Ce que `main` a déjà, et pourquoi le calcul ne le reprend pas.** Lu sur `origin/main` à `99a6214` (plugin 7.18.0). Les fichiers de la chaîne y sont ceux de `1c4acb1` (7.17.0), le commit que la spec et le rapport de vérification citent : `git diff 1c4acb1 99a6214 -- skills/chaine scripts/depot.test.mjs scripts/poses.test.mjs scripts/points-d-entree.test.mjs README.md` est vide. **La base de ce ticket est `origin/main` à `22b2d49` (plugin 7.18.1)**, relue après `git fetch origin main` : `main` y est arrivé pendant l'écriture, et le même diff y est vide aussi.

- Les deux sortes de commits que le capitaine écrit sur la branche d'une PR : la fusion de la cible (`skills/chaine/fusionner/scripts/passer.sh:220`, `skills/chaine/sujet/scripts/sujet.sh:518`), conclue par `git commit --no-edit` quand un index était en conflit, après `git checkout --theirs` sur lui et la régénération (`passer.sh:261`, `:272` ; `sujet.sh:534`, `:539`) ; et, quand la fusion était propre et qu'un index change à la régénération, un commit à part, `docs: régénère les index après mise à jour avec …` (`passer.sh:274`, `sujet.sh:541`).
- `verifier_mise_a_jour` (`sujet.sh:618`) juge déjà une fusion contre celle qu'elle recalcule de ses deux parents : c'est l'esprit du calcul. Mais elle lit la liste des index par l'arbre de travail d'abord, joue `commitlint`, et sort par `sortir`.
- `livraison_intermediaire` (`passer.sh:126`) applique les trois classes d'index. Mais elle lit la liste par `index_json` (`skills/chaine/fusionner/scripts/github.sh:64`), **l'arbre de travail d'abord**, et compare un index au **sommet courant** d'`origin/develop` (`passer.sh:153`, `:157`). `A-81` interdit l'un et `A-106` l'autre.
- `ascendance` (`github.sh:138`) est le modèle : paramétrée par des réfs, elle lit la liste sur la cible (`git show "$cible:scripts/docs/index-generes.json"`), et ne rend jamais un verdict par défaut quand une lecture échoue.

**Ce qui a été joué pour écrire ce ticket** (2026-11-18, copie jetable de `origin/main` à `99a6214`, git 2.43.0, jq 1.7, Node 22.23.4) : le script de l'annexe A et le banc de l'annexe B, 28 tests verts en environ 15 s (13 à 18 selon la charge) ; les 18 mutations de « Vérification », toutes tuées ; la suite entière du dépôt avec les deux fichiers ajoutés (793 tests, tous verts, sur les fichiers définitifs). Enfin, sur `22b2d49`, le banc a été rejoué depuis les seules annexes de ce ticket, extraites du fichier : mêmes empreintes, 28 tests verts. **Les deux cas que la définition par M jugeait mal** (rapport `relecture-independante.verif-716.md`, § 2.2, limites 3 et 4) ont été remontés à l'identique des dépôts du rapport et **rendent « même »** avec la définition pas à pas, comme `A-106` l'affirme : cas 8 et 9 ci-dessous. Le montage du cas 8 est prouvé dans le banc (la fusion directe de V avec la cible n'a pas l'arbre de T), celui du cas 9 aussi (`git merge-base --all` rend deux bases). À savoir sur le cas 8 : T2 ne porte plus le changement que la PR faisait sur `f`, la cible l'ayant annulé ; « même » y dit que rien d'autre que des fusions de la cible n'a été écrit depuis V, pas que la PR apporte encore tout ce que V apportait. C'est ce qu'`A-106` demande, et `A-112` le confirme (Décision 8, i).

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
- Ses trois appelants sont en bash ou lancent des commandes : `passer.sh` (`bash "$PASSER_OUTILS/meme-contenu.sh" …`), `sujet.sh` (`bash "$ici/meme-contenu.sh" …`, avec le repli vers `fusionner/scripts/` que `sujet.sh:738-739` fait déjà pour `revue-exigee.mjs`), et le Relecteur, qui lit GitHub par `github.sh` (`A-83`). La copie de travail de la boucle prend tout `scripts/chaine` d'`origin/develop` (`skills/chaine/fusionner/scripts/boucle.sh:203`) : le script y sera sans rien ajouter.
- Pas d'idiome de point d'entrée à porter, donc aucune ligne due à `scripts/points-d-entree.test.mjs`, qui ne liste que des `.mjs`.
- Dépendances : `bash`, `git` ≥ 2.38 (`merge-tree --write-tree`, déjà exigé par `ascendance`), `jq` (déjà exigé par `github.sh:12`). Rien d'installé, aucun `node_modules`, aucun arbre de travail.

### 2. L'appel et les entrées

```
bash scripts/chaine/meme-contenu.sh <V> <T> <B>
```

Depuis un dépôt git (nu ou non). Trois arguments, pas un de moins. `<B>` est un nom de branche : confirmé par `A-112`.

| Entrée | Forme | Sens |
| ------ | ----- | ---- |
| `<V>` | sha de 40 caractères hexadécimaux en minuscules | le sommet du verdict (`Sommet relu:`, `A-80`) |
| `<T>` | de même | le sommet jugé : la tête de la PR, ou le sommet que le capitaine fusionne (`A-105`) |
| `<B>` | un nom de branche (`develop`, `sujet/<nom>`), jamais une réf | la branche de base **de la PR** ; le script lit `refs/remotes/origin/<B>`, et rien d'autre |

Le script **ne lit pas le réseau**. Qui l'appelle a relu la cible juste avant, par un refspec explicite (`git fetch origin "+refs/heads/<B>:refs/remotes/origin/<B>"`, comme `passer.sh:326` et `sujet.sh:825`), et a les commits de la PR (`T`). Raison du nom de branche plutôt que d'une réf : un appelant ne peut pas passer par mégarde une branche locale périmée, et `A-106` dit « sur la cible (`origin/B`) ».

### 3. Les sorties

Sortie standard, **écrite en dernier et d'un seul bloc**, deux lignes : le verdict, puis sa raison (une ligne, en français, qui nomme le commit par ses neuf premiers caractères et le fichier). Rien d'utile sur la sortie d'erreur.

| Code | Ligne 1 | Quand |
| ---- | ------- | ----- |
| 0 | `même` | V est T, ou chaque commit de V à T passe la définition |
| 20 | `différent` | un commit ne la passe pas, V n'est pas sur la ligne des premiers parents de T, ou V est introuvable dans le dépôt |
| 21 | `illisible` | le script ne peut pas conclure : usage, dépôt, clone superficiel, `origin/<B>` absente, T introuvable, liste des index mal formée, une commande git en échec |
| 69 | `illisible` | `jq` absent du poste (le code de toute la chaîne, `github.sh:12`) |

Les quatre codes sont confirmés par `A-112`. **Seul le code 0 vaut « même ».** Tout autre code que 0 et 20 se lit « illisible », y compris un code que ce tableau ne nomme pas (signal, erreur de bash) : une lecture en échec ne vaut jamais « même » (`A-106`). Les codes 20 et 21 ne sont pris par aucun script de la chaîne : relevé sur `main`, les `.sh` de `skills/chaine` sortent en 0 à 12, 64 et 69 (dont 12 dans `passer.sh` et `sujet.sh`, 8 et 11 dans `sujet.sh fusionner`, que le rapport, § 3.4 point 6, interdit de réemployer). Les lots 4 et 5a diront ce que l'appelant fait de « illisible » ; ce n'est pas ici.

### 4. L'ordre des lectures

1. Usage : trois arguments, V et T de 40 caractères. Sinon 21.
2. `jq` présent. Sinon 69.
3. Dans un dépôt git ; `<B>` est un nom de branche valide (`git check-ref-format`) ; T est un commit du dépôt. Sinon 21.
4. **V est T : `même`, raison « V est T »**, sans lire ni la cible ni la liste (`A-81` : « il répond « même » si V est T »). Une cible absente n'y change rien.
5. Clone superficiel : 21. `origin/<B>` absente : 21.
6. V n'est pas un commit du dépôt : `différent` (`A-81` : « V introuvable après une réécriture »).
7. V absent de `git rev-list --first-parent T` : `différent`.
8. La liste des index de la cible (Décision 6). Mal formée : 21.
9. Chaque commit du chemin, **du plus ancien au plus récent** ; le premier qui ne passe pas donne la raison.

### 5. Un commit du chemin

Par ses parents (`git rev-list --parents -n 1`) :

- **Deux parents, `p1` et `p2`** : `git merge-base --is-ancestor p2 origin/<B>` (sortie 1 : `différent` ; autre : 21). Puis `git merge-tree --write-tree --no-messages p1 p2` : sortie 0 ou 1, l'arbre est la première ligne, **pris même en conflit** (il porte alors les marqueurs) ; toute autre sortie : 21. L'écart est `git -c core.quotePath=false diff --no-renames --name-only <arbre calculé> <commit>`. Chaque chemin de l'écart doit être dispensé (Décision 7).
- **Un parent** : l'écart est le même diff, du parent au commit. Chaque chemin doit être dispensé (Décision 7). Un écart vide passe : un commit vide ne change aucun contenu.
- **Plus de deux parents** : `différent`.

### 6. La liste des index : où, quelles clés

Le fichier est `scripts/docs/index-generes.json`, lu **dans l'arbre de `refs/remotes/origin/<B>`** (`git ls-tree`, puis `git cat-file blob`), jamais dans l'arbre de travail, jamais sur la PR. Sa forme, vérifiée dans `github.sh` (`index_generes`, `:68` ; `index_commandes`, `:70` ; `index_regeneres_regex`, `:174` ; `index_regeneres_motifs_regex`, `:181`) et dans le gabarit du plugin (`skills/chaine/socle-chaine-de-production/references/index-generes.json`) : un objet dont la clé `index` est un tableau ; chaque entrée est soit **une chaîne nue**, le chemin d'un index sans commande, soit **un objet** `{ "chemin": "…", "commande": "…", "verification": "…" }`, où `commande` et `verification` sont facultatifs. Dans un chemin, `*` vaut un ou plusieurs caractères hors `/` (« un segment »).

- Fichier absent de la cible : aucun index (comme `ascendance`, `github.sh:158-162`). Seules les fusions pures et les commits vides passent alors.
- Fichier présent mais mal formé : 21. Mal formé : pas du JSON, `index` qui n'est pas un tableau, une entrée qui n'est ni une chaîne non vide ni un objet à `chemin` chaîne non vide, une `commande` qui n'est pas une chaîne.
- `verification` n'est pas lu.

### 7. « Aux index générés près » : les trois classes, à chaque commit

Un chemin en écart reçoit sa classe **dans l'ordre de `livraison_intermediaire`** (`passer.sh:148-159`) :

1. aucune entrée de la liste ne le touche : **hors index** ;
2. sinon, une entrée à `commande` dont le chemin porte `*` le touche : **motif** ;
3. sinon, aucune entrée à `commande` ne le touche : **sans commande** ;
4. sinon : **régénéré** (un chemin littéral à `commande`).

Une « entrée » d'arbre est le couple mode et blob (`git ls-tree`). « Ordinaire » : mode `100644` ou `100755`.

| Classe | Dans une fusion (deux parents) | Dans un commit à un parent |
| ------ | ------------------------------ | -------------------------- |
| hors index | `différent` | `différent` |
| régénéré | dispensé, si le chemin est absent du commit ou y est un fichier ordinaire | de même |
| sans commande | dispensé seulement si son entrée dans le commit est ordinaire et **est celle du second parent**, la cible fusionnée | `différent` |
| motif | de même | `différent` |

Ce que ce tableau fixe, et d'où il vient :

- **Le contenu connu est celui du second parent** (`A-106` : « celui de son second parent, la cible qu'elle fusionne, ou celui de la fusion calculée ; jamais le sommet courant de la cible »). « Ou celui de la fusion calculée » ne demande aucun code : un chemin n'est dans l'écart que si son entrée n'est pas celle de la fusion calculée. `A-112` retire ces mots d'`A-106`. C'est le cas ordinaire du capitaine : en conflit, il prend le côté de la cible (`git checkout --theirs`), et un index sans commande n'est pas régénéré ensuite.
- **Classes 2 et 3 ont donc la même règle** dans une fusion : c'est déjà vrai de `livraison_intermediaire`, à ceci près qu'elle compare au sommet courant.
- **Absent n'est pas un contenu connu** pour les classes 2 et 3 (`passer.sh:154`, `:158` ; son commentaire : « absent d'un côté, il diffère et va à la revue »).
- Le calcul ne joue aucune commande et ne régénère rien : il ne sait pas si un index régénéré est à jour.

### 8. Ce que la spec ne disait pas : tranché par `A-112`

La sixième version de la spec ne portait pas ces points. L'architecte les a tranchés le 2026-11-18 (`A-112`) : (a) à (e), (h) et (i) sont ses décisions ; (f) et (g) sont des choix d'écriture de ce ticket. Chacun est du côté sûr (« différent » ou « illisible »), sauf (c) et (i), où aucun contenu propre n'a changé. La session ne revient sur aucun.

- **(a) Un index sans commande, ou sous motif, qui change dans un commit à un parent.** `A-106` ne donne le « contenu connu » que pour une fusion. Aucun contenu connu, donc `différent` (`A-112`). Le capitaine n'écrit jamais ce commit pour un index sans commande. Pour un index sous motif, voir (h).
- **(b) Un index dispensé qui devient un lien symbolique** (ou un sous-module) : `différent` (`A-112`). La spec ne le disait pas ; `liens_sur_index` (`github.sh:196`) existe parce que la régénération écrirait à travers lui.
- **(c) Un commit vide** entre V et T : `même` (`A-112`).
- **(d) Un clone superficiel** : `illisible` (`A-112`), avec la commande (`git fetch --unshallow origin`). Sur un historique tronqué, la ligne des premiers parents s'arrête sans le dire et la base d'une fusion calculée peut manquer. `passer.sh:111` et `sujet.sh:113` complètent déjà leur clone avant de juger ; une session cloud part d'un clone superficiel (`passer.sh:108`), et le Relecteur devra faire de même (lot 4).
- **(e) V introuvable** : `différent` (`A-81`, `A-112`), alors que T introuvable, cible absente et liste illisible donnent `illisible` (`A-106`, « une lecture en échec »). Raison : après une réécriture de la branche, V n'est plus atteignable d'aucune réf et un clone neuf ne l'aura jamais ; `illisible` y serait un état sans fin.
- **(f) Les caractères d'un chemin de la liste.** `github.sh` n'échappe que `.` et `*` en bâtissant ses expressions régulières (`:123`, `:176`) : un chemin de la liste qui porte `(`, `+` ou `[` y vaut autre chose que lui-même. Ici tout caractère autre que `*` est pris à la lettre. Écart assumé avec `github.sh`, qui n'est pas touché.
- **(g) Les chemins se lisent sans `-z`**, `core.quotePath=false`, comme sur `main` : un nom de fichier à saut de ligne, guillemet ou barre oblique inverse arrive cité par git, sur une ligne, et ne touche aucune entrée de la liste. Lu avec `-z` puis ligne à ligne, un fichier nommé `docs/adr/README.md⏎docs/adr/README.md` passerait pour un index (cas 24, mutation 17).
- **(h) Un index déclaré par motif, récrit d'un contenu nouveau par une régénération : `différent`, et la relecture de plus est acceptée** (`A-112`). Dans une fusion, son entrée n'est celle du second parent que si la régénération n'y a rien changé ; dans le commit d'index à part, il n'a aucun contenu connu (a). Une PR dont le capitaine régénère ainsi un index sous motif perd donc son verdict. Raisons de l'architecte : le calcul ne peut pas rejouer la commande qui a produit le fichier, donc il ne distingue pas une régénération d'une retouche ; l'erreur est du seul côté sûr ; et le cas est rare, le gabarit du plugin ne déclarant aucun motif. `A-112` amende la dernière phrase d'`A-81` : « garde son verdict, sauf un index sous motif récrit d'un contenu nouveau ». Un index sans commande n'est pas concerné : le capitaine ne le régénère pas, et en conflit il prend le contenu de la cible (cas 6).
- **(i) La cible annule un changement que la PR faisait aussi : `même`, alors que T ne porte plus ce changement** (`A-112`, cas 8). C'est juste : le contenu propre de la PR n'a pas changé, c'est la cible qui l'a défait, et la CI du sommet fusionné juge le résultat.

### 9. Le script ne s'arrête pas sur une erreur : il lit chaque statut

`set -uo pipefail`, **sans `-e`**. Chaque commande git a son statut lu et sa suite écrite (`différent`, `illisible`, ou on continue). Raison : sous `set -e`, un git en échec arrêterait le script en sortie 1 sans verdict ; le contrat tiendrait encore (tout autre code se lit « illisible »), mais sans raison écrite.

### 10. Le banc monte ses dépôts sans modifier `depot-jouet.mjs`

Il importe `depotJouet`, `dossierTemporaire` et `script` de `depot-jouet.mjs` par le repli des autres bancs du dossier (à côté quand il est posé à plat, dans le skill `sujet` sinon : `skills/chaine/fusionner/scripts/github.test.mjs:9-14`). `depotJouet()` donne un `origin` nu, un clone, `develop` et un index à commande (`docs/adr/README.md`, commande `node scripts/docs/adr-index.mjs`) : tout le reste se monte par ses poignées (`git`, `ecrire`, `commit`, `branche`, `github`, `lancer`). Une autre liste d'index se pousse sur `develop` comme un commit ordinaire. Les dossiers passent par `dossierTemporaire` : ils sont retirés à la sortie, et tout `git` reçoit `d.env` (ni `GIT_*` hérité, ni variable du capitaine).

Les commits du capitaine sont écrits de deux façons : par une aide du banc, `miseAJour`, qui rejoue avec le vrai `git` les gestes de `passer.sh:220-274` et de `sujet.sh:518-541` ; et, pour deux cas (11 et 12), **par `passer.sh` et `sujet.sh fusionner` eux-mêmes** sur le faux GitHub, pour que la preuve porte sur ce que le capitaine écrit vraiment.

### 11. Version et note

La mineure suivante de la version de `main` au moment de livrer (7.19.0 tant que `main` porte une 7.18.x : un script ajouté, `README.md` « Ajouter un skill », point 4). La note, en tête de `NOTES-DE-VERSION.md`, à la forme des précédentes (`## <version> — <date>`, « ### Ce qui change », « ### Ce qu'un projet fait pour en profiter » : `scripts/depot.test.mjs:1032-1041` exige que la première note commence par la version de `plugin.json` et porte ces deux titres) :

- « Ce qui change » : `fusionner` porte `scripts/meme-contenu.sh` et son banc. Le calcul dit si deux sommets d'une PR ne sont séparés que par des fusions de la cible et des commits d'index générés ; sorties 0 « même », 20 « différent », 21 « illisible ». Rien ne l'appelle encore : il prépare la relecture indépendante.
- « Ce qu'un projet fait pour en profiter » : mettre à jour le plugin ; rien d'autre. Le script et son banc arrivent dans `scripts/chaine/` à la prochaine fois que le projet rejoue `/maj-skills:fusionner poser` ; aucun script de la boucle ne change, le capitaine ne se relance pas.

`.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` sont disputés par toute PR ouverte du plugin : partir de `main`, et **reprendre `main` avant de livrer** (version et note recalées sur ce que `main` porte alors).

### 12. Ce qui reste dû, hors de ce ticket

La ligne du script et de son banc dans `skills/chaine/fusionner/references/CONTENU.md` et dans l'arbre du `README.md` (`:169`) : ces fichiers sont tenus par l'autre programme, la ligne s'écrit une fois ses tickets 2, 3, 4, 8 et 9 entrés, au plus tard avec le lot 3d (spec, « Les lots », point 3). **Aucun test de `main` n'exige qu'un fichier neuf sous `fusionner/scripts/` soit listé quelque part** : `scripts/poses.test.mjs` pose les dossiers entiers (`:14-22`, `:61`), `scripts/points-d-entree.test.mjs` ne tient qu'une liste écrite à la main de `.mjs` (`:17-27` ; `commits-a-relire.mjs` n'y est pas), et `scripts/depot.test.mjs` ne lit `CONTENU.md` de `fusionner` nulle part. Vérifié par lecture, puis par la suite entière, verte avec les deux fichiers ajoutés et rien d'autre.

## À faire, dans l'ordre

1. Partir d'`origin/main` à jour. Relever sa version (`.claude-plugin/plugin.json`) et vérifier que `skills/chaine/fusionner/scripts/` ne porte pas déjà un `meme-contenu.*`.
2. Créer `skills/chaine/fusionner/scripts/meme-contenu.sh` avec le contenu de l'annexe A, **mot pour mot**, puis `chmod +x` (mode `100755` dans git, comme `passer.sh`). Contrôle : `git hash-object skills/chaine/fusionner/scripts/meme-contenu.sh` rend `c5316178fbee66545063910dab8f91b391fef681`.
3. Créer `skills/chaine/fusionner/scripts/meme-contenu.test.mjs` avec le contenu de l'annexe B, mot pour mot. Contrôle : `git hash-object` rend `f6eebfd4b8f90d7882410ab5fbe67ed68e4b1b87`.
4. `node --test skills/chaine/fusionner/scripts/meme-contenu.test.mjs` : 28 tests, tous verts. Un cas rouge ne se corrige pas en changeant ce qu'il attend : il se dit au lanceur, avec sa sortie. Si c'est le cas 11 ou le cas 12 (ils appellent `passer.sh` et `sujet.sh fusionner`), regarder d'abord si un ticket de l'autre programme, entré depuis, a changé l'appel ou les sorties de ces scripts : seule la ligne d'appel ou la sortie attendue du script du capitaine se recale alors, jamais le verdict attendu du calcul.
5. Les mutations de « Vérification », une à la fois, chacune retirée avant la suivante.
6. La version et la note (Décision 11).
7. La suite entière : `pnpm install --frozen-lockfile`, puis `pnpm test`, verte. Relever la durée du test « les bancs posés à plat sous scripts/chaine/ tournent hors du plugin » (plafond de 600 s, `scripts/poses.test.mjs:49`, `:75`).
8. Reprendre `main`, recaler version et note, rejouer l'étape 7 si `main` a bougé, puis livrer : une PR vers `main`, selon la procédure du dépôt.

## Les cas du banc, un par un

Vocabulaire du tableau. **Jouet** : `depotJouet()`, soit `develop` avec un commit initial (`README.md`, `scripts/docs/adr-index.mjs`, `scripts/docs/index-generes.json` qui déclare `docs/adr/README.md` à commande, `docs/adr/README.md` vide). **Pousser `b` { fichiers }** : un commit sur la branche `b` (créée depuis `origin/develop` si elle n'existe pas), poussé, puis `git fetch`. **Mise à jour** : les gestes du capitaine, `git switch -C capitaine/… origin/<tête>`, `git merge -q --no-edit origin/<cible>` ; en conflit, `git checkout --theirs -- <fichiers en conflit>` et `git add` ; la régénération quand le cas en nomme une ; puis `git commit --no-edit` si la fusion était en conflit, sinon, si quelque chose a changé, `git commit -m 'docs: régénère les index après mise à jour avec <cible>'` ; `git push origin HEAD:refs/heads/<tête>`. **Index(a, b)** : le contenu `- a⏎- b⏎` de `docs/adr/README.md`. Sauf mention, `<B>` est `develop`.

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
| 9 | **Deux bases de fusion** (rapport § 2.2, limite 4). Pousser `sujet/x` { `s` }. Pousser `travail`, depuis `origin/sujet/x`, { `p` } = V. Pousser `develop` { `dev` }. Sur `travail`, `git merge -q --no-edit origin/develop`, poussé = T0. Appel `(V, T0, sujet/x)`. Puis `sujet/x` reçoit develop (`git merge -q --no-edit origin/develop`, poussé) : `git merge-base --all T0 origin/sujet/x` rend deux lignes. Appel `(V, T0, sujet/x)`. Puis mise à jour de `travail` avec `sujet/x` = T1. | avant que le sujet reçoive develop : `différent`, « second parent … pas un ancêtre de origin/sujet/x » ; après : `même`, « 1 fusion(s) de origin/sujet/x » ; `(V, T1, sujet/x)` : `même`, « 2 fusion(s) » |
| 10 | **Commit vide.** Pousser `feat/a` { `apps/a.ts` } = V. `git commit --allow-empty` = T. | `même`, « 0 fusion(s) …, 1 commit(s) d'index » |
| 11 | **Par `passer.sh`.** Le montage de « cible qui bouge pendant la CI » de `fusionner.test.mjs` (`cibleQuiBouge(1)`) : `feat/b` { `docs/b.md` } = V, `develop` avance d'un commit, une branche `ailleurs` que `develop` rejoint pendant la CI (`pendantCi`), PR 40 étiquetée, check `qualite` en cours puis vert, `strict`. `passer.sh 40` sort en 0 après deux « mise à jour poussée ». T = `origin/feat/b` ; `T^1^1` = V. | `même`, « 2 fusion(s) de origin/develop, 0 commit(s) d'index » |
| 12 | **Par `sujet.sh fusionner`.** Le montage de « conflit sur un index généré seul » de `sujet-fusionner.test.mjs` : `develop` porte l'ADR 1 et son index ; `docs/sous` { ADR 2, index (1, 2) } = V ; `sujet/lot` { ADR 3, index (1, 3) } ; PR 80 vers `sujet/lot`. `sujet.sh fusionner 80` sort en 8. T = `origin/docs/sous` ; `T^1` = V ; son index est (1, 2, 3). | `(V, T, sujet/lot)` : `même`, « 1 fusion(s) de origin/sujet/lot » ; `(V, T, develop)` : `différent`, « second parent … pas un ancêtre de origin/develop » (B est la base de la PR, pas une autre) |

### « différent » (code 20)

| n° | Montage | Attendu |
| -- | ------- | ------- |
| 13 | **Un commit de l'auteur après V.** Pousser `feat/a` { `apps/a.ts` = `a` } = V, puis { `apps/a.ts` = `a2` } = T. Puis pousser `develop` { `docs/b.md` } et mise à jour = T2. | `(V, T)` : `différent`, « n'est ni une fusion de la cible ni un commit d'index : apps/a.ts n'est pas un index généré » ; `(V, T2)` : `différent` ; `(T, T2)` : `même` |
| 14 | **Conflit hors index, résolu à la main** (c'est aussi la résolution d'un conflit de pile, `passer.sh:234-251`). Pousser `develop` { `apps/a.ts` = `base` }. Pousser `feat/a` { `apps/a.ts` = `pr` } = V. Pousser `develop` { `apps/a.ts` = `cible` }. Sur `feat/a` : `git merge origin/develop` (conflit), `git checkout --ours -- apps/a.ts`, `git add`, `git commit --no-edit` = T. | `différent`, « s'écarte de la fusion calculée de ses parents : apps/a.ts … » |
| 15 | **Fusion propre retouchée** (un reformatage par le `pre-commit`, un fichier glissé). V comme au cas 2, `develop` avance. Sur `feat/a` : `git merge -q --no-edit origin/develop`, puis `apps/a.ts` récrit et `git commit --amend --no-edit` = T (toujours deux parents). | `différent`, « s'écarte de la fusion calculée … apps/a.ts » |
| 16 | **Second parent hors de la cible.** Pousser `feat/a` = V. Pousser `autre` { `apps/autre.ts` } (jamais fusionnée dans `develop`). Sur `feat/a` : `git merge -q --no-edit origin/autre` = T. | `différent`, « second parent … pas un ancêtre de origin/develop » |
| 17 | **V absent de la ligne des premiers parents.** (a) T = le sommet d'une autre branche, `feat/b`. (b) Pousser `develop` { `docs/b.md` } ; branche `inverse` depuis `origin/develop`, `git merge --no-ff origin/feat/a` = T : V est le **second** parent de T. (c) Sur `feat/a`, `git commit --amend -m …` = T (réécriture, même contenu). (d) V = `000…01`, un sha qui n'existe pas. | (a), (b), (c) : `différent`, « n'est pas sur la ligne des premiers parents » ; (d) : `différent`, « V introuvable » |
| 18 | **Commit d'index qui touche aussi un autre fichier.** Pousser `feat/a` { `docs/adr/ADR_1.md` } = V ; puis { README = Index(ADR_1.md) } = T1 ; puis { README récrit, `apps/a.ts` } = T2. | `(V, T1)` : `même`, « 1 commit(s) d'index » ; `(V, T2)` : `différent`, « apps/a.ts n'est pas un index généré » |
| 19 | **Index sans commande, quatre refus.** Liste et registre du cas 6 ; V = `feat/a` { registre = `pr` } ; `develop` { registre = `cible` }. Depuis V, `git merge origin/develop` (conflit), résolu : (a) par un troisième contenu ; (b) par `git checkout --ours` (le côté de la PR) ; (c) par `git rm`. (d) Un commit à un parent, sur `feat/a`, qui récrit le registre. | (a), (b), (c) : `différent`, « n'a pas le contenu de la cible fusionnée » ; (d) : `différent`, « change dans un commit d'index : aucun contenu connu » |
| 20 | **Index par motif, deux refus.** Liste `[…, { chemin: "apps/gen/*.ts", commande: "true" }]`. V = `feat/a` { `apps/a.ts` } ; `develop` avance. (a) Fusion propre amendée pour ajouter `apps/gen/glisse.ts`. (b) Un commit à un parent, depuis V, qui ajoute `apps/gen/glisse.ts`. | (a) : `différent`, « n'a pas le contenu de la cible fusionnée » ; (b) : `différent`, « aucun contenu connu » |
| 21 | **Lien symbolique.** V = `feat/a`. Un commit qui remplace `docs/adr/README.md` par un lien vers `../../apps/a.ts` = T. | `différent`, « index généré, n'est plus un fichier ordinaire » |
| 22 | **Trois parents.** V = `feat/a` ; pousser `autre` ; pousser `develop` ; sur `feat/a`, `git merge -q --no-edit origin/develop origin/autre` = T (trois parents). | `différent`, « fusion à plus de deux parents » |
| 23 | **La liste se lit sur la cible.** (a) Pousser `feat/a` { la liste, qui déclare en plus `apps/a.ts` à commande ; `apps/a.ts` } = V, puis { `apps/a.ts` récrit } = T ; l'arbre de travail est sur `feat/a`, sa liste nomme `apps/a.ts`. (b) Une cible `sans-liste`, où le fichier de liste est supprimé ; `feat/c` depuis elle = W, puis { `docs/adr/README.md` } = T ; appel `(W, T, sans-liste)`. | (a) : `différent`, « apps/a.ts n'est pas un index généré de origin/develop » ; (b) : `différent`, « docs/adr/README.md n'est pas un index généré de origin/sans-liste » |
| 24 | **Nom de fichier à saut de ligne.** V = `feat/a`. Un commit qui ajoute le fichier nommé `docs/adr/README.md⏎docs/adr/README.md` = T. | `différent`, « n'est pas un index généré » |

### « illisible » (code 21, ou 69) : jamais « même »

Montage commun : le cas 2 (V, T, une fusion propre).

| n° | Appel ou montage | Attendu |
| -- | ---------------- | ------- |
| 25 | `<B>` = `sujet/inconnu` · T = `000…01` · V réduit à 12 caractères · T = `origin/feat/a` · `<B>` = `a..b` · deux arguments · depuis un dossier hors de tout dépôt (`GIT_CEILING_DIRECTORIES` posé) · la liste de la cible remplacée tour à tour par `{`, `{"index":"x"}`, `{"index":[{"commande":"x"}]}`, `{"index":[42]}`, `[]` | chaque fois 21 et `illisible`, avec sa raison (« origin/sujet/inconnu introuvable », « T introuvable », « V n'est pas un sha de 40 caractères », « T n'est pas un sha… », « nom de branche cible invalide », l'usage, « pas dans un dépôt git », « index-generes.json de origin/develop mal formé ») |
| 26 | Un clone `--depth 1 --no-single-branch` de l'origin du jouet ; appel depuis lui. | 21, « clone superficiel » |
| 27 | Un faux `git` en tête de `PATH` qui sort en 129 sur `merge-tree` (celui de `sujet-fusionner.test.mjs:381-388`). | 21, « git merge-tree --write-tree en échec (129) » |
| 28 | Un `PATH` qui ne porte que `bash` : `jq` introuvable. | 69, ligne 1 `illisible`, « jq est requis » |

## Surfaces

| Surface | Preuve (cas du banc `meme-contenu.test.mjs`) |
| ------- | -------------------------------------------- |
| `même` quand V est T, sans lire la cible | cas 1 |
| une fusion de la cible, arbre de la fusion calculée de ses deux parents | cas 2, 5, 14, 15 |
| le second parent est un ancêtre de `origin/<B>`, et `<B>` est la base de la PR | cas 9, 12, 16 |
| V sur la ligne des premiers parents de T ; V introuvable | cas 17 |
| un commit qui ne touche que des index générés ; un commit vide | cas 3, 10, 13, 18 |
| classe « régénéré » | cas 3, 4, 5, 21 |
| classe « sans commande », contre le second parent et jamais le sommet courant | cas 6, 19 |
| classe « motif » | cas 7, 20 |
| une fusion à plus de deux parents | cas 22 |
| la liste lue sur la cible, jamais sur la PR ni dans l'arbre de travail ; cible sans liste | cas 23 |
| un chemin cité par git ne touche aucun index | cas 24 |
| les deux cas que la définition par M jugeait mal | cas 8, 9 |
| les commits que `passer.sh` et `sujet.sh fusionner` écrivent | cas 11, 12 |
| `illisible`, sorties 21 et 69, jamais `même` | cas 25, 26, 27, 28 |
| version et note | les tests de version de `scripts/depot.test.mjs` (`:1032-1041`) |

Le cas n est le n-ième test du banc, dans l'ordre du fichier.

## Vérification

1. `node --test skills/chaine/fusionner/scripts/meme-contenu.test.mjs` : 28 tests verts (environ 15 s à l'écriture, dont environ 5 s pour les cas 11 et 12).
2. **Les mutations**, chacune appliquée seule à `meme-contenu.sh`, le banc rejoué, puis retirée. Chacune doit rougir au moins le test nommé ; toutes ont été jouées à l'écriture, et toutes sont tuées.

   | n° | Mutation | Test qui rougit, au moins |
   | -- | -------- | ------------------------- |
   | 1 | ne plus vérifier que le second parent est un ancêtre de la cible : la sortie 1 de `git merge-base --is-ancestor` ne rend plus `différent` | cas 16 (et 9, 12) |
   | 2 | comparer les index aussi : `classe` rend toujours `hors` | cas 3, 4 (et 5, 6, 7, 12, 18) |
   | 3 | accepter un commit quelconque : l'écart d'un commit à un parent n'est plus lu (`ecart=`) | cas 13, 18 (et 19, 20, 21, 23, 24) |
   | 4 | lire la liste dans l'arbre de travail d'abord : `cat scripts/docs/index-generes.json \|\| git cat-file blob …` | cas 23 |
   | 5 | suivre tous les parents : `git rev-list --topo-order --reverse` à la place de `--first-parent --reverse` | cas 17 (et presque tous les autres) |
   | 6 | tolérer un `git merge-tree` en échec : sans arbre calculé, prendre celui du commit | cas 27 |
   | 7 | dispenser un index sans commande ou sous motif sans le comparer au second parent | cas 19, 20 |
   | 8 | ne plus comparer l'arbre d'une fusion à la fusion calculée : `ecart=` dans la branche à deux parents | cas 14, 15 (et 19, 20) |
   | 9 | prendre pour contenu connu le sommet courant de la cible : `entree "$cible" "$f"` à la place de `entree "$p2" "$f"` | cas 6 |
   | 10 | dispenser un index régénéré devenu lien symbolique | cas 21 |
   | 11 | accepter un clone superficiel | cas 26 |
   | 12 | accepter une fusion à plus de deux parents | cas 22 |
   | 13 | prendre un index sous motif pour un index régénéré : la branche `motif` de `classe` jamais prise | cas 20 |
   | 14 | dispenser un index sans commande ou sous motif dans un commit à un parent | cas 19, 20 |
   | 15 | tolérer une cible absente : `cible=$T` quand `origin/<B>` manque | cas 25 |
   | 16 | lire une liste mal formée comme une liste vide | cas 25 |
   | 17 | lire les chemins d'un commit à un parent avec `-z`, puis les couper ligne à ligne (`tr '\0' '\n'`) | cas 24 |
   | 18 | rendre `même` quand V est introuvable | cas 17 |

3. La suite entière (`pnpm test`), verte. À l'écriture : 793 tests, tous verts, sur les fichiers définitifs ; le test des bancs posés à plat, qui rejoue ce banc hors du plugin, a pris de 225 à 443 s sur 600, selon la charge de la machine (trois passes ; d'autres sessions y tournaient). Ce banc seul y compte pour une quinzaine de secondes.
4. `git diff --stat origin/main` : quatre fichiers, dont deux créés. `git diff origin/main -- skills/chaine/sujet/scripts/depot-jouet.mjs` : vide.
5. Le banc ne laisse rien : `TMPDIR=<dossier vide> node --test skills/chaine/fusionner/scripts/meme-contenu.test.mjs`, puis le dossier est vide (vérifié à l'écriture).

## Ce qui n'a pas été établi

1. **La fusion calculée contre la fusion réelle, quand la configuration de fusion diffère** entre le poste qui a fusionné et celui qui calcule : pilotes de fusion de `.gitattributes`, renormalisation des fins de ligne, `merge.renames`. L'égalité des arbres de `git merge` et de `git merge-tree --write-tree` n'a été jouée que sur les dépôts jouets, sous la configuration par défaut. Un seul essai hors banc : un renommage fusionné par défaut, puis jugé avec `merge.renames=false` chez qui calcule, rend « même » encore. Le reste n'est pas joué ; un écart donnerait « différent », du côté sûr.
2. **Le `pre-commit` d'un projet sur une fusion que le capitaine conclut** (rapport § 2.2, limite 5) : rejoué ici par une fusion amendée (cas 15), pas par un vrai `lint-staged`.
3. **Le conflit de pile résolu par `passer.sh`** (même limite) : rejoué par un choix de côté à la main (cas 14), pas par `passer.sh` sur une vraie pile.
4. **Une sous-PR d'un sujet mise à jour deux fois par `sujet.sh fusionner`** : le cas 12 n'en joue qu'une (sortie 8). Les deux mises à jour de suite sont jouées par `passer.sh` (cas 11) et par l'aide du banc (cas 5).
5. **git < 2.38 et bash 3.2** (macOS) : le script n'emploie ni `mapfile` ni `tac`, mais il n'a été joué que sous git 2.43.0 et bash 5.2.21.
6. **Un historique très long** (des dizaines de milliers de commits sur la ligne des premiers parents de T) : une seule commande `git rev-list` la lit ; non mesuré.
7. **Les cas 11 et 12 dépendent de l'appel de `passer.sh` et de `sujet.sh fusionner`** tels qu'ils sont sur `main`. Un ticket de l'autre programme qui change cet appel (son ticket 4 rend `CAPITAINE_ID` obligatoire) devra les garder verts ; ils passent par `d.lancer` et `d.env`, donc par l'environnement que `depot-jouet.mjs` donnera alors. Non essayé contre ces tickets, qui ne sont pas sur `main`.
8. **Ce que l'appelant fait de « illisible »** (pause, renvoi, nouvel essai) : lots 4 et 5a.
9. **La marge du plafond de 600 s** : le test des bancs posés à plat n'a pas été mesuré sans ce banc. Sous charge il a pris 443 s, banc compris ; ce plafond ne dépend pas de ce ticket, mais un lot suivant qui ajoute un banc long le trouvera proche.

## Hors périmètre

- Tout appel du calcul : `passer.sh`, `sujet.sh` (lot 5a), le skill `relecteur` (lot 4). Tout `git fetch` : c'est l'appelant qui relit la cible.
- `skills/chaine/sujet/scripts/depot-jouet.mjs` (tickets 4 et 13 de l'autre programme) : non modifié. Sa liste `CHAINE`, que `publierChaine()` publie sur le `develop` du jouet, ne nomme pas `meme-contenu.sh` : le lot 5a, qui le fera appeler par la boucle, l'y ajoutera.
- `github.sh` : ses lecteurs d'index (`index_json`, `index_regeneres_regex`, `index_regeneres_motifs_regex`) restent tels quels, arbre de travail d'abord ; `livraison_intermediaire` aussi.
- `skills/chaine/fusionner/references/CONTENU.md`, `fusionner/SKILL.md`, `README.md`, `CONTEXT.md`, `scripts/points-d-entree.test.mjs`, `scripts/poses.test.mjs` : aucune ligne (Décision 12).
- Le lecteur de verdict et la fonction de décision (lot 3a), « double relecture exigée » (lot 3c).

## Comments

- 2026-11-18 — Ticket écrit et joué sur une copie jetable d'`origin/main` à `99a6214` (plugin 7.18.0 ; la spec et le rapport citent `1c4acb1`, 7.17.0 : `main` a avancé depuis, jusqu'à `22b2d49`, 7.18.1, sans toucher un fichier de la chaîne). Joué : le banc (28 tests), les 18 mutations, la suite entière, puis le banc seul sur `22b2d49` depuis les annexes. Non joué : ce que liste « Ce qui n'a pas été établi ».
- 2026-11-18 — Décisions de l'architecte portées au ticket (`A-112`) : un index sous motif récrit d'un contenu nouveau donne « différent », la relecture de plus est acceptée ; les choix du rédacteur sont confirmés (commit à un parent, lien symbolique, clone superficiel, commit vide, V introuvable, forme `.sh`, `<B>` nom de branche, codes 0, 20, 21 et 69, cas 8). Base relue : `origin/main` à `22b2d49` (7.18.1). Ni le script ni le banc ne changent, leurs empreintes non plus : rien n'a été rejoué.

## Annexe A — `skills/chaine/fusionner/scripts/meme-contenu.sh`

`git hash-object` : `c5316178fbee66545063910dab8f91b391fef681`.

````bash
#!/usr/bin/env bash
# =============================================================================
# « Même contenu propre » : le sommet d'un verdict (V) et le sommet jugé (T) d'une PR ne sont-ils séparés que par
# des fusions de la cible et des commits d'index générés ? Un seul calcul, pour le capitaine et pour le Relecteur.
#
#   bash scripts/chaine/meme-contenu.sh <V> <T> <B>
#
#   <V>  sommet du verdict, sha de 40 caractères
#   <T>  sommet jugé, sha de 40 caractères
#   <B>  branche cible de la PR (`develop`, `sujet/<nom>`), lue dans `refs/remotes/origin/<B>` : qui appelle l'a
#        relue juste avant (`git fetch origin "+refs/heads/<B>:refs/remotes/origin/<B>"`) ; ce script ne lit pas
#        le réseau, ni aucun arbre de travail, et n'écrit que des objets git (l'arbre de `git merge-tree`).
#
# De V à T, sur la ligne des premiers parents de T, chaque commit est :
#   - une fusion à deux parents, dont le second est un ancêtre de origin/<B>, et dont l'arbre est celui de la
#     fusion calculée de ses deux parents (`git merge-tree --write-tree`, arbre pris même en conflit), aux index
#     générés près ;
#   - ou un commit à un parent qui ne touche que des index générés.
# Les index générés sont ceux de `origin/<B>:scripts/docs/index-generes.json` (fichier absent : aucun). Un chemin
# en écart est dispensé selon sa classe, dans cet ordre :
#   motif         il touche une entrée à `commande` dont le chemin porte `*` : dispensé seulement dans une fusion,
#                 quand son entrée (mode et blob) est celle du second parent ;
#   sans-commande aucune entrée à `commande` ne le touche : de même ;
#   régénéré      sinon (un chemin littéral à `commande`) : dispensé, absent ou fichier ordinaire.
# Un index dispensé n'est jamais un lien symbolique ni un sous-module.
#
# Sortie standard, écrite en dernier et d'un bloc : ligne 1 le verdict, ligne 2 sa raison.
# Sorties : 0 `même` · 20 `différent` · 21 `illisible` (usage, dépôt, réf, liste ou git en échec : jamais `même`)
# · 69 jq absent. Seul 0 vaut `même` : tout autre code (signal, erreur de bash) se lit `illisible`.
# =============================================================================
# Sans `set -e` : le statut de chaque commande est lu, et sa suite écrite (`différent`, `illisible`, ou on continue).
set -uo pipefail

rendre() { # <code> <verdict> <raison>
  printf '%s\n%s\n' "$2" "$3"
  exit "$1"
}
meme() { rendre 0 même "$1"; }
different() { rendre 20 différent "$1"; }
illisible() { rendre 21 illisible "$1"; }

[ $# -eq 3 ] || illisible "usage : meme-contenu.sh <V> <T> <B>"
V=$1 T=$2 B=$3
[[ "$V" =~ ^[0-9a-f]{40}$ ]] || illisible "V n'est pas un sha de 40 caractères : $V"
[[ "$T" =~ ^[0-9a-f]{40}$ ]] || illisible "T n'est pas un sha de 40 caractères : $T"
command -v jq >/dev/null || rendre 69 illisible "jq est requis par les scripts de la chaîne : sudo apt install jq (ou brew install jq)"
git rev-parse --git-dir >/dev/null 2>&1 || illisible "pas dans un dépôt git"
git check-ref-format "refs/remotes/origin/$B" 2>/dev/null || illisible "nom de branche cible invalide : $B"
git cat-file -e "$T^{commit}" 2>/dev/null || illisible "T introuvable dans ce dépôt : $T"
[ "$V" != "$T" ] || meme "V est T"

court() { printf '%s' "${1:0:9}"; }
superficiel=$(git rev-parse --is-shallow-repository 2>/dev/null) || illisible "git rev-parse --is-shallow-repository en échec"
[ "$superficiel" = false ] || illisible "clone superficiel : l'historique est tronqué (git fetch --unshallow origin)"
cible=$(git rev-parse -q --verify "refs/remotes/origin/$B^{commit}" 2>/dev/null) || illisible "origin/$B introuvable : relire la cible d'abord"
git cat-file -e "$V^{commit}" 2>/dev/null || different "V introuvable dans ce dépôt (branche réécrite ?) : $(court "$V")"

# La ligne des premiers parents de T, du plus ancien au plus récent : le chemin est ce qui suit V.
ligne=$(git rev-list --first-parent --reverse "$T" 2>/dev/null) || illisible "git rev-list --first-parent en échec"
grep -qxF "$V" <<<"$ligne" || different "V ($(court "$V")) n'est pas sur la ligne des premiers parents de T ($(court "$T"))"
chemin=$(awk -v v="$V" 'suite { print } $0 == v { suite = 1 }' <<<"$ligne")

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
entree_liste=$(git ls-tree "$cible" -- scripts/docs/index-generes.json 2>/dev/null) || illisible "arbre de origin/$B illisible"
if [ -z "$entree_liste" ]; then
  liste='{"index":[]}'
else
  liste=$(git cat-file blob "$cible:scripts/docs/index-generes.json" 2>/dev/null) || illisible "scripts/docs/index-generes.json de origin/$B illisible"
fi
[ "$(jq -r "$FORME" <<<"$liste" 2>/dev/null)" = true ] || illisible "scripts/docs/index-generes.json de origin/$B mal formé"
regex=$(jq -r "$REGEX" <<<"$liste" 2>/dev/null) && [ "$(grep -c . <<<"$regex")" = 3 ] || illisible "scripts/docs/index-generes.json de origin/$B : liste des index illisible"
GENERES=$(sed -n 1p <<<"$regex")
REGENERES=$(sed -n 2p <<<"$regex")
MOTIFS=$(sed -n 3p <<<"$regex")

# Classe d'un chemin, dans l'ordre de `livraison_intermediaire` : hors, motif, sans-commande, régénéré.
classe() {
  if ! [[ "$1" =~ $GENERES ]]; then echo hors
  elif [[ "$1" =~ $MOTIFS ]]; then echo motif
  elif ! [[ "$1" =~ $REGENERES ]]; then echo sans-commande
  else echo régénéré; fi
}
# Entrée d'un chemin dans l'arbre d'un commit : « mode sha », vide s'il est absent. Sortie 1 : git en échec.
entree() { git ls-tree "$1" -- "$2" 2>/dev/null | awk -F '\t' '{ split($1, e, " "); print e[1] " " e[3] }'; }
ordinaire() { [[ "$1" =~ ^100(644|755)\  ]]; }

# Juge un chemin en écart du commit <c>. <p2> : le second parent d'une fusion, vide pour un commit d'index.
# Rien sur la sortie : dispensé. Sinon la raison. Sortie 1 : lecture en échec.
juger_chemin() {
  local c=$1 p2=$2 f=$3 e ep
  case $(classe "$f") in
    hors) echo "$f n'est pas un index généré de origin/$B" ;;
    régénéré)
      e=$(entree "$c" "$f") || return 1
      [ -z "$e" ] || ordinaire "$e" || echo "$f, index généré, n'est plus un fichier ordinaire"
      ;;
    *)
      [ -n "$p2" ] || { echo "$f, index sans commande ou déclaré par motif, change dans un commit d'index : aucun contenu connu"; return 0; }
      e=$(entree "$c" "$f") || return 1
      ep=$(entree "$p2" "$f") || return 1
      [ -n "$e" ] && ordinaire "$e" && [ "$e" = "$ep" ] || echo "$f, index sans commande ou déclaré par motif, n'a pas le contenu de la cible fusionnée"
      ;;
  esac
}

fusions=0
index=0
while IFS= read -r c; do
  [ -n "$c" ] || continue
  parents=$(git rev-list --parents -n 1 "$c" 2>/dev/null) || illisible "parents de $(court "$c") illisibles"
  read -r _ p1 p2 reste <<<"$parents"
  [ -n "${p1:-}" ] || illisible "commit sans parent sur le chemin de V à T : $(court "$c")"
  [ -z "${reste:-}" ] || different "$(court "$c") est une fusion à plus de deux parents"
  if [ -n "${p2:-}" ]; then
    git merge-base --is-ancestor "$p2" "$cible" 2>/dev/null && rc=0 || rc=$?
    case $rc in
      0) ;;
      1) different "la fusion $(court "$c") a pour second parent $(court "$p2"), qui n'est pas un ancêtre de origin/$B" ;;
      *) illisible "git merge-base --is-ancestor en échec ($rc) sur $(court "$c")" ;;
    esac
    calcule=$(git merge-tree --write-tree --no-messages "$p1" "$p2" 2>/dev/null) && rc=0 || rc=$?
    [ "$rc" -le 1 ] || illisible "git merge-tree --write-tree en échec ($rc) sur $(court "$c") (git ≥ 2.38 requis)"
    arbre=$(sed -n 1p <<<"$calcule")
    [[ "$arbre" =~ ^[0-9a-f]{40}$ ]] || illisible "arbre de la fusion calculée de $(court "$c") illisible"
    ecart=$(git -c core.quotePath=false diff --no-renames --name-only "$arbre" "$c" 2>/dev/null) || illisible "écart de la fusion $(court "$c") illisible"
    sorte="la fusion $(court "$c") s'écarte de la fusion calculée de ses parents"
    fusions=$((fusions + 1))
  else
    ecart=$(git -c core.quotePath=false diff --no-renames --name-only "$p1" "$c" 2>/dev/null) || illisible "diff de $(court "$c") illisible"
    sorte="le commit $(court "$c") n'est ni une fusion de la cible ni un commit d'index"
    index=$((index + 1))
  fi
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    motif=$(juger_chemin "$c" "${p2:-}" "$f") || illisible "arbre de $(court "$c") illisible pour $f"
    [ -z "$motif" ] || different "$sorte : $motif"
  done <<<"$ecart"
done <<<"$chemin"
meme "de V à T : $fusions fusion(s) de origin/$B, $index commit(s) d'index générés"
````

## Annexe B — `skills/chaine/fusionner/scripts/meme-contenu.test.mjs`

`git hash-object` : `f6eebfd4b8f90d7882410ab5fbe67ed68e4b1b87`.

````js
// `meme-contenu.sh` : « même contenu propre », de V (sommet du verdict) à T (sommet jugé), pas à pas sur la ligne
// des premiers parents. Dépôts jouets (depot-jouet.mjs, sans le modifier) : de vraies fusions git, et deux cas
// où ce sont passer.sh et sujet.sh qui écrivent les commits du capitaine. Aucun réseau.
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, symlinkSync, writeFileSync } from "node:fs";
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

// Le calcul, depuis le clone de travail : { code, verdict, raison }.
function juger(d, V, T, B = "develop", { env = d.env, cwd = d.travail } = {}) {
  const r = spawnSync("bash", [CALCUL, V, T, B], { cwd, env, encoding: "utf8" });
  const [verdict = "", raison = ""] = r.stdout.split("\n");
  return { code: r.status, verdict, raison, sortie: r.stdout + r.stderr };
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
test("deux bases de fusion : même une fois le sujet rafraîchi (la définition par M disait différent), différent avant", () => {
  const d = depotJouet();
  const { V, T0, rafraichir } = deuxBases(d);
  estDifferent(juger(d, V, T0, "sujet/x"), /second parent .* pas un ancêtre de origin\/sujet\/x/);
  rafraichir();
  assert.equal(d.git("merge-base", "--all", T0, "origin/sujet/x").split("\n").length, 2, "deux bases de fusion");
  estMeme(juger(d, V, T0, "sujet/x"), /1 fusion\(s\) de origin\/sujet\/x/);
  const T1 = miseAJour(d, "travail", "sujet/x", rien);
  estMeme(juger(d, V, T1, "sujet/x"), /2 fusion\(s\)/);
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
  estDifferent(juger(d, V, T, "develop"), /second parent .* pas un ancêtre de origin\/develop/);
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
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /second parent .* pas un ancêtre de origin\/develop/);
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
  estDifferent(juger(d, V, d.git("rev-parse", "HEAD")), /apps\/gen\/glisse\.ts, index sans commande ou déclaré par motif, n'a pas le contenu de la cible fusionnée/);
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
  estIllisible(juger(d, V.slice(0, 12), T), /V n'est pas un sha de 40 caractères/);
  estIllisible(juger(d, V, "origin/feat/a"), /T n'est pas un sha de 40 caractères/);
  estIllisible(juger(d, V, T, "a..b"), /nom de branche cible invalide/);
  const sans = spawnSync("bash", [CALCUL, V, T], { cwd: d.travail, env: d.env, encoding: "utf8" });
  assert.deepEqual([sans.status, sans.stdout.split("\n")[0]], [21, "illisible"]);
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

test("illisible : sans jq, sortie 69, jamais « même »", () => {
  const d = depotJouet();
  const V = pousser(d, "feat/a", { "apps/a.ts": "a\n" });
  pousser(d, "develop", { "docs/b.md": "b\n" });
  const T = miseAJour(d, "feat/a", "develop", rien);
  // Un PATH qui ne porte que bash : le script s'arrête à sa garde, avant tout git.
  const bin = dossierTemporaire("sans-jq-");
  symlinkSync(spawnSync("sh", ["-c", "command -v bash"], { env: d.env, encoding: "utf8" }).stdout.trim(), join(bin, "bash"));
  const r = juger(d, V, T, "develop", { env: { ...d.env, PATH: bin } });
  assert.deepEqual([r.code, r.verdict], [69, "illisible"], r.sortie);
  assert.match(r.raison, /jq est requis/);
});
````
