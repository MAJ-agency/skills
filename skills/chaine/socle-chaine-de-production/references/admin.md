# Ce qu'un administrateur du dépôt fait à la main

Le skill ne peut pas le faire : l'API GitHub refuse ces réglages depuis une session cloud, ou ils demandent le rôle d'administrateur. À faire une fois, dans Settings du dépôt, puis cocher ici.

- [ ] **Branche par défaut : `develop`.** Settings → General → Default branch. `develop` est créée depuis `main` par `bash scripts/github/develop.sh` ; si ce push a été refusé (droits), la créer ici : Branches → New branch, source `main`. `main` reste la branche livrée : seul le capitaine y fusionne, par la PR de livraison.
- [ ] **Protection de `develop`** (Settings → Branches → Add rule, ou Rulesets) : « Require a pull request before merging », **sans** « Require review from Code Owners » (le produit l'a retirée le 2026-11-18 : aucun `.github/CODEOWNERS` n'est posé, et GitHub ne bloque aucune PR sur les chemins sensibles) et avec **« Required approvals » à 0** (toutes les sessions publient sous un même compte, et GitHub ne laisse pas un auteur approuver sa propre PR : avec une approbation exigée, GitHub refuse la fusion de toute PR que personne d'autre n'a approuvée, et le capitaine s'arrête sur ce refus, `passer.sh` sortie 3) ; « Require status checks to pass » avec **« Require branches to be up to date before merging »** (le filet de GitHub ; le capitaine vérifie aussi l'ascendance lui-même avant chaque fusion, skill `fusionner`) et les checks `qualite` et `test-db` ; **« Restrict deletions »** ; « Do not allow bypassing the above settings », et **aucune liste de contournement** (« Bypass list » vide) : un administrateur qui contourne la règle la retire pour tous. Pas de « Require linear history » : un sujet entre par un commit de merge. Pas de règle de PR sur `sujet/*` ni sur les branches de travail, où le capitaine et les sessions poussent sans PR : elle bloquerait la chaîne.
- [ ] **Protection de `main`** : même règle, plus « Restrict who can push » aux administrateurs.
- [ ] **Pull Requests** (Settings → General) : « Allow merge commits » et « Allow squash merging » cochés ; **« Automatically delete head branches »** coché : GitHub supprime la branche d'une PR fusionnée et recible de lui-même les PR qui la visaient.
- [ ] **Check `zizmor` exigé** sur `develop` et `main`, à côté de `qualite` et `test-db`, dès que son premier run a tourné.
- [ ] **Les neuf labels**, dont `à-relire` et `à-reprendre`, à créer avant la repose qui passe le dépôt en régime 8 : `bash scripts/github/labels.sh` depuis un poste où `gh` est authentifié (`--liste` pour les lire).
- [ ] **Secrets et variables de la CI**, selon l'hébergement choisi.
- [ ] **Environnement cloud Claude Code** (réglage du compte, pas du dépôt : menu de l'environnement dans la barre de titre d'une session cloud, puis Edit → Setup script). Pour que chaque session, fille comprise, ait les skills de la chaîne, le script installe le plugin depuis GitHub et le met à jour à chaque démarrage :

  ```bash
  claude plugin marketplace add MAJ-agency/skills || true
  claude plugin install maj-skills@maj || true
  claude plugin marketplace update maj || true
  claude plugin update maj-skills@maj || true
  ```

  Pour que chaque session trouve sa base allumée sans Docker, ajouter **ensuite** au script de démarrage, `<dépôt>` étant le dossier du dépôt :
  `for depot in */; do if [ -f "${depot}scripts/db/demarrer-local.sh" ]; then bash "${depot}scripts/db/demarrer-local.sh" || true; fi; done`
  (le script de démarrage part du dossier qui contient les clones ; la boucle sert tous les dépôts de l'environnement). La session du capitaine, elle, survit à un recyclage de sa machine sans repasser par ce script : le projet déclare la même commande dans `preparerCapitaine` de `.claude/chaine.json`, que sa veille joue après chaque redémarrage (skill `fusionner`).

- [ ] **Claude Code 2.1.295 au moins**, sur chaque poste et dans l'environnement cloud : les trois gardes de `PreToolUse` portent `"onFailure": "block"`, que cette version introduit. Le comportement d'une version plus ancienne devant cette clé n'est pas établi.
- [ ] **« Block force pushes »** sur toutes les branches (Rulesets, cible `~ALL`), sans liste de contournement.

Ce que ces règles ne tiennent pas : toutes les sessions écrivent sous le même compte, la revue exigée par le capitaine est écrite par la session, et le capitaine exécute ce qui entre (hooks git, `pnpm install`, `pnpm check`). Aucune n'arrête une PR hostile.

Vérification : `gh api repos/{owner}/{repo}/rules/branches/develop --jq '.[] | select(.type == "required_status_checks") | .parameters.strict_required_status_checks_policy'` rend `true` (l'ancienne API `branches/develop/protection` répond 404 quand un ruleset protège la branche).
