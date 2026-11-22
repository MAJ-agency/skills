#!/usr/bin/env bash
# =============================================================================
# Passe la file de fusion jusqu'à ce qu'elle soit vide (skill /fusionner).
# Avant chaque passage, une PR dont la CI est rouge sur son sommet (`file.sh --rouges`) voit
# ses jobs rouges relancés une fois (instabilité), puis est renvoyée s'ils retombent.
# Un refus corrigeable par l'auteur (sortie 4 : titre, revue…) renvoie la PR avec son motif
# (refus.sh) ; une PR non éligible sans correction possible (sortie 7) est sautée sans renvoi ; une PR sans CI déclenchée (sortie 3, déjà à jour,
# rien à pousser) est mise de côté jusqu'à la prochaine fusion, dont la mise à jour la poussera
# et lancera sa CI. La sortie 5 (develop ou la PR a bougé, ou GitHub illisible : passer.sh) a droit à un second
# essai immédiat ; un second 5 met la boucle en PAUSE (`BOUCLE_PAUSE` secondes, 120 par défaut), puis elle reprend au
# tour suivant, qui relit l'arrêt, l'échéance et les scripts de develop : une sortie 5 ne l'arrête jamais. Une file
# illisible (`file.sh` en 5) est une PAUSE aussi, jamais une file vide ; `file.sh` en échec sous un autre code arrête
# la boucle (sortie 6). Un conflit (sortie 2) renvoie la PR ; des checks rouges au
# passage (sortie 3) la laissent rouge dans la file : relance au tour suivant, puis renvoi. Un push refusé par le
# hook pre-push (sortie 3, trace de husky) renvoie la PR à sa session avec la sortie du hook ; un push refusé par le
# distant (sortie 3, sans trace) arrête la boucle, sans renvoi.
# Tout autre code arrête la boucle (gates des registres, install, CI bloquée) : le capitaine traite, puis relance.
#
# Branches de sujet : à chaque tour, avant la PR suivante vers develop,
# `traiter_sujets` regroupe d'office les séries par spec et les piles (`sujet.sh
# regrouper-series`, REGROUPÉE), fait passer les sous-PR (squash dans le sujet, quelques secondes), recible
# sur son sujet une PR dont le ticket en déclare un, et une PR empilée dont la parente est
# entrée dans un sujet. Au début et à la fin, `rafraichir_sujets` fusionne develop dans chaque
# sujet non livré SANS sous-PR ouverte : bouger la tête d'un sujet sous ses sous-PR les remettait
# en conflit avant leur passage (cas vécu). Un sujet actif est mis à jour par sa livraison
# (passer.sh) ou par `sujet.sh fusionner` quand une sous-PR apporte du develop plus récent.
# Règle d'ascendance (skill `fusionner`) : une sous-PR en retard sur son sujet (documentation comprise), ou en
# conflit avec lui sur des index générés seuls, n'est pas renvoyée : `sujet.sh fusionner` la met à jour, régénère,
# pousse et attend la CI du nouveau sommet, puis la squashe ; si cette CI ne finit pas, sortie 8 (MISE À JOUR) :
# elle repasse au tour suivant. Une sous-PR sans CI, ou « prête (en conflit) » (GitHub ne lance pas la CI d'une PR en
# conflit), passe par `sujet.sh relancer`, qui lit la règle d'ascendance avant toute fusion : en retard ou en conflit
# sur des index générés seuls, mise à jour et poussée, CI relancée ; conflit hors index, renvoyée avec ses fichiers
# (sortie 2) ; mise à jour refusée par le pre-push (sortie 3, dernière ligne de relancer, A-22), renvoyée avec la sortie
# du hook ; contrôle illisible (sortie 11), laissée dans la file sans renvoi. Arbre du squash ≠ arbre testé, vers un sujet (`sujet.sh`, sortie 12) comme vers
# develop (`passer.sh`, sortie 12) : la PR porte le commentaire, la boucle s'arrête (ARRÊT, sortie 12) et le
# capitaine le dit à son lanceur.
# Un conflit est annulé et signalé (SUJET EN CONFLIT), jamais résolu ici : une session le
# résout dans une PR de mise à jour (skill sujet, § « Recevoir develop dans un sujet »), que `sujet.sh fusionner` fait entrer par
# avance rapide. Une fusion sans conflit refusée par un contrôle (hook, dépendances, gate des index, sortie 3)
# est annulée de même et dite SUJET NON MIS À JOUR, jamais SUJET EN CONFLIT : un pre-push rouge sur ce que
# develop apporte se corrige par une PR de mise à jour avec retouches. Une panne du capitaine (sortie 11) ou de
# sujet.sh (69, 1) se dit SUJET NON MIS À JOUR aussi, à corriger chez le capitaine, jamais par une session.
# Une sous-PR que `sujet.sh fusionner` refuse en sortie 3 (checks rouges, conflit avec le sujet, hook) est
# renvoyée avec le motif de `sujet.sh` (refus.sh) ; des checks encore en cours sortent en 5 (REPRISE, aucun
# renvoi) : la PR reste dans la file tant que sa CI ne finit pas.
# Un sujet « prêt à livrer » (plus de sous-PR, tickets faits) est livré par `sujet.sh
# livrer-prets` (LIVRÉ), sauf label `sujet-manuel` sur une de ses sous-PR. La PR finale passe
# par un commit de merge (passer.sh) : develop garde un commit par sous-PR.
# Regroupement d'office (`regrouper-series`) : une série de PR vers develop qui citent la même
# spec rejoint le sujet qui en contient déjà une, ou ouvre `sujet/<spec>` à partir de 3 PR ; une
# pile de 2 PR ou plus ouvre `sujet/pile-<racine>`. Jamais une série qui compte une PR
# `prio:haute`, ni une PR `hors-sujet` ; une série dont aucune PR ne vise develop ne bouge pas.
#
# Ordre de la file (file.sh) : sous-PR de sujet (quelques secondes), livraisons de sujet (une PR
# qui en vaut N, `prio:haute` comprise), `prio:haute`, puis numéro.
# Fin de boucle : FILE VIDE, puis SUJETS (`sujet.sh etat`) et SÉRIES restantes (préfixe de
# branche, `prio:haute`), que le capitaine propose à l'utilisateur (`sujet.sh regrouper <nom>
# <pr>…`) : regrouper une série non déclarée retarde sa recette, l'utilisateur tranche.
#
# Scripts : à chaque tour, `git fetch origin develop` puis copie fraîche de `scripts/chaine`
# d'origin/develop dans `<git-common-dir>/boucle-outils` (hors de l'arbre de travail), avec
# `scripts/docs/identifiants.mjs`, la grammaire des identifiants que `identifiant.mjs` importe pour
# `file.sh` et `sujet.sh` ; la boucle n'appelle QUE cette copie, jamais les scripts du worktree (qui
# peut être sur une branche de sujet plus ancienne). Si `boucle.sh` a changé sur develop, elle se
# relance (`exec`) sur la nouvelle version. `origin/develop`, `scripts/chaine` ou
# `scripts/docs/identifiants.mjs` introuvable, ou fetch en échec trois fois : arrêt (sortie 6) avec
# un message, jamais de scripts périmés.
#
# Instance unique, arrêt d'un geste. Un verrou `flock` (`<git-common-dir>/boucle.verrou`,
# « pid pgid » de la boucle dedans) interdit deux boucles à la fois : une seconde s'arrête aussitôt,
# sortie 9. Le verrou est tenu par le descripteur 9, que l'`exec` de relance garde et que les fils
# (passer.sh, tee…) héritent : il reste tenu tant qu'un orphelin vit, même boucle morte (`kill -9`).
# Couplage fragile : `scripts/db/demarrer-local.sh` (socle API) ferme ce descripteur par hasard
# (il rouvre le 9 pour son propre verrou, puis le ferme pour PostgreSQL) ; tout script du projet
# qui lance un démon doit le fermer (`9>&-`), sinon le démon garde le verrou après la boucle.
# L'arrêt passe par un fichier (`<git-common-dir>/boucle-arret`), que ni un processus d'attente
# oublié ni `pgrep` ne contournent : la boucle le lit au démarrage, au début de chaque tour, avant
# `livrer-prets`, avant chaque `passer` et avant le rafraîchissement de fin (sortie 10) ; une boucle
# relancée tant qu'il existe refuse de démarrer (sortie 10, message). `--arreter` interrompt aussi le
# passage en cours (TERM, puis KILL) : la trappe remet le worktree propre (`git merge --abort` ou
# `reset --hard`, puis `switch --detach origin/develop` ; le worktree du capitaine ne porte rien
# d'autre), sortie 143 (TERM) ou 130 (INT) ; le passage tué termine d'abord son commentaire de verrou (15 s au plus
# entre TERM et KILL). Option inconnue : sortie 64. `flock` (util-linux) requis.
#
# Plusieurs capitaines. Le verrou `flock` vaut pour un clone. Entre capitaines (un par personne, sur la même file),
# chaque passage (passer.sh, `sujet.sh fusionner`, `sujet.sh relancer`) pose sur sa PR un commentaire marqué
# (`prendre_passage` de github.sh) : un autre capitaine saute la PR (sortie 7) tant que ce passage n'est pas terminé.
# `CAPITAINE_ID`, l'id de la session du capitaine, est exigé au démarrage (sortie 64 sans lui, `--arreter` excepté).
#
# Échéance. La veille (`veille.sh`) pose `BOUCLE_ECHEANCE` (secondes depuis l'époque Unix) : au-delà,
# un passage commencé ne finirait pas avant la limite de 2 h de la tâche de fond qui la porte. La boucle
# la vérifie en tête de tour, avant chaque `passer` et avant chaque `sujet.sh fusionner` ; passé
# l'échéance, plus aucun passage : `ÉCHÉANCE <hh:mm> : …, file laissée`, sortie 0, sans le
# rafraîchissement de fin des sujets. Rien n'est alors en cours, aucune PR n'est touchée. Posée mais pas
# un entier positif : sortie 64, aucune lecture GitHub. Absente (boucle lancée à la main) : rien ne
# change. L'`exec` de relance garde l'environnement, donc l'échéance.
#
# Usage, depuis le worktree du capitaine (plus de copie manuelle à faire) :
#   bash scripts/chaine/boucle.sh > <journal> 2>&1
#   bash scripts/chaine/boucle.sh --arreter     pose le fichier d'arrêt, termine la boucle en cours
#                                               (détenteurs réels du verrou, descendants, groupe noté ;
#                                               la veille qui la porte n'est tuée que si elle est du
#                                               même groupe)
#   bash scripts/chaine/boucle.sh --reprendre   retire le fichier d'arrêt, puis lance la boucle
# À la main, pour une PR vers develop (la boucle arrêtée : deux processus dans le worktree le
# laissent en pleine fusion) :
#   1. `file.sh` montre la file ; `n=$(file.sh --next)` donne la suivante vers develop, jamais
#      une sous-PR de sujet (celles-ci passent par `sujet.sh fusionner <pr>`) ; file vide : fin ;
#   2. `passer.sh $n` en arrière-plan (10 à 15 min avec les E2E, quelques minutes pour de la
#      doc), attendre la notification sans sonder ; la suite selon le code de sortie est dans
#      l'en-tête de passer.sh ; reprendre en 1.
# =============================================================================
# Les scripts joués sont ceux d'origin/develop, recopiés à CHAQUE tour : un correctif
# de la chaîne fusionné pendant la boucle est vu au tour suivant. Dossier fixe hors du worktree
# (sous `.git`, partagé par les worktrees) ; `BOUCLE_COPIE` le remplace. Le dossier voisin
# `.nouveau` est extrait puis échangé d'un coup : un bash qui lit encore l'ancien fichier le garde.
empreinte=$(git hash-object "$0")
COMMUN=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)
COPIE=${BOUCLE_COPIE:-$COMMUN/boucle-outils}
case "$COPIE" in /boucle-outils) echo "ARRÊT : boucle.sh se lance depuis un dépôt git (worktree du capitaine)" >&2; exit 6 ;; esac
export BOUCLE_COPIE="$COPIE"
[ -n "$COMMUN" ] || { echo "ARRÊT : boucle.sh se lance depuis un dépôt git (worktree du capitaine)" >&2; exit 6; }
VERROU="$COMMUN/boucle.verrou"
ARRET="$COMMUN/boucle-arret"

