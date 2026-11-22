#!/usr/bin/env bash
# L'arbre du sommet 450903a est-il 9db4fb3 plus retouches-tour-1.patch ? Une commande : le patch appliqué dans un index
# jetable posé sur 9db4fb3, puis l'arbre comparé. Usage, depuis un clone où les deux sommets sont : bash egalite.sh <patch>
set -u
sha256sum "$1" | cut -c1-64
i=$(mktemp) && GIT_INDEX_FILE=$i git read-tree 9db4fb347dc3c1120c5b172b78461a75f1b9b9b7 && GIT_INDEX_FILE=$i git apply --cached "$1" &&
  t=$(GIT_INDEX_FILE=$i git write-tree) && rm -f "$i" &&
  echo "9db4fb3 + patch : $t ; 450903a : $(git rev-parse '450903a4c6f830166a7e81df1c4dfd60f4c3572a^{tree}') ; parent de 450903a : $(git rev-parse --short '450903a4c6f830166a7e81df1c4dfd60f4c3572a^')" &&
  [ "$t" = "$(git rev-parse '450903a4c6f830166a7e81df1c4dfd60f4c3572a^{tree}')" ] && echo "identiques"
