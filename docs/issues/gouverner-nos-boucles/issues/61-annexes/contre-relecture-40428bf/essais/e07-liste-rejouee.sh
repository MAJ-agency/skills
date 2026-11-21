. <dossier du contre-relecteur>/outils/jouet.sh
jouet e07
git -C "$AU" switch -q -c fac-03 sujet/facture
ec apps/api/src/facture/total.ts 'export const total = (l) => { throw new Error("x"); };'
S1=$(co "feat: le total (SPEC_ALL_FAC-1.03)")
git -C "$AU" push -q origin fac-03
cloner sujet/facture
br 7
g etape2 sujet/facture fac-03 "$S1" > /dev/null; g liste | tail -2; g diff | tail -2
echo "=== liste rejouée, en échec (jq en panne sous a-juger) :"
cat > "$E/bin/jq" <<'J'
#!/bin/sh
exit 1
J
chmod +x "$E/bin/jq"
g liste | tail -2
rm "$E/bin/jq"
printf '%s\n' "feat(facture): le total (SPEC_ALL_FAC-1.03)" > "$BR/titre.txt"
echo "=== puis axes et c1 :"
g axes | tail -3
g c1 | tail -3
ls "$BR" | grep -E 'fait$|^fichiers'
