# Les hooks d'agent refusent qu'on désactive les hooks git, qu'on fabrique une ref de suivi et qu'on pousse en « matching », sur le découpage en mots du ticket 33

Status: Repris — ticket 17, PR #119
Type: défaut
Label: contre-revue
Modèle: à fixer au triage — ce ticket est une matière, pas une instruction ; il se récrit sur le découpage en mots du ticket 33, puis se donne à une session.
Blocked by: 33
Dépendances: —
Fichiers chauds: `skills/chaine/socle-chaine-de-production/references/agent/regles.mjs`, `skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs`, `skills/chaine/socle-chaine-de-production/references/CONTENU.md`, `skills/chaine/socle-chaine-de-production/references/fragments/claude-md-fusion.md`, `.claude-plugin/plugin.json`
Repris par : le ticket 17 de `capitaine-a-jour-et-teste` ([`17-les-gardes-lisent-git-apres-ses-options-globales.issue.md`](../../capitaine-a-jour-et-teste/issues/17-les-gardes-lisent-git-apres-ses-options-globales.issue.md), décision `A-28`, 2026-11-18), réécrit sur la lecture par jetons avec les cas d'Iroki #652 : ce ticket ne se lance plus seul.

## D'où il vient, et ce qui est déjà fermé

Partie mise de côté de l'ancien ticket 28 (version longue : `git show 362f7f4:docs/issues/gouverner-nos-boucles/issues/28-pre-push-confirme-par-le-distant-et-hooks-git-que-l-agent-ne-desactive-pas.issue.md`, écrite sur `ea7ea67`, relue deux fois). Après la PR 89 (ticket 27, `cadb4e5`, plugin 7.7.0), l'architecte a décidé de **ne plus ajouter de motifs à `regles.mjs`** : le ticket 33 remplacera le lecteur de commandes par un vrai découpage en mots. Le 28 réduit garde le pre-push et les gardes fermées sur une entrée illisible ; ce ticket garde le reste, à récrire sur le découpage du 33.

**Déjà fermé par la PR 89**, vérifié sur `cadb4e5` : un script importe `regles.mjs` d'une copie de `cadb4e5` et joue `decisionCommande` (branche courante `feat/x`, branche par défaut `develop`) sur la table de la relecture de l'ancien 28 et sur les listes de son § 4.

- Refusés désormais : `--no-verify` et ses abréviations (`--no-veri`, `--no-verif`) **juste après la sous-commande** de `commit`, `push`, `merge`, `am`, `rebase`, en tête ou en fin d'arguments (`git commit -m x --no-verify`, `git push origin feat/x --no-verify`) ; `-n` de `git commit`, seul ou groupé (`-n`, `-nm`, `-anm`, `-qn`, `-vn`, `-m x -n`, `--message=x -n`, `--amend -n`, `--no-post-rewrite -n`) ; `/usr/bin/git commit -n`, `\git commit -n`, et `git commit \⏎ -n` (ligne continuée).
- Table de la relecture (135 commandes) : **21 sur 59** commandes « à refuser » le sont ; **0 sur 14** laissez-passer expliqués (attendu : ils passent, voir plus bas) ; **60 sur 62** « à laisser » passent.
- Listes de l'ancien § 4 : **7 sur 29** refus tenus, **20 sur 20** laissez-passer tenus ; refs de suivi et `--config-env` : **0 sur 5**.

**Encore ouvert sur `cadb4e5`** (chaque commande passe `decisionCommande`) :

