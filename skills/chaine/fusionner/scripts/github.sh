#!/usr/bin/env bash
# =============================================================================
# Appels GitHub du capitaine de fusion (skill /fusionner), sourcé par les autres scripts.
#
# Tout passe par l'API REST (`gh api`), jamais par `gh pr …` : ces commandes passent par
# GraphQL, que GitHub refuse depuis les sessions Claude Code dans le cloud (403). En REST,
# la même skill tourne en local comme dans le cloud. `{owner}/{repo}` est résolu par `gh`
# depuis le remote `origin`.
# =============================================================================
DEPOT='repos/{owner}/{repo}'
# Tout script de la chaîne qui appelle le binaire jq source ce fichier : la garde est ici, une seule fois.
command -v jq >/dev/null || { echo "ARRÊT : jq est requis par les scripts de la chaîne : sudo apt install jq (ou brew install jq)" >&2; exit 69; }
# Identifiants de la convention `tickets` (SPEC_ALL_SOC-1, SPEC_ALL_SOC-1.03 ; `spec-all-soc-1-03` dans
# une branche) : la grammaire (type, contexte, trigramme) ne s'écrit pas en shell. Lire un identifiant
# dans un titre de PR, une branche ou un nom de fichier passe par identifiant.mjs, à côté de ce
# fichier, qui importe `scripts/docs/identifiants.mjs` (commandes : son en-tête). Le shell ne fait que
# Renvois d'une PR (A-10) : chaque commentaire de renvoyer.sh porte cette marque, invisible (un
# commentaire HTML). Le compte se lit sur la PR elle-même : aucun label nouveau. Seuls comptent les
# commentaires du compte qui tient le capitaine (`gh api user`, lu une fois : file.sh le garde dans
# LOGIN_CAPITAINE, `?` s'il est illisible) : la marque recopiée par un autre compte ne met pas la PR
# en attente d'un humain.
MARQUE_RENVOI='<!-- renvoi-capitaine -->'
unset LOGIN_CAPITAINE # posé par file.sh après ce fichier, jamais hérité de l'environnement
# Login GitHub bien formé (utilisateur ou `app[bot]`) : seul un login de cette forme entre dans le filtre jq.
login_valide() { [[ "${1:-}" =~ ^[A-Za-z0-9][A-Za-z0-9-]*(\[bot\])?$ ]]; }
# Commentaires illisibles : 0 sur la sortie, dit sur la sortie d'erreur (un seul nombre, jamais deux).
# Compte du capitaine illisible : le plafond (la PR attend un humain), dit sur la sortie d'erreur ;
# le frein des renvois ne se lâche jamais faute de savoir qui renvoie.
renvois_de() {
  local lus login=${LOGIN_CAPITAINE:-}
  [ -n "$login" ] || login=$(gh api user --jq .login 2>/dev/null) || login=''
  if ! login_valide "$login"; then
    [ -n "${LOGIN_CAPITAINE:-}" ] ||
      echo "renvois de #$1 : compte du capitaine illisible (gh api user), compté au plafond : la PR attend un humain" >&2
    plafond_renvois
    return
  fi
  if lus=$(gh api --paginate "$DEPOT/issues/$1/comments?per_page=100" --jq ".[] | select(.user.login == \"$login\" and (.body | contains(\"<!-- renvoi-capitaine -->\"))) | 1"); then
    printf '%s\n' "$lus" | grep -c . || true
  else
    echo "renvois de #$1 : commentaires illisibles, compte 0" >&2
    echo 0
  fi
}
# Plafond de renvois (`plafonds.renvoisParPR` de .claude/chaine.json : l'arbre de travail, sinon
# origin/develop). Sans contrat ou sans clé : 3. Contrat mal formé : 3 aussi, dit sur la sortie d'erreur
# (la file du capitaine ne tombe jamais pour un contrat).
plafond_renvois() {
  local v contrat
  contrat=$(cat .claude/chaine.json 2>/dev/null || git show origin/develop:.claude/chaine.json 2>/dev/null || echo '{}')
  if v=$(jq -er '.plafonds.renvoisParPR // 3' <<<"$contrat" 2>/dev/null) && [[ "$v" =~ ^[1-9][0-9]*$ ]]; then
    echo "$v"
  else
    echo "plafond de renvois : .claude/chaine.json illisible ou plafonds.renvoisParPR mal formé, valeur par défaut 3" >&2
    echo 3
  fi
}
# retirer l'index `.NN` d'un identifiant déjà lu et chercher un fichier par son identifiant littéral.
IDENTIFIANT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/identifiant.mjs"
identifiant() { node "$IDENTIFIANT" "$@"; }

