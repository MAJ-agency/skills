#!/usr/bin/env bash
# Les gestes d'une session de relecture (skill relecture), joués par ce script et jamais collés à la main.
#
# Usage, depuis le dossier de la session (étape 2), puis depuis n'importe où :
#   bash '<dossier du skill>/scripts/gestes.sh' <sous-commande> '<brouillons>' [arguments]
#
# <brouillons> : <scratchpad>/relecture/pr-<n>-tour-<k>, un chemin absolu ; l'étape 2 le vide et le crée. Chaque
# sous-commande lit ce que l'étape 2 y a écrit (le dossier de la session, la base, la tête, le sommet) : la session
# ne retape aucun chemin, et aucune commande ne dépend du dossier où elle est lancée, sauf `c4-verifier` et
# `revenir`, qui contrôlent justement ce dossier.
#
#   etape2 '<brouillons>' '<base>' '<tête>' '<sommet>'  la base dans le dossier de la session, le sommet dans l'arbre à part
#   liste '<brouillons>'          la liste des fichiers (diff à trois points, ou `sujet.sh a-juger` vers un sujet)
#   diff '<brouillons>'           le diff relu, vérifié contre la liste ; ses lots, et ceux de la résolution, au-delà de 2 000 lignes
#   axes '<brouillons>'           ce qui choisit les axes : revue exigée, chemins sensibles, ticket, binaires
#   c1 '<brouillons>'             l'empreinte, les index générés (C1), l'arbre remis, l'empreinte reprise
#   garde '<brouillons>'          l'empreinte reprise juste avant le premier axe
#   contexte '<brouillons>'       le contexte du ticket (axe Ticket), lu dans l'arbre à part
#   accord '<brouillons>'         la ligne `Sensibles:` du ticket, lue sur le sujet (C3)
#   lus '<brouillons>' <i> [<lot>]  ce que l'axe <i> a lu, comparé au diff relu (<lot> : un rang, `resolution` ou `resolution-<j>`)
#   tri '<brouillons>'            les constats de `tri.txt`, venus de develop ou non (PR de mise à jour)
#   montrer '<brouillons>'        le fichier de `montrer.txt`, tel que le sommet l'écrit
#   c4 '<brouillons>'             le clone de `/security-review` (C4), prêt ; son chemin dans `c4-dossier.txt`
#   c4-verifier '<brouillons>'    depuis le clone : le diff que la commande intégrée lira est celui de la PR
#   revenir '<brouillons>'        depuis le dossier de la session : `origin/HEAD` remis, le clone retiré, vérifié
#   controle '<brouillons>' verdict|publie   le verdict relu comme la machine le lira
#   ranger '<brouillons>'         l'arbre à part retiré
#
# Sorties : 0 fait ; 1 un écart que la sous-commande mesure (non lus, vérification de C4, verdict hors forme) ;
# 2 ticket introuvable (contexte) ; 4 forme d'une PR de mise à jour refusée (C2) ; 11 refs absentes (a-juger) ;
# 12 non exécuté, la cause écrite ; 13 liste des index illisible (C1) ; 14 l'empreinte ou un état a changé, ou une
# consigne est sur le disque : aucun axe ; 15 une commande d'index ou un contrôle en échec (C1, à juger). La dernière
# ligne écrite est toujours « <sous-commande> : sortie <n> ». Une liste vide après un échec n'est jamais « rien » :
# chaque commande dont la sortie décide est lue par son code, et un échec écrit sa cause et sort en erreur.
set -euo pipefail
shopt -s inherit_errexit
export LC_ALL=C
# Des réglages git pour chaque commande du script et des scripts qu'il joue, ajoutés à ceux que la session porte déjà
# dans son environnement (`GIT_CONFIG_COUNT`, une réécriture d'URL par exemple), jamais à leur place. Ni fsmonitor ni
# crochet : ce que la PR exécute pendant `C1` peut en poser dans la configuration du dossier de la session.
config_git() {
  local n=${GIT_CONFIG_COUNT:-0}
  [[ $n =~ ^[0-9]+$ ]] || { printf '%s\n' "GIT_CONFIG_COUNT illisible : $n"; exit 12; }
  while [ $# -ge 2 ]; do
    export "GIT_CONFIG_KEY_$n=$1" "GIT_CONFIG_VALUE_$n=$2"
    n=$((n + 1))
    shift 2
  done
  export GIT_CONFIG_COUNT=$n
}
config_git core.fsmonitor false core.hooksPath ''

SOUS=${1:-}
trap 's=$?; printf "%s : sortie %s\n" "${SOUS:-gestes}" "$s"' EXIT
KIT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
ARBRE_VIDE=4b825dc642cb6eb9a060e54bf8d69288fbee4904
# Les fichiers qu'une session charge comme consignes : jamais sur le disque d'un arbre qui porte la tête de la PR.
# Toute casse (un système de fichiers insensible à la casse lit `claude.md` comme `CLAUDE.md`), à toute profondeur,
# et tout `.claude`, dossier, fichier ou lien symbolique, sauf le contrat de la racine. Un lien de ces noms n'est
# jamais extrait : il ferait entrer ce qu'il désigne.
SANS_CONSIGNES=('/*' '![Cc][Ll][Aa][Uu][Dd][Ee].[Mm][Dd]' '![Cc][Ll][Aa][Uu][Dd][Ee].[Ll][Oo][Cc][Aa][Ll].[Mm][Dd]' '!.[Cc][Ll][Aa][Uu][Dd][Ee]/' '!.[Cc][Ll][Aa][Uu][Dd][Ee]' '/.claude/chaine.json')

dire() { printf '%s\n' "$@"; }
quitter() {
  local code=$1
  shift
  [ $# = 0 ] || printf '%s\n' "$@"
  exit "$code"
}
# grep qui ne sort en erreur que sur une vraie erreur (2), jamais parce qu'il ne trouve rien.
filtrer() { grep "$@" || [ $? = 1 ]; }
nom_sur() { [[ $1 =~ ^[A-Za-z0-9._/-]+$ && $1 != -* ]] || quitter 12 "nom refusé, hors de [A-Za-z0-9._/-] : aucune commande ne le reçoit"; }
lignes() { if [ -f "$1" ]; then wc -l < "$1" | tr -d ' '; else echo 0; fi; }

# Le dossier de brouillons d'un tour : un chemin absolu, `…/relecture/pr-<n>-tour-<k>`.
B=${2:-}
brouillons() {
  [[ $B == /* ]] || quitter 12 "brouillons : un chemin absolu est attendu"
  [[ $(basename -- "$B") =~ ^pr-([0-9]+)-tour-([0-9]+)$ ]] || quitter 12 "brouillons : le dossier se nomme pr-<n>-tour-<k>"
  N=${BASH_REMATCH[1]}
  [ "$(basename -- "$(dirname -- "$B")")" = relecture ] || quitter 12 "brouillons : le dossier est sous <scratchpad>/relecture"
  A=$B/arbre
}
# Ce que l'étape 2 a écrit : le dossier de la session, la base, la tête, le sommet. Sans eux, rien ne se joue.
lire_pr() {
  brouillons
  [ -s "$B/session.txt" ] && [ -s "$B/pr.txt" ] || quitter 12 "étape 2 absente : la jouer d'abord"
  S=$(cat "$B/session.txt")
  local pr
  mapfile -t pr < "$B/pr.txt"
  [ "${#pr[@]}" = 3 ] || quitter 12 "pr.txt hors de sa forme"
  base=${pr[0]} tete=${pr[1]} sommet=${pr[2]}
  nom_sur "$base"
  nom_sur "$tete"
  [[ $sommet =~ ^[0-9a-f]{40}$ ]] || quitter 12 "sommet hors de sa forme"
  [ -d "$A" ] || quitter 12 "arbre à part absent : rejouer l'étape 2"
}
# Les fichiers de consigne sur le disque d'un arbre (`.claude/chaine.json` à sa racine mis à part). Le `.claude` de
# la racine n'est mis à part que s'il est un vrai dossier : un lien de ce nom, comme tout lien `CLAUDE.md` ou
# `CLAUDE.local.md`, est une consigne. Une liste qui ne se calcule pas est un échec, jamais « aucune consigne ».
consignes_dans() {
  local d=$1 l
  l=$(cd "$d" && find . -path ./.git -prune -o \( -iname claude.md -o -iname claude.local.md -o -iname .claude \) -print) || return 1
  if [ -d "$d/.claude" ] && [ ! -L "$d/.claude" ]; then
    printf '%s\n' "$l" | { filtrer -vx './.claude'; } | { filtrer .; } | sort || return 1
    l=$(cd "$d" && find ./.claude -mindepth 1 -print) || return 1
    printf '%s\n' "$l" | { filtrer -vx './.claude/chaine.json'; } | { filtrer .; } | sort || return 1
    [ ! -L "$d/.claude/chaine.json" ] || dire './.claude/chaine.json, un lien'
  else
    printf '%s\n' "$l" | { filtrer .; } | sort || return 1
  fi
}
# L'empreinte d'un fichier de consigne : son contenu, ou ce que désigne un lien.
empreinte_de() {
  local t
  if [ -L "$1" ]; then t=$(readlink -- "$1") || return 1; printf 'lien:%s' "$t"; else git hash-object -- "$1"; fi
}
# Tout fichier de consigne que la session ou un axe peut charger : sous le dossier de la session et sous le
# scratchpad, et dans chaque dossier au-dessus d'eux. Un CLAUDE.md avec son empreinte, un `.claude/` par son nom.
consignes_autour() {
  local racine d f h
  for racine in "$S" "$(dirname -- "$(dirname -- "$B")")"; do
    find "$racine" \( -path "$S/.git" -o -path "$S/.relecture-securite" -o -path "$A/.git" \) -prune -o \
      \( -iname claude.md -o -iname claude.local.md \) \( -type f -o -type l \) -print0 | sort -z |
      while IFS= read -r -d '' d; do h=$(empreinte_de "$d") || exit 1; printf '%s %s\n' "$h" "$d"; done || return 1
    find "$racine" \( -path "$S/.git" -o -path "$S/.relecture-securite" \) -prune -o -iname .claude -print | sort || return 1
    d=$(dirname -- "$racine")
    while :; do
      for f in "$d/CLAUDE.md" "$d/CLAUDE.local.md" "$d/.claude/CLAUDE.md"; do
        if [ -f "$f" ] || [ -L "$f" ]; then h=$(empreinte_de "$f") || return 1; printf '%s %s\n' "$h" "$f"; fi
      done
      if [ -d "$d/.claude" ] || [ -L "$d/.claude" ]; then dire "$d/.claude"; fi
      [ "$d" != / ] || break
      d=$(dirname -- "$d")
    done
  done
}
# L'empreinte de ce que les axes recevront : les listes et les diffs du tour, le titre, le skill entier (prompts,
# critères, gabarit, ce script), les consignes autour, et l'état des deux dossiers. Appelée dans une liste `||`, où
# `set -e` ne joue pas : chaque commande y est lue par son code, et une empreinte qui ne se calcule pas est un échec,
# jamais un dossier « propre ».
empreinte() {
  local f h e
  for f in session.txt pr.txt fichiers.txt attendus.txt relus.txt diff.patch binaires.txt illisibles.txt sensibles.txt \
    binaires-sensibles.txt dispenses.txt hors.txt sans-ecart.txt ticket.txt titre.txt resolution.patch resolution.txt; do
    if [ -f "$B/$f" ]; then h=$(git hash-object -- "$B/$f") || return 1; printf '%s %s\n' "$h" "$f"; else dire "absent $f"; fi
  done
  if [ -d "$B/lots" ]; then
    find "$B/lots" -type f -print0 | sort -z | while IFS= read -r -d '' f; do h=$(git hash-object -- "$f") || exit 1; printf '%s %s\n' "$h" "${f#"$B"/}"; done || return 1
  fi
  find "$KIT" -type f -print0 | sort -z | while IFS= read -r -d '' f; do h=$(git hash-object -- "$f") || exit 1; printf '%s %s\n' "$h" "${f#"$KIT"/}"; done || return 1
  consignes_autour || return 1
  dire "état de la session :"
  e=$(git -C "$S" status --porcelain) || return 1
  [ -z "$e" ] || printf '%s\n' "$e"
  dire "état de l'arbre :"
  e=$(git -C "$A" status --porcelain --ignored) || return 1
  [ -z "$e" ] || printf '%s\n' "$e"
  dire "consignes de l'arbre :"
  e=$(consignes_dans "$A") || return 1
  [ -z "$e" ] || printf '%s\n' "$e"
}

etape2() {
  [ $# = 3 ] || quitter 12 "usage : etape2 '<brouillons>' '<base>' '<tête>' '<sommet>'"
  brouillons
  base=$1 tete=$2 sommet=$3
  nom_sur "$base"
  nom_sur "$tete"
  [[ $sommet =~ ^[0-9a-f]{40}$ ]] || quitter 12 "sommet hors de sa forme : 40 caractères hexadécimaux"
  S=$(git rev-parse --show-toplevel) || quitter 12 "le dossier courant n'est pas un dépôt git"
  S=$(cd "$S" && pwd -P)
  [ "$(basename -- "$S")" != .relecture-securite ] || quitter 12 "le dossier courant est le clone de C4 : revenir d'abord dans le dossier de la session"
  cd "$S"
  local etat
  etat=$(git status --porcelain) || quitter 12 "état du dossier de la session illisible"
  [ -z "$etat" ] || quitter 12 "dossier de la session pas propre"
  # Rien ne reste d'un tour ni d'une relance d'avant : ni brouillons, ni arbre, ni clone de C4.
  rm -rf -- "$(dirname -- "$B")" "$S/.relecture-securite"
  git worktree prune
  mkdir -p -- "$B"
  dire "$S" > "$B/session.txt"
  if [ "$(git rev-parse --is-shallow-repository)" != false ]; then git fetch -q --unshallow origin || quitter 12 "fetch impossible : le clone reste superficiel"; fi
  git fetch -q origin '+refs/heads/develop:refs/remotes/origin/develop' || quitter 12 "fetch de develop impossible"
  git fetch -q origin "+refs/heads/$base:refs/remotes/origin/$base" "+refs/heads/$tete:refs/remotes/origin/$tete" || quitter 12 "fetch de la base ou de la tête impossible"
  # Les scripts joués sont ceux de la base.
  git switch -q --detach "origin/$base" || quitter 12 "la base ne se place pas dans le dossier de la session"
  git cat-file -e "$sommet^{commit}" 2> /dev/null || quitter 12 "sommet introuvable : $sommet"
  git worktree add -q --no-checkout --detach "$A" "$sommet" || quitter 12 "arbre à part non créé"
  git -C "$A" sparse-checkout set --no-cone "${SANS_CONSIGNES[@]}" || quitter 12 "arbre à part : l'extraction sans consignes a échoué"
  git -C "$A" checkout -q --detach "$sommet" || quitter 12 "arbre à part : le sommet ne s'extrait pas"
  [ "$(git -C "$A" rev-parse HEAD)" = "$sommet" ] || quitter 12 "l'arbre à part n'est pas au sommet distribué"
  local c
  c=$(consignes_dans "$A") || quitter 12 "consignes de l'arbre à part illisibles"
  [ -z "$c" ] || quitter 14 "consignes de la PR sur le disque de l'arbre à part :" "$c"
  printf '%s\n%s\n%s\n' "$base" "$tete" "$sommet" > "$B/pr.txt"
  dire "{{BASE}} : $S" "{{ARBRE}} : $A" "étape 2 : faite"
}

liste() {
  lire_pr
  cd "$S"
  # Chaque geste retire sa marque en partant ; la liste défait aussi ce qui se calcule sur elle.
  rm -rf -- "$B/liste.faite" "$B/fichiers.txt" "$B/a-juger.txt" "$B/maj" "$B/diff.fait" "$B/axes.fait" "$B/sensibles.txt" "$B/ticket.txt" "$B/binaires-sensibles.txt" "$B/c1"
  if [[ $base == sujet/* ]]; then
    if [ ! -d node_modules ]; then
      pnpm install --frozen-lockfile --prefer-offline > "$B/installation.log" 2>&1 || dire "installation en échec"
    fi
    local s=0
    bash "$S/scripts/chaine/sujet.sh" a-juger "$sommet" "$base" "$N" > "$B/a-juger.txt" 2> "$B/a-juger.err" || s=$?
    case $s in
      0) ;;
      4)
        if grep -q 'refusé par commitlint' "$B/a-juger.txt" "$B/a-juger.err"; then
          # Le témoin : le message du sommet de la base, qu'une fusion a déjà accepté.
          git log -1 --format=%B "origin/$base" | pnpm exec commitlint > /dev/null 2>&1 ||
            quitter 12 "commitlint ne tourne pas dans la session (le témoin est refusé) : C2 non exécuté"
        fi
        quitter 4 "forme refusée (C2) :" "$(cat "$B/a-juger.txt" "$B/a-juger.err")"
        ;;
      11) quitter 11 "refs absentes : refaire l'étape 2" ;;
      *) quitter 12 "a-juger en échec, sortie $s : aucune liste" ;;
    esac
    awk '/^$/ { n = 0; next } { l[++n] = $0 } END { for (i = 1; i <= n; i++) print l[i] }' "$B/a-juger.txt" > "$B/fichiers.txt"
    if grep -qx '' "$B/a-juger.txt"; then
      : > "$B/maj"
      dire "PR de mise à jour"
    fi
  else
    git -C "$A" -c core.quotePath=false diff --name-only --no-renames "origin/$base...HEAD" > "$B/fichiers.txt" ||
      quitter 12 "liste non écrite : git diff en échec (pas de base commune ?)"
  fi
  touch "$B/liste.faite"
  dire "liste : $(lignes "$B/fichiers.txt") fichiers"
}

# Le chemin d'un en-tête de diff, tel que la liste l'écrit (cité entre guillemets quand git le cite).
RELUS_SED=(-n -e 's/^diff --git a\/\(.*\) b\/\1$/\1/p' -e 's/^diff --git "a\/\(.*\)" "b\/\1"$/"\1"/p')
relus_de() { sed "${RELUS_SED[@]}" "$1" | sort -u; }

diff_relu() {
  lire_pr
  cd "$S"
  [ -f "$B/liste.faite" ] || quitter 12 "liste des fichiers absente"
  rm -rf -- "$B/lots" "$B/diff.fait"
  rm -f -- "$B/diff.patch" "$B/stat.txt" "$B/attendus.txt" "$B/relus.txt" "$B/manquants.txt" "$B/binaires.txt" "$B/illisibles.txt" \
    "$B/resolution.patch" "$B/resolution.txt" "$B/fusion.txt"
  # Aucun attribut git ne joue (l'arbre vide pour source), les chemins sans citation des accents, sans renommages.
  export GIT_ATTR_SOURCE=$ARBRE_VIDE
  config_git core.quotePath false diff.renames false
  [ ! -f "$B/maj" ] || resolution
  if [ ! -s "$B/fichiers.txt" ]; then
    : > "$B/attendus.txt"
    touch "$B/diff.fait"
    quitter 0 "aucun fichier à relire"
  fi
  git --attr-source="$ARBRE_VIDE" -C "$A" check-attr diff -- x > /dev/null 2>&1 || quitter 12 "git 2.40 ou plus est requis"
  local zones s=0
  mapfile -t zones < "$B/fichiers.txt"
  (cd "$A" && REVUE_DIR="$B" bash "$S/scripts/chaine/diff-revue.sh" "origin/$base" "${zones[@]/#/:(literal)}") > "$B/diff-revue.out" 2> "$B/diff-revue.err" || s=$?
  cat "$B/diff-revue.err" >&2
  if [ "$s" != 0 ]; then
    [ "$s" = 1 ] && grep -q '^diff-revue : diff vide' "$B/diff-revue.err" || quitter 12 "diff non écrit, sortie $s"
  fi
  [ -f "$B/diff.patch" ] || quitter 12 "diff non écrit : diff.patch absent"
  # Les index à commande que la base ET la tête déclarent par un chemin littéral : la liste de chacune, lue par le
  # script de la base.
  local L='.index[] | objects | select((.commande // "") != "" and (.chemin | contains("*") | not)) | .chemin'
  bash -c '. "$1/scripts/chaine/github.sh" && index_json' _ "$S" > "$B/index-base.json" || quitter 12 "liste des index de la base illisible"
  jq -r "$L" < "$B/index-base.json" | sort -u > "$B/index-base.txt" || quitter 12 "liste des index de la base illisible"
  (cd "$A" && bash -c '. "$1/scripts/chaine/github.sh" && index_json' _ "$S") > "$B/index-tete.json" || quitter 12 "liste des index de la tête illisible"
  jq -r "$L" < "$B/index-tete.json" | sort -u > "$B/index-tete.txt" || quitter 12 "liste des index de la tête illisible"
  comm -12 "$B/index-base.txt" "$B/index-tete.txt" | { filtrer -Fxv scripts/docs/index-generes.json; } | { filtrer .; } > "$B/dispenses.txt"
  git -C "$A" diff --name-only --no-renames "origin/$base...HEAD" > "$B/ecarts-cites.txt" || quitter 12 "liste des écarts illisible"
  sort -u "$B/ecarts-cites.txt" > "$B/ecarts.txt"
  git -C "$A" diff --name-only --no-renames -z "origin/$base...HEAD" > "$B/ecarts.z" || quitter 12 "liste des écarts illisible"
  sort -u "$B/fichiers.txt" | comm -23 - "$B/dispenses.txt" > "$B/a-relire.txt"
  comm -23 "$B/a-relire.txt" "$B/ecarts.txt" > "$B/sans-ecart.txt"
  comm -12 "$B/a-relire.txt" "$B/ecarts.txt" > "$B/changes.txt"
  { filtrer -Ev '^pnpm-lock\.yaml$|\.snap$' "$B/changes.txt"; } > "$B/attendus.txt"
  [ -s "$B/attendus.txt" ] || cp "$B/changes.txt" "$B/attendus.txt"
  comm -23 "$B/changes.txt" "$B/attendus.txt" > "$B/hors.txt"
  relus_de "$B/diff.patch" > "$B/relus.txt"
  comm -23 "$B/attendus.txt" "$B/relus.txt" > "$B/manquants.txt"
  # Ce qui manque s'ajoute par la machine : le chemin lu octet pour octet dans la sortie -z de git, reconnu par son
  # rang dans la même liste telle que git la cite. La session n'écrit aucun chemin.
  local cites f i=0 g
  mapfile -t cites < "$B/ecarts-cites.txt"
  while IFS= read -r -d '' f; do
    [ "$i" -lt "${#cites[@]}" ] || quitter 12 "liste des écarts illisible : les deux formes ne s'accordent pas"
    g=0
    grep -Fxq -- "${cites[i]}" "$B/manquants.txt" || g=$?
    case $g in
      0) git -C "$A" diff --no-renames "origin/$base...HEAD" -- ":(literal)$f" >> "$B/diff.patch" || quitter 12 "diff non écrit : $f" ;;
      1) ;;
      *) quitter 12 "manquants.txt illisible" ;;
    esac
    i=$((i + 1))
  done < "$B/ecarts.z"
  [ "$i" = "${#cites[@]}" ] || quitter 12 "liste des écarts illisible : les deux formes ne s'accordent pas"
  relus_de "$B/diff.patch" > "$B/relus.txt"
  comm -23 "$B/attendus.txt" "$B/relus.txt" > "$B/manquants.txt"
  git -C "$A" diff --numstat --no-renames "origin/$base...HEAD" > "$B/numstat.txt" || quitter 12 "liste des binaires illisible"
  awk -F'\t' '$1 == "-" && $2 == "-" { print $3 }' "$B/numstat.txt" | sort -u | comm -12 - "$B/attendus.txt" > "$B/binaires.txt"
  # Un binaire qui n'est ni une image, ni une police, ni une archive de données : du code ou un texte que git ne lit
  # pas. Une archive qui porte du code exécutable (`.jar`, `.war`, `.whl`, `.nupkg`) est illisible.
  { filtrer -Eiv '\.(png|jpe?g|gif|webp|avif|ico|bmp|tiff?|heic|woff2?|ttf|otf|eot|zip|gz|tgz|tar|bz2|xz|7z)"?$' "$B/binaires.txt"; } > "$B/illisibles.txt"
  if [ -s "$B/manquants.txt" ]; then quitter 12 "manquent au diff relu :" "$(cat "$B/manquants.txt")"; fi
  if [ -s "$B/resolution.txt" ]; then binaires_resolution; fi
  lots "$B/diff.patch" "$B/relus.txt" lot
  if [ -s "$B/resolution.txt" ]; then lots "$B/resolution.patch" "$B/resolution.txt" resolution; fi
  touch "$B/diff.fait"
  [ -s "$B/attendus.txt" ] || [ -s "$B/resolution.txt" ] || dire "aucun axe"
  dire "diff relu : $(lignes "$B/relus.txt") fichiers, $(lignes "$B/diff.patch") lignes ; hors du diff : $(lignes "$B/hors.txt") ; sans écart : $(lignes "$B/sans-ecart.txt") ; binaires : $(lignes "$B/binaires.txt"), dont illisibles : $(lignes "$B/illisibles.txt")"
  if [ -s "$B/illisibles.txt" ]; then dire "binaires illisibles (ni image, ni police, ni archive) :" "$(cat "$B/illisibles.txt")"; fi
  dire "{{DIFF}} : $B/diff.patch"
  if [ -s "$B/resolution.txt" ]; then
    dire "résolution de la fusion : $(lignes "$B/resolution.txt") fichiers"
    [ -d "$B/lots/resolution-1" ] || dire "{{DIFF}} de la résolution, pour l'axe Règles : $B/resolution.patch"
  fi
}

# Sur une PR de mise à jour, la résolution de la fusion se relit en entier : ce qu'elle change par rapport à la fusion
# automatique (`git show --remerge-diff`, git 2.36 ou plus), marqueurs de conflit compris. Ce que develop écrit et que
# la résolution retire n'est dans aucun autre diff relu : c'est le seul endroit où cela se lit.
resolution() {
  local f
  f=$(git -C "$A" rev-list --merges "$sommet" "^origin/$base" ^origin/develop) || quitter 12 "fusion illisible : la résolution ne se relit pas"
  [ -n "$f" ] && [ "$(printf '%s\n' "$f" | wc -l | tr -d ' ')" = 1 ] || quitter 12 "PR de mise à jour sans une fusion et une seule : la résolution ne se relit pas"
  git -C "$A" show --remerge-diff --format= --quiet "$f" > /dev/null 2>&1 ||
    quitter 12 "git 2.36 ou plus est requis (git show --remerge-diff) : la résolution de la fusion ne se relit pas"
  git -C "$A" show --remerge-diff --format= --no-renames --no-ext-diff "$f" > "$B/resolution.patch" || quitter 12 "diff de la résolution non écrit"
  relus_de "$B/resolution.patch" > "$B/resolution.txt"
  printf '%s\n' "$f" > "$B/fusion.txt"
}

# Un fichier de la résolution que git lit binaire contre l'un ou l'autre parent de la fusion, et que le diff relu ne
# porte pas (absent d'attendus.txt), est un binaire du tour : le premier parent voit la forme neuve que la résolution
# écrit, le second ce qu'elle jette de develop. Il complète binaires.txt, sans rien lui prendre.
binaires_resolution() {
  local f
  f=$(cat "$B/fusion.txt")
  git -C "$A" diff --numstat --no-renames "$f^1" "$f" > "$B/numstat-resolution-1.txt" || quitter 12 "liste des binaires de la résolution illisible"
  git -C "$A" diff --numstat --no-renames "$f^2" "$f" > "$B/numstat-resolution-2.txt" || quitter 12 "liste des binaires de la résolution illisible"
  cat "$B"/numstat-resolution-[12].txt | awk -F'\t' '$1 == "-" && $2 == "-" { print $3 }' | sort -u | comm -12 - "$B/resolution.txt" | comm -23 - "$B/attendus.txt" | sort -u - "$B/binaires.txt" -o "$B/binaires.txt"
  { filtrer -Eiv '\.(png|jpe?g|gif|webp|avif|ico|bmp|tiff?|heic|woff2?|ttf|otf|eot|zip|gz|tgz|tar|bz2|xz|7z)"?$' "$B/binaires.txt"; } > "$B/illisibles.txt"
}

# Au-delà de 2 000 lignes, des lots : par zone (`apps/<x>`, `packages/<x>`, sinon le premier dossier, la racine à
# part), une zone entière dans un lot quand elle tient, un fichier de plus de 2 000 lignes seul dans le sien. La machine
# découpe le diff lui-même, en-tête par en-tête : l'union des lots est vérifiée, fichier pour fichier et ligne
# pour ligne. Deux appels : le diff relu (`lots diff.patch relus.txt lot`, lots `lots/lot-<i>/`) et, sur une PR de mise
# à jour, la résolution (`lots resolution.patch resolution.txt resolution`, lots `lots/resolution-<j>/`), chacun dans
# son dossier de travail : le cas « un seul lot » ne retire que le sien.
lots() {
  local patch=$1 liste=$2 nom=$3 total qui pre n i d W
  total=$(lignes "$patch")
  [ "$total" -gt 2000 ] || return 0
  if [ "$nom" = lot ]; then qui="le diff relu" pre=lots; else qui="la résolution" pre="lots de la résolution"; fi
  mkdir -p "$B/lots"
  W=$(mktemp -d "$B/lots/travail-XXXXXX")
  awk -v sortie="$W" -v plafond=2000 '
    function cle(h,   r, n) {
      if (h ~ /^diff --git "a\//) { r = substr(h, 15); n = (length(r) - 5) / 2; return "\"" substr(r, 1, n) "\"" }
      r = substr(h, 14); n = (length(r) - 3) / 2; return substr(r, 1, n)
    }
    function zone(c,   p, n) {
      p = c; sub(/^"/, "", p); n = split(p, morceaux, "/")
      if (n == 1) return "."
      if ((morceaux[1] == "apps" || morceaux[1] == "packages") && n > 2) return morceaux[1] "/" morceaux[2]
      return morceaux[1]
    }
    FNR == NR { if (/^diff --git /) { k = cle($0); ordre[++nf] = k } taille[k]++; texte[k] = texte[k] $0 "\n"; next }
    END {
      for (i = 1; i <= nf; i++) { z = zone(ordre[i]); if (!(z in tz)) zs[++nz] = z; tz[z] += taille[ordre[i]]; fz[z] = fz[z] SUBSEP ordre[i] }
      lot = 0; plein = plafond + 1
      for (j = 1; j <= nz; j++) {
        z = zs[j]; m = split(substr(fz[z], 2), fichiers, SUBSEP)
        if (tz[z] <= plafond) { if (plein + tz[z] > plafond) { lot++; plein = 0 } for (x = 1; x <= m; x++) place(fichiers[x]); plein += tz[z]; continue }
        for (x = 1; x <= m; x++) { t = taille[fichiers[x]]; if (plein + t > plafond) { lot++; plein = 0 } place(fichiers[x]); plein += t }
      }
      print lot > (sortie "/nombre")
    }
    function place(k,   d) { d = sortie "/" lot; printf "%s", texte[k] >> (d ".patch"); close(d ".patch"); print k >> (d ".attendus"); close(d ".attendus") }
  ' "$patch"
  n=$(cat "$W/nombre")
  if [ "$n" = 1 ]; then
    rm -rf -- "$W"
    rmdir -- "$B/lots" 2> /dev/null || true
    [ "$nom" != lot ] || dire "un seul fichier, de plus de 2 000 lignes : un seul lot, le diff relu entier"
    return 0
  fi
  : > "$W/union.txt"
  for i in $(seq 1 "$n"); do
    d=$B/lots/$nom-$i
    mkdir -p -- "$d"
    mv -- "$W/$i.patch" "$d/diff.patch"
    mv -- "$W/$i.attendus" "$d/attendus.txt"
    [ -s "$d/diff.patch" ] || quitter 12 "$pre : le lot $i est vide"
    sort -u "$d/attendus.txt" -o "$d/attendus.txt"
    relus_de "$d/diff.patch" > "$d/relus.txt"
    cmp -s "$d/attendus.txt" "$d/relus.txt" || quitter 12 "$pre : le lot $i ne porte pas ses fichiers"
    comm -12 "$d/relus.txt" "$B/binaires.txt" > "$d/binaires.txt"
    cat "$d/relus.txt" >> "$W/union.txt"
  done
  [ -z "$(sort "$W/union.txt" | uniq -d)" ] || quitter 12 "$pre : un fichier est dans deux lots"
  sort -u "$W/union.txt" | cmp -s - "$liste" || quitter 12 "$pre : leur union n'est pas $qui"
  [ "$(cat "$B"/lots/"$nom"-*/diff.patch | wc -l | tr -d ' ')" = "$total" ] || quitter 12 "$pre : leurs lignes ne font pas $qui"
  rm -rf -- "$W"
  for i in $(seq 1 "$n"); do dire "lot $( [ "$nom" = lot ] && echo "$i" || echo "$nom-$i") : $(lignes "$B/lots/$nom-$i/relus.txt") fichiers, $(lignes "$B/lots/$nom-$i/diff.patch") lignes, {{DIFF}} : $B/lots/$nom-$i/diff.patch"; done
  if [ "$nom" = lot ]; then dire "lots : $n"; else dire "lots de la résolution : $n"; fi
}

axes() {
  lire_pr
  cd "$S"
  [ -f "$B/liste.faite" ] || quitter 12 "liste des fichiers absente"
  [ -f "$B/diff.fait" ] || quitter 12 "diff relu absent : jouer diff d'abord"
  rm -f -- "$B/axes.fait" "$B/sensibles.txt" "$B/ticket.txt" "$B/binaires-sensibles.txt" "$B/sans-ligne.txt"
  if [ ! -s "$B/fichiers.txt" ] && [ ! -s "$B/resolution.txt" ]; then touch "$B/axes.fait"; quitter 0 "aucun fichier à relire : ni axe, ni C3, ni C4"; fi
  [ -s "$B/titre.txt" ] || quitter 12 "titre.txt absent : l'écrire par l'outil d'écriture de fichier"
  local s=0 ticket
  node "$S/scripts/chaine/revue-exigee.mjs" '' '' "origin/$base" < "$B/fichiers.txt" > /dev/null 2> "$B/revue-exigee.err" || s=$?
  case $s in
    0)
      # Un fichier du diff relu qu'aucune ligne de la table ne couvre (ni code pour revue-exigee.mjs, ni documentation : un
      # `.md` ; un `.mdx` exécute ses `export`, c'est du code) est du code : la revue est exigée, jamais aucun axe.
      { filtrer -Eiv '\.md"?$' "$B/attendus.txt"; } > "$B/sans-ligne.txt"
      if [ -s "$B/sans-ligne.txt" ]; then
        dire "revue exigée : oui, un fichier qu'aucune ligne de la table ne couvre est du code :"
        cat "$B/sans-ligne.txt"
      else
        dire "revue exigée : non"
      fi
      ;;
    1) dire "revue exigée : oui" ;;
    *) quitter 12 "revue-exigee.mjs en échec, sortie $s" ;;
  esac
  (cd "$A" && node "$S/scripts/chaine/chemins-sensibles.mjs" "origin/$base" < "$B/fichiers.txt") > "$B/sensibles.txt" || quitter 12 "chemins-sensibles.mjs en échec : jamais « rien de sensible »"
  ticket=$(node "$S/scripts/chaine/identifiant.mjs" ticket-de-pr "$(cat "$B/titre.txt")" "$tete") || quitter 12 "identifiant.mjs en échec : jamais « pas de ticket »"
  printf '%s' "${ticket:+$ticket$'\n'}" > "$B/ticket.txt"
  : > "$B/binaires-sensibles.txt"
  if [ -s "$B/binaires.txt" ]; then
    (cd "$A" && node "$S/scripts/chaine/chemins-sensibles.mjs" "origin/$base" < "$B/binaires.txt") > "$B/binaires-sensibles.txt" || quitter 12 "chemins-sensibles.mjs en échec sur les binaires"
  fi
  if [ -s "$B/resolution.txt" ]; then
    dire "résolution de la fusion : $(lignes "$B/resolution.txt") fichiers, que l'axe Règles lit"
    cat "$B/resolution.txt"
  fi
  dire "chemins sensibles : $(lignes "$B/sensibles.txt")"
  [ ! -s "$B/sensibles.txt" ] || cat "$B/sensibles.txt"
  dire "ticket : ${ticket:-aucun}" "binaires sous un chemin sensible : $(lignes "$B/binaires-sensibles.txt")"
  [ ! -s "$B/binaires-sensibles.txt" ] || cut -f1 "$B/binaires-sensibles.txt"
  dire "binaires illisibles : $(lignes "$B/illisibles.txt")"
  touch "$B/axes.fait"
}

