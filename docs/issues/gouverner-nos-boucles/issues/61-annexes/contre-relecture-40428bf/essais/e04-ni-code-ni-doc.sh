. <dossier du contre-relecteur>/outils/jouet.sh
jouet e04
git -C "$AU" switch -q develop
git -C "$AU" switch -q -c migration
ec db/migrations/002_purge.sql 'DROP TABLE factures; -- une migration que rien ne relit'
ec infra/main.tf 'resource "aws_s3_bucket" "b" { acl = "public-read" }'
S1=$(co "chore: purge")
git -C "$AU" push -q origin migration
cloner develop
br 9
g etape2 develop migration "$S1" | tail -2
g liste | tail -2
g diff | tail -3
printf '%s\n' "chore: purge" > "$BR/titre.txt"
g axes
g c1 | tail -3
echo "--- attendus.txt :"; cat "$BR/attendus.txt"
