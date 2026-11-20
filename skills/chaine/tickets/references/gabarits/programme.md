# {{Nom du programme}} — carte du programme

{{Une phrase : ce que le programme doit permettre de montrer.}} Cette carte est la mémoire durable de l'architecte : une session cloud repart d'un conteneur neuf, seul ce qui est commité survit. Une session de suite lit cette carte, puis la source, et reprend à la phase écrite sans reposer une question tranchée.

Fichier : `docs/programmes/{{nom-en-kebab}}.programme.md`. Ce n'est pas une carte de chantier : pas de ligne `Sujet:`, pas d'identifiant de la nomenclature ; chaque chantier a sa carte `*.map.md`, à côté de sa spec.

## Fiche

Phase: {{grilling | spec | suivi | fini}} — {{précision : le tour du grilling, le chantier en cours}}
Responsable: {{la personne qui répond du programme — un nom, jamais un session_id}}
Architecte: {{session_id de la session d'architecte en cours}}
Objectif: {{une phrase}}
Dépôts: {{les dépôts du programme, et ce que chacun reçoit}}
Source: {{chemin de l'entrée brute (passation, notes, artefact) — ni spec ni décision}}
Capitaines: {{par dépôt : session_id, ou « absent »}}
Relecteurs: {{par dépôt : session_id du Relecteur (régime 8), ou « absent »}}

## Chantiers

Dans l'ordre où ils se font.

| n°  | Chantier | Dépôt | Spec | Carte | Conducteur | État |
| --- | -------- | ----- | ---- | ----- | ---------- | ---- |

## Decisions-so-far

Décisions du produit, par tour du grilling (date de validation) :

- P-1 — {{décision}} `[terme]` s'il fixe un terme du glossaire

Décisions de l'architecte (choix techniques, sans effet sur ce que voit un utilisateur), chacune avec sa raison :

- A-1 — {{décision}}. Raison : {{une phrase}}

## Fog

- {{ce qui reste flou ; une ligne tranchée devient « _(tranché, P-n)_ » et reste}}

## Coût

| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |
| ---- | ------ | ------- | ------ | ------------ | ------ |

## Passation

{{Écrite quand le produit décide de changer d'architecte : où en est chaque chantier, ce qui attend le produit, les questions posées sans réponse, les sessions en vie (conducteurs, capitaines) à prévenir, et l'environnement à ouvrir pour la session de suite (dépôts, droit de pousser).}}

## Journal

- {{AAAA-MM-JJ}} — {{ce qui s'est passé : étape franchie, skill absent, incident}}
