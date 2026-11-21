. "$(dirname "$0")/../outils/jouet.sh"
jouet e15
F=apps/api/src/facture/droits.ts
git -C "$AU" switch -q develop; ec "$F" $'export function lire(admin) {\n  return 2;\n}\nexport const version = 1;'; co "feat: droits" > /dev/null; git -C "$AU" push -q origin develop
git -C "$AU" switch -q sujet/facture; git -C "$AU" merge -q --no-edit develop; git -C "$AU" push -q origin sujet/facture
sed -i 's/version = 1/version = 2/' "$AU/$F"; co "feat(facture): version 2" > /dev/null; git -C "$AU" push -q origin sujet/facture
# develop corrige une faille (une garde) et change la constante : conflit sur la constante.
git -C "$AU" switch -q develop
printf '%s\n' 'export function lire(admin) {' '  if (!admin) throw new Error("interdit");' '  return 2;' '}' 'export const version = 3;' > "$AU/$F"
co "fix: lire() vérifie le droit" > /dev/null; git -C "$AU" push -q origin develop
# La résolution garde la version du sujet en entier (« ours » sur le fichier) : la garde de develop est perdue.
git -C "$AU" switch -q -c maj/facture sujet/facture
git -C "$AU" merge -q --no-edit develop > /dev/null 2>&1 || true
git -C "$AU" checkout -q --ours -- "$F"; git -C "$AU" add -A; git -C "$AU" -c core.editor=true commit -q --no-edit
S1=$(git -C "$AU" rev-parse HEAD); git -C "$AU" push -q origin maj/facture
cloner sujet/facture; br 15
g etape2 sujet/facture maj/facture "$S1" | tail -2
g liste | grep -v '^\s*$' | tail -4
echo "--- fichiers.txt :"; cat "$BR/fichiers.txt"
g diff | grep -v '^\s*$' | tail -3
echo "--- attendus.txt : [$(cat "$BR/attendus.txt")] ; sans-ecart.txt : [$(cat "$BR/sans-ecart.txt")]"
printf '%s\n' "chore(facture): reçoit develop" > "$BR/titre.txt"
g axes | grep -v '^\s*$' | tail -3
echo "--- la fusion contre develop (ce qu'elle perd de develop) :"; git -C "$SE" diff "$S1^2" "$S1" -- "$F"
