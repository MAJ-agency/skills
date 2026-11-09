import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ajouteUneDependance, decisionCommande, identifiantDeBranche, lireDependances, paquetsAjoutes, pousseSurUnSujet, refusEdition, sansTexte, lintable } from './regles.mjs';

const livree = { migrationExistante: () => true, migrations: 'apps/api/src/db/migrations/' };
const nouvelle = { migrationExistante: () => false, migrations: 'apps/api/src/db/migrations/' };

test('refusEdition refuse une migration déjà livrée et laisse écrire une nouvelle', () => {
  const m = 'apps/api/src/db/migrations/202611041200-care-plan.ts';
  assert.match(refusEdition(m, livree), /ne se modifie jamais/);
  assert.equal(refusEdition(m, nouvelle), null);
  assert.match(refusEdition('apps/api/prisma/migrations/2026_x/migration.sql', { ...livree, migrations: 'apps/api/prisma/migrations' }), /ne se modifie jamais/);
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
  assert.equal(decisionCommande('git push -u origin feat/soc-1-03-x'), null);
  assert.equal(decisionCommande('npm install').decision, 'refuser');
});

test('une dépendance nouvelle demande, une réinstallation ne demande pas', () => {
  assert.equal(decisionCommande('pnpm add zod').decision, 'demander');
  assert.equal(decisionCommande('pnpm --filter @x/api add -D vitest').decision, 'demander');
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

test('un paquet prévu et un non prévu, un alias ou une option de source : la commande entière demande', () => {
  const ctx = prevus(['leaflet']);
  assert.equal(decisionCommande('pnpm add leaflet zod', ctx).decision, 'demander');
  assert.equal(decisionCommande('pnpm add leaflet && pnpm add zod', ctx).decision, 'demander');
  assert.equal(decisionCommande('pnpm add leaflet@npm:autre', ctx).decision, 'demander');
  for (const option of ['--registry=https://x.example', '--registry https://x.example', '--config.registry=x', '-g'])
    assert.equal(decisionCommande(`pnpm add leaflet ${option}`, ctx).decision, 'demander', option);
  for (const commande of ['pnpm -C /tmp/x add leaflet', 'pnpm --dir=/tmp/x add leaflet', 'npm_config_registry=https://x.example pnpm add leaflet', 'NPM_CONFIG_REGISTRY=x pnpm add leaflet', 'env pnpm add leaflet'])
    assert.equal(decisionCommande(commande, ctx).decision, 'demander', commande);
  assert.equal(decisionCommande('pnpm add -E --filter=@x/web leaflet', ctx), null);
});

test('ticket introuvable (contexte null ou vide) : demander ; les refus restent', () => {
  assert.equal(decisionCommande('pnpm add leaflet', prevus(null)).decision, 'demander');
  assert.equal(decisionCommande('pnpm add leaflet', prevus([])).decision, 'demander');
  assert.equal(decisionCommande('pnpm add leaflet').decision, 'demander');
  assert.equal(decisionCommande('npm install leaflet', prevus(['leaflet'])).decision, 'refuser');
  assert.equal(decisionCommande('yarn add leaflet', prevus(['leaflet'])).decision, 'refuser');
  let lu = false;
  decisionCommande('pnpm install --frozen-lockfile', { dependancesPrevues: () => (lu = true) });
  assert.equal(lu, false, 'le ticket ne se lit que si la commande ajoute un paquet');
});

test('depuis une branche de ticket, un push vers un sujet est refusé', () => {
  const ticket = { brancheCourante: () => 'feat/soc-1-04-hook' };
  for (const commande of ['git push origin HEAD:sujet/demo', 'git push origin HEAD:refs/heads/sujet/demo', 'git push -u origin sujet/demo', 'git push origin feat/soc-1-04-hook HEAD:sujet/demo'])
    assert.equal(decisionCommande(commande, ticket)?.decision, 'refuser', commande);
  assert.equal(decisionCommande('git push -u origin feat/soc-1-04-hook', ticket), null);
  assert.equal(decisionCommande('git push origin HEAD:sujet/demo'), null, 'branche inconnue');
  assert.equal(decisionCommande('git push origin sujet/demo', { brancheCourante: () => 'sujet/demo' }), null, 'architecte ou capitaine sur le sujet : rien ne change');
  assert.equal(pousseSurUnSujet('git commit -m x && git push origin HEAD:sujet/x'), true);
  assert.equal(pousseSurUnSujet('git push origin feat/sujet-x'), false);
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

test('identifiantDeBranche : branche de ticket → identifiant, sinon null', () => {
  assert.equal(identifiantDeBranche('feat/soc-1-04-hook'), 'SOC-1.04');
  assert.equal(identifiantDeBranche('fix/all-fof-12-03-x'), 'ALL-FOF-12.03');
  assert.equal(identifiantDeBranche('feat/geo-1-04'), 'GEO-1.04');
  assert.equal(identifiantDeBranche('sujet/fiabilite-de-la-chaine'), null);
  assert.equal(identifiantDeBranche('docs/relecture'), null);
  assert.equal(identifiantDeBranche('HEAD'), null);
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

test('lintable : le code TypeScript et les scripts, jamais les sorties de build ni node_modules', () => {
  for (const f of ['apps/api/src/a.ts', 'apps/web/src/b.tsx', 'scripts/verify/c.mjs', 'd.js']) assert.equal(lintable(f), true, f);
  for (const f of ['README.md', 'package.json', 'apps/web/.next/x.js', 'node_modules/x/y.ts', 'apps/api/dist/main.js', 'coverage/lcov.ts']) assert.equal(lintable(f), false, f);
});
