#!/usr/bin/env bash
# =============================================================================
# Fusion par lots (skill /fusionner, « Fusion par lots ») : la partie qui n'écrit rien sur GitHub. La boucle ne
# l'appelle pas encore : la fusion du lot attend deux décisions du produit (la taille, la protection `strict` de
# develop ; conception : « Fusion par lots » du skill). Ces trois commandes se jouent à la main, depuis le worktree du
# capitaine, et ne changent ni le worktree, ni une branche, ni une PR.
#
#   lot.sh composer --taille <N> [--prs <n>,<n>…]
#       Prend, dans l'ordre de la file (`file.sh` : livraisons, `prio:haute`, puis numéro), jusqu'à N PR « prête » vers
#       develop (CI exigée verte sur leur sommet) et les empile sur origin/develop par des fusions successives, en objets
#       git locaux seulement (`git merge-tree --write-tree`, puis `git commit-tree` d'un commit à deux parents : le lot
#       jusque-là et le sommet de la PR). Une PR reste hors du lot, la raison sur la sortie d'erreur
#       (`[#<n>] hors du lot : <raison>`), si elle est : de sujet ou une livraison (tête `sujet/`, `livraison/`), de
#       fourche, en brouillon, sans `à-fusionner` ou avec `fusion-bloquée`, en régime 7 ou de régime illisible (la
#       section de revue du régime 7 ne se juge qu'au passage), refusée par `passer.sh --eligibilite` (verdict, gardes des
#       sensibles, migrations, titre), sur un chemin sensible du contrat de develop (`chemins-sensibles.mjs` : elle passe
#       seule, avec sa revue de sécurité), sur le dossier `migrations` du contrat (l'ordre des migrations se juge sur
#       develop, une à la fois), en passage chez un autre capitaine, de sommet changé pendant la composition, ou en
#       conflit avec le lot déjà empilé. Aucun index n'est régénéré : le lot est la somme exacte de ses PR, ce qu'un
#       squash par PR reproduit ; un index périmé par la somme rougit la CI du lot, qui se coupe en deux.
#       `--prs` : ces PR, dans cet ordre, aux mêmes contrôles (une moitié d'un lot rouge).
#       Sortie 0 : le manifeste sur la sortie standard, une ligne `base <sha d'origin/develop>`, puis une ligne
#       `pr <n> <sommet> <commit du lot après elle> <arbre de ce commit>` par PR, dans l'ordre ; le commit de la dernière
#       est le sommet du lot, celui que la CI teste. Sortie 1 : moins de deux PR empilables (rien sur la sortie
#       standard, la boucle les passe une à une). 5 : GitHub illisible. 6 : git, origin ou le contrat illisible. 64 : usage.
#   lot.sh verifier <manifeste>
#       Relit chaque PR du manifeste : ouverte, ni brouillon, base develop, pas de fourche, `à-fusionner`, ni
#       `fusion-bloquée`, sommet inchangé ;
#       et origin/develop égal à la base. Une ligne `[#<n>] <écart>` ou `[base] <écart>` par écart. Sortie 0 sans écart,
#       1 avec, 5 GitHub illisible, 6 git illisible, 64 manifeste mal formé. Se joue juste avant toute fusion du lot :
#       une PR dont le sommet a changé depuis l'empilement n'est jamais fusionnée.
#   lot.sh moities <manifeste>
#       Coupe un lot rouge en deux, dans l'ordre : deux lignes, les numéros de chaque moitié séparés par des virgules (la
#       première moitié a la PR de plus quand le lot est impair). Chaque moitié se recompose (`composer --prs`) et se
#       reteste ; une moitié d'une seule PR passe une à une (`passer.sh`). Sortie 64 : manifeste mal formé ou d'une PR.
#   lot.sh strict
#       Écrit `strict` si develop exige une PR à jour (ruleset `strict_required_status_checks_policy`, ou l'ancienne
#       protection `strict`), sinon `non-strict`. Sortie 5 : GitHub illisible. L'ancienne protection qui répond 404 (absente,
#       ou illisible faute du droit admin) ne compte pas, comme dans `checks_exiges` : `non-strict` ne prouve donc pas que
#       GitHub accepte des fusions en retard, et la fusion d'un lot rejoue de toute façon la règle d'ascendance. Sous `strict`, la fusion d'une PR du lot
#       après la première est refusée par GitHub (« not up to date ») : c'est la décision attendue du produit.
#
# `CAPITAINE_ID` exigé (passer.sh --eligibilite le lit), comme pour la boucle. Dépendances : git, jq, node, gh.
# Usage : bash scripts/chaine/lot.sh composer --taille 4 > <manifeste>
# =============================================================================
set -euo pipefail
ici=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
. "$ici/github.sh"

