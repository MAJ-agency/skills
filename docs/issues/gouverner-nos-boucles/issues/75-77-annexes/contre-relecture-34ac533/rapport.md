# Contre-relecture de la PR 153 (tickets 75, 76, 77), tour 2

PR https://github.com/MAJ-agency/skills/pull/153, branche `claude/suites-relecteur`, **limitée au delta** entre le sommet du
tour 1 `5213463dfa2aeac7e573a6571c959b5d393a643e` et le sommet `34ac533203bf3b6849671ae23bd44b642724426e` (un commit, « fix(relecteur):
sans jq, le Relecteur s'arrête en 6, bancs de « de suite » et des sorties du capitaine (retouche du tour 1) »). Relue le
2026-11-22 par un relecteur neuf, sur un clone neuf, Node 22.23.5, git 2.43.0, machine partagée avec d'autres agents (charge
notée aux bords de chaque passe). Lecture seule : rien de poussé, aucun commentaire ni étiquette. Décisions du tour 1 : `A-203`
(spec, branche `claude/hopeful-lovelace-ouk6tz` à `d79b285`) ; rapport du tour 1 : `contre-relecture-5213463/rapport.md`.

## Verdict : non conforme au sommet `34ac533203bf3b6849671ae23bd44b642724426e`

Aucun bloquant, un écart **à corriger**, trois mineurs. Le code du delta est juste : sans `jq`, le Relecteur s'arrête en 6, la
cause dite ; une vraie panne de GitHub reste une sortie 5 (une pause), y compris un `gh` qui sortirait lui-même en 69 ; le banc
E1 n'est pas creux (C3, C4, C6 rouges sur lui seul, et deux mutations neuves) et tient en 13 s ; la note dit vrai pour
l'essentiel ; le capitaine en régime 7 n'est pas touché ; la CI de GitHub est verte (1 404 sur 1 404). L'écart est dans le banc
neuf « un poste sans `jq` » : il ajoute au PATH du jouet **le dossier** de `node`, et rougit donc sur tout poste où `node` et
`jq` partagent un dossier (un Node de distribution ou de NodeSource et `sudo apt install jq`, tous deux dans `/usr/bin` ; Homebrew
et `brew install jq`, tous deux dans `/opt/homebrew/bin`) : des postes que le README donne pour ceux des bancs. Sa retouche est
essayée (`retouches/retouche-t2-1-banc-sans-jq.patch`, un cas de banc, rouge avant, vert après).

Le delta est vérifié identique au patch `retouche-153-tour-1.patch` (sha256 `f52479a6…`) : même arbre (`49e4206…`), même
`patch-id` (`essais/delta-et-ci.txt`).

