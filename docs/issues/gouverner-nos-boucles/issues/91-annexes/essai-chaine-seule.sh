#!/usr/bin/env bash
# Pose un dépôt « chaîne seule » depuis un plugin (poser-chaine-seule.mjs), installe ses dépendances, puis joue ce que
# son gate joue la première fois : pnpm lint, check:contexte, prettier --list-different, les liens markdown, puis le
# premier commit (pre-commit : lint-staged et check:commit), et compte ce que lint-staged a reformaté sous scripts/.
# Usage : bash essai-chaine-seule.sh <plugin> <jouet neuf> [--geler]
#   --geler : avant check:contexte, gèle les références que nomme le gate, comme les skills le disent (étape 7 de
#             socle-monorepo, étape 3 de socle-chaine-de-production), et génère le registre des coûts (étape 2.3).
set -u
ICI=$(cd "$(dirname "$0")" && pwd)
PLUGIN=$1 JOUET=$2 GELER=${3:-}
node "$ICI/poser-chaine-seule.mjs" "$PLUGIN" "$JOUET" || exit 2
JOUET=$(cd "$JOUET" && pwd)
cd "$JOUET"
git init -q -b main && git config user.email jouet@example.org && git config user.name jouet
pnpm install --silent > /dev/null 2>&1 || { echo "pnpm install en échec"; exit 2; }
echo "== versions : node $(node --version), pnpm $(pnpm --version), eslint $(npx eslint --version), prettier $(npx prettier --version)"
git add -A
echo "== pnpm lint"; pnpm -s lint 2>&1 | sed "s#$JOUET#<jouet>#g" | tail -40; echo "sortie ${PIPESTATUS[0]}"
if [ "$GELER" = --geler ]; then
  echo "== génération du registre des coûts (étape 2.3)"; node scripts/docs/couts.mjs; git add -A
  echo "== gel des références nommées (à l'allumage)"
  node scripts/verify/references-agent.mjs 2>&1 | sed -nE 's/^  (.+):([0-9]+) — [^«]+« (.+) » introuvable$/\1:\2:\3/p' > "$JOUET.geler"
  node -e 'const fs=require("fs");const f="scripts/verify/references-agent-dette.json";const d=JSON.parse(fs.readFileSync(f));d.references=fs.readFileSync(process.argv[1],"utf8").split("\n").filter(Boolean);fs.writeFileSync(f,JSON.stringify(d,null,2)+"\n")' "$JOUET.geler"
  sed 's/^/  gelée : /' "$JOUET.geler"; rm -f "$JOUET.geler"; git add -A
fi
echo "== pnpm check:contexte"; pnpm -s check:contexte 2>&1 | tail -20; echo "sortie ${PIPESTATUS[0]}"
echo "== prettier --list-different, par dossier"; npx prettier --list-different . 2>/dev/null | awk -F/ '{ print (NF > 1 ? $1 "/" $2 : $1) }' | sort | uniq -c
echo "== liens markdown cassés"; node "$ICI/liens.mjs" .
echo "== premier commit (pre-commit : lint-staged, check:commit ; commit-msg : commitlint)"
avant=$(git write-tree)
git commit -q -m "chore: pose le socle en chaîne seule" > "$JOUET.commit" 2>&1; echo "sortie $?"; tail -5 "$JOUET.commit"; rm -f "$JOUET.commit"
echo "== reformatés par lint-staged au commit, par dossier"
git diff --stat --name-only "$avant" HEAD | awk -F/ '{ print (NF > 1 ? $1 "/" $2 : $1) }' | sort | uniq -c
