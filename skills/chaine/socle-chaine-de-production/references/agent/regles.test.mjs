import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ajouteUneDependance, decisionCommande, decisionOutilGithub, lireDependances, paquetsAjoutes, pousseSurUnSujet, refusEdition, sansTexte, segmentsDeCommande, lintable } from './regles.mjs';
import { lireCommande, RAISON_ILLISIBLE, LECTURE_7_9, RAISON_TROP_LONGUE, appelsGit, sauteLesHooks, ecritUneRefDeSuivi, amendeUnCommit } from './regles.mjs';

const livree = { migrationExistante: () => true, migrations: 'apps/api/src/db/migrations/' };
const nouvelle = { migrationExistante: () => false, migrations: 'apps/api/src/db/migrations/' };

test('refusEdition refuse une migration déjà livrée et laisse écrire une nouvelle', () => {
  const m = 'apps/api/src/db/migrations/202611041200-care-plan.ts';
  assert.match(refusEdition(m, livree), /ne se modifie jamais/);
  assert.equal(refusEdition(m, nouvelle), null);
  assert.match(refusEdition('apps/api/prisma/migrations/2026_x/migration.sql', { ...livree, migrations: 'apps/api/prisma/migrations' }), /ne se modifie jamais/);
});

test('refusEdition laisse éditer .claude/skills : les skills du plugin vivent hors du dépôt, ceux du projet sont à lui', () => {
  for (const c of ['.claude/skills/chantier/SKILL.md', '.claude/skills/maj-skills.json', '.claude/skills/parcours-federation/SKILL.md']) assert.equal(refusEdition(c, nouvelle), null);
});

test('refusEdition refuse le lockfile et les fichiers .env, laisse .env.example', () => {
  assert.match(refusEdition('pnpm-lock.yaml', nouvelle), /pnpm install/);
  assert.match(refusEdition('apps/api/.env', nouvelle), /secrets/);
  assert.equal(refusEdition('apps/api/.env.example', nouvelle), null);
  assert.equal(refusEdition('apps/api/src/main.ts', nouvelle), null);
});

test('refusEdition normalise le chemin avant de juger : un détour (`//`, `/./`, `x/../`, `\\`) ne contourne aucun refus', () => {
  for (const c of ['pnpm-lock.yaml', './pnpm-lock.yaml', './/pnpm-lock.yaml', 'apps/../pnpm-lock.yaml', 'docs/./../pnpm-lock.yaml', '.\\pnpm-lock.yaml'])
    assert.match(refusEdition(c, nouvelle) ?? '', /pnpm install/, c);
  for (const c of ['apps/api/.env', 'apps//api/.env', 'apps/./api/.env', 'apps/web/../api/.env', 'apps\\api\\.env'])
    assert.match(refusEdition(c, nouvelle) ?? '', /secrets/, c);
  for (const c of ['apps/api/src/db/migrations/202611041200-care-plan.ts', 'apps/api/src/db//migrations/202611041200-care-plan.ts', 'apps/api/src/./db/migrations/202611041200-care-plan.ts', 'apps/web/../api/src/db/migrations/202611041200-care-plan.ts'])
    assert.match(refusEdition(c, livree) ?? '', /ne se modifie jamais/, c);
  // CODEOWNERS n'est plus généré ni gardé (décision du produit, 2026-11-18) : plus rien ne refuse son édition.
  for (const c of ['.github/CODEOWNERS', 'CODEOWNERS', 'docs/CODEOWNERS']) assert.equal(refusEdition(c, nouvelle), null, c);
});

test('decisionCommande refuse le push forcé, --no-verify, le push direct sur develop/main, le rebase d’un sujet', () => {
  assert.equal(decisionCommande('git push --force origin feat/x').decision, 'refuser');
  assert.equal(decisionCommande('git push --force-with-lease origin feat/x').decision, 'refuser');
  assert.equal(decisionCommande('git commit --no-verify -m x').decision, 'refuser');
  assert.equal(decisionCommande('git push origin develop').decision, 'refuser');
  assert.equal(decisionCommande('git push origin HEAD:main').decision, 'refuser');
  assert.equal(decisionCommande('git rebase origin/sujet/x').decision, 'refuser');
  assert.equal(decisionCommande('git push -u origin feat/spec-all-soc-1-03-x'), null);
  assert.equal(decisionCommande('npm install').decision, 'refuser');
});

test('une dépendance nouvelle est refusée, une réinstallation passe', () => {
  assert.equal(decisionCommande('pnpm add zod').decision, 'refuser');
  assert.equal(decisionCommande('pnpm --filter @x/api add -D vitest').decision, 'refuser');
  assert.equal(decisionCommande('pnpm install --frozen-lockfile 2>&1 | tail -3'), null);
  assert.equal(ajouteUneDependance('pnpm install'), false);
});

test('paquetsAjoutes : noms sans version, portée gardée, alias et sources gardés entiers', () => {
  assert.deepEqual(paquetsAjoutes('pnpm add leaflet@1.9.4 @types/leaflet@^1'), ['leaflet', '@types/leaflet']);
  assert.deepEqual(paquetsAjoutes('pnpm --filter @x/web add -D @types/leaflet'), ['@types/leaflet']);
  assert.deepEqual(paquetsAjoutes('pnpm add leaflet@npm:autre'), ['leaflet@npm:autre']);
  assert.deepEqual(paquetsAjoutes('pnpm install --frozen-lockfile'), []);
});

const prevus = (liste) => ({ dependancesPrevues: () => liste });

test('un paquet prévu par le ticket passe sans question, avec ou sans version', () => {
  const ctx = prevus(['leaflet', '@types/leaflet']);
  assert.equal(decisionCommande('pnpm add leaflet', ctx), null);
  assert.equal(decisionCommande('pnpm add leaflet@1.9.4', ctx), null);
  assert.equal(decisionCommande('pnpm --filter @x/web add -D @types/leaflet@^1', ctx), null);
});

test('un paquet prévu et un non prévu, un alias ou une option de source : la commande entière est refusée', () => {
  const ctx = prevus(['leaflet']);
  assert.equal(decisionCommande('pnpm add leaflet zod', ctx).decision, 'refuser');
  assert.equal(decisionCommande('pnpm add leaflet && pnpm add zod', ctx).decision, 'refuser');
  assert.equal(decisionCommande('pnpm add leaflet@npm:autre', ctx).decision, 'refuser');
  for (const option of ['--registry=https://x.example', '--registry https://x.example', '--config.registry=x', '-g'])
    assert.equal(decisionCommande(`pnpm add leaflet ${option}`, ctx).decision, 'refuser', option);
  for (const commande of ['pnpm -C /tmp/x add leaflet', 'pnpm --dir=/tmp/x add leaflet', 'npm_config_registry=https://x.example pnpm add leaflet', 'NPM_CONFIG_REGISTRY=x pnpm add leaflet', 'env pnpm add leaflet'])
    assert.equal(decisionCommande(commande, ctx).decision, 'refuser', commande);
  assert.equal(decisionCommande('pnpm add -E --filter=@x/web leaflet', ctx), null);
});

test('ticket introuvable (contexte null ou vide) : refusé ; les refus restent', () => {
  assert.equal(decisionCommande('pnpm add leaflet', prevus(null)).decision, 'refuser');
  assert.equal(decisionCommande('pnpm add leaflet', prevus([])).decision, 'refuser');
  assert.equal(decisionCommande('pnpm add leaflet').decision, 'refuser');
  assert.equal(decisionCommande('npm install leaflet', prevus(['leaflet'])).decision, 'refuser');
  assert.equal(decisionCommande('yarn add leaflet', prevus(['leaflet'])).decision, 'refuser');
  let lu = false;
  decisionCommande('pnpm install --frozen-lockfile', { dependancesPrevues: () => (lu = true) });
  assert.equal(lu, false, 'le ticket ne se lit que si la commande ajoute un paquet');
});

test('tout push forcé est refusé, sur toute branche et sous toute forme ; la consigne de sujet.sh demarrer passe', () => {
  for (const commande of [
    'git push --force origin feat/x',
    'git push -f origin feat/x',
    'git push -uf origin feat/x',
    'git push --force-with-lease',
    'git push --force-with-lease origin feat/x',
    'git push --force-with-lease=feat/x:abc123 origin feat/x',
    'git push --force-w origin feat/x',
    'git push --force-if-includes --force-with-lease origin feat/x',
    'git push origin +HEAD:feat/x',
    'git push origin "+HEAD:feat/x"',
    'git push origin +feat/x',
    'git -C . push --force-with-lease origin feat/x',
    'timeout 5 git push origin +HEAD:feat/x',
    'git rebase --onto origin/sujet/demo origin/develop && git push --force-with-lease',
    'git push \\\n  --force origin feat/x',
    'git push origin feat/x \\\n  -f',
    'F=--force; git push $F origin feat/x',
    "git push $'--force' origin feat/x",
  ]) {
    const d = decisionCommande(commande, { brancheCourante: () => 'feat/spec-all-demo-1-01-travail' });
    assert.equal(d?.decision, 'refuser', commande);
  }
  assert.match(decisionCommande('git push --force-with-lease origin feat/x').raison, /cherry-pick/);
  for (const commande of [
    'git switch --no-track -c feat/spec-all-demo-1-01-travail-sur-sujet origin/sujet/demo',
    'git cherry-pick --no-merges origin/develop..feat/spec-all-demo-1-01-travail',
    'git push -u origin feat/spec-all-demo-1-01-travail-sur-sujet',
    'git push --follow-tags origin feat/x',
    'git push --no-force-with-lease origin feat/x',
    'git commit -m "jamais git push --force"',
  ])
    assert.equal(decisionCommande(commande, { brancheCourante: () => 'feat/spec-all-demo-1-01-travail' }), null, commande);
});

test('un push vers un sujet est refusé, quelle que soit la branche et la forme de la commande', () => {
  const ticket = { brancheCourante: () => 'feat/spec-all-soc-1-04-hook' };
  for (const commande of [
    'git push origin HEAD:sujet/demo',
    'git push origin HEAD:refs/heads/sujet/demo',
    'git push -u origin sujet/demo',
    'git push origin feat/spec-all-soc-1-04-hook HEAD:sujet/demo',
    'git push origin "HEAD:refs/heads/sujet/demo"',
    "git push origin 'sujet/demo'",
    'git -C . push origin HEAD:sujet/demo',
    'git -c push.default=simple push origin HEAD:sujet/demo',
    '/usr/bin/git push origin HEAD:sujet/demo',
    'git push -o ci.skip origin HEAD:sujet/demo',
  ])
    assert.equal(decisionCommande(commande, ticket)?.decision, 'refuser', commande);
  for (const commande of ['git push origin --delete sujet/demo', 'git push origin :sujet/demo', 'git push origin :refs/heads/sujet/demo']) {
    const d = decisionCommande(commande);
    assert.equal(d?.decision, 'refuser', commande);
    assert.match(d.raison, /sujet\.sh clore <nom>/, `${commande} : le refus indique la voie de la suppression`);
  }
  assert.equal(decisionCommande('bash scripts/chaine/sujet.sh clore demo'), null, 'le script, lui, passe : le hook ne lit pas son contenu');
  assert.equal(decisionCommande('git push origin HEAD:sujet/demo')?.decision, 'refuser', 'branche inconnue : refusé aussi');
  assert.equal(decisionCommande('git push origin HEAD:sujet/demo', { brancheCourante: () => 'tmp' })?.decision, 'refuser', 'branche quelconque : refusé aussi');
  assert.equal(decisionCommande('git push origin sujet/demo', { brancheCourante: () => 'sujet/demo' })?.decision, 'refuser', 'même depuis le sujet : seul sujet.sh y écrit');
  assert.equal(decisionCommande('git push', { brancheCourante: () => 'sujet/demo' })?.decision, 'refuser', 'sans refspec depuis un sujet : la branche courante est le sujet');
  assert.equal(decisionCommande('git push -u origin feat/spec-all-soc-1-04-hook', ticket), null);
  assert.equal(decisionCommande('git push', ticket), null, 'sans refspec depuis une branche de ticket');
  assert.equal(decisionCommande('git push origin feat/x', { brancheCourante: () => 'sujet/demo' }), null, 'depuis le sujet, un refspec explicite vers une autre branche passe');
  assert.equal(decisionCommande('b=sujet/demo; git push origin HEAD:$b', ticket)?.decision, 'refuser', 'refspec illisible : on refuse');
  assert.equal(decisionCommande('git push origin HEAD:$(cat cible)', ticket)?.decision, 'refuser');
  assert.equal(pousseSurUnSujet('git commit -m x && git push origin HEAD:sujet/x'), true);
  assert.equal(pousseSurUnSujet('git push origin feat/sujet-x'), false);
  assert.equal(pousseSurUnSujet('git commit -m "voir git push origin HEAD:sujet/x plus tard"'), false, 'un texte cité qui parle d’un push n’est pas un push');
  assert.equal(pousseSurUnSujet("cat <<'EOF' > note.md\ngit push origin HEAD:sujet/x\nEOF"), false, 'un corps de heredoc non plus');
});

test('tout git push vers un sujet est refusé, quelle que soit la branche, et le refus indique sujet.sh carte', () => {
  const formes = [
    'git push origin HEAD:sujet/demo',
    'git push origin HEAD:refs/heads/sujet/demo',
    'git push -u origin sujet/demo',
    'git push origin feat/spec-all-demo-1-04-hook HEAD:sujet/demo',
    'git push origin +HEAD:sujet/demo',
    'git push origin "HEAD:sujet/demo"',
    "git push origin 'HEAD:refs/heads/sujet/demo'",
    'git -C /tmp/depot push origin HEAD:sujet/demo',
    'git -c core.x=1 push origin HEAD:sujet/demo',
    '/usr/bin/git push origin HEAD:sujet/demo',
    'GIT_TRACE=1 git push origin HEAD:sujet/demo',
    'env git push origin HEAD:sujet/demo',
    'bash -c "git push origin HEAD:sujet/demo"',
    'git commit -m x && git push origin HEAD:sujet/x',
    '(git push origin HEAD:sujet/demo)',
    'echo $(git push origin HEAD:sujet/demo)',
    // `git` se lit où qu'il soit dans le segment, pas derrière une liste fermée de préfixes.
    'timeout 5 git push origin HEAD:sujet/demo',
    'nice -n 5 git push origin HEAD:sujet/demo',
    'xargs -r git push origin HEAD:sujet/demo',
    // `--repo` porte le remote : tous les positionnels sont des refspecs.
    'git push --repo origin HEAD:sujet/demo',
    'git push --repo=origin HEAD:sujet/demo',
  ];
  for (const brancheCourante of ['feat/spec-all-demo-1-04-hook', 'docs/demo-carte', 'sujet/demo', 'HEAD', null])
    for (const commande of formes) {
      const d = decisionCommande(commande, { brancheCourante: () => brancheCourante });
      assert.equal(d?.decision, 'refuser', `${brancheCourante} : ${commande}`);
      assert.match(d.raison, /sujet\.sh carte <nom>/);
    }
});

test('un git push nu, ou vers HEAD, depuis une branche sujet/… est refusé', () => {
  const sur = (branche) => ({ brancheCourante: () => branche });
  for (const commande of ['git push', 'git push origin', 'git push -u origin', 'git push origin HEAD', 'git push origin @', 'git push -o ci.skip origin'])
    assert.equal(decisionCommande(commande, sur('sujet/demo'))?.decision, 'refuser', commande);
  for (const commande of ['git push', 'git push origin HEAD', 'git push -u origin feat/x']) assert.equal(decisionCommande(commande, sur('feat/spec-all-demo-1-04-hook')), null, commande);
  assert.equal(decisionCommande('git push', sur(null)), null, 'branche inconnue');
});

test('un refspec illisible (variable, substitution, motif, --all, --mirror) est refusé', () => {
  for (const commande of [
    'git push origin "$REF"',
    'git push origin HEAD:$BRANCHE',
    'git push origin HEAD:$(cat cible)',
    'git push origin HEAD:`cat cible`',
    'git push origin refs/heads/*:refs/heads/*',
    'git push --all',
    'git push --mirror origin',
    'git push origin $SRC:feat/x',
  ])
    assert.equal(decisionCommande(commande)?.decision, 'refuser', commande);
});