# `chemins-sensibles.mjs` : à côté dans un projet (scripts/chaine/), dans le skill revue-adversariale dans le plugin, comme
# `garde_des_sensibles` (github.sh). Introuvable : chaque PR reste hors du lot (une garde de sécurité échoue fermée).
CHEMINS_SENSIBLES="$ici/chemins-sensibles.mjs"
[ -f "$CHEMINS_SENSIBLES" ] || CHEMINS_SENSIBLES="$ici/../../revue-adversariale/scripts/chemins-sensibles.mjs"

usage() { echo "usage : lot.sh composer --taille <N> [--prs <n>,<n>…] | verifier <manifeste> | moities <manifeste> | strict" >&2; exit 64; }
dire() { printf '%s\n' "$*" >&2; }

# Manifeste lu sur un fichier : `base <sha>` en tête, puis des lignes `pr <n> <sha> <sha> <sha>`. Mal formé : 64.
lire_manifeste() {
  local f=${1:-}
  [ -f "$f" ] || { dire "manifeste introuvable : ${f:-(aucun)}"; exit 64; }
  awk 'NR == 1 { if ($1 != "base" || NF != 2 || $2 !~ /^[0-9a-f]{40}$/) exit 1; next }
       $1 != "pr" || NF != 5 || $2 !~ /^[0-9]+$/ || $3 !~ /^[0-9a-f]{40}$/ || $4 !~ /^[0-9a-f]{40}$/ || $5 !~ /^[0-9a-f]{40}$/ { exit 1 }
       END { if (NR < 2) exit 1 }' "$f" || { dire "manifeste mal formé : $f"; exit 64; }
}

# Marque de passage vivante d'un autre capitaine (`verrou_d_un_autre` de boucle.sh, même filtre, rien d'écrit) :
# « <capitaine> <date> », rien, ou « illisible » (dans le doute, elle tient).
passage_d_un_autre() {
  local lus
  lus=$(lire_github "$DEPOT/issues/$1/comments?per_page=100" --paginate) || return 5
  jq -rs --arg moi "$CAPITAINE_ID" --argjson mien 9007199254740991 --arg cree "$(jq -nr --argjson e "$(epoch_passage)" '$e | todate')" \
    "$FILTRE_PASSAGE | .tenu // \"\"" <<<"$lus" 2>/dev/null || echo illisible
}

