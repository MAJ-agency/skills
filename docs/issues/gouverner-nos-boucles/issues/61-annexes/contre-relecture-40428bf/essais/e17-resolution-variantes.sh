. "$(dirname "$0")/../outils/jouet.sh"
F=apps/api/src/facture/droits.ts
BASE0=$'export function lire(admin) {\n  if (!admin) throw new Error("interdit");\n  return 2;\n}\nexport const version = 1;'
# Prépare develop et le sujet (le sujet change version), puis develop applique <python> ; ouvre maj/facture et fusionne.
prepare() {
  jouet "e17-$1"
  git -C "$AU" switch -q develop; ec "$F" "$BASE0"; co "feat: droits" > /dev/null; git -C "$AU" push -q origin develop
  git -C "$AU" switch -q sujet/facture; git -C "$AU" merge -q --no-edit develop; git -C "$AU" push -q origin sujet/facture
  sed -i 's/version = 1/version = 2/' "$AU/$F"; co "feat(facture): version 2" > /dev/null; git -C "$AU" push -q origin sujet/facture
  git -C "$AU" switch -q develop
  python3 -c "import sys; p=sys.argv[1]; t=open(p).read(); $2; open(p,'w').write(t)" "$AU/$F"
  co "fix: develop" > /dev/null; git -C "$AU" push -q origin develop
  git -C "$AU" switch -q -c maj/facture sujet/facture
}
fusion() { git -C "$AU" merge -q --no-edit "$@" > /dev/null 2>&1 || true; }
resoudre() { printf '%s\n' "$1" > "$AU/$F"; git -C "$AU" add -A; git -C "$AU" -c core.editor=true commit -q --no-edit; }
jouer() { # pousse, rejoue etape2, liste, diff, axes ; montre ce qui compte
  S1=$(git -C "$AU" rev-parse HEAD); git -C "$AU" push -q origin maj/facture
  cloner sujet/facture; br 17
  g etape2 sujet/facture maj/facture "$S1" | tail -2 | head -1
  g liste | grep -E 'sortie|mise à jour|refus|fusion' | head -3
  [ -f "$BR/liste.faite" ] || return 0
  g diff | grep -E 'sortie|aucun|résolution|diff relu' 
  printf '%s\n' "chore(facture): reçoit develop" > "$BR/titre.txt"
  g axes | grep -E 'sortie|revue|résolution'
  echo "   fichiers.txt : $(tr '\n' ' ' < "$BR/fichiers.txt")"
  echo "   resolution.txt : $(tr '\n' ' ' < "$BR/resolution.txt" 2>/dev/null)"
  echo "   resolution.patch (lignes changées) :"; grep '^[-+]' "$BR/resolution.patch" 2>/dev/null | grep -v '^+++\|^---' | sed 's/^/     /'
}
echo "######## v1 : la résolution récrit le morceau de develop sans le retirer"
prepare v1 't=t.replace("throw new Error(\"interdit\")","throw new Forbidden(\"interdit\")").replace("version = 1","version = 3")'
fusion develop; resoudre $'export function lire(admin) {\n  if (!admin) console.log("interdit");\n  return 2;\n}\nexport const version = 2;'
jouer; printf 'retirée\t2\t%s\n' "$F" > "$BR/tri.txt"; g tri | grep -E '^[0-9]+ :'
echo "######## v2 : la résolution ajoute du code qu'aucun côté n'avait"
prepare v2 't=t.replace("version = 1","version = 3")'
fusion develop; resoudre $'export function lire(admin) {\n  if (!admin) throw new Error("interdit");\n  eval(process.env.CHARGE);\n  return 2;\n}\nexport const version = 2;'
jouer; printf 'ajoutée\t3\t%s\n' "$F" > "$BR/tri.txt"; g tri | grep -E '^[0-9]+ :'
echo "######## v3 : une fusion à trois parents"
prepare v3 't=t.replace("return 2;","return 3;")'
git -C "$AU" switch -q -c autre develop; ec docs/autre.md 'autre'; co "docs: autre" > /dev/null; git -C "$AU" switch -q maj/facture
fusion develop autre; git -C "$AU" log --format='%h parents:%p' -1
jouer
echo "######## v4 : la fusion n'est pas le dernier commit (une retouche après elle)"
prepare v4 't=t.replace("throw new Error(\"interdit\")","throw new Forbidden(\"interdit\")").replace("version = 1","version = 3")'
fusion develop; resoudre $'export function lire(admin) {\n  return 2;\n}\nexport const version = 2;'
ec apps/api/src/facture/total.ts 'export const total = () => 42;'; co "fix(facture): retouche" > /dev/null
jouer
echo "######## v5 : une résolution vide (fusion sans conflit), avec et sans retouche"
prepare v5 't=t.replace("return 2;","return 3;")'
fusion develop; git -C "$AU" log --format='%h parents:%p' -1
jouer
