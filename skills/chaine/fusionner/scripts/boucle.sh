#!/usr/bin/env bash
# =============================================================================
# Passe la file de fusion jusqu'à ce qu'elle soit vide (skill /fusionner).
# Avant chaque passage, une PR dont la CI est rouge sur son sommet (`file.sh --rouges`) voit
# ses jobs rouges relancés une fois (instabilité), puis est renvoyée s'ils retombent.
# Un refus corrigeable par l'auteur (sortie 4 : titre, revue…) renvoie la PR avec son motif
# (refus.sh) ; une PR non éligible sans correction possible (sortie 7) est sautée ; une PR sans CI déclenchée (sortie 3, déjà à jour,
# rien à pousser) est mise de côté jusqu'à la prochaine fusion, dont la mise à jour la poussera
# et lancera sa CI. La sortie 5 (develop ou la PR a bougé)
# a droit à un second essai. Un conflit (sortie 2) renvoie la PR ; des checks rouges au
# passage (sortie 3) la laissent rouge dans la file : relance au tour suivant, puis renvoi.
# Tout autre code arrête la boucle (gates des registres, install, CI bloquée) : le capitaine
# traite, puis relance.
#
# Branches de sujet : à chaque tour, avant la PR suivante vers develop,
# `traiter_sujets` regroupe d'office les séries par spec et les piles (`sujet.sh
# regrouper-series`, REGROUPÉE), fait passer les sous-PR (squash dans le sujet, quelques secondes), recible
# sur son sujet une PR dont le ticket en déclare un, et une PR empilée dont la parente est
# entrée dans un sujet. Au début et à la fin, `rafraichir_sujets` fusionne develop dans chaque
# sujet non livré SANS sous-PR ouverte : bouger la tête d'un sujet sous ses sous-PR les remettait
# en conflit avant leur passage (cas vécu). Un sujet actif est mis à jour par sa livraison
# (passer.sh) ou par `sujet.sh fusionner` quand une sous-PR apporte du develop plus récent.
# Un conflit est annulé et signalé (SUJET EN CONFLIT), jamais résolu ici : une session le
# résout avec `sujet.sh rafraichir <nom>`.
# Un sujet « prêt à livrer » (plus de sous-PR, tickets faits) est livré par `sujet.sh
# livrer-prets` (LIVRÉ), sauf label `sujet-manuel` sur une de ses sous-PR. La PR finale passe
# par un commit de merge (passer.sh) : develop garde un commit par sous-PR.
# Regroupement d'office (`regrouper-series`) : une série de PR vers develop qui citent la même
# spec rejoint le sujet qui en contient déjà une, ou ouvre `sujet/<spec>` à partir de 3 PR ; une
# pile de 2 PR ou plus ouvre `sujet/pile-<racine>`. Jamais une série qui compte une PR
# `prio:haute`, ni une PR `hors-sujet` ; une série dont aucune PR ne vise develop ne bouge pas.
#
# Ordre de la file (file.sh) : sous-PR de sujet (quelques secondes), livraisons de sujet (une PR
# qui en vaut N, `prio:haute` comprise), `prio:haute`, puis numéro.
# Fin de boucle : FILE VIDE, puis SUJETS (`sujet.sh etat`) et SÉRIES restantes (préfixe de
# branche, `prio:haute`), que le capitaine propose à l'utilisateur (`sujet.sh regrouper <nom>
# <pr>…`) : regrouper une série non déclarée retarde sa recette, l'utilisateur tranche.
#
# Usage, depuis le worktree du capitaine, scripts copiés hors du worktree :
#   bash <copie>/boucle.sh > <journal> 2>&1
# À la main, pour une PR vers develop (la boucle arrêtée : deux processus dans le worktree le
# laissent en pleine fusion) :
#   1. `file.sh` montre la file ; `n=$(file.sh --next)` donne la suivante vers develop, jamais
#      une sous-PR de sujet (celles-ci passent par `sujet.sh fusionner <pr>`) ; file vide : fin ;
#   2. `passer.sh $n` en arrière-plan (10 à 15 min avec les E2E, quelques minutes pour de la
#      doc), attendre la notification sans sonder ; la suite selon le code de sortie est dans
#      l'en-tête de passer.sh ; reprendre en 1.
# =============================================================================
outils=$(cd "$(dirname "$0")" && pwd)
. "$outils/github.sh"

