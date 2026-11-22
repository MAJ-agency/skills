# source env.sh <dossier>
: "${TMPDIR:?TMPDIR à poser (dossier de travail des essais)}"
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@e.org GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@e.org
export CAPITAINE_ID=capitaine-essai VEILLE_BOOT_ID=$1/boot
J=$1
etat() { (cd "$J/clone" && env -u CAPITAINE_ID bash "$J/veille.sh" --etat; echo "[sortie $?]"); }