# Index générés : liste unique `scripts/docs/index-generes.json` ({ chemin, commande }), lue dans le
# worktree, sinon sur origin/develop (branche partie avant son arrivée). `*` = un segment.
index_json() {
  cat scripts/docs/index-generes.json 2>/dev/null ||
    git show origin/develop:scripts/docs/index-generes.json 2>/dev/null || echo '{"index":[]}'
}
index_generes() { index_json | jq -r '.index[] | if type == "string" then . else .chemin end'; }
# Commandes de régénération, dédoublonnées, dans l'ordre de la liste.
index_commandes() { index_json | jq -r '.index[] | objects | .commande // empty' | awk '!v[$0]++'; }
# Contrôles (`verification`, facultatifs), dédoublonnés, dans l'ordre de la liste.
index_verifications() { index_json | jq -r '.index[] | objects | .verification // empty' | awk '!v[$0]++'; }
# Régénère chaque index par sa commande, joue ensuite les contrôles (une régénération peut en
# nourrir une autre), puis indexe ce qui a changé. Échec = sortie non nulle ; la sortie d'une
# commande ou d'un contrôle en échec part sur stderr, préfixée de sa commande (cas vécu : base
# éteinte, `db:types` échouait sans un mot).
regenerer_index() {
  local c motif
  # Avant toute commande : un index (ou l'un de ses dossiers) en lien symbolique ferait écrire la commande à
  # travers lui, hors du dépôt ou dans un autre fichier.
  if ! motif=$(liens_sur_index); then
    printf '%s\n' "$motif" >&2
    return 1
  fi
  while IFS= read -r c; do
    [ -n "$c" ] || continue
    jouer_ou_dire "$c" || return 1
  done < <(index_commandes)
  while IFS= read -r c; do
    [ -n "$c" ] || continue
    jouer_ou_dire "$c" || return 1
  done < <(index_verifications)
  ajouter_index
}
# Joue une commande ; en échec, sa sortie part sur stderr, chaque ligne préfixée de la commande.
jouer_ou_dire() {
  local l sortie
  if ! sortie=$(sh -c "$1" 2>&1); then
    while IFS= read -r l; do printf '[%s] %s\n' "$1" "$l" >&2; done <<<"$sortie"
    return 1
  fi
}
# Pousse `<refspec>` sous les hooks git, jamais en les sautant. `<branche>` est la branche distante
# visée, `<avant>` son sommet lu avant le push (vide pour une branche à créer). Sorties : 0 poussé ;
# 5 la branche a bougé (ou le distant ne répond pas) ; 3 refusé par le hook pre-push (ou le distant),
# sa sortie sur stderr, chaque ligne préfixée de la commande.
pousser() {
  local refspec=$1 branche=$2 avant=${3:-} apres
  jouer_ou_dire "git push -q origin $(printf '%q' "$refspec")" && return 0
  apres=$(git ls-remote origin "refs/heads/$branche" 2>/dev/null) || return 5
  apres=${apres%%[[:space:]]*}
  [ "$apres" = "$avant" ] || return 5
  echo "push refusé par le hook pre-push (ou le distant) : sortie ci-dessus ; corriger, jamais en sautant le hook" >&2
  return 3
}
# Après un `git merge` ou un `git commit` refusé (hook, fichier non suivi écrasé) : rend l'arbre comme
# avant la fusion — `git merge --abort` si elle est en cours, sinon `git reset -q --hard`.
annuler_fusion() {
  if git rev-parse -q --verify MERGE_HEAD >/dev/null; then git merge --abort; else git reset -q --hard; fi
}
# Les mêmes en expression régulière pour `grep -E` (un chemin par ligne).
index_generes_regex() {
  index_generes | jq -Rrs 'split("\n") | map(select(. != "") | gsub("\\."; "\\.") | gsub("\\*"; "[^/]+"))
    | "^(" + join("|") + ")$"'
}
# Règle d'ascendance (skill `fusionner`, « La règle d'ascendance ») : `<testé>` a-t-il été testé sur l'état de `<cible>` ?
# Une seule fonction pour passer.sh (vers develop) et sujet.sh (vers un sujet) : deux copies de la règle avaient
# divergé, et des PR en retard sur leur cible sont entrées sans que leur combinaison avec elle soit jamais testée
# (`fedora`, 2026-11-18). Aucune exception pour la documentation : une PR en retard est mise à jour et retestée.
# Ligne 1, le verdict :
#   à-jour         <cible> est ancêtre de <testé> : la fusion porte l'arbre testé ;
#   retard         sinon, et `git merge-tree --write-tree` (git ≥ 2.38) fusionne sans conflit ;
#   conflit-index  conflit limité aux index générés déclarés dans `scripts/docs/index-generes.json` de <cible>
#                  (jamais l'arbre de travail : la liste de la PR ne décide pas) ;
#   conflit        tout autre conflit.
# Pour un conflit, puis les fichiers en conflit, un par ligne. Sortie 0 avec un verdict ; 1 si elle ne peut pas
# conclure (réf absente, git ou liste en échec), motif sur la sortie d'erreur : jamais un `à-jour` par défaut.
ascendance() {
  local teste=${1:-} cible=${2:-} rc sortie fichiers liste regex hors
  if ! git rev-parse -q --verify "$teste^{commit}" >/dev/null 2>&1 || ! git rev-parse -q --verify "$cible^{commit}" >/dev/null 2>&1; then
    echo "ascendance : « $teste » ou « $cible » introuvable" >&2
    return 1
  fi
  git merge-base --is-ancestor "$cible" "$teste" && rc=0 || rc=$?
  case $rc in
    0) echo à-jour; return 0 ;;
    1) ;;
    *) echo "ascendance : git merge-base --is-ancestor en échec ($rc)" >&2; return 1 ;;
  esac
  sortie=$(git -c core.quotePath=false merge-tree --write-tree --name-only --no-messages "$teste" "$cible" 2>&1) && rc=0 || rc=$?
  case $rc in
    0) echo retard; return 0 ;;
    1) ;;
    *) printf 'ascendance : git merge-tree --write-tree en échec (git ≥ 2.38 requis) : %s\n' "$sortie" >&2; return 1 ;;
  esac
  fichiers=$(sed -n '2,$p' <<<"$sortie" | sed '/^$/d' | sort -u)
  [ -n "$fichiers" ] || { echo "ascendance : conflit sans fichier en conflit, illisible" >&2; return 1; }
  if git cat-file -e "$cible:scripts/docs/index-generes.json" 2>/dev/null; then
    liste=$(git show "$cible:scripts/docs/index-generes.json") || { echo "ascendance : liste des index générés de $cible illisible" >&2; return 1; }
  else
    liste='{"index":[]}'
  fi
  regex=$(jq -r '.index[] | if type == "string" then . else .chemin end' <<<"$liste" 2>/dev/null |
    jq -Rrs 'split("\n") | map(select(. != "") | gsub("\\."; "\\.") | gsub("\\*"; "[^/]+")) | "^(" + join("|") + ")$"') &&
    [ -n "$regex" ] || { echo "ascendance : liste des index générés de $cible illisible" >&2; return 1; }
  hors=$(grep -Ev "$regex" <<<"$fichiers" || true)
  if [ -z "$hors" ]; then echo conflit-index; else echo conflit; fi
  printf '%s\n' "$fichiers"
}

