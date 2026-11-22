# Contre-relecture de la PR 153 (tickets 75, 76, 77), tour 3

PR https://github.com/MAJ-agency/skills/pull/153, branche `claude/suites-relecteur`, **limitée au delta** entre le sommet du
tour 2 `34ac533203bf3b6849671ae23bd44b642724426e` et le sommet `e20d490b4208836ad19a8f6a5bf9dbe2cecae66a` (un commit, « test(relecteur):
le banc sans jq ne dépend plus du dossier de node, note précisée (retouche du tour 2) », trois fichiers). Relue le 2026-11-22 par
un relecteur neuf, sur un clone neuf, Node 22.23.5, git 2.43.0, charge entre 1,3 et 2,3 sur toute la relecture. Lecture seule :
rien de poussé, aucun commentaire ni étiquette. Décisions du tour 2 : `A-207` (spec, branche `claude/hopeful-lovelace-ouk6tz`) ;
rapport du tour 2 : `contre-relecture-34ac533/rapport.md`.

## Verdict : conforme au sommet `e20d490b4208836ad19a8f6a5bf9dbe2cecae66a`

Aucun bloquant, aucun écart à corriger, deux mineurs, tous deux hors de l'arbre. Le delta est **identique** au patch du tour 2
`retouche-153-tour-2.patch` (sha256 `4160c141…`) : même arbre (`bfc9605c…`), même `patch-id` (`07717cb1…`) (`essais/delta.txt`).
Ce qu'`A-207` demandait est tenu :

- le banc « un poste sans `jq` » relie `node` lui-même, plus son dossier : vert là où `jq` partage le dossier de `node` (E9, E9b),
  et là où `flock` n'est que hors des dossiers système, comme sous macOS avec Homebrew (E11), alors que `34ac533` y rougit sur sa
  garde ; il rougit toujours quand la garde de `lire` disparaît (G1, sous les quatre postes simulés) ; G1 à G4 et J1 rouges ;
- le `git` du jouet d'E1 cite son chemin : E1 vert sous un git à espace (E10) et sous un git à guillemet et contre-oblique (E10b),
  rouge sur `34ac533` (127, puis 2) ; C3, C4, C6, C8, C9 restent rouges sur E1 ;
- la note 8.0.1 : le titre « Un calcul sorti en 69, ou `jq` absent, est une panne » dit exactement les deux cas du corps ;
  « `passer.sh` et `sujet.sh` s'arrêtent en 69, comme avant » est vrai (`sujet.sh` source `github.sh` à sa ligne 140, avant tout
  aiguillage ; son en-tête dit « 69 jq absent du poste ») ;
- le corps de la PR porte les comptes à jour (bancs 234, suite 1 404 au sommet `e20d490`) et les trois journaux de mutations des
  tickets 75, 76 et 77 (10 + 6 + 11 = 27 lignes `ROUGE`, trois « toutes rouges ») : lu par l'outil GitHub, en lecture ;
- les six bancs : 234 sur 234 ; la CI de GitHub sur `e20d490` : 1 404 sur 1 404.

| # | Gravité | Objet |
| --- | --- | --- |
| 1 | mineur | Le corps de la PR dit « Le commit porte 9 fichiers ; la retouche du tour 2 ajoute un commit » : la PR a trois commits, la retouche du tour 1 (`34ac533`, six fichiers) n'y est pas nommée |
| 2 | mineur | Le commit `e20d490` n'a pas les deux lignes d'attribution (`Co-Authored-By`, `Claude-Session`) que portent `5213463` et `34ac533` |

## Les constats

### 1. Mineur — le corps de la PR tait le commit du tour 1

