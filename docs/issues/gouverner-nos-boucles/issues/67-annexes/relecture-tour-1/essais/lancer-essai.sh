#!/bin/bash
# Joue les essais du relecteur neuf : le fragment est ajouté à une copie du banc du Relecteur, posée à côté de lui
# (ses imports relatifs tiennent), jouée seule, puis retirée. Usage, depuis la racine d'un clone :
#   bash <chemin>/lancer-essai.sh
set -euo pipefail
ici=$(cd "$(dirname "$0")" && pwd)
banc=skills/chaine/relecteur/scripts/relecteur.test.mjs
copie=skills/chaine/relecteur/scripts/relecteur.essai-relecture.test.mjs
cat "$banc" "$ici/essai-marque.snippet.mjs" > "$copie"
trap 'rm -f "$copie"' EXIT
node --test --test-name-pattern='^relecture — ' "$copie"
