#!/usr/bin/env bash
# =============================================================================
# Veille du capitaine : la file de fusion reprend d'elle-même (skill /fusionner).
# `boucle.sh` s'arrête sur FILE VIDE ; une PR étiquetée `à-fusionner` ensuite n'est vue par
# personne. La veille lance la boucle, puis sonde la file (une lecture GitHub, pas de CI) toutes
# les `pause` secondes et relance la boucle dès qu'une PR est « prête » ou « CI rouge ». Une PR
# « CI en cours », « attend », « bloquée » ou en brouillon ne relance rien d'elle-même.
#
# Une PR que la boucle vient de sauter reste « prête » : on ne relance que si la file contient
# une ligne (numéro + état) absente de l'ensemble vu au dernier lancement ou à la dernière sonde.
# Une PR que la boucle a renvoyée (`RENVOI`) ou dont elle a relancé les jobs rouges (`RELANCE`) sort
# de cet ensemble : revenue dans la file avant la sonde suivante, même ligne qu'avant, elle relance
# la boucle.
# Une sous-PR qui attend son tour dans son sujet (`[#n] attend son tour : #m passe d'abord…`, boucle.sh) reste
# « prête », la même ligne de sonde en sonde, et celle qui tient le sujet peut quitter la file sans qu'aucune ligne
# n'apparaisse (étiquette retirée, `fusion-bloquée`, fermée, brouillon). La sonde ajoute donc, pour chaque sous-PR
# qui attend, la ligne « n attend #m (<état de #m dans la file>) » : nouvelle à la première sonde qui suit la boucle
# (un second regard), puis chaque fois que l'état de #m change ou que #m quitte la file, elle relance la boucle.
# Un sujet tenu par une sous-PR en passage chez un autre capitaine (`[sujet/<nom>] tenu par #n (sortie 7 de …, verrou
# du <date>)`, boucle.sh) : si ce capitaine est mort, son verrou expire 90 minutes après cette date sans que rien ne
# change dans la file. La veille relance donc la boucle une fois, à la première sonde qui suit cette date de plus de
# 95 minutes (90, et 5 de marge entre l'horloge de ce poste et celle de GitHub) : « verrou d'un autre capitaine
# expiré ». Si la boucle retrouve le même verrou à la même date, la veille ne relance plus pour lui.
# « prête (sans CI) » est un état à part : la boucle met de côté une PR sans CI après 5 min, et la
# CI arrive parfois plus tard. Quand elle arrive (la ligne passe à prête ou rouge), c'est un
# changement d'état : la boucle est relancée, sans attendre une fusion qui peut ne jamais venir.
# Une boucle qui sort en code non nul (ARRÊT : gates, install, CI bloquée) arrête la veille avec
# le même code : le capitaine traite, puis relance. Durée écoulée : VEILLE FINIE, sortie 0.
# Journal : « VEILLE <hh:mm> : file vide » au plus toutes les 10 min.
#
# Préparation du capitaine. La plateforme recycle la machine du capitaine : un environnement local
# (base de données) disparaît, et le passage suivant échoue loin de sa cause. Une clé facultative de
# `.claude/chaine.json`, `preparerCapitaine`, nomme une commande du projet ; la veille la joue avant de
# lancer la boucle, la première fois sur une machine et après chaque redémarrage, reconnu à
# `/proc/sys/kernel/random/boot_id` (`VEILLE_BOOT_ID` le remplace, pour les bancs seulement). Le
# `boot_id` de la dernière préparation réussie est gardé dans `<git-common-dir>/capitaine-boot-id` :
# égal au courant, rien n'est lu ni joué. Sinon, et seulement alors, la veille lit le contrat sur
# `origin/develop` (`git fetch`, trois essais, puis `git show`), JAMAIS dans l'arbre de travail : un passage
# interrompu y laisse le code d'une PR, qui ferait jouer sa propre commande. Pour la même raison, elle
# exige un worktree propre et le détache sur `origin/develop` avant de jouer `sh -c "<commande>"`,
# depuis la racine du worktree, entrée sur /dev/null, sortie dans le journal, sans délai imposé.
# Fichier ou clé absents, chaîne vide : rien n'est joué. Sans `boot_id` lisible (macOS), la préparation
# se joue à chaque démarrage de la veille, jamais entre deux lancements de la boucle.
# La préparation tient le verrou de la boucle (`boucle.verrou`) : une boucle encore vivante (orpheline)
# n'a pas son worktree changé de branche sous elle ; verrou tenu : sortie 13.
# Tant que la préparation n'a pas réussi, aucune boucle n'est lancée, donc rien n'est fusionné :
# préparation en échec, worktree pas propre, origin/develop ou contrat illisibles arrêtent la veille
# en sortie 13, « VEILLE ARRÊTÉE <hh:mm> : … », jamais une préparation sautée.
#
# Échéance. Une tâche de fond est tuée à 2 h ; tuée au milieu d'un passage, elle laisse une PR à moitié
# mise à jour. Aucun passage ne commence à moins de `--marge` minutes (40) de cette limite : la veille
# calcule l'échéance absolue (démarrage + (120 - marge) min), la transmet à la boucle
# (`BOUCLE_ECHEANCE`, secondes depuis l'époque Unix), qui la vérifie avant chaque passage et s'arrête
# sur `ÉCHÉANCE` (sortie 0), et ne relance plus la boucle passé l'échéance : « VEILLE FINIE <hh:mm>
# (échéance) ». Une `--duree` plus longue ne repousse pas l'échéance. `VEILLE_LIMITE` (minutes, décimal
# permis) remplace la limite de 120, pour les bancs seulement.
#
# Usage, en tâche de fond, depuis le worktree du capitaine, scripts copiés hors du worktree, `CAPITAINE_ID` (l'id de la
# session du capitaine) en préfixe :
#   CAPITAINE_ID=<id> bash <copie>/veille.sh [--pause <s>] [--duree <min>] [--marge <min>] [--sondes <n>] > <journal> 2>&1
#   (défauts 120 s, 75 min, 40 min)
# VEILLE FINIE ou VEILLE ARRÊTÉE réveille la session. `--duree` : un nombre positif, décimal permis ;
# `--marge` : des minutes entières, sous la limite. Option invalide : sortie 64, l'option nommée.
# `--sondes <n>` (pour les tests seulement) : VEILLE FINIE après n sondes, durée ou pas, pour qu'un test
# compte des sondes sans dépendre de l'horloge. Défaut : pas de limite.
# =============================================================================
outils=$(cd "$(dirname "$0")" && pwd)
# L'id de la session du capitaine (verrou de chaque passage, github.sh) : vérifié ici, pas deux minutes plus tard par la
# boucle. Absent ou mal formé : sortie 64.
[[ "${CAPITAINE_ID-}" =~ ^[A-Za-z0-9_-]{1,100}$ ]] || {
  echo "VEILLE ARRÊTÉE $(date +%H:%M) : CAPITAINE_ID requis (l'id de la session du capitaine, skill fusionner § « Mise en place »)" >&2
  exit 64
}

