# Tickets 80 à 82 (lot 6, bascule en 8.0.0) : le tour unique de relecture

Relu le 2026-11-22 par un agent neuf, en lecture seule, sur la branche `claude/hopeful-lovelace-ouk6tz` au sommet `8e55e3d`, contre `main` à `97d17e3` (plugin 7.39.0), dans un clone neuf, Node 22.23.5.

**Conclusion : prêts après retouches.** Un bloquant, cinq à corriger, huit mineurs. Chaque retouche est écrite, jouée et verte : `retouches-lot-6.diff` (sur l'arbre du patch), `lot-6-retouche.patch` (le patch entier régénéré, 32 fichiers, les gestes du ticket 80 § 2 rejoués dessus depuis `97d17e3` rendent le même arbre), `retouche-ticket-82.diff` (le texte de l'essai réel, sur le ticket).

## Ce qui a été joué

| Essai | Rendu |
| --- | --- |
| Somme du patch | `ec8fbaad…0bf0c`, égale au ticket |
| § 1 : les cinq bancs seuls sur `97d17e3` (`git apply -3 --include='*.test.mjs'`) | sortie 0, « Falling back to direct application » ; 5 fichiers ; **18 rouges** : bascule 9/9, depot 4/69, veille-du-capitaine 2/4, avancement 1/9, settings-json 2/24, les mêmes tests que le ticket nomme |
| § 2 : le patch, puis `git checkout HEAD --` des deux fichiers de version, puis `note-et-version.mjs` | `git apply -3` sortie 0, aucun conflit ; `7.39.0 → 8.0.0` ; `32 files changed` |
| Les cinq bancs après | **115 sur 115** |
| Échantillon de 15 mutations de l'annexe (B3 B7 B9 B12 B17 B20 B24 B26 B31 B36 V2 V5 A2 A4 S4) | 15 rouges sur 15 (`echantillon-annexe-15.txt`) |
| Les 55 de l'annexe, après les retouches | 55 rouges sur 55 (`mutations-annexe-apres-retouches.txt`) |
| Neuf mutations à moi (`mutations-relecteur.mjs`), sur le patch | **1 rouge sur 9** : R1 à R7 et R9 vertes (`mutations-relecteur-sur-le-patch.txt`) |
| Les mêmes, après les retouches | 9 rouges sur 9 ; deux de plus jouées à la main sur les retouches (R10 cadrage, R11 réveil), rouges |
| La suite entière, sur le patch | voir « Comptes » |

## Constats

