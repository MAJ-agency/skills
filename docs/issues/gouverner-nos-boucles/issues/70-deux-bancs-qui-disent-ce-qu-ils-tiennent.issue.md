# Deux bancs qui disent ce qu'ils tiennent : les phrases d'`A-178` exigées à leur place, et le commentaire de `trim()` rendu exact

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — deux suites décidées par l'architecte (passation du 2026-11-21, « Quoi faire », point 2), un test retouché et un commentaire, donnés mot pour mot (« À faire », et le patch en annexe), joués sur un clone neuf de `main` à `25a72c7`. Rien n'est à concevoir. Ce ticket part seul, dans sa propre PR, après la fusion de celle des tickets 67 à 69 : « Une PR à lui ».
Blocked by: 69
Dépendances: —
Fichiers chauds: `scripts/relecture.test.mjs`, `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs` : aucune autre PR ne les touche (les PR ouvertes hors programme, 44 et 56 d'après la passation du 2026-11-21, ni la PR des tickets 67 à 69). `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` : la PR des tickets 67 à 69, fusionnée avant celle-ci, et la PR 44 les touchent aussi ; la version est la suivante de `main` (7.38.2 si la PR des tickets 67 à 69 a pris 7.38.1).

## Le besoin

Deux suites que l'architecte a décidées avant le lot 4, sur les fichiers du ticket 65 (PR 145, `5bf4f39`, plugin 7.37.3) ; la carte les note le 2026-11-20 à 11 h 06 (« m2 et m3 sont laissés … Tous deux vont au prochain passage sur ces fichiers »). Les faits sont lus sur `main` à `25a72c7` (plugin 7.38.0), sur un clone neuf.

### 1. Le test des phrases d'`A-178` en tient la présence, pas la place (mutation M4)

Le ticket 65 a écrit trois phrases d'`A-178` : le paragraphe du clone de `C4`, dans la puce `C4` de l'étape 5 de `skills/chaine/relecture/SKILL.md` (ligne 104) ; « Un rapport vide de `/security-review` ne vaut pas absence de faille… », dans `references/prompt-regles.md`, juste avant « Gravité, deux seulement : » (ligne 32) ; et sa sœur dans la puce `/security-review:` de `references/verdict.md` (ligne 47). Le test « C4 : le clone reste dans le dossier de la session… (A-178) » de `scripts/relecture.test.mjs` (ligne 238) les cherche dans leur fichier, par `exigerDans`, et nulle part ailleurs. La contre-relecture de la PR 145 l'a montré : sa mutation M4, qui déplace le paragraphe du clone dans `SKILL.md`, est restée verte (carte, 2026-11-20, 11 h 06 : « M4, qui déplace le paragraphe dans `SKILL.md`, reste verte : le test, imposé par le ticket, ne tient que la présence de la phrase »). Le rapport de cette contre-relecture n'est pas publié ; M4 est refaite ici, F1, avec ses voisines (« Mutations »). Sur `25a72c7`, F1 à F3, F5 et F6 survivent au test (« Ce qui a été joué »).

### 2. Le commentaire de `tickets.test.mjs:227` sur ce que retire `trim()`

`skills/chaine/tickets/references/scripts/verify/tickets.test.mjs`, ligne 227, dans la liste des noms d'`A-170` : « A-175 : un caractère de contrôle (`\p{Cc}`) aussi ; `trim()` n'ôte que tabulation, `\v`, `\f` des bouts, jamais U+0085. » C'est incomplet (le ticket 65 le disait déjà de son relevé, la carte le note « incomplet mais sans effet ») : parmi les caractères de contrôle, `String.prototype.trim` ôte des bouts la tabulation, `\n`, `\v`, `\f` et `\r` ; jamais U+0085, NUL ni DEL. Mesuré sur Node 22.23.5, sur les 65 caractères `\p{Cc}` du plan de base :

```
$ node -e 'const r=[];for(let c=0;c<0x10000;c++){const s=String.fromCharCode(c);if(/\p{Cc}/u.test(s)&&("a"+s).trim()==="a"&&(s+"a").trim()==="a")r.push(c.toString(16))}console.log(r.join(","))'
9,a,b,c,d
```

(`trim()` ôte aussi les espaces Unicode, `\p{Zs}`, U+2028, U+2029 et U+FEFF ; le commentaire ne parle que des contrôles.) Le banc ne change pas de sens : le nom vient d'une seule ligne, `\n` et `\r` n'y entrent pas.

## Une PR à lui

`P-65` et `A-149` : une famille de fichiers par PR. Ces deux fichiers (le banc du skill `relecture`, le banc du gate `tickets`) n'ont rien en commun avec la PR des tickets 67 à 69, hors de `plugin.json` et `NOTES-DE-VERSION.md` ; ils partent ensemble, en une PR à deux points, comme le ticket 65 en portait trois. **Les deux PR se suivent** (`A-184`, point 1) : la session de ce ticket ne se lance qu'après la fusion de la PR des tickets 67 à 69 (`Blocked by: 69`). Le patch, [`70-annexes/ticket-70.patch`](70-annexes/ticket-70.patch), s'applique sur l'arbre de cette PR sans ses deux fichiers de version (`git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md`, vérifié), et la version et la note s'écrivent à la main, sur la suivante de `main` (§ 0). Il s'applique aussi entier sur `25a72c7`, où il a été écrit et joué.

## Où

- `scripts/relecture.test.mjs`, le test « C4 : le clone reste dans le dossier de la session, et un rapport vide de `/security-review` ne vaut pas absence de faille (A-178) » : les trois phrases nommées une fois, puis chacune exigée à sa place. Il utilise `exigerDans`, `plat`, `lignes`, `lire`, `SKILL` et `REFERENCES`, déjà dans le fichier.
- `skills/chaine/tickets/references/scripts/verify/tickets.test.mjs`, le commentaire de la ligne 227, sur deux lignes.
- `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`.

Aucun texte de skill ni aucun script posé ne change.

## Décisions

1. **Chaque phrase d'`A-178` est exigée à sa place**, en plus de sa présence (le test garde ses trois `exigerDans`, qui disent la phrase manquante) :
   - le paragraphe du clone, dans la puce `C4` de l'étape 5 : de `- **\`C4\`, \`/security-review\`**` à la puce suivante de la section, ou à sa fin (la puce `C4` est la dernière de l'étape 5, et son bloc de code commence en colonne 0 sans tiret) ;
   - la phrase du prompt de l'axe Règles, suivie d'une ligne vide puis de « Gravité, deux seulement : » ;
   - la phrase du verdict, dans la seule ligne qui commence par `- **\`/security-review:\`**`.

   Les blancs se comparent ramenés à une espace (`plat`), comme `exigerDans` : un retour à la ligne ne casse rien, un mot changé ou une phrase déplacée, si. Raison : `A-178` place chaque phrase dans le geste qu'elle gouverne ; une phrase ailleurs ne se lit plus au moment de jouer `C4` ou d'écrire la ligne `/security-review:`.