test('ce qui n’écrit pas sur un sujet passe, sujet.sh carte compris', () => {
  for (const commande of [
    'git push -u origin feat/spec-all-demo-1-04-hook',
    'git push origin HEAD:refs/heads/feat/sujet-x',
    'git push origin feat/sujet-x',
    "git commit -m 'docs: git push origin HEAD:sujet/x refusé'",
    'git commit -m "git push origin HEAD:sujet/x"',
    'bash scripts/chaine/sujet.sh carte x',
    'bash scripts/chaine/sujet.sh carte demo',
    'git fetch origin sujet/demo',
    'git pull --ff-only origin sujet/demo',
    'git log origin/sujet/demo',
  ])
    assert.equal(decisionCommande(commande, { brancheCourante: () => 'docs/demo-carte' }), null, commande);
});

test('un git push vers develop, main ou la branche par défaut est refusé sous toutes ses graphies ; une source develop ou un nom voisin passent', () => {
  const ctx = (courante = 'feat/spec-all-demo-1-01-x') => ({ brancheCourante: () => courante, brancheParDefaut: () => 'trunk' });
  for (const commande of [
    'git push origin develop',
    'git push origin HEAD:main',
    'git push origin HEAD:refs/heads/develop',
    'git push origin HEAD:refs/heads/main',
    'git push origin origin/main:refs/heads/develop',
    'git push origin +refs/heads/x:refs/heads/main',
    'git push origin HEAD:heads/develop',
    'git push origin HEAD:DEVELOP',
    'git push origin "HEAD:refs/heads//main"',
    'git push origin HEAD:trunk',
    'git push origin :develop',
  ])
    assert.equal(decisionCommande(commande, ctx())?.decision, 'refuser', commande);
  for (const courante of ['develop', 'main', 'trunk'])
    for (const commande of ['git push', 'git push origin', 'git push origin HEAD'])
      assert.equal(decisionCommande(commande, ctx(courante))?.decision, 'refuser', `${courante} : ${commande}`);
  for (const commande of ['git push origin develop:feat/x', 'git push origin feat/develop', 'git push origin feat/main-menu', 'git push -u origin feat/spec-all-demo-1-01-x', 'git push origin HEAD'])
    assert.equal(decisionCommande(commande, ctx()), null, commande);
  assert.equal(decisionCommande('git push', ctx(null)), null, 'branche courante inconnue');
});

test('une barre oblique inverse ne cache ni git ni gh : lignes continuées recollées, \\git lu comme git', () => {
  for (const commande of [
    '\\git push --force origin feat/x',
    'git push origin \\\nHEAD:sujet/x',
    'git push origin \\\nHEAD:refs/heads/develop',
    'gh api -X PUT \\\nrepos/o/r/pulls/3/merge',
    'gh pr \\\nmerge 3',
    '\\gh pr merge 3',
  ])
    assert.equal(decisionCommande(commande, { brancheCourante: () => 'feat/x' })?.decision, 'refuser', commande);
  assert.equal(decisionCommande('git commit -m "a\\\nb"', { brancheCourante: () => 'feat/x' }), null);
});

test('une substitution de commande ne cache ni git ni gh : lue à part, remplacée dans la commande englobante par un mot illisible', () => {
  const ctx = { brancheCourante: () => 'feat/x' };
  for (const commande of [
    'git -C "$(pwd)" push origin HEAD:sujet/x',
    'git -C $(pwd) push --force origin feat/x',
    'git -C `pwd` push origin HEAD:sujet/x',
    'gh -R $(echo o/r) pr merge 3',
    'x=$(gh pr merge 3)',
    'git push origin "$(git branch --show-current)"',
    '$(true)git push --force origin feat/x',
    '`true`git push origin HEAD:sujet/x',
    'echo `echo \\`git push --force origin feat/x\\``',
    '$(true)gh pr merge 3',
  ])
    assert.equal(decisionCommande(commande, ctx)?.decision, 'refuser', commande);
  for (const commande of ['git push -u origin feat/x && echo "$(date)"', 'gh pr view $(cat n.txt)'])
    assert.equal(decisionCommande(commande, ctx), null, commande);
  assert.deepEqual(
    segmentsDeCommande('git -C "$(pwd)" push origin HEAD:x; echo `date`').map(({ segment }) => segment.trim()),
    ['pwd', 'date', 'git -C $SUBSTITUTION push origin HEAD:x', 'echo $SUBSTITUTION'],
  );
});

test('decisionOutilGithub : écrire ou fusionner vers une branche gardée, ou mettre à jour une PR dont la tête est gardée, est refusé, sous toutes ses graphies', () => {
  const ctx = { brancheParDefaut: 'trunk' };
  for (const branch of ['sujet/demo', 'refs/heads/sujet/demo', 'develop', 'main', 'trunk', '', undefined, 5, ['develop'], { a: 1 }, ' sujet/x', 'develop ', 'heads/sujet/x', 'refs/heads//sujet/x', 'Sujet/x', 'origin/develop', 'TRUNK', '/main'])
    for (const outil of ['mcp__github__push_files', 'mcp__github__create_or_update_file', 'mcp__github__delete_file', 'mcp__autre__push_files'])
      assert.equal(decisionOutilGithub(outil, { branch }, ctx)?.decision, 'refuser', `${outil} ${JSON.stringify(branch)}`);
  assert.equal(decisionOutilGithub('mcp__github__create_branch', { branch: 'sujet/neuf' }, ctx)?.decision, 'refuser');
  assert.equal(decisionOutilGithub('mcp__github__push_files', { branch: 'feat/x' }, ctx), null);
  assert.equal(decisionOutilGithub('mcp__github__create_branch', { branch: 'feat/x', from_branch: 'sujet/demo' }, ctx), null);
  assert.equal(decisionOutilGithub('mcp__github__get_file_contents', { ref: 'sujet/demo' }, ctx), null);
  const pr = (tete, base) => ({ ...ctx, refsDeLaPr: () => (tete === null ? null : { tete, base }) });
  for (const b of ['sujet/demo', 'refs/heads/Sujet/demo', 'develop', 'main', 'trunk'])
    for (const outil of ['mcp__github__merge_pull_request', 'mcp__github__enable_pr_auto_merge'])
      assert.equal(decisionOutilGithub(outil, { pullNumber: 1 }, pr('feat/x', b))?.decision, 'refuser', `${outil} ${b}`);
  assert.equal(decisionOutilGithub('mcp__github__merge_pull_request', { pullNumber: 1 }, pr(null))?.decision, 'refuser', 'refs illisibles');
  assert.equal(decisionOutilGithub('mcp__github__merge_pull_request', { pullNumber: 1 }, pr('feat/x', 'feat/y')), null);
  for (const tete of ['sujet/demo', 'develop', 'main', 'trunk', 'Main'])
    assert.equal(decisionOutilGithub('mcp__github__update_pull_request_branch', { pullNumber: 1 }, pr(tete, 'develop'))?.decision, 'refuser', `mise à jour, tête ${tete}`);
  assert.equal(decisionOutilGithub('mcp__github__update_pull_request_branch', { pullNumber: 1 }, pr(null))?.decision, 'refuser', 'tête illisible');
  assert.equal(decisionOutilGithub('mcp__github__update_pull_request_branch', { pullNumber: 1 }, pr('feat/x', 'sujet/demo')), null, 'tête ordinaire, base gardée : la mise à jour écrit sur la tête');
});

test('gh en écriture vers une branche, un fichier ou une règle de branche est refusé ; la lecture, les PR et les labels passent', () => {
  for (const commande of [
    'gh api -X PATCH repos/o/r/git/refs/heads/sujet/x -f sha=abc',
    'gh api repos/o/r/git/refs -f ref=refs/heads/sujet/x -f sha=abc',
    'gh api --method DELETE repos/o/r/git/refs/heads/feat/x',
    'gh api -XPUT repos/o/r/pulls/3/merge',
    'gh api -X PUT "repos/o/r/contents/docs/a.md" -f branch=sujet/x',
    'gh api repos/o/r/merges -f base=sujet/x -f head=feat/y',
    'gh api graphql -f query="mutation { createCommitOnBranch(input: {}) { commit { oid } } }"',
    'gh api graphql -F query=@requete.graphql',
    'gh pr merge 12 --squash',
    'timeout 5 gh pr merge 12',
    '/usr/bin/gh api -X PATCH repos/o/r/git/refs/heads/develop -f sha=abc',
    'gh api -X PATCH "$REF_URL" -f sha=abc',
    'gh api --method=PUT repos/o/r/pulls/$(cat n)/merge',
    'gh -R o/r pr merge 3',
    'gh --repo o/r pr merge 3',
    'gh pr -R o/r merge 3',
    'env GH_X=1 gh pr merge 3',
    'gh api graphql -f query="$Q"',
    'gh api graphql --input q.json',
    'gh api graphql -f query="query A { a(x: 1) } mutation B { b }"',
    'gh api /graphql -f query="mutation { x }"',
    'gh api https://api.github.com/graphql -f query="mutation { x }"',
    'gh api -X PATCH repos/o/r/git//refs/heads/x -f sha=a',
    'gh api -X PATCH repos/o/r/git/./refs/heads/x -f sha=a',
    'gh api -X PATCH repos/o/r/GIT/REFS/heads/x -f sha=a',
    'gh api -X PUT repos/o/r/pulls/3%2Fmerge',
    'gh api -X PUT repos/o/r/pulls/3/ccr/auto_merge',
    'gh api -X PUT repos/o/r/pulls/3/update-branch',
    'gh --hostname github.com pr merge 3',
    'gh api -X PUT repos/o/r/pulls/3/merge/',
    'gh api -X PUT repos/o/r//pulls/3/merge',
    'gh api repos/o/r/merge-upstream -f branch=develop',
    'gh api -X PUT repos/o/r/branches/develop/protection --input p.json',
    'gh api -X DELETE repos/o/r/branches/develop/protection',
    'gh api -X POST repos/o/r/rulesets --input r.json',
    'gh repo sync o/r -b develop --force',
    'gh pr close 3 -d',
    'gh pr close 3 --delete-branch',
    'gh alias set m "pr merge"',
    'gh alias set --shell m "gh pr merge $1"',
    'gh alias import aliases.yml',
    'gh alias import - < aliases.yml',
  ])
    assert.equal(decisionCommande(commande)?.decision, 'refuser', commande);
  for (const commande of [
    'gh api repos/o/r/git/refs/heads/sujet/x',
    'gh api repos/o/r/pulls/3',
    'gh api -X POST repos/o/r/pulls -f title=x -f head=feat/x -f base=sujet/x',
    'gh api -X PATCH repos/o/r/pulls/3 -f base=sujet/x',
    'gh api -X POST repos/o/r/issues/3/labels -f "labels[]=à-fusionner"',
    'gh api graphql -f query="{ viewer { login } }"',
    "gh api graphql -f query='query { repository(owner:\"o\", name:\"r\") { pullRequest(number: 1) { mergeable } } }'",
    'git commit -m "fix: mutation testing" && gh api graphql -f query="{ viewer { login } }"',
    'gh api repos/o/r/rules/branches/develop',
    'gh api repos/o/r/branches/develop/protection',
    'gh api -X GET repos/o/r/contents/docs/a.md -f ref=sujet/x',
    'gh pr create --base sujet/x --title t --body b',
    'gh pr edit 3 --add-label à-fusionner',
    'gh pr close 3',
    'gh alias list',
    'gh alias delete m',
    'gh pr view 3',
    'git commit -m "gh pr merge 3"',
    'bash scripts/chaine/passer.sh 12',
  ])
    assert.equal(decisionCommande(commande), null, commande);
});

test('contournements relevés pendant le ticket 27 : champ gh collé ou route après un champ à blancs, $\'git\', casse, programme caché derrière un mot en /git, séparateur cité, option en /git après le programme, fragment ou option groupée de gh, git après une substitution, branche en ./ ou à barre finale, substitution parenthésée, -n et --no-veri… de git commit, mot cité seul', () => {
  const ctx = { brancheCourante: () => 'feat/x' };
  const sujet = 'sujet/x';
  const nv = '--no-verify';
  for (const commande of [
    `gh api repos/o/r/git/refs -fref=refs/heads/${sujet} -fsha=abc`,
    `gh api repos/o/r/git/refs -Fref=refs/heads/${sujet} -Fsha=abc`,
    `gh api -X PUT -f message="add file" -f branch=${sujet} repos/o/r/contents/a.md`,
    'gh api -f query="mutation { x }" graphql',
    `$'git' push origin HEAD:${sujet}`,
    '$"gh" pr merge 3',
    'GIT push --force origin feat/x',
    'Gh pr merge 3',
    `git -c a.b=$((1)) push origin HEAD:${sujet}`,
    'git -C "$( (pwd) )" push --force origin feat/x',
    'gh -R $( (echo o/r) ) pr merge 3',
    'git commit -n -m x',
    'git commit -anm x',
    'git commit -m x --no-veri',
    `git merge ${nv} feat/y`,
    `"git" commit ${nv} -m x`,
    `g''it commit ${nv} -m x`,
    `git commit "${nv}" -m x`,
    `GIT commit ${nv} -m x`,
    "'npm' install leaflet",
    'X=/a/git git push --force origin feat/x',
    `env -C /w/git git push origin HEAD:${sujet}`,
    `sudo -u git git push origin HEAD:${sujet}`,
    'X=/a/git gh pr merge 5',
    'sudo -u git gh api -X PUT repos/o/r/pulls/5/merge',
    `./a=b/git push origin HEAD:${sujet}`,
    '/tmp/a=b/git push --force origin feat/x',
    'env --chdir=/w/git git push --force origin feat/x',
    'gh api -f message="fix(api): x" -X PUT repos/o/r/contents/a.md',
    'gh api -f commit_title="a; b" -X PUT repos/o/r/pulls/3/merge',
    'gh api --jq ".a | .b" -X PUT repos/o/r/pulls/3/merge',
    'gh -R "o/r;x" pr merge 3',
    'git -c user.name="a;b" push --force origin feat/x',
    `git -c user.name="A (B)" push origin HEAD:${sujet}`,
    'git commit -m x --no-verif',
    'git --work-tree=/usr/share/doc/git push -f origin HEAD:feat/x',
    `git --work-tree=/home/u/git push origin HEAD:${sujet}`,
    'git --work-tree=/home/u/git push origin HEAD:refs/heads/develop',
    'gh --subject=a/gh pr merge 3 --squash',
    'gh --jq=.a/gh api -X PUT repos/o/r/pulls/3/merge',
    'sudo -u GIT -H git push --force origin feat/x',
    `sudo -u GIT -H git push origin HEAD:${sujet}`,
    'gh api -X PUT repos/o/r/pulls/3/merge#x',
    'gh api repos/o/r/merges#x -f base=develop -f head=feat/x',
    'gh api -X DELETE repos/o/r/branches/develop/protection#',
    'gh api graphql#x -f query="mutation { a }"',
    'gh api -iX PUT repos/o/r/pulls/3/merge',
    'gh api -iXPUT repos/o/r/pulls/3/merge',
    'gh api repos/o/r/merges -ifbase=develop -ifhead=feat/x',
    'gh api repos/o/r/merges -if base=develop -if head=feat/x',
    'gh pr close 3 -dc done',
    'gh pr close 3 --delete-branch=true',
    'sudo -u git $(true) git push --force origin feat/x',
    `env -C /tmp/git $(true) git push origin HEAD:${sujet}`,
    `sudo -u git \`true\` git push origin HEAD:${sujet}`,
    'gh api -X PUT repos/o/r/pulls/3/merge/#x',
    'gh api -X POST repos/o/r/merges/#x',
    'gh api -X PUT repos/o/r/pulls/3/merge/?a=1',
    'gh pr update-branch 12',
    'gh -R o/r pr update-branch 12 --rebase',
    `gh api -X POST repos/o/r/branches/feat-x/rename -f new_name=${sujet}`,
    'gh api -X PUT repos/o/r/pulls/3/merge/x/..',
    'git --attr-source HEAD push --force origin feat/x',
  ])
    assert.equal(decisionCommande(commande, ctx)?.decision, 'refuser', commande);
  for (const branch of ['./develop', './main', `./${sujet}`, 'feat/../develop', 'feat/%2e%2e/main', 'feat/x\u0000', 'develop/', 'main/', 'develop//', './feat/x', 'feat/./x'])
    assert.equal(decisionOutilGithub('mcp__github__push_files', { branch }, {})?.decision, 'refuser', JSON.stringify(branch));
  for (const branch of ['develop/', './feat/x', 'feat/./x'])
    assert.match(decisionOutilGithub('mcp__github__push_files', { branch }, {})?.raison ?? '', /nom de branche illisible/, branch);
  for (const commande of ['git push origin HEAD:./feat/x', 'git push origin HEAD:feat/./x'])
    assert.match(decisionCommande(commande, ctx)?.raison ?? '', /nom de branche illisible/, commande);
  assert.equal(decisionOutilGithub('mcp__github__push_files', { branch: 'feat/x.y' }, {}), null);
  for (const commande of [
    `git commit -m "jamais ${nv}"`,
    'git commit --no-edit',
    'git commit -m x -- docs/a.md',
    'gh api -X POST repos/o/r/issues/3/comments -f body="voir graphql et contents"',
    'echo $((1+2)) && git push -u origin feat/x',
    'git merge --no-verify-signatures origin/develop',
    'git pull --no-verify-signatures',
    'gh api -i repos/o/r/pulls/3',
    'gh pr close 3 -c fini',
  ])
    assert.equal(decisionCommande(commande, ctx), null, commande);
  for (const commande of ['git --work-tree=/tmp/git push'])
    assert.equal(decisionCommande(commande, { brancheCourante: () => 'sujet/y' })?.decision, 'refuser', commande);
});

