. <dossier du contre-relecteur>/outils/jouet.sh
jouet e11
git -C "$AU" switch -q -c fac-03 sujet/facture
ec apps/api/src/facture/total.ts 'export const total = (l) => 1;'
S1=$(co "feat: le total (SPEC_ALL_FAC-1.03)"); git -C "$AU" push -q origin fac-03
cloner sujet/facture
# Comme dans une session cloud : le distant passe par une réécriture d'URL posée par GIT_CONFIG_COUNT.
git -C "$SE" remote set-url origin "jouet:depot"
export GIT_CONFIG_COUNT=2 GIT_CONFIG_KEY_0=credential.interactive GIT_CONFIG_VALUE_0=false GIT_CONFIG_KEY_1="url.file://$O.insteadOf" GIT_CONFIG_VALUE_1="jouet:depot"
br 7
g etape2 sujet/facture fac-03 "$S1" | tail -2
g liste | tail -2
g diff | tail -4
