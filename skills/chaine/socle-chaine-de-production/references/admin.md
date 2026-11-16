# Ce qu'un administrateur du dépôt fait à la main

Le skill ne peut pas le faire : l'API GitHub refuse ces réglages depuis une session cloud, ou ils demandent le rôle d'administrateur. À faire une fois, dans Settings du dépôt, puis cocher ici.

- [ ] **Branche par défaut : `develop`.** Settings → General → Default branch. `develop` est créée depuis `main` par `bash scripts/github/develop.sh` ; si ce push a été refusé (droits), la créer ici : Branches → New branch, source `main`. `main` reste la branche livrée : seul le capitaine y fusionne, par la PR de livraison.
- [ ] **Protection de `develop`** (Settings → Branches → Add rule, ou Rulesets) : « Require a pull request before merging » ; « Require status checks to pass » avec **« Require branches to be up to date before merging »** (c'est le `strict: true` dont dépend le capitaine) et les checks `qualite` et `test-db` ; « Do not allow bypassing the above settings ». Pas de « Require linear history » : un sujet entre par un commit de merge.
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
- [ ] **Recommandé, non posé par défaut : la frontière contre une PR hostile.** La revue exigée par le capitaine vaut pour des sessions de bonne foi : la section de revue est écrite par la session, et le capitaine exécute ce qui entre (hooks git, `pnpm install`, `pnpm check`). Seul GitHub tient contre une PR hostile :
  - un fichier `.github/CODEOWNERS` qui suit le plancher de `revue-exigee.mjs` (skill `fusionner`). La dernière ligne qui touche un chemin l'emporte, et les motifs sont **sensibles à la casse** (`Apps/` n'est pas `apps/` pour GitHub) : d'abord `*` (propriétaire par défaut de tout), puis `/*.md` et les dossiers de documentation (`/docs/`) **sans propriétaire**, puis, avec un propriétaire : `/apps/`, `/packages/`, `/scripts/`, `/e2e/` (explicitement : selon la documentation GitHub, `docs/*` prend `docs/getting-started.md` mais pas `docs/build-app/troubleshooting.md`, donc `/*` ne prend que les fichiers de la racine), `.*` (fichiers et dossiers à point, à toute profondeur), `package.json`, `package.json5`, `package.yaml`, `package.yml`, `CLAUDE.md`, `CLAUDE.local.md`, les extensions exécutables (`*.js`, `*.mjs`, `*.cjs`, `*.ts`, `*.mts`, `*.cts`, `*.jsx`, `*.tsx`, `*.sh`, `*.bash`, `*.zsh`, `*.py`, `*.rb`, `*.pl`, `*.ps1`, `*.php`), `*.config.*`, `*rc`, `*rc.*`, `/docs/agents/`, le fichier des critères (`criteresRevue`), et les chemins sensibles du projet. GitHub signale les erreurs de CODEOWNERS dans l'interface du fichier : le lire avant de l'appliquer ;
  - un propriétaire ne peut pas approuver sa propre PR. Les sessions ouvrent donc leurs PR sous une autre identité que celle d'un propriétaire (un bot, une GitHub App), ou un second humain approuve ;
  - sur `develop` et `main`, la règle de PR avec « Require review from Code Owners » : une PR qui touche ces chemins attend l'approbation d'un propriétaire avant que le capitaine la fusionne. **Ne pas cocher** « Dismiss stale pull request approvals when new commits are pushed » ni « Require approval of the most recent reviewable push » : le capitaine pousse la mise à jour avec develop juste avant chaque fusion, et l'approbation tomberait à chaque fois. Pas sur `sujet/*` ni sur les branches de travail, où le capitaine et les sessions poussent sans PR (une règle de PR y bloquerait la chaîne) : une sous-PR entre dans son sujet sans cette approbation, et la livraison du sujet vers develop la demande ;
  - « Block force pushes » sur toutes les branches (cible `~ALL`) ;
  - « Restrict deletions » sur `develop` et `main` ;
  - « Do not allow bypassing the above settings », et aucune liste de contournement (« Bypass list » vide).

  Coût : chaque PR qui touche ces chemins attend un humain, livraisons de sujet comprises.

Vérification : `gh api repos/{owner}/{repo}/rules/branches/develop --jq '.[] | select(.type == "required_status_checks") | .parameters.strict_required_status_checks_policy'` rend `true` (l'ancienne API `branches/develop/protection` répond 404 quand un ruleset protège la branche).
