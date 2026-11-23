# a5 : la fusion faite depuis develop (premier parent : develop, second : le sujet) ; la résolution garde la clé
# binaire du sujet et jette celle de develop. Puis la même fusion dans le bon sens, suivie d'une retouche qui
# remet la forme du sujet après une forme neuve écrite par la résolution.
. "$(dirname "$0")/outils/maj.sh"
V=${VARIANTE:-inverse}
jouet "a5-$V"
F=apps/api/src/auth/cle.bin
git -C "$AU" switch -q develop; binaire develop | vers "$F"; co "feat: la clé de develop" > /dev/null; git -C "$AU" push -q origin develop
git -C "$AU" switch -q sujet/facture; binaire sujet | vers "$F"; co "feat(facture): la clé du sujet" > /dev/null; git -C "$AU" push -q origin sujet/facture
if [ "$V" = inverse ]; then
  git -C "$AU" switch -q -c maj/facture develop
  git -C "$AU" merge -q --no-edit sujet/facture > /dev/null 2>&1 && echo "fusion sans conflit ?!"
  git -C "$AU" checkout -q --theirs -- "$F"; git -C "$AU" add -A; git -C "$AU" -c core.editor=true commit -q --no-edit
elif [ "$V" = theirs-retouche ]; then
  git -C "$AU" switch -q -c maj/facture sujet/facture
  git -C "$AU" merge -q --no-edit develop > /dev/null 2>&1 && echo "fusion sans conflit ?!"
  git -C "$AU" checkout -q --theirs -- "$F"; git -C "$AU" add -A; git -C "$AU" -c core.editor=true commit -q --no-edit
  binaire sujet | vers "$F"; co "fix(facture): la clé du sujet, remise" > /dev/null
else
  git -C "$AU" switch -q -c maj/facture sujet/facture
  git -C "$AU" merge -q --no-edit develop > /dev/null 2>&1 && echo "fusion sans conflit ?!"
  binaire neuve | vers "$F"; git -C "$AU" add -A; git -C "$AU" -c core.editor=true commit -q --no-edit
  binaire sujet | vers "$F"; co "fix(facture): la clé du sujet, remise" > /dev/null
fi
S1=$(git -C "$AU" rev-parse HEAD); git -C "$AU" push -q origin maj/facture
echo "parents de la fusion : $(git -C "$AU" log --merges -1 --format='%P' | wc -w) ; ^1 = $(git -C "$AU" log --merges -1 --format='%P' | cut -d' ' -f1 | xargs git -C "$AU" log -1 --format=%s)"
cloner sujet/facture; br 85
g etape2 sujet/facture maj/facture "$S1" | tail -2 | head -1
g liste | grep -vE '^\[outil' | tail -3
g diff | grep -vE '^\[outil' | sed "s#$BR#<br>#g"
for f in fichiers.txt resolution.txt attendus.txt sans-ecart.txt binaires.txt numstat-resolution-1.txt numstat-resolution-2.txt; do echo "--- $f : $(tr '\n' '|' < "$BR/$f" 2>/dev/null)"; done
echo "--- resolution.patch :"; cat "$BR/resolution.patch" 2>/dev/null
{ echo "aucun écart"; echo "Fichiers du diff lus :"; } > "$BR/axe-1-lot-resolution.txt"; g lus 1 resolution | grep -vE '^\[outil' | tr '\n' ' '; echo
