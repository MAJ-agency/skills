# Suivi des tickets — markdown local sous `docs/features/`

Les issues et les specs de ce dépôt vivent en **fichiers markdown sous `docs/features/`**, versionnés avec le code. Il n'y a pas de tracker externe.

> **Pas de `.scratch/`, ni aucun dossier de travail hors de l'arbre.** Toute la documentation du dépôt vit sous `docs/`, triée par thème — les tickets sont de la documentation de feature comme le reste. Voir le tableau des thèmes dans [`../methode/nomenclature.md`](../methode/nomenclature.md).

Le jour où le dépôt aura un remote GitHub, rejouer `/mattpocock-skills:setup-matt-pocock-skills` pour basculer vers `gh`.

## Conventions

- Un dossier par feature : `docs/features/<feature-slug>/`
- La spec est `docs/features/<feature-slug>/<feature-slug>.spec.md` — le suffixe `.spec.md` rend le fichier reconnaissable hors contexte et trivial à chercher (`**/*.spec.md`)
- Les tickets d'implémentation sont **un fichier par ticket** : `docs/features/<feature-slug>/issues/<N>-<titre>.issue.md`, numérotés à partir de `1`, **sans zéro de tête**, dans l'ordre des dépendances (bloqueurs d'abord). Jamais un fichier unique regroupant tous les tickets.
- L'état de triage est une ligne `Status:` près du haut du fichier (les valeurs sont dans [`triage-labels.md`](triage-labels.md)).
- Les commentaires et l'historique de conversation s'ajoutent **en bas** du fichier, sous un titre `## Comments`.

**Une spec cite les règles métier, elle ne les formule pas.** Une règle découverte en écrivant une spec entre au registre `docs/metier/regles/` comme `candidate`, avec son identifiant, et la spec y renvoie (« implémente `LIC-3` »). La feature est du travail en cours ; la règle est ce qui reste vrai après. L'arbre complet de `docs/` : [`../methode/nomenclature.md`](../methode/nomenclature.md).

`<slug>.spec.md` et `issues/<N>-<titre>.issue.md` sont de la **mécanique consommée par les skills** : ils gardent ces noms et sont exclus de la nomenclature `<TRI>-<N>-<slug>.md` ([`ARC-1`](../adr/ARC-1-nomenclature-trigramme.md)). En revanche, un document **de fond** posé dans le dossier d'une feature — une note de conception, une analyse — porte bien un trigramme.

## Quand une skill dit « publish to the issue tracker »

Créer un fichier sous `docs/features/<feature-slug>/`, en créant le dossier si besoin.

## Quand une skill dit « fetch the relevant ticket »

Lire le fichier au chemin indiqué. L'utilisateur passe normalement le chemin ou le numéro directement.

## Opérations de wayfinding

Utilisées par `/wayfinder`. La **carte** est un fichier, avec un fichier **enfant** par ticket.

- **Carte** : `docs/features/<effort>/map.md` — le corps Notes / Décisions-jusqu'ici / Brouillard.
- **Ticket enfant** : `docs/features/<effort>/issues/<N>-<titre>.issue.md`, numéroté à partir de `1`, la question dans le corps. Une ligne `Type:` note le type (`research` / `prototype` / `grilling` / `task`) ; une ligne `Status:` note `claimed` / `resolved`.
- **Blocage** : une ligne `Blocked by: N, N` près du haut. Un ticket est débloqué quand chacun des fichiers listés est `resolved`.
- **Frontière** : parcourir `docs/features/<effort>/issues/` et retenir les fichiers ouverts, débloqués et non réclamés ; le plus petit numéro gagne.
- **Réclamer** : poser `Status: claimed` et enregistrer **avant** tout travail.
- **Résoudre** : ajouter la réponse sous un titre `## Answer`, poser `Status: resolved`, puis ajouter un pointeur de contexte (résumé + lien) aux Décisions-jusqu'ici de `map.md`.
