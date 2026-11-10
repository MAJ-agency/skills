# La revue de ticket lit une règle dans son fichier

Status: ready-for-agent
Type: task
Blocked by: 2

`contexte-ticket.mjs` cherche une règle dans une ligne de tableau `| <ID> |` ou dans un `rules.json`. Les deux formes disparaissent : une règle est un fichier `RULE_<CTX>_<TRI>-<n>.md`.

## Où

- `skills/chaine/revue-de-ticket/scripts/contexte-ticket.mjs` et son test : les identifiants cités par le ticket et sa ligne de spec se lisent par `lireIdentifiant` ; une règle se lit dans `docs/metier/regles/<ctx>/<ID>.md` (en-tête et corps, rendus tels quels) ; une ADR, un design, un guide dans le fichier dont le nom commence par l'identifiant ; une spec dans `docs/features/**/<ID>-*.spec.md`. Plus aucune lecture de `rules.json` ni de tableau.
- La ligne `Règles:` du ticket est lue en premier : c'est la liste fermée des règles que l'axe Ticket (`T3`) doit trouver prouvées ; les identifiants cités ailleurs dans le corps viennent après, marqués « cités ».
- `skills/chaine/revue-de-ticket/references/prompt-ticket.md` : le relecteur sait que l'étiquette est `[RULE_…]` en tête du nom du test.
- `skills/chaine/revue-adversariale/references/criteres-socle.md`, critère `S7` : « un test qui couvre une règle du registre porte son identifiant entre crochets ».

## Décisions

- Le contexte d'un ticket est celui de son identifiant ; une règle citée d'un autre contexte que le sien et `ALL` est signalée dans la sortie, pas refusée (c'est le gate qui refuse).

## Surfaces

| Surface                      | Preuve                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| règle trouvée dans son fichier | `contexte-ticket.test.mjs` : un ticket `Règles: RULE_ALL_LIC-3`, le fichier rendu |
| ADR, spec, identifiant absent | les trois cas, sortie attendue                                                     |
| aucune lecture d'ancienne forme | un dépôt jouet avec un `rules.json` : ignoré                                     |

## Vérification

`pnpm test` ; sur un dépôt posé, `node scripts/chaine/contexte-ticket.mjs SPEC_ALL_SOC-1.03` rend le contexte.

## Comments

- 2026-11-10 — Ouvert à la clôture du grilling (ticket `1`).