# Ceux qui ont une `commande`, de même : régénérés, donc écrasés à chaque mise à jour. Un index sans
# commande (chaîne nue de la liste) n'est jamais régénéré : `sujet.sh` (PR de mise à jour) et `passer.sh`
# (livraison intermédiaire) ne le dispensent pas sur sa seule place dans la liste.
index_regeneres_regex() {
  index_json | jq -r '.index[] | objects | select((.commande // "") != "") | .chemin' |
    jq -Rrs 'split("\n") | map(select(. != "") | gsub("\\."; "\\.") | gsub("\\*"; "[^/]+")) | "^(" + join("|") + ")$"'
}
# Ceux qui ont une `commande` et sont déclarés par motif (`*`) : leur régénération réécrit les fichiers qu'elle
# produit, sans retirer un fichier en trop sous le motif ni récrire un ancien. `passer.sh` (livraison
# intermédiaire) ne les dispense que sur un contenu déjà connu.
index_regeneres_motifs_regex() {
  index_json | jq -r '.index[] | objects | select((.commande // "") != "" and (.chemin | contains("*"))) | .chemin' |
    jq -Rrs 'split("\n") | map(select(. != "") | gsub("\\."; "\\.") | gsub("\\*"; "[^/]+")) | "^(" + join("|") + ")$"'
}
# Les dossiers d'un index généré (`docs/adr` pour `docs/adr/README.md`, motif compris), en expression régulière.
index_dossiers_regex() {
  index_generes | jq -Rrs 'split("\n") | map(select(. != "") | split("/") | . as $s | range(1; length) | $s[:.] | join("/"))
    | map(gsub("\\."; "\\.") | gsub("\\*"; "[^/]+")) | "^(" + join("|") + ")$"'
}
# Liens symboliques sur un index généré, ou sur l'un de ses dossiers, dans l'arbre de `<commit>` (sans argument :
# l'index git du worktree) ; avec `<base>`, ceux seulement que `<commit>` ajoute ou change par rapport à elle (un
# lien déjà dans develop ne fait pas renvoyer toutes les PR : `regenerer_index` l'arrête). La régénération
# écrirait à travers eux : hors du dépôt (lien absolu, ou relatif qui en sort) ou dans un autre fichier du dépôt
# (worktree sale). Sortie 0 aucun ; 1 sinon, motif sur la sortie standard. Liste illisible (git, jq) : 1, jamais
# une garde ouverte. Sans casse : sur un système de fichiers insensible à la casse, `Docs` est `docs`.
liens_sur_index() {
  local entrees deja='' liens generes dossiers l
  if [ -n "${1:-}" ]; then
    entrees=$(git -c core.quotePath=false ls-tree -r --full-tree "$1") || { echo "arbre de $1 illisible : liens symboliques non vérifiés"; return 1; }
  else
    entrees=$(git -c core.quotePath=false ls-files -s) || { echo "index git illisible : liens symboliques non vérifiés"; return 1; }
  fi
  if [ -n "${2:-}" ]; then
    deja=$(git -c core.quotePath=false ls-tree -r --full-tree "$2" | awk -F '\t' '$1 ~ /^120000 /') || { echo "arbre de $2 illisible : liens symboliques non vérifiés"; return 1; }
  fi
  liens=$(comm -23 <(printf '%s\n' "$entrees" | awk -F '\t' '$1 ~ /^120000 /' | sort) <(printf '%s\n' "$deja" | sort) | cut -f2-)
  [ -n "$liens" ] || return 0
  generes=$(index_generes_regex) && dossiers=$(index_dossiers_regex) && [ -n "$generes" ] && [ -n "$dossiers" ] ||
    { echo "liste des index générés illisible : liens symboliques non vérifiés"; return 1; }
  while IFS= read -r l; do
    if grep -qiE "$generes|$dossiers" <<<"$l"; then
      echo "lien symbolique sur un index généré ou son dossier : $l ; la régénération écrirait à travers lui (hors du dépôt ou dans un autre fichier) : le remplacer par un fichier ordinaire, jamais un lien"
      return 1
    fi
  done <<<"$liens"
}
# Indexe les index générés modifiés, ajoutés ou supprimés (un motif sans fichier n'est pas une erreur).
ajouter_index() {
  local f
  index_generes | tr '\n' '\0' | xargs -0 git ls-files -m -o -d --exclude-standard -- |
    sort -u | while IFS= read -r f; do git add -A -- "$f"; done
}

