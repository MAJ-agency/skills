# La revue de ticket lit une règle dans son fichier

Status: resolved
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

## Answer

Livré : `contexte-ticket.mjs` lit chaque identifiant par `identifiants.mjs` et rend, dans l'ordre, le ticket, sa ligne de spec, « Règles du ticket » (la ligne `Règles:`, puis chaque `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md` rendu tel quel, en-tête YAML compris), puis « Identifiants cités » (règles, ADR, specs, tickets, design, guides, demandes), chacun trouvé ou introuvable avec le chemin cherché. Une ADR, un `DSG`, un `DOC` : le fichier de `docs/**` dont le nom commence par `<ID>-` ; deux candidats ou plus sont tous listés. Une règle d'un autre contexte que celui du ticket et `ALL` est rendue avec la ligne « contexte différent du ticket ». Un jeton de la ligne `Règles:` qui n'est pas un identifiant, ou un identifiant qui n'est pas une règle, est signalé. Plus aucune lecture de `rules.json` ni de tableau `| <ID> |`. `S7` (`criteres-socle.md`), `prompt-ticket.md`, `T3` (`criteres-ticket.md`), `CONTENU.md` et `SKILL.md` du skill `revue-de-ticket` disent l'étiquette `[RULE_<CTX>_<TRI>-<n>]` et la liste fermée de la ligne `Règles:`. `pnpm test` : 266 verts (262 au sommet `5349a7b`, le banc de `contexte-ticket` passe de 3 à 7 cas).

## Comments

- 2026-11-10 — Ouvert à la clôture du grilling (ticket `1`).
- 2026-11-10 — Fait. Décisions par défaut : `T3` vise la ligne `Règles:`, et à défaut de ligne les règles citées par le ticket ; une demande `REQ` se cherche sous `docs/demandes/<ctx>/` ; un ticket cité se cherche archive comprise et le dit ; `criteres-documentation.md` garde « ou `rules.json` » tant que Fedora n'a pas migré (hors « Où »).
