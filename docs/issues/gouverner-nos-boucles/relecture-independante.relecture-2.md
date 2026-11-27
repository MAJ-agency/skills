# Seconde relecture de la spec du chantier 3 par un agent neuf — 2026-11-18

Relecture de la deuxième version de [`relecture-independante.spec.md`](relecture-independante.spec.md) (commit `9d22123`), par un agent en contexte vierge. Rapport brut, non retouché. La troisième version de la spec y répond.

---

**Verdict : pas prête.** Trois mécanismes ne marchent pas tels qu'écrits (l'accord sur la branche de cadrage, l'état « en relecture » sans étiquette, le passage des sessions déjà lancées), et le lot 5 n'a pas de chemin de livraison dans `skills`. Chacun se ferme par une retouche locale ; aucun ne rouvre une décision du produit. Des 23 constats de la première relecture : 13 fermés, 10 fermés à moitié, aucun resté ouvert.

Lu : la spec, le rapport, les lignes `P-6`, `P-38`, `P-41`, `P-47` à `P-58` de la carte, et le plugin sur `origin/main` (4a45634, 7.15.0) sous `skills/chaine/` et `skills/monorepo/`. Hors de ce périmètre, j'ai lu seulement `CONTEXT.md`, `.claude-plugin/plugin.json` et les noms de fichiers de `scripts/` et `.claude/` à la racine, que la spec cite. Pas de `graphify-out/` : lecture directe. Rien modifié, rien poussé. Chemins relatifs à `/home/user/skills/`, lignes sur `origin/main`. Sauf mention « supposé », chaque constat est vérifié dans le fichier cité.

## Bloquants

**N1 — La ligne `Sensibles:` de la fiche ne peut pas être sur le sujet quand la branche de cadrage en a besoin (`A-73`, `A-74`, `A-76`). B4 n'est fermé qu'à moitié.**
- `A-74` : la ligne se lit sur `origin/sujet/*`, jamais sur la branche de la session, et la fiche « arrive sur le sujet par `sujet.sh carte` ».
- `sujet.sh carte` ne crée pas une carte : il n'accepte qu'un `*.map.md` modifié en place, qui citait déjà le sujet avant le commit (`skills/chaine/sujet/scripts/sujet.sh` l.1243-1252).
- La carte naît dans la PR de cadrage elle-même (`skills/chaine/chantier/SKILL.md` l.41), et c'est cette même PR qui écrit `.claude/chaine.json` (l.61).
- Pas à pas : le sujet est ouvert, la carte est commitée sur `docs/<nom>-cadrage`. Le produit accorde. La fiche ne peut entrer sur le sujet que par la fusion de la PR de cadrage. Le hook refuse donc l'édition de `.claude/chaine.json`, et `sujet.sh fusionner` renvoie la PR (ligne non couverte).
- Même impasse pour la pose d'un socle par le conducteur, « du cadrage, pas un ticket » (`chantier/SKILL.md` l.22), qui touche `.github/workflows/**` et `scripts/**`.
- Seul cas qui marche : une carte déjà dans `develop` avant `ouvrir`.
- Il manque un chemin écrit, par exemple un cadrage en deux PR, avec l'ordre accord, fiche, édition.

