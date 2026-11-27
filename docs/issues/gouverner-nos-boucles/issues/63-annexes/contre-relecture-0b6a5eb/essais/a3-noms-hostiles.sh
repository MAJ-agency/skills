# a3 : des noms hostiles (tabulation, guillemet, $(…), retour à la ligne, « b/ », barre oblique inverse, tiret)
# dans les lots de la résolution ; lus pour chaque lot, avec les noms tels que relus.txt les écrit, puis décités.
. "$(dirname "$0")/outils/maj.sh"
jouet a3
N1="$(printf 'apps/api/src/tab\there é "q" $(touch PIEGE).ts')"
N2="$(printf 'apps/web/src/nl\nligne $(touch PIEGE2).ts')"
N3='apps/web/src/x b/y.ts'
N4='packages/"z"/back\slash.ts'
N5='-tiret.ts'
ecrire() {
  local v=$1
  case $v in resolu) v=sujet ;; esac
  lignes_de "${v:0:1}" 2100 | vers "$N1"
  for f in "$N2" "$N3" "$N4" "$N5"; do printf 'export const v = "%s";\n' "$v" | vers "$f"; done
  if [ "$1" = resolu ]; then printf 'export const v = "neuve";\n' | vers "$N3"; fi
}
maj 83
g diff | grep -vE '^\[outil' | sed "s#$BR#<br>#g"
echo "--- resolution.txt :"; cat "$BR/resolution.txt"; echo "--- relus.txt :"; cat "$BR/relus.txt"
echo "--- lots/*/relus.txt :"; for d in "$BR"/lots/*/; do echo "== $(basename "$d")"; cat "$d/relus.txt"; done
lus() { local lot=$1; shift; { echo "aucun écart"; echo "Fichiers du diff lus :"; printf '%s\n' "$@"; } > "$BR/axe-1-lot-$lot.txt"; echo "lus 1 $lot : $(g lus 1 "$lot" | grep -E 'sortie')"; }
for d in "$BR"/lots/resolution-*/; do
  l=$(basename "$d"); mapfile -t fs < "$d/relus.txt"
  lus "$l" "${fs[@]}"
  mapfile -t brut < <(sed 's/^"\(.*\)"$/\1/' "$d/relus.txt"); lus "$l" "${brut[@]}"
done
echo "PIEGE : $(find "$E" -name 'PIEGE*' | wc -l)"
printf '%s\n' "chore(facture): reçoit develop" > "$BR/titre.txt"; g axes | grep -E 'sortie'; g c1 | tail -2 | head -1; g garde | grep sortie
grep -c 'lots/resolution-' "$BR/c1/avant.txt"
