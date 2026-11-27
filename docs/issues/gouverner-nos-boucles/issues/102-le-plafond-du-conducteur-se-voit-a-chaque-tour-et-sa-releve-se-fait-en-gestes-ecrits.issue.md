# Le plafond du conducteur se lit à chaque tour, et l'architecte le lit aussi ; sa relève par un conducteur de suite se fait en gestes écrits

Status: needs-triage
Type: défaut
Modèle: sonnet — du texte dans `chantier/SKILL.md` et `architecte/SKILL.md`, et un banc de texte ; rien à coder ; la règle est la décision `A-237` (proposée, à confirmer par l'architecte). Le déclencheur de la relève (décision du produit à chaque fois, ou relève d'office) est une question au produit, que ce ticket ne tranche pas (« La question »). Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 101
Dépendances: —
Fichiers chauds: `skills/chaine/chantier/SKILL.md` (§ 0, point 2, ligne 22 ; § 6, points 0 bis et 1 bis, lignes 89 et 91 à 94) ; `skills/chaine/architecte/SKILL.md` (§ 5, lignes 75 et 78 à 84) ; `scripts/bascule.test.mjs` (un test neuf ; l'assertion de la ligne 95 lit le texte entre « 1. `node scripts/docs/avancement.mjs` » et « 1 bis. **Plafonds.** », qui ne se renomment pas) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. Le ticket 101 touche `chantier/SKILL.md` (lignes 67, 96, 98, 102) et `scripts/bascule.test.mjs` : il passe d'abord, d'où `Blocked by: 101`. Le ticket 100 touche `chantier/SKILL.md` entre les lignes 89 et 90 : après celui-ci, dans la même PR. Le ticket 97 touche `architecte/SKILL.md` aux lignes 66 et 86 ; le ticket 103, son § 5, après la ligne 75 : ce ticket avant 103 ; avec 97, seuls les fichiers de version se battent.

## Le besoin

Constat (12) de l'essai réel du régime 8 (journal de la carte, 2026-11-23, 20 h 48 UTC, et l'entrée « Fin de l'essai réel du régime 8 »). Le seuil `contextePilote` du jouet est 400 000 tokens. À 20:35, `get_session` donnait 647 540 tokens au conducteur, « vu tard par le conducteur lui-même (contrôle à ses réveils manqué) ». Aucune autre session ne l'a vu avant lui. Décision du produit, 20:47 : **un conducteur de suite, dès l'entrée de la PR #13** ; passation dans la carte du chantier. La relève s'est faite (journal, 21 h 26 et 21 h 37) : passation poussée par `sujet.sh carte`, conducteur de suite lancé par l'architecte, lignes de situation des tickets envoyées hors dépôt, ancien conducteur et ancien Relecteur archivés après la reprise. L'ancien conducteur finissait à 711 289 tokens.

Le besoin : **le dépassement se voit au tour où il arrive, par deux sessions** ; et **la relève, une fois décidée, suit des gestes écrits**, au lieu d'être reconstruite à chaque fois.

## La cause, à la source (`main` à `b57eae7`, plugin 8.5.0)

1. `skills/chaine/chantier/SKILL.md:86` : le § 6 est « Suivi (à chaque réveil) » ; le contrôle des plafonds (`:91`, point 1 bis) n'a lieu qu'au réveil de 45 minutes. Les tours ouverts par une ligne ou un message (Relecteur, filles, architecte) ne le font pas, et ce sont eux qui ont fait monter le contexte pendant la vague 3. `:94` le dit déjà : « une session peut dépasser un peu avant d'être vue » ; l'essai a dépassé de 247 540 tokens.
2. `skills/chaine/architecte/SKILL.md:78-84` : le contrôle de vie de l'architecte relève chaque conducteur par `get_session` à chacun de ses réveils, et y cherche quatre signes ; le contexte n'en est pas un. Le conducteur est seul à se juger.
3. `chantier/SKILL.md:93` : « Si le produit décide une session de suite : la passation dans la carte (état, phase, vague en cours, décisions ouvertes), puis la session de suite lancée avec le nom du sujet ». Qui la lance, ce que fait l'ancien conducteur, ce que fait le nouveau à sa reprise (les filles en vie, la ligne `Conducteur:`, les demandes déjà écrites qui nomment l'ancien) ne sont pas dits. `§ 0`, point 2 (`:22`), reprend à la phase de la carte sans rien de plus.

## Quand le ticket est fait

