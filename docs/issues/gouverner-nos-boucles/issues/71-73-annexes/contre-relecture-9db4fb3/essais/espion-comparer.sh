#!/usr/bin/env bash
# Compare les journaux de l'espion (espion-jouer.sh) de `main` et de la PR, banc par banc : appels, scripts lancés,
# codes de sortie et dernières lignes ; écrit les comptes et chaque écart.
# Usage : bash espion-comparer.sh <sortie de main> <sortie de la PR>
set -u
echo "bancs de main joués contre les scripts de main, puis contre ceux de la PR"
paste <(cut -f1-5 "$1/bancs.txt" | grep -v '^    ') <(cut -f2-5 "$2/bancs.txt" | grep -v '^    ') | awk -F '\t' '{ printf "%s\tmain %s/%s (%s)\tPR %s/%s (%s)\n", $1, $3, $2, $5, $7, $6, $9 }'
echo
echo "tests rouges sur main :"; grep '^    ' "$1/bancs.txt" || echo "    aucun"
echo "tests rouges sur la PR :"; grep '^    ' "$2/bancs.txt" || echo "    aucun"
echo
total=0; lances=0; gh=0; reseau=0
for j in "$1"/*.journal; do
  n=$(basename "$j")
  total=$((total + $(wc -l <"$j"))); lances=$((lances + $(grep -c '^>>> ' "$j"))); gh=$((gh + $(grep -c '^gh ' "$j"))); reseau=$((reseau + $(grep -c '^git ' "$j")))
  if diff -q "$j" "$2/$n" >/dev/null; then echo "$n : identiques ($(wc -l <"$j") lignes)"; else echo "$n : ÉCART"; diff "$j" "$2/$n" | head -40; fi
done
echo
echo "sur main : $lances scripts lancés, $gh appels gh, $reseau appels git réseau, $total lignes de journal"
