#!/bin/bash
# Prépare le dépôt d'un autre propriétaire pour matrice.sh et suite.sh. Il faut pouvoir changer le propriétaire d'un
# dossier (root dans un conteneur jetable) : le dépôt est donné à l'uid 65534, git le tient alors pour douteux.
# Usage : TRAVAIL=<dossier privé, hors de tout dépôt> bash safe-directory/preparer.sh
: "${TRAVAIL:?TRAVAIL : un dossier privé où créer le dépôt}"
set -e
mkdir -p "$TRAVAIL/home" "$TRAVAIL/sys"; cd "$TRAVAIL"; rm -rf depot
env -i PATH=$PATH HOME=$TRAVAIL/home GIT_CONFIG_NOSYSTEM=1 bash -c '
git init -q -b main depot && cd depot && git config user.email a@b.c && git config user.name x && mkdir -p docs && echo x > docs/a.md && git add . && git commit -qm un && git update-ref refs/remotes/origin/develop HEAD && echo y > docs/b.md && git add . && git commit -qm deux && git rev-parse HEAD > ../tete'
chown -R 65534:65534 depot
mkdir -p xdg/git && printf "[safe]\n\tdirectory = $TRAVAIL/depot\n" > xdg/git/config && printf "[safe]\n\tdirectory = $TRAVAIL/depot\n" > autre.gitconfig
env -i PATH=$PATH HOME=$TRAVAIL/home GIT_CONFIG_NOSYSTEM=1 git -C depot rev-parse HEAD 2>&1 | head -1