# CI rouge sur le sommet d'une PR de la file : une relance des jobs rouges, puis renvoi.
# Tous les workflows du sommet comptent : « Secret Detection » vit dans « Security Scan », pas
# dans « CI » (cas vécu : quatre PR restées rouges, jamais relancées ni renvoyées).
traiter_rouges() {
  local n checks sommet runs id tentative relance
  bash "$outils/file.sh" --rouges | while IFS="$(printf '\t')" read -r n checks; do
    sommet=$(pr_sommet "$n") || continue
    runs=$(gh api "$DEPOT/actions/runs?head_sha=$sommet&per_page=50" \
      --jq '.workflow_runs[] | select(.conclusion == "failure") | "\(.id) \(.run_attempt)"' 2>/dev/null) || continue
    [ -n "$runs" ] || continue # runs encore en cours, ou API muette : on reverra au prochain tour
    relance=0
    while read -r id tentative; do
      if [ "${tentative:-1}" -lt 2 ]; then
        gh api -X POST "$DEPOT/actions/runs/$id/rerun-failed-jobs" >/dev/null 2>&1 && relance=1
      fi
    done <<<"$runs"
    if [ "$relance" = 1 ]; then
      echo "[#$n] RELANCE des jobs rouges ($checks)"
    else
      bash "$outils/renvoyer.sh" "$n" "CI rouge sur le sommet de la PR, aussi à la relance : $checks"
    fi
  done
}

SUJET="$outils/sujet.sh"
[ -f "$SUJET" ] || SUJET="$outils/../../sujet/scripts/sujet.sh"

# develop dans chaque sujet ni livré (sa PR vers develop, passer.sh la tient à jour) ni actif
# (une sous-PR ouverte : la mise à jour la remettrait en conflit avec la nouvelle tête).
rafraichir_sujets() {
  local nom sous verdict
  bash "$SUJET" etat 2>/dev/null | tail -n +2 | while IFS="$(printf '\t')" read -r nom _ _ sous _ verdict; do
    case "$verdict" in livré*) continue ;; esac
    [ "$sous" = "—" ] || continue
    bash "$SUJET" rafraichir "$nom" --abandon-si-conflit 2>&1 | sed "s#^#[sujet/$nom] #"
    [ "${PIPESTATUS[0]}" = 0 ] ||
      echo "[sujet/$nom] SUJET EN CONFLIT avec develop : à résoudre par une session (sujet.sh rafraichir $nom)"
  done
  git switch -q --detach origin/develop 2>/dev/null || true
}

