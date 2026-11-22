#!/usr/bin/env bash
# Essais de la contre-relecture de la PR 157 contre la CLI publiée : `bash jouer.sh <dossier vide>`.
# Un dépôt jouet pnpm au manifeste 2 (deux contextes, un seul plancher, une criticité de feature), la recette de
# GitHub Packages dans `.npmrc` ; puis l'étape 1, `init` et `migrate manifest` sur deux copies ; puis la réalisation.
set -u
D="$1"; mkdir -p "$D" && cd "$D" || exit 2
g() { git -c user.email=essai@exemple.invalid -c user.name=essai "$@"; }
echo "== npm view"; npm view @maj-agency/anchorpost versions dist-tags --json
mkdir -p v2 && cd v2
mkdir -p docs/metier/regles/all docs/metier/regles/demo docs/features/essai/all src anchorpost
echo "# Glossaire" > GLOSSARY.md
regle() { printf -- '---\nid: %s\ntitle: %s\nvalidation:\n  status: validated\n  date: 2026-11-20\n  by: Alice\n%s---\n\nTexte.\n' "$1" "$2" "${3:-}" > "docs/metier/regles/$4/$1.md"; }
regle RULE_ALL_TST-1 "Règle prouvée au pivot 2" "" all
regle RULE_DEMO_TST-2 "Règle d'un contexte sans plancher" "" demo
printf '# SPEC_ALL_TST-3 — Essai\n\nStatus: ready-for-human\nType: task\nRègles: RULE_ALL_TST-1\n' > docs/features/essai/all/SPEC_ALL_TST-3-essai.spec.md
printf 'import { it } from "vitest";\nit("[RULE_ALL_TST-1] prouve", () => {});\nit("[RULE_DEMO_TST-2] prouve", () => {});\n' > src/x.spec.ts
cat > anchorpost/manifest.json <<'J'
{
  "schema": "2",
  "name": "Essai",
  "pitch": "Un essai.",
  "audiences": ["MOA"],
  "contexts": [
    { "id": "all", "name": "Socle", "floor": { "date": "2026-11-01", "proven": 1 } },
    { "id": "demo", "name": "Démo" }
  ],
  "documents": [],
  "roles": { "Alice": "MOA" },
  "featureCriticality": [{ "feature": "SPEC_ALL_TST-3", "level": "high", "validation": { "date": "2026-11-10", "by": "Alice" } }]
}
J
printf 'packages:\n  - "apps/*"\n' > pnpm-workspace.yaml
echo '{"name":"essai","private":true,"scripts":{"anchorpost:index":"anchorpost index","anchorpost:check":"anchorpost check"}}' > package.json
printf 'engine-strict=false\n@maj-agency:registry=https://npm.pkg.github.com\n//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}\n' > .npmrc
git init -q && g add -A && g commit -qm "pivot 2"
echo "== étape 1, les lignes encore là"; NODE_AUTH_TOKEN=factice pnpm add -Dw @maj-agency/anchorpost@^2 2>&1 | tail -2; echo "sortie ${PIPESTATUS[0]}"
echo "== étape 1, les lignes retirées d'abord"; sed -i '/npm.pkg.github.com/d' .npmrc; pnpm add -Dw @maj-agency/anchorpost@^2 2>&1 | grep anchorpost; echo "sortie ${PIPESTATUS[0]}"
pnpm anchorpost:index 2>&1 | grep -E "schéma 2|écrit"; g add -A; g commit -qm "CLI 2"
cd .. && cp -r v2 init && cp -r v2 migrate
echo "== pivot-3 point 2 tel qu'écrit : pnpm anchorpost init"; (cd init && pnpm anchorpost init 2>&1; git diff anchorpost/manifest.json)
echo "== l'alternative que nomme l'alerte : migrate manifest --apply"; (cd migrate && pnpm exec anchorpost migrate manifest --apply 2>&1; git status --short; git diff anchorpost/manifest.json)
echo "== pnpm add @^2 sur une 2.0.1 déjà installée"; (cd v2 && pnpm add -Dw @maj-agency/anchorpost@2.0.1 >/dev/null 2>&1; pnpm add -Dw @maj-agency/anchorpost@^2 >/dev/null 2>&1; pnpm exec anchorpost --version)
echo "== la réalisation : tous les cas prouvés, sans nominal (1), basse avec nominal (2), moyenne sans familles (3)"
mkdir -p real && cd real && cp -r ../migrate/node_modules ../migrate/package.json . && pnpm exec anchorpost --version && mkdir -p docs/metier/regles/all src anchorpost && echo "# G" > GLOSSARY.md
printf '{ "schema": "3", "name": "R", "pitch": "x", "audiences": [], "contexts": [{ "id": "all", "name": "R", "floor": { "date": "2026-11-22", "proven": 0, "partial": 0 } }], "sufficiency": "observe", "documents": [], "roles": {} }\n' > anchorpost/manifest.json
c() { printf -- '---\nid: RULE_ALL_TST-%s\ntitle: Règle %s\nvalidation:\n  status: validated\n  date: 2026-11-20\n  by: Alice\ncriticality:\n  level: %s\n  by: agent\n  reason: essai\ncases:\n  - { id: %s, title: Un cas, kind: %s, scope: business }\n---\n\nTexte.\n' "$1" "$1" "$2" "$3" "$4" > "docs/metier/regles/all/RULE_ALL_TST-$1.md"; }
c 1 low bord edge; c 2 low normal nominal; c 3 medium normal nominal
printf 'import { it } from "vitest";\nit("[RULE_ALL_TST-1#bord] b", () => {});\nit("[RULE_ALL_TST-2#normal] n", () => {});\nit("[RULE_ALL_TST-3#normal] n", () => {});\n' > src/x.spec.ts
git init -q && g add -A && g commit -qm r && pnpm exec anchorpost index . >/dev/null
node -e 'for (const r of require("./anchorpost/anchorpost.json").rules) console.log(r.key, r.realisation.status, JSON.stringify(r.realisation.missing ?? {}), JSON.stringify(r.realisation.cases))'
