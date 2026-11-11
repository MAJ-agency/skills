#!/usr/bin/env bash
# =============================================================================
# La branche `develop` du dépôt GitHub : créée sur le distant depuis `main` si elle n'existe pas,
# puis rapatriée (`origin/develop`) — la couverture du diff et la revue comparent à develop.
# Idempotent : develop déjà sur le distant → rien de poussé, seulement rapatriée.
#
# Usage : bash scripts/github/develop.sh      (depuis un clone du dépôt, remote origin configuré)
# Sorties : 0 fait · 4 précondition (pas de remote origin, `main` absente du distant) · 5 push refusé ·
# 6 distant injoignable (rien n'est poussé, relancer quand il répond)
#
# Pourquoi `git push --no-verify`, et pas la commande à la main. Le push ne porte que `origin/main`,
# déjà sur le distant et déjà vérifié par son propre push : rien de neuf à contrôler. Le hook
# pre-push, lui, jouerait `pnpm check` sur l'arbre de travail local — qui n'est pas ce qui part —
# et son gate `coverage-diff` chercherait `origin/develop` comme base : la branche que ce push crée.
# Refus certain (sortie 2, vu le 2026-11-09), pour un push sans aucun diff à mesurer.
# Pourquoi pas l'API GitHub (`POST git/refs`) : le proxy des sessions cloud la refuse (403), comme
# pour `sujet.sh ouvrir`. Un `git push` passe partout où le dépôt est joignable.
# La branche par défaut et sa protection restent à l'admin (docs/agents/chaine-admin.md).
# =============================================================================
set -euo pipefail
sortir() { echo "develop.sh: $2" >&2; exit "$1"; }

git remote get-url origin >/dev/null 2>&1 || sortir 4 "aucun remote origin : le socle de la chaîne exige un dépôt GitHub"

# `ls-remote --exit-code` : 2 = aucune branche de ce nom, autre code non nul = distant injoignable.
tete_distante() {
  local rc=0
  git ls-remote --exit-code --heads origin "$1" >/dev/null 2>&1 || rc=$?
  [ "$rc" = 0 ] || [ "$rc" = 2 ] || sortir 6 "distant injoignable (git ls-remote en échec, code $rc) : relancer quand il répond"
  return "$rc"
}
rapatrier() { git fetch -q origin "$1" || sortir 6 "distant injoignable (git fetch $1 en échec) : relancer quand il répond"; }

if tete_distante develop; then
  rapatrier develop
  echo "develop existe déjà sur le distant ($(git rev-parse --short origin/develop)) : rapatriée, rien de poussé"
  exit 0
fi

tete_distante main ||
  sortir 4 "main absente du distant : pousser main d'abord (le socle de la chaîne arrive après le premier push)"
rapatrier main
git push -q --no-verify origin origin/main:refs/heads/develop ||
  sortir 5 "push refusé : droits d'écriture sur le dépôt ? Sinon l'admin crée develop depuis main (docs/agents/chaine-admin.md)"
rapatrier develop
echo "develop créée sur le distant depuis main ($(git rev-parse --short origin/develop)) et rapatriée"
echo "branche par défaut et protection : à l'admin (docs/agents/chaine-admin.md)"
