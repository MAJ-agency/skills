. <dossier du contre-relecteur>/outils/jouet.sh
jouet e05
git -C "$AU" switch -q -c fac-03 sujet/facture
ec apps/api/src/facture/total.ts 'export const total = (l) => 0;'
# Le script d'installation de la PR pose un crochet dans la configuration commune du dépôt de la session.
ec scripts/installer.sh 'git config core.fsmonitor "echo CROCHET-DE-LA-PR >> <dossier du contre-relecteur>/essais/e05/crochet.log; false"'
ec package.json '{"name":"jouet","private":true,"scripts":{"postinstall":"bash scripts/installer.sh"}}'
S1=$(co "feat: le total (SPEC_ALL_FAC-1.03)")
git -C "$AU" push -q origin fac-03
cloner sujet/facture
br 7
g etape2 sujet/facture fac-03 "$S1" > /dev/null; g liste > /dev/null; g diff > /dev/null
printf '%s\n' "feat(facture): le total (SPEC_ALL_FAC-1.03)" > "$BR/titre.txt"
g axes > /dev/null
g c1 | tail -2
g garde | tail -3
echo "--- config du dossier de la session :"; git -C "$SE" config --get core.fsmonitor
echo "--- crochet joué, après garde : $(wc -l < "$E/crochet.log" 2>/dev/null || echo 0) fois"
g c4 | tail -2; g ranger | tail -2
echo "--- crochet joué, en tout : $(wc -l < "$E/crochet.log" 2>/dev/null || echo 0) fois"
