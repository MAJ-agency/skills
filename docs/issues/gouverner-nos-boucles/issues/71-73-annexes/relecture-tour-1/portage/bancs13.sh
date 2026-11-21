#!/usr/bin/env bash
# Joue les 13 bancs du lot 5 dans le clone donné, un par un, et écrit pour chacun : fichier, tests, réussis, échoués.
set -u
cd "$1"
export TMPDIR="${TMPDIR:-/tmp}"
for f in skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs skills/chaine/fusionner/scripts/revue-exigee.test.mjs \
  skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs skills/chaine/sujet/scripts/faux-gh.test.mjs \
  skills/chaine/fusionner/scripts/sensibles-du-capitaine.test.mjs skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.test.mjs \
  skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs \
  scripts/points-d-entree.test.mjs skills/chaine/fusionner/scripts/messages-du-regime.test.mjs skills/chaine/sujet/scripts/sujet.test.mjs \
  skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs skills/chaine/tickets/references/scripts/verify/tickets.test.mjs; do
  out=$(timeout 1200 node --test --test-reporter=tap "$f" 2>&1)
  t=$(grep -E '^# tests ' <<<"$out" | awk '{print $3}'); p=$(grep -E '^# pass ' <<<"$out" | awk '{print $3}'); e=$(grep -E '^# fail ' <<<"$out" | awk '{print $3}')
  printf '%s\t%s\t%s\t%s\n' "$f" "$t" "$p" "$e"
  grep -E '^not ok ' <<<"$out" | sed 's/^/    /'
done