| Famille | Commandes qui passent |
| --- | --- |
| `HUSKY` affecté | `HUSKY=0 git commit -m x`, `HUSKY= git commit -m x`, `HUSKY=0⏎git commit -m x`, `export HUSKY=0`, `export HUSKY=0 && git push -u origin feat/x`, `env HUSKY=0 git push origin feat/x`, `declare -x HUSKY=0`, `typeset -x HUSKY=0`, `export -- HUSKY=0`, `export  HUSKY="0"`, `HUSKY=0 bash scripts/chaine/passer.sh 12`, `` `HUSKY=0 git commit -m x` `` |
| `core.hooksPath` par `-c` ou `--config-env` | `git -c core.hooksPath=/dev/null commit -m x`, `git -c core.hooksPath= commit -m x` (valeur vide : saute les hooks, joué), `git -c Core.HooksPath=x commit -m x`, `git -c "core.hookspath=/dev/null" push origin feat/x`, `git --git-dir=.git -c core.hooksPath=/x commit -m y`, `git --config-env core.hooksPath=V commit -m x`, `git --config-env=core.hooksPath=V commit -m x` |
| `core.hooksPath` écrit par `git config` | `git config core.hooksPath x`, `--local`, `--global`, `--worktree`, `--file .git/config`, `-f .git/config`, `--replace-all`, `--unset`, `--unset-all`, `git config set …`, `git config unset …`, `git config core.hooksPath ""`, `git config --remove-section core`, et en ligne continuée `git config \⏎  core.hooksPath ""` |
| `include.path` | `git -c include.path=/tmp/x.cfg commit -m x`, `git config include.path /tmp/x.cfg` |
| `GIT_CONFIG_*` | `GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=x git commit -m x`, `GIT_CONFIG_PARAMETERS="'core.hooksPath=/dev/null'" git commit -m x` |
| `--no-verify` derrière une option globale | `git -C sous/dossier commit --no-verify -m x`, `git -C . push --no-verify origin feat/x`, `git -C . \⏎  commit --no-verify -m x`, `git -C $(pwd) commit -n -m x` |
| sous-commandes non lues | `git pull --no-verify origin develop`, `git am -n x.patch` |
| refs de suivi fabriquées | `git update-ref refs/remotes/origin/x HEAD`, `git update-ref -d refs/remotes/origin/x`, `git -C . update-ref refs/remotes/leurre/x HEAD`, `git -C $(pwd) update-ref refs/remotes/origin/x HEAD`, `git update-ref --stdin <<<"update refs/remotes/origin/x HEAD"` |
| `--config-env` séparé de sa valeur | `git --config-env user.name=HOME push origin HEAD:sujet/demo` **passe le refus des sujets** et pousse (joué : sortie 0, `sujet/autre` créée sur le distant) ; `--config-env=…` collé est refusé. Avec une variable absente git refuse lui-même (`missing environment variable`), d'où `HOME`. |
| push « matching » | `git push origin :`, `git push origin : `, `git push -u origin :` (`git push origin +:` est refusé, comme push forcé) |

**Le push « matching »**, joué sur un dépôt jouet : `develop` et `sujet/demo` locales en avance d'un commit sur le distant, la session sur `feat/x` ; `git push origin :` **avance `develop` et `sujet/demo` sur le distant**. C'est un push sur une branche gardée que le hook ne lit pas : la destination n'est écrite nulle part dans la commande. Le pre-push du projet joue ses contrôles, mais ne refuse pas une destination.

