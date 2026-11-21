#!/bin/bash
# Pour chaque cas : git lui-même admet-il le dépôt ? le calcul le lit-il ? Propriété : « le calcul lit » implique « git admet ».
# Usage : MODULE=<double-relecture.mjs> TRAVAIL=<le dossier de preparer.sh> bash safe-directory/matrice.sh
: "${MODULE:?MODULE : le chemin du double-relecture.mjs à jouer}" "${TRAVAIL:?TRAVAIL : le dossier privé préparé par preparer.sh}"
D=$TRAVAIL; R=$D/depot; M=$MODULE
TETE=$(cat $D/tete)
cas() { # nom, contenu global, contenu système, variables d'environnement supplémentaires (mots), [dossier courant]
  local nom="$1" glob="$2" sys="$3" extra="$4" cwd="${5:-$R}"
  rm -rf $D/home $D/sys; mkdir -p $D/home $D/sys
  printf "%b" "$glob" > $D/home/.gitconfig; printf "%b" "$sys" > $D/sys/gitconfig
  local E="env -i PATH=$PATH HOME=$D/home TMPDIR=${TMPDIR:-/tmp} GIT_CONFIG_SYSTEM=$D/sys/gitconfig $extra"
  local g c
  if (cd "$cwd" && $E git rev-parse --verify -q HEAD >/dev/null 2>&1); then g=admet; else g=refuse; fi
  c=$(cd "$cwd" && echo docs/b.md | $E node $M --base develop --tete $TETE 2>/dev/null | tail -1)
  local det=$(cd "$cwd" && echo docs/b.md | $E node $M --base develop --tete $TETE 2>/dev/null | grep '^# illisible' | head -1 | cut -c1-70)
  local verdict=ok; [ "$c" != illisible ] && [ $g = refuse ] && verdict="VIOLATION"
  printf "%-74s git:%-7s calcul:%-12s %s %s\n" "$nom" $g "$c" "$verdict" "$det"
}
SD="[safe]\n\tdirectory = "
cas "1 aucune déclaration" "" "" ""
cas "2 globale, chemin exact" "${SD}$R\n" "" ""
cas "3 globale, *" "${SD}*\n" "" ""
cas "4 globale, barre finale" "${SD}$R/\n" "" ""
cas "5 globale, dossier parent/*" "${SD}$D/*\n" "" ""
cas "6 globale, autre dépôt" "${SD}/ailleurs\n" "" ""
cas "7 système, chemin exact" "" "${SD}$R\n" ""
cas "8 système, chemin exact, GIT_CONFIG_NOSYSTEM=1" "" "${SD}$R\n" "GIT_CONFIG_NOSYSTEM=1"
# Les valeurs à blanc (« 0 » précédé ou suivi d'une espace) sont dans suite.sh : ici les variables passent par des mots.
for v in true yes on 2 -1 0 00 +0 -0 false FALSE no off "" 0x0 0k abc; do cas "9 système exact, GIT_CONFIG_NOSYSTEM='$v'" "" "${SD}$R\n" "GIT_CONFIG_NOSYSTEM=$v"; done
cas "10 système exact, puis globale vide (remise à zéro)" "${SD}\n" "${SD}$R\n" ""
cas "11 globale vide puis exact" "${SD}\n${SD}$R\n" "" ""
cas "12 globale exact puis vide" "${SD}$R\n${SD}\n" "" ""
cas "13 système *, globale vide" "${SD}\n" "${SD}*\n" ""
cas "14 GIT_CONFIG_COUNT déclare le dépôt" "" "" "GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0=$R"
cas "15 globale exact, GIT_CONFIG_COUNT remet à zéro" "${SD}$R\n" "" "GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=safe.directory GIT_CONFIG_VALUE_0="
cas "16 globale exact, GIT_CONFIG_COUNT=0" "${SD}$R\n" "" "GIT_CONFIG_COUNT=0"
cas "17 globale exact, GIT_CONFIG_PARAMETERS remet à zéro" "${SD}$R\n" "" "GIT_CONFIG_PARAMETERS='safe.directory='"
cas "18 globale par GIT_CONFIG_GLOBAL ailleurs (HOME sans rien)" "" "" "GIT_CONFIG_GLOBAL=$D/autre.gitconfig"
printf "${SD}$R\n" > $D/inc.gitconfig; printf "${SD}\n" > $D/raz.gitconfig
cas "19 globale, include d'un fichier qui déclare" "[include]\n\tpath = $D/inc.gitconfig\n" "" ""
cas "20 globale exact, puis include d'une remise à zéro" "${SD}$R\n[include]\n\tpath = $D/raz.gitconfig\n" "" ""
cas "21 globale exact, puis includeIf gitdir d'une remise à zéro" "${SD}$R\n[includeIf \"gitdir:$R/\"]\n\tpath = $D/raz.gitconfig\n" "" ""
cas "22 globale, includeIf gitdir qui déclare" "[includeIf \"gitdir:$R/\"]\n\tpath = $D/inc.gitconfig\n" "" ""
cas "23 globale ~ (chemin par ~/)" "${SD}~/../depot\n" "" ""
ln -sfn $R $D/lien
cas "24 globale, lien symbolique vers le dépôt" "${SD}$D/lien\n" "" ""
cas "25 globale exact, dossier courant = lien symbolique" "${SD}$R\n" "" "" "$D/lien"
cas "26 globale lien, dossier courant = lien symbolique" "${SD}$D/lien\n" "" "" "$D/lien"
cas "27 globale exact, dossier courant = sous-dossier docs" "${SD}$R\n" "" "" "$R/docs"
cas "28 globale exact, dossier courant = .git" "${SD}$R\n" "" "" "$R/.git"
cas "29 globale = le .git, dossier courant = .git" "${SD}$R/.git\n" "" "" "$R/.git"
cas "30 globale exact en majuscules" "${SD}$(echo $R | tr a-z A-Z)\n" "" ""
# (Le cas 31 de la première passe, `GIT_DIR` hérité, est retiré : le calcul écarte les variables `GIT_*` par décision, ce n'est pas la règle de propriété.)
cas "32 XDG : déclaration dans XDG_CONFIG_HOME/git/config" "" "" "XDG_CONFIG_HOME=$D/xdg"
