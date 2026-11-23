#!/bin/sh
# Le banc `regles.test.mjs` d'avant (main à 24fbd72) puis celui du patch, chacun joué entier, seul, sous une charge de
# 20 boucles à vide (charge.sh) : celui d'avant rougit le pire cas à 20 000 caractères (plus de 10 s), celui du patch
# passe (les mêmes cas, en étalons). Usage : sh durees-sous-charge.sh <clone de main> <clone du patch>
ICI=$(cd "$(dirname "$0")" && pwd)
B=skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs
for c in "$1" "$2"; do
  echo "== $(git -C "$c" log -1 --format='%h')"
  sh "$ICI/charge.sh" 20 node --test --test-reporter=tap "$c/$B" 2>&1 | grep -E '^not ok|^  error|ms à 20000|load average|^# (tests|pass|fail|duration_ms) '
done
