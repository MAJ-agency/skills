#!/usr/bin/env bash
# E13 : une seconde veille lancée par la commande du skill (`> <journal>`) pendant qu'une tourne : son refus (sortie 9)
# s'écrit-il là où la session le lit ? usage : e13-journal.sh <veille.sh>
V=$1; ICI=$(cd "$(dirname "$0")" && pwd)
E=$TMPDIR/e13.$$; rm -rf "$E"; "$ICI/jouet.sh" "$E" "$V" >/dev/null; source "$ICI/env.sh" "$E"; cd "$E/clone"
bash "$E/veille.sh" --pause 0.5 --sondes 8 --duree 1 > "$E/veille.log" 2>&1 & a=$!
sleep 1.5
bash "$E/veille.sh" --pause 0.5 --sondes 1 --duree 1 > "$E/veille.log" 2>&1; echo "seconde veille : sortie $?"
echo "dernière ligne du journal juste après le refus : $(tail -1 "$E/veille.log" | tr -d '\0')"
wait $a; echo "première veille : sortie $?"
echo "octets NUL dans le journal : $(tr -cd '\0' < "$E/veille.log" | wc -c)"
echo "le refus est-il encore dans le journal ? $(grep -ac 'une veille tourne déjà' "$E/veille.log")"
echo "dernière ligne à la fin : $(tail -1 "$E/veille.log")"
rm -rf "$E"