| # | Gravité | Objet |
| --- | --- | --- |
| 1 | **à corriger** | `skills/chaine/relecteur/scripts/relecteur.test.mjs`, ligne 601 : le PATH du cas « un poste sans `jq` » finit par `dirname(process.execPath)`. Quand `jq` est à côté de `node`, le cas rougit sur sa garde « jq absent du PATH du jouet » (joué : E9) ; et tout outil hors de `/usr/bin` et `/bin` sort du PATH (`flock` de Homebrew sous macOS : la passe sortirait en 6 pour `flock`, le motif attendu ne se lirait pas). Le README (ligne 191) donne pour les bancs « Node ≥ 22, `git` et `jq` (`sudo apt install jq` ou `brew install jq`) ». Rouge à tort, jamais vert à tort ; ni la CI ni les sessions cloud ne le voient |
| 2 | mineur | `verdict-du-capitaine.test.mjs`, ligne 448 : le `git` du jouet d'E1 lance `exec ${vrai} "$@"` sans citer le chemin ; un vrai git dont le chemin porte une espace rougit E1 seul (sortie 127 ; les cas voisins passent, E10). `JSON.stringify`, comme `outil('gh', …)` de `depot-jouet.mjs` |
| 3 | mineur | La note 8.0.1 : le titre neuf « **Un outil absent du poste est une panne** » est plus large que le fait (sans `gh`, ou avec un `jq` présent mais cassé, le Relecteur fait toujours une pause sans fin, E6 ; `gh` est la suite d'`A-203` point 3) ; et sans `jq`, `sujet.sh` sort en 69 comme `passer.sh`, que seul la note nomme |
| 4 | mineur | Le corps de la PR ne porte toujours pas « les trois journaux de mutations » qu'`A-203` point 1 met dans cette PR, et dit encore « 1402 tests » et « 27 rouges sur 27 » ; la retouche n'est écrite que dans un commentaire (1 404, 234). Hors du commit : question 2 |

## Les constats

### 1. À corriger — le banc « un poste sans `jq` » dépend du dossier de `node`

**Où.** `skills/chaine/relecteur/scripts/relecteur.test.mjs`, le cas « suite du lot 5 — un poste sans `jq` … », lignes 594 à 602 :
chaque entrée de `/usr/bin` et `/bin` en lien sauf `jq`, puis
`q.env.PATH = \`${join(q.racine, 'bin')}:${sansJq}:${dirname(process.execPath)}\``.

**Le scénario qui casse.** Le dossier de `node` porte aussi `jq` : Node ≥ 22 de NodeSource, de Fedora, d'Arch ou d'Alpine
(`/usr/bin/node`) avec `sudo apt install jq` (ou l'équivalent, `/usr/bin/jq`) ; Node et `jq` de Homebrew (`/opt/homebrew/bin`,
`/usr/local/bin` sur un Mac Intel) — deux des installations que le README nomme pour les bancs. Le PATH du jouet retrouve `jq`
par le dossier de `node`, et le cas rougit sur sa propre garde. Sous macOS, de plus, `flock` (que le Relecteur exige,
`sousVerrou`) n'existe que hors de `/usr/bin` et `/bin` (Homebrew) : sauf si `node` est dans le même dossier que lui, le PATH du
cas le perd, la passe sort en 6 pour « flock (util-linux) est requis », et le motif `github\.sh : un outil …` ne se lit pas (lu,
non joué : il faudrait masquer `/usr/bin/flock` du poste). Le défaut ne donne jamais un vert à tort, et la CI (`actions/setup-node`,
un dossier qui ne porte que Node) comme les sessions cloud (`/opt/node22/bin`) passent : il frappe le mainteneur qui joue
`pnpm test` sur son poste, avec un rouge qui accuse le code (« jq absent du PATH du jouet »).

**Preuve jouée** (`essais/e9-node-a-cote-de-jq.txt`) : le binaire de `node` copié dans un dossier où `jq` est en lien, puis le
seul cas joué par ce `node` : **rouge**, `error: 'jq absent du PATH du jouet'` ; le même cas par le `node` du poste : vert.

**La retouche** (`retouches/retouche-t2-1-banc-sans-jq.patch`, sur `34ac533`, `git apply --check` vert ; un fichier, le seul cas) :
`node` lui-même en lien (`process.execPath`), jamais son dossier ; puis chaque entrée de chaque dossier du PATH du banc, dans
l'ordre du PATH, sauf `jq` (un nom déjà vu n'est pas relié deux fois, un dossier illisible est passé) ; le PATH du jouet devient
`<jouet>/bin:<sans-jq>`. Le cas garde sa garde (`command -v jq` en échec) et ses exigences, mot pour mot.

| Essai (`essais/retouche-t2-1-rouge-vert.txt`, `essais/retouches-t2-apres.txt`) | Avant (`34ac533`) | Après (la retouche posée) |
| --- | --- | --- |
| le cas seul, `node` à côté de `jq` (E9) | **rouge** (« jq absent du PATH du jouet ») | vert |
| le cas seul, le `node` du poste | vert | vert |
| G1 (`sansOutil('github.sh', r)` retiré), `node` à côté de `jq` | — (le cas rougit sur sa garde, pour une autre raison) | **rouge** |
| G1 à G4 sur l'arbre retouché (`mutations/mutations-sur-retouches-t2.txt`) | — | 4 rouges sur 4 |
| les six bancs du tour 1 (234 cas) | 234 sur 234 | 234 sur 234 |

