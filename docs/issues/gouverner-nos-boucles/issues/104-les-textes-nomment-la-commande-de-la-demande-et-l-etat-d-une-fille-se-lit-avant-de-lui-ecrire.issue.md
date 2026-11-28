# Les textes nomment la commande de la demande `À relire`, jamais sa forme à remplir ; et le conducteur lit l'état d'une fille avant de lui écrire

Status: Fait — PR 177 (`533b64b`, plugin 8.9.1)
Type: défaut
Modèle: sonnet — des phrases dans sept textes et leur banc de texte, sans code ; la commande est celle du ticket 101 ; les règles sont les décisions `A-235`, `A-236` et `A-241` (3) et (5). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 101
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` (étapes 5 et 6, lignes 130 et 131 ; ligne 136) ; `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md` (ligne 7) ; `skills/chaine/tickets/references/agents/issue-tracker.md` (ligne 29) ; `skills/chaine/sujet/SKILL.md` (ligne 80) ; `skills/chaine/chantier/SKILL.md` (lignes 67, 96, 98, 102) ; `skills/chaine/architecte/SKILL.md` (lignes 76, 105, 108) ; `scripts/bascule.test.mjs` (lignes 81, 87, 113, 207, 218, et un test neuf) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. Le ticket 101 pose le script et touche `scripts/bascule.test.mjs:225` : il passe d'abord, d'où `Blocked by: 101`. **Une PR pour 104, 102 et 100, dans cet ordre, une seule montée de version** : 102 (`Blocked by: 104`) touche `chantier/SKILL.md` § 0 et § 6 (lignes 22, 86 à 94) et `architecte/SKILL.md` (lignes 75, 78 à 84), et `scripts/bascule.test.mjs:78` ; 100 (`Blocked by: 102`), `chantier/SKILL.md` lignes 82, 89-90 et « Ne jamais ». Le ticket 97 touche `architecte/SKILL.md` aux lignes 66 et 86 : seuls les fichiers de version se battent. Le ticket 103 touche `architecte/SKILL.md` § 5 après la ligne 75 : il part après cette PR.

## Le besoin

Deux constats de l'essai réel du régime 8 (journal de la carte et l'entrée « Fin de l'essai réel du régime 8 »).

1. **Constat (8)** (2026-11-23, 20 h 18 UTC) : une demande `À relire` au sha faux, « complété de tête depuis un sha court ». Le ticket 101 pose le script qui fabrique la demande ; les textes des skills donnent encore la forme à remplir.
2. **Constat (14), première moitié** (2026-11-23, 23 h 48 UTC, et son rectificatif). Sur la PR #15 sans étiquette, le conducteur a écrit à la fille avant de lire qu'elle était archivée. L'envoi a été refusé, et il a posé `à-relire` dans le même réveil : rien n'a été perdu ici, mais le geste se fait dans le mauvais ordre.

Le besoin : **chaque texte qui fait écrire une demande nomme la commande, avec les arguments du cas**, et la forme n'est plus citée qu'une fois, à l'étape 5, pour la lire ; **le conducteur lit l'état d'une fille par `get_session` avant de lui écrire**.

## La cause, à la source (`main` à `b57eae7`, plugin 8.5.0)

1. Les textes donnent la forme et laissent la session la remplir : `chaine-de-production.md:130` (étape 5, « le sha entier du dernier push »), `:131` (étape 6, « un commentaire `À relire` au nouveau sommet »), `:136` (le renvoi) ; `claude-md-fusion.md:7` ; `issue-tracker.md:29` ; `sujet/SKILL.md:80` ; `chantier/SKILL.md:67`, `:102` ; `architecte/SKILL.md:76` (« L'architecte demande de même la relecture de ses propres PR […] et pose `à-relire` sur une PR écrite par une personne ou par un outil »), `:105` (ses PR de documentation), `:108` (une PR étrangère au programme, en régime 8).
2. `chantier/SKILL.md:102` : « l'écrire à leur fille ; fille finie ou muette, il pose lui-même `à-relire` » ; `:96` (point 3) : « Session inactive (`send_message` refusé) : relancer une fille ». L'état de la fille se déduit d'un envoi refusé, au lieu de se lire d'abord.
3. `chantier/SKILL.md:98` dit « avec `Conducteur: —` » pour ses propres PR, sans dire pourquoi : sur la PR 2 du jouet, la demande portait `Session: moi — Conducteur: —`.

## Quand le ticket est fait

1. **L'étape 5** (`chaine-de-production.md:130`) dit : sur la PR, « la ligne que rend `node scripts/chaine/demande.mjs --session <la sienne> --conducteur <celle du conducteur>`, copiée telle quelle, seule dans son commentaire » ; la forme, citée là seulement, pour la lire : `À relire — sommet <sha> — Session: <id ou —> — Conducteur: <id ou —>`, « le sha entier du dernier push, que le script lit dans git et refuse non poussé » ; la phrase du ticket 96 reprise, « la demande ne se modifie jamais ; une erreur (un sha faux) se corrige par une demande neuve, que rend le script » ; **le repli** : le script absent (un projet qui n'a pas reposé `fusionner`), `node ~/.claude/plugins/marketplaces/maj/skills/chaine/fusionner/scripts/demande.mjs`, mêmes arguments ; dans le dépôt `skills`, `node skills/chaine/fusionner/scripts/demande.mjs`.
2. **L'étape 6** (`:131`) et **le renvoi** (`:136`) : « une demande neuve, par le script (étape 5) », au nouveau sommet.
3. **Les autres textes nomment la commande**, avec les arguments du cas, sans la forme :

   | Texte | Le cas | Les arguments |
   | --- | --- | --- |
   | `claude-md-fusion.md:7` | une session de travail | `--session <id> --conducteur <id ou —>` |
   | `issue-tracker.md:29` | livrer un ticket | `--session <la sienne> --conducteur <celle du conducteur, ou —>` |
   | `sujet/SKILL.md:80` | la PR de réception | `--session <la sienne> --conducteur <celle du conducteur, ou —>` |
   | `chantier/SKILL.md:67` | la PR de cadrage | `--session <la sienne> --conducteur —` |
   | `chantier/SKILL.md:98` | ses propres PR | `--session <la sienne> --conducteur —`, avec la raison (cas 5) |
   | `chantier/SKILL.md:102` | la PR sans étiquette d'une fille finie | `--branche <tête de la PR> --session — --conducteur <la sienne>` |
   | `architecte/SKILL.md:76` | ses propres PR ; une PR écrite par une personne ou par un outil | `--session <la sienne> --conducteur —` ; `--branche <tête de la PR> --session — --conducteur —` |
   | `architecte/SKILL.md:105` | ses PR de documentation, en régime 8 | `--session <la sienne> --conducteur —` (« par le script, § 5 ») |
   | `architecte/SKILL.md:108` | une PR étrangère au programme, en régime 8 | `--branche <tête de la PR> --session — --conducteur —`, puis `à-relire` |

4. **Aucun de ces textes** (`claude-md-fusion.md`, `issue-tracker.md`, `sujet/SKILL.md`, `chantier/SKILL.md`, `architecte/SKILL.md`) ne contient plus `À relire — sommet <sha>` ; `chaine-de-production.md` le contient une fois, à l'étape 5.
5. **`chantier/SKILL.md:98`** dit pourquoi `--conducteur —` sur ses propres PR : « les lignes du Relecteur lui arrivent par `Session:`, et son identifiant aux deux champs le réveillerait deux fois (`A-235`) ».
6. **`chantier/SKILL.md:96`** (point 3), une PR renvoyée (`fusion-bloquée`) : `get_session` sur sa fille **avant** tout `send_message` ; archivée, `completed` ou `failed` : aucun message, **relancer une fille sur la branche de la PR** (`source_revision` = la branche) avec, en ligne de situation, le renvoi à lire dans les commentaires de la PR ; sinon le message (`A-236`, `A-241` (5)).
7. **`chantier/SKILL.md:102`**, une PR sans étiquette : `get_session` sur sa fille **avant** tout `send_message` ; archivée, `completed` ou `failed` : aucun message, **la demande par le script** (`--branche <tête de la PR> --session — --conducteur <la sienne>`), **puis `à-relire`** ; sinon le message (`A-236`, `A-241` (5)).
8. Les bancs de `scripts/bascule.test.mjs` suivent les textes neufs (« Où »), et un test neuf tient les cas 3, 4, 6 et 7.
9. La note de version le dit (« À faire », étape 6).

## Où

Lignes lues sur `main` à `b57eae7`, avant 96 et 101.

| Fichier | Ce qui change |
| --- | --- |
| `skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md:130` | étape 5 (cas 1) |
| `chaine-de-production.md:131`, `:136` | « une demande neuve, par le script (étape 5) » (cas 2) |
| `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md:7` | la commande à la place de la forme |
| `skills/chaine/tickets/references/agents/issue-tracker.md:29` | de même |
| `skills/chaine/sujet/SKILL.md:80` | la PR de réception, de même |
| `skills/chaine/chantier/SKILL.md:67` | la PR de cadrage : `--session <la sienne> --conducteur —` |
| `skills/chaine/chantier/SKILL.md:96` | point 3 : `get_session` d'abord, la fille relancée sur sa branche (cas 6) |
| `skills/chaine/chantier/SKILL.md:98` | la commande et sa raison (cas 5) |
| `skills/chaine/chantier/SKILL.md:102` | `get_session` d'abord ; la demande par le script, puis `à-relire` (cas 7) |
| `skills/chaine/architecte/SKILL.md:76`, `:105`, `:108` | la commande, les arguments du tableau |
| `scripts/bascule.test.mjs:81` | devient : « ses propres PR (cadrage, documentation, nettoyage) demandent leur relecture comme celle d'une fille, par `node scripts/chaine/demande.mjs --session <la sienne> --conducteur —` : les lignes du Relecteur lui arrivent par `Session:`, et son identifiant aux deux champs le réveillerait deux fois (`A-235`). » |
| `scripts/bascule.test.mjs:87` | devient : « il pose lui-même la demande, la ligne que rend `node scripts/chaine/demande.mjs --branche <tête de la PR> --session — --conducteur <la sienne>`, copiée telle quelle, puis `à-relire` » |
| `scripts/bascule.test.mjs:113` | devient : « sa relecture se demande comme celle d'une fille (`chaine-de-production.md` § 5, étape 5 : la ligne que rend `node scripts/chaine/demande.mjs --session <la sienne> --conducteur —`, puis `à-relire` par `issue_write`), jamais `à-fusionner` ; en régime 7, label `à-fusionner` » |
| `scripts/bascule.test.mjs:207` | l'étape 5 : « le commentaire `À relire — sommet <sha> — Session: <la sienne> — Conducteur: <celle du conducteur>` » devient « la ligne que rend `node scripts/chaine/demande.mjs --session <la sienne> --conducteur <celle du conducteur>`, copiée telle quelle, seule dans son commentaire » ; s'y ajoutent « `À relire — sommet <sha> — Session: <id ou —> — Conducteur: <id ou —>` » et « `node ~/.claude/plugins/marketplaces/maj/skills/chaine/fusionner/scripts/demande.mjs` » ; « le sha entier du dernier push » reste |
| `scripts/bascule.test.mjs:218` | le fragment : « `À relire — sommet <sha> — Session: <id> — Conducteur: <id>` » devient « `node scripts/chaine/demande.mjs --session <id> --conducteur <id ou —>` » |
| `scripts/bascule.test.mjs` | un test neuf (« À faire », étape 2) |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante, la note |

`ADR_ALL_ARC-N-relecture-independante.md:14` (`socle-chaine-de-production/references/adr/`) cite aussi la forme : une ADR dit la décision, et la forme y est lue, pas remplie ; elle ne change pas.

Règles à lire : `chaine-de-production.md` § 5, étape 5 ; `relecteur/SKILL.md`, « Les lignes » ; `fusionner/references/CONTENU.md`, « `scripts/demande.mjs` » (posé par le ticket 101).

## Décisions

Décidées le 2026-11-27 par l'architecte : **`A-235`**, **`A-236`** et **`A-241`** (3) et (5) (spec `relecture-independante.spec.md`). Ce qui suit les applique ; rien n'y est à trancher.

1. **`A-241` (3) — Les textes nomment la commande.** La forme ne s'écrit plus qu'une fois, dans le script (ticket 101) ; l'étape 5 la cite pour la lire (un humain et le Relecteur la lisent), personne ne la remplit plus.
2. **`A-235` — Les deux champs**, tels que le script les tient : `Session:` la session qui écrit, `—` pour une demande posée à la place d'une session finie ou d'une personne ; `Conducteur:` le conducteur quand il n'est pas l'auteur, `—` quand l'auteur est le conducteur, ou hors chantier. Une session de ticket hors chantier (`lancement.md`, « La session d'un ticket hors chantier ») écrit `--conducteur —` : l'architecte n'est pas le conducteur.
3. **`A-236` — L'état d'une fille se lit avant de lui écrire** : `get_session` d'abord ; une fille archivée ou finie (`completed`, `failed`) ne reçoit rien, la ligne va à qui la remplace ou au journal. Un envoi accepté par une session `completed`, qui ne le lira qu'à une reprise, retarderait la demande d'un réveil entier.
4. **`A-241` (5) — Les deux gestes** : une fille renvoyée en `fusion-bloquée` et finie se relance sur sa branche ; une fille finie dont la PR n'a pas d'étiquette voit sa demande posée par le script, puis `à-relire`.
5. **L'architecte**, pour une PR écrite par une personne ou par un outil (`:76`) et une PR étrangère au programme en régime 8 (`:108`), écrit `--branche <tête de la PR> --session — --conducteur —` : il n'est pas sur la branche, la PR n'a pas de session, et personne ne conduit (`A-241` (4), permis par le script).
6. **La version** : 104, 102 et 100 font une PR et une seule montée, la suivante de `main` au moment de livrer, au troisième chiffre (des textes corrigés, aucun script posé).

## À faire, dans l'ordre

1. **Partir de `main`**, les tickets 96 et 101 fusionnés : `git fetch origin main`, une branche neuve depuis `origin/main` ; relire sur elle chaque ligne citée ici (le ticket 96 a réécrit l'étape 5).
2. **Les bancs, rouges** : `scripts/bascule.test.mjs:81`, `:87`, `:113`, `:207`, `:218` aux valeurs neuves ; un test neuf :
   - les cinq fichiers du cas 4 sans `À relire — sommet <sha>`, et `chaine-de-production.md` qui l'a une fois, dans l'étape 5 ;
   - chaque ligne du tableau du cas 3 qui contient `node scripts/chaine/demande.mjs` et ses arguments, à sa section (`entre`) ;
   - `chantier/SKILL.md` § 6, point 3 : `get_session` avant `send_message`, et « relancer une fille sur la branche de la PR » après la lecture ;
   - `chantier/SKILL.md` § 6, point 5, la puce « **À chaque réveil** » : `get_session` avant `send_message`, et la demande par le script avant `à-relire`.
   Les voir rouges.
3. **Les textes**, un par un, dans l'ordre de « Où » ; `chantier/SKILL.md` reste sous deux cents lignes.
4. **Les bancs verts**, puis les mutations.
5. Les tickets 102 et 100, sur la même branche (leur ordre, `Blocked by:`).
6. **La version et la note**, une fois pour les trois tickets : la commande dans les textes, le repli, `get_session` avant d'écrire à une fille ; ce qu'un projet repose pour avoir les documents neufs (`chaine-de-production.md`, le fragment, `issue-tracker.md`), selon la règle des documents du régime 8 au moment de livrer (`A-196`, point 4) ; les skills se lisent dans le plugin. La suite entière.

## Surfaces

| Surface | Preuve |
| --- | --- |
| l'étape 5 : la commande, la forme pour la lire, le repli, la phrase du ticket 96 | `scripts/bascule.test.mjs:207` ; M1 |
| le fragment, le tracker, la réception, le cadrage, ses propres PR, l'architecte : la commande et les arguments du cas | `scripts/bascule.test.mjs:81`, `:113`, `:218`, le test neuf ; M2, M3 |
| la forme écrite une fois, à l'étape 5 | le test neuf ; M4 |
| la PR sans étiquette : `get_session` d'abord, la demande par le script, puis `à-relire` | `scripts/bascule.test.mjs:87`, le test neuf ; M5 |
| la PR renvoyée : `get_session` d'abord, la fille finie relancée sur sa branche | le test neuf ; M6 |

## Mutations

Toutes rouges :

- M1 : le repli retiré de l'étape 5.
- M2 : `--conducteur —` remis à `<la sienne>` dans `chantier/SKILL.md:67`.
- M3 : `--branche <tête de la PR>` retiré de la ligne de l'architecte pour une PR étrangère (`:108`).
- M4 : la forme remise à la place de la commande dans `chantier/SKILL.md:102`.
- M5 : `get_session` remis après le `send_message` dans `chantier/SKILL.md:102`.
- M6 : `get_session` remis après le `send_message` dans `chantier/SKILL.md:96`.

## Vérification

1. `node --test scripts/bascule.test.mjs` : rouge avant les textes (« À faire », 2), vert après.
2. `wc -l skills/chaine/chantier/SKILL.md skills/chaine/architecte/SKILL.md` : chacun sous deux cents lignes.
3. `env -u NODE_PATH pnpm test` : la suite entière, sortie 0.

## Ce qui n'a pas été établi

- **Le `status_bucket` d'une fille au repos qui attend son réveil de secours** (étape 7 de `chaine-de-production.md` § 5 : la relecture demandée, un `send_later` armé, puis le tour fini). Non relevé sur l'essai. S'il vaut `completed`, la règle du cas 7 la prendrait pour finie : le conducteur poserait la demande à sa place, et le message qu'il lui devait ne partirait pas ; la fille, réveillée par son `send_later`, trouverait `à-relire` posée. Rien ne se perd, mais la fille n'apprend pas ce que le conducteur avait à lui dire. À relever au prochain essai (`get_session` sur une fille entre sa demande et son réveil de secours) ; s'il vaut `completed`, la règle se revoit.
- **La copie de la sortie dans `add_issue_comment`** reste un geste de la session (ticket 101, même point).

## Hors périmètre

- Le script, `github.sh` et leurs bancs : ticket 101.
- `FORME_DEMANDE` et la lecture des demandes (tickets 94 et 96).
- `ADR_ALL_ARC-N-relecture-independante.md:14` : la forme y est lue, pas remplie.
- `renvoyer.sh` et l'auteur d'une PR lu sur sa demande (constat (4), famille `fusionner`).

## Comments
