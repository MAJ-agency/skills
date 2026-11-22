# source env-contre.sh <dossier du jouet>
: "${TMPDIR:?TMPDIR à poser (dossier de travail des essais)}"
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@e.org GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@e.org
export CAPITAINE_ID=capitaine-essai VEILLE_BOOT_ID=$1/boot
J=$1
etat() { (cd "$J/clone" && env -u CAPITAINE_ID bash "$J/veille.sh" --etat; echo "[sortie $?]") 2>&1 | sed "s#$TMPDIR#<tmp>#g" | tr '\n' ' '; echo; }
# Processus qui tiennent un fichier ouvert (comme `detenteurs` de boucle.sh), hors celui qui demande.
tenants() { local f p; for f in /proc/[0-9]*/fd/*; do [ "$f" -ef "$1" ] || continue; p=${f#/proc/}; p=${p%%/*}; [ "$p" = "$$" ] || echo "$p:$(cat /proc/$p/comm 2>/dev/null)"; done 2>/dev/null | sort -u | tr '\n' ' '; }
attendre() { for _ in $(seq 150); do grep -q "$2" "$1" 2>/dev/null && return 0; /bin/sleep 0.1; done; echo "(attente échue : $2)"; return 1; }
# Les orphelins d'un essai (le sommeil d'une préparation, d'un fetch, d'une boucle tuée) : les processus dont le dossier
# courant est dans le jouet, tous lancés par l'essai. À appeler après `cd /`.
nettoyer() { local p c; for p in /proc/[0-9]*; do c=$(readlink "$p/cwd" 2>/dev/null) || continue; case "$c" in "$J"|"$J"/*) kill -9 "${p#/proc/}" 2>/dev/null ;; esac; done; }
