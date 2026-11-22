#!/usr/bin/env bash
# E13 du tour 1, rejoué avec la commande du skill à fb0ecb0 (`>> <journal>`) : une seconde veille, qui sort en 9, ne
# tronque plus le journal de la première (la première dure 8 s : plus que les 3 s d’attente de la seconde). usage : e13-journal-en-ajout.sh <veille.sh>
V=$1; ICI=$(cd "$(dirname "$0")" && pwd)
J=$TMPDIR/e13a.$$; rm -rf "$J"; "$ICI/jouet-contre.sh" "$J" "$V" >/dev/null; source "$ICI/env-contre.sh" "$J"; cd "$J/clone"
bash "$J/veille.sh" --pause 0.5 --sondes 16 --duree 1 >> "$J/veille.log" 2>&1 & a=$!
/bin/sleep 1.5
bash "$J/veille.sh" --pause 0.5 --sondes 1 --duree 1 >> "$J/veille.log" 2>&1; echo "seconde veille : sortie $?"
wait $a; echo "première veille : sortie $?"
echo "octets NUL dans le journal : $(tr -cd '\0' < "$J/veille.log" | wc -c)"
echo "le refus est-il dans le journal ? $(grep -ac 'une veille tourne déjà' "$J/veille.log")"
echo "première ligne : $(head -1 "$J/veille.log")"
echo "dernière ligne à la fin : $(tail -1 "$J/veille.log")"
echo "lignes illisibles (ni VEILLE ni FILE VIDE) : $(grep -avc '^VEILLE \|^FILE VIDE$' "$J/veille.log")"
cd / && rm -rf "$J"
