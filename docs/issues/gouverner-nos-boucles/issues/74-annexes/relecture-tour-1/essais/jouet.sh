#!/usr/bin/env bash
# Jouet des essais : jouet.sh <dossier> <veille.sh à copier> [<commande de préparation>]
# Pose <dossier>/{veille.sh,boucle.sh (doublure),file.sh (doublure)}, un dépôt nu origine.git et son clone.
# Doublures : BOUCLE_SLEEP / FILE_SLEEP font dormir la boucle / la sonde ; la boucle note ses arguments,
# honore --reprendre et le fichier d'arrêt comme la vraie (sortie 10).
set -e
d=$1; src=$2; prep=${3-}
mkdir -p "$d"
cp "$src" "$d/veille.sh"
cat > "$d/boucle.sh" <<EOF
#!/usr/bin/env bash
C=\$(git rev-parse --path-format=absolute --git-common-dir)
echo "boucle \$* \$\$" >> "$d/arguments"
[ "\${1-}" != --reprendre ] || rm -f "\$C/boucle-arret"
[ ! -e "\$C/boucle-arret" ] || { echo "ARRÊT demandé" >&2; exit 10; }
[ -z "\${BOUCLE_SLEEP-}" ] || /bin/sleep "\$BOUCLE_SLEEP"
echo "FILE VIDE"
EOF
cat > "$d/file.sh" <<EOF
#!/usr/bin/env bash
echo "file \$\$" >> "$d/sondes"
[ -z "\${FILE_SLEEP-}" ] || /bin/sleep "\$FILE_SLEEP"
exit 0
EOF
chmod +x "$d"/*.sh
echo boot-1 > "$d/boot"
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@e.org GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@e.org
git init -q --bare -b develop "$d/origine.git"
git clone -q "$d/origine.git" "$d/clone" 2>/dev/null
cd "$d/clone"
echo jouet > README.md
if [ -n "$prep" ]; then mkdir -p .claude; printf '{"preparerCapitaine": %s}\n' "$(printf '%s' "$prep" | jq -Rs .)" > .claude/chaine.json; fi
git add -A && git commit -qm initial && git push -q origin HEAD:develop
