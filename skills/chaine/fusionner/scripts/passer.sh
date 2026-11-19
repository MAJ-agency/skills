#!/usr/bin/env bash
# =============================================================================
# Fait passer UNE PR de la file vers develop (skill /fusionner).
#
#   1. Éligible : ouverte, label `à-fusionner`, ni `fusion-bloquée` ni brouillon ; section
#      « Revue adversariale » dans la description si le diff touche du code (revue-exigee.mjs) ;
#      base = develop, ou branche d'une PR déjà fusionnée (pile) → reciblée sur develop
#      juste avant le push (un renvoi garde la parente comme base).
#   2. Fusionne origin/develop DANS la branche, jamais de rebase : aucun push forcé
#      sur la branche d'une autre session. Conflits résolus sans jugement : index
#      générés (régénérés) ; fichier d'une pile dont un seul côté a changé la version
#      depuis le départ de la pile (le squash de la parente masque juste l'ascendance :
#      ce côté fait foi, comme un rebase --onto ; cas vécus : #369 sur #354, et #469 après sa
#      sœur #468, toutes deux sur #458). Tout autre conflit → sortie 2.
#   3. Régénère les index générés (`scripts/docs/index-generes.json`) et passe leurs
#      gates avant de pousser (une règle qui cite un test disparu de develop → sortie 3).
#   4. Pousse en avance rapide, sous les hooks du projet (jamais --no-verify) : le pre-push
#      joue `pnpm check` ; la CI exigée le rejoue et la fusion l'attend.
#   5. Attend les checks exigés du nouveau sommet (aucun check au bout de 5 min → sortie 3 ; `attendre_ci`).
#   5 bis. Contrôle d'ascendance, juste avant la fusion : `git fetch` de develop, puis `ascendance` (github.sh).
#      `à-jour` : squash du sommet testé. `retard` ou `conflit-index` (develop a bougé pendant la CI, documentation
#      comprise) : nouveau tour (étapes 2 à 5), deux reprises au plus, puis sortie 5. `conflit` : sortie 2 (renvoi).
#      Illisible : sortie 3. Le capitaine ne s'en remet pas au réglage « strict » de GitHub.
#   6. Squash lié au sommet testé (`sha`) — commit de merge pour une branche sujet/ ou une
#      livraison intermédiaire `livraison/<nom>-<date>`, reconnue aussi après sa mise à jour
#      avec develop (étape 4) : son arbre est celui d'un sommet du sujet fusionné avec develop —,
#      puis vérifie arbre(fusion) = arbre testé (sha de la fusion lu dans la réponse du PUT) ; un écart sort en 12.
#
# Les fusions, commits et push du capitaine passent sous les hooks git du projet, comme ceux d'une
# session. Un refus de hook sort en 3, sa sortie sur stderr : le lire, corriger, jamais --no-verify.
# Les fusions du capitaine portent la mention de `fusionsSansEffet` (contrat d'origin/develop) quand elle
# s'applique (`fusionner_avec`, github.sh ; skill `fusionner`, « Fusion sans effet »).
# Un push refusé se classe par la trace de husky 9 (`pousser`, github.sh) : refus du hook pre-push (la boucle
# renvoie la PR avec la sortie du hook), ou refus du distant (la boucle s'arrête). Toute lecture GitHub qui décide
# passe par `lire_github` : une réponse vide, non JSON ou d'erreur sort en 5, jamais un état. Toute sortie de git ou
# de hook relayée passe par `masquer_url` : une URL à identifiants n'y paraît jamais.
#
# Sorties, et la suite pour le capitaine (boucle.sh en traite la plupart elle-même) :
#   0  fusionnée, arbre du squash = arbre testé → suivante
#   2  conflit avec develop hors index générés → renvoyer (renvoyer.sh)
#   3  hook git (commit-msg, pre-commit) qui refuse la fusion ou un commit : worktree détaché sur origin/develop,
#      sortie du hook sur stderr → la lire, corriger, jamais --no-verify
#   3  « push refusé par le hook pre-push » (trace de husky dans la sortie du push) : la boucle renvoie la PR à sa
#      session avec la sortie du hook (renvoyer.sh), jamais en sautant le hook
#   3  « push refusé par le distant » (règle de dépôt, droit, panne ou coupure ; aucune trace du hook pre-push) :
#      échec fermé, la boucle s'arrête (ARRÊT), jamais un renvoi → lire la sortie, relancer
#   3  gates des registres ou checks rouges → lire l'échec : instabilité connue →
#      `gh run rerun <id> --failed` puis relancer ; sinon renvoyer
#   3  aucun check sur le sommet après 5 min : CI non déclenchée → ni fermeture-réouverture ni
#      commit vide ; boucle.sh la met de côté jusqu'à la fusion suivante, qui la poussera
#   4  refus que l'auteur peut corriger (migration plus ancienne que la dernière de develop,
#      titre trop long, sans section « Revue adversariale », titre de code sur un diff docs seul, lien
#      symbolique sur un index généré) : la dernière ligne dit pourquoi ; boucle.sh renvoie
#      la PR (refus.sh) avec ce motif, jamais de saut silencieux
#   7  pas éligible, rien à corriger côté auteur (non ouverte, brouillon, sans `à-fusionner`,
#      déjà `fusion-bloquée`, empilée sur une parente pas encore fusionnée, ou qui attend l'approbation d'un
#      propriétaire : CODEOWNERS et « Require review from Code Owners » sur la base, vu à l'éligibilité ou au refus
#      de fusion de GitHub, qui fait poser un commentaire marqué ; ou qui attend un humain : fusion déjà refusée
#      ainsi, aucune revue APPROVED plus récente que ce commentaire) : la boucle la saute sans renvoi et la reprend
#      au tour suivant ; ou en passage chez un autre capitaine (son commentaire marqué `<!-- capitaine:passage <id> -->`,
#      sans fin, de moins de 90 minutes, posé avant le sien), sautée sans renvoi ; ou qui n'est plus éligible une fois le
#      verrou pris (relue : fermée, label retiré, sommet changé)
#   3  fusion refusée faute d'approbation d'un propriétaire et commentaire d'attente impossible à poser : la boucle
#      s'arrête (ARRÊT, sortie 3), sans le repasser → lire la cause (droits du compte du capitaine), relancer
#   5  GitHub illisible (lire_github : réponse vide, non JSON, corps d'erreur ou code non nul), à la lecture de la PR,
#      de sa parente ou pendant l'attente de la CI : la boucle se met en pause (PAUSE) puis reprend, jamais un arrêt
#   3  fusion refusée par GitHub pour une autre raison que la revue ou une branche qui a bougé (droit du compte, règle
#      du dépôt, méthode de fusion interdite : un refus durable) : la boucle s'arrête (ARRÊT) → lire le message, traiter.
#      Avant, develop relu et la règle d'ascendance rejouée (décision A-51) : si develop n'est plus ancêtre du sommet
#      testé (il a bougé entre le test et la fusion, un 405 « Repository rule violations » d'une branche devenue en
#      retard), c'est une course : sortie 5 ; develop illisible à la relecture, 5 aussi (coupure) ; `ascendance` en
#      échec, 3
#   3  contrôle d'ascendance illisible (réf absente, git en échec) : la boucle s'arrête → lire la cause, relancer
#   5  develop a bougé trois fois pendant la CI (deux reprises de la mise à jour déjà jouées) → relancer
#   5  develop ou la PR a bougé en route → relancer. develop a bougé sans le capitaine :
#      retrouver qui a fusionné (`gh api 'repos/{owner}/{repo}/pulls?state=closed&sort=updated&direction=desc'`,
#      celles qui ont un `merged_at`) et lui rappeler la règle
#   6  worktree du capitaine pas propre → le nettoyer (rien d'une autre session n'y vit), relancer
#   12 fusionnée, mais arbre du squash ≠ arbre testé (ou squash introuvable) : commentaire marqué
#      `<!-- arbre-different-capitaine -->` sur la PR, `à-fusionner` retiré, ligne `ARBRE DIFFÉRENT` ; la boucle
#      s'arrête (ARRÊT), le capitaine le dit à son lanceur, un humain examine (`git diff <sommet testé> <squash>`)
#   3  verrou du passage illisible (commentaire non posé, commentaires illisibles) : la boucle s'arrête, jamais un
#      passage sans verrou → lire la cause, relancer
#   64 CAPITAINE_ID absent ou mal formé (l'id de la session du capitaine, `^[A-Za-z0-9_-]{1,100}$`), aucune lecture
#      GitHub → le donner en préfixe de la commande (skill fusionner, « Mise en place »)
#   69 jq absent du poste → l'installer (sudo apt install jq), relancer
#
# Verrou du passage (plusieurs capitaines sur la même file) : une fois la PR jugée éligible, `prendre_passage` (github.sh)
# pose sur elle le commentaire « Passage du capitaine <id> », relit la PR, et une seule trappe EXIT le termine à toute
# sortie, TERM compris (`boucle.sh --arreter`) ; il est rafraîchi au début de chaque tour (étapes 2 à 5 bis).
# Usage : bash scripts/chaine/passer.sh <numéro>
# =============================================================================
set -euo pipefail
N=${1:?usage : passer.sh <numéro de PR>}
# Le script change de branche : il tourne depuis une copie, pour ne pas disparaître en route.
if [ -z "${PASSER_OUTILS:-}" ]; then
  copie=$(mktemp "${TMPDIR:-/tmp}/passer.XXXXXX")
  cp "$0" "$copie"
  PASSER_COPIE=$copie PASSER_OUTILS=$(cd "$(dirname "$0")" && pwd) exec bash "$copie" "$@"
