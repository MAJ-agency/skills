#!/usr/bin/env bash
# Essai de la règle du § 3 (A-205 point 2, A-212) : à une fusion de main, la note se repose depuis la branche, jamais
# depuis l'annexe. Branche = <base> + le patch du ticket 90 + une ligne ajoutée à sa note (une retouche de relecture) ;
# main bougé = <main>. Usage, depuis un clone qui a <base> et <main> :
#   essai-note-depuis-la-branche.sh <patch> <version-suivante.mjs> <base> <main> <annexe|branche>
# « annexe » : la recette d'avant (la note de l'annexe) ; « branche » : celle du § 3. Sortie 0 si la retouche est gardée.
set -euo pipefail
PATCH=$(realpath "$1") VS=$(realpath "$2") BASE=$3 MAIN=$4 RECETTE=$5
G="git -c user.email=essai@example.org -c user.name=essai -c commit.gpgsign=false"
CLONE=$(pwd) W=$(mktemp -d)/w
git worktree add -q --detach "$W" "$BASE"
cd "$W"
git apply "$PATCH" && git add -A && $G commit -qm "fix: patch 90"
python3 - <<'PY'
p = 'NOTES-DE-VERSION.md'; s = open(p, encoding='utf8').read()
a = "### Ce qu'un projet fait pour en profiter\n\n- **Reposer `socle-chaine-de-production`**"
assert a in s
s = s.replace(a, "### Ce qu'un projet fait pour en profiter\n\n- **RETOUCHE DU TOUR 1** : ligne ajoutée par la relecture.\n- **Reposer `socle-chaine-de-production`**", 1)
open(p, 'w', encoding='utf8').write(s)
PY
$G commit -qam "fix: retouche du tour 1, la note"
if [ "$RECETTE" = branche ]; then
  git diff "$(git merge-base "$MAIN" HEAD)" HEAD -- NOTES-DE-VERSION.md > ../note-de-la-branche.patch; SOURCE=../note-de-la-branche.patch
else SOURCE=$PATCH; fi
$G merge --no-ff --no-edit "$MAIN" > /dev/null 2>&1 || true
echo "en conflit : $(git diff --name-only --diff-filter=U | tr '\n' ' ')"
git checkout "$MAIN" -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
node "$VS" "$SOURCE"
if grep -q 'RETOUCHE DU TOUR 1' NOTES-DE-VERSION.md; then echo "VERT ($RECETTE) : la retouche de la note est gardée"; R=0; else echo "ROUGE ($RECETTE) : la retouche de la note est perdue"; R=1; fi
grep -m3 '^## [0-9]' NOTES-DE-VERSION.md; grep '"version"' .claude-plugin/plugin.json
cd "$CLONE" && git worktree remove --force "$W"
exit $R
