. <dossier du contre-relecteur>/outils/jouet.sh
jouet e08
git -C "$AU" switch -q -c fac-03 sujet/facture
ec apps/api/src/auth/jeton.ts 'export const duree = 1; export const secret = "sk_live_0123456789"; // fuite'
# Un projet marque ses fichiers sensibles -diff (ou binary) : par accident ou non, la PR le porte.
ec .gitattributes 'apps/api/src/auth/** -diff'
S1=$(co "feat: le jeton (SPEC_ALL_FAC-1.03)")
git -C "$AU" push -q origin fac-03
cloner sujet/facture
br 7
g etape2 sujet/facture fac-03 "$S1" > /dev/null; g liste | tail -2; g diff | tail -3
echo "--- le diff relu des axes porte le secret :"; grep -c 'sk_live' "$BR/diff.patch"
printf '%s\n' "feat(facture): le jeton (SPEC_ALL_FAC-1.03)" > "$BR/titre.txt"
g axes | grep -E 'sensibles|apps/api'
g c1 | tail -2; g garde | tail -2
g c4 | tail -2
outil "cd \"\$(cat '$BR/c4-dossier.txt')\" && bash '$K/scripts/gestes.sh' c4-verifier '$BR'; echo \"sortie \$?\""
echo "--- ce que /security-review lit dans le clone (git diff origin/HEAD... et --merge-base) :"
(cd "$CWD" && git diff origin/HEAD... ; echo "== --merge-base :"; git diff --merge-base origin/HEAD; echo "== numstat :"; git diff --numstat origin/HEAD...)
outil "cd \"\$(cat '$BR/session.txt')\" && bash '$K/scripts/gestes.sh' revenir '$BR'; echo \"sortie \$?\""
