# Ce que contient le skill chantier, et pourquoi

Le skill n'a aucun script à lui. Il exécute `docs/agents/chaine-de-production.md` phase par phase, et s'appuie sur les scripts posés par `socle-monorepo` (`next-id`), par `tickets` (`vagues`, `avancement`) et par `sujet` (`sujet.sh`), sur les outils de session (`create_session`, `send_later`, `list_sessions`, `get_session`) et sur l'outil GitHub MCP.

Ce qui le rend reprenable : la ligne `Phase:` de la carte du chantier, poussée à chaque changement. Une session neuve relancée avec le nom du sujet lit la fiche et repart de là, sans relire la conversation.

Ce qui vient du projet : le nombre de filles par vague et les chemins sensibles de `.claude/chaine.json`, le format des tickets de `tickets`, la méthode de grilling de `docs/methode/grilling.md` (par les skills de Matt Pocock), le fichier `docs/agents/pieges.md`, où un incident sans gate reçoit sa ligne au moment où il arrive.