c1() {
  lire_pr
  cd "$S"
  [ -f "$B/liste.faite" ] && [ -f "$B/diff.fait" ] || quitter 12 "diff relu absent : jouer diff d'abord"
  rm -rf -- "$B/c1"
  mkdir -p "$B/c1"
  empreinte > "$B/c1/avant.txt" || quitter 12 "empreinte illisible"
  # Le sommet entier, consignes comprises, le temps des commandes d'index : elles se jouent comme chez le capitaine.
  git -C "$A" sparse-checkout disable || quitter 12 "arbre à part : l'extraction entière a échoué"
  local s=0 c=0 r=0
  (cd "$A" && { pnpm install --frozen-lockfile --prefer-offline || exit 12; } &&
    bash -c 'set -o pipefail; . "$1/scripts/chaine/github.sh" && { index_generes > /dev/null || exit 13; } && regenerer_index' _ "$S") > "$B/c1/regeneration.log" 2>&1 || s=$?
  git -C "$A" -c core.quotePath=false diff --name-only HEAD > "$B/c1/c1.txt" || c=$?
  { git -C "$A" reset -q --hard "$sommet" && git -C "$A" clean -fdqx && git -C "$A" sparse-checkout set --no-cone "${SANS_CONSIGNES[@]}" &&
    git -C "$A" reset -q --hard "$sommet"; } || r=$?
  : > "$B/c1/index-fusion.txt"
  if [ -f "$B/maj" ]; then
    local f
    f=$(git rev-list --merges "$sommet" "^origin/$base" ^origin/develop) || f=''
    if [ -n "$f" ] && [ "$(printf '%s\n' "$f" | wc -l | tr -d ' ')" = 1 ]; then
      git -c core.quotePath=false diff --name-only --no-renames "$f^1" "$f" | sort -u | comm -12 - "$B/dispenses.txt" > "$B/c1/index-fusion.txt" ||
        { : > "$B/c1/index-fusion.txt"; dire "index que la fusion a touchés : illisibles, rien n'est laissé au capitaine"; }
    else
      dire "fusion introuvable : rien n'est laissé au capitaine"
    fi
  fi
  empreinte > "$B/c1/apres.txt" || quitter 14 "empreinte illisible après C1 : aucun axe"
  [ "$r" = 0 ] || quitter 14 "l'arbre à part ne revient pas au sommet : aucun axe"
  if ! cmp -s "$B/c1/avant.txt" "$B/c1/apres.txt"; then
    quitter 14 "après C1, l'empreinte ou un état a changé : aucun axe" "$(diff "$B/c1/avant.txt" "$B/c1/apres.txt" || true)"
  fi
  local etat
  etat=$(sed -n '/^état de la session :$/,$p' "$B/c1/apres.txt" | filtrer -vx 'état de la session :' | filtrer -vx "état de l'arbre :" | filtrer -vx "consignes de l'arbre :")
  [ -z "$etat" ] || quitter 14 "un dossier n'est pas propre, ou une consigne est sur le disque : aucun axe" "$etat"
  case $s in
    0) ;;
    12) quitter 12 "installation en échec dans l'arbre à part : C1 non exécuté (c1/regeneration.log)" ;;
    13) quitter 13 "liste des index illisible : C1 non exécuté" ;;
  esac
  [ "$c" = 0 ] || quitter 12 "c1.txt non écrit : C1 non exécuté"
  sort -u "$B/c1/c1.txt" | comm -23 - "$B/c1/index-fusion.txt" > "$B/c1/perimes.txt"
  sort -u "$B/c1/c1.txt" | comm -12 - "$B/c1/index-fusion.txt" > "$B/c1/au-capitaine.txt"
  dire "index périmés : $(lignes "$B/c1/perimes.txt")"
  [ ! -s "$B/c1/perimes.txt" ] || cat "$B/c1/perimes.txt"
  dire "index à régénérer par le capitaine : $(lignes "$B/c1/au-capitaine.txt")"
  [ ! -s "$B/c1/au-capitaine.txt" ] || cat "$B/c1/au-capitaine.txt"
  [ "$s" = 0 ] || quitter 15 "régénération en échec, sortie $s : c1/regeneration.log dit quelle commande"
}

