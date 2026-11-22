#!/usr/bin/env bash
# La suite entière (les quatre motifs de `pnpm test`) dans le clone donné, après une charge < 3 (60 min d'attente au
# plus) ; écrit la sortie TAP dans <sortie>.tap et le résumé sur la sortie standard.
# Usage : bash suite.sh <clone> <sortie sans extension>
set -u
cd "$1"
export TMPDIR="${TMPDIR:-/tmp}"
debut=$(date +%s)
while awk '{exit !($1 >= 3)}' /proc/loadavg && [ $(( $(date +%s) - debut )) -lt 3600 ]; do sleep 20; done
echo "sommet $(git rev-parse HEAD) ; arbre $(git write-tree 2>/dev/null || git rev-parse 'HEAD^{tree}')"
echo "charge au départ : $(cut -d' ' -f1-3 /proc/loadavg) ; attente $(( $(date +%s) - debut )) s ; $(date -u +%FT%TZ)"
t0=$(date +%s)
timeout 3000 node --test --test-reporter=tap 'scripts/*.test.mjs' 'skills/*/*/scripts/*.test.mjs' 'skills/*/*/references/scripts/*/*.test.mjs' 'skills/*/*/references/agent/*.test.mjs' > "$2.tap" 2>&1
rc=$?
echo "sortie $rc ; durée $(( $(date +%s) - t0 )) s ; charge à la fin : $(cut -d' ' -f1-3 /proc/loadavg) ; $(date -u +%FT%TZ)"
grep -E '^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) ' "$2.tap"
grep -E '^not ok ' "$2.tap"
exit 0