const CTX_33 = { brancheCourante: () => 'feat/x', brancheParDefaut: () => 'develop' };
const F_33 = 'git push --force origin feat/x';
const ecarts = (commandes, attendu) => commandes.filter((c) => (decisionCommande(c, CTX_33)?.decision ?? 'passe') !== attendu);

// A-51 ter : la lecture de 7.9.x se joue sur la commande d'origine. Ces here-docs à apostrophe, que le lecteur par jetons
// laisse passer, sont refusés comme sur main (contournement : `git commit -F <fichier>`, `--body-file`) ; leur levée est
// le ticket 35.
test('A-51 ter : un here-doc quoté lu par un consommateur inerte, avec une apostrophe, est refusé comme sur main (refus à tort de 7.9.x)', () => {
  const F = F_33;
  const commandes = [
    "git commit -m \"$(cat <<'EOF'\nfix(chaine): le capitaine seul lance gh pr merge\n\nl'agent ne le lance pas\nEOF\n)\" && git log --format='%s' -1", // P1
    `git commit -m "$(cat <<'EOF'\nfix: plus de ${F}\nl'agent\nEOF\n)"\necho 'ok'`, // P2
    "git commit -m \"$(cat <<'EOF'\nfix: refuser git push origin main\n\nl'agent\nEOF\n)\" && git log --format='%h %s' -1", // P3
    "git commit -F - <<'EOF'\nfix(chaine): le capitaine seul lance gh pr merge\nl'architecte ne le lance pas\nEOF\ngit log --format='%s' -1", // P4
    `git commit -F - <<'EOF'\nfix: plus de ${F}\nl'architecte\nEOF\ngit log --format='%s' -1`, // P5
    "git commit -F - <<-'EOF'\n\tfix: gh pr merge\n\tl'architecte\n\tEOF\necho 'fait'", // P6
    "cat <<\"FIN\"\ngh pr merge 12\nl'architecte\nFIN\necho 'fait'", // P7
    "cat <<'A' > a\ngh pr merge 1 ; l'un\nA\ncat <<'B' > b\nd'autre\nB\n", // P8
    "cat > m <<'EOF'\nfix: gh pr merge\nl'agent\nEOF\ngit commit -F m && git log --format='%s' -1", // P9
    `gh pr create --title "fix: l'agent" --body "$(cat <<'EOF'\n${F}\nl'architecte\nEOF\n)" && echo 'ok'`, // P10
    `git commit -F - <<EOF\nfix: plus de ${F}\nl'agent\nEOF\necho 'ok'`, // P11
    "git commit -F - <<\\EOF\nfix: gh pr merge\nl'agent\nEOF\necho 'ok'", // P12
  ];
  assert.deepEqual(ecarts(commandes, 'refuser'), []);
  for (const c of commandes) assert.equal(LECTURE_7_9.decisionCommande(c, CTX_33)?.decision, 'refuser', c);
});

test('ticket 33 : ce qui passait passe encore (corps de PR, apostrophes, $\'…\', boucle, deux here-docs sur une ligne)', () => {
  const commandes = [
    "gh pr create --title \"x\" --body \"$(cat <<'EOF'\ngh pr merge\nl'architecte\nEOF\n)\"", // G1
    "git commit -m \"fix: l'agent ne pousse pas\"", // G2
    "git commit -m $'fix: l\\'agent\\n\\ncorps'", // G3
    "python3 - <<'EOF'\nprint(\"l'architecte : gh pr merge, gh repo sync\")\nEOF\n", // G4
    "git commit -m \"$(cat <<'EOF'\nfeat(x): le garde\n\nCorps : l'agent ne pousse pas.\nEOF\n)\"", // G5
    "git commit -m \"$(cat <<'EOF'\nfix: l'agent\nEOF\n)\" && git push origin HEAD:feat/x", // G6
    "cat > m <<'EOF'\nl'agent\nEOF", // G7
    "git commit -m \"$(cat <<'EOF'\nfix: x\n\nCo-Authored-By: Claude <noreply@anthropic.com>\nEOF\n)\"", // G8
    "git commit -m \"chore: npm install x refusé\"", // G9
    "for f in a b; do echo \"$f\"; done && git log --format='%s' -1", // G10
    "cat <<'A' <<'B'\nl'un : gh pr merge 1\nA\nd'autre\nB\necho 'ok'", // G11
  ];
  assert.deepEqual(ecarts(commandes, 'passe'), []);
});

test('ticket 33 : ce que bash exécute se lit — ligne d’ouverture, après le terminateur, corps donné à un shell, substitutions d’un corps non quoté ; l’illisible est refusé', () => {
  const F = F_33;
  const commandes = [
    "git commit -m \"$(cat <<'EOF'\nl'agent\nEOF\n)\" --no-verify", // R1
    "git commit -m \"$(cat <<'EOF'\nl'agent\nEOF\n)\" -n", // R2
    `cat <<'EOF'\nl'agent\nEOF\n${F}`, // R3
    `cat <<'EOF'\nl'x\nEOF\n; ${F}`, // R4
    "git commit -m \"$(cat <<'EOF'\nl'agent\nEOF\n)\" && git push origin main", // R5
    "git commit -m \"$(cat <<'EOF'\nl'agent\nEOF\n)\" || git push origin develop", // R6
    "cat <<'EOF' > m\nl'agent\nEOF\ngit commit --no-verify -F m", // R7
    "python3 - <<'EOF'\nprint(\"l'architecte : gh pr merge\")\nEOF\ngh pr merge 12", // R8
    `cat <<EOF | ${F}\nl'architecte\nEOF\n`, // R9
    "cat <<'EOF' ; gh pr merge 12\nx\nEOF\n", // R10
    "cat <<'EOF' > m && git commit --no-verify -F m\nx\nEOF\n", // R11
    "cat <<'EOF' ; npm install leftpad\nx\nEOF\n", // R12
    "cat <<EOF ; git push -f origin feat/x\nx\nEOF\n", // R13
    `echo "<<EOF" ; ${F}\ncat <<'EOF'\nx\nEOF\n`, // R14
    "echo $'<<EOF'\ngit push -f\nl'x\nEOF\necho 'y'", // R15
    "x=\"<<EOF\" | echo $(cat <<'EOF'\nz\nEOF\n)\ngh api -f message=\"fix(api): x\" -X PUT repos/o/r/contents/a.md", // R16
    `# <<EOF\n${F}\nEOF`, // R17
    `cat <<<EOF\n${F}\nEOF`, // R18
    `echo $((1<<X))\n${F}\nX`, // R19
    "cat <<EOF ; git push -f\n'\nEOF\necho 'fin'", // R20
    `bash <<'EOF'\n${F}\nEOF`, // R21
    "bash -s <<'EOF'\n# l'agent\ngit commit --no-verify -m x\nEOF", // R22
    "cat <<'EOF' | sh\ngit push origin main\nEOF", // R23
    `source /dev/stdin <<'EOF'\n${F}\nEOF`, // R24
    `python3 - <<'EOF'\nimport os; os.system("${F}")\nEOF`, // R25
    `eval "$(cat <<'EOF'\n${F}\nEOF\n)"`, // R26
    `sh -c "$(cat <<'EOF'\n${F}\nEOF\n)"`, // R27
    `python3 -c "$(cat <<'EOF'\nimport os; os.system('${F}')\nEOF\n)"`, // R28
    "cat <<EOF\nl'agent $(git push -f origin feat/x)\nEOF", // R29
    "cat <<EOF\nl'agent `git push -f origin feat/x`\nEOF", // R30
    "cat <<'EOF'\nl'architecte\nEOF\ngit -c user.name=\"a;b\" push --force origin feat/x\ncat <<'EOF'\nl'architecte\nEOF\n", // R31
    `cat <<'EOF'\nl'architecte\n${F}`, // R32
    `cat <<'EOF'\nl'architecte\nEOFX\n${F}`, // R33
    `cat <<'EOF' > s.sh\n# l'agent\n${F}\nEOF\nbash s.sh && echo 'ok'`, // R34
    "git commit -m \"l'agent\" --no-verify", // R35
    "git commit -m $'l\\'agent' --no-verify", // R36
    "echo l\\'x; git push origin main", // R37
    `echo "${F}"`, // R38
    "echo \"gh pr merge 12\"", // R39
    "eval \"git push -f origin feat/x\"", // R40
    "git commit -m \"--no-verify\"", // R41
    `echo "$x <<EOF" ; ${F}\ncat <<'EOF'\nx\nEOF\n`, // R42
    `cat <<A <<B ; ${F}\nx\nA\ny\nB\n`, // R43
    `echo \\<<EOF ; ${F}\ncat <<'EOF'\nx\nEOF\n`, // R44
    "git commit -m \"fix: l'architecte ; gh pr merge\"", // R45
    `cat <<'EOF'\nfix: gh pr merge\nl'architecte\nEOF\n${F}`, // R46
    "cat <<'EOF'\nl'architecte\nEOF\ngit -c user.name=\"a;b\" push --force origin feat/x", // R47
    "cat <<'EOF'\nl'architecte\nEOF\ngh api -f message=\"fix(api): x\" -X PUT repos/o/r/contents/a.md", // R48
    `echo "<<EOF" ; ${F}`, // R49
    `echo '<<EOF' && ${F}`, // R50
    "echo \"<<X\" ; gh api -X PUT repos/o/r/pulls/1/merge", // R51
    "echo '<<EOF' | echo $(cat <<'EOF'\nz\nEOF\n) | git -c user.name=\"a;b\" push --force origin feat/x", // R52
    "<<'EOF' echo $(cat <<'EOF'\nz\nEOF\n) ; gh api -f message=\"fix(api): x\" -X PUT repos/o/r/contents/a.md\n\tEOF", // R53
  ];
  assert.deepEqual(ecarts(commandes, 'refuser'), []);
});

test('ticket 33 : lireCommande rend les affectations, les mots, les here-strings et les here-docs de chaque commande simple, dans l’ordre du source', () => {
  const lu = lireCommande('HUSKY=0 git -c core.hooksPath=x commit -m "a b" <<<"c"');
  assert.equal(lu.illisible, null);
  assert.equal(lu.commandes.length, 1);
  const [cmd] = lu.commandes;
  assert.deepEqual(
    cmd.affectations.map(({ nom, mot }) => [nom, mot.brut]),
    [['HUSKY', 'HUSKY=0']],
  );
  assert.deepEqual(
    cmd.mots.map(({ valeur, cite, expansion }) => [valeur, cite, expansion]),
    [
      ['git', false, false],
      ['-c', false, false],
      ['core.hooksPath=x', false, false],
      ['commit', false, false],
      ['-m', false, false],
      ['a b', true, false],
    ],
  );
  assert.deepEqual(
    cmd.heredocs.map(({ operateur, corps }) => [operateur, corps]),
    [['<<<', 'c']],
  );
  assert.equal(cmd.origine, 'tete');
  const deux = lireCommande("cat <<'EOF' ; npm install x\nl'a\nEOF\ngit log");
  assert.equal(deux.illisible, null);
  assert.deepEqual(
    deux.commandes.map(({ origine, mots }) => [origine, mots.map((m) => m.valeur).join(' ')]),
    [
      ['tete', 'cat'],
      ['tete', 'npm install x'],
      ['tete', 'git log'],
    ],
  );
  assert.deepEqual(
    deux.commandes[0].heredocs.map(({ operateur, delimiteur, quote, corps, lecture }) => ({ operateur, delimiteur, quote, corps, lecture })),
    [{ operateur: '<<', delimiteur: 'EOF', quote: true, corps: "l'a\n", lecture: 'retire' }],
  );
  assert.match(decisionCommande("cat <<'EOF' ; npm install x\nl'a\nEOF\ngit log").raison, /^npm/);
  // L'origine : substitution, sous-shell, chaîne -c, eval.
  assert.deepEqual(
    lireCommande('echo "$(pwd)"; (git status); bash -c "git log"; eval "git diff"').commandes.map(({ origine, mots }) => [origine, mots[0].valeur]),
    [
      ['tete', 'echo'],
      ['substitution', 'pwd'],
      ['sous-shell', 'git'],
      ['tete', 'bash'],
      ['-c', 'git'],
      ['tete', 'eval'],
      ['eval', 'git'],
    ],
  );
});

test('ticket 33 : ce que le lecteur ne sait pas lire est refusé avec RAISON_ILLISIBLE, avant tout autre refus', () => {
  const F = 'git push --force origin feat/x';
  const illisibles = [
    "cat <<'EOF'\nx", // here-doc qui ne se ferme pas
    "git commit -m \"$(cat <<'EOF'\nx\nEOF)\"", // fermé seulement en fin de substitution
    "cat <<'EOF'\nx\nEOF;\n", // terminateur suivi d'un autre caractère
    "cat <<'EOF'\nx\n  EOF\n", // terminateur précédé d'espaces
    'echo "a', // guillemet double non fermé
    "echo 'a", // apostrophe non fermée
    "echo $'a", // citation ANSI-C non fermée
    'echo $(a', // substitution non fermée
    'echo `a', // accents graves non fermés
    'echo ${a', // expansion non fermée
    '{ a; ', // groupe non fermé
    '(a', // sous-shell non fermé
    'if a; then b', // commande composée non fermée
    "cat <<'EOF'\nx\nEOF\n; git log", // opérateur là où bash veut une commande (R4)
    'a &&', // && sans commande
    'echo a)', // syntaxe inconnue : parenthèse fermante sans ouvrante
    'a (b)', // syntaxe inconnue : parenthèse dans une commande
    'echo ' + '$(echo '.repeat(40) + 'x' + ')'.repeat(40), // imbrication au-delà de la borne
  ];
  for (const c of illisibles) {
    assert.notEqual(lireCommande(c).illisible, null, c);
    assert.equal(decisionCommande(c)?.raison, RAISON_ILLISIBLE, c);
    // Avant tout autre refus : un push forcé lisible dans la même commande ne change pas la raison.
    assert.equal(decisionCommande(`${F}\n${c}`, CTX_33)?.raison, RAISON_ILLISIBLE, `${F} puis ${c}`);
  }
  assert.equal(lireCommande(F).illisible, null);
  // Une substitution de processus est un mot, lu, pas une syntaxe inconnue.
  for (const c of ['diff <(ls a) <(ls b)', 'tee >(wc -l) < f']) assert.equal(lireCommande(c).illisible, null, c);
  assert.deepEqual(
    lireCommande('cat <(git push --force origin feat/x)').commandes.map((k) => k.origine),
    ['tete', 'substitution'],
  );
  assert.equal(decisionCommande('cat <(git push --force origin feat/x)', CTX_33)?.raison.startsWith('push forcé'), true);
});