Lu sur GitHub (outil GitHub, `pull_request_read`, en lecture) : « Les sha256 des trois patchs sont ceux des tickets. Le commit porte
9 fichiers ; la retouche du tour 2 ajoute un commit (`NOTES-DE-VERSION.md` et les deux bancs du Relecteur et du capitaine). » La
PR compte trois commits (`5213463`, 9 fichiers ; `34ac533`, retouche du tour 1, 6 fichiers ; `e20d490`, retouche du tour 2,
3 fichiers). Le reste du corps est juste : les comptes (234, 1 404 en 914 s au sommet `e20d490`, que la CI confirme : 1 404 sur
1 404), les journaux. Ce n'est pas le sommet : aucun patch. Texte proposé :

> Le premier commit porte 9 fichiers ; la retouche du tour 1 (`34ac533`) en touche 6, celle du tour 2 (`e20d490`) 3
> (`NOTES-DE-VERSION.md` et les deux bancs du Relecteur et du capitaine).

### 2. Mineur — le commit `e20d490` sans ses lignes d'attribution

`git log --format=%B` : `5213463` et `34ac533` finissent par `Co-Authored-By: …` et `Claude-Session: …` ; `e20d490` n'a que son
titre. Sans effet sur l'arbre ni sur un banc ; à reprendre au message du squash si la fusion en fait un.

## Ce que le delta devait fermer, point par point

