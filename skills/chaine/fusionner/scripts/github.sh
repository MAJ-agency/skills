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
# URL à identifiants (`scheme://utilisateur[:jeton]@hôte…`) masquée dans un texte lu sur l'entrée standard :
# `scheme://***@hôte…`. Toute sortie de git ou d'un hook que les scripts du capitaine relaient (sortie d'erreur,
# journal, commentaire de PR) passe par ici (A-42) : un jeton d'un remote ou d'un hook distant n'y paraît jamais.
masquer_url() { sed -E 's#://[^/@[:space:]]*@#://***@#g'; }
# Joue `git <args>`, sa sortie d'erreur passée par masquer_url, sa sortie standard telle quelle ; rend le code de git.
git_masque() {
  { git "$@" 2>&1 1>&3 3>&- | masquer_url >&2; return "${PIPESTATUS[0]}"; } 3>&1
}
# Joue une commande ; en échec, sa sortie (masquée) part sur stderr, chaque ligne préfixée de la commande.
# SORTIE_JOUEE garde la sortie masquée de la dernière commande jouée, que `pousser` classe.
SORTIE_JOUEE=''
jouer_ou_dire() {
  local l sortie rc=0
  sortie=$(sh -c "$1" 2>&1) || rc=$?
  SORTIE_JOUEE=$(printf '%s\n' "$sortie" | masquer_url)
  [ "$rc" != 0 ] || return 0
  while IFS= read -r l; do printf '[%s] %s\n' "$1" "$l" >&2; done <<<"$SORTIE_JOUEE"
  return 1
}
# Pousse `<refspec>` sous les hooks git, jamais en les sautant. `<branche>` est la branche distante
# visée, `<avant>` son sommet lu avant le push (vide pour une branche à créer). La sortie de ce push
# part sur stderr, masquée, chaque ligne préfixée de la commande. Sorties :
#   0 poussé ;
#   5 la branche a bougé, ou le distant ne répond pas à la relecture ;
#   3 refusé par le hook pre-push : la trace de husky 9 (`husky - pre-push script failed (code N)`, écrite par
#     `.husky/_/h`, en début de ligne : jamais un « remote: » du distant) est dans la sortie de CE push ; la PR
#     est à corriger ;
#   4 tout autre refus (règle du dépôt, droit, proxy, coupure, hook sans husky) : échec fermé, jamais un renvoi.
pousser() {
  local refspec=$1 branche=$2 avant=${3:-} apres
  jouer_ou_dire "git push -q origin $(printf '%q' "$refspec")" && return 0
  apres=$(git ls-remote origin "refs/heads/$branche" 2>/dev/null) || return 5
  apres=${apres%%[[:space:]]*}
  [ "$apres" = "$avant" ] || return 5
  # Une fin de ligne CRLF (hook écrit sous Windows) reste une trace.
  if grep -qE $'^husky - pre-push script failed \\(code [0-9]+\\)\r?$' <<<"$SORTIE_JOUEE"; then
    echo "push refusé par le hook pre-push : sortie ci-dessus ; corriger, jamais en sautant le hook" >&2
    return 3
  fi
  echo "push refusé par le distant (ou échec sans trace du hook pre-push) : sortie ci-dessus" >&2
  return 4
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
# Règle d'ascendance (skill `fusionner`, « La règle d'ascendance ») : `<testé>` a-t-il été testé sur l'état de `<cible>` ?
# Une seule fonction pour passer.sh (vers develop) et sujet.sh (vers un sujet) : deux copies de la règle avaient
# divergé, et des PR en retard sur leur cible sont entrées sans que leur combinaison avec elle soit jamais testée
# (`fedora`, 2026-11-18). Aucune exception pour la documentation : une PR en retard est mise à jour et retestée.
# Ligne 1, le verdict :
#   à-jour         <cible> est ancêtre de <testé> : la fusion porte l'arbre testé ;
#   retard         sinon, et `git merge-tree --write-tree` (git ≥ 2.38) fusionne sans conflit ;
#   conflit-index  conflit limité aux index générés déclarés dans `scripts/docs/index-generes.json` de <cible>
#                  (jamais l'arbre de travail : la liste de la PR ne décide pas) ;
#   conflit        tout autre conflit.
# Pour un conflit, puis les fichiers en conflit, un par ligne. Sortie 0 avec un verdict ; 1 si elle ne peut pas
# conclure (réf absente, git ou liste en échec), motif sur la sortie d'erreur : jamais un `à-jour` par défaut.
ascendance() {
  local teste=${1:-} cible=${2:-} rc sortie fichiers liste regex hors
  if ! git rev-parse -q --verify "$teste^{commit}" >/dev/null 2>&1 || ! git rev-parse -q --verify "$cible^{commit}" >/dev/null 2>&1; then
    echo "ascendance : « $teste » ou « $cible » introuvable" >&2
    return 1
  fi
  git merge-base --is-ancestor "$cible" "$teste" && rc=0 || rc=$?
  case $rc in
    0) echo à-jour; return 0 ;;
    1) ;;
    *) echo "ascendance : git merge-base --is-ancestor en échec ($rc)" >&2; return 1 ;;
  esac
  sortie=$(git -c core.quotePath=false merge-tree --write-tree --name-only --no-messages "$teste" "$cible" 2>&1) && rc=0 || rc=$?
  case $rc in
    0) echo retard; return 0 ;;
    1) ;;
    *) printf 'ascendance : git merge-tree --write-tree en échec (git ≥ 2.38 requis) : %s\n' "$sortie" >&2; return 1 ;;
  esac
  fichiers=$(sed -n '2,$p' <<<"$sortie" | sed '/^$/d' | sort -u)
  [ -n "$fichiers" ] || { echo "ascendance : conflit sans fichier en conflit, illisible" >&2; return 1; }
  if git cat-file -e "$cible:scripts/docs/index-generes.json" 2>/dev/null; then
    liste=$(git show "$cible:scripts/docs/index-generes.json") || { echo "ascendance : liste des index générés de $cible illisible" >&2; return 1; }
  else
    liste='{"index":[]}'
  fi
  regex=$(jq -r '.index[] | if type == "string" then . else .chemin end' <<<"$liste" 2>/dev/null |
    jq -Rrs 'split("\n") | map(select(. != "") | gsub("\\."; "\\.") | gsub("\\*"; "[^/]+")) | "^(" + join("|") + ")$"') &&
    [ -n "$regex" ] || { echo "ascendance : liste des index générés de $cible illisible" >&2; return 1; }
  hors=$(grep -Ev "$regex" <<<"$fichiers" || true)
  if [ -z "$hors" ]; then echo conflit-index; else echo conflit; fi
  printf '%s\n' "$fichiers"
}

