#!/usr/bin/env bash
# =============================================================================
# « Même contenu propre » : le sommet d'un verdict (V) et le sommet jugé (T) d'une PR ne sont-ils séparés que par
# des mises à jour avec la cible et des commits d'index générés ? Un seul calcul, pour le capitaine et pour le
# Relecteur.
#
#   bash scripts/chaine/meme-contenu.sh <V> <T> <B>
#
#   <V>  sommet du verdict, sha de 40 caractères
#   <T>  sommet jugé, sha de 40 caractères
#   <B>  branche cible de la PR (`develop`, `sujet/<nom>`), lue dans `refs/remotes/origin/<B>` : qui appelle l'a
#        relue juste avant (`git fetch origin "+refs/heads/<B>:refs/remotes/origin/<B>"`) ; ce script ne lit pas
#        le réseau, ni aucun arbre de travail, et n'écrit rien dans le dépôt.
#
# De V à T, sur la ligne des premiers parents de T, chaque commit est :
#   - une mise à jour : une fusion à deux parents, dont le second est sur la ligne des premiers parents de
#     origin/<B> (il a été un jour le sommet de la cible) sans être un ancêtre du premier (elle apporte quelque
#     chose), et dont l'arbre est celui de la fusion calculée de ses deux parents (`git merge-tree --write-tree`,
#     fusion à trois voies nue, sans aucun attribut ; arbre pris même en conflit), aux index générés près ;
#   - ou un commit à un parent qui ne touche que des index générés.
# Les index générés sont ceux de `origin/<B>:scripts/docs/index-generes.json` (fichier absent : aucun). **Seul un
# index à `commande`, de chemin littéral, est dispensé** (son contenu se régénère), absent ou fichier ordinaire,
# jamais lien symbolique ni sous-module. Un index sans `commande`, ou déclaré par motif (`*`), se juge comme tout
# fichier, dans une fusion comme dans un commit à un parent : en écart, `différent`. Un chemin que git cite (il
# commence par un guillemet : caractère de contrôle, guillemet ou barre oblique inverse dans le nom) n'est jamais
# un index.
#
# Quatre règles de structure :
#   S1  tout calcul se fait dans un dépôt nu jetable, sous le dossier temporaire, qui emprunte les objets du dépôt
#       réel (`objects/info/alternates`) : ni sa configuration, ni celle de l'utilisateur ou du poste, ni ses
#       `info/attributes`, ses greffes ou ses `refs/replace`, ni le dossier courant, ni une variable `GIT_*` héritée,
#       ni aucun fichier de l'utilisateur (`HOME` et `XDG_CONFIG_HOME` y sont un dossier vide) n'y pèsent. Le dépôt réel ne dit que trois choses : où sont ses objets, le sha de la cible, s'il est
#       superficiel. Le dépôt propre ne se crée pas : `illisible` ;
#   S2  la fusion admise est celle que dit le premier tiret ci-dessus ;
#   S3  `même` se prouve : le nombre de commits de V à T, compté par git, est celui des commits examinés et
#       acceptés un à un. Toute commande en échec, toute lecture vide là où une ligne est attendue : `illisible`.
#       Aucun here-document, aucun fichier temporaire hors du dossier de S1 ;
#   S4  la fusion calculée ne lit aucun attribut (`--attr-source=<arbre vide>`, git ≥ 2.41) : une fusion faite
#       sous un pilote (`merge=union`, `merge=ours`) s'en écarte, donc `différent`.
#
# Sortie standard : une seule ligne, le verdict. Sortie d'erreur : une ligne, sa raison. Un argument refusé n'est
# jamais recopié. Sorties : 0 `même` · 20 `différent` · 21 `illisible` (usage, dépôt, réf, liste, dossier
# temporaire, git en échec ou lecture vide : jamais `même`) · 69 `illisible`, outil absent (git, jq, mktemp, rm) ou
# git plus ancien que 2.41. Seul 0 vaut `même` : tout autre code (signal, erreur de bash) se lit `illisible`.
# =============================================================================
# Sans `set -e` : le statut de chaque commande est lu, et sa suite écrite (`différent`, `illisible`, ou on continue).
set -uo pipefail
export LC_ALL=C

