#!/usr/bin/env bash
# =============================================================================
# Appels GitHub du capitaine de fusion (skill /fusionner), sourcé par les autres scripts.
#
# Tout passe par l'API REST (`gh api`), jamais par `gh pr …` : ces commandes passent par
# GraphQL, que GitHub refuse depuis les sessions Claude Code dans le cloud (403). En REST,
# la même skill tourne en local comme dans le cloud. `{owner}/{repo}` est résolu par `gh`
# depuis le remote `origin`.
# =============================================================================
DEPOT='repos/{owner}/{repo}'
# Identifiants de la convention `tickets` (SPEC_ALL_SOC-1, SPEC_ALL_SOC-1.03 ; `spec-all-soc-1-03` dans
# une branche) : aucune expression d'identifiant en shell. Tout passe par identifiant.mjs, à côté de
# ce fichier, qui importe la grammaire de `scripts/docs/identifiants.mjs` (commandes : son en-tête).
IDENTIFIANT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/identifiant.mjs"
identifiant() { node "$IDENTIFIANT" "$@"; }

# Index générés : liste unique `scripts/docs/index-generes.json` ({ chemin, commande }), lue dans le
# worktree, sinon sur origin/develop (branche partie avant son arrivée). `*` = un segment.
index_json() {
  cat scripts/docs/index-generes.json 2>/dev/null ||
    git show origin/develop:scripts/docs/index-generes.json 2>/dev/null || echo '{"index":[]}'
}
index_generes() { index_json | jq -r '.index[] | if type == "string" then . else .chemin end'; }
# Commandes de régénération, dédoublonnées, dans l'ordre de la liste.
index_commandes() { index_json | jq -r '.index[] | objects | .commande // empty' | awk '!v[$0]++'; }
# Contrôles (`verification`, facultatifs), dédoublonnés, dans l'ordre de la liste.
index_verifications() { index_json | jq -r '.index[] | objects | .verification // empty' | awk '!v[$0]++'; }
# Régénère chaque index par sa commande, joue ensuite les contrôles (une régénération peut en
# nourrir une autre), puis indexe ce qui a changé. Échec = sortie non nulle ; la sortie d'une
# commande ou d'un contrôle en échec part sur stderr, préfixée de sa commande (cas vécu : base
# éteinte, `db:types` échouait sans un mot).
regenerer_index() {
  local c
  while IFS= read -r c; do
    [ -n "$c" ] || continue
    jouer_ou_dire "$c" || return 1
  done < <(index_commandes)
  while IFS= read -r c; do
    [ -n "$c" ] || continue
    jouer_ou_dire "$c" || return 1
  done < <(index_verifications)
  ajouter_index
}
# Joue une commande ; en échec, sa sortie part sur stderr, chaque ligne préfixée de la commande.
jouer_ou_dire() {
  local l sortie
  if ! sortie=$(sh -c "$1" 2>&1); then
    while IFS= read -r l; do printf '[%s] %s\n' "$1" "$l" >&2; done <<<"$sortie"
    return 1
  fi
}
# Les mêmes en expression régulière pour `grep -E` (un chemin par ligne).
index_generes_regex() {
  index_generes | jq -Rrs 'split("\n") | map(select(. != "") | gsub("\\."; "\\.") | gsub("\\*"; "[^/]+"))
    | "^(" + join("|") + ")$"'
}
# Indexe les index générés modifiés, ajoutés ou supprimés (un motif sans fichier n'est pas une erreur).
ajouter_index() {
  local f
  index_generes | tr '\n' '\0' | xargs -0 git ls-files -m -o -d --exclude-standard -- |
    sort -u | while IFS= read -r f; do git add -A -- "$f"; done
}

# Chaîne encodée pour un segment d'URL (nom de label, nom de branche).
uri() { jq -rn --arg s "$1" '$s | @uri'; }

# PR en JSON REST (`state` open/closed, `draft`, `labels[].name`, `base.ref`, `head.ref`,
# `head.sha`, `title`).
pr_json() { gh api "$DEPOT/pulls/$1"; }

# Sommet (dernier commit) de la branche d'une PR.
pr_sommet() { gh api "$DEPOT/pulls/$1" --jq .head.sha; }

# Checks d'un commit, une ligne « nom<TAB>état » par check, états au format de
# `statusCheckRollup` : conclusion en majuscules (SUCCESS, FAILURE, SKIPPED…) pour un check
# terminé, sinon son statut (QUEUED, IN_PROGRESS) ; les statuts de commit (SUCCESS, FAILURE,
# ERROR, PENDING) s'y ajoutent. Un check par nom : le plus récent (id le plus grand). Deux
# exécutions d'un même workflow sur un commit (la première annulée par la concurrence) en
# laissent deux du même nom, et l'API ne remplace que le relancement d'un même run. Cas vécu :
# #700, checks annulés lus à la place de leurs successeurs verts.
checks_commit() {
  gh api --paginate "$DEPOT/commits/$1/check-runs?per_page=100" | jq -rs '[.[].check_runs[]]
    | group_by(.name) | map(max_by(.id))[]
    | "\(.name)\t\(if .status == "completed" then (.conclusion // "" | ascii_upcase) else (.status | ascii_upcase) end)"'
  gh api "$DEPOT/commits/$1/status" --jq '.statuses[] | "\(.context)\t\(.state | ascii_upcase)"'
}

# Checks exigés sur develop, en tableau JSON. D'abord les rulesets (`rules/branches/develop` :
# ce que GitHub recommande, et ce que pose admin.md), sinon l'ancienne protection de branche,
# qui répond 404 « Branch not protected » quand seul un ruleset protège la branche.
checks_exiges() {
  local regles
  regles=$(gh api "$DEPOT/rules/branches/develop" --jq \
    '[.[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context] | unique' 2>/dev/null || echo '[]')
  if [ "$(jq 'length' <<<"$regles")" -gt 0 ]; then printf '%s\n' "$regles"; return; fi
  gh api "$DEPOT/branches/develop/protection/required_status_checks" --jq '.contexts' 2>/dev/null || echo '[]'
}

poser_label() { gh api -X POST "$DEPOT/issues/$1/labels" -f "labels[]=$2" >/dev/null; }
# Un label déjà absent n'est pas une erreur (404).
retirer_label() { gh api -X DELETE "$DEPOT/issues/$1/labels/$(uri "$2")" >/dev/null 2>&1 || true; }
commenter() { gh api -X POST "$DEPOT/issues/$1/comments" -f body="$2" >/dev/null; }
