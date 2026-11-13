#!/usr/bin/env bash
# =============================================================================
# File de fusion (skill /fusionner) : PR ouvertes portant le label `à-fusionner`,
# dans l'ordre de passage — sous-PR de sujet, livraisons de sujet, `prio:haute`, puis numéro croissant.
#
# La session pose le label dès le push (CLAUDE.md § Fusion) : la file lit la CI de la PR.
# État de chaque PR :
#   prête               base = develop, checks exigés verts sur son sommet
#   prête (sans CI)     base = develop, aucun check sur le sommet : le passage la lancera
#   CI en cours         base = develop, un check exigé n'a pas encore conclu : attendue
#   CI rouge : <checks> base = develop, un check exigé a échoué : boucle.sh relance les jobs
#                       rouges une fois, puis renvoie la PR s'ils retombent
#   prête (à recibler)  empilée sur une PR déjà fusionnée : passer.sh la recible (sa CI
#                       ne tourne qu'à ce moment-là, les PR vers une autre base n'en ont pas)
#   attend #N           empilée sur la PR #N, encore ouverte
#   bloquée / brouillon label `fusion-bloquée` ou PR en brouillon : sautée
#   gelée               PR d'un sujet gelé (`Gel:` non vide dans sa carte, `sujet.sh gel`) : sous-PR, PR à recibler
#                       ou livraison du sujet. Ni passée, ni relancée, ni renvoyée, ni reciblée ; le gel prime
#                       sur « humain », qui revient au dégel
#   humain              PR déjà renvoyée autant de fois que le plafond (`plafonds.renvoisParPR`, 3 ; les
#                       renvois se comptent par leur marque, github.sh) : ni passée, ni relancée, ni renvoyée.
#                       Un humain décide, puis le capitaine la passe à la main (passer.sh <n>)
#   sujet/<nom> : …     sous-PR d'une branche de sujet , mêmes états de CI que
#                       ci-dessus (« sujet/x : prête », « sujet/x : CI rouge : … ») ; une sous-PR
#                       prête passe en premier : squash dans le sujet (`sujet.sh fusionner`), sans
#                       mise à jour ni E2E, quelques secondes. Sans CI : `sujet.sh relancer`.
#   vers sujet/<nom>    vise develop, mais son ticket déclare `Sujet: sujet/<nom>` : boucle.sh la
#                       recible (`sujet.sh regrouper`), sauf label `hors-sujet`
#   (4e colonne « sujet livré : <nom> » : le ticket déclare un sujet déjà livré ; la PR est classée
#                       comme une PR directe, boucle.sh lui pose `hors-sujet`)
#   prête (à recibler sur sujet/<nom>)
#                       empilée sur une PR déjà fusionnée dans un sujet : boucle.sh la recible
# Sur un push de session, la branche est en retard sur develop : les E2E sont sautés
#  et tournent au passage, que passer.sh attend. « prête » veut dire : la CI
# légère est verte.
#
# Usage : bash scripts/chaine/file.sh          → tableau
#         bash scripts/chaine/file.sh --next   → numéro de la prochaine PR (sortie 1 si aucune)
#         bash scripts/chaine/file.sh --rouges → « numéro<TAB>checks rouges », une par ligne
# =============================================================================
set -euo pipefail
outils=$(cd "$(dirname "$0")" && pwd)
. "$outils/github.sh"
# sujet.sh : à côté (scripts/chaine/, ou copie des outils du capitaine), sinon dans le skill sujet.
SUJET=$outils/sujet.sh
[ -f "$SUJET" ] || SUJET=$outils/../../sujet/scripts/sujet.sh
cd "$(git rev-parse --show-toplevel)"
plafond=$(plafond_renvois)

prs=$(gh api --paginate "$DEPOT/pulls?state=open&per_page=100" --jq '.[] | {number, title, draft,
  head: .head.ref, sommet: .head.sha, base: .base.ref, labels: [.labels[].name]}' | jq -s .)
ouvertes=$(jq -r '.[] | "\(.head) \(.number)"' <<<"$prs")
# Checks exigés, lus dans la protection de develop (comme passer.sh) : un check d'un autre
# workflow, non exigé, ne retient pas la file.
requis=$(checks_exiges)
# Tickets qui déclarent un sujet (« ticket<TAB>nom ») : une PR qui en cite un et vise develop
# est reciblée sur le sujet.
carte=$(bash "$SUJET" carte 2>/dev/null || true)

