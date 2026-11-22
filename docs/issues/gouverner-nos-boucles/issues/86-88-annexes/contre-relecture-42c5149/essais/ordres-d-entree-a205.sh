#!/usr/bin/env bash
# Le geste du § 3 du ticket 86 (la PR « socle-tests » quand `main` a bougé), joué pour chaque ordre d'entrée des PR
# 152 (8.0.1), 153 (8.0.1, puis 8.0.2 si elle entre après 152) et 155 (« tickets », 8.1.0). `main` est simulé : chaque
# PR y entre par un squash, ses deux fichiers de version repris de `main` puis sa note posée à la version qu'elle prend
# (le correctif : le troisième nombre plus un ; « tickets » : son propre `version-mineure.mjs`). Puis, sur la branche de
# la PR 154 à 42c5149, le bloc du § 3 tel qu'écrit (fusion de `main`, reprise des deux fichiers, `version-mineure.mjs`).
# Variante A-205 : la branche est la PR retouchée (`retouche-154-tour-1.patch` commité sur 42c5149, `$5`) et la note se
# repose depuis la branche (`git diff $(git merge-base main HEAD) HEAD -- NOTES-DE-VERSION.md`, pris avant la fusion), ou,
# pour comparer, depuis l'annexe (le geste d'avant A-205). Le banc de texte de la PR juge la note obtenue.
# Usage : bash ordres-d-entree-a205.sh <clone de skills> <dossier de travail> <annexes 86-88> <annexes 83-85> <sommet retouché>
set -u
CLONE=$1 TRAVAIL=$2 A86=$3 A83=$4 SOMMET=$5
export GIT_AUTHOR_NAME=essai GIT_AUTHOR_EMAIL=essai@example.invalid GIT_COMMITTER_NAME=essai GIT_COMMITTER_EMAIL=essai@example.invalid
note_de() { # la note qu'une branche ajoute à NOTES-DE-VERSION.md, telle quelle
  git diff "origin/main...$1" -- NOTES-DE-VERSION.md | grep '^+' | grep -v '^+++' | sed 's/^+//'
}
entrer() { # $1 branche, $2 sorte (correctif | tickets) : un squash sur le `main` simulé
  local b=$1 sorte=$2
  git merge -q --squash "$b" >/dev/null 2>&1
  local conflits; conflits=$(git diff --name-only --diff-filter=U | tr '\n' ' ')
  git checkout -q HEAD -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
  if [ "$sorte" = tickets ]; then
    node "$A83/version-mineure.mjs" "$A83/pr-tickets.patch" >/dev/null
  else
    local v; v=$(node -p 'const [a,b,c]=require("./.claude-plugin/plugin.json").version.split(".").map(Number); `${a}.${b}.${c+1}`')
    { sed -n '1,/^## /{/^## /!p}' NOTES-DE-VERSION.md; note_de "$b" | sed "1s/^## [0-9.]*/## $v/"; sed -n '/^## /,$p' NOTES-DE-VERSION.md; } > ../notes.tmp && mv ../notes.tmp NOTES-DE-VERSION.md
    sed -i "s/\"version\": \"[^\"]*\"/\"version\": \"$v\"/" .claude-plugin/plugin.json
  fi
  git add -A && git commit -q -m "simulé : $b" && echo "  entrée $b (conflits du squash : ${conflits:-aucun}) → $(node -p 'require("./.claude-plugin/plugin.json").version')"
}
for ordre in "152" "155" "152 153 155"; do for source in branche annexe; do
  echo "== main + PR $ordre, la note depuis : $source"
  rm -rf "$TRAVAIL/m" "$TRAVAIL/b"; git -C "$CLONE" worktree prune
  git -C "$CLONE" worktree add -q --detach "$TRAVAIL/m" origin/main
  (cd "$TRAVAIL/m" && for n in $ordre; do
    case $n in 152) entrer origin/claude/suites-capitaine correctif ;; 153) entrer origin/claude/suites-relecteur correctif ;; 155) entrer origin/claude/preuve-suffisante-tickets tickets ;; esac
  done; git branch -f -q main-simule HEAD)
  git -C "$CLONE" worktree add -q --detach "$TRAVAIL/b" "$SOMMET"
  (cd "$TRAVAIL/b" &&
    if [ "$source" = branche ]; then git diff "$(git merge-base main-simule HEAD)" HEAD -- NOTES-DE-VERSION.md > ../note.patch; else cp "$A86/pr-socle-tests.patch" ../note.patch; fi
    git merge --no-ff --no-edit main-simule >/dev/null 2>&1; echo "  § 3 : en conflit : $(git diff --name-only --diff-filter=U | tr '\n' ' ')"
    git checkout -q main-simule -- NOTES-DE-VERSION.md .claude-plugin/plugin.json
    echo "  version-mineure : $(node "$A86/version-mineure.mjs" ../note.patch 2>&1)"
    git add -A && git commit -q --no-edit && echo "  après : $(node -p 'require("./.claude-plugin/plugin.json").version') ; notes : $(grep '^## ' NOTES-DE-VERSION.md | head -4 | sed 's/ — .*//' | tr '\n' ' ')"
    echo "  diff propre contre main simulé : $(git diff --stat main-simule HEAD | tail -1)"
    echo "  marqueurs de conflit restants : $(git grep -c '^<<<<<<<' -- . ':!docs' | wc -l)"
    node --test --test-name-pattern="règle d'ascendance du plugin 7.16.0" scripts/depot.test.mjs 2>&1 | grep -E '^# (pass|fail) ' | sed 's/^/ascendance /' | tr '\n' ' '
    node --test scripts/preuve-suffisante-socle-tests.test.mjs 2>&1 | grep -E '^# (pass|fail) |^not ok' | sed 's/^/banc de texte /' | tr '\n' ' '; echo)
  git -C "$CLONE" worktree remove --force "$TRAVAIL/b"; git -C "$CLONE" worktree remove --force "$TRAVAIL/m"
done; done
git -C "$CLONE" branch -D -q main-simule
