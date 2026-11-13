#!/usr/bin/env bash
# =============================================================================
# Branches de sujet (skill `sujet`, ADR « branches de sujet ») : une série de PR liées vit sur
# `sujet/<nom>`, puis entre dans develop en UNE PR, par un commit de merge qui garde
# un commit par sous-PR.
#
#   demarrer <ticket|nom> place la branche de travail (sans commit propre) sur le sujet du ticket
#                         (ligne `Sujet:` du ticket ou de sa spec), ouvert au besoin ; affiche la
#                         base de la future PR (sujet/<nom>, ou develop si le ticket n'a pas de sujet)
#                         refuse (4) un ticket dont la spec n'est pas sur cette base, ou dont un
#                         `Blocked by:` n'y est pas fait (Status resolved/Fait/done) ; une branche
#                         qui a déjà des commits partis de develop reçoit la commande de rebase
#   ouvrir <nom> [--specs <pr>]
#                         crée sujet/<nom> depuis develop, sans protection de branche (A-8 de
#                         ALL-INF-13) ; `--specs` recible sur le sujet la PR de specs du lot
#   fusionner <pr>        squash d'une sous-PR dans son sujet : checks exigés verts sur son sommet,
#                         titre qui passe commitlint
#                         (lancé par le capitaine pour une sous-PR étiquetée `à-fusionner`)
#   rafraichir <nom> [--abandon-si-conflit]
#                         fusionne develop dans sujet/<nom> (jamais de rebase), index régénérés ;
#                         `--abandon-si-conflit` (capitaine) annule la fusion au lieu de la laisser en cours
#   livrer <nom> <titre>  ouvre la PR sujet/<nom> → develop, étiquetée `à-fusionner` ; refuse une migration
#                         plus ancienne que la dernière de develop, et tant qu'une sous-PR est ouverte ;
#                         livraison intermédiaire (carte avant `5-livraison`) : la PR part de `livraison/<nom>-<date>`, jetable, et `sujet/<nom>` survit
#   livrer-prets [--dry-run]
#                         (capitaine) livre chaque sujet « prêt à livrer », sauf label `sujet-manuel` :
#                         plus de sous-PR ouverte, ET tickets déclarés (`Sujet:`) tous faits ou label
#                         `sujet-auto` (né d'un regroupement) : un ticket pas commencé n'a pas de PR
#                         (#575, 15/10) ; `--dry-run` affiche sans rien écrire
#   relancer <pr>         sous-PR sans CI (reciblée depuis une pile) : fusionne son sujet dans sa
#                         branche et pousse, ce qui lance sa CI (jamais de rebase ni de force)
#   series                séries repérées dans la file du capitaine (PR vers develop ou empilées) :
#                         même spec (SPEC_ALL_SOC-1.xx), même pile, même préfixe de branche
#   regrouper-series [--dry-run]
#                         (capitaine) regroupe d'office les séries par spec (≥ 3 PR, ou un sujet de
#                         la spec existe déjà) et les piles (≥ 2 PR), hors prio:haute et hors-sujet ;
#                         `--dry-run` affiche les regroupements sans rien écrire
#   regrouper <nom> <pr>… ouvre sujet/<nom> au besoin, le met à jour avec develop, puis recible
#                         chaque PR vers develop listée sur le sujet (sans toucher à ses commits :
#                         le sujet contient le sommet de develop) et la commente
#   carte <nom>           (session qui tient la carte) pousse sur origin/sujet/<nom> les commits locaux de la branche
#                         courante qui n'y sont pas : seul geste d'écriture d'une session sur un sujet
#                         (le hook d'agent refuse tout `git push` vers sujet/…). Chaque commit modifie en
#                         place UN fichier docs/**/*.map.md et rien d'autre (ni création, ni suppression,
#                         ni renommage, ni mode), dont la ligne `Sujet:` nomme exactement sujet/<nom>
#                         avant comme après, et ce fichier est formaté par Prettier. Une branche en retard
#                         rattrape le sujet par `git merge --ff-only` ; historique divergent, commit de
#                         fusion ou option (jamais de push forcé) : sortie 9, rien n'est poussé
#   carte (sans argument) « ticket<TAB>sujet » pour chaque ticket qui déclare un sujet (develop et sujets)
#   de <ticket>           sujet d'un ticket
#   etat                  tableau des sujets ouverts : avance, retard, sous-PR, tickets, verdict
#                         (`en cours`, `prêt à livrer`, `livré #n`)
#
# Sorties : 0 fait · 2 conflit · 3 checks rouges ou en cours · 4 refus corrigeable par l'auteur (sa
# dernière ligne est le motif, `fusionner` : titre, commitlint, revue, base) · 6 arbre de travail pas
# propre (`fusionner`, `rafraichir`, `regrouper`, `relancer` : à nettoyer par qui lance, jamais un renvoi de la PR,
# comme la sortie 6 de passer.sh) · 7 `fusionner` d'une PR fermée ou en brouillon (rien à corriger :
# sautée) · 9 `carte <nom>` refusée (rien n'est poussé)
# `fusionner` encore : 5 la sous-PR a bougé pendant sa mise à jour (reprise au tour suivant) · 8 conflit
# avec le sujet sur des index générés seuls : branche mise à jour (index régénérés) et poussée, CI
# relancée, aucun squash
# Tout passe par l'API REST (`gh api`) : GraphQL est refusé depuis les sessions cloud. Depuis la
# racine du dépôt ; sans argument, affiche cette aide.
# =============================================================================
set -euo pipefail
# github.sh : à côté (scripts/chaine/ du projet, ou copie des outils du capitaine), sinon dans le skill fusionner.
ici=$(cd "$(dirname "$0")" && pwd)
if [ -f "$ici/github.sh" ]; then . "$ici/github.sh"; else . "$ici/../../fusionner/scripts/github.sh"; fi
cd "$(git rev-parse --show-toplevel)"

sortir() { echo "$2"; exit "$1"; }
# Clone superficiel : merge-base faux (même parade que passer.sh).
[ "$(git rev-parse --is-shallow-repository)" = false ] || git fetch -q --unshallow origin

GENERES=$(index_generes_regex) # scripts/docs/index-generes.json ; regenerer_index : github.sh

