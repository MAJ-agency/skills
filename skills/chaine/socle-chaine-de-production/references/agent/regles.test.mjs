import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ajouteUneDependance, decisionCommande, refusEdition, sansTexte } from './regles.mjs';

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