# Chaîne encodée pour un segment d'URL (nom de label, nom de branche).
uri() { jq -rn --arg s "$1" '$s | @uri'; }

# PR en JSON REST (`state` open/closed, `draft`, `labels[].name`, `base.ref`, `head.ref`,
# `head.sha`, `title`).
pr_json() { gh api "$DEPOT/pulls/$1"; }

# Tête de PR gardée : `develop`, `main`, ou la branche par défaut du dépôt (2e argument, lu dans le
# JSON de la PR : `base.repo.default_branch`). Le capitaine pousse la mise à jour d'une PR sur sa tête :
# jamais sur celles-ci (« jamais de push sur la branche par défaut »). La livraison d'un sujet
# (`sujet/<nom>` vers develop) n'en est pas une : la mettre à jour avec develop est le chemin prévu.
tete_gardee() { [ "$1" = develop ] || [ "$1" = main ] || { [ -n "${2:-}" ] && [ "$1" = "$2" ]; }; }

# Sommet (dernier commit) de la branche d'une PR.
pr_sommet() { gh api "$DEPOT/pulls/$1" --jq .head.sha; }

# Checks d'un commit, une ligne « nom<TAB>état » par check, états au format de
# `statusCheckRollup` : conclusion en majuscules (SUCCESS, FAILURE, SKIPPED…) pour un check
# terminé, sinon son statut (QUEUED, IN_PROGRESS) ; les statuts de commit (SUCCESS, FAILURE,
# ERROR, PENDING) s'y ajoutent. Un check par nom : le plus récent (id le plus grand). Deux
# exécutions d'un même workflow sur un commit (la première annulée par la concurrence) en
# laissent deux du même nom, et l'API ne remplace que le relancement d'un même run. Cas vécu :
# #700, checks annulés lus à la place de leurs successeurs verts.
checks_commit() {
  gh api --paginate "$DEPOT/commits/$1/check-runs?per_page=100" | jq -rs '[.[].check_runs[]]
    | group_by(.name) | map(max_by(.id))[]
    | "\(.name)\t\(if .status == "completed" then (.conclusion // "" | ascii_upcase) else (.status | ascii_upcase) end)"'
  gh api "$DEPOT/commits/$1/status" --jq '.statuses[] | "\(.context)\t\(.state | ascii_upcase)"'
}