garde() {
  lire_pr
  [ -s "$B/c1/avant.txt" ] || quitter 12 "C1 absent : jouer c1 d'abord"
  empreinte > "$B/c1/garde.txt" || quitter 14 "empreinte illisible : aucun axe"
  cmp -s "$B/c1/avant.txt" "$B/c1/garde.txt" || quitter 14 "l'empreinte a changé depuis C1 : aucun axe" "$(diff "$B/c1/avant.txt" "$B/c1/garde.txt" || true)"
  dire "empreinte identique"
}

# Le contexte du ticket, par le script de la base, dans l'arbre à part ; son chemin, lu dans sa sortie.
contexte_ticket() {
  local id s=0
  [ -f "$B/axes.fait" ] || quitter 12 "ticket.txt absent : jouer axes d'abord"
  id=$(cat "$B/ticket.txt" 2> /dev/null) || quitter 12 "ticket.txt absent : jouer axes d'abord"
  [ -n "$id" ] || return 3
  PROJET_RACINE="$A" node "$S/scripts/chaine/contexte-ticket.mjs" "$id" > "$B/contexte.txt" 2> "$B/contexte.err" || s=$?
  [ "$s" = 0 ] || return "$s"
  FICHIER_TICKET=$(sed -n '3s/^## Ticket — //p' "$B/contexte.txt")
  [ -n "$FICHIER_TICKET" ] || return 12
}
contexte() {
  lire_pr
  cd "$S"
  local s=0
  contexte_ticket || s=$?
  case $s in
    0) dire "ticket : $FICHIER_TICKET" "{{CONTEXTE}} : $B/contexte.txt" ;;
    2) quitter 2 "ticket introuvable dans l'arbre à part : l'axe Ticket est non exécuté" ;;
    3) quitter 12 "la PR n'a pas de ticket : l'axe Ticket est sans objet" ;;
    *) quitter 12 "contexte-ticket.mjs en échec, sortie $s : l'axe Ticket est non exécuté" ;;
  esac
}

