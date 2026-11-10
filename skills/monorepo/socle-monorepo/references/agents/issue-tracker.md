# Suivi des tickets — markdown local sous `docs/features/`

Les issues et les specs de ce dépôt vivent en **fichiers markdown sous `docs/features/`**, versionnés avec le code. Il n'y a pas de tracker externe.

> **Pas de `.scratch/`, ni aucun dossier de travail hors de l'arbre.** Toute la documentation du dépôt vit sous `docs/`, triée par thème — les tickets sont de la documentation de feature comme le reste. Voir le tableau des thèmes dans [`../methode/nomenclature.md`](../methode/nomenclature.md).

Le jour où le dépôt aura un remote GitHub, rejouer `/mattpocock-skills:setup-matt-pocock-skills` pour basculer vers `gh`.

## Conventions

- Un dossier par feature et par contexte : `docs/features/<feature>/<ctx>/` (`all/` pour ce qui vaut partout ; le dossier de contexte existe toujours).
- La spec est `docs/features/<feature>/<ctx>/SPEC_<CTX>_<TRI>-<n>-<slug>.spec.md` (`docs/features/socle/all/SPEC_ALL_SOC-1-socle.spec.md`) — le suffixe `.spec.md` rend le fichier reconnaissable hors contexte et trivial à chercher (`**/*.spec.md`). `n` est le prochain numéro libre, par `node scripts/docs/next-id.mjs SPEC <CTX> <TRI>`.
- Les tickets d'implémentation sont **un fichier par ticket** : `docs/features/<feature>/<ctx>/issues/SPEC_<CTX>_<TRI>-<n>-<slug>.<NN>.issue.md`, index `NN` sur deux chiffres à partir de `01`, dans l'ordre des dépendances (bloqueurs d'abord) ; un ticket se cite `SPEC_ALL_SOC-1.03`. Jamais un fichier unique regroupant tous les tickets.
- L'état de triage est une ligne `Status:` près du haut du fichier (les valeurs sont dans [`triage-labels.md`](triage-labels.md)).
- Les commentaires et l'historique de conversation s'ajoutent **en bas** du fichier, sous un titre `## Comments`.

**Une spec cite les règles métier, elle ne les formule pas.** Une règle découverte en écrivant une spec entre au registre `docs/metier/regles/<ctx>/` comme `candidate`, avec son identifiant, et la spec y renvoie (« implémente `RULE_ALL_LIC-3` »). La feature est du travail en cours ; la règle est ce qui reste vrai après. L'arbre complet de `docs/` : [`../methode/nomenclature.md`](../methode/nomenclature.md).

Les specs et les tickets sont de la **mécanique consommée par les skills** : ils sont nommés `SPEC_<CTX>_<TRI>-<n>-<slug>.spec.md` et `.<NN>.issue.md` ([`ADR_ALL_ARC-1`](../adr/ADR_ALL_ARC-1-identifiants-types-et-contextes.md)). En revanche, un document **de fond** posé dans le dossier d'une feature — une note de conception, une analyse — porte bien un trigramme.

## Quand une skill dit « publish to the issue tracker »

Créer un fichier sous `docs/features/<feature>/<ctx>/`, nommé comme ci-dessus, en créant le dossier si besoin.

## Quand une skill dit « fetch the relevant ticket »

Lire le fichier au chemin indiqué. L'utilisateur passe normalement le chemin ou le numéro directement.

## Opérations de wayfinding

Utilisées par `/wayfinder`. La **carte** est un fichier, avec un fichier **enfant** par ticket.

- **Carte** : `docs/features/<feature>/<ctx>/SPEC_<CTX>_<TRI>-<n>-<slug>.map.md`, même identifiant que la spec — le corps Notes / Décisions-jusqu'ici / Brouillard.
- **Ticket enfant** : `docs/features/<feature>/<ctx>/issues/SPEC_<CTX>_<TRI>-<n>-<slug>.<NN>.issue.md`, index à partir de `01`, la question dans le corps. Une ligne `Type:` note le type (`task` / `défaut` / `grilling` / `research`) ; la ligne `Status:` suit le vocabulaire de [`triage-labels.md`](triage-labels.md).
- **Blocage** : une ligne `Blocked by: NN, NN` près du haut (index de la même spec, ou identifiants complets). Un ticket est débloqué quand chacun des tickets listés est fait.
- **Frontière** : parcourir `docs/features/<feature>/<ctx>/issues/` et retenir les fichiers ouverts, débloqués et non réclamés ; le plus petit numéro gagne.
- **Réclamer** : poser `Status: en cours — <branche>` et enregistrer **avant** tout travail.
- **Résoudre** : ajouter la réponse sous un titre `## Answer`, poser `Status: Fait — PR #<n>`, puis ajouter un pointeur de contexte (résumé + lien) aux Décisions-jusqu'ici de la carte.
