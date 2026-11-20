#!/bin/bash
. <dossier du contre-relecteur>/bin/matrice.sh
mkdir -p $N/h/git; printf "${SB}explicit\n" > $N/h/.gitconfig; printf "${SB}explicit\n" > $N/h/git/config
cas "b35 nu, HOME relatif (h/.gitconfig explicit)" - "" - $N HOME=h
cas "b36 nu, XDG_CONFIG_HOME relatif (h/git/config explicit)" - "" - $N XDG_CONFIG_HOME=h
cas "b37 nu, GIT_CONFIG_SYSTEM relatif (h/.gitconfig explicit)" - "" - $N GIT_CONFIG_SYSTEM=h/.gitconfig
rm -rf $N/h
