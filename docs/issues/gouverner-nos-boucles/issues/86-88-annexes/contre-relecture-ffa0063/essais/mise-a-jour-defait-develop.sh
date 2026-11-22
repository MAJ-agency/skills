#!/usr/bin/env bash
# Le cas miroir de `mise-a-jour-plus-lache.sh` du tour 2 : une branche de mise à jour d'un sujet dont le sujet a plus de
# commits que develop n'en apporte, que preuves.mjs (ffa0063) compare donc au sujet, « plus large, jamais plus lâche »
# selon son en-tête et SKILL.md. Develop ajoute une règle ; la mise à jour la retire (une résolution malheureuse).
# Contre le sujet (fin de tour, pre-push, et la CI de la PR de mise à jour, dont la cible est le sujet) : rien. Contre la
# fusion recalculée (la fusion propre, HEAD~1 ici) : `rule-removed`. Contre develop (la livraison du sujet) : `rule-removed`.
# Sur un clone d'Anchorpost `develop` (index au pivot 3), la CLI publiée à part. MODE=enforce : le manifeste en `enforce`.
# Usage : mise-a-jour-defait-develop.sh <clone d'Anchorpost> <clone du plugin à ffa0063> <dossier de la CLI> <dossier de travail>
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
git checkout -qb sujet/x
mkdir -p docs/sources
for k in 1 2 3; do echo "ligne $k" > docs/sources/.sujet-$k.txt; git add -A; git commit -qm "sujet $k"; done
git push -q origin sujet/x 2>/dev/null
git checkout -q develop
sed -e 's/^id: RULE_ALL_ANC-28$/id: RULE_ALL_ANC-99/' -e 's/^title: .*/title: Une règle que develop ajoute/' docs/metier/regles/all/RULE_ALL_ANC-28.md > docs/metier/regles/all/RULE_ALL_ANC-99.md
git add -A; git commit -qm "develop : une règle neuve"; git push -q origin develop 2>/dev/null
git checkout -qb maj origin/sujet/x
git merge -q --no-edit origin/develop
git rm -q docs/metier/regles/all/RULE_ALL_ANC-99.md; git commit -qm "mise à jour : la règle de develop perdue à la résolution"
echo "distance au sujet $(git rev-list --count origin/sujet/x..HEAD), à develop $(git rev-list --count origin/develop..HEAD)"
echo "== fin de tour (node preuves.mjs, sans option)"
s=0; PROJET_RACINE=$T/r node "$RELAIS" || s=$?; echo "sortie $s"
echo "== la CI de la PR de mise à jour (node preuves.mjs --base origin/sujet/x, la cible de la PR)"
s=0; PROJET_RACINE=$T/r node "$RELAIS" --base origin/sujet/x || s=$?; echo "sortie $s"
echo "== la fusion recalculée (node preuves.mjs --base HEAD~1, la fusion propre du sujet et de develop)"
s=0; PROJET_RACINE=$T/r node "$RELAIS" --base HEAD~1 || s=$?; echo "sortie $s"
echo "== la livraison du sujet, la mise à jour entrée (node preuves.mjs --base origin/develop)"
s=0; PROJET_RACINE=$T/r node "$RELAIS" --base origin/develop || s=$?; echo "sortie $s"
git status --short | head -5