accord() {
  lire_pr
  cd "$S"
  [ -f "$B/axes.fait" ] && [ -f "$B/sensibles.txt" ] || quitter 12 "sensibles.txt absent : jouer axes d'abord"
  [ -s "$B/sensibles.txt" ] || quitter 0 "aucun chemin sensible : C3 sans objet"
  dire "chemins sensibles :"
  cut -f1 "$B/sensibles.txt"
  if [ -f "$B/maj" ]; then
    dire "PR de mise à jour : un chemin sensible n'est couvert que s'il est dans la première liste d'a-juger, et sur la ligne Sensibles: d'un ticket du sujet ; la première liste :"
    sed '/^$/q' "$B/a-juger.txt"
    quitter 0
  fi
  local s=0 nom ref
  contexte_ticket || s=$?
  case $s in
    0) ;;
    3) quitter 0 "la PR n'a pas de ticket : chaque chemin sensible est un écart de C3" ;;
    *) quitter 12 "le ticket ne se lit pas (sortie $s) : C3 non exécuté" ;;
  esac
  if [[ $base == sujet/* ]]; then
    nom=${base#sujet/}
  else
    # Tout ce qui suit « Sujet: », sans le préfixe sujet/ : un nom qui ne se lit pas entier est refusé, jamais « sans sujet ».
    nom=$(git -C "$A" show "HEAD:$FICHIER_TICKET" | sed -n 's/^Sujet:[[:space:]]*//p' | sed -n 1p) || quitter 12 "le ticket ne se lit pas dans l'arbre à part : C3 non exécuté"
    nom=${nom%"${nom##*[![:space:]]}"}
    nom=${nom#sujet/}
    case $nom in —|-) nom='' ;; esac
  fi
  if [ -z "$nom" ]; then
    ref=origin/develop
  else
    nom_sur "$nom"
    if git fetch -q origin "+refs/heads/sujet/$nom:refs/remotes/origin/sujet/$nom" 2> /dev/null; then
      ref=origin/sujet/$nom
    else
      s=0
      git ls-remote --exit-code origin "refs/heads/sujet/$nom" > /dev/null 2>&1 || s=$?
      [ "$s" = 2 ] || quitter 12 "le sujet sujet/$nom ne se rapatrie pas (distant, sortie $s) : C3 non exécuté"
      ref=origin/develop
      dire "sujet/$nom n'est plus sur le distant : le ticket se lit sur origin/develop"
    fi
  fi
  git show "$ref:$FICHIER_TICKET" > "$B/accord-ticket.txt" 2> /dev/null || quitter 0 "le ticket n'existe pas sur $ref : aucun chemin sensible n'est couvert"
  dire "ticket lu sur $ref : $FICHIER_TICKET"
  grep '^Sensibles:' "$B/accord-ticket.txt" || dire "aucune ligne Sensibles: sur $ref"
}

lus() {
  brouillons
  local i=${3:-} lot=${4:-} d axe
  [[ $i =~ ^[1-5]$ ]] || quitter 12 "usage : lus '<brouillons>' <rang de l'axe, 1 à 5> [<lot>]"
  d=$B axe=$B/axe-$i.txt
  if [ "$lot" = resolution ]; then
    [ "$i" = 1 ] || quitter 12 "la résolution de la fusion se lit par l'axe Règles (1)"
    [ -s "$B/resolution.txt" ] || quitter 12 "aucune résolution à relire : jouer diff d'abord, sur une PR de mise à jour"
    mkdir -p "$B/lots/resolution"
    cp "$B/resolution.txt" "$B/lots/resolution/relus.txt"
    d=$B/lots/resolution axe=$B/axe-1-lot-resolution.txt
  elif [[ $lot =~ ^resolution-[0-9]+$ ]]; then
    [ "$i" = 1 ] || quitter 12 "la résolution de la fusion se lit par l'axe Règles (1)"
    [ -d "$B/lots/$lot" ] || quitter 12 "lot inconnu : $lot"
    d=$B/lots/$lot axe=$B/axe-1-lot-$lot.txt
  elif [ -n "$lot" ]; then
    [[ $lot =~ ^[0-9]+$ ]] && [ -d "$B/lots/lot-$lot" ] || quitter 12 "lot inconnu : $lot"
    d=$B/lots/lot-$lot axe=$B/axe-$i-lot-$lot.txt
  fi
  [ -s "$d/relus.txt" ] || quitter 12 "relus.txt absent : jouer diff d'abord"
  [ -f "$B/binaires.txt" ] || quitter 12 "binaires.txt absent : jouer diff d'abord"
  [ -s "$axe" ] || quitter 12 "sortie de l'axe absente : $(basename -- "$axe")"
  grep -qx 'Fichiers du diff lus :' "$axe" || quitter 1 "la sortie de l'axe n'a pas la ligne « Fichiers du diff lus : » : aucun fichier n'est tenu pour lu"
  sed '1,/^Fichiers du diff lus :$/d' "$axe" | tr -d '\r' | sort -u > "${axe%.txt}.lus"
  comm -23 "$d/relus.txt" "$B/binaires.txt" | comm -23 - "${axe%.txt}.lus" > "${axe%.txt}.non-lus"
  [ ! -s "${axe%.txt}.non-lus" ] || quitter 1 "fichiers du diff relu que l'axe n'a pas lus :" "$(cat "${axe%.txt}.non-lus")"
  dire "l'axe a lu tout le diff relu"
}

# Le chemin réel d'un fichier du diff relu, à partir de sa forme dans la liste (citée ou non).
chemin_reel() {
  local cites f i=0
  mapfile -t cites < "$B/ecarts-cites.txt"
  while IFS= read -r -d '' f; do
    if [ "${cites[i]}" = "$1" ]; then printf '%s' "$f"; return 0; fi
    i=$((i + 1))
  done < "$B/ecarts.z"
  return 1
}

# Une ligne retirée ne vient de develop que si develop retire le même morceau, au même endroit : la ligne <l> de la
# base (le premier parent de la fusion), ramenée sur la base commune des deux parents par les en-têtes du diff du sujet,
# hors de tout ce que le sujet a changé ; un morceau que develop retire la couvre ; et rien de ce morceau n'a changé
# côté sujet. Jamais par son seul texte. Dans le doute (une commande en échec, une forme illisible), sortie non nulle :
# le constat se garde.
meme_retrait() {
  local f=$1 reel=$2 l=$3 texte=$4 n=$5 p1 mb lm m
  p1=$(git rev-parse "$f^1") || return 1
  [ "$(git rev-parse "origin/$base:$reel" 2> /dev/null)" = "$(git rev-parse "$p1:$reel" 2> /dev/null)" ] || return 1
  mb=$(git merge-base "$p1" "$f^2") || return 1
  git diff -U0 --no-renames --no-ext-diff "$mb" "$p1" -- ":(literal)$reel" > "$B/tri-$n-sujet.diff" || return 1
  git diff -U0 --no-renames --no-ext-diff "$mb" "$f^2" -- ":(literal)$reel" > "$B/tri-$n-develop.diff" || return 1
  # La place de la ligne sur la base commune ; hors d'un morceau que le sujet a écrit.
  lm=$(awk -v l="$l" '
    function bornes(x, t) { x = substr(x, 2); if (x !~ /,/) x = x ",1"; split(x, t, ","); return t[1] + 0 SUBSEP t[2] + 0 }
    /^@@ / { split(bornes($2), o, SUBSEP); split(bornes($3), w, SUBSEP)
      if (w[2] > 0 && l >= w[1] && l <= w[1] + w[2] - 1) { dedans = 1; exit }
      if (l > (w[2] > 0 ? w[1] + w[2] - 1 : w[1])) decale += o[2] - w[2] }
    END { if (dedans) exit 1; print l + decale }' "$B/tri-$n-sujet.diff") || return 1
  [[ $lm =~ ^[0-9]+$ ]] || return 1
  [ "$(git show "$mb:$reel" | sed -n "${lm}p")" = "$texte" ] || return 1
  # Le morceau que develop retire et qui couvre cette place ; rien de lui n'a changé côté sujet.
  m=$(awk -v l="$lm" '
    function bornes(x, t) { x = substr(x, 2); if (x !~ /,/) x = x ",1"; split(x, t, ","); return t[1] + 0 SUBSEP t[2] + 0 }
    /^@@ / { split(bornes($2), o, SUBSEP); split(bornes($3), w, SUBSEP); if (o[2] > 0 && l >= o[1] && l <= o[1] + o[2] - 1) { print o[1], o[1] + o[2] - 1, w[1], w[2]; exit } }' "$B/tri-$n-develop.diff") || return 1
  [ -n "$m" ] || return 1
  local md me mc mk
  read -r md me mc mk <<< "$m" || return 1
  [[ "$md $me $mc $mk" =~ ^[0-9]+\ [0-9]+\ [0-9]+\ [0-9]+$ ]] || return 1
  awk -v d="$md" -v e="$me" '
    function bornes(x, t) { x = substr(x, 2); if (x !~ /,/) x = x ",1"; split(x, t, ","); return t[1] + 0 SUBSEP t[2] + 0 }
    /^@@ / { split(bornes($2), o, SUBSEP)
      if (o[2] > 0 && o[1] <= e && o[1] + o[2] - 1 >= d) touche = 1
      if (o[2] == 0 && o[1] >= d && o[1] < e) touche = 1 }
    END { exit touche }' "$B/tri-$n-sujet.diff" || return 1
  # La résolution n'a ni récrit ni retiré ce que develop met à la place : si le morceau de develop écrit des lignes, aucun
  # morceau de `git diff -U0 <fusion>^2 <fusion>` ne les touche ; s'il ne fait que retirer, la fusion n'insère rien là.
  git diff -U0 --no-renames --no-ext-diff "$f^2" "$f" -- ":(literal)$reel" > "$B/tri-$n-fusion.diff" || return 1
  awk -v c="$mc" -v k="$mk" '
    function bornes(x, t) { x = substr(x, 2); if (x !~ /,/) x = x ",1"; split(x, t, ","); return t[1] + 0 SUBSEP t[2] + 0 }
    /^@@ / { split(bornes($2), o, SUBSEP)
      if (k > 0 && o[2] > 0 && o[1] <= c + k - 1 && o[1] + o[2] - 1 >= c) touche = 1
      if (k > 0 && o[2] == 0 && o[1] >= c && o[1] < c + k) touche = 1
      if (k == 0 && o[2] == 0 && o[1] == c) touche = 1 }
    END { exit touche }' "$B/tri-$n-fusion.diff" || return 1
}

tri() {
  lire_pr
  cd "$S"
  [ -s "$B/tri.txt" ] || quitter 12 "tri.txt absent : une ligne par constat, « ajoutée|retirée<TAB><ligne><TAB><fichier> »"
  [ -f "$B/maj" ] || quitter 0 "pas une PR de mise à jour : aucun constat ne vient de develop, tout se garde"
  local sens l fichier reel commit fusion texte s n=0
  fusion=$(git rev-list --merges "$sommet" "^origin/$base" ^origin/develop) || fusion=''
  while IFS=$'\t' read -r sens l fichier || [ -n "$sens" ]; do
    n=$((n + 1))
    if ! grep -Fxq -- "$fichier" "$B/attendus.txt"; then dire "$n : gardé, $fichier n'est pas au diff relu"; continue; fi
    if ! [[ $l =~ ^[0-9]+$ ]] || ! reel=$(chemin_reel "$fichier"); then dire "$n : gardé, ligne illisible"; continue; fi
    case $sens in
      ajoutée)
        commit=$(git -C "$A" blame -l -L "$l,$l" "$sommet" -- "$reel" 2> /dev/null | awk 'NR == 1 { sub(/^\^/, "", $1); print $1 }') || commit=''
        s=1
        [ -z "$commit" ] || { s=0; git merge-base --is-ancestor "$commit" origin/develop || s=$?; }
        case $s in
          0) dire "$n : écarté, la ligne vient de develop ($commit)" ;;
          1) dire "$n : gardé" ;;
          *) dire "$n : gardé, git merge-base en échec" ;;
        esac
        ;;
      retirée)
        if [ -z "$fusion" ] || [ "$(printf '%s\n' "$fusion" | wc -l | tr -d ' ')" != 1 ]; then dire "$n : gardé, la fusion ne se lit pas"; continue; fi
        texte=$(git show "origin/$base:$reel" 2> /dev/null | sed -n "${l}p") || texte=''
        [ -n "$texte" ] || { dire "$n : gardé, la ligne $l ne se lit pas sur la base"; continue; }
        s=0
        meme_retrait "$fusion" "$reel" "$l" "$texte" "$n" || s=$?
        if [ "$s" = 0 ]; then dire "$n : écarté, develop retire seul cette ligne"; else dire "$n : gardé"; fi
        ;;
      *) dire "$n : gardé, sens illisible ($sens)" ;;
    esac
  done < "$B/tri.txt"
}

