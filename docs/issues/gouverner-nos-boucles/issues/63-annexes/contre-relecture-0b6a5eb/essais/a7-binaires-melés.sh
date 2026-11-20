# a7 : un binaire du diff relu (z.bin, forme neuve) et un binaire de la seule résolution (a.bin, « ours ») : la liste
# des binaires reste triée, lus la lit.
. "$(dirname "$0")/outils/maj.sh"
jouet a7
Z=apps/web/public/z.bin A=apps/api/src/auth/a.bin
ecrire() {
  case $1 in
    commune) binaire c | vers "$Z"; binaire c | vers "$A" ;;
    sujet) binaire s | vers "$Z"; binaire s | vers "$A" ;;
    develop) binaire d | vers "$Z"; binaire d | vers "$A" ;;
    resolu) binaire r | vers "$Z"; binaire s | vers "$A" ;;
  esac
}
maj 87
g diff | grep -E 'sortie|binaires :'
echo "--- binaires.txt : $(tr '\n' '|' < "$BR/binaires.txt")"
{ echo "aucun écart"; echo "Fichiers du diff lus :"; } > "$BR/axe-1.txt"; echo "lus 1 : $(g lus 1 | grep -vE '^\[outil' | tr '\n' ' ')"
{ echo "aucun écart"; echo "Fichiers du diff lus :"; } > "$BR/axe-1-lot-resolution.txt"; echo "lus 1 resolution : $(g lus 1 resolution 2>&1 | grep -vE '^\[outil' | tr '\n' ' ')"
