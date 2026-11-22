#!/usr/bin/env bash
# La repose de `preuves.mjs` et de son banc (597e05c) dans Anchorpost `develop`, comme la note 8.1.0 la dit : le banc
# sans, puis avec `scripts/docs/environnement-de-banc.mjs` ; puis avec trois `coverage-diff-regles.mjs` d'avant (plugin
# 3.7.1, 3.10.1, 3.10.4) ; enfin le relais lancé comme le socle le lance, et avec un argument sans `--`.
# Usage : repose-dans-anchorpost.sh <clone d'Anchorpost> <clone du plugin, tout l'historique> <dossier de travail>
set -u
AP=$1; PLUGIN=$2; T=$3
V=skills/monorepo/socle-tests/references/scripts/verify
rm -rf "$T"; git -C "$AP" worktree add -q --detach "$T" develop; cd "$T"
for f in preuves.mjs preuves.test.mjs; do git -C "$PLUGIN" show 597e05c:$V/$f > scripts/verify/$f; done
banc() { node --test --test-reporter=tap scripts/verify/preuves.test.mjs 2>&1 | grep -E "^not ok|^# (tests|pass|fail)|does not provide|Cannot find module" | sed -e "s#$T#<arbre>#g" -e "s#'/[^']*'#'<chemin>'#g"; }
echo "== le banc, sans scripts/docs/environnement-de-banc.mjs"; banc
git -C "$PLUGIN" show 597e05c:skills/monorepo/socle-monorepo/references/scripts/docs/environnement-de-banc.mjs > scripts/docs/environnement-de-banc.mjs
echo "== avec"; banc
cp scripts/verify/coverage-diff-regles.mjs "$T.cdr"
for c in 2fb450e 1b7c7fb a6d8e16; do
  git -C "$PLUGIN" show $c:$V/coverage-diff-regles.mjs > scripts/verify/coverage-diff-regles.mjs
  echo "== coverage-diff-regles.mjs de $c ($(git -C "$PLUGIN" show -s --format=%ad --date=short $c), plugin $(git -C "$PLUGIN" show $c:.claude-plugin/plugin.json | grep -o '"version": "[^"]*"'))"; banc
done
cp "$T.cdr" scripts/verify/coverage-diff-regles.mjs; rm -f "$T.cdr"
echo "== le relais (index au pivot 3, dépôt de la CLI : sortie 2 « CLI introuvable » attendue, décision 7)"
for a in "" "--base-auto" "--base origin/develop" "HEAD~3" "--"; do node scripts/verify/preuves.mjs $a 2>&1 | head -1 | sed "s|^|  [$a] |"; done
cd /; git -C "$AP" worktree remove --force "$T"
