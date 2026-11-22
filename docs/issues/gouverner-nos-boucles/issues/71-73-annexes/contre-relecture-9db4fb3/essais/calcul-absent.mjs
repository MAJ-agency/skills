// Un calcul absent à côté de revue-exigee.mjs, l'un après l'autre (double-relecture.mjs, meme-contenu.sh) : la sortie de la CLI.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
const racine = process.argv[2];
const { depotJouet, script, GRAMMAIRE } = await import(pathToFileURL(join(racine, 'skills/chaine/sujet/scripts/depot-jouet.mjs')).href);
const { ecrireDistribution } = await import(pathToFileURL(script('fusionner', 'decision-relecteur.mjs')).href);
const { ecrireVerdict } = await import(pathToFileURL(script('fusionner', 'verdict.mjs')).href);
const CALCULS = ['revue-exigee.mjs', 'decision-relecteur.mjs', 'verdict.mjs', 'double-relecture.mjs', 'meme-contenu.sh'];
for (const absent of [null, 'double-relecture.mjs', 'meme-contenu.sh']) {
  const d = depotJouet();
  d.ecrire('.claude/chaine.json', JSON.stringify({ cheminsSensibles: [], relecture: { depuis: '2026-11-17T09:00:00Z' } }) + '\n');
  d.commit('chore: contrat');
  d.git('push', '-q', 'origin', 'HEAD:develop');
  d.git('fetch', '-q', 'origin');
  const v1 = d.branche('feat/a', 'origin/develop', { 'docs/a.md': 'a\n' });
  const tete = d.branche('feat/a', 'feat/a', { 'docs/a2.md': 'a2\n' });
  const plat = join(d.racine, 'projet', 'scripts', 'chaine');
  mkdirSync(plat, { recursive: true });
  mkdirSync(join(d.racine, 'projet', 'scripts', 'docs'));
  writeFileSync(join(d.racine, 'projet', 'scripts', 'docs', 'identifiants.mjs'), readFileSync(GRAMMAIRE, 'utf8'));
  for (const c of CALCULS) if (c !== absent) writeFileSync(join(plat, c), readFileSync(script('fusionner', c), 'utf8'));
  // Un tour validé sur un sommet plus ancien (v1) : « même contenu propre » se joue (meme-contenu.sh).
  const fil = join(d.racine, 'fil.json');
  const corps = [ecrireDistribution({ tour: 1, sommet: v1, sessions: ['session_rel1'] }), `${ecrireVerdict({ sommet: v1, tour: 1, verdict: 'validé', bloquants: 0, session: 'session_rel1', securite: null })}\n\n- constats`];
  writeFileSync(fil, JSON.stringify(corps.map((body, i) => ({ id: i + 1, body, created_at: '2026-11-17T11:0' + i + ':00Z', updated_at: '2026-11-17T11:0' + i + ':00Z', author_association: 'OWNER', user: { login: 'x' } }))));
  const r = spawnSync(process.execPath, [join(plat, 'revue-exigee.mjs'), '', 'docs(a): a', 'origin/develop', '--ouverte', '2026-11-17T11:00:00Z', '--tete', tete, '--branche', 'feat/a', '--commentaires', fil], { cwd: d.travail, env: d.env, input: 'docs/a.md\ndocs/a2.md\n', encoding: 'utf8' });
  console.log(`${absent} absent : sortie ${r.status} : ${r.stdout.trim().split('\n').at(-1)}`);
}
