#!/bin/bash
. <dossier du contre-relecteur>/bin/matrice.sh
M=$D/mien
rm -rf $D/arbre-lie; env -i PATH=$PATH HOME=$D/home GIT_CONFIG_NOSYSTEM=1 git -C $M worktree prune; env -i PATH=$PATH HOME=$D/home GIT_CONFIG_NOSYSTEM=1 git -C $M worktree add -q --detach $D/arbre-lie $(cat $D/tete) 2>/dev/null
chown -R 65534:65534 $D/arbre-lie
cas "w01 arbre lié d'un autre propriétaire, rien" - "" - $D/arbre-lie
cas "w02 arbre lié, globale exacte (chemin de l'arbre lié)" "$SD$D/arbre-lie\n" "" - $D/arbre-lie
cas "w03 arbre lié, globale = dépôt principal" "$SD$M\n" "" - $D/arbre-lie
cas "w04 arbre lié, *" "$SD*\n" "" - $D/arbre-lie
