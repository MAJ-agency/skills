# Suites du skill `relecture` : la résolution découpée en lots, la branche P9 du tri tenue par le banc, la note de version qui dit la résolution relue, le binaire que seule la résolution touche

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — quatre défauts mesurés (trois mineurs de la contre-relecture, un trou trouvé en préparant le ticket), chacun avec sa décision, ses fichiers, ses cas de banc et ses mutations ; les cas des défauts 2 et 4 sont donnés entiers, vus rouges puis verts ; rien à concevoir au-delà de ce que le ticket donne.
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/relecture/scripts/gestes.sh`, `scripts/relecture.test.mjs`, `skills/chaine/relecture/SKILL.md`, `skills/chaine/relecture/references/gestes.md`, `skills/chaine/relecture/references/cas-limites.md` (aucune PR ouverte ne les touche) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` (les PR 141 et 44, ouvertes, les touchent aussi : la note de ce ticket s'écrit en tête au moment de livrer, sur la version de `main` d'alors) ; `README.md` (la PR 141 le touche ; ce ticket ne le modifie pas).

## Le besoin

La contre-relecture de la PR 142 (ticket 61, le skill `relecture`), troisième passage, sommet `9e4d8df`, a rendu « conforme » et laissé trois mineurs (défauts 1 à 3) (rapport : `issues/61-annexes/contre-relecture-40428bf/rapport.md`, section « Troisième passage », essais `e19` et `e21`, bibliothèque `outils/jouet.sh`). Les essais dont ce ticket a besoin sont copiés sous `issues/63-annexes/` de cette branche de documentation, qu'une session partie de `main` lit ici : `outils/jouet.sh`, `essais/e19-resolution-hostile.sh`, `essais/e21-insertion.sh`, `essais/e22-binaire-resolution.sh` (défaut 4) et `essais/e4b-texte-binaire-contre-develop.sh` (du relecteur du ticket) ; chacun se joue par `PLUGIN=<clone du plugin> ESSAIS=<dossier vide> bash 63-annexes/essais/<essai>.sh`. Le rapport de la relecture du ticket : `63-annexes/relecture-tour-1.md`. La PR est entrée dans `main` à `e64f93b` (plugin 7.36.0) ; les fichiers en cause y sont identiques à `9e4d8df` :

```text
$ git diff --stat 9e4d8df e64f93b -- skills/chaine/relecture scripts/relecture.test.mjs NOTES-DE-VERSION.md .claude-plugin/plugin.json
(rien)
```

Tout ce qui suit est mesuré sur un clone neuf de `origin/main` à `e64f93b`, Node 22.23.5, git 2.43.0, poste à 4 cœurs. Le banc du skill y est vert :

```text
$ node --test --test-reporter=spec scripts/relecture.test.mjs
ℹ tests 31
ℹ pass 31
ℹ fail 0
ℹ duration_ms 32262.489147
```

Le défaut 4 a été trouvé en préparant ce ticket, à la demande de l'architecte (`A-167`). Les décisions citées vivent dans `relecture-independante.spec.md` (branche de l'architecte) : `A-150` (les lots de plus de 2 000 lignes sont calculés par le script, leur union comparée au diff relu, leurs diffs dans l'empreinte), `A-162` (B7 : une ligne retirée n'est écartée que si `develop` retire le même morceau, au même endroit), `A-164` (sur une PR de mise à jour, le diff de la résolution, `git show --remerge-diff` du commit de fusion, se relit en entier par l'axe Règles ; `tri` n'écarte une ligne retirée que si la résolution n'a ni récrit ni retiré le morceau de `develop`), `A-167` (ticket 63 : la résolution se découpe en lots par la fonction `lots` déjà en place, sur le même seuil, sous `lots/resolution-<j>/` ; `lus` ne refuse pas encore le diff entier quand des lots existent, et ce refus, s'il vient, vaudra pour le diff relu comme pour la résolution).

### 1. La résolution n'est pas découpée en lots

**Le fait.** `diff` (`gestes.sh`, `diff_relu`) écrit `resolution.patch` et `resolution.txt` (`resolution()`, `gestes.sh:323-332`), puis découpe en lots le seul `diff.patch` (`lots`, `gestes.sh:338-393`, appelée une fois, `:309`). `lus '<brouillons>' 1 resolution` (`gestes.sh:572-577`) compare ce que l'axe a lu à `resolution.txt` entier. Au-delà de 2 000 lignes, la résolution reste un lot, que l'axe Règles reçoit d'un bloc.