# Fusion sans effet (skill `fusionner`, « Fusion sans effet ») : un hook du projet garde un fichier (une migration
# exigée sur `schema.prisma`, par exemple) ; quand une fusion jouée par le capitaine ne lui apporte que des lignes
# sans effet, son commit porte la mention que le hook attend. `mentions_de_fusion <réf>`, appelée avant la fusion
# de <réf> dans HEAD, écrit une mention par ligne sur la sortie standard. Le contrat (`fusionsSansEffet` de
# `.claude/chaine.json`) se lit sur origin/develop, jamais dans l'arbre de travail : une PR ne s'accorde pas
# elle-même une mention. Le diff va de HEAD à l'arbre de la fusion (`git merge-tree`, git ≥ 2.38) ; ses lignes
# ajoutées ou retirées, lues après le premier `@@` (un en-tête se coupe par sa position, jamais par son texte),
# doivent toutes correspondre en entier à `lignesSansEffet` (`grep -xE`). Changement réel, entrée mal formée, arbre
# illisible : aucune mention, le motif sur la sortie d'erreur ; contrat absent, illisible ou sans la clé : rien, en
# silence. Sortie toujours 0 : la fonction n'arrête jamais une fusion, les hooks du projet jugent le commit.
mentions_de_fusion() {
  local ref=${1:-} contrat nombre i motif fichier expr mention arbre='' diff lignes rc trouvees=''
  contrat=$(git show origin/develop:.claude/chaine.json 2>/dev/null) || return 0
  nombre=$(jq -r 'if type != "object" or (has("fusionsSansEffet") | not) then 0
    elif (.fusionsSansEffet | type) == "array" then .fusionsSansEffet | length else "pas une liste" end' <<<"$contrat" 2>/dev/null) || return 0
  if [ "$nombre" = "pas une liste" ]; then
    echo "fusion sans mention : fusionsSansEffet n'est pas une liste (contrat d'origin/develop)" >&2
    return 0
  fi
  for ((i = 0; i < nombre; i++)); do
    # Le motif d'une entrée mal formée, vide pour une entrée bien formée. Un caractère de contrôle (fin de ligne
    # comprise) n'entre ni dans un chemin, ni dans une expression (`grep -E` en ferait plusieurs), ni dans une mention.
    motif=$(jq -r --argjson i "$i" '.fusionsSansEffet[$i] as $e
      | def texte(f): ($e | f | type) == "string" and ($e | f) != "";
      def controle(f): $e | f | explode | any(. < 32 or . == 127);
      if ($e | type) != "object" then "entrée qui n'"'"'est pas un objet"
      elif texte(.fichier) | not then "fichier manquant, vide ou non textuel"
      elif controle(.fichier) then "fichier à caractère de contrôle"
      elif texte(.lignesSansEffet) | not then "lignesSansEffet manquante, vide ou non textuelle"
      elif controle(.lignesSansEffet) then "lignesSansEffet sur plusieurs lignes ou à caractère de contrôle"
      elif texte(.mention) | not then "mention manquante, vide ou non textuelle"
      elif controle(.mention) then "mention sur plusieurs lignes ou à caractère de contrôle"
      elif $e.mention | startswith("Sujet:") then "mention qui commence par « Sujet: » (sujet_livre la lirait dans develop)"
      elif $e.mention | startswith("Merge pull request") then "mention qui commence par « Merge pull request » (sujet_livre la lirait dans develop)"
      elif $e.mention | startswith("#") then "mention qui commence par « # » (commit.cleanup=strip la retirerait)"
      else "" end' <<<"$contrat" 2>/dev/null) || motif="entrée illisible"
    if [ -z "$motif" ]; then
      fichier=$(jq -r --argjson i "$i" '.fusionsSansEffet[$i].fichier' <<<"$contrat")
      expr=$(jq -r --argjson i "$i" '.fusionsSansEffet[$i].lignesSansEffet' <<<"$contrat")
      mention=$(jq -r --argjson i "$i" '.fusionsSansEffet[$i].mention' <<<"$contrat")
      # L'expression se valide avant usage : `grep -E` sort en 2 sur une expression qu'il refuse.
      grep -qE -- "$expr" </dev/null 2>/dev/null && rc=0 || rc=$?
      [ "$rc" -le 1 ] || motif="expression refusée par grep -E"
    fi
    if [ -n "$motif" ]; then
      printf 'fusionsSansEffet[%s] ignorée : %s\n' "$i" "$motif" >&2
      continue
    fi
    if [ -z "$arbre" ]; then
      # En conflit, `merge-tree` sort en 1 mais donne l'arbre : seuls les fichiers en conflit y portent des marqueurs.
      # `|| true` : sous `pipefail`, la sortie 1 d'un conflit ferait sortir l'appelant (`set -e`) ; l'arbre se vérifie après.
      arbre=$(git merge-tree --write-tree --no-messages HEAD "$ref" 2>/dev/null | sed -n 1p) || true
      if ! git rev-parse -q --verify "$arbre^{tree}" >/dev/null 2>&1; then
        echo "fusion sans mention : arbre de la fusion de « $ref » illisible (git ≥ 2.38 requis) ; les hooks du projet jugent le commit" >&2
        return 0
      fi
    fi
    if ! diff=$(git diff --no-textconv --no-ext-diff --no-color -U0 --no-renames HEAD "$arbre" -- ":(literal)$fichier" 2>/dev/null); then
      printf 'fusion sans mention : diff de %s illisible ; les hooks du projet jugent le commit\n' "$fichier" >&2
      continue
    fi
    lignes=$(sed -n '/^@@/,$p' <<<"$diff" | grep -E '^[-+]' || true)
    [ -n "$lignes" ] || continue
    # Sans tube : `grep -q` sort à la première ligne non conforme, et sous `pipefail` le SIGPIPE de l'écrivain
    # ferait lire « toutes conformes » à l'appelant (passer.sh, sujet.sh).
    lignes=$(sed 's/^.//' <<<"$lignes")
    if grep -qvxE -- "$expr" <<<"$lignes"; then
      printf 'fusion sans mention : %s porte un changement réel (lignes hors de lignesSansEffet) ; les hooks du projet jugent le commit\n' "$fichier" >&2
      continue
    fi
    trouvees+="$mention"$'\n'
  done
  [ -z "$trouvees" ] || printf '%s' "$trouvees" | awk '!vu[$0]++'
  return 0
}
# Fusionne <réf> dans HEAD comme `git merge -q --no-edit <réf>`, avec les mentions de `mentions_de_fusion` : le
# message par défaut de git (`Merge remote-tracking branch '<réf>' into <branche>`, que commitlint ignore), puis une
# mention par paragraphe. Rend le code et les sorties de `git merge`, sans rien en changer : le chemin de chaque
# appelant (refus de hook, conflits, avance rapide) reste le sien ; en conflit, le message est dans MERGE_MSG, que
# `git commit --no-edit` reprend. Les avis de `mentions_de_fusion` partent sur le descripteur 3 s'il est ouvert
# (l'appelant qui capture la sortie de git l'y relie : `3>&2 2>&1`), sinon sur la sortie d'erreur.
fusionner_avec() {
  local ref=${1:?réf à fusionner} mentions branche m
  local -a messages
  if { true >&3; } 2>/dev/null; then mentions=$(mentions_de_fusion "$ref" 2>&3); else mentions=$(mentions_de_fusion "$ref"); fi
  if [ -z "$mentions" ]; then
    git merge -q --no-edit "$ref"
    return
  fi
  branche=$(git symbolic-ref -q --short HEAD) || branche=HEAD
  messages=(-m "Merge remote-tracking branch '$ref' into $branche")
  while IFS= read -r m; do messages+=(-m "$m"); done <<<"$mentions"
  git merge -q --no-edit "${messages[@]}" "$ref"
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
# Livraison intermédiaire (`livraison/<nom>-<AAAAMMJJ-HHMM>`) : `livraison_intermediaire <nom> <sommet>`, sortie 0 si
# la tête est prouvée livraison du sujet, 1 sinon. Une seule règle pour passer.sh (après son `git fetch` du sujet) et
# `sujet.sh est-livraison` (le check `pr-titre` du socle, ticket 16) : sur les refs déjà là (origin/develop,
# origin/sujet/<nom>), sans fetch ni appel GitHub ; origin/sujet/<nom> absent, 1.
# Le nom de branche seul ne suffit pas (il dispense de la revue) : `sujet/<nom>` doit exister, et la
# livraison n'apporter qu'un sommet du sujet fusionné avec develop. La contenance du sommet dans le
# sujet ne suffit pas non plus : l'étape 4 pousse sur la livraison sa fusion avec develop, qu'aucun
# sujet ne contient, et au passage suivant (checks rouges relancés, sortie 5) la livraison passait
# pour une PR ordinaire (revue exigée, puis squash). Critère : un ancêtre commun de la tête et du
# sujet, hors de develop, dont la fusion avec le develop que la tête contient donne l'arbre de la
# tête, aux index générés près. Sinon la PR repasse par le chemin ordinaire (revue exigée, squash).
livraison_intermediaire() {
  local nom=$1 origine=$2 d s attendu ecart hors regeneres motifs generes
  git rev-parse -q --verify "refs/remotes/origin/sujet/$nom^{commit}" >/dev/null || return 1
  git rev-parse -q --verify "$origine^{commit}" >/dev/null || return 1
  # Liste des index générés calculée ici, jamais héritée d'un appelant ; illisible : pas une livraison.
  generes=$(index_generes_regex) && [ -n "$generes" ] || return 1
  d=$(git merge-base "$origine" origin/develop) || return 1
  for s in $(git merge-base --all "$origine" "origin/sujet/$nom" 2>/dev/null); do
    ! git merge-base --is-ancestor "$s" origin/develop || continue
    # Arbre de la fusion, même en conflit (sortie 1) : un conflit hors index y laisse ses marqueurs,
    # donc un écart avec la tête.
    attendu=$(git merge-tree --write-tree --no-messages "$s" "$d" 2>/dev/null | sed -n 1p) || true
    [ -n "$attendu" ] || continue
    # Un `git diff` en échec n'est jamais une dispense : on ne conclut que sur un diff lu.
    # Sans détection des renommages : une suppression ne se cache pas derrière un index généré ajouté.
    ecart=$(git -c core.quotePath=false diff --no-renames --name-only "$attendu" "$origine") || continue
    # Un index qui a une `commande` est régénéré : dispensé. Un index sans commande ne l'est que si son
    # blob au sommet est celui d'origin/develop (la version de develop prise au conflit par la mise à
    # jour) ; absent d'un côté, il diffère et va à la revue.
    # Un index déclaré par motif, même avec une `commande`, ne l'est que sur un contenu déjà connu (celui de la
    # fusion recalculée ou d'origin/develop) : sa régénération ne retire pas un fichier en trop sous le motif.
    # Liste illisible (fonction absente, jq en échec) : pas une livraison, la revue est exigée.
    regeneres=$(index_regeneres_regex) && [ -n "$regeneres" ] || return 1
    motifs=$(index_regeneres_motifs_regex) && [ -n "$motifs" ] || return 1
    hors=$(printf '%s\n' "$ecart" | sed '/^$/d' | while IFS= read -r f; do
      if ! grep -qE "$generes" <<<"$f"; then
        printf '%s\n' "$f"
      elif grep -qE "$motifs" <<<"$f"; then
        a=$(git rev-parse -q --verify "$origine:$f" 2>/dev/null) || a=''
        b=$(git rev-parse -q --verify "$attendu:$f" 2>/dev/null) || b=''
        c=$(git rev-parse -q --verify "origin/develop:$f" 2>/dev/null) || c=''
        [ -n "$a" ] && { [ "$a" = "$b" ] || [ "$a" = "$c" ]; } || printf '%s\n' "$f"
      elif ! grep -qE "$regeneres" <<<"$f"; then
        a=$(git rev-parse -q --verify "$origine:$f" 2>/dev/null) || a=''
        b=$(git rev-parse -q --verify "origin/develop:$f" 2>/dev/null) || b=''
        [ -n "$a" ] && [ "$a" = "$b" ] || printf '%s\n' "$f"
      fi
    done)
    [ -n "$hors" ] || return 0
  done
  return 1
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

# Lecture GitHub qui décide d'un état ou d'une fusion (A-21) : la seule. `gh api [--paginate] <route>`, sa sortie
# standard, sa sortie d'erreur et son code gardés. Refus, sortie 5, motif `GitHub illisible (<route>) : <cause>` sur la
# sortie d'erreur, rien sur la sortie standard : un code non nul, une sortie vide, une sortie qui n'est pas du JSON (un
# `--paginate` concatène des pages : chacune doit se lire), ou une page qui est un objet portant `message` au premier
# niveau (le corps d'erreur de GitHub ; un tableau d'objets n'est jamais refusé pour un champ imbriqué). Un 502 lu comme
# une file vide, « aucun check exigé » ou « CI non déclenchée » : c'est ce que ce refus empêche.
# `--absent <défaut>` : un refus dont la sortie d'erreur porte `HTTP 404` rend `<défaut>`, code 0 (protection absente).
# Rend la réponse brute ; le filtre jq reste chez l'appelant. Chaque appelant teste le code et sort en 5 lui-même :
# jamais `set -e`, perdu sous `||`, dans un `if` ou une substitution.
lire_github() {
  local route=${1:?route} paginer=() absent='' avec_absent=0 sortie erreur rc=0 cause=''
  shift
  while [ $# -gt 0 ]; do
    case $1 in
      --paginate) paginer=(--paginate) ;;
      --absent) avec_absent=1; absent=${2-}; shift ;;
      *) echo "lire_github : option inconnue $1" >&2; return 64 ;;
    esac
    shift
  done
  erreur=$(mktemp)
  sortie=$(gh api ${paginer[@]+"${paginer[@]}"} "$route" 2>"$erreur" </dev/null) || rc=$?
  if [ "$rc" != 0 ]; then
    # `gh: <message> (HTTP 404)`, ou `gh: HTTP 404` quand le corps n'a pas de message (cli/cli, pkg/cmd/api/api.go).
    if [ "$avec_absent" = 1 ] && grep -qE 'HTTP 404([^0-9]|$)' "$erreur"; then
      rm -f "$erreur"
      printf '%s\n' "$absent"
      return 0
    fi
    cause="gh en échec (code $rc) : $(grep . "$erreur" | tail -n 1 | masquer_url)"
  elif [ -z "${sortie//[[:space:]]/}" ]; then
    cause='réponse vide'
  elif ! jq -s . >/dev/null 2>&1 <<<"$sortie"; then
    cause='réponse qui n'"'"'est pas du JSON'
  elif [ "$(jq -s 'any(.[]; type == "object" and has("message"))' <<<"$sortie")" != false ]; then
    cause="corps d'erreur de GitHub : $(jq -rs 'map(select(type == "object" and has("message")) | .message | tostring) | first' <<<"$sortie" | masquer_url)"
  fi
  rm -f "$erreur"
  if [ -n "$cause" ]; then
    printf 'GitHub illisible (%s) : %s\n' "$route" "$cause" >&2
    return 5
  fi
  printf '%s\n' "$sortie"
}

# La clé `relecture` dans le contrat `.claude/chaine.json` d'une réf (A-97) : sortie 0 si elle y est, quelle que soit sa
# forme (le régime d'une PR se juge par `revue-exigee.mjs`, qui la lit entière), 1 sinon : pas de contrat, pas de clé, ou un
# contrat qui ne se lit pas. Pour les messages et les renvois (lot 5c), jamais pour décider d'une fusion.
cle_relecture_sur() {
  git show "$1:.claude/chaine.json" 2>/dev/null | jq -e 'type == "object" and has("relecture")' >/dev/null 2>&1
}

# La demande de relecture d'un auteur, en régime 8, pour les messages qui la font écrire (`renvoyer.sh`, `sujet.sh
# demarrer`) : la forme exacte que lit le Relecteur (`FORME_DEMANDE` de decision-relecteur.mjs) ne vit que dans
# `demande.mjs`, qui la fabrique ; le message nomme la commande, jamais la forme. Un commentaire qui commence par
# `À relire — ` sans cette forme est une marque presque à la forme, et la PR est sautée sans renvoi à chaque passage
# du capitaine (A-113) tant qu'il reste.
DEMANDE_DE_RELECTURE="le commentaire que rend \`node scripts/chaine/demande.mjs --session <ton id de session> --conducteur <celui de ton conducteur, — sans conducteur>\`, copié tel quel, seul dans son commentaire (le script lit le sommet dans git et refuse un sommet non poussé)"

# Le régime d'une PR (A-97) : `regime_de_la_pr <base> <created_at>` écrit 7, 8, ou `illisible` (clé mal formée, date),
# par `regimeDeLaPr` de `revue-exigee.mjs`, sur `origin/<base>` tel qu'il est là. Pour les messages et les renvois
# (lot 5c) ; la fusion se juge par `revue_du_capitaine`.
regime_de_la_pr() {
  node --input-type=module -e 'const m = await import(process.argv[1]); const r = m.regimeDeLaPr({ base: process.argv[2], ouverte: process.argv[3] }); process.stdout.write(`${r.regime ?? "illisible"}\n`);' \
    "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/revue-exigee.mjs" "$1" "$2"
}

# PR en JSON REST (`state` open/closed, `draft`, `labels[].name`, `base.ref`, `head.ref`,
# `head.sha`, `title`, `created_at`). Illisible : sortie 5.
pr_json() { lire_github "$DEPOT/pulls/$1"; }

# La revue d'une PR au passage du capitaine, selon son régime (lot 5a) : `revue_du_capitaine <json de la PR> <sommet>
# <base>`, les fichiers du diff propre sur l'entrée standard (celui que la relecture lit). Joue `revue-exigee.mjs`, à côté
# de ce fichier, avec `--ouverte` (le `created_at` de la PR : le régime, A-97), `--tete <sommet>` et les commentaires de la
# PR, toutes pages, dans un fichier (jamais en argument). `origin/develop` et les `origin/sujet/*` sont relus d'abord par
# refspecs explicites (un clone `--single-branch` ne les met pas à jour sur un fetch nu) : les calculs ne lisent pas le
# réseau (A-126) ; sans la clé `relecture` sur la base, ni fetch ni lecture (régime 7 sûr). Sortie de la CLI telle quelle, et son code : 0 éligible (première ligne `régime 7`, ou `régime 8 : tour
# <k> validé au sommet <sha>`), 1 refus (première ligne `régime 7` ou `régime 8`, motif en dernière), 21 lecture illisible
# (la cause), 2 options. 5 : origin ou GitHub illisible, la cause sur la sortie d'erreur, jamais un état.
REVUE_EXIGEE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/revue-exigee.mjs"
# La garde des fichiers sensibles du capitaine (lot 5b, A-76), en régime 8 : `garde_des_sensibles <base> <titre> <tête>
# [--conflits <fichier>] [--tickets <id>,…]`, le diff propre sur l'entrée standard, après `revue_du_capitaine` (qui a relu
# develop et les sujets). `chemins-sensibles.mjs --garde`, à côté dans un projet (scripts/chaine/), dans le skill
# revue-adversariale du plugin. Sa sortie et son code : 0 rien, 20 motif (renvoi), 21 illisible, 2 usage.
garde_des_sensibles() {
  local ici script
  ici=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
  script="$ici/chemins-sensibles.mjs"
  [ -f "$script" ] || script="$ici/../../revue-adversariale/scripts/chemins-sensibles.mjs"
  node "$script" --garde --base "$1" --titre "$2" --branche "$3" "${@:4}"
}
revue_du_capitaine() {
  local pr=$1 sommet=$2 base=$3 fichiers brut='[]' commentaires rc=0
  fichiers=$(cat)
  # Sans la clé `relecture` sur la base, la PR est en régime 7 quelle que soit sa date : rien à relire ni à lire de plus
  # qu'aujourd'hui (aucun fetch, aucune lecture des commentaires), la CLI juge la section de revue.
  if cle_relecture_sur "origin/$base"; then
    # `--prune`, comme `carte` de sujet.sh : un sujet supprimé du distant ne garde pas sa copie ancienne d'un ticket pour
    # la garde des fichiers sensibles, qui lit toutes les refs `origin/sujet/*`.
    git_masque fetch -q --prune origin '+refs/heads/develop:refs/remotes/origin/develop' '+refs/heads/sujet/*:refs/remotes/origin/sujet/*' ||
      { echo "origin illisible à la relecture de develop et des sujets (revue du capitaine)" >&2; return 5; }
    brut=$(lire_github "$DEPOT/issues/$(jq -r .number <<<"$pr")/comments?per_page=100" --paginate) || return 5
  fi
  commentaires=$(mktemp)
  # Un `--paginate` concatène des tableaux : un seul tableau, ou rien.
  if ! jq -s 'if all(.[]; type == "array") then add else error("pages") end' <<<"$brut" >"$commentaires" 2>/dev/null; then
    rm -f "$commentaires"
    echo "GitHub illisible ($DEPOT/issues/<n>/comments) : pages qui ne sont pas des tableaux" >&2
    return 5
  fi
  printf '%s\n' "$fichiers" | node "$REVUE_EXIGEE" "$(jq -r '.body // ""' <<<"$pr")" "$(jq -r .title <<<"$pr")" "origin/$base" \
    --ouverte "$(jq -r '.created_at // ""' <<<"$pr")" --tete "$sommet" --branche "$(jq -r .head.ref <<<"$pr")" --commentaires "$commentaires" && rc=0 || rc=$?
  rm -f "$commentaires"
  return "$rc"
}

# Tête de PR gardée : `develop`, `main`, ou la branche par défaut du dépôt (2e argument, lu dans le
# JSON de la PR : `base.repo.default_branch`). Le capitaine pousse la mise à jour d'une PR sur sa tête :
# jamais sur celles-ci (« jamais de push sur la branche par défaut »). La livraison d'un sujet
# (`sujet/<nom>` vers develop) n'en est pas une : la mettre à jour avec develop est le chemin prévu.
tete_gardee() { [ "$1" = develop ] || [ "$1" = main ] || { [ -n "${2:-}" ] && [ "$1" = "$2" ]; }; }

# Sommet (dernier commit) de la branche d'une PR. Illisible, ou pas un sha : sortie 5.
pr_sommet() {
  local j s
  j=$(pr_json "$1") || return 5
  s=$(jq -r '.head.sha // ""' <<<"$j" 2>/dev/null) || s=''
  [[ "$s" =~ ^[0-9a-f]{40}$ ]] || { echo "GitHub illisible ($DEPOT/pulls/$1) : sommet absent de la réponse" >&2; return 5; }
  printf '%s\n' "$s"
}

# Checks d'un commit, une ligne « nom<TAB>état » par check, états au format de
# `statusCheckRollup` : conclusion en majuscules (SUCCESS, FAILURE, SKIPPED…) pour un check
# terminé, sinon son statut (QUEUED, IN_PROGRESS) ; les statuts de commit (SUCCESS, FAILURE,
# ERROR, PENDING) s'y ajoutent. Un check par nom : le plus récent (id le plus grand). Deux
# exécutions d'un même workflow sur un commit (la première annulée par la concurrence) en
# laissent deux du même nom, et l'API ne remplace que le relancement d'un même run. Cas vécu :
# #700, checks annulés lus à la place de leurs successeurs verts.
checks_commit() {
  local runs statuts lignes
  runs=$(lire_github "$DEPOT/commits/$1/check-runs?per_page=100" --paginate) || return 5
  statuts=$(lire_github "$DEPOT/commits/$1/status") || return 5
  # Une forme inattendue (champ absent) est une panne aussi : rien n'est écrit avant que tout soit lu.
  lignes=$(jq -rs '[.[].check_runs[]]
    | group_by(.name) | map(max_by(.id))[]
    | "\(.name)\t\(if .status == "completed" then (.conclusion // "" | ascii_upcase) else (.status | ascii_upcase) end)"' <<<"$runs" 2>/dev/null &&
    jq -r '.statuses[] | "\(.context)\t\(.state | ascii_upcase)"' <<<"$statuts" 2>/dev/null) ||
    { echo "GitHub illisible ($DEPOT/commits/$1) : checks d'une forme inattendue" >&2; return 5; }
  [ -z "$lignes" ] || printf '%s\n' "$lignes"
}

# Checks exigés sur develop, en tableau JSON. D'abord les rulesets (`rules/branches/develop` :
# ce que GitHub recommande, et ce que pose docs/agents/chaine-admin.md), qui doivent rendre un tableau ; s'ils n'exigent rien,
# l'ancienne protection de branche, qui répond 404 « Branch not protected » quand seul un ruleset protège la
# branche : une réponse, pas une panne. Toute autre erreur, ou une forme inattendue : sortie 5, jamais « aucun
# check exigé ». Une règle « Require status checks to pass » qui n'exige aucun check (ruleset ou ancienne protection) :
# sortie 6, RÉGLAGE DU DÉPÔT sur la sortie d'erreur, jamais [] (ticket 91) : lue [], toute PR se dirait « prête
# (sans CI) » et n'entrerait jamais ; c'est un réglage à faire par un admin, dit dès cette lecture. GitHub cumule les
# rulesets et l'ancienne protection : devant une règle vide d'un ruleset, l'ancienne protection se lit encore, et ses
# checks font la liste ; le réglage n'est dit que si elle n'en exige aucun non plus (contre-relecture de la PR 159).
reglage_checks_vides() { # <où la règle est lue>
  echo "RÉGLAGE DU DÉPÔT : $1 porte une règle « Require status checks to pass » (required_status_checks) qui n'exige aucun check ; toute PR vers develop s'y lirait « prête (sans CI) » et n'entrerait jamais. À un admin : y ajouter les checks exigés de la CI (qualite, test-db, zizmor : docs/agents/chaine-admin.md, « Protection de develop ») ; puis relancer le capitaine." >&2
  return 6
}
checks_exiges() {
  local regles protection exiges vide=''
  regles=$(lire_github "$DEPOT/rules/branches/develop") || return 5
  exiges=$(jq -c 'if type == "array" then [.[] | select(.type == "required_status_checks") | .parameters.required_status_checks[].context] | unique
    else error("pas un tableau") end' <<<"$regles" 2>/dev/null) ||
    { echo "GitHub illisible ($DEPOT/rules/branches/develop) : réponse qui n'est pas un tableau de règles" >&2; return 5; }
  if [ "$exiges" != '[]' ]; then printf '%s\n' "$exiges"; return 0; fi
  # Aucun check exigé par les rulesets : une règle required_status_checks présente est vide (le cas de l'essai réel du
  # régime 8 : la PR vue « sans CI » pendant une heure, deux fois). Elle se retient, et l'ancienne protection se lit
  # avant de la dire : GitHub cumule les deux, et des checks exigés là font la liste.
  if [ "$(jq '[.[] | select(.type == "required_status_checks")] | length' <<<"$regles")" != 0 ]; then
    vide="la branche develop (ruleset $(jq -r '[.[] | select(.type == "required_status_checks") | .ruleset_id // "?" | tostring] | unique | join(", ")' <<<"$regles"))"
  fi
  protection=$(lire_github "$DEPOT/branches/develop/protection/required_status_checks" --absent 'null') || return 5
  if [ "$protection" = null ]; then
    [ -z "$vide" ] || { reglage_checks_vides "$vide"; return; }
    echo '[]'
    return 0
  fi
  exiges=$(jq -c 'if type == "object" and ((.contexts // []) | type) == "array" then (.contexts // []) else error("forme inattendue") end' <<<"$protection" 2>/dev/null) ||
    { echo "GitHub illisible ($DEPOT/branches/develop/protection/required_status_checks) : forme inattendue" >&2; return 5; }
  [ "$exiges" != '[]' ] || { reglage_checks_vides "${vide:-la protection de branche de develop (Settings → Branches)}"; return; }
  printf '%s\n' "$exiges"
}

# Attend la CI exigée de `<sommet>`, la tête de la PR `<pr>` : le sommet sur la PR (5 min au plus), un check exigé
# apparu (5 min), puis le verdict de tous (60 min). Liste des exigés lue dans la protection de develop : les checks du
# sommet ne montrent que ceux déjà créés, et un check de synthèse (qui attend toute une matrice) n'apparaît qu'en fin
# de matrice. Partagée par passer.sh et sujet.sh. Retours : 0 vert ; 1 rouge, la liste sur la sortie standard, une
# ligne « ␣␣nom : ÉTAT » par check ; 2 aucun check exigé apparu au bout de 5 min (CI non déclenchée) ; 3 encore en
# attente après 60 min ; 5 GitHub illisible pendant l'attente (lire_github, motif sur la sortie d'erreur) : jamais lu
# comme « encore en attente » ni comme « aucun check ». 6 réglage du dépôt (checks_exiges : une règle de checks exigés vide).
attendre_ci() {
  local n=$1 sommet=$2 requis etats rouges attente nom c vu s
  for _ in $(seq 1 60); do
    s=$(pr_sommet "$n") || return 5
    [ "$s" = "$sommet" ] && break
    sleep 5
  done
  requis=$(checks_exiges) || return $? # 5 illisible, 6 réglage du dépôt
  requis=$(jq -r '.[]' <<<"$requis")
  vu=0
  for _ in $(seq 1 30); do
    etats=$(checks_commit "$sommet") || return 5
    # Pas de `grep -q` : sous pipefail, `gh` tué par SIGPIPE ferait échouer le test.
    [ "$(printf '%s\n' "$etats" | awk -F '\t' -v r="$requis" 'BEGIN { n = split(r, t, "\n"); for (i = 1; i <= n; i++) if (t[i] != "") e[t[i]] = 1 } ($1 in e) { v = 1 } END { print v + 0 }')" = 1 ] && { vu=1; break; }
    sleep 10
  done
  [ "$vu" = 1 ] || return 2
  for _ in $(seq 1 120); do # 60 min au plus
    etats=$(checks_commit "$sommet") || return 5
    attente=0
    rouges=''
    while IFS= read -r nom; do
      c=$(printf '%s\n' "$etats" | awk -F '\t' -v n="$nom" '$1 == n { c = $2 } END { print c }')
      case "$c" in
        SUCCESS | SKIPPED | NEUTRAL) ;;
        FAILURE | CANCELLED | TIMED_OUT | ACTION_REQUIRED | STARTUP_FAILURE | ERROR) rouges="$rouges  $nom : $c"$'\n' ;;
        *) attente=1 ;;
      esac
    done <<<"$requis"
    if [ -n "$rouges" ]; then printf '%s' "$rouges"; return 1; fi
    [ "$attente" = 1 ] || return 0
    sleep 30
  done
  return 3
}

