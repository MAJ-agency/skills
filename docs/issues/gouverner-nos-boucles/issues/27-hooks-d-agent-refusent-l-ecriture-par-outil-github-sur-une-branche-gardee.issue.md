# Une seule définition de branche gardée pour `git push`, `gh` et les outils GitHub, et des gardes qui échouent fermées, mineure du plugin

Status: ready-for-agent
Type: défaut
Label: contre-revue
Modèle: opus — hooks de sécurité : le code et les tests sont donnés entiers, joués sur une copie jetable de `origin/main` (voir « Où »), mais la revue passe `/security-review` et la session doit juger les contournements qu'elle y trouve.
Blocked by: — (le ticket 26 est fait : PR 86)
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/entree.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/garde-github.mjs` (créé), `skills/chaine/socle-chaine-de-production/references/agent/garde-github.test.mjs` (créé), `skills/chaine/socle-chaine-de-production/references/settings-hooks.json`, `skills/chaine/socle-chaine-de-production/references/scripts/verify/settings-json-regles.mjs`, `skills/chaine/socle-chaine-de-production/references/scripts/verify/settings-json.test.mjs`, `skills/chaine/socle-chaine-de-production/SKILL.md`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/admin.md`, `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md`, `skills/chaine/sujet/SKILL.md`, `.claude-plugin/plugin.json`

## Le besoin

Rapporté le 2026-11-14 par un projet, sur le plugin 7.5.0 : le refus « push vers `sujet/…` » des hooks d'agent ne voit que l'outil Bash. `mcp__github__push_files` et `mcp__github__create_or_update_file` sur une branche `sujet/x`, et `gh api -X PATCH …/git/refs/heads/sujet/x`, passent. Cela défait la raison que le hook donne lui-même : « un sujet ne se pousse jamais à la main […] Sans ce refus, une session écrirait elle-même la ligne `Dépendances:` qui l'autorise » (`regles.mjs:155-156`). Le même trou vaut pour `develop`, `main` et la fusion d'une PR sans ses contrôles.

L'instruction, deux relectures et l'architecte en ont trouvé d'autres :

- `git push origin HEAD:refs/heads/develop` (et `HEAD:refs/heads/main`, `HEAD:heads/develop`, `HEAD:DEVELOP`, ou `git push` nu depuis `develop`) passe le hook sur `origin/main` : la règle par motif (`regles.mjs:72`, `[\s:](develop|main)(\s|$)`) ne lit que le nom nu ;
- une barre oblique inverse cache une commande `gh` (`gh pr \⏎ merge 3`, `\gh pr merge 3`) : la PR 86 n'a recollé les lignes que dans `pushs()` ;
- une substitution de commande placée avant la sous-commande cache `git` et `gh` : `git -C "$(pwd)" push origin HEAD:sujet/x`, `git -C $(pwd) push --force origin feat/x` et `gh -R $(echo o/r) pr merge 3` passent sur `origin/main`, parce que le découpage sur `(` et `)` coupe la commande avant `push` ou `merge` ;
- l'outil `update_pull_request_branch` écrit sur la **tête** de la PR : sur une PR de livraison (`sujet/x` → `develop`) ou une PR dont la tête est `main`, il écrit sur une branche gardée ;
- un hook de garde qui plante, dépasse son délai ou reçoit une entrée qu'il ne lit pas laisse passer l'outil.

Les règles du produit, intangibles :

> jamais `--no-verify`, jamais de push forcé ni de réécriture, jamais de fusion avec un contrôle exigé rouge, jamais de test sauté ou assoupli, jamais de push sur la branche par défaut

Quand le ticket est fait : une seule définition de « branche gardée » (`brancheGardee` : un `sujet/…`, `develop`, `main`, la branche par défaut, sous toutes leurs graphies) sert `git push`, `gh` et les outils GitHub ; un hook `PreToolUse` refuse l'écriture d'une branche gardée par un outil GitHub (MCP), toute fusion par outil d'une PR dont la base est gardée ou ne se lit pas, et toute mise à jour par outil d'une PR dont la tête est gardée ou ne se lit pas ; une substitution de commande ne cache plus rien ; `garde-commandes` refuse `gh` en écriture vers une branche, un fichier ou une règle de branche ; les trois gardes de `PreToolUse` échouent fermées (`"onFailure": "block"`, un `"timeout"` à la mesure de leurs pires délais), et le gate `settings-json` l'exige (un `timeout` numérique d'au plus 60 s, la commande exacte de chaque garde, pas de `disableAllHooks`) ; aucune commande refusée sur `origin/main` ne passe après ; ce qui reste hors d'atteinte d'un hook est écrit, avec la procédure de reprise quand une garde casse ; la frontière réelle est recommandée au produit.

## Où

