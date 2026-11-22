#!/usr/bin/env bash
# E10 : dépôt neuf (recyclage : git-common-dir neuf). E11 : chaque contenu possible de veille.etat, avec et sans
# fichier d'arrêt, avec et sans verrou tenu. E12 : --etat sur une copie d'avant le ticket.
# usage : e10-e12-etats.sh <veille.sh> <veille.sh d'avant>
V=$1; VIEUX=$2; ICI=$(cd "$(dirname "$0")" && pwd)
E=$TMPDIR/e1012.$$; rm -rf "$E"; "$ICI/jouet.sh" "$E" "$V" >/dev/null; source "$ICI/env.sh" "$E"; cd "$E/clone"
echo "E10 dépôt neuf, aucune trace : $(etat | tr '\n' ' ')"
echo "    fichiers écrits par --etat : $(cd .git && ls veille.* 2>/dev/null | tr '\n' ' ')"
ici=$(date +%s)
for contenu in "" "lancee" "lancee $ici" "lancee x" "fin" "fin $ici" "fin $ici VEILLE FINIE 12:00" "fin x VEILLE FINIE" "autre $ici z" $'\x00\x01binaire' "lancee $ici
fin $ici VEILLE FINIE 12:00"; do
  printf '%s\n' "$contenu" > .git/veille.etat
  for arret in non oui; do
    rm -f .git/boucle-arret; [ $arret = non ] || date +%FT%T > .git/boucle-arret
    for verrou in libre tenu; do
      if [ $verrou = tenu ]; then
        flock .git/veille.verrou bash -c "cd '$E/clone' && env -u CAPITAINE_ID bash '$E/veille.sh' --etat; echo \"[sortie \$?]\"" > "$E/o" 2>&1
      else etat > "$E/o" 2>&1; fi
      printf 'E11 %-34s arrêt=%-3s verrou=%-5s -> %s\n' "$(printf '%q' "$contenu" | cut -c1-34)" $arret $verrou "$(tr '\n' ' ' < "$E/o" | cut -c1-110)"
    done
  done
done
rm -f .git/boucle-arret .git/veille.etat
cp "$VIEUX" "$E/vieux.sh"
echo "E12 copie d'avant le ticket, --etat sans CAPITAINE_ID : $( (env -u CAPITAINE_ID bash "$E/vieux.sh" --etat; echo "[sortie $?]") 2>&1 | tr '\n' ' ')"
echo "E12 copie d'avant le ticket, --reprendre : $( (timeout 5 bash "$E/vieux.sh" --reprendre; echo "[sortie $?]") 2>&1 | tr '\n' ' ')"
rm -rf "$E"
