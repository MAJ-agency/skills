#!/usr/bin/env bash
# Rejeu sur ffa0063 de `essais/mise-a-jour-plus-lache.sh` du tour 2 (seul le sommet nommé change). Une branche de mise à jour d'un sujet (develop fusionné dans le sujet) dont develop apporte plus de commits que le
# sujet n'en a : preuves.mjs (ffa0063) la compare à develop. Le sujet a ajouté une règle ; la mise à jour la retire (une
# résolution de conflit malheureuse). Contre develop (fin de tour, pre-push) : rien. Contre le sujet (la CI, la cible
# de la PR) : `rule-removed`. Sur un clone d'Anchorpost `develop` (index au pivot 3), la CLI publiée à part.
# MODE=enforce : le manifeste passe en `enforce` sur develop, avant le sujet.
# Usage : mise-a-jour-plus-lache.sh <clone d'Anchorpost> <clone du plugin à ffa0063> <dossier de la CLI> <dossier de travail>
set -eu
AP=$1; PLUGIN=$2; CLI=$3; T=$4
RELAIS=$PLUGIN/skills/monorepo/socle-tests/references/scripts/verify/preuves.mjs
rm -rf "$T"; mkdir -p "$T"
git clone -q --bare "$AP" "$T/nu.git"
git clone -q "$T/nu.git" "$T/r"; cd "$T/r"
git config user.email jouet@example.invalid; git config user.name Jouet
git checkout -q develop
if [ "${MODE:-observe}" = enforce ]; then sed -i 's/"sufficiency": "observe"/"sufficiency": "enforce"/' anchorpost/manifest.json; git commit -qam "develop : enforce"; git push -q origin develop 2>/dev/null; fi
mkdir -p node_modules/.bin; ln -s "$CLI/node_modules/.bin/anchorpost" node_modules/.bin/anchorpost
git check-ignore -q node_modules && echo "node_modules ignoré"
git checkout -qb sujet/x
sed -e 's/^id: RULE_ALL_ANC-28$/id: RULE_ALL_ANC-99/' -e 's/^title: .*/title: Une règle que le sujet ajoute/' docs/metier/regles/all/RULE_ALL_ANC-28.md > docs/metier/regles/all/RULE_ALL_ANC-99.md
git add -A; git commit -qm "sujet : une règle neuve"; git push -q origin sujet/x 2>/dev/null
git checkout -q develop
for k in 1 2; do echo "ligne $k" >> docs/sources/.essai-$k.txt 2>/dev/null || { mkdir -p docs/sources; echo "ligne $k" > docs/sources/.essai-$k.txt; }; git add -A; git commit -qm "develop $k"; done
git push -q origin develop 2>/dev/null
git checkout -qb maj origin/sujet/x
git merge -q --no-edit origin/develop
git rm -q docs/metier/regles/all/RULE_ALL_ANC-99.md; git commit -qm "mise à jour : la règle du sujet perdue à la résolution"
echo "distance au sujet $(git rev-list --count origin/sujet/x..HEAD), à develop $(git rev-list --count origin/develop..HEAD)"
echo "== fin de tour (node preuves.mjs, sans option)"
s=0; PROJET_RACINE=$T/r node "$RELAIS" || s=$?; echo "sortie $s"
echo "== la CI (node preuves.mjs --base origin/sujet/x, la cible de la PR)"
s=0; PROJET_RACINE=$T/r node "$RELAIS" --base origin/sujet/x || s=$?; echo "sortie $s"
git status --short | head -5
