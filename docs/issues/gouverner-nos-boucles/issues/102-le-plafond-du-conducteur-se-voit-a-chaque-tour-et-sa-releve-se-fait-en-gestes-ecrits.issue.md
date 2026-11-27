# Le plafond du conducteur se lit à chaque tour, et l'architecte le lit aussi ; sa relève par un conducteur de suite se fait en gestes écrits

Status: needs-info
Type: défaut
Modèle: sonnet — du texte dans `chantier/SKILL.md` et `architecte/SKILL.md`, et un banc de texte ; rien à coder ; les règles sont les décisions `A-237` et `A-241` (1), (2) et (6). Le déclencheur de la relève (décision du produit à chaque fois, ou relève d'office) est une question posée au produit le 2026-11-27 (« La question ») : **tant que sa réponse n'est pas versée dans la spec, le ticket reste `needs-info` et ne se commence pas.** Qui veut changer une décision l'écrit à son lanceur, il ne tranche pas.
Blocked by: 104
Dépendances: —
Fichiers chauds: `skills/chaine/chantier/SKILL.md` (§ 0, point 2, ligne 22 ; le titre du § 6, ligne 86 ; § 6, points 0, 0 bis et 1 bis, lignes 88, 89 et 91 à 94 ; « Ne jamais », ligne 134) ; `skills/chaine/architecte/SKILL.md` (§ 5, lignes 75 et 78 à 84 ; « Archiver », ligne 86) ; `scripts/bascule.test.mjs` (ligne 78, et un test neuf ; l'assertion de la ligne 95 lit le texte entre « 1. `node scripts/docs/avancement.mjs` » et « 1 bis. **Plafonds.** », qui ne se renomment pas) ; `.claude-plugin/plugin.json` et `NOTES-DE-VERSION.md`. **Une PR pour 104, 102 et 100, dans cet ordre, une seule montée de version** : 104 touche `chantier/SKILL.md` aux lignes 67, 96, 98 et 102, `architecte/SKILL.md` aux lignes 76, 105 et 108, et `scripts/bascule.test.mjs` aux lignes 81, 87, 113, 207 et 218 ; 100 (`Blocked by: 102`) touche `chantier/SKILL.md` aux lignes 82, entre 89 et 90, et « Ne jamais ». Le ticket 97 touche `architecte/SKILL.md` aux lignes 66 et **86** : sa phrase sur le Relecteur et celle de ce ticket sur un conducteur relevé (cas 7) entrent dans le même paragraphe, relire `main` après 97. Le ticket 103 (`Blocked by: 102`) touche `architecte/SKILL.md` § 5 après la ligne 75 : il part après cette PR.

## Le besoin

Constat (12) de l'essai réel du régime 8 (journal de la carte, 2026-11-23, 20 h 48 UTC, et l'entrée « Fin de l'essai réel du régime 8 »). Le seuil `contextePilote` du jouet est 400 000 tokens. À 20:35, `get_session` donnait 647 540 tokens au conducteur, « vu tard par le conducteur lui-même (contrôle à ses réveils manqué) ». Aucune autre session ne l'a vu avant lui. Décision du produit, 20:47 : **un conducteur de suite, dès l'entrée de la PR #13** ; passation dans la carte du chantier. La relève s'est faite (journal, 21 h 26 et 21 h 37) : passation poussée par `sujet.sh carte`, conducteur de suite lancé par l'architecte, lignes de situation des tickets envoyées hors dépôt, ancien conducteur et ancien Relecteur archivés après la reprise. L'ancien conducteur finissait à 711 289 tokens.

Le besoin : **le dépassement se voit au tour où il arrive, par deux sessions** ; et **la relève, une fois déclenchée, suit des gestes écrits**, dans un programme comme sans programme, au lieu d'être reconstruite à chaque fois.

## La cause, à la source (`main` à `b57eae7`, plugin 8.5.0)

1. `skills/chaine/chantier/SKILL.md:86` : le § 6 est « Suivi (à chaque réveil) » ; le contrôle des plafonds (`:91`, point 1 bis) n'a lieu qu'au réveil de 45 minutes. Les tours ouverts par une ligne ou un message (Relecteur, filles, architecte) ne le font pas, et ce sont eux qui ont fait monter le contexte pendant la vague 3. `:94` le dit déjà : « une session peut dépasser un peu avant d'être vue » ; l'essai a dépassé de 247 540 tokens.
2. `skills/chaine/architecte/SKILL.md:78-84` : le contrôle de vie de l'architecte relève chaque conducteur par `get_session` à chacun de ses réveils, et y cherche quatre signes ; le contexte n'en est pas un. Le conducteur est seul à se juger.
3. `chantier/SKILL.md:93` : « Si le produit décide une session de suite : la passation dans la carte (état, phase, vague en cours, décisions ouvertes), puis la session de suite lancée avec le nom du sujet ». Qui la lance, ce que fait l'ancien conducteur, ce que fait le nouveau à sa reprise (les filles en vie, la ligne `Conducteur:`, les demandes déjà écrites qui nomment l'ancien, ses PR ouvertes, le Relecteur dont la ligne « Architecte : » nomme l'ancien sans programme) ne sont pas dits. § 0, point 2 (`:22`), reprend à la phase de la carte sans rien de plus.
4. `architecte/SKILL.md:86` : l'architecte n'archive une session qu'« après avoir lu par `get_session` qu'elle a fini (`completed`, aucune PR ouverte qui l'attende) ». Un conducteur relevé a souvent des PR ouvertes (cadrage, documentation) : la règle telle qu'écrite ne l'archive pas.

## Quand le ticket est fait

1. **L'ordre d'un tour** (`chantier/SKILL.md` § 6, point 0, `:88`) : **à chaque tour, quel qu'en soit le motif** (réveil, ligne, message), le gel d'abord (inchangé : gelé, « Arrêter un chantier ») ; libre, **son propre contexte** : `get_session` sans argument, `context_usage.used_tokens` comparé à `contextePilote` (point 1 bis, « Le conducteur au plafond ») ; puis le motif du tour : un réveil, le point 0 bis et la suite ; une ligne, lue à la source. Le titre du § 6 le dit : « ## 6. Suivi (à chaque réveil ; à chaque tour, le gel puis son contexte) ». Le point 0 bis commence par « Première action du réveil libre, son contexte lu ».
2. **Le premier tour** (même point) : `get_session` peut y rendre `used_tokens: 0` (journal de la carte, 2026-11-14, 7 h 40 UTC) ; le contrôle vaut à partir du deuxième tour, et le premier tour se tient court.
3. **Le sien à chaque tour, celui des filles à chaque réveil** (`:91-94`) : le point 1 bis dit les deux cadences ; `:94` devient « Le contexte du conducteur se relève à chaque tour (point 0) ; celui des filles à chaque réveil, soit toutes les 45 minutes : une fille peut dépasser un peu avant d'être vue. » `contexteFille` ne change pas ; `chaine-de-production.md:90` (« contrôlé par le conducteur à chaque réveil ») non plus.
4. **L'architecte** (`architecte/SKILL.md` § 5, contrôle de vie, `:78-84`) : après les quatre signes, un relevé de plus, **le contexte de chaque conducteur**, comparé à `contextePilote` de `.claude/chaine.json` d'`origin/develop` de son dépôt (sans la clé, 400 000) ; atteint, et absent de `## Dépassements` de la carte du chantier, l'architecte le traite comme un plafond signalé par le conducteur (`:75`). L'architecte, lui, n'a toujours pas de plafond (`P-25`).
5. **La relève** (`chantier/SKILL.md:93`, « Le conducteur au plafond »), une fois déclenchée (« La question »), en gestes, dans cet ordre :
   1. **l'ancien conducteur écrit la passation** dans une section `## Passation` de la carte du chantier (le gabarit `carte.map.md` n'en a pas ; le gate `tickets` admet toute section) : état, phase, vague en cours, décisions ouvertes, sessions en vie avec leur PR, réveils armés, **ses propres PR ouvertes**, **sa ligne de coût** (`get_session` sur lui-même, rôle `conducteur`, aussi écrite dans `## Coût`) ; sans programme, **le prompt de son successeur** (cas 6) ; il la pousse par `sujet.sh carte <nom>`, supprime ses propres réveils (`list_triggers`, `delete_trigger`), écrit « relève prête » à l'architecte (sans programme : au produit, par `AskUserQuestion` : « ouvre le conducteur de suite depuis l'application, avec le prompt de la passation ») et finit son tour sans autre geste ;
   2. **dans un programme, l'architecte lance le conducteur de suite** (`architecte/references/lancement.md`, « Le conducteur d'un chantier », le nom du sujet en argument, une ligne de situation « conducteur de suite de <ancien> ») ; **sans programme, le produit l'ouvre depuis l'application**, sur le dépôt, en mode « Auto », avec le prompt de la passation : une session lancée par `create_session` depuis une session qui n'est pas un architecte n'a pas de produit devant elle (`A-241` (2)) ;
   3. **le conducteur de suite, à sa reprise** (§ 0, point 2, qui renvoie ici) : la ligne `Conducteur:` de la fiche à son identifiant (`sujet.sh carte`), une ligne au journal ; son identifiant écrit à chaque fille en vie (`send_message`, après `get_session` sur elle : ticket 104), dont les demandes suivantes le portent ; **les PR ouvertes de l'ancien passent à lui** : il en suit les lignes, les arbitrages et les demandes neuves, qu'il écrit à son nom ; l'ancien nommé « à archiver » à l'architecte (sans programme : au produit), après la reprise ;
   4. **sans programme, le Relecteur** : l'ancien, dont la ligne « Architecte : » nomme l'ancien conducteur, est nommé « à archiver » au produit avec lui (« Relecteur <id> à archiver : relève du conducteur », `A-231`) ; le conducteur de suite attend que `get_session` le dise archivé, puis en lance un neuf (`lancement.md`, « Le Relecteur d'un dépôt ») et change la ligne `Relecteur:` de la fiche ;
   5. **dans un programme, les lignes vers l'ancien** : les demandes déjà écrites qui le nomment ne se récrivent pas (une demande ne se modifie jamais) ; les lignes du Relecteur vers lui, une fois l'ancien archivé, échouent et arrivent à l'architecte (« send_message en échec vers <session> », `relecteur/SKILL.md`, « Les lignes ») ; l'architecte en relaie le texte, tel quel, au conducteur de suite.
6. **Le prompt du successeur sans programme**, que l'ancien écrit dans `## Passation` et que le produit colle dans la session qu'il ouvre. Il parle **au conducteur de suite** ; « moi » y est le produit, qui lit la session : le successeur lui répond dans la session et lui pose ses questions par `AskUserQuestion`, comme tout conducteur sans programme. Texte exact, les chevrons remplis par l'ancien :

   ```text
   Tu es le conducteur de suite du chantier <nom>, sans programme : tu succèdes au conducteur <session_id de l'ancien>, relevé au plafond de son contexte. Ton rôle est le skill chantier de maj-skills, avec pour argument le nom du sujet, sans le préfixe sujet/ : <nom> ; la suite de ce message sont tes consignes.
   Outils : ton premier geste, avant tout autre, est de charger send_message par ToolSearch, requête « select:mcp__claude-code-remote__send_message » : tes filles en ont besoin. S'il ne se charge pas, dis-le dans ta première réponse et arrête-toi.
   Skills : <la ligne « Skills : » du conducteur d'un chantier, architecte/references/lancement.md, « écris-le-moi (send_message) » remplacé par « dis-le dans ta réponse »>
   Version : <la ligne « Version : » du même bloc, « écris-moi (send_message) » remplacé par « dis dans ta première réponse »>
   <les lignes de consignes du prompt de l'ancien conducteur, telles quelles, s'il en avait>
   Sujet : sujet/<nom>. Carte du chantier : <chemin> (branche sujet/<nom>) ; sa section ## Passation est ta reprise (chantier/SKILL.md § 6, point 1 bis, « Le conducteur au plafond »).
   Relecteur : l'ancien, <session_id>, nomme ton prédécesseur sur sa ligne « Architecte : ». Nomme-le-moi à archiver avec ton prédécesseur, attends que get_session le dise archivé, puis lance un Relecteur neuf (architecte/references/lancement.md, « Le Relecteur d'un dépôt »).
   ```

7. **`architecte/SKILL.md:86`** (« Archiver ») : un conducteur relevé s'archive sur sa ligne « à archiver », ses PR ouvertes passées au conducteur de suite : elles ne l'attendent plus ; son coût est déjà dans `## Passation` et `## Coût`.
8. **`architecte/SKILL.md:75`** : un plafond de conducteur vu par l'architecte (cas 4) ; le lancement du conducteur de suite (geste 2) et le relais des lignes (geste 5), selon la réponse du produit (« La question »).
9. Un banc de texte dans `scripts/bascule.test.mjs` tient les cas 1 à 8 et les phrases de la colonne choisie (« La question ») ; `:78` suit le titre neuf.
10. La note de version le dit (une montée pour 104, 102 et 100 : ticket 104, « À faire », étape 6).

## Où

| Fichier (lignes sur `main` à `b57eae7`) | Ce qui change |
| --- | --- |
| `skills/chaine/chantier/SKILL.md:86` | le titre du § 6 (cas 1) |
| `skills/chaine/chantier/SKILL.md:88` (0) | l'ordre d'un tour, le premier tour (cas 1, 2) |
| `skills/chaine/chantier/SKILL.md:89` (0 bis) | « Première action du réveil libre, son contexte lu » |
| `skills/chaine/chantier/SKILL.md:91-94` (1 bis) | les deux cadences (cas 3) ; la relève en gestes à la place de la phrase de `:93` (cas 5, 6), selon la colonne choisie |
| `skills/chaine/chantier/SKILL.md:22` (§ 0, point 2) | la reprise d'un conducteur de suite renvoie au geste 3 |
| `skills/chaine/chantier/SKILL.md:134` (« Ne jamais ») | selon la colonne choisie |
| `skills/chaine/architecte/SKILL.md:75` | cas 8, selon la colonne choisie |
| `skills/chaine/architecte/SKILL.md:78-84` | le relevé du contexte des conducteurs (cas 4) |
| `skills/chaine/architecte/SKILL.md:86` | le conducteur relevé (cas 7) |
| `scripts/bascule.test.mjs:78` | `entre(texte, "## 6. Suivi (à chaque réveil ; à chaque tour, le gel puis son contexte)", "## Arrêter un chantier")` |
| `scripts/bascule.test.mjs` | un test neuf, sur le modèle de celui des lignes 76 à 123 |

Règles à lire : `chantier/SKILL.md` § 6, points 0 et 1 bis ; `architecte/SKILL.md` § 5 et § 6 (« Changer d'architecte », le modèle d'une passation et d'une session de suite ouverte par le produit) ; `architecte/references/lancement.md`, « Le conducteur d'un chantier » et « Le Relecteur d'un dépôt ».

## Décisions

Décidées le 2026-11-27 par l'architecte : **`A-237`** et **`A-241`** (1), (2) et (6) (spec `relecture-independante.spec.md`). Ce qui suit les applique ; rien n'y est à trancher, hors « La question ».

1. **`A-237` — Le plafond du conducteur se lit à chaque tour, par lui, et à chaque réveil de l'architecte ; la relève a ses gestes.** Le dépassement de l'essai s'est fait entre deux réveils, dans des tours ouverts par des lignes ; un `get_session` par tour coûte une lecture ; un second lecteur rend l'oubli d'un seul sans suite. Les gestes sont ceux qui ont marché le 2026-11-23, plus ce qui a manqué : les réveils de l'ancien supprimés avant son arrêt (un réveil qui sonne réveille une session archivée), l'identifiant du nouveau donné aux filles, et les lignes des demandes déjà écrites. **Pas de seuil d'alerte avant le plafond** : le contrôle à chaque tour le voit au tour où il arrive.
2. **`A-241` (1) — L'ordre d'un tour** : le gel, puis son propre contexte, puis la ligne qui l'a ouvert, lue à la source ; le contexte des filles se relève à chaque réveil seulement (`contexteFille` inchangé).
3. **`A-241` (2) — Sans programme**, la relève ne se lance pas par `create_session` : l'ancien écrit la passation et le prompt du successeur, le produit l'ouvre depuis l'application ; l'ancien Relecteur est archivé par le produit (`A-231`) et le successeur en lance un neuf ; les PR ouvertes de l'ancien passent au successeur ; son coût s'écrit dans la passation avant l'archivage. Le conducteur ne s'archive pas lui-même (`P-62`).
4. **`A-241` (6) — La question au produit** porte un tableau à deux colonnes (« La question ») ; sans réponse versée dans la spec, le ticket reste `needs-info`.
5. **Un plafond ne coupe toujours rien** (`chantier/SKILL.md:91`) : aucune session n'est interrompue ; ce qui déclenche la relève est la réponse à « La question ».

## La question (au produit, par l'architecte, posée le 2026-11-27)

**Au plafond du conducteur, la relève se décide-t-elle à chaque fois, ou se fait-elle d'office ?** Aujourd'hui (`chantier/SKILL.md:93`, `A-44`), le conducteur se signale et le produit décide. `P-3` disait « un conducteur, à 400 000 tokens, passe la main à une session de suite », et le produit a décidé la relève le 2026-11-23, « dès l'entrée de #13 ». Recommandation de l'architecte : **d'office**, au premier moment calme (aucune PR du conducteur lui-même en relecture, aucune vague en cours de lancement), le produit informé en une ligne. Conséquence : une question de moins au produit à chaque plafond ; le coût d'un conducteur neuf (relire la carte) à chaque fois.

Les phrases qui changent, selon la réponse ; le reste du ticket est le même dans les deux cas. Chaque ligne a son assertion dans le test neuf, et sa mutation rouge.

| Phrase (`main` à `b57eae7`) | « À chaque fois » (le produit décide) | « D'office » | Assertion ; mutation |
| --- | --- | --- | --- |
| décision 5 de ce ticket | « la relève ne se fait qu'une fois décidée par le produit, et l'ancien conducteur continue jusque-là » | « la relève se fait d'office au premier moment calme ; l'ancien conducteur continue jusque-là » | — (le ticket, pas un texte de skill) |
| `chantier/SKILL.md:91`, « **Un plafond ne coupe rien** […] elle continue pendant que le produit décide » | inchangée | « […] une fille continue pendant que le produit décide ; le conducteur continue jusqu'au premier moment calme, puis passe la main » | la phrase de la colonne ; Mc1 : l'autre colonne remise |
| `chantier/SKILL.md:93`, « Si le produit décide une session de suite : […] » | « Si le produit décide une session de suite, la relève, en gestes : » | « Au premier moment calme (aucune de ses propres PR en relecture, aucune vague en cours de lancement), la relève, en gestes, le produit informé en une ligne : » | « d'office » : `au premier moment calme` présent, et avant le geste 1 ; « à chaque fois » : `Si le produit décide une session de suite` présent, `au premier moment calme` absent du fichier ; Mc2 : la phrase de l'autre colonne |
| `chantier/SKILL.md:134`, « Ne jamais » : « Interrompre une session pour un plafond, une fille comme soi-même : il se signale, le produit décide. » | inchangée | « Interrompre une session pour un plafond, une fille comme soi-même : une fille se signale et le produit décide ; le conducteur passe la main au premier moment calme, sans s'interrompre. » | la phrase de la colonne ; Mc3 : « il se signale, le produit décide » remis sous « d'office » |
| `architecte/SKILL.md:75`, « **Un plafond signalé par un conducteur** […] renvoie sa décision telle quelle » | « […] et renvoie sa décision telle quelle ; une relève décidée : il lance le conducteur de suite sur « relève prête », et relaie les lignes vers l'ancien (`chantier/SKILL.md` § 6, point 1 bis) » | « […] le plafond d'une fille, dans la forme de § 2, sa décision renvoyée telle quelle ; celui d'un conducteur, une ligne d'information au produit : la relève se fait d'office ; il lance le conducteur de suite sur « relève prête », et relaie les lignes vers l'ancien » | la phrase de la colonne ; Mc4 : « relève prête » retiré |
| la colonne « Décision du produit » de `## Dépassements` (`chantier/SKILL.md:92-93`, gabarit `carte.map.md:46`) | la décision du produit, « à trancher » jusque-là | pour le conducteur, « relève d'office » dès la ligne écrite ; pour une fille, la décision du produit. La colonne garde son nom : le gate `tickets` ne lit que la première cellule (`tickets-regles.mjs:359-363`) | « d'office » : `relève d'office` dans « Le conducteur au plafond » ; Mc5 : « à trancher » remis pour le conducteur |

Sur « au premier moment calme » : sous « d'office », l'assertion exige l'expression à `:93` et à `:134`, et à aucune autre ligne du § 6 ; sous « à chaque fois », elle l'exige absente de `chantier/SKILL.md` et d'`architecte/SKILL.md`.

## À faire, dans l'ordre

1. **La réponse à « La question »**, versée dans la spec (`A-n` ou `P-n`) : sans elle, ne pas commencer. Puis passer le ticket à `ready-for-agent`, la colonne choisie nommée sous `## Comments`.
2. Partir de la branche de la PR de 104, 102 et 100, le ticket 104 fait.
3. `scripts/bascule.test.mjs:78` au titre neuf ; le test neuf, vu rouge.
4. Les textes de `chantier/SKILL.md`, puis d'`architecte/SKILL.md` ; chacun reste sous deux cents lignes.
5. Le banc vert, les mutations ; la version et la note se font une fois pour les trois tickets (ticket 104, « À faire », étape 6).

## Surfaces

| Surface | Preuve |
| --- | --- |
| l'ordre d'un tour (gel, contexte, motif), à chaque tour ; le premier tour | `scripts/bascule.test.mjs`, test neuf ; M1, M2, M3 |
| le sien à chaque tour, celui des filles à chaque réveil | le même test ; M4 |
| le contexte des conducteurs au contrôle de vie de l'architecte | le même test ; M5 |
| la relève : passation (PR ouvertes, coût, prompt sans programme), réveils supprimés, lancement (programme : l'architecte ; sans : le produit), reprise, filles prévenues, PR passées, archivage après la reprise | le même test ; M6, M7, M8, M9 |
| sans programme, l'ancien Relecteur archivé avant le neuf | le même test ; M10 |
| les lignes vers l'ancien conducteur relayées par l'architecte | le même test ; M11 |
| un conducteur relevé s'archive, ses PR passées | le même test ; M12 |
| la colonne choisie de « La question » | le même test ; Mc1 à Mc5 |
| « 1 bis. **Plafonds.** » et la phrase du point 1 tiennent ; le titre du § 6 suivi | `scripts/bascule.test.mjs:78`, `:95` |

## Mutations

Toutes rouges sous le test neuf :

- M1 : « à chaque tour » remis en « à chaque réveil » au point 0.
- M2 : le contexte lu avant le gel (l'ordre du point 0 inversé).
- M3 : la phrase du premier tour (`used_tokens: 0`) retirée.
- M4 : « celui des filles à chaque réveil » remplacé par « à chaque tour ».
- M5 : le relevé du contexte des conducteurs retiré du contrôle de vie de l'architecte.
- M6 : la suppression des réveils de l'ancien conducteur retirée.
- M7 : « dans un programme, l'architecte lance le conducteur de suite » retiré.
- M8 : « sans programme, le produit l'ouvre depuis l'application » remplacé par « l'ancien le lance par `create_session` ».
- M9 : l'identifiant du conducteur de suite non écrit aux filles.
- M10 : le Relecteur neuf lancé avant que `get_session` dise l'ancien archivé.
- M11 : le relais des lignes en échec retiré.
- M12 : la phrase du conducteur relevé retirée de « Archiver ».

## Vérification

1. `node --test scripts/bascule.test.mjs` : le test neuf rouge avant, vert après ; celui des lignes 76 à 123 vert avant et après, `:78` au titre neuf.
2. `wc -l skills/chaine/chantier/SKILL.md skills/chaine/architecte/SKILL.md` : chacun sous deux cents lignes.
3. `env -u NODE_PATH pnpm test` : la suite entière, sortie 0.

## Ce qui n'a pas été établi

- **La réponse du produit** à « La question » : posée le 2026-11-27, pas encore versée.
- **Entre « relève prête » et l'archivage**, l'ancien conducteur est vivant : une ligne du Relecteur ou d'une fille qui le nomme le réveille, au lieu d'échouer. Ce qu'il en fait n'est pas écrit (la relayer au successeur, ou à l'architecte) ; à trancher par l'architecte si l'essai suivant le montre.
- **Combien de tours ouverts par des lignes** le conducteur de l'essai a eus entre deux réveils : le jouet n'est pas lisible d'ici. La cause 1 se lit au texte ; sa part dans les 247 540 tokens n'est pas mesurée.
- **Si `get_session` rend `used_tokens: 0` au premier tour** sur les versions d'aujourd'hui : constaté le 2026-11-14, pas rejoué.

## Hors périmètre

- Le plafond des filles (`contexteFille`) : inchangé.
- Le plafond de l'architecte : il n'en a pas (`P-25`).
- L'arrêt et le remplacement d'un Relecteur hors relève (ticket 97, `A-229`, `A-231`, `A-232`).
- Ce qui réveille le conducteur, et la ligne traitée au tour qu'elle ouvre : ticket 100.

## Comments
