#!/usr/bin/env bash
# L'arbre de la PR (9db4fb3) est-il 2e87bae plus lot-5.patch (`git apply -3`), hors des deux fichiers de version ?
# Usage, depuis un clone neuf de MAJ-agency/skills, la PR rapatriée en `pr-149` : bash egalite.sh <lot-5.patch>
set -u
sha256sum "$1" | cut -c1-64
git worktree add -q --detach ../egalite 2e87bae415768c7578c8a4d3f0d9cca625a3dfa1 && cd ../egalite || exit 1
git apply -3 "$1" 2>/dev/null; echo "git apply -3 : sortie $? ; en conflit : $(git diff --name-only --diff-filter=U | tr '\n' ' ')"
git checkout -q HEAD -- NOTES-DE-VERSION.md .claude-plugin/plugin.json && git add -A
echo "écart hors des fichiers de version : $(git diff --cached pr-149 -- . ':!NOTES-DE-VERSION.md' ':!.claude-plugin/plugin.json' | wc -l) ligne(s)"
git diff --stat --cached pr-149 | tail -n 3
cd - >/dev/null && git worktree remove --force ../egalite