command -v flock >/dev/null || { echo "ARRÊT : flock (util-linux) requis" >&2; exit 6; }
usage() { echo "usage : boucle.sh [--arreter | --reprendre]" >&2; exit 64; }

# `sleep` du PATH peut être factice (tests) : l'attente d'arrêt prend celui du système.
pause_reelle() { PATH=/usr/bin:/bin sleep "$1"; }
# Processus qui tiennent réellement le verrou : ceux qui ont le fichier ouvert (`-ef` : même inode).
# Le pid noté dans le fichier peut être mort ou recyclé : on ne tue que ce que /proc montre.
detenteurs() {
  local f p
  for f in /proc/[0-9]*/fd/*; do
    [ "$f" -ef "$VERROU" ] || continue
    p=${f#/proc/}; p=${p%%/*}
    [ "$p" = "$$" ] || echo "$p"
  done 2>/dev/null | sort -un
}
descendants() { local p; for p in $(pgrep -P "$1" 2>/dev/null); do descendants "$p"; echo "$p"; done; }
pgid_de() { ps -o pgid= -p "$1" 2>/dev/null | tr -d ' '; }

# --arreter : fichier d'arrêt posé d'abord (une relance oubliée refusera), puis la boucle en cours
# est terminée : détenteurs réels du verrou et leurs descendants, et le groupe noté dans le verrou
# (même si son meneur est mort) à condition qu'un détenteur en soit membre. Jamais notre groupe.
arreter_boucle() {
  date +%FT%T > "$ARRET"
  local det pg moi cibles essai p
  det=$(detenteurs)
  if [ -z "$det" ]; then echo "[boucle] aucune boucle en cours ; fichier d'arrêt posé ($ARRET), --reprendre le retire"; return 0; fi
  pg=$(awk '{ print $2 }' "$VERROU" 2>/dev/null)
  moi=$(pgid_de $$)
  case "$pg" in ''|*[!0-9]*) pg= ;; esac
  if [ -n "$pg" ]; then
    local membre=
    for p in $det; do [ "$(pgid_de "$p")" = "$pg" ] && membre=1; done
    [ -n "$membre" ] || pg=
  fi
  for essai in TERM KILL; do
    cibles="$det"
    for p in $det; do cibles="$cibles $(descendants "$p")"; done
    [ -z "$pg" ] || [ "$pg" = "$moi" ] || kill -"$essai" -- "-$pg" 2>/dev/null
    # shellcheck disable=SC2086
    kill -"$essai" $cibles 2>/dev/null
    # Après TERM, 15 s au plus : la trappe du passage en cours termine son commentaire de verrou (un PATCH) avant de
    # sortir ; la boucle s'arrête dès qu'aucun détenteur ne reste.
    for _ in $(seq 1 60); do
      det=$(detenteurs)
      [ -n "$det" ] || { echo "[boucle] boucle arrêtée ; fichier d'arrêt posé ($ARRET), --reprendre le retire"; return 0; }
      pause_reelle 0.25
    done
  done
  echo "[boucle] processus ($det) tiennent encore le verrou après KILL : à arrêter à la main" >&2
  return 1
}

reprendre=0
case "${1:-}" in
  --arreter) arreter_boucle; exit $? ;;
  --reprendre) reprendre=1; shift ;;
  --*) usage ;;
esac
# L'id de la session du capitaine, pour le verrou de chaque passage (github.sh, prendre_passage) : après `--arreter`, qui
# doit marcher sans lui, avant le verrou de la boucle. L'`exec` de relance garde l'environnement.
[[ "${CAPITAINE_ID-}" =~ ^[A-Za-z0-9_-]{1,100}$ ]] || {
  echo "ARRÊT : CAPITAINE_ID requis (l'id de la session du capitaine, skill fusionner § « Mise en place »)" >&2
  exit 64
}

# Instance unique. Après un `exec` de relance (même pid), le descripteur 9 porte déjà le verrou.
if [ "${BOUCLE_VERROU_PID:-}" != "$$" ]; then
  exec 9>>"$VERROU"
  flock -n 9 || { echo "REFUS : une boucle tourne déjà (pid $(cut -d' ' -f1 "$VERROU" 2>/dev/null)) : une seule à la fois, '--arreter' d'abord" >&2; exit 9; }
  echo "$$ $(pgid_de $$)" > "$VERROU"
  export BOUCLE_VERROU_PID=$$
  # Un `git gc --auto` détaché hériterait du descripteur 9 et garderait le verrou : jamais détaché.
  n=${GIT_CONFIG_COUNT:-0}
  export "GIT_CONFIG_KEY_$n=gc.autoDetach" "GIT_CONFIG_VALUE_$n=false" \
    "GIT_CONFIG_KEY_$((n + 1))=maintenance.autoDetach" "GIT_CONFIG_VALUE_$((n + 1))=false" \
    "GIT_CONFIG_COUNT=$((n + 2))"
fi
[ "$reprendre" = 0 ] || rm -f "$ARRET"

# Fichier d'arrêt : lu au démarrage, à chaque tour, avant `livrer-prets`, avant chaque passage.
verifier_arret() {
  [ ! -e "$ARRET" ] || { echo "ARRÊT demandé ($ARRET, posé le $(cat "$ARRET" 2>/dev/null)) : '--reprendre' pour relancer" >&2; exit 10; }
}
verifier_arret
# Échéance de la veille (en-tête). Dans le sous-shell du tube de `traiter_sujets`, `exit` ne sort que du
# sous-shell : il sort en ECHEANCE_TUBE, que la boucle relit après le tube (PIPESTATUS).
ECHEANCE_TUBE=86
if [ -n "${BOUCLE_ECHEANCE+x}" ] && ! [[ "$BOUCLE_ECHEANCE" =~ ^[1-9][0-9]*$ ]]; then
  echo "ARRÊT : BOUCLE_ECHEANCE (« $BOUCLE_ECHEANCE ») n'est pas un entier positif (secondes depuis l'époque Unix, posées par veille.sh)" >&2
  exit 64
fi
echeance_passee() { [ -n "${BOUCLE_ECHEANCE:-}" ] && [ "$(date +%s)" -ge "$BOUCLE_ECHEANCE" ]; }
finir_echeance() { echo "ÉCHÉANCE $(date +%H:%M) : plus de passage avant la fin de la veille, file laissée"; exit 0; }
verifier_echeance() { ! echeance_passee || finir_echeance; }
# Signal en plein passage : worktree remis propre (fusion commitée ou non, index régénérés).
arret_signal() {
  echo "[boucle] signal reçu : worktree remis propre, arrêt" >&2
  git merge --abort 2>/dev/null || git reset -q --hard 2>/dev/null
  git switch -q --detach origin/develop 2>/dev/null
  exit "$1"
}
trap 'arret_signal 143' TERM
trap 'arret_signal 130' INT

# Pause sur GitHub illisible (sortie 5) : `BOUCLE_PAUSE` secondes, entier, 120 par défaut (la sonde de la veille).
PAUSE=${BOUCLE_PAUSE:-120}
[[ "$PAUSE" =~ ^[0-9]+$ ]] || PAUSE=120
# La ligne PAUSE nomme la cause : la dernière ligne `GitHub illisible (<route>) : <cause>` de lire_github lue dans `<fichier>`
# (route et code HTTP tels que gh les écrit, `(HTTP 401)` d'un jeton expiré compris : décision A-51).
# Ancrée en début de ligne : lire_github l'écrit ainsi, et une sortie de hook relayée est préfixée `[git push …]`.
cause_lue() { grep -a '^GitHub illisible (' "$1" 2>/dev/null | tail -n 1 | tr -d '\r'; }
mettre_en_pause() { # <préfixe> <motif> [<fichier où lire la cause>]
  local cause=''
  [ -z "${3:-}" ] || cause=$(cause_lue "$3")
  echo "$1 $(date +%H:%M) $2${cause:+ ; cause : $cause}, reprise dans $PAUSE s"
  sleep "$PAUSE"
}

arret_outils() { echo "ARRÊT : $1 : jouer des scripts périmés est pire qu'attendre, le capitaine traite puis relance" >&2; exit 6; }

rafraichir_outils() {
  local essai
  for essai in 1 2 3; do
    git fetch -q origin develop 2>/dev/null && break
    [ "$essai" != 3 ] || arret_outils "git fetch origin develop impossible, ou origin/develop introuvable"
    sleep $((essai * 5))
  done
  git rev-parse --verify -q origin/develop >/dev/null || arret_outils "origin/develop introuvable"
  rm -rf "$COPIE.nouveau" && mkdir -p "$COPIE.nouveau" &&
    git archive origin/develop scripts/chaine 2>/dev/null | tar -x -C "$COPIE.nouveau" ||
    arret_outils "scripts/chaine absent d'origin/develop"
  [ -f "$COPIE.nouveau/scripts/chaine/boucle.sh" ] || arret_outils "scripts/chaine/boucle.sh absent d'origin/develop"
  # La grammaire des identifiants (skill `tickets`), que identifiant.mjs cherche dans ../docs/.
  git archive origin/develop scripts/docs/identifiants.mjs 2>/dev/null | tar -x -C "$COPIE.nouveau" 2>/dev/null ||
    arret_outils "scripts/docs/identifiants.mjs absent d'origin/develop (skill tickets : /maj-skills:tickets poser)"
  rm -rf "$COPIE" && mv "$COPIE.nouveau" "$COPIE"
  outils="$COPIE/scripts/chaine"
  # `boucle.sh` lui-même a changé sur develop : on repart sur la nouvelle version, état gardé.
  if [ "$(git hash-object "$outils/boucle.sh")" != "$empreinte" ]; then
    echo "[boucle] boucle.sh a changé sur develop : relance sur la nouvelle version"
    rm -f "${sortie:-}"
    BOUCLE_SAUTEES="${sautees:- }" BOUCLE_ATTENTE="${attente_fusion:- }" exec bash "$outils/boucle.sh" "$@"
  fi
  SUJET="$outils/sujet.sh"
  [ -f "$SUJET" ] || SUJET="$outils/../../sujet/scripts/sujet.sh"
  . "$outils/github.sh"
}
sortie=
rafraichir_outils "$@"

# CI rouge sur le sommet d'une PR de la file : une relance des jobs rouges, puis renvoi.
# Tous les workflows du sommet comptent : « Secret Detection » vit dans « Security Scan », pas
# dans « CI » (cas vécu : quatre PR restées rouges, jamais relancées ni renvoyées).
traiter_rouges() {
  local n checks sommet runs id tentative relance
  bash "$outils/file.sh" --rouges | while IFS="$(printf '\t')" read -r n checks; do
    sommet=$(pr_sommet "$n") || continue
    runs=$(gh api "$DEPOT/actions/runs?head_sha=$sommet&per_page=50" \
      --jq '.workflow_runs[] | select(.conclusion == "failure") | "\(.id) \(.run_attempt)"' 2>/dev/null) || continue
    [ -n "$runs" ] || continue # runs encore en cours, ou API muette : on reverra au prochain tour
    relance=0
    while read -r id tentative; do
      if [ "${tentative:-1}" -lt 2 ]; then
        gh api -X POST "$DEPOT/actions/runs/$id/rerun-failed-jobs" >/dev/null 2>&1 && relance=1
      fi
    done <<<"$runs"
    if [ "$relance" = 1 ]; then
      echo "[#$n] RELANCE des jobs rouges ($checks)"
    else
      bash "$outils/renvoyer.sh" "$n" "CI rouge sur le sommet de la PR, aussi à la relance : $checks"
    fi
  done
}

# develop dans chaque sujet ni livré (sa PR vers develop, passer.sh la tient à jour) ni actif
# (une sous-PR ouverte : la mise à jour la remettrait en conflit avec la nouvelle tête).
rafraichir_sujets() {
  local nom sous verdict rc
  bash "$SUJET" etat 2>/dev/null | tail -n +2 | while IFS="$(printf '\t')" read -r nom _ _ sous _ verdict; do
    case "$verdict" in livré*) continue ;; esac
    [ "$sous" = "—" ] || continue
    bash "$SUJET" rafraichir "$nom" --abandon-si-conflit 2>&1 | sed "s#^#[sujet/$nom] #"
    rc=${PIPESTATUS[0]}
    case "$rc" in
      0) ;;
      2) echo "[sujet/$nom] SUJET EN CONFLIT avec develop : à résoudre par une session, PR de mise à jour vers sujet/$nom (skill sujet, « Recevoir develop dans un sujet »)" ;;
      5) echo "[sujet/$nom] sujet bougé pendant la mise à jour : repris au tour suivant" ;;
      6) echo "[sujet/$nom] PAS PROPRE : worktree du capitaine à nettoyer, sujet laissé tel quel (aucun conflit)" ;;
      # Aucun conflit : la fusion de develop est refusée par un contrôle (hook, dépendances, gate des index).
      3) echo "[sujet/$nom] SUJET NON MIS À JOUR (sortie 3, aucun conflit) : cause ci-dessus ; un hook rouge sur ce que develop apporte (pre-push, formateur monté) se corrige par une PR de mise à jour avec retouches vers sujet/$nom (skill sujet, « Recevoir develop dans un sujet »)" ;;
      # Rien qu'une session puisse corriger : un outil du capitaine, ou sujet.sh lui-même (69 : jq absent ; 1 : erreur).
      11) echo "[sujet/$nom] SUJET NON MIS À JOUR (sortie 11, aucun conflit) : outil du capitaine en échec, cause ci-dessus : à corriger chez le capitaine, rien à faire par une session" ;;
      *) echo "[sujet/$nom] SUJET NON MIS À JOUR (sortie $rc, aucun conflit) : erreur de sujet.sh (69 : jq absent du poste ; 1 : erreur inattendue), cause ci-dessus : à corriger chez le capitaine, rien à faire par une session" ;;
    esac
  done
  git switch -q --detach origin/develop 2>/dev/null || true
}

# Sous-PR et reciblages : rapides, faits avant chaque passage vers develop.
# Une sous-PR à la fois par sujet (décisions A-104 et A-142). Une sous-PR est « en route » quand file.sh la lit
# « prête », « prête (sans CI) », « prête (en conflit) » ou « CI en cours ». À chaque tour, une seule tient son sujet ;
# les autres sous-PR en route du même sujet attendent leur tour, sans mise à jour, ni CI, ni renvoi, et gardent leur
# étiquette (`[#n] attend son tour : #m passe d'abord dans sujet/<nom>`, que la veille lit).
# Qui tient le sujet le garde, avant tout ordre de numéro. Au début du tour, pour un sujet qui a plusieurs sous-PR en
# route, dans cet ordre : (1) une sous-PR qui porte la marque de passage vivante d'un autre capitaine
# (`verrou_d_un_autre`, lue sur chacune, la plus ancienne d'abord) : ce capitaine-ci ne prend alors aucune autre sous-PR
# du sujet à ce tour ; (2) sinon celle que cette boucle tenait à la fin du tour précédent, si elle est encore en route
# (`TENUS`, gardé d'un tour et d'une boucle à l'autre) ; (3) sinon une sous-PR « CI en cours », la plus ancienne ;
# (4) sinon personne : la plus ancienne en route (le plus petit numéro) prend le sujet. Celle qui tient déjà son sujet
# passe la première ; les autres lignes suivent dans l'ordre de file.sh.
# Le sujet est rendu dans le tour quand celle qui le tient n'est plus en route vers l'entrée (fusionnée, renvoyée, ou
# refusée par une sortie non classée) : la plus ancienne qui attend le prend aussitôt. Il reste tenu sur une sortie qui
# la laisse en route : 5, 6, 8, 11, `relancer` réussi, 7 (le verrou d'un autre capitaine) et toute sortie par signal
# (129 et plus : l'état du passage interrompu est inconnu, son verrou peut rester ; 128 est une erreur fatale de git,
# pas un signal : elle suit la table d'une erreur, A-161). Une sous-PR de fourche (la sortie 7 de sa garde, lue par
# `fourche_sautee`) n'est jamais en route : sautée sans renvoi, elle rend le sujet dans le tour, dans les deux régimes,
# et sa ligne la nomme (A-201). Un sujet encore tenu après le
# passage de celle qui le tient est dit à chaque tour : `[sujet/<nom>] tenu par #n (<raison>)`, écrit par la boucle une
# fois la sortie de `sujet.sh` classée (son code, et sa dernière ligne dans `$sortie`), jamais dans `$sortie` : la ligne
# ne suit pas celle du `sortir`, et `refus.sh` ne la prend pas pour un motif. Sur une sortie 7, la raison porte la date
# du verrou de l'autre capitaine (`, verrou du <date>`), que la veille lit pour relancer la boucle à son expiration.
# `tenus` : « sujet/<nom>:<numéro> », entre espaces (un nom de branche ne contient ni espace ni deux-points) ; jamais
# un tableau associatif, dont l'indice, un nom de branche, serait évalué. `TENUS` : les mêmes, un par ligne.
TENUS="$COMMUN/boucle-tenus"
# Marque de passage vivante d'un autre capitaine sur la sous-PR `<n>`, lue sans rien écrire : `FILTRE_PASSAGE` de
# github.sh (la décision du verrou) sur ses commentaires, comme le lirait un passage qui poserait sa marque maintenant
# (`mien` au-dessus de tout id, `cree` à l'heure de `epoch_passage`, l'horloge du verrou). Écrit « <capitaine> <date
# du verrou> » ; rien : personne, ou une marque expirée (90 minutes) ; « illisible » : commentaires ou dates
# illisibles, et dans le doute elle tient. Son passage, lui, pose sa marque et tranche (`prendre_passage`). « panne » :
# la lecture GitHub elle-même a échoué ; elle ne donne jamais le sujet (A-161) : à ce tour, aucune sous-PR du sujet.
# La veille ne suit pas un sujet suspendu : il est repris au prochain changement de la file, ou à la veille suivante
# (au pire à la fin de la veille en cours, 75 minutes par défaut ; A-165).
verrou_d_un_autre() {
  local lus
  lus=$(lire_github "$DEPOT/issues/$1/comments?per_page=100" --paginate) || { echo panne; return 0; }
  jq -rs --arg moi "$CAPITAINE_ID" --argjson mien 9007199254740991 --arg cree "$(jq -nr --argjson e "$(epoch_passage)" '$e | todate')" \
      "$FILTRE_PASSAGE | .tenu // \"\"" <<<"$lus" 2>/dev/null ||
    echo illisible
}
# Date du verrou d'un autre capitaine, lue sur la DERNIÈRE ligne d'une sortie 7 de `sujet.sh` (son `sortir` :
# « #<n> en passage chez le capitaine <id> depuis <date> : … », `PASSAGE_MOTIF` de github.sh), jamais sur un motif cherché
# dans toute la sortie. Écrit « , verrou du <date> » ; rien quand la sortie 7 a une autre cause (fermée, en brouillon,
# sujet gelé, plus éligible une fois le verrou pris).
date_du_verrou() { # <n> <fichier de la sortie>
  local fin
  fin=$({ grep . "$2" || true; } | tail -n 1 | tr -d '\r')
  [[ "$fin" =~ ^"#$1 en passage chez le capitaine "[A-Za-z0-9_-]+" depuis "([0-9TZ:-]+)" : " ]] || return 0
  printf ', verrou du %s' "${BASH_REMATCH[1]}"
}
# Une sous-PR de fourche, lue sur la DERNIÈRE ligne d'une sortie 7 de `sujet.sh` (le `sortir` de sa garde de fourche :
# « #<n> : PR de fourche (<dépôt>) : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi »), jamais
# sur un motif cherché dans toute la sortie. Sa cause ne passe pas d'elle-même, et n'importe qui ouvre une telle PR : elle
# ne tient pas son sujet (A-201), l'autre sous-PR en route le prend au même tour.
fourche_sautee() { # <n> <fichier de la sortie>
  local fin
  fin=$({ grep . "$2" || true; } | tail -n 1 | tr -d '\r')
  [[ "$fin" == "#$1 : PR de fourche ("*") : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi" ]]
}
traiter_sujets() {
  local n etat sujet rc tient par liste lue enroute verrou geste tenus=' ' suspendus=' '
  verifier_arret
  # Séries par spec et piles : regroupées d'office (hors prio:haute et hors-sujet).
  bash "$SUJET" regrouper-series 2>&1 | sed 's#^série #[sujets] REGROUPÉE série #; s#^#  #'
  # La file, lue une fois. Illisible (file.sh en 5, rien sur sa sortie) : aucun geste, et `TENUS` reste tel quel.
  liste=$(bash "$outils/file.sh") && lue=1 || lue=''
  # Sous-PR en route, « sujet<TAB>numéro<TAB>état », dans l'ordre de file.sh (numéro croissant).
  enroute=$(awk -F '\t' -v s="$sautees" 'index(s, " " $1 " ") == 0 && match($2, /^sujet\/[^ ]+ : /) {
      e = substr($2, RLENGTH + 1)
      if (e == "prête" || e == "prête (sans CI)" || e == "prête (en conflit)" || e == "CI en cours") print substr($2, 1, RLENGTH - 3) "\t" $1 "\t" e
    }' <<<"$liste")
  # Qui tient déjà chaque sujet qui a plusieurs sous-PR en route, au début du tour (en-tête : marque d'un autre
  # capitaine, mémoire, « CI en cours »).
  while IFS= read -r sujet; do
    par=''
    for n in $(awk -F '\t' -v s="$sujet" '$1 == s { print $2 }' <<<"$enroute"); do
      verrou=$(verrou_d_un_autre "$n" </dev/null)
      [ -n "$verrou" ] || continue
      if [ "$verrou" = panne ]; then
        echo "[#$n] REPRISE à la veille suivante : commentaires de #$n illisibles (GitHub), aucune sous-PR de $sujet n'est prise à ce tour"
        suspendus="$suspendus$sujet "
        break
      fi
      echo "[#$n] marque de passage d'un autre capitaine ($verrou) : elle tient $sujet"
      par=$n
      break
    done
    case "$suspendus" in
      # Suspendu : la mémoire est gardée (celle que la boucle tenait, encore en route), personne n'est pris.
      *" $sujet "*)
        par=$(awk -F ':' -v s="$sujet" '$1 == s { print $2; exit }' "$TENUS" 2>/dev/null)
        par=$(awk -F '\t' -v s="$sujet" -v m="$par" '$1 == s && $2 == m { print $2 }' <<<"$enroute") ;;
    esac
    if [ -z "$par" ] && [[ "$suspendus" != *" $sujet "* ]]; then
      par=$(awk -F ':' -v s="$sujet" '$1 == s { print $2; exit }' "$TENUS" 2>/dev/null)
      par=$(awk -F '\t' -v s="$sujet" -v m="$par" '$1 != s { next } $2 == m { g = $2 } $3 == "CI en cours" && !c { c = $2 } END { print (g ? g : c) }' <<<"$enroute")
    fi
    [ -z "$par" ] || tenus="$tenus$sujet:$par "
  done < <(awk -F '\t' '$1 != "" && ++k[$1] == 2 { print $1 }' <<<"$enroute")
  # Le corps lit /dev/null, jamais l'entrée de la boucle : un outil lancé qui lit son entrée (pnpm, un hook, `cat`)
  # mangeait les lignes suivantes de file.sh, et les sous-PR suivantes n'étaient pas traitées dans le tour.
  # Celles qui tiennent déjà leur sujet d'abord, puis les autres lignes dans l'ordre de file.sh. La file lue jusqu'au
  # bout, `tenus` est gardé dans `TENUS` pour le tour suivant (dans le sous-shell du tube, où il vit).
  awk -F '\t' -v t="$tenus" '$1 == "" { next } { s = $2; sub(/ : .*/, "", s) }
    index(t, " " s ":" $1 " ") { print; next } { reste = reste $0 "\n" } END { printf "%s", reste }' <<<"$liste" |
  while IFS="$(printf '\t')" read -r n etat _ livre || { [ -z "$lue" ] || tr ' ' '\n' <<<"$tenus" >"$TENUS"; false; }; do
    case " $sautees " in *" $n "*) continue ;; esac
    # Ticket d'un sujet déjà livré : PR directe vers develop, `hors-sujet` posé.
    if [ -n "$livre" ]; then
      poser_label "$n" hors-sujet &&
        commenter "$n" "$(printf 'Le sujet de ce ticket est déjà livré dans develop : PR laissée vers \`develop\` (label \`hors-sujet\`), jamais reciblée sur la branche de sujet.\n\n---\n_Generated by [Claude Code](https://claude.ai/code)_')" &&
        echo "[#$n] hors-sujet posé ($livre)"
    fi </dev/null
    tient='' geste=''
    case "$etat" in
      sujet/*' : prête' | sujet/*' : prête (sans CI)' | sujet/*' : prête (en conflit)' | sujet/*' : CI en cours')
        tient=${etat%% : *}
        case "$suspendus" in *" $tient "*) echo "[#$n] sautée à ce tour : $tient suspendu (lecture GitHub en panne)"; continue ;; esac
        case "$tenus" in
          *" $tient:$n "*) ;;
          *" $tient:"*)
            par=${tenus#*" $tient:"}
            echo "[#$n] attend son tour : #${par%% *} passe d'abord dans $tient"
            continue ;;
          *) tenus="$tenus$tient:$n " ;;
        esac ;;
    esac
    case "$etat" in
      'vers sujet/'*)
        sujet=${etat#vers sujet/}
        bash "$SUJET" regrouper "$sujet" "$n" 2>&1 | sed "s#^#[\#$n] #"
        rc=${PIPESTATUS[0]}
        case "$rc" in
          0) echo "[#$n] REGROUPÉE dans sujet/$sujet (son ticket le déclare)" ;;
          6) echo "[#$n] PAS PROPRE : worktree du capitaine à nettoyer, regroupement repris au tour suivant (aucun renvoi)" ;;
          *) echo "[#$n] regroupement dans sujet/$sujet impossible (SUJET EN CONFLIT ?)" ;;
        esac ;;
      'prête (à recibler sur sujet/'*)
        sujet=${etat#prête (à recibler sur }
        sujet=${sujet%)}
        gh api -X PATCH "$DEPOT/pulls/$n" -f base="$sujet" >/dev/null && echo "[#$n] RECIBLÉE sur $sujet (parente fusionnée dedans)" ;;
      sujet/*': prête (sans CI)' | sujet/*': prête (en conflit)')
        bash "$SUJET" relancer "$n" 2>&1 | tee "$sortie" | sed "s#^#[\#$n] #"
        rc=${PIPESTATUS[0]}
        # Une sous-PR de fourche : classée à part, elle rend son sujet (`fourche_sautee`, A-201).
        [ "$rc" != 7 ] || ! fourche_sautee "$n" "$sortie" || rc=fourche
        geste="sortie $rc de relancer"
        [ "$rc" != 7 ] || geste="$geste$(date_du_verrou "$n" "$sortie")"
        case "$rc" in
          # Conflit hors index : `relancer` écrit `conflit avec <sujet> hors index générés :`, puis les fichiers indentés de
          # deux espaces ; la liste s'arrête à la première autre ligne (fin de ligne CRLF tolérée).
          2)
            fichiers=$(awk -v d="conflit avec ${etat%% :*} hors index générés :" '{ sub(/\r$/, "") } index($0, d) == 1 { f = 1; next } f && /^  [^ ]/ { sub(/^  /, ""); printf "%s`%s`", (k++ ? ", " : ""), $0; next } { f = 0 }' "$sortie")
            bash "$outils/renvoyer.sh" "$n" "conflit avec ${etat%% :*} hors index générés : ${fichiers:-voir la sortie de sujet.sh relancer}. Fusionner ${etat%% :*} dans la branche et le résoudre" ;;
          # Classée sur la DERNIÈRE ligne de relancer (son `sortir`), jamais sur un motif cherché dans toute la sortie :
          # celle d'un hook relayée peut porter ces mots. Trace de husky (A-22) : le pre-push refuse la mise à jour,
          # la sous-PR est renvoyée avec la sortie du hook. Toute autre sortie 3 (rien à pousser, conflit apparu
          # entre le contrôle et la fusion, hook de commit) reste silencieuse : le tour suivant la rejuge.
          3)
            fin=$({ grep . "$sortie" || true; } | tail -n 1 | tr -d '\r')
            if [[ "$fin" == "mise à jour de #$n refusée par le hook pre-push"* ]]; then
              bash "$outils/renvoyer.sh" "$n" "le pre-push refuse le push de la mise à jour avec ${etat%% :*}. Sortie du hook : $(extrait_hook "$sortie")"
            fi ;;
          4) bash "$outils/refus.sh" "$n" "$sortie" ;; # tête gardée : renvoyée avec le motif
          6) echo "[#$n] PAS PROPRE : worktree du capitaine à nettoyer, sous-PR laissée dans la file (aucun renvoi)" ;;
          5) echo "[#$n] REPRISE au tour suivant (sous-PR bougée ou GitHub illisible), aucun renvoi" ;;
          fourche) echo "[#$n] sous-PR de fourche, sautée (aucun renvoi) : elle ne tient pas ${etat%% :*}" ;;
          7) echo "[#$n] en passage chez un autre capitaine : sautée (aucun renvoi)" ;;
          # Push refusé par le distant, sans trace du hook : côté capitaine ou du distant, jamais un renvoi.
          11) echo "[#$n] ÉCHEC DU CAPITAINE : sous-PR laissée dans la file (aucun renvoi), cause ci-dessus" ;;
          # Passage interrompu par un signal (129 et plus ; 128 est une erreur fatale de git, A-161) : état inconnu.
          129 | 1[3-9][0-9] | 2[0-9][0-9]) echo "[#$n] ÉCHEC DU CAPITAINE : passage interrompu par un signal (sortie $rc), état de la sous-PR inconnu : laissée dans la file (aucun renvoi)" ;;
        esac
        # Mise à jour poussée (0), reprise (5, 6, 11), verrou d'un autre capitaine (7) ou passage interrompu par un
        # signal (129 et plus) : le sujet reste tenu. Renvoyée (2, 4, 3 du pre-push), ou sortie 3 muette (rien de
        # poussé, et rien ne dit qu'elle passera un jour) : rendu.
        case "$rc" in 0 | 5 | 6 | 7 | 11 | 129 | 1[3-9][0-9] | 2[0-9][0-9]) ;; *) tenus=${tenus/" $tient:$n "/ } ;; esac ;;
      sujet/*': prête')
        # Passé l'échéance, aucun `sujet.sh fusionner` (il peut attendre une CI) : le code remonte du sous-shell.
        ! echeance_passee || exit "$ECHEANCE_TUBE"
        bash "$SUJET" fusionner "$n" 2>&1 | tee "$sortie" | sed "s#^#[\#$n] #"
        rc=${PIPESTATUS[0]}
        [ "$rc" != 7 ] || ! fourche_sautee "$n" "$sortie" || rc=fourche
        geste="sortie $rc de fusionner"
        [ "$rc" != 7 ] || geste="$geste$(date_du_verrou "$n" "$sortie")"
        case "$rc" in
          0) echo "[#$n] FUSIONNÉE dans ${etat%%:*}" ;;
          # Checks rouges, conflit avec le sujet, hook : le motif est celui de sujet.sh, jamais un conflit supposé.
          3) bash "$outils/refus.sh" "$n" "$sortie" 3 ;;
          4) bash "$outils/refus.sh" "$n" "$sortie" ;; # corrigeable (titre, revue, base) : renvoyée
          5) echo "[#$n] REPRISE au tour suivant (sous-PR ou sujet bougé, checks en cours, GitHub illisible), aucun renvoi" ;;
          # Worktree du capitaine sale : rien que l'auteur puisse corriger, jamais un renvoi.
          6) echo "[#$n] PAS PROPRE : worktree du capitaine à nettoyer, sous-PR laissée dans la file (aucun renvoi)" ;;
          fourche) echo "[#$n] sous-PR de fourche, sautée (aucun renvoi) : elle ne tient pas ${etat%% :*}" ;;
          7) echo "[#$n] sous-PR non éligible (fermée, en brouillon, ou en passage chez un autre capitaine)" ;;
          8) echo "[#$n] MISE À JOUR avec ${etat%% :*} poussée, CI pas finie : repasse au tour suivant" ;;
          # Arbre du squash ≠ arbre testé : arrêt. Le `while` tourne dans le sous-shell du tube : le code remonte
          # après lui (PIPESTATUS), et la boucle sort en 12.
          12) echo "ARRÊT sur #$n (sortie 12) : arbre du squash ≠ arbre testé"; exit 12 ;;
          # Outil du capitaine en échec, ou push refusé par le distant : rien que la session puisse corriger.
          11) echo "[#$n] ÉCHEC DU CAPITAINE : sous-PR laissée dans la file (aucun renvoi), cause ci-dessus" ;;
          # Passage interrompu par un signal (129 et plus ; 128 est une erreur fatale de git, A-161) : état inconnu.
          129 | 1[3-9][0-9] | 2[0-9][0-9]) echo "[#$n] ÉCHEC DU CAPITAINE : passage interrompu par un signal (sortie $rc), état de la sous-PR inconnu : laissée dans la file (aucun renvoi)" ;;
          *) echo "[#$n] sous-PR non éligible (sortie $rc)" ;;
        esac
        # Reprise (5, 6, 11), verrou d'un autre capitaine (7), CI de la mise à jour en cours (8) ou passage interrompu
        # par un signal (129 et plus) : le sujet reste tenu. Fusionnée (0), renvoyée (3, 4) ou sortie non classée (2,
        # le sujet en conflit avec develop : la PR de mise à jour qui le résout est plus loin dans la file) : rendu.
        case "$rc" in 5 | 6 | 7 | 8 | 11 | 129 | 1[3-9][0-9] | 2[0-9][0-9]) ;; *) tenus=${tenus/" $tient:$n "/ } ;; esac ;;
    esac </dev/null
    # Le sujet reste tenu après le passage de celle qui le tient : dit à chaque tour, avec la raison.
    case "$tenus" in *" ${tient:-?}:$n "*) echo "[$tient] tenu par #$n (${geste:-CI en cours})" ;; esac
  done
  rc=${PIPESTATUS[1]}
  [ "$rc" != 12 ] || exit 12
  [ "$rc" != "$ECHEANCE_TUBE" ] || finir_echeance
  # Sujets finis : PR finale ouverte, elle entre dans la file au tour suivant.
  verifier_arret
  bash "$SUJET" livrer-prets 2>&1 | sed 's#^#[sujets] #; s#PR \(\#[0-9]*\) ouverte#LIVRÉ : PR \1 ouverte#'
  git switch -q --detach origin/develop 2>/dev/null || true
}

# Extrait de la sortie du hook pre-push, pour le renvoi : les huit dernières lignes préfixées `[git push …]`
# (pousser, github.sh) avant « push refusé par le hook pre-push », préfixe et accents graves retirés, jointes par
# « ; », coupées à 1 500 caractères, repassées par masquer_url : le commentaire est public.
extrait_hook() {
  local extrait
  extrait=$(awk '/^push refusé par le hook pre-push/ { exit } /^\[git push [^]]*\] / { sub(/^\[git push [^]]*\] /, ""); l[++n] = $0 }
    END { for (i = (n > 8 ? n - 7 : 1); i <= n; i++) printf "%s%s", (i > (n > 8 ? n - 7 : 1) ? " ; " : ""), l[i] }' "$1" | tr -d '`\r')
  node -e 'process.stdout.write([...process.argv[1]].slice(0, 1500).join(""))' "$extrait" | masquer_url
}

# Sortie de passer.sh gardée pour lire la cause (fichiers en conflit, checks rouges).
sortie=$(mktemp)
erreurs_file=$(mktemp)
trap 'rm -f "$sortie" "$erreurs_file"' EXIT
passer() {
  verifier_arret
  verifier_echeance
  bash "$outils/passer.sh" "$1" 2>&1 | tee "$sortie"
  return "${PIPESTATUS[0]}"
}

sautees=${BOUCLE_SAUTEES:- }
# Sans CI déclenchée : mises de côté jusqu'à la prochaine fusion (develop aura bougé).
attente_fusion=${BOUCLE_ATTENTE:- }
rafraichir_sujets
while :; do
  verifier_arret
  verifier_echeance
  rafraichir_outils "$@"
  traiter_rouges
  traiter_sujets
  # La file se lit avec son code : illisible (5), une pause puis le tour suivant ; un autre échec arrête la boucle.
  # Jamais FILE VIDE sur un échec.
  liste=$(bash "$outils/file.sh" 2>"$erreurs_file") && rc=0 || rc=$?
  cat "$erreurs_file" >&2
  case "$rc" in
    0) ;;
    5) mettre_en_pause PAUSE "(file.sh, sortie 5) : file illisible" "$erreurs_file"; continue ;;
    *) echo "ARRÊT : file.sh en échec (sortie $rc) : le capitaine traite, puis relance"; exit 6 ;;
  esac
  n=$(printf '%s\n' "$liste" | awk -F '\t' -v s="$sautees$attente_fusion" '!t && $2 ~ /^prête/ && $2 !~ /sur sujet\// && index(s, " " $1 " ") == 0 { print $1; t = 1 }')
  [ -n "$n" ] || break
  echo "[#$n] DÉBUT $(date +%H:%M)"
  passer "$n"
  rc=$?
  if [ "$rc" = 1 ]; then
    # Erreur inattendue (souvent un 502 passager de l'API GitHub) : un second essai.
    echo "[#$n] erreur inattendue, second essai dans 30 s"
    sleep 30
    passer "$n"
    rc=$?
  fi
  if [ "$rc" = 5 ]; then
    echo "[#$n] a bougé ou GitHub illisible, second essai"
    passer "$n"
    rc=$?
  fi
  # La dernière ligne de passer.sh, préfixée `[#<n>] ` (son `sortir`) : seule elle décide de la suite.
  derniere=$(grep -a "^\[#$n\] " "$sortie" | tail -n 1 | tr -d '\r')
  echo "[#$n] sortie=$rc $(date +%H:%M)"
  case "$rc" in
    0) attente_fusion=' ' ;;
    # Develop ou la PR a bougé deux fois, ou GitHub illisible : pause, puis le tour suivant. Jamais un arrêt.
    5) mettre_en_pause "[#$n] PAUSE" "(sortie 5) : $derniere" "$sortie" ;;
    2)
      fichiers=$(awk -v d="[#$n] conflit avec develop hors index générés" 'index($0, d) == 1 { f = 1; next } f && /^  / { sub(/^  /, ""); printf "%s`%s`", (n++ ? ", " : ""), $0 }' "$sortie")
      # Renvoyée, la PR perd `à-fusionner` : elle sort de la file d'elle-même et y revient,
      # dans ce même tour, dès que sa session la corrige. Sautée seulement si le renvoi échoue.
      bash "$outils/renvoyer.sh" "$n" "conflit avec develop à la mise à jour (hors index générés et hors règle de pile) : $fichiers. Fusionner develop dans la branche et le résoudre" ||
        sautees="$sautees$n " ;;
    3)
      # Classée sur la dernière ligne `[#<n>] ` (le `sortir` de passer.sh), jamais sur un motif cherché dans toute la
      # sortie : celle d'un hook relayée peut porter ces messages (un pre-push qui joue les bancs en écrit les titres).
      if [[ "$derniere" == "[#$n] checks exigés rouges"* ]]; then
        # Rouge sur le sommet poussé : `traiter_rouges` relance, puis renvoie au second échec.
        echo "[#$n] checks rouges au passage : relance au prochain tour"
      elif [[ "$derniere" == *"CI non déclenchée"* ]]; then
        echo "[#$n] sans CI : de côté jusqu'à la prochaine fusion"
        attente_fusion="$attente_fusion$n "
      elif [[ "$derniere" == "[#$n] push refusé par le hook pre-push"* ]]; then
        # Trace de husky : le hook refuse la mise à jour, la PR est à corriger. Renvoyée avec la sortie du hook ;
        # sautée si le renvoi échoue. Un refus du distant (sans trace) tombe dans l'ARRÊT ci-dessous.
        bash "$outils/renvoyer.sh" "$n" "le pre-push refuse le push de la mise à jour avec develop. Sortie du hook : $(extrait_hook "$sortie")" ||
          sautees="$sautees$n "
      else
        echo "ARRÊT sur #$n (sortie $rc)"; exit "$rc"
      fi ;;
    4)
      # Refus que l'auteur peut corriger (titre, revue adversariale…) : la session est prévenue
      # avec le motif, la PR ne reste pas en file muette (#1414). Sautée si le renvoi échoue.
      bash "$outils/refus.sh" "$n" "$sortie" || sautees="$sautees$n " ;;
    7) sautees="$sautees$n " ;; # rien à corriger côté auteur (empilée, brouillon, déjà renvoyée)
    # Fusionnée, mais le code entré n'est pas celui que la CI a jugé : passer.sh a commenté la PR ; un humain examine.
    12) echo "ARRÊT sur #$n (sortie 12) : arbre du squash ≠ arbre testé"; exit 12 ;;
    *) echo "ARRÊT sur #$n (sortie $rc)"; exit "$rc" ;;
  esac
done
verifier_arret
rafraichir_sujets
attente=$(bash "$outils/file.sh" | awk -F '\t' '$2 ~ /CI en cours$/ { printf " #%s", $1 }')
echo "FILE VIDE $(date +%H:%M)${attente:+ (CI en cours :$attente)}"
# Pour le compte rendu : sujets prêts à livrer, et séries de la file à proposer au regroupement.
echo "SUJETS"; bash "$SUJET" etat 2>/dev/null || true
echo "SÉRIES restantes (préfixe de branche ou prio:haute : à proposer, sujet.sh regrouper <nom> <pr>…)"; bash "$SUJET" series 2>/dev/null || true
