# Ce que contient le skill revue-de-ticket, et pourquoi

## Le script — `scripts/contexte-ticket.mjs` → `scripts/chaine/`

Le contexte que l'axe Ticket reçoit : le ticket entier, la ligne de sa spec, chaque règle métier et chaque ADR cités, tels que le dépôt les écrit — ligne d'un registre markdown (`| RULE_ALL_FAC-3 | … |`) ou entrée d'un `rules.json` (`{ "id": "RULE_FFSA_LIC-7", … }`). Le sous-agent relit le diff contre ce contexte et n'explore pas le dépôt pour deviner l'intention : c'est le ticket qui la porte, et s'il ne la porte pas, c'est un défaut du ticket que la revue doit nommer. Banc d'essai sur un dépôt jouet, les deux formes de registre.

## Les critères — `criteres-ticket.md`, `criteres-documentation.md`

Deux listes fermées, comme celle de la revue adversariale : le relecteur ne rend que des écarts rattachés à un critère. L'axe Ticket (T1–T7) : surfaces prouvées, décisions tenues, règles citées avec leurs cas de bord, « Où », vérification, périmètre, statut. L'axe Documentation (D1–D7) : glossaire, registre, ADR, index générés, fiches et README, ticket et spec, commentaires. Les chemins y sont des rôles (« le glossaire du projet ») : Iroki et Fedora les rangent à des endroits différents.

## Les prompts — `prompt-ticket.md`, `prompt-documentation.md`

Un sous-agent par axe, en contexte vierge, en lecture seule, sans l'historique de la session. Celui de l'axe Ticket reçoit le contexte du ticket ; celui de l'axe Documentation ne reçoit que le diff et lit la documentation lui-même. L'axe Règles est la revue adversariale, inchangée, qui ne reçoit ni ticket ni intention.

## La section de PR — `section-pr.md`

Une seule section, `## Revue de ticket`, qui remplace `## Revue adversariale` : le capitaine et le relecteur humain lisent les trois axes au même endroit.
