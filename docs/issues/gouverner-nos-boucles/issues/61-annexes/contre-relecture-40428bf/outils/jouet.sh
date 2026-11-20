# Bibliothèque des essais : un projet jouet (distant nu, auteur, sujet), le clone d'une session de relecture
# (superficiel, une branche), et l'outil Bash simulé (eval dans une liste &&, dossier courant gardé sur sortie 0).
# À sourcer. Variables : C (clone du plugin), K (dossier du skill), E (dossier de l'essai).
C=${PLUGIN:-$PWD/clone}
K=$C/skills/chaine/relecture
export TMPDIR=${TMPDIR:-$PWD/tmp}
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_AUTHOR_NAME=banc GIT_AUTHOR_EMAIL=banc@example.org \
  GIT_COMMITTER_NAME=banc GIT_COMMITTER_EMAIL=banc@example.org GIT_TERMINAL_PROMPT=0
unset GIT_CONFIG_COUNT GIT_CONFIG_KEY_0 GIT_CONFIG_VALUE_0 GIT_CONFIG_KEY_1 GIT_CONFIG_VALUE_1 GIT_CONFIG_KEY_2 GIT_CONFIG_VALUE_2

jouet() { # jouet <nom> : crée le projet jouet sous essais/<nom>
  E=${ESSAIS:-$PWD/essais}/$1
  rm -rf "$E"; mkdir -p "$E/bin" "$E/scratch pad é"
  O=$E/origine.git AU=$E/auteur SE=$E/session SP="$E/scratch pad é"
  cat > "$E/bin/pnpm" <<'P'
#!/bin/bash
echo "pnpm $* (dans $PWD)" >> "${FAUX_PNPM:-/dev/null}"
[ -z "$FAUX_PNPM_EN_PANNE" ] || exit 1
if [ "$1" = install ] && [ -f package.json ]; then
  s=$(node -e 'const p=require("./package.json");process.stdout.write((p.scripts&&p.scripts.postinstall)||"")')
  [ -z "$s" ] || bash -c "$s" || exit 1
fi
[ "$1" = exec ] && cat > /dev/null
exit 0
P
  chmod +x "$E/bin/pnpm"
  export PATH="$E/bin:${PATH#*/essais/*/bin:}" FAUX_PNPM=$E/pnpm.log
  git init -q --bare "$O"; git init -q -b develop "$AU"; git -C "$AU" remote add origin "file://$O"
  mkdir -p "$AU/scripts/chaine" "$AU/scripts/docs"
  for d in fusionner sujet revue-adversariale revue-de-ticket; do
    for f in "$C/skills/chaine/$d/scripts/"*; do case $f in *.test.mjs) ;; *) cp "$f" "$AU/scripts/chaine/";; esac; done
  done
  cp "$C/skills/monorepo/socle-monorepo/references/scripts/docs/"{identifiants.mjs,environnement-de-banc.mjs} "$AU/scripts/docs/"
  ec scripts/docs/adr-index.mjs "import { readdirSync, writeFileSync } from 'node:fs';
writeFileSync('docs/adr/README.md', readdirSync('docs/adr').filter((f) => /^ADR_/.test(f)).sort().map((f) => '- ' + f + '\\n').join(''));"
  ec scripts/docs/index-generes.json '{"index":[{"chemin":"docs/adr/README.md","commande":"node scripts/docs/adr-index.mjs"}]}'
  ec .claude/chaine.json '{"cheminsSensibles":["apps/api/src/auth/"]}'
  ec .claude/settings.json '{}'
  ec CLAUDE.md '# Les règles de la base'
  ec .gitignore 'node_modules'
  ec docs/adr/ADR_ALL_ARC-1-socle.md '# Socle'
  ec docs/adr/README.md '- ADR_ALL_ARC-1-socle.md'
  ec docs/features/facture/all/SPEC_ALL_FAC-1-facture.spec.md $'# Facture\n\nSujet: sujet/facture\n\n| 03 | le total |'
  ec docs/features/facture/all/issues/SPEC_ALL_FAC-1-facture.03.issue.md $'# SPEC_ALL_FAC-1.03 — Le total\n\nStatus: ready-for-agent\nType: task\nRègles: —\nSujet: sujet/facture\nSensibles: apps/api/src/auth/ — accord de la MOA, 2026-11-18\n\n## Surfaces\n'
  ec apps/api/src/facture/total.ts 'export const total = () => 0;'
  ec apps/api/src/auth/jeton.ts 'export const duree = 1;'
  co "chore: socle" >/dev/null
  for j in 1 2 3; do ec docs/journal.md "jour $j"; co "docs: jour $j" >/dev/null; done
  git -C "$AU" push -q origin develop
  git -C "$AU" switch -q -c sujet/facture; ec docs/sujet.md sujet; co "docs: ouvre le sujet" >/dev/null
  git -C "$AU" push -q origin sujet/facture
}
ec() { mkdir -p "$(dirname "$AU/$1")"; printf '%s\n' "$2" > "$AU/$1"; }
co() { git -C "$AU" add -A && git -C "$AU" commit -q -m "$1" && git -C "$AU" rev-parse HEAD; }
cloner() { # cloner <branche> : le clone de la session
  git clone -q --depth 2 --single-branch --branch "$1" "file://$O" "$SE"; CWD=$SE
}
outil() { # outil <texte> : l'outil Bash simulé ; écrit la sortie, garde le dossier sur 0
  local r note=$E/.pwd
  ( cd "$CWD" && bash -c 'eval "$1" && pwd -P >| "$2"' _ "$1" "$note" ) > "$E/.out" 2>&1; r=$?
  [ $r != 0 ] || CWD=$(cat "$note")
  cat "$E/.out"; echo "[outil : statut $r, cwd ${CWD#$E/}]"
  return 0
}
g() { # g <sous-commande> [args…] : la ligne de SKILL.md
  local s=$1; shift
  local args=""; for a in "$@"; do args+=" '$a'"; done
  outil "bash '$K/scripts/gestes.sh' $s '$BR'$args"
}
br() { BR="$SP/relecture/pr-$1-tour-${2:-1}"; }