# Sous-PR et reciblages : rapides, faits avant chaque passage vers develop.
traiter_sujets() {
  local n etat sujet rc
  # Séries par spec et piles : regroupées d'office (hors prio:haute et hors-sujet).
  bash "$SUJET" regrouper-series 2>&1 | sed 's#^série #[sujets] REGROUPÉE série #; s#^#  #'
  bash "$outils/file.sh" | while IFS="$(printf '\t')" read -r n etat _; do
    case " $sautees " in *" $n "*) continue ;; esac
    case "$etat" in
      'vers sujet/'*)
        sujet=${etat#vers sujet/}
        bash "$SUJET" regrouper "$sujet" "$n" 2>&1 | sed "s#^#[\#$n] #"
        if [ "${PIPESTATUS[0]}" = 0 ]; then echo "[#$n] REGROUPÉE dans sujet/$sujet (son ticket le déclare)"
        else echo "[#$n] regroupement dans sujet/$sujet impossible (SUJET EN CONFLIT ?)"; fi ;;
      'prête (à recibler sur sujet/'*)
        sujet=${etat#prête (à recibler sur }
        sujet=${sujet%)}
        gh api -X PATCH "$DEPOT/pulls/$n" -f base="$sujet" >/dev/null && echo "[#$n] RECIBLÉE sur $sujet (parente fusionnée dedans)" ;;
      sujet/*': prête (sans CI)')
        bash "$SUJET" relancer "$n" 2>&1 | sed "s#^#[\#$n] #"
        rc=${PIPESTATUS[0]}
        [ "$rc" != 2 ] || bash "$outils/renvoyer.sh" "$n" "conflit avec ${etat%%:*} : fusionner ${etat%%:*} dans la branche et le résoudre" ;;
      sujet/*': prête')
        bash "$SUJET" fusionner "$n" 2>&1 | tee "$sortie" | sed "s#^#[\#$n] #"
        rc=${PIPESTATUS[0]}
        case "$rc" in
          0) echo "[#$n] FUSIONNÉE dans ${etat%%:*}" ;;
          3) bash "$outils/renvoyer.sh" "$n" "fusion dans ${etat%%:*} refusée par GitHub (conflit avec le sujet) : fusionner ${etat%%:*} dans la branche et le résoudre" ;;
          4) bash "$outils/refus.sh" "$n" "$sortie" ;; # corrigeable (titre, revue, base) : renvoyée
          7) echo "[#$n] sous-PR non éligible (fermée ou en brouillon)" ;;
          *) echo "[#$n] sous-PR non éligible (sortie $rc)" ;;
        esac ;;
    esac
  done
  # Sujets finis : PR finale ouverte, elle entre dans la file au tour suivant.
  bash "$SUJET" livrer-prets 2>&1 | sed 's#^#[sujets] #; s#PR \(\#[0-9]*\) ouverte#LIVRÉ : PR \1 ouverte#'
  git switch -q --detach origin/develop 2>/dev/null || true
}

# Sortie de passer.sh gardée pour lire la cause (fichiers en conflit, checks rouges).
sortie=$(mktemp)
trap 'rm -f "$sortie"' EXIT
passer() {
  bash "$outils/passer.sh" "$1" 2>&1 | tee "$sortie"
  return "${PIPESTATUS[0]}"
}

sautees=' '
# Sans CI déclenchée : mises de côté jusqu'à la prochaine fusion (develop aura bougé).
attente_fusion=' '
rafraichir_sujets
while :; do
  traiter_rouges
  traiter_sujets
  n=$(bash "$outils/file.sh" | awk -F '\t' -v s="$sautees$attente_fusion" '!t && $2 ~ /^prête/ && $2 !~ /sur sujet\// && index(s, " " $1 " ") == 0 { print $1; t = 1 }')
  [ -n "$n" ] || break
  echo "[#$n] DÉBUT $(date +%H:%M)"
  passer "$n"
  rc=$?
  if [ "$rc" = 1 ]; then
    # Erreur inattendue (souvent un 502 passager de l'API GitHub) : un second essai.
    echo "[#$n] erreur inattendue, second essai dans 30 s"
    sleep 30
    passer "$n"
    rc=$?
  fi
  if [ "$rc" = 5 ]; then
    echo "[#$n] a bougé, second essai"
    passer "$n"
    rc=$?
  fi
  echo "[#$n] sortie=$rc $(date +%H:%M)"
  case "$rc" in
    0) attente_fusion=' ' ;;
    2)
      fichiers=$(awk '/conflit avec develop hors index générés/ { f = 1; next } f && /^  / { sub(/^  /, ""); printf "%s`%s`", (n++ ? ", " : ""), $0 }' "$sortie")
      # Renvoyée, la PR perd `à-fusionner` : elle sort de la file d'elle-même et y revient,
      # dans ce même tour, dès que sa session la corrige. Sautée seulement si le renvoi échoue.
      bash "$outils/renvoyer.sh" "$n" "conflit avec develop à la mise à jour (hors index générés et hors règle de pile) : $fichiers. Fusionner develop dans la branche et le résoudre" ||
        sautees="$sautees$n " ;;
    3)
      if grep -q 'checks exigés rouges' "$sortie"; then
        # Rouge sur le sommet poussé : `traiter_rouges` relance, puis renvoie au second échec.
        echo "[#$n] checks rouges au passage : relance au prochain tour"
      elif grep -q 'CI non déclenchée' "$sortie"; then
        echo "[#$n] sans CI : de côté jusqu'à la prochaine fusion"
        attente_fusion="$attente_fusion$n "
      else
        echo "ARRÊT sur #$n (sortie $rc)"; exit "$rc"
      fi ;;
    4)
      # Refus que l'auteur peut corriger (titre, revue adversariale…) : la session est prévenue
      # avec le motif, la PR ne reste pas en file muette (#1414). Sautée si le renvoi échoue.
      bash "$outils/refus.sh" "$n" "$sortie" || sautees="$sautees$n " ;;
    7) sautees="$sautees$n " ;; # rien à corriger côté auteur (empilée, brouillon, déjà renvoyée)
    *) echo "ARRÊT sur #$n (sortie $rc)"; exit "$rc" ;;
  esac
done
rafraichir_sujets
attente=$(bash "$outils/file.sh" | awk -F '\t' '$2 ~ /CI en cours$/ { printf " #%s", $1 }')
echo "FILE VIDE $(date +%H:%M)${attente:+ (CI en cours :$attente)}"
# Pour le compte rendu : sujets prêts à livrer, et séries de la file à proposer au regroupement.
echo "SUJETS"; bash "$SUJET" etat 2>/dev/null || true
echo "SÉRIES restantes (préfixe de branche ou prio:haute : à proposer, sujet.sh regrouper <nom> <pr>…)"; bash "$SUJET" series 2>/dev/null || true
