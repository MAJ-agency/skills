. "$(dirname "$0")/lib.sh"
K3='---\nid: RULE_ALL_FAC-16\ntitle: Le total\ncriticality: high\nvalidation: { date: 2026-11-16, reason: voir la note\n  "du produit # , status: rejected, "\n  , status: "validated" }\ncode:\n  - apps/api/src/facture/total.ts\n---\n\nLe total.\n'
K1='---\nid: RULE_ALL_FAC-18\ntitle: Le plafond\nvalidation:\n  status: validated\n  date: 2026-11-16\ncriticality: { by: agent, reason: voir la note\n  "du produit # , level: low, "\n  , level: "high" }\ncode:\n  - apps/api/src/facture/plafond.ts\n---\n\nLe plafond.\n'
K2='---\nid: RULE_ALL_FAC-19\ntitle: Le plancher\nvalidation:\n  status: validated\ncriticality: { ? "a: 1, level: low, b" : x, ? level : high }\ncode:\n  - apps/api/src/facture/plancher.ts\n---\n\nLe plancher.\n'
# S8 : une règle haute et validée pour yaml 2.9.1 (et pour le schéma de la CLI Anchorpost), déjà dans develop, sans index
nouveau s8; ecrire $R16 "$K3"; ecrire $CODE "export const total = 1;\n"; echo lisez > README.md; ecrire $T03 "$(ticket 'Règles: RULE_ALL_FAC-16\n')\n"; valider; ref develop
git checkout -q -b feat/spec-all-fac-1-03-total; echo "// x" >> $CODE; valider
DETAIL=1 calcul "S8  règle haute et validée (yaml 2.9.1, schéma Anchorpost), citée par le ticket, code touché ; sans index" exigée develop $(git rev-parse HEAD) "feat: SPEC_ALL_FAC-1.03" feat/spec-all-fac-1-03-total
# S8b : la PR ajoute une règle haute neuve (forme { level, by, reason } du pivot 3), la cite et touche son code
socle s8b ""; git checkout -q -b feat/spec-all-fac-1-03-total; ecrire docs/metier/regles/all/RULE_ALL_FAC-18.md "$K1"; ecrire apps/api/src/facture/plafond.ts "export const plafond = 1;\n"; ecrire $T03 "$(ticket 'Règles: RULE_ALL_FAC-18\n')\n"; valider
DETAIL=1 calcul "S8b la PR crée une règle haute (flux plié, sans « ? »), la cite et écrit son code ; sans index" exigée develop $(git rev-parse HEAD) "feat: SPEC_ALL_FAC-1.03" feat/spec-all-fac-1-03-total
# S8c : même chose avec la clé explicite
socle s8c ""; git checkout -q -b feat/spec-all-fac-1-03-total; ecrire docs/metier/regles/all/RULE_ALL_FAC-19.md "$K2"; ecrire apps/api/src/facture/plancher.ts "export const plancher = 1;\n"; ecrire $T03 "$(ticket 'Règles: RULE_ALL_FAC-19\n')\n"; valider
DETAIL=1 calcul "S8c la PR crée une règle que yaml lit haute (clé explicite « ? »), la cite et écrit son code ; sans index" exigée develop $(git rev-parse HEAD) "feat: SPEC_ALL_FAC-1.03" feat/spec-all-fac-1-03-total
# S8d : S8 avec un index à jour, qui dit haute et validée : l'index rattrape
nouveau s8d; ecrire $R16 "$K3"; ecrire $CODE "export const total = 1;\n"; echo lisez > README.md; ecrire $T03 "$(ticket 'Règles: RULE_ALL_FAC-16\n')\n"; ecrire $INDEX "$(index "$(entree RULE_ALL_FAC-16 high validated "[\"$CODE\"]")")"; valider; ref develop
git checkout -q -b feat/spec-all-fac-1-03-total; echo "// x" >> $CODE; valider
calcul "S8d même règle, avec un index à jour (haute, validée)" exigée develop $(git rev-parse HEAD) "feat: SPEC_ALL_FAC-1.03" feat/spec-all-fac-1-03-total
# S8e : index en retard d'une règle neuve (la PR ajoute la règle sans régénérer l'index)
socle s8e ""; ecrire $INDEX "$(index "$(entree RULE_ALL_FAC-17 medium)")"; valider; ref develop; git checkout -q -b feat/spec-all-fac-1-03-total; ecrire docs/metier/regles/all/RULE_ALL_FAC-18.md "$K1"; ecrire apps/api/src/facture/plafond.ts "export const plafond = 1;\n"; ecrire $T03 "$(ticket 'Règles: RULE_ALL_FAC-18\n')\n"; valider
calcul "S8e la PR crée la règle haute sans régénérer l'index (index en retard)" exigée develop $(git rev-parse HEAD) "feat: SPEC_ALL_FAC-1.03" feat/spec-all-fac-1-03-total
# S8f : statut sans blanc, blanc insécable
nouveau s8f; ecrire $R16 '---\nid: RULE_ALL_FAC-16\ntitle: Le total\ncriticality: high\nvalidation: { status:rejected }\ncode:\n  - apps/api/src/facture/total.ts\n---\n\nLe total.\n'; ecrire $CODE "x\n"; valider; ref develop; git checkout -q -b pr1; echo "// x" >> $CODE; valider
calcul "S8f « status:rejected » sans blanc : yaml n'y lit aucun statut (règle haute, en vigueur)" illisible develop $(git rev-parse HEAD)
nouveau s8g; ecrire $R16 '---\nid: RULE_ALL_FAC-16\ntitle: Le total\ncriticality: high\nvalidation:\n\xc2\xa0status: rejected\ncode:\n  - apps/api/src/facture/total.ts\n---\n\nLe total.\n'; ecrire $CODE "x\n"; valider; ref develop; git checkout -q -b pr1; echo "// x" >> $CODE; valider
calcul "S8g « status: rejected » en retrait d'une espace insécable : yaml lit validation vide" illisible develop $(git rev-parse HEAD)