test('ticket 33 : les trois lectures d’un corps de here-doc — retiré, lu comme des commandes, relu par prudence', () => {
  const F = F_33;
  const corps = (c) => lireCommande(c).heredocs.map((h) => h.lecture);
  // Retiré : consommateur inerte, aucun exécuteur ; le corps n'est pas lu, même s'il cite un push forcé.
  const retire = `git commit -F - <<'EOF'\nfix: plus de ${F}\nl'agent\nEOF`;
  assert.deepEqual(corps(retire), ['retire']);
  assert.deepEqual(
    lireCommande(retire).commandes.map((k) => k.origine),
    ['tete'],
  );
  assert.equal(decisionCommande(retire, CTX_33), null);
  // Retiré, non quoté : ses substitutions restent lues comme des commandes.
  const substitution = "cat <<EOF\nl'agent $(git push -f origin feat/x)\nEOF";
  assert.deepEqual(corps(substitution), ['retire']);
  assert.deepEqual(
    lireCommande(substitution).commandes.map((k) => [k.origine, k.mots.map((m) => m.valeur).join(' ')]),
    [
      ['tete', 'cat'],
      ['substitution', 'git push -f origin feat/x'],
    ],
  );
  assert.equal(decisionCommande(substitution, CTX_33)?.decision, 'refuser');
  // Lu comme des commandes : le corps va à un shell.
  for (const c of [`bash <<'EOF'\n${F}\nEOF`, `cat <<'EOF' | sh\n${F}\nEOF`, `eval "$(cat <<'EOF'\n${F}\nEOF\n)"`, `sh -c "$(cat <<'EOF'\n${F}\nEOF\n)"`, `{ bash; } <<'EOF'\n${F}\nEOF`]) {
    assert.ok(corps(c).includes('commandes'), c);
    assert.ok(
      lireCommande(c).commandes.some((k) => k.origine === 'corps' && k.mots.map((m) => m.valeur).join(' ') === F),
      c,
    );
    assert.equal(decisionCommande(c, CTX_33)?.decision, 'refuser', c);
  }
  assert.equal(decisionCommande("bash -s <<'EOF'\ngit commit --no-verify -m x\nEOF")?.decision, 'refuser', 'le corps lu passe aussi par COMMANDES_INTERDITES');
  // Relu par prudence : consommateur qui n'est ni inerte ni un shell, préfixe inconnu, fonction, alias, exécuteur présent.
  for (const c of [
    `python3 - <<'EOF'\nimport os; os.system("${F}")\nEOF`,
    `exec cat <<'EOF'\n${F}\nEOF`,
    `stdbuf -o0 cat <<'EOF'\n${F}\nEOF`,
    `f(){ cat; }; f <<'EOF'\n${F}\nEOF`,
    `alias c=bash; c <<'EOF'\n${F}\nEOF`,
    `cat <<'EOF' > s.sh\n# l'agent\n${F}\nEOF\nbash s.sh`,
  ]) {
    assert.ok(corps(c).includes('prudence'), c);
    assert.ok(
      lireCommande(c).prudences.some(({ segments }) => segments.some(({ mots }) => mots.join(' ') === F)),
      c,
    );
    assert.equal(decisionCommande(c, CTX_33)?.decision, 'refuser', c);
  }
  // La prudence lit le texte du corps comme 7.9.0 lisait un texte cité : un appel coupé par une virgule passe.
  assert.deepEqual(corps("python3 - <<'EOF'\nprint(\"l'architecte : gh pr merge, gh repo sync\")\nEOF\n"), ['prudence']);
  assert.equal(decisionCommande("python3 - <<'EOF'\nprint(\"l'architecte : gh pr merge, gh repo sync\")\nEOF\n", CTX_33), null);
});

test('ticket 33 : chaque mot réservé est retiré avant les décideurs — npm install x derrière lui est refusé', () => {
  for (const c of [
    '! npm install x',
    'time npm install x',
    'time -p npm install x',
    '{ npm install x; }',
    '(npm install x)',
    'if npm install x; then :; fi',
    'if :; then npm install x; fi',
    'if :; then :; elif npm install x; then :; fi',
    'if :; then :; else npm install x; fi',
    'for a in b; do npm install x; done',
    'while npm install x; do :; done',
    'until npm install x; do :; done',
    'case a in a) npm install x;; esac',
    'case a in (a) npm install x;; esac',
  ])
    assert.match(decisionCommande(c)?.raison ?? '', /^npm/, c);
});

test('ticket 33 : le lecteur est linéaire — 30 000 lignes « cat <<EOF » non fermées sont refusées en moins de 5 s', () => {
  const c = 'cat <<EOF\n'.repeat(30000) + 'git push --force origin feat/x';
  const debut = process.hrtime.bigint();
  assert.equal(decisionCommande(c, CTX_33)?.decision, 'refuser');
  assert.ok(Number(process.hrtime.bigint() - debut) / 1e9 < 5);
});

test('ticket 33 : formes trouvées par la session, que bash exécute — expansion vide ou affectée, substitution de processus, here-string, ligne continuée, préfixe inconnu devant un shell', () => {
  const F = F_33;
  for (const c of [
    'GH=gh; $GH pr merge 3',
    'GIT=git; $GIT commit --no-verify -m x',
    'X=--no-verify; git commit $X -m x',
    'git $SUB push -f origin feat/x',
    'export B=main; git push origin "$B"',
    `source <(cat <<'EOF'\n${F}\nEOF\n)`,
    "bash <<< 'git commit --no-verify -m x'",
    `eval $'echo a\\n${F}'`,
    "$'\\x67it' push --force origin feat/x",
    `g\\\nit push --force origin feat/x`,
    "cat <<'EOF' && git push \\\n  --force origin feat/x\nl'x\nEOF",
    "{ bash; } <<'EOF'\ngit commit --no-verify -m x\nEOF",
    "exec bash <<'EOF'\ngit commit --no-verify -m x\nEOF",
    `stdbuf -o0 bash <<'EOF'\n${F}\nEOF`,
    `cat <<EOF\n\${x:-$(${F})}\nEOF`,
    `source /dev/stdin <<< "$(cat <<'EOF'\n${F}\nEOF\n)"`,
  ])
    assert.equal(decisionCommande(c, CTX_33)?.decision, 'refuser', c);
});

test('ticket 33, contre-relecture B1 : dans un texte cité, "git, \'git, `gh et \\git se lisent sans leurs guillemets, barres obliques inverses ni accents graves (lecture L2, comme 7.9.x)', () => {
  const F = F_33;
  for (const c of [
    "ruby -e '`gh pr merge 12`'",
    "trap '\\git push -f' EXIT",
    "echo '\\git push -f' | sh",
    `perl -e 'system "git push -f"'`,
    `env -S '"git" push -f'`,
    `python3 -c 'import os; os.system("${F}")'`,
    `python3 -c "import os; os.system('${F}')"`,
    `python3 -c 'import os; os.system("gh pr merge 12")'`,
    `trap 'eval "git push origin +feat/x"' EXIT`,
    `node -e 'require("child_process").execSync("git push -f")'`,
    "bash <(echo '\\git push -f')",
    "source <(echo '\\git push -f')",
    "set -- '\\git push -f'; eval \"$1\"",
    "script -qc '\\git push -f' /dev/null",
    `ssh h "'git' push --force origin feat/x"`,
    `ssh h "\\git push -f"`,
    `su -c "'git' push -f" u`,
    `su -c '"gh" pr merge 12' u`,
    "php -r 'system(\"git push -f\");'",
    "awk 'BEGIN{system(\"\\git push -f\")}'",
  ])
    assert.equal(decisionCommande(c, CTX_33)?.decision, 'refuser', c);
});

test('ticket 33, contre-relecture B2 : les valeurs affectées à un tableau se relisent — a=(git push -f); "${a[@]}" est refusé', () => {
  for (const c of [
    'a=(git push -f); "${a[@]}"',
    'a=(git push -f); ${a[*]}',
    'a+=(git push origin develop); "${a[@]}"',
    'a=(gh pr merge 12); "${a[@]}"',
    'a=(git commit --no-verify -m x); "${a[@]}"',
    'a=(npm install leftpad); "${a[@]}"',
    "a=('git' push -f); \"${a[@]}\"",
  ])
    assert.equal(decisionCommande(c, CTX_33)?.decision, 'refuser', c);
  assert.equal(decisionCommande('a=(x y "z t"); echo "${a[@]}"', CTX_33), null);
});

test('ticket 33, contre-relecture B3 : un corps relu par prudence passe par tous les décideurs — push, gh, COMMANDES_INTERDITES, dépendances', () => {
  for (const c of [
    "bash -c 'cat > s.sh <<'\\''EOF'\\''\n# l'\\''x\ngit push --no-verify origin feat/x\nEOF\nbash s.sh'",
    "eval \"python3 - <<'EOF'\nimport os; os.system(\\\"git commit --no-verify -m x\\\")\nEOF\"",
    "python3 - <<'EOF'\nimport os; os.system(\"git commit --no-verify -m x\")\nEOF",
    "python3 - <<'EOF'\nimport os; os.system('git commit -n -m x')\nEOF",
    "node - <<'EOF'\nrequire('child_process').execSync('npm install leftpad')\nEOF",
    "python3 - <<'EOF'\nimport os; os.system('pnpm add leftpad')\nEOF",
    "python3 - <<'EOF'\nimport os; os.system('git rebase origin/develop')\nEOF",
    "python3 - <<'EOF'\nimport os; os.system('gh pr merge 12')\nEOF",
    "node - <<'EOF'\nrequire('child_process').execSync('gh api -X PUT repos/o/r/pulls/1/merge')\nEOF",
  ])
    assert.equal(decisionCommande(c, CTX_33)?.decision, 'refuser', c);
  // G4 passe toujours : rien de gardé dans le corps.
  assert.equal(decisionCommande("python3 - <<'EOF'\nprint(\"l'architecte : gh pr merge, gh repo sync\")\nEOF\n", CTX_33), null);
});

test('ticket 33, banc de monotonie : un texte cité lu en L2 qui commence une commande passe aussi par COMMANDES_INTERDITES et les dépendances', () => {
  const NV = 'git commit --no-' + 'verify -m x';
  for (const c of [
    `bash -c 'python3 -c "import os; os.system('\\''${NV}'\\'')"'`,
    `eval 'python3 -c "import os; os.system('\\''${NV}'\\'')"'`,
    `trap 'python3 -c "import os; os.system('\\''${NV}'\\'')"' EXIT`,
    `python3 -c 'import os; os.system("python3 -c '\\''import os; os.system(\\"${NV}\\")'\\''")'`,
    `bash <(echo 'python3 -c "import os; os.system('\\''${NV}'\\'')"')`,
    `set -- 'python3 -c "import os; os.system('\\''${NV}'\\'')"'; eval "$1"`,
    `eval 'perl -e '\\''\`${NV}\`'\\'''`,
    `python3 -c 'import os; os.system("${NV}")'`,
    `perl -e 'system("npm install leftpad")'`,
    `node -e 'require("child_process").execSync("pnpm add leftpad")'`,
    `ruby -e '\`git rebase origin/develop\`'`,
  ])
    assert.equal(decisionCommande(c, CTX_33)?.decision, 'refuser', c);
  // Le premier segment est la commande elle-même, lue en L3 : un message qui cite --no-verify ou npm install passe.
  for (const c of ['git commit -m "fix: plus de --no-' + 'verify, jamais"', 'git commit -m "chore: npm install x refusé"', 'gh pr create --title "x" --body "pnpm add zod est refusé"'])
    assert.equal(decisionCommande(c, CTX_33), null, c);
});

test('ticket 33, /security-review : un here-doc non quoté se ferme sur sa ligne logique, lignes continuées par \\ recollées, comme bash', () => {
  const P = 'git push -' + 'f origin feat/x';
  for (const c of [
    `cat <<EOF\nx\n\\\nEOF\n${P}\nEOF`,
    `cat <<EOF\nx\nEOF\\\n\n${P}\nEOF`,
    `cat <<EOF\nx\nE\\\nOF\n${P}\nEOF`,
    `cat <<EOF\nx\n\\\n\\\nEOF\n${P}\nEOF`,
    `git commit -F - <<EOF\nmsg\nEOF\\\n\ngit push origin main\nEOF`,
    `cat <<EOF\nx\nE\\\nOF\ngh pr merge 1\nEOF`,
    `cat <<EOF\nx\nE\\\nOF\nnpm i x\nEOF`,
    `cat <<-EOF\nx\n\t\\\n\tEOF\n${P}\nEOF`,
    `cat <<-EOF\nx\n\tE\\\nOF\n${P}\nEOF`,
  ])
    assert.equal(decisionCommande(c, CTX_33)?.decision, 'refuser', c);
  // Ce que bash ne ferme pas reste un corps : `x\` + `EOF` se lit `xEOF`, `E\` + tabulation + `OF` se lit `E⇥OF`.
  for (const c of [`cat <<EOF\nx\\\nEOF\n${P}\nEOF`, `cat <<-EOF\nx\nE\\\n\tOF\n${P}\nEOF`, `cat <<'EOF'\nx\\\n${P}\nEOF`]) {
    const [h] = lireCommande(c).heredocs;
    assert.ok(h.corps.includes(P), c);
  }
  // A-51 ter : la lecture de 7.9.x, jouée sur la commande d'origine, ferme le premier au `EOF` qui suit `x\` et
  // refuse ce qu'elle croit voir après, comme sur main ; les deux autres passent.
  assert.equal(decisionCommande(`cat <<EOF\nx\\\nEOF\n${P}\nEOF`, CTX_33)?.decision, 'refuser');
  for (const c of [`cat <<-EOF\nx\nE\\\n\tOF\n${P}\nEOF`, `cat <<'EOF'\nx\\\n${P}\nEOF`]) assert.equal(decisionCommande(c, CTX_33), null, c);
});

test('ticket 33, contre-relecture C1 : ce qui suit un mot à expansion se relit en temps et mémoire linéaires', () => {
  const F = F_33;
  const mesure = (c) => {
    const tas = process.memoryUsage().heapUsed;
    const debut = process.hrtime.bigint();
    const d = decisionCommande(c, CTX_33)?.decision;
    return { d, s: Number(process.hrtime.bigint() - debut) / 1e9, mo: (process.memoryUsage().heapUsed - tas) / 2 ** 20 };
  };
  const continuees = (n) => 'echo ' + '"$a" \\\n'.repeat(n) + `; ${F}`;
  const nus = (n) => 'echo ' + '$a '.repeat(n);
  // Les tailles restent sous le plafond de 20 000 caractères : au-delà, la commande est refusée sans être lue.
  for (const [forme, attendu, n] of [[continuees, 'refuser', 800], [nus, undefined, 2200]]) {
    assert.ok(forme(3 * n).length <= 20000, `${forme(3 * n).length} caractères : au-delà du plafond`);
    mesure(forme(n / 10));
    const petit = mesure(forme(n));
    const grand = mesure(forme(3 * n));
    assert.equal(grand.d, attendu);
    assert.ok(grand.s < 2, `${grand.s} s`);
    // Trois fois plus long : moins de six fois plus de temps et de mémoire (une croissance quadratique en ferait neuf).
    assert.ok(grand.s < 6 * petit.s + 0.2, `${petit.s} s puis ${grand.s} s`);
    assert.ok(grand.mo < 200, `${grand.mo} Mo`);
  }
});

test('lireDependances : la ligne d’en-tête, accents graves ou nus, — ou absente → []', () => {
  const ticket = (ligne) => `# X\n\nStatus: ready-for-agent\n${ligne}\n\n## Le besoin\n\nx\n`;
  assert.deepEqual(lireDependances(ticket('Dépendances: `leaflet`, `@types/leaflet`')), ['leaflet', '@types/leaflet']);
  assert.deepEqual(lireDependances(ticket('Dépendances: leaflet, zod')), ['leaflet', 'zod']);
  assert.deepEqual(lireDependances(ticket('Dépendances: —')), []);
  assert.deepEqual(lireDependances(ticket('Dépendances: `zod` — ou retirer la ligne')), ['zod']);
  assert.deepEqual(lireDependances(ticket('Modèle: sonnet')), []);
  assert.deepEqual(lireDependances('# X\n\nStatus: x\n\n## Comments\n\nDépendances: `zod`\n'), [], 'hors de l’en-tête, la ligne ne compte pas');
});

