// Les variantes du ticket 90 : `regles.test.mjs` posé avec `regles.mjs` sous `scripts/agent/` d'un dossier neuf, le
// contrat du gabarit et `index-generes.json` du gabarit, en quatre variantes, joué tel qu'il est dans un commit donné.
// Depuis la racine d'un clone du plugin : `node essai-variantes.mjs <commit>…` (par exemple `ddb4265 HEAD`).
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const A = 'skills/chaine/socle-chaine-de-production/references';
const montrer = (commit, chemin) => execFileSync('git', ['show', `${commit}:${chemin}`], { encoding: 'utf8' });
const VARIANTES = [
  ['régime 8 (gabarit)', (c) => c, (i) => i],
  ['régime 7 (gabarit sans relecture)', (c) => (delete c.relecture, c), (i) => i],
  ['régime 8, apps/api/** ajouté aux chemins sensibles', (c) => (c.cheminsSensibles.push('apps/api/**'), c), (i) => i],
  ['régime 8, un index docs/* ajouté', (c) => c, (i) => (i.index.push({ chemin: 'docs/*', commande: 'node scripts/docs/x.mjs' }), i)],
];
for (const commit of process.argv.slice(2)) {
  for (const [nom, contrat, index] of VARIANTES) {
    const d = mkdtempSync(join(tmpdir(), 'variante-'));
    try {
      mkdirSync(join(d, 'scripts/agent'), { recursive: true });
      mkdirSync(join(d, 'scripts/docs'), { recursive: true });
      mkdirSync(join(d, '.claude'));
      for (const f of ['regles.mjs', 'regles.test.mjs', 'demarrage.mjs', 'entree.mjs']) writeFileSync(join(d, 'scripts/agent', f), montrer(commit, `${A}/agent/${f}`));
      const c = JSON.parse(montrer(commit, `${A}/chaine.json`));
      if (c.relecture) c.relecture.depuis = '2026-11-22T00:00:00Z';
      writeFileSync(join(d, '.claude/chaine.json'), JSON.stringify(contrat(c), null, 2));
      writeFileSync(join(d, 'scripts/docs/index-generes.json'), JSON.stringify(index(JSON.parse(montrer(commit, `${A}/index-generes.json`))), null, 2));
      const r = spawnSync(process.execPath, ['--test', '--test-reporter=tap', 'scripts/agent/regles.test.mjs'], { cwd: d, encoding: 'utf8', env: { ...process.env, NODE_TEST_CONTEXT: undefined } });
      const n = (k) => (r.stdout.match(new RegExp(`^# ${k} (\\d+)$`, 'm')) ?? [])[1];
      const ko = [...r.stdout.matchAll(/^not ok \d+ - (.*)$/gm)].map((m) => `  not ok — ${m[1]}`);
      console.log(`${commit} — ${nom} : ${n('pass')} verts sur ${n('tests')}, ${n('fail')} rouges${ko.length ? `\n${ko.join('\n')}` : ''}`);
    } finally {
      rmSync(d, { recursive: true, force: true });
    }
  }
}
