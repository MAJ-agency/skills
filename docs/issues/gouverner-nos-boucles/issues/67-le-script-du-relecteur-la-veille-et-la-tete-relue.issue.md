# Le script du Relecteur, suite de la PR 146 : l'erreur d'installation gardée quand GitHub se tait, une veille relancée qui attend, la tête relue avant d'être dite introuvable, une cause qui dit comment se retenter

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — quatre mineurs mesurés (R3, R5, 17, 18 de la contre-relecture de la PR 146), chacun avec sa décision, ses lignes et son cas de banc ; le changement entier est donné (« À faire », et le patch commun en annexe), joué sur un clone neuf de `main` à `25a72c7` (plugin 7.38.0). Rien n'est à concevoir : qui veut changer une décision l'écrit à son lanceur. Ce ticket part dans une même PR que les tickets 68 et 69 : « Dans la même PR que les tickets 68 et 69 ».
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/relecteur/scripts/relecteur.mjs` et `skills/chaine/relecteur/scripts/relecteur.test.mjs` (le ticket 68 les touche aussi, dans la même PR ; les PR ouvertes hors programme, 44 et 56 d'après la passation du 2026-11-21, ne les touchent pas). `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md` : portés par le ticket 69 pour la PR entière ; la PR 44 (hors programme) les touche aussi.

## Le besoin

La contre-relecture de la PR 146 (ticket 66, skill `relecteur`) a laissé dix mineurs à des tickets de suite, regroupés par famille de fichiers (`A-182`, point 5) : la liste consolidée est à la fin de `66-annexes/contre-relecture-d1679f3/rapport.md`, « Les mineurs laissés à un ticket de suite, sur les trois tours ». Ce ticket porte les quatre qui ne touchent que la veille et la préparation de `relecteur.mjs` ; le ticket 68 porte ceux des étiquettes et des sessions, le ticket 69 ceux du texte du skill.

Les faits sont lus sur `main` à `25a72c7cf02832e92141cb902d57ae500f72d849` (plugin 7.38.0), sur un clone neuf, Node 22.23.5, git 2.43.0. Les numéros de ligne sont ceux de `25a72c7`.

### R3 — l'erreur d'une installation en échec se perd quand la passe sort ensuite en 5

`veille` (`relecteur.mjs:378`) recopie la sortie d'erreur d'une passe seulement si celle-ci sort en 0 : `if (r.status === 0 && r.stderr) process.stderr.write(r.stderr);`. Une passe qui installe les dépendances de develop, échoue, écrit le témoin `echec`, puis sort en 5 parce que GitHub ne rend pas la liste des PR, n'a que sa dernière ligne recopiée (`PAUSE GitHub illisible : <dernière ligne>`). L'erreur de `pnpm install` n'est écrite nulle part, et l'installation ne se retentera pas (le témoin dit `echec`). L'essai R3 du rapport (`essais/essais-c2.test.mjs`) est rouge sur `25a72c7`. Les autres sorties ne perdent rien : la veille écrit toute la sortie d'erreur avant `VEILLE ARRÊTÉE sortie <c>` (ligne 384).

### R5 — une veille relancée rejoue sans pause

Le second tour de contre-relecture a ajouté, sur R1, « quand cette suite dit « rejouer au réveil suivant » (9, 12, autre), relancer la veille : sa fin est ce réveil ». Mais la veille joue sa première passe sans pause (`if (k > 0) attendre(pause)`, ligne 375) : « au réveil suivant » vaut « tout de suite ». Mesuré par le rapport (`essais/essais-c3.test.mjs`, deux essais de tenue) : un `index.lock` resté donne deux `VEILLE ARRÊTÉE sortie 12` en quelques secondes, et une coupure passagère de `git fetch` arrête le Relecteur à la seconde fois sans avoir attendu ; la sortie 9 n'a pas de seconde fois et peut se répéter sans fin. Le remède du rapport a deux moitiés : une option de `veille` qui met une pause avant la première passe (ce ticket), et la borne de 12 pour la sortie 9, avec la relance par cette option, dans le texte du skill (ticket 69).

### 17 — une installation en échec par une panne passagère : rien ne dit comment la retenter

`A-180`, point 5 : « Un `pnpm install` en échec écrit sa sortie d'erreur. Il ne se retente qu'au prochain changement du lockfile, et la PR reçoit la cause « dépendances de `develop` » ». Une panne passagère du registre laisse donc la PR à l'illisible jusqu'au lockfile suivant de develop, et la cause (`relecteur.mjs:182`) ne dit pas comment faire plus tôt. Un Relecteur neuf la retente : sa session a un dossier neuf, sans le témoin `<dossier git>/relecteur-dependances`. Le remède du rapport est un mot dans la cause, pas un changement de règle.

### 18 — « tête introuvable » par une course

`liste` (`relecteur.mjs:175`) dit la tête introuvable dès que `git cat-file -e <tête>^{commit}` échoue. Or `jouer` et `distribuer` lisent la PR (`lire(…/pulls/<n>)`) après la préparation, qui a relu origin : un push tombé entre les deux donne une tête que le dossier n'a pas encore. La PR reçoit alors un commentaire `Lecture illisible — tête introuvable : …` et l'architecte une ligne, pour rien. Le rapport propose de relire une fois la tête avant de la dire introuvable.

## Dans la même PR que les tickets 68 et 69

`P-65` et `A-149` : un tour de relecture par ticket, deux sur la PR, une famille de fichiers par PR, trois tickets au plus. Les tickets 67, 68 et 69 touchent le skill `relecteur` (son script, son banc, son texte) et la décision qu'il joue ; ils partent ensemble, en une PR, une version (7.38.1) et une note, portées par le ticket 69. L'ordre d'écriture est celui des numéros : chaque ticket se joue rouge puis vert sur l'arbre du précédent. Le patch commun, [`67-annexes/ticket-67-68-69.patch`](67-annexes/ticket-67-68-69.patch), pose les trois d'un coup et fait foi en cas d'écart de recopie ; les trois diffs donnés dans les tickets, appliqués l'un après l'autre sur `25a72c7`, rendent le même arbre (vérifié, « Vérification »).

Le ticket 70 (les bancs du skill `relecture` et du gate `tickets`) part dans une autre PR : aucun fichier en commun hors de `plugin.json` et `NOTES-DE-VERSION.md`.

## Où

- `skills/chaine/relecteur/scripts/relecteur.mjs` :
  - l'en-tête (l'usage de `veille`, la cause « dépendances de develop », la tête relue, la sortie d'erreur de la veille, `--attendre`) ;
  - `preparer`, la relecture d'origin sortie en une fonction, `rapatrier`, déclarée après `let DEPENDANCES` ;
  - `liste`, la tête relue avant `tête introuvable`, et la cause « dépendances de develop » ;
  - `veille`, `--attendre` et la sortie d'erreur d'une passe sortie en 5 ;
  - le message d'usage.
- `skills/chaine/relecteur/scripts/relecteur.test.mjs` : une assertion de plus dans « X15 », et trois cas neufs, à la fin du fichier, sous « Suite du ticket 66, ticket 67 ».

## Décisions

1. **R3 : la veille recopie la sortie d'erreur d'une passe sortie en 0 ou en 5.** Ce sont les deux sorties après lesquelles la veille continue ; pour les autres, elle écrit déjà toute la sortie d'erreur avant `VEILLE ARRÊTÉE`. La ligne `PAUSE` reste celle d'aujourd'hui. Raison : `A-180`, point 5, veut l'erreur d'une installation écrite ; la passe qui sort en 5 après avoir installé est la seule à la perdre.
2. **R5 : `veille --attendre` met une pause avant la première passe aussi**, sous la même borne que les autres : la veille ne commence jamais une pause qui finirait après sa durée (`A-180`, point 1), la première comprise. Une veille `--attendre` plus courte qu'une pause finit donc sans passe, sur `VEILLE FINIE`. Sans l'option, rien ne change. Le texte du skill qui la lance, et la borne de la sortie 9, sont au ticket 69. Raison : « rejouer au réveil suivant » doit valoir une pause, pas une seconde passe aussitôt ; une option du script se teste, une attente laissée au modèle s'improvise.
3. **17 : la cause dit comment l'installation se retente**, sans rien changer à la règle d'`A-180` : `dépendances de develop : pnpm install en échec, \`sujet.sh a-juger\` ne juge pas les retouches ; retentée au prochain lockfile de develop, ou par un Relecteur neuf`. L'en-tête du script le dit aussi. Le texte du skill (« Mise en place », ticket 69) le redit à la session. La trace d'une cause déjà signalée sous l'ancien texte ne se reconnaît plus : elle se redit une fois, au premier passage après la mise à jour (`A-116`), sans autre effet.
4. **18 : la tête est relue une fois avant d'être dite introuvable.** `liste` relit origin (`rapatrier`, le même `fetch` que la préparation, toutes les branches) si la tête manque, puis la cherche de nouveau ; absente encore, la cause est celle d'aujourd'hui. Un `fetch` en échec à ce moment sort en 12, comme celui de la préparation. Raison : une course, pas une tête perdue ; un `fetch` de plus ne coûte que sur ce chemin rare.