Base : `origin/main` à `ea7ea67` (#87), plugin **7.6.0**, **435 tests** ; le ticket 26 y est fusionné (#86, `b94eeb0`), et #87 ne touche aucun fichier de ce ticket hormis la ligne `:13` de `skills/chaine/sujet/SKILL.md` (pas celle citée ici). Toutes les lignes ci-dessous sont relues sur `ea7ea67`. `A` abrège `skills/chaine/socle-chaine-de-production/references/agent`, `R` abrège `skills/chaine/socle-chaine-de-production/references`.

### Ce que les hooks voient aujourd'hui

| Matcher (`R/settings-hooks.json`) | Script | Ce qu'il lit |
| --- | --- | --- |
| `Edit\|Write\|MultiEdit\|NotebookEdit` | `A/garde-fichiers.mjs` | `tool_input.file_path` ou `notebook_path` : fichiers générés, lockfile, `.env`, migration livrée |
| `Bash` | `A/garde-commandes.mjs` | `tool_input.command` (`:61`) : `decisionCommande` (`A/regles.mjs:273-290`) |

Le gate `R/scripts/verify/settings-json-regles.mjs:16-21` exige exactement ces deux matchers (`HOOKS_EXIGES.PreToolUse`) et ne regarde aucun champ des hooks hormis `command` (`:47-50`). Aucun matcher ne vise un outil MCP ; aucune entrée ne porte `onFailure` ni `timeout`.

Côté `git push`, `A/regles.mjs` sur `ea7ea67` : `pushs()` (`:181-215`) lit les refspecs d'une commande, après `sansGuillemets` (`:162-165`), recolle seul les lignes continuées (`:183-184`), puis découpe sur `;`, `&`, `|`, saut de ligne, `(` et `)` (`:185-186`), ce qui coupe `git -C "$(pwd)" push …` avant `push` ; `pousseSurUnSujet` (`:233-235`) compare la destination à `/^(refs\/heads\/)?sujet\//` ; `develop` et `main` ne sont refusés que par le motif `:72`.

### Ce qui leur échappe

**Outils GitHub MCP qui écrivent une branche** (paramètres lus dans les schémas des outils chargés dans une session cloud, le 2026-11-14) :

| Outil | Paramètre de branche | Effet |
| --- | --- | --- |
| `mcp__github__push_files` | `branch` (requis), `files[]`, `message` | un commit de plusieurs fichiers sur `branch` |
| `mcp__github__create_or_update_file` | `branch` (requis), `path`, `content`, `sha` | un commit d'un fichier sur `branch` |
| `mcp__github__delete_file` | `branch` (requis), `path` | un commit qui supprime un fichier |
| `mcp__github__create_branch` | `branch` (la nouvelle), `from_branch` | crée une branche, par exemple un `sujet/…` hors de `sujet.sh ouvrir` |
| `mcp__github__merge_pull_request` | **aucun** : `pullNumber`, `merge_method`, `expectedHeadSha` | fusionne la PR dans sa base |
| `mcp__github__enable_pr_auto_merge` | aucun : `pullNumber` | fusion différée par GitHub |
| `mcp__github__update_pull_request_branch` | aucun : `pullNumber` | fusionne la base dans la **tête** de la PR : écrit sur la tête |
| `mcp__github__actions_run_trigger` | selon le workflow | lance un workflow, qui peut écrire (vu, laissé passer : § 6) |

**Par l'outil Bash, que `garde-commandes` voit mais ne lit pas** (joué sur `ea7ea67` : `decisionCommande` rend `null` pour chacune) : `gh api -X PATCH repos/o/r/git/refs/heads/sujet/x -f sha=…`, `gh api repos/o/r/git/refs -f ref=refs/heads/sujet/x …` (POST implicite), `gh api -X PUT repos/o/r/contents/<chemin> -f branch=sujet/x …`, `gh api repos/o/r/merges …`, `gh api repos/o/r/merge-upstream -f branch=develop`, `gh api -X PUT repos/o/r/pulls/<n>/merge`, `gh api -X PUT repos/o/r/branches/develop/protection …`, `gh api graphql` (ou la route `/graphql`) avec une mutation, `gh pr merge` (aussi `gh -R o/r pr merge`, `gh pr -R o/r merge`, `gh pr \⏎ merge`, `\gh pr merge`, `gh -R $(echo o/r) pr merge`), `gh pr close -d`, `gh repo sync`, `gh alias set` ; côté git, `git -C "$(pwd)" push origin HEAD:sujet/x`, `git push origin HEAD:refs/heads/develop`, `HEAD:refs/heads/main`, `HEAD:heads/develop`, `HEAD:DEVELOP`, et `git push` nu depuis `develop` ou `main`.

**Hors d'atteinte de tout hook** : un script lancé par la session (`bash x.sh`, `node -e "fetch(…)"`, `curl` avec un jeton), un autre client de l'API, ce qu'écrit un workflow lancé, un alias `gh` écrit à la main dans son fichier de configuration, les formes de mauvaise foi par substitution. `sujet.sh` et les scripts du capitaine en sont, et c'est voulu : ce sont les gestes autorisés. `sujet.sh fusionner` fusionne une sous-PR par `gh api -X PUT "$DEPOT/pulls/$n/merge"`, `passer.sh` une PR vers develop de même (`skills/chaine/fusionner/scripts/passer.sh:311`), et les deux poussent par `git push` sans force (`skills/chaine/fusionner/scripts/github.sh:86-94`). Le hook ne voit que `bash scripts/chaine/…`.

### Ce que dit la documentation des hooks de Claude Code

`https://code.claude.com/docs/en/hooks`, lue le 2026-11-14 :

- Le matcher : « Only letters, digits, `_`, `-`, spaces, `,`, and `|` » → « Exact string, or list of exact strings separated by `|` or `,` » ; « Contains any other character » → « JavaScript regular expression, unanchored », avec l'exemple « `mcp__memory__.*` matches every tool from the `memory` server ». Et : « wrap the pattern in `^` and `$`, as in `^Edit$`, when you need a whole-string match. »
- Les outils MCP : « MCP server tools appear as regular tools in tool events (`PreToolUse`, `PostToolUse`, …), so you can match them the same way you match any other tool name. » ; « MCP tools follow the naming pattern `mcp__<server>__<tool>` ».
- L'entrée : « PreToolUse hooks receive `tool_name`, `tool_input`, and `tool_use_id`. » ; « For an MCP tool, the input also carries `mcp_server`, an object with the server's `name` and a `source` […] » ; « Base trust decisions on `source` rather than on `name` or the `mcp__<server>__` tool-name prefix. » La page ne décrit pas `tool_input` d'un outil MCP champ par champ : que ce soient les arguments de l'appel, nommés comme dans le schéma (`branch`, `pullNumber`), est **à vérifier par la sonde** (§ 8).
- Le refus : « your hook exits 2. On events that can block, Claude Code stops the action. » ; « The message that comes with the block is your hook's stderr. »
- L'échec d'un hook : « On most events, when a hook fails or times out, Claude Code still carries out the action. A policy hook with a wrong path or a crashing script then lets everything through. To block the action instead, set `"onFailure": "block"` on a `command` or `http` hook. Requires Claude Code v2.1.295 or later. » La clé se pose dans l'objet du hook, à côté de `type`, `command` et `timeout` (table des champs : « `onFailure` | no | Whether the action that triggered the hook goes ahead when the hook fails: `"continue"` or `"block"`. ») ; comptent comme échec un script qui ne démarre pas, une sortie autre que 0 ou 2, le délai dépassé, une sortie JSON illisible. La clé est sans effet sur un hook en arrière-plan (« Background command hooks: command hooks that set `async` or `asyncRewake` »). Et : « On `PreToolUse`, a timed-out `command`, `http`, or `mcp_tool` hook doesn't block the tool call, except for hooks whose failure blocks the action. »
- Les sous-agents : « Hooks from settings files, managed policy settings, and plugins also run inside subagents. When a subagent calls a tool, tool events such as `PreToolUse` and `PostToolUse` fire the same configured hooks as in the main conversation […] »
- Le matcher `Bash` « matches the Bash tool, and on `PreToolUse` and `PermissionRequest` also Monitor commands » : `garde-commandes` garde aussi `Monitor`.

### Le remède, joué

Tout le code et les tests des § 1-5 ont été extraits de ce ticket, blocs de code tels quels, et appliqués avec les textes du § 6 sur une copie neuve de `origin/main` à `ea7ea67` (`git archive`, puis dépôt git local pour que `scripts/depot.test.mjs` lise les fichiers suivis) : `pnpm test` **448 sur 448** (435 + 13 : `regles.test.mjs` 22 + 5, `garde-github.test.mjs` 6, `settings-json.test.mjs` 19 + 2).

- **Vus rouges d'abord**, sur le code de `ea7ea67` : `regles.test.mjs` ne se charge pas (`decisionOutilGithub` n'est pas exporté) ; parmi ses refus nouveaux, 16 des 20 cas du test `git push` vers une branche gardée (7 des 11 graphies, et les 9 `git push` nus ou vers `HEAD` depuis `develop`, `main` ou la branche par défaut), 4 des 6 formes à barre oblique inverse (les trois `gh` et `HEAD:refs/heads/develop`) et 5 des 6 refus du test des substitutions y passent ; sans `garde-github.mjs`, ses six tests échouent ; sur le gate de `ea7ea67`, `settings-json.test.mjs` ne se charge pas (`MATCHER_GITHUB` n'est pas exporté).
- **Aucune commande refusée sur `origin/main` ne passe après, sauf des faux refus de `main`** (preuve du relecteur, qui fait foi) : 528 commandes (les chaînes des bancs de la branche et de `origin/main`, le code des `.md`, les lignes des scripts du plugin, ses tables), chacune déclinée en 28 variantes (barre oblique inverse devant `git`/`gh`, ligne continuée, guillemets, variable, substitution `$(…)` ou entre accents graves, collée devant la commande, imbriquée et échappée, préfixes `true &&`, `x=$(pwd);`, sous-shell, tube) et jouée avec six branches courantes (`feat/x`, `sujet/demo`, `develop`, `main`, `HEAD`, inconnue) : **71 904 essais, 0 régression réelle**. Passent désormais **84 commandes que `main` refusait à tort** : une commande entre accents graves dans un `echo`, suivie d'un `$` que `main` croyait un refspec illisible ; la commande seule et sa forme `$(…)` passent déjà sur `main` (voir « Vérification » : comment les reconnaître). Le script de monotonie du § « Vérification », plus court (les chaînes du dépôt seules), rend sur la même copie 368 commandes, 49 530 essais, 42 faux refus de `main`, 0 régression réelle. Le motif `:72` est **gardé** en plus de la lecture des refspecs (décision 4).
- **Les commandes des skills** : toutes celles qu'une session tape (code entre accents graves des `SKILL.md` et références) gardent leur décision. Changent seulement des commandes écrites *dans* des scripts (`gh api -X POST "$DEPOT/…"` de `github.sh`, `git push -q origin origin/main:refs/heads/develop` de `develop.sh`) : refusées si une session les tapait, invisibles au hook quand le script les lance.
- **Tables de la troisième relecture** (`v3`, jouées après correction) : `t6` (graphies de `develop`/`main`, substitutions collées ou imbriquées) : aucune commande refusée sur `main` ne passe ; passent les noms ordinaires et les formes écrites hors de lecture (configuration, here-doc, mot coupé par une substitution comme `gi$(echo)t push`, mauvaise foi). `fz` (40 entrées du hook de mise à jour et de fusion, faux `gh`) : 35 refus ; passent les mises à jour d'une PR dont la tête est `feat/x` (numéros `1`, `1.0`, `1e2`, avec `expectedHeadSha`) et la fusion `feat/x` → `feat/y` ; un `gh` qui dort 12 s est coupé à 10 s et refusé. `t5` (30 variantes du gate) : 25 rouges ; restent vertes le fragment tel quel, un second hook ajouté à côté de la garde, `"timeout": 1` et `0.001` (plus strict) et `"async": false`. `fauxrefus` (83 commandes des `.md`, 332 essais) : refus nouveaux seulement sur les exemples de `R/CONTENU.md` qui citent une commande refusée, et sur `git push origin origin/main:refs/heads/develop` cité par `socle-chaine-de-production/SKILL.md:41` comme ce que fait `develop.sh` (le script, lui, n'est pas lu par le hook).
- **Tables de la seconde relecture** : sur les 111 commandes `gh` (`t1`), toutes les lectures passent sauf une, faux refus assumé (`gh api graphql -f query="query Q { viewer { login } }" # mutation-test`, le mot `mutation` en commentaire : écrit au § 6) ; 9 écritures marquées attendues passent, toutes écrites au § 6 ou en « Hors périmètre » : mauvaise foi par substitution (`g() { gh "$@"; }; g pr merge 3`, `alias g=gh`, `GH=gh; $GH pr merge 3`), droits d'admin (`gh repo edit --default-branch`, `PATCH repos/o/r -f default_branch=x`), `gh workflow run`, et trois gestes qui n'écrivent aucune branche (`gh pr edit --base`, `gh pr ready`, `gh ruleset view`). Les entrées JSON du hook (`fuzz-cases`, 49 cas) : `null`, `[]`, `"x"`, outil hors des sept, `tool_input` absent ou nul, `branch` non textuel, graphies gardées, numéros et propriétaires illisibles, `gh` absent : tous refusés ; passent les noms ordinaires (`sujets/x`, `develop-x`, `main2`, `heads/x`, `origin/x`, `develop\nx`, `develop` suivi d'une espace de largeur nulle, `ｄevelop`), qui ne désignent pas une branche gardée chez GitHub. Les variantes du gate (`t5` de la seconde relecture, 14 cas) : toutes les formes affaiblies sont rouges ; restent vertes le fragment tel quel, un second hook ajouté à côté de la garde (la garde tourne toujours) et `"timeout": 1` (au plus 60 s ; avec `"onFailure": "block"`, une garde trop lente bloque : plus strict, pas plus faible).
- **Coût** (`perf`, `perf2` du relecteur) : `sansGuillemets` est calculé une fois par commande (dernier découpage gardé), au lieu d'environ sept. Mesures : un here-doc non fermé suivi de blancs, 30 000 caractères, **2,5 s** (6,1 s sur `main`) ; 60 000 caractères, 9,7 s ; 120 000 caractères, 38 s. Au-delà de ~150 000 caractères, `garde-commandes` dépasse son `timeout` de 60 s et **refuse** la commande (`onFailure: block`), sans contournement. Les here-docs fermés, même de 150 000 caractères, prennent moins de 5 ms.
- **Rien n'a été joué sur un outil MCP réel**, ni `onFailure` dans une vraie session : la sonde du § 8 le fait.

## Décisions

1. **Qui a le droit de quoi, et comment le hook le distingue.** Le hook ne connaît pas l'identité : toutes les sessions (travail, conducteur, capitaine) ont le même jeton. Il distingue par **le geste** :
   - une session de travail écrit sa branche (`git push`, ou un outil MCP vers une branche non gardée) et ouvre une PR : permis ;
   - le conducteur écrit la carte et le gel d'un sujet par `sujet.sh carte` / `geler` / `degeler` : un script, invisible au hook, permis ;
   - **le capitaine fusionne toujours par ses scripts, jamais par l'outil MCP** (fait établi par l'architecte auprès d'un capitaine en service, le 2026-11-14) : `passer.sh` fusionne par `gh api -X PUT …/pulls/<n>/merge`, lancé par le script, que le hook ne voit pas ; `gh api` (REST) aboutit dans son conteneur cloud alors que `gh auth status` y dit le jeton invalide ; labels et commentaires passent par `gh api` dans `github.sh` ;
   - **écrire un fichier n'est pas fusionner une PR** : `push_files`, `create_or_update_file`, `delete_file` vers une branche gardée, ou sans branche, ou avec une branche qui n'est pas un texte (l'API écrirait sur la branche par défaut), sont refusés à tous ; `create_branch` d'un `sujet/…` aussi ;
   - **toute fusion par outil dont la base est gardée (sujet, `develop`, `main`, branche par défaut) ou ne se lit pas est refusée**, décision de l'architecte : personne ne fusionne par l'outil, le capitaine passe par ses scripts, qui vérifient les contrôles exigés ; une PR entre deux branches de travail ordinaires se fusionne ;
   - **toute mise à jour par outil (`update_pull_request_branch`) d'une PR dont la tête est gardée ou ne se lit pas est refusée**, décision de l'architecte : l'outil écrit sur la tête ; une PR dont la tête est une branche de travail se met à jour (même si sa base est un sujet). La forme REST `gh api -X PUT …/pulls/<n>/update-branch` reste refusée d'office par `regles.mjs` (lecture pure, sans réseau), et sa raison dit de passer par l'outil, ou par `git merge` puis un push ordinaire. « Une session ne remet pas sa branche à jour avec la branche d'intégration, c'est le capitaine » reste une règle de conduite, écrite dans `R/CONTENU.md` : le hook ne garde que les branches gardées.
2. **Une seule définition de branche gardée.** `nomDeBranche` lit un nom comme GitHub le lira (barres doublées réduites, barre initiale retirée, préfixes `refs/`, `heads/`, `remotes/`, `origin/` retirés, minuscules ; un nom entouré de blancs est gardé d'office ; dans le doute, `origin/develop` se lit `develop`) ; `brancheGardee` dit sujet, `develop`, `main` ou branche par défaut. Elle sert la destination de chaque refspec de `git push` (`pousseSurUneBrancheGardee`, et `pousseSurUnSujet` pour la raison propre au sujet), la base d'une PR fusionnée par outil et la branche d'un outil d'écriture. `git push origin develop:feat/x` écrit `feat/x` et passe ; `feat/develop` et `feat/main-menu` passent.
3. **La branche par défaut** se lit sur `origin/HEAD` (posé par `demarrage.mjs`) ; s'il manque, une fois par appel du hook, sur le distant (`git ls-remote --symref origin HEAD`, accepté par l'architecte : coût, un aller-retour réseau de plus par `git push` vers une branche ordinaire et par appel de `garde-github`, tant qu'`origin/HEAD` manque ; délai de 10 s) ; si les deux échouent, restent gardées `develop`, `main` et `sujet/*`. La fonction vit dans `A/entree.mjs`, partagée par `garde-commandes` et `garde-github` ; `garde-commandes` ne la demande que pour une destination qui n'est ni un sujet, ni `develop`, ni `main`. **Limite** : `git remote set-head origin <x>` ou `git symbolic-ref refs/remotes/origin/HEAD …` détournent la lecture locale ; seule une branche par défaut d'un autre nom que `develop` ou `main` y est exposée (le socle met `develop` par défaut, `R/admin.md`).
4. **La règle par motif `:72` reste, en plus.** La lecture des refspecs (`pousseSurUneBrancheGardee`) couvre ce qu'elle manquait (`refs/heads/develop`, `heads/`, majuscules, branche par défaut, push nu depuis une branche gardée) ; le motif reste parce qu'il refuse aussi des formes que la lecture laisserait (`git push develop`, où `develop` serait le nom du dépôt distant) : le garder rend sûr que rien de refusé sur `origin/main` ne passe après, ce que le compte de 2 130 essais vérifie. Son coût, quelques faux refus déjà là, est inchangé.
5. **Ni une barre oblique inverse ni une substitution ne cachent rien, pour tous les lecteurs.** `sansGuillemets` recolle les lignes continuées (`\⏎`) et retire les barres obliques inverses avec les guillemets (`\git` s'y lit `git`) ; les tests de la PR 86 restent verts, et `git commit -m "a\⏎b"` passe toujours. Le découpage en segments passe par un **utilitaire commun**, `export function segmentsDeCommande(commande: string): { segment: string, suite: string }[]`, que `pushs()` et `ecritParGh` appellent, et que le ticket 28 réutilisera pour `appelsGit` au lieu de le dupliquer : il applique `sansGuillemets`, extrait chaque substitution (`$(…)` ou entre accents graves) des plus intérieures aux plus extérieures, la lit comme une source à part, la remplace dans la commande englobante par le mot `$SUBSTITUTION` (qui porte `$`, donc se lit illisible), puis découpe chaque source sur `;`, `&`, `|`, saut de ligne et sous-shell ; `suite` est le texte de la source à partir du segment (pour chercher `mutation` à partir de `gh`). `git -C "$(pwd)" push origin HEAD:sujet/x` se lit `git -C $SUBSTITUTION push origin HEAD:sujet/x` et est refusé ; `git push -u origin feat/x && echo "$(date)"` et `gh pr view $(cat n.txt)` passent ; `git push origin "$(git branch --show-current)"` est refusé : destination illisible, c'est voulu. Une substitution collée devant un mot (`$(true)git push --force origin feat/x`, bash l'exécute) est suivie d'une espace : `$SUBSTITUTION git …` ; des accents graves échappés (``echo `echo \`git push …\`` ``) sont une substitution imbriquée, lue comme `$(…)` avant que `sansGuillemets` retire les barres obliques inverses. Le dernier découpage est gardé : `decisionCommande` lit la même commande six fois, `sansGuillemets` n'y passe qu'une fois ; le tableau rendu est figé. Une substitution qui contient elle-même des parenthèses (`$( (a) )`, `$((1+2))`) n'est pas extraite : elle se découpe sur `(` et `)` comme avant. Un mot coupé par une substitution (`gi$(echo)t push`, `git$(echo) push`) n'est pas recollé : mauvaise foi, hors de lecture.
6. **Un seul hook nouveau, `garde-github.mjs`, et les règles dans `regles.mjs`** (fonctions pures, testées). Sept outils (`OUTILS_GITHUB_GARDES`). Matcher : `^mcp__.+__(push_files|create_or_update_file|delete_file|create_branch|merge_pull_request|enable_pr_auto_merge|update_pull_request_branch)$` — par le nom court de l'outil, quel que soit le nom du serveur, conformément à la documentation qui déconseille de se fier au préfixe. Ancré : `create_branch_protection` ou un outil futur ne s'y prennent pas. Le hook **échoue fermé** : entrée vide, `null`, JSON illisible, sans `tool_name`, ou outil hors des sept : sortie 2, « entrée de hook illisible : refusé ». La tête et la base d'une PR se lisent en un appel, `gh api repos/<o>/<r>/pulls/<n> --jq '.head.ref, .base.ref'` (`refsDeLaPr`) ; `owner` et `repo` validés d'abord sur leur type (chaîne) puis par `/^(?!\.)[\w.-]+$/`, le numéro sur son type (`Number.isSafeInteger`, positif : `"12"`, `1.5` ou `0` sont illisibles), la tête et la base rendues chacune par `/^(?![.-])[\w./-]+$/` sans `..` (exactement deux lignes), sinon illisibles donc refusées : un appel sans `owner` n'interroge plus `repos/undefined/undefined/…` ; appel sans shell (`execFileSync`).
7. **`gh` en écriture vers une branche, un fichier ou une règle de branche est refusé dans l'outil Bash, sans lire la branche visée** : une session pousse par `git push` (que le hook lit), jamais par l'API ; `pulls/<n>/update-branch` compris (décision 1). Choix tranchés par l'architecte : une requête GraphQL de lecture qui porte le mot `mutation` (même en commentaire) ou une variable `$` dans le segment de `gh` est refusée, limite écrite dans `R/CONTENU.md` ; un `git push` nu depuis `develop`, `main` ou la branche par défaut est refusé, c'est l'intangible. La sous-commande se lit sur les positionnels de `gh`, `-R`, `--repo`, `--hostname` et leur valeur sautés. La route d'un `gh api` se lit comme `gh` l'enverra (hôte, barres de tête, de fin, doublées et `./` retirés, minuscules) ; une route encodée (`%`) ou illisible (variable, substitution) en écriture est refusée. Une requête GraphQL (`graphql` ou la route `/graphql`) est refusée quand le mot `mutation` paraît dans la commande **à partir de `gh`** (ni avant : `git commit -m "fix: mutation testing" && gh api graphql …` passe ; ni bornée au segment : la découpe sur `(` couperait `query A { a(x: 1) } mutation B { … }`), ou quand la requête ne se lit pas (`query=@`, `--input`, variable). `gh pr close -d`, `gh repo sync`, `gh alias set` et `gh alias import` sont refusés (**décision g** de l'architecte : un alias défini par la session cacherait le reste ; `gh alias list` et `delete` passent). La lecture (`GET`), la création et le reciblage d'une PR, les labels et commentaires passent : les gestes documentés (`tickets/references/agents/issue-tracker.md`) restent permis.
8. **Les trois gardes échouent fermées** (**décision h** de l'architecte) : `"onFailure": "block"` et un `"timeout"` explicite sur chacune (le défaut est 600 s : une garde bloquée tiendrait la session dix minutes). Chaque appel `git` ou `gh` des gardes est plafonné à 10 s ; le `timeout` est la somme des pires délais d'une invocation, arrondie : `garde-fichiers` **30** (deux `git cat-file` locaux) ; `garde-commandes` **60**, le plus que le gate admet (branche courante, lecture des dépendances avec son `ls-remote` réseau, branche par défaut avec son `ls-remote --symref` réseau : deux appels réseau au plafond, 20 s, plus les appels locaux et le démarrage de `node`) ; `garde-github` **40** (l'appel `gh api`, puis `origin/HEAD` et au besoin `ls-remote --symref` : 30 s au pire). Quand les délais s'additionnent au-delà (le distant lent), le hook est coupé et **échoue fermé** : l'outil est refusé, rien ne passe. Conséquence voulue : une garde cassée bloque son outil (Bash entier pour `garde-commandes`) jusqu'à réparation ; la procédure de reprise est écrite dans `R/CONTENU.md` (§ 6). Claude Code doit être en 2.1.295 au moins, écrit dans `R/admin.md` ; le comportement d'une version plus ancienne devant la clé n'est pas établi.
9. **Le gate `settings-json` exige** les trois matcheurs, que chacun lance son script (`GARDES`) **par la commande exacte du fragment** (`node "$CLAUDE_PROJECT_DIR"/scripts/agent/<garde>.mjs`, dans un hook de type `command` : `… || true`, `true # …`, `echo scripts/agent/…` ou un hook `prompt` ne la lancent pas), refuse `"disableAllHooks": true` à la racine, que chaque garde porte `"onFailure": "block"`, un `"timeout"` numérique d'au plus 60 s (avec `block`, le défaut de 600 s tiendrait une session dix minutes sur une garde bloquée ; plus court est plus strict, donc accepté) et ne soit pas en arrière-plan (`async`, `asyncRewake`). Chez un projet, la mise à jour des gardes et du gate et celle de `.claude/settings.json` vont dans la **même PR** : sinon le gate est rouge entre les deux. L'édition de `.claude/settings.json` peut être refusée à une session par le contrôle des permissions de son environnement : la session l'écrit alors à qui l'a lancée, avec le fragment, et s'arrête ; c'est un humain qui colle le fragment.
10. Ni `--no-verify`, ni test retiré, sauté ou assoupli ; aucune dépendance nouvelle. Le fixture `reglesValides()` de `settings-json.test.mjs` gagne l'entrée du nouveau matcher, `timeout` et `onFailure` sur les trois gardes : aucun `assert` ne change.
11. **Version : mineure** (un gabarit de hook ajouté, un matcheur et des champs exigés par le gate). Règle du `README.md`, « Ajouter un skill », étape 4 : « Patch pour une correction, mineure pour un skill ou un gabarit ajouté, majeure quand un skill existant change de contrat. » La session prend la version de `origin/main` à l'ouverture de la PR et monte le deuxième chiffre.
12. **La revue de la PR passe `/security-review`**, en plus de la revue de ticket : ce sont des hooks de sécurité. Les contournements qu'elle trouve se corrigent dans `regles.mjs` avec leur test, ou s'écrivent dans les limites de `R/CONTENU.md`.

### Recommandation au produit (pas une tâche de ce ticket)

Un hook est une garde pour des sessions de bonne foi, pas une frontière. Ce qui en ferait une, ce sont des règles de dépôt côté GitHub (rulesets), à décider par le produit :

- **« Block force pushes » sur toutes les branches** : compatible avec la chaîne telle qu'elle est (aucun script ne force) ; rend l'intangible « jamais de push forcé » vrai côté serveur, configuration et alias compris.
- **« Restrict deletions » sur `develop` et `main` seulement** : la suppression automatique des branches fusionnées (réglage « Automatically delete head branches ») doit rester possible pour les branches de travail et pour `sujet/*` à la livraison. L'effet de « Restrict deletions » posé sur `sujet/*` sur cette suppression automatique n'a pas été vérifié côté GitHub.
- **Sans liste de contournement sur les règles de `develop` et `main`** (`R/admin.md` le demande déjà : « Do not allow bypassing the above settings ») : sinon un jeton d'administrateur fusionne malgré un contrôle exigé rouge.
- **« Require a pull request » sur `sujet/*`** fermerait l'écriture directe d'un sujet, mais **casserait** les gestes qui y poussent directement, avec le même jeton que les sessions (fonctions de `skills/chaine/sujet/scripts/sujet.sh`) : `carte`, `geler` et `degeler` (`ecrire_gel`), `rafraichir`, et `ouvrir` si les créations sont restreintes. La mise à jour d'une sous-PR par le capitaine (`mettre_a_jour_sous_pr`) pousse la tête de la PR, pas le sujet. Il faudrait une identité à part (application GitHub dans la liste de contournement) pour ces scripts : décision d'architecture, pas un réglage.

Le proxy des sessions cloud refuse déjà `POST git/refs` (commentaire de `sujet.sh`, fonction `ouvrir`) : une barrière partielle, propre à cet environnement, non vérifiée pour `PATCH`, `contents` ni les outils MCP.

### Remèdes écartés

- **Matcher `mcp__github__.*`** : lance un processus `node` à chaque lecture GitHub (les plus nombreuses), et manque un serveur nommé autrement.
- **Laisser passer la fusion par outil vers `develop` ou `main`** (première version de ce ticket) : contraire à la décision de l'architecte ; personne n'a à fusionner par l'outil.
- **Remplacer le motif `:72` par la lecture des refspecs** : plus propre, mais le motif refuse des formes que la lecture laisserait ; le garder ne coûte rien (décision 4).
- **Lire la base par `git ls-remote refs/pull/<n>/merge`** : la référence de fusion n'existe pas pour une PR en conflit, et son premier parent peut retarder sur la base ; fragile.
- **Laisser passer `update_pull_request_branch`** (première décision, revenue) : l'outil écrit sur la tête ; une tête gardée serait écrite hors de `sujet.sh rafraichir`.
- **Lire la tête de la PR dans `regles.mjs` pour la forme REST `update-branch`** : `regles.mjs` reste une lecture pure, sans réseau ; la forme REST est refusée d'office, l'outil est permis quand sa tête est ordinaire.
- **Un découpage par lecteur** (le ticket 28 en écrivait un pour `appelsGit`) : deux lectures d'une même commande divergent ; `segmentsDeCommande` est commun.
- **Retirer `#…` (commentaire) avant de chercher `mutation`** : supprimerait le faux refus de `… # mutation-test`, mais `#` vit aussi dans les chaînes d'une requête GraphQL, guillemets déjà retirés : une mutation écrite après un `"#"` passerait.
- **`onFailure: "block"` sur `garde-github` seul** : `garde-commandes` porte les refus du push forcé et du push vers un sujet ; qu'il plante, et tout passe.
- **Un hook par outil** : sept entrées de plus dans `settings.json` à tenir, pour la même règle.

## À faire, dans l'ordre

### 0. Les tests d'abord, vus rouges

Sur `origin/main` : écrire les tests des § 1, 3 et 5, les jouer, les voir rouges (motifs ci-dessus, « Le remède, joué ») ; **puis** seulement écrire le code.

### 1. `A/regles.test.mjs`

L'import (`:3`) devient :

```js
import { ajouteUneDependance, decisionCommande, decisionOutilGithub, lireDependances, paquetsAjoutes, pousseSurUnSujet, refusEdition, sansTexte, segmentsDeCommande, lintable } from './regles.mjs';
```

Insérer juste avant `test('lireDependances : la ligne d’en-tête, accents graves ou nus, — ou absente → []'` (`:221`) :

```js
test('un git push vers develop, main ou la branche par défaut est refusé sous toutes ses graphies ; une source develop ou un nom voisin passent', () => {
  const ctx = (courante = 'feat/spec-all-demo-1-01-x') => ({ brancheCourante: () => courante, brancheParDefaut: () => 'trunk' });
  for (const commande of [
    'git push origin develop',
    'git push origin HEAD:main',
    'git push origin HEAD:refs/heads/develop',
    'git push origin HEAD:refs/heads/main',
    'git push origin origin/main:refs/heads/develop',
    'git push origin +refs/heads/x:refs/heads/main',
    'git push origin HEAD:heads/develop',
    'git push origin HEAD:DEVELOP',
    'git push origin "HEAD:refs/heads//main"',
    'git push origin HEAD:trunk',
    'git push origin :develop',
  ])
    assert.equal(decisionCommande(commande, ctx())?.decision, 'refuser', commande);
  for (const courante of ['develop', 'main', 'trunk'])
    for (const commande of ['git push', 'git push origin', 'git push origin HEAD'])
      assert.equal(decisionCommande(commande, ctx(courante))?.decision, 'refuser', `${courante} : ${commande}`);
  for (const commande of ['git push origin develop:feat/x', 'git push origin feat/develop', 'git push origin feat/main-menu', 'git push -u origin feat/spec-all-demo-1-01-x', 'git push origin HEAD'])
    assert.equal(decisionCommande(commande, ctx()), null, commande);
  assert.equal(decisionCommande('git push', ctx(null)), null, 'branche courante inconnue');
});

test('une barre oblique inverse ne cache ni git ni gh : lignes continuées recollées, \\git lu comme git', () => {
  for (const commande of [
    '\\git push --force origin feat/x',
    'git push origin \\\nHEAD:sujet/x',
    'git push origin \\\nHEAD:refs/heads/develop',
    'gh api -X PUT \\\nrepos/o/r/pulls/3/merge',
    'gh pr \\\nmerge 3',
    '\\gh pr merge 3',
  ])
    assert.equal(decisionCommande(commande, { brancheCourante: () => 'feat/x' })?.decision, 'refuser', commande);
  assert.equal(decisionCommande('git commit -m "a\\\nb"', { brancheCourante: () => 'feat/x' }), null);
});

test('une substitution de commande ne cache ni git ni gh : lue à part, remplacée dans la commande englobante par un mot illisible', () => {
  const ctx = { brancheCourante: () => 'feat/x' };
  for (const commande of [
    'git -C "$(pwd)" push origin HEAD:sujet/x',
    'git -C $(pwd) push --force origin feat/x',
    'git -C `pwd` push origin HEAD:sujet/x',
    'gh -R $(echo o/r) pr merge 3',
    'x=$(gh pr merge 3)',
    'git push origin "$(git branch --show-current)"',
    '$(true)git push --force origin feat/x',
    '`true`git push origin HEAD:sujet/x',
    'echo `echo \\`git push --force origin feat/x\\``',
    '$(true)gh pr merge 3',
  ])
    assert.equal(decisionCommande(commande, ctx)?.decision, 'refuser', commande);
  for (const commande of ['git push -u origin feat/x && echo "$(date)"', 'gh pr view $(cat n.txt)'])
    assert.equal(decisionCommande(commande, ctx), null, commande);
  assert.deepEqual(
    segmentsDeCommande('git -C "$(pwd)" push origin HEAD:x; echo `date`').map(({ segment }) => segment.trim()),
    ['pwd', 'date', 'git -C $SUBSTITUTION push origin HEAD:x', 'echo $SUBSTITUTION'],
  );
});

test('decisionOutilGithub : écrire ou fusionner vers une branche gardée, ou mettre à jour une PR dont la tête est gardée, est refusé, sous toutes ses graphies', () => {
  const ctx = { brancheParDefaut: 'trunk' };
  for (const branch of ['sujet/demo', 'refs/heads/sujet/demo', 'develop', 'main', 'trunk', '', undefined, 5, ['develop'], { a: 1 }, ' sujet/x', 'develop ', 'heads/sujet/x', 'refs/heads//sujet/x', 'Sujet/x', 'origin/develop', 'TRUNK', '/main'])
    for (const outil of ['mcp__github__push_files', 'mcp__github__create_or_update_file', 'mcp__github__delete_file', 'mcp__autre__push_files'])
      assert.equal(decisionOutilGithub(outil, { branch }, ctx)?.decision, 'refuser', `${outil} ${JSON.stringify(branch)}`);
  assert.equal(decisionOutilGithub('mcp__github__create_branch', { branch: 'sujet/neuf' }, ctx)?.decision, 'refuser');
  assert.equal(decisionOutilGithub('mcp__github__push_files', { branch: 'feat/x' }, ctx), null);
  assert.equal(decisionOutilGithub('mcp__github__create_branch', { branch: 'feat/x', from_branch: 'sujet/demo' }, ctx), null);
  assert.equal(decisionOutilGithub('mcp__github__get_file_contents', { ref: 'sujet/demo' }, ctx), null);
  const pr = (tete, base) => ({ ...ctx, refsDeLaPr: () => (tete === null ? null : { tete, base }) });
  for (const b of ['sujet/demo', 'refs/heads/Sujet/demo', 'develop', 'main', 'trunk'])
    for (const outil of ['mcp__github__merge_pull_request', 'mcp__github__enable_pr_auto_merge'])
      assert.equal(decisionOutilGithub(outil, { pullNumber: 1 }, pr('feat/x', b))?.decision, 'refuser', `${outil} ${b}`);
  assert.equal(decisionOutilGithub('mcp__github__merge_pull_request', { pullNumber: 1 }, pr(null))?.decision, 'refuser', 'refs illisibles');
  assert.equal(decisionOutilGithub('mcp__github__merge_pull_request', { pullNumber: 1 }, pr('feat/x', 'feat/y')), null);
  for (const tete of ['sujet/demo', 'develop', 'main', 'trunk', 'Main'])
    assert.equal(decisionOutilGithub('mcp__github__update_pull_request_branch', { pullNumber: 1 }, pr(tete, 'develop'))?.decision, 'refuser', `mise à jour, tête ${tete}`);
  assert.equal(decisionOutilGithub('mcp__github__update_pull_request_branch', { pullNumber: 1 }, pr(null))?.decision, 'refuser', 'tête illisible');
  assert.equal(decisionOutilGithub('mcp__github__update_pull_request_branch', { pullNumber: 1 }, pr('feat/x', 'sujet/demo')), null, 'tête ordinaire, base gardée : la mise à jour écrit sur la tête');
});

test('gh en écriture vers une branche, un fichier ou une règle de branche est refusé ; la lecture, les PR et les labels passent', () => {
  for (const commande of [
    'gh api -X PATCH repos/o/r/git/refs/heads/sujet/x -f sha=abc',
    'gh api repos/o/r/git/refs -f ref=refs/heads/sujet/x -f sha=abc',
    'gh api --method DELETE repos/o/r/git/refs/heads/feat/x',
    'gh api -XPUT repos/o/r/pulls/3/merge',
    'gh api -X PUT "repos/o/r/contents/docs/a.md" -f branch=sujet/x',
    'gh api repos/o/r/merges -f base=sujet/x -f head=feat/y',
    'gh api graphql -f query="mutation { createCommitOnBranch(input: {}) { commit { oid } } }"',
    'gh api graphql -F query=@requete.graphql',
    'gh pr merge 12 --squash',
    'timeout 5 gh pr merge 12',
    '/usr/bin/gh api -X PATCH repos/o/r/git/refs/heads/develop -f sha=abc',
    'gh api -X PATCH "$REF_URL" -f sha=abc',
    'gh api --method=PUT repos/o/r/pulls/$(cat n)/merge',
    'gh -R o/r pr merge 3',
    'gh --repo o/r pr merge 3',
    'gh pr -R o/r merge 3',
    'env GH_X=1 gh pr merge 3',
    'gh api graphql -f query="$Q"',
    'gh api graphql --input q.json',
    'gh api graphql -f query="query A { a(x: 1) } mutation B { b }"',
    'gh api /graphql -f query="mutation { x }"',
    'gh api https://api.github.com/graphql -f query="mutation { x }"',
    'gh api -X PATCH repos/o/r/git//refs/heads/x -f sha=a',
    'gh api -X PATCH repos/o/r/git/./refs/heads/x -f sha=a',
    'gh api -X PATCH repos/o/r/GIT/REFS/heads/x -f sha=a',
    'gh api -X PUT repos/o/r/pulls/3%2Fmerge',
    'gh api -X PUT repos/o/r/pulls/3/ccr/auto_merge',
    'gh api -X PUT repos/o/r/pulls/3/update-branch',
    'gh --hostname github.com pr merge 3',
    'gh api -X PUT repos/o/r/pulls/3/merge/',
    'gh api -X PUT repos/o/r//pulls/3/merge',
    'gh api repos/o/r/merge-upstream -f branch=develop',
    'gh api -X PUT repos/o/r/branches/develop/protection --input p.json',
    'gh api -X DELETE repos/o/r/branches/develop/protection',
    'gh api -X POST repos/o/r/rulesets --input r.json',
    'gh repo sync o/r -b develop --force',
    'gh pr close 3 -d',
    'gh pr close 3 --delete-branch',
    'gh alias set m "pr merge"',
    'gh alias set --shell m "gh pr merge $1"',
    'gh alias import aliases.yml',
    'gh alias import - < aliases.yml',
  ])
    assert.equal(decisionCommande(commande)?.decision, 'refuser', commande);
  for (const commande of [
    'gh api repos/o/r/git/refs/heads/sujet/x',
    'gh api repos/o/r/pulls/3',
    'gh api -X POST repos/o/r/pulls -f title=x -f head=feat/x -f base=sujet/x',
    'gh api -X PATCH repos/o/r/pulls/3 -f base=sujet/x',
    'gh api -X POST repos/o/r/issues/3/labels -f "labels[]=à-fusionner"',
    'gh api graphql -f query="{ viewer { login } }"',
    "gh api graphql -f query='query { repository(owner:\"o\", name:\"r\") { pullRequest(number: 1) { mergeable } } }'",
    'git commit -m "fix: mutation testing" && gh api graphql -f query="{ viewer { login } }"',
    'gh api repos/o/r/rules/branches/develop',
    'gh api repos/o/r/branches/develop/protection',
    'gh api -X GET repos/o/r/contents/docs/a.md -f ref=sujet/x',
    'gh pr create --base sujet/x --title t --body b',
    'gh pr edit 3 --add-label à-fusionner',
    'gh pr close 3',
    'gh alias list',
    'gh alias delete m',
    'gh pr view 3',
    'git commit -m "gh pr merge 3"',
    'bash scripts/chaine/passer.sh 12',
  ])
    assert.equal(decisionCommande(commande), null, commande);
});

```

### 2. `A/regles.mjs`

**a.** `sansGuillemets` (`:162-165`, avec sa ligne de commentaire) devient :

```js
/**
 * La commande sans ses corps de heredoc, ses guillemets ni ses barres obliques inverses, lignes continuées
 * recollées : un refspec cité se lit comme un refspec nu, `\git` comme `git`, `gh pr \⏎ merge` comme
 * `gh pr merge`. Tous les lecteurs de commandes (`pushs`, `ecritParGh`) partent de ce texte.
 */
function sansGuillemets(commande) {
  return commande
    .replace(/<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2(?=\s|$)/g, '<<heredoc')
    .replace(/\\\r?\n/g, ' ')
    .replace(/["'\\]/g, '');
}
```

**a'.** Juste après `sansGuillemets`, ajouter l'utilitaire commun (le bloc commence par une ligne vide) :

```js

/** Mot qui remplace une substitution dans la commande englobante : il porte `$`, donc se lit illisible. */
const SUBSTITUTION = '$SUBSTITUTION';
/**
 * Le dernier découpage : `decisionCommande` lit la même commande six fois (sujet, branche gardée, push
 * nu, force, illisible, `gh`) ; `sansGuillemets`, dont le motif de here-doc coûte, n'y passe qu'une fois.
 */
let dernierDecoupage = { commande: null, segments: [] };

/**
 * Les segments d'une commande shell, utilitaire commun des lecteurs de commandes (`pushs`, `ecritParGh`,
 * et `appelsGit` du ticket 28) : `{ segment, suite }`, où `suite` est le texte de la source du segment à
 * partir de lui. La commande passe d'abord par `sansGuillemets` (`\git` s'y lit `git`). Chaque
 * substitution, `$(…)` ou entre accents graves, est extraite des plus intérieures aux plus extérieures et
 * lue comme une source à part, puis remplacée dans la commande englobante par `SUBSTITUTION` :
 * `git -C "$(pwd)" push origin HEAD:sujet/x` se lit `git -C $SUBSTITUTION push origin HEAD:sujet/x`.
 * Chaque source se découpe sur `;`, `&`, `|`, saut de ligne et sous-shell `( … )`.
 * @param {string} commande la commande telle que l'outil Bash la reçoit
 * @returns {readonly { segment: string, suite: string }[]} figé : le dernier découpage est gardé pour la commande suivante identique
 */
export function segmentsDeCommande(commande) {
  if (dernierDecoupage.commande === commande) return dernierDecoupage.segments;
  const decouper = (source) =>
    [...source.matchAll(/[^;&|\n()]+/g)].filter(([segment]) => segment.trim()).map(({ 0: segment, index }) => ({ segment, suite: source.slice(index) }));
  // Des accents graves échappés (`echo \`git push …\``) sont une substitution imbriquée : lus comme `$(…)` avant
  // que `sansGuillemets` retire les barres obliques inverses.
  let reste = sansGuillemets(commande.replace(/\\`([^`]*?)\\`/g, '$($1)')).replace(/`([^`]*)`/g, '$($1)');
  const segments = [];
  for (let m = /\$\(([^()]*)\)/.exec(reste); m; m = /\$\(([^()]*)\)/.exec(reste)) {
    segments.push(...decouper(m[1]));
    const apres = reste.slice(m.index + m[0].length);
    // Suivi d'une espace si un mot y est collé : `$(true)git push …` exécute `git push …`.
    reste = reste.slice(0, m.index) + SUBSTITUTION + (/^[^\s;&|()]/.test(apres) ? ' ' : '') + apres;
  }
  dernierDecoupage = { commande, segments: Object.freeze([...segments, ...decouper(reste)].map((s) => Object.freeze(s))) };
  return dernierDecoupage.segments;
}
```

**b.** Le début de `pushs()` (`:181-187`, de `function pushs(commande) {` à `.flatMap((segment) => {`, recollage de la PR 86 compris) devient :

```js
function pushs(commande) {
  return segmentsDeCommande(commande)
    .flatMap(({ segment }) => {
```

**c.** `pousseSurUnSujet` (`:233-235`) devient, suivi de la fonction nouvelle :

```js
export function pousseSurUnSujet(commande, brancheCourante = () => null) {
  return pushs(commande).some(({ refspecs }) => refspecs.some((refspec) => (nomDeBranche(destination(refspec, brancheCourante)) ?? '').startsWith('sujet/')));
}

/**
 * Vrai si un `git push` de la commande écrit une branche gardée (`brancheGardee` : sujet, `develop`,
 * `main`, branche par défaut), sous toutes ses graphies (`HEAD:refs/heads/develop`, `HEAD:heads/develop`,
 * `HEAD:DEVELOP`), ou pousse sans refspec, ou vers `HEAD`, depuis une telle branche. Une destination
 * vide (branche courante inconnue) n'est pas lue ici. `develop:feat/x` écrit `feat/x` : il passe.
 */
export function pousseSurUneBrancheGardee(commande, brancheCourante = () => null, brancheParDefaut = () => null) {
  let parDefaut;
  const defaut = () => (parDefaut === undefined ? (parDefaut = brancheParDefaut()) : parDefaut);
  // `develop`, `main` et les sujets se lisent sans la branche par défaut : elle n'est demandée que pour un autre nom.
  const gardee = (b) => Boolean(b) && b !== 'HEAD' && (brancheGardee(b) || brancheGardee(b, defaut()));
  return pushs(commande).some(({ refspecs }) =>
    refspecs.length === 0 ? gardee(brancheCourante()) : refspecs.some((refspec) => gardee(destination(refspec, brancheCourante))),
  );
}
```

**d.** Juste avant `const RAISON_PUSH_FORCE =` (`:157`), ajouter :

```js
const RAISON_PUSH_GARDEE =
  "pousser sur develop, main ou la branche par défaut, sous quelque graphie que ce soit (refs/heads/develop, heads/main, majuscules) : jamais directement, une PR passe par le capitaine de fusion.";
```

**e.** La signature de `decisionCommande` (`:273`) devient :

```js
export function decisionCommande(commande, { dependancesPrevues = () => null, brancheCourante = () => null, brancheParDefaut = () => null } = {}) {
```

et la ligne `if (pousseEnForce(commande)) …` (`:280`) devient les trois lignes :

```js
  if (pousseSurUneBrancheGardee(commande, courante, brancheParDefaut)) return { decision: 'refuser', raison: RAISON_PUSH_GARDEE };
  if (pousseEnForce(commande)) return { decision: 'refuser', raison: RAISON_PUSH_FORCE };
  if (ecritParGh(commande)) return { decision: 'refuser', raison: RAISON_GH_ECRIT };
```

Le motif de `COMMANDES_INTERDITES` sur `develop|main` (`:72`) reste (décision 4).

**f.** À la fin du fichier, après `lintable` (`:292-293`), ajouter (le bloc commence par une ligne vide) :

```js

/**
 * Nom d'une branche tel que GitHub le lira, ou `null` s'il porte des blancs autour (`" develop"`) :
 * barres doublées réduites, préfixes `refs/`, `heads/`, `remotes/` et `origin/` retirés (dans le doute,
 * `origin/develop` se lit `develop`), en minuscules.
 */
export function nomDeBranche(branche) {
  const brute = String(branche ?? '');
  if (brute.trim() !== brute) return null;
  return brute
    .replace(/\/{2,}/g, '/')
    .replace(/^\/+/, '')
    .replace(/^((refs|heads|remotes|origin)\/)+/i, '')
    .toLowerCase();
}

/**
 * Branche gardée : un sujet (`sujet/…`), `develop`, `main`, la branche par défaut du dépôt, ou un nom
 * vide ou entouré de blancs. Une session n'y écrit jamais elle-même : le capitaine par ses scripts, le
 * conducteur par `sujet.sh`. Une seule définition pour `git push`, `gh` et les outils GitHub.
 */
export function brancheGardee(branche, brancheParDefaut = null) {
  const b = nomDeBranche(branche);
  if (!b) return true;
  const parDefaut = nomDeBranche(brancheParDefaut);
  return b.startsWith('sujet/') || b === 'develop' || b === 'main' || (Boolean(parDefaut) && b === parDefaut);
}

const RAISON_OUTIL_ECRIT =
  "écrire par un outil GitHub (push_files, create_or_update_file, delete_file, create_branch) sur un sujet, develop, main ou la branche par défaut : jamais. Un sujet ne s'écrit que par sujet.sh, sans quoi une session écrirait elle-même la ligne `Dépendances:` qui l'autorise ; develop et main ne reçoivent que des PR fusionnées par le capitaine. Écrire sur sa branche de travail, puis ouvrir une PR ; pour la carte : `bash scripts/chaine/sujet.sh carte <nom>`.";
const RAISON_OUTIL_FUSION =
  "fusionner par un outil GitHub une PR dont la base est un sujet, develop, main ou la branche par défaut, ou dont la base ne se lit pas : jamais. Le capitaine fusionne par ses scripts (passer.sh, sujet.sh fusionner), qui vérifient les contrôles exigés.";
const RAISON_OUTIL_MISE_A_JOUR =
  "mettre à jour par un outil GitHub une PR dont la tête est un sujet, develop, main ou la branche par défaut, ou dont la tête ne se lit pas : jamais, l'outil écrirait sur cette branche. Un sujet se rafraîchit par sujet.sh rafraichir (le capitaine) ; une branche de travail se met à jour par l'outil, ou par git merge puis un push ordinaire.";
const RAISON_GH_ECRIT =
  "écrire par `gh` une branche, un fichier ou une règle de branche (gh api en écriture vers git/refs, contents, merges, merge-upstream, pulls/<n>/merge ou update-branch, branches/<b>/protection, rulesets, une mutation GraphQL ou une requête illisible, gh pr merge, gh pr close --delete-branch, gh repo sync, gh alias set ou import) : jamais à la main. On pousse sa branche par git push, une PR se fusionne par le capitaine (passer.sh, sujet.sh fusionner), un sujet ne s'écrit que par sujet.sh ; une PR se met à jour par l'outil update_pull_request_branch, ou par git merge puis un push ordinaire.";

/** Outils GitHub d'écriture, par nom court (après le dernier `__`) : leur paramètre `branch` porte la branche visée. */
export const OUTILS_GITHUB_ECRITURE = ['push_files', 'create_or_update_file', 'delete_file', 'create_branch'];
/** Outils GitHub de fusion, par nom court : ils ne portent que `pullNumber`, la base se lit à part. */
export const OUTILS_GITHUB_FUSION = ['merge_pull_request', 'enable_pr_auto_merge'];
/** Outil GitHub de mise à jour d'une PR, par nom court : il écrit sur la tête de la PR, qui se lit à part. */
export const OUTILS_GITHUB_MISE_A_JOUR = ['update_pull_request_branch'];
/** Les sept outils que garde `garde-github`, et rien d'autre. */
export const OUTILS_GITHUB_GARDES = [...OUTILS_GITHUB_ECRITURE, ...OUTILS_GITHUB_FUSION, ...OUTILS_GITHUB_MISE_A_JOUR];

/**
 * Décision sur un appel d'outil MCP (hook `garde-github`) : `{ decision: 'refuser', raison }` ou `null`.
 * Le serveur se reconnaît au nom court de l'outil, quel que soit son préfixe (`mcp__github__`, ou un
 * serveur nommé autrement par le projet). Une branche absente, vide ou qui n'est pas un texte se lit
 * comme gardée : l'API écrirait sur la branche par défaut.
 * @param {string} outil nom complet de l'outil (`mcp__github__push_files`)
 * @param {Record<string, unknown>} entree `tool_input`
 * @param {{ brancheParDefaut?: string | null, refsDeLaPr?: (entree: Record<string, unknown>) => { tete: string, base: string } | null }} [contexte]
 *   `refsDeLaPr` : la tête et la base de la PR visée (`null` si elles ne se lisent pas), appelée pour une
 *   fusion ou une mise à jour seulement ; une fusion regarde la base, une mise à jour la tête.
 */
export function decisionOutilGithub(outil, entree = {}, { brancheParDefaut = null, refsDeLaPr = () => null } = {}) {
  const court = String(outil).split('__').pop();
  if (OUTILS_GITHUB_ECRITURE.includes(court)) {
    const branche = entree?.branch;
    return typeof branche !== 'string' || brancheGardee(branche, brancheParDefaut) ? { decision: 'refuser', raison: RAISON_OUTIL_ECRIT } : null;
  }
  if (OUTILS_GITHUB_FUSION.includes(court)) {
    return brancheGardee(refsDeLaPr(entree)?.base, brancheParDefaut) ? { decision: 'refuser', raison: RAISON_OUTIL_FUSION } : null;
  }
  if (OUTILS_GITHUB_MISE_A_JOUR.includes(court)) {
    return brancheGardee(refsDeLaPr(entree)?.tete, brancheParDefaut) ? { decision: 'refuser', raison: RAISON_OUTIL_MISE_A_JOUR } : null;
  }
  return null;
}

/** Options de `gh api` suivies d'une valeur séparée. */
const OPTIONS_GH_API_A_VALEUR = new Set(['-X', '--method', '-f', '--raw-field', '-F', '--field', '-H', '--header', '--input', '-q', '--jq', '-t', '--template', '--hostname', '--cache', '-p', '--preview']);
/** Routes REST qui écrivent une branche, un fichier ou une règle de branche, en écriture. */
const CHEMIN_GH_ECRIT = /(^|\/)(git\/refs(\/|$)|contents(\/|$)|merges$|merge-upstream$|pulls\/[^/]+\/(merge|update-branch|ccr\/auto_merge)$|branches\/[^/]+\/protection(\/|$)|rulesets(\/|$))/;

/**
 * Vrai si la commande écrit une branche, un fichier ou une règle de branche par `gh` : `gh pr merge`,
 * `gh pr close -d`, `gh repo sync`, `gh alias set` et `gh alias import` (avec ou sans `-R`/`--repo`,
 * avant ou après la sous-commande) ; `gh api` vers une route de `CHEMIN_GH_ECRIT`, ou vers un chemin
 * illisible (variable, substitution, encodé), avec une méthode autre que GET (explicite, ou implicite : un
 * champ `-f`/`-F` ou `--input` fait un POST) ; `gh api graphql` (ou la route `/graphql`) dont la requête,
 * cherchée dans la commande à partir de `gh`, est une mutation ou ne se lit pas (`query=@fichier`,
 * `--input`, variable).
 */
export function ecritParGh(commande) {
  return segmentsDeCommande(commande).some(({ segment, suite }) => {
    const mots = segment.trim().split(/\s+/);
    // Seul le premier programme du segment compte : `git commit -m "gh pr merge 3"` n'est pas une fusion.
    const i = mots.findIndex((mot) => /(^|\/)(gh|git)$/.test(mot));
    if (i < 0 || !/(^|\/)gh$/.test(mots[i])) return false;
    // Positionnels après `gh`, sans `-R`, `--repo`, `--hostname` ni leur valeur : `gh -R o/r pr merge 3` est `pr merge`.
    const pos = [];
    for (let k = i + 1; k < mots.length; k++) {
      if (mots[k] === '-R' || mots[k] === '--repo' || mots[k] === '--hostname') k++;
      else if (!mots[k].startsWith('-')) pos.push(mots[k]);
    }
    if ((pos[0] === 'pr' && pos[1] === 'merge') || (pos[0] === 'repo' && pos[1] === 'sync')) return true;
    if (pos[0] === 'alias' && (pos[1] === 'set' || pos[1] === 'import')) return true;
    if (pos[0] === 'pr' && pos[1] === 'close' && mots.some((mot) => /^(-d|--delete-branch)$/.test(mot))) return true;
    if (pos[0] !== 'api') return false;
    let chemin = null;
    let methode = null;
    let champs = false;
    for (let k = mots.indexOf('api', i + 1) + 1; k < mots.length; k++) {
      const mot = mots[k];
      if (!mot.startsWith('-')) {
        chemin ??= mot;
        continue;
      }
      const [option, valeurJointe] = mot.split(/=(.*)/s);
      const valeur = valeurJointe ?? (OPTIONS_GH_API_A_VALEUR.has(option) ? mots[++k] : undefined);
      if (option === '-X' || option === '--method') methode = String(valeur ?? '').toUpperCase();
      else if (/^-X./.test(mot)) methode = mot.slice(2).toUpperCase();
      if (['-f', '--raw-field', '-F', '--field', '--input'].includes(option)) champs = true;
    }
    // Route lue comme gh l'enverra : hôte, barres de tête, de fin, doublées et `./` retirés, en minuscules.
    const route = (chemin ?? '').replace(/^[a-z]+:\/\/[^/]+/i, '').replace(/\/(\.\/)+/g, '/').replace(/\/{2,}/g, '/').replace(/^\/+|\/+$/g, '').split('?')[0].toLowerCase();
    // La mutation se cherche de `gh` à la fin de la commande : ni avant (un message de commit), ni bornée au
    // segment (la découpe sur `(` couperait `query A { a(x: 1) } mutation B { … }`).
    if (/(^|\/)graphql$/.test(route)) return /\bmutation\b/i.test(suite) || /query=@|--input|[$]/.test(segment);
    const ecrit = (methode ?? (champs ? 'POST' : 'GET')) !== 'GET';
    // Un chemin qui ne se lit pas (variable, substitution, encodé) pourrait viser une branche : refusé en écriture.
    return ecrit && chemin !== null && (/[$%]/.test(chemin) || CHEMIN_GH_ECRIT.test(route));
  });
}
```

`nomDeBranche`, `brancheGardee` et `ecritParGh` sont des déclarations de fonction, utilisables plus haut ; les constantes de raison sont lues à l'appel, après l'évaluation du module.

### 3. `A/entree.mjs`, `A/garde-commandes.mjs`, `A/garde-github.mjs` (créé) et son banc (créé)

`A/entree.mjs` : la première ligne `import { readFileSync } from 'node:fs';` devient

```js
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
```

et, à la fin du fichier :

```js

/**
 * Branche par défaut du dépôt : `origin/HEAD` (posé par demarrage.mjs) ; s'il manque, le distant, une
 * fois (`git ls-remote --symref origin HEAD`) ; `null` si les deux échouent : restent gardées `develop`,
 * `main` et `sujet/*`. Limite : `git remote set-head origin <x>` ou `git symbolic-ref` détournent la
 * lecture locale ; seule une branche par défaut d'un autre nom que `develop` ou `main` y est exposée.
 */
export function brancheParDefaut() {
  const git = (...args) => execFileSync('git', args, { cwd: RACINE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 10_000 }).trim();
  try {
    return git('symbolic-ref', '--short', 'refs/remotes/origin/HEAD').replace(/^origin\//, '') || null;
  } catch {
    try {
      return /^ref: refs\/heads\/(\S+)\s+HEAD$/m.exec(git('ls-remote', '--symref', 'origin', 'HEAD'))?.[1] ?? null;
    } catch {
      return null;
    }
  }
}
```

`A/garde-commandes.mjs` : `import { lireEntree, RACINE } from './entree.mjs';` (`:4`) devient `import { brancheParDefaut, lireEntree, RACINE } from './entree.mjs';`, et `const d = decisionCommande(commande, { dependancesPrevues, brancheCourante });` (`:62`) devient `const d = decisionCommande(commande, { dependancesPrevues, brancheCourante, brancheParDefaut });`.

`A/garde-github.mjs` :

```js
#!/usr/bin/env node
/**
 * Hook PreToolUse (outils GitHub d'écriture, par MCP) : la même garde que `garde-commandes` pour git,
 * sur les outils qui écrivent une branche sans passer par git (push_files, create_or_update_file,
 * delete_file, create_branch), qui fusionnent une PR (merge_pull_request, enable_pr_auto_merge) ou qui
 * la mettent à jour en écrivant sur sa tête (update_pull_request_branch). Il refuse et dit quoi faire, il
 * ne demande jamais rien à un humain. Une entrée qu'il ne sait pas lire (vide, `null`, JSON illisible,
 * outil hors des sept de son matcher) est refusée : il échoue fermé.
 */
import { execFileSync } from 'node:child_process';
import { brancheParDefaut, lireEntree, RACINE } from './entree.mjs';
import { decisionOutilGithub, OUTILS_GITHUB_GARDES } from './regles.mjs';

/** Un nom de dépôt ou de propriétaire : chaîne de `[\w.-]`, qui ne commence pas par un point. */
const nomGithub = (v) => typeof v === 'string' && /^(?!\.)[\w.-]+$/.test(v);
/** Un nom de branche rendu par GitHub : `[\w./-]`, ni en tête un point ou un tiret, ni `..`. */
const nomDeRef = (v) => /^(?![.-])[\w./-]+$/.test(v) && !v.includes('..');

/**
 * Tête et base de la PR visée, en un appel de l'API REST (`gh api`) ; `null` si elles ne se lisent pas :
 * `owner` ou `repo` absents ou hors de `[\w.-]` (ou commençant par un point), numéro qui n'est pas un
 * entier positif (un nombre, pas un texte), gh absent, refusé, délai de 10 s, ou réponse dont l'une des
 * deux n'a pas la forme d'un nom de branche.
 */
function refsDeLaPr({ owner, repo, pullNumber } = {}) {
  if (!nomGithub(owner) || !nomGithub(repo) || !Number.isSafeInteger(pullNumber) || pullNumber <= 0) return null;
  try {
    const lignes = execFileSync('gh', ['api', `repos/${owner}/${repo}/pulls/${pullNumber}`, '--jq', '.head.ref, .base.ref'], {
      cwd: RACINE,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 10_000,
    }).split('\n');
    const [tete, base] = lignes;
    return lignes.length === 3 && lignes[2] === '' && [tete, base].every(nomDeRef) ? { tete, base } : null;
  } catch {
    return null;
  }
}

const entree = lireEntree() ?? {};
const outil = String(entree.tool_name ?? '');
if (!outil.startsWith('mcp__') || !OUTILS_GITHUB_GARDES.includes(outil.split('__').pop())) {
  process.stderr.write('entrée de hook illisible : refusé\n');
  process.exit(2);
}
const d = decisionOutilGithub(outil, entree.tool_input ?? {}, { brancheParDefaut: brancheParDefaut(), refsDeLaPr });
if (d) {
  process.stderr.write(`${d.raison}\n`);
  process.exit(2);
}
```

Le banc `A/garde-github.test.mjs` :

```js
// Le hook garde-github tel que Claude Code le lance : l'entrée JSON d'un outil MCP sur stdin, sortie 2
// et la raison sur stderr pour un refus. GitHub est remplacé par un faux `gh` qui rend la base de la
// PR (ou échoue) ; `origin/HEAD` d'un dépôt jouet donne la branche par défaut. Aucun réseau.
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('garde-github.mjs', import.meta.url));

/** Dépôt jouet dont `origin/HEAD` vise `parDefaut`, et un faux `gh` qui rend `tete` puis `base` (`base` vide : il échoue). */
function jouet({ parDefaut = 'trunk', base = '', tete = 'feat/x' } = {}) {
  const racine = mkdtempSync(join(tmpdir(), 'garde-github-'));
  const bin = join(racine, 'bin');
  execFileSync('mkdir', ['-p', bin]);
  writeFileSync(join(bin, 'gh'), base ? `#!/bin/sh\necho "$*" >> "${racine}/gh.log"\nprintf '%s\\n%s\\n' '${tete}' '${base}'\n` : '#!/bin/sh\nexit 1\n');
  chmodSync(join(bin, 'gh'), 0o755);
  const env = { PATH: `${bin}:${dirname(process.execPath)}:/usr/bin:/bin`, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1' };
  const git = (...args) => execFileSync('git', args, { cwd: racine, env, stdio: 'ignore' });
  git('init', '-q');
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '--allow-empty', '-m', 'x');
  git('update-ref', `refs/remotes/origin/${parDefaut}`, 'HEAD');
  git('symbolic-ref', 'refs/remotes/origin/HEAD', `refs/remotes/origin/${parDefaut}`);
  return { racine, env };
}

const brut = ({ racine, env }, input) =>
  spawnSync(process.execPath, [SCRIPT], { cwd: racine, env: { ...env, CLAUDE_PROJECT_DIR: racine }, input, encoding: 'utf8' });
const lancer = (j, tool_name, tool_input) => brut(j, JSON.stringify({ hook_event_name: 'PreToolUse', tool_name, tool_input }));

const fichiers = (branch) => ({ owner: 'o', repo: 'r', branch, message: 'm', files: [{ path: 'docs/a.md', content: 'x' }] });

test('garde-github refuse push_files sur un sujet, develop, main ou la branche par défaut, laisse la branche de travail', () => {
  const j = jouet();
  for (const branche of ['sujet/demo', 'refs/heads/sujet/demo', 'develop', 'main', 'trunk', '', ' sujet/demo', 'Develop', 'origin/develop']) {
    const r = lancer(j, 'mcp__github__push_files', fichiers(branche));
    assert.equal(r.status, 2, `${branche} : ${r.stderr}`);
    assert.match(r.stderr, /sujet\.sh carte <nom>/);
  }
  const r = lancer(j, 'mcp__github__push_files', fichiers('feat/spec-all-demo-1-01-travail'));
  assert.equal(r.status, 0, r.stderr);
  assert.equal(r.stderr, '');
});

test('garde-github refuse create_or_update_file, delete_file et create_branch vers un sujet, sous tout préfixe de serveur', () => {
  const j = jouet();
  for (const [outil, entree] of [
    ['mcp__github__create_or_update_file', { owner: 'o', repo: 'r', path: 'docs/a.md', content: 'x', message: 'm', branch: 'sujet/demo' }],
    ['mcp__github__delete_file', { owner: 'o', repo: 'r', path: 'docs/a.md', message: 'm', branch: 'sujet/demo' }],
    ['mcp__github__create_branch', { owner: 'o', repo: 'r', branch: 'sujet/neuf', from_branch: 'develop' }],
    ['mcp__github-perso__create_or_update_file', { owner: 'o', repo: 'r', path: 'a', content: 'x', message: 'm', branch: 'develop' }],
  ])
    assert.equal(lancer(j, outil, entree).status, 2, outil);
  assert.equal(lancer(j, 'mcp__github__create_branch', { owner: 'o', repo: 'r', branch: 'feat/x', from_branch: 'sujet/demo' }).status, 0);
});

test('garde-github : une PR vers un sujet, develop, main ou la branche par défaut ne se fusionne pas par un outil ; base illisible : refusée', () => {
  for (const base of ['sujet/demo', 'develop', 'main', 'trunk']) {
    const j = jouet({ base });
    const r = lancer(j, 'mcp__github__merge_pull_request', { owner: 'o', repo: 'r', pullNumber: 12, merge_method: 'squash' });
    assert.equal(r.status, 2, `${base} : ${r.stderr}`);
    assert.match(r.stderr, /passer\.sh, sujet\.sh fusionner/);
    assert.equal(lancer(j, 'mcp__github__enable_pr_auto_merge', { owner: 'o', repo: 'r', pullNumber: 12 }).status, 2, base);
  }
  const ordinaire = jouet({ base: 'feat/y' });
  assert.equal(lancer(ordinaire, 'mcp__github__merge_pull_request', { owner: 'o', repo: 'r', pullNumber: 12 }).status, 0);
  assert.equal(lancer(jouet(), 'mcp__github__merge_pull_request', { owner: 'o', repo: 'r', pullNumber: 12 }).status, 2, 'gh en échec');
  for (const [owner, repo, pullNumber] of [['o;rm', 'r', 12], ['..', 'r', 12], ['o', '.git', 12], ['o', 'r', -1], ['o', 'r', 0], ['o', 'r', 1.5], ['o', 'r', '12'], ['o', 'r', undefined], [undefined, undefined, 12], [['o'], 'r', 12]])
    assert.equal(lancer(ordinaire, 'mcp__github__merge_pull_request', { owner, repo, pullNumber }).status, 2, `${owner} ${repo} ${pullNumber}`);
});

test('garde-github : une PR dont la tête est gardée ne se met pas à jour par un outil ; tête ordinaire : permis ; tête illisible : refusée', () => {
  const mettreAJour = (j) => lancer(j, 'mcp__github__update_pull_request_branch', { owner: 'o', repo: 'r', pullNumber: 12 });
  for (const tete of ['sujet/demo', 'main', 'develop', 'trunk']) {
    const r = mettreAJour(jouet({ tete, base: 'develop' }));
    assert.equal(r.status, 2, `${tete} : ${r.stderr}`);
    assert.match(r.stderr, /sujet\.sh rafraichir/);
  }
  assert.equal(mettreAJour(jouet({ tete: 'feat/x', base: 'sujet/demo' })).status, 0);
  for (const tete of ['a b', '..', '-x', 'a/../b'])
    assert.equal(mettreAJour(jouet({ tete, base: 'develop' })).status, 2, `tête ${tete} : pas la forme d’un nom de branche`);
  assert.equal(mettreAJour(jouet()).status, 2, 'gh en échec');
});

test('garde-github échoue fermé : entrée vide, null, JSON illisible, sans tool_name ou outil hors de son matcher', () => {
  const j = jouet();
  for (const entree of ['', '{', '{}', 'null', '[]', '"x"', JSON.stringify({ tool_input: { branch: 'feat/x' } }), JSON.stringify({ tool_name: 'mcp__github__get_me', tool_input: {} }), JSON.stringify({ tool_name: 'push_files', tool_input: { branch: 'feat/x' } })]) {
    const r = brut(j, entree);
    assert.equal(r.status, 2, entree);
    assert.match(r.stderr, /entrée de hook illisible : refusé/);
  }
});

test('garde-github lit la branche par défaut sur le distant quand origin/HEAD manque', () => {
  const j = jouet({ parDefaut: 'trunk' });
  const nu = join(j.racine, 'origine.git');
  const git = (...args) => execFileSync('git', args, { cwd: j.racine, env: j.env, stdio: 'ignore' });
  git('init', '-q', '--bare', '-b', 'trunk', nu);
  git('remote', 'add', 'origin', nu);
  git('push', '-q', 'origin', 'HEAD:refs/heads/trunk');
  git('symbolic-ref', '--delete', 'refs/remotes/origin/HEAD');
  assert.equal(lancer(j, 'mcp__github__push_files', fichiers('trunk')).status, 2, 'trunk, lue par ls-remote --symref');
  assert.equal(lancer(j, 'mcp__github__push_files', fichiers('feat/x')).status, 0);
});
```

Le banc ne dépend que de `git` et de `node` : il tourne posé sous `scripts/agent/` comme dans le plugin (`socle-chaine-de-production/SKILL.md:35` pose `references/agent/*`).

### 4. Le branchement — `R/settings-hooks.json`

Le tableau `"PreToolUse"` entier (`:4-23`) devient (les deux entrées existantes gagnent un `"timeout"`, 30 et 60 s, et `"onFailure": "block"` ; la troisième est nouvelle, 40 s : décision 8) :

```json
    "PreToolUse": [
      {
        "matcher": "Edit|Write|MultiEdit|NotebookEdit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/scripts/agent/garde-fichiers.mjs",
            "timeout": 30,
            "onFailure": "block"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/scripts/agent/garde-commandes.mjs",
            "timeout": 60,
            "onFailure": "block"
          }
        ]
      },
      {
        "matcher": "^mcp__.+__(push_files|create_or_update_file|delete_file|create_branch|merge_pull_request|enable_pr_auto_merge|update_pull_request_branch)$",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/scripts/agent/garde-github.mjs",
            "timeout": 40,
            "onFailure": "block"
          }
        ]
      }
    ],
```

### 5. Le gate — `R/scripts/verify/settings-json-regles.mjs` et son banc

Le bloc `HOOKS_EXIGES` (`:15-21`, avec sa ligne de commentaire) devient :

```js
/** Matcheur des outils GitHub d'écriture (hook `garde-github`). */
export const MATCHER_GITHUB = '^mcp__.+__(push_files|create_or_update_file|delete_file|create_branch|merge_pull_request|enable_pr_auto_merge|update_pull_request_branch)$';

/** Les gardes de PreToolUse : chaque matcheur exigé lance son script, qui échoue fermé. */
export const GARDES = {
  'Edit|Write|MultiEdit|NotebookEdit': 'scripts/agent/garde-fichiers.mjs',
  Bash: 'scripts/agent/garde-commandes.mjs',
  [MATCHER_GITHUB]: 'scripts/agent/garde-github.mjs',
};

/** Événements de hook exigés, avec les matcheurs que chacun doit porter. */
export const HOOKS_EXIGES = {
  SessionStart: [],
  PreToolUse: Object.keys(GARDES),
  PostToolUse: [],
  Stop: [],
};
```

Dans `commandes` (`:47-50`), la ligne `(groupe?.hooks ?? []).map((h) => ({ matcher: groupe.matcher, command: h?.command ?? '' })),` devient :

```js
    (groupe?.hooks ?? []).map((h) => ({ matcher: groupe.matcher, type: h?.type, command: h?.command ?? '', onFailure: h?.onFailure, timeout: h?.timeout, async: h?.async, asyncRewake: h?.asyncRewake })),
```

Dans `ecartsSettings`, juste avant `for (const [evenement, valeur] of Object.entries(hooks)) {` (`:116`, la boucle qui vérifie que les scripts cités existent), ajouter :

```js
  // Chaque garde est lancée par son matcheur, et échoue fermé : `"onFailure": "block"` (Claude Code
  // 2.1.295 ou plus récent, page des hooks), un `"timeout"` d'au plus 60 s (le défaut est 600 s), jamais
  // en arrière-plan (`async`, `asyncRewake` : la page dit `onFailure` sans effet sur un hook en
  // arrière-plan). Sans quoi une garde qui plante, dépasse son délai ou a été remplacée laisserait passer
  // l'outil.
  // La garde se lance par la commande exacte du fragment (`node "$CLAUDE_PROJECT_DIR"/scripts/agent/…`),
  // en hook `command` : `… || true`, `true # …`, `echo …` ou un hook `prompt` ne la lancent pas.
  const lance = (l, script) => l.type === 'command' && new RegExp(`^node "\\$\\w+"/${script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`).test(l.command.trim());
  if (json?.disableAllHooks === true) {
    ecarts.push(`ligne ${ligneDeCle(texte, 'disableAllHooks')} : \`disableAllHooks\` à \`true\` coupe toutes les gardes. Retirer la clé.`);
  }
  const lignesPre = commandes(hooks.PreToolUse);
  for (const [matcher, script] of Object.entries(GARDES)) {
    if (lignesPre.some((l) => l.matcher === matcher) && !lignesPre.some((l) => l.matcher === matcher && lance(l, script))) {
      ecarts.push(`ligne ${ligneDeCle(texte, 'PreToolUse')} : \`hooks.PreToolUse\`, matcheur « ${matcher} », ne lance pas ${script}.`);
    }
  }
  for (const { command, onFailure, timeout, async: fond, asyncRewake } of lignesPre) {
    const garde = /scripts\/agent\/garde-[\w.-]+/.exec(command)?.[0];
    if (!garde) continue;
    const ligne = ligneDe(texte, new RegExp(garde.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    if (onFailure !== 'block') {
      ecarts.push(`ligne ${ligne} : \`hooks.PreToolUse\` lance ${garde} sans \`"onFailure": "block"\` : une garde qui plante ou dépasse son délai laisserait passer l'outil.`);
    }
    if (typeof timeout !== 'number' || !(timeout > 0 && timeout <= 60)) {
      ecarts.push(`ligne ${ligne} : \`hooks.PreToolUse\` lance ${garde} sans \`"timeout"\` numérique d'au plus 60 s : avec \`"onFailure": "block"\`, le défaut de 600 s tiendrait la session dix minutes sur une garde bloquée.`);
    }
    if (fond === true || asyncRewake === true) {
      ecarts.push(`ligne ${ligne} : \`hooks.PreToolUse\` lance ${garde} en arrière-plan (\`async\`) : il ne bloque plus rien.`);
    }
  }
```

`R/scripts/verify/settings-json.test.mjs` : l'import (`:3`) devient `import { ecartsSettings, MATCHER_GITHUB } from './settings-json-regles.mjs';` ; après la définition de `hook` (`:5-7`), ajouter :

```js
const garde = (script) => ({ hooks: [{ type: 'command', command: `node "$D"/scripts/agent/${script}`, timeout: 30, onFailure: 'block' }] });
```

dans `reglesValides()`, les deux lignes de `PreToolUse` (`:13-14`) deviennent :

```js
      { matcher: 'Edit|Write|MultiEdit|NotebookEdit', ...garde('garde-fichiers.mjs') },
      { matcher: 'Bash', ...garde('garde-commandes.mjs') },
      { matcher: MATCHER_GITHUB, ...garde('garde-github.mjs') },
```

et, avant `test('commande de hook vers un fichier absent'` (`:90`) :

```js
test('PreToolUse sans le matcheur des outils GitHub d’écriture', () => {
  const s = reglesValides();
  s.hooks.PreToolUse = s.hooks.PreToolUse.slice(0, 2);
  assert.ok(ecarts(s).some((m) => m.includes(`sans matcheur « ${MATCHER_GITHUB} »`)));
});

test('une garde affaiblie est un écart : sans "onFailure": "block", sans timeout d’au plus 60 s, en arrière-plan, remplacée, neutralisée, ou déplacée sous un autre matcheur, ou tous les hooks coupés', () => {
  const affaiblies = {
    'onFailure absent': (s) => delete s.hooks.PreToolUse[2].hooks[0].onFailure,
    'onFailure continue': (s) => (s.hooks.PreToolUse[1].hooks[0].onFailure = 'continue'),
    'onFailure Block': (s) => (s.hooks.PreToolUse[0].hooks[0].onFailure = 'Block'),
    async: (s) => (s.hooks.PreToolUse[2].hooks[0].async = true),
    asyncRewake: (s) => (s.hooks.PreToolUse[1].hooks[0].asyncRewake = true),
    'commande remplacée par true': (s) => (s.hooks.PreToolUse[2].hooks[0].command = 'true'),
    'timeout absent': (s) => delete s.hooks.PreToolUse[2].hooks[0].timeout,
    'timeout 600': (s) => (s.hooks.PreToolUse[1].hooks[0].timeout = 600),
    'timeout en texte': (s) => (s.hooks.PreToolUse[0].hooks[0].timeout = '30'),
    'commande suivie de || true': (s) => (s.hooks.PreToolUse[2].hooks[0].command += ' || true'),
    'commande en commentaire': (s) => (s.hooks.PreToolUse[2].hooks[0].command = 'true # node "$D"/scripts/agent/garde-github.mjs'),
    'commande qui cite le script sans le lancer': (s) => (s.hooks.PreToolUse[1].hooks[0].command = 'echo scripts/agent/garde-commandes.mjs'),
    'hook de type prompt': (s) => (s.hooks.PreToolUse[0].hooks[0].type = 'prompt'),
    'disableAllHooks à la racine': (s) => (s.disableAllHooks = true),
    'garde déplacée sous Bash': (s) => {
      s.hooks.PreToolUse[1].hooks.push(s.hooks.PreToolUse[2].hooks[0]);
      s.hooks.PreToolUse[2].hooks = [{ type: 'command', command: 'true', onFailure: 'block' }];
    },
  };
  for (const [nom, affaiblir] of Object.entries(affaiblies)) {
    const s = reglesValides();
    affaiblir(s);
    assert.ok(ecarts(s).length > 0, nom);
  }
});

```

### 6. Les textes, mot pour mot

- `R/CONTENU.md:13` : « le push direct sur `develop` ou `main`, le rebase d'une branche partagée, » devient « le push direct sur `develop`, `main` ou la branche par défaut sous toutes ses graphies (`HEAD:refs/heads/develop`, `HEAD:heads/main`, `HEAD:DEVELOP`, ou `git push` nu depuis l'une d'elles), le rebase d'une branche partagée, ».
- Même ligne, après « le hook ne sait pas quelle branche est « à soi ». », ajouter : « Il refuse enfin l'écriture d'une branche, d'un fichier ou d'une règle de branche par `gh` tapé à la main : `gh api` en écriture vers `git/refs`, `contents`, `merges`, `merge-upstream`, `pulls/<n>/merge` ou `update-branch`, `branches/<b>/protection`, `rulesets`, vers une route illisible ou encodée, une mutation GraphQL ou une requête illisible (par `graphql` ou la route `/graphql`), `gh pr merge`, `gh pr close --delete-branch`, `gh repo sync`, `gh alias set` et `gh alias import`, avec ou sans `-R` ; les scripts du capitaine et `sujet.sh`, qu'il ne lit pas, gardent leurs appels. Une barre oblique inverse ne cache rien : les lignes continuées sont recollées et `\git` se lit `git`. Une substitution (`$(…)` ou entre accents graves) non plus : elle est lue à part, et la commande englobante la lit comme un mot illisible (`git -C "$(pwd)" push origin HEAD:sujet/x` est lu, `git push origin "$(git branch --show-current)"` est refusé, destination illisible) ; `segmentsDeCommande` fait ce découpage pour tous les lecteurs. Par prudence, il cherche des mots, pas des programmes : une commande qui cite `gh pr merge` ou `git push … sujet/x` comme texte (`grep`, `echo`), ou le mot `mutation` après un `gh api graphql`, même en commentaire, est refusée. »
- Même ligne : « La garde vaut pour des sessions de bonne foi : un contournement délibéré (`remote set-url`, un script lancé par la session) échappe à la lecture du hook ; seule une protection de `sujet/*` côté GitHub en ferait une frontière. » devient : « `garde-github` applique la même garde aux outils GitHub par MCP (matcher `^mcp__.+__(push_files|create_or_update_file|delete_file|create_branch|merge_pull_request|enable_pr_auto_merge|update_pull_request_branch)$`, quel que soit le nom du serveur) : il refuse `push_files`, `create_or_update_file` et `delete_file` vers un `sujet/…`, `develop`, `main` ou la branche par défaut, ou sans branche, sous toutes les graphies d'un nom (`refs/heads/`, `origin/`, majuscules, barres doublées, blancs), `create_branch` d'un `sujet/…`, toute fusion par outil (`merge_pull_request`, `enable_pr_auto_merge`) d'une PR dont la base est gardée ou ne se lit pas, et toute mise à jour par outil (`update_pull_request_branch`) d'une PR dont la tête est gardée ou ne se lit pas (tête et base lues en un appel, `gh api …/pulls/<n>`) : le capitaine fusionne par ses scripts, un sujet se rafraîchit par `sujet.sh rafraichir`. « Une session ne remet pas sa branche à jour avec la branche d'intégration, c'est le capitaine » reste une règle de conduite : le hook ne garde que les branches gardées. Une seule définition de branche gardée (`brancheGardee`) sert `git push`, `gh` et les outils. La branche par défaut se lit sur `origin/HEAD`, sinon sur le distant (`git ls-remote --symref origin HEAD`) ; si les deux échouent, seuls `develop`, `main` et `sujet/*` restent gardés, et `git remote set-head` ou `git symbolic-ref` détournent la lecture locale : seule une branche par défaut d'un autre nom que `develop` ou `main` y est exposée. Une entrée qu'il ne lit pas est refusée. Les trois gardes de `PreToolUse` portent un `"timeout"` (30 s pour `garde-fichiers` ; 60 pour `garde-commandes` et 40 pour `garde-github`, la somme de leurs pires délais, chaque appel `git` ou `gh` plafonné à 10 s) et `"onFailure": "block"` (Claude Code 2.1.295 ou plus récent), jamais `async`, et le gate `settings-json` l'exige (un `timeout` numérique d'au plus 60 s, la commande exacte du fragment dans un hook `command`, et pas de `disableAllHooks`) : une garde qui plante, dépasse son délai, a été remplacée ou neutralisée (`|| true`) bloque l'outil au lieu de le laisser passer ; quand ses délais s'additionnent au-delà de son `timeout` (le distant lent), elle échoue fermée de même. Quand une garde casse : toutes importent `regles.mjs`, une erreur de syntaxe y bloque Bash, l'édition et les outils GitHub, et la session ne peut pas se réparer elle-même ; en local, un humain relance Claude Code avec `claude --settings '{"disableAllHooks": true}'` ou corrige `.claude/settings.json` ; en session cloud, la réparation vient d'une PR faite hors de la session. La garde vaut pour des sessions de bonne foi. Restent hors de sa lecture : un script lancé par la session, `curl` ou un autre client de l'API ; une destination portée par la configuration plutôt que par la commande (`git -c remote.origin.push=HEAD:refs/heads/develop push`, `git config push.default upstream && git branch -u origin/develop && git push`) ; le corps d'un here-doc (`cat <<EOF` non cité exécute une substitution, `bash <<EOF` exécute tout) ; l'effet d'un workflow (`gh workflow run`, `POST …/dispatches` et l'outil `actions_run_trigger` sont vus et laissés passer, ce que le workflow écrit leur échappe) ; un alias `gh` écrit à la main dans son fichier de configuration ; `gh repo edit --default-branch` et `PATCH repos/o/r -f default_branch=…` (droits d'admin) ; les formes de mauvaise foi par substitution (`gh api $(echo -X PUT) …`, `GH=gh; $GH pr merge`, `xargs gh`, une fonction ou un alias de shell définis dans la même commande) ; une session à plusieurs dépôts, qui ne lit pas les hooks de `.claude/settings.json`. Seule une protection de `sujet/*` côté GitHub en ferait une frontière. »
- Même ligne : « `garde-commandes.test.mjs` éprouve la lecture du ticket sur un dépôt jouet. » devient « `garde-commandes.test.mjs` éprouve la lecture du ticket sur un dépôt jouet, `garde-github.test.mjs` le hook des outils GitHub avec un faux `gh`. »
- `skills/chaine/socle-chaine-de-production/SKILL.md:35` : « les deux entrées `PreToolUse` **s'ajoutent** à celles de graphify ; » devient « les trois entrées `PreToolUse` (fichiers, `Bash`, outils GitHub d'écriture : `garde-github.mjs`), chacune avec un `"timeout"` (30, 60 et 40 s) et `"onFailure": "block"` (Claude Code 2.1.295 ou plus récent), **s'ajoutent** à celles de graphify ; la mise à jour des gardes, du gate `settings-json` et de `.claude/settings.json` va dans une même PR, et si l'environnement refuse à la session l'édition de `.claude/settings.json`, elle l'écrit à qui l'a lancée, avec le fragment, et s'arrête : un humain le colle ; », et la fin « `echo '{"tool_input":{"command":"git push --force origin x"}}' | node scripts/agent/garde-commandes.mjs` sort en 2. » devient « `echo '{"tool_input":{"command":"git push --force origin x"}}' | node scripts/agent/garde-commandes.mjs` sort en 2, et `echo '{"tool_name":"mcp__github__push_files","tool_input":{"branch":"sujet/x"}}' | node scripts/agent/garde-github.mjs` aussi. »
- `R/fragments/claude-md-fusion.md:10` : « refusent tout push forcé, `--no-verify`, le push direct sur `develop` ou `main`, l'édition » devient « refusent tout push forcé, `--no-verify`, le push direct sur `develop`, `main` ou la branche par défaut, l'écriture d'un sujet, de `develop` ou de `main` par un outil GitHub ou par `gh`, l'édition ».
- `skills/chaine/sujet/SKILL.md:42` : « Un sujet ne se pousse jamais à la main : le hook `garde-commandes` refuse tout `git push` vers `sujet/…`, sous toutes ses formes, » devient « Un sujet ne se pousse jamais à la main : le hook `garde-commandes` refuse tout `git push` vers `sujet/…`, sous toutes ses formes, et `gh` en écriture vers une branche, le hook `garde-github` toute écriture vers `sujet/…` par un outil GitHub (`push_files`, `create_or_update_file`, `delete_file`, `create_branch`, fusion d'une PR dont la base est gardée, mise à jour d'une PR dont la tête est gardée), ».
- `R/admin.md`, juste avant la ligne `:25` qui commence par « Vérification : », ajouter la case, suivie d'une ligne vide : « - [ ] **Claude Code 2.1.295 au moins**, sur chaque poste et dans l'environnement cloud : les trois gardes de `PreToolUse` portent `"onFailure": "block"`, que cette version introduit. Le comportement d'une version plus ancienne devant cette clé n'est pas établi. »

### 7. La version — `.claude-plugin/plugin.json:3`

Mineure (décision 11).

### 8. La sonde, à jouer par l'architecte après la fusion

Ce que la copie jetable n'a pas pu jouer : le hook appelé par Claude Code (2.1.295 au moins) sur un vrai outil MCP, et `onFailure`. Dans un projet qui a reposé le socle à la version de ce ticket (fragment fusionné dans `.claude/settings.json`), une session lancée exprès, à qui l'on demande, dans l'ordre, de rapporter chaque refus mot pour mot. Chaque geste est choisi pour que GitHub refuse de lui-même si le hook ne mord pas : rien ne peut être écrit.

1. `mcp__github__create_or_update_file` sur une branche **inexistante** `sujet/sonde-hook-inexistante` (`path: "docs/sonde.md"`) : attendu, refus du hook (raison « écrire par un outil GitHub … ») ; sans hook, GitHub répond « branche introuvable ».
2. `mcp__github__create_or_update_file` avec `branch: "origin/develop"` (`path: "docs/sonde.md"`) : le hook lit `develop` et refuse ; sans hook, GitHub ne trouve pas de branche nommée `origin/develop` et rien n'est écrit.
3. `mcp__github__merge_pull_request` sur une PR **fermée** dont la base était un `sujet/…` : attendu, refus du hook (base lue par `gh api`) ; sans hook, GitHub refuse une PR fermée.
4. `mcp__github__update_pull_request_branch` sur une PR **fermée dont la branche de tête `sujet/…` a été supprimée** : attendu, refus du hook (tête lue par `gh api`, le nom reste dans la PR) ; sans hook, il n'y a plus de branche où écrire.
5. `gh api repos/<owner>/<repo>/pulls/<n> --jq '.head.ref, .base.ref'` (la PR du 3) dans la même session : dit si le hook peut lire la base dans une session cloud. Ne pas se fier à `gh auth status`, qui y dit le jeton invalide alors que `gh api` aboutit.

La session rapporte aussi le `tool_input` qu'elle a envoyé (noms des champs), pour confirmer que le hook reçoit `branch` et `pullNumber` tels que le schéma les nomme. Résultat à écrire dans `## Comments` de ce ticket.

## Surfaces

| Surface | Preuve |
| --- | --- |
| `git push` vers une branche gardée, toutes graphies | `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` « un git push vers develop, main ou la branche par défaut est refusé sous toutes ses graphies ; une source develop ou un nom voisin passent » |
| barre oblique inverse | `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` « une barre oblique inverse ne cache ni git ni gh : lignes continuées recollées, \git lu comme git » |
| substitution de commande | `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` « une substitution de commande ne cache ni git ni gh : lue à part, remplacée dans la commande englobante par un mot illisible » |
| outils GitHub, écriture, fusion et mise à jour, toutes graphies | `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` « decisionOutilGithub : écrire ou fusionner vers une branche gardée, ou mettre à jour une PR dont la tête est gardée, est refusé, sous toutes ses graphies » |
| `gh` en écriture | `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs` « gh en écriture vers une branche, un fichier ou une règle de branche est refusé ; la lecture, les PR et les labels passent » |
| le hook, tel que Claude Code le lance | `skills/chaine/socle-chaine-de-production/references/agent/garde-github.test.mjs` « garde-github refuse push_files sur un sujet, develop, main ou la branche par défaut, laisse la branche de travail », « garde-github refuse create_or_update_file, delete_file et create_branch vers un sujet, sous tout préfixe de serveur », « garde-github : une PR vers un sujet, develop, main ou la branche par défaut ne se fusionne pas par un outil ; base illisible : refusée », « garde-github : une PR dont la tête est gardée ne se met pas à jour par un outil ; tête ordinaire : permis ; tête illisible : refusée » |
| le hook échoue fermé | `skills/chaine/socle-chaine-de-production/references/agent/garde-github.test.mjs` « garde-github échoue fermé : entrée vide, null, JSON illisible, sans tool_name ou outil hors de son matcher » |
| branche par défaut sans `origin/HEAD` | `skills/chaine/socle-chaine-de-production/references/agent/garde-github.test.mjs` « garde-github lit la branche par défaut sur le distant quand origin/HEAD manque » |
| le gate exige les gardes | `skills/chaine/socle-chaine-de-production/references/scripts/verify/settings-json.test.mjs` « PreToolUse sans le matcheur des outils GitHub d’écriture », « une garde affaiblie est un écart : sans "onFailure": "block", sans timeout d’au plus 60 s, en arrière-plan, remplacée, neutralisée, ou déplacée sous un autre matcheur, ou tous les hooks coupés » ; « un fichier conforme ne donne aucun écart », inchangé et vert avec le fixture complété |
| le hook dans une vraie session | la sonde du § 8, rapportée dans `## Comments` |
| la version | `git diff origin/main -- .claude-plugin/plugin.json` ne montre que `"version"`, à la mineure qui suit |

## Vérification

- `pnpm test` vert : le compte de `origin/main` plus 13 (435 + 13 = 448 sur `ea7ea67`). `git diff origin/main --stat -- '*.test.mjs'` ne montre que `regles.test.mjs`, `garde-github.test.mjs` (créé) et `settings-json.test.mjs` ; `git diff origin/main -- '*.test.mjs' | grep -c "^-.*assert"` rend 0.
- Rien de refusé sur `origin/main` ne passe : depuis la racine du dépôt, `node monotonie.mjs` (script ci-dessous, à poser hors du dépôt ou à ne pas commiter) compare le `regles.mjs` de `origin/main` à celui de la branche, sur les chaînes des bancs (branche et `origin/main`), le code des `.md` et les lignes des scripts, en 28 variantes et six branches courantes. Il doit rendre « régressions réelles 0 ». **Exception connue, qui n'est pas une régression** : des commandes que `main` refusait à tort, une commande entre accents graves dans un `echo` suivie d'un `$` (``echo `git push -u origin feat/x` ``, ``echo `echo \`git push -u origin HEAD\`` ``) ; on les reconnaît à ce que la commande entre accents graves, seule et sous la forme `echo $(…)`, passe déjà sur `main` ; le script les compte à part (« dont faux refus de main »). Son compte va dans la section de revue de la PR.

```js
// Monotonie : aucune commande refusée par le `regles.mjs` de origin/main ne passe celui de la branche.
// À jouer depuis la racine du dépôt : node monotonie.mjs [fichiers de commandes en plus, une par ligne]
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const A = 'skills/chaine/socle-chaine-de-production/references/agent/regles.mjs';
const git = (...a) => execFileSync('git', a, { encoding: 'utf8', maxBuffer: 1e8, stdio: ['ignore', 'pipe', 'ignore'] });
const dossier = mkdtempSync(join(tmpdir(), 'monotonie-'));
writeFileSync(join(dossier, 'regles.mjs'), git('show', `origin/main:${A}`));
const avant = await import(join(dossier, 'regles.mjs'));
const apres = await import(join(process.cwd(), A));
// Corpus : les chaînes des bancs (branche et origin/main), le code des `.md`, les lignes des scripts.
const out = new Set();
const lits = (src) => {
  for (const [l] of src.matchAll(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\$]|\\.|\$(?!\{))*`/g)) {
    try {
      const v = new Function('return ' + l)();
      if (typeof v === 'string') out.add(v);
    } catch {}
  }
};
for (const f of git('ls-files', '*.test.mjs').split('\n').filter(Boolean)) {
  lits(readFileSync(f, 'utf8'));
  try { lits(git('show', `origin/main:${f}`)); } catch {}
}
for (const f of git('ls-files', 'skills/**/*.md', '*.md').split('\n').filter(Boolean)) {
  const s = readFileSync(f, 'utf8');
  for (const [, c] of s.matchAll(/`([^`\n]+)`/g)) out.add(c);
  for (const [, b] of s.matchAll(/`{3}(?:bash|sh)?\n([\s\S]*?)`{3}/g)) for (const l of b.split('\n')) out.add(l);
}
for (const f of git('ls-files', 'skills/**/*.sh', 'scripts/*.sh').split('\n').filter(Boolean)) for (const l of readFileSync(f, 'utf8').split('\n')) out.add(l.trim());
for (const f of process.argv.slice(2)) for (const l of readFileSync(f, 'utf8').split('\n')) out.add(l);
const corpus = [...out].filter((c) => /(^|[^\w-])(git|gh)(\s|$)/.test(c) && c.length < 2000);
// Variantes : barre oblique inverse, ligne continuée, guillemets, variable, substitutions, préfixes.
const variantes = (c) => {
  const v = new Set([c]);
  v.add(c.replace(/(^|[^\w-])(git|gh)(?=\s)/, '$1\\$2'));
  v.add(c.replace(/(\b(?:git|gh)) /, '$1 \\\n  '));
  v.add(c.replace(/ (\S+)\s*$/, ' \\\n $1'));
  v.add(c.replace(/ (\S+)\s*$/, ' "$1"'));
  v.add(c.replace(/ (\S+)\s*$/, " '$1'"));
  v.add(c.replace(/ (\S+)\s*$/, ' $V'));
  v.add(c.replace(/ (\S+)\s*$/, ' $(echo $1)'));
  v.add(c.replace(/ (\S+)\s*$/, ' `echo $1`'));
  v.add('true && ' + c); v.add('(' + c + ')'); v.add('echo $(' + c + ')'); v.add('echo `' + c + '`'); v.add('x=$(pwd); ' + c);
  v.add(c + ' 2>&1 | tail -3'); v.add(c + ' && echo "$(date)"');
  v.add(c.replace(/\bgit (?=push)/, 'git -C "$(pwd)" ')); v.add(c.replace(/\bgit (?=push)/, 'git -C $(pwd) '));
  v.add(c.replace(/\bgh (?=\w)/, 'gh -R $(echo o/r) ')); v.add(c.replace(/\bgit (?=push)/, 'git -C `pwd` '));
  v.add('cd $(pwd) && ' + c); v.add(c.replace(/\bgit\b/, '"git"')); v.add(c.replace(/\bgh\b/, "'gh'"));
  v.add('$(true)' + c); v.add('`true`' + c); v.add('echo `echo \\`' + c + '\\``'); v.add('x=1 $(true)' + c);
  return [...v];
};
let essais = 0;
const regressions = [];
for (const base of corpus)
  for (const c of variantes(base))
    for (const b of ['feat/x', 'sujet/demo', 'develop', 'main', 'HEAD', null]) {
      essais++;
      if (avant.decisionCommande(c, { brancheCourante: () => b, dependancesPrevues: () => null })?.decision !== 'refuser') continue;
      if (apres.decisionCommande(c, { brancheCourante: () => b, dependancesPrevues: () => null, brancheParDefaut: () => null })?.decision !== 'refuser') regressions.push([b, c]);
    }
// Exception connue : origin/main refusait à tort une commande entre accents graves suivie d'un `$` traînant,
// alors que la commande seule et sa forme `$(…)` y passent. Ce ne sont pas des régressions.
const fauxRefusDeMain = ([b, c]) => {
  const dedans = /`([^`]*)`/.exec(c)?.[1];
  const ctx = { brancheCourante: () => b };
  return Boolean(dedans) && avant.decisionCommande(dedans, ctx)?.decision !== 'refuser' && avant.decisionCommande('echo $(' + dedans + ')', ctx)?.decision !== 'refuser';
};
const vraies = regressions.filter((r) => !fauxRefusDeMain(r));
console.log(`bases ${corpus.length}, essais ${essais}, refusées sur main et passantes après ${regressions.length}, dont faux refus de main ${regressions.length - vraies.length}, régressions réelles ${vraies.length}`);
for (const [b, c] of vraies) console.log('RÉGRESSION', b, JSON.stringify(c));
```
- Le fragment passe le gate : `node --input-type=module -e "const { ecartsSettings } = await import('./skills/chaine/socle-chaine-de-production/references/scripts/verify/settings-json-regles.mjs'); const { readFileSync } = await import('node:fs'); const f = JSON.parse(readFileSync('skills/chaine/socle-chaine-de-production/references/settings-hooks.json', 'utf8')); console.log(ecartsSettings(JSON.stringify({ hooks: f.hooks }, null, 2), { fichierExiste: () => true }))"` affiche `[]`.
- À la main : `echo '{"tool_name":"mcp__github__push_files","tool_input":{"branch":"sujet/x"}}' | node skills/chaine/socle-chaine-de-production/references/agent/garde-github.mjs; echo $?` affiche la raison et `2` ; `echo 'null' | node skills/chaine/socle-chaine-de-production/references/agent/garde-github.mjs; echo $?` affiche « entrée de hook illisible : refusé » et `2` ; `echo '{"tool_input":{"command":"git push origin HEAD:refs/heads/develop"}}' | node skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.mjs; echo $?` sort en `2`.
- Revue : revue de ticket, puis `/security-review` sur la branche ; leurs sections dans le corps de la PR.
- La PR vise `main`. La session part de `origin/main`, lit ce ticket sur la branche de documentation du programme sans le modifier, commite sous les hooks (jamais `--no-verify`), ouvre sa PR hors brouillon **sans poser `à-fusionner`** (`Label: contre-revue`), et écrit à l'architecte dès sa PR livrée, avec la sonde du § 8 à jouer.

## Hors périmètre

- Les scripts lancés par une session, `curl` ou `node` vers l'API, un autre client, l'effet d'un workflow lancé, un alias `gh` écrit à la main dans son fichier de configuration, les formes de mauvaise foi par substitution, une session à plusieurs dépôts (qui ne lit pas les hooks de `.claude/settings.json`) : hors d'atteinte d'un hook, écrits dans `R/CONTENU.md` ; la frontière est la recommandation ci-dessus.
- `gh repo edit --default-branch` et `PATCH repos/o/r -f default_branch=…` : droits d'administrateur, écrits dans `R/CONTENU.md`.
- `gh pr edit --base`, `gh pr ready`, `gh ruleset view` : n'écrivent aucune branche.
- `POST git/trees`, `POST git/blobs`, `POST git/commits` : ils créent des objets, aucune branche ne bouge sans `git/refs`, refusé.
- `mcp__github__update_pull_request` (`base` : recibler une PR n'écrit aucune branche).
- Les règles de dépôt côté GitHub (rulesets) : décision du produit.
- Les sous-agents : rien à faire, la documentation dit que les hooks des fichiers de réglages y tournent aussi (citée dans « Où »).
- Les dépôts de projet : reposer les hooks, fusionner le fragment et mettre à jour le gate est leur affaire, en une PR (décision 9).

## Comments

- 2026-11-14 — Instruit sur `8c670e5` (plugin 7.5.0). Trou reproduit par lecture (aucun matcher MCP dans `settings-hooks.json`) et en jouant `decisionCommande` sur les formes `gh` (toutes `null`). Paramètres des outils MCP lus dans leurs schémas chargés en session ; aucun appel MCP réel joué, d'où la sonde.
- 2026-11-14 — Première relecture : « pas prêt, quatre bloquantes » et six mineures, portées.
- 2026-11-14 — Seconde relecture : « pas prêt », quatre bloquantes (fusion par outil vers `develop`/`main` qui passait ; barre oblique inverse devant `gh` ; GraphQL par la route REST et routes `git//refs`, `GIT/REFS` ; `git push origin HEAD:refs/heads/develop` qui passe déjà sur `main`) et dix mineures, toutes portées, avec les décisions g et h de l'architecte. Base reprise sur `b94eeb0` (ticket 26 fusionné) : ancrages relus, une seule définition de branche gardée pour `git push`, `gh` et les outils, motif `:72` gardé. Rejoué en extrayant les blocs de ce ticket sur une copie neuve de `b94eeb0` : 445 sur 445 ; 0 commande refusée sur `main` qui passe après, sur 2 070 essais.
- 2026-11-14 — Ajouts de l'architecte : `update_pull_request_branch` gardé par la tête de la PR (même règle par l'outil et par `gh`), `timeout` d'au plus 60 s exigé par le gate, substitutions de commande lues par l'utilitaire commun `segmentsDeCommande` (défaut présent sur `main`, relevé par la relecture des tickets 28 et 29). Choix tranchés : motif `:72` gardé, GraphQL de lecture à `mutation` ou variable refusée, `git push` nu depuis une branche gardée refusé, `ls-remote` accepté. Base reprise sur `ea7ea67` (#87, plugin 7.6.0, 435 tests). Rejoué sur une copie neuve de `ea7ea67` : 448 sur 448 ; 0 sur 2 130 essais.
- 2026-11-14 — Troisième relecture : une bloquante (substitution collée devant un mot, accents graves imbriqués échappés : 266 commandes refusées sur `main` passaient, sur 71 904 essais du relecteur) et des mineures, portées : correctif du relecteur dans `segmentsDeCommande`, gate qui exige la commande exacte de chaque garde en hook `command` et refuse `disableAllHooks`, types de `owner`, `repo`, `pullNumber` et forme de la tête et de la base, deux limites de plus (configuration, here-doc), dernier découpage gardé, `timeout` de chaque garde justifié par ses pires délais (30, 60, 40 s). Rejoué : `pnpm test` 448 sur 448 sur `ea7ea67` ; monotonie du relecteur 0 régression réelle, 84 faux refus de `main` levés ; script de monotonie du ticket 0 régression réelle.
