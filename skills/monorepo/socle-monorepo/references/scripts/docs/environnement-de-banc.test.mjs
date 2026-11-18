import assert from 'node:assert/strict';
import { test } from 'node:test';
import { environnementDeBanc } from './environnement-de-banc.mjs';

test('environnementDeBanc : retire GIT_*, FORCE_COLOR, NODE_TEST_CONTEXT et les variables de la chaîne, pose NO_COLOR=1, garde le reste et ne modifie pas sa base', () => {
  const base = {
    GIT_DIR: '/vrai/.git',
    GIT_AUTHOR_NAME: 'moi',
    FORCE_COLOR: '1',
    NO_COLOR: '',
    NODE_TEST_CONTEXT: 'child-v8',
    PASSER_OUTILS: '/outils',
    BOUCLE_COPIE: '/copie',
    PRE_PUSH_REFS: 'refs/heads/x',
    REVUE_DIR: '/revue',
    PATH: '/usr/bin',
    MON_GIT_X: 'garde',
  };
  const copie = { ...base };
  const env = environnementDeBanc(base);
  assert.deepEqual(env, { NO_COLOR: '1', PATH: '/usr/bin', MON_GIT_X: 'garde' });
  assert.deepEqual(base, copie);
});

test('environnementDeBanc : sans argument, part de process.env', () => {
  assert.equal(environnementDeBanc().NO_COLOR, '1');
  assert.equal('FORCE_COLOR' in environnementDeBanc(), false);
});