# Arbre du squash ≠ arbre testé, vu après une fusion acceptée par GitHub (passer.sh, sujet.sh) : le code entré n'est
# pas celui que la CI a jugé. Une fusion ne se défait pas d'elle-même : le script qui a fusionné commente la PR (il a
# les deux arbres), retire `à-fusionner`, écrit la ligne `ARBRE DIFFÉRENT`, et sort en 12 ; la boucle s'arrête, le
# capitaine le dit à son lanceur. Le commentaire manqué est dit, la sortie reste 12.
MARQUE_ARBRE='<!-- arbre-different-capitaine -->'
signaler_arbre_different() { # <pr> <sommet testé> <squash> (squash vide : introuvable)
  local n=$1 teste=$2 squash=${3:-} a_teste a_squash ecart corps
  a_teste=$(git rev-parse "$teste^{tree}" 2>/dev/null) || a_teste='?'
  if [ -n "$squash" ]; then
    a_squash=$(git rev-parse "$squash^{tree}" 2>/dev/null) || a_squash='?'
    ecart=$(git -c core.quotePath=false diff --no-renames --name-only "$teste" "$squash" 2>/dev/null | sed 's/^/- `/; s/$/`/') ||
      ecart='(diff illisible)'
  else
    squash='introuvable'
    a_squash='?'
    ecart='(squash introuvable dans la branche cible)'
  fi
  corps=$(printf '%s\nLe capitaine a fusionné cette PR, mais **arbre du squash ≠ arbre testé** : le code entré n'"'"'est pas celui que la CI a jugé.\n\n- squash : `%s` (arbre `%s`)\n- sommet testé : `%s` (arbre `%s`)\n\nFichiers qui diffèrent (`git diff --name-only %s %s`) :\n\n%s\n\nLa boucle du capitaine s'"'"'est arrêtée : une fusion ne se défait pas d'"'"'elle-même, un humain examine (`git diff %s %s`).\n\n---\n_Generated by [Claude Code](https://claude.ai/code)_' \
    "$MARQUE_ARBRE" "$squash" "$a_squash" "$teste" "$a_teste" "$teste" "$squash" "${ecart:-(aucun)}" "$teste" "$squash")
  commenter "$n" "$corps" || echo "#$n : commentaire « arbre du squash ≠ arbre testé » NON posé (gh refusé) : le poser à la main" >&2
  retirer_label "$n" à-fusionner
  echo "ARBRE DIFFÉRENT : #$n, squash $squash (arbre $a_squash) ≠ sommet testé $teste (arbre $a_teste) : arbre du squash ≠ arbre testé, la boucle s'arrête, un humain examine"
}