### Remèdes écartés

- **Retenter une installation en échec après un délai** (17) : contraire à `A-180`, point 5 (« il ne se retente qu'au prochain changement du lockfile ») ; le rapport ne demande qu'un mot dans la cause.
- **Une option `--reinstaller` que l'architecte ferait jouer** (17) : le Relecteur ne suit pas un message comme un ordre (« Ne jamais »), et l'architecte n'a pas accès à son dossier ; un Relecteur neuf fait la même chose sans geste neuf.
- **Lire `refs/pull/<n>/head`** (18) : une PR de fourche est écartée avant, et la tête d'une PR du dépôt est sur une branche d'origin ; le `fetch` de la préparation reste la seule forme de relecture d'origin.
- **Une attente écrite dans le texte du skill** (R5), un `sleep` avant de relancer : un geste de plus à improviser, que l'outil Bash refuse au premier plan ; l'option se teste.

## Questions à l'architecte

Aucune : chaque remède est celui que le rapport propose. Les choix d'écriture (le nom `--attendre`, une veille `--attendre` plus courte qu'une pause qui finit sans passe) sont dans la décision 2.

## À faire, dans l'ordre

### § 0 — Partir de `main`, et la règle de repli

`git fetch origin main`, une branche depuis `origin/main`, la même pour les tickets 67, 68 et 69. Les annexes se lisent sous `docs/issues/gouverner-nos-boucles/issues/67-annexes/` de `main` si la PR de documentation qui porte ce ticket y est entrée, sinon sur la branche de documentation du programme (`git show <branche>:<chemin>`), écrites dans le scratchpad de la session, jamais dans le dépôt. Si `main` est encore à `25a72c7`, `git apply <scratchpad>/ticket-67-68-69.patch` depuis la racine pose les trois tickets ; sinon, recopier les diffs ticket par ticket, chaque ajout placé par son texte (si un repère a changé de mots, au même endroit par le sens). Si `main` a touché `relecteur.mjs` ou son banc depuis `25a72c7`, le banc du Relecteur dit ce qui ne tient plus.

