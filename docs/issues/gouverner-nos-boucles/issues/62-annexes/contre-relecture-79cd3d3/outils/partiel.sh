#!/bin/bash
# Clones partiels, superficiels, approfondis : la raison de meme-contenu.sh, et jamais une réponse fausse.
: "${CLONE:?}"
P=<dossier du contre-relecteur>/lab/p; rm -rf $P; mkdir -p $P/home; cd $P
export HOME=$P/home GIT_CONFIG_NOSYSTEM=1 GIT_AUTHOR_NAME=x GIT_AUTHOR_EMAIL=a@b.c GIT_COMMITTER_NAME=x GIT_COMMITTER_EMAIL=a@b.c
MC=$CLONE/skills/chaine/fusionner/scripts/meme-contenu.sh
git init -q -b develop src && cd src
mkdir -p scripts/docs docs apps; echo '{"index":[]}' > scripts/docs/index-generes.json; echo x > docs/a.md; for i in $(seq 1 30); do echo "l$i" > docs/f$i.md; done
git add . && git commit -qm init
git checkout -qb feat/a; echo a > apps/a.ts; git add . && git commit -qm a; V=$(git rev-parse HEAD)
git checkout -q develop; echo b > docs/b.md; git add . && git commit -qm b
git checkout -q feat/a; git merge -q --no-edit develop; T=$(git rev-parse HEAD)
cd .. && git clone -q --bare src origine && git -C origine config uploadpack.allowFilter true && git -C origine config uploadpack.allowAnySHA1InWant true
echo "V=$V T=$T"
juge() { local nom=$1 dir=$2; local out err; out=$(cd $dir && env -u GIT_CONFIG_NOSYSTEM bash $MC $V $T develop 2>$P/err); printf '%-58s %-10s %s\n' "$nom" "$out" "$(head -1 $P/err | cut -c1-110)"; }
cl() { local nom=$1; shift; git clone -q --no-checkout "$@" file://$P/origine $P/$nom 2>/dev/null; }
cl entier; juge "entier" $P/entier
cl blob --filter=blob:none; juge "--filter=blob:none" $P/blob
cl tree --filter=tree:0; juge "--filter=tree:0" $P/tree
cl lim --filter=blob:limit=1; juge "--filter=blob:limit=1" $P/lim
cl sp --filter=sparse:oid=develop:docs/a.md 2>/dev/null; [ -d $P/sp ] && juge "--filter=sparse:oid" $P/sp
cl sup --depth=1 --no-single-branch; juge "--depth=1" $P/sup
cl supp --depth=1 --no-single-branch --filter=blob:none; juge "--depth=1 --filter=blob:none" $P/supp
git -C $P/supp fetch -q --unshallow origin; juge "  puis --unshallow (reste partiel)" $P/supp
cl ref --filter=blob:none; git -C $P/ref config --unset remote.origin.partialclonefilter; git -C $P/ref fetch -q --refetch origin; juge "blob:none puis fetch --refetch sans filtre" $P/ref
git -C $P/ref config --unset remote.origin.promisor; git -C $P/ref config --unset extensions.partialclone; juge "  puis marques retirées (objets tous là)" $P/ref
cl nue --filter=blob:none; git -C $P/nue config --unset remote.origin.promisor; git -C $P/nue config --unset extensions.partialclone; juge "blob:none, marques retirées, objets manquants" $P/nue
cl nuet --filter=tree:0; git -C $P/nuet config --unset remote.origin.promisor; git -C $P/nuet config --unset extensions.partialclone; juge "tree:0, marques retirées, objets manquants" $P/nuet
cl inc --filter=blob:none; git -C $P/inc config --unset remote.origin.promisor; git -C $P/inc config --unset extensions.partialclone; printf '[remote "origin"]\n\tpromisor = true\n' > $P/inc.cfg; git -C $P/inc config include.path $P/inc.cfg; juge "blob:none, promisor dans un include du dépôt" $P/inc
echo "  git y voit-il un promisor ? $(git -C $P/inc config --get remote.origin.promisor) ; --local sans --includes : $(git -C $P/inc config --local --get remote.origin.promisor || echo rien)"
cl up --filter=blob:none; git -C $P/up config --rename-section remote.origin remote.amont 2>/dev/null; git -C $P/up remote add origin file://$P/origine; git -C $P/up fetch -q origin; git -C $P/up config extensions.partialclone amont; juge "blob:none, promisor sur un autre distant" $P/up
cl f2 --filter=blob:none; git -C $P/f2 config remote.origin.promisor False; juge "blob:none, promisor = False (casse)" $P/f2
cl wt --filter=blob:none; git -C $P/wt config --unset remote.origin.promisor; git -C $P/wt config --unset extensions.partialclone; git -C $P/wt config extensions.worktreeConfig true; git -C $P/wt config --worktree remote.origin.promisor true; juge "blob:none, promisor dans config.worktree" $P/wt
