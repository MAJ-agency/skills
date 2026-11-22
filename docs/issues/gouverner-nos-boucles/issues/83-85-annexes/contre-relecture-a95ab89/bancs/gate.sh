#!/usr/bin/env bash
# Joue le gate `tickets` d'une version du plugin (arbre $1) sur un projet (racine $2, dépôt git), avec la grammaire
# du projet et ligne-sujet.mjs du plugin. Arguments suivants : passés au gate (--elaguer…).
# Sortie : stdout puis stderr, préfixés, et la sortie du gate.
set -u
PLUGIN=$1; RACINE=$2; shift 2
G=$(mktemp -d "${TMPDIR:-/tmp}/gate.XXXXXX")
mkdir -p "$G/g/scripts/verify" "$G/g/scripts/docs"
cp "$PLUGIN/skills/chaine/tickets/references/scripts/verify/tickets.mjs" "$PLUGIN/skills/chaine/tickets/references/scripts/verify/tickets-regles.mjs" "$G/g/scripts/verify/"
cp "$PLUGIN/skills/chaine/tickets/references/scripts/docs/ligne-sujet.mjs" "$G/g/scripts/docs/"
if [ -f "$RACINE/scripts/docs/identifiants.mjs" ]; then cp "$RACINE/scripts/docs/identifiants.mjs" "$G/g/scripts/docs/";
else cp "$PLUGIN/skills/monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs" "$G/g/scripts/docs/"; fi
PROJET_RACINE="$RACINE" node "$G/g/scripts/verify/tickets.mjs" "$@" >"$G/out" 2>"$G/err"
code=$?
sed 's/^/OUT| /' "$G/out"; sed 's/^/ERR| /' "$G/err"; echo "SORTIE $code"
rm -rf "$G"
