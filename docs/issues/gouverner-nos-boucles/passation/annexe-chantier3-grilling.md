# Chantier 3 — grilling (ouvert par le produit le 2026-11-17 : « oui on commence le grilling du chantier 3 »)

## Faits (agent de recherche, skills origin/main c17f88b, carte, source 2026-11-12)
- Source § 3 : « Revue contrôlée par son auteur. La session qui code lance le relecteur, trie ses constats et rédige la section. `revue-exigee.mjs` ne vérifie que la présence d'un titre « Revue… ». »
- Source § 5 A point 3 : bloc structuré dans la section de PR (commit relu, bloquants ouverts, constats écartés et raison) ; `revue-exigee.mjs` refuse un commit relu périmé ou un bloquant ouvert ; tri en quatre catégories (contesté avec preuve, remonté à l'architecte, corrigé, consigné sans suite) ; l'auteur ne change jamais une gravité ; relecteur déclaré comme sous-agent du plugin (`tools: [Read, Grep, Glob]`, modèle et effort au-dessus de la fille, `maxTurns`) ; axe en échec « non exécuté », jamais « zéro constat » ; seconde revue par échantillonnage.
- Source § 5 A point 4 : relecture des tickets par un sous-agent neuf (ticket + fichiers nommés) : paraphrase, décisions ouvertes, références mortes → `needs-info`.
- Source § 5 A point 5 : session de fin de chantier à part, avec son budget ; entrées `list_events`, sections de revue, renvois, `pieges.md`, critères ; sortie une PR de doc ; `Phase: fini` refusée sans elle ; `demarrage.mjs` signale un écart de version.
- Source § 5 A points 6 à 10 : job de CI sur le diff (chemin sensible sans `Label: architecte`) ; index `sante-chaine.md` ; ligne de verdict à la livraison ; ADR et clé `regimes` dans `chaine.json` ; preuve par la trace que le relecteur n'a pas vu le contexte du parent.
- Source § 7 : « Lancer une revue par IA en CI : l'ADR de la chaîne l'a écartée ».
- Aujourd'hui : `revue-de-ticket/SKILL.md:3,34,46,50-52` (la fille lance, trie, laisse « à corriger » avec raison ; deux tours) ; `revue-exigee.mjs:211-218` (titre seul) ; rien ne compare le sommet relu au `head.sha` ; `admin.md:26` : « vaut pour des sessions de bonne foi ».
- `Label: contre-revue` = ligne d'en-tête de ticket (pas un label GitHub) ; le conducteur contre-relit par sous-agent puis pose `à-fusionner` (`chantier/SKILL.md:95`, `chaine-de-production.md:65,120`) ; format non fixé ; le capitaine n'en sait rien.
- Capitaine : `passer.sh` (éligibilité, revue exigée, fusion de develop, index, push, checks, squash) ; renvoi `fusion-bloquée`, plafond 3 → état « humain » sans sortie décrite (carte l.382) ; ne lance aucune session ni sous-agent ; ne lit pas la section de revue.
- Identité : toutes les sessions écrivent sous le compte du produit (`lancement.md:60`) ; `renvois_de` filtre par compte, donc falsifiable par une autre session ; aucun script ne lit `Claude-Session:`. `admin.md:26-34` : CODEOWNERS possible si les sessions ouvrent leurs PR sous une autre identité (bot, GitHub App).
- Relecture des tickets : prose contradictoire (`architecte/SKILL.md:68` renvoi mort « point 9 » ; rien dans `chantier` ni `tickets`) ; aucun outil.
- Fin de chantier : `chantier/SKILL.md` § 7 en prose, rétro écrite par le conducteur ; `## Rétro` non vide exigée à `fini` ; `couts.mjs` ignore les cartes de programme ; gabarit `programme.md` sans `## Rétro`.
- Carte : P-6 (l.62), P-17 (l.73 : la MOA voit qui a vérifié le code), P-38 (l.95), A-3 (trois mécanismes), A-30 (P-6 sans règle candidate), l.156 (architecte au plafond), l.163, l.381, l.382.

## Arbre de décision
A. Revue que l'auteur ne contrôle pas
 A1 qui lance (capitaine, recommandé ; conducteur ; CI écartée par l'ADR)
 A2 critère : `anchorpost compare --json` (règle moyenne ou haute touchée) ; chemin sensible = même régime ; `Label: contre-revue` absorbé
 A3 la fille garde sa propre revue, pour toute criticité
 A4 constats : renvoi par le capitaine ; contestation arbitrée par le conducteur ou l'architecte, jamais par l'auteur
 A5 chaque renvoi relance une revue sur le nouveau sommet ; plafond 3 → humain ; sortie de l'état « humain »
 A6 haute : qui est la personne nommée, comment elle donne son accord (message dans la session du capitaine ; compte unique)
 A7 relecteur : modèle au-dessus de la fille, lecture seule, déclaré dans le plugin
 A8 échantillonnage sur les PR basses
 A9 PR de documentation qui écrit une règle ou une criticité : revue indépendante aussi
 A10 preuve mécanique de la revue de la fille : bloc structuré, sommet relu = tête, zéro bloquant ouvert
B. Relecture des tickets avant la vague : outillée, lancée par le conducteur, verdict brut dans la carte
C. Fin de chantier : session de rétro à part, lancée par l'architecte ; `Phase: fini` refusée sans elle ; coûts des cartes de programme
D. Régimes : clé `regimes` de `chaine.json`, ADR ; règle candidate dans anchorpost pour P-6 (A-30)

## Premier tour (à poser après la réponse sur les six points de la Description)
1 A1 capitaine · 2 A3 la fille garde sa revue · 3 A6 la personne nommée et son accord · 4 A4 arbitrage · 5 A9 PR de documentation · 6 C rétro par une session à part · 7 A8 pas d'échantillonnage pour l'instant

## Apports du 2026-11-17 après-midi (à porter dans la spec du chantier 3)
- PR 108 de skills (CODEOWNERS, 7.13.0, fusionnée 86daaee) : relecture humaine des chemins sensibles tenue par GitHub ; `proprietaires` dans `chaine.json` ; capitaine : états « attend un propriétaire », « attend un humain ». Limite : une approbation couvre les pushs ultérieurs (ticket 51 à écrire : le capitaine compare le diff propre de la PR sur les chemins possédés entre le commit approuvé et le sommet).
- P-41 : propriétaires = le produit et une seconde personne, sur Fedora, Iroki, Anchorpost. Ouvert : `skills` ; périmètre au-delà des chemins sensibles (code des règles hautes ?) ; identité des sessions (l'auteur d'une PR ne peut pas l'approuver : seule la seconde personne approuve une PR d'agent, sauf identité propre aux sessions). Le produit l'a déjà lu chez l'architecte de Fedora, sans trancher.
- P-40 : un agent d'un projet propose une amélioration du plugin par PR ; relecture et ordre à l'architecte de skills.
- Cas vécu : l'architecte de Fedora a signé « Contre-revue de l'architecte » sur skills#108 (« aucun écart ») ; la contre-relecture indépendante a trouvé quatre bloquants et dix points.
- Cas vécu : anchorpost#239 (tests de temps) : revue de ticket de la fille et contre-revue du conducteur « aucun écart » ; le relecteur indépendant, en jouant des régressions de son cru, en trouve six qui laissent les tests verts. Leçon : pour un test qui garde une propriété, le relecteur tente de casser la propriété (critère à ajouter à `revue-adversariale`, proposé par le conducteur).
- Cas vécu : ticket 49 : trois relectures « pas prêt » avant « prêt » ; chaque passe trouve moins. Coût à mesurer.
- Lien P-6 / CODEOWNERS : le `code` des règles hautes (champ `code` des fichiers de règle, index 3 `rules[].file`) peut être généré en lignes de CODEOWNERS → « une personne nommée lit avant la fusion » tenu par GitHub pour les règles hautes.

## Apport du soir (2026-11-17, épreuve de compare)

- Un agent qui écrit `by: <nom d'une personne>` est accepté par `compare` pour la criticité d'une règle, d'une feature, le plancher et `proofsValidation`. La machine ne sait pas qui a tapé le nom.
- Gardé aujourd'hui : `anchorpost/manifest.json` (chemin sensible, donc contre-revue et, avec CODEOWNERS, approbation d'un propriétaire). Couvre `roles`, plancher, `proofs`, `featureCriticality`.
- Pas gardé : `docs/metier/regles/**`, les specs, les tickets. Aucun hook de `scripts/agent/` ne regarde `by`.
- Pistes à porter au produit, avec le périmètre de CODEOWNERS (P-41) : (a) les fichiers de règle entrent dans le périmètre des propriétaires ; (b) un hook d'agent refuse l'écriture d'un `by:` autre que `agent` (garde légère, contournable par une commande) ; (c) les deux.
- (soir, suite) Le code du juge (`compare`, `proofs`, `check`, `build`, `repo`, schéma) devient chemin sensible (A-63, ticket .39). Aujourd'hui : contre-revue. Avec CODEOWNERS (P-41) : chaque PR sur ces chemins attendrait un propriétaire humain. Question au produit : mêmes chemins pour « contre-revue » et pour « propriétaire », ou deux listes ?

## Ajout du 2026-11-18, 15 h 32 UTC — une contrainte du produit

Relayé par l'architecte de Fedora (`session_017ZgEwK58YLUSzpFyS44qpW`) le 2026-11-18 à 15 h 31 UTC, à confirmer avec le produit pendant le grilling, puisque ce n'est pas dit à l'architecte du programme : à la proposition « donner un compte propre aux agents, pour ne pas dépendre de la seconde personne propriétaire à chaque PR sensible », le produit a répondu qu'il ne peut pas attendre la validation de cette seconde personne sur CODEOWNERS, et qu'il doit pouvoir, lui, en tant qu'admin du compte de l'organisation, valider les modifications des fichiers sensibles. Deux faits joints, non vérifiés ici : Anchorpost n'a ni CODEOWNERS ni PR qui en pose un, et le réglage GitHub « Require review from Code Owners » n'est activé nulle part.

À porter au premier tour : le produit veut approuver lui-même ; or toutes les sessions écrivent sous son compte, et GitHub refuse qu'un auteur approuve sa propre PR. La question à lui poser n'est donc plus « qui approuve », mais « sous quel compte les agents écrivent-ils, pour que votre approbation compte ».

Suite relayée à 15 h 32 UTC par la même session : elle a proposé au produit (1) un compte GitHub dédié aux agents, recommandé, ou (2) un refus de fusion sans sa validation, contournable par un administrateur. Réponse du produit, citée : « nan trop compliqué ta solution. » Elle lui explique une variante sans seconde identité : une validation par un label que les hooks refusent aux agents et que le capitaine exige sur un chemin sensible ; elle tient face à une session de bonne foi, pas face à une PR hostile. Rien n'est posé ni tranché : la décision reste au grilling du chantier 3. À retenir pour le premier tour : le produit écarte ce qui lui paraît compliqué ; lui présenter une seule voie, en une phrase, avec ce qu'elle ne couvre pas.

## Ajout du 2026-11-18, 15 h 40 UTC — la proposition du produit, relayée

Relayée à 15 h 35 UTC par la même session, citée : « il faut une solution telle que le skill chantier donne à la session fille les chemins de fichiers sensibles et qu'en cas de modification d'un de ses fichiers, le chantier demande l'autorisation au produit (donc moi ou [la seconde personne]) de modifier ce fichier. Plus simple nan ? »

Lecture de la session qui relaie, sans engagement du produit : le mécanisme de la ligne `Dépendances:`. Le ticket porterait une ligne (par exemple `Sensibles:`) avec les chemins accordés, qui les a accordés et la date ; le conducteur ne la remplit qu'après l'accord ; le hook refuse l'édition d'un chemin sensible absent de cette ligne, lue sur le sujet ; la contre-revue reste sur le contenu. L'accord porte sur l'intention, avant le code, pas sur le diff.

Lecture de l'architecte du programme, à confirmer au grilling (ouvert ici le 2026-11-18, skills `grilling` puis `domain-modeling` chargés, une question à la fois comme le produit le demande) :

- Ce que la proposition règle : plus de dépendance à une seconde personne, plus de seconde identité GitHub, rien à activer chez GitHub. L'accord peut se donner une fois, à la validation du découpage, pour tous les tickets d'un chantier.
- Ce qu'elle ne règle pas : personne d'humain ne lit le contenu de la modification ; c'est un agent qui écrit le nom de qui a accordé (même faiblesse que `by:`) ; elle tient face à une session de bonne foi, pas face à une PR hostile.
- Scénario à poser : depuis `SPEC_ALL_ANC-5.39`, le code du juge de la CLI est chemin sensible ; presque tous les tickets restants de la preuve suffisante y touchent. Avec un accord par PR, le produit serait sollicité à chaque ticket ; avec un accord au découpage, une fois.
- Conséquence sur l'arbre : A6 (la personne nommée et son accord) et le périmètre de CODEOWNERS (P-41) se reformulent ; CODEOWNERS resterait un fichier d'information, sans réglage GitHub exigé.
