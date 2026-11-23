#!/bin/bash
# jouer <nom> <cwd> [VAR=val ...] : git lui-même, meme-contenu.sh, double-relecture.mjs, dans cwd, sous env -i.
# HOME=$TRAVAIL/home, GIT_CONFIG_SYSTEM=$TRAVAIL/sys/gitconfig sauf si l'appelant les remplace.
: "${TRAVAIL:?}" "${CLONE:?}"
nom=$1 cwd=$2; shift 2
D=$TRAVAIL V=$(cat $D/v) T=$(cat $D/tete)
MC=$CLONE/skills/chaine/fusionner/scripts/meme-contenu.sh DR=$CLONE/skills/chaine/fusionner/scripts/double-relecture.mjs
base=(PATH=$PATH HOME=$D/home TMPDIR=<dossier du contre-relecteur>/tmp GIT_CONFIG_SYSTEM=$D/sys/gitconfig)
E=(env -i "${base[@]}" "$@")
if (cd "$cwd" && "${E[@]}" git rev-parse --verify -q HEAD >/dev/null 2>"$D/git.err"); then g=admet; else g=refuse; fi
gerr=$(head -1 "$D/git.err" | cut -c1-60)
mo=$(cd "$cwd" && "${E[@]}" bash $MC $V $T develop 2>"$D/mc.err"); mr=$(head -1 "$D/mc.err" | cut -c1-50)
do=$(cd "$cwd" && echo docs/b.md | "${E[@]}" node $DR --base develop --tete $T 2>"$D/dr.err" | tail -1)
dr=$(cd "$cwd" && echo docs/b.md | "${E[@]}" node $DR --base develop --tete $T 2>&1 | grep -m1 'illisible' | cut -c1-50)
lit() { case $1 in illisible) echo refuse;; *) echo admet;; esac; }
v1=ok v2=ok
[ "$(lit "$mo")" = admet ] && [ $g = refuse ] && v1=VIOLATION
[ "$(lit "$mo")" = refuse ] && [ $g = admet ] && v1=plus-strict
[ "$(lit "$do")" = admet ] && [ $g = refuse ] && v2=VIOLATION
[ "$(lit "$do")" = refuse ] && [ $g = admet ] && v2=plus-strict
printf '%s\n  git:%s (%s)\n  meme-contenu:%s [%s] %s\n  double-relecture:%s [%s] %s\n' "$nom" "$g" "$gerr" "$mo" "$mr" "$v1" "$do" "$dr" "$v2"
