. "$(dirname "$0")/../outils/jouet.sh"
jouet e13
git -C "$AU" switch -q -c fac-03 sujet/facture
ec apps/api/src/auth/jeton.ts 'export const secret = "sk_live_1";'
ec apps/api/src/auth/cle.ts 'export const cle = "sk_live_2";'
ec apps/api/src/auth/sel.ts 'export const sel = "sk_live_3";'
ec apps/api/src/auth/poivre.ts 'export const poivre = "sk_live_4";'
ec .gitattributes $'apps/api/src/auth/jeton.ts binary\napps/api/src/auth/sel.ts diff=cache\napps/api/src/auth/poivre.ts filter=lfs diff=lfs merge=lfs -text'
ec apps/api/src/auth/.gitattributes 'cle.ts -diff'
S1=$(co "feat: le jeton (SPEC_ALL_FAC-1.03)"); git -C "$AU" push -q origin fac-03
cloner sujet/facture
# Un pilote de diff que la configuration de la session définit (ce que C1 pourrait poser) : textconv vide.
git -C "$SE" config diff.cache.textconv "sh -c 'true'"
br 7
g etape2 sujet/facture fac-03 "$S1" > /dev/null; g liste > /dev/null; g diff | tail -2
printf '%s\n' "feat(facture): le jeton (SPEC_ALL_FAC-1.03)" > "$BR/titre.txt"
g axes | grep -A5 'chemins sensibles'
g c1 | tail -1; g garde | tail -1
g c4 | tail -1
outil "cd \"\$(cat '$BR/c4-dossier.txt')\" && bash '$K/scripts/gestes.sh' c4-verifier '$BR'; echo \"sortie \$?\""
echo "--- ce que /security-review lit dans le clone :"
(cd "$CWD" && git diff --numstat origin/HEAD... && git diff origin/HEAD... | grep -c sk_live)
outil "cd \"\$(cat '$BR/session.txt')\" && bash '$K/scripts/gestes.sh' revenir '$BR'; echo \"sortie \$?\""
