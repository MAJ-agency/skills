#!/usr/bin/env bash
# E2, E5, E6 du tour 1 (« kill -9 pendant le sommeil, pendant la boucle, pendant que tee attend »), rejoués sur le jouet
# de la contre-relecture : --etat 0,3 s après le kill -9 du seul bash de la veille. Attendu : VEILLE MORTE, et personne ne
# tient veille.verrou. usage : e2-e5-e6-tuee.sh <veille.sh>
V=$1; ICI=$(cd "$(dirname "$0")" && pwd)
for cas in sommeil boucle tee; do
  J=$TMPDIR/e256.$cas.$$; rm -rf "$J"; "$ICI/jouet-contre.sh" "$J" "$V" >/dev/null; source "$ICI/env-contre.sh" "$J"; cd "$J/clone"
  case $cas in
    sommeil) bash "$J/veille.sh" --pause 30 --duree 1 > "$J/v.log" 2>&1 & v=$!; attendre "$J/arguments" boucle >/dev/null; /bin/sleep 1 ;;
    boucle) BOUCLE_SLEEP=20 bash "$J/veille.sh" --pause 0.2 --duree 1 > "$J/v.log" 2>&1 & v=$!; attendre "$J/arguments" boucle >/dev/null; /bin/sleep 1 ;;
    tee)
      # La boucle laisse un démon qui garde le tube : la boucle a fini, tee attend, la veille attend tee.
      printf '#!/usr/bin/env bash\necho "boucle $*" >> "%s/arguments"\n(exec /bin/sleep 20 </dev/null 2>/dev/null) &\necho FILE VIDE\n' "$J" > "$J/boucle.sh"
      bash "$J/veille.sh" --pause 0.2 --duree 1 > "$J/v.log" 2>&1 & v=$!; attendre "$J/v.log" 'FILE VIDE' >/dev/null; /bin/sleep 1 ;;
  esac
  avant=$(etat)
  kill -9 "$v"; wait "$v" 2>/dev/null; /bin/sleep 0.3
  echo "$cas : avant le kill : $avant"
  echo "      après le kill : $(etat) ; veille.verrou tenu par : [$(tenants .git/veille.verrou)]"
  cd / && nettoyer && rm -rf "$J"
done
