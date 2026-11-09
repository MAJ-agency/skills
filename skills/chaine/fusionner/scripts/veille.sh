#!/usr/bin/env bash
# =============================================================================
# Veille du capitaine : la file de fusion reprend d'elle-même (skill /fusionner).
# `boucle.sh` s'arrête sur FILE VIDE ; une PR étiquetée `à-fusionner` ensuite n'est vue par
# personne. La veille lance la boucle, puis sonde la file (une lecture GitHub, pas de CI) toutes
# les `pause` secondes et relance la boucle dès qu'une PR est « prête » ou « CI rouge ». Une PR
# « CI en cours », « attend », « bloquée » ou en brouillon ne relance rien.
#
# Une PR que la boucle vient de sauter reste « prête » : on ne relance que si la file contient
# une ligne (numéro + état) absente de l'ensemble vu au dernier lancement ou à la dernière sonde.
# « prête (sans CI) » est un état à part : la boucle met de côté une PR sans CI après 5 min, et la
# CI arrive parfois plus tard. Quand elle arrive (la ligne passe à prête ou rouge), c'est un
# changement d'état : la boucle est relancée, sans attendre une fusion qui peut ne jamais venir.
# Une boucle qui sort en code non nul (ARRÊT : gates, install, CI bloquée) arrête la veille avec
# le même code : le capitaine traite, puis relance. À l'échéance : VEILLE FINIE, sortie 0.
# Journal : « VEILLE <hh:mm> : file vide » au plus toutes les 10 min.
#
# Usage, en tâche de fond, depuis le worktree du capitaine, scripts copiés hors du worktree :
#   bash <copie>/veille.sh [--pause <s>] [--duree <min>] > <journal> 2>&1   (défauts 120 s, 110 min)
# Borné sous la limite de 2 h d'une tâche de fond ; VEILLE FINIE ou VEILLE ARRÊTÉE réveille la session.
# =============================================================================
outils=$(cd "$(dirname "$0")" && pwd)

pause=120
duree=110
while [ $# -gt 0 ]; do
  case "$1" in
    --pause) pause=${2:?--pause attend des secondes}; shift 2 ;;
    --duree) duree=${2:?--duree attend des minutes}; shift 2 ;;
    *) echo "usage : veille.sh [--pause <s>] [--duree <min>]" >&2; exit 64 ;;
  esac
done
fin=$(awk -v d="$duree" 'BEGIN { printf "%d", d * 60 }')

heure() { date +%H:%M; }

# Lance la boucle ; un code non nul arrête la veille avec ce code.
lancer() {
  bash "$outils/boucle.sh"
  local rc=$?
  if [ "$rc" != 0 ]; then
    echo "VEILLE ARRÊTÉE $(heure) : la boucle est sortie en $rc"
    exit "$rc"
  fi
}

# Lignes « numéro état » des PR à traiter (prêtes ou rouges), triées.
etat_file() {
  local sortie
  sortie=$(bash "$outils/file.sh" 2>/dev/null) || return 1
  printf '%s\n' "$sortie" | awk -F '\t' '
    $2 ~ /CI rouge/ { print $1 " rouge"; next }
    $2 ~ /sans CI/  { print $1 " sans-ci"; next }
    $2 ~ /prête/    { print $1 " prête" }' | sort
}

SECONDS=0
vu=$(etat_file || true)
lancer
dernier_journal=-600
while [ "$SECONDS" -lt "$fin" ]; do
  sleep "$pause"
  [ "$SECONDS" -lt "$fin" ] || break
  if ! actuel=$(etat_file); then
    echo "VEILLE $(heure) : lecture de la file impossible, sonde sautée"
    continue
  fi
  if [ -z "$actuel" ]; then
    vu=""
    if [ $((SECONDS - dernier_journal)) -ge 600 ]; then
      echo "VEILLE $(heure) : file vide"
      dernier_journal=$SECONDS
    fi
    continue
  fi
  # Une ligne absente de l'ensemble vu : PR nouvelle, ou changée d'état.
  nouveau=$(comm -13 <(printf '%s\n' "$vu") <(printf '%s\n' "$actuel"))
  vu=$actuel
  if [ -n "$nouveau" ]; then
    echo "VEILLE $(heure) : file à traiter ($(printf '%s' "$nouveau" | tr '\n' ',' | sed 's/,$//')), boucle relancée"
    lancer
  fi
done
echo "VEILLE FINIE $(heure)"
exit 0
