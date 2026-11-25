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
#                         qui a déjà des commits partis de develop reste intacte et reçoit la suite
#                         qui les reprend sur une branche neuve partie du sujet (cherry-pick, jamais
#                         de rebase ni de push forcé)
#   ouvrir <nom> [--specs <pr>]
#                         crée sujet/<nom> depuis develop, sans protection de branche ;
#                         `--specs` recible sur le sujet la PR de specs du lot
#   fusionner <pr>        squash d'une sous-PR dans son sujet : titre qui passe commitlint, revue exigée selon le régime
#                         (A-97 ; en régime 8, un tour de relecture validé pour le contenu de son sommet, contrôlé deux
#                         fois : avant le premier contrôle d'ascendance, puis juste avant la fusion, A-105), puis la
#                         règle d'ascendance (`ascendance` de github.sh) : en conflit avec le sujet hors index, renvoi
#                         avant toute CI ; en retard, documentation comprise, ou en conflit d'index seul, mise à jour
#                         avec le sujet et poussée ; puis, trois tours au plus : CI exigée attendue sur le sommet
#                         (`attendre_ci`), sujet relu, contrôle refait, squash sur `à-jour` seulement, et arbre du squash
#                         comparé à l'arbre testé (lancé par le capitaine pour une sous-PR étiquetée `à-fusionner`) ;
#                         PR de mise à jour (la fusion de develop dans le sujet, conflit résolu, puis des
#                         retouches) : entre par avance rapide, sans squash, si elle a cette forme (voir « PR de
#                         mise à jour » plus bas), sinon sortie 4
#   rafraichir <nom> [--abandon-si-conflit]
#                         fusionne develop dans sujet/<nom> (jamais de rebase), index régénérés ;
#                         `--abandon-si-conflit` (capitaine) annule la fusion au lieu de la laisser en cours
#   livrer <nom> <titre>  ouvre la PR sujet/<nom> → develop, SANS `à-fusionner` (la session qui livre le pose après la
#                         relecture de la PR) ; sans `gh` utilisable, écrit le titre et le corps dans un fichier et sort
#                         en 14 (ouverture par l'outil GitHub MCP) ; refuse une migration
#                         plus ancienne que la dernière de develop, et tant qu'une sous-PR est ouverte ;
#                         livraison intermédiaire (carte avant `5-livraison`) : la PR part de `livraison/<nom>-<date>`, jetable, et `sujet/<nom>` survit
#   livrer-prets [--dry-run]
#                         (capitaine) livre et étiquette `à-fusionner` chaque sujet « prêt à livrer », sauf label `sujet-manuel` :
#                         plus de sous-PR ouverte, ET tickets déclarés (`Sujet:`) tous faits ou label
#                         `sujet-auto` (né d'un regroupement) : un ticket pas commencé n'a pas de PR
#                         (#575, 15/10) ; `--dry-run` affiche sans rien écrire
#   relancer <pr>         sous-PR sans CI ou en conflit (reciblée depuis une pile, ou que GitHub ne sait pas fusionner) :
#                         lit d'abord la règle d'ascendance (`ascendance` de github.sh) sur le sommet lu avec la PR ;
#                         en retard, ou en conflit sur des index générés seuls : son sujet fusionné dans sa branche
#                         comme par `fusionner` (index régénérés, commit, push), ce qui lance sa CI (jamais de rebase
#                         ni de force) ; conflit hors index : sortie 2, la ligne `conflit avec <base> hors index
#                         générés :` puis chaque fichier hors index générés, indenté de deux espaces, branche intacte ;
#                         déjà à jour : 3 ; mise à jour refusée par le pre-push : 3, dernière ligne `mise à jour de #<n>
#                         refusée par le hook pre-push…` ; sous-PR qui a bougé depuis sa lecture : 5
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
#                         courante qui n'y sont pas : geste d'écriture d'une session sur un sujet, avec geler/degeler
#                         (le hook d'agent refuse tout `git push` vers sujet/…). Chaque commit modifie en
#                         place UN fichier docs/**/*.map.md et rien d'autre (ni création, ni suppression,
#                         ni renommage, ni mode), dont la ligne `Sujet:` nomme sujet/<nom> avant comme
#                         après (seul, ou parmi plusieurs : `Sujet: sujet/a, sujet/b`), et ce fichier est
#                         formaté par Prettier. Une branche en retard
#                         rattrape le sujet par `git merge --ff-only` ; historique divergent, commit de
#                         fusion ou option (jamais de push forcé) : sortie 9, rien n'est poussé
#   a-juger <sommet> <base> [<pr>]
#                         lecture (check `pr-titre` du socle), sans appel GitHub ni réseau : les fichiers que `fusionner`
#                         juge avant les checks, un par ligne (le diff depuis le départ du sujet, ou la résolution d'une PR
#                         de mise à jour) ; pour une PR de mise à jour, une ligne vide puis ceux qu'il juge après (résolution
#                         et retouches) ; refus de forme d'une PR de mise à jour : 4 et son motif ; refs absentes ou clone
#                         superficiel : 11
#   est-livraison <tête> <sommet>
#                         lecture (check `pr-titre`), sans appel GitHub ni réseau : 0 livraison de sujet prouvée (tête
#                         `sujet/<nom>` au sommet d'origin/sujet/<nom>, ou livraison intermédiaire que `livraison_intermediaire` de github.sh reconnaît,
#                         comme passer.sh), 1 PR ordinaire (revue exigée), 11 refs absentes ou clone superficiel
#   carte (sans argument) « ticket<TAB>sujet » pour chaque ticket qui déclare un sujet (develop et sujets)
#   de <ticket>           sujet d'un ticket
#   etat                  tableau des sujets ouverts : avance, retard, sous-PR, tickets, verdict
#                         (`en cours`, `prêt à livrer`, `livré #n`, `gelé` : le gel prime sur les autres)
#   geler <nom> "<raison>"  gèle le chantier : écrit `Gel: AAAA-MM-JJ — <raison>` dans la fiche de la carte
#                         et le pousse sur origin/sujet/<nom> (commit construit sur origin/sujet/<nom>, sans
#                         toucher à la branche courante ni à l'arbre de travail ; sans force, sous le hook pre-push, qui
#                         contrôle l'arbre de travail ; sujet qui a bougé : un second essai, puis sortie 9). Refuse (4) un sujet sans carte
#                         sur sa branche, une raison vide, un sujet déjà gelé. Plus aucune session ne part
#                         de ce sujet (`demarrer`), plus aucune de ses PR n'entre (`livrer`, `fusionner`,
#                         état « gelée » de file.sh). Un sujet gelé reste rafraîchi par la boucle
#   degeler <nom>         vide la ligne `Gel:` (sortie 0, rien de poussé, si le sujet n'est pas gelé)
#   gel <nom>             lecture : écrit la valeur de `Gel:` (fiche de la carte sur origin/sujet/<nom>) et
#                         sort en 0 si le sujet est gelé, 1 sinon. Toute valeur non vide gèle, datée ou non
#                         (ligne écrite à la main dans l'éditeur de GitHub)
#   clore <nom>           supprime `origin/sujet/<nom>`, un sujet livré, par `git push origin :refs/heads/sujet/<nom>` :
#                         jamais d'option, jamais de force, pas de `--force-with-lease`. Refuse (4) tant que son
#                         sommet n'est pas contenu dans `origin/develop`, qu'une PR ouverte l'a pour base ou pour
#                         tête, ou que sa carte, lue sur develop, n'est pas en `6-nettoyage` ou `fini` (`sujet_livre` ;
#                         un sujet sans carte ne se clôt pas), ou que son sommet est postérieur au passage de la carte
#                         en `6-nettoyage` ou `fini` (sujet rouvert sous le même nom). Les références se lisent en
#                         toutes lettres (`refs/remotes/origin/…`) ; aucun état local ne décide (objets de remplacement et greffes
#                         ignorés, URL de push divergente refusée en 4, `gh` vise le dépôt de `origin`). Le sommet est relu juste
#                         avant la suppression : s'il a bougé, sortie 5, rien n'est supprimé. Une suppression refusée
#                         (hook pre-push, protection de branche, proxy d'une session cloud) sort en 3 : la branche
#                         reste, et la sortie dit de la jouer d'un poste local. Sujet déjà absent : sortie 0. GitHub ou
#                         origin illisible, ou suppression non confirmée par une relecture de origin : 11
#
# Sorties : 0 fait · 2 conflit · 3 checks rouges, ou fusion, commit ou push refusé par un hook git
# (sa sortie sur stderr : la lire, corriger, jamais en sautant le hook ; le pre-push contrôle l'arbre de travail) · 4 refus corrigeable par l'auteur (sa
# dernière ligne est le motif, `fusionner` : titre, commitlint, revue (en régime 8 : aucun tour validé pour le sommet),
# lien symbolique sur un index généré, base ; `fusionner` et `relancer` : tête gardée, develop, main, la branche par défaut ou un sujet) · 6 arbre de travail pas
# propre (`fusionner`, `rafraichir`, `regrouper`, `relancer` : à nettoyer par qui lance, jamais un renvoi de la PR,
# comme la sortie 6 de passer.sh) · 7 `fusionner` d'une PR fermée, en brouillon ou d'un sujet gelé (rien à
# corriger : sautée), et en régime 8 d'une sous-PR dont la lecture est illisible (A-113) ou qui a perdu `à-fusionner`
# juste avant la fusion ; 7 aussi pour `fusionner` et `relancer` d'une sous-PR en passage chez un autre capitaine (son
# commentaire marqué `<!-- capitaine:passage <id> <epoch> -->`, verrou du passage de github.sh), ou qui n'est plus éligible une fois
# le verrou pris · 64 `fusionner` sans CAPITAINE_ID ou avec un CAPITAINE_ID mal formé ; `relancer` avec un CAPITAINE_ID mal
# formé (sans lui, joué à la main par la session propriétaire : aucun verrou posé, et il le dit) · 9 `carte <nom>` refusée, ou `geler`/`degeler` dont le push échoue deux fois (rien n'est poussé)
# 14 `livrer` : `gh` inutilisable ou lecture GitHub en échec, PR non ouverte, fichier de livraison écrit (ouvrir par l'outil GitHub MCP)
# `fusionner`, `rafraichir`, `relancer`, `livrer` : 5 la branche a bougé pendant l'écriture, relancer ; `relancer` : 5 aussi sur une PR illisible (GitHub)
# `fusionner` encore : la sous-PR a bougé pendant sa mise à jour, ses checks sont encore en cours après l'attente sur un
# sommet que le capitaine n'a pas poussé, ou le sujet a bougé trois fois pendant la CI (reprise au tour suivant, aucun
# renvoi : la PR reste dans la file tant que sa CI ne finit pas), ou GitHub illisible (lire_github de github.sh : réponse
# vide, non JSON, corps d'erreur ou code non nul, à la lecture de la PR, des checks exigés ou des checks du sommet) :
# jamais lu comme un état · 8 `fusionner` : sous-PR mise à jour avec son sujet et
# poussée, CI pas finie : aucun squash, repasse au tour suivant · 12 `fusionner` : arbre du squash ≠ arbre testé :
# commentaire marqué sur la PR, `à-fusionner` retiré, la boucle s'arrête · 11 `fusionner` d'une sous-PR : contrôle
# d'ascendance illisible, côté capitaine, aucun renvoi · 11 `fusionner` d'une PR de mise à jour : échec côté capitaine (git sans
# `merge-tree --write-tree`, dépendances, régénération, commit ou push refusé), rien à corriger côté PR,
# aucun renvoi · 11 push refusé par le distant sans trace du hook pre-push (tout geste qui pousse : `fusionner`,
# `rafraichir`, `relancer`, `livrer`, `ouvrir`, `geler`, `degeler` ; la trace de husky 9 seule fait un refus du hook,
# sortie 3), ou outil du capitaine en échec : aucun renvoi · 11 `clore` : origin ou GitHub illisible, ou suppression
# non confirmée · 11 `fusionner`, `relancer` : verrou du passage non posé (écriture refusée), aucun renvoi ; ses
# commentaires illisibles à la relecture sortent en 5 · 11 `relancer` : contrôle d'ascendance illisible, côté capitaine, aucun renvoi · 11 `fusionner` : réglage du dépôt (une règle de checks exigés vide sur develop, ticket 91), aucun renvoi · `clore` : 3 suppression refusée par
# un hook ou par le distant, 4 refus (pas livré, PR ouverte, carte, nom ou option), 5 le sommet a bougé · 69 jq absent du poste
# Tout passe par l'API REST (`gh api`) : GraphQL est refusé depuis les sessions cloud. Depuis la
# racine du dépôt ; sans argument, affiche cette aide.
# =============================================================================
set -euo pipefail
# github.sh : à côté (scripts/chaine/ du projet, ou copie des outils du capitaine), sinon dans le skill fusionner.
ici=$(cd "$(dirname "$0")" && pwd)
if [ -f "$ici/github.sh" ]; then . "$ici/github.sh"; else . "$ici/../../fusionner/scripts/github.sh"; fi
cd "$(git rev-parse --show-toplevel)"

sortir() { echo "$2"; exit "$1"; }
# Clone superficiel : merge-base faux (même parade que passer.sh). Les lectures du check `pr-titre` (`a-juger`,
# `est-livraison`) n'appellent pas le réseau : sur un clone superficiel, elles sortent en 11.
case ${1:-} in
  a-juger | est-livraison)
    [ "$(git rev-parse --is-shallow-repository)" = false ] ||
      sortir 11 "clone superficiel : merge-base faux ; git fetch --unshallow d'abord (actions/checkout : fetch-depth: 0)"
    ;;
  *) [ "$(git rev-parse --is-shallow-repository)" = false ] || git_masque fetch -q --unshallow origin ;;
