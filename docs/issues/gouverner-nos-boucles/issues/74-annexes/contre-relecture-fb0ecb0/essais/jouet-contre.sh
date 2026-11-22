#!/usr/bin/env bash
# Jouet des essais de la contre-relecture : jouet-contre.sh <dossier> <veille.sh> [<boucle.sh réel>] [<préparation>]
# Pose <dossier>/{veille.sh, boucle.sh, file.sh}, un dépôt nu origine.git (develop) et son clone <dossier>/clone.
# boucle.sh : le vrai s'il est donné, sinon une doublure qui fait comme lui ses lignes 191 à 207 (verrou `boucle.verrou`
# sur le descripteur 9, « pid pgid » dedans, REFUS en 9, `--reprendre` qui retire le fichier d'arrêt, ARRÊT demandé en
# 10), note ses arguments dans <dossier>/arguments, dort BOUCLE_SLEEP secondes puis écrit FILE VIDE.
# file.sh : doublure, note chaque appel dans <dossier>/sondes, dort FILE_SLEEP secondes (FILE_SLEEP_PREMIER au premier
# appel seulement), rend <dossier>/file-etat s'il existe (sinon une file vide).
set -e
d=$1; src=$2; boucle=${3-}; prep=${4-}
mkdir -p "$d"
cp "$src" "$d/veille.sh"
if [ -n "$boucle" ]; then cp "$boucle" "$d/boucle.sh"; else
cat > "$d/boucle.sh" <<'DOUBLURE'
#!/usr/bin/env bash
D=$(cd "$(dirname "$0")" && pwd)
C=$(git rev-parse --path-format=absolute --git-common-dir)
echo "boucle $* $$" >> "$D/arguments"
exec 9>>"$C/boucle.verrou"
flock -n 9 || { echo "REFUS : une boucle tourne déjà (pid $(cut -d' ' -f1 "$C/boucle.verrou" 2>/dev/null))" >&2; exit 9; }
echo "$$ $(ps -o pgid= -p $$ | tr -d ' ')" > "$C/boucle.verrou"
[ "${1-}" != --reprendre ] || rm -f "$C/boucle-arret"
[ ! -e "$C/boucle-arret" ] || { echo "ARRÊT demandé ($C/boucle-arret)" >&2; exit 10; }
[ -z "${BOUCLE_SLEEP-}" ] || /bin/sleep "$BOUCLE_SLEEP"
echo "FILE VIDE"
DOUBLURE
fi
cat > "$d/file.sh" <<'DOUBLURE'
#!/usr/bin/env bash
D=$(cd "$(dirname "$0")" && pwd)
n=$(cat "$D/sondes" 2>/dev/null | wc -l)
echo "file $$" >> "$D/sondes"
[ "$n" != 0 ] || [ -z "${FILE_SLEEP_PREMIER-}" ] || /bin/sleep "$FILE_SLEEP_PREMIER"
[ -z "${FILE_SLEEP-}" ] || /bin/sleep "$FILE_SLEEP"
[ ! -f "$D/file-etat" ] || cat "$D/file-etat"
exit 0
DOUBLURE
chmod +x "$d"/*.sh
echo boot-1 > "$d/boot"
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@e.org GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@e.org
git init -q --bare -b develop "$d/origine.git"
git clone -q "$d/origine.git" "$d/clone" 2>/dev/null
cd "$d/clone"
echo jouet > README.md
if [ -n "$prep" ]; then mkdir -p .claude; printf '{"preparerCapitaine": %s}\n' "$(printf '%s' "$prep" | jq -Rs .)" > .claude/chaine.json; fi
git add -A && git commit -qm initial && git push -q origin HEAD:develop