# Checks exigés sur develop, en tableau JSON. D'abord les rulesets (`rules/branches/develop` :
# ce que GitHub recommande, et ce que pose admin.md), sinon l'ancienne protection de branche,
# qui répond 404 « Branch not protected » quand seul un ruleset protège la branche.
checks_exiges() {
  local regles
  regles=$(gh api "$DEPOT/rules/branches/develop" --jq \
    '[.[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context] | unique' 2>/dev/null || echo '[]')
  if [ "$(jq 'length' <<<"$regles")" -gt 0 ]; then printf '%s\n' "$regles"; return; fi
  gh api "$DEPOT/branches/develop/protection/required_status_checks" --jq '.contexts' 2>/dev/null || echo '[]'
}

# Attend la CI exigée de `<sommet>`, la tête de la PR `<pr>` : le sommet sur la PR (5 min au plus), un check exigé
# apparu (5 min), puis le verdict de tous (60 min). Liste des exigés lue dans la protection de develop : les checks du
# sommet ne montrent que ceux déjà créés, et un check de synthèse (qui attend toute une matrice) n'apparaît qu'en fin
# de matrice. Partagée par passer.sh et sujet.sh. Retours : 0 vert ; 1 rouge, la liste sur la sortie standard, une
# ligne « ␣␣nom : ÉTAT » par check ; 2 aucun check exigé apparu au bout de 5 min (CI non déclenchée) ; 3 encore en
# attente après 60 min.
attendre_ci() {
  local n=$1 sommet=$2 requis etats rouges attente nom c vu
  for _ in $(seq 1 60); do
    [ "$(pr_sommet "$n")" = "$sommet" ] && break
    sleep 5
  done
  requis=$(checks_exiges | jq -r '.[]')
  vu=0
  for _ in $(seq 1 30); do
    # Pas de `grep -q` : sous pipefail, `gh` tué par SIGPIPE ferait échouer le test.
    [ "$(checks_commit "$sommet" | awk -F '\t' -v r="$requis" 'BEGIN { n = split(r, t, "\n"); for (i = 1; i <= n; i++) if (t[i] != "") e[t[i]] = 1 } ($1 in e) { v = 1 } END { print v + 0 }')" = 1 ] && { vu=1; break; }
    sleep 10
  done
  [ "$vu" = 1 ] || return 2
  for _ in $(seq 1 120); do # 60 min au plus
    etats=$(checks_commit "$sommet")
    attente=0
    rouges=''
    while IFS= read -r nom; do
      c=$(printf '%s\n' "$etats" | awk -F '\t' -v n="$nom" '$1 == n { c = $2 } END { print c }')
      case "$c" in
        SUCCESS | SKIPPED | NEUTRAL) ;;
        FAILURE | CANCELLED | TIMED_OUT | ACTION_REQUIRED | STARTUP_FAILURE | ERROR) rouges="$rouges  $nom : $c"$'\n' ;;
        *) attente=1 ;;
      esac
    done <<<"$requis"
    if [ -n "$rouges" ]; then printf '%s' "$rouges"; return 1; fi
    [ "$attente" = 1 ] || return 0
    sleep 30
  done
  return 3
}