montrer() {
  lire_pr
  cd "$S"
  local fichier reel
  [ -s "$B/montrer.txt" ] || quitter 12 "montrer.txt absent : le fichier, tel que attendus.txt l'écrit"
  fichier=$(head -n 1 "$B/montrer.txt")
  grep -Fxq -- "$fichier" "$B/attendus.txt" || quitter 12 "ce fichier n'est pas au diff relu"
  reel=$(chemin_reel "$fichier") || quitter 12 "chemin illisible"
  git -C "$A" show "HEAD:$reel" || quitter 12 "le fichier ne se lit pas au sommet (retiré par la PR ?)"
}

c4() {
  lire_pr
  cd "$S"
  local C=$S/.relecture-securite b x o
  x=$(git rev-parse --git-path info/exclude)
  mkdir -p -- "$(dirname -- "$x")"
  [ -f "$x" ] && grep -qxF '/.relecture-securite/' "$x" || dire '/.relecture-securite/' >> "$x"
  b=$(git rev-parse "origin/$base^{commit}") || quitter 12 "la base ne se lit pas"
  rm -rf -- "$C"
  git clone -q --shared --no-checkout "$S" "$C" || quitter 12 "clone de C4 non créé"
  git -C "$C" update-ref "refs/remotes/origin/$base" "$b"
  git -C "$C" symbolic-ref refs/remotes/origin/HEAD "refs/remotes/origin/$base"
  # Aucun attribut git de la PR ni de la base ne joue dans le clone : la commande intégrée y lit le diff comme les axes,
  # le contenu seul disant ce qui est binaire (ni `diff`, ni son `textconv`, ni `filter`).
  mkdir -p -- "$C/.git/info"
  printf '%s\n' '* !diff !filter' > "$C/.git/info/attributes"
  git -C "$C" sparse-checkout set --no-cone "${SANS_CONSIGNES[@]}" || quitter 12 "clone de C4 : l'extraction sans consignes a échoué"
  git -C "$C" checkout -q --detach "$sommet" || quitter 12 "clone de C4 : le sommet ne s'extrait pas"
  o=$(consignes_dans "$C") || quitter 12 "consignes du clone de C4 illisibles"
  [ -z "$o" ] || quitter 14 "consignes de la PR sur le disque du clone de C4 :" "$o"
  # La valeur d'origin/HEAD du dossier de la session, gardée une fois par tour : un second passage ne la perd pas.
  if [ ! -f "$B/origin-head.txt" ]; then
    o=$(git symbolic-ref -q refs/remotes/origin/HEAD) || o=''
    printf '%s' "${o:+$o$'\n'}" > "$B/origin-head.txt"
  fi
  if git symbolic-ref -q refs/remotes/origin/HEAD > /dev/null; then git symbolic-ref -d refs/remotes/origin/HEAD; fi
  C=$(cd "$C" && pwd -P)
  dire "$C" > "$B/c4-dossier.txt"
  dire "clone de C4 prêt : $C"
}