test('le texte libre d’une commande (message de commit, heredoc) n’est pas lu', () => {
  assert.equal(decisionCommande("git commit -m 'ne jamais git push --force'"), null);
  assert.equal(sansTexte('cat <<EOF\ngit push --force\nEOF'), 'cat <<heredoc');
});

test('planDemarrage ne lance que les étapes manquantes et actives', async () => {
  const { planDemarrage } = await import('./demarrage.mjs');
  const pret = { originDevelop: true, originHead: true, nodeModules: true, lockfileMtime: 1, installMtime: 2, postgres: null, baseTest: null };
  assert.deepEqual(planDemarrage(pret), []);
  assert.deepEqual(planDemarrage({ ...pret, originDevelop: false, lockfileMtime: 3 }), ['fetch-develop', 'install']);
  assert.deepEqual(planDemarrage({ ...pret, postgres: false, baseTest: false }), [], 'étapes de base désactivées tant que le projet n’a pas sa base');
});

const PLUGINS = JSON.stringify({ version: 2, plugins: { 'maj-skills@maj': [{ scope: 'user', version: '4.2.0' }] } });
const CLAUDE_GRAPHIFY = '# CLAUDE.md\n\nAprès toute modification, lancer `graphify update .`.\n';
const depotPret = { claudeMd: CLAUDE_GRAPHIFY, graphifyCommande: true, grapheGraphify: true, pluginsInstalles: PLUGINS };

test('le démarrage signale graphify quand CLAUDE.md le demande et que la commande ou le graphe manque', async () => {
  const { signalementsDemarrage } = await import('./demarrage.mjs');
  const sansCommande = signalementsDemarrage({ ...depotPret, graphifyCommande: false });
  assert.equal(sansCommande.length, 1);
  assert.match(sansCommande[0], /graphify/);
  assert.match(sansCommande[0], /commande est introuvable/);
  const sansGraphe = signalementsDemarrage({ ...depotPret, grapheGraphify: false });
  assert.equal(sansGraphe.length, 1);
  assert.match(sansGraphe[0], /graphify-out\/graph\.json manque/);
  assert.match(sansGraphe[0], /graphify update \./);
  assert.equal(signalementsDemarrage({ ...depotPret, graphifyCommande: false, grapheGraphify: false }).length, 1, 'un seul signalement graphify : la commande d’abord');
  for (const claudeMd of [null, '# CLAUDE.md\n\ngraphify est installé.\n', '']) {
    assert.deepEqual(signalementsDemarrage({ ...depotPret, claudeMd, graphifyCommande: false, grapheGraphify: false }), [], `CLAUDE.md ne demande rien : ${JSON.stringify(claudeMd)}`);
  }
});

test('le démarrage signale les skills de la chaîne absents, avec les lignes du script de l’environnement', async () => {
  const { signalementsDemarrage, pluginInstalle } = await import('./demarrage.mjs');
  const absents = [null, '', '{', 'null', '[]', JSON.stringify({ version: 2 }), JSON.stringify({ plugins: { 'mattpocock-skills@mattpocock': [] } }), JSON.stringify({ plugins: { 'maj-skills@autre': [] } })];
  for (const pluginsInstalles of absents) {
    const s = signalementsDemarrage({ ...depotPret, pluginsInstalles });
    assert.equal(s.length, 1, `fichier ${JSON.stringify(pluginsInstalles)} : un signalement`);
    assert.match(s[0], /skills de la chaîne absents/);
    for (const ligne of ['claude plugin marketplace add MAJ-agency/skills', 'claude plugin install maj-skills@maj', 'claude plugin marketplace update maj', 'claude plugin update maj-skills@maj', '§ 5, étape 5', 's’arrêter', '~/.claude/plugins/marketplaces/maj/skills/', 'Si l’installation échoue']) {
      assert.ok(s[0].includes(ligne), `contient ${ligne}`);
    }
    assert.doesNotMatch(s[0], /add_repo|clone/);
    assert.equal(pluginInstalle(pluginsInstalles), false);
  }
  assert.equal(pluginInstalle(PLUGINS), true);
  assert.equal(pluginInstalle(JSON.stringify({ plugins: { 'maj-skills@maj': [] } })), true);
});

test('un dépôt prêt ne signale rien', async () => {
  const { signalementsDemarrage } = await import('./demarrage.mjs');
  assert.deepEqual(signalementsDemarrage(depotPret), []);
  assert.deepEqual(signalementsDemarrage({ ...depotPret, claudeMd: null, graphifyCommande: false, grapheGraphify: false }), [], 'sans CLAUDE.md, graphify n’est pas demandé');
});

test('lintable : le code TypeScript et les scripts, jamais les sorties de build ni node_modules', () => {
  for (const f of ['apps/api/src/a.ts', 'apps/web/src/b.tsx', 'scripts/verify/c.mjs', 'd.js']) assert.equal(lintable(f), true, f);
  for (const f of ['README.md', 'package.json', 'apps/web/.next/x.js', 'node_modules/x/y.ts', 'apps/api/dist/main.js', 'coverage/lcov.ts']) assert.equal(lintable(f), false, f);
});

// A-51 bis et ter : la garde refuse l'union du lecteur par jetons et de la lecture de 7.9.x, jouée sur la commande
// d'origine, sans rien en retirer.
test('A-51 bis : l’union refuse ce que la lecture de 7.9.x refusait en citations imbriquées, et que bash lance', () => {
  for (const c of [
    'echo "$(ssh h "git commit --no-verify -m x")"',
    'echo "$(ssh h "git commit -n -m x")"',
    'echo "$(ssh h "git rebase origin/sujet/x")"',
    "git commit -F - <<'EOF'\nfix: l'agent ne lance pas gh pr merge\nEOF\nnice -n 5 git push",
    "cat <<EOF\nl'agent\nEOF\necho \"$(ssh h \"git commit --no-verify -m x\")\"",
  ])
    assert.equal(decisionCommande(c, CTX_33)?.decision, 'refuser', c);
});

test('A-51 ter, /security-review de 83d3e01 : un corps retiré changeait l’appariement des here-docs de 7.9.x — refusé', () => {
  // Dans `$(…)`, bash ferme le here-doc sur `EOF )` et lance le push ; le lecteur par jetons y voit encore le corps.
  // La lecture de 7.9.x, sur la commande d'origine, voit le push et refuse ; sur la commande allégée (A-51 bis), le
  // corps retiré déplaçait son appariement et la commande passait.
  for (const c of [
    `x=$(cat <<'EOF'\nl'a\nEOF )\n${F_33}\nEOF\n)`,
    `x=$(cat <<EOF\nl'a\nEOF )\n${F_33}\nEOF\n)`,
    `x=$(cat <<-'EOF'\nl'a\nEOF )\n${F_33}\nEOF\n)`,
  ])
    assert.equal(decisionCommande(c, CTX_33)?.decision, 'refuser', c);
});

test('A-51 ter : monotone par construction — tout refus de la lecture de 7.9.x sur la commande d’origine est un refus de la garde', () => {
  const F = F_33;
  const enveloppes = [(b) => b, (b) => `ssh h "${b}"`, (b) => `ssh h "bash -c '${b}'"`, (b) => `su -c "sh -c '${b}'"`, (b) => `sudo sh -c "eval '${b}'"`, (b) => `eval "eval '${b}'"`,
    (b) => `echo "$(ssh h "${b}")"`, (b) => `bash -c "python3 -c 'import os; os.system(\\"${b}\\")'"`, (b) => `x=$(${b})`, (b) => `trap "sh -c '${b}'" EXIT`, (b) => `env -S "sh -c '${b}'"`];
  const bases = [F, 'gh pr merge 12', 'git commit --no-verify -m x', 'git commit -n -m x', 'npm install leftpad', 'pnpm add zod', 'git push origin main', "git -c user.name='a;b' push -f", 'git rebase origin/develop', 'gh api -X PUT repos/o/r/pulls/1/merge'];
  const autour = [(x) => x, (x) => `cat <<EOF\nl'agent $(echo y)\nEOF\n${x}`, (x) => `python3 - <<'EOF'\nprint("l'a")\nEOF\n${x}`, (x) => `${x} # l'x`, (x) => `echo l\\'x; ${x}`,
    (x) => `git commit -F - <<'EOF'\nfix: l'agent\nEOF\n${x}`, (x) => `x=$(cat <<'EOF'\nl'a\nEOF )\n${x}\nEOF\n)`];
  let vus = 0;
  const ecarts = [];
  for (const e of enveloppes) for (const b of bases) for (const a of autour) {
    const c = a(e(b));
    if (LECTURE_7_9.decisionCommande(c, CTX_33)?.decision !== 'refuser') continue;
    vus++;
    if (decisionCommande(c, CTX_33)?.decision !== 'refuser') ecarts.push(c);
  }
  assert.ok(vus > 400, `${vus}`);
  assert.deepEqual(ecarts, []);
});

