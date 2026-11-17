# Ce qu'un administrateur du dépôt fait à la main

Le skill ne peut pas le faire : l'API GitHub refuse ces réglages depuis une session cloud, ou ils demandent le rôle d'administrateur. À faire une fois, dans Settings du dépôt, puis cocher ici.

- [ ] **Branche par défaut : `develop`.** Settings → General → Default branch. `develop` est créée depuis `main` par `bash scripts/github/develop.sh` ; si ce push a été refusé (droits), la créer ici : Branches → New branch, source `main`. `main` reste la branche livrée : seul le capitaine y fusionne, par la PR de livraison.
- [ ] **Protection de `develop`** (Settings → Branches → Add rule, ou Rulesets) : « Require a pull request before merging » ; « Require status checks to pass » avec **« Require branches to be up to date before merging »** (c'est le `strict: true` dont dépend le capitaine) et les checks `qualite` et `test-db` ; « Require review from Code Owners » (case « CODEOWNERS respecté » ci-dessous) ; « Do not allow bypassing the above settings ». Pas de « Require linear history » : un sujet entre par un commit de merge.
- [ ] **Protection de `main`** : même règle, plus « Restrict who can push » aux administrateurs.
- [ ] **Pull Requests** (Settings → General) : « Allow merge commits » et « Allow squash merging » cochés ; **« Automatically delete head branches »** coché : GitHub supprime la branche d'une PR fusionnée et recible de lui-même les PR qui la visaient.
- [ ] **Check `zizmor` exigé** sur `develop` et `main`, à côté de `qualite` et `test-db`, dès que son premier run a tourné.
- [ ] **Les sept labels** : `bash scripts/github/labels.sh` depuis un poste où `gh` est authentifié (`--liste` pour les lire).
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
  (le script de démarrage part du dossier qui contient les clones ; la boucle sert tous les dépôts de l'environnement).

- [ ] **Claude Code 2.1.295 au moins**, sur chaque poste et dans l'environnement cloud : les trois gardes de `PreToolUse` portent `"onFailure": "block"`, que cette version introduit. Le comportement d'une version plus ancienne devant cette clé n'est pas établi.
- [ ] **CODEOWNERS respecté : un chemin sensible est relu par un humain, et GitHub le tient** ({{ADR_CODEOWNERS}}). `.github/CODEOWNERS` est généré depuis `.claude/chaine.json` (`cheminsSensibles`, plus CODEOWNERS lui-même et `.claude/chaine.json`, tous à `proprietaires`) par `pnpm codeowners` ; le gate `codeowners` refuse tout écart, et `garde-fichiers` refuse son édition. Seul GitHub tient contre une PR hostile : la revue exigée par le capitaine est écrite par la session, et le capitaine exécute ce qui entre (hooks git, `pnpm install`, `pnpm check`).
  - **Deux propriétaires humains au moins.** L'auteur d'une PR ne peut pas l'approuver : quand les sessions publient sous le compte d'un humain, cet humain n'approuve aucune de leurs PR, et il faut un deuxième propriétaire humain dans `proprietaires` (ou des sessions qui publient sous un compte non propriétaire : un bot, une GitHub App). **Avec un seul humain, la règle ne protège pas** : ou bien toute PR qui touche un chemin sensible attend une approbation que personne ne peut donner, ou bien l'humain contourne la règle, et ce contournement est l'écart qu'elle devait empêcher. Ne pas la cocher tant qu'il n'y a pas deux propriétaires ; la case reste ouverte ici, et le projet sait qu'il n'est pas protégé.
  - Sur **`develop`**, dans la règle de PR : **« Require review from Code Owners »**, avec « Required approvals » à 0 (une PR qui ne touche aucun chemin possédé n'attend personne). Vérifier sur une PR d'essai qu'une PR qui touche un chemin sensible attend bien un propriétaire. **Ne pas cocher** « Dismiss stale pull request approvals when new commits are pushed » ni « Require approval of the most recent reviewable push » : le capitaine pousse la mise à jour avec develop juste avant chaque fusion, et l'approbation tomberait à chaque fois.
  - Sur **`main`**, la même règle.
  - **« Block force pushes »** sur toutes les branches (cible `~ALL`) ; **« Restrict deletions »** sur `develop` et `main`.
  - **Aucune liste de contournement** (« Bypass list » vide) et « Do not allow bypassing the above settings » : un administrateur qui contourne la règle la retire pour tous.
  - **GitHub lit CODEOWNERS sur la branche visée**, jamais dans la PR : une PR qui modifie CODEOWNERS ou `.claude/chaine.json` est jugée par l'ancienne version. Elle ne retire pas elle-même son propriétaire ; un chemin qu'elle rend sensible n'est tenu qu'après sa fusion.
  - Pas de règle de PR sur `sujet/*` ni sur les branches de travail, où le capitaine et les sessions poussent sans PR (elle bloquerait la chaîne) : une sous-PR entre dans son sujet sans cette approbation, et la livraison du sujet vers develop la demande.
  - Les motifs de CODEOWNERS sont **sensibles à la casse** (`Apps/` n'est pas `apps/` pour GitHub). GitHub signale les erreurs de CODEOWNERS dans l'interface du fichier : le lire après la première pose.

  Le capitaine n'est pas bloqué : une PR qui attend un propriétaire n'est ni rouge ni renvoyée, `file.sh` la montre `attend un propriétaire` et il la reprend au tour suivant, une fois approuvée. Coût : chaque PR qui touche un chemin sensible attend un humain, livraisons de sujet comprises.

Vérification : `gh api repos/{owner}/{repo}/rules/branches/develop --jq '.[] | select(.type == "required_status_checks") | .parameters.strict_required_status_checks_policy'` rend `true` (l'ancienne API `branches/develop/protection` répond 404 quand un ruleset protège la branche).
