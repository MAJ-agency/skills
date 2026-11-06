# Ce qu'un administrateur du dépôt fait à la main

Le skill ne peut pas le faire : l'API GitHub refuse ces réglages depuis une session cloud, ou ils demandent le rôle d'administrateur. À faire une fois, dans Settings du dépôt, puis cocher ici.

- [ ] **Branche par défaut : `develop`.** Settings → General → Default branch. `main` reste la branche livrée : seul le capitaine y fusionne, par la PR de livraison.
- [ ] **Protection de `develop`** (Settings → Branches → Add rule, ou Rulesets) : « Require a pull request before merging » ; « Require status checks to pass » avec **« Require branches to be up to date before merging »** (c'est le `strict: true` dont dépend le capitaine) et les checks `qualite` et `test-db` ; « Do not allow bypassing the above settings ». Pas de « Require linear history » : un sujet entre par un commit de merge.
- [ ] **Protection de `main`** : même règle, plus « Restrict who can push » aux administrateurs.
- [ ] **Pull Requests** (Settings → General) : « Allow merge commits » et « Allow squash merging » cochés ; **« Automatically delete head branches »** coché : GitHub supprime la branche d'une PR fusionnée et recible de lui-même les PR qui la visaient.
- [ ] **Check `zizmor` exigé** sur `develop` et `main`, à côté de `qualite` et `test-db`, dès que son premier run a tourné.
- [ ] **Les sept labels** : `bash scripts/github/labels.sh` depuis un poste où `gh` est authentifié (`--liste` pour les lire).
- [ ] **Secrets et variables de la CI**, selon l'hébergement choisi.
- [ ] **Environnement cloud Claude Code** (réglage du compte, pas du dépôt : menu de l'environnement dans la barre de titre d'une session cloud, puis Edit → Setup script). Pour que chaque session trouve sa base allumée sans Docker, ajouter au script de démarrage, `<dépôt>` étant le dossier du clone :
  `for depot in */; do if [ -f "${depot}scripts/db/demarrer-local.sh" ]; then bash "${depot}scripts/db/demarrer-local.sh" || true; fi; done`
  (le script de démarrage part du dossier qui contient les clones ; la boucle sert tous les dépôts de l'environnement).

Vérification : `gh api repos/{owner}/{repo}/rules/branches/develop --jq '.[] | select(.type == "required_status_checks") | .parameters.strict_required_status_checks_policy'` rend `true` (l'ancienne API `branches/develop/protection` répond 404 quand un ruleset protège la branche).
