. "$(dirname "$0")/../outils/jouet.sh"
F=apps/api/src/facture/droits.ts
jouet e21
git -C "$AU" switch -q develop; ec "$F" $'export function lire(admin) {\n  if (!admin) throw new Error("interdit");\n  return 2;\n}\nexport const version = 1;'; co "feat: droits" > /dev/null; git -C "$AU" push -q origin develop
git -C "$AU" switch -q sujet/facture; git -C "$AU" merge -q --no-edit develop; git -C "$AU" push -q origin sujet/facture
sed -i 's/version = 1/version = 2/' "$AU/$F"; co "feat(facture): version 2" > /dev/null; git -C "$AU" push -q origin sujet/facture
git -C "$AU" switch -q develop; python3 -c "import sys;p=sys.argv[1];t=open(p).read();t=t.replace('  if (!admin) throw new Error(\"interdit\");\n','').replace('version = 1','version = 3');open(p,'w').write(t)" "$AU/$F"; co "refactor: la garde passe au routeur" > /dev/null; git -C "$AU" push -q origin develop
git -C "$AU" switch -q -c maj/facture sujet/facture; git -C "$AU" merge -q --no-edit develop > /dev/null 2>&1 || true
printf '%s\n' 'export function lire(admin) {' '  if (admin === undefined) return 2;' '  return 2;' '}' 'export const version = 2;' > "$AU/$F"; git -C "$AU" add -A; git -C "$AU" -c core.editor=true commit -q --no-edit
S1=$(git -C "$AU" rev-parse HEAD); git -C "$AU" push -q origin maj/facture
cloner sujet/facture; br 21
g etape2 sujet/facture maj/facture "$S1" > /dev/null; g liste > /dev/null; g diff > /dev/null
echo "   diff relu :"; grep '^[-+] ' "$BR/diff.patch"; echo "   resolution.patch :"; grep '^[-+] ' "$BR/resolution.patch"
printf 'retirée\t2\t%s\n' "$F" > "$BR/tri.txt"; g tri | grep -E '^[0-9]+ :'