| # | Ticket | Gravité | Objet |
| --- | --- | --- | --- |
| 1 | 81 | **bloquant** | `chantier` § 3, point 5 (« Lancer ») fait poser `à-fusionner` par le conducteur sur sa PR de cadrage, en régime 8 aussi ; aucun skill ne lui dit comment ses propres PR demandent leur relecture (`A-94` : « ses propres PR passent par `à-relire` »), et § 6.5 lui interdit de poser `à-relire` |
| 2 | 80 | à corriger | Le réveil de secours (`chaine-de-production.md` § 5, étape 7) prend le cas `fusion-bloquée` alors que la PR renvoyée garde `fusion-bloquée` pendant toute sa relecture : la fille « corrige et redemande » à chaque réveil |
| 3 | 81 | à corriger | `chantier` § 3 (« Fichiers sensibles : l'accord avant le code ») et § 6.5 ne disent pas « régime 8 » : un conducteur d'un dépôt pas encore reposé (tous, jusqu'au lot 7) lit 8.0.0 dans le marketplace et demanderait l'accord du produit, ou poserait `à-relire` sur une PR en contre-revue |
| 4 | 82 | à corriger | L'essai réel ne joue pas ce que les tickets 80 et 81 lui renvoient (contestation et arbitrage, réveil de secours, décision de plafond, `à-relire` posé par le conducteur), ni une PR sensible qui passe ; son cas 12 monte un dépôt sans la clé mais avec les documents du régime 8 ; les cas 2 et 3 ne se jouent pas tels qu'écrits ; le refus du capitaine sur un contenu changé n'est pas montré ; les réglages du produit ne sont pas listés |
| 5 | 80 à 82 | à corriger | Huit trous dans les bancs : R1 (`archive_session` dans « Ne jamais »), R2 (le sha entier de la demande), R3 (le réveil qui écrit au conducteur), R4 (`depuis` écrit après l'ouverture, `A-195` point 2), R5 (la fille d'un ticket `Label: contre-revue` livre sans `à-fusionner`, dans `regime-7.md`), R6 (le conducteur pose `à-relire`, pas `à-fusionner`), R7 (une lecture illisible n'est pas un renvoi), R9 (une clé `relecture` à `null` lue absente par le gate) |
| 6 | 80 | à corriger | La note dit « rien, tant que sa repose n'est pas faite » : un projet qui repose `chaine-de-production.md`, le fragment ou `issue-tracker.md` sans la clé reçoit des documents du régime 8 alors que ses PR sont en 7 ; la note ne le dit pas |
| 7 | 82 | mineur | L'ADR neuve, point 5 : « l'architecte, si la cause est technique » ne tient pas `A-89` (l'architecte décide pour une fille ou le conducteur ; la cause technique ne vaut que pour le conducteur sans programme) |
| 8 | 82 | mineur | L'ADR neuve, point 6 : « Trois gardes la lisent » n'en nomme que deux |
| 9 | 80 | mineur | La note écrit « comme en 7.39.0 » : faux si les tickets 75 à 79 sont entrés avant (7.40.0) ; et elle ne dit pas que le capitaine n'archive plus, en régime 7 aussi |
| 10 | 80 | mineur | § 1 : sur un `main` plus récent, les totaux par fichier (« 4 sur 69 ») peuvent croître ; le ticket ne dit pas que ce sont les mêmes 18 tests qui comptent |
| 11 | 81 | mineur | `lancement.md`, « Archiver un capitaine » : la garde déjà supprimée par le capitaine lui-même (`fusionner`, Fin de passage) rend `delete_trigger` introuvable, sans geste dit |
| 12 | 81 | mineur | `chantier` § 0, point 4 : « aucune fille ne part avant sa fusion » alors que `socle-tests` est désormais un ticket, donc une fille ; et la PR de pose du socle sur un dépôt sans la chaîne est « relue, comme les autres » alors qu'elle est en régime 7 (sa base n'a pas la clé) |
| 13 | 80 | mineur | § 0 : « sur `main` si la PR de documentation y est entrée » laisse choisir la source des annexes ; dire `git show origin/main:<chemin>` quand le fetch de la branche échoue |
| 14 | 80 | mineur | `A-87`, « une session de relecture remplacée au plafond de contexte se signale au conducteur » : la ligne du Relecteur arrive au conducteur, `chantier` ne dit pas s'il la remonte comme un plafond |

## Retouches (toutes jouées)

Les constats 1, 2, 3, 5, 6, 7, 8, 9 (note) et 11 sont dans `retouches-lot-6.diff` (7 fichiers, +22 −15, sur l'arbre du patch) et `lot-6-retouche.patch` (le patch entier, à substituer à `lot-6.patch` ; la note 8.0.0 que lit `note-et-version.mjs` y est déjà retouchée). Les cinq bancs y sont verts (115 sur 115), les 55 mutations de l'annexe rouges, mes neuf mutations rouges.

1. **Constat 1.** `chantier` § 3, point 5 : « PR de cadrage hors brouillon (`update_pull_request`). En régime 8 (la clé `relecture` dans `.claude/chaine.json` de `origin/sujet/<nom>`), sa relecture se demande comme celle d'une fille (`chaine-de-production.md` § 5, étape 5 : le commentaire `À relire — sommet <sha> — Session: <la sienne> — Conducteur: —`, puis `à-relire` par `issue_write`), jamais `à-fusionner` ; en régime 7, label `à-fusionner` (`issue_write`). » § 4 : le capitaine squashe la PR de cadrage « et, en régime 8, son tour de relecture validé ; sur `à-reprendre`, le conducteur lit le verdict, corrige ou conteste (l'architecte arbitre ; sans programme, le produit) et redemande la relecture ». § 6.5 : « Sur la PR d'une fille, le conducteur ne pose ni ne retire jamais `à-fusionner`, `à-relire` ou `à-reprendre`, hors le cas sans étiquette ci-dessous ; ses propres PR (cadrage, documentation, nettoyage) demandent leur relecture comme celle d'une fille, avec `Conducteur: —`. » Le banc exige les deux phrases.
2. **Constat 2.** Étape 7 : « `fusion-bloquée` sans `à-relire`, lire le renvoi du capitaine, corriger, redemander la relecture ». Le banc exige la forme. C'est `A-115` (le Relecteur ne regarde pas `fusion-bloquée` sans `à-relire`) appliqué au réveil ; `A-86` est à préciser d'autant.
3. **Constat 3.** `chantier` : « **Fichiers sensibles : l'accord avant le code.** En régime 8, un ticket qui touche… », « en aperçu, en régime 8 avec la section `## Fichiers sensibles` », et, après le titre du § 6.5, « (Régime 8 ; une PR en régime 7 suit `references/regime-7.md`.) ».
4. **Constat 4.** `retouche-ticket-82.diff` : un paragraphe « Ce que le produit fait d'abord » (les deux dépôts privés, `develop` protégée, l'accès GitHub, l'environnement) et « L'ordre » (le cas 12 le jour de la fusion) ; le cas 2 joué par une session de relecture interrompue dont l'architecte écrit le verdict, sans message ; le cas 3 en deux temps (Relecteur actif : règle 3, cause c ; Relecteur interrompu : renvoi du capitaine) ; un cas 4 bis (le capitaine renvoie un contenu changé) ; le cas 12 récrit, **le régime 7 sous 8.0.0** sur la copie d'Anchorpost avant sa repose ; six cas neufs, 18 à 23 (contestation et arbitrage ; réveil de secours, ses trois branches ; PR sensible accordée, effort `xhigh` et `/security-review: lancée` ; `à-relire` posé par le conducteur ; décision de plafond et quatrième tour ; PR de cadrage relue et livraison du sujet sans verdict).
5. **Constat 5.** Neuf assertions de plus (`bascule.test.mjs`, `settings-json.test.mjs` : `{ "relecture": null }` refusé, du côté sûr) ; R1 à R9 rouges.
6. **Constat 6 et 9.** La note : « comme dans la version précédente, aux textes près (les skills `chantier`, `architecte`, `fusionner` et `sujet` renvoient à `regime-7.md`). Les documents posés (`chaine-de-production.md`, le fragment `CLAUDE.md` de la fusion, `issue-tracker.md`) ne décrivent que le régime 8 : ils ne se reposent qu'avec la clé, par la repose, jamais seuls. » ; et « le capitaine … n'archive plus aucune session, en régime 7 aussi (`P-62`) ».
7. **Constats 7 et 8.** L'ADR : le plafond selon `A-89` ; les trois gardes nommées (`sujet.sh fusionner`, `passer.sh`).
8. **Constat 11.** « aucune sous ce nom, ou `delete_trigger` qui la dit introuvable : le capitaine l'a déjà supprimée, rien de plus ».

Non retouchés, à écrire dans le ticket s'ils sont retenus : 10 (« les rouges sont ces 18 tests ; un total par fichier peut croître de ce que 75 à 79 ajoutent »), 12, 13, 14.

## Les cinq questions du tour

1. **Le besoin.** 6a, 6b et 6c sont portés une fois chacun ; `A-182` point 3 (le gate, avec la clé seulement), `A-185` points 2 et 8, `A-187` point 3, `A-194` point 4 (mineurs 8, 9, 11, et 12, 13 du second tour) et le régime 8 dans `fusionner` y sont. Rien de glissé hors du lot. Manque, côté besoin : les propres PR du conducteur (constat 1).
2. **Les décisions.** `A-195` points 1 à 8 et sa liste de caducs sont tenus. Une contradiction : `A-94` (constat 1). `A-86` est suivi à la lettre là où il produit une boucle (constat 2). Le régime 7 de `main` tient pour un projet sans la clé dans les scripts (lot 5) et dans les skills, à deux réserves : `chantier` § 3 et § 6.5 non marqués (constat 3), et les documents s'ils sont reposés seuls (constat 6). Changent en régime 7 aussi, et la note doit le dire : le conducteur et le capitaine n'archivent plus (`P-62`), le socle posé sur un dépôt à chaîne devient un ticket seulement en régime 8 (dit).
3. **Les skills joués par Sonnet.** 136, 131, 139, 108 lignes ; `lancement.md` 128, `regime-7.md` 57. La tête « Deux régimes » est la même dans les quatre et se lit sans ambiguïté ; les liens relatifs mènent au fichier (banc). Qui archive (l'architecte), qui écrit le verdict (la session de relecture), qui fusionne (le capitaine), qui pose `à-relire` (l'auteur ; le conducteur sur une PR sans étiquette ; l'architecte pour une PR d'une personne ou d'un outil ; le Relecteur, règle 3 cause c) : cohérents d'un skill à l'autre. Restait à improviser : la PR de cadrage (1), la PR renvoyée en relecture (2), le régime d'une PR pour un conducteur de dépôt mixte (3).
4. **Ce que les tickets supposent de `main`.** Vérifié sur `97d17e3`. Sur un `main` plus récent, le § 2 dit sans geste à improviser quoi faire (conflits permis sur les deux fichiers de version, remis par `git checkout HEAD --`, puis `note-et-version.mjs` ; tout autre conflit arrête), à deux mineurs près (9 et 10).
5. **L'essai réel.** Joué par l'architecte, après la fusion, sur un dépôt jouet et une copie d'Anchorpost, preuves par lien de commentaire ou ligne du journal : le cadre est bon, mais les 17 cas ne suffisent pas (constat 4). Une PR relue, refusée, reprise, validée, fusionnée : oui (1). Une PR sensible : seulement refusée (7), pas une qui passe en régime sensible. Une double relecture : oui (9). Le plafond : la distribution arrêtée (8), pas la décision qui la reprend.

## Questions à l'architecte

1. **Le régime 7 vécu sous 8.0.0 avant l'essai.** Dès la fusion, les sessions des projets vivants lisent les skills 8.0.0 dans le marketplace (ligne « Version : » des prompts), en régime 7, avant que l'essai le montre. Recommandation : jouer le cas 12 récrit le jour même, en premier ; sinon, retenir la fusion jusqu'à une fenêtre où aucun chantier ne tourne.
2. **`Conducteur:` sur une PR du conducteur.** Recommandation : `—` ; il est l'auteur, les lignes à l'auteur lui arrivent déjà, et l'arbitre est l'architecte (`A-88`).
3. **`A-86` précisé** : le cas `fusion-bloquée` du réveil de secours ne vaut que sans `à-relire`. Recommandation : l'écrire comme décision (`A-196`).
4. **Les documents reposés seuls.** Recommandation : la phrase de la note (constat 6) ; un refus mécanique (le skill qui pose un document du régime 8 sans la clé) attend le lot 7 ou le nettoyage.
5. **Le cas 2 de l'essai** : l'architecte écrit un verdict à la place d'une session interrompue, comme le cas 6 le fait déjà. Recommandation : ainsi ; c'est le seul moyen sûr de supprimer le message.

## Comptes

- Rouges avant : 18 (5 fichiers). Verts après : 115 sur 115. Après les retouches : 115 sur 115.
- Mutations : annexe, 15 sur 15 en échantillon, 55 sur 55 après retouches ; les miennes, 1 sur 9 sur le patch, 9 sur 9 après retouches, plus 2 sur 2 sur les retouches.
- Suite entière : **1 396 sur 1 396**, aucun sauté, 1 439 s, sortie 0, sur le patch tel quel (`suite.txt`). Les retouches ne touchent que deux bancs, rejoués seuls (115 sur 115), et des textes : la suite n'a pas été rejouée sur elles.
- Constats : 1 bloquant, 5 à corriger, 8 mineurs.
- Temps : environ 30 minutes, de 07 h 28 à 07 h 56 UTC, dont 24 minutes de suite en tâche de fond.
