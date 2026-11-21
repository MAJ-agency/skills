. "$(dirname "$0")/../outils/jouet.sh"
F=apps/api/src/facture/droits.ts
jouet e18
git -C "$AU" switch -q develop; ec "$F" $'export function lire(admin) {\n  return 2;\n}\nexport const version = 1;'; co "feat: droits" > /dev/null
ec docs/un.md un; co "docs: un" > /dev/null; ec docs/deux.md deux; co "docs: deux" > /dev/null; git -C "$AU" push -q origin develop
git -C "$AU" switch -q sujet/facture; ec docs/s.md s; co "docs: s" > /dev/null; git -C "$AU" push -q origin sujet/facture
# Une fusion à trois parents, tous du sujet ou de develop (commit-tree : git réduirait les têtes).
git -C "$AU" switch -q -c maj/facture sujet/facture
git -C "$AU" merge -q --no-edit develop > /dev/null
T=$(git -C "$AU" rev-parse 'HEAD^{tree}')
M=$(git -C "$AU" commit-tree "$T" -p sujet/facture -p develop -p develop~1 -m "Merge develop into maj/facture")
git -C "$AU" reset -q --hard "$M"; git -C "$AU" log --format='%h parents:%p' -1
S1=$(git -C "$AU" rev-parse HEAD); git -C "$AU" push -q -f origin maj/facture
cloner sujet/facture; br 18
g etape2 sujet/facture maj/facture "$S1" | tail -2 | head -1
g liste
g diff | tail -2
