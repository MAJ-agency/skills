# Un message qui doit arriver avant un geste part avec `priority: "next"`, et son auteur vérifie à la source que le geste n'a pas eu lieu

Status: ready-for-agent
Type: défaut
Modèle: sonnet — du texte dans `architecte/SKILL.md` et `chantier/SKILL.md`, et un banc de texte ; rien à coder ; la règle est la décision `A-238`. Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 102
Dépendances: —
Fichiers chauds: `skills/chaine/architecte/SKILL.md` (§ 5, une puce après la ligne 75) ; `skills/chaine/chantier/SKILL.md` (§ 6, un point après le point 4, ligne 97) ; `scripts/bascule.test.mjs` (un test neuf) ; `scripts/relecteur.test.mjs` (la liste des lignes qui nomment `interrupt_session`, posée par le ticket 97) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. Le ticket 102 touche `architecte/SKILL.md` aux lignes 75 et 78 à 84 et `chantier/SKILL.md` § 6 : il passe d'abord, d'où `Blocked by: 102`. Le ticket 97 touche `architecte/SKILL.md` aux lignes 66 et 86, et pose dans `scripts/relecteur.test.mjs` la liste exacte des lignes qui nomment `interrupt_session` : ce ticket y ajoute la sienne, à relire sur `main` après 97. Famille `chantier` : 104, 102 et 100 font une PR de trois tickets, avec une montée de version ; celui-ci ouvre la suivante, après elle.

## Le besoin

Constat (7) de l'essai réel du régime 8 (journal de la carte, 2026-11-23, 19 h 41 UTC, et l'entrée « Fin de l'essai réel du régime 8 »). L'architecte a écrit au conducteur à 19:32 un changement de cadre ; le conducteur a ouvert la PR #12 vers le sujet à 19:39, avant que le message ne lui arrive. La PR a été remise en brouillon et `à-relire` retirée ; le Relecteur avait déjà créé une session de relecture, déclarée orpheline et archivée. Le journal conclut : « pour un changement de cadre, `priority: now` ».

Le besoin : **un message qui annonce ou empêche un geste arrive dans le tour en cours de la session visée**, et celui qui l'écrit vérifie ensuite, à la source, que le geste n'est pas passé avant.

## Ce qui a été établi

- `send_message` a un paramètre `priority`, à trois valeurs ; son schéma, vérifié par l'architecte le 2026-11-27, dit : `now` interrompt le tour en cours de la session visée ; `next` rejoint le tour en cours sans l'arrêter ; `later` attend la fin du tour. Sans lui, la session visée applique son ordre par défaut. Le message de 19:32 a attendu la fin d'un tour de sept minutes au moins.
- Aucun skill du plugin ne cite `priority` (`git grep` sur `main` à `b57eae7`, hors `docs/issues`).
- Arrêter une session a déjà son outil : `interrupt_session`, pour le gel d'un chantier (`skills/chaine/chantier/SKILL.md:113`) ; un Relecteur, lui, ne s'arrête que par l'archivage (ticket 97, `A-229`).
- Un message ne change jamais une règle : il nomme le travail (`architecte/SKILL.md:64`, « La procédure se donne en entier au lancement » ; « Ne jamais », `:124`, « Changer une procédure par message »).

## Quand le ticket est fait

1. `architecte/SKILL.md` § 5 a une puce « Un message dont l'ordre compte » : un message à un conducteur (ou à une session de ticket qu'il a lancée) qui change le cadre d'un geste que la session peut faire dans son tour (attendre une fusion avant d'ouvrir une PR, changer la base d'une branche, retirer un ticket d'une vague, ne pas pousser) part avec `priority: "next"`. Tout autre message part sans `priority`. La même puce dit qu'un tel changement de cadre (l'ordre d'un message) n'est pas une règle neuve : il nomme le travail, comme tout message (`:64`, « Ne jamais » `:124`).
2. La même puce dit : **jamais `priority: "now"`** pour empêcher un geste ; arrêter une session passe par `interrupt_session`, comme au gel, hors Relecteur, qui ne s'arrête que par l'archivage (ticket 97, `A-229`).
3. La même puce dit la vérification : après l'envoi, au tour suivant de l'auteur (la réponse, ou son réveil), le geste se lit à la source (la PR, `git ls-remote`) ; passé quand même, l'auteur le fait défaire par la même voie (un message), et le note au journal de la carte.
4. `chantier/SKILL.md` § 6 a la même règle, pour les messages du conducteur à ses filles, en un point, qui renvoie au texte de l'architecte pour la liste des cas.
5. Un banc de texte dans `scripts/bascule.test.mjs` tient les cas 1 à 4.
6. La note de version (la suivante de `main` au moment de livrer ; correctif : le troisième chiffre) le dit.

## Où