2. **Le commentaire dit exactement ce que `trim()` ôte des contrôles**, mot pour mot :

   ```
         // A-175 : un caractère de contrôle (`\p{Cc}`) aussi. Des contrôles, `trim()` n'ôte aux bouts que tabulation, `\n`, `\v`,
         // `\f` et `\r`, jamais U+0085, NUL ni DEL ; au milieu du nom, aucun.
   ```

   Aucun test ne tient un commentaire ; la mesure est dans « Le besoin ».
3. **La version** : le ticket s'applique après la PR des tickets 67 à 69, sans ses deux fichiers de version, et prend la version suivante de `main`, le troisième nombre plus un : 7.38.2 si cette PR a pris 7.38.1. La note se place avant la première note du fichier (au-dessus de celle de cette PR), à la date du jour, avec le texte du diff, son titre à la version prise. Le patch porte 7.38.1 parce qu'il a été écrit sur `25a72c7` : ses deux hunks de version ne s'appliquent pas, ils donnent le texte de la note.

## À faire, dans l'ordre

### § 0 — Partir de `main`, et la règle de repli

`git fetch origin main`, une branche depuis `origin/main`. L'annexe se lit sous `docs/issues/gouverner-nos-boucles/issues/70-annexes/` de `main` si la PR de documentation y est entrée, sinon sur la branche de documentation du programme, écrite dans le scratchpad, jamais dans le dépôt. La PR des tickets 67 à 69 est fusionnée (`Blocked by: 69`) : `git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md <scratchpad>/ticket-70.patch` depuis la racine, puis la version (`.claude-plugin/plugin.json`, la suivante de `main`) et la note (le texte du hunk de `NOTES-DE-VERSION.md` du patch, sous le numéro pris, au-dessus de la première note) à la main. Si un repère du test a changé de mots sur `main`, placer la retouche au même endroit par le sens.