### 2. Mineur — E1 : le `git` du jouet ne cite pas le chemin du vrai

`verdict-du-capitaine.test.mjs`, ligne 448 : `exec ${vrai} "$@"`. Un vrai git dont le chemin porte une espace (un lien en tête du
PATH, `<tmp>/git avec espace/git`) : E1 sort en 127 dès le premier `git` (« expected: 3, actual: 127 ») ; les cas voisins du même
banc, sous le même PATH, passent (`essais/e1-seul-et-e10.txt`). Rare sous Linux et macOS ; la retouche est d'un mot
(`retouches/retouche-t2-2-git-du-jouet.patch` : `exec ${JSON.stringify(vrai)} "$@"`, la forme de `outil('gh', …)` dans
`depot-jouet.mjs`) ; après elle, E1 passe sous ce PATH (12,9 s).

### 3. Mineur — la note 8.0.1 : un titre plus large que le fait, `sujet.sh` tu

- Le titre de la puce passe de « Un calcul qui dit un outil absent du poste est une panne » à « **Un outil absent du poste est une
  panne** ». Ce n'est pas vrai de tout outil : sans `gh`, le Relecteur sort en 5 à chaque lecture et la veille fait une pause sans
  fin (E6, le même sur `5213463` : c'est la suite d'`A-203` point 3) ; un `jq` présent mais qui ne se lance pas (126, 127) donne la
  même pause, la cause dite « réponse qui n'est pas du JSON » (E6). Le corps de la puce, lui, dit exactement les deux cas.
- « Sans `jq`, `github.sh` sort en 69 dès son chargement, avant tout calcul : `passer.sh` s'arrête en 69, comme avant » : vrai, et
  `sujet.sh` aussi (il source `github.sh` à sa ligne 140 ; joué : `sujet.sh fusionner 80` sort en 69 sur le même message,
  `essais/capitaine-sans-jq.txt`).

