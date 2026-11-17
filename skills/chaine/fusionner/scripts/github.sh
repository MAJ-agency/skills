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
# Tout script de la chaîne qui appelle le binaire jq source ce fichier : la garde est ici, une seule fois.
command -v jq >/dev/null || { echo "ARRÊT : jq est requis par les scripts de la chaîne : sudo apt install jq (ou brew install jq)" >&2; exit 69; }
# Identifiants de la convention `tickets` (SPEC_ALL_SOC-1, SPEC_ALL_SOC-1.03 ; `spec-all-soc-1-03` dans
# une branche) : la grammaire (type, contexte, trigramme) ne s'écrit pas en shell. Lire un identifiant
# dans un titre de PR, une branche ou un nom de fichier passe par identifiant.mjs, à côté de ce
# fichier, qui importe `scripts/docs/identifiants.mjs` (commandes : son en-tête). Le shell ne fait que
# Renvois d'une PR (A-10) : chaque commentaire de renvoyer.sh porte cette marque, invisible (un
# commentaire HTML). Le compte se lit sur la PR elle-même : aucun label nouveau. Seuls comptent les
# commentaires du compte qui tient le capitaine (`gh api user`, lu une fois : file.sh le garde dans
# LOGIN_CAPITAINE, `?` s'il est illisible) : la marque recopiée par un autre compte ne met pas la PR
# en attente d'un humain.
MARQUE_RENVOI='<!-- renvoi-capitaine -->'
unset LOGIN_CAPITAINE # posé par file.sh après ce fichier, jamais hérité de l'environnement
# Login GitHub bien formé (utilisateur ou `app[bot]`) : seul un login de cette forme entre dans le filtre jq.
login_valide() { [[ "${1:-}" =~ ^[A-Za-z0-9][A-Za-z0-9-]*(\[bot\])?$ ]]; }
# Commentaires illisibles : 0 sur la sortie, dit sur la sortie d'erreur (un seul nombre, jamais deux).
# Compte du capitaine illisible : le plafond (la PR attend un humain), dit sur la sortie d'erreur ;
# le frein des renvois ne se lâche jamais faute de savoir qui renvoie.
renvois_de() {
  local lus login=${LOGIN_CAPITAINE:-}
  [ -n "$login" ] || login=$(gh api user --jq .login 2>/dev/null) || login=''
  if ! login_valide "$login"; then
    [ -n "${LOGIN_CAPITAINE:-}" ] ||
      echo "renvois de #$1 : compte du capitaine illisible (gh api user), compté au plafond : la PR attend un humain" >&2
    plafond_renvois
    return
  fi
  if lus=$(gh api --paginate "$DEPOT/issues/$1/comments?per_page=100" --jq ".[] | select(.user.login == \"$login\" and (.body | contains(\"<!-- renvoi-capitaine -->\"))) | 1"); then
    printf '%s\n' "$lus" | grep -c . || true
  else
    echo "renvois de #$1 : commentaires illisibles, compte 0" >&2
    echo 0
  fi
}
# Plafond de renvois (`plafonds.renvoisParPR` de .claude/chaine.json : l'arbre de travail, sinon
# origin/develop). Sans contrat ou sans clé : 3. Contrat mal formé : 3 aussi, dit sur la sortie d'erreur
# (la file du capitaine ne tombe jamais pour un contrat).
plafond_renvois() {
  local v contrat
  contrat=$(cat .claude/chaine.json 2>/dev/null || git show origin/develop:.claude/chaine.json 2>/dev/null || echo '{}')
  if v=$(jq -er '.plafonds.renvoisParPR // 3' <<<"$contrat" 2>/dev/null) && [[ "$v" =~ ^[1-9][0-9]*$ ]]; then
    echo "$v"
  else
    echo "plafond de renvois : .claude/chaine.json illisible ou plafonds.renvoisParPR mal formé, valeur par défaut 3" >&2
    echo 3
  fi
}
# retirer l'index `.NN` d'un identifiant déjà lu et chercher un fichier par son identifiant littéral.
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
  local c motif
  # Avant toute commande : un index (ou l'un de ses dossiers) en lien symbolique ferait écrire la commande à
  # travers lui, hors du dépôt ou dans un autre fichier.
  if ! motif=$(liens_sur_index); then
    printf '%s\n' "$motif" >&2
    return 1
  fi
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
# Pousse `<refspec>` sous les hooks git, jamais en les sautant. `<branche>` est la branche distante
# visée, `<avant>` son sommet lu avant le push (vide pour une branche à créer). Sorties : 0 poussé ;
# 5 la branche a bougé (ou le distant ne répond pas) ; 3 refusé par le hook pre-push (ou le distant),
# sa sortie sur stderr, chaque ligne préfixée de la commande.
pousser() {
  local refspec=$1 branche=$2 avant=${3:-} apres
  jouer_ou_dire "git push -q origin $(printf '%q' "$refspec")" && return 0
  apres=$(git ls-remote origin "refs/heads/$branche" 2>/dev/null) || return 5
  apres=${apres%%[[:space:]]*}
  [ "$apres" = "$avant" ] || return 5
  echo "push refusé par le hook pre-push (ou le distant) : sortie ci-dessus ; corriger, jamais en sautant le hook" >&2
  return 3
}
# Après un `git merge` ou un `git commit` refusé (hook, fichier non suivi écrasé) : rend l'arbre comme
# avant la fusion — `git merge --abort` si elle est en cours, sinon `git reset -q --hard`.
annuler_fusion() {
  if git rev-parse -q --verify MERGE_HEAD >/dev/null; then git merge --abort; else git reset -q --hard; fi
}
# Les mêmes en expression régulière pour `grep -E` (un chemin par ligne).
index_generes_regex() {
  index_generes | jq -Rrs 'split("\n") | map(select(. != "") | gsub("\\."; "\\.") | gsub("\\*"; "[^/]+"))
    | "^(" + join("|") + ")$"'
}
# Ceux qui ont une `commande`, de même : régénérés, donc écrasés à chaque mise à jour. Un index sans
# commande (chaîne nue de la liste) n'est jamais régénéré : `sujet.sh` (PR de mise à jour) et `passer.sh`
# (livraison intermédiaire) ne le dispensent pas sur sa seule place dans la liste.
index_regeneres_regex() {
  index_json | jq -r '.index[] | objects | select((.commande // "") != "") | .chemin' |
    jq -Rrs 'split("\n") | map(select(. != "") | gsub("\\."; "\\.") | gsub("\\*"; "[^/]+")) | "^(" + join("|") + ")$"'
}
# Ceux qui ont une `commande` et sont déclarés par motif (`*`) : leur régénération réécrit les fichiers qu'elle
# produit, sans retirer un fichier en trop sous le motif ni récrire un ancien. `passer.sh` (livraison
# intermédiaire) ne les dispense que sur un contenu déjà connu.
index_regeneres_motifs_regex() {
  index_json | jq -r '.index[] | objects | select((.commande // "") != "" and (.chemin | contains("*"))) | .chemin' |
    jq -Rrs 'split("\n") | map(select(. != "") | gsub("\\."; "\\.") | gsub("\\*"; "[^/]+")) | "^(" + join("|") + ")$"'
}
# Les dossiers d'un index généré (`docs/adr` pour `docs/adr/README.md`, motif compris), en expression régulière.
index_dossiers_regex() {
  index_generes | jq -Rrs 'split("\n") | map(select(. != "") | split("/") | . as $s | range(1; length) | $s[:.] | join("/"))
    | map(gsub("\\."; "\\.") | gsub("\\*"; "[^/]+")) | "^(" + join("|") + ")$"'
}
# Liens symboliques sur un index généré, ou sur l'un de ses dossiers, dans l'arbre de `<commit>` (sans argument :
# l'index git du worktree) ; avec `<base>`, ceux seulement que `<commit>` ajoute ou change par rapport à elle (un
# lien déjà dans develop ne fait pas renvoyer toutes les PR : `regenerer_index` l'arrête). La régénération
# écrirait à travers eux : hors du dépôt (lien absolu, ou relatif qui en sort) ou dans un autre fichier du dépôt
# (worktree sale). Sortie 0 aucun ; 1 sinon, motif sur la sortie standard. Liste illisible (git, jq) : 1, jamais
# une garde ouverte. Sans casse : sur un système de fichiers insensible à la casse, `Docs` est `docs`.
liens_sur_index() {
  local entrees deja='' liens generes dossiers l
  if [ -n "${1:-}" ]; then
    entrees=$(git -c core.quotePath=false ls-tree -r --full-tree "$1") || { echo "arbre de $1 illisible : liens symboliques non vérifiés"; return 1; }
  else
    entrees=$(git -c core.quotePath=false ls-files -s) || { echo "index git illisible : liens symboliques non vérifiés"; return 1; }
  fi
  if [ -n "${2:-}" ]; then
    deja=$(git -c core.quotePath=false ls-tree -r --full-tree "$2" | awk -F '\t' '$1 ~ /^120000 /') || { echo "arbre de $2 illisible : liens symboliques non vérifiés"; return 1; }
  fi
  liens=$(comm -23 <(printf '%s\n' "$entrees" | awk -F '\t' '$1 ~ /^120000 /' | sort) <(printf '%s\n' "$deja" | sort) | cut -f2-)
  [ -n "$liens" ] || return 0
  generes=$(index_generes_regex) && dossiers=$(index_dossiers_regex) && [ -n "$generes" ] && [ -n "$dossiers" ] ||
    { echo "liste des index générés illisible : liens symboliques non vérifiés"; return 1; }
  while IFS= read -r l; do
    if grep -qiE "$generes|$dossiers" <<<"$l"; then
      echo "lien symbolique sur un index généré ou son dossier : $l ; la régénération écrirait à travers lui (hors du dépôt ou dans un autre fichier) : le remplacer par un fichier ordinaire, jamais un lien"
      return 1
    fi
  done <<<"$liens"
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

# Tête de PR gardée : `develop`, `main`, ou la branche par défaut du dépôt (2e argument, lu dans le
# JSON de la PR : `base.repo.default_branch`). Le capitaine pousse la mise à jour d'une PR sur sa tête :
# jamais sur celles-ci (« jamais de push sur la branche par défaut »). La livraison d'un sujet
# (`sujet/<nom>` vers develop) n'en est pas une : la mettre à jour avec develop est le chemin prévu.
tete_gardee() { [ "$1" = develop ] || [ "$1" = main ] || { [ -n "${2:-}" ] && [ "$1" = "$2" ]; }; }

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

# Revue des propriétaires exigée sur `<base>` (« Require review from Code Owners », ADR « CODEOWNERS » du projet) :
# d'abord les rulesets (`rules/branches/<base>`, règle `pull_request` avec `require_code_owner_review`), sinon
# l'ancienne protection de branche. Illisible ou absente : non (sortie 1) — la fusion refusée par GitHub le
# rattrape (passer.sh, étape 6).
revue_proprietaires_exigee() {
  local b
  b=$(uri "$1")
  [ "$(gh api "$DEPOT/rules/branches/$b" --jq \
    'any(.[]; .type == "pull_request" and .parameters.require_code_owner_review == true)' 2>/dev/null)" = true ] && return 0
  [ "$(gh api "$DEPOT/branches/$b/protection/required_pull_request_reviews" --jq '.require_code_owner_reviews == true' 2>/dev/null)" = true ]
}
# La PR (son JSON REST sur l'entrée standard, d'un `pulls/<n>` ou d'une ligne de la liste `pulls`) a encore des
# relecteurs demandés (`requested_reviewers`, `requested_teams`) : GitHub y met d'office les propriétaires
# CODEOWNERS des fichiers touchés, et les retire quand ils approuvent.
relecteurs_demandes() { jq -e '((.requested_reviewers // []) + (.requested_teams // []) | length) > 0' >/dev/null; }
# Une PR attend l'approbation d'un propriétaire : sa base exige la revue des propriétaires et des relecteurs
# restent demandés. Ni rouge ni bloquée : le capitaine la saute sans la renvoyer et la reprend au tour suivant.
# Il ne demande ni ne donne l'approbation, et ne contourne jamais la règle.
attend_proprietaire() { # <json de la PR>
  relecteurs_demandes <<<"$1" && revue_proprietaires_exigee "$(jq -r .base.ref <<<"$1")"
}
# Message d'un refus de fusion de GitHub qui tient à la revue (approbation d'un propriétaire, revue exigée).
refus_pour_revue() { grep -qiE 'code owner|approving review|review is required|reviews? required' <<<"$1"; }
MOTIF_PROPRIETAIRE="attend l'approbation d'un propriétaire (CODEOWNERS) : sautée sans renvoi, reprise au tour suivant"

poser_label() { gh api -X POST "$DEPOT/issues/$1/labels" -f "labels[]=$2" >/dev/null; }
# Un label déjà absent n'est pas une erreur (404).
retirer_label() { gh api -X DELETE "$DEPOT/issues/$1/labels/$(uri "$2")" >/dev/null 2>&1 || true; }
commenter() { gh api -X POST "$DEPOT/issues/$1/comments" -f body="$2" >/dev/null; }
