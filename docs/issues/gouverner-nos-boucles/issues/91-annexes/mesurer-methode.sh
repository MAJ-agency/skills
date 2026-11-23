#!/bin/sh
# Ce que coûterait la lecture de docs/methode/ par le gate references-agent : le gate du plugin tel quel (lu), puis le
# même avec docs/methode/**.md dans les fichiers lus (methode), joués sur une copie de chaque dépôt, dette vidée (toute
# référence cassée sort « nouvelle »). Les dépôts ne sont pas modifiés.
# Usage : sh mesurer-methode.sh <plugin> <dépôt>…
P=$1; shift
V=$(mktemp -d)
for v in lu methode; do
  mkdir -p "$V/$v/scripts/verify" "$V/$v/scripts/docs"
  cp "$P/skills/monorepo/socle-monorepo/references/scripts/verify/references-agent.mjs" "$P/skills/monorepo/socle-monorepo/references/scripts/verify/references-agent-regles.mjs" "$V/$v/scripts/verify/"
  cp "$P/skills/monorepo/socle-monorepo/references/scripts/docs/identifiants.mjs" "$V/$v/scripts/docs/"
done
node -e '
const fs = require("fs"); const f = process.argv[1]; const s = fs.readFileSync(f, "utf8");
const a = "    /^docs\\/agents\\/.+\\.md$/.test(f),";
if (s.split(a).length !== 2) { console.error("lecture introuvable"); process.exit(1); }
fs.writeFileSync(f, s.replace(a, "    /^docs\\/agents\\/.+\\.md$/.test(f) ||\n    /^docs\\/methode\\/.+\\.md$/.test(f),"));
' "$V/methode/scripts/verify/references-agent.mjs" || exit 1
for D in "$@"; do
  echo "#### $(basename "$D")"
  for v in lu methode; do
    T=$(mktemp -d); cp -r "$D/." "$T/"
    printf '{"references":[]}\n' > "$T/scripts/verify/references-agent-dette.json"
    PROJET_RACINE="$T" node "$V/$v/scripts/verify/references-agent.mjs" > "$T.out" 2>&1
    echo "== $v : $(grep -c ' — ' "$T.out") référence(s) cassée(s), dont docs/methode/ : $(grep -c '^  docs/methode/' "$T.out")"
    grep '^  docs/methode/' "$T.out"
    rm -rf "$T" "$T.out"
  done
done
rm -rf "$V"