Le reste de la note est vrai, phrase par phrase : la parenthèse des calculs (git plus ancien que 2.41 : `meme-contenu.sh` ligne
119 ; la grammaire introuvable : `double-relecture.mjs`), les sorties du capitaine (3, 3, 11 : E1) et du Relecteur (6), la pause
sans fin d'avant (E7 sur `5213463`), « Ce qu'un projet fait » (le Relecteur lit son script dans le plugin ; `github.sh` du projet
ne change pas : rien de plus à reposer). Retouche : `retouches/retouche-t2-3-note.patch` (le titre « Un calcul sorti en 69, ou
`jq` absent, est une panne » ; « `passer.sh` et `sujet.sh` s'arrêtent en 69 ») ; `scripts/depot.test.mjs` 69 sur 69 avec elle.
Si la PR 153 entre après la PR 152, la note se repose depuis la branche (`A-205` point 2) : la retouche suit.

### 4. Mineur — le corps de la PR

`A-203` point 1 range dans cette PR « les trois journaux de mutations dans le corps de la PR » (ticket 77, § 3). Lu sur GitHub au
sommet `34ac533` : le corps porte encore le seul compte (« 27 rouges sur 27 »), la suite « 1402 tests » et « Le commit porte
9 fichiers » ; la retouche (bancs 234, suite 1 404 en 727 s) n'est dite que dans un commentaire, et les journaux nulle part sur la
PR. Ce n'est pas le sommet : aucun patch ; question 2.

## Ce que le delta devait fermer, point par point

| Attendu (`A-203` point 1 et la consigne) | Tenu ? | Preuve |
| --- | --- | --- |
| Sans `jq`, `github.sh` sorti en 69 au chargement : `lire` s'arrête en 6 par `sansOutil('github.sh', r)`, la cause dite, rien d'écrit, la veille arrêtée | oui | le cas neuf (vert ici et en CI) ; E7 (régime 7 aussi : 6, « github.sh : un outil de la chaîne manque au poste (sortie 69) : ARRÊT : jq est requis … », `VEILLE ARRÊTÉE sortie 6`, aucune écriture ; sur `5213463` : 5, puis deux `PAUSE` et `VEILLE FINIE`) ; G1 à G4 rouges |
| Une vraie panne de GitHub reste 5 (pause, réessai), et seule la 69 de `github.sh` devient 6 | oui | E5 et E5b, exigés et verts : un 502, une réponse vide, un corps d'erreur `message`, une réponse qui n'est pas du JSON, et **un `gh` sorti lui-même en 69**, sur la liste des PR, sur la PR de `jouer` et sur ses commentaires : 5, la veille en `PAUSE` puis `VEILLE GESTE`, rien d'écrit. Par le code : `lire_github` (ligne 405) rend 0, 5 ou 64, quel que soit le code de `gh` ; `jq` ne sort qu'entre 0 et 5 ; sous `bash -c`, la seule 69 possible est la garde de la ligne 12 de `github.sh`, son seul `exit 69` (au plus un dans chacune des 20 versions de l'historique du fichier). J1 (« toute lecture en échec, 6 ») rougit trois cas existants qui tiennent la pause (« la veille … GitHub illisible est une pause », « R3 », « les événements de la PR ne se lisent pas ») et le cas neuf |
| `gh` absent ; `jq` présent mais cassé | inchangés : 5, pause sans fin | E6 (observé, identique sur `5213463`) : « gh en échec (code 127) » ; un `jq` à 127 ou 126 : « réponse qui n'est pas du JSON ». `gh` : suite d'`A-203` point 3 ; `jq` cassé : hors d'`A-192` (qui nomme « `jq` absent »), question 1 |
| La ligne de banc de « de suite » de `--attendre` | oui | `scripts/relecteur.test.mjs`, 11 sur 11 ; T12 rouge (0 s) |
| Le banc E1 : `passer.sh` en 3 aux deux contrôles, `sujet.sh fusionner` en 11, la cause dite, sans talon, en moins de 30 s, sans dépendance | oui | vert (12,6 s seul, 13,1 s dans le banc, charge 8 à 11) ; **non creux** : C3, C4, C6 (les mutations du tour 1, 3 lue 7) rouges sur E1 seul, et deux neuves, C8 (la sortie 3 sans sa cause) et C9 (`sujet.sh` lisant 3 comme 5, une reprise sans fin) rouges sur lui. Sans dépendance npm ; le `git` du jouet ne ment qu'à `git version` en premier argument, la forme exacte de `meme-contenu.sh` (ligne 116) : une autre forme ferait entrer la PR et rougirait E1 (`fusions` vide exigé), jamais un vert à tort ; la CI (git 2.56.1) le passe. Seule dépendance trouvée : un chemin de git à espace (mineur 2) |
| La note 8.0.1 corrigée (sans `jq`, `passer.sh` sort en 69) | oui, à deux phrases près | constat 3 |

## Le régime 7

- **Le capitaine.** Le delta ne touche aucun script du capitaine (son seul fichier côté `fusionner` est le banc
  `verdict-du-capitaine.test.mjs`, un cas de régime 8) : `A-186` point 1 n'est pas en jeu, et l'espion du tour 1 (21 bancs) vaut
  tel quel pour lui.
- **Le Relecteur.** La ligne neuve est dans `lire`, qui se joue avant que le régime d'une PR soit lu (`decision`, par PR) : à la
  différence de ce que l'espion établissait sur `5213463`, une ligne du delta s'exécute aussi en régime 7, à chaque lecture. Elle
  n'agit que sur une sortie 69 de `github.sh`. Joué (E7) : avec `jq`, la passe rend `hors-regime`, « régime 7 », rien d'écrit,
  comme sur `5213463` ; sans `jq`, un Relecteur lancé avant toute PR en régime 8 (`A-99` point 2) s'arrête en 6 au lieu de la
  pause sans fin. C'est le changement voulu, dans les deux régimes ; à savoir, rien à corriger.

## Les mutations

`mutations/mutations-t2.mjs`, sur un arbre propre du sommet, chacune seule, le fichier remis après ; le cas visé seul quand un
motif est nommé (`--test-name-pattern`) ; journal `mutations/mutations-t2.txt`, 17:28:34 → 17:32:48 UTC, charge 8,9 puis 10,8 ;
**11 rouges sur 11**, arbre propre après.

| Mutation | Banc (cas) | Issue |
| --- | --- | --- |
| C3 `passer.sh`, premier contrôle : 3 lue comme 21 (sautée en 7) | E1 seul | rouge (2 s) |
| C4 `sujet.sh juger_revue` : 3 lue comme 21 | E1 seul | rouge (11 s) |
| C6 `passer.sh`, second contrôle : 3 lue comme 21 | E1 seul | rouge (6 s) |
| C8 `passer.sh`, premier contrôle : la sortie 3 sans sa cause | E1 seul | rouge (2 s) |
| C9 `sujet.sh juger_revue` : 3 lue comme 5 (reprise au tour suivant) | E1 seul | rouge (10 s) |
| G1 `sansOutil('github.sh', r)` retiré | « un poste sans `jq` » | rouge (2 s) |
| G2 `sansOutil` après le test de la sortie 5 | « un poste sans `jq` » | rouge (2 s) |
| G3 la cause nommée d'un autre outil | « un poste sans `jq` » | rouge (1 s) |
| G4 la veille lit la sortie 6 comme une pause | « un poste sans `jq` » | rouge (2 s) |
| J1 toute lecture en échec, sortie 6 | banc du Relecteur entier | rouge (217 s, 4 cas) |
| T12 `--attendre` sans « de suite » | `scripts/relecteur.test.mjs` | rouge (0 s) |

Sur l'arbre des trois retouches du tour 2 : C3, C4, C6, G1 à G4, **7 rouges sur 7** (`mutations/mutations-sur-retouches-t2.txt`).

## La CI de GitHub sur `34ac533`

Lue, rien écrit (`essais/delta-et-ci.txt`) : run 45048933808 (`pull_request`, tête `34ac533`), **succès**, 17:20:57 → 17:35:05
UTC ; job « bancs » : 1 404 tests, 1 404 verts, 0 échec, annulé ni sauté, 828 s, git 2.56.1. CodeQL et les deux analyses : succès.

## Questions à l'architecte

1. **`jq` présent mais cassé** (E6) : la même pause sans fin que `gh` absent, et une cause qui accuse la réponse de GitHub. Ni
   `A-192` ni le delta ne le visent. **Recommandation** : l'ajouter à la suite d'`A-203` point 3 (`preparer` lance `gh --version` et
   `jq --version` et sort en 6 sur un échec, comme `sousVerrou` pour `flock`) ; pas dans cette PR.
2. **Le corps de la PR** (constat 4) : `A-203` point 1 y met les trois journaux de mutations. **Recommandation** : que la session les
   y écrive avant la fusion (ceux des annexes des tickets, ou le journal du tour 1 `mutations-r153.txt`, qui couvre les 35), avec le
   compte de la retouche (1 404), plutôt que de lever l'exigence.
3. **La retouche 1 dans cette PR, ou une suite ?** **Recommandation : dans cette PR** — un seul cas de banc, aucun code, rouge avant
   et vert après sur un poste qui suit le README ; une suite laisserait `pnpm test` rouge à tort sur ces postes dès 8.0.1. Les
   mineurs 2 et 3 avec elle, si elle entre (un mot ; deux phrases de la note).

## Ce qui a été joué

Clone neuf de `https://github.com/MAJ-agency/skills`, `claude/suites-relecteur` à `34ac533`, `claude/hopeful-lovelace-ouk6tz` à
`d79b285` ; `pnpm install --frozen-lockfile` ; un arbre de travail par usage (sommet ; mutations ; essais ; `5213463` pour
comparer ; retouches). Pas de `graphify-out/graph.json` dans le clone : aucune requête graphify. Rien n'a touché le dépôt de
référence ni GitHub en écriture.

- **Le delta** relu en entier (6 fichiers, 78 lignes ajoutées, 5 retirées), contre `A-203`, `A-192` point 1, `A-197` point 1,
  `A-186` point 1, `A-99` point 2 et le rapport du tour 1 ; vérifié identique au patch `f52479a6…` (arbre et `patch-id`).
- **Le code autour** : `lire`, `sansOutil`, `preparer`, `ecrire`, `veille` (`relecteur.mjs`) ; `lire_github` et la garde de `jq`
  (`github.sh`, et le compte de ses `exit 69` dans l'historique) ; les branches de la revue dans `passer.sh` et `juger_revue`
  (`sujet.sh`) ; le `git version` de `meme-contenu.sh` ; le PATH du jouet (`depot-jouet.mjs`) ; le README.
- **Les six bancs du tour 1** au sommet (`essais/bancs-34ac533.txt`) : **234 sur 234**, 189 s, 17:26:15 → 17:29:24 UTC, charge
  2,3 puis 9,8.
- **Les essais** (`essais/relecteur-t2.ajout.mjs`, ajoutés à la fin du banc du Relecteur par `essais/jouer-t2.sh` puis retirés ;
  `essais/essais-t2.txt`, 17:29:56 → 17:30:45 UTC, charge 9,5 puis 10,6) : E5 et E5b exigés, verts sur `34ac533` et sur
  `5213463` ; E6 et E7 observés sur les deux. E9 (`node` à côté de `jq`), E1 seul et E10 (git à espace), le capitaine sans `jq`
  (`essais/capitaine-sans-jq.txt`).
- **Les mutations** : 11 sur le sommet, 7 sur l'arbre retouché (ci-dessus).
- **Les retouches** : les trois patchs sur `34ac533` (`git apply --check` verts, seuls et ensemble ; `retouches/SHA256SUMS`) ; la
  retouche 1 rouge avant, verte après (E9) ; les trois posées, E10 vert et les six bancs **234 sur 234**, 227 s, 17:34:31 →
  17:38:31 UTC, charge 11,2 puis 11,5 (`essais/retouches-t2-apres.txt`).
- **La CI** et le corps de la PR lus sur GitHub.

## Ce qui n'a pas été établi

1. **Un vrai poste où `node` et `jq` partagent un dossier**, et un vrai macOS : simulés par une copie de `node` à côté d'un lien
   vers `jq` (E9). La perte de `flock` sous macOS est lue, pas jouée (il faudrait masquer `/usr/bin/flock` du poste).
2. **La suite entière** sur `34ac533` : non rejouée (CI et session : 1 404 sur 1 404) ; sur l'arbre retouché, les six bancs seuls.
3. **L'espion du régime 7** : non rejoué ; le delta ne touche aucun script du capitaine, et E7 joue le Relecteur en régime 7.
4. **Une session Sonnet** devant la sortie 6 « github.sh : un outil de la chaîne manque au poste (sortie 69) » : non jouée. La
   ligne 6 de `relecteur/SKILL.md` range « `jq` absent » sous « un calcul dit … » ; c'est `github.sh` qui le dit, mais le geste
   écrit (l'architecte, et s'arrêter) est celui de toute sortie 6.
5. **Un vrai poste sans `jq`, sans `gh`, ou à `jq` cassé** : simulés par le jouet (un PATH en liens ; un `jq` qui sort en 126 ou
   127).
