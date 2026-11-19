# Reprise — architecte A (le plugin), arrêt du 2026-11-19 vers 13 h UTC pour quota

Ce fichier suffit pour reprendre. Il remplace, pour l'état courant, [`2026-11-19-architecte-plugin.md`](2026-11-19-architecte-plugin.md), qui reste vrai pour le fond (rôle, consignes du produit, méthode). L'histoire est dans la carte, [`../map.md`](../map.md) : **ne jamais la lire en entier**, seulement son journal du 2026-11-19 par `grep -n "2026-11-19 —"`. Les décisions `A-73` à `A-137` et `P-64` sont dans la spec, [`../relecture-independante.spec.md`](../relecture-independante.spec.md).

## Deux façons de reprendre

- **La même session reprend** (le plus simple, rien n'est perdu) : le produit écrit « reprends » à `session_017ZgEwLrqQyenjLrzHpv1Kt` quand le quota est revenu. Elle relit ce fichier et suit « Quoi faire, dans l'ordre ».
- **Un nouvel architecte, sur un autre compte** : il ne peut écrire à aucune session nommée ici (« introuvable »). Il lit ce fichier, puis relance sur son compte ce qui est dit « à relancer ». Prompt d'ouverture, dépôt `MAJ-agency/skills`, mode « Auto », effort élevé :

  ```text
  /maj-skills:architecte gouverner-nos-boucles
  Tu reprends la partie A de ce programme : le plugin MAJ-agency/skills, chantier 3 « relecture indépendante ». Avant toute autre lecture, lis docs/issues/gouverner-nos-boucles/passation/2026-11-19-reprise-architecte-plugin.md, branche claude/compassionate-euler-st84s9. Ne lis jamais une carte en entier.
  ```

## Ce qui est fait et vérifié

- Plugin `main` : `a3c2a7c`, 7.31.0. Tickets 58 (PR 122) et 59 (PR 126) faits. Tous les tickets chauds de l'autre programme sont entrés (PR 133 la dernière) : plus rien ne retient les lots.
- Anchorpost : passé à l'architecte B (autre compte) le 2026-11-19, « la main est libre » écrite dans la carte du chantier (`80821897`). Plus aucune session de ce compte n'y tourne. Sa carte : [`../preuve-suffisante.architecte.md`](../preuve-suffisante.architecte.md).
- Décision du produit `P-64` : sessions de relecture sur Opus, effort moyen pour une PR ordinaire, effort extra pour une PR sensible ; Relecteur en effort moyen ; essai sur trois ou quatre défauts connus avant la bascule.

## Ce qui est en vol, et où chaque chose s'est arrêtée

| Objet | État exact | Geste suivant |
| --- | --- | --- |
| **PR 136** (ticket 56, plugin 7.31.1) | Sommet `db1ee8250f23e9ac46ce4dd264da3dda2f60d32b`, contre-relue, diff lu par l'architecte, **ordre de fusion posé** (commentaire et label `à-fusionner`), quatre contrôles verts, `mergeable_state: clean`. Attend le capitaine de `skills`. | Vérifier la fusion sur `main` (les quatre fichiers identiques au sommet), passer le ticket 56 à `Fait — PR 136`, archiver `session_017ZgEwJLmqmNSgMZ97RgCuy` (3,46 $ relevés). Si aucun capitaine ne tourne : en lancer un (`lancement.md`, procédure d'un dépôt sans la chaîne). |
| **PR 134** (ticket 60, plugin 7.32.0) | Sommet poussé `444d36706fa4a17f6cd8cc21d7b7cbceb1f0a010`, quatre contrôles verts. Contre-relecture : « conforme après retouches », un bloquant (`A-133`). Les retouches `A-133` à `A-136` sont **codées en local** dans `session_017ZgEwJ2orn8Y4sqpcjDNr1` (banc 43 sur 43, 171 mutations en cours), **pas encore poussées** ; elle pousse dès le vert et écrit son sommet. **Aucun ordre de fusion.** | (1) Lire son message de sommet ; si elle n'a pas poussé, lui dire de pousser. (2) Un agent neuf rejoue sur ce sommet : les six cas d'`A-133` (dans la spec), un tirage contre la bibliothèque `yaml` 2.9.1 avec les quatre traits, la lecture des fichiers de règle réels des dépôts locaux (aucun ne doit devenir « illisible »), la règle `safe.directory` d'`A-135`. (3) Une fois la PR 136 sur `main` : lui dire de fusionner `origin/main` (jamais de rebase) en gardant 7.32.0. (4) Contrôles verts, puis ordre de fusion : commentaire `à-fusionner au sommet <sha>` et label. (5) Fusion vérifiée, ticket 60 à `Fait`, session archivée, coût relevé. Les neuf puis trente-sept mutations ajoutées sont à porter au ticket 60 (elle les donne sur demande). |
| **Ticket 61** (lot 3d, le skill `relecture`) | Écrit, commité, joué par son rédacteur sur `a3c2a7c` (banc 16 tests, mutations 86 sur 86). Premier tour de relecture adversariale **interrompu**, verdict provisoire « prêt après retouches » : **quatre bloquants et six mineurs, écrits sous `## Comments` du ticket** (dont `A-137` non porté, un fichier sensible que la PR déclare index généré et qui sort du diff relu, la sortie 1 de `diff-revue.sh` lue à tort comme « diff vide », une installation en échec lue comme un refus). | Un rédacteur neuf porte ces dix retouches et rejoue le banc ; un relecteur neuf fait les tours 2 et 3 (finir ce que le premier n'a pas regardé, liste dans le ticket) ; puis la session du ticket (gabarit « session d'un ticket hors chantier », `Label: contre-revue`). Il n'attend pas le lot 2. |
| **Ticket 54** (lot 1, retrait de CODEOWNERS) | **Récrit sur `a3c2a7c`**, 2 099 lignes, `ready-for-agent` : le retrait est donné en 91 blocs appliqués tout ou rien par un script donné entier (arbre obtenu `5fde574ba0ae0d0d77dcf2560a10d6774e764777`, reproduit sur trois clones) ; 221 lignes dans 26 fichiers avant, 64 dans 7 fichiers gardés après ; 31 tests retirés avec leur raison, 4 ajoutés, 5 modifiés ; 13 mutations rouges. **La suite entière n'a pas été vue verte d'un seul tenant** (deux rouges dus à la charge de la machine, verts rejoués seuls). **Sept choix à trancher**, section « Décisions » et rendu du rédacteur : un refus de fusion faute de revue sort en 3 et arrête la boucle (l'origine disait 5) ; le faux `gh` garde `commentairesRefuses` ; version mineure ; un test tient le compte des clés du contrat ; `Blocked by: 56, puis 57` (le 57 peut être levé). | Trancher les sept choix, rejouer la suite au calme, relecture en trois tours par un agent neuf, puis session de ticket. Après la PR 136. |
| **Ticket 57** (une sous-PR à la fois par sujet) | **Récrit et joué en entier sur `a3c2a7c`**, 668 lignes, `ready-for-agent` : 1 079 tests verts avec le ticket, 14 mutations rouges, annexes A à E identiques à l'octet aux fichiers joués. Réponses retenues : une sous-PR en passage chez un autre capitaine (verrou, toute sortie 7) **tient** son sujet ; `fusionner` tient sur 5, 6, 7, 8, 11 et rend sur 0, 2, 3, 4 ; `relancer` tient sur 0, 5, 6, 7, 11. `veille.sh` entre dans le périmètre (sans retouche, une sous-PR qui attend n'est reprise par personne). **Sept choix à trancher** (rendu du rédacteur, sous `## Comments`) ; l'avis de l'architecte : les accepter, sauf la version 7.32.0 codée en dur dans le test de dépôt, à remplacer par la règle « version suivante de `main` ». | Trancher, relecture en trois tours par un agent neuf, rejouer `poses.test.mjs` au calme, puis session de ticket. `Blocked by: 56` : après la PR 136. |
| **Ticket 55** (lot 2) | Pas rejoué : `needs-info`, écrit sur `4a45634`. Il doit aussi faire accepter `Règles: —` par le gate. | À rejouer sur `main` après le 54 (fichiers communs). |

