# Le plafond de la garde de commandes descend à 20 000 caractères : sous 100 000, une option d'une lettre répétée la tenait 26 s, et le commentaire annonçait 8,2 s

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: sonnet — une constante, une raison, un motif et deux phrases de documentation donnés mot pour mot (ancien, nouveau), quatre retouches du banc et trois tests ajoutés donnés entiers, la version ; tout est joué sur une copie jetable de `origin/main`, mutations comprises (voir « Vérification »). Rien à concevoir ; la revue passe `/security-review` (la garde de commandes).
Blocked by: —
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `scripts/depot.test.mjs`, `.claude-plugin/plugin.json`

## Le besoin

**Le fait.** `decisionCommande` (`regles.mjs`, la garde de commandes) refuse sans la lire une commande de plus de `TAILLE_MAX_LECTURE_7_9` caractères, 100 000 aujourd'hui ; le commentaire de la constante annonce « son pire cas mesuré est de 8,2 s (99 000 caractères) ». Mesuré sur `a091baa` (7.12.0) par le rédacteur d'anchorpost, puis rejoué ici sur `d726a3c` (même `regles.mjs`), un processus neuf par mesure comme le hook, le plus lent de trois essais, sur un poste de quatre cœurs :

| Forme, vers 99 980 caractères | Temps |
| --- | --- |
| `gh pr close 1 -ddd…!` | 25,7 s |
| `git commit -nnn…!` | 18,8 s |
| accents graves répétés | 12,9 s |
| `git push -fff…!` | 12,3 s |
| `echo` puis 99 975 chiffres | 3,4 s |

Le délai du hook est de 60 s (`settings-hooks.json`). Sur une machine chargée (2,5 s à 20 000 caractères pour la pire forme, avec deux fois plus de processus que de cœurs : au carré, plus de 60 s à 100 000), ou avec un Claude Code qui ne lit pas `"onFailure": "block"`, un dépassement laisserait passer la commande : la monotonie de la garde serait rompue de fait.

La cause, lue : des motifs à deux quantificateurs qui se recouvrent, relus pour chaque lettre quand le mot ne finit pas comme ils l'attendent : `/^(-[a-zA-Z]*d[a-zA-Z]*|--delete-branch)(=.*)?$/` (`gh pr close`, dans le lecteur et dans la lecture de 7.9.x), `\s-[a-z]*n[a-z]*(\s|$)` (`git commit -n`, `COMMANDES_INTERDITES`), `-[a-zA-Z]*f[a-zA-Z]*` (`git push -f`) ; et, dans `ajouts(code)` de la lecture de 7.9.x, `\d*(>>?|<)…`, relancé sur chaque chiffre d'une longue suite.

**La décision de l'architecte (2026-11-16).** Le plafond descend à **20 000 caractères**. Au-delà, la garde refuse avant toute lecture, comme aujourd'hui au-delà de 100 000. C'est monotone : la garde refuse seulement davantage. Le pire cas à 20 000 caractères doit rester sous 2 s, sinon le ticket propose le plafond qui l'assure. Le commentaire dit les vrais chiffres. Le `(?<!\d)` d'anchorpost dans `ajouts(code)` de `LECTURE_7_9` est repris s'il est prouvé sans effet sur les décisions. Les textes qui disent le plafond (`CONTENU.md` du socle de la chaîne, `RAISON_TROP_LONGUE`) disent 20 000 et le contournement : écrire le texte dans un fichier.

**Mesuré à 20 000 caractères** (même poste, même protocole), sur les formes ci-dessus et sur celles qu'une recherche a trouvées (27 préfixes de commande × 82 motifs répétés × 7 fins, puis 18 préfixes d'option × 49 lettres ou paires × 9 fins, toutes jouées à 20 000 caractères) :

| Forme, à 20 000 caractères | Temps |
| --- | --- |
| `gh pr close 1 -ddd…!` (la pire trouvée) | 1,15 s (de 1,0 à 1,24 s selon les passes) |
| `git commit -nnn…!`, `GIT commit -nnn….`, `git commit -m x -nNnN…!` | 0,8 s |
| `git push -fff…!` | 0,5 s |
| accents graves répétés, `x=` puis accents graves | 0,4 s |
| `git push ` répété | 0,3 s |
| `echo` puis des `` `a` `` | 0,2 s |
| `$(a)` répété, `echo` puis des chiffres | 0,2 s (chiffres : 0,01 s avec le `(?<!\d)`) |
| `gh pr close 1 -ddd…!`, huit processus sur quatre cœurs | 2,2 à 2,5 s |

Le pire cas, 1,2 s, reste sous 2 s : **le plafond de 20 000 tient**, aucun plafond plus bas n'est proposé. Mêler les formes (`gh pr close 1 git commit git push -dnfdnf…!`) coûte moins (0,65 s au plus) : chaque motif relit moins de lettres.