# Arbre du squash ≠ arbre testé, vu après une fusion acceptée par GitHub (passer.sh, sujet.sh) : le code entré n'est
# pas celui que la CI a jugé. Une fusion ne se défait pas d'elle-même : le script qui a fusionné commente la PR (il a
# les deux arbres), retire `à-fusionner`, écrit la ligne `ARBRE DIFFÉRENT`, et sort en 12 ; la boucle s'arrête, le
# capitaine le dit à son lanceur. Le commentaire manqué est dit, la sortie reste 12.
MARQUE_ARBRE='<!-- arbre-different-capitaine -->'
signaler_arbre_different() { # <pr> <sommet testé> <squash> (squash vide : introuvable)
  local n=$1 teste=$2 squash=${3:-} a_teste a_squash ecart corps
  a_teste=$(git rev-parse "$teste^{tree}" 2>/dev/null) || a_teste='?'
  if [ -n "$squash" ]; then
    a_squash=$(git rev-parse "$squash^{tree}" 2>/dev/null) || a_squash='?'
    ecart=$(git -c core.quotePath=false diff --no-renames --name-only "$teste" "$squash" 2>/dev/null | sed 's/^/- `/; s/$/`/') ||
      ecart='(diff illisible)'
  else
    squash='introuvable'
    a_squash='?'
    ecart='(squash introuvable dans la branche cible)'
  fi
  corps=$(printf '%s\nLe capitaine a fusionné cette PR, mais **arbre du squash ≠ arbre testé** : le code entré n'"'"'est pas celui que la CI a jugé.\n\n- squash : `%s` (arbre `%s`)\n- sommet testé : `%s` (arbre `%s`)\n\nFichiers qui diffèrent (`git diff --name-only %s %s`) :\n\n%s\n\nLa boucle du capitaine s'"'"'est arrêtée : une fusion ne se défait pas d'"'"'elle-même, un humain examine (`git diff %s %s`).\n\n---\n_Generated by [Claude Code](https://claude.ai/code)_' \
    "$MARQUE_ARBRE" "$squash" "$a_squash" "$teste" "$a_teste" "$teste" "$squash" "${ecart:-(aucun)}" "$teste" "$squash")
  commenter "$n" "$corps" || echo "#$n : commentaire « arbre du squash ≠ arbre testé » NON posé (gh refusé) : le poser à la main" >&2
  retirer_label "$n" à-fusionner
  echo "ARBRE DIFFÉRENT : #$n, squash $squash (arbre $a_squash) ≠ sommet testé $teste (arbre $a_teste) : arbre du squash ≠ arbre testé, la boucle s'arrête, un humain examine"
}

