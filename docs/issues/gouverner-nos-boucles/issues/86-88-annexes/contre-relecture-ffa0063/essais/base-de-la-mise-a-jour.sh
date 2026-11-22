#!/usr/bin/env bash
# Quelle base preuves.mjs (ffa0063) retient-il pour une branche de mise à jour d'un sujet (develop fusionné dans le
# sujet) ? Deux formes : le sujet a plus de commits que develop n'en apporte (S=5, D=1), puis l'inverse (S=1, D=5), puis l'égalité (S=3, D=3).
# La CLI est un talon qui écrit ses arguments. Usage : base-de-la-mise-a-jour.sh <racine d'un clone à ffa0063>
set -eu
CLONE=$1
V=$CLONE/skills/monorepo/socle-tests/references/scripts/verify
jouer() {
  S=$1; D=$2
  T=$(mktemp -d); nu=$T/nu.git; r=$T/r
  git init -q --bare "$nu"; git init -q -b develop "$r"; cd "$r"
  git config user.email jouet@example.invalid; git config user.name Jouet; git remote add origin "$nu"
  mkdir -p anchorpost scripts/verify node_modules/.bin
  printf 'node_modules/\ntalon.*\n' > .gitignore
  echo '{ "schema": "3", "rules": [] }' > anchorpost/anchorpost.json
  git add -A; git commit -qm d0; git -c protocol.version=2 push -q origin develop
  git checkout -qb sujet/x
  for k in $(seq 1 "$S"); do echo "$k" > "s$k.ts"; git add -A; git commit -qm "s$k"; done
  git -c protocol.version=2 push -q origin sujet/x
  git checkout -q develop
  for k in $(seq 1 "$D"); do echo "$k" > "d$k.ts"; git add -A; git commit -qm "d$k"; done
  git -c protocol.version=2 push -q origin develop
  git checkout -qb maj origin/sujet/x
  git merge -q --no-edit origin/develop
  cp "$V/preuves.mjs" "$V/coverage-diff-regles.mjs" scripts/verify/
  printf '#!/usr/bin/env node\nrequire("node:fs").appendFileSync(__dirname + "/../../talon.args", JSON.stringify(process.argv.slice(2)) + "\\n");\nprocess.stdout.write(JSON.stringify({ sufficiency: "observe", touched: [], gaps: [], warnings: [] }));\n' > node_modules/.bin/anchorpost
  chmod +x node_modules/.bin/anchorpost
  echo "S=$S D=$D : distance au sujet $(git rev-list --count origin/sujet/x..HEAD), à develop $(git rev-list --count origin/develop..HEAD)"
  node scripts/verify/preuves.mjs | head -1
  cd /; rm -rf "$T"
}
jouer 5 1
jouer 1 5
jouer 3 3