test('A-51 bis : la lecture de 7.9.x rend ce que rendait son motif de here-doc, sans son coût', () => {
  const HD = /<<-?\s*(['"]?)(\w+)\1[^\n]*\n[\s\S]*?\n\s*\2(?=\s|$)/g;
  const { sansHeredocs79 } = LECTURE_7_9;
  const ALPHA = ['<', '-', ' ', '\n', "'", '"', 'E', 'F', '\t'];
  const ecarts = [];
  // Exhaustif : toutes les chaînes de six caractères sur cet alphabet, après « << » et après « x << ».
  const rec = (s, k) => {
    if (s.replace(HD, '<<heredoc') !== sansHeredocs79(s)) ecarts.push(s);
    if (k > 0) for (const c of ALPHA) rec(s + c, k - 1);
  };
  rec('<<', 6);
  rec('x <<', 5);
  // Tirages longs, graine fixe.
  let x = 7;
  const h = (m) => (x = (x * 1103515245 + 12345) % 2147483648) % m;
  const FR = ['<<', '<<-', "<<'EOF'", '<<"EOF"', '<<EOF', 'EOF', 'EO', 'EOFX', '\n', ' ', '\t', "'", '"', 'x', ';', ' ', '\r', ' ', 'A', '<<A', 'A\n', '_'];
  for (let t = 0; t < 50000; t++) {
    let s = '';
    for (let k = 1 + h(25); k > 0; k--) s += FR[h(FR.length)];
    if (s.replace(HD, '<<heredoc') !== sansHeredocs79(s)) ecarts.push(s);
  }
  assert.deepEqual(ecarts.slice(0, 5), []);
  // Le cas qui coûtait au cube : dix « <<A » cités, 19 900 sauts de ligne (37 s avec le motif pour 20 000), sous le plafond.
  const c = "echo '" + '<<A '.repeat(10) + "'" + '\n'.repeat(19900) + 'echo ok';
  assert.ok(c.length <= 20000, `${c.length} caractères : au-delà du plafond, la commande ne serait pas lue`);
  const t0 = Date.now();
  assert.equal(decisionCommande(c, CTX_33), null);
  assert.ok(Date.now() - t0 < 2000, `${Date.now() - t0} ms`);
});

test('A-51 ter : au-delà de 20 000 caractères, refus prudent, corps de here-doc compris', () => {
  assert.deepEqual(decisionCommande('echo ' + 'x'.repeat(20001), CTX_33), { decision: 'refuser', raison: RAISON_TROP_LONGUE });
  // Le plafond compte toute la commande, corps de here-doc compris : un message plus long s'écrit dans un fichier.
  // `git commit -F - <<'EOF'`, son saut de ligne et `EOF` font 27 caractères, chaque ligne `fix` 4 : 20 003, puis 19 999.
  assert.deepEqual(decisionCommande(`git commit -F - <<'EOF'\n${'fix\n'.repeat(4994)}EOF`, CTX_33), { decision: 'refuser', raison: RAISON_TROP_LONGUE });
  assert.equal(decisionCommande(`git commit -F - <<'EOF'\n${'fix\n'.repeat(4993)}EOF`, CTX_33), null);
});


test('A-51 ter : le plafond se teste avant toute lecture — une commande de plus de 20 000 caractères est refusée vite', () => {
  // La lecture par jetons est quadratique sur `git commit -m x ` répété : 122 s au-delà du délai du hook, avant le plafond.
  const c = 'git commit -m x '.repeat(62000) + '; npm install x';
  const t0 = Date.now();
  assert.deepEqual(decisionCommande(c, CTX_33), { decision: 'refuser', raison: RAISON_TROP_LONGUE });
  assert.ok(Date.now() - t0 < 2000, `${Date.now() - t0} ms`);
});

test('A-51 ter : le contexte est lu une fois pour les deux lectures — un seul appel de chaque', () => {
  const appels = { dependancesPrevues: 0, brancheCourante: 0, brancheParDefaut: 0 };
  const contexte = {
    dependancesPrevues: () => (appels.dependancesPrevues++, ['zod']),
    brancheCourante: () => (appels.brancheCourante++, 'feat/x'),
    brancheParDefaut: () => (appels.brancheParDefaut++, 'develop'),
  };
  assert.equal(decisionCommande('pnpm add zod && git push', contexte), null);
  assert.deepEqual(appels, { dependancesPrevues: 1, brancheCourante: 1, brancheParDefaut: 1 });
});

// Le plafond (ticket 48) : les deux lectures coûtent au carré de la taille sur certaines formes, une option d'une lettre
// répétée sans fin de mot en tête (26 s pour `gh pr close 1 -ddd…!` à 99 980 caractères, sous l'ancien plafond de
// 100 000). À 20 000, le pire cas mesuré prend 1,2 s sur le poste de mesure ; le banc le borne à 10 s, marge pour une
// machine chargée, sous le délai de 60 s du hook. Un caractère de plus, et la commande est refusée sans être lue.
const PLAFOND = 20_000;
const PIRES_CAS = [
  ['gh pr close 1 -', 'd', '!'],
  ['git commit -', 'n', '!'],
  ['git commit -m x -', 'nN', '!'],
  ['GIT commit -', 'n', '.'],
  ['git push -', 'f', '!'],
  ['', '`', ''],
  ['x=', '`', ''],
  ['echo ', '`a`', ''],
  ['', 'git push ', ''],
  ['', '$(a)', ')'],
  ['echo ', '9', ''],
];
const pireCas = ([avant, motif, apres], n) => avant + motif.repeat(Math.ceil(n / motif.length)).slice(0, n - avant.length - apres.length) + apres;
test('le plafond à 20 000 caractères : chaque pire cas mesuré se lit sous 10 s, et se refuse sans lecture à 20 001', () => {
  assert.match(RAISON_TROP_LONGUE, /^commande trop longue pour la garde \(plus de 20 000 caractères\)/);
  assert.match(RAISON_TROP_LONGUE, /Écris le texte long dans un fichier \(git commit -F <fichier>, gh … --body-file <fichier>\)/);
  assert.equal(decisionCommande('echo ' + 'x'.repeat(PLAFOND - 5), CTX_33), null, 'au plafond : lue');
  assert.deepEqual(decisionCommande('echo ' + 'x'.repeat(PLAFOND - 4), CTX_33), { decision: 'refuser', raison: RAISON_TROP_LONGUE }, 'un caractère de plus : refusée');
  for (const cas of PIRES_CAS) {
    const c = pireCas(cas, PLAFOND);
    assert.equal(c.length, PLAFOND, JSON.stringify(cas));
    const t0 = Date.now();
    assert.equal(decisionCommande(c, CTX_33), null, JSON.stringify(cas));
    assert.ok(Date.now() - t0 < 10000, `${JSON.stringify(cas)} : ${Date.now() - t0} ms à ${PLAFOND} caractères`);
    const long = pireCas(cas, PLAFOND + 1);
    assert.equal(long.length, PLAFOND + 1, JSON.stringify(cas));
    const t1 = Date.now();
    assert.deepEqual(decisionCommande(long, CTX_33), { decision: 'refuser', raison: RAISON_TROP_LONGUE }, JSON.stringify(cas));
    assert.ok(Date.now() - t1 < 1000, `${JSON.stringify(cas)} : ${Date.now() - t1} ms pour refuser à ${PLAFOND + 1} caractères`);
  }
});

// `ajouts(code)` de la lecture de 7.9.x retire les redirections par `(?<!\d)\d*(>>?|<)…` (ticket 48, repris
// d'anchorpost) : sans `(?<!\d)`, chaque chiffre d'une longue suite relançait la recherche jusqu'au bout de la suite
// (3,6 s pour `echo` et 99 995 chiffres). Le remplacement rendu est le même : une correspondance qui commencerait
// après un chiffre commencerait déjà sur ce chiffre, et le caractère qui suit une correspondance n'est jamais un
// chiffre (elle s'arrête sur un blanc, `;`, `&`, `|` ou la fin).
test("ticket 48 : `ajouts(code)` de la lecture de 7.9.x ne relance pas sa recherche sur chaque chiffre, et rend le même remplacement", () => {
  const AVANT = /\d*(>>?|<)&?\s*[^\s;&|]*/g;
  const APRES = /(?<!\d)\d*(>>?|<)&?\s*[^\s;&|]*/g;
  const ALPHA = ['1', '>', '<', '&', ' ', ';', '|', 'a'];
  const ecarts = [];
  const voir = (s, k) => {
    if (s.replace(AVANT, ' ') !== s.replace(APRES, ' ')) ecarts.push(s);
    if (k > 0) for (const c of ALPHA) voir(s + c, k - 1);
  };
  voir('', 6);
  assert.deepEqual(ecarts.slice(0, 5), []);
  const ctx = { dependancesPrevues: () => ['zod', 'x'], brancheCourante: () => 'feat/x', brancheParDefaut: () => 'develop' };
  for (const c of ['pnpm add zod 2>/dev/null', 'pnpm add zod 12>x', 'pnpm add x2>y', 'pnpm add zod 1>&2', 'pnpm add zod 2>&1', 'pnpm add zod 99<in', 'pnpm add 2>x zod', 'pnpm add zod>x', 'pnpm add zod >>log 2>&1', 'pnpm add zod 2>err1 3>&-'])
    assert.equal(LECTURE_7_9.decisionCommande(c, ctx), null, c);
  assert.equal(LECTURE_7_9.decisionCommande('pnpm add react 2>/dev/null', ctx)?.decision, 'refuser');
  // Hors plafond, la lecture de 7.9.x seule : linéaire sur une longue suite de chiffres.
  const t0 = Date.now();
  assert.equal(LECTURE_7_9.decisionCommande('echo ' + '9'.repeat(99995), CTX_33), null);
  assert.ok(Date.now() - t0 < 1000, `${Date.now() - t0} ms pour 99 995 chiffres`);
});

// ——— Ticket 17 de capitaine-a-jour-et-teste : la garde lit git après ses options globales et refuse de sauter les hooks ———

const enBranche = { brancheCourante: () => 'feat/x', brancheParDefaut: () => 'develop' };
const HOOKS = /hooks git/;
const ARGUMENT = /argument de git illisible/;
const REF_DE_SUIVI = /refs\/remotes/;
const SUJET = /un sujet ne se pousse jamais/;
const PUSH_ILLISIBLE = /dont la destination ne se lit pas/;
/** Chaque commande est refusée, et sa raison répond à `raison`. */
function refusees(commandes, raison) {
  for (const c of commandes) {
    const d = decisionCommande(c, enBranche);
    assert.equal(d?.decision, 'refuser', `devrait être refusée : ${c}`);
    assert.match(d.raison, raison, c);
  }
}
/** Chaque commande passe la garde. */
function passent(commandes) {
  for (const c of commandes) assert.equal(decisionCommande(c, enBranche), null, `devrait passer : ${c}`);
}

const T17_CINQ = [
  'git -C . commit --no-verify -m x',
  'git -c core.hooksPath=/dev/null commit -m x',
  'GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null git commit -m x',
  'git config core.hooksPath /dev/null',
  'git --config-env core.hooksPath=VIDE commit -m x',
];
test('ticket 17 : les cinq contournements joués sur 7.15.0 sont refusés', () => {
  refusees(T17_CINQ, HOOKS);
});

const T17_OPTIONS_GLOBALES = [
  'git -C . commit --no-verify -m x',
  'git --git-dir=.git push --no-verify origin feat/a',
  'git --work-tree=. commit --no-verify -m x',
  'git -c a=b commit -n -m x',
  'git -C /tmp/w -c a=b merge --no-verify feat/a',
  'git --no-pager -c a=b rebase --no-veri main',
  'git -p --bare am --no-verify x.patch',
  'git --namespace=n --exec-path=/x commit --no-verify -m x',
  'git --attr-source HEAD commit --no-verify -m x',
  'git --foo=bar commit -nm x',
  '/usr/bin/git -C "$(pwd)" commit --no-verify -m x',
  "git -c user.name='a b' commit --no-verify -m x",
  'git -C $(git rev-parse --show-toplevel) commit --no-verify -m x',
  'git -c a=$(echo 1) commit -n -m x',
  'git -C `dirname $PWD/x` push --no-verify origin feat/a',
  'git -C /tmp/mon\\ dossier commit --no-verify -m x',
  'git -C $((1 + 2)) commit --no-verify -m x',
  'git -C ${x:-a b} commit --no-verify -m x',
  'git -C $(pwd) commit -n -m x',
  'git $(echo commit) --no-verify -m x',
  "cat <<< 'git commit --no-verify -m x' | bash",
  `sh -c "$(cat <<< 'git commit --no-verify -m x')"`,
  `eval "$(cat <<< 'git commit --no-verify -m x')"`,
  'git commit -F msg.txt -n',
  'git commit -$(echo n) -m x',
  'git -C . commit -u --no-verify -m x',
  'git -C . commit -S --no-verify -m x',
  'git -C . commit -a -u --no-verify -m x',
];
const T17_ARGUMENTS_A_EXPANSION = [
  'git -C . commit $(echo --no-verify) -m x',
  "X='x -c core.hooksPath=/dev/null'; git -c user.name=$X commit -am y",
  'git -C $(pwd) commit -m x',
];
// Une variable définie une fois, simplement, dans la commande, en expansion nue, se relit avec sa valeur (A-49) : le
// refus porte alors la raison de ce qu'elle cache.
const T17_VARIABLES_RELUES = ['X=--no-verify; git -C . commit $X -m x', 'X=-n; git -C . commit $X -m x', "m='x --no-verify'; git -C . commit -am $m"];
test('ticket 17 : --no-verify et -n se lisent après les options globales de git, valeur opaque comprise', () => {
  refusees(T17_OPTIONS_GLOBALES, HOOKS);
  // Un argument à expansion là où git peut lire une option (A-38), une expansion non citée dans une valeur (A-40).
  refusees(T17_ARGUMENTS_A_EXPANSION, ARGUMENT);
  refusees(T17_VARIABLES_RELUES, HOOKS);
  // La forme citée passe : l'expansion est dans une valeur, entière.
  passent(['git -C "$(pwd)" commit -m x']);
});

const T17_PULL_AM = ['git pull --no-verify origin develop', 'git am -n x.patch', 'git am --no-verify x.patch', 'git -C . pull --no-verify origin develop', 'git am -3n x.patch'];
test('ticket 17 : git pull --no-verify et git am -n sont refusés ; --no-verify-signatures et git push -n passent', () => {
  refusees(T17_PULL_AM, HOOKS);
  passent(['git merge --no-verify-signatures origin/develop', 'git pull --no-verify-signatures origin develop', 'git push -n origin feat/x', 'git pull -n origin develop', 'git rebase -n origin/feat/y']);
});

const T17_CONFIG_GLOBALE = [
  'git -c core.hooksPath=/dev/null commit -m x',
  'git -c core.hooksPath= commit -m x',
  'git -c Core.HooksPath=x commit -m x',
  'git -c "core.hookspath=/dev/null" push origin feat/x',
  'git --git-dir=.git -c core.hooksPath=/x commit -m y',
  'git --config-env core.hooksPath=V commit -m x',
  'git --config-env=core.hooksPath=V commit -m x',
  'git -c "core.hooksPath=/a b" commit',
  'git -c core."hooksPath"=/tmp/h commit',
  "git -c 'core.hooks'Path=/x commit",
  'git -c core.hooks\\Path=/x commit',
  'git -c a=b -c core.hooksPath=/x rebase main',
  'git -c core.hooksPath=/x checkout feat/a',
  'git -c core.hooksPath=/x status',
  'git -c include.path=/tmp/x.cfg commit -m x',
  'git -c includeIf.gitdir:/x/.path=/tmp/x.cfg commit -m x',
  "git -c alias.ci='commit --no-verify' ci -m x",
  'git -c Alias.p=push p origin feat/x',
  'git --config-env=alias.x=V x',
  'git -c "$(echo core.hooksPath=/dev/null)" commit -m x',
  'git -c "core.$(echo hooksPath)=/x" commit -m x',
  'git --config-env "$(echo core.hooksPath)=HOME" commit -m x',
  'git -c "$(echo alias.ci=commit --no-verify)" ci -m x',
];
test('ticket 17 : core.hooksPath et include posés par -c ou --config-env sont refusés avant toute sous-commande', () => {
  refusees(T17_CONFIG_GLOBALE, HOOKS);
});

const T17_GIT_CONFIG = [
  'git config core.hooksPath x',
  'git config --local core.hooksPath x',
  'git config --global core.hooksPath x',
  'git config --worktree core.hooksPath x',
  'git config --file .git/config core.hooksPath x',
  'git config -f .git/config core.hooksPath x',
  'git config --replace-all core.hooksPath x',
  'git config --unset core.hooksPath',
  'git config --unset-all core.hooksPath',
  'git config set core.hooksPath x',
  'git config unset core.hooksPath',
  'git config core.hooksPath ""',
  'git config --remove-section core',
  'git config --global core.hooksPath /tmp/vide',
  'git config include.path /tmp/x.cfg',
  'git config --add core.hooksPath /tmp',
  'git -C . config core.hooksPath /tmp',
  'git config core."hooksPath" /x',
  'git config core.hooksPath list',
  'git config --comment get core.hooksPath /tmp/h',
  'git config --comment=get core.hooksPath /tmp/h',
  'git config --inconnue --get core.hooksPath /tmp/h',
  'git config -e',
  'git config --rename-section hacks core',
  'git config rename-section hacks core',
  'git config --rename-section core hacks',
  'git config --rename-section x Include',
  'git config --rename-section x includeIf.gitdir:/y/',
  'git config --remove-section include',
  'git config alias.ci "commit --no-verify"',
  'git config --global alias.p push',
  'git config "$(echo core.hooksPath)" /dev/null',
  'git config --rename-section "$s" core',
];
test('ticket 17 : git config qui écrit, vide ou retire core.hooksPath ou un include est refusé ; la lecture passe', () => {
  refusees(T17_GIT_CONFIG, HOOKS);
  passent([
    'git config --get core.hooksPath',
    'git config get core.hooksPath',
    'git config core.hooksPath',
    'git config --global core.hooksPath',
    'git config --list',
    'git config -l',
    'git config --show-origin --get core.hooksPath',
    'git config --comment x --get core.hooksPath',
    'git config --file x.cfg get core.hooksPath',
    'git config --get include.path',
    'git config --get-urlmatch core.hooksPath https://example.org',
    'git config user.name x',
    'git config user.name "Session"',
    'git config --file=x.cfg --get core.hooksPath',
    'git config --type=bool --get core.bare',
    'git config --get alias.ci',
    'git config --rename-section hacks autre',
    'git config --get "$k"',
  ]);
});

const T17_ENVIRONNEMENT = [
  'HUSKY=0 git commit -m x',
  'HUSKY= git commit -m x',
  'HUSKY=0\ngit commit -m x',
  'export HUSKY=0',
  'export HUSKY=0 && git push -u origin feat/x',
  'env HUSKY=0 git push origin feat/x',
  'declare -x HUSKY=0',
  'typeset -x HUSKY=0',
  'export -- HUSKY=0',
  'export  HUSKY="0"',
  'HUSKY=0 bash scripts/chaine/passer.sh 12',
  '`HUSKY=0 git commit -m x`',
  'GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=x git commit -m x',
  `GIT_CONFIG_PARAMETERS="'core.hooksPath=/dev/null'" git commit -m x`,
  'sudo HUSKY=0 git commit -m x',
  'doas HUSKY=0 git commit -m x',
  'nohup env HUSKY=0 git push origin feat/x',
  'exec HUSKY=0 git commit -m x',
  'printf -v HUSKY 0; export HUSKY; git commit -m x',
  'read HUSKY < f; export HUSKY',
  'declare -x HUSKY',
  'typeset -x HUSKY',
  'export GIT_CONFIG_COUNT',
];
test('ticket 17 : HUSKY, GIT_CONFIG_PARAMETERS et GIT_CONFIG_COUNT affectés ou exportés sont refusés ; en argument, ils passent', () => {
  refusees(T17_ENVIRONNEMENT, HOOKS);
  passent(['echo HUSKY=0', 'grep -rn HUSKY=0 .husky', 'git log --grep HUSKY=0', 'if grep -q HUSKY=0 f; then echo oui; fi', 'MY_HUSKY=0 pnpm test', 'HUSKY_GIT_PARAMS=x git commit -m x', 'GIT_CONFIG_NOSYSTEM=1 git commit -m x']);
});

const T17_REFS_DE_SUIVI = [
  'git update-ref refs/remotes/origin/leurre HEAD',
  'git -C . update-ref refs/remotes/leurre/x HEAD',
  'git -C $(pwd) update-ref refs/remotes/origin/x HEAD',
  'git update-ref -d refs/remotes/origin/develop',
  'git update-ref --stdin <<<"update refs/remotes/origin/x HEAD"',
];
test('ticket 17 : git update-ref vers refs/remotes est refusé ; une branche locale passe', () => {
  // `git -C $(pwd) …` est aussi un argument illisible : son refus, quel qu'en soit le motif, est ce qui compte.
  refusees(T17_REFS_DE_SUIVI.filter((c) => !c.includes('$(pwd)')), REF_DE_SUIVI);
  refusees(T17_REFS_DE_SUIVI.filter((c) => c.includes('$(pwd)')), /refs\/remotes|argument de git illisible/);
  passent(['git update-ref -d refs/heads/tmp']);
});

const T17_CONFIG_ENV_SUJET = ['git --config-env user.name=HOME push origin HEAD:sujet/demo', 'git --config-env user.name=NOM push origin HEAD:sujet/demo'];
test('ticket 17 : --config-env prend sa valeur, un push vers un sujet derrière lui est refusé', () => {
  refusees(T17_CONFIG_ENV_SUJET, SUJET);
});

const T17_MATCHING = ['git push origin :', 'git push origin : ', 'git push -u origin :'];
test('ticket 17 : le push matching est refusé comme une destination illisible', () => {
  refusees(T17_MATCHING, PUSH_ILLISIBLE);
});

const T17_PUSH_PAR_LA_CONFIGURATION = [
  'git -c remote.origin.push=HEAD:sujet/demo push origin',
  'git -c push.default=matching push origin',
  'git -c remote.pushDefault=x push',
  'git -c branch.feat/x.pushRemote=y push',
  'git --config-env remote.origin.push=V push origin',
  'git config remote.origin.push HEAD:refs/heads/develop',
  'git config push.default matching',
  'git -c "$(echo remote.origin.push=HEAD:sujet/d)" push origin',
];
test('ticket 17 : une destination de push portée par la configuration est illisible', () => {
  refusees(T17_PUSH_PAR_LA_CONFIGURATION, PUSH_ILLISIBLE);
  passent(['git -c core.quotepath=false push -u origin feat/x', 'git config --get remote.origin.push']);
});

const T17_TEXTES_CITES = [
  'echo "git -c core.hooksPath=/x commit"',
  'grep -rn "git commit -n" skills',
  'gh pr create --body "git commit --no-verify -m x"',
  'git commit -m "x; git -C . config core.hooksPath /x"',
];
test('ticket 17 : un texte cité qui porte une commande git refusée est refusé, un message de commit passe', () => {
  refusees(T17_TEXTES_CITES, HOOKS);
  passent(['git commit -m "voir git -c core.hooksPath=/x commit"', 'gh pr create --body-file corps.md']);
});

test('ticket 17 : les commandes ordinaires de la chaîne passent toujours', () => {
  passent([
    // Ticket 34, « À laisser passer ».
    'git config user.name "Session"',
    'git config --get core.hooksPath',
    'git config core.hooksPath',
    'git config --list',
    'git commit -m "doc: HUSKY=0 et core.hooksPath sont refusés"',
    'git commit -m "fix -n option"',
    'git commit -am x',
    'git commit -q --no-edit',
    'git -c core.quotepath=false diff --name-only --no-renames origin/develop...HEAD',
    'git merge --no-edit origin/develop',
    'git push -n origin feat/x',
    'pnpm install --frozen-lockfile',
    'echo HUSKY=0',
    'grep -rn HUSKY=0 .husky',
    'git log --grep HUSKY=0',
    'if grep -q HUSKY=0 f; then echo oui; fi',
    'git config --get include.path',
    'git config --get-urlmatch core.hooksPath https://example.org',
    'git merge --no-verify-signatures origin/develop',
    'git pull --no-verify-signatures origin develop',
    // Les messages de commit (A-37, B1 ; A-39) : un message n'est jamais lu comme des options.
    'git commit -m "fix -n option"',
    'git commit -m "doc: --no-verify est refusé"',
    'timeout 5 git commit -m "fix -n option"',
    'git commit --message="doc: -n et --no-verify"',
    'git commit -am "fix -n"',
    'git merge -m "fix --no-verify" origin/develop',
    'git commit -m "$msg"',
    'git commit -F "$f"',
    'git commit --message="$m"',
    'git commit -m x --author="$a"',
    'git commit --gpg-sign="$k" -m x',
    'git -c user.name="$n" commit -m x',
    "bash <<'EOF'\ngit commit -m \"fix -n x\"\nEOF",
    // Iroki #652, « ce qui parle de core.hooksPath sans le poser passe », sauf ses trois refus nouveaux (## Comments du ticket).
    'git config --get core.hooksPath',
    'git config get core.hooksPath',
    'git commit -m "refuse git -c core.hooksPath=/x commit"',
    'git commit -m "GIT_CONFIG_PARAMETERS et git config core.hooksPath /tmp"',
    'git config user.name x',
    'GIT_CONFIG_NOSYSTEM=1 git commit -m x',
    'git -c core.pager=cat commit -m "core.hooksPath"',
    // Les formes que les skills et scripts de la chaîne font taper (Vérification 3 du ticket).
    'git fetch origin',
    'git fetch -q origin develop',
    'git push -u origin feat/x',
    'git push origin HEAD:feat/x',
    'git status --porcelain',
    'git -C "$(git rev-parse --show-toplevel)" status',
    'git -C "$racine" log --oneline -5',
    'git log --oneline origin/develop..HEAD',
    'git diff --name-only origin/develop...HEAD',
    'git checkout -b feat/x origin/develop',
    'git switch -c feat/x origin/develop',
    'git merge --no-ff --no-edit origin/develop',
    'git add -A && git commit -m "feat: x"',
    'git commit -F /tmp/message.txt',
    'git commit --no-edit',
    'git rev-parse HEAD',
    'git rev-parse --abbrev-ref HEAD',
    'git ls-remote --heads origin "sujet/*"',
    'git worktree add ../x feat/x',
    'git branch -D feat/vieille',
    'git stash push -m "wip -n"',
    'git tag -a v1.0.0 -m "version"',
    'git cherry-pick abc123',
    'git -c core.quotepath=false diff --stat',
    'git commit -m x -- src/a.ts src/*.ts',
  ]);
});

test('ticket 17 : chaque refus du ticket, coupé en ligne continuée à chaque espace, reste un refus', () => {
  /** Chaque espace hors des guillemets devient une ligne continuée. */
  const continuer = (c) => {
    let sortie = '';
    let quote = null;
    for (let i = 0; i < c.length; i++) {
      const ch = c[i];
      if (ch === '\\' && quote !== "'") {
        sortie += ch + (c[i + 1] ?? '');
        i++;
      } else if (quote) {
        if (ch === quote) quote = null;
        sortie += ch;
      } else if (ch === "'" || ch === '"') {
        quote = ch;
        sortie += ch;
      } else sortie += ch === ' ' ? ' \\\n' : ch;
    }
    return sortie;
  };
  const refus = [
    ...T17_CINQ,
    ...T17_OPTIONS_GLOBALES,
    ...T17_ARGUMENTS_A_EXPANSION,
    ...T17_VARIABLES_RELUES,
    ...T17_PULL_AM,
    ...T17_CONFIG_GLOBALE,
    ...T17_GIT_CONFIG,
    ...T17_ENVIRONNEMENT,
    ...T17_REFS_DE_SUIVI,
    ...T17_CONFIG_ENV_SUJET,
    ...T17_MATCHING,
    ...T17_PUSH_PAR_LA_CONFIGURATION,
    ...T17_TEXTES_CITES,
  ];
  for (const c of refus) {
    const continuee = continuer(c);
    assert.equal(decisionCommande(continuee, enBranche)?.decision, 'refuser', `ligne continuée : ${JSON.stringify(continuee)}`);
  }
});

test('ticket 17 : appelsGit lit les options globales, leur valeur opaque, la sous-commande, et le premier git du segment seul', () => {
  const appels = (c) => appelsGit(lireCommande(c).lectures).map(({ globales, sous, args }) => ({ globales, sous, args }));
  assert.deepEqual(appels('git -C /tmp/w -c a=b --no-pager commit -m x')[0], {
    globales: [{ option: '-C', valeur: '/tmp/w' }, { option: '-c', valeur: 'a=b' }, { option: '--no-pager', valeur: null }],
    sous: 'commit',
    args: ['-m', 'x'],
  });
  assert.deepEqual(appels('git --git-dir=.git --config-env user.name=HOME push origin feat/x')[0], {
    globales: [{ option: '--git-dir', valeur: '.git' }, { option: '--config-env', valeur: 'user.name=HOME' }],
    sous: 'push',
    args: ['origin', 'feat/x'],
  });
  assert.deepEqual(appels('git -C "$(pwd)" status')[0].globales, [{ option: '-C', valeur: '$SUBSTITUTION' }]);
  assert.equal(appels('git $(echo commit) -m x')[0].sous, null, 'une sous-commande à expansion est illisible : null');
  assert.ok(appels('git commit -m "x git config core.hooksPath y"').every(({ sous }) => sous === 'commit'), 'seul le premier git du segment compte');
});

test('ticket 17 : le hook de lecture des push reste le même, --config-env compris', () => {
  assert.equal(pousseSurUnSujet('git --config-env user.name=HOME push origin HEAD:sujet/demo'), true);
  assert.equal(pousseSurUnSujet('git --config-env=user.name=HOME push origin HEAD:sujet/demo'), true);
  assert.equal(pousseSurUnSujet('git -C . push origin feat/x'), false);
});

test('ticket 17 : les prédicats nouveaux sont exportés et se lisent un par un', () => {
  assert.equal(sauteLesHooks('git -C . commit --no-verify -m x'), true);
  assert.equal(sauteLesHooks('git commit -m "fix -n option"'), false);
  assert.equal(ecritUneRefDeSuivi('git update-ref refs/remotes/origin/x HEAD'), true);
  assert.equal(ecritUneRefDeSuivi('git update-ref -d refs/heads/tmp'), false);
});

test('ticket 17 : recherche adversariale — chaque contournement trouvé sur le dépôt à hook témoin est refusé', () => {
  // Joués sur un dépôt jouet dont le pre-commit écrit un témoin et sort en 1 : chacun y créait un commit sans hook.
  refusees(
    [
      // Un motif ou des accolades non cités : bash en fait d'autres mots (un fichier `-n` suffit pour `-*`).
      'touch -- -n; git commit -a -m x -*',
      'git commit -a -m x -[n]',
      'git {-c,core.hooksPath=/dev/null} commit -am x',
      'git -c {core.hooksPath=/dev/null,} commit -am x',
      // `git am` n'a pas de --verbose : `--no-v` y est déjà --no-verify.
      'git am --no-v x.patch',
      'git am --no-ve x.patch',
      // `set -a` exporte ce que `((…))`, `${X:=…}` ou `for` affectent, que la garde ne lit pas.
      'set -a; ((GIT_CONFIG_COUNT=1)); GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null git commit -am x',
      'set -o allexport; : ${GIT_CONFIG_COUNT:=1}; GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null git commit -am x',
      'set -a; for GIT_CONFIG_COUNT in 1; do GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null git commit -am x; done',
      'shopt -s -o allexport',
      // Une affectation possible derrière un préfixe, et un nom porté par une variable.
      'X=GIT_CONFIG_COUNT=1; env "$X" GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null git commit -am x',
      'declare -n r=GIT_CONFIG_COUNT; export r=1',
      // Revue de ticket, axe Règles : la durée de `timeout` derrière une option, la priorité de `chrt`.
      'timeout -s KILL 5 env HUSKY=0 git commit -m x',
      'timeout -k 1 5 env GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null git commit -m x',
      'chrt 10 env HUSKY=0 git commit -m x',
      // Revue de ticket, axe Règles : un mot `git-…` placé avant le programme interne ne le masque pas.
      'env -C /tmp/git-w /usr/lib/git-core/git-commit -anm x',
      'sudo -u git-bot /usr/lib/git-core/git-commit -anm x',
      // Les programmes internes de git : `git-commit` est git commit.
      '/usr/lib/git-core/git-commit -anm x',
      '"$(git --exec-path)/git-commit" -anm x',
      'PATH="$(git --exec-path):$PATH" git-commit -anm x',
      '/usr/lib/git-core/git-config core.hooksPath /dev/null',
      // Une commande que git lance par un shell se relit comme une commande de la session.
      "git rebase --exe='git commit -anm y' HEAD",
      "git -c core.pager='HUSKY=0 git commit -am y; cat' log -1",
      "git -c core.editor='git -c core.hooksPath=/dev/null commit -am y' commit -e -m z",
      'git config core.editor "git -c core.hooksPath=/x commit"',
    ],
    HOOKS,
  );
  // Une expansion non citée dans une option globale peut y écrire `-c alias.…`, devant toute sous-commande.
  refusees(["X='. -c alias.zz=!git${IFS}commit${IFS}-anm${IFS}x'; git -C $X zz", 'git -C {.,-c,core.hooksPath=/dev/null} commit -am x', 'git -C $dir status', "p='git commit -anm y'; git -c core.pager=\"$p\" log"], /hooks git|argument de git illisible/);
  // Le push par un programme interne vers un sujet était déjà ouvert sur main.
  refusees(['/usr/lib/git-core/git-push origin HEAD:sujet/x', 'env -C /tmp/git-w /usr/lib/git-core/git-push origin HEAD:sujet/x'], SUJET);
  refusees(['git-push origin :', 'git -c remote.origin.mirror=true push origin', 'git push {origin,HEAD:sujet/x}'], PUSH_ILLISIBLE);
  // Une substitution de processus rend un seul chemin : elle n'est pas découpée, elle passe en valeur (Iroki la refusait).
  passent(['git -C <(echo a b) commit -m x', 'git commit -m x -- -*', 'set -euo pipefail', 'set -x', 'git -C "$X" push origin feat/x', 'man git-commit', 'git -c core.pager=cat log -1', 'timeout 5 git commit -m "fix -n"', 'timeout --foreground 5 pnpm test', 'sudo -u "$u" git status', 'git -c core.pager="less -FRX" log', 'git reset HEAD@{1}', 'git commit -m x -- {a,b}.ts']);
});

test('ticket 17 : /security-review — chaque contournement confirmé sur un dépôt jouet est refusé', () => {
  // `"$@"`, `"${a[@]}"` : un mot par élément, même entre guillemets doubles.
  refusees(['set -- x --no-verify; git commit -m "$@"', 'set -- . -c core.hooksPath=/dev/null; git -C "$@" commit -m y'], ARGUMENT);
  // Un tableau défini une fois, simplement, se relit avec ses valeurs (A-49) : le --no-verify qu'il cache est lu.
  refusees(['a=(z --no-verify); git commit -m "${a[@]}"'], HOOKS);
  // Ouvert sur main aussi : la sous-commande push portée par `"$@"`.
  refusees(['set -- . push --no-verify -f origin HEAD:develop; git -C "$@"'], /hooks git|argument de git illisible|destination ne se lit pas/);
  refusees(
    [
      // `set -k` : tout `NOM=…` de la commande va dans l'environnement, même après git.
      'set -k; git commit --allow-empty -m x GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null',
      'set -o keyword; git commit -m x HUSKY=0',
      // Un lanceur hors de la liste des préfixes.
      'taskset 1 env GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null git commit -m w',
      'flock /tmp/l env HUSKY=0 git commit -m v',
      'taskset 1 env HUSKY=0 git commit -m x',
      'flock /tmp/l env HUSKY=0 bash scripts/chaine/passer.sh 12',
      // Les abréviations des options de git config.
      'git config --unset-a core.hooksPath',
      'git config --remove-sec core',
      'git config --rename-sec core x',
    ],
    HOOKS,
  );
  refusees(['git config --unset-a remote.origin.push', 'git config --rename-sec hacks remote.origin'], PUSH_ILLISIBLE);
  passent(['git commit -m "$*"', 'git -C "${dir}" status', 'git config --show-origin core.hooksPath', 'env -u X pnpm test', 'set -euo pipefail; git status', 'echo "$@"']);
});

// ——— Le banc d'Iroki (#652), repris : chaque forme gardée, chaque divergence nommée avec sa décision ———

/** Chaque commande est refusée, quelle qu'en soit la raison (les raisons d'Iroki ne sont pas celles du plugin). */
function refuseesQuelleQueSoitLaRaison(commandes) {
  for (const c of commandes) assert.equal(decisionCommande(c, enBranche)?.decision, 'refuser', `devrait être refusée : ${c}`);
}

test('banc repris : --no-verify refusé derrière les options globales', () => {
  refuseesQuelleQueSoitLaRaison([
    "git -C . commit --no-verify -m x",
    "git --git-dir=.git push --no-verify origin feat/a",
    "git --git-dir .git push --no-verify origin feat/a",
    "git --work-tree=. commit --no-verify -m x",
    "git -c a=b commit -n -m x",
    "git -C /tmp/w -c a=b merge --no-verify feat/a",
    "git --no-pager -c a=b rebase --no-veri main",
    "git -p --bare am --no-verify x.patch",
    "git --namespace=n --exec-path=/x commit --NO-VERIFY -m x",
    "git --attr-source HEAD commit --no-verify -m x",
    "git --foo=bar commit -nm x",
    "/usr/bin/git -C \"$(pwd)\" commit --no-verify -m x",
    "git -c user.name='a b' commit --no-verify -m x",
  ]);
});

test('banc repris : push sur develop ou main, rebase ou reset --hard d’une branche partagée, derrière les options globales', () => {
  refuseesQuelleQueSoitLaRaison([
    "git -C . push origin develop",
    "git -c a=b push origin HEAD:main",
    "git --no-pager rebase origin/develop",
    "git -C /tmp/w reset --hard origin/sujet/x",
  ]);
  passent(['git reset --hard origin/feat/x', 'git rebase origin/feat/y']);
});

test('banc repris : core.hooksPath refusé par -c, par l’environnement ou par git config', () => {
  refuseesQuelleQueSoitLaRaison([
    "git -c core.hooksPath=/dev/null commit -m x",
    "git -c core.hookspath=/dev/null push origin feat/a",
    "git -c \"core.hooksPath=/dev/null\" commit -m x",
    "git -c \"core.hooksPath=/a b\" commit -m x",
    "git -C . -c core.hooksPath=/dev/null merge feat/a",
    "git -c a=b -c core.hooksPath=/x rebase main",
    "git -c core.hooksPath=/x am x.patch",
    "git -c core.hooksPath=/x cherry-pick abc",
    "git -c core.hooksPath=/x revert abc",
    "git -c core.hooksPath=/x pull origin develop",
    "git -c core.hooksPath=/x checkout feat/a",
    "git -C . -c core.hooksPath=/x switch --detach origin/develop",
    "git --config-env=core.hooksPath=HP commit -m x",
    "GIT_CONFIG_PARAMETERS=\"'core.hooksPath=/dev/null'\" git commit -m x",
    "GIT_CONFIG_PARAMETERS=\"'core.hooksPath=/dev/null'\" git push origin feat/a",
    "export GIT_CONFIG_PARAMETERS=\"'core.hooksPath=/dev/null'\"; git commit -m x",
    "GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null git commit -m x",
    "env GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hookspath GIT_CONFIG_VALUE_0=/x git push origin feat/a",
    "git config core.hooksPath /tmp",
    "git config --local core.hooksPath /tmp",
    "git config --global core.hooksPath /tmp",
    "git config \"core.hooksPath\" /tmp",
    "git -C . config core.hooksPath /tmp",
    "git config set core.hooksPath /tmp",
    "git config --add core.hooksPath /tmp",
  ]);
});

test('banc repris : ce qui parle de core.hooksPath sans le poser passe', () => {
  passent([
    "git config --get core.hooksPath",
    "git config get core.hooksPath",
    "git commit -m \"refuse git -c core.hooksPath=/x commit\"",
    "git commit -m \"GIT_CONFIG_PARAMETERS et git config core.hooksPath /tmp\"",
    "git config user.name x",
    "GIT_CONFIG_NOSYSTEM=1 git commit -m x",
  ]);
  // Divergences (ticket 34, décisions 2 ; A-37) : retirer la clé rend .git/hooks sans husky ; -c core.hooksPath
  // n'a aucun usage légitime, quelle que soit la sous-commande ; GIT_CONFIG_COUNT n'a jamais à être tapé par une session.
  refuseesQuelleQueSoitLaRaison([
    "git config --unset core.hooksPath",
    "git -c core.hooksPath=/x status",
    "git -c core.hooksPath=/x log",
    "GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=gc.autoDetach GIT_CONFIG_VALUE_0=false git commit -m x",
  ]);
});

test('banc repris : les commandes ordinaires de la chaîne passent toujours', () => {
  passent([
    "git -C /tmp/worktree status",
    "git -C /tmp/worktree log --oneline -5",
    "git -C /tmp/worktree diff origin/develop...HEAD --stat",
    "git -C /tmp/worktree rev-parse --abbrev-ref HEAD",
    "git -C \"$w\" reflog --format=%gs",
    "git -c color.ui=false log",
    "git -c core.quotepath=false diff",
    "git -c core.quotePath=false ls-tree -r --full-tree origin/develop",
    "git -c core.quotePath=false ls-files -s",
    "git -C . commit -m x",
    "git -C . commit -am x",
    "git --no-pager log",
    "git --no-pager diff --stat",
    "bash scripts/chaine/sujet.sh demarrer SPEC_ALL_DEMO-1.01",
    "bash scripts/chaine/sujet.sh rafraichir demo",
    "bash scripts/chaine/passer.sh 12",
    "git push -u origin feat/spec-all-demo-1-01-x",
    "git merge --no-ff origin/develop",
    "git merge -q --no-edit origin/develop",
    "git fetch --prune origin develop",
    "git fetch -q --prune origin develop",
    "git fetch origin sujet/demo",
    "git fetch",
    "git switch --detach origin/develop",
    "git status",
    "git log --first-parent origin/develop -n 30 --format=%s",
    "git diff --name-only --diff-filter=U",
    "git -C /tmp/worktree log -1",
    "git -C /tmp/worktree diff",
    "git -C /tmp/worktree fetch origin develop",
    "git -C /tmp/worktree switch --detach origin/develop",
    "git ls-remote --heads origin feat/x",
    "git merge-base --is-ancestor origin/develop HEAD",
    "git merge --abort",
    "git checkout --theirs -- docs/x.md",
    "git cherry-pick --no-merges origin/develop..HEAD",
    "git branch --show-current",
    "git commit -q --no-edit",
    "git add -A -- docs",
    "git config user.name x",
    "git -c user.name=x -c user.email=y commit -m x",
  ]);
});

test('banc repris : git config, seule une action de lecture placée avant la clé exempte ; guillemets et barres obliques lus', () => {
  refuseesQuelleQueSoitLaRaison([
    "git config core.hooksPath list",
    "git config core.hooksPath get",
    "git config core.hooksPath unset",
    "git config core.hooksPath /z --show-origin",
    "git config core.hooksPath /w -l",
    "git config core.hooksPath /w --get",
    "git config --show-origin core.hooksPath /w",
    "git config core.hooksPath ''",
    "git -c core.\"hooksPath\"=/tmp/h commit -m x",
    "git -c 'core.hooks'Path=/x commit -m x",
    "git -c core.hooks\\Path=/x commit -m x",
    "git -c \"core.hooks\\Path=/x\" commit -m x",
    "git config core.\"hooksPath\" /x",
    "git config core.hooks\\Path /x",
    "GIT_CONFIG_PARAMETERS=\"'core.hooks'\\''Path=/x'\" git commit -m x",
  ]);
  passent([
    "git config --get core.hooksPath",
    "git config --list",
    "git config -l",
    "git config --show-origin --get core.hooksPath",
    "git config --global --get core.hooksPath",
    "git config get core.hooksPath",
    "git config core.hooksPath",
    "git config --global core.hooksPath",
    "git commit -m \"x\" -m\"y\"",
    "git -c core.pager=cat commit -m \"core.hooksPath\"",
  ]);
  // Divergences : `git config --unset core.hooksPath` est refusé (ticket 34) ; `GIT_CONFIG_KEY_0=…` sans
  // `GIT_CONFIG_COUNT` est inerte (git ne lit les clés qu'avec le compte), il passe.
  refuseesQuelleQueSoitLaRaison(['git config --unset core.hooksPath']);
  passent([
    "GIT_CONFIG_KEY_0=core.hooks\"Path\" git commit -m x",
    "GIT_CONFIG_KEY_0='core.hooksPath' git commit -m x",
  ]);
});

test('banc repris : une valeur non citée à blancs de -C ou -c ne cache plus la sous-commande', () => {
  refuseesQuelleQueSoitLaRaison([
    "git -C $(git rev-parse --show-toplevel) commit --no-verify -m x",
    "git -c a=$(echo 1) commit -n -m x",
    "git -C `dirname $PWD/x` push --no-verify origin feat/a",
    "git -C /tmp/mon\\ dossier commit --no-verify -m x",
    "git -C $(git rev-parse --show-toplevel) -c core.hooksPath=/dev/null commit -m x",
    "git -C $(git rev-parse --show-toplevel) config core.hooksPath /tmp",
    "git -C $(cd a && git rev-parse $(pwd)) commit --no-verify -m x",
    "git -C $((1 + 2)) commit --no-verify -m x",
    "git -C ${x:-a b} commit --no-verify -m x",
    "git -C $(pwd) push origin develop",
    "git -C $(pwd) rebase origin/develop",
  ]);
  passent([
    "git -C \"$racine\" log",
    "git -C \"$racine\" diff \"$base...HEAD\" --stat -- docs",
    "git -C \"$w\" rev-parse --abbrev-ref HEAD",
    "git -C /tmp/mon\\ dossier status",
    "git -C <(echo a b) status",
    "git -C <(echo a b) log --oneline",
  ]);
  // Divergences (A-40, A-45) : une expansion non citée dans la valeur d'une option globale est refusée devant toute
  // sous-commande (elle peut y écrire `-c alias.…`) ; la forme citée passe.
  refusees([
    "git -C $(pwd) status",
    "git -C $(git rev-parse --show-toplevel) status",
    "git -C $(git rev-parse --show-toplevel) log --oneline -5",
    "git -C ${x:-a b} status",
    "git -C ${x:-a b} diff --stat",
    "git -C ${x:-a b} commit -m x",
    "git -C $(pwd) commit -m x",
    "git -C $(pwd) fetch origin develop",
  ], ARGUMENT);
  // Divergence : une substitution de processus rend un seul chemin, lu et sans effet sur les hooks : elle passe.
  passent([
    "git -C <(echo a b) commit -m x",
    "git -C <(echo a b) push origin feat/a",
  ]);
});

test('banc repris : git config --comment ne fait pas passer une écriture pour une lecture', () => {
  refuseesQuelleQueSoitLaRaison([
    "git config --comment get core.hooksPath /tmp/h",
    "git config --comment list core.hooksPath /tmp/h",
    "git config --comment=get core.hooksPath /tmp/h",
    "git config --inconnue get core.hooksPath /tmp/h",
    "git config --inconnue --get core.hooksPath /tmp/h",
    "git config -e get core.hooksPath /tmp/h",
  ]);
  passent([
    "git config --get core.hooksPath",
    "git config --global --get core.hooksPath",
    "git config --show-origin --get core.hooksPath",
    "git config --comment x --get core.hooksPath",
    "git config --file x.cfg get core.hooksPath",
    "git config get core.hooksPath",
  ]);
});

test('ticket 17 : contre-relecture de l’architecte — programme à expansion, env -S, accolades, alias, et variantes citées', () => {
  // B1 : un programme à expansion se lit comme git (A-45).
  refusees([
    "$(echo git) commit --no-verify -am x",
    "`echo git` commit --no-verify -am x",
    "\"$(command -v git)\" commit --no-verify -am x",
    "${G-git} commit --no-verify -am x",
    "${G:=git} commit --no-verify -am x",
    "${G:-git} -c core.hooksPath=/dev/null commit -am x",
    "G=gi; ${G}t commit -n -am x",
    "${G:-git} commit --no-verify -m x",
  ], HOOKS);
  refusees([
    "$(echo git) push origin HEAD:sujet/x",
    "$g push origin HEAD:sujet/x",
  ], PUSH_ILLISIBLE);
  // B2 : env -S et --split-string, accolades devant le programme, alias définis dans la commande.
  refusees([
    "env -S'GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=core.hooksPath GIT_CONFIG_VALUE_0=/dev/null' git commit -am x",
    "env --split-string='git -c core.hooksPath=/dev/null commit -am x'",
    "env GIT_CONFIG_{COUNT=1,KEY_0=core.hooksPath,VALUE_0=/dev/null} git commit -am x",
    "shopt -s expand_aliases; alias g='git commit --no-verify'; g -am x",
  ], HOOKS);
  refusees(['shopt -s expand_aliases; alias g=git; g push origin HEAD:sujet/y'], SUJET);
  // B3 : régression de la première livraison, des formes citées refusées sous « hooks git ».
  passent([
    "git -C \"$d\" commit -m \"fix: $x\"",
    "git -C \"$d\" add \"$f.md\"",
    "git -C \"$d\" checkout \"feat/$b\"",
    "git -C \"$d\" diff --stat \"origin/$base...HEAD\"",
    "git -C \"$(pwd)\" log \"$b..HEAD\"",
    "git -C \"$racine\" diff \"$base...HEAD\" --stat -- docs",
  ]);
  passent(['git -C "$X" push origin feat/x', '"$EDITOR" fichier.md', 'alias ll="ls -l"; ll', 'env -S "pnpm test"']);
});

test('ticket 17 : seconde contre-relecture (A-47) — un tableau ou hash -p en position de programme', () => {
  refuseesQuelleQueSoitLaRaison(["G=(git commit); \"${G[@]}\" --no-verify -am x", "G=(git commit); \"${G[@]}\" -n -am x", "G=(git commit); ${G[@]} --no-verify -am x", "G[0]=git; G[1]=commit; \"${G[@]}\" -n -am x", "G=(git); \"${G[@]}\" commit -n -am x", "G=(git commit -n); ${G[*]} -am x", "\"${H[@]}\" commit -am x", "hash -p /usr/bin/git g; g commit -n -am x"]);
  refusees(['G=(git push -q); "${G[@]}" origin HEAD:sujet/z'], SUJET);
  passent(["G=(git status); \"${G[@]}\"", "a=(pnpm test); \"${a[@]}\"", "hash -r", "G=(git commit); \"${G[@]}\" -m \"fix -n\"", "G=(git commit); \"${G[@]}\" -m \"$msg\""]);
});

test('ticket 17 : troisième contre-relecture (A-49) — tableau modifié, opérateur d’expansion ou paramètres positionnels en programme', () => {
  refuseesQuelleQueSoitLaRaison(["G=(git); G+=(commit); \"${G[@]}\" -n -am x", "G=(git status); G[1]=commit; \"${G[@]}\" -n -am x", "G=(git commit x); \"${G[@]:0:2}\" -n -am x", "G=(git commit x); \"${G[@]:1}\" -n -am x", "G=(git commit); \"${G[@]/#/}\" -n -am x", "G=(gxt commit); \"${G[@]/x/i}\" -n -am x", "set -- git commit; \"$@\" -n -am x"]);
  refusees(['set -- git push -q; "$@" origin HEAD:sujet/w'], HOOKS);
  // Un tableau à définition unique et simple, en expansion nue, se relit aussi en argument.
  passent(["args=(-m \"msg\"); git commit \"${args[@]}\"", "args=(-m \"fix -n\"); git commit \"${args[@]}\"", "f=x.md; git add \"$f\"", "G=(git status); \"${G[@]}\""]);
  refusees(['args=(-n -m x); git commit "${args[@]}"'], HOOKS);
});

test('ticket 17 : quatrième contre-relecture (A-50) — un motif non cité dans le programme', () => {
  refusees(["/usr/bin/g[i]t commit -n -am x", "/usr/bin/gi[t] commit --no-verify -am x", "G=/usr/bin/g[i]t; $G -c core.hooksPath=/dev/null commit -am x", "G=/usr/bin/g[i]t; $G push origin HEAD:sujet/v", "sudo /usr/bin/g?t commit -am x"], HOOKS);
  passent(['G="/usr/bin/git"; "$G" status', 'git commit -m x -- src/*.ts']);
});

// ——— Ticket 18 : git commit --amend ————————————————————————————————————————————————————————————————
const AMEND = /--amend/;
const T18_AMEND = [
  'git commit --amend -m x',
  'git commit --amend --no-edit',
  'git commit -a --amend',
  'git commit --am -m x',
  'git commit --ame -m x',
  'git commit --amen -m x',
  'git commit --AMEND',
  'git commit -m x --amend',
  'git commit -m x --amen',
  'git -C . commit --amend',
  'git -C . commit --am',
  'git -c user.name=x commit --amend',
  'git -c user.name=x commit --amen',
  'git --git-dir=.git commit --amend',
  'git --git-dir .git commit --am',
  '/usr/bin/git commit --amend',
  'sudo git commit --amend',
  'git $(echo commit) --amend',
  'sh -c "git commit --amend"',
  'git add -A && git commit --amend --no-edit',
  'git-commit --amend',
];
/** Chaque blanc hors citation simple devient une ligne continuée : bash recolle `\<retour>`, la garde aussi. */
const continuee = (c) => c.replace(/ /g, ' \\\n  ');
test('ticket 18 : git commit --amend est refusé, sous ses abréviations et derrière toute option globale', () => {
  refusees(T18_AMEND, AMEND);
  refusees(T18_AMEND.map(continuee), AMEND);
  for (const c of T18_AMEND) assert.equal(amendeUnCommit(c), true, c);
});

test('ticket 18 : un message qui cite --amend passe, comme --fixup=amend', () => {
  const passe = [
    'git commit -m "--amend"',
    'git commit -m "fix --amend"',
    "git commit -m 'refuse --amend et --am'",
    'git commit -m --amend',
    'git commit --message=--amend',
    'git commit -F msg.txt',
    'git commit --fixup=amend:HEAD~1',
    'git commit --fixup amend:HEAD~1',
    'git log --grep=--amend',
    'git commit --allow-empty -m x',
    'git commit -m x -- --amend',
  ];
  passent(passe);
  passent(passe.map(continuee));
  for (const c of passe) assert.equal(amendeUnCommit(c), false, c);
});
