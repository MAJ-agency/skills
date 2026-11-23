. <dossier du contre-relecteur>/outils/jouet.sh
jouet e09
F=apps/api/src/facture/droits.ts
# Sur develop : deux fonctions gardées par la même ligne, et une constante.
git -C "$AU" switch -q develop
ec $F $'export function ancienne(admin) {\n  if (!admin) throw new Error("interdit");\n  return 1;\n}\nexport function lire(admin) {\n  if (!admin) throw new Error("interdit");\n  return 2;\n}\nexport const version = 1;'
co "feat: droits" > /dev/null; git -C "$AU" push -q origin develop
# Le sujet part de là et change la constante.
git -C "$AU" switch -q sujet/facture; git -C "$AU" merge -q --no-edit develop
git -C "$AU" push -q origin sujet/facture
git -C "$AU" switch -q -c fac-04 sujet/facture
sed -i 's/version = 1/version = 2/' "$AU/$F"; co "feat(facture): version 2" > /dev/null
git -C "$AU" switch -q sujet/facture; git -C "$AU" merge -q --ff-only fac-04; git -C "$AU" push -q origin sujet/facture
# develop retire la fonction obsolète (sa garde avec elle) et change la constante : conflit.
git -C "$AU" switch -q develop
python3 - "$AU/$F" <<'P'
import sys; p=sys.argv[1]; t=open(p).read()
t=t.replace('export function ancienne(admin) {\n  if (!admin) throw new Error("interdit");\n  return 1;\n}\n','').replace('version = 1','version = 3')
open(p,'w').write(t)
P
co "refactor: retire ancienne" > /dev/null; git -C "$AU" push -q origin develop
# La PR de mise à jour : develop fusionné dans le sujet ; la résolution du conflit perd aussi la garde de lire().
git -C "$AU" switch -q -c maj/facture sujet/facture
git -C "$AU" merge -q --no-edit develop > /dev/null 2>&1 || true
printf '%s\n' 'export function lire(admin) {' '  return 2;' '}' 'export const version = 2;' > "$AU/$F"
git -C "$AU" add -A; git -C "$AU" -c core.editor=true commit -q --no-edit
S1=$(git -C "$AU" rev-parse HEAD); git -C "$AU" push -q origin maj/facture
cloner sujet/facture
br 12
g etape2 sujet/facture maj/facture "$S1" | tail -1
g liste | tail -3
g diff | tail -2
echo "--- le diff relu de droits.ts :"; sed -n '/droits.ts/,$p' "$BR/diff.patch"
echo "--- l'axe relève la garde retirée de lire() : ligne 6 de la base"
git -C "$SE" show "origin/sujet/facture:$F" | sed -n 6p
printf 'retirée\t6\t%s\n' "$F" > "$BR/tri.txt"
g tri