### § 1 — Le banc d'abord, vu rouge

Les changements de `relecteur.test.mjs` du diff ci-dessous, seuls : `node --test skills/chaine/relecteur/scripts/relecteur.test.mjs` rend **4 rouges sur 37** sur `25a72c7` : « X15 » (la cause sans son mot), « suite 66 — R3 », « suite 66 — R5 », « suite 66 — 18 ». Le recopier dans la PR.

### § 2 — Le code

Le diff entier du ticket, contre `25a72c7` (les deux fichiers ; le patch commun le porte aussi) :

```diff
diff --git a/skills/chaine/relecteur/scripts/relecteur.mjs b/skills/chaine/relecteur/scripts/relecteur.mjs
index 4e876d8..c598be9 100644
--- a/skills/chaine/relecteur/scripts/relecteur.mjs
+++ b/skills/chaine/relecteur/scripts/relecteur.mjs
@@ -8,6 +8,7 @@
 //   node '<dossier du skill>/scripts/relecteur.mjs' distribuer <n> --sommet <sha> --couple <modele>/<effort> [--remplace <id>]
 //        [<session>…] [--sessions <fichier>]
 //   node '<dossier du skill>/scripts/relecteur.mjs' veille [--pause <s>] [--duree <min>] [--taire <n>,…] [--sondes <k>]
+//        [--attendre]
 //
 // Chaque sous-commande, sauf `veille`, prend d'abord le verrou du dossier (`flock` sur `<dossier git>/relecteur.verrou`,
 // attendu 300 secondes au plus : deux préparations ne se croisent jamais), puis prépare le dossier : il doit être propre ; le clone est approfondi
@@ -15,7 +16,8 @@
 // les dépendances de develop sont installées quand son `pnpm-lock.yaml` a changé depuis la dernière installation.
 // Chaque commande git, la sienne comme celle des scripts qu'il joue, porte `core.hooksPath` vide et `core.fsmonitor`
 // à `false`, ajoutés aux `GIT_CONFIG_*` de la session, jamais à leur place. Une installation en échec écrit sa sortie
-// d'erreur et ne se retente qu'au prochain changement du lockfile. Les scripts joués sont ceux de develop, sous `scripts/chaine/` : la décision (`decision-relecteur.mjs`, la
+// d'erreur et ne se retente qu'au prochain changement du lockfile, ou dans un Relecteur neuf (un dossier neuf n'a
+// pas de témoin). Les scripts joués sont ceux de develop, sous `scripts/chaine/` : la décision (`decision-relecteur.mjs`, la
 // même que celle du capitaine), « double relecture exigée », « même contenu propre », les chemins sensibles,
 // `sujet.sh a-juger`, et `github.sh`, dont `lire_github` est la seule lecture de GitHub (A-108).
 //
@@ -26,7 +28,8 @@
 // de tour, l'instant, `relecture.delai`, et l'état des sessions quand le modèle le donne (`--sessions`).
 //   - le diff propre : pour une PR vers develop, le diff à trois points sans renommage ; vers un sujet, la sortie de
 //     `sujet.sh a-juger` (sa seconde liste pour une PR de mise à jour). Quand il ne se lit pas, aucune règle ne joue :
-//     le geste `illisible`, sa cause nommée — PR de fourche, tête introuvable, dépendances de develop (une installation
+//     le geste `illisible`, sa cause nommée — PR de fourche, tête introuvable (après une seconde lecture d'origin : un
+//     push tombé entre la préparation et la lecture de la PR n'en est pas une), dépendances de develop (une installation
 //     en échec), forme refusée par `a-juger` (la ligne va à l'auteur, la seule cause qui soit à lui), `a-juger` ou le
 //     diff en échec — et rien tant que cette trace est la plus récente et date de `relecture.delai` au plus (A-116) ;
 //   - `--sessions <fichier>` : un objet JSON { <session>: vivante | morte | plafond } que le modèle a lu (get_session) ;
@@ -54,7 +57,9 @@
 // PR, hors de `--taire`, demande un geste : `VEILLE GESTE`, puis une ligne `GESTE <n> <geste> règle <r>` par PR. Les
 // gestes `rien`, `hors-regime` et `pause` ne réveillent personne. GitHub illisible : `PAUSE`, la veille continue.
 // Au bout de la durée : `VEILLE FINIE`. Toute autre sortie de `passe` : `VEILLE ARRÊTÉE sortie <c>`, avec son code.
-// La sortie d'erreur d'une passe sortie en 0 (une installation en échec) passe sur celle de la veille, dans son journal.
+// La sortie d'erreur d'une passe sortie en 0 ou en 5 (une installation en échec, puis GitHub muet) passe sur celle de
+// la veille, dans son journal. `--attendre` : une pause avant la première passe aussi (une veille relancée sur une
+// sortie à rejouer, 9, 12 ou une autre, rejoue au réveil suivant, pas tout de suite).
 //
 // Sorties : 0 fait ; 2 usage ou entrée mal formée ; 3 la PR est fermée, ou le geste, le sommet ou le couple ont changé
 // (rien n'est écrit) ; 5 GitHub illisible ; 6 le dossier n'est pas celui d'un projet de la chaîne, ou pas propre, ou
@@ -125,7 +130,7 @@ function preparer() {
   const sale = git('status', '--porcelain');
   if (sale.status !== 0 || sale.stdout.trim() !== '') arreter(6, 'le dossier du Relecteur n\'est pas propre : il ne sert qu\'au Relecteur, rien ne s\'y écrit');
   if (gitOk('rev-parse', '--is-shallow-repository') !== 'false') gitOk('fetch', '-q', '--unshallow', 'origin');
-  gitOk('fetch', '-q', '--prune', 'origin', '+refs/heads/*:refs/remotes/origin/*');
+  rapatrier();
   gitOk('switch', '-q', '--detach', 'refs/remotes/origin/develop');
   if (existsSync(join(DOSSIER, 'pnpm-lock.yaml'))) {
     const empreinte = gitOk('rev-parse', 'HEAD:pnpm-lock.yaml');
@@ -143,6 +148,8 @@ function preparer() {
   }
 }
 let DEPENDANCES = true;
+// Toutes les branches d'origin relues : à la préparation, et une seconde fois avant de dire une tête introuvable.
+const rapatrier = () => gitOk('fetch', '-q', '--prune', 'origin', '+refs/heads/*:refs/remotes/origin/*');
 
 // La clé `relecture` du contrat d'une base : `null` (pas de contrat, ou pas de clé : régime 7), `'illisible'`, ou
 // la clé lue, ses valeurs par défaut complétées. `depuis` : UTC en `Z`, avec ou sans millisecondes ; un décalage
@@ -172,14 +179,18 @@ const derniere = (r) => `${r.stderr ?? ''}\n${r.stdout ?? ''}`.split('\n').map((
 function liste(pr, json) {
   const { base, tete, n } = pr;
   if ((json.head.repo?.full_name ?? null) !== (json.base.repo?.full_name ?? null)) return { cause: 'PR de fourche : sa tête vit hors du dépôt, le Relecteur ne la lit pas', a: 'architecte' };
-  if (git('cat-file', '-e', `${tete}^{commit}`).status !== 0) return { cause: `tête introuvable : ${tete} n'est sur aucune branche d'origin`, a: 'architecte' };
+  // Un push entre la préparation et la lecture de la PR : la tête n'est pas encore là. Origin relu une fois, avant
+  // de la dire introuvable (un commentaire et une ligne à l'architecte pour rien, sinon).
+  const presente = () => git('cat-file', '-e', `${tete}^{commit}`).status === 0;
+  if (!presente()) rapatrier();
+  if (!presente()) return { cause: `tête introuvable : ${tete} n'est sur aucune branche d'origin`, a: 'architecte' };
   if (base === 'develop') {
     const depart = git('merge-base', 'refs/remotes/origin/develop', tete);
     const d = depart.status === 0 ? git('-c', 'core.quotePath=false', 'diff', '--no-renames', '--name-only', depart.stdout.trim(), tete) : depart;
     return d.status === 0 ? { fichiers: d.stdout.split('\n').filter(Boolean) } : { cause: `diff illisible : ${derniere(d)}`, a: 'architecte' };
   }
   const a = jouer('bash', [join(CHAINE, 'sujet.sh'), 'a-juger', tete, base, String(n)]);
-  if (a.status !== 0 && !DEPENDANCES) return { cause: 'dépendances de develop : pnpm install en échec, `sujet.sh a-juger` ne juge pas les retouches', a: 'architecte' };
+  if (a.status !== 0 && !DEPENDANCES) return { cause: 'dépendances de develop : pnpm install en échec, `sujet.sh a-juger` ne juge pas les retouches ; retentée au prochain lockfile de develop, ou par un Relecteur neuf', a: 'architecte' };
   if (a.status === 4) return { cause: `forme refusée par \`sujet.sh a-juger\` : ${derniere(a)}`, a: 'auteur' };
   if (a.status !== 0) return { cause: `\`sujet.sh a-juger\` en échec (sortie ${a.status}) : ${derniere(a)}`, a: 'architecte' };
   const [premiere, seconde] = a.stdout.replace(/\n$/, '').split(/\n\n/);
