// Joue chaque banc posé d'un dépôt jouet, fichier par fichier, N à la fois ; écrit une ligne par fichier.
import { spawn } from 'node:child_process';
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const [racine, n = '3', ...filtre] = process.argv.slice(2);
const bancs = ['scripts/docs', 'scripts/verify', 'scripts/agent', 'scripts/chaine', 'scripts/github']
  .filter((d) => existsSync(join(racine, d)))
  .flatMap((d) => readdirSync(join(racine, d)).filter((f) => f.endsWith('.test.mjs')).sort().map((f) => `${d}/${f}`))
  .filter((b) => !filtre.length || filtre.some((f) => b.includes(f)));
let i = 0;
const un = () => new Promise((fin) => {
  const b = bancs[i++]; if (!b) return fin(false);
  const t0 = Date.now(); let out = '';
  const p = spawn(process.execPath, ['--test', '--test-reporter=tap', b], { cwd: racine, env: { ...process.env, NODE_TEST_CONTEXT: undefined } });
  p.stdout.on('data', (d) => (out += d)); p.stderr.on('data', (d) => (out += d));
  const tue = setTimeout(() => p.kill('SIGKILL'), 1_200_000);
  p.on('close', (code) => {
    clearTimeout(tue);
    const v = (k) => (out.match(new RegExp(`^# ${k} (\\d+)`, 'm')) ?? [])[1];
    const ko = [...out.matchAll(/^not ok \d+ - (.*)$/gm)].map((m) => m[1].slice(0, 90));
    const err = (out.match(/ERR_\w+|Error: [^\n]{0,80}/) ?? [''])[0];
    console.log(`${code === 0 ? 'VERT ' : 'ROUGE'} ${b} tests=${v('tests')} pass=${v('pass')} fail=${v('fail')} skip=${v('skipped')} ${Math.round((Date.now() - t0) / 1000)}s${ko.length ? ` — ${ko.join(' | ')}` : ''}${code !== 0 && !ko.length ? ` — ${err}` : ''}`);
    fin(true);
  });
});
await Promise.all(Array.from({ length: Number(n) }, async () => { while (await un()); }));
