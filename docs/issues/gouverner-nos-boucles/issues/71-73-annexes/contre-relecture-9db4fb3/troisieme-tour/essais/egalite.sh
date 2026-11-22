#!/usr/bin/env bash
# L'arbre du sommet ef2b3f8 est-il 450903a plus retouches-tour-2.patch ? Une commande : le patch appliqué dans un index
# jetable posé sur 450903a, puis l'arbre comparé. Usage, depuis un clone où les deux sommets sont : bash egalite.sh <patch>
set -u
s=ef2b3f891188e0064472b4b6b1e48844f402d50a
sha256sum "$1" | cut -c1-64
i=$(mktemp) && GIT_INDEX_FILE=$i git read-tree 450903a4c6f830166a7e81df1c4dfd60f4c3572a && GIT_INDEX_FILE=$i git apply --cached "$1" &&
  t=$(GIT_INDEX_FILE=$i git write-tree) && rm -f "$i" &&
  echo "450903a + patch : $t ; ef2b3f8 : $(git rev-parse "$s^{tree}") ; parent de ef2b3f8 : $(git rev-parse --short "$s^")" &&
  [ "$t" = "$(git rev-parse "$s^{tree}")" ] && echo "identiques"
