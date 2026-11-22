#!/usr/bin/env bash
# N1 : chaque sortie de `veille.sh --etat`, et la même cause du côté de la veille. usage : n1-sorties-de-etat.sh <veille.sh>
# Attendu : 64 (argument de plus, hors d'un dépôt), 6 (flock absent), 0 (verrou tenu), 2 (arrêt, fin écrite), 1 (le reste),
# et une erreur, jamais VEILLE VIVANTE, quand le fichier du verrou ne s'ouvre pas.
V=$1; ICI=$(cd "$(dirname "$0")" && pwd)
J=$TMPDIR/n1.$$; rm -rf "$J"; "$ICI/jouet-contre.sh" "$J" "$V" >/dev/null; source "$ICI/env-contre.sh" "$J"; cd "$J/clone"
echo "N1.a argument de plus           : $( (env -u CAPITAINE_ID bash "$J/veille.sh" --etat x; echo "[sortie $?]") 2>&1 | tr '\n' ' ')"
mkdir -p "$J/hors-depot"
echo "N1.b hors d'un dépôt git        : $( (cd "$J/hors-depot" && GIT_CEILING_DIRECTORIES=$J env -u CAPITAINE_ID bash "$J/veille.sh" --etat; echo "[sortie $?]") 2>&1 | tr '\n' ' ') ; écrit : $(ls -A "$J/hors-depot" | tr '\n' ' ')"
mkdir -p "$J/sans-flock"; for c in git date cat tr sed awk jq sort rm mv dirname; do ln -sf "$(command -v $c)" "$J/sans-flock/$c"; done
echo "N1.c flock absent               : $( (/usr/bin/env -u CAPITAINE_ID PATH="$J/sans-flock" /bin/bash "$J/veille.sh" --etat; echo "[sortie $?]") 2>&1 | sed "s#$TMPDIR#<tmp>#g" | tr '\n' ' ')"
echo "N1.d aucune trace               : $(etat)"
printf 'lancee %s\n' "$(date +%s)" > .git/veille.etat
echo "N1.e lancee, verrou libre       : $(etat)"
echo "N1.f lancee, verrou tenu        : $(flock .git/veille.verrou bash -c "$(declare -f etat); J='$J'; TMPDIR='$TMPDIR'; etat")"
printf 'fin %s VEILLE FINIE 12:00\n' "$(date +%s)" > .git/veille.etat
echo "N1.g fin écrite                 : $(etat)"
date +%FT%T > .git/boucle-arret
echo "N1.h fin écrite et arrêt        : $(etat)"
rm -f .git/boucle-arret .git/veille.verrou && mkdir .git/veille.verrou
echo "N1.i verrou qui ne s'ouvre pas  : $(etat)"
echo "N1.j la veille, même cause      : $( (bash "$J/veille.sh" --pause 0.1 --duree 1 --sondes 0; echo "[sortie $?]") 2>&1 | sed "s#$TMPDIR#<tmp>#g" | tr '\n' ' ')"
cd / && rm -rf "$J"
