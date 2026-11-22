#!/usr/bin/env bash
# E1 : deux veilles lancées au même instant (chacune dure plus de 4 s, plus que l’attente de 3 s de la retouche), 20 fois :
# usage : e1-deux-veilles.sh <veille.sh>
V=$1; ICI=$(cd "$(dirname "$0")" && pwd)
E=$TMPDIR/e1.$$; rm -rf "$E"; "$ICI/jouet.sh" "$E" "$V" >/dev/null; source "$ICI/env.sh" "$E"; cd "$E/clone"
for i in $(seq 20); do
  rm -f "$E/arguments"
  bash "$E/veille.sh" --pause 4 --sondes 1 --duree 1 > "$E/a.log" 2>&1 & a=$!
  bash "$E/veille.sh" --pause 4 --sondes 1 --duree 1 > "$E/b.log" 2>&1 & b=$!
  wait $a; ra=$?; wait $b; rb=$?
  echo "sorties $ra/$rb, boucles lancées $(wc -l < "$E/arguments")"
done | sort | uniq -c
rm -rf "$E"
