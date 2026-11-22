#!/bin/bash
# Rejoue les § 1 (rouges avant) et § 2 (verts après) des tickets 75 à 79, tels qu'écrits, dans des arbres jetables.
# Usage : rouges-verts.sh <clone> <dossier des annexes> <dossier de travail>
set -u
C=$1 S=$2 W=$3
cd "$C"
f() { grep -E '^# (tests|pass|fail) |^not ok'; }
arbre() { rm -rf "$W/$1"; git worktree add -q --detach "$W/$1" 97d17e3; }
echo "== 75 § 1"; arbre r75; (cd "$W/r75" && git apply --include='*.test.mjs' "$S/75/ticket-75.patch" && git status --short && timeout 900 node --test --test-reporter=tap skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs skills/chaine/relecteur/scripts/relecteur.test.mjs 2>&1 | f)
echo "== 75 § 2"; (cd "$W/r75" && git checkout -q . && git apply "$S/75/ticket-75.patch" && timeout 900 node --test --test-reporter=tap skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs skills/chaine/relecteur/scripts/relecteur.test.mjs 2>&1 | f)
echo "== 76 § 1"; arbre r76; (cd "$W/r76" && git apply "$S/75/ticket-75.patch" && git apply --include='*.test.mjs' "$S/76/ticket-76.patch" && timeout 900 node --test --test-reporter=tap skills/chaine/relecteur/scripts/relecteur.test.mjs 2>&1 | f)
echo "== 76 § 2"; (cd "$W/r76" && git checkout -q . && git apply "$S/75/ticket-75.patch" && git apply "$S/76/ticket-76.patch" && timeout 900 node --test --test-reporter=tap skills/chaine/relecteur/scripts/relecteur.test.mjs 2>&1 | f)
echo "== 77 § 1"; arbre r77; (cd "$W/r77" && git apply "$S/75/ticket-75.patch" && git apply "$S/76/ticket-76.patch" && git apply --include='*.test.mjs' "$S/77/ticket-77.patch" && timeout 600 node --test --test-reporter=tap scripts/relecteur.test.mjs 2>&1 | f)
echo "== 77 § 2"; (cd "$W/r77" && git checkout -q . && git apply "$S/75/ticket-75.patch" && git apply "$S/76/ticket-76.patch" && git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md "$S/77/ticket-77.patch" && node "$S/77/version-suivante.mjs" "$S/77/ticket-77.patch" && timeout 600 node --test --test-reporter=tap scripts/relecteur.test.mjs scripts/depot.test.mjs 2>&1 | f)
echo "== 78 § 1"; arbre r78; (cd "$W/r78" && git apply --include='*.test.mjs' "$S/78/ticket-78.patch" && git status --short && timeout 900 node --test --test-reporter=tap skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs 2>&1 | f)
echo "== 78 § 2"; (cd "$W/r78" && git checkout -q . && git clean -fdq && git apply "$S/78/ticket-78.patch" && timeout 1200 node --test --test-reporter=tap skills/chaine/fusionner/scripts/suites-du-lot-5.test.mjs skills/chaine/fusionner/scripts/sensibles-du-capitaine.test.mjs skills/chaine/fusionner/scripts/verdict-du-capitaine.test.mjs skills/chaine/fusionner/scripts/sujet-fusionner.test.mjs skills/chaine/revue-adversariale/scripts/chemins-sensibles.test.mjs 2>&1 | f)
echo "== 79 § 1"; arbre r79; (cd "$W/r79" && git apply "$S/78/ticket-78.patch" && git apply --include='*.test.mjs' "$S/79/ticket-79.patch" && timeout 900 node --test --test-reporter=tap skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.test.mjs skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs 2>&1 | f)
echo "== 79 § 2"; (cd "$W/r79" && git checkout -q . && git clean -fdq && git apply "$S/78/ticket-78.patch" && git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md "$S/79/ticket-79.patch" && node "$S/79/version-suivante.mjs" "$S/79/ticket-79.patch" && timeout 900 node --test --test-reporter=tap skills/chaine/socle-chaine-de-production/references/agent/garde-fichiers.test.mjs skills/chaine/socle-chaine-de-production/references/agent/regles.test.mjs scripts/depot.test.mjs 2>&1 | f)
for d in r75 r76 r77 r78 r79; do git worktree remove --force "$W/$d"; done
echo FIN
