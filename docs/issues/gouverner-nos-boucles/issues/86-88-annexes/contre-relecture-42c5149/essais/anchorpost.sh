#!/usr/bin/env bash
# Le relais `preuves.mjs` de la PR 154 (42c5149) dans un arbre jetable d'un clone d'Anchorpost (`develop`), contre la CLI
# publiée `@maj-agency/anchorpost` 2.0.1 installée à part. Rien n'est poussé ; l'arbre est remis après chaque essai.
# Usage : bash anchorpost.sh <arbre jetable d'Anchorpost> <dossier de la CLI 2.0.1 (node_modules/.bin/anchorpost)> <clone de skills à 42c5149>
set -u
AP=$1 CLI=$2 SK=$3
cd "$AP" || exit 1
export GIT_AUTHOR_NAME=essai GIT_AUTHOR_EMAIL=essai@example.invalid GIT_COMMITTER_NAME=essai GIT_COMMITTER_EMAIL=essai@example.invalid
V="$SK/skills/monorepo/socle-tests/references/scripts/verify"
propre() { git checkout -q -- . ; git clean -fdq -e node_modules ; git switch -q --detach origin/develop 2>/dev/null; }
chrono() { local s; s=$(date +%s.%N); "$@"; local r=$?; printf 'sortie %s (%.1f s)\n' "$r" "$(echo "$(date +%s.%N) - $s" | bc)"; }
echo "Anchorpost $(git rev-parse --short HEAD), CLI $("$CLI/node_modules/.bin/anchorpost" --version), $(uptime | sed 's/.*load/charge/')"
propre; rm -rf node_modules; cp "$V/preuves.mjs" scripts/verify/
echo "--- 1. tel quel : la CLI est le paquet apps/cli, pas de node_modules/.bin/anchorpost à la racine (décision 7)"
chrono node scripts/verify/preuves.mjs
mkdir -p node_modules/.bin && ln -sf "$(readlink -f "$CLI/node_modules/.bin/anchorpost")" node_modules/.bin/anchorpost
echo "--- 2. la CLI 2.0.1 posée à la racine ; fin de tour (sans option), arbre propre"
chrono node scripts/verify/preuves.mjs
echo "--- 3. --base HEAD~3 (une PR de trois commits)"
chrono node scripts/verify/preuves.mjs --base HEAD~3
echo "    taille du rapport JSON : $(node_modules/.bin/anchorpost compare --base HEAD~3 --json | wc -c) octets (le tampon du relais : 256 Mio)"
echo "--- 4. sous GitHub Actions : le rapport entier ajouté au résumé du job"
: > ../resume.md; GITHUB_STEP_SUMMARY=$PWD/../resume.md node scripts/verify/preuves.mjs --base HEAD~3 > /dev/null; echo "sortie $? ; $(wc -l < ../resume.md) lignes, la première : $(head -1 ../resume.md)"; rm -f ../resume.md
echo "--- 5. enforce, un cas ajouté à RULE_ALL_ANC-19 sans preuve, dans l'arbre de travail"
python3 - <<'EOF'
import json
p='docs/metier/regles/all/RULE_ALL_ANC-19.md'; t=open(p,encoding='utf8').read()
t=t.replace("cases:\n","cases:\n  - {\n      id: cas-ajoute-sans-preuve,\n      title: Un cas ajouté sans preuve,\n      kind: edge,\n      scope: technical,\n      family: limits,\n    }\n",1); open(p,'w',encoding='utf8').write(t)
m='anchorpost/manifest.json'; t=open(m,encoding='utf8').read(); open(m,'w',encoding='utf8').write(t.replace('"sufficiency": "observe"','"sufficiency": "enforce"',1))
c='.claude/chaine.json'; j=json.load(open(c,encoding='utf8')); j['gatesRapides']=['scripts/verify/preuves.mjs']; open(c,'w',encoding='utf8').write(json.dumps(j,ensure_ascii=False,indent=2)+"\n")
EOF
chrono node scripts/verify/preuves.mjs
echo "--- 6. le hook de fin de tour d'Anchorpost (scripts/agent/fin-de-tour.mjs), gatesRapides = [preuves.mjs]"
echo '{}' | CLAUDE_PROJECT_DIR=$PWD chrono node scripts/agent/fin-de-tour.mjs
echo "--- 7. pre-push : le commit poussé porte l'écart, la preuve n'est que dans l'arbre de travail (fichier non suivi)"
git switch -q -c essai-pre-push && git add docs/metier/regles/all/RULE_ALL_ANC-19.md anchorpost/manifest.json && git commit -q --no-verify -m "essai"
cat > apps/cli/src/build/essai-contre.spec.ts <<'EOF'
import { describe, expect, it } from "vitest";

describe("essai de la contre-relecture", () => {
  it("[RULE_ALL_ANC-19#cas-ajoute-sans-preuve] une preuve qui n'existe que dans l'arbre de travail", () => {
    expect(1 + 1).toBe(2);
  });
});
EOF
PRE_PUSH_REFS="refs/heads/essai-pre-push $(git rev-parse HEAD) refs/heads/essai-pre-push 0000000000000000000000000000000000000000" chrono node scripts/verify/preuves.mjs --base-auto
echo "--- 8. le même commit, arbre propre (ce que juge la CI)"
rm apps/cli/src/build/essai-contre.spec.ts; git checkout -q -- .claude/chaine.json
chrono node scripts/verify/preuves.mjs --base origin/develop
propre; git branch -D -q essai-pre-push
echo "--- 9. le banc preuves.test.mjs reposé seul dans scripts/verify/ (Anchorpost n'a pas scripts/docs/environnement-de-banc.mjs) : ce que joue check:tickets"
cp "$V/preuves.mjs" "$V/preuves.test.mjs" scripts/verify/
node --test --test-reporter=tap scripts/verify/preuves.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) |ERR_MODULE_NOT_FOUND\]' | head -4
echo "--- 10. le même, avec scripts/docs/environnement-de-banc.mjs du socle posé"
cp "$SK/skills/monorepo/socle-monorepo/references/scripts/docs/environnement-de-banc.mjs" scripts/docs/
node --test --test-reporter=tap scripts/verify/preuves.test.mjs 2>&1 | grep -E '^# (tests|pass|fail) '
echo "--- 11. une règle haute aux cinq cas prouvés, une famille sans réponse (limits retirée de notApplicableFamilies) : la CLI la dit partielle"
sed -i '/^  - { family: limits, reason: La règle ne fixe aucune borne. }$/d' docs/metier/regles/all/RULE_ALL_ANC-19.md
node_modules/.bin/anchorpost index . > /dev/null 2>&1
node -e 'const r=require("./anchorpost/anchorpost.json").rules.find((r)=>r.key==="RULE_ALL_ANC-19"); console.log(r.criticality.level, r.realisation.status, JSON.stringify(r.realisation.cases), "missing", JSON.stringify(r.realisation.missing))'
propre; rm -f scripts/verify/preuves.mjs; git status --short
echo "fin, $(uptime | sed 's/.*load/charge/')"