# Limite des tâches de fond de la plateforme (2 h), en minutes ; `VEILLE_LIMITE` pour les bancs.
limite=${VEILLE_LIMITE:-120}
pause=120
duree=75
marge=40
sondes=""
invalide() { echo "veille.sh : $1" >&2; exit 64; }
while [ $# -gt 0 ]; do
  option=$1 valeur=${2-}
  case "$option" in
    --pause) pause=${valeur:?--pause attend des secondes} ;;
    --duree) duree=$valeur ;;
    --marge) marge=$valeur ;;
    --sondes) sondes=${valeur:?--sondes attend un nombre} ;;
    *) echo "usage : veille.sh [--pause <s>] [--duree <min>] [--marge <min>] [--sondes <n>]" >&2; exit 64 ;;
  esac
  if [ $# -ge 2 ]; then shift 2; else shift; fi
done
[[ "$duree" =~ ^[0-9]+([.][0-9]+)?$ ]] && awk -v d="$duree" 'BEGIN { exit !(d > 0) }' ||
  invalide "--duree attend des minutes, un nombre positif (« $duree »)"
[[ "$marge" =~ ^[0-9]+$ ]] && awk -v m="$marge" -v l="$limite" 'BEGIN { exit !(m < l) }' ||
  invalide "--marge attend des minutes entières, sous la limite de $limite min d'une tâche de fond (« $marge »)"
fin=$(awk -v d="$duree" 'BEGIN { printf "%d", d * 60 }')
debut=$(date +%s)
echeance=$(awk -v t="$debut" -v l="$limite" -v m="$marge" 'BEGIN { printf "%d", t + (l - m) * 60 }')
export BOUCLE_ECHEANCE=$echeance

heure() { date +%H:%M; }
heure_de() { date -d "@$1" +%H:%M 2>/dev/null || date -r "$1" +%H:%M; }
echeance_passee() { [ "$(date +%s)" -ge "$echeance" ]; }

# Préparation du capitaine (en-tête). `prepare_pour` : le boot (ou « illisible ») pour lequel cette
# veille a déjà lu le contrat, ou préparé : plus rien à lire ni à jouer tant qu'il ne change pas.
COMMUN=$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)
GARDE="$COMMUN/capitaine-boot-id"
VERROU="$COMMUN/boucle.verrou"
prepare_pour=""
arreter_preparation() { echo "VEILLE ARRÊTÉE $(heure) : $1"; exit 13; }
preparer_si_besoin() {
  local boot cle contrat type commande racine rc
  local essai lu
  boot=$(cat "${VEILLE_BOOT_ID:-/proc/sys/kernel/random/boot_id}" 2>/dev/null | tr -d '[:space:]')
  cle=${boot:-illisible}
  [ "$cle" != "$prepare_pour" ] || return 0
  # Même machine depuis la dernière préparation réussie : rien à lire, aucun fetch.
  [ -z "$boot" ] || [ "$boot" != "$(cat "$GARDE" 2>/dev/null)" ] || { prepare_pour=$cle; return 0; }
  # Trois essais, comme la boucle (sortie 6 au troisième) : un fetch passager n'arrête pas la veille.
  lu=""
  for essai in 1 2 3; do
    git fetch -q origin develop 2>/dev/null && { lu=1; break; }
    [ "$essai" = 3 ] || sleep $((essai * 5))
  done
  [ -n "$lu" ] && git rev-parse --verify -q origin/develop >/dev/null ||
    arreter_preparation "origin/develop illisible : préparation inconnue ; aucune fusion, relancer la veille"
  if ! git cat-file -e origin/develop:.claude/chaine.json 2>/dev/null; then
    prepare_pour=$cle; return 0
  fi
  contrat=$(git show origin/develop:.claude/chaine.json 2>/dev/null) &&
    type=$(printf '%s' "$contrat" | jq -r 'if type != "object" then error("racine") elif has("preparerCapitaine") then .preparerCapitaine | type else "absente" end' 2>/dev/null) ||
    arreter_preparation "contrat illisible : préparation inconnue (.claude/chaine.json d'origin/develop n'est pas un objet JSON) ; aucune fusion"
  case "$type" in
    absente) prepare_pour=$cle; return 0 ;;
    string) commande=$(printf '%s' "$contrat" | jq -r '.preparerCapitaine') ;;
    *) arreter_preparation "contrat illisible : préparation inconnue (preparerCapitaine de .claude/chaine.json n'est pas une chaîne : $type) ; aucune fusion" ;;
  esac
  [ -n "$commande" ] || { prepare_pour=$cle; return 0; }
  # Le worktree est celui de la boucle : la préparation tient son verrou (`boucle.verrou`, en-tête de
  # boucle.sh), sur le descripteur 8, qu'elle ferme avant de lancer la boucle et que la commande n'hérite pas.
  command -v flock >/dev/null || arreter_preparation "flock (util-linux) requis : préparation non jouée"
  exec 8>>"$VERROU"
  flock -n 8 || arreter_preparation "une boucle tient le verrou ($VERROU) : préparation non jouée ; « boucle.sh --arreter », puis relancer la veille"
  [ -z "$(git status --porcelain 2>/dev/null)" ] && git rev-parse --verify -q HEAD >/dev/null ||
    arreter_preparation "worktree du capitaine pas propre : préparation non jouée ; le nettoyer, puis relancer la veille"
  git switch -q --detach origin/develop 2>/dev/null ||
    arreter_preparation "worktree du capitaine non détaché sur origin/develop : préparation non jouée"
  racine=$(git rev-parse --show-toplevel)
  [ -n "$boot" ] || echo "VEILLE $(heure) : boot_id illisible, préparation jouée à chaque démarrage de la veille"
  echo "VEILLE $(heure) : préparation (« $commande »)"
  (cd "$racine" && sh -c "$commande" </dev/null 2>&1 8>&-)
  rc=$?
  exec 8>&-
  [ "$rc" = 0 ] ||
    arreter_preparation "préparation du capitaine en échec (sortie $rc de « $commande ») : aucune fusion ; corriger l'environnement, puis relancer la veille"
  if [ -n "$boot" ]; then
    printf '%s\n' "$boot" > "$GARDE.nouveau" && mv "$GARDE.nouveau" "$GARDE"
  fi
  prepare_pour=$cle
  echo "VEILLE $(heure) : préparation réussie"
}

