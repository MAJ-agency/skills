import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ajouteUneDependance, decisionCommande, lireDependances, paquetsAjoutes, pousseSurUnSujet, refusEdition, sansTexte, lintable } from './regles.mjs';

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

test('decisionCommande refuse le push forcé, --no-verify, le push direct sur develop/main, le rebase d’un sujet', () => {
  assert.equal(decisionCommande('git push --force origin feat/x').decision, 'refuser');
  assert.equal(decisionCommande('git push --force-with-lease origin feat/x'), null);
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
    for (const ligne of ['claude plugin marketplace add MAJ-agency/skills', 'claude plugin install maj-skills@maj', 'claude plugin marketplace update maj', 'claude plugin update maj-skills@maj', '§ 5, étape 5', 's’arrêter']) {
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
