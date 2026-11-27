# La demande `À relire` est fabriquée par un script, jamais tapée : le sommet lu par git, les deux champs vérifiés ; et le conducteur lit l'état d'une fille avant de lui écrire

Status: needs-triage
Type: défaut
Modèle: sonnet — un script court et son banc, un message de `github.sh` et son banc, des phrases dans sept textes et leur banc de texte ; l'interface, les sorties et la règle des champs sont fixées par les décisions `A-234`, `A-235` et `A-236` (proposées, à confirmer par l'architecte). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 96
Dépendances: —
Fichiers chauds: **neufs** `skills/chaine/fusionner/scripts/demande.mjs` et `demande.test.mjs` ; `skills/chaine/fusionner/SKILL.md` (ligne 16) et `references/CONTENU.md` (après la section des lignes 61 à 64) ; `skills/chaine/fusionner/scripts/github.sh` (`DEMANDE_DE_RELECTURE`, lignes 448 à 452) et `messages-du-regime.test.mjs` (lignes 14 à 25) ; `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` (étapes 5 et 6, lignes 130 et 131 ; ligne 136) ; `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md` (ligne 7) ; `skills/chaine/tickets/references/agents/issue-tracker.md` (ligne 29) ; `skills/chaine/sujet/SKILL.md` (ligne 80) ; `skills/chaine/chantier/SKILL.md` (lignes 67, 96, 98, 102) ; `skills/chaine/architecte/SKILL.md` (ligne 76) ; `scripts/bascule.test.mjs` (lignes 81, 87, 113, 207) ; `scripts/points-d-entree.test.mjs` (`SCRIPTS`, lignes 18 à 31) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Le ticket 96 touche la même phrase de l'étape 5** (`chaine-de-production.md:130`, « la demande ne se modifie jamais ; une erreur se corrige par une demande neuve ») : il passe d'abord, d'où `Blocked by: 96`, et ce ticket reprend sa phrase en y nommant le script. Le ticket 97 touche `architecte/SKILL.md` aux lignes 66 et 86, pas à la 76 : seuls les fichiers de version se battent. Les tickets 100 et 102 touchent `chantier/SKILL.md` § 6 et `scripts/bascule.test.mjs` à d'autres lignes : ce ticket d'abord. **Le ticket de suite du constat (4)** (famille `fusionner`, `renvoyer.sh` lit l'auteur sur la demande), pas encore écrit, touchera sans doute `github.sh` et `messages-du-regime.test.mjs` : l'ordre est à fixer par l'architecte.

## Le besoin

Trois constats de l'essai réel du régime 8 (journal de la carte et l'entrée « Fin de l'essai réel du régime 8 »).

1. **Constat (8)** (2026-11-23, 20 h 18 UTC). Sur la PR #13 du jouet, le conducteur a écrit une première demande `À relire` au sha faux, « complété de tête depuis un sha court », puis une seconde, juste. Le sha entier de 40 caractères se tape à la main aujourd'hui partout où une session demande sa relecture.
2. **Constat (14), seconde moitié** (2026-11-22, 17 h 33 UTC, PR 2 du jouet). Le champ `Conducteur:` des demandes du conducteur sur ses propres PR vaut `—`. Le journal note la demande `Session: moi — Conducteur: —` : « moi » n'est pas un identifiant de session, mais la forme que lit le Relecteur l'accepte (`ID`, `decision-relecteur.mjs:49`), et ses lignes partiraient vers une session qui n'existe pas.
3. **Constat (14), première moitié** (2026-11-23, 23 h 48 UTC, et son rectificatif). Sur la PR #15 sans étiquette, le conducteur a écrit à la fille avant de lire qu'elle était archivée. L'envoi a été refusé, et il a posé `à-relire` dans le même réveil : rien n'a été perdu ici, mais le geste se fait dans le mauvais ordre. Regroupé ici : même paragraphe de `chantier/SKILL.md` (`:102`) que la demande que le conducteur pose, texte seul. Le numéro 104 reste libre.

