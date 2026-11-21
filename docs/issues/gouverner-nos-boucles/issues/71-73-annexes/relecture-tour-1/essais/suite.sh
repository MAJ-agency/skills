#!/usr/bin/env bash
# Attend une charge < 3 (60 min au plus), puis joue la suite entière (les quatre motifs de pnpm test) dans le clone donné.
set -u
cd "$1"
export TMPDIR="${TMPDIR:-/tmp}"
debut=$(date +%s)
while awk '{exit !($1 >= 3)}' /proc/loadavg && [ $(( $(date +%s) - debut )) -lt 3600 ]; do sleep 20; done
echo "charge au départ : $(cut -d' ' -f1-3 /proc/loadavg) ; attente $(( $(date +%s) - debut )) s ; $(date -u +%FT%TZ)"
t0=$(date +%s)
timeout 3000 node --test --test-reporter=tap 'scripts/*.test.mjs' 'skills/*/*/scripts/*.test.mjs' 'skills/*/*/references/scripts/*/*.test.mjs' 'skills/*/*/references/agent/*.test.mjs' > ../suite.tap 2>&1
rc=$?
echo "sortie $rc ; durée $(( $(date +%s) - t0 )) s ; charge à la fin : $(cut -d' ' -f1-3 /proc/loadavg)"
grep -E '^# (tests|suites|pass|fail|cancelled|skipped|todo|duration_ms) ' ../suite.tap
grep -E '^not ok ' ../suite.tap