**Faux refus apparus avec la PR 89**, relevés au passage (table « à laisser ») : `git commit -m "--no-verify"` et `git commit -mn` (message « n ») sont refusés sur `cadb4e5` ; ils passaient sur `ea7ea67`. Le premier vient de la lecture aux mots dénudés (`"--no-verify"` cité seul est lu comme l'option) ; le second du groupe `-mn` lu comme `-m` puis `-n`. À trancher par le ticket 33, qui sait ce qu'est un mot cité et une option à valeur.

## La matière de l'ancien 28

Tout ce qui suit a été écrit et joué sur `ea7ea67` (plugin 7.6.0), avant le ticket 27, puis vérifié avec la forme `segmentsDeCommande` du 27. **Les motifs sont une référence de comportement, pas un code à reprendre** : le ticket 33 change la lecture, et ce ticket se récrit dessus.

### Les faits, à la source

- **Husky 9.1.7** (gabarit `skills/monorepo/socle-monorepo/references/racine/package.json:32`), fichier `husky` du paquet : `[ "${HUSKY-}" = "0" ] && exit 0` avant tout hook ; `index.js` pose `core.hooksPath` par `git config`. Donc `HUSKY=0 git commit`, `git -c core.hooksPath=/dev/null commit`, `git -c core.hooksPath= commit` (valeur vide, joué sur git 2.43 : commit sans hook), `git config core.hooksPath ""` et `git config --unset core.hooksPath` sautent les hooks ; un fichier inclus (`include.path`, `includeIf.….path`) peut poser `core.hooksPath`.
- `git commit -n` et `git am -n` sont les formes courtes de `--no-verify` ; `git pull --no-verify` transmet l'option à la fusion. Git accepte toute abréviation non ambiguë d'une option longue (`--no-veri`), refuse les ambiguës (`--no-v`, `--no-ver`).
- `--config-env` : git l'accepte collé (`--config-env=k=V`) ou séparé (`--config-env k=V`). Sur `cadb4e5`, `OPTIONS_GIT_A_VALEUR` (`regles.mjs`) ne le contient pas : la valeur est prise pour la sous-commande.
- `git grep -n "update-ref"` (sur `ea7ea67`) : seulement des bancs et le faux GitHub (`sujet/scripts/faux-gh.mjs`, sur le dépôt nu). Aucun skill ni script ne fait taper `git update-ref` à une session. `git grep -n "git config\|git -c " -- skills ':!*.test.mjs'` : `git -c core.quotepath=false diff …`, lecture. Les bancs posent `core.hooksPath` par `execFileSync` dans leur dépôt jouet : le hook ne lit que `tool_input.command`, il n'en voit rien.
- Les lecteurs d'une ref de suivi, après le 28 réduit : le pre-push ne s'y fie plus (il confirme par `git ls-remote`) ; `ticket-libre.mjs` (`refs/remotes/origin/sujet/`), `next-id-branches.mjs` (`refs/remotes/origin/sujet`, `refs/remotes/origin/docs`) et la couverture du diff (`check:coverage --base-auto`) la lisent encore.

### Les décisions prises, à confirmer sur le découpage en mots

1. **Refuser `git update-ref` vers `refs/remotes/`**, en défense en profondeur ; `git update-ref` d'une branche locale passe.
2. **Désactiver les hooks git est refusé sous toutes les formes que la commande porte** :
   - affectation de `HUSKY`, `GIT_CONFIG_PARAMETERS` ou `GIT_CONFIG_COUNT` **en tête de commande** (préfixe d'une commande simple, ou derrière `export`, `declare`, `typeset`, `readonly`, `local`, `env`, `sudo`, `nohup`, `exec`), quelle que soit la valeur ; **en argument elle passe** (`echo HUSKY=0`, `grep -rn HUSKY=0 .husky`, `git log --grep HUSKY=0`, `MY_HUSKY=0 pnpm test`, `HUSKY_GIT_PARAMS=x git commit`) ;
   - `core.hooksPath`, `include.path` ou `includeIf.….path` passés par `git -c` ou `--config-env` (clé lue sans casse) avant **toute** sous-commande, ou écrits, vidés, retirés par `git config` (`""` et `''` comptent pour un argument), ou la section `core` retirée ; la lecture passe (`--get`, `--get-all`, `--get-regexp`, `--get-urlmatch`, `--list`, `-l`, `get`, `list`, la clé seule) ;
   - `--no-verify` et ses abréviations exactes (`a.length >= 9 && '--no-verify'.startsWith(a)`) pour `commit`, `push`, `merge`, `am`, `rebase`, `pull` ; `--no-verify-signatures` passe ; `-n` de `commit` et de `am`, seul ou groupé, lu avant la première option courte à valeur (`-am x` passe, `-mn` est le message « n ») ; `git push -n` (`--dry-run`) passe ;
   - tout cela derrière une option globale (`-C`, `-c`, `--git-dir`, `--config-env`…), un chemin de git, `\git`, une ligne continuée, et dans une substitution.
3. **`--config-env` entre dans les options globales à valeur**, sans quoi un `git --config-env k=V push` vers un sujet échappe au refus des sujets (constaté sur `cadb4e5`, ci-dessus).
4. Un seul message pour la famille des hooks (ancien `RAISON_HOOKS_GIT`), qui dit quoi faire : « Ils sont le pare-feu local : corriger ce qu'ils signalent. Un banc installe ses hooks dans son dépôt jouet par son script, jamais par une commande de session. »
5. **Nouveau, à instruire** : le push « matching » (`git push <distant> :`, et `push.default=matching` porté par la configuration) touche les branches gardées sans les nommer. Piste : le refuser comme une destination illisible.

### Remèdes écartés par l'ancien 28

- **Le motif `HUSKY=` partout dans la commande** : refusait `echo HUSKY=0`, `grep -rn HUSKY=0 .husky`, `git log --grep HUSKY=0`.
- **Refuser tout `git config` d'une clé `core.*`** : faux refus (`core.quotepath`, lu par la revue).

### Les motifs joués (référence de comportement)

Sur `ea7ea67` puis avec `segmentsDeCommande`, l'ancien 28 ajoutait à `regles.mjs` : `appelsGit` (chaque appel de git d'un segment, ses options globales, sa sous-commande, ses arguments), `ecritHooksPath`, `COURTES_COMMIT_A_VALEUR = 'mFcCtuS'`, `AFFECTE_HOOKS`, `sauteLesHooks`, `ecritUneRefDeSuivi`, `RAISON_HOOKS_GIT`, `RAISON_REF_DE_SUIVI`, et `--config-env` dans `OPTIONS_GIT_A_VALEUR`. Le code entier est au § 3 de `362f7f4` (cité en tête). Les deux règles qui portent l'essentiel :

```js
/** `git config` qui écrit ou retire `core.hooksPath` ou un `include.path` ; la lecture passe. */
function ecritHooksPath({ sous, args }) {
  if (sous !== 'config') return false;
  if (args.some((a, k) => /^-?-?(remove|rename)-section$/.test(a) && /^core$/i.test(args[k + 1] ?? ''))) return true;
  if (!args.some((a) => /^(core\.hookspath|include\.path|includeif\..+\.path)$/i.test(a))) return false;
  if (args.some((a) => /^--(get|get-all|get-regexp|get-urlmatch|list)$|^-l$/.test(a))) return false;
  const positionnels = args.filter((a) => !a.startsWith('-'));
  if (positionnels[0] === 'get' || positionnels[0] === 'list') return false;
  return args.some((a) => /^--(unset|unset-all|add|replace-all)$/.test(a)) || positionnels.length >= 2;
}

const AFFECTE_HOOKS =
  /(?:^|[;&|({!\n`]|\b(?:then|do|else|elif|if|while|until|time)\s|\b(?:export|declare|typeset|readonly|local|env|sudo|nohup|exec)\b[^;&|(){}\n]*?\s)\s*(?:[A-Za-z_]\w*=\S*\s+)*(?:HUSKY|GIT_CONFIG_PARAMETERS|GIT_CONFIG_COUNT)=/;