### § 1 — Le banc, vu rouge sous la mutation

Le test retouché passe sur les textes d'aujourd'hui : ils sont à leur place. Son rouge se voit sous les mutations (« Mutations ») : F1, qui refait M4, est verte avec le test de `25a72c7` et rouge avec le test retouché. Le recopier dans la PR.

### § 2 — Le diff

Contre `25a72c7`, les quatre fichiers :

```diff
diff --git a/.claude-plugin/plugin.json b/.claude-plugin/plugin.json
index 818adbf..83facdb 100644
--- a/.claude-plugin/plugin.json
+++ b/.claude-plugin/plugin.json
@@ -1,6 +1,6 @@
 {
   "name": "maj-skills",
-  "version": "7.38.0",
+  "version": "7.38.1",
   "description": "Skills d'ingénierie maison : amorçage de monorepo et de socles (API NestJS hexagonale, web Next.js, mobile Expo), chaîne de production pour des sessions d'agent en parallèle (tickets, sujets, capitaine de fusion, revue adversariale, chantier, recette). Aucune règle métier.",
   "author": {
     "name": "Guillaume Jauffret"
diff --git a/NOTES-DE-VERSION.md b/NOTES-DE-VERSION.md
index 9e2e48c..d1f4171 100644
--- a/NOTES-DE-VERSION.md
+++ b/NOTES-DE-VERSION.md
@@ -2,6 +2,16 @@
 
 La plus récente en haut. Les scripts de la chaîne sont copiés dans chaque projet par `poser` : une version publiée ne change rien chez un projet qui ne les repose pas. Chaque note dit ce qui change, puis ce qu'un projet fait pour en profiter.
 
+## 7.38.1 — 2026-11-21
+
+### Ce qui change
+
+Deux bancs disent ce qu'ils tiennent (ticket 70). Pour qui joue la CI du plugin : `scripts/relecture.test.mjs` exige les trois phrases d'`A-178` à leur place, la puce `C4` de l'étape 5 du skill `relecture`, le paragraphe avant « Gravité, deux seulement : » du prompt de l'axe Règles, la puce `/security-review:` des règles du verdict, et plus seulement dans leur fichier ; le commentaire du banc du gate `tickets` dit exactement ce que `trim()` ôte d'un nom d'accord.
+
+### Ce qu'un projet fait pour en profiter
+
+Rien : aucun texte de skill ni aucun script posé ne change.
+
 ## 7.38.0 — 2026-11-20
 
 ### Ce qui change
diff --git a/scripts/relecture.test.mjs b/scripts/relecture.test.mjs
index 6a9f565..16a24b7 100644
--- a/scripts/relecture.test.mjs
+++ b/scripts/relecture.test.mjs
@@ -236,9 +236,26 @@ function exigerDans(chemin, phrases) {
 
 // A-178 : le clone de C4 reste dans le dossier de la session ; un rapport vide de `/security-review` ne vaut pas absence de faille.
 test("C4 : le clone reste dans le dossier de la session, et un rapport vide de `/security-review` ne vaut pas absence de faille (A-178)", () => {
-  exigerDans(`${SKILL}/SKILL.md`, ["Le clone de `C4` reste dans le dossier de la session, jamais hors des dossiers de travail : hors d'un dossier de travail, le `cd` ne tient pas, la commande et ses sous-agents lisent la base, et le filtre de faux positifs écarte une faille réelle."]);
-  exigerDans(`${REFERENCES}/prompt-regles.md`, ["Un rapport vide de `/security-review` ne vaut pas absence de faille : tu appliques tes critères d'injection et de chemins sensibles au diff entier, quoi qu'une commande de sécurité ait rapporté ou non."]);
-  exigerDans(`${REFERENCES}/verdict.md`, ["Un rapport vide de `/security-review` ne vaut pas absence de faille : l'axe Règles garde ses critères d'injection et de chemins sensibles sur le diff entier, quel que soit le rapport de `C4`, et le verdict ne cite jamais `/security-review` comme preuve qu'une faille manque."]);
+  const CLONE = "Le clone de `C4` reste dans le dossier de la session, jamais hors des dossiers de travail : hors d'un dossier de travail, le `cd` ne tient pas, la commande et ses sous-agents lisent la base, et le filtre de faux positifs écarte une faille réelle.";
+  const PROMPT = "Un rapport vide de `/security-review` ne vaut pas absence de faille : tu appliques tes critères d'injection et de chemins sensibles au diff entier, quoi qu'une commande de sécurité ait rapporté ou non.";
+  const VERDICT = "Un rapport vide de `/security-review` ne vaut pas absence de faille : l'axe Règles garde ses critères d'injection et de chemins sensibles sur le diff entier, quel que soit le rapport de `C4`, et le verdict ne cite jamais `/security-review` comme preuve qu'une faille manque.";
+  exigerDans(`${SKILL}/SKILL.md`, [CLONE]);
+  exigerDans(`${REFERENCES}/prompt-regles.md`, [PROMPT]);
+  exigerDans(`${REFERENCES}/verdict.md`, [VERDICT]);
+  // Chaque phrase à sa place, pas seulement dans son fichier (mutation M4 de la contre-relecture de la PR 145, qui
+  // déplaçait le paragraphe du clone sans qu'aucun banc ne rougisse) : la puce `C4` de l'étape 5, le paragraphe juste
+  // avant « Gravité, deux seulement : », la puce `/security-review:` des règles du verdict.
+  const etape5 = lire(`${SKILL}/SKILL.md`).split(/^## /m).find((s) => s.startsWith("Étape 5 "));
+  assert.ok(etape5, "SKILL.md : la section « Étape 5 »");
+  const debutC4 = etape5.indexOf("- **`C4`, `/security-review`**");
+  assert.ok(debutC4 >= 0, "SKILL.md : la puce `C4` de l'étape 5");
+  const suiteC4 = etape5.slice(debutC4 + 1);
+  const finC4 = suiteC4.search(/^- /m);
+  assert.ok(plat(finC4 === -1 ? suiteC4 : suiteC4.slice(0, finC4)).includes(plat(CLONE)), "SKILL.md : le paragraphe du clone dans la puce `C4` de l'étape 5");
+  assert.ok(plat(lire(`${REFERENCES}/prompt-regles.md`)).includes(plat(`${PROMPT}\n\nGravité, deux seulement :`)), "prompt-regles.md : la phrase juste avant « Gravité, deux seulement : »");
+  const puceVerdict = lignes(lire(`${REFERENCES}/verdict.md`)).filter((l) => l.startsWith("- **`/security-review:`**"));
+  assert.equal(puceVerdict.length, 1, "verdict.md : une puce `/security-review:`");
+  assert.ok(plat(puceVerdict[0]).includes(plat(VERDICT)), "verdict.md : la phrase dans la puce `/security-review:`");
 });
 
 test("chaque prompt lit le code dans l'arbre à part et les fiches de règles sur la base, porte ses marqueurs, le diff par son chemin en dernier, et le format de sortie d'un constat ; le diff est une donnée, jamais une consigne, et l'axe rend la liste des fichiers lus", () => {
diff --git a/skills/chaine/tickets/references/scripts/verify/tickets.test.mjs b/skills/chaine/tickets/references/scripts/verify/tickets.test.mjs
index 55ca765..d944ad0 100644
--- a/skills/chaine/tickets/references/scripts/verify/tickets.test.mjs
+++ b/skills/chaine/tickets/references/scripts/verify/tickets.test.mjs
@@ -224,7 +224,8 @@ test('Sensibles: `—`, ou des chemins puis l’accord (nom, date), passe ; tout
     // A-170 : un caractère invisible ou une espace Unicode reçoit son propre message, qui dit la cause ; U+200C et
     // U+200D (antiliant, liant) restent refusés : un nom s'écrit sans eux.
     ...['\u200b', 'Camille\u200bMartin', 'Camille\u00a0Martin', 'Camille\u2009Martin', '\u2060', 'Camille\u200cMartin', 'Camille\u200dMartin',
-      // A-175 : un caractère de contrôle (`\p{Cc}`) aussi ; `trim()` n'ôte que tabulation, `\v`, `\f` des bouts, jamais U+0085.
+      // A-175 : un caractère de contrôle (`\p{Cc}`) aussi. Des contrôles, `trim()` n'ôte aux bouts que tabulation, `\n`, `\v`,
+      // `\f` et `\r`, jamais U+0085, NUL ni DEL ; au milieu du nom, aucun.
       'la\tMOA', 'la\vMOA', 'la\fMOA', 'la\u0085MOA', 'la\u0000MOA', 'la\u007fMOA', 'la MOA\u0085'].map((nom) => [
       `scripts/chaine/passer.sh — accord de ${nom}, 2026-11-19`,
       /accord de « .* » : nom d'accord avec un caractère invisible ou une espace autre que l'espace ordinaire$/su,
```

