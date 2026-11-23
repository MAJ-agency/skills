. "$(dirname "$0")/../outils/jouet.sh"
jouet e20
F=apps/api/src/facture/ancien.ts
git -C "$AU" switch -q develop; seq 1 30 | sed 's/^/export const a/;s/$/ = 1;/' > "$AU/$F"; co "feat: ancien" > /dev/null; git -C "$AU" push -q origin develop
git -C "$AU" switch -q sujet/facture; git -C "$AU" merge -q --no-edit develop; git -C "$AU" push -q origin sujet/facture
sed -i 's/a5 = 1/a5 = 5/' "$AU/$F"; co "feat(facture): a5" > /dev/null; git -C "$AU" push -q origin sujet/facture
# develop renomme le fichier ; la vraie fusion (renommages suivis) applique le changement du sujet au nouveau nom, sans conflit.
git -C "$AU" switch -q develop; git -C "$AU" mv "$F" apps/api/src/facture/nouveau.ts; co "refactor: renomme" > /dev/null; git -C "$AU" push -q origin develop
git -C "$AU" switch -q -c maj/facture sujet/facture; git -C "$AU" merge -q --no-edit develop; git -C "$AU" log --format='%h parents:%p' -1; git -C "$AU" show --stat --format= HEAD | tail -2
S1=$(git -C "$AU" rev-parse HEAD); git -C "$AU" push -q origin maj/facture
cloner sujet/facture; br 20
g etape2 sujet/facture maj/facture "$S1" | tail -2 | head -1
g liste | grep -E 'sortie|mise à jour'
echo "   fichiers.txt : [$(tr '\n' ' ' < "$BR/fichiers.txt")]"
g diff | grep -E 'sortie|aucun|résolution'
echo "   resolution.txt : [$(tr '\n' ' ' < "$BR/resolution.txt" 2>/dev/null)]"
echo "   resolution.patch :"; head -12 "$BR/resolution.patch" | sed 's/^/     /'
printf '%s\n' "chore(facture): reçoit develop" > "$BR/titre.txt"
g axes | grep -E 'sortie|aucun|échec|résolution'
echo "--- la même résolution, renommages suivis (le réglage par défaut) :"; git -C "$SE" -c diff.renames=true show --remerge-diff --format= "$S1" | head -5