composer() {
  local taille='' prs='' liste n etat pr raison sommet tete creee regime rc fichiers sensibles migrations base courant arbre
  local -a candidats=()
  local manifeste='' compte=0
  while [ $# -gt 0 ]; do
    case $1 in
      --taille) taille=${2:-}; shift ;;
      --prs) prs=${2:-}; shift ;;
      *) usage ;;
    esac
    shift
  done
  # Pas de taille par défaut : décision du produit (« Fusion par lots », questions ouvertes).
  [[ "$taille" =~ ^[1-9][0-9]?$ ]] || { dire "--taille <N> requis (1 à 99) : la taille par défaut est une décision du produit"; usage; }
  [ -z "$prs" ] || [[ "$prs" =~ ^[0-9]+(,[0-9]+)*$ ]] || usage
  [[ "${CAPITAINE_ID:-}" =~ ^[A-Za-z0-9_-]{1,100}$ ]] || { dire "CAPITAINE_ID requis (l'id de la session du capitaine)"; exit 64; }
  cd "$(git rev-parse --show-toplevel)"
  git fetch -q origin "+refs/heads/develop:refs/remotes/origin/develop" 2>/dev/null || { dire "git fetch origin develop impossible"; exit 6; }
  base=$(git rev-parse --verify -q origin/develop) || { dire "origin/develop introuvable"; exit 6; }
  # Le dossier des migrations, lu sur develop. Sans contrat : aucun. Un contrat qui ne se lit pas arrête la composition
  # (sortie 6) : la garde des migrations n'échoue jamais ouverte.
  migrations=''
  if git cat-file -e origin/develop:.claude/chaine.json 2>/dev/null; then
    migrations=$(git show origin/develop:.claude/chaine.json | jq -er 'if type != "object" then error("racine")
      elif has("migrations") | not then "" elif (.migrations | type) == "string" then .migrations else error("migrations") end' 2>/dev/null) ||
      { dire "contrat illisible (.claude/chaine.json d'origin/develop, clé migrations) : aucun lot"; exit 6; }
  fi
  liste=$(bash "$ici/file.sh" 2>/dev/null </dev/null) && rc=0 || rc=$?
  case $rc in 0) ;; 5) dire "file illisible (file.sh, sortie 5)"; exit 5 ;; *) dire "file.sh en échec (sortie $rc)"; exit 6 ;; esac
  if [ -n "$prs" ]; then
    IFS=, read -r -a candidats <<<"$prs"
  else
    while IFS="$(printf '\t')" read -r n etat _; do
      [ "$etat" != prête ] || candidats+=("$n")
    done <<<"$liste"
  fi
  courant=$base
  for n in ${candidats[@]+"${candidats[@]}"}; do
    [ "$compte" -lt "$taille" ] || break
    etat=$(awk -F '\t' -v n="$n" '$1 == n { print $2 }' <<<"$liste")
    [ "$etat" = prête ] || { dire "[#$n] hors du lot : pas « prête » dans la file (${etat:-absente})"; continue; }
    pr=$(pr_json "$n") || exit 5
    raison=$(jq -r '[.labels[].name] as $l
      | if .state != "open" then "non ouverte" elif .draft != false then "en brouillon"
        elif .base.ref != "develop" then "base \(.base.ref), pas develop"
        elif (.head.ref | startswith("sujet/")) or (.head.ref | startswith("livraison/")) then "livraison de sujet, passée seule"
        elif (.head.repo.full_name // "") != (.base.repo.full_name // "") then "PR de fourche"
        elif ($l | index("à-fusionner")) == null then "sans le label à-fusionner"
        elif ($l | index("fusion-bloquée")) != null then "label fusion-bloquée"
        else "" end' <<<"$pr")
    [ -z "$raison" ] || { dire "[#$n] hors du lot : $raison"; continue; }
    sommet=$(jq -r '.head.sha' <<<"$pr")
    tete=$(jq -r '.head.ref' <<<"$pr")
    creee=$(jq -r '.created_at // ""' <<<"$pr")
    regime=$(regime_de_la_pr develop "$creee" 2>/dev/null) || regime=illisible
    [ "$regime" = 8 ] || { dire "[#$n] hors du lot : régime $regime, passée une à une"; continue; }
    git fetch -q origin "+refs/heads/$tete:refs/remotes/origin/$tete" 2>/dev/null || { dire "git fetch origin $tete impossible"; exit 6; }
    [ "$(git rev-parse -q --verify "origin/$tete")" = "$sommet" ] ||
      { dire "[#$n] hors du lot : sommet changé pendant la composition"; continue; }
    fichiers=$(git -c core.quotePath=false diff --no-renames --name-only "$(git merge-base origin/develop "$sommet")" "$sommet") ||
      { dire "[#$n] diff illisible"; exit 6; }
    [ -n "$fichiers" ] || { dire "[#$n] hors du lot : diff vide"; continue; }
    if [ -n "$migrations" ] && grep -qF -- "${migrations%/}/" <<<"$fichiers"; then
      dire "[#$n] hors du lot : touche les migrations (${migrations%/}/), passée une à une"
      continue
    fi
    sensibles=$(printf '%s\n' "$fichiers" | node "$CHEMINS_SENSIBLES" origin/develop 2>/dev/null) && rc=0 || rc=$?
    [ "$rc" = 0 ] || { dire "[#$n] hors du lot : chemins sensibles illisibles (sortie $rc), passée une à une"; continue; }
    [ -z "$sensibles" ] || { dire "[#$n] hors du lot : chemin sensible ($(cut -f1 <<<"$sensibles" | head -n 3 | paste -sd, -)), passée une à une"; continue; }
    # Les contrôles locaux d'abord, puis ceux qui lisent GitHub : l'éligibilité (le verdict), le verrou d'un autre.
    bash "$ici/passer.sh" --eligibilite "$n" >/dev/null 2>&1 </dev/null && rc=0 || rc=$?
    case $rc in
      0) ;;
      5) dire "[#$n] GitHub illisible à l'éligibilité"; exit 5 ;;
      *) dire "[#$n] hors du lot : éligibilité, sortie $rc (passer.sh --eligibilite $n pour le motif)"; continue ;;
    esac
    raison=$(passage_d_un_autre "$n") || exit 5
    [ -z "$raison" ] || { dire "[#$n] hors du lot : en passage chez un autre capitaine ($raison)"; continue; }
    # Toute la sortie, puis sa première ligne : `| head` tuerait git d'un SIGPIPE sur un conflit (sortie 141, pas 1).
    arbre=$(git merge-tree --write-tree --no-messages "$courant" "$sommet" 2>/dev/null) && rc=0 || rc=$?
    arbre=${arbre%%$'\n'*}
    case $rc in
      0) ;;
      1) dire "[#$n] hors du lot : en conflit avec le lot déjà empilé"; continue ;;
      *) dire "git merge-tree en échec (sortie $rc)"; exit 6 ;;
    esac
    courant=$(git commit-tree "$arbre" -p "$courant" -p "$sommet" -m "lot du capitaine : #$n") || { dire "git commit-tree en échec"; exit 6; }
    manifeste="${manifeste}pr $n $sommet $courant $arbre"$'\n'
    compte=$((compte + 1))
  done
  [ "$compte" -ge 2 ] || { dire "lot impossible : $compte PR empilable(s) sur 2 au moins, la file passe une à une"; exit 1; }
  printf 'base %s\n%s' "$base" "$manifeste"
}

