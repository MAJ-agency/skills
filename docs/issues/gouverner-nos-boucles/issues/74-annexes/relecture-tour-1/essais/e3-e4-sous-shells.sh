#!/usr/bin/env bash
# E3/E4 : veille tuée (kill -9 sur son seul bash) pendant une sonde lente (file.sh) ou pendant sa préparation :
# --etat lu 0,3 s après. Attendu : VEILLE MORTE. usage : e3-e4-sous-shells.sh <veille.sh>
V=$1; ICI=$(cd "$(dirname "$0")" && pwd)
for cas in sonde preparation; do
  E=$TMPDIR/e34.$cas.$$; rm -rf "$E"
  if [ $cas = sonde ]; then "$ICI/jouet.sh" "$E" "$V" >/dev/null; else "$ICI/jouet.sh" "$E" "$V" 'sleep 6' >/dev/null; fi
  source "$ICI/env.sh" "$E"; cd "$E/clone"
  if [ $cas = sonde ]; then FILE_SLEEP=6 bash "$E/veille.sh" --pause 0.2 --duree 1 > "$E/log" 2>&1 & v=$!
  else bash "$E/veille.sh" --pause 0.2 --duree 1 > "$E/log" 2>&1 & v=$!; fi
  for _ in $(seq 100); do { [ -s "$E/sondes" ] || grep -q 'préparation (' "$E/log"; } 2>/dev/null && break; sleep 0.1; done
  sleep 1; kill -9 "$v"; wait "$v" 2>/dev/null; sleep 0.3
  echo "veille tuée pendant $cas : $(etat | tr '\n' ' ')"
  sleep 6; rm -rf "$E"
done
