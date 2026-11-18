# Relecture de la spec du chantier 3 par un agent neuf — 2026-11-18

Relecture de [`relecture-independante.spec.md`](relecture-independante.spec.md) dans son état du commit `3c8116c`, par un agent en contexte vierge chargé de trouver ce qui ferait échouer le chantier. Rapport brut, non retouché. La spec est à reprendre sur ces constats avant tout découpage.

---

**Verdict : pas prête.** Huit constats bloquants, dont cinq déplacent les frontières des lots ; aucun ne rouvre une décision du produit, deux ajouts sont à lui confirmer.

Spec relue : `/home/user/skills/docs/issues/gouverner-nos-boucles/relecture-independante.spec.md` (lignes citées « spec l.n »). Les autres chemins sont relatifs à `/home/user/skills/`, lus sur `origin/main` (4a45634, plugin 7.15.0). La branche de travail a un commit de retard sur `origin/main` (#110, le T3), sans effet sur la spec. Pas de `graphify-out/` dans ce dépôt : lecture directe. Rien modifié, rien poussé.

Sauf mention « supposé », chaque constat est vérifié dans le fichier cité. Les faits vécus de la spec l.9 (#239, #277) ne sont pas vérifiables d'ici.

## Bloquants

**B1 — `A-87` renvoie les PR que le capitaine vient lui-même de mettre à jour, et `commits-a-relire.mjs` ne lit pas ce que la spec lui prête.**
- `skills/chaine/fusionner/scripts/commits-a-relire.mjs` l.2-21 juge des messages de commit par commitlint. Il ne sait pas dire qu'un commit est « une mise à jour avec la base sans diff propre ».
- La mise à jour du capitaine a un diff propre :
  - `passer.sh` l.248-262 conclut la fusion avec les index régénérés, ou ajoute un commit ordinaire `docs: régénère les index après mise à jour avec develop` ;
  - `sujet/scripts/sujet.sh` l.497-538 (`mettre_a_jour_sous_pr`) résout les index par `--theirs`, régénère, pousse et sort en 8 : « elle repasse au tour suivant ».
- La revue se juge à l'éligibilité, avant la mise à jour (`passer.sh` l.185-188, `sujet.sh` l.739).
- Scénario : deux sous-PR d'une vague validées au sommet A. La première entre. La seconde est en conflit sur l'index Anchorpost généré : sortie 8, sommet M. Au tour suivant, `Sommet relu` = A, M a un diff propre : renvoi, puis nouvelle relecture. Cela se répète pour chaque sous-PR suivante. Même effet vers `develop` après une sortie 3 ou 5.
- La notion qui existe est « aux index générés près » (`passer.sh` l.118-155, `sujet.sh` l.593-601). La spec ne la reprend pas.

**B2 — `A-87` exempte la « mise à jour d'un sujet » comme une PR du capitaine : c'est faux.**
- `sujet.sh` l.549-576 : c'est une session fille qui l'ouvre. Elle porte une résolution de conflit de code et des retouches.
- Aujourd'hui elle est jugée « comme une sous-PR » (l.597-601, l.653-656).
- Le geste du capitaine est `rafraichir` (l.779), un push sans PR.
- Telle qu'écrite, la spec laisse entrer une résolution de conflit sans relecture, contre `P-51` (« TOUTES les PR »).

**B3 — La seconde garde de `A-75` ne voit pas les sous-PR, le cas principal d'un chantier.**
- `passer.sh` l.201 : « les sous-PR vers un sujet passent par sujet.sh, hors de ce contrôle ». Elles entrent par `sujet.sh fusionner` (l.700-777), que le lot 1 ne nomme pas.
- Une livraison de sujet passe bien par `passer.sh`, mais elle a N tickets et ses tickets ne sont pas encore sur `develop`. « La ligne du ticket, lue sur la base » la renverrait. L'exemption de `A-87` ne couvre que le verdict.

**B4 — `A-75` interdit ce que le plugin oblige le conducteur à faire au cadrage.**
- `.claude/**` est un chemin sensible (`socle-chaine-de-production/references/chaine.json` l.3).
- `chantier/SKILL.md` l.61 et `chaine-de-production.md` l.72 : un ticket qui crée un module sensible ajoute son dossier à `cheminsSensibles` « dans la même PR de cadrage ».
- La branche `docs/<nom>-cadrage` (`chantier/SKILL.md` l.41) n'a pas de ticket. Sur le modèle de `Dépendances:`, une branche sans ticket est refusée (`agent/garde-commandes.mjs` l.33-34, `regles.mjs` l.93).
- Le hook refuse donc l'édition, et « une PR sans ticket qui touche un chemin sensible est renvoyée ».
- Même impasse pour la fille de mise à jour d'un sujet (branche `maj/<nom>`, sans ticket) quand le conflit porte sur `scripts/chaine/**`.

**B5 — `A-86` et `A-87` se contredisent : rien n'exige deux verdicts.**
- `A-87` lit « le dernier verdict ».
- Scénario : la session 1 écrit « à corriger » et pose `à-corriger`. La session 2 écrit ensuite « validé » au même sommet et pose `à-fusionner`. Le capitaine passe la PR.
- Seul `fusion-bloquée` rend une PR inéligible (`passer.sh` l.84-85).
- Le capitaine ne sait pas qu'une règle haute est touchée. Le lot 7 n'a aucune dépendance déclarée vers le lot 5.
- Deux « à corriger » en un passage consomment aussi deux tours du plafond de `A-81`.

**B6 — `A-76` retire `proprietaire.sh`, qui n'a rien à voir avec CODEOWNERS.**
- `fusionner/scripts/proprietaire.sh` l.3-5 retrouve le worktree de la session propriétaire d'une PR.
- Il est appelé par `renvoyer.sh` l.37 et cité par `fusionner/SKILL.md` l.70-71.
- Il date du 2026-11-04 (fa90696). Le commit CODEOWNERS (86daaee) n'y touche pas.

**B7 — Le passage (`A-91`) ne tient pas : un lot fusionné dans `skills` est suivi tout de suite par les sessions des projets.**
- `architecte/references/lancement.md` l.11 et l.24 : toute session lancée met le marketplace à jour, et « c'est le fichier du marketplace qui fait foi ».
- Le dépôt `skills` fusionne vers sa branche par défaut (l.54) : il n'a ni `develop` ni sujet pour retenir les lots.
- Les scripts et documents posés (`revue-exigee.mjs`, `chaine-de-production.md` § 5, le fragment `CLAUDE.md`), les étiquettes et le Relecteur n'arrivent qu'à la repose, au lot 9.
- Scénario, lot 6 fusionné : un conducteur lancé sur Fedora lit le `chantier` de la 8. Il ne contre-relit plus et pose `à-relire` sur son cadrage, sans Relecteur ni étiquette. Ses filles suivent le § 5 posé de la 7 et posent `à-fusionner`. Les PR à chemin sensible perdent la contre-revue sans rien à la place.
- « D'ici là, les chantiers en cours gardent les règles de la 7 » (spec l.69) n'a aucun mécanisme.

**B8 — Les transitions d'étiquettes ne sont pas écrites, et `fusion-bloquée` bloque le retour.**
- `renvoyer.sh` l.19 et l.24-25 pose `fusion-bloquée` et dit à l'auteur de « remettre `à-fusionner` ». `A-79` le lui interdit.
- Scénario : renvoi pour CI rouge, correction, `à-relire`, « validé », `à-fusionner`. Personne n'a retiré `fusion-bloquée` : `passer.sh` l.85 sort en 7 et la PR est sautée sans bruit (`fusionner/SKILL.md` l.60).
- Rien ne dit non plus qui retire `à-relire`, `à-corriger`, ou `à-fusionner` après un push.
- Conséquence chez le Relecteur (`A-83`) : `à-relire` reste posé pendant la relecture. À chaque réveil, ou après une relance, il renvoie « nouveau sommet, tour k » à la même session. Rien ne marque qu'un tour est déjà distribué.

## À corriger

**C1 — Règle du verdict et tri.**
- « À corriger » a deux sens : valeur du verdict (`A-78`), et gravité d'un constat (`revue-de-ticket/SKILL.md` l.50 : bloquant, à corriger, doute).
- La spec ne dit pas si un verdict « validé » peut porter des constats « à corriger », ni qui en décide.
- Le tri des faux constats des sous-agents (`revue-de-ticket/SKILL.md` l.46, `revue-adversariale/SKILL.md` l.56) n'est attribué à personne. Sans tri par la session de relecture, chaque faux bloquant devient une contestation chez le conducteur.

**C2 — Contestation (`A-80`).**
- Après un `Arbitrage: … écarté`, le dernier verdict reste « à corriger » et `A-87` refuse. Aucun chemin vers un nouveau verdict n'est décrit. Il n'est pas dit si ce passage compte comme un tour.
- Des sous-agents vierges peuvent relever le même constat sous un autre identifiant.
- PR de l'architecte : l'arbitre « seconde session de relecture » n'a pas de lanceur désigné. Un désaccord technique qui tient n'a pas d'issue (le produit n'est saisi que du métier).

**C3 — Plafond (`A-81`).**
- « Trois allers-retours » (`P-53`, spec l.18) et « au troisième verdict à corriger » ne donnent pas le même nombre de corrections : trois ou deux.
- `Tour: n sur 3` après un tour rouvert donne 4 sur 3.
- Le compte se fait par verdict et non par sommet : un second verdict après une session morte compte double.
- Le plafond `renvoisParPR` du capitaine (état `humain`, `file.sh` l.34-36) subsiste à côté. Les renvois de `A-87` l'alimentent, alors que `P-53` dit le remplacer pour cette boucle.

**C4 — L'état « arbitrage » dans la file.** `file.sh` l.97 ne liste que les PR `à-fusionner`. Une PR au plafond porte `à-corriger` et n'y paraît pas.

**C5 — Table des axes (`A-77`) incomplète.**
- Aucun axe pour une PR d'ADR, de README, de `docs/agents/`, de `CLAUDE.md`, de planches ou de workflows.
- « Du code » n'est pas défini, alors que `revue-exigee.mjs` l.24-47 a une liste.
- `/security-review` sur chemin sensible (`revue-adversariale/SKILL.md` l.25 et l.44) disparaît sans que ce soit dit.

**C6 — L'auteur lu sur `Claude-Session:` du sommet (`A-84`).**
- Aucun script ni document du plugin ne produit ni ne lit cette ligne.
- Le sommet peut être un commit du capitaine (sortie 8), d'une fille relancée ou d'un humain. Pas de repli.

**C7 — Unicité et mémoire du Relecteur.**
- `A-82` ne reprend pas la garde d'unicité du capitaine (`fusionner/SKILL.md` l.38).
- La description de `list_sessions` dans cette session dit le filtre par tag refusé aux appels faits depuis une session (lu, pas essayé).
- Un Relecteur relancé ne retrouve les sessions de relecture que par les commentaires des PR ouvertes. L'archivage à la fusion (`A-85`) demande de relire les PR fermées, ce qui n'est pas décrit.
- `chantier/SKILL.md` l.23 vérifie qu'un capitaine tourne ; rien de tel pour le Relecteur.

**C8 — Sans architecte.**
- `chantier/SKILL.md` l.15 prévoit le chantier sans programme.
- La spec n'y dit pas qui arbitre, qui reçoit le troisième tour, qui informe le produit d'une règle haute, ni qui soumet la demande d'accord (`A-74` : « l'architecte la soumet »).

