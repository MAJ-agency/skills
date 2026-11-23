# a6 : le diff relu d'un seul gros fichier (un seul lot : lots/ retiré), la résolution en lots ; puis un conflit
# modify/delete dans la résolution découpée. Aucun dossier de travail ne reste.
. "$(dirname "$0")/outils/maj.sh"
jouet a6
G=apps/api/src/facture/gros.ts P=apps/web/src/petit.ts D=packages/outils/src/supprime.ts
ecrire() {
  case $1 in
    commune) lignes_de c 2500 | vers "$G"; ec "$P" 'export const a = 1;'; lignes_de e 50 | vers "$D" ;;
    sujet) lignes_de s 2500 | vers "$G"; ec "$P" 'export const a = 2;'; lignes_de f 50 | vers "$D" ;;
    develop) lignes_de d 2500 | vers "$G"; ec "$P" 'export const a = 3;'; git -C "$AU" rm -q "$D" ;;
    resolu) lignes_de r 2500 | vers "$G"; ec "$P" 'export const a = 2;'; lignes_de f 50 | vers "$D" ;;
  esac
}
maj 86
g diff | grep -vE '^\[outil' | sed "s#$BR#<br>#g"
echo "--- lots/ : $(ls -A "$BR/lots" | tr '\n' ' ')"
echo "--- en-têtes et remerge de resolution.patch :"; grep -E '^(diff --git|remerge)' "$BR/resolution.patch"
for d in "$BR"/lots/*/; do echo "== $(basename "$d") : $(tr '\n' ' ' < "$d/relus.txt")"; done
