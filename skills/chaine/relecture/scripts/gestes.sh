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
#   diff '<brouillons>'           le diff relu, vérifié contre la liste ; ses lots au-delà de 2 000 lignes
#   axes '<brouillons>'           ce qui choisit les axes : revue exigée, chemins sensibles, ticket, binaires
#   c1 '<brouillons>'             l'empreinte, les index générés (C1), l'arbre remis, l'empreinte reprise
#   garde '<brouillons>'          l'empreinte reprise juste avant le premier axe
#   contexte '<brouillons>'       le contexte du ticket (axe Ticket), lu dans l'arbre à part
#   accord '<brouillons>'         la ligne `Sensibles:` du ticket, lue sur le sujet (C3)
#   lus '<brouillons>' <i> [<lot>]  ce que l'axe <i> a lu, comparé au diff relu
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

SOUS=${1:-}
trap 's=$?; printf "%s : sortie %s\n" "${SOUS:-gestes}" "$s"' EXIT
KIT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)
ARBRE_VIDE=4b825dc642cb6eb9a060e54bf8d69288fbee4904
# Les fichiers qu'une session charge comme consignes : jamais sur le disque d'un arbre qui porte la tête de la PR.
# Toute casse (un système de fichiers insensible à la casse lit `claude.md` comme `CLAUDE.md`), à toute profondeur,
# et tout dossier `.claude/`, sauf le contrat de la racine.
SANS_CONSIGNES=('/*' '![Cc][Ll][Aa][Uu][Dd][Ee].[Mm][Dd]' '![Cc][Ll][Aa][Uu][Dd][Ee].[Ll][Oo][Cc][Aa][Ll].[Mm][Dd]' '!.[Cc][Ll][Aa][Uu][Dd][Ee]/' '/.claude/chaine.json')

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
# Les fichiers de consigne sur le disque d'un arbre (`.claude/chaine.json` à sa racine mis à part).
consignes_dans() {
  local d=$1
  (cd "$d" && find . -path ./.git -prune -o \( -iname claude.md -o -iname claude.local.md -o -iname .claude \) -print) |
    { filtrer -vx './.claude'; } | sort
  if [ -d "$d/.claude" ]; then (cd "$d" && find ./.claude -mindepth 1 -print) | { filtrer -vx './.claude/chaine.json'; } | sort; fi
}
# Tout fichier de consigne que la session ou un axe peut charger : sous le dossier de la session et sous le
# scratchpad, et dans chaque dossier au-dessus d'eux. Un CLAUDE.md avec son empreinte, un `.claude/` par son nom.
consignes_autour() {
  local racine d
  for racine in "$S" "$(dirname -- "$(dirname -- "$B")")"; do
    find "$racine" \( -path "$S/.git" -o -path "$S/.relecture-securite" -o -path "$A/.git" \) -prune -o \
      \( -iname claude.md -o -iname claude.local.md \) -type f -print0 | sort -z |
      while IFS= read -r -d '' d; do printf '%s %s\n' "$(git hash-object -- "$d")" "$d"; done
    find "$racine" \( -path "$S/.git" -o -path "$S/.relecture-securite" \) -prune -o -iname .claude -print | sort
    d=$(dirname -- "$racine")
    while :; do
      for f in "$d/CLAUDE.md" "$d/CLAUDE.local.md" "$d/.claude/CLAUDE.md"; do
        [ ! -f "$f" ] || printf '%s %s\n' "$(git hash-object -- "$f")" "$f"
      done
      [ ! -d "$d/.claude" ] || dire "$d/.claude"
      [ "$d" != / ] || break
      d=$(dirname -- "$d")
    done
  done
}
# L'empreinte de ce que les axes recevront : les listes et les diffs du tour, le titre, le skill entier (prompts,
# critères, gabarit, ce script), les consignes autour, et l'état des deux dossiers.
empreinte() {
  local f
  for f in session.txt pr.txt fichiers.txt attendus.txt relus.txt diff.patch binaires.txt illisibles.txt sensibles.txt \
    binaires-sensibles.txt dispenses.txt hors.txt sans-ecart.txt ticket.txt titre.txt; do
    if [ -f "$B/$f" ]; then printf '%s %s\n' "$(git hash-object -- "$B/$f")" "$f"; else dire "absent $f"; fi
  done
  if [ -d "$B/lots" ]; then
    find "$B/lots" -type f -print0 | sort -z | while IFS= read -r -d '' f; do printf '%s %s\n' "$(git hash-object -- "$f")" "${f#"$B"/}"; done
  fi
  find "$KIT" -type f -print0 | sort -z | while IFS= read -r -d '' f; do printf '%s %s\n' "$(git hash-object -- "$f")" "${f#"$KIT"/}"; done
  consignes_autour
  dire "état de la session :"
  git -C "$S" status --porcelain
  dire "état de l'arbre :"
  git -C "$A" status --porcelain --ignored
  dire "consignes de l'arbre :"
  consignes_dans "$A"
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
  c=$(consignes_dans "$A")
  [ -z "$c" ] || quitter 14 "consignes de la PR sur le disque de l'arbre à part :" "$c"
  printf '%s\n%s\n%s\n' "$base" "$tete" "$sommet" > "$B/pr.txt"
  dire "{{BASE}} : $S" "{{ARBRE}} : $A" "étape 2 : faite"
}

