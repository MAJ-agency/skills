# Ce que contient le skill revue-de-ticket, et pourquoi

## Le script — `scripts/contexte-ticket.mjs` → `scripts/chaine/`

Le contexte que l'axe Ticket reçoit, dans cet ordre : le ticket entier, la ligne de sa spec, « Règles du ticket » — la ligne `Règles:`, liste fermée des règles que `T3` doit trouver prouvées, et chaque fichier `docs/metier/regles/<ctx>/RULE_<CTX>_<TRI>-<n>.md` rendu tel quel, en-tête YAML compris — puis « Identifiants cités » ailleurs dans le corps (règles, ADR, specs, tickets, design, guides, demandes). Chaque identifiant est marqué trouvé ou introuvable, avec le chemin cherché ; une ADR qui a deux fichiers candidats les liste sans choisir ; une règle d'un autre contexte que celui du ticket et `ALL` est rendue avec une ligne qui le signale (le refus est au gate des tickets). Les identifiants se lisent par `scripts/docs/identifiants.mjs` ; aucune ancienne forme de registre (tableau `<TRI>-regles.md`, `rules.json`) n'est lue. Le sous-agent relit le diff contre ce contexte et n'explore pas le dépôt pour deviner l'intention : c'est le ticket qui la porte, et s'il ne la porte pas, c'est un défaut du ticket que la revue doit nommer. Banc d'essai sur un dépôt jouet.

## Les critères — `criteres-ticket.md`, `criteres-documentation.md`

Deux listes fermées, comme celle de la revue adversariale : le relecteur ne rend que des écarts rattachés à un critère. L'axe Ticket (T1–T9) : surfaces prouvées, décisions tenues, règles citées avec leurs cas de bord, « Où », vérification, périmètre, statut, puis — venus des rétros d'Anchorpost — recette d'un service tiers relue contre la documentation du fournisseur, essai d'une réécriture de dépôt sur une copie d'un dépôt réel. L'axe Documentation (D1–D7) : glossaire, registre, ADR, index générés, fiches et README, ticket et spec, commentaires. Les chemins y sont des rôles (« le glossaire du projet ») : d'un projet à l'autre, ils ne sont pas rangés au même endroit.

## Les prompts — `prompt-ticket.md`, `prompt-documentation.md`

Un sous-agent par axe, en contexte vierge, en lecture seule, sans l'historique de la session. Celui de l'axe Ticket reçoit le contexte du ticket ; celui de l'axe Documentation ne reçoit que le diff et lit la documentation lui-même. L'axe Règles est la revue adversariale, inchangée, qui ne reçoit ni ticket ni intention.

## La section de PR — `section-pr.md`

Une seule section, `## Revue de ticket`, qui remplace `## Revue adversariale` : le capitaine et le relecteur humain lisent les trois axes au même endroit.
