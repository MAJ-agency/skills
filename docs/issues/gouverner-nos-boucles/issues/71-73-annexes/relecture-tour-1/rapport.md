# Relecture des tickets 71, 72 et 73 (lots 5a, 5b, 5c), tour 1

Relecteur neuf, le 2026-11-21, sur la branche de documentation du programme à `d4589cc`, base `main` à `25a72c7`
(plugin 7.38.0), clone neuf de `MAJ-agency/skills`, Node 22.23.5, quatre cœurs partagés avec deux autres agents.
Patch `lot-5.patch` vérifié : sha256 `f042993127a0d4984557548feb56b3cea39798510448ff731ea5b88a83c56eb0`, 28 fichiers.

## Conclusion

**Prêts après retouches.** Aucun bloquant. Le code tient le besoin et les décisions (`A-185`, points 1 à 6, compris).
Le régime 7 n'est pas inchangé à l'octet près : deux écarts, prouvés et corrigés ci-dessous (constats 2 et 3). Les
gestes que jouera la session ne sont pas tous écrits : la PR du lot 5 partira, selon `A-185` point 9, d'un `main` qui
aura reçu les PR A et B, et ce chemin, qui sera le chemin réel, n'est décrit qu'en une phrase (constats 4 à 6).

## Constats

| n° | ticket | gravité | objet |
| --- | --- | --- | --- |
| 1 | 71 | à corriger | la décision 5 et « Ce qui n'a pas été établi » 4 disent qu'en régime 7 `revue_du_capitaine` lit les commentaires ; le code ne lit rien sans la clé (et la mutation A30 le garde) |
| 2 | 73 | à corriger | `renvoyer.sh` : en régime 7, sans la clé, une lecture GitHub de plus par renvoi (`GET pulls/<n>`), prouvée par un espion |
| 3 | 71 | à corriger | un contrat `.claude/chaine.json` de la base qui ne se lit pas (sans clé lisible) : régime 7 jugé avant (renvoi 4, motif « contrat illisible »), sauté en 7 après, avec un motif faux (« clé relecture mal formée », « le Relecteur prévient l'architecte ») |
| 4 | 71 | à corriger | § 0 : après les PR A et B, `git apply -3` laisse `NOTES-DE-VERSION.md` en deux blocs de conflit, le second au milieu de la note 7.38.1 ; la résolution naïve range la fin de la note du lot 5 dans celle de 7.38.1 (vu) |
| 5 | 71 | à corriger | § 1 puis § 2 : une fois les bancs posés seuls, `git apply` du patch entier échoue (« already exists », « does not apply ») |
| 6 | 71, 73 | à corriger | « Vérification » : les comptes ne valent que sur `25a72c7` ; après A et B, 47 rouges sur 354 (`faux-gh.test.mjs` 1 sur 17), et la suite entière n'est plus 1 327 |
| 7 | 71 | mineur | « Fichiers chauds » : le recouvrement oublie que la PR B touche `tickets.test.mjs` et que la PR A change `decision-relecteur.mjs`, que le lot 5 joue (les deux tiennent : vérifié) |
| 8 | 71 | mineur | une exception de la CLI en régime 8 (module absent) sort en 1, que `passer.sh` et `sujet.sh` lisent « renvoi », avec un motif vide |
| 9 | 72 | mineur | `--garde` : sans la grammaire, `ticketsDeLaPr` rend `[]` et la PR est renvoyée « PR sans ticket » (20) au lieu d'être dite illisible (21) |
| 10 | 73 | mineur | `etat` : la branche « sans carte » de `sujet_livre` exige la branche absente, donc ne joue jamais dans `etat` ; un sujet sans carte, livré et pas encore clos, est listé et reçoit develop par avance rapide |
| 11 | 72 | mineur | la CLI de `chemins-sensibles.mjs` passe sous `estPointEntree()` : un lancement non reconnu sort en 0 sans rien écrire, ce que `gestes.sh` lirait « rien de sensible » (les six accès du banc tiennent) |
| 12 | 71 | mineur | § 0 : la « branche de documentation du programme » n'est pas nommée, et la somme du patch n'est pas à vérifier |
| 13 | 71 | mineur | § 3 : ni le commit (un seul ? son message ?), ni l'état de la PR (prête, pas brouillon), ni ce que la session rend une fois la PR ouverte |
| 14 | 72 | à corriger | le banc de `--garde` ne tient pas « chaque copie couvre » (`A-185`, point 3) : la copie étroite est sur le premier sujet, et la mutation R6 (la première copie seule compte) reste verte |
| 15 | 71 | mineur | trois gestes sans banc : le fetch de develop et des sujets avant les calculs (`A-126`, R1), le push reçu avant la fusion au second contrôle de `passer.sh` (R2), `fusion-bloquée` posée pendant la CI au second contrôle de `sujet.sh` (R3) |
| 16 | 72, 73 | mineur | deux règles écrites sans banc : une spec citée par le sujet vaut ses tickets (ticket 72, décision 6, R8) ; une règle rejetée ou obsolète de l'index ne compte pas au gate (ticket 73, décision 5, R7) |

## Retouches

### 1 (ticket 71)

Décision 5, remplacer la dernière phrase « En régime 7, elle lit aussi les commentaires (une lecture GitHub de plus par
passage) : le jugement ne change pas. » par :

> Sans la clé `relecture` sur la base (`cle_relecture_sur`, une lecture locale), elle ne relit ni develop ni les sujets
> et ne lit pas les commentaires : la CLI juge la section de revue comme sur `main` (mutation A30). Avec la clé et une PR
> ouverte avant `depuis` (régime 7), elle lit les commentaires pour rien.

« Ce qui n'a pas été établi », point 4 : « en régime 7 sans la clé, aucune lecture de plus ; avec la clé et une PR
ouverte avant `depuis`, une lecture des commentaires de plus par passage ; en régime 8, … ».

### 2 (ticket 73, `renvoyer.sh`)

Le diff, essayé : `essais/retouche-renvoyer.diff` (`messages-du-regime.test.mjs` 3 sur 3 ; l'espion de
`essais/regime7.mjs` rend alors, en régime 7, exactement les appels de la base).

```diff
 regime=7
-if pr=$(pr_json "$N" 2>/dev/null); then
+# Sans la clé `relecture` sur develop ni sur aucun sujet (lecture locale, sans appel), le régime 7 sans lecture de plus.
+cle=1
+for r in $(git for-each-ref --format='%(refname)' refs/remotes/origin/develop refs/remotes/origin/sujet/); do
+  ! cle_relecture_sur "$r" || { cle=0; break; }
+done
+if [ "$cle" = 0 ] && pr=$(pr_json "$N" 2>/dev/null); then
```

Et dans le ticket 73, décision 1 : « Sans la clé sur `origin/develop` ni sur aucun `origin/sujet/*`, aucune lecture de
plus qu'aujourd'hui. » Une mutation à ajouter à la série C : `if [ "$cle" = 0 ] && pr=` → `if pr=`, que doit tuer un cas
du test 1 de `messages-du-regime.test.mjs` (régime 7 sans clé, une panne `{ route: "^pulls/30$", fois: 2 }` posée : il
n'en reste qu'une après le renvoi, consommée par la lecture finale de `head.ref`).

### 3 (ticket 71, `revue-exigee.mjs`)

Essayé : `essais/retouche-contrat-illisible.diff` (`revue-exigee.test.mjs` et `pr-titre.test.mjs` 49 sur 49 ;
`essais/contrat-casse.mjs` rend alors la sortie de la base, mot pour mot).

```diff
   } catch {
-    return 'illisible';
+    // Un contrat qui ne se lit pas et ne nomme pas la clé : régime 7, jugé comme avant (`lireBase` le dit illisible).
+    return /"relecture"/.test(texte) ? 'illisible' : null;
   }
```

et, dans `revue-exigee.test.mjs` :

```diff
-  assert.equal(revueExigee.lireCleRelecture('{'), 'illisible');
+  assert.equal(revueExigee.lireCleRelecture('{'), null, 'contrat illisible qui ne nomme pas la clé : régime 7, jugé comme avant');
+  assert.equal(revueExigee.lireCleRelecture('{ "relecture": {'), 'illisible');
```

Autre choix : garder le saut et l'écrire comme limite du régime 7 ; alors corriger le motif de `passer.sh` et de
`juger_revue`, qui disent « le Relecteur prévient l'architecte » là où il n'y a pas de Relecteur.

### 4, 5, 6 (ticket 71, § 0 à § 2 et « Vérification » ; ticket 73, « Vérification »)

Remplacer, au § 0, le point « Les trois tickets … pose tout ; sinon, `git apply -3` … » par :

> - **Le patch** : `git fetch origin claude/hopeful-lovelace-ouk6tz`, puis
>   `git show FETCH_HEAD:docs/issues/gouverner-nos-boucles/issues/71-73-annexes/lot-5.patch > <scratchpad>/lot-5.patch`
>   (de même `mutations.mjs`) ; `sha256sum <scratchpad>/lot-5.patch` rend
>   `f042993127a0d4984557548feb56b3cea39798510448ff731ea5b88a83c56eb0`, sinon s'arrêter et l'écrire au lanceur.
> - **`main` attendu** : la PR A (tickets 67 à 69) et la PR B (ticket 70) entrées, dans cet ordre (`A-185`, point 9).
>   Le patch s'y applique par `git apply -3`, et seuls `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` sont en
>   conflit (essayé : A puis B puis ce patch, sur `25a72c7`). Ces deux-là ne se résolvent pas à la main : le conflit de
>   la note se coupe en deux blocs, dont le second tombe dans la note de la PR A. `git checkout HEAD --
>   NOTES-DE-VERSION.md .claude-plugin/plugin.json`, puis `node <scratchpad>/note-et-version.mjs <scratchpad>/lot-5.patch`
>   (le script, 20 lignes, est à joindre aux annexes : `relecture-tour-1/essais/note-et-version.mjs`) pose la note du
>   patch en tête, à la version suivante de `main` (deuxième nombre plus un, troisième à zéro) et à la date du jour.
>   Tout autre fichier en conflit : s'arrêter et l'écrire au lanceur.
> - **Si `main` est encore à `25a72c7`** : `git apply`, sans `-3`.

§ 1 : « dans une copie à part de la branche (`git worktree add <scratchpad>/rouge HEAD`), `git apply -3
--include='*.test.mjs' <scratchpad>/lot-5.patch` ». § 2 : « dans la branche, le patch entier (§ 0) ; jamais sur les bancs
déjà posés : après eux, `git apply --exclude='*.test.mjs'` » (essayé : l'arbre est le même).

« Vérification », point 1 des tickets 71 et 73 : ajouter « Sur `main` après les PR A et B : **47 rouges sur 354**, les
mêmes, `faux-gh.test.mjs` 1 sur 17 (la PR A y ajoute un test) ; vert après, 354 sur 354, et les bancs du Relecteur que
la PR A change (`relecteur.test.mjs` 41, `scripts/relecteur.test.mjs` 9, `decision-relecteur.test.mjs` 40,
`scripts/relecture.test.mjs` 39) verts » (mesuré). Point 3 : « 1 327 sur `25a72c7` ; sur un `main` plus récent, le
total de `main` plus les 120 tests neufs du patch, aucun rouge » (à vérifier par l'architecte : le compte des tests neufs
est 1 327 moins le total de `25a72c7`, mesuré ci-dessous).

### 8 (ticket 71, mineur)

Dans la CLI de `revue-exigee.mjs`, régime 8 :

```diff
     } catch (e) {
-      if (!(e instanceof Illisible)) throw e;
+      // Une panne de l'outil (module absent, exception) n'est jamais un refus : sortie 3, « côté capitaine ».
+      if (!(e instanceof Illisible)) {
+        process.stdout.write(`revue du capitaine en échec : ${String(e?.message ?? e).split('\n')[0]}\n`);
+        process.exit(3);
+      }
```

### 9 (ticket 72, mineur)

Dans `garde` de `chemins-sensibles.mjs`, lire la grammaire avant le ticket :

```diff
-  const ids = tickets !== undefined ? tickets.split(",").map((t) => t.trim()).filter(Boolean) : ticketsDeLaPr(titre, branche);
-  if (ids.length === 0) throw new Motif(`PR sans ticket …`);
-  if (!GRAMMAIRE) throw new Illisible("scripts/docs/identifiants.mjs introuvable : le ticket ne se lit pas");
+  if (!GRAMMAIRE) throw new Illisible("scripts/docs/identifiants.mjs introuvable : le ticket ne se lit pas");
+  const ids = tickets !== undefined ? tickets.split(",").map((t) => t.trim()).filter(Boolean) : ticketsDeLaPr(titre, branche);
+  if (ids.length === 0) throw new Motif(`PR sans ticket …`);
```

### 10 (ticket 73, mineur)

Décision 4, ajouter : « Limite : sans carte, `sujet_livre` ne reconnaît un sujet livré qu'une fois sa branche supprimée
(`clore`) ; d'ici là, `etat` le liste « en cours » s'il est en retard, et la boucle y reporte develop par avance rapide.
Sans effet sur develop ; le sujet sort du tableau au passage suivant. »

### 14 (ticket 72, banc)

Essayé : `essais/retouche-banc-copies.diff` (la copie large sur `sujet/a`, l'étroite sur `sujet/b`) : le banc reste vert
(5 sur 5), R6 devient rouge, B17 le reste. À reporter dans le patch, et R6 dans la série B.

### 15, 16 (mineurs, bancs)

Un cas chacun, ou les écrire dans « Ce qui n'a pas été établi » : R1 (un ticket `Relecture: double` poussé sur un sujet
d'origin sans fetch local : un seul verdict doit rester refusé), R2 (un push sur la tête pendant la CI : sortie 5),
R3 (`fusion-bloquée` posée pendant la CI d'une sous-PR : sortie 7), R7 (une règle `rejected` de criticité haute dans
l'index : pas de `Relecture: double` exigée), R8 (une PR de mise à jour dont le conflit touche un chemin couvert par
un ticket d'une spec que le sujet déclare : elle entre).

### 7, 11, 12, 13 (mineurs)

- 7 : « Fichiers chauds » du ticket 71, ajouter « la PR B (ticket 70) touche `tickets.test.mjs`, la PR A
  `decision-relecteur.mjs`, que les bancs de ce ticket jouent : les deux s'appliquent sans conflit (essayé) ».
- 11 : rien à changer au code ; l'écrire dans « Ce qui n'a pas été établi » du ticket 72.
- 12 : le § 0 retouché ci-dessus nomme la branche et la somme.
- 13 : § 3, ajouter « un seul commit, le message égal au titre de la PR ; la PR prête (pas en brouillon), vers `main`,
  sans étiquette ni fusion ; la session rend l'URL de la PR et la sortie de la Vérification, puis s'arrête ».

## Les questions des tickets et d'A-185

Les quatre questions des rédacteurs (pile renvoyée, sous-PR illisible qui garde son sujet, copies sur develop et sur un
sujet, nom et date non jugés par les gardes, `Relecture: double` sur un ticket gelé, gate en 2 sans
`double-relecture.mjs`) sont tranchées par `A-185`, points 1 à 6, et le code tient chacune (lu, et bancs verts).

## Questions à l'architecte

1. **Le contrat illisible en régime 7** (constat 3) : jugé comme avant (ma retouche) ou sauté (l'état du patch, à écrire
   comme limite) ? Recommandation : jugé comme avant ; le régime 7 n'a pas de Relecteur pour prévenir qui que ce soit.
2. **Les comptes de la « Vérification »** (constat 6) : les écrire pour `main` après A et B, le chemin que fixe `A-185`
   point 9 ? Recommandation : oui, et garder ceux de `25a72c7` pour le cas où le lot 5 partirait seul.
3. **La retouche 2 et sa mutation** : la porter dans le patch (une nouvelle somme, une mutation C18) avant le lancement,
   plutôt que la laisser au premier tour sur la PR. Recommandation : oui ; c'est la seule lecture de plus du régime 7.

## Ce qui a été joué (dossier `essais/` et `mutations/`)

- **Le patch** : `git apply --check` puis `git apply` sur un clone neuf à `25a72c7` : 28 fichiers, 1 752 lignes
  ajoutées, 54 retirées, les fichiers des trois tableaux « Où » et eux seuls (4 bancs neufs). Les tickets ne donnent ni
  diff ni repère de ligne : le patch seul fait foi ; les noms qu'ils citent (`motifSansSecurite`, `fichiers_a_juger`,
  `juger_retouches`, `avancer_sujet`, `MAJ_CONFLITS`, `rafraichir_sujets`, `dependancesPrevues`, `ecartsSensibles`,
  `contrat` du Relecteur…) existent tous à `25a72c7`. Les bancs posés seuls, puis `git apply --exclude='*.test.mjs'`,
  donnent le même index que `git apply` entier.
- **Rouges avant, sur `25a72c7`** (`essais/rouges-avant.raw.txt`) : **47 sur 353**, dans 13 fichiers, fichier par
  fichier comme annoncé (71 : 15 + 5 + 2 + 1 = 23 ; 72 : 5 + 3 + 2 + 1 + 6 = 17 ; 73 : 3 + 2 + 1 + 1 = 7). **Verts
  après** (`essais/verts-apres.raw.txt`) : 353 sur 353.
- **La suite entière** sur l'arbre patché (`essais/suite-entiere.txt`) : **1 327 sur 1 327**, aucun sauté, 989 s, charge
  2,6 au départ (après 10 min d'attente), 3,5 à la fin, jusqu'à 8 au milieu (deux autres agents).
- **Après les PR A et B** (patchs de la branche, sha256 `0bd773cb…` et `2657363b…`, appliqués dans cet ordre sur
  `25a72c7`, la version de B portée à la main à 7.38.2) : le patch du lot 5 par `git apply -3`, conflits sur
  `plugin.json` et `NOTES-DE-VERSION.md` seuls, `faux-gh.mjs`, `faux-gh.test.mjs` et `tickets.test.mjs` sans conflit ;
  `essais/note-et-version.mjs` pose 7.39.0 et sa note en tête. Rouges avant **47 sur 354** (`faux-gh.test.mjs` 1 sur
  17), verts après 354 sur 354, plus les bancs du Relecteur que la PR A change, 129 sur 129
  (`essais/apres-A-B-*.raw.txt`). La suite entière n'y a pas été rejouée.
- **Le régime 7 prouvé** (`essais/regime7.mjs`, un espion sur `gh`, `git fetch` et `git ls-remote`, six scénarios :
  `passer.sh` renvoi sans section, fusion après mise à jour, chemin sensible sans `/security-review` ; `renvoyer.sh` ;
  `sujet.sh fusionner` renvoi et fusion après mise à jour ; contrat sans la clé) : base et patch rendent les mêmes
  sorties, les mêmes dernières lignes, les mêmes appels, sauf **un `gh api …/pulls/30` de plus dans `renvoyer.sh`**
  (`essais/regime7-base.txt`, `regime7-patch.txt`) ; avec la retouche 2, plus aucun écart. Ce que le reste du régime 7
  fait de plus est lu dans le code, sans réseau ni sortie neuve : `cle_relecture_sur` (une lecture locale) et un fichier
  temporaire dans `revue_du_capitaine` ; la CLI appelée avec `--ouverte`, dont la première ligne `régime 7` n'est pas
  reprise (le motif est la dernière ligne, une seule ligne comme avant) ; `regles.mjs` qui charge
  `scripts/docs/identifiants.mjs` au démarrage du hook ; le gate qui relit le contrat et liste une fois de plus les
  fichiers de règle. Les changements voulus du régime 7, portés par des décisions : `sujet.sh etat` (`A-132`, un
  `git fetch` et un `ls-remote` par sujet sans commit propre ni PR) et le refus de `demarrer` (`A-69`). L'écart du
  contrat illisible (constat 3) : `essais/contrat-casse.mjs`, `contrat-casse.txt`.
- **Mutations** : l'échantillon de 15 de `mutations.mjs` (A2, A7, A11, A15, A17, **A24**, B3, **B5**, B10, B14, B18,
  B22, C3, C8, C12) : **toutes rouges** (`mutations/echantillon-15.txt`). Mes 8 sur le régime 8
  (`mutations/mutations-relecteur.mjs`, `relecteur-8.txt`) : **2 rouges, 6 vertes** — R4 (PR de mise à jour jugée sur
  sa résolution seule) et R5 (« même contenu propre » contre develop) rouges ; R1, R2, R3, R6, R7, R8 vertes (constats
  14 à 16) ; R6 rouge avec la retouche du banc.

## Temps

De 21 h 34 à 22 h 12 UTC (38 min), dont 10 min à attendre une charge sous 3 et 16 min 29 s de suite entière.