**N2 — Une PR « en relecture » ne porte aucune étiquette, et le Relecteur ne liste que `à-relire` (`A-82`, `A-83`, `A-84`). B8 est retourné, pas fermé.**
- Pas à pas :
  1. Le Relecteur retire `à-relire`, écrit `Relecture — tour 1`, lance la session V.
  2. V écrit son verdict, puis son message au Relecteur se perd (`chantier/SKILL.md` l.92 : « son `send_message` n'arrive pas toujours »), ou le mode « auto » refuse d'agir sur lui (`skills/chaine/architecte/references/lancement.md` l.93), ou le Relecteur est relancé entre-temps.
  3. Au réveil, « il liste les PR ouvertes qui portent `à-relire` » : la PR n'y est pas. Elle reste sans étiquette, sans fin.
- Même fin si V meurt en plein tour : la clause « une session morte : il en lance une autre » ne peut jouer que sur une PR listée.
- Le repli de la spec (« il pose l'étiquette à la lecture du verdict lors de sa veille ») passe par ce même listage.
- Cet état ne se distingue pas d'une PR que personne n'a demandé à relire : `avancement.mjs` ne lit que les étiquettes (`skills/chaine/tickets/references/scripts/docs/avancement.mjs` l.112).
- La perte d'une étiquette par deux `issue_write` croisés tombe dans le même trou. « Relire la liste après l'avoir écrite » ne la détecte pas : A lit, B lit, A écrit et relit, B écrit et relit, chacun voit la sienne, celle de A a disparu.
- Le contenu du réveil de secours de l'auteur n'est pas écrit.

**N3 — `A-96` ne couvre que les sessions lancées après la bascule. B7 n'est fermé qu'à moitié.**
- Une session ne lit le marketplace qu'à son lancement (`lancement.md` l.11, ligne « Version : »). Un conducteur, un capitaine et des filles déjà lancés continuent donc en 7 : ils ne s'arrêtent pas à la bascule.
- La boucle du capitaine recopie `scripts/chaine` d'`origin/develop` à chaque tour (`skills/chaine/fusionner/scripts/boucle.sh` l.190-216).
- Pas à pas, vague en cours au moment où la repose entre dans `develop` :
  1. Le `revue-exigee.mjs` de la 8 est joué au tour suivant.
  2. Les filles en vol suivent le § 5 de leur branche, celui de la 7 : elles posent `à-fusionner` avec une section « Revue de ticket ».
  3. Renvoi « sans verdict ». Leur § 5 dit « remettre `à-fusionner` ». Trois renvois, puis état `humain`.
- Le conducteur de la 7 continue de contre-relire et de poser `à-fusionner` sur les tickets `Label: contre-revue` : même refus.
- Autre trou : une fille lancée après la bascule par un conducteur de la 7 joue sa ligne « Version : » et lit `revue-de-ticket/SKILL.md` dans le marketplace de la 8. La spec ne dit pas si ce fichier reste lisible et jouable.
- Rien n'est écrit pour une repose pendant un chantier ouvert.
- Supposé, à sonder : « la repose préparée avant la bascule » demande de poser depuis un plugin pas encore dans `main`. Je n'ai pas vérifié qu'un marketplace s'installe depuis une branche.

**N4 — Le lot 5 « n'entre dans `main` qu'entier », mais `skills` n'a ni `develop` ni sujet.**
- Le capitaine de `skills` ne fusionne que des PR vers la branche par défaut, en squash (`lancement.md` l.57).
- Des tickets « qui se suivent sur une même branche » donnent donc une seule PR, d'une trentaine de fichiers, relue une fois.
- Une PR par ticket vers la branche de travail n'a personne pour la fusionner. La relecture par ticket n'a pas de support.
- À écrire avant le découpage.

## À corriger

- **`A-96`, la ligne de tête.** Elle ne distingue pas « pas de `.claude/chaine.json` » de « contrat sans la clé ».
  - `skills` n'a que `.claude/settings.json` : un architecte ouvert sur `skills` avec le skill de la 8 s'arrête.
  - `chantier/SKILL.md` l.22 traite le contrat absent comme un socle à poser, pas comme un arrêt.
  - Si le skill `architecte` s'arrête lui-même, personne ne fait la repose.
  - Un architecte à plusieurs dépôts : la spec ne dit pas le contrat de quel dépôt.
- **Livraison d'un sujet et `à-fusionner`.** `A-82` dit que `sujet.sh livrer` « change son geste », `A-90` que la livraison n'a pas de verdict.
  - Si `livrer` ne pose plus `à-fusionner` (`sujet.sh` l.871), aucune livraison n'entre dans la file (`skills/chaine/fusionner/scripts/file.sh` l.96).
  - Une livraison renvoyée : `skills/chaine/sujet/SKILL.md` l.46 dit « remettre `à-fusionner` », et la spec ne dit pas qui.
- **`A-89`, la notion à définir.**
  - Elle existe, mais en deux calculs en ligne, liés à leur cas : `livraison_intermediaire` (`skills/chaine/fusionner/scripts/passer.sh` l.117-155) et `verifier_mise_a_jour` (`sujet.sh` l.602-651, propre à la forme « premier parent = sommet du sujet »). La première se généralise : l'arbre de la tête égale la fusion recalculée du `Sommet relu` avec le commit de base que la tête contient.
  - À écrire : la base du calcul, et les trois classes d'index de `passer.sh` l.130-150 (avec commande, sans commande, par motif). « Aux index générés près » laisserait entrer après verdict un index sans commande modifié, ou un fichier en trop sous un motif.
  - `sujet.sh fusionner` ne régénère rien sur une fusion propre (l.501-503) : un index modifié à la main entre tel quel dans le sujet. Ce n'est pas nouveau, la revue ne lit déjà pas les index.
  - Le Relecteur (`A-84`, lot 4) a besoin de la même fonction, écrite au lot 5. Deux calculs différents donneraient : le Relecteur repose `à-fusionner`, le capitaine renvoie, trois fois, puis `humain`. Elle a sa place au lot 3, avec le lecteur de verdict.
- **`A-87`, le compte.** « Se compte aux commentaires `Relecture — tour k` » et « au troisième verdict refusé » ne donnent pas le même nombre.
  - Un tour validé puis renvoyé par le capitaine compte-t-il ?
  - En double, deux refus d'un même tour font deux verdicts.
  - Une redistribution « sans compter » écrit un second commentaire de même `k`.
  - Une contestation (`A-86`) consomme un tour sans correction ; contestée au troisième refus, elle reste bloquée jusqu'à la décision de plafond.
  - Au plafond, la PR garde `à-relire` : c'est le signal que la spec donne à « Relecteur arrêté ».
- **`A-88`.**
  - Le capitaine prend le nombre de verdicts exigés dans le commentaire du Relecteur : la double relecture n'est tenue que par une session. B5 fermé à moitié.
  - Une règle devenue haute après l'écriture du ticket : la ligne manque sur le sujet, le Relecteur lit « 1 », le code entre avec une relecture. Le gate, lui, rougit des tickets qui ne sont pas ceux de la PR.
  - Le gate ne lit aujourd'hui que le nom du fichier de règle (`skills/chaine/tickets/references/scripts/verify/tickets.mjs` l.84-91). La criticité est dans l'en-tête YAML, valeur `high`, sous deux formes (`skills/chaine/tickets/references/gabarits/regle.md` l.21). Lecteur à écrire.
  - La ligne `Règles:` est facultative.
  - Le champ `code:` d'une règle (`regle.md` l.20) permettrait de reconnaître une PR sans ticket qui touche une règle haute : la spec ne s'en sert pas.
- **Transitions restantes (`A-82`, `A-83`).**
  - Qui retire `à-reprendre`, et un `à-fusionner` périmé, quand l'auteur repose `à-relire` : « aucune des trois » le laisse entendre, sans nommer l'acteur.
  - Ordre des écritures à la distribution : retirer l'étiquette avant d'avoir lancé la session et écrit le commentaire perd la PR si le Relecteur tombe entre les deux.
  - Session remplacée : « le note sur la PR » doit être un nouveau `Relecture — tour k` au format machine. Sinon le capitaine attend le verdict de la session morte.
- **Les mineurs.** Aujourd'hui « à corriger » veut dire écart à une règle écrite (`skills/chaine/revue-adversariale/references/prompt.md` l.25), corrigé ou laissé avec une raison (`skills/chaine/revue-de-ticket/SKILL.md` l.50).
  - Avec `A-80`, un tel écart entre sans réponse.
  - Le corriger après « validé » change le diff propre : renvoi compté du capitaine, ou nouveau tour.
  - Les prompts des axes rendent encore « à corriger » : le lot 3 ne les nomme pas.
- **PR de mise à jour (`A-90`).** `A-78` fait lire « le diff contre sa base », soit tout `develop`. Le capitaine juge la résolution et les retouches (`sujet.sh` l.648-650). À dire.
- **Scripts des deux skills retirés.**
  - `diff-revue.sh`, `chemins-sensibles.mjs`, `contexte-ticket.mjs` et le fichier de critères sont posés par leur `poser`.
  - Le socle invoque `/maj-skills:revue-adversariale poser` (`skills/chaine/socle-chaine-de-production/SKILL.md` l.33).
  - Aucun lot ne dit qui les pose ensuite, et ce `SKILL.md` n'est pas dans le lot 5.
- **`A-81`, la ligne `Relecteurs:`.**
  - `Capitaines:` est écrite par l'architecte (`lancement.md` l.97), sur une branche `docs/<nom>-programme` qui peut être dans un autre dépôt (`skills/chaine/architecte/SKILL.md` l.48).
  - Un Relecteur n'a qu'un dépôt : il ne peut ni s'y inscrire ni la lire.
  - Sans programme, la spec ne dit pas quelle carte de chantier.
  - Le filtre par tag de `list_sessions` reste dit refusé aux appels faits depuis une session (description de l'outil, lue, pas essayée). C7 fermé à moitié.
- **Accord sans relecture.** Une fois la carte sur le sujet, `sujet.sh carte` laisse le conducteur écrire lui-même la ligne `Sensibles:` de sa fiche, sans PR. C'est ce que le plugin évite pour `Dépendances:` (`skills/chaine/socle-chaine-de-production/references/docs-agents/chaine-de-production.md` l.70). `A-75` exige une PR relue pour un ticket, rien pour la fiche.
- **`skills` entre le lot 5 et le lot 7.** `A-92` retire l'effet de `Label: contre-revue` et récrit `lancement.md`, dont le gabarit du ticket hors chantier porte la procédure de `skills` (l.76, l.80). `skills` suit `main` aussitôt : ses PR n'ont plus de régime jusqu'au lot 7.
- **La clé `relecture` du gabarit `chaine.json` n'est dans aucun lot.** Elle doit arriver au lot 5, pas avant.
- **`A-95` contre le lot 2.** Les trois gardes de `A-76` changent le régime dès la repose suivante, hors interrupteur.

## Notes

- La session de relecture : la spec ne dit pas sur quelle révision elle est créée. Sur la tête de la PR, elle charge le `CLAUDE.md` et les hooks que la PR modifie.
- Sur chaque Edit, le hook devra lire le sujet par le réseau, comme `garde-commandes`. Il ne voit pas Bash, et `regles.mjs` lit le contrat de l'arbre de travail (l.24).
- Un commentaire de verdict édité après coup : non traité. La procédure de `skills` l'écarte (`updated_at` égal à `created_at`).
- Une PR sans session auteur (humain, Dependabot) : le format `À relire — Session:` ne la prévoit pas.
- Les étiquettes nouvelles demandent un administrateur avant la repose : l'outil GitHub ne crée pas d'étiquette (`skills/chaine/socle-chaine-de-production/references/labels.sh` l.7-8).
- La « Vérification d'ensemble » n'appartient toujours à aucun lot.
- `admin.md` l.30 : « Restrict deletions » vit dans la case retirée, `A-77` ne nomme que deux sous-règles à garder.

## 1. Les constats de la première relecture

| Constat | État | Réponse | Ce qui reste |
| --- | --- | --- | --- |
| B1 | fermé | `A-89` | définition à écrire (À corriger) |
| B2 | fermé | `A-90` | quel diff la session relit |
| B3 | fermé | `A-76` | — |
| B4 | à moitié | `A-73`, `A-74` | N1 |
| B5 | à moitié | `A-88`, `A-89` | compte tenu par le seul Relecteur |
| B6 | fermé | `A-77` | — |
| B7 | à moitié | `A-95`, `A-96` | N3, N4 |
| B8 | à moitié | `A-82` | N2, transitions |
| C1 | fermé | `A-79`, `A-80` | prompts encore en « à corriger » |
| C2 | à moitié | `A-86` | le tour d'une contestation |
| C3 | à moitié | `A-87` | méthode de compte |
| C4 | à moitié | `A-87` | PR au plafond invisible |
| C5 | fermé | `A-78` | — |
| C6 | fermé | `A-82` | — |
| C7 | à moitié | `A-81`, `A-83` | la ligne `Relecteurs:` |
| C8 | fermé | `A-75`, `A-81`, `A-86`, `A-87` | `A-88` sans programme, implicite |
| C9 | fermé | `A-73` à `A-75` | la fiche : N1 |
| C10 | fermé | `A-77` | — |
| C11 | à moitié | `A-83`, `A-85` | session au plafond remplacée sans le produit |
| C12 | à moitié | `A-82` | N2, ordre des écritures |
| C13 | fermé | `A-92` | — |
| C14 | fermé | `A-88` | limites assumées |
| C15 | fermé | `A-94` | l'ADR décrit la relecture dès le lot 2 |

## 3. Fidélité aux décisions du produit

Aucune décision déformée. Quatre points manquent à « À confirmer par le produit » :
- **`P-51`, `A-90`.** La phrase « elle ne contient que des PR déjà relues » est fausse pour une tête `sujet/*` : `passer.sh` la dispense sur son nom seul (l.158-160). Elle porte aussi les cartes poussées sans PR, lignes d'accord comprises.
- **`P-56`.** Une règle haute peut entrer avec une seule relecture dans trois cas : PR sans ticket (dit dans « ne ferme pas »), ticket sans ligne `Règles:`, règle classée haute après le ticket.
- **`P-47`.** Chaque repose du plugin touche des chemins sensibles et demandera son accord, fichier par fichier. Un correctif isolé sur un chemin sensible passe par deux PR relues.
- **`A-96`.** Entre la bascule et la repose, aucun lancement dans les trois projets : c'est un délai.

`P-55` : « son état tient dans des étiquettes » devient étiquettes plus commentaires, avec un état sans étiquette (N2). `P-53` : c'est le Relecteur qui arrête, mécanique.

## 4. Faits nouveaux sur l'existant

- **Faux :**
  - `A-74`, « arrive sur le sujet par `sujet.sh carte`, le seul geste qui écrit un sujet sans PR » : `carte` ne crée pas, et `geler` et `degeler` écrivent aussi (`sujet.sh` l.1117).
  - Lots : « 3 et 4 n'écrivent que des fichiers neufs », contredit par leurs propres listes.
  - `A-84`, l'exemple « renvoi pour un conflit d'index » : le capitaine ne renvoie pas, il met à jour (`passer.sh` l.240-245, `sujet.sh` l.512-536).
  - `A-90`, « reconnue comme aujourd'hui » : vrai pour `livraison/*` seulement.
- **Approximatifs :**
  - « La liste `exigeRevue` » est une fonction (`skills/chaine/fusionner/scripts/revue-exigee.mjs` l.206). La liste est `cheminExige` (l.177-203) et dépend de la base.
  - « Criticité haute dans son fichier » : `criticality`, `high`.
  - Vocabulaire : « `CONTEXT.md` avec le premier lot », mais il est au lot 3. Le fichier existe à la racine, section `## Language`, sans aucun terme de relecture.
- **Vrais :**
  - `garde-fichiers.mjs` existe ; il ne garde que Edit, Write, MultiEdit et NotebookEdit, et ne connaît aujourd'hui ni chemin sensible ni ticket.
  - `labels.sh` (« sept labels »).
  - `sujet.sh livrer` pose `à-fusionner` (l.871).
  - `depot-jouet.mjs` : il y en a deux, sous `sujet/scripts/` et sous `tickets/references/scripts/docs/`.
  - `references-agent-integrees.json` et sa liste de skills.
  - `Capitaines:` dans `skills/chaine/tickets/references/gabarits/programme.md` l.15.
  - `proprietaire.sh`.
  - La revue jugée avant la mise à jour (`passer.sh` l.185-188, `sujet.sh` l.737).
  - L'inventaire CODEOWNERS de `A-77` : complet contre une recherche sur tout le plugin.
- **Non vérifié :** le contenu des tests de `scripts/` à la racine (les noms existent), et la date de pose de CODEOWNERS.

## 5. Lots et ordre

- **Fichiers partagés par des lots dits « de front » :**
  - 1 et 4 : `admin.md`.
  - 1 et 3 : `README.md`, et sans doute les tests de `scripts/` qui connaissent les skills (supposé).
  - 3 et 4 : `plugin.json`, `README.md`, `references-agent-integrees.json`.
  - 2 et 4 : `architecte/SKILL.md` et `chantier/SKILL.md`, si le lancement du Relecteur est au lot 4.
- **Oubliés au lot 4 :** `plugin.json`, `README.md`, `references-agent-integrees.json`, `lancement.md` (fichier existant, que `A-81` nomme), `gabarits/carte.map.md` (cas sans programme), « sept labels » dans `socle-chaine-de-production/SKILL.md` (l.3, 68, 90).
- **Oubliés au lot 5 :** `socle-chaine-de-production/SKILL.md` l.33, `references/chaine.json`, les gabarits de ticket et de carte, le message de `demarrer` (`sujet.sh` l.452).
- **Dépendances manquantes :**
  - 3 après 2 : l'axe « chemin sensible » lit la ligne `Sensibles:`.
  - 4 après 3 : il lance le skill `relecture` et se sert du comparateur.
  - 7 n'est pas « dernier » pour `lancement.md` : voir « `skills` entre le lot 5 et le lot 7 ».
- **Lot 4 annoncé `A-81` à `A-88` :** les fichiers de `A-85` à `A-88` (gate, `couts.mjs`, `chantier`, `architecte`) sont au lot 5.
- **Lot 5 trop gros pour un ticket.** Coupes naturelles :
  - a. lecteur de verdict, comparateur, éligibilité dans `passer.sh` et `sujet.sh`, bancs ;
  - b. `renvoyer.sh`, `livrer`, messages ;
  - c. gate `tickets`, `couts.mjs`, `avancement.mjs`, gabarits ;
  - d. documents des sessions (`chaine-de-production.md`, fragments, `CLAUDE.md` racine, `conception.md`, `pieges.md`) ;
  - e. `chantier`, `architecte`, `lancement.md`, `fusionner`, `sujet` et la ligne de tête ;
  - f. retrait des points d'entrée, `poser`, version 8.0.0.
- **Peuvent sortir de la bascule, car ils ne font qu'ajouter ou relâcher :** le retrait de `## Rétro`, l'acceptation de `Relecture: double` et du rôle `relecture` par le gate, le comparateur.
