#!/usr/bin/env bash
# Joue, dans le clone donné (l'espion posé par espion-poser.mjs), les bancs de `main` qui lancent les scripts du régime 7,
# un fichier à la fois, et écrit pour chacun le journal normalisé de l'espion (<sortie>/<banc>.journal) et le compte de
# ses tests (<sortie>/bancs.txt). Les shas, les chemins temporaires, les epochs et les dates sont remplacés par des
# jetons (l'heure d'une livraison intermédiaire comprise) : deux clones qui font les mêmes appels écrivent les mêmes
# journaux.
# Usage : bash espion-jouer.sh <clone> <sortie>
set -u
cd "$1"
sortie=$2
mkdir -p "$sortie"
export TMPDIR="${TMPDIR:-/tmp}"
: >"$sortie/bancs.txt"
for f in skills/chaine/fusionner/scripts/fusionner.test.mjs skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs \
  skills/chaine/fusionner/scripts/une-sous-pr-a-la-fois.test.mjs skills/chaine/fusionner/scripts/boucle-outils.test.mjs \
  skills/chaine/fusionner/scripts/github.test.mjs skills/chaine/fusionner/scripts/veille.test.mjs \
  skills/chaine/sujet/scripts/sujet.test.mjs skills/chaine/sujet/scripts/sujet-carte.test.mjs \
  skills/chaine/sujet/scripts/sujet-clore.test.mjs skills/chaine/sujet/scripts/sujet-refs.test.mjs \
  skills/chaine/fusionner/scripts/revue-exigee.test.mjs skills/chaine/socle-chaine-de-production/references/scripts/github/pr-titre.test.mjs \
  skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs skills/chaine/revue-adversariale/scripts/diff-revue.test.mjs \
  scripts/relecture.test.mjs skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs \
  skills/chaine/socle-chaine-de-production/references/agent/garde-commandes.test.mjs \
  skills/chaine/tickets/references/scripts/verify/tickets.test.mjs skills/chaine/tickets/references/scripts/verify/tickets-gate.test.mjs; do
  nom=$(basename "$f" .test.mjs)
  brut="$sortie/$nom.brut"
  : >"$brut"
  out=$(ESPION_JOURNAL="$brut" timeout 1500 node --test --test-concurrency=1 --test-reporter=tap "$f" 2>&1)
  t=$(grep -E '^# tests ' <<<"$out" | awk '{print $3}'); p=$(grep -E '^# pass ' <<<"$out" | awk '{print $3}'); e=$(grep -E '^# fail ' <<<"$out" | awk '{print $3}')
  printf '%s\t%s\t%s\t%s\t%s appels\n' "$f" "$t" "$p" "$e" "$(wc -l <"$brut")" >>"$sortie/bancs.txt"
  grep -E '^ *not ok ' <<<"$out" | sed 's/^ */    /' >>"$sortie/bancs.txt"
  sed -E -e "s#$PWD#<arbre>#g" -e 's#[0-9a-f]{40}#<sha>#g' -e 's#\b[0-9a-f]{7,12}\b#<court>#g' -e "s#${TMPDIR}[^ :\"']*#<tmp>#g" -e 's#/tmp/[^ :"'"'"']*#<tmp>#g' \
    -e 's#[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9:.]+Z#<date>#g' -e 's#\b1[0-9]{9}\b#<epoch>#g' -e 's#passer\.[A-Za-z0-9]{6}#passer.<x>#g' -e 's#(livraison/[a-z0-9-]+-<court>)-[0-9]{4}#\1-<hhmm>#g' "$brut" >"$sortie/$nom.journal"
  rm -f "$brut"
done
cat "$sortie/bancs.txt"
