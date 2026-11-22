#!/usr/bin/env bash
# Joue les essais du tour 2 dans un arbre (le sommet 34ac533, ou 5213463 pour comparer) : ajoute relecteur-t2.ajout.mjs à
# la fin du banc du Relecteur, joue les seuls cas `ESSAI-T2`, puis remet le banc (git checkout). Usage : bash jouer-t2.sh <arbre>
set -u
ici=$(cd "$(dirname "$0")" && pwd)
cd "$1"
br=skills/chaine/relecteur/scripts/relecteur.test.mjs
cat "$ici/relecteur-t2.ajout.mjs" >>"$br"
echo "arbre : $(git rev-parse --short HEAD) ; autres fichiers modifiés : $(git status --short | grep -v -e "$br" | wc -l)"
timeout 1500 node --test --test-reporter=tap --test-name-pattern='ESSAI-T2' "$br" 2>&1 |
  grep -E '^# (tests|pass|fail) |^(not )?ok |^ *(error|expected|actual): |^# \[' | grep -v '# SKIP'
git checkout -q -- "$br"
git status --short