```

Sur un découpage en mots, `AFFECTE_HOOKS` devient « un mot d'affectation `HUSKY=…`, `GIT_CONFIG_PARAMETERS=…` ou `GIT_CONFIG_COUNT=…` en position d'affectation d'une commande simple, ou argument d'un mot-clé de déclaration », et `ecritHooksPath` se lit sur les arguments de `git config` après retrait des guillemets.

### Les tests de l'ancien 28 (à reprendre sur le 33)

`⏎` y note un saut de ligne. À refuser, raison qui nomme « hooks git » :

```text
HUSKY=0 git commit -m x
export HUSKY=0 && git push -u origin feat/x
env HUSKY=0 git push origin feat/x
HUSKY=0 bash scripts/chaine/passer.sh 12
git -c core.hooksPath=/dev/null commit -m x
git -c "core.hookspath=/dev/null" push origin feat/x
git --config-env core.hooksPath=VIDE commit -m x
git config core.hooksPath /dev/null
git config --unset core.hooksPath
git config --global core.hooksPath /tmp/vide
git config --remove-section core
GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null git commit -m x
git commit -n -m x
git commit -anm x
git -C . commit --no-verify -m x
git commit --no-veri -m x
git push --no-verif origin feat/x
git merge --no-verify origin/develop
git pull --no-verify origin develop
git am -n x.patch
git config core.hooksPath ""
git -c include.path=/tmp/x.cfg commit -m x
git config include.path /tmp/x.cfg
git -C $(pwd) commit -n -m x
\git commit -n -m x
`HUSKY=0 git commit -m x`
git commit \⏎  -n -m x
git -C . \⏎  commit --no-verify -m x
git config \⏎  core.hooksPath ""
```

À laisser passer :

```text
git config user.name "Session"
git config --get core.hooksPath
git config core.hooksPath
git config --list
git commit -m "doc: HUSKY=0 et core.hooksPath sont refusés"
git commit -m "fix -n option"
git commit -am x
git commit -q --no-edit
git -c core.quotepath=false diff --name-only --no-renames origin/develop...HEAD
git merge --no-edit origin/develop
git push -n origin feat/x
pnpm install --frozen-lockfile
echo HUSKY=0
grep -rn HUSKY=0 .husky
git log --grep HUSKY=0
if grep -q HUSKY=0 f; then echo oui; fi
git config --get include.path
git config --get-urlmatch core.hooksPath https://example.org
git merge --no-verify-signatures origin/develop
git pull --no-verify-signatures origin develop
```

Refs de suivi, à refuser (raison qui nomme `refs/remotes`) : `git update-ref refs/remotes/origin/leurre HEAD`, `git -C . update-ref refs/remotes/leurre/x HEAD`, `git -C $(pwd) update-ref refs/remotes/origin/x HEAD`, `git update-ref -d refs/remotes/origin/develop` ; à laisser : `git update-ref -d refs/heads/tmp`. Et `git --config-env user.name=NOM push origin HEAD:sujet/demo` refusé par la raison des sujets (`sujet.sh carte`).

### Les contrôles de la relecture

Trois outils, tenus par l'architecte, que la session de ce ticket redemande pour les rejouer :

- **la table** : 135 commandes (73 « à refuser », dont les 14 laissez-passer expliqués, et 62 « à laisser »), chacune marquée de la décision attendue ; l'ancien 28 en tenait 121, avec 14 laissez-passer expliqués et aucun faux refus ;
- **la non-régression** : 338 commandes tirées des bancs et des `SKILL.md`, 4 464 variantes (ligne continuée à chaque espace, tabulation, `timeout 5`, sous-shell, `echo x;`, `cd sous &&`, substitution) : aucune commande refusée par `main` ne doit passer après ;
- **les lignes continuées** : chaque commande refusée du test, coupée en ligne continuée à chaque espace : aucune variante ne doit passer.

**Les 14 laissez-passer expliqués de l'ancien 28**, à garder ou à fermer :

- refusés par git lui-même, donc sans effet : `git cherry-pick --no-verify`, `git revert --no-verify` (option inexistante), `git commit --no-v`, `--no-ver` (ambigus), `git -ccore.hooksPath=…` (option inconnue), `git -c core.hooksPath commit` (« missing value »), `git config core.hookspath=x` (clé invalide) ;
- sans effet sur les hooks : `git branch -f --track x` ;
- hors de la lecture : `git fetch . X:refs/remotes/…`, `git push . X:refs/remotes/…`, `git remote add x . && git fetch x`, `echo … | git update-ref --stdin`, `git symbolic-ref refs/remotes/origin/HEAD …` (le pre-push du 28 réduit les rattrape : il confirme auprès du distant), `sh -c "HUSKY=0 git commit …"`.

### Faux refus connus et limites écrites

- **Texte cité** : avec la lecture par motifs, une écriture interdite citée entre guillemets dans une autre commande était refusée (`grep -rn "git config core.hooksPath" skills`, `echo "git -c core.hooksPath=/x commit"`, `gh pr create --body "… git update-ref refs/remotes/x"`) : le hook cherchait le mot, pas le programme. Un message de commit (`git commit -m "… git config core.hooksPath x"`) passait. Le découpage en mots du 33 doit lever cette limite ; sinon, l'écrire comme pour `git push` et `gh`.
- **Hors de lecture, quel que soit le découpage** : `bash -c "…"` et `sh -c "…"`, un alias git, `GIT_CONFIG_GLOBAL` vers un fichier, `rm -rf .husky/_`, un `~/.config/husky/init.sh`, l'édition de `.husky/*` par l'outil d'édition (un chemin sensible de la revue, pas un refus), un script lancé par la session, `git $(…)` en sous-commande.
- **Pour la session qui fera ce ticket** : sa description de PR et ses messages de commit citeront `git config core.hooksPath`, `git update-ref refs/remotes/…` ou `HUSKY=0`. La description par un fichier (`gh pr create --body-file <fichier>`, ou l'outil GitHub MCP), un message de commit long par `git commit -F <fichier>`. Un refus du hook sur sa propre commande n'est pas un défaut à corriger.

### Les textes que l'ancien 28 portait

- `R/CONTENU.md`, section des hooks d'agent : la phrase « Restent hors de sa lecture : … » cite encore, sur `cadb4e5`, `git am -n`, `git pull --no-verify`, `HUSKY=0`, `git -C . commit --no-verify` et « des hooks git coupés par la configuration » ; le 28 réduit y ajoute la ref de suivi fabriquée. Ce ticket les retire de la liste à mesure qu'il les ferme, et dit ce qui reste.
- `R/fragments/claude-md-fusion.md:10`, « `--no-verify`, le push direct » devenait « `--no-verify` et toute autre façon de sauter les hooks git (`HUSKY=0`, `core.hooksPath`, `git commit -n`), le push direct ». À relire sur `main` d'alors.

## À trancher au triage

- Le push « matching » est-il dans ce ticket ou un ticket à part ? Sa destination ne se lit pas dans la commande ; `push.default=matching` porté par la configuration y échappe de toute façon.
- `git update-ref refs/remotes/…` : refus utile maintenant que le pre-push ne s'y fie plus ? Les autres lecteurs (`ticket-libre`, `next-id`, couverture `--base-auto`) en dépendent encore.
- Les deux faux refus de la PR 89 (`git commit -m "--no-verify"`, `git commit -mn`) : ici ou au ticket 33.

## Comments

- 2026-11-14 — Ouvert à la réduction du ticket 28 (décision de l'architecte après la PR 89 : plus de motifs dans `regles.mjs`). Matière reprise de `362f7f4`. Vérifié sur `cadb4e5` par `decisionCommande` : 21 des 59 refus de la table tenus par la PR 89, 7 des 29 refus de l'ancien § 4, aucun des cinq refus de refs de suivi et de `--config-env`, `git push origin :` ouvert ; deux faux refus nouveaux. Push « matching » et `--config-env` séparé devant un push vers un sujet joués sur un dépôt jouet : les deux écrivent sur le distant.
- 2026-11-16 — Architecte. Deux trous de plus, à prendre ici :
  - Signalé par la session de la PR 98 (A-51 ter) : dans `$(…)`, bash ferme un here-doc sur `EOF)`, le lecteur par jetons ne le fait pas. `x=$(cat <<'EOF'` / `EOF)` / `git push --force origin feat/x` / `EOF` / `)` (une ligne par `/`) passe la garde sur `main`, sur 7.9.x et après la PR 98, alors que bash lance le push. Ce n'est pas une régression ; la description de la PR 98 le cite en « Hors périmètre ».
  - Signalés par la même session : les here-strings qui vont à un shell par un détour (`cat <<< 'git commit --no-verify -m x' | bash`, `sh -c "$(cat <<< …)"`, `eval "$(cat <<< …)"`, `… > s.sh; bash s.sh`) passent aussi sur `main`.
  - La levée des refus à tort des here-docs à apostrophe, laissés par A-51 ter, reste au ticket 35, pas ici.
- 2026-11-16 — Architecte. Relevé par la relecture de SPEC_ALL_SOC-1.25 d'anchorpost (présent sur `main` aussi, pas une régression) : `claude --settings '{"disableAllHooks": true}' -p …` passe la garde, qui ne voit pas un `claude` imbriqué lancé sans hooks. À refuser ici (option `--settings` ou `--setting-sources` d'un `claude` lancé par l'agent, et toute variante qui désactive les hooks).
