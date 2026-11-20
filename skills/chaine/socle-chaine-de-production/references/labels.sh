#!/usr/bin/env bash
# =============================================================================
# Les neuf labels de la chaîne de production, créés (ou mis à jour) sur le dépôt GitHub, en REST.
# Idempotent : un label existant est mis à jour (couleur, description), jamais dupliqué.
#
# Usage : bash scripts/github/labels.sh              (gh api, depuis la racine du dépôt)
#         bash scripts/github/labels.sh --liste      (affiche la liste, pour l'outil GitHub MCP)
# Sans `gh` authentifié (session cloud) : `--liste`, puis l'outil GitHub MCP ne crée pas de label ;
# un admin joue le script depuis son poste, une fois.
# =============================================================================
set -euo pipefail
# nom | couleur | description
LABELS=$(cat <<'FIN'
à-fusionner|0E8A5F|Prête pour le capitaine de fusion : CI légère verte, revue adversariale faite
fusion-bloquée|B91C1C|Renvoyée par le capitaine (conflit, CI rouge, refus) : à corriger par sa session
prio:haute|D97706|Passe en tête de file : démo, recette ou blocage
hors-sujet|6B7280|Vise develop bien que son ticket déclare un sujet : doit arriver seule en recette
ci-complète|4F46E5|Lance les E2E complets à la relance du run, avant le passage du capitaine
sujet-manuel|6B7280|Sujet livré à la main (sujet.sh livrer), jamais par livrer-prets
sujet-auto|9CA3AF|Sujet né d'un regroupement de série par le capitaine
à-relire|0369A1|Régime 8 : demande une relecture indépendante ; le Relecteur la distribue
à-reprendre|C2410C|Régime 8 : verdict refusé, plafond atteint ou contenu changé : à reprendre par son auteur
FIN
)
if [[ "${1:-}" == "--liste" ]]; then
  echo "$LABELS" | awk -F'|' '{printf "- %s (#%s) — %s\n", $1, $2, $3}'
  exit 0
fi
while IFS='|' read -r nom couleur description; do
  encode=$(node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$nom")
  if gh api "repos/{owner}/{repo}/labels/$encode" >/dev/null 2>&1; then
    gh api -X PATCH "repos/{owner}/{repo}/labels/$encode" -f color="$couleur" -f description="$description" >/dev/null
    echo "mis à jour : $nom"
  else
    gh api -X POST "repos/{owner}/{repo}/labels" -f name="$nom" -f color="$couleur" -f description="$description" >/dev/null
    echo "créé : $nom"
  fi
done <<< "$LABELS"
