# La demande `À relire` est fabriquée par un script, jamais tapée : le sommet lu par git, les deux champs vérifiés

Status: Fait — PR 176 (`c15f90a`, plugin 8.9.0)
Type: défaut
Modèle: sonnet — un script court et son banc, un message de `github.sh` et son banc, une entrée de banc des points d'entrée, deux lignes de texte du skill `fusionner` ; l'interface, les sorties et la règle des champs sont fixées par les décisions `A-234`, `A-235` et `A-241` (3) et (4). Les textes qui nomment la commande et la lecture de l'état d'une fille sont le ticket 104. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 96
Dépendances: —
Fichiers chauds: **neufs** `skills/chaine/fusionner/scripts/demande.mjs` et `demande.test.mjs` ; `skills/chaine/fusionner/SKILL.md` (ligne 16) et `references/CONTENU.md` (après la section des lignes 61 à 64) ; `skills/chaine/fusionner/scripts/github.sh` (`DEMANDE_DE_RELECTURE`, lignes 448 à 452) et `messages-du-regime.test.mjs` (lignes 14 à 25, 48, 76, 97) ; `scripts/points-d-entree.test.mjs` (`SCRIPTS`, lignes 18 à 31) ; `scripts/bascule.test.mjs` (ligne 225) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Le ticket 96 touche l'étape 5 de `chaine-de-production.md`** et `decision-relecteur.mjs` : il passe d'abord, d'où `Blocked by: 96`. Le ticket 104 (les textes) suit celui-ci (`Blocked by: 101`) et touche `scripts/bascule.test.mjs` à d'autres lignes (81, 87, 113, 207, 218). Les tickets 100 et 102 suivent 104. **Le ticket de suite du constat (4)** (famille `fusionner`, `renvoyer.sh` lit l'auteur sur la demande), pas encore écrit, touchera sans doute `github.sh` et `messages-du-regime.test.mjs` : il part après celui-ci.

## Le besoin

Deux constats de l'essai réel du régime 8 (journal de la carte et l'entrée « Fin de l'essai réel du régime 8 »).

1. **Constat (8)** (2026-11-23, 20 h 18 UTC). Sur la PR #13 du jouet, le conducteur a écrit une première demande `À relire` au sha faux, « complété de tête depuis un sha court », puis une seconde, juste. Le sha entier de 40 caractères se tape à la main aujourd'hui partout où une session demande sa relecture.
2. **Constat (14), seconde moitié** (2026-11-22, 17 h 33 UTC, PR 2 du jouet). La demande du conducteur sur sa propre PR portait `Session: moi — Conducteur: —`, « moi » écrit tel quel (`A-235`). « moi » n'est pas un identifiant de session, mais la forme que lit le Relecteur l'accepte (`ID`, `decision-relecteur.mjs:48`), et ses lignes partiraient vers une session qui n'existe pas.

La première moitié du constat (14) (le conducteur a écrit à une fille archivée avant de lire son état, `A-236`) est au ticket 104, avec les textes (`A-241` (3)).

Le besoin : **une demande `À relire` est la sortie d'un script** ; le sommet vient de git, jamais du clavier ; les deux champs sont des identifiants de session ou `—`, selon une règle que le script tient ; la forme de la demande ne s'écrit plus qu'une fois, dans le script, et `github.sh` nomme la commande.

## La cause, à la source (`main` à `b57eae7`, plugin 8.5.0)

1. Aucun script ne fabrique la demande. Le message des renvois et de `sujet.sh demarrer` en donne la forme et laisse la session la remplir : `github.sh:452` (`DEMANDE_DE_RELECTURE`, repris par `renvoyer.sh:37`, `:45` et `sujet.sh:443`), « le sha entier (40 caractères) du dernier push, ton id de session, celui de ton conducteur ». Les textes des skills font de même (ticket 104).
2. `decision-relecteur.mjs:48` : `ID` vaut `[A-Za-z0-9][A-Za-z0-9_-]*` ; `FORME_DEMANDE` (`:51`) accepte tout `ID`, « moi » compris. Le lecteur est voulu tolérant ; le contrôle manque à l'écriture.

## Quand le ticket est fait

1. `node scripts/chaine/demande.mjs --session <id|—> --conducteur <id|—>` écrit sur sa sortie une ligne, `À relire — sommet <sha> — Session: <…> — Conducteur: <…>`, sort en 0, et `<sha>` est `git rev-parse HEAD`.
2. Sans `--branche`, il refuse (sortie 1, cause dite) une tête détachée (`git symbolic-ref --short -q HEAD` en échec), une branche absente d'`origin`, ou une tête locale autre que celle d'`origin` (`git ls-remote --exit-code origin refs/heads/<branche>`) : la demande ne nomme qu'un sommet poussé.
3. Avec `--branche <nom>`, le sommet est la tête de cette branche sur `origin` (`git ls-remote`), quelle que soit la branche courante : c'est le cas du conducteur qui pose la demande d'une fille finie, et de l'architecte pour la PR d'une personne ; une branche absente d'`origin` sort en 1.
4. `--session` et `--conducteur` sont exigés tous deux. Chacun vaut un identifiant `session_<lettres et chiffres>` (`^session_[A-Za-z0-9]+$`) ou `—` (`-` accepté, écrit `—`) ; autre chose (« moi », vide, une URL, `session_` seul) sort en 2. Les options se lisent avant tout appel à `git` : sans argument, sortie 2 et l'usage, même hors d'un dépôt.
5. Deux identifiants `session_…` égaux sortent en 2, avec la cause « l'auteur qui conduit écrit `--conducteur —` » (`A-235`). `—` aux deux champs est permis et sort en 0 : c'est la PR d'une personne, dont l'architecte pose la demande (`A-241` (4)).
6. `git` ne lit pas `origin` (`git ls-remote` en échec, hors la sortie 2 de `--exit-code`, qui dit la branche absente) : sortie 12, comme le Relecteur (`relecteur/SKILL.md`, table des sorties).
7. La ligne écrite est lue comme une demande par `lireMarques` de `decision-relecteur.mjs`, avec le même sommet et les mêmes champs (`—` lu `null`), pour les quatre combinaisons de champs permises : `session_auteur` et `session_conducteur` ; `session_auteur` et `—` ; `—` et `session_conducteur` ; `—` et `—`.
8. Le script se lance de partout (`scripts/points-d-entree.test.mjs` : direct, lien, dossier à espace ou à accent).
9. `DEMANDE_DE_RELECTURE` nomme la commande et ses arguments, sans la forme ; `messages-du-regime.test.mjs` prouve que le message nomme la commande et que la ligne que la commande rend est lue comme une demande.
10. `fusionner/SKILL.md:16` pose `scripts/demande.mjs` sous `scripts/chaine/` ; `CONTENU.md` a sa section.
11. La note de version dit le script, et qu'un projet repose `fusionner` pour l'avoir sous `scripts/chaine/` : `github.sh` et `demande.mjs` se posent ensemble, le message des renvois ne nomme donc jamais un script absent.

## Où

| Fichier (lignes sur `main` à `b57eae7`) | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/demande.mjs` (neuf) | une fonction pure `demande({ sommet, session, conducteur })` qui rend la ligne ou lève l'erreur d'appel, exportée, seul endroit qui écrit la forme ; le point d'entrée (lecture des options d'abord, puis `git rev-parse HEAD`, `git symbolic-ref --short -q HEAD`, `git ls-remote --exit-code origin refs/heads/<b>` ; sorties 0, 1, 2, 12). Modèle d'un point d'entrée qui se reconnaît : `skills/chaine/fusionner/scripts/double-relecture.mjs` (cité par `points-d-entree.test.mjs:28`) |
| `skills/chaine/fusionner/scripts/demande.test.mjs` (neuf) | cas 1 à 7, sur un dépôt jouet à `origin` (`depotJouet`, `skills/chaine/sujet/scripts/depot-jouet.mjs:112`, chargé comme `messages-du-regime.test.mjs:9-11`) ; le script se lance par son chemin (`script("fusionner", "demande.mjs")`, `depot-jouet.mjs:58`), sans l'ajouter à `CHAINE` (`:93`) ; le cas 7 importe `lireMarques` sans toucher `decision-relecteur.mjs` |
| `skills/chaine/fusionner/SKILL.md:16` | `scripts/demande.mjs` dans la liste posée sous `scripts/chaine/` |
| `skills/chaine/fusionner/references/CONTENU.md`, après `:61-64` | une section `## scripts/demande.mjs` : l'interface, les sorties, la règle des champs, et que la session copie la sortie dans `add_issue_comment` |
| `skills/chaine/fusionner/scripts/github.sh:448-452` | le commentaire d'en-tête dit que la forme vit dans `demande.mjs` ; `DEMANDE_DE_RELECTURE` devient (valeur exacte) : ``le commentaire que rend `node scripts/chaine/demande.mjs --session <ton id de session> --conducteur <celui de ton conducteur, — sans conducteur>`, copié tel quel, seul dans son commentaire (le script lit le sommet dans git et refuse un sommet non poussé)`` |
| `skills/chaine/fusionner/scripts/messages-du-regime.test.mjs:16` | `DEMANDE` prend la valeur exacte du message neuf |
| `messages-du-regime.test.mjs:17-25` | `demandeLue` : la commande trouvée dans le texte (`` /`node scripts\/chaine\/demande\.mjs --session <[^>]+> --conducteur <[^>]+>`/ ``) ; puis, pour `session_conducteur` et `—`, la ligne que rend `demande({ sommet: "a".repeat(40), session: "session_auteur", conducteur })`, importée de `demande.mjs`, lue par `lireMarques` comme une demande |
| `messages-du-regime.test.mjs:48` | rien à écrire : l'expression suit `DEMANDE` |
| `messages-du-regime.test.mjs:76` | la forme écrite en dur dans le message de `renvoyer.sh` devient (valeur exacte) : `` /la nouvelle PR demande sa relecture, le commentaire que rend `node scripts\/chaine\/demande\.mjs --session <ton id de session> --conducteur <celui de ton conducteur, — sans conducteur>`, copié tel quel, seul dans son commentaire .* ; puis l'étiquette `à-relire`, jamais `à-fusionner`/ `` |
| `messages-du-regime.test.mjs:97` | **inchangé, vérifié** : `demander la relecture : le commentaire .* ;` tient sur le message neuf, qui commence encore par « le commentaire » et ne contient aucun saut de ligne ; seul l'appel `demandeLue(r.stdout)` (`:99`) change de sens |
| `scripts/points-d-entree.test.mjs:18-31` | une entrée `{ nom: "demande", fichier: "skills/chaine/fusionner/scripts/demande.mjs", args: [], statut: 2, sortie: /usage : node demande\.mjs/ }` |
| `scripts/bascule.test.mjs:225` | l'assertion devient : `github.sh` contient `node scripts/chaine/demande.mjs --session` et ne contient plus `À relire — sommet <sha>` (message : « github.sh : la commande, jamais la forme ») ; le commentaire de `:224` le dit |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante, la note |

Règles à lire : `chaine-de-production.md` § 5, étape 5 ; `relecteur/SKILL.md`, « Les lignes » ; `decision-relecteur.mjs:9-31` (l'en-tête : ce que lit le Relecteur).

## Décisions

Décidées le 2026-11-27 par l'architecte : **`A-234`**, **`A-235`** et **`A-241`** (3) et (4) (spec `relecture-independante.spec.md`). Ce qui suit les applique ; rien n'y est à trancher.

1. **`A-234` — Le script de la demande.** `skills/chaine/fusionner/scripts/demande.mjs`, posé par `fusionner` sous `scripts/chaine/demande.mjs`, comme `decision-relecteur.mjs` dont il suit la forme. Interface : `--session <id|—>`, `--conducteur <id|—>`, tous deux exigés ; `--branche <nom>` facultatif. Sorties : 0 la ligne ; 1 un sommet non poussé, une tête détachée ou une branche absente d'`origin` ; 2 un appel mal formé ; 12 `origin` illisible. Il n'écrit rien sur GitHub : la session copie sa sortie dans `add_issue_comment` (en cloud, `gh` n'est pas authentifié). Le sha ne passe plus par la mémoire de la session ; le contrôle « poussé » est celui que l'étape 5 demande déjà (`git ls-remote origin <branche>` = `HEAD`), fait par la machine. Le lecteur, `FORME_DEMANDE` (`decision-relecteur.mjs:51`), ne change pas : une demande d'une personne y reste lisible.
2. **`A-235` — Les deux champs.** `Session:` est l'identifiant de la session qui écrit la demande, lu par `get_session` sans argument, comme `CAPITAINE_ID` (`fusionner/SKILL.md:71`) ; `—` pour une demande posée à la place d'une session finie (le conducteur pour sa fille) ou d'une personne (l'architecte). `Conducteur:` est le conducteur du chantier quand il n'est pas l'auteur ; **`—` quand l'auteur est le conducteur lui-même, ou hors chantier** (`A-196`, point 1, tient). « moi », vu tel quel sur l'essai, et deux identifiants égaux sont refusés : sur sa propre PR, les lignes du Relecteur arrivent au conducteur par `Session:` (`decision-relecteur.mjs:384-385`, `auxDeux`), et son identifiant aux deux champs le réveillerait deux fois pour chaque ligne.
3. **`A-241` (3) — La coupe.** Ce ticket est le script (posé, donc le deuxième chiffre de la version) ; le ticket 104, `Blocked by: 101`, porte les textes qui nomment la commande et la lecture de l'état d'une fille (`A-236`). La forme de la demande ne s'écrit plus qu'une fois, dans le script ; `github.sh` comme les textes nomment la commande.
4. **`A-241` (4) — Les combinaisons.** Deux identifiants `session_…` égaux sortent en 2 ; `—` aux deux champs est permis (la PR d'une personne, posée par l'architecte). La forme `session_<lettres et chiffres>` est une hypothèse, que le banc tient (« Ce qui n'a pas été établi »).
5. **Hors chantier, une session de ticket** (`lancement.md`, « La session d'un ticket hors chantier ») écrit `--conducteur —` : elle suit l'étape 5, en lisant « l'architecte » pour « le conducteur », et l'architecte n'est pas le conducteur. Les textes qui le disent sont au ticket 104.
6. **La version** : la suivante de `main` au moment de livrer, **au deuxième chiffre** (8.6.0 si `main` est encore en 8.5.x) : un script est posé, les projets reposent `fusionner`.

## À faire, dans l'ordre

1. Partir de `main` à jour, le ticket 96 fusionné : `git fetch origin main`, une branche neuve depuis `origin/main` ; relire chaque ligne citée ici.
2. **Les bancs d'abord, vus rouges** : `demande.test.mjs` (le script absent : tous rouges), l'entrée de `points-d-entree.test.mjs`, `messages-du-regime.test.mjs` (`:16`, `demandeLue`, `:76`), `scripts/bascule.test.mjs:225`.
3. `demande.mjs`, puis `github.sh:448-452`.
4. `fusionner/SKILL.md:16`, `CONTENU.md`.
5. Les bancs verts ; les mutations ; la version et la note ; la suite entière.

## Surfaces

| Surface | Preuve |
| --- | --- |
| la ligne écrite, sommet = `git rev-parse HEAD`, sortie 0 | `demande.test.mjs`, cas 1 ; M1 |
| un sommet non poussé, une tête détachée, une branche absente d'`origin` : sortie 1 | `demande.test.mjs`, cas 2 ; M2 |
| `--branche` lit la tête d'`origin`, pas `HEAD` | `demande.test.mjs`, cas 3 ; M3 |
| un champ hors forme (« moi », vide, `session_` seul) ou absent : sortie 2 | `demande.test.mjs`, cas 4 ; M4 |
| deux identifiants égaux : sortie 2, la cause dite ; `—` aux deux champs : sortie 0 | `demande.test.mjs`, cas 5 ; M5, M7 |
| `origin` illisible : sortie 12 | `demande.test.mjs`, cas 6 |
| la ligne se lit comme une demande, quatre combinaisons | `demande.test.mjs`, cas 7 ; M6 |
| le script agit par tout chemin de lancement | `scripts/points-d-entree.test.mjs`, entrée `demande` |
| le message des renvois et de `demarrer` nomme la commande, dont la ligne se lit comme une demande | `messages-du-regime.test.mjs:48`, `:76`, `:97-99` ; M8 |
| `github.sh` nomme la commande, jamais la forme | `scripts/bascule.test.mjs:225` ; M9 |

## Mutations

Toutes rouges :

- M1 : le sommet pris à `HEAD~1`, ou tronqué à 39 caractères.
- M2 : le contrôle « poussé » retiré.
- M3 : `--branche` ignoré (le sommet reste `HEAD`).
- M4 : la forme des champs élargie à tout `ID` (« moi » passe).
- M5 : le refus des deux identifiants égaux retiré.
- M6 : le tiret long écrit `-` dans la ligne (le lecteur ne la lit plus comme une demande).
- M7 : le refus étendu à `—` aux deux champs (la PR d'une personne refusée).
- M8 : `DEMANDE_DE_RELECTURE` remis à la forme (`messages-du-regime.test.mjs` ne trouve plus la commande).
- M9 : la forme ajoutée à côté de la commande dans `github.sh` (`bascule.test.mjs:225`).

## Vérification

1. `node --test skills/chaine/fusionner/scripts/demande.test.mjs skills/chaine/fusionner/scripts/messages-du-regime.test.mjs scripts/bascule.test.mjs scripts/points-d-entree.test.mjs` : rouges avant (« À faire », 2), verts après.
2. `env -u NODE_PATH pnpm test` : la suite entière, sortie 0.

## Ce qui n'a pas été établi

- **La forme d'un identifiant de session** : `session_` suivi de lettres et de chiffres est ce que montrent les sessions de l'essai et les bancs de la chaîne ; aucun contrat de l'outil ne le promet. C'est une hypothèse (`A-241` (4)), que le banc tient : un identifiant d'une autre forme sortirait en 2, et le dire suffit à rouvrir la forme.
- **La copie de la sortie dans `add_issue_comment`** reste un geste de la session. Le risque d'erreur tombe (une chaîne recopiée d'une sortie d'outil, pas tapée de tête), il n'est pas nul. Une lecture de retour (le commentaire relu et comparé à la sortie) n'est pas demandée.
- **L'identifiant de session par une variable d'environnement** : les sessions cloud en ont, mais aucun skill ne les cite et leur nom n'est pas un contrat ; le script les ignore, l'identifiant vient de `get_session`.

## Hors périmètre

- Les textes qui nomment la commande, et la lecture de l'état d'une fille : ticket 104.
- `FORME_DEMANDE` et la lecture des demandes (tickets 94 et 96).
- `renvoyer.sh` et l'auteur d'une PR lu sur sa demande (constat (4), famille `fusionner`).
- La demande que pose le Relecteur lui-même : il n'en écrit pas.

## Comments
