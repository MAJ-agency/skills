. "$(dirname "$0")/lib.sh"
# S4 : un ticket qui ne vit que sur son sujet
socle s4; git checkout -q -b sujet; ecrire $T03 "$(ticket 'Règles: RULE_ALL_FAC-16\n')\n"; valider; ref sujet/facture
git checkout -q -b pr1 develop; echo x >> README.md; valider
calcul "S4  le ticket ne vit que sur origin/sujet/facture, la PR vise develop" exigée develop $(git rev-parse HEAD) "fix: total (SPEC_ALL_FAC-1.03)"
git checkout -q -b autre develop; ecrire $T03 "$(ticket 'Relecture: double\n')\n"; valider; ref sujet/autre-chose
calcul "S4b deux sujets portent le ticket, l'un dit Relecture: double" exigée develop $(git rev-parse pr1) "fix: total (SPEC_ALL_FAC-1.03)"
# S5 : un titre et une branche qui nomment deux tickets
socle s5; ecrire $T03 "$(ticket 'Règles: —\n')\n"; ecrire $T04 "$(ticket 'Relecture: double\n')\n"; valider; ref develop
git checkout -q -b feat/spec-all-fac-1-04-arrondi; echo x >> README.md; valider; T=$(git rev-parse HEAD)
calcul "S5  titre : .03 (aucune règle) ; branche : .04 (Relecture: double)" exigée develop $T "feat: total (SPEC_ALL_FAC-1.03)" feat/spec-all-fac-1-04-arrondi
calcul "S5b titre : .04 ; branche : .03" exigée develop $T "feat: SPEC_ALL_FAC-1.04" feat/spec-all-fac-1-03-total
calcul "S5c titre qui nomme .03 puis .04, branche sans ticket (limite 6 du ticket : le premier seul)" "non exigée" develop $T "feat: SPEC_ALL_FAC-1.03 et SPEC_ALL_FAC-1.04" pr/divers
calcul "S5d titre .03 seul, branche sans ticket" "non exigée" develop $T "feat: SPEC_ALL_FAC-1.03" pr/divers
# S23 : le ticket est absent de tous les arbres ; sa spec cite une règle haute
socle s23; ecrire $SPEC "$(spec 'Règles: RULE_ALL_FAC-16\n')\n"; valider; ref develop
git checkout -q -b pr1; echo x >> README.md; valider; T=$(git rev-parse HEAD)
DETAIL=1 calcul "S23 ticket .03 absent partout, sa spec cite une règle haute" exigée develop $T "feat: SPEC_ALL_FAC-1.03"
git checkout -q develop; ecrire $T03 "$(ticket '')\n"; valider; ref develop; git checkout -q -b pr2; echo x >> README.md; valider
calcul "S23b ticket .03 présent, sans ligne Règles:, sa spec cite une règle haute" exigée develop $(git rev-parse HEAD) "feat: SPEC_ALL_FAC-1.03"
# S6 : clone superficiel, clone partiel, clone à une seule branche
socle s6; git checkout -q -b pr1; echo "// x" >> $CODE; valider; git checkout -q develop; echo y >> README.md; valider; git checkout -q pr1; T=$(git rev-parse HEAD)
rm -rf $J/s6-sup $J/s6-part $J/s6-entier $J/s6-une; git clone -q --depth 1 --no-single-branch file://$J/s6 $J/s6-sup; git clone -q --filter=blob:none --no-checkout file://$J/s6 $J/s6-part 2>/dev/null; git clone -q file://$J/s6 $J/s6-entier; git clone -q --single-branch --branch pr1 file://$J/s6 $J/s6-une
cd $J/s6-entier; DETAIL= calcul "S6  témoin : clone entier, le diff touche le code d'une règle haute" exigée develop $T
cd $J/s6-sup; DETAIL=1 calcul "S6b clone superficiel (--depth 1)" illisible develop $T
cd $J/s6-part; DETAIL=1 calcul "S6c clone partiel (--filter=blob:none)" illisible develop $T
cd $J/s6-une; DETAIL=1 calcul "S6d clone d'une seule branche : pas d'origin/develop" illisible develop $T
cd $J/s6-entier; calcul "S6e sommet inconnu du dépôt" illisible develop $(printf 'b%.0s' $(seq 40))
cd $J/s6-entier/apps/api; calcul "S6f dossier courant : un sous-dossier" exigée develop $T
cd $J/s6-entier; rm -rf $J/s6-arbre; git worktree add -q $J/s6-arbre origin/develop 2>/dev/null; cd $J/s6-arbre && calcul "S6g arbre de travail lié" exigée develop $T