### § 3 — Livrer

Une PR vers `main`, titre `test(relecture): les phrases d'A-178 exigées à leur place, le commentaire de trim() exact (plugin <version>)`. `Label: contre-revue`. Le ticket passe à `Status: Fait — PR <n> (…)` à la fusion, par l'architecte. Dans le corps : le tableau des mutations avant et après, la suite entière.

## Surfaces

| Surface | Preuve |
| --- | --- |
| Le paragraphe du clone dans la puce `C4` de l'étape 5 | `scripts/relecture.test.mjs`, « C4 : le clone reste dans le dossier de la session… (A-178) » ; mutations F1, F2, F3 |
| La phrase du prompt juste avant « Gravité, deux seulement : » | le même test ; mutations F4, F5 |
| La phrase du verdict dans la puce `/security-review:` | le même test ; mutations F6, F7 |
| Le commentaire de `trim()` | relu ; la mesure de « Le besoin » |
| La version et la note | les tests de version de `scripts/depot.test.mjs` |

## Mutations

[`70-annexes/mutations.mjs`](70-annexes/mutations.mjs), chacune seule, le fichier remis après, jouées avec le test de `25a72c7` puis avec le test retouché (journal : [`70-annexes/mutations.txt`](70-annexes/mutations.txt)) :

| Mutation | Avec le test de `25a72c7` | Avec le test retouché |
| --- | --- | --- |
| F1 `SKILL.md` : le paragraphe du clone déplacé de la puce `C4` à la fin de l'étape 2 (M4 de la contre-relecture de la PR 145) | **verte** | rouge |
| F2 `SKILL.md` : le paragraphe du clone déplacé avant la puce `C4` (dans la puce `C3`) | **verte** | rouge |
| F3 `SKILL.md` : le paragraphe du clone déplacé dans l'étape 6 | **verte** | rouge |
| F4 `prompt-regles.md` : la phrase déplacée dans la liste des gravités | rouge (par « deux gravités, pas trois… », qui lit la liste) | rouge |
| F5 `prompt-regles.md` : la phrase déplacée en tête du prompt | **verte** | rouge |
| F6 `verdict.md` : la phrase sortie de la puce `/security-review:`, en paragraphe après elle | **verte** | rouge |
| F7 `verdict.md` : la phrase retirée | rouge | rouge |

