. <dossier du contre-relecteur>/outils/jouet.sh
jouet e10
git -C "$AU" switch -q -c fac-05 sujet/facture
mkdir -p "$AU/apps/api/src" "$AU/apps/web/src" "$AU/packages/x"
seq 1 1500 | sed 's/^/export const a/;s/$/ = 1;/' > "$AU/apps/api/src/gros.ts"
seq 1 1500 | sed 's/^/export const b/;s/$/ = 1;/' > "$AU/apps/web/src/gros.ts"
printf 'x\n' > "$AU/apps/web/src/$(printf 'tab\there')é \"q\".ts"
printf 'y\n' > "$AU/packages/x/-n"
printf 'z\n' > "$AU/apps/api/src/\$(touch PIEGE).ts"
printf '\x89PNG\r\n\x1a\n\0\0' > "$AU/apps/web/src/logo.png"
printf 'code\0nul\n' > "$AU/apps/api/src/auth/nul.ts"
S1=$(co "feat: gros (SPEC_ALL_FAC-1.03)")
git -C "$AU" push -q origin fac-05
cloner sujet/facture
br 13
g etape2 sujet/facture fac-05 "$S1" | tail -1
g liste | tail -2
g diff
printf '%s\n' "feat(facture): gros (SPEC_ALL_FAC-1.03)" > "$BR/titre.txt"
g axes
for l in 1 2; do
  [ -d "$BR/lots/lot-$l" ] || continue
  { echo "aucun écart"; echo "Critères non concernés : S1"; echo "Fichiers du diff lus :"; cat "$BR/lots/lot-$l/relus.txt"; } > "$BR/axe-1-lot-$l.txt"
  g lus 1 $l | tail -2
done
echo "--- un axe du lot 1 qui recopie un chemin cité sans ses guillemets :"
{ echo "aucun écart"; echo "Fichiers du diff lus :"; sed 's/^"\(.*\)"$/\1/' "$BR/lots/lot-1/relus.txt"; } > "$BR/axe-2-lot-1.txt"
g lus 2 1 | tail -3
ls "$SE" "$BR/arbre" | grep -c PIEGE