| Fichier (lignes sur `main` à `b57eae7`) | Ce qui change |
| --- | --- |
| `skills/chaine/architecte/SKILL.md`, après `:75` | la puce neuve (cas 1 à 3) |
| `skills/chaine/chantier/SKILL.md`, après `:97` (point 4) | « 4 bis. Un message dont l'ordre compte » (cas 4) |
| `scripts/bascule.test.mjs` | un test neuf, sur le modèle de celui des lignes 160 et suivantes (l'architecte) |
| `scripts/relecteur.test.mjs` (le test de la règle d'`interrupt_session`, posé par le ticket 97) | la puce neuve d'`architecte/SKILL.md` ajoutée à la liste exacte des lignes qui nomment `interrupt_session` (une ligne, celle qui contient « Un message dont l'ordre compte ») ; le point 4 bis de `chantier/SKILL.md` renvoie à l'architecte sans nommer l'outil |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante, la note |

Règles à lire : `architecte/SKILL.md` § 5 ; `chantier/SKILL.md`, « Arrêter un chantier ».

## Décisions

Décidée le 2026-11-27 par l'architecte : **`A-238`** (spec `relecture-independante.spec.md`). Ce qui suit l'applique ; rien n'y est à trancher.

1. **`A-238` — `priority: "next"` pour un message dont l'ordre compte, jamais `now`** (le journal de l'essai disait `now`). Raison : `next` fait lire le message dans le tour en cours, ce qui suffit à empêcher le geste suivant ; `now` interromprait le tour, peut-être au milieu d'une commande qui écrit (un `sujet.sh`, un push), et l'arrêt d'une session a déjà son outil, `interrupt_session` (hors Relecteur : l'archivage, `A-229`). Un message ordinaire reste sans `priority` : en mettre partout ôterait au paramètre son sens.
2. **La vérification à la source après l'envoi** : le schéma dit que `next` rejoint le tour en cours, pas à quel moment de ce tour le message est lu (« Ce qui n'a pas été établi »). L'auteur juge sur l'état de la PR, jamais sur la réponse seule (« Dire vrai », `architecte/SKILL.md:109`).
3. **Les lignes du Relecteur, des filles et du capitaine** restent sans `priority` : elles disent un état, elles n'empêchent aucun geste.
4. **Un changement de cadre n'est pas une règle neuve** : le message nomme le travail, l'ordre de son arrivée seul change (`architecte/SKILL.md:64`, « Ne jamais » `:124`) ; une procédure qui doit changer se change toujours dans le skill.

## À faire, dans l'ordre

1. Partir de `main` à jour, la PR de 104, 102 et 100 fusionnée ; relire chaque ligne citée ici sur `main` (102 a changé `architecte/SKILL.md:75-84` et `chantier/SKILL.md` § 6).
2. Le test neuf de `scripts/bascule.test.mjs`, vu rouge.
3. Les deux textes ; chaque fichier reste sous deux cents lignes.
4. Le banc vert, les mutations, la version et la note, la suite entière.

## Surfaces

| Surface | Preuve |
| --- | --- |
| l'architecte : `priority: "next"`, ses cas, les autres messages sans `priority` | `scripts/bascule.test.mjs`, test neuf ; M1, M2 |
| jamais `now` pour empêcher un geste, `interrupt_session` pour arrêter, hors Relecteur ; le changement de cadre n'est pas une règle neuve | le même test ; M3, M6 |
| la vérification à la source après l'envoi | le même test ; M4 |
| le conducteur, pour ses filles, renvoie à l'architecte | le même test ; M5 |

## Mutations

Toutes rouges sous le test neuf :

- M1 : `next` remplacé par `now` dans la puce de l'architecte.
- M2 : « Tout autre message part sans `priority` » retiré.
- M3 : la phrase « jamais `priority: "now"` » retirée.
- M4 : la vérification à la source retirée.
- M5 : le point 4 bis de `chantier/SKILL.md` retiré.
- M6 : « hors Relecteur » retiré de la phrase d'`interrupt_session`.

## Vérification

1. `node --test scripts/bascule.test.mjs` : le test neuf rouge avant, vert après.
2. `wc -l skills/chaine/architecte/SKILL.md skills/chaine/chantier/SKILL.md` : chacun sous deux cents lignes.
3. `env -u NODE_PATH pnpm test` : la suite entière, sortie 0.

## Ce qui n'a pas été établi

- **Le moment exact où `next` est lu** dans un tour en cours (entre deux appels d'outil, ou plus tard) : non sondé. Une sonde coûte deux sessions ; elle n'est pas demandée. Si l'essai suivant montre un message `next` lu après le geste, la décision se revoit (`now`, avec ses risques).
- **Ce que `now` fait d'une commande en cours** : non sondé, et c'est la raison de ne pas l'employer.

## Hors périmètre

- Les messages au produit (`AskUserQuestion`) : ils n'ont pas de priorité.
- Le gel et l'arrêt d'un chantier : `interrupt_session`, inchangé.

## Comments
