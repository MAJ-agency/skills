#!/usr/bin/env bash
# N6 : la suite d'une veille morte, de bout en bout, avec le vrai boucle.sh --arreter. La veille est lancée comme par
# l'outil Bash (un `bash -c` dans son propre groupe, journal en ajout) ; sa boucle (doublure qui tient boucle.verrou)
# dort 60 s. Cas : l'outil ne tue que le bash de la veille (boucle orpheline) ; l'outil tue le groupe ; machine
# recyclée, répertoire commun neuf (clone refait) ; machine recyclée, répertoire commun gardé (boot_id changé).
# Chaque fois : --etat, puis le point 3 (--arreter, puis la veille relancée avec --reprendre), puis --etat.
# usage : n6-garde-de-bout-en-bout.sh <veille.sh> <boucle.sh réel>
V=$1; B=$2; ICI=$(cd "$(dirname "$0")" && pwd)
for cas in bash-seul groupe recyclage-commun-neuf recyclage-commun-garde; do
  J=$TMPDIR/n6.$cas.$$; rm -rf "$J"; "$ICI/jouet-contre.sh" "$J" "$V" "" 'true' >/dev/null; source "$ICI/env-contre.sh" "$J"; cd "$J/clone"
  setsid bash -c "BOUCLE_SLEEP=60 bash '$J/veille.sh' --pause 0.3 --duree 1 >> '$J/veille.log' 2>&1" & outil=$!
  attendre "$J/arguments" boucle >/dev/null; /bin/sleep 0.5
  veille=$(pgrep -P "$outil" -f veille.sh); pg=$(ps -o pgid= -p "$outil" | tr -d ' ')
  case $cas in
    bash-seul) kill -9 "$veille" ;;
    *) kill -9 -- "-$pg" ;;
  esac
  /bin/sleep 0.5
  case $cas in
    recyclage-commun-neuf)
      # Conteneur recyclé : plus aucun processus, le clone refait (répertoire commun neuf), boot_id neuf.
      cd / && nettoyer; cd "$J" && rm -rf clone && git clone -q origine.git clone 2>/dev/null && cd clone; echo boot-2 > "$J/boot" ;;
    recyclage-commun-garde) cd / && nettoyer; cd "$J/clone"; echo boot-2 > "$J/boot" ;;
  esac
  echo "N6 $cas : boucle.verrou tenu par : [$(tenants .git/boucle.verrou)] ; --etat : $(etat)"
  echo "   point 3 : $(env -u CAPITAINE_ID bash "$B" --arreter 2>&1 | sed "s#$TMPDIR#<tmp>#g" | tr '\n' ' ')[sortie $?] ; boucle.verrou tenu par : [$(tenants .git/boucle.verrou)]"
  bash "$J/veille.sh" --pause 0.2 --duree 1 --sondes 0 --reprendre >> "$J/veille.log" 2>&1; rc=$?
  echo "   relance --reprendre : sortie $rc, « $(tail -1 "$J/veille.log") » ; boucle : $(tail -1 "$J/arguments" | cut -d' ' -f1-2) ; --etat : $(etat)"
  cd / && nettoyer && rm -rf "$J"
done
