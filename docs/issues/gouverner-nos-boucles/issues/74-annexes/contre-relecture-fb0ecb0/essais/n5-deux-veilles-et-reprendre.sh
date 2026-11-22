#!/usr/bin/env bash
# N5 : une seconde veille lancée avec --reprendre pendant qu'une tourne (un arrêt posé entre-temps) : elle sort en 9 après
# 3 s, sans toucher ni l'état ni le fichier d'arrêt. usage : n5-deux-veilles-et-reprendre.sh <veille.sh>
V=$1; ICI=$(cd "$(dirname "$0")" && pwd)
J=$TMPDIR/n5.$$; rm -rf "$J"; "$ICI/jouet-contre.sh" "$J" "$V" >/dev/null; source "$ICI/env-contre.sh" "$J"; cd "$J/clone"
bash "$J/veille.sh" --pause 6 --sondes 1 --duree 1 > "$J/a.log" 2>&1 & a=$!
attendre "$J/a.log" 'FILE VIDE' >/dev/null
date +%FT%T > .git/boucle-arret; avant=$(cat .git/veille.etat)
t0=$(date +%s.%N)
bash "$J/veille.sh" --pause 0.2 --sondes 0 --duree 1 --reprendre > "$J/b.log" 2>&1; rb=$?
t1=$(date +%s.%N)
echo "N5 seconde veille --reprendre : sortie $rb en $(awk -v a="$t0" -v b="$t1" 'BEGIN { printf "%.1f", b - a }') s, « $(sed "s#$TMPDIR#<tmp>#g" "$J/b.log") »"
echo "   état inchangé : $([ "$(cat .git/veille.etat)" = "$avant" ] && echo oui || echo NON) ; fichier d'arrêt : $([ -e .git/boucle-arret ] && echo gardé || echo RETIRÉ) ; boucles lancées : $(wc -l < "$J/arguments")"
wait $a; echo "   première veille : sortie $? « $(tail -1 "$J/a.log") » ; --etat : $(etat)"
cd / && rm -rf "$J"