@@ -366,16 +377,21 @@ function veille(argv) {
   const duree = Number(lireOption('--duree', '25'));
   const sondes = Number(lireOption('--sondes', 'Infinity'));
   const taire = new Set(String(lireOption('--taire', '')).split(',').filter(Boolean).map(Number));
+  const differee = argv.includes('--attendre');
   if (![pause, duree].every((x) => Number.isFinite(x) && x >= 0)) arreter(2, '--pause et --duree : des nombres');
   const fin = Date.now() + duree * 60_000;
   const attendre = (s) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, s * 1000);
   for (let k = 0; k < sondes && Date.now() <= fin; k++) {
-    // Jamais une pause qui finirait après la durée : la veille finit sous le plafond de l'outil Bash (A-180).
-    if (k > 0 && Date.now() + pause * 1000 > fin) break;
-    if (k > 0) attendre(pause);
+    // Jamais une pause qui finirait après la durée : la veille finit sous le plafond de l'outil Bash (A-180). Avec
+    // `--attendre`, la première passe aussi vient après une pause : rejouer au réveil suivant, pas tout de suite.
+    if (k > 0 || differee) {
+      if (Date.now() + pause * 1000 > fin) break;
+      attendre(pause);
+    }
     const r = jouer(process.execPath, [ICI, 'passe']);
-    // Ce que la passe écrit sur sa sortie d'erreur (une installation en échec) va au journal de la veille.
-    if (r.status === 0 && r.stderr) process.stderr.write(r.stderr);
+    // Ce que la passe écrit sur sa sortie d'erreur (une installation en échec) va au journal de la veille, même quand
+    // GitHub la fait ensuite sortir en 5 : le témoin dit « echec », l'installation ne se retentera pas.
+    if ((r.status === 0 || r.status === 5) && r.stderr) process.stderr.write(r.stderr);
     if (r.status === 5) {
       process.stdout.write(`PAUSE GitHub illisible : ${(r.stderr || '').trim().split('\n').at(-1)}\n`);
       continue;
@@ -426,7 +442,7 @@ if (estPointEntree()) {
     else if (sous === 'jouer') await jouerGeste(reste);
     else if (sous === 'distribuer') await distribuer(reste);
     else if (sous === 'veille') veille(reste);
-    else arreter(2, 'usage : relecteur.mjs passe | jouer <n> [--sessions <fichier>] | distribuer <n> --sommet <sha> --couple <modele>/<effort> [--remplace <id>] [<session>…] [--sessions <fichier>] | veille [--pause <s>] [--duree <min>] [--taire <n>,…]');
+    else arreter(2, 'usage : relecteur.mjs passe | jouer <n> [--sessions <fichier>] | distribuer <n> --sommet <sha> --couple <modele>/<effort> [--remplace <id>] [<session>…] [--sessions <fichier>] | veille [--pause <s>] [--duree <min>] [--taire <n>,…] [--attendre]');
   } catch (e) {
     if (!(e instanceof Arret)) throw e;
     process.stderr.write(`relecteur : ${e.message}\n`);
diff --git a/skills/chaine/relecteur/scripts/relecteur.test.mjs b/skills/chaine/relecteur/scripts/relecteur.test.mjs
index ac1383d..c845332 100644
--- a/skills/chaine/relecteur/scripts/relecteur.test.mjs
+++ b/skills/chaine/relecteur/scripts/relecteur.test.mjs
@@ -440,7 +440,7 @@ test('X15 — les causes d’illisible, une à une : forme refusée par `a-juger
   mise(p, { pnpmEnEchec: true });
   const r = p.lancer('jouer', '12');
   assert.match(r.stderr, /pnpm install en échec \(sortie 1\) :\nERR_PNPM_FROZEN_LOCKFILE/, 'la sortie d’erreur de l’installation est écrite');
-  assert.match(p.etat().pulls[0].commentaires.at(-1).body, /^Lecture illisible — dépendances de develop : /);
+  assert.match(p.etat().pulls[0].commentaires.at(-1).body, /^Lecture illisible — dépendances de develop : .* ; retentée au prochain lockfile de develop, ou par un Relecteur neuf$/, 'la cause dit comment l’installation se retente (suite du ticket 66)');
   assert.deepEqual(p.json(r)[0].lignes.map((l) => l.a), ['architecte']);
   const tentatives = () => readFileSync(join(p.racine, 'faux-gh/pnpm.log'), 'utf8').split('\n').filter((l) => l.startsWith('pnpm install')).length;
   assert.equal(tentatives(), 1);
@@ -721,3 +721,55 @@ test('contre-relecture — une PR de mise à jour qu’`a-juger` accepte : son d
   const [g] = d.json(d.lancer('passe'));
   assert.deepEqual([g.geste, g.faits?.sensible, g.faits?.effort], ['distribuer', true, 'xhigh'], JSON.stringify(g));
 });
+
+// --- Suite du ticket 66, ticket 67 : la veille, la préparation, la tête relue -----------------------------------------
+
+test('suite 66 — R3 : une installation en échec dans une passe que GitHub fait ensuite sortir en 5 : son erreur au journal de la veille', () => {
+  const d = monter();
+  writeFileSync(join(d.racine, 'bin/pnpm'), '#!/bin/sh\ncat > /dev/null\necho "ERR_PNPM_PASSAGERE" >&2\nexit 1\n');
+  d.git('switch', '-q', 'develop');
+  d.ecrire('pnpm-lock.yaml', 'lockfileVersion: 9.0\n');
+  d.commit('chore: lockfile');
+  d.git('push', '-q', 'origin', 'HEAD:develop');
+  // GitHub ne répond pas à la liste des PR, une fois : la passe qui a installé sort en 5.
+  d.github({ pulls: [], pannes: [{ route: '^pulls\\?', fois: 1 }] });
+  const r = d.lancer('veille', '--pause', '0', '--sondes', '2');
+  assert.equal(r.status, 0, r.stderr);
+  assert.match(r.stdout, /^PAUSE GitHub illisible : /m);
+  assert.match(r.stderr, /pnpm install en échec \(sortie 1\) :\nERR_PNPM_PASSAGERE/, 'le témoin dit « echec » : sans cette ligne, l’erreur ne serait écrite nulle part');
+});
+
+test('suite 66 — R5 : `veille --attendre` met une pause avant sa première passe, sous la même borne que les autres ; sans lui, la première passe part tout de suite', () => {
+  const d = monter();
+  pr(d);
+  // Un `git` tué en plein travail a laissé son verrou : toute passe sort en 12.
+  writeFileSync(join(d.dossier, '.git/index.lock'), '');
+  const sans = d.lancer('veille', '--pause', '3', '--duree', '0.01');
+  assert.deepEqual([sans.status, sans.stdout.trim().split('\n').at(-1)], [12, 'VEILLE ARRÊTÉE sortie 12']);
+  const t0 = Date.now();
+  const avec = d.lancer('veille', '--pause', '3', '--duree', '0.01', '--attendre');
+  assert.deepEqual([avec.status, avec.stdout], [0, 'VEILLE FINIE\n'], 'une pause qui finirait après la durée ne commence pas, même la première : aucune passe');
+  assert.ok(Date.now() - t0 < 2500, 'aucune pause jouée au-delà de la durée');
+  execFileSync('rm', [join(d.dossier, '.git/index.lock')]);
+  const t1 = Date.now();
+  const geste = d.lancer('veille', '--pause', '1', '--sondes', '1', '--attendre');
+  assert.deepEqual([geste.status, geste.stdout], [0, 'VEILLE GESTE\nGESTE 12 distribuer règle 6\n'], geste.stderr);
+  assert.ok(Date.now() - t1 >= 1000, 'la première passe vient après une pause');
+});
+
+test('suite 66 — 18 : un push entre la préparation et la lecture de la PR : la tête est relue une fois, jamais dite introuvable pour rien', () => {
+  const d = monter();
+  pr(d);
+  // Un commit neuf de la PR, poussé par le faux GitHub au moment où `jouer` lit la PR, après la préparation.
+  d.git('switch', '-q', 'feat/a');
+  d.ecrire('src/a.mjs', 'export const a = 2;\n');
+  d.commit('fix: a');
+  const neuf = d.git('rev-parse', 'HEAD');
+  Object.assign(d.env, { BANC_FAUX_GH: join(CHAINE, 'sujet/scripts/faux-gh.mjs'), BANC_TRAVAIL: d.travail });
+  writeFileSync(join(d.racine, 'bin/gh'), '#!/bin/sh\ncase "$*" in *pulls/12*) if [ ! -e "$FAUX_GH/pousse-faite" ]; then touch "$FAUX_GH/pousse-faite"; git -C "$BANC_TRAVAIL" push -q origin HEAD:feat/a; fi ;; esac\nexec node "$BANC_FAUX_GH" "$@"\n');
+  const r = d.lancer('jouer', '12');
+  assert.equal(r.status, 0, r.stderr);
+  const [g] = d.json(r);
+  assert.deepEqual([g.tete, g.geste, g.regle], [neuf, 'distribuer', 6], JSON.stringify(g));
+  assert.ok(!d.etat().pulls[0].commentaires.some((c) => /^Lecture illisible/.test(c.body ?? c)), 'aucune trace d’illisible');
+});
```

Le cas « R5 » lance deux veilles de quelques secondes ; « 18 » remplace `gh` par un faux de trois lignes qui pousse un commit au moment où `jouer` lit la PR, et dont le texte ne contient rien de variable (`BANC_FAUX_GH`, `BANC_TRAVAIL` dans l'environnement, comme `A-181` le veut).

## Surfaces

| Surface | Preuve |
| --- | --- |
| La veille garde l'erreur d'une installation quand la passe sort en 5 (R3) | `relecteur.test.mjs`, « suite 66 — R3 » ; mutation A1 |
| `veille --attendre` : une pause avant la première passe, sous la borne de la durée (R5) | « suite 66 — R5 » ; mutations A2, A3, A4 |
| La tête relue une fois avant `tête introuvable` (18) | « suite 66 — 18 » ; « un diff propre qui ne se lit pas (la tête est introuvable) », inchangé, garde la cause quand la tête manque vraiment ; mutations A5, A6 |
| La cause « dépendances de develop » dit comment se retenter (17) | « X15 », l'assertion neuve ; mutation A7 |

## Mutations

Dans [`67-annexes/mutations.mjs`](67-annexes/mutations.mjs) (la liste des trois tickets ; celles de ce ticket sont A1 à A7), sur l'arbre de la PR, chacune seule, le fichier remis après : **7 sur 7 rouges** (journal : [`67-annexes/mutations.txt`](67-annexes/mutations.txt)).

## Vérification

1. Le rouge, avant le code (§ 1) : 4 rouges sur 37.
2. Le vert, après : `node --test skills/chaine/relecteur/scripts/relecteur.test.mjs`, 37 sur 37 (sur l'arbre de ce ticket seul) ; 41 sur 41 une fois le ticket 68 posé.
3. Les mutations A1 à A7 : `node <scratchpad>/mutations.mjs A1 A2 A3 A4 A5 A6 A7` depuis la racine, sur l'arbre de la PR : « toutes rouges ».
4. La suite entière et le reste : « Vérification » du ticket 69, pour la PR.

### Ce qui a été joué en écrivant ce ticket

Sur un clone neuf de `https://github.com/MAJ-agency/skills` à `25a72c7` (plugin 7.38.0), le 2026-11-21, Node 22.23.5, git 2.43.0 :

- **Rouge avant le code.** Le banc du ticket seul sur `25a72c7` : `relecteur.test.mjs`, **4 rouges sur 37** (« X15 », « suite 66 — R3 », « suite 66 — R5 », « suite 66 — 18 »).
- **Vert après.** Le diff du ticket : 37 sur 37.
- **Mutations.** A1 à A7, sur l'arbre de la PR : 7 sur 7 rouges (de 37 à 106 secondes chacune, trois copies jouées ensemble, charge jusqu'à 10).
- **Le patch et les diffs disent le même code.** Les diffs des tickets 67, 68 et 69, appliqués l'un après l'autre sur un clone neuf de `25a72c7`, et le patch commun appliqué seul donnent le même arbre (`git write-tree` : `c0aa2ddfd07f1651e0da93d8dd97f5bcf77e252c` les deux fois).
- **Les essais du rapport**, rejoués (`APRES` sur l'arbre voulu) : R3 (`essais-c2.test.mjs`) rouge sur `25a72c7`, vert sur l'arbre de la PR ; le second essai de tenue de R5 (`essais-c3.test.mjs`, « la sortie 9 renvoie au réveil suivant sans borne ») vert sur `25a72c7`, rouge sur l'arbre de la PR : il documentait le défaut, la borne est là ; le premier reste vert, il lance la veille sans `--attendre`.

## Ce qui n'a pas été établi

- **Une vraie panne de registre** n'est pas jouée : le banc remplace `pnpm` par un faux qui sort en 1, et GitHub par le faux qui répond une fois en 502 (`pannes`).
- **Une vraie course** entre un push et `jouer` non plus : le faux `gh` pousse au moment de la lecture, ce qui la rend certaine ; une tête poussée puis retirée par un push forcé entre deux lectures resterait introuvable, et serait dite, une fois par délai (`A-116`).
- **La borne de la sortie 9** n'est que du texte (ticket 69) : aucun banc ne joue deux veilles relancées sur un verrou tenu cinq minutes.

## Hors périmètre

- Le texte du skill (`SKILL.md`, `CONTENU.md`) et son banc : ticket 69.
- Les étiquettes, le plafond et l'état `couple` : ticket 68.
- La veille du capitaine (`fusionner`), qui meurt aussi à 30 minutes (`A-180`, point 1) : un autre ticket de suite, avec les lots 5.

## Comments

- 2026-11-21 — Écrit par un agent rédacteur sur la liste consolidée du rapport de contre-relecture de la PR 146 et sur `A-180`, `A-182` ; code, bancs et mutations joués sur un clone neuf de `25a72c7` (« Vérification »).