# CI d'une PR sur son sommet : « vert », « en cours », « rouge : <checks> » ou « sans CI ».
# « Sans CI » = aucun check EXIGÉ posé : un check d'une appli tierce (Aikido) ne prouve pas que
# la CI a démarré (#832, #834, #836 : push perdu, lues « en cours » pendant 2 h).
ci_jq='
  [inputs | split("\t") | {key: .[0], value: .[1]}]
  | from_entries as $c
  | ($requis | map(select(($c[.] // "") | test("^(FAILURE|CANCELLED|TIMED_OUT|ACTION_REQUIRED|STARTUP_FAILURE|ERROR)$")))) as $rouges
  | if ([$requis[] | select($c[.] != null)] | length) == 0 then "sans CI"
    elif ($rouges | length) > 0 then "rouge : " + ($rouges | join(", "))
    elif all($requis[]; ($c[.] // "") | test("^(SUCCESS|SKIPPED|NEUTRAL)$")) then "vert"
    else "en cours" end'

# Ordre : sous-PR de sujet d'abord (squash en quelques secondes), puis livraisons de sujet (une
# PR qui en vaut N : tête `sujet/<nom>`, ou livraison intermédiaire `livraison/<nom>-<AAAAMMJJ-HHMM>`
# de sujet.sh livrer), puis prio:haute, puis numéro. L'ordre seul : passer.sh vérifie qu'une
# livraison intermédiaire vient bien de son sujet avant de la dispenser de revue.
jq -r '.[] | select(any(.labels[]; . == "à-fusionner")) | [
    (if (.base | startswith("sujet/")) then 0
     elif (.head | startswith("sujet/")) or (.head | test("^livraison/.+-[0-9]{8}-[0-9]{4}$")) then 1
     elif any(.labels[]; . == "prio:haute") then 2 else 3 end),
    .number, .sommet, .base, .draft,
    any(.labels[]; . == "fusion-bloquée"),
    any(.labels[]; . == "hors-sujet"),
    .head, .title
  ] | @tsv' <<<"$prs" |
  sort -t "$(printf '\t')" -k1,1n -k2,2n |
  while IFS="$(printf '\t')" read -r prio n sommet base brouillon bloquee hors_sujet tete titre; do
    ci_de() {
      local ci
      ci=$(checks_commit "$sommet" | jq -Rnr --argjson requis "$requis" "$ci_jq")
      case "$ci" in
        vert) echo 'prête' ;;
        'sans CI') echo 'prête (sans CI)' ;;
        rouge*) echo "CI $ci" ;;
        *) echo 'CI en cours' ;;
      esac
    }
    # Ticket cité (titre ou branche) → sujet déclaré.
    ticket=$(identifiant ticket-de-pr "$titre" "$tete" </dev/null)
    sujet_ticket=''
    if [ -n "$ticket" ]; then
      sujet_ticket=$(awk -F '\t' -v t="$ticket" -v s="${ticket%.*}" '$1 == t { print $2; f = 1; exit }
        $1 == s { sp = $2 } END { if (!f && sp != "") print sp }' <<<"$carte")
    fi
    # Sujet déclaré déjà livré dans develop : la PR est directe, jamais reciblée ;
    # 4e colonne pour que boucle.sh pose `hors-sujet` (file.sh ne fait que lire).
    livre=''
    if [ -n "$sujet_ticket" ] && [ "$hors_sujet" = false ] && bash "$SUJET" livre "$sujet_ticket" 2>/dev/null; then
      livre=$sujet_ticket
      sujet_ticket=''
    fi
    # Sujet de la PR, pour le gel : sous-PR (base), livraison (tête `sujet/<nom>` ou
    # `livraison/<nom>-<date>`), PR à recibler (ticket qui déclare le sujet, sauf `hors-sujet`).
    cible=''
    if [[ "$base" == sujet/* ]]; then cible=${base#sujet/}
    elif [[ "$tete" == sujet/* ]]; then cible=${tete#sujet/}
    elif [[ "$tete" =~ ^livraison/(.+)-[0-9]{8}-[0-9]{4}$ ]]; then cible=${BASH_REMATCH[1]}
    elif [ -n "$sujet_ticket" ] && [ "$hors_sujet" = false ]; then cible=$sujet_ticket
    fi
    if [ "$brouillon" = true ]; then
      etat='brouillon'
    elif [ "$bloquee" = true ]; then
      etat='bloquée'
    elif [ -n "$cible" ] && bash "$SUJET" gel "$cible" >/dev/null 2>&1; then
      etat='gelée'
    elif [ "$(renvois_de "$n")" -ge "$plafond" ]; then
      etat='humain'
    elif [[ "$base" == sujet/* ]]; then
      etat="$base : $(ci_de)"
    elif [ "$base" = develop ] && [ -n "$sujet_ticket" ] && [ "$hors_sujet" = false ]; then
      etat="vers sujet/$sujet_ticket"
    elif [ "$base" = develop ]; then
      # Sans CI (workflow pas déclenché) : le push du capitaine la lancera.
      etat=$(ci_de)
    else
      parente=$(printf '%s\n' "$ouvertes" | awk -v b="$base" '$1 == b { print $2 }')
      if [ -n "$parente" ]; then
        etat="attend #$parente"
      else
        # Parente fusionnée : dans develop (passer.sh recible) ou dans un sujet (boucle.sh recible).
        base_parente=$(gh api "$DEPOT/pulls?state=closed&per_page=1&head={owner}:$(uri "$base")" --jq '.[0].base.ref // ""')
        if [[ "$base_parente" == sujet/* ]]; then etat="prête (à recibler sur $base_parente)"; else etat='prête (à recibler)'; fi
      fi
    fi
    [ "$prio" = 2 ] && titre="[prio:haute] $titre"
    printf '%s\t%s\t%s\t%s\n' "$n" "$etat" "$titre" "${livre:+sujet livré : $livre}"
  done |
  case "${1:-}" in
    # Lit tout (pas d'`exit` au premier trouvé) : sous pipefail, l'amont tué par SIGPIPE ferait sortir en 141.
    --next) awk -F '\t' '!trouve && $2 ~ /^prête/ { print $1; trouve = 1 } END { exit !trouve }' ;;
    --rouges) awk -F '\t' '$2 ~ /CI rouge : / { sub(/^.*CI rouge : /, "", $2); print $1 "\t" $2 }' ;;
    *) cat ;;
  esac