# Tickets rattachés à un sujet : ligne `Sujet: sujet/<nom>` (ou `- **Sujet :** sujet/<nom>`) en tête
# du ticket, ou de sa spec
# (alors valable pour tous ses tickets). Lue sur develop et sur chaque branche de sujet, car le
# découpage d'un lot peut entrer directement dans son sujet. Sortie : « ticket<TAB>nom », le
# ticket en `SPEC_ALL_SOC-1.02` ou, pour une spec, `SPEC_ALL_SOC-1` (lus dans le nom du fichier par
# identifiant.mjs, la grammaire du skill `tickets`).
LIGNE_SUJET='^(- )?\**Sujet ?:\** *sujet/[a-z0-9][a-z0-9-]*'
branches_sujet() { git for-each-ref --format='%(refname:short)' 'refs/remotes/origin/sujet/*'; }
carte() {
  git fetch -q origin develop '+refs/heads/sujet/*:refs/remotes/origin/sujet/*' 2>/dev/null || true
  # shellcheck disable=SC2046
  git grep -h -E -m1 -o "$LIGNE_SUJET" origin/develop $(branches_sujet) -- \
    'docs/*.spec.md' 'docs/*.issue.md' ':!docs/*/issues/archive/*' >/dev/null 2>&1 || return 0
  # shellcheck disable=SC2046
  git grep -E -m1 -o "$LIGNE_SUJET" origin/develop $(branches_sujet) -- \
    'docs/*.spec.md' 'docs/*.issue.md' ':!docs/*/issues/archive/*' 2>/dev/null |
    sed -E 's#^[^:]+:##; s#:(- )?\**Sujet ?:\** *sujet/#\t#' |
    identifiant fichiers | sort -u
}

# Sujet d'un ticket (SPEC_ALL_SOC-1.02) : celui du ticket, sinon celui de sa spec (SPEC_ALL_SOC-1).
sujet_du_ticket() {
  local c
  c=$(carte)
  awk -F '\t' -v t="$1" -v s="${1%.*}" '$1 == t { print $2; trouve = 1; exit } $1 == s { spec = $2 }
    END { if (!trouve && spec != "") print spec }' <<<"$c"
}

# Fichier d'un ticket (SPEC_ALL_SOC-1.02) ou d'une spec (SPEC_ALL_SOC-1, `.spec.md` ou `.map.md`) sur une
# référence ; vide s'il n'y est pas.
fichier_sur() {
  local motif
  if [[ "$2" =~ ^(.+)\.([0-9]{2})$ ]]; then motif="/${BASH_REMATCH[1]}-[^/]*\.${BASH_REMATCH[2]}\.issue\.md\$"
  else motif="/$2-[^/]*\.(spec|map)\.md\$"; fi
  git ls-tree -r --name-only "$1" -- docs 2>/dev/null | grep -E -m1 "$motif" || true
}

# Tickets bloquants lus sur la ligne `Blocked by:` d'un ticket, un par ligne, en identifiant complet
# (`05` devient SPEC_ALL_SOC-1.05) ; « ? <ligne> » quand la ligne ne cite aucun ticket. `—`, `aucun` :
# rien. Les parenthèses sont des commentaires (« SPEC_ALL_SOC-1.01 conseillé avant ») : ignorées.
bloquants() {
  local ref=$1 fichier=$2 id=$3 ligne ids
  ligne=$(git show "$ref:$fichier" | grep -m1 -E '^(- )?\**Blocked by ?:' |
    sed -E 's/^(- )?\**Blocked by ?:\** *//') || true
  [ -n "$ligne" ] || return 0
  [[ "$ligne" =~ ^(—|-|aucun|none|néant) ]] && return 0
  ligne=$(sed -E 's/\([^)]*\)//g; s/`//g' <<<"$ligne")
  ids=$(
    identifiant tickets <<<"$ligne"
    tr -s ' ,;' '\n' <<<"$ligne" | grep -E '^[0-9]{2}$' | sed "s/^/${id%.*}./" || true
  )
  if [ -n "$ids" ]; then printf '%s\n' "$ids"; else printf '? %s\n' "$ligne"; fi
}

fait_sur() { git show "$1:$2" | grep -m1 -E '^(- )?\**Status\**\s*:' | grep -qiE ':\** *(resolved|fait|done)'; }