verifier() {
  local f=${1:-} n sommet pr ecarts=0 raison base develop
  lire_manifeste "$f"
  cd "$(git rev-parse --show-toplevel)"
  base=$(awk 'NR == 1 { print $2 }' "$f")
  git fetch -q origin "+refs/heads/develop:refs/remotes/origin/develop" 2>/dev/null || { dire "git fetch origin develop impossible"; exit 6; }
  develop=$(git rev-parse --verify -q origin/develop) || { dire "origin/develop introuvable"; exit 6; }
  [ "$develop" = "$base" ] || { echo "[base] develop a bougé depuis la composition ($base → $develop) : lot à recomposer"; ecarts=1; }
  while read -r _ n sommet _ _; do
    pr=$(pr_json "$n") || exit 5
    raison=$(jq -r --arg s "$sommet" '[.labels[].name] as $l
      | if .state != "open" then "non ouverte" elif .draft != false then "en brouillon"
        elif .base.ref != "develop" then "base \(.base.ref), pas develop"
        elif (.head.repo.full_name // "") != (.base.repo.full_name // "") then "PR de fourche"
        elif ($l | index("à-fusionner")) == null then "sans le label à-fusionner"
        elif ($l | index("fusion-bloquée")) != null then "label fusion-bloquée"
        elif .head.sha != $s then "sommet changé depuis l'"'"'empilement (\($s[0:12]) → \(.head.sha[0:12]))" else "" end' <<<"$pr")
    [ -z "$raison" ] || { echo "[#$n] $raison"; ecarts=1; }
  done < <(tail -n +2 "$f")
  return "$ecarts"
}

moities() {
  local f=${1:-} numeros k
  lire_manifeste "$f"
  numeros=$(awk 'NR > 1 { print $2 }' "$f")
  k=$(wc -l <<<"$numeros" | tr -d ' ')
  [ "$k" -ge 2 ] || { dire "un lot d'une PR ne se coupe pas : passer.sh"; exit 64; }
  head -n $(((k + 1) / 2)) <<<"$numeros" | paste -sd, -
  tail -n $((k / 2)) <<<"$numeros" | paste -sd, -
}

strict() {
  local regles protection
  regles=$(lire_github "$DEPOT/rules/branches/develop") || exit 5
  protection=$(lire_github "$DEPOT/branches/develop/protection/required_status_checks" --absent null) || exit 5
  if jq -e 'type == "array" and any(.[]; .type == "required_status_checks" and (.parameters.strict_required_status_checks_policy == true))' >/dev/null 2>&1 <<<"$regles" ||
    jq -e 'type == "object" and .strict == true' >/dev/null 2>&1 <<<"$protection"; then
    echo strict
  else
    echo non-strict
  fi
}

commande=${1:-}
[ $# -eq 0 ] || shift
case $commande in
  composer) composer "$@" ;;
  verifier) [ $# -eq 1 ] || usage; verifier "$1" ;;
  moities) [ $# -eq 1 ] || usage; moities "$1" ;;
  strict) [ $# -eq 0 ] || usage; strict ;;
  *) usage ;;
esac
