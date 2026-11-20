#!/bin/bash
# Prépare les dépôts de la matrice : depot (arbre de travail, uid 65534), nu (dépôt nu à moi, nom sans .git),
# nu-autre (dépôt nu, uid 65534), mien (arbre de travail à moi).
: "${TRAVAIL:?}"
set -e
rm -rf "$TRAVAIL"; mkdir -p "$TRAVAIL/home" "$TRAVAIL/sys"; cd "$TRAVAIL"
env -i PATH=$PATH HOME=$TRAVAIL/home GIT_CONFIG_NOSYSTEM=1 bash -c '
git init -q -b main depot && cd depot && git config user.email a@b.c && git config user.name x && mkdir -p docs && echo x > docs/a.md && git add . && git commit -qm un && git update-ref refs/remotes/origin/develop HEAD && git rev-parse HEAD > ../v && echo y > docs/b.md && git add . && git commit -qm deux && git rev-parse HEAD > ../tete
cd .. && git clone -q --bare depot nu && git -C nu update-ref refs/remotes/origin/develop $(cat v)
git clone -q --bare depot nu-autre && git -C nu-autre update-ref refs/remotes/origin/develop $(cat v)
git clone -q depot mien && git -C mien update-ref refs/remotes/origin/develop $(cat v) && git -C mien checkout -q $(cat tete)'
chown -R 65534:65534 depot nu-autre