| Attendu (`A-207` et la consigne) | Tenu ? | Preuve |
| --- | --- | --- |
| Le banc « un poste sans `jq` » relie `node` lui-même, plus le dossier de `node` dans le PATH du jouet | oui | lu : `symlinkSync(process.execPath, …/node)`, puis chaque entrée des dossiers absolus du PATH du banc, dans l'ordre, sauf `jq` et `node`, un nom vu n'est pas relié deux fois ; `q.env.PATH = <jouet>/bin:<sans-jq>`. Le PATH d'origine du jouet étant `<jouet>/bin:$PATH` (`depot-jouet.mjs` ligne 132), le jouet garde ses outils et l'ordre du poste, `jq` en moins |
| Il ne rougit plus à tort là où `jq` partage le dossier de `node` | oui | `essais/e9-e11.txt` : E9 (la forme du tour 2 : `node` copié à côté d'un lien vers `jq`), E9b (ce dossier en tête du PATH) et E11 (un PATH de deux dossiers, « brew » : `node`, `jq`, `flock`, puis « système » sans eux) **verts** sur `e20d490` ; sur `34ac533`, E9, E9b et E11 **rouges** sur la garde « jq absent du PATH du jouet » ; E0 (le poste) vert sur les deux |
| Il rougit toujours si la garde de `lire` disparaît | oui | G1 (`sansOutil('github.sh', r)` retiré) **rouge** sous E0, E9, E9b et E11 (« expected: 6, actual: 5 ») ; G1 à G4 et J1 de `mutations-t2.mjs`, rejouées sans changement : **5 rouges sur 5** (`mutations/mutations-t3.txt`) |
| Le `git` du jouet d'E1 cite son chemin | oui | `exec ${JSON.stringify(vrai)} "$@"` ; `essais/e10.txt` : E1 vert sous le poste, sous un git à espace et sous un git à guillemet et contre-oblique ; sur `34ac533`, rouge sous les deux derniers (127, 2). E1 non creux : C3, C4, C6, C8, C9 **5 rouges sur 5** (`mutations/mutations-t3-e1.txt`) |
| La note 8.0.1 : titre plus étroit, `sujet.sh` en 69 comme `passer.sh` sans `jq` | oui | constat 3 du tour 2 fermé mot pour mot (texte de `retouche-t2-3-note.patch`) ; `scripts/depot.test.mjs` vert dans les six bancs |
| Le corps de la PR : les comptes à jour, les trois journaux de mutations | oui, une phrase près | lu sur GitHub ; constat 1 |

## Ce qui a été joué

Clone neuf de `https://github.com/MAJ-agency/skills`, `git fetch origin claude/suites-relecteur claude/hopeful-lovelace-ouk6tz`,
`pnpm install --frozen-lockfile` ; un arbre de travail par usage (le sommet ; un pour les mutations ; `34ac533` pour comparer).
Pas de `graphify-out/graph.json` dans le clone : aucune requête graphify. Rien n'a touché le dépôt de référence ni GitHub en
écriture.

- **Le delta** relu en entier (3 fichiers, 21 lignes ajoutées, 8 retirées), contre `A-207` et le rapport du tour 2 ; vérifié
  identique au patch `retouche-153-tour-2.patch` (`essais/delta.txt`). Le code autour : le PATH du jouet (`depot-jouet.mjs`),
  `lire`, `sansOutil` et `sousVerrou` (`flock`) de `relecteur.mjs`, la garde de `jq` (`github.sh` ligne 12), le chargement de
  `github.sh` par `sujet.sh` (ligne 140) ; les imports du banc (`existsSync` et `dirname` restent servis).
- **Les essais** (`essais/e9-e11.sh`, `essais/e10.sh`, journaux `essais/e9-e11.txt`, 18:02:53 → 18:03:14 UTC, et `essais/e10.txt`,
  18:05:35 → 18:06:01 UTC) : E0, E9, E9b, E11 sur `e20d490`, puis G1 posée, puis sur `34ac533` ; E1, E10, E10b sur `e20d490` et
  `34ac533`.
- **Les mutations** (`mutations/mutations-t2.mjs`, le script du tour 2 recopié sans changement, sur un arbre propre du sommet,
  chacune seule, le fichier remis après) : G1 à G4 et J1, 18:03:25 → 18:05:24 UTC, **5 rouges sur 5** (J1 : 4 cas rouges, dont les
  trois qui tiennent la pause d'une vraie panne de GitHub) ; en plus de la consigne, C3, C4, C6, C8, C9 sur E1, 18:06:07 →
  18:06:25 UTC, **5 rouges sur 5** ; arbre propre après chacun.
- **Les six bancs** au sommet (`essais/bancs-e20d490.txt`) : `verdict-du-capitaine.test.mjs`, `skills/chaine/relecteur/scripts/relecteur.test.mjs`,
  `scripts/relecteur.test.mjs`, `scripts/depot.test.mjs`, `scripts/points-d-entree.test.mjs`, `scripts/bascule.test.mjs` :
  **234 sur 234**, sortie 0, 113 s, 18:06:34 → 18:08:27 UTC, charge 1,5 puis 2,3.
- **La CI de GitHub** sur `e20d490`, lue : job « bancs » succès, 18:00:11 → 18:13:17 UTC, git 2.56.1, **1 404 sur 1 404**, 0 échec,
  annulé ni sauté ; CodeQL et les deux analyses : succès (`essais/delta.txt`).
- **Le corps et les commentaires de la PR**, lus par l'outil GitHub.

## Ce qui n'a pas été établi

1. **Un vrai poste** où `node` et `jq` partagent un dossier, et un vrai macOS : simulés par des copies de `node` et des liens (E9,
   E9b, E11). E11 tient `flock` hors des dossiers système ; un poste sans aucun `flock` n'est pas en jeu (le Relecteur l'exige).
2. **La suite entière** : non rejouée, comme demandé (la session : 1 404 sur 1 404 en 914 s ; la CI : 1 404 sur 1 404).
3. **Un chemin de git qui porte `$` ou un accent grave** : non joué. `JSON.stringify` cite l'espace, le guillemet et la
   contre-oblique (E10, E10b), pas `$` ni l'accent grave, que `sh` interprète entre guillemets doubles ; c'est la forme de
   `outil('gh', …)` dans `depot-jouet.mjs`, et un tel chemin est hors de tout poste ordinaire : à savoir, rien à corriger.
4. **Les essais E5 à E7 du tour 2** (vraie panne de GitHub, `gh` absent, régime 7) : non rejoués ; le delta ne touche ni
   `relecteur.mjs` ni aucun script du capitaine, et J1 tient la pause d'une vraie panne.
