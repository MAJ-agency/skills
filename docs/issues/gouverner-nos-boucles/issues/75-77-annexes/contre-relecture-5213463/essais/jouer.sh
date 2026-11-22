#!/usr/bin/env bash
# Joue les essais de la contre-relecture de la PR 153 dans un arbre (le sommet 5213463, `main` à ddb4265, ou la
# retouche posée) : ajoute les deux fichiers `*.ajout.mjs` à la fin des bancs qu'ils nomment, joue les seuls cas
# `ESSAI-153`, puis remet les bancs (git checkout). Usage : bash jouer.sh <arbre>
set -u
ici=$(cd "$(dirname "$0")" && pwd)
cd "$1"
bv=skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs
br=skills/chaine/relecteur/scripts/relecteur.test.mjs
cat "$ici/capitaine-git-240.ajout.mjs" >>"$bv"
cat "$ici/relecteur-poste.ajout.mjs" >>"$br"
echo "arbre : $(git rev-parse --short HEAD) $(git status --short | grep -v -e "$bv" -e "$br" | tr '\n' ' ')"
timeout 1500 node --test --test-reporter=tap --test-name-pattern='ESSAI-153' "$bv" "$br" 2>&1 |
  grep -E '^# (tests|pass|fail) |^(not )?ok |^ *(error|expected|actual): ' | grep -v '# SKIP'
git checkout -q -- "$bv" "$br"
git status --short
