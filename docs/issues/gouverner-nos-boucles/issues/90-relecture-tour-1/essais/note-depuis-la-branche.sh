#!/usr/bin/env bash
# Essai de la règle du § 3 (A-205 point 2) : à la fusion de main, la note se repose depuis la branche, jamais depuis
# l'annexe. Branche = main d'origine + le patch du ticket 90 + une retouche de sa note (comme après une relecture) ;
# main bougé = la PR 152 (8.0.1). Usage : note-depuis-la-branche.sh <clone> <patch> <version-suivante.mjs> <recette: annexe|branche>
set -euo pipefail
CLONE=$1 PATCH=$2 VS=$3 RECETTE=$4
G="git -c user.email=r@example.org -c user.name=relecteur -c commit.gpgsign=false"
W=$(mktemp -d)/w
git -C "$CLONE" worktree add -q --detach "$W" ddb4265
cd "$W"
git apply "$PATCH" && $G commit -qam "fix: patch 90" && git add -A && $G commit -qm "fix: patch 90 (fichiers neufs)" --allow-empty
# La retouche de la relecture : une ligne ajoutée à la note 8.0.1 de la branche.
python3 - <<'PY'
p='NOTES-DE-VERSION.md'; s=open(p,encoding='utf8').read()
a="### Ce qu'un projet fait pour en profiter\n\n- **Reposer `socle-chaine-de-production`**"
assert s.count(a)>=1
s=s.replace(a,"### Ce qu'un projet fait pour en profiter\n\n- **RETOUCHE DU TOUR 1** : ligne ajoutée par la relecture.\n- **Reposer `socle-chaine-de-production`**",1)
open(p,'w',encoding='utf8').write(s)
PY
$G commit -qam "fix: retouche du tour 1, la note"
MAIN=origin/claude/suites-capitaine
if [ "$RECETTE" = branche ]; then git diff "$(git merge-base $MAIN HEAD)" HEAD -- NOTES-DE-VERSION.md > ../note-branche.patch; SOURCE=../note-branche.patch; else SOURCE=$PATCH; fi
$G merge --no-ff --no-edit $MAIN >/dev/null 2>&1 || true
echo "en conflit : $(git diff --name-only --diff-filter=U | tr '\n' ' ')"
git checkout $MAIN -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
node "$VS" "$SOURCE"
if grep -q 'RETOUCHE DU TOUR 1' NOTES-DE-VERSION.md; then echo "VERT ($RECETTE) : la retouche de la note est gardée"; R=0; else echo "ROUGE ($RECETTE) : la retouche de la note est perdue"; R=1; fi
grep -m3 -n '^## 8' NOTES-DE-VERSION.md
cd / && git -C "$CLONE" worktree remove --force "$W"
exit $R
