#!/usr/bin/env bash
# Contre-relecture PR 157, tour 2 : « Passer au pivot 3 » tel qu'écrit au sommet 8fc10ba, contre la CLI publiée.
# `bash jouer.sh <dossier vide> <low|high>` : un dépôt jouet pnpm au manifeste 2, une criticité de feature du niveau donné.
set -u
D="$1"; NIV="$2"; mkdir -p "$D" && cd "$D" || exit 2
g() { git -c user.email=essai@exemple.invalid -c user.name=essai "$@"; }
mkdir -p docs/metier/regles/all docs/metier/regles/demo docs/features/essai/all src anchorpost
echo "# Glossaire" > GLOSSARY.md
regle() { printf -- '---\nid: %s\ntitle: %s\nvalidation:\n  status: validated\n  date: 2026-11-20\n  by: Alice\n---\n\nTexte.\n' "$1" "$2" > "docs/metier/regles/$3/$1.md"; }
regle RULE_ALL_TST-1 "Règle prouvée au pivot 2" all
regle RULE_DEMO_TST-2 "Règle d'un contexte sans plancher" demo
printf '# SPEC_ALL_TST-3 — Essai\n\nStatus: ready-for-human\nType: task\nRègles: RULE_ALL_TST-1\n' > docs/features/essai/all/SPEC_ALL_TST-3-essai.spec.md
printf 'import { it } from "vitest";\nit("[RULE_ALL_TST-1] prouve", () => {});\nit("[RULE_DEMO_TST-2] prouve", () => {});\n' > src/x.spec.ts
cat > anchorpost/manifest.json <<J
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
  "featureCriticality": [{ "feature": "SPEC_ALL_TST-3", "level": "$NIV", "validation": { "date": "2026-11-10", "by": "Alice" } }]
}
J
printf 'packages:\n  - "apps/*"\n' > pnpm-workspace.yaml
echo '{"name":"essai","private":true,"scripts":{"anchorpost:index":"anchorpost index","anchorpost:check":"anchorpost check"}}' > package.json
printf 'engine-strict=false\n' > .npmrc
printf 'node_modules\n' > .gitignore
g init -q && g add -A && g commit -qm "pivot 2"
echo "== point 1 : pnpm add -Dw @maj-agency/anchorpost@^2.0.2"; pnpm add -Dw @maj-agency/anchorpost@^2.0.2 2>&1 | grep anchorpost; pnpm exec anchorpost --version
echo "== point 1 : pnpm anchorpost:index"; pnpm anchorpost:index 2>&1 | tail -6; echo "sortie ${PIPESTATUS[0]}"
echo "== point 2 sans commit : le plan, puis --apply (arbre sale)"; git status --short
pnpm exec anchorpost migrate manifest 2>&1; echo "sortie plan $?"
pnpm exec anchorpost migrate manifest --apply 2>&1; echo "sortie apply $?"; git diff --stat anchorpost/manifest.json
echo "== Commiter, puis le plan et --apply"; g add -A && g commit -qm "CLI 2"
pnpm exec anchorpost migrate manifest 2>&1; echo "sortie plan $?"; git status --short
pnpm exec anchorpost migrate manifest --apply 2>&1; echo "sortie apply $?"; git status --short; git diff anchorpost/manifest.json
echo "== migrate manifest --check"; pnpm exec anchorpost migrate manifest --check 2>&1; echo "sortie $?"
