#!/usr/bin/env bash
# Les 13 bancs du lot 5, un par un, dans le clone donné : fichier, tests, réussis, échoués, puis les titres rouges.
# Usage : bash bancs13.sh <clone> [<fichier de banc>…]
set -u
cd "$1"
shift
export TMPDIR="${TMPDIR:-/tmp}"
bancs=("$@")
[ ${#bancs[@]} -gt 0 ] || bancs=(skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs skills/chaine/fusionner/scripts/revue-exigee.test.mjs
  skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs skills/chaine/sujet/scripts/faux-gh.test.mjs
  skills/chaine/fusionner/scripts/sensibles-du-capitaine.test.mjs skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.test.mjs
  skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs
  scripts/points-d-entree.test.mjs skills/chaine/fusionner/scripts/messages-du-regime.test.mjs skills/chaine/sujet/scripts/sujet.test.mjs
  skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs skills/chaine/tickets/references/scripts/verify/tickets.test.mjs)
for f in "${bancs[@]}"; do
  out=$(timeout 1500 node --test --test-reporter=tap "$f" 2>&1)
  t=$(grep -E '^# tests ' <<<"$out" | awk '{print $3}'); p=$(grep -E '^# pass ' <<<"$out" | awk '{print $3}'); e=$(grep -E '^# fail ' <<<"$out" | awk '{print $3}')
  printf '%s\t%s\t%s\t%s\n' "$f" "$t" "$p" "$e"
  grep -E '^ *not ok ' <<<"$out" | grep -v '# SKIP' | sed 's/^ */    /'
done
