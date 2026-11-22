#!/usr/bin/env bash
# N7 : un processus du projet garde boucle.verrou (un démon qui a hérité du descripteur 9, le « couplage fragile » de
# l'en-tête de boucle.sh), sans veille vivante. La veille relancée, puis relancée avec --reprendre (le vrai boucle.sh
# dans le jouet) : quelles lignes, et que dit --etat, que le skill fait lire à la sortie 9 ? Puis --arreter.
# usage : n7-sortie-9-sans-issue.sh <veille.sh> <boucle.sh réel>
V=$1; B=$2; ICI=$(cd "$(dirname "$0")" && pwd)
J=$TMPDIR/n7.$$; rm -rf "$J"; "$ICI/jouet-contre.sh" "$J" "$V" "$B" >/dev/null; source "$ICI/env-contre.sh" "$J"; cd "$J/clone"
( exec 9>>.git/boucle.verrou; flock -n 9; exec /bin/sleep 60 ) & demon=$!
/bin/sleep 0.3
bash "$J/veille.sh" --pause 0.2 --duree 1 --sondes 0 >> "$J/veille.log" 2>&1; rc=$?
echo "N7.a veille relancée : sortie $rc ; journal :"; sed "s#$TMPDIR#<tmp>#g; s/^/     /" "$J/veille.log"
echo "     --etat (ce que la sortie 9 fait lire) : $(etat)"
echo "     --etat au réveil de garde suivant : $(etat)"
date +%FT%T > .git/boucle-arret
bash "$J/veille.sh" --pause 0.2 --duree 1 --sondes 0 --reprendre > "$J/r.log" 2>&1; rc=$?
echo "N7.b relancée avec --reprendre (un arrêt posé) : sortie $rc, « $(sed "s#$TMPDIR#<tmp>#g" "$J/r.log") »"
echo "     --etat : $(etat)"
echo "N7.c boucle.sh --arreter : $(env -u CAPITAINE_ID bash "$B" --arreter 2>&1 | sed "s#$TMPDIR#<tmp>#g" | tr '\n' ' ')[sortie $?] ; le démon : $(kill -0 $demon 2>/dev/null && echo vivant || echo arrêté)"
bash "$J/veille.sh" --pause 0.2 --duree 1 --sondes 0 --reprendre > "$J/s.log" 2>&1; rc=$?
echo "     puis --reprendre : sortie $rc ; dernière ligne « $(tail -1 "$J/s.log" | sed "s#$TMPDIR#<tmp>#g" | cut -c1-120) »"
kill -9 $demon 2>/dev/null; cd / && nettoyer && rm -rf "$J"
