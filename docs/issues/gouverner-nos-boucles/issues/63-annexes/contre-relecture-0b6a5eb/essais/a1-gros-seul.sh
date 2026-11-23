# a1 : une résolution d'un seul fichier énorme (5 000 lignes), puis le même fichier dans le diff relu aussi.
. "$(dirname "$0")/outils/maj.sh"
V=${VARIANTE:-ours}
jouet "a1-$V"
F=apps/api/src/facture/enorme.ts
ecrire() {
  case $1 in
    commune) lignes_de c 5000 | vers "$F" ;;
    sujet) lignes_de s 5000 | vers "$F" ;;
    develop) lignes_de d 5000 | vers "$F" ;;
    resolu) if [ "$V" = ours ]; then lignes_de s 5000 | vers "$F"; else lignes_de r 5000 | vers "$F"; fi ;;
  esac
}
maj 81
g diff | grep -vE '^\[outil'
echo "--- resolution.patch : $(wc -l < "$BR/resolution.patch") lignes ; diff.patch : $(wc -l < "$BR/diff.patch") lignes"
echo "--- lots/ : $(ls -A "$BR/lots" 2>&1 | tr '\n' ' ')"
{ echo "aucun écart"; echo "Fichiers du diff lus :"; echo "$F"; } > "$BR/axe-1-lot-resolution.txt"; g lus 1 resolution | grep -vE '^\[outil'
g lus 1 resolution-1 | grep -vE '^\[outil'
