. "$(dirname "$0")/../outils/jouet.sh"
# Un cas de tri sur une PR de mise à jour : <nom> <contenu develop> <script python de develop> <résolution> <ligne de la base relevée>
cas() {
  local nom=$1 initial=$2 dev=$3 resolution=$4 ligne=$5
  jouet "e14-$nom"
  F=apps/api/src/facture/droits.ts
  git -C "$AU" switch -q develop; ec "$F" "$initial"; co "feat: droits" > /dev/null; git -C "$AU" push -q origin develop
  git -C "$AU" switch -q sujet/facture; git -C "$AU" merge -q --no-edit develop; git -C "$AU" push -q origin sujet/facture
  sed -i 's/version = 1/version = 2/' "$AU/$F"; co "feat(facture): version 2" > /dev/null; git -C "$AU" push -q origin sujet/facture
  git -C "$AU" switch -q develop
  python3 -c "import sys; p=sys.argv[1]; t=open(p).read(); $dev; open(p,'w').write(t)" "$AU/$F"
  co "refactor: develop" > /dev/null; git -C "$AU" push -q origin develop
  git -C "$AU" switch -q -c maj/facture sujet/facture
  git -C "$AU" merge -q --no-edit develop > /dev/null 2>&1 || true
  printf '%s\n' "$resolution" > "$AU/$F"
  git -C "$AU" add -A; git -C "$AU" -c core.editor=true commit -q --no-edit
  S1=$(git -C "$AU" rev-parse HEAD); git -C "$AU" push -q origin maj/facture
  cloner sujet/facture; br 12
  g etape2 sujet/facture maj/facture "$S1" > /dev/null; g liste > /dev/null; g diff > /dev/null
  echo "== $nom : le diff relu"; sed -n '/^@@/,$p' "$BR/diff.patch"
  echo "   develop (de la base commune à develop) :"; git -C "$SE" diff -U0 "$(git -C "$SE" merge-base origin/sujet/facture origin/develop)" origin/develop -- "$F" | sed -n '/^@@/,$p'
  for l in $ligne; do printf 'retirée\t%s\t%s\n' "$l" "$F"; done > "$BR/tri.txt"
  echo "   lignes relevées : $ligne ($(for l in $ligne; do git -C "$SE" show "origin/sujet/facture:$F" | sed -n "${l}p"; done | tr '\n' '|'))"
  g tri | grep -E '^[0-9]+ :'
}
# (a) la même ligne deux fois : develop en retire une, la résolution l'autre.
cas double $'export function lire(admin) {\n  verifier(admin);\n  verifier(admin);\n  return 2;\n}\nexport const version = 1;' \
  't=t.replace("  verifier(admin);\n  verifier(admin);\n","  verifier(admin);\n").replace("version = 1","version = 3")' \
  $'export function lire(admin) {\n  return 2;\n}\nexport const version = 2;' "2 3"
# (b) un morceau déplacé : develop déplace la garde de lire() en fin de fichier, la résolution la perd.
cas deplace $'export function lire(admin) {\n  if (!admin) throw new Error("interdit");\n  return 2;\n}\nexport const version = 1;\nexport const autre = 0;' \
  't=t.replace("  if (!admin) throw new Error(\"interdit\");\n","").replace("version = 1","version = 3").replace("export const autre = 0;","export const autre = 0;\nexport function garde(admin) {\n  if (!admin) throw new Error(\"interdit\");\n}")' \
  $'export function lire(admin) {\n  return 2;\n}\nexport const version = 2;\nexport const autre = 0;' "2"
# (c) une ligne modifiée par develop : la résolution perd la nouvelle version.
cas modifiee $'export function lire(admin) {\n  if (!admin) throw new Error("interdit");\n  return 2;\n}\nexport const version = 1;' \
  't=t.replace("throw new Error(\"interdit\")","throw new Forbidden(\"interdit\")").replace("version = 1","version = 3")' \
  $'export function lire(admin) {\n  return 2;\n}\nexport const version = 2;' "2"
# (d) témoin : develop retire vraiment la garde, la résolution le suit (écarté attendu).
cas temoin $'export function lire(admin) {\n  if (!admin) throw new Error("interdit");\n  return 2;\n}\nexport const version = 1;' \
  't=t.replace("  if (!admin) throw new Error(\"interdit\");\n","").replace("version = 1","version = 3")' \
  $'export function lire(admin) {\n  return 2;\n}\nexport const version = 2;' "2"