# Garde-fous de `demarrer` (cas vécus) : la spec et le ticket doivent être sur la base
# (une branche partie d'une branche de specs non fusionnée tombe en conflit au squash des specs),
# et chaque `Blocked by:` y être fait (jamais de fusion locale d'une dépendance non fusionnée).
verifier_ticket() {
  local id=$1 ref=$2 base=${2#origin/} spec fichier b fb manquants='' illisibles=''
  spec=$(fichier_sur "$ref" "${id%.*}")
  [ -n "$spec" ] || sortir 4 "la spec ${id%.*} n'est pas encore sur $base : sa PR de specs n'est pas fusionnée.
Ne pas partir de la branche de specs. La faire fusionner dans $base d'abord (\`sujet.sh ouvrir <nom> --specs <pr>\`
la recible sur le sujet), ou \`sujet.sh rafraichir ${base#sujet/}\` si elle est déjà dans develop."
  [[ "$id" == *.* ]] || return 0
  fichier=$(fichier_sur "$ref" "$id")
  [ -n "$fichier" ] || sortir 4 "le ticket $id n'est pas sur $base : attendre la fusion de la PR qui l'ajoute."
  while IFS= read -r b; do
    [ -n "$b" ] || continue
    case "$b" in '? '*) illisibles="${b#? }"; continue ;; esac
    fb=$(fichier_sur "$ref" "$b")
    if [ -z "$fb" ] || ! fait_sur "$ref" "$fb"; then manquants="$manquants $b"; fi
  done < <(bloquants "$ref" "$fichier" "$id")
  [ -z "$illisibles" ] || echo "! Blocked by: « $illisibles » ne cite aucun ticket : le vérifier à la main."
  [ -z "$manquants" ] || sortir 4 "$id est bloqué par$manquants, pas encore fait sur $base (ligne Status:).
Attendre que leur PR y soit fusionnée, puis relancer demarrer. Ne pas fusionner leur branche dans la sienne."
}

# Sujet livré : sa carte (`docs/**/*.map.md` dont la ligne `Sujet:` le nomme), lue sur
# origin/develop, porte `Phase: 6-nettoyage` ou `Phase: fini` ; à défaut de carte, la branche
# `sujet/<nom>` est absente et develop contient son commit de merge : la ligne `Sujet: sujet/<nom>`
# que passer.sh écrit dans le corps, ou le message par défaut d'une fusion faite sur GitHub
# (« Merge pull request #n from <owner>/sujet/<nom> »). Ligne entière : `sujet/demo` ne reconnaît
# pas `sujet/demo-2`. Un sujet livré ne se rouvre jamais par automatisme : file.sh, regrouper et
# demarrer s'en remettent à cette seule fonction. Sortie 0 = livré.
sujet_livre() {
  local nom=${1#sujet/} f trouve='' phase
  git fetch -q origin develop 2>/dev/null || true
  while IFS= read -r f; do
    git show "origin/develop:$f" | grep -qE "^(- )?\**Sujet ?:\** *sujet/${nom}[[:space:]]*\$" || continue
    trouve=1
    phase=$(git show "origin/develop:$f" | grep -m1 -E '^Phase ?:' | sed -E 's/^Phase ?: *//; s/[[:space:]]*$//') || true
    case "$phase" in 6-nettoyage* | fini*) return 0 ;; esac
  done < <(git ls-tree -r --name-only origin/develop -- docs | grep -E '\.map\.md$' | grep -v '/gabarits/' || true)
  [ -z "$trouve" ] || return 1
  git ls-remote --exit-code --heads origin "sujet/$nom" >/dev/null 2>&1 && return 1
  [ -n "$(git log origin/develop --merges -1 --format=%H -E \
    --grep "^Sujet: sujet/${nom}\$" --grep "^Merge pull request #[0-9]+ from [^ ]+/sujet/${nom}\$")" ]
}

# Phase de la carte du sujet (vide si le sujet n'a pas de carte). Lue d'abord sur la branche du
# sujet, où la carte vit et avance jusqu'à la livraison (la PR de cadrage vise le sujet, les mises à
# jour de phase y sont poussées), puis sur origin/develop. Cas vécu : lue sur develop seul, la carte
# d'un sujet jamais livré était introuvable et sa livraison intermédiaire partait de sujet/<nom>.
phase_carte() {
  local nom=${1#sujet/} ref f phase=''
  for ref in "origin/sujet/$nom" origin/develop; do
    git rev-parse -q --verify "$ref" >/dev/null || continue
    while IFS= read -r f; do
      git show "$ref:$f" | grep -qE "^(- )?\**Sujet ?:\** *sujet/${nom}[[:space:]]*\$" || continue
      phase=$(git show "$ref:$f" | grep -m1 -E '^Phase ?:' | sed -E 's/^Phase ?: *//; s/[[:space:]]*$//') || true
      break
    done < <(git ls-tree -r --name-only "$ref" -- docs | grep -E '\.map\.md$' | grep -v '/gabarits/' || true)
    [ -z "$phase" ] || break
  done
  printf '%s\n' "$phase"
}

demarrer() {
  local arg=${1:?identifiant de ticket (SPEC_ALL_SOC-1.02) ou nom de sujet}
  local nom branche courante ticket='' ref present=''
  if ticket=$(identifiant lire "$arg"); then
    arg=$ticket
    nom=$(sujet_du_ticket "$arg")
    if [ -z "$nom" ]; then
      # Ni sur develop ni sur un sujet : sa spec n'est pas fusionnée, ce n'est pas « sans sujet ».
      for ref in origin/develop $(branches_sujet); do
        [ -z "$(fichier_sur "$ref" "${arg%.*}")" ] || present=1
      done
      [ -n "$present" ] || sortir 4 "la spec ${arg%.*} n'est ni sur develop ni sur un sujet : sa PR de specs n'est pas fusionnée.
Ne pas partir de la branche de specs : attendre sa fusion (ou \`sujet.sh ouvrir <nom> --specs <pr>\`), puis relancer."
      verifier_ticket "$arg" origin/develop
      echo "base=develop"
      echo "$arg ne déclare pas de sujet (ligne « Sujet: sujet/<nom> » du ticket ou de sa spec) : la PR vise develop."
      echo "S'il fait partie d'un lot de plusieurs PR liées, déclarer le sujet dans la spec d'abord."
      return 0
    fi
  else
    nom=${arg#sujet/}
  fi
  [[ "$nom" =~ ^[a-z0-9][a-z0-9-]*$ ]] || sortir 4 "nom de sujet en kebab-case attendu : $nom"
  branche="sujet/$nom"
  if sujet_livre "$nom"; then
    [ -n "$ticket" ] || sortir 4 "$branche est livré dans develop : on ne le rouvre pas. Partir de develop."
    verifier_ticket "$ticket" origin/develop
    echo "base=develop"
    echo "$branche est déjà livré dans develop : $ticket part de develop et la PR vise develop (label hors-sujet)."
    return 0
  fi
  # `git ls-remote` plutôt que `gh api` : marche aussi sans `gh` authentifié (session cloud).
  git ls-remote --exit-code --heads origin "$branche" >/dev/null 2>&1 || ouvrir "$nom"
  git fetch -q origin develop "$branche"
  [ -z "$ticket" ] || verifier_ticket "$ticket" "origin/$branche"
  courante=$(git rev-parse --abbrev-ref HEAD)
  [ "$courante" != HEAD ] || sortir 4 "HEAD détachée : se placer sur la branche de travail d'abord"
  [[ "$courante" != sujet/* && "$courante" != develop && "$courante" != main ]] ||
    sortir 4 "on ne travaille pas sur $courante : se placer sur une branche de travail"
  # Déjà partie du sujet, même d'un sommet antérieur : elle n'apporte aucun commit de develop
  # absent du sujet (son point de départ sur develop est contenu dans son départ du sujet).
  if git merge-base --is-ancestor "$(git merge-base HEAD origin/develop)" "$(git merge-base HEAD "origin/$branche")"; then
    :
  elif [ -z "$(git rev-list -1 origin/develop..HEAD)" ] || git merge-base --is-ancestor HEAD "origin/$branche"; then
    # Aucun commit propre : la branche repart du sujet (les modifications non commitées suivent).
    git switch -q -C "$courante" "origin/$branche"
  else
    echo "$courante porte déjà des commits partis de develop. Pour la placer sur le sujet (branche à soi) :"
    echo "  git rebase --onto origin/$branche origin/develop && git push --force-with-lease"
    sortir 4 "puis relancer demarrer"
  fi
  echo "base=$branche"
  echo "$courante part de $branche ($(git rev-parse --short "origin/$branche")) : la PR vise $branche,"
  echo "label à-fusionner dès le push ; le capitaine la fusionne dans le sujet quand sa CI est verte."
}

ouvrir() {
  local nom=${1:?nom du sujet} specs=''
  [ "${2:-}" != --specs ] || specs=${3:?numéro de la PR de specs}
  nom=${nom#sujet/}
  [[ "$nom" =~ ^[a-z0-9][a-z0-9-]*$ ]] || sortir 4 "nom en kebab-case attendu : $nom"
  local branche="sujet/$nom"
  if git ls-remote --exit-code --heads origin "$branche" >/dev/null 2>&1; then
    [ -n "$specs" ] || sortir 4 "$branche existe déjà"
    recibler_specs "${specs#\#}" "$branche"
    return 0
  fi
  # Création par `git push` : le proxy des sessions cloud refuse `POST git/refs` (403).
  git fetch -q origin develop
  git push -q --no-verify origin "origin/develop:refs/heads/$branche"
  # Pas de protection de branche : le push forcé est refusé aux sessions par
  # scripts/agent/garde-commandes.mjs, ce script ne force jamais, et GitHub ne supprime la branche
  # qu'à la fusion de la PR finale. Le filet est cette PR vers develop (CI complète).
  echo "$branche ouverte sur develop ($(git rev-parse --short origin/develop))"
  [ -z "$specs" ] || recibler_specs "${specs#\#}" "$branche"
}

# La PR de specs d'un lot vise son sujet dès l'ouverture : ses tickets partent du sujet une fois
# les specs fusionnées dedans, jamais de la branche de specs.
recibler_specs() {
  if gh api -X PATCH "$DEPOT/pulls/$1" -f base="$2" >/dev/null 2>&1; then
    echo "PR de specs #$1 reciblée sur $2 : les tickets partent de $2 une fois les specs fusionnées dedans"
  else
    echo "PR de specs #$1 NON reciblée (gh indisponible ou refusé) : la recibler par l'outil GitHub MCP"
    echo "  update_pull_request(pullNumber: $1, base: \"$2\")"
  fi
}

# Sous-PR en conflit avec son sujet sur des index générés seuls (deux sous-PR qui régénèrent le même
# `openapi.json`, cas vécu) : un index ne se fusionne jamais à la main, le capitaine met la branche à
# jour (merge, avance rapide, jamais de force : la branche appartient à une autre session), régénère,
# pousse, et sort en 8 ; la CI repart, la sous-PR repasse au tour suivant. Sans conflit : rien n'est
# touché. Conflit hors index : annulé, sortie 3 (renvoi), branche intacte.
mettre_a_jour_sous_pr() {
  local n=$1 base=$2 tete=$3 conflits autres
  [ -z "$(git status --porcelain)" ] || sortir 6 "arbre de travail pas propre : committer ou ranger d'abord, puis relancer (rien à corriger côté PR)"
  git switch -q -C "capitaine/$n" "origin/$tete"
  if git merge -q --no-edit "origin/$base" >/dev/null 2>&1; then
    git switch -q --detach origin/develop # fusion propre : rien à pousser, le squash suit
    return 0
  fi
  conflits=$(git diff --name-only --diff-filter=U)
  autres=$(printf '%s\n' "$conflits" | grep -Ev "$GENERES" || true)
  if [ -n "$autres" ] || [ -z "$conflits" ]; then
    git merge --abort 2>/dev/null || git reset -q --hard
    git switch -q --detach origin/develop
    sortir 3 "fusion refusée par GitHub (conflit avec $base hors index générés : $(tr '\n' ' ' <<<"$autres")) : renvoi"
  fi
  # shellcheck disable=SC2086
  git checkout --theirs -- $conflits && git add -- $conflits
  local echec
  echec() {
    git merge --abort 2>/dev/null || git reset -q --hard
    git switch -q --detach origin/develop
    sortir 3 "$1 : mise à jour de #$n avec $base annulée"
  }
  pnpm install --frozen-lockfile --prefer-offline >/dev/null 2>&1 || echec "pnpm install en échec"
  regenerer_index || echec "gate des index/registres en échec"
  git commit -q --no-edit --no-verify
  if ! git push -q --no-verify origin "HEAD:refs/heads/$tete" >/dev/null 2>&1; then
    git switch -q --detach origin/develop
    sortir 5 "la sous-PR #$n a bougé : mise à jour non poussée, la boucle la reprendra"
  fi
  git switch -q --detach origin/develop
  sortir 8 "#$n mise à jour avec $base (index régénérés), CI relancée"
}

fusionner() {
  local n=${1:?numéro de la sous-PR}
  local pr base titre sommet longueur
  pr=$(pr_json "$n")
  [ "$(jq -r .state <<<"$pr")" = open ] || sortir 7 "#$n n'est pas ouverte"
  [ "$(jq -r .draft <<<"$pr")" = false ] || sortir 7 "#$n est en brouillon"
  base=$(jq -r .base.ref <<<"$pr")
  [[ "$base" == sujet/* ]] || sortir 4 "#$n vise $base, pas une branche sujet/ : elle passe par le capitaine"
  titre=$(jq -r .title <<<"$pr")
  sommet=$(jq -r .head.sha <<<"$pr")
  longueur=$(node -e 'console.log([...process.argv[1]].length)' "$titre (#$n)")
  [ "$longueur" -le 120 ] || sortir 4 "sujet du squash à $longueur caractères (> 120) : raccourcir le titre"
  # Le commit entre tel quel dans develop à la livraison : commitlint dès maintenant.
  printf '%s\n' "$titre (#$n)" | pnpm exec commitlint >/dev/null 2>&1 ||
    sortir 4 "titre refusé par commitlint (Conventional Commits) : $titre"
  # Revue adversariale (ADR « chaîne de production »), comme au passage vers develop : la livraison
  # du sujet en est dispensée, c'est donc ici qu'on l'exige.
  local revue motif
  revue="$ici/revue-exigee.mjs"
  [ -f "$revue" ] || revue="$ici/../../fusionner/scripts/revue-exigee.mjs"
  git fetch -q origin "$base" "$(jq -r .head.ref <<<"$pr")"
  motif=$(git diff --name-only "$(git merge-base "$sommet" "origin/$base")" "$sommet" |
    node "$revue" "$(jq -r '.body // ""' <<<"$pr")" "$titre") || sortir 4 "#$n $motif"

  # Checks exigés sur develop, lus sur le sommet de la sous-PR. Les E2E y sont sautés
  # (branche de sujet), donc comptés réussis : ils tournent sur la PR finale.
  local requis etats rouges='' attente=0 nom c
  requis=$(checks_exiges | jq -r '.[]')
  etats=$(checks_commit "$sommet")
  while IFS= read -r nom; do
    c=$(printf '%s\n' "$etats" | awk -F '\t' -v n="$nom" '$1 == n { c = $2 } END { print c }')
    case "$c" in
      SUCCESS | SKIPPED | NEUTRAL) ;;
      FAILURE | CANCELLED | TIMED_OUT | ACTION_REQUIRED | STARTUP_FAILURE | ERROR) rouges="$rouges $nom ;" ;;
      *) attente=1 ;;
    esac
  done <<<"$requis"
  [ -z "$rouges" ] || sortir 3 "checks rouges sur #$n :$rouges"
  [ "$attente" = 0 ] || sortir 3 "checks encore en cours sur #$n : attendre leur fin"

  git fetch -q origin develop "$base" "$(jq -r .head.ref <<<"$pr")"
  # La sous-PR contient du develop plus récent que son sujet (capitaine passé dessus, branche
  # repartie du sommet de develop) : le squash l'embarquerait. Le sujet est d'abord rafraîchi.
  if ! git merge-base --is-ancestor "$(git merge-base "$sommet" origin/develop)" "origin/$base"; then
    rafraichir "${base#sujet/}" --abandon-si-conflit
    git fetch -q origin "$base"
  fi
  mettre_a_jour_sous_pr "$n" "$base" "$(jq -r .head.ref <<<"$pr")"
  git log --no-merges --reverse --format='%B' "$(git merge-base "$sommet" "origin/$base")..$sommet" |
    jq -Rs --arg sha "$sommet" --arg titre "$titre (#$n)" \
      '{merge_method: "squash", sha: $sha, commit_title: $titre, commit_message: .}' |
    gh api -X PUT "$DEPOT/pulls/$n/merge" --input - >/dev/null ||
    sortir 3 "fusion refusée par GitHub (sommet bougé, conflit avec $base ?)"
  echo "#$n fusionnée dans $base"
}

rafraichir() {
  local nom=${1:?nom du sujet} abandon=${2:-}
  local branche="sujet/$nom"
  [ -z "$(git status --porcelain)" ] || sortir 6 "arbre de travail pas propre : committer ou ranger d'abord, puis relancer"
  git fetch -q origin develop "$branche"
  if git merge-base --is-ancestor origin/develop "origin/$branche"; then
    echo "$branche déjà à jour avec develop"
    return 0
  fi
  git switch -q -C "$branche" "origin/$branche"
  if ! git merge -q --no-edit origin/develop >/dev/null 2>&1; then
    local conflits autres
    conflits=$(git diff --name-only --diff-filter=U)
    autres=$(printf '%s\n' "$conflits" | grep -Ev "$GENERES" || true)
    if [ -n "$autres" ] && [ "$abandon" = --abandon-si-conflit ]; then
      git merge --abort
      echo "conflit avec develop sur $branche, fusion annulée :"
      printf '  %s\n' $autres
      exit 2
    elif [ -n "$autres" ]; then
      echo "conflit avec develop, à résoudre sur $branche (merge en cours) :"
      printf '  %s\n' $autres
      exit 2
    fi
    # Index générés : la régénération fait foi.
    git checkout --theirs -- $conflits && git add -- $conflits
  fi
  # Un échec ici (dépendances, gate des ADR ou des registres : numéro d'ADR réutilisé…) ne doit pas
  # laisser la fusion en cours : le worktree du capitaine resterait sale pour tout le tour.
  abandonner() {
    git merge --abort 2>/dev/null || git reset -q --hard
    sortir 3 "$1 : fusion de develop dans $branche annulée, à corriger par une session sur le sujet"
  }
  pnpm install --frozen-lockfile --prefer-offline >/dev/null 2>&1 || abandonner "pnpm install en échec"
  regenerer_index || abandonner "gate des index/registres en échec"
  if git rev-parse -q --verify MERGE_HEAD >/dev/null; then
    git commit -q --no-edit --no-verify
  elif ! git diff --cached --quiet; then
    git commit -q -m 'docs: régénère les index après mise à jour avec develop'
  fi
  # Sans hook, comme passer.sh : le pre-push lance les tests sur base (absente d'une session
  # cloud). Le commit ne contient que develop et le sujet, déjà vérifiés ; la PR finale rejoue tout.
  git push -q --no-verify origin "HEAD:refs/heads/$branche"
  echo "$branche à jour avec develop ($(git rev-parse --short HEAD))"
}

livrer() {
  local nom=${1:?nom du sujet} titre=${2:?titre de la PR finale (Conventional Commits)}
  local branche="sujet/$nom" corps n tete phase intermediaire=''
  git fetch -q origin develop "$branche"
  # Livraison intermédiaire : carte en phase d'avant `5-livraison`. La PR part d'une
  # branche jetable, que GitHub supprime à la fusion : la branche du sujet survit.
  phase=$(phase_carte "$nom")
  case "$phase" in '' | 5-livraison* | 6-nettoyage* | fini*) ;; *) intermediaire=1 ;; esac
  tete=$branche
  [ "$(gh api "$DEPOT/pulls?state=open&base=$(uri "$branche")" --jq length)" = 0 ] ||
    sortir 4 "des sous-PR visent encore $branche : les fusionner ou les fermer avant de livrer"
  # Ordre des migrations : seul l'ordre d'arrivée dans develop compte (migrations-ordre.mjs).
  ordre="$ici/migrations-ordre.mjs"
  [ -f "$ordre" ] || ordre="$ici/../../fusionner/scripts/migrations-ordre.mjs"
  motif=$(node "$ordre" origin/develop "origin/$branche") || sortir 4 "$motif"
  corps=$(
    printf 'Branche de sujet : entre dans develop par un commit de merge, un commit par sous-PR.\n\n## Sous-PR\n\n'
    git log --first-parent --no-merges --reverse --format='- %s' "origin/develop..origin/$branche"
    if [ -n "$intermediaire" ]; then
      printf '\nLivraison intermédiaire : la PR part d'\''une branche jetable, `%s` survit à la fusion.\n' "$branche"
    fi
  )
  if [ -n "$intermediaire" ]; then
    tete="livraison/$nom-$(date -u +%Y%m%d-%H%M)"
    git push -q --no-verify origin "origin/$branche:refs/heads/$tete"
  fi
  n=$(gh api -X POST "$DEPOT/pulls" -f base=develop -f head="$tete" -f title="$titre" -f body="$corps" --jq .number)
  poser_label "$n" à-fusionner
  echo "PR #$n ouverte ($tete → develop), étiquetée à-fusionner"
}

relancer() {
  local n=${1:?numéro de la sous-PR} pr base tete
  pr=$(pr_json "$n")
  base=$(jq -r .base.ref <<<"$pr")
  tete=$(jq -r .head.ref <<<"$pr")
  [[ "$base" == sujet/* ]] || sortir 4 "#$n vise $base, pas un sujet"
  [ -z "$(git status --porcelain)" ] || sortir 6 "arbre de travail pas propre : committer ou ranger d'abord, puis relancer (rien à corriger côté PR)"
  git fetch -q origin "$base" "$tete"
  git switch -q --detach "origin/$tete"
  if ! git merge -q --no-edit "origin/$base" >/dev/null 2>&1; then
    git merge --abort
    sortir 2 "conflit entre #$n et $base"
  fi
  [ "$(git rev-parse HEAD)" != "$(git rev-parse "origin/$tete")" ] ||
    sortir 3 "#$n contient déjà $base : aucun commit à pousser, CI non déclenchable"
  git push -q --no-verify origin "HEAD:refs/heads/$tete"
  echo "#$n : $base fusionné dans sa branche, CI lancée"
}

# Séries de la file : PR ouvertes, non brouillon, qui visent develop ou une autre PR. Clés de
# regroupement : spec du ticket cité (titre ou branche), racine de la pile, et, sans ticket, les
# deux premiers mots de la branche (`chore/ffsb-vivante-stats` → `chore/ffsb-vivante-*`). Une clé qui réunit au moins 2 PR est une
# série. Sortie : « clé<TAB>#n #m …<TAB>prio:haute ? », une par série.
series() {
  gh api --paginate "$DEPOT/pulls?state=open&per_page=100" --jq '.[] | select(.draft | not)
    | select(any(.labels[].name; . == "hors-sujet") | not)
    | [.number, .base.ref, .head.ref, (any(.labels[].name; . == "prio:haute")), .title] | @tsv' |
    identifiant colonne-ticket 5 3 |
    awk -F '\t' '
      $2 ~ /^sujet\// { next }
      { n[NR] = $1; base[$1] = $2; tete[$1] = $3; prio[$1] = $4; ticket[$1] = $6; pr_de[$3] = $1 }
      END {
        for (i in n) {
          p = n[i]
          # racine de la pile
          r = p; while (base[r] != "develop" && (base[r] in pr_de)) r = pr_de[base[r]]
          if (r != p) { cle["pile #" r] = cle["pile #" r] " #" p; vu["pile #" r, r] = 1 }
          # spec du ticket que le titre cite (SPEC_ALL_SOC-1.04) ou que la branche porte (spec-all-soc-1-04)
          if (ticket[p] != "") {
            s = ticket[p]; sub(/\.[0-9][0-9]$/, "", s); cle["spec " s] = cle["spec " s] " #" p
          } else if (match(tete[p], /^[a-z]+\/[a-z0-9]+-[a-z0-9]+-/) && tete[p] !~ /^claude\//) {
            # sans ticket : type/ + deux premiers mots de la branche (chore/ffsb-vivante-*)
            b = substr(tete[p], 1, RLENGTH - 1); cle["branche " b "-*"] = cle["branche " b "-*"] " #" p
          }
          if (prio[p] == "true") haute[p] = 1
        }
        for (k in cle) {
          liste = cle[k]
          if (k ~ /^pile #/) { r = substr(k, 7); liste = " #" r liste }
          m = split(liste, a, " "); if (m < 2) continue
          h = ""; for (j = 1; j <= m; j++) if (substr(a[j], 2) in haute) h = "prio:haute"
          print k "\t" substr(liste, 2) "\t" h
        }
      }' | sort
}

regrouper() {
  local nom=${1:?nom du sujet} n base
  shift
  [ "$#" -gt 0 ] || sortir 4 "au moins une PR à regrouper"
  nom=${nom#sujet/}
  ! sujet_livre "$nom" || sortir 4 "sujet/$nom est livré dans develop : on ne le rouvre pas (la PR passe vers develop, label hors-sujet)."
  gh api "$DEPOT/branches/$(uri "sujet/$nom")" >/dev/null 2>&1 || ouvrir "$nom"
  # Le sujet contient le sommet de develop : toute PR partie de develop s'y fusionne avec ses
  # seuls changements (fusion à trois points sur son départ), sans réécrire sa branche.
  rafraichir "$nom" --abandon-si-conflit
  for n in "$@"; do
    n=${n#\#}
    base=$(gh api "$DEPOT/pulls/$n" --jq .base.ref)
    case "$base" in
      develop)
        gh api -X PATCH "$DEPOT/pulls/$n" -f base="sujet/$nom" >/dev/null
        # Série regroupée : le sujet est fini quand ses PR sont entrées (livraison automatique).
        poser_label "$n" sujet-auto
        commenter "$n" "$(printf 'Regroupée dans \`sujet/%s\` par le capitaine de fusion : elle y sera fusionnée en squash dès que sa CI légère est verte, puis entrera dans develop avec le reste du sujet. Rien à faire côté session ; une suite de ce travail part de \`sujet/%s\`.\n\n---\n_Generated by [Claude Code](https://claude.ai/code)_' "$nom" "$nom")"
        echo "#$n reciblée sur sujet/$nom" ;;
      sujet/*) echo "#$n déjà dans $base" ;;
      *) echo "#$n empilée sur $base : elle suivra sa parente dans le sujet" ;;
    esac
  done
}

# Regroupement automatique (capitaine, à chaque tour) : sans `prio:haute` dans la série,
#   - une série « spec X » rejoint le sujet qui contient déjà une PR de cette spec (titre ou
#     branche), ou ouvre `sujet/<x>` à partir de 3 PR ;
#   - une pile de 2 PR ou plus ouvre `sujet/pile-<racine>` : la racine y entre, les suivantes
#     y sont reciblées quand leur parente y est fusionnée.
# Les séries « branche » (préfixe commun, sans ticket) restent proposées à l'utilisateur.
# Séries à regrouper maintenant, « nom<TAB>clé<TAB>#n #m… », « spec » avant « pile ».
series_a_regrouper() {
  local existants=$1 vers_develop cle prs haute nom spec p mobile
  # Une série dont aucune PR ne vise develop n'a rien à recibler (piles seules) : ignorée.
  vers_develop=" $(gh api --paginate "$DEPOT/pulls?state=open&per_page=100&base=develop" --jq '.[].number' | tr '\n' ' ')"
  while IFS="$(printf '\t')" read -r cle prs haute; do
    [ -n "$cle" ] && [ -z "$haute" ] || continue
    set -- $prs
    mobile=''
    for p in "$@"; do case "$vers_develop" in *" ${p#\#} "*) mobile=1 ;; esac; done
    [ -n "$mobile" ] || continue
    nom=''
    case "$cle" in
      'spec '*)
        spec=${cle#spec }
        nom=$(awk -F '\t' -v s="$spec" '$1 == s { sub(/^sujet\//, "", $2); print $2; exit }' <<<"$existants")
        if [ -z "$nom" ] && [ "$#" -ge 3 ]; then nom=$(identifiant slug "$spec"); fi ;;
      'pile #'*) [ "$#" -lt 2 ] || nom="pile-${cle#pile #}" ;;
    esac
    [ -z "$nom" ] || printf '%s\t%s\t%s\n' "$nom" "$cle" "$prs"
  done < <(series | sort -t "$(printf '\t')" -k1,1r) # « spec » avant « pile » avant « branche »
}

regrouper_series() {
  local essai=${1:-} tour existants choix nom cle prs
  # Sujets déjà nourris d'une spec : PR (ouvertes ou fermées) qui visent un sujet, par spec citée.
  existants=$(gh api "$DEPOT/pulls?state=all&sort=updated&direction=desc&per_page=100" --jq '.[]
      | select(.base.ref | startswith("sujet/")) | [.base.ref, .title, .head.ref] | @tsv' |
    identifiant colonne-ticket 2 3 |
    awk -F '\t' '$4 != "" { s = $4; sub(/\.[0-9][0-9]$/, "", s); if (!(s in v)) { v[s] = 1; print s "\t" $1 } }')
  if [ "$essai" = --dry-run ]; then
    while IFS="$(printf '\t')" read -r nom cle prs; do
      [ -z "$nom" ] || echo "série « $cle » → sujet/$nom : $prs (--dry-run : rien n'est reciblé)"
    done <<<"$(series_a_regrouper "$existants")"
    return 0
  fi
  # Une série à la fois : chaque regroupement change les bases, la suivante est relue après.
  for tour in 1 2 3 4 5 6 7 8 9 10; do
    # Pas de `head -1` : sous pipefail, la fonction tuée par SIGPIPE ferait sortir en 141.
    choix=$(series_a_regrouper "$existants")
    choix=${choix%%$'\n'*}
    [ -n "$choix" ] || return 0
    IFS="$(printf '\t')" read -r nom cle prs <<<"$choix"
    echo "série « $cle » → sujet/$nom : $prs"
    # shellcheck disable=SC2086
    regrouper "$nom" ${prs//#/}
  done
}

# Tableau des sujets ouverts. Verdict :
#   livré #n          sa PR vers develop est ouverte : le capitaine la passe
#   prêt à livrer     aucune sous-PR ouverte et tous ses tickets faits (Status resolved/Fait/done)
#   en cours          sinon ; « VIEUX » au-delà de 5 jours sans livraison, « EN RETARD » au-delà
#                     de 20 commits de develop non fusionnés
etat() {
  local c prs b nom avance retard sous livree tickets restants age vieux debut fermees spec
  c=$(carte)
  prs=$(gh api --paginate "$DEPOT/pulls?state=open&per_page=100" --jq '.[] | "\(.base.ref)\t\(.head.ref)\t\(.number)"')
  printf 'sujet\tavance\tretard\tsous-PR\ttickets restants\tverdict\n'
  for b in $(branches_sujet); do
    nom=${b#origin/sujet/}
    avance=$(git rev-list --count --first-parent --no-merges "origin/develop..$b")
    [ "$avance" -gt 0 ] || [ -n "$(awk -F '\t' -v b="sujet/$nom" '$1 == b' <<<"$prs")" ] || continue
    retard=$(git rev-list --count "$b..origin/develop")
    # Sous-PR : celles qui visent le sujet, et les piles posées sur une sous-PR déjà fusionnée
    # dedans (elles y seront reciblées) — sans elles, le sujet se croirait fini trop tôt.
    fermees=$(gh api --paginate "$DEPOT/pulls?state=closed&per_page=100&base=$(uri "sujet/$nom")" --jq '.[].head.ref')
    sous=$(awk -F '\t' -v b="sujet/$nom" -v f="$fermees" 'BEGIN { n = split(f, t, "\n"); for (i = 1; i <= n; i++) h[t[i]] = 1 }
      $1 == b || ($1 in h) { printf "#%s ", $3 }' <<<"$prs")
    # Livraison ouverte : depuis le sujet, ou depuis sa branche jetable `livraison/<nom>-<date>`.
    # Sans la seconde, une livraison intermédiaire bloquée était rouverte à chaque tour.
    livree=$(awk -F '\t' -v b="sujet/$nom" -v l="^livraison/$nom-[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]\$" \
      '$1 == "develop" && ($2 == b || $2 ~ l) { print $3 }' <<<"$prs")
    # Tickets du sujet : ceux qui le déclarent, et tous ceux d'une spec qui le déclare.
    # `sort -u` sur l'ensemble : un ticket qui déclare le sujet ET appartient à une spec qui le
    # déclare sortait deux fois (le pipe ne portait que sur la boucle).
    tickets=$(
      {
        awk -F '\t' -v s="$nom" '$2 == s && $1 ~ /\.[0-9][0-9]$/ { print $1 }' <<<"$c"
        for spec in $(awk -F '\t' -v s="$nom" '$2 == s && $1 !~ /\.[0-9][0-9]$/ { print $1 }' <<<"$c"); do
          git ls-tree -r --name-only "$b" -- docs |
            { grep -v '/issues/archive/' || true; } |
            sed -nE "s#^.*/(${spec})-[^/]*\.([0-9]{2})\.issue\.md\$#\1.\2#p"
        done
      } | sort -u
    )
    restants=''
    for t in $tickets; do
      git grep -h -m1 -E '^Status ?:' "$b" -- "docs/*/${t%.*}-*.${t##*.}.issue.md" 2>/dev/null |
        grep -qiE 'resolved|fait|done|wontfix' || restants="$restants$t "
    done
    # Âge depuis le premier commit propre ; un sujet sans commit (sous-PR pas encore fusionnées) a 0 jour.
    debut=$(git log --first-parent --format=%ct "origin/develop..$b" | tail -1)
    age=$(( ( $(date +%s) - ${debut:-$(date +%s)} ) / 86400 ))
    vieux=''
    [ "$age" -le 5 ] || vieux=' VIEUX'
    [ "$retard" -le 20 ] || vieux="$vieux EN RETARD"
    if [ -n "$livree" ]; then v="livré #$livree"
    elif [ -z "$sous" ] && [ -z "$restants" ] && [ "$avance" -gt 0 ]; then v="prêt à livrer$vieux"
    else v="en cours$vieux"; fi
    printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$nom" "$avance" "$retard" "${sous:-—}" "${restants:-—}" "$v"
  done
}

# Livraison automatique (capitaine) : chaque sujet « prêt à livrer » est livré s'il déclare ses
# tickets (tous faits) ou s'il est né d'un regroupement (label `sujet-auto` sur ses sous-PR),
# sauf si une de ses sous-PR, ouverte ou fusionnée, porte le label `sujet-manuel`. Titre : le type le plus fort
# des sous-PR (feat > fix > autre) et leur scope le plus fréquent.
livrer_prets() {
  local essai=${1:-} nom verdict sujets titre type scope n labels carte_sujets
  sujets=$(etat | tail -n +2 | awk -F '\t' '$6 ~ /^prêt à livrer/ { print $1 }')
  carte_sujets=$(carte)
  for nom in $sujets; do
    labels=$(gh api --paginate "$DEPOT/pulls?state=all&per_page=100&base=$(uri "sujet/$nom")" --jq '.[].labels[].name' | sort -u)
    if grep -qx sujet-manuel <<<"$labels"; then
      echo "sujet/$nom prêt, mais label sujet-manuel : livraison laissée à la main"
      continue
    fi
    # « Plus de sous-PR ouverte » ne dit pas qu'un lot est fini : un ticket pas encore commencé
    # n'a pas de PR. Livraison automatique seulement si le sujet déclare ses tickets (`Sujet:`,
    # tous faits, vérifié par etat) ou s'il est né d'un regroupement (`sujet-auto`).
    if [ -z "$(awk -F '\t' -v s="$nom" '$2 == s' <<<"$carte_sujets")" ] && ! grep -qx sujet-auto <<<"$labels"; then
      echo "sujet/$nom sans sous-PR ouverte, mais ni tickets déclarés ni sujet-auto : livraison laissée à la main"
      continue
    fi
    n=$(git rev-list --count --first-parent --no-merges "origin/develop..origin/sujet/$nom")
    read -r type scope <<<"$(git log --first-parent --no-merges --format=%s "origin/develop..origin/sujet/$nom" |
      sed -nE 's/^([a-z]+)(\(([^)]+)\))?!?: .*/\1 \3/p' |
      awk '{ t[$1]++; if ($2 != "") s[$2]++ }
        END { ty = ("feat" in t) ? "feat" : ("fix" in t) ? "fix" : "chore"
              for (k in s) if (s[k] > m) { m = s[k]; sc = k }
              print ty, sc }')"
    titre="${type:-chore}${scope:+($scope)}: sujet/$nom — $n sous-PR"
    if [ "$essai" = --dry-run ]; then
      echo "sujet/$nom prêt : livrerait « $titre » (--dry-run : aucune PR ouverte)"
    else
      livrer "$nom" "$titre"
    fi
  done
}

# `carte <nom>` : voir l'en-tête. Le seul geste d'écriture d'une session sur un sujet.
# Vrai si la carte `<rev>:<chemin>` déclare, en première ligne `Sujet:` de son en-tête (avant le
# premier `## `), exactement `sujet/<nom>` : la lecture de `sujet_livre` et `phase_carte`. awk lit
# tout le flux (pas de sortie anticipée) : sous pipefail, un SIGPIPE de git ferait un faux refus.
carte_cite_le_sujet() {
  git cat-file blob "$1" 2>/dev/null | awk -v s="sujet/$2" '
    fini { next }
    /^## / { fini = 1; next }
    /^(- )?\**Sujet ?:/ { l = $0; sub(/^(- )?\**Sujet ?:\** */, "", l); sub(/[[:space:]]+$/, "", l); ok = (l == s); fini = 1 }
    END { exit !ok }'
}

carte_sujet() {
  local nom=${1-} branche tete c f meta lignes n i=0 avant tmp
  shift || true
  refuser() { echo "REFUS : $1"; exit 9; }
  [ $# -eq 0 ] || refuser "carte ne prend que le nom du sujet ($*) : jamais de push forcé, jamais d'option"
  [[ "$nom" =~ ^[a-z0-9][a-z0-9-]*$ ]] || refuser "nom de sujet illisible : « $nom »"
  branche="sujet/$nom"
  git fetch -q origin "+refs/heads/$branche:refs/remotes/origin/$branche" 2>/dev/null || refuser "origin/$branche introuvable"
  if ! git merge-base --is-ancestor "origin/$branche" HEAD; then
    git merge --ff-only -q "origin/$branche" >/dev/null 2>&1 ||
      refuser "la branche diverge de origin/$branche (git merge --ff-only impossible) : repartir de origin/$branche et rejouer le commit de carte"
  fi
  # Le sommet vérifié est celui qui part : HEAD ne se relit pas entre la vérification et le push.
  tete=$(git rev-parse HEAD)
  mapfile -t avant < <(git rev-list --reverse "origin/$branche..$tete")
  [ "${#avant[@]}" -gt 0 ] || { echo "rien à pousser : la branche n'a aucun commit absent de origin/$branche"; return 0; }
  tmp=$(mktemp -d)
  for c in "${avant[@]}"; do
    n=$(git rev-list --parents -n1 "$c" | wc -w)
    [ "$n" -eq 2 ] || refuser "$c est un commit de fusion ou racine : seules les mises à jour de carte, une par commit, passent par ici"
    # Sortie brute, sans détection de renommage : `:<mode> <mode> <sha> <sha> <statut>\t<chemin>`.
    mapfile -t lignes < <(git diff-tree -r --no-commit-id --no-renames "$c")
    [ "${#lignes[@]}" -eq 1 ] && [[ "${lignes[0]#*$'\t'}" =~ ^docs/.+\.map\.md$ ]] ||
      refuser "$c touche autre chose qu'un seul fichier docs/**/*.map.md (${lignes[*]#*$'\t'}) : le reste passe par une PR"
    meta=${lignes[0]%%$'\t'*}
    f=${lignes[0]#*$'\t'}
    [[ "$meta" =~ ^:100644\ 100644\ [0-9a-f]+\ [0-9a-f]+\ M$ ]] ||
      refuser "$c ne modifie pas $f en place (création, suppression, renommage ou changement de mode) : passe par une PR"
    carte_cite_le_sujet "$c^:$f" "$nom" ||
      refuser "$f ne déclarait pas Sujet: $branche avant $c : la carte d'un autre sujet ne se pousse pas ici"
    carte_cite_le_sujet "$c:$f" "$nom" ||
      refuser "$f ne déclare plus exactement Sujet: $branche dans son en-tête au commit $c"
    git cat-file blob "$c:$f" >"$tmp/avant"
    pnpm exec prettier --stdin-filepath "$f" <"$tmp/avant" >"$tmp/apres" 2>/dev/null || true
    cmp -s "$tmp/avant" "$tmp/apres" || {
      rm -rf "$tmp"
      refuser "$f n'est pas formaté par Prettier au commit $c : pnpm exec prettier --write $f, puis corriger le commit"
    }
    i=$((i + 1))
  done
  rm -rf "$tmp"
  git push -q origin "$tete:refs/heads/$branche" || refuser "le push sur $branche a échoué (jamais de force : relancer après un fetch)"
  echo "carte poussée : $i commit(s) sur $branche"
}

commande=${1:-}
shift || true
if [ "$commande" = carte ] && [ $# -gt 0 ]; then carte_sujet "$@"; exit; fi
case "$commande" in
  demarrer | ouvrir | fusionner | rafraichir | livrer | relancer | series | regrouper | carte | etat) "$commande" "$@" ;;
  de) sujet_du_ticket "${1:?ticket}" ;;
  livre) sujet_livre "${1:?nom du sujet}" ;;
  livrer-prets) livrer_prets "$@" ;;
  regrouper-series) regrouper_series "$@" ;;
  *) sed -n '3,/^# =====/p' "$0" | sed '$d; s/^# \{0,1\}//'; sortir 4 "usage : sujet.sh demarrer <ticket|nom> | ouvrir <nom> [--specs <pr>] | fusionner <pr> | rafraichir <nom> | livrer <nom> <titre> | livrer-prets [--dry-run] | relancer <pr> | series | regrouper-series [--dry-run] | regrouper <nom> <pr>… | carte | carte <nom> | etat | de <ticket>" ;;
esac