1. `chantier/SKILL.md` § 6 : **à chaque tour, quel qu'en soit le motif** (réveil, ligne, message), le premier geste est `get_session` sans argument et la comparaison de `context_usage.used_tokens` à `contextePilote`. Le titre du § 6 le dit (« Suivi (à chaque réveil) ; le plafond à chaque tour ») ; le point 1 bis garde son nom.
2. Le même point dit le premier tour : `get_session` peut y rendre `used_tokens: 0` (journal de la carte, 2026-11-14, 7 h 40 UTC) ; le contrôle vaut à partir du deuxième tour, et le premier tour se tient court.
3. `architecte/SKILL.md` § 5, contrôle de vie : un cinquième relevé, **le contexte de chaque conducteur**, comparé à `contextePilote` de `.claude/chaine.json` d'`origin/develop` de son dépôt (sans la clé, 400 000) ; atteint, et absent de `## Dépassements` de la carte du chantier, l'architecte le signale au produit comme un plafond signalé par le conducteur (`:75`). L'architecte, lui, n'a toujours pas de plafond (`P-25`).
4. `chantier/SKILL.md:93`, la relève, une fois décidée, en gestes, dans cet ordre :
   1. l'ancien conducteur écrit la passation (`## Passation` de la carte : état, phase, vague en cours, décisions ouvertes, sessions en vie avec leur PR, réveils armés), la pousse par `sujet.sh carte <nom>`, supprime ses propres réveils (`list_triggers`, `delete_trigger`), écrit « relève prête » à l'architecte (sans programme : au produit) et finit son tour sans autre geste ;
   2. **dans un programme, l'architecte lance le conducteur de suite** (`architecte/references/lancement.md`, « Le conducteur d'un chantier », le nom du sujet en argument, une ligne de situation « conducteur de suite de <ancien> ») ; **sans programme, l'ancien conducteur le lance lui-même** par `create_session`, sur le même gabarit sans les lignes du programme, puis le nomme au produit ;
   3. le conducteur de suite, à sa reprise (§ 0, point 2) : la ligne `Conducteur:` de la fiche à son identifiant (`sujet.sh carte`), une ligne au journal ; son identifiant écrit à chaque fille en vie (`send_message`), dont les demandes suivantes le portent ; l'ancien nommé « à archiver » à l'architecte (sans programme : au produit), après la reprise ;
   4. les demandes déjà écrites qui nomment l'ancien conducteur ne se récrivent pas (une demande ne se modifie jamais) : les lignes du Relecteur vers lui échouent et arrivent à l'architecte (« send_message en échec vers <session> », `relecteur/SKILL.md`, « Les lignes ») ; l'architecte en relaie le texte, tel quel, au conducteur de suite.
5. `architecte/SKILL.md` § 5 : le geste 2 (lancer le conducteur de suite) et le relais du geste 4.
6. Un banc de texte dans `scripts/bascule.test.mjs` tient les points 1 à 5.
7. La note de version (la suivante de `main` au moment de livrer ; correctif : le troisième chiffre) le dit.

## Où

| Fichier (lignes sur `main` à `b57eae7`) | Ce qui change |
| --- | --- |
| `skills/chaine/chantier/SKILL.md:86` | le titre du § 6 |
| `skills/chaine/chantier/SKILL.md:89` (0 bis) | le contrôle à chaque tour, et le premier tour (cas 1, 2) |
| `skills/chaine/chantier/SKILL.md:91-94` (1 bis) | « Le contrôle a lieu à chaque réveil » devient « à chaque tour » ; la relève en gestes (cas 4) à la place de la phrase de `:93` |
| `skills/chaine/chantier/SKILL.md:22` (§ 0, point 2) | la reprise d'un conducteur de suite renvoie au geste 3 |
| `skills/chaine/architecte/SKILL.md:75` | un plafond de conducteur vu par l'architecte ; le lancement du conducteur de suite (cas 3, 5) |
| `skills/chaine/architecte/SKILL.md:78-84` | le cinquième relevé du contrôle de vie (cas 3) |
| `scripts/bascule.test.mjs` | un test neuf, sur le modèle de celui des lignes 76 à 123 |
| `.claude-plugin/plugin.json`, `NOTES-DE-VERSION.md` | la version suivante, la note |

Règles à lire : `chantier/SKILL.md` § 6, point 1 bis ; `architecte/SKILL.md` § 5 et § 6 (« Changer d'architecte », le modèle d'une passation).

## Décisions

