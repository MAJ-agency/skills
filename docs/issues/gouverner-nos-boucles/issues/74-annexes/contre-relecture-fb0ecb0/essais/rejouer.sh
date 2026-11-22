#!/usr/bin/env bash
# Rejoue, sur un arbre donné, les essais du tour 1 de relecture du ticket 74 (E1 à E13) et ceux de la contre-relecture
# (N1 à N7). usage : rejouer.sh <racine de l'arbre> <veille.sh d'avant le ticket> <dossier essais/ du tour 1 de relecture>
# Sorties sur la sortie standard, chemins de TMPDIR masqués.
R=$1; VIEUX=$2; T1=$3; ICI=$(cd "$(dirname "$0")" && pwd)
V=$R/skills/chaine/fusionner/scripts/veille.sh; B=$R/skills/chaine/fusionner/scripts/boucle.sh
: "${TMPDIR:?TMPDIR à poser}"
masquer() { sed -E "s#$TMPDIR/[^/ ]*#<tmp>/<jouet>#g; s#$TMPDIR#<tmp>#g; s#$ICI/#<essais>/#g; s#$R/#<arbre>/#g; s#$T1/#<essais du tour 1>/#g"; }
echo "== arbre $(git -C "$R" rev-parse --short HEAD)$(git -C "$R" diff --quiet HEAD || echo ' + retouches'), $(date -u +%FT%TZ), charge $(cut -d' ' -f1-3 /proc/loadavg)"
echo "### E1 (deux veilles au même instant, 20 fois)"; bash "$T1/e1-deux-veilles.sh" "$V" 2>&1 | masquer
echo "### E2, E5, E6 (kill -9 pendant le sommeil, la boucle, tee)"; bash "$ICI/e2-e5-e6-tuee.sh" "$V" 2>&1 | masquer
echo "### E3, E4 (kill -9 pendant une sonde lente, pendant la préparation)"; bash "$T1/e3-e4-sous-shells.sh" "$V" 2>&1 | masquer
echo "### E7, E8 (--etat pendant le démarrage, pendant la fin)"; bash "$T1/e7-e8-courses.sh" "$V" 2>&1 | masquer
echo "### E9 (garde, --reprendre tuée pendant la préparation, préparation en 13)"; bash "$T1/e9-reprise-tuee.sh" "$V" "$B" 2>&1 | masquer
echo "### E10 à E12 (dépôt neuf, 44 états, copie d'avant le ticket)"; bash "$T1/e10-e12-etats.sh" "$V" "$VIEUX" 2>&1 | masquer
echo "### E13 (seconde veille, journal ouvert en ajout comme le skill le dit à fb0ecb0)"; bash "$ICI/e13-journal-en-ajout.sh" "$V" 2>&1 | masquer
for n in n1-sorties-de-etat n2-fils-du-descripteur-7 n3-arret-pendant-le-demarrage n4-preparation-tuee n5-deux-veilles-et-reprendre n6-garde-de-bout-en-bout n7-sortie-9-sans-issue; do
  echo "### ${n%%-*} ($n)"; bash "$ICI/$n.sh" "$V" "$B" 2>&1 | masquer
done
echo "== fin $(date -u +%FT%TZ), charge $(cut -d' ' -f1-3 /proc/loadavg)"
