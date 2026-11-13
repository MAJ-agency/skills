# {{ID}} — Carte du chantier : {{objectif}}

Sujet: sujet/{{nom}}

## Fiche

Phase: 1-grilling
Responsable: {{la personne qui répond du chantier — un nom, jamais un session_id}}
Architecte: {{session_id de l'architecte du programme — ou retirer la ligne si le chantier n'a pas de programme}}
Conducteur: {{session_id de la session qui mène le chantier}}
Objectif: {{une phrase}}
Échéance: {{date ou aucune}}
Grilling: {{complet | court | aucun}}
Filles par vague: {{n}}
Migrations: {{horodatages réservés, séparés par des virgules (AAAAMMJJHHMM, AAAAMMJJHHMM) — ou « — » ; ligne lue par check:tickets, jamais deux cartes ouvertes sur le même horodatage}}
Capitaine: {{session_id ou « absent »}}
Gel:

## Decisions-so-far

- A-1 — {{décision}} `[terme]` s'il fixe un terme du glossaire

## Fog

- {{ce qui reste flou}}

## Vagues

| Vague | Ticket | Objet | Modèle | Fichiers chauds | Session |
| ----- | ------ | ----- | ------ | --------------- | ------- |

## Coût

| Rôle | Ticket | Session | Modèle | Contexte max | Coût $ |
| ---- | ------ | ------- | ------ | ------------ | ------ |

## Dépassements

Une session au plafond (`plafonds` de `.claude/chaine.json`) y a sa ligne : sans elle, le gate `tickets` refuse la ligne de `## Coût` qui le dépasse.

| Session | Ticket | Mesure | Décision du produit | Date |
| ------- | ------ | ------ | ------------------- | ---- |

## Journal

- {{AAAA-MM-JJ}} — {{ce qui s'est passé : gel, interruption des filles, dégel}}

## Rétro

{{À la fin : incidents, ce qui a donné un gate ou un critère de revue, coût total et par ticket.}}
