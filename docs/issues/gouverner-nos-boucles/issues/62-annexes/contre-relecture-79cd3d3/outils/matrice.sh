#!/bin/bash
# Matrice safe.directory / safe.bareRepository : git lui-même contre meme-contenu.sh et double-relecture.mjs.
# cas <nom> <globale ~/.gitconfig ou -> <système> <XDG ou -> <cwd> [VAR=val ...]   (« - » : fichier absent)
: "${TRAVAIL:?}" "${CLONE:?}"
D=$TRAVAIL R=$D/depot N=$D/nu J=<dossier du contre-relecteur>/bin/jouer.sh
cas() {
  local nom=$1 g=$2 s=$3 x=$4 cwd=$5; shift 5
  rm -rf $D/home $D/sys $D/xdg; mkdir -p $D/home $D/sys $D/xdg/git
  [ "$g" = - ] || printf '%b' "$g" > $D/home/.gitconfig
  printf '%b' "$s" > $D/sys/gitconfig
  [ "$x" = - ] || printf '%b' "$x" > $D/xdg/git/config
  bash $J "$nom" "$cwd" XDG_CONFIG_HOME=$D/xdg "$@"
}
SD='[safe]\n\tdirectory = '
SB='[safe]\n\tbareRepository = '
