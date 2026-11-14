# Ce que contient le skill architecte, et pourquoi

Le skill n'a aucun script à lui. Il s'appuie sur la méthode de `docs/agents/chaine-de-production.md` (rôles, question au produit, prompt d'une session lancée), sur le gabarit de carte de programme du skill `tickets` (`programme.md`), sur les outils de session (`create_session`, `send_message`, `get_session`, `list_sessions`, `list_events`, `send_later`) et sur l'outil GitHub MCP.

`lancement.md` : les prompts de lancement d'un conducteur, d'un capitaine et de la session d'un ticket hors chantier, avec la consigne de lecture des skills, son repli (installer soi-même le plugin, puis lire le skill sur le disque), les deux lignes des consignes du produit, citées dans tout prompt de lancement, et ce que le conducteur fait de chaque ligne.

Ce qui le rend reprenable : la carte du programme, poussée à chaque étape, et ses sections `## Passation` et `## Journal`. Une session de suite ouverte par le produit lit la fiche et reprend à la ligne `Phase:`, sans relire la conversation.