# Sortie de la boucle, gardée pour lire les PR qu'elle a renvoyées ou relancées.
journal_boucle=$(mktemp)
trap 'rm -f "$journal_boucle"' EXIT

# Lance la boucle ; un code non nul arrête la veille avec ce code. Une PR que la boucle a renvoyée
# (`[#n] RENVOI`, renvoyer.sh) ou dont elle a relancé les jobs rouges (`[#n] RELANCE`, boucle.sh)
# sort de l'ensemble vu : si elle revient avant la sonde suivante, même ligne qu'avant la boucle,
# elle est nouvelle et relance la boucle (cas vécu : PR renvoyée, corrigée en une minute, invisible).
# La préparation la précède (en-tête) ; son échec sort en 13 sans lancer la boucle.
lancer() {
  preparer_si_besoin
  bash "$outils/boucle.sh" | tee "$journal_boucle"
  local rc=${PIPESTATUS[0]} agies
  if [ "$rc" != 0 ]; then
    echo "VEILLE ARRÊTÉE $(heure) : la boucle est sortie en $rc"
    exit "$rc"
  fi
  agies=$(sed -nE 's/^\[#([0-9]+)\] (RENVOI|RELANCE).*/\1/p' "$journal_boucle" | sort -u)
  [ -z "$agies" ] || vu=$(printf '%s\n' "$vu" | awk 'NR == FNR { a[$1]; next } !($1 in a)' <(printf '%s\n' "$agies") -)
  # Sous-PR qui attendent leur tour, « n:m » (n attend que #m, qui tient son sujet, soit passée) : etat_file les suit.
  attentes=$(sed -nE 's/^\[#([0-9]+)\] attend son tour : #([0-9]+) .*/\1:\2/p' "$journal_boucle" | tr '\n' ' ')
  # Verrous d'un autre capitaine qui tiennent un sujet : la plus proche de leurs expirations (date + 90 min), en
  # secondes depuis l'époque Unix ; vide : aucun, ou une date illisible.
  expire=$(sed -nE 's/^\[sujet\/[^]]+\] tenu par #[0-9]+ \(sortie 7 de (fusionner|relancer), verrou du ([0-9TZ:-]+)\)$/\2/p' "$journal_boucle" |
    jq -Rrs '[split("\n")[] | select(. != "") | fromdateiso8601] | min // empty | . + 5400' 2>/dev/null)
}

