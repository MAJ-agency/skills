#!/usr/bin/env bash
# N4 : une veille relancée avec --reprendre (fichier d'arrêt posé, machine neuve : la préparation se joue), tuée par
# kill -9 sur son seul bash à chaque étape : pendant le fetch (lent), pendant le sommeil entre deux essais du fetch
# (le premier raté), pendant la commande de préparation, pendant la boucle, pendant une sonde. Après chaque mort :
# --etat, le fichier d'arrêt, qui tient veille.verrou et boucle.verrou ; puis la suite du réveil de garde (le vrai
# boucle.sh --arreter, la veille relancée avec --reprendre, préparation rapide). usage : n4-preparation-tuee.sh <veille.sh> <boucle.sh réel>
V=$1; B=$2; ICI=$(cd "$(dirname "$0")" && pwd)
for etape in fetch sommeil-du-fetch preparation boucle sonde; do
  J=$TMPDIR/n4.$etape.$$; rm -rf "$J"; "$ICI/jouet-contre.sh" "$J" "$V" "" 'sleep 4' >/dev/null; source "$ICI/env-contre.sh" "$J"; cd "$J/clone"
  W=$J/bin; mkdir -p "$W"
  cat > "$W/git" <<T
#!/bin/bash
if [ "\${1-}" = fetch ]; then
  [ "$etape" != fetch ] || /bin/sleep 4
  [ "$etape" != sommeil-du-fetch ] || [ -e "$J/fetch-rate" ] || { : > "$J/fetch-rate"; exit 1; }
fi
exec $(command -v git) "\$@"
T
  chmod +x "$W/git"
  date +%FT%T > .git/boucle-arret; echo boot-2 > "$J/boot"
  args=(--pause 0.3 --duree 1 --reprendre)
  case $etape in
    boucle) export BOUCLE_SLEEP=6 ;;
    sonde) export FILE_SLEEP_PREMIER=0 FILE_SLEEP=0; printf '31\tprête\t\n' > "$J/file-etat" ;;
  esac
  PATH="$W:$PATH" bash "$J/veille.sh" "${args[@]}" > "$J/v.log" 2>&1 & v=$!
  case $etape in
    fetch) /bin/sleep 1.5 ;;
    sommeil-du-fetch) attendre "$J/fetch-rate" '' >/dev/null || true; for _ in $(seq 50); do [ -e "$J/fetch-rate" ] && break; /bin/sleep 0.1; done; /bin/sleep 1 ;;
    preparation) attendre "$J/v.log" 'préparation (' >/dev/null; /bin/sleep 1 ;;
    boucle) attendre "$J/arguments" boucle >/dev/null; /bin/sleep 1 ;;
    sonde) attendre "$J/v.log" 'préparation réussie' >/dev/null; for _ in $(seq 100); do [ "$(wc -l < "$J/sondes" 2>/dev/null)" -ge 2 ] && break; /bin/sleep 0.1; done; export FILE_SLEEP=6; /bin/sleep 0.3 ;;
  esac
  kill -9 "$v"; wait "$v" 2>/dev/null; /bin/sleep 0.3
  unset BOUCLE_SLEEP FILE_SLEEP FILE_SLEEP_PREMIER
  echo "N4 $etape : tuée ; dernière ligne « $(tail -1 "$J/v.log" | sed "s#$TMPDIR#<tmp>#g") »"
  echo "   --etat : $(etat)"
  echo "   fichier d'arrêt : $([ -e .git/boucle-arret ] && echo posé || echo retiré) ; veille.verrou tenu par : [$(tenants .git/veille.verrou)] ; boucle.verrou tenu par : [$(tenants .git/boucle.verrou)]"
  printf '{"preparerCapitaine": "true"}\n' > .claude/chaine.json && git commit -qam rapide && git push -q origin HEAD:develop
  echo "   garde, point 3 : $(env -u CAPITAINE_ID bash "$B" --arreter 2>&1 | sed "s#$TMPDIR#<tmp>#g" | tr '\n' ' ')[sortie $?]"
  rm -f "$J/file-etat"
  bash "$J/veille.sh" --pause 0.2 --duree 1 --sondes 0 --reprendre > "$J/r.log" 2>&1; rc=$?
  echo "   relance --reprendre : sortie $rc, « $(tail -1 "$J/r.log") » ; --etat : $(etat)"
  cd / && nettoyer && /bin/sleep 0.2 && rm -rf "$J"
done
