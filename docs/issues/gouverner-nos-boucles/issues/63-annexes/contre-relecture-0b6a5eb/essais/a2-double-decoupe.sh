# a2 : un diff relu en lots ET une résolution en lots, dans le même tour ; lus pour chaque lot ; l'empreinte de C1.
. "$(dirname "$0")/outils/maj.sh"
jouet a2
G=apps/api/src/facture/gros.ts P=apps/web/src/petit.ts X=packages/outils/src/x.ts M=apps/mobile/src/gros2.ts
ecrire() {
  case $1 in
    commune) lignes_de c 2500 | vers "$G"; lignes_de m 2200 | vers "$M"; ec "$P" 'export const a = 1;'; ec "$X" 'export const x = 1;' ;;
    sujet) lignes_de s 2500 | vers "$G"; lignes_de n 2200 | vers "$M"; ec "$P" 'export const a = 2;'; ec "$X" 'export const x = 2;' ;;
    develop) lignes_de d 2500 | vers "$G"; lignes_de o 2200 | vers "$M"; ec "$P" 'export const a = 3;'; ec "$X" 'export const x = 3;' ;;
    resolu) lignes_de r 2500 | vers "$G"; lignes_de n 2200 | vers "$M"; ec "$P" 'export const a = 4;'; ec "$X" 'export const x = 2;' ;;
  esac
}
maj 82
g diff | grep -vE '^\[outil' | sed "s#$BR#<br>#g"
echo "--- lots/ : $(ls "$BR/lots" | tr '\n' ' ')"
echo "--- relus.txt :"; cat "$BR/relus.txt"; echo "--- resolution.txt :"; cat "$BR/resolution.txt"
ok() { if "$@"; then echo "  vrai : $*" | sed "s#$BR#<br>#g"; else echo "  FAUX : $*" | sed "s#$BR#<br>#g"; fi; }
ok cmp -s <(cat "$BR"/lots/lot-*/relus.txt | sort) "$BR/relus.txt"
ok cmp -s <(for i in $(seq 1 "$(ls -d "$BR"/lots/lot-* | wc -l)"); do cat "$BR/lots/lot-$i/diff.patch"; done) "$BR/diff.patch"
ok cmp -s <(cat "$BR"/lots/resolution-*/relus.txt | sort) "$BR/resolution.txt"
ok cmp -s <(for i in $(seq 1 "$(ls -d "$BR"/lots/resolution-* | wc -l)"); do cat "$BR/lots/resolution-$i/diff.patch"; done) "$BR/resolution.patch"
echo "--- lots/*/relus.txt :"; for d in "$BR"/lots/*/; do echo "$(basename "$d") : $(tr '\n' ' ' < "$d/relus.txt")"; done
printf '%s\n' "chore(facture): reçoit develop" > "$BR/titre.txt"; g axes | grep -E 'sortie'
lus() { local axe=$1 lot=$2; shift 2; { echo "aucun écart"; echo "Fichiers du diff lus :"; printf '%s\n' "$@"; } > "$BR/axe-$axe-lot-$lot.txt"; echo "lus $axe $lot ($*) : $(g lus "$axe" "$lot" | grep -E 'sortie')"; }
for lot in 1 2 resolution-1 resolution-2 resolution-3; do
  d=$BR/lots/$lot; [ -d "$d" ] || d=$BR/lots/lot-$lot
  mapfile -t fs < "$d/relus.txt"; lus 1 "$lot" "${fs[@]}"; lus 1 "$lot" "$X"
done
lus 2 resolution-2 "$M"; lus 2 1 "$G"
g c1 | tail -2 | head -1; g garde | grep sortie
cp "$BR/lots/resolution-2/relus.txt" "$E/sauve"; echo "$G" >> "$BR/lots/resolution-2/relus.txt"; echo "relus.txt de resolution-2 récrit : $(g garde | grep sortie)"; cp "$E/sauve" "$BR/lots/resolution-2/relus.txt"; echo "remis : $(g garde | grep sortie)"
mkdir -p "$BR/lots/resolution-4"; echo x > "$BR/lots/resolution-4/diff.patch"; echo "resolution-4 ajouté : $(g garde | grep sortie)"; rm -rf "$BR/lots/resolution-4"; echo "retiré : $(g garde | grep sortie)"
rm "$BR/lots/resolution-3/binaires.txt"; echo "binaires.txt de resolution-3 retiré : $(g garde | grep sortie)"