liste() {
  lire_pr
  cd "$S"
  rm -f -- "$B/liste.faite" "$B/fichiers.txt" "$B/a-juger.txt" "$B/maj"
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
  rm -f -- "$B/diff.patch" "$B/stat.txt" "$B/attendus.txt" "$B/relus.txt" "$B/manquants.txt" "$B/binaires.txt" "$B/illisibles.txt"
  if [ ! -s "$B/fichiers.txt" ]; then
    : > "$B/attendus.txt"
    touch "$B/diff.fait"
    quitter 0 "aucun fichier à relire"
  fi
  # Aucun attribut git ne joue (l'arbre vide pour source), les chemins sans citation des accents, sans renommages.
  export GIT_ATTR_SOURCE=$ARBRE_VIDE GIT_CONFIG_COUNT=2 GIT_CONFIG_KEY_0=core.quotePath GIT_CONFIG_VALUE_0=false \
    GIT_CONFIG_KEY_1=diff.renames GIT_CONFIG_VALUE_1=false
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
  # Un binaire qui n'est ni une image, ni une police, ni une archive : du code ou un texte que git ne lit pas.
  { filtrer -Eiv '\.(png|jpe?g|gif|webp|avif|ico|bmp|tiff?|heic|woff2?|ttf|otf|eot|zip|gz|tgz|tar|bz2|xz|7z|jar)"?$' "$B/binaires.txt"; } > "$B/illisibles.txt"
  if [ -s "$B/manquants.txt" ]; then quitter 12 "manquent au diff relu :" "$(cat "$B/manquants.txt")"; fi
  lots
  touch "$B/diff.fait"
  [ -s "$B/attendus.txt" ] || dire "aucun axe"
  dire "diff relu : $(lignes "$B/relus.txt") fichiers, $(lignes "$B/diff.patch") lignes ; hors du diff : $(lignes "$B/hors.txt") ; sans écart : $(lignes "$B/sans-ecart.txt") ; binaires : $(lignes "$B/binaires.txt"), dont illisibles : $(lignes "$B/illisibles.txt")"
  if [ -s "$B/illisibles.txt" ]; then dire "binaires illisibles (ni image, ni police, ni archive) :" "$(cat "$B/illisibles.txt")"; fi
  dire "{{DIFF}} : $B/diff.patch"
}