1. **`A-237` — Le plafond du conducteur se lit à chaque tour, par lui, et à chaque réveil de l'architecte ; la relève a ses gestes** (proposée). Raison : le dépassement de l'essai s'est fait entre deux réveils, dans des tours ouverts par des lignes ; un `get_session` par tour coûte une lecture ; un second lecteur rend l'oubli d'un seul sans suite. Les gestes de la relève sont ceux qui ont marché le 2026-11-23 (passation par `sujet.sh carte`, lancement par l'architecte, archivage après la reprise), plus ce qui a manqué : les réveils de l'ancien supprimés avant son arrêt (`architecte/SKILL.md:86` : un réveil qui sonne réveille une session archivée), l'identifiant du nouveau donné aux filles, et les lignes des demandes déjà écrites.
2. **Un plafond ne coupe toujours rien** (`chantier/SKILL.md:91`, « Ne jamais », `:134`) : la relève ne se fait qu'une fois décidée, et l'ancien conducteur continue jusque-là.
3. **Sans programme, l'ancien conducteur lance son successeur** : il lance déjà ses filles par `create_session`, et un chantier n'a qu'un dépôt. Il ne s'archive pas : le produit l'archive (`P-62`).
4. **Pas de seuil d'alerte avant le plafond** : le contrôle à chaque tour suffit à le voir au tour où il arrive ; un second seuil serait une règle de plus sans décision qui s'y attache.

## La question (au produit, par l'architecte)

**Au plafond du conducteur, la relève se décide-t-elle à chaque fois, ou se fait-elle d'office ?** Aujourd'hui (`chantier/SKILL.md:93`, `A-44`), le conducteur se signale et le produit décide. `P-3` disait « un conducteur, à 400 000 tokens, passe la main à une session de suite », et le produit a décidé la relève le 2026-11-23, « dès l'entrée de #13 ». Recommandation : **d'office**, au premier moment calme (aucune PR du conducteur lui-même en relecture, aucune vague en cours de lancement), le produit informé en une ligne. Conséquence : une question de moins au produit à chaque plafond ; le coût d'un conducteur neuf (relire la carte) à chaque fois. Si le produit répond « d'office », ce ticket change une phrase de `:93` (« si le produit décide » devient « au premier moment calme ») et le texte de `architecte/SKILL.md:75` ; le reste ne change pas.

## À faire, dans l'ordre

1. Partir de `main` à jour, le ticket 101 fusionné ; lire la réponse à « La question » dans la spec (`A-n` ou `P-n` versée par l'architecte).
2. Le test neuf de `scripts/bascule.test.mjs`, vu rouge.
3. Les textes de `chantier/SKILL.md`, puis d'`architecte/SKILL.md` ; chacun reste sous deux cents lignes.
4. Le banc vert, les mutations, la version et la note, la suite entière.

## Surfaces

| Surface | Preuve |
| --- | --- |
| le contrôle du conducteur à chaque tour, et le premier tour | `scripts/bascule.test.mjs`, test neuf ; M1, M2 |
| le contexte des conducteurs au contrôle de vie de l'architecte | le même test ; M3 |
| la relève : passation, réveils supprimés, lancement (programme ou non), reprise, filles prévenues, archivage après la reprise | le même test ; M4, M5, M6 |
| les lignes vers l'ancien conducteur relayées par l'architecte | le même test ; M7 |
| « 1 bis. **Plafonds.** » et la phrase du point 1 tiennent | `scripts/bascule.test.mjs:95` |

## Mutations

Toutes rouges sous le test neuf :

- M1 : « à chaque tour » remis en « à chaque réveil ».
- M2 : la phrase du premier tour (`used_tokens: 0`) retirée.
- M3 : le cinquième relevé de l'architecte retiré.
- M4 : la suppression des réveils de l'ancien conducteur retirée.
- M5 : « dans un programme, l'architecte lance le conducteur de suite » retiré.
- M6 : l'identifiant du conducteur de suite non écrit aux filles.
- M7 : le relais des lignes en échec retiré.

## Vérification

1. `node --test scripts/bascule.test.mjs` : le test neuf rouge avant, vert après ; celui des lignes 76 à 123 vert avant et après.
2. `wc -l skills/chaine/chantier/SKILL.md skills/chaine/architecte/SKILL.md` : chacun sous deux cents lignes.
3. `env -u NODE_PATH pnpm test` : la suite entière, sortie 0.

## Ce qui n'a pas été établi

- **Combien de tours ouverts par des lignes** le conducteur de l'essai a eus entre deux réveils : le jouet n'est pas lisible d'ici. La cause 1 se lit au texte ; sa part dans les 247 540 tokens n'est pas mesurée.
- **Si `get_session` rend `used_tokens: 0` au premier tour** sur les versions d'aujourd'hui : constaté le 2026-11-14, pas rejoué.

## Hors périmètre

- Le plafond des filles (`contexteFille`) : inchangé.
- Le plafond de l'architecte : il n'en a pas (`P-25`).
- La relève du Relecteur (ticket 97, `A-229`, `A-231`, `A-232`).

## Comments
