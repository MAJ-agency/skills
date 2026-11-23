#!/bin/bash
. <dossier du contre-relecteur>/bin/matrice.sh
printf "$SD\n" > $R/raz.gitconfig
cas "s51 GIT_CONFIG_GLOBAL relatif, remise à zéro dans cwd ; système exacte" - "$SD$R\n" - $R GIT_CONFIG_GLOBAL=raz.gitconfig
cas "s51b témoin : même fichier en chemin absolu" - "$SD$R\n" - $R GIT_CONFIG_GLOBAL=$R/raz.gitconfig
rm -f $R/raz.gitconfig
mkdir -p $R/docs/.git
cas "s52 un .git vide dans le sous-dossier courant, exacte (racine réelle)" "$SD$R\n" "" - $R/docs
rmdir $R/docs/.git