# Verrou du passage (plusieurs capitaines sur la même file, décision P-2 du produit). Au début de chaque passage
# (passer.sh, `sujet.sh fusionner`, `sujet.sh relancer`), le capitaine pose sur la PR un commentaire visible, « Passage
# du capitaine `<id>` depuis <hh:mm> UTC », qui porte la marque invisible `<!-- capitaine:passage <id> <epoch> -->`
# (l'heure de la pose ou du dernier rafraîchissement, en secondes depuis l'époque Unix, réécrite à chaque tour), puis
# relit les commentaires. Un autre capitaine qui a posé AVANT lui (id plus petit : l'ordre de GitHub départage deux
# capitaines arrivés à la même seconde) une marque sans `<!-- capitaine:fin -->`, datée à moins de 90 minutes du
# `created_at` du sien, tient la PR : le capitaine retire son commentaire et la saute, sans renvoi. La date d'une marque
# est le plus tard de son epoch et de son `created_at` (un epoch en retard ne la rajeunit jamais : un verrou vit au moins
# 90 minutes depuis sa pose), son seul `created_at` si l'epoch est illisible ou plus de 5 minutes en avance sur le
# `created_at` du lecteur (règle de `FILTRE_PASSAGE`, ci-dessous : un verrou sans nouvelles meurt 90 minutes après la
# plus tardive de sa création et de son epoch compté, jamais de gel) ; jamais
# `updated_at` (la documentation de GitHub ne dit pas noir sur blanc qu'une édition l'avance : décision de
# l'architecte). Ne comptent que les commentaires d'un compte de l'organisation
# (`author_association` OWNER, MEMBER ou COLLABORATOR) : deux capitaines de deux personnes publient sous deux comptes,
# donc le compte du capitaine (`gh api user`, filtre des renvois) ne départage rien ici, et les sessions d'une même
# personne publient sous un même compte, d'où l'id de session. Un commentaire, pas un label : un label de plus
# changerait les neuf labels du socle, et il ne dirait ni qui ni depuis quand. La sûreté vient de la règle
# d'ascendance (deux capitaines ne font jamais entrer une PR non testée) : le verrou n'évite que le travail en double.
# À toute sortie, la trappe de l'appelant joue `finir_passage` (« terminé », la marque de fin), posée avant
# `prendre_passage` : un TERM ou un INT pendant la pose ou la relecture termine le commentaire (pose lancée sans id
# connu : `finir_passage` relit les commentaires et termine ses marques vivantes) ; pendant l'attente de la CI,
# `rafraichir_passage` à chaque tour. Un passage tué par KILL laisse un verrou qui expire 90 minutes après sa dernière
# date comptée (sa création, ou son dernier epoch, s'il n'est pas en avance sur le lecteur : `FILTRE_PASSAGE`).
# `CAPITAINE_ID` : l'id de la session du capitaine, sans valeur par défaut ; il entre dans un commentaire HTML, d'où
# sa forme fermée.
capitaine_id_valide() { [[ "${1-}" =~ ^[A-Za-z0-9_-]{1,100}$ ]]; }
PASSAGE_PR=''
PASSAGE_COMMENTAIRE=''
PASSAGE_ANCIENS=''
PASSAGE_TOUR=0
PASSAGE_MOTIF=''
PASSAGE_POSE_LANCEE='' # 1 : POST du commentaire lancé, son id pas encore lu (finir_passage relit alors)
# Horloge du verrou : celle de la machine. `PASSAGE_HORLOGE_BANC` (secondes depuis l'époque Unix, pour les bancs
# seulement : l'epoch des marques suit alors les dates du faux GitHub) la fixe ; elle ne règle que cette heure-là, et
# seulement si `FAUX_GH` (le faux GitHub des bancs) est posé et non vide. Posée sans lui (en production) : ignorée,
# avec un seul avertissement sur la sortie d'erreur, donné ici, au chargement, avant tout verdict, puis retirée de
# l'environnement : `epoch_passage` n'avertit jamais, et rien n'est écrit après la ligne de `sortir`, même depuis la
# trappe EXIT (`finir_passage`), car la boucle lit le verdict sur la dernière ligne de la sortie.
if [ -n "${PASSAGE_HORLOGE_BANC-}" ] && [ -z "${FAUX_GH-}" ]; then
  echo "verrou du passage : PASSAGE_HORLOGE_BANC ignorée hors des bancs (FAUX_GH absent ou vide), horloge de la machine" >&2 || :
  unset PASSAGE_HORLOGE_BANC
