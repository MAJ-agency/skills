# Chaîne de production par agents

Le vocabulaire de la méthode que ce dépôt pose dans les projets : qui tient quel rôle quand plusieurs sessions d'agent construisent un logiciel en parallèle.

## Language

### Rôles

**Produit**:
La personne qui tranche ce qui change la vie des utilisateurs, le coût ou le délai, et qui répond du résultat.
_Avoid_: client, humain, PO

**Architecte**:
La session unique d'un programme qui mène l'amont — questions au produit, décisions, specs — et qui est seule à parler au produit.
_Avoid_: conducteur (ancien sens, cartes d'avant le 2026-11-13), architecte de chantier

**Conducteur de chantier**:
La session qui fait tourner un chantier à partir d'une spec validée : elle découpe les tickets, lance les sessions filles et les suit.
_Avoid_: architecte (ancien sens, cartes d'avant le 2026-11-13), chef de chantier

**Session fille**:
La session qui réalise un ticket, et un seul, puis s'arrête.
_Avoid_: worker, sous-agent (un sous-agent vit dans la session qui le lance)

**Capitaine de fusion**:
Une session qui fait entrer les PR prêtes dans la branche d'intégration, une par une ; plusieurs peuvent tenir la même file.
_Avoid_: merger, intégrateur

### Travail

**Programme**:
Un ensemble de chantiers qui servent un même objectif et partagent un architecte.
_Avoid_: projet, épopée

**Chantier**:
Un lot de tickets issu d'une spec, mené par un conducteur de chantier et livré en une fois.

**Responsable**:
La personne nommée qui répond d'un chantier ou d'un programme.
_Avoid_: sprint, lot

**Branche gardée**:
Une branche qu'aucune session n'écrit elle-même : un sujet (`sujet/…`), `develop`, `main` ou la branche par défaut, sous toutes leurs graphies ; le capitaine y entre par ses scripts, le conducteur un sujet par `sujet.sh`. Une seule définition (`brancheGardee`) sert les hooks pour `git push`, `gh` et les outils GitHub.
_Avoid_: branche protégée (réglage côté GitHub)

**Fusion sans effet**:
Une fusion jouée par le capitaine qui n'apporte à un fichier gardé par un hook du projet que des lignes sans effet (`fusionsSansEffet` du contrat, lu sur develop) ; son commit porte la mention que le hook attend. Un changement réel n'en porte aucune.
_Avoid_: dispense, exemption

**Plafond**:
La limite de mémoire de travail au-delà de laquelle une session est signalée au produit, qui décide ; elle n'est jamais interrompue pour cela.
_Avoid_: budget, quota

**Règle d'ascendance**:
La vérification, juste avant chaque fusion, que la PR a été testée sur l'état de la branche où elle entre ; une PR en retard est mise à jour et retestée, sans exception.
_Avoid_: « à jour » au sens du réglage de GitHub

**Verrou du passage**:
Le commentaire marqué `<!-- capitaine:passage <id> <epoch> -->` qu'un capitaine pose sur une PR au début de son passage et termine à sa sortie, TERM et INT compris, même pendant sa pose ou sa relecture : un autre capitaine saute la PR tant qu'il vit (90 minutes depuis sa date, le plus tard de l'epoch de la marque, réécrit à chaque rafraîchissement, et de sa création : au moins 90 minutes depuis sa pose). Il évite le travail en double, la règle d'ascendance garde la sûreté. En code : `prendre_passage`, `rafraichir_passage`, `finir_passage` (`github.sh`), signés par `CAPITAINE_ID`.
_Avoid_: verrou de la boucle (le `flock`, local à un clone)