## Sessions vivantes de ce compte

- `session_017ZgEwJ2orn8Y4sqpcjDNr1` — ticket 60 (PR 134), ≈ 300 000 tokens ; consigne : pousser dès le vert, puis attendre.
- `session_017ZgEwJLmqmNSgMZ97RgCuy` — ticket 56 (PR 136), à l'arrêt, à archiver après la fusion.
- `session_017ZgEwMYpEPe9y3Vg1JHAPM` — capitaine de `skills`, veille à réveils espacés ; il doit prendre la PR 136.
- `session_017ZgEwLrqQyenjLrzHpv1Kt` — l'architecte A.
- Les sous-agents de l'architecte (rédacteurs et relecteurs) ont tous rendu et sont arrêtés (2026-11-19, 13 h UTC) : leur seul reste est dans les fichiers de tickets. Les outils du contre-relecteur de la PR 134 (tirages, dépôts jouets) sont dans le conteneur de l'architecte et ne sont pas versionnés.

## Quoi faire, dans l'ordre

1. PR 136 : vérifier la fusion, clore le ticket 56.
2. PR 134 : les cinq gestes du tableau.
3. Ticket 61 : relecture, `A-137`, puis sa session.
4. Tickets 54 et 57 : finir les rejeux, relire, lancer ; puis 55.
5. Écrire les tickets des lots 4 (le Relecteur), 5a à 5c, 6 (bascule 8.0.0), 7, 8, 9, chacun relu trois fois par un agent neuf. Le lot 4 reçoit : les lignes de `fusionner/references/CONTENU.md`, de `scripts/points-d-entree.test.mjs` et de l'arbre du `README.md` pour les trois calculs ; `relecture.ordinaire` et `relecture.sensible` (`A-128`) ; l'archivage des sessions de relecture (la garde du mode « auto » refuse aujourd'hui `archive_session` au conducteur) ; l'appel des calculs avec `pipefail` ; le cas d'une PR qui crée son ticket avec `Règles: —`.
6. Tickets du plugin notés, non écrits : `sujet.sh etat` et `rafraichir_sujets` laissent sans report un sujet sans commit propre après une livraison intermédiaire (`A-132`) ; plafond de 600 s de `scripts/poses.test.mjs` trop juste sur une machine chargée ; carte de chantier trop lourde ; veille de capitaine morte sans alerte ; `archive_session` refusé au conducteur ; fiche `tests.md` contre l'ADR sur la langue ; `meme-contenu.sh` (clone partiel nommé, `safe.directory`) ; lecture des blobs par sha dans `double-relecture.mjs` (1,6 s pour 2 000 règles).

## Règles de travail à ne pas perdre

- Ordre des versions sur `main` : 136 (7.31.1), puis 134 (7.32.0), puis les suivantes ; chaque ticket reprend `main` par un commit de fusion avant de livrer, jamais de rebase.
- Ordre de fusion dans `skills` : après contre-relecture par un agent neuf sur le code réel, un commentaire dont le corps est exactement `à-fusionner au sommet <sha de 40 caractères>`, une ligne vide, `---`, `_Generated by [Claude Code](https://claude.ai/code)_`, puis le label `à-fusionner`. Un push après l'ordre l'invalide.
- Pas plus de trois agents qui jouent une suite à la fois dans le conteneur de l'architecte ; chaque brief impose un dossier privé au chemin en dur (le dossier de travail est partagé).
- Dans le dépôt local partagé avec des agents, fusionner une référence nommée, jamais `FETCH_HEAD`.
- Sessions lancées : `permission_mode: "auto"`, modèle `claude-fable-5-2` jusqu'au 23 novembre, les deux phrases du produit sur les autorisations, les intangibles, jamais `git commit --amend`, aucun signal hors de ses propres processus, plus de push après la PR sans accord.
- Dépôt public : rien de privé, aucun nom de personne, aucun détail d'un projet client.
