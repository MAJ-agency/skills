. "$(dirname "$0")/lib.sh"
# S1 : citation par Règles:
socle s1; ecrire $T03 "$(ticket 'Règles: RULE_ALL_FAC-16\n')\n"; valider ticket; ref develop
git checkout -q -b feat/spec-all-fac-1-03-total; echo plus >> README.md; valider pr
calcul "S1  le ticket cite une règle haute (Règles:), le diff ne touche que README" exigée develop $(git rev-parse HEAD) "feat: total (SPEC_ALL_FAC-1.03)" feat/spec-all-fac-1-03-total
calcul "S1b même PR, sans titre ni branche : aucun ticket" "non exigée" develop $(git rev-parse HEAD)
calcul "S1c même PR, ticket par la branche seule" exigée develop $(git rev-parse HEAD) "" feat/spec-all-fac-1-03-total
# S2 : fichier d'une règle haute, code d'une règle haute
socle s2; git checkout -q -b pr1; echo "Précision." >> $R16; valider; calcul "S2  le diff touche le fichier d'une règle haute" exigée develop $(git rev-parse HEAD)
git checkout -q develop; git checkout -q -b pr2; echo "// x" >> $CODE; valider; calcul "S2b le diff touche un fichier de code d'une règle haute" exigée develop $(git rev-parse HEAD)
git checkout -q develop; git checkout -q -b pr3; echo x >> README.md; valider; calcul "S2c témoin : README seul, aucun ticket" "non exigée" develop $(git rev-parse HEAD)
git checkout -q develop; git checkout -q -b pr4; echo x >> $R17; valider; calcul "S2d le diff touche le fichier d'une règle moyenne" "non exigée" develop $(git rev-parse HEAD)
git checkout -q develop; git checkout -q -b pr5; git rm -q $CODE; valider; calcul "S2e le diff supprime le fichier de code d'une règle haute" exigée develop $(git rev-parse HEAD)
git checkout -q develop; git checkout -q -b pr6; git mv $CODE apps/api/src/facture/somme.ts; valider; calcul "S2f le diff renomme le fichier de code (--no-renames)" exigée develop $(git rev-parse HEAD)
# S3 : changement de niveau sur un seul arbre
socle s3 "criticality: medium\n"; git checkout -q -b pr1; regle RULE_ALL_FAC-16 "criticality: high\n" "code:\n  - $CODE\n" > $R16; valider
calcul "S3a la tête monte la règle à haute (base et develop : moyenne)" exigée develop $(git rev-parse HEAD)
socle s3b; git checkout -q -b pr1; regle RULE_ALL_FAC-16 "criticality: low\n" "code:\n  - $CODE\n" > $R16; valider
calcul "S3b la tête baisse la règle de haute à basse" exigée develop $(git rev-parse HEAD)
# S3c : haute sur origin/develop seul ; base = sujet en retard (moyenne), la PR touche le code
socle s3c "criticality: medium\n"; ref sujet/facture; regle RULE_ALL_FAC-16 "criticality: high\n" "code:\n  - $CODE\n" > $R16; valider "develop monte"; ref develop
git checkout -q -b pr1 refs/remotes/origin/sujet/facture; echo "// x" >> $CODE; valider
calcul "S3c haute sur origin/develop seul, base = sujet en retard, le diff touche le code" exigée sujet/facture $(git rev-parse HEAD)
git checkout -q -b pr2 refs/remotes/origin/sujet/facture; ecrire $T03 "$(ticket 'Règles: RULE_ALL_FAC-16\n')\n"; valider
calcul "S3d haute sur origin/develop seul, le ticket (sur la tête) la cite" exigée sujet/facture $(git rev-parse HEAD) "SPEC_ALL_FAC-1.03"
# S3e : haute sur la base (sujet) seule ; develop et la tête (partie d'avant) : moyenne ; le diff touche le code
socle s3e "criticality: medium\n"; git checkout -q -b vieux; echo "// x" >> $CODE; valider pr; T=$(git rev-parse HEAD)
git checkout -q -b sujet develop; regle RULE_ALL_FAC-16 "criticality: high\n" "code:\n  - $CODE\n" > $R16; valider "le sujet monte"; ref sujet/facture
calcul "S3e haute sur la base (sujet avancé) seule, la tête part d'avant, le diff touche le code" exigée sujet/facture $T
# S3f : haute au départ seul : la cible et develop l'ont baissée depuis, la tête ne l'a pas touchée
socle s3f; git checkout -q -b pr1; echo x >> README.md; valider; T=$(git rev-parse HEAD)
git checkout -q develop; regle RULE_ALL_FAC-16 "criticality: low\n" "code:\n  - $CODE\n" > $R16; valider baisse; ref develop
calcul "S3f haute au départ et à la tête, baissée depuis sur develop ; README seul" "non exigée" develop $T
git checkout -q pr1; echo "// x" >> $CODE; valider; calcul "S3g même histoire, le diff touche le code (haute à la tête)" exigée develop $(git rev-parse HEAD)
# S3h : la PR rejette une règle haute (statut) ; la PR supprime le fichier d'une règle haute
socle s3h; git checkout -q -b pr1; regle RULE_ALL_FAC-16 "criticality: high\n" "code:\n  - $CODE\n" rejected > $R16; valider; calcul "S3h la tête rejette une règle haute" exigée develop $(git rev-parse HEAD)
git checkout -q develop; git checkout -q -b pr2; git rm -q $R16; valider; calcul "S3i la tête supprime le fichier d'une règle haute" exigée develop $(git rev-parse HEAD)
# S3j : niveau par l'index de la tête seul (criticité reçue d'une feature), aucun en-tête ne le dit
socle s3j ""; ecrire $INDEX "$(index "$(entree RULE_ALL_FAC-16 '') , $(entree RULE_ALL_FAC-17 medium)")"; valider index; ref develop
git checkout -q -b pr1; ecrire $INDEX "$(index "$(entree RULE_ALL_FAC-16 high) , $(entree RULE_ALL_FAC-17 medium)")"; valider
calcul "S3j l'index de la tête seul dit haute (criticité d'une feature)" exigée develop $(git rev-parse HEAD)
