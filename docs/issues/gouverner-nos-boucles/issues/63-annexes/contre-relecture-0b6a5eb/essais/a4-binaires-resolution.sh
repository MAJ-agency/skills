# a4 : des binaires que seule la résolution touche, sous un chemin sensible ou non, texte d'un côté et binaire de
# l'autre ; et le même dans une résolution découpée en lots.
. "$(dirname "$0")/outils/maj.sh"
V=${VARIANTE:-petit}
jouet "a4-$V"
WEB=apps/web/public/x.bin            # binaire des deux côtés, hors chemin sensible, résolution « ours »
PNG=apps/api/src/auth/logo.png       # image binaire sous le chemin sensible, « ours » : ni illisible, mais sensible
T2B=apps/api/src/auth/t2b.ts         # le sujet le rend binaire, develop reste texte ; « ours » (garde le binaire)
B2T=apps/api/src/facture/b2t.ts      # develop le rend binaire, le sujet reste texte ; « ours » (garde le texte du sujet)
B2TT=apps/api/src/facture/b2tt.ts    # develop le rend binaire, le sujet reste texte ; « theirs » (prend le binaire)
QB="$(printf 'apps/api/src/auth/clé "q"\tx.bin')"   # binaire au nom cité, sous le chemin sensible, « ours »
GROS=apps/mobile/src/gros.ts         # pour la variante « lots » : la résolution dépasse 2 000 lignes
ecrire() {
  case $1 in
    commune) binaire c | vers "$WEB"; binaire c | vers "$PNG"; ec "$T2B" 'export const t = 1;'; ec "$B2T" 'export const b = 1;'; ec "$B2TT" 'export const b = 1;'; binaire c | vers "$QB" ;;
    sujet) binaire s | vers "$WEB"; binaire s | vers "$PNG"; binaire s | vers "$T2B"; ec "$B2T" 'export const b = 2;'; ec "$B2TT" 'export const b = 2;'; binaire s | vers "$QB" ;;
    develop) binaire d | vers "$WEB"; binaire d | vers "$PNG"; ec "$T2B" 'export const t = 3;'; binaire d | vers "$B2T"; binaire d | vers "$B2TT"; binaire d | vers "$QB" ;;
    resolu) binaire s | vers "$WEB"; binaire s | vers "$PNG"; binaire s | vers "$T2B"; ec "$B2T" 'export const b = 2;'; binaire d | vers "$B2TT"; binaire s | vers "$QB" ;;
  esac
  if [ "$V" = lots ]; then case $1 in commune) lignes_de c 2300 | vers "$GROS" ;; sujet|resolu) lignes_de s 2300 | vers "$GROS" ;; develop) lignes_de d 2300 | vers "$GROS" ;; esac; fi
}
maj 84
g diff | grep -vE '^\[outil' | sed "s#$BR#<br>#g"
for f in resolution.txt attendus.txt sans-ecart.txt binaires.txt illisibles.txt; do echo "--- $f :"; cat "$BR/$f"; done
for f in numstat-resolution-1.txt numstat-resolution-2.txt; do echo "--- $f :"; cat "$BR/$f"; done
[ ! -d "$BR/lots" ] || for d in "$BR"/lots/*/; do echo "== $(basename "$d") relus : $(tr '\n' '|' < "$d/relus.txt") ; binaires : $(tr '\n' '|' < "$d/binaires.txt")"; done
printf '%s\n' "chore(facture): reçoit develop" > "$BR/titre.txt"; g axes | grep -vE '^\[outil' | sed -n '/binaires sous/,$p'
if [ "$V" = lots ]; then
  for d in "$BR"/lots/resolution-*/; do l=$(basename "$d"); { echo "aucun écart"; echo "Fichiers du diff lus :"; } > "$BR/axe-1-lot-$l.txt"; echo "lus 1 $l (rien de lu) : $(g lus 1 "$l" | grep -vE '^\[outil' | tr '\n' ' ')"; done
else
  { echo "aucun écart"; echo "Fichiers du diff lus :"; } > "$BR/axe-1-lot-resolution.txt"; echo "lus 1 resolution (rien de lu) : $(g lus 1 resolution | grep -vE '^\[outil' | tr '\n' ' ')"
fi
{ echo "aucun écart"; echo "Fichiers du diff lus :"; } > "$BR/axe-1.txt"; echo "lus 1 (rien de lu) : $(g lus 1 | grep -vE '^\[outil' | tr '\n' ' ')"