esac

GENERES=$(index_generes_regex) # scripts/docs/index-generes.json ; regenerer_index : github.sh

# Tickets rattachés à un sujet : ligne `Sujet: sujet/<nom>` (ou `- **Sujet :** sujet/<nom>`) en tête
# du ticket, ou de sa spec
# (alors valable pour tous ses tickets). Lue sur develop et sur chaque branche de sujet, car le
# découpage d'un lot peut entrer directement dans son sujet. Sortie : « ticket<TAB>nom », le
# ticket en `SPEC_ALL_SOC-1.02` ou, pour une spec, `SPEC_ALL_SOC-1` (lus dans le nom du fichier par
# identifiant.mjs, la grammaire du skill `tickets`).
LIGNE_SUJET='^(- )?\**Sujet ?:\** *sujet/[a-z0-9][a-z0-9-]*'
branches_sujet() { git for-each-ref --format='%(refname:short)' 'refs/remotes/origin/sujet/*'; }
# `carte` rapatrie develop et les sujets, et élague les refs `origin/sujet/*` dont le sujet a été supprimé du
# distant (`--prune` limité au refspec des sujets : ni origin/develop ni une autre ref distante). Chaque commande qui
# lit `branches_sujet` appelle `carte` d'abord, dans le même processus. Un fetch en échec se dit sur la sortie
# d'erreur, puis les refs locales sont lues : hors réseau, `etat` et la file répondent encore.
carte() {
  git fetch -q --prune origin develop '+refs/heads/sujet/*:refs/remotes/origin/sujet/*' 2>/dev/null ||
    echo "sujet.sh : fetch d'origin impossible : refs locales de develop et des sujets lues telles quelles (un sujet supprimé peut y paraître)" >&2
  carte_lue
}
# Un ticket ou une spec n'a qu'un sujet : la ligne `Sujet:` qui en nomme plusieurs
# (`Sujet: sujet/a, sujet/b` ou `sujet/a sujet/b`) n'est lue que par `demarrer`, qui la refuse ;
# seule une carte de chantier (`docs/**/*.map.md`) peut couvrir plusieurs sujets.
LIGNE_PLUSIEURS="${LIGNE_SUJET}[[:space:],]+sujet/.*"
# « ticket<TAB>valeurs » pour chaque ticket ou spec dont une ligne `Sujet:` nomme plusieurs sujets.
declarations_multiples() {
  # shellcheck disable=SC2046
  { git grep -E -m1 -o "$LIGNE_PLUSIEURS" origin/develop $(branches_sujet) -- \
    'docs/*.spec.md' 'docs/*.issue.md' ':!docs/*/issues/archive/*' 2>/dev/null || true; } |
    sed -E 's#^[^:]+:##; s#:(- )?\**Sujet ?:\** *#\t#' |
    identifiant fichiers | sort -u
}
# Valeurs de la ligne `Sujet:` qui fait foi pour un ticket (la sienne, sinon celle de sa spec) quand
# elle nomme plusieurs sujets ; vide sinon. À lire après `carte` (qui rapatrie les branches).
sujets_multiples_du_ticket() {
  local t=$1 cible
  cible=${t%.*}
  [ -z "$(carte_lue | awk -F '\t' -v t="$t" '$1 == t { print "oui" }')" ] || cible=$t
  declarations_multiples | awk -F '\t' -v c="$cible" '$1 == c && !f { print $2; f = 1 }'
}
carte_lue() {
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

# awk lit tout le flux : `grep -m1` fermerait le tube, git show recevrait SIGPIPE, et sous pipefail un bloquant fait passerait pour « pas encore fait ».
fait_sur() {
  git show "$1:$2" | awk '!vu && /^(- )?\**Status\**[[:space:]]*:/ { vu = 1; l = tolower($0); if (l ~ /:\** *(resolved|fait|done)/) ok = 1 } END { exit !ok }'
}

# Garde-fous de `demarrer` (cas vécus) : la spec et le ticket doivent être sur la base
# (une branche partie d'une branche de specs non fusionnée tombe en conflit au squash des specs),
# et chaque `Blocked by:` y être fait (jamais de fusion locale d'une dépendance non fusionnée).
verifier_ticket() {
  local id=$1 ref=$2 base=${2#origin/} spec fichier b fb manquants='' illisibles=''
  spec=$(fichier_sur "$ref" "${id%.*}")
  [ -n "$spec" ] || sortir 4 "la spec ${id%.*} n'est pas encore sur $base : sa PR de specs n'est pas fusionnée.
Ne pas partir de la branche de specs. La faire fusionner dans $base d'abord (\`sujet.sh ouvrir <nom> --specs <pr>\`
la recible sur le sujet) ; si elle est déjà dans develop, le capitaine la reporte dans le sujet de lui-même dès que sa
file vers develop est vide (A-69) : attendre, ou l'écrire à ton conducteur (à qui t'a lancé), qui le demande au capitaine ; une session ne lance jamais \`sujet.sh rafraichir\`."
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

# Une carte de chantier peut couvrir plusieurs sujets : `Sujet: sujet/a, sujet/b, sujet/c` (virgules,
# espaces tolérées autour). Elle « nomme » `sujet/<nom>` quand l'une de ses valeurs l'est exactement ;
# une ligne dont une valeur n'est pas `sujet/<nom-en-kebab>` (espace seul pour séparateur, virgule en
# trop) ne nomme personne : jamais de demi-lecture. Lit la même forme que son équivalent JS,
# `nomsDeSujets` (skill `tickets`, scripts/docs/ligne-sujet.mjs), hors tiret final ou double, que le
# gate refuse avant. `nomme(ligne, sujet/<nom>)` reçoit la ligne entière.
AWK_NOMME='function nomme(l, s,    n, v, i) {
  sub(/^(- )?\**Sujet ?:\**[ \t]*/, "", l); sub(/[[:space:]]+$/, "", l)
  n = split(l, v, /[ \t]*,[ \t]*/)
  for (i = 1; i <= n; i++) if (v[i] !~ /^sujet\/[a-z0-9][a-z0-9-]*$/) return 0
  for (i = 1; i <= n; i++) if (v[i] == s) return 1
  return 0
}'
# Vrai si la carte reçue sur l'entrée standard a une ligne `Sujet:` qui nomme le sujet <nom>.
carte_nomme_le_sujet() {
  awk -v s="sujet/$1" "$AWK_NOMME"' /^(- )?\**Sujet ?:/ { if (nomme($0, s)) ok = 1 } END { exit !ok }'
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
    git show "refs/remotes/origin/develop:$f" | carte_nomme_le_sujet "$nom" || continue
    trouve=1
    phase=$(git show "refs/remotes/origin/develop:$f" | grep -m1 -E '^Phase ?:' | sed -E 's/^Phase ?: *//; s/[[:space:]]*$//') || true
    case "$phase" in 6-nettoyage* | fini*) return 0 ;; esac
  done < <(git ls-tree -r --name-only refs/remotes/origin/develop -- docs | grep -E '\.map\.md$' | grep -v '/gabarits/' || true)
  [ -z "$trouve" ] || return 1
  git ls-remote --exit-code --heads origin "sujet/$nom" >/dev/null 2>&1 && return 1
  [ -n "$(git log refs/remotes/origin/develop --merges -1 --format=%H -E \
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
      git show "$ref:$f" | carte_nomme_le_sujet "$nom" || continue
      phase=$(git show "$ref:$f" | grep -m1 -E '^Phase ?:' | sed -E 's/^Phase ?: *//; s/[[:space:]]*$//') || true
      break
    done < <(git ls-tree -r --name-only "$ref" -- docs | grep -E '\.map\.md$' | grep -v '/gabarits/' || true)
    [ -z "$phase" ] || break
  done
  printf '%s\n' "$phase"
}

# Gel du chantier (A-11) : ligne `Gel:` de la fiche de la carte, lue sur origin/sujet/<nom> seul (la
# carte y vit jusqu'à la livraison). Valeur non vide = gelé, quelle que soit sa forme. Sans réseau :
# l'appelant a déjà rapatrié le sujet (la commande `gel` le fait).
# Fichier de la carte du sujet sur une référence ; vide si le sujet n'en a pas.
carte_fichier() {
  local ref=$1 nom=$2 f
  while IFS= read -r f; do
    git show "$ref:$f" | carte_nomme_le_sujet "$nom" || continue
    printf '%s\n' "$f"
    return 0
  done < <(git ls-tree -r --name-only "$ref" -- docs 2>/dev/null | grep -E '\.map\.md$' | grep -v '/gabarits/' || true)
}
# Valeur de `Gel:` (vide si absente ou vide), cherchée dans la seule section `## Fiche`.
gel_de() {
  local nom=${1#sujet/} f
  git rev-parse -q --verify "origin/sujet/$nom" >/dev/null || return 0
  f=$(carte_fichier "origin/sujet/$nom" "$nom")
  [ -n "$f" ] || return 0
  git show "origin/sujet/$nom:$f" | awk '
    /^## / { fiche = ($0 ~ /^## Fiche[[:space:]]*$/); next }
    fiche && !trouve && /^(- )?\**Gel ?:/ { l = $0; sub(/^(- )?\**Gel ?:\** */, "", l); sub(/[[:space:]]+$/, "", l); print l; trouve = 1 }'
}
# `sujet.sh gel <nom>` : écrit la valeur, sortie 0 si gelé, 1 sinon.
gel() {
  local nom=${1:?nom du sujet} v
  nom=${nom#sujet/}
  git fetch -q origin "+refs/heads/sujet/$nom:refs/remotes/origin/sujet/$nom" 2>/dev/null || true
  v=$(gel_de "$nom")
  [ -n "$v" ] || return 1
  printf '%s\n' "$v"
}

# Réécrit la ligne `Gel:` de la fiche (stdin → stdout) : remplace la ligne en place, l'ajoute après la
# dernière ligne de la fiche quand elle manque ; sortie 3 sans section `## Fiche`.
reecrire_gel() {
  # La raison passe par l'environnement : `awk -v` interprète les séquences `\n`, `\t`…
  VALEUR=$1 awk '
    BEGIN { v = ENVIRON["VALEUR"] }
    function ligne() { return "Gel:" (v == "" ? "" : " " v) }
    function sortie() { if (fiche && !fait) { print ligne(); fait = 1 } printf "%s", blancs; blancs = ""; fiche = 0 }
    /^## / { sortie(); fiche = ($0 ~ /^## Fiche[[:space:]]*$/); vu = vu || fiche; print; next }
    fiche && !fait && /^(- )?\**Gel ?:/ { printf "%s", blancs; blancs = ""; print ligne(); fait = 1; next }
    fiche && /^[[:space:]]*$/ { blancs = blancs $0 "\n"; next }
    fiche { printf "%s", blancs; blancs = ""; print; next }
    { print }
    END { sortie(); if (!vu) exit 3 }'
}

# Pousse sur origin/sujet/<nom> un commit qui n'a changé que la ligne `Gel:` de la carte : construit
# par plomberie sur un index temporaire, sans toucher à la branche courante ni à l'arbre de travail.
ecrire_gel() {
  local nom=$1 valeur=$2 message=$3 essai statut f mode blob idx tree commit nouveau formate
  for essai in 1 2; do
    git fetch -q origin "+refs/heads/sujet/$nom:refs/remotes/origin/sujet/$nom" 2>/dev/null || sortir 9 "origin/sujet/$nom introuvable"
    f=$(carte_fichier "origin/sujet/$nom" "$nom")
    [ -n "$f" ] || sortir 4 "sujet/$nom n'a pas de carte sur sa branche (un docs/**/*.map.md dont la ligne Sujet: nomme sujet/$nom) : un sujet sans carte ne se gèle pas"
    mode=$(git ls-tree "origin/sujet/$nom" -- "$f" | awk '{ print $1 }')
    nouveau=$(git show "origin/sujet/$nom:$f" | reecrire_gel "$valeur") ||
      sortir 4 "la carte $f n'a pas de section « ## Fiche » : y ajouter la ligne Gel: à la main"
    # Prettier formate la carte quand il est là (le gate des cartes l'exige) ; sinon, texte tel quel.
    formate=$(printf '%s\n' "$nouveau" | pnpm exec prettier --stdin-filepath "$f" 2>/dev/null || true)
    [ -z "$formate" ] || nouveau=$formate
    blob=$(printf '%s\n' "$nouveau" | git hash-object -w --stdin)
    idx=$(mktemp -u)
    GIT_INDEX_FILE=$idx git read-tree "origin/sujet/$nom"
    GIT_INDEX_FILE=$idx git update-index --cacheinfo "$mode,$blob,$f"
    tree=$(GIT_INDEX_FILE=$idx git write-tree)
    rm -f "$idx"
    commit=$(git commit-tree "$tree" -p "origin/sujet/$nom" -m "$message")
    pousser "$commit:refs/heads/sujet/$nom" "sujet/$nom" "$(git rev-parse "origin/sujet/$nom")" && statut=0 || statut=$?
    if [ "$statut" = 0 ]; then
      git fetch -q origin "+refs/heads/sujet/$nom:refs/remotes/origin/sujet/$nom" 2>/dev/null || true
      return 0
    fi
    [ "$statut" != 4 ] || sortir 11 "gel de sujet/$nom : push refusé par le distant, sans trace du hook pre-push : côté capitaine ou du distant, rien à corriger côté PR ; sortie ci-dessus"
    [ "$statut" = 5 ] || sortir 3 "le pre-push a contrôlé l'arbre de travail, pas le gel : relancer depuis un arbre vert (un worktree détaché sur origin/develop, après pnpm install), jamais en sautant le hook"
  done
  sortir 9 "le push sur sujet/$nom a échoué deux fois (le sujet bouge) : relancer"
}

geler() {
  local nom=${1:?nom du sujet} raison=${2-} actuel
  nom=${nom#sujet/}
  [[ "$nom" =~ ^[a-z0-9][a-z0-9-]*$ ]] || sortir 4 "nom de sujet en kebab-case attendu : $nom"
  raison=$(tr '\n\r' '  ' <<<"$raison" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')
  [ -n "$raison" ] || sortir 4 "une raison est obligatoire : sujet.sh geler $nom \"<raison>\""
  git fetch -q origin "+refs/heads/sujet/$nom:refs/remotes/origin/sujet/$nom" 2>/dev/null ||
    sortir 4 "origin/sujet/$nom introuvable : un sujet sans branche ne se gèle pas"
  actuel=$(gel_de "$nom")
  [ -z "$actuel" ] || sortir 4 "sujet/$nom est déjà gelé : Gel: $actuel"
  ecrire_gel "$nom" "$(date -u +%Y-%m-%d) — $raison" "docs: gèle le chantier sujet/$nom"
  echo "sujet/$nom gelé : plus aucune session n'en part, plus aucune de ses PR n'entre"
}

degeler() {
  local nom=${1:?nom du sujet}
  nom=${nom#sujet/}
  git fetch -q origin "+refs/heads/sujet/$nom:refs/remotes/origin/sujet/$nom" 2>/dev/null ||
    sortir 4 "origin/sujet/$nom introuvable"
  if [ -z "$(gel_de "$nom")" ]; then
    echo "sujet/$nom n'est pas gelé : rien à faire"
    return 0
  fi
  ecrire_gel "$nom" "" "docs: dégèle le chantier sujet/$nom"
  echo "sujet/$nom dégelé. Le conducteur ne se réveille pas tout seul : le prévenir (send_message) s'il vit encore,"
  echo "sinon relancer le chantier par le skill chantier avec le nom du sujet."
}

# Refus (4) d'un sujet gelé : la ligne en place est citée.
refuser_si_gele() {
  local g
  g=$(gel_de "$1")
  [ -z "$g" ] || sortir 4 "sujet/${1#sujet/} est gelé (Gel: $g) : plus aucune session n'en part, plus aucune PR n'y entre. Dégeler d'abord (sujet.sh degeler ${1#sujet/}) ou demander au produit."
}

# Régime 8 (A-97, lot 5c) : ce que la session fait une fois sa PR poussée, vers <base> (develop ou sujet/<nom>). Écrit
# quand la base porte la clé `relecture` : la PR qui part maintenant sera en régime 8.
demande_de_relecture() {
  echo "régime 8 : relecture indépendante ; le dernier push fait, PR hors brouillon, demander la relecture : $DEMANDE_DE_RELECTURE ; puis l'étiquette à-relire,"
  echo "jamais à-fusionner : le Relecteur la pose sur un verdict validé, puis le capitaine la fusionne dans $1 quand sa CI est verte."
}

demarrer() {
  local arg=${1:?identifiant de ticket (SPEC_ALL_SOC-1.02) ou nom de sujet}
  local nom branche courante ticket='' ref present='' multiple
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
      ! cle_relecture_sur origin/develop || demande_de_relecture develop
      return 0
    fi
    multiple=$(sujets_multiples_du_ticket "$arg")
    [ -z "$multiple" ] || sortir 4 "$arg déclare plusieurs sujets (Sujet: $multiple) : un ticket se démarre sur un seul sujet.
Seule une carte de chantier (docs/**/*.map.md) peut en nommer plusieurs. Déclarer un seul sujet dans le ticket
ou dans sa spec (ligne « Sujet: sujet/<nom> »), puis relancer."
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
    ! cle_relecture_sur origin/develop || demande_de_relecture develop
    return 0
  fi
  # `git ls-remote` plutôt que `gh api` : marche aussi sans `gh` authentifié (session cloud).
  git ls-remote --exit-code --heads origin "$branche" >/dev/null 2>&1 || ouvrir "$nom"
  git_masque fetch -q origin develop "$branche"
  refuser_si_gele "$nom"
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
    # Jamais de rebase ni de push forcé : les commits passent sur une branche neuve, l'ancienne reste.
    local neuve="$courante-sur-sujet"
    echo "$courante porte déjà des commits partis de develop : on ne la rebase pas, on ne pousse jamais en force."
    echo "Reprendre ses commits sur une branche neuve partie du sujet (arbre de travail propre d'abord) :"
    echo "  git switch --no-track -c $neuve origin/$branche"
    echo "  git cherry-pick --no-merges origin/develop..$courante"
    echo "  git push -u origin $neuve"
    echo "En conflit : résoudre, git add, git cherry-pick --continue (ou --abort : rien n'est perdu, l'ancienne branche reste ; après --abort, $neuve existe déjà : la reprendre par git switch $neuve, pas par -c)."
    echo "Ouvrir la PR de $neuve vers $branche ; fermer celle de $courante en citant la nouvelle."
    echo "$courante reste sur origin, intacte : sa suppression n'est pas un geste de session."
    sortir 4 "puis relancer demarrer depuis $neuve"
  fi
  echo "base=$branche"
  echo "$courante part de $branche ($(git rev-parse --short "origin/$branche")) : la PR vise $branche,"
  # Le message suit le régime qu'aura la PR (A-97, lot 5c) : la clé `relecture` sur sa base, et une PR ouverte maintenant.
  if cle_relecture_sur "origin/$branche"; then
    demande_de_relecture "$branche"
  else
    echo "label à-fusionner dès le push ; le capitaine la fusionne dans le sujet quand sa CI est verte."
  fi
}

ouvrir() {
  local nom=${1:?nom du sujet} specs=''
  [ "${2:-}" != --specs ] || specs=${3:?numéro de la PR de specs}
  nom=${nom#sujet/}
  [[ "$nom" =~ ^[a-z0-9][a-z0-9-]*$ ]] || sortir 4 "nom en kebab-case attendu : $nom"
  local branche="sujet/$nom" statut
  if git ls-remote --exit-code --heads origin "$branche" >/dev/null 2>&1; then
    [ -n "$specs" ] || sortir 4 "$branche existe déjà"
    recibler_specs "${specs#\#}" "$branche"
    return 0
  fi
  # Création par `git push` : le proxy des sessions cloud refuse `POST git/refs` (403).
  git_masque fetch -q origin develop
  pousser "origin/develop:refs/heads/$branche" "$branche" "" && statut=0 || statut=$?
  case $statut in
    0) ;;
    5) sortir 4 "$branche existe déjà" ;;
    3) sortir 3 "ouverture de $branche refusée par le hook pre-push : sortie ci-dessus" ;;
    *) sortir 11 "ouverture de $branche : push refusé par le distant, sans trace du hook pre-push : côté capitaine ou du distant, rien à corriger côté PR ; sortie ci-dessus" ;;
  esac
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

# Sous-PR en retard sur son sujet (règle d'ascendance, `ascendance` de github.sh : `retard` ou `conflit-index`),
# documentation comprise : le capitaine met la branche à jour (merge, avance rapide, jamais de force : la branche
# appartient à une autre session), régénère les index (un index ne se fusionne jamais à la main : en conflit, la
# version du sujet, puis la régénération fait foi), committe et pousse ; `SOMMET_POUSSE` est le nouveau sommet, dont
# l'appelant attend la CI. Conflit hors index : annulé, sortie 3 (renvoi), branche intacte. La branche part du sommet
# déjà jugé (`<sommet>`) : une tête qui a bougé depuis porte des commits ni revus, ni contrôlés (liens sur les index,
# commitlint) : sortie 5, rien n'est poussé, la sous-PR est rejugée au tour suivant.
mettre_a_jour_sous_pr() {
  local n=$1 base=$2 tete=$3 juge=$4 conflits autres sortie statut avant fusion_en_cours=0
  [ -z "$(git status --porcelain)" ] || sortir 6 "arbre de travail pas propre : committer ou ranger d'abord, puis relancer (rien à corriger côté PR)"
  git_masque fetch -q origin "+refs/heads/$tete:refs/remotes/origin/$tete"
  avant=$(git rev-parse "origin/$tete")
  [ "$avant" = "$juge" ] ||
    sortir 5 "la sous-PR #$n a bougé depuis sa lecture ($(git rev-parse --short "$juge") jugé, $(git rev-parse --short "$avant") sur sa branche) : rien n'est poussé, reprise au tour suivant, aucun renvoi"
  git switch -q -C "capitaine/$n" "$avant"
  local echec
  echec() {
    git merge --abort 2>/dev/null || git reset -q --hard
    git switch -q --detach origin/develop
    sortir 3 "$1 : mise à jour de #$n avec $base annulée"
  }
  if ! sortie=$(fusionner_avec "origin/$base" 3>&2 2>&1); then
    fusion_en_cours=1
    conflits=$(git diff --name-only --diff-filter=U)
    if [ -z "$conflits" ]; then # aucun fichier en conflit : un refus (hook commit-msg, fichier non suivi écrasé)
      printf '%s\n' "$sortie" | masquer_url >&2
      annuler_fusion
      git switch -q --detach origin/develop
      sortir 3 "fusion de $base dans #$n refusée par un hook git ou un fichier non suivi : sortie ci-dessus ; corriger, jamais en sautant le hook"
    fi
    autres=$(printf '%s\n' "$conflits" | grep -Ev "$GENERES" || true)
    if [ -n "$autres" ]; then
      annuler_fusion
      git switch -q --detach origin/develop
      sortir 3 "fusion refusée par GitHub (conflit avec $base hors index générés : $(tr '\n' ' ' <<<"$autres")) : renvoi"
    fi
    # shellcheck disable=SC2086
    git checkout --theirs -- $conflits && git add -- $conflits
  fi
  pnpm install --frozen-lockfile --prefer-offline >/dev/null 2>&1 || echec "pnpm install en échec"
  regenerer_index || echec "gate des index/registres en échec"
  if [ "$fusion_en_cours" = 1 ]; then
    jouer_ou_dire "git commit -q --no-edit" || echec "commit refusé par un hook git (sortie ci-dessus)"
  elif ! git diff --cached --quiet; then
    jouer_ou_dire "git commit -q -m 'docs: régénère les index après mise à jour avec $base'" ||
      echec "commit refusé par un hook git (sortie ci-dessus)"
  fi
  pousser "HEAD:refs/heads/$tete" "$tete" "$avant" && statut=0 || statut=$?
  if [ "$statut" != 0 ]; then
    git switch -q --detach origin/develop
    [ "$statut" != 3 ] || sortir 3 "mise à jour de #$n refusée par le hook pre-push : sortie ci-dessus"
    [ "$statut" = 5 ] || sortir 11 "mise à jour de #$n : push refusé par le distant, sans trace du hook pre-push : côté capitaine ou du distant, rien à corriger côté PR ; sortie ci-dessus"
    sortir 5 "la sous-PR #$n a bougé : mise à jour non poussée, la boucle la reprendra"
  fi
  SOMMET_POUSSE=$(git rev-parse HEAD)
  git switch -q --detach origin/develop
  echo "#$n en retard sur $base : mise à jour poussée ($(git rev-parse --short "$SOMMET_POUSSE")), attente de la CI"
}

# Sous-PR dont la tête est develop, main, la branche par défaut ou un sujet : mettre_a_jour_sous_pr et
# relancer y pousseraient la fusion du sujet. Une sous-PR part d'une branche de travail : sortie 4.
refuser_tete_gardee() {
  local tete
  tete=$(jq -r .head.ref <<<"$2")
  if tete_gardee "$tete" "$(jq -r '.base.repo.default_branch // ""' <<<"$2")" || [[ "$tete" == sujet/* ]]; then
    sortir 4 "#$1 : tête $tete, branche gardée (develop, main, la branche par défaut ou un sujet) : le capitaine n'y pousse jamais ; ouvrir la sous-PR depuis une branche de travail"
  fi
}

# Recette et corps type de la PR : skill sujet, section « Recevoir develop dans un sujet ».
# PR de mise à jour d'un sujet : develop fusionné dans le sujet par une session, quand le capitaine ne le peut pas
# (`rafraichir`, sortie 2 : un conflit de code ; sortie 3 : une fusion sans conflit que les hooks refusent, par
# exemple `pnpm check` rouge après la montée d'un formateur dans develop) et qu'aucune session ne pousse (le hook
# refuse tout push vers sujet/…). Une session fille, lancée pour ce geste, la fait dans une branche de travail :
#   git fetch origin '+refs/heads/develop:refs/remotes/origin/develop' '+refs/heads/sujet/<nom>:refs/remotes/origin/sujet/<nom>'
#                                            refspecs explicites : un clone `--single-branch` (tout clone superficiel)
#                                            ne crée ni ne met à jour origin/sujet/<nom> sur un simple `git fetch origin develop sujet/<nom>`
#   git switch -c maj/<nom> origin/sujet/<nom>
#   bash -c '. scripts/chaine/github.sh && fusionner_avec origin/develop'
#                                            `git merge origin/develop`, avec la mention de `fusionsSansEffet` quand
#                                            elle s'applique (le hook qui a refusé `rafraichir` refuserait la fusion nue) ;
#                                            sans conflit, git committe la fusion ; sinon conflit résolu, puis
#                                            `git add <fichiers résolus>` ; un index généré en conflit ne
#                                            s'édite pas (le hook le refuse) : `git checkout --theirs -- <index>`,
#                                            puis `git add <index>`, le capitaine le régénère
#   pnpm install --frozen-lockfile --prefer-offline
#                                            les outils de la fusion avant son commit : le pre-commit formate
#                                            les fichiers qu'il indexe, avec le Prettier installé
#   git commit --no-edit                     (conflit seulement) message de git, sans ligne `Sujet:`
#   retouches                                commits ordinaires après la fusion, jamais une seconde fusion :
#                                            ce que develop exige du sujet (`pnpm exec prettier --write <fichiers>`,
#                                            en-têtes d'un ticket), message Conventional Commits sans ligne `Sujet:`.
#                                            Chaque retouche se relit comme une sous-PR : après une montée d'outil,
#                                            la session joue la revue de ticket sur ses retouches
#   git push origin HEAD:maj/<nom>           arbre propre : le pre-push joue `pnpm check` sur l'arbre de travail,
#                                            le sommet, retouches comprises ; la fusion seule n'est jamais poussée.
#                                            Il juge l'arbre de travail, pas ce qui part : `git push <sha>:maj/<nom>`
#                                            depuis un autre arbre passe le hook ; seule la CI exigée sur le sommet,
#                                            que `fusionner` lit, fait foi
#   puis PR vers sujet/<nom>, titre `chore(sujet): met <nom> à jour avec develop`, étiquetée `à-fusionner`, une
#   section « Retouches » (fichier, raison) pour le relecteur, que le capitaine ne lit jamais, et une section de
#   revue (« Revue de ticket ») dès qu'une retouche touche du code ou ce que la chaîne exécute, formatage compris
# Le capitaine la reconnaît : hors du sujet et de develop, une fusion dont les deux parents sont hors de cette plage
# (son premier commit). Une sous-PR dont la fusion vient après un commit ordinaire (le capitaine y a fusionné le
# sujet) garde le chemin ordinaire (sujet rafraîchi, puis squash).
est_mise_a_jour() {
  local m
  while IFS= read -r m; do
    [ -n "$m" ] || continue
    [ -n "$(git rev-list -n 1 "$m^@" "^origin/$2" ^origin/develop)" ] || return 0
  done <<<"$(git rev-list --merges "$1" "^origin/$2" ^origin/develop)"
  return 1
}

# Elle n'entre que si elle a cette forme, sinon sortie 4 (motif à la session) :
#   - hors du sujet et de develop, une seule fusion, son premier commit, puis des retouches l'une après l'autre ;
#   - la fusion : un message sans ligne `Sujet:` ni `Merge pull request` (`sujet_livre` les cherche dans les fusions de
#     develop), deux parents, le sommet du sujet d'abord (avance rapide, et `livrer` lit le sujet par ses premiers
#     parents), puis un commit de develop absent du sujet ; un arbre qui ne s'écarte de la fusion recalculée (`git
#     merge-tree`, git ≥ 2.38, comme passer.sh) que sur les fichiers en conflit et les index régénérés (le formatage que
#     le pre-commit de la session met dans la fusion n'est pas prouvé : il vient en retouche, après elle) ;
#   - chaque retouche : un message sans ces lignes, que commitlint accepte (il entre tel quel dans develop).
# L'écart se lit sans détection des renommages : un fichier supprimé derrière un chemin en conflit recréé compte.
# A_JUGER, que `fusionner` passe à la revue exigée : l'écart de la fusion (index compris) et les fichiers en conflit.
# MAJ_APRES : l'union des fichiers que chaque retouche touche, commit par commit, que juger_retouches passe à la
# revue après les checks. Aucune retouche n'est dispensée : chacune se juge comme une sous-PR, et le capitaine n'installe
# rien et ne joue aucun formateur pour une PR de mise à jour (décision A-47 ter). Un outil du capitaine en échec (git
# sans `merge-tree --write-tree`) : sortie 11, rien à corriger côté PR.
verifier_mise_a_jour() {
  local n=$1 sommet=$2 base=$3 s c f p1 p2 reste fusion rc ecart regeneres fichiers hors
  local -a chaine
  s=$(git rev-parse "origin/$base")
  mapfile -t chaine < <(git rev-list --first-parent "$sommet" "^origin/$base" ^origin/develop)
  [ "$(git rev-list --merges --count "$sommet" "^origin/$base" ^origin/develop)" = 1 ] &&
    [ "${#chaine[@]}" = "$(git rev-list --count "$sommet" "^origin/$base" ^origin/develop)" ] ||
    sortir 4 "#$n, PR de mise à jour : une seule fusion de develop dans $base, son premier commit, puis des retouches l'une après l'autre ; jamais une seconde fusion. Refaire la réception depuis le sujet à jour, en une seule fusion : git fetch origin '+refs/heads/develop:refs/remotes/origin/develop' '+refs/heads/$base:refs/remotes/origin/$base' ; git switch -c maj/${base#sujet/}-2 origin/$base ; bash -c '. scripts/chaine/github.sh && fusionner_avec origin/develop' (conflits résolus dans cette fusion) ; retouches en commits après elle ; nouvelle PR vers $base, puis fermer celle-ci (skill sujet, « Recevoir develop dans un sujet »)"
  MAJ_M=${chaine[-1]}
  ! grep -qE '^(- )?\**Sujet ?:|^Merge pull request' <<<"$(git log -1 --format=%B "$MAJ_M")" ||
    sortir 4 "#$n, PR de mise à jour : le message de la fusion porte une ligne « Sujet: » ou « Merge pull request » : refaire la fusion avec le message de git"
  read -r _ p1 p2 reste <<<"$(git rev-list --parents -n 1 "$MAJ_M")"
  [ -n "$p2" ] && [ -z "$reste" ] ||
    sortir 4 "#$n, PR de mise à jour : une fusion à deux parents, le sommet de $base puis develop"
  [ "$p1" = "$s" ] ||
    sortir 4 "#$n, PR de mise à jour : le premier parent n'est pas le sommet de $base (le sujet a avancé, ou develop est le premier parent) : la refaire depuis origin/$base (skill sujet, « Recevoir develop dans un sujet »)"
  if ! git merge-base --is-ancestor "$p2" origin/develop || git merge-base --is-ancestor "$p2" "$s"; then
    sortir 4 "#$n, PR de mise à jour : le second parent n'est pas un commit de develop absent de $base"
  fi
  MAJ_APRES=''
  for c in "${chaine[@]:0:${#chaine[@]}-1}"; do
    ! grep -qE '^(- )?\**Sujet ?:|^Merge pull request' <<<"$(git log -1 --format=%B "$c")" ||
      sortir 4 "#$n, PR de mise à jour : la retouche $(git rev-parse --short "$c") porte une ligne « Sujet: » ou « Merge pull request » : la retirer du message"
    git log -1 --format=%B "$c" | pnpm exec commitlint >/dev/null 2>&1 ||
      sortir 4 "#$n, PR de mise à jour : message de la retouche $(git rev-parse --short "$c") refusé par commitlint (Conventional Commits) : il entre tel quel dans $base"
    # Chaque fichier que la retouche touche, contre son parent : un fichier ajouté puis retiré compte.
    fichiers=$(git -c core.quotePath=false diff --no-renames --name-only "$c^" "$c") ||
      sortir 11 "#$n : diff de la retouche $(git rev-parse --short "$c") illisible, côté capitaine : PR laissée dans la file"
    while IFS= read -r f; do
      [ -z "$f" ] || MAJ_APRES+="$f"$'\n'
    done <<<"$fichiers"
  done
  MAJ_APRES=$(sed '/^$/d' <<<"$MAJ_APRES" | sort -u)
  fusion=$(git -c core.quotePath=false merge-tree --write-tree --name-only --no-messages "$p1" "$p2") && rc=0 || rc=$?
  [ "$rc" -le 1 ] || sortir 11 "#$n : git merge-tree --write-tree en échec (git ≥ 2.38 requis), côté capitaine : PR laissée dans la file"
  MAJ_CONFLITS=$(sed -n '2,$p' <<<"$fusion")
  ecart=$(git -c core.quotePath=false diff --no-renames --name-only "$(sed -n 1p <<<"$fusion")" "$MAJ_M") ||
    sortir 11 "#$n : diff de la résolution illisible, côté capitaine : PR laissée dans la file"
  # La liste des index régénérés illisible (fonction absente, jq en échec) : jamais une garde ouverte. Un projet
  # sans index généré a une liste vide, `^()$`, qui ne prend aucun chemin.
  regeneres=$(index_regeneres_regex) && [ -n "$regeneres" ] ||
    sortir 11 "#$n : liste des index régénérés illisible (index_regeneres_regex de github.sh), côté capitaine : PR laissée dans la file"
  # Un chemin cité par git (`"apps/a\"b.ts"`) l'est de même dans les deux listes : la comparaison tient.
  hors=$(comm -23 <(printf '%s\n' "$ecart" | grep -Ev "$regeneres" | sed '/^$/d' | sort -u) <(printf '%s\n' "$MAJ_CONFLITS" | sort -u))
  [ -z "$hors" ] ||
    sortir 4 "#$n, PR de mise à jour : elle écrit hors des fichiers en conflit ($(tr '\n' ' ' <<<"$hors")) : la fusion n'apporte que la résolution, le reste vient en retouche, dans un commit après elle"
  # La revue porte sur l'écart et sur les fichiers en conflit : un conflit modifier/supprimer ou binaire dont la
  # résolution garde la version du sujet ne fait aucun écart avec l'arbre recalculé, qui la porte déjà.
  A_JUGER=$(printf '%s\n%s\n' "$ecart" "$MAJ_CONFLITS" | sed '/^$/d' | sort -u)
}

# Après les checks et les liens sur les index : la revue exigée juge la résolution et l'union des fichiers que chaque
# retouche touche, comme une sous-PR (documentation hors `docs/agents/` sans revue, le reste avec la section de revue).
# Rien ne s'exécute : ni pnpm install ni formateur. La section « Retouches » du corps n'est jamais lue.
juger_retouches() {
  local n=$1 motif
  motif=$(juger "$(printf '%s\n%s\n' "$A_JUGER" "$MAJ_APRES" | sed '/^$/d' | sort -u)") || sortir 4 "#$n $motif"
}

# Avance rapide du sujet jusqu'à la PR de mise à jour vérifiée : index régénérés et contrôlés sur son sommet
# (un commit de plus s'ils changent), puis `git push` simple, jamais forcé, sous les hooks. Un sujet qui a
# bougé depuis la lecture refuse le push : sortie 5, rien n'est écrasé ; au tour suivant, la PR, dont le
# premier parent n'est plus le sommet du sujet, est renvoyée (4). Dépendances, régénération, commit ou push
# refusés côté capitaine : sortie 11, rien à corriger côté PR, aucun renvoi. Entrée : la PR est fermée avec
# le sommet qui l'a fait entrer (GitHub peut l'avoir déjà marquée fusionnée), le tour suivant ne la squashe pas.
avancer_sujet() {
  local n=$1 base=$2 sommet=$3 avant statut tete
  [ -z "$(git status --porcelain)" ] || sortir 6 "arbre de travail pas propre : committer ou ranger d'abord, puis relancer (rien à corriger côté PR)"
  avant=$(git rev-parse "origin/$base")
  git switch -q --detach "$sommet"
  local echec
  echec() {
    git reset -q --hard
    git switch -q --detach origin/develop
    sortir 11 "$1, côté capitaine : #$n non fusionnée dans $base, PR laissée dans la file"
  }
  pnpm install --frozen-lockfile --prefer-offline >/dev/null 2>&1 || echec "pnpm install en échec"
  regenerer_index || echec "gate des index/registres en échec (sortie ci-dessus)"
  if ! git diff --cached --quiet; then
    jouer_ou_dire "git commit -q -m 'docs: régénère les index après mise à jour avec develop'" ||
      echec "commit refusé par un hook git (sortie ci-dessus)"
  fi
  tete=$(git rev-parse HEAD)
  pousser "HEAD:refs/heads/$base" "$base" "$avant" && statut=0 || statut=$?
  git switch -q --detach origin/develop
  case $statut in
    0) ;;
    5) sortir 5 "$base a bougé pendant l'avance : #$n non fusionnée, reprise au tour suivant" ;;
    3) sortir 11 "avance de $base refusée par le hook pre-push, côté capitaine : sortie ci-dessus, PR laissée dans la file" ;;
    *) sortir 11 "avance de $base : push refusé par le distant, sans trace du hook pre-push : côté capitaine ou du distant, rien à corriger côté PR ; sortie ci-dessus, PR laissée dans la file" ;;
  esac
  if [ "$(gh api "$DEPOT/pulls/$n" --jq .state 2>/dev/null)" = open ]; then
    commenter "$n" "Entrée dans $base par avance rapide au sommet $(git rev-parse --short "$tete") (mise à jour avec develop) : PR fermée par le capitaine." &&
      gh api -X PATCH "$DEPOT/pulls/$n" -f state=closed >/dev/null ||
      echo "#$n : PR NON fermée (gh refusé) : la fermer à la main, elle est déjà dans $base"
  fi
  echo "#$n fusionnée dans $base par avance rapide (mise à jour avec develop, $(git rev-parse --short "$sommet"))"
}

# Les fichiers que la revue exigée juge, avant les checks, pour la sous-PR <n> au sommet <sommet> vers <base> (sujet/<nom>,
# refs origin/<base> et origin/develop déjà là) : PR de mise à jour (`est_mise_a_jour`), sa résolution (`A_JUGER`, après
# `verifier_mise_a_jour`, qui sort en 4 sur une autre forme et pose aussi `MAJ_APRES`) ; sinon le diff depuis le point de
# départ de la sous-PR sur le sujet. Pose `FICHIERS_JUGES`, et `MAJ` (1 pour une PR de mise à jour, vide sinon). Une
# seule lecture pour `fusionner` et `a-juger` (le check `pr-titre` du socle, ticket 16).
fichiers_a_juger() {
  local n=$1 sommet=$2 base=$3
  MAJ=''
  if est_mise_a_jour "$sommet" "$base"; then
    verifier_mise_a_jour "$n" "$sommet" "$base"
    MAJ=1
    FICHIERS_JUGES=$A_JUGER
  else
    FICHIERS_JUGES=$(git -c core.quotePath=false diff --no-renames --name-only "$(git merge-base "$sommet" "origin/$base")" "$sommet")
  fi
}

# `a-juger <sommet> <base> [<n>]` : lecture, sans appel GitHub ni réseau. Écrit, un par ligne, les fichiers que
# `fusionner` passe à la revue exigée avant les checks : le diff depuis le départ du sujet, ou, pour une PR de mise à
# jour, sa résolution (`A_JUGER`) ; pour une PR de mise à jour seulement, une ligne vide puis la liste qu'il juge après
# les checks, l'union de la résolution et des retouches (`A_JUGER` et `MAJ_APRES`, `juger_retouches`). git n'écrit jamais
# un chemin vide : la ligne vide ne sépare que les deux listes. Refus de forme d'une PR de mise à jour : sortie 4, motif
# de `verifier_mise_a_jour`. Refs absentes : 11.
a_juger() {
  local sommet=${1:?sommet de la PR} base=${2:?base de la PR (sujet/<nom>)} n=${3:-?}
  [[ "$base" == sujet/* ]] || sortir 4 "a-juger : $base n'est pas une branche sujet/ (une PR vers develop se lit par git diff depuis le merge-base)"
  git rev-parse -q --verify "refs/remotes/origin/develop^{commit}" >/dev/null &&
    git rev-parse -q --verify "refs/remotes/origin/$base^{commit}" >/dev/null ||
    sortir 11 "refs absentes : origin/develop ou origin/$base introuvable, fetch d'abord"
  sommet=$(git rev-parse -q --verify "$sommet^{commit}") || sortir 11 "refs absentes : sommet $1 introuvable, fetch d'abord"
  MAJ_APRES=''
  fichiers_a_juger "$n" "$sommet" "$base"
  printf '%s\n' "$FICHIERS_JUGES" | sed '/^$/d' | sort -u
  [ -z "$MAJ" ] || { echo; printf '%s\n%s\n' "$A_JUGER" "$MAJ_APRES" | sed '/^$/d' | sort -u; }
}

# `est-livraison <tête> <sommet>` : lecture, sans appel GitHub ni réseau, pour une PR vers develop. Sortie 0 : livraison
# de sujet prouvée (tête `sujet/<nom>` dont le sommet est celui d'origin/sujet/<nom>, ou tête `livraison/<nom>-<AAAAMMJJ-HHMM>` que
# `livraison_intermediaire` de github.sh reconnaît, comme passer.sh) ; 1 : PR ordinaire, revue exigée ; 11 : refs
# absentes (origin/develop, le sommet, ou origin/sujet/<nom> d'une tête sujet/).
est_livraison() {
  local tete=${1:?tête de la PR} sommet=${2:?sommet de la PR} nom
  git rev-parse -q --verify "refs/remotes/origin/develop^{commit}" >/dev/null ||
    sortir 11 "refs absentes : origin/develop introuvable, fetch d'abord"
  sommet=$(git rev-parse -q --verify "$sommet^{commit}") || sortir 11 "refs absentes : sommet $2 introuvable, fetch d'abord"
  if [[ "$tete" == sujet/* ]]; then
    git rev-parse -q --verify "refs/remotes/origin/$tete^{commit}" >/dev/null ||
      sortir 11 "refs absentes : origin/$tete introuvable, fetch d'abord"
    # Un sommet étranger sous le nom du sujet n'est pas sa livraison : PR ordinaire, revue exigée.
    [ "$sommet" = "$(git rev-parse "refs/remotes/origin/$tete^{commit}")" ] || exit 1
    exit 0
  fi
  if [[ "$tete" =~ ^livraison/(.+)-[0-9]{8}-[0-9]{4}$ ]]; then
    nom=${BASH_REMATCH[1]}
    livraison_intermediaire "$nom" "$sommet" && exit 0
  fi
  exit 1
}

# Verrou du passage (`prendre_passage` de github.sh) sur la sous-PR `<n>`, lue dans `<json>` : tenue par un autre
# capitaine, sortie 7 ; commentaires illisibles à la relecture, sortie 5 (panne, aucun renvoi) ; commentaire non posé,
# sortie 11 (côté capitaine, aucun renvoi). Une seule trappe EXIT, posée avant `prendre_passage`, le termine
# à toute sortie, TERM et INT compris, même pendant sa pose ou sa relecture. Puis la PR relue : l'éligibilité a été lue avant le verrou, un autre capitaine a
# pu finir son passage entre les deux ; fermée, en brouillon, `fusion-bloquée` posé, `à-fusionner` retiré (s'il y était)
# ou sommet changé : sortie 7.
verrouiller() {
  local n=$1 lu=$2 statut relu raison
  # Trappe posée avant le verrou : un TERM ou un INT pendant sa pose ou sa relecture le termine (signal pendant le
  # POST, réponse perdue : finir_passage relit les commentaires et termine les marques vivantes du capitaine).
  trap 'finir_passage' EXIT
  trap 'exit 143' TERM
  trap 'exit 130' INT
  prendre_passage "$n" && statut=0 || statut=$?
  case $statut in
    0) ;;
    1) sortir 7 "#$n $PASSAGE_MOTIF" ;;
    3) sortir 5 "#$n : GitHub illisible à la lecture du verrou du passage (cause ci-dessus) : reprise au tour suivant, aucun renvoi" ;;
    *) sortir 11 "#$n : verrou du passage non posé (cause ci-dessus), côté capitaine : sous-PR laissée dans la file, aucun renvoi" ;;
  esac
  relu=$(pr_json "$n") || sortir 5 "#$n : GitHub illisible à la relecture de la PR, verrou pris (cause ci-dessus) : reprise au tour suivant, aucun renvoi"
  raison=$(jq -r --argjson lu "$lu" '[.labels[].name] as $l | ([$lu.labels[].name] | index("à-fusionner")) as $avait
    | if .state != "open" then "non ouverte" elif .draft != false then "en brouillon"
      elif ($l | index("fusion-bloquée")) != null then "label fusion-bloquée"
      elif $avait != null and ($l | index("à-fusionner")) == null then "sans le label à-fusionner"
      elif .head.sha != $lu.head.sha then "sommet changé" else "" end' <<<"$relu")
  [ -z "$raison" ] || sortir 7 "#$n : PR plus éligible une fois le verrou pris ($raison) : sautée"
}

# La suite d'une revue du capitaine (`revue_du_capitaine` de github.sh) : <n> <code> <sortie>. 0 : rien ; 1 : renvoi (4),
# le motif en dernière ligne ; 21 : lecture illisible, sautée sans renvoi (7, A-113) ; 5 : origin ou GitHub illisible
# (5, aucun renvoi) ; autre : côté capitaine (11, aucun renvoi).
juger_revue() {
  local n=$1 statut=$2 revu=$3
  case $statut in
    0) ;;
    1) sortir 4 "#$n $(tail -n 1 <<<"$revu")" ;;
    21) sortir 7 "#$n : $(tail -n 1 <<<"$revu") : sautée sans renvoi, son auteur n'y peut rien (le Relecteur prévient l'architecte)" ;;
    5) sortir 5 "#$n : origin ou GitHub illisible à la lecture des commentaires (cause ci-dessus) : reprise au tour suivant, aucun renvoi" ;;
    *) sortir 11 "#$n : revue du capitaine en échec (sortie $statut : $(tail -n 1 <<<"$revu")), côté capitaine : sous-PR laissée dans la file" ;;
  esac
}

# Régime 8, le second contrôle du verdict (A-105) : <n> <sommet fusionné> <fichiers du diff propre> <base>. Juste avant
# l'appel de fusion d'une sous-PR (l'ascendance rendue « à-jour »), ou avant d'avancer le sujet pour une PR de mise à
# jour. Les étiquettes y sont lues, ce que `fusionner` ne fait nulle part ailleurs : sans `à-fusionner` (le Relecteur l'a
# retirée), sautée (7) ; un push, reprise (5) ; puis les commentaires relus, un tour validé exigé pour ce sommet, sinon
# renvoi (4). Une mise à jour du capitaine garde le verdict (« même contenu propre », A-106). Aucune CI de plus.
verdict_avant_fusion() {
  local n=$1 sommet=$2 fichiers=$3 base=$4 relu raison revu statut
  relu=$(pr_json "$n") || sortir 5 "#$n : GitHub illisible à la relecture de la PR avant la fusion (cause ci-dessus) : reprise au tour suivant, aucun renvoi"
  raison=$(jq -r --arg s "$sommet" '[.labels[].name] as $l
    | if .state != "open" then "non ouverte" elif .draft != false then "en brouillon"
      elif ($l | index("à-fusionner")) == null then "sans le label à-fusionner"
      elif ($l | index("fusion-bloquée")) != null then "label fusion-bloquée"
      elif .head.sha != $s then "sommet changé" else "" end' <<<"$relu")
  case "$raison" in
    '') ;;
    'sommet changé') sortir 5 "la sous-PR #$n a reçu un push avant la fusion : reprise au tour suivant, aucun renvoi" ;;
    *) sortir 7 "#$n : PR plus éligible juste avant la fusion ($raison) : sautée" ;;
  esac
  revu=$(printf '%s\n' "$fichiers" | revue_du_capitaine "$relu" "$sommet" "$base") && statut=0 || statut=$?
  [ "$statut" != 1 ] || revu="$revu (contrôle juste avant la fusion)"
  juger_revue "$n" "$statut" "$revu"
  echo "#$n : verdict relu juste avant la fusion ($(head -n 1 <<<"$revu"))"
}

fusionner() {
  local n=${1:?numéro de la sous-PR}
  local pr base titre sommet longueur
  capitaine_id_valide "${CAPITAINE_ID-}" ||
    sortir 64 "CAPITAINE_ID absent ou mal formé (l'id de la session du capitaine, lettres, chiffres, - et _ : skill fusionner, « Mise en place ») : aucun passage"
  pr=$(pr_json "$n") || sortir 5 "#$n : GitHub illisible à la lecture de la PR (cause ci-dessus) : reprise au tour suivant, aucun renvoi"
  [ "$(jq -r .state <<<"$pr")" = open ] || sortir 7 "#$n n'est pas ouverte"
  [ "$(jq -r .draft <<<"$pr")" = false ] || sortir 7 "#$n est en brouillon"
  # Une PR de fourche : sautée sans renvoi, comme dans passer.sh (A-192, point 2), avant tout fetch de sa tête.
  [ "$(jq -r '.head.repo.full_name // ""' <<<"$pr")" = "$(jq -r '.base.repo.full_name // ""' <<<"$pr")" ] ||
    sortir 7 "#$n : PR de fourche ($(jq -r '.head.repo.full_name // "dépôt supprimé"' <<<"$pr")) : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi"
  base=$(jq -r .base.ref <<<"$pr")
  [[ "$base" == sujet/* ]] || sortir 4 "#$n vise $base, pas une branche sujet/ : elle passe par le capitaine"
  refuser_tete_gardee "$n" "$pr"
  # Sujet gelé : rien à corriger côté auteur (7), jamais 4 qui renverrait la PR à sa session.
  git fetch -q origin "+refs/heads/$base:refs/remotes/origin/$base" 2>/dev/null || true
  [ -z "$(gel_de "$base")" ] || sortir 7 "#$n : $base est gelé (Gel: $(gel_de "$base")) : sous-PR laissée dans la file"
  titre=$(jq -r .title <<<"$pr")
  sommet=$(jq -r .head.sha <<<"$pr")
  longueur=$(node -e 'console.log(String([...process.argv[1]].length))' "$titre (#$n)")
  [ "$longueur" -le 120 ] || sortir 4 "sujet du squash à $longueur caractères (> 120) : raccourcir le titre"
  # Le commit entre tel quel dans develop à la livraison : commitlint dès maintenant.
  printf '%s\n' "$titre (#$n)" | pnpm exec commitlint >/dev/null 2>&1 ||
    sortir 4 "titre refusé par commitlint (Conventional Commits) : $titre"
  # Revue adversariale (ADR « chaîne de production »), comme au passage vers develop : la livraison
  # du sujet en est dispensée, c'est donc ici qu'on l'exige.
  local revue motif fichiers corps maj=''
  revue="$ici/revue-exigee.mjs"
  [ -f "$revue" ] || revue="$ici/../../fusionner/scripts/revue-exigee.mjs"
  corps=$(jq -r '.body // ""' <<<"$pr")
  # Le contrat (chemins sensibles, fichier des critères) se lit sur le sujet, jamais dans la sous-PR.
  juger() { printf '%s\n' "$1" | node "$revue" "$corps" "$titre" "origin/$base"; }
  git_masque fetch -q origin develop "$base" "$(jq -r .head.ref <<<"$pr")"
  # PR de mise à jour : la revue porte d'abord sur la résolution seule, pas sur le develop apporté ; ses retouches
  # se jugent après les checks (juger_retouches).
  fichiers_a_juger "$n" "$sommet" "$base"
  maj=$MAJ
  fichiers=$FICHIERS_JUGES
  # La revue, selon le régime de la sous-PR (A-97, lot 5a : `revue_du_capitaine` de github.sh, le contrat lu sur le
  # sujet). Régime 7 : la section de revue, comme avant, sur la résolution seule d'une PR de mise à jour (ses retouches
  # se jugent après les checks). Régime 8 (A-91, A-105) : premier contrôle du verdict, juste après le jugement des
  # fichiers et avant le premier contrôle d'ascendance, pour une sous-PR ordinaire comme pour une PR de mise à jour (sur
  # sa résolution et ses retouches, la seconde liste de `a-juger`, ce que la relecture lit) : une sous-PR sans tour
  # validé est renvoyée sans mise à jour ni CI ; une lecture illisible (A-113) la fait sauter sans renvoi.
  # Une seule revue par passage (la suite M1 du lot 5) : pour une PR de mise à jour, le régime est lu d'abord sur le sujet
  # (`regime_de_la_pr`, sans réseau : le sujet vient d'être relu), et la revue reçoit d'emblée la liste de son régime.
  # Elle relit develop et les sujets : si elle lit un autre régime que celui lu d'abord (le contrat a changé entre les
  # deux), elle est rejouée une fois, sur la liste de ce régime.
  local revu statut lus prevu=7 lister
  lister() { if [ "$1" = 8 ] && [ -n "$maj" ]; then printf '%s\n%s\n' "$A_JUGER" "$MAJ_APRES" | sed '/^$/d' | sort -u; else printf '%s\n' "$fichiers"; fi; }
  [ -z "$maj" ] || prevu=$(regime_de_la_pr "$base" "$(jq -r '.created_at // ""' <<<"$pr")")
  lus=$(lister "$prevu")
  revu=$(printf '%s\n' "$lus" | revue_du_capitaine "$pr" "$sommet" "$base") && statut=0 || statut=$?
  REGIME=$(sed -n '1s/^régime \([78]\).*$/\1/p' <<<"$revu")
  if [ -n "$maj" ] && [ -n "$REGIME" ] && [ "$REGIME" != "$prevu" ] && { [ "$statut" = 0 ] || [ "$statut" = 1 ]; }; then
    lus=$(lister "$REGIME")
    revu=$(printf '%s\n' "$lus" | revue_du_capitaine "$pr" "$sommet" "$base") && statut=0 || statut=$?
    REGIME=$(sed -n '1s/^régime \([78]\).*$/\1/p' <<<"$revu")
  fi
  juger_revue "$n" "$statut" "$revu"
  # Régime 8, les gardes des fichiers sensibles (A-76, lot 5b), au même endroit, sur le même diff : un chemin sensible
  # hors de la ligne `Sensibles:` du ticket renvoie la sous-PR. Une PR de mise à jour (`maj/<nom>`) ne touche un chemin
  # sensible que s'il est en conflit dans sa fusion et couvert par la ligne d'un ticket du sujet (A-74).
  if [ "$REGIME" = 8 ]; then
    local garde conflits='' sujet_de=()
    if [ -n "$maj" ]; then
      conflits=$(mktemp)
      printf '%s\n' "$MAJ_CONFLITS" >"$conflits"
      sujet_de=(--conflits "$conflits" --tickets "$(carte | awk -F '\t' -v s="${base#sujet/}" '$2 == s { printf "%s%s", (n++ ? "," : ""), $1 }')")
    fi
    garde=$(printf '%s\n' "$lus" | garde_des_sensibles "$base" "$titre" "$(jq -r .head.ref <<<"$pr")" ${sujet_de[@]+"${sujet_de[@]}"}) && statut=0 || statut=$?
    [ -z "$conflits" ] || rm -f "$conflits"
    case $statut in
      0) ;;
      20) sortir 4 "#$n $(tail -n 1 <<<"$garde")" ;;
      21) sortir 7 "#$n : $(tail -n 1 <<<"$garde") (chemins sensibles) : sautée sans renvoi, son auteur n'y peut rien" ;;
      *) sortir 11 "#$n : garde des fichiers sensibles en échec (sortie $statut : $(tail -n 1 <<<"$garde")), côté capitaine : sous-PR laissée dans la file" ;;
    esac
  fi
  # Lien symbolique sur un index généré ou son dossier, que la PR ajoute ou change : la régénération du capitaine
  # (mise à jour, avance, rafraichir) écrirait à travers lui.
  motif=$(liens_sur_index "$sommet" "origin/$base") || sortir 4 "#$n $motif"
  # Avant le premier contrôle d'ascendance et avant le chemin de la PR de mise à jour : un seul passage à la fois.
  verrouiller "$n" "$pr"

  local tete
  tete=$(jq -r .head.ref <<<"$pr")
  # PR de mise à jour : la lecture unique des checks, puis l'avance rapide, refusée si le sujet a bougé
  # (avancer_sujet) : l'ascendance y tient déjà.
  if [ -n "$maj" ]; then
    # Checks exigés sur develop, lus sur le sommet de la sous-PR. Les E2E y sont sautés
    # (branche de sujet), donc comptés réussis : ils tournent sur la PR finale.
    local requis etats rouges='' attente=0 nom c
    requis=$(checks_exiges) || {
      [ $? != 6 ] || sortir 11 "#$n : réglage du dépôt (motif ci-dessus) : une règle de checks exigés vide sur develop, aucun renvoi"
      sortir 5 "#$n : GitHub illisible à la lecture des checks exigés (cause ci-dessus) : reprise au tour suivant, aucun renvoi"
    }
    requis=$(jq -r '.[]' <<<"$requis")
    etats=$(checks_commit "$sommet") || sortir 5 "#$n : GitHub illisible à la lecture des checks (cause ci-dessus) : reprise au tour suivant, aucun renvoi"
    while IFS= read -r nom; do
      c=$(printf '%s\n' "$etats" | awk -F '\t' -v n="$nom" '$1 == n { c = $2 } END { print c }')
      case "$c" in
        SUCCESS | SKIPPED | NEUTRAL) ;;
        FAILURE | CANCELLED | TIMED_OUT | ACTION_REQUIRED | STARTUP_FAILURE | ERROR) rouges="$rouges $nom ;" ;;
        *) attente=1 ;;
      esac
    done <<<"$requis"
    [ -z "$rouges" ] || sortir 3 "checks rouges sur #$n :$rouges"
    [ "$attente" = 0 ] || sortir 5 "checks encore en cours sur #$n : reprise au tour suivant, aucun renvoi (la PR reste dans la file tant que la CI ne finit pas)"
    # Régime 8 : les retouches sont dans le verdict (le premier contrôle a lu la résolution et les retouches) ; le second
    # contrôle, avant d'avancer le sujet (A-105).
    if [ "$REGIME" = 8 ]; then verdict_avant_fusion "$n" "$sommet" "$lus" "$base"; else juger_retouches "$n"; fi
    avancer_sujet "$n" "$base" "$sommet"
    return 0
  fi

  # Le capitaine peut avoir à mettre la sous-PR à jour : arbre propre d'abord (6, rien à corriger côté PR).
  [ -z "$(git status --porcelain)" ] || sortir 6 "arbre de travail pas propre : committer ou ranger d'abord, puis relancer (rien à corriger côté PR)"
  git_masque fetch -q origin develop "$base" "$tete"
  # La sous-PR contient du develop plus récent que son sujet (capitaine passé dessus, branche
  # repartie du sommet de develop) : le squash l'embarquerait. Le sujet est d'abord rafraîchi.
  if ! git merge-base --is-ancestor "$(git merge-base "$sommet" origin/develop)" "origin/$base"; then
    rafraichir "${base#sujet/}" --abandon-si-conflit
    git_masque fetch -q origin "$base"
  fi
  # Règle d'ascendance (skill `fusionner`, « La règle d'ascendance ») : la sous-PR n'entre que testée sur l'état du
  # sujet où elle entre, documentation comprise. Premier contrôle avant toute lecture de checks : un conflit se renvoie
  # sans attendre la CI ; une sous-PR en retard est mise à jour et poussée, et c'est la CI du nouveau sommet qui compte.
  # Puis trois tours au plus : attendre la CI du sommet, relire le sujet, contrôler ; squash sur `à-jour` seulement.
  local verdict pousse=0 tour rouges statut
  controler() {
    verdict=$(ascendance "$sommet" "origin/$base") ||
      sortir 11 "#$n : contrôle d'ascendance illisible (ascendance de github.sh, cause ci-dessus), côté capitaine : sous-PR laissée dans la file"
    case ${verdict%%$'\n'*} in
      à-jour | retard | conflit-index) ;;
      conflit) sortir 3 "fusion refusée par GitHub (conflit avec $base hors index générés : $(sed -n '2,$p' <<<"$verdict" | tr '\n' ' ')) : renvoi" ;;
      *) sortir 11 "#$n : contrôle d'ascendance illisible (verdict « ${verdict%%$'\n'*} »), côté capitaine : sous-PR laissée dans la file" ;;
    esac
  }
  mettre_a_jour() {
    mettre_a_jour_sous_pr "$n" "$base" "$tete" "$sommet"
    sommet=$SOMMET_POUSSE
    pousse=1
  }
  controler
  [ "${verdict%%$'\n'*}" = à-jour ] || mettre_a_jour
  for tour in 1 2 3; do
    rafraichir_passage
    rouges=$(attendre_ci "$n" "$sommet") && statut=0 || statut=$?
    case $statut in
      0) ;;
      1) sortir 3 "checks rouges sur #$n :$(awk -F ' : ' '{ sub(/^ +/, "", $1); printf " %s ;", $1 }' <<<"$rouges")" ;;
      5) sortir 5 "#$n : GitHub illisible pendant l'attente de la CI (cause ci-dessus) : reprise au tour suivant, aucun renvoi" ;;
      6) sortir 11 "#$n : réglage du dépôt (motif ci-dessus) : une règle de checks exigés vide sur develop, aucun renvoi" ;;
      *)
        [ "$pousse" = 0 ] ||
          sortir 8 "#$n : mise à jour avec $base poussée, CI pas finie : repasse au tour suivant (aucun renvoi)"
        sortir 5 "checks encore en cours sur #$n : reprise au tour suivant, aucun renvoi (la PR reste dans la file tant que la CI ne finit pas)" ;;
    esac
    local sommet_lu
    sommet_lu=$(pr_sommet "$n") || sortir 5 "#$n : GitHub illisible à la relecture du sommet (cause ci-dessus) : reprise au tour suivant, aucun renvoi"
    [ "$sommet_lu" = "$sommet" ] || sortir 5 "la sous-PR #$n a reçu un push pendant la CI : reprise au tour suivant, aucun renvoi"
    # Refspec explicite : un clone `--single-branch` ne met pas à jour origin/<sujet> sur un simple fetch.
    git_masque fetch -q origin "+refs/heads/$base:refs/remotes/origin/$base"
    controler
    [ "${verdict%%$'\n'*}" != à-jour ] || break
    [ "$tour" -lt 3 ] || sortir 5 "$base a bougé trois fois pendant la CI de #$n : reprise au tour suivant, aucun renvoi"
    echo "$base a bougé pendant la CI : nouvelle mise à jour ($tour sur 2)"
    mettre_a_jour
  done

  # Régime 8 : le second contrôle du verdict, sur le sommet fusionné, une fois l'ascendance « à-jour » (A-105).
  [ "$REGIME" != 8 ] || verdict_avant_fusion "$n" "$sommet" "$(git -c core.quotePath=false diff --no-renames --name-only "$(git merge-base "$sommet" "origin/$base")" "$sommet")" "$base"
  local squash refus
  refus=$(mktemp)
  # Le refus de GitHub, relayé, passe par masquer_url (Décision 10).
  squash=$(git log --no-merges --reverse --format='%B' "$(git merge-base "$sommet" "origin/$base")..$sommet" |
    jq -Rs --arg sha "$sommet" --arg titre "$titre (#$n)" \
      '{merge_method: "squash", sha: $sha, commit_title: $titre, commit_message: .}' |
    gh api -X PUT "$DEPOT/pulls/$n/merge" --input - --jq .sha 2>"$refus") || {
    masquer_url <"$refus" >&2
    rm -f "$refus"
    sortir 3 "fusion refusée par GitHub (sommet bougé, conflit avec $base ?)"
  }
  rm -f "$refus"
  # Arbre du squash = arbre testé : le sha de la réponse du PUT ; un écart (ou un squash introuvable) sort en 12.
  git_masque fetch -q origin "+refs/heads/$base:refs/remotes/origin/$base"
  squash=$(sed -n 1p <<<"$squash")
  git cat-file -e "$squash^{commit}" 2>/dev/null || squash=''
  if [ -z "$squash" ] || [ "$(git rev-parse "$squash^{tree}")" != "$(git rev-parse "$sommet^{tree}")" ]; then
    sortir 12 "$(signaler_arbre_different "$n" "$sommet" "$squash")"
  fi
  echo "#$n fusionnée dans $base"
}

rafraichir() {
  local nom=${1:?nom du sujet} abandon=${2:-}
  local branche="sujet/$nom"
  [ -z "$(git status --porcelain)" ] || sortir 6 "arbre de travail pas propre : committer ou ranger d'abord, puis relancer"
  git_masque fetch -q origin develop "$branche"
  if git merge-base --is-ancestor origin/develop "origin/$branche"; then
    echo "$branche déjà à jour avec develop"
    return 0
  fi
  git switch -q -C "$branche" "origin/$branche"
  # Un échec ici (dépendances, gate des ADR ou des registres : numéro d'ADR réutilisé…, refus d'un hook git)
  # ne doit pas laisser la fusion en cours : le worktree du capitaine resterait sale pour tout le tour.
  abandonner() {
    annuler_fusion
    git reset -q --hard "origin/$branche"
    sortir 3 "$1 : fusion de develop dans $branche annulée, à corriger par une session sur le sujet"
  }
  local sortie statut
  if ! sortie=$(fusionner_avec origin/develop 3>&2 2>&1); then
    local conflits autres
    conflits=$(git diff --name-only --diff-filter=U)
    if [ -z "$conflits" ]; then # aucun fichier en conflit : un refus (hook commit-msg, fichier non suivi écrasé)
      printf '%s\n' "$sortie" | masquer_url >&2
      abandonner "fusion refusée par un hook git ou un fichier non suivi (sortie ci-dessus ; jamais en sautant le hook)"
    fi
    autres=$(printf '%s\n' "$conflits" | grep -Ev "$GENERES" || true)
    if [ -n "$autres" ] && [ "$abandon" = --abandon-si-conflit ]; then
      git merge --abort
      echo "conflit avec develop sur $branche, fusion annulée :"
      printf '  %s\n' $autres
      exit 2
    elif [ -n "$autres" ]; then
      echo "conflit avec develop, à résoudre sur $branche (merge en cours) :"
      printf '  %s\n' $autres
      echo "une session ne pousse pas un sujet : git merge --abort, puis une session fille lancée pour ce geste ouvre la PR de mise à jour (en-tête de sujet.sh)"
      exit 2
    fi
    # Index générés : la régénération fait foi.
    git checkout --theirs -- $conflits && git add -- $conflits
  fi
  pnpm install --frozen-lockfile --prefer-offline >/dev/null 2>&1 || abandonner "pnpm install en échec"
  regenerer_index || abandonner "gate des index/registres en échec"
  if git rev-parse -q --verify MERGE_HEAD >/dev/null; then
    jouer_ou_dire "git commit -q --no-edit" || abandonner "commit refusé par un hook git (sortie ci-dessus)"
  elif ! git diff --cached --quiet; then
    jouer_ou_dire "git commit -q -m 'docs: régénère les index après mise à jour avec develop'" ||
      abandonner "commit refusé par un hook git (sortie ci-dessus)"
  fi
  # Sous les hooks, comme tout push : le pre-push ne joue rien quand rien de neuf ne part, et la CI
  # exigée rejoue tout sur la PR finale.
  pousser "HEAD:refs/heads/$branche" "$branche" "$(git rev-parse "origin/$branche")" && statut=0 || statut=$?
  case $statut in
    0) ;;
    5) git reset -q --hard "origin/$branche"; sortir 5 "$branche a bougé pendant la mise à jour : relancer" ;;
    3) abandonner "push refusé par le hook pre-push : sortie ci-dessus ; ce que develop apporte ne passe pas les contrôles du sujet, une PR de mise à jour avec retouches le corrige (en-tête de sujet.sh)" ;;
    *)
      # Refus du distant : la fusion est annulée d'abord, comme dans `abandonner`, puis sortie 11 (côté capitaine).
      annuler_fusion
      git reset -q --hard "origin/$branche"
      sortir 11 "mise à jour de $branche : push refusé par le distant, sans trace du hook pre-push : côté capitaine ou du distant, rien à corriger côté PR ; sortie ci-dessus" ;;
  esac
  echo "$branche à jour avec develop ($(git rev-parse --short HEAD))"
}

# Dernière ligne non vide d'un fichier d'erreur de gh, URL masquées ; vide sans erreur (jamais un échec sous set -e).
derniere_ligne() { { grep . "$1" || true; } | tail -n 1 | masquer_url; }

livrer() {
  local nom=${1:?nom du sujet} titre=${2:?titre de la PR finale (Conventional Commits)}
  local branche="sujet/$nom" corps n tete phase statut intermediaire='' ouvertes sansgh='' cause='' erreur poussee=''
  git_masque fetch -q origin develop "$branche"
  refuser_si_gele "$nom"
  # Livraison intermédiaire : carte en phase d'avant `5-livraison`. La PR part d'une
  # branche jetable, que GitHub supprime à la fusion : la branche du sujet survit.
  phase=$(phase_carte "$nom")
  case "$phase" in '' | 5-livraison* | 6-nettoyage* | fini*) ;; *) intermediaire=1 ;; esac
  tete=$branche
  # `gh` utilisable : présent et connecté. Sinon (ou lecture en échec) : tout ce que git permet, puis le fichier et la sortie 14.
  erreur=$(mktemp)
  if ! command -v gh >/dev/null 2>&1; then
    sansgh=1 cause='gh absent'
  elif [ -z "$(gh api user --jq .login 2>"$erreur" </dev/null)" ]; then
    sansgh=1 cause="compte illisible ($(derniere_ligne "$erreur"))"
  else
    ouvertes=$(gh api "$DEPOT/pulls?state=open&base=$(uri "$branche")" --jq length 2>"$erreur" </dev/null) || ouvertes=''
    if [[ "$ouvertes" =~ ^[0-9]+$ ]]; then
      [ "$ouvertes" = 0 ] || { rm -f "$erreur"; sortir 4 "des sous-PR visent encore $branche : les fusionner ou les fermer avant de livrer"; }
    else
      # lecture en échec : jamais lue comme des sous-PR ouvertes
      sansgh=1 cause="lecture des sous-PR illisible ($(derniere_ligne "$erreur"))"
    fi
  fi
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
  fi
  # Sans gh déjà connu : la branche jetable n'est pas poussée (une panne qui dure en pousserait une par tour).
  if [ -n "$intermediaire" ] && [ -z "$sansgh" ]; then
    poussee=1
    pousser "origin/$branche:refs/heads/$tete" "$tete" "" && statut=0 || statut=$?
    case $statut in
      0) ;;
      5) sortir 5 "$tete a bougé pendant l'écriture : relancer" ;;
      3) sortir 3 "livraison intermédiaire $tete refusée par le hook pre-push : sortie ci-dessus ; aucune PR ouverte" ;;
      *) sortir 11 "livraison intermédiaire $tete : push refusé par le distant, sans trace du hook pre-push : côté capitaine ou du distant, rien à corriger côté PR ; sortie ci-dessus ; aucune PR ouverte" ;;
    esac
  fi
  if [ -z "$sansgh" ]; then
    if ! n=$(gh api -X POST "$DEPOT/pulls" -f base=develop -f head="$tete" -f title="$titre" -f body="$corps" --jq .number 2>"$erreur" </dev/null); then
      sansgh=1 cause="POST refusé ($(derniere_ligne "$erreur"))"
      # La branche jetable poussée pour rien est retirée : aucune ne reste par tour de panne.
      [ -z "$poussee" ] || git_masque push -q origin ":refs/heads/$tete" >/dev/null 2>&1 || true
      poussee=''
    fi
  fi
  rm -f "$erreur"
  [ -z "$sansgh" ] || livraison_sans_gh "$nom" "$tete" "$titre" "$corps" "$cause" "$intermediaire"
  if [ "${ETIQUETER:-}" = 1 ]; then
    poser_label "$n" à-fusionner
    echo "PR #$n ouverte ($tete → develop), étiquetée à-fusionner"
  else
    echo "PR #$n ouverte ($tete → develop), sans à-fusionner : le poser après la relecture de la PR"
  fi
}

# Sans `gh` utilisable : titre (ligne 1), ligne vide, corps, dans `<git-common-dir>/livraison-<nom>.md` (hors de l'arbre de
# travail : un fichier non suivi ferait refuser le geste suivant du capitaine, sortie 6). Sortie 14.
livraison_sans_gh() {
  local nom=$1 tete=$2 titre=$3 corps=$4 cause=$5 intermediaire=${6:-} fichier owner repo url pousser_d_abord=''
  [[ "$nom" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || sortir 4 "nom de sujet « $nom » refusé pour le fichier de livraison (lettres, chiffres, point, tiret, souligné)"
  fichier="$(git rev-parse --path-format=absolute --git-common-dir)/livraison-$nom.md"
  printf '%s\n\n%s\n' "$titre" "$corps" >"$fichier"
  url=$(git remote get-url origin 2>/dev/null | masquer_url) || url=''
  owner=$(sed -E 's#^.*[:/]([^/:]+)/[^/]+$#\1#' <<<"$url")
  repo=$(sed -E 's#^.*/([^/]+)$#\1#; s#\.git$##' <<<"$url")
  [ -z "$intermediaire" ] || pousser_d_abord="
  Livraison intermédiaire : la branche jetable n'est pas poussée ; la pousser d'abord (git push origin origin/sujet/$nom:refs/heads/$tete)."
  cat <<EOT
PR NON OUVERTE ($cause) : l'ouvrir par l'outil GitHub MCP.$pousser_d_abord
  D'abord : list_pull_requests(owner: "$owner", repo: "$repo", base: "sujet/$nom", state: "open") ne rend rien ; sinon, ne pas livrer.
  Puis : create_pull_request(owner: "$owner", repo: "$repo", base: "develop", head: "$tete", title: <ligne 1 du fichier>, body: <le fichier à partir de la ligne 3>)
  Fichier : $fichier
  Puis poser à-fusionner après la relecture de la PR (issue_write).
EOT
  exit 14
}

relancer() {
  local n=${1:?numéro de la sous-PR} pr base tete sommet verdict
  pr=$(pr_json "$n") || sortir 5 "#$n : GitHub illisible à la lecture de la PR (cause ci-dessus) : reprise au tour suivant, aucun renvoi"
  # Une PR de fourche : sautée sans renvoi, comme dans `fusionner` et passer.sh (A-192, point 2), avant tout fetch : sa
  # branche n'est pas `origin/<tête>`, et la mise à jour pousserait sur la branche d'origin du même nom.
  [ "$(jq -r '.head.repo.full_name // ""' <<<"$pr")" = "$(jq -r '.base.repo.full_name // ""' <<<"$pr")" ] ||
    sortir 7 "#$n : PR de fourche ($(jq -r '.head.repo.full_name // "dépôt supprimé"' <<<"$pr")) : sa tête vit hors du dépôt, le capitaine ne la lit pas ; sautée sans renvoi"
  base=$(jq -r .base.ref <<<"$pr")
  tete=$(jq -r .head.ref <<<"$pr")
  sommet=$(jq -r .head.sha <<<"$pr")
  [[ "$base" == sujet/* ]] || sortir 4 "#$n vise $base, pas un sujet"
  refuser_tete_gardee "$n" "$pr"
  [ -z "$(git status --porcelain)" ] || sortir 6 "arbre de travail pas propre : committer ou ranger d'abord, puis relancer (rien à corriger côté PR)"
  # Joué aussi à la main par la session propriétaire, qui n'est pas un capitaine : sans CAPITAINE_ID, aucun verrou (son
  # push ne fait que relancer la CI) ; mal formé, refusé.
  if [ -z "${CAPITAINE_ID-}" ]; then
    echo "relancer sans CAPITAINE_ID : aucun verrou posé"
  else
    capitaine_id_valide "$CAPITAINE_ID" ||
      sortir 64 "CAPITAINE_ID mal formé (l'id de la session du capitaine, lettres, chiffres, - et _) : aucune relance"
    verrouiller "$n" "$pr"
  fi
  # Refspecs explicites : un clone `--single-branch` ne met à jour aucune `origin/<branche>` sur un fetch nu.
  git_masque fetch -q origin "+refs/heads/develop:refs/remotes/origin/develop" \
    "+refs/heads/$base:refs/remotes/origin/$base" "+refs/heads/$tete:refs/remotes/origin/$tete"
  # Le verdict porte sur le sommet lu avec la PR : une branche qui a bougé depuis (la session a peut-être résolu son
  # conflit) n'est ni jugée ni renvoyée sur un sommet périmé.
  [ "$(git rev-parse "origin/$tete")" = "$sommet" ] ||
    sortir 5 "la sous-PR #$n a bougé depuis sa lecture : rien n'est poussé, reprise au tour suivant, aucun renvoi"
  # Règle d'ascendance avant toute fusion (skill `fusionner`) : GitHub ne lance pas la CI d'une sous-PR en conflit avec
  # son sujet. Conflit limité aux index générés : mise à jour comme par `fusionner` ; tout autre conflit : sortie 2.
  verdict=$(ascendance "$sommet" "origin/$base") ||
    sortir 11 "#$n : contrôle d'ascendance illisible (ascendance de github.sh, cause ci-dessus) : sous-PR laissée dans la file, rien à corriger côté PR"
  case ${verdict%%$'\n'*} in
    à-jour) sortir 3 "#$n contient déjà $base : aucun commit à pousser, CI non déclenchable" ;;
    conflit)
      # Seuls les fichiers hors index générés : un index en conflit se régénère, la session n'a rien à y faire.
      printf 'conflit avec %s hors index générés :\n' "$base"
      sed -n '2,$p' <<<"$verdict" | { grep -Ev "$GENERES" || true; } | sed 's/^/  /'
      exit 2 ;;
    retard | conflit-index) ;;
    *) sortir 11 "#$n : contrôle d'ascendance illisible (verdict « ${verdict%%$'\n'*} ») : sous-PR laissée dans la file, rien à corriger côté PR" ;;
  esac
  mettre_a_jour_sous_pr "$n" "$base" "$tete" "$sommet"
  echo "#$n : $base fusionné dans sa branche ($(git rev-parse --short "$SOMMET_POUSSE")), CI lancée"
}

# Séries de la file : PR ouvertes, non brouillon, qui visent develop ou une autre PR. Clés de
# regroupement : spec du ticket cité (titre ou branche), racine de la pile, et, sans ticket, les
# deux premiers mots de la branche (`chore/tableau-bord-stats` → `chore/tableau-bord-*`). Une clé qui réunit au moins 2 PR est une
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
            # sans ticket : type/ + deux premiers mots de la branche (chore/tableau-bord-*)
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
#   gelé              la ligne `Gel:` de sa carte n'est pas vide : prime sur tous les autres verdicts
#   livré #n          sa PR vers develop est ouverte : le capitaine la passe
#   prêt à livrer     aucune sous-PR ouverte et tous ses tickets faits (Status resolved/Fait/done)
#   en cours          sinon ; « VIEUX » au-delà de 5 jours sans livraison, « EN RETARD » au-delà
#                     de 20 commits de develop non fusionnés
etat() {
  local c prs b nom avance retard sous livree tickets restants age vieux debut fermees spec
  c=$(carte)
  # PR ouvertes et sous-PR fermées par lire_github : illisibles, sortie 5, jamais « sans sous-PR » (rafraichir_sujets
  # mettrait à jour un sujet actif, livrer-prets livrerait trop tôt). Appelé dans une substitution, `set -e` n'y joue pas.
  prs=$(lire_github "$DEPOT/pulls?state=open&per_page=100" --paginate) || exit 5
  prs=$(jq -rs '.[][] | "\(.base.ref)\t\(.head.ref)\t\(.number)"' <<<"$prs")
  printf 'sujet\tavance\tretard\tsous-PR\ttickets restants\tverdict\n'
  for b in $(branches_sujet); do
    nom=${b#origin/sujet/}
    avance=$(git rev-list --count --first-parent --no-merges "origin/develop..$b")
    retard=$(git rev-list --count "$b..origin/develop")
    # Un sujet sans commit propre ni PR ouverte (une livraison intermédiaire tout juste entrée dans develop, A-132) reste
    # listé tant qu'il est en retard et qu'il n'est pas livré (`sujet_livre`) : la boucle du capitaine y reporte develop
    # (`rafraichir_sujets`), et le conducteur le voit. Un sujet à jour sans rien à lui reste hors du tableau.
    if [ "$avance" -eq 0 ] && [ -z "$(awk -F '\t' -v b="sujet/$nom" '$1 == b' <<<"$prs")" ]; then
      [ "$retard" -gt 0 ] && ! sujet_livre "$nom" || continue
    fi
    # Sous-PR : celles qui visent le sujet, et les piles posées sur une sous-PR déjà fusionnée
    # dedans (elles y seront reciblées) — sans elles, le sujet se croirait fini trop tôt.
    fermees=$(lire_github "$DEPOT/pulls?state=closed&per_page=100&base=$(uri "sujet/$nom")" --paginate) || exit 5
    fermees=$(jq -rs '.[][].head.ref' <<<"$fermees")
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
    if [ -n "$(gel_de "$nom")" ]; then v='gelé'
    elif [ -n "$livree" ]; then v="livré #$livree"
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
  sujets=$(etat | tail -n +2 | awk -F '\t' '$6 ~ /^prêt à livrer/ { print $1 }') || sortir 5 "état des sujets illisible (GitHub, cause ci-dessus) : livraison reprise au tour suivant"
  carte_sujets=$(carte)
  for nom in $sujets; do
    # Illisibles : sortie 5, jamais « sans sujet-manuel ».
    labels=$(lire_github "$DEPOT/pulls?state=all&per_page=100&base=$(uri "sujet/$nom")" --paginate) || sortir 5 "sujet/$nom : GitHub illisible (labels des sous-PR) : livraison reprise au tour suivant"
    labels=$(jq -rs '.[][].labels[].name' <<<"$labels" | sort -u)
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
      ETIQUETER=1 livrer "$nom" "$titre"
    fi
  done
}

# `carte <nom>` : voir l'en-tête. Avec `geler` et `degeler` (qui ne changent que la ligne `Gel:`), le seul geste d'écriture d'une session sur un sujet.
# Vrai si la carte `<rev>:<chemin>` déclare, en première ligne `Sujet:` de son en-tête (avant le
# premier `## `), `sujet/<nom>` seul ou parmi plusieurs valeurs (`carte_nomme_le_sujet`) : la lecture
# de `sujet_livre` et `phase_carte`. awk lit
# tout le flux (pas de sortie anticipée) : sous pipefail, un SIGPIPE de git ferait un faux refus.
carte_cite_le_sujet() {
  git cat-file blob "$1" 2>/dev/null | awk -v s="sujet/$2" "$AWK_NOMME"'
    fini { next }
    /^## / { fini = 1; next }
    /^(- )?\**Sujet ?:/ { ok = nomme($0, s); fini = 1 }
    END { exit !ok }'
}

# Sommet de la branche `<branche>` sur origin (vide si elle n'y est pas) : le nom se compare en entier,
# `git ls-remote <motif>` fait correspondre la fin d'un nom.
sommet_distant() { git_masque ls-remote origin "refs/heads/$1" | awk -v r="refs/heads/$1" '$2 == r { print $1 }'; }
# Premier commit de develop (premiers parents) où la carte du sujet est en `6-nettoyage` ou `fini` ; vide
# sinon. Le sommet d'un sujet livré est contenu dans ce commit : un sujet rouvert sous le même nom, après
# la carte d'un chantier précédent, a un sommet plus récent.
commit_carte_livree() {
  local nom=$1 f c phase
  while IFS= read -r f; do
    git show "refs/remotes/origin/develop:$f" | carte_nomme_le_sujet "$nom" || continue
    while IFS= read -r c; do
      phase=$(git show "$c:$f" 2>/dev/null | grep -m1 -E '^Phase ?:' | sed -E 's/^Phase ?: *//; s/[[:space:]]*$//') || true
      case "$phase" in 6-nettoyage* | fini*) printf '%s\n' "$c"; return 0 ;; esac
    done < <(git log --first-parent --reverse --format=%H refs/remotes/origin/develop -- "$f")
  done < <(git ls-tree -r --name-only refs/remotes/origin/develop -- docs | grep -E '\.map\.md$' | grep -v '/gabarits/' || true)
}
# `clore <nom>` : voir l'en-tête. Le seul geste de suppression d'une branche de sujet : la garde d'agent
# refuse `git push --delete` et `:sujet/…` à une session (elle ne voit pas ce script). Aucune écriture avant
# que tous les refus aient été levés, et jamais d'option de force : la suppression est un `git push` simple,
# sous les hooks. Les références se lisent en toutes lettres (`refs/remotes/origin/…`) : un tag ou une
# branche locale nommés `origin/develop` ne masquent pas le distant. Ni les objets de remplacement ni les
# greffes ne sont lus, l'URL de push doit être celle de lecture, et `gh` vise le dépôt de `origin` posé
# explicitement par `GH_REPO` (jamais un `upstream` ni le dépôt par défaut de `gh`).
clore() {
  local nom=${1-} branche sommet relu ouvertes statut ecart livree url chemin depot develop=refs/remotes/origin/develop
  shift || true
  [ $# -eq 0 ] || sortir 4 "clore ne prend que le nom du sujet ($*) : jamais d'option, jamais de push forcé"
  [[ "$nom" != sujet/* ]] || sortir 4 "nom de sujet illisible : « $nom » : le nom se donne sans le préfixe sujet/ (clore ${nom#sujet/})"
  [[ "$nom" =~ ^[a-z0-9][a-z0-9-]*$ ]] || sortir 4 "nom de sujet illisible : « $nom »"
  branche="sujet/$nom"
  # Aucune décision ne repose sur un état local du dépôt (objets de remplacement, greffes, URL de push, dépôt
  # par défaut de gh) : ils ne se lisent pas, et la suppression part là où l'on a vérifié.
  export GIT_NO_REPLACE_OBJECTS=1 GIT_GRAFT_FILE=/dev/null
  url=$(git remote get-url origin 2>/dev/null) || sortir 11 "URL de origin illisible : rien n'est supprimé"
  [ "$(git remote get-url --push --all origin 2>/dev/null)" = "$url" ] ||
    sortir 4 "l'URL de push de origin diffère de son URL de lecture (pushurl, pushInsteadOf, plusieurs URL) : rien n'est supprimé, on ne supprime pas ailleurs que là où l'on a vérifié"
  url=${url%/}; url=${url%.git}
  chemin=$url
  case $url in
    *://*) chemin=${url#*://}; chemin=${chemin#*/} ;; # l'hôte n'est pas un owner
    *@*:*) chemin=${url#*:} ;;
  esac
  [[ "$chemin" =~ ^(.*/)?([A-Za-z0-9._-]+)/([A-Za-z0-9._-]+)$ ]] ||
    sortir 4 "l'URL de origin ne donne pas un owner/repo lisible (« $url ») : rien n'est supprimé"
  depot="${BASH_REMATCH[2]}/${BASH_REMATCH[3]}"
  relu=$(sommet_distant "$branche") || sortir 11 "origin injoignable : rien n'est supprimé"
  [ -n "$relu" ] || sortir 0 "$branche n'existe pas sur origin : rien à clore"
  git_masque fetch -q origin "+refs/heads/develop:$develop" "+refs/heads/$branche:refs/remotes/origin/$branche" ||
    sortir 11 "fetch de develop et de $branche en échec : rien n'est supprimé"
  sommet=$(git rev-parse --verify "refs/remotes/origin/$branche^{commit}") ||
    sortir 11 "refs/remotes/origin/$branche illisible : rien n'est supprimé"
  statut=0
  git merge-base --is-ancestor "$sommet" "$develop" || statut=$?
  case $statut in
    0) ;;
    1) ecart=$(git rev-list --count "$develop..$sommet")
       sortir 4 "$branche porte $ecart commit(s) absent(s) de develop : pas livré, rien n'est supprimé" ;;
    *) sortir 11 "git merge-base en échec sur $branche et origin/develop : rien n'est supprimé" ;;
  esac
  sujet_livre "$nom" ||
    sortir 4 "la carte de $nom, lue sur develop, ne le dit pas livré (Phase: 6-nettoyage ou fini) : rien n'est supprimé"
  livree=$(commit_carte_livree "$nom")
  { [ -n "$livree" ] && git merge-base --is-ancestor "$sommet" "$livree"; } ||
    sortir 4 "le sommet de $branche est postérieur au passage de sa carte en 6-nettoyage ou fini (un sujet rouvert sous le même nom ?) : rien n'est supprimé, vérifier d'abord"
  # Les PR ouvertes se lisent au plus près de la suppression, juste avant la relecture du sommet. Le dépôt est
  # celui d'origin, posé explicitement : gh résoudrait sinon `{owner}/{repo}` sur GH_REPO, un remote `upstream`
  # ou le dépôt par défaut de `gh repo set-default`.
  ouvertes=$(
    GH_REPO=$depot gh api --paginate "$DEPOT/pulls?state=open&per_page=100&base=$(uri "$branche")" --jq '.[].number' &&
      GH_REPO=$depot gh api --paginate "$DEPOT/pulls?state=open&per_page=100&head={owner}:$(uri "$branche")" --jq '.[].number'
  ) || sortir 11 "PR ouvertes de $branche illisibles (GitHub) : rien n'est supprimé"
  [ -z "$ouvertes" ] || sortir 4 "des PR ouvertes ont $branche pour base ou pour tête (#$(sort -un <<<"$ouvertes" | paste -sd' ' - | sed 's/ / #/g')) : les fusionner ou les fermer avant de clore"
  # Le sommet relu juste avant la suppression doit être celui qu'on a vérifié.
  relu=$(sommet_distant "$branche") || sortir 11 "origin injoignable : rien n'est supprimé"
  [ "$relu" = "$sommet" ] || sortir 5 "$branche a bougé pendant les vérifications : rien n'est supprimé, relancer"
  statut=0
  jouer_ou_dire "git push -q origin :refs/heads/$branche" || statut=$?
  # Quel que soit le code du push, seul le distant dit ce qu'il est advenu.
  relu=$(sommet_distant "$branche") ||
    sortir 11 "suppression non confirmée : origin illisible après le push, relire avec git ls-remote --heads origin $branche"
  git update-ref -d "refs/remotes/origin/$branche" 2>/dev/null || true
  if [ -z "$relu" ]; then
    if [ "$statut" -eq 0 ]; then echo "$branche supprimée (sommet ${sommet:0:12}, contenu dans origin/develop)"
    else echo "$branche n'est plus sur origin (le push a échoué, la branche avait disparu entre-temps)"; fi
  elif [ "$relu" != "$sommet" ]; then
    sortir 5 "$branche a bougé pendant la suppression : rien n'est supprimé, relancer"
  else
    sortir 3 "suppression de $branche refusée ou sans effet (hook pre-push, protection de branche ou proxy : sortie ci-dessus). Si c'est le distant, à jouer d'un poste local : git push origin :refs/heads/$branche"
  fi
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
  git_masque push -q origin "$tete:refs/heads/$branche" || refuser "le push sur $branche a échoué (jamais de force : relancer après un fetch)"
  echo "carte poussée : $i commit(s) sur $branche"
}

commande=${1:-}
shift || true
if [ "$commande" = carte ] && [ $# -gt 0 ]; then carte_sujet "$@"; exit; fi
case "$commande" in
  demarrer | ouvrir | fusionner | rafraichir | livrer | relancer | series | regrouper | carte | etat | geler | degeler | gel | clore) "$commande" "$@" ;;
  de) sujet_du_ticket "${1:?ticket}" ;;
  livre) sujet_livre "${1:?nom du sujet}" ;;
  livrer-prets) livrer_prets "$@" ;;
  a-juger) a_juger "$@" ;;
  est-livraison) est_livraison "$@" ;;
  regrouper-series) regrouper_series "$@" ;;
  *) sed -n '3,/^# =====/p' "$0" | sed '$d; s/^# \{0,1\}//'; sortir 4 "usage : sujet.sh demarrer <ticket|nom> | ouvrir <nom> [--specs <pr>] | fusionner <pr> | rafraichir <nom> | livrer <nom> <titre> | livrer-prets [--dry-run] | relancer <pr> | series | regrouper-series [--dry-run] | regrouper <nom> <pr>… | carte | carte <nom> | etat | geler <nom> \"<raison>\" | degeler <nom> | gel <nom> | clore <nom> | de <ticket> | a-juger <sommet> <base> [<pr>] | est-livraison <tête> <sommet>" ;;
esac