Quand le ticket est fait : une commande de 20 000 caractères est lue, une de 20 001 est refusée sans lecture ; le banc borne à 10 s chaque pire cas mesuré à 20 000 caractères et vérifie le refus à 20 001 ; le commentaire, la raison du refus et `CONTENU.md` disent 20 000 caractères, 1,2 s et le contournement ; `ajouts(code)` de la lecture de 7.9.x porte le `(?<!\d)`, prouvé sans effet.

## Où

Base : `origin/main` à `d726a3c` (plugin **7.12.2**, **662 tests**).

| Texte | Ce qu'il dit | Verdict |
| --- | --- | --- |
| `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs:2164-2169` (le commentaire et `TAILLE_MAX_LECTURE_7_9`) | 100 000 ; « 8,2 s (99 000 caractères) » ; les formes coûteuses seraient les accents graves, `$(…)` ou `git commit` | R1 : 20 000, les vraies formes et les vrais chiffres |
| `regles.mjs:2171-2172` (`RAISON_TROP_LONGUE`) | « plus de 100 000 caractères » ; le contournement par un fichier, déjà dit | R2 : 20 000 |
| `regles.mjs:2264-2266` (`ajouts(code)` de `LECTURE_7_9`) | `\d*(>>?|<)…`, relancé sur chaque chiffre | R3 : `(?<!\d)` |
| `skills/chaine/socle-chaine-de-production/references/CONTENU.md:13` (« Restent hors de sa lecture : … ») | « plus de 100 000 caractères » ; pas de contournement | R4 : 20 000 et le contournement |
| `CONTENU.md:13` (« la lecture reste au carré … ») | 100 000 ; 8,2 s ; accents graves ou `$(…)` seuls | R5 : 20 000, 1,2 s, les vraies formes |
| `regles.test.mjs:1035-1036` (« A-51 bis : la lecture de 7.9.x rend ce que rendait son motif de here-doc ») | 20 054 caractères : au-delà du nouveau plafond, ne serait plus lue | B1 : 19 900 sauts de ligne, et la taille vérifiée |
| `regles.test.mjs:886-889` (« ticket 33, contre-relecture C1 ») | mesure la linéarité jusqu'à 90 005 caractères (`nus`) et 240 038 (`continuees`, déjà refusé sans lecture par le plafond de 100 000) : au-delà du nouveau plafond | B2 : tailles sous le plafond, vérifiées |
| `regles.test.mjs:1042-1053` (« A-51 ter : au-delà de 100 000 caractères ») | refus à 100 001 ; here-doc de 96 027 caractères lu ; accents graves à 50 000 | B3 : refus à 20 006 ; here-doc à 20 003 refusé, à 19 999 lu ; les accents graves passent au test ajouté, à 20 000 |
| `regles.test.mjs:1056` (titre « … plus de 100 000 caractères est refusée vite ») | le titre | B4 : 20 000 |
| fin de `regles.test.mjs` | — | B5 : deux tests ajoutés |
| fin de `scripts/depot.test.mjs` | — | B6 : un test ajouté |
| `.claude-plugin/plugin.json:3` | 7.12.2 | 7.12.3 |

### Gardé tel quel, après lecture

- **Le contrôle du plafond** (`regles.mjs:1957-1959`) : `commande.length > TAILLE_MAX_LECTURE_7_9`, avant toute lecture et avant la lecture du contexte ; son commentaire (« au carré sur certaines formes (`git commit -m x ` répété) ») reste vrai.
- **Les motifs quadratiques eux-mêmes** (`-[a-zA-Z]*d[a-zA-Z]*`, `-[a-z]*n[a-z]*`, `-[a-zA-Z]*f[a-zA-Z]*`) : voir « Remèdes écartés ».
- **Le délai du hook** (60 s pour `garde-commandes`, `settings-hooks.json`) et `"onFailure": "block"`.
- **Le test « ticket 33 : le lecteur est linéaire — 30 000 lignes « cat <<EOF » non fermées »** (`regles.test.mjs:742`) : 300 000 caractères, refusés par le plafond avant toute lecture depuis 100 000 déjà ; il reste vert et ne mesure plus le lecteur (voir « Hors périmètre »).
- **Le test « A-51 ter : le plafond se teste avant toute lecture »** : 992 015 caractères, refusés en moins de 2 s ; seul son titre change (B4).
- **Le commentaire de `sansHeredocs79`** (« 37 s pour dix `<<A` et 20 000 sauts de ligne ») : il mesure l'ancien motif, et reste vrai.

## Décisions