c4_verifier() {
  lire_pr
  local ici C
  ici=$(pwd -P)
  C=$(cat "$B/c4-dossier.txt" 2> /dev/null) || quitter 12 "c4-dossier.txt absent : jouer c4 d'abord"
  [ "$ici" = "$C" ] || quitter 1 "le dossier courant n'est pas le clone de C4 : $ici"
  [ "$(git rev-parse HEAD)" = "$sommet" ] || quitter 1 "HEAD n'est pas le sommet relu"
  [ "$(git rev-parse origin/HEAD 2> /dev/null)" = "$(git -C "$S" rev-parse "origin/$base")" ] || quitter 1 "origin/HEAD n'est pas la base de la PR"
  git -c core.quotePath=false diff --name-only --no-renames origin/HEAD... | sort -u > "$B/securite.txt" || quitter 1 "« git diff origin/HEAD... » ne se lit pas"
  sort -u "$B/fichiers.txt" | comm -23 - "$B/securite.txt" > "$B/securite-manquants.txt"
  [ ! -s "$B/securite-manquants.txt" ] || quitter 1 "fichiers du diff relu que la commande ne lirait pas :" "$(cat "$B/securite-manquants.txt")"
  # Un fichier que le diff relu montre en texte ne doit pas être, pour la commande, un binaire dont elle ne lit que le nom.
  git -c core.quotePath=false diff --numstat --no-renames origin/HEAD... > "$B/securite-numstat.txt" || quitter 1 "« git diff --numstat origin/HEAD... » ne se lit pas"
  # Le texte du diff relu : la liste, moins ses binaires (aucun binaire tant que le diff relu ne les a pas nommés).
  sort -u "$B/fichiers.txt" > "$B/securite-liste.txt"
  if [ -f "$B/binaires.txt" ]; then cp "$B/binaires.txt" "$B/securite-binaires.txt"; else : > "$B/securite-binaires.txt"; fi
  awk -F'\t' '$1 == "-" && $2 == "-" { print $3 }' "$B/securite-numstat.txt" | sort -u | comm -12 - "$B/securite-liste.txt" | comm -23 - "$B/securite-binaires.txt" > "$B/securite-caches.txt" ||
    quitter 1 "les binaires de la commande ne se comparent pas au diff relu"
  [ ! -s "$B/securite-caches.txt" ] || quitter 1 "binaires pour la commande, texte pour le diff relu :" "$(cat "$B/securite-caches.txt")"
  ! git -C "$S" rev-parse -q --verify refs/remotes/origin/HEAD > /dev/null || quitter 1 "origin/HEAD se lit encore dans le dossier de la session"
  local o
  o=$(consignes_dans "$C") || quitter 1 "les consignes du clone ne se lisent pas"
  [ -z "$o" ] || quitter 1 "une consigne de la PR est sur le disque du clone"
  dire "vérification de C4 : faite, /security-review peut se lancer d'ici"
}

