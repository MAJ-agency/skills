#!/usr/bin/env bash
# Simule l'entrée de PR sœurs dans main (squash, comme le capitaine), puis le geste du § 3 du ticket 83 sur la PR
# « tickets ». Usage : simuler.sh <dépôt> <dossier de travail> <nom> <branche:sorte>…  (sorte : correctif|mineure)
set -u
DEPOT=$1; W=$2; NOM=$3; shift 3
B=$(cd "$(dirname "$0")" && pwd)
PR=$(cd "$B/../pr" && pwd)
D="$W/arbres/sim-$NOM"
git -C "$DEPOT" worktree remove --force "$D" >/dev/null 2>&1
git -C "$DEPOT" worktree add -q --detach "$D" origin/main
cd "$D"
git config user.email contre@example.invalid; git config user.name contre-relecture
echo "# scénario $NOM : $*"
for bs in "$@"; do
  br=${bs%%:*}; sorte=${bs##*:}
  git diff origin/main...origin/$br > "$W/tmp/diff-$NOM.patch"
  git merge -q --squash origin/$br > "$W/tmp/merge-$NOM.log" 2>&1 || true
  conflits=$(git diff --name-only --diff-filter=U | tr '\n' ' ')
  if [ -n "$conflits" ] || ! git diff --cached --quiet -- NOTES-DE-VERSION.md .claude-plugin/plugin.json 2>/dev/null; then :; fi
  # reprise des deux fichiers de version de main', puis la note de la PR à la version suivante
  git checkout HEAD -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
  v=$(node "$B/poser-version.mjs" "$W/tmp/diff-$NOM.patch" "$sorte") || { echo "poser-version en échec"; exit 1; }
  autres=$(git diff --name-only --diff-filter=U | tr '\n' ' ')
  git add -A && git commit -q -m "squash $br ($v)" || { echo "commit du squash en échec"; exit 1; }
  echo "- $br entrée dans main : version $v ; conflits du squash : ${conflits:-aucun} ; restés après reprise : ${autres:-aucun}"
done
MAINP=$(git rev-parse HEAD)
git checkout -q --detach a95ab892c120a618e0010e3a0552af1d7c610a05
git merge --no-ff --no-edit "$MAINP" >/dev/null 2>&1
conflits=$(git diff --name-only --diff-filter=U | tr '\n' ' ')
echo "- § 3 sur la PR : git merge --no-ff de main' : conflits : ${conflits:-aucun}"
git checkout "$MAINP" -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
v=$(node "$PR/version-mineure.mjs" "$PR/pr-tickets.patch" 2>&1)
git add -A && git commit -q --no-edit
echo "- version-mineure.mjs : $v ; plugin.json : $(grep '"version"' .claude-plugin/plugin.json | tr -d ' ,')"
echo "- notes en tête : $(grep -m4 '^## [0-9]' NOTES-DE-VERSION.md | tr '\n' ';')"
# l'arbre obtenu, hors des deux fichiers de version, est-il main' + le diff de la PR ?
git worktree add -q --detach "$D-ref" "$MAINP" 2>/dev/null
(cd "$D-ref" && git apply --exclude=.claude-plugin/plugin.json --exclude=NOTES-DE-VERSION.md "$PR/pr-tickets.patch" && git add -A && git -c user.email=x@x.invalid -c user.name=x commit -q -m ref)
ecart=$(git diff --stat HEAD "$(git -C "$D-ref" rev-parse HEAD)" -- . ':!NOTES-DE-VERSION.md' ':!.claude-plugin/plugin.json' | tail -1)
echo "- arbre comparé à main' + patch de la PR (hors fichiers de version) : ${ecart:-identique}"
git -C "$DEPOT" worktree remove --force "$D-ref"
echo "- sommet du scénario : $(git rev-parse --short HEAD)"
