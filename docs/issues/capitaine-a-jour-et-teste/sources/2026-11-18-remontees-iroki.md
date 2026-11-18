# Remontées d'Iroki, 2026-11-18 — entrée brute

Message du conducteur du programme Iroki (`MAJ-agency/iroki-monorepo`), transmis par le produit dans la session de l'architecte de `skills` le 2026-11-18. Entrée brute : ni spec, ni décision. Les points déjà corrigés dans Iroki citent leur ticket et leur PR ; le code est sur `develop` d'`iroki-monorepo`, ou sur `sujet/alignement-de-la-chaine` tant qu'il n'est pas livré.

## A. Capitaine (skill fusionner) — prioritaire

1. **Préparer l'environnement au démarrage.** La plateforme recycle la machine du capitaine plusieurs fois par jour. La session perd alors sa base locale, et le pre-push de la boucle échoue ensuite (coverage-diff sans base). Demandé :
   - `veille.sh` lance, au démarrage et après chaque redémarrage détecté, une étape « préparer l'environnement » déclarée dans `.claude/chaine.json` (par exemple `preparerCapitaine: "bash scripts/db/demarrer-local.sh"`) ;
   - elle vérifie la réussite de l'étape et ne fusionne rien sinon ;
   - pour Iroki : une base en UTF8, migrée depuis develop seul, et le refus d'une migration absente de develop. Une base en SQL_ASCII a cassé normalize(), une migration de sujet restée en base a cassé db:migrate.
2. **Durée de la veille.** La limite de 2 h des tâches de fond tue la veille au milieu d'un passage. La durée par défaut doit rester sous cette limite, avec une marge pour un passage de 40 min.
3. **Panne de GitHub.** Un 502 fait planter un tour (jq sur null). Une réponse vide doit se traiter comme une panne réseau : sortie 5 et relance.
4. **Refus du pre-push.** Refusé à la mise à jour avec develop, il doit renvoyer la PR, pas arrêter la boucle. Le refus se classe par une trace positive de husky ; tout le reste est un échec fermé (Iroki SOC-4.77, #633).
5. **`sujet.sh livrer`** pose lui-même `à-fusionner` sur la PR de livraison. Or une livraison touche des chemins sensibles et doit attendre la contre-revue : ne pas poser le label, ou seulement si la PR ne touche aucun chemin sensible.
6. **Check `titre` des PR de réception.** Les PR qui reçoivent develop dans un sujet échouent à ce check, faute de section « Revue adversariale ». La générer, ou documenter qu'elle est exigée.

## B. Sujets (skill sujet)

7. **Refs non élaguées.** `carte` lit des refs `origin/sujet/*` non élaguées : un sujet supprimé y apparaît encore. Correctif : `--prune` limité au refspec `sujet/*` (Iroki SOC-4.79, #643). Reste ouvert : `carte_lue` et la boucle de `demarrer` lisent les refs locales sans fetch.
8. **Garde de lignée de `fusionner`.** Une réception faite en plusieurs merges successifs est refusée. À documenter dans la consigne de réception : partir du sujet à jour, en un seul merge.

## C. Contrôles (skills socle-tests et socle-chaine-de-production)

9. **coverage-diff sans `DATABASE_URL`.** Un fichier couvert seulement par des suites sur base passe en avertissement, et c'est la CI qui juge (Iroki SOC-4.77).
10. **coverage-diff à la réception de develop.** Le code apporté par develop est remesuré. Correctif : quand la plage poussée fait entrer develop (HEAD contient origin/develop, la base non), lire le diff contre origin/develop (Iroki SOC-4.82, #649).
11. **Identifiants nus.** Refuser ceux dont la cible n'existe que sur un sujet ouvert : lire les types de la tête et de la base, élaguer les sujets (Iroki SOC-4.69, #631).
12. **pr-titre.** Il doit lire le diff comme le capitaine (Iroki SOC-4.76, #628).
13. **Couleurs de `node --test`.** Sous un terminal, il pose FORCE_COLOR=1 : les bancs doivent l'ôter et poser NO_COLOR=1 (Iroki SOC-4.72, `environnementGitIsole`).
14. **Numéros en double entre sessions de plusieurs comptes.** `next-id` ne regarde que la branche courante ; il doit lire aussi develop et tous les `origin/sujet/*`. Exemples : deux SOC-4.78, deux ADR_ALL_ARC-18, créés en même temps.
15. **Tests dépendants de l'heure.** Seed et tests en base cassent selon le jour, la date ou l'heure de Paris (Iroki SOC-4.74, ENT-6.49, ENT-7.21). Il faut une règle et un modèle dans socle-tests :
   - jour de Paris lu par l'horloge injectée ;
   - données créées par le test plutôt que lues dans le seed partagé ;
   - banc à horloge posée.

## D. Gardes d'agent (scripts/agent, skill socle-chaine-de-production)

16. **Lecture de la sous-commande git** (Iroki SOC-4.70, #652). Les gardes lisent la sous-commande git après ses options globales (-C, -c, --git-dir, --config-env). Elles refusent core.hooksPath posé par -c, par GIT_CONFIG_* et par `git config`. Elles rendent opaques les valeurs $(…), les accents graves et `\ `.
17. **Revue de sécurité obligatoire** sur toute PR qui touche `scripts/agent/**`. Sur Iroki, elle a trouvé deux contournements que deux tours de contre-revue n'avaient pas vus.
18. **Écriture d'un fichier chargé par les gardes.** Un fichier comme `regles.mjs` s'écrit d'un seul coup : copie, `node --check`, import, pose. Écrit à moitié, il a bloqué une session, qui ne pouvait plus le réparer. Ne pas passer en échec ouvert. Le message de refus doit dire comment sortir : faire restaurer le fichier depuis git par un humain.
19. **« Jamais d'amend »**, consigne à rendre plus visible dans les consignes des sessions.

## E. Mobile en CI (skill socle-mobile-expo)

20. **Émulateur Android à 2 cœurs** : il perd des lancements et fait des ANR du lanceur. Corrigé dans Iroki (SOC-4.55, #637 ; SOC-4.84, #658 ; ADR_ALL_ARC-19) par :
   - 4 cœurs et 4 Go ;
   - un sous-flux cold-start, avec une relance unique et comptée ;
   - hide_error_dialogs ;
   - un compteur d'incidents par processus, lu dans `events`, qui met le run au rouge sur un ANR ou un crash de l'app ;
   - un timeout propre à l'étape Maestro ;
   - un diagnostic par parcours en échec.

   Restent ouverts : un ANR du lanceur né avant les parcours (SOC-4.85), et des taps d'onglet captés par la navigation par gestes sur un écran de 320×640 (SOC-4.83, en cours).
21. **Filtre `paths` de pull_request.** Il lit le diff de toute la PR : un commit de docs seul relance mobile-e2e. À documenter, ou trier par le diff du dernier commit.

## Livrables demandés

- Un ticket par groupe (A à E), ou plus fin, avec la source Iroki citée.
- Les PR une à une, A1 à A6 d'abord.
- Pour chaque PR, la version du plugin et ce qu'Iroki devra reposer (fichiers, réglage de `chaine.json`).
- Aucune fusion par l'architecte : Guillaume fusionne.
- Une question de produit ou de méthode va à Guillaume, avec des options et une recommandation.
