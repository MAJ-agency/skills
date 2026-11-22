#!/usr/bin/env bash
# E7 : un --etat lancé pendant le démarrage d'une veille seule la fait-il refuser (sortie 9) ?
# E8 : un --etat lancé pendant la fin d'une veille rend-il VEILLE MORTE ? usage : e7-e8-courses.sh <veille.sh>
V=$1; ICI=$(cd "$(dirname "$0")" && pwd)
E=$TMPDIR/e78.$$; rm -rf "$E"; "$ICI/jouet.sh" "$E" "$V" >/dev/null; source "$ICI/env.sh" "$E"; cd "$E/clone"
n9=0; : > "$E/vus"
for i in $(seq 40); do
  ( for k in $(seq 40); do env -u CAPITAINE_ID bash "$E/veille.sh" --etat 2>&1 | cut -c1-22 >> "$E/vus"; done ) & s=$!
  bash "$E/veille.sh" --pause 0.05 --sondes 2 --duree 1 > "$E/v.log" 2>&1; rc=$?
  wait $s; [ $rc = 9 ] && n9=$((n9 + 1))
done
echo "E7 : veilles seules refusées en 9 par un --etat concurrent : $n9 sur 40"
echo "E8 : lectures de --etat pendant 40 veilles (démarrage, vie, fin) :"; sort "$E/vus" | uniq -c
rm -rf "$E"
