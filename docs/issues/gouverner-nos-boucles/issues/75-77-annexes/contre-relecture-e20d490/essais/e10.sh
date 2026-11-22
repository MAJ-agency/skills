#!/usr/bin/env bash
# Tour 3 : E10 du tour 2 — le cas E1 (« de bout en bout ») de verdict-du-capitaine.test.mjs joué seul, le poste tel quel,
# puis un git dont le chemin porte une espace en tête du PATH, puis un git dont le chemin porte un guillemet et une
# contre-oblique. Usage : bash e10.sh <arbre>
set -u
cd "$1"
b=skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs
lab=$(mktemp -d)
mkdir -p "$lab/git avec espace" "$lab/git \"guillemet\\oblique"
ln -s "$(command -v git)" "$lab/git avec espace/git"; ln -s "$(command -v git)" "$lab/git \"guillemet\\oblique/git"
filtre() { grep -E '^# (tests|pass|fail) |^(not )?ok |^ *(error|expected|actual|duration_ms): ' | grep -v '# SKIP' | sed "s#$lab#<lab>#g"; }
echo "arbre : $(git rev-parse --short HEAD) ; $(uptime)"
echo "## E1 seul, le poste tel quel"; node --test --test-reporter=tap --test-name-pattern='de bout en bout' "$b" 2>&1 | filtre
echo "## E10 : PATH=<lab>/git avec espace:\$PATH"; PATH="$lab/git avec espace:$PATH" node --test --test-reporter=tap --test-name-pattern='de bout en bout' "$b" 2>&1 | filtre
echo "## E10b : PATH=<lab>/git \"guillemet\\oblique:\$PATH"; PATH="$lab/git \"guillemet\\oblique:$PATH" node --test --test-reporter=tap --test-name-pattern='de bout en bout' "$b" 2>&1 | filtre
echo "arbre après : $(git status --short | wc -l) fichier(s) modifié(s) ; $(uptime)"
rm -rf "$lab"