# Au-delà de 2 000 lignes, des lots : par zone (`apps/<x>`, `packages/<x>`, sinon le premier dossier, la racine à
# part), une zone entière dans un lot quand elle tient, un fichier de plus de 2 000 lignes seul dans le sien. La machine
# découpe le diff relu lui-même, en-tête par en-tête : l'union des lots est vérifiée, fichier pour fichier et ligne
# pour ligne.
lots() {
  local total
  total=$(lignes "$B/diff.patch")
  [ "$total" -gt 2000 ] || return 0
  mkdir -p "$B/lots"
  awk -v sortie="$B/lots" -v plafond=2000 '
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
  ' "$B/diff.patch"
  local n i d
  n=$(cat "$B/lots/nombre")
  if [ "$n" = 1 ]; then
    rm -rf -- "$B/lots"
    dire "un seul fichier, de plus de 2 000 lignes : un seul lot, le diff relu entier"
    return 0
  fi
  : > "$B/lots/union.txt"
  for i in $(seq 1 "$n"); do
    d=$B/lots/lot-$i
    mkdir -p -- "$d"
    mv -- "$B/lots/$i.patch" "$d/diff.patch"
    mv -- "$B/lots/$i.attendus" "$d/attendus.txt"
    [ -s "$d/diff.patch" ] || quitter 12 "lots : le lot $i est vide"
    sort -u "$d/attendus.txt" -o "$d/attendus.txt"
    relus_de "$d/diff.patch" > "$d/relus.txt"
    cmp -s "$d/attendus.txt" "$d/relus.txt" || quitter 12 "lots : le lot $i ne porte pas ses fichiers"
    comm -12 "$d/relus.txt" "$B/binaires.txt" > "$d/binaires.txt"
    cat "$d/relus.txt" >> "$B/lots/union.txt"
  done
  [ -z "$(sort "$B/lots/union.txt" | uniq -d)" ] || quitter 12 "lots : un fichier est dans deux lots"
  sort -u "$B/lots/union.txt" | cmp -s - "$B/relus.txt" || quitter 12 "lots : leur union n'est pas le diff relu"
  [ "$(cat "$B"/lots/lot-*/diff.patch | wc -l | tr -d ' ')" = "$total" ] || quitter 12 "lots : leurs lignes ne font pas le diff relu"
  rm -f -- "$B/lots/union.txt" "$B/lots/nombre"
  for i in $(seq 1 "$n"); do dire "lot $i : $(lignes "$B/lots/lot-$i/relus.txt") fichiers, $(lignes "$B/lots/lot-$i/diff.patch") lignes, {{DIFF}} : $B/lots/lot-$i/diff.patch"; done
  dire "lots : $n"
}

axes() {
  lire_pr
  cd "$S"
  [ -f "$B/diff.fait" ] || quitter 12 "diff relu absent : jouer diff d'abord"
  [ -s "$B/fichiers.txt" ] || quitter 0 "aucun fichier à relire : ni axe, ni C3, ni C4"
  [ -s "$B/titre.txt" ] || quitter 12 "titre.txt absent : l'écrire par l'outil d'écriture de fichier"
  local s=0 ticket
  node "$S/scripts/chaine/revue-exigee.mjs" '' '' "origin/$base" < "$B/fichiers.txt" > /dev/null 2> "$B/revue-exigee.err" || s=$?
  case $s in
    0) dire "revue exigée : non" ;;
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
  dire "chemins sensibles : $(lignes "$B/sensibles.txt")"
  [ ! -s "$B/sensibles.txt" ] || cat "$B/sensibles.txt"
  dire "ticket : ${ticket:-aucun}" "binaires sous un chemin sensible : $(lignes "$B/binaires-sensibles.txt")"
  [ ! -s "$B/binaires-sensibles.txt" ] || cut -f1 "$B/binaires-sensibles.txt"
  dire "binaires illisibles : $(lignes "$B/illisibles.txt")"
}

c1() {
  lire_pr
  cd "$S"
  [ -f "$B/diff.fait" ] || quitter 12 "diff relu absent : jouer diff d'abord"
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
  [ -f "$B/sensibles.txt" ] || quitter 12 "sensibles.txt absent : jouer axes d'abord"
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
  if [ -n "$lot" ]; then
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
        git diff "$fusion^1...$fusion^2" -- ":(literal)$reel" > "$B/tri-$n.diff" 2> /dev/null || s=$?
        if [ "$s" = 0 ] && grep -Fxq -- "-$texte" "$B/tri-$n.diff"; then dire "$n : écarté, develop retire seul cette ligne"; else dire "$n : gardé"; fi
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
  git -C "$C" sparse-checkout set --no-cone "${SANS_CONSIGNES[@]}" || quitter 12 "clone de C4 : l'extraction sans consignes a échoué"
  git -C "$C" checkout -q --detach "$sommet" || quitter 12 "clone de C4 : le sommet ne s'extrait pas"
  o=$(consignes_dans "$C")
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
  ! git -C "$S" rev-parse -q --verify refs/remotes/origin/HEAD > /dev/null || quitter 1 "origin/HEAD se lit encore dans le dossier de la session"
  [ -z "$(consignes_dans "$C")" ] || quitter 1 "une consigne de la PR est sur le disque du clone"
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
  [ -z "$(git status --porcelain)" ] || quitter 1 "le dossier de la session n'est pas propre"
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
  [ -z "$(git status --porcelain)" ] || quitter 1 "le dossier de la session n'est pas propre"
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
