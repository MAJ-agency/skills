#!/usr/bin/env bash
# N8 (second tour) : une boucle lancée à la main pendant que la veille dort. À la sonde suivante, la veille relance sa
# boucle, qui refuse (REFUS, sortie 9) : « la boucle est sortie en 9 ». La suite écrite à 950f94e (puce « Sortie 9 »,
# une boucle sans veille qui la porte) est le point 3 de la garde : le vrai boucle.sh --arreter, puis la veille relancée
# avec --reprendre. Qu'arrête-t-il, et que devient la file ? usage : n8-boucle-a-la-main.sh <veille.sh> <boucle.sh réel>
# <dossier essais/ du premier tour de la contre-relecture (../../essais)>
V=$1; B=$2; ICI=$3
J=$TMPDIR/n8.$$; rm -rf "$J"; "$ICI/jouet-contre.sh" "$J" "$V" >/dev/null; source "$ICI/env-contre.sh" "$J"; cd "$J/clone"
bash "$J/veille.sh" --pause 2 --duree 1 --sondes 3 >> "$J/veille.log" 2>&1 & v=$!
attendre "$J/veille.log" 'FILE VIDE' >/dev/null
BOUCLE_SLEEP=30 bash "$J/boucle.sh" > "$J/main.log" 2>&1 & m=$!
/bin/sleep 0.5; printf '31\tprête\t\n' > "$J/file-etat"
wait $v; rv=$?
echo "N8 veille : sortie $rv ; ses deux dernières lignes : $(tail -2 "$J/veille.log" | tr '\n' '|')"
echo "   boucle à la main : $(kill -0 $m 2>/dev/null && echo vivante || echo morte) ; boucle.verrou tenu par : [$(tenants .git/boucle.verrou)] ; --etat : $(etat)"
echo "   point 3 : $(arreter "$B") ; boucle à la main : $(kill -0 $m 2>/dev/null && echo vivante || echo arrêtée)"
wait $m 2>/dev/null; echo "   sa sortie : $?"
rm -f "$J/file-etat"
bash "$J/veille.sh" --pause 0.2 --duree 1 --sondes 0 --reprendre >> "$J/veille.log" 2>&1; rc=$?
echo "   relance --reprendre : sortie $rc, « $(tail -1 "$J/veille.log") » ; --etat : $(etat)"
cd / && nettoyer && rm -rf "$J"
