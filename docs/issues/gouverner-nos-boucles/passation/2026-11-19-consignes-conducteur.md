# Consignes de l'architecte à un conducteur du chantier « preuve suffisante » (état du 2026-11-19)

À recopier dans la ligne « Situation » du prompt d'un conducteur de relève, après le gabarit de `skills/chaine/architecte/references/lancement.md` (§ « Le conducteur d'un chantier »). Elles priment sur le skill là où il dit autrement.

**Le contexte du conducteur est sa première contrainte.** Mesuré le 2026-11-19 : sans ces règles, un conducteur portait 150 000 tokens après ses seules lectures de départ et demandait la relève au bout de 55 minutes ; avec elles, 45 000 au départ.

- (a) La carte du chantier pèse plus de 160 Ko : ne jamais la lire en entier. Lire par `sed -n` ou `grep` : `## Fiche`, `## Dépassements`, et dans `## Journal` les seules entrées du jour. Une décision ne se lit que par `grep -n` quand une question la demande.
- (b) Si la version chargée du skill diffère de celle du marketplace, lire le diff du seul `chantier/SKILL.md`, pas le fichier ; des références et de `lancement.md`, seulement la section utile au moment utile.
- (c) Ni `list_triggers` ni `list_sessions`. `get_session` coûte 1 500 tokens : une fois par fille avant de lui accorder un push, une fois par heure pour soi. Une PR ne se lit que par `list_pull_requests` avec `fields` restreints, `get_check_runs` ou `get_files`, jamais sa description. Toute sortie de commande bornée.
- (d) Toute contre-revue, vérification bornée, lecture de diff, rédaction de ticket part chez un sous-agent neuf qui rend 300 mots au plus ; le conducteur ne lit lui-même aucun diff.
- (e) La carte s'écrit par ajout en fin de journal, sans la relire ; un commit de carte par événement majeur.
- (f) Un message à l'architecte par événement (une PR prête à étiqueter, une question, une relève), le contexte en tête de chacun ; relève demandée à 280 000.

**Règles du chantier.**

1. Ne jamais lancer `sujet.sh rafraichir` (`A-69` : le capitaine seul reçoit develop dans le sujet).
2. Une seule sous-PR étiquetée à la fois sur le sujet.
3. Deux filles au plus en même temps (un push court accordé à une fille à l'arrêt ne compte pas comme un lancement).
4. Une fille s'arrête à 250 000 tokens (le dire dans son prompt) ; un push après livraison ne va qu'à une fille sous 250 000, sinon à une fille neuve sur sa branche.
5. Quota : un statut `rejected` ou `allowed_warning` n'arrête rien ; seul un tour réellement refusé, ou un mot du produit, arrête (`P-59`). Rien de non poussé.
6. Toute PR qui touche `apps/cli/src/proofs`, la construction de l'index ou ce que `compare` juge passe la contre-revue d'un sous-agent neuf avant le label ; l'architecte reçoit le sommet, le verdict et tout test existant modifié, nommé un par un avec le sens du changement (plus strict, équivalent, plus lâche). L'architecte lit lui-même le diff de `scan.ts`, de `files.ts` et de la construction de l'index avant le label.
7. Un test qui porte une étiquette `[RULE_…]` a son titre en français (la MOA le lit comme preuve) ; un test sans étiquette suit la langue de son fichier.
8. Les prompts des sous-agents interdisent tout signal hors de leurs propres processus (ni `pkill`, ni `killall`, ni `kill` d'un pid trouvé par `ps`) et imposent un `TMPDIR` privé.
9. Publier la CLI n'est pas le geste du conducteur.
10. `archive_session` est refusé au conducteur par la garde du mode « auto » : ne pas le contourner ; à chaque fille fusionnée et relevée dans `## Coût`, écrire à l'architecte « à archiver : session, ticket, coût » ; l'architecte archive (`P-62`).