# Revue des propriétaires exigée sur `<base>` (« Require review from Code Owners », ADR « CODEOWNERS » du projet) :
# d'abord les rulesets (`rules/branches/<base>`, règle `pull_request` avec `require_code_owner_review`), sinon
# l'ancienne protection de branche. Illisible ou absente : non (sortie 1) — la fusion refusée par GitHub le
# rattrape (passer.sh, étape 6).
revue_proprietaires_exigee() {
  local b
  b=$(uri "$1")
  [ "$(gh api "$DEPOT/rules/branches/$b" --jq \
    'any(.[]; .type == "pull_request" and .parameters.require_code_owner_review == true)' 2>/dev/null)" = true ] && return 0
  [ "$(gh api "$DEPOT/branches/$b/protection/required_pull_request_reviews" --jq '.require_code_owner_reviews == true' 2>/dev/null)" = true ]
}
# Propriétaires du CODEOWNERS de `<base>`, lu sur `origin/<base>` dans l'ordre de GitHub (`.github/CODEOWNERS`, puis
# `CODEOWNERS`, puis `docs/CODEOWNERS`) : un par ligne, en minuscules, `u:<login>` pour `@login`, `t:<slug>` pour
# `@org/slug`. Commentaires et motifs ignorés. Fichier illisible : aucun propriétaire connu (rien ne fait attendre ;
# le refus de fusion de GitHub le rattrape, passer.sh, étape 6).
proprietaires_de() {
  local f
  for f in .github/CODEOWNERS CODEOWNERS docs/CODEOWNERS; do
    git cat-file -e "origin/$1:$f" 2>/dev/null || continue
    git show "origin/$1:$f" | sed 's/#.*//' | awk '{ for (i = 2; i <= NF; i++) print $i }' | tr 'A-Z' 'a-z' |
      sed -n 's#^@[^/]*/\(..*\)$#t:\1#p; s#^@\([^/][^/]*\)$#u:\1#p'
    return 0
  done
}
# Relecteurs demandés d'une PR (son JSON REST, d'un `pulls/<n>` ou d'une ligne de la liste `pulls`), sous la forme
# de `proprietaires_de`, séparés par des virgules (`-` sans aucun) : GitHub y met d'office les propriétaires
# CODEOWNERS des fichiers touchés, et les retire quand ils approuvent.
demandes_jq='([.requested_reviewers[]?.login | "u:" + ascii_downcase] + [.requested_teams[]?.slug | "t:" + ascii_downcase]
  | if length == 0 then "-" else join(",") end)'
