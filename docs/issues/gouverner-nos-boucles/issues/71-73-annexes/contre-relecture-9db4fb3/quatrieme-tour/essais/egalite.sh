#!/usr/bin/env bash
# L'arbre du sommet 9d989dc est-il ef2b3f8 plus retouches-tour-3.patch ? Une commande : le patch appliqué dans un index
# jetable posé sur ef2b3f8, puis l'arbre comparé. Usage, depuis un clone où les deux sommets sont : bash egalite.sh <patch>
set -u
s=9d989dc62f7b0384e8bdd2cb9f7e6f0bd247f87d
sha256sum "$1" | cut -c1-64
i=$(mktemp) && GIT_INDEX_FILE=$i git read-tree ef2b3f891188e0064472b4b6b1e48844f402d50a && GIT_INDEX_FILE=$i git apply --cached "$1" &&
  t=$(GIT_INDEX_FILE=$i git write-tree) && rm -f "$i" &&
  echo "ef2b3f8 + patch : $t ; 9d989dc : $(git rev-parse "$s^{tree}") ; parent de 9d989dc : $(git rev-parse --short "$s^")" &&
  [ "$t" = "$(git rev-parse "$s^{tree}")" ] && echo "identiques"