Le besoin : **une demande `À relire` est la sortie d'un script, copiée telle quelle** ; le sommet vient de git, jamais du clavier ; les deux champs sont des identifiants de session ou `—`, selon une règle que le script tient. Et le conducteur lit l'état d'une fille par `get_session` avant de lui écrire.

## La cause, à la source (`main` à `b57eae7`, plugin 8.5.0)

1. Aucun script ne fabrique la demande. Les textes en donnent la forme et laissent la session la remplir : `chaine-de-production.md:130` (étape 5, « le sha entier du dernier push »), `:131` (étape 6), `:136` ; `claude-md-fusion.md:7` ; `issue-tracker.md:29` ; `sujet/SKILL.md:80` ; `chantier/SKILL.md:67`, `:98`, `:102` ; `architecte/SKILL.md:76`. Le message des renvois et de `sujet.sh demarrer` aussi : `github.sh:452` (`DEMANDE_DE_RELECTURE`, repris par `renvoyer.sh:37`, `:45` et `sujet.sh:443`).
2. `decision-relecteur.mjs:48-51` : `FORME_DEMANDE` accepte tout `ID` (`[A-Za-z0-9][A-Za-z0-9_-]*`), « moi » compris. Le lecteur est voulu tolérant ; le contrôle manque à l'écriture.
3. `chantier/SKILL.md:102` : « l'écrire à leur fille ; fille finie ou muette, il pose lui-même `à-relire` » ; `:96` (point 3) : « Session inactive (`send_message` refusé) : relancer une fille ». L'état de la fille se déduit d'un envoi refusé, au lieu de se lire d'abord.

## Quand le ticket est fait

1. `node scripts/chaine/demande.mjs --session <id|—> --conducteur <id|—>` écrit sur sa sortie une ligne, `À relire — sommet <sha> — Session: <…> — Conducteur: <…>`, sort en 0, et `<sha>` est `git rev-parse HEAD`.
2. Sans `--branche`, il refuse (sortie 1, cause dite) une tête détachée, une branche absente d'`origin`, ou une tête locale autre que celle d'`origin` (`git ls-remote origin refs/heads/<branche>`) : la demande ne nomme qu'un sommet poussé.
3. Avec `--branche <nom>`, le sommet est la tête de cette branche sur `origin` (`git ls-remote`), quelle que soit la branche courante : c'est le cas du conducteur qui pose la demande d'une fille finie ; une branche absente d'`origin` sort en 1.
4. `--session` et `--conducteur` sont exigés tous deux. Chacun vaut un identifiant `session_<lettres et chiffres>` ou `—` (`-` accepté, écrit `—`) ; autre chose (« moi », vide, une URL) sort en 2.
5. `--session` et `--conducteur` égaux sortent en 2, avec la cause « l'auteur qui conduit écrit `--conducteur —` » (`A-235`).
6. `git` ne lit pas `origin` : sortie 12, comme le Relecteur (`relecteur/SKILL.md`, table des sorties).
7. La ligne écrite est lue comme une demande par `lireMarques` de `decision-relecteur.mjs`, avec le même sommet et les mêmes champs (`—` lu `null`), pour les quatre combinaisons de champs permises.
8. Le script se lance de partout (`scripts/points-d-entree.test.mjs` : direct, lien, dossier à espace ou à accent).
9. Chaque texte du point 1 de « La cause » dit : « la ligne que rend `node scripts/chaine/demande.mjs …`, copiée telle quelle, seule dans son commentaire », avec les arguments du cas (fille, conducteur auteur, conducteur pour une fille finie, réception de sujet, architecte) ; la forme reste citée une fois, à l'étape 5, pour la lire.
10. `DEMANDE_DE_RELECTURE` nomme le script et ses arguments ; `messages-du-regime.test.mjs` prouve que la ligne que le message fait produire est lue comme une demande.
11. Le script absent d'un projet qui n'a pas reposé `fusionner` : l'étape 5 dit le repli, `node ~/.claude/plugins/marketplaces/maj/skills/chaine/fusionner/scripts/demande.mjs`, même arguments ; dans le dépôt `skills`, `node skills/chaine/fusionner/scripts/demande.mjs`.
12. `chantier/SKILL.md:102` et `:96` : `get_session` sur la fille **avant** tout `send_message` ; archivée, `completed` ou `failed` : aucun message, le geste de la fille finie (la demande par le script, `--branche`, puis `à-relire`) ; sinon le message.
13. La note de version (la suivante de `main` au moment de livrer ; correctif : le troisième chiffre) dit le script, le repli, et qu'un projet repose `fusionner` pour l'avoir sous `scripts/chaine/`.