# Lignes « numéro état » des PR à traiter (prêtes ou rouges), triées ; puis, pour chaque sous-PR qui attend son tour
# et qui est encore dans la file, « n attend #m (<état de #m>) », l'état de celle qui tient son sujet.
# `expire` : l'expiration lue au dernier lancement (lancer) ; `tire` : celle pour laquelle la boucle a déjà été relancée.
attentes=""
expire=""
tire=""
etat_file() {
  local sortie
  sortie=$(bash "$outils/file.sh" 2>/dev/null) || return 1
  printf '%s\n' "$sortie" | awk -F '\t' -v attentes="$attentes" '
    { etat[$1] = $2 }
    $2 ~ /CI rouge/ { print $1 " rouge"; next }
    $2 ~ /sans CI/  { print $1 " sans-ci"; next }
    $2 ~ /prête/    { print $1 " prête" }
    END {
      k = split(attentes, a, " ")
      for (i = 1; i <= k; i++) {
        split(a[i], p, ":")
        if (p[1] in etat) print p[1] " attend #" p[2] " (" (p[2] in etat ? etat[p[2]] : "hors de la file") ")"
      }
    }' | sort
}

echo "VEILLE $(heure) : durée $duree min, aucun passage après $(heure_de "$echeance") (marge $marge min)"
SECONDS=0
vu=$(etat_file || true)
lancer
dernier_journal=-600
faites=0
while [ "$SECONDS" -lt "$fin" ] && { [ -z "$sondes" ] || [ "$faites" -lt "$sondes" ]; }; do
  sleep "$pause"
  # Passé l'échéance, plus de relance : un passage commencé ne finirait pas avant la limite de 2 h.
  if echeance_passee; then echo "VEILLE FINIE $(heure) (échéance)"; exit 0; fi
  [ "$SECONDS" -lt "$fin" ] || break
  faites=$((faites + 1))
  if ! actuel=$(etat_file); then
    echo "VEILLE $(heure) : lecture de la file impossible, sonde sautée"
    continue
  fi
  if [ -z "$actuel" ]; then
    vu=""
    if [ $((SECONDS - dernier_journal)) -ge 600 ]; then
      echo "VEILLE $(heure) : file vide"
      dernier_journal=$SECONDS
    fi
    continue
  fi
  # Une ligne absente de l'ensemble vu : PR nouvelle, ou changée d'état.
  nouveau=$(comm -13 <(printf '%s\n' "$vu") <(printf '%s\n' "$actuel"))
  vu=$actuel
  if [ -n "$nouveau" ]; then
    echo "VEILLE $(heure) : file à traiter ($(printf '%s' "$nouveau" | tr '\n' ',' | sed 's/,$//')), boucle relancée"
    lancer
  elif [ -n "$expire" ] && [ "$expire" != "$tire" ] && [ "$(date +%s)" -gt $((expire + 300)) ]; then
    # Le verrou d'un autre capitaine qui tenait un sujet a expiré sans que la file change : une relance, une seule.
    tire=$expire
    echo "VEILLE $(heure) : verrou d'un autre capitaine expiré (sa date a plus de 95 min), boucle relancée"
    lancer
  fi
done
echo "VEILLE FINIE $(heure)"
exit 0
