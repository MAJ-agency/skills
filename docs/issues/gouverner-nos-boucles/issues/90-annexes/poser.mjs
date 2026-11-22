// Pose, dans un dossier neuf, les scripts et bancs que les skills posent dans un projet (selon leurs SKILL.md),
// puis le contrat du gabarit au régime voulu. Usage : node poser.mjs <plugin> <dest> <8|7|aucun> [--develop-test]
import { chmodSync, copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
const [plugin, dest, regime, ...opts] = process.argv.slice(2);
const SOC = 'skills/chaine/socle-chaine-de-production/references';
const dossiers = [
  ['skills/monorepo/socle-monorepo/references/scripts/docs', 'scripts/docs'],
  ['skills/monorepo/socle-monorepo/references/scripts/verify', 'scripts/verify'],
  ['skills/chaine/tickets/references/scripts/docs', 'scripts/docs'],
  ['skills/chaine/tickets/references/scripts/verify', 'scripts/verify'],
  ['skills/chaine/fusionner/scripts', 'scripts/chaine'],
  ['skills/chaine/sujet/scripts', 'scripts/chaine'],
  ['skills/chaine/revue-adversariale/scripts', 'scripts/chaine'],
  ['skills/chaine/revue-de-ticket/scripts', 'scripts/chaine'],
  [`${SOC}/agent`, 'scripts/agent'],
  ['skills/monorepo/socle-tests/references/scripts/verify', 'scripts/verify'],
];
const fichiers = [
  [`${SOC}/scripts/verify/settings-json.mjs`, 'scripts/verify/settings-json.mjs'],
  [`${SOC}/scripts/verify/settings-json-regles.mjs`, 'scripts/verify/settings-json-regles.mjs'],
  [`${SOC}/scripts/verify/settings-json.test.mjs`, 'scripts/verify/settings-json.test.mjs'],
  [`${SOC}/scripts/github/pr-titre.mjs`, 'scripts/github/pr-titre.mjs'],
  [`${SOC}/scripts/github/pr-titre.test.mjs`, 'scripts/github/pr-titre.test.mjs'],
  [`${SOC}/scripts/github/develop.sh`, 'scripts/github/develop.sh'],
  [`${SOC}/labels.sh`, 'scripts/github/labels.sh'],
  [`${SOC}/index-generes.json`, 'scripts/docs/index-generes.json'],
  ['skills/monorepo/socle-monorepo/references/racine/commitlint.config.mjs', 'commitlint.config.mjs'],
  ['skills/monorepo/socle-monorepo/references/husky/pre-push', '.husky/pre-push'],
];
if (opts.includes('--develop-test')) fichiers.push([`${SOC}/scripts/github/develop.test.mjs`, 'scripts/github/develop.test.mjs']);
const poser = (s, d) => {
  mkdirSync(join(dest, d, '..'), { recursive: true });
  copyFileSync(join(plugin, s), join(dest, d));
  if (/\.sh$|pre-(commit|push)$/.test(d)) chmodSync(join(dest, d), 0o755);
};
for (const [s, d] of dossiers) for (const n of readdirSync(join(plugin, s))) if (statSync(join(plugin, s, n)).isFile()) poser(`${s}/${n}`, `${d}/${n}`);
for (const [s, d] of fichiers) poser(s, d);
if (regime !== 'aucun') {
  const c = JSON.parse(readFileSync(join(plugin, `${SOC}/chaine.json`), 'utf8'));
  if (regime === '7') delete c.relecture; else c.relecture.depuis = '2026-11-22T00:00:00Z';
  mkdirSync(join(dest, '.claude'), { recursive: true });
  writeFileSync(join(dest, '.claude/chaine.json'), `${JSON.stringify(c, null, 2)}\n`);
}
writeFileSync(join(dest, 'package.json'), '{"name":"jouet","private":true,"type":"module"}\n');
const g = (...a) => execFileSync('git', a, { cwd: dest, stdio: 'ignore' });
g('init', '-q', '-b', 'main'); g('add', '-A'); g('-c', 'user.email=t@t', '-c', 'user.name=t', 'commit', '-q', '--no-verify', '-m', 'chore: pose');
