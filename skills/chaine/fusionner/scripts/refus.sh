#!/usr/bin/env bash
# =============================================================================
# Renvoie une PR refusée en sortie 4 (skill `fusionner`) : motif = dernière ligne de la sortie du
# script qui a refusé (préfixe « [#n] » retiré), transmis tel quel à renvoyer.sh. Sans motif
# lisible : « refusée en sortie 4, voir le journal du capitaine ». Un refus transitoire ou sans
# correction possible sort en 7 de passer.sh et sujet.sh : il ne passe jamais ici.
#
# Usage : bash scripts/chaine/refus.sh <numéro> <fichier de la sortie>
# =============================================================================
set -euo pipefail
N=${1:?usage : refus.sh <numéro> <fichier>}
fichier=${2:?fichier de la sortie manquant}
outils=$(cd "$(dirname "$0")" && pwd)
motif=$(grep -v '^[[:space:]]*$' "$fichier" 2>/dev/null | tail -1 | sed -E 's/^\[#[0-9]+\] //; s/[.[:space:]]+$//' || true)
[ -n "$motif" ] || motif="refusée en sortie 4, voir le journal du capitaine"
bash "$outils/renvoyer.sh" "$N" "$motif"
