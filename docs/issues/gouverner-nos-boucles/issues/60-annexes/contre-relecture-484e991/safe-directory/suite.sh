#!/bin/bash
# Suite de matrice.sh : la configuration XDG, et les valeurs de GIT_CONFIG_NOSYSTEM à blanc (un tableau, pas des mots).
# Usage : MODULE=<double-relecture.mjs> TRAVAIL=<le dossier de preparer.sh> bash safe-directory/suite.sh
: "${MODULE:?MODULE : le chemin du double-relecture.mjs à jouer}" "${TRAVAIL:?TRAVAIL : le dossier privé préparé par preparer.sh}"
D=$TRAVAIL; R=$D/depot; M=$MODULE; TETE=$(cat $D/tete); T=${TMPDIR:-/tmp}
essai() {
  local g c
  if (cd $R && env -i PATH=$PATH HOME=$D/home TMPDIR=$T GIT_CONFIG_SYSTEM=$D/sys/gitconfig "${EXTRA[@]}" git rev-parse --verify -q HEAD >/dev/null 2>&1); then g=admet; else g=refuse; fi
  c=$(cd $R && echo docs/b.md | env -i PATH=$PATH HOME=$D/home TMPDIR=$T GIT_CONFIG_SYSTEM=$D/sys/gitconfig "${EXTRA[@]}" node $M --base develop --tete $TETE 2>/dev/null | tail -1)
  local v=ok; [ "$c" != illisible ] && [ $g = refuse ] && v=VIOLATION
  printf "%-80s git:%-7s calcul:%-12s %s\n" "$1" $g "$c" $v
}
rm -rf $D/home $D/sys $D/xdg2; mkdir -p $D/home $D/sys $D/xdg2/git
printf "[safe]\n\tdirectory = $R\n" > $D/sys/gitconfig
printf "[safe]\n\tdirectory =\n" > $D/xdg2/git/config
printf "[user]\n\tname = x\n" > $D/home/.gitconfig
EXTRA=(XDG_CONFIG_HOME=$D/xdg2); essai "33 système exact ; XDG remet à zéro ; ~/.gitconfig existe (sans safe)"
rm $D/home/.gitconfig; essai "34 système exact ; XDG remet à zéro ; pas de ~/.gitconfig"
printf "[user]\n\tname = x\n" > $D/home/.gitconfig; printf "[safe]\n\tdirectory = $R\n" > $D/xdg2/git/config; : > $D/sys/gitconfig
essai "35 XDG déclare ; ~/.gitconfig existe (sans safe)"
printf "[safe]\n\tdirectory = $R\n" > $D/sys/gitconfig; : > $D/xdg2/git/config; rm -f $D/home/.gitconfig
EXTRA=("GIT_CONFIG_NOSYSTEM= 0"); essai "36 système exact, GIT_CONFIG_NOSYSTEM=' 0' (blanc devant)"
EXTRA=("GIT_CONFIG_NOSYSTEM=0 "); essai "37 système exact, GIT_CONFIG_NOSYSTEM='0 ' (blanc derrière)"
EXTRA=("GIT_CONFIG_NOSYSTEM=False"); essai "38 système exact, GIT_CONFIG_NOSYSTEM='False'"
EXTRA=("GIT_CONFIG_NOSYSTEM=0000000000000000000000000"); essai "39 système exact, GIT_CONFIG_NOSYSTEM=25 zéros"
EXTRA=("GIT_CONFIG_NOSYSTEM=+"); essai "40 système exact, GIT_CONFIG_NOSYSTEM='+'"
