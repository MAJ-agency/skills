. "$(dirname "$0")/lib.sh"
E16H="$(entree RULE_ALL_FAC-16 high validated "[\"$CODE\"]")"; E16N="$(entree RULE_ALL_FAC-16 '' validated '[]')"; E17="$(entree RULE_ALL_FAC-17 medium)"
pr_code() { git checkout -q -b $1 ${2:-develop}; echo "// x" >> $CODE; valider; }
pr_readme() { git checkout -q -b $1 ${2:-develop}; echo x >> README.md; valider; }
# S7 : l'index absent, vide, corrompu
socle s7; pr_code pr1; calcul "S7  index absent partout (témoin) : les en-têtes disent haute, le diff touche le code" exigée develop $(git rev-parse HEAD)
socle s7a ""; mkdir -p anchorpost; : > $INDEX; valider; ref develop; pr_readme pr1; DETAIL=1 calcul "S7a index vide (0 octet) sur les trois arbres, aucune règle haute, README seul" illisible develop $(git rev-parse HEAD)
socle s7b ""; ecrire $INDEX '{ "schema": "3", "rules": [ { "key": "RULE_ALL_FAC-16", '; valider; ref develop; pr_readme pr1; calcul "S7b index corrompu (JSON tronqué), README seul" illisible develop $(git rev-parse HEAD)
socle s7c ""; ecrire $INDEX '{ "schema": "1", "rules": [] }'; valider; ref develop; pr_readme pr1; calcul "S7c index d'un autre schéma" illisible develop $(git rev-parse HEAD)
socle s7d ""; ecrire $INDEX '{ "schema": "3" }'; valider; ref develop; pr_readme pr1; calcul "S7d index sans liste rules" illisible develop $(git rev-parse HEAD)
socle s7e ""; ecrire $INDEX '[]'; valider; ref develop; pr_readme pr1; calcul "S7e index qui est une liste" illisible develop $(git rev-parse HEAD)
socle s7f ""; ecrire $INDEX 'null'; valider; ref develop; pr_readme pr1; calcul "S7f index qui vaut null" illisible develop $(git rev-parse HEAD)
socle s7g; ecrire $INDEX '{ "schema": "3", "rules": [ '; valider; ref develop; pr_code pr1; calcul "S7g index corrompu partout, en-tête haute, le diff touche le code : illisible (rien n'est lu)" illisible develop $(git rev-parse HEAD)
socle s7h; git checkout -q -b pr1; ecrire $INDEX 'pas du json'; echo "// x" >> $CODE; valider; calcul "S7h index corrompu à la tête seule ; la base dit haute, le diff touche le code" exigée develop $(git rev-parse HEAD)
socle s7i ""; git checkout -q -b pr1; ecrire $INDEX 'pas du json'; valider; calcul "S7i index corrompu à la tête seule, aucune règle haute" illisible develop $(git rev-parse HEAD)
socle s7j; ecrire $INDEX "$(index "$E16N , $E17")"; valider; ref develop; pr_code pr1; calcul "S7j index périmé (R16 sans criticité), en-tête haute, le diff touche le code (A-134)" exigée develop $(git rev-parse HEAD)
socle s7k "criticality: low\n"; ecrire $INDEX "$(index "$E16H , $E17")"; valider; ref develop; pr_code pr1; calcul "S7k index haute, en-tête basse, le diff touche le code" exigée develop $(git rev-parse HEAD)
socle s7l; ecrire $INDEX "$(index "$(entree RULE_ALL_FAC-16 high rejected "[\"$CODE\"]") , $E17")"; valider; ref develop; pr_code pr1; calcul "S7l index : R16 rejetée ; en-tête : validée et haute" exigée develop $(git rev-parse HEAD)
socle s7m "" ; ecrire $INDEX "$(index "$E17")"; valider; ref develop; pr_readme pr1; calcul "S7m index valide, aucune règle haute, README seul (témoin)" "non exigée" develop $(git rev-parse HEAD)
socle s7n; mkdir -p $INDEX; echo x > $INDEX/x; valider; ref develop; pr_code pr1; calcul "S7n anchorpost/anchorpost.json est un dossier ; en-tête haute" exigée develop $(git rev-parse HEAD)
socle s7o ""; ecrire $INDEX "$(index "$(entree RULE_ALL_FAC-16 HIGH)")"; valider; ref develop; pr_readme pr1; calcul "S7o index : level « HIGH » (hors vocabulaire)" illisible develop $(git rev-parse HEAD)
socle s7p ""; mkdir -p anchorpost; printf '\xef\xbb\xbf%s' "$(index "$E16H")" > $INDEX; valider; ref develop; pr_code pr1; calcul "S7p index valide précédé d'une marque d'ordre des octets, R16 haute dans l'index seul : illisible (côté sûr)" illisible develop $(git rev-parse HEAD)
socle s7q ""; ecrire $INDEX '{ "schema": "3", "rules": [ { "key": "RULE_ALL_FAC-16", "criticality": { "level": "high" }, "code": ["apps/api/src/facture/total.ts"] } ], "rules": [] }'; valider; ref develop; pr_code pr1; calcul "S7q index à deux clés « rules », la seconde vide : lu comme JSON.parse le lit, la dernière" "non exigée" develop $(git rev-parse HEAD)
socle s7r ""; ecrire $INDEX '{ "schema": "3", "rules": [ { "key": "RULE_ALL_FAC-16", "criticality": null, "code": [] } ] }'; valider; ref develop; pr_readme pr1; DETAIL=1 calcul "S7r index : criticality null" illisible develop $(git rev-parse HEAD)
