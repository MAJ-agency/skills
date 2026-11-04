#!/usr/bin/env bash
# Diff relu par la revue adversariale (étape 1 de SKILL.md).
#
# usage : diff-revue.sh [<base>] [<zone>…]
#   <base>  défaut origin/develop (origin/sujet/<nom> pour une sous-PR de sujet) ; récupérée par fetch.
#   <zone>  chemins à garder (découpage d'un diff de plus de 2 000 lignes : apps/api, apps/web…).
# Écrit $REVUE_DIR/diff.patch et $REVUE_DIR/stat.txt (REVUE_DIR défaut : ${TMPDIR:-/tmp}/revue).
#
# Exclus : lockfile, index générés (scripts/docs/index-generes.json, vérifiés par leurs gates),
# snapshots. Migrations, seeds et specs restent dans le diff.
set -euo pipefail
base="${1:-origin/develop}"; shift || true
dir="${REVUE_DIR:-${TMPDIR:-/tmp}/revue}"; mkdir -p "$dir"
racine=$(git rev-parse --show-toplevel)
git fetch -q origin "${base#origin/}" 2>/dev/null || true
exclus=(':!pnpm-lock.yaml' ':!**/__snapshots__/**' ':!**/*.snap')
if [[ -f "$racine/scripts/docs/index-generes.json" ]]; then
  while IFS= read -r chemin; do
    [[ -n "$chemin" ]] && exclus+=(":!$chemin")
  done < <(node -e 'for (const i of JSON.parse(require("fs").readFileSync(process.argv[1],"utf8")).index) console.log(typeof i === "string" ? i : i.chemin)' "$racine/scripts/docs/index-generes.json")
fi
zones=("$@")
git -C "$racine" diff "$base...HEAD" --stat -- "${zones[@]:-.}" "${exclus[@]}" > "$dir/stat.txt"
git -C "$racine" diff "$base...HEAD" -- "${zones[@]:-.}" "${exclus[@]}" > "$dir/diff.patch"
lignes=$(wc -l < "$dir/diff.patch")
echo "base=$base sommet=$(git rev-parse --short HEAD) lignes=$lignes → $dir/diff.patch"
if (( lignes > 2000 )); then
  echo "Plus de 2 000 lignes : un lot par zone (apps/api, apps/web, apps/mobile, packages + scripts), REVUE_DIR distinct, un sous-agent par lot." >&2
fi