1. **Le plafond : 20 000 caractères** (décision de l'architecte). `commande.length > 20_000` : 20 000 caractères sont lus, 20 001 refusés sans lecture, avec `RAISON_TROP_LONGUE`. Monotone : toute commande refusée hier l'est encore ; seules les commandes de 20 001 à 100 000 caractères, lues hier, sont refusées.
2. **Le pire cas tient sous 2 s** : 1,2 s à 20 000 caractères (voir « Le besoin ») ; aucun plafond plus bas n'est proposé. À titre de repère, au carré, 15 000 caractères donneraient 0,65 s et 10 000, 0,3 s.
3. **Le banc borne à 10 s** chaque pire cas mesuré, joué à exactement 20 000 caractères : huit fois le temps mesuré au repos, quatre fois celui mesuré avec deux fois plus de processus que de cœurs, six fois moins que le délai du hook. Le refus à 20 001 caractères est borné à 1 s (il ne lit rien). La liste `PIRES_CAS` porte onze formes, celles du tableau ; la décision attendue de chacune à 20 000 est `null` (`CTX_33`), vérifiée.
4. **Le `(?<!\d)` d'anchorpost est repris**, parce qu'il ne change aucun remplacement, donc aucune décision. **Lecture du motif** : `/\d*(>>?|<)&?\s*[^\s;&|]*/g` finit par `[^\s;&|]*`, gourmand, que rien ne suit : une correspondance s'arrête sur un blanc, `;`, `&`, `|` ou la fin, jamais devant un chiffre. Une correspondance qui commencerait en `p` après un chiffre en `p-1` existerait aussi en `p-1` (le chiffre de plus entre dans `\d*`) ; `p-1` n'est pas dans une correspondance précédente (elle se serait arrêtée devant un chiffre) ; la recherche, de gauche à droite, l'aurait donc trouvée en `p-1` ou avant. Les correspondances trouvées commencent donc toutes en un point qui ne suit pas un chiffre, et `(?<!\d)` n'en écarte aucune ; il épargne seulement les départs voués à l'échec, au milieu d'une suite de chiffres. `\d` sans drapeau `u` ne lit que `0` à `9`. **Différentiel** : l'égalité des deux remplacements sur les 2 396 745 textes de 0 à 7 caractères sur `1><& ;|a` et sur 2 000 000 de textes aléatoires de 1 à 60 fragments (chiffres, blancs, `\r`, `\t`, redirections, `pnpm add`…) : aucun écart ; les décisions de `LECTURE_7_9.decisionCommande` et de `decisionCommande`, `regles.mjs` contre sa copie au seul `(?<!\d)`, sur 400 000 commandes générées (`pnpm add`, `pnpm install`, préfixes, paquets, chiffres collés, redirections, séparateurs, citations, substitutions ; trois contextes, dont `dependancesPrevues` nul), 144 286 refusées, 125 955 à ajout lu : **aucun écart**. Le différentiel voit un vrai changement : `(?<!\w)` au lieu de `(?<!\d)` donne 18 écarts sur 20 000. Effet : `echo` puis 99 975 chiffres, 3,4 s → 0,02 s ; à 20 000 caractères, 0,16 s → 0,01 s.
5. **Les textes.** `RAISON_TROP_LONGUE` dit « plus de 20 000 caractères » et garde son contournement (« Écris le texte long dans un fichier (git commit -F <fichier>, gh … --body-file <fichier>) ou découpe la commande. ») ; `CONTENU.md` dit 20 000, le contournement, 1,2 s et les vraies formes. Le banc lit la raison (`regles.test.mjs`, posé dans les projets avec la garde) et `CONTENU.md` (`scripts/depot.test.mjs`, propre à ce dépôt).
6. **Trois tests existants changent d'entrée ; aucun n'est assoupli sur ce qu'il prouve sous le plafond.** Leurs entrées dépassaient le nouveau plafond, et la garde les aurait refusées sans les lire : B1 et B2 ramènent leurs tailles sous 20 000 et vérifient qu'elles y restent (C1 mesure désormais aussi `continuees`, que le plafond de 100 000 refusait déjà sans le lire : 240 038 caractères ; ses mesures portent sur de plus petites tailles, car au-delà de 20 000 rien ne se lit plus) ; B3 déplace le plafond, et sa mesure d'accents graves à 50 000 caractères passe au test ajouté, à 20 000, sous la même borne de 10 s. Aucun test retiré ni sauté.
7. **Version : correctif** (`.claude-plugin/plugin.json:3`, 7.12.2 → 7.12.3 sur `d726a3c`). **Règle de repli** : si `main` bouge entre l'ouverture et la fusion, la session fusionne `origin/main` dans sa branche par un commit de fusion (jamais de rebase ni de push forcé), reprend la version de `main` plus un au troisième nombre, puis vérifie la valeur après la fusion (`git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, un cran au-dessus).
8. **`Label: contre-revue`** et **`/security-review`** : `regles.mjs` est la garde de commandes, chemin sensible de tout projet posé (`scripts/agent/regles.mjs` dans le gabarit de `.claude/chaine.json`). PR vers `main`, hors brouillon, **sans `à-fusionner`** : l'architecte la contre-relit, puis la fait entrer. Titre `fix(chaine): le plafond de la garde de commandes descend à 20 000 caractères (plugin <version>)`. Commits sous les hooks, jamais `--no-verify`.

### Remèdes écartés

- **Réécrire les motifs quadratiques** (`-[a-zA-Z]*d[a-zA-Z]*` en une lecture linéaire) : ils sont dans le lecteur et dans la lecture de 7.9.x, gardée telle quelle pour l'union (A-51 ter) ; chacun demanderait son différentiel, et le plafond borne déjà tout motif au carré. À reprendre dans un ticket à part si un plafond plus haut devient nécessaire.
- **Un délai interne à la garde** (lire, et refuser passé 30 s) : une lecture JavaScript ne s'interrompt pas sans processus ou `Worker` à part ; le plafond est plus simple et ne dépend pas de la charge.
- **Garder 100 000 et compter sur `"onFailure": "block"`** : un Claude Code plus ancien ne le lit pas, et la décision veut une garde sûre même là.

## À faire, dans l'ordre

### 0. Le banc d'abord, vu rouge

Dans `regles.test.mjs` (`skills/chaine/socle-chaine-de-production/references/agent/`), quatre remplacements, puis deux tests ajoutés à la fin du fichier ; dans `scripts/depot.test.mjs`, un test ajouté à la fin ; rien d'autre. Chaque « Ancien » apparaît une seule fois à `d726a3c`.

#### B1 — `regles.test.mjs:1035-1036`

Ancien :

````js
  // Le cas qui coûtait au cube : dix « <<A » cités, 20 000 sauts de ligne (37 s avec le motif).
  const c = "echo '" + '<<A '.repeat(10) + "'" + '\n'.repeat(20000) + 'echo ok';
````

Nouveau :

````js
  // Le cas qui coûtait au cube : dix « <<A » cités, 19 900 sauts de ligne (37 s avec le motif pour 20 000), sous le plafond.
  const c = "echo '" + '<<A '.repeat(10) + "'" + '\n'.repeat(19900) + 'echo ok';
  assert.ok(c.length <= 20000, `${c.length} caractères : au-delà du plafond, la commande ne serait pas lue`);
````

#### B2 — `regles.test.mjs:886-889`

Ancien :

````js
  for (const [forme, attendu] of [[continuees, 'refuser'], [nus, undefined]]) {
    mesure(forme(1000));
    const petit = mesure(forme(10000));
    const grand = mesure(forme(30000));
````

Nouveau :

````js
  // Les tailles restent sous le plafond de 20 000 caractères : au-delà, la commande est refusée sans être lue.
  for (const [forme, attendu, n] of [[continuees, 'refuser', 800], [nus, undefined, 2200]]) {
    assert.ok(forme(3 * n).length <= 20000, `${forme(3 * n).length} caractères : au-delà du plafond`);
    mesure(forme(n / 10));
    const petit = mesure(forme(n));
    const grand = mesure(forme(3 * n));
````

#### B3 — `regles.test.mjs:1042-1053`

Ancien :

````js
test('A-51 ter : au-delà de 100 000 caractères, refus prudent ; en deçà, le pire cas mesuré reste sous 10 s', () => {
  assert.deepEqual(decisionCommande('echo ' + 'x'.repeat(100001), CTX_33), { decision: 'refuser', raison: RAISON_TROP_LONGUE });
  // Le plafond compte toute la commande, corps de here-doc compris : un message plus long s'écrit dans un fichier.
  assert.deepEqual(decisionCommande(`git commit -F - <<'EOF'\n${'fix\n'.repeat(25001)}EOF`, CTX_33), { decision: 'refuser', raison: RAISON_TROP_LONGUE });
  assert.equal(decisionCommande(`git commit -F - <<'EOF'\n${'fix\n'.repeat(24000)}EOF`, CTX_33), null);
  // La forme la plus coûteuse mesurée pour la lecture de 7.9.x : des accents graves collés, au carré de la taille
  // (2,3 s pour 50 000 caractères et 8,2 s pour 99 000 sur le poste de mesure) ; jouée ici à 50 000.
  const c = 'echo ' + '`a`'.repeat(16663);
  const t0 = Date.now();
  assert.equal(decisionCommande(c, CTX_33), null);
  assert.ok(Date.now() - t0 < 10000, `${Date.now() - t0} ms`);
});
````

Nouveau :

````js
test('A-51 ter : au-delà de 20 000 caractères, refus prudent, corps de here-doc compris', () => {
  assert.deepEqual(decisionCommande('echo ' + 'x'.repeat(20001), CTX_33), { decision: 'refuser', raison: RAISON_TROP_LONGUE });
  // Le plafond compte toute la commande, corps de here-doc compris : un message plus long s'écrit dans un fichier.
  // `git commit -F - <<'EOF'`, son saut de ligne et `EOF` font 27 caractères, chaque ligne `fix` 4 : 20 003, puis 19 999.
  assert.deepEqual(decisionCommande(`git commit -F - <<'EOF'\n${'fix\n'.repeat(4994)}EOF`, CTX_33), { decision: 'refuser', raison: RAISON_TROP_LONGUE });
  assert.equal(decisionCommande(`git commit -F - <<'EOF'\n${'fix\n'.repeat(4993)}EOF`, CTX_33), null);
});
````

#### B4 — `regles.test.mjs:1056`

Ancien :

````js
test('A-51 ter : le plafond se teste avant toute lecture — une commande de plus de 100 000 caractères est refusée vite', () => {
````

Nouveau :

````js
test('A-51 ter : le plafond se teste avant toute lecture — une commande de plus de 20 000 caractères est refusée vite', () => {
````

#### B5 — les deux tests ajoutés, à la fin de `regles.test.mjs`

Après le dernier test (« A-51 ter : le contexte est lu une fois pour les deux lectures — un seul appel de chaque »), une ligne vide, puis :

````js
// Le plafond (ticket 48) : les deux lectures coûtent au carré de la taille sur certaines formes, une option d'une lettre
// répétée sans fin de mot en tête (26 s pour `gh pr close 1 -ddd…!` à 99 980 caractères, sous l'ancien plafond de
// 100 000). À 20 000, le pire cas mesuré prend 1,2 s sur le poste de mesure ; le banc le borne à 10 s, marge pour une
// machine chargée, sous le délai de 60 s du hook. Un caractère de plus, et la commande est refusée sans être lue.
const PLAFOND = 20_000;
const PIRES_CAS = [
  ['gh pr close 1 -', 'd', '!'],
  ['git commit -', 'n', '!'],
  ['git commit -m x -', 'nN', '!'],
  ['GIT commit -', 'n', '.'],
  ['git push -', 'f', '!'],
  ['', '`', ''],
  ['x=', '`', ''],
  ['echo ', '`a`', ''],
  ['', 'git push ', ''],
  ['', '$(a)', ')'],
  ['echo ', '9', ''],
];
const pireCas = ([avant, motif, apres], n) => avant + motif.repeat(Math.ceil(n / motif.length)).slice(0, n - avant.length - apres.length) + apres;
test('le plafond à 20 000 caractères : chaque pire cas mesuré se lit sous 10 s, et se refuse sans lecture à 20 001', () => {
  assert.match(RAISON_TROP_LONGUE, /^commande trop longue pour la garde \(plus de 20 000 caractères\)/);
  assert.match(RAISON_TROP_LONGUE, /Écris le texte long dans un fichier \(git commit -F <fichier>, gh … --body-file <fichier>\)/);
  assert.equal(decisionCommande('echo ' + 'x'.repeat(PLAFOND - 5), CTX_33), null, 'au plafond : lue');
  assert.deepEqual(decisionCommande('echo ' + 'x'.repeat(PLAFOND - 4), CTX_33), { decision: 'refuser', raison: RAISON_TROP_LONGUE }, 'un caractère de plus : refusée');
  for (const cas of PIRES_CAS) {
    const c = pireCas(cas, PLAFOND);
    assert.equal(c.length, PLAFOND, JSON.stringify(cas));
    const t0 = Date.now();
    assert.equal(decisionCommande(c, CTX_33), null, JSON.stringify(cas));
    assert.ok(Date.now() - t0 < 10000, `${JSON.stringify(cas)} : ${Date.now() - t0} ms à ${PLAFOND} caractères`);
    const long = pireCas(cas, PLAFOND + 1);
    assert.equal(long.length, PLAFOND + 1, JSON.stringify(cas));
    const t1 = Date.now();
    assert.deepEqual(decisionCommande(long, CTX_33), { decision: 'refuser', raison: RAISON_TROP_LONGUE }, JSON.stringify(cas));
    assert.ok(Date.now() - t1 < 1000, `${JSON.stringify(cas)} : ${Date.now() - t1} ms pour refuser à ${PLAFOND + 1} caractères`);
  }
});

// `ajouts(code)` de la lecture de 7.9.x retire les redirections par `(?<!\d)\d*(>>?|<)…` (ticket 48, repris
// d'anchorpost) : sans `(?<!\d)`, chaque chiffre d'une longue suite relançait la recherche jusqu'au bout de la suite
// (3,6 s pour `echo` et 99 995 chiffres). Le remplacement rendu est le même : une correspondance qui commencerait
// après un chiffre commencerait déjà sur ce chiffre, et le caractère qui suit une correspondance n'est jamais un
// chiffre (elle s'arrête sur un blanc, `;`, `&`, `|` ou la fin).
test("ticket 48 : `ajouts(code)` de la lecture de 7.9.x ne relance pas sa recherche sur chaque chiffre, et rend le même remplacement", () => {
  const AVANT = /\d*(>>?|<)&?\s*[^\s;&|]*/g;
  const APRES = /(?<!\d)\d*(>>?|<)&?\s*[^\s;&|]*/g;
  const ALPHA = ['1', '>', '<', '&', ' ', ';', '|', 'a'];
  const ecarts = [];
  const voir = (s, k) => {
    if (s.replace(AVANT, ' ') !== s.replace(APRES, ' ')) ecarts.push(s);
    if (k > 0) for (const c of ALPHA) voir(s + c, k - 1);
  };
  voir('', 6);
  assert.deepEqual(ecarts.slice(0, 5), []);
  const ctx = { dependancesPrevues: () => ['zod', 'x'], brancheCourante: () => 'feat/x', brancheParDefaut: () => 'develop' };
  for (const c of ['pnpm add zod 2>/dev/null', 'pnpm add zod 12>x', 'pnpm add x2>y', 'pnpm add zod 1>&2', 'pnpm add zod 2>&1', 'pnpm add zod 99<in', 'pnpm add 2>x zod', 'pnpm add zod>x', 'pnpm add zod >>log 2>&1', 'pnpm add zod 2>err1 3>&-'])
    assert.equal(LECTURE_7_9.decisionCommande(c, ctx), null, c);
  assert.equal(LECTURE_7_9.decisionCommande('pnpm add react 2>/dev/null', ctx)?.decision, 'refuser');
  // Hors plafond, la lecture de 7.9.x seule : linéaire sur une longue suite de chiffres.
  const t0 = Date.now();
  assert.equal(LECTURE_7_9.decisionCommande('echo ' + '9'.repeat(99995), CTX_33), null);
  assert.ok(Date.now() - t0 < 1000, `${Date.now() - t0} ms pour 99 995 chiffres`);
});
````

#### B6 — le test ajouté, à la fin de `scripts/depot.test.mjs`

Après le dernier test (« le pied de page des sessions cloud : l'ordre qui le porte vaut, un pied altéré ne vaut pas, le renvoi n'est pas touché »), une ligne vide, puis :

````js
// Le plafond de la garde de commandes (ticket 48) : ce que le socle de la chaîne en dit. La raison du refus, posée dans
// les projets avec `regles.mjs`, est vérifiée par `regles.test.mjs`.
test("le plafond de la garde de commandes : CONTENU.md du socle de la chaîne dit 20 000 caractères, le pire cas mesuré et le contournement par un fichier", () => {
  const contenu = readFileSync(join(RACINE, SKILLS_CHAINE, "socle-chaine-de-production/references/CONTENU.md"), "utf8");
  for (const phrase of [
    "une commande de plus de 20 000 caractères, corps de here-doc compris, refusée sans être lue (contournement : le texte long dans un fichier, `git commit -F <fichier>`, `gh … --body-file <fichier>`) ;",
    "au-delà de 20 000 caractères de commande, la commande est refusée sans être lue (échec fermé), et le pire cas mesuré sous ce seuil est de 1,2 s (une option d'une lettre répétée, `gh pr close 1 -ddd…!`).",
  ])
    assert.ok(contenu.includes(phrase), `CONTENU.md du socle de la chaîne : phrase absente : ${phrase}`);
  assert.doesNotMatch(contenu, /100 000 caractères|8,2 s/, "CONTENU.md du socle de la chaîne : l'ancien plafond ou l'ancien pire cas");
});
````

Le jouer sur `origin/main` : `node --test skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs scripts/depot.test.mjs` donne **quatre** `not ok` sur 84 :

- « le plafond de la garde de commandes : CONTENU.md du socle de la chaîne dit 20 000 caractères, le pire cas mesuré et le contournement par un fichier » (phrase absente) ;
- « A-51 ter : au-delà de 20 000 caractères, refus prudent, corps de here-doc compris » (20 006 caractères lus, `null`) ;
- « le plafond à 20 000 caractères : chaque pire cas mesuré se lit sous 10 s, et se refuse sans lecture à 20 001 » (la raison dit 100 000) ;
- « ticket 48 : `ajouts(code)` de la lecture de 7.9.x ne relance pas sa recherche sur chaque chiffre, et rend le même remplacement » (environ 3 500 ms pour 99 995 chiffres ; l'égalité des remplacements et les décisions, elles, passent déjà).

B1, B2 et B4 restent verts sur `origin/main` : leurs entrées tiennent sous les deux plafonds.

### 1. Les remplacements, mot pour mot

Chaque « Ancien » apparaît **une seule fois** à `d726a3c`. Si une PR fusionnée depuis l'a modifié, la session le retrouve par son sens et applique le « Nouveau » à la même place.

#### R1 — `regles.mjs:2164-2169`, le commentaire et la constante

Ancien :

````js
/**
 * Au-delà de cette taille de la commande, aucune lecture n'est jouée (ni le lecteur par jetons, ni celle de 7.9.x) :
 * la commande est refusée (échec fermé). La lecture de 7.9.x coûte au carré sur certaines formes (accents graves, `$(…)` ou `git commit`
 * répétés sans séparateur) ; sous ce seuil, son pire cas mesuré est de 8,2 s (99 000 caractères), sous le délai du hook.
 */
const TAILLE_MAX_LECTURE_7_9 = 100_000;
````

Nouveau :

````js
/**
 * Au-delà de cette taille de la commande, aucune lecture n'est jouée (ni le lecteur par jetons, ni celle de 7.9.x) :
 * la commande est refusée (échec fermé). Les deux lectures coûtent au carré de la taille sur certaines formes : une option
 * d'une lettre répétée sans fin de mot (`gh pr close 1 -ddd…!`, `git commit -nnn…!`, `git push -fff…!`, que des motifs
 * comme `-[a-zA-Z]*d[a-zA-Z]*` relisent pour chaque lettre), des accents graves, `$(…)` ou `git push ` répétés. Mesuré
 * le 2026-11-16 (ticket 48, quatre cœurs, un processus neuf par mesure, comme le hook) : à 20 000 caractères, le pire cas
 * est de 1,2 s (`gh pr close 1 -ddd…!`), 2,5 s avec deux fois plus de processus que de cœurs ; sous l'ancien plafond de
 * 100 000, la même forme prenait 26 s à 99 980 caractères. Le délai du hook est de 60 s ; `regles.test.mjs` borne le
 * pire cas à 10 s.
 */
const TAILLE_MAX_LECTURE_7_9 = 20_000;
````

#### R2 — `regles.mjs:2172`, la raison du refus

Ancien :

````js
  "commande trop longue pour la garde (plus de 100 000 caractères) : elle est refusée plutôt que lue à moitié. Écris le texte long dans un fichier (git commit -F <fichier>, gh … --body-file <fichier>) ou découpe la commande.";
````

Nouveau :

````js
  "commande trop longue pour la garde (plus de 20 000 caractères) : elle est refusée plutôt que lue à moitié. Écris le texte long dans un fichier (git commit -F <fichier>, gh … --body-file <fichier>) ou découpe la commande.";
````

#### R3 — `regles.mjs:2264-2266`, `ajouts(code)` de `LECTURE_7_9`

Ancien :

````js
  /** Chaque ajout de la commande (`pnpm add`, `pnpm install <paquet>`) : `{ paquets, options }`. */
  function ajouts(code) {
    const commandes = code.replace(/\d*(>>?|<)&?\s*[^\s;&|]*/g, ' ').split(/[;&|\n]+/);
````

Nouveau :

````js
  /**
   * Chaque ajout de la commande (`pnpm add`, `pnpm install <paquet>`) : `{ paquets, options }`. Le `(?<!\d)` (ticket 48,
   * repris d'anchorpost) évite de relancer la recherche sur chaque chiffre d'une longue suite, sans changer le
   * remplacement : une redirection qui commencerait après un chiffre commence déjà sur lui (preuve : `regles.test.mjs`).
   */
  function ajouts(code) {
    const commandes = code.replace(/(?<!\d)\d*(>>?|<)&?\s*[^\s;&|]*/g, ' ').split(/[;&|\n]+/);
````

#### R4 — `CONTENU.md:13`, le plafond parmi ce qui reste hors de la lecture

Ancien :

````text
Restent hors de sa lecture : une commande de plus de 100 000 caractères, corps de here-doc compris, refusée sans être lue ;
````

Nouveau :

````text
Restent hors de sa lecture : une commande de plus de 20 000 caractères, corps de here-doc compris, refusée sans être lue (contournement : le texte long dans un fichier, `git commit -F <fichier>`, `gh … --body-file <fichier>`) ;
````

#### R5 — `CONTENU.md:13`, le coût de la lecture

Ancien :

````text
la lecture reste au carré sur des formes rares (accents graves ou `$(…)` répétés sans séparateur) : au-delà de 100 000 caractères de commande, la commande est refusée sans être lue (échec fermé), et le pire cas mesuré sous ce seuil est de 8,2 s.
````

Nouveau :

````text
les deux lectures restent au carré sur des formes rares (une option d'une lettre répétée sans fin de mot, des accents graves, `$(…)` ou `git push ` répétés) : au-delà de 20 000 caractères de commande, la commande est refusée sans être lue (échec fermé), et le pire cas mesuré sous ce seuil est de 1,2 s (une option d'une lettre répétée, `gh pr close 1 -ddd…!`).
````

### 2. La version

`.claude-plugin/plugin.json:3` : le troisième nombre de la version de `origin/main`, plus un (7.12.2 → 7.12.3 si rien n'a bougé ; règle de repli : décision 7).

## Surfaces

| Surface | Preuve |
| --- | --- |
| 20 000 caractères lus, 20 001 refusés sans lecture avec `RAISON_TROP_LONGUE` ; chacun des onze pires cas mesurés, à exactement 20 000 caractères, rend sa décision en moins de 10 s, et à 20 001 est refusé en moins de 1 s ; la raison dit « plus de 20 000 caractères » et le contournement par un fichier | `regles.test.mjs` « le plafond à 20 000 caractères : chaque pire cas mesuré se lit sous 10 s, et se refuse sans lecture à 20 001 » |
| le plafond compte le corps d'un here-doc : 20 003 caractères refusés, 19 999 lus | `regles.test.mjs` « A-51 ter : au-delà de 20 000 caractères, refus prudent, corps de here-doc compris » |
| le `(?<!\d)` rend le même remplacement (exhaustif jusqu'à 6 caractères), les mêmes décisions sur les redirections à chiffres, et la lecture de 7.9.x est linéaire sur une longue suite de chiffres | `regles.test.mjs` « ticket 48 : `ajouts(code)` de la lecture de 7.9.x ne relance pas sa recherche sur chaque chiffre, et rend le même remplacement » |
| les mesures de linéarité et le here-doc au cube restent lus, sous le plafond | `regles.test.mjs` « ticket 33, contre-relecture C1 … », « A-51 bis : la lecture de 7.9.x rend ce que rendait son motif de here-doc, sans son coût » |
| `CONTENU.md` dit 20 000, le contournement, 1,2 s, et plus 100 000 ni 8,2 s | `scripts/depot.test.mjs` « le plafond de la garde de commandes : CONTENU.md du socle de la chaîne dit 20 000 caractères, le pire cas mesuré et le contournement par un fichier » |
| le commentaire de `TAILLE_MAX_LECTURE_7_9` | lecture, en contre-revue (pas de test) |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"` |

## Vérification

Joué le 2026-11-16 dans un `git worktree` jetable de `d726a3c` (`TMPDIR` sous un dossier jetable), §§ 0 à 2 appliqués mot pour mot, puis le worktree retiré :

- Sur `d726a3c` sans rien : **662 sur 662**.
- Le banc du § 0 sur le texte de `d726a3c` : quatre `not ok` sur 84, ceux nommés au § 0.
- Banc, remplacements et version (7.12.3) : les deux fichiers du banc verts, 84 tests ; la suite entière : **665 sur 665** (662 + 3). Sous la charge de `pnpm test`, le test des pires cas prend 5,2 s pour ses onze formes.
- **Mutations**, chacune jouée seule sur le texte corrigé, puis le texte remis : chacune fait rougir au moins un test. Plafond à 20 001, à 19 999, à 100 000 ; `>=` au lieu de `>` ; contrôle du plafond retiré ; raison à 100 000 ; raison sans le contournement ; `(?<!\d)` retiré ; `(?<!\w)` au lieu de `(?<!\d)` ; `\d+` au lieu de `\d*` ; `CONTENU.md` à 100 000 (R4), sans le contournement, à 8,2 s, à 100 000 (R5), « 100 000 caractères » ajouté ailleurs ; dans le banc, le motif `APRES` en `(?<!\w)`. Seize sur seize.
- `git diff origin/main --stat` : les cinq fichiers de « Fichiers chauds », rien d'autre ; `git diff origin/main -- '*.test.mjs' | grep -c "^-.*assert"` : **5**, toutes du test de B3 : trois remplacées par leurs nouvelles tailles, deux (les accents graves à 50 000 caractères) reprises par le test des pires cas, à 20 000, sous la même borne.

Pour la session :

1. Le § 0 : quatre rouges. Les §§ 1 et 2, puis `pnpm install --frozen-lockfile && pnpm test` : vert, **le compte de `origin/main` plus 3**.
2. `git diff origin/main --stat` ne montre que les cinq fichiers de « Fichiers chauds ».
3. Revue de ticket (axes Règles, Ticket et Documentation), puis `/security-review` sur la branche ; leurs sections dans le corps de la PR.
4. La PR vise `main`, hors brouillon, **sans `à-fusionner`** (`Label: contre-revue`) ; la session écrit à l'architecte dès sa PR livrée. Elle part de `origin/main` et lit ce ticket sur la branche de documentation du programme, sans le modifier.

## Ce qui n'a pas été établi

- **Une forme pire que `gh pr close 1 -ddd…!`** : la recherche couvre les formes listées dans « Le besoin », pas toutes les commandes ; une forme cubique sous 20 000 caractères n'a pas été trouvée. Une forme plus coûteuse trouvée plus tard s'ajoute à `PIRES_CAS` ; si elle dépasse 2 s, le plafond descend.
- **Le temps sur une autre machine** : les chiffres sont ceux d'un poste de quatre cœurs ; la borne de 10 s du banc laisse une marge de huit.

## Hors périmètre

- **Le test « ticket 33 : le lecteur est linéaire — 30 000 lignes « cat <<EOF » non fermées »** : 300 000 caractères, refusés sans lecture dès le plafond de 100 000 ; il ne mesure plus la linéarité du lecteur. Le ramener sous le plafond est un ticket à part, s'il le faut.
- **Anchorpost** : il reprend la garde de `skills` à sa prochaine mise à niveau (SPEC_ALL_SOC-1.25), et son `(?<!\d)` local devient celui du plugin.
- **Les motifs quadratiques** : voir « Remèdes écartés ».

## Comments

- 2026-11-16 — Rédigé sur `d726a3c` (plugin 7.12.2, 662 tests) d'après le défaut relevé sur `a091baa` (7.12.0) par le rédacteur de SPEC_ALL_SOC-1.25 d'anchorpost, et la décision de l'architecte (plafond à 20 000, monotone ; `(?<!\d)` repris s'il est prouvé). Pires cas remesurés à 99 980 et à 20 000 caractères, recherche de formes à 20 000 : 1,2 s au pire, sous 2 s. `(?<!\d)` prouvé par lecture du motif et différentiel (aucun écart sur 4,4 millions de remplacements et 400 000 décisions). Joué sur une copie jetable : quatre rouges sur `main`, 665 tests avec le correctif, seize mutations rouges. Choix du rédacteur : (1) borne du banc à 10 s par forme, refus à 20 001 borné à 1 s ; (2) trois tests existants ramenés sous le plafond (décision 6) ; (3) `Label: contre-revue` et `/security-review`, la garde étant un chemin sensible.
