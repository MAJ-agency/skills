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
La session qui fait tourner un chantier à partir d'une spec validée : elle découpe les tickets, lance les sessions de ticket et les suit.
_Avoid_: architecte (ancien sens, cartes d'avant le 2026-11-13), chef de chantier

**Session de ticket**:
La session qui réalise un ticket, et un seul, puis s'arrête.
_Avoid_: fille, session fille, worker

**Capitaine de fusion**:
La session unique d'un dépôt qui fait entrer les PR prêtes dans la branche d'intégration, une par une.
_Avoid_: merger, intégrateur

### Travail

**Programme**:
Un ensemble de chantiers qui servent un même objectif et partagent un architecte.
_Avoid_: projet, épopée

**Chantier**:
Un lot de tickets issu d'une spec, mené par un conducteur de chantier et livré en une fois.
_Avoid_: sprint, lot

**Plafond**:
La limite de mémoire de travail ou de coût au-delà de laquelle une session est arrêtée ou passe la main.
_Avoid_: budget, quota