## Où

| Fichier (lignes sur `main` à `b57eae7`) | Ce qui change |
| --- | --- |
| `skills/chaine/fusionner/scripts/demande.mjs` (neuf) | une fonction pure `demande({ sommet, session, conducteur })` qui rend la ligne ou lève l'erreur d'appel, exportée ; le point d'entrée (lecture des options, `git rev-parse HEAD`, `git symbolic-ref --short HEAD`, `git ls-remote origin refs/heads/<b>`, sorties 0, 1, 2, 12). Modèle d'un point d'entrée qui se reconnaît : `skills/chaine/fusionner/scripts/double-relecture.mjs` (cité par `points-d-entree.test.mjs:28`) |
| `skills/chaine/fusionner/scripts/demande.test.mjs` (neuf) | cas 1 à 7, sur un dépôt jouet à `origin` (`depotJouet`, `skills/chaine/sujet/scripts/depot-jouet.mjs:112`, comme `messages-du-regime.test.mjs:9-11`) ; le cas 7 importe `lireMarques` sans toucher `decision-relecteur.mjs` |
| `skills/chaine/fusionner/SKILL.md:16` | `scripts/demande.mjs` dans la liste posée sous `scripts/chaine/` |
| `skills/chaine/fusionner/references/CONTENU.md`, après `:61-64` | une section `## scripts/demande.mjs` |
| `skills/chaine/fusionner/scripts/github.sh:448-452` | `DEMANDE_DE_RELECTURE` nomme le script (cas 10) |
| `skills/chaine/fusionner/scripts/messages-du-regime.test.mjs:14-25` | `DEMANDE` et `demandeLue` suivent le message neuf : le gabarit du script, rempli, lu par `lireMarques` |
| `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:130`, `:131`, `:136` | étape 5 : la commande, la forme citée pour la lire, le repli, la phrase du ticket 96 reprise ; étapes 6 et le renvoi : « une demande neuve, par le script » |
| `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md:7` | la commande à la place de la forme |
| `skills/chaine/tickets/references/agents/issue-tracker.md:29` | de même |
| `skills/chaine/sujet/SKILL.md:80` | la PR de réception, de même |
| `skills/chaine/chantier/SKILL.md:67` | la PR de cadrage : `--session <la sienne> --conducteur —` |
| `skills/chaine/chantier/SKILL.md:96` | point 3 : `get_session` d'abord (cas 12) |
| `skills/chaine/chantier/SKILL.md:98` | « avec `Conducteur: —` » dit pourquoi : les lignes lui arrivent par `Session:` (`A-235`) |
| `skills/chaine/chantier/SKILL.md:102` | `get_session` d'abord ; la demande par `--branche <tête de la PR> --session — --conducteur <la sienne>` |
| `skills/chaine/architecte/SKILL.md:76` | « L'architecte demande de même la relecture de ses propres PR » : par le script, `--conducteur —` |
| `scripts/bascule.test.mjs:81`, `:87`, `:113`, `:207` | les quatre chaînes exactes suivent les textes neufs ; une assertion de plus pour le cas 12 |
| `scripts/points-d-entree.test.mjs:18-31` | une entrée `demande` (sans argument : sortie 2, l'usage) |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante, la note |

Règles à lire : `chaine-de-production.md` § 5, étape 5 ; `relecteur/SKILL.md`, « Les lignes ».

## Décisions

1. **`A-234` — Le script de la demande** (proposée). `skills/chaine/fusionner/scripts/demande.mjs`, posé par `fusionner` sous `scripts/chaine/demande.mjs`, comme `decision-relecteur.mjs` dont il suit la forme. Interface : `--session <id|—>`, `--conducteur <id|—>`, tous deux exigés ; `--branche <nom>` facultatif. Sorties : 0 la ligne ; 1 un sommet non poussé ou une branche absente d'`origin` ; 2 un appel mal formé ; 12 `origin` illisible. Il n'écrit rien sur GitHub : la session copie sa sortie dans `add_issue_comment` (en cloud, `gh` n'est pas authentifié). Raison : le sha ne passe plus par la mémoire de la session, seulement par une copie de sortie d'outil ; le contrôle « poussé » est celui que l'étape 5 demande déjà (`git ls-remote origin <branche>` = `HEAD`), fait par la machine ; `--branche` couvre le seul cas où la session n'est pas sur la branche de la PR. Le lecteur, `FORME_DEMANDE`, ne change pas : les tickets 94 et 96 en vol touchent `decision-relecteur.mjs`, et une demande d'une personne y reste lisible.
2. **`A-235` — Les deux champs** (proposée). `Session:` est l'identifiant de la session qui écrit la demande, lu par `get_session` sans argument, comme `CAPITAINE_ID` (`fusionner/SKILL.md:71`) ; `—` seulement pour une demande posée à la place d'une session finie (le conducteur pour sa fille, l'architecte pour une PR d'une personne). `Conducteur:` est le conducteur du chantier quand il n'est pas l'auteur ; **`—` quand l'auteur est le conducteur lui-même, ou hors chantier**. `A-196` point 1 tient donc : le constat (14) se ferme en disant pourquoi, pas en changeant la valeur. Raison : sur sa propre PR, les lignes du Relecteur lui arrivent par `Session:` (`decision-relecteur.mjs:385`, `auxDeux`) ; écrire son identifiant aux deux champs le réveillerait deux fois pour chaque ligne, sans rien de plus. Le défaut réel de la PR 2 du jouet est « moi » : le script n'accepte que `session_…` ou `—`, et refuse deux champs égaux.
3. **`A-236` — L'état d'une fille se lit avant de lui écrire** (proposée). `get_session` d'abord ; archivée, `completed` ou `failed` : aucun `send_message`, le geste de la fille finie. Raison : un envoi refusé ne coûte rien, mais un envoi accepté par une session `completed`, qui ne le lira qu'à une reprise, retarderait la demande d'un réveil entier.
4. **Les textes nomment la commande, et l'étape 5 garde la forme** : un humain et le Relecteur la lisent ; personne ne la remplit plus.
5. **Hors chantier, une session de ticket** (`lancement.md`, « La session d'un ticket hors chantier ») écrit `--conducteur —` : elle suit l'étape 5, en lisant « l'architecte » pour « le conducteur », et l'architecte n'est pas le conducteur.

## À faire, dans l'ordre

1. Partir de `main` à jour, le ticket 96 fusionné (sa phrase de l'étape 5 en place).
2. **Les bancs d'abord, vus rouges** : `demande.test.mjs` (le script absent : tous rouges), l'entrée de `points-d-entree.test.mjs`, les chaînes neuves de `scripts/bascule.test.mjs`, `messages-du-regime.test.mjs` suivant le message neuf.
3. `demande.mjs`, puis `github.sh:452`.
4. Les textes, un par un, dans l'ordre de « Où » ; `chantier/SKILL.md` reste sous deux cents lignes.
5. Les bancs verts ; les mutations ; la version et la note ; la suite entière.

## Surfaces

| Surface | Preuve |
| --- | --- |
| la ligne écrite, sommet = `git rev-parse HEAD`, sortie 0 | `demande.test.mjs`, cas 1 ; M1 |
| un sommet non poussé, une tête détachée, une branche absente d'`origin` : sortie 1 | `demande.test.mjs`, cas 2 ; M2 |
| `--branche` lit la tête d'`origin`, pas `HEAD` | `demande.test.mjs`, cas 3 ; M3 |
| un champ hors forme (« moi », vide) ou absent : sortie 2 | `demande.test.mjs`, cas 4 ; M4 |
| deux champs égaux : sortie 2, la cause dite | `demande.test.mjs`, cas 5 ; M5 |
| `origin` illisible : sortie 12 | `demande.test.mjs`, cas 6 |
| la ligne se lit comme une demande, quatre combinaisons | `demande.test.mjs`, cas 7 ; M6 |
| le script agit par tout chemin de lancement | `scripts/points-d-entree.test.mjs`, entrée `demande` |
| le message des renvois et de `demarrer` fait produire une demande lisible | `messages-du-regime.test.mjs` |
| les textes nomment la commande (étape 5, cadrage, sans étiquette, réception, fragment, tracker, architecte) | `scripts/bascule.test.mjs:81`, `:87`, `:113`, `:207`, suivis ; M7 |
| `get_session` avant `send_message` (points 3 et 5 du § 6) | `scripts/bascule.test.mjs`, l'assertion neuve ; M8 |

## Mutations

Toutes rouges :

- M1 : le sommet pris à `HEAD~1`, ou tronqué à 39 caractères.
- M2 : le contrôle « poussé » retiré.
- M3 : `--branche` ignoré (le sommet reste `HEAD`).
- M4 : la forme des champs élargie à tout `ID` (« moi » passe).
- M5 : le refus des deux champs égaux retiré.
- M6 : le tiret long écrit `-` dans la ligne (le lecteur ne la lit plus comme une demande).
- M7 : la forme remise à la place de la commande dans `chantier/SKILL.md:102`.
- M8 : `get_session` remis après le `send_message`.

## Vérification

1. `node --test skills/chaine/fusionner/scripts/demande.test.mjs skills/chaine/fusionner/scripts/messages-du-regime.test.mjs scripts/bascule.test.mjs scripts/points-d-entree.test.mjs` : rouges avant (§ À faire, 2), verts après.
2. `wc -l skills/chaine/chantier/SKILL.md` : moins de deux cents lignes.
3. `env -u NODE_PATH pnpm test` : la suite entière, sortie 0.

## Ce qui n'a pas été établi

- **Si « moi » était écrit tel quel** dans la demande de la PR 2 du jouet, ou si c'est la façon du journal de dire « l'identifiant du conducteur » : le jouet n'est pas lisible d'ici. Le script refuse « moi » dans les deux cas.
- **La copie de la sortie dans `add_issue_comment`** reste un geste de la session. Le risque d'erreur tombe (une chaîne recopiée d'une sortie d'outil, pas tapée de tête), il n'est pas nul. Une lecture de retour (le commentaire relu et comparé à la sortie) n'est pas demandée.
- **L'identifiant de session par une variable d'environnement** : les sessions cloud en ont, mais aucun skill ne les cite et leur nom n'est pas un contrat ; le script les ignore, l'identifiant vient de `get_session`.

## Hors périmètre

- `FORME_DEMANDE` et la lecture des demandes (tickets 94 et 96).
- `renvoyer.sh` et l'auteur d'une PR lu sur sa demande (constat (4), famille `fusionner`).
- La demande que pose le Relecteur lui-même (règle 3, cause (c)) : il n'en écrit pas.

## Comments
