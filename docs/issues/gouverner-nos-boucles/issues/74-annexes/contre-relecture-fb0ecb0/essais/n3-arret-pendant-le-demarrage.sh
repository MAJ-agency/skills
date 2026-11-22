#!/usr/bin/env bash
# N3 : un arrêt posé (`boucle.sh --arreter`, le vrai) pendant le démarrage d'une veille relancée avec --reprendre, après
# qu'elle a retiré le fichier d'arrêt et avant que sa boucle démarre (ici pendant la lecture initiale de la file, une
# lecture GitHub, rendue lente) : la boucle, lancée avec --reprendre, le retire-t-elle ? Témoin : la même veille sans
# --reprendre. Puis l'arrêt posé pendant une préparation (la veille tient alors boucle.verrou).
# usage : n3-arret-pendant-le-demarrage.sh <veille.sh> <boucle.sh réel>
V=$1; B=$2; ICI=$(cd "$(dirname "$0")" && pwd)
for cas in avec-reprendre sans-reprendre; do
  J=$TMPDIR/n3.$cas.$$; rm -rf "$J"; "$ICI/jouet-contre.sh" "$J" "$V" >/dev/null; source "$ICI/env-contre.sh" "$J"; cd "$J/clone"
  opt=(); [ $cas = sans-reprendre ] || opt=(--reprendre)
  FILE_SLEEP_PREMIER=3 bash "$J/veille.sh" --pause 0.2 --duree 1 --sondes 0 "${opt[@]}" > "$J/v.log" 2>&1 & v=$!
  attendre "$J/sondes" file >/dev/null; /bin/sleep 0.5
  echo "N3 $cas : --arreter pendant la lecture initiale : $(env -u CAPITAINE_ID bash "$B" --arreter 2>&1 | sed "s#$TMPDIR#<tmp>#g") [sortie $?]"
  wait $v; rc=$?
  echo "   veille : sortie $rc, « $(tail -1 "$J/v.log") » ; boucle : $(cut -d' ' -f1-2 "$J/arguments" | tr '\n' ';') ; fichier d'arrêt : $([ -e .git/boucle-arret ] && echo posé || echo RETIRÉ) ; journal : $(grep -c 'FILE VIDE' "$J/v.log") FILE VIDE, $(grep -c 'ARRÊT demandé' "$J/v.log") ARRÊT demandé"
  cd / && rm -rf "$J"
done
J=$TMPDIR/n3.preparation.$$; rm -rf "$J"; "$ICI/jouet-contre.sh" "$J" "$V" "" 'sleep 3' >/dev/null; source "$ICI/env-contre.sh" "$J"; cd "$J/clone"
echo boot-2 > "$J/boot"
bash "$J/veille.sh" --pause 0.2 --duree 1 --sondes 0 --reprendre > "$J/v.log" 2>&1 & v=$!
attendre "$J/v.log" 'préparation (' >/dev/null; /bin/sleep 0.5
echo "N3 préparation : --arreter pendant la préparation : $(env -u CAPITAINE_ID bash "$B" --arreter 2>&1 | sed "s#$TMPDIR#<tmp>#g" | tr '\n' ' ') [sortie $?]"
wait $v; rc=$?
echo "   veille : sortie $rc (tuée par --arreter : elle tient boucle.verrou), dernière ligne « $(tail -1 "$J/v.log") » ; boucle : $(cut -d' ' -f1-2 "$J/arguments" 2>/dev/null | tr '\n' ';') ; --etat : $(etat)"
/bin/sleep 3; cd / && rm -rf "$J"
