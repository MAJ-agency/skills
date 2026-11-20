. <dossier du contre-relecteur>/outils/jouet.sh
jouet e01
git -C "$AU" switch -q -c fac-03 sujet/facture
ec apps/api/src/facture/total.ts 'export const total = (l) => l.reduce((a, b) => a + b, 0);'
S1=$(co "feat: le total (SPEC_ALL_FAC-1.03)")
git -C "$AU" push -q origin fac-03
cloner sujet/facture
br 7
g etape2 sujet/facture fac-03 "$S1"
g liste
g diff
printf '%s\n' "feat(facture): le total (SPEC_ALL_FAC-1.03)" > "$BR/titre.txt"
g axes
g c1
g garde
g contexte
g accord
echo "--- fichiers du brouillon"; ls "$BR"
