#!/usr/bin/env bash
# La réalisation selon la CLI : `bash realisation.sh <dossier vide> <dossier qui a node_modules de la 2.0.2>`.
set -u
D="$1"; N="$2"; mkdir -p "$D" && cd "$D" || exit 2
g() { git -c user.email=essai@exemple.invalid -c user.name=essai "$@"; }
ln -s "$N/node_modules" node_modules; cp "$N/package.json" .
pnpm exec anchorpost --version
mkdir -p docs/metier/regles/all src anchorpost && echo "# G" > GLOSSARY.md && printf 'node_modules\n' > .gitignore
printf '{ "schema": "3", "name": "R", "pitch": "x", "audiences": [], "contexts": [{ "id": "all", "name": "R", "floor": { "date": "2026-11-22", "proven": 0, "partial": 0 } }], "sufficiency": "observe", "documents": [], "roles": {} }\n' > anchorpost/manifest.json
FAM="limits empty invalid-input duplicate ordering time permissions rare-state volume failure"
na() { local out="notApplicableFamilies:\n"; for f in $FAM; do [ "$f" = "${1:-}" ] || [ "$f" = "${2:-}" ] || out+="  - { family: $f, reason: essai }\n"; done; printf "%s" "$out"; }
r() { printf -- "---\nid: RULE_ALL_TST-%s\ntitle: Règle %s\nvalidation:\n  status: validated\n  date: 2026-11-20\n  by: agent\ncriticality:\n  level: %s\n  by: agent\n  reason: essai\ncases:\n%b%b---\n\nTexte.\n" "$1" "$1" "$2" "$3" "${4:-}" > "docs/metier/regles/all/RULE_ALL_TST-$1.md"; }
NOM='  - { id: normal, title: Le cas normal, kind: nominal, scope: business }\n'
r 1 low '  - { id: bord, title: Un bord, kind: edge, scope: business }\n'
r 2 low "$NOM"
r 3 medium "$NOM"
r 4 medium "$NOM" "$(na)"
r 5 medium "$NOM"'  - { id: mauvais, title: Une entrée mal formée, kind: invalid, scope: business }\n' "$(na invalid-input)"
r 6 medium "$NOM" "$(na volume)"
r 7 medium "$NOM" "$(na volume)"
mkdir -p docs && printf '# Questions ouvertes\n\n## Questions\n\n### Combien de lignes au plus ?\n\n- Ouverte le : 2026-11-20\n- Source : essai\n- Bloque : RULE_ALL_TST-6\n- Tranchée le : —\n' > docs/questions-ouvertes.md
{ echo 'import { it } from "vitest";'; echo 'it("[RULE_ALL_TST-1#bord] b", () => {});'; for i in 2 3 4 5 6 7; do echo "it(\"[RULE_ALL_TST-$i#normal] n\", () => {});"; done; echo 'it("[RULE_ALL_TST-5#mauvais] m", () => {});'; } > src/x.spec.ts
mkdir -p test && printf 'import { it } from "vitest";\nit("[RULE_ALL_TST-5#mauvais] m", () => {});\n' > test/x.integration.spec.ts
g init -q && g add -A && g commit -qm r && pnpm exec anchorpost index . >/dev/null 2>&1; echo "index $?"
node -e 'for (const r of require("./anchorpost/anchorpost.json").rules) console.log(r.key, r.criticality?.level, r.realisation.status, JSON.stringify(r.realisation.missing ?? {}))'
pnpm exec anchorpost check . 2>&1 | grep -E "erreur|Groupe|TST-[3-7]" | head -12