revenir() {
  lire_pr
  local ici o=''
  ici=$(pwd -P)
  cd "$S"
  [ ! -f "$B/origin-head.txt" ] || o=$(cat "$B/origin-head.txt")
  [ -z "$o" ] || git symbolic-ref refs/remotes/origin/HEAD "$o"
  rm -rf -- "$S/.relecture-securite"
  [ "$ici" = "$S" ] || quitter 1 "la session n'est pas revenue dans son dossier : elle est dans $ici"
  [ "$(git symbolic-ref -q refs/remotes/origin/HEAD || true)" = "$o" ] || quitter 1 "origin/HEAD n'est pas remis"
  o=$(git status --porcelain) || quitter 1 "l'état du dossier de la session ne se lit pas"
  [ -z "$o" ] || quitter 1 "le dossier de la session n'est pas propre"
  [ "$(git rev-parse HEAD)" = "$(git rev-parse "origin/$base")" ] || quitter 1 "le dossier de la session n'est plus sur la base"
  dire "revenue : le dossier de la session, sur la base, origin/HEAD remis, le clone retiré"
}

controle() {
  lire_pr
  local f
  case ${3:-} in
    verdict) f=$B/verdict.md ;;
    publie) f=$B/publie.md ;;
    *) quitter 12 "usage : controle '<brouillons>' verdict|publie" ;;
  esac
  [ -s "$f" ] || quitter 12 "$(basename -- "$f") absent"
  node --input-type=module -e 'import{readFileSync}from"node:fs";import{pathToFileURL}from"node:url";const{corpsLu,lireVerdict}=await import(pathToFileURL(process.argv[2]).href);const v=lireVerdict(corpsLu(readFileSync(process.argv[1],"utf8")));const d=!v?["marque absente en première ligne"]:v.illisible?v.defauts:v.verdict==="incomplet"&&v.bloquants>0?["incomplet avec des bloquants : un bloquant gardé donne refusé"]:[];if(d.length){console.log(d.join(" ; "));process.exit(1)}console.log(v.verdict,v.bloquants,v.tour,v.sommet,v.session,v.securite)' "$f" "$S/scripts/chaine/verdict.mjs"
}

ranger() {
  lire_pr
  cd "$S"
  git worktree remove --force "$A" || quitter 12 "l'arbre à part ne se retire pas"
  local e
  e=$(git status --porcelain) || quitter 1 "l'état du dossier de la session ne se lit pas"
  [ -z "$e" ] || quitter 1 "le dossier de la session n'est pas propre"
  dire "arbre à part retiré"
}

case $SOUS in
  etape2) etape2 "${@:3}" ;;
  liste) liste ;;
  diff) diff_relu ;;
  axes) axes ;;
  c1) c1 ;;
  garde) garde ;;
  contexte) contexte ;;
  accord) accord ;;
  lus) lus "$@" ;;
  tri) tri ;;
  montrer) montrer ;;
  c4) c4 ;;
  c4-verifier) c4_verifier ;;
  revenir) revenir ;;
  controle) controle "$@" ;;
  ranger) ranger ;;
  *) quitter 12 "sous-commande inconnue : ${SOUS:-aucune} (etape2, liste, diff, axes, c1, garde, contexte, accord, lus, tri, montrer, c4, c4-verifier, revenir, controle, ranger)" ;;
esac
