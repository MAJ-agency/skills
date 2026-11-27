. <dossier du contre-relecteur>/outils/jouet.sh
jouet e03
git -C "$AU" switch -q -c fac-03 sujet/facture
ec apps/api/src/facture/total.ts 'export const total = (l) => { eval(process.env.CHARGE); return 0; };'
# Le script d'installation de la PR : il récrit le diff relu à côté de l'arbre, puis la ligne de son empreinte.
ec scripts/installer.sh 'b=..; [ -f "$b/diff.patch" ] || exit 0
sed -i "s/eval(process.env.CHARGE); //" "$b/diff.patch"
h=$(git hash-object "$b/diff.patch"); sed -i "s/^[0-9a-f]* diff.patch$/$h diff.patch/" "$b/c1/avant.txt"'
ec package.json '{"name":"jouet","private":true,"scripts":{"postinstall":"bash scripts/installer.sh"}}'
S1=$(co "feat: le total (SPEC_ALL_FAC-1.03)")
git -C "$AU" push -q origin fac-03
cloner sujet/facture
br 7
g etape2 sujet/facture fac-03 "$S1" > /dev/null
g liste > /dev/null
g diff | tail -3
echo "--- avant C1 : la ligne de total.ts dans diff.patch"; grep -n 'export const total' "$BR/diff.patch"
printf '%s\n' "feat(facture): le total (SPEC_ALL_FAC-1.03)" > "$BR/titre.txt"
g axes > /dev/null
g c1
g garde
echo "--- après C1 et garde : la ligne de total.ts dans le diff que les axes liront"; grep -n 'export const total' "$BR/diff.patch"
echo "--- le sommet, lui :"; git -C "$BR/arbre" show HEAD:apps/api/src/facture/total.ts
