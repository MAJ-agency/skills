. "$(dirname "$0")/../outils/jouet.sh"
jouet e19
N1="$(printf 'apps/api/src/tab\there é "q" $(touch PIEGE).ts')"
N2='apps/api/src/gros.ts'
git -C "$AU" switch -q develop
printf 'export const v = 1;\n' > "$AU/$N1"
seq 1 3000 | sed 's/^/export const a/;s/$/ = 1;/' > "$AU/$N2"
co "feat: deux fichiers" > /dev/null; git -C "$AU" push -q origin develop
git -C "$AU" switch -q sujet/facture; git -C "$AU" merge -q --no-edit develop; git -C "$AU" push -q origin sujet/facture
printf 'export const v = 2;\n' > "$AU/$N1"; sed -i 's/ = 1;$/ = 2;/' "$AU/$N2"; co "feat(facture): sujet" > /dev/null; git -C "$AU" push -q origin sujet/facture
git -C "$AU" switch -q develop
printf 'export const v = 3;\n' > "$AU/$N1"; sed -i 's/ = 1;$/ = 3;/' "$AU/$N2"; co "fix: develop" > /dev/null; git -C "$AU" push -q origin develop
git -C "$AU" switch -q -c maj/facture sujet/facture
git -C "$AU" merge -q --no-edit develop > /dev/null 2>&1 || true
git -C "$AU" checkout -q --ours -- "$N1" "$N2"; git -C "$AU" add -A; git -C "$AU" -c core.editor=true commit -q --no-edit
S1=$(git -C "$AU" rev-parse HEAD); git -C "$AU" push -q origin maj/facture
cloner sujet/facture; br 19
g etape2 sujet/facture maj/facture "$S1" | tail -2 | head -1
g liste | grep -E 'sortie|mise à jour'
g diff | grep -E 'sortie|aucun|résolution|diff relu|lots'
echo "--- resolution.txt :"; cat "$BR/resolution.txt"; echo "--- resolution.patch : $(wc -l < "$BR/resolution.patch") lignes ; en-têtes :"; grep '^diff --git' "$BR/resolution.patch"
printf '%s\n' "chore(facture): reçoit develop" > "$BR/titre.txt"
g axes | grep -E 'sortie|résolution|"' 
{ echo "aucun écart"; echo "Fichiers du diff lus :"; cat "$BR/resolution.txt"; } > "$BR/axe-1-lot-resolution.txt"; g lus 1 resolution | tail -2 | head -1
{ echo "aucun écart"; echo "Fichiers du diff lus :"; grep -v gros "$BR/resolution.txt"; } > "$BR/axe-1-lot-resolution.txt"; g lus 1 resolution | tail -3 | head -2
{ echo "aucun écart"; echo "Fichiers du diff lus :"; sed 's/^"\(.*\)"$/\1/' "$BR/resolution.txt"; } > "$BR/axe-1-lot-resolution.txt"; g lus 1 resolution | tail -3 | head -2
echo "PIEGE : $(find "$E" -name PIEGE | wc -l)"
g c1 | tail -1; g garde | tail -1
