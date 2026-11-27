# e4b (relecture du ticket 63, tour 1, du relecteur) : un texte contre le sujet, que develop a rendu binaire.
. "$(dirname "$0")/../outils/jouet.sh"
# develop rend binaire un fichier de code ; le sujet le change en texte ; la résolution écrit un texte neuf.
F=apps/api/src/facture/regle.ts
jouet "e4b"
git -C "$AU" switch -q develop; printf 'export const a = 1;\n' > "$AU/$F"; co "feat: base" >/dev/null; git -C "$AU" push -q origin develop
git -C "$AU" switch -q sujet/facture; git -C "$AU" merge -q --no-edit develop; printf 'export const a = 2;\n' > "$AU/$F"; co "feat(facture): sujet" >/dev/null; git -C "$AU" push -q origin sujet/facture
git -C "$AU" switch -q develop; printf 'export const a = 3;\000\n' > "$AU/$F"; co "feat: develop" >/dev/null; git -C "$AU" push -q origin develop
git -C "$AU" switch -q -c maj/facture sujet/facture; git -C "$AU" merge -q --no-edit develop >/dev/null 2>&1 || true
printf 'export const a = 2;\nif (process.env.X) eval(process.env.X);\n' > "$AU/$F"
git -C "$AU" add -A; git -C "$AU" -c core.editor=true commit -q --no-edit
S1=$(git -C "$AU" rev-parse HEAD); git -C "$AU" push -q origin maj/facture
cloner sujet/facture; br 5
g etape2 sujet/facture maj/facture "$S1" >/dev/null; g liste | tail -2 | head -1; g diff | grep -E 'sortie|diff relu|résolution|illisibles'
echo "--- diff.patch :"; grep '^[-+]' "$BR/diff.patch" | grep -v '^+++\|^---'
echo "--- binaires.txt : $(cat "$BR/binaires.txt")"
{ echo "aucun écart"; echo "Fichiers du diff lus :"; } > "$BR/axe-1.txt"; g lus 1 | tail -3