# Un des relecteurs demandés (`<demandes>`, forme de `demandes_jq`) est un propriétaire (`<propriétaires>`, une ligne
# chacun) : seuls comptent les propriétaires du CODEOWNERS ; un relecteur demandé à la main n'en est pas un.
proprietaire_demande() {
  [ "$1" != - ] && [ -n "$2" ] && grep -qxFf <(printf '%s\n' "$2") <(tr ',' '\n' <<<"$1")
}
# Une PR attend l'approbation d'un propriétaire : sa base exige la revue des propriétaires et un propriétaire du
# CODEOWNERS de la base reste demandé. Ni rouge ni bloquée : le capitaine la saute sans la renvoyer et la reprend
# au tour suivant. Il ne demande ni ne donne l'approbation, et ne contourne jamais la règle.
attend_proprietaire() { # <json de la PR>
  local base demandes
  base=$(jq -r .base.ref <<<"$1")
  demandes=$(jq -r "$demandes_jq" <<<"$1")
  [ "$demandes" != - ] || return 1
  proprietaire_demande "$demandes" "$(proprietaires_de "$base")" && revue_proprietaires_exigee "$base"
}
# Message d'un refus de fusion de GitHub qui tient à la revue (approbation d'un propriétaire, revue exigée).
refus_pour_revue() { grep -qiE 'code owner|approving review|review is required|reviews? required' <<<"$1"; }
# Attente d'un humain (plafond des mises à jour sans approbation) : après un refus de fusion faute de revue, le
# capitaine commente la PR avec cette marque, invisible, et ne la met plus à jour tant qu'aucune revue `APPROVED`
# n'est plus récente que le dernier commentaire marqué : au plus une CI par nouvelle approbation. Seuls comptent les
# commentaires du compte du capitaine (comme MARQUE_RENVOI). Le compte des renvois n'est pas touché.
MARQUE_ATTENTE='<!-- attente-revue-capitaine -->'
TEXTE_ATTENTE="GitHub a refusé la fusion : l'approbation d'un propriétaire (CODEOWNERS) manque. Le capitaine ne met plus cette PR à jour avant une nouvelle approbation."
# Sortie 0 : la PR attend un humain. Compte du capitaine illisible : 0 aussi (fermé, comme `renvois_de`), dit sur la
# sortie d'erreur sauf si file.sh l'a déjà dit (`LOGIN_CAPITAINE=?`). Commentaires illisibles : 1 (comme les renvois,
# compte 0), dit sur la sortie d'erreur. Revues lues seulement si la marque existe ; illisibles : 0 (fermé).
attend_humain() {
  local login=${LOGIN_CAPITAINE:-} dernier
  [ -n "$login" ] || login=$(gh api user --jq .login 2>/dev/null) || login=''
  if ! login_valide "$login"; then
    [ -n "${LOGIN_CAPITAINE:-}" ] ||
      echo "attente de #$1 : compte du capitaine illisible (gh api user) : la PR attend un humain" >&2
    return 0
  fi
  if ! dernier=$(gh api --paginate "$DEPOT/issues/$1/comments?per_page=100" --jq ".[] | select(.user.login == \"$login\" and (.body | contains(\"$MARQUE_ATTENTE\"))) | .created_at" 2>/dev/null); then
    echo "attente de #$1 : commentaires illisibles, lue sans attente" >&2
    return 1
  fi
  dernier=$(printf '%s\n' "$dernier" | grep . | sort | tail -n 1)
  [ -n "$dernier" ] || return 1
  local approuvee
  approuvee=$(gh api --paginate "$DEPOT/pulls/$1/reviews?per_page=100" --jq ".[] | select(.state == \"APPROVED\" and (.submitted_at // \"\") > \"$dernier\") | 1" 2>/dev/null) || return 0
  [ -z "$approuvee" ]
}
MOTIF_PROPRIETAIRE="attend l'approbation d'un propriétaire (CODEOWNERS) : sautée sans renvoi, reprise au tour suivant"

poser_label() { gh api -X POST "$DEPOT/issues/$1/labels" -f "labels[]=$2" >/dev/null; }
# Un label déjà absent n'est pas une erreur (404).
retirer_label() { gh api -X DELETE "$DEPOT/issues/$1/labels/$(uri "$2")" >/dev/null 2>&1 || true; }
commenter() { gh api -X POST "$DEPOT/issues/$1/comments" -f body="$2" >/dev/null; }