fi
epoch_passage() {
  if [[ "${PASSAGE_HORLOGE_BANC-}" =~ ^[0-9]{1,12}$ ]]; then
    printf '%s\n' "$PASSAGE_HORLOGE_BANC"
    return
  fi
  date -u +%s
}
heure_passage() { jq -nr --argjson e "$(epoch_passage)" '$e | strftime("%H:%M")'; }
PIED_DE_PAGE=$'\n\n---\n_Generated by [Claude Code](https://claude.ai/code)_'
corps_passage() { # <« depuis … » ou « terminé à … »> [fin]
  local marque
  marque="<!-- capitaine:passage $CAPITAINE_ID $(epoch_passage) -->"
  if [ "${2:-}" = fin ]; then
    printf 'Passage du capitaine `%s` %s.\n%s\n<!-- capitaine:fin -->%s' "$CAPITAINE_ID" "$1" "$marque" "$PIED_DE_PAGE"
  else
    printf 'Passage du capitaine `%s` %s : un autre capitaine saute cette PR jusqu'"'"'à la fin du passage.\n%s%s' "$CAPITAINE_ID" "$1" "$marque" "$PIED_DE_PAGE"
  fi
}
# Décision du verrou, pure : les commentaires (pages de `issues/<n>/comments` sur l'entrée, concaténées) lus avec
# `--arg moi <CAPITAINE_ID> --argjson mien <id du sien> --arg cree <created_at du sien>`. Rend { tenu, anciens } :
# `tenu` « <autre> <date> » de la plus ancienne marque vivante d'un autre capitaine posée avant la sienne, ou null (date :
# le plus tard de l'epoch du corps et du `created_at` de la marque, sinon son `created_at`) ;
# `anciens` les ids de ses propres marques vivantes d'un passage précédent (tué), que finir_passage termine.
# Une date illisible fait échouer jq : le verrou est alors illisible, jamais libre. Un epoch illisible (lettres, plus de
# 12 chiffres, plus de 40 caractères, vide) laisse la marque datée par son `created_at`, jamais ignorée (la capture
# reste bornée à 40 caractères). Un epoch en avance de plus de 5 minutes sur le `created_at` du sien (`$t`, celui du
# lecteur : horloge en avance, valeur fausse) ne compte pas tant qu'il le reste : la marque est datée par son
# `created_at`. Mais `$t` avance d'un lecteur à l'autre : le même epoch se met à compter quand un lecteur plus tardif
# le rattrape, et une marque figée posée par une horloge en avance peut revivre, jusqu'à E + 90 minutes (décision A-55
# de l'architecte : la règle reste, aucune fusion non testée, jamais de gel). Un verrou sans nouvelles meurt donc
# 90 minutes après la plus tardive de sa création et de son epoch compté. Un epoch en retard (horloge en retard, `0`)
# ne date jamais la marque avant son `created_at` : le verrou vit au moins 90 minutes depuis sa pose.
# shellcheck disable=SC2016
FILTRE_PASSAGE='def marque: [.body | match("<!-- capitaine:passage ([A-Za-z0-9_-]{1,100})(?: ([^ ]{0,40})[^ ]*)? -->"; "g") | .captures] | first;
  ($cree | fromdateiso8601) as $t
  | [.[][] | select(.author_association == "OWNER" or .author_association == "MEMBER" or .author_association == "COLLABORATOR")
    | select((.body | contains("<!-- capitaine:fin -->")) | not)
    | marque as $c | select($c != null)
    | (if ($c[1].string // "" | test("^[0-9]{1,12}$")) then ($c[1].string | tonumber) else null end) as $e
    | (.created_at | fromdateiso8601) as $pose
    | {id, m: $c[0].string, date: (if $e != null and $e <= $t + 300 then ([$e, $pose] | max) else $pose end)}
    | select(.id != $mien)] as $vivantes
  | { tenu: ([$vivantes[] | select(.m != $moi and .id < $mien and .date > $t - 5400)]
        | sort_by(.id) | first | if . == null then null else "\(.m) \(.date | todate)" end),
      anciens: [$vivantes[] | select(.m == $moi) | .id] }'
# Pose le verrou sur la PR `<n>` (CAPITAINE_ID valide exigé de l'appelant). Retours : 0 pris par ce capitaine
# (PASSAGE_COMMENTAIRE gardé, la trappe de l'appelant doit jouer finir_passage) ; 1 tenu par un autre capitaine,
# son propre commentaire retiré, motif dans PASSAGE_MOTIF ; 2 pose impossible (écriture refusée) ; 3 lecture des
# commentaires refusée ou illisible après la pose (une panne, A-21 : l'appelant sort en 5, pause puis reprise). En 2 et
# 3, motif sur la sortie d'erreur, son commentaire retiré (ou terminé) s'il a été posé : jamais un passage sans verrou,
# jamais un verrou que personne ne tient.
prendre_passage() {
  local n=$1 erreur pose id cree lus decision tenu
  PASSAGE_PR=$n PASSAGE_COMMENTAIRE='' PASSAGE_ANCIENS='' PASSAGE_TOUR=0 PASSAGE_MOTIF=''
  erreur=$(mktemp)
  # Avant le POST : un signal qui tombe pendant lui (réponse en vol, `gh` tué avec le groupe) laisse un commentaire
  # posé dont l'id n'est pas lu ; la trappe le retrouve par relecture (finir_passage). Un POST refusé aussi : GitHub a
  # pu poser le commentaire et perdre la réponse.
  PASSAGE_POSE_LANCEE=1
  pose=$(gh api -X POST "$DEPOT/issues/$n/comments" -f body="$(corps_passage "depuis $(heure_passage) UTC")" \
    --jq '"\(.id) \(.created_at)"' 2>"$erreur" </dev/null) || {
    echo "verrou du passage : commentaire non posé sur #$n : $(grep . "$erreur" | tail -n 1 | masquer_url)" >&2
    rm -f "$erreur"
    return 2
  }
  rm -f "$erreur"
  read -r id cree <<<"$pose"
  if ! [[ "$id" =~ ^[0-9]+$ ]]; then
    echo "verrou du passage : réponse de GitHub sans id de commentaire sur #$n" >&2
    return 2
  fi
  PASSAGE_COMMENTAIRE=$id PASSAGE_POSE_LANCEE=''
  if ! lus=$(lire_github "$DEPOT/issues/$n/comments?per_page=100" --paginate) ||
    ! decision=$(jq -cs --arg moi "$CAPITAINE_ID" --argjson mien "$id" --arg cree "$cree" "$FILTRE_PASSAGE" <<<"$lus" 2>/dev/null); then
    echo "verrou du passage : commentaires de #$n illisibles (cause ci-dessus, ou date illisible) : son commentaire retiré, pas de passage sans verrou" >&2
    retirer_passage
    return 3
  fi
  PASSAGE_ANCIENS=$(jq -r '.anciens | map(tostring) | join(" ")' <<<"$decision")
  tenu=$(jq -r '.tenu // ""' <<<"$decision")
  if [ -n "$tenu" ]; then
    retirer_passage
    PASSAGE_ANCIENS=''
    PASSAGE_MOTIF="en passage chez le capitaine ${tenu%% *} depuis ${tenu#* } : sautée sans renvoi"
    return 1
  fi
}
# Retire son commentaire (PR tenue par un autre, ou relecture impossible) ; DELETE refusé : le termine.
retirer_passage() {
  [ -n "$PASSAGE_COMMENTAIRE" ] || return 0
  if ! gh api -X DELETE "$DEPOT/issues/comments/$PASSAGE_COMMENTAIRE" >/dev/null 2>&1 </dev/null; then
    finir_passage
    return 0
  fi
  PASSAGE_COMMENTAIRE=''
}
# Rafraîchit le commentaire au début de chaque tour d'attente de la CI (le PATCH réécrit l'epoch de la marque, l'âge du
# verrou). En échec : une ligne sur la sortie d'erreur, le passage continue (au pire le verrou expire : travail en
# double, jamais une fusion non testée).
rafraichir_passage() {
  [ -n "$PASSAGE_COMMENTAIRE" ] || return 0
  PASSAGE_TOUR=$((PASSAGE_TOUR + 1))
  gh api -X PATCH "$DEPOT/issues/comments/$PASSAGE_COMMENTAIRE" \
    -f body="$(corps_passage "depuis $(heure_passage) UTC, tour $PASSAGE_TOUR")" >/dev/null 2>&1 </dev/null ||
    echo "verrou du passage : commentaire de #$PASSAGE_PR non rafraîchi (tour $PASSAGE_TOUR), le passage continue" >&2
}
# Termine son commentaire (« terminé », la marque de fin), et ses marques d'un passage précédent tué. Appelée par la
# trappe EXIT de l'appelant : en échec, une ligne sur la sortie d'erreur, jamais un autre code de sortie. Une pose
# lancée dont l'id n'a pas été lu (un signal pendant le POST) : relit les commentaires de la PR (`lire_github`) et
# termine les marques vivantes de ce capitaine ; une relecture en panne se dit en une ligne, comme un PATCH refusé.
finir_passage() {
  local id corps erreur lus cause
  if [ -n "$PASSAGE_POSE_LANCEE" ] && [ -z "$PASSAGE_COMMENTAIRE" ]; then
    PASSAGE_POSE_LANCEE=''
    erreur=$(mktemp 2>/dev/null) || erreur=/dev/null
    if lus=$(lire_github "$DEPOT/issues/$PASSAGE_PR/comments?per_page=100" --paginate 2>"$erreur") &&
      lus=$(jq -rs --arg moi "${CAPITAINE_ID-}" --argjson mien 0 --arg cree 1970-01-01T00:00:00Z \
        "$FILTRE_PASSAGE | .anciens | map(tostring) | join(\" \")" <<<"$lus" 2>/dev/null); then
      PASSAGE_ANCIENS="$PASSAGE_ANCIENS $lus"
    else
      # Jamais un échec sous `set -e` (la trappe EXIT de l'appelant) : `$erreur` est vide quand `lire_github` a
      # réussi et que le filtre a échoué (date illisible), et grep rend alors 1.
      cause=$({ grep . "$erreur" 2>/dev/null || :; } | tail -n 1 | masquer_url) || cause=''
      echo "verrou du passage : commentaire de #$PASSAGE_PR non terminé (relecture impossible : ${cause:-commentaires illisibles}), il expirera 90 minutes après sa dernière date comptée" >&2 || :
    fi
    [ "$erreur" = /dev/null ] || rm -f "$erreur" || :
  fi
  [ -n "${PASSAGE_COMMENTAIRE}${PASSAGE_ANCIENS// /}" ] || return 0
  if ! corps=$(corps_passage "terminé à $(heure_passage) UTC" fin); then
    echo "verrou du passage : corps de fin illisible, commentaire(s) $PASSAGE_COMMENTAIRE $PASSAGE_ANCIENS de #$PASSAGE_PR non terminé(s)" >&2 || :
    PASSAGE_COMMENTAIRE='' PASSAGE_ANCIENS='' PASSAGE_POSE_LANCEE=''
    return 0
  fi
  for id in $PASSAGE_COMMENTAIRE $PASSAGE_ANCIENS; do
    gh api -X PATCH "$DEPOT/issues/comments/$id" -f body="$corps" >/dev/null 2>&1 </dev/null ||
      echo "verrou du passage : commentaire $id de #$PASSAGE_PR non terminé (il expirera 90 minutes après sa dernière date comptée)" >&2 || :
  done
  PASSAGE_COMMENTAIRE='' PASSAGE_ANCIENS='' PASSAGE_POSE_LANCEE=''
  return 0
}

poser_label() { gh api -X POST "$DEPOT/issues/$1/labels" -f "labels[]=$2" >/dev/null; }
# Un label déjà absent n'est pas une erreur (404).
retirer_label() { gh api -X DELETE "$DEPOT/issues/$1/labels/$(uri "$2")" >/dev/null 2>&1 || true; }
commenter() { gh api -X POST "$DEPOT/issues/$1/comments" -f body="$2" >/dev/null; }