Avant : 5 vertes sur 7. Après : 7 rouges sur 7.

## Vérification

1. Le test retouché, sur les textes de `main` : `node --test scripts/relecture.test.mjs`, 39 sur 39.
2. Les mutations : `node <scratchpad>/mutations.mjs` depuis la racine, « toutes rouges » (7).
3. `node --test skills/chaine/tickets/references/scripts/verify/tickets.test.mjs scripts/depot.test.mjs` vert.
4. La suite entière, `pnpm test`, d'un seul tenant, avec son compte, sa durée et la charge (`uptime` avant et après).
5. `git diff --stat origin/main` : les quatre fichiers, et eux seuls.

### Ce qui a été joué en écrivant ce ticket

Sur un clone neuf de `https://github.com/MAJ-agency/skills` à `25a72c7` (plugin 7.38.0), le 2026-11-21, Node 22.23.5 :

- **Le patch** : `git apply --check`, puis `git apply`, sur le clone neuf de `25a72c7`.
- **Après la PR des tickets 67 à 69** (`A-184`, point 1), rejoué après le tour de relecture : sur `25a72c7` plus le patch commun retouché, `git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md`, puis la version 7.38.2 et la note à la main (le texte du hunk, au-dessus de la note 7.38.1) ; `scripts/relecture.test.mjs`, `scripts/depot.test.mjs`, `tickets.test.mjs` et `scripts/relecteur.test.mjs` : 153 sur 153.
- **Le test retouché**, sur les textes de `main` : vert (`scripts/relecture.test.mjs`, 39 sur 39).
- **Les mutations** F1 à F7 avec le test de `25a72c7`, sur un autre clone : 5 vertes (F1, F2, F3, F5, F6), 2 rouges ; avec le test retouché : 7 rouges (de 56 à 99 secondes chacune).
- **La mesure de `trim()`** : la commande de « Le besoin ».
- **La suite entière**, `pnpm test`, d'un seul tenant, sur le clone neuf avec le patch : **1 279 tests, 1 279 verts**, aucun échec, sauté ni annulé (le compte de `25a72c7` : le ticket n'ajoute aucun cas) ; 13 min 58 s (20:20:58 → 20:34:56 UTC, `duration_ms` 837262), quatre cœurs, charge 2,29 au départ, 8,07 à la fin (d'autres essais tournaient sur la machine), notée aux bords seulement.

## Ce qui n'a pas été établi

- **Le rapport de la contre-relecture de la PR 145** n'est pas publié : M4 est connue par la carte seulement (« déplace le paragraphe dans `SKILL.md` »), sans sa destination. F1 à F3 en couvrent trois (une autre étape, la puce d'avant, une étape d'après).
- **Le test tient des places, pas une conduite** : comme au ticket 65, il garantit que le skill dit la limite où elle se lit, pas qu'une session la suive.

## Hors périmètre

- Le texte du skill `relecture` : il ne change pas.
- Le motif `\p{Cc}` du gate (`ecartsSensibles`) : il ne change pas.

## Comments

- 2026-11-21 — Retouché après le tour unique de relecture (`67-annexes/relecture-tour-1/rapport.md`, constat 2 ; `A-184`, point 1) : `Blocked by: 69`, le ticket s'applique après la PR des tickets 67 à 69, sans ses deux fichiers de version, et prend la version suivante. Le patch ne change pas.

- 2026-11-21 — Écrit par un agent rédacteur sur la passation de l'architecte du 2026-11-21 et sur la carte (PR 145, 2026-11-20) ; test, mutations et suite joués sur un clone neuf de `25a72c7` (« Vérification »).