propre=''
menage() { case $propre in */meme-contenu.??????) rm -rf "$propre" ;; esac; }
trap menage EXIT
rendre() { # <code> <verdict> <raison> : la raison sur une ligne, puis le verdict, seul sur la sortie standard
  printf '%s\n' "${3//[[:cntrl:]]/ }" >&2
  printf '%s\n' "$2"
  exit "$1"
}
meme() { rendre 0 même "$1"; }
different() { rendre 20 différent "$1"; }
illisible() { rendre 21 illisible "$1"; }
SHA='^[0-9a-f]{40}$'
NOMBRE='^(0|[1-9][0-9]*)$'
court() { printf '%s' "${1:0:9}"; }
# Un texte en lignes, dans LIGNES, sans here-document (bash en écrirait un fichier sous le dossier temporaire).
decouper() {
  local IFS=$'\n'
  set -f
  # shellcheck disable=SC2206
  LIGNES=($1)
  set +f
}

[ "${BASH_VERSINFO[0]}" -ge 4 ] || illisible "bash ≥ 4 requis"
[ $# -eq 3 ] || illisible "usage : meme-contenu.sh <V> <T> <B>"
V=$1 T=$2 B=$3
[[ "$V" =~ $SHA ]] || illisible "V n'est pas un sha de 40 caractères"
[[ "$T" =~ $SHA ]] || illisible "T n'est pas un sha de 40 caractères"
for outil in git jq mktemp rm; do
  command -v "$outil" >/dev/null || rendre 69 illisible "$outil est requis par les scripts de la chaîne (jq : sudo apt install jq, ou brew install jq)"
done
# Aucune variable GIT_* héritée, sauf celle qui borne la recherche du dépôt.
for variable in $(compgen -v GIT_); do
  [ "$variable" = GIT_CEILING_DIRECTORIES ] || unset "$variable"
done
version=$(git version 2>/dev/null) || rendre 69 illisible "git version en échec"
[[ "$version" =~ ^git\ version\ ([0-9]+)\.([0-9]+) ]] || rendre 69 illisible "version de git illisible"
[ "${BASH_REMATCH[1]}" -gt 2 ] || { [ "${BASH_REMATCH[1]}" = 2 ] && [ "${BASH_REMATCH[2]}" -ge 41 ]; } ||
  rendre 69 illisible "git ≥ 2.41 requis, ici ${BASH_REMATCH[1]}.${BASH_REMATCH[2]}"

# ── Le dépôt réel : où sont ses objets, le sha de la cible, s'il est superficiel. Rien d'autre. ────────────────
git rev-parse --git-dir >/dev/null 2>&1 || illisible "pas dans un dépôt git"
[[ "$B" != *[[:cntrl:][:space:]]* ]] && [ "$B" != HEAD ] && git check-ref-format "refs/remotes/origin/$B" 2>/dev/null ||
  illisible "nom de branche cible invalide"
! git symbolic-ref -q "refs/remotes/origin/$B" >/dev/null 2>&1 || illisible "origin/$B est une réf symbolique, pas une branche"
objets=$(git rev-parse --path-format=absolute --git-path objects 2>/dev/null) && [[ "$objets" == /* ]] && [[ "$objets" != *$'\n'* ]] && [ -d "$objets" ] ||
  illisible "dossier des objets du dépôt illisible"

# ── S1 : le dépôt propre ────────────────────────────────────────────────────────────────────────────────────
propre=$(mktemp -d "${TMPDIR:-/tmp}/meme-contenu.XXXXXX" 2>/dev/null) && [ -n "$propre" ] && [ -d "$propre" ] ||
  { propre=''; illisible "dossier temporaire impossible à créer (plein ou absent)"; }
# Un dossier vide tient lieu de HOME et de XDG_CONFIG_HOME : git lit ~/.config/git/attributes sans passer par la
# configuration, et aucun fichier de l'utilisateur ne doit peser.
maison=$(mktemp -d "$propre/maison.XXXXXX" 2>/dev/null) && [ -n "$maison" ] && [ -d "$maison" ] ||
  illisible "dépôt propre impossible à créer sous le dossier temporaire"
p() {
  HOME="$maison" XDG_CONFIG_HOME="$maison" GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_ATTR_NOSYSTEM=1 \
    git --git-dir="$propre/depot" -c core.quotePath=false -c core.attributesFile=/dev/null "$@"
}
HOME="$maison" XDG_CONFIG_HOME="$maison" GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null GIT_CONFIG_NOSYSTEM=1 \
  git init -q --bare --template= "$propre/depot" >/dev/null 2>&1 || illisible "dépôt propre impossible à créer sous le dossier temporaire"
printf '%s\n' "$objets" >"$propre/depot/objects/info/alternates" 2>/dev/null || illisible "dépôt propre impossible à écrire sous le dossier temporaire"
VIDE=$(p hash-object -w -t tree --stdin </dev/null 2>/dev/null) && [[ "$VIDE" =~ $SHA ]] || illisible "dépôt propre impossible à écrire sous le dossier temporaire"
p cat-file -e "$T^{commit}" 2>/dev/null || illisible "T introuvable dans ce dépôt : $T"
[ "$V" != "$T" ] || meme "V est T"

superficiel=$(git rev-parse --is-shallow-repository 2>/dev/null) || illisible "git rev-parse --is-shallow-repository en échec"
[ "$superficiel" = false ] || illisible "clone superficiel : l'historique est tronqué (git fetch --unshallow origin)"
cible=$(git rev-parse -q --verify "refs/remotes/origin/$B" 2>/dev/null) && [[ "$cible" =~ $SHA ]] ||
  illisible "origin/$B introuvable : relire la cible d'abord"
p cat-file -e "$cible^{commit}" 2>/dev/null || illisible "origin/$B n'est pas un commit lisible"
p cat-file -e "$V^{commit}" 2>/dev/null || different "V introuvable dans ce dépôt (branche réécrite ?) : $(court "$V")"

# La ligne des premiers parents de T, du plus ancien au plus récent : le chemin est ce qui suit V.
sortie=$(p rev-list --first-parent --reverse "$T" 2>/dev/null) || illisible "git rev-list --first-parent en échec"
decouper "$sortie"
[ "${#LIGNES[@]}" -ge 1 ] && [ "${LIGNES[${#LIGNES[@]} - 1]}" = "$T" ] || illisible "ligne des premiers parents de T illisible"
chemin=()
vu=0
for c in "${LIGNES[@]}"; do
  [[ "$c" =~ $SHA ]] || illisible "ligne des premiers parents de T illisible"
  if [ "$vu" = 1 ]; then chemin+=("$c"); elif [ "$c" = "$V" ]; then vu=1; fi
done
[ "$vu" = 1 ] || different "V ($(court "$V")) n'est pas sur la ligne des premiers parents de T ($(court "$T"))"
# S3 : le nombre de commits à examiner, compté par une autre commande.
attendu=$(p rev-list --count --first-parent "$V..$T" 2>/dev/null) && [[ "$attendu" =~ $NOMBRE ]] && [ "$attendu" -ge 1 ] && [ "$attendu" = "${#chemin[@]}" ] ||
  illisible "compte des commits de V à T incohérent"
# S2 : la ligne des premiers parents de la cible, entre deux sauts de ligne pour y chercher un sha entier.
sortie=$(p rev-list --first-parent "$cible" 2>/dev/null) && [[ "$sortie" == "$cible"* ]] || illisible "ligne des premiers parents de origin/$B illisible"
LIGNE_CIBLE=$'\n'$sortie$'\n'

# La liste des index, sur la cible. Trois expressions régulières (ERE) : tous, ceux à `commande`, ceux à
# `commande` déclarés par motif. `*` vaut `[^/]+` ; tout autre caractère est pris à la lettre.
FORME='(.index | type == "array") and all(.index[];
  if type == "string" then . != ""
  elif type == "object" then (.chemin | type) == "string" and .chemin != "" and ((.commande // "") | type) == "string"
  else false end)'
REGEX='def lettre: gsub("(?<c>[\\[\\]\\\\.^$+?(){}|])"; "\\\(.c)");
  def regex: map(split("*") | map(lettre) | join("[^/]+")) | "^(" + join("|") + ")$";
  [.index[] | if type == "string" then {chemin: ., commande: ""} else {chemin, commande: (.commande // "")} end] |
  (map(.chemin) | regex), (map(select(.commande != "") | .chemin) | regex),
  (map(select(.commande != "" and (.chemin | contains("*"))) | .chemin) | regex)'
sortie=$(p ls-tree --full-tree "$cible" -- scripts/docs/index-generes.json 2>/dev/null) || illisible "arbre de origin/$B illisible"
LISTE=$propre/index-generes.json
if [ -z "$sortie" ]; then
  # Absente pour de bon, ou lecture vide ? Une seconde lecture, d'une autre commande, doit dire « absente » aussi.
  ! p cat-file -e "$cible:scripts/docs/index-generes.json" 2>/dev/null || illisible "arbre de origin/$B illisible"
  printf '%s\n' '{"index":[]}' >"$LISTE" 2>/dev/null || illisible "dépôt propre impossible à écrire sous le dossier temporaire"
else
  p cat-file blob "$cible:scripts/docs/index-generes.json" >"$LISTE" 2>/dev/null && [ -s "$LISTE" ] ||
    illisible "scripts/docs/index-generes.json de origin/$B illisible"
fi
forme=$(jq -r "$FORME" "$LISTE" 2>/dev/null) && [ "$forme" = true ] || illisible "scripts/docs/index-generes.json de origin/$B mal formé"
sortie=$(jq -r "$REGEX" "$LISTE" 2>/dev/null) || illisible "scripts/docs/index-generes.json de origin/$B : liste des index illisible"
decouper "$sortie"
[ "${#LIGNES[@]}" = 3 ] || illisible "scripts/docs/index-generes.json de origin/$B : liste des index illisible"
for r in "${LIGNES[@]}"; do
  [[ "$r" == '^('*')$' ]] || illisible "scripts/docs/index-generes.json de origin/$B : liste des index illisible"
done
GENERES=${LIGNES[0]} REGENERES=${LIGNES[1]} MOTIFS=${LIGNES[2]}

# Classe d'un chemin, dans l'ordre de `livraison_intermediaire` : hors, motif, sans-commande, régénéré. Seule la
# dernière est dispensée.
classe() {
  if [[ "$1" == '"'* ]] || ! [[ "$1" =~ $GENERES ]]; then echo hors
  elif [[ "$1" =~ $MOTIFS ]]; then echo motif
  elif ! [[ "$1" =~ $REGENERES ]]; then echo sans-commande
  else echo régénéré; fi
}
ordinaire() { [ "$1" = 100644 ] || [ "$1" = 100755 ]; }
# Écart entre deux arbres, une ligne par chemin : « :mode mode sha sha lettre<TAB>chemin ». Vide si, et seulement
# si, les deux arbres sont le même : une lecture vide entre deux arbres différents est une lecture en échec.
ECART=$'^:[0-7]{6} ([0-7]{6}) [0-9a-f]{40} ([0-9a-f]{40}) [A-Z][0-9]*\t(.+)$'
ecart_de() {
  local a=$1 b=$2 lu
  [[ "$a" =~ $SHA ]] && [[ "$b" =~ $SHA ]] || return 1
  lu=$(p diff-tree -r --raw --no-abbrev --no-renames "$a" "$b" 2>/dev/null) || return 1
  if [ "$a" = "$b" ]; then [ -z "$lu" ] || return 1; else [ -n "$lu" ] || return 1; fi
  printf '%s' "$lu"
}
PARENTS='^([0-9a-f]{40}) ([0-9a-f]{40})( ([0-9a-f]{40}))?( .+)?$'

acceptes=0
fusions=0
index=0
for c in "${chemin[@]}"; do
  sortie=$(p rev-list --parents -n 1 "$c" 2>/dev/null) && [[ "$sortie" =~ $PARENTS ]] && [ "${BASH_REMATCH[1]}" = "$c" ] ||
    illisible "parents de $(court "$c") illisibles"
  p1=${BASH_REMATCH[2]} p2=${BASH_REMATCH[4]} reste=${BASH_REMATCH[5]}
  [ -z "$reste" ] || different "$(court "$c") est une fusion à plus de deux parents"
  arbre_c=$(p rev-parse -q --verify "$c^{tree}" 2>/dev/null) && [[ "$arbre_c" =~ $SHA ]] || illisible "arbre de $(court "$c") illisible"
  if [ -n "$p2" ]; then
    # S2 : le second parent a été un jour le sommet de la cible, et la fusion apporte quelque chose.
    [[ "$LIGNE_CIBLE" == *$'\n'"$p2"$'\n'* ]] ||
      different "la fusion $(court "$c") a pour second parent $(court "$p2"), qui n'est pas sur la ligne des premiers parents de origin/$B"
    p merge-base --is-ancestor "$p2" "$p1" 2>/dev/null && rc=0 || rc=$?
    case $rc in
      1) ;;
      0) different "la fusion $(court "$c") a pour second parent $(court "$p2"), déjà ancêtre de son premier parent : elle n'apporte rien de la cible" ;;
      *) illisible "git merge-base --is-ancestor en échec ($rc) sur $(court "$c")" ;;
    esac
    # S4 : la fusion à trois voies nue, sans aucun attribut.
    sortie=$(p --attr-source="$VIDE" merge-tree --write-tree --name-only --no-messages "$p1" "$p2" 2>/dev/null) && rc=0 || rc=$?
    [ "$rc" -le 1 ] || illisible "git merge-tree --write-tree en échec ($rc) sur $(court "$c")"
    decouper "$sortie"
    depart=${LIGNES[0]:-}
    [[ "$depart" =~ $SHA ]] || illisible "arbre de la fusion calculée de $(court "$c") illisible"
    # Sortie 1 : un conflit, donc au moins un fichier en conflit ; sortie 0 : aucun. Rien d'autre n'en est tiré.
    if [ "$rc" = 1 ]; then [ "${#LIGNES[@]}" -ge 2 ]; else [ "${#LIGNES[@]}" = 1 ]; fi ||
      illisible "fichiers en conflit de la fusion calculée de $(court "$c") illisibles"
    sorte="la fusion $(court "$c") s'écarte de la fusion calculée de ses parents"
  else
    depart=$(p rev-parse -q --verify "$p1^{tree}" 2>/dev/null) && [[ "$depart" =~ $SHA ]] || illisible "arbre de $(court "$p1") illisible"
    sorte="le commit $(court "$c") n'est ni une fusion de la cible ni un commit d'index"
  fi
  ecart=$(ecart_de "$depart" "$arbre_c") || illisible "écart de $(court "$c") illisible"
  decouper "$ecart"
  juges=0
  for l in ${LIGNES[@]+"${LIGNES[@]}"}; do
    [[ "$l" =~ $ECART ]] || illisible "écart de $(court "$c") illisible"
    mode=${BASH_REMATCH[1]} f=${BASH_REMATCH[3]}
    case $(classe "$f") in
      hors) different "$sorte : $f n'est pas un index généré de origin/$B" ;;
      régénéré)
        [ "$mode" = 000000 ] || ordinaire "$mode" || different "$sorte : $f, index généré, n'est plus un fichier ordinaire"
        ;;
      motif | sans-commande)
        different "$sorte : $f, index sans commande ou déclaré par motif, se juge comme tout fichier"
        ;;
      *) illisible "classe de $f illisible" ;;
    esac
    juges=$((juges + 1))
  done
  # S3 : chaque ligne de l'écart a été jugée, le commit est accepté, et compté.
  [ "$juges" = "${#LIGNES[@]}" ] || illisible "écart de $(court "$c") jugé à moitié"
  if [ -n "$p2" ]; then fusions=$((fusions + 1)); else index=$((index + 1)); fi
  acceptes=$((acceptes + 1))
done
# S3 : « même » ne sort que si chaque commit compté par git a été examiné et accepté.
[ "$acceptes" = "$attendu" ] && [ "$acceptes" -ge 1 ] && [ $((fusions + index)) = "$acceptes" ] ||
  illisible "$acceptes commit(s) examiné(s) pour $attendu de V à T"
meme "de V à T : $fusions fusion(s) de origin/$B, $index commit(s) d'index générés"
