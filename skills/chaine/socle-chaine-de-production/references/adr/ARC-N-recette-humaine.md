# ARC-{{N}} — Chaque module passe une recette humaine : inventaire validé par le produit, tests rouges, tickets, avant tout correctif

- Statut : **accepté**
- Date : {{DATE}}
- Portée : les tests, les sessions de l'assistant, la mise en recette d'un module

## Contexte

Les garde-fous relisent une unité : un gate lit un fichier, la revue adversariale lit un diff, un test prouve une méthode. Aucun ne compare deux écrans, ne rejoue deux clics, ni ne parcourt la machine à états d'un objet de bout en bout. Les défauts qui vivent aux coutures du produit passaient jusqu'à la recette du client, où ils coûtent le plus. Un premier passage sur un module, mené par une session selon cette méthode, a trouvé vingt-huit défauts candidats, dix-huit tests rouges sur vingt-quatre, treize tickets, dix corrigés en une PR. Tous des défauts de couture : deux surfaces, deux chemins, deux fonctions jumelles, deux requêtes simultanées, ou un trou de la machine à états. Coût : deux jours de session, huit sous-agents.

## Décision

**Chaque module passe une recette humaine, menée par une session selon le skill `recette-humaine`, en quatre phases avec un arrêt obligatoire après la première.**

1. **Inventaire** (`docs/recette/<module>/inventaire.md`) : rôles, objets et états, table état × geste, surfaces, invariants, saisies à risque, gestes coûteux, temps, traitements sans écran, définitions en double, quinze premiers tests, défauts candidats, questions au produit. Chaque ligne cite sa source. **Aucune règle n'est inventée** : une règle sans source, ou deux sources qui se contredisent, deviennent une question. **Quinze questions numérotées au plus.**
2. **Validation par le produit.** Rien ne s'écrit avant.
3. **Tests de recette**, nommés `recette.*` : ils écrivent l'attendu de l'inventaire, jamais le comportement observé. Un rouge est un défaut, posé en `it.skip` avec son ticket ; le correctif retire le `skip` sans changer l'attendu. Un test qui clignote est une course réelle jusqu'à preuve du contraire.
4. **Tickets** : une spec de défauts et un ticket prêt pour agent par défaut confirmé. **Rien n'est corrigé dans la branche de recette** : les correctifs passent par la chaîne ordinaire.

**Quand.** Avant la mise en recette d'un client sur un module qu'il utilisera, ou après une série de specs qui a remanié un module ; un module par passage, l'argent, les courriels et les places d'abord. **Dans la session, jamais en CI.**

## Alternatives écartées

- **La recette par le client seul** — c'est le moment le plus coûteux ; la recette humaine la précède, elle ne la remplace pas.
- **Des E2E exhaustifs** — ils prouvent un parcours, pas un invariant entre surfaces ni une course ; lents.
- **Plus de gates** — un gate lit la syntaxe ; « deux écrans disent la même chose » ne se lit pas dans un fichier.
- **Corriger au fil de l'inventaire** — la session corrige alors ce qu'elle croit, sans source ni validation ; l'arrêt après l'inventaire est la pièce maîtresse.
- **Un inventaire sans limite de questions** — un produit ne répond pas à quarante questions ; il répond à quinze marquées.

## Conséquences

Les défauts de couture se trouvent avant la recette du client, avec leur test de régression. Les trous de spec deviennent des questions sourcées. En échange : deux jours de session par module, un dossier `docs/recette/<module>/` à tenir, des `it.skip` visibles tant qu'un ticket attend, quinze réponses du produit par module.

Mode d'emploi : skill `recette-humaine` et sa `methode.md`.