**C9 — `Sensibles:` (`A-73`, `A-74`).**
- « Ou sur `develop` hors sujet » n'est pas le modèle de `Dépendances:` : `garde-commandes.mjs` l.25-59 ne lit que `origin/sujet/*` et refuse le ticket hors sujet.
- PR `hors-sujet` : `A-73` lit le sujet, `A-75` lit la base (`develop`, où le ticket n'est pas).
- Chemins exacts ou motifs : non dit. Un fichier de test neuf sous `scripts/chaine/` devient un « fichier découvert en route » remonté au produit.
- Accord en route : la ligne ne peut entrer sur le sujet que par une PR relue, car `sujet.sh carte` refuse tout autre fichier que la carte (`sujet.sh` l.46-54).

**C10 — Spec l.88, « la frontière reste la protection de GitHub décrite dans `admin.md` ».**
- La seule protection d'`admin.md` qui tient contre une PR hostile est la case CODEOWNERS (l.26-37) que `A-76` retire.
- Les sous-puces « Block force pushes » et « Aucune liste de contournement » (l.30-31) vivent dans cette case : elles sont à garder.

**C11 — Gel, plafonds, coût.**
- « Arrêter un chantier » (`chantier/SKILL.md` l.99-108) ne connaît pas les relectures : le Relecteur continuerait sur un sujet gelé.
- `A-83` remplace une session au plafond sans le produit, alors que `chantier/SKILL.md` l.88 dit qu'un plafond se signale et que le produit décide.
- Aucun rôle « relecture » dans `## Coût` (`tickets/references/scripts/docs/couts.mjs`, `tickets-regles.mjs` l.342-373) : le coût est perdu à l'archivage.

**C12 — Courses.**
- Push de l'auteur pendant une relecture : `à-fusionner` est posé sur un sommet périmé, d'où un renvoi compté. La spec ne demande pas de vérifier la tête avant de poser l'étiquette.
- L'ordre commentaire puis étiquette n'est pas fixé.
- `issue_write` écrit « la liste complète » des labels (`tickets/references/agents/issue-tracker.md` l.29) : trois sessions qui écrivent peuvent s'effacer une étiquette.

**C13 — `Label: contre-revue` (`A-89`).**
- Le gate l'exige aujourd'hui (`tickets-regles.mjs` l.404-416). La spec ne dit pas si l'obligation tombe.
- `lancement.md` l.76 et l.80 font encore livrer « selon la ligne Label: ».

**C14 — `A-86`.**
- `anchorpost compare` n'est cité nulle part dans le plugin ; son existence dans la CLI n'est pas vérifiée.
- Le Relecteur devrait extraire la PR et jouer la CLI, puis écrire « ce qui change », contre « ne résume pas » (spec l.15).
- Les deux sessions peuvent lire le verdict l'une de l'autre sur la PR.
- Aucune règle haute n'existe (`P-56`) : le lot n'a pas d'essai réel.

**C15 — ADR.** « Celle de ce chantier » (`A-76`) n'est écrite par aucun lot. Les points 1, 4, 5 et 7 de `socle-chaine-de-production/references/adr/ADR_ALL_ARC-N-chaine-de-production.md` (l.17-23) décrivent l'ancien régime.

## 1. Fidélité aux décisions du produit

| Décision | Tenue ? |
| --- | --- |
| `P-47` | Tenue (spec l.13, `A-73`, `A-74`, l.89). « Avec son nom » devient « accord du produit » dans l'exemple. |
| `P-48` | Tenue (`A-74`), sauf sans programme (C8). |
| `P-49` | Tenue dans l'intention ; inventaire faux (B6) et incomplet (lot 2 ci-dessous). |
| `P-50` | Tenue (spec l.17, `A-87`). Ajout : l'arbitre d'une PR de l'architecte (C2), à confirmer. |
| `P-51` | Déformée : exemption de la PR de mise à jour (B2). L'exemption des livraisons est une exception non dite au produit. |
| `P-52` | Tenue (spec l.14, `A-83`, `A-85`). |
| `P-53` | Approximative : compte des tours (C3). C'est le Relecteur qui arrête, pas le conducteur. |
| `P-54` | Hors sujet : publication de la CLI. L'en-tête (spec l.3) l'annonce pourtant réalisée. |
| `P-55` | Tenue, sauf « ne résume pas » contre `A-86` (C14). |
| `P-56` | Non garantie par la machine (B5). |
| `P-57` | Tenue ; lot 8 trop court (ci-dessous). |
| `P-58` | Tenue (spec l.21, `A-84`, `A-88`). |

Autre ajout à dire au produit : `A-85`, modèle « au moins celui de l'auteur ». Il change le coût : les PR du conducteur et de l'architecte sont relues en Opus.

## 2. Faits sur l'existant

- **Vrais** :
  - `revue-de-ticket/SKILL.md` étapes 2 à 5 ;
  - l'obligation `## Rétro` (`tickets-regles.mjs` l.582-583) ;
  - le générateur CODEOWNERS, la clé `proprietaires`, l'entrée de `gatesRapides` (`chaine.json`) ;
  - l'en-tête du générateur (`codeowners.mjs` l.85) ;
  - l'état « attend un propriétaire » (`file.sh` l.20-26) ;
  - `chantier` § 6 donne `rafraichir` au conducteur (l.96) ;
  - l'architecte lance le capitaine (`architecte/SKILL.md` l.60).
- **Faux** : `proprietaire.sh` (B6) ; « la lecture de `commits-a-relire.mjs` » (B1) ; la mise à jour d'un sujet fabriquée par le capitaine (B2).
- **Approximatifs** :
  - « `chantier/SKILL.md` § 5 » (spec l.7 et l.64) : la contre-revue est au § 6 point 5 (l.95) ; le § 5 traite des vagues.
  - « Ne vérifie que la présence d'un titre » : seulement pour les chemins de `exigeRevue`, et aussi `motifTitreSansCode` (`revue-exigee.mjs` l.235).
  - « Sur le modèle de `Dépendances:` » (C9).
  - « Les états attend un propriétaire » : l'état lié « attend un humain » (`file.sh` l.27-33, `github.sh` l.270-283) n'est pas nommé, et se confond avec `humain`.
  - Étiquettes « à créer par l'administrateur » : c'est `labels.sh`, « les sept labels ».
  - `A-92` : l'ordre `à-fusionner au sommet <sha>` est écrit aujourd'hui par la session qui livre (`lancement.md` l.76), pas seulement par l'architecte.

## 4. Ce que les lots oublient

- **Lot 1** : `sujet/scripts/sujet.sh` (`fusionner`) ; `agent/garde-fichiers.mjs`, `regles.mjs` et leurs tests ; `revue-adversariale/scripts/chemins-sensibles.mjs` ; `tickets/references/gabarits/ticket.issue.md` et `carte.map.md` ; `chaine-de-production.md` § 3.
- **Lot 2** :
  - `agent/regles.mjs` l.41-65 (refus d'éditer CODEOWNERS) et son test ;
  - `fusionner/scripts/github.sh` l.224-293, `passer.sh`, `file.sh`, `boucle.sh` ;
  - `fusionner.test.mjs` (31 mentions), `veille.test.mjs`, `sujet/scripts/faux-gh.mjs` ;
  - `fusionner/SKILL.md` l.64, `fusionner/references/CONTENU.md` ;
  - `socle-chaine-de-production/SKILL.md` l.10, 26, 38, 42, 63, 74, 89 ; son `CONTENU.md` ; `admin.md` ; `fragments/claude-md-fusion.md` ;
  - `chaine-de-production.md` l.3 et l.85 ; `chantier/SKILL.md` l.95 ;
  - `README.md`, `scripts/depot.test.mjs`, `scripts/poses.test.mjs`, `scripts/points-d-entree.test.mjs`.
- **Lot 3** :
  - sort de `revue-de-ticket/` et `revue-adversariale/` : ils restent invocables par le modèle, avec leur `poser`, et `scripts/poses.test.mjs` l.17-18 les connaît ;
  - `references/section-pr.md` des deux skills ;
  - `revue-de-ticket/references/criteres-ticket.md` l.92 (« Qui joue T3 ») ;
  - `skills/monorepo/socle-monorepo/references/scripts/verify/references-agent-integrees.json` l.7 : sans `relecture` ni `relecteur`, le gate `references-agent` des projets refusera leurs citations ;
  - `.claude-plugin/plugin.json`, `README.md`.
- **Lot 4** : `labels.sh` et « sept labels » (`socle-chaine-de-production/SKILL.md` l.3, 39, 90 ; `admin.md` l.10) ; `tickets/references/gabarits/programme.md` (ligne `Capitaines:`) ; `architecte/SKILL.md` § 6.3 ; `CONTEXT.md` (aucun terme nouveau n'y est prévu).
- **Lot 5** : `passer.sh` ; `sujet.sh` l.722-739 et son en-tête l.549-576 ; `renvoyer.sh` l.19 ; `github.sh` (lecture des commentaires) ; `faux-gh.mjs`, `depot-jouet.mjs` ; `revue-exigee.test.mjs`, `fusionner.test.mjs`, `sujet-fusionner.test.mjs` ; `fusionner/SKILL.md` l.18-22 ; `sujet/SKILL.md`.
- **Lot 6** :
  - `fragments/claude-md-fusion.md` ; `skills/monorepo/socle-monorepo/references/racine/CLAUDE.md` l.44 ;
  - `tickets/references/agents/issue-tracker.md` l.29 ;
  - `chaine-de-production.md` l.17-20 (rôles), l.65, l.121-127 ;
  - `lancement.md` l.72-80 ; `architecte/SKILL.md` l.72, 92, 94 (PR étrangère) ;
  - `sujet.sh` l.871 (`livrer` pose lui-même `à-fusionner`) ;
  - `tickets/references/scripts/docs/avancement.mjs` ;
  - `recette-humaine/SKILL.md`, `criticite/SKILL.md` l.19 ;
  - `skills/monorepo/socle-monorepo/references/methode/conception.md` l.106 (revue par l'auteur ; repéré par recherche, pas lu en entier).
- **Lot 8** : `chantier/SKILL.md` l.3, 43, 110-115 et son `CONTENU.md` ; `chaine-de-production.md` l.29 et l.40 ; `pieges.md` l.3 ; `carte.map.md` l.50 ; `tickets.mjs` l.17 ; `tickets.test.mjs` l.67-73 ; `couts.test.mjs` l.15 ; `README.md` l.88.

## 5. Ordre et dépendances

- **Manquantes** : 3 dépend de 1 (l'axe « chemin sensible ») ; 6 dépend de 1 (sinon les chemins sensibles n'ont plus ni contre-revue ni accord) ; 7 dépend de 3, 4 et 5 ; 5 dépend de 4 (état « arbitrage ») ; la repose conditionne l'effet de 6 (B7).
- **Mal rangées** : `A-79` est au lot 4, mais c'est le skill du lot 3 qui pose les étiquettes. `A-80` est au lot 3, mais ses arbitres sont au lot 6 et sa lecture par le capitaine au lot 5.
- **« 1, 2 et 8 indépendants »** : vrai en logique, faux en fichiers. Les lots 1, 2, 5, 6 et 8 partagent `passer.sh`, `regles.mjs`, `chantier/SKILL.md` l.95, `chaine-de-production.md`, `tickets-regles.mjs`, `fusionner.test.mjs` et `scripts/depot.test.mjs`. Ils ne tiennent pas dans une même vague.

## 6. Vocabulaire

- **Relecteur / relecteur** : la majuscule seule distingue l'aiguilleur, qui ne relit rien, des sous-agents (spec l.7, `A-88`). L'existant a déjà « Relecteur adversaire » (`chaine-de-production.md` l.20), « relecteur humain » et « relecteur indépendant » (`criteres-ticket.md` l.92). Dans `P-50`, « le relecteur » est la session de relecture.
- **Propriétaire** : la session propriétaire d'une PR, ou le propriétaire de CODEOWNERS. C'est l'origine de B6.
- **À corriger** : verdict, étiquette, gravité (C1).
- **Tour / aller-retour** (C3). « Tour » désigne aussi un tour de boucle du capitaine et les « deux tours » de l'ancienne revue.
- **Arbitrage** : la ligne `Arbitrage:` du conducteur (`A-80`), et l'état « arbitrage » de l'architecte (`A-81`).
- **La file** : celle du capitaine et celle du Relecteur (`A-81`, `A-83`, lots 4 et 5).
- **Relecture / revue** : le skill `relecture` garde les critères de « revue », et `revue-exigee.mjs` lirait un verdict de relecture.
- **Défaut / constat / bloquant** pour la même chose (spec l.15, l.17, `A-78`) ; **étiquette / label** ; **sommet / tête** dans la même phrase (`A-87`).
- **« Sonner »** n'est pas défini.

## Notes

- La « Vérification d'ensemble » (spec l.100) n'appartient à aucun lot et demande de vraies sessions. Le critère de `criteres-ticket.md` l.86-89 exige en plus un essai sur la copie d'un dépôt réel pour un script qui modifie un projet, comme le retrait de CODEOWNERS à la repose.
- Le lecteur de verdict doit tolérer le pied de page que les sessions cloud ajoutent aux commentaires (`lancement.md` l.57).
- Une PR hors brouillon pendant les corrections relance toute la CI à chaque push (`chaine-de-production.md` l.122).
- Supposé, à sonder : une session de relecture réveillée par message d'une autre session pose `à-fusionner`. Le mode « auto » a déjà refusé un ordre venu d'une session (`lancement.md` l.93).
