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
#
# Encodage. La base est toujours créée en UTF8 (`initdb --encoding=UTF8`, `createdb -E UTF8 -T template0`) :
# sur une machine en locale C/POSIX, PostgreSQL choisit sinon SQL_ASCII, et `normalize(…)` échoue. Une
# base ou un serveur déjà existant qui n'est pas en UTF8 est refusé (sortie 6) avec les commandes pour le
# recréer ; le script ne supprime jamais rien lui-même. Locale : PG_LOCALE_UTF8 (C.UTF-8 par défaut) si
# `locale -a` la connaît, sinon --no-locale (l'encodage reste UTF8).
# Sorties : 2 compose.yaml illisible, 3 aucun PostgreSQL local, 4 serveur ou port en conflit, 5 base qui ne
# répond pas après démarrage, 6 base ou serveur existant hors UTF8.
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

# Un dossier /usr/lib/postgresql/<n>/bin peut ne contenir que le client (paquet postgresql-client) :
# on ne retient que la version la plus récente qui a aussi le serveur.
bin=""
for d in $(ls -d "${PG_RACINE:-/usr/lib/postgresql}"/*/bin 2>/dev/null | sort -rV); do
  if [ -x "$d/initdb" ] && [ -x "$d/pg_ctl" ] && [ -x "$d/psql" ]; then bin=$d; break; fi
done
if [ -z "$bin" ]; then
  {
    if command -v docker >/dev/null 2>&1; then
      echo "demarrer-local : Docker est installé mais son démon ne répond pas (le démarrer : Docker Desktop, ou sudo systemctl start docker)."
    else
      echo "demarrer-local : Docker n'est pas installé."
    fi
    client=$(ls -d "${PG_RACINE:-/usr/lib/postgresql}"/*/bin 2>/dev/null | sort -V | tail -n 1 || true)
    if [ -n "$client" ]; then
      version=$(basename "$(dirname "$client")")
      echo "  Seul le client PostgreSQL $version est installé ($client), sans serveur : sudo apt install postgresql-$version"
    else
      echo "  Aucun PostgreSQL local (/usr/lib/postgresql/*/bin) : sudo apt install postgresql"
    fi
    echo "  Puis relancer : bash scripts/db/demarrer-local.sh"
  } >&2
  exit 3
fi

# « Prête » = on s'y connecte avec les identifiants de compose.yaml, sur la bonne base. Un port
# simplement ouvert (un autre projet sur 5433) ne compte pas.
prete() { PGPASSWORD=$mot_de_passe "$bin/psql" -h 127.0.0.1 -p "$port" -U "$utilisateur" -d "$base" -tAc 'SELECT 1' >/dev/null 2>&1; }
port_ouvert() { (exec 3<>"/dev/tcp/127.0.0.1/$port") 2>/dev/null; }

# Encodage d'une base ($1), lu sur la base `postgres` ; vide si la base n'existe pas.
encodage_de() {
  PGPASSWORD=$mot_de_passe "$bin/psql" -h 127.0.0.1 -p "$port" -U "$utilisateur" -d postgres -tAc \
    "SELECT pg_encoding_to_char(encoding) FROM pg_database WHERE datname = '$1'" 2>/dev/null | head -n 1 || true
}
# En root, les commandes à copier passent par l'utilisateur postgres, comme `en_pg`.
prefixe_pg() { if [ "$(id -u)" = 0 ]; then printf 'runuser -u postgres -- '; fi; }
derniere_ligne_refus() {
  echo "  bash scripts/db/demarrer-local.sh"
  echo "  puis rejouer les migrations du projet"
}
verifier_base_utf8() {
  local enc
  enc=$(encodage_de "$base")
  if [ -n "$enc" ] && [ "$enc" != "UTF8" ]; then
    {
      echo "demarrer-local : base $base en $enc : la recréer (la base locale est jetable : rien à sauvegarder). Commandes :"
      echo "  PGPASSWORD=$mot_de_passe $bin/psql -h 127.0.0.1 -p $port -U $utilisateur -d postgres -c 'DROP DATABASE $base'"
      derniere_ligne_refus
    } >&2
    exit 6
  fi
}

if prete; then
  verifier_base_utf8
  echo "demarrer-local : la base « $base » répond déjà sur le port $port"
  exit 0
fi

donnees=${PGDATA_LOCAL:-/var/tmp/$base-pg}
# Deux sessions qui démarrent ensemble : une seule fait initdb et pg_ctl, l'autre attend puis voit
# la base prête.
exec 9>"$donnees.lock"
flock 9
if prete; then
  verifier_base_utf8
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
  # --encoding=UTF8 échoue sous une locale d'un autre encodage : la locale accompagne l'encodage.
  locale_utf8=${PG_LOCALE_UTF8:-C.UTF-8}
  normaliser() { tr 'A-Z' 'a-z' | sed 's/utf-8/utf8/'; }
  if locale -a 2>/dev/null | normaliser | grep -qxF "$(printf '%s' "$locale_utf8" | normaliser)"; then
    option_locale="--locale=$locale_utf8"
  else
    option_locale="--no-locale"
    echo "demarrer-local : locale $locale_utf8 absente de ce système, repli sur --no-locale (encodage UTF8 conservé)"
  fi
  en_pg "$bin/initdb" -D "$donnees" -U "$utilisateur" --pwfile="$mdp" -A scram-sha-256 --encoding=UTF8 "$option_locale" >/dev/null
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

# Un serveur déjà initialisé dans un autre encodage : ses bases en héritent, on ne le répare pas ici.
enc_serveur=$(encodage_de template1)
if [ -n "$enc_serveur" ] && [ "$enc_serveur" != "UTF8" ]; then
  {
    echo "demarrer-local : serveur $donnees initialisé en $enc_serveur : l'arrêter et supprimer $donnees (la base locale est jetable : rien à sauvegarder). Commandes :"
    echo "  $(prefixe_pg)$bin/pg_ctl -D $donnees stop"
    echo "  $(prefixe_pg)rm -rf $donnees"
    derniere_ligne_refus
  } >&2
  exit 6
fi

if ! prete; then
  PGPASSWORD=$mot_de_passe "$bin/createdb" -h 127.0.0.1 -p "$port" -U "$utilisateur" -E UTF8 -T template0 "$base"
fi
verifier_base_utf8
prete || { echo "demarrer-local : la base « $base » ne répond pas après démarrage ; voir $donnees/journal.log" >&2; exit 5; }
echo "demarrer-local : base « $base » allumée sans Docker sur le port $port ($donnees)"