**La règle des lots, dans le skill.** `gestes.sh:334-337` (commentaire de `lots`), `SKILL.md:69` (« **Plus de 2 000 lignes** : le script écrit les lots (`lots/lot-<i>/`), vérifie que leur union est le diff relu, et les nomme »), `SKILL.md:108` (« Avec des lots, chaque axe se lance une fois par lot… Sur une PR de mise à jour dont la résolution touche un fichier, l'axe Règles se lance une fois de plus, `{{DIFF}}` étant `resolution.patch`, comme un lot nommé `resolution`. »), `references/gestes.md:42`, `references/cas-limites.md:60` et `:80-82`. Par zone (`apps/<x>`, `packages/<x>`, sinon le premier dossier, la racine à part), une zone entière dans un lot quand elle tient, un fichier de plus de 2 000 lignes seul dans le sien ; un seul lot au total : pas de lots, le diff entier (`gestes.sh:369-372`). La règle vise `diff.patch` seul ; rien ne la dit pour `resolution.patch`.

**La mesure.** L'essai `e19` du rapport rejoué tel quel sur `e64f93b` (`PLUGIN=<clone de main> bash 63-annexes/essais/e19-resolution-hostile.sh`) : un conflit sur un fichier au nom hostile et sur `apps/api/src/gros.ts` de 3 000 lignes, résolus « ours ». Sortie brute utile (le chemin des brouillons remplacé par `<brouillons>`) :

```text
diff relu : 0 fichiers, 0 lignes ; hors du diff : 0 ; sans écart : 2 ; binaires : 0, dont illisibles : 0
résolution de la fusion : 2 fichiers
{{DIFF}} de la résolution, pour l'axe Règles : <brouillons>/resolution.patch
diff : sortie 0
--- resolution.patch : 3027 lignes ; en-têtes :
diff --git a/apps/api/src/gros.ts b/apps/api/src/gros.ts
diff --git "a/apps/api/src/tab\there é \"q\" $(touch PIEGE).ts" "b/apps/api/src/tab\there é \"q\" $(touch PIEGE).ts"
résolution de la fusion : 2 fichiers, que l'axe Règles lit
lus : sortie 0
```

Aucune ligne `lot …` ni `lots : …` ; après `diff`, `lots/` ne porte que `resolution/`, que `lus 1 resolution` crée. Lignes par fichier de `resolution.patch` :

```text
$ awk '/^diff --git /{h=$0} {n[h]++} END{for(k in n) print n[k], k}' resolution.patch
11 diff --git "a/apps/api/src/tab\there é \"q\" $(touch PIEGE).ts" "b/apps/api/src/tab\there é \"q\" $(touch PIEGE).ts"
3016 diff --git a/apps/api/src/gros.ts b/apps/api/src/gros.ts
```

La même fonction `lots`, extraite telle quelle de `gestes.sh` (avec `dire`, `quitter`, `lignes`, `RELUS_SED`, `relus_de`) et jouée seule sur une copie où `diff.patch` est ce `resolution.patch` et `relus.txt` ce `resolution.txt`, découpe et vérifie sans retouche :

```text
lot 1 : 1 fichiers, 3016 lignes, {{DIFF}} : <copie>/lots/lot-1/diff.patch
lot 2 : 1 fichiers, 11 lignes, {{DIFF}} : <copie>/lots/lot-2/diff.patch
lots : 2
sortie 0
```

**La cause.** `lots` lit des chemins fixes (`$B/diff.patch`, `$B/relus.txt`, `$B/lots/lot-<i>`), et `diff_relu` ne l'appelle que pour le diff relu. Le contre-relecteur le dit : « ce n'est pas une validation à tort que je puisse montrer : c'est la même confiance que pour un fichier de plus de 2 000 lignes seul dans son lot » ; c'est donc un mineur, mais la règle d'`A-150` ne tient pas pour le second diff que l'axe Règles reçoit.

### 2. La branche « `develop` ne fait que retirer » du contrôle côté fusion n'est pas tenue par le banc

**Le fait.** Dans `meme_retrait` (`gestes.sh:608-648`), le dernier contrôle lit `git diff -U0 <fusion>^2 <fusion>` (ce que la résolution change par rapport à `develop`) et refuse d'écarter la ligne si un morceau de ce diff touche ce que `develop` met à sa place. Trois branches (`gestes.sh:644-646`) :

```awk
      if (k > 0 && o[2] > 0 && o[1] <= c + k - 1 && o[1] + o[2] - 1 >= c) touche = 1
      if (k > 0 && o[2] == 0 && o[1] >= c && o[1] < c + k) touche = 1
      if (k == 0 && o[2] == 0 && o[1] == c) touche = 1 }
```

La troisième (`k == 0` : le morceau de `develop` ne fait que retirer ; la fusion insère juste à ce point) n'a aucun cas : la mutation P9 du rapport, qui la retire, reste verte.

**La mesure.** La mutation P9, écrite exactement (la ligne garde son `}`, qui ferme le bloc `/^@@ /`) :

```diff
-      if (k == 0 && o[2] == 0 && o[1] == c) touche = 1 }
+      }
```

Attention : supprimer la ligne entière ôte aussi ce `}`, l'`awk` ne se compile plus, `meme_retrait` sort en 1 et `tri` rend « gardé » pour une mauvaise raison (vu : `e21` rend `1 : gardé` sous cette fausse mutation).

- `e21` (`63-annexes/essais/e21-insertion.sh`) rejoué sur `e64f93b` : `develop` retire la garde de `lire()` ; la résolution écrit `if (admin === undefined) return 2;` à sa place. `tri` : `1 : gardé`. Sous P9 : `1 : écarté, develop retire seul cette ligne`. Les fichiers de `tri` sous P9, bruts :

  ```text
  == tri-1-develop.diff
  @@ -2 +1,0 @@ export function lire(admin) {
  -  if (!admin) throw new Error("interdit");
  @@ -5 +4 @@ export function lire(admin) {
  == tri-1-fusion.diff
  @@ -1,0 +2 @@ export function lire(admin) {
  +  if (admin === undefined) return 2;
  @@ -4 +5 @@ export function lire(admin) {
  ```

  Le morceau de `develop` est `-2 +1,0` (donc `c = 1`, `k = 0`) ; la fusion insère en `-1,0` (`o[1] = 1`, `o[2] = 0`) : seule la troisième branche le voit.
- Le banc entier sous P9, sans cas nouveau : `ℹ tests 31`, `ℹ pass 31`, `ℹ fail 0`, statut 0.

**La cause.** Les cas d'`A-162` et d'`A-164` au banc couvrent un `develop` qui retire sans que la résolution touche ce point (« 3 : écarté », témoin) et un `develop` qui récrit (`k > 0`, la garde `Forbidden`) ; aucun ne couvre un `develop` qui ne fait que retirer et une résolution qui insère là. L'insertion reste lisible dans le diff relu et dans `resolution.patch` (d'où le mineur), mais sans cette branche `tri` écarterait la ligne retirée.

### 3. La note 7.36.0 ne dit rien de la résolution relue

**Le fait.**

```text
$ grep -c remerge NOTES-DE-VERSION.md
0
$ sed -n 5,16p NOTES-DE-VERSION.md | grep -c -i 'résolution\|mise à jour'
0
```