fi
# La copie se retire dès qu'elle tourne (bash la garde ouverte, elle reste lisible jusqu'au bout) :
# sinon chaque PR passée laisse un passer.XXXXXX dans le dossier temporaire du capitaine.
case ${PASSER_COPIE:-} in "${TMPDIR:-/tmp}"/passer.*/*) ;; "${TMPDIR:-/tmp}"/passer.*) rm -f "$PASSER_COPIE" ;; esac
unset PASSER_COPIE
. "$PASSER_OUTILS/github.sh"
cd "$(git rev-parse --show-toplevel)"

GENERES=$(index_generes_regex) # scripts/docs/index-generes.json

log() { printf '[#%s] %s\n' "$N" "$*"; }
sortir() { log "$2"; exit "$1"; }
capitaine_id_valide "${CAPITAINE_ID-}" ||
  sortir 64 "CAPITAINE_ID absent ou mal formé (l'id de la session du capitaine, lettres, chiffres, - et _ : skill fusionner, « Mise en place ») : aucun passage"
pr=$(pr_json "$N") || sortir 5 "GitHub illisible à la lecture de la PR (cause ci-dessus) : pause, puis reprise"
champ() { jq -r "$1" <<<"$pr"; }

# ── 1. Éligibilité ───────────────────────────────────────────────────────────
[ -z "$(git status --porcelain)" ] || sortir 6 "worktree du capitaine pas propre : committer ou nettoyer d'abord"
[ "$(champ .state)" = open ] || sortir 7 "PR non ouverte"
[ "$(champ .draft)" = false ] || sortir 7 "PR en brouillon"
labels=",$(champ '[.labels[].name] | join(",")'),"
case "$labels" in *,à-fusionner,*) ;; *) sortir 7 "sans le label à-fusionner" ;; esac
case "$labels" in *,fusion-bloquée,*) sortir 7 "label fusion-bloquée" ;; esac
# Fusion déjà refusée faute d'approbation, sans approbation plus récente que le commentaire du capitaine : attend
# un humain, aucune mise à jour (au plus une CI par nouvelle approbation).
! attend_humain "$N" || sortir 7 "attend un humain : fusion refusée faute d'approbation d'un propriétaire (CODEOWNERS), aucune approbation depuis ; sautée sans renvoi"

base=$(champ .base.ref)
tete=$(champ .head.ref)
# Tête gardée (develop, main, branche par défaut) : l'étape 4 y pousserait la fusion avec develop.
! tete_gardee "$tete" "$(champ '.base.repo.default_branch // ""')" ||
  sortir 4 "tête de la PR = $tete, branche gardée (develop, main ou la branche par défaut) : le capitaine n'y pousse jamais ; ouvrir la PR depuis une branche de travail"
titre=$(champ .title)
# Sujet du squash trop long : vu avant la CI, pas après. #479 et #454, nuit du 14/10 : un passage
# complet (mise à jour, push, ~14 min de checks) perdu chacune pour un titre à 124 et 122 caractères.
longueur=$(node -e 'console.log(String([...process.argv[1]].length))' "$titre (#$N)")
[ "$longueur" -le 120 ] || sortir 4 "sujet du squash à $longueur caractères (> 120) : raccourcir le titre de la PR"
# Clone superficiel (sessions cloud : `--depth`) : les commits de develop au-delà de la profondeur
# n'y sont pas vus comme ancêtres. Merge-base faux, donc mise à jour et corps du squash faux. Cas
# vécu, #478 le 15/10 : 215 commits de develop dans le corps (445 Ko, refusé par le système).
[ "$(git rev-parse --is-shallow-repository)" = false ] || git_masque fetch -q --unshallow origin
git_masque fetch -q origin develop "$tete"
# Revue des propriétaires (CODEOWNERS de la base) attendue : ni rouge ni bloquée, rien à corriger côté auteur. Vu
# avant la mise à jour : une CI pour rien sinon, à chaque tour, jusqu'à l'approbation.
! attend_proprietaire "$pr" || sortir 7 "$MOTIF_PROPRIETAIRE"
origine=$(git rev-parse "origin/$tete")

# Livraison de sujet : tête `sujet/<nom>`, ou livraison intermédiaire `livraison/<nom>-<AAAAMMJJ-HHMM>`, prouvée
# par sa forme (`livraison_intermediaire` de github.sh, sur origin/sujet/<nom> rapatrié ici) : le nom de branche seul
# ne dispense jamais de la revue.
livraison_sujet=0
nom_sujet=''
if [[ "$tete" == sujet/* ]]; then
  livraison_sujet=1
  nom_sujet=${tete#sujet/}
elif [[ "$tete" =~ ^livraison/(.+)-[0-9]{8}-[0-9]{4}$ ]]; then
  nom_sujet=${BASH_REMATCH[1]}
  if git fetch -q origin "sujet/$nom_sujet" 2>/dev/null && livraison_intermediaire "$nom_sujet" "$origine"; then
    livraison_sujet=1
  else
    nom_sujet=''
  fi
fi

# Point de départ des commits propres à la PR (corps du squash).
if [ "$base" = develop ]; then
  depart=$(git merge-base "$origine" origin/develop)
else
  json_parente=$(lire_github "$DEPOT/pulls?state=all&per_page=1&head={owner}:$(uri "$base")") ||
    sortir 5 "GitHub illisible à la lecture de la parente $base (cause ci-dessus) : pause, puis reprise"
  read -r parente etat_parente sommet_parente <<<"$(jq -r '.[0] | "\(.number) \(if .merged_at then "MERGED" else .state end) \(.head.sha)"' <<<"$json_parente")"
  [ "$etat_parente" = MERGED ] || sortir 7 "empilée sur #$parente, pas encore fusionnée"
  git_masque fetch -q origin "$base" || true
  depart=$sommet_parente
  git cat-file -e "$depart^{commit}" 2>/dev/null || depart=$(git merge-base "$origine" origin/develop)
  # Départ de la pile : ce que la PR a repris de sa parente.
  depart_pile=$(git merge-base "$origine" "$depart")
fi

# Revue adversariale (ADR « chaîne de production ») : exigée dès que le diff touche du code ou ce que la chaîne
# exécute (revue-exigee.mjs : apps/, packages/, scripts/, e2e/, un segment à point, un fichier de la racine hors
# Markdown, un package.json, un CLAUDE.md, docs/agents/), ou un chemin sensible et le fichier des critères du
# contrat d'origin/develop, jamais de celui de la PR.
# Une livraison de sujet en est dispensée : chaque sous-PR l'a passée (sujet.sh fusionner).
if [ "$livraison_sujet" = 0 ]; then
  motif=$(git -c core.quotePath=false diff --no-renames --name-only "$depart" "$origine" | node "$PASSER_OUTILS/revue-exigee.mjs" "$(champ '.body // ""')" "$titre" origin/develop) ||
    sortir 4 "$motif"
fi

# Lien symbolique sur un index généré ou son dossier, que la PR ajoute ou change (livraisons comprises) : la
# régénération de l'étape 3 écrirait à travers lui. Refus que l'auteur corrige.
motif=$(liens_sur_index "$origine" origin/develop) || sortir 4 "$motif"

# Ordre des migrations : une migration ajoutée par la PR est strictement postérieure à la dernière
# de develop, sinon le migrateur refuserait la livraison. Valable pour la livraison d'un sujet comme
# pour une PR directe ; les sous-PR vers un sujet passent par sujet.sh, hors de ce contrôle.
motif=$(node "$PASSER_OUTILS/migrations-ordre.mjs" origin/develop "$origine") || sortir 4 "$motif"

# ── Verrou du passage ───────────────────────────────────────────────────────
# Après l'éligibilité, avant toute écriture : un autre capitaine qui tient la PR la fait sauter sans renvoi (7) ;
# un verrou illisible arrête (3), jamais un passage sans lui.
prendre_passage "$N" && statut=0 || statut=$?
case $statut in
  0) ;;
  1) sortir 7 "$PASSAGE_MOTIF" ;;
  *) sortir 3 "verrou du passage illisible (cause ci-dessus) : la PR ne passe pas sans lui" ;;
esac
# Une seule trappe : une seconde remplacerait la première. TERM et INT passent par `exit`, donc par elle.
trap 'finir_passage; rm -f "${refus_fusion:-}" "${reponse_fusion:-}"' EXIT
trap 'exit 143' TERM
trap 'exit 130' INT
# L'éligibilité a été lue avant le verrou : un autre capitaine a pu finir son passage entre les deux (PR fusionnée,
# label retiré, renvoyée). La PR relue doit l'être encore, au même sommet.
pr_relu=$(pr_json "$N") || sortir 5 "GitHub illisible à la relecture de la PR, verrou pris (cause ci-dessus) : pause, puis reprise"
raison=$(jq -r --arg s "$(champ .head.sha)" '[.labels[].name] as $l
  | if .state != "open" then "non ouverte" elif .draft != false then "en brouillon"
    elif ($l | index("à-fusionner")) == null then "sans le label à-fusionner"
    elif ($l | index("fusion-bloquée")) != null then "label fusion-bloquée"
    elif .head.sha != $s then "sommet changé" else "" end' <<<"$pr_relu")
[ -z "$raison" ] || sortir 7 "PR plus éligible une fois le verrou pris ($raison) : sautée"

# ── 2 à 5 bis. Mise à jour, index, push, CI, puis contrôle d'ascendance ───────
# Trois tours au plus. Un tour met la PR à jour avec develop (2), régénère les index (3), pousse (4), attend la CI
# exigée du sommet (5), puis relit develop et contrôle l'ascendance (5 bis, `ascendance` de github.sh) : la PR
# n'entre que testée sur l'état de develop où elle entre, jamais sur la foi du réglage « strict » de GitHub. Develop
# qui a bougé pendant la CI (retard, ou conflit sur les seuls index générés) : nouveau tour, deux reprises au plus,
# puis sortie 5. Aucune exception pour la documentation.
tour=0
while :; do
  tour=$((tour + 1))
  rafraichir_passage
  # ── 2. Mise à jour avec develop ───────────────────────────────────────────
  git switch -q -C "capitaine/$N" "$origine"
  fusion_en_cours=0
  if ! sortie_merge=$(fusionner_avec origin/develop 3>&2 2>&1); then
    conflits=$(git diff --name-only --diff-filter=U)
    # Sans fichier en conflit, c'est un refus (hook commit-msg, fichier non suivi écrasé), pas une fusion en cours.
    if [ -z "$conflits" ]; then
      printf '%s\n' "$sortie_merge" | masquer_url >&2
      annuler_fusion
      git switch -q --detach origin/develop
      sortir 3 "fusion de develop refusée (hook git ou fichier non suivi) : sortie ci-dessus ; corriger, jamais en sautant le hook"
    fi
    autres=$(printf '%s\n' "$conflits" | grep -Ev "$GENERES" || true)
    # Pile : le squash de la parente masque l'ascendance, d'où un conflit sur tout fichier que
    # la pile touche. Comme un rebase --onto : si develop a la version du départ de la pile, la
    # version de la PR fait foi ; si c'est la PR qui l'a gardée (une PR sœur, fusionnée avant,
    # l'a modifié dans develop), la version de develop fait foi. Sinon, vrai conflit.
    if [ -n "$autres" ] && [ -n "${depart_pile:-}" ]; then
      reste=''
      for f in $autres; do
        v_dev=$(git rev-parse -q --verify "origin/develop:$f" 2>/dev/null || echo absent)
        v_pile=$(git rev-parse -q --verify "$depart_pile:$f" 2>/dev/null || echo absent)
        v_pr=$(git rev-parse -q --verify "$origine:$f" 2>/dev/null || echo absent)
        if [ "$v_dev" = "$v_pile" ]; then
          git checkout --ours -- "$f" && git add -- "$f"
          log "conflit de pile résolu : $f (develop = départ de la pile, version de la PR gardée)"
        elif [ "$v_pr" = "$v_pile" ]; then
          if [ "$v_dev" = absent ]; then git rm -q -- "$f"; else git checkout --theirs -- "$f" && git add -- "$f"; fi
          log "conflit de pile résolu : $f (PR = départ de la pile, version de develop gardée)"
        else
          reste="$reste $f"
        fi
      done
      autres=$(printf '%s\n' $reste)
    fi
    if [ -n "$autres" ]; then
      git merge --abort
      log "conflit avec develop hors index générés :"
      printf '  %s\n' $autres
      exit 2
    fi
    # Index générés : n'importe quel côté, la régénération ci-dessous fait foi.
    generes=$(printf '%s\n' "$conflits" | grep -E "$GENERES" || true)
    if [ -n "$generes" ]; then
      git checkout --theirs -- $generes
      git add -- $generes
    fi
    fusion_en_cours=1
  fi
  # Les générateurs tournent sur les dépendances de la branche mise à jour.
  pnpm install --frozen-lockfile --prefer-offline >/dev/null 2>&1 || sortir 3 "pnpm install en échec après mise à jour"

  # ── 3. Index régénérés ──────────────────────────────────────────────────────
  regenerer_index || sortir 3 "régénération des index en échec après mise à jour (scripts/docs/index-generes.json)"
  if [ "$fusion_en_cours" = 1 ]; then
    commande_commit="git commit -q --no-edit" # conclut la fusion, comme `git merge` sans conflit
  elif ! git diff --cached --quiet; then
    commande_commit="git commit -q -m 'docs: régénère les index après mise à jour avec develop'"
  else
    commande_commit=
  fi
  if [ -n "$commande_commit" ] && ! jouer_ou_dire "$commande_commit"; then
    annuler_fusion
    git switch -q --detach origin/develop
    sortir 3 "commit refusé par un hook git (commit-msg, pre-commit) : sortie ci-dessus ; corriger, jamais en sautant le hook"
  fi


  # ── 4. Push en avance rapide ────────────────────────────────────────────────
  sommet=$(git rev-parse HEAD)
  if [ "$tour" = 1 ] && [ "$base" != develop ]; then
    # Recibler AVANT de pousser : la CI exigée ne se déclenche que sur une PR vers develop. Une fois : au tour
    # suivant, la PR vise déjà develop.
    gh api -X PATCH "$DEPOT/pulls/$N" -f base=develop >/dev/null
    log "reciblée sur develop (parente #$parente fusionnée)"
  fi
  if [ "$sommet" != "$origine" ]; then
    pousser "HEAD:refs/heads/$tete" "$tete" "$origine" && statut=0 || statut=$?
    case $statut in
      0) ;;
      5) sortir 5 "push refusé : la branche a bougé, relancer" ;;
      3)
        # Trace de husky dans la sortie du push : le hook refuse, la boucle renvoie la PR avec sa sortie.
        git switch -q --detach origin/develop
        sortir 3 "push refusé par le hook pre-push : sortie ci-dessus ; corriger, jamais en sautant le hook"
        ;;
      *)
        # Aucune trace du hook : échec fermé, la boucle s'arrête, jamais un renvoi.
        git switch -q --detach origin/develop
        sortir 3 "push refusé par le distant (règle de dépôt, droit, panne ou coupure ; aucune trace du hook pre-push) : sortie ci-dessus"
        ;;
    esac
    log "mise à jour poussée ($(git rev-parse --short HEAD))"
  else
    log "déjà à jour avec develop"
  fi

  # ── 5. Checks exigés du nouveau sommet ────────────────────────────────────
  # Aucun check sur le sommet au bout de 5 min : la CI n'a pas été déclenchée. Cas vécu, #479 la
  # nuit du 14/10 : reciblée sur develop après sa mise à jour, sans nouveau push ; le reciblage ne
  # déclenche pas `pull_request`. Le reciblage passe désormais avant le push, mais une branche
  # déjà à jour n'en demande aucun. Le capitaine ne ferme ni ne rouvre la PR pour relancer la CI,
  # et ne pousse pas de commit vide : il s'arrête, la décision revient à l'humain ou à la session.
  rouges=$(attendre_ci "$N" "$sommet") && statut=0 || statut=$?
  case $statut in
    0) ;;
    1) sortir 3 "checks exigés rouges :"$'\n'"${rouges%$'\n'}" ;;
    2) sortir 3 "aucun check sur le sommet après 5 min : CI non déclenchée (un push de la session propriétaire la lancera)" ;;
    5) sortir 5 "GitHub illisible pendant l'attente de la CI : pause, puis reprise" ;;
    *) sortir 3 "checks exigés toujours en attente après 60 min" ;;
  esac
  sommet_lu=$(pr_sommet "$N") || sortir 5 "GitHub illisible à la relecture du sommet de la PR (cause ci-dessus) : pause, puis reprise"
  [ "$sommet_lu" = "$sommet" ] || sortir 5 "la PR a reçu un push pendant la CI, relancer"

  # ── 5 bis. Contrôle d'ascendance, juste avant la fusion ───────────────────
  # Refspec explicite : un clone `--single-branch` (ou au refspec restreint) ne met pas à jour origin/develop
  # sur un simple `git fetch origin develop`, et le contrôle jugerait une cible périmée.
  git_masque fetch -q origin "+refs/heads/develop:refs/remotes/origin/develop"
  verdict=$(ascendance "$sommet" origin/develop) ||
    sortir 3 "contrôle d'ascendance illisible (ascendance de github.sh, cause ci-dessus) : la PR n'entre pas sans lui"
  case ${verdict%%$'\n'*} in
    à-jour) break ;;
    retard | conflit-index)
      [ "$tour" -lt 3 ] || sortir 5 "develop a bougé trois fois pendant la CI, relancer"
      log "develop a bougé pendant la CI : nouvelle mise à jour ($tour sur 2)"
      origine=$sommet ;;
    conflit)
      git switch -q --detach origin/develop
      log "conflit avec develop hors index générés :"
      # Seuls les fichiers hors index générés : un index en conflit se régénère, la session n'a rien à y faire.
      sed -n '2,$p' <<<"$verdict" | { grep -Ev "$GENERES" || true; } | sed 's/^/  /'
      exit 2 ;;
    *) sortir 3 "contrôle d'ascendance illisible (verdict « ${verdict%%$'\n'*} ») : la PR n'entre pas sans lui" ;;
  esac
done

# ── 6. Squash ───────────────────────────────────────────────────────────────
sujet="$titre (#$N)"
longueur=$(node -e 'console.log(String([...process.argv[1]].length))' "$sujet")
[ "$longueur" -le 120 ] || sortir 4 "sujet du squash à $longueur caractères (> 120) : raccourcir le titre de la PR"
# Branche de sujet (ou livraison intermédiaire `livraison/*`) : commit de merge, qui garde un commit par sous-PR ; le corps
# les liste, puis nomme le sujet (`Sujet: sujet/<nom>`, que `sujet.sh livre` cherche dans develop une
# fois la branche supprimée). Sinon squash, corps = messages des commits de la PR.
if [ "$livraison_sujet" = 1 ]; then
  methode=merge
  corps() {
    git log --first-parent --no-merges --reverse --format='- %s' "$depart..$origine"
    printf '\nSujet: sujet/%s\n' "$nom_sujet"
  }
else
  methode=squash
  corps() { git log --no-merges --reverse --format='%B' "$depart..$origine"; }
fi
refus_fusion=$(mktemp)
reponse_fusion=$(mktemp) # retirés par la trappe du verrou
# Requête passée sur l'entrée standard : un corps long dépasserait la taille maximale d'un
# argument. `sha` : GitHub refuse la fusion si le sommet n'est plus celui testé.
corps |
  jq -Rs --arg sha "$sommet" --arg titre "$sujet" --arg methode "$methode" \
    '{merge_method: $methode, sha: $sha, commit_title: $titre, commit_message: .}' |
  gh api -X PUT "$DEPOT/pulls/$N/merge" --input - --jq .sha >"$reponse_fusion" 2>"$refus_fusion" || {
  # Refus faute d'approbation d'un propriétaire (un propriétaire du CODEOWNERS demandé, ou seul propriétaire = l'auteur, que
  # GitHub ne demande pas) : sortie 7, jamais 5, que la boucle relancerait puis arrêterait.
  message=$(masquer_url <"$refus_fusion")
  printf '%s\n' "$message" >&2
  if refus_pour_revue "$message" || attend_proprietaire "$(pr_json "$N" 2>/dev/null || echo '{}')"; then
    git switch -q --detach origin/develop
    git branch -q -D "capitaine/$N" 2>/dev/null || true
    # La PR attend un humain jusqu'à une nouvelle approbation : le commentaire marqué l'arrête (file.sh, attend_humain).
    # Commentaire impossible à poser : sortie 3 (la boucle s'arrête), jamais 7, qui ferait repasser la PR, mise à jour
    # et CI comprises, à chaque tour, ni 5, que la boucle met en pause puis reprend sans fin.
    commenter "$N" "$(printf '%s\n%s\n\n---\n_Generated by [Claude Code](https://claude.ai/code)_' "$MARQUE_ATTENTE" "$TEXTE_ATTENTE")" ||
      sortir 3 "fusion refusée faute d'approbation d'un propriétaire (CODEOWNERS) et commentaire d'attente non posé : sans lui, la PR repasserait à chaque tour ; lire la cause (droits du compte du capitaine), relancer"
    sortir 7 "$MOTIF_PROPRIETAIRE"
  fi
  # La branche ou develop a bougé (409, « Head/Base branch was modified », « not up to date »), ou GitHub en panne (5xx, aucun code HTTP) : sortie 5, la
  # boucle se met en pause puis reprend. Tout autre refus (droit, règle du dépôt, méthode de fusion interdite) est
  # durable : sortie 3, la boucle s'arrête, au lieu de refaire mise à jour et CI à chaque tour, en pause sans fin.
  # `gh` écrit `gh: <message> (HTTP <code>)`, ou `gh: HTTP <code>` sans message dans le corps (cli/cli, pkg/cmd/api).
  if grep -qiE 'HTTP (409|5[0-9]{2})([^0-9]|$)|branch was modified|not up to date' <<<"$message" || ! grep -qE 'HTTP [0-9]{3}([^0-9]|$)' <<<"$message"; then
    sortir 5 "fusion refusée (develop ou la PR a bougé, ou GitHub en panne), relancer"
  fi
  # Décision A-51 : avant d'arrêter la boucle, develop relu et la règle d'ascendance rejouée sur le sommet testé. Develop
  # qui n'est plus ancêtre du sommet testé a bougé entre le test et la fusion (un 405 « Repository rule violations » d'une
  # branche devenue en retard) : une course, sortie 5, le tour suivant remet à jour et reteste. Develop illisible à la
  # relecture : 5 (coupure passagère) ; `ascendance` en échec (panne locale) : 3, fermé.
  if ! git_masque fetch -q origin "+refs/heads/develop:refs/remotes/origin/develop"; then
    # Develop illisible à la relecture : une coupure passagère n'arrête pas la boucle (A-51 précisée, A-21) ; si git
    # reste illisible, `rafraichir_outils` du tour suivant arrête la boucle (sortie 6).
    git switch -q --detach origin/develop 2>/dev/null || true
    git branch -q -D "capitaine/$N" 2>/dev/null || true
    sortir 5 "fusion refusée par GitHub, et develop illisible à la relecture (cause ci-dessus) : pause, puis reprise"
  fi
  if verdict=$(ascendance "$sommet" origin/develop) && [ "${verdict%%$'\n'*}" != à-jour ]; then
    git switch -q --detach origin/develop
    git branch -q -D "capitaine/$N" 2>/dev/null || true
    sortir 5 "fusion refusée par GitHub, mais develop a bougé entre le test et la fusion (${verdict%%$'\n'*}) : relancer, le tour suivant remet à jour et reteste"
  fi
  git switch -q --detach origin/develop
  git branch -q -D "capitaine/$N" 2>/dev/null || true
  sortir 3 "fusion refusée par GitHub, ni pour la revue ni pour une branche qui a bougé (droit du compte, règle du dépôt, méthode de fusion) : message ci-dessus ; la boucle s'arrête, un humain lit la cause"
}

git_masque fetch -q origin "+refs/heads/develop:refs/remotes/origin/develop"
# Le squash : le `sha` de la réponse du PUT, sinon cherché dans develop par son sujet.
squash=$(sed -n 1p "$reponse_fusion")
git cat-file -e "$squash^{commit}" 2>/dev/null || squash=''
if [ -z "$squash" ]; then
  # Pas de `exit` dans awk : sous pipefail, git log tué par SIGPIPE ferait sortir le script en 141.
  # --first-parent : les commits d'une branche de sujet (un par sous-PR) n'y figurent pas.
  squash=$(git log --first-parent origin/develop -n 30 --format='%H %s' | awk -v s="(#$N)" '!t && index($0, s) == length($0) - length(s) + 1 { print $1; t = 1 }')
fi
if [ -z "$squash" ] || [ "$(git rev-parse "$squash^{tree}")" != "$(git rev-parse "$sommet^{tree}")" ]; then
  # Le code entré n'est pas celui que la CI a jugé (ou le squash est introuvable) : sortie 12, ARRÊT de la boucle.
  git switch -q --detach origin/develop
  git branch -q -D "capitaine/$N" 2>/dev/null || true
  sortir 12 "$(signaler_arbre_different "$N" "$sommet" "$squash")"
fi
log "FUSIONNÉE : $(git rev-parse --short "$squash"), arbre = arbre testé"
# Le label ne reste que sur ce qui attend : GitHub peut lister la PR ouverte quelques secondes encore.
retirer_label "$N" à-fusionner
git switch -q --detach origin/develop
git branch -q -D "capitaine/$N"
