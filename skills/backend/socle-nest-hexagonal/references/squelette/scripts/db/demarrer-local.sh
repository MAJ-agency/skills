#!/usr/bin/env bash
# Allume la base PostgreSQL locale décrite par compose.yaml, avec ou sans Docker.
#
# Pourquoi. Les tests de base (`test:db`), la génération des types (`db:types`) et le capitaine
# (régénération des index avant chaque fusion) exigent une base allumée. Sur un poste, Docker la
# fournit (`docker compose up`). En session cloud, il n'y a pas de Docker mais un PostgreSQL
# installé et éteint : trois sessions ont dû le découvrir et l'allumer à la main. Ce script fait
# l'un ou l'autre, et ne fait rien si la base répond déjà.
#
# Port, base, utilisateur et mot de passe sont lus dans le service `postgres` de compose.yaml :
# une seule source. Idempotent, et sûr si deux sessions l'appellent en même temps (verrou).
# Usage : bash scripts/db/demarrer-local.sh
#   Appelé par le script de démarrage de l'environnement cloud ; à relancer à la main après une
#   reprise de session (le serveur ne survit pas au conteneur). Voir docs/agents/pieges.md.
set -euo pipefail

racine=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
compose="$racine/compose.yaml"
[ -f "$compose" ] || { echo "demarrer-local : $compose introuvable" >&2; exit 2; }

# Le seul bloc du service `postgres` : un autre service déclaré avant ne doit pas être lu.
bloc=$(awk '
  /^  postgres:[[:space:]]*$/ { dedans = 1; next }
  dedans && /^  [^[:space:]]/ { exit }
  dedans && /^[^[:space:]]/ { exit }
  dedans { print }
' "$compose")
lire() { sed -nE "s/^[[:space:]]*$1:[[:space:]]*[\"']?([^\"'[:space:]]+)[\"']?[[:space:]]*$/\1/p" <<<"$bloc" | head -n 1; }
base=$(lire POSTGRES_DB)
utilisateur=$(lire POSTGRES_USER)
mot_de_passe=$(lire POSTGRES_PASSWORD)
port=$(sed -nE "s/^[[:space:]]*-[[:space:]]*[\"']?([0-9]+):5432[\"']?[[:space:]]*$/\1/p" <<<"$bloc" | head -n 1)
for v in base utilisateur mot_de_passe port; do
  [ -n "${!v}" ] || { echo "demarrer-local : $v illisible dans le service postgres de $compose" >&2; exit 2; }
done

# Docker d'abord : `up --wait` est idempotent et attend le healthcheck de compose.yaml.
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  docker compose -f "$compose" up -d --wait
  echo "demarrer-local : base allumée par Docker sur le port $port"
  exit 0
fi

bin=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -n 1 || true)
if [ -z "$bin" ]; then
  if command -v docker >/dev/null 2>&1; then
    echo "demarrer-local : Docker est installé mais son démon ne répond pas, et aucun PostgreSQL local (/usr/lib/postgresql/*/bin)" >&2
  else
    echo "demarrer-local : ni Docker ni PostgreSQL installé (/usr/lib/postgresql/*/bin)" >&2
  fi
  exit 3
fi

# « Prête » = on s'y connecte avec les identifiants de compose.yaml, sur la bonne base. Un port
# simplement ouvert (un autre projet sur 5433) ne compte pas.
prete() { PGPASSWORD=$mot_de_passe "$bin/psql" -h 127.0.0.1 -p "$port" -U "$utilisateur" -d "$base" -tAc 'SELECT 1' >/dev/null 2>&1; }
port_ouvert() { (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; }

if prete; then
  echo "demarrer-local : la base « $base » répond déjà sur le port $port"
  exit 0
fi

donnees=${PGDATA_LOCAL:-/var/tmp/$base-pg}
# Deux sessions qui démarrent ensemble : une seule fait initdb et pg_ctl, l'autre attend puis voit
# la base prête.
exec 9>"$donnees.lock"
flock 9
if prete; then
  echo "demarrer-local : la base « $base » répond déjà sur le port $port"
  exit 0
fi

# PostgreSQL refuse de tourner en root : on passe par l'utilisateur postgres quand on l'est,
# avec de vrais arguments (jamais une chaîne recomposée pour un shell).
if [ "$(id -u)" = 0 ]; then
  id postgres >/dev/null 2>&1 || useradd --system --no-create-home postgres
  en_pg() { runuser -u postgres -- "$@"; }
else
  en_pg() { "$@"; }
fi

mkdir -p "$donnees"
if [ "$(id -u)" = 0 ]; then
  chown postgres "$donnees"
elif [ ! -O "$donnees" ]; then
  echo "demarrer-local : $donnees appartient à un autre utilisateur ; PGDATA_LOCAL=<dossier à vous> pour en choisir un autre" >&2
  exit 4
fi
chmod 700 "$donnees"

if [ ! -f "$donnees/PG_VERSION" ]; then
  mdp=$(mktemp)
  trap 'rm -f "$mdp"' EXIT
  printf '%s\n' "$mot_de_passe" >"$mdp"
  [ "$(id -u)" = 0 ] && chown postgres "$mdp"
  en_pg "$bin/initdb" -D "$donnees" -U "$utilisateur" --pwfile="$mdp" -A scram-sha-256 >/dev/null
  rm -f "$mdp"
fi

if en_pg "$bin/pg_ctl" -D "$donnees" status >/dev/null 2>&1; then
  echo "demarrer-local : un serveur tourne déjà sur $donnees, mais ne répond pas sur le port $port avec les identifiants de compose.yaml ; l'arrêter : pg_ctl -D $donnees stop" >&2
  exit 4
fi
if port_ouvert; then
  echo "demarrer-local : le port $port est pris par un autre service (un autre projet ?) ; le libérer ou changer le port dans compose.yaml" >&2
  exit 4
fi
# `9>&-` : le serveur ne doit pas hériter du verrou, sinon il le garde ouvert et bloque le prochain appel.
en_pg "$bin/pg_ctl" -D "$donnees" -o "-p $port -k /tmp" -l "$donnees/journal.log" start -w >/dev/null 9>&-

if ! prete; then
  PGPASSWORD=$mot_de_passe "$bin/createdb" -h 127.0.0.1 -p "$port" -U "$utilisateur" "$base"
fi
prete || { echo "demarrer-local : la base « $base » ne répond pas après démarrage ; voir $donnees/journal.log" >&2; exit 5; }
echo "demarrer-local : base « $base » allumée sans Docker sur le port $port ($donnees)"