La note 7.36.0 (lignes 5 à 16) décrit le skill entier, lots compris (« Au-delà de 2 000 lignes, le script découpe les lots et vérifie leur union »), mais pas `A-164`, portée par le second tour sur la PR (`9e4d8df`), après l'écriture de la note.

**La règle des notes, dans le dépôt.** `README.md:193` (« Ajouter un skill », point 4) : bumper `version` dans `.claude-plugin/plugin.json`, « Patch pour une correction, mineure pour un skill ou un gabarit ajouté, majeure quand un skill existant change de contrat. Écrire sa note en tête de `NOTES-DE-VERSION.md` (« Ce qui change », « Ce qu'un projet fait pour en profiter »). » ; `README.md:195` : « Cette règle vaut pour **tout** changement de contenu ». En-tête de `NOTES-DE-VERSION.md:3` : « La plus récente en haut… Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter. » Aucun texte du dépôt ne dit de récrire une note livrée (recherche de « note livrée », « récri… note », « note publiée » dans `README.md`, `CONTEXT.md`, `CLAUDE.md`, `NOTES-DE-VERSION.md`, `docs/agents/` et les `SKILL.md` de la chaîne : rien). La règle ne dit donc pas autre chose que la consigne : une note neuve en tête, la 7.36.0 laissée telle quelle.

**Ce que les bancs en lisent.** `scripts/depot.test.mjs:1204-1213` : la première note commence par la version de `plugin.json` et porte les deux sections. `scripts/relecture.test.mjs:458-461` : la **première** note qui contient « skill `relecture` » porte les deux sections ; si la note neuve écrit ces mots, c'est elle que ce test lit (elle porte les deux sections : rien à changer au banc).

### 4. Un binaire que seule la résolution touche n'est pas un binaire du tour

**Le fait.** `binaires.txt` (`gestes.sh:303-304`) se lit dans `git diff --numstat` de la base à la tête, restreint à `attendus.txt` ; `illisibles.txt` (`:307`) et `binaires-sensibles.txt` (`axes`, `:423-426`) en dérivent. Un fichier de `resolution.txt` sans écart contre le sujet n'est pas dans `attendus.txt` : s'il est binaire, aucune de ces trois listes ne le voit, et `lus 1 resolution` exige que l'axe Règles le dise lu.

**La mesure.** L'essai `63-annexes/essais/e22-binaire-resolution.sh` (`VARIANTE=neuf`, `ours` ou `ajout`), joué sur `e64f93b` ; le relecteur du ticket a trouvé le même trou par un conflit modify/modify au lieu d'add/add : `develop` et le sujet ajoutent chacun `apps/api/src/auth/cle.bin` (chemin sensible du jouet), binaire, sous deux formes ; la fusion est en conflit (add/add), et trois résolutions :

- **neuve** (la résolution écrit une troisième forme) : `binaires.txt`, `illisibles.txt` et `binaires-sensibles.txt` portent `cle.bin` (« binaires : 1, dont illisibles : 1 », « binaires sous un chemin sensible : 1 ») ; `resolution.patch` porte `Binary files a/apps/api/src/auth/cle.bin and b/apps/api/src/auth/cle.bin differ` ; l'empreinte porte `resolution.patch` et `resolution.txt`. Tient.
- **un fichier ajouté hors des conflits** (`ajout.bin`) : `liste` sort en 4, « elle écrit hors des fichiers en conflit (apps/api/src/auth/ajout.bin ) » (`C2`). Tient.
- **« ours »** (la résolution garde la clé du sujet et jette celle de `develop`) : le trou. Sortie brute utile :

```text
diff-revue : diff vide contre origin/sujet/facture (zones : :(literal)apps/api/src/auth/cle.bin) : rien à relire
diff relu : 0 fichiers, 0 lignes ; hors du diff : 0 ; sans écart : 1 ; binaires : 0, dont illisibles : 0
résolution de la fusion : 1 fichiers
--- resolution.patch :
diff --git a/apps/api/src/auth/cle.bin b/apps/api/src/auth/cle.bin
remerge warning: Cannot merge binary files: apps/api/src/auth/cle.bin (494315c (feat(facture): la clé du sujet) vs. df95d3d (feat: la clé de develop))
remerge CONFLICT (add/add): Merge conflict in apps/api/src/auth/cle.bin
chemins sensibles : 1
apps/api/src/auth/cle.bin	apps/api/src/auth/
binaires sous un chemin sensible : 0
binaires illisibles : 0
--- empreinte, lignes qui nomment la résolution ou la clé :
6cbfd5505c5d7587ab9c3e3adc45da3fc62dea7f resolution.patch
15a5045019c6302ed9c33a4cb4f8cb70274f76a8 resolution.txt
fichiers du diff relu que l'axe n'a pas lus :
apps/api/src/auth/cle.bin
lus : sortie 1
```

`resolution.patch` n'a que l'en-tête et les deux lignes `remerge` : git garde, pour un conflit binaire, la version du premier parent, et la résolution « ours » ne s'en écarte pas, donc aucune ligne `Binary files … differ`. `git show --remerge-diff --numstat` de la fusion ne rend rien ; `git diff --numstat <fusion>^2 <fusion>` rend `-	-	apps/api/src/auth/cle.bin`. L'empreinte hache `resolution.patch` et `resolution.txt`, pas le binaire, comme pour un binaire du diff relu (aucun axe ne le lit) : elle tient.

**La cause.** La liste des binaires ne lit que le diff de la base à la tête. Ce que la résolution jette d'un binaire de `develop` ne s'y voit pas ; l'axe Règles reçoit un en-tête sans contenu, et devrait le dire lu. Un fichier sensible que personne ne peut lire ne se valide pas (`SKILL.md`, étape 4) : ici, rien ne le nomme comme tel.

## Où

- `skills/chaine/relecture/scripts/gestes.sh` : `lots` (`:334-393`), son appel dans `diff_relu` (`:309`) et la ligne `{{DIFF}} de la résolution` (`:315-317`) ; `lus` (`:567-590`) ; l'en-tête (`:14`, `:20`). `meme_retrait` n'est pas touché.
- `skills/chaine/relecture/SKILL.md:69` et `:108` ; `references/gestes.md:39`, `:42` et `:68` ; `references/cas-limites.md:60` et `:80-82`.
- `scripts/relecture.test.mjs` : deux tests neufs pour le défaut 1, un pour le défaut 2, deux pour le défaut 4, après le test « A-164, une PR de mise à jour : la résolution de la fusion se relit… » (`:1919-1945`), en réutilisant `miseAJour` (`:1891`), que la session étend d'une retouche après la fusion (décision 6 bis) ; le faux `git` du banc (`:689-691`) reçoit `FAUX_GIT_NUMSTAT_FUSION` (décision 8 bis).
- Défaut 4 : `gestes.sh`, juste après la ligne qui écrit `binaires.txt` (`:304`) ; `references/gestes.md:40` (`binaires.txt`) ; `scripts/relecture.test.mjs`, un test neuf après celui du défaut 2.
- `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md`.

## Décisions

### Défaut 1

1. **La résolution se découpe comme le diff relu, par la même fonction, à part.** `lots` prend en arguments le diff à découper, la liste de ses fichiers et le préfixe de ses lots ; `diff_relu` l'appelle pour `diff.patch` (lots `lots/lot-<i>/`, inchangés) puis, s'il y a une résolution, pour `resolution.patch` contre `resolution.txt` (lots `lots/resolution-<j>/`, chacun avec `diff.patch`, `attendus.txt`, `relus.txt`, `binaires.txt`). Même seuil (plus de 2 000 lignes **de `resolution.patch`**, compté seul : la résolution est un passage de plus de l'axe Règles, pas une part du diff relu), même découpe par zone, mêmes vérifications (aucun fichier dans deux lots, l'union est `resolution.txt`, chaque lot porte ses fichiers, leurs lignes font celles de `resolution.patch` ; sinon « lots de la résolution : … », sortie 12, comme « lots : … »). Un seul lot : pas de lots de la résolution, `resolution.patch` entier, comme aujourd'hui.
2. **Deux pièges de `lots` tel qu'il est écrit**, à ne pas reporter sur la résolution : son cas « un seul lot » fait `rm -rf -- "$B/lots"` (`:369-370`), qui jetterait les lots du diff relu déjà écrits ; et son `awk` écrit ses fichiers de travail (`nombre`, `<i>.patch`, `<i>.attendus`) directement sous `$B/lots`. Chaque appel travaille dans son propre dossier temporaire sous `$B/lots`, et le cas « un seul lot » ne retire que celui-là, **puis retire `$B/lots` s'il est vide** (`A-168`) : le test « un diff de plus de 2 000 lignes… » exige `!existsSync(join(…, "lots"))` après un seul gros fichier (`relecture.test.mjs:1257`) et reste tel quel. Joué sur une copie de `e64f93b` où `lots` travaille dans `$B/lots/travail-diff` : sans le retrait de `$B/lots` vide, 31 tests, 30 réussis, 1 échec à `relecture.test.mjs:1257:10` ; avec `rmdir -- "$B/lots" 2> /dev/null || true` après `rm -rf -- "$W"`, 31 sur 31, statut 0.
3. **Les lots de la résolution vivent sous `$B/lots/`** : l'empreinte de `C1` les porte sans rien changer à `empreinte` (`:148-150`, qui hache tout fichier sous `lots/`), et `diff` les efface en partant (`:245`).
4. **Ce que `diff` écrit** : avec des lots de la résolution, une ligne par lot, `lot resolution-<j> : <n> fichiers, <m> lignes, {{DIFF}} : <brouillons>/lots/resolution-<j>/diff.patch`, puis `lots de la résolution : <n>` (jamais `lots : <n>`, que le banc lit pour le diff relu), à la place de la ligne `{{DIFF}} de la résolution, pour l'axe Règles : …`. Sans lots, la ligne d'aujourd'hui, inchangée.
5. **`lus`** reçoit `resolution-<j>` comme lot : axe 1 seulement (sinon sortie 12, « la résolution de la fusion se lit par l'axe Règles (1) »), le lot doit exister (sinon « lot inconnu »), sortie de l'axe `axe-1-lot-resolution-<j>.txt`, comparée au `relus.txt` du lot. `lus 1 resolution` reste ce qu'il est : sur le modèle du diff relu, où `lus <i>` sans lot n'est pas refusé quand des lots existent, `A-167` décide que `lus` ne refuse pas le diff entier dans ce ticket (voir « Suite possible »).
6. **Le texte** : `SKILL.md:108` garde sa phrase et ajoute « ; au-delà de 2 000 lignes, une fois par lot de la résolution (`lots/resolution-<j>/diff.patch`, lot nommé `resolution-<j>`) » (la phrase que `relecture.test.mjs:1970` exige, « l'axe Règles se lance une fois de plus, `{{DIFF}}` étant `resolution.patch` », reste entière) ; `SKILL.md:69`, `gestes.md:39`, `:42`, `:68` et `cas-limites.md:80-82` disent que la résolution se découpe de même, en `lots/resolution-<j>/`. Rien n'est recopié d'un outil externe : la découpe est celle de `lots`.

6 bis. **`miseAJour` pose, au besoin, une retouche après la fusion** (pour le second cas du défaut 1). Forme, jouée sur une copie de `e64f93b` (un essai : `diff` en 0, `attendus.txt` porte la seule retouche, `resolution.txt` le seul fichier en conflit) :

```js
function miseAJour(n, fichiers, apres = {}) {
  // … inchangé jusqu'au commit de la fusion :
  for (const [f, v] of Object.entries(fichiers)) p.ecrire(f, v.resolu);
  p.git(p.auteur, "add", "-A");
  p.git(p.auteur, "commit", "-q", "--no-edit");
  // Une retouche après la fusion, dans un commit à elle : la forme qu'a-juger admet.
  if (Object.keys(apres).length > 0) {
    for (const [f, v] of Object.entries(apres)) p.ecrire(f, v);
    p.commit("fix(facture): une retouche après la fusion");
  }
  const sommet = p.git(p.auteur, "rev-parse", "HEAD");
  // … inchangé.
```

### Défaut 2

7. **Un cas au banc, rien au script.** Le test ci-dessous, entier, se place juste après le test « A-164, une PR de mise à jour : la résolution de la fusion se relit… » (après sa ligne `});`, `:1945`). Il joue un `develop` qui ne fait que retirer la garde et une résolution qui insère une autre ligne là même (gardé), et un témoin dans la même fusion, où la résolution suit `develop` (écarté), pour que le cas ne passe pas par un `tri` qui garderait tout.

```js
test("A-164, une PR de mise à jour : develop ne fait que retirer une garde, et la résolution écrit autre chose à sa place ; la ligne retirée se garde, et la même sans rien d'inséré s'écarte (P9)", { timeout: 120_000 }, () => {
  const GARDE = '  if (!admin) throw new Error("interdit");';
  const INSERTION = "  if (admin === undefined) return 2;";
  const INSERE = "apps/api/src/facture/insere.ts";
  const TEMOIN = "apps/api/src/facture/temoin.ts";
  const avec = (v, garde = GARDE) => `export function lire(admin) {\n${garde}\n  return 2;\n}\nexport const version = ${v};\n`;
  const sans = (v) => `export function lire(admin) {\n  return 2;\n}\nexport const version = ${v};\n`;
  const { p, m, B } = miseAJour(72, {
    // develop retire la garde, sans rien écrire à sa place ; la résolution insère une autre ligne, là même.
    [INSERE]: { commune: avec(1), sujet: avec(2), develop: sans(3), resolu: avec(2, INSERTION) },
    // Le témoin : la même fusion, la résolution suit develop à cet endroit.
    [TEMOIN]: { commune: avec(1), sujet: avec(2), develop: sans(3), resolu: sans(2) },
  });
  const d = p.joue("diff", m);
  assert.equal(d.status, 0, d.sortie);
  assert.ok(readFileSync(join(B, "resolution.patch"), "utf8").includes(`+${INSERTION}`), "l'insertion de la résolution y paraît");
  writeFileSync(join(B, "tri.txt"), `retirée\t2\t${INSERE}\nretirée\t2\t${TEMOIN}\n`);
  const tri = p.joue("tri", m);
  assert.equal(tri.status, 0, tri.sortie);
  assert.deepEqual(tri.stdout.trim().split("\n"), ["1 : gardé", "2 : écarté, develop retire seul cette ligne", "tri : sortie 0"], tri.sortie);
});
```

   Le numéro `72` est libre (`miseAJour(70` et `(71` sont pris, aucun `PR("72"`).

### Défaut 4

8 bis. **Un fichier de la résolution que git lit binaire contre l'un ou l'autre parent de la fusion est un binaire du tour.** Après l'écriture de `binaires.txt`, `diff` lit `git diff --numstat --no-renames <fusion>^1 <fusion>` puis `<fusion>^2 <fusion>` (une commande en échec : sortie 12, « liste des binaires de la résolution illisible »), garde les lignes `-	-` dont le fichier est dans `resolution.txt` **et absent d'`attendus.txt`** (`A-168`), et les ajoute à `binaires.txt` (trié, sans doublon) : `awk -F'\t' '$1 == "-" && $2 == "-" { print $3 }' … | sort -u | comm -12 - "$B/resolution.txt" | comm -23 - "$B/attendus.txt" | sort -u - "$B/binaires.txt" -o "$B/binaires.txt"`. Un fichier du diff relu garde le jugement du diff relu : texte contre le sujet, il reste à lire, même binaire contre `<fusion>^2` (essai `e4b` du relecteur : `develop` écrit un NUL dans `regle.ts`, la résolution y écrit `if (process.env.X) eval(process.env.X);` ; sans cette restriction, `regle.ts` entrait dans `binaires.txt` et `lus 1` ne l'exigeait plus). `illisibles.txt`, `binaires-sensibles.txt`, le compte de `diff`, `lus` (qui retire `binaires.txt`) et le verdict (« Hors du diff relu », `incomplet` pour un binaire illisible ou sous un chemin sensible) suivent sans autre changement. Les deux parents : le premier voit une forme neuve que la résolution écrit, le second ce qu'elle jette de `develop`. Un prototype de ces quelques lignes, joué sur une copie de `e64f93b`, rend le banc vert (ci-dessous) ; il ne se recopie pas tel quel sans relecture.

Le faux `git` du banc (`relecture.test.mjs:691`) reçoit une panne de plus, avant sa dernière ligne `PATH=…` : `if [ -n "$FAUX_GIT_NUMSTAT_FUSION" ] && [[ " $* " == *" diff --numstat --no-renames "*"^"[12]" "* ]]; then echo "numstat calé" >&2; exit 1; fi` (et une ligne de plus au commentaire de `:689-690`).

Le test, entier, après celui du défaut 2 (le numéro `73` est libre) :

```js
test("A-164, une PR de mise à jour : un binaire que seule la résolution touche (sans écart contre le sujet, la version de develop jetée) est un binaire du tour : nommé, illisible, vu sous un chemin sensible, et aucun axe n'a à le dire lu", { timeout: 120_000 }, () => {
  const CLE = "apps/api/src/auth/cle.bin";
  const binaire = (texte) => `\u0000\u0001${texte}\u0000`;
  const { p, m, B } = miseAJour(73, {
    // Les deux côtés changent la clé : conflit binaire ; la résolution garde celle du sujet et jette celle de develop.
    [CLE]: { commune: binaire("commune"), sujet: binaire("sujet"), develop: binaire("develop"), resolu: binaire("sujet") },
  });
  const d = p.joue("diff", m);
  assert.equal(d.status, 0, d.sortie);
  assert.deepEqual([listeDe(join(B, "sans-ecart.txt")), listeDe(join(B, "resolution.txt"))], [[CLE], [CLE]], "sans écart contre le sujet, touché par la résolution");
  assert.deepEqual([listeDe(join(B, "binaires.txt")), listeDe(join(B, "illisibles.txt"))], [[CLE], [CLE]], d.sortie);
  writeFileSync(join(B, "titre.txt"), "chore(facture): reçoit develop\n");
  const ax = p.joue("axes", m);
  assert.equal(ax.status, 0, ax.sortie);
  assert.ok(ax.stdout.includes(`binaires sous un chemin sensible : 1\n${CLE}\nbinaires illisibles : 1\n`), ax.sortie);
  writeFileSync(join(B, "axe-1-lot-resolution.txt"), "aucun écart\nFichiers du diff lus :\n");
  assert.equal(p.joue("lus", m, {}, { "<i>": "1 resolution" }).status, 0, "un binaire ne se lit pas : aucun axe n'a à le dire lu");
});
```

Le second test, entier, après le premier (le numéro `74` est libre). Il tue les mutations que le premier laisse vertes (§ Mutations) : un binaire du diff relu sur une PR de mise à jour (`neuve.bin`), un binaire hors conflit que seul le sujet change (`logo.bin`, binaire contre `develop`, absent de la résolution), le cas `e4b` (`regle.ts`), et le faux `git` dont le `numstat` échoue.

```js
test("A-164, une PR de mise à jour : les binaires de la résolution complètent ceux du diff relu sans rien leur prendre ; un texte du diff relu que develop avait rendu binaire reste à lire ; un binaire que la fusion n'a pas touché n'en est pas ; la liste illisible arrête le geste", { timeout: 120_000 }, () => {
  const NEUVE = "apps/api/src/auth/neuve.bin";
  const AUTRE = "apps/web/public/logo.bin";
  const REGLE = "apps/api/src/facture/regle.ts";
  const binaire = (texte) => `\u0000\u0001${texte}\u0000`;
  const { p, m, B } = miseAJour(74, {
    // Un binaire du diff relu : la résolution écrit une troisième forme.
    [NEUVE]: { commune: binaire("commune"), sujet: binaire("sujet"), develop: binaire("develop"), resolu: binaire("neuve") },
    // Un binaire que seul le sujet change : hors conflit, hors de la résolution, binaire contre develop.
    [AUTRE]: { commune: binaire("commune"), sujet: binaire("sujet"), develop: binaire("commune"), resolu: binaire("sujet") },
    // Un texte contre le sujet, que develop avait rendu binaire (un NUL) : la résolution écrit du code, à lire (e4b).
    [REGLE]: { commune: "export const a = 1;\n", sujet: "export const a = 2;\n", develop: "export const a = 3;\u0000\n", resolu: "export const a = 2;\nif (process.env.X) eval(process.env.X);\n" },
  });
  const cale = p.joue("diff", m, { FAUX_GIT_NUMSTAT_FUSION: "1" });
  assert.deepEqual([cale.status, cale.stdout.trim().split("\n").slice(-2)], [12, ["liste des binaires de la résolution illisible", "diff : sortie 12"]], cale.sortie);
  const d = p.joue("diff", m);
  assert.equal(d.status, 0, d.sortie);
  assert.deepEqual(listeDe(join(B, "attendus.txt")), [NEUVE, REGLE]);
  assert.deepEqual(listeDe(join(B, "resolution.txt")), [NEUVE, REGLE]);
  assert.deepEqual([listeDe(join(B, "binaires.txt")), listeDe(join(B, "illisibles.txt"))], [[NEUVE], [NEUVE]], d.sortie);
  const lus = (fichier, lot) => { writeFileSync(join(B, lot ? "axe-1-lot-resolution.txt" : "axe-1.txt"), `aucun écart\nFichiers du diff lus :\n${fichier}`); return p.joue("lus", m, {}, { "<i>": lot ? "1 resolution" : "1" }).status; };
  assert.deepEqual([lus("", false), lus(`${REGLE}\n`, false), lus("", true), lus(`${REGLE}\n`, true)], [1, 0, 1, 0], "le code se lit, au diff relu comme dans la résolution");
});
```

### Défaut 3

8. **Une note neuve en tête, la 7.36.0 inchangée.** Sa section « Ce qui change » dit les changements : la résolution d'une PR de mise à jour se découpe en lots au-delà de 2 000 lignes, comme le diff relu (`lots/resolution-<j>/`, `lus '<brouillons>' 1 resolution-<j>`) ; un binaire que seule la résolution touche est nommé parmi les binaires, illisible ou sensible selon les mêmes règles ; « Dans le dépôt du plugin seulement » (la forme de la note 7.35.0) : un cas de banc tient la branche du tri où `develop` ne fait que retirer et la résolution insère à ce point. Puis une phrase de rappel : « Depuis 7.36.0, la résolution d'une PR de mise à jour se relit : `git show --remerge-diff` du commit de fusion, que l'axe Règles lit en entier ; une ligne de `develop` qu'elle retire est un constat, jamais écartée (`A-164`). » « Ce qu'un projet fait pour en profiter » : mettre à jour le plugin, rien d'autre (rien n'appelle encore le skill, comme le dit la note 7.36.0).

### Version

9. **Un patch** (`README.md:193` : « Patch pour une correction ») : la suivante de `main` au moment de livrer, au troisième nombre. Aujourd'hui `main` est à 7.36.0 ; les PR 141 et 44, ouvertes, touchent aussi `plugin.json` et la note : celle qui entre avant celle-ci la fait reprendre `main`. Aucune version n'est écrite en dur dans un test : les tests de version existants (`depot.test.mjs:1204-1213`) lisent `plugin.json`.

## Cas de banc

Chacun vu rouge avant le correctif, vert après.

| Défaut | Cas | Rouge avant |
| --- | --- | --- |
| 1 | « A-164, une résolution de plus de 2 000 lignes : la machine la découpe en lots par zone, comme le diff relu, vérifie leur union, et compare ce que l'axe Règles a lu à chaque lot » — `miseAJour` avec `apps/api/src/facture/gros.ts` de 3 000 lignes et un petit fichier sous `apps/web/`, résolus en gardant le sujet. Attendu : `diff` sortie 0 ; deux lignes `lot resolution-<j> : …` et `lots de la résolution : 2`, aucune ligne `lots : ` ; les `relus.txt` des deux lots bout à bout font `resolution.txt`, leurs `diff.patch` bout à bout font `resolution.patch` ; `lus 1 resolution-<j>` en 0 avec le fichier du lot, en 1 sans lui ; `lus 2 resolution-1` en 12 ; après `c1`, `c1/avant.txt` porte `lots/resolution-1/diff.patch`, et ce fichier récrit fait sortir `garde` en 14 | aucune ligne `lot resolution-` ; `lots/resolution-1` absent (mesuré sur `e19`) |
| 1 | « … un diff relu en lots et une résolution d'un seul fichier de plus de 2 000 lignes : les lots du diff relu restent, la résolution se lit entière » — `miseAJour` étendue (décision 6 bis) : la fusion en conflit sur un gros fichier, puis une retouche après elle sur deux zones de plus de 2 000 lignes en tout (forme vue par `e17`, « la fusion n'est pas le dernier commit »). Attendu : `lots/lot-1` et `lots/lot-2` présents après `diff`, aucun `lots/resolution-*`, `lus 1 resolution` en 0 | vert avant (rien ne se découpe) : il tient le piège de la décision 2 |
| 2 | le test de la décision 7 | vert sur `e64f93b`, rouge sous P9 (ci-dessous) |
| 4 | le premier test de la décision 8 bis (`73`) | rouge sur `e64f93b` : « binaires : 0, dont illisibles : 0 », `binaires.txt` vide ; vert avec le prototype |
| 4 | le second test de la décision 8 bis (`74`) | rouge sur `e64f93b` (aucune panne de `numstat` à lire : `diff` en 0) ; rouge sous le prototype d'avant `A-168`, sans `comm -23 - attendus.txt` (`binaires : 2`, `regle.ts` compris) ; vert avec le prototype |
| 3 | aucun cas neuf : les tests de version de `depot.test.mjs` et le test « le plugin connaît le skill » de `relecture.test.mjs` | — |

Les tests existants d'`A-164` (`:1919`, `:1947`), dont la résolution fait moins de 2 000 lignes, restent verts sans retouche : `lus 1 resolution` ne change pas.

## Mutations

Chacune seule, sur une copie propre, le banc du skill joué, le fichier restauré ; un passage témoin vert avant chaque série.

**Défaut 2, jouées pour ce ticket** (copie de `e64f93b`, le cas de la décision 7 inséré après `:1945`) :

| Mutation (`gestes.sh:646`) | Banc sans le cas | Banc avec le cas |
| --- | --- | --- |
| aucune (témoin) | 31 sur 31, statut 0 | 32 sur 32, statut 0 |
| P9 : `if (k == 0 && o[2] == 0 && o[1] == c) touche = 1 }` devient `}` | 31 sur 31, statut 0 | 32 tests, 31 réussis, 1 échec (le cas), statut 1 |
| M2 : `o[1] == c` devient `o[1] == c + 1` | 31 sur 31, statut 0 | 32 tests, 31 réussis, 1 échec (le cas), statut 1 |

Sortie brute du cas sous P9 :

```text
✖ A-164, une PR de mise à jour : develop ne fait que retirer une garde, et la résolution écrit autre chose à sa place ; la ligne retirée se garde, et la même sans rien d'inséré s'écarte (P9) (965.032295ms)
  AssertionError [ERR_ASSERTION]: 1 : écarté, develop retire seul cette ligne
  2 : écarté, develop retire seul cette ligne
  tri : sortie 0
    [
  +   '1 : écarté, develop retire seul cette ligne',
  -   '1 : gardé',
      '2 : écarté, develop retire seul cette ligne',
      'tri : sortie 0'
    ]
```

**Défaut 4, jouées pour ce ticket**, chacune seule sur une copie de `e64f93b` qui porte le prototype de la décision 8 bis, le faux `git` étendu et les cas `72`, `73` et `74` ; « sans » : la même copie sans le test `74` (témoin : 33 sur 33, statut 0) ; « avec » : le banc entier (témoin : 34 sur 34, statut 0). Sans le correctif, le test `73` rougit (32 tests, 31 réussis, 1 échec).

| Mutation du prototype | Sans `74` | Avec `74` | Où rougit `74` |
| --- | --- | --- | --- |
| le prototype d'avant `A-168` (sans `comm -23 - "$B/attendus.txt"`) | 33 sur 33, statut 0 | 34 tests, 1 échec, statut 1 | `binaires.txt` : 2 au lieu de 1 (`regle.ts`) |
| la restriction à `resolution.txt` retirée | 33 sur 33, statut 0 | 34 tests, 1 échec, statut 1 | `binaires.txt` : 2 au lieu de 1 (`logo.bin`) |
| `binaires.txt` remplacé au lieu d'être complété (`> "$B/binaires.txt"`) | 33 sur 33, statut 0 | 34 tests, 1 échec, statut 1 | `binaires.txt` vide (`neuve.bin` perdu) |
| la commande `numstat` en échec lue comme vide (`quitter 12 …` devenu `true`) | 33 sur 33, statut 0 | 34 tests, 1 échec, statut 1 | `diff` en 0 sous `FAUX_GIT_NUMSTAT_FUSION` |
| le second parent retiré (`<fusion>^2`) | 33 tests, 1 échec (`73`), statut 1 | 34 tests, 1 échec (`73`), statut 1 | — (`73` la tue) |

**Défaut 1, à jouer par la session** (aucune n'est jouée ici : le correctif n'est pas écrit), chacune rouge sur les deux cas du défaut 1 : la résolution non découpée (l'appel retiré) ; le seuil compté sur `diff.patch` au lieu de `resolution.patch` ; le cas « un seul lot » de la résolution qui retire `$B/lots` (les lots du diff relu perdus) ; l'union comparée à `relus.txt` au lieu de `resolution.txt` ; `lus` qui compare un lot `resolution-<j>` à `resolution.txt` entier ; `lus` qui admet `resolution-<j>` pour un autre axe que 1 ; les lots de la résolution écrits hors de `$B/lots` (l'empreinte ne les voit plus) ; la ligne `lots : <n>` écrite pour la résolution ; le retrait de `$B/lots` vide oublié (le test de `:1257` rougit).

**Deux mutations équivalentes, hors de la liste** (`A-168`) : retirer la vérification d'union ou celle des lignes ne change rien sur une entrée que produit `lots` elle-même, chaque fichier étant placé une fois par la même boucle. Preuve sur `e64f93b` : retirer `gestes.sh:388` (« leur union n'est pas le diff relu ») ou `:389` (« leurs lignes ne font pas le diff relu ») laisse le banc à 31 sur 31, statut 0, dans les deux cas. Ces vérifications restent, pour les lots de la résolution comme pour ceux du diff relu, comme garde contre une `awk` récrite ; aucun cas ne les tue.

## Vérification

1. Le banc du skill : `node --test --test-reporter=spec scripts/relecture.test.mjs`, vert (31 tests sur `e64f93b` ; 36 avec le cas du défaut 2, les deux du défaut 1 et les deux du défaut 4 ; le prototype du défaut 4 et les cas `72` à `74` donnent 34 sur 34).
2. Les mutations ci-dessus, toutes rouges, hors les deux équivalentes, avec la sortie brute dans la PR.
3. La suite entière, `pnpm test`, verte d'un seul tenant sur la branche (non jouée pour ce ticket).
4. `grep -c remerge NOTES-DE-VERSION.md` : 1 ou plus, dans la note neuve ; `git diff origin/main -- NOTES-DE-VERSION.md` n'ôte aucune ligne de la note 7.36.0.

## Ce qui n'est pas établi

- **Le correctif du défaut 1 n'est pas prototypé** : seule la fonction `lots` d'aujourd'hui, jouée à part sur le `resolution.patch` d'`e19`, est mesurée (deux lots, 3 016 et 11 lignes, union vérifiée). Des deux pièges de la décision 2, seul le retrait de `$B/lots` vide est joué (sur `lots` réécrite pour le seul diff relu, décision 2) ; la collision des fichiers de travail des deux appels est lue dans le code (`gestes.sh:343-370`).
- **Un binaire de la résolution renommé** : `diff.renames` est coupé dans le script, et l'essai du défaut 4 n'a pas de renommage ; non joué.
- **Qu'un sous-agent lise mieux 3 016 lignes en un lot qu'en deux** n'est pas mesuré : la décision suit la règle d'`A-150`, et un fichier de plus de 2 000 lignes reste seul dans son lot, donné entier, comme pour le diff relu.
- **La suite entière** (`pnpm test`) n'est pas jouée ; seul le banc du skill l'est.

## Ce qui tient déjà

- Un binaire que la résolution écrit sous une forme neuve est déjà dans le diff relu : nommé, illisible et sensible (essai du défaut 4, résolution « neuve ») ; un binaire ajouté par la fusion hors des fichiers en conflit est refusé par `C2` (`liste` sortie 4) ; l'empreinte de `C1` porte `resolution.patch` et `resolution.txt` dans les trois cas.

## Suite possible (`A-167`)

**`lus` pourrait refuser la lecture d'un diff entier quand ses lots existent**, pour le diff relu comme pour la résolution. Aujourd'hui `lus '<brouillons>' <i>` sans lot compare à `relus.txt` entier même quand `lots/lot-<i>/` existe (`gestes.sh:571-582`) ; « un axe n'est joué que si tous ses lots le sont » (`SKILL.md:118`) est une consigne de la session, pas un refus de la machine. `A-167` le laisse hors de ce ticket : un refus porté par la machine change le contrat de `lus` pour tous les axes et demande son propre ticket.

## Comments

- 2026-11-20 — **Relecture du ticket, un seul tour (`P-65`)**, par un agent neuf, sur le sommet `d2cbddf` de cette branche (rapport : `63-annexes/relecture-tour-1.md`). Verdict : « prêt après retouches », trois bloquants, six mineurs ; retouches fixées par `A-168`, portées par le rédacteur, sans second tour :
  1. B1, décision 8 bis : ne viennent de la résolution que les fichiers absents d'`attendus.txt` ; l'essai `e4b` du relecteur entre au banc (test `74`, `regle.ts`) ;
  2. B2, les mutations vertes : le test `74` tue les trois mutations du défaut 4 (jouées, rouges avec lui, vertes sans) ; les vérifications d'union et des lignes du défaut 1 sortent de la liste, notées équivalentes, avec la preuve (`gestes.sh:388` ou `:389` retirée : 31 sur 31) ;
  3. B3, décision 2 : `$B/lots` vide est retiré, joué (`relecture.test.mjs:1257` rouge sans, vert avec) ;
  4. mineurs : `README.md` aux fichiers chauds, `depot.test.mjs:1204-1213`, `miseAJour` étendue (décision 6 bis, jouée), les essais et le rapport copiés sous `63-annexes/`.
