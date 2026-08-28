# Modéliser le domaine

Status: needs-info
Type: grilling

Le socle technique tourne, mais **rien du métier n'est connu** : `CONTEXT.md` est vide, `application/` ne contient aucun use case, `docs/metier/` n'existe pas.

**C'est le ticket bloquant.** Presque tous les autres en dépendent : on ne choisit pas une stratégie d'authentification, un modèle de données ou un gate CI sans savoir ce que le service fait.

## Ce qu'il faut produire

- Le **glossaire** (`CONTEXT.md`) — un terme entre quand il est tranché, pas avant.
- Le **registre des règles métier** (`docs/metier/regles/`), identifiants stables, cycle `candidate → validée`.
- Les **questions ouvertes** (`docs/questions-ouvertes.md`), datées et sourcées.

## Comment

`/grill-with-docs` sur les documents sources déposés dans `docs/sources/`. Protocole complet : `docs/methode/grilling.md`. Le projet est neuf, donc **architectural** : questions → approches → design → spec écrite.

**Ne pas commencer à coder un domaine avant que ce ticket soit résolu.**

## Comments
