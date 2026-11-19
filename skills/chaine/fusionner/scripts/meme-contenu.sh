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
#     fusion à trois voies nue, sans aucun attribut), aux index générés près ; la fusion calculée ne peut être en
#     conflit que sur des index générés : le capitaine ne résout aucun autre conflit, il renvoie ;
#   - ou un commit à un parent qui ne touche que des index générés.
# Les index générés sont ceux de `origin/<B>:scripts/docs/index-generes.json` (fichier absent : aucun). **Seul un
# index à `commande`, de chemin littéral, déclaré tel sur la cible et sur T, est dispensé** (son contenu se
# régénère), absent ou fichier ordinaire, jamais lien symbolique ni sous-module. Un chemin déclaré ne porte aucun
# caractère de contrôle (liste mal formée sinon). Un chemin déclaré plus d'une fois, ou couvert aussi par un motif,
# n'est pas dispensé ; le fichier de la liste ne l'est jamais, quoi qu'il déclare. Un index sans `commande`, ou déclaré par motif (`*`), se juge comme tout
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
# Le dépôt réel se lit sans configuration d'utilisateur ni de poste, à une exception près (A-135, A-143) : le
# `safe.directory` par lequel l'utilisateur a déclaré sûr ce dépôt-ci, sans quoi git refuse le dépôt d'un autre
# propriétaire. Les déclarations sont celles que git lit hors de tout dépôt, aux portées `system` et `global`, dans
# son ordre (`git config --show-scope --includes --get-all safe.directory`, joué depuis `/` : `--global`, nommé, ne
# lirait pas le fichier XDG quand `~/.gitconfig` existe). Ne vaut qu'une valeur égale à la racine du dépôt (le
# premier dossier, en remontant du dossier courant sans lien symbolique, qui porte `.git`), caractère pour caractère,
# ou `*` ; une valeur vide efface celles qui la précèdent ; une ligne d'une autre forme, ou `GIT_CONFIG_COUNT` ou
# `GIT_CONFIG_PARAMETERS` dans l'environnement : rien n'est admis. De même pour `safe.bareRepository` (un dépôt nu trouvé
# sans `--git-dir` est refusé sous `explicit`) : sa dernière valeur est reportée, et `explicit` dans le doute. Le
# calcul lit moins que git, jamais plus.
# Un dépôt partiel (`--filter` : `remote.<nom>.promisor` ou `extensions.partialclone` dans sa configuration) est
# `illisible`, et la raison le dit : le dépôt propre ne télécharge aucun objet manquant.
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
NU_REFUSE="dépôt nu trouvé sans --git-dir, que git refuse sous safe.bareRepository (explicit, une valeur qu'il ne lit pas, ou explicit dans le doute) : appeler ce calcul depuis un arbre de travail"
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
# A-143 : où vit la configuration de l'utilisateur et du poste, pour la seule lecture de `safe.directory` ; et
# A-135 : une déclaration par `git -c` ou par ces deux variables n'est pas lue, et leur présence n'admet rien.
LIEU=()
for variable in GIT_CONFIG_GLOBAL GIT_CONFIG_SYSTEM GIT_CONFIG_NOSYSTEM; do
  [ -z "${!variable+x}" ] || LIEU+=("$variable=${!variable}")
done
parametres=0
if [ -n "${GIT_CONFIG_COUNT+x}" ] || [ -n "${GIT_CONFIG_PARAMETERS+x}" ]; then parametres=1; fi
# Aucune variable GIT_* héritée, sauf celle qui borne la recherche du dépôt.
for variable in $(compgen -v GIT_); do
  [ "$variable" = GIT_CEILING_DIRECTORIES ] || unset "$variable"
done
version=$(git version 2>/dev/null) || rendre 69 illisible "git version en échec"
[[ "$version" =~ ^git\ version\ ([0-9]+)\.([0-9]+) ]] || rendre 69 illisible "version de git illisible"
[ "${BASH_REMATCH[1]}" -gt 2 ] || { [ "${BASH_REMATCH[1]}" = 2 ] && [ "${BASH_REMATCH[2]}" -ge 41 ]; } ||
  rendre 69 illisible "git ≥ 2.41 requis, ici ${BASH_REMATCH[1]}.${BASH_REMATCH[2]}"

# ── safe.directory et safe.bareRepository (A-135, A-143) : ce que l'utilisateur ou le poste dit de ce dépôt ───
# Les déclarations d'une clé, lues par git lui-même, hors de tout dépôt (`cd /`), avec les seules variables qui disent
# où vit la configuration, dans son ordre : DECLARES (une valeur vide efface les précédentes, comme git le fait pour
# safe.directory), DERNIERE et VU (la dernière valeur telle quelle, vide comprise, et si une valeur a été vue), et
# LISIBLE=1, ou 0 si une ligne n'est ni `system` ni `global` (la suite d'une valeur à saut de ligne) ou si git a
# échoué autrement que par « aucune valeur » (sortie 1). Le point final garde les sauts de ligne de la fin.
declarations() { # <clé>
  local lu rc reste l TAB=$'\t'
  DECLARES=() LISIBLE=1 DERNIERE='' VU=0
  lu=$(
    for kv in ${LIEU[@]+"${LIEU[@]}"}; do export "${kv%%=*}=${kv#*=}"; done
    cd / && git config --show-scope --includes --get-all "$1" 2>/dev/null && printf .
  ) && rc=0 || rc=$?
  if [ "$rc" != 0 ]; then
    # Sortie 1 de `git config` : aucune valeur. Toute autre : rien n'est lisible.
    [ "$rc" = 1 ] && [ -z "$lu" ] || LISIBLE=0
    return 0
  fi
  [[ "$lu" == *. ]] || { LISIBLE=0; return 0; }
  reste=${lu%.}
  while [ "$LISIBLE" = 1 ] && [[ "$reste" == *$'\n'* ]]; do
    l=${reste%%$'\n'*} reste=${reste#*$'\n'}
    if [[ "$l" =~ ^(system|global)"$TAB"(.*)$ ]]; then
      if [ -z "${BASH_REMATCH[2]}" ]; then DECLARES=(); else DECLARES+=("${BASH_REMATCH[2]}"); fi
      DERNIERE=${BASH_REMATCH[2]} VU=1
    else LISIBLE=0; fi
  done
  [ -z "$reste" ] || LISIBLE=0
}
# safe.directory : la racine est celle que git compare, le premier dossier, en remontant, qui porte `.git`. Seule
# vaut une valeur égale à elle, ou `*` ; rien n'est admis si une déclaration est illisible, ou si GIT_CONFIG_COUNT ou
# GIT_CONFIG_PARAMETERS est dans l'environnement (une remise à zéro peut s'y trouver).
sur=''
racine=$(pwd -P 2>/dev/null) && [[ "$racine" == /* ]] || racine=''
while [ -n "$racine" ] && ! [ -e "${racine%/}/.git" ]; do
  if [ "$racine" = / ]; then racine=''; else racine=${racine%/*}; racine=${racine:-/}; fi
done
if [ -n "$racine" ] && [ "$parametres" = 0 ]; then
  declarations safe.directory
  if [ "$LISIBLE" = 1 ]; then
    for v in ${DECLARES[@]+"${DECLARES[@]}"}; do
      if [ "$v" = '*' ] || [ "$v" = "$racine" ]; then sur=$racine; fi
    done
  fi
fi
# safe.bareRepository (A-154) : git refuse un dépôt nu trouvé sans `--git-dir` quand elle vaut `explicit`, et échoue
# sur une valeur vide ou inconnue. Sa dernière valeur est reportée telle quelle, vide comprise ; une lecture
# illisible, ou GIT_CONFIG_COUNT ou GIT_CONFIG_PARAMETERS présente (où elle peut valoir `explicit`) : `explicit`. Le
# calcul lit moins que git, jamais plus.
nu='' nu_vu=0
if [ "$parametres" = 1 ]; then nu=explicit nu_vu=1
else
  declarations safe.bareRepository
  if [ "$LISIBLE" = 0 ]; then nu=explicit nu_vu=1; elif [ "$VU" = 1 ]; then nu=$DERNIERE nu_vu=1; fi
fi
# Les lectures du dépôt réel : sans configuration d'utilisateur ni de poste, sauf ces deux reports (SANS_NU=1 : sans
# celui de safe.bareRepository, pour nommer la cause d'un refus, jamais pour lire).
r() {
  local -a reports=()
  [ -z "$sur" ] || reports+=(safe.directory "$sur")
  [ "$nu_vu" = 0 ] || [ "${SANS_NU:-0}" = 1 ] || reports+=(safe.bareRepository "$nu")
  local -a vars=(GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null GIT_CONFIG_NOSYSTEM=1 "GIT_CONFIG_COUNT=$((${#reports[@]} / 2))")
  local i
  for ((i = 0; i < ${#reports[@]} / 2; i++)); do vars+=("GIT_CONFIG_KEY_$i=${reports[2 * i]}" "GIT_CONFIG_VALUE_$i=${reports[2 * i + 1]}"); done
  (
    export "${vars[@]}"
    exec git "$@"
  )
}

# ── Le dépôt réel : où sont ses objets, le sha de la cible, s'il est superficiel ou partiel. Rien d'autre. ──────
if ! r rev-parse --git-dir >/dev/null 2>&1; then
  # Un dépôt nu que safe.bareRepository fait refuser : la cause est nommée (la lecture sans ce report ne sert qu'à ça).
  [ "$nu_vu" = 0 ] || [ "$nu" = all ] || [ "$(SANS_NU=1 r rev-parse --is-bare-repository 2>/dev/null)" != true ] ||
    illisible "$NU_REFUSE"
  illisible "pas dans un dépôt git"
fi
[[ "$B" != *[[:cntrl:][:space:]]* ]] && [ "$B" != HEAD ] && r check-ref-format "refs/remotes/origin/$B" 2>/dev/null ||
  illisible "nom de branche cible invalide"
! r symbolic-ref -q "refs/remotes/origin/$B" >/dev/null 2>&1 || illisible "origin/$B est une réf symbolique, pas une branche"
objets=$(r rev-parse --path-format=absolute --git-path objects 2>/dev/null) && [[ "$objets" == /* ]] && [[ "$objets" != *$'\n'* ]] && [ -d "$objets" ] ||
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
# Le bruit de fond : ce qu'une commande qui réussit écrit sur sa sortie d'erreur dans ce dépôt (rien, ou
# l'avertissement d'un `alternates` périmé du dépôt réel). La sortie d'erreur de `git merge-tree` lui sera comparée.
BRUIT=$(p cat-file -e "$T^{commit}" 2>&1) || illisible "T introuvable dans ce dépôt : $T"
[ "$V" != "$T" ] || meme "V est T"

superficiel=$(r rev-parse --is-shallow-repository 2>/dev/null) || illisible "git rev-parse --is-shallow-repository en échec"
[ "$superficiel" = false ] || illisible "dépôt superficiel : l'historique est tronqué, à approfondir avant d'appeler ce calcul (git fetch --unshallow origin)"
# Un clone partiel : git le marque dans la configuration du dépôt, par un dépôt distant « promisor ». Sortie 1 :
# aucune clé ne répond ; toute autre sortie en échec : illisible.
partiel=$(r config --local --get-regexp '^(extensions\.partialclone|remote\..+\.promisor)$' 2>/dev/null) && rc=0 || rc=$?
case $rc in
  0)
    decouper "$partiel"
    for l in ${LIGNES[@]+"${LIGNES[@]}"}; do
      [[ "$l" == *' false' ]] ||
        illisible "dépôt partiel : des objets manquent et ce calcul ne télécharge rien, à cloner en entier avant de l'appeler (git clone sans --filter)"
    done
    ;;
  1) ;;
  *) illisible "configuration du dépôt illisible (git config en échec, $rc)" ;;
esac
cible=$(r rev-parse -q --verify "refs/remotes/origin/$B" 2>/dev/null) && [[ "$cible" =~ $SHA ]] ||
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
FORME='def net: . != "" and (explode | all(. >= 32 and . != 127));
  (.index | type == "array") and all(.index[];
  if type == "string" then net
  elif type == "object" then (.chemin | type) == "string" and (.chemin | net) and ((.commande // "") | type) == "string"
  else false end)'
REGEX='def lettre: gsub("(?<c>[\\[\\]\\\\.^$+?(){}|])"; "\\\(.c)");
  def regex: map(split("*") | map(lettre) | join("[^/]+")) | "^(" + join("|") + ")$";
  def liste: [.index[] | if type == "string" then {chemin: ., commande: ""} else {chemin, commande: (.commande // "")} end];
  def litteraux: map(select(.commande != "" and (.chemin | contains("*") | not)) | .chemin);
  # Sans ambiguïté : un chemin littéral à commande, déclaré une seule fois dans sa liste, qu aucun motif ne couvre.
  def surs: . as $l | (map(select(.chemin | contains("*")) | .chemin) | if length == 0 then null else regex end) as $m |
    litteraux | map(select(. as $c | ([$l[] | select(.chemin == $c)] | length) == 1 and ($m == null or ($c | test($m) | not))));
  (liste | (map(.chemin) | regex), (map(select(.commande != "") | .chemin) | regex),
    (map(select(.commande != "" and (.chemin | contains("*"))) | .chemin) | regex), (surs | regex)),
  ($t[0] | liste | (litteraux | regex), (surs | regex))'
# La liste d'un commit, écrite dans un fichier du dépôt propre et relue dans sa forme. Absente : liste vide.
lire_liste() { # <commit> <fichier> <qui>
  local lu forme
  lu=$(p ls-tree --full-tree "$1" -- scripts/docs/index-generes.json 2>/dev/null) || illisible "arbre de $3 illisible"
  if [ -z "$lu" ]; then
    # Absente pour de bon, ou lecture vide ? Une seconde lecture, d'une autre commande, doit dire « absente » aussi.
    ! p cat-file -e "$1:scripts/docs/index-generes.json" 2>/dev/null || illisible "arbre de $3 illisible"
    printf '%s\n' '{"index":[]}' >"$2" 2>/dev/null || illisible "dépôt propre impossible à écrire sous le dossier temporaire"
  else
    p cat-file blob "$1:scripts/docs/index-generes.json" >"$2" 2>/dev/null && [ -s "$2" ] ||
      illisible "scripts/docs/index-generes.json de $3 illisible"
  fi
  forme=$(jq -r "$FORME" "$2" 2>/dev/null) && [ "$forme" = true ] || illisible "scripts/docs/index-generes.json de $3 mal formé"
}
LISTE=$propre/index-generes.json
LISTE_T=$propre/index-generes-T.json
lire_liste "$cible" "$LISTE" "origin/$B"
# A-125 : un index n'est dispensé que s'il est déclaré à commande sur la cible et sur T. La liste de T ne donne
# aucune dispense de plus : elle ne fait qu'en retirer.
lire_liste "$T" "$LISTE_T" "T ($(court "$T"))"
sortie=$(jq -r --slurpfile t "$LISTE_T" "$REGEX" "$LISTE" 2>/dev/null) || illisible "scripts/docs/index-generes.json de origin/$B : liste des index illisible"
decouper "$sortie"
[ "${#LIGNES[@]}" = 6 ] || illisible "scripts/docs/index-generes.json de origin/$B : liste des index illisible"
for r in "${LIGNES[@]}"; do
  [[ "$r" == '^('*')$' ]] || illisible "scripts/docs/index-generes.json de origin/$B : liste des index illisible"
done
GENERES=${LIGNES[0]} REGENERES=${LIGNES[1]} MOTIFS=${LIGNES[2]} SURS=${LIGNES[3]} REGENERES_T=${LIGNES[4]} SURS_T=${LIGNES[5]}

# Classe d'un chemin : la liste elle-même (jamais dispensée, quoi qu'elle déclare), puis, dans l'ordre de
# `livraison_intermediaire`, hors, motif, sans-commande ; puis retiré (à commande sur la cible, plus sur T), ambigu
# (déclaré plus d'une fois, ou couvert aussi par un motif, sur la cible ou sur T), régénéré. Seule la dernière est
# dispensée.
classe() {
  if [ "$1" = scripts/docs/index-generes.json ]; then echo liste
  elif [[ "$1" == '"'* ]] || ! [[ "$1" =~ $GENERES ]]; then echo hors
  elif [[ "$1" =~ $MOTIFS ]]; then echo motif
  elif ! [[ "$1" =~ $REGENERES ]]; then echo sans-commande
  elif ! [[ "$1" =~ $REGENERES_T ]]; then echo retiré
  elif ! [[ "$1" =~ $SURS ]] || ! [[ "$1" =~ $SURS_T ]]; then echo ambigu
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

ERREURS=$propre/erreurs
acceptes=0
fusions=0
index=0
for c in "${chemin[@]}"; do
  sortie=$(p rev-list --parents -n 1 "$c" 2>/dev/null) && [[ "$sortie" =~ $PARENTS ]] && [ "${BASH_REMATCH[1]}" = "$c" ] ||
    illisible "parents de $(court "$c") illisibles"
  p1=${BASH_REMATCH[2]} p2=${BASH_REMATCH[4]} reste=${BASH_REMATCH[5]}
  [ -z "$reste" ] || different "$(court "$c") est une fusion à plus de deux parents"
  arbre_c=$(p rev-parse -q --verify "$c^{tree}" 2>/dev/null) && [[ "$arbre_c" =~ $SHA ]] || illisible "arbre de $(court "$c") illisible"
  conflits=()
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
    sortie=$(p --attr-source="$VIDE" merge-tree --write-tree --name-only --no-messages "$p1" "$p2" 2>"$ERREURS") && rc=0 || rc=$?
    [ "$rc" -le 1 ] || illisible "git merge-tree --write-tree en échec ($rc) sur $(court "$c")"
    # Un vrai conflit n'écrit rien de plus que le bruit de fond sur la sortie d'erreur : un objet illisible, si, et
    # sort en 1 lui aussi.
    [ -e "$ERREURS" ] && ecrit=$(<"$ERREURS") && [ "$ecrit" = "$BRUIT" ] ||
      illisible "git merge-tree --write-tree a écrit une erreur sur $(court "$c")"
    decouper "$sortie"
    depart=${LIGNES[0]:-}
    [[ "$depart" =~ $SHA ]] || illisible "arbre de la fusion calculée de $(court "$c") illisible"
    # Sortie 1 : un conflit, donc au moins un fichier en conflit ; sortie 0 : aucun.
    if [ "$rc" = 1 ]; then [ "${#LIGNES[@]}" -ge 2 ]; else [ "${#LIGNES[@]}" = 1 ]; fi ||
      illisible "fichiers en conflit de la fusion calculée de $(court "$c") illisibles"
    conflits=("${LIGNES[@]:1}")
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
      retiré) different "$sorte : $f, index à commande de origin/$B, n'est plus déclaré à commande sur T" ;;
      ambigu) different "$sorte : $f est déclaré plus d'une fois, ou couvert aussi par un motif, sur origin/$B ou sur T : il se juge comme tout fichier" ;;
      liste) different "$sorte : $f, la liste des index, ne se dispense jamais elle-même" ;;
      *) illisible "classe de $f illisible" ;;
    esac
    juges=$((juges + 1))
  done
  # S3 : chaque ligne de l'écart a été jugée, le commit est accepté, et compté.
  [ "$juges" = "${#LIGNES[@]}" ] || illisible "écart de $(court "$c") jugé à moitié"
  # A-125 : le capitaine ne résout jamais un conflit de code, il renvoie. Une fusion dont la fusion calculée est en
  # conflit ailleurs que sur un index à commande n'est pas la sienne, quel que soit l'arbre qu'elle porte.
  for f in ${conflits[@]+"${conflits[@]}"}; do
    [ "$(classe "$f")" = régénéré ] ||
      different "la fusion $(court "$c") conclut un conflit sur $f, qui n'est pas un index à commande : ce n'est pas une mise à jour du capitaine"
  done
  if [ -n "$p2" ]; then fusions=$((fusions + 1)); else index=$((index + 1)); fi
  acceptes=$((acceptes + 1))
done
# S3 : « même » ne sort que si chaque commit compté par git a été examiné et accepté.
[ "$acceptes" = "$attendu" ] && [ "$acceptes" -ge 1 ] && [ $((fusions + index)) = "$acceptes" ] ||
  illisible "$acceptes commit(s) examiné(s) pour $attendu de V à T"
meme "de V à T : $fusions fusion(s) de origin/$B, $index commit(s) d'index générés"
